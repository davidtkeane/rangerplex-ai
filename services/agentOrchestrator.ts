
import { GoogleGenAI } from "@google/genai";
import { Message, Sender, Attachment, DocumentChunk, AgentConfig } from "../types";
import { v4 as uuidv4 } from 'uuid';

const getClient = (apiKey?: string) => {
    if (!apiKey) throw new Error("Gemini API Key is missing.");
    return new GoogleGenAI({ apiKey: apiKey });
};

export const runMultiAgentCouncil = async (
    userPrompt: string,
    attachments: Attachment[],
    history: Message[],
    contextChunks: DocumentChunk[],
    apiKey: string,
    agents: AgentConfig[], // Agents passed from settings
    onMessageAdded: (msg: Message) => void,
    onMessageUpdate: (id: string, text: string) => void
) => {
    try {
        const ai = getClient(apiKey);
        
        let contextPrompt = "";
        if (contextChunks.length > 0) {
            contextPrompt = "\n\n[SHARED DOCUMENT CONTEXT]:\n";
            contextChunks.forEach((c) => contextPrompt += `- ${c.text}\n`);
        }

        const prevResponses: Record<string, string> = {};

        // Sequentially run agents
        for (const agent of agents) {
            const agentId = uuidv4();
            
            onMessageAdded({
                id: agentId,
                sender: Sender.AI,
                agentName: agent.name,
                agentColor: agent.color,
                text: '',
                timestamp: Date.now(),
                isThinking: true
            });

            // Construct dynamic prompt based on previous agents
            let prompt = `User Query: ${userPrompt}\n${contextPrompt}\n`;
            
            const prevAgentNames = Object.keys(prevResponses);
            if (prevAgentNames.length > 0) {
                prompt += `\nPREVIOUS AGENT FINDINGS:\n`;
                prevAgentNames.forEach(name => {
                    prompt += `--- ${name} SAID ---\n${prevResponses[name]}\n`;
                });
                prompt += `\nBased on the user query and the previous agents' inputs, perform your role: ${agent.role}.`;
            } else {
                prompt += `\nPerform your role: ${agent.role}. Provide your initial findings.`;
            }

            // Use the agent's specific model or fallback to gemini-2.5-flash
            // Note: Multi-agent currently hardwired to Gemini for simplicity of orchestration, 
            // but could be expanded to generic ModelType calls.
            // For stability, we check if the agent model is a valid Gemini string, otherwise default.
            let modelToUse = agent.model.includes('gemini') ? agent.model : 'gemini-2.5-flash';

            const response = await generateAgentResponse(
                ai, 
                modelToUse, 
                agent, 
                prompt, 
                history
            );

            prevResponses[agent.name] = response;
            onMessageUpdate(agentId, response);
        }

    } catch (e) {
        console.error("Council Error", e);
        throw new Error(`Council Agent Error: ${e instanceof Error ? e.message : 'Unknown'}`);
    }
};

async function generateAgentResponse(
    ai: any, 
    modelName: string, 
    agent: AgentConfig, 
    prompt: string,
    history: Message[]
): Promise<string> {
    try {
        const chatHistory = history.map(msg => ({
            role: msg.sender === Sender.USER ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const chat = ai.chats.create({
            model: modelName,
            config: {
                systemInstruction: agent.systemInstruction,
                temperature: agent.temperature
            },
            history: chatHistory
        });

        const response = await chat.sendMessage({
            message: prompt
        });

        return response.text || "";
    } catch (e) {
        console.error(`Agent ${agent.name} failed:`, e);
        return `[${agent.name} encountered an error: ${e instanceof Error ? e.message : 'Unknown'}]`;
    }
}

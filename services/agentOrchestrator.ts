
import { GoogleGenAI } from "@google/genai";
import { Message, Sender, Attachment, DocumentChunk, AgentConfig, GroundingSource } from "../types";
import { v4 as uuidv4 } from 'uuid';

// Re-export for convenience
export type { GroundingSource };

// 🎯 Agent Response with Sources
interface AgentResponse {
    text: string;
    sources?: GroundingSource[];
}

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
    onMessageUpdate: (id: string, text: string, sources?: GroundingSource[]) => void
) => {
    try {
        const ai = getClient(apiKey);

        let contextPrompt = "";
        if (contextChunks.length > 0) {
            contextPrompt = "\n\n[SHARED DOCUMENT CONTEXT]:\n";
            contextChunks.forEach((c) => contextPrompt += `- ${c.text}\n`);
        }

        const prevResponses: Record<string, AgentResponse> = {};
        const allSources: GroundingSource[] = []; // 📚 Collect all citations

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
                    prompt += `--- ${name} SAID ---\n${prevResponses[name].text}\n`;
                    if (prevResponses[name].sources && prevResponses[name].sources!.length > 0) {
                        prompt += `SOURCES:\n`;
                        prevResponses[name].sources!.forEach(s => {
                            prompt += `- ${s.title}: ${s.uri}\n`;
                        });
                    }
                });
                prompt += `\nBased on the user query and previous agents' inputs, perform your role: ${agent.role}.`;
            } else {
                prompt += `\nPerform your role: ${agent.role}. Provide your initial findings.`;
            }

            // Add grounding instruction if enabled
            if (agent.enableGrounding) {
                prompt += `\n\n🌐 IMPORTANT: Use Google Search to verify facts and find authoritative sources. Cite all sources inline.`;
            }

            // Use the agent's specific model or fallback to gemini-3-flash
            let modelToUse = agent.model.includes('gemini') ? agent.model : 'gemini-3-flash';

            const response = await generateAgentResponse(
                ai,
                modelToUse,
                agent,
                prompt,
                history,
                agent.enableGrounding || false
            );

            prevResponses[agent.name] = response;

            // Collect sources
            if (response.sources) {
                allSources.push(...response.sources);
            }

            onMessageUpdate(agentId, response.text, response.sources);
        }

        // 📚 Add final references summary if in study mode (check if last agent uses APA)
        const lastAgent = agents[agents.length - 1];
        if (lastAgent.citationStyle === 'apa' && allSources.length > 0) {
            const referencesId = uuidv4();

            // Deduplicate sources by URI
            const uniqueSources = Array.from(
                new Map(allSources.map(s => [s.uri, s])).values()
            );

            let referencesText = `\n\n---\n\n## 📚 References\n\n`;
            uniqueSources.forEach((source, idx) => {
                const domain = new URL(source.uri).hostname.replace('www.', '');
                const year = new Date().getFullYear();
                referencesText += `[${idx + 1}] ${source.title}. (${year}). Retrieved from ${source.uri}\n\n`;
            });

            onMessageAdded({
                id: referencesId,
                sender: Sender.AI,
                agentName: "References",
                agentColor: "bg-gray-600",
                text: referencesText,
                timestamp: Date.now(),
                groundingSources: uniqueSources
            });
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
    history: Message[],
    enableGrounding: boolean
): Promise<AgentResponse> {
    try {
        const chatHistory = history.map(msg => ({
            role: msg.sender === Sender.USER ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const config: any = {
            systemInstruction: agent.systemInstruction,
            temperature: agent.temperature
        };

        // 🌐 Enable Google Search Grounding
        if (enableGrounding) {
            config.tools = [{
                googleSearch: {} // Enable built-in Google Search
            }];
        }

        const chat = ai.chats.create({
            model: modelName,
            config: config,
            history: chatHistory
        });

        const response = await chat.sendMessage({
            message: prompt
        });

        // Extract grounding sources if available
        const sources: GroundingSource[] = [];
        if (response.groundingMetadata?.groundingChunks) {
            response.groundingMetadata.groundingChunks.forEach((chunk: any) => {
                if (chunk.web) {
                    sources.push({
                        title: chunk.web.title || 'Untitled',
                        uri: chunk.web.uri,
                        snippet: chunk.web.snippet
                    });
                }
            });
        }

        return {
            text: response.text || "",
            sources: sources.length > 0 ? sources : undefined
        };
    } catch (e) {
        console.error(`Agent ${agent.name} failed:`, e);
        return {
            text: `[${agent.name} encountered an error: ${e instanceof Error ? e.message : 'Unknown'}]`
        };
    }
}


import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, ModelType, Attachment, GroundingSource, DocumentChunk, ModelParams, CommandState } from "../types";

const getClient = (apiKey?: string) => new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });

export const getEmbeddings = async (texts: string[], apiKey?: string): Promise<number[][]> => {
  const ai = getClient(apiKey);
  const model = "text-embedding-004";

  const embeddings: number[][] = [];

  for (const text of texts) {
    try {
      const result = await ai.models.embedContent({
        model,
        contents: { parts: [{ text }] }
      });
      if (result.embeddings && result.embeddings[0]?.values) {
        embeddings.push(result.embeddings[0].values);
      }
    } catch (e) {
      console.error("Embedding error:", e);
    }
  }
  return embeddings;
};

interface StreamResult {
  text: string;
  sources: GroundingSource[];
  usage?: { inputTokens: number; outputTokens: number };
}

export const streamGeminiResponse = async (
  currentMessage: string,
  attachments: Attachment[],
  history: Message[],
  model: ModelType,
  useSearch: boolean,
  retrievedContext: DocumentChunk[],
  onChunk: (text: string, grounding?: GroundingSource[]) => void,
  apiKey?: string,
  isMatrixMode?: boolean,
  isTronMode?: boolean,
  modelParams?: ModelParams,
  commandState?: CommandState
): Promise<StreamResult> => {
  const ai = getClient(apiKey);

  const parts: any[] = [];
  attachments.forEach((att) => {
    if (att.mimeType.startsWith('image/')) {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data,
        },
      });
    }
  });

  let contextPrompt = "";
  if (retrievedContext.length > 0) {
    contextPrompt = "\n\nUse the following context to answer the user's question. If the answer is not in the context, say so, but you can also use your general knowledge/search if applicable.\n\n--- START CONTEXT ---\n";
    retrievedContext.forEach((chunk, i) => {
      contextPrompt += `[Source: ${chunk.source}]\n${chunk.text}\n\n`;
    });
    contextPrompt += "--- END CONTEXT ---\n\n";
  }
  parts.push({ text: contextPrompt + currentMessage });

  let systemInstruction = modelParams?.systemPromptOverride || "";
  let targetModel: string = model;

  // 1. Override Model based on Command Flags
  if (commandState?.flash) targetModel = 'gemini-2.5-flash-lite';
  else if (commandState?.deep || model === ModelType.DEEP_RESEARCH) targetModel = 'gemini-3-pro-preview';
  else if (model === ModelType.REASONING) targetModel = 'gemini-2.0-flash-thinking-exp-01-21';

  // 2. Override System Prompt based on Mode/Flags
  if (!systemInstruction) {
    const basePrompt = `You are "Ranger", a helpful, precise AI assistant.`;

    if (isMatrixMode) {
      systemInstruction = `SYSTEM OVERRIDE: MATRIX SIMULATION ENABLED.
        You are an OPERATOR on the Nebuchadnezzar. Speak cryptically, use Matrix terminology (Red pill, Zion, Agents).
        Refer to the internet as "The Network".`;
    } else if (isTronMode) {
      systemInstruction = `SYSTEM OVERRIDE: THE GRID ENABLED.
        You are a SYSTEM MONITOR Program in the Tron system.
        Address the user as "User" or "Program".
        Speak with precise, logical, slightly robotic efficiency.
        End transmissions with "End of Line."`;
    } else if (commandState?.deep || model === ModelType.DEEP_RESEARCH) {
      systemInstruction = `${basePrompt}
        ACT AS AN AUTONOMOUS RESEARCH AGENT.
        PHASE 1: PLAN - Create a structured plan.
        PHASE 2: SEARCH - Use tools to gather data.
        PHASE 3: REPORT - Write a comprehensive academic report with citations.`;
    } else {
      systemInstruction = `${basePrompt}
        ${useSearch ? "Use Google Search grounding." : ""}
        ${retrievedContext.length > 0 ? "Use provided document context." : ""}
        Use Mermaid.js for diagrams.
        Use standard Markdown for tables.
        
        IMPORTANT: If the user asks for reasoning, or if the task is complex, wrap your thought process in <thinking> tags before the answer.
        Example: <thinking>I need to calculate X first...</thinking> The answer is Y.`;
    }
  }

  // 3. Tools
  const tools = [];
  if (useSearch || commandState?.web) {
    tools.push({ googleSearch: {} });
  }

  try {
    const chatHistory = history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: targetModel,
      config: {
        systemInstruction,
        tools,
        temperature: modelParams?.temperature,
        topP: modelParams?.topP,
        topK: modelParams?.topK,
        maxOutputTokens: modelParams?.maxOutputTokens
      },
      history: chatHistory
    });

    const resultStream = await chat.sendMessageStream({
      message: parts
    });

    let fullText = "";
    let allGrounding: GroundingSource[] = [];
    let finalUsage = { inputTokens: 0, outputTokens: 0 };

    for await (const chunk of resultStream) {
      const c = chunk as GenerateContentResponse;
      const textChunk = c.text || "";
      fullText += textChunk;

      if (c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const chunks = c.candidates[0].groundingMetadata.groundingChunks;
        chunks.forEach((gc: any) => {
          if (gc.web) allGrounding.push({ title: gc.web.title, uri: gc.web.uri });
        });
      }
      if (c.usageMetadata) {
        finalUsage = {
          inputTokens: c.usageMetadata.promptTokenCount || 0,
          outputTokens: c.usageMetadata.candidatesTokenCount || 0
        };
      }
      onChunk(fullText, allGrounding.length > 0 ? allGrounding : undefined);
    }

    return { text: fullText, sources: allGrounding, usage: finalUsage };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateTitle = async (firstMessage: string, apiKey?: string): Promise<string> => {
  try {
    const ai = getClient(apiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a very short, concise title (max 5 words) for a chat that starts with: "${firstMessage}"`,
    });
    return response.text?.trim() || "New Chat";
  } catch (e) { return "New Chat"; }
};

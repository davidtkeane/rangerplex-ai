
import { Message, Sender } from "../types";

export const checkOllamaConnection = async (baseUrl: string): Promise<boolean> => {
  try {
    // Simple check to tags endpoint
    const response = await fetch(`${baseUrl}/api/tags`);
    return response.ok;
  } catch (e) {
    console.warn("Ollama connection failed. Ensure OLLAMA_ORIGINS='*' is set.");
    return false;
  }
};

export const pullOllamaModel = async (
  baseUrl: string,
  modelName: string,
  onProgress: (status: string, completed: number, total: number) => void
) => {
  try {
    const response = await fetch(`${baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName })
    });

    if (!response.ok) throw new Error("Failed to start pull");
    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.status) {
            onProgress(json.status, json.completed || 0, json.total || 100);
          }
        } catch (e) { }
      }
    }
  } catch (e) {
    console.error("Ollama Pull Error", e);
    throw e;
  }
};

export const streamOllamaResponse = async (
  prompt: string,
  history: Message[],
  baseUrl: string,
  modelId: string,
  onChunk: (text: string) => void,
  options?: {
    temperature?: number;
    num_ctx?: number;
    keep_alive?: string;
  }
) => {
  const messages = history.map(msg => ({
    role: msg.sender === Sender.USER ? 'user' : 'assistant',
    content: msg.text
  }));

  const mcpSystemMsg = {
    role: 'system',
    content: `AVAILABLE TOOLS (Docker MCP):
    - Web Search: /mcp-brave_web_search <query>
    - Fetch URL: /mcp-fetch <url>
    - YouTube: /mcp-get_transcript <url>
    - Obsidian: /mcp-obsidian_search <query>
    
    INSTRUCTIONS:
    - If you need to search the web, fetch a page, or use any other tool, OUTPUT THE COMMAND DIRECTLY.
    - Do not say "I cannot access the internet". Instead, output: /mcp-brave_web_search <query>`
  };

  messages.unshift(mcpSystemMsg);

  messages.push({ role: 'user', content: prompt });

  let finalStats = { inputTokens: 0, outputTokens: 0 };

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelId,
        messages: messages,
        stream: true,
        keep_alive: options?.keep_alive,
        options: {
          temperature: options?.temperature,
          num_ctx: options?.num_ctx
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.statusText}`);
    }

    if (!response.body) throw new Error("No response body from Ollama");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            const part = json.message.content;
            fullText += part;
            onChunk(fullText);
          }

          // Capture stats from final message
          if (json.done) {
            finalStats = {
              inputTokens: json.prompt_eval_count || 0,
              outputTokens: json.eval_count || 0
            };
          }
        } catch (e) { }
      }
    }

    return { text: fullText, usage: finalStats };

  } catch (error) {
    console.error("Ollama Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
      throw new Error(
        "Connection Failed. \n" +
        "1. Is Ollama running? \n" +
        "2. Did you set `OLLAMA_ORIGINS='*'` environment variable? (Required for browser access)"
      );
    }
    throw error;
  }
};

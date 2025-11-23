
import { Message, Sender } from "../types";

export const streamGrokResponse = async (
    prompt: string,
    history: Message[],
    model: string,
    apiKey: string,
    onChunk: (text: string) => void,
    options?: {
        temperature?: number;      // 0.0-2.0, default 1.0
        maxTokens?: number;        // 1-131072 (Grok-3: 128k context)
        topP?: number;             // 0.0-1.0, default 1.0
        frequencyPenalty?: number; // -2.0 to 2.0, default 0.0
        presencePenalty?: number;  // -2.0 to 2.0, default 0.0
        stop?: string[];           // Stop sequences
        seed?: number;             // For reproducible outputs
    }
) => {
    if (!apiKey) throw new Error("xAI API Key Missing");

    const messages = history.map(m => ({
        role: m.sender === Sender.USER ? 'user' : 'assistant',
        content: m.text
    }));
    messages.push({ role: 'user', content: prompt });

    try {
        // Build request body with optional parameters
        const requestBody: any = {
            model,
            messages,
            stream: true
        };

        // Add optional parameters if provided
        if (options?.temperature !== undefined) requestBody.temperature = options.temperature;
        if (options?.maxTokens !== undefined) requestBody.max_tokens = options.maxTokens;
        if (options?.topP !== undefined) requestBody.top_p = options.topP;
        if (options?.frequencyPenalty !== undefined) requestBody.frequency_penalty = options.frequencyPenalty;
        if (options?.presencePenalty !== undefined) requestBody.presence_penalty = options.presencePenalty;
        if (options?.stop !== undefined) requestBody.stop = options.stop;
        if (options?.seed !== undefined) requestBody.seed = options.seed;

        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error("Grok API Error");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.trim() !== '');
            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const json = JSON.parse(line.slice(6));
                        if (json.choices[0].delta.content) {
                            fullText += json.choices[0].delta.content;
                            onChunk(fullText);
                        }
                    } catch (e) {}
                }
            }
        }
        return fullText;
    } catch (e) {
        console.error(e);
        throw e;
    }
};
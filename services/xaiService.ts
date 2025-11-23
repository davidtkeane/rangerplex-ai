
import { Message, Sender } from "../types";

export const streamGrokResponse = async (
    prompt: string,
    history: Message[],
    model: string,
    apiKey: string,
    onChunk: (text: string) => void
) => {
    if (!apiKey) throw new Error("xAI API Key Missing");

    const messages = history.map(m => ({
        role: m.sender === Sender.USER ? 'user' : 'assistant',
        content: m.text
    }));
    messages.push({ role: 'user', content: prompt });

    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                stream: true
            })
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
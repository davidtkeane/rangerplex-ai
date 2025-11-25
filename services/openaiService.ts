
import { Message, Sender, Attachment, DocumentChunk, ModelParams } from "../types";

export const streamOpenAIResponse = async (
  prompt: string,
  attachments: Attachment[],
  history: Message[],
  model: string,
  context: DocumentChunk[],
  apiKey: string,
  onChunk: (text: string) => void,
  modelParams?: ModelParams,
  baseUrl: string = 'https://api.openai.com/v1'
) => {
  if (!apiKey) throw new Error("OpenAI API Key is missing.");

  const messages: any[] = history.map(msg => ({
    role: msg.sender === Sender.USER ? 'user' : 'assistant',
    content: msg.text
  }));

  if (modelParams?.systemPromptOverride) {
      messages.unshift({ role: 'system', content: modelParams.systemPromptOverride });
  }

  let content: any[] = [];
  let textContent = prompt;
  if (context.length > 0) {
    const contextStr = context.map(c => `[Doc Source: ${c.source}]: ${c.text}`).join('\n\n');
    textContent = `Use the following document context to answer:\n\n${contextStr}\n\nQuery: ${prompt}`;
  }
  content.push({ type: "text", text: textContent });
  attachments.forEach(att => {
    if (att.mimeType.startsWith('image/')) {
      content.push({ type: "image_url", image_url: { url: `data:${att.mimeType};base64,${att.data}` } });
    }
  });
  messages.push({ role: 'user', content });

  const isO1 = model.startsWith('o1');
  const stream = !isO1; 

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: stream,
        max_tokens: isO1 ? undefined : (modelParams?.maxOutputTokens || 4096),
        temperature: isO1 ? 1 : (modelParams?.temperature ?? 1),
        top_p: isO1 ? 1 : (modelParams?.topP ?? 1)
      })
    });

    if (!response.ok) throw new Error((await response.json()).error?.message || "OpenAI Error");

    if (stream) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let usage = { inputTokens: 0, outputTokens: 0 };
        while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.trim() !== '');
            for (const line of lines) {
                if (line === 'data: [DONE]') continue;
                if (line.startsWith('data: ')) {
                    try {
                        const json = JSON.parse(line.slice(6));
                        if (json.choices?.[0]?.delta?.content) {
                            fullText += json.choices[0].delta.content;
                            onChunk(fullText);
                        }
                        if (json.usage) usage = { inputTokens: json.usage.prompt_tokens, outputTokens: json.usage.completion_tokens };
                    } catch (e) {}
                }
            }
        }
        return { text: fullText, usage };
    } else {
        const data = await response.json();
        const text = data.choices[0].message.content;
        onChunk(text);
        return { text, usage: { inputTokens: data.usage?.prompt_tokens, outputTokens: data.usage?.completion_tokens } };
    }
  } catch (error) {
    console.error("OpenAI Error:", error);
    throw error;
  }
};

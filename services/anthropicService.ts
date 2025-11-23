
import { Message, Sender, Attachment, DocumentChunk, ModelParams } from "../types";

export const streamAnthropicResponse = async (
  prompt: string,
  attachments: Attachment[],
  history: Message[],
  model: string,
  context: DocumentChunk[],
  apiKey: string,
  proxyUrl: string,
  onChunk: (text: string) => void,
  modelParams?: ModelParams
) => {
  if (!apiKey) throw new Error("Anthropic API Key is missing.");

  // Filter out empty messages - Claude requires non-empty content
  let messages: any[] = history
    .filter(msg => msg.text && msg.text.trim().length > 0)
    .map(msg => ({
      role: msg.sender === Sender.USER ? 'user' : 'assistant',
      content: msg.text
    }));

  let content: any[] = [];
  attachments.forEach(att => {
    if (att.mimeType.startsWith('image/')) {
      content.push({ type: "image", source: { type: "base64", media_type: att.mimeType, data: att.data } });
    }
  });

  let textContent = prompt;
  if (context.length > 0) {
    const contextStr = context.map(c => `[Doc Source: ${c.source}]: ${c.text}`).join('\n\n');
    textContent = `Use the following context to answer:\n\n${contextStr}\n\nQuery: ${prompt}`;
  }
  content.push({ type: "text", text: textContent });
  messages.push({ role: 'user', content });

  const endpointPath = '/v1/messages';
  const url = proxyUrl ? `${proxyUrl.replace(/\/$/, '')}${endpointPath}` : `https://api.anthropic.com${endpointPath}`;

  try {
    // Build request body - Claude 4.5 models don't allow both temperature AND top_p
    const requestBody: any = {
      model: model,
      messages: messages,
      max_tokens: modelParams?.maxOutputTokens || 4096,
      stream: true
    };

    // Only include temperature OR top_p, not both (temperature takes priority)
    if (modelParams?.temperature !== undefined) {
      requestBody.temperature = modelParams.temperature;
    } else if (modelParams?.topP !== undefined) {
      requestBody.top_p = modelParams.topP;
    }

    // Add system prompt if provided
    if (modelParams?.systemPromptOverride) {
      requestBody.system = modelParams.systemPromptOverride;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const txt = await response.text();
        if(txt.includes("CORS")) throw new Error("CORS Error: Set Proxy URL in settings.");
        throw new Error("Anthropic Error: " + txt);
    }

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
          if (line.startsWith('data: ')) {
              try {
                  const json = JSON.parse(line.slice(6));
                  if (json.type === 'content_block_delta' && json.delta?.text) {
                      fullText += json.delta.text;
                      onChunk(fullText);
                  }
                  if (json.type === 'message_start') usage.inputTokens = json.message.usage.input_tokens;
                  if (json.type === 'message_delta') usage.outputTokens = json.usage.output_tokens;
              } catch (e) {}
          }
      }
    }
    return { text: fullText, usage };
  } catch (error) {
    console.error("Anthropic Error:", error);
    throw error;
  }
};

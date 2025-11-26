
import { Message, Sender, Attachment, DocumentChunk, ModelParams } from "../types";

// Estimate token count (rough: 1 token ≈ 4 characters)
const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

// Trim history to fit within token limits
// Claude has 200K max, but we need room for prompt, context, and output
// Target: 100K tokens for history (leaves 100K for everything else)
const trimHistory = (history: Message[], maxTokens: number = 100000): Message[] => {
  if (history.length === 0) return [];

  // Calculate tokens for each message
  const messagesWithTokens = history.map(msg => ({
    message: msg,
    tokens: estimateTokens(msg.text || '')
  }));

  // Start from most recent and work backwards
  const trimmed: Message[] = [];
  let totalTokens = 0;

  for (let i = messagesWithTokens.length - 1; i >= 0; i--) {
    const { message, tokens } = messagesWithTokens[i];
    if (totalTokens + tokens <= maxTokens) {
      trimmed.unshift(message); // Add to front
      totalTokens += tokens;
    } else {
      // Stop adding older messages
      break;
    }
  }

  return trimmed;
};

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

  // Trim history to prevent token overflow (100K tokens for history, 100K for context/output)
  const trimmedHistory = trimHistory(history, 100000);

  if (trimmedHistory.length < history.length) {
    console.log(`🔧 Claude: Trimmed history from ${history.length} to ${trimmedHistory.length} messages to fit token limit`);
  }

  // Filter out empty messages - Claude requires non-empty content
  let messages: any[] = trimmedHistory
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
    // Trim context to prevent token overflow (max 50K tokens for RAG context)
    let contextStr = '';
    let contextTokens = 0;
    const maxContextTokens = 50000;

    for (const chunk of context) {
      const chunkText = `[Doc Source: ${chunk.source}]: ${chunk.text}\n\n`;
      const chunkTokens = estimateTokens(chunkText);

      if (contextTokens + chunkTokens <= maxContextTokens) {
        contextStr += chunkText;
        contextTokens += chunkTokens;
      } else {
        console.log(`🔧 Claude: Trimmed RAG context at ${contextTokens.toLocaleString()} tokens (limit: ${maxContextTokens.toLocaleString()})`);
        break;
      }
    }

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

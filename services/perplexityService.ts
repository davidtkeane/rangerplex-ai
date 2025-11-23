
import { Message, Sender, Attachment, DocumentChunk, GroundingSource } from "../types";

export const streamPerplexityResponse = async (
  prompt: string,
  history: Message[],
  model: string,
  apiKey: string,
  onChunk: (text: string, citations?: GroundingSource[]) => void
) => {
  if (!apiKey) throw new Error("Perplexity API Key is missing.");

  // Build chat history and enforce Perplexity's required role alternation (user/assistant)
  const rawMessages = history
    .filter(msg => msg.text && msg.text.trim().length > 0)
    .map(msg => ({
      role: msg.sender === Sender.USER ? 'user' : 'assistant',
      content: msg.text
    }));

  // Collapse any consecutive same-role messages to enforce strict alternation
  const messages: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const m of rawMessages) {
    if (messages.length === 0 || messages[messages.length - 1].role !== m.role) {
      messages.push(m);
    } else {
      messages[messages.length - 1] = m; // keep the latest of that role
    }
  }

  // Ensure final turn is the current user prompt and maintains alternation
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    messages.push({ role: 'user', content: prompt });
  } else {
    messages[messages.length - 1] = { role: 'user', content: prompt };
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true
      })
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Perplexity API Error (${response.status}): ${body || response.statusText}`);
    }

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let citations: string[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line === 'data: [DONE]') continue;
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.choices && json.choices[0].delta.content) {
              const text = json.choices[0].delta.content;
              fullText += text;
              
              // Perplexity returns citations in the final object usually, or we extract indices
              // citations = json.citations || []; 
              
              // We pass undefined for citations during stream until end if possible,
              // but Perplexity API citations handling varies. We often get them at end.
              if (json.citations) citations = json.citations;
              
              const sources: GroundingSource[] = citations.map((uri, idx) => ({ title: `Source ${idx+1}`, uri }));
              onChunk(fullText, sources);
            }
          } catch (e) {}
        }
      }
    }
    
    const sources: GroundingSource[] = citations.map((uri, idx) => ({ title: `Source ${idx+1}`, uri }));
    return { text: fullText, sources };

  } catch (error) {
    console.error("Perplexity Error:", error);
    throw error;
  }
};

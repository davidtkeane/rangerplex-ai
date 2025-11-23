
import { ChatSession, DocumentChunk, Sender, TrainingExample } from "../types";

/**
 * Converts chat sessions into JSONL format suitable for fine-tuning (e.g., Gemini, OpenAI, Llama).
 */
export const exportSessionsToJSONL = (sessions: ChatSession[]): string => {
    const examples: TrainingExample[] = sessions
        .filter(s => s.messages.length > 0)
        .map(session => {
            const formattedMessages = session.messages.map(msg => ({
                role: msg.sender === Sender.USER ? "user" as const : "model" as const,
                content: msg.text
            }));

            // Add a system prompt if context exists
            let systemMsg = { role: "system" as const, content: "You are a helpful AI research assistant." };
            
            return {
                messages: [systemMsg, ...formattedMessages]
            };
        });

    return examples.map(ex => JSON.stringify(ex)).join('\n');
};

/**
 * Exports the Knowledge Base (RAG chunks) into a raw text format for pre-training or embedding analysis.
 */
export const exportKnowledgeBase = (sessions: ChatSession[]): string => {
    let allChunks: DocumentChunk[] = [];
    sessions.forEach(s => {
        if (s.knowledgeBase) {
            allChunks = [...allChunks, ...s.knowledgeBase];
        }
    });

    // Unique chunks based on ID
    const uniqueChunks = Array.from(new Map(allChunks.map(item => [item.id, item])).values());

    return JSON.stringify(uniqueChunks, null, 2);
};

/**
 * Downloads a string as a file in the browser.
 */
export const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Exports a single conversation as Markdown
 */
export const exportConversationMarkdown = (session: ChatSession): string => {
    let md = `# ${session.title}\n\n`;
    md += `*Date: ${new Date(session.updatedAt).toLocaleString()}*\n`;
    md += `*Model: ${session.model}*\n\n---\n\n`;

    session.messages.forEach(msg => {
        const role = msg.sender === Sender.USER ? "User" : (msg.agentName || "Ranger");
        md += `### ${role}\n\n${msg.text}\n\n`;
        if (msg.groundingSources && msg.groundingSources.length > 0) {
            md += `> **Sources:**\n`;
            msg.groundingSources.forEach(src => {
                md += `> - [${src.title || 'Link'}](${src.uri})\n`;
            });
            md += `\n`;
        }
        md += `---\n\n`;
    });

    return md;
};

import * as pdfjsLib from 'pdfjs-dist';
import { v4 as uuidv4 } from 'uuid';
import { Attachment, DocumentChunk } from '../types';
import { getEmbeddings } from './geminiService';
import { convertHtmlToMarkdown } from './htmlToMarkdown';
import { extractTextFromDocx } from './wordService';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

// --- Text Extraction ---

const extractTextFromPDF = async (base64: string): Promise<string> => {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    throw new Error("Failed to parse PDF");
  }
};

const extractText = async (attachment: Attachment): Promise<string> => {
    if (attachment.mimeType === 'application/pdf') {
        return await extractTextFromPDF(attachment.data);
    } else if (attachment.mimeType === 'text/html') {
        // Decode base64 HTML and convert to Markdown
        const html = atob(attachment.data);
        return convertHtmlToMarkdown(html);
    } else if (attachment.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // DOCX
        return await extractTextFromDocx(attachment.data);
    } else if (attachment.mimeType.startsWith('text/') || attachment.mimeType === 'application/json') {
        // Decode base64 text
        return atob(attachment.data);
    }
    return "";
};

// --- Chunking ---

const chunkText = (text: string, source: string): DocumentChunk[] => {
    const chunks: DocumentChunk[] = [];
    let start = 0;
    
    while (start < text.length) {
        const end = Math.min(start + CHUNK_SIZE, text.length);
        const chunkText = text.slice(start, end);
        
        chunks.push({
            id: uuidv4(),
            text: chunkText,
            embedding: [], // Filled later
            source: source
        });

        start += (CHUNK_SIZE - CHUNK_OVERLAP);
    }
    return chunks;
};

// --- Processing ---

export const processDocuments = async (attachments: Attachment[], apiKey?: string): Promise<DocumentChunk[]> => {
    const allChunks: DocumentChunk[] = [];

    for (const att of attachments) {
        // Skip images for RAG
        if (att.mimeType.startsWith('image/')) continue;

        const text = await extractText(att);
        if (text.trim()) {
            const fileChunks = chunkText(text, att.name);
            
            // Generate Embeddings in batch (or pseudo-batch)
            const chunkTexts = fileChunks.map(c => c.text);
            const embeddings = await getEmbeddings(chunkTexts, apiKey);

            fileChunks.forEach((chunk, i) => {
                chunk.embedding = embeddings[i];
            });

            allChunks.push(...fileChunks);
        }
    }
    return allChunks;
};

// --- Retrieval ---

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const retrieveRelevantChunks = async (
    query: string, 
    knowledgeBase: DocumentChunk[], 
    apiKey?: string,
    topK: number = 4
): Promise<DocumentChunk[]> => {
    if (knowledgeBase.length === 0) return [];

    // Embed query
    const queryEmbeddings = await getEmbeddings([query], apiKey);
    if (queryEmbeddings.length === 0) return [];
    const queryVec = queryEmbeddings[0];

    // Rank chunks
    const scored = knowledgeBase.map(chunk => ({
        chunk,
        score: cosineSimilarity(queryVec, chunk.embedding)
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK).map(s => s.chunk);
};
import mammoth from 'mammoth';

export const extractTextFromDocx = async (base64: string): Promise<string> => {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Mammoth expects an ArrayBuffer
    const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
    return result.value;
  } catch (error) {
    console.error("DOCX Extraction Error:", error);
    throw new Error("Failed to parse Word Document");
  }
};
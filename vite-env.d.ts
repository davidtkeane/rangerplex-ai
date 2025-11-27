/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY: string
    readonly VITE_OPENAI_API_KEY: string
    readonly VITE_ANTHROPIC_API_KEY: string
    readonly VITE_PERPLEXITY_API_KEY: string
    readonly VITE_BRAVE_SEARCH_API_KEY: string
    readonly VITE_ELEVENLABS_API_KEY: string
    readonly VITE_HUGGINGFACE_ACCESS_TOKEN: string
    readonly VITE_GROK_API_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

interface Window {
    electronAPI: {
        sendMessage: (channel: string, data: any) => void;
        onMessage: (channel: string, func: (...args: any[]) => void) => void;
        fsReadDir: (path: string) => Promise<any>;
        fsReadFile: (path: string) => Promise<any>;
        fsWriteFile: (path: string, content: string) => Promise<any>;
        fsStat: (path: string) => Promise<any>;
        fsReadBuffer: (path: string, size?: number) => Promise<Uint8Array | { error: string }>;
        calculateHash: (filePath: string, algorithm: string) => Promise<string | { error: string }>;
        [key: string]: any; // Allow other methods
    }
}

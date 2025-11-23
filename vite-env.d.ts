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

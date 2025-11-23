
// Helper to fetch models from providers

const KNOWN_GEMINI_MODELS = [
    'gemini-3-pro',
    'gemini-3-pro-preview',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-thinking-exp-01-21'
];

export const fetchOpenAIModels = async (apiKey: string): Promise<string[]> => {
    if(!apiKey) return [];
    try {
        const res = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const data = await res.json();
        return data.data
            .filter((m: any) => m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3'))
            .map((m: any) => m.id)
            .sort();
    } catch (e) { console.error(e); return []; }
};

export const fetchOllamaModels = async (baseUrl: string): Promise<string[]> => {
    try {
        const res = await fetch(`${baseUrl}/api/tags`);
        const data = await res.json();
        return data.models.map((m: any) => m.name);
    } catch (e) { console.error(e); return []; }
};

export const fetchGeminiModels = async (apiKey: string): Promise<string[]> => {
    if (!apiKey) return KNOWN_GEMINI_MODELS;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();
        const models = (data.models || [])
            .map((m: any) => (m.name || '').replace(/^models\//, ''))
            .filter((name: string) => KNOWN_GEMINI_MODELS.includes(name));

        const deduped = Array.from(new Set(models));
        return deduped.length > 0 ? deduped : KNOWN_GEMINI_MODELS;
    } catch (e) {
        console.error(e);
        return KNOWN_GEMINI_MODELS;
    }
};

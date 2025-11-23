
import { Message, Sender } from "../types";

export const generateHFChat = async (
    prompt: string, 
    history: Message[], 
    modelId: string, 
    apiKey: string
): Promise<string> => {
    if (!apiKey) throw new Error("HuggingFace API Key Missing");
    
    // HF Inference API doesn't support standard streaming easily for all models in browser without proxy
    // We will do non-streaming for stability
    const inputs = history.map(m => `${m.sender === Sender.USER ? 'User' : 'Assistant'}: ${m.text}`).join('\n') + `\nUser: ${prompt}\nAssistant:`;
    
    try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: inputs,
                parameters: {
                    max_new_tokens: 1024,
                    temperature: 0.7,
                    return_full_text: false
                }
            })
        });

        if (!response.ok) throw new Error(`HF Error: ${response.statusText}`);
        const result = await response.json();
        return Array.isArray(result) ? result[0].generated_text : result.generated_text;
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const generateFluxImage = async (prompt: string, apiKey: string): Promise<string> => {
    if (!apiKey) throw new Error("HuggingFace API Key Missing for Flux");
    
    try {
        const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: prompt }),
        });

        if (!response.ok) throw new Error("Flux Generation Failed");
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (e) {
        console.error(e);
        throw e;
    }
};
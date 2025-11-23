
import { GeneratedImage, AppSettings } from "../types";
import { generateFluxImage } from "./huggingFaceService";

export const generateImage = async (
    prompt: string,
    provider: 'dall-e-3' | 'imagen-3' | 'flux-1' | 'all',
    settings: AppSettings
): Promise<GeneratedImage[]> => {
    
    const images: GeneratedImage[] = [];
    const promises: Promise<any>[] = [];

    // 1. OpenAI DALL-E 3
    if ((provider === 'dall-e-3' || provider === 'all') && settings.openaiApiKey) {
        promises.push(
            fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.openaiApiKey}` },
                body: JSON.stringify({
                    model: "dall-e-3",
                    prompt: prompt,
                    n: 1,
                    size: "1024x1024"
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.data && data.data[0]) {
                    images.push({ url: data.data[0].url, prompt, provider: 'dall-e-3', revisedPrompt: data.data[0].revised_prompt });
                }
            })
            .catch(e => console.error("DALL-E Fail", e))
        );
    }

    // 2. Hugging Face Flux.1
    if ((provider === 'flux-1' || provider === 'all') && settings.huggingFaceApiKey) {
        promises.push(
            generateFluxImage(prompt, settings.huggingFaceApiKey)
            .then(url => {
                images.push({ url, prompt, provider: 'flux-1' });
            })
            .catch(e => console.error("Flux Fail", e))
        );
    }

    // 3. Gemini Imagen 3 (Using Vertex AI REST or GenAI SDK wrapper if available, here placeholder simulation via GenAI text-to-image or we need a specific endpoint.
    // Currently standard GenAI SDK generateImages only supports Vertex in some regions.
    // We will stub this or use a proxy if needed. For now, let's assume if we had the key we use a service. 
    // *Note*: Standard Google GenAI API key doesn't always support imagen-3 directly yet without cloud project setup. 
    // We will implement a mock fallback if key exists for user feedback or skip.*

    await Promise.all(promises);
    return images;
};
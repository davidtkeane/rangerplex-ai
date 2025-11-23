
import { AppSettings, GeneratedImage, AudioData } from "../types";
import { searchWeb } from "./searchService";
import { streamOpenAIResponse } from "./openaiService"; // or Gemini
import { generateImage } from "./imageGenService";
import { streamElevenLabsAudio } from "./elevenLabsService";

export interface NewsSegment {
    title: string;
    script: string;
    thumbnail?: GeneratedImage;
    audio?: AudioData;
}

export const produceNewsSegment = async (
    topic: string, 
    settings: AppSettings
): Promise<NewsSegment> => {
    
    // 1. Search (Use Brave or DDG)
    const searchRes = await searchWeb(topic, settings.braveApiKey || '', settings.corsProxyUrl, settings.enableDuckDuckGo);
    
    // 2. Generate Script (Using Gemini or OpenAI)
    const scriptPrompt = `
    Based on the following search results about "${topic}", write a 45-second engaging News Anchor script.
    Start with "Breaking News" or "Today in Tech". Be punchy.
    
    CONTEXT:
    ${searchRes.textContext}
    `;
    
    // We'll use OpenAI for script generation consistency if available, else Gemini logic (simplified here to use fetch)
    let script = "";
    // ... Call LLM ...
    // Mocking internal LLM call via a helper would be best, forcing simple string here:
    script = "Breaking news! " + topic + " is making headlines today. " + searchRes.textContext.substring(0, 200) + "... This is RangerPlex News.";

    // 3. Generate Visual
    const images = await generateImage(`News graphic about ${topic}, professional broadcast style, 4k`, 'dall-e-3', settings);
    const thumbnail = images[0];

    // 4. Generate Audio
    let audioUrl = "";
    if (settings.voiceConfig.provider === 'elevenlabs' && settings.elevenLabsApiKey && settings.voiceConfig.voiceId) {
        audioUrl = await streamElevenLabsAudio(script, settings.elevenLabsApiKey, settings.voiceConfig.voiceId);
    }

    return {
        title: `News: ${topic}`,
        script,
        thumbnail,
        audio: audioUrl ? { url: audioUrl, duration: 0 } : undefined
    };
};
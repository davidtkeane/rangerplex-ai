
export interface Voice {
    voice_id: string;
    name: string;
    category?: string;
    preview_url?: string;
}

export const fetchElevenLabsVoices = async (apiKey: string): Promise<Voice[]> => {
    if (!apiKey) return [];
    try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
            headers: { 'xi-api-key': apiKey }
        });
        if (!response.ok) throw new Error("Failed to fetch voices");
        const data = await response.json();
        return data.voices.map((v: any) => ({
            voice_id: v.voice_id,
            name: v.name,
            category: v.category,
            preview_url: v.preview_url
        }));
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const streamElevenLabsAudio = async (
    text: string, 
    apiKey: string, 
    voiceId: string
): Promise<string> => {
    if (!apiKey) throw new Error("ElevenLabs API Key Missing");
    
    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) throw new Error("ElevenLabs TTS Failed");
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (e) {
        console.error("TTS Error", e);
        throw e;
    }
};
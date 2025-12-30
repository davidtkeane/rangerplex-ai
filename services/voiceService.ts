
// Basic wrapper for Web Speech API

export const speakText = (text: string, voiceName?: string | string[]) => {
    if (!window.speechSynthesis) return;

    // Cancel existing
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // Try to find a good English voice if not specified
    if (!voiceName) {
        const preferred = voices.find(v => v.name.includes('Google US English')) ||
            voices.find(v => v.lang === 'en-US') ||
            voices[0];
        if (preferred) utterance.voice = preferred;
    } else {
        if (Array.isArray(voiceName)) {
            // Find the first available voice that matches any of the preferences
            for (const name of voiceName) {
                const v = voices.find(voice => voice.name === name || voice.name.includes(name));
                if (v) {
                    utterance.voice = v;
                    break;
                }
            }
        } else {
            const v = voices.find(v => v.name === voiceName);
            if (v) utterance.voice = v;
        }
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
};

// Speech Recognition
let recognition: any = null;

export const startListening = (
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: string) => void
) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        onError("Speech Recognition not supported in this browser.");
        return null;
    }

    if (recognition) recognition.stop();

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript) onResult(finalTranscript, true);
        else if (interimTranscript) onResult(interimTranscript, false);
    };

    recognition.onerror = (event: any) => {
        onError(event.error);
    };

    recognition.start();
    return recognition;
};

export const stopListening = () => {
    if (recognition) recognition.stop();
};

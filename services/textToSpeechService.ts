/**
 * Text-to-Speech Service for Dyslexia Support
 * Uses Web Speech API for reading messages aloud
 */

class TextToSpeechService {
    private synthesis: SpeechSynthesis | null = null;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private isEnabled: boolean = false;

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
        }
    }

    /**
     * Check if TTS is supported
     */
    isSupported(): boolean {
        return this.synthesis !== null;
    }

    /**
     * Enable/disable TTS
     */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        if (!enabled) {
            this.stop();
        }
    }

    /**
     * Get available voices
     */
    getVoices(): SpeechSynthesisVoice[] {
        if (!this.synthesis) return [];
        return this.synthesis.getVoices();
    }

    /**
     * Speak text aloud
     */
    speak(text: string, options?: {
        rate?: number; // 0.1 to 10 (default 1)
        pitch?: number; // 0 to 2 (default 1)
        volume?: number; // 0 to 1 (default 1)
        voice?: SpeechSynthesisVoice;
        onEnd?: () => void;
        onError?: (error: Error) => void;
    }): void {
        if (!this.synthesis || !this.isEnabled) return;

        // Stop any ongoing speech
        this.stop();

        // Clean text (remove markdown, code blocks, etc.)
        const cleanText = this.cleanText(text);
        if (!cleanText.trim()) return;

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = options?.rate ?? 0.9; // Slightly slower for better comprehension
        utterance.pitch = options?.pitch ?? 1;
        utterance.volume = options?.volume ?? 1;

        if (options?.voice) {
            utterance.voice = options.voice;
        } else {
            // Try to use a natural-sounding English voice
            const voices = this.getVoices();
            const preferredVoice = voices.find(v =>
                v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Premium'))
            ) || voices.find(v => v.lang.startsWith('en'));

            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
        }

        utterance.onend = () => {
            this.currentUtterance = null;
            options?.onEnd?.();
        };

        utterance.onerror = (event) => {
            console.error('[TTS] Error:', event);
            this.currentUtterance = null;
            options?.onError?.(new Error(event.error));
        };

        this.currentUtterance = utterance;
        this.synthesis.speak(utterance);
    }

    /**
     * Stop current speech
     */
    stop(): void {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.currentUtterance = null;
        }
    }

    /**
     * Pause current speech
     */
    pause(): void {
        if (this.synthesis && this.synthesis.speaking) {
            this.synthesis.pause();
        }
    }

    /**
     * Resume paused speech
     */
    resume(): void {
        if (this.synthesis && this.synthesis.paused) {
            this.synthesis.resume();
        }
    }

    /**
     * Check if currently speaking
     */
    isSpeaking(): boolean {
        return this.synthesis?.speaking ?? false;
    }

    /**
     * Clean text for speech (remove markdown, code, etc.)
     */
    private cleanText(text: string): string {
        let cleaned = text;

        // Remove code blocks
        cleaned = cleaned.replace(/```[\s\S]*?```/g, '[code block]');

        // Remove inline code
        cleaned = cleaned.replace(/`[^`]+`/g, '[code]');

        // Remove markdown links but keep text
        cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

        // Remove markdown bold/italic
        cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
        cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
        cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
        cleaned = cleaned.replace(/_([^_]+)_/g, '$1');

        // Remove headers
        cleaned = cleaned.replace(/^#+\s+/gm, '');

        // Remove bullet points
        cleaned = cleaned.replace(/^[-*+]\s+/gm, '');

        // Remove numbered lists
        cleaned = cleaned.replace(/^\d+\.\s+/gm, '');

        // Remove extra whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        return cleaned;
    }

    /**
     * Speak a message with automatic chunking for long text
     */
    speakMessage(text: string, onComplete?: () => void): void {
        if (!this.isEnabled) return;

        const cleaned = this.cleanText(text);

        // Split into sentences for better pacing
        const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];

        let currentIndex = 0;

        const speakNext = () => {
            if (currentIndex >= sentences.length) {
                onComplete?.();
                return;
            }

            this.speak(sentences[currentIndex], {
                onEnd: () => {
                    currentIndex++;
                    // Small pause between sentences
                    setTimeout(speakNext, 200);
                },
                onError: () => {
                    currentIndex++;
                    speakNext();
                }
            });
        };

        speakNext();
    }
}

// Export singleton instance
export const ttsService = new TextToSpeechService();

export default ttsService;

import React, { useState, useRef, useEffect } from 'react';
import styles from './VoiceInput.module.css';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    onError?: (error: string) => void;
    disabled?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, onError, disabled }) => {
    const [isListening, setIsListening] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
    const [selectedMicId, setSelectedMicId] = useState<string>('default');
    const [showMicSelector, setShowMicSelector] = useState(false);

    const recognitionRef = useRef<any>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Initialize speech recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            onError?.('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result: any) => result.transcript)
                .join('');

            if (event.results[event.results.length - 1].isFinal) {
                onTranscript(transcript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('[Voice] Recognition error:', event.error);
            if (event.error === 'no-speech') return;
            onError?.(`Speech recognition error: ${event.error}`);
            setIsListening(false);
        };

        recognition.onend = () => {
            if (isListening) {
                try {
                    recognition.start();
                } catch (e) {
                    console.log('[Voice] Recognition already started');
                }
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [isListening, onTranscript, onError]);

    const loadMicrophones = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());

            const devices = await navigator.mediaDevices.enumerateDevices();
            const mics = devices.filter(d => d.kind === 'audioinput');
            setAvailableMics(mics);

            console.log('[Voice] Found microphones:', mics.map(m => m.label || m.deviceId));
        } catch (error) {
            console.error('[Voice] Error loading microphones:', error);
            onError?.('Could not access microphone. Please grant permission.');
        }
    };

    const startAudioMonitoring = async () => {
        try {
            const constraints: MediaStreamConstraints = {
                audio: selectedMicId === 'default'
                    ? true
                    : { deviceId: { exact: selectedMicId } }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            mediaStreamRef.current = stream;

            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateLevel = () => {
                if (!analyserRef.current) return;

                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioLevel(Math.min(100, Math.round((average / 255) * 100)));

                animationFrameRef.current = requestAnimationFrame(updateLevel);
            };
            updateLevel();
        } catch (error) {
            console.error('[Voice] Error starting audio monitoring:', error);
            onError?.('Could not access microphone');
        }
    };

    const stopAudioMonitoring = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        setAudioLevel(0);
    };

    const toggleListening = async () => {
        if (isListening) {
            recognitionRef.current?.stop();
            stopAudioMonitoring();
            setIsListening(false);
        } else {
            try {
                await startAudioMonitoring();
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (error) {
                console.error('[Voice] Error starting recognition:', error);
                onError?.('Could not start voice recognition');
            }
        }
    };

    useEffect(() => {
        loadMicrophones();
    }, []);

    return (
        <div className={styles.voiceInputContainer}>
            <div className="relative">
                <button
                    onClick={toggleListening}
                    disabled={disabled}
                    className={`${styles.voiceButton} ${isListening ? styles.listening : ''} ${disabled ? styles.disabled : ''}`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                    <i className={`fa-solid ${isListening ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>

                    {isListening && (
                        <div className={styles.audioLevelRing} style={{
                            transform: `scale(${1 + (audioLevel / 100) * 0.5})`,
                            opacity: audioLevel / 100
                        }}></div>
                    )}
                </button>

                <button
                    onClick={() => setShowMicSelector(!showMicSelector)}
                    className={styles.micSettingsButton}
                    title="Microphone settings"
                >
                    <i className="fa-solid fa-gear"></i>
                </button>
            </div>

            {showMicSelector && (
                <div className={styles.micSelectorDropdown}>
                    <div className={styles.micSelectorHeader}>
                        <i className="fa-solid fa-microphone"></i>
                        <span>Select Microphone</span>
                        <button onClick={() => loadMicrophones()} className={styles.refreshButton} title="Refresh">
                            <i className="fa-solid fa-rotate-right"></i>
                        </button>
                    </div>

                    <div className={styles.micList}>
                        <button
                            onClick={() => {
                                setSelectedMicId('default');
                                setShowMicSelector(false);
                            }}
                            className={`${styles.micOption} ${selectedMicId === 'default' ? styles.selected : ''}`}
                        >
                            <i className="fa-solid fa-microphone"></i>
                            <span>System Default</span>
                            {selectedMicId === 'default' && <i className="fa-solid fa-check"></i>}
                        </button>

                        {availableMics.map((mic) => (
                            <button
                                key={mic.deviceId}
                                onClick={() => {
                                    setSelectedMicId(mic.deviceId);
                                    setShowMicSelector(false);
                                }}
                                className={`${styles.micOption} ${selectedMicId === mic.deviceId ? styles.selected : ''}`}
                            >
                                <i className="fa-solid fa-microphone"></i>
                                <span>{mic.label || `Microphone ${mic.deviceId.substring(0, 8)}`}</span>
                                {selectedMicId === mic.deviceId && <i className="fa-solid fa-check"></i>}
                            </button>
                        ))}
                    </div>

                    <div className={styles.micSelectorFooter}>
                        <span className="text-xs opacity-70">
                            {availableMics.length} microphone(s) available
                        </span>
                    </div>
                </div>
            )}

            {isListening && (
                <div className={styles.listeningIndicator}>
                    <div className={styles.pulseDot}></div>
                    <span>Listening...</span>
                </div>
            )}
        </div>
    );
};

export default VoiceInput;

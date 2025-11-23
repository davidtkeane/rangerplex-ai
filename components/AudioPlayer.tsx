
import React, { useRef, useState, useEffect } from 'react';

interface AudioPlayerProps {
    src: string;
    autoPlay?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, autoPlay }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        if (autoPlay && audioRef.current) {
            audioRef.current.play().catch(() => {});
        }
    }, [src, autoPlay]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (playing) audioRef.current.pause();
        else audioRef.current.play();
    };

    return (
        <div className="mt-2 flex items-center gap-3 p-3 bg-zinc-900/80 rounded-full border border-zinc-700 w-full max-w-xs backdrop-blur-md">
            <button onClick={togglePlay} className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-black hover:bg-teal-400 transition-colors">
                <i className={`fa-solid ${playing ? 'fa-pause' : 'fa-play'} text-xs`}></i>
            </button>
            <div className="flex-1 h-8 flex items-center gap-0.5 opacity-50">
                {/* Fake waveform */}
                {[...Array(20)].map((_, i) => (
                    <div key={i} className={`w-1 bg-teal-500 rounded-full transition-all duration-300 ${playing ? 'animate-pulse' : ''}`} style={{ height: Math.random() * 20 + 5 + 'px' }}></div>
                ))}
            </div>
            <audio 
                ref={audioRef} 
                src={src} 
                onPlay={() => setPlaying(true)} 
                onPause={() => setPlaying(false)} 
                onEnded={() => setPlaying(false)}
            />
        </div>
    );
};

export default AudioPlayer;
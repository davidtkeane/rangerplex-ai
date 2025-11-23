import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface RangerVisionModeProps {
    isOpen: boolean;
    onClose: () => void;
    theme: 'dark' | 'light' | 'tron';
    onToggleRadio: () => void;
}

const RangerVisionMode: React.FC<RangerVisionModeProps> = ({ isOpen, onClose, theme, onToggleRadio }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showClock, setShowClock] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [matrixMode, setMatrixMode] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [transitionEffect, setTransitionEffect] = useState<string>('fade');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Image sources (using Unsplash for now - can be configured)
    const getImageUrl = useCallback((index: number) => {
        return `https://picsum.photos/1920/1080?random=${index}`;
    }, []);

    // Clock update
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Matrix effect
    useEffect(() => {
        if (!matrixMode || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0F0';
            ctx.font = '16px monospace';

            for (let i = 0; i < canvas.width / 20; i++) {
                const text = String.fromCharCode(33 + Math.floor(Math.random() * 94));
                const x = i * 20;
                const y = Math.random() * canvas.height;
                ctx.fillText(text, x, y);
            }

            if (matrixMode) requestAnimationFrame(draw);
        };

        draw();
    }, [matrixMode]);

    // Slideshow timer
    useEffect(() => {
        if (isPaused || matrixMode || !isOpen) return;

        intervalRef.current = setInterval(() => {
            setCurrentIndex(prev => prev + 1);
        }, 10000); // 10 seconds per image

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPaused, matrixMode, isOpen]);

    // Auto-hide controls
    const resetActivityTimer = useCallback(() => {
        setShowControls(true);

        if (activityTimeoutRef.current) {
            clearTimeout(activityTimeoutRef.current);
        }

        activityTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 5000);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handleActivity = () => resetActivityTimer();

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);

        resetActivityTimer();

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
        };
    }, [isOpen, resetActivityTimer]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyPress = (e: KeyboardEvent) => {
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    setIsPaused(prev => !prev);
                    break;
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowRight':
                    setCurrentIndex(prev => prev + 1);
                    break;
                case 'ArrowLeft':
                    setCurrentIndex(prev => Math.max(0, prev - 1));
                    break;
                case 'm':
                case 'M':
                    setMatrixMode(prev => !prev);
                    break;
                case 'c':
                case 'C':
                    setShowClock(prev => !prev);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isTron = theme === 'tron';

    return (
        <div className="fixed inset-0 z-[9999] bg-black">
            {/* Background Images */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                style={{
                    backgroundImage: `url(${getImageUrl(currentIndex)})`,
                    opacity: matrixMode ? 0.3 : 1
                }}
            />

            {/* Matrix Effect */}
            {matrixMode && (
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 z-10"
                />
            )}

            {/* Clock */}
            {showClock && (
                <div className={`fixed top-5 right-5 px-6 py-3 rounded-lg backdrop-blur-md border z-20 ${isTron
                        ? 'bg-black/70 border-tron-cyan text-tron-cyan shadow-[0_0_20px_rgba(0,243,255,0.3)]'
                        : 'bg-black/70 border-white/20 text-white'
                    }`}>
                    <div className="text-2xl font-mono">
                        {currentTime.toLocaleTimeString()}
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 backdrop-blur-md border-t transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                } ${isTron
                    ? 'bg-black/70 border-tron-cyan'
                    : 'bg-black/70 border-white/20'
                }`}>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    <button
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        className={`px-4 py-2 rounded-lg border transition-all ${isTron
                                ? 'bg-black/50 border-tron-cyan text-tron-cyan hover:bg-tron-cyan/20'
                                : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                            }`}
                    >
                        ← Previous
                    </button>

                    <button
                        onClick={() => setIsPaused(prev => !prev)}
                        className={`px-4 py-2 rounded-lg border transition-all ${isTron
                                ? 'bg-black/50 border-tron-cyan text-tron-cyan hover:bg-tron-cyan/20'
                                : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                            }`}
                    >
                        {isPaused ? '▶ Resume' : '⏸ Pause'}
                    </button>

                    <button
                        onClick={() => setCurrentIndex(prev => prev + 1)}
                        className={`px-4 py-2 rounded-lg border transition-all ${isTron
                                ? 'bg-black/50 border-tron-cyan text-tron-cyan hover:bg-tron-cyan/20'
                                : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                            }`}
                    >
                        Next →
                    </button>

                    <button
                        onClick={() => setMatrixMode(prev => !prev)}
                        className={`px-4 py-2 rounded-lg border transition-all ${matrixMode
                                ? 'bg-green-500/30 border-green-500 text-green-400'
                                : isTron
                                    ? 'bg-black/50 border-tron-cyan text-tron-cyan hover:bg-tron-cyan/20'
                                    : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                            }`}
                    >
                        {matrixMode ? '✓ Matrix' : 'Matrix'}
                    </button>

                    <button
                        onClick={onToggleRadio}
                        className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${isTron
                                ? 'bg-black/50 border-tron-cyan text-tron-cyan hover:bg-tron-cyan/20'
                                : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                            }`}
                    >
                        🎵 Ranger Radio
                    </button>

                    <button
                        onClick={() => setShowClock(prev => !prev)}
                        className={`px-4 py-2 rounded-lg border transition-all ${isTron
                                ? 'bg-black/50 border-tron-cyan text-tron-cyan hover:bg-tron-cyan/20'
                                : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                            }`}
                    >
                        🕐 Clock
                    </button>

                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${isTron
                                ? 'bg-black/50 border-tron-orange text-tron-orange hover:bg-tron-orange/20'
                                : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                            }`}
                    >
                        <X size={16} /> Exit
                    </button>
                </div>

                {/* Keyboard Shortcuts Hint */}
                <div className="text-center mt-3 text-xs opacity-60 text-white">
                    <span className="font-mono">Space</span> = Pause •
                    <span className="font-mono"> ←/→</span> = Navigate •
                    <span className="font-mono"> M</span> = Matrix •
                    <span className="font-mono"> ESC</span> = Exit
                </div>
            </div>
        </div>
    );
};

export default RangerVisionMode;

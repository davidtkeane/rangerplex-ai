import React, { useEffect, useState } from 'react';
import { isElectron } from '../../utils/environmentDetector';
import { canvasStateService } from '../../services/canvasStateService';

interface CanvasPageProps {
    onClose?: () => void;
}

export default function CanvasPage({ onClose }: CanvasPageProps) {
    const [status, setStatus] = useState<'loading' | 'opened' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!isElectron()) {
            setStatus('error');
            setErrorMsg('Canvas window mode is only available in Electron');
            return;
        }

        // Load saved state
        const savedState = canvasStateService.getState();
        if (savedState) {
            console.log('[CanvasPage] Restoring saved state:', savedState);
        }

        // Listen for window state updates from main process
        // @ts-ignore - electronAPI is injected by preload
        const unsubscribe = window.electronAPI?.onCanvasWindowState?.((state: {
            windowState: { x: number; y: number; width: number; height: number };
            isMaximized: boolean;
            closed?: boolean;
        }) => {
            console.log('[CanvasPage] Received window state update:', state);
            canvasStateService.saveWindowState(state.windowState, state.isMaximized);
            if (state.closed) {
                console.log('[CanvasPage] Canvas window closed, state persisted');
            }
        });

        // Open Canvas in a new Electron window
        const openCanvas = async () => {
            try {
                // Get saved window bounds
                const windowBounds = canvasStateService.getWindowBounds();

                // @ts-ignore - electronAPI is injected by preload
                if (window.electronAPI?.openCanvasWindow) {
                    const result = await window.electronAPI.openCanvasWindow(windowBounds);
                    if (result.success) {
                        setStatus('opened');
                        canvasStateService.saveState({ lastOpened: Date.now() });
                    } else {
                        setStatus('error');
                        setErrorMsg(result.error || 'Failed to open Canvas window');
                    }
                } else {
                    setStatus('error');
                    setErrorMsg('Canvas window API not available');
                }
            } catch (err) {
                setStatus('error');
                setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
            }
        };

        openCanvas();

        // Cleanup listener on unmount
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    return (
        <div className="h-screen w-full bg-zinc-900 flex flex-col items-center justify-center text-white">
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-zinc-800/80 text-white rounded-full hover:bg-zinc-700 transition-colors z-50 shadow-lg"
                    title="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            )}

            <div className="text-center space-y-4">
                {status === 'loading' && (
                    <>
                        <div className="animate-pulse text-6xl mb-4">🎨</div>
                        <p className="text-zinc-400">Opening Canvas...</p>
                    </>
                )}

                {status === 'opened' && (
                    <>
                        <div className="text-6xl mb-4">🎨</div>
                        <h2 className="text-2xl font-bold text-purple-400">Canvas Opened!</h2>
                        <p className="text-zinc-400">Canvas is now open in a separate window.</p>
                        <p className="text-green-500 text-xs mt-2">
                            Window position will be remembered
                        </p>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                            >
                                Close This Panel
                            </button>
                        )}
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-red-400">Failed to Open Canvas</h2>
                        <p className="text-zinc-400">{errorMsg}</p>
                        <p className="text-zinc-500 text-sm mt-4">
                            Canvas will open in overlay mode instead.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

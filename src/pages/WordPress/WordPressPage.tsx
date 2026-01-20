import React, { useEffect, useState } from 'react';
import { wordpressStateService } from '../../services/wordpressStateService';

interface WordPressPageProps {
    onClose?: () => void;
    port?: number;
}

// Default WordPress port
const DEFAULT_WORDPRESS_PORT = 8081;

export default function WordPressPage({ onClose, port = DEFAULT_WORDPRESS_PORT }: WordPressPageProps) {
    const [status, setStatus] = useState<'loading' | 'opened' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [activePort, setActivePort] = useState(port);

    useEffect(() => {
        // Load saved state
        const savedState = wordpressStateService.getState();
        if (savedState) {
            console.log('[WordPressPage] Restoring saved state:', savedState);
        }

        // Listen for window state updates from main process
        // @ts-ignore - electronAPI is injected by preload
        const unsubscribe = window.electronAPI?.onWordPressWindowState?.((state: {
            windowState: { x: number; y: number; width: number; height: number };
            isMaximized: boolean;
            port: number;
            closed?: boolean;
        }) => {
            console.log('[WordPressPage] Received window state update:', state);
            wordpressStateService.saveWindowState(state.windowState, state.isMaximized);
            if (state.closed) {
                console.log('[WordPressPage] WordPress window closed, state persisted');
            }
        });

        // Open WordPress in a new Electron window (bypasses X-Frame-Options)
        const openWordPress = async () => {
            try {
                // Use saved port or prop port
                const portToUse = savedState?.port || port;
                setActivePort(portToUse);

                // Get saved window bounds
                const windowBounds = wordpressStateService.getWindowBounds();

                // @ts-ignore - electronAPI is injected by preload
                if (window.electronAPI?.openWordPressWindow) {
                    const result = await window.electronAPI.openWordPressWindow(null, portToUse, windowBounds);
                    if (result.success) {
                        setStatus('opened');
                        // Save the connection state
                        wordpressStateService.saveConnection(portToUse, result.url);
                    } else {
                        setStatus('error');
                        setErrorMsg(result.error || 'Failed to open WordPress window');
                    }
                } else {
                    // Fallback: open in system browser
                    // @ts-ignore
                    if (window.electronAPI?.openExternal) {
                        await window.electronAPI.openExternal(`http://localhost:${portToUse}/wp-admin`);
                        setStatus('opened');
                        wordpressStateService.saveConnection(portToUse);
                    } else {
                        // Last resort: regular window.open
                        window.open(`http://localhost:${portToUse}/wp-admin`, '_blank');
                        setStatus('opened');
                    }
                }
            } catch (err) {
                setStatus('error');
                setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
            }
        };

        openWordPress();

        // Cleanup listener on unmount
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [port]);

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
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-zinc-400">Opening WordPress Admin...</p>
                    </>
                )}

                {status === 'opened' && (
                    <>
                        <div className="text-6xl mb-4">📝</div>
                        <h2 className="text-2xl font-bold text-green-400">WordPress Opened!</h2>
                        <p className="text-zinc-400">WordPress Admin is now open in a separate window.</p>
                        <p className="text-zinc-500 text-sm mt-2">
                            URL: <code className="bg-zinc-800 px-2 py-1 rounded">http://localhost:{activePort}/wp-admin</code>
                        </p>
                        <p className="text-green-500 text-xs mt-2">
                            Window position will be remembered
                        </p>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                Close This Panel
                            </button>
                        )}
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-red-400">Failed to Open WordPress</h2>
                        <p className="text-zinc-400">{errorMsg}</p>
                        <div className="mt-4 space-y-2">
                            <p className="text-zinc-500 text-sm">Try opening manually:</p>
                            <a
                                href={`http://localhost:${activePort}/wp-admin`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                Open in Browser
                            </a>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

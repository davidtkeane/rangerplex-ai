import React, { useEffect, useState } from 'react';
import { isElectron } from '../../utils/environmentDetector';
import { vscodeStateService } from '../../services/vscodeStateService';

interface VSCodePageProps {
    onClose?: () => void;
}

// Default port for code-server (from ~/.config/code-server/config.yaml)
const DEFAULT_CODE_SERVER_PORT = 8181;

export default function VSCodePage({ onClose }: VSCodePageProps) {
    const [status, setStatus] = useState<'loading' | 'opened' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [port, setPort] = useState(DEFAULT_CODE_SERVER_PORT);
    const [lastWorkspace, setLastWorkspace] = useState<string | null>(null);

    useEffect(() => {
        if (!isElectron()) {
            setStatus('error');
            setErrorMsg('VS Code is only available in Electron mode');
            return;
        }

        // Load saved state
        const savedState = vscodeStateService.getState();
        if (savedState) {
            console.log('[VSCodePage] Restoring saved state:', savedState);
            setLastWorkspace(savedState.lastWorkspace);
        }

        // Listen for window state updates from main process
        // @ts-ignore - electronAPI is injected by preload
        const unsubscribe = window.electronAPI?.onVSCodeWindowState?.((state: {
            windowState: { x: number; y: number; width: number; height: number };
            isMaximized: boolean;
            port: number;
            closed?: boolean;
        }) => {
            console.log('[VSCodePage] Received window state update:', state);
            vscodeStateService.saveWindowState(state.windowState, state.isMaximized);
            if (state.closed) {
                console.log('[VSCodePage] VS Code window closed, state persisted');
            }
        });

        // Open VS Code in a new Electron window
        const openVSCode = async () => {
            try {
                // First check if code-server is running and get the port
                let activePort = savedState?.port || DEFAULT_CODE_SERVER_PORT;

                // @ts-ignore - electronAPI is injected by preload
                if (window.electronAPI?.checkVSCodeStatus) {
                    const statusResult = await window.electronAPI.checkVSCodeStatus();
                    if (statusResult?.running && statusResult?.port) {
                        activePort = statusResult.port;
                    } else if (!statusResult?.running) {
                        setStatus('error');
                        setErrorMsg('code-server is not running. Please start it first.');
                        return;
                    }
                }

                setPort(activePort);

                // Get saved window bounds
                const windowBounds = vscodeStateService.getWindowBounds();

                // @ts-ignore - electronAPI is injected by preload
                if (window.electronAPI?.openVSCodeWindow) {
                    const result = await window.electronAPI.openVSCodeWindow(activePort, windowBounds);
                    if (result.success) {
                        setStatus('opened');

                        // Save the connection state
                        vscodeStateService.saveConnection(activePort, result.url);
                    } else {
                        setStatus('error');
                        setErrorMsg(result.error || 'Failed to open VS Code window');
                    }
                } else {
                    // Fallback: open in system browser
                    // @ts-ignore
                    if (window.electronAPI?.openExternal) {
                        await window.electronAPI.openExternal(`http://localhost:${activePort}`);
                        setStatus('opened');
                        vscodeStateService.saveConnection(activePort);
                    } else {
                        window.open(`http://localhost:${activePort}`, '_blank');
                        setStatus('opened');
                    }
                }
            } catch (err) {
                setStatus('error');
                setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
            }
        };

        openVSCode();

        // Cleanup listener on unmount
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    return (
        <div className="h-screen w-full bg-[#1e1e1e] flex flex-col items-center justify-center text-white">
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
                        <div className="animate-spin text-5xl mb-4">⚙️</div>
                        <p className="text-zinc-400">Opening VS Code...</p>
                        {lastWorkspace && (
                            <p className="text-zinc-500 text-sm">
                                Restoring: <code className="bg-zinc-800 px-2 py-1 rounded">{lastWorkspace}</code>
                            </p>
                        )}
                    </>
                )}

                {status === 'opened' && (
                    <>
                        <div className="text-6xl mb-4">💻</div>
                        <h2 className="text-2xl font-bold text-blue-400">VS Code Opened!</h2>
                        <p className="text-zinc-400">VS Code is now open in a separate window.</p>
                        <p className="text-zinc-500 text-sm mt-2">
                            URL: <code className="bg-zinc-800 px-2 py-1 rounded">http://localhost:{port}</code>
                        </p>
                        {lastWorkspace && (
                            <p className="text-zinc-500 text-sm">
                                Workspace: <code className="bg-zinc-800 px-2 py-1 rounded">{lastWorkspace}</code>
                            </p>
                        )}
                        <p className="text-green-500 text-xs mt-2">
                            ✓ Window position will be remembered
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
                        <h2 className="text-2xl font-bold text-red-400">Failed to Open VS Code</h2>
                        <p className="text-zinc-400">{errorMsg}</p>
                        <div className="mt-4 space-y-2">
                            <p className="text-zinc-500 text-sm">Try opening manually:</p>
                            <a
                                href={`http://localhost:${port}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                Open in Browser
                            </a>
                        </div>
                        <div className="mt-6 text-zinc-600 text-sm">
                            <p>Make sure code-server is running:</p>
                            <code className="bg-zinc-800 px-2 py-1 rounded block mt-2">code-server</code>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

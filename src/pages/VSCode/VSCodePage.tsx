import React, { useEffect, useState } from 'react';
import { isElectron } from '../../utils/environmentDetector';

interface VSCodePageProps {
    onClose?: () => void;
}

export default function VSCodePage({ onClose }: VSCodePageProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!isElectron()) {
            setError('VS Code is only available in Electron mode');
            setLoading(false);
            return;
        }

        // Check if code-server is running
        const checkServer = async () => {
            try {
                // Use IPC if available to avoid CORS issues
                if ((window as any).electronAPI?.checkVSCodeStatus) {
                    const isRunning = await (window as any).electronAPI.checkVSCodeStatus();
                    if (isRunning) {
                        setIframeUrl('http://localhost:8081');
                        setLoading(false);
                        return;
                    }
                } else {
                    // Fallback to fetch (might fail due to CORS)
                    const response = await fetch('http://localhost:8081/healthz');
                    if (response.ok) {
                        setIframeUrl('http://localhost:8081');
                        setLoading(false);
                        return;
                    }
                }
                throw new Error('Server not ready');
            } catch (err) {
                // Retry a few times or show error
                setTimeout(checkServer, 1000);
            }
        };

        checkServer();
    }, []);

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#1e1e1e] text-white relative">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors z-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                )}
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">VS Code Not Available</h2>
                    <p className="text-gray-400">{error}</p>
                    <p className="text-sm text-gray-500 mt-4">
                        Please run RangerPlex in Electron mode to use VS Code.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#1e1e1e] text-white relative">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors z-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                )}
                <div className="text-center">
                    <div className="animate-spin text-4xl mb-4">🔨</div>
                    <p>Starting VS Code...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[#1e1e1e] relative">
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-2 bg-zinc-800/80 text-white rounded-full hover:bg-zinc-700 transition-colors z-50 shadow-lg"
                    title="Close VS Code"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            )}
            <iframe
                src={iframeUrl || ''}
                className="w-full h-full border-0"
                title="VS Code"
                allow="clipboard-read; clipboard-write"
            />
        </div>
    );
}

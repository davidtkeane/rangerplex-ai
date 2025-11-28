import React from 'react';

interface UpdateNotificationProps {
    version: string;
    message: string;
    onInstall: () => void;
    onDismiss: () => void;
    isInstalling: boolean;
    theme: 'light' | 'dark' | 'tron';
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({
    version,
    message,
    onInstall,
    onDismiss,
    isInstalling,
    theme
}) => {
    const isTron = theme === 'tron';

    return (
        <div className={`fixed bottom-20 right-4 z-[10000] max-w-sm w-full p-4 rounded-lg shadow-2xl border backdrop-blur-md transition-all duration-300 animate-slide-up ${isTron
                ? 'bg-black/80 border-tron-cyan text-tron-cyan shadow-[0_0_20px_rgba(0,243,255,0.3)]'
                : 'bg-white/90 dark:bg-zinc-900/90 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white'
            }`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${isTron ? 'bg-tron-cyan/20 text-tron-cyan' : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'}`}>
                    <i className="fa-solid fa-rocket text-xl"></i>
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-lg leading-tight mb-1">Update Available!</h3>
                    <p className="text-xs font-mono opacity-80 mb-2">v{version}</p>
                    <p className="text-sm opacity-90 mb-4 line-clamp-3">{message}</p>

                    <div className="flex gap-2">
                        <button
                            onClick={onInstall}
                            disabled={isInstalling}
                            className={`flex-1 py-2 px-3 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all ${isTron
                                    ? 'bg-tron-cyan text-black hover:bg-white hover:shadow-[0_0_15px_rgba(0,243,255,0.6)]'
                                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isInstalling ? (
                                <>
                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                    Installing...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-download"></i>
                                    Install Now
                                </>
                            )}
                        </button>
                        <button
                            onClick={onDismiss}
                            disabled={isInstalling}
                            className={`px-3 rounded font-bold text-sm transition-colors ${isTron
                                    ? 'border border-tron-cyan/30 hover:bg-tron-cyan/10'
                                    : 'bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700'
                                }`}
                        >
                            Later
                        </button>
                    </div>
                </div>
                <button
                    onClick={onDismiss}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>
        </div>
    );
};

export default UpdateNotification;

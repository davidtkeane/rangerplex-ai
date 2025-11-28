import React from 'react';

interface AppChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    options: {
        label: string;
        description: string;
        icon: string;
        onClick: () => void;
    }[];
}

const AppChoiceModal: React.FC<AppChoiceModalProps> = ({
    isOpen,
    onClose,
    title,
    options
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl max-w-md w-full mx-4 border border-zinc-200 dark:border-zinc-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-700">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                    >
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                {/* Options */}
                <div className="p-6 space-y-3">
                    {options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                option.onClick();
                                onClose();
                            }}
                            className="w-full flex items-start gap-4 p-4 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-zinc-700 transition-all group"
                        >
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                <i className={`${option.icon} text-blue-600 dark:text-blue-400`}></i>
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">
                                    {option.label}
                                </h3>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    {option.description}
                                </p>
                            </div>
                            <div className="flex-shrink-0">
                                <i className="fa-solid fa-chevron-right text-zinc-400 group-hover:text-blue-500 transition-colors"></i>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer Hint */}
                <div className="px-6 pb-6 text-center">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        💡 Tip: Set your default in Settings to skip this choice
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AppChoiceModal;

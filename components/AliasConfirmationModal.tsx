import React from 'react';
import type { Alias } from '../services/aliasService';

interface AliasConfirmationModalProps {
    isOpen: boolean;
    alias: Alias | null;
    onConfirm: () => void;
    onCancel: () => void;
}

const AliasConfirmationModal: React.FC<AliasConfirmationModalProps> = ({
    isOpen,
    alias,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen || !alias) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={onCancel}
        >
            <div
                className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl max-w-lg w-full mx-4 border border-zinc-200 dark:border-zinc-700 animate-fade-up"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{alias.icon || '⚡'}</span>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Execute Alias: {alias.name}</h2>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">{alias.description}</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Command */}
                    <div>
                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">💻 Command:</label>
                        <pre className="mt-1 p-3 bg-zinc-100 dark:bg-zinc-800 rounded text-sm font-mono overflow-x-auto">
                            {alias.command}
                        </pre>
                    </div>

                    {/* Working Directory */}
                    <div>
                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">📂 Working Directory:</label>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 font-mono">{alias.cwd || '/Users/ranger/rangerplex-ai'}</p>
                    </div>

                    {/* Tags */}
                    {alias.tags && alias.tags.length > 0 && (
                        <div>
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">🏷️ Tags:</label>
                            <div className="mt-1 flex gap-2 flex-wrap">
                                {alias.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Warning */}
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            ⚠️ This command will be executed on your system. Make sure you trust it.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-200 dark:border-zinc-700">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-2"
                    >
                        <i className="fa-solid fa-check"></i>
                        Execute
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AliasConfirmationModal;

import React from 'react';

export interface WorkspaceTab {
    id: string;
    type: 'chat' | 'notes' | 'terminal' | 'browser' | 'wordpress' | 'canvas';
    title: string;
    icon?: string;
    data?: any;
    isPinned?: boolean;
}

interface WorkspaceTabsProps {
    tabs: WorkspaceTab[];
    activeTabId: string;
    onSelect: (id: string) => void;
    onClose: (id: string) => void;
    isTron?: boolean;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
    tabs,
    activeTabId,
    onSelect,
    onClose,
    isTron
}) => {
    return (
        <div className={`flex items-center gap-1 px-2 pt-2 border-b select-none overflow-x-auto scrollbar-hide ${isTron
                ? 'bg-black border-tron-cyan/30'
                : 'bg-gray-100 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800'
            }`}>
            {tabs.map(tab => {
                const isActive = tab.id === activeTabId;
                return (
                    <div
                        key={tab.id}
                        onClick={() => onSelect(tab.id)}
                        className={`
              group relative flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-all min-w-[120px] max-w-[200px]
              ${isActive
                                ? (isTron
                                    ? 'bg-tron-dark border-t border-x border-tron-cyan text-tron-cyan shadow-[0_-5px_15px_rgba(0,243,255,0.1)]'
                                    : 'bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 shadow-sm')
                                : (isTron
                                    ? 'text-tron-cyan/50 hover:text-tron-cyan hover:bg-tron-cyan/10'
                                    : 'text-gray-500 dark:text-zinc-500 hover:bg-gray-200 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-zinc-300')
                            }
            `}
                    >
                        {/* Active Indicator Line (Top) */}
                        {isActive && (
                            <div className={`absolute top-0 left-0 right-0 h-0.5 ${isTron ? 'bg-tron-cyan shadow-[0_0_10px_#00f3ff]' : 'bg-teal-500'}`} />
                        )}

                        {/* Icon */}
                        <i className={`${tab.icon || 'fa-solid fa-window-maximize'} text-xs ${isActive ? '' : 'opacity-70'}`}></i>

                        {/* Title */}
                        <span className="text-xs font-bold truncate flex-1">{tab.title}</span>

                        {/* Close Button (if not pinned) */}
                        {!tab.isPinned && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose(tab.id);
                                }}
                                className={`
                  w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                  ${isTron ? 'hover:bg-tron-cyan/20 hover:text-tron-orange' : 'hover:bg-gray-300 dark:hover:bg-zinc-700 hover:text-red-500'}
                `}
                            >
                                <i className="fa-solid fa-xmark text-[10px]"></i>
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

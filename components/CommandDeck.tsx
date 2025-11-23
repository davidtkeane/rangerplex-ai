
import React from 'react';

export interface CommandState {
    web: boolean;
    visual: boolean;
    flash: boolean;
    deep: boolean;
}

interface CommandDeckProps {
    state: CommandState;
    onChange: (key: keyof CommandState) => void;
    isTron?: boolean;
}

const CommandDeck: React.FC<CommandDeckProps> = ({ state, onChange, isTron }) => {
    const buttons = [
        { key: 'web', icon: 'fa-globe', label: 'WEB' },
        { key: 'visual', icon: 'fa-image', label: 'VISUAL' },
        { key: 'flash', icon: 'fa-bolt', label: 'FLASH' },
        { key: 'deep', icon: 'fa-brain', label: 'DEEP' },
    ];

    return (
        <div className="flex items-center justify-center gap-3 mt-3">
            {buttons.map(({ key, icon, label }) => {
                const isActive = state[key as keyof CommandState];
                return (
                    <button
                        key={key}
                        onClick={() => onChange(key as keyof CommandState)}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border
                            ${isActive 
                                ? (isTron 
                                    ? 'bg-tron-cyan text-black border-tron-cyan shadow-[0_0_10px_#00f3ff]' 
                                    : 'bg-teal-600 text-white border-teal-500 shadow-lg') 
                                : (isTron
                                    ? 'bg-transparent text-tron-cyan/50 border-tron-cyan/20 hover:border-tron-cyan/50 hover:text-tron-cyan'
                                    : 'bg-transparent text-gray-400 dark:text-zinc-500 border-transparent hover:bg-gray-100 dark:hover:bg-zinc-800')
                            }
                        `}
                    >
                        <i className={`fa-solid ${icon}`}></i>
                        <span>{label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default CommandDeck;

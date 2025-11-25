
import React, { useState } from 'react';
import { ChatSession, AppSettings } from '../types';
import PetWidget from './PetWidget';
import { PetState } from '../src/hooks/usePetState';

interface SidebarProps {
    isOpen: boolean;
    sessions: ChatSession[];
    currentId: string | null;
    currentUser?: string;
    isDarkMode: boolean;
    settings: AppSettings;
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string) => void;
    onRename: (id: string, title: string) => void;
    onDeleteAll: () => void;
    onToggleStar: (id: string) => void;
    onLogout: () => void;
    onToggleTheme: () => void;
    onToggleMatrix: () => void;
    onOpenTraining: () => void;
    onOpenStudyNotes: () => void;
    onOpenStudyClock?: () => void;
    onOpenCanvas?: () => void;
    onLock: () => void;
    onOpenVisionMode: () => void;
    toggleSidebar: () => void;
    petBridge?: {
        pet: PetState | null;
        isHydrated: boolean;
        welcomeMessage: string | null;
        adoptPet: (name: string, species?: PetState['species']) => void;
        recordVisit: () => void;
        feedPet: () => void;
        playWithPet: () => void;
    };
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    sessions,
    currentId,
    currentUser,
    settings,
    onSelect,
    onNew,
    onDelete,
    onRename,
    onDeleteAll,
    onToggleStar,
    onLogout,
    onToggleTheme,
    onToggleMatrix,
    onOpenTraining,
    onOpenStudyNotes,
    onOpenStudyClock,
    onOpenCanvas,
    onLock,
    onOpenVisionMode,
    toggleSidebar,
    petBridge,
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [burst, setBurst] = useState<{ id: string, visible: boolean }>({ id: '', visible: false });
    const isTron = settings.theme === 'tron';
    const isMatrix = settings.matrixMode;

    const starredSessions = sessions.filter(s => s.isStarred);
    const recentSessions = sessions.filter(s => !s.isStarred);

    const stopEvent = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const renderSessionItem = (session: ChatSession) => (
        <li key={session.id} className="group relative px-2 py-1">
            {editingId === session.id ? (
                <div className={`flex items-center gap-2 px-3 py-2 rounded ${isTron ? 'bg-tron-cyan/10 border border-tron-cyan/50' : 'bg-zinc-800/50 border border-zinc-700'}`}>
                    <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (editValue.trim()) {
                                    onRename(session.id, editValue.trim());
                                    setBurst({ id: session.id, visible: true });
                                }
                                setEditingId(null);
                            }
                            if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="flex-1 bg-transparent outline-none text-sm"
                    />
                    <button
                        onClick={() => {
                            if (editValue.trim()) {
                                onRename(session.id, editValue.trim());
                                setBurst({ id: session.id, visible: true });
                                setTimeout(() => setBurst({ id: '', visible: false }), 800);
                            }
                            setEditingId(null);
                        }}
                        className="text-xs px-2 py-1 rounded bg-green-600 text-white"
                    >
                        Save
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => onSelect(session.id)}
                    onDoubleClick={() => { setEditingId(session.id); setEditValue(session.title); }}
                    className={`
                w-full text-left px-3 py-2 rounded text-sm truncate transition-all pr-16
                ${currentId === session.id
                            ? (isTron ? 'bg-tron-cyan/20 text-tron-cyan border border-tron-cyan/50 shadow-[0_0_10px_rgba(0,243,255,0.2)]' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white')
                            : (isTron ? 'text-tron-cyan/60 hover:text-tron-cyan hover:bg-tron-cyan/10' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50')
                        }
                `}
                >
                    {session.title}
                </button>
            )}
            {editingId !== session.id && (
                <div
                    className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity z-[120] rounded px-1 pointer-events-auto ${isTron ? 'bg-black/80' : 'bg-gray-50/90 dark:bg-zinc-900/90'}`}
                    role="group"
                    aria-label="Chat actions"
                >
                    <button
                        type="button"
                        onClick={(e) => {
                            stopEvent(e);
                            setEditingId(session.id);
                            setEditValue(session.title);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-blue-400 cursor-pointer relative z-50"
                        title="Rename"
                        aria-label="Rename chat"
                    >
                        <i className="fa-solid fa-pen text-xs pointer-events-none"></i>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            stopEvent(e);
                            onToggleStar(session.id);
                        }}
                        className={`p-1.5 cursor-pointer relative z-50 ${session.isStarred ? 'text-amber-400' : 'text-zinc-400 hover:text-amber-400'}`}
                        title={session.isStarred ? 'Unstar' : 'Star'}
                        aria-label={session.isStarred ? 'Unstar chat' : 'Star chat'}
                    >
                        <i className={`${session.isStarred ? 'fa-solid' : 'fa-regular'} fa-star text-xs pointer-events-none`}></i>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            stopEvent(e);
                            onDelete(session.id);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-red-400 cursor-pointer relative z-50"
                        title="Delete"
                        aria-label="Delete chat"
                    >
                        <i className="fa-solid fa-trash text-xs pointer-events-none"></i>
                    </button>
                </div>
            )}
            {settings.celebrationEffects && burst.visible && burst.id === session.id && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {[...Array(12)].map((_, idx) => (
                        <span
                            key={idx}
                            className={`absolute text-xs animate-burst`}
                            style={{
                                left: '50%',
                                top: '50%',
                                transform: `translate(-50%, -50%) rotate(${idx * 30}deg) translateY(-6px)`,
                                color: isTron ? '#00f3ff' : isMatrix ? '#22c55e' : '#fbbf24'
                            }}
                        >
                            ✦
                        </span>
                    ))}
                    <style>{`
                        @keyframes burst {
                            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
                            60% { opacity: 1; }
                            100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
                        }
                        .animate-burst { animation: burst 0.7s ease-out forwards; }
                    `}</style>
                </div>
            )}
        </li>
    );

    return (
        <>
            {isOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={toggleSidebar} />}

            <aside className={`
          fixed top-0 left-0 md:left-auto z-[100] h-screen w-72 flex flex-col transition-transform duration-300 border-r
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isTron ? 'bg-black border-tron-cyan/30 font-tron' : 'bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800'}
      `}>
                <div className={`flex-shrink-0 p-4 border-b flex items-center justify-between ${isTron ? 'border-tron-cyan/30 text-tron-cyan' : 'border-gray-200 dark:border-zinc-800'}`}>
                    <div className="flex items-center gap-2 font-bold tracking-widest">
                        <i className={`fa-solid ${isTron ? 'fa-network-wired' : 'fa-layer-group'}`}></i>
                        <span>{isTron ? 'THE GRID' : 'RANGERPLEX'}</span>
                    </div>
                    <button onClick={toggleSidebar} className="md:hidden"><i className="fa-solid fa-xmark"></i></button>
                </div>

                <div className="flex-shrink-0 p-3">
                    <button onClick={onNew} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all font-bold uppercase tracking-wider text-xs ${isTron ? 'bg-tron-cyan/10 border border-tron-cyan text-tron-cyan hover:bg-tron-cyan hover:text-black hover:shadow-[0_0_15px_#00f3ff]' : 'bg-white dark:bg-zinc-100 hover:bg-gray-50'}`}>
                        <i className="fa-solid fa-plus"></i> <span>{isTron ? 'NEW_PROGRAM' : 'New Thread'}</span>
                    </button>
                </div>

                {/* Compact Icon Grid for Quick Actions */}
                <div className={`flex-shrink-0 px-3 py-2 border-b ${isTron ? 'border-tron-cyan/30' : 'border-gray-200 dark:border-zinc-800'}`}>
                    <div className="grid grid-cols-3 gap-2">
                        {/* Study Notes */}
                        <button
                            onClick={onOpenStudyNotes}
                            title="Study Notes"
                            className={`flex flex-col items-center justify-center p-2 rounded transition-all ${isTron ? 'hover:bg-tron-cyan/10 text-tron-cyan/70 hover:text-tron-cyan' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400'}`}
                        >
                            <i className="fa-solid fa-book-open text-lg mb-1"></i>
                            <span className="text-[9px] uppercase tracking-wide">Notes</span>
                        </button>

                        {/* Study Clock */}
                        {onOpenStudyClock && (
                            <button
                                onClick={onOpenStudyClock}
                                title="Study Clock"
                                className={`flex flex-col items-center justify-center p-2 rounded transition-all ${isTron ? 'hover:bg-tron-cyan/10 text-tron-cyan/70 hover:text-tron-cyan' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400'}`}
                            >
                                <i className="fa-solid fa-clock text-lg mb-1"></i>
                                <span className="text-[9px] uppercase tracking-wide">Study</span>
                            </button>
                        )}

                        {/* Canvas Board */}
                        {onOpenCanvas && (
                            <button
                                onClick={onOpenCanvas}
                                title="Canvas Board"
                                className={`flex flex-col items-center justify-center p-2 rounded transition-all ${isTron ? 'hover:bg-tron-cyan/10 text-tron-cyan/70 hover:text-tron-cyan' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400'}`}
                            >
                                <i className="fa-solid fa-paintbrush text-lg mb-1"></i>
                                <span className="text-[9px] uppercase tracking-wide">Canvas</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
                    {starredSessions.length > 0 && (
                        <div className="mb-4">
                            <div className={`px-5 pb-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${isTron ? 'text-tron-orange' : 'text-gray-400'}`}>
                                <i className="fa-solid fa-star"></i> Priority
                            </div>
                            <ul>{starredSessions.map(renderSessionItem)}</ul>
                        </div>
                    )}
                    <div className="flex items-center justify-between px-5 pb-2">
                        <div className={`text-[10px] font-bold uppercase tracking-wider ${isTron ? 'text-tron-cyan/50' : 'text-gray-400'}`}>Recent Logs</div>
                        <button
                            onClick={onNew}
                            className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border transition-all ${isTron ? 'border-tron-cyan/50 text-tron-cyan hover:bg-tron-cyan/10' : 'border-gray-300 text-gray-600 dark:text-zinc-300 hover:bg-gray-200/40 dark:hover:bg-zinc-800/40'}`}
                            title="New Chat"
                        >
                            <i className="fa-solid fa-plus mr-1"></i> New
                        </button>
                    </div>
                    <ul>{recentSessions.map(renderSessionItem)}</ul>
                </div>

                {/* Pet Widget */}
                <div className="flex-shrink-0">
                    <PetWidget
                        isTron={isTron}
                        settings={settings}
                        currentUser={currentUser || undefined}
                        petBridge={petBridge}
                    />
                </div>

                <div className={`flex-shrink-0 p-4 border-t ${isTron ? 'border-tron-cyan/30 bg-black' : 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900'}`}>
                    {currentUser && (
                        <div className={`flex items-center justify-between p-2 rounded mb-2 ${isTron ? 'border border-tron-cyan/30' : 'bg-white dark:bg-zinc-800/50 border dark:border-zinc-700'}`}>
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${isTron ? 'bg-tron-cyan text-black' : 'bg-teal-800 text-white'}`}>
                                    {currentUser.substring(0, 2).toUpperCase()}
                                </div>
                                <span className={`text-xs font-bold truncate ${isTron ? 'text-tron-cyan' : 'dark:text-zinc-300'}`}>{currentUser}</span>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={onToggleMatrix} className={`w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 ${settings.matrixMode ? 'text-green-500' : 'text-zinc-500'}`}><i className="fa-solid fa-capsules"></i></button>
                                <button onClick={onToggleTheme} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-zinc-500"><i className={`fa-solid ${isTron ? 'fa-cube text-tron-cyan' : settings.theme === 'light' ? 'fa-sun' : 'fa-moon'}`}></i></button>
                                <button onClick={onOpenVisionMode} className={`w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 ${isTron ? 'text-tron-cyan hover:text-tron-orange' : 'text-zinc-500 hover:text-purple-500'}`} title="Ranger Vision Mode"><i className="fa-solid fa-eye"></i></button>
                                <button onClick={onLock} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-zinc-500 hover:text-amber-500"><i className="fa-solid fa-lock"></i></button>
                                <button onClick={onLogout} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-zinc-500 hover:text-red-500"><i className="fa-solid fa-power-off"></i></button>
                            </div>
                        </div>
                    )}
                    <div className={`text-[10px] text-center ${isTron ? 'text-tron-cyan/40' : 'text-zinc-500'}`}>v2.4.10 // SAVE TOAST POLISH ✨</div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

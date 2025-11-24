
import React, { useState } from 'react';
import { ChatSession, AppSettings } from '../types';
import { downloadFile, exportConversationMarkdown } from '../services/trainingService';
import { dbService } from '../services/dbService';
import PetWidget from './PetWidget';

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
    onOpenCanvas?: () => void;
    onLock: () => void;
    onOpenVisionMode: () => void;
    toggleSidebar: () => void;
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
    onOpenCanvas,
    onLock,
    onOpenVisionMode,
    toggleSidebar,
}) => {
    const [showOptions, setShowOptions] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [burst, setBurst] = useState<{ id: string, visible: boolean }>({ id: '', visible: false });
    const [showPurgeWarning, setShowPurgeWarning] = useState(false);
    const isTron = settings.theme === 'tron';
    const isMatrix = settings.matrixMode;

    const handleExportChat = (session: ChatSession) => {
        const md = exportConversationMarkdown(session);
        downloadFile(md, `${session.title.replace(/[^a-z0-9]/gi, '_')}.md`, 'text/markdown');
    };

    const handleExportAll = async () => {
        try {
            const data = await dbService.exportAll();
            const json = JSON.stringify(data, null, 2);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            downloadFile(json, `rangerplex-backup-${timestamp}.json`, 'application/json');
        } catch (error) {
            console.error('Export all failed:', error);
            alert('Failed to export data. Please try again.');
        }
    };

    const handleDownloadBeforePurge = async () => {
        await handleExportAll();
        // Don't close the warning - let user confirm after downloading
    };

    const handleConfirmPurge = async () => {
        try {
            // Clear IndexedDB
            await dbService.clearChats();
            await dbService.clearSettings();
            await dbService.clearAllWin95States();

            // Clear canvas boards from localStorage
            localStorage.removeItem('rangerplex_canvas_boards');

            // Clear Win95 state from localStorage
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('win95_state_')) {
                    localStorage.removeItem(key);
                }
            });

            // Clear state
            onDeleteAll();
            setShowPurgeWarning(false);
        } catch (error) {
            console.error('Purge failed:', error);
            alert('Failed to purge data. Please try again.');
        }
    };

    const starredSessions = sessions.filter(s => s.isStarred);
    const recentSessions = sessions.filter(s => !s.isStarred);

    const SessionItem: React.FC<{ session: ChatSession }> = ({ session }) => (
        <li className="group relative px-2 py-1">
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
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(session.id);
                            setEditValue(session.title);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-blue-400"
                        title="Rename"
                    >
                        <i className="fa-solid fa-pen text-xs"></i>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onToggleStar(session.id); }} className={`p-1.5 ${session.isStarred ? 'text-amber-400' : 'text-zinc-400 hover:text-amber-400'}`}>
                        <i className={`${session.isStarred ? 'fa-solid' : 'fa-regular'} fa-star text-xs`}></i>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(session.id); }} className="p-1.5 text-zinc-400 hover:text-red-400"><i className="fa-solid fa-trash text-xs"></i></button>
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
          fixed md:relative z-50 h-full w-72 flex flex-col transition-transform duration-300 border-r
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}
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

                <div className={`flex-shrink-0 px-4 py-2 border-b ${isTron ? 'border-tron-cyan/30 text-tron-cyan/70' : 'border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400'}`}>
                    <button onClick={onOpenTraining} className="flex items-center gap-3 px-3 py-2 text-sm w-full hover:opacity-100 transition-opacity opacity-70">
                        <i className="fa-solid fa-dumbbell w-4"></i> Model Training
                    </button>
                    <button onClick={onOpenStudyNotes} className="flex items-center gap-3 px-3 py-2 text-sm w-full hover:opacity-100 transition-opacity opacity-70">
                        <i className="fa-solid fa-book-open w-4"></i> Study Notes
                    </button>
                    {onOpenCanvas && (
                        <button onClick={onOpenCanvas} className="flex items-center gap-3 px-3 py-2 text-sm w-full hover:opacity-100 transition-opacity opacity-70">
                            <i className="fa-solid fa-paintbrush w-4"></i> Canvas Board
                        </button>
                    )}
                    <div className="relative">
                        <button onClick={() => setShowOptions(!showOptions)} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:opacity-100 transition-opacity opacity-70">
                            <div className="flex items-center gap-3"><i className="fa-solid fa-database w-4"></i> Data & Export</div>
                            <i className="fa-solid fa-chevron-down text-[10px]"></i>
                        </button>
                        {showOptions && (
                            <div className="pl-10 pr-2 pb-2 text-xs space-y-2">
                                {currentId && sessions.find(s => s.id === currentId) && (
                                    <button
                                        onClick={() => {
                                            const session = sessions.find(s => s.id === currentId);
                                            if (session) handleExportChat(session);
                                        }}
                                        className={`block w-full text-left ${isTron ? 'text-tron-cyan hover:text-tron-orange' : 'text-blue-500 hover:text-blue-400'}`}
                                    >
                                        <i className="fa-solid fa-file-export mr-2"></i>Export Current Chat
                                    </button>
                                )}
                                <button
                                    onClick={handleExportAll}
                                    className={`block w-full text-left ${isTron ? 'text-tron-cyan hover:text-tron-orange' : 'text-blue-500 hover:text-blue-400'}`}
                                >
                                    <i className="fa-solid fa-download mr-2"></i>Export All Data
                                </button>
                                <button
                                    onClick={() => setShowPurgeWarning(true)}
                                    className="text-red-500 hover:text-red-400 block w-full text-left"
                                >
                                    <i className="fa-solid fa-trash-can mr-2"></i>Purge All Data
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
                    {starredSessions.length > 0 && (
                        <div className="mb-4">
                            <div className={`px-5 pb-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${isTron ? 'text-tron-orange' : 'text-gray-400'}`}>
                                <i className="fa-solid fa-star"></i> Priority
                            </div>
                            <ul>{starredSessions.map(s => <SessionItem key={s.id} session={s} />)}</ul>
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
                    <ul>{recentSessions.map(s => <SessionItem key={s.id} session={s} />)}</ul>
                </div>

                {/* Pet Widget */}
                <div className="flex-shrink-0">
                    <PetWidget isTron={isTron} settings={settings} />
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
                    <div className={`text-[10px] text-center ${isTron ? 'text-tron-cyan/40' : 'text-zinc-500'}`}>v2.4.7 // IMAGE PERSISTENCE & PET AVATARS 🐾</div>
                </div>
            </aside>

            {/* Custom Purge Warning Dialog with Download Option */}
            {showPurgeWarning && (
                <div
                    className={`modal-backdrop modal-backdrop-${settings.theme}`}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowPurgeWarning(false);
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="purge-warning-title"
                >
                    <div className={`warning-dialog warning-dialog-${settings.theme}`} style={{ maxWidth: '500px' }}>
                        {/* Warning Icon */}
                        <div className="warning-icon">
                            <span className="icon-emoji">⚠️</span>
                        </div>

                        {/* Title */}
                        <h2 id="purge-warning-title" className="warning-title">
                            Purge All Data?
                        </h2>

                        {/* Message */}
                        <p className="warning-message" style={{ marginBottom: '1rem' }}>
                            This will permanently delete <strong>ALL</strong> of your data:
                        </p>
                        <ul className="warning-message" style={{ textAlign: 'left', marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
                            <li>All chat conversations</li>
                            <li>All canvas boards</li>
                            <li>All settings and preferences</li>
                            <li>All training data</li>
                        </ul>
                        <p className={`warning-message ${isTron ? 'text-tron-orange' : 'text-amber-500'}`} style={{ fontWeight: 'bold' }}>
                            This action cannot be undone!
                        </p>

                        {/* Buttons */}
                        <div className="warning-buttons" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                className={`warning-btn ${isTron ? 'bg-tron-cyan/20 border border-tron-cyan text-tron-cyan hover:bg-tron-cyan/30' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                onClick={async () => {
                                    await handleDownloadBeforePurge();
                                    // Show success message
                                    alert('✅ Backup downloaded! You can now safely delete your data or cancel.');
                                }}
                                style={{ width: '100%', padding: '0.75rem' }}
                            >
                                <i className="fa-solid fa-download mr-2"></i>
                                Download Backup First
                            </button>

                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                                <button
                                    className={`warning-btn warning-cancel-btn warning-cancel-btn-${settings.theme}`}
                                    onClick={() => setShowPurgeWarning(false)}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={`warning-btn warning-confirm-btn warning-confirm-btn-${settings.theme} dangerous`}
                                    onClick={handleConfirmPurge}
                                    style={{ flex: 1 }}
                                >
                                    <i className="fa-solid fa-trash-can mr-2"></i>
                                    Delete All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;

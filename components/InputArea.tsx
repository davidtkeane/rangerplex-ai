
import React, { useState, useRef, useEffect } from 'react';
import { Attachment, CommandState, AppSettings } from '../types';
import CommandDeck from './CommandDeck';
import { startListening, stopListening } from '../services/voiceService';
import { aliasService, type Alias } from '../services/aliasService';

interface InputAreaProps {
    onSend: (text: string, attachments: Attachment[], commandState: CommandState, isPetChat: boolean) => void;
    onStop: () => void;
    isStreaming: boolean;
    settings: AppSettings;
    isTron?: boolean;
    onOpenSettings: () => void;
    onToggleHolidayMode: () => void;
    onCycleHolidayEffect: () => void;
    holidayMode: boolean;
    holidayEffect: 'snow' | 'confetti' | 'sparkles';
    showHolidayButtons: boolean;
    onPetCommand: () => void; // New prop for handling /pet command
}

const MAX_FILES = 5;
const MAX_SIZE_MB = 10;

const InputArea: React.FC<InputAreaProps> = ({
    onSend,
    onStop,
    isStreaming,
    settings,
    isTron,
    onOpenSettings,
    onToggleHolidayMode,
    onCycleHolidayEffect,
    holidayMode,
    holidayEffect,
    showHolidayButtons,
    onPetCommand // Destructure new prop
}) => {
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showPromptMenu, setShowPromptMenu] = useState(false);
    const [aliasSuggestions, setAliasSuggestions] = useState<Alias[]>([]);
    const [showAliasSuggestions, setShowAliasSuggestions] = useState(false);

    const [commandState, setCommandState] = useState<CommandState>({
        web: false, visual: false, flash: false, deep: false
    });
    const [activeAliasIndex, setActiveAliasIndex] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Slash Command Logic
    const filteredPrompts = input.startsWith('/')
        ? settings.savedPrompts.filter(p => p.trigger.startsWith(input.slice(1)))
        : [];

    useEffect(() => {
        setShowPromptMenu(input.startsWith('/') && filteredPrompts.length > 0);
    }, [input, settings.savedPrompts]);

    // Preload default aliases for suggestions
    useEffect(() => {
        aliasService.loadDefaultAliases().catch(() => { /* ignore */ });
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(e.target as Node)) {
                setShowAliasSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePromptSelect = (text: string) => {
        setInput(text);
        setShowPromptMenu(false);
        textareaRef.current?.focus();
    };

    const selectAlias = (alias: Alias) => {
        setInput(alias.name);
        setShowAliasSuggestions(false);
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showAliasSuggestions && aliasSuggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveAliasIndex(prev => (prev + 1) % aliasSuggestions.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveAliasIndex(prev => (prev - 1 + aliasSuggestions.length) % aliasSuggestions.length);
                return;
            }
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                selectAlias(aliasSuggestions[activeAliasIndex] || aliasSuggestions[0]);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (showPromptMenu && filteredPrompts.length > 0) {
                handlePromptSelect(filteredPrompts[0].text);
            } else {
                handleSubmit();
            }
        }
        if (e.key === 'Tab' && showPromptMenu && filteredPrompts.length > 0) {
            e.preventDefault();
            handlePromptSelect(filteredPrompts[0].text);
        }
    };

    const handleSubmit = () => {
        const trimmedInput = input.trim();
        if ((!trimmedInput && attachments.length === 0) || isStreaming) return;

        const isPetChat = trimmedInput.startsWith('/pet-chat');
        const textToSend = isPetChat ? trimmedInput.replace('/pet-chat', '').trim() : trimmedInput;

        if (trimmedInput === '/pet') {
            onPetCommand(); // Call the new pet command handler
            setInput('');
            setAttachments([]);
            setCommandState({ web: false, visual: false, flash: false, deep: false }); // Reset flags
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
            return;
        }

        onSend(textToSend, attachments, commandState, isPetChat);
        setInput('');
        setAttachments([]);
        setCommandState({ web: false, visual: false, flash: false, deep: false }); // Reset flags
        setShowAliasSuggestions(false);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const toggleVoice = () => {
        if (isListening) {
            stopListening();
            setIsListening(false);
        } else {
            setIsListening(true);
            startListening(
                (text, isFinal) => {
                    if (isFinal) {
                        setInput(prev => prev + (prev ? ' ' : '') + text);
                        setIsListening(false);
                    }
                },
                (err) => {
                    console.error(err);
                    setIsListening(false);
                }
            );
        }
    };

    const processFiles = async (fileList: FileList | null) => {
        if (!fileList) return;
        if (attachments.length + fileList.length > MAX_FILES) {
            alert(`Max ${MAX_FILES} files.`);
            return;
        }
        const newAttachments: Attachment[] = [];
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            if (file.size > MAX_SIZE_MB * 1024 * 1024) continue;

            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve) => {
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    resolve(result.split(',')[1]);
                };
                reader.readAsDataURL(file);
            });

            newAttachments.push({
                mimeType: file.type || (file.name.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/octet-stream'),
                data: base64,
                name: file.name,
                size: file.size
            });
        }
        setAttachments(prev => [...prev, ...newAttachments]);
    };

    const handleInputChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInput(value);
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;

        if (value.length > 0 && !value.startsWith('/')) {
            try {
                const aliases = await aliasService.getAllAliases();
                const matches = (aliases || []).filter(a => a.name.toLowerCase().startsWith(value.toLowerCase()));
                setAliasSuggestions(matches);
                setActiveAliasIndex(0);
                setShowAliasSuggestions(matches.length > 0);
            } catch (err) {
                setShowAliasSuggestions(false);
            }
        } else {
            setShowAliasSuggestions(false);
        }
    };

    const handleCommandToggle = (key: keyof CommandState) => {
        setCommandState(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="relative w-full max-w-3xl mx-auto pb-6" ref={containerRef}>
            {/* Prompt Menu */}
            {showPromptMenu && (
                <div className="absolute bottom-full mb-2 left-2 right-2 sm:left-0 sm:right-auto sm:w-80 max-w-full bg-zinc-900/95 border border-zinc-700 rounded-xl shadow-2xl backdrop-blur overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800 sticky top-0 bg-zinc-900/95 backdrop-blur">
                        Saved Prompts
                    </div>
                    {filteredPrompts.map(p => (
                        <button
                            key={p.id}
                            onClick={() => handlePromptSelect(p.text)}
                            className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-teal-900/30 hover:text-teal-400 transition-colors truncate"
                        >
                            <span className="font-mono opacity-50 mr-2">/{p.trigger}</span>
                            {p.text}
                        </button>
                    ))}
                </div>
            )}

            {showAliasSuggestions && (
                <div className="absolute bottom-full mb-2 left-2 right-2 sm:left-0 sm:right-auto sm:w-96 max-w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-40">
                    {aliasSuggestions.map((alias, idx) => (
                        <button
                            key={alias.name}
                            onClick={() => {
                                selectAlias(alias);
                            }}
                            onMouseEnter={() => setActiveAliasIndex(idx)}
                            className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${activeAliasIndex === idx ? 'bg-zinc-100 dark:bg-zinc-800' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                        >
                            <span className="text-2xl">{alias.icon || '⚡'}</span>
                            <div className="flex-1">
                                <div className="font-semibold">{alias.name}</div>
                                <div className="text-xs text-zinc-600 dark:text-zinc-400">{alias.description}</div>
                            </div>
                            <span className="text-xs text-zinc-500">{alias.category}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
                <div className="flex gap-3 mb-3 overflow-x-auto py-2">
                    {attachments.map((att, idx) => (
                        <div key={idx} className="relative shrink-0 animate-pop-in">
                            <div className="w-14 h-14 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                                {att.mimeType.startsWith('image') ? (
                                    <img src={`data:${att.mimeType};base64,${att.data}`} alt="preview" className="w-full h-full object-cover opacity-70" />
                                ) : (
                                    <i className="fa-solid fa-file text-gray-500 dark:text-zinc-400"></i>
                                )}
                            </div>
                            <button
                                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute -top-2 -right-2 bg-zinc-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500"
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Box */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); }}
                className={`
            bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl border rounded-2xl shadow-2xl flex flex-col relative overflow-hidden transition-all
            ${isTron ? 'border-tron-cyan/30 shadow-[0_0_20px_rgba(0,243,255,0.1)]' : 'border-gray-200 dark:border-zinc-700'}
            ${dragOver ? 'ring-2 ring-teal-500' : ''}
        `}
            >
                <textarea
                    id="chat-input"
                    name="chat-input"
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? "Listening..." : "Ask anything... (Type '/' for prompts)"}
                    rows={1}
                    aria-label="Chat message input"
                    className={`w-full bg-transparent text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 px-4 py-4 outline-none resize-none max-h-[200px] min-h-[56px] ${isTron ? 'font-tron' : ''}`}
                />

                <div className="flex justify-between items-center px-2 pb-2">
                    <div className="flex items-center gap-1">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-teal-500 rounded-full transition-colors">
                            <i className="fa-solid fa-paperclip"></i>
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => processFiles(e.target.files)} />

                        <button onClick={toggleVoice} className={`p-2 rounded-full transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-teal-500'}`}>
                            <i className={`fa-solid ${isListening ? 'fa-microphone-lines' : 'fa-microphone'}`}></i>
                        </button>
                        <button
                            onClick={() => handleCommandToggle('web')}
                            className={`p-2 rounded-full transition-colors ${commandState.web ? (isTron ? 'text-tron-cyan' : 'text-blue-500') : 'text-gray-400 hover:text-blue-400'}`}
                            title="Toggle Web Search"
                        >
                            <i className="fa-solid fa-globe"></i>
                        </button>
                        <button onClick={() => handleCommandToggle('visual')} className={`p-2 rounded-full transition-colors ${commandState.visual ? (isTron ? 'text-tron-cyan' : 'text-purple-500') : 'text-gray-400 hover:text-purple-400'}`} title="Visual">
                            <i className="fa-regular fa-image"></i>
                        </button>
                        <button onClick={() => handleCommandToggle('flash')} className={`p-2 rounded-full transition-colors ${commandState.flash ? (isTron ? 'text-tron-cyan' : 'text-amber-500') : 'text-gray-400 hover:text-amber-400'}`} title="Flash">
                            <i className="fa-solid fa-bolt"></i>
                        </button>
                        <button onClick={() => handleCommandToggle('deep')} className={`p-2 rounded-full transition-colors ${commandState.deep ? (isTron ? 'text-tron-cyan' : 'text-emerald-500') : 'text-gray-400 hover:text-emerald-400'}`} title="Deep">
                            <i className="fa-solid fa-brain"></i>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onOpenSettings}
                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all border
                                ${isTron
                                    ? 'text-tron-cyan border-tron-cyan hover:bg-tron-cyan/10 hover:shadow-[0_0_10px_#00f3ff]'
                                    : 'text-gray-500 dark:text-zinc-300 border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800'}
                            `}
                            title="Settings"
                        >
                            <i className="fa-solid fa-gear"></i>
                        </button>
                        {showHolidayButtons && (
                            <>
                                <button
                                    onClick={onToggleHolidayMode}
                                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all border
                                        ${holidayMode
                                            ? (isTron ? 'bg-tron-cyan text-black border-tron-cyan hover:shadow-[0_0_10px_#00f3ff]' : 'bg-amber-200 text-amber-700 border-amber-300')
                                            : (isTron ? 'text-tron-cyan border-tron-cyan hover:bg-tron-cyan/10 hover:shadow-[0_0_10px_#00f3ff]' : 'text-gray-500 dark:text-zinc-300 border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800')}
                                    `}
                                    title="Toggle Celebration Overlay"
                                >
                                    <i className={
                                        holidayEffect === 'snow' ? 'fa-regular fa-snowflake' :
                                        holidayEffect === 'confetti' ? 'fa-solid fa-party-popper' :
                                        'fa-solid fa-wand-magic-sparkles'
                                    }></i>
                                </button>
                                <button
                                    onClick={onCycleHolidayEffect}
                                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all border
                                        ${isTron
                                            ? 'text-tron-cyan border-tron-cyan hover:bg-tron-cyan/10 hover:shadow-[0_0_10px_#00f3ff]'
                                            : 'text-gray-500 dark:text-zinc-300 border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800'}
                                    `}
                                    title="Cycle Celebration Style"
                                >
                                    <i className="fa-solid fa-rotate"></i>
                                </button>
                            </>
                        )}
                        <button
                            onClick={isStreaming ? onStop : handleSubmit}
                            disabled={!isStreaming && (!input.trim() && attachments.length === 0)}
                            className={`
                    w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200
                    ${isStreaming
                        ? (isTron ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_12px_rgba(255,0,0,0.6)]' : 'bg-red-600 text-white hover:bg-red-500 shadow-lg')
                        : (isTron ? 'bg-tron-cyan text-black hover:bg-white hover:shadow-[0_0_10px_#00f3ff]' : 'bg-teal-600 text-white hover:bg-teal-500 shadow-lg')}
                    ${!isStreaming && (!input.trim() && attachments.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                        >
                            {isStreaming ? <i className="fa-solid fa-stop"></i> : <i className="fa-solid fa-arrow-up"></i>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Command Deck */}
            <CommandDeck state={commandState} onChange={handleCommandToggle} isTron={isTron} />
        </div>
    );
};

export default InputArea;

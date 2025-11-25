
import React, { useRef, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession, Message, Sender, ModelType, Attachment, DocumentChunk, AppSettings, CommandState, getModelBadges } from '../types';
import MessageItem from './MessageItem';
import InputArea from './InputArea';
import TronGrid from './TronGrid';
import DavidEasterEgg from './DavidEasterEgg';
import FazalEasterEgg from './FazalEasterEgg';
import SowmyaEasterEgg from './SowmyaEasterEgg';
import MichaelEasterEgg from './MichaelEasterEgg';
import Win95EasterEgg from './Win95EasterEgg';
import { PetState } from '../src/hooks/usePetState';
import { streamGeminiResponse } from '../services/geminiService';
import { streamOllamaResponse } from '../services/ollamaService';
import { streamOpenAIResponse } from '../services/openaiService';
import { streamAnthropicResponse } from '../services/anthropicService';
import { streamPerplexityResponse } from '../services/perplexityService';
import { runMultiAgentCouncil } from '../services/agentOrchestrator';
import { processDocuments, retrieveRelevantChunks } from '../services/ragService';
import { searchWeb } from '../services/searchService';
import { speakText } from '../services/voiceService';
import { generateImage } from '../services/imageGenService';
import { produceNewsSegment } from '../services/newsRoomService';
import { generateHFChat } from '../services/huggingFaceService';
import { streamGrokResponse } from '../services/xaiService';
import { dbService } from '../services/dbService';

interface ChatInterfaceProps {
    session: ChatSession;
    currentUser: string;
    onUpdateMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
    onUpdateModel: (model: string) => void;
    onAddKnowledge: (chunks: DocumentChunk[]) => void;
    settings: AppSettings;
    onMakeNote?: (draft: { title?: string; content?: string; imageUrl?: string }) => void;
    onOpenSettings: () => void;
    onToggleHolidayMode: () => void;
    onCycleHolidayEffect: () => void;
    showHolidayButtons: boolean;
    onPetCommand: () => void; // New prop
    onOpenCanvas?: () => void; // Canvas Easter egg
    saveImageToLocal: (url?: string) => Promise<string | undefined>;
    petBridge?: {
        pet: PetState | null;
        addXP?: (amount: number) => void;
        setMood?: (mood: PetState['mood']) => void;
    };
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    session,
    onUpdateMessages,
    onUpdateModel,
    onAddKnowledge,
    settings,
    currentUser,
    onMakeNote,
    onOpenSettings,
    onToggleHolidayMode,
    onCycleHolidayEffect,
    showHolidayButtons,
    onPetCommand, // Destructure new prop
    onOpenCanvas, // Destructure Canvas opener
    saveImageToLocal,
    petBridge
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processingStatus, setProcessingStatus] = useState<string | null>(null);
    const [localModel, setLocalModel] = useState<string>(session.model);
    const [showModelSelector, setShowModelSelector] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showEasterEgg, setShowEasterEgg] = useState(false);
    const [showFazalEasterEgg, setShowFazalEasterEgg] = useState(false);
    const [showSowmyaEasterEgg, setShowSowmyaEasterEgg] = useState(false);
    const [showMichaelEasterEgg, setShowMichaelEasterEgg] = useState(false);
    const [showWin95EasterEgg, setShowWin95EasterEgg] = useState(false);

    const [isModelLoading, setIsModelLoading] = useState(false);

    useEffect(() => { setLocalModel(session.model); }, [session.id, session.model]);
    const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [session.messages.length, isStreaming, processingStatus]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = null;

        const reset = () => {
            setShowModelSelector(true);
            if (timer) clearTimeout(timer);
            if (settings.autoHideModelSelector && !isDropdownOpen) {
                timer = setTimeout(() => setShowModelSelector(false), 5000);
            }
        };

        window.addEventListener('mousemove', reset);
        reset();

        return () => {
            window.removeEventListener('mousemove', reset);
            if (timer) clearTimeout(timer);
        };
    }, [settings.autoHideModelSelector, isDropdownOpen]);

    const handleModelChange = (model: string) => {
        setLocalModel(model);
        onUpdateModel(model);
        setIsDropdownOpen(false);

        // Trigger loading effect for Ollama models
        if (settings.availableModels.ollama.includes(model) && settings.ollamaLoadingEffect !== 'none') {
            setIsModelLoading(true);
            setTimeout(() => setIsModelLoading(false), 3000); // Simulate 3s load time
        }
    };

    const handleFeedback = (messageId: string, rating: 'up' | 'down', reason?: string) => {
        onUpdateMessages((prevMessages) =>
            prevMessages.map(msg =>
                msg.id === messageId ? { ...msg, feedback: { rating, reason } } : msg
            )
        );
    };

    const handleStop = () => {
        setIsStreaming(false);
        setProcessingStatus(null);
    };

    const handleSendMessage = async (text: string, attachments: Attachment[], commandState: CommandState, isPetChat: boolean) => {
        setError(null);

        // 🎖️ EASTER EGGS: Check for special names (case insensitive)
        const lowerText = text.toLowerCase();

        if (lowerText.includes('david t keane')) {
            setShowEasterEgg(true);
            return; // Don't process as normal message
        }

        if (lowerText.includes('fazal')) {
            setShowFazalEasterEgg(true);
            return;
        }

        if (lowerText.includes('sowmya')) {
            setShowSowmyaEasterEgg(true);
            return;
        }

        if (lowerText.includes('michael')) {
            setShowMichaelEasterEgg(true);
            return;
        }

        if (lowerText.includes('window 95') || lowerText.includes('win95')) {
            setShowWin95EasterEgg(true);
            onUpdateMessages((prev) => [
                ...prev,
                {
                    id: uuidv4(),
                    sender: Sender.AI,
                    text: '💾 Launching Windows 95...',
                    timestamp: Date.now()
                }
            ]);
            return;
        }

        // 🎨 CANVAS EASTER EGG: Type "canvas" to open Canvas Board
        if (lowerText.trim() === 'canvas' && onOpenCanvas) {
            onOpenCanvas();
            return; // Don't process as normal message
        }

        const docAttachments = attachments.filter(att => !att.mimeType.startsWith('image/'));
        const imageAttachments = attachments.filter(att => att.mimeType.startsWith('image/'));

        const userMsg: Message = {
            id: uuidv4(),
            sender: Sender.USER,
            text,
            timestamp: Date.now(),
            attachments: [...imageAttachments, ...docAttachments],
            stats: { model: 'User', latencyMs: 0, outputTokens: text.length }
        };

        let currentMessages = [...session.messages, userMsg];
        onUpdateMessages(currentMessages);
        setIsStreaming(true);
        const startTime = Date.now();

        try {
            let textToSend = text;
            let modelToUse = localModel;
            let isPetResponse = false;

            // --- PET CHAT HANDLING ---
            if (isPetChat) {
                const petName = petBridge?.pet?.name || settings.petName || 'Pixel';
                const petMood = petBridge?.pet?.mood || 'happy';
                const petLevel = petBridge?.pet?.level || 1;
                const petBonds = petBridge?.pet?.bonds || 0;
                const petPersonality = `You are ${petName}, a friendly and loyal cyber-cat (Level ${petLevel}, Mood: ${petMood}, Bonds: ${petBonds}). You talk to your Commander with short (<=2 sentences), warm, encouraging replies. Sprinkle gentle cat sounds (purr, meow) occasionally. Celebrate focus, study wins, and calm anxious feelings. Stay playful and positive.`;
                textToSend = `${petPersonality}\n\nCommander says: "${text}"`;
                modelToUse = ModelType.FAST; // Force Gemini Flash for pet chat
                isPetResponse = true;
                petBridge?.addXP?.(5);
                petBridge?.setMood?.('happy' as any);
                console.log(`🐾 Pet Chat initiated with ${petName}!`);
            }

            // --- COMMAND HANDLING ---

            // 1. Image Generation (/imagine or Visual Flag)
            // Auto-detect plain English requests for images
            const lowerTextForImages = text.toLowerCase();
            const isImageRequest = lowerTextForImages.startsWith('/imagine') ||
                commandState.visual ||
                lowerTextForImages.match(/^(draw|generate|create|make) (an )?image/i);

            if (isImageRequest) {
                setProcessingStatus("Generating Art...");
                const prompt = text.replace(/^\/imagine(_all)?/, '').replace(/^(draw|generate|create|make) (an )?image (of )?/i, '').trim();
                const provider = text.startsWith('/imagine_all') ? 'all' : 'dall-e-3'; // default

                const imageStart = Date.now();
                const images = await generateImage(prompt, provider, settings);
                const latency = Date.now() - imageStart;
                const primaryProvider = images[0]?.provider || provider;

                // --- Auto-save generated images ---
                setProcessingStatus("Saving Artwork...");
                const savedImages = await Promise.all(
                    images.map(async (img) => {
                        const savedUrl = await saveImageToLocal(img.url);
                        return { ...img, url: savedUrl || img.url }; // Fallback to original URL if save fails
                    })
                );

                const stats = {
                    model: primaryProvider,
                    latencyMs: latency,
                    inputTokens: 0,
                    outputTokens: 0
                };

                const metaLine = `Model: ${primaryProvider} • Latency: ${latency} ms • Tokens: 0 • Cost: n/a`;
                onUpdateMessages(prev => [...prev, {
                    id: uuidv4(),
                    sender: Sender.AI,
                    text: `Generated ${savedImages.length} image(s) for: "${prompt}"\n${metaLine}`,
                    timestamp: Date.now(),
                    generatedImages: savedImages,
                    stats
                }]);
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 2. Newsroom (/news)
            if (text.startsWith('/news')) {
                setProcessingStatus("Producing News Segment...");
                const topic = text.replace('/news', '').trim();
                const segment = await produceNewsSegment(topic, settings);
                onUpdateMessages(prev => [...prev, {
                    id: uuidv4(), sender: Sender.AI, text: segment.script, timestamp: Date.now(),
                    generatedImages: segment.thumbnail ? [segment.thumbnail] : undefined,
                    audioData: segment.audio
                }]);
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // --- STANDARD CHAT FLOW ---

            // RAG Ingestion
            if (docAttachments.length > 0) {
                setProcessingStatus("Ingesting Data...");
                if (!settings.geminiApiKey) throw new Error("Gemini Key required for docs.");
                const newChunks = await processDocuments(docAttachments, settings.geminiApiKey);
                onAddKnowledge(newChunks);
                session.knowledgeBase = [...(session.knowledgeBase || []), ...newChunks];
            }

            // Load Study Notes (for context)
            let studyNoteContext: DocumentChunk[] = [];
            if (settings.useStudyNotesInChat && currentUser) {
                try {
                    const stored = await dbService.getSetting(`study_notes_${currentUser}`);
                    const noteArray = Array.isArray(stored?.notes) ? stored.notes : Array.isArray(stored) ? stored : [];
                    studyNoteContext = noteArray.map((n: any, idx: number) => ({
                        id: n.id || `note-${idx}`,
                        text: `${n.title || 'Untitled'}\n${(n.content || '').toString()}`,
                        embedding: [],
                        source: `Study Note: ${n.title || 'Untitled'}`
                    }));
                } catch (e) {
                    console.warn('Study notes load failed', e);
                }
            }

            // Retrieval
            let relevantContext: DocumentChunk[] = [];
            if (session.knowledgeBase?.length > 0 && settings.geminiApiKey) {
                relevantContext = await retrieveRelevantChunks(text, session.knowledgeBase, settings.geminiApiKey);
            }
            // Merge study notes into context if enabled
            if (studyNoteContext.length > 0) {
                relevantContext = [...relevantContext, ...studyNoteContext];
            }

            // Search Injection
            let searchContext = "";
            const hasSearchProvider = Boolean(settings.braveApiKey) || (settings.enableDuckDuckGo && settings.corsProxyUrl);
            const needsSearch = commandState.web && hasSearchProvider;

            if (needsSearch) {
                setProcessingStatus("Scanning Network...");
                const searchResult = await searchWeb(text, settings.braveApiKey || '', settings.corsProxyUrl, settings.enableDuckDuckGo);
                searchContext = searchResult.textContext;
            }
            const studyContextText = studyNoteContext.length > 0
                ? "[Study Notes]\n" + studyNoteContext.slice(0, 10).map((c, idx) => `${idx + 1}. ${c.text.slice(0, 500)}`).join("\n") + "\n"
                : "";

            // AI Placeholder
            const aiPlaceholder: Message = { id: uuidv4(), sender: Sender.AI, text: '', timestamp: Date.now(), isThinking: true };
            if (localModel !== ModelType.MULTI_AGENT) onUpdateMessages([...currentMessages, aiPlaceholder]);

            const commonParams = (streamedText: string) => {
                onUpdateMessages([...currentMessages, { ...aiPlaceholder, text: streamedText, isThinking: false, contextUsed: relevantContext }]);
            };

            const finalParams = (fullText: string, stats: any, sources?: any) => {
                const msg: Message = {
                    ...aiPlaceholder, text: fullText, isThinking: false, groundingSources: sources,
                    contextUsed: relevantContext, stats: { model: modelToUse, latencyMs: Date.now() - startTime, ...stats },
                    agentName: isPetResponse ? (settings.petName || 'Pixel') : undefined,
                    agentColor: isPetResponse ? 'bg-purple-600' : undefined,
                };
                onUpdateMessages([...currentMessages, msg]);
                if (settings.enableVoiceResponse && !isPetResponse) speakText(fullText.replace(/<[^>]*>?/gm, ''));
            };

            // Provider Routing
            if (modelToUse === ModelType.MULTI_AGENT && !isPetChat) {
                await runMultiAgentCouncil(
                    textToSend, imageAttachments, session.messages, relevantContext, settings.geminiApiKey, settings.councilAgents,
                    (msg) => { currentMessages = [...currentMessages, msg]; onUpdateMessages(currentMessages); },
                    (id, txt) => { currentMessages = currentMessages.map(m => m.id === id ? { ...m, text: txt, isThinking: false } : m); onUpdateMessages(currentMessages); }
                );
            } else if (modelToUse.includes('sonar') && !isPetChat) {
                const res = await streamPerplexityResponse(textToSend, session.messages, modelToUse, settings.perplexityApiKey || '',
                    (txt, sources) => onUpdateMessages([...currentMessages, { ...aiPlaceholder, text: txt, isThinking: false, groundingSources: sources }]));
                finalParams(res.text, {}, res.sources);
            } else if ((modelToUse.includes('gpt') || modelToUse.includes('o1')) && !isPetChat) {
                const promptWithSearch = (searchContext || studyContextText)
                    ? `${studyContextText}${searchContext ? `[Web Search Results]:\n${searchContext}\n\n` : ''}User Query: ${textToSend}`
                    : textToSend;
                const res = await streamOpenAIResponse(promptWithSearch, imageAttachments, session.messages, modelToUse, relevantContext, settings.openaiApiKey || '', commonParams, settings.modelParams);
                finalParams(res.text, res.usage);
            } else if (modelToUse.includes('claude') && !isPetChat) {
                const promptWithSearch = (searchContext || studyContextText)
                    ? `${studyContextText}${searchContext ? `[Web Search Results]:\n${searchContext}\n\n` : ''}User Query: ${textToSend}`
                    : textToSend;
                const res = await streamAnthropicResponse(promptWithSearch, imageAttachments, session.messages, modelToUse, relevantContext, settings.anthropicApiKey || '', settings.corsProxyUrl || '', commonParams, settings.modelParams);
                finalParams(res.text, res.usage);
            } else if (modelToUse.includes('grok') && !isPetChat) {
                const res = await streamGrokResponse(textToSend, session.messages, modelToUse, settings.xaiApiKey || '', commonParams);
                finalParams(res, {});
            } else if ((modelToUse.includes('meta') || modelToUse.includes('mistral')) && !isPetChat) {
                // Hugging Face
                const res = await generateHFChat(textToSend, session.messages, modelToUse, settings.huggingFaceApiKey || '');
                finalParams(res, {});
            } else if (modelToUse === ModelType.LOCAL || (!modelToUse.includes('gemini') && !isPetChat)) {
                const promptWithSearch = (searchContext || studyContextText)
                    ? `${studyContextText}${searchContext ? `[Web Search Results]:\n${searchContext}\n\n` : ''}User Query: ${textToSend}`
                    : textToSend;
                const res = await streamOllamaResponse(promptWithSearch, session.messages, settings.ollamaBaseUrl, settings.ollamaModelId, commonParams);
                finalParams(res.text, res.usage);
            } else {
                // Gemini (Handles normal Gemini chats and the Pet Chat)
                const res = await streamGeminiResponse(
                    textToSend, imageAttachments, session.messages, modelToUse as any, commandState.web, relevantContext,
                    (txt, sources) => onUpdateMessages([...currentMessages, { ...aiPlaceholder, text: txt, isThinking: false, groundingSources: sources }]),
                    settings.geminiApiKey, settings.matrixMode, settings.theme === 'tron', settings.modelParams, commandState
                );
                finalParams(res.text, res.usage, res.sources);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsStreaming(false);
            setProcessingStatus(null);
        }
    };

    const handleRegenerate = () => {
        const lastUserMsg = session.messages.filter(m => m.sender === Sender.USER).pop();
        if (lastUserMsg) {
            const newHistory = session.messages.slice(0, session.messages.lastIndexOf(lastUserMsg) + 1);
            onUpdateMessages(newHistory);
            handleSendMessage(lastUserMsg.text, lastUserMsg.attachments || [], { web: false, visual: false, flash: false, deep: false });
        }
    };

    const modelGroups = {
        "Quick Access": [ModelType.FAST, ModelType.REASONING, ModelType.DEEP_RESEARCH, ModelType.MULTI_AGENT],
        "Gemini": settings.availableModels.gemini,
        "OpenAI": settings.availableModels.openai,
        "Anthropic": settings.availableModels.anthropic,
        "Perplexity": [ModelType.PERPLEXITY_SONAR, ModelType.PERPLEXITY_SONAR_PRO],
        "Grok (xAI)": settings.availableModels.grok,
        "HuggingFace": settings.availableModels.huggingface,
        "Local": settings.availableModels.ollama
    };

    const isTron = settings.theme === 'tron';

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto relative font-sans">
            {isTron && <TronGrid />}

            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${showModelSelector ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="relative">
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-xl backdrop-blur border transition-all ${isTron ? 'bg-black/80 border-tron-cyan text-tron-cyan shadow-[0_0_10px_rgba(0,243,255,0.3)] font-tron' : 'bg-zinc-900/90 border-zinc-700 text-white'} ${isModelLoading && settings.ollamaLoadingEffect === 'pulse' ? 'pulse-active' : ''}`}>
                        <span className="text-sm font-medium">{isModelLoading && settings.ollamaLoadingEffect === 'pulse' ? 'LOADING...' : localModel}</span>
                        {!isModelLoading && getModelBadges(localModel) && (
                            <span className="text-xs opacity-70">{getModelBadges(localModel)}</span>
                        )}
                        <i className="fa-solid fa-chevron-down text-xs"></i>
                    </button>

                    {isDropdownOpen && (
                        <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 max-h-96 overflow-y-auto rounded-xl shadow-2xl p-2 scrollbar-thin border ${isTron ? 'bg-black/90 border-tron-cyan scrollbar-thumb-tron-cyan' : 'bg-zinc-900 border-zinc-800'}`}>
                            {Object.entries(modelGroups).map(([group, models]) => (
                                <div key={group} className="mb-2">
                                    <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 ${isTron ? 'text-tron-orange' : 'text-zinc-500'}`}>{group}</div>
                                    {models.map((m) => {
                                        const badges = getModelBadges(m);
                                        return (
                                            <button key={m} onClick={() => handleModelChange(m)} className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between gap-2 ${localModel === m ? (isTron ? 'bg-tron-cyan text-black font-bold' : 'bg-teal-600 text-white') : (isTron ? 'text-tron-cyan hover:bg-tron-cyan/20' : 'text-zinc-300 hover:bg-zinc-800')}`}>
                                                <span className="truncate">{m}</span>
                                                {badges && <span className="text-xs flex-shrink-0">{badges}</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}

                            {/* Capability Legend */}
                            <div className={`mt-3 pt-3 border-t px-2 text-[9px] opacity-60 ${isTron ? 'border-tron-cyan/30' : 'border-zinc-700'}`}>
                                <div className="font-bold mb-1 uppercase tracking-wide">Capabilities:</div>
                                <div className="space-y-0.5">
                                    <div>👁️ Vision (analyzes images)</div>
                                    <div>🧠 Advanced Reasoning</div>
                                    <div>⚡ Fast Speed</div>
                                    <div>💎 Most Powerful</div>
                                </div>
                                <div className="mt-2 text-[8px] opacity-40">
                                    Image generation via /imagine command
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={`flex-1 overflow-y-auto p-4 pt-24 z-10 ${isTron ? 'font-tron text-tron-cyan' : ''}`}>
                {session.messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <i className={`fa-solid ${isTron ? 'fa-microchip text-tron-cyan animate-pulse-slow' : 'fa-fingerprint text-zinc-700'} text-6xl mb-6`}></i>
                        <p className={`text-xl font-bold tracking-widest ${isTron ? 'text-tron-cyan' : 'text-zinc-500'}`}>
                            {isTron ? 'SYSTEM READY' : 'RangerPlex Ready'}
                        </p>
                    </div>
                )}
                {session.messages.map(msg => (
                    <MessageItem
                        key={msg.id}
                        message={msg}
                        userAvatar={settings.userAvatar}
                        aiAvatar={settings.aiAvatar}
                        petAvatar={settings.petAvatar}
                        isTron={isTron}
                        isMatrix={settings.matrixMode}
                        onRegenerate={handleRegenerate}
                        onRate={(rating, reason) => handleFeedback(msg.id, rating, reason)}
                        onMakeNote={onMakeNote ? (message) => {
                            const attachmentImg = (message.attachments || []).find(a => a.mimeType.startsWith('image/'));
                            const attachmentDataUrl = attachmentImg ? `data:${attachmentImg.mimeType};base64,${attachmentImg.data}` : undefined;
                            const firstImage = message.generatedImages?.[0]?.url || attachmentDataUrl;
                            onMakeNote({
                                title: message.sender === Sender.USER ? 'User note' : 'AI note',
                                content: message.text,
                                imageUrl: firstImage
                            });
                        } : undefined}
                    />
                ))}
                {processingStatus && (
                    <div className="flex justify-center py-4"><span className={`text-xs animate-pulse ${isTron ? 'text-tron-orange font-mono' : 'text-teal-500'}`}>{processingStatus}</span></div>
                )}
                {error && <div className="p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm text-center">{error}</div>}
                <div ref={bottomRef} />
            </div>

            <div className="p-4 z-20">
                <InputArea
                    onSend={handleSendMessage}
                    onStop={handleStop}
                    isStreaming={isStreaming}
                    settings={settings}
                    isTron={isTron}
                    onOpenSettings={onOpenSettings}
                    onToggleHolidayMode={onToggleHolidayMode}
                    onCycleHolidayEffect={onCycleHolidayEffect}
                    holidayMode={settings.holidayMode}
                    holidayEffect={settings.holidayEffect}
                    showHolidayButtons={showHolidayButtons}
                    onPetCommand={onPetCommand} // Pass the new prop
                />
            </div>

            {/* --- OLLAMA LOADING EFFECTS --- */}

            {/* 1. Neural Link */}
            {isModelLoading && settings.ollamaLoadingEffect === 'neural' && (
                <div className="absolute top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur border-b border-teal-500/50 p-2 flex items-center justify-center gap-3 animate-slide-down">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></div>
                    <span className="font-mono text-xs text-teal-400 tracking-widest">INITIALIZING NEURAL LINK... [||||||]</span>
                </div>
            )}

            {/* 2. Terminal Boot */}
            {isModelLoading && settings.ollamaLoadingEffect === 'terminal' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-[600px] bg-black border-2 border-green-500/70 p-8 rounded-lg font-mono text-lg text-green-500 shadow-2xl shadow-green-900/40 animate-fade-in">
                        <div className="mb-3 text-xl">&gt; SYSTEM_CHECK... <span className="text-green-400">OK</span></div>
                        <div className="mb-3 text-xl">&gt; MOUNTING_TENSORS... <span className="text-green-400">OK</span></div>
                        <div className="mb-3 text-xl">&gt; ALLOCATING_VRAM... <span className="animate-pulse text-yellow-400">WAIT</span></div>
                        <div className="mt-6 text-white bg-green-900/50 px-3 py-2 inline-block text-base border border-green-500/30 rounded">
                            LOADING: <span className="text-green-400 font-bold">{localModel}</span>
                        </div>
                    </div>
                </div>
            )}
            {/* 3. Brain Pulse (Applied to Button) */}
            <style>{`
            @keyframes pulse-border {
                0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(168, 85, 247, 0); }
                100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
            }
            .pulse-active {
                animation: pulse-border 1.5s infinite;
                border-color: #a855f7 !important;
                color: #a855f7 !important;
            }
        `}</style>

        {/* 🎖️ Easter Eggs */}
        {showEasterEgg && <DavidEasterEgg onClose={() => setShowEasterEgg(false)} />}
        {showFazalEasterEgg && <FazalEasterEgg onClose={() => setShowFazalEasterEgg(false)} />}
        {showSowmyaEasterEgg && <SowmyaEasterEgg onClose={() => setShowSowmyaEasterEgg(false)} />}
        {showMichaelEasterEgg && <MichaelEasterEgg onClose={() => setShowMichaelEasterEgg(false)} />}
        {showWin95EasterEgg && (
            <Win95EasterEgg
                onClose={() => setShowWin95EasterEgg(false)}
                currentUser={currentUser}
            />
        )}
        </div>
    );
};

export default ChatInterface;

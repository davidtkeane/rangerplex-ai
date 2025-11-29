
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
import DeathStarEasterEgg from './DeathStarEasterEgg';
import { PetState } from '../src/hooks/usePetState';
import { streamGeminiResponse } from '../services/geminiService';
import { streamOllamaResponse } from '../services/ollamaService';
import { streamLMStudioResponse } from '../services/lmstudioService';
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
import { updateService } from '../services/updateService';
import pkg from '../package.json';
import { forensicCommandHandler } from '../src/commands/forensicCommandHandler';
import { malwareCommandHandler } from '../src/commands/malwareCommandHandler';
import { aliasService, type Alias } from '../services/aliasService';
import AliasConfirmationModal from './AliasConfirmationModal';
import AliasManager from './AliasManager';

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
    onOpenWordPress?: () => void; // WordPress Dashboard opener
    onOpenStudyClock?: () => void; // Study Clock opener
    onOpenManual?: () => void; // Manual viewer
    saveImageToLocal: (url?: string) => Promise<string | undefined>;
    petBridge?: {
        pet: PetState | null;
        addXP?: (amount: number) => void;
        setMood?: (mood: PetState['mood']) => void;
    };
}

interface ExecutionResult {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
    executionTime: number;
    command: string;
    cwd: string;
    timestamp: number;
}

// Keep conversation history bounded to avoid blowing past provider context limits
const DEFAULT_HISTORY_MESSAGES = 24;
const DEFAULT_HISTORY_CHARS = 120000; // ~30k tokens safety window
const trimHistoryForContext = (history: Message[], maxMessages?: number, maxChars?: number): Message[] => {
    const limitMessages = Math.max(1, maxMessages ?? DEFAULT_HISTORY_MESSAGES);
    const limitChars = Math.max(1000, maxChars ?? DEFAULT_HISTORY_CHARS);
    let totalChars = 0;
    const limited: Message[] = [];

    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        const textLen = msg.text?.length || 0;

        if (limited.length >= limitMessages || totalChars + textLen > limitChars) break;
        limited.push(msg);
        totalChars += textLen;
    }

    return limited.reverse();
};

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
    onOpenWordPress, // Destructure WordPress opener
    onOpenStudyClock, // Destructure Study Clock opener
    onOpenManual,
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
    const [showDeathStarEasterEgg, setShowDeathStarEasterEgg] = useState(false);
    const [copiedLast, setCopiedLast] = useState(false);

    const [isModelLoading, setIsModelLoading] = useState(false);
    const [confirmationAlias, setConfirmationAlias] = useState<Alias | null>(null);
    const [showAliasConfirmation, setShowAliasConfirmation] = useState(false);
    const [showAliasManager, setShowAliasManager] = useState(false);
    const aliasAbortRef = useRef<AbortController | null>(null);

    useEffect(() => { setLocalModel(session.model); }, [session.id, session.model]);
    const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [session.messages.length, isStreaming, processingStatus]);

    // Ensure default aliases are loaded for detection/suggestions
    useEffect(() => {
        aliasService.loadDefaultAliases().catch(err => console.warn('Alias preload failed:', err));
    }, []);

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

    // Auto-send programmatically added user messages (e.g., from Code Assistant)
    useEffect(() => {
        if (session.messages.length === 0 || isStreaming) return;

        const lastMessage = session.messages[session.messages.length - 1];
        const now = Date.now();

        // If last message is from user and was added in the last 2 seconds, and there's no AI response after it
        if (
            lastMessage.sender === Sender.USER &&
            now - lastMessage.timestamp < 2000 &&
            !isStreaming
        ) {
            // Check if this message needs a response (no AI message after it)
            const needsResponse = session.messages.length === 1 ||
                session.messages[session.messages.length - 2]?.sender === Sender.AI ||
                session.messages[session.messages.length - 2]?.sender === Sender.USER;

            if (needsResponse && lastMessage.text) {
                // Auto-send this message to AI
                setTimeout(() => {
                    handleSendMessage(lastMessage.text, [], { web: false, visual: false, flash: false, deep: false }, false);
                }, 100);
            }
        }
    }, [session.messages.length, session.id]);




    const handleModelChange = (model: string) => {
        setLocalModel(model);
        onUpdateModel(model);
        setIsDropdownOpen(false);

        // Trigger loading effect for any model change
        if (settings.ollamaLoadingEffect !== 'none') {
            setIsModelLoading(true);
            setTimeout(() => setIsModelLoading(false), 2000); // 2s display time
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

    const formatAliasOutput = (alias: Alias, result: ExecutionResult): string => {
        let output = `${alias.icon || '⚡'} **${alias.name}**\n\n`;

        const stripAnsi = (text: string) => text
            .replace(/\x1B\[[0-9;]*[A-Za-z]/g, '')
            .replace(/\[[0-9;]+m/g, '');

        if (result.stdout) {
            const hasAnsi = /\x1B\[[0-9;]*[A-Za-z]/.test(result.stdout) || /\[[0-9;]+m/.test(result.stdout);
            let plain = stripAnsi(result.stdout);

            // Remove curl progress noise lines
            plain = plain
                .split('\n')
                .filter(line => !/^\s*%/.test(line) && !/^\s*\d+\s+\d+/.test(line))
                .join('\n')
                .trim();

            // Limit very long outputs hard
            const maxChars = 1200;
            if (plain.length > maxChars) {
                plain = plain.slice(0, maxChars) + '\n...trimmed...';
            }

            if (!hasAnsi && plain.length < 200) {
                output += '`' + plain + '`\n\n';
            } else {
                output += '```text\n' + plain + '\n```\n\n';
            }
        }

        if (result.stderr) {
            output += '⚠️ **Errors:**\n```\n' + result.stderr + '\n```\n\n';
        }

        output += `✅ **Completed** in ${(result.executionTime / 1000).toFixed(2)}s\n`;
        output += `📊 Exit Code: ${result.exitCode}\n`;

        return output;
    };

    const executeAlias = async (alias: Alias, originalText?: string) => {
        setIsStreaming(true);
        setProcessingStatus(`Executing ${alias.name} (60s timeout)...`);
        let abortController: AbortController | null = null;

        // Show the user's command in the transcript
        onUpdateMessages(prev => [
            ...prev,
            {
                id: uuidv4(),
                sender: Sender.USER,
                text: originalText || alias.name,
                timestamp: Date.now(),
            },
        ]);

        try {
            abortController = new AbortController();
            aliasAbortRef.current = abortController;
            const response = await fetch('http://localhost:3010/api/alias/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aliasName: alias.name,
                    command: alias.command,
                    cwd: alias.cwd,
                    timeout: 60000,
                }),
                signal: abortController.signal,
            });

            const body = await response.json();
            if (!response.ok || !body.success) {
                throw new Error(body?.error || 'Alias execution failed');
            }

            const result: ExecutionResult = body.result;
            onUpdateMessages(prev => [
                ...prev,
                {
                    id: uuidv4(),
                    sender: Sender.AI,
                    text: formatAliasOutput(alias, result),
                    timestamp: Date.now(),
                },
            ]);
        } catch (err: any) {
            const aborted = err?.name === 'AbortError';
            onUpdateMessages(prev => [
                ...prev,
                {
                    id: uuidv4(),
                    sender: Sender.AI,
                    text: aborted ? '⏹️ **Command cancelled by user.**' : `❌ **Alias Execution Failed**\n\n${err?.message || 'Unknown error'}`,
                    timestamp: Date.now(),
                },
            ]);
        } finally {
            aliasAbortRef.current = null;
            setProcessingStatus(null);
            setShowAliasConfirmation(false);
            setConfirmationAlias(null);
            setIsStreaming(false);
        }
    };

    const handleConfirmAlias = async () => {
        if (!confirmationAlias) return;
        await executeAlias(confirmationAlias, confirmationAlias.name);
    };

    const handleCancelAlias = () => {
        setShowAliasConfirmation(false);
        setConfirmationAlias(null);
    };

    const handleCancelRunningCommand = () => {
        if (aliasAbortRef.current) {
            aliasAbortRef.current.abort();
        }
    };

    const handleViewAliasLogs = async () => {
        setProcessingStatus('Loading alias logs...');
        try {
            const res = await fetch('http://localhost:3010/api/alias/logs?limit=10');
            const body = await res.json();
            if (!res.ok || !body.success) {
                throw new Error(body?.error || 'Failed to load logs');
            }

            const logs = body.logs as Array<{ id: string; command: string; cwd: string; user: string; timestamp: number; exitCode: number; duration: number; source: string; }>;
            const formatted = logs.map(log => {
                const date = new Date(log.timestamp).toLocaleString();
                return `- ${date} [${log.source}] exit ${log.exitCode} (${log.duration}ms)\n  cwd: ${log.cwd}\n  cmd: ${log.command}`;
            }).join('\n\n');

            const text = `### 📜 Alias Execution Logs (latest ${logs.length})\n\n${formatted || 'No logs yet.'}`;
            onUpdateMessages(prev => [
                ...prev,
                {
                    id: uuidv4(),
                    sender: Sender.AI,
                    text,
                    timestamp: Date.now(),
                },
            ]);
        } catch (err: any) {
            onUpdateMessages(prev => [
                ...prev,
                {
                    id: uuidv4(),
                    sender: Sender.AI,
                    text: `❌ **Failed to load alias logs**\n\n${err?.message || 'Unknown error'}`,
                    timestamp: Date.now(),
                },
            ]);
        } finally {
            setProcessingStatus(null);
        }
    };

    // Shared quick hint footer for slash usage
    const buildSlashQuickHints = () => {
        // if (settings.showSlashHints === false) return ''; // Setting removed

        return `
**Quick commands:**
- /mcp-tools — list MCP tools
- /mcp-commands — MCP cheat sheet
- /weather <city> — weather snapshot
- /nmap <target> [flags] — port scan
- /trace <host> — traceroute
- /shodan <ip> — Shodan lookup
- /help — manuals
`;
    };

    // Lightweight help catalog (expandable without extra deps)
    const helpCatalog = [
        { name: 'start', command: '/help', usage: '/help', summary: 'Show the main help menu and how to ask for anything.', examples: ['/help mcp', '/help nmap'], tags: ['help', 'beginner', 'menu'] },
        { name: 'settings', command: '/settings', usage: '/settings', summary: 'Open Settings. Configure keys, models, MCP, and UI.', examples: ['/settings'], tags: ['config', 'keys', 'api', 'setup'] },
        { name: 'mcp', command: '/mcp-<tool> [input]', usage: '/mcp-brave_web_search query', summary: 'Call a Docker MCP tool via the gateway.', examples: ['/mcp-tools', '/mcp-commands', '/mcp-brave_web_search site:news.ycombinator.com ai'], tags: ['mcp', 'docker', 'tools', 'search'] },
        { name: 'mcp-tools', command: '/mcp-tools', usage: '/mcp-tools', summary: 'List available MCP tools from the gateway.', examples: ['/mcp-tools'], tags: ['mcp', 'list', 'tools'] },
        { name: 'mcp-commands', command: '/mcp-commands', usage: '/mcp-commands', summary: 'MCP cheat sheet with usage and examples.', examples: ['/mcp-commands'], tags: ['mcp', 'help', 'cheatsheet'] },
        { name: 'whois', command: '/whois <domain>', usage: '/whois example.com', summary: 'Whois lookup for a domain.', examples: ['/whois example.com'], tags: ['domain', 'recon'] },
        { name: 'dns', command: '/dns <domain>', usage: '/dns example.com', summary: 'DNS records lookup.', examples: ['/dns example.com'], tags: ['dns', 'records'] },
        { name: 'ssl', command: '/ssl <domain>', usage: '/ssl example.com', summary: 'SSL/TLS certificate check.', examples: ['/ssl example.com'], tags: ['ssl', 'cert'] },
        { name: 'reputation', command: '/reputation <domain>', usage: '/reputation example.com', summary: 'Google Safe Browsing reputation check.', examples: ['/reputation example.com'], tags: ['safety', 'web'] },
        { name: 'wayback', command: '/wayback <url>', usage: '/wayback https://example.com', summary: 'Wayback Machine snapshots.', examples: ['/wayback https://example.com'], tags: ['history', 'archive'] },
        { name: 'weather', command: '/weather [city]', usage: '/weather Dublin', summary: 'Quick weather for a city or auto-detect.', examples: ['/weather', '/weather London'], tags: ['weather', 'forecast'] },
        { name: 'nmap', command: '/nmap <target> [flags]', usage: '/nmap 10.10.10.50 -sV -sC', summary: 'Port scan with whitelist flags.', examples: ['/nmap 10.10.10.50', '/nmap 10.10.10.50 -A'], tags: ['scan', 'ports', 'network'] },
        { name: 'trace', command: '/trace <domain_or_ip>', usage: '/trace example.com', summary: 'Traceroute to a host.', examples: ['/trace 1.1.1.1'], tags: ['network', 'path'] },
        { name: 'shodan', command: '/shodan <ip>', usage: '/shodan 8.8.8.8', summary: 'Look up IP exposure on Shodan (needs API key).', examples: ['/shodan 1.1.1.1'], tags: ['security', 'ip', 'api'] },
        { name: 'geoip', command: '/geoip <ip>', usage: '/geoip 8.8.8.8', summary: 'Geolocate an IP.', examples: ['/geoip 8.8.8.8'], tags: ['ip', 'geo'] },
        { name: 'ipinfo', command: '/ipinfo <ip>', usage: '/ipinfo 8.8.8.8', summary: 'IP intelligence via IPInfo/ip-api.', examples: ['/ipinfo 8.8.8.8'], tags: ['ip', 'intel'] },
        { name: 'ports', command: '/ports <ip> [ports]', usage: '/ports 1.1.1.1 22,80,443', summary: 'Fast TCP port scan common ports.', examples: ['/ports 1.1.1.1'], tags: ['scan', 'ports'] },
        { name: 'profile', command: '/profile <domain>', usage: '/profile example.com', summary: 'Whois + DNS + SSL + Shodan report with AI summary.', examples: ['/profile example.com'], tags: ['intel', 'domain'] },
        { name: 'wp', command: '/wordpress', usage: '/wordpress', summary: 'Open the WordPress Command Center (local).', examples: ['/wordpress', '/check wordpress'], tags: ['wordpress', 'cms'] },
        { name: 'study', command: '/study', usage: '/study', summary: 'Open Study Clock (Pomodoro).', examples: ['/study'], tags: ['focus', 'timer'] },
        { name: 'imagine', command: '/imagine <prompt>', usage: '/imagine cyberpunk fox', summary: 'Generate images.', examples: ['/imagine sunset over Dublin'], tags: ['image', 'creative'] },
        { name: 'fun', command: '/joke', usage: '/joke', summary: 'Random joke.', examples: ['/chuck'], tags: ['fun'] },
    ];

    const levenshtein = (a: string, b: string) => {
        if (Math.abs(a.length - b.length) > 2) return 99;
        const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
        for (let i = 0; i <= a.length; i++) dp[i][0] = i;
        for (let j = 0; j <= b.length; j++) dp[0][j] = j;
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + cost
                );
            }
        }
        return dp[a.length][b.length];
    };

    const searchHelp = (query: string) => {
        const q = query.toLowerCase();
        const scored = helpCatalog
            .map(entry => {
                let score = 0;
                const cmdNoSlash = entry.command.replace('/', '').toLowerCase();
                const distName = levenshtein(entry.name, q);
                const distCmd = levenshtein(cmdNoSlash, q);
                if (entry.name === q || entry.command === q) score += 5;
                if (entry.name.startsWith(q) || entry.command.includes(q)) score += 3;
                if (distName <= 2 || distCmd <= 2) score += 3; // fuzzy typos (e.g., sodan -> shodan)
                if (entry.summary.toLowerCase().includes(q)) score += 2;
                if (entry.tags?.some(t => t.includes(q))) score += 2;
                if (entry.examples?.some(e => e.toLowerCase().includes(q))) score += 1;
                return { entry, score };
            })
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score);
        return scored.slice(0, 6).map(s => s.entry);
    };

    const formatHelpEntries = (entries: typeof helpCatalog) => {
        if (!entries.length) return 'No help found.';
        return entries.map(e => {
            const examples = e.examples?.length ? `Examples: ${e.examples.join(' · ')}` : '';
            return `**${e.command}** — ${e.summary}\nUsage: ${e.usage}\n${examples}`;
        }).join('\n\n');
    };

    const lastMessageText = [...session.messages].reverse().find(msg => msg.text)?.text || '';
    const handleCopyLastMessage = () => {
        if (!lastMessageText) return;
        navigator.clipboard.writeText(lastMessageText);
        setCopiedLast(true);
        setTimeout(() => setCopiedLast(false), 1600);
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

        // ⚫ DEATH STAR EASTER EGG: Type "/deathstar" for celebration
        if (lowerText.trim() === '/deathstar') {
            setShowDeathStarEasterEgg(true);
            onUpdateMessages((prev) => [
                ...prev,
                {
                    id: uuidv4(),
                    sender: Sender.AI,
                    text: '⚫ **Initiating Imperial Override Protocol...**\n\n*The Death Star is now operational, Commander.* 🎖️',
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

        // 🕐 STUDY CLOCK: Type "/study" to open Study Clock
        if (lowerText.trim() === '/study' && onOpenStudyClock) {
            onOpenStudyClock();
            onUpdateMessages((prev) => [
                ...prev,
                {
                    id: uuidv4(),
                    sender: Sender.AI,
                    text: '🕐 **Study Clock Activated!**\n\nTime to focus, Ranger! 🎖️\n\nYour study timer is now open and ready to go. Hit **Start** when you\'re ready to begin your session.\n\n*Pro Tip: Use keyboard shortcuts - Space (Play/Pause), R (Reset), M (Minimize)*',
                    timestamp: Date.now()
                }
            ]);
            return; // Don't process as normal message
        }

        // 📝 WORDPRESS: Type "/wordpress" to open WordPress Dashboard
        if (lowerText.trim() === '/wordpress' && onOpenWordPress) {
            onOpenWordPress();
            onUpdateMessages((prev) => [
                ...prev,
                {
                    id: uuidv4(),
                    sender: Sender.AI,
                    text: '📝 **Opening WordPress Dashboard...**\n\nAccess your local WordPress environment, manage posts, and publish content directly from RangerPlex.',
                    timestamp: Date.now()
                }
            ]);
            return; // Don't process as normal message
        }

        // 🔧 SYSTEM INFO: Type "/sys-info" for system diagnostics
        if (lowerText.trim() === '/sys-info' || lowerText.trim() === '/sysinfo') {
            setProcessingStatus('Generating system report...');

            try {
                const { systemInfoService } = await import('../services/systemInfoService');
                const report = await systemInfoService.generateReport();

                onUpdateMessages((prev) => [
                    ...prev,
                    {
                        id: uuidv4(),
                        sender: Sender.AI,
                        text: report,
                        timestamp: Date.now()
                    }
                ]);
            } catch (error) {
                onUpdateMessages((prev) => [
                    ...prev,
                    {
                        id: uuidv4(),
                        sender: Sender.AI,
                        text: `❌ **System Report Failed**\n\nUnable to generate system diagnostics: ${error instanceof Error ? error.message : String(error)}`,
                        timestamp: Date.now()
                    }
                ]);
            }

            setProcessingStatus(null);
            return; // Don't process as normal message
        }

        // ⚙️ SETTINGS: Type "/settings" or "/open settings" to open Settings Modal
        if (lowerText.trim() === '/settings' || lowerText.trim() === '/open settings') {
            onOpenSettings();
            onUpdateMessages((prev) => [
                ...prev,
                {
                    id: uuidv4(),
                    sender: Sender.AI,
                    text: '⚙️ **Opening Settings Panel...**\n\nConfigure your API keys, model preferences, theme settings, and more.\n\n*Pro Tip: Settings auto-save to both IndexedDB and the server for persistence!*',
                    timestamp: Date.now()
                }
            ]);
            return; // Don't process as normal message
        }

        // 🔄 SERVER RESTART: Type "/restart" or "/restart server"
        if (lowerText.trim() === '/restart' || lowerText.trim() === '/restart server') {
            onUpdateMessages((prev) => [
                ...prev,
                {
                    id: uuidv4(),
                    sender: Sender.AI,
                    text: '🔄 **Initiating Server Restart...**\n\nRestarting the RangerPlex proxy server. This will take ~5-10 seconds.\n\n*The page will automatically reconnect when the server is back online.*',
                    timestamp: Date.now()
                }
            ]);

            // Send restart command to server
            fetch('http://localhost:3010/api/server/restart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).catch(err => console.log('Server restarting...', err));

            return;
        }

        // 🔍 CHECK UPDATE: Type "/check update"
        if (lowerText.trim() === '/check update' || lowerText.trim() === '/update check') {
            onUpdateMessages((prev) => [
                ...prev,
                {
                    id: uuidv4(),
                    sender: Sender.AI,
                    text: '🔍 **Checking for updates...**',
                    timestamp: Date.now()
                }
            ]);

            fetch('http://localhost:3010/api/server/check-update')
                .then(res => res.json())
                .then(data => {
                    let updateMsg = `### 📦 RangerPlex Update Status\n\n`;
                    updateMsg += `**Current Version:** v${data.currentVersion}\n`;
                    updateMsg += `**Latest Version:** v${data.latestVersion}\n\n`;

                    if (data.updateAvailable) {
                        updateMsg += `✨ **Update Available!**\n\n`;
                        updateMsg += `Run \`/install update\` to upgrade to the latest version.\n\n`;
                        if (data.changelog) {
                            updateMsg += `**What's New:**\n${data.changelog}`;
                        }
                    } else {
                        updateMsg += `✅ **You're up to date!** 🎖️`;
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(),
                        sender: Sender.AI,
                        text: updateMsg,
                        timestamp: Date.now()
                    }]);
                })
                .catch(err => {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(),
                        sender: Sender.AI,
                        text: `❌ **Update check failed:**\n${err.message}\n\nMake sure the server is running and you have internet connectivity.`,
                        timestamp: Date.now()
                    }]);
                });

            return;
        }

        // 📥 INSTALL UPDATE: Type "/install update"
        if (lowerText.trim() === '/install update' || lowerText.trim() === '/update install') {
            onUpdateMessages((prev) => [
                ...prev,
                {
                    id: uuidv4(),
                    sender: Sender.AI,
                    text: '📥 **Installing RangerPlex Update...**\n\nThis will:\n1. Pull latest code from GitHub\n2. Install dependencies\n3. Restart the server\n\n*Check the terminal for installation progress.*',
                    timestamp: Date.now()
                }
            ]);

            fetch('http://localhost:3010/api/server/install-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
                .then(res => res.json())
                .then(data => {
                    let installMsg = '';
                    if (data.success) {
                        installMsg = `✅ **Update Installed Successfully!**\n\nRangerPlex has been updated to v${data.newVersion}.\n\n*The server will restart automatically.*`;
                    } else {
                        installMsg = `❌ **Update Installation Failed:**\n${data.error}\n\nCheck the terminal for details.`;
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(),
                        sender: Sender.AI,
                        text: installMsg,
                        timestamp: Date.now()
                    }]);
                })
                .catch(err => {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(),
                        sender: Sender.AI,
                        text: `❌ **Update failed:**\n${err.message}`,
                        timestamp: Date.now()
                    }]);
                });

            return;
        }

        // 🔍 WORDPRESS STATUS: Type "/check wordpress" or "/wordpress status"
        if (lowerText.trim() === '/check wordpress' || lowerText.trim() === '/wordpress status') {
            onUpdateMessages((prev) => [
                ...prev,
                {
                    id: uuidv4(),
                    sender: Sender.AI,
                    text: '🔍 **Checking WordPress Status...**',
                    timestamp: Date.now()
                }
            ]);

            fetch('http://localhost:3010/api/wordpress/status')
                .then(res => res.json())
                .then(data => {
                    let statusMsg = `### 📝 WordPress Status Report\n\n`;

                    if (data.running) {
                        statusMsg += `✅ **Status:** Online\n`;
                        statusMsg += `🌐 **URL:** ${data.url}\n`;
                        statusMsg += `📊 **Posts:** ${data.postCount || 'N/A'}\n`;
                        statusMsg += `📄 **Pages:** ${data.pageCount || 'N/A'}\n`;
                        statusMsg += `⚙️ **Version:** ${data.version || 'Unknown'}\n\n`;
                        statusMsg += `Type \`/wordpress\` to open the dashboard.`;
                    } else {
                        statusMsg += `❌ **Status:** Offline\n\n`;
                        statusMsg += `WordPress is not currently running.\n\n`;
                        statusMsg += `**Start WordPress:**\n`;
                        statusMsg += `\`\`\`bash\ncd ~/your-wordpress-path\nphp -S localhost:8080\n\`\`\``;
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(),
                        sender: Sender.AI,
                        text: statusMsg,
                        timestamp: Date.now()
                    }]);
                })
                .catch(err => {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(),
                        sender: Sender.AI,
                        text: `❌ **WordPress check failed:**\n${err.message}\n\nMake sure WordPress is configured in Settings.`,
                        timestamp: Date.now()
                    }]);
                });

            return;
        }

        // 🎯 ALIAS DETECTION (before slash commands continue)
        const aliasName = lowerText.trim().replace(/^\//, '');
        if (aliasName) {
            try {
                // Try exact name first
                let aliasMatch = await aliasService.getAlias(aliasName);
                // Fallback: prefix match on known aliases
                if (!aliasMatch) {
                    const all = await aliasService.getAllAliases();
                    aliasMatch = all.find(a => aliasName.startsWith(a.name)) || null;
                }

                if (aliasMatch) {
                    if (aliasMatch.requires_confirmation) {
                        setConfirmationAlias(aliasMatch);
                        setShowAliasConfirmation(true);
                    } else {
                        await executeAlias(aliasMatch, text);
                    }
                    return;
                }
            } catch (err) {
                onUpdateMessages(prev => [
                    ...prev,
                    {
                        id: uuidv4(),
                        sender: Sender.AI,
                        text: `❌ **Alias lookup failed**\n\n${err instanceof Error ? err.message : String(err)}`,
                        timestamp: Date.now(),
                    },
                ]);
                return;
            }
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

            const boundedHistory = trimHistoryForContext(
                session.messages,
                settings.chatHistoryMaxMessages,
                settings.chatHistoryMaxChars
            );

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

            // --- COMMAND HANDLING ---

            // Forensics Commands
            if (text.startsWith('/hash') || text.startsWith('/metadata') || text.startsWith('/exif') || text.startsWith('/timeline') || text.startsWith('/strings') || text.startsWith('/grep') || text.startsWith('/custody')) {
                const handled = await forensicCommandHandler.handleCommand(text);
                if (handled) {
                    let msg = '⚡ Command executed in terminal.';
                    if (text.startsWith('/hash')) msg = '🧬 Calculating hash... Check terminal for result.';
                    else if (text.startsWith('/metadata')) msg = '📄 Fetching metadata... Check terminal.';
                    else if (text.startsWith('/exif')) msg = '📸 Extracting EXIF data... Check terminal.';
                    else if (text.startsWith('/timeline')) msg = '⏳ Generating timeline... Check terminal.';
                    else if (text.startsWith('/strings') || text.startsWith('/grep')) msg = '🔤 Analyzing strings... Check terminal.';
                    else if (text.startsWith('/custody')) msg = '🔐 Chain of Custody updated. Check terminal.';

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(),
                        sender: Sender.AI,
                        text: msg,
                        timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    return;
                }
            }

            // Malware Commands
            if (text.startsWith('/malware-hash') || text.startsWith('/malware-fileinfo') || text.startsWith('/fileinfo') || text.startsWith('/malware-strings') || text.startsWith('/malware-entropy') || text.startsWith('/malware-hexdump') || text.startsWith('/hexdump') || text.startsWith('/ioc-extract') || text.startsWith('/malware-quarantine') || text.startsWith('/malware-restore') || text.startsWith('/malware-test') || text.startsWith('/malware-pe') || text.startsWith('/malware-elf') || text.startsWith('/vm-') || text.startsWith('/msf')) {
                const handled = await malwareCommandHandler.handleCommand(text);
                if (handled) {
                    let msg = '🦠 Malware analysis command executed.';
                    if (text.startsWith('/malware-hash')) msg = '🧬 Generating multi-hash report... Check terminal.';
                    else if (text.startsWith('/malware-fileinfo') || text.startsWith('/fileinfo')) msg = '📄 Analyzing file structure... Check terminal.';
                    else if (text.startsWith('/malware-strings')) msg = '🔤 Extracting strings & IOCs... Check terminal.';
                    else if (text.startsWith('/malware-entropy')) msg = '🎲 Calculating entropy... Check terminal.';
                    else if (text.startsWith('/malware-hexdump') || text.startsWith('/hexdump')) msg = '🔢 Generating hex dump... Check terminal.';
                    else if (text.startsWith('/ioc-extract')) msg = '🛡️ Extracting Indicators of Compromise... Check terminal.';
                    else if (text.startsWith('/malware-quarantine')) msg = '🔒 Quarantining file... Check terminal.';
                    else if (text.startsWith('/malware-restore')) msg = '🔓 Restoring file... Check terminal.';
                    else if (text.startsWith('/malware-test')) msg = '🧪 Test malware operation... Check terminal.';
                    else if (text.startsWith('/malware-pe')) msg = '👾 Analyzing PE headers... Check terminal.';
                    else if (text.startsWith('/malware-elf')) msg = '🐧 Analyzing ELF headers... Check terminal.';
                    else if (text.startsWith('/vm-')) msg = '🖥️ VM Management command sent... Check terminal.';
                    else if (text.startsWith('/msf')) msg = '🦁 Metasploit command sent to Kali... Check terminal.';

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(),
                        sender: Sender.AI,
                        text: msg,
                        timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    return;
                }
            }

            // 0a. Manual (/manual) - opens the in-app manual overlay
            if (text.trim() === '/manual') {
                onOpenManual?.();
                onUpdateMessages(prev => [...prev, {
                    id: uuidv4(),
                    sender: Sender.AI,
                    text: '📘 Opening the RangerPlex Manual… (click Back to return)',
                    timestamp: Date.now()
                }]);
                setIsStreaming(false);
                return;
            }

            // 0. About RangerPlex (/about)
            if (text.startsWith('/about')) {
                let aboutMsg = `### 💠 Hello There! Welcome to RangerPlex!\n\n`;
                aboutMsg += `**RangerPlex** is an advanced AI platform built to transform disabilities into superpowers.\n\n`;

                aboutMsg += `#### 🎖️ The Trinity\n`;
                aboutMsg += `RangerPlex is powered by three AI Rangers working together:\n`;
                aboutMsg += `- **🤖 Claude Ranger** - Advanced reasoning and strategic operations\n`;
                aboutMsg += `- **⚡ Gemini Ranger** - Fast responses and web grounding\n`;
                aboutMsg += `- **🏠 Ollama Ranger** - Local AI running on your machine\n\n`;

                aboutMsg += `#### 🍀 About the Commander\n`;
                aboutMsg += `Created by **David T. Keane (IrishRanger)**, a combat veteran and tech innovator on a mission to help 1.3 billion people worldwide through RangerOS.\n\n`;

                aboutMsg += `*"Disabilities → Superpowers" is not just a motto, it's our mission.*\n\n`;

                aboutMsg += `#### ☕ Support the Mission\n`;
                aboutMsg += `If RangerPlex helps you, consider fueling the development:\n`;
                aboutMsg += `**Bitcoin (BTC):** \`bc1q3jvxvhqt7u7qnnjjv5jtkh7wsgg9nrgk3hgsce\`\n\n`;

                aboutMsg += `---\n`;
                aboutMsg += `**Need help?** Type \`/help\` to see available commands.\n`;
                aboutMsg += `**Ready to explore?** Try asking me anything or use one of the tactical modules!`;

                onUpdateMessages(prev => [...prev, {
                    id: uuidv4(), sender: Sender.AI, text: aboutMsg, timestamp: Date.now()
                }]);

                setIsStreaming(false);
                return;
            }

            // 1. Help System (/help)
            if (text.startsWith('/help')) {
                const query = text.replace('/help', '').trim();

                const starterEntries = helpCatalog.filter(h => ['settings', 'mcp', 'mcp-tools', 'weather', 'nmap', 'profile', 'wp'].includes(h.name));

                let helpMsg = '';
                if (!query) {
                    helpMsg = `### 💡 Help & Quick Start\n\n` +
                        `Ask in plain language: \`/help how do I scan ports?\` or \`/help mcp tools\`.\n\n` +
                        `**Starter commands:**\n${formatHelpEntries(starterEntries)}\n\n` +
                        `**Tips:**\n- Use \`/mcp-tools\` to see gateway tools (Docker MCP).\n- Use \`/help <topic>\` to jump to a tool (e.g., \`/help shodan\`, \`/help wordpress\`).\n- Not sure what to type? Just describe the task (check a domain for risks) and I’ll suggest a command.\n`;
                } else {
                    const matches = searchHelp(query);
                    if (matches.length) {
                        const tryCmd = matches[0].examples?.[0] || matches[0].command;
                        helpMsg = `### 🔍 Help results for: \"${query}\"\n\n${formatHelpEntries(matches)}\n\nTry running: \`${tryCmd}\``;
                    } else {
                        helpMsg = `### ❓ I couldn’t find a direct match for \"${query}\".\n\n` +
                            `Here are popular commands:\n${formatHelpEntries(helpCatalog.slice(0, 6))}\n\n` +
                            `Tip: use keywords like \"ports\", \"weather\", \"mcp\", \"wordpress\", \"scan\", \"trace\", \"search\".`;
                    }
                }

                helpMsg += buildSlashQuickHints();

                onUpdateMessages(prev => [...prev, {
                    id: uuidv4(), sender: Sender.AI, text: helpMsg, timestamp: Date.now()
                }]);

                setIsStreaming(false);
                return;
            }


            // 10. The Profiler (/profile)
            if (text.startsWith('/profile')) {
                setProcessingStatus("Initializing Profiler...");
                const domain = text.replace('/profile', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    // 1. Whois
                    setProcessingStatus("Step 1/4: Fetching Whois...");
                    const whoisRes = await fetch(`${proxyUrl}/api/tools/whois`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain })
                    }).then(r => r.json()).catch(e => ({ error: e.message }));

                    // 2. DNS
                    setProcessingStatus("Step 2/4: Resolving DNS...");
                    const dnsRes = await fetch(`${proxyUrl}/api/tools/dns`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain })
                    }).then(r => r.json()).catch(e => ({ error: e.message }));

                    // 3. SSL
                    setProcessingStatus("Step 3/4: Inspecting SSL...");
                    const sslRes = await fetch(`${proxyUrl}/api/tools/ssl`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain })
                    }).then(r => r.json()).catch(e => ({ error: e.message }));

                    // 4. Shodan (if IP available)
                    let shodanRes = null;
                    if (dnsRes.A && dnsRes.A.length > 0 && settings.shodanApiKey) {
                        setProcessingStatus("Step 4/4: Scanning Shodan...");
                        shodanRes = await fetch(`${proxyUrl}/api/tools/shodan`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip: dnsRes.A[0], apiKey: settings.shodanApiKey })
                        }).then(r => r.json()).catch(e => ({ error: e.message }));
                    }

                    // 5. AI Analysis
                    setProcessingStatus("Generating Threat Report...");
                    const contextData = JSON.stringify({
                        target: domain,
                        whois: whoisRes,
                        dns: dnsRes,
                        ssl: sslRes,
                        shodan: shodanRes
                    }, null, 2);

                    const prompt = `
                    ACT AS: A Senior Cyber Threat Intelligence Analyst.
                    MISSION: Analyze the following reconnaissance data for the target domain '${domain}' and generate a professional Threat Intelligence Report.
                    
                    DATA:
                    ${contextData}

                    REPORT FORMAT:
                    1. **Executive Summary**: High-level assessment of the target's security posture.
                    2. **Infrastructure Analysis**: Key findings from DNS and Shodan (hosting provider, server location, open ports).
                    3. **Security Posture**: Analysis of SSL and Whois data (expiry dates, registrar reputation).
                    4. **Vulnerabilities & Risks**: Potential attack vectors based on open ports or outdated software.
                    5. **Recommendations**: Actionable steps to improve security.

                    TONE: Professional, objective, and concise. Use bullet points.
                    `;

                    // Send invisible system prompt to AI
                    const profilerPlaceholder: Message = { id: uuidv4(), sender: Sender.AI, text: '', timestamp: Date.now(), isThinking: true };

                    const res = await streamGeminiResponse(
                        prompt, [], boundedHistory, modelToUse as any, false, [],
                        (txt, sources) => onUpdateMessages([...currentMessages, { ...profilerPlaceholder, text: txt, isThinking: false, groundingSources: sources }]),
                        settings.geminiApiKey, settings.matrixMode, settings.theme === 'tron', settings.modelParams, commandState
                    );

                    // We don't need to do anything with res.text here as the stream callback handles it

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Profiler Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 11. Sherlock (Username Scout)
            if (text.startsWith('/sherlock')) {
                setProcessingStatus("Hunting for Username...");
                const username = text.replace('/sherlock', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const res = await fetch(`${proxyUrl}/api/tools/sherlock`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 🔎 Sherlock Scan: '${username}'\n\n`;
                    msg += `**Scanned:** ${res.total_checked} platforms\n`;
                    msg += `**Matches:** ${res.matches.length}\n\n`;

                    if (res.matches.length > 0) {
                        msg += `**✅ Positive Matches:**\n`;
                        res.matches.forEach((site: any) => {
                            if (site.status === 'found') {
                                msg += `- **[${site.name}](${site.url})**\n`;
                            }
                        });

                        const falsePositives = res.matches.filter((s: any) => s.status === 'false_positive');
                        if (falsePositives.length > 0) {
                            msg += `\n**⚠️ Potential False Positives (Entrapment Check):**\n`;
                            msg += `*These sites returned "200 OK" but may be empty profiles or "User Not Found" pages designed to make you sign up.*\n`;
                            falsePositives.forEach((site: any) => {
                                msg += `- [${site.name}](${site.url}) (Status: ${site.status})\n`;
                            });
                        }
                    } else {
                        msg += `*No public profiles found for this username on major platforms.*\n`;
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Sherlock Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 12. Crypto Intelligence (/crypto)
            if (text.startsWith('/crypto')) {
                setProcessingStatus("Fetching Market Data...");
                const symbol = text.replace('/crypto', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const res = await fetch(`${proxyUrl}/api/tools/crypto`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    const isUp = res.change_24h >= 0;
                    const arrow = isUp ? '📈' : '📉';
                    const color = isUp ? 'green' : 'red';

                    let msg = `### 💰 ${res.name} (${res.symbol.toUpperCase()})\n\n`;
                    msg += `**Price:** $${res.price.toLocaleString()}\n`;
                    msg += `**24h Change:** ${arrow} ${res.change_24h.toFixed(2)}%\n`;
                    msg += `**Market Cap:** $${(res.market_cap / 1e9).toFixed(2)}B\n`;
                    msg += `**Rank:** #${res.rank}\n\n`;
                    msg += `![Icon](${res.thumb})\n`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Crypto Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 13. Bitcoin Wallet Inspector (/wallet)
            if (text.startsWith('/wallet')) {
                setProcessingStatus("Scanning Blockchain...");
                const address = text.replace('/wallet', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const res = await fetch(`${proxyUrl}/api/tools/wallet`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 🏦 Bitcoin Wallet Inspector\n\n`;
                    msg += `**Address:** \`${res.address}\`\n\n`;
                    msg += `**💰 Balance:** ${res.balance_btc.toFixed(8)} BTC\n`;
                    msg += `**💵 Value:** $${res.balance_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
                    msg += `**📊 Activity:**\n`;
                    msg += `- **Total Received:** ${res.total_received.toFixed(8)} BTC\n`;
                    msg += `- **Total Sent:** ${res.total_sent.toFixed(8)} BTC\n`;
                    msg += `- **Transactions:** ${res.n_tx}\n`;

                    if (res.unconfirmed_balance !== 0) {
                        msg += `\n*⚠️ Unconfirmed: ${res.unconfirmed_balance.toFixed(8)} BTC*\n`;
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Wallet Scan Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 15. IP Geolocation (/geoip)
            if (text.startsWith('/geoip')) {
                setProcessingStatus("Locating Target...");
                const ip = text.replace('/geoip', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const res = await fetch(`${proxyUrl}/api/tools/geoip`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 🌍 GeoIP Intelligence: ${res.query}\n\n`;
                    msg += `**📍 Location:** ${res.city}, ${res.regionName}, ${res.country} (${res.countryCode})\n`;
                    msg += `**🏢 ISP:** ${res.isp}\n`;
                    msg += `**🏢 Organization:** ${res.org}\n`;
                    msg += `**📡 AS Number:** ${res.as}\n`;
                    msg += `**🗺️ Coordinates:** ${res.lat}, ${res.lon}\n`;
                    msg += `**🕒 Timezone:** ${res.timezone}\n\n`;
                    msg += `[View on Google Maps](https://www.google.com/maps?q=${res.lat},${res.lon})`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ GeoIP Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 16. MAC Address Lookup (/mac)
            if (text.startsWith('/mac')) {
                setProcessingStatus("Identifying Hardware...");
                const mac = text.replace('/mac', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const res = await fetch(`${proxyUrl}/api/tools/mac`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mac })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 📟 Hardware Recon: ${res.mac}\n\n`;
                    msg += `**🏭 Manufacturer:** ${res.vendor}\n`;
                    msg += `**🔍 OUI:** ${res.mac.substring(0, 8).toUpperCase()}\n\n`;
                    msg += `*This identifies the company that built the network interface (e.g., Apple, Cisco, Intel).*`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ MAC Lookup Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 17. My IP (/myip)
            if (text.startsWith('/myip')) {
                setProcessingStatus("Detecting Your IP...");
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    // Get public IP
                    const ipRes = await fetch(`${proxyUrl}/api/tools/myip`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }
                    }).then(r => r.json());

                    if (ipRes.error) throw new Error(ipRes.error);

                    // Get location info
                    const token = settings.ipinfoToken || '';
                    const res = await fetch(`${proxyUrl}/api/tools/ipinfo`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip: ipRes.ip, token })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 🔍 Your Public IP: ${ipRes.ip}\n\n`;
                    msg += `**📍 Location:** ${res.city}, ${res.region || res.regionName}, ${res.country}\n`;
                    msg += `**🏢 ISP:** ${res.org || res.isp}\n`;

                    if (res.loc) {
                        const [lat, lon] = res.loc.split(',');
                        msg += `**🗺️ Coordinates:** ${lat}, ${lon}\n`;
                        msg += `**🕒 Timezone:** ${res.timezone}\n\n`;
                        msg += `[View on Google Maps](https://www.google.com/maps?q=${lat},${lon})\n\n`;
                    }

                    msg += `*Data Source: ${res.source === 'ipinfo' ? 'IPInfo (Premium)' : 'ip-api (Free)'}*`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ IP Detection Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 18. IP Info (/ipinfo)
            if (text.startsWith('/ipinfo')) {
                setProcessingStatus("Analyzing IP...");
                const ip = text.replace('/ipinfo', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const token = settings.ipinfoToken || '';
                    const res = await fetch(`${proxyUrl}/api/tools/ipinfo`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip, token })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 🌐 IP Intelligence: ${res.ip || ip}\n\n`;
                    msg += `**📍 Location:** ${res.city}, ${res.region || res.regionName}, ${res.country}\n`;
                    msg += `**🏢 Organization:** ${res.org || res.isp}\n`;

                    if (res.loc) {
                        const [lat, lon] = res.loc.split(',');
                        msg += `**🗺️ Coordinates:** ${lat}, ${lon}\n`;
                        msg += `**🕒 Timezone:** ${res.timezone}\n`;

                        // IPInfo-specific fields
                        if (res.source === 'ipinfo') {
                            if (res.hostname) msg += `**🖥️ Hostname:** ${res.hostname}\n`;
                            if (res.postal) msg += `**📮 Postal:** ${res.postal}\n`;
                        }

                        msg += `\n[View on Google Maps](https://www.google.com/maps?q=${lat},${lon})\n\n`;
                    }

                    msg += `*Data Source: ${res.source === 'ipinfo' ? 'IPInfo (Premium)' : 'ip-api (Free)'}*\n\n`;
                    msg += `💡 *For threat detection (VPN/Proxy/Tor), use \`/iprecon ${ip}\`*`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ IP Analysis Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 19. Phone Intel (/phone)
            if (text.startsWith('/phone')) {
                setProcessingStatus("Analyzing Phone Number...");
                const number = text.replace('/phone', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    if (!settings.numverifyApiKey) {
                        throw new Error('NumVerify API key not configured. Add it in Settings → Providers.');
                    }

                    const res = await fetch(`${proxyUrl}/api/tools/phone`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ number, apiKey: settings.numverifyApiKey })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 📱 Phone Intelligence: ${res.number || number}\n\n`;

                    if (res.valid) {
                        msg += `**✅ Valid Number**\n\n`;
                        msg += `**📍 Location:** ${res.location || 'Unknown'}\n`;
                        msg += `**🌍 Country:** ${res.country_name} (${res.country_code})\n`;
                        msg += `**📞 Carrier:** ${res.carrier || 'Unknown'}\n`;
                        msg += `**📡 Line Type:** ${res.line_type || 'Unknown'}\n`;
                        msg += `**🔢 International Format:** ${res.international_format || 'N/A'}\n`;
                        msg += `**🔢 Local Format:** ${res.local_format || 'N/A'}\n\n`;
                    } else {
                        msg += `**❌ Invalid Number**\n\n`;
                    }

                    msg += `**📊 API Usage:** ${res.requestCount}/${res.requestLimit} requests this month\n`;

                    if (res.requestCount >= 90) {
                        msg += `\n⚠️ *Warning: Approaching monthly limit!*`;
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Phone Analysis Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 20. Email Validation (/email)
            if (text.startsWith('/email')) {
                setProcessingStatus("Validating Email...");
                const email = text.replace('/email', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    if (!settings.abstractEmailApiKey) {
                        throw new Error('AbstractAPI key not configured. Add it in Settings → Providers.');
                    }

                    const res = await fetch(`${proxyUrl}/api/tools/email`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, apiKey: settings.abstractEmailApiKey })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 📧 Email Intelligence: ${res.email || email}\n\n`;

                    // Deliverability
                    if (res.deliverability === 'DELIVERABLE') {
                        msg += `**✅ Deliverable**\n\n`;
                    } else if (res.deliverability === 'UNDELIVERABLE') {
                        msg += `**❌ Undeliverable**\n\n`;
                    } else {
                        msg += `**⚠️ Unknown Deliverability**\n\n`;
                    }

                    // Quality Score
                    msg += `**📊 Quality Score:** ${res.quality_score || 'N/A'}\n`;

                    // Checks
                    msg += `**✉️ Valid Format:** ${res.is_valid_format?.value ? '✅' : '❌'}\n`;
                    msg += `**🔍 SMTP Check:** ${res.is_smtp_valid?.value ? '✅' : '❌'}\n`;
                    msg += `**🗑️ Disposable:** ${res.is_disposable_email?.value ? '⚠️ Yes' : '✅ No'}\n`;
                    msg += `**🎭 Role Account:** ${res.is_role_email?.value ? '⚠️ Yes (info@, admin@)' : '✅ No'}\n`;
                    msg += `**🌐 Free Provider:** ${res.is_free_email?.value ? '✅ Yes' : '❌ No'}\n\n`;

                    msg += `**📊 API Usage:** ${res.requestCount}/${res.requestLimit} requests this month\n`;

                    if (res.requestCount >= 90) {
                        msg += `\n⚠️ *Warning: Approaching monthly limit!*`;
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Email Validation Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 21. IP Reconnaissance (/iprecon)
            if (text.startsWith('/iprecon')) {
                setProcessingStatus("Analyzing IP Threats...");
                const ip = text.replace('/iprecon', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    if (!settings.abstractIpApiKey) {
                        throw new Error('AbstractAPI key not configured. Add it in Settings → Providers.');
                    }

                    const res = await fetch(`${proxyUrl}/api/tools/iprecon`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ip, apiKey: settings.abstractIpApiKey })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 🛡️ IP Threat Intelligence: ${res.ip_address || ip}\n\n`;

                    // Threat Indicators
                    msg += `**🎭 VPN Detected:** ${res.is_vpn ? '⚠️ Yes' : '✅ No'}\n`;
                    msg += `**🔀 Proxy Detected:** ${res.is_proxy ? '⚠️ Yes' : '✅ No'}\n`;
                    msg += `**🧅 Tor Exit Node:** ${res.is_tor ? '⚠️ Yes' : '✅ No'}\n`;
                    msg += `**🏢 Datacenter IP:** ${res.is_datacenter ? '⚠️ Yes' : '✅ No'}\n\n`;

                    // Abuse Score
                    if (res.abuse_confidence_score !== undefined) {
                        const score = res.abuse_confidence_score;
                        let scoreEmoji = '✅';
                        if (score > 75) scoreEmoji = '🚨';
                        else if (score > 50) scoreEmoji = '⚠️';
                        else if (score > 25) scoreEmoji = '⚡';

                        msg += `**📊 Abuse Score:** ${scoreEmoji} ${score}% (0 = Clean, 100 = Malicious)\n\n`;
                    }

                    // Location
                    if (res.country) {
                        msg += `**📍 Location:** ${res.city || 'Unknown'}, ${res.region || 'Unknown'}, ${res.country}\n`;
                        msg += `**🌍 Country Code:** ${res.country_code}\n`;
                    }

                    // Recommendation
                    if (res.is_vpn || res.is_proxy || res.is_tor || (res.abuse_confidence_score && res.abuse_confidence_score > 50)) {
                        msg += `\n⚠️ **Recommendation:** This IP shows suspicious indicators. Exercise caution.`;
                    } else {
                        msg += `\n✅ **Recommendation:** No major threat indicators detected.`;
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ IP Recon Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 22. System Recon (/sys)
            if (text.startsWith('/sys')) {
                setProcessingStatus("Analyzing System...");
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    // 1. Get Client-Side Info
                    const browserInfo = {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                        language: navigator.language,
                        screen: `${window.screen.width}x${window.screen.height}`,
                        colorDepth: window.screen.colorDepth,
                        cores: navigator.hardwareConcurrency,
                        memory: (navigator as any).deviceMemory || 'Unknown'
                    };

                    // 2. Get Server-Side Info (Local Machine)
                    const res = await fetch(`${proxyUrl}/api/tools/system`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 💻 System Reconnaissance Report\n\n`;

                    msg += `#### 🖥️ Device Fingerprint (Browser)\n`;
                    msg += `**OS:** ${browserInfo.platform}\n`;
                    msg += `**Screen:** ${browserInfo.screen} (${browserInfo.colorDepth}-bit)\n`;
                    msg += `**Cores:** ${browserInfo.cores}\n`;
                    msg += `**RAM:** ~${browserInfo.memory} GB (Browser Limit)\n`;
                    msg += `**Locale:** ${browserInfo.language}\n\n`;

                    msg += `#### ⚙️ Host Machine (Server)\n`;
                    msg += `**Hostname:** ${res.hostname}\n`;
                    msg += `**OS Release:** ${res.platform} ${res.release}\n`;
                    msg += `**CPU:** ${res.cpu} (${res.cores} Cores)\n`;
                    msg += `**Total Memory:** ${(res.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB\n`;
                    msg += `**Free Memory:** ${(res.memory.free / 1024 / 1024 / 1024).toFixed(2)} GB\n\n`;

                    msg += `#### 🌐 Network Identity\n`;
                    msg += `**MAC Address:** \`${res.mac}\` (Local Interface)\n`;

                    // Show IPs
                    Object.keys(res.network).forEach(iface => {
                        msg += `**${iface}:** ${res.network[iface].join(', ')}\n`;
                    });

                    msg += `\n*Note: This data represents the machine running the RangerPlex server (Localhost).*`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ System Recon Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 20. Wayback Machine (/wayback)
            if (text.startsWith('/wayback')) {
                setProcessingStatus("Searching Archives...");
                const url = text.replace('/wayback', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const res = await fetch(`${proxyUrl}/api/tools/wayback`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 🕰️ Wayback Machine: ${url}\n\n`;

                    if (res.status === 'not_found') {
                        msg += `**Status:** ❌ No archived snapshots found\n\n`;
                        msg += `*This URL has not been archived by the Internet Archive, or the URL may be incorrect.*\n\n`;
                        msg += `[Request Archive](https://web.archive.org/save/${url})`;
                    } else {
                        // Parse timestamp (format: YYYYMMDDhhmmss)
                        const ts = res.latest_snapshot.timestamp;
                        const year = ts.substring(0, 4);
                        const month = ts.substring(4, 6);
                        const day = ts.substring(6, 8);
                        const hour = ts.substring(8, 10);
                        const minute = ts.substring(10, 12);
                        const formattedDate = `${year}-${month}-${day} ${hour}:${minute} UTC`;

                        msg += `**Status:** ✅ Found in Archive\n\n`;

                        msg += `#### 📸 Latest Snapshot\n`;
                        msg += `**Date:** ${formattedDate}\n`;
                        msg += `**View:** [Open Snapshot](${res.latest_snapshot.url})\n\n`;

                        if (res.total_snapshots > 0) {
                            msg += `#### 📊 Archive Stats\n`;
                            msg += `**Total Snapshots:** ${res.total_snapshots.toLocaleString()}\n`;
                            msg += `**First Archived:** ${res.first_snapshot}\n`;
                            msg += `**Last Archived:** ${res.last_snapshot}\n`;
                            msg += `**Years Available:** ${res.years_archived.join(', ')}\n\n`;
                        }

                        msg += `#### 🔗 Useful Links\n`;
                        msg += `- [View All Snapshots](https://web.archive.org/web/*/${url})\n`;
                        msg += `- [Calendar View](https://web.archive.org/web/*/${url})\n`;
                        msg += `- [Save Page Now](https://web.archive.org/save/${url})`;
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Wayback Machine Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 21. Subdomain Enumeration (/subdomains)
            if (text.startsWith('/subdomains')) {
                setProcessingStatus("Enumerating Subdomains...");
                const domain = text.replace('/subdomains', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                if (!domain) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: '❌ Usage: `/subdomains <domain>` (e.g., `/subdomains example.com`)', timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    setProcessingStatus(null);
                    return;
                }

                try {
                    const res = await fetch(`${proxyUrl}/api/tools/subdomains`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 🔍 Subdomain Enumeration: ${res.domain}\n\n`;

                    msg += `**Data Source:** Certificate Transparency Logs (crt.sh)\n\n`;

                    msg += `#### 📊 Discovery Summary\n`;
                    msg += `**Total Certificates:** ${res.total_certificates.toLocaleString()}\n`;
                    msg += `**Unique Subdomains:** ${res.total_subdomains}\n`;
                    msg += `**Wildcard Domains:** ${res.total_wildcards}\n\n`;

                    if (res.total_subdomains === 0) {
                        msg += `*No subdomains found in Certificate Transparency logs. The domain may not have SSL certificates, or subdomains are not publicly disclosed.*`;
                    } else {
                        // Display subdomains (limit to 50 for readability)
                        msg += `#### 🌐 Discovered Subdomains\n\n`;
                        msg += '```text\n';
                        const displaySubdomains = res.subdomains.slice(0, 50);
                        displaySubdomains.forEach((sub: string) => {
                            msg += `${sub}\n`;
                        });
                        if (res.total_subdomains > 50) {
                            msg += `\n... and ${res.total_subdomains - 50} more\n`;
                        }
                        msg += '```\n\n';

                        // Display wildcards if any
                        if (res.total_wildcards > 0) {
                            msg += `#### 🌟 Wildcard Certificates\n\n`;
                            msg += '```text\n';
                            res.wildcards.forEach((wild: string) => {
                                msg += `${wild}\n`;
                            });
                            msg += '```\n\n';
                        }

                        // Add security notes
                        msg += `#### 🛡️ Security Note\n`;
                        msg += `*Subdomains reveal infrastructure architecture and can be entry points for attacks. `;
                        msg += `Each subdomain should be assessed for proper security configuration.*\n\n`;

                        // Useful links
                        msg += `#### 🔗 Further Analysis\n`;
                        msg += `- Run \`/shodan <ip>\` on discovered IPs\n`;
                        msg += `- Check \`/ssl <subdomain>\` for certificate validity\n`;
                        msg += `- Use \`/headers <subdomain>\` to audit security headers`;
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Subdomain Enumeration Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // Company Registry Lookup (/company)
            if (text.startsWith('/company')) {
                setProcessingStatus("Fetching company record...");
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';
                const raw = text.replace('/company', '').trim();

                if (!raw) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: '❌ Usage: `/company <name|reg_number> [country]` (e.g., `/company "Acme Widgets Ltd" uk`)', timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    setProcessingStatus(null);
                    return;
                }

                if (!settings.companiesHouseApiKey && !settings.openCorporatesApiKey) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(),
                        sender: Sender.AI,
                        text: "⚠️ Please add a Companies House API key (UK) or an OpenCorporates API token in Settings → Providers to use `/company`.",
                        timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    setProcessingStatus(null);
                    return;
                }

                const parts = raw.match(/\"[^\"]+\"|“[^”]+”|[^\s]+/g) || [];
                let country = '';
                let query = raw;
                if (parts.length > 1) {
                    const candidate = parts[parts.length - 1].replace(/^["“]|["”]$/g, '');
                    if (/^[a-z]{2}(?:-[a-z0-9]{2,3})?$/i.test(candidate)) {
                        country = candidate.toLowerCase();
                        parts.pop();
                        query = parts.join(' ');
                    }
                }
                query = query.replace(/^["“]|["”]$/g, '').trim();

                if (!query) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: '❌ Usage: `/company <name|reg_number> [country]`', timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    setProcessingStatus(null);
                    return;
                }

                try {
                    const res = await fetch(`${proxyUrl}/api/tools/company`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            query,
                            country,
                            chApiKey: settings.companiesHouseApiKey,
                            ocApiKey: settings.openCorporatesApiKey
                        })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    if (res.status === 'not_found') {
                        onUpdateMessages(prev => [...prev, {
                            id: uuidv4(),
                            sender: Sender.AI,
                            text: `⚠️ No company match found for \`${query}\`${country ? ` in \`${country}\`` : ''}.`,
                            timestamp: Date.now()
                        }]);
                        setIsStreaming(false);
                        setProcessingStatus(null);
                        return;
                    }

                    const company = res.company || {};
                    const officers = (res.officers || []).slice(0, 5);
                    const pscs = (res.pscs || []).slice(0, 5);
                    const filings = (res.filings || []).slice(0, 5);
                    const address = company.address || company.registered_address || company.registered_address_in_full;
                    const industryCodes = (company.sic_codes && company.sic_codes.length > 0)
                        ? company.sic_codes
                        : (company.industry_codes || [])
                            .map((c: any) => c.code || c.industry_code || c.description)
                            .filter(Boolean);

                    const sourceLabel = res.source === 'companies_house' ? 'Companies House (UK)' : 'OpenCorporates';
                    const notes: string[] = [];
                    if (res.usedFallback) notes.push('fallback source');
                    if (res.matchedFromSearch) notes.push('matched via search');

                    let msg = `### 🏢 Company Lookup: ${company.name || query}\n\n`;
                    msg += `**Source:** ${sourceLabel}${notes.length ? ` (${notes.join('; ')})` : ''}\n`;
                    if (company.number) msg += `**Company #:** ${company.number}\n`;
                    if (company.jurisdiction) msg += `**Jurisdiction:** ${String(company.jurisdiction).toUpperCase()}\n`;
                    if (company.status || company.current_status) msg += `**Status:** ${company.status || company.current_status}\n`;
                    if (company.incorporation_date) msg += `**Incorporated:** ${company.incorporation_date}\n`;
                    if (company.dissolution_date) msg += `**Dissolved:** ${company.dissolution_date}\n`;
                    if (address) msg += `**Registered Address:** ${address}\n`;
                    if (industryCodes.length) msg += `**SIC/Industry Codes:** ${industryCodes.join(', ')}\n`;
                    if (company.last_accounts) msg += `**Last Accounts:** ${company.last_accounts}\n`;
                    if (company.last_confirmation_statement) msg += `**Last Confirmation Statement:** ${company.last_confirmation_statement}\n`;
                    if (company.has_insolvency_history !== undefined) msg += `**Insolvency History:** ${company.has_insolvency_history ? 'Yes' : 'No'}\n`;
                    if (company.opencorporates_url) msg += `**Registry URL:** ${company.opencorporates_url}\n`;

                    if (officers.length) {
                        msg += `\n#### 👤 Active Officers (top ${officers.length})\n`;
                        officers.forEach((o: any) => {
                            msg += `- ${o.name || 'Unknown'} — ${o.role || 'Officer'}${o.appointed_on ? ` (appointed ${o.appointed_on})` : ''}${o.resigned_on ? `, resigned ${o.resigned_on}` : ''}\n`;
                        });
                    }

                    if (pscs.length) {
                        msg += `\n#### 👑 People with Significant Control (top ${pscs.length})\n`;
                        pscs.forEach((p: any) => {
                            msg += `- ${p.name || 'Unknown'} — ${p.nature_of_control ? p.nature_of_control.join(', ') : 'Control details unavailable'}\n`;
                        });
                    }

                    if (filings.length) {
                        msg += `\n#### 📂 Recent Filings (top ${filings.length})\n`;
                        filings.forEach((f: any) => {
                            msg += `- ${f.date}: ${f.description || f.category || 'Filing'}\n`;
                        });
                    }

                    msg += `\n*Data provided by ${sourceLabel}. Information may not be real-time.*`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Company Lookup Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // Weather Command (/weather)
            if (text.startsWith('/weather')) {
                setProcessingStatus("Checking Weather...");
                const location = text.replace('/weather', '').trim();
                // Use wttr.in with JSON format (format=j1)
                const weatherUrl = location
                    ? `https://wttr.in/${encodeURIComponent(location)}?format=j1`
                    : `https://wttr.in/?format=j1`;

                try {
                    const res = await fetch(weatherUrl).then(r => r.json());

                    const current = res.current_condition[0];
                    const nearest = res.nearest_area[0];

                    // Determine location name to display
                    let locationName = location;
                    if (!locationName) {
                        const area = nearest.areaName?.[0]?.value;
                        const country = nearest.country?.[0]?.value;
                        locationName = area && country ? `${area}, ${country}` : 'Your Location';
                    } else {
                        // Capitalize first letter of location for display
                        locationName = locationName.charAt(0).toUpperCase() + locationName.slice(1);
                    }

                    let msg = `### 🌦️ Weather Report: ${locationName}\n\n`;
                    msg += `**🌡️ Temperature:** ${current.temp_C}°C / ${current.temp_F}°F\n`;
                    msg += `**🤔 Feels Like:** ${current.FeelsLikeC}°C / ${current.FeelsLikeF}°F\n`;
                    msg += `**📝 Condition:** ${current.weatherDesc[0].value}\n`;
                    msg += `**💨 Wind:** ${current.windspeedKmph} km/h (${current.winddir16Point})\n`;
                    msg += `**💧 Humidity:** ${current.humidity}%\n`;
                    msg += `**👁️ Visibility:** ${current.visibility} km\n\n`;

                    msg += `#### 📅 3-Day Forecast\n`;
                    res.weather.slice(0, 3).forEach((day: any) => {
                        // Get noon weather description (index 4 is usually around 12:00 PM)
                        const noonWeather = day.hourly[4]?.weatherDesc?.[0]?.value || day.hourly[0]?.weatherDesc?.[0]?.value || "N/A";
                        msg += `**${day.date}:** Max ${day.maxtempC}°C / Min ${day.mintempC}°C — *${noonWeather}*\n`;
                    });

                    msg += `\n*Powered by wttr.in*`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Weather Check Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // Privacy Snapshot (/privacy)
            if (text.startsWith('/privacy')) {
                setProcessingStatus("Collecting privacy snapshot...");
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const res = await fetch(`${proxyUrl}/api/tools/privacy`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({})
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    const hdr = res.headers || {};
                    const net = res.network || {};
                    const warnings: string[] = [];

                    if (!hdr['dnt']) warnings.push('DNT header missing (tracking opt-out not signaled).');
                    if (hdr['referer']) warnings.push(`Referrer exposed: ${hdr['referer']}`);
                    if (hdr['x-forwarded-for'] && res.ip?.public && !hdr['x-forwarded-for'].includes(res.ip.public)) {
                        warnings.push('X-Forwarded-For differs from detected public IP (proxy/VPN/CDN?).');
                    }

                    let msg = `### 🔍 Privacy Snapshot\n\n`;
                    msg += `**Public IP:** ${res.ip?.public || 'Unknown'}\n`;
                    if (net.country || net.city || net.isp) {
                        const locParts = [net.city, net.region, net.country].filter(Boolean).join(', ');
                        msg += `**Network:** ${net.isp || net.org || 'Unknown ISP'}${net.asn ? ` (${net.asn}${net.asName ? ' / ' + net.asName : ''})` : ''}\n`;
                        if (locParts) msg += `**Location (coarse):** ${locParts}${net.zip ? ` ${net.zip}` : ''}\n`;
                        if (net.timezone) msg += `**Timezone:** ${net.timezone}\n`;
                    } else if (net.error) {
                        msg += `**Network:** Lookup failed (${net.error})\n`;
                    }

                    msg += `\n**Headers Received:**\n`;
                    const headerList: [string, string | null][] = [
                        ['User-Agent', hdr['user-agent']],
                        ['Accept-Language', hdr['accept-language']],
                        ['DNT', hdr['dnt']],
                        ['Referer', hdr['referer']],
                        ['Accept', hdr['accept']],
                        ['Accept-Encoding', hdr['accept-encoding']],
                        ['sec-ch-ua', hdr['sec-ch-ua']],
                        ['sec-ch-ua-platform', hdr['sec-ch-ua-platform']],
                        ['sec-ch-ua-mobile', hdr['sec-ch-ua-mobile']],
                        ['sec-fetch-site', hdr['sec-fetch-site']],
                        ['sec-fetch-mode', hdr['sec-fetch-mode']],
                        ['sec-fetch-dest', hdr['sec-fetch-dest']],
                        ['x-forwarded-for', hdr['x-forwarded-for']],
                        ['x-real-ip', hdr['x-real-ip']]
                    ];
                    headerList
                        .filter(([, v]) => v)
                        .forEach(([k, v]) => {
                            msg += `- **${k}:** ${v}\n`;
                        });

                    if (warnings.length) {
                        msg += `\n**Warnings:**\n`;
                        warnings.forEach(w => msg += `- ${w}\n`);
                    }

                    msg += `\n_This reflects what a typical site learns on first request. Use a VPN/proxy to change the IP/ISP/geo; adjust browser settings/extensions to change headers._`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);
                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Privacy snapshot failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 22. Domain Reputation Checker (/reputation)
            if (text.startsWith('/reputation')) {
                setProcessingStatus("Checking Reputation...");
                const domain = text.replace('/reputation', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                if (!domain) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: '❌ Usage: `/reputation <domain>` (e.g., `/reputation example.com`)', timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    setProcessingStatus(null);
                    return;
                }

                try {
                    const apiKey = settings.googleSafeBrowsingApiKey || process.env.VITE_GOOGLE_SAFEBROWSING_API_KEY;

                    const res = await fetch(`${proxyUrl}/api/tools/reputation`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ domain, apiKey })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 🛡️ Domain Reputation: ${res.domain}\n\n`;

                    if (res.status === 'no_api_key') {
                        msg += `**Status:** ⚠️ API Key Required\n\n`;
                        msg += `Domain reputation checking requires a Google Safe Browsing API key.\n\n`;
                        msg += `#### 🔑 Get Your Free API Key\n`;
                        msg += `1. Visit [Google Safe Browsing API](${res.get_api_key})\n`;
                        msg += `2. Create a project and enable the API (Free tier: 10,000 requests/day)\n`;
                        msg += `3. Add your API key in **Settings → Providers**\n\n`;
                        msg += `*Google Safe Browsing protects over 5 billion devices by identifying unsafe websites.*`;
                    } else if (res.status === 'threat_detected') {
                        msg += `**Status:** ⛔ THREAT DETECTED\n`;
                        msg += `**Safety:** ❌ NOT SAFE\n`;
                        msg += `**Source:** ${res.source}\n\n`;

                        msg += `#### 🚨 Detected Threats (${res.total_threats})\n\n`;

                        const threatLabels: Record<string, string> = {
                            'MALWARE': '🦠 Malware',
                            'SOCIAL_ENGINEERING': '🎣 Phishing/Social Engineering',
                            'UNWANTED_SOFTWARE': '⚠️ Unwanted Software',
                            'POTENTIALLY_HARMFUL_APPLICATION': '📱 Potentially Harmful App'
                        };

                        const threatCounts: Record<string, number> = {};
                        res.threats.forEach((threat: any) => {
                            threatCounts[threat.threatType] = (threatCounts[threat.threatType] || 0) + 1;
                        });

                        for (const [threatType, count] of Object.entries(threatCounts)) {
                            msg += `- ${threatLabels[threatType] || threatType}: ${count}\n`;
                        }

                        msg += `\n#### ⚠️ Security Warning\n`;
                        msg += `**DO NOT VISIT THIS DOMAIN.** It has been flagged by Google Safe Browsing for containing:\n`;
                        msg += `- Malicious software that can harm your device\n`;
                        msg += `- Deceptive content designed to steal information\n`;
                        msg += `- Unwanted programs that may affect your system\n\n`;

                        msg += `*Google Safe Browsing data last checked: ${new Date(res.checked_at).toLocaleString()}*`;
                    } else if (res.status === 'clean') {
                        msg += `**Status:** ✅ CLEAN\n`;
                        msg += `**Safety:** ✅ SAFE\n`;
                        msg += `**Source:** ${res.source}\n\n`;

                        msg += `#### 🛡️ No Threats Detected\n`;
                        msg += `This domain is **not listed** in Google Safe Browsing's database of:\n`;
                        msg += `- 🦠 Malware sites\n`;
                        msg += `- 🎣 Phishing/social engineering sites\n`;
                        msg += `- ⚠️ Unwanted software distributors\n`;
                        msg += `- 📱 Potentially harmful applications\n\n`;

                        msg += `#### ℹ️ Important Notes\n`;
                        msg += `- This check uses Google Safe Browsing, which protects 5+ billion devices\n`;
                        msg += `- A "clean" status means no **known** threats at this time\n`;
                        msg += `- Always exercise caution with unfamiliar websites\n`;
                        msg += `- Use \`/ssl ${domain}\` to check certificate validity\n`;
                        msg += `- Use \`/headers https://${domain}\` to audit security headers\n\n`;

                        msg += `*Last checked: ${new Date(res.checked_at).toLocaleString()}*`;
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Reputation Check Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 23. Screenshot Capture (/screenshot)
            if (text.startsWith('/screenshot')) {
                setProcessingStatus("Capturing screenshot...");
                const url = text.replace('/screenshot', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                if (!url) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: '❌ Usage: `/screenshot <url>` (e.g., `/screenshot example.com`)', timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    setProcessingStatus(null);
                    return;
                }

                try {
                    const res = await fetch(`${proxyUrl}/api/tools/screenshot`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url, fullPage: false })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 📸 Screenshot Captured: ${res.url}\n\n`;

                    if (res.status === 'success') {
                        msg += `**Page Title:** ${res.title}\n`;
                        msg += `**Final URL:** ${res.pageInfo.finalUrl}\n`;
                        msg += `**Viewport:** ${res.viewport.width}x${res.viewport.height}\n`;
                        msg += `**Page Size:** ${res.pageInfo.width}x${res.pageInfo.height}\n`;
                        msg += `**Captured:** ${new Date(res.capturedAt).toLocaleString()}\n\n`;

                        msg += `![Screenshot](${res.image})\n\n`;

                        msg += `#### 📊 Analysis Options\n`;
                        msg += `- **Wayback Compare:** Use \`/wayback ${res.url}\` to see archived versions\n`;
                        msg += `- **Security Check:** Use \`/reputation ${new URL(res.pageInfo.finalUrl).hostname}\` to check for threats\n`;
                        msg += `- **SSL Audit:** Use \`/ssl ${new URL(res.pageInfo.finalUrl).hostname}\` to verify certificate\n`;
                        msg += `- **Header Check:** Use \`/headers ${res.pageInfo.finalUrl}\` to audit security headers\n\n`;

                        msg += `*💡 Tip: Screenshots are captured with a real browser (Puppeteer) to ensure accurate rendering.*`;
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Screenshot Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 24. Reverse DNS / Reverse IP Lookup (/reverse)
            if (text.startsWith('/reverse')) {
                setProcessingStatus("Looking up domains...");
                const ip = text.replace('/reverse', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                if (!ip) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: '❌ Usage: `/reverse <ip>` (e.g., `/reverse 8.8.8.8`)', timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    setProcessingStatus(null);
                    return;
                }

                try {
                    const res = await fetch(`${proxyUrl}/api/tools/reverse`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ip })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 🔄 Reverse DNS Lookup: ${res.ip}\n\n`;

                    msg += `**Data Source:** ${res.source}\n\n`;

                    if (res.status === 'rate_limited') {
                        msg += `**Status:** ⚠️ Rate Limit Reached\n\n`;
                        msg += `${res.message}\n\n`;
                        msg += `#### 💡 What Happened\n`;
                        msg += `HackerTarget's free API has daily request limits. This is normal for free tier services.\n\n`;
                        msg += `#### 🔄 Solutions\n`;
                        msg += `- **Wait & Retry**: Try again in a few hours (limits reset daily)\n`;
                        msg += `- **Alternative**: Use \`/geoip ${ip}\` to get ISP and location info\n`;
                        msg += `- **Alternative**: Use \`/shodan ${ip}\` to scan for services and ports\n`;
                        msg += `- **Upgrade**: Consider HackerTarget membership for unlimited requests\n\n`;
                        msg += `*The free tier is great for occasional use, but heavy OSINT work may need upgraded access.*`;
                    } else if (res.status === 'not_found' || res.total_domains === 0) {
                        msg += `**Status:** ❌ No Domains Found\n\n`;
                        msg += `*No domains are currently hosted on this IP address, or the IP may not be publicly routed.*\n\n`;
                        msg += `#### 💡 Troubleshooting\n`;
                        msg += `- Verify the IP address is correct\n`;
                        msg += `- Some IPs (like CDNs) may not return domain lists\n`;
                        msg += `- Private IPs (192.168.x.x, 10.x.x.x) won't have public domains\n`;
                        msg += `- Try \`/geoip ${ip}\` to verify the IP is valid`;
                    } else {
                        msg += `**Status:** ✅ Found ${res.total_domains} Domain${res.total_domains > 1 ? 's' : ''}\n\n`;

                        // Display domains (limit to 50 for readability)
                        msg += `#### 🌐 Domains Hosted on This IP\n\n`;
                        msg += '```text\n';
                        const displayDomains = res.domains.slice(0, 50);
                        displayDomains.forEach((domain: string) => {
                            msg += `${domain}\n`;
                        });
                        if (res.total_domains > 50) {
                            msg += `\n... and ${res.total_domains - 50} more domains\n`;
                        }
                        msg += '```\n\n';

                        // Add security insights
                        msg += `#### 🛡️ Infrastructure Insights\n`;
                        if (res.total_domains === 1) {
                            msg += `- **Dedicated IP**: This IP hosts only one domain (likely dedicated hosting)\n`;
                        } else if (res.total_domains < 10) {
                            msg += `- **Shared Hosting**: Small number of domains (VPS or shared hosting)\n`;
                        } else if (res.total_domains < 100) {
                            msg += `- **Shared Hosting**: Medium-sized shared hosting environment\n`;
                        } else {
                            msg += `- **Mass Hosting**: Large number of domains (shared hosting provider or CDN)\n`;
                        }
                        msg += `- Use \`/geoip ${ip}\` to see location and ISP\n`;
                        msg += `- Use \`/shodan ${ip}\` to scan for open ports and services\n\n`;

                        // Note about rate limits
                        if (res.note) {
                            msg += `#### ℹ️ Note\n`;
                            msg += `${res.note}\n\n`;
                        }

                        msg += `*Last checked: ${new Date(res.checked_at).toLocaleString()}*`;
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Reverse DNS Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 25. ASN Lookup (/asn)
            if (text.startsWith('/asn')) {
                setProcessingStatus("Looking up ASN...");
                const query = text.replace('/asn', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                if (!query) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: '❌ Usage: `/asn <number or IP>` (e.g., `/asn AS15169` or `/asn 8.8.8.8`)', timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    setProcessingStatus(null);
                    return;
                }

                try {
                    const res = await fetch(`${proxyUrl}/api/tools/asn`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 🌐 ASN Lookup: ${res.query}\n\n`;

                    if (res.status === 'not_found') {
                        msg += `**Status:** ❌ Not Found\n\n`;
                        msg += `${res.message}\n\n`;
                        msg += `#### 💡 Troubleshooting\n`;
                        msg += `- Verify the ASN number (e.g., AS15169) or IP address is correct\n`;
                        msg += `- Try a different format (with or without "AS" prefix)\n`;
                        msg += `- Some private or reserved ASNs may not have public data\n`;
                        msg += `- Try \`/geoip <ip>\` for alternative IP information`;
                    } else {
                        msg += `**Primary ASN:** ${res.primary_asn}\n`;
                        msg += `**Organization:** ${res.organization}\n`;
                        msg += `**Total IP Ranges:** ${res.total_ranges}\n`;
                        msg += `**Data Source:** ${res.source}\n\n`;

                        msg += `#### 📊 IP Ranges (CIDR Blocks)\n\n`;

                        // Show first 10 IP ranges
                        const displayRanges = res.ip_ranges.slice(0, 10);
                        displayRanges.forEach((range: string) => {
                            msg += `- \`${range}\`\n`;
                        });

                        if (res.ip_ranges.length > 10) {
                            msg += `\n*...and ${res.ip_ranges.length - 10} more ranges*\n`;
                        }

                        msg += `\n#### 📋 Detailed Entries\n\n`;

                        // Show first 5 detailed entries
                        const displayEntries = res.entries.slice(0, 5);
                        displayEntries.forEach((entry: any) => {
                            msg += `**${entry.network}** (${entry.ip})\n`;
                            msg += `- ASN: ${entry.asn}\n`;
                            msg += `- Org: ${entry.organization}\n\n`;
                        });

                        if (res.entries.length > 5) {
                            msg += `*...and ${res.entries.length - 5} more entries*\n\n`;
                        }

                        msg += `#### 🔗 Further Analysis\n`;
                        msg += `- Use \`/geoip <ip>\` to check geolocation of specific IPs in these ranges\n`;
                        msg += `- Use \`/shodan <ip>\` to scan for services on IPs in this ASN\n`;
                        msg += `- Use \`/reverse <ip>\` to find domains hosted on IPs in this ASN\n`;
                        msg += `- Use \`/ports <ip>\` to scan ports on IPs (requires authorization)\n\n`;

                        msg += `#### ℹ️ About ASN\n`;
                        msg += `An **Autonomous System Number (ASN)** is a unique identifier for a collection of IP networks operated by one or more network operators. `;
                        msg += `Large organizations like Google, Amazon, and universities typically have their own ASNs. `;
                        msg += `This data helps identify who owns and operates specific IP ranges on the internet.`;
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ ASN Lookup Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

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

            // 3. VirusTotal Scan (/scan)
            if (text.startsWith('/scan')) {
                if (!settings.virusTotalApiKey) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: "⚠️ Please configure your VirusTotal API Key in Settings > Providers to use this feature.", timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    return;
                }

                setProcessingStatus("Scanning URL...");
                const urlToScan = text.replace('/scan', '').trim();

                try {
                    const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';
                    const response = await fetch(`${proxyUrl}/api/virustotal/scan`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: urlToScan, apiKey: settings.virusTotalApiKey })
                    });

                    const contentType = response.headers.get("content-type");
                    if (!contentType || !contentType.includes("application/json")) {
                        throw new Error("Server returned non-JSON response. Please restart your server to apply the latest updates.");
                    }

                    const result = await response.json();

                    if (result.error) throw new Error(result.error);

                    let messageText = "";
                    if (result.status === 'found') {
                        const stats = result.data.attributes.last_analysis_stats;
                        const malicious = stats.malicious;
                        const suspicious = stats.suspicious;
                        const harmless = stats.harmless;

                        const color = malicious > 0 ? "🔴" : suspicious > 0 ? "🟠" : "🟢";
                        messageText = `### ${color} VirusTotal Scan Results\n\n**Target:** ${urlToScan}\n\n- **Malicious:** ${malicious}\n- **Suspicious:** ${suspicious}\n- **Harmless:** ${harmless}\n\n[View Full Report](https://www.virustotal.com/gui/url/${result.data.id})`;
                    } else {
                        messageText = `### ⏳ Scan Queued\n\nThe URL has been submitted for scanning. Please check back in a moment or click here to view progress: [View Scan](https://www.virustotal.com/gui/url/${result.data.id})`;
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: messageText, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Scan Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }

                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 4. DNS Lookup (/dns)
            if (text.startsWith('/dns')) {
                setProcessingStatus("Resolving DNS...");
                const domain = text.replace('/dns', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const response = await fetch(`${proxyUrl}/api/tools/dns`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ domain })
                    });

                    const result = await response.json();
                    if (result.error) throw new Error(result.error);

                    let msg = `### 🔍 DNS Records: ${domain}\n\n`;
                    if (result.A?.length) msg += `**A (IPv4):**\n${result.A.map((ip: string) => `- \`${ip}\``).join('\n')}\n\n`;
                    if (result.AAAA?.length) msg += `**AAAA (IPv6):**\n${result.AAAA.map((ip: string) => `- \`${ip}\``).join('\n')}\n\n`;
                    if (result.MX?.length) msg += `**MX (Mail):**\n${result.MX.map((mx: any) => `- ${mx.exchange} (Pri: ${mx.priority})`).join('\n')}\n\n`;
                    if (result.NS?.length) msg += `**NS (Nameservers):**\n${result.NS.map((ns: string) => `- ${ns}`).join('\n')}\n\n`;
                    if (result.TXT?.length) msg += `**TXT:**\n${result.TXT.map((txt: string[]) => `- \`${txt.join('')}\``).join('\n')}`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ DNS Lookup Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 5. Whois/RDAP (/whois)
            if (text.startsWith('/whois')) {
                setProcessingStatus("Fetching Whois...");
                const domain = text.replace('/whois', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const response = await fetch(`${proxyUrl}/api/tools/whois`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ domain })
                    });

                    const result = await response.json();
                    if (result.error) throw new Error(result.error);

                    const created = result.events.find((e: any) => e.eventAction === 'registration')?.eventDate || 'Unknown';
                    const expires = result.events.find((e: any) => e.eventAction === 'expiration')?.eventDate || 'Unknown';
                    const registrar = result.entities.find((e: any) => e.roles.includes('registrar'))?.name || 'Unknown';

                    let msg = `### 🏢 Whois/RDAP: ${domain}\n\n`;
                    msg += `**Registrar:** ${registrar}\n`;
                    msg += `**Created:** ${new Date(created).toLocaleDateString()}\n`;
                    msg += `**Expires:** ${new Date(expires).toLocaleDateString()}\n\n`;
                    msg += `**Status:**\n${result.status.map((s: string) => `- ${s}`).join('\n')}\n\n`;
                    msg += `**Nameservers:**\n${result.nameservers.map((n: string) => `- ${n}`).join('\n')}`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Whois Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 6. Breach Check (/breach)
            if (text.startsWith('/breach')) {
                if (!settings.hibpApiKey) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: "⚠️ Please configure your Have I Been Pwned API Key in Settings > Providers to use this feature.", timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    return;
                }

                setProcessingStatus("Checking Breaches...");
                const email = text.replace('/breach', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const response = await fetch(`${proxyUrl}/api/tools/breach`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, apiKey: settings.hibpApiKey })
                    });

                    const result = await response.json();
                    if (result.error) throw new Error(result.error);

                    let msg = "";
                    if (result.status === 'clean') {
                        msg = `### 🟢 No Breaches Found\n\nGood news! The email \`${email}\` does not appear in any known data breaches.`;
                    } else {
                        const count = result.data.length;
                        msg = `### 🔴 Breach Alert: ${count} Incidents Found\n\nThe email \`${email}\` was found in the following data breaches:\n\n`;

                        result.data.forEach((breach: any) => {
                            msg += `**${breach.Name}** (${breach.BreachDate})\n`;
                            msg += `- **Compromised:** ${breach.DataClasses.join(', ')}\n`;
                            msg += `- **Description:** ${breach.Description.replace(/<[^>]*>?/gm, '')}\n\n`;
                        });
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Breach Check Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 7. Shodan Lookup (/shodan)
            if (text.startsWith('/shodan')) {
                if (!settings.shodanApiKey) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: "⚠️ Please configure your Shodan API Key in Settings > Providers to use this feature.", timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    return;
                }

                setProcessingStatus("Scanning Shodan...");
                const ip = text.replace('/shodan', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const response = await fetch(`${proxyUrl}/api/tools/shodan`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ip, apiKey: settings.shodanApiKey })
                    });

                    const result = await response.json();
                    if (result.error) throw new Error(result.error);

                    let msg = `### 👁️ Shodan Intel: ${ip}\n\n`;
                    msg += `**Organization:** ${result.org || 'Unknown'}\n`;
                    msg += `**OS:** ${result.os || 'Unknown'}\n`;
                    msg += `**Ports:** ${result.ports?.join(', ') || 'None'}\n\n`;

                    if (result.vulns?.length) {
                        msg += `**⚠️ Vulnerabilities:**\n${result.vulns.slice(0, 5).map((v: string) => `- ${v}`).join('\n')}\n`;
                        if (result.vulns.length > 5) msg += `*(and ${result.vulns.length - 5} more)*\n`;
                        msg += '\n';
                    }

                    if (result.data?.length) {
                        msg += `**Services:**\n`;
                        result.data.slice(0, 3).forEach((service: any) => {
                            msg += `- **Port ${service.port}** (${service.transport}): ${service.product || 'Unknown'}\n`;
                        });
                    }

                    msg += `\n[View Full Report](https://www.shodan.io/host/${ip})`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Shodan Lookup Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 8. Traceroute (/trace)
            if (text.startsWith('/trace')) {
                setProcessingStatus("Running traceroute...");
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';
                const target = text.replace('/trace', '').trim();

                if (!target) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: '❌ Usage: `/trace <domain_or_ip>` (e.g., `/trace example.com`)', timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    setProcessingStatus(null);
                    return;
                }

                try {
                    const res = await fetch(`${proxyUrl}/api/tools/trace`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ target })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 🛰️ Traceroute: ${res.target}\n\n`;
                    msg += `**Hops:** ${res.total_hops}\n`;
                    msg += `**Source:** ${res.source}\n\n`;
                    msg += `#### Path\n`;
                    msg += '```text\n';
                    res.hops.forEach((hop: any) => {
                        const hopNum = hop.hop || '?';
                        if (hop.status === 'timeout') {
                            msg += `${hopNum}\t*\t(timeout)\n`;
                        } else {
                            const host = hop.host || '';
                            const ip = hop.ip ? ` (${hop.ip})` : '';
                            const rtt = hop.rtt_ms != null ? `${hop.rtt_ms} ms` : '';
                            msg += `${hopNum}\t${host}${ip}\t${rtt}\n`;
                        }
                    });
                    msg += '```\n\n';

                    if (res.note) {
                        msg += `*Note: ${res.note}*\n\n`;
                    }

                    msg += `**Tips:** Timeouts mid-path are common; the final hop may still respond. Use \`/geoip <ip>\` or \`/shodan <ip>\` on interesting hops.`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Traceroute Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 9. Nmap Port Scanner (/nmap)
            if (text.startsWith('/nmap')) {
                setProcessingStatus("Running nmap scan...");
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';
                const args = text.replace('/nmap', '').trim().split(/\s+/);
                const target = args[0];
                const flags = args.slice(1).join(' ');

                if (!target) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: '❌ Usage: `/nmap <target> [flags]`\n\nExamples:\n- `/nmap 10.10.10.50` (basic scan)\n- `/nmap 10.10.10.50 -A` (aggressive)\n- `/nmap 10.10.10.50 -p-` (all ports)\n- `/nmap 10.10.10.50 -sV -sC` (version + scripts)', timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    setProcessingStatus(null);
                    return;
                }

                try {
                    const res = await fetch(`${proxyUrl}/api/tools/nmap`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ target, flags })
                    });

                    if (!res.ok) {
                        const error = await res.json();
                        throw new Error(error.error || 'Nmap scan failed');
                    }

                    const data = await res.json();

                    // Format output
                    let msg = `## 🔍 Nmap Scan Results\n\n`;
                    msg += `**Target:** ${data.target}\n`;
                    msg += `**Flags:** ${data.flags}\n`;

                    if (data.scan_info.target) {
                        msg += `**Scan Report:** ${data.scan_info.target}\n`;
                    }
                    if (data.scan_info.latency) {
                        msg += `**Latency:** ${data.scan_info.latency}\n`;
                    }
                    if (data.scan_info.os) {
                        msg += `**OS Detection:** ${data.scan_info.os}\n`;
                    }

                    msg += `\n**Open Ports:** ${data.total_open}\n\n`;

                    if (data.open_ports && data.open_ports.length > 0) {
                        msg += `| Port | Protocol | State | Service |\n`;
                        msg += `|------|----------|-------|----------|\n`;
                        data.open_ports.forEach((p: any) => {
                            const emoji = p.state === 'open' ? '🟢' : p.state === 'filtered' ? '🟡' : '🔴';
                            msg += `| ${emoji} ${p.port} | ${p.protocol} | ${p.state} | ${p.service} |\n`;
                        });
                    } else {
                        msg += `*No ports found in scan output. The host may be down or heavily filtered.*\n`;
                    }

                    msg += `\n### Raw Nmap Output:\n\`\`\`\n${data.raw_output}\n\`\`\`\n`;

                    if (data.note) {
                        msg += `\n*Note: ${data.note}*\n`;
                    }

                    msg += `\n**Tips:** Use \`/shodan <ip>\` for more intel, or \`/geoip <ip>\` for location data.`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Nmap Scan Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 10. Chuck Norris Facts (/chuck)
            if (text.startsWith('/chuck')) {
                setProcessingStatus("Consulting Chuck Norris...");
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const response = await fetch(`${proxyUrl}/api/fun/chuck`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (!response.ok) {
                        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                    }

                    const res = await response.json();

                    if (!res.success && res.error) {
                        throw new Error(res.error);
                    }

                    const joke = res.joke || res.fallback;
                    let msg = `## 🥋 Chuck Norris Fact\n\n`;
                    msg += `${joke}\n\n`;

                    if (res.categories && res.categories.length > 0) {
                        msg += `**Category:** ${res.categories.join(', ')}\n\n`;
                    }

                    msg += `---\n\n**Sources:**\n`;
                    res.sources.forEach((source: any) => {
                        msg += `- [${source.name}](${source.url})\n`;
                    });

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    const fallbackMsg = `## 🥋 Chuck Norris Fact\n\nChuck Norris doesn't need APIs. APIs call Chuck Norris.\n\n*Note: ${e.message}*`;
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: fallbackMsg, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 11. Random Jokes (/joke)
            if (text.startsWith('/joke')) {
                setProcessingStatus("Fetching a joke...");
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const response = await fetch(`${proxyUrl}/api/fun/joke`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (!response.ok) {
                        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                    }

                    const res = await response.json();

                    if (!res.success && res.error) {
                        throw new Error(res.error);
                    }

                    let msg = `## 😂 Random Joke\n\n`;

                    // Check if it has setup/punchline format
                    if (res.setup && res.punchline) {
                        msg += `**${res.setup}**\n\n`;
                        msg += `${res.punchline}\n\n`;
                    } else if (res.joke) {
                        // Fallback format
                        msg += `${res.joke}\n\n`;
                    }

                    if (res.type && res.type !== 'general') {
                        msg += `**Category:** ${res.type}\n\n`;
                    }

                    msg += `---\n\n**Sources:**\n`;
                    res.sources.forEach((source: any) => {
                        msg += `- [${source.name}](${source.url})\n`;
                    });

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    // Use fallback joke if API fails
                    const fallbackMsg = `## 😂 Random Joke\n\n**Why do programmers prefer dark mode?**\n\nBecause light attracts bugs!\n\n*Note: ${e.message}*`;
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: fallbackMsg, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 12. Random Bible Verse (/bible)
            if (text.startsWith('/bible')) {
                setProcessingStatus("Fetching Bible verse...");
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const response = await fetch(`${proxyUrl}/api/fun/bible`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (!response.ok) {
                        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                    }

                    const res = await response.json();

                    if (!res.success && res.error) {
                        throw new Error(res.error);
                    }

                    let msg = `## 📖 Random Bible Verse\n\n`;
                    msg += `### ${res.reference}\n\n`;
                    msg += `> ${res.text}\n\n`;
                    msg += `**Translation:** ${res.translation}`;

                    if (res.translationNote) {
                        msg += ` (${res.translationNote})`;
                    }

                    msg += `\n\n---\n\n**Sources:**\n`;
                    res.sources.forEach((source: any) => {
                        msg += `- [${source.name}](${source.url})\n`;
                    });

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    const fallbackMsg = `## 📖 Random Bible Verse\n\n### John 3:16\n\n> For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.\n\n*Note: ${e.message}*`;
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: fallbackMsg, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 13. Certificate Transparency (/certs)
            if (text.startsWith('/certs')) {
                setProcessingStatus("Querying Certificate Transparency logs...");
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';
                const domain = text.replace('/certs', '').trim();

                if (!domain) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: '❌ Usage: `/certs <domain>` (e.g., `/certs example.com`)', timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    setProcessingStatus(null);
                    return;
                }

                try {
                    const response = await fetch(`${proxyUrl}/api/tools/certs`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ domain })
                    });

                    const contentType = response.headers.get('content-type') || '';
                    const rawText = await response.text();
                    let res;
                    if (contentType.includes('application/json')) {
                        res = JSON.parse(rawText);
                    } else {
                        throw new Error(`Server returned non-JSON response (status ${response.status}). Try restarting the proxy server.`);
                    }

                    if (res.error) throw new Error(res.error);

                    const issuerEntries = Object.entries(res.issuers || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);
                    const displayNames = (res.unique_names || []).slice(0, 50);
                    const displayWildcards = (res.wildcards || []).slice(0, 25);

                    let msg = `### 📜 Certificate Transparency: ${res.domain}\n\n`;
                    msg += `**Total Certificates:** ${res.total_certificates}\n`;
                    msg += `**Unique Hostnames:** ${res.total_names}\n`;
                    msg += `**Wildcards:** ${res.total_wildcards}\n`;
                    if (res.first_seen) msg += `**First Seen:** ${new Date(res.first_seen).toLocaleString()}\n`;
                    if (res.last_seen) msg += `**Last Seen:** ${new Date(res.last_seen).toLocaleString()}\n\n`;

                    if (issuerEntries.length) {
                        msg += `**Top Issuers:**\n`;
                        issuerEntries.forEach(([issuer, count]: any) => { msg += `- ${issuer} (${count})\n`; });
                        msg += `\n`;
                    }

                    if (displayNames.length) {
                        msg += `#### Hostnames\n`;
                        msg += '```text\n';
                        displayNames.forEach((n: string) => { msg += `${n}\n`; });
                        if ((res.unique_names?.length || 0) > displayNames.length) {
                            msg += `... and ${(res.unique_names.length - displayNames.length)} more\n`;
                        }
                        msg += '```\n\n';
                    }

                    if (displayWildcards.length) {
                        msg += `#### Wildcards\n`;
                        msg += '```text\n';
                        displayWildcards.forEach((n: string) => { msg += `${n}\n`; });
                        if ((res.wildcards?.length || 0) > displayWildcards.length) {
                            msg += `... and ${(res.wildcards.length - displayWildcards.length)} more\n`;
                        }
                        msg += '```\n\n';
                    }

                    msg += `**Tip:** Combine with \`/subdomains ${res.domain}\` to compare CT results, then run \`/ssl <host>\` on interesting entries.\n`;
                    msg += `*Source: ${res.source}${res.note ? ` (${res.note})` : ''}*`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Certificate Lookup Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 9. Port Scanner (/ports)
            if (text.startsWith('/ports')) {
                setProcessingStatus("Scanning ports...");
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';
                const args = text.replace('/ports', '').trim();
                const [target, ...portArgs] = args.split(/\s+/).filter(Boolean);

                if (!target) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: '❌ Usage: `/ports <ip_or_host> [comma-separated ports]` (e.g., `/ports 1.1.1.1 22,80,443`)', timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    setProcessingStatus(null);
                    return;
                }

                const portString = portArgs.join(' ').replace(/\s/g, '');
                const customPorts = portString
                    ? portString.split(',').map(p => parseInt(p, 10)).filter(p => Number.isInteger(p) && p > 0 && p <= 65535).slice(0, 100)
                    : [];

                try {
                    const res = await fetch(`${proxyUrl}/api/tools/ports`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ target, ports: customPorts.length ? customPorts : undefined })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    let msg = `### 🔌 Port Scan: ${res.target}\n\n`;
                    if (res.resolved_ip && res.resolved_ip !== res.target) {
                        msg += `**Resolved IP:** ${res.resolved_ip}\n`;
                    }
                    msg += `**Ports Scanned:** ${res.total_scanned}\n`;
                    msg += `**Open Ports:** ${res.open_count}\n`;
                    msg += `**Filtered/Timeout:** ${res.filtered_count}\n`;
                    msg += `**Closed:** ${res.closed_count}\n`;
                    msg += `**Duration:** ${res.duration_ms} ms\n\n`;

                    if (res.open_count === 0) {
                        msg += `No open ports detected in the scanned set. Host may be firewalled or using non-standard ports.\n\n`;
                        msg += `- Try a different port list (e.g., \`/ports ${target} 21,22,25,80,443,8080\`)\n`;
                        msg += `- Validate reachability with \`/shodan ${res.resolved_ip || target}\`\n\n`;
                    } else {
                        msg += `#### 🟢 Open Ports\n`;
                        msg += '```text\n';
                        res.open_ports.forEach((p: any) => {
                            msg += `${p.port} (${p.service}) - ${p.latency_ms} ms\n`;
                        });
                        msg += '```\n\n';
                    }

                    msg += `⚠️ Only scan hosts you are authorized to test.\n`;
                    msg += `*Method: ${res.source}*`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Port Scan Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 10. Hash Lookup (/hash)
            if (text.startsWith('/hash')) {
                if (!settings.virusTotalApiKey) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: "⚠️ Please configure your VirusTotal API Key in Settings > Providers to use this feature.", timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    return;
                }

                setProcessingStatus("Checking hash...");
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';
                const hash = text.replace('/hash', '').trim();

                if (!hash) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: '❌ Usage: `/hash <md5|sha1|sha256|sha512>`', timestamp: Date.now()
                    }]);
                    setIsStreaming(false);
                    setProcessingStatus(null);
                    return;
                }

                try {
                    const res = await fetch(`${proxyUrl}/api/tools/hash`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ hash, apiKey: settings.virusTotalApiKey })
                    }).then(r => r.json());

                    if (res.error) throw new Error(res.error);

                    if (res.status === 'not_found') {
                        onUpdateMessages(prev => [...prev, {
                            id: uuidv4(), sender: Sender.AI, text: `### 🧬 Hash Lookup: Not Found\n\nHash: \`${hash}\`\n\nVirusTotal has no record for this hash. Try submitting the sample directly on VirusTotal or double-check the hash type (MD5/SHA1/SHA256).`, timestamp: Date.now()
                        }]);
                    } else {
                        const stats = res.stats || {};
                        const names = res.names || [];
                        const vtUrl = `https://www.virustotal.com/gui/file/${res.sha256 || res.hash}`;

                        let msg = `### 🧬 VirusTotal Hash Intel\n\n`;
                        msg += `**Hash:** \`${hash}\`\n`;
                        if (res.sha256 && res.sha256 !== hash) msg += `**SHA256:** \`${res.sha256}\`\n`;
                        if (res.md5) msg += `**MD5:** \`${res.md5}\`\n`;
                        if (res.sha1) msg += `**SHA1:** \`${res.sha1}\`\n`;
                        if (res.type_description) msg += `**Type:** ${res.type_description}\n`;
                        if (res.size) msg += `**Size:** ${res.size} bytes\n`;
                        if (res.first_submission) msg += `**First Seen:** ${new Date(res.first_submission).toLocaleString()}\n`;
                        if (res.last_modification) msg += `**Last Analysis:** ${new Date(res.last_modification).toLocaleString()}\n\n`;

                        msg += `**Detections:**\n`;
                        msg += `- Malicious: ${stats.malicious || 0}\n`;
                        msg += `- Suspicious: ${stats.suspicious || 0}\n`;
                        msg += `- Harmless: ${stats.harmless || 0}\n`;
                        msg += `- Undetected: ${stats.undetected || 0}\n\n`;

                        if (names.length) {
                            msg += `**Known Filenames (sample):**\n`;
                            names.forEach((n: string) => { msg += `- ${n}\n`; });
                            msg += `\n`;
                        }

                        msg += `[View on VirusTotal](${vtUrl})\n`;

                        onUpdateMessages(prev => [...prev, {
                            id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                        }]);
                    }

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Hash Lookup Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 11. SSL Inspector (/ssl)
            if (text.startsWith('/ssl')) {
                setProcessingStatus("Checking SSL...");
                const domain = text.replace('/ssl', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const response = await fetch(`${proxyUrl}/api/tools/ssl`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ domain })
                    });

                    const result = await response.json();
                    if (result.error) throw new Error(result.error);

                    const isValid = result.valid ? "✅ Valid" : "❌ Expired/Invalid";
                    const color = result.days_remaining < 30 ? "🟠" : "🟢";

                    let msg = `### 🔒 SSL Certificate: ${domain}\n\n`;
                    msg += `**Status:** ${isValid}\n`;
                    msg += `**Issuer:** ${result.issuer.O} (${result.issuer.CN})\n`;
                    msg += `**Expires:** ${new Date(result.valid_to).toLocaleDateString()} (${color} ${result.days_remaining} days left)\n`;
                    msg += `**Fingerprint:** \`${result.fingerprint}\`\n\n`;
                    msg += `**Subject:** ${result.subject.CN}\n`;
                    msg += `**Serial:** ${result.serialNumber}`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ SSL Check Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 12. Headers Audit (/headers)
            if (text.startsWith('/headers')) {
                setProcessingStatus("Auditing Headers...");
                const url = text.replace('/headers', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    const response = await fetch(`${proxyUrl}/api/tools/headers`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url })
                    });

                    const result = await response.json();
                    if (result.error) throw new Error(result.error);

                    let msg = `### 🛡️ Security Headers: ${url}\n\n`;
                    msg += `**Server:** ${result.analysis.server}\n\n`;
                    msg += `**Strict-Transport-Security (HSTS):** ${result.analysis.hsts}\n`;
                    msg += `**Content-Security-Policy (CSP):** ${result.analysis.csp}\n`;
                    msg += `**X-Frame-Options:** ${result.analysis.xFrame}\n`;
                    msg += `**X-Content-Type-Options:** ${result.analysis.xContentType}\n`;
                    msg += `**Referrer-Policy:** ${result.analysis.referrerPolicy}\n`;

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Headers Audit Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

            // 13. The Profiler (/profile)
            if (text.startsWith('/profile')) {
                setProcessingStatus("Initializing Profiler...");
                const domain = text.replace('/profile', '').trim();
                const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';

                try {
                    // Profile command doesn't use document context
                    const relevantContext: DocumentChunk[] = [];

                    // 1. Whois
                    setProcessingStatus("Step 1/4: Fetching Whois...");
                    const whoisRes = await fetch(`${proxyUrl}/api/tools/whois`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain })
                    }).then(r => r.json()).catch(e => ({ error: e.message }));

                    // 2. DNS
                    setProcessingStatus("Step 2/4: Resolving DNS...");
                    const dnsRes = await fetch(`${proxyUrl}/api/tools/dns`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain })
                    }).then(r => r.json()).catch(e => ({ error: e.message }));

                    // 3. SSL
                    setProcessingStatus("Step 3/4: Inspecting SSL...");
                    const sslRes = await fetch(`${proxyUrl}/api/tools/ssl`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain })
                    }).then(r => r.json()).catch(e => ({ error: e.message }));

                    // 4. Shodan (if IP available)
                    let shodanRes = null;
                    if (dnsRes.A && dnsRes.A.length > 0 && settings.shodanApiKey) {
                        setProcessingStatus("Step 4/4: Scanning Shodan...");
                        shodanRes = await fetch(`${proxyUrl}/api/tools/shodan`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip: dnsRes.A[0], apiKey: settings.shodanApiKey })
                        }).then(r => r.json()).catch(e => ({ error: e.message }));
                    }

                    // 5. AI Analysis
                    setProcessingStatus("Generating Threat Report...");
                    const contextData = JSON.stringify({
                        target: domain,
                        whois: whoisRes,
                        dns: dnsRes,
                        ssl: sslRes,
                        shodan: shodanRes
                    }, null, 2);

                    const prompt = `
                    ACT AS: A Senior Cyber Threat Intelligence Analyst.
                    MISSION: Analyze the following reconnaissance data for the target domain '${domain}' and generate a professional Threat Intelligence Report.
                    
                    DATA:
                    ${contextData}

                    REPORT FORMAT:
                    1. **Executive Summary**: High-level assessment of the target's security posture.
                    2. **Infrastructure Analysis**: Key findings from DNS and Shodan (hosting provider, server location, open ports).
                    3. **Security Posture**: Analysis of SSL and Whois data (expiry dates, registrar reputation).
                    4. **Vulnerabilities & Risks**: Potential attack vectors based on open ports or outdated software.
                    5. **Recommendations**: Actionable steps to improve security.

                    TONE: Professional, objective, and concise. Use bullet points.
                    `;

                    // Send invisible system prompt to AI
                    const res = await streamGeminiResponse(
                        prompt, [], boundedHistory, modelToUse as any, false, relevantContext,
                        (txt, sources) => onUpdateMessages([...currentMessages, { ...aiPlaceholder, text: txt, isThinking: false, groundingSources: sources }]),
                        settings.geminiApiKey, settings.matrixMode, settings.theme === 'tron', settings.modelParams, commandState
                    );

                    // We don't need to do anything with res.text here as the stream callback handles it

                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Profiler Failed: ${e.message}`, timestamp: Date.now()
                    }]);
                }
                setIsStreaming(false);
                setProcessingStatus(null);
                return;
            }

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
                    textToSend, imageAttachments, boundedHistory, relevantContext, settings.geminiApiKey, settings.councilAgents,
                    (msg) => { currentMessages = [...currentMessages, msg]; onUpdateMessages(currentMessages); },
                    (id, txt) => { currentMessages = currentMessages.map(m => m.id === id ? { ...m, text: txt, isThinking: false } : m); onUpdateMessages(currentMessages); }
                );
            } else if (modelToUse.includes('sonar') && !isPetChat) {
                const res = await streamPerplexityResponse(textToSend, boundedHistory, modelToUse, settings.perplexityApiKey || '',
                    (txt, sources) => onUpdateMessages([...currentMessages, { ...aiPlaceholder, text: txt, isThinking: false, groundingSources: sources }]));
                finalParams(res.text, {}, res.sources);
            } else if ((modelToUse === ModelType.LMSTUDIO || settings.availableModels.lmstudio.includes(modelToUse)) && !isPetChat) {
                // LM Studio - check BEFORE OpenAI since LM Studio models might contain "gpt" in their names
                const promptWithSearch = (searchContext || studyContextText)
                    ? `${studyContextText}${searchContext ? `[Web Search Results]:\n${searchContext}\n\n` : ''}User Query: ${textToSend}`
                    : textToSend;
                const actualModelId = modelToUse === ModelType.LMSTUDIO ? settings.lmstudioModelId : modelToUse;
                const res = await streamLMStudioResponse(promptWithSearch, imageAttachments, boundedHistory, settings.lmstudioBaseUrl, actualModelId, relevantContext, commonParams, settings.modelParams);
                finalParams(res.text, res.usage);
            } else if ((modelToUse.includes('gpt') || modelToUse.includes('o1')) && !isPetChat) {
                const promptWithSearch = (searchContext || studyContextText)
                    ? `${studyContextText}${searchContext ? `[Web Search Results]:\n${searchContext}\n\n` : ''}User Query: ${textToSend}`
                    : textToSend;
                const res = await streamOpenAIResponse(promptWithSearch, imageAttachments, boundedHistory, modelToUse, relevantContext, settings.openaiApiKey || '', commonParams, settings.modelParams);
                finalParams(res.text, res.usage);
            } else if (modelToUse.includes('claude') && !isPetChat) {
                const promptWithSearch = (searchContext || studyContextText)
                    ? `${studyContextText}${searchContext ? `[Web Search Results]:\n${searchContext}\n\n` : ''}User Query: ${textToSend}`
                    : textToSend;
                const res = await streamAnthropicResponse(promptWithSearch, imageAttachments, boundedHistory, modelToUse, relevantContext, settings.anthropicApiKey || '', settings.corsProxyUrl || '', commonParams, settings.modelParams);
                finalParams(res.text, res.usage);
            } else if (modelToUse.includes('grok') && !isPetChat) {
                const res = await streamGrokResponse(textToSend, boundedHistory, modelToUse, settings.xaiApiKey || '', commonParams);
                finalParams(res, {});
            } else if ((modelToUse.includes('meta') || modelToUse.includes('mistral')) && !isPetChat) {
                // Hugging Face
                const res = await generateHFChat(textToSend, boundedHistory, modelToUse, settings.huggingFaceApiKey || '');
                finalParams(res, {});
            } else if (modelToUse === ModelType.LOCAL || (!modelToUse.includes('gemini') && !isPetChat)) {
                const promptWithSearch = (searchContext || studyContextText)
                    ? `${studyContextText}${searchContext ? `[Web Search Results]:\n${searchContext}\n\n` : ''}User Query: ${textToSend}`
                    : textToSend;
                const res = await streamOllamaResponse(promptWithSearch, boundedHistory, settings.ollamaBaseUrl, settings.ollamaModelId, commonParams);
                finalParams(res.text, res.usage);
            } else {
                // Gemini (Handles normal Gemini chats and the Pet Chat)
                const res = await streamGeminiResponse(
                    textToSend, imageAttachments, boundedHistory, modelToUse as any, commandState.web, relevantContext,
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
            handleSendMessage(lastUserMsg.text, lastUserMsg.attachments || [], { web: false, visual: false, flash: false, deep: false }, false);
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
        "Ollama": settings.availableModels.ollama,
        "LM Studio": settings.availableModels.lmstudio
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

            <div className={`flex-1 overflow-y-auto overflow-x-hidden p-4 pt-24 z-10 ${isTron ? 'font-tron text-tron-cyan' : ''}`}>
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
                {/* Button controls - aligned with chat input max-width */}
                <div className="w-full max-w-3xl mx-auto mb-2">
                    <div className="flex justify-end gap-2 flex-wrap">
                        <button
                            onClick={() => setShowAliasManager(true)}
                            className={`text-[11px] px-3 py-1 rounded-full border font-semibold transition-colors ${isTron
                                    ? 'border-tron-cyan text-tron-cyan hover:bg-tron-cyan/10'
                                    : settings.matrixMode
                                        ? 'border-green-500/70 text-green-400 hover:bg-green-500/10'
                                        : 'border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                                }`}
                        >
                            <i className="fa-solid fa-bolt mr-2"></i>Alias Manager
                        </button>
                        <button
                            onClick={handleViewAliasLogs}
                            className={`text-[11px] px-3 py-1 rounded-full border font-semibold transition-colors ${isTron
                                    ? 'border-tron-cyan text-tron-cyan hover:bg-tron-cyan/10'
                                    : settings.matrixMode
                                        ? 'border-green-500/70 text-green-400 hover:bg-green-500/10'
                                        : 'border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                                }`}
                        >
                            <i className="fa-solid fa-clipboard-list mr-2"></i>View Logs
                        </button>
                        {aliasAbortRef.current && (
                            <button
                                onClick={handleCancelRunningCommand}
                                className="text-[11px] px-3 py-1 rounded-full border font-semibold transition-colors border-red-500/60 text-red-400 hover:bg-red-500/10"
                            >
                                <i className="fa-solid fa-stop mr-2"></i>Cancel Command
                            </button>
                        )}
                        <button
                            onClick={handleCopyLastMessage}
                            disabled={!lastMessageText}
                            className={`text-[11px] px-3 py-1 rounded-full border font-semibold transition-colors ${lastMessageText
                                ? isTron
                                    ? 'border-tron-cyan text-tron-cyan hover:bg-tron-cyan/10'
                                    : settings.matrixMode
                                        ? 'border-green-500/70 text-green-400 hover:bg-green-500/10'
                                        : 'border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                                : 'border-zinc-800 text-zinc-600 cursor-not-allowed'
                                }`}
                            title="Copy the most recent chat message"
                        >
                            <i className={`fa-regular ${copiedLast ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                            {copiedLast ? 'Copied last message' : 'Copy last message'}
                        </button>
                    </div>
                </div>
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
            {showDeathStarEasterEgg && <DeathStarEasterEgg onClose={() => setShowDeathStarEasterEgg(false)} />}
            <AliasConfirmationModal
                isOpen={showAliasConfirmation}
                alias={confirmationAlias}
                onConfirm={handleConfirmAlias}
                onCancel={handleCancelAlias}
            />
            {showAliasManager && <AliasManager isOpen={showAliasManager} onClose={() => setShowAliasManager(false)} />}
        </div>
    );
};

export default ChatInterface;


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
    const [copiedLast, setCopiedLast] = useState(false);

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

            // 0. Help System (/help)
            if (text.startsWith('/help')) {
                const cmd = text.replace('/help', '').trim().toLowerCase();

                let helpMsg = "";

                if (!cmd) {
                    // Main Help Menu
                    helpMsg = `### 🛠️ RangerPlex Tactical Manual\n\n`;
                    helpMsg += `**Intelligence Tools**\n`;
                    helpMsg += `- \`/profile <domain>\` - **The Profiler** (Automated Threat Agent)\n`;
                    helpMsg += `- \`/shodan <ip>\` - **Shodan Intel** (Infrastructure Scan)\n`;
                    helpMsg += `- \`/breach <email>\` - **Identity Defense** (HIBP Check)\n`;
                    helpMsg += `- \`/scan <url>\` - **VirusTotal** (Malware Scanner)\n\n`;

                    helpMsg += `**Reconnaissance**\n`;
                    helpMsg += `- \`/whois <domain>\` - Domain Registration Info\n`;
                    helpMsg += `- \`/dns <domain>\` - DNS Records (A, MX, TXT)\n`;
                    helpMsg += `- \`/ssl <domain>\` - SSL Certificate Inspector\n`;
                    helpMsg += `- \`/headers <url>\` - Security Headers Audit\n\n`;

                    helpMsg += `**Creative**\n`;
                    helpMsg += `- \`/imagine <prompt>\` - Generate AI Art\n`;
                    helpMsg += `- \`canvas\` - Open Infinite Canvas Board\n\n`;

                    helpMsg += `*Tip: Type \`/help <command>\` for detailed instructions (e.g., \`/help shodan\`)*`;
                }
                else if (cmd === 'shodan') {
                    helpMsg = `### 👁️ Command: /shodan\n\n`;
                    helpMsg += `**Usage:** \`/shodan <ip_address>\`\n`;
                    helpMsg += `**Purpose:** Scans an IP address using the Shodan search engine to find open ports, running services, and potential vulnerabilities.\n\n`;
                    helpMsg += `**Requires:** Shodan API Key (Free) in Settings.\n`;
                    helpMsg += `**Pro Tip:** Use this to check your own server's exposure or analyze suspicious IPs found in logs.\n\n`;
                    helpMsg += `[Ask AI to explain Shodan further?](Ask AI: What is Shodan and how do hackers use it?)`;
                }
                else if (cmd === 'profile') {
                    helpMsg = `### 🕵️ Command: /profile\n\n`;
                    helpMsg += `**Usage:** \`/profile <domain>\`\n`;
                    helpMsg += `**Purpose:** Launches an automated agent that runs Whois, DNS, SSL, and Shodan scans in sequence, then uses AI to generate a comprehensive **Threat Intelligence Report**.\n\n`;
                    helpMsg += `**Best For:** rapid situational awareness on a target domain.\n\n`;
                    helpMsg += `[Ask AI about Threat Intel Reports?](Ask AI: How do I read a Threat Intelligence Report?)`;
                }
                else if (cmd === 'breach') {
                    helpMsg = `### 🕵️ Command: /breach\n\n`;
                    helpMsg += `**Usage:** \`/breach <email>\`\n`;
                    helpMsg += `**Purpose:** Checks the *Have I Been Pwned* database to see if an email address has appeared in known data leaks.\n\n`;
                    helpMsg += `**Requires:** HIBP API Key (Free) in Settings.\n\n`;
                    helpMsg += `[Ask AI about Data Privacy?](Ask AI: What should I do if my email is pwned?)`;
                }
                else if (cmd === 'scan') {
                    helpMsg = `### 🛡️ Command: /scan\n\n`;
                    helpMsg += `**Usage:** \`/scan <url>\`\n`;
                    helpMsg += `**Purpose:** Submits a URL to VirusTotal to check for malware, phishing, and suspicious activity across 70+ security vendors.\n\n`;
                    helpMsg += `**Requires:** VirusTotal API Key (Free) in Settings.\n\n`;
                    helpMsg += `[Ask AI about Phishing?](Ask AI: How does VirusTotal work?)`;
                }
                else {
                    // Generic fallback for other commands or unknown inputs
                    helpMsg = `### ❓ Unknown Command: ${cmd}\n\n`;
                    helpMsg += `I don't have a specific manual page for that yet.\n`;
                    helpMsg += `Try \`/help\` to see the full list of tools.\n\n`;
                    helpMsg += `*Want to learn more? Ask me directly!*`;
                }

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
                        prompt, [], session.messages, modelToUse as any, false, [],
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

            // 8. SSL Inspector (/ssl)
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

            // 9. Headers Audit (/headers)
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
                    const res = await streamGeminiResponse(
                        prompt, [], session.messages, modelToUse as any, false, relevantContext,
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
                <div className="flex justify-end mb-2">
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


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
    onOpenStudyClock?: () => void; // Study Clock opener
    onOpenManual?: () => void; // Manual viewer
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
                const cmd = text.replace('/help', '').trim().toLowerCase();

                let helpMsg = "";

                if (!cmd) {
                    // Main Help Menu - Futuristic Dashboard
                    helpMsg = `### 💠 RANGERPLEX OS // TACTICAL MENU\n`;
                    helpMsg += `\`\`\`text\n`;
                    helpMsg += `╔════ SYSTEM ══════════════════════════════════╗\n`;
                    helpMsg += `║ 💠  ABOUT       :: /about                   ║\n`;
                    helpMsg += `║ 🕐  STUDY       :: /study                   ║\n`;
                    helpMsg += `║ 💻  SYSTEM      :: /sys                     ║\n`;
                    helpMsg += `╠════ INTELLIGENCE MODULES ════════════════════╣\n`;
                    helpMsg += `║ 🕵️  PROFILER    :: /profile <domain>        ║\n`;
                    helpMsg += `║ 👁️  SHODAN      :: /shodan <ip>             ║\n`;
                    helpMsg += `║ 🛡️  BREACH      :: /breach <email>          ║\n`;
                    helpMsg += `║ 🔎  SHERLOCK    :: /sherlock <user>         ║\n`;
                    helpMsg += `║ 💰  CRYPTO      :: /crypto <coin>           ║\n`;
                    helpMsg += `║ 🏦  WALLET      :: /wallet <btc_addr>       ║\n`;
                    helpMsg += `║ 📸  EXIF        :: /exif <url>              ║\n`;
                    helpMsg += `║ 🦠  VIRUS_SCAN  :: /scan <url>              ║\n`;
                    helpMsg += `║ 🕰️  WAYBACK     :: /wayback <url>           ║\n`;
                    helpMsg += `║ 📸  SCREENSHOT  :: /screenshot <url>        ║\n`;
                    helpMsg += `╠════ RECONNAISSANCE ══════════════════════════╣\n`;
                    helpMsg += `║ 📡  WHOIS       :: /whois <domain>          ║\n`;
                    helpMsg += `║ 🌍  GEOIP       :: /geoip <ip>              ║\n`;
                    helpMsg += `║ 🔍  MYIP        :: /myip                    ║\n`;
                    helpMsg += `║ 🌐  IPINFO      :: /ipinfo <ip>             ║\n`;
                    helpMsg += `║ 🛡️  IPRECON     :: /iprecon <ip>            ║\n`;
                    helpMsg += `║ 📟  MAC_LOOKUP  :: /mac <address>           ║\n`;
                    helpMsg += `║ 📱  PHONE       :: /phone <number>          ║\n`;
                    helpMsg += `║ 📧  EMAIL       :: /email <address>         ║\n`;
                    helpMsg += `║ 🏢  COMPANY     :: /company <name|reg>      ║\n`;
                    helpMsg += `║ 🌐  DNS_LOOKUP  :: /dns <domain>            ║\n`;
                    helpMsg += `║ 🔍  SUBDOMAINS  :: /subdomains <domain>     ║\n`;
                    helpMsg += `║ 🔄  REVERSE_DNS :: /reverse <ip>            ║\n`;
                    helpMsg += `║ 🛰️  TRACE       :: /trace <host>            ║\n`;
                    helpMsg += `║ 🔌  PORT_SCAN   :: /ports <ip>              ║\n`;
                    helpMsg += `║ 🎯  NMAP        :: /nmap <target> [flags]   ║\n`;
                    helpMsg += `║ 📜  CERTS       :: /certs <domain>          ║\n`;
                    helpMsg += `║ 🧬  HASH LOOKUP :: /hash <hash>             ║\n`;
                    helpMsg += `║ 🛡️  REPUTATION  :: /reputation <domain>     ║\n`;
                    helpMsg += `║ 🔒  SSL_CHECK   :: /ssl <domain>            ║\n`;
                    helpMsg += `║ 🛡️  HEADERS     :: /headers <url>           ║\n`;
                    helpMsg += `╠════ CREATIVE SUITE ══════════════════════════╣\n`;
                    helpMsg += `║ 🎨  IMAGINE     :: /imagine <prompt>        ║\n`;
                    helpMsg += `║ ♾️   CANVAS      :: canvas                   ║\n`;
                    helpMsg += `╚══════════════════════════════════════════════╝\n`;
                    helpMsg += `\`\`\`\n`;
                    helpMsg += `*SYSTEM READY. Awaiting command input...*\n`;
                    helpMsg += `*Type \`/help <command>\` for detailed specs (e.g. \`/help shodan\`)*`;
                }
                else if (cmd === 'about') {
                    helpMsg = `### 💠 Command: /about\n\n`;
                    helpMsg += `**Usage:** \`/about\`\n`;
                    helpMsg += `**Purpose:** Learn about RangerPlex, the Trinity AI system, and the mission behind the platform.\n\n`;
                    helpMsg += `**Discover:**\n`;
                    helpMsg += `- The three AI Rangers that power RangerPlex\n`;
                    helpMsg += `- David T. Keane's vision for transforming disabilities into superpowers\n`;
                    helpMsg += `- The mission to help 1.3 billion people worldwide\n\n`;
                    helpMsg += `*Perfect for new users who want to understand what makes RangerPlex special!*`;
                }
                else if (cmd === 'study') {
                    helpMsg = `### 🕐 Command: /study\n\n`;
                    helpMsg += `**Usage:** \`/study\`\n`;
                    helpMsg += `**Purpose:** Opens the Study Clock - a Pomodoro timer designed to help you focus and track your study sessions.\n\n`;
                    helpMsg += `**Features:**\n`;
                    helpMsg += `- 🍅 **Pomodoro Mode**: 25-minute work sessions with 5-minute breaks\n`;
                    helpMsg += `- ⚙️ **Custom Timers**: Set any duration you need\n`;
                    helpMsg += `- ⌨️ **Keyboard Shortcuts**: Space (Play/Pause), R (Reset), M (Minimize)\n`;
                    helpMsg += `- 📊 **Today's Stats**: Track total study time and pomodoros completed\n`;
                    helpMsg += `- 🔔 **Notifications**: Desktop alerts when sessions complete\n\n`;
                    helpMsg += `*Pro Tip: The Study Clock uses 3-Tier Persistence - your progress is never lost!*`;
                }
                else if (cmd === 'sherlock') {
                    helpMsg = `### 🔎 Command: /sherlock\n\n`;
                    helpMsg += `**Usage:** \`/sherlock <username>\`\n`;
                    helpMsg += `**Purpose:** Hunts for a username across 12+ major social platforms (GitHub, Reddit, Twitch, Steam, etc.) to identify digital footprints.\n\n`;
                    helpMsg += `**Pro Tip:** Use this to find if a target uses the same handle across different sites.\n\n`;
                    helpMsg += `[Ask AI about OSINT?](Ask AI: How do investigators use username reuse for OSINT?)`;
                }
                else if (cmd === 'shodan') {
                    helpMsg = `### 👁️ Command: /shodan\n\n`;
                    helpMsg += `**Usage:** \`/shodan <ip_address>\`\n`;
                    helpMsg += `**Purpose:** Scans an IP address using the Shodan search engine to find open ports, running services, and potential vulnerabilities.\n\n`;
                    helpMsg += `**Requires:** Shodan API Key (Free) in Settings.\n`;
                    helpMsg += `**Pro Tip:** Use this to check your own server's exposure or analyze suspicious IPs found in logs.\n\n`;
                    helpMsg += `[Ask AI to explain Shodan further?](Ask AI: What is Shodan and how do hackers use it?)`;
                }
                else if (cmd === 'wallet') {
                    helpMsg = `### 🏦 Command: /wallet\n\n`;
                    helpMsg += `**Usage:** \`/wallet <btc_address>\`\n`;
                    helpMsg += `**Purpose:** Inspects a *single* Bitcoin address for balance and history.\n\n`;
                    helpMsg += `**⚠️ Note on HD Wallets (Sparrow/Electrum):**\n`;
                    helpMsg += `Modern wallets generate a new address for every transaction. This tool only scans the **specific address** you provide, not your entire wallet (xPub). If you see 0 BTC, your funds might be in a different address or a "change address" within your wallet.\n\n`;
                    helpMsg += `[Ask AI about HD Wallets?](Ask AI: How do HD Wallets and xPub keys work?)`;
                }
                else if (cmd === 'exif') {
                    helpMsg = `### 📸 Command: /exif\n\n`;
                    helpMsg += `**Usage:** \`/exif <url>\`\n`;
                    helpMsg += `**Purpose:** Extracts hidden metadata (EXIF) from images, including GPS coordinates, camera model, software used, and timestamps.\n\n`;
                    helpMsg += `**Pro Tip:** Use this on photos from social media or suspicious websites to find the original source location.\n\n`;
                    helpMsg += `[Ask AI about Digital Forensics?](Ask AI: How does EXIF data help in investigations?)`;
                }
                else if (cmd === 'geoip') {
                    helpMsg = `### 🌍 Command: /geoip\n\n`;
                    helpMsg += `**Usage:** \`/geoip <ip_address>\`\n`;
                    helpMsg += `**Purpose:** Pinpoints the physical location of an IP address, including City, Country, ISP, and Organization.\n\n`;
                    helpMsg += `**Pro Tip:** Use this to trace the origin of suspicious login attempts or server attacks.\n\n`;
                    helpMsg += `[Ask AI about IP Tracking?](Ask AI: How accurate is IP geolocation?)`;
                }
                else if (cmd === 'mac') {
                    helpMsg = `### 📟 Command: /mac\n\n`;
                    helpMsg += `**Usage:** \`/mac <address>\`\n`;
                    helpMsg += `**Purpose:** Identifies the manufacturer of a network device based on its MAC address OUI (Organizationally Unique Identifier).\n\n`;
                    helpMsg += `**Pro Tip:** Use this during network scans to identify unknown devices (e.g., "Is this strange IP an Apple TV or a security camera?").\n\n`;
                    helpMsg += `[Ask AI about MAC Addresses?](Ask AI: Can MAC addresses be spoofed?)`;
                }
                else if (cmd === 'myip') {
                    helpMsg = `### 🔍 Command: /myip\n\n`;
                    helpMsg += `**Usage:** \`/myip\`\n`;
                    helpMsg += `**Purpose:** Reveals your public IP address and automatically geolocates it to show your ISP, City, and Coordinates.\n\n`;
                    helpMsg += `**Pro Tip:** Use this to verify if your VPN is working or to see what information websites can see about you.\n\n`;
                    helpMsg += `[Ask AI about IP Privacy?](Ask AI: How can I hide my IP address?)`;
                }
                else if (cmd === 'ipinfo') {
                    helpMsg = `### 🌐 Command: /ipinfo\n\n`;
                    helpMsg += `**Usage:** \`/ipinfo <ip_address>\`\n`;
                    helpMsg += `**Purpose:** Enhanced IP intelligence using dual-source data (IPInfo API + ip-api fallback). Shows Location, ISP, Hostname, and more.\n\n`;
                    helpMsg += `**Requires:** IPInfo Token (optional, in Settings) for premium data. Falls back to free ip-api if not configured.\n\n`;
                    helpMsg += `**Pro Tip:** Add your IPInfo token in Settings → Providers for richer data. For threat detection, use \`/iprecon\`.\n\n`;
                    helpMsg += `[Ask AI about IP Intelligence?](Ask AI: What can you learn from an IP address?)`;
                }
                else if (cmd === 'phone') {
                    helpMsg = `### 📱 Command: /phone\n\n`;
                    helpMsg += `**Usage:** \`/phone <number>\`\n`;
                    helpMsg += `**Purpose:** Validates phone numbers and reveals Carrier, Line Type (Mobile/Landline/VoIP), Location, and Country.\n\n`;
                    helpMsg += `**Requires:** NumVerify API Key (free tier: 100 requests/month) in Settings → Providers.\n\n`;
                    helpMsg += `**Pro Tip:** The command shows your monthly usage counter (X/100). Resets automatically on the 1st of each month.\n\n`;
                    helpMsg += `[Ask AI about Phone Intelligence?](Ask AI: What can you learn from a phone number?)`;
                }
                else if (cmd === 'iprecon') {
                    helpMsg = `### 🛡️ Command: /iprecon\n\n`;
                    helpMsg += `**Usage:** \`/iprecon <ip_address>\`\n`;
                    helpMsg += `**Purpose:** Advanced IP threat intelligence - detects VPNs, Proxies, Tor nodes, Datacenters, and calculates Abuse Score.\n\n`;
                    helpMsg += `**Requires:** AbstractAPI IP Key (separate from Email key) in Settings → Providers.\n\n`;
                    helpMsg += `**Pro Tip:** Use this to identify suspicious IPs during login attempts or to verify if traffic is coming from anonymizing services.\n\n`;
                    helpMsg += `[Ask AI about IP Threats?](Ask AI: How do VPNs and proxies affect security?)`;
                }
                else if (cmd === 'email') {
                    helpMsg = `### 📧 Command: /email\n\n`;
                    helpMsg += `**Usage:** \`/email <address>\`\n`;
                    helpMsg += `**Purpose:** Validates email addresses and detects Deliverability, Disposable Emails, Role Accounts (info@, admin@), and SMTP validity.\n\n`;
                    helpMsg += `**Requires:** AbstractAPI Email Key (free tier: 100 requests/month) in Settings → Providers.\n\n`;
                    helpMsg += `**Pro Tip:** Use this to verify email addresses before sending campaigns or to detect fake/temporary emails during registration.\n\n`;
                    helpMsg += `[Ask AI about Email Validation?](Ask AI: How does email validation work?)`;
                }
                else if (cmd === 'sys') {
                    helpMsg = `### 💻 Command: /sys\n\n`;
                    helpMsg += `**Usage:** \`/sys\`\n`;
                    helpMsg += `**Purpose:** Performs deep reconnaissance on the current system, revealing Browser Fingerprints, OS Details, Hardware Specs (CPU/RAM), and Network Identity (IPs & MAC Address).\n\n`;
                    helpMsg += `**Pro Tip:** Use this to see exactly what information your browser and machine are leaking to the web.\n\n`;
                    helpMsg += `[Ask AI about Browser Fingerprinting?](Ask AI: What is browser fingerprinting?)`;
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
                else if (cmd === 'wayback') {
                    helpMsg = `### 🕰️ Command: /wayback\n\n`;
                    helpMsg += `**Usage:** \`/wayback <url>\`\n`;
                    helpMsg += `**Purpose:** Queries the Internet Archive's Wayback Machine to find historical snapshots of any website.\n\n`;
                    helpMsg += `**Features:**\n`;
                    helpMsg += `- 📸 **Latest Snapshot**: View the most recent archived version\n`;
                    helpMsg += `- 📊 **Archive Statistics**: Total snapshots and years archived\n`;
                    helpMsg += `- 📅 **Calendar View**: Browse all snapshots by date\n`;
                    helpMsg += `- 💾 **Save Page**: Submit current URL for archiving\n\n`;
                    helpMsg += `**Pro Tip:** Use this to recover deleted content, track website changes over time, or find evidence of past claims.\n\n`;
                    helpMsg += `[Ask AI about Digital Forensics?](Ask AI: How do investigators use the Wayback Machine?)`;
                }
                else if (cmd === 'subdomains') {
                    helpMsg = `### 🔍 Command: /subdomains\n\n`;
                    helpMsg += `**Usage:** \`/subdomains <domain>\`\n`;
                    helpMsg += `**Purpose:** Discovers subdomains of a target domain using Certificate Transparency logs.\n\n`;
                    helpMsg += `**How it works:**\n`;
                    helpMsg += `- Queries Certificate Transparency logs (crt.sh) for SSL certificates\n`;
                    helpMsg += `- Extracts all domain names from certificates\n`;
                    helpMsg += `- Identifies both regular subdomains and wildcard certificates\n`;
                    helpMsg += `- Returns sorted, unique results\n\n`;
                    helpMsg += `**Why it's valuable:**\n`;
                    helpMsg += `- Discover hidden infrastructure (api.example.com, admin.example.com)\n`;
                    helpMsg += `- Map attack surface for security assessments\n`;
                    helpMsg += `- Find forgotten or legacy subdomains\n`;
                    helpMsg += `- Identify cloud services and third-party integrations\n\n`;
                    helpMsg += `**Pro Tip:** Combine with other tools: Run \`/shodan <ip>\` on discovered IPs, check \`/ssl <subdomain>\` for certificate validity, or use \`/headers <subdomain>\` to audit security headers.\n\n`;
                    helpMsg += `[Ask AI about Attack Surface?](Ask AI: What is attack surface mapping in cybersecurity?)`;
                }
                else if (cmd === 'company') {
                    helpMsg = `### 🏢 Command: /company\n\n`;
                    helpMsg += `**Usage:** \`/company <name|reg_number> [country]\`\n`;
                    helpMsg += `**Purpose:** Looks up company registry records (status, officers, PSCs, address, filings).\n\n`;
                    helpMsg += `**Sources:** Companies House (UK) as primary; OpenCorporates as fallback for other jurisdictions.\n`;
                    helpMsg += `**Requires:** Companies House API Key (UK) or OpenCorporates API Token (global) in Settings → Providers.\n\n`;
                    helpMsg += `**Outputs:** Legal name, registration number, status (active/dissolved), incorporation date, registered address, SIC/industry codes, active officers, people with significant control, and recent filings.\n\n`;
                    helpMsg += `**Country Codes:** \`uk\`/ \`gb\` for UK; US states as \`us-de\`, \`us-ca\`; Ireland \`ie\`; Germany \`de\`; etc.\n`;
                    helpMsg += `**Examples:**\n`;
                    helpMsg += `- \`/company "Acme Widgets Ltd" uk\`\n`;
                    helpMsg += `- \`/company 01234567\`\n`;
                    helpMsg += `- \`/company Stripe us-de\`\n\n`;
                    helpMsg += `**Pro Tip:** Pair with \`/reputation <domain>\` for web safety and \`/wayback <url>\` to see historical site changes for the company.`;
                }
                else if (cmd === 'reputation') {
                    helpMsg = `### 🛡️ Command: /reputation\n\n`;
                    helpMsg += `**Usage:** \`/reputation <domain>\`\n`;
                    helpMsg += `**Purpose:** Checks a domain against Google Safe Browsing's threat database to identify malicious or compromised websites.\n\n`;
                    helpMsg += `**Requires:** Google Safe Browsing API Key (Free) in Settings.\n\n`;
                    helpMsg += `**What it checks:**\n`;
                    helpMsg += `- 🦠 **Malware** - Sites that host malicious software\n`;
                    helpMsg += `- 🎣 **Phishing** - Social engineering/credential theft attempts\n`;
                    helpMsg += `- ⚠️ **Unwanted Software** - Deceptive software distribution\n`;
                    helpMsg += `- 📱 **Harmful Apps** - Potentially dangerous applications\n\n`;
                    helpMsg += `**Why it's critical:**\n`;
                    helpMsg += `- Google Safe Browsing protects 5+ billion devices worldwide\n`;
                    helpMsg += `- Database updated constantly with new threat intelligence\n`;
                    helpMsg += `- Free tier provides 10,000 lookups per day\n`;
                    helpMsg += `- Essential for vetting suspicious links before visiting\n\n`;
                    helpMsg += `**Pro Tip:** Always check domains before clicking links in emails, messages, or unfamiliar sources. Combine with \`/ssl <domain>\` and \`/headers <url>\` for comprehensive security assessment.\n\n`;
                    helpMsg += `[Ask AI about Web Threats?](Ask AI: How do phishing sites work and how can I spot them?)`;
                }
                else if (cmd === 'screenshot') {
                    helpMsg = `### 📸 Command: /screenshot\n\n`;
                    helpMsg += `**Usage:** \`/screenshot <url>\`\n`;
                    helpMsg += `**Purpose:** Captures live screenshots of websites for documentation, evidence collection, and visual reconnaissance.\n\n`;
                    helpMsg += `**No API Key Required!** Uses local Puppeteer (headless Chrome).\n\n`;
                    helpMsg += `**Features:**\n`;
                    helpMsg += `- 🖼️ **High Quality** - 1920x1080 resolution by default\n`;
                    helpMsg += `- 📄 **Full Page** - Capture entire page or just viewport\n`;
                    helpMsg += `- 🎭 **Stealth Mode** - Real browser user agent to avoid bot detection\n`;
                    helpMsg += `- 📊 **Page Info** - Extracts title, dimensions, and final URL\n\n`;
                    helpMsg += `**Use cases:**\n`;
                    helpMsg += `- Evidence collection for investigations\n`;
                    helpMsg += `- Website change detection and monitoring\n`;
                    helpMsg += `- Phishing site documentation\n`;
                    helpMsg += `- Web design/layout review\n`;
                    helpMsg += `- Social media profile archiving\n\n`;
                    helpMsg += `**Pro Tip:** Combine with \`/wayback <url>\` to compare current sites with archived versions, or use \`/reputation <domain>\` first to check if a site is safe before capturing.\n\n`;
                    helpMsg += `[Ask AI about Digital Evidence?](Ask AI: What are best practices for digital evidence collection?)`;
                }
                else if (cmd === 'reverse') {
                    helpMsg = `### 🔄 Command: /reverse\n\n`;
                    helpMsg += `**Usage:** \`/reverse <ip>\`\n`;
                    helpMsg += `**Purpose:** Performs reverse DNS lookup to find all domains hosted on a specific IP address.\n\n`;
                    helpMsg += `**No API Key Required!** Uses HackerTarget's free API.\n\n`;
                    helpMsg += `**What you discover:**\n`;
                    helpMsg += `- All domains pointing to the target IP\n`;
                    helpMsg += `- Shared vs dedicated hosting insights\n`;
                    helpMsg += `- Related websites on same infrastructure\n`;
                    helpMsg += `- Alphabetically sorted domain lists\n\n`;
                    helpMsg += `**Why it's valuable:**\n`;
                    helpMsg += `- **Find Related Sites**: Discover other domains owned by same entity\n`;
                    helpMsg += `- **Shared Hosting Detection**: See if target shares IP with other sites\n`;
                    helpMsg += `- **Infrastructure Mapping**: Understand hosting setup (dedicated/VPS/shared)\n`;
                    helpMsg += `- **Security Research**: Identify neighbors on same server\n\n`;
                    helpMsg += `**Example Results:**\n`;
                    helpMsg += `- 1 domain = Dedicated IP (likely dedicated server)\n`;
                    helpMsg += `- 2-10 domains = VPS or small shared hosting\n`;
                    helpMsg += `- 10-100 domains = Medium shared hosting\n`;
                    helpMsg += `- 100+ domains = Large hosting provider or CDN\n\n`;
                    helpMsg += `**Pro Tip:** Combine with other tools: Use \`/geoip <ip>\` to see location/ISP, \`/shodan <ip>\` to scan ports, or run \`/reputation <domain>\` on discovered domains to check for threats.\n\n`;
                    helpMsg += `[Ask AI about Reverse DNS?](Ask AI: How does reverse DNS lookup work in OSINT?)`;
                }
                else if (cmd === 'asn') {
                    helpMsg = `### 🌐 Command: /asn\n\n`;
                    helpMsg += `**Usage:** \`/asn <asn_number or ip>\`\n`;
                    helpMsg += `**Purpose:** Lookup Autonomous System Number (ASN) information to find IP ranges owned by organizations.\n\n`;
                    helpMsg += `**No API Key Required!** Uses HackerTarget's free API.\n\n`;
                    helpMsg += `**What you discover:**\n`;
                    helpMsg += `- Organization name and ASN number\n`;
                    helpMsg += `- All IP ranges (CIDR blocks) owned by the ASN\n`;
                    helpMsg += `- Country and registry information (ARIN, RIPE, APNIC)\n`;
                    helpMsg += `- Allocation dates for IP ranges\n\n`;
                    helpMsg += `**Input Formats:**\n`;
                    helpMsg += `- **ASN Number**: \`/asn AS15169\` or \`/asn 15169\` (Google)\n`;
                    helpMsg += `- **IP Address**: \`/asn 8.8.8.8\` (finds the ASN for that IP)\n\n`;
                    helpMsg += `**Why it's valuable:**\n`;
                    helpMsg += `- **Infrastructure Mapping**: See all IP ranges owned by a company\n`;
                    helpMsg += `- **Network Research**: Understand an organization's internet presence\n`;
                    helpMsg += `- **Security Audits**: Identify all network assets for a target\n`;
                    helpMsg += `- **Threat Intelligence**: Track malicious ASNs and their IP ranges\n\n`;
                    helpMsg += `**About ASN:**\n`;
                    helpMsg += `An **Autonomous System Number (ASN)** is a unique identifier for a collection of IP networks operated by one or more network operators. `;
                    helpMsg += `Large organizations like Google (AS15169), Amazon (AS16509), and Cloudflare (AS13335) have their own ASNs. `;
                    helpMsg += `Universities, ISPs, and hosting providers also typically have dedicated ASNs.\n\n`;
                    helpMsg += `**Example ASNs:**\n`;
                    helpMsg += `- AS15169 = Google LLC\n`;
                    helpMsg += `- AS16509 = Amazon.com, Inc.\n`;
                    helpMsg += `- AS13335 = Cloudflare, Inc.\n`;
                    helpMsg += `- AS32934 = Facebook, Inc.\n\n`;
                    helpMsg += `**Pro Tip:** Once you have IP ranges from an ASN, use \`/geoip <ip>\` to check locations, \`/shodan <ip>\` to scan for services, \`/reverse <ip>\` to find hosted domains, or \`/ports <ip>\` to scan ports (requires authorization).\n\n`;
                    helpMsg += `[Ask AI about ASN?](Ask AI: What is an Autonomous System Number and how is it used in networking?)`;
                }
                else if (cmd === 'ports') {
                    helpMsg = `### 🔌 Command: /ports\n\n`;
                    helpMsg += `**Usage:** \`/ports <ip_or_host> [ports]\`\n`;
                    helpMsg += `**Purpose:** Performs a fast TCP port scan on the target to find open services.\n\n`;
                    helpMsg += `**Defaults:** Scans ~40 of the most common service ports (22, 80, 443, 3389, etc.).\n`;
                    helpMsg += `**Custom Ports:** Add a comma-separated list to override (e.g., \`/ports 1.1.1.1 22,80,443\`). Limited to 100 ports per scan.\n\n`;
                    helpMsg += `**Safety Notice:** Only scan systems you are authorized to test. Unauthorized port scanning can violate laws and ToS.\n\n`;
                    helpMsg += `**Insights:**\n`;
                    helpMsg += `- Detect exposed services (SSH, RDP, DBs)\n`;
                    helpMsg += `- Validate firewall rules and hardening\n`;
                    helpMsg += `- Prioritize follow-up checks (e.g., run \`/shodan <ip>\` or audit SSL/headers on web ports)\n\n`;
                    helpMsg += `[Ask AI about port scanning legality?](Ask AI: When is port scanning allowed?)`;
                }
                else if (cmd === 'trace') {
                    helpMsg = `### 🛰️ Command: /trace\n\n`;
                    helpMsg += `**Usage:** \`/trace <domain_or_ip>\`\n`;
                    helpMsg += `**Purpose:** Runs a traceroute to map the network path (hops) from you to the target.\n\n`;
                    helpMsg += `**What you see:** Hop number, host/IP (when resolvable), and latency.\n`;
                    helpMsg += `**Limits:** Max 20 hops, 1 probe per hop, ~20s timeout.\n\n`;
                    helpMsg += `**Tips:**\n`;
                    helpMsg += `- Use alongside \`/geoip <ip>\` on interesting hops\n`;
                    helpMsg += `- Compare with \`/shodan <ip>\` on final endpoints\n`;
                    helpMsg += `- Hops with * are timeouts or filtered\n`;
                    helpMsg += `- Results depend on your network path and ISP\n\n`;
                    helpMsg += `**Note:** Some networks rate-limit ICMP/UDP probes, so mid-path hops may show timeouts while the route still succeeds.`;
                }
                else if (cmd === 'certs') {
                    helpMsg = `### 📜 Command: /certs\n\n`;
                    helpMsg += `**Usage:** \`/certs <domain>\`\n`;
                    helpMsg += `**Purpose:** Pulls Certificate Transparency logs to find all certificates issued for a domain.\n\n`;
                    helpMsg += `**What you get:**\n`;
                    helpMsg += `- Total certificates, first/last seen timestamps\n`;
                    helpMsg += `- Unique hostnames (including wildcards)\n`;
                    helpMsg += `- Top issuers and recent certificate details\n\n`;
                    helpMsg += `**Value:** Discover hidden subdomains, track issuance history, spot suspicious certs.\n\n`;
                    helpMsg += `**Pro Tip:** Pair with \`/subdomains\` and then run \`/ssl <hostname>\` to audit specific hosts.`;
                }
                else if (cmd === 'hash') {
                    helpMsg = `### 🧬 Command: /hash\n\n`;
                    helpMsg += `**Usage:** \`/hash <md5|sha1|sha256|sha512>\`\n`;
                    helpMsg += `**Purpose:** Checks a file hash against VirusTotal to see if it’s malicious.\n\n`;
                    helpMsg += `**Requires:** VirusTotal API key (same as /scan) in Settings → Providers.\n\n`;
                    helpMsg += `**Outputs:** Detection stats (malicious/suspicious/harmless), file type, size, first/last submission times, and known filenames.\n\n`;
                    helpMsg += `**Pro Tip:** Submit the sample separately if not found, or try another hash variant (MD5 vs SHA256).`;
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
                        msg += `\n#### 🧭 PSC / Significant Control (top ${pscs.length})\n`;
                        pscs.forEach((p: any) => {
                            const controls = (p.natures_of_control || []).join(', ');
                            msg += `- ${p.name || 'Unknown'}${controls ? ` — ${controls}` : ''}${p.notified_on ? ` (notified ${p.notified_on})` : ''}${p.ceased_on ? `, ceased ${p.ceased_on}` : ''}\n`;
                        });
                    }

                    if (filings.length) {
                        msg += `\n#### 🗂️ Recent Filings (${filings.length})\n`;
                        filings.forEach((f: any) => {
                            msg += `- ${f.date || 'Unknown date'} — ${f.description || f.type || 'Filing'}${f.category ? ` [${f.category}]` : ''}\n`;
                        });
                    }

                    if (!officers.length && !pscs.length && !filings.length) {
                        msg += `\n*No officers, PSCs, or filings returned for this entity.*`;
                    }

                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: msg, timestamp: Date.now()
                    }]);
                } catch (e: any) {
                    onUpdateMessages(prev => [...prev, {
                        id: uuidv4(), sender: Sender.AI, text: `❌ Company lookup failed: ${e.message}`, timestamp: Date.now()
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

            // 10. Certificate Transparency (/certs)
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
            } else if ((modelToUse === ModelType.LMSTUDIO || settings.availableModels.lmstudio.includes(modelToUse)) && !isPetChat) {
                // LM Studio - check both enum and actual model names
                const promptWithSearch = (searchContext || studyContextText)
                    ? `${studyContextText}${searchContext ? `[Web Search Results]:\n${searchContext}\n\n` : ''}User Query: ${textToSend}`
                    : textToSend;
                const actualModelId = modelToUse === ModelType.LMSTUDIO ? settings.lmstudioModelId : modelToUse;
                const res = await streamLMStudioResponse(promptWithSearch, imageAttachments, session.messages, settings.lmstudioBaseUrl, actualModelId, relevantContext, commonParams, settings.modelParams);
                finalParams(res.text, res.usage);
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

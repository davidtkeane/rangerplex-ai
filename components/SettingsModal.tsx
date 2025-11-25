
import React, { useState, useEffect } from 'react';
import { AppSettings, AgentConfig, ModelType, SavedPrompt, VoiceConfig, Currency, DEFAULT_SAVED_PROMPTS } from '../types';
import { checkOllamaConnection, pullOllamaModel } from '../services/ollamaService';
import { fetchGeminiModels, fetchOllamaModels, fetchOpenAIModels } from '../services/modelRegistry';
import { processAvatarImage } from '../services/imageProcessing';
import { fetchElevenLabsVoices, Voice } from '../services/elevenLabsService';
import { dbService } from '../services/dbService';
import { syncService } from '../services/syncService';
import { updateService, UpdateInfo } from '../services/updateService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSave: (newSettings: AppSettings) => void;
    onOpenBackupManager?: () => void;
    onOpenTraining?: () => void;
    sessions?: any[];
    currentId?: string | null;
    onExportChat?: (session: any) => void;
    onExportAll?: () => void;
    onPurgeAll?: () => void;
}

const InputGroup = ({ label, value, onChange, icon, onTest, status, inputClass }: any) => (
    <div>
        <label className="block text-xs font-bold mb-1 opacity-80"><i className={`${icon} w-4`}></i> {label}</label>
        <div className="flex gap-2">
            <input type={label.includes('Key') || label.includes('Token') ? 'password' : 'text'} value={value} onChange={e => onChange(e.target.value)} className={`flex-1 rounded px-4 py-2 outline-none ${inputClass}`} />
            {onTest && (
                <button onClick={onTest} className={`px-4 py-1 rounded border border-inherit whitespace-nowrap min-w-[80px] flex items-center justify-center ${status === 'success' ? 'bg-green-500/10 text-green-500' : status === 'error' ? 'bg-red-500/10 text-red-500' : 'hover:bg-white/5'}`}>
                    {status === 'success' ? <i className="fa-solid fa-check"></i> : status === 'loading' ? <i className="fa-solid fa-circle-notch fa-spin"></i> : status === 'error' ? <i className="fa-solid fa-xmark"></i> : 'Test'}
                </button>
            )}
        </div>
    </div>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, onOpenBackupManager, onOpenTraining, sessions, currentId, onExportChat, onExportAll, onPurgeAll }) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [activeTab, setActiveTab] = useState<'general' | 'media' | 'params' | 'providers' | 'ollama' | 'search' | 'council' | 'prompts' | 'security' | 'canvas' | 'radio' | 'tamagotchi' | 'data' | 'about' | 'help'>('general');
    const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: 'loading' | 'success' | 'error' | 'idle' }>({});
    const [loadingModels, setLoadingModels] = useState(false);
    const [promptSearch, setPromptSearch] = useState('');
    const [promptImportText, setPromptImportText] = useState('');

    // Update Checker State
    const [updateStatus, setUpdateStatus] = useState<UpdateInfo | null>(null);
    const [checkingUpdate, setCheckingUpdate] = useState(false);

    const handleCheckUpdate = async () => {
        setCheckingUpdate(true);
        const info = await updateService.checkForUpdates();
        setUpdateStatus(info);
        setCheckingUpdate(false);
    };
    const [promptMessage, setPromptMessage] = useState<string | null>(null);

    // Ollama Management
    const [pullModelName, setPullModelName] = useState('');
    const [pullStatus, setPullStatus] = useState<string | null>(null);
    const [pullProgress, setPullProgress] = useState(0);

    // Proxy Status
    const [proxyStatus, setProxyStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

    // Voices
    const [elevenLabsVoices, setElevenLabsVoices] = useState<Voice[]>([]);

    // Data & Backup
    const [syncStatus, setSyncStatus] = useState({ connected: false, queuedMessages: 0 });
    const [storageStats, setStorageStats] = useState({ browser: 0, server: 0, lastBackup: 0 });
    const [exportInProgress, setExportInProgress] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [syncInProgress, setSyncInProgress] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings);
            checkProxyStatus();
            if (settings.elevenLabsApiKey) loadVoices(settings.elevenLabsApiKey);

            // Load sync status and storage stats if on Data tab
            if (activeTab === 'data') {
                const status = syncService.getConnectionStatus();
                setSyncStatus(status);
                loadStorageStats();
                loadLastSyncTime();
            }
        }
    }, [settings, isOpen, activeTab]);

    const checkProxyStatus = async () => {
        setProxyStatus('checking');
        try {
            const res = await fetch(`${localSettings.corsProxyUrl?.replace(/\/$/, '')}/health`);
            if (res.ok) setProxyStatus('connected');
            else setProxyStatus('disconnected');
        } catch {
            setProxyStatus('disconnected');
        }
    };

    const loadVoices = async (key: string) => {
        const voices = await fetchElevenLabsVoices(key);
        setElevenLabsVoices(voices);
    };

    const loadLastSyncTime = async () => {
        try {
            const lastSync = await dbService.getSetting('lastSyncTime');
            if (lastSync) {
                setStorageStats(prev => ({ ...prev, lastBackup: lastSync }));
            }
        } catch (error) {
            console.error('Failed to load last sync time:', error);
        }
    };

    const saveLastSyncTime = async (timestamp: number) => {
        try {
            await dbService.saveSetting('lastSyncTime', timestamp);
            setStorageStats(prev => ({ ...prev, lastBackup: timestamp }));
        } catch (error) {
            console.error('Failed to save last sync time:', error);
        }
    };

    const loadStorageStats = async () => {
        try {
            // Calculate IndexedDB size
            const chats = await dbService.getAllChats();
            const settings = await dbService.getAllSettings();
            const browserSize = JSON.stringify({ chats, settings }).length;

            // Get server size (from server API)
            let serverSize = 0;
            try {
                const serverChats = await syncService.getAllChats();
                const serverSettings = await syncService.getAllSettings();
                serverSize = JSON.stringify({ chats: serverChats, settings: serverSettings }).length;
            } catch (error) {
                console.error('Failed to get server size:', error);
            }

            setStorageStats(prev => ({
                ...prev,
                browser: browserSize,
                server: serverSize
            }));
        } catch (error) {
            console.error('Failed to calculate storage stats:', error);
        }
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    const fetchAllModels = async () => {
        setLoadingModels(true);
        try {
            const gemini = await fetchGeminiModels(localSettings.geminiApiKey);
            const openai = await fetchOpenAIModels(localSettings.openaiApiKey || '');
            const ollama = await fetchOllamaModels(localSettings.ollamaBaseUrl);

            setLocalSettings(prev => ({
                ...prev,
                availableModels: {
                    ...prev.availableModels,
                    gemini: gemini.length > 0 ? gemini : prev.availableModels.gemini,
                    openai: openai.length > 0 ? openai : prev.availableModels.openai,
                    ollama: ollama.length > 0 ? ollama : prev.availableModels.ollama
                }
            }));
            alert(`Models Updated!\nGemini: ${gemini.length}\nOpenAI: ${openai.length}\nOllama: ${ollama.length}`);
        } catch (e) {
            console.error(e);
            alert("Error fetching models. Check API Keys.");
        } finally {
            setLoadingModels(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'user' | 'ai' | 'pet') => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await processAvatarImage(e.target.files[0]);
                const newSettings = {
                    ...localSettings,
                    [type === 'user' ? 'userAvatar' : type === 'ai' ? 'aiAvatar' : 'petAvatar']: base64
                };
                setLocalSettings(newSettings);
                // Save immediately - avatars are important!
                onSave(newSettings);
                console.log(`✅ ${type} avatar saved automatically`);
            } catch (err) {
                alert("Failed to process image.");
            }
        }
    };

    const handlePullModel = async () => {
        if (!pullModelName) return;
        setPullStatus("Starting...");
        setPullProgress(0);
        try {
            await pullOllamaModel(localSettings.ollamaBaseUrl, pullModelName, (status, completed, total) => {
                setPullStatus(status);
                if (total > 0) {
                    setPullProgress(Math.round((completed / total) * 100));
                }
            });
            setPullStatus("Done!");
            setPullProgress(100);
            fetchAllModels(); // Refresh list
        } catch (e) {
            setPullStatus("Failed: " + (e instanceof Error ? e.message : String(e)));
        }
    };

    const handleAgentChange = (index: number, field: keyof AgentConfig, value: any) => {
        const updatedAgents = [...localSettings.councilAgents];
        updatedAgents[index] = { ...updatedAgents[index], [field]: value };
        setLocalSettings({ ...localSettings, councilAgents: updatedAgents });
    };

    const addAgent = () => {
        const newAgent: AgentConfig = {
            id: Math.random().toString(36).substr(2, 9),
            name: "New Agent",
            role: "Helper",
            color: "bg-gray-600",
            systemInstruction: "You are a helper.",
            model: ModelType.FAST,
            temperature: 0.5
        };
        setLocalSettings({ ...localSettings, councilAgents: [...localSettings.councilAgents, newAgent] });
    };

    const removeAgent = (index: number) => {
        const updatedAgents = localSettings.councilAgents.filter((_, i) => i !== index);
        setLocalSettings({ ...localSettings, councilAgents: updatedAgents });
    };

    const addPrompt = () => {
        const newPrompt: SavedPrompt = { id: Math.random().toString(), trigger: 'new', text: '' };
        setLocalSettings(prev => ({ ...prev, savedPrompts: [...prev.savedPrompts, newPrompt] }));
    };

    const updatePrompt = (idx: number, field: keyof SavedPrompt, value: string) => {
        const updated = [...localSettings.savedPrompts];
        updated[idx] = { ...updated[idx], [field]: value };
        setLocalSettings(prev => ({ ...prev, savedPrompts: updated }));
    };

    const removePrompt = (idx: number) => {
        const updated = localSettings.savedPrompts.filter((_, i) => i !== idx);
        setLocalSettings(prev => ({ ...prev, savedPrompts: updated }));
    };

    const movePrompt = (idx: number, direction: 'up' | 'down') => {
        const updated = [...localSettings.savedPrompts];
        const target = direction === 'up' ? idx - 1 : idx + 1;
        if (target < 0 || target >= updated.length) return;
        [updated[idx], updated[target]] = [updated[target], updated[idx]];
        setLocalSettings(prev => ({ ...prev, savedPrompts: updated }));
    };

    const exportPrompts = async () => {
        const payload = JSON.stringify(localSettings.savedPrompts, null, 2);
        try {
            await navigator.clipboard.writeText(payload);
            setPromptMessage('Copied prompts JSON to clipboard.');
        } catch {
            setPromptMessage('Could not copy to clipboard. Please select and copy manually.');
        }
        setPromptImportText(payload);
    };

    const importPrompts = () => {
        try {
            const parsed = JSON.parse(promptImportText);
            if (!Array.isArray(parsed)) throw new Error('Expected an array');
            const sanitized = parsed
                .filter((p: any) => p && (p.trigger || p.text))
                .map((p: any, idx: number) => ({
                    id: p.id ? String(p.id) : `imp-${Date.now()}-${idx}`,
                    trigger: String(p.trigger || '').trim(),
                    text: String(p.text || '').trim()
                }))
                .filter((p: any) => p.trigger && p.text);

            if (sanitized.length === 0) throw new Error('No valid prompts found');
            setLocalSettings(prev => ({ ...prev, savedPrompts: sanitized }));
            setPromptMessage(`Imported ${sanitized.length} prompts.`);
        } catch (err) {
            setPromptMessage(`Import failed: ${(err as Error).message}`);
        }
    };

    const resetPromptsToDefaults = () => {
        setLocalSettings(prev => ({ ...prev, savedPrompts: DEFAULT_SAVED_PROMPTS.map(p => ({ ...p })) }));
        setPromptMessage('Reset to 20 default prompts.');
    };

    const appendMissingDefaults = () => {
        setLocalSettings(prev => {
            const triggers = new Set(prev.savedPrompts.map(p => p.trigger));
            const merged = [...prev.savedPrompts, ...DEFAULT_SAVED_PROMPTS.filter(p => !triggers.has(p.trigger))];
            return { ...prev, savedPrompts: merged };
        });
        setPromptMessage('Added any missing defaults.');
    };

    const testConnection = async (provider: string) => {
        setConnectionStatus(p => ({ ...p, [provider]: 'loading' }));
        try {
            let success = false;

            // Ollama - Real test via service
            if (provider === 'ollama') {
                success = await checkOllamaConnection(localSettings.ollamaBaseUrl);
            }

            // Gemini - Real API test
            else if (provider === 'gemini' && localSettings.geminiApiKey) {
                const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + localSettings.geminiApiKey);
                success = response.ok;
            }

            // OpenAI - Real API test
            else if (provider === 'openai' && localSettings.openaiApiKey) {
                const response = await fetch('https://api.openai.com/v1/models', {
                    headers: {
                        Authorization: 'Bearer ' + localSettings.openaiApiKey,
                        'Accept': 'application/json'
                    }
                });
                success = response.ok;
            }

            // Anthropic - Real API test via proxy
            else if (provider === 'anthropic' && localSettings.anthropicApiKey) {
                const proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3010';
                const response = await fetch(`${proxyUrl}/v1/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': localSettings.anthropicApiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-sonnet-4-5-20250929',
                        messages: [{ role: 'user', content: 'test' }],
                        max_tokens: 10
                    })
                });
                success = response.ok;
            }

            // Perplexity - Real API test
            else if (provider === 'perplexity' && localSettings.perplexityApiKey) {
                const response = await fetch('https://api.perplexity.ai/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localSettings.perplexityApiKey,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'sonar-reasoning-pro',
                        messages: [{ role: 'user', content: 'ping' }],
                        max_tokens: 10
                    })
                });
                success = response.ok;
            }

            // ElevenLabs - Real API test
            else if (provider === 'elevenlabs' && localSettings.elevenLabsApiKey) {
                const response = await fetch('https://api.elevenlabs.io/v1/voices', {
                    headers: { 'xi-api-key': localSettings.elevenLabsApiKey }
                });
                success = response.ok;
            }

            // Hugging Face - Real API test
            else if (provider === 'huggingface' && localSettings.huggingFaceApiKey) {
                const response = await fetch('https://huggingface.co/api/whoami-v2', {
                    headers: { 'Authorization': 'Bearer ' + localSettings.huggingFaceApiKey }
                });
                success = response.ok;
            }

            // Grok/xAI - Real API test
            else if (provider === 'xai' && localSettings.xaiApiKey) {
                const response = await fetch('https://api.x.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localSettings.xaiApiKey
                    },
                    body: JSON.stringify({
                        model: 'grok-3',
                        messages: [{ role: 'user', content: 'test' }],
                        max_tokens: 10
                    })
                });
                success = response.ok;
            }

            // Brave Search - Real API test
            else if (provider === 'brave' && localSettings.braveApiKey) {
                const response = await fetch('https://api.search.brave.com/res/v1/web/search?q=test&count=1', {
                    headers: { 'X-Subscription-Token': localSettings.braveApiKey }
                });
                success = response.ok;
            }

            // VirusTotal - Real API test
            else if (provider === 'virustotal' && localSettings.virusTotalApiKey) {
                const response = await fetch('https://www.virustotal.com/api/v3/ip_addresses/8.8.8.8', {
                    headers: { 'x-apikey': localSettings.virusTotalApiKey }
                });
                success = response.ok;
            }

            // Have I Been Pwned - Real API test
            else if (provider === 'hibp' && localSettings.hibpApiKey) {
                const response = await fetch('https://haveibeenpwned.com/api/v3/services', {
                    headers: {
                        'hibp-api-key': localSettings.hibpApiKey,
                        'user-agent': 'RangerPlex-AI'
                    }
                });
                success = response.ok;
            }

            // Shodan - Real API test
            else if (provider === 'shodan' && localSettings.shodanApiKey) {
                const response = await fetch(`https://api.shodan.io/api-info?key=${localSettings.shodanApiKey}`);
                success = response.ok;
            }

            // IPInfo - Real API test
            else if (provider === 'ipinfo' && localSettings.ipinfoToken) {
                const response = await fetch(`https://ipinfo.io/8.8.8.8?token=${localSettings.ipinfoToken}`);
                success = response.ok;
            }

            // NumVerify - Real API test
            else if (provider === 'numverify' && localSettings.numverifyApiKey) {
                const response = await fetch(`http://apilayer.net/api/validate?access_key=${localSettings.numverifyApiKey}&number=14158586273`);
                const data = await response.json();
                success = data.valid !== undefined; // API returns valid field
            }

            // AbstractAPI Email - Real API test
            else if (provider === 'abstractemail' && localSettings.abstractEmailApiKey) {
                const response = await fetch(`https://emailreputation.abstractapi.com/v1/?api_key=${localSettings.abstractEmailApiKey}&email=test@example.com`);
                const data = await response.json();
                success = data.email !== undefined; // API returns email field
            }

            // AbstractAPI IP - Real API test
            else if (provider === 'abstractip' && localSettings.abstractIpApiKey) {
                const response = await fetch(`https://ip-intelligence.abstractapi.com/v1/?api_key=${localSettings.abstractIpApiKey}&ip_address=8.8.8.8`);
                const data = await response.json();
                success = data.ip_address !== undefined; // API returns ip_address field
            }

            await new Promise(r => setTimeout(r, 800));
            setConnectionStatus(p => ({ ...p, [provider]: success ? 'success' : 'error' }));
        } catch (error) {
            console.error(`API test failed for ${provider}:`, error);
            setConnectionStatus(p => ({ ...p, [provider]: 'error' }));
        }
    };

    const themeClass = localSettings.theme === 'tron'
        ? 'bg-tron-dark border-tron-cyan text-tron-cyan font-tron shadow-[0_0_20px_rgba(0,243,255,0.2)]'
        : 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border-gray-200 dark:border-zinc-800';

    const inputClass = localSettings.theme === 'tron'
        ? 'bg-black border border-tron-cyan/50 text-tron-cyan focus:shadow-[0_0_10px_#00f3ff] placeholder-tron-cyan/30'
        : 'bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] min-h-[70vh] transition-all duration-300 ${themeClass}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-inherit">
                    <h2 className="text-xl font-bold uppercase tracking-wider">Settings</h2>
                    <button onClick={onClose} className="opacity-70 hover:opacity-100 w-8 h-8 flex items-center justify-center rounded hover:bg-white/10">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex flex-nowrap items-center gap-2 border-b border-inherit px-6 py-2 overflow-x-auto bg-opacity-50 scrollbar-thin">
                    {['general', 'media', 'params', 'providers', 'ollama', 'search', 'council', 'prompts', 'security', 'canvas', 'radio', 'tamagotchi', 'data', 'about', 'help'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`py-3 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab ? 'border-current opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className={`flex-1 overflow-y-auto p-6 scrollbar-thin min-h-[60vh] ${localSettings.theme === 'tron' ? 'scrollbar-thumb-tron-cyan scrollbar-track-black' : ''}`}>

                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Avatar & Theme Inputs */}
                                <div>
                                    <label className="block text-xs font-bold mb-1 opacity-80"><i className="fa-solid fa-user w-4"></i> User Avatar</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-inherit bg-zinc-800 flex items-center justify-center">
                                            {localSettings.userAvatar ? <img src={localSettings.userAvatar} className="w-full h-full object-cover" /> : <i className="fa-solid fa-user text-zinc-500"></i>}
                                        </div>
                                        <label className={`px-3 py-2 text-xs font-bold rounded cursor-pointer ${inputClass} hover:opacity-80`}>
                                            Upload
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarUpload(e, 'user')} />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 opacity-80"><i className="fa-solid fa-robot w-4"></i> AI Avatar</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-inherit bg-zinc-800 flex items-center justify-center">
                                            {localSettings.aiAvatar ? <img src={localSettings.aiAvatar} className="w-full h-full object-cover" /> : <i className="fa-solid fa-robot text-zinc-500"></i>}
                                        </div>
                                        <label className={`px-3 py-2 text-xs font-bold rounded cursor-pointer ${inputClass} hover:opacity-80`}>
                                            Upload
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarUpload(e, 'ai')} />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">Theme</label>
                                    <select value={localSettings.theme} onChange={(e) => setLocalSettings({ ...localSettings, theme: e.target.value as any })} className={`w-full rounded px-3 py-2 outline-none ${inputClass}`}>
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                        <option value="tron">The Grid (Tron)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">Preferred Currency</label>
                                    <select value={localSettings.currency || 'USD'} onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value as any })} className={`w-full rounded px-3 py-2 outline-none ${inputClass}`}>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="JPY">JPY (¥)</option>
                                        <option value="CNY">CNY (¥)</option>
                                        <option value="CAD">CAD (C$)</option>
                                        <option value="AUD">AUD (A$)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                    <input type="checkbox" checked={localSettings.autoHideModelSelector} onChange={e => setLocalSettings({ ...localSettings, autoHideModelSelector: e.target.checked })} className="accent-teal-500 w-5 h-5" />
                                    Auto-Hide Model Selector
                                </label>
                                <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                    <input type="checkbox" checked={localSettings.showScannerBeam ?? true} onChange={e => setLocalSettings({ ...localSettings, showScannerBeam: e.target.checked })} className="accent-teal-500 w-5 h-5" />
                                    Show Header Scanner Beam
                                </label>
                                <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                    <input type="checkbox" checked={localSettings.holidayMode} onChange={e => setLocalSettings({ ...localSettings, holidayMode: e.target.checked })} className="accent-teal-500 w-5 h-5" />
                                    Holiday Mode (Snow)
                                </label>
                                <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                    <input type="checkbox" checked={localSettings.showHeaderControls} onChange={e => setLocalSettings({ ...localSettings, showHeaderControls: e.target.checked })} className="accent-teal-500 w-5 h-5" />
                                    Show Header Celebration Buttons
                                </label>
                                <div>
                                    <label className="block text-xs font-bold mb-1 opacity-80">Celebration Style</label>
                                    <select
                                        value={localSettings.holidayEffect}
                                        onChange={(e) => setLocalSettings({ ...localSettings, holidayEffect: e.target.value as any })}
                                        className={`w-full rounded px-3 py-2 outline-none ${inputClass}`}
                                    >
                                        <option value="snow">Snow</option>
                                        <option value="confetti">Confetti</option>
                                        <option value="sparkles">Sparkles</option>
                                    </select>
                                </div>
                                <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                    <input type="checkbox" checked={localSettings.celebrationEffects} onChange={e => setLocalSettings({ ...localSettings, celebrationEffects: e.target.checked })} className="accent-teal-500 w-5 h-5" />
                                    Celebration FX (Rename Sparkles)
                                </label>
                                <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                    <input type="checkbox" checked={localSettings.enableVoiceResponse} onChange={e => setLocalSettings({ ...localSettings, enableVoiceResponse: e.target.checked })} className="accent-teal-500 w-5 h-5" />
                                    Enable Auto Voice Response (TTS)
                                </label>
                                <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                    <input type="checkbox" checked={localSettings.useStudyNotesInChat ?? true} onChange={e => setLocalSettings({ ...localSettings, useStudyNotesInChat: e.target.checked })} className="accent-teal-500 w-5 h-5" />
                                    Include Study Notes in Chat Context
                                </label>
                            </div>
                        </div>
                    )}

                    {/* MEDIA TAB */}
                    {activeTab === 'media' && (
                        <div className="space-y-6">
                            <h3 className="font-bold mb-2 border-b border-inherit pb-2">Audio Studio</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold mb-1 opacity-80">Voice Provider</label>
                                    <select
                                        value={localSettings.voiceConfig.provider}
                                        onChange={(e) => setLocalSettings({ ...localSettings, voiceConfig: { ...localSettings.voiceConfig, provider: e.target.value as any } })}
                                        className={`w-full rounded px-3 py-2 outline-none ${inputClass}`}
                                    >
                                        <option value="browser">Browser (Robot)</option>
                                        <option value="openai">OpenAI (HD)</option>
                                        <option value="elevenlabs">ElevenLabs (Cinema)</option>
                                    </select>
                                </div>
                                {localSettings.voiceConfig.provider === 'elevenlabs' && (
                                    <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">ElevenLabs Voice</label>
                                        <select
                                            value={localSettings.voiceConfig.voiceId}
                                            onChange={(e) => setLocalSettings({ ...localSettings, voiceConfig: { ...localSettings.voiceConfig, voiceId: e.target.value } })}
                                            className={`w-full rounded px-3 py-2 outline-none ${inputClass}`}
                                        >
                                            <option value="">Select a Voice...</option>
                                            {elevenLabsVoices.map(v => (
                                                <option key={v.voice_id} value={v.voice_id}>{v.name} ({v.category})</option>
                                            ))}
                                        </select>
                                        <button onClick={() => loadVoices(localSettings.elevenLabsApiKey || '')} className="text-xs underline mt-1 opacity-50">Refresh Voices</button>
                                    </div>
                                )}
                            </div>

                            <h3 className="font-bold mb-2 border-b border-inherit pb-2 mt-6">Visual Studio</h3>
                            <p className="text-sm opacity-60">Configure default providers for Image Generation commands.</p>
                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <p className="text-xs opacity-70 mb-2">Commands available in chat:</p>
                                <ul className="text-xs list-disc pl-4 space-y-1 opacity-80">
                                    <li><code>/imagine [prompt]</code> - Uses DALL-E 3</li>
                                    <li><code>/imagine_all [prompt]</code> - Compares DALL-E, Flux, and Imagen</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* PROVIDERS TAB */}
                    {activeTab === 'providers' && (
                        <div className="space-y-6">
                            <InputGroup label="Gemini API Key" value={localSettings.geminiApiKey} onChange={(v: any) => setLocalSettings({ ...localSettings, geminiApiKey: v })} icon="fa-brands fa-google" onTest={() => testConnection('gemini')} status={connectionStatus['gemini']} inputClass={inputClass} />
                            <InputGroup label="OpenAI API Key" value={localSettings.openaiApiKey || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, openaiApiKey: v })} icon="fa-solid fa-bolt" onTest={() => testConnection('openai')} status={connectionStatus['openai']} inputClass={inputClass} />
                            <InputGroup label="Anthropic API Key" value={localSettings.anthropicApiKey || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, anthropicApiKey: v })} icon="fa-solid fa-brain" onTest={() => testConnection('anthropic')} status={connectionStatus['anthropic']} inputClass={inputClass} />
                            <InputGroup label="Proxy URL" value={localSettings.corsProxyUrl || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, corsProxyUrl: v })} icon="fa-solid fa-server" onTest={checkProxyStatus} status={proxyStatus === 'connected' ? 'success' : 'error'} inputClass={inputClass} />

                            <h4 className="font-bold opacity-70 mt-4 border-t border-inherit pt-4">New Frontier Models</h4>
                            <InputGroup label="ElevenLabs API Key" value={localSettings.elevenLabsApiKey || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, elevenLabsApiKey: v })} icon="fa-solid fa-microphone-lines" onTest={() => testConnection('elevenlabs')} status={connectionStatus['elevenlabs']} inputClass={inputClass} />
                            <InputGroup label="Hugging Face Token" value={localSettings.huggingFaceApiKey || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, huggingFaceApiKey: v })} icon="fa-solid fa-face-smile" onTest={() => testConnection('huggingface')} status={connectionStatus['huggingface']} inputClass={inputClass} />
                            <InputGroup label="xAI (Grok) API Key" value={localSettings.xaiApiKey || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, xaiApiKey: v })} icon="fa-solid fa-x" onTest={() => testConnection('xai')} status={connectionStatus['xai']} inputClass={inputClass} />
                            <InputGroup label="VirusTotal API Key" value={localSettings.virusTotalApiKey || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, virusTotalApiKey: v })} icon="fa-solid fa-shield-virus" onTest={() => testConnection('virustotal')} status={connectionStatus['virustotal']} inputClass={inputClass} />
                            <InputGroup label="Have I Been Pwned Key" value={localSettings.hibpApiKey || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, hibpApiKey: v })} icon="fa-solid fa-user-shield" onTest={() => testConnection('hibp')} status={connectionStatus['hibp']} inputClass={inputClass} />
                            <InputGroup label="Shodan API Key" value={localSettings.shodanApiKey || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, shodanApiKey: v })} icon="fa-solid fa-eye" onTest={() => testConnection('shodan')} status={connectionStatus['shodan']} inputClass={inputClass} />
                            <InputGroup label="IPInfo Token" value={localSettings.ipinfoToken || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, ipinfoToken: v })} icon="fa-solid fa-location-dot" onTest={() => testConnection('ipinfo')} status={connectionStatus['ipinfo']} inputClass={inputClass} />
                            <InputGroup label="NumVerify API Key" value={localSettings.numverifyApiKey || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, numverifyApiKey: v })} icon="fa-solid fa-phone" onTest={() => testConnection('numverify')} status={connectionStatus['numverify']} inputClass={inputClass} />
                            <InputGroup label="AbstractAPI Email Key" value={localSettings.abstractEmailApiKey || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, abstractEmailApiKey: v })} icon="fa-solid fa-envelope" onTest={() => testConnection('abstractemail')} status={connectionStatus['abstractemail']} inputClass={inputClass} />
                            <InputGroup label="AbstractAPI IP Key" value={localSettings.abstractIpApiKey || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, abstractIpApiKey: v })} icon="fa-solid fa-shield-halved" onTest={() => testConnection('abstractip')} status={connectionStatus['abstractip']} inputClass={inputClass} />

                            {/* Ollama Moved to dedicated tab */}
                        </div>
                    )}

                    {/* PARAMS TAB */}
                    {activeTab === 'params' && (
                        <div className="space-y-6">
                            <div className="p-4 border border-inherit rounded bg-opacity-10 bg-black">
                                <h3 className="font-bold mb-4">Global Model Parameters</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold mb-1">Temperature: {localSettings.modelParams.temperature}</label>
                                        <input type="range" min="0" max="2" step="0.1" value={localSettings.modelParams.temperature} onChange={e => setLocalSettings({ ...localSettings, modelParams: { ...localSettings.modelParams, temperature: parseFloat(e.target.value) } })} className="w-full accent-current" />
                                        <span className="text-[10px] opacity-60">Lower = More Precise, Higher = More Creative</span>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1">Top P: {localSettings.modelParams.topP}</label>
                                        <input type="range" min="0" max="1" step="0.05" value={localSettings.modelParams.topP} onChange={e => setLocalSettings({ ...localSettings, modelParams: { ...localSettings.modelParams, topP: parseFloat(e.target.value) } })} className="w-full accent-current" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1">Top K: {localSettings.modelParams.topK}</label>
                                        <input type="number" value={localSettings.modelParams.topK} onChange={e => setLocalSettings({ ...localSettings, modelParams: { ...localSettings.modelParams, topK: parseInt(e.target.value) } })} className={`w-full rounded px-3 py-2 text-sm ${inputClass}`} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1">Max Output Tokens</label>
                                        <input type="number" value={localSettings.modelParams.maxOutputTokens} onChange={e => setLocalSettings({ ...localSettings, modelParams: { ...localSettings.modelParams, maxOutputTokens: parseInt(e.target.value) } })} className={`w-full rounded px-3 py-2 text-sm ${inputClass}`} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1">System Prompt Override</label>
                                    <textarea
                                        value={localSettings.modelParams.systemPromptOverride || ''}
                                        onChange={e => setLocalSettings({ ...localSettings, modelParams: { ...localSettings.modelParams, systemPromptOverride: e.target.value } })}
                                        className={`w-full h-24 rounded px-3 py-2 text-sm resize-none ${inputClass}`}
                                        placeholder="Enter a system instruction that applies to ALL chats (e.g., 'Always answer in French')"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SEARCH TAB */}
                    {activeTab === 'ollama' && (
                        <div className="space-y-6">
                            <h3 className="font-bold mb-4 border-b border-inherit pb-2">Local Intelligence (Ollama)</h3>

                            {/* Connection Settings */}
                            <div className="p-4 border border-inherit rounded bg-opacity-5 mb-6">
                                <h4 className="font-bold text-sm mb-2">Connection Settings</h4>
                                <p className="text-xs opacity-70 mb-4">
                                    Configure how RangerPlex connects to Ollama. Use the proxy URL to avoid CORS issues.
                                </p>
                                <div className="space-y-4">
                                    <InputGroup
                                        label="Ollama Base URL"
                                        value={localSettings.ollamaBaseUrl}
                                        onChange={(v: any) => setLocalSettings({ ...localSettings, ollamaBaseUrl: v })}
                                        icon="fa-solid fa-server"
                                        onTest={() => testConnection('ollama')}
                                        status={connectionStatus['ollama']}
                                        inputClass={inputClass}
                                    />
                                    <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">
                                            <i className="fa-solid fa-microchip w-4"></i> Ollama Model ID
                                        </label>
                                        <input
                                            type="text"
                                            value={localSettings.ollamaModelId}
                                            onChange={e => setLocalSettings({ ...localSettings, ollamaModelId: e.target.value })}
                                            className={`w-full rounded px-4 py-2 outline-none ${inputClass}`}
                                            placeholder="e.g. deepseek-r1:14b, llama3, qwen2.5:72b"
                                        />
                                        <p className="text-[10px] opacity-60 mt-1">
                                            💡 <strong>Tip:</strong> Use <code className="px-1 py-0.5 bg-black/30 rounded">http://localhost:3010/api/ollama</code> as Base URL (proxy) instead of <code className="px-1 py-0.5 bg-black/30 rounded">http://localhost:11434</code> (direct) to avoid CORS errors.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border border-inherit rounded bg-opacity-5 mb-6">
                                <h4 className="font-bold text-sm mb-2">Loading Effects</h4>
                                <p className="text-xs opacity-70 mb-4">
                                    Choose the visual feedback when switching to a local model.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${localSettings.ollamaLoadingEffect === 'neural' ? 'border-teal-500 bg-teal-500/10' : 'border-inherit hover:bg-white/5'}`}>
                                        <input type="radio" name="ollamaEffect" checked={localSettings.ollamaLoadingEffect === 'neural'} onChange={() => setLocalSettings({ ...localSettings, ollamaLoadingEffect: 'neural' })} className="accent-teal-500" />
                                        <div>
                                            <div className="font-bold text-sm">Neural Link</div>
                                            <div className="text-[10px] opacity-60">Sleek top bar with status updates.</div>
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${localSettings.ollamaLoadingEffect === 'terminal' ? 'border-green-500 bg-green-500/10' : 'border-inherit hover:bg-white/5'}`}>
                                        <input type="radio" name="ollamaEffect" checked={localSettings.ollamaLoadingEffect === 'terminal'} onChange={() => setLocalSettings({ ...localSettings, ollamaLoadingEffect: 'terminal' })} className="accent-green-500" />
                                        <div>
                                            <div className="font-bold text-sm font-mono">Terminal Boot</div>
                                            <div className="text-[10px] opacity-60">Matrix-style boot sequence log.</div>
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${localSettings.ollamaLoadingEffect === 'pulse' ? 'border-purple-500 bg-purple-500/10' : 'border-inherit hover:bg-white/5'}`}>
                                        <input type="radio" name="ollamaEffect" checked={localSettings.ollamaLoadingEffect === 'pulse'} onChange={() => setLocalSettings({ ...localSettings, ollamaLoadingEffect: 'pulse' })} className="accent-purple-500" />
                                        <div>
                                            <div className="font-bold text-sm">Brain Pulse</div>
                                            <div className="text-[10px] opacity-60">Subtle button heartbeat animation.</div>
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${localSettings.ollamaLoadingEffect === 'none' ? 'border-gray-500 bg-gray-500/10' : 'border-inherit hover:bg-white/5'}`}>
                                        <input type="radio" name="ollamaEffect" checked={localSettings.ollamaLoadingEffect === 'none'} onChange={() => setLocalSettings({ ...localSettings, ollamaLoadingEffect: 'none' })} className="accent-gray-500" />
                                        <div>
                                            <div className="font-bold text-sm">None</div>
                                            <div className="text-[10px] opacity-60">No visual feedback.</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <h4 className="font-bold text-sm mb-2">Model Management</h4>
                                <p className="text-xs opacity-70 mb-4">Pull new models from the Ollama library.</p>
                                <div className="flex gap-2">
                                    <input className={`flex-1 rounded px-3 py-2 text-sm ${inputClass}`} placeholder="e.g. llama3, mistral, deepseek-coder" value={pullModelName} onChange={e => setPullModelName(e.target.value)} />
                                    <button onClick={handlePullModel} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold uppercase hover:bg-blue-500">Pull Model</button>
                                </div>
                                {pullStatus && (
                                    <div className="mt-3 p-3 bg-black border border-green-500/30 rounded font-mono text-xs relative overflow-hidden">
                                        {/* Matrix Rain Background Effect */}
                                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(34, 197, 94, .3) 25%, rgba(34, 197, 94, .3) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .3) 75%, rgba(34, 197, 94, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(34, 197, 94, .3) 25%, rgba(34, 197, 94, .3) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .3) 75%, rgba(34, 197, 94, .3) 76%, transparent 77%, transparent)', backgroundSize: '30px 30px' }}></div>

                                        <div className="flex justify-between mb-2 relative z-10">
                                            <span className="text-green-400 animate-pulse">&gt; {pullStatus.toUpperCase()}</span>
                                            <span className="text-green-500 font-bold">{pullProgress}%</span>
                                        </div>

                                        {/* Glitchy Progress Bar */}
                                        <div className="w-full bg-green-900/30 h-2 rounded-full overflow-hidden border border-green-500/30 relative z-10">
                                            <div
                                                className="bg-green-500 h-full transition-all duration-300 relative"
                                                style={{ width: `${pullProgress}%`, boxShadow: '0 0 10px #22c55e' }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                            </div>
                                        </div>

                                        {/* Decoding Text Effect */}
                                        <div className="mt-2 text-[10px] text-green-600/70 truncate relative z-10">
                                            Downloading manifest: {Array(10).fill(0).map(() => Math.random().toString(36).substring(7)).join('')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SEARCH TAB */}
                    {activeTab === 'search' && (
                        <div className="space-y-6">
                            <h3 className="font-bold mb-4 border-b border-inherit pb-2">Search Providers</h3>
                            <InputGroup label="Perplexity API Key" value={localSettings.perplexityApiKey || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, perplexityApiKey: v })} icon="fa-solid fa-question-circle" onTest={() => testConnection('perplexity')} status={connectionStatus['perplexity']} inputClass={inputClass} />
                            <InputGroup label="Brave Search API Key" value={localSettings.braveApiKey || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, braveApiKey: v })} icon="fa-brands fa-searchengin" onTest={() => testConnection('brave')} status={connectionStatus['brave']} inputClass={inputClass} />

                            <div className="mt-6 space-y-3">
                                <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                    <input type="checkbox" checked={localSettings.enableDuckDuckGo} onChange={e => setLocalSettings({ ...localSettings, enableDuckDuckGo: e.target.checked })} className="accent-teal-500 w-5 h-5" />
                                    Enable DuckDuckGo (Requires Proxy)
                                </label>
                                <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                    <input type="checkbox" checked={localSettings.enableWebSearchForLLMs} onChange={e => setLocalSettings({ ...localSettings, enableWebSearchForLLMs: e.target.checked })} className="accent-teal-500 w-5 h-5" />
                                    Enable Web Search for LLMs
                                </label>
                                <p className="text-xs opacity-60 ml-8">When enabled, LLMs will automatically search the web when the 🌐 WEB button is active</p>
                            </div>
                        </div>
                    )}

                    {/* CANVAS TAB */}
                    {activeTab === 'canvas' && (
                        <div className="space-y-6">
                            <h3 className="font-bold mb-4 border-b border-inherit pb-2">Canvas Settings</h3>
                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <h4 className="font-bold text-sm mb-2">Default Board Appearance</h4>
                                <p className="text-xs opacity-70 mb-4">Set the default background color for new canvas boards.</p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {['black', 'gray', 'white'].map((color) => (
                                        <label key={color} className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${localSettings.defaultCanvasColor === color ? 'border-teal-500 bg-teal-500/10' : 'border-inherit hover:bg-white/5'}`}>
                                            <input
                                                type="radio"
                                                name="defaultCanvasColor"
                                                checked={localSettings.defaultCanvasColor === color}
                                                onChange={() => setLocalSettings({ ...localSettings, defaultCanvasColor: color as any })}
                                                className="accent-teal-500"
                                            />
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full border border-inherit" style={{ backgroundColor: color === 'black' ? '#000' : color === 'gray' ? '#808080' : '#fff' }}></div>
                                                <div className="font-bold text-sm capitalize">{color}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* COUNCIL TAB */}
                    {activeTab === 'council' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-inherit pb-2">
                                <h3 className="font-bold">Council of Agents</h3>
                                <button onClick={addAgent} className="text-xs bg-blue-600 px-3 py-1 rounded text-white hover:bg-blue-500">+ Add Agent</button>
                            </div>

                            {localSettings.councilAgents.map((agent, idx) => (
                                <div key={idx} className="p-4 border border-inherit rounded bg-opacity-5 relative group">
                                    <button onClick={() => removeAgent(idx)} className="absolute top-2 right-2 text-red-500 opacity-50 hover:opacity-100"><i className="fa-solid fa-trash"></i></button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold opacity-70">Name</label>
                                            <input value={agent.name} onChange={e => handleAgentChange(idx, 'name', e.target.value)} className={`w-full text-sm rounded px-2 py-1 ${inputClass}`} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold opacity-70">Role</label>
                                            <input value={agent.role} onChange={e => handleAgentChange(idx, 'role', e.target.value)} className={`w-full text-sm rounded px-2 py-1 ${inputClass}`} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold opacity-70">Model</label>
                                            <select value={agent.model} onChange={e => handleAgentChange(idx, 'model', e.target.value)} className={`w-full text-sm rounded px-2 py-1 ${inputClass}`}>
                                                <option value={ModelType.FAST}>Default (Fast)</option>
                                                {localSettings.availableModels.gemini.map(m => <option key={m} value={m}>{m}</option>)}
                                                {localSettings.availableModels.openai.map(m => <option key={m} value={m}>{m}</option>)}
                                                {localSettings.availableModels.anthropic.map(m => <option key={m} value={m}>{m}</option>)}
                                                {localSettings.availableModels.ollama.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold opacity-70">Temp: {agent.temperature}</label>
                                            <input type="range" min="0" max="2" step="0.1" value={agent.temperature} onChange={e => handleAgentChange(idx, 'temperature', parseFloat(e.target.value))} className="w-full accent-current" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold opacity-70">System Instruction</label>
                                        <textarea value={agent.systemInstruction} onChange={e => handleAgentChange(idx, 'systemInstruction', e.target.value)} className={`w-full text-xs h-16 rounded px-2 py-1 resize-none ${inputClass}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* PROMPTS TAB */}
                    {activeTab === 'prompts' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b border-inherit pb-2">
                                <h3 className="font-bold">Slash Commands (Prompt Library)</h3>
                                <div className="flex items-center gap-2">
                                    <input
                                        value={promptSearch}
                                        onChange={(e) => setPromptSearch(e.target.value)}
                                        placeholder="Filter prompts..."
                                        className={`text-xs px-2 py-1 rounded border ${inputClass}`}
                                    />
                                    <button onClick={addPrompt} className="text-xs bg-green-600 px-3 py-1 rounded text-white hover:bg-green-500">+ Add Prompt</button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={exportPrompts} className="text-xs bg-blue-600 px-3 py-1 rounded text-white hover:bg-blue-500">Export (copy JSON)</button>
                                <button onClick={importPrompts} className="text-xs bg-amber-600 px-3 py-1 rounded text-white hover:bg-amber-500">Import (from box)</button>
                                <button onClick={resetPromptsToDefaults} className="text-xs bg-gray-700 px-3 py-1 rounded text-white hover:bg-gray-600">Reset to Defaults (20)</button>
                                <button onClick={appendMissingDefaults} className="text-xs bg-purple-600 px-3 py-1 rounded text-white hover:bg-purple-500">Add Missing Defaults</button>
                                {promptMessage && <span className="text-xs opacity-70">{promptMessage}</span>}
                            </div>
                            <textarea
                                value={promptImportText}
                                onChange={(e) => setPromptImportText(e.target.value)}
                                placeholder="Paste prompt JSON here (array of { trigger, text, id? })"
                                className={`w-full min-h-[120px] text-xs rounded px-3 py-2 ${inputClass}`}
                            />
                            <div className="space-y-3">
                                {localSettings.savedPrompts
                                    .filter(p => p.trigger.toLowerCase().includes(promptSearch.toLowerCase()) || p.text.toLowerCase().includes(promptSearch.toLowerCase()))
                                    .map((p, idx) => (
                                        <div key={idx} className="flex gap-2 items-start">
                                            <div className="w-1/4">
                                                <div className="relative">
                                                    <span className="absolute left-2 top-2 text-xs opacity-50">/</span>
                                                    <input value={p.trigger} onChange={e => updatePrompt(idx, 'trigger', e.target.value)} className={`w-full pl-4 pr-2 py-2 text-sm rounded ${inputClass}`} placeholder="trigger" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <input value={p.text} onChange={e => updatePrompt(idx, 'text', e.target.value)} className={`w-full px-3 py-2 text-sm rounded ${inputClass}`} placeholder="Prompt text..." />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => movePrompt(idx, 'up')} className="p-2 text-xs text-gray-400 hover:text-white" title="Move up">
                                                    <i className="fa-solid fa-chevron-up"></i>
                                                </button>
                                                <button onClick={() => movePrompt(idx, 'down')} className="p-2 text-xs text-gray-400 hover:text-white" title="Move down">
                                                    <i className="fa-solid fa-chevron-down"></i>
                                                </button>
                                                <button onClick={() => removePrompt(idx)} className="p-2 text-red-500 hover:text-red-400" title="Remove">
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <h3 className="font-bold mb-4 border-b border-inherit pb-2">Security & Prank Mode</h3>

                            <div className="p-4 border border-inherit rounded bg-opacity-5 mb-6">
                                <h4 className="font-bold text-sm mb-2">Login Screen Prank</h4>
                                <p className="text-xs opacity-70 mb-4">
                                    When an unauthorized user tries to login, show a fake "FBI Seized" screen.
                                    Choose how they can escape back to the login screen.
                                </p>

                                <label className="block text-xs font-bold mb-1 opacity-80">Escape Mechanism</label>
                                <select
                                    value={localSettings.securityMode}
                                    onChange={(e) => setLocalSettings({ ...localSettings, securityMode: e.target.value as any })}
                                    className={`w-full rounded px-3 py-2 outline-none ${inputClass}`}
                                >
                                    <option value="none">None (Disabled)</option>
                                    <option value="bribe">The Bribe (Pay Fine Button)</option>
                                    <option value="hacker">The Hacker (Type 'UNLOCK')</option>
                                    <option value="time">Time Served (Wait 10s)</option>
                                    <option value="panic">Panic Click (Click Logo 5x)</option>
                                    <option value="escape">Escape Key (Press ESC)</option>
                                </select>
                            </div>

                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <h4 className="font-bold text-sm mb-2">Workstation Security</h4>
                                <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localSettings.lockScreenEnabled}
                                        onChange={e => setLocalSettings({ ...localSettings, lockScreenEnabled: e.target.checked })}
                                        className="accent-teal-500 w-5 h-5"
                                    />
                                    Enable Lock Screen Button (Beside Logout)
                                </label>
                                <p className="text-xs opacity-60 mt-2 ml-8">
                                    Adds a lock icon to the sidebar. Clicking it instantly locks the app and requires login to re-enter.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* RADIO TAB */}
                    {activeTab === 'radio' && (
                        <div className="space-y-6">
                            <h3 className="font-bold mb-4 border-b border-inherit pb-2">📻 Ranger Radio</h3>

                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <h4 className="font-bold text-sm mb-2">Radio Player</h4>
                                <p className="text-xs opacity-70 mb-4">
                                    Add ambient background music to your workspace. Choose from <strong>50+ SomaFM radio stations</strong> organized by genre: Ambient, Electronic, Lounge, Rock, Metal, Jazz, World, Reggae, Holiday, and Specials.
                                </p>

                                {/* Enable Radio Toggle */}
                                <label className="flex items-center gap-3 text-sm font-bold cursor-pointer mb-4">
                                    <input
                                        type="checkbox"
                                        checked={localSettings.radioEnabled}
                                        onChange={e => setLocalSettings({ ...localSettings, radioEnabled: e.target.checked })}
                                        className="accent-teal-500 w-5 h-5"
                                    />
                                    Enable Radio Player
                                </label>



                                <p className="text-xs opacity-60 ml-8">
                                    Note: Auto-play may be blocked by browser. Click "Play" manually if needed.
                                </p>
                            </div>

                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <h4 className="font-bold text-sm mb-2">Default Volume</h4>
                                <div className="flex items-center gap-3">
                                    <i className="fa-solid fa-volume-low text-sm opacity-60"></i>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={localSettings.radioVolume * 100}
                                        onChange={(e) => setLocalSettings({ ...localSettings, radioVolume: parseInt(e.target.value) / 100 })}
                                        className="flex-1 h-2 rounded-lg appearance-none bg-gray-300 dark:bg-zinc-700 accent-teal-500"
                                        disabled={!localSettings.radioEnabled}
                                    />
                                    <i className="fa-solid fa-volume-high text-sm opacity-60"></i>
                                    <span className="text-xs font-mono w-10 text-right">{Math.round(localSettings.radioVolume * 100)}%</span>
                                </div>
                            </div>

                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <h4 className="font-bold text-sm mb-2">Station Categories (50+ Channels)</h4>
                                <p className="text-xs opacity-70 mb-3">
                                    Complete SomaFM collection organized by genre:
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs opacity-80">
                                    <div>
                                        <strong>🎧 Ambient (8)</strong>
                                        <ul className="ml-4 mt-1 space-y-0.5 opacity-70">
                                            <li>• Groove Salad</li>
                                            <li>• Drone Zone</li>
                                            <li>• Deep Space One</li>
                                            <li>• Space Station Soma</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <strong>💻 Electronic (9)</strong>
                                        <ul className="ml-4 mt-1 space-y-0.5 opacity-70">
                                            <li>• DEF CON Radio</li>
                                            <li>• Beat Blender</li>
                                            <li>• The Trip</li>
                                            <li>• Vaporwaves</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <strong>🎷 Lounge (4)</strong>
                                        <ul className="ml-4 mt-1 space-y-0.5 opacity-70">
                                            <li>• Lush</li>
                                            <li>• Secret Agent</li>
                                            <li>• Illinois Street Lounge</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <strong>🎸 Rock (5)</strong>
                                        <ul className="ml-4 mt-1 space-y-0.5 opacity-70">
                                            <li>• Indie Pop Rocks!</li>
                                            <li>• Underground 80s</li>
                                            <li>• Left Coast 70s</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <strong>🤘 Metal (2)</strong>
                                        <ul className="ml-4 mt-1 space-y-0.5 opacity-70">
                                            <li>• Metal Detector</li>
                                            <li>• Doomed</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <strong>🎺 Jazz/Soul (2)</strong>
                                        <ul className="ml-4 mt-1 space-y-0.5 opacity-70">
                                            <li>• Sonic Universe</li>
                                            <li>• Seven Inch Soul</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <strong>🌍 World (3)</strong>
                                        <ul className="ml-4 mt-1 space-y-0.5 opacity-70">
                                            <li>• ThistleRadio (Celtic)</li>
                                            <li>• Tiki Time</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <strong>🎄 Holiday (5)</strong>
                                        <ul className="ml-4 mt-1 space-y-0.5 opacity-70">
                                            <li>• Christmas Lounge</li>
                                            <li>• Christmas Rocks!</li>
                                        </ul>
                                    </div>
                                </div>
                                <p className="text-xs opacity-60 mt-3">
                                    <i className="fa-solid fa-info-circle mr-1"></i>
                                    All streams are legal and free. Powered by SomaFM - commercial-free radio since 2000.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* TAMAGOTCHI TAB */}
                    {activeTab === 'tamagotchi' && (
                        <div className="space-y-6">
                            <h3 className="font-bold mb-4 border-b border-inherit pb-2">🐾 Ranger Pet</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold mb-1 opacity-80">Pet Avatar</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-inherit bg-zinc-800 flex items-center justify-center">
                                            {localSettings.petAvatar ? <img src={localSettings.petAvatar} className="w-full h-full object-cover" /> : <i className="fa-solid fa-paw text-zinc-500"></i>}
                                        </div>
                                        <label className={`px-3 py-2 text-xs font-bold rounded cursor-pointer ${inputClass} hover:opacity-80`}>
                                            Upload
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarUpload(e, 'pet')} />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 opacity-80">Pet Name</label>
                                    <input
                                        type="text"
                                        value={localSettings.petName}
                                        onChange={e => setLocalSettings({ ...localSettings, petName: e.target.value })}
                                        className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 opacity-80">Sound Volume: {Math.round(localSettings.petVolume * 100)}%</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={localSettings.petVolume}
                                        onChange={e => setLocalSettings({ ...localSettings, petVolume: parseFloat(e.target.value) })}
                                        className="w-full accent-current"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 opacity-80">Happiness Decay Rate</label>
                                    <input
                                        type="number"
                                        value={localSettings.happinessDecayRate}
                                        onChange={e => setLocalSettings({ ...localSettings, happinessDecayRate: parseInt(e.target.value) })}
                                        className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                    />
                                    <span className="text-[10px] opacity-60">Points deducted per 5 seconds.</span>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 opacity-80">Hunger Increase Rate</label>
                                    <input
                                        type="number"
                                        value={localSettings.hungerIncreaseRate}
                                        onChange={e => setLocalSettings({ ...localSettings, hungerIncreaseRate: parseInt(e.target.value) })}
                                        className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                    />
                                    <span className="text-[10px] opacity-60">Points added per 5 seconds.</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DATA & BACKUP TAB */}
                    {activeTab === 'data' && (
                        <div className="space-y-6">
                            <h3 className="font-bold mb-4 border-b border-inherit pb-2">Data & Tools</h3>

                            {/* Quick Tools Section */}
                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                    <i className="fa-solid fa-tools"></i>
                                    Quick Tools
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                    {onOpenTraining && (
                                        <button
                                            onClick={() => {
                                                onClose();
                                                onOpenTraining();
                                            }}
                                            className="px-4 py-2 rounded-full font-bold text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow hover:shadow-lg transition-all"
                                        >
                                            <i className="fa-solid fa-dumbbell mr-2"></i>
                                            Model Training
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            onClose();
                                            onOpenBackupManager?.();
                                        }}
                                        className="px-4 py-2 rounded-full font-bold text-sm bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow hover:shadow-lg transition-all"
                                    >
                                        <i className="fa-solid fa-clock-rotate-left mr-2"></i>
                                        Backup & Restore
                                    </button>
                                </div>
                                <p className="text-xs opacity-70 mt-2">Access Model Training or launch the dedicated Backup/Restore UI (includes preview, merge/replace, and progress).</p>
                            </div>

                            {/* Export & Purge Section */}
                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                    <i className="fa-solid fa-file-export"></i>
                                    Export & Purge
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                    {currentId && sessions?.find((s: any) => s.id === currentId) && onExportChat && (
                                        <button
                                            onClick={() => {
                                                const session = sessions.find((s: any) => s.id === currentId);
                                                if (session) {
                                                    onExportChat(session);
                                                }
                                            }}
                                            className="px-4 py-2 rounded-full font-bold text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow hover:shadow-lg transition-all"
                                        >
                                            <i className="fa-solid fa-file-export mr-2"></i>
                                            Export Current Chat
                                        </button>
                                    )}
                                    {onExportAll && (
                                        <button
                                            onClick={onExportAll}
                                            className="px-4 py-2 rounded-full font-bold text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow hover:shadow-lg transition-all"
                                        >
                                            <i className="fa-solid fa-download mr-2"></i>
                                            Export All Data
                                        </button>
                                    )}
                                    {onPurgeAll && (
                                        <button
                                            onClick={() => {
                                                if (confirm('⚠️ This will delete ALL data (chats, settings, canvas boards, Win95 states, study sessions). Continue?')) {
                                                    onPurgeAll();
                                                    onClose();
                                                }
                                            }}
                                            className="px-4 py-2 rounded-full font-bold text-sm bg-gradient-to-r from-red-500 to-orange-500 text-white shadow hover:shadow-lg transition-all"
                                        >
                                            <i className="fa-solid fa-trash-can mr-2"></i>
                                            Purge All Data
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs opacity-70 mt-2">Export conversations as markdown or backup all data. Purge permanently deletes all stored data.</p>
                            </div>

                            {/* Save status notifications */}
                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <div className="flex flex-col gap-3">
                                    <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={localSettings.saveStatusNotifications}
                                            onChange={e => setLocalSettings({ ...localSettings, saveStatusNotifications: e.target.checked })}
                                            className="accent-teal-500 w-5 h-5"
                                        />
                                        Show save status notifications
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold mb-1">Display time (seconds)</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={60}
                                                value={Math.round(localSettings.saveStatusDurationMs / 1000)}
                                                onChange={e => {
                                                    const seconds = Math.max(1, Math.min(60, parseInt(e.target.value) || 1));
                                                    setLocalSettings({ ...localSettings, saveStatusDurationMs: seconds * 1000 });
                                                }}
                                                className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                                disabled={!localSettings.saveStatusNotifications}
                                            />
                                            <p className="text-[10px] opacity-60 mt-1">How long “All changes saved” stays visible.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cloud Sync Toggle */}
                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-sm flex items-center gap-2">
                                            <i className="fa-solid fa-cloud"></i>
                                            Enable Cloud Sync
                                        </h4>
                                        <p className="text-xs opacity-60 mt-1">Sync data to localhost server (requires sync_server.js running)</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newSettings = { ...localSettings, enableCloudSync: !localSettings.enableCloudSync };
                                            setLocalSettings(newSettings);
                                            // Save immediately - Cloud Sync is critical!
                                            onSave(newSettings);
                                        }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localSettings.enableCloudSync ? 'bg-teal-600' : 'bg-gray-600'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSettings.enableCloudSync ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Sync Status */}
                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                    <i className="fa-solid fa-sync"></i>
                                    Sync Status
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span>Server Connection:</span>
                                        <span className={`font-bold ${syncStatus.connected ? 'text-green-500' : 'text-red-500'}`}>
                                            {syncStatus.connected ? '● Connected' : '○ Disconnected'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Queued Messages:</span>
                                        <span className="font-mono">{syncStatus.queuedMessages}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Last Sync:</span>
                                        <span className="text-xs opacity-70">
                                            {storageStats.lastBackup > 0 ? new Date(storageStats.lastBackup).toLocaleString() : 'Never'}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        onClick={async () => {
                                            const status = syncService.getConnectionStatus();
                                            setSyncStatus(status);
                                        }}
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500"
                                    >
                                        Refresh Status
                                    </button>
                                    <button
                                        onClick={() => {
                                            syncService.disconnect();
                                            setTimeout(() => syncService.connect(), 100);
                                        }}
                                        className="px-3 py-1.5 bg-gray-600 text-white rounded text-xs font-bold hover:bg-gray-500"
                                    >
                                        Reconnect
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setSyncInProgress(true);
                                            setSyncProgress(0);
                                            setSyncMessage('Starting sync...');

                                            try {
                                                // Get all chats from IndexedDB
                                                setSyncMessage('Loading chats...');
                                                setSyncProgress(10);
                                                const chats = await dbService.getAllChats();

                                                // Get settings
                                                setSyncMessage('Loading settings...');
                                                setSyncProgress(20);
                                                const allSettings = await dbService.getAllSettings();

                                                // Sync chats
                                                if (chats.length > 0) {
                                                    for (let i = 0; i < chats.length; i++) {
                                                        setSyncMessage(`Syncing chat ${i + 1}/${chats.length}...`);
                                                        setSyncProgress(30 + (i / chats.length) * 40);
                                                        await syncService.syncChat(chats[i]);
                                                    }
                                                }

                                                // Sync settings
                                                setSyncMessage('Syncing settings...');
                                                setSyncProgress(75);
                                                for (const [key, value] of Object.entries(allSettings)) {
                                                    await syncService.syncSettings(key, value);
                                                }

                                                setSyncMessage('Sync complete!');
                                                setSyncProgress(100);

                                                // Refresh status and update last sync time
                                                const status = syncService.getConnectionStatus();
                                                setSyncStatus(status);
                                                const now = Date.now();
                                                await saveLastSyncTime(now);

                                                // Reload storage stats to show updated sizes
                                                await loadStorageStats();

                                                setTimeout(() => {
                                                    setSyncInProgress(false);
                                                    setSyncMessage(null);
                                                    setSyncProgress(0);
                                                }, 2000);
                                            } catch (error) {
                                                console.error('Sync error:', error);
                                                setSyncMessage('Sync failed!');
                                                setTimeout(() => {
                                                    setSyncInProgress(false);
                                                    setSyncMessage(null);
                                                    setSyncProgress(0);
                                                }, 2000);
                                            }
                                        }}
                                        disabled={syncInProgress}
                                        className="px-3 py-1.5 bg-teal-600 text-white rounded text-xs font-bold hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <i className={`fa-solid ${syncInProgress ? 'fa-spin fa-sync' : 'fa-cloud-upload-alt'}`}></i>
                                        {syncInProgress ? 'Syncing...' : 'Sync Now'}
                                    </button>
                                </div>

                                {/* Sync Progress Bar */}
                                {syncInProgress && (
                                    <div className="mt-4 p-3 bg-black/30 rounded">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-mono">{syncMessage}</span>
                                            <span className="text-xs font-bold text-teal-400">{syncProgress.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300 ease-out"
                                                style={{ width: `${syncProgress}%` }}
                                            >
                                                <div className="h-full w-full bg-white/20 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Storage Stats */}
                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                    <i className="fa-solid fa-database"></i>
                                    Storage Layers
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-2 bg-black/20 rounded">
                                        <div>
                                            <div className="font-bold text-xs">IndexedDB (Browser)</div>
                                            <div className="text-[10px] opacity-60">Fast local storage</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-green-500 font-bold">✓ Active</div>
                                            <div className="text-[10px] opacity-60">{(storageStats.browser / 1024).toFixed(1)} KB</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-black/20 rounded">
                                        <div>
                                            <div className="font-bold text-xs">SQLite (Server)</div>
                                            <div className="text-[10px] opacity-60">Persistent database</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold ${syncStatus.connected ? 'text-green-500' : 'text-gray-500'}`}>
                                                {syncStatus.connected ? '✓ Synced' : '○ Offline'}
                                            </div>
                                            <div className="text-[10px] opacity-60">{(storageStats.server / 1024).toFixed(1)} KB</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-black/20 rounded">
                                        <div>
                                            <div className="font-bold text-xs">File Backups</div>
                                            <div className="text-[10px] opacity-60">./backups/*.json</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-blue-500 font-bold">Auto-Export</div>
                                            <div className="text-[10px] opacity-60">Every 5 min</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Auto-Backup Settings */}
                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                    <i className="fa-solid fa-file-archive"></i>
                                    Auto-Backup Settings
                                </h4>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={localSettings.autoBackupEnabled}
                                            onChange={e => setLocalSettings({ ...localSettings, autoBackupEnabled: e.target.checked })}
                                            className="accent-teal-500 w-5 h-5"
                                        />
                                        Enable Auto-Backup
                                    </label>
                                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!localSettings.autoBackupEnabled ? 'opacity-50' : ''}`}>
                                        <div>
                                            <label className="block text-xs font-bold mb-1">Backup Interval (minutes)</label>
                                            <input
                                                type="number"
                                                value={localSettings.autoBackupInterval}
                                                onChange={e => setLocalSettings({ ...localSettings, autoBackupInterval: parseInt(e.target.value) })}
                                                className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                                disabled={!localSettings.autoBackupEnabled}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1">Backup Location</label>
                                            <input
                                                type="text"
                                                value={localSettings.autoBackupLocation}
                                                onChange={e => setLocalSettings({ ...localSettings, autoBackupLocation: e.target.value })}
                                                className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                                disabled={!localSettings.autoBackupEnabled}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Data Management */}
                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                    <i className="fa-solid fa-tools"></i>
                                    Data Management
                                </h4>
                                <div className="mb-4 p-4 bg-teal-500/10 border border-teal-500/30 rounded flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-sm">Backup & Restore Manager</div>
                                        <div className="text-xs opacity-70">Full system backup, export, and restore tools.</div>
                                    </div>
                                    <button
                                        onClick={onOpenBackupManager}
                                        className="px-4 py-2 bg-teal-600 text-white rounded font-bold text-xs uppercase hover:bg-teal-500 shadow-lg flex items-center gap-2"
                                    >
                                        <i className="fa-solid fa-box-archive"></i>
                                        Open Manager
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-80">
                                    <button
                                        onClick={async () => {
                                            if (!confirm('⚠️ Clear browser cache? (Server data will remain safe)')) return;
                                            await dbService.clearChats();
                                            await dbService.clearSettings();
                                            alert('✅ Browser cache cleared!');
                                        }}
                                        className="px-4 py-3 bg-yellow-600 text-white rounded font-bold text-sm hover:bg-yellow-500 flex items-center justify-center gap-2"
                                    >
                                        <i className="fa-solid fa-broom"></i>
                                        Clear Browser Cache
                                    </button>

                                    <button
                                        onClick={async () => {
                                            if (!confirm('⚠️ DANGER: Wipe server database? This cannot be undone!')) return;
                                            if (!confirm('⚠️ FINAL WARNING: All server data will be permanently deleted!')) return;
                                            try {
                                                await syncService.clearAllData();
                                                await dbService.clearChats();
                                                await dbService.clearSettings();
                                                alert('✅ All data cleared!');
                                                window.location.reload();
                                            } catch (error) {
                                                alert('❌ Clear failed: ' + error);
                                            }
                                        }}
                                        className="px-4 py-3 bg-red-600 text-white rounded font-bold text-sm hover:bg-red-500 flex items-center justify-center gap-2"
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                        Wipe All Data
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABOUT & SUPPORT TAB */}
                    {activeTab === 'about' && (
                        <div className="space-y-6">
                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <h4 className="font-bold text-lg flex items-center gap-2">
                                    <i className="fa-solid fa-hand-holding-heart"></i>
                                    Support the Mission
                                </h4>
                                <p className="text-sm opacity-80 mt-2">
                                    RangerPlex is built to help turn disabilities into superpowers. If you’d like to support ongoing development, you can donate or contribute.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 items-center">
                                    <div className="space-y-2">
                                        <h5 className="text-xs font-bold uppercase tracking-wide opacity-70">Buy Me a Coffee</h5>
                                        <a
                                            href="https://buymeacoffee.com/davidtkeane"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-500 hover:text-teal-300"
                                        >
                                            <i className="fa-solid fa-mug-hot"></i>
                                            buymeacoffee.com/davidtkeane
                                        </a>
                                    </div>
                                    <div className="space-y-2">
                                        <h5 className="text-xs font-bold uppercase tracking-wide opacity-70">Bitcoin (QR)</h5>
                                        <div className="w-32 h-32 border border-inherit rounded overflow-hidden bg-white flex items-center justify-center p-2">
                                            <img src="/image/bitcoin.png" alt="Bitcoin donation QR" className="w-full h-full object-contain" />
                                        </div>
                                        <p className="text-[11px] opacity-70">Scan to donate via Bitcoin.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <h5 className="text-xs font-bold uppercase tracking-wide opacity-70">Contribute on GitHub</h5>
                                        <p className="text-sm opacity-80">
                                            Star the repo, file issues, or submit PRs to improve RangerPlex.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HELP TAB */}
                    {activeTab === 'help' && (
                        <div className="space-y-6 prose prose-invert max-w-none">
                            <h3 className="font-bold border-b border-inherit pb-2">System & Help</h3>

                            {/* Update Checker */}
                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                    <i className="fa-brands fa-github"></i>
                                    System Updates
                                </h4>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs opacity-80">
                                        Check for the latest version of RangerPlex AI from GitHub.
                                    </div>
                                    <button
                                        onClick={handleCheckUpdate}
                                        disabled={checkingUpdate}
                                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-bold flex items-center gap-2"
                                    >
                                        {checkingUpdate ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-rotate"></i>}
                                        Check for Updates
                                    </button>
                                </div>
                                {updateStatus && (
                                    <div className={`mt-3 p-3 rounded text-xs border ${updateStatus.error ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                                        {updateStatus.error ? (
                                            <div className="text-red-400">Error: {updateStatus.error}</div>
                                        ) : (
                                            <div>
                                                <div className="font-bold text-green-400 mb-1">
                                                    <i className="fa-solid fa-rocket mr-2"></i>
                                                    Latest Version: {updateStatus.latestVersion} ({updateStatus.latestDate})
                                                </div>
                                                <div className="opacity-80 mb-2">"{updateStatus.latestMessage}"</div>
                                                <a
                                                    href={updateStatus.htmlUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:underline flex items-center gap-1"
                                                >
                                                    View on GitHub <i className="fa-solid fa-external-link-alt text-[10px]"></i>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border border-inherit rounded bg-opacity-5">
                                <h4 className="font-bold text-sm mb-2">Getting Started</h4>
                                <p className="text-xs opacity-80 mb-4">RangerPlex AI is a modular research assistant. Connect your API keys in the 'Providers' tab to unlock models.</p>

                                <h4 className="font-bold text-sm mb-2">Proxy Setup (Fixing CORS)</h4>
                                <p className="text-xs opacity-80 mb-2">To use Anthropic or DuckDuckGo, you must run the local proxy:</p>
                                <pre className="bg-black/30 p-2 rounded text-xs mb-4">
                                    cd your-folder<br />
                                    node proxy_server.js
                                </pre>

                                <h4 className="font-bold text-sm mb-2">Keyboard Shortcuts</h4>
                                <ul className="text-xs opacity-80 list-disc pl-4">
                                    <li><strong>/</strong> : Open Prompt Library in chat</li>
                                    <li><strong>Cmd/Ctrl + Enter</strong> : Send Message</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-inherit flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 opacity-70 hover:opacity-100 font-bold uppercase text-xs">Cancel</button>
                    <button onClick={handleSave} className={`px-6 py-2 rounded font-bold uppercase text-xs shadow-lg ${localSettings.theme === 'tron' ? 'bg-tron-cyan text-black hover:bg-white' : 'bg-teal-600 text-white hover:bg-teal-500'}`}>Save Config</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;

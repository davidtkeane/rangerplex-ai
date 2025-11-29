
import React, { useState, useEffect } from 'react';
import { AppSettings, AgentConfig, ModelType, SavedPrompt, VoiceConfig, Currency, DEFAULT_SAVED_PROMPTS } from '../types';
import { checkOllamaConnection, pullOllamaModel } from '../services/ollamaService';
import { checkLMStudioConnection } from '../services/lmstudioService';
import { fetchGeminiModels, fetchOllamaModels, fetchOpenAIModels, fetchLMStudioModels } from '../services/modelRegistry';
import { processAvatarImage } from '../services/imageProcessing';
import { fetchElevenLabsVoices, Voice } from '../services/elevenLabsService';
import { dbService } from '../services/dbService';
import { canvasDbService } from '../services/canvasDbService';
import { syncService } from '../services/syncService';
import { updateService, UpdateInfo } from '../services/updateService';
import pkg from '../package.json';
import AliasManager from './AliasManager';

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
    const [activeTab, setActiveTab] = useState<'general' | 'media' | 'params' | 'providers' | 'ollama' | 'lmstudio' | 'search' | 'council' | 'prompts' | 'security' | 'canvas' | 'radio' | 'tamagotchi' | 'rangerblock' | 'editor' | 'data' | 'memory' | 'weather' | 'about' | 'github'>('general');
    const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: 'loading' | 'success' | 'error' | 'idle' }>({});

    // Window mode state (normal, fullscreen, minimized)
    const [windowMode, setWindowMode] = useState<'normal' | 'fullscreen' | 'minimized'>(() => {
        const saved = localStorage.getItem('settings_window_mode');
        return (saved === 'fullscreen' || saved === 'minimized' || saved === 'normal') ? saved : 'normal';
    });

    // RangerBlock state
    const [blockchainStatus, setBlockchainStatus] = useState<any>(null);
    const [blockchainConfig, setBlockchainConfig] = useState<any>({
        enabled: false,
        networkMode: 'local',
        port: 5000,
        relayUrl: '',
        autoStart: true
    });
    const [loadingModels, setLoadingModels] = useState(false);
    const [promptSearch, setPromptSearch] = useState('');
    const [promptImportText, setPromptImportText] = useState('');
    const [showAliasManager, setShowAliasManager] = useState(false);

    // Update Checker State
    const [updateStatus, setUpdateStatus] = useState<UpdateInfo | null>(null);
    const [checkingUpdate, setCheckingUpdate] = useState(false);
    const [installingUpdate, setInstallingUpdate] = useState(false);
    const [updateResult, setUpdateResult] = useState<{ success: boolean; message: string; needsRestart?: boolean } | null>(null);
    const [reloadingServer, setReloadingServer] = useState(false);
    const [reloadResult, setReloadResult] = useState<{ success: boolean; message: string } | null>(null);
    const [stoppingServer, setStoppingServer] = useState(false);
    const [stopResult, setStopResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleCheckUpdate = async () => {
        setCheckingUpdate(true);
        setUpdateResult(null);
        const info = await updateService.checkForUpdates(pkg.version);
        setUpdateStatus(info);
        setCheckingUpdate(false);
    };

    const handleInstallUpdate = async () => {
        setInstallingUpdate(true);
        setUpdateResult(null);
        try {
            const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';
            const response = await fetch(`${proxyUrl}/api/system/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (result.success) {
                setUpdateResult({
                    success: true,
                    message: result.message,
                    needsRestart: result.needsRestart
                });

                // Refresh update status after successful update
                if (!result.needsRestart) {
                    setTimeout(() => handleCheckUpdate(), 2000);
                }
            } else {
                setUpdateResult({
                    success: false,
                    message: result.error || 'Update failed'
                });
            }
        } catch (error) {
            setUpdateResult({
                success: false,
                message: error instanceof Error ? error.message : 'Update failed'
            });
        } finally {
            setInstallingUpdate(false);
        }
    };

    const handleReloadServer = async () => {
        setReloadingServer(true);
        setReloadResult(null);
        try {
            const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';
            const response = await fetch(`${proxyUrl}/api/system/reload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (result.success) {
                setReloadResult({
                    success: true,
                    message: result.message
                });
            } else {
                setReloadResult({
                    success: false,
                    message: result.error || result.message || 'Reload failed'
                });
            }
        } catch (error) {
            setReloadResult({
                success: false,
                message: error instanceof Error ? error.message : 'Reload failed'
            });
        } finally {
            setReloadingServer(false);
        }
    };

    const handleStopServer = async () => {
        setStoppingServer(true);
        setStopResult(null);
        try {
            const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';
            const response = await fetch(`${proxyUrl}/api/system/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (result.success) {
                setStopResult({
                    success: true,
                    message: result.message
                });
            } else {
                setStopResult({
                    success: false,
                    message: result.error || result.message || 'Stop failed'
                });
            }
        } catch (error) {
            setStopResult({
                success: false,
                message: error instanceof Error ? error.message : 'Stop failed'
            });
        } finally {
            setStoppingServer(false);
        }
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

            // Load sync status and storage stats if on Data or Memory tab
            if (activeTab === 'data' || activeTab === 'memory') {
                const status = syncService.getConnectionStatus();
                setSyncStatus(status);
                loadStorageStats();
                loadLastSyncTime();
            }

            // Auto-fetch LM Studio models when opening LM Studio tab
            if (activeTab === 'lmstudio' && localSettings.lmstudioBaseUrl) {
                fetchLMStudioModelsOnly();
            }

            // Load blockchain status when opening RangerBlock tab
            if (activeTab === 'rangerblock') {
                loadBlockchainStatus();
                loadBlockchainConfig();
            }
        }
    }, [settings, isOpen, activeTab]);

    // Load blockchain status
    const loadBlockchainStatus = async () => {
        try {
            const proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3010';
            const response = await fetch(`${proxyUrl}/api/rangerblock/status`);
            const data = await response.json();
            if (data.success) {
                setBlockchainStatus(data);
            }
        } catch (error) {
            console.error('Failed to load blockchain status:', error);
        }
    };

    // Load blockchain config
    const loadBlockchainConfig = async () => {
        try {
            const proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3010';
            const response = await fetch(`${proxyUrl}/api/rangerblock/config`);
            const data = await response.json();
            if (data.success) {
                setBlockchainConfig(data.config);
            }
        } catch (error) {
            console.error('Failed to load blockchain config:', error);
        }
    };

    // Save blockchain config
    const saveBlockchainConfig = async () => {
        try {
            const proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3010';
            const response = await fetch(`${proxyUrl}/api/rangerblock/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(blockchainConfig)
            });
            const data = await response.json();
            if (data.success) {
                alert('✅ RangerBlock settings saved!');
                loadBlockchainStatus();
            }
        } catch (error) {
            console.error('Failed to save blockchain config:', error);
            alert('❌ Failed to save settings');
        }
    };

    // Start blockchain node
    const startBlockchain = async () => {
        try {
            const proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3010';
            const response = await fetch(`${proxyUrl}/api/rangerblock/start`, {
                method: 'POST'
            });
            const data = await response.json();
            if (data.success) {
                alert(`✅ RangerBlock started: ${data.nodeName}`);
                loadBlockchainStatus();
            } else {
                alert(`❌ ${data.message}`);
            }
        } catch (error) {
            console.error('Failed to start blockchain:', error);
            alert('❌ Failed to start blockchain');
        }
    };

    // Stop blockchain node
    const stopBlockchain = async () => {
        try {
            const proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3010';
            const response = await fetch(`${proxyUrl}/api/rangerblock/stop`, {
                method: 'POST'
            });
            const data = await response.json();
            if (data.success) {
                alert('✅ RangerBlock stopped');
                loadBlockchainStatus();
            } else {
                alert(`❌ ${data.message}`);
            }
        } catch (error) {
            console.error('Failed to stop blockchain:', error);
            alert('❌ Failed to stop blockchain');
        }
    };

    // Restart blockchain node
    const restartBlockchain = async () => {
        try {
            const proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3010';
            const response = await fetch(`${proxyUrl}/api/rangerblock/restart`, {
                method: 'POST'
            });
            const data = await response.json();
            if (data.success) {
                alert('✅ RangerBlock restarted');
                loadBlockchainStatus();
            } else {
                alert(`❌ ${data.message}`);
            }
        } catch (error) {
            console.error('Failed to restart blockchain:', error);
            alert('❌ Failed to restart blockchain');
        }
    };

    const fetchLMStudioModelsOnly = async () => {
        try {
            const lmstudio = await fetchLMStudioModels(localSettings.lmstudioBaseUrl);
            if (lmstudio.length > 0) {
                setLocalSettings(prev => ({
                    ...prev,
                    availableModels: {
                        ...prev.availableModels,
                        lmstudio: lmstudio
                    }
                }));
                console.log(`✅ Auto-fetched ${lmstudio.length} LM Studio model(s):`, lmstudio);
            } else {
                console.warn('⚠️ LM Studio: No models loaded. Start the server and load a model first.');
            }
        } catch (e) {
            console.error('Failed to auto-fetch LM Studio models:', e);
        }
    };

    const fetchOllamaModelsOnly = async () => {
        try {
            const ollama = await fetchOllamaModels(localSettings.ollamaBaseUrl);
            if (ollama.length > 0) {
                setLocalSettings(prev => ({
                    ...prev,
                    availableModels: {
                        ...prev.availableModels,
                        ollama: ollama
                    }
                }));
                // Auto-set the first model if current one isn't in the list
                if (!ollama.includes(localSettings.ollamaModelId)) {
                    setLocalSettings(prev => ({ ...prev, ollamaModelId: ollama[0] }));
                }
                console.log(`✅ Fetched ${ollama.length} Ollama model(s):`, ollama);
            } else {
                console.warn('⚠️ Ollama: No models found. Pull a model first with "ollama pull <model>".');
            }
        } catch (e) {
            console.error('Failed to fetch Ollama models:', e);
        }
    };

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
            const lmstudio = await fetchLMStudioModels(localSettings.lmstudioBaseUrl);

            setLocalSettings(prev => ({
                ...prev,
                availableModels: {
                    ...prev.availableModels,
                    gemini: gemini.length > 0 ? gemini : prev.availableModels.gemini,
                    openai: openai.length > 0 ? openai : prev.availableModels.openai,
                    ollama: ollama.length > 0 ? ollama : prev.availableModels.ollama,
                    lmstudio: lmstudio.length > 0 ? lmstudio : prev.availableModels.lmstudio
                }
            }));
            alert(`Models Updated!\nGemini: ${gemini.length}\nOpenAI: ${openai.length}\nOllama: ${ollama.length}\nLM Studio: ${lmstudio.length}`);
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

            // LM Studio - Real test via service
            else if (provider === 'lmstudio') {
                success = await checkLMStudioConnection(localSettings.lmstudioBaseUrl);
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

            // Companies House (UK) - Real API test
            else if (provider === 'companieshouse' && localSettings.companiesHouseApiKey) {
                const response = await fetch('https://api.company-information.service.gov.uk/search/companies?q=test', {
                    headers: {
                        'Authorization': 'Basic ' + btoa(`${localSettings.companiesHouseApiKey}:`)
                    }
                });
                success = response.ok;
            }

            // OpenCorporates - Real API test
            else if (provider === 'opencorporates' && localSettings.openCorporatesApiKey) {
                const response = await fetch(`https://api.opencorporates.com/v0.4/companies/search?q=test&api_token=${localSettings.openCorporatesApiKey}`);
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

    // Window mode toggle functions
    const toggleFullscreen = () => {
        const newMode = windowMode === 'fullscreen' ? 'normal' : 'fullscreen';
        setWindowMode(newMode);
        localStorage.setItem('settings_window_mode', newMode);
    };

    const minimizeWindow = () => {
        setWindowMode('minimized');
        localStorage.setItem('settings_window_mode', 'minimized');
    };

    const restoreWindow = () => {
        setWindowMode('normal');
        localStorage.setItem('settings_window_mode', 'normal');
    };

    if (!isOpen) return null;

    // Minimized bar (floating bottom-left, horizontal tab style)
    if (windowMode === 'minimized') {
        return (
            <div
                className={`fixed bottom-4 left-4 z-[9999] rounded-lg border-2 shadow-2xl cursor-pointer transition-all duration-300 hover:scale-105 backdrop-blur-sm ${themeClass}`}
                onClick={restoreWindow}
            >
                <div className="flex items-center justify-between px-4 py-2 gap-3 min-w-[200px]">
                    <div className="flex items-center gap-2">
                        <i className="fa-solid fa-gear text-base"></i>
                        <span className="font-bold uppercase tracking-wide text-xs">Settings</span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            restoreWindow();
                        }}
                        className="opacity-70 hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-white/10"
                        title="Restore"
                    >
                        <i className="fa-solid fa-window-restore text-xs"></i>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`fixed z-[10000] transition-all duration-300 ${windowMode === 'fullscreen'
                ? 'inset-0'
                : 'inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'
                } animate-fade-in`}>
                <div className={`w-full rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${windowMode === 'fullscreen'
                    ? 'h-full max-w-none rounded-none'
                    : 'max-w-4xl max-h-[95vh] min-h-[75vh]'
                    } ${themeClass}`}>

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-inherit">
                        <h2 className="text-xl font-bold uppercase tracking-wider">Settings</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={minimizeWindow}
                                className="opacity-70 hover:opacity-100 w-8 h-8 flex items-center justify-center rounded hover:bg-white/10"
                                title="Minimize"
                            >
                                <i className="fa-solid fa-window-minimize"></i>
                            </button>
                            <button
                                onClick={toggleFullscreen}
                                className="opacity-70 hover:opacity-100 w-8 h-8 flex items-center justify-center rounded hover:bg-white/10"
                                title={windowMode === 'fullscreen' ? 'Exit Fullscreen' : 'Fullscreen'}
                            >
                                <i className={`fa-solid ${windowMode === 'fullscreen' ? 'fa-compress' : 'fa-expand'}`}></i>
                            </button>
                            <button
                                onClick={onClose}
                                className="opacity-70 hover:opacity-100 w-8 h-8 flex items-center justify-center rounded hover:bg-white/10"
                                title="Close"
                            >
                                <i className="fa-solid fa-xmark text-xl"></i>
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-nowrap items-center gap-2 border-b border-inherit px-6 py-2 overflow-x-auto bg-opacity-50 scrollbar-thin">
                        {['general', 'media', 'params', 'providers', 'ollama', 'lmstudio', 'search', 'council', 'prompts', 'security', 'canvas', 'radio', 'tamagotchi', 'rangerblock', 'editor', 'data', 'memory', 'weather', 'about', 'github'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`py-3 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab ? 'border-current opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className={`flex-1 overflow-y-auto p-6 scrollbar-thin min-h-[65vh] ${localSettings.theme === 'tron' ? 'scrollbar-thumb-tron-cyan scrollbar-track-black' : ''}`}>

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
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Editor</label>
                                        <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                            <input type="checkbox" checked={localSettings.editorAutoOpenTerminal} onChange={e => setLocalSettings({ ...localSettings, editorAutoOpenTerminal: e.target.checked })} className="accent-teal-500 w-5 h-5" />
                                            Auto-Open Terminal in Editor
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Browser</label>
                                        <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                            <input type="checkbox" checked={localSettings.openLinksInApp || false} onChange={e => setLocalSettings({ ...localSettings, openLinksInApp: e.target.checked })} className="accent-teal-500 w-5 h-5" />
                                            Open External Links in RangerPlex Tab
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2">Aliases</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowAliasManager(true)}
                                            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors"
                                        >
                                            Open Alias Manager
                                        </button>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Manage chat/run aliases and defaults.</p>
                                    </div>
                                </div>


                                {/* Workspace Settings */}
                                <div className="mt-6 border-t border-gray-200 dark:border-zinc-700 pt-4">
                                    <h3 className="text-sm font-bold mb-4 uppercase tracking-wider opacity-70">Workspace Behavior</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={localSettings.terminalOpenInTab || false}
                                                onChange={e => setLocalSettings({ ...localSettings, terminalOpenInTab: e.target.checked })}
                                                className="accent-teal-500 w-5 h-5"
                                            />
                                            Open Terminal in Tab
                                        </label>
                                        <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={localSettings.notesOpenInTab || false}
                                                onChange={e => setLocalSettings({ ...localSettings, notesOpenInTab: e.target.checked })}
                                                className="accent-teal-500 w-5 h-5"
                                            />
                                            Open Notes in Tab
                                        </label>
                                        <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={localSettings.browserOpenInTab || false}
                                                onChange={e => setLocalSettings({ ...localSettings, browserOpenInTab: e.target.checked })}
                                                className="accent-teal-500 w-5 h-5"
                                            />
                                            Open Browser in Tab
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-3 mt-6 border-t border-gray-200 dark:border-zinc-700 pt-4">
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

                                {/* Server Management Section */}
                                <div className={`mt-6 p-4 rounded-lg border ${localSettings.theme === 'tron' ? 'bg-tron-cyan/5 border-tron-cyan/30' : 'bg-gray-800/30 border-gray-700/50'}`}>
                                    <h3 className="font-bold mb-4 pb-2 border-b border-inherit flex items-center gap-2">
                                        <i className="fa-solid fa-server"></i>
                                        Server Management
                                    </h3>

                                    {/* Check for Updates */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                                                    <i className="fa-brands fa-github"></i>
                                                    System Updates
                                                </h4>
                                                <div className="text-xs opacity-70">
                                                    Check for the latest version of RangerPlex AI from GitHub
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleCheckUpdate}
                                                disabled={checkingUpdate}
                                                className={`px-4 py-2 rounded font-bold flex items-center gap-2 text-xs transition-all ${localSettings.theme === 'tron'
                                                    ? 'bg-tron-cyan/10 border border-tron-cyan/50 text-tron-cyan hover:bg-tron-cyan hover:text-black disabled:opacity-50'
                                                    : 'bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50'
                                                    }`}
                                            >
                                                {checkingUpdate ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-rotate"></i>}
                                                Check Updates
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
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <a
                                                                href={updateStatus.htmlUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-400 hover:underline flex items-center gap-1"
                                                            >
                                                                View on GitHub <i className="fa-solid fa-external-link-alt text-[10px]"></i>
                                                            </a>
                                                            <button
                                                                onClick={handleInstallUpdate}
                                                                disabled={installingUpdate}
                                                                className="ml-auto px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:opacity-50 rounded text-white font-bold flex items-center gap-2"
                                                            >
                                                                {installingUpdate ? (
                                                                    <>
                                                                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                                        Installing...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <i className="fa-solid fa-download"></i>
                                                                        Install Update
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {updateResult && (
                                            <div className={`mt-3 p-3 rounded text-xs border ${updateResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                                <div className={`font-bold mb-1 ${updateResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                                    <i className={`fa-solid ${updateResult.success ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2`}></i>
                                                    {updateResult.success ? 'Update Complete!' : 'Update Failed'}
                                                </div>
                                                <div className="opacity-80">{updateResult.message}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Reload Server */}
                                    <div className="mb-4 pt-4 border-t border-gray-700/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                                                    <i className="fa-solid fa-rotate-right"></i>
                                                    Reload Server
                                                </h4>
                                                <div className="text-xs opacity-70">
                                                    Restart server without updating code (useful after changes)
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleReloadServer}
                                                disabled={reloadingServer}
                                                className={`px-4 py-2 rounded font-bold flex items-center gap-2 text-xs transition-all ${localSettings.theme === 'tron'
                                                    ? 'bg-tron-cyan/10 border border-tron-cyan/50 text-tron-cyan hover:bg-tron-cyan hover:text-black disabled:opacity-50'
                                                    : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
                                                    }`}
                                            >
                                                {reloadingServer ? (
                                                    <>
                                                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                        Reloading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fa-solid fa-rotate-right"></i>
                                                        Reload Server
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        {reloadResult && (
                                            <div className={`mt-3 p-3 rounded text-xs border ${reloadResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                                <div className={`font-bold mb-1 ${reloadResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                                    <i className={`fa-solid ${reloadResult.success ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2`}></i>
                                                    {reloadResult.success ? 'Reload Complete!' : 'Reload Failed'}
                                                </div>
                                                <div className="opacity-80">{reloadResult.message}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stop Server */}
                                    <div className="pt-4 border-t border-gray-700/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                                                    <i className="fa-solid fa-stop"></i>
                                                    Stop Server
                                                </h4>
                                                <div className="text-xs opacity-70">
                                                    Stop PM2 servers (use npm run pm2:start to restart)
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleStopServer}
                                                disabled={stoppingServer}
                                                className={`px-4 py-2 rounded font-bold flex items-center gap-2 text-xs transition-all ${localSettings.theme === 'tron'
                                                    ? 'bg-red-900/30 border border-red-500/50 text-red-400 hover:bg-red-900/50 disabled:opacity-50'
                                                    : 'bg-red-600 hover:bg-red-500 text-white disabled:opacity-50'
                                                    }`}
                                            >
                                                {stoppingServer ? (
                                                    <>
                                                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                        Stopping...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fa-solid fa-stop"></i>
                                                        Stop Server
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        {stopResult && (
                                            <div className={`mt-3 p-3 rounded text-xs border ${stopResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                                <div className={`font-bold mb-1 ${stopResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                                    <i className={`fa-solid ${stopResult.success ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2`}></i>
                                                    {stopResult.success ? 'Server Stopped!' : 'Stop Failed'}
                                                </div>
                                                <div className="opacity-80">{stopResult.message}</div>
                                            </div>
                                        )}
                                    </div>
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
                                <InputGroup label="Companies House API Key" value={localSettings.companiesHouseApiKey || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, companiesHouseApiKey: v })} icon="fa-solid fa-building-columns" onTest={() => testConnection('companieshouse')} status={connectionStatus['companieshouse']} inputClass={inputClass} />
                                <InputGroup label="OpenCorporates API Token" value={localSettings.openCorporatesApiKey || ''} onChange={(v: any) => setLocalSettings({ ...localSettings, openCorporatesApiKey: v })} icon="fa-solid fa-globe" onTest={() => testConnection('opencorporates')} status={connectionStatus['opencorporates']} inputClass={inputClass} />
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

                                <div className="p-4 border border-inherit rounded bg-opacity-10 bg-black">
                                    <h3 className="font-bold mb-2">Conversation History Guardrails</h3>
                                    <p className="text-xs opacity-70 mb-4">Keep context size under control to avoid model token limits. Lower numbers = cheaper + safer.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold mb-1">Max history messages</label>
                                            <input
                                                type="number"
                                                min={4}
                                                max={200}
                                                value={localSettings.chatHistoryMaxMessages}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    setLocalSettings({ ...localSettings, chatHistoryMaxMessages: Math.min(200, Math.max(4, val)) });
                                                }}
                                                className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                            />
                                            <p className="text-[10px] opacity-60 mt-1">How many of the latest messages we pass to the model.</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1">Max history characters</label>
                                            <input
                                                type="number"
                                                min={10000}
                                                step={1000}
                                                value={localSettings.chatHistoryMaxChars}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    setLocalSettings({ ...localSettings, chatHistoryMaxChars: Math.max(10000, val) });
                                                }}
                                                className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                            />
                                            <p className="text-[10px] opacity-60 mt-1">Hard cap on characters sent (includes prompts + RAG inserts).</p>
                                        </div>
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
                                                <i className="fa-solid fa-microchip w-4"></i> Ollama Model
                                            </label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={localSettings.ollamaModelId}
                                                    onChange={e => setLocalSettings({ ...localSettings, ollamaModelId: e.target.value })}
                                                    className={`flex-1 rounded px-4 py-2 outline-none ${inputClass}`}
                                                >
                                                    {localSettings.availableModels.ollama.length === 0 && (
                                                        <option value="">No models - click Refresh</option>
                                                    )}
                                                    {localSettings.availableModels.ollama.map(m => (
                                                        <option key={m} value={m}>{m}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={fetchOllamaModelsOnly}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold uppercase hover:bg-blue-500 transition-colors flex items-center gap-2"
                                                    title="Refresh model list from Ollama"
                                                >
                                                    <i className="fa-solid fa-sync"></i>
                                                    Refresh
                                                </button>
                                            </div>
                                            <p className="text-[10px] opacity-60 mt-1">
                                                💡 <strong>Tip:</strong> Use <code className="px-1 py-0.5 bg-black/30 rounded">http://localhost:3010/api/ollama</code> as Base URL (proxy) instead of <code className="px-1 py-0.5 bg-black/30 rounded">http://localhost:11434</code> (direct) to avoid CORS errors.
                                            </p>
                                        </div>
                                        <div className="mt-3">
                                            <label className="block text-xs font-bold mb-1 opacity-80">Docker Host Selection</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="ollamaHost"
                                                        checked={localSettings.ollamaBaseUrl.includes('localhost:11434')}
                                                        onChange={() => setLocalSettings({ ...localSettings, ollamaBaseUrl: 'http://localhost:11434' })}
                                                        className="accent-teal-500"
                                                    />
                                                    <span className="text-xs">Localhost (Default)</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="ollamaHost"
                                                        checked={localSettings.ollamaBaseUrl.includes('host.docker.internal')}
                                                        onChange={() => setLocalSettings({ ...localSettings, ollamaBaseUrl: 'http://host.docker.internal:11434' })}
                                                        className="accent-teal-500"
                                                    />
                                                    <span className="text-xs">Docker (host.docker.internal)</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="ollamaHost"
                                                        checked={localSettings.ollamaBaseUrl.includes('localhost:3010/api/ollama')}
                                                        onChange={() => setLocalSettings({ ...localSettings, ollamaBaseUrl: 'http://localhost:3010/api/ollama' })}
                                                        className="accent-teal-500"
                                                    />
                                                    <span className="text-xs">Proxy (Recommended)</span>
                                                </label>
                                            </div>
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

                        {/* LM STUDIO TAB */}
                        {activeTab === 'lmstudio' && (
                            <div className="space-y-6">
                                <h3 className="font-bold mb-4 border-b border-inherit pb-2">LM Studio Integration</h3>

                                {/* Important Notice */}
                                <div className="p-4 border-2 border-yellow-500/50 bg-yellow-500/10 rounded">
                                    <div className="flex items-start gap-3">
                                        <i className="fa-solid fa-exclamation-triangle text-yellow-500 text-xl mt-1"></i>
                                        <div>
                                            <h4 className="font-bold text-sm text-yellow-500 mb-2">⚠️ Important: Load Model + Start Server!</h4>
                                            <p className="text-xs opacity-90 mb-2">
                                                LM Studio requires TWO steps: <strong>LOAD a model</strong> AND <strong>START the server</strong>.
                                            </p>
                                            <ol className="text-xs opacity-90 space-y-1 ml-4 list-decimal">
                                                <li>Open LM Studio app</li>
                                                <li>Go to <strong>"Local Server"</strong> or <strong>"Developer"</strong> tab</li>
                                                <li>Select a model from the left sidebar</li>
                                                <li>Click <strong>"Load Model"</strong> button and wait</li>
                                                <li>Click <strong>"Start Server"</strong> button (CRITICAL!)</li>
                                                <li>Verify it says <code className="px-1 py-0.5 bg-black/30 rounded">Server running on http://localhost:1234</code></li>
                                                <li>Come back here and models will auto-refresh! ✨</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>

                                {/* Connection Settings */}
                                <div className="p-4 border border-inherit rounded bg-opacity-5 mb-6">
                                    <h4 className="font-bold text-sm mb-2">Connection Settings</h4>
                                    <p className="text-xs opacity-70 mb-4">
                                        Configure how RangerPlex connects to LM Studio. LM Studio uses an OpenAI-compatible API.
                                    </p>
                                    <div className="space-y-4">
                                        <InputGroup
                                            label="LM Studio Base URL"
                                            value={localSettings.lmstudioBaseUrl}
                                            onChange={(v: any) => setLocalSettings({ ...localSettings, lmstudioBaseUrl: v })}
                                            icon="fa-solid fa-server"
                                            onTest={() => testConnection('lmstudio')}
                                            status={connectionStatus['lmstudio']}
                                            inputClass={inputClass}
                                        />
                                        <div>
                                            <label className="block text-xs font-bold mb-1 opacity-80">
                                                <i className="fa-solid fa-microchip w-4"></i> LM Studio Model ID
                                            </label>
                                            <input
                                                type="text"
                                                value={localSettings.lmstudioModelId}
                                                onChange={e => setLocalSettings({ ...localSettings, lmstudioModelId: e.target.value })}
                                                className={`w-full rounded px-4 py-2 outline-none ${inputClass}`}
                                                placeholder="e.g. mistral-7b-instruct, llama-3-8b"
                                            />
                                            <p className="text-[10px] opacity-60 mt-1">
                                                💡 <strong>Recommended:</strong> Use proxy URL <code className="px-1 py-0.5 bg-black/30 rounded">http://localhost:3010/api/lmstudio</code> to avoid CORS errors
                                            </p>
                                            <p className="text-[10px] opacity-60 mt-1">
                                                🔧 <strong>Direct (advanced):</strong> <code className="px-1 py-0.5 bg-black/30 rounded">http://localhost:1234/v1</code> (may have CORS issues)
                                            </p>
                                            <p className="text-[10px] opacity-60 mt-2">
                                                📖 <strong>Note:</strong> Use the LM Studio app to download and load models. Once a model is loaded, it will appear in the model selector.
                                            </p>
                                        </div>
                                        <div className="mt-3">
                                            <label className="block text-xs font-bold mb-1 opacity-80">Docker Host Selection</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="lmstudioHost"
                                                        checked={localSettings.lmstudioBaseUrl.includes('localhost:1234')}
                                                        onChange={() => setLocalSettings({ ...localSettings, lmstudioBaseUrl: 'http://localhost:1234/v1' })}
                                                        className="accent-teal-500"
                                                    />
                                                    <span className="text-xs">Localhost (Default)</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="lmstudioHost"
                                                        checked={localSettings.lmstudioBaseUrl.includes('host.docker.internal')}
                                                        onChange={() => setLocalSettings({ ...localSettings, lmstudioBaseUrl: 'http://host.docker.internal:1234/v1' })}
                                                        className="accent-teal-500"
                                                    />
                                                    <span className="text-xs">Docker (host.docker.internal)</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="lmstudioHost"
                                                        checked={localSettings.lmstudioBaseUrl.includes('localhost:3010/api/lmstudio')}
                                                        onChange={() => setLocalSettings({ ...localSettings, lmstudioBaseUrl: 'http://localhost:3010/api/lmstudio' })}
                                                        className="accent-teal-500"
                                                    />
                                                    <span className="text-xs">Proxy (Recommended)</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Refresh Models Button */}
                                        <div className="mt-4">
                                            <button
                                                onClick={fetchLMStudioModelsOnly}
                                                className="w-full px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold uppercase hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <i className="fa-solid fa-sync"></i>
                                                Refresh Models from LM Studio
                                            </button>
                                            <p className="text-[10px] opacity-60 mt-2 text-center">
                                                Click after loading a new model in LM Studio
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* About LM Studio */}
                                <div className="p-4 border border-inherit rounded bg-opacity-5">
                                    <h4 className="font-bold text-sm mb-2">About LM Studio</h4>
                                    <p className="text-xs opacity-70 mb-3">
                                        LM Studio is a desktop application for running local LLMs with an OpenAI-compatible API server.
                                    </p>
                                    <ul className="text-xs opacity-70 space-y-2">
                                        <li>✅ Download and manage models with a GUI</li>
                                        <li>✅ OpenAI-compatible API (no code changes needed)</li>
                                        <li>✅ Hardware acceleration (Metal, CUDA)</li>
                                        <li>✅ Cross-platform (Mac, Windows, Linux)</li>
                                    </ul>
                                    <div className="mt-4">
                                        <a
                                            href="https://lmstudio.ai"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            <i className="fa-solid fa-external-link"></i>
                                            Visit LM Studio Website
                                        </a>
                                    </div>
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

                        {/* RANGERBLOCK TAB */}
                        {activeTab === 'rangerblock' && (
                            <div className="space-y-6">
                                <h3 className="font-bold mb-4 border-b border-inherit pb-2">🎖️ RangerBlock Blockchain</h3>

                                {/* Status Panel */}
                                {blockchainStatus && (
                                    <div className={`p-4 border rounded ${blockchainStatus.isRunning ? 'border-green-500 bg-green-500/10' : 'border-inherit bg-opacity-5'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${blockchainStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`}></div>
                                                <span className="font-bold">
                                                    {blockchainStatus.isRunning ? '✅ Node Running' : '⚪ Node Stopped'}
                                                </span>
                                            </div>
                                            <button onClick={loadBlockchainStatus} className="text-xs opacity-60 hover:opacity-100">
                                                <i className="fa-solid fa-refresh"></i> Refresh
                                            </button>
                                        </div>

                                        {blockchainStatus.hardware && (
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <div className="opacity-60 text-xs">Node Name</div>
                                                    <div className="font-mono">{blockchainStatus.hardware.nodeName}</div>
                                                </div>
                                                <div>
                                                    <div className="opacity-60 text-xs">Machine Type</div>
                                                    <div className="font-mono">{blockchainStatus.hardware.machineType}</div>
                                                </div>
                                                <div>
                                                    <div className="opacity-60 text-xs">IP Address</div>
                                                    <div className="font-mono">{blockchainStatus.hardware.ipAddress}</div>
                                                </div>
                                                <div>
                                                    <div className="opacity-60 text-xs">Hardware UUID</div>
                                                    <div className="font-mono text-xs">{blockchainStatus.hardware.hardwareSerial}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Configuration */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Enable/Disable */}
                                    <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">
                                            <i className="fa-solid fa-power-off w-4"></i> Enable RangerBlock
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={blockchainConfig.enabled}
                                                onChange={e => setBlockchainConfig({ ...blockchainConfig, enabled: e.target.checked })}
                                                className="w-5 h-5 accent-current"
                                            />
                                            <span className="text-sm">{blockchainConfig.enabled ? 'Enabled' : 'Disabled'}</span>
                                        </label>
                                    </div>

                                    {/* Auto-Start */}
                                    <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">
                                            <i className="fa-solid fa-rocket w-4"></i> Auto-Start on Launch
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={blockchainConfig.autoStart}
                                                onChange={e => setBlockchainConfig({ ...blockchainConfig, autoStart: e.target.checked })}
                                                className="w-5 h-5 accent-current"
                                            />
                                            <span className="text-sm">{blockchainConfig.autoStart ? 'Enabled' : 'Disabled'}</span>
                                        </label>
                                    </div>

                                    {/* Network Mode */}
                                    <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">
                                            <i className="fa-solid fa-network-wired w-4"></i> Network Mode
                                        </label>
                                        <select
                                            value={blockchainConfig.networkMode}
                                            onChange={e => setBlockchainConfig({ ...blockchainConfig, networkMode: e.target.value })}
                                            className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                        >
                                            <option value="local">Local Only (LAN)</option>
                                            <option value="local+global">Local + Global</option>
                                            <option value="global">Global Only</option>
                                        </select>
                                        <span className="text-[10px] opacity-60 mt-1 block">
                                            {blockchainConfig.networkMode === 'local' && '🏠 Only connects to devices on your network'}
                                            {blockchainConfig.networkMode === 'local+global' && '🌐 Connects locally AND globally via relay'}
                                            {blockchainConfig.networkMode === 'global' && '🌍 Only global connections (requires relay)'}
                                        </span>
                                    </div>

                                    {/* Port */}
                                    <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">
                                            <i className="fa-solid fa-plug w-4"></i> Node Port
                                        </label>
                                        <input
                                            type="number"
                                            value={blockchainConfig.port}
                                            onChange={e => setBlockchainConfig({ ...blockchainConfig, port: parseInt(e.target.value) })}
                                            className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                            min="1024"
                                            max="65535"
                                        />
                                        <span className="text-[10px] opacity-60 mt-1 block">Default: 5000</span>
                                    </div>

                                    {/* Relay URL */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold mb-1 opacity-80">
                                            <i className="fa-solid fa-satellite-dish w-4"></i> Relay Server URL
                                        </label>
                                        <input
                                            type="text"
                                            value={blockchainConfig.relayUrl}
                                            onChange={e => setBlockchainConfig({ ...blockchainConfig, relayUrl: e.target.value })}
                                            placeholder="ws://YOUR_RELAY_IP:8080"
                                            className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                            disabled={blockchainConfig.networkMode === 'local'}
                                        />
                                        <span className="text-[10px] opacity-60 mt-1 block">
                                            {blockchainConfig.networkMode === 'local' ? '⚠️ Not needed for local-only mode' : 'Required for global connections'}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={saveBlockchainConfig}
                                        className="px-6 py-2 rounded font-bold text-sm bg-blue-500 hover:bg-blue-600 text-white shadow transition-all"
                                    >
                                        <i className="fa-solid fa-save mr-2"></i>
                                        Save Settings
                                    </button>

                                    {blockchainStatus?.isRunning ? (
                                        <>
                                            <button
                                                onClick={stopBlockchain}
                                                className="px-6 py-2 rounded font-bold text-sm bg-red-500 hover:bg-red-600 text-white shadow transition-all"
                                            >
                                                <i className="fa-solid fa-stop mr-2"></i>
                                                Stop Node
                                            </button>
                                            <button
                                                onClick={restartBlockchain}
                                                className="px-6 py-2 rounded font-bold text-sm bg-yellow-500 hover:bg-yellow-600 text-white shadow transition-all"
                                            >
                                                <i className="fa-solid fa-refresh mr-2"></i>
                                                Restart Node
                                            </button>
                                            <a
                                                href={`http://localhost:${blockchainConfig.port}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-6 py-2 rounded font-bold text-sm bg-purple-500 hover:bg-purple-600 text-white shadow transition-all"
                                            >
                                                <i className="fa-solid fa-external-link mr-2"></i>
                                                View Dashboard
                                            </a>
                                        </>
                                    ) : (
                                        <button
                                            onClick={startBlockchain}
                                            className="px-6 py-2 rounded font-bold text-sm bg-green-500 hover:bg-green-600 text-white shadow transition-all"
                                            disabled={!blockchainConfig.enabled}
                                        >
                                            <i className="fa-solid fa-play mr-2"></i>
                                            Start Node
                                        </button>
                                    )}
                                </div>

                                {/* Info Panel */}
                                <div className="p-4 border border-inherit rounded bg-opacity-5">
                                    <h4 className="font-bold text-sm mb-2">ℹ️ About RangerBlock</h4>
                                    <p className="text-xs opacity-70 leading-relaxed">
                                        RangerBlock is a peer-to-peer blockchain network integrated into RangerPlex.
                                        Your node is identified by your Mac's hardware UUID for security.
                                        <br /><br />
                                        <strong>Network Modes:</strong><br />
                                        • <strong>Local</strong>: Only connects to devices on your WiFi/LAN<br />
                                        • <strong>Local+Global</strong>: Connects both locally and globally via relay server<br />
                                        • <strong>Global</strong>: Only connects through relay server (for cross-network communication)
                                        <br /><br />
                                        When enabled, your node starts automatically with RangerPlex.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* EDITOR TAB */}
                        {activeTab === 'editor' && (
                            <div className="space-y-6">
                                <h3 className="font-bold mb-4 border-b border-inherit pb-2">Code Editor</h3>

                                {/* Terminal Settings */}
                                <div className="p-4 border border-inherit rounded bg-opacity-5">
                                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-terminal"></i>
                                        Terminal Integration
                                    </h4>
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={localSettings.editorAutoOpenTerminal}
                                                onChange={e => setLocalSettings({ ...localSettings, editorAutoOpenTerminal: e.target.checked })}
                                                className="accent-teal-500 w-5 h-5"
                                            />
                                            Auto-Open Terminal
                                        </label>
                                        <p className="text-xs opacity-60 ml-8">
                                            Automatically open the integrated terminal when the editor launches.
                                        </p>
                                    </div>
                                </div>

                                {/* Editor Appearance */}
                                <div className="p-4 border border-inherit rounded bg-opacity-5">
                                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-code"></i>
                                        Editor Appearance
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold mb-1 opacity-80">
                                                <i className="fa-solid fa-text-height w-4"></i> Font Size
                                            </label>
                                            <input
                                                type="number"
                                                value={localSettings.editorFontSize}
                                                onChange={e => setLocalSettings({ ...localSettings, editorFontSize: parseInt(e.target.value) || 14 })}
                                                className={`w-full rounded px-4 py-2 outline-none ${inputClass}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 opacity-80">
                                                <i className="fa-solid fa-indent w-4"></i> Tab Size
                                            </label>
                                            <input
                                                type="number"
                                                value={localSettings.editorTabSize}
                                                onChange={e => setLocalSettings({ ...localSettings, editorTabSize: parseInt(e.target.value) || 4 })}
                                                className={`w-full rounded px-4 py-2 outline-none ${inputClass}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 opacity-80">
                                                <i className="fa-solid fa-align-left w-4"></i> Word Wrap
                                            </label>
                                            <select
                                                value={localSettings.editorWordWrap}
                                                onChange={e => setLocalSettings({ ...localSettings, editorWordWrap: e.target.value as any })}
                                                className={`w-full rounded px-4 py-2 outline-none ${inputClass}`}
                                            >
                                                <option value="off">Off</option>
                                                <option value="on">On</option>
                                                <option value="wordWrapColumn">Word Wrap Column</option>
                                                <option value="bounded">Bounded</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 opacity-80">
                                                <i className="fa-solid fa-list-ol w-4"></i> Line Numbers
                                            </label>
                                            <select
                                                value={localSettings.editorLineNumbers}
                                                onChange={e => setLocalSettings({ ...localSettings, editorLineNumbers: e.target.value as any })}
                                                className={`w-full rounded px-4 py-2 outline-none ${inputClass}`}
                                            >
                                                <option value="on">On</option>
                                                <option value="off">Off</option>
                                                <option value="relative">Relative</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={localSettings.editorMinimap}
                                                onChange={e => setLocalSettings({ ...localSettings, editorMinimap: e.target.checked })}
                                                className="accent-teal-500 w-5 h-5"
                                            />
                                            Show Minimap
                                        </label>
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

                        {/* MEMORY TAB */}
                        {activeTab === 'memory' && (
                            <div className="space-y-6">
                                <h3 className="font-bold mb-4 border-b border-inherit pb-2">Memory Management</h3>

                                {/* Browser Memory */}
                                <div className="p-4 border border-inherit rounded bg-opacity-5">
                                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-memory"></i>
                                        Browser Memory
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-3 bg-black/20 rounded">
                                            <div className="text-xs opacity-60">JS Heap Size Limit</div>
                                            <div className="font-mono font-bold text-lg">
                                                {/* @ts-ignore */}
                                                {performance.memory ? (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) : 'N/A'} MB
                                            </div>
                                        </div>
                                        <div className="p-3 bg-black/20 rounded">
                                            <div className="text-xs opacity-60">Total JS Heap Size</div>
                                            <div className="font-mono font-bold text-lg">
                                                {/* @ts-ignore */}
                                                {performance.memory ? (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) : 'N/A'} MB
                                            </div>
                                        </div>
                                        <div className="p-3 bg-black/20 rounded">
                                            <div className="text-xs opacity-60">Used JS Heap Size</div>
                                            <div className="font-mono font-bold text-lg text-teal-400">
                                                {/* @ts-ignore */}
                                                {performance.memory ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) : 'N/A'} MB
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] opacity-60 mt-2">
                                        * Only available in Chrome/Chromium browsers.
                                    </p>
                                </div>

                                {/* Database Storage */}
                                <div className="p-4 border border-inherit rounded bg-opacity-5">
                                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-database"></i>
                                        Database Storage
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-2 bg-black/20 rounded">
                                            <div>
                                                <div className="font-bold text-xs">IndexedDB (Browser)</div>
                                                <div className="text-[10px] opacity-60">Local persistence</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold">{(storageStats.browser / 1024).toFixed(2)} KB</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-2 bg-black/20 rounded">
                                            <div>
                                                <div className="font-bold text-xs">LocalStorage</div>
                                                <div className="text-[10px] opacity-60">Settings & cache</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold">
                                                    {(new Blob([JSON.stringify(localStorage)]).size / 1024).toFixed(2)} KB
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-4 border border-inherit rounded bg-opacity-5">
                                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-tools"></i>
                                        Memory Actions
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <button
                                            onClick={async () => {
                                                if (!confirm('⚠️ Clear browser cache (LocalStorage)? Settings will be reset.')) return;
                                                localStorage.clear();
                                                window.location.reload();
                                            }}
                                            className="px-4 py-2 bg-yellow-600/20 border border-yellow-600/50 text-yellow-500 hover:bg-yellow-600/30 rounded text-xs font-bold flex items-center justify-center gap-2"
                                        >
                                            <i className="fa-solid fa-broom"></i>
                                            Clear LocalStorage
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!confirm('⚠️ Clear IndexedDB? All offline data will be lost.')) return;
                                                await dbService.clearChats();
                                                await dbService.clearSettings();
                                                // Add other clear methods if available or use a generic one
                                                alert('IndexedDB cleared.');
                                                window.location.reload();
                                            }}
                                            className="px-4 py-2 bg-red-600/20 border border-red-600/50 text-red-500 hover:bg-red-600/30 rounded text-xs font-bold flex items-center justify-center gap-2"
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                            Clear IndexedDB
                                        </button>
                                        {onExportAll && (
                                            <button
                                                onClick={onExportAll}
                                                className="px-4 py-2 bg-blue-600/20 border border-blue-600/50 text-blue-500 hover:bg-blue-600/30 rounded text-xs font-bold flex items-center justify-center gap-2"
                                            >
                                                <i className="fa-solid fa-download"></i>
                                                Export All Data
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Developer Notes */}
                                <div className="p-4 border border-inherit rounded bg-opacity-5">
                                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                        <i className="fa-solid fa-code"></i>
                                        Developer Notes: Adding Memory
                                    </h4>
                                    <div className="text-xs opacity-70 space-y-2 font-mono bg-black/30 p-3 rounded">
                                        <p>// To add new memory stores:</p>
                                        <p>1. Update `dbService.ts` schema to include new store.</p>
                                        <p>2. Create a specific service (e.g., `canvasDbService.ts`) for granular operations.</p>
                                        <p>3. Use `loadStorageStats` in `SettingsModal` to include new store size.</p>
                                        <p>4. Add migration logic if moving from LocalStorage.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* WEATHER TAB */}
                        {activeTab === 'weather' && (
                            <div className="space-y-6">
                                <div className="p-4 border border-teal-500/30 rounded bg-teal-500/5">
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        <i className="fa-solid fa-cloud-sun text-teal-400"></i>
                                        🌤️ RangerPlex Weather Station
                                    </h3>
                                    <p className="text-sm opacity-80 mb-4">
                                        Configure your 4-API weather arsenal! RangerPlex combines OpenWeatherMap, Tomorrow.io, Visual Crossing, and Open-Meteo for maximum accuracy and historical data.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
                                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                                            <div className="font-bold text-green-400 mb-1">✅ OpenWeatherMap</div>
                                            <div className="opacity-70">Current conditions, 5-day forecast, air quality</div>
                                        </div>
                                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                                            <div className="font-bold text-green-400 mb-1">✅ Tomorrow.io</div>
                                            <div className="opacity-70">Minute-by-minute forecasts, 60+ data layers!</div>
                                        </div>
                                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                                            <div className="font-bold text-green-400 mb-1">✅ Visual Crossing</div>
                                            <div className="opacity-70">50-year historical data, 15-day forecasts</div>
                                        </div>
                                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                                            <div className="font-bold text-green-400 mb-1">✅ Open-Meteo (FREE!)</div>
                                            <div className="opacity-70">80-year history, unlimited calls, no key needed!</div>
                                        </div>
                                    </div>
                                </div>

                                {/* API Keys Section */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-sm flex items-center gap-2">
                                        <i className="fa-solid fa-key"></i>
                                        Weather API Keys
                                    </h4>

                                    {/* Weather API keys removed from UI because AppSettings does not currently include them. Add to type + persistence before re-enabling. */}

                                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                                        <div className="flex items-center gap-2 mb-2">
                                            <i className="fa-solid fa-info-circle text-blue-400"></i>
                                            <span className="font-bold text-sm">Open-Meteo (No Key Required!)</span>
                                        </div>
                                        <div className="text-xs opacity-80">
                                            Open-Meteo is completely FREE and requires no API key! It provides 80 years of historical data with unlimited API calls. Already integrated via npm package.
                                        </div>
                                    </div>
                                </div>

                                {/* Rain Notifications Section ☔🇮🇪 */}
                                <div className="space-y-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                                    <h4 className="font-bold text-sm flex items-center gap-2">
                                        <i className="fa-solid fa-cloud-rain text-blue-400"></i>
                                        ☔ Irish Rain Notifications
                                    </h4>
                                    <p className="text-xs opacity-80 mb-3">
                                        Get notified before it rains! Perfect for Irish weather where sunshine and rain happen at the same time. 🇮🇪
                                    </p>

                                    {settings.rainNotificationSnoozeUntil && settings.rainNotificationSnoozeUntil > Date.now() && (
                                        <div className="flex items-center justify-between p-3 bg-blue-500/20 rounded border border-blue-500/30 mb-3">
                                            <div className="text-xs">
                                                <div className="font-bold text-blue-300">💤 Snoozed until {new Date(settings.rainNotificationSnoozeUntil).toLocaleTimeString()}</div>
                                                <div className="opacity-70">Notifications are temporarily paused.</div>
                                            </div>
                                            <button
                                                onClick={() => onSave({ ...settings, rainNotificationSnoozeUntil: undefined })}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold"
                                            >
                                                Wake Up
                                            </button>
                                        </div>
                                    )}

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.rainNotificationsEnabled || false}
                                            onChange={(e) => onSave({ ...settings, rainNotificationsEnabled: e.target.checked })}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm">Enable rain notifications</span>
                                    </label>

                                    {settings.rainNotificationsEnabled && (
                                        <div className="space-y-3 mt-3 pl-6 border-l-2 border-blue-500/30">
                                            <div>
                                                <label className="block text-sm mb-1">
                                                    <i className="fa-solid fa-clock mr-1"></i>
                                                    Notify me before rain
                                                </label>
                                                <select
                                                    value={settings.rainNotificationTiming || '3hours'}
                                                    onChange={(e) => onSave({ ...settings, rainNotificationTiming: e.target.value as any })}
                                                    className="w-full p-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded text-sm"
                                                >
                                                    <option value="1hour">1 hour before</option>
                                                    <option value="3hours">3 hours before</option>
                                                    <option value="12hours">12 hours before</option>
                                                    <option value="24hours">24 hours before</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm mb-1">
                                                    <i className="fa-solid fa-location-dot mr-1"></i>
                                                    Location to monitor
                                                </label>
                                                <input
                                                    type="text"
                                                    value={settings.rainNotificationLocation || 'Dublin,IE'}
                                                    onChange={(e) => onSave({ ...settings, rainNotificationLocation: e.target.value })}
                                                    placeholder="Dublin,IE"
                                                    className="w-full p-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded text-sm"
                                                />
                                                <p className="text-xs opacity-60 mt-1">Use format: City,Country (e.g., Cork,IE)</p>
                                            </div>

                                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs">
                                                <div className="flex items-start gap-2">
                                                    <i className="fa-solid fa-umbrella text-blue-400 mt-0.5"></i>
                                                    <div>
                                                        <div className="font-bold mb-1">How it works:</div>
                                                        <div className="opacity-80">
                                                            RangerPlex checks the weather every 30 minutes using Open-Meteo (FREE & unlimited!).
                                                            When rain is detected within your timeframe, you'll get a notification with the expected
                                                            rain intensity and exact timing. Don't forget your brolly! 🇮🇪
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Weather Station Features */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-sm flex items-center gap-2">
                                        <i className="fa-solid fa-rocket"></i>
                                        Weather Station Features
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-start gap-2">
                                            <i className="fa-solid fa-check text-green-400 mt-1"></i>
                                            <div>
                                                <div className="font-bold">Real-time Conditions</div>
                                                <div className="text-xs opacity-70">Live weather from 4 APIs with intelligent fallback</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <i className="fa-solid fa-check text-green-400 mt-1"></i>
                                            <div>
                                                <div className="font-bold">Minute-by-Minute Forecast</div>
                                                <div className="text-xs opacity-70">"Rain starting in 8 minutes!" precision</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <i className="fa-solid fa-check text-green-400 mt-1"></i>
                                            <div>
                                                <div className="font-bold">Air Quality Monitor</div>
                                                <div className="text-xs opacity-70">PM2.5, PM10, CO2, pollen index</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <i className="fa-solid fa-check text-green-400 mt-1"></i>
                                            <div>
                                                <div className="font-bold">Historical Analysis</div>
                                                <div className="text-xs opacity-70">80 years of weather data (1940-2024)</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <i className="fa-solid fa-check text-green-400 mt-1"></i>
                                            <div>
                                                <div className="font-bold">Weather Maps</div>
                                                <div className="text-xs opacity-70">Temperature, radar, precipitation layers</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <i className="fa-solid fa-check text-green-400 mt-1"></i>
                                            <div>
                                                <div className="font-bold">ASCII Weather Art</div>
                                                <div className="text-xs opacity-70">Beautiful terminal-style weather displays</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <i className="fa-solid fa-check text-teal-400 mt-1"></i>
                                            <div>
                                                <div className="font-bold">Blockchain Weather Reports 🎖️</div>
                                                <div className="text-xs opacity-70">Publish weather to RangerBlock network!</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <i className="fa-solid fa-check text-green-400 mt-1"></i>
                                            <div>
                                                <div className="font-bold">Study Condition Optimizer</div>
                                                <div className="text-xs opacity-70">Best study times based on weather</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="p-4 border border-teal-500/30 rounded bg-teal-500/5">
                                    <div className="flex items-start gap-3">
                                        <i className="fa-solid fa-lightbulb text-yellow-400 text-xl mt-1"></i>
                                        <div className="text-sm">
                                            <div className="font-bold mb-1">💡 Pro Tip</div>
                                            <div className="opacity-80">
                                                The Weather Station automatically uses the best API for each request. If one API is down, it seamlessly falls back to the others. You get <strong>maximum uptime</strong> and <strong>best data</strong> from all 4 sources!
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Cost Badge */}
                                <div className="text-center p-6 bg-green-500/10 border border-green-500/30 rounded">
                                    <div className="text-3xl font-bold text-green-400 mb-2">$0.00</div>
                                    <div className="text-sm opacity-80">Total Monthly Cost</div>
                                    <div className="text-xs opacity-60 mt-2">All 4 weather APIs are completely FREE! 🎖️</div>
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
                        {activeTab === 'github' && (
                            <div className="space-y-6 prose prose-invert max-w-none">
                                <h3 className="font-bold border-b border-inherit pb-2">System & GitHub</h3>

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
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <a
                                                            href={updateStatus.htmlUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-400 hover:underline flex items-center gap-1"
                                                        >
                                                            View on GitHub <i className="fa-solid fa-external-link-alt text-[10px]"></i>
                                                        </a>
                                                        <button
                                                            onClick={handleInstallUpdate}
                                                            disabled={installingUpdate}
                                                            className="ml-auto px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:opacity-50 rounded text-white font-bold flex items-center gap-2"
                                                        >
                                                            {installingUpdate ? (
                                                                <>
                                                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                                    Installing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="fa-solid fa-download"></i>
                                                                    Install Update
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {updateResult && (
                                        <div className={`mt-3 p-3 rounded text-xs border ${updateResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                            <div className={`font-bold mb-1 ${updateResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                                <i className={`fa-solid ${updateResult.success ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2`}></i>
                                                {updateResult.success ? 'Update Complete!' : 'Update Failed'}
                                            </div>
                                            <div className="opacity-80">{updateResult.message}</div>
                                            {updateResult.needsRestart && (
                                                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                                                    <i className="fa-solid fa-rotate-right mr-2"></i>
                                                    <strong>Action Required:</strong> Please restart the proxy server:
                                                    <pre className="mt-1 bg-black/30 p-1 rounded text-[10px]">
                                                        # Stop current server (Ctrl+C), then:
                                                        node proxy_server.js
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Server Reload Section */}
                                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h4 className="font-bold text-sm flex items-center gap-2">
                                                    <i className="fa-solid fa-rotate-right"></i>
                                                    Quick Reload
                                                </h4>
                                                <div className="text-xs opacity-60 mt-1">
                                                    Reload server without updating code (useful after code changes)
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleReloadServer}
                                                disabled={reloadingServer}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:opacity-50 rounded text-white font-bold flex items-center gap-2"
                                            >
                                                {reloadingServer ? (
                                                    <>
                                                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                        Reloading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fa-solid fa-rotate-right"></i>
                                                        Reload Server
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        {reloadResult && (
                                            <div className={`mt-3 p-3 rounded text-xs border ${reloadResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                                <div className={`font-bold mb-1 ${reloadResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                                    <i className={`fa-solid ${reloadResult.success ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2`}></i>
                                                    {reloadResult.success ? 'Reload Complete!' : 'Reload Failed'}
                                                </div>
                                                <div className="opacity-80">{reloadResult.message}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Server Stop Section */}
                                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h4 className="font-bold text-sm flex items-center gap-2">
                                                    <i className="fa-solid fa-stop"></i>
                                                    Stop Server
                                                </h4>
                                                <div className="text-xs opacity-60 mt-1">
                                                    Stop PM2 servers (use npm run pm2:start to restart)
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleStopServer}
                                                disabled={stoppingServer}
                                                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:opacity-50 rounded text-white font-bold flex items-center gap-2"
                                            >
                                                {stoppingServer ? (
                                                    <>
                                                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                        Stopping...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fa-solid fa-stop"></i>
                                                        Stop Server
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        {stopResult && (
                                            <div className={`mt-3 p-3 rounded text-xs border ${stopResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                                <div className={`font-bold mb-1 ${stopResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                                    <i className={`fa-solid ${stopResult.success ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2`}></i>
                                                    {stopResult.success ? 'Server Stopped!' : 'Stop Failed'}
                                                </div>
                                                <div className="opacity-80">{stopResult.message}</div>
                                            </div>
                                        )}
                                    </div>
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
            </div >
            {showAliasManager && (
                <AliasManager
                    isOpen={showAliasManager}
                    onClose={() => setShowAliasManager(false)}
                />
            )}
        </>
    );
};

export default SettingsModal;

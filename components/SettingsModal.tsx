
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppSettings, AgentConfig, ModelType, SavedPrompt, VoiceConfig, Currency, DEFAULT_SAVED_PROMPTS, getModelBadges } from '../types';
import { checkOllamaConnection, pullOllamaModel } from '../services/ollamaService';
import { consoleCapture, ConsoleEntry } from '../services/consoleCapture';
import { checkLMStudioConnection } from '../services/lmstudioService';
import { fetchGeminiModels, fetchOllamaModels, fetchOpenAIModels, fetchLMStudioModels } from '../services/modelRegistry';
import { processAvatarImage } from '../services/imageProcessing';
import { fetchElevenLabsVoices, Voice } from '../services/elevenLabsService';
import { dbService } from '../services/dbService';
import { canvasDbService } from '../services/canvasDbService';
import { syncService } from '../services/syncService';
import { weatherService } from '../services/weatherService';
import { updateService, UpdateInfo } from '../services/updateService';
import { apiTestingService } from '../services/apiTestingService';
import pkg from '../package.json';
import AliasManager from './AliasManager';
import { WeatherTester } from './Weather/WeatherTester';
import { ApiTester } from './ApiTester';
import CyberSecPodcast from './CyberSecPodcast';
import { DyslexiaModeControls } from './DyslexiaModeControls';
import { PersonalitySelector } from './PersonalitySelector';
import { RSSFeedManager } from './RSSFeedManager';
import { rssService } from '../services/rssService';
import type { RSSSettings } from '../types/rss';
import { DEFAULT_RSS_SETTINGS } from '../types/rss';

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
    initialTab?: string;
}

const InputGroup = ({ label, value, onChange, icon, onTest, onAdvanced, status, inputClass }: any) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (status === 'loading') setIsAnimating(true);
        if (status === 'success' || status === 'error') {
            setTimeout(() => setIsAnimating(false), 2000);
        }
    }, [status]);

    return (
        <div>
            <label className="block text-xs font-bold mb-1 opacity-80"><i className={`${icon} w-4`}></i> {label}</label>
            <div className="flex gap-2">
                <input type={label.includes('Key') || label.includes('Token') ? 'password' : 'text'} value={value} onChange={e => onChange(e.target.value)} className={`flex-1 rounded px-4 py-2 outline-none ${inputClass}`} />
                {onTest && (
                    <div className="flex gap-1">
                        <button
                            onClick={onTest}
                            disabled={status === 'loading'}
                            className={`px-4 py-1 rounded border border-inherit whitespace-nowrap min-w-[100px] flex items-center justify-center transition-all duration-300 ${status === 'success' ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]' :
                                status === 'error' ? 'bg-red-500/20 border-red-500 text-red-400' :
                                    status === 'loading' ? 'bg-blue-500/20 border-blue-500 text-blue-400' :
                                        'hover:bg-white/5 opacity-80 hover:opacity-100'
                                }`}
                        >
                            {status === 'success' ? (
                                <><i className="fa-solid fa-check mr-2"></i> Active</>
                            ) : status === 'loading' ? (
                                <><i className="fa-solid fa-satellite-dish fa-spin mr-2"></i> Scanning</>
                            ) : status === 'error' ? (
                                <><i className="fa-solid fa-xmark mr-2"></i> Failed</>
                            ) : (
                                <><i className="fa-solid fa-bolt mr-2"></i> Test</>
                            )}
                        </button>
                        {onAdvanced && (
                            <button onClick={onAdvanced} className="px-3 py-1 rounded border border-inherit hover:bg-white/5 text-xs" title="Advanced Debugging">
                                <i className="fa-solid fa-sliders"></i>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, onOpenBackupManager, onOpenTraining, sessions, currentId, onExportChat, onExportAll, onPurgeAll, initialTab }) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [activeTab, setActiveTab] = useState<'general' | 'commands' | 'media' | 'params' | 'providers' | 'ollama' | 'lmstudio' | 'search' | 'mcp' | 'rss' | 'council' | 'accessibility' | 'personality' | 'prompts' | 'security' | 'canvas' | 'radio' | 'podcast' | 'tamagotchi' | 'rangerblock' | 'editor' | 'data' | 'memory' | 'weather' | 'console' | 'about' | 'github'>('general');
    const [commandSearch, setCommandSearch] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['system', 'recon', 'intel']));
    const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: 'loading' | 'success' | 'error' | 'idle' }>({});

    // LM Studio Status Logic
    const [lmStudioStatus, setLmStudioStatus] = useState<'online' | 'offline' | 'checking'>('checking');

    // Poll LM Studio status when tab is active
    useEffect(() => {
        if (activeTab !== 'lmstudio') return;

        const checkStatus = async () => {
            try {
                // Short timeout for status check
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1000);

                const res = await fetch(localSettings.lmstudioBaseUrl || 'http://localhost:1234/v1/models', {
                    method: 'GET',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (res.ok) setLmStudioStatus('online');
                else setLmStudioStatus('offline');
            } catch (e) {
                setLmStudioStatus('offline');
            }
        };

        checkStatus(); // Initial check
        const interval = setInterval(checkStatus, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [activeTab, localSettings.lmstudioBaseUrl]);

    const handleStartLMStudio = async () => {
        try {
            const btn = document.getElementById('start-lmstudio-btn');
            if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Launching...';

            await fetch('http://localhost:3000/api/system/start-app', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appName: 'lmstudio' })
            });

            // Optimistic update
            setTimeout(() => {
                if (btn) btn.innerHTML = '<i class="fa-solid fa-rocket"></i> Launching...';
            }, 2000);
        } catch (error) {
            console.error('Failed to start LM Studio:', error);
            const btn = document.getElementById('start-lmstudio-btn');
            if (btn) btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Error Starting';
        }
    };

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
    const [mcpStatus, setMcpStatus] = useState<'unknown' | 'running' | 'stopped' | 'error'>('unknown');
    const [showAliasManager, setShowAliasManager] = useState(false);
    const [providerView, setProviderView] = useState<'keys' | 'openai' | 'gemini' | 'claude'>('keys');
    const [showConfetti, setShowConfetti] = useState(false);

    // Update Checker State
    const [updateStatus, setUpdateStatus] = useState<UpdateInfo | null>(null);
    const [checkingUpdate, setCheckingUpdate] = useState(false);
    const [installingUpdate, setInstallingUpdate] = useState(false);
    const [updateResult, setUpdateResult] = useState<{ success: boolean; message: string; needsRestart?: boolean } | null>(null);
    const [reloadingServer, setReloadingServer] = useState(false);
    const [reloadResult, setReloadResult] = useState<{ success: boolean; message: string } | null>(null);
    const [stoppingServer, setStoppingServer] = useState(false);
    const [stopResult, setStopResult] = useState<{ success: boolean; message: string } | null>(null);

    // Console Capture State
    const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
    const [consoleFilter, setConsoleFilter] = useState<'all' | 'log' | 'warn' | 'error' | 'info'>('all');
    const [consoleCopied, setConsoleCopied] = useState(false);
    const [consoleAutoScroll, setConsoleAutoScroll] = useState(true);
    const consoleEndRef = useRef<HTMLDivElement>(null);

    // Advanced Weather Tester State
    const [weatherTester, setWeatherTester] = useState<{ isOpen: boolean; provider: 'openweather' | 'tomorrow' | 'visualcrossing' | 'openmeteo'; apiKey: string } | null>(null);

    // RSS State
    const [rssSettings, setRssSettings] = useState<RSSSettings>(DEFAULT_RSS_SETTINGS);
    const [showFeedManager, setShowFeedManager] = useState(false);

    // Generic API Tester State
    const [apiTester, setApiTester] = useState<{
        isOpen: boolean;
        serviceName: string;
        testType: 'llm' | 'search' | 'connection';
        apiKey?: string;
        baseUrl?: string;
        provider?: string;
        defaultModel?: string;
    } | null>(null);

    const confettiPieces = useMemo(() => (
        Array.from({ length: 180 }).map((_, i) => ({
            left: Math.random() * 100,
            delay: Math.random() * 0.8,
            duration: 1.8 + Math.random() * 1.4,
            size: 6 + Math.random() * 8,
            rotate: Math.random() * 720,
            color: ['#10e0c9', '#ff7eb6', '#ffd166', '#7dd3fc', '#c084fc'][i % 5]
        }))
    ), []);

    const triggerConfetti = () => {
        if (localSettings.disableConfetti) return;
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2200);
    };

    const handleCheckUpdate = async () => {
        setCheckingUpdate(true);
        setUpdateResult(null);
        const info = await updateService.checkForUpdates(pkg.version);
        setUpdateStatus(info);
        setCheckingUpdate(false);
    };

    const testWeatherApi = async (provider: 'openweather' | 'tomorrow' | 'visualcrossing') => {
        setConnectionStatus(prev => ({ ...prev, [provider]: 'loading' }));

        // Temporarily update service with local key for testing
        const tempSettings = { ...localSettings };
        weatherService.updateSettings(tempSettings);

        let success = false;
        try {
            if (provider === 'openweather') {
                const res = await weatherService.getOpenWeatherCurrent('London,UK');
                success = !!res;
            } else if (provider === 'tomorrow') {
                const res = await weatherService.getTomorrowCurrent(51.5074, -0.1278);
                success = !!res;
            } else if (provider === 'visualcrossing') {
                const res = await weatherService.getVisualCrossingCurrent('London,UK');
                success = !!res;
            }
        } catch (e) {
            console.error(e);
        }

        setConnectionStatus(prev => ({ ...prev, [provider]: success ? 'success' : 'error' }));
        setTimeout(() => setConnectionStatus(prev => ({ ...prev, [provider]: 'idle' })), 3000);
    };

    const testConnection = async (provider: string, apiKey?: string) => {
        setConnectionStatus(prev => ({ ...prev, [provider]: 'loading' }));
        let success = false;

        try {
            if (provider === 'ollama') {
                success = await checkOllamaConnection(localSettings.ollamaBaseUrl || 'http://localhost:11434');
            } else if (provider === 'lmstudio') {
                success = await checkLMStudioConnection(localSettings.lmstudioBaseUrl || 'http://localhost:1234');
            } else if (provider === 'openai') {
                if (!apiKey) throw new Error('Missing OpenAI API key');
                const res = await fetch('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                success = res.ok;
                if (success) triggerConfetti();
            } else if (['anthropic', 'gemini', 'deepseek', 'groq', 'openrouter'].includes(provider)) {
                if (!apiKey) throw new Error('Missing API key');
                // Lightweight ping using the shared tester
                const modelMap: Record<string, string> = {
                    anthropic: 'claude-3-haiku-20240307',
                    gemini: 'gemini-2.5-flash',
                    deepseek: 'deepseek-chat',
                    groq: 'llama-3.1-8b-instant',
                    openrouter: 'openai/gpt-4.1'
                };
                const result = await apiTestingService.testLLM(provider as any, apiKey, modelMap[provider]);
                success = result.success;
            } else {
                success = !!apiKey && apiKey.length > 5;
            }
        } catch (e) {
            console.error(e);
            success = false;
        }

        setConnectionStatus(prev => ({ ...prev, [provider]: success ? 'success' : 'error' }));
        setTimeout(() => setConnectionStatus(prev => ({ ...prev, [provider]: 'idle' })), 3000);
    };

    const handleInstallUpdate = async () => {
        setInstallingUpdate(true);
        setUpdateResult(null);
        try {
            let proxyUrl = settings.corsProxyUrl || 'http://localhost:3000'; if (proxyUrl.includes(':3010')) proxyUrl = proxyUrl.replace(':3010', ':3000');
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
            let proxyUrl = settings.corsProxyUrl || 'http://localhost:3000'; if (proxyUrl.includes(':3010')) proxyUrl = proxyUrl.replace(':3010', ':3000');
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
            let proxyUrl = settings.corsProxyUrl || 'http://localhost:3000'; if (proxyUrl.includes(':3010')) proxyUrl = proxyUrl.replace(':3010', ':3000');
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
            if (initialTab) {
                setActiveTab(initialTab as any);
            }
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

            // Load RSS settings when opening RSS tab
            if (activeTab === 'rss') {
                loadRssSettings();
            }
        }
    }, [settings, isOpen, activeTab]);

    // Console capture subscription
    useEffect(() => {
        const unsubscribe = consoleCapture.subscribe((entries) => {
            setConsoleEntries(entries);
        });
        return () => unsubscribe();
    }, []);

    // Auto-scroll console when new entries arrive
    useEffect(() => {
        if (consoleAutoScroll && consoleEndRef.current && activeTab === 'console') {
            consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [consoleEntries, consoleAutoScroll, activeTab]);

    // Load blockchain status
    const loadBlockchainStatus = async () => {
        try {
            let proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3000';
            if (proxyUrl.includes(':3010')) proxyUrl = proxyUrl.replace(':3010', ':3000');
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
            let proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3000';
            if (proxyUrl.includes(':3010')) proxyUrl = proxyUrl.replace(':3010', ':3000');
            const response = await fetch(`${proxyUrl}/api/rangerblock/config`);
            const data = await response.json();
            if (data.success) {
                setBlockchainConfig(data.config);
            }
        } catch (error) {
            console.error('Failed to load blockchain config:', error);
        }
    };

    // Load RSS settings
    const loadRssSettings = async () => {
        try {
            const settings = await rssService.loadSettings();
            setRssSettings(settings);
        } catch (error) {
            console.error('Failed to load RSS settings:', error);
        }
    };

    // Save blockchain config
    const saveBlockchainConfig = async () => {
        try {
            let proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3000'; if (proxyUrl.includes(':3010')) proxyUrl = proxyUrl.replace(':3010', ':3000');
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
            let proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3000'; if (proxyUrl.includes(':3010')) proxyUrl = proxyUrl.replace(':3010', ':3000');
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
            let proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3000'; if (proxyUrl.includes(':3010')) proxyUrl = proxyUrl.replace(':3010', ':3000');
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
            let proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3000'; if (proxyUrl.includes(':3010')) proxyUrl = proxyUrl.replace(':3010', ':3000');
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
            // Always use port 3000 (fix for old settings that may have 3010)
            let proxyUrl = localSettings.corsProxyUrl?.replace(/\/$/, '') || 'http://localhost:3000';
            if (proxyUrl.includes(':3010')) {
                proxyUrl = proxyUrl.replace(':3010', ':3000');
            }
            const res = await fetch(`${proxyUrl}/api/health`);
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
        // Do not close on save, just notify
        const btn = document.getElementById('save-settings-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        }
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

    const geminiModelCatalog = [
        { id: 'gemini-3-pro-preview', title: 'Gemini 3 Pro (Preview)', desc: 'Next-gen reasoning and agentic capabilities.' },
        { id: 'gemini-2.5-pro', title: 'Gemini 2.5 Pro', desc: 'Best-in-class reasoning with 2M context window.' },
        { id: 'gemini-2.5-flash', title: 'Gemini 2.5 Flash', desc: 'Ultra-fast, low latency multimodal workhorse.' },
        { id: 'gemini-2.5-flash-lite', title: 'Gemini 2.5 Flash Lite', desc: 'Cost-effective speed for high-volume tasks.' },
        { id: 'gemini-2.5-flash-image', title: 'Gemini 2.5 Flash Image', desc: 'Specialized for high-fidelity image tasks.' },
        { id: 'gemini-2.0-flash', title: 'Gemini 2.0 Flash', desc: 'Balanced multimodal performance.' },
        { id: 'gemini-2.0-flash-lite', title: 'Gemini 2.0 Flash Lite', desc: 'Efficient lightweight model.' },
        { id: 'gemini-2.0-flash-thinking-exp-01-21', title: 'Gemini 2.0 Flash Thinking', desc: 'Experimental model with exposed thought process.' },
    ];

    const openaiModelCatalog = [
        { id: 'gpt-5.1', title: 'GPT-5.1', desc: 'Flagship ChatGPT model with stronger reasoning and coding depth.' },
        { id: 'gpt-5', title: 'GPT-5', desc: 'Previous-gen intelligence with configurable reasoning effort.' },
        { id: 'gpt-5-pro', title: 'GPT-5 Pro', desc: 'Higher quality variant tuned for precision responses.' },
        { id: 'gpt-5-mini', title: 'GPT-5 Mini', desc: 'Faster, cost-efficient for focused tasks.' },
        { id: 'gpt-5-nano', title: 'GPT-5 Nano', desc: 'Lowest latency and cost for lightweight prompts.' },
        { id: 'gpt-5.1-codex', title: 'GPT-5.1 Codex', desc: 'Agentic coding tuned for IDE-like workflows.' },
        { id: 'gpt-5-codex', title: 'GPT-5 Codex', desc: 'Coding-optimized variant of GPT-5.' },
        { id: 'gpt-5.1-codex-mini', title: 'GPT-5.1 Codex Mini', desc: 'Cost saver for rapid code iteration.' },
        { id: 'gpt-4.1', title: 'GPT-4.1', desc: 'Versatile, high-quality omni model with vision.' },
        { id: 'gpt-4.1-mini', title: 'GPT-4.1 Mini', desc: 'Fast, budget-friendly 4.1 tier with vision.' },
        { id: 'gpt-4.1-nano', title: 'GPT-4.1 Nano', desc: 'Ultra-low latency micro tier.' },
        { id: 'gpt-4o', title: 'GPT-4o', desc: 'Omni flagship: strong reasoning + vision/audio.' },
        { id: 'gpt-4o-mini', title: 'GPT-4o Mini', desc: 'Speed-first omni model for quick answers.' },
        { id: 'gpt-4o-search-preview', title: 'GPT-4o Search Preview', desc: 'Search-augmented 4o tuned for retrieval.' },
        { id: 'gpt-4o-mini-search-preview', title: 'GPT-4o Mini Search', desc: 'Fast search-optimized 4o mini.' },
        { id: 'chatgpt-4o-latest', title: 'ChatGPT-4o Latest', desc: 'ChatGPT production routing of 4o.' },
        { id: 'o1', title: 'o1', desc: 'Structured reasoning (non-streamed) for complex tasks.' },
        { id: 'o1-mini', title: 'o1 Mini', desc: 'Cheaper o-series reasoning.' },
        { id: 'o1-pro', title: 'o1 Pro', desc: 'More compute for o1 responses.' },
        { id: 'o3', title: 'o3', desc: 'Reasoning model succeeded by GPT-5; still supported.' },
        { id: 'o3-mini', title: 'o3 Mini', desc: 'Smaller o3 for latency-sensitive flows.' },
        { id: 'o3-pro', title: 'o3 Pro', desc: 'Higher quality o3 variant with extra compute.' },
        { id: 'o3-deep-research', title: 'o3 Deep Research', desc: 'Long-form research agent mode.' },
        { id: 'o4-mini', title: 'o4 Mini', desc: 'Fast reasoning successor to o3 mini.' },
        { id: 'o4-mini-deep-research', title: 'o4 Mini Deep Research', desc: 'Cost-efficient deep research pipeline.' },
    ];

    const claudeModelCatalog = [
        // Claude 4.5 Series (Latest 2025)
        { id: 'claude-opus-4-5-20251101', title: 'Claude Opus 4.5', desc: 'Maximum intelligence. Best for complex analysis, research, and creative tasks.', tier: 'premium', input: '$5', output: '$25' },
        { id: 'claude-sonnet-4-5-20250929', title: 'Claude Sonnet 4.5', desc: 'High intelligence with excellent speed. Great balance for most tasks.', tier: 'flagship', input: '$3', output: '$15' },
        { id: 'claude-haiku-4-5-20251001', title: 'Claude Haiku 4.5', desc: 'Fastest and most cost-effective. Similar coding ability to Sonnet 4.', tier: 'fast', input: '$1', output: '$5' },
        // Claude 4.1 Series
        { id: 'claude-opus-4-1-20250805', title: 'Claude Opus 4.1', desc: 'Previous-gen maximum intelligence with deep reasoning.', tier: 'premium', input: '$15', output: '$75' },
        // Claude 4 Series
        { id: 'claude-sonnet-4-20250514', title: 'Claude Sonnet 4', desc: 'Reliable intelligence for everyday coding and analysis.', tier: 'standard', input: '$3', output: '$15' },
        { id: 'claude-opus-4-20250514', title: 'Claude Opus 4', desc: 'High-end reasoning and creative capabilities.', tier: 'premium', input: '$15', output: '$75' },
        // Claude 3.7 Series
        { id: 'claude-3-7-sonnet-20250219', title: 'Claude 3.7 Sonnet', desc: 'Enhanced reasoning with extended thinking mode.', tier: 'standard', input: '$3', output: '$15' },
        // Claude 3.5 Series
        { id: 'claude-3-5-sonnet-20241022', title: 'Claude 3.5 Sonnet', desc: 'Popular all-rounder with vision support. 200K context.', tier: 'standard', input: '$3', output: '$15' },
        { id: 'claude-3-5-haiku-20241022', title: 'Claude 3.5 Haiku', desc: 'Fast and affordable with great capabilities.', tier: 'fast', input: '$0.80', output: '$4' },
        // Claude 3 Series (Legacy)
        { id: 'claude-3-haiku-20240307', title: 'Claude 3 Haiku', desc: 'Cheapest model. Ultra-fast for simple tasks.', tier: 'budget', input: '$0.25', output: '$1.25' },
    ];

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
                        {['general', 'commands', 'media', 'params', 'providers', 'ollama', 'lmstudio', 'search', 'mcp', 'rss', 'council', 'accessibility', 'personality', 'prompts', 'security', 'canvas', 'radio', 'podcast', 'tamagotchi', 'rangerblock', 'editor', 'data', 'memory', 'weather', 'console', 'about', 'github'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`py-3 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab ? 'border-current opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className={`flex-1 overflow-y-auto p-6 scrollbar-thin ${localSettings.theme === 'tron' ? 'scrollbar-thumb-tron-cyan scrollbar-track-black' : ''}`}>

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

                        {/* COMMANDS TAB - Comprehensive Slash Command Reference */}
                        {activeTab === 'commands' && (
                            <div className="space-y-4">
                                {/* Header with search */}
                                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <i className="fa-solid fa-terminal text-cyan-400"></i>
                                            Slash Commands Reference
                                        </h2>
                                        <p className="text-sm text-zinc-500 mt-1">70+ commands at your fingertips. Type in chat to use.</p>
                                    </div>
                                    {/* Search box */}
                                    <div className="relative w-full md:w-80">
                                        <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"></i>
                                        <input
                                            type="text"
                                            placeholder="Search commands... (e.g., nmap, weather, mcp)"
                                            value={commandSearch}
                                            onChange={(e) => setCommandSearch(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${localSettings.theme === 'tron' ? 'bg-black border-tron-cyan/30 text-tron-cyan placeholder-tron-cyan/50' : 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'}`}
                                        />
                                        {commandSearch && (
                                            <button
                                                onClick={() => setCommandSearch('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                            >
                                                <i className="fa-solid fa-xmark"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {[
                                        { label: 'System', icon: 'fa-cog', count: 11, color: 'text-blue-400' },
                                        { label: 'Recon', icon: 'fa-radar', count: 20, color: 'text-green-400' },
                                        { label: 'Intel', icon: 'fa-user-secret', count: 12, color: 'text-purple-400' },
                                        { label: 'Forensics', icon: 'fa-microscope', count: 10, color: 'text-red-400' },
                                    ].map(stat => (
                                        <div key={stat.label} className={`p-2 rounded-lg ${localSettings.theme === 'tron' ? 'bg-black/50 border border-tron-cyan/20' : 'bg-zinc-800/50'} text-center`}>
                                            <i className={`fa-solid ${stat.icon} ${stat.color}`}></i>
                                            <div className="text-xs text-zinc-500">{stat.label}</div>
                                            <div className="font-bold">{stat.count}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Command Categories */}
                                {(() => {
                                    const allCommands = [
                                        // SYSTEM
                                        { cat: 'system', cmd: '/help', usage: '/help [topic]', desc: 'Show help menu or search for commands', ex: ['/help', '/help nmap', '/help mcp'], icon: 'fa-circle-question', tags: ['help', 'start'] },
                                        { cat: 'system', cmd: '/settings', usage: '/settings', desc: 'Open settings panel', ex: ['/settings'], icon: 'fa-cog', tags: ['config'] },
                                        { cat: 'system', cmd: '/about', usage: '/about', desc: 'About RangerPlex', ex: ['/about'], icon: 'fa-info-circle', tags: ['info'] },
                                        { cat: 'system', cmd: '/manual', usage: '/manual', desc: 'Open documentation manual', ex: ['/manual'], icon: 'fa-book', tags: ['docs', 'help'] },
                                        { cat: 'system', cmd: '/study', usage: '/study', desc: 'Open Study Clock (Pomodoro timer)', ex: ['/study'], icon: 'fa-clock', tags: ['focus', 'timer'] },
                                        { cat: 'system', cmd: '/wordpress', usage: '/wordpress', desc: 'Open WordPress Command Center', ex: ['/wordpress'], icon: 'fa-wordpress', tags: ['cms', 'blog'] },
                                        { cat: 'system', cmd: '/sys-info', usage: '/sys-info', desc: 'System diagnostics report', ex: ['/sys-info'], icon: 'fa-microchip', tags: ['diagnostics'] },
                                        { cat: 'system', cmd: '/restart', usage: '/restart', desc: 'Restart proxy server', ex: ['/restart'], icon: 'fa-rotate-right', tags: ['server'] },
                                        { cat: 'system', cmd: '/podcasts', usage: '/podcasts', desc: 'Open CyberSec Podcast Hub', ex: ['/podcasts', '/podcast', '/radio'], icon: 'fa-headphones', tags: ['audio', 'learning'] },
                                        { cat: 'system', cmd: 'canvas', usage: 'canvas', desc: 'Open Canvas drawing board', ex: ['canvas'], icon: 'fa-paintbrush', tags: ['draw', 'creative'] },
                                        { cat: 'system', cmd: '/deathstar', usage: '/deathstar', desc: '⚫ Easter egg animation', ex: ['/deathstar'], icon: 'fa-moon', tags: ['fun', 'easter'] },

                                        // RECON
                                        { cat: 'recon', cmd: '/whois', usage: '/whois <domain>', desc: 'Domain registration lookup', ex: ['/whois example.com'], icon: 'fa-id-card', tags: ['domain'] },
                                        { cat: 'recon', cmd: '/dns', usage: '/dns <domain>', desc: 'DNS records lookup (A, MX, NS, TXT)', ex: ['/dns example.com'], icon: 'fa-server', tags: ['domain', 'records'] },
                                        { cat: 'recon', cmd: '/subdomains', usage: '/subdomains <domain>', desc: 'Discover subdomains via crt.sh', ex: ['/subdomains example.com'], icon: 'fa-sitemap', tags: ['domain', 'enum'] },
                                        { cat: 'recon', cmd: '/certs', usage: '/certs <domain>', desc: 'SSL certificate enumeration', ex: ['/certs example.com'], icon: 'fa-certificate', tags: ['ssl', 'domain'] },
                                        { cat: 'recon', cmd: '/ssl', usage: '/ssl <domain>', desc: 'SSL/TLS certificate inspector', ex: ['/ssl example.com'], icon: 'fa-lock', tags: ['security'] },
                                        { cat: 'recon', cmd: '/headers', usage: '/headers <url>', desc: 'HTTP security headers check', ex: ['/headers https://example.com'], icon: 'fa-file-code', tags: ['security', 'web'] },
                                        { cat: 'recon', cmd: '/reverse', usage: '/reverse <ip>', desc: 'Reverse DNS lookup', ex: ['/reverse 8.8.8.8'], icon: 'fa-backward', tags: ['dns', 'ip'] },
                                        { cat: 'recon', cmd: '/geoip', usage: '/geoip <ip>', desc: 'IP geolocation lookup', ex: ['/geoip 8.8.8.8'], icon: 'fa-location-dot', tags: ['ip', 'location'] },
                                        { cat: 'recon', cmd: '/ipinfo', usage: '/ipinfo <ip>', desc: 'Advanced IP intelligence', ex: ['/ipinfo 8.8.8.8'], icon: 'fa-globe', tags: ['ip', 'intel'] },
                                        { cat: 'recon', cmd: '/myip', usage: '/myip', desc: 'Your public IP address', ex: ['/myip'], icon: 'fa-wifi', tags: ['ip', 'self'] },
                                        { cat: 'recon', cmd: '/iprecon', usage: '/iprecon <ip>', desc: 'Threat intel (VPN/Proxy detection)', ex: ['/iprecon 8.8.8.8'], icon: 'fa-shield-halved', tags: ['threat', 'ip'] },
                                        { cat: 'recon', cmd: '/asn', usage: '/asn <ip_or_asn>', desc: 'ASN lookup and IP ranges', ex: ['/asn 8.8.8.8', '/asn AS15169'], icon: 'fa-network-wired', tags: ['network'] },
                                        { cat: 'recon', cmd: '/mac', usage: '/mac <mac_address>', desc: 'MAC address vendor lookup', ex: ['/mac 00:1A:2B:3C:4D:5E'], icon: 'fa-ethernet', tags: ['hardware'] },
                                        { cat: 'recon', cmd: '/trace', usage: '/trace <host>', desc: 'Traceroute to destination', ex: ['/trace example.com'], icon: 'fa-route', tags: ['network', 'path'] },
                                        { cat: 'recon', cmd: '/ports', usage: '/ports <ip> [ports]', desc: 'Quick TCP port scan', ex: ['/ports 1.1.1.1', '/ports 10.10.10.50 22,80,443'], icon: 'fa-door-open', tags: ['scan'] },
                                        { cat: 'recon', cmd: '/nmap', usage: '/nmap <target> [flags]', desc: 'Full Nmap scanner (CTF/authorized only)', ex: ['/nmap 10.10.10.50', '/nmap 10.10.10.50 -sV -sC'], icon: 'fa-crosshairs', tags: ['scan', 'pentest'] },
                                        { cat: 'recon', cmd: '/profile', usage: '/profile <domain>', desc: 'Full domain profile (WHOIS+DNS+SSL+AI)', ex: ['/profile example.com'], icon: 'fa-magnifying-glass-chart', tags: ['intel', 'domain'] },
                                        { cat: 'recon', cmd: '/reputation', usage: '/reputation <domain>', desc: 'Google Safe Browsing check', ex: ['/reputation example.com'], icon: 'fa-check-circle', tags: ['safety'] },
                                        { cat: 'recon', cmd: '/privacy', usage: '/privacy', desc: 'Privacy fingerprinting snapshot', ex: ['/privacy'], icon: 'fa-eye-slash', tags: ['privacy'] },

                                        // INTELLIGENCE
                                        { cat: 'intel', cmd: '/sherlock', usage: '/sherlock <username>', desc: 'Username search across 12+ platforms', ex: ['/sherlock johndoe'], icon: 'fa-user-secret', tags: ['osint', 'social'] },
                                        { cat: 'intel', cmd: '/breach', usage: '/breach <email>', desc: 'Check email in data breaches (HIBP)', ex: ['/breach user@example.com'], icon: 'fa-database', tags: ['security', 'email'] },
                                        { cat: 'intel', cmd: '/phone', usage: '/phone <number>', desc: 'Phone number analysis', ex: ['/phone +353861234567'], icon: 'fa-phone', tags: ['osint'] },
                                        { cat: 'intel', cmd: '/email', usage: '/email <address>', desc: 'Email validation & SMTP check', ex: ['/email user@example.com'], icon: 'fa-envelope', tags: ['validation'] },
                                        { cat: 'intel', cmd: '/company', usage: '/company <name> [country]', desc: 'Company registry lookup', ex: ['/company Apple US', '/company Google'], icon: 'fa-building', tags: ['osint', 'business'] },
                                        { cat: 'intel', cmd: '/shodan', usage: '/shodan <ip>', desc: 'Shodan IP exposure scan (needs API)', ex: ['/shodan 8.8.8.8'], icon: 'fa-binoculars', tags: ['security', 'vuln'] },
                                        { cat: 'intel', cmd: '/scan', usage: '/scan <url>', desc: 'VirusTotal URL scanner', ex: ['/scan https://example.com'], icon: 'fa-virus-slash', tags: ['malware', 'safety'] },
                                        { cat: 'intel', cmd: '/screenshot', usage: '/screenshot <url>', desc: 'Capture website screenshot', ex: ['/screenshot https://example.com'], icon: 'fa-camera', tags: ['evidence'] },
                                        { cat: 'intel', cmd: '/wayback', usage: '/wayback <url>', desc: 'Internet Archive history', ex: ['/wayback https://example.com'], icon: 'fa-clock-rotate-left', tags: ['archive', 'history'] },
                                        { cat: 'intel', cmd: '/news', usage: '/news <query>', desc: 'Search news articles', ex: ['/news cybersecurity'], icon: 'fa-newspaper', tags: ['osint'] },
                                        { cat: 'intel', cmd: '/weather', usage: '/weather [city]', desc: 'Weather forecast', ex: ['/weather', '/weather Dublin'], icon: 'fa-cloud-sun', tags: ['utility'] },

                                        // FORENSICS
                                        { cat: 'forensics', cmd: '/hash', usage: '/hash <file_or_value>', desc: 'Calculate file hash (MD5/SHA)', ex: ['/hash /path/to/file'], icon: 'fa-fingerprint', tags: ['integrity'] },
                                        { cat: 'forensics', cmd: '/metadata', usage: '/metadata <file>', desc: 'Extract file metadata', ex: ['/metadata /path/to/doc.pdf'], icon: 'fa-file-lines', tags: ['analysis'] },
                                        { cat: 'forensics', cmd: '/exif', usage: '/exif <image>', desc: 'Extract EXIF data from image', ex: ['/exif /path/to/photo.jpg'], icon: 'fa-image', tags: ['image'] },
                                        { cat: 'forensics', cmd: '/timeline', usage: '/timeline <file>', desc: 'Generate file timeline', ex: ['/timeline /path/to/file'], icon: 'fa-timeline', tags: ['analysis'] },
                                        { cat: 'forensics', cmd: '/strings', usage: '/strings <file>', desc: 'Extract readable strings', ex: ['/strings /path/to/binary'], icon: 'fa-font', tags: ['analysis'] },
                                        { cat: 'forensics', cmd: '/grep', usage: '/grep <pattern> <file>', desc: 'Pattern search in file', ex: ['/grep password config.txt'], icon: 'fa-magnifying-glass', tags: ['search'] },
                                        { cat: 'forensics', cmd: '/custody', usage: '/custody <action>', desc: 'Chain of custody management', ex: ['/custody-create', '/custody-update', '/custody-verify'], icon: 'fa-link', tags: ['evidence', 'legal'] },

                                        // MALWARE
                                        { cat: 'malware', cmd: '/malware-hash', usage: '/malware-hash <file>', desc: 'Multi-hash report (MD5/SHA1/SHA256)', ex: ['/malware-hash /path/to/sample'], icon: 'fa-skull-crossbones', tags: ['analysis'] },
                                        { cat: 'malware', cmd: '/malware-strings', usage: '/malware-strings <file>', desc: 'Extract strings & IOCs', ex: ['/malware-strings /path/to/sample'], icon: 'fa-bug', tags: ['analysis'] },
                                        { cat: 'malware', cmd: '/malware-entropy', usage: '/malware-entropy <file>', desc: 'Calculate file entropy (packing detection)', ex: ['/malware-entropy /path/to/sample'], icon: 'fa-chart-line', tags: ['analysis'] },
                                        { cat: 'malware', cmd: '/hexdump', usage: '/hexdump <file>', desc: 'Hex dump of file', ex: ['/hexdump /path/to/binary'], icon: 'fa-code', tags: ['analysis'] },
                                        { cat: 'malware', cmd: '/ioc-extract', usage: '/ioc-extract <file>', desc: 'Extract IOCs (IPs, URLs, hashes)', ex: ['/ioc-extract /path/to/sample'], icon: 'fa-shield-virus', tags: ['threat'] },
                                        { cat: 'malware', cmd: '/malware-pe', usage: '/malware-pe <file>', desc: 'PE header analysis (Windows)', ex: ['/malware-pe /path/to/exe'], icon: 'fa-windows', tags: ['binary'] },
                                        { cat: 'malware', cmd: '/malware-elf', usage: '/malware-elf <file>', desc: 'ELF header analysis (Linux)', ex: ['/malware-elf /path/to/binary'], icon: 'fa-linux', tags: ['binary'] },
                                        { cat: 'malware', cmd: '/vm-start', usage: '/vm-start <vm>', desc: 'Start analysis VM', ex: ['/vm-start kali'], icon: 'fa-play', tags: ['vm'] },
                                        { cat: 'malware', cmd: '/msf', usage: '/msf <command>', desc: 'Metasploit command (to Kali)', ex: ['/msf db_nmap -sV 10.10.10.50'], icon: 'fa-terminal', tags: ['pentest'] },

                                        // CRYPTO
                                        { cat: 'crypto', cmd: '/crypto', usage: '/crypto <symbol>', desc: 'Cryptocurrency price lookup', ex: ['/crypto btc', '/crypto eth'], icon: 'fa-bitcoin-sign', tags: ['price', 'market'] },
                                        { cat: 'crypto', cmd: '/wallet', usage: '/wallet <btc_address>', desc: 'Bitcoin wallet inspector', ex: ['/wallet 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'], icon: 'fa-wallet', tags: ['blockchain'] },

                                        // SEARCH & AI
                                        { cat: 'search', cmd: '/perplexity', usage: '/perplexity <query>', desc: 'AI-powered web search (Sonar)', ex: ['/perplexity best M3 Pro price', '/perplexity latest AI news'], icon: 'fa-brain', tags: ['ai', 'web'] },
                                        { cat: 'search', cmd: '/ducky', usage: '/ducky <query>', desc: 'DuckDuckGo search via MCP', ex: ['/ducky weather Dublin', '/ducky programming tips'], icon: 'fa-duck', tags: ['web'] },
                                        { cat: 'search', cmd: '/imagine', usage: '/imagine <prompt>', desc: 'Generate AI images (DALL-E 3)', ex: ['/imagine cyberpunk fox', '/imagine sunset Dublin'], icon: 'fa-wand-magic-sparkles', tags: ['creative', 'ai'] },

                                        // MCP
                                        { cat: 'mcp', cmd: '/mcp-tools', usage: '/mcp-tools', desc: 'List available MCP tools', ex: ['/mcp-tools'], icon: 'fa-toolbox', tags: ['docker'] },
                                        { cat: 'mcp', cmd: '/mcp-commands', usage: '/mcp-commands', desc: 'MCP cheat sheet', ex: ['/mcp-commands'], icon: 'fa-list-check', tags: ['help'] },
                                        { cat: 'mcp', cmd: '/mcp-<tool>', usage: '/mcp-<tool> [input]', desc: 'Call any MCP tool directly', ex: ['/mcp-brave_web_search AI news', '/mcp-fetch https://example.com'], icon: 'fa-plug', tags: ['docker', 'tools'] },

                                        // FUN
                                        { cat: 'fun', cmd: '/chuck', usage: '/chuck', desc: 'Random Chuck Norris fact', ex: ['/chuck'], icon: 'fa-hand-fist', tags: ['joke'] },
                                        { cat: 'fun', cmd: '/joke', usage: '/joke', desc: 'Random programming joke', ex: ['/joke'], icon: 'fa-face-laugh-beam', tags: ['humor'] },
                                        { cat: 'fun', cmd: '/bible', usage: '/bible [verse]', desc: 'Bible verse lookup', ex: ['/bible', '/bible John 3:16'], icon: 'fa-book-bible', tags: ['spiritual'] },
                                    ];

                                    const categories = [
                                        { id: 'system', name: 'System & UI', icon: 'fa-cog', color: 'text-blue-400', desc: 'App controls, settings, utilities' },
                                        { id: 'recon', name: 'Reconnaissance', icon: 'fa-radar', color: 'text-green-400', desc: 'Domain, IP, network scanning' },
                                        { id: 'intel', name: 'Intelligence', icon: 'fa-user-secret', color: 'text-purple-400', desc: 'OSINT, people, threats' },
                                        { id: 'forensics', name: 'Forensics', icon: 'fa-microscope', color: 'text-red-400', desc: 'File analysis, evidence' },
                                        { id: 'malware', name: 'Malware Analysis', icon: 'fa-virus', color: 'text-orange-400', desc: 'Binary analysis, VMs' },
                                        { id: 'crypto', name: 'Cryptocurrency', icon: 'fa-bitcoin-sign', color: 'text-yellow-400', desc: 'Prices, wallets' },
                                        { id: 'search', name: 'Search & AI', icon: 'fa-brain', color: 'text-cyan-400', desc: 'Web search, image gen' },
                                        { id: 'mcp', name: 'MCP Tools', icon: 'fa-docker', color: 'text-sky-400', desc: 'Docker MCP gateway' },
                                        { id: 'fun', name: 'Fun & Easter Eggs', icon: 'fa-gamepad', color: 'text-pink-400', desc: 'Jokes, surprises' },
                                    ];

                                    const q = commandSearch.toLowerCase();
                                    const filteredCommands = q
                                        ? allCommands.filter(c =>
                                            c.cmd.toLowerCase().includes(q) ||
                                            c.desc.toLowerCase().includes(q) ||
                                            c.tags.some(t => t.includes(q)) ||
                                            c.ex.some(e => e.toLowerCase().includes(q))
                                        )
                                        : allCommands;

                                    const toggleCategory = (catId: string) => {
                                        setExpandedCategories(prev => {
                                            const next = new Set(prev);
                                            if (next.has(catId)) next.delete(catId);
                                            else next.add(catId);
                                            return next;
                                        });
                                    };

                                    const copyCommand = (cmd: string) => {
                                        navigator.clipboard.writeText(cmd);
                                    };

                                    return (
                                        <div className="space-y-3 mt-4">
                                            {categories.map(cat => {
                                                const catCommands = filteredCommands.filter(c => c.cat === cat.id);
                                                if (catCommands.length === 0) return null;
                                                const isExpanded = expandedCategories.has(cat.id) || !!commandSearch;

                                                return (
                                                    <div key={cat.id} className={`rounded-lg border ${localSettings.theme === 'tron' ? 'border-tron-cyan/30 bg-black/30' : 'border-zinc-700 bg-zinc-800/30'}`}>
                                                        {/* Category Header */}
                                                        <button
                                                            onClick={() => toggleCategory(cat.id)}
                                                            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors rounded-t-lg"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <i className={`fa-solid ${cat.icon} ${cat.color} w-5`}></i>
                                                                <span className="font-bold">{cat.name}</span>
                                                                <span className="text-xs text-zinc-500">({catCommands.length})</span>
                                                                <span className="text-xs text-zinc-600 hidden md:inline">— {cat.desc}</span>
                                                            </div>
                                                            <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-zinc-500`}></i>
                                                        </button>

                                                        {/* Commands */}
                                                        {isExpanded && (
                                                            <div className="border-t border-inherit">
                                                                {catCommands.map((c, idx) => (
                                                                    <div
                                                                        key={c.cmd}
                                                                        className={`p-3 ${idx > 0 ? 'border-t border-inherit' : ''} hover:bg-white/5 transition-colors group`}
                                                                    >
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                                    <code className={`px-2 py-0.5 rounded text-sm font-mono ${localSettings.theme === 'tron' ? 'bg-tron-cyan/20 text-tron-cyan' : 'bg-cyan-900/50 text-cyan-300'}`}>
                                                                                        {c.cmd}
                                                                                    </code>
                                                                                    {c.tags.slice(0, 2).map(tag => (
                                                                                        <span key={tag} className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-700 text-zinc-400">
                                                                                            {tag}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                                <p className="text-sm text-zinc-400 mt-1">{c.desc}</p>
                                                                                <div className="text-xs text-zinc-600 mt-1">
                                                                                    <span className="text-zinc-500">Usage:</span> <code className="text-zinc-400">{c.usage}</code>
                                                                                </div>
                                                                                <div className="text-xs text-zinc-600 mt-0.5">
                                                                                    <span className="text-zinc-500">Examples:</span>{' '}
                                                                                    {c.ex.map((ex, i) => (
                                                                                        <span key={ex}>
                                                                                            <code
                                                                                                className="text-emerald-400/70 cursor-pointer hover:text-emerald-300"
                                                                                                onClick={() => copyCommand(ex)}
                                                                                                title="Click to copy"
                                                                                            >
                                                                                                {ex}
                                                                                            </code>
                                                                                            {i < c.ex.length - 1 && ', '}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => copyCommand(c.cmd)}
                                                                                className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded transition-all"
                                                                                title="Copy command"
                                                                            >
                                                                                <i className="fa-solid fa-copy"></i>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {filteredCommands.length === 0 && (
                                                <div className="text-center py-8 text-zinc-500">
                                                    <i className="fa-solid fa-search text-3xl mb-2"></i>
                                                    <p>No commands found for "{commandSearch}"</p>
                                                    <p className="text-xs mt-1">Try: nmap, weather, mcp, sherlock, hash</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Pro Tips */}
                                <div className={`mt-6 p-4 rounded-lg ${localSettings.theme === 'tron' ? 'bg-tron-cyan/10 border border-tron-cyan/30' : 'bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border border-cyan-700/30'}`}>
                                    <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                                        <i className="fa-solid fa-lightbulb text-yellow-400"></i>
                                        Pro Tips
                                    </h3>
                                    <ul className="text-xs text-zinc-400 space-y-1">
                                        <li>• Type <code className="text-cyan-400">/help &lt;topic&gt;</code> in chat for quick help</li>
                                        <li>• Click any example to copy it to clipboard</li>
                                        <li>• Commands starting with <code className="text-cyan-400">/nmap</code> or <code className="text-cyan-400">/shodan</code> require authorization</li>
                                        <li>• Use <code className="text-cyan-400">/mcp-tools</code> to discover 30+ Docker MCP tools</li>
                                        <li>• Chain commands for comprehensive investigations</li>
                                    </ul>
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
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div>
                                        <h3 className="font-bold text-lg">Provider Console</h3>
                                        <p className="text-xs opacity-70">Wire up API keys or explore model catalogs from OpenAI, Google, and Anthropic.</p>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        {[
                                            { id: 'keys', label: 'API Keys', icon: 'fa-key' },
                                            { id: 'openai', label: 'OpenAI Models', icon: 'fa-rocket' },
                                            { id: 'gemini', label: 'Gemini Models', icon: 'fa-brands fa-google' },
                                            { id: 'claude', label: 'Claude Models', icon: 'fa-brain' }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setProviderView(tab.id as 'keys' | 'openai' | 'gemini' | 'claude')}
                                                className={`px-3 py-1.5 rounded text-xs font-bold border transition-all flex items-center gap-2 ${providerView === tab.id ? 'bg-teal-600 text-white border-transparent shadow-lg' : 'border-inherit hover:bg-white/5'}`}
                                            >
                                                <i className={`fa-solid ${tab.icon}`}></i>
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {providerView === 'keys' && (
                                    <div className="space-y-6">
                                        <InputGroup
                                            label="Gemini API Key"
                                            value={localSettings.geminiApiKey}
                                            onChange={(v: string) => setLocalSettings({ ...localSettings, geminiApiKey: v })}
                                            icon="fa-brands fa-google"
                                            inputClass={inputClass}
                                            onTest={() => testConnection('gemini', localSettings.geminiApiKey)}
                                            onAdvanced={() => setApiTester({ isOpen: true, serviceName: 'Google Gemini', testType: 'llm', apiKey: localSettings.geminiApiKey, provider: 'gemini', defaultModel: 'gemini-2.5-flash' })}
                                            status={connectionStatus['gemini']}
                                        />
                                        <InputGroup
                                            label="OpenAI API Key"
                                            value={localSettings.openaiApiKey || ''}
                                            onChange={(v: string) => setLocalSettings({ ...localSettings, openaiApiKey: v })}
                                            icon="fa-solid fa-bolt"
                                            inputClass={inputClass}
                                            onTest={() => testConnection('openai', localSettings.openaiApiKey)}
                                            onAdvanced={() => setApiTester({ isOpen: true, serviceName: 'OpenAI', testType: 'llm', apiKey: localSettings.openaiApiKey, provider: 'openai', defaultModel: 'gpt-4.1' })}
                                            status={connectionStatus['openai']}
                                        />
                                        <InputGroup
                                            label="Anthropic API Key"
                                            value={localSettings.anthropicApiKey || ''}
                                            onChange={(v: string) => setLocalSettings({ ...localSettings, anthropicApiKey: v })}
                                            icon="fa-solid fa-brain"
                                            inputClass={inputClass}
                                            onTest={() => testConnection('anthropic', localSettings.anthropicApiKey)}
                                            onAdvanced={() => setApiTester({ isOpen: true, serviceName: 'Anthropic', testType: 'llm', apiKey: localSettings.anthropicApiKey, provider: 'anthropic', defaultModel: 'claude-3-haiku-20240307' })}
                                            status={connectionStatus['anthropic']}
                                        />
                                        <InputGroup
                                            label="DeepSeek API Key"
                                            value={localSettings.deepseekApiKey || ''}
                                            onChange={(v: string) => setLocalSettings({ ...localSettings, deepseekApiKey: v })}
                                            icon="fa-solid fa-code"
                                            inputClass={inputClass}
                                            onTest={() => testConnection('deepseek', localSettings.deepseekApiKey)}
                                            onAdvanced={() => setApiTester({ isOpen: true, serviceName: 'DeepSeek', testType: 'llm', apiKey: localSettings.deepseekApiKey, provider: 'deepseek', defaultModel: 'deepseek-chat' })}
                                            status={connectionStatus['deepseek']}
                                        />
                                        <InputGroup
                                            label="Groq API Key"
                                            value={localSettings.groqApiKey || ''}
                                            onChange={(v: string) => setLocalSettings({ ...localSettings, groqApiKey: v })}
                                            icon="fa-solid fa-bolt"
                                            inputClass={inputClass}
                                            onTest={() => testConnection('groq', localSettings.groqApiKey)}
                                            onAdvanced={() => setApiTester({ isOpen: true, serviceName: 'Groq', testType: 'llm', apiKey: localSettings.groqApiKey, provider: 'groq', defaultModel: 'llama-3.1-8b-instant' })}
                                            status={connectionStatus['groq']}
                                        />
                                        <InputGroup
                                            label="OpenRouter API Key"
                                            value={localSettings.openRouterApiKey || ''}
                                            onChange={(v: string) => setLocalSettings({ ...localSettings, openRouterApiKey: v })}
                                            icon="fa-solid fa-network-wired"
                                            inputClass={inputClass}
                                            onTest={() => testConnection('openrouter', localSettings.openRouterApiKey)}
                                            onAdvanced={() => setApiTester({ isOpen: true, serviceName: 'OpenRouter', testType: 'llm', apiKey: localSettings.openRouterApiKey, provider: 'openrouter', defaultModel: 'openai/gpt-4.1' })}
                                            status={connectionStatus['openrouter']}
                                        />
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
                                    </div>
                                )}

                                {providerView === 'openai' && (
                                    <div className="space-y-4">
                                        <div className="p-5 rounded-xl border border-teal-500/40 bg-gradient-to-r from-[#0d1b2a] via-[#122b39] to-[#0d1b2a] text-white shadow-lg">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <div className="uppercase text-[11px] tracking-[0.2em] opacity-70">OpenAI Catalog</div>
                                                    <div className="text-xl font-bold">ChatGPT Models in RangerPlex</div>
                                                    <div className="text-xs opacity-80 mt-1">Detected {localSettings.availableModels.openai.length} models • Click refresh after updating your key.</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => testConnection('openai', localSettings.openaiApiKey)}
                                                        className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold flex items-center gap-2"
                                                    >
                                                        {connectionStatus['openai'] === 'loading' ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-plug"></i>}
                                                        {connectionStatus['openai'] === 'success' ? 'Key OK' : connectionStatus['openai'] === 'error' ? 'Test Failed' : 'Test OpenAI Key'}
                                                    </button>
                                                    <button
                                                        onClick={fetchAllModels}
                                                        className="px-3 py-2 rounded bg-teal-500 text-black font-bold text-xs hover:bg-teal-400 flex items-center gap-2"
                                                        disabled={loadingModels}
                                                    >
                                                        {loadingModels ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-rotate"></i>}
                                                        {loadingModels ? 'Refreshing…' : 'Refresh Models'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                            {openaiModelCatalog.map(model => {
                                                const available = localSettings.availableModels.openai.includes(model.id);
                                                const badges = getModelBadges(model.id);
                                                return (
                                                    <div key={model.id} className={`p-4 rounded-lg border ${available ? 'border-teal-500/50 bg-teal-500/5' : 'border-zinc-700/60 bg-black/40'} shadow-inner`}>
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-bold">{model.title}</span>
                                                                    {available && <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-600 text-black font-bold">Available</span>}
                                                                </div>
                                                                <div className="text-xs opacity-70 mt-1 leading-snug">{model.desc}</div>
                                                            </div>
                                                            {badges && <span className="text-lg opacity-70" title="Capabilities">{badges}</span>}
                                                        </div>
                                                        <div className="text-[11px] mt-2 opacity-60">ID: <code className="bg-black/30 px-1 rounded">{model.id}</code></div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {providerView === 'gemini' && (
                                    <div className="space-y-4">
                                        <div className="p-5 rounded-xl border border-blue-500/40 bg-gradient-to-r from-[#0d1b2a] via-[#1e3a8a] to-[#0d1b2a] text-white shadow-lg">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <div className="uppercase text-[11px] tracking-[0.2em] opacity-70">Google DeepMind</div>
                                                    <div className="text-xl font-bold">Gemini Models in RangerPlex</div>
                                                    <div className="text-xs opacity-80 mt-1">Detected {localSettings.availableModels.gemini.length} models • Click refresh after updating your key.</div>
                                                </div>
                                                <div className="flex gap-3 items-center">
                                                    <label className="text-[11px] flex items-center gap-2 opacity-80 select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!localSettings.disableConfetti}
                                                            onChange={(e) => setLocalSettings({ ...localSettings, disableConfetti: e.target.checked })}
                                                            className="accent-current"
                                                        />
                                                        No confetti
                                                    </label>
                                                    <button
                                                        onClick={() => testConnection('gemini', localSettings.geminiApiKey)}
                                                        className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold flex items-center gap-2"
                                                    >
                                                        {connectionStatus['gemini'] === 'loading' ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-plug"></i>}
                                                        {connectionStatus['gemini'] === 'success' ? 'Key OK' : connectionStatus['gemini'] === 'error' ? 'Test Failed' : 'Test Gemini Key'}
                                                    </button>
                                                    <button
                                                        onClick={fetchAllModels}
                                                        className="px-3 py-2 rounded bg-blue-500 text-white font-bold text-xs hover:bg-blue-400 flex items-center gap-2"
                                                        disabled={loadingModels}
                                                    >
                                                        {loadingModels ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-rotate"></i>}
                                                        {loadingModels ? 'Refreshing…' : 'Refresh Models'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                            {geminiModelCatalog.map(model => {
                                                const available = localSettings.availableModels.gemini.includes(model.id);
                                                return (
                                                    <div key={model.id} className={`p-4 rounded-lg border ${available ? 'border-blue-500/50 bg-blue-500/5' : 'border-zinc-700/60 bg-black/40'} shadow-inner`}>
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-bold">{model.title}</span>
                                                                    {available && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">Available</span>}
                                                                </div>
                                                                <div className="text-xs opacity-70 mt-1 leading-snug">{model.desc}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-[11px] mt-2 opacity-60">ID: <code className="bg-black/30 px-1 rounded">{model.id}</code></div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {providerView === 'claude' && (
                                    <div className="space-y-4">
                                        <div className="p-5 rounded-xl border border-orange-500/40 bg-gradient-to-r from-[#0d1b2a] via-[#2d1810] to-[#0d1b2a] text-white shadow-lg">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <div className="uppercase text-[11px] tracking-[0.2em] opacity-70">Anthropic</div>
                                                    <div className="text-xl font-bold">Claude Models in RangerPlex</div>
                                                    <div className="text-xs opacity-80 mt-1">Detected {localSettings.availableModels.anthropic.length} models • Pricing per million tokens</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => testConnection('anthropic', localSettings.anthropicApiKey)}
                                                        className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold flex items-center gap-2"
                                                    >
                                                        {connectionStatus['anthropic'] === 'loading' ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-plug"></i>}
                                                        {connectionStatus['anthropic'] === 'success' ? 'Key OK' : connectionStatus['anthropic'] === 'error' ? 'Test Failed' : 'Test Claude Key'}
                                                    </button>
                                                    <a
                                                        href="https://console.anthropic.com/"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-2 rounded bg-orange-500 text-white font-bold text-xs hover:bg-orange-400 flex items-center gap-2"
                                                    >
                                                        <i className="fa-solid fa-key"></i>
                                                        Get API Key
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                            {claudeModelCatalog.map(model => {
                                                const available = localSettings.availableModels.anthropic.includes(model.id);
                                                const tierColors: Record<string, string> = {
                                                    premium: 'bg-purple-600',
                                                    flagship: 'bg-orange-500',
                                                    standard: 'bg-blue-500',
                                                    fast: 'bg-green-500',
                                                    budget: 'bg-gray-500'
                                                };
                                                return (
                                                    <div key={model.id} className={`p-4 rounded-lg border ${available ? 'border-orange-500/50 bg-orange-500/5' : 'border-zinc-700/60 bg-black/40'} shadow-inner`}>
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-sm font-bold">{model.title}</span>
                                                                    {available && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-600 text-white font-bold">Available</span>}
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${tierColors[model.tier]} text-white font-bold capitalize`}>{model.tier}</span>
                                                                </div>
                                                                <div className="text-xs opacity-70 mt-1 leading-snug">{model.desc}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <div className="text-[11px] opacity-60">ID: <code className="bg-black/30 px-1 rounded">{model.id}</code></div>
                                                            <div className="text-[10px] opacity-80 font-mono">
                                                                <span className="text-green-400">{model.input}</span> / <span className="text-red-400">{model.output}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="p-4 rounded-lg border border-inherit bg-black/20">
                                            <h4 className="font-bold text-sm mb-2"><i className="fa-solid fa-info-circle mr-2"></i>Cost Optimization Tips</h4>
                                            <ul className="text-xs opacity-80 space-y-1 list-disc list-inside">
                                                <li><strong>Batch API:</strong> 50% discount on both input and output tokens</li>
                                                <li><strong>Prompt Caching:</strong> Up to 90% cost savings on repeated context</li>
                                                <li><strong>Haiku 4.5:</strong> Same coding ability as Sonnet 4 at 1/3 the cost</li>
                                                <li><strong>Claude 3 Haiku:</strong> Best budget option for simple tasks</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}

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

                                        {/* Ollama Model Selection */}
                                        <div className="p-3 border border-inherit rounded bg-black/20">
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
                                                    onClick={async () => {
                                                        const btn = document.getElementById('ollama-refresh-btn');
                                                        if (btn) {
                                                            btn.innerHTML = '<i class="fa-solid fa-terminal"></i> SCANNING...';
                                                            btn.classList.add('bg-green-600', 'text-white', 'shadow-[0_0_15px_#22c55e]');
                                                        }
                                                        await new Promise(r => setTimeout(r, 1000));
                                                        await fetchOllamaModelsOnly();
                                                        if (btn) {
                                                            btn.innerHTML = '<i class="fa-solid fa-rotate"></i> REFRESH LIST';
                                                            btn.classList.remove('bg-green-600', 'text-white', 'shadow-[0_0_15px_#22c55e]');
                                                        }
                                                    }}
                                                    id="ollama-refresh-btn"
                                                    className="px-4 py-2 bg-green-500/10 border border-green-500/50 text-green-500 rounded text-xs font-bold uppercase hover:bg-green-500/20 transition-all whitespace-nowrap"
                                                    title="Refresh model list from Ollama"
                                                >
                                                    <i className="fa-solid fa-rotate"></i>
                                                    Refresh List
                                                </button>
                                            </div>
                                            <p className="text-[10px] opacity-60 mt-1">
                                                💡 <strong>Tip:</strong> Use <code className="px-1 py-0.5 bg-black/30 rounded">http://localhost:3000/api/ollama</code> as Base URL (proxy) instead of <code className="px-1 py-0.5 bg-black/30 rounded">http://localhost:11434</code> (direct) to avoid CORS errors.
                                            </p>
                                        </div>

                                        {/* Advanced Options for Ollama */}
                                        <div className="mt-4 p-3 border border-inherit rounded bg-black/20">
                                            <h5 className="font-bold text-xs mb-2 flex items-center gap-2">
                                                <i className="fa-solid fa-sliders text-teal-400"></i> Advanced Parameters
                                            </h5>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold mb-1 opacity-70">Context Length (num_ctx)</label>
                                                    <input
                                                        type="number"
                                                        value={localSettings.ollamaContextLength || 4096}
                                                        onChange={e => setLocalSettings({ ...localSettings, ollamaContextLength: parseInt(e.target.value) })}
                                                        className={`w-full rounded px-2 py-1 text-xs outline-none ${inputClass}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold mb-1 opacity-70">Temperature ({localSettings.ollamaTemperature || 0.7})</label>
                                                    <input
                                                        type="range"
                                                        min="0" max="1" step="0.1"
                                                        value={localSettings.ollamaTemperature || 0.7}
                                                        onChange={e => setLocalSettings({ ...localSettings, ollamaTemperature: parseFloat(e.target.value) })}
                                                        className="w-full accent-teal-500"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-bold mb-1 opacity-70">Keep Alive (e.g. 5m, 1h, -1)</label>
                                                    <input
                                                        type="text"
                                                        value={localSettings.ollamaKeepAlive || '5m'}
                                                        onChange={e => setLocalSettings({ ...localSettings, ollamaKeepAlive: e.target.value })}
                                                        className={`w-full rounded px-2 py-1 text-xs outline-none ${inputClass}`}
                                                        placeholder="Duration to keep model loaded"
                                                    />
                                                </div>
                                            </div>
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
                                                        checked={localSettings.ollamaBaseUrl.includes('localhost:3000/api/ollama')}
                                                        onChange={() => setLocalSettings({ ...localSettings, ollamaBaseUrl: 'http://localhost:3000/api/ollama' })}
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
                                        <div className="flex justify-between items-center border-b border-inherit pb-2 mb-4">
                                            <h3 className="font-bold">LM Studio Configuration</h3>
                                            <div className="flex items-center gap-2 text-xs">
                                                <div className={`flex items-center gap-2 px-2 py-1 rounded bg-black/20 border border-white/10`}>
                                                    <span className={`w-2 h-2 rounded-full ${lmStudioStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`}></span>
                                                    <span className="opacity-70 font-mono uppercase">{lmStudioStatus}</span>
                                                </div>
                                                {lmStudioStatus === 'offline' && (
                                                    <button
                                                        id="start-lmstudio-btn"
                                                        onClick={handleStartLMStudio}
                                                        className="px-3 py-1 bg-purple-600/20 text-purple-400 border border-purple-500/50 rounded hover:bg-purple-600/40 transition-all flex items-center gap-1 font-bold shadow-lg hover:shadow-purple-500/20"
                                                    >
                                                        <i className="fa-solid fa-power-off"></i> START APP
                                                    </button>
                                                )}
                                            </div>
                                        </div>

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
                                                <i className="fa-solid fa-microchip w-4"></i> LM Studio Model
                                            </label>

                                            <div className="flex gap-2 mb-2">
                                                <select
                                                    value={localSettings.lmstudioModelId}
                                                    onChange={e => setLocalSettings({ ...localSettings, lmstudioModelId: e.target.value })}
                                                    className={`flex-1 rounded px-4 py-2 outline-none ${inputClass}`}
                                                >
                                                    {localSettings.availableModels.lmstudio && localSettings.availableModels.lmstudio.length > 0 ? (
                                                        localSettings.availableModels.lmstudio.map(m => (
                                                            <option key={m} value={m}>{m}</option>
                                                        ))
                                                    ) : (
                                                        <option value="">No models detected - Is server running?</option>
                                                    )}
                                                </select>
                                                <button
                                                    onClick={async () => {
                                                        const btn = document.getElementById('lmstudio-refresh-btn');
                                                        if (btn) {
                                                            btn.innerHTML = '<i class="fa-solid fa-dharmachakra fa-spin"></i> OPENING PORTAL...';
                                                            btn.className = "px-6 py-2 bg-purple-600 text-white rounded text-sm font-bold uppercase shadow-[0_0_20px_#9333ea] scale-105 transition-all flex items-center gap-2";
                                                        }
                                                        await new Promise(r => setTimeout(r, 1500)); // Portal opening delay
                                                        await fetchLMStudioModelsOnly();
                                                        if (btn) {
                                                            btn.innerHTML = '<i class="fa-solid fa-sync"></i> Refresh Models';
                                                            btn.className = "px-4 py-2 bg-purple-600/20 border border-purple-500/50 text-purple-400 rounded text-sm font-bold uppercase hover:bg-purple-600/40 transition-all flex items-center gap-2";
                                                        }
                                                    }}
                                                    id="lmstudio-refresh-btn"
                                                    className="px-4 py-2 bg-purple-600/20 border border-purple-500/50 text-purple-400 rounded text-sm font-bold uppercase hover:bg-purple-600/40 transition-all flex items-center gap-2"
                                                    title="Refresh model list from LM Studio"
                                                >
                                                    <i className="fa-solid fa-sync"></i>
                                                    Refresh
                                                </button>
                                            </div>

                                            {(!localSettings.availableModels.lmstudio || localSettings.availableModels.lmstudio.length === 0) && (
                                                <div className="mb-2">
                                                    <p className="text-[10px] opacity-70 mb-1">Or enter manually:</p>
                                                    <input
                                                        type="text"
                                                        value={localSettings.lmstudioModelId}
                                                        onChange={e => setLocalSettings({ ...localSettings, lmstudioModelId: e.target.value })}
                                                        className={`w-full rounded px-4 py-2 outline-none ${inputClass}`}
                                                        placeholder="e.g. mistral-7b-instruct, llama-3-8b"
                                                    />
                                                </div>
                                            )}

                                            <p className="text-[10px] opacity-60 mt-1">
                                                💡 <strong>Recommended:</strong> Use proxy URL <code className="px-1 py-0.5 bg-black/30 rounded">http://localhost:3000/api/lmstudio</code> to avoid CORS errors
                                            </p>
                                            <p className="text-[10px] opacity-60 mt-1">
                                                🔧 <strong>Direct (advanced):</strong> <code className="px-1 py-0.5 bg-black/30 rounded">http://localhost:1234/v1</code> (may have CORS issues)
                                            </p>
                                        </div>

                                        {/* Advanced Options for LM Studio */}
                                        <div className="mt-4 p-3 border border-inherit rounded bg-black/20">
                                            <h5 className="font-bold text-xs mb-2 flex items-center gap-2">
                                                <i className="fa-solid fa-sliders text-purple-400"></i> Advanced Parameters
                                            </h5>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold mb-1 opacity-70">Context Length</label>
                                                    <input
                                                        type="number"
                                                        value={localSettings.lmstudioContextLength || 2048}
                                                        onChange={e => setLocalSettings({ ...localSettings, lmstudioContextLength: parseInt(e.target.value) })}
                                                        className={`w-full rounded px-2 py-1 text-xs outline-none ${inputClass}`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold mb-1 opacity-70">Temperature ({localSettings.lmstudioTemperature || 0.7})</label>
                                                    <input
                                                        type="range"
                                                        min="0" max="1" step="0.1"
                                                        value={localSettings.lmstudioTemperature || 0.7}
                                                        onChange={e => setLocalSettings({ ...localSettings, lmstudioTemperature: parseFloat(e.target.value) })}
                                                        className="w-full accent-purple-500"
                                                    />
                                                </div>
                                            </div>
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
                                                        checked={localSettings.lmstudioBaseUrl.includes('localhost:3000/api/lmstudio')}
                                                        onChange={() => setLocalSettings({ ...localSettings, lmstudioBaseUrl: 'http://localhost:3000/api/lmstudio' })}
                                                        className="accent-teal-500"
                                                    />
                                                    <span className="text-xs">Proxy (Recommended)</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* LM Studio Loading Effects */}
                                        <div className="mt-6 p-4 border border-inherit rounded bg-opacity-5">
                                            <h4 className="font-bold text-sm mb-2">Loading Effects</h4>
                                            <p className="text-xs opacity-70 mb-4">
                                                Choose the visual feedback when switching to a local model.
                                            </p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${localSettings.lmstudioLoadingEffect === 'neural' ? 'border-teal-500 bg-teal-500/10' : 'border-inherit hover:bg-white/5'}`}>
                                                    <input type="radio" name="lmstudioEffect" checked={localSettings.lmstudioLoadingEffect === 'neural'} onChange={() => setLocalSettings({ ...localSettings, lmstudioLoadingEffect: 'neural' })} className="accent-teal-500" />
                                                    <div>
                                                        <div className="font-bold text-sm">Neural Link</div>
                                                        <div className="text-[10px] opacity-60">Sleek top bar with status updates.</div>
                                                    </div>
                                                </label>

                                                <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${localSettings.lmstudioLoadingEffect === 'terminal' ? 'border-green-500 bg-green-500/10' : 'border-inherit hover:bg-white/5'}`}>
                                                    <input type="radio" name="lmstudioEffect" checked={localSettings.lmstudioLoadingEffect === 'terminal'} onChange={() => setLocalSettings({ ...localSettings, lmstudioLoadingEffect: 'terminal' })} className="accent-green-500" />
                                                    <div>
                                                        <div className="font-bold text-sm font-mono">Terminal Boot</div>
                                                        <div className="text-[10px] opacity-60">Matrix-style boot sequence log.</div>
                                                    </div>
                                                </label>

                                                <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${localSettings.lmstudioLoadingEffect === 'pulse' ? 'border-purple-500 bg-purple-500/10' : 'border-inherit hover:bg-white/5'}`}>
                                                    <input type="radio" name="lmstudioEffect" checked={localSettings.lmstudioLoadingEffect === 'pulse'} onChange={() => setLocalSettings({ ...localSettings, lmstudioLoadingEffect: 'pulse' })} className="accent-purple-500" />
                                                    <div>
                                                        <div className="font-bold text-sm">Brain Pulse</div>
                                                        <div className="text-[10px] opacity-60">Subtle button heartbeat animation.</div>
                                                    </div>
                                                </label>

                                                <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${localSettings.lmstudioLoadingEffect === 'none' ? 'border-gray-500 bg-gray-500/10' : 'border-inherit hover:bg-white/5'}`}>
                                                    <input type="radio" name="lmstudioEffect" checked={localSettings.lmstudioLoadingEffect === 'none'} onChange={() => setLocalSettings({ ...localSettings, lmstudioLoadingEffect: 'none' })} className="accent-gray-500" />
                                                    <div>
                                                        <div className="font-bold text-sm">None</div>
                                                        <div className="text-[10px] opacity-60">No visual feedback.</div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Refresh Models Button */}

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
                                <InputGroup
                                    label="Perplexity API Key"
                                    value={localSettings.perplexityApiKey || ''}
                                    onChange={(v: string) => setLocalSettings({ ...localSettings, perplexityApiKey: v })}
                                    icon="fa-solid fa-question-circle"
                                    inputClass={inputClass}
                                    onTest={() => testConnection('perplexity', localSettings.perplexityApiKey)}
                                    onAdvanced={() => setApiTester({ isOpen: true, serviceName: 'Perplexity', testType: 'llm', apiKey: localSettings.perplexityApiKey, provider: 'perplexity', defaultModel: 'sonar-reasoning-pro' })}
                                    status={connectionStatus['perplexity']}
                                />
                                <InputGroup
                                    label="Brave Search API Key"
                                    value={localSettings.braveApiKey || ''}
                                    onChange={(v: string) => setLocalSettings({ ...localSettings, braveApiKey: v })}
                                    icon="fa-brands fa-searchengin"
                                    inputClass={inputClass}
                                    onTest={() => testConnection('brave', localSettings.braveApiKey)}
                                    onAdvanced={() => setApiTester({ isOpen: true, serviceName: 'Brave Search', testType: 'search', apiKey: localSettings.braveApiKey, provider: 'brave' })}
                                    status={connectionStatus['brave']}
                                />
                                <InputGroup
                                    label="Google Search API Key"
                                    value={localSettings.googleSearchApiKey || ''}
                                    onChange={(v: string) => setLocalSettings({ ...localSettings, googleSearchApiKey: v })}
                                    icon="fa-brands fa-google"
                                    inputClass={inputClass}
                                    onTest={() => testConnection('google', localSettings.googleSearchApiKey)}
                                    onAdvanced={() => setApiTester({ isOpen: true, serviceName: 'Google Search', testType: 'search', apiKey: localSettings.googleSearchApiKey, provider: 'google' })}
                                    status={connectionStatus['google']}
                                />
                                <InputGroup
                                    label="Bing Search API Key"
                                    value={localSettings.bingSearchApiKey || ''}
                                    onChange={(v: string) => setLocalSettings({ ...localSettings, bingSearchApiKey: v })}
                                    icon="fa-brands fa-microsoft"
                                    inputClass={inputClass}
                                    onTest={() => testConnection('bing', localSettings.bingSearchApiKey)}
                                    onAdvanced={() => setApiTester({ isOpen: true, serviceName: 'Bing Search', testType: 'search', apiKey: localSettings.bingSearchApiKey, provider: 'bing' })}
                                    status={connectionStatus['bing']}
                                />
                                <InputGroup
                                    label="Tavily API Key"
                                    value={localSettings.tavilyApiKey || ''}
                                    onChange={(v: string) => setLocalSettings({ ...localSettings, tavilyApiKey: v })}
                                    icon="fa-solid fa-globe"
                                    inputClass={inputClass}
                                    onTest={() => testConnection('tavily', localSettings.tavilyApiKey)}
                                    onAdvanced={() => setApiTester({ isOpen: true, serviceName: 'Tavily Search', testType: 'search', apiKey: localSettings.tavilyApiKey, provider: 'tavily' })}
                                    status={connectionStatus['tavily']}
                                />

                                {/* Search Preferences Section */}
                                <h3 className="font-bold mb-4 border-b border-inherit pb-2 mt-8">Search Preferences</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Default Search Provider */}
                                    <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">Default Search Provider</label>
                                        <select
                                            value={localSettings.defaultSearchProvider || 'perplexity'}
                                            onChange={e => setLocalSettings({ ...localSettings, defaultSearchProvider: e.target.value as any })}
                                            className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                        >
                                            <option value="perplexity">🔍 Perplexity (AI-Powered)</option>
                                            <option value="brave">🦁 Brave Search</option>
                                            <option value="duckduckgo">🦆 DuckDuckGo</option>
                                            <option value="google">🔎 Google Search</option>
                                            <option value="bing">Ⓜ️ Bing Search</option>
                                            <option value="tavily">🌐 Tavily</option>
                                        </select>
                                    </div>

                                    {/* Perplexity Model */}
                                    <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">Perplexity Model</label>
                                        <select
                                            value={localSettings.perplexityModel || 'sonar-pro'}
                                            onChange={e => setLocalSettings({ ...localSettings, perplexityModel: e.target.value as any })}
                                            className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                        >
                                            <option value="sonar">Sonar (Fast)</option>
                                            <option value="sonar-pro">Sonar Pro (Best Quality)</option>
                                            <option value="sonar-reasoning">Sonar Reasoning</option>
                                            <option value="sonar-reasoning-pro">Sonar Reasoning Pro (Most Powerful)</option>
                                        </select>
                                    </div>

                                    {/* Search Results Count */}
                                    <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">Results Count</label>
                                        <select
                                            value={localSettings.searchResultsCount || 10}
                                            onChange={e => setLocalSettings({ ...localSettings, searchResultsCount: parseInt(e.target.value) })}
                                            className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                        >
                                            <option value={5}>5 results</option>
                                            <option value={10}>10 results</option>
                                            <option value={15}>15 results</option>
                                            <option value={20}>20 results</option>
                                        </select>
                                    </div>

                                    {/* Safe Search Mode */}
                                    <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">Safe Search</label>
                                        <select
                                            value={localSettings.searchSafeMode || 'moderate'}
                                            onChange={e => setLocalSettings({ ...localSettings, searchSafeMode: e.target.value as any })}
                                            className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                        >
                                            <option value="off">Off (No filtering)</option>
                                            <option value="moderate">Moderate (Recommended)</option>
                                            <option value="strict">Strict (Maximum filtering)</option>
                                        </select>
                                    </div>

                                    {/* Search Region */}
                                    <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">Search Region</label>
                                        <select
                                            value={localSettings.searchRegion || 'US'}
                                            onChange={e => setLocalSettings({ ...localSettings, searchRegion: e.target.value })}
                                            className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                        >
                                            <option value="US">🇺🇸 United States</option>
                                            <option value="GB">🇬🇧 United Kingdom</option>
                                            <option value="IE">🇮🇪 Ireland</option>
                                            <option value="CA">🇨🇦 Canada</option>
                                            <option value="AU">🇦🇺 Australia</option>
                                            <option value="DE">🇩🇪 Germany</option>
                                            <option value="FR">🇫🇷 France</option>
                                            <option value="ES">🇪🇸 Spain</option>
                                            <option value="IT">🇮🇹 Italy</option>
                                            <option value="JP">🇯🇵 Japan</option>
                                            <option value="IN">🇮🇳 India</option>
                                            <option value="BR">🇧🇷 Brazil</option>
                                        </select>
                                    </div>

                                    {/* Search Language */}
                                    <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">Search Language</label>
                                        <select
                                            value={localSettings.searchLanguage || 'en'}
                                            onChange={e => setLocalSettings({ ...localSettings, searchLanguage: e.target.value })}
                                            className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                        >
                                            <option value="en">English</option>
                                            <option value="es">Español</option>
                                            <option value="de">Deutsch</option>
                                            <option value="fr">Français</option>
                                            <option value="it">Italiano</option>
                                            <option value="pt">Português</option>
                                            <option value="ja">日本語</option>
                                            <option value="zh">中文</option>
                                            <option value="ko">한국어</option>
                                            <option value="ar">العربية</option>
                                            <option value="hi">हिन्दी</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Toggle Options */}
                                <h3 className="font-bold mb-4 border-b border-inherit pb-2 mt-8">Search Behavior</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                        <input type="checkbox" checked={localSettings.enableDuckDuckGo} onChange={e => setLocalSettings({ ...localSettings, enableDuckDuckGo: e.target.checked })} className="accent-teal-500 w-5 h-5" />
                                        Enable DuckDuckGo Fallback (via MCP)
                                    </label>
                                    <p className="text-xs opacity-60 ml-8">Use DuckDuckGo when other search providers fail</p>

                                    <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                        <input type="checkbox" checked={localSettings.enableWebSearchForLLMs} onChange={e => setLocalSettings({ ...localSettings, enableWebSearchForLLMs: e.target.checked })} className="accent-teal-500 w-5 h-5" />
                                        Enable Web Search for LLMs
                                    </label>
                                    <p className="text-xs opacity-60 ml-8">When enabled, LLMs will automatically search the web when the 🌐 WEB button is active</p>

                                    <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                        <input type="checkbox" checked={localSettings.showSearchSources ?? true} onChange={e => setLocalSettings({ ...localSettings, showSearchSources: e.target.checked })} className="accent-teal-500 w-5 h-5" />
                                        Show Source Links in Results
                                    </label>
                                    <p className="text-xs opacity-60 ml-8">Display clickable source URLs with search results</p>

                                    <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                        <input type="checkbox" checked={localSettings.autoSearchOnQuestion ?? false} onChange={e => setLocalSettings({ ...localSettings, autoSearchOnQuestion: e.target.checked })} className="accent-teal-500 w-5 h-5" />
                                        Auto-Search on Questions
                                    </label>
                                    <p className="text-xs opacity-60 ml-8">Automatically trigger web search when a question is detected (e.g., "What is...?", "How do I...?")</p>
                                </div>

                                {/* Quick Commands Reference */}
                                <div className="mt-6 p-4 border border-inherit rounded bg-opacity-5">
                                    <h4 className="font-bold text-sm mb-2">🚀 Quick Search Commands</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                        <div><code className="bg-black/20 px-1 rounded">/perplexity</code> AI-powered search</div>
                                        <div><code className="bg-black/20 px-1 rounded">/ducky</code> DuckDuckGo search</div>
                                        <div><code className="bg-black/20 px-1 rounded">/mcp-brave_web_search</code> Brave search</div>
                                        <div><code className="bg-black/20 px-1 rounded">/mcp-brave_news_search</code> News search</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MCP TAB */}
                        {activeTab === 'mcp' && (
                            <div className="space-y-6">
                                <h3 className="font-bold mb-4 border-b border-inherit pb-2">Docker MCP</h3>
                                <div className="p-4 border border-inherit rounded bg-opacity-5 space-y-3">
                                    <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={localSettings.enableMcpAuto || false}
                                            onChange={e => setLocalSettings({ ...localSettings, enableMcpAuto: e.target.checked })}
                                            className="accent-teal-500 w-5 h-5"
                                        />
                                        Auto-start MCP gateway on app launch
                                    </label>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 opacity-80">Gateway URL</label>
                                        <input
                                            type="text"
                                            value={localSettings.mcpGatewayUrl || ''}
                                            onChange={e => setLocalSettings({ ...localSettings, mcpGatewayUrl: e.target.value })}
                                            className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                            placeholder="http://localhost:3000"
                                        />
                                        <p className="text-[10px] opacity-60 mt-1">Requires Docker Desktop. We’ll set Brave/Obsidian secrets from your stored keys and run docker mcp gateway run.</p>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <button
                                            onClick={async () => {
                                                setMcpStatus('unknown');
                                                const secrets: any = {};
                                                if (localSettings.braveApiKey) secrets.braveApiKey = localSettings.braveApiKey;
                                                if ((localSettings as any).obsidianApiKey) secrets.obsidianApiKey = (localSettings as any).obsidianApiKey;
                                                try {
                                                    let proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3000'; if (proxyUrl.includes(':3010')) proxyUrl = proxyUrl.replace(':3010', ':3000');
                                                    await fetch(`${proxyUrl}/api/mcp/ensure`, {
                                                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secrets })
                                                    });
                                                    setMcpStatus('running');
                                                } catch {
                                                    setMcpStatus('error');
                                                }
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-500"
                                        >Start Gateway</button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    let proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3000'; if (proxyUrl.includes(':3010')) proxyUrl = proxyUrl.replace(':3010', ':3000');
                                                    await fetch(`${proxyUrl}/api/mcp/stop`, { method: 'POST' });
                                                    setMcpStatus('stopped');
                                                } catch {
                                                    setMcpStatus('error');
                                                }
                                            }}
                                            className="px-4 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-500"
                                        >Stop Gateway</button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    let proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3000'; if (proxyUrl.includes(':3010')) proxyUrl = proxyUrl.replace(':3010', ':3000');
                                                    const res = await fetch(`${proxyUrl}/api/mcp/status`);
                                                    const data = await res.json();
                                                    setMcpStatus(data.running ? 'running' : 'stopped');
                                                } catch {
                                                    setMcpStatus('error');
                                                }
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-500"
                                        >Check Status</button>
                                        {mcpStatus !== 'unknown' && (
                                            <span className="text-sm font-bold px-2 py-1 rounded bg-black/20">
                                                Status: {mcpStatus}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[10px] opacity-70 space-y-1">
                                        <div>Slash commands: /mcp-tools (list), /mcp-commands (cheatsheet), /mcp-&lt;tool&gt; [input].</div>
                                        <div>WEB mode will try MCP brave_web_search first when enabled.</div>
                                        <div>Ensure Docker Desktop is running.</div>
                                    </div>
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

                        {/* RSS TAB */}
                        {activeTab === 'rss' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold mb-1">📡 RSS News Ticker</h3>
                                        <p className="text-sm opacity-70">Configure live news feeds and ticker settings</p>
                                    </div>
                                    <button
                                        onClick={() => setShowFeedManager(!showFeedManager)}
                                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium transition-colors"
                                    >
                                        {showFeedManager ? 'Hide' : 'Manage Feeds'}
                                    </button>
                                </div>

                                {showFeedManager ? (
                                    <RSSFeedManager onClose={() => setShowFeedManager(false)} />
                                ) : (
                                    <div className="space-y-6">
                                        {/* Enable Ticker */}
                                        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                                            <div>
                                                <div className="font-bold">Enable RSS Ticker</div>
                                                <div className="text-sm opacity-70">Show live news ticker below chat</div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={rssSettings.enabled}
                                                    onChange={(e) => {
                                                        const newSettings = { ...rssSettings, enabled: e.target.checked };
                                                        setRssSettings(newSettings);
                                                        rssService.saveSettings(newSettings);
                                                    }}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                            </label>
                                        </div>

                                        {/* Ticker Speed */}
                                        <div>
                                            <label className="block text-sm font-bold mb-2">
                                                Ticker Speed: {rssSettings.speed}
                                            </label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={rssSettings.speed}
                                                onChange={(e) => {
                                                    const newSettings = { ...rssSettings, speed: parseInt(e.target.value) };
                                                    setRssSettings(newSettings);
                                                    rssService.saveSettings(newSettings);
                                                }}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs opacity-50 mt-1">
                                                <span>Slow</span>
                                                <span>Fast</span>
                                            </div>
                                        </div>

                                        {/* Ticker Height */}
                                        <div>
                                            <label className="block text-sm font-bold mb-2">Ticker Height</label>
                                            <select
                                                value={rssSettings.height}
                                                onChange={(e) => {
                                                    const newSettings = { ...rssSettings, height: e.target.value as any };
                                                    setRssSettings(newSettings);
                                                    rssService.saveSettings(newSettings);
                                                }}
                                                className={inputClass}
                                            >
                                                <option value="small">Small (32px)</option>
                                                <option value="medium">Medium (40px)</option>
                                                <option value="large">Large (48px)</option>
                                            </select>
                                        </div>

                                        {/* Feed Order */}
                                        <div>
                                            <label className="block text-sm font-bold mb-2">Feed Order</label>
                                            <select
                                                value={rssSettings.feedOrder || 'newest'}
                                                onChange={(e) => {
                                                    const newSettings = { ...rssSettings, feedOrder: e.target.value as any };
                                                    setRssSettings(newSettings);
                                                    rssService.saveSettings(newSettings);
                                                }}
                                                className={inputClass}
                                            >
                                                <option value="newest">Newest First (Default)</option>
                                                <option value="random">Random Shuffle</option>
                                                <option value="category">Group by Topic</option>
                                            </select>
                                        </div>

                                        {/* Auto-refresh Interval */}
                                        <div>
                                            <label className="block text-sm font-bold mb-2">Auto-refresh Interval</label>
                                            <select
                                                value={rssSettings.autoRefreshInterval}
                                                onChange={(e) => {
                                                    const newSettings = { ...rssSettings, autoRefreshInterval: parseInt(e.target.value) };
                                                    setRssSettings(newSettings);
                                                    rssService.saveSettings(newSettings);
                                                }}
                                                className={inputClass}
                                            >
                                                <option value="5">5 minutes</option>
                                                <option value="10">10 minutes</option>
                                                <option value="15">15 minutes</option>
                                                <option value="30">30 minutes</option>
                                                <option value="60">1 hour</option>
                                            </select>
                                        </div>

                                        {/* Show Category Badges */}
                                        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                                            <div>
                                                <div className="font-bold">Show Category Badges</div>
                                                <div className="text-sm opacity-70">Display colored badges for each category</div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={rssSettings.showCategoryBadges}
                                                    onChange={(e) => {
                                                        const newSettings = { ...rssSettings, showCategoryBadges: e.target.checked };
                                                        setRssSettings(newSettings);
                                                        rssService.saveSettings(newSettings);
                                                    }}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                            </label>
                                        </div>

                                        {/* Pause on Hover */}
                                        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                                            <div>
                                                <div className="font-bold">Pause on Hover</div>
                                                <div className="text-sm opacity-70">Pause ticker when mouse hovers over it</div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={rssSettings.pauseOnHover}
                                                    onChange={(e) => {
                                                        const newSettings = { ...rssSettings, pauseOnHover: e.target.checked };
                                                        setRssSettings(newSettings);
                                                        rssService.saveSettings(newSettings);
                                                    }}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                            </label>
                                        </div>

                                        {/* Show Notes in Ticker */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-sm font-bold flex items-center gap-2">
                                                    <i className="fa-solid fa-lightbulb text-amber-400"></i>
                                                    Show Notes in Ticker
                                                </span>
                                                <span className="text-xs text-zinc-500">Display your study notes in the feed</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={rssSettings.showNotesInTicker ?? false}
                                                    onChange={(e) => {
                                                        const newSettings = { ...rssSettings, showNotesInTicker: e.target.checked };
                                                        setRssSettings(newSettings);
                                                        rssService.saveSettings(newSettings);
                                                    }}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                            </label>
                                        </div>

                                        {/* Max Headlines */}
                                        <div>
                                            <label className="block text-sm font-bold mb-2">Max Headlines</label>
                                            <select
                                                value={rssSettings.maxHeadlines}
                                                onChange={(e) => {
                                                    const newSettings = { ...rssSettings, maxHeadlines: parseInt(e.target.value) };
                                                    setRssSettings(newSettings);
                                                    rssService.saveSettings(newSettings);
                                                }}
                                                className={inputClass}
                                            >
                                                <option value="10">10 headlines</option>
                                                <option value="25">25 headlines</option>
                                                <option value="50">50 headlines</option>
                                                <option value="100">100 headlines</option>
                                            </select>
                                        </div>

                                        {/* Display Mode */}
                                        <div>
                                            <label className="block text-sm font-bold mb-2">Display Mode</label>
                                            <select
                                                value={rssSettings.displayMode || 'all'}
                                                onChange={(e) => {
                                                    const newSettings = { ...rssSettings, displayMode: e.target.value as any };
                                                    setRssSettings(newSettings);
                                                    rssService.saveSettings(newSettings);
                                                }}
                                                className={inputClass}
                                            >
                                                <option value="all">All (RSS + Notes)</option>
                                                <option value="rss-only">RSS Feeds Only</option>
                                                <option value="notes-only">Notes Only</option>
                                                <option value="single-category">Single Category</option>
                                            </select>
                                            <p className="text-xs opacity-50 mt-1">Choose what content appears in the ticker</p>
                                        </div>

                                        {/* Single Category Filter (only shows when displayMode is 'single-category') */}
                                        {rssSettings.displayMode === 'single-category' && (
                                            <div>
                                                <label className="block text-sm font-bold mb-2">Filter by Category</label>
                                                <select
                                                    value={rssSettings.singleCategoryFilter || 'pentesting'}
                                                    onChange={(e) => {
                                                        const newSettings = { ...rssSettings, singleCategoryFilter: e.target.value as any };
                                                        setRssSettings(newSettings);
                                                        rssService.saveSettings(newSettings);
                                                    }}
                                                    className={inputClass}
                                                >
                                                    <option value="pentesting">🔒 Penetration Testing</option>
                                                    <option value="malware">🦠 Malware Analysis</option>
                                                    <option value="forensics">🔍 Digital Forensics</option>
                                                    <option value="news">📰 Cybersecurity News</option>
                                                    <option value="dataGov">🛡️ Data Governance</option>
                                                    <option value="blockchain">⛓️ Blockchain & Crypto</option>
                                                </select>
                                            </div>
                                        )}

                                        {/* Quick Actions */}
                                        <div className="pt-4 border-t border-zinc-700">
                                            <h4 className="font-bold mb-3 text-sm flex items-center gap-2">
                                                <i className="fa-solid fa-bolt text-yellow-400"></i>
                                                Quick Actions
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const result = await rssService.refreshAllFeeds();
                                                            alert(`✅ Refreshed!\n\n✓ ${result.success} success\n✗ ${result.failed} failed`);
                                                        } catch (error) {
                                                            alert('❌ Failed: ' + (error as Error).message);
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <i className="fa-solid fa-sync text-xs"></i>
                                                    Refresh Feeds
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await rssService.initializeDefaultFeeds();
                                                            alert('✅ 120 default feeds added!');
                                                        } catch (error) {
                                                            alert('❌ Failed: ' + (error as Error).message);
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <i className="fa-solid fa-plus text-xs"></i>
                                                    Init Defaults
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const stats = await rssService.getStats();
                                                            alert(`📊 Stats\n\n📡 Feeds: ${stats.feedCount} (${stats.enabledFeedCount} enabled)\n📰 Items: ${stats.itemCount}\n💾 Cache: ${stats.cacheSize}\n⚠️ Failed: ${stats.failedFeedCount}\n💿 Storage: ${stats.dbSizeEstimate}`);
                                                        } catch (error) {
                                                            alert('❌ Error: ' + (error as Error).message);
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <i className="fa-solid fa-chart-bar text-xs"></i>
                                                    View Stats
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        rssService.clearCache();
                                                        alert('✅ Cache cleared!');
                                                    }}
                                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <i className="fa-solid fa-broom text-xs"></i>
                                                    Clear Cache
                                                </button>
                                            </div>
                                        </div>

                                        {/* Reset Options */}
                                        <div className="pt-4 border-t border-zinc-700">
                                            <h4 className="font-bold mb-3 text-sm flex items-center gap-2">
                                                <i className="fa-solid fa-rotate-left text-orange-400"></i>
                                                Reset Options
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('Reset RSS settings to defaults?\n\nKeeps your feeds.')) {
                                                            await rssService.resetSettings();
                                                            const newSettings = await rssService.loadSettings();
                                                            setRssSettings(newSettings);
                                                            alert('✅ Settings reset!');
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <i className="fa-solid fa-rotate-left text-xs"></i>
                                                    Reset Settings
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('⚠️ DELETE all RSS data?\n\nThis cannot be undone!')) {
                                                            await rssService.clearAllData();
                                                            const newSettings = await rssService.loadSettings();
                                                            setRssSettings(newSettings);
                                                            alert('✅ All RSS data deleted!');
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <i className="fa-solid fa-trash text-xs"></i>
                                                    Delete All
                                                </button>
                                            </div>
                                        </div>

                                        {/* Browser Storage */}
                                        <div className="pt-4 border-t border-zinc-700">
                                            <h4 className="font-bold mb-3 text-sm flex items-center gap-2">
                                                <i className="fa-solid fa-hard-drive text-purple-400"></i>
                                                Browser Storage
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('Clear localStorage?\n\nResets app preferences.')) {
                                                            localStorage.clear();
                                                            alert('✅ localStorage cleared!');
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <i className="fa-solid fa-eraser text-xs"></i>
                                                    Clear Local
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            if (navigator.storage && navigator.storage.estimate) {
                                                                const estimate = await navigator.storage.estimate();
                                                                const used = estimate.usage ? (estimate.usage / 1024 / 1024).toFixed(2) : '?';
                                                                const quota = estimate.quota ? (estimate.quota / 1024 / 1024).toFixed(2) : '?';
                                                                const dbs = await indexedDB.databases();
                                                                const dbList = dbs.map(db => `• ${db.name}`).join('\n');
                                                                alert(`💾 Storage: ${used}/${quota} MB\n\n📦 DBs:\n${dbList || 'None'}`);
                                                            }
                                                        } catch (error) {
                                                            alert('❌ Error: ' + (error as Error).message);
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <i className="fa-solid fa-info text-xs"></i>
                                                    Storage Info
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* COUNCIL TAB */}
                        {activeTab === 'council' && (
                            <div className="space-y-6">
                                {/* Council Mode Selector */}
                                <div className="p-4 border-2 border-teal-500/30 rounded-lg bg-teal-500/5">
                                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-graduation-cap text-teal-500"></i>
                                        Council Mode
                                    </h4>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <button
                                            onClick={() => {
                                                const { DEFAULT_AGENTS, STUDY_MODE_AGENTS } = require('../types');
                                                setLocalSettings({
                                                    ...localSettings,
                                                    councilMode: 'standard',
                                                    councilAgents: DEFAULT_AGENTS
                                                });
                                            }}
                                            className={`p-4 rounded-lg border-2 transition-all ${localSettings.councilMode === 'standard'
                                                ? 'border-teal-500 bg-teal-500/20'
                                                : 'border-zinc-700 hover:border-zinc-600'
                                                }`}
                                        >
                                            <div className="text-2xl mb-2">💼</div>
                                            <div className="font-bold text-sm">Standard Mode</div>
                                            <div className="text-xs opacity-70 mt-1">
                                                General research & analysis
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => {
                                                const { STUDY_MODE_AGENTS } = require('../types');
                                                setLocalSettings({
                                                    ...localSettings,
                                                    councilMode: 'study',
                                                    councilAgents: STUDY_MODE_AGENTS
                                                });
                                            }}
                                            className={`p-4 rounded-lg border-2 transition-all ${localSettings.councilMode === 'study'
                                                ? 'border-amber-500 bg-amber-500/20'
                                                : 'border-zinc-700 hover:border-zinc-600'
                                                }`}
                                        >
                                            <div className="text-2xl mb-2">📚</div>
                                            <div className="font-bold text-sm">Study Mode</div>
                                            <div className="text-xs opacity-70 mt-1">
                                                Academic research with citations
                                            </div>
                                        </button>
                                    </div>

                                    <div className="text-xs opacity-60 bg-zinc-800/50 p-3 rounded">
                                        <strong>💡 Study Mode Features:</strong>
                                        <ul className="list-disc ml-4 mt-1 space-y-1">
                                            <li>Academic-focused agents (Literature Review, Methodology, Critical Analysis)</li>
                                            <li>Automatic APA 7th edition citations</li>
                                            <li>Peer-reviewed source prioritization</li>
                                            <li>Compiled references section</li>
                                            <li>Perfect for college assignments!</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Judge Model Selector */}
                                <div className="p-4 border-2 border-amber-500/30 rounded-lg bg-amber-500/5">
                                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-gavel text-amber-500"></i>
                                        Judge Model (Final Arbiter)
                                    </h4>

                                    <select
                                        value={localSettings.councilAgents.find(a => a.id === 'judge' || a.id === 'academic-judge')?.model || 'gemini-3-pro'}
                                        onChange={(e) => {
                                            const judgeId = localSettings.councilMode === 'study' ? 'academic-judge' : 'judge';
                                            const updatedAgents = localSettings.councilAgents.map(a =>
                                                a.id === judgeId ? { ...a, model: e.target.value } : a
                                            );
                                            setLocalSettings({ ...localSettings, councilAgents: updatedAgents });
                                        }}
                                        className={`w-full text-sm rounded px-3 py-2 ${inputClass}`}
                                    >
                                        <optgroup label="🎯 Gemini 3.0 (Recommended)">
                                            <option value="gemini-3-pro">Gemini 3 Pro ⭐ (Most Powerful)</option>
                                            <option value="gemini-3-flash">Gemini 3 Flash (Fast)</option>
                                            <option value="gemini-3-deep-think">Gemini 3 Deep Think (Advanced Reasoning)</option>
                                        </optgroup>

                                        <optgroup label="🧠 Reasoning Models">
                                            <option value="gemini-2.0-flash-thinking-exp-01-21">Gemini 2.0 Thinking</option>
                                            <option value="o1-mini">OpenAI o1-mini</option>
                                            <option value="o1">OpenAI o1</option>
                                        </optgroup>

                                        <optgroup label="💎 Premium Models">
                                            <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
                                            <option value="gpt-4o">GPT-4o</option>
                                            <option value="grok-3">Grok 3</option>
                                        </optgroup>
                                    </select>

                                    <div className="mt-3 text-xs opacity-60 bg-zinc-800/50 p-2 rounded">
                                        <strong>🌐 All agents now have internet access via Google Search Grounding!</strong>
                                        <br />Facts are verified in real-time and sources are automatically cited.
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-b border-inherit pb-2">
                                    <h3 className="font-bold">Council Agents ({localSettings.councilAgents.length})</h3>
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

                        {/* ACCESSIBILITY TAB */}
                        {activeTab === 'accessibility' && (
                            <div className="space-y-6">
                                <div className="border-b border-inherit pb-2">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <i className="fa-solid fa-universal-access text-purple-500"></i>
                                        Accessibility Settings
                                    </h3>
                                    <p className="text-sm opacity-70 mt-1">
                                        Optimize RangerPlex for dyslexia and other accessibility needs
                                    </p>
                                </div>

                                <DyslexiaModeControls
                                    settings={localSettings.dyslexiaSettings || {
                                        enabled: false,
                                        font: 'opendyslexic',
                                        fontSize: 16,
                                        lineSpacing: 1.8,
                                        letterSpacing: 1,
                                        wordSpacing: 2,
                                        colorScheme: 'default',
                                        highlightLinks: true,
                                        simplifyLanguage: false,
                                        textToSpeech: false,
                                        readingGuide: false,
                                    }}
                                    onChange={(newSettings) => {
                                        setLocalSettings({
                                            ...localSettings,
                                            dyslexiaSettings: newSettings
                                        });
                                    }}
                                />

                                <div className="p-4 bg-blue-500/10 border-2 border-blue-500/30 rounded-lg">
                                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                        <i className="fa-solid fa-lightbulb text-blue-500"></i>
                                        Accessibility Tips
                                    </h4>
                                    <ul className="text-sm space-y-2 opacity-80">
                                        <li className="flex items-start gap-2">
                                            <i className="fa-solid fa-check text-green-500 mt-1"></i>
                                            <span><strong>Voice Input:</strong> Use the microphone button to speak instead of typing</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <i className="fa-solid fa-check text-green-500 mt-1"></i>
                                            <span><strong>Text-to-Speech:</strong> Enable to have messages read aloud automatically</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <i className="fa-solid fa-check text-green-500 mt-1"></i>
                                            <span><strong>Study Mode:</strong> Combine with Council tab for academic research with citations</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <i className="fa-solid fa-check text-green-500 mt-1"></i>
                                            <span><strong>Keyboard Shortcuts:</strong> Use Ctrl+Enter to send messages quickly</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* PERSONALITY TAB */}
                        {activeTab === 'personality' && (
                            <PersonalitySelector
                                settings={localSettings.personalitySettings || {
                                    mode: 'auto-match',
                                    fixedPersonalityId: 'colonel-ranger',
                                    showBadge: true,
                                    showConfidence: true,
                                    allowManualOverride: true,
                                }}
                                onChange={(newSettings) => {
                                    setLocalSettings({
                                        ...localSettings,
                                        personalitySettings: newSettings
                                    });
                                }}
                            />
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
                                    <h4 className="font-bold text-sm mb-2">Advanced Stream Settings</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold mb-1 opacity-80">Retry Delay (ms)</label>
                                            <input
                                                type="number"
                                                min="1000"
                                                step="500"
                                                value={localSettings.radioRetryDelay || 2000}
                                                onChange={(e) => setLocalSettings({ ...localSettings, radioRetryDelay: parseInt(e.target.value) })}
                                                className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                            />
                                            <p className="text-[10px] opacity-60 mt-1">
                                                Time to wait before reconnecting (default: 2000ms).
                                                <br />
                                                <span className="text-teal-400">Tip:</span> Increase this if you have a spotty connection.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 opacity-80">Buffer Size (KB)</label>
                                            <input
                                                type="number"
                                                min="64"
                                                step="32"
                                                value={(localSettings.radioBufferHighWaterMark || 131072) / 1024}
                                                onChange={(e) => setLocalSettings({ ...localSettings, radioBufferHighWaterMark: parseInt(e.target.value) * 1024 })}
                                                className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                            />
                                            <p className="text-[10px] opacity-60 mt-1">
                                                Stream buffer size (default: 128KB).
                                                <br />
                                                <span className="text-teal-400">Tip:</span> Increase (e.g. 256KB) to fix skipping, or decrease (64KB) for less startup lag.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 opacity-80">Connection Timeout (ms)</label>
                                            <input
                                                type="number"
                                                min="2000"
                                                step="1000"
                                                value={localSettings.radioConnectionTimeout || 10000}
                                                onChange={(e) => setLocalSettings({ ...localSettings, radioConnectionTimeout: parseInt(e.target.value) })}
                                                className={`w-full rounded px-3 py-2 text-sm ${inputClass}`}
                                            />
                                            <p className="text-[10px] opacity-60 mt-1">
                                                Max time to wait for stream (default: 10000ms).
                                            </p>
                                        </div>
                                        <div className="flex items-center pt-6">
                                            <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={localSettings.radioPreferLowQuality}
                                                    onChange={e => setLocalSettings({ ...localSettings, radioPreferLowQuality: e.target.checked })}
                                                    className="accent-teal-500 w-5 h-5"
                                                />
                                                <div>
                                                    <div>Low Bandwidth Mode (64kbps AAC)</div>
                                                    <div className="text-[10px] opacity-60 font-normal">Saves data and reduces skipping on slow networks.</div>
                                                </div>
                                            </label>
                                        </div>
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

                        {/* PODCAST TAB - CyberSec Podcast Hub */}
                        {activeTab === 'podcast' && (
                            <div className="h-[60vh] -m-6">
                                <CyberSecPodcast settings={localSettings} />
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
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                        <i className="fa-solid fa-cloud-sun"></i> Weather Station Configuration
                                    </h3>
                                    <p className="text-sm opacity-80 mb-4">
                                        Configure your weather data providers. RangerPlex supports multiple APIs to ensure you get the most accurate forecast.
                                    </p>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold mb-1 opacity-80">Primary Weather Provider</label>
                                            <select
                                                value={localSettings.weatherProvider || 'fusion'}
                                                onChange={(e) => setLocalSettings({ ...localSettings, weatherProvider: e.target.value as any })}
                                                className="w-full p-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                            >
                                                <option value="fusion">Fusion (Best Available - Recommended)</option>
                                                <option value="openmeteo">Open-Meteo (Free & Unlimited)</option>
                                                <option value="openweather">OpenWeatherMap</option>
                                                <option value="tomorrow">Tomorrow.io (Best for Minutely)</option>
                                                <option value="visualcrossing">Visual Crossing (Best for History)</option>
                                            </select>
                                            <p className="text-xs opacity-60 mt-1">
                                                "Fusion" automatically selects the best API for each task (e.g., Tomorrow.io for rain, Visual Crossing for history).
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold border-b pb-2">API Keys</h3>

                                    <div className="p-3 rounded bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-green-700 dark:text-green-400">Open-Meteo</div>
                                                <div className="text-xs opacity-70">Free for non-commercial use. No API key required!</div>
                                            </div>
                                            <i className="fa-solid fa-check-circle text-green-500 text-xl"></i>
                                        </div>
                                    </div>

                                    <InputGroup
                                        label="OpenWeatherMap API Key"
                                        value={localSettings.openWeatherApiKey || ''}
                                        onChange={(v: string) => setLocalSettings({ ...localSettings, openWeatherApiKey: v })}
                                        icon="fa-solid fa-sun"
                                        inputClass="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700"
                                        onTest={() => testWeatherApi('openweather')}
                                        onAdvanced={() => setWeatherTester({ isOpen: true, provider: 'openweather', apiKey: localSettings.openWeatherApiKey || '' })}
                                        status={connectionStatus.openweather}
                                    />

                                    <InputGroup
                                        label="Tomorrow.io API Key"
                                        value={localSettings.tomorrowApiKey || ''}
                                        onChange={(v: string) => setLocalSettings({ ...localSettings, tomorrowApiKey: v })}
                                        icon="fa-solid fa-stopwatch"
                                        inputClass="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700"
                                        onTest={() => testWeatherApi('tomorrow')}
                                        onAdvanced={() => setWeatherTester({ isOpen: true, provider: 'tomorrow', apiKey: localSettings.tomorrowApiKey || '' })}
                                        status={connectionStatus.tomorrow}
                                    />

                                    <InputGroup
                                        label="Visual Crossing API Key"
                                        value={localSettings.visualCrossingApiKey || ''}
                                        onChange={(v: string) => setLocalSettings({ ...localSettings, visualCrossingApiKey: v })}
                                        icon="fa-solid fa-calendar-days"
                                        inputClass="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700"
                                        onTest={() => testWeatherApi('visualcrossing')}
                                        onAdvanced={() => setWeatherTester({ isOpen: true, provider: 'visualcrossing', apiKey: localSettings.visualCrossingApiKey || '' })}
                                        status={connectionStatus.visualcrossing}
                                    />

                                </div>

                                <div className="space-y-4 pt-4 border-t border-inherit">
                                    <h3 className="font-bold border-b pb-2">Rain Notifications</h3>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-bold">Enable Rain Alerts</div>
                                            <div className="text-xs opacity-70">Get notified before it rains at your location</div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={localSettings.rainNotificationsEnabled} onChange={e => setLocalSettings({ ...localSettings, rainNotificationsEnabled: e.target.checked })} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    {localSettings.rainNotificationsEnabled && (
                                        <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                            <div>
                                                <label className="block text-xs font-bold mb-1 opacity-80">Location</label>
                                                <input
                                                    type="text"
                                                    value={localSettings.rainNotificationLocation || 'Dublin,IE'}
                                                    onChange={(e) => setLocalSettings({ ...localSettings, rainNotificationLocation: e.target.value })}
                                                    className="w-full p-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                                    placeholder="City, Country Code"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold mb-1 opacity-80">Look Ahead</label>
                                                <select
                                                    value={localSettings.rainNotificationTiming || '3hours'}
                                                    onChange={(e) => setLocalSettings({ ...localSettings, rainNotificationTiming: e.target.value as any })}
                                                    className="w-full p-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                                >
                                                    <option value="1hour">1 Hour</option>
                                                    <option value="3hours">3 Hours</option>
                                                    <option value="12hours">12 Hours</option>
                                                    <option value="24hours">24 Hours</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* CONSOLE TAB */}
                        {activeTab === 'console' && (
                            <div className="space-y-4">
                                <div className="p-4 border border-inherit rounded bg-opacity-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-bold text-lg flex items-center gap-2">
                                            <i className="fa-solid fa-terminal"></i>
                                            Console Log Viewer
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs opacity-60">{consoleEntries.length} entries</span>
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                        {/* Filter */}
                                        <select
                                            value={consoleFilter}
                                            onChange={(e) => setConsoleFilter(e.target.value as any)}
                                            className="px-3 py-1.5 rounded border border-inherit bg-transparent text-sm"
                                        >
                                            <option value="all">All</option>
                                            <option value="log">Log</option>
                                            <option value="info">Info</option>
                                            <option value="warn">Warn</option>
                                            <option value="error">Error</option>
                                        </select>

                                        {/* Auto-scroll toggle */}
                                        <button
                                            onClick={() => setConsoleAutoScroll(!consoleAutoScroll)}
                                            className={`px-3 py-1.5 rounded border border-inherit text-sm flex items-center gap-1 ${consoleAutoScroll ? 'bg-green-500/20 text-green-500' : 'opacity-60'}`}
                                            title="Auto-scroll"
                                        >
                                            <i className="fa-solid fa-arrow-down"></i>
                                            Auto
                                        </button>

                                        {/* Copy button */}
                                        <button
                                            onClick={async () => {
                                                const success = await consoleCapture.copyToClipboard();
                                                if (success) {
                                                    setConsoleCopied(true);
                                                    setTimeout(() => setConsoleCopied(false), 2000);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded border border-inherit text-sm flex items-center gap-1 ${consoleCopied ? 'bg-green-500/20 text-green-500' : 'hover:bg-white/5'}`}
                                        >
                                            <i className={`fa-solid ${consoleCopied ? 'fa-check' : 'fa-copy'}`}></i>
                                            {consoleCopied ? 'Copied!' : 'Copy'}
                                        </button>

                                        {/* Download TXT */}
                                        <button
                                            onClick={() => consoleCapture.downloadAsText()}
                                            className="px-3 py-1.5 rounded border border-inherit text-sm flex items-center gap-1 hover:bg-white/5"
                                            title="Download as .txt"
                                        >
                                            <i className="fa-solid fa-download"></i>
                                            .txt
                                        </button>

                                        {/* Download JSON */}
                                        <button
                                            onClick={() => consoleCapture.downloadAsJSON()}
                                            className="px-3 py-1.5 rounded border border-inherit text-sm flex items-center gap-1 hover:bg-white/5"
                                            title="Download as .json"
                                        >
                                            <i className="fa-solid fa-download"></i>
                                            .json
                                        </button>

                                        {/* Clear button */}
                                        <button
                                            onClick={() => consoleCapture.clear()}
                                            className="px-3 py-1.5 rounded border border-red-500/50 text-red-500 text-sm flex items-center gap-1 hover:bg-red-500/10"
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                            Clear
                                        </button>
                                    </div>

                                    {/* Console Output */}
                                    <div className="bg-black/50 rounded border border-inherit overflow-hidden">
                                        <div className="max-h-[400px] overflow-y-auto p-3 font-mono text-xs space-y-1">
                                            {consoleEntries
                                                .filter(entry => consoleFilter === 'all' || entry.type === consoleFilter)
                                                .map((entry) => (
                                                    <div
                                                        key={entry.id}
                                                        className={`flex gap-2 py-0.5 border-b border-white/5 ${entry.type === 'error' ? 'text-red-400' :
                                                            entry.type === 'warn' ? 'text-yellow-400' :
                                                                entry.type === 'info' ? 'text-blue-400' :
                                                                    entry.type === 'debug' ? 'text-purple-400' :
                                                                        'text-gray-300'
                                                            }`}
                                                    >
                                                        <span className="opacity-40 flex-shrink-0">
                                                            {entry.timestamp.toLocaleTimeString()}
                                                        </span>
                                                        <span className={`uppercase text-[10px] px-1 rounded flex-shrink-0 ${entry.type === 'error' ? 'bg-red-500/20' :
                                                            entry.type === 'warn' ? 'bg-yellow-500/20' :
                                                                entry.type === 'info' ? 'bg-blue-500/20' :
                                                                    entry.type === 'debug' ? 'bg-purple-500/20' :
                                                                        'bg-gray-500/20'
                                                            }`}>
                                                            {entry.type}
                                                        </span>
                                                        <span className="break-all whitespace-pre-wrap">{entry.message}</span>
                                                    </div>
                                                ))
                                            }
                                            {consoleEntries.length === 0 && (
                                                <div className="text-center opacity-40 py-8">
                                                    <i className="fa-solid fa-terminal text-2xl mb-2"></i>
                                                    <p>No console messages captured yet.</p>
                                                    <p className="text-xs mt-1">Interact with the app to see logs here.</p>
                                                </div>
                                            )}
                                            <div ref={consoleEndRef} />
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="mt-3 flex items-center gap-4 text-xs opacity-60">
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                            Log: {consoleEntries.filter(e => e.type === 'log').length}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                            Info: {consoleEntries.filter(e => e.type === 'info').length}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                            Warn: {consoleEntries.filter(e => e.type === 'warn').length}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                            Error: {consoleEntries.filter(e => e.type === 'error').length}
                                        </span>
                                    </div>
                                </div>

                                {/* Tips */}
                                <div className="p-4 border border-inherit rounded bg-opacity-5">
                                    <h5 className="font-bold flex items-center gap-2 mb-2">
                                        <i className="fa-solid fa-lightbulb text-yellow-500"></i>
                                        Debugging Tips
                                    </h5>
                                    <ul className="text-sm opacity-80 space-y-1">
                                        <li>• Click <strong>Code</strong> button and look for <code className="bg-black/30 px-1 rounded">🟢 openEditor called</code></li>
                                        <li>• Click <strong>WP</strong> button and look for <code className="bg-black/30 px-1 rounded">🔵 openWordPress called</code></li>
                                        <li>• Use filters to find specific log types</li>
                                        <li>• Download logs to share for debugging</li>
                                    </ul>
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
                    <div className="p-6 border-t border-inherit flex justify-between items-center gap-3">
                        <button onClick={onClose} className="px-4 py-2 opacity-70 hover:opacity-100 font-bold uppercase text-xs flex items-center gap-2 hover:bg-white/10 rounded transition-all">
                            <i className="fa-solid fa-door-open"></i> Exit
                        </button>
                        <button
                            id="save-settings-btn"
                            onClick={handleSave}
                            className={`px-6 py-2 rounded font-bold uppercase text-xs shadow-lg transition-all transform active:scale-95 ${localSettings.theme === 'tron' ? 'bg-tron-cyan text-black hover:bg-white' : 'bg-teal-600 text-white hover:bg-teal-500'}`}
                        >
                            Save Config
                        </button>
                    </div>
                </div>
            </div >
            {showAliasManager && (
                <AliasManager
                    isOpen={showAliasManager}
                    onClose={() => setShowAliasManager(false)}
                />
            )
            }
            {/* Weather Tester Modal */}
            {
                weatherTester && (
                    <WeatherTester
                        isOpen={weatherTester.isOpen}
                        onClose={() => setWeatherTester(null)}
                        provider={weatherTester.provider}
                        apiKey={weatherTester.apiKey}
                        defaultLocation={localSettings.rainNotificationLocation}
                    />
                )
            }
            {/* Generic API Tester Modal */}
            {
                apiTester && (
                    <ApiTester
                        isOpen={apiTester.isOpen}
                        onClose={() => setApiTester(null)}
                        serviceName={apiTester.serviceName}
                        testType={apiTester.testType}
                        apiKey={apiTester.apiKey}
                        baseUrl={apiTester.baseUrl}
                        provider={apiTester.provider}
                        defaultModel={apiTester.defaultModel}
                    />
                )
            }

            {
                showConfetti && !localSettings.disableConfetti && (
                    <>
                        <style>{`
                        @keyframes confetti-fall {
                            0% { transform: translate3d(0, -15vh, 0) rotate(0deg); opacity: 1; }
                            100% { transform: translate3d(0, 110vh, 0) rotate(720deg); opacity: 0; }
                        }
                    `}</style>
                        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
                            {confettiPieces.map((piece, idx) => (
                                <span
                                    key={idx}
                                    style={{
                                        position: 'absolute',
                                        top: '-10%',
                                        left: `${piece.left}%`,
                                        width: `${piece.size}px`,
                                        height: `${piece.size * 0.4}px`,
                                        background: piece.color,
                                        borderRadius: '2px',
                                        transform: `rotate(${piece.rotate}deg)`,
                                        animation: `confetti-fall ${piece.duration}s linear ${piece.delay}s forwards`,
                                        filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.3))'
                                    }}
                                />
                            ))}
                        </div>
                    </>
                )
            }
        </>
    );
};

export default SettingsModal;

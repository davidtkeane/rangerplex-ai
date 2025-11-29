
import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import SettingsModal from './components/SettingsModal';
import AuthPage from './components/AuthPage';
import TrainingPage from './components/TrainingPage';
import MatrixRain from './components/MatrixRain';
import RangerVisionMode from './components/RangerVisionMode';
import RadioPlayer from './components/RadioPlayer';
import { WorkspaceTabs, WorkspaceTab } from './src/components/Workspace/WorkspaceTabs';
import RangerTerminal from './components/Terminal/RangerTerminal';
import UpdateNotification from './components/UpdateNotification';
import { updateService, UpdateInfo } from './services/updateService';
import pkg from './package.json';
import SnowOverlay from './components/SnowOverlay';
import ConfettiOverlay from './components/ConfettiOverlay';
import SparkleOverlay from './components/SparkleOverlay';
import StudyNotes from './components/StudyNotes';
import RangerPet from './components/RangerPet'; // Import RangerPet
import { CanvasBoard } from './src/components/CanvasBoard'; // Import Canvas Board
import { SaveStatusIndicator } from './components/SaveStatusIndicator';
import { BackupManager } from './src/components/BackupManager';
import { StudyClock } from './components/StudyClock'; // Import Study Clock
import ManualViewer from './components/ManualViewer';
import { EditorLayout, EditorTerminalSplit } from './src/components/CodeEditor'; // Monaco editor with full UI
import { browserStateService } from './src/services/browserStateService';
import { ChatSession, Message, Sender, ModelType, DocumentChunk, AppSettings, DEFAULT_SETTINGS, DEFAULT_SAVED_PROMPTS } from './types';
import { generateTitle } from './services/geminiService';
import { dbService } from './services/dbService';
import { syncService } from './services/syncService';
import { autoSaveService, queueChatSave, queueSettingSave } from './services/autoSaveService';
import { usePetState } from './src/hooks/usePetState';
import TerminalPopup from './src/components/Browser/TerminalPopup'; // Import TerminalPopup
import { WordPressDashboard } from './src/components/WordPress/WordPressDashboard'; // Import WordPress Dashboard
import BlockchainChat from './src/components/BlockchainChat'; // Import Blockchain Chat
import BrowserLayout from './src/components/Browser/BrowserLayout'; // Import BrowserLayout
import WeatherStation from './components/Weather/WeatherStation'; // Import Weather Station
import RainNotification from './components/RainNotification'; // Import Rain Notification
import { weatherService, RainAlert } from './services/weatherService';

const App: React.FC = () => {
  // MINI-OS: Floating Terminal Route
  // If this window is opened as the floating terminal, render ONLY that component
  if (window.location.pathname === '/terminal-popup') {
    return <TerminalPopup />;
  }

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false); // Ranger Console State
  const [isTerminalMinimized, setIsTerminalMinimized] = useState(false); // Ranger Console Minimize State
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const [isStudyNotesOpen, setIsStudyNotesOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState<{ title?: string; content?: string; imageUrl?: string; savedImagePath?: string } | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [syncStatus, setSyncStatus] = useState({ connected: false, lastSync: 0 });
  const [isVisionModeOpen, setIsVisionModeOpen] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [settingsLoaded, setSettingsLoaded] = useState(false); // Track if settings loaded from DB
  const [isLoadingFromServer, setIsLoadingFromServer] = useState(false); // Prevent save loop during server sync
  const [wasVisionModeAutoActivated, setWasVisionModeAutoActivated] = useState(false);
  const [radioToggleSignal, setRadioToggleSignal] = useState(0); // external play/pause signal for Ranger Radio
  const [scannerMode, setScannerMode] = useState<'tron' | 'teal' | 'rainbow' | 'matrix' | 'red' | 'gold'>('tron');
  const [isPetVisible, setIsPetVisible] = useState(false); // State for RangerPet visibility
  const [petMessage, setPetMessage] = useState(''); // State for RangerPet message
  const [isCanvasOpen, setIsCanvasOpen] = useState(false); // State for Canvas Board visibility
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [needsBackupImport, setNeedsBackupImport] = useState(false);
  const [hydrationSource, setHydrationSource] = useState<'none' | 'local' | 'server'>('none');
  const [isStudyClockOpen, setIsStudyClockOpen] = useState(false); // State for Study Clock visibility
  const [isManualOpen, setIsManualOpen] = useState(false); // Manual overlay
  const [isEditorOpen, setIsEditorOpen] = useState(false); // State for Code Editor visibility
  const [isWordPressOpen, setIsWordPressOpen] = useState(false); // State for WordPress Dashboard visibility
  const [isBlockchainChatOpen, setIsBlockchainChatOpen] = useState(false); // State for Blockchain Chat visibility
  const [initialBrowserUrl, setInitialBrowserUrl] = useState<string | undefined>(undefined);
  const [browserOpenRequest, setBrowserOpenRequest] = useState<{ url?: string; ts: number } | null>(null);
  const [activeSurface, setActiveSurface] = useState<'chat' | 'browser' | 'notes' | 'training' | 'canvas' | 'wordpress' | 'weather' | 'terminal' | 'editor' | 'blockchain' | 'manual'>('chat');
  const [isWeatherOpen, setIsWeatherOpen] = useState(false); // State for Weather Station visibility
  const [rainAlert, setRainAlert] = useState<RainAlert | null>(null); // State for rain notifications
  const petBridge = usePetState(currentUser || undefined, settings.petName || 'Kitty');

  useEffect(() => {
    browserStateService.setUser(currentUser);
  }, [currentUser]);

  const ensureImagineFirst = (prompts: typeof DEFAULT_SETTINGS.savedPrompts) => {
    if (!prompts || prompts.length === 0) return DEFAULT_SAVED_PROMPTS;
    const idx = prompts.findIndex(p => p.trigger === 'imagine');
    if (idx === 0) return prompts;
    if (idx === -1) {
      return [{ id: '0', trigger: 'imagine', text: '/imagine ' }, ...prompts];
    }
    const clone = [...prompts];
    const [imagine] = clone.splice(idx, 1);
    return [imagine, ...clone];
  };

  // Initialize database and sync
  useEffect(() => {
    const initDB = async () => {
      await dbService.init();
      syncService.enableSync();

      // Check if migration is needed for image paths
      const imagePathMigrationNeeded = await dbService.getSetting('image_path_migration_20251123') !== 'completed';
      if (imagePathMigrationNeeded) {
        console.log('🔄 Performing one-time image path migration...');
        try {
          // Migrate chat messages
          const chats = await dbService.getAllChats();
          for (const chat of chats) {
            let chatUpdated = false;
            for (const message of chat.messages) {
              if (message.generatedImages) {
                for (const image of message.generatedImages) {
                  if (image.url && image.url.startsWith('image/')) {
                    image.url = `http://localhost:3010/${image.url}`;
                    chatUpdated = true;
                  }
                }
              }
            }
            if (chatUpdated) {
              await dbService.saveChat(chat);
            }
          }

          // Migrate study notes
          const users = await dbService.getAllUsers(); // Assuming you have a way to get all users
          for (const user of users) {
            const storageKey = `study_notes_${user.username}`;
            const stored = await dbService.getSetting(storageKey);
            if (stored && Array.isArray(stored.notes)) {
              let notesUpdated = false;
              for (const note of stored.notes) {
                if (note.content && note.content.includes('](image/')) {
                  note.content = note.content.replace(/\]\(image\//g, '](http://localhost:3010/image/');
                  notesUpdated = true;
                }
              }
              if (notesUpdated) {
                await dbService.saveSetting(storageKey, stored);
              }
            }
          }

          await dbService.saveSetting('image_path_migration_20251123', 'completed');
          console.log('✅ Image path migration complete!');
        } catch (error) {
          console.error('❌ Image path migration failed:', error);
        }
      }

      // Check if migration from localStorage is needed
      const migrated = await dbService.getSetting('migrated');
      if (!migrated) {
        console.log('🔄 Migrating from localStorage to IndexedDB...');
        await dbService.migrateFromLocalStorage();
      }
    };

    initDB();

    // Listen to sync events
    syncService.on('connected', () => {
      setSyncStatus(prev => ({ ...prev, connected: true }));
      console.log('✅ Sync connected');
    });

    syncService.on('disconnected', () => {
      setSyncStatus(prev => ({ ...prev, connected: false }));
      console.log('❌ Sync disconnected');
    });

    return () => {
      syncService.off('connected', () => { });
      syncService.off('disconnected', () => { });
    };
  }, []);

  // Watch cloud sync toggle
  // Watch cloud sync toggle
  useEffect(() => {
    if (settings.enableCloudSync) {
      console.log('☁️ Cloud sync enabled');
      syncService.enableSync();
    } else {
      console.log('📴 Cloud sync disabled');
      syncService.disableSync();
    }
  }, [settings.enableCloudSync]);

  // Tabbed Workspace State
  const [tabs, setTabs] = useState<WorkspaceTab[]>([
    { id: 'chat', type: 'chat', title: 'Chat', icon: 'fa-solid fa-comments', isPinned: true }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('chat');

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isInstallingUpdate, setIsInstallingUpdate] = useState(false);

  // Check for updates on mount
  useEffect(() => {
    const checkUpdates = async () => {
      const info = await updateService.checkForUpdates(pkg.version);
      if (info.hasUpdate) {
        setUpdateInfo(info);
      }
    };
    checkUpdates();
    const interval = setInterval(checkUpdates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Check for rain (Irish weather! ☔🇮🇪)
  useEffect(() => {
    if (!settings.rainNotificationsEnabled || !currentUser) return;

    const checkRain = async () => {
      try {
        const location = settings.rainNotificationLocation || 'Dublin,IE';
        const timing = settings.rainNotificationTiming || '3hours';

        // Convert timing to hours
        const hoursMap: Record<string, number> = {
          '1hour': 1,
          '3hours': 3,
          '12hours': 12,
          '24hours': 24
        };
        const hoursAhead = hoursMap[timing] || 3;

        // Check for rain using Open-Meteo (FREE & unlimited!)
        const alert = await weatherService.checkForUpcomingRain(location, hoursAhead);

        // Only show notification if rain is detected and we haven't shown it recently
        if (alert.willRain) {
          const lastAlert = rainAlert;
          // Show notification if it's a new alert or if previous alert was > 10 minutes ago
          const shouldShow = !lastAlert ||
            (Date.now() - lastAlert.timeDetected) > 10 * 60 * 1000;

          if (shouldShow) {
            setRainAlert(alert);
          }
        }
      } catch (error) {
        console.error('Rain check failed:', error);
      }
    };

    // Check immediately
    checkRain();

    // Then check every 30 minutes
    const interval = setInterval(checkRain, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [settings.rainNotificationsEnabled, settings.rainNotificationTiming, settings.rainNotificationLocation, currentUser]);

  const handleInstallUpdate = async () => {
    if (!updateInfo) return;
    setIsInstallingUpdate(true);
    try {
      console.log('💾 Saving all data before update...');
      const chats = await dbService.getAllChats();
      if (settings.enableCloudSync) {
        for (const chat of chats) {
          await syncService.syncChat(chat);
        }
      }

      // Save all settings keys
      for (const [key, value] of Object.entries(settings)) {
        await dbService.saveSetting(key, value);
      }

      const proxyUrl = settings.corsProxyUrl || 'http://localhost:3010';
      const response = await fetch(`${proxyUrl}/api/system/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();

      if (result.success) {
        alert('✅ Update installed successfully! The app will now reload.');
        window.location.reload();
      } else {
        alert(`❌ Update failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Update failed:', error);
      alert('❌ Update failed. Check console for details.');
    } finally {
      setIsInstallingUpdate(false);
    }
  };

  // Helper to open a feature in a tab
  const openInTab = useCallback((type: WorkspaceTab['type'], title: string, icon: string, data?: any) => {
    setTabs(prev => {
      const existing = prev.find(t => t.type === type);
      if (existing) {
        setActiveTabId(existing.id);
        return prev.map(t => t.id === existing.id ? { ...t, data: data ?? t.data } : t);
      }
      const newTab: WorkspaceTab = {
        id: type,
        type,
        title,
        icon,
        data
      };
      setActiveTabId(type);
      return [...prev, newTab];
    });
  }, []);

  // Close Tab Handler
  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      if (activeTabId === id && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      } else if (newTabs.length === 0) {
        const fallback = [{ id: 'chat', type: 'chat', title: 'Chat', icon: 'fa-solid fa-comments', isPinned: true }];
        setActiveTabId('chat');
        return fallback;
      }
      return newTabs;
    });
  }, [activeTabId]);

  // Modified Open Handlers
  const openBrowser = useCallback((url?: string) => {
    setBrowserOpenRequest({ url, ts: Date.now() });
    setInitialBrowserUrl(url);
    setActiveSurface('browser');
  }, []);

  const closeBrowserOverlay = useCallback(() => {
    setActiveSurface('chat');
    setInitialBrowserUrl(undefined);
    setBrowserOpenRequest(null);
    setTimeout(() => browserStateService.clearState(), 0);
  }, []);

  const openStudyNotes = useCallback(() => {
    if (settings.notesOpenInTab) {
      openInTab('notes', 'Study Notes', 'fa-solid fa-book');
    } else {
      setIsStudyNotesOpen(true);
      setActiveSurface('notes');
    }
  }, [settings.notesOpenInTab, openInTab]);

  const toggleTerminal = useCallback(() => {
    if (settings.terminalOpenInTab) {
      openInTab('terminal', 'Terminal', 'fa-solid fa-terminal');
    } else {
      setIsTerminalOpen(prev => !prev);
    }
  }, [settings.terminalOpenInTab, openInTab]);

  // Toggle radio playback (from external controls like screensaver)
  const toggleRadioPlayback = () => {
    setSettings(prev => ({ ...prev, radioEnabled: true }));
    setRadioToggleSignal(prev => prev + 1);
  };

  // Auto-sync every 5 minutes
  useEffect(() => {
    if (!currentUser || !settings.enableCloudSync) return;

    const autoSync = async () => {
      try {
        console.log('🔄 Auto-sync starting...');

        // Sync all chats
        const chats = await dbService.getAllChats();
        for (const chat of chats) {
          await syncService.syncChat(chat);
        }

        // Sync all settings
        const allSettings = await dbService.getAllSettings();
        for (const [key, value] of Object.entries(allSettings)) {
          await syncService.syncSettings(key, value);
        }

        console.log('✅ Auto-sync complete');
        const now = Date.now();
        setSyncStatus(prev => ({ ...prev, lastSync: now }));
        // Save last sync time to IndexedDB
        await dbService.saveSetting('lastSyncTime', now);
      } catch (error) {
        console.error('❌ Auto-sync failed:', error);
      }
    };

    // Run immediately on mount
    autoSync();

    // Then run every 5 minutes (300000ms)
    const intervalId = setInterval(autoSync, 300000);

    return () => clearInterval(intervalId);
  }, [currentUser, settings.enableCloudSync]);

  // Load active user
  useEffect(() => {
    const loadUser = async () => {
      const activeUser = await dbService.getSetting('active_user');
      if (activeUser) setCurrentUser(activeUser);
    };
    loadUser();
  }, []);

  // Load user data when user changes
  useEffect(() => {
    if (!currentUser) {
      setSessions([]);
      setSettings(DEFAULT_SETTINGS);
      setCurrentSessionId(null);
      return;
    }

    const loadUserData = async () => {
      setNeedsBackupImport(false);

      const sanitizeModels = (list: string[] | undefined, allowed: string[]) => {
        const filtered = (list || []).filter(m => allowed.includes(m));
        const supplemented = Array.from(new Set([...allowed, ...filtered]));
        return supplemented.length > 0 ? supplemented : allowed;
      };

      // Load from IndexedDB first
      const chats = await dbService.getAllChats();
      let sessionList: ChatSession[] = [];
      if (chats.length > 0) {
        sessionList = chats.reverse();
        setCurrentSessionId(chats[0].id);
        setHydrationSource('local');
      }

      console.log('🟢 LOADING SETTINGS for user:', currentUser);
      const storedSettings = await dbService.getSetting(`settings_${currentUser}`);
      console.log('🟢 Stored settings found in IndexedDB');

      let finalSettings = DEFAULT_SETTINGS;

      if (storedSettings) {
        console.log('🟢 Radio in stored settings:', storedSettings.radioEnabled, 'Currency:', storedSettings.currency);

        const mergedSettings = { ...DEFAULT_SETTINGS, ...storedSettings };
        mergedSettings.availableModels = {
          ...DEFAULT_SETTINGS.availableModels,
          ...mergedSettings.availableModels,
          gemini: sanitizeModels(mergedSettings.availableModels?.gemini, DEFAULT_SETTINGS.availableModels.gemini),
          openai: sanitizeModels(mergedSettings.availableModels?.openai, DEFAULT_SETTINGS.availableModels.openai),
          anthropic: sanitizeModels(mergedSettings.availableModels?.anthropic, DEFAULT_SETTINGS.availableModels.anthropic),
          grok: DEFAULT_SETTINGS.availableModels.grok,
          huggingface: sanitizeModels(mergedSettings.availableModels?.huggingface, DEFAULT_SETTINGS.availableModels.huggingface)
        };
        mergedSettings.savedPrompts = ensureImagineFirst(mergedSettings.savedPrompts);

        finalSettings = mergedSettings;
        setHydrationSource('local');
        console.log('🟢 Merged settings from IndexedDB:', { radioEnabled: finalSettings.radioEnabled, currency: finalSettings.currency });
      } else {
        console.log('⚠️ No stored settings found in IndexedDB, using defaults');
      }

      const shouldTryServer = sessionList.length === 0 || !storedSettings || (storedSettings?.enableCloudSync ?? finalSettings.enableCloudSync ?? DEFAULT_SETTINGS.enableCloudSync);

      if (shouldTryServer) {
        console.log('☁️ Checking server for updates...');
        setIsLoadingFromServer(true);
        try {
          const serverChats = await syncService.getAllChats();
          const serverSettings = await syncService.getAllSettings();

          if (serverChats && serverChats.length > 0) {
            sessionList = serverChats;
            setCurrentSessionId(serverChats[0].id);
            setHydrationSource('server');
            for (const chat of serverChats) {
              await dbService.saveChat(chat);
            }
            console.log(`☁️ Restored ${serverChats.length} chats from server`);
          }

          if (serverSettings && serverSettings[`settings_${currentUser}`]) {
            const serverUserSettings = serverSettings[`settings_${currentUser}`];
            const mergedFromServer = { ...DEFAULT_SETTINGS, ...finalSettings, ...serverUserSettings };
            mergedFromServer.availableModels = {
              ...DEFAULT_SETTINGS.availableModels,
              ...mergedFromServer.availableModels,
              gemini: sanitizeModels(mergedFromServer.availableModels?.gemini, DEFAULT_SETTINGS.availableModels.gemini),
              openai: sanitizeModels(mergedFromServer.availableModels?.openai, DEFAULT_SETTINGS.availableModels.openai),
              anthropic: sanitizeModels(mergedFromServer.availableModels?.anthropic, DEFAULT_SETTINGS.availableModels.anthropic),
              grok: DEFAULT_SETTINGS.availableModels.grok,
              huggingface: sanitizeModels(mergedFromServer.availableModels?.huggingface, DEFAULT_SETTINGS.availableModels.huggingface)
            };
            mergedFromServer.savedPrompts = ensureImagineFirst(mergedFromServer.savedPrompts);

            finalSettings = mergedFromServer;
            setHydrationSource('server');
            console.log('☁️ Merged settings from server');
          }

          if (sessionList.length === 0 && !storedSettings && (!serverSettings || Object.keys(serverSettings).length === 0)) {
            setNeedsBackupImport(true);
          }
        } catch (error) {
          console.error('❌ Server sync failed, using local data only:', error);
          if (sessionList.length === 0 && !storedSettings) {
            setNeedsBackupImport(true);
          }
        } finally {
          setIsLoadingFromServer(false);
        }
      }

      if (sessionList.length > 0) {
        setSessions(sessionList);
      }

      setSettings(finalSettings);
      setSettingsLoaded(true);
      console.log('✅ Settings load complete:', { radioEnabled: finalSettings.radioEnabled, currency: finalSettings.currency, hydrationSource });
    };

    loadUserData();
  }, [currentUser]);

  // Save chats to IndexedDB and sync to server
  useEffect(() => {
    if (currentUser && sessions.length > 0) {
      queueChatSave(`user:${currentUser}:chats`, sessions, settings.enableCloudSync, () =>
        setSyncStatus(prev => ({ ...prev, lastSync: Date.now() }))
      );
    }
  }, [sessions, currentUser, settings.enableCloudSync]);

  // Save settings to IndexedDB and sync to server
  useEffect(() => {
    // Don't save if: no user, not loaded yet, or currently loading from server
    if (currentUser && settingsLoaded && !isLoadingFromServer) {
      queueSettingSave(`settings_${currentUser}`, settings, settings.enableCloudSync, () =>
        setSyncStatus(prev => ({ ...prev, lastSync: Date.now() }))
      );
    }
  }, [settings, currentUser, settingsLoaded, isLoadingFromServer]);

  // Idle detection for auto-activation of Vision Mode
  useEffect(() => {
    if (!settings.visionModeEnabled || !settings.visionModeAutoActivate || !currentUser) return;

    const handleActivity = () => {
      setLastActivityTime(Date.now());
      // Only auto-close if it was auto-activated (like a screensaver)
      // Manual activation requires manual close (ESC or Exit button)
      if (isVisionModeOpen && wasVisionModeAutoActivated) {
        setIsVisionModeOpen(false);
        setWasVisionModeAutoActivated(false);
      }
    };

    // Track user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Check for idle time
    const idleCheckInterval = setInterval(() => {
      const idleTime = (Date.now() - lastActivityTime) / 1000 / 60; // minutes
      if (idleTime >= settings.visionModeIdleTime && !isVisionModeOpen && !isLocked) {
        setIsVisionModeOpen(true);
        setWasVisionModeAutoActivated(true); // Mark as auto-activated
      }
    }, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(idleCheckInterval);
    };
  }, [settings.visionModeEnabled, settings.visionModeAutoActivate, settings.visionModeIdleTime, currentUser, lastActivityTime, isVisionModeOpen, isLocked, wasVisionModeAutoActivated]);

  const handleLogin = async (username: string) => {
    await dbService.saveSetting('active_user', username);
    setCurrentUser(username);
    browserStateService.setUser(username);
  };

  const handleLogout = async () => {
    await dbService.saveSetting('active_user', null);
    setCurrentUser(null);
    browserStateService.setUser(null);
  };

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Research',
      messages: [],
      model: ModelType.FAST,
      updatedAt: Date.now(),
      knowledgeBase: [],
      isStarred: false,
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setActiveTabId('chat');
    setActiveSurface('chat');
    setIsTrainingOpen(false);
    setIsStudyNotesOpen(false);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const updateSession = useCallback((id: string, updates: Partial<ChatSession>) => {
    setSessions((prev) => prev.map((session) => (session.id === id ? { ...session, ...updates } : session)));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) setCurrentSessionId(null);
  }, [currentSessionId]);

  const renameSession = useCallback((id: string, title: string) => {
    updateSession(id, { title });
  }, [updateSession]);

  const deleteAllSessions = useCallback(() => { setSessions([]); setCurrentSessionId(null); }, []);
  const toggleStarSession = useCallback((id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isStarred: !s.isStarred } : s));
  }, []);
  const toggleTheme = useCallback(() => {
    setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : prev.theme === 'light' ? 'tron' : 'dark' }));
  }, []);
  const toggleMatrixMode = useCallback(() => { setSettings(prev => ({ ...prev, matrixMode: !prev.matrixMode })); }, []);
  const toggleHolidayMode = useCallback(() => { setSettings(prev => ({ ...prev, holidayMode: !prev.holidayMode })); }, []);
  const cycleHolidayEffect = useCallback(() => {
    setSettings(prev => {
      const order: Array<'snow' | 'confetti' | 'sparkles'> = ['snow', 'confetti', 'sparkles'];
      const idx = order.indexOf(prev.holidayEffect);
      const next = order[(idx + 1) % order.length];
      return { ...prev, holidayEffect: next, holidayMode: true };
    });
  }, []);

  const openTraining = useCallback(() => {
    setIsTrainingOpen(true);
    setActiveSurface('training');
    setIsStudyNotesOpen(false);
    setIsWordPressOpen(false);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const openCanvas = useCallback(() => {
    setIsCanvasOpen(true);
    setActiveSurface('canvas');
    setIsWordPressOpen(false);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const openWordPress = useCallback(() => {
    setIsWordPressOpen(true);
    setActiveSurface('wordpress');
    setIsCanvasOpen(false);
    setIsTrainingOpen(false);
    setIsStudyNotesOpen(false);
    setIsEditorOpen(false);
    setIsStudyClockOpen(false);
    setIsManualOpen(false);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const openWeather = useCallback(() => {
    setIsWeatherOpen(true);
    setActiveSurface('weather');
    setIsWordPressOpen(false);
    setIsCanvasOpen(false);
    setIsTrainingOpen(false);
    setIsStudyNotesOpen(false);
    setIsEditorOpen(false);
    setIsStudyClockOpen(false);
    setIsManualOpen(false);
    setIsBrowserOpen(false);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  // Listen for "request-open-url" from Main Process (for external links)
  useEffect(() => {
    if (window.electronAPI?.on) {
      const cleanup = window.electronAPI.on('request-open-url', (url: any) => {
        console.log('🔗 Opening external link in internal tab:', url);
        openBrowser(url);
      });
      return cleanup;
    }
  }, [openBrowser]);

  // Sync "Open Links in App" setting to Main Process
  useEffect(() => {
    if (window.electronAPI?.setLinkBehavior) {
      window.electronAPI.setLinkBehavior(settings.openLinksInApp || false);
    }
  }, [settings.openLinksInApp]);

  const saveImageToLocal = useCallback(async (url?: string) => {
    if (!url) return undefined;
    try {
      const proxy = (settings.corsProxyUrl || 'http://localhost:3010').replace(/\/$/, '');
      const resp = await fetch(`${proxy}/api/save-image?url=${encodeURIComponent(url)}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return data.savedPath || data.filename;
    } catch (err) {
      console.warn('Save image failed, will use remote URL', err);
      return undefined;
    }
  }, [settings.corsProxyUrl]);

  const openNoteDraft = useCallback(async (draft: { title?: string; content?: string; imageUrl?: string }) => {
    let savedImagePath: string | undefined;
    if (draft.imageUrl) {
      savedImagePath = await saveImageToLocal(draft.imageUrl);
    }
    const safeTitle = typeof draft.title === 'string' ? draft.title : draft.title ? String(draft.title) : '';
    const safeContent = typeof draft.content === 'string' ? draft.content : draft.content ? String(draft.content) : '';
    setNoteDraft({ ...draft, title: safeTitle, content: safeContent, savedImagePath });
    setIsStudyNotesOpen(true);
    setIsTrainingOpen(false);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [saveImageToLocal]);

  const updateMessages = useCallback(async (sessionId: string, messagesOrUpdater: Message[] | ((msgs: Message[]) => Message[])) => {
    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === sessionId) {
          const newMessages = typeof messagesOrUpdater === 'function' ? messagesOrUpdater(s.messages) : messagesOrUpdater;
          return { ...s, messages: newMessages, updatedAt: Date.now() };
        }
        return s;
      });
      return updated.sort((a, b) => (a.isStarred === b.isStarred) ? b.updatedAt - a.updatedAt : a.isStarred ? -1 : 1);
    });

    if (typeof messagesOrUpdater === 'function') return;
    const messages = messagesOrUpdater;
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.messages.length === 0 && messages.length > 0) {
      const firstUserMsg = messages.find(m => m.sender === Sender.USER);
      if (firstUserMsg) {
        const title = await generateTitle(firstUserMsg.text, settings.geminiApiKey);
        updateSession(sessionId, { title });
      }
    }
  }, [sessions, updateSession, settings.geminiApiKey]);

  const addToKnowledgeBase = useCallback((sessionId: string, chunks: DocumentChunk[]) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, knowledgeBase: [...(s.knowledgeBase || []), ...chunks] } : s));
  }, []);

  const handlePetCommand = useCallback(() => {
    const messages = [
      "The Ranger Pet purrs happily at your attention!",
      "Ranger Pet wags its tail! You're doing great!",
      "A friendly nudge from your Ranger Pet: Keep up the excellent work!",
      "Ranger Pet smiles! Your presence brightens its day!",
      "Feeling motivated? Your Ranger Pet is right there with you!",
      "Woof! (That's 'You're awesome!' in pet speak)",
      "Meow! (Translation: 'Success is within reach!')",
      "Ranger Pet offers a paw of encouragement!",
      "You got this, Commander! - Ranger Pet",
      "Ranger Pet believes in you!",
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    setPetMessage(randomMessage);
    setIsPetVisible(true);
    // Add pet message to chat for record
    if (currentSessionId) {
      updateMessages(currentSessionId, (prevMessages) => [
        ...prevMessages,
        {
          id: uuidv4(),
          sender: Sender.AI,
          text: `*Ranger Pet says:* ${randomMessage}`,
          timestamp: Date.now(),
          model: ModelType.FAST, // Or a specific pet model if you implement one
        }
      ]);
    }
  }, [currentSessionId, updateMessages]);

  const handlePetSessionCelebrate = useCallback(
    (info: { isBreak: boolean; modeType: string; duration: number; pomodoroNumber?: number }) => {
      if (info.isBreak) {
        petBridge.addXP?.(10);
        petBridge.setMood?.('playful');
      } else {
        petBridge.addXP?.(50);
        petBridge.setMood?.('celebrating');
        setTimeout(() => petBridge.setMood?.('happy'), 4000);
      }
    },
    [petBridge]
  );

  const handleSendCodeQuestion = useCallback(
    (message: string, createNewSession = false) => {
      let targetSessionId = currentSessionId;

      // Create or reuse Code Assistant session
      if (createNewSession) {
        // Check if we have an existing Code Assistant session
        let codeSession = sessions.find((s) => s.title === '🤖 Code Assistant');

        if (!codeSession) {
          // Create new Code Assistant session
          const newSessionId = uuidv4();
          const newSession: ChatSession = {
            id: newSessionId,
            title: '🤖 Code Assistant',
            messages: [],
            model: ModelType.GEMINI_2_5_PRO,
            updatedAt: Date.now(),
            knowledgeBase: [],
          };
          setSessions((prev) => [newSession, ...prev]);
          targetSessionId = newSessionId;
        } else {
          targetSessionId = codeSession.id;
        }
      } else if (!currentSessionId) {
        // No session selected and not creating new one
        alert('Please open a chat session or use the quick actions to create a Code Assistant session.');
        return;
      }

      // Safety check
      if (!targetSessionId) {
        alert('Unable to create or find chat session.');
        return;
      }

      // Add user message
      const newMessage: Message = {
        id: uuidv4(),
        sender: Sender.USER,
        text: message,
        timestamp: Date.now()
      };

      updateMessages(targetSessionId, (prev) => [...prev, newMessage]);

      // Switch to the session and open sidebar
      setCurrentSessionId(targetSessionId);
      setActiveTabId('chat');
      setIsBrowserOpen(false);
      setSidebarOpen(true);
      setIsEditorOpen(false);
    },
    [currentSessionId, sessions, updateMessages, setSessions, setCurrentSessionId]
  );

  if (!currentUser) return <AuthPage onLogin={handleLogin} securityMode={settings.securityMode} />;
  if (isLocked) return <AuthPage onLogin={() => setIsLocked(false)} securityMode={settings.securityMode} isLocked={true} lockedUser={currentUser} />;

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const isMatrix = settings.matrixMode;
  const isTron = settings.theme === 'tron';
  const themeClass = isMatrix ? 'dark' : (settings.theme === 'dark' || isTron ? 'dark' : '');
  return (
    <div className={themeClass}>
      <style>{`
        @keyframes scanner {
          0% { left: -25%; }
          100% { left: 100%; }
        }
        .scanner-bar {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 25%;
          animation: scanner 2.2s ease-in-out infinite alternate;
        }
        .scanner-rainbow {
          background: linear-gradient(90deg, #ff0080, #ff8c00, #ff0, #0f0, #0ff, #00f, #8a2be2);
          background-size: 200% 200%;
          animation: scanner 2.2s ease-in-out infinite alternate, rainbow-shift 3s linear infinite;
        }
        @keyframes rainbow-shift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
      `}</style>
      <div className={`flex h-screen w-full overflow-hidden font-sans ${isMatrix ? 'bg-black text-green-500 font-mono' : isTron ? 'bg-tron-dark text-tron-cyan font-tron' : 'bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100'}`}>

        {isMatrix && <MatrixRain />}
        {settings.holidayMode && (
          <>
            {settings.holidayEffect === 'snow' && <SnowOverlay isTron={isTron} />}
            {settings.holidayEffect === 'confetti' && <ConfettiOverlay isTron={isTron} />}
            {settings.holidayEffect === 'sparkles' && <SparkleOverlay isTron={isTron} />}
          </>
        )}
        {/* Tron Scanline Overlay */}
        {isTron && <div className="fixed inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 pointer-events-none bg-[length:100%_4px,6px_100%]"></div>}

        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-zinc-900 border-b flex items-center px-4 z-50 justify-between">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-zinc-500"><i className="fa-solid fa-bars"></i></button>
          <span className="font-bold">RANGERPLEX</span>
          <div className="flex gap-2">
            <button onClick={() => setIsSettingsOpen(true)}><i className="fa-solid fa-gear"></i></button>
            <button onClick={createNewSession}><i className="fa-solid fa-plus"></i></button>
          </div>
        </div>

        <Sidebar
          isOpen={isSidebarOpen}
          sessions={sessions}
          currentId={currentSessionId}
          currentUser={currentUser}
          isDarkMode={settings.theme !== 'light'}
          settings={settings}
          petBridge={petBridge}
          onSelect={(id) => { setCurrentSessionId(id); setActiveTabId('chat'); setActiveSurface('chat'); setIsTrainingOpen(false); setIsStudyNotesOpen(false); if (window.innerWidth < 768) setSidebarOpen(false); }}
          onNew={createNewSession}
          onDelete={deleteSession}
          onRename={renameSession}
          onDeleteAll={deleteAllSessions}
          onToggleStar={toggleStarSession}
          onLogout={handleLogout}
          onToggleTheme={toggleTheme}
          onToggleMatrix={toggleMatrixMode}
          onOpenTraining={openTraining}
          onOpenStudyNotes={openStudyNotes}
          onOpenStudyClock={() => setIsStudyClockOpen(true)}
          onOpenCanvas={openCanvas}
          onOpenWordPress={openWordPress}
          onOpenBlockchainChat={() => setIsBlockchainChatOpen(true)}
          onOpenEditor={() => setIsEditorOpen(true)}
          onOpenBrowser={() => openBrowser()}
          onOpenWeather={openWeather}
          onLock={() => setIsLocked(true)}
          onOpenVisionMode={() => {
            setIsVisionModeOpen(true);
            setWasVisionModeAutoActivated(false); // Manual activation - don't auto-close on activity
          }}
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          onToggleTerminal={toggleTerminal}
          isTerminalOpen={isTerminalOpen}
          onShowChats={() => {
            setIsTrainingOpen(false);
            setIsStudyNotesOpen(false);
            setIsCanvasOpen(false);
            setIsWordPressOpen(false);
            setIsStudyClockOpen(false);
            setIsManualOpen(false);
            if (window.innerWidth < 768) setSidebarOpen(true); // Ensure sidebar is open on mobile to see chats
          }}
        />




        <main className={`flex-1 flex flex-col h-full relative transition-all duration-300 md:pl-72 pt-14 md:pt-0 z-10`}>
          {/* ... existing header ... */}

          {/* Workspace Tabs */}
          {/* Workspace Tabs - Removed by user request */}
          {/* {tabs.length > 0 && (
            <WorkspaceTabs
              tabs={tabs}
              activeTabId={activeTabId}
              onSelect={setActiveTabId}
              onClose={closeTab}
              isTron={isTron}
            />
          )} */}

          {/* Persistent Tab Content Area */}
          <div className="flex-1 relative">

            {/* Chat Tab (Always rendered, hidden if inactive) */}
            <div className={`absolute inset-0 ${activeTabId === 'chat' ? 'z-10' : 'z-0 invisible'}`}>
              {currentSession ? (
                <ChatInterface
                  onOpenWordPress={openWordPress}
                  session={currentSession}
                  currentUser={currentUser}
                  onUpdateMessages={(msgs) => updateMessages(currentSession.id, msgs)}
                  onUpdateModel={(model) => updateSession(currentSession.id, { model })}
                  onAddKnowledge={(chunks) => addToKnowledgeBase(currentSession.id, chunks)}
                  settings={settings}
                  onMakeNote={(draft) => openNoteDraft(draft)}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  onToggleHolidayMode={toggleHolidayMode}
                  onCycleHolidayEffect={cycleHolidayEffect}
                  showHolidayButtons={settings.showHeaderControls === true}
                  onPetCommand={handlePetCommand}
                  onOpenCanvas={openCanvas}
                  onOpenStudyClock={() => setIsStudyClockOpen(true)}
                  onOpenManual={() => setIsManualOpen(true)}
                  saveImageToLocal={saveImageToLocal}
                  petBridge={petBridge}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  {/* ... Welcome Screen ... */}
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg border ${isTron ? 'border-tron-cyan bg-black shadow-[0_0_20px_#00f3ff]' : 'bg-white dark:bg-zinc-800 border-gray-200'}`}>
                    <i className={`fa-solid ${isTron ? 'fa-network-wired text-tron-cyan animate-pulse' : 'fa-compass text-teal-500'} text-4xl`}></i>
                  </div>
                  <h1 className={`text-4xl font-bold mb-2 tracking-tight ${isTron ? 'text-tron-cyan font-tron' : ''}`}>
                    {isMatrix ? `WELCOME, ${currentUser?.toUpperCase()}` : isTron ? `GREETINGS, PROGRAM ${currentUser?.toUpperCase()}` : `Welcome back, ${currentUser}`}
                  </h1>
                  <div className="flex gap-3 mt-8">
                    <button onClick={createNewSession} className={`px-8 py-3 rounded-full font-bold uppercase tracking-wider transition-all ${isTron ? 'bg-tron-cyan text-black hover:bg-white hover:shadow-[0_0_20px_#00f3ff]' : 'bg-teal-600 text-white hover:bg-teal-500'}`}>
                      {isTron ? 'INITIATE' : 'Start'}
                    </button>
                    <button onClick={() => setIsSettingsOpen(true)} className={`px-8 py-3 rounded-full font-bold uppercase tracking-wider border transition-all ${isTron ? 'border-tron-cyan text-tron-cyan hover:bg-tron-cyan/10' : 'border-gray-300'}`}>
                      Config
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Terminal Tab */}
            {tabs.some(t => t.type === 'terminal') && (
              <div className={`absolute inset-0 bg-black ${activeTabId === 'terminal' ? 'z-10' : 'z-0 invisible'}`}>
                <RangerTerminal />
              </div>
            )}

            {/* Notes surface */}
            {activeSurface === 'notes' && (
              <div className="absolute inset-0 z-10 bg-white dark:bg-zinc-900">
                <StudyNotes currentUser={currentUser} settings={settings} initialDraft={noteDraft || undefined} onOpenSettings={() => setIsSettingsOpen(true)} />
              </div>
            )}

            {activeSurface === 'browser' && (
              <div className="absolute inset-0 z-10 bg-white dark:bg-zinc-900">
                <BrowserLayout
                  initialUrl={initialBrowserUrl}
                  defaultUrl={settings.defaultBrowserUrl}
                  openRequest={browserOpenRequest || undefined}
                  onRequestClose={closeBrowserOverlay}
                />
              </div>
            )}

            {activeSurface === 'wordpress' && (
              <div className="absolute inset-0 z-20 bg-gray-50 dark:bg-zinc-900">
                <button onClick={() => { setIsWordPressOpen(false); setActiveSurface('chat'); }} className="absolute top-4 right-4 z-50 p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg"><i className="fa-solid fa-xmark"></i></button>
                <WordPressDashboard onOpenBrowser={openBrowser} autoStart={true} />
              </div>
            )}

            {activeSurface === 'weather' && (
              <div className="absolute inset-0 z-20">
                <button onClick={() => { setIsWeatherOpen(false); setActiveSurface('chat'); }} className="absolute top-4 right-4 z-50 p-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg"><i className="fa-solid fa-xmark"></i></button>
                <WeatherStation isDarkMode={settings.theme !== 'light'} isTron={isTron} />
              </div>
            )}

            {activeSurface === 'training' && (
              <div className="absolute inset-0 z-20 bg-white dark:bg-zinc-900">
                <TrainingPage sessions={sessions} onClose={() => { setIsTrainingOpen(false); setActiveSurface('chat'); }} />
              </div>
            )}

          </div>
        </main>

        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onSave={setSettings}
            onOpenBackupManager={() => setShowBackupManager(true)}
            onOpenTraining={openTraining}
            sessions={sessions}
            currentId={currentSessionId}
            onExportChat={(session) => {
              const md = `# ${session.title}\n\n${session.messages.map((m: any) => `**${m.role}:** ${m.content}`).join('\n\n')}`;
              const blob = new Blob([md], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${session.title.replace(/[^a-z0-9]/gi, '_')}.md`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            onExportAll={async () => {
              try {
                const data = await dbService.exportAll();
                const json = JSON.stringify(data, null, 2);
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `rangerplex-backup-${timestamp}.json`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Export all failed:', error);
                alert('Failed to export data. Please try again.');
              }
            }}
            onPurgeAll={async () => {
              try {
                await dbService.clearChats();
                await dbService.clearSettings();
                await dbService.clearAllWin95States();
                localStorage.removeItem('rangerplex_canvas_boards');
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                  if (key.startsWith('win95_state_')) {
                    localStorage.removeItem(key);
                  }
                });
                setSessions([]);
                setCurrentSessionId(null);
                window.location.reload();
              } catch (error) {
                console.error('Purge failed:', error);
                alert('Failed to purge data. Please try again.');
              }
            }}
          />
        )}

        {/* Ranger Vision Mode */}
        <RangerVisionMode
          isOpen={isVisionModeOpen}
          onClose={() => {
            setIsVisionModeOpen(false);
            setWasVisionModeAutoActivated(false); // Reset flag on close
          }}
          theme={settings.theme}
          onToggleRadio={toggleRadioPlayback}
        />

        {/* Ranger Radio Player */}
        {currentUser && settings.radioEnabled && (
          <RadioPlayer
            settings={settings}
            onSettingsChange={(updates) => setSettings({ ...settings, ...updates })}
            theme={settings.theme}
            externalToggleSignal={radioToggleSignal}
          />
        )}

        {/* Study Clock */}
        {currentUser && isStudyClockOpen && (
          <StudyClock
            userId={currentUser}
            theme={settings.theme}
            enableCloudSync={settings.enableCloudSync}
            onSessionComplete={handlePetSessionCelebrate}
            onClose={() => setIsStudyClockOpen(false)}
          />
        )}

        {/* Ranger Console (Terminal) - Floating or Minimized */}
        {isTerminalOpen && !settings.terminalOpenInTab && !isTerminalMinimized && (
          <div className={`fixed bottom-0 left-0 right-0 h-1/3 min-h-[250px] max-h-[500px] border-t ${isTron ? 'border-tron-cyan/30 bg-black' : 'border-gray-200 dark:border-zinc-800 bg-zinc-900'} text-white p-0 font-mono text-sm overflow-hidden z-[9000] shadow-2xl flex flex-col`}>
            <div className={`flex items-center justify-between px-4 py-2 text-xs font-bold uppercase tracking-wider border-b ${isTron ? 'bg-tron-cyan/10 border-tron-cyan/30 text-tron-cyan' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-terminal"></i>
                <span>Ranger Console</span>
                <span className="px-1.5 py-0.5 rounded bg-green-900/30 text-green-400 text-[10px]">CONNECTED</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSettings(s => ({ ...s, terminalOpenInTab: true }));
                    openInTab('terminal', 'Terminal', 'fa-solid fa-terminal');
                  }}
                  className="hover:text-white transition-colors flex items-center gap-1"
                  title="Dock to Tab"
                >
                  <i className="fa-solid fa-table-columns"></i>
                </button>
                <button onClick={() => setIsTerminalMinimized(true)} className="hover:text-white transition-colors" title="Minimize"><i className="fa-solid fa-window-minimize"></i></button>
                <button className="hover:text-white transition-colors" title="Expand"><i className="fa-solid fa-expand"></i></button>
                <button onClick={() => setIsTerminalOpen(false)} className="hover:text-white transition-colors" title="Close Console"><i className="fa-solid fa-xmark"></i></button>
              </div>
            </div>
            <div className="flex-1 bg-black p-1 font-mono overflow-hidden">
              <RangerTerminal />
            </div>
          </div>
        )}

        {/* Ranger Console - Minimized Tab (beside Settings) */}
        {isTerminalOpen && !settings.terminalOpenInTab && isTerminalMinimized && (
          <div
            className={`fixed bottom-4 left-[216px] z-[9999] rounded-lg border-2 shadow-2xl cursor-pointer transition-all duration-300 hover:scale-105 backdrop-blur-sm ${isTron
              ? 'bg-tron-dark border-tron-cyan text-tron-cyan shadow-[0_0_20px_rgba(0,243,255,0.2)]'
              : 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border-gray-200 dark:border-zinc-800'
              }`}
            onClick={() => setIsTerminalMinimized(false)}
          >
            <div className="flex items-center justify-between px-4 py-2 gap-3 min-w-[200px]">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-terminal text-base"></i>
                <span className="font-bold uppercase tracking-wide text-xs">Console</span>
                <span className="px-1.5 py-0.5 rounded bg-green-900/30 text-green-400 text-[9px]">ON</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTerminalMinimized(false);
                }}
                className="opacity-70 hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-white/10"
                title="Restore"
              >
                <i className="fa-solid fa-window-restore text-xs"></i>
              </button>
            </div>
          </div>
        )}


        {/* Canvas Board */}
        {isCanvasOpen && (
          <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
            <CanvasBoard
              isOpen={isCanvasOpen}
              theme={settings.theme}
              onClose={() => setIsCanvasOpen(false)}
              defaultColor={settings.defaultCanvasColor}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </div>
        )}

        {/* Code Editor */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-[9999] bg-black">
            <EditorTerminalSplit
              onSendToChat={handleSendCodeQuestion}
              onClose={() => setIsEditorOpen(false)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              autoOpenTerminal={settings.editorAutoOpenTerminal}
              fontSize={settings.editorFontSize}
              tabSize={settings.editorTabSize}
              wordWrap={settings.editorWordWrap}
              minimap={settings.editorMinimap}
              lineNumbers={settings.editorLineNumbers}
            />
          </div>
        )}

        {/* Blockchain Chat */}
        <BlockchainChat
          isOpen={isBlockchainChatOpen}
          onClose={() => setIsBlockchainChatOpen(false)}
        />

        {/* Save Status Indicator */}
        <SaveStatusIndicator
          enabled={settings.saveStatusNotifications}
          displayMs={settings.saveStatusDurationMs}
        />

        {/* Update Notification */}
        {updateInfo && (
          <UpdateNotification
            version={updateInfo.latestVersion}
            message={updateInfo.latestMessage}
            onInstall={handleInstallUpdate}
            onDismiss={() => setUpdateInfo(null)}
            isInstalling={isInstallingUpdate}
            theme={settings.theme}
          />
        )}

        {/* Rain Notification ☔🇮🇪 */}
        {rainAlert && rainAlert.willRain && (
          <RainNotification
            hoursUntilRain={rainAlert.hoursUntilRain}
            location={rainAlert.location}
            precipitation={rainAlert.precipitation}
            onViewWeather={() => {
              setIsWeatherOpen(true);
              setRainAlert(null);
            }}
            onDismiss={() => setRainAlert(null)}
            theme={settings.theme}
          />
        )}

        {/* Manual Viewer */}
        <ManualViewer
          open={isManualOpen}
          onClose={() => setIsManualOpen(false)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Ranger Pet */}
        <RangerPet
          isVisible={isPetVisible}
          onClose={() => setIsPetVisible(false)}
          message={petMessage}
        />

        {/* Backup Manager */}
        {showBackupManager && (
          <BackupManager theme={settings.theme} onClose={() => setShowBackupManager(false)} />
        )}

      </div>
    </div>
  );
};

export default App;

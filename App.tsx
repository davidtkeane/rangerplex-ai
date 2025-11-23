
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
import SnowOverlay from './components/SnowOverlay';
import ConfettiOverlay from './components/ConfettiOverlay';
import SparkleOverlay from './components/SparkleOverlay';
import StudyNotes from './components/StudyNotes';
import { ChatSession, Message, Sender, ModelType, DocumentChunk, AppSettings, DEFAULT_SETTINGS } from './types';
import { generateTitle } from './services/geminiService';
import { dbService } from './services/dbService';
import { syncService } from './services/syncService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

      // Check if migration is needed
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
  useEffect(() => {
    if (settings.enableCloudSync) {
      console.log('☁️ Cloud sync enabled');
      syncService.enableSync();
    } else {
      console.log('📴 Cloud sync disabled');
      syncService.disableSync();
    }
  }, [settings.enableCloudSync]);

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
      // Load chats from IndexedDB
      const chats = await dbService.getAllChats();
      if (chats.length > 0) {
        setSessions(chats.reverse()); // Most recent first
        setCurrentSessionId(chats[0].id);
      }

      // Load settings
      console.log('🟢 LOADING SETTINGS for user:', currentUser);
      const storedSettings = await dbService.getSetting(`settings_${currentUser}`);
      console.log('🟢 Stored settings from IndexedDB:', storedSettings);

      const sanitizeModels = (list: string[] | undefined, allowed: string[]) => {
        const filtered = (list || []).filter(m => allowed.includes(m));
        const supplemented = Array.from(new Set([...allowed, ...filtered]));
        return supplemented.length > 0 ? supplemented : allowed;
      };

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
          grok: DEFAULT_SETTINGS.availableModels.grok, // Always use latest Grok models (updated Nov 2025)
          huggingface: sanitizeModels(mergedSettings.availableModels?.huggingface, DEFAULT_SETTINGS.availableModels.huggingface)
        };
        mergedSettings.savedPrompts = ensureImagineFirst(mergedSettings.savedPrompts);

        finalSettings = mergedSettings;
        console.log('🟢 Merged settings from IndexedDB:', { radioEnabled: finalSettings.radioEnabled, currency: finalSettings.currency });
      } else {
        console.log('⚠️ No stored settings found in IndexedDB, using defaults');
      }

      // Sync with server (only if cloud sync enabled - check merged settings OR defaults)
      const shouldSyncFromServer = storedSettings?.enableCloudSync ?? finalSettings.enableCloudSync ?? DEFAULT_SETTINGS.enableCloudSync;
      if (shouldSyncFromServer) {
        console.log('☁️ Cloud sync enabled, checking server for updates...');
        setIsLoadingFromServer(true); // Prevent save loop during server load
        try {
          const serverChats = await syncService.getAllChats();
          const serverSettings = await syncService.getAllSettings();

          // Merge server data (newer data wins based on updatedAt)
          if (serverChats.length > 0) {
            console.log(`☁️ Found ${serverChats.length} chats on server`);
            for (const chat of serverChats) {
              await dbService.saveChat(chat);
            }
            setSessions(serverChats);
          }

          if (Object.keys(serverSettings).length > 0 && serverSettings[`settings_${currentUser}`]) {
            console.log('☁️ Found settings on server, merging with local...');
            const serverUserSettings = serverSettings[`settings_${currentUser}`];

            // Merge: server settings override local (server is source of truth when sync enabled)
            const mergedFromServer = { ...DEFAULT_SETTINGS, ...finalSettings, ...serverUserSettings };
            mergedFromServer.availableModels = {
              ...DEFAULT_SETTINGS.availableModels,
              ...mergedFromServer.availableModels,
              gemini: sanitizeModels(mergedFromServer.availableModels?.gemini, DEFAULT_SETTINGS.availableModels.gemini),
              openai: sanitizeModels(mergedFromServer.availableModels?.openai, DEFAULT_SETTINGS.availableModels.openai),
              anthropic: sanitizeModels(mergedFromServer.availableModels?.anthropic, DEFAULT_SETTINGS.availableModels.anthropic),
              grok: DEFAULT_SETTINGS.availableModels.grok, // Always use latest Grok models (updated Nov 2025)
              huggingface: sanitizeModels(mergedFromServer.availableModels?.huggingface, DEFAULT_SETTINGS.availableModels.huggingface)
            };
            mergedFromServer.savedPrompts = ensureImagineFirst(mergedFromServer.savedPrompts);

            finalSettings = mergedFromServer;
            console.log('☁️ Merged settings from server:', { radioEnabled: finalSettings.radioEnabled, currency: finalSettings.currency });
          } else {
            console.log('☁️ No settings found on server, will sync local settings to server');
          }
        } catch (error) {
          console.error('❌ Server sync failed, using local data only:', error);
          console.error('Error details:', error);
        } finally {
          setIsLoadingFromServer(false); // Re-enable saves
        }
      }

      // Set final settings and mark as loaded
      setSettings(finalSettings);
      setSettingsLoaded(true); // Mark settings as loaded - now safe to save changes
      console.log('✅ Settings load complete:', { radioEnabled: finalSettings.radioEnabled, currency: finalSettings.currency });
    };

    loadUserData();
  }, [currentUser]);

  // Save chats to IndexedDB and sync to server
  useEffect(() => {
    if (currentUser && sessions.length > 0) {
      const saveChats = async () => {
        for (const session of sessions) {
          await dbService.saveChat(session);
          if (settings.enableCloudSync) {
            await syncService.syncChat(session);
          }
        }
        setSyncStatus(prev => ({ ...prev, lastSync: Date.now() }));
      };
      saveChats();
    }
  }, [sessions, currentUser, settings.enableCloudSync]);

  // Save settings to IndexedDB and sync to server
  useEffect(() => {
    // Don't save if: no user, not loaded yet, or currently loading from server
    if (currentUser && settingsLoaded && !isLoadingFromServer) {
      const saveSettings = async () => {
        console.log('🔵 SAVING SETTINGS for user:', currentUser);
        console.log('🔵 Radio enabled:', settings.radioEnabled, 'Currency:', settings.currency);
        console.log('🔵 Avatars:', {
          user: settings.userAvatar ? `${settings.userAvatar.substring(0, 30)}... (${settings.userAvatar.length} chars)` : 'none',
          ai: settings.aiAvatar ? `${settings.aiAvatar.substring(0, 30)}... (${settings.aiAvatar.length} chars)` : 'none'
        });
        try {
          await dbService.saveSetting(`settings_${currentUser}`, settings);
          console.log('✅ Settings saved to IndexedDB');

          if (settings.enableCloudSync) {
            await syncService.syncSettings(`settings_${currentUser}`, settings);
            console.log('✅ Settings synced to server (including avatars)');
          }
          setSyncStatus(prev => ({ ...prev, lastSync: Date.now() }));
        } catch (error) {
          console.error('❌ SETTINGS SAVE FAILED:', error);
          console.error('Error details:', error);
        }
      };
      saveSettings();
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
  };

  const handleLogout = async () => {
    await dbService.saveSetting('active_user', null);
    setCurrentUser(null);
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

  const openStudyNotes = useCallback(() => {
    setIsStudyNotesOpen(true);
    setIsTrainingOpen(false);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const openTraining = useCallback(() => {
    setIsTrainingOpen(true);
    setIsStudyNotesOpen(false);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

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
          0% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        .animate-scanner {
          animation: scanner 2s ease-in-out infinite alternate;
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
          onSelect={(id) => { setCurrentSessionId(id); setIsTrainingOpen(false); setIsStudyNotesOpen(false); if (window.innerWidth < 768) setSidebarOpen(false); }}
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
          onLock={() => setIsLocked(true)}
          onOpenVisionMode={() => {
            setIsVisionModeOpen(true);
            setWasVisionModeAutoActivated(false); // Manual activation - don't auto-close on activity
          }}
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        />

        <main className={`flex-1 flex flex-col h-full relative transition-all duration-300 ${isSidebarOpen ? 'md:ml-0' : ''} pt-14 md:pt-0 z-10`}>
          <div className={`h-14 px-4 hidden md:flex items-center gap-3 border-b ${isTron ? 'border-tron-cyan/40 bg-black/70 backdrop-blur shadow-[0_0_10px_rgba(0,243,255,0.15)]' : 'bg-white/80 dark:bg-zinc-900/80 border-gray-200 dark:border-zinc-800 backdrop-blur-sm'}`}>
            <img src="/image/rangerplex_logo.png" alt="logo" className="h-10 w-10 rounded" />
            <div className="flex-1">
              <div className={`relative h-3 w-40 max-w-xs rounded-full overflow-hidden border ${isTron ? 'bg-black/60 border-tron-cyan/40' : 'bg-gray-200 dark:bg-zinc-800 border-white/10'}`}>
                <div className={`absolute inset-y-0 w-14 rounded-full blur-[1px] animate-scanner
                  ${isTron ? 'bg-tron-cyan shadow-[0_0_14px_rgba(0,243,255,0.6)]' : 'bg-teal-400 shadow-[0_0_14px_rgba(45,212,191,0.5)]'}
                `}></div>
              </div>
            </div>
          </div>
          {isStudyNotesOpen ? (
            <StudyNotes currentUser={currentUser} settings={settings} initialDraft={noteDraft || undefined} />
          ) : isTrainingOpen ? (
            <TrainingPage sessions={sessions} onClose={() => setIsTrainingOpen(false)} />
          ) : currentSession ? (
            <ChatInterface
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
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
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
        </main>

        {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={setSettings} />}

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
      </div>
    </div>
  );
};

export default App;

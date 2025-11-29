
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, X, ArrowLeft, ArrowRight, RotateCw, Shield, Ghost, Eye, FileText, Save, Terminal } from 'lucide-react';
import styles from './BrowserLayout.module.css';

import { browserStateService } from '../../services/browserStateService';

// Type definition for a Browser Tab
export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  lastActive: number; // Timestamp
  isPhantom: boolean; // Is the process suspended?
}

interface BrowserLayoutProps {
  initialUrl?: string;
  defaultUrl?: string;
  openRequest?: { url?: string; ts: number };
  onRequestClose?: () => void;
}

export default function BrowserLayout({ initialUrl, defaultUrl = 'https://google.com', openRequest, onRequestClose }: BrowserLayoutProps) {
  const savedState = browserStateService.getState();

  const normalizeUrl = useCallback((url: string) => {
    if (!url) return defaultUrl;
    return url.startsWith('http') ? url : `https://${url}`;
  }, [defaultUrl]);

  const initialSeed = useMemo(() => {
    let baseTabs: Tab[] = [];
    let initialActiveId = '1';

    if (savedState && savedState.tabs.length > 0) {
      baseTabs = [...savedState.tabs];
      initialActiveId = savedState.activeTabId;
    } else {
      baseTabs = [{
        id: '1',
        title: initialUrl ? 'New Tab' : 'Google',
        url: normalizeUrl(initialUrl || defaultUrl),
        lastActive: Date.now(),
        isPhantom: false,
      }];
      initialActiveId = '1';
    }

    if (initialUrl) {
      const normalized = normalizeUrl(initialUrl);
      const existing = baseTabs.find(t => t.url === normalized);
      if (!existing) {
        const newId = `seed-${Date.now()}`;
        baseTabs.push({
          id: newId,
          title: 'New Tab',
          url: normalized,
          lastActive: Date.now(),
          isPhantom: false,
        });
        initialActiveId = newId;
      } else {
        initialActiveId = existing.id;
      }
    }

    const activeTab = baseTabs.find(t => t.id === initialActiveId);
    return {
      tabs: baseTabs,
      activeTabId: initialActiveId,
      urlInput: activeTab?.url || normalizeUrl(initialUrl || defaultUrl),
    };
  }, [defaultUrl, initialUrl, normalizeUrl, savedState]);

  const [tabs, setTabs] = useState<Tab[]>(() => initialSeed.tabs);
  const [activeTabId, setActiveTabId] = useState<string>(() => initialSeed.activeTabId);
  const [urlInput, setUrlInput] = useState(() => initialSeed.urlInput);

  const [showNotes, setShowNotes] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [navState, setNavState] = useState({ canGoBack: false, canGoForward: false });

  // Persist state whenever it changes
  useEffect(() => {
    browserStateService.saveState(tabs, activeTabId, urlInput);
  }, [tabs, activeTabId, urlInput]);

  // Initial Tab Creation (Electron) - Only if not restoring or if restoring phantom
  useEffect(() => {
    if (window.electronAPI) {
      const active = tabs.find(t => t.id === activeTabId);
      if (active && !active.isPhantom) {
        window.electronAPI.createTab(active.id, active.url);
      } else {
        window.electronAPI.createTab(activeTabId, normalizeUrl(initialUrl || defaultUrl));
      }
    }
  }, []); // Run once on mount

  // Track tabs in ref for cleanup
  const tabsRef = useRef(tabs);
  useEffect(() => { tabsRef.current = tabs; }, [tabs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 BrowserLayout unmounting, saving state...');
      // Save state one last time
      browserStateService.saveState(tabsRef.current, activeTabId, urlInput);

      if (window.electronAPI) {
        tabsRef.current.forEach(t => {
          window.electronAPI!.closeTab(t.id);
        });
      }
    };
  }, [activeTabId, urlInput]); // Add deps to ensure latest state is captured if closure runs

  // Resize Handler for Electron BrowserView
  useEffect(() => {
    if (!window.electronAPI || !contentRef.current) return;

    const updateBounds = () => {
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        // If hidden (isVisible=false), we might want to force 0x0 or rely on display:none giving 0x0
        // But explicitly handling it is safer.
        window.electronAPI?.resizeView({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // Initial update
    setTimeout(updateBounds, 100);

    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, [activeTabId, showNotes]); // Re-calc when notes toggle

  // Seamus's Memory Manager (The Phantom Logic)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTabs((currentTabs) =>
        currentTabs.map((tab) => {
          // If tab is inactive for > 10 mins and not the active one
          if (
            tab.id !== activeTabId &&
            !tab.isPhantom &&
            now - tab.lastActive > 10 * 60 * 1000
          ) {
            console.log(`👻 Seamus: Converting tab ${tab.title} to Phantom Mode`);
            // In Electron, we would destroy the view here
            if (window.electronAPI) window.electronAPI.closeTab(tab.id);
            return { ...tab, isPhantom: true };
          }
          return tab;
        })
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [activeTabId]);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const refreshNavState = useCallback(async () => {
    if (window.electronAPI?.getNavState) {
      try {
        const state = await window.electronAPI.getNavState(activeTabId);
        if (state) {
          setNavState({
            canGoBack: !!state.canGoBack,
            canGoForward: !!state.canGoForward,
          });
          return;
        }
      } catch (err) {
        console.warn('Failed to get nav state', err);
      }
    }
    // Web fallback or failure
    setNavState({ canGoBack: false, canGoForward: false });
  }, [activeTabId]);

  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url);
      // Wake up if phantom
      if (activeTab.isPhantom) {
        console.log(`⚡ Seamus: Waking up tab ${activeTab.title} `);
        setTabs((prev) =>
          prev.map((t) =>
            t.id === activeTabId ? { ...t, isPhantom: false, lastActive: Date.now() } : t
          )
        );
        // Re-create view
        if (window.electronAPI) window.electronAPI.createTab(activeTab.id, activeTab.url);
      } else {
        // Just switch
        if (window.electronAPI) window.electronAPI.switchTab(activeTab.id);
      }
    }
    refreshNavState();
  }, [activeTabId, activeTab?.isPhantom, activeTab?.url, refreshNavState]);

  const openNewTab = useCallback((url: string) => {
    const newId = Date.now().toString();
    const normalized = normalizeUrl(url);
    const newTab: Tab = {
      id: newId,
      title: 'New Tab',
      url: normalized,
      lastActive: Date.now(),
      isPhantom: false,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setUrlInput(normalized);
    if (window.electronAPI) window.electronAPI.createTab(newId, normalized);
  }, [normalizeUrl]);

  const openOrFocusTab = useCallback((url: string) => {
    const normalized = normalizeUrl(url);
    setTabs((prev) => {
      const existing = prev.find((t) => t.url === normalized);
      if (existing) {
        setActiveTabId(existing.id);
        setUrlInput(normalized);
        if (window.electronAPI) window.electronAPI.switchTab(existing.id);
        return prev.map((t) =>
          t.id === existing.id ? { ...t, lastActive: Date.now(), isPhantom: false } : t
        );
      }
      const newId = Date.now().toString();
      const newTab: Tab = {
        id: newId,
        title: 'New Tab',
        url: normalized,
        lastActive: Date.now(),
        isPhantom: false,
      };
      setActiveTabId(newId);
      setUrlInput(normalized);
      if (window.electronAPI) window.electronAPI.createTab(newId, normalized);
      return [...prev, newTab];
    });
  }, [normalizeUrl]);

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();

    setTabs((prev) => {
      const remaining = prev.filter((t) => t.id !== id);

      if (window.electronAPI) window.electronAPI.closeTab(id);

      if (remaining.length === 0) {
        const fallbackUrl = normalizeUrl(defaultUrl);
        const fallbackId = Date.now().toString();
        const fallbackTab: Tab = {
          id: fallbackId,
          title: 'New Tab',
          url: fallbackUrl,
          lastActive: Date.now(),
          isPhantom: false,
        };
        setActiveTabId(fallbackId);
        setUrlInput(fallbackUrl);
        if (window.electronAPI) window.electronAPI.createTab(fallbackId, fallbackUrl);
        return [fallbackTab];
      }

      if (activeTabId === id) {
        const newActiveTab = remaining[remaining.length - 1];
        setActiveTabId(newActiveTab.id);
        setUrlInput(newActiveTab.url);
        if (window.electronAPI) window.electronAPI.switchTab(newActiveTab.id);
      }

      return remaining;
    });
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    const url = normalizeUrl(urlInput);

    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, url, title: url } : t))
    );
    setUrlInput(url);

    if (window.electronAPI) window.electronAPI.navigate(activeTabId, url);
    refreshNavState();
  };

  useEffect(() => {
    if (!openRequest || !openRequest.url) return;
    openOrFocusTab(openRequest.url);
  }, [openOrFocusTab, openRequest]);

  const handleBack = async () => {
    if (window.electronAPI?.goBack) {
      await window.electronAPI.goBack(activeTabId);
      refreshNavState();
      return;
    }
    const iframeWin = iframeRef.current?.contentWindow;
    try {
      iframeWin?.history.back();
    } catch (err) {
      console.warn('Back navigation failed', err);
    }
  };

  const handleForward = async () => {
    if (window.electronAPI?.goForward) {
      await window.electronAPI.goForward(activeTabId);
      refreshNavState();
      return;
    }
    const iframeWin = iframeRef.current?.contentWindow;
    try {
      iframeWin?.history.forward();
    } catch (err) {
      console.warn('Forward navigation failed', err);
    }
  };

  const handleReload = async () => {
    if (window.electronAPI?.reloadTab) {
      await window.electronAPI.reloadTab(activeTabId);
      refreshNavState();
      return;
    }
    const iframeEl = iframeRef.current;
    if (iframeEl) {
      iframeEl.src = iframeEl.src;
    }
  };

  useEffect(() => {
    refreshNavState();
  }, [refreshNavState, tabs.length]);

  // 👁️ THE LENS: AI Vision
  const handleLens = async () => {
    if (window.electronAPI) {
      console.log('👁️ Activating Lens...');
      const text = await window.electronAPI.getPageText();
      console.log('👁️ Lens captured text:', text.substring(0, 200) + '...');
      setNoteContent((prev) => prev + '\n\n--- Lens Capture ---\n' + text.substring(0, 500) + '...');
      setShowNotes(true);
    } else {
      alert('Lens only works in Electron Mode');
    }
  };

  // 📝 MINI-OS: Save Note
  const handleSaveNote = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.fsWriteFile('./data/notes/quick_note.txt', noteContent);
      if (result.success) {
        alert('Note saved to ./data/notes/quick_note.txt');
      } else {
        alert('Error saving note: ' + result.error);
      }
    } else {
      console.log('Note content:', noteContent);
      alert('Save only works in Electron Mode');
    }
  };

  return (
    <div className={styles.browserContainer}>
      {/* Tab Bar */}
      <div className={styles.tabBar}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`${styles.tab} ${tab.id === activeTabId ? styles.active : ''} ${tab.isPhantom ? styles.phantom : ''
              }`}
            onClick={() => setActiveTabId(tab.id)}
          >
            {tab.isPhantom && <Ghost size={12} className={styles.ghostIcon} />}
            <span className={styles.tabTitle}>{tab.title}</span>
            <X
              size={14}
              className={styles.closeBtn}
              onClick={(e) => closeTab(e, tab.id)}
            />
          </div>
        ))}
        <button className={styles.newTabBtn} onClick={() => openNewTab(defaultUrl)}>
          <Plus size={16} />
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.navControls}>
          <button className={styles.iconBtn} onClick={handleBack} disabled={!navState.canGoBack}><ArrowLeft size={18} /></button>
          <button className={styles.iconBtn} onClick={handleForward} disabled={!navState.canGoForward}><ArrowRight size={18} /></button>
          <button className={styles.iconBtn} onClick={handleReload}><RotateCw size={18} /></button>
        </div>

        <form className={styles.addressBar} onSubmit={handleNavigate}>
          <Shield size={14} className={styles.secureIcon} />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className={styles.urlInput}
          />
        </form>

        <div className={styles.extensions}>
          {/* Notes Toggle */}
          <button
            className={`${styles.iconBtn} ${showNotes ? styles.active : ''}`}
            onClick={() => setShowNotes(!showNotes)}
            title="Toggle Notes"
          >
            <FileText size={18} />
          </button>

          {/* Floating Terminal Toggle */}
          <button
            className={styles.iconBtn}
            onClick={() => window.electronAPI?.toggleFloatingTerminal()}
            title="Toggle Floating Terminal"
          >
            <Terminal size={18} />
          </button>

          {/* The Lens Button */}
          <button className={styles.iconBtn} onClick={handleLens} title="Activate Lens">
            <Eye size={18} color="#00ff9d" />
          </button>

          <div className={styles.walletWidget}>💰 0.00 RNC</div>
          {onRequestClose && (
            <button className={styles.iconBtn} onClick={onRequestClose} title="Close Browser">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area (Split View) */}
      <div className={styles.mainContent}>
        {/* Web Content Area */}
        <div className={styles.contentArea} ref={contentRef}>
          {/* If NOT in Electron, show iframe for dev */}
          {!window.electronAPI && (
            <iframe
              src={activeTab?.url}
              className={styles.webview}
              title="content"
              ref={iframeRef}
            />
          )}
          {/* If in Electron, this div is just a placeholder for the BrowserView */}
        </div>

        {/* Notes Panel (Mini-OS) */}
        {showNotes && (
          <div className={styles.notesPanel}>
            <div className={styles.notesHeader}>
              <span>Quick Notes</span>
              <button className={styles.iconBtn} onClick={handleSaveNote} title="Save to Disk">
                <Save size={16} />
              </button>
            </div>
            <textarea
              className={styles.notesEditor}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Type notes here..."
            />
          </div>
        )}
      </div>
    </div>
  );
}

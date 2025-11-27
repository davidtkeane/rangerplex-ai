
import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, ArrowLeft, ArrowRight, RotateCw, Shield, Ghost, Eye, FileText, Save, Terminal } from 'lucide-react';
import styles from './BrowserLayout.module.css';

// Type definition for Electron API
declare global {
  interface Window {
    electronAPI?: {
      createTab: (id: string, url: string) => Promise<void>;
      switchTab: (id: string) => Promise<void>;
      resizeView: (bounds: { x: number; y: number; width: number; height: number }) => Promise<void>;
      navigate: (id: string, url: string) => Promise<void>;
      closeTab: (id: string) => Promise<void>;
      getPageText: () => Promise<string>;
      fsReadDir: (path: string) => Promise<any[]>;
      fsReadFile: (path: string) => Promise<string>;
      fsWriteFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
      toggleFloatingTerminal: () => Promise<void>;
    };
  }
}

// Type definition for a Browser Tab
interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  lastActive: number; // Timestamp
  isPhantom: boolean; // Is the process suspended?
}

interface BrowserLayoutProps {
  initialUrl?: string;
}

export default function BrowserLayout({ initialUrl }: BrowserLayoutProps) {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: '1',
      title: initialUrl ? 'New Tab' : 'RangerPlex Dashboard',
      url: initialUrl || 'http://localhost:5173',
      lastActive: Date.now(),
      isPhantom: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [urlInput, setUrlInput] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  // Initial Tab Creation (Electron)
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.createTab('1', 'http://localhost:5173');
    }
  }, []);

  // Resize Handler for Electron BrowserView
  useEffect(() => {
    if (!window.electronAPI || !contentRef.current) return;

    const updateBounds = () => {
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
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
  }, [activeTabId, activeTab?.isPhantom]);

  const handleNewTab = () => {
    const newId = Date.now().toString();
    const newTab: Tab = {
      id: newId,
      title: 'New Tab',
      url: 'https://google.com',
      lastActive: Date.now(),
      isPhantom: false,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    if (window.electronAPI) window.electronAPI.createTab(newId, newTab.url);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.electronAPI) window.electronAPI.closeTab(id);

    const newTabs = tabs.filter((t) => t.id !== id);
    if (newTabs.length === 0) {
      handleNewTab(); // Always keep one tab open
    } else if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
    setTabs(newTabs);
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let url = urlInput;
    if (!url.startsWith('http')) url = `https://${url}`;

    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, url, title: url } : t))
    );

    if (window.electronAPI) window.electronAPI.navigate(activeTabId, url);
  };

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
        <button className={styles.newTabBtn} onClick={handleNewTab}>
          <Plus size={16} />
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.navControls}>
          <button className={styles.iconBtn}><ArrowLeft size={18} /></button>
          <button className={styles.iconBtn}><ArrowRight size={18} /></button>
          <button className={styles.iconBtn}><RotateCw size={18} /></button>
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


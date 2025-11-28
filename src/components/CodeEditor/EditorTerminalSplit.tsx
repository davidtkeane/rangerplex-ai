import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, X, Save, Upload, Settings, Terminal as TerminalIcon } from 'lucide-react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { codeExecutionService } from '../../services/codeExecutionService';
import { detectLanguageFromFilename, SupportedLanguage } from '../../types/editor';
import RangerTerminal from '../../../components/Terminal/RangerTerminal';
import AIHelper from './AIHelper';
import styles from './EditorTerminalSplit.module.css';

type EditorTerminalSplitProps = {
  onSendToChat?: (message: string) => void;
  onClose?: () => void;
  onOpenSettings?: () => void;
  autoOpenTerminal?: boolean;
  fontSize?: number;
  tabSize?: number;
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative';
};

const DEFAULT_SNIPPET = `// Welcome to RangerPlex Monaco Editor
// Write code and hit Run (Ctrl/Cmd + Enter)

function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('Ranger'));
`;

const languageOptions: SupportedLanguage[] = [
  'javascript',
  'typescript',
  'python',
  'bash',
  'shell',
  'markdown',
];

export default function EditorTerminalSplit({
  onSendToChat,
  onClose,
  onOpenSettings,
  autoOpenTerminal = false,
  fontSize = 14,
  tabSize = 2,
  wordWrap = 'on',
  minimap = true,
  lineNumbers = 'on'
}: EditorTerminalSplitProps) {
  const [code, setCode] = useState(DEFAULT_SNIPPET);
  const [filename, setFilename] = useState('app.js');
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [selectedCode, setSelectedCode] = useState('');
  const [status, setStatus] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTerminalVisible, setIsTerminalVisible] = useState(autoOpenTerminal);
  const draggingRef = useRef(false);
  const terminalRef = useRef(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-Save Logic
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const workspace = {
        code,
        language,
        filename,
        terminalHeight
      };
      localStorage.setItem('rangerplex_editor_workspace', JSON.stringify(workspace));
      // Don't show status for auto-save to avoid spam
    }, 1000); // 1 second debounce

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [code, language, filename, terminalHeight]);

  const handleSocketReady = useCallback((ws: WebSocket | null) => {
    console.log('🔌 EditorTerminalSplit: Socket Ready called', ws ? 'CONNECTING...' : 'DISCONNECTED');
    codeExecutionService.setTerminalWebSocket(ws);

    if (ws) {
      if (ws.readyState === WebSocket.OPEN) {
        setIsConnected(true);
        setStatus('Terminal Connected');
        setTimeout(() => setStatus(''), 2000);
      } else {
        ws.addEventListener('open', () => {
          setIsConnected(true);
          setStatus('Terminal Connected');
          setTimeout(() => setStatus(''), 2000);
        });
      }

      ws.addEventListener('close', () => setIsConnected(false));
      ws.addEventListener('error', () => setIsConnected(false));
    } else {
      setIsConnected(false);
    }
  }, []);

  const handleRun = useCallback(async () => {
    if (!isTerminalVisible) {
      setIsTerminalVisible(true);
      // Give it a moment to render and connect
      setTimeout(async () => {
        await executeRun();
      }, 500);
      return;
    }
    await executeRun();
  }, [code, language, filename, isTerminalVisible]);

  const executeRun = async () => {
    setStatus('Running…');
    const result = await codeExecutionService.executeCode(code, language, filename);
    setStatus(result.output || '');

    if (!result.success && result.error) {
      alert(`Error: ${result.error}`);
    }
  };

  const onEditorMount: OnMount = (editor, monaco: Monaco) => {
    editor.onDidChangeCursorSelection((e) => {
      const selection = editor.getModel()?.getValueInRange(e.selection);
      setSelectedCode(selection || '');
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => handleRun());
  };

  const handleFilenameChange = (value: string) => {
    setFilename(value);
    const detected = detectLanguageFromFilename(value);
    setLanguage(detected);
  };

  const handleLanguageChange = (value: SupportedLanguage) => {
    setLanguage(value);
  };

  const startDragging = () => {
    draggingRef.current = true;
  };

  const stopDragging = () => {
    draggingRef.current = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingRef.current) return;
    const newHeight = Math.min(Math.max(window.innerHeight - e.clientY, 200), window.innerHeight - 120);
    setTerminalHeight(newHeight);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
    };
  }, []);

  const handleSendToChat = (message: string) => {
    if (onSendToChat) {
      onSendToChat(message);
      return;
    }
    console.log('AI helper message:', message);
  };

  const handleSaveWorkspace = () => {
    const workspace = {
      code,
      language,
      filename,
      terminalHeight
    };
    localStorage.setItem('rangerplex_editor_workspace', JSON.stringify(workspace));
    setStatus('Workspace Saved');
    setTimeout(() => setStatus(''), 2000);
  };

  const handleLoadWorkspace = () => {
    const saved = localStorage.getItem('rangerplex_editor_workspace');
    if (saved) {
      const workspace = JSON.parse(saved);
      setCode(workspace.code || '');
      setLanguage(workspace.language || 'javascript');
      setFilename(workspace.filename || 'app.js');
      if (workspace.terminalHeight) setTerminalHeight(workspace.terminalHeight);
      setStatus('Workspace Loaded');
      setTimeout(() => setStatus(''), 2000);
    } else {
      setStatus('No saved workspace');
      setTimeout(() => setStatus(''), 2000);
    }
  };

  // Button Style Helper
  const btnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#e4e4e7',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  return (
    <div className={styles.splitContainer}>
      <div className={styles.toolbar}>
        <div className={styles.inputs}>
          <label className={styles.label}>
            File name
            <input
              value={filename}
              onChange={(e) => handleFilenameChange(e.target.value)}
              className={styles.input}
            />
          </label>
          <label className={styles.label}>
            Language
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
              className={styles.select}
            >
              {languageOptions.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.actions} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {status && <span className={styles.status} style={{ marginRight: '8px', fontSize: '12px', color: '#00ff9d' }}>{status}</span>}

          <button
            onClick={handleSaveWorkspace}
            title="Save Workspace"
            style={{ ...btnStyle, borderColor: '#3b82f6', color: '#60a5fa' }}
          >
            <Save size={14} />
            Save
          </button>

          <button
            onClick={handleLoadWorkspace}
            title="Load Workspace"
            style={{ ...btnStyle, borderColor: '#8b5cf6', color: '#a78bfa' }}
          >
            <Upload size={14} />
            Load
          </button>

          <button
            onClick={() => setIsTerminalVisible(!isTerminalVisible)}
            title={isTerminalVisible ? "Close Terminal" : "Open Terminal"}
            style={{ ...btnStyle, borderColor: '#eab308', color: '#facc15', background: isTerminalVisible ? 'rgba(234, 179, 8, 0.1)' : 'transparent' }}
          >
            <TerminalIcon size={14} />
            {isTerminalVisible ? 'Hide Term' : 'Show Term'}
          </button>

          <button
            onClick={handleRun}
            disabled={!isConnected && isTerminalVisible}
            title={isConnected || !isTerminalVisible ? "Run (Ctrl/Cmd + Enter)" : "Connecting to terminal..."}
            style={{
              ...btnStyle,
              borderColor: isConnected || !isTerminalVisible ? '#22c55e' : '#52525b',
              color: isConnected || !isTerminalVisible ? '#4ade80' : '#71717a',
              cursor: isConnected || !isTerminalVisible ? 'pointer' : 'not-allowed',
              opacity: isConnected || !isTerminalVisible ? 1 : 0.5
            }}
          >
            <Play size={14} />
            Run
          </button>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              title="Editor Settings"
              style={{ ...btnStyle, borderColor: '#06b6d4', color: '#22d3ee' }}
            >
              <Settings size={14} />
              Settings
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              style={{ ...btnStyle, borderColor: '#ef4444', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)' }}
            >
              <X size={14} />
              Close
            </button>
          )}
        </div>
      </div>

      <div className={styles.editorSection} style={{ height: isTerminalVisible ? `calc(100% - ${terminalHeight}px)` : '100%' }}>
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          onMount={onEditorMount}
          options={{
            minimap: { enabled: minimap },
            fontSize: fontSize,
            lineNumbers: lineNumbers,
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: tabSize,
            wordWrap: wordWrap,
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            matchBrackets: 'always',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
          }}
        />
      </div>

      {isTerminalVisible && (
        <>
          <div className={styles.resizeHandle} onMouseDown={startDragging} />
          <div className={styles.terminalSection} style={{ height: `${terminalHeight}px` }}>
            <RangerTerminal ref={terminalRef} onSocketReady={handleSocketReady} />
          </div>
        </>
      )}

      <AIHelper selectedCode={selectedCode} onSendToChat={handleSendToChat} />
    </div>
  );
}

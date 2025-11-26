import { useCallback, useEffect, useRef, useState } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { codeExecutionService } from '../../services/codeExecutionService';
import { detectLanguageFromFilename, SupportedLanguage } from '../../types/editor';
import RangerTerminal from '../../../components/Terminal/RangerTerminal';
import AIHelper from './AIHelper';
import styles from './EditorTerminalSplit.module.css';

type EditorTerminalSplitProps = {
  onSendToChat?: (message: string) => void;
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

export default function EditorTerminalSplit({ onSendToChat }: EditorTerminalSplitProps) {
  const [code, setCode] = useState(DEFAULT_SNIPPET);
  const [filename, setFilename] = useState('app.js');
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [selectedCode, setSelectedCode] = useState('');
  const [status, setStatus] = useState<string>('');
  const draggingRef = useRef(false);
  const terminalRef = useRef(null);

  const handleSocketReady = useCallback((ws: WebSocket | null) => {
    codeExecutionService.setTerminalWebSocket(ws);
  }, []);

  const handleRun = useCallback(async () => {
    setStatus('Running…');
    const result = await codeExecutionService.executeCode(code, language, filename);
    setStatus(result.output || '');

    if (!result.success && result.error) {
      alert(`Error: ${result.error}`);
    }
  }, [code, language, filename]);

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
        <div className={styles.actions}>
          {status && <span className={styles.status}>{status}</span>}
          <button className={styles.runButton} onClick={handleRun} title="Run (Ctrl/Cmd + Enter)">
            Run
          </button>
        </div>
      </div>

      <div className={styles.editorSection} style={{ height: `calc(100% - ${terminalHeight}px)` }}>
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          onMount={onEditorMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
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

      <div className={styles.resizeHandle} onMouseDown={startDragging} />

      <div className={styles.terminalSection} style={{ height: `${terminalHeight}px` }}>
        <RangerTerminal ref={terminalRef} onSocketReady={handleSocketReady} />
      </div>

      <AIHelper selectedCode={selectedCode} onSendToChat={handleSendToChat} />
    </div>
  );
}

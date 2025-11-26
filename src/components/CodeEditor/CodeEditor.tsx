import { useState } from 'react';
import Editor from '@monaco-editor/react';
import styles from './CodeEditor.module.css';

interface CodeEditorProps {
  defaultValue?: string;
  defaultLanguage?: string;
  onChange?: (value: string | undefined) => void;
}

export default function CodeEditor({
  defaultValue = '// Welcome to RangerPlex Code Editor!\n// Write your code here...\n\nconsole.log("Hello, World!");\n',
  defaultLanguage = 'javascript',
  onChange
}: CodeEditorProps) {
  const [code, setCode] = useState(defaultValue);

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || '');
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorWrapper}>
        <Editor
          height="100%"
          defaultLanguage={defaultLanguage}
          defaultValue={defaultValue}
          theme="vs-dark"
          onChange={handleEditorChange}
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
    </div>
  );
}

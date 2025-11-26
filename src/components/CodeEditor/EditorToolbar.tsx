import { Save, Play, Settings, Code2 } from 'lucide-react';
import { SupportedLanguage } from '../../types/editor';
import styles from './EditorToolbar.module.css';

interface EditorToolbarProps {
    currentLanguage: SupportedLanguage;
    onSave: () => void;
    onRun: () => void;
    onLanguageChange: (language: SupportedLanguage) => void;
    onFormat: () => void;
    onSettingsClick: () => void;
    hasUnsavedChanges: boolean;
}

export default function EditorToolbar({
    currentLanguage,
    onSave,
    onRun,
    onLanguageChange,
    onFormat,
    onSettingsClick,
    hasUnsavedChanges
}: EditorToolbarProps) {
    return (
        <div className={styles.toolbar}>
            <div className={styles.left}>
                <button
                    className={`${styles.toolbarBtn} ${hasUnsavedChanges ? styles.highlight : ''}`}
                    onClick={onSave}
                    title="Save (Ctrl+S)"
                >
                    <Save size={16} />
                    <span>Save</span>
                </button>

                <button
                    className={styles.toolbarBtn}
                    onClick={onRun}
                    title="Run Code (Ctrl+Enter)"
                >
                    <Play size={16} />
                    <span>Run</span>
                </button>

                <button
                    className={styles.toolbarBtn}
                    onClick={onFormat}
                    title="Format Code"
                >
                    <Code2 size={16} />
                    <span>Format</span>
                </button>
            </div>

            <div className={styles.right}>
                <select
                    className={styles.languageSelect}
                    value={currentLanguage}
                    onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
                >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="json">JSON</option>
                    <option value="markdown">Markdown</option>
                    <option value="bash">Bash</option>
                </select>

                <button
                    className={styles.toolbarBtn}
                    onClick={onSettingsClick}
                    title="Editor Settings"
                >
                    <Settings size={16} />
                </button>
            </div>
        </div>
    );
}

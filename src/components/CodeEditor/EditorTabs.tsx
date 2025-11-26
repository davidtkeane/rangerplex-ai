import { X } from 'lucide-react';
import { EditorFile } from '../../types/editor';
import styles from './EditorTabs.module.css';

interface EditorTabsProps {
    files: EditorFile[];
    activeFileId: string | null;
    onTabClick: (fileId: string) => void;
    onTabClose: (fileId: string) => void;
}

export default function EditorTabs({
    files,
    activeFileId,
    onTabClick,
    onTabClose
}: EditorTabsProps) {
    return (
        <div className={styles.tabBar}>
            {files.map(file => (
                <div
                    key={file.id}
                    className={`${styles.tab} ${file.id === activeFileId ? styles.active : ''}`}
                    onClick={() => onTabClick(file.id)}
                >
                    <span className={styles.tabName}>
                        {file.isUnsaved && <span className={styles.unsavedDot}>●</span>}
                        {file.name}
                    </span>
                    <button
                        className={styles.closeBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            onTabClose(file.id);
                        }}
                        title="Close"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}

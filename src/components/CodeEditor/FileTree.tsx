import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { EditorFile, EditorFolder } from '../../types/editor';
import styles from './FileTree.module.css';

interface FileTreeProps {
    rootFolder: EditorFolder;
    activeFileId: string | null;
    onFileSelect: (file: EditorFile) => void;
    onFileCreate: (parentPath: string, name: string) => void;
    onFileDelete: (fileId: string) => void;
    onFileRename: (fileId: string, newName: string) => void;
    onFolderCreate: (parentPath: string, name: string) => void;
}

export default function FileTree({
    rootFolder,
    activeFileId,
    onFileSelect,
    onFileCreate,
    onFileDelete,
    onFileRename,
    onFolderCreate
}: FileTreeProps) {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([rootFolder.id]));
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: EditorFile | EditorFolder } | null>(null);

    // Toggle folder expansion
    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    // Render tree recursively
    const renderTree = (item: EditorFile | EditorFolder, depth: number = 0) => {
        const isFolder = 'children' in item;
        const isExpanded = isFolder && expandedFolders.has(item.id);
        const isActive = !isFolder && item.id === activeFileId;

        if (isFolder) {
            return (
                <div key={item.id}>
                    <div
                        className={styles.treeItem}
                        style={{ paddingLeft: `${depth * 12 + 8}px` }}
                        onClick={() => toggleFolder(item.id)}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                    >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                        <span>{item.name}</span>
                    </div>
                    {isExpanded && (
                        <div className={styles.children}>
                            {item.children.map(child => renderTree(child, depth + 1))}
                        </div>
                    )}
                </div>
            );
        } else {
            return (
                <div
                    key={item.id}
                    className={`${styles.treeItem} ${isActive ? styles.active : ''}`}
                    style={{ paddingLeft: `${depth * 12 + 24}px` }}
                    onClick={() => onFileSelect(item)}
                    onContextMenu={(e) => handleContextMenu(e, item)}
                >
                    <File size={16} />
                    <span>{item.name}</span>
                </div>
            );
        }
    };

    // Context menu handler
    const handleContextMenu = (e: React.MouseEvent, item: EditorFile | EditorFolder) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, item });
    };

    const handleNewFile = () => {
        if (contextMenu) {
            const path = 'children' in contextMenu.item ? contextMenu.item.path : rootFolder.path; // Simplified for now
            onFileCreate(path, 'newfile.js');
            setContextMenu(null);
        }
    };

    const handleRename = () => {
        if (contextMenu) {
            const newName = prompt("Enter new name:", contextMenu.item.name);
            if (newName) {
                onFileRename(contextMenu.item.id, newName);
            }
            setContextMenu(null);
        }
    };

    const handleDelete = () => {
        if (contextMenu) {
            if (confirm(`Delete ${contextMenu.item.name}?`)) {
                onFileDelete(contextMenu.item.id);
            }
            setContextMenu(null);
        }
    };


    return (
        <div className={styles.fileTree}>
            <div className={styles.header}>
                <span>FILES</span>
                <button onClick={() => onFileCreate(rootFolder.path, 'newfile.js')} title="New File">
                    +
                </button>
            </div>
            <div className={styles.tree}>
                {rootFolder.children.map(child => renderTree(child))}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className={styles.contextMenu}
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onMouseLeave={() => setContextMenu(null)}
                >
                    <button onClick={() => handleNewFile()}>New File</button>
                    <button onClick={() => handleRename()}>Rename</button>
                    <button onClick={() => handleDelete()}>Delete</button>
                </div>
            )}
        </div>
    );
}

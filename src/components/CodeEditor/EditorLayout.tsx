import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import FileTree from './FileTree';
import EditorTabs from './EditorTabs';
import EditorToolbar from './EditorToolbar';
import { EditorFile, EditorFolder, detectLanguageFromFilename, SupportedLanguage } from '../../types/editor';
import { editorFileService } from '../../services/editorFileService';
import { v4 as uuidv4 } from 'uuid';
import styles from './EditorLayout.module.css';

const EDITOR_STATE_KEY = 'rangerplex_editor_state';
const AUTO_SAVE_DELAY = 2000; // 2 seconds

interface EditorState {
    openFileIds: string[];
    activeFileId: string | null;
}

export default function EditorLayout() {
    const [fileTree, setFileTree] = useState<EditorFolder | null>(null);
    const [openFiles, setOpenFiles] = useState<EditorFile[]>([]);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [currentCode, setCurrentCode] = useState('');
    const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('javascript');
    const [isInitialized, setIsInitialized] = useState(false);
    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

    // Initialize IndexedDB and load saved data
    useEffect(() => {
        initializeEditor();
    }, []);

    // Initialize editor with saved data
    const initializeEditor = async () => {
        try {
            // Initialize IndexedDB
            await editorFileService.init();

            // Load files from IndexedDB
            const savedFiles = await editorFileService.getAllFiles();

            // If no saved files, create default structure
            if (savedFiles.length === 0) {
                await createDefaultFiles();
            }

            // Build file tree from saved files
            await buildFileTree();

            // Load editor state from localStorage
            const savedState = loadEditorState();
            if (savedState && savedState.openFileIds.length > 0) {
                // Restore open tabs
                const filesToOpen: EditorFile[] = [];
                for (const fileId of savedState.openFileIds) {
                    const file = await editorFileService.getFile(fileId);
                    if (file) filesToOpen.push(file);
                }
                setOpenFiles(filesToOpen);

                // Restore active file
                if (savedState.activeFileId) {
                    const activeFile = await editorFileService.getFile(savedState.activeFileId);
                    if (activeFile) {
                        setActiveFileId(activeFile.id);
                        setCurrentCode(activeFile.content);
                        setCurrentLanguage(detectLanguageFromFilename(activeFile.name));
                    }
                }
            }

            setIsInitialized(true);
        } catch (error) {
            console.error('Failed to initialize editor:', error);
            setIsInitialized(true);
        }
    };

    // Create default files if none exist
    const createDefaultFiles = async () => {
        const defaultFiles: EditorFile[] = [
            {
                id: '2',
                name: 'App.tsx',
                path: '/src/App.tsx',
                language: 'typescript',
                content: '// React App Component\nimport React from "react";\n\nexport default function App() {\n  return <div>Hello World</div>;\n}',
                lastModified: Date.now()
            },
            {
                id: '3',
                name: 'utils.ts',
                path: '/src/utils.ts',
                language: 'typescript',
                content: 'export const add = (a: number, b: number) => a + b;',
                lastModified: Date.now()
            },
            {
                id: '4',
                name: 'README.md',
                path: '/README.md',
                language: 'markdown',
                content: '# Project Documentation\n\nThis is a sample project.',
                lastModified: Date.now()
            }
        ];

        for (const file of defaultFiles) {
            await editorFileService.saveFile(file);
        }
    };

    // Build file tree from saved files
    const buildFileTree = async () => {
        const files = await editorFileService.getAllFiles();

        // Create folder structure
        const rootFolder: EditorFolder = {
            id: 'root',
            name: 'Project',
            path: '/',
            children: [],
            isExpanded: true
        };

        // Group files by directory
        const srcFolder: EditorFolder = {
            id: '1',
            name: 'src',
            path: '/src',
            children: [],
            isExpanded: true
        };

        files.forEach(file => {
            if (file.path.startsWith('/src/')) {
                srcFolder.children.push(file);
            } else {
                rootFolder.children.push(file);
            }
        });

        if (srcFolder.children.length > 0) {
            rootFolder.children.unshift(srcFolder);
        }

        setFileTree(rootFolder);
    };

    // Load editor state from localStorage
    const loadEditorState = (): EditorState | null => {
        try {
            const saved = localStorage.getItem(EDITOR_STATE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    };

    // Save editor state to localStorage
    const saveEditorState = useCallback((openFileIds: string[], activeFileId: string | null) => {
        const state: EditorState = { openFileIds, activeFileId };
        localStorage.setItem(EDITOR_STATE_KEY, JSON.stringify(state));
    }, []);

    // Save state whenever open files or active file changes
    useEffect(() => {
        if (isInitialized) {
            const openFileIds = openFiles.map(f => f.id);
            saveEditorState(openFileIds, activeFileId);
        }
    }, [openFiles, activeFileId, isInitialized, saveEditorState]);

    // Refs for auto-save on unmount/reload
    const currentCodeRef = useRef(currentCode);
    const activeFileIdRef = useRef(activeFileId);

    // Update refs whenever state changes
    useEffect(() => {
        currentCodeRef.current = currentCode;
        activeFileIdRef.current = activeFileId;
    }, [currentCode, activeFileId]);

    // Auto-save debounced
    useEffect(() => {
        if (!activeFileId || !isInitialized) return;

        // Clear existing timer
        if (autoSaveTimer.current) {
            clearTimeout(autoSaveTimer.current);
        }

        // Set new timer for auto-save
        autoSaveTimer.current = setTimeout(async () => {
            await handleSave(false); // false = silent save (no alert)
        }, 1000); // Auto-save every 1 second

        return () => {
            if (autoSaveTimer.current) {
                clearTimeout(autoSaveTimer.current);
            }
        };
    }, [currentCode, activeFileId, isInitialized]);

    // Save on unmount / page hide
    useEffect(() => {
        const saveOnExit = () => {
            const id = activeFileIdRef.current;
            const code = currentCodeRef.current;
            if (id && code !== undefined) {
                // Fire-and-forget save
                editorFileService.updateFileContent(id, code).catch(console.error);
            }
        };

        window.addEventListener('beforeunload', saveOnExit);

        return () => {
            window.removeEventListener('beforeunload', saveOnExit);
            saveOnExit(); // Also save on component unmount (SPA navigation)
        };
    }, []);

    const handleFileSelect = async (file: EditorFile) => {
        // Load fresh version from IndexedDB
        const freshFile = await editorFileService.getFile(file.id);
        const fileToOpen = freshFile || file;

        // Open file if not already open
        if (!openFiles.find(f => f.id === fileToOpen.id)) {
            setOpenFiles([...openFiles, fileToOpen]);
        }
        setActiveFileId(fileToOpen.id);
        setCurrentCode(fileToOpen.content);
        setCurrentLanguage(detectLanguageFromFilename(fileToOpen.name));
    };

    const handleCodeChange = (value: string | undefined) => {
        setCurrentCode(value || '');
        // Mark file as unsaved
        if (activeFileId) {
            setOpenFiles(prev => prev.map(f =>
                f.id === activeFileId ? { ...f, isUnsaved: true, content: value || '' } : f
            ));
        }
    };

    const handleSave = async (showAlert = true) => {
        if (activeFileId) {
            try {
                // Save to IndexedDB
                await editorFileService.updateFileContent(activeFileId, currentCode);

                // Mark as saved in UI
                setOpenFiles(prev => prev.map(f =>
                    f.id === activeFileId ? { ...f, isUnsaved: false, content: currentCode } : f
                ));

                if (showAlert) {
                    console.log('✅ File saved:', activeFileId);
                }
            } catch (error) {
                console.error('Failed to save file:', error);
                if (showAlert) {
                    alert('Failed to save file');
                }
            }
        }
    };

    const handleRun = () => {
        // Will be implemented by GPT (terminal integration)
        console.log('Run code:', currentCode);
        alert('Terminal integration coming soon! (GPT mission)');
    };

    const handleFileCreate = async (parentPath: string, name: string) => {
        try {
            const newFile: EditorFile = {
                id: uuidv4(),
                name,
                path: `${parentPath === '/' ? '' : parentPath}/${name}`,
                language: detectLanguageFromFilename(name),
                content: '// ' + name,
                lastModified: Date.now()
            };
            await editorFileService.saveFile(newFile);
            await buildFileTree();
            handleFileSelect(newFile);
        } catch (error) {
            console.error('Failed to create file:', error);
            alert('Failed to create file');
        }
    };

    const handleFileDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;
        try {
            await editorFileService.deleteFile(id);
            if (openFiles.find(f => f.id === id)) {
                const newOpenFiles = openFiles.filter(f => f.id !== id);
                setOpenFiles(newOpenFiles);
                if (activeFileId === id) {
                    if (newOpenFiles.length > 0) {
                        const last = newOpenFiles[newOpenFiles.length - 1];
                        setActiveFileId(last.id);
                        setCurrentCode(last.content);
                        setCurrentLanguage(detectLanguageFromFilename(last.name));
                    } else {
                        setActiveFileId(null);
                        setCurrentCode('');
                    }
                }
            }
            await buildFileTree();
        } catch (error) {
            console.error('Failed to delete file:', error);
        }
    };

    const handleFileRename = async (id: string, newName: string) => {
        try {
            const file = await editorFileService.getFile(id);
            if (file) {
                const oldPath = file.path;
                const pathParts = oldPath.split('/');
                pathParts.pop();
                const newPath = `${pathParts.join('/')}/${newName}`;

                await editorFileService.saveFile({
                    ...file,
                    name: newName,
                    path: newPath,
                    language: detectLanguageFromFilename(newName)
                });
                await buildFileTree();

                // Update open files if needed
                setOpenFiles(prev => prev.map(f =>
                    f.id === id ? { ...f, name: newName, path: newPath, language: detectLanguageFromFilename(newName) } : f
                ));
            }
        } catch (error) {
            console.error('Failed to rename file:', error);
        }
    };

    const activeFile = openFiles.find(f => f.id === activeFileId);

    if (!isInitialized || !fileTree) {
        return <div className={styles.loading}>Loading editor...</div>;
    }

    return (
        <div className={styles.editorLayout}>
            <FileTree
                rootFolder={fileTree}
                activeFileId={activeFileId}
                onFileSelect={handleFileSelect}
                onFileCreate={handleFileCreate}
                onFileDelete={handleFileDelete}
                onFileRename={handleFileRename}
                onFolderCreate={(path, name) => console.log('Create folder:', path, name)}
            />

            <div className={styles.editorArea}>
                <EditorToolbar
                    currentLanguage={currentLanguage}
                    onSave={() => handleSave(true)}
                    onRun={handleRun}
                    onLanguageChange={setCurrentLanguage}
                    onFormat={() => console.log('Format code')}
                    onSettingsClick={() => console.log('Settings')}
                    hasUnsavedChanges={activeFile?.isUnsaved || false}
                />

                <EditorTabs
                    files={openFiles}
                    activeFileId={activeFileId}
                    onTabClick={(id) => {
                        const file = openFiles.find(f => f.id === id);
                        if (file) {
                            setActiveFileId(id);
                            setCurrentCode(file.content);
                            setCurrentLanguage(detectLanguageFromFilename(file.name));
                        }
                    }}
                    onTabClose={(id) => {
                        const newOpenFiles = openFiles.filter(f => f.id !== id);
                        setOpenFiles(newOpenFiles);
                        if (activeFileId === id) {
                            if (newOpenFiles.length > 0) {
                                const lastFile = newOpenFiles[newOpenFiles.length - 1];
                                setActiveFileId(lastFile.id);
                                setCurrentCode(lastFile.content);
                                setCurrentLanguage(detectLanguageFromFilename(lastFile.name));
                            } else {
                                setActiveFileId(null);
                                setCurrentCode('');
                            }
                        }
                    }}
                />

                <div className={styles.editorContainer}>
                    {activeFileId ? (
                        <Editor
                            height="100%"
                            language={currentLanguage}
                            value={currentCode}
                            onChange={handleCodeChange}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: true },
                                fontSize: 14,
                                lineNumbers: 'on',
                                automaticLayout: true,
                            }}
                        />
                    ) : (
                        <div className={styles.emptyState}>
                            <p>Select a file to start editing</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

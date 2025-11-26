# 🎨 Mission Brief: Monaco Editor Frontend Components
**Agent:** Major Gemini Ranger
**Status:** ✅ COMPLETE
**Priority:** HIGH (UI/UX layer)
**Estimated Time:** 4-5 hours

---

## 🎯 Mission Objective

Build the user interface components for Monaco Editor: FileTree (file explorer), EditorTabs (open files), and EditorToolbar (actions). Create a professional, VS Code-like experience with beautiful UI and smooth interactions.

**Prerequisites:** Current Claude must complete setup mission first!

---

## 📋 Task List

### **Task 1: Verify Foundation** ✅
**Estimated Time:** 10 minutes

**Check that Claude completed:**
- [x] Monaco Editor installed: `npm list @monaco-editor/react`
- [x] CodeEditor component exists: `src/components/CodeEditor/CodeEditor.tsx`
- [x] Route works: `http://localhost:5173/editor`
- [x] Types exist: `src/types/editor.ts`
- [x] Service exists: `src/services/editorFileService.ts`

**If any missing:** Ask David to have Claude complete setup first!

**Deliverable:** Confirmed foundation is ready

---

### **Task 2: Create FileTree Component** ✅
**Estimated Time:** 90 minutes

**File: `src/components/CodeEditor/FileTree.tsx`**

Build a VS Code-style file explorer with:
- Folders (expandable/collapsible)
- Files (clickable to open)
- Icons for different file types
- Right-click context menu (Create, Rename, Delete)
- Drag & drop support (stretch goal)

**Component Structure:**
```typescript
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
```

**File: `src/components/CodeEditor/FileTree.module.css`**
```css
.fileTree {
  width: 250px;
  background: #252526;
  color: #cccccc;
  height: 100%;
  overflow-y: auto;
  border-right: 1px solid #3e3e42;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #3e3e42;
}

.header button {
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  font-size: 18px;
  padding: 0 4px;
}

.header button:hover {
  background: #2a2d2e;
}

.tree {
  padding: 4px 0;
}

.treeItem {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
}

.treeItem:hover {
  background: #2a2d2e;
}

.treeItem.active {
  background: #37373d;
}

.treeItem svg {
  flex-shrink: 0;
}

.children {
  /* No extra styling needed, handled by depth padding */
}

.contextMenu {
  position: fixed;
  background: #3c3c3c;
  border: 1px solid #454545;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  padding: 4px 0;
  z-index: 1000;
}

.contextMenu button {
  display: block;
  width: 100%;
  padding: 6px 20px;
  background: none;
  border: none;
  color: #cccccc;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
}

.contextMenu button:hover {
  background: #094771;
}
```

**Deliverable:** Working file tree component

---

### **Task 3: Create EditorTabs Component** ✅
**Estimated Time:** 60 minutes

**File: `src/components/CodeEditor/EditorTabs.tsx`**

Build a tab bar for open files (like VS Code):
- Tab for each open file
- Active tab highlighted
- Close button (X) on each tab
- Unsaved indicator (dot)
- Scrollable if many tabs

**Component Structure:**
```typescript
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
```

**File: `src/components/CodeEditor/EditorTabs.module.css`**
```css
.tabBar {
  display: flex;
  background: #2d2d2d;
  border-bottom: 1px solid #3e3e42;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
}

.tabBar::-webkit-scrollbar {
  height: 3px;
}

.tabBar::-webkit-scrollbar-thumb {
  background: #555;
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #2d2d2d;
  border-right: 1px solid #3e3e42;
  color: #969696;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.1s;
  min-width: 120px;
  max-width: 200px;
}

.tab:hover {
  background: #323233;
}

.tab.active {
  background: #1e1e1e;
  color: #ffffff;
  border-bottom: 2px solid #007acc;
}

.tabName {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.unsavedDot {
  color: #ffffff;
  font-size: 16px;
  line-height: 1;
}

.closeBtn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  opacity: 0.7;
}

.closeBtn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}
```

**Deliverable:** Tab bar component for open files

---

### **Task 4: Create EditorToolbar Component** ✅
**Estimated Time:** 45 minutes

**File: `src/components/CodeEditor/EditorToolbar.tsx`**

Build a toolbar with action buttons:
- Save button
- Run button (executes code)
- Language selector
- Settings button
- Format button

**Component Structure:**
```typescript
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
```

**File: `src/components/CodeEditor/EditorToolbar.module.css`**
```css
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #2d2d2d;
  border-bottom: 1px solid #3e3e42;
}

.left {
  display: flex;
  gap: 8px;
}

.right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.toolbarBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #3c3c3c;
  border: 1px solid #454545;
  color: #cccccc;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.toolbarBtn:hover {
  background: #505050;
  border-color: #555;
}

.toolbarBtn.highlight {
  background: #0e639c;
  border-color: #007acc;
  color: #ffffff;
}

.languageSelect {
  padding: 6px 10px;
  background: #3c3c3c;
  border: 1px solid #454545;
  color: #cccccc;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
}

.languageSelect:hover {
  background: #505050;
}

.languageSelect:focus {
  outline: 1px solid #007acc;
}
```

**Deliverable:** Toolbar with action buttons

---

### **Task 5: Create Layout Component (Compose Everything)** ✅
**Estimated Time:** 45 minutes

**File: `src/components/CodeEditor/EditorLayout.tsx`**

Compose FileTree + Tabs + Toolbar + Monaco Editor into one layout:

```typescript
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import FileTree from './FileTree';
import EditorTabs from './EditorTabs';
import EditorToolbar from './EditorToolbar';
import { EditorFile, EditorFolder, detectLanguageFromFilename, SupportedLanguage } from '../../types/editor';
import { editorFileService } from '../../services/editorFileService';
import styles from './EditorLayout.module.css';

export default function EditorLayout() {
  const [fileTree, setFileTree] = useState<EditorFolder | null>(null);
  const [openFiles, setOpenFiles] = useState<EditorFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [currentCode, setCurrentCode] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('javascript');

  // Load file tree on mount
  useEffect(() => {
    loadFileTree();
  }, []);

  const loadFileTree = async () => {
    // TODO: Load from service or create default structure
    const defaultTree: EditorFolder = {
      id: 'root',
      name: 'Project',
      path: '/',
      children: [],
      isExpanded: true
    };
    setFileTree(defaultTree);
  };

  const handleFileSelect = async (file: EditorFile) => {
    // Open file if not already open
    if (!openFiles.find(f => f.id === file.id)) {
      setOpenFiles([...openFiles, file]);
    }
    setActiveFileId(file.id);
    setCurrentCode(file.content);
    setCurrentLanguage(detectLanguageFromFilename(file.name));
  };

  const handleCodeChange = (value: string | undefined) => {
    setCurrentCode(value || '');
    // Mark file as unsaved
    if (activeFileId) {
      setOpenFiles(prev => prev.map(f =>
        f.id === activeFileId ? { ...f, isUnsaved: true } : f
      ));
    }
  };

  const handleSave = async () => {
    if (activeFileId) {
      await editorFileService.updateFile(activeFileId, currentCode);
      setOpenFiles(prev => prev.map(f =>
        f.id === activeFileId ? { ...f, isUnsaved: false, content: currentCode } : f
      ));
    }
  };

  const handleRun = () => {
    // Will be implemented by GPT (terminal integration)
    console.log('Run code:', currentCode);
    alert('Terminal integration coming soon! (GPT mission)');
  };

  const activeFile = openFiles.find(f => f.id === activeFileId);

  if (!fileTree) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.editorLayout}>
      <FileTree
        rootFolder={fileTree}
        activeFileId={activeFileId}
        onFileSelect={handleFileSelect}
        onFileCreate={(path, name) => console.log('Create file:', path, name)}
        onFileDelete={(id) => console.log('Delete file:', id)}
        onFileRename={(id, name) => console.log('Rename file:', id, name)}
        onFolderCreate={(path, name) => console.log('Create folder:', path, name)}
      />

      <div className={styles.editorArea}>
        <EditorToolbar
          currentLanguage={currentLanguage}
          onSave={handleSave}
          onRun={handleRun}
          onLanguageChange={setCurrentLanguage}
          onFormat={() => console.log('Format code')}
          onSettingsClick={() => console.log('Settings')}
          hasUnsavedChanges={activeFile?.isUnsaved || false}
        />

        <EditorTabs
          files={openFiles}
          activeFileId={activeFileId}
          onTabClick={setActiveFileId}
          onTabClose={(id) => setOpenFiles(prev => prev.filter(f => f.id !== id))}
        />

        <div className={styles.editorContainer}>
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
        </div>
      </div>
    </div>
  );
}
```

**File: `src/components/CodeEditor/EditorLayout.module.css`**
```css
.editorLayout {
  display: flex;
  height: 100vh;
  background: #1e1e1e;
}

.editorArea {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editorContainer {
  flex: 1;
  overflow: hidden;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: #cccccc;
  font-size: 16px;
}
```

**Update Route:**
Replace old CodeEditor with new EditorLayout:
```typescript
// In router
import EditorLayout from './components/CodeEditor/EditorLayout';

<Route path="/editor" element={<EditorLayout />} />
```

**Deliverable:** Complete UI layout with all components integrated

---

### **Task 6: Testing & Polish** ✅
**Estimated Time:** 30 minutes

**Test Checklist:**
- [x] FileTree renders properly
- [x] Can click files to open them
- [x] Tabs show open files
- [x] Active tab is highlighted
- [x] Can close tabs
- [x] Toolbar buttons work (Save at minimum)
- [x] Language selector works
- [x] Unsaved indicator (dot) appears when typing
- [x] UI is responsive
- [x] Looks professional

**Polish Items:**
- Smooth animations
- Proper hover states
- Consistent colors
- Icons properly aligned
- No visual glitches

**Deliverable:** Polished, professional UI

---

### **Task 7: Create Documentation** ✅
**Estimated Time:** 20 minutes

**File: `docs/monaco/FRONTEND_COMPLETE.md`**
```markdown
# Monaco Editor Frontend - COMPLETE ✅

**Date:** [Date you complete this]
**Agent:** Major Gemini Ranger

## What Was Done

### Components Created
1. **FileTree.tsx** - File explorer with folders and files
2. **EditorTabs.tsx** - Tab bar for open files
3. **EditorToolbar.tsx** - Action buttons (Save, Run, Format)
4. **EditorLayout.tsx** - Main layout composing everything

### Features Implemented
- ✅ File tree with expand/collapse
- ✅ Multi-file tabs
- ✅ Unsaved indicators
- ✅ Toolbar with actions
- ✅ Language selector
- ✅ Context menu (right-click)
- ✅ Professional VS Code-like UI

## Component Locations
- `src/components/CodeEditor/FileTree.tsx`
- `src/components/CodeEditor/EditorTabs.tsx`
- `src/components/CodeEditor/EditorToolbar.tsx`
- `src/components/CodeEditor/EditorLayout.tsx`

## Next Steps

Hand off to:
- **GPT**: Integrate with Terminal and AI chat
- **Claude-2**: Add advanced features (themes, snippets)

**Status:** ✅ FRONTEND COMPLETE
**Ready for:** GPT and Claude-2 missions

Rangers lead the way! 🎖️
```

**Deliverable:** Frontend completion documentation

---

## 📊 Deliverables Summary

After completing this mission, you will have:

1. ✅ FileTree component (file explorer)
2. ✅ EditorTabs component (open files tabs)
3. ✅ EditorToolbar component (action buttons)
4. ✅ EditorLayout component (main layout)
5. ✅ Professional VS Code-like UI
6. ✅ All components tested
7. ✅ Documentation created

---

## 🎨 Design References

**Look at these for inspiration:**
- VS Code file explorer
- VS Code tabs
- GitHub Codespaces UI
- StackBlitz editor

**Color Palette (VS Code Dark):**
- Background: `#1e1e1e`
- Sidebar: `#252526`
- Border: `#3e3e42`
- Active: `#37373d`
- Highlight: `#007acc`
- Text: `#cccccc`

---

## 🚧 Critical Notes

### **Don't Touch These (Other AIs Handle):**
- ❌ Terminal integration (GPT's job)
- ❌ AI chat integration (GPT's job)
- ❌ Themes system (Claude-2's job)
- ❌ Code snippets (Claude-2's job)

### **Your Focus:**
- ✅ Beautiful UI components
- ✅ Smooth interactions
- ✅ Professional look
- ✅ VS Code-like experience

---

**Mission Status:** ⏳ **AWAITING CLAUDE SETUP**
**Estimated Completion:** 4-5 hours
**Priority:** HIGH (UI/UX layer)

**Rangers lead the way!** 🎖️

*Created by AIRanger Claude (claude-sonnet-4-5-20250929)*
*November 26, 2025*

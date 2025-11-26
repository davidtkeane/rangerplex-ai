# 🛠️ Mission Brief: Monaco Editor Setup & Foundation
**Agent:** AIRanger Claude (Current Session)
**Status:** 📋 Ready to Execute
**Priority:** CRITICAL (Foundation for other missions)
**Estimated Time:** 2-3 hours

---

## 🎯 Mission Objective

Set up the Monaco Editor foundation in RangerPlex. Install dependencies, create the basic editor component, configure routing, and establish the core architecture that Gemini, GPT, and Claude-2 will build upon.

**This is the FOUNDATION mission - must complete first!**

---

## 📋 Task List

### **Task 1: Install Dependencies** ✅ or ⬜
**Estimated Time:** 5 minutes

```bash
npm install @monaco-editor/react
```

**Verify Installation:**
```bash
npm list @monaco-editor/react
```

**Expected Output:**
```
rangerplex-ai@2.5.34
└── @monaco-editor/react@4.x.x
```

**Deliverable:** Monaco Editor React package installed

---

### **Task 2: Create Component Structure** ⬜
**Estimated Time:** 30 minutes

**Create Folder Structure:**
```
src/components/CodeEditor/
├── CodeEditor.tsx           # Main editor component (YOU CREATE THIS)
├── CodeEditor.module.css    # Styles
└── index.ts                 # Exports
```

**File: `src/components/CodeEditor/CodeEditor.tsx`**
```typescript
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import styles from './CodeEditor.module.css';

interface CodeEditorProps {
  defaultValue?: string;
  defaultLanguage?: string;
  onChange?: (value: string | undefined) => void;
}

export default function CodeEditor({
  defaultValue = '// Welcome to RangerPlex Code Editor!\n// Write your code here...\n',
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
```

**File: `src/components/CodeEditor/CodeEditor.module.css`**
```css
.editorContainer {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
}

.editorWrapper {
  flex: 1;
  overflow: hidden;
}

/* Loading state */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #cccccc;
  font-size: 16px;
}
```

**File: `src/components/CodeEditor/index.ts`**
```typescript
export { default } from './CodeEditor';
```

**Deliverable:** Basic Monaco Editor component working with syntax highlighting

---

### **Task 3: Add Routing** ⬜
**Estimated Time:** 15 minutes

**Find Router File:**
Likely in `src/App.tsx` or `src/router/index.tsx`

**Add Route:**
```typescript
import CodeEditor from './components/CodeEditor';

// Add to routes:
<Route path="/editor" element={<CodeEditor />} />
```

**Test URL:**
```
http://localhost:5173/editor
```

**Deliverable:** Editor accessible at `/editor` route

---

### **Task 4: Add Sidebar Navigation** ⬜
**Estimated Time:** 20 minutes

**Find Sidebar Component:**
Likely in `src/components/Sidebar.tsx` or similar

**Add Navigation Button:**
```typescript
import { Code } from 'lucide-react';

// Add to navigation items:
<button
  onClick={() => navigate('/editor')}
  className="sidebar-button"
  title="Code Editor"
>
  <Code size={20} />
  <span>Editor</span>
</button>
```

**Styling:** Match existing sidebar buttons (check current style)

**Deliverable:** "Editor" button in sidebar that opens Monaco Editor

---

### **Task 5: Create Types & Interfaces** ⬜
**Estimated Time:** 20 minutes

**File: `src/types/editor.ts`**
```typescript
export interface EditorFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  lastModified: number;
  isUnsaved?: boolean;
}

export interface EditorFolder {
  id: string;
  name: string;
  path: string;
  children: (EditorFile | EditorFolder)[];
  isExpanded?: boolean;
}

export interface EditorSettings {
  theme: 'vs-dark' | 'vs-light' | 'hc-black';
  fontSize: number;
  tabSize: 2 | 4 | 8;
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  autoSave: boolean;
  autoSaveDelay: number; // milliseconds
}

export interface EditorState {
  openFiles: EditorFile[];
  activeFileId: string | null;
  settings: EditorSettings;
  fileTree: EditorFolder | null;
}

export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'go'
  | 'rust'
  | 'java'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'html'
  | 'css'
  | 'scss'
  | 'json'
  | 'yaml'
  | 'markdown'
  | 'bash'
  | 'shell'
  | 'sql';

export const languageExtensions: Record<SupportedLanguage, string[]> = {
  javascript: ['.js', '.jsx', '.mjs'],
  typescript: ['.ts', '.tsx'],
  python: ['.py'],
  go: ['.go'],
  rust: ['.rs'],
  java: ['.java'],
  cpp: ['.cpp', '.cc', '.cxx'],
  c: ['.c', '.h'],
  csharp: ['.cs'],
  php: ['.php'],
  ruby: ['.rb'],
  html: ['.html', '.htm'],
  css: ['.css'],
  scss: ['.scss', '.sass'],
  json: ['.json'],
  yaml: ['.yaml', '.yml'],
  markdown: ['.md', '.markdown'],
  bash: ['.sh', '.bash'],
  shell: ['.sh'],
  sql: ['.sql']
};

export function detectLanguageFromFilename(filename: string): SupportedLanguage {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();

  for (const [language, extensions] of Object.entries(languageExtensions)) {
    if (extensions.includes(ext)) {
      return language as SupportedLanguage;
    }
  }

  return 'javascript'; // Default fallback
}
```

**Deliverable:** Type definitions for editor components

---

### **Task 6: Add to Main Types** ⬜
**Estimated Time:** 10 minutes

**Find: `src/types.ts`** (or wherever main types are)

**Add Editor Model Type:**
```typescript
export enum ModelType {
  // ... existing models ...

  // Add near bottom:
  MONACO_EDITOR = 'monaco-editor',
}
```

**Deliverable:** Editor integrated into RangerPlex type system

---

### **Task 7: Create Basic File Service** ⬜
**Estimated Time:** 30 minutes

**File: `src/services/editorFileService.ts`**
```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { EditorFile, EditorFolder } from '../types/editor';
import { v4 as uuidv4 } from 'uuid';

interface EditorDB extends DBSchema {
  files: {
    key: string; // file id
    value: EditorFile;
    indexes: { 'by-path': string };
  };
  folders: {
    key: string; // folder id
    value: EditorFolder;
    indexes: { 'by-path': string };
  };
}

class EditorFileService {
  private db: IDBPDatabase<EditorDB> | null = null;

  async init() {
    if (this.db) return;

    this.db = await openDB<EditorDB>('rangerplex-editor', 1, {
      upgrade(db) {
        // Files store
        const filesStore = db.createObjectStore('files', { keyPath: 'id' });
        filesStore.createIndex('by-path', 'path');

        // Folders store
        const foldersStore = db.createObjectStore('folders', { keyPath: 'id' });
        foldersStore.createIndex('by-path', 'path');
      }
    });
  }

  // Create new file
  async createFile(name: string, path: string, language: string, content: string = ''): Promise<EditorFile> {
    await this.init();

    const file: EditorFile = {
      id: uuidv4(),
      name,
      path,
      language,
      content,
      lastModified: Date.now(),
      isUnsaved: false
    };

    await this.db!.put('files', file);
    return file;
  }

  // Get file by ID
  async getFile(id: string): Promise<EditorFile | undefined> {
    await this.init();
    return await this.db!.get('files', id);
  }

  // Get file by path
  async getFileByPath(path: string): Promise<EditorFile | undefined> {
    await this.init();
    return await this.db!.getFromIndex('files', 'by-path', path);
  }

  // Update file content
  async updateFile(id: string, content: string): Promise<void> {
    await this.init();
    const file = await this.getFile(id);
    if (file) {
      file.content = content;
      file.lastModified = Date.now();
      file.isUnsaved = false;
      await this.db!.put('files', file);
    }
  }

  // Get all files
  async getAllFiles(): Promise<EditorFile[]> {
    await this.init();
    return await this.db!.getAll('files');
  }

  // Delete file
  async deleteFile(id: string): Promise<void> {
    await this.init();
    await this.db!.delete('files', id);
  }
}

export const editorFileService = new EditorFileService();
```

**Deliverable:** File persistence layer (save/load files from IndexedDB)

---

### **Task 8: Testing & Verification** ⬜
**Estimated Time:** 20 minutes

**Test Checklist:**
- [ ] Monaco Editor loads without errors
- [ ] Syntax highlighting works for JavaScript
- [ ] Can type code in the editor
- [ ] Editor is accessible from sidebar
- [ ] Route `/editor` works
- [ ] No console errors
- [ ] Editor is responsive (resizes properly)

**Test Code:**
```javascript
// Type this in the editor:
function testMonaco() {
  console.log('Monaco Editor is working!');
  return 'Success! 🎉';
}

testMonaco();
```

**Expected:** Syntax highlighting, IntelliSense suggestions, no errors

**Deliverable:** Working editor with verified functionality

---

### **Task 9: Create Documentation** ⬜
**Estimated Time:** 15 minutes

**File: `docs/monaco/SETUP_COMPLETE.md`**
```markdown
# Monaco Editor Setup - COMPLETE ✅

**Date:** [Date you complete this]
**Agent:** AIRanger Claude (Current Session)

## What Was Done

### 1. Dependencies Installed
- @monaco-editor/react@4.x.x

### 2. Components Created
- CodeEditor.tsx (main component)
- CodeEditor.module.css (styles)
- index.ts (exports)

### 3. Routing Added
- Route: /editor
- Sidebar button: "Editor" with Code icon

### 4. Types Created
- src/types/editor.ts (EditorFile, EditorFolder, EditorSettings, etc.)
- Language detection utilities

### 5. Services Created
- editorFileService.ts (IndexedDB file persistence)

## How to Use

1. Click "Editor" in sidebar
2. Start typing code
3. Enjoy VS Code-quality editing!

## Next Steps

Hand off to:
- **Gemini**: Build UI components (FileTree, Tabs, Toolbar)
- **GPT**: Integrate with Terminal and AI chat
- **Claude-2**: Add advanced features (themes, snippets)

## File Locations

- Component: `src/components/CodeEditor/`
- Types: `src/types/editor.ts`
- Service: `src/services/editorFileService.ts`

**Status:** ✅ FOUNDATION COMPLETE
**Ready for:** Gemini, GPT, Claude-2 missions

Rangers lead the way! 🎖️
```

**Deliverable:** Setup documentation for other AIs

---

## 📊 Deliverables Summary

After completing this mission, you will have:

1. ✅ Monaco Editor package installed
2. ✅ Basic CodeEditor component working
3. ✅ Routing configured (`/editor`)
4. ✅ Sidebar navigation added
5. ✅ Type definitions created
6. ✅ File service (IndexedDB) created
7. ✅ Tested and verified
8. ✅ Documentation written

**Ready for handoff to:**
- Gemini (UI Components)
- GPT (Integration)
- Claude-2 (Advanced Features)

---

## 🚧 Critical Notes

### **Don't Touch These (Other AIs Handle):**
- ❌ FileTree component (Gemini's job)
- ❌ Tabs component (Gemini's job)
- ❌ Terminal integration (GPT's job)
- ❌ AI chat integration (GPT's job)
- ❌ Themes/snippets (Claude-2's job)

### **Your Focus:**
- ✅ Get Monaco Editor working
- ✅ Create foundation
- ✅ Set up architecture
- ✅ Make it accessible

### **Testing URLs:**
```
Development: http://localhost:5173/editor
Production: [URL when deployed]
```

### **Dependencies Already in RangerPlex:**
- React 18.3.1
- TypeScript
- Vite
- Lucide React (icons)
- IDB (IndexedDB wrapper)
- UUID (ID generation)

---

## 🎯 Success Criteria

Mission is COMPLETE when:
- [ ] `npm list @monaco-editor/react` shows package installed
- [ ] Can navigate to `/editor` route
- [ ] Monaco Editor loads with syntax highlighting
- [ ] Can type code and see IntelliSense
- [ ] Sidebar has "Editor" button
- [ ] No console errors
- [ ] Documentation created in `docs/monaco/SETUP_COMPLETE.md`

---

## 📞 Handoff Procedure

**When Done:**
1. Complete all tasks above
2. Test thoroughly
3. Create SETUP_COMPLETE.md
4. Tell David: "Setup complete! Ready for Gemini!"
5. David will start Gemini mission

**What to Tell Gemini:**
```
"Foundation is ready! Monaco Editor is working at /editor route.
Your mission: Build FileTree, Tabs, and Toolbar components.
Check docs/monaco/jobs/GEMINI_MISSION_FRONTEND.md for details."
```

---

**Mission Status:** 📋 **READY TO EXECUTE**
**Estimated Completion:** 2-3 hours
**Priority:** CRITICAL (Must complete first!)

**Rangers lead the way!** 🎖️

*Created by AIRanger Claude (claude-sonnet-4-5-20250929)*
*November 26, 2025*

---

## Progress Notes (GPT-4)
* Monaco foundation is already live: `@monaco-editor/react` installed, `CodeEditor` + CSS + index exported, and `/editor` overlay wired in `App.tsx`.
* Editor types (`src/types/editor.ts`) and file service (`src/services/editorFileService.ts`) exist.
* Sidebar entry and routing/overlay are present; editor works in the modal overlay used by `App.tsx`.
* Remaining Claude scope here is largely informational; no further setup needed before advanced/Claude-2 tasks.

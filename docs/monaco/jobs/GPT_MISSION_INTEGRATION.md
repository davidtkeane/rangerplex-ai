# 🔗 Mission Brief: Monaco Editor Integration Layer
**Agent:** GPT Ranger
**Status:** ⏳ Awaiting Claude & Gemini Completion
**Priority:** HIGH (Connects editor to RangerPlex ecosystem)
**Estimated Time:** 4-6 hours

---

## 🚀 ENHANCED MISSION - UPDATED!

**Commander David has requested advanced features!** 🎖️

See **`ENHANCED_AI_INTEGRATION_PLAN.md`** for the complete vision:
1. **Floating AI Chat Window** (like Claude Desktop) with FULL editor control
2. **Advanced Terminal Integration** with split view and smart execution
3. **Multi-AI Support** (Claude, GPT, Gemini, Ollama)

This mission brief covers the **foundation** for those features. Build these first, then we'll add the enhanced capabilities!

---

## 🎯 Mission Objective

Integrate Monaco Editor with RangerPlex's existing systems: Terminal (for running code), AI Chat (for code assistance), and Settings (for editor preferences). Create a seamless development experience where users can write, run, and get AI help all in one place.

**Prerequisites:**
- Current Claude must complete setup (Monaco Editor working)
- Gemini must complete frontend (UI components ready)

---

## 📋 Task List

### **Task 1: Verify Prerequisites** ✅ or ⬜
**Estimated Time:** 10 minutes

**Check that previous missions are complete:**
- [ ] Claude: Monaco Editor working at `/editor`
- [ ] Claude: Types and services created
- [ ] Gemini: FileTree component exists
- [ ] Gemini: EditorTabs component exists
- [ ] Gemini: EditorToolbar component exists
- [ ] Gemini: EditorLayout component working

**If any missing:** Ask David to have those AIs complete their missions first!

**Deliverable:** Confirmed foundation and UI are ready

---

### **Task 2: Terminal Integration (Code Execution)** ⬜
**Estimated Time:** 90 minutes

**Goal:** Connect the "Run" button to the terminal so users can execute their code

**Background:**
- Terminal WebSocket already implemented: `ws://localhost:3010/terminal`
- Terminal component exists (check `src/components/Terminal/` or similar)
- See `docs/terminal/jobs/CLAUDE_MISSION_BACKEND.md` for terminal details

**Create Service: `src/services/codeExecutionService.ts`**
```typescript
import { SupportedLanguage } from '../types/editor';

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

class CodeExecutionService {
  // Reference to terminal WebSocket (you'll need to get this from Terminal component)
  private terminalWs: WebSocket | null = null;

  setTerminalWebSocket(ws: WebSocket) {
    this.terminalWs = ws;
  }

  // Execute code based on language
  async executeCode(code: string, language: SupportedLanguage, filename: string = 'temp'): Promise<ExecutionResult> {
    if (!this.terminalWs || this.terminalWs.readyState !== WebSocket.OPEN) {
      return {
        success: false,
        output: '',
        error: 'Terminal not connected. Please open terminal first.'
      };
    }

    try {
      const command = this.getExecutionCommand(code, language, filename);

      // Send command to terminal
      this.terminalWs.send(command + '\n');

      return {
        success: true,
        output: 'Code sent to terminal. Check terminal output below.',
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get execution command based on language
  private getExecutionCommand(code: string, language: SupportedLanguage, filename: string): string {
    switch (language) {
      case 'javascript':
        // Save to temp file and run with node
        return `node -e "${code.replace(/"/g, '\\"')}"`;

      case 'python':
        return `python3 -c "${code.replace(/"/g, '\\"')}"`;

      case 'bash':
      case 'shell':
        return code; // Execute directly

      case 'typescript':
        return `ts-node -e "${code.replace(/"/g, '\\"')}"`;

      default:
        return `echo "Execution not supported for ${language} yet"`;
    }
  }

  // Alternative: Save file then execute
  async executeFromFile(filepath: string, language: SupportedLanguage): Promise<ExecutionResult> {
    if (!this.terminalWs || this.terminalWs.readyState !== WebSocket.OPEN) {
      return {
        success: false,
        output: '',
        error: 'Terminal not connected.'
      };
    }

    const command = this.getFileExecutionCommand(filepath, language);
    this.terminalWs.send(command + '\n');

    return {
      success: true,
      output: 'Executing file in terminal...',
    };
  }

  private getFileExecutionCommand(filepath: string, language: SupportedLanguage): string {
    switch (language) {
      case 'javascript':
        return `node "${filepath}"`;
      case 'python':
        return `python3 "${filepath}"`;
      case 'bash':
      case 'shell':
        return `bash "${filepath}"`;
      case 'typescript':
        return `ts-node "${filepath}"`;
      default:
        return `cat "${filepath}"`;
    }
  }
}

export const codeExecutionService = new CodeExecutionService();
```

**Update EditorLayout to use execution service:**
```typescript
import { codeExecutionService } from '../../services/codeExecutionService';

// In EditorLayout component:
const handleRun = async () => {
  if (!currentCode) {
    alert('No code to run!');
    return;
  }

  const result = await codeExecutionService.executeCode(
    currentCode,
    currentLanguage,
    activeFile?.name || 'temp'
  );

  if (!result.success && result.error) {
    alert(`Error: ${result.error}`);
  }
};
```

**Create Split View Component: `src/components/CodeEditor/EditorTerminalSplit.tsx`**
```typescript
import { useState } from 'react';
import EditorLayout from './EditorLayout';
import Terminal from '../Terminal'; // Adjust import based on actual Terminal location
import styles from './EditorTerminalSplit.module.css';

export default function EditorTerminalSplit() {
  const [terminalHeight, setTerminalHeight] = useState(300); // px

  return (
    <div className={styles.splitContainer}>
      <div className={styles.editorSection} style={{ height: `calc(100% - ${terminalHeight}px)` }}>
        <EditorLayout />
      </div>

      <div className={styles.resizeHandle} />

      <div className={styles.terminalSection} style={{ height: `${terminalHeight}px` }}>
        <Terminal />
      </div>
    </div>
  );
}
```

**File: `src/components/CodeEditor/EditorTerminalSplit.module.css`**
```css
.splitContainer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.editorSection {
  flex: 1;
  overflow: hidden;
}

.resizeHandle {
  height: 4px;
  background: #3e3e42;
  cursor: ns-resize;
  transition: background 0.2s;
}

.resizeHandle:hover {
  background: #007acc;
}

.terminalSection {
  background: #1e1e1e;
  overflow: hidden;
}
```

**Update Route:**
```typescript
// Change from EditorLayout to EditorTerminalSplit
<Route path="/editor" element={<EditorTerminalSplit />} />
```

**Deliverable:** "Run" button executes code in terminal

---

### **Task 3: AI Chat Integration** ⬜
**Estimated Time:** 90 minutes

**Goal:** Let users ask AI for help with their code directly from the editor

**Create AI Helper Component: `src/components/CodeEditor/AIHelper.tsx`**
```typescript
import { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import styles from './AIHelper.module.css';

interface AIHelperProps {
  selectedCode: string;
  onSendToChat: (message: string) => void;
}

export default function AIHelper({ selectedCode, onSendToChat }: AIHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleQuickAction = (action: string) => {
    let message = '';

    if (selectedCode) {
      switch (action) {
        case 'explain':
          message = `Can you explain this code?\n\n\`\`\`\n${selectedCode}\n\`\`\``;
          break;
        case 'improve':
          message = `How can I improve this code?\n\n\`\`\`\n${selectedCode}\n\`\`\``;
          break;
        case 'fix':
          message = `This code has an error. Can you help fix it?\n\n\`\`\`\n${selectedCode}\n\`\`\``;
          break;
        case 'document':
          message = `Add documentation/comments to this code:\n\n\`\`\`\n${selectedCode}\n\`\`\``;
          break;
      }
    } else {
      message = `I need help with ${action}`;
    }

    onSendToChat(message);
    setIsOpen(false);
  };

  const handleCustomPrompt = () => {
    if (!prompt.trim()) return;

    let message = prompt;
    if (selectedCode) {
      message += `\n\n\`\`\`\n${selectedCode}\n\`\`\``;
    }

    onSendToChat(message);
    setPrompt('');
    setIsOpen(false);
  };

  return (
    <div className={styles.aiHelper}>
      <button
        className={styles.toggleBtn}
        onClick={() => setIsOpen(!isOpen)}
        title="AI Assistant"
      >
        <MessageSquare size={20} />
        {selectedCode && <span className={styles.badge}>!</span>}
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <h3>AI Assistant</h3>
            <button onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {selectedCode && (
            <div className={styles.selectedCode}>
              <small>Selected code:</small>
              <code>{selectedCode.substring(0, 100)}...</code>
            </div>
          )}

          <div className={styles.quickActions}>
            <h4>Quick Actions:</h4>
            <button onClick={() => handleQuickAction('explain')}>
              Explain Code
            </button>
            <button onClick={() => handleQuickAction('improve')}>
              Improve Code
            </button>
            <button onClick={() => handleQuickAction('fix')}>
              Fix Errors
            </button>
            <button onClick={() => handleQuickAction('document')}>
              Add Documentation
            </button>
          </div>

          <div className={styles.customPrompt}>
            <h4>Custom Question:</h4>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything about your code..."
              rows={3}
            />
            <button onClick={handleCustomPrompt} disabled={!prompt.trim()}>
              <Send size={16} />
              Send to Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**File: `src/components/CodeEditor/AIHelper.module.css`**
```css
.aiHelper {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}

.toggleBtn {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #007acc;
  border: none;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 122, 204, 0.4);
  transition: all 0.2s;
}

.toggleBtn:hover {
  background: #005a9e;
  transform: scale(1.05);
}

.badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 12px;
  height: 12px;
  background: #ff6b6b;
  border-radius: 50%;
}

.panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 350px;
  background: #2d2d2d;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 16px;
}

.header button {
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
}

.selectedCode {
  background: #1e1e1e;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #cccccc;
}

.selectedCode code {
  display: block;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quickActions h4,
.customPrompt h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #cccccc;
}

.quickActions {
  margin-bottom: 16px;
}

.quickActions button {
  display: block;
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 6px;
  background: #3c3c3c;
  border: 1px solid #454545;
  color: #cccccc;
  text-align: left;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.quickActions button:hover {
  background: #505050;
}

.customPrompt textarea {
  width: 100%;
  padding: 8px;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  color: #cccccc;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  resize: none;
  margin-bottom: 8px;
}

.customPrompt button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #007acc;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.customPrompt button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.customPrompt button:not(:disabled):hover {
  background: #005a9e;
}
```

**Integrate AIHelper into EditorLayout:**
```typescript
import AIHelper from './AIHelper';

// In EditorLayout:
const [selectedCode, setSelectedCode] = useState('');

// Add to Monaco Editor options:
onMount={(editor) => {
  editor.onDidChangeCursorSelection((e) => {
    const selection = editor.getModel()?.getValueInRange(e.selection);
    setSelectedCode(selection || '');
  });
}}

// Add AIHelper to render:
<AIHelper
  selectedCode={selectedCode}
  onSendToChat={(message) => {
    // Send to chat - you'll need to implement this
    // Probably open chat sidebar and send message
    console.log('Send to chat:', message);
  }}
/>
```

**Connect to RangerPlex Chat:**
Find the chat component and create a function to send messages programmatically.
This might involve:
- Opening the chat sidebar
- Setting the message input value
- Optionally auto-sending the message

**Deliverable:** AI Assistant button with code help features

---

### **Task 4: Settings Integration** ⬜
**Estimated Time:** 60 minutes

**Goal:** Add editor preferences to RangerPlex Settings page

**Find Settings Component:**
Likely in `src/components/Settings/` or `src/pages/Settings/`

**Add Editor Settings Section:**
```typescript
// In Settings component, add new section:

<section>
  <h2>Code Editor</h2>

  <div className="setting-group">
    <label>Theme</label>
    <select value={editorSettings.theme} onChange={handleThemeChange}>
      <option value="vs-dark">Dark (VS Code)</option>
      <option value="vs-light">Light</option>
      <option value="hc-black">High Contrast</option>
    </select>
  </div>

  <div className="setting-group">
    <label>Font Size</label>
    <input
      type="number"
      min="10"
      max="30"
      value={editorSettings.fontSize}
      onChange={handleFontSizeChange}
    />
  </div>

  <div className="setting-group">
    <label>Tab Size</label>
    <select value={editorSettings.tabSize} onChange={handleTabSizeChange}>
      <option value={2}>2 spaces</option>
      <option value={4}>4 spaces</option>
      <option value={8}>8 spaces</option>
    </select>
  </div>

  <div className="setting-group">
    <label>
      <input
        type="checkbox"
        checked={editorSettings.minimap}
        onChange={handleMinimapToggle}
      />
      Show Minimap
    </label>
  </div>

  <div className="setting-group">
    <label>
      <input
        type="checkbox"
        checked={editorSettings.autoSave}
        onChange={handleAutoSaveToggle}
      />
      Auto-Save
    </label>
  </div>

  {editorSettings.autoSave && (
    <div className="setting-group">
      <label>Auto-Save Delay (seconds)</label>
      <input
        type="number"
        min="1"
        max="60"
        value={editorSettings.autoSaveDelay / 1000}
        onChange={handleAutoSaveDelayChange}
      />
    </div>
  )}
</section>
```

**Save Settings to Database:**
Use RangerPlex's existing settings service (likely in `src/services/dbService.ts` or similar)

**Load Settings in Editor:**
Update EditorLayout to read settings and apply to Monaco Editor

**Deliverable:** Editor settings in RangerPlex Settings page

---

### **Task 5: Keyboard Shortcuts** ⬜
**Estimated Time:** 45 minutes

**Goal:** Add keyboard shortcuts for common actions

**Update EditorLayout with shortcuts:**
```typescript
import { useEffect } from 'react';

// In EditorLayout:
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+S or Cmd+S: Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }

    // Ctrl+Enter or Cmd+Enter: Run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }

    // Ctrl+Shift+F or Cmd+Shift+F: Format
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
      e.preventDefault();
      handleFormat();
    }

    // Ctrl+W or Cmd+W: Close tab
    if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
      e.preventDefault();
      if (activeFileId) {
        handleTabClose(activeFileId);
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [activeFileId]); // Dependencies
```

**Add Shortcuts Reference:**
Create a "Shortcuts" button in toolbar that shows all keyboard shortcuts

**Deliverable:** Working keyboard shortcuts

---

### **Task 6: Auto-Save Implementation** ⬜
**Estimated Time:** 30 minutes

**Update EditorLayout with auto-save:**
```typescript
import { useEffect, useRef } from 'react';

// In EditorLayout:
const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  if (!editorSettings.autoSave || !activeFileId) return;

  // Clear existing timer
  if (autoSaveTimerRef.current) {
    clearTimeout(autoSaveTimerRef.current);
  }

  // Set new timer
  autoSaveTimerRef.current = setTimeout(() => {
    handleSave();
  }, editorSettings.autoSaveDelay);

  return () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
  };
}, [currentCode, activeFileId, editorSettings.autoSave, editorSettings.autoSaveDelay]);
```

**Add Auto-Save Indicator:**
Show "Auto-saved" message after auto-save completes

**Deliverable:** Working auto-save feature

---

### **Task 7: Testing & Polish** ⬜
**Estimated Time:** 30 minutes

**Test Checklist:**
- [ ] Run button executes code in terminal
- [ ] Terminal shows output correctly
- [ ] AI Assistant opens and sends messages
- [ ] Settings page has editor options
- [ ] Settings are applied to editor
- [ ] Keyboard shortcuts work (Ctrl+S, Ctrl+Enter)
- [ ] Auto-save works
- [ ] Split view (editor + terminal) is responsive

**Integration Tests:**
1. Write JavaScript code → Click Run → See output in terminal
2. Write Python code → Click Run → See output in terminal
3. Select code → Click AI button → Ask question → Message sent to chat
4. Change font size in settings → See change in editor
5. Enable auto-save → Type code → Wait → File saves automatically

**Deliverable:** Tested and verified integrations

---

### **Task 8: Create Documentation** ⬜
**Estimated Time:** 20 minutes

**File: `docs/monaco/INTEGRATION_COMPLETE.md`**
```markdown
# Monaco Editor Integration - COMPLETE ✅

**Date:** [Date you complete this]
**Agent:** GPT Ranger

## What Was Done

### Integrations Completed
1. **Terminal Integration** - Code execution via terminal
2. **AI Chat Integration** - AI Assistant for code help
3. **Settings Integration** - Editor preferences in Settings page
4. **Keyboard Shortcuts** - Common shortcuts (Save, Run, Format)
5. **Auto-Save** - Automatic file saving

### Services Created
- `codeExecutionService.ts` - Execute code in terminal
- Updated `dbService.ts` with editor settings

### Components Created
- `EditorTerminalSplit.tsx` - Split view layout
- `AIHelper.tsx` - AI assistant panel

## Features Implemented
- ✅ Run code in terminal (JavaScript, Python, Bash)
- ✅ AI code assistance (Explain, Improve, Fix, Document)
- ✅ Editor settings (theme, font size, tab size, minimap)
- ✅ Auto-save with configurable delay
- ✅ Keyboard shortcuts (Ctrl+S, Ctrl+Enter, etc.)

## How to Use

### Run Code
1. Write code in editor
2. Click "Run" button or press Ctrl+Enter
3. See output in terminal below

### Get AI Help
1. Select code (or don't for general questions)
2. Click AI Assistant button (bottom-right)
3. Choose quick action or ask custom question
4. Message sent to chat automatically

### Change Settings
1. Go to Settings page
2. Find "Code Editor" section
3. Adjust preferences (theme, font size, etc.)
4. Changes apply immediately

## Next Steps

Hand off to:
- **Claude-2**: Add advanced features (themes, snippets, language servers)

**Status:** ✅ INTEGRATION COMPLETE
**Ready for:** Claude-2 advanced features mission

Rangers lead the way! 🎖️
```

**Deliverable:** Integration completion documentation

---

## 📊 Deliverables Summary

After completing this mission, you will have:

1. ✅ Terminal integration (code execution)
2. ✅ Split view (editor + terminal)
3. ✅ AI Assistant integration
4. ✅ Settings page integration
5. ✅ Keyboard shortcuts
6. ✅ Auto-save feature
7. ✅ All integrations tested
8. ✅ Documentation created

---

## 🔗 Integration Points

**What You Need to Connect:**
1. **Terminal WebSocket** - Already at `ws://localhost:3010/terminal`
2. **Chat Component** - Find and connect to send messages
3. **Settings Service** - Use existing RangerPlex settings system
4. **Database Service** - Use existing IndexedDB or backend database

**Files to Find:**
- Terminal component (probably `src/components/Terminal/`)
- Chat component (probably `src/components/Chat/`)
- Settings component (probably `src/components/Settings/`)
- Database service (probably `src/services/dbService.ts`)

---

## 🚧 Critical Notes

### **Don't Touch These (Other AIs Handle):**
- ❌ Monaco Editor setup (Claude's job - done)
- ❌ UI components (Gemini's job - done)
- ❌ Advanced themes (Claude-2's job)
- ❌ Code snippets (Claude-2's job)

### **Your Focus:**
- ✅ Connect editor to terminal
- ✅ Connect editor to AI chat
- ✅ Connect editor to settings
- ✅ Make everything work together seamlessly

---

**Mission Status:** ⏳ **AWAITING CLAUDE & GEMINI**
**Estimated Completion:** 4-6 hours
**Priority:** HIGH (Integration layer)

**Rangers lead the way!** 🎖️

*Created by AIRanger Claude (claude-sonnet-4-5-20250929)*
*November 26, 2025*

---

## Progress Notes (GPT-4)

* Added `src/services/codeExecutionService.ts` to send execution commands over the terminal WebSocket.
* Updated `components/Terminal/RangerTerminal.tsx` to expose the WebSocket via `onSocketReady`, add resize notifications, and keep the cyberpunk styling.
* Built `src/components/CodeEditor/EditorTerminalSplit.tsx` + module CSS for a split view (Monaco editor over resizable terminal) and wired it into the App overlay; Run button sends code to terminal via the new service.
* Added `src/components/CodeEditor/AIHelper.tsx` (+ CSS) for quick AI prompts; currently routes messages into the active chat session via App callback.
* Pending: settings integration, keyboard shortcuts beyond Run, auto-save wiring, full chat automation, and completion doc (`docs/monaco/INTEGRATION_COMPLETE.md`). No automated tests run yet.

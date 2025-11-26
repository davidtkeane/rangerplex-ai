# Enhanced AI Integration Plan - Monaco Editor
**Advanced Features Beyond Phase 4**

**Created:** November 26, 2025
**Status:** PLANNING
**Priority:** HIGH - Commander's Request

---

## 🎯 Commander's Vision

Two major enhancements requested:

1. **AI Chat Window** - Floating chat like Claude Desktop with FULL editor control
2. **Terminal Integration** - Pop-up terminal to run code files directly

---

## 1. 🤖 AI Chat Integration Architecture

### Overview
A floating, draggable chat panel that allows AI assistants to interact directly with the Monaco Editor, reading and writing code with full context awareness.

### Features

#### Chat UI
- **Floating Panel** - Draggable, resizable chat window
- **Position Options:**
  - Right side overlay (default)
  - Bottom panel
  - Split view (50/50)
  - Minimized mode (chat icon only)
- **Dark Theme** - Matches RangerPlex aesthetic
- **Markdown Support** - Render AI responses with code blocks
- **Copy Code Button** - One-click copy from AI responses

#### AI Capabilities

##### Read Operations (AI → Editor)
```typescript
interface EditorReadAPI {
  // Get current file
  getCurrentFile(): EditorFile;

  // Get all open files
  getOpenFiles(): EditorFile[];

  // Get selected text
  getSelection(): string;

  // Get cursor position
  getCursorPosition(): { line: number; column: number };

  // Get file tree
  getFileTree(): EditorFolder;

  // Get terminal output (if open)
  getTerminalOutput(): string;

  // Get editor settings
  getSettings(): EditorSettings;
}
```

##### Write Operations (AI → Editor)
```typescript
interface EditorWriteAPI {
  // Insert code at cursor
  insertAtCursor(code: string): void;

  // Replace selected text
  replaceSelection(code: string): void;

  // Insert at specific line
  insertAtLine(lineNumber: number, code: string): void;

  // Replace entire file
  replaceFile(content: string): void;

  // Create new file
  createFile(path: string, content: string): void;

  // Open file in editor
  openFile(fileId: string): void;

  // Run command in terminal
  runInTerminal(command: string): void;

  // Highlight lines
  highlightLines(start: number, end: number): void;
}
```

#### Multi-AI Support

**Supported AI Services:**
1. **Anthropic Claude** (API)
   - Claude 3.5 Sonnet (best for code)
   - Claude 3 Opus (complex tasks)
   - Claude 3 Haiku (fast responses)

2. **OpenAI** (API)
   - GPT-4 Turbo
   - GPT-4
   - GPT-3.5 Turbo

3. **Ollama** (Local)
   - Llama 3
   - CodeLlama
   - Mistral
   - Phi-3
   - Custom models

4. **Google Gemini** (API)
   - Gemini Pro
   - Gemini Pro Vision

**AI Selector Dropdown** in chat window to switch between AIs.

#### Context Management

**What AI Sees:**
```typescript
interface AIContext {
  currentFile: {
    name: string;
    language: string;
    content: string;
    cursorLine: number;
    selectedText: string;
  };
  openFiles: EditorFile[];
  fileTree: EditorFolder;
  terminalOutput?: string;
  recentActions: string[]; // Last 5 actions
}
```

**Smart Context Sending:**
- Only send relevant files (not entire project)
- Include imports/dependencies
- Add terminal output if debugging
- Track conversation history

#### Chat Commands

**User Commands:**
- `/help` - Show AI capabilities
- `/context` - Show what AI can see
- `/clear` - Clear chat history
- `/model <name>` - Switch AI model
- `/settings` - Open AI settings

**AI Commands:**
- `@insert` - Insert code at cursor
- `@replace` - Replace selection
- `@file <path>` - Create/open file
- `@run` - Execute in terminal
- `@explain` - Explain selected code
- `@fix` - Fix selected code
- `@refactor` - Refactor selection

### Implementation Phases

#### Phase A: Chat UI Foundation
- [ ] Create ChatPanel component
- [ ] Add draggable/resizable functionality
- [ ] Add minimize/maximize controls
- [ ] Style to match RangerPlex theme
- [ ] Add markdown rendering
- [ ] Add code syntax highlighting in messages

#### Phase B: AI Service Integration
- [ ] Create aiService.ts abstraction layer
- [ ] Add Anthropic Claude API integration
- [ ] Add OpenAI API integration
- [ ] Add Ollama local integration
- [ ] Add Google Gemini API integration
- [ ] Add API key management
- [ ] Add model selection UI

#### Phase C: Editor API Bridge
- [ ] Create editorAPI.ts bridge
- [ ] Implement read operations
- [ ] Implement write operations
- [ ] Add context gathering
- [ ] Add safety checks (confirm before replace)
- [ ] Add undo/redo for AI changes

#### Phase D: Terminal Bridge
- [ ] Connect to existing RangerPlex terminal
- [ ] Pass commands from AI to terminal
- [ ] Capture terminal output for AI
- [ ] Add auto-run functionality

---

## 2. 🖥️ Terminal Integration

### Overview
Seamless integration between Monaco Editor and RangerPlex's existing terminal, allowing code execution directly from the editor.

### Features

#### Terminal Controls in Editor

**EditorToolbar Additions:**
```typescript
interface TerminalControls {
  // Run current file
  runFile(): void;

  // Run selected code
  runSelection(): void;

  // Open terminal split view
  openTerminal(): void;

  // Send custom command
  sendCommand(command: string): void;

  // Stop execution
  stopExecution(): void;
}
```

#### Smart Execution

**Auto-detect execution command:**
```typescript
const executionMap = {
  javascript: 'node',
  typescript: 'ts-node',
  python: 'python3',
  go: 'go run',
  rust: 'cargo run',
  java: 'java',
  cpp: 'g++ -o output && ./output',
  c: 'gcc -o output && ./output',
  php: 'php',
  ruby: 'ruby',
  shell: 'bash',
  bash: 'bash'
};
```

**Before execution:**
1. Auto-save file (if unsaved)
2. Detect language
3. Build command
4. Open terminal (if closed)
5. Execute command
6. Show output in terminal

#### Layout Options

**Split View Modes:**
1. **Horizontal Split** - Editor top, terminal bottom (70/30)
2. **Vertical Split** - Editor left, terminal right (60/40)
3. **Overlay** - Terminal slides up from bottom
4. **Separate** - Terminal in separate window

**Quick Toggle:**
- `Ctrl+` (backtick) - Toggle terminal
- `Ctrl+Shift+R` - Run current file
- `Ctrl+Shift+T` - Run selection

#### Terminal Features

**Enhanced Terminal Integration:**
- **File path awareness** - Terminal knows current file location
- **Auto CD** - Change directory to file location
- **Output capture** - Save output to file
- **Error highlighting** - Click error to jump to line
- **Clear output** - Clean terminal before run
- **Kill process** - Stop running scripts

### Implementation Phases

#### Phase E: Terminal Bridge
- [ ] Connect to existing terminal component
- [ ] Add terminal state management
- [ ] Create terminal API interface
- [ ] Add command sending capability
- [ ] Add output capturing

#### Phase F: Editor Controls
- [ ] Add "Run" button to toolbar
- [ ] Add "Run Selection" button
- [ ] Add language detection
- [ ] Add execution command mapping
- [ ] Add auto-save before run

#### Phase G: Layout System
- [ ] Create split view layout
- [ ] Add horizontal/vertical toggle
- [ ] Add resize handles
- [ ] Add terminal panel controls
- [ ] Add keyboard shortcuts

#### Phase H: Advanced Features
- [ ] Error line jumping
- [ ] Output to file
- [ ] Process management
- [ ] Multi-terminal tabs
- [ ] Terminal history

---

## 3. 🎨 UI/UX Design

### Chat Window Mockup
```
┌─────────────────────────────────┐
│ 💬 AI Chat  [Claude ▼] [_][×]  │
├─────────────────────────────────┤
│ User: Add error handling        │
│                                 │
│ 🤖 Claude: I'll add try-catch   │
│ ┌─────────────────────────────┐ │
│ │ try {                       │ │
│ │   // your code              │ │
│ │ } catch (error) {           │ │
│ │   console.error(error);     │ │
│ │ }                           │ │
│ └─────────────────────────────┘ │
│ [Insert at cursor] [Copy]       │
│                                 │
├─────────────────────────────────┤
│ Type message...           [Send]│
└─────────────────────────────────┘
```

### Editor with Terminal Split
```
┌─────────────────────────────────────────────┐
│ [File] [Edit] [Run ▶] [Terminal] [AI 💬]   │
├─────────────────────────────────────────────┤
│ main.py                              [×]    │
├─────────────────────────────────────────────┤
│ 1 def hello():                              │
│ 2     print("Hello World")                  │
│ 3                                           │
│ 4 hello()                                   │
│                                             │
├─────────────────────────────────────────────┤
│ Terminal ▼                        [Clear][×]│
├─────────────────────────────────────────────┤
│ $ python3 main.py                           │
│ Hello World                                 │
│ $ █                                         │
└─────────────────────────────────────────────┘
```

---

## 4. 🔐 Security & Safety

### AI Safety Measures
- **Confirmation dialogs** - Ask before replacing large blocks
- **Diff preview** - Show changes before applying
- **Undo buffer** - Revert AI changes
- **Rate limiting** - Prevent API abuse
- **Token limits** - Cap message size
- **API key encryption** - Secure credential storage

### Terminal Safety
- **Dangerous command detection** - Warn before `rm -rf`, `sudo`, etc.
- **Sandbox option** - Run in isolated container
- **Process limits** - Timeout long-running commands
- **Output limits** - Cap terminal output size

---

## 5. 📊 File Structure

```
src/
├── components/
│   ├── CodeEditor/
│   │   ├── ChatPanel.tsx           # AI chat window
│   │   ├── ChatPanel.module.css
│   │   ├── TerminalSplit.tsx       # Terminal split view
│   │   ├── TerminalSplit.module.css
│   │   └── AICommandBar.tsx        # AI command input
│   └── ...
├── services/
│   ├── aiService.ts                # AI abstraction layer
│   ├── anthropicService.ts         # Claude API
│   ├── openaiService.ts            # GPT API
│   ├── ollamaService.ts            # Local Ollama
│   ├── geminiService.ts            # Google Gemini
│   ├── editorAPI.ts                # Editor bridge
│   └── terminalBridge.ts           # Terminal bridge
├── types/
│   ├── ai.ts                       # AI types
│   └── terminal.ts                 # Terminal types
└── config/
    └── aiConfig.ts                 # AI settings
```

---

## 6. 🚀 Implementation Timeline

### Immediate (Phase A-B)
**Estimated: 2-3 days**
- Chat UI foundation
- Basic AI service (Claude)
- Simple message sending

### Short Term (Phase C-D)
**Estimated: 3-4 days**
- Editor API bridge
- Context gathering
- Code insertion
- Terminal bridge basics

### Medium Term (Phase E-G)
**Estimated: 4-5 days**
- Full terminal integration
- Split view layouts
- Run file functionality
- Multiple AI services

### Long Term (Phase H+)
**Estimated: 5-7 days**
- Advanced features
- Multi-AI support
- Ollama local integration
- Error handling refinement

**Total: 2-3 weeks for full implementation**

---

## 7. 💡 Advanced Features (Future)

### AI Pair Programming
- **Live collaboration** - AI watches as you type
- **Inline suggestions** - GitHub Copilot style
- **Code review** - AI reviews on save
- **Test generation** - Auto-create unit tests
- **Documentation** - Auto-generate JSDoc

### Voice Control
- **Speech-to-text** - Dictate code changes
- **Voice commands** - "Run file", "Open terminal"
- **AI voice responses** - Text-to-speech replies

### Multi-File Operations
- **Project-wide refactor** - AI modifies multiple files
- **Dependency analysis** - AI suggests imports
- **Code migration** - Convert between languages
- **Batch operations** - Apply fixes to all files

---

## 8. 🎯 Dependencies

### Required Packages
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.20.0",
    "openai": "^4.0.0",
    "ollama": "^0.5.0",
    "@google/generative-ai": "^0.1.0"
  }
}
```

### API Keys Needed
- Anthropic Claude API key
- OpenAI API key (optional)
- Google Gemini API key (optional)
- Ollama: No key (local)

### Existing RangerPlex Components
- ✅ Terminal component (already exists)
- ✅ Monaco Editor (Phase 1 complete)
- ⏳ File tree (Phase 2 - Gemini building)
- ⏳ Editor layout (Phase 2 - Gemini building)

---

## 9. 📋 Task Assignments

### Who Builds What?

#### Option 1: Extend Existing Phases
- **GPT (Phase 3):** Add terminal integration + basic AI chat
- **Claude-2 (Phase 4):** Add advanced AI features + multi-AI support

#### Option 2: New Phase 5
- **Gemini (Phase 2):** Frontend components (current)
- **GPT (Phase 3):** Integration features (current)
- **Claude-2 (Phase 4):** Advanced features (current)
- **New Claude-3 (Phase 5):** AI Chat + Terminal enhancement

#### Option 3: Parallel Development
- **Current team:** Continue original phases
- **New agent:** Build AI chat in parallel
- **Integration:** Merge all phases at end

---

## 10. 🎖️ Commander's Approval

**Awaiting Commander's decision:**
1. Approve enhanced AI integration?
2. Choose implementation option (1, 2, or 3)?
3. Priority: Build AI chat first or terminal first?
4. AI services: Start with Claude only or multi-AI from start?

---

**Status:** 📋 PLANNING - Awaiting Commander's Instructions

**Rangers lead the way!** 🎖️

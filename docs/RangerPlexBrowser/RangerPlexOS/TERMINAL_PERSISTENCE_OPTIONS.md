# 🖥️ Terminal Persistence Options

**Created:** November 26, 2025
**Status:** PLANNING - Awaiting Commander's Decision

---

## 🎯 Goal

Save terminal history and state so it doesn't restart fresh every time.

---

## ⚠️ **THE CHALLENGE**

The terminal is **backend-based** (WebSocket to `ws://localhost:3010/terminal`), which makes persistence more complex than the editor.

---

## 💡 **THREE OPTIONS**

### Option 1: **Save Terminal History Only** ⭐ RECOMMENDED
**Complexity:** LOW
**Time:** 30 minutes
**Effectiveness:** 80%

**What it does:**
- Saves command history to localStorage/IndexedDB
- When terminal opens, displays previous commands
- **Doesn't** re-execute commands (safe!)
- Shows scrollback buffer (what you typed before)

**How it works:**
```typescript
// Save commands as user types
localStorage.setItem('terminal_history', JSON.stringify([
  '$ npm install',
  '$ npm run build',
  '$ node app.js'
]));

// On load: Display history in terminal
terminalOutput = previousHistory + currentSession;
```

**Pros:**
- ✅ Simple to implement
- ✅ No security risks
- ✅ See what you did last time
- ✅ Works immediately

**Cons:**
- ❌ Doesn't actually re-run commands
- ❌ No active processes saved

---

### Option 2: **Save Terminal State (History + Output)**
**Complexity:** MEDIUM
**Time:** 1-2 hours
**Effectiveness:** 90%

**What it does:**
- Saves both commands AND their output
- Terminal looks exactly like you left it
- Full scrollback history preserved
- Shows previous errors, warnings, output

**How it works:**
```typescript
interface TerminalState {
  history: Array<{
    command: string;
    output: string;
    timestamp: number;
  }>;
  scrollPosition: number;
}

// Save after each command completes
await saveTerminalState({
  history: [
    { command: '$ npm run build', output: '✓ built in 16.52s', timestamp: Date.now() },
    { command: '$ node app.js', output: 'Server listening...', timestamp: Date.now() }
  ],
  scrollPosition: terminal.scrollTop
});

// On load: Render saved history
terminal.innerHTML = renderHistory(savedState.history);
terminal.scrollTop = savedState.scrollPosition;
```

**Pros:**
- ✅ See exactly what happened last time
- ✅ Full context preserved
- ✅ Helpful for debugging
- ✅ Professional UX

**Cons:**
- ❌ Still doesn't re-run commands
- ❌ No active processes
- ❌ More storage needed

---

### Option 3: **Full Terminal Session Persistence** ⚠️ COMPLEX
**Complexity:** HIGH
**Time:** 4-6 hours
**Effectiveness:** 100% (but risky)

**What it does:**
- Saves actual terminal session on backend
- Re-attaches to running processes
- Active servers keep running
- Like tmux/screen sessions

**How it works:**
```bash
# Backend creates persistent sessions
tmux new-session -d -s "rangerplex-terminal-1"

# Terminal connects to existing session
tmux attach-session -t "rangerplex-terminal-1"

# Processes keep running even when terminal closes!
```

**Pros:**
- ✅ True persistence
- ✅ Long-running processes survive
- ✅ Professional dev tool behavior
- ✅ Multiple terminal tabs

**Cons:**
- ❌ Complex backend changes needed
- ❌ Security considerations (processes keep running)
- ❌ Resource usage (background processes)
- ❌ Requires tmux/screen on backend

---

## 🎖️ **MY RECOMMENDATION**

### **Start with Option 1, Then Upgrade to Option 2**

**Phase 1: Command History (Now)**
- Quick win (30 min)
- Users see what they did
- No breaking changes

**Phase 2: Full State (Later)**
- Better UX (1-2 hours)
- Complete scrollback
- Professional feel

**Phase 3: Session Persistence (Future)**
- Only if users request it
- Complex but powerful
- For advanced dev workflows

---

## 📋 **WHAT I CAN DO RIGHT NOW**

### Option 1 Implementation:

```typescript
// 1. Save command history
const terminalHistory: string[] = [];

terminal.on('command', (cmd) => {
  terminalHistory.push(cmd);
  localStorage.setItem('terminal_history', JSON.stringify(terminalHistory));
});

// 2. Load history on mount
const savedHistory = JSON.parse(localStorage.getItem('terminal_history') || '[]');
terminal.displayHistory(savedHistory);
```

**This gives you:**
- ✅ See all previous commands
- ✅ Recall commands (like shell history)
- ✅ Up/Down arrow to navigate history
- ✅ Survives page refresh

---

## 🤔 **COMPARISON**

| Feature | Option 1 | Option 2 | Option 3 |
|---------|----------|----------|----------|
| **Commands saved** | ✅ | ✅ | ✅ |
| **Output saved** | ❌ | ✅ | ✅ |
| **Processes survive** | ❌ | ❌ | ✅ |
| **Implementation time** | 30 min | 1-2 hours | 4-6 hours |
| **Storage needed** | Minimal | Moderate | Minimal* |
| **Backend changes** | None | None | Major |
| **Security risk** | None | None | Moderate |

*Session stored on backend, not in browser

---

## 💭 **ADDITIONAL CONSIDERATIONS**

### Storage Limits
- **Command History:** ~10KB for 1000 commands
- **Full State:** ~100KB for typical session
- **IndexedDB limit:** ~50MB (plenty of space)

### User Experience
- **Option 1:** "Oh, I remember running that command"
- **Option 2:** "Looks exactly like I left it!"
- **Option 3:** "My dev server is still running!"

### Use Cases
- **Coding practice:** Option 1 is enough
- **Development workflow:** Option 2 is best
- **Production deployment:** Option 3 needed

---

## 🎯 **RECOMMENDED APPROACH**

### **Implement Option 1 Now + Option 2 Soon**

**Reasoning:**
1. **Quick win** - Get something working fast
2. **Low risk** - No backend changes
3. **Good UX** - Users see their history
4. **Upgradeable** - Easy to add Option 2 later

**Timeline:**
- **Today:** Option 1 (30 minutes)
- **This week:** Option 2 (1-2 hours)
- **Future:** Option 3 (if requested)

---

## 📝 **CODE PREVIEW (Option 1)**

### Terminal History Service

```typescript
// src/services/terminalHistoryService.ts
class TerminalHistoryService {
  private history: string[] = [];
  private maxHistory = 1000;

  // Load history from localStorage
  load(): string[] {
    try {
      const saved = localStorage.getItem('terminal_history');
      this.history = saved ? JSON.parse(saved) : [];
      return this.history;
    } catch {
      return [];
    }
  }

  // Add command to history
  add(command: string): void {
    this.history.push(command);
    if (this.history.length > this.maxHistory) {
      this.history.shift(); // Remove oldest
    }
    this.save();
  }

  // Save to localStorage
  private save(): void {
    localStorage.setItem('terminal_history', JSON.stringify(this.history));
  }

  // Get all history
  getAll(): string[] {
    return [...this.history];
  }

  // Clear history
  clear(): void {
    this.history = [];
    localStorage.removeItem('terminal_history');
  }
}

export const terminalHistoryService = new TerminalHistoryService();
```

### Integration

```typescript
// When terminal opens
const history = terminalHistoryService.load();
terminal.displayHistory(history);

// When user types command
terminal.on('command', (cmd) => {
  terminalHistoryService.add(cmd);
});
```

---

## 🎖️ **COMMANDER'S DECISION (Nov 26, 2025)**

**Selected Strategy:** **Option 2 (State Persistence)** with **Seamus Integration**.

**Reasoning:**
- We are building a **Browser-OS**. The terminal must feel "alive".
- **Seamus's Phantom Logic**: We will save the state (history + output + CWD) to `./data/vault/terminal_phantom_state.json`.
- **Why not Option 3 yet?**: True session persistence requires backend re-architecture (`tmux`/`screen` wrapper). We will do this in **Phase 5 (Mini OS)**.

### **Implementation Plan**
1.  **Capture**: Hook into xterm.js `onData` to capture output buffer.
2.  **Save**: Debounce save to `./data/vault/`.
3.  **Restore**: On mount, read JSON and `term.write()` the saved output.

**Status:** ✅ APPROVED - Proceeding with Option 2.

---

## 🔧 **IMPLEMENTATION (Option 2 - State Persistence)**

### **Step 1: Create Vault Directory Structure**

```bash
mkdir -p ./data/vault
touch ./data/vault/terminal_phantom_state.json
touch ./data/vault/.gitignore
```

### **Step 2: Terminal State Service**

**File:** `src/services/terminalStateService.ts`

```typescript
import fs from 'fs/promises';
import path from 'path';

const VAULT_DIR = path.join(process.cwd(), 'data', 'vault');
const STATE_FILE = path.join(VAULT_DIR, 'terminal_phantom_state.json');

export interface TerminalHistoryEntry {
  command: string;
  output: string;
  timestamp: number;
  exitCode?: number;
}

export interface TerminalState {
  history: TerminalHistoryEntry[];
  workingDirectory: string;
  scrollPosition: number;
  lastUpdated: number;
}

class TerminalStateService {
  private saveTimeout: NodeJS.Timeout | null = null;
  private readonly SAVE_DELAY = 2000; // 2 seconds debounce

  // Ensure vault directory exists
  async ensureVault(): Promise<void> {
    try {
      await fs.mkdir(VAULT_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create vault directory:', error);
    }
  }

  // Load terminal state from disk
  async load(): Promise<TerminalState | null> {
    try {
      await this.ensureVault();
      const data = await fs.readFile(STATE_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, return null
      return null;
    }
  }

  // Save terminal state (debounced)
  async saveDebounced(state: TerminalState): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
      await this.saveImmediate(state);
    }, this.SAVE_DELAY);
  }

  // Save terminal state immediately
  async saveImmediate(state: TerminalState): Promise<void> {
    try {
      await this.ensureVault();
      const stateWithTimestamp = {
        ...state,
        lastUpdated: Date.now()
      };
      await fs.writeFile(STATE_FILE, JSON.stringify(stateWithTimestamp, null, 2), 'utf-8');
      console.log('✅ Terminal state saved to vault');
    } catch (error) {
      console.error('Failed to save terminal state:', error);
    }
  }

  // Add entry to history
  async addEntry(entry: TerminalHistoryEntry): Promise<void> {
    const state = await this.load() || {
      history: [],
      workingDirectory: process.cwd(),
      scrollPosition: 0,
      lastUpdated: Date.now()
    };

    state.history.push(entry);

    // Keep only last 1000 entries
    if (state.history.length > 1000) {
      state.history = state.history.slice(-1000);
    }

    await this.saveDebounced(state);
  }

  // Clear state
  async clear(): Promise<void> {
    try {
      await fs.unlink(STATE_FILE);
      console.log('Terminal state cleared');
    } catch (error) {
      // File doesn't exist, that's fine
    }
  }
}

export const terminalStateService = new TerminalStateService();
```

### **Step 3: Client-Side Terminal State (Browser)**

**File:** `src/services/terminalStateClientService.ts`

```typescript
// Browser-side version (uses localStorage as fallback)
export interface TerminalHistoryEntry {
  command: string;
  output: string;
  timestamp: number;
  exitCode?: number;
}

export interface TerminalStateClient {
  history: TerminalHistoryEntry[];
  scrollPosition: number;
  lastUpdated: number;
}

const STATE_KEY = 'terminal_phantom_state';
const MAX_HISTORY = 500; // Smaller for browser storage

class TerminalStateClientService {
  // Load from localStorage
  load(): TerminalStateClient | null {
    try {
      const data = localStorage.getItem(STATE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // Save to localStorage
  save(state: TerminalStateClient): void {
    try {
      const stateWithTimestamp = {
        ...state,
        lastUpdated: Date.now()
      };
      localStorage.setItem(STATE_KEY, JSON.stringify(stateWithTimestamp));
    } catch (error) {
      console.error('Failed to save terminal state:', error);
    }
  }

  // Add entry
  addEntry(entry: TerminalHistoryEntry): void {
    const state = this.load() || {
      history: [],
      scrollPosition: 0,
      lastUpdated: Date.now()
    };

    state.history.push(entry);

    // Keep only last N entries
    if (state.history.length > MAX_HISTORY) {
      state.history = state.history.slice(-MAX_HISTORY);
    }

    this.save(state);
  }

  // Clear state
  clear(): void {
    localStorage.removeItem(STATE_KEY);
  }
}

export const terminalStateClientService = new TerminalStateClientService();
```

### **Step 4: Integration with RangerTerminal**

Update `components/Terminal/RangerTerminal.tsx`:

```typescript
// Add at top
import { terminalStateClientService, TerminalHistoryEntry } from '../../src/services/terminalStateClientService';

// In component
useEffect(() => {
  if (!term) return;

  // Load saved state
  const savedState = terminalStateClientService.load();
  if (savedState && savedState.history.length > 0) {
    // Restore history
    savedState.history.forEach(entry => {
      term.write(`\r\n${entry.command}\r\n`);
      if (entry.output) {
        term.write(entry.output);
      }
    });

    // Restore scroll position
    if (savedState.scrollPosition > 0) {
      term.scrollToBottom();
    }

    console.log(`✅ Restored ${savedState.history.length} terminal entries`);
  }

  // Capture output for saving
  let currentCommand = '';
  let currentOutput = '';

  term.onData(data => {
    // Detect command execution (newline)
    if (data === '\r') {
      if (currentCommand.trim()) {
        // Command executed, wait for output
        setTimeout(() => {
          const entry: TerminalHistoryEntry = {
            command: currentCommand.trim(),
            output: currentOutput,
            timestamp: Date.now()
          };
          terminalStateClientService.addEntry(entry);
          currentCommand = '';
          currentOutput = '';
        }, 100);
      }
    } else if (data !== '\n') {
      currentCommand += data;
    }
  });

  // Capture output from terminal
  term.onLineFeed(() => {
    // Track output between commands
  });

}, [term]);
```

### **Step 5: Vault .gitignore**

**File:** `data/vault/.gitignore`

```
# Ignore all vault contents for privacy
*

# But track this .gitignore
!.gitignore
```

---

## 🧪 **TESTING CHECKLIST**

### **Test 1: Basic Persistence**
- [ ] Open terminal
- [ ] Run commands: `ls`, `pwd`, `echo "Hello"`
- [ ] Refresh page
- [ ] Terminal history restored ✅

### **Test 2: Long Session**
- [ ] Run 20+ commands
- [ ] Close browser completely
- [ ] Reopen
- [ ] All history present ✅

### **Test 3: Storage**
- [ ] Check `./data/vault/terminal_phantom_state.json`
- [ ] File exists and contains history ✅
- [ ] Check browser localStorage
- [ ] Key `terminal_phantom_state` exists ✅

### **Test 4: Clear Function**
- [ ] Run `terminalStateClientService.clear()`
- [ ] History disappears ✅

---

## 📊 **STORAGE COMPARISON**

| Location | Size | Persistence | Use Case |
|----------|------|-------------|----------|
| **localStorage** | ~5-10MB limit | Browser only | Quick access, client-side |
| **./data/vault/** | Unlimited | Disk | Server-side, Electron mode |

For **RangerPlex Browser** (Electron), both will be available!

---

## 🎯 **NEXT STEPS**

1. **Create vault directory** ✅
2. **Implement client service** (30 min)
3. **Integrate with RangerTerminal** (30 min)
4. **Test persistence** (15 min)
5. **Document for Electron** (15 min)

**Total Time:** ~1.5 hours

---

**Rangers lead the way!** 🎖️

---

*Updated by AIRanger Claude - November 26, 2025*
*Original decision by Colonel Gemini Ranger - November 26, 2025*

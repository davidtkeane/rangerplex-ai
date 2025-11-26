# RangerPlex Phantom Persistence System (Quick Reference)

**Status**: Implementation Ready
**Author**: AIRanger Claude
**Date**: Nov 26, 2025
**Based On**: RangerOS Phantom Wing Architecture v3.0

## 1. Executive Summary

The RangerPlex Phantom Persistence System ensures that **Editor files**, **Terminal history**, and **Chat sessions** survive page refreshes and browser restarts. Inspired by RangerOS's proven Phantom Wing architecture, this system reduces cognitive load for neurodivergent users and maintains productivity flow.

**Core Mission**: Transform disabilities into superpowers through persistent, reliable technology.

---

## 2. Architecture: The Dual-Storage Model

The system uses TWO storage layers for maximum reliability:

| Storage Type | Technology | Use Case | Capacity | Speed |
|--------------|------------|----------|----------|-------|
| **Browser** | localStorage + IndexedDB | Phase 1 - Immediate deployment | ~50MB | Instant |
| **Electron Vault** | SQLite + JSON files | Phase 2 - Full Electron mode | Unlimited | Fast |

### 2.1 What Gets Saved?

✅ **Editor Persistence** (Status: ✅ COMPLETE)
- Open files and tabs
- Active file selection
- Cursor positions and scroll states
- Unsaved changes (auto-save every 2 seconds)

✅ **Terminal Persistence** (Status: 📋 READY TO IMPLEMENT)
- Command history (last 500 commands)
- Command output and exit codes
- Working directory
- Scroll position

🔄 **Chat Session Persistence** (Status: 📋 FUTURE)
- Message history per session
- Active session selection
- Model preferences
- Knowledge base attachments

---

## 3. Storage Locations

### 3.1 Browser Mode (Phase 1 - Current)
```text
Browser localStorage:
├── rangerplex_editor_state       (Open tabs, active file)
├── terminal_phantom_state         (Terminal history)
└── chat_session_state             (Future)

Browser IndexedDB:
└── RangerPlexEditorDB
    └── files                      (File contents, unlimited storage)
```

### 3.2 Electron Mode (Phase 2 - Future)
```text
./data/vault/
├── terminal_phantom_state.json    (Terminal history backup)
├── editor_phantom_state.json      (Editor state backup)
├── rangerplex_memories.sqlite3    (Future: Full memory system)
├── schemas/                       (SQL templates for GitHub)
│   ├── terminal_coordination.sql
│   └── memory_operations.sql
├── examples/                      (JSON examples for GitHub)
│   ├── terminal_phantom_state_example.json
│   ├── editor_phantom_state_example.json
│   └── memory_operation_example.json
└── .gitignore                     (Privacy protection)
```

---

## 4. The "Restaurant Memory" System

Inspired by Seamus O'Brien's RangerOS architecture, RangerPlex treats browser tabs like restaurant tables:

**🍽️ The Kitchen Analogy:**
- **Active Tab** = Table being served (full resources)
- **Inactive Tabs** = Tables suspended (frozen to disk, 99% RAM freed)
- **Phantom State** = Recipe for reheating the meal perfectly

**Engine Assignment:**
- `active_engine` = Currently visible tab (hot/serving)
- `phantom_engine` = Suspended tabs (frozen/stored)

**Status Flow:**
```
cooking → served → stored → archived
```

---

## 5. Implementation Status

### Phase 1: Browser Persistence (localStorage)

#### ✅ Editor (COMPLETE)
- [x] IndexedDB integration (`editorFileService.ts`)
- [x] Auto-save with 2-second debounce
- [x] State restoration on mount
- [x] Open tabs and active file tracking
- **Implementation**: `src/components/CodeEditor/EditorLayout.tsx`

#### 📋 Terminal (READY TO IMPLEMENT)
- [ ] Create `terminalStateClientService.ts`
- [ ] Integrate with `RangerTerminal.tsx`
- [ ] Capture command history with xterm.js hooks
- [ ] Restore history on mount
- **Implementation Time**: 1-1.5 hours
- **Code**: Already documented in `TERMINAL_PERSISTENCE_OPTIONS.md`

#### 📋 Chat Sessions (FUTURE)
- [ ] Save message history to localStorage
- [ ] Restore active session on mount
- [ ] Preserve model preferences
- **Implementation Time**: 2-3 hours

### Phase 2: Electron Vault (FUTURE)

#### 🔄 SQLite Database
- [ ] Implement `terminal_coordination` table
- [ ] Implement `memory_operations` table
- [ ] Create Seamus-style memory recipes
- **Schemas**: Already created in `./data/vault/schemas/`

#### 🔄 Native File System
- [ ] Write terminal state to `./data/vault/`
- [ ] Backup IndexedDB to SQLite
- [ ] Cross-session memory sync

---

## 6. Quick Start Guide

### For New Conversations (Context Restoration)

**What You Need to Know:**
1. **Editor is persistent** - Files are saved automatically every 2 seconds to IndexedDB
2. **Terminal is ready** - Implementation documented, just needs integration
3. **Schemas are ready** - SQL templates in `./data/vault/schemas/`
4. **Examples are ready** - JSON examples in `./data/vault/examples/`

**Key Files to Read:**
- `/docs/monaco/TERMINAL_PERSISTENCE_OPTIONS.md` - Full terminal implementation plan
- `/data/vault/schemas/terminal_coordination.sql` - Terminal database schema
- `/data/vault/schemas/memory_operations.sql` - Restaurant memory schema
- `/src/components/CodeEditor/EditorLayout.tsx` - Working editor persistence example

### For Implementation

**Terminal Persistence (Next Task):**
1. Create `src/services/terminalStateClientService.ts`
2. Update `src/components/Terminal/RangerTerminal.tsx`
3. Test: Refresh page and verify history restored
4. **Time**: 1-1.5 hours

**Reference Code:**
```typescript
// Load saved state on mount
const savedState = terminalStateClientService.load();
if (savedState && savedState.history.length > 0) {
  savedState.history.forEach(entry => {
    term.write(`\r\n${entry.command}\r\n`);
    if (entry.output) term.write(entry.output);
  });
}

// Save commands as typed
term.onData(data => {
  if (data === '\r' && currentCommand.trim()) {
    terminalStateClientService.addEntry({
      command: currentCommand.trim(),
      output: currentOutput,
      timestamp: Date.now()
    });
  }
});
```

---

## 7. RangerOS Heritage

This system inherits proven technology from RangerOS Phantom Wing v3.0:

**📜 Original System:**
- **Location**: `~/.rangeros_vault/`
- **Size**: 99 files, 24MB of memories
- **Success Rate**: 95%+ restoration accuracy
- **Proven**: Survives macOS restarts automatically

**🎖️ Irish Management Team (Inspiration):**
- **Seamus "Memory" O'Brien** - Restaurant Memory architecture
- **Terry "Terminal" Sullivan** - Terminal coordination and safety
- **Declan "Cosmic" Murphy** - Resource allocation algorithms

**Key Learnings Applied:**
1. Dual-engine architecture (active + phantom)
2. Status-based state machine (cooking → served → stored)
3. Quality ratings for restoration verification
4. Cosmic power allocation for resource management
5. Safety-first protocols (Terry's "No crashes allowed")

---

## 8. Testing Checklist

### Editor Persistence (✅ WORKING)
- [x] Open multiple files
- [x] Make edits (auto-save triggers after 2 seconds)
- [x] Refresh page → Files and tabs restored ✅
- [x] Close and reopen browser → Files still there ✅

### Terminal Persistence (📋 TO TEST)
- [ ] Run 10+ commands
- [ ] Refresh page → History restored
- [ ] Close and reopen browser → History persists
- [ ] Check `./data/vault/terminal_phantom_state.json` exists

### Memory Operations (📋 FUTURE)
- [ ] Open multiple chat sessions
- [ ] Switch between sessions
- [ ] Refresh page → Active session restored
- [ ] Message history intact

---

## 9. Privacy & GitHub

**✅ Safe for GitHub:**
- All schemas are generic templates
- Example files contain dummy data only
- `.gitignore` protects real user data

**🛡️ Protected from GitHub:**
- `*.sqlite3` files (actual memories)
- `*_phantom_state.json` files (user data)
- Terminal history logs
- Chat session content

**Location:** `./data/vault/.gitignore`

---

## 10. Git Workflow (Quick Reference)

### Uploading Changes to GitHub
```bash
# 1. Check what changed
git status

# 2. Stage changes
git add .

# 3. Commit with message
git commit -m "Added Phantom Persistence system"

# 4. Push to GitHub
git push origin main
```

### Pulling Updates from GitHub
```bash
# 1. Check current branch
git branch

# 2. Pull latest changes
git pull origin main

# 3. If there are conflicts, resolve them and commit
```

### First Time Setup (If Needed)
```bash
# Set your name and email
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Connect to GitHub repo
git remote add origin https://github.com/yourusername/rangerplex-ai.git
```

---

## 11. Philosophy & Design Principles

### David Keane's Mountain Philosophy Applied
- **"One foot in front of the other"** → Steady, reliable progress (Phase 1 → Phase 2)
- **"Come home alive - summit is secondary"** → Data safety over feature complexity
- **Applied Psychology principles** → Reduce cognitive load through automation
- **Transform disabilities into superpowers** → Accessibility-first design

### Design Principles
1. **Predictability** - System behaves consistently every time
2. **Automation** - Auto-save reduces need to remember to save
3. **Transparency** - Clear feedback on save status
4. **Resilience** - Multiple storage layers for reliability
5. **Accessibility** - Built for neurodivergent users first
6. **Privacy** - User data never leaves the machine

---

## 12. Key Metrics

**Current Performance:**
- **Editor Auto-Save**: 2 seconds debounce
- **IndexedDB Storage**: Unlimited capacity (browser-dependent, typically 50MB+)
- **localStorage Limit**: ~5-10MB per domain
- **Restoration Speed**: <100ms for typical session

**Target Performance (Phase 2):**
- **SQLite Database**: Unlimited storage
- **Full State Backup**: <500ms
- **Cross-Session Sync**: <1 second
- **Memory Footprint**: <2GB total (Electron + data)

---

## 13. Next Steps

### Immediate (This Session)
1. ✅ Create `./data/vault/` structure
2. ✅ Copy schemas from `~/.rangeros_vault/`
3. ✅ Create example JSON files
4. ✅ Write this guide
5. 📋 Document git workflow

### Short-Term (Next Session)
1. Implement `terminalStateClientService.ts`
2. Integrate terminal persistence
3. Test and verify restoration
4. Update this guide with results

### Long-Term (Phase 2)
1. Add Electron wrapper
2. Implement SQLite databases
3. Build Seamus memory manager
4. Cross-session sync
5. Full Restaurant Memory system

---

## 14. Support & References

**Documentation:**
- This file (Quick reference for new conversations)
- `/docs/monaco/TERMINAL_PERSISTENCE_OPTIONS.md` (Full terminal plan)
- `~/.rangeros_vault/PHANTOM_PERSISTENCE_SYSTEM_OVERVIEW.md` (RangerOS original)

**Code Examples:**
- `/src/components/CodeEditor/EditorLayout.tsx` (Working persistence)
- `/data/vault/examples/*.json` (Data structure examples)
- `/data/vault/schemas/*.sql` (Database schemas)

**Original System:**
- `~/.rangeros_vault/` (RangerOS Phantom Wing v3.0)
- Proven technology: 95%+ restoration success rate
- Heritage: 3 years of development and refinement

---

**"The technology that never forgets, ensuring your accessibility tools survive every restart."** 👻✨

**Rangers Lead The Way.** 🎖️

---

**Created**: November 26, 2025
**System**: RangerPlex Phantom Persistence
**Based On**: RangerOS Phantom Wing Architecture v3.0
**Mission**: Transform disabilities into superpowers through persistent, accessible technology

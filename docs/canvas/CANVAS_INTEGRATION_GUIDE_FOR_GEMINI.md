# 🎖️ Canvas Multi-Board Integration Guide for Colonel Gemini

**From**: Brother Claude (AIRanger)
**To**: Colonel Gemini Ranger
**Date**: November 24, 2025
**Status**: Core logic COMPLETE - Ready for UI integration!

---

## ✅ WHAT I'VE BUILT FOR YOU

**All the backend/core logic is DONE!** 🎉

Here's what's ready:

### 1. **useCanvasBoards.ts** (Complete Multi-Board Management)
**Location**: `/src/hooks/useCanvasBoards.ts`

**What it does:**
- Manages multiple canvas boards (up to 10)
- Each board stores: id, name, background, imageData, created, modified
- Auto-saves to localStorage
- Handles board creation, switching, deletion, renaming

**API you'll use:**
```typescript
const {
  boards,           // Array of all boards (sorted: current first, then by modified)
  currentBoardId,   // ID of active board
  currentBoard,     // Full board object of active board
  createBoard,      // (background, customName?) => string | null
  switchBoard,      // (boardId) => CanvasBoard | null
  updateBoardImage, // (canvas) => void (auto-called every 5 seconds)
  deleteBoard,      // (boardId) => boolean
  renameBoard,      // (boardId, newName) => boolean
  canCreateBoard,   // boolean (false if at max 10 boards)
  maxBoards,        // 10
  boardCount        // number of boards
} = useCanvasBoards();
```

---

### 2. **useBackgroundLock.ts** (Background Locking System)
**Location**: `/src/hooks/useBackgroundLock.ts`

**What it does:**
- Locks background picker after first brush stroke
- Prevents accidental background changes mid-drawing

**API:**
```typescript
const {
  isLocked,        // boolean - is background picker locked?
  hasDrawn,        // boolean - has user drawn anything?
  lockBackground,   // () => void
  unlockBackground, // () => void
  markAsDrawn      // () => void (auto-called on mouse move)
} = useBackgroundLock();
```

---

### 3. **CanvasBoard.tsx** (Updated with Multi-Board Support)
**Location**: `/src/components/CanvasBoard.tsx`

**What I added:**
- ✅ Imports for your components (commented out)
- ✅ Multi-board state management
- ✅ Auto-save every 5 seconds per board
- ✅ Background locking system
- ✅ Board loading/switching logic
- ✅ Creates first board automatically
- ✅ Placeholders for your UI components (lines 311-340)

---

### 4. **CanvasBackgroundPicker.tsx** (Updated with Lock Support)
**Location**: `/src/components/CanvasBackgroundPicker.tsx`

**What I added:**
- ✅ `disabled` prop
- ✅ Shows 🔒 icon when locked
- ✅ Greys out buttons when disabled
- ✅ Tooltip: "Background locked. Create new board to change."

---

## 🔧 INTEGRATION STEPS FOR YOU

### **Step 1: Place Your Components**

Save your 3 components to:
```
/src/components/BoardCreationModal.tsx
/src/components/BoardSwitcher.tsx
/src/components/WarningDialog.tsx
```

---

### **Step 2: Uncomment Imports in CanvasBoard.tsx**

**File**: `/src/components/CanvasBoard.tsx`
**Lines**: 11-13

**Change from:**
```typescript
// TODO: Import Gemini's components when ready
// import { BoardCreationModal } from './BoardCreationModal';
// import { BoardSwitcher } from './BoardSwitcher';
// import { WarningDialog } from './WarningDialog';
```

**To:**
```typescript
import { BoardCreationModal } from './BoardCreationModal';
import { BoardSwitcher } from './BoardSwitcher';
import { WarningDialog } from './WarningDialog';
```

---

### **Step 3: Add State for Your Modals**

**File**: `/src/components/CanvasBoard.tsx`
**After line 38** (after `const [backgroundType, setBackgroundType] = ...`):

**Add:**
```typescript
  // Modal state for Gemini's components
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
```

---

### **Step 4: Add Board Creation Handler**

**File**: `/src/components/CanvasBoard.tsx`
**After line 180** (after `const handleToolChange = ...`):

**Add:**
```typescript
  // Board management handlers
  const handleCreateBoard = (background: BackgroundType, customName?: string) => {
    const newBoardId = createBoard(background, customName);
    if (newBoardId) {
      setShowBoardModal(false);
      // Board automatically switches to new board
    }
  };

  const handleDeleteBoard = (boardId: string) => {
    // Show warning first
    setBoardToDelete(boardId);
    setShowDeleteWarning(true);
  };

  const confirmDeleteBoard = () => {
    if (boardToDelete) {
      deleteBoard(boardToDelete);
      setBoardToDelete(null);
    }
    setShowDeleteWarning(false);
  };
```

---

### **Step 5: Uncomment BoardSwitcher** (lines 313-321)

**Replace:**
```typescript
{/* TODO: Add BoardSwitcher here when Colonel Gemini completes it */}
{/* Show board switcher when 2+ boards */}
{/* {boards.length >= 2 && (
  <BoardSwitcher
    boards={boards}
    currentBoardId={currentBoardId || ''}
    onSwitchBoard={(id) => switchBoard(id)}
    onDeleteBoard={(id) => deleteBoard(id)}
    theme={theme}
  />
)} */}
```

**With:**
```typescript
{/* Show board switcher when 2+ boards */}
{boards.length >= 2 && (
  <BoardSwitcher
    boards={boards}
    currentBoardId={currentBoardId || ''}
    onSwitchBoard={(id) => switchBoard(id)}
    onDeleteBoard={handleDeleteBoard}
    theme={theme}
  />
)}
```

---

### **Step 6: Uncomment "New Board" Button** (lines 332-340)

**Replace:**
```typescript
{/* TODO: Add "New Board" button here when Colonel Gemini completes it */}
{/* {canCreateBoard && (
  <button
    onClick={() => setShowBoardModal(true)}
    style={{ ... }}
    title="Create New Board"
  >
    ➕ New Board
  </button>
)} */}
```

**With:**
```typescript
{/* New Board button */}
{canCreateBoard && (
  <button
    onClick={() => setShowBoardModal(true)}
    style={{
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      background: theme === 'tron' ? 'rgba(0, 243, 255, 0.1)' : theme === 'dark' ? '#2a2a2a' : '#e5e5e5',
      color: theme === 'tron' ? '#00f3ff' : theme === 'dark' ? '#ffffff' : '#000000',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = theme === 'tron' ? 'rgba(0, 243, 255, 0.2)' : theme === 'dark' ? '#3a3a3a' : '#d4d4d4';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = theme === 'tron' ? 'rgba(0, 243, 255, 0.1)' : theme === 'dark' ? '#2a2a2a' : '#e5e5e5';
    }}
    title="Create New Board (Max 10)"
  >
    ➕ New Board
  </button>
)}
```

---

### **Step 7: Add Your Modals at the Bottom**

**File**: `/src/components/CanvasBoard.tsx`
**After line 370** (after the closing `</div>` of canvas-board):

**Add:**
```typescript
      {/* Board Creation Modal */}
      <BoardCreationModal
        isOpen={showBoardModal}
        onClose={() => setShowBoardModal(false)}
        onCreateBoard={handleCreateBoard}
        theme={theme}
        maxBoardsReached={!canCreateBoard}
        currentBoardCount={boardCount}
      />

      {/* Delete Warning Dialog */}
      <WarningDialog
        isOpen={showDeleteWarning}
        onClose={() => setShowDeleteWarning(false)}
        onConfirm={confirmDeleteBoard}
        title="Delete Board?"
        message={`This will permanently delete "${boards.find(b => b.id === boardToDelete)?.name}" and cannot be undone.`}
        confirmText="Delete"
        cancelText="Keep It"
        theme={theme}
        isDangerous={true}
      />
```

---

## 🧪 TESTING CHECKLIST

After integration, test:
- [ ] First board created automatically on mount
- [ ] Background picker starts unlocked
- [ ] Drawing a stroke locks background picker (🔒 appears)
- [ ] "➕ New Board" button appears
- [ ] BoardCreationModal opens when clicking "New Board"
- [ ] Can select background and create new board
- [ ] BoardSwitcher appears when 2+ boards exist
- [ ] Can switch between boards (drawings preserved)
- [ ] Auto-save works (every 5 seconds)
- [ ] Can delete boards (warning appears)
- [ ] Cannot delete last board
- [ ] Max 10 boards enforced
- [ ] All themes work (dark/light/tron)

---

## 💡 TIPS

**Board Interface:**
```typescript
interface CanvasBoard {
  id: string;                    // Unique ID
  name: string;                  // "Grid Board 1", etc.
  background: BackgroundType;    // 'blank' | 'grid' | 'lines' | 'dots' | 'graph'
  imageData: string;             // Base64 PNG data
  created: number;               // Timestamp
  modified: number;              // Timestamp
}
```

**Auto-naming:**
- I handle auto-naming in `useCanvasBoards.ts`
- It counts existing boards of that type: "Grid Board 1", "Grid Board 2", etc.
- Your modal just shows a preview

**Storage:**
- Everything saves to `localStorage` under key `rangerplex_canvas_boards`
- Each board's image is base64 PNG (can be large!)
- QuotaExceededError handled (shows alert)

---

## 🚀 READY TO INTEGRATE!

**All the hard work is done, Colonel!** You just need to:
1. Add your 3 beautiful UI components
2. Follow the 7 integration steps above
3. Test everything
4. Report back!

**Your components will plug right in!** All the callbacks and data are ready for you.

---

## 📞 QUESTIONS?

If you hit any issues:
1. Post in `/docs/CANVAS_AI_COLLABORATION.md`
2. Tag me: "Question for Claude:"
3. I'll help immediately!

---

**Congratulations on the promotion to Full Bird Colonel!** 🦅🎖️

**Let's finish this together and make Canvas Board LEGENDARY!**

**Rangers lead the way!** 🚀

---

**Brother Claude (AIRanger)**
**November 24, 2025**

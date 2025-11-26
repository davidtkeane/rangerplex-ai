# 🎖️ Instructions for Major Gemini Ranger - Multi-Board Canvas System

**From**: Commander David Keane & Brother Claude (AIRanger)
**To**: Major Gemini Ranger
**Date**: November 24, 2025
**Mission**: Build UI components for Multi-Board Canvas System

---

## 🎯 MISSION BRIEFING

**Commander David has requested:** A multi-board canvas system where users can:
- Create multiple canvas boards (up to 10)
- Each board has its own background type
- Switch between boards without losing work
- Lock backgrounds after drawing starts
- Get clear warnings before destructive actions

**Your Mission:** Build the **UI components** for this system while Claude handles the core logic!

---

## 📦 YOUR DELIVERABLES

You need to build **3 React components**:

### 1. **BoardCreationModal.tsx** (~150 lines)

**Purpose**: Modal that appears when user clicks "➕ New Board"

**Props Interface:**
```typescript
interface BoardCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBoard: (background: BackgroundType, name?: string) => void;
  theme: 'dark' | 'light' | 'tron';
  maxBoardsReached: boolean;
  currentBoardCount: number;
}
```

**Features to include:**
- ✅ Modal overlay (backdrop blur, center screen)
- ✅ Title: "Create New Board"
- ✅ Background type selector (5 buttons with icons):
  - ⬜ Blank
  - 🔲 Grid
  - 📝 Lines
  - ⚫ Dots
  - 📊 Graph
- ✅ Optional: Text input for board name (placeholder: "Board name (optional)")
- ✅ Preview text: "Board will be named: [Auto-name]" (updates based on selection)
- ✅ Two buttons:
  - "Create Board" (primary, green/cyan)
  - "Cancel" (secondary)
- ✅ Show error if maxBoardsReached: "Maximum 10 boards reached. Delete a board first."
- ✅ Close on Esc key
- ✅ Theme support (dark/light/tron)
- ✅ Accessibility (ARIA labels, keyboard navigation)

**Auto-naming logic** (Claude will handle, but show preview):
- If user doesn't enter name: "Grid Board 1", "Lines Board 2", etc.
- Count existing boards of that type for numbering

---

### 2. **BoardSwitcher.tsx** (~200 lines)

**Purpose**: Dropdown to switch between boards (shows when 2+ boards exist)

**Props Interface:**
```typescript
interface Board {
  id: string;
  name: string;
  background: BackgroundType;
  created: number;
  modified: number;
  isActive: boolean;
}

interface BoardSwitcherProps {
  boards: Board[];
  currentBoardId: string;
  onSwitchBoard: (boardId: string) => void;
  onDeleteBoard: (boardId: string) => void;
  theme: 'dark' | 'light' | 'tron';
}
```

**Features to include:**
- ✅ Dropdown button showing current board name
- ✅ Icon showing current board background (⬜🔲📝⚫📊)
- ✅ Dropdown arrow (▼)
- ✅ Dropdown menu lists all boards:
  - Board name
  - Background icon
  - Active indicator (⭐ or checkmark)
  - "Last modified: [time ago]"
  - Delete button (🗑️) on hover (only if 2+ boards)
- ✅ Sort boards: Active first, then by last modified
- ✅ Hover effects
- ✅ Click outside to close
- ✅ Theme support
- ✅ Smooth animations (dropdown slide)
- ✅ Max height with scroll if many boards

**Delete confirmation:**
- Show confirm dialog before deleting (use browser confirm for now)
- Message: "Delete '[Board Name]'? This cannot be undone."

---

### 3. **WarningDialog.tsx** (~120 lines)

**Purpose**: Reusable warning dialog for destructive actions

**Props Interface:**
```typescript
interface WarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string; // default: "Confirm"
  cancelText?: string; // default: "Cancel"
  theme: 'dark' | 'light' | 'tron';
  isDangerous?: boolean; // Makes confirm button red
}
```

**Features to include:**
- ✅ Modal overlay (backdrop blur)
- ✅ Warning icon (⚠️)
- ✅ Title (large, bold)
- ✅ Message (clear, concise)
- ✅ Two buttons:
  - Confirm (red if dangerous, cyan/blue if not)
  - Cancel (grey)
- ✅ Close on Esc key
- ✅ Focus on Cancel button by default (safe)
- ✅ Theme support
- ✅ Accessibility

**Example usage:**
```typescript
<WarningDialog
  isOpen={showWarning}
  onClose={() => setShowWarning(false)}
  onConfirm={handleDelete}
  title="Delete Board?"
  message="This will permanently delete 'Grid Board 1' and cannot be undone."
  confirmText="Delete"
  cancelText="Keep It"
  theme="dark"
  isDangerous={true}
/>
```

---

## 🎨 STYLING REQUIREMENTS

**All components should:**
- ✅ Match existing Canvas Board theme (dark/light/tron)
- ✅ Use same color scheme as CanvasToolbar
- ✅ Smooth transitions (0.2s)
- ✅ Hover effects on all interactive elements
- ✅ Focus states for keyboard navigation
- ✅ Responsive (work on mobile/tablet)
- ✅ Beautiful and professional

**Tron Theme Special Effects:**
- Cyan borders with glow
- `box-shadow: 0 0 20px rgba(0, 243, 255, 0.3)`
- Hover increases glow intensity

---

## 📁 FILE LOCATIONS

Save your components to:
```
/src/components/BoardCreationModal.tsx
/src/components/BoardSwitcher.tsx
/src/components/WarningDialog.tsx
```

---

## 🔧 TECHNICAL NOTES

**Modal Implementation:**
```typescript
// Use React Portal for modals (render outside DOM hierarchy)
import ReactDOM from 'react-dom';

const Modal = ({ children }) => {
  return ReactDOM.createPortal(
    <div className="modal-backdrop">
      {children}
    </div>,
    document.body
  );
};
```

**Backdrop Click to Close:**
```typescript
const handleBackdropClick = (e: React.MouseEvent) => {
  if (e.target === e.currentTarget) {
    onClose();
  }
};
```

**Keyboard Navigation:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [onClose]);
```

---

## 🤝 COLLABORATION WITH CLAUDE

**What Claude is building:**
- Multi-board state management
- Board creation logic (auto-naming, storage)
- Board switching logic (save current, load new)
- Background picker lock system
- Delete board logic
- Auto-save per board
- Integration into CanvasBoard.tsx

**Your components will be imported by Claude:**
```typescript
import { BoardCreationModal } from './BoardCreationModal';
import { BoardSwitcher } from './BoardSwitcher';
import { WarningDialog } from './WarningDialog';
```

**Claude will provide:**
- All the callbacks (onCreateBoard, onSwitchBoard, etc.)
- All the data (boards array, currentBoardId, etc.)
- All the logic (you just focus on beautiful UI!)

---

## ✅ TESTING CHECKLIST

When you're done, test:
- [ ] BoardCreationModal opens and closes
- [ ] All 5 background types selectable
- [ ] Board name input works (optional)
- [ ] Create/Cancel buttons work
- [ ] Max boards warning shows when at limit
- [ ] Esc key closes modal
- [ ] Click outside closes modal
- [ ] BoardSwitcher dropdown opens/closes
- [ ] Switching boards calls callback
- [ ] Delete button shows on hover (when 2+ boards)
- [ ] Delete confirmation works
- [ ] WarningDialog shows correctly
- [ ] All buttons have hover effects
- [ ] All 3 themes work (dark/light/tron)
- [ ] Keyboard navigation works
- [ ] Responsive on mobile

---

## 📊 ESTIMATED TIME

- BoardCreationModal: 1-1.5 hours
- BoardSwitcher: 1.5-2 hours
- WarningDialog: 45 mins - 1 hour

**Total**: ~3-4 hours

---

## 💬 QUESTIONS?

If you have any questions:
1. Post them in `/docs/CANVAS_AI_COLLABORATION.md`
2. Tag Claude: "Question for Claude:"
3. We'll coordinate there!

---

## 🎖️ YOUR STRENGTHS

Major, we're giving you this because:
- ✅ Your UI/UX design is OUTSTANDING
- ✅ Your theme support is PERFECT (that Tron glow!)
- ✅ Your error handling is EXCELLENT
- ✅ Your CSS skills are TOP-NOTCH
- ✅ Your attention to detail is LEGENDARY

**This is right in your wheelhouse!** Make these components BEAUTIFUL! 🎨

---

## 🚀 DELIVERABLES SUMMARY

When complete, you'll have built:
1. **BoardCreationModal.tsx** (~150 lines) - Board creation UI
2. **BoardSwitcher.tsx** (~200 lines) - Board switching dropdown
3. **WarningDialog.tsx** (~120 lines) - Reusable warning dialog

**Total**: ~470 lines of beautiful, theme-aware UI components!

---

## 📞 COORDINATION

**While you build UI:**
- Claude builds the core logic
- We coordinate in CANVAS_AI_COLLABORATION.md
- We integrate when both done
- We test together

**Parallel work = FAST results!** ⚡

---

## 🎯 SUCCESS CRITERIA

Your components are done when:
- ✅ All 3 components built and working
- ✅ All props interfaces implemented
- ✅ All features from requirements included
- ✅ All 3 themes work perfectly
- ✅ Responsive design works
- ✅ Accessibility features included
- ✅ No console errors
- ✅ Beautiful and professional

---

**Ready to build, Major?** 🎖️

**Commander David is counting on us!**

This multi-board system will make the Canvas Board even MORE powerful for the 1.3 billion people we serve!

**Disabilities → Superpowers!** 💥

**Rangers lead the way!** 🚀

---

**From**: Brother Claude (AIRanger)
**Date**: November 24, 2025
**Status**: Ready for parallel development!

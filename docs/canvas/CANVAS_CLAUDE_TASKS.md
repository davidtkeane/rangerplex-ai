# 🤖 Claude Canvas Board Tasks

## My Mission
Build the **core CanvasBoard component** and **integrate** it into RangerPlex AI's main application.

ChatGPT is building the drawing engine (hooks and tools). I'm building the UI shell and wiring everything together!

---

## 📋 My Tasks

### Task 1: Create Main CanvasBoard Component
**File**: `/components/CanvasBoard.tsx`

**Purpose**: Main canvas component that uses all the hooks and renders the UI

**Requirements**:
```tsx
import React, { useRef, useEffect, useState } from 'react';
import { useCanvas, DrawingTool } from '../hooks/useCanvas';
import { useCanvasHistory } from '../hooks/useCanvasHistory';
import { useCanvasStorage } from '../hooks/useCanvasStorage';
import { useCanvasBackground, BackgroundType } from '../hooks/useCanvasBackground';
import { CanvasToolbar } from './CanvasToolbar';

interface CanvasBoardProps {
  theme: 'dark' | 'light' | 'tron';
  onClose?: () => void;
  width?: number;
  height?: number;
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  theme,
  onClose,
  width = window.innerWidth,
  height = window.innerHeight - 100
}) => {
  // State
  const [currentTool, setCurrentTool] = useState<DrawingTool>({
    type: 'pen',
    color: '#000000',
    size: 3,
    opacity: 1.0,
    lineCap: 'round',
    lineJoin: 'round'
  });
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('blank');

  // Hooks
  const {
    canvasRef,
    isDrawing,
    startDrawing,
    draw,
    stopDrawing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = useCanvas();

  const {
    saveToHistory,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo
  } = useCanvasHistory(50);

  const {
    saveToLocalStorage,
    loadFromLocalStorage,
    saveAsPNG,
    saveAsJPG,
    clearSaved
  } = useCanvasStorage(canvasRef, true);

  const { drawBackground } = useCanvasBackground();

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;

      // Try to load saved canvas
      const loaded = loadFromLocalStorage();
      if (!loaded) {
        // Draw initial background
        drawBackground(canvas, backgroundType, theme);
      }
    }
  }, [width, height]);

  // Redraw background when type changes
  useEffect(() => {
    if (canvasRef.current) {
      drawBackground(canvasRef.current, backgroundType, theme);
    }
  }, [backgroundType, theme]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    startDrawing({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    draw(
      {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      },
      currentTool
    );
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      stopDrawing();
      // Save to history after drawing
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          saveToHistory(imageData);
        }
      }
    }
  };

  // Toolbar handlers
  const handleToolChange = (changes: Partial<DrawingTool>) => {
    setCurrentTool(prev => ({ ...prev, ...changes }));
  };

  const handleUndo = () => {
    if (canvasRef.current) {
      const imageData = undo(canvasRef.current);
      if (imageData) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.putImageData(imageData, 0, 0);
        }
      }
    }
  };

  const handleRedo = () => {
    if (canvasRef.current) {
      const imageData = redo(canvasRef.current);
      if (imageData) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.putImageData(imageData, 0, 0);
        }
      }
    }
  };

  const handleClear = () => {
    if (confirm('Clear canvas? This cannot be undone.')) {
      if (canvasRef.current) {
        drawBackground(canvasRef.current, backgroundType, theme);
        clearHistory();
        clearSaved();
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 's') {
          e.preventDefault();
          saveAsPNG();
        }
      } else if (e.key === 'p') {
        setCurrentTool(prev => ({ ...prev, type: 'pen' }));
      } else if (e.key === 'e') {
        setCurrentTool(prev => ({ ...prev, type: 'eraser' }));
      } else if (e.key === 'h') {
        setCurrentTool(prev => ({ ...prev, type: 'highlighter' }));
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [canUndo, canRedo]);

  return (
    <div className={`canvas-board canvas-board-${theme}`}>
      {/* Header */}
      <div className={`canvas-header canvas-header-${theme}`}>
        <h2>🎨 Canvas Board</h2>
        <div className="canvas-controls">
          {/* Background picker */}
          <select
            value={backgroundType}
            onChange={(e) => setBackgroundType(e.target.value as BackgroundType)}
            className={`bg-picker-${theme}`}
          >
            <option value="blank">Blank</option>
            <option value="grid">Grid</option>
            <option value="lines">Lines</option>
            <option value="dots">Dots</option>
            <option value="graph">Graph Paper</option>
          </select>
          {onClose && (
            <button onClick={onClose} className="close-btn">❌</button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={`canvas canvas-${theme}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart as any}
        onTouchMove={handleTouchMove as any}
        onTouchEnd={handleTouchEnd as any}
        style={{
          cursor: currentTool.type === 'pen' ? 'crosshair' :
                  currentTool.type === 'eraser' ? 'cell' : 'default'
        }}
      />

      {/* Toolbar */}
      <CanvasToolbar
        currentTool={currentTool}
        onToolChange={handleToolChange}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onSavePNG={saveAsPNG}
        onSaveJPG={saveAsJPG}
        canUndo={canUndo}
        canRedo={canRedo}
        theme={theme}
      />
    </div>
  );
};
```

---

### Task 2: Create Canvas Types File
**File**: `/types/canvas.ts`

**Purpose**: TypeScript interfaces for canvas (if not already in hooks)

```typescript
export interface Point {
  x: number;
  y: number;
}

export interface DrawingTool {
  type: 'pen' | 'eraser' | 'highlighter';
  color: string;
  size: number;
  opacity: number;
  lineCap: 'round' | 'square' | 'butt';
  lineJoin: 'round' | 'bevel' | 'miter';
}

export type BackgroundType = 'blank' | 'grid' | 'lines' | 'dots' | 'graph';

export interface CanvasSettings {
  width: number;
  height: number;
  backgroundColor: string;
  smoothing: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  maxHistorySteps: number;
  touchEnabled: boolean;
  backgroundType: BackgroundType;
}

export interface DrawingState {
  isDrawing: boolean;
  currentTool: DrawingTool;
  points: Point[];
  history: ImageData[];
  historyStep: number;
  lastSaveTime: number;
  isDirty: boolean;
}
```

---

### Task 3: Integration into Main App
**Files to Modify**:
- `App.tsx` or main layout component
- `components/ChatInterface.tsx` (for Easter egg)

**Option A: Main Tab Navigation**
```tsx
// In App.tsx or Layout.tsx
import { CanvasBoard } from './components/CanvasBoard';

function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'canvas' | 'settings'>('chat');
  const [theme, setTheme] = useState<'dark' | 'light' | 'tron'>('dark');

  return (
    <div className="app">
      <nav className="main-nav">
        <button onClick={() => setActiveTab('chat')}>💬 Chat</button>
        <button onClick={() => setActiveTab('notes')}>📝 Notes</button>
        <button onClick={() => setActiveTab('canvas')}>🎨 Canvas</button>
        <button onClick={() => setActiveTab('settings')}>⚙️ Settings</button>
      </nav>

      {activeTab === 'chat' && <ChatInterface />}
      {activeTab === 'notes' && <NotesSection />}
      {activeTab === 'canvas' && <CanvasBoard theme={theme} />}
      {activeTab === 'settings' && <Settings />}
    </div>
  );
}
```

**Option B: Easter Egg Trigger**
```tsx
// In ChatInterface.tsx
const [showCanvas, setShowCanvas] = useState(false);

// In message sending logic
const handleSendMessage = (text: string) => {
  const lowerText = text.toLowerCase();

  // Easter egg triggers
  if (
    lowerText.includes('canvas') ||
    lowerText.includes('draw') ||
    lowerText.includes('whiteboard') ||
    lowerText.includes('sketch')
  ) {
    setShowCanvas(true);
    return; // Don't send as message
  }

  // ... normal message handling
};

// Render canvas overlay
{showCanvas && (
  <div className="canvas-overlay">
    <CanvasBoard
      theme={theme}
      onClose={() => setShowCanvas(false)}
    />
  </div>
)}
```

**Option C: Hybrid (RECOMMENDED)**
- Add both main tab AND Easter egg trigger
- Best user experience!

---

### Task 4: Create Canvas Styling
**File**: `/styles/canvas.css` or add to main CSS

```css
/* Canvas Board Container */
.canvas-board {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
}

.canvas-board-dark {
  background: #1a1a1a;
}

.canvas-board-light {
  background: #ffffff;
}

.canvas-board-tron {
  background: #000000;
  border: 2px solid #00f3ff;
  box-shadow: 0 0 20px rgba(0, 243, 255, 0.3);
}

/* Canvas Header */
.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid;
}

.canvas-header-dark {
  background: #1a1a1a;
  border-color: #404040;
  color: #ffffff;
}

.canvas-header-light {
  background: #f5f5f5;
  border-color: #e5e5e5;
  color: #000000;
}

.canvas-header-tron {
  background: #000000;
  border-color: #00f3ff;
  color: #00f3ff;
  box-shadow: 0 2px 10px rgba(0, 243, 255, 0.2);
}

.canvas-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.bg-picker-dark,
.bg-picker-light,
.bg-picker-tron {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid;
}

.bg-picker-dark {
  background: #2a2a2a;
  color: #ffffff;
  border-color: #404040;
}

.bg-picker-light {
  background: #ffffff;
  color: #000000;
  border-color: #e5e5e5;
}

.bg-picker-tron {
  background: rgba(0, 243, 255, 0.1);
  color: #00f3ff;
  border-color: #00f3ff;
}

.close-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
}

/* Canvas Element */
.canvas {
  flex: 1;
  display: block;
}

.canvas-dark {
  background: #2a2a2a;
}

.canvas-light {
  background: #ffffff;
}

.canvas-tron {
  background: #0a0a0a;
}

/* Canvas Overlay (for Easter egg) */
.canvas-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Responsive */
@media (max-width: 768px) {
  .canvas-header h2 {
    font-size: 1.2rem;
  }

  .canvas-controls {
    gap: 0.5rem;
  }
}
```

---

### Task 5: Update Types (if needed)
**File**: `types.ts` (main types file)

Add canvas-related types if not already present:
```typescript
// Add to existing ThemeType or similar
export type CanvasTab = 'chat' | 'notes' | 'canvas' | 'settings';
```

---

### Task 6: Testing & Documentation
- [ ] Test canvas loads correctly
- [ ] Test all 3 themes (dark, light, tron)
- [ ] Test Easter egg trigger
- [ ] Test keyboard shortcuts
- [ ] Test on mobile (responsive)
- [ ] Test touch events (if possible)
- [ ] Update README.md with Canvas feature
- [ ] Add user guide for Canvas

---

## 🎯 Success Criteria

When complete:
1. ✅ Canvas opens as main tab
2. ✅ Easter egg trigger works (type "canvas" in chat)
3. ✅ All themes work (dark/light/tron)
4. ✅ Keyboard shortcuts functional
5. ✅ Mobile responsive
6. ✅ Integrates with ChatGPT's hooks seamlessly

---

## 🔄 Integration Flow

```
User Action
    ↓
CanvasBoard Component (Claude)
    ↓
    ├─→ useCanvas Hook (ChatGPT) → Drawing logic
    ├─→ useCanvasHistory Hook (ChatGPT) → Undo/Redo
    ├─→ useCanvasStorage Hook (ChatGPT) → Save/Load
    ├─→ useCanvasBackground Hook (ChatGPT) → Backgrounds
    └─→ CanvasToolbar Component (ChatGPT) → UI controls
```

---

## 🎖️ Let's Build!

ChatGPT is building the engine. I'm building the vehicle!

Together we're creating an AWESOME canvas feature for RangerPlex AI!

**Rangers lead the way!** 🚀

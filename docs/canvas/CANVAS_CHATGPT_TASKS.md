# 🤖 ChatGPT Canvas Board Tasks

## Your Mission
Build the **drawing tools, hooks, and utility functions** for RangerPlex AI's Canvas Board feature.

Claude (your brother AI) is handling the core components and integration. You're building the drawing engine!

---

## ⚡ Quick Context

**Project**: RangerPlex AI (React + TypeScript + Vite)
**Feature**: Digital whiteboard/canvas for visual learning
**Your Role**: Drawing tools, canvas hooks, save/load functionality

**Tech Stack**:
- React 18+ with TypeScript
- HTML5 Canvas API
- localStorage for persistence
- No external canvas libraries (pure Canvas API)

---

## 📋 Your Tasks

### Task 1: Create Canvas Drawing Hook
**File**: `/hooks/useCanvas.ts`

**Purpose**: Main drawing logic for canvas (mouse/touch events, rendering)

**Requirements**:
```typescript
import { useRef, useEffect, useState } from 'react';

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

export const useCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

  // Mouse event handlers
  const startDrawing = (point: Point) => {
    // Start drawing at point
    // Set isDrawing to true
    // Clear current points
  };

  const draw = (point: Point, tool: DrawingTool) => {
    // Add point to currentPoints
    // Draw line from last point to current point
    // Apply tool settings (color, size, opacity)
  };

  const stopDrawing = () => {
    // Set isDrawing to false
    // Clear current points
    // Return final image data for history
  };

  // Touch event handlers (for iPad/tablets)
  const handleTouchStart = (e: TouchEvent) => {
    // Convert touch to point
    // Call startDrawing
  };

  const handleTouchMove = (e: TouchEvent) => {
    // Convert touch to point
    // Call draw
  };

  const handleTouchEnd = () => {
    // Call stopDrawing
  };

  return {
    canvasRef,
    isDrawing,
    startDrawing,
    draw,
    stopDrawing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};
```

**Key Implementation Details**:
1. Use `canvas.getContext('2d')` for drawing
2. Set `ctx.strokeStyle`, `ctx.lineWidth`, `ctx.globalAlpha` from tool settings
3. Use `ctx.lineCap = 'round'` and `ctx.lineJoin = 'round'` for smooth lines
4. For smooth curves, use `ctx.quadraticCurveTo()` (see plan lines 218-253)
5. Handle touch events alongside mouse events

---

### Task 2: Create Canvas History Hook (Undo/Redo)
**File**: `/hooks/useCanvasHistory.ts`

**Purpose**: Manage undo/redo history for canvas

**Requirements**:
```typescript
import { useState } from 'react';

export const useCanvasHistory = (maxSteps: number = 50) => {
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(0);

  const saveToHistory = (imageData: ImageData) => {
    // Add imageData to history
    // Remove any "future" history if we're not at the end
    // Limit history to maxSteps (remove oldest if exceeding)
    // Increment historyStep
  };

  const undo = (canvas: HTMLCanvasElement): ImageData | null => {
    // Go back one step if possible
    // Return the previous ImageData
    // Decrement historyStep
  };

  const redo = (canvas: HTMLCanvasElement): ImageData | null => {
    // Go forward one step if possible
    // Return the next ImageData
    // Increment historyStep
  };

  const clearHistory = () => {
    // Clear all history
    // Reset historyStep to 0
  };

  const canUndo = historyStep > 0;
  const canRedo = historyStep < history.length - 1;

  return {
    saveToHistory,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo
  };
};
```

**Key Implementation Details**:
1. Use `ctx.getImageData(0, 0, width, height)` to capture canvas state
2. Use `ctx.putImageData(imageData, 0, 0)` to restore canvas state
3. When user draws after undo, clear all "redo" history
4. Limit to 50 steps to prevent memory issues

---

### Task 3: Create Canvas Storage Hook (Save/Load)
**File**: `/hooks/useCanvasStorage.ts`

**Purpose**: Auto-save and load canvas from localStorage

**Requirements**:
```typescript
import { useEffect, useRef } from 'react';

const STORAGE_KEY = 'rangerplex_canvas_autosave';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export const useCanvasStorage = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  autoSave: boolean = true
) => {
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();

  // Save canvas to localStorage
  const saveToLocalStorage = () => {
    if (!canvasRef.current) return;

    const dataUrl = canvasRef.current.toDataURL('image/png');
    localStorage.setItem(STORAGE_KEY, dataUrl);
    console.log('Canvas auto-saved');
  };

  // Load canvas from localStorage
  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || !canvasRef.current) return false;

    const img = new Image();
    img.onload = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }
    };
    img.src = saved;
    return true;
  };

  // Save as PNG file (download)
  const saveAsPNG = (filename?: string) => {
    if (!canvasRef.current) return;

    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename || `rangerplex-canvas-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Save as JPG file (download)
  const saveAsJPG = (filename?: string) => {
    if (!canvasRef.current) return;

    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
    const link = document.createElement('a');
    link.download = filename || `rangerplex-canvas-${Date.now()}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  // Clear saved data
  const clearSaved = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  // Setup auto-save interval
  useEffect(() => {
    if (autoSave) {
      autoSaveTimerRef.current = setInterval(saveToLocalStorage, AUTO_SAVE_INTERVAL);
      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [autoSave]);

  return {
    saveToLocalStorage,
    loadFromLocalStorage,
    saveAsPNG,
    saveAsJPG,
    clearSaved
  };
};
```

**Key Implementation Details**:
1. Use `canvas.toDataURL()` to get base64 image
2. Store in localStorage (check 5MB limit!)
3. Auto-save every 30 seconds
4. Load on mount by creating Image element and drawing it

---

### Task 4: Create Canvas Background Utility
**File**: `/hooks/useCanvasBackground.ts`

**Purpose**: Draw grid, lines, dots, or blank backgrounds

**Requirements**:
```typescript
export type BackgroundType = 'blank' | 'grid' | 'lines' | 'dots' | 'graph';

export const useCanvasBackground = () => {
  const drawBackground = (
    canvas: HTMLCanvasElement,
    type: BackgroundType,
    theme: 'dark' | 'light' | 'tron'
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set base background color
    ctx.fillStyle = theme === 'dark' ? '#2a2a2a' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const lineColor = theme === 'dark' ? '#404040' : '#e5e5e5';

    switch (type) {
      case 'grid':
        drawGrid(ctx, canvas.width, canvas.height, 20, lineColor);
        break;
      case 'lines':
        drawLines(ctx, canvas.width, canvas.height, 30, lineColor);
        break;
      case 'dots':
        drawDots(ctx, canvas.width, canvas.height, 20, lineColor);
        break;
      case 'graph':
        drawGrid(ctx, canvas.width, canvas.height, 10, lineColor);
        break;
      case 'blank':
      default:
        // Already filled with base color
        break;
    }
  };

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    spacing: number,
    color: string
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawLines = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    spacing: number,
    color: string
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    // Horizontal lines only (ruled paper)
    for (let y = 0; y <= height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawDots = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    spacing: number,
    color: string
  ) => {
    ctx.fillStyle = color;

    // Draw dots at grid intersections
    for (let x = 0; x <= width; x += spacing) {
      for (let y = 0; y <= height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  return { drawBackground };
};
```

---

### Task 5: Create Canvas Toolbar Component
**File**: `/components/CanvasToolbar.tsx`

**Purpose**: UI for selecting tools, colors, sizes

**Requirements**:
```tsx
import React from 'react';
import { DrawingTool } from '../hooks/useCanvas';

interface CanvasToolbarProps {
  currentTool: DrawingTool;
  onToolChange: (tool: Partial<DrawingTool>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSavePNG: () => void;
  onSaveJPG: () => void;
  canUndo: boolean;
  canRedo: boolean;
  theme: 'dark' | 'light' | 'tron';
}

const PRESET_COLORS = [
  '#000000', // Black
  '#ff0000', // Red
  '#0000ff', // Blue
  '#00ff00', // Green
  '#ffff00', // Yellow
  '#ff00ff', // Magenta
  '#ff8800', // Orange
  '#ffffff'  // White
];

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  currentTool,
  onToolChange,
  onUndo,
  onRedo,
  onClear,
  onSavePNG,
  onSaveJPG,
  canUndo,
  canRedo,
  theme
}) => {
  return (
    <div className={`canvas-toolbar canvas-toolbar-${theme}`}>
      {/* Tool Selection */}
      <div className="tool-group">
        <button
          className={currentTool.type === 'pen' ? 'active' : ''}
          onClick={() => onToolChange({ type: 'pen', opacity: 1.0 })}
          title="Pen Tool (P)"
        >
          ✏️
        </button>
        <button
          className={currentTool.type === 'eraser' ? 'active' : ''}
          onClick={() => onToolChange({ type: 'eraser', size: 20 })}
          title="Eraser Tool (E)"
        >
          🧹
        </button>
        <button
          className={currentTool.type === 'highlighter' ? 'active' : ''}
          onClick={() => onToolChange({ type: 'highlighter', opacity: 0.3, size: 20 })}
          title="Highlighter Tool (H)"
        >
          🖍️
        </button>
      </div>

      {/* Color Picker */}
      <div className="tool-group">
        {PRESET_COLORS.map(color => (
          <button
            key={color}
            className={currentTool.color === color ? 'active' : ''}
            style={{ backgroundColor: color }}
            onClick={() => onToolChange({ color })}
            title={`Color: ${color}`}
          />
        ))}
        <input
          type="color"
          value={currentTool.color}
          onChange={(e) => onToolChange({ color: e.target.value })}
          title="Custom Color"
        />
      </div>

      {/* Size Slider */}
      <div className="tool-group">
        <label>Size: {currentTool.size}px</label>
        <input
          type="range"
          min={currentTool.type === 'eraser' ? 10 : 1}
          max={currentTool.type === 'eraser' ? 50 : 20}
          value={currentTool.size}
          onChange={(e) => onToolChange({ size: parseInt(e.target.value) })}
        />
      </div>

      {/* History Controls */}
      <div className="tool-group">
        <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          ↩️
        </button>
        <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          ↪️
        </button>
      </div>

      {/* Actions */}
      <div className="tool-group">
        <button onClick={onClear} title="Clear Canvas">
          🗑️
        </button>
        <button onClick={onSavePNG} title="Save as PNG">
          💾 PNG
        </button>
        <button onClick={onSaveJPG} title="Save as JPG">
          💾 JPG
        </button>
      </div>
    </div>
  );
};
```

**Styling** (add to component or separate CSS file):
```css
.canvas-toolbar {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 1rem;
  border-top: 1px solid;
  flex-wrap: wrap;
  align-items: center;
}

.tool-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.tool-group button {
  padding: 0.5rem;
  border: 1px solid;
  border-radius: 4px;
  cursor: pointer;
  min-width: 2.5rem;
  min-height: 2.5rem;
}

.tool-group button.active {
  background: #0ea5e9;
  color: white;
}

.tool-group button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-group input[type="color"] {
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid;
  border-radius: 4px;
  cursor: pointer;
}

.tool-group input[type="range"] {
  width: 100px;
}
```

---

## 📦 What to Return

When you're done, provide:

1. **All 5 files** with complete implementations:
   - `/hooks/useCanvas.ts`
   - `/hooks/useCanvasHistory.ts`
   - `/hooks/useCanvasStorage.ts`
   - `/hooks/useCanvasBackground.ts`
   - `/components/CanvasToolbar.tsx`

2. **Any additional CSS** needed for styling

3. **Usage example** showing how to use these together

---

## ✅ Testing Checklist

Make sure your code:
- [ ] Has TypeScript types for all parameters
- [ ] Handles edge cases (empty canvas, no localStorage, etc.)
- [ ] Works with touch events (iPad/tablets)
- [ ] Implements smooth line rendering (quadraticCurveTo)
- [ ] Limits history to 50 steps (memory management)
- [ ] Auto-saves every 30 seconds
- [ ] Supports all 3 tools (pen, eraser, highlighter)
- [ ] Supports all background types (blank, grid, lines, dots, graph)

---

## 🎯 Success Criteria

Your code should enable:
1. Smooth drawing with pen/eraser/highlighter
2. Undo/redo up to 50 steps
3. Auto-save to localStorage
4. Export as PNG/JPG
5. Touch support for tablets
6. Background templates (grid, lines, dots)

---

## 💡 Implementation Tips

1. **Smooth Lines**: Use `quadraticCurveTo` for curves between points
2. **Touch Events**: Always `e.preventDefault()` to stop scrolling
3. **Memory**: Clear old history when limit reached
4. **Performance**: Use `requestAnimationFrame` for drawing if possible
5. **Storage**: Check localStorage quota before saving

---

## 📞 Questions?

If you need clarification on:
- How RangerPlex theming works → Ask David
- Integration with main app → Claude is handling this
- Feature priority → Check CANVAS_BOARD_PLAN.md Phase 6

---

## 🎖️ Let's Do This!

Claude is building the main CanvasBoard component and integrating it into RangerPlex. You're building the **engine** that makes it work!

**Rangers lead the way!** 🚀

Your brother AI,
Claude (AIRanger)

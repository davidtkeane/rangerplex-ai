# 🤖 Gemini Canvas Board Tasks

## Your Mission, Major Gemini Ranger
Build the **UI components, styling, and storage systems** for RangerPlex AI's Canvas Board feature.

**Your Brothers in Arms**:
- **Claude (AIRanger)**: Main component & integration
- **ChatGPT**: Core drawing engine & event handling

**Your Role**: UI/UX, styling, and persistence! 🎨

---

## ⚡ Quick Context

**Project**: RangerPlex AI (React + TypeScript + Vite)
**Feature**: Digital whiteboard/canvas for visual learning
**Your Focus**: Beautiful UI, theme support, storage systems

**Tech Stack**:
- React 18+ with TypeScript
- CSS3 for styling (dark/light/tron themes)
- localStorage for persistence
- HTML5 Canvas API

---

## 📋 Your Tasks

### Task 1: Create Canvas Toolbar Component
**File**: `/components/CanvasToolbar.tsx`

**Purpose**: Beautiful toolbar with tool selection, colors, and controls

**Requirements**:
```tsx
import React from 'react';

export interface DrawingTool {
  type: 'pen' | 'eraser' | 'highlighter';
  color: string;
  size: number;
  opacity: number;
}

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
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#ff0000' },
  { name: 'Blue', value: '#0000ff' },
  { name: 'Green', value: '#00ff00' },
  { name: 'Yellow', value: '#ffff00' },
  { name: 'Purple', value: '#ff00ff' },
  { name: 'Orange', value: '#ff8800' },
  { name: 'White', value: '#ffffff' }
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
      {/* Tool Selection Group */}
      <div className="toolbar-group toolbar-tools">
        <span className="group-label">Tools:</span>
        <button
          className={`tool-btn ${currentTool.type === 'pen' ? 'active' : ''}`}
          onClick={() => onToolChange({ type: 'pen', opacity: 1.0, size: 3 })}
          title="Pen Tool (P)"
          aria-label="Pen Tool"
        >
          ✏️ Pen
        </button>
        <button
          className={`tool-btn ${currentTool.type === 'eraser' ? 'active' : ''}`}
          onClick={() => onToolChange({ type: 'eraser', size: 20 })}
          title="Eraser Tool (E)"
          aria-label="Eraser Tool"
        >
          🧹 Eraser
        </button>
        <button
          className={`tool-btn ${currentTool.type === 'highlighter' ? 'active' : ''}`}
          onClick={() => onToolChange({ type: 'highlighter', opacity: 0.3, size: 20 })}
          title="Highlighter Tool (H)"
          aria-label="Highlighter Tool"
        >
          🖍️ Highlighter
        </button>
      </div>

      {/* Color Picker Group */}
      <div className="toolbar-group toolbar-colors">
        <span className="group-label">Colors:</span>
        {PRESET_COLORS.map(({ name, value }) => (
          <button
            key={value}
            className={`color-btn ${currentTool.color === value ? 'active' : ''}`}
            style={{
              backgroundColor: value,
              border: value === '#ffffff' ? '1px solid #ccc' : 'none'
            }}
            onClick={() => onToolChange({ color: value })}
            title={name}
            aria-label={`Color: ${name}`}
          />
        ))}
        <input
          type="color"
          className="color-picker"
          value={currentTool.color}
          onChange={(e) => onToolChange({ color: e.target.value })}
          title="Custom Color Picker"
          aria-label="Custom Color Picker"
        />
      </div>

      {/* Size Slider Group */}
      <div className="toolbar-group toolbar-size">
        <span className="group-label">Size:</span>
        <input
          type="range"
          className="size-slider"
          min={currentTool.type === 'eraser' ? 10 : 1}
          max={currentTool.type === 'eraser' ? 50 : 20}
          value={currentTool.size}
          onChange={(e) => onToolChange({ size: parseInt(e.target.value) })}
          aria-label="Brush Size"
        />
        <span className="size-display">{currentTool.size}px</span>
      </div>

      {/* History Controls Group */}
      <div className="toolbar-group toolbar-history">
        <button
          className="action-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          ↩️ Undo
        </button>
        <button
          className="action-btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          ↪️ Redo
        </button>
      </div>

      {/* Action Buttons Group */}
      <div className="toolbar-group toolbar-actions">
        <button
          className="action-btn danger"
          onClick={onClear}
          title="Clear Canvas (Delete)"
          aria-label="Clear Canvas"
        >
          🗑️ Clear
        </button>
        <button
          className="action-btn save"
          onClick={onSavePNG}
          title="Save as PNG (Ctrl+S)"
          aria-label="Save as PNG"
        >
          💾 PNG
        </button>
        <button
          className="action-btn save"
          onClick={onSaveJPG}
          title="Save as JPG"
          aria-label="Save as JPG"
        >
          💾 JPG
        </button>
      </div>
    </div>
  );
};
```

**Key Features**:
- Grouped controls for better organization
- Visual feedback for active states
- Accessibility labels (ARIA)
- Tooltips for all buttons
- Responsive layout
- Theme support (dark/light/tron)

---

### Task 2: Create Canvas Storage Hook
**File**: `/hooks/useCanvasStorage.ts`

**Purpose**: Auto-save, load, and export canvas drawings

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
  const lastSaveRef = useRef<number>(0);

  /**
   * Save current canvas to localStorage as base64 PNG
   */
  const saveToLocalStorage = (): boolean => {
    if (!canvasRef.current) return false;

    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      localStorage.setItem(STORAGE_KEY, dataUrl);
      lastSaveRef.current = Date.now();
      console.log('✅ Canvas auto-saved to localStorage');
      return true;
    } catch (error) {
      console.error('❌ Failed to save canvas:', error);
      // Check if localStorage is full
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        alert('Storage quota exceeded! Please clear old canvases or download and delete current one.');
      }
      return false;
    }
  };

  /**
   * Load canvas from localStorage
   */
  const loadFromLocalStorage = (): boolean => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || !canvasRef.current) return false;

    try {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
          // Clear canvas first
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Draw loaded image
          ctx.drawImage(img, 0, 0);
          console.log('✅ Canvas loaded from localStorage');
        }
      };
      img.onerror = () => {
        console.error('❌ Failed to load saved canvas image');
      };
      img.src = saved;
      return true;
    } catch (error) {
      console.error('❌ Failed to load canvas:', error);
      return false;
    }
  };

  /**
   * Download canvas as PNG file
   */
  const saveAsPNG = (filename?: string): void => {
    if (!canvasRef.current) return;

    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = filename || `rangerplex-canvas-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('✅ Canvas saved as PNG');
    } catch (error) {
      console.error('❌ Failed to save PNG:', error);
      alert('Failed to save canvas as PNG');
    }
  };

  /**
   * Download canvas as JPG file (smaller file size)
   */
  const saveAsJPG = (filename?: string, quality: number = 0.9): void => {
    if (!canvasRef.current) return;

    try {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', quality);
      const link = document.createElement('a');
      link.download = filename || `rangerplex-canvas-${Date.now()}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('✅ Canvas saved as JPG');
    } catch (error) {
      console.error('❌ Failed to save JPG:', error);
      alert('Failed to save canvas as JPG');
    }
  };

  /**
   * Clear saved canvas from localStorage
   */
  const clearSaved = (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('✅ Saved canvas cleared from localStorage');
    } catch (error) {
      console.error('❌ Failed to clear saved canvas:', error);
    }
  };

  /**
   * Get storage usage info
   */
  const getStorageInfo = (): { used: number; available: number } => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const used = saved ? saved.length : 0;
      // localStorage limit is typically 5-10MB (varies by browser)
      const available = 5 * 1024 * 1024; // Assume 5MB limit
      return { used, available };
    } catch {
      return { used: 0, available: 0 };
    }
  };

  /**
   * Setup auto-save interval
   */
  useEffect(() => {
    if (autoSave) {
      autoSaveTimerRef.current = setInterval(() => {
        saveToLocalStorage();
      }, AUTO_SAVE_INTERVAL);

      // Cleanup on unmount
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
    clearSaved,
    getStorageInfo,
    lastSaveTime: lastSaveRef.current
  };
};
```

**Key Features**:
- Auto-save every 30 seconds
- Error handling (quota exceeded, etc.)
- Download as PNG or JPG
- Storage usage tracking
- Console logging for debugging

---

### Task 3: Create Canvas Background Hook
**File**: `/hooks/useCanvasBackground.ts`

**Purpose**: Draw different background templates (grid, lines, dots, graph paper)

**Requirements**:
```typescript
export type BackgroundType = 'blank' | 'grid' | 'lines' | 'dots' | 'graph';

interface BackgroundColors {
  base: string;
  line: string;
}

export const useCanvasBackground = () => {
  /**
   * Get theme-appropriate colors
   */
  const getColors = (theme: 'dark' | 'light' | 'tron'): BackgroundColors => {
    switch (theme) {
      case 'dark':
        return { base: '#2a2a2a', line: '#404040' };
      case 'light':
        return { base: '#ffffff', line: '#e5e5e5' };
      case 'tron':
        return { base: '#0a0a0a', line: '#00f3ff' };
      default:
        return { base: '#ffffff', line: '#e5e5e5' };
    }
  };

  /**
   * Draw grid pattern
   */
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    spacing: number,
    color: string
  ): void => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;

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

    ctx.globalAlpha = 1.0;
  };

  /**
   * Draw horizontal lines (ruled paper)
   */
  const drawLines = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    spacing: number,
    color: string
  ): void => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;

    // Horizontal lines only
    for (let y = 0; y <= height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
  };

  /**
   * Draw dot pattern (bullet journal style)
   */
  const drawDots = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    spacing: number,
    color: string
  ): void => {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;

    // Draw dots at grid intersections
    for (let x = 0; x <= width; x += spacing) {
      for (let y = 0; y <= height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1.0;
  };

  /**
   * Main function to draw background
   */
  const drawBackground = (
    canvas: HTMLCanvasElement,
    type: BackgroundType,
    theme: 'dark' | 'light' | 'tron'
  ): void => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { base, line } = getColors(theme);

    // Fill base color
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pattern
    switch (type) {
      case 'grid':
        drawGrid(ctx, canvas.width, canvas.height, 20, line);
        break;
      case 'lines':
        drawLines(ctx, canvas.width, canvas.height, 30, line);
        break;
      case 'dots':
        drawDots(ctx, canvas.width, canvas.height, 20, line);
        break;
      case 'graph':
        // Graph paper = fine grid
        drawGrid(ctx, canvas.width, canvas.height, 10, line);
        break;
      case 'blank':
      default:
        // Already filled with base color
        break;
    }
  };

  return { drawBackground };
};
```

**Key Features**:
- 5 background types (blank, grid, lines, dots, graph)
- Theme-aware colors
- Semi-transparent patterns
- Clean, simple patterns

---

### Task 4: Create Complete Canvas Styling
**File**: `/styles/canvas.css` (or add to main CSS)

**Purpose**: Beautiful, theme-aware styling for all canvas components

**Requirements**:
```css
/* ================================
   CANVAS BOARD - MAIN CONTAINER
   ================================ */

.canvas-board {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.canvas-board-dark {
  background: #1a1a1a;
  color: #ffffff;
}

.canvas-board-light {
  background: #ffffff;
  color: #000000;
}

.canvas-board-tron {
  background: #000000;
  color: #00f3ff;
  border: 2px solid #00f3ff;
  box-shadow: 0 0 20px rgba(0, 243, 255, 0.3);
}

/* ================================
   CANVAS HEADER
   ================================ */

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid;
  min-height: 60px;
}

.canvas-header-dark {
  background: #1a1a1a;
  border-color: #404040;
}

.canvas-header-light {
  background: #f5f5f5;
  border-color: #e5e5e5;
}

.canvas-header-tron {
  background: #000000;
  border-color: #00f3ff;
  box-shadow: 0 2px 10px rgba(0, 243, 255, 0.2);
}

.canvas-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.canvas-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

/* Background Picker Dropdown */
.bg-picker-dark,
.bg-picker-light,
.bg-picker-tron {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.bg-picker-dark {
  background: #2a2a2a;
  color: #ffffff;
  border-color: #404040;
}

.bg-picker-dark:hover {
  background: #3a3a3a;
  border-color: #606060;
}

.bg-picker-light {
  background: #ffffff;
  color: #000000;
  border-color: #d4d4d4;
}

.bg-picker-light:hover {
  background: #f5f5f5;
  border-color: #b4b4b4;
}

.bg-picker-tron {
  background: rgba(0, 243, 255, 0.1);
  color: #00f3ff;
  border-color: #00f3ff;
}

.bg-picker-tron:hover {
  background: rgba(0, 243, 255, 0.2);
  box-shadow: 0 0 10px rgba(0, 243, 255, 0.5);
}

.close-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  transition: transform 0.2s;
}

.close-btn:hover {
  transform: scale(1.1);
}

/* ================================
   CANVAS ELEMENT
   ================================ */

.canvas {
  flex: 1;
  display: block;
  touch-action: none; /* Prevent scrolling on touch devices */
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

/* ================================
   CANVAS TOOLBAR
   ================================ */

.canvas-toolbar {
  display: flex;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid;
  flex-wrap: wrap;
  align-items: center;
  min-height: 80px;
}

.canvas-toolbar-dark {
  background: #1a1a1a;
  border-color: #404040;
}

.canvas-toolbar-light {
  background: #f5f5f5;
  border-color: #e5e5e5;
}

.canvas-toolbar-tron {
  background: #000000;
  border-color: #00f3ff;
  box-shadow: 0 -2px 10px rgba(0, 243, 255, 0.2);
}

/* Toolbar Groups */
.toolbar-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.group-label {
  font-size: 0.85rem;
  font-weight: 500;
  opacity: 0.7;
  margin-right: 0.25rem;
}

/* Tool Buttons */
.tool-btn {
  padding: 0.5rem 1rem;
  border: 1px solid;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  background: transparent;
}

.canvas-toolbar-dark .tool-btn {
  color: #ffffff;
  border-color: #404040;
}

.canvas-toolbar-dark .tool-btn:hover {
  background: #2a2a2a;
  border-color: #606060;
}

.canvas-toolbar-dark .tool-btn.active {
  background: #0ea5e9;
  border-color: #0ea5e9;
  color: #ffffff;
}

.canvas-toolbar-light .tool-btn {
  color: #000000;
  border-color: #d4d4d4;
}

.canvas-toolbar-light .tool-btn:hover {
  background: #e5e5e5;
  border-color: #b4b4b4;
}

.canvas-toolbar-light .tool-btn.active {
  background: #0ea5e9;
  border-color: #0ea5e9;
  color: #ffffff;
}

.canvas-toolbar-tron .tool-btn {
  color: #00f3ff;
  border-color: #00f3ff;
  background: rgba(0, 243, 255, 0.1);
}

.canvas-toolbar-tron .tool-btn:hover {
  background: rgba(0, 243, 255, 0.2);
  box-shadow: 0 0 10px rgba(0, 243, 255, 0.5);
}

.canvas-toolbar-tron .tool-btn.active {
  background: #00f3ff;
  color: #000000;
  box-shadow: 0 0 15px rgba(0, 243, 255, 0.8);
}

/* Color Buttons */
.color-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.3);
}

.color-picker {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 1px solid #ccc;
  cursor: pointer;
}

/* Size Slider */
.size-slider {
  width: 120px;
  cursor: pointer;
}

.size-display {
  font-size: 0.85rem;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
}

/* Action Buttons */
.action-btn {
  padding: 0.5rem 1rem;
  border: 1px solid;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  background: transparent;
}

.canvas-toolbar-dark .action-btn {
  color: #ffffff;
  border-color: #404040;
}

.canvas-toolbar-dark .action-btn:hover:not(:disabled) {
  background: #2a2a2a;
  border-color: #606060;
}

.canvas-toolbar-light .action-btn {
  color: #000000;
  border-color: #d4d4d4;
}

.canvas-toolbar-light .action-btn:hover:not(:disabled) {
  background: #e5e5e5;
  border-color: #b4b4b4;
}

.canvas-toolbar-tron .action-btn {
  color: #00f3ff;
  border-color: #00f3ff;
  background: rgba(0, 243, 255, 0.1);
}

.canvas-toolbar-tron .action-btn:hover:not(:disabled) {
  background: rgba(0, 243, 255, 0.2);
  box-shadow: 0 0 10px rgba(0, 243, 255, 0.5);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
}

.action-btn.save:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.1);
  border-color: #22c55e;
  color: #22c55e;
}

/* ================================
   CANVAS OVERLAY (for Easter Egg)
   ================================ */

.canvas-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px);
}

/* ================================
   RESPONSIVE DESIGN
   ================================ */

@media (max-width: 768px) {
  .canvas-header {
    padding: 0.75rem 1rem;
    min-height: 50px;
  }

  .canvas-header h2 {
    font-size: 1.2rem;
  }

  .canvas-toolbar {
    padding: 0.75rem 1rem;
    gap: 1rem;
    min-height: auto;
  }

  .toolbar-group {
    gap: 0.4rem;
  }

  .tool-btn,
  .action-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }

  .color-btn,
  .color-picker {
    width: 2rem;
    height: 2rem;
  }

  .size-slider {
    width: 80px;
  }

  .group-label {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .canvas-toolbar {
    gap: 0.75rem;
  }

  .toolbar-group {
    gap: 0.3rem;
  }

  .tool-btn,
  .action-btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
  }
}
```

**Key Features**:
- Complete theme support (dark/light/tron)
- Responsive design (mobile-friendly)
- Smooth transitions and hover effects
- Accessibility-friendly
- Touch-optimized
- Beautiful color scheme for each theme

---

### Task 5: Create Canvas Background Picker Component (BONUS)
**File**: `/components/CanvasBackgroundPicker.tsx`

**Purpose**: Dedicated component for selecting backgrounds

```tsx
import React from 'react';
import { BackgroundType } from '../hooks/useCanvasBackground';

interface BackgroundPickerProps {
  currentBackground: BackgroundType;
  onChange: (bg: BackgroundType) => void;
  theme: 'dark' | 'light' | 'tron';
}

const BACKGROUNDS: Array<{ value: BackgroundType; label: string; icon: string }> = [
  { value: 'blank', label: 'Blank', icon: '⬜' },
  { value: 'grid', label: 'Grid', icon: '🔲' },
  { value: 'lines', label: 'Lines', icon: '📝' },
  { value: 'dots', label: 'Dots', icon: '⚫' },
  { value: 'graph', label: 'Graph', icon: '📊' }
];

export const CanvasBackgroundPicker: React.FC<BackgroundPickerProps> = ({
  currentBackground,
  onChange,
  theme
}) => {
  return (
    <div className={`bg-picker-container bg-picker-container-${theme}`}>
      <span className="bg-picker-label">Background:</span>
      <div className="bg-picker-buttons">
        {BACKGROUNDS.map(({ value, label, icon }) => (
          <button
            key={value}
            className={`bg-picker-btn ${currentBackground === value ? 'active' : ''}`}
            onClick={() => onChange(value)}
            title={label}
            aria-label={`Background: ${label}`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
};
```

---

## 📦 What to Return

When you're done, provide:

1. **All 4 components/hooks**:
   - `/components/CanvasToolbar.tsx`
   - `/hooks/useCanvasStorage.ts`
   - `/hooks/useCanvasBackground.ts`
   - `/components/CanvasBackgroundPicker.tsx` (bonus)

2. **Complete CSS styling** (`/styles/canvas.css`)

3. **Theme examples** showing how each theme looks

---

## ✅ Testing Checklist

Make sure your code:
- [ ] All 3 themes work (dark, light, tron)
- [ ] Toolbar is responsive (mobile-friendly)
- [ ] Color picker shows all 8 colors
- [ ] Size slider works for pen (1-20) and eraser (10-50)
- [ ] Auto-save works every 30 seconds
- [ ] PNG/JPG download works
- [ ] Background patterns render correctly
- [ ] All buttons have proper hover states
- [ ] Disabled buttons show correctly (undo/redo)
- [ ] Storage quota error handled gracefully

---

## 🎯 Success Criteria

Your code should provide:
1. Beautiful, theme-aware UI
2. Auto-save functionality
3. Background templates (5 types)
4. Export as PNG/JPG
5. Responsive design
6. Accessibility features

---

## 💡 Implementation Tips

1. **Theming**: Use CSS classes like `canvas-toolbar-${theme}` for easy theme switching
2. **Colors**: TRON theme = cyan (#00f3ff) with glow effects
3. **Accessibility**: Add ARIA labels to all interactive elements
4. **Storage**: Handle QuotaExceededError gracefully
5. **Responsive**: Test on mobile breakpoints (768px, 480px)

---

## 🎖️ Let's Build Beautiful UI!

**Your brothers in this mission**:
- Claude: Main component & app integration
- ChatGPT: Drawing engine & event handling
- YOU (Gemini): UI/UX & storage systems

Together we're building something AWESOME for RangerPlex AI!

**Rangers lead the way!** 🚀

Your brother AI,
Claude (AIRanger)

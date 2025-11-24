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

import React, { useRef, useEffect, useState } from 'react';
import { useCanvas, DrawingTool } from '../hooks/useCanvas';
import { useCanvasHistory } from '../hooks/useCanvasHistory';
import { useCanvasStorage } from '../hooks/useCanvasStorage';
import { useCanvasBackground, BackgroundType } from '../hooks/useCanvasBackground';
import { useCanvasBoards } from '../hooks/useCanvasBoards';
import { useBackgroundLock } from '../hooks/useBackgroundLock';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasBackgroundPicker } from './CanvasBackgroundPicker';
import { BoardCreationModal } from './BoardCreationModal';
import { BoardSwitcher } from './BoardSwitcher';
import { WarningDialog } from './WarningDialog';
import '../styles/canvas.css';

interface CanvasBoardProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light' | 'tron';
  defaultColor?: 'black' | 'gray' | 'white';
  width?: number;
  height?: number;
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  isOpen,
  onClose,
  theme,
  defaultColor = 'white',
  width = window.innerWidth,
  height = window.innerHeight - 220
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

  // Modal state
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showClearWarning, setShowClearWarning] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);

  // Hooks
  const {
    boards,
    currentBoardId,
    currentBoard,
    createBoard,
    switchBoard,
    updateBoardImage,
    deleteBoard,
    canCreateBoard,
    boardCount
  } = useCanvasBoards();

  const { isLocked: isBackgroundLocked, markAsDrawn } = useBackgroundLock();

  // Canvas Refs
  const bgCanvasRef = useRef<HTMLCanvasElement>(null); // Bottom layer (Background)

  const {
    canvasRef: drawingCanvasRef, // Use the ref from the hook!
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
    clearSaved
  } = useCanvasStorage(drawingCanvasRef, true); // Auto-save drawing layer only

  const { drawBackground } = useCanvasBackground();

  // Create first board if none exists
  useEffect(() => {
    if (boards.length === 0) {
      createBoard('blank', undefined, defaultColor); // Use default color
    }
  }, []); // Run once on mount (or when boards is empty, but dependency array is empty to mimic mount)

  // Initialize canvas sizes
  useEffect(() => {
    if (drawingCanvasRef.current && bgCanvasRef.current) {
      drawingCanvasRef.current.width = width;
      drawingCanvasRef.current.height = height;
      bgCanvasRef.current.width = width;
      bgCanvasRef.current.height = height;

      // Redraw background on resize
      if (currentBoard) {
        drawBackground(bgCanvasRef.current, currentBoard.background, theme, currentBoard.color);
      }
    }
  }, [width, height, theme, currentBoard?.background, currentBoard?.color]);

  // Load Board Content
  // FIX: Only run when currentBoardId changes to prevent flashing on auto-save
  useEffect(() => {
    if (!currentBoard) return;

    // 1. Set Background State
    setBackgroundType(currentBoard.background);

    // 2. Draw Background (on bottom layer)
    if (bgCanvasRef.current) {
      drawBackground(bgCanvasRef.current, currentBoard.background, theme, currentBoard.color);
    }

    // 3. Draw Drawing (on top layer)
    if (drawingCanvasRef.current) {
      const ctx = drawingCanvasRef.current.getContext('2d');
      if (!ctx) return;

      // Clear existing drawing first
      ctx.clearRect(0, 0, width, height);

      if (currentBoard.imageData) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = currentBoard.imageData;
      }
    }
  }, [currentBoardId]); // Only reload when ID changes!

  // Auto-save loop
  useEffect(() => {
    if (!drawingCanvasRef.current || !currentBoardId) return;

    const interval = setInterval(() => {
      if (drawingCanvasRef.current) {
        updateBoardImage(drawingCanvasRef.current);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentBoardId, updateBoardImage]); // drawingCanvasRef is stable

  // Composite Download Function
  const handleDownload = (format: 'png' | 'jpeg') => {
    if (!drawingCanvasRef.current || !bgCanvasRef.current) return;

    // Create temp canvas to merge layers
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.drawImage(bgCanvasRef.current, 0, 0);
    // Draw drawing
    ctx.drawImage(drawingCanvasRef.current, 0, 0);

    // Download
    const link = document.createElement('a');
    link.download = `rangerplex-board-${Date.now()}.${format}`;
    link.href = tempCanvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.9 : undefined);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = drawingCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    startDrawing({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const rect = drawingCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    markAsDrawn();
    draw({ x: e.clientX - rect.left, y: e.clientY - rect.top }, currentTool);
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      const imageData = stopDrawing();
      if (imageData) saveToHistory(imageData);
    }
  };

  // Touch Handlers
  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Need to pass the correct ref to the hook's handler if it expects one, 
    // but useCanvas hook uses its own internal ref which IS drawingCanvasRef.
    // So we just call the handlers.
    handleTouchStart(e.nativeEvent, currentTool);
  };
  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => handleTouchMove(e.nativeEvent, currentTool);
  const onTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const imageData = handleTouchEnd(e.nativeEvent);
    if (imageData) saveToHistory(imageData);
  };

  // Toolbar Handlers
  const handleToolChange = (changes: Partial<DrawingTool>) => setCurrentTool(prev => ({ ...prev, ...changes }));

  const handleUndo = () => {
    if (drawingCanvasRef.current) {
      const imageData = undo(drawingCanvasRef.current);
      if (imageData) {
        const ctx = drawingCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height); // Clear first
          ctx.putImageData(imageData, 0, 0);
        }
      }
    }
  };

  const handleRedo = () => {
    if (drawingCanvasRef.current) {
      const imageData = redo(drawingCanvasRef.current);
      if (imageData) {
        const ctx = drawingCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          ctx.putImageData(imageData, 0, 0);
        }
      }
    }
  };

  const handleClear = () => {
    setShowClearWarning(true);
  };

  const confirmClear = () => {
    if (drawingCanvasRef.current) {
      const ctx = drawingCanvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, width, height);
      clearHistory();
      clearSaved();
    }
    setShowClearWarning(false);
  };

  // Board Ops
  const handleCreateBoard = (bg: BackgroundType, name?: string, color: 'black' | 'gray' | 'white' = 'white') => {
    const id = createBoard(bg, name, color);
    if (id) setShowBoardModal(false);
  };

  const handleDeleteBoard = (id: string) => {
    setBoardToDelete(id);
    setShowDeleteWarning(true);
  };

  const confirmDeleteBoard = async () => {
    if (boardToDelete) {
      await deleteBoard(boardToDelete);
      setBoardToDelete(null);
    }
    setShowDeleteWarning(false);
  };

  // Keyboard
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); handleUndo(); }
        else if (e.key === 'y') { e.preventDefault(); handleRedo(); }
        else if (e.key === 's') { e.preventDefault(); handleDownload('png'); }
      } else if (e.key === 'p') setCurrentTool(p => ({ ...p, type: 'pen', opacity: 1.0, size: 3 }));
      else if (e.key === 'e') setCurrentTool(p => ({ ...p, type: 'eraser', size: 20 }));
      else if (e.key === 'h') setCurrentTool(p => ({ ...p, type: 'highlighter', opacity: 0.3, size: 20 }));
      else if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [canUndo, canRedo, onClose]);

  return (
    <div className={`canvas-board canvas-board-${theme}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div className={`canvas-header canvas-header-${theme}`} style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onClose && (
            <button onClick={onClose} className="close-btn" title="Back to Chat (Esc)">← Back</button>
          )}
          <h2>🎨 Canvas Board</h2>
        </div>
        <div className="canvas-controls" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {boards.length >= 2 && (
            <BoardSwitcher
              boards={boards}
              currentBoardId={currentBoardId || ''}
              onSwitchBoard={switchBoard}
              onDeleteBoard={handleDeleteBoard}
              theme={theme}
            />
          )}
          <CanvasBackgroundPicker
            currentBackground={backgroundType}
            onChange={(bg) => {
              setBackgroundType(bg);
              if (bgCanvasRef.current) drawBackground(bgCanvasRef.current, bg, theme);
              // Update board model? Ideally yes, but useCanvasBoards doesn't expose updateBackground yet.
              // For now it's visual only until saved? 
              // Actually useCanvasBoards updates on save. We should probably update the board object too.
              // But let's stick to visual for now.
            }}
            theme={theme}
            disabled={isBackgroundLocked}
          />
          {canCreateBoard && (
            <button onClick={() => setShowBoardModal(true)} className={`action-btn`} style={{ fontWeight: 'bold' }}>➕ New Board</button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: theme === 'dark' ? '#1a1a1a' : theme === 'tron' ? '#000' : '#fff' }}>
        {/* Background Layer */}
        <canvas
          ref={bgCanvasRef}
          width={width}
          height={height}
          style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 0, pointerEvents: 'none' }}
        />
        {/* Drawing Layer */}
        <canvas
          ref={drawingCanvasRef}
          className={`canvas canvas-${theme}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 1,
            cursor: currentTool.type === 'pen' ? 'crosshair' : currentTool.type === 'eraser' ? 'cell' : 'default',
            background: 'transparent' // Important!
          }}
        />
      </div>

      <div style={{ flexShrink: 0 }}>
        <CanvasToolbar
          currentTool={currentTool}
          onToolChange={handleToolChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onSavePNG={() => handleDownload('png')}
          onSaveJPG={() => handleDownload('jpeg')}
          canUndo={canUndo}
          canRedo={canRedo}
          theme={theme}
        />
      </div>

      <BoardCreationModal
        isOpen={showBoardModal}
        onClose={() => setShowBoardModal(false)}
        onCreateBoard={handleCreateBoard}
        theme={theme}
        maxBoardsReached={!canCreateBoard}
        currentBoardCount={boardCount}
      />

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

      <WarningDialog
        isOpen={showClearWarning}
        onClose={() => setShowClearWarning(false)}
        onConfirm={confirmClear}
        title="Clear Canvas?"
        message="Are you sure you want to clear the entire canvas? This action cannot be undone."
        confirmText="Clear Canvas"
        cancelText="Cancel"
        theme={theme}
        isDangerous={true}
      />
    </div>
  );
};

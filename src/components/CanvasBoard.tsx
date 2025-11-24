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
  theme: 'dark' | 'light' | 'tron';
  onClose?: () => void;
  width?: number;
  height?: number;
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  theme,
  onClose,
  width = window.innerWidth,
  height = window.innerHeight - 220 // Account for header (60px) + toolbar (160px)
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

  // Modal state for multi-board UI
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);

  // Multi-board hooks
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

  const {
    isLocked: isBackgroundLocked,
    markAsDrawn
  } = useBackgroundLock();

  // Canvas hooks
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

  // Create first board if none exists
  useEffect(() => {
    if (boardCount === 0) {
      createBoard('blank');
    }
  }, []); // Only run once on mount

  // Initialize canvas size
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
    }
  }, [width, height]);

  // Load current board when it changes
  useEffect(() => {
    if (canvasRef.current && currentBoard) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set background type from board
      setBackgroundType(currentBoard.background);

      // Draw background
      drawBackground(canvas, currentBoard.background, theme);

      // Load board image if it exists
      if (currentBoard.imageData) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = currentBoard.imageData;
      }
    }
  }, [currentBoardId, currentBoard]);

  // Auto-save current board every 5 seconds
  useEffect(() => {
    if (!canvasRef.current || !currentBoardId) return;

    const interval = setInterval(() => {
      if (canvasRef.current) {
        updateBoardImage(canvasRef.current);
      }
    }, 5000); // Save every 5 seconds

    return () => clearInterval(interval);
  }, [currentBoardId, updateBoardImage]);

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

    // Mark as drawn (locks background after first stroke)
    markAsDrawn();

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
      const imageData = stopDrawing();
      // Save to history after drawing
      if (imageData) {
        saveToHistory(imageData);
      }
    }
  };

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

  const confirmDeleteBoard = async () => {
    if (boardToDelete) {
      await deleteBoard(boardToDelete);
      setBoardToDelete(null);
    }
    setShowDeleteWarning(false);
  };

  // Toolbar handlers
  const handleToolChange = (changes: Partial<DrawingTool>) => {
    setCurrentTool(prev => ({ ...prev, ...changes }));
  };

  const handleUndo = () => {
    if (canvasRef.current) {
      const imageData = undo(canvasRef.current);
      if (imageData) {
        // Background needs to be preserved
        drawBackground(canvasRef.current, backgroundType, theme);
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
        // Background needs to be preserved
        drawBackground(canvasRef.current, backgroundType, theme);
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
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

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
        setCurrentTool(prev => ({ ...prev, type: 'pen', opacity: 1.0, size: 3 }));
      } else if (e.key === 'e') {
        setCurrentTool(prev => ({ ...prev, type: 'eraser', size: 20 }));
      } else if (e.key === 'h') {
        setCurrentTool(prev => ({ ...prev, type: 'highlighter', opacity: 0.3, size: 20 }));
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [canUndo, canRedo, onClose]);

  // Touch event handlers with proper tool passing
  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    handleTouchStart(e.nativeEvent, currentTool);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    handleTouchMove(e.nativeEvent, currentTool);
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const imageData = handleTouchEnd(e.nativeEvent);
    if (imageData) {
      saveToHistory(imageData);
    }
  };

  return (
    <div className={`canvas-board canvas-board-${theme}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div className={`canvas-header canvas-header-${theme}`} style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onClose && (
            <button
              onClick={onClose}
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
              title="Back to Chat (Esc)"
              aria-label="Back to Chat"
            >
              <span>←</span> Back to Chat
            </button>
          )}
          <h2>🎨 Canvas Board</h2>
        </div>
        <div className="canvas-controls" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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

          {/* Background picker */}
          <CanvasBackgroundPicker
            currentBackground={backgroundType}
            onChange={setBackgroundType}
            theme={theme}
            disabled={isBackgroundLocked}
          />

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
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          className={`canvas canvas-${theme}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            cursor: currentTool.type === 'pen' ? 'crosshair' :
              currentTool.type === 'eraser' ? 'cell' : 'default'
          }}
        />
      </div>

      {/* Toolbar */}
      <div style={{ flexShrink: 0 }}>
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
    </div>
  );
};

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
  onOpenSettings?: () => void;
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  isOpen,
  onClose,
  theme,
  defaultColor = 'white',
  width = window.innerWidth,
  height = window.innerHeight - 220,
  onOpenSettings
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
    updateBoardBackground,
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

  // Sync picker state with current board
  useEffect(() => {
    if (currentBoard) {
      setBackgroundType(currentBoard.background);
    }
  }, [currentBoard?.id, currentBoard?.background]);

  // Container Ref for dynamic resizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    // Initial measure
    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Initialize canvas sizes based on container dimensions
  useEffect(() => {
    if (drawingCanvasRef.current && bgCanvasRef.current) {
      drawingCanvasRef.current.width = dimensions.width;
      drawingCanvasRef.current.height = dimensions.height;
      bgCanvasRef.current.width = dimensions.width;
      bgCanvasRef.current.height = dimensions.height;

      // Redraw background on resize
      if (currentBoard) {
        drawBackground(bgCanvasRef.current, currentBoard.background, theme, currentBoard.color);
      }
    }
  }, [dimensions.width, dimensions.height, theme, currentBoard?.background, currentBoard?.color]);

  // Hydrate saved board image onto drawing layer when board or size changes
  useEffect(() => {
    if (!drawingCanvasRef.current || !currentBoard) return;
    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear before painting
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentBoard.imageData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.onerror = () => console.warn('⚠️ Failed to hydrate canvas image for board:', currentBoard.id);
      img.src = currentBoard.imageData;
    }
  }, [currentBoard?.id, currentBoard?.imageData, dimensions.width, dimensions.height]);

  // Determine container background color to match board
  const getContainerBackground = () => {
    if (!currentBoard) return theme === 'dark' ? '#1a1a1a' : theme === 'tron' ? '#000' : '#fff';
    if (currentBoard.color === 'black') return '#000000';
    if (currentBoard.color === 'gray') return '#808080';
    return '#ffffff';
  };

  // Composite Download Function
  const handleDownload = (format: 'png' | 'jpeg') => {
    if (!drawingCanvasRef.current || !bgCanvasRef.current) return;

    // Create temp canvas to merge layers
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = dimensions.width;
    tempCanvas.height = dimensions.height;
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
      if (imageData) {
        saveToHistory(imageData);
        // Auto-save on stroke end
        if (drawingCanvasRef.current) {
          updateBoardImage(drawingCanvasRef.current);
        }
      }
    }
  };

  // Touch Handlers
  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    handleTouchStart(e.nativeEvent, currentTool);
  };
  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => handleTouchMove(e.nativeEvent, currentTool);
  const onTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const imageData = handleTouchEnd(e.nativeEvent);
    if (imageData) {
      saveToHistory(imageData);
      // Auto-save on stroke end
      if (drawingCanvasRef.current) {
        updateBoardImage(drawingCanvasRef.current);
      }
    }
  };

  // Handle Close with Save
  const handleClose = () => {
    if (drawingCanvasRef.current) {
      updateBoardImage(drawingCanvasRef.current);
    }
    if (onClose) onClose();
  };

  // Persist latest drawing when component unmounts
  useEffect(() => {
    return () => {
      if (drawingCanvasRef.current) {
        updateBoardImage(drawingCanvasRef.current);
      }
    };
  }, [updateBoardImage]);

  // Toolbar Handlers
  const handleToolChange = (changes: Partial<DrawingTool>) => setCurrentTool(prev => ({ ...prev, ...changes }));

  const handleUndo = () => {
    if (drawingCanvasRef.current) {
      const imageData = undo(drawingCanvasRef.current);
      if (imageData) {
        const ctx = drawingCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, dimensions.width, dimensions.height); // Clear first
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
          ctx.clearRect(0, 0, dimensions.width, dimensions.height);
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
      ctx?.clearRect(0, 0, dimensions.width, dimensions.height);
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

  const handleSwitchBoard = (boardId: string) => {
    if (drawingCanvasRef.current && currentBoardId) {
      updateBoardImage(drawingCanvasRef.current);
    }
    switchBoard(boardId);
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
      else if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [canUndo, canRedo, onClose]);

  return (
    <div className={`canvas-board canvas-board-${theme}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div className={`canvas-header canvas-header-${theme}`} style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={handleClose} className="close-btn" title="Back to Chat (Esc)">← Back</button>
          <h2>🎨 Canvas Board</h2>
        </div>
        <div className="canvas-controls" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {boards.length >= 2 && (
            <BoardSwitcher
              boards={boards}
              currentBoardId={currentBoardId || ''}
              onSwitchBoard={handleSwitchBoard}
              onDeleteBoard={handleDeleteBoard}
              theme={theme}
            />
          )}
          <CanvasBackgroundPicker
            currentBackground={backgroundType}
            onChange={(bg) => {
              setBackgroundType(bg);
              if (bgCanvasRef.current) drawBackground(bgCanvasRef.current, bg, theme, currentBoard?.color);
              if (currentBoardId) {
                updateBoardBackground(currentBoardId, bg, currentBoard?.color);
              }
            }}
            theme={theme}
            disabled={isBackgroundLocked}
          />
          {canCreateBoard && (
            <button onClick={() => setShowBoardModal(true)} className={`action-btn`} style={{ fontWeight: 'bold' }}>➕ New Board</button>
          )}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className={`action-btn`}
              title="Open Settings"
              style={{ fontWeight: 'bold' }}
            >
              <i className="fa-solid fa-gear"></i>
            </button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: getContainerBackground(),
          transition: 'background-color 0.3s ease'
        }}
      >
        {/* Background Layer */}
        <canvas
          ref={bgCanvasRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }}
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
            position: 'absolute', top: 0, left: 0, zIndex: 1,
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

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvas, DrawingTool } from '../hooks/useCanvas';
import { useCanvasHistory } from '../hooks/useCanvasHistory';
import { useCanvasBackground, BackgroundType } from '../hooks/useCanvasBackground';
import { useCanvasBoards, CanvasBoard as CanvasBoardType } from '../hooks/useCanvasBoards';
import { useBackgroundLock } from '../hooks/useBackgroundLock';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasBackgroundPicker } from './CanvasBackgroundPicker';
import { BoardCreationModal } from './BoardCreationModal';
import { BoardSwitcher } from './BoardSwitcher';
import { WarningDialog } from './WarningDialog';
import { canvasDbService } from '../../services/canvasDbService';
import { queueCanvasBoardSave } from '../../services/autoSaveService';
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

// --- CanvasEditor Component ---
// Responsible for a SINGLE board's lifecycle: Load -> Draw -> Save
interface CanvasEditorProps {
  board: CanvasBoardType;
  theme: 'dark' | 'light' | 'tron';
  onClose: () => void;
  onOpenSettings?: () => void;
  onUpdateMetadata: (id: string, updates: Partial<CanvasBoardType>) => void;
  boards: CanvasBoardType[];
  onSwitchBoard: (id: string) => void;
  onDeleteBoard: (id: string) => void;
  onCreateBoard: () => void;
  canCreateBoard: boolean;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({
  board,
  theme,
  onClose,
  onOpenSettings,
  onUpdateMetadata,
  boards,
  onSwitchBoard,
  onDeleteBoard,
  onCreateBoard,
  canCreateBoard
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTool, setCurrentTool] = useState<DrawingTool>({
    type: 'pen',
    color: '#000000',
    size: 3,
    opacity: 1.0,
    lineCap: 'round',
    lineJoin: 'round'
  });

  // Local state for background to allow immediate UI updates before DB sync
  const [localBackground, setLocalBackground] = useState<BackgroundType>(board.background);

  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const {
    canvasRef: drawingCanvasRef,
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

  const { drawBackground } = useCanvasBackground();
  const { isLocked: isBackgroundLocked, markAsDrawn } = useBackgroundLock();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // 1. Load Image Data on Mount
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const imageData = await canvasDbService.loadBoardImage(board.id);
        if (isMounted && imageData && drawingCanvasRef.current) {
          const img = new Image();
          img.onload = () => {
            if (drawingCanvasRef.current) {
              const ctx = drawingCanvasRef.current.getContext('2d');
              ctx?.drawImage(img, 0, 0);
            }
            setIsLoading(false);
          };
          img.src = imageData;
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Failed to load board image", e);
        setIsLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [board.id]); // Only run on mount (key change handles the rest)

  // 2. Save Logic
  const saveBoard = useCallback((force = false) => {
    if (!drawingCanvasRef.current) return;
    const imageData = drawingCanvasRef.current.toDataURL('image/jpeg', 0.7);

    // Queue save
    queueCanvasBoardSave({
      ...board,
      imageData,
      modified: Date.now()
    }, true); // Enable cloud sync
  }, [board]);

  // Save on Unmount
  useEffect(() => {
    return () => saveBoard(true);
  }, [saveBoard]);

  // Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };
    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Update Canvas Size & Redraw Background
  useEffect(() => {
    if (drawingCanvasRef.current && bgCanvasRef.current) {
      // Save current content before resize
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = drawingCanvasRef.current.width;
      tempCanvas.height = drawingCanvasRef.current.height;
      tempCtx?.drawImage(drawingCanvasRef.current, 0, 0);

      // Resize
      drawingCanvasRef.current.width = dimensions.width;
      drawingCanvasRef.current.height = dimensions.height;
      bgCanvasRef.current.width = dimensions.width;
      bgCanvasRef.current.height = dimensions.height;

      // Restore content
      const ctx = drawingCanvasRef.current.getContext('2d');
      ctx?.drawImage(tempCanvas, 0, 0);

      // Redraw background
      drawBackground(bgCanvasRef.current, localBackground, theme, board.color);
    }
  }, [dimensions, theme, localBackground, board.color]);

  // Sync local background when prop changes (e.g. from other tabs)
  useEffect(() => {
    setLocalBackground(board.background);
  }, [board.background]);

  // Input Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = drawingCanvasRef.current?.getBoundingClientRect();
    if (rect) startDrawing({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const rect = drawingCanvasRef.current?.getBoundingClientRect();
    if (rect) {
      markAsDrawn();
      draw({ x: e.clientX - rect.left, y: e.clientY - rect.top }, currentTool);
    }
  };
  const handleMouseUp = () => {
    if (isDrawing) {
      const data = stopDrawing();
      if (data) {
        saveToHistory(data);
        saveBoard(); // Auto-save
      }
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); undo(drawingCanvasRef.current!); }
        if (e.key === 'y') { e.preventDefault(); redo(drawingCanvasRef.current!); }
        if (e.key === 's') { e.preventDefault(); saveBoard(); }
      } else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo, saveBoard, onClose]);

  const getContainerBackground = () => {
    if (board.color === 'black') return '#000000';
    if (board.color === 'gray') return '#808080';
    return '#ffffff';
  };

  return (
    <div className={`canvas-board canvas-board-${theme}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div className={`canvas-header canvas-header-${theme}`} style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onClose} className="close-btn">← Back</button>
          <h2>🎨 {board.name}</h2>
        </div>
        <div className="canvas-controls" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <BoardSwitcher
            boards={boards}
            currentBoardId={board.id}
            onSwitchBoard={onSwitchBoard}
            onDeleteBoard={onDeleteBoard}
            theme={theme}
          />
          <CanvasBackgroundPicker
            currentBackground={localBackground}
            onChange={(bg) => {
              setLocalBackground(bg);
              onUpdateMetadata(board.id, { background: bg });
            }}
            theme={theme}
            disabled={isBackgroundLocked}
          />
          {canCreateBoard && (
            <button onClick={onCreateBoard} className="action-btn" style={{ fontWeight: 'bold' }}>➕ New Board</button>
          )}
          {onOpenSettings && (
            <button onClick={onOpenSettings} className="action-btn" title="Settings"><i className="fa-solid fa-gear"></i></button>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: getContainerBackground() }}>
        <canvas ref={bgCanvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }} />
        <canvas
          ref={drawingCanvasRef}
          className={`canvas canvas-${theme}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'absolute', top: 0, left: 0, zIndex: 1,
            cursor: currentTool.type === 'pen' ? 'crosshair' : 'default',
            background: 'transparent'
          }}
        />
        {isLoading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 100,
            background: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <i className="fa-solid fa-circle-notch fa-spin fa-3x"></i>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <CanvasToolbar
        currentTool={currentTool}
        onToolChange={(t) => setCurrentTool(p => ({ ...p, ...t }))}
        onUndo={() => {
          const data = undo(drawingCanvasRef.current!);
          if (data) {
            const ctx = drawingCanvasRef.current!.getContext('2d');
            ctx?.clearRect(0, 0, dimensions.width, dimensions.height);
            ctx?.putImageData(data, 0, 0);
            saveBoard();
          }
        }}
        onRedo={() => {
          const data = redo(drawingCanvasRef.current!);
          if (data) {
            const ctx = drawingCanvasRef.current!.getContext('2d');
            ctx?.clearRect(0, 0, dimensions.width, dimensions.height);
            ctx?.putImageData(data, 0, 0);
            saveBoard();
          }
        }}
        onClear={() => {
          if (confirm('Clear canvas?')) {
            const ctx = drawingCanvasRef.current?.getContext('2d');
            ctx?.clearRect(0, 0, dimensions.width, dimensions.height);
            clearHistory();
            saveBoard();
          }
        }}
        onSavePNG={() => {
          const link = document.createElement('a');
          link.download = `board-${Date.now()}.png`;
          link.href = drawingCanvasRef.current!.toDataURL();
          link.click();
        }}
        onSaveJPG={() => { }}
        canUndo={canUndo}
        canRedo={canRedo}
        theme={theme}
      />
    </div>
  );
};

// --- Main Container ---
export const CanvasBoard: React.FC<CanvasBoardProps> = (props) => {
  const {
    boards,
    currentBoardId,
    currentBoard,
    createBoard,
    switchBoard,
    updateBoardMetadata,
    deleteBoard,
    canCreateBoard,
    isLoaded
  } = useCanvasBoards();

  const [showBoardModal, setShowBoardModal] = useState(false);

  // Create first board if none
  useEffect(() => {
    if (isLoaded && boards.length === 0) {
      createBoard('blank', undefined, props.defaultColor || 'white');
    }
  }, [isLoaded, boards.length, createBoard, props.defaultColor]);

  if (!isLoaded) return <div className="p-10 text-center">Loading Canvas System...</div>;
  if (!currentBoard) return <div className="p-10 text-center">Creating Board...</div>;

  return (
    <>
      {/* KEY PROP IS CRITICAL: Forces remount on board switch */}
      <CanvasEditor
        key={currentBoard.id}
        board={currentBoard}
        boards={boards}
        theme={props.theme}
        onClose={props.onClose}
        onOpenSettings={props.onOpenSettings}
        onUpdateMetadata={updateBoardMetadata}
        onSwitchBoard={switchBoard}
        onDeleteBoard={deleteBoard}
        onCreateBoard={() => setShowBoardModal(true)}
        canCreateBoard={canCreateBoard}
      />

      <BoardCreationModal
        isOpen={showBoardModal}
        onClose={() => setShowBoardModal(false)}
        onCreateBoard={async (bg, name, color) => {
          await createBoard(bg, name, color);
          setShowBoardModal(false);
        }}
        theme={props.theme}
        maxBoardsReached={!canCreateBoard}
        currentBoardCount={boards.length}
      />
    </>
  );
};

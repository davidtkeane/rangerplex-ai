import { useState, useEffect, useCallback } from 'react';
import { BackgroundType } from './useCanvasBackground';
import { canvasDbService, CanvasBoardRecord } from '../../services/canvasDbService';
import { queueCanvasBoardsSave, queueCanvasBoardSave } from '../../services/autoSaveService';

export interface CanvasBoard {
  id: string;
  name: string;
  background: BackgroundType;
  imageData: string; // Base64 encoded canvas data
  created: number;
  modified: number;
}

const STORAGE_KEY = 'rangerplex_canvas_boards';
const MAX_BOARDS = 10;
const ENABLE_CLOUD_SYNC = true; // Enable server sync by default

export const useCanvasBoards = () => {
  const [boards, setBoards] = useState<CanvasBoard[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load boards from IndexedDB on mount (with migration from localStorage)
  useEffect(() => {
    const loadBoards = async () => {
      try {
        // Try to migrate from localStorage first (if IndexedDB is empty)
        const migratedBoards = await canvasDbService.migrateFromLocalStorage(STORAGE_KEY);

        if (migratedBoards.length > 0) {
          setBoards(migratedBoards as CanvasBoard[]);
          setCurrentBoardId(migratedBoards[0].id);
          console.log('✅ Canvas boards loaded from IndexedDB (migrated from localStorage)');
        } else {
          // Load from IndexedDB
          const loadedBoards = await canvasDbService.loadBoards();
          if (loadedBoards.length > 0) {
            setBoards(loadedBoards as CanvasBoard[]);
            setCurrentBoardId(loadedBoards[0].id);
            console.log('✅ Canvas boards loaded from IndexedDB');
          }
        }

        setIsHydrated(true);
      } catch (error) {
        console.error('❌ Failed to load canvas boards from IndexedDB:', error);
        // Fallback to localStorage if IndexedDB fails
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const loadedBoards: CanvasBoard[] = JSON.parse(stored);
            setBoards(loadedBoards);
            if (loadedBoards.length > 0) {
              setCurrentBoardId(loadedBoards[0].id);
            }
            console.log('⚠️ Canvas boards loaded from localStorage (IndexedDB failed)');
          }
        } catch (fallbackError) {
          console.error('❌ Failed to load canvas boards from localStorage:', fallbackError);
        }
        setIsHydrated(true);
      }
    };
    loadBoards();
  }, []);


  // Save boards to 3-tier persistence whenever they change
  useEffect(() => {
    if (!isHydrated || boards.length === 0) return;

    try {
      // Tier 1: Save to localStorage immediately (fast cache)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));

      // Tier 2 & 3: Queue IndexedDB save + server sync (debounced)
      queueCanvasBoardsSave(
        boards as CanvasBoardRecord[],
        ENABLE_CLOUD_SYNC,
        () => {
          console.log('✅ Canvas boards saved to IndexedDB and synced to server');
        }
      );
    } catch (error) {
      console.error('❌ Failed to save canvas boards:', error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        alert('Storage quota exceeded! Please delete some boards to free up space.');
      }
    }
  }, [boards, isHydrated]);

  // Get current board
  const getCurrentBoard = useCallback((): CanvasBoard | null => {
    return boards.find(b => b.id === currentBoardId) || null;
  }, [boards, currentBoardId]);

  // Generate auto-name for board
  const generateBoardName = useCallback((background: BackgroundType): string => {
    const backgroundNames = {
      blank: 'Blank',
      grid: 'Grid',
      lines: 'Lines',
      dots: 'Dots',
      graph: 'Graph'
    };

    // Count existing boards with this background
    const count = boards.filter(b => b.background === background).length + 1;
    return `${backgroundNames[background]} Board ${count}`;
  }, [boards]);

  // Create new board
  const createBoard = useCallback((background: BackgroundType, customName?: string): string | null => {
    if (boards.length >= MAX_BOARDS) {
      console.error('Maximum number of boards reached');
      return null;
    }

    const newBoard: CanvasBoard = {
      id: `board_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: customName || generateBoardName(background),
      background,
      imageData: '', // Empty canvas
      created: Date.now(),
      modified: Date.now()
    };

    setBoards(prev => [...prev, newBoard]);
    setCurrentBoardId(newBoard.id);
    return newBoard.id;
  }, [boards, generateBoardName]);

  // Switch to different board
  const switchBoard = useCallback((boardId: string): CanvasBoard | null => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      setCurrentBoardId(boardId);
      return board;
    }
    return null;
  }, [boards]);

  // Update current board's image data
  const updateBoardImage = useCallback((canvas: HTMLCanvasElement) => {
    if (!currentBoardId) return;

    try {
      const imageData = canvas.toDataURL('image/png');
      setBoards(prev => prev.map(board =>
        board.id === currentBoardId
          ? { ...board, imageData, modified: Date.now() }
          : board
      ));
    } catch (error) {
      console.error('Failed to update board image:', error);
    }
  }, [currentBoardId]);

  // Delete board
  const deleteBoard = useCallback(async (boardId: string): Promise<boolean> => {
    if (boards.length <= 1) {
      console.error('Cannot delete the last board');
      return false;
    }

    const boardIndex = boards.findIndex(b => b.id === boardId);
    if (boardIndex === -1) return false;

    // Delete from state
    setBoards(prev => prev.filter(b => b.id !== boardId));

    // Delete from IndexedDB
    try {
      await canvasDbService.deleteBoard(boardId);
      console.log('✅ Board deleted from IndexedDB');
    } catch (error) {
      console.error('❌ Failed to delete board from IndexedDB:', error);
    }

    // If deleting current board, switch to another
    if (currentBoardId === boardId) {
      const nextBoard = boards[boardIndex + 1] || boards[boardIndex - 1];
      if (nextBoard) {
        setCurrentBoardId(nextBoard.id);
      }
    }

    return true;
  }, [boards, currentBoardId]);

  // Rename board
  const renameBoard = useCallback((boardId: string, newName: string): boolean => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return false;

    setBoards(prev => prev.map(b =>
      b.id === boardId ? { ...b, name: newName.trim() || b.name } : b
    ));
    return true;
  }, [boards]);

  // Clear all boards (dangerous!)
  const clearAllBoards = useCallback(async () => {
    setBoards([]);
    setCurrentBoardId(null);
    localStorage.removeItem(STORAGE_KEY);

    // Clear from IndexedDB
    try {
      await canvasDbService.clearAllBoards();
      console.log('✅ All boards cleared from IndexedDB');
    } catch (error) {
      console.error('❌ Failed to clear boards from IndexedDB:', error);
    }
  }, []);

  // Get boards sorted by modified date (most recent first)
  const getSortedBoards = useCallback((): CanvasBoard[] => {
    return [...boards].sort((a, b) => {
      // Current board first
      if (a.id === currentBoardId) return -1;
      if (b.id === currentBoardId) return 1;
      // Then by modified date
      return b.modified - a.modified;
    });
  }, [boards, currentBoardId]);

  return {
    boards: getSortedBoards(),
    currentBoardId,
    currentBoard: getCurrentBoard(),
    createBoard,
    switchBoard,
    updateBoardImage,
    deleteBoard,
    renameBoard,
    clearAllBoards,
    canCreateBoard: boards.length < MAX_BOARDS,
    maxBoards: MAX_BOARDS,
    boardCount: boards.length
  };
};

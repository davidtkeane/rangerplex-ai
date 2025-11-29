import { useState, useEffect, useCallback, useMemo } from 'react';
import { BackgroundType } from './useCanvasBackground';
import { canvasDbService, CanvasBoardRecord } from '../../services/canvasDbService';

export interface CanvasBoard {
  id: string;
  name: string;
  background: BackgroundType;
  color: 'black' | 'gray' | 'white';
  created: number;
  modified: number;
}

const MAX_BOARDS = 10;

export const useCanvasBoards = () => {
  const [boards, setBoards] = useState<CanvasBoard[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Initial Load (Headers Only)
  useEffect(() => {
    const loadHeaders = async () => {
      try {
        // Try to migrate if needed
        await canvasDbService.migrateFromLocalStorage();

        // Load lightweight headers
        const headers = await canvasDbService.loadBoardHeaders();

        // Convert to CanvasBoard type (excluding imageData)
        const loadedBoards = headers.map(h => ({
          id: h.id,
          name: h.name,
          background: h.background as BackgroundType,
          color: h.color || 'white',
          created: h.created,
          modified: h.modified
        }));

        setBoards(loadedBoards as CanvasBoard[]);
        if (loadedBoards.length > 0) {
          setCurrentBoardId(loadedBoards[0].id);
        }
      } catch (error) {
        console.error('❌ Failed to load canvas boards:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadHeaders();
  }, []);

  // Construct the current board object (Metadata only)
  const currentBoard = useMemo((): CanvasBoard | null => {
    return boards.find(b => b.id === currentBoardId) || null;
  }, [boards, currentBoardId]);

  // Generate auto-name
  const generateBoardName = useCallback((background: BackgroundType): string => {
    const backgroundNames = {
      blank: 'Blank',
      grid: 'Grid',
      lines: 'Lines',
      dots: 'Dots',
      graph: 'Graph'
    };
    const count = boards.filter(b => b.background === background).length + 1;
    return `${backgroundNames[background]} Board ${count}`;
  }, [boards]);

  // Create Board
  const createBoard = useCallback(async (background: BackgroundType, customName?: string, color: 'black' | 'gray' | 'white' = 'white'): Promise<string | null> => {
    if (boards.length >= MAX_BOARDS) {
      console.error('Maximum number of boards reached');
      return null;
    }

    const newBoard: CanvasBoard = {
      id: `board_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: customName || generateBoardName(background),
      background,
      color,
      created: Date.now(),
      modified: Date.now()
    };

    // Optimistic update
    setBoards(prev => [newBoard, ...prev]);
    setCurrentBoardId(newBoard.id);

    // Save to DB (Initial save with empty image)
    try {
      await canvasDbService.saveBoard({ ...newBoard, imageData: '' });
    } catch (error) {
      console.error('Failed to save new board:', error);
    }

    return newBoard.id;
  }, [boards, generateBoardName]);

  // Switch Board
  const switchBoard = useCallback((boardId: string) => {
    if (boards.some(b => b.id === boardId)) {
      setCurrentBoardId(boardId);
    }
  }, [boards]);

  // Update Background (Metadata Only)
  const updateBoardMetadata = useCallback(async (boardId: string, updates: Partial<CanvasBoard>) => {
    // Optimistic
    setBoards(prev => prev.map(b =>
      b.id === boardId
        ? { ...b, ...updates, modified: Date.now() }
        : b
    ));

    // DB Update
    try {
      await canvasDbService.updateBoardMetadata(boardId, { ...updates, modified: Date.now() });
    } catch (error) {
      console.error('Failed to update board metadata:', error);
    }
  }, []);

  // Delete Board
  const deleteBoard = useCallback(async (boardId: string): Promise<boolean> => {
    if (boards.length <= 1) return false;

    const boardIndex = boards.findIndex(b => b.id === boardId);
    if (boardIndex === -1) return false;

    // Optimistic
    setBoards(prev => prev.filter(b => b.id !== boardId));

    // DB
    try {
      await canvasDbService.deleteBoard(boardId);
    } catch (error) {
      console.error('Failed to delete board:', error);
    }

    // Switch if needed
    if (currentBoardId === boardId) {
      const nextBoard = boards[boardIndex + 1] || boards[boardIndex - 1];
      if (nextBoard) {
        setCurrentBoardId(nextBoard.id);
      }
    }

    return true;
  }, [boards, currentBoardId]);

  // Clear All
  const clearAllBoards = useCallback(async () => {
    setBoards([]);
    setCurrentBoardId(null);
    try {
      await canvasDbService.clearAllBoards();
    } catch (error) {
      console.error('Failed to clear boards:', error);
    }
  }, []);

  return {
    boards,
    currentBoardId,
    currentBoard,
    createBoard,
    switchBoard,
    updateBoardMetadata,
    deleteBoard,
    clearAllBoards,
    canCreateBoard: boards.length < MAX_BOARDS,
    maxBoards: MAX_BOARDS,
    boardCount: boards.length,
    isLoaded
  };
};

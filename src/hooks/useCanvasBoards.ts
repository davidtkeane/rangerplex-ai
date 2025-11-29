import { useState, useEffect, useCallback, useMemo } from 'react';
import { BackgroundType } from './useCanvasBackground';
import { canvasDbService, CanvasBoardRecord } from '../../services/canvasDbService';
import { queueCanvasBoardSave } from '../../services/autoSaveService';

export interface CanvasBoard {
  id: string;
  name: string;
  background: BackgroundType;
  color: 'black' | 'gray' | 'white';
  imageData: string; // Base64 encoded canvas data
  created: number;
  modified: number;
}

const MAX_BOARDS = 10;
const ENABLE_CLOUD_SYNC = true;

export const useCanvasBoards = () => {
  const [boards, setBoards] = useState<CanvasBoard[]>([]); // These will mostly be headers (empty imageData)
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [activeBoardImageData, setActiveBoardImageData] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  // 1. Initial Load (Headers Only)
  useEffect(() => {
    const loadHeaders = async () => {
      try {
        // Try to migrate if needed (this handles the legacy localStorage -> IDB move)
        await canvasDbService.migrateFromLocalStorage();

        // Load lightweight headers
        const headers = await canvasDbService.loadBoardHeaders();

        // Convert to CanvasBoard type (imageData is empty string)
        const loadedBoards = headers.map(h => ({ ...h, imageData: h.imageData || '' })) as CanvasBoard[];

        setBoards(loadedBoards);
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

  // 2. Lazy Load Image Data when Current Board Changes
  useEffect(() => {
    const loadActiveImage = async () => {
      if (!currentBoardId) {
        setActiveBoardImageData('');
        return;
      }

      // If we already have the data in the boards array (e.g. from creation), use it
      const existing = boards.find(b => b.id === currentBoardId);
      if (existing && existing.imageData && existing.imageData.length > 100) {
        setActiveBoardImageData(existing.imageData);
        return;
      }

      setIsLoadingImage(true);
      try {
        const imageData = await canvasDbService.loadBoardImage(currentBoardId);
        setActiveBoardImageData(imageData || '');
      } catch (error) {
        console.error('❌ Failed to load board image:', error);
        setActiveBoardImageData('');
      } finally {
        setIsLoadingImage(false);
      }
    };

    loadActiveImage();
  }, [currentBoardId]); // Only re-run if ID changes

  // Construct the full current board object
  const currentBoard = useMemo((): CanvasBoard | null => {
    const board = boards.find(b => b.id === currentBoardId);
    if (!board) return null;
    return { ...board, imageData: activeBoardImageData };
  }, [boards, currentBoardId, activeBoardImageData]);

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
      imageData: '',
      created: Date.now(),
      modified: Date.now()
    };

    // Optimistic update
    setBoards(prev => [newBoard, ...prev]);
    setCurrentBoardId(newBoard.id);
    setActiveBoardImageData(''); // Start empty

    // Save to DB
    try {
      await canvasDbService.saveBoard(newBoard);
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

  // Update Image (Granular Save)
  const updateBoardImage = useCallback((canvas: HTMLCanvasElement) => {
    if (!currentBoardId) return;

    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.7);
      setActiveBoardImageData(imageData);

      // Update modified timestamp in list
      setBoards(prev => prev.map(b => b.id === currentBoardId ? { ...b, modified: Date.now() } : b));

      // Queue Save (Granular)
      const boardToSave = boards.find(b => b.id === currentBoardId);
      if (boardToSave) {
        queueCanvasBoardSave(
          { ...boardToSave, imageData, modified: Date.now() },
          ENABLE_CLOUD_SYNC
        );
      }
    } catch (error) {
      console.error('Failed to update board image:', error);
    }
  }, [currentBoardId, boards]);

  // Update Background (Metadata Only)
  const updateBoardBackground = useCallback(async (boardId: string, background: BackgroundType, color?: 'black' | 'gray' | 'white') => {
    // Optimistic
    setBoards(prev => prev.map(b =>
      b.id === boardId
        ? { ...b, background, color: color ?? b.color, modified: Date.now() }
        : b
    ));

    // DB Update
    try {
      await canvasDbService.updateBoardMetadata(boardId, { background, color, modified: Date.now() });
    } catch (error) {
      console.error('Failed to update board background:', error);
    }
  }, []);

  // Rename (Metadata Only)
  const renameBoard = useCallback(async (boardId: string, newName: string): Promise<boolean> => {
    const name = newName.trim();
    if (!name) return false;

    setBoards(prev => prev.map(b => b.id === boardId ? { ...b, name } : b));

    try {
      await canvasDbService.updateBoardMetadata(boardId, { name });
      return true;
    } catch (error) {
      console.error('Failed to rename board:', error);
      return false;
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
    setActiveBoardImageData('');
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
    updateBoardImage,
    updateBoardBackground,
    deleteBoard,
    renameBoard,
    clearAllBoards,
    canCreateBoard: boards.length < MAX_BOARDS,
    maxBoards: MAX_BOARDS,
    boardCount: boards.length,
    isLoaded,
    isLoadingImage
  };
};

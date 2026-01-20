import { dbService } from './dbService';

export interface CanvasBoardRecord {
  id: string;
  name: string;
  background: string;
  color?: 'black' | 'gray' | 'white';
  imageData: string;
  created: number;
  modified: number;
}

const STORE = 'canvas_boards';

export const canvasDbService = {
  async initCanvasStore() {
    await dbService.init();
  },

  async saveBoards(boards: CanvasBoardRecord[]): Promise<void> {
    const db = await dbService.getDB();
    const tx = db.transaction(STORE, 'readwrite');
    for (const board of boards) {
      await tx.store.put(board);
    }
    await tx.done;
  },

  async saveBoard(board: CanvasBoardRecord): Promise<void> {
    console.log('[canvasDbService] saveBoard called:', {
      id: board.id,
      name: board.name,
      hasImageData: !!board.imageData,
      imageDataLength: board.imageData?.length || 0
    });
    const db = await dbService.getDB();
    await db.put(STORE, board);
    console.log('[canvasDbService] Board saved successfully to IndexedDB');
  },

  // Heavy load - loads everything (Legacy/Full)
  async loadBoards(): Promise<CanvasBoardRecord[]> {
    const db = await dbService.getDB();
    const all = await db.getAll(STORE);
    // Sort by modified desc
    return all.sort((a, b) => b.modified - a.modified);
  },

  // Lightweight load - loads headers only (no image data)
  async loadBoardHeaders(): Promise<CanvasBoardRecord[]> {
    const db = await dbService.getDB();
    const all = await db.getAll(STORE);
    // Strip image data to save memory
    return all.map(b => ({ ...b, imageData: '' })).sort((a, b) => b.modified - a.modified);
  },

  // Load specific board image data
  async loadBoardImage(boardId: string): Promise<string | null> {
    console.log('[canvasDbService] loadBoardImage called for:', boardId);
    const db = await dbService.getDB();
    const board = await db.get(STORE, boardId);
    console.log('[canvasDbService] loadBoardImage result:', {
      found: !!board,
      hasImageData: !!board?.imageData,
      imageDataLength: board?.imageData?.length || 0
    });
    return board ? board.imageData : null;
  },

  // Update metadata without overwriting image data
  async updateBoardMetadata(boardId: string, updates: Partial<Omit<CanvasBoardRecord, 'imageData' | 'id'>>): Promise<void> {
    const db = await dbService.getDB();
    const board = await db.get(STORE, boardId);
    if (board) {
      await db.put(STORE, { ...board, ...updates, modified: Date.now() });
    }
  },

  async deleteBoard(boardId: string): Promise<void> {
    const db = await dbService.getDB();
    await db.delete(STORE, boardId);
  },

  async clearAllBoards(): Promise<void> {
    const db = await dbService.getDB();
    await db.clear(STORE);
  },

  async migrateFromLocalStorage(storageKey = 'rangerplex_canvas_boards'): Promise<CanvasBoardRecord[]> {
    const dbBoards = await this.loadBoards();
    if (dbBoards.length > 0) return dbBoards;

    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
      if (!stored) return [];
      const parsed: CanvasBoardRecord[] = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        await this.saveBoards(parsed);
        console.log('✅ Migrated canvas boards from localStorage to IndexedDB');
        return parsed;
      }
    } catch (error) {
      console.error('❌ Failed to migrate canvas boards from localStorage:', error);
    }
    return [];
  },

  async getStorageUsage(): Promise<number> {
    const boards = await this.loadBoards();
    return boards.reduce((sum, b) => sum + (b.imageData?.length || 0), 0);
  }
};


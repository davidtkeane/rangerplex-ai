import { dbService } from './dbService';
import { syncService } from './syncService';
import { canvasDbService, CanvasBoardRecord } from './canvasDbService';
import { win95DbService, Win95State } from './win95DbService';

type Listener = (...args: any[]) => void;

class AutoSaveService {
  private saveQueue = new Map<string, () => Promise<void>>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Record<string, Set<Listener>> = {};
  private debounceMs = 500;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        void this.forceFlush();
      });
    }
  }

  on(event: 'saving' | 'saved' | 'error', cb: Listener) {
    if (!this.listeners[event]) this.listeners[event] = new Set();
    this.listeners[event].add(cb);
  }

  off(event: 'saving' | 'saved' | 'error', cb: Listener) {
    this.listeners[event]?.delete(cb);
  }

  private emit(event: 'saving' | 'saved' | 'error', ...args: any[]) {
    this.listeners[event]?.forEach((cb) => cb(...args));
  }

  queueSave(key: string, task: () => Promise<void>) {
    this.saveQueue.set(key, task);

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.flushQueue();
    }, this.debounceMs);
  }

  private async flushQueue() {
    if (this.saveQueue.size === 0) return;
    this.emit('saving');

    const entries = Array.from(this.saveQueue.entries());
    this.saveQueue.clear();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    try {
      for (const [, task] of entries) {
        await task();
      }
      this.emit('saved', Date.now());
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      this.emit('error', error);
    }
  }

  async forceFlush() {
    await this.flushQueue();
  }
}

export const autoSaveService = new AutoSaveService();

// Convenience helpers for common saves
export const queueSettingSave = (key: string, value: any, enableCloudSync: boolean, onSynced?: () => void) => {
  autoSaveService.queueSave(`setting:${key}`, async () => {
    await dbService.saveSetting(key, value);
    if (enableCloudSync) {
      await syncService.syncSettings(key, value).catch((err) => {
        console.warn('Sync failed (queued):', err);
      });
    }
    if (onSynced) onSynced();
  });
};

export const queueChatSave = (sessionKey: string, chats: any[], enableCloudSync: boolean, onSynced?: () => void) => {
  autoSaveService.queueSave(`chat:${sessionKey}`, async () => {
    for (const chat of chats) {
      await dbService.saveChat(chat);
      if (enableCloudSync) {
        await syncService.syncChat(chat).catch((err) => {
          console.warn('Chat sync failed (queued):', err);
        });
      }
    }
    if (onSynced) onSynced();
  });
};

export const queueCanvasBoardsSave = (boards: CanvasBoardRecord[], enableCloudSync: boolean, onSynced?: () => void) => {
  autoSaveService.queueSave('canvas:boards', async () => {
    await canvasDbService.saveBoards(boards);
    if (enableCloudSync) {
      syncService.send({ type: 'canvas_boards_update', data: boards, timestamp: Date.now() });
    }
    if (onSynced) onSynced();
  });
};

export const queueCanvasBoardSave = (board: CanvasBoardRecord, enableCloudSync: boolean, onSynced?: () => void) => {
  autoSaveService.queueSave(`canvas:board:${board.id}`, async () => {
    await canvasDbService.saveBoard(board);
    if (enableCloudSync) {
      syncService.send({ type: 'canvas_board_update', data: board, timestamp: Date.now() });
    }
    if (onSynced) onSynced();
  });
};

export const queueWin95StateSave = (userId: string, state: Win95State, enableCloudSync: boolean, onSynced?: () => void) => {
  autoSaveService.queueSave(`win95:${userId}`, async () => {
    // Tier 2: Save to IndexedDB
    await win95DbService.save(userId, state);

    // Tier 3: Sync to Cloud (if enabled)
    if (enableCloudSync) {
      syncService.send({
        type: 'win95_state_update',
        userId,
        data: state,
        timestamp: Date.now()
      });
    }

    if (onSynced) onSynced();
  });
};

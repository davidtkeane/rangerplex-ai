import { dbService } from './dbService';
import { canvasDbService, CanvasBoardRecord } from './canvasDbService';

export interface BackupData {
  version: string;
  timestamp: number;
  user?: string;
  chats: any[];
  settings: Record<string, any>;
  canvasBoards: CanvasBoardRecord[];
  metadata: {
    totalSize: number;
    itemCounts: {
      chats: number;
      settings: number;
      canvasBoards: number;
    };
  };
}

export interface ImportOptions {
  mode: 'merge' | 'replace';
  skipChats?: boolean;
  skipSettings?: boolean;
  skipCanvas?: boolean;
  onProgress?: (value: number, label?: string) => void;
}

export interface ImportResult {
  success: boolean;
  imported: {
    chats: number;
    settings: number;
    canvasBoards: number;
  };
  errors: string[];
  warnings: string[];
}

const BACKUP_VERSION = '1.0';

const estimateSize = (data: any) => {
  try {
    return JSON.stringify(data).length;
  } catch {
    return 0;
  }
};

const buildBackupObject = async (user?: string): Promise<BackupData> => {
  const chats = await dbService.getAllChats();
  const settings = await dbService.getAllSettings();
  const canvasBoards = await canvasDbService.loadBoards();

  const totalSize =
    estimateSize(chats) +
    estimateSize(settings) +
    estimateSize(canvasBoards);

  return {
    version: BACKUP_VERSION,
    timestamp: Date.now(),
    user,
    chats,
    settings,
    canvasBoards,
    metadata: {
      totalSize,
      itemCounts: {
        chats: chats.length,
        settings: Object.keys(settings || {}).length,
        canvasBoards: canvasBoards.length,
      },
    },
  };
};

const validateBackup = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') errors.push('Backup is not an object');
  if (!data.version) errors.push('Missing version');
  if (!Array.isArray(data.chats)) errors.push('Chats must be an array');
  if (!data.settings || typeof data.settings !== 'object') errors.push('Settings must be an object');
  if (!Array.isArray(data.canvasBoards)) errors.push('Canvas boards must be an array');
  return { valid: errors.length === 0, errors };
};

const importBackupData = async (data: BackupData, options?: ImportOptions): Promise<ImportResult> => {
  const opts: ImportOptions = { mode: 'merge', ...options };
  const result: ImportResult = {
    success: true,
    imported: { chats: 0, settings: 0, canvasBoards: 0 },
    errors: [],
    warnings: [],
  };

  if (data.version && data.version !== BACKUP_VERSION) {
    result.warnings.push(`Backup version (${data.version}) differs from current (${BACKUP_VERSION}).`);
  }

  if (opts.mode === 'replace') {
    try {
      opts.onProgress?.(5, 'Clearing existing data');
      await dbService.clearChats();
      await dbService.clearSettings();
      await canvasDbService.clearAllBoards();
      opts.onProgress?.(10, 'Existing data cleared');
    } catch (error) {
      result.errors.push(`Failed to clear existing data: ${String(error)}`);
      result.success = false;
      return result;
    }
  }

  // Settings
  if (!opts.skipSettings && data.settings && typeof data.settings === 'object') {
    try {
      const entries = Object.entries(data.settings);
      const total = entries.length || 1;
      let processed = 0;
      for (const [key, value] of Object.entries(data.settings)) {
        await dbService.saveSetting(key, value);
        result.imported.settings += 1;
        processed += 1;
        opts.onProgress?.(20 + Math.min(20, (processed / total) * 20), `Importing settings (${processed}/${total})`);
      }
    } catch (error) {
      result.errors.push(`Settings import error: ${String(error)}`);
      result.success = false;
    }
  }

  // Chats
  if (!opts.skipChats && Array.isArray(data.chats)) {
    try {
      const total = data.chats.length || 1;
      let processed = 0;
      for (const chat of data.chats) {
        await dbService.saveChat(chat);
        result.imported.chats += 1;
        processed += 1;
        opts.onProgress?.(40 + Math.min(25, (processed / total) * 25), `Importing chats (${processed}/${total})`);
      }
    } catch (error) {
      result.errors.push(`Chats import error: ${String(error)}`);
      result.success = false;
    }
  }

  // Canvas boards
  if (!opts.skipCanvas && Array.isArray(data.canvasBoards)) {
    try {
      const total = data.canvasBoards.length || 1;
      let processed = 0;
      for (const board of data.canvasBoards) {
        await canvasDbService.saveBoard(board);
        result.imported.canvasBoards += 1;
        processed += 1;
        opts.onProgress?.(70 + Math.min(25, (processed / total) * 25), `Importing canvas boards (${processed}/${total})`);
      }
    } catch (error) {
      result.errors.push(`Canvas import error: ${String(error)}`);
      result.success = false;
    }
  }

  opts.onProgress?.(100, 'Import complete');
  return result;
};

const exportToFile = async (filename?: string, user?: string) => {
  const backup = await buildBackupObject(user);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `rangerplex_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const importFromFile = async (file: File, options?: ImportOptions): Promise<ImportResult> => {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const validation = validateBackup(parsed);
  if (!validation.valid) {
    return {
      success: false,
      imported: { chats: 0, settings: 0, canvasBoards: 0 },
      errors: validation.errors,
      warnings: [],
    };
  }
  return importBackupData(parsed as BackupData, options);
};

const getBackupInfo = async () => {
  const backup = await buildBackupObject();
  return {
    itemCounts: backup.metadata.itemCounts,
    totalSize: backup.metadata.totalSize,
    timestamp: backup.timestamp,
    version: backup.version,
  };
};

export const backupService = {
  exportAllData: (user?: string) => buildBackupObject(user),
  exportToFile,
  importBackupData,
  importFromFile,
  validateBackup,
  getBackupInfo,
};

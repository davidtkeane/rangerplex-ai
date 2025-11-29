// Editor File Service - now backed by the shared dbService (3-tier friendly)

import type { EditorFile, EditorFolder } from '../types/editor';
import { dbService } from '../../services/dbService';
import { queueEditorFileSave } from '../../services/autoSaveService';

const LEGACY_DB_NAME = 'rangerplex-editor';
const LEGACY_FILES_STORE = 'files';
const LEGACY_FOLDERS_STORE = 'folders';
const MIGRATION_FLAG = 'rangerplex_editor_migrated';
const ENABLE_EDITOR_SYNC = true;

class EditorFileService {
  /**
   * Initialize storage and migrate legacy standalone DB into the shared DB.
   */
  async init(): Promise<void> {
    await dbService.init();
    await this.migrateLegacyDB();
  }

  private async migrateLegacyDB() {
    if (typeof indexedDB === 'undefined') return;
    if (typeof window !== 'undefined' && window.localStorage.getItem(MIGRATION_FLAG)) return;

    try {
      const legacyDb: IDBDatabase = await new Promise((resolve, reject) => {
        const req = indexedDB.open(LEGACY_DB_NAME);
        req.onerror = () => reject(new Error('Failed to open legacy editor DB'));
        req.onsuccess = () => resolve(req.result);
      });

      const readStore = async (storeName: string) => {
        return await new Promise<any[]>((resolve, reject) => {
          const tx = legacyDb.transaction([storeName], 'readonly');
          const store = tx.objectStore(storeName);
          const getAllReq = store.getAll();
          getAllReq.onsuccess = () => resolve(getAllReq.result || []);
          getAllReq.onerror = () => reject(new Error(`Failed to read legacy store ${storeName}`));
        });
      };

      const [files, folders] = await Promise.all([
        legacyDb.objectStoreNames.contains(LEGACY_FILES_STORE) ? readStore(LEGACY_FILES_STORE) : [],
        legacyDb.objectStoreNames.contains(LEGACY_FOLDERS_STORE) ? readStore(LEGACY_FOLDERS_STORE) : [],
      ]);

      if ((files && files.length) || (folders && folders.length)) {
        for (const folder of folders || []) {
          await dbService.saveEditorFolder(folder as EditorFolder);
        }
        for (const file of files || []) {
          await dbService.saveEditorFile(file as EditorFile);
        }
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(MIGRATION_FLAG, 'true');
        }
        console.log(`✅ Migrated legacy editor data (${files.length} files, ${folders.length} folders)`);
      } else if (typeof window !== 'undefined') {
        window.localStorage.setItem(MIGRATION_FLAG, 'true');
      }
    } catch (error) {
      console.warn('Legacy editor DB migration skipped:', error);
    }
  }

  async saveFile(file: EditorFile): Promise<void> {
    const payload = { ...file, lastModified: Date.now() };
    queueEditorFileSave(payload, ENABLE_EDITOR_SYNC);
  }

  async getFile(id: string): Promise<EditorFile | null> {
    return await dbService.getEditorFile(id) || null;
  }

  async getFileByPath(path: string): Promise<EditorFile | null> {
    return await dbService.getEditorFileByPath(path) || null;
  }

  async getAllFiles(): Promise<EditorFile[]> {
    return await dbService.getAllEditorFiles();
  }

  async deleteFile(id: string): Promise<void> {
    await dbService.deleteEditorFile(id);
  }

  async updateFileContent(id: string, content: string): Promise<void> {
    const file = await this.getFile(id);
    if (!file) {
      throw new Error('File not found');
    }
    await this.saveFile({
      ...file,
      content,
      isUnsaved: false,
    });
  }

  async saveFolder(folder: EditorFolder): Promise<void> {
    await dbService.saveEditorFolder(folder);
  }

  async getFolder(id: string): Promise<EditorFolder | null> {
    return await dbService.getEditorFolder(id) || null;
  }

  async getAllFolders(): Promise<EditorFolder[]> {
    return await dbService.getAllEditorFolders();
  }

  async deleteFolder(id: string): Promise<void> {
    await dbService.deleteEditorFolder(id);
  }

  async clearAll(): Promise<void> {
    await dbService.clearEditorData();
  }

  async exportAll(): Promise<{ files: EditorFile[]; folders: EditorFolder[] }> {
    const files = await this.getAllFiles();
    const folders = await this.getAllFolders();
    return { files, folders };
  }

  async importAll(data: { files: EditorFile[]; folders: EditorFolder[] }): Promise<void> {
    await this.clearAll();
    for (const file of data.files) {
      await this.saveFile(file);
    }
    for (const folder of data.folders) {
      await this.saveFolder(folder);
    }
  }

  async getRecentFiles(limit: number = 10): Promise<EditorFile[]> {
    return await dbService.getRecentEditorFiles(limit);
  }
}

export const editorFileService = new EditorFileService();

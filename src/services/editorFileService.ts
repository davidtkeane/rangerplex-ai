// Editor File Service - Handles file persistence using IndexedDB
// Phase 1: Foundation Service

import type { EditorFile, EditorFolder } from '../types/editor';

const DB_NAME = 'rangerplex-editor';
const DB_VERSION = 1;
const FILES_STORE = 'files';
const FOLDERS_STORE = 'folders';

class EditorFileService {
  private db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create files store
        if (!db.objectStoreNames.contains(FILES_STORE)) {
          const filesStore = db.createObjectStore(FILES_STORE, { keyPath: 'id' });
          filesStore.createIndex('path', 'path', { unique: true });
          filesStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        // Create folders store
        if (!db.objectStoreNames.contains(FOLDERS_STORE)) {
          const foldersStore = db.createObjectStore(FOLDERS_STORE, { keyPath: 'id' });
          foldersStore.createIndex('path', 'path', { unique: true });
        }
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Save a file to IndexedDB
   */
  async saveFile(file: EditorFile): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE], 'readwrite');
      const store = transaction.objectStore(FILES_STORE);

      const request = store.put({
        ...file,
        lastModified: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save file'));
    });
  }

  /**
   * Get a file by ID
   */
  async getFile(id: string): Promise<EditorFile | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE], 'readonly');
      const store = transaction.objectStore(FILES_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(new Error('Failed to get file'));
    });
  }

  /**
   * Get a file by path
   */
  async getFileByPath(path: string): Promise<EditorFile | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE], 'readonly');
      const store = transaction.objectStore(FILES_STORE);
      const index = store.index('path');
      const request = index.get(path);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(new Error('Failed to get file by path'));
    });
  }

  /**
   * Get all files
   */
  async getAllFiles(): Promise<EditorFile[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE], 'readonly');
      const store = transaction.objectStore(FILES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(new Error('Failed to get all files'));
    });
  }

  /**
   * Delete a file by ID
   */
  async deleteFile(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE], 'readwrite');
      const store = transaction.objectStore(FILES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete file'));
    });
  }

  /**
   * Update file content
   */
  async updateFileContent(id: string, content: string): Promise<void> {
    const file = await this.getFile(id);
    if (!file) {
      throw new Error('File not found');
    }

    await this.saveFile({
      ...file,
      content,
      lastModified: Date.now(),
      isUnsaved: false
    });
  }

  /**
   * Save a folder structure to IndexedDB
   */
  async saveFolder(folder: EditorFolder): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FOLDERS_STORE], 'readwrite');
      const store = transaction.objectStore(FOLDERS_STORE);
      const request = store.put(folder);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save folder'));
    });
  }

  /**
   * Get a folder by ID
   */
  async getFolder(id: string): Promise<EditorFolder | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FOLDERS_STORE], 'readonly');
      const store = transaction.objectStore(FOLDERS_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(new Error('Failed to get folder'));
    });
  }

  /**
   * Get all folders
   */
  async getAllFolders(): Promise<EditorFolder[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FOLDERS_STORE], 'readonly');
      const store = transaction.objectStore(FOLDERS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(new Error('Failed to get all folders'));
    });
  }

  /**
   * Delete a folder by ID
   */
  async deleteFolder(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FOLDERS_STORE], 'readwrite');
      const store = transaction.objectStore(FOLDERS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete folder'));
    });
  }

  /**
   * Clear all files and folders
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE, FOLDERS_STORE], 'readwrite');

      const filesStore = transaction.objectStore(FILES_STORE);
      const foldersStore = transaction.objectStore(FOLDERS_STORE);

      const clearFiles = filesStore.clear();
      const clearFolders = foldersStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to clear database'));
    });
  }

  /**
   * Export all files and folders as JSON
   */
  async exportAll(): Promise<{ files: EditorFile[]; folders: EditorFolder[] }> {
    const files = await this.getAllFiles();
    const folders = await this.getAllFolders();
    return { files, folders };
  }

  /**
   * Import files and folders from JSON
   */
  async importAll(data: { files: EditorFile[]; folders: EditorFolder[] }): Promise<void> {
    await this.clearAll();

    for (const file of data.files) {
      await this.saveFile(file);
    }

    for (const folder of data.folders) {
      await this.saveFolder(folder);
    }
  }

  /**
   * Get recent files (last 10 modified)
   */
  async getRecentFiles(limit: number = 10): Promise<EditorFile[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILES_STORE], 'readonly');
      const store = transaction.objectStore(FILES_STORE);
      const index = store.index('lastModified');
      const request = index.openCursor(null, 'prev'); // Descending order

      const files: EditorFile[] = [];
      let count = 0;

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && count < limit) {
          files.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(files);
        }
      };

      request.onerror = () => reject(new Error('Failed to get recent files'));
    });
  }
}

// Export singleton instance
export const editorFileService = new EditorFileService();

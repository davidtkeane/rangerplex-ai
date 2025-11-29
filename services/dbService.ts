// IndexedDB Service for RangerPlex AI
// Provides a wrapper around IndexedDB for persistent browser storage

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { EditorFile, EditorFolder } from '../src/types/editor';

interface RangerPlexDB extends DBSchema {
    chats: {
        key: string;
        value: {
            id: string;
            title: string;
            model: string;
            messages: any[];
            knowledgeBase: any[];
            updatedAt: number;
            isStarred: boolean;
        };
        indexes: { 'by-updated': number };
    };
    settings: {
        key: string;
        value: any;
    };
    canvas_boards: {
        key: string;
        value: {
            id: string;
            name: string;
            background: string;
            imageData: string;
            created: number;
            modified: number;
        };
        indexes: { 'by-modified': number; 'by-created': number };
    };
    editor_files: {
        key: string;
        value: EditorFile;
        indexes: { 'by-path': string; 'by-lastModified': number };
    };
    editor_folders: {
        key: string;
        value: EditorFolder;
        indexes: { 'by-path': string };
    };
    win95_state: {
        key: string; // Format: userId
        value: {
            userId: string;
            state: {
                openApps: string[];
                appStates: any;
                windowPositions: any;
                lastClosed: number;
            };
            created: number;
            modified: number;
        };
        indexes: { 'by-modified': number };
    };
    study_sessions: {
        key: string; // Format: sessionId
        value: {
            id: string;
            userId: string;
            startTime: number;
            endTime: number;
            duration: number;
            timerType: 'pomodoro' | 'countdown' | 'stopwatch';
            isBreak: boolean;
            pomodoroNumber?: number;
            subject?: string;
            notes?: string;
            completed: boolean;
            created: number;
        };
        indexes: { 'by-userId': string; 'by-startTime': number; 'by-created': number };
    };
    aliases: {
        key: string; // alias name
        value: {
            name: string;
            command: string;
            description: string;
            cwd?: string;
            requires_confirmation: boolean;
            tags?: string[];
            category: 'fun' | 'utility' | 'system' | 'custom';
            icon?: string;
            created: number;
            lastUsed?: number;
            useCount: number;
            outputMode?: 'chat' | 'terminal' | 'both';
            acceptsParams?: boolean;
            paramPlaceholder?: string;
        };
        indexes: { 'by-category': string; 'by-useCount': number };
    };
    execution_logs: {
        key: string; // log id
        value: {
            id: string;
            command: string;
            cwd: string;
            user: string;
            timestamp: number;
            exitCode: number;
            duration: number;
            source: 'alias' | 'allowlist' | 'manual';
            stdout?: string;
            stderr?: string;
        };
        indexes: { 'by-timestamp': number };
    };
    weather_snapshots: {
        key: string; // snapshot id
        value: {
            id: string;
            timestamp: number;
            location: string;
            current: any; // CurrentWeather object
            hourly?: any[]; // HourlyForecast array
            daily?: any[]; // DailyForecast array
            airQuality?: any; // AirQuality object
            source: string;
        };
        indexes: { 'by-timestamp': number; 'by-location': string };
    };
}

class DBService {
    private db: IDBPDatabase<RangerPlexDB> | null = null;
    private dbName = 'rangerplex-db';
    private version = 8; // Bumped to add editor files/folders stores

    async init() {
        if (this.db) return this.db;

        this.db = await openDB<RangerPlexDB>(this.dbName, this.version, {
            upgrade(db) {
                // Create chats store
                if (!db.objectStoreNames.contains('chats')) {
                    const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
                    chatStore.createIndex('by-updated', 'updatedAt');
                }

                // Create settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings');
                }

                // Create canvas boards store
                if (!db.objectStoreNames.contains('canvas_boards')) {
                    const canvasStore = db.createObjectStore('canvas_boards', { keyPath: 'id' });
                    canvasStore.createIndex('by-modified', 'modified');
                    canvasStore.createIndex('by-created', 'created');
                }

                // Create editor stores
                if (!db.objectStoreNames.contains('editor_files')) {
                    const editorFilesStore = db.createObjectStore('editor_files', { keyPath: 'id' });
                    editorFilesStore.createIndex('by-path', 'path', { unique: true });
                    editorFilesStore.createIndex('by-lastModified', 'lastModified');
                    console.log('✅ Created editor_files store');
                }

                if (!db.objectStoreNames.contains('editor_folders')) {
                    const editorFoldersStore = db.createObjectStore('editor_folders', { keyPath: 'id' });
                    editorFoldersStore.createIndex('by-path', 'path', { unique: true });
                    console.log('✅ Created editor_folders store');
                }

                // Create Win95 state store
                if (!db.objectStoreNames.contains('win95_state')) {
                    const win95Store = db.createObjectStore('win95_state', { keyPath: 'userId' });
                    win95Store.createIndex('by-modified', 'modified');
                    console.log('✅ Created win95_state store');
                }

                // Create study sessions store
                if (!db.objectStoreNames.contains('study_sessions')) {
                    const studyStore = db.createObjectStore('study_sessions', { keyPath: 'id' });
                    studyStore.createIndex('by-userId', 'userId');
                    studyStore.createIndex('by-startTime', 'startTime');
                    studyStore.createIndex('by-created', 'created');
                    console.log('✅ Created study_sessions store');
                }

                // Create aliases store
                if (!db.objectStoreNames.contains('aliases')) {
                    const aliasStore = db.createObjectStore('aliases', { keyPath: 'name' });
                    aliasStore.createIndex('by-category', 'category');
                    aliasStore.createIndex('by-useCount', 'useCount');
                    console.log('✅ Created aliases store');
                }

                // Create execution logs store
                if (!db.objectStoreNames.contains('execution_logs')) {
                    const logsStore = db.createObjectStore('execution_logs', { keyPath: 'id' });
                    logsStore.createIndex('by-timestamp', 'timestamp');
                    console.log('✅ Created execution_logs store');
                }

                // Create weather snapshots store
                if (!db.objectStoreNames.contains('weather_snapshots')) {
                    const weatherStore = db.createObjectStore('weather_snapshots', { keyPath: 'id' });
                    weatherStore.createIndex('by-timestamp', 'timestamp');
                    weatherStore.createIndex('by-location', 'location');
                    console.log('✅ Created weather_snapshots store');
                }
            },
        });

        console.log('✅ IndexedDB initialized');
        return this.db;
    }

    // Chat operations
    async saveChat(chat: any) {
        const db = await this.init();
        await db.put('chats', chat);
    }

    async getChat(id: string) {
        const db = await this.init();
        return await db.get('chats', id);
    }

    async getAllChats() {
        const db = await this.init();
        return await db.getAllFromIndex('chats', 'by-updated');
    }

    async deleteChat(id: string) {
        const db = await this.init();
        await db.delete('chats', id);
    }

    async clearChats() {
        const db = await this.init();
        await db.clear('chats');
    }

    // Settings operations
    async saveSetting(key: string, value: any) {
        const db = await this.init();
        console.log('💾 dbService.saveSetting:', key);

        // Sanitize value for logging
        let logValue = value;
        if (typeof value === 'object' && value !== null) {
            logValue = { ...value };
            const sensitiveKeys = ['apiKey', 'token', 'password', 'secret', 'key'];
            for (const k in logValue) {
                if (sensitiveKeys.some(s => k.toLowerCase().includes(s))) {
                    logValue[k] = '***REDACTED***';
                }
            }
        }
        console.log('💾 Value to save:', logValue);

        await db.put('settings', value, key);
        console.log('✅ Saved to IndexedDB successfully');
    }

    async getSetting(key: string) {
        const db = await this.init();
        const result = await db.get('settings', key);
        console.log('📖 dbService.getSetting:', key, '→', result ? 'FOUND' : 'NOT FOUND');
        return result;
    }

    async getAllSettings() {
        const db = await this.init();
        const keys = await db.getAllKeys('settings');
        const settings: any = {};
        for (const key of keys) {
            settings[key] = await db.get('settings', key);
        }
        return settings;
    }

    async clearSettings() {
        const db = await this.init();
        await db.clear('settings');
    }

    // Editor files/folders operations
    async saveEditorFile(file: EditorFile) {
        const db = await this.init();
        await db.put('editor_files', file);
        console.log('💾 Editor file saved:', file.path);
    }

    async getEditorFile(id: string) {
        const db = await this.init();
        return await db.get('editor_files', id);
    }

    async getEditorFileByPath(path: string) {
        const db = await this.init();
        return await db.getFromIndex('editor_files', 'by-path', path);
    }

    async getAllEditorFiles() {
        const db = await this.init();
        return await db.getAll('editor_files');
    }

    async deleteEditorFile(id: string) {
        const db = await this.init();
        await db.delete('editor_files', id);
        console.log('🗑️ Editor file deleted:', id);
    }

    async getRecentEditorFiles(limit: number = 10) {
        const db = await this.init();
        const tx = db.transaction('editor_files', 'readonly');
        const index = tx.store.index('by-lastModified');
        const files: EditorFile[] = [];
        for await (const cursor of index.iterate(null, 'prev')) {
            files.push(cursor.value);
            if (files.length >= limit) break;
        }
        await tx.done;
        return files;
    }

    async clearEditorFiles() {
        const db = await this.init();
        await db.clear('editor_files');
    }

    async saveEditorFolder(folder: EditorFolder) {
        const db = await this.init();
        await db.put('editor_folders', folder);
        console.log('💾 Editor folder saved:', folder.path);
    }

    async getEditorFolder(id: string) {
        const db = await this.init();
        return await db.get('editor_folders', id);
    }

    async getEditorFolderByPath(path: string) {
        const db = await this.init();
        return await db.getFromIndex('editor_folders', 'by-path', path);
    }

    async getAllEditorFolders() {
        const db = await this.init();
        return await db.getAll('editor_folders');
    }

    async deleteEditorFolder(id: string) {
        const db = await this.init();
        await db.delete('editor_folders', id);
        console.log('🗑️ Editor folder deleted:', id);
    }

    async clearEditorFolders() {
        const db = await this.init();
        await db.clear('editor_folders');
    }

    async clearEditorData() {
        const db = await this.init();
        await db.clear('editor_files');
        await db.clear('editor_folders');
    }

    async getAllUsers() {
        const users = await this.getSetting('users');
        return Array.isArray(users) ? users : [];
    }

    // Win95 state operations
    async saveWin95State(userId: string, state: any) {
        const db = await this.init();
        const record = {
            userId,
            state,
            created: state.created || Date.now(),
            modified: Date.now()
        };
        await db.put('win95_state', record);
        console.log('💾 Win95 state saved:', userId);
    }

    async getWin95State(userId: string) {
        const db = await this.init();
        const result = await db.get('win95_state', userId);
        console.log('📖 Win95 state loaded:', userId, result ? 'FOUND' : 'NOT FOUND');
        return result;
    }

    async clearWin95State(userId: string) {
        const db = await this.init();
        await db.delete('win95_state', userId);
        console.log('🗑️ Win95 state cleared:', userId);
    }

    async clearAllWin95States() {
        const db = await this.init();
        await db.clear('win95_state');
        console.log('🗑️ All Win95 states cleared');
    }

    // Migration from localStorage
    async migrateFromLocalStorage() {
        try {
            // Migrate chats
            const sessionsJson = localStorage.getItem('perplex_sessions');
            if (sessionsJson) {
                const sessions = JSON.parse(sessionsJson);
                for (const session of sessions) {
                    await this.saveChat(session);
                }
                console.log(`✅ Migrated ${sessions.length} chats from localStorage`);
            }

            // Migrate settings
            const settingsJson = localStorage.getItem('perplex_settings');
            if (settingsJson) {
                const settings = JSON.parse(settingsJson);
                for (const [key, value] of Object.entries(settings)) {
                    await this.saveSetting(key, value);
                }
                console.log('✅ Migrated settings from localStorage');
            }

            // Migrate users
            const usersJson = localStorage.getItem('perplex_users');
            if (usersJson) {
                await this.saveSetting('users', JSON.parse(usersJson));
                console.log('✅ Migrated users from localStorage');
            }

            // Mark migration as complete
            await this.saveSetting('migrated', true);
        } catch (error) {
            console.error('Migration error:', error);
        }
    }

    // Export all data
    async exportAll() {
        const db = await this.init();
        const chats = await this.getAllChats();
        const settings = await this.getAllSettings();

        // Export canvas boards from IndexedDB
        const canvasBoards = await db.getAll('canvas_boards');

        // Export Win95 states from IndexedDB
        const win95States = await db.getAll('win95_state');

        // Export study sessions from IndexedDB
        const studySessions = await db.getAll('study_sessions');

        // Export canvas boards from localStorage (backup location)
        const localCanvasBoards = localStorage.getItem('rangerplex_canvas_boards');

        return {
            version: '2.12.5',
            exportedAt: Date.now(),
            chats,
            settings,
            canvasBoards,
            win95States,
            studySessions,
            localCanvasBoards: localCanvasBoards ? JSON.parse(localCanvasBoards) : null
        };
    }

    // Import data
    async importAll(data: any) {
        const db = await this.init();

        await this.clearChats();
        await this.clearSettings();

        for (const chat of data.chats || []) {
            await this.saveChat(chat);
        }

        for (const [key, value] of Object.entries(data.settings || {})) {
            await this.saveSetting(key, value);
        }

        // Import canvas boards to IndexedDB
        if (data.canvasBoards && data.canvasBoards.length > 0) {
            await db.clear('canvas_boards');
            for (const board of data.canvasBoards) {
                await db.put('canvas_boards', board);
            }
        }

        // Import Win95 states to IndexedDB
        if (data.win95States && data.win95States.length > 0) {
            await db.clear('win95_state');
            for (const state of data.win95States) {
                await db.put('win95_state', state);
            }
            console.log('✅ Imported Win95 states');
        }

        // Import study sessions to IndexedDB
        if (data.studySessions && data.studySessions.length > 0) {
            await db.clear('study_sessions');
            for (const session of data.studySessions) {
                await db.put('study_sessions', session);
            }
            console.log('✅ Imported study sessions');
        }

        // Import canvas boards to localStorage (backup location)
        if (data.localCanvasBoards) {
            localStorage.setItem('rangerplex_canvas_boards', JSON.stringify(data.localCanvasBoards));
        }

        console.log('✅ Data imported successfully');
    }

    // Expose DB for other services that share the same database
    async getDB() {
        return this.init();
    }

    // Alias CRUD operations
    async saveAlias(alias: any) {
        const db = await this.init();
        await db.put('aliases', alias);
        console.log('💾 Alias saved:', alias.name);
    }

    async getAlias(name: string) {
        const db = await this.init();
        return await db.get('aliases', name);
    }

    async getAllAliases() {
        const db = await this.init();
        return await db.getAll('aliases');
    }

    async deleteAlias(name: string) {
        const db = await this.init();
        await db.delete('aliases', name);
        console.log('🗑️ Alias deleted:', name);
    }

    async updateAliasStats(name: string) {
        const db = await this.init();
        const alias = await db.get('aliases', name);
        if (alias) {
            alias.useCount = (alias.useCount || 0) + 1;
            alias.lastUsed = Date.now();
            await db.put('aliases', alias);
            console.log('📊 Alias stats updated:', name, 'useCount:', alias.useCount);
        }
    }

    async getAliasesByCategory(category: string) {
        const db = await this.init();
        return await db.getAllFromIndex('aliases', 'by-category', category);
    }

    // Execution Logs operations
    async saveExecutionLog(log: any) {
        const db = await this.init();
        await db.put('execution_logs', log);
        console.log('📝 Execution log saved:', log.id);
    }

    async getExecutionLogs(limit: number = 10) {
        const db = await this.init();
        const allLogs = await db.getAllFromIndex('execution_logs', 'by-timestamp');
        // Return most recent logs (reverse order)
        return allLogs.reverse().slice(0, limit);
    }

    async clearExecutionLogs() {
        const db = await this.init();
        await db.clear('execution_logs');
        console.log('🗑️ All execution logs cleared');
    }

    async getExecutionLogById(id: string) {
        const db = await this.init();
        return await db.get('execution_logs', id);
    }

    // Weather Snapshots operations
    async saveWeatherSnapshot(snapshot: any) {
        const db = await this.init();
        await db.put('weather_snapshots', snapshot);
        console.log('🌤️ Weather snapshot saved:', snapshot.id);
    }

    async getWeatherHistory(hours: number = 24) {
        const db = await this.init();
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
        const allSnapshots = await db.getAllFromIndex('weather_snapshots', 'by-timestamp');

        // Filter by time and reverse to get most recent first
        return allSnapshots
            .filter(snapshot => snapshot.timestamp >= cutoffTime)
            .reverse();
    }

    async getWeatherByLocation(location: string) {
        const db = await this.init();
        return await db.getAllFromIndex('weather_snapshots', 'by-location', location);
    }

    async clearWeatherHistory() {
        const db = await this.init();
        await db.clear('weather_snapshots');
        console.log('🗑️ Weather history cleared');
    }

    async getLatestWeatherSnapshot() {
        const db = await this.init();
        const allSnapshots = await db.getAllFromIndex('weather_snapshots', 'by-timestamp');
        return allSnapshots.length > 0 ? allSnapshots[allSnapshots.length - 1] : null;
    }
}

export const dbService = new DBService();

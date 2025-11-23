// IndexedDB Service for RangerPlex AI
// Provides a wrapper around IndexedDB for persistent browser storage

import { openDB, DBSchema, IDBPDatabase } from 'idb';

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
}

class DBService {
    private db: IDBPDatabase<RangerPlexDB> | null = null;
    private dbName = 'rangerplex-db';
    private version = 2; // Bumped to trigger upgrade and create settings store

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
        console.log('💾 Value to save:', value);
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
        const chats = await this.getAllChats();
        const settings = await this.getAllSettings();

        return {
            version: '2.2.0',
            exportedAt: Date.now(),
            chats,
            settings
        };
    }

    // Import data
    async importAll(data: any) {
        await this.clearChats();
        await this.clearSettings();

        for (const chat of data.chats || []) {
            await this.saveChat(chat);
        }

        for (const [key, value] of Object.entries(data.settings || {})) {
            await this.saveSetting(key, value);
        }

        console.log('✅ Data imported successfully');
    }
}

export const dbService = new DBService();

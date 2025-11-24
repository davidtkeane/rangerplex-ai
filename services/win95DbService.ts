// Win95 State Database Service
// Implements Tier 2 (IndexedDB) persistence for Windows 95 Easter Egg state
// Follows the 3-Tier Persistence Architecture

import { dbService } from './dbService';

export interface Win95State {
    openApps: string[];
    appStates: Record<string, any>;
    windowPositions: Record<string, { x: number; y: number; width: number; height: number }>;
    lastClosed: number;
}

class Win95DbService {
    /**
     * Save Win95 state to IndexedDB (Tier 2)
     * @param userId - User identifier
     * @param state - Win95 state object
     * @returns Promise<boolean> - Success status
     */
    async save(userId: string, state: Win95State): Promise<boolean> {
        try {
            await dbService.saveWin95State(userId, state);
            return true;
        } catch (error) {
            console.error('❌ Failed to save Win95 state:', error);
            return false;
        }
    }

    /**
     * Load Win95 state from IndexedDB (Tier 2)
     * @param userId - User identifier
     * @returns Promise<Win95State | null> - Loaded state or null
     */
    async load(userId: string): Promise<Win95State | null> {
        try {
            const record = await dbService.getWin95State(userId);
            return record?.state || null;
        } catch (error) {
            console.error('❌ Failed to load Win95 state:', error);
            return null;
        }
    }

    /**
     * Clear Win95 state from IndexedDB (Tier 2)
     * @param userId - User identifier
     * @returns Promise<boolean> - Success status
     */
    async clear(userId: string): Promise<boolean> {
        try {
            await dbService.clearWin95State(userId);
            return true;
        } catch (error) {
            console.error('❌ Failed to clear Win95 state:', error);
            return false;
        }
    }

    /**
     * Migrate Win95 state from localStorage to IndexedDB
     * This handles upgrades from Tier 1 to Tier 2
     * @param userId - User identifier
     * @returns Promise<Win95State | null> - Migrated state or null
     */
    async migrateFromLocalStorage(userId: string): Promise<Win95State | null> {
        const key = `win95_state_${userId}`;
        const localData = localStorage.getItem(key);

        if (localData) {
            try {
                const state = JSON.parse(localData);
                await this.save(userId, state);
                console.log('✅ Migrated Win95 state from localStorage to IndexedDB');

                // Keep localStorage as Tier 1 cache
                // Don't delete it - let the 3-Tier system maintain both

                return state;
            } catch (error) {
                console.error('❌ Win95 state migration failed:', error);
            }
        }

        return null;
    }

    /**
     * Load state with automatic migration from localStorage if needed
     * Implements the Tier 1 → Tier 2 fallback strategy
     * @param userId - User identifier
     * @returns Promise<Win95State | null> - Loaded or migrated state
     */
    async loadWithMigration(userId: string): Promise<Win95State | null> {
        // Try Tier 2 (IndexedDB) first
        let state = await this.load(userId);

        // If not found, try migrating from Tier 1 (localStorage)
        if (!state) {
            state = await this.migrateFromLocalStorage(userId);
        }

        return state;
    }
}

export const win95DbService = new Win95DbService();

/**
 * WordPress State Service - Sublime Text-style persistence for WordPress
 *
 * Created: 2026-01-11 by Ranger (AIRanger)
 * Purpose: Remember WordPress window state between sessions
 *
 * Features:
 * - Remembers WordPress port used
 * - Remembers window position and size
 * - Remembers last URL/path visited
 * - Auto-restores state when WP button clicked
 */

export interface WordPressWindowState {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface WordPressState {
    // Connection
    port: number;
    lastUrl: string;

    // Window state
    windowState: WordPressWindowState;
    isMaximized: boolean;

    // Navigation
    lastPath: string | null;  // e.g., /wp-admin/plugins.php

    // Timestamps
    lastOpened: number;
    lastClosed: number;
}

const DEFAULT_STATE: WordPressState = {
    port: 8081,
    lastUrl: 'http://localhost:8081/wp-admin',
    windowState: {
        x: 100,
        y: 100,
        width: 1400,
        height: 900
    },
    isMaximized: false,
    lastPath: null,
    lastOpened: 0,
    lastClosed: 0
};

class WordPressStateService {
    private static instance: WordPressStateService;
    private state: WordPressState | null = null;
    private userKey = 'default';

    private constructor() { }

    public static getInstance(): WordPressStateService {
        if (!WordPressStateService.instance) {
            WordPressStateService.instance = new WordPressStateService();
        }
        return WordPressStateService.instance;
    }

    public setUser(userId?: string | null) {
        this.userKey = userId || 'default';
        this.state = null; // force reload for new user
    }

    private storageKey() {
        return `ranger_wordpress_state_${this.userKey}`;
    }

    /**
     * Save the complete WordPress state
     */
    public saveState(state: Partial<WordPressState>) {
        const currentState = this.getState() || { ...DEFAULT_STATE };

        this.state = {
            ...currentState,
            ...state,
            lastClosed: Date.now()
        };

        try {
            localStorage.setItem(this.storageKey(), JSON.stringify(this.state));
            console.log('[WordPressState] State saved:', this.state);
        } catch (e) {
            console.error('[WordPressState] Failed to save state:', e);
        }
    }

    /**
     * Save just the window position/size
     */
    public saveWindowState(windowState: WordPressWindowState, isMaximized: boolean = false) {
        this.saveState({ windowState, isMaximized });
    }

    /**
     * Save the port and URL
     */
    public saveConnection(port: number, url?: string) {
        this.saveState({
            port,
            lastUrl: url || `http://localhost:${port}/wp-admin`,
            lastOpened: Date.now()
        });
    }

    /**
     * Save last visited path
     */
    public saveLastPath(path: string) {
        this.saveState({ lastPath: path });
    }

    /**
     * Get the saved state
     */
    public getState(): WordPressState | null {
        if (this.state) return this.state;

        try {
            const saved = localStorage.getItem(this.storageKey());
            if (saved) {
                this.state = { ...DEFAULT_STATE, ...JSON.parse(saved) };
                return this.state;
            }
        } catch (e) {
            console.error('[WordPressState] Failed to load state:', e);
        }

        return null;
    }

    /**
     * Get state with defaults
     */
    public getStateWithDefaults(): WordPressState {
        return this.getState() || { ...DEFAULT_STATE };
    }

    /**
     * Check if we have saved state
     */
    public hasState(): boolean {
        return this.state !== null || localStorage.getItem(this.storageKey()) !== null;
    }

    /**
     * Clear all saved state
     */
    public clearState() {
        this.state = null;
        localStorage.removeItem(this.storageKey());
        console.log('[WordPressState] State cleared');
    }

    /**
     * Get the last used port
     */
    public getLastPort(): number {
        const state = this.getState();
        return state?.port || DEFAULT_STATE.port;
    }

    /**
     * Get window bounds for Electron
     */
    public getWindowBounds(): { x: number; y: number; width: number; height: number } {
        const state = this.getState();
        if (state?.windowState) {
            return state.windowState;
        }
        return DEFAULT_STATE.windowState;
    }

    /**
     * Get last URL for restoring session
     */
    public getLastUrl(): string {
        const state = this.getState();
        return state?.lastUrl || DEFAULT_STATE.lastUrl;
    }
}

export const wordpressStateService = WordPressStateService.getInstance();

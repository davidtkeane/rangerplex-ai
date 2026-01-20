/**
 * Terminal State Service - Sublime Text-style persistence for Floating Terminal
 *
 * Created: 2026-01-11 by Ranger (AIRanger)
 * Purpose: Remember Terminal window state between sessions
 *
 * Features:
 * - Remembers window position and size
 * - Remembers last terminal endpoint
 * - Auto-restores state when Console button clicked
 */

export interface TerminalWindowState {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface TerminalState {
    // Window state
    windowState: TerminalWindowState;
    isMaximized: boolean;
    alwaysOnTop: boolean;

    // Connection
    lastEndpoint: string | null;

    // Timestamps
    lastOpened: number;
    lastClosed: number;
}

const DEFAULT_STATE: TerminalState = {
    windowState: {
        x: 100,
        y: 100,
        width: 600,
        height: 400
    },
    isMaximized: false,
    alwaysOnTop: true,
    lastEndpoint: null,
    lastOpened: 0,
    lastClosed: 0
};

class TerminalStateService {
    private static instance: TerminalStateService;
    private state: TerminalState | null = null;
    private userKey = 'default';

    private constructor() { }

    public static getInstance(): TerminalStateService {
        if (!TerminalStateService.instance) {
            TerminalStateService.instance = new TerminalStateService();
        }
        return TerminalStateService.instance;
    }

    public setUser(userId?: string | null) {
        this.userKey = userId || 'default';
        this.state = null; // force reload for new user
    }

    private storageKey() {
        return `ranger_terminal_state_${this.userKey}`;
    }

    /**
     * Save the complete Terminal state
     */
    public saveState(state: Partial<TerminalState>) {
        const currentState = this.getState() || { ...DEFAULT_STATE };

        this.state = {
            ...currentState,
            ...state,
            lastClosed: Date.now()
        };

        try {
            localStorage.setItem(this.storageKey(), JSON.stringify(this.state));
            console.log('[TerminalState] State saved:', this.state);
        } catch (e) {
            console.error('[TerminalState] Failed to save state:', e);
        }
    }

    /**
     * Save just the window position/size
     */
    public saveWindowState(windowState: TerminalWindowState, isMaximized: boolean = false) {
        this.saveState({ windowState, isMaximized });
    }

    /**
     * Save the terminal endpoint
     */
    public saveEndpoint(endpoint: string) {
        this.saveState({
            lastEndpoint: endpoint,
            lastOpened: Date.now()
        });
    }

    /**
     * Get the saved state
     */
    public getState(): TerminalState | null {
        if (this.state) return this.state;

        try {
            const saved = localStorage.getItem(this.storageKey());
            if (saved) {
                this.state = { ...DEFAULT_STATE, ...JSON.parse(saved) };
                return this.state;
            }
        } catch (e) {
            console.error('[TerminalState] Failed to load state:', e);
        }

        return null;
    }

    /**
     * Get state with defaults
     */
    public getStateWithDefaults(): TerminalState {
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
        console.log('[TerminalState] State cleared');
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
     * Get last endpoint
     */
    public getLastEndpoint(): string | null {
        const state = this.getState();
        return state?.lastEndpoint || null;
    }

    /**
     * Check if alwaysOnTop was enabled
     */
    public isAlwaysOnTop(): boolean {
        const state = this.getState();
        return state?.alwaysOnTop ?? DEFAULT_STATE.alwaysOnTop;
    }
}

export const terminalStateService = TerminalStateService.getInstance();

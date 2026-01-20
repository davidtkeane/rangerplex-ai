/**
 * Canvas State Service - Sublime Text-style persistence for Canvas
 *
 * Created: 2026-01-11 by Ranger (AIRanger)
 * Purpose: Remember Canvas window state between sessions
 *
 * Features:
 * - Remembers window position and size
 * - Remembers last active board
 * - Remembers current tool settings
 * - Auto-restores state when Canvas button clicked
 */

export interface CanvasWindowState {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CanvasToolState {
    type: 'pen' | 'eraser' | 'line' | 'rectangle' | 'circle';
    color: string;
    size: number;
    opacity: number;
}

export interface CanvasState {
    // Window state
    windowState: CanvasWindowState;
    isMaximized: boolean;

    // Canvas state
    lastBoardId: string | null;
    lastTool: CanvasToolState;

    // Timestamps
    lastOpened: number;
    lastClosed: number;
}

const DEFAULT_STATE: CanvasState = {
    windowState: {
        x: 50,
        y: 50,
        width: 1400,
        height: 900
    },
    isMaximized: false,
    lastBoardId: null,
    lastTool: {
        type: 'pen',
        color: '#000000',
        size: 3,
        opacity: 1.0
    },
    lastOpened: 0,
    lastClosed: 0
};

class CanvasStateService {
    private static instance: CanvasStateService;
    private state: CanvasState | null = null;
    private userKey = 'default';

    private constructor() { }

    public static getInstance(): CanvasStateService {
        if (!CanvasStateService.instance) {
            CanvasStateService.instance = new CanvasStateService();
        }
        return CanvasStateService.instance;
    }

    public setUser(userId?: string | null) {
        this.userKey = userId || 'default';
        this.state = null; // force reload for new user
    }

    private storageKey() {
        return `ranger_canvas_state_${this.userKey}`;
    }

    /**
     * Save the complete Canvas state
     */
    public saveState(state: Partial<CanvasState>) {
        const currentState = this.getState() || { ...DEFAULT_STATE };

        this.state = {
            ...currentState,
            ...state,
            lastClosed: Date.now()
        };

        try {
            localStorage.setItem(this.storageKey(), JSON.stringify(this.state));
            console.log('[CanvasState] State saved:', this.state);
        } catch (e) {
            console.error('[CanvasState] Failed to save state:', e);
        }
    }

    /**
     * Save just the window position/size
     */
    public saveWindowState(windowState: CanvasWindowState, isMaximized: boolean = false) {
        this.saveState({ windowState, isMaximized });
    }

    /**
     * Save the last active board
     */
    public saveLastBoard(boardId: string) {
        this.saveState({
            lastBoardId: boardId,
            lastOpened: Date.now()
        });
    }

    /**
     * Save the current tool settings
     */
    public saveToolState(tool: CanvasToolState) {
        this.saveState({ lastTool: tool });
    }

    /**
     * Get the saved state
     */
    public getState(): CanvasState | null {
        if (this.state) return this.state;

        try {
            const saved = localStorage.getItem(this.storageKey());
            if (saved) {
                this.state = { ...DEFAULT_STATE, ...JSON.parse(saved) };
                return this.state;
            }
        } catch (e) {
            console.error('[CanvasState] Failed to load state:', e);
        }

        return null;
    }

    /**
     * Get state with defaults
     */
    public getStateWithDefaults(): CanvasState {
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
        console.log('[CanvasState] State cleared');
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
     * Get last active board ID
     */
    public getLastBoardId(): string | null {
        const state = this.getState();
        return state?.lastBoardId || null;
    }

    /**
     * Get last used tool settings
     */
    public getLastTool(): CanvasToolState {
        const state = this.getState();
        return state?.lastTool || DEFAULT_STATE.lastTool;
    }
}

export const canvasStateService = CanvasStateService.getInstance();

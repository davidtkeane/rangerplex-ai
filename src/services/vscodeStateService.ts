/**
 * VS Code State Service - Sublime Text-style persistence for VS Code
 *
 * Created: 2026-01-11 by Ranger (AIRanger)
 * Purpose: Remember VS Code window state between sessions
 *
 * Features:
 * - Remembers last opened workspace/folder
 * - Remembers code-server port
 * - Remembers window position and size
 * - Auto-restores state when Code button clicked
 */

export interface VSCodeWindowState {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface VSCodeState {
    // Connection
    port: number;
    lastUrl: string;

    // Window state
    windowState: VSCodeWindowState;
    isMaximized: boolean;

    // Workspace
    lastWorkspace: string | null;
    recentWorkspaces: string[];

    // Timestamps
    lastOpened: number;
    lastClosed: number;
}

const DEFAULT_STATE: VSCodeState = {
    port: 8181,
    lastUrl: 'http://localhost:8181',
    windowState: {
        x: 100,
        y: 100,
        width: 1600,
        height: 1000
    },
    isMaximized: false,
    lastWorkspace: null,
    recentWorkspaces: [],
    lastOpened: 0,
    lastClosed: 0
};

class VSCodeStateService {
    private static instance: VSCodeStateService;
    private state: VSCodeState | null = null;
    private userKey = 'default';

    private constructor() { }

    public static getInstance(): VSCodeStateService {
        if (!VSCodeStateService.instance) {
            VSCodeStateService.instance = new VSCodeStateService();
        }
        return VSCodeStateService.instance;
    }

    public setUser(userId?: string | null) {
        this.userKey = userId || 'default';
        this.state = null; // force reload for new user
    }

    private storageKey() {
        return `ranger_vscode_state_${this.userKey}`;
    }

    /**
     * Save the complete VS Code state
     */
    public saveState(state: Partial<VSCodeState>) {
        const currentState = this.getState() || { ...DEFAULT_STATE };

        this.state = {
            ...currentState,
            ...state,
            lastClosed: Date.now()
        };

        try {
            localStorage.setItem(this.storageKey(), JSON.stringify(this.state));
            console.log('[VSCodeState] State saved:', this.state);
        } catch (e) {
            console.error('[VSCodeState] Failed to save state:', e);
        }
    }

    /**
     * Save just the window position/size
     */
    public saveWindowState(windowState: VSCodeWindowState, isMaximized: boolean = false) {
        this.saveState({ windowState, isMaximized });
    }

    /**
     * Save the port and URL
     */
    public saveConnection(port: number, url?: string) {
        this.saveState({
            port,
            lastUrl: url || `http://localhost:${port}`,
            lastOpened: Date.now()
        });
    }

    /**
     * Save workspace path
     */
    public saveWorkspace(workspacePath: string) {
        const currentState = this.getState() || { ...DEFAULT_STATE };
        const recentWorkspaces = [
            workspacePath,
            ...currentState.recentWorkspaces.filter(w => w !== workspacePath)
        ].slice(0, 10); // Keep last 10 workspaces

        this.saveState({
            lastWorkspace: workspacePath,
            recentWorkspaces
        });
    }

    /**
     * Get the saved state
     */
    public getState(): VSCodeState | null {
        if (this.state) return this.state;

        try {
            const saved = localStorage.getItem(this.storageKey());
            if (saved) {
                this.state = { ...DEFAULT_STATE, ...JSON.parse(saved) };
                return this.state;
            }
        } catch (e) {
            console.error('[VSCodeState] Failed to load state:', e);
        }

        return null;
    }

    /**
     * Get state with defaults
     */
    public getStateWithDefaults(): VSCodeState {
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
        console.log('[VSCodeState] State cleared');
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
     * Get recent workspaces list
     */
    public getRecentWorkspaces(): string[] {
        const state = this.getState();
        return state?.recentWorkspaces || [];
    }
}

export const vscodeStateService = VSCodeStateService.getInstance();

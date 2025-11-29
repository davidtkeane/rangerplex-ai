import { Tab } from '../components/Browser/BrowserLayout';

interface BrowserState {
    tabs: Tab[];
    activeTabId: string;
    urlInput: string;
}

class BrowserStateService {
    private static instance: BrowserStateService;
    private state: BrowserState | null = null;
    private userKey = 'default';

    private constructor() { }

    public static getInstance(): BrowserStateService {
        if (!BrowserStateService.instance) {
            BrowserStateService.instance = new BrowserStateService();
        }
        return BrowserStateService.instance;
    }

    public setUser(userId?: string | null) {
        this.userKey = userId || 'default';
        this.state = null; // force reload for new user
    }

    private storageKey() {
        return `ranger_browser_state_${this.userKey}`;
    }

    public saveState(tabs: Tab[], activeTabId: string, urlInput: string) {
        this.state = {
            tabs,
            activeTabId,
            urlInput
        };
        // Optional: Persist to localStorage for page reloads
        try {
            localStorage.setItem(this.storageKey(), JSON.stringify(this.state));
        } catch (e) {
            console.error('Failed to save browser state to local storage', e);
        }
    }

    public getState(): BrowserState | null {
        if (this.state) return this.state;

        // Try loading from local storage
        try {
            const saved = localStorage.getItem(this.storageKey());
            if (saved) {
                this.state = JSON.parse(saved);
                return this.state;
            }
        } catch (e) {
            console.error('Failed to load browser state from local storage', e);
        }

        return null;
    }

    public hasState(): boolean {
        return this.state !== null || localStorage.getItem(this.storageKey()) !== null;
    }

    public clearState() {
        this.state = null;
        localStorage.removeItem(this.storageKey());
    }
}

export const browserStateService = BrowserStateService.getInstance();

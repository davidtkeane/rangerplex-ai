/**
 * Type definitions for Electron API
 * These types are injected by the Electron preload script
 */

export interface ElectronAPI {
    // Environment
    isElectron: boolean;
    platform: 'darwin' | 'win32' | 'linux';

    // File System
    selectFile: () => Promise<string | null>;
    selectDirectory: () => Promise<string | null>;
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;

    // Docker
    checkDocker: () => Promise<boolean>;
    dockerCompose: (command: string, file: string) => Promise<{ output: string } | { error: string }>;

    // WordPress
    scanLocalSites: () => Promise<WordPressSite[] | { error: string }>;
    startWordPressSite: (siteName: string) => Promise<boolean>;
    stopWordPressSite: (siteName: string) => Promise<boolean>;

    // VS Code
    startCodeServer: (port: number, directory: string) => Promise<boolean>;
    stopCodeServer: () => Promise<boolean>;

    // System
    openExternal: (url: string) => Promise<{ success: boolean } | { error: string }>;
    showNotification: (title: string, body: string) => Promise<{ success: boolean } | { error: string }>;

    // Security
    panicButton: () => Promise<void>;
    toggleTorMode: (enabled: boolean) => Promise<boolean>;

    // Browser Management
    createTab: (id: string, url: string) => Promise<boolean>;
    switchTab: (id: string) => Promise<boolean>;
    resizeView: (bounds: { x: number; y: number; width: number; height: number }) => Promise<void>;
    navigate: (id: string, url: string) => Promise<void>;
    closeTab: (id: string) => Promise<void>;
    goBack: (id?: string) => Promise<void>;
    goForward: (id?: string) => Promise<void>;
    reloadTab: (id?: string) => Promise<void>;
    getNavState: (id?: string) => Promise<{ canGoBack: boolean; canGoForward: boolean } | undefined>;
    getPageText: () => Promise<string | null>;

    // Events
    on: (channel: string, func: (...args: any[]) => void) => () => void;
    setLinkBehavior: (enabled: boolean) => Promise<boolean>;
}

export interface WordPressSite {
    name: string;
    path: string;
    url: string;
    status: 'running' | 'stopped' | 'unknown';
    phpVersion?: string;
    wpVersion?: string;
}

export interface DockerContainer {
    id: string;
    name: string;
    status: 'running' | 'stopped' | 'paused';
    ports: string[];
}

// Extend Window interface
declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export { };

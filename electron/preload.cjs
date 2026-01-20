const { contextBridge, ipcRenderer } = require('electron');

console.log('🔌 Preload script loaded!');

contextBridge.exposeInMainWorld('electronAPI', {
    // Example: Send a message to the main process
    sendMessage: (channel, data) => {
        // Whitelist channels for security
        let validChannels = ['toMain'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    // Example: Receive a message from the main process
    onMessage: (channel, func) => {
        let validChannels = ['fromMain'];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender` 
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },

    // Browser Management (Phase 2 & 4)
    createTab: (id, url) => ipcRenderer.invoke('create-tab', { id, url }),
    switchTab: (id) => ipcRenderer.invoke('switch-tab', id),
    resizeView: (bounds) => ipcRenderer.invoke('resize-view', bounds),
    navigate: (id, url) => ipcRenderer.invoke('navigate', { id, url }),
    closeTab: (id) => ipcRenderer.invoke('close-tab', id),
    goBack: (id) => ipcRenderer.invoke('go-back', id),
    goForward: (id) => ipcRenderer.invoke('go-forward', id),
    reloadTab: (id) => ipcRenderer.invoke('reload-tab', id),
    getNavState: (id) => ipcRenderer.invoke('get-nav-state', id),

    // The Lens (AI Vision)
    getPageText: () => ipcRenderer.invoke('get-page-text'),

    // Mini-OS: File System
    fsReadDir: (path) => ipcRenderer.invoke('fs-read-dir', path),
    fsReadFile: (path) => ipcRenderer.invoke('fs-read-file', path),
    fsWriteFile: (path, content) => ipcRenderer.invoke('fs-write-file', { filePath: path, content }),
    fsStat: (path) => ipcRenderer.invoke('fs-stat', path),
    fsReadBuffer: (path, size) => ipcRenderer.invoke('fs-read-buffer', { filePath: path, size }),

    // Mini-OS: Floating Terminal
    toggleFloatingTerminal: () => ipcRenderer.invoke('toggle-floating-terminal'),
    openTerminalWindow: (windowBounds) => ipcRenderer.invoke('open-terminal-window', { windowBounds }),

    // Terminal State Persistence - receive window state updates from main process
    onTerminalWindowState: (callback) => {
        ipcRenderer.on('terminal-window-state', (event, state) => callback(state));
        return () => ipcRenderer.removeListener('terminal-window-state', callback);
    },

    // WordPress Integration (Project PRESS FORGE)
    scanLocalSites: () => ipcRenderer.invoke('wordpress-scan-local-sites'),
    checkDocker: () => ipcRenderer.invoke('docker-check'),
    dockerCompose: (command, file) => ipcRenderer.invoke('docker-compose', { command, file }),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    openWordPressWindow: (url, port, windowBounds) => ipcRenderer.invoke('open-wordpress-window', { url, port, windowBounds }),

    // WordPress State Persistence - receive window state updates from main process
    onWordPressWindowState: (callback) => {
        ipcRenderer.on('wordpress-window-state', (event, state) => callback(state));
        return () => ipcRenderer.removeListener('wordpress-window-state', callback);
    },
    showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),
    setLinkBehavior: (enabled) => ipcRenderer.invoke('set-link-behavior', enabled),

    // Forensics
    calculateHash: (filePath, algorithm) => ipcRenderer.invoke('forensics-hash', { filePath, algorithm }),

    // VS Code
    checkVSCodeStatus: () => ipcRenderer.invoke('vscode-status'),
    openVSCodeWindow: (port, windowBounds) => ipcRenderer.invoke('open-vscode-window', { port, windowBounds }),

    // VS Code State Persistence - receive window state updates from main process
    onVSCodeWindowState: (callback) => {
        ipcRenderer.on('vscode-window-state', (event, state) => callback(state));
        return () => ipcRenderer.removeListener('vscode-window-state', callback);
    },

    // Canvas
    openCanvasWindow: (windowBounds) => ipcRenderer.invoke('open-canvas-window', { windowBounds }),

    // Canvas State Persistence - receive window state updates from main process
    onCanvasWindowState: (callback) => {
        ipcRenderer.on('canvas-window-state', (event, state) => callback(state));
        return () => ipcRenderer.removeListener('canvas-window-state', callback);
    },

    // Generic Event Listener
    on: (channel, func) => {
        const validChannels = ['fromMain', 'request-open-url', 'open-wordpress-dashboard'];
        if (validChannels.includes(channel)) {
            const subscription = (event, ...args) => func(...args);
            ipcRenderer.on(channel, subscription);
            return () => ipcRenderer.removeListener(channel, subscription);
        }
    },
});

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

    // WordPress Integration (Project PRESS FORGE)
    scanLocalSites: () => ipcRenderer.invoke('wordpress-scan-local-sites'),
    checkDocker: () => ipcRenderer.invoke('docker-check'),
    dockerCompose: (command, file) => ipcRenderer.invoke('docker-compose', { command, file }),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),
    setLinkBehavior: (enabled) => ipcRenderer.invoke('set-link-behavior', enabled),

    // Forensics
    calculateHash: (filePath, algorithm) => ipcRenderer.invoke('forensics-hash', { filePath, algorithm }),

    // Generic Event Listener
    on: (channel, func) => {
        const validChannels = ['fromMain', 'request-open-url'];
        if (validChannels.includes(channel)) {
            const subscription = (event, ...args) => func(...args);
            ipcRenderer.on(channel, subscription);
            return () => ipcRenderer.removeListener(channel, subscription);
        }
    },
});


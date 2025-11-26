const { contextBridge, ipcRenderer } = require('electron');

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

    // Mini-OS: Floating Terminal
    toggleFloatingTerminal: () => ipcRenderer.invoke('toggle-floating-terminal'),
});

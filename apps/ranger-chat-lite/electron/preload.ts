// Preload script for RangerChat Lite
// Note: contextIsolation is disabled, so we expose ipcRenderer directly on window

import { ipcRenderer } from 'electron'

// Expose identity service API to renderer
;(window as any).electronAPI = {
    identity: {
        has: () => ipcRenderer.invoke('identity:has'),
        load: () => ipcRenderer.invoke('identity:load'),
        getOrCreate: (username?: string) => ipcRenderer.invoke('identity:getOrCreate', username),
        generateUsername: () => ipcRenderer.invoke('identity:generateUsername'),
        updateUsername: (newUsername: string) => ipcRenderer.invoke('identity:updateUsername', newUsername),
        recordMessage: () => ipcRenderer.invoke('identity:recordMessage'),
        getPaths: () => ipcRenderer.invoke('identity:getPaths'),
        export: () => ipcRenderer.invoke('identity:export'),
        reset: () => ipcRenderer.invoke('identity:reset')
    }
}

console.log('RangerChat Lite preload loaded - Identity API ready')

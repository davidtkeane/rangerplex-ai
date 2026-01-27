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
    },
    ledger: {
        init: () => ipcRenderer.invoke('ledger:init'),
        getStatus: () => ipcRenderer.invoke('ledger:getStatus'),
        addMessage: (msg: { sender: string; senderName: string; content: string; channel: string }) =>
            ipcRenderer.invoke('ledger:addMessage', msg),
        getBlocks: (page?: number, limit?: number) => ipcRenderer.invoke('ledger:getBlocks', page, limit),
        getBlock: (index: number) => ipcRenderer.invoke('ledger:getBlock', index),
        mineBlock: (validatorId?: string) => ipcRenderer.invoke('ledger:mineBlock', validatorId),
        exportChain: () => ipcRenderer.invoke('ledger:exportChain'),
        getBalance: (userId: string) => ipcRenderer.invoke('ledger:getBalance', userId)
    },
    admin: {
        getStatus: () => ipcRenderer.invoke('admin:getStatus'),
        checkUserId: (userId: string) => ipcRenderer.invoke('admin:checkUserId', userId),
        getRegistryPath: () => ipcRenderer.invoke('admin:getRegistryPath')
    },
    app: {
        runUpdate: () => ipcRenderer.invoke('app:runUpdate'),
        reload: () => ipcRenderer.invoke('app:reload'),
        checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
        getVersion: () => ipcRenderer.invoke('app:getVersion')
    },
    media: {
        searchImages: (query: string) => ipcRenderer.invoke('media:searchImages', query)
    },
    relay: {
        getStatus: () => ipcRenderer.invoke('relay:getStatus'),
        start: () => ipcRenderer.invoke('relay:start'),
        stop: () => ipcRenderer.invoke('relay:stop'),
        onStatusChange: (callback: (status: any) => void) => {
            ipcRenderer.on('relay-status', (_event, status) => callback(status))
        }
    },
    wallet: {
        init: () => ipcRenderer.invoke('wallet:init'),
        getStatus: () => ipcRenderer.invoke('wallet:getStatus'),
        getAddress: () => ipcRenderer.invoke('wallet:getAddress'),
        getBalances: () => ipcRenderer.invoke('wallet:getBalances')
    },
    fileTransfer: {
        package: (filePath: string) => ipcRenderer.invoke('filetransfer:package', filePath),
        extract: (packagePath: string, outputDir?: string) => ipcRenderer.invoke('filetransfer:extract', packagePath, outputDir),
        acceptToggle: (enable: boolean) => ipcRenderer.invoke('filetransfer:acceptToggle', enable),
        isAccepting: () => ipcRenderer.invoke('filetransfer:isAccepting'),
        createContract: (receiverId: string, filePath: string) => ipcRenderer.invoke('filetransfer:createContract', receiverId, filePath),
        acceptContract: (contractId: string) => ipcRenderer.invoke('filetransfer:acceptContract', contractId),
        rejectContract: (contractId: string, reason?: string) => ipcRenderer.invoke('filetransfer:rejectContract', contractId, reason),
        status: () => ipcRenderer.invoke('filetransfer:status'),
        checksum: (filePath: string) => ipcRenderer.invoke('filetransfer:checksum', filePath),
        verify: (packagePath: string) => ipcRenderer.invoke('filetransfer:verify', packagePath)
    }
}

console.log('RangerChat Lite preload loaded - Identity, Ledger, Admin, Relay, Wallet, FileTransfer & App API ready')

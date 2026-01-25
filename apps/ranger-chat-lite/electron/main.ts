import { app, BrowserWindow, Menu, shell, ipcMain, Notification, session } from 'electron'
import path from 'node:path'
import https from 'node:https'
import fs from 'node:fs'
import os from 'node:os'
import { identityService } from './identityService'

// Ledger Service - using require for CommonJS module
// Use local lib in production, relative path in development
const ledgerPath = app.isPackaged
    ? path.join(process.resourcesPath, 'lib', 'ledger-service.cjs')
    : path.join(__dirname, '..', '..', '..', 'rangerblock', 'lib', 'ledger-service.cjs')
const { ledger } = require(ledgerPath)

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN DETECTION - Check ~/.claude/ranger/admin/data/users.json
// ═══════════════════════════════════════════════════════════════════════════
const ADMIN_REGISTRY_PATH = path.join(os.homedir(), '.claude', 'ranger', 'admin', 'data', 'users.json')

interface AdminUser {
    userId: string
    username: string
    publicKeyHash: string
    role: 'supreme' | 'admin' | 'moderator' | 'user' | 'banned'
    created: string
    note?: string
}

interface AdminStatus {
    isAdmin: boolean
    isSupreme: boolean
    isModerator: boolean
    role: string
    adminUsername?: string
}

function getAdminStatus(userId: string): AdminStatus {
    const result: AdminStatus = {
        isAdmin: false,
        isSupreme: false,
        isModerator: false,
        role: 'user'
    }

    try {
        if (fs.existsSync(ADMIN_REGISTRY_PATH)) {
            const data = fs.readFileSync(ADMIN_REGISTRY_PATH, 'utf-8')
            const users: Record<string, AdminUser> = JSON.parse(data)

            if (users[userId]) {
                const user = users[userId]
                result.adminUsername = user.username
                result.role = user.role

                switch (user.role) {
                    case 'supreme':
                        result.isSupreme = true
                        result.isAdmin = true
                        break
                    case 'admin':
                        result.isAdmin = true
                        break
                    case 'moderator':
                        result.isModerator = true
                        break
                    case 'banned':
                        result.role = 'banned'
                        break
                }
            }
        }
    } catch (e) {
        console.error('[Admin] Failed to read admin registry:', e)
    }

    return result
}

// ═══════════════════════════════════════════════════════════════════════════
// VERSION & UPDATE CHECK
// ═══════════════════════════════════════════════════════════════════════════
const APP_VERSION = '1.9.4'
const VERSIONS_URL = 'https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/versions.json'

interface UpdateInfo {
    updateAvailable: boolean
    currentVersion: string
    latestVersion: string | null
    notes?: string
}

async function checkForUpdates(): Promise<UpdateInfo> {
    return new Promise((resolve) => {
        const result: UpdateInfo = {
            updateAvailable: false,
            currentVersion: APP_VERSION,
            latestVersion: null
        }

        const timeout = setTimeout(() => {
            resolve(result)
        }, 5000)

        https.get(VERSIONS_URL, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => {
                clearTimeout(timeout)
                try {
                    const versions = JSON.parse(data)
                    const latest = versions.components?.['ranger-chat-lite']?.version
                    if (latest) {
                        result.latestVersion = latest
                        result.notes = versions.latest?.notes
                        // Compare versions
                        const currentParts = APP_VERSION.split('.').map(Number)
                        const latestParts = latest.split('.').map(Number)
                        for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
                            const c = currentParts[i] || 0
                            const l = latestParts[i] || 0
                            if (c < l) {
                                result.updateAvailable = true
                                break
                            }
                            if (c > l) break
                        }
                    }
                } catch (e) {
                    // Ignore parse errors
                }
                resolve(result)
            })
        }).on('error', () => {
            clearTimeout(timeout)
            resolve(result)
        })
    })
}

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

let win: BrowserWindow | null

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    win = new BrowserWindow({
        width: 450,
        height: 650,
        frame: true, // Enable native frame for menu bar
        transparent: false,
        backgroundColor: '#1a1a2e',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false, // For easier prototyping of local node spawning
        },
    })

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    // 📻 RANGER RADIO: Add User-Agent header for SomaFM streams (fixes 403 errors)
    session.defaultSession.webRequest.onBeforeSendHeaders(
        { urls: ['*://*.somafm.com/*', '*://somafm.com/*'] },
        (details, callback) => {
            details.requestHeaders['User-Agent'] = 'RangerChat/1.8.0 (Electron; RangerPlex)'
            details.requestHeaders['Referer'] = 'https://somafm.com/'
            callback({ requestHeaders: details.requestHeaders })
        }
    )

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(process.env.DIST || __dirname, 'index.html'))
    }
}

// Quit when all windows are closed - force quit on ALL platforms
// (Including macOS - we want the app to fully close when window is closed)
app.on('window-all-closed', () => {
    console.log('[Main] All windows closed - quitting app')
    app.quit()
})

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// Create application menu
function createMenu() {
    const isMac = process.platform === 'darwin'

    const template: Electron.MenuItemConstructorOptions[] = [
        // File Menu
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Connection',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        win?.webContents.send('menu-action', 'new-connection')
                    }
                },
                { type: 'separator' },
                {
                    label: 'Settings',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => {
                        win?.webContents.send('menu-action', 'settings')
                    }
                },
                { type: 'separator' },
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
        // Edit Menu
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        // View Menu
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        // Developer Menu
        {
            label: 'Developer',
            submenu: [
                {
                    role: 'toggleDevTools',
                    label: 'Toggle Developer Tools',
                    accelerator: 'CmdOrCtrl+Shift+I'
                },
                { type: 'separator' },
                {
                    label: 'View Console Logs',
                    accelerator: 'CmdOrCtrl+Shift+C',
                    click: () => {
                        win?.webContents.openDevTools({ mode: 'bottom' })
                    }
                },
                {
                    label: 'Inspect Element',
                    accelerator: 'CmdOrCtrl+Shift+E',
                    click: () => {
                        win?.webContents.inspectElement(0, 0)
                    }
                },
                { type: 'separator' },
                {
                    label: 'Clear Cache & Reload',
                    click: async () => {
                        if (win) {
                            await win.webContents.session.clearCache()
                            win.webContents.reload()
                        }
                    }
                }
            ]
        },
        // Help Menu
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About RangerChat Lite',
                    click: () => {
                        win?.webContents.send('menu-action', 'about')
                    }
                },
                { type: 'separator' },
                {
                    label: 'RangerPlex Website',
                    click: async () => {
                        await shell.openExternal('https://rangerplex.com')
                    }
                },
                {
                    label: 'Report Issue',
                    click: async () => {
                        await shell.openExternal('https://github.com/anthropics/claude-code/issues')
                    }
                }
            ]
        }
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}

// IPC Handlers for Identity Service
ipcMain.handle('identity:has', () => {
    return identityService.hasIdentity()
})

ipcMain.handle('identity:load', () => {
    return identityService.loadIdentity()
})

ipcMain.handle('identity:getOrCreate', (_, username?: string) => {
    return identityService.getOrCreateIdentity(username)
})

ipcMain.handle('identity:generateUsername', () => {
    return identityService.generateRandomUsername()
})

ipcMain.handle('identity:updateUsername', (_, newUsername: string) => {
    return identityService.updateUsername(newUsername)
})

ipcMain.handle('identity:recordMessage', () => {
    identityService.recordMessage()
})

ipcMain.handle('identity:getPaths', () => {
    return identityService.getPaths()
})

ipcMain.handle('identity:export', () => {
    return identityService.exportIdentity()
})

ipcMain.handle('identity:reset', () => {
    identityService.resetIdentity()
})

// ═══════════════════════════════════════════════════════════════════════════
// IPC Handlers for Admin Detection
// ═══════════════════════════════════════════════════════════════════════════
ipcMain.handle('admin:getStatus', async () => {
    const storage = identityService.loadIdentity()
    console.log('[Admin] Raw identity storage:', JSON.stringify(storage, null, 2).substring(0, 500))

    // Identity might be nested in storage.identity
    const identity = (storage as any)?.identity || storage
    const userId = (identity as any)?.userId
    console.log('[Admin] Using userId:', userId)

    if (identity && userId) {
        const status = getAdminStatus(userId)
        console.log(`[Admin] Checked status for ${userId}: ${JSON.stringify(status)}`)
        return status
    }
    console.log('[Admin] No userId found in identity')
    return {
        isAdmin: false,
        isSupreme: false,
        isModerator: false,
        role: 'unknown'
    }
})

ipcMain.handle('admin:checkUserId', (_, userId: string) => {
    return getAdminStatus(userId)
})

ipcMain.handle('admin:getRegistryPath', () => {
    return ADMIN_REGISTRY_PATH
})

// IPC handler for update check
ipcMain.handle('app:checkForUpdates', async () => {
    return checkForUpdates()
})

ipcMain.handle('app:getVersion', () => {
    return APP_VERSION
})

// IPC handler for running update commands (git pull, npm install, reload)
ipcMain.handle('app:runUpdate', async () => {
    // For packaged apps, git pull doesn't work - user needs to download new version
    if (app.isPackaged) {
        return {
            success: false,
            gitPull: {
                success: false,
                output: '',
                error: 'This is a packaged app. Please download the latest version from GitHub releases.'
            },
            npmInstall: { success: false, output: '', error: 'Not applicable for packaged apps' },
            isPackaged: true
        }
    }

    const { exec } = require('child_process')
    const util = require('util')
    const execPromise = util.promisify(exec)

    // Get the app directory (go up from electron folder to app root)
    const appDir = path.join(__dirname, '..')

    const result = {
        success: false,
        gitPull: { success: false, output: '', error: '' },
        npmInstall: { success: false, output: '', error: '' }
    }

    try {
        // Find the git root directory (works for both monorepo and standalone)
        let gitRoot = appDir
        try {
            const gitRootResult = await execPromise('git rev-parse --show-toplevel', { cwd: appDir })
            gitRoot = gitRootResult.stdout.trim()
            console.log('[Update] Git root detected:', gitRoot)
        } catch (e) {
            console.log('[Update] Could not find git root, using app dir:', appDir)
        }

        // Step 1: git pull from git root
        console.log('[Update] Running git pull in:', gitRoot)
        try {
            const gitResult = await execPromise('git pull', { cwd: gitRoot, timeout: 60000 })
            result.gitPull = { success: true, output: gitResult.stdout, error: gitResult.stderr }
            console.log('[Update] git pull:', gitResult.stdout)
        } catch (e: any) {
            result.gitPull = { success: false, output: '', error: e.message }
            console.error('[Update] git pull failed:', e.message)
            return result
        }

        // Step 2: npm install (only if git pull succeeded and there were changes)
        if (result.gitPull.output.includes('Already up to date')) {
            console.log('[Update] No changes, skipping npm install')
            result.npmInstall = { success: true, output: 'Skipped - no changes', error: '' }
        } else {
            // Run npm install in the app directory (ranger-chat-lite)
            console.log('[Update] Running npm install in:', appDir)
            try {
                const npmResult = await execPromise('npm install', { cwd: appDir, timeout: 120000 })
                result.npmInstall = { success: true, output: npmResult.stdout, error: npmResult.stderr }
                console.log('[Update] npm install complete')
            } catch (e: any) {
                result.npmInstall = { success: false, output: '', error: e.message }
                console.error('[Update] npm install failed:', e.message)
                return result
            }
        }

        result.success = true
        return result
    } catch (e: any) {
        console.error('[Update] Error:', e)
        return result
    }
})

// IPC handler to reload the app
ipcMain.handle('app:reload', () => {
    if (win) {
        console.log('[Update] Reloading app...')
        win.webContents.reload()
        return true
    }
    return false
})

// ═══════════════════════════════════════════════════════════════════════════
// IPC Handlers for Ledger Service
// ═══════════════════════════════════════════════════════════════════════════

let ledgerInitialized = false

ipcMain.handle('ledger:init', async () => {
    if (!ledgerInitialized) {
        await ledger.init()
        ledgerInitialized = true
    }
    return true
})

ipcMain.handle('ledger:getStatus', async () => {
    if (!ledgerInitialized) await ledger.init()
    return ledger.getStatus()
})

ipcMain.handle('ledger:addMessage', async (_, message: {
    sender: string
    senderName: string
    content: string
    channel: string
    signature?: string
}) => {
    if (!ledgerInitialized) await ledger.init()
    return ledger.addMessage(message)
})

ipcMain.handle('ledger:getBlocks', async (_, page: number = 0, limit: number = 10) => {
    if (!ledgerInitialized) await ledger.init()
    return ledger.getBlocks(page, limit)
})

ipcMain.handle('ledger:getBlock', async (_, index: number) => {
    if (!ledgerInitialized) await ledger.init()
    return ledger.getBlock(index)
})

ipcMain.handle('ledger:getMessagesByChannel', async (_, channel: string, page: number = 0, limit: number = 50) => {
    if (!ledgerInitialized) await ledger.init()
    return ledger.getMessagesByChannel(channel, page, limit)
})

ipcMain.handle('ledger:getTransactionsByUser', async (_, userId: string, page: number = 0, limit: number = 50) => {
    if (!ledgerInitialized) await ledger.init()
    return ledger.getTransactionsByUser(userId, page, limit)
})

ipcMain.handle('ledger:verifyMessage', async (_, contentHash: string) => {
    if (!ledgerInitialized) await ledger.init()
    return ledger.verifyMessage(contentHash)
})

ipcMain.handle('ledger:mineBlock', async (_, validatorId?: string) => {
    if (!ledgerInitialized) await ledger.init()
    const block = await ledger.mineBlock(validatorId || 'local')
    return block ? block.toJSON() : null
})

ipcMain.handle('ledger:exportChain', async () => {
    if (!ledgerInitialized) await ledger.init()
    return ledger.exportChain()
})

ipcMain.handle('ledger:exportUserAudit', async (_, userId: string) => {
    if (!ledgerInitialized) await ledger.init()
    return ledger.exportUserAudit(userId)
})

// Wallet-ready endpoints (future use)
ipcMain.handle('ledger:getBalance', async (_, userId: string) => {
    if (!ledgerInitialized) await ledger.init()
    return ledger.getBalance(userId)
})

ipcMain.handle('ledger:addReward', async (_, userId: string, amount: number, reason: string) => {
    if (!ledgerInitialized) await ledger.init()
    return ledger.addReward(userId, amount, reason)
})

app.whenReady().then(async () => {
    createMenu()
    createWindow()

    // Initialize ledger on startup
    try {
        await ledger.init()
        ledgerInitialized = true
        console.log('[Main] Ledger initialized successfully')
    } catch (e) {
        console.error('[Main] Failed to initialize ledger:', e)
    }

    // Check for updates after window loads
    setTimeout(async () => {
        const updateInfo = await checkForUpdates()
        if (updateInfo.updateAvailable && win) {
            // Send update notification to renderer
            win.webContents.send('update-available', updateInfo)

            // Also show native notification if supported
            if (Notification.isSupported()) {
                const notification = new Notification({
                    title: 'RangerChat Update Available',
                    body: `Version ${updateInfo.latestVersion} is available (you have ${updateInfo.currentVersion})`
                })
                notification.show()
            }
        }
    }, 3000) // Wait 3 seconds after startup
})

// Cleanup on quit
app.on('before-quit', async (_event) => {
    console.log('[Main] App is quitting - cleaning up...')

    // Shutdown ledger if initialized
    if (ledgerInitialized) {
        try {
            await ledger.shutdown()
            console.log('[Main] Ledger shutdown complete')
        } catch (e) {
            console.error('[Main] Error shutting down ledger:', e)
        }
    }

    // Close any remaining windows
    if (win && !win.isDestroyed()) {
        win.destroy()
        win = null
    }
})

// Force exit when quitting to ensure all processes are killed
app.on('will-quit', (_event) => {
    console.log('[Main] Will quit - forcing process exit')
    // Small delay to ensure cleanup completes, then force exit
    setTimeout(() => {
        process.exit(0)
    }, 100)
})

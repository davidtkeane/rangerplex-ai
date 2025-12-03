import { app, BrowserWindow, Menu, shell, ipcMain, dialog, Notification } from 'electron'
import path from 'node:path'
import https from 'node:https'
import { identityService, UserIdentity } from './identityService'

// ═══════════════════════════════════════════════════════════════════════════
// VERSION & UPDATE CHECK
// ═══════════════════════════════════════════════════════════════════════════
const APP_VERSION = '1.3.1'
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

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(process.env.DIST || __dirname, 'index.html'))
    }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
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

// IPC handler for update check
ipcMain.handle('app:checkForUpdates', async () => {
    return checkForUpdates()
})

ipcMain.handle('app:getVersion', () => {
    return APP_VERSION
})

app.whenReady().then(async () => {
    createMenu()
    createWindow()

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

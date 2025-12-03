import { app, BrowserWindow, Menu, shell } from 'electron'
import path from 'node:path'

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

app.whenReady().then(() => {
    createMenu()
    createWindow()
})

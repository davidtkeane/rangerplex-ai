const { app, BrowserWindow, shell, globalShortcut, BrowserView, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

// Global reference to prevent garbage collection
let mainWindow;
let serverProcess;
let views = new Map(); // tabId -> BrowserView
let activeTabId = null;

const SERVER_PORT = 5173; // Vite dev server port
const PROXY_PORT = 3010;  // Proxy server port

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        title: 'RangerPlex Browser',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false, // Security: Keep true browser isolation
            contextIsolation: true, // Security: Protect the renderer
        },
    });

    // Load the app
    const startUrl = `http://localhost:${SERVER_PORT}`;
    console.log(`Loading RangerPlex from: ${startUrl}`);
    mainWindow.loadURL(startUrl);

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // IPC Handlers for Browser Functionality
    setupIpcHandlers();
}

function setupIpcHandlers() {
    // 1. Create Tab (BrowserView)
    ipcMain.handle('create-tab', (event, { id, url }) => {
        const view = new BrowserView({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            }
        });

        mainWindow.setBrowserView(view);
        view.webContents.loadURL(url);

        // Auto-resize with window
        view.setAutoResize({ width: true, height: true });

        views.set(id, view);
        activeTabId = id;

        // Initial bounds (will be updated by resize-view)
        const bounds = mainWindow.getBounds();
        view.setBounds({ x: 0, y: 84, width: bounds.width, height: bounds.height - 84 });

        return true;
    });

    // 2. Switch Tab
    ipcMain.handle('switch-tab', (event, id) => {
        const view = views.get(id);
        if (view) {
            mainWindow.setBrowserView(view);
            activeTabId = id;
        }
        return true;
    });

    // 3. Update View Bounds (Responsive UI)
    ipcMain.handle('resize-view', (event, bounds) => {
        const view = views.get(activeTabId);
        if (view) {
            view.setBounds(bounds);
        }
    });

    // 4. THE LENS: Get Page Text
    ipcMain.handle('get-page-text', async () => {
        const view = views.get(activeTabId);
        if (!view) return null;

        try {
            // Execute JS to get readable text
            const text = await view.webContents.executeJavaScript(`
        document.body.innerText
      `);
            return text;
        } catch (error) {
            console.error('Lens Error:', error);
            return null;
        }
    });

    // 5. Navigate
    ipcMain.handle('navigate', (event, { id, url }) => {
        const view = views.get(id);
        if (view) {
            view.webContents.loadURL(url);
        }
    });

    // 6. Close Tab
    ipcMain.handle('close-tab', (event, id) => {
        const view = views.get(id);
        if (view) {
            // If it's the active one, remove it from window
            if (activeTabId === id) {
                mainWindow.setBrowserView(null);
                activeTabId = null;
            }
            // Destroy the view
            // view.webContents.destroy(); // Optional, garbage collection handles it
            views.delete(id);
        }
    });

    // 7. MINI-OS: File System API
    const fs = require('fs').promises;

    // List Directory
    ipcMain.handle('fs-read-dir', async (event, dirPath) => {
        try {
            const dirents = await fs.readdir(dirPath, { withFileTypes: true });
            return dirents.map(dirent => ({
                name: dirent.name,
                isDirectory: dirent.isDirectory(),
                path: path.join(dirPath, dirent.name)
            }));
        } catch (err) {
            console.error('FS Error:', err);
            return { error: err.message };
        }
    });

    // Read File
    ipcMain.handle('fs-read-file', async (event, filePath) => {
        try {
            return await fs.readFile(filePath, 'utf8');
        } catch (err) {
            return { error: err.message };
        }
    });

    // Write File (For Notes/Chats)
    ipcMain.handle('fs-write-file', async (event, { filePath, content }) => {
        try {
            await fs.writeFile(filePath, content, 'utf8');
            return { success: true };
        } catch (err) {
            return { error: err.message };
        }
    });

    // 8. MINI-OS: Floating Terminal
    let floatingTerminalWindow = null;

    ipcMain.handle('toggle-floating-terminal', () => {
        if (floatingTerminalWindow) {
            if (floatingTerminalWindow.isVisible()) {
                floatingTerminalWindow.hide();
            } else {
                floatingTerminalWindow.show();
            }
            return;
        }

        floatingTerminalWindow = new BrowserWindow({
            width: 600,
            height: 400,
            frame: false, // Frameless
            alwaysOnTop: true, // Floating
            transparent: true, // Glass effect
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false,
                contextIsolation: true,
            },
        });

        // Load a specific route for the terminal
        floatingTerminalWindow.loadURL(`http://localhost:${SERVER_PORT}/terminal-popup`);

        floatingTerminalWindow.on('closed', () => {
            floatingTerminalWindow = null;
        });
    });
}

function startServer() {
    console.log('Starting RangerPlex Server...');

    // We spawn 'npm run start' which runs both Vite and the Proxy
    // Note: In a real build, we would spawn the compiled node server directly
    serverProcess = spawn('npm', ['run', 'start'], {
        cwd: path.join(__dirname, '..'),
        shell: true,
        stdio: 'inherit', // Pipe output to console
    });

    serverProcess.on('error', (err) => {
        console.error('Failed to start server:', err);
    });
}

function waitForServer(port) {
    return new Promise((resolve) => {
        const tryConnect = () => {
            const req = http.get(`http://localhost:${port}`, (res) => {
                if (res.statusCode === 200) {
                    resolve();
                } else {
                    setTimeout(tryConnect, 1000);
                }
            });
            req.on('error', () => setTimeout(tryConnect, 1000));
            req.end();
        };
        tryConnect();
    });
}

// 👻 GHOST PROTOCOL: The Panic Button
function activateGhostProtocol() {
    console.log('👻 GHOST PROTOCOL ACTIVATED!');

    if (mainWindow) {
        // 1. Hide the window instantly
        mainWindow.hide();

        // 2. Send message to Renderer to lock vault & clear RAM
        mainWindow.webContents.send('fromMain', 'GHOST_PROTOCOL_TRIGGERED');

        // 3. Clear history/cache
        mainWindow.webContents.session.clearCache();
        mainWindow.webContents.session.clearStorageData();

        // Destroy all views
        views.forEach(view => {
            // view.webContents.destroy();
        });
        views.clear();
        mainWindow.setBrowserView(null);

        console.log('👻 RAM wiped. Views destroyed. Window hidden.');
    }
}

app.whenReady().then(async () => {
    startServer();

    // Wait for Vite to be ready before showing the window
    // This prevents the "Connection Refused" white screen
    console.log('Waiting for RangerPlex to be ready...');
    await waitForServer(SERVER_PORT);

    createWindow();

    // Register Panic Button: Cmd+Shift+Esc (Mac) or Ctrl+Shift+Esc (Win/Linux)
    const ret = globalShortcut.register('CommandOrControl+Shift+Esc', () => {
        activateGhostProtocol();
    });

    if (!ret) console.log('Ghost Protocol shortcut registration failed');

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
    // Unregister shortcuts
    globalShortcut.unregisterAll();

    // Kill the child process when the app quits
    if (serverProcess) {
        serverProcess.kill();
    }
});

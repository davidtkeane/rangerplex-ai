const { app, BrowserWindow, shell, globalShortcut, BrowserView, ipcMain, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

// Global reference to prevent garbage collection
let mainWindow;
let serverProcess;
let views = new Map(); // tabId -> BrowserView

let activeTabId = null;
let openLinksInApp = false;

const SERVER_PORT = 5173; // Vite dev server port
const PROXY_PORT = 3010;  // Proxy server port

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        title: 'RangerPlex Browser',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false, // Security: Keep true browser isolation
            contextIsolation: true, // Security: Protect the renderer
        },
    });

    // Load the app
    const startUrl = `http://127.0.0.1:${SERVER_PORT}`;
    console.log(`Loading RangerPlex from: ${startUrl}`);
    mainWindow.loadURL(startUrl);

    // Open DevTools for debugging - Commented out for production
    // mainWindow.webContents.openDevTools();

    mainWindow.webContents.on('did-finish-load', () => {
        console.log('✅ Page loaded successfully');
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error(`❌ Page failed to load: ${errorCode} - ${errorDescription}`);
    });

    // Handle external links
    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (openLinksInApp) {
            mainWindow.webContents.send('request-open-url', url);
            return { action: 'deny' };
        }
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
            // Destroy the view to free resources
            try {
                view.webContents.destroy();
            } catch (err) {
                console.warn('Error destroying webContents', err);
            }
            try {
                view.destroy();
            } catch (err) {
                console.warn('Error destroying BrowserView', err);
            }
            views.delete(id);
        }
    });

    // 6b. Navigation helpers
    ipcMain.handle('go-back', (event, id) => {
        const view = views.get(id || activeTabId);
        if (view && view.webContents.canGoBack()) {
            view.webContents.goBack();
        }
    });

    ipcMain.handle('go-forward', (event, id) => {
        const view = views.get(id || activeTabId);
        if (view && view.webContents.canGoForward()) {
            view.webContents.goForward();
        }
    });

    ipcMain.handle('reload-tab', (event, id) => {
        const view = views.get(id || activeTabId);
        if (view) {
            view.webContents.reload();
        }
    });

    ipcMain.handle('get-nav-state', (event, id) => {
        const view = views.get(id || activeTabId);
        if (!view) return { canGoBack: false, canGoForward: false };
        return {
            canGoBack: view.webContents.canGoBack(),
            canGoForward: view.webContents.canGoForward()
        };
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

    // Get File Stats (Metadata)
    ipcMain.handle('fs-stat', async (event, filePath) => {
        try {
            const stats = await fs.stat(filePath);
            return {
                size: stats.size,
                atime: stats.atime,
                mtime: stats.mtime,
                ctime: stats.ctime,
                birthtime: stats.birthtime,
                isFile: stats.isFile(),
                isDirectory: stats.isDirectory(),
                mode: stats.mode,
                uid: stats.uid,
                gid: stats.gid
            };
        } catch (err) {
            return { error: err.message };
        }
    });

    // Read File Buffer (For EXIF/Binary analysis)
    // Reads first 64KB by default if size not specified, which is usually enough for headers/EXIF
    ipcMain.handle('fs-read-buffer', async (event, { filePath, size }) => {
        try {
            const fd = await fs.open(filePath, 'r');
            const bufferSize = size || 65536; // Default 64KB
            const buffer = Buffer.alloc(bufferSize);
            const { bytesRead } = await fd.read(buffer, 0, bufferSize, 0);
            await fd.close();
            return buffer.subarray(0, bytesRead);
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
                preload: path.join(__dirname, 'preload.cjs'),
                contextIsolation: true,
                nodeIntegration: false,
                webviewTag: true // Enable <webview> tag
            }
        });

        // Load a specific route for the terminal
        floatingTerminalWindow.loadURL(`http://localhost:${SERVER_PORT}/terminal-popup`);

        floatingTerminalWindow.on('closed', () => {
            floatingTerminalWindow = null;
        });
    });

    // 9. WORDPRESS INTEGRATION (Project PRESS FORGE)
    // Scan for Local by Flywheel WordPress installations
    ipcMain.handle('wordpress-scan-local-sites', async () => {
        try {
            const os = require('os');
            const localSitesPath = path.join(os.homedir(), 'Local Sites');

            console.log(`🔍 Scanning for WordPress sites in: ${localSitesPath}`);

            // Check if Local Sites directory exists
            try {
                await fs.access(localSitesPath);
            } catch {
                console.log('Local Sites directory not found');
                return [];
            }

            const sites = [];
            const entries = await fs.readdir(localSitesPath, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const sitePath = path.join(localSitesPath, entry.name);
                    const configPath = path.join(sitePath, 'conf', 'local-site.json');

                    try {
                        const configData = await fs.readFile(configPath, 'utf8');
                        const config = JSON.parse(configData);

                        sites.push({
                            name: entry.name,
                            path: sitePath,
                            url: `http://${entry.name}.local`,
                            status: 'unknown', // Will be determined by checking if site is running
                            phpVersion: config.phpVersion || 'unknown',
                            wpVersion: config.wpVersion || 'unknown'
                        });
                    } catch (err) {
                        // Site doesn't have config, skip it
                        // console.log(`Skipping ${entry.name}: No config found`);
                    }
                }
            }

            console.log(`✅ Found ${sites.length} WordPress sites`);
            return sites;
        } catch (error) {
            console.error('Error scanning WordPress sites:', error);
            return { error: error.message };
        }
    });

    // Check if Docker is available
    ipcMain.handle('docker-check', async () => {
        try {
            const { exec } = require('child_process');
            return new Promise((resolve) => {
                exec('docker --version', (error) => {
                    resolve(!error);
                });
            });
        } catch {
            return false;
        }
    });

    // Docker Compose commands
    ipcMain.handle('docker-compose', async (event, { command, file }) => {
        try {
            const { exec } = require('child_process');
            const projectRoot = path.join(__dirname, '..');
            const composeFile = path.join(projectRoot, file);

            return new Promise((resolve, reject) => {
                const cmd = `docker-compose -f "${composeFile}" ${command}`;
                console.log(`🐳 Running: ${cmd}`);

                // Fix PATH for macOS GUI apps
                const env = Object.assign({}, process.env);
                env.PATH = '/opt/homebrew/bin:/usr/local/bin:' + (env.PATH || '');
                // console.log(`🐳 PATH: ${env.PATH}`);

                exec(cmd, { cwd: projectRoot, env }, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Docker error: ${stderr}`);
                        console.error(`Docker error message: ${error.message}`);
                        resolve({ error: stderr || error.message });
                    } else {
                        console.log(`Docker output: ${stdout}`);
                        // Docker Compose often outputs to stderr even on success
                        resolve({ output: stdout + '\n' + stderr });
                    }
                });
            });
        } catch (error) {
            console.error('Docker compose error:', error);
            return { error: error.message };
        }
    });

    // Open external URL (for wp-admin)
    ipcMain.handle('open-external', async (event, url) => {
        try {
            await shell.openExternal(url);
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    });

    // Show system notification
    ipcMain.handle('show-notification', async (event, { title, body }) => {
        try {
            const { Notification } = require('electron');
            new Notification({ title, body }).show();
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    });

    // 10. Set Link Behavior
    ipcMain.handle('set-link-behavior', (event, enabled) => {
        openLinksInApp = enabled;
        return true;
    });

    // 11. FORENSICS: Hash File
    ipcMain.handle('forensics-hash', async (event, { filePath, algorithm }) => {
        try {
            const crypto = require('crypto');
            const fs = require('fs');

            return new Promise((resolve, reject) => {
                const hash = crypto.createHash(algorithm);
                const stream = fs.createReadStream(filePath);

                stream.on('error', err => resolve({ error: err.message }));
                stream.on('data', chunk => hash.update(chunk));
                stream.on('end', () => resolve(hash.digest('hex')));
            });
        } catch (error) {
            return { error: error.message };
        }
    });
}

function setupMenu() {
    const isMac = process.platform === 'darwin';

    const template = [
        // { role: 'appMenu' }
        ...(isMac ? [{
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] : []),
        // { role: 'fileMenu' }
        {
            label: 'File',
            submenu: [
                { role: 'close' } // Standard Close
            ]
        },
        // { role: 'editMenu' }
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'delete' },
                { role: 'selectAll' }
            ]
        },
        // { role: 'viewMenu' }
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' }, // <--- THIS IS WHAT THE USER WANTS
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        // { role: 'windowMenu' }
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                ...(isMac ? [
                    { type: 'separator' },
                    { role: 'front' },
                    { type: 'separator' },
                    { role: 'window' }
                ] : [
                    { role: 'close' }
                ])
            ]
        },
        // { role: 'helpMenu' } - Developer Tools
        {
            label: 'Developer',
            submenu: [
                { role: 'toggleDevTools', label: 'Toggle Developer Tools (Console)' },
                { role: 'reload' },
                { role: 'forceReload' },
                { type: 'separator' },
                {
                    label: 'Inspect Element',
                    click: () => {
                        if (mainWindow) mainWindow.webContents.inspectElement(0, 0);
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function startServer() {
    console.log('Starting RangerPlex Server...');

    // We spawn 'npm run start' which runs both Vite and the Proxy
    // We set BROWSER=none to prevent Vite from opening a tab
    const env = Object.assign({}, process.env, { BROWSER: 'none' });

    serverProcess = spawn('npm', ['run', 'start'], {
        cwd: path.join(__dirname, '..'),
        shell: true,
        stdio: 'inherit',
        env: env,
        detached: true
    });

    serverProcess.on('error', (err) => {
        console.error('Failed to start server:', err);
    });
}

function waitForServer(port) {
    return new Promise((resolve) => {
        const tryConnect = () => {
            console.log(`Checking server at http://127.0.0.1:${port}...`);
            const req = http.get(`http://127.0.0.1:${port}`, (res) => {
                if (res.statusCode === 200) {
                    console.log('Server is ready!');
                    resolve();
                } else {
                    console.log(`Server responded with ${res.statusCode}, waiting...`);
                    setTimeout(tryConnect, 1000);
                }
            });
            req.on('error', (err) => {
                console.log(`Server check failed: ${err.message}, waiting...`);
                setTimeout(tryConnect, 1000);
            });
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
    setupMenu();
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

    // Kill the child process tree when the app quits
    if (serverProcess) {
        try {
            // Kill the process group (negative PID) to ensure all children (Vite, Server) die
            process.kill(-serverProcess.pid, 'SIGTERM');
        } catch (e) {
            console.error('Failed to kill server process:', e);
        }
    }
});

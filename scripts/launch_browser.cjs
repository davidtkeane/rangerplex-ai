const { spawn, exec } = require('child_process');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const mode = args[0] || ''; // '', '-t', or '-b'

const SERVER_URL = 'http://localhost:5173';

function openTab() {
    console.log(`🌐 Opening browser tab: ${SERVER_URL}`);
    const startCommand = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${startCommand} ${SERVER_URL}`);
}

function openElectron() {
    console.log('🖥️  Starting Electron App...');
    const electronPath = path.join(__dirname, '..', 'electron', 'main.cjs');
    const electronBinary = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');

    console.log(`   Binary: ${electronBinary}`);
    console.log(`   Main:   ${electronPath}`);

    const child = spawn(electronBinary, [electronPath], {
        stdio: 'inherit',
        shell: false, // shell: true can cause issues with path resolution
        cwd: path.join(__dirname, '..')
    });

    child.on('error', (err) => {
        console.error('Failed to start Electron:', err);
    });

    child.on('close', (code) => {
        console.log(`Electron exited with code ${code}`);
        process.exit(code);
    });

    // Handle Ctrl+C from terminal
    process.on('SIGINT', () => {
        console.log('Received SIGINT, killing Electron...');
        child.kill();
        process.exit();
    });
}

console.log(`🚀 Launch Mode: ${mode || 'Default (Electron Only)'}`);

switch (mode) {
    case '-t': // Tab Only
        openTab();
        break;
    case '-b': // Both
        openTab();
        // Wait a moment for the tab to open before starting Electron (optional, but nice)
        setTimeout(openElectron, 1000);
        break;
    default: // Electron Only (Default)
        cleanupPorts().then(openElectron);
        break;
}

function cleanupPorts() {
    return new Promise((resolve) => {
        if (process.platform !== 'darwin' && process.platform !== 'linux') {
            resolve(); // Skip on Windows for now (requires different command)
            return;
        }

        console.log('🧹 Cleaning up ports 3010 and 5173...');
        // Kill processes on port 3010 (Server) and 5173 (Vite)
        // lsof -ti:3010,5173 returns PIDs. xargs kill -9 kills them.
        exec('lsof -ti:3010,5173 | xargs kill -9', (error) => {
            // We ignore errors because if no process is found, lsof returns exit code 1
            // console.log('Cleanup done');
            resolve();
        });
    });
}

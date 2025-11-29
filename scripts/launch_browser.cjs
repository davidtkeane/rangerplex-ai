const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// --- NODE VERSION CHECK ---
const nodeVersion = process.version; // e.g., 'v25.2.1'
const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0], 10);

if (majorVersion >= 25) {
    console.error('\n❌ CRITICAL ERROR: Node.js Version Too New!');
    console.error(`   You are running Node.js ${nodeVersion}, which breaks native modules.`);
    console.error('   RangerPlex requires Node.js v22 (LTS) or v20 (LTS).\n');

    console.error('👉 HOW TO FIX (Downgrade to v22):');

    if (os.platform() === 'darwin') {
        console.error('\n🍎 macOS (using nvm):');
        console.error('   nvm install 22');
        console.error('   nvm use 22');
        console.error('   nvm alias default 22');
        console.error('\n🍎 macOS (using Homebrew):');
        console.error('   brew unlink node');
        console.error('   brew install node@22');
        console.error('   brew link --overwrite node@22');
    } else if (os.platform() === 'win32') {
        console.error('\n🪟 Windows (using nvm-windows):');
        console.error('   nvm install 22');
        console.error('   nvm use 22');
        console.error('\n🪟 Windows (Manual):');
        console.error('   Uninstall Node.js from Control Panel.');
        console.error('   Download v22 LTS from: https://nodejs.org/');
    } else {
        console.error('\n🐧 Linux:');
        console.error('   nvm install 22');
        console.error('   nvm use 22');
    }

    console.error('\n⚠️  AFTER DOWNGRADING, RUN:');
    console.error('   rm -rf node_modules package-lock.json');
    console.error('   npm install');
    console.error('\n');
    process.exit(1);
}
// --------------------------

// Parse arguments
const args = process.argv.slice(2);
const mode = args[0] || ''; // '', '-t', or '-b'

const SERVER_URL = 'http://localhost:5173';

// --- DOCKER DESKTOP AUTO-START ---
function ensureDockerRunning() {
    return new Promise((resolve) => {
        console.log('🐳 Checking Docker Desktop status...');

        // Check if Docker is running by trying to execute 'docker info'
        exec('docker info', (error) => {
            if (!error) {
                console.log('✅ Docker Desktop is already running');
                resolve();
                return;
            }

            console.log('⚠️  Docker Desktop is not running. Starting it now...');

            let startCommand;

            if (process.platform === 'darwin') {
                // macOS
                startCommand = 'open -a "Docker Desktop"';
            } else if (process.platform === 'win32') {
                // Windows
                startCommand = 'start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"';
            } else {
                // Linux
                startCommand = 'systemctl --user start docker-desktop || (echo "Starting Docker Desktop..." && docker-desktop &)';
            }

            exec(startCommand, (startError) => {
                if (startError) {
                    console.warn('⚠️  Could not auto-start Docker Desktop. Please start it manually.');
                    console.warn('   Continuing anyway...');
                    resolve();
                    return;
                }

                console.log('🐳 Docker Desktop is starting... waiting 10 seconds for initialization');

                // Wait for Docker to fully start
                let attempts = 0;
                const maxAttempts = 20; // 20 attempts * 1 second = 20 seconds max wait

                const checkInterval = setInterval(() => {
                    exec('docker info', (checkError) => {
                        if (!checkError) {
                            clearInterval(checkInterval);
                            console.log('✅ Docker Desktop is now running');
                            resolve();
                        } else {
                            attempts++;
                            if (attempts >= maxAttempts) {
                                clearInterval(checkInterval);
                                console.warn('⚠️  Docker Desktop is taking longer than expected to start.');
                                console.warn('   Continuing anyway...');
                                resolve();
                            } else {
                                process.stdout.write('.');
                            }
                        }
                    });
                }, 1000);
            });
        });
    });
}
// --------------------------

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
        if (err.code === 'ENOENT') {
            console.error('\n❌ Electron not found!');
            console.error('   This usually means dependencies are missing.');
            console.error('   👉 Please run: npm install\n');
        } else {
            console.error(`Failed to start Electron: ${err}`);
        }
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
        ensureDockerRunning().then(openTab);
        break;
    case '-b': // Both
        ensureDockerRunning().then(() => {
            openTab();
            // Wait a moment for the tab to open before starting Electron (optional, but nice)
            setTimeout(openElectron, 1000);
        });
        break;
    default: // Electron Only (Default)
        ensureDockerRunning()
            .then(cleanupPorts)
            .then(openElectron);
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

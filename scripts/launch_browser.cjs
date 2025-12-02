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
const skipDocker = args.includes('--skip-docker') || args.includes('-sd');

const SERVER_URL = 'http://localhost:5173';

// --- DOCKER DESKTOP AUTO-START ---
function ensureDockerRunning() {
    return new Promise((resolve) => {
        if (skipDocker) {
            console.log('🐳 Docker check skipped (--skip-docker flag)');
            resolve();
            return;
        }
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

// RangerPlex ports to manage (includes MCP gateway port 8808)
const RANGERPLEX_PORTS = [3000, 5173, 5555, 5005, 8808];
const PROXY_PORT = 3000;

function cleanupPorts() {
    return new Promise((resolve) => {
        console.log(`🧹 Cleaning up ports: ${RANGERPLEX_PORTS.join(', ')}...`);

        if (process.platform === 'win32') {
            // Windows: Use netstat and taskkill
            let killedCount = 0;
            let processedCount = 0;

            RANGERPLEX_PORTS.forEach((port, index) => {
                exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
                    if (!error && stdout) {
                        const lines = stdout.trim().split('\n');
                        lines.forEach(line => {
                            const parts = line.trim().split(/\s+/);
                            const pid = parts[parts.length - 1];
                            if (pid && pid.match(/^\d+$/)) {
                                exec(`taskkill /PID ${pid} /F 2>nul`, () => {
                                    killedCount++;
                                });
                            }
                        });
                    }
                    processedCount++;
                    if (processedCount === RANGERPLEX_PORTS.length) {
                        setTimeout(() => {
                            console.log(`✅ Port cleanup complete (${killedCount} processes killed)`);
                            resolve();
                        }, 500);
                    }
                });
            });

            // Fallback timeout
            setTimeout(() => {
                if (processedCount < RANGERPLEX_PORTS.length) {
                    console.log('✅ Port cleanup timed out, continuing...');
                    resolve();
                }
            }, 3000);
        } else {
            // Unix/macOS: Use lsof
            const portList = RANGERPLEX_PORTS.join(',');
            exec(`lsof -ti:${portList} | xargs kill -9 2>/dev/null`, (error) => {
                console.log('✅ Port cleanup complete');
                resolve();
            });
        }
    });
}

// Start the MCP Gateway via the proxy server API
function startMcpGateway() {
    return new Promise((resolve) => {
        console.log('🔌 Starting MCP Gateway...');

        // Use http module to call the ensure endpoint
        const http = require('http');
        const postData = JSON.stringify({});

        const options = {
            hostname: 'localhost',
            port: PROXY_PORT,
            path: '/api/mcp/ensure',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.success) {
                        console.log(`✅ MCP Gateway ${result.status || 'started'}`);
                    } else {
                        console.warn('⚠️  MCP Gateway response:', result);
                    }
                } catch (e) {
                    console.warn('⚠️  MCP Gateway response parse error');
                }
                resolve();
            });
        });

        req.on('error', (err) => {
            console.warn('⚠️  Could not start MCP Gateway:', err.message);
            console.warn('   You can start it manually: /mcp-tools or call /api/mcp/ensure');
            resolve();
        });

        req.setTimeout(5000, () => {
            console.warn('⚠️  MCP Gateway request timed out');
            req.destroy();
            resolve();
        });

        req.write(postData);
        req.end();
    });
}

// Start MCP Gateway after Electron/servers are ready
function startMcpGatewayDelayed() {
    return new Promise((resolve) => {
        // Wait for servers to be fully up (Electron starts them)
        console.log('⏳ Waiting for servers to initialize...');
        setTimeout(() => {
            startMcpGateway().then(resolve);
        }, 8000); // Wait 8 seconds for Electron to start servers
    });
}

function startServers() {
    console.log('🚀 Starting RangerPlex servers...');
    const proxyPath = path.join(__dirname, '..', 'proxy_server.js');
    const vitePath = path.join(__dirname, '..', 'node_modules', 'vite', 'bin', 'vite.js');

    // Start proxy server
    const proxyServer = spawn('node', [proxyPath], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });

    proxyServer.on('error', (err) => {
        console.error(`❌ Failed to start proxy server: ${err.message}`);
    });

    // Start Vite dev server
    setTimeout(() => {
        const viteServer = spawn('node', [vitePath, '--host'], {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..'),
            env: { ...process.env, BROWSER: 'none' }
        });

        viteServer.on('error', (err) => {
            console.error(`❌ Failed to start Vite server: ${err.message}`);
        });
    }, 1000);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down servers...');
        proxyServer.kill();
        process.exit(0);
    });

    console.log('✅ Servers starting...');
}

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
        console.log('\nReceived SIGINT, shutting down...');
        child.kill();
        shutdownServers();
        process.exit(0);
    });
}

console.log(`🚀 Launch Mode: ${mode || 'Default (Electron Only)'}`);
console.log('📋 Startup sequence: Docker → Port cleanup → UI → MCP Gateway\n');

switch (mode) {
    case '-t': // Tab Only (browser tab) - start servers and open browser
        ensureDockerRunning()
            .then(cleanupPorts)
            .then(() => {
                console.log('\n🎉 Starting servers and opening browser...\n');
                startServers();
                setTimeout(() => {
                    openTab();
                    startMcpGateway();
                }, 3000); // Wait for servers to start
            });
        break;
    case '-b': // Both (browser + Electron)
        ensureDockerRunning()
            .then(cleanupPorts)
            .then(() => {
                console.log('\n🎉 Opening browser and Electron...\n');
                openTab();
                setTimeout(openElectron, 1000);
                // Start MCP gateway after servers are up
                startMcpGatewayDelayed();
            });
        break;
    default: // Electron Only (Default) - Electron handles servers
        ensureDockerRunning()
            .then(cleanupPorts)
            .then(() => {
                console.log('\n🎉 Starting Electron (servers will auto-start)...\n');
                openElectron();
                // Start MCP gateway after Electron starts servers
                startMcpGatewayDelayed();
            });
        break;
}

function shutdownServers() {
    // Electron manages the servers, so we just need to ensure ports are clean if needed
    // But usually Electron's will-quit handler takes care of it.
    // We can run cleanupPorts() to be sure, but it might be aggressive.
    console.log('🧹 Shutting down...');
    cleanupPorts();
}

// Note: We don't shutdown servers on exit anymore since Electron manages them
// The cleanup only happens if user explicitly closes the launch script

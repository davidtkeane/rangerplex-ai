const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * CodeServerManager - Smart VS Code Server Management
 *
 * UPGRADE: Now detects existing code-server instances before starting new ones.
 * This follows the RangerOS pattern of reusing existing services.
 *
 * Priority order:
 * 1. Check common ports for existing code-server (8181, 8080, 8443)
 * 2. Read ~/.config/code-server/config.yaml for configured port
 * 3. Fall back to starting new instance on port 8081
 *
 * This ensures:
 * - Works for David's setup (existing code-server on 8181)
 * - Works for GitHub users who clone fresh (starts new instance)
 *
 * @author David Keane & Ranger (AIRanger)
 * @date January 11, 2026
 */
class CodeServerManager {
    constructor() {
        this.process = null;
        this.port = 8081; // Default fallback port
        this.token = this.generateToken();
        this.workspaceDir = process.cwd();
        this.usingExisting = false; // Track if we're using existing server
    }

    generateToken() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    /**
     * Check if code-server is already running on a given port
     */
    async checkPort(port) {
        try {
            const response = await fetch(`http://127.0.0.1:${port}/healthz`, {
                signal: AbortSignal.timeout(2000) // 2 second timeout
            });
            if (response.ok) {
                return true;
            }
        } catch (err) {
            // Port not responding
        }
        return false;
    }

    /**
     * Try to read port from code-server config file
     */
    getConfiguredPort() {
        try {
            const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.config', 'code-server', 'config.yaml');
            if (fs.existsSync(configPath)) {
                const config = fs.readFileSync(configPath, 'utf8');
                // Parse bind-addr: 127.0.0.1:8181
                const match = config.match(/bind-addr:\s*[\d.]+:(\d+)/);
                if (match) {
                    return parseInt(match[1], 10);
                }
            }
        } catch (err) {
            // Config file not found or not readable
        }
        return null;
    }

    /**
     * Detect existing code-server instance
     * Returns the port if found, null otherwise
     */
    async detectExistingServer() {
        console.log('🔍 Checking for existing code-server...');

        // Priority 1: Check config file for configured port
        const configuredPort = this.getConfiguredPort();
        if (configuredPort) {
            console.log(`   📄 Found config port: ${configuredPort}`);
            if (await this.checkPort(configuredPort)) {
                console.log(`   ✅ code-server running on configured port ${configuredPort}`);
                return configuredPort;
            }
        }

        // Priority 2: Check common ports
        const commonPorts = [8181, 8080, 8443, 8081];
        for (const port of commonPorts) {
            if (await this.checkPort(port)) {
                console.log(`   ✅ code-server found on port ${port}`);
                return port;
            }
        }

        console.log('   ℹ️  No existing code-server found');
        return null;
    }

    async start(workspaceDir) {
        if (workspaceDir) {
            this.workspaceDir = workspaceDir;
        }

        // STEP 1: Try to detect existing code-server
        const existingPort = await this.detectExistingServer();

        if (existingPort) {
            // Use existing server - don't spawn new process
            this.port = existingPort;
            this.usingExisting = true;
            console.log(`🔌 Using existing code-server on port ${this.port}`);
            console.log(`   Workspace will open in existing instance`);
            return this.token;
        }

        // STEP 2: No existing server found - start new instance
        this.usingExisting = false;

        // Try to find code-server executable
        let codeServerPath;

        // 1. Try local node_modules (cross-platform)
        const localPath = path.join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'code-server.cmd' : 'code-server');

        if (fs.existsSync(localPath)) {
            codeServerPath = localPath;
        } else {
            // 2. Fallback to global path (if available in PATH)
            codeServerPath = 'code-server';
        }

        console.log(`🚀 Starting NEW VS Code Server...`);
        console.log(`   Path: ${codeServerPath}`);
        console.log(`   Port: ${this.port}`);
        console.log(`   Workspace: ${this.workspaceDir}`);

        const args = [
            this.workspaceDir,
            '--bind-addr', `127.0.0.1:${this.port}`,
            '--auth', 'none', // Seamless local access
            '--disable-telemetry',
            '--disable-update-check',
            // Create a temporary user data dir to avoid conflicts with global install
            '--user-data-dir', path.join(process.cwd(), '.vscode-data')
        ];

        const env = { ...process.env, PASSWORD: this.token };

        this.process = spawn(codeServerPath, args, { env });

        this.process.stdout.on('data', (data) => {
            // console.log(`[VS Code] ${data}`); // Optional: Log output
        });

        this.process.stderr.on('data', (data) => {
            const msg = data.toString();
            if (msg.includes('Address already in use')) {
                console.error(`❌ Port ${this.port} is busy! VS Code failed to start.`);
            }
            // console.error(`[VS Code Error] ${data}`);
        });

        // Wait for server to be ready
        try {
            await this.waitForReady();
            console.log(`✅ VS Code Server is ready on port ${this.port}!`);
            return this.token;
        } catch (err) {
            console.error('❌ Failed to start VS Code Server:', err);
            return null;
        }
    }

    async waitForReady(maxAttempts = 60) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await fetch(`http://127.0.0.1:${this.port}/healthz`);
                if (response.ok) {
                    return true;
                }
            } catch (err) {
                // Ignore connection refused, wait and retry
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        throw new Error('Timeout waiting for VS Code Server');
    }

    /**
     * Get the URL to access code-server
     */
    getUrl() {
        return `http://127.0.0.1:${this.port}`;
    }

    /**
     * Check if we're using an existing server or our own
     */
    isUsingExisting() {
        return this.usingExisting;
    }

    stop() {
        // Only stop if we started our own process
        if (this.process && !this.usingExisting) {
            console.log('🛑 Stopping VS Code Server...');
            this.process.kill();
            this.process = null;
        } else if (this.usingExisting) {
            console.log('ℹ️  Using external code-server - not stopping');
        }
    }
}

module.exports = CodeServerManager;

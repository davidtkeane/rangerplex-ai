const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class CodeServerManager {
    constructor() {
        this.process = null;
        this.port = 8081;
        this.token = this.generateToken();
        this.workspaceDir = process.cwd();
    }

    generateToken() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    async start(workspaceDir) {
        if (workspaceDir) {
            this.workspaceDir = workspaceDir;
        }

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

        console.log(`🚀 Starting VS Code Server...`);
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
            console.log(`✅ VS Code Server is ready!`);
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

    stop() {
        if (this.process) {
            console.log('🛑 Stopping VS Code Server...');
            this.process.kill();
            this.process = null;
        }
    }
}

module.exports = CodeServerManager;

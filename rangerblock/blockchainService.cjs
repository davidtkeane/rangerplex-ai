#!/usr/bin/env node
/**
 * RangerPlexBlock Service
 * =======================
 * Manages the blockchain relay server lifecycle.
 * Starts with RangerPlex, stops when RangerPlex closes.
 *
 * Created by: David Keane with Claude Code
 * Mission: Transform disabilities into superpowers
 */

const { spawn, fork } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

class BlockchainService {
    constructor() {
        this.relayProcess = null;
        this.isRunning = false;
        this.port = 5555;
        this.rangerblockDir = path.join(__dirname);
        this.coreDir = path.join(this.rangerblockDir, 'core');
        this.personalDir = path.join(this.rangerblockDir, '.personal');

        // Configuration (can be overridden via updateConfig)
        this.config = {
            enabled: true,
            autoStart: true,
            port: 5555,
            discoveryPort: 5005
        };
    }

    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (newConfig.port) {
            this.port = newConfig.port;
        }
        return this.config;
    }

    /**
     * Restart the relay server
     */
    async restart() {
        this.stop();
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for clean stop
        return await this.start();
    }

    /**
     * Check if RangerPlexBlock is installed (has node_modules)
     */
    isInstalled() {
        const nodeModulesPath = path.join(this.rangerblockDir, 'node_modules');
        const packageJsonPath = path.join(this.rangerblockDir, 'package.json');
        return fs.existsSync(nodeModulesPath) && fs.existsSync(packageJsonPath);
    }

    /**
     * Find identity file (supports multiple naming conventions)
     */
    findIdentityFile() {
        const possibleFiles = [
            'node_identity.json',      // New standard
            'genesis_node.json',       // Genesis nodes
            'm3pro_node_identity.json', // Machine-specific
            'm4max_node_identity.json',
            'm1air_node_identity.json'
        ];

        for (const file of possibleFiles) {
            const filePath = path.join(this.personalDir, file);
            if (fs.existsSync(filePath)) {
                return filePath;
            }
        }

        // Also check for any *_identity.json files
        if (fs.existsSync(this.personalDir)) {
            const files = fs.readdirSync(this.personalDir);
            for (const file of files) {
                if (file.endsWith('_identity.json') || file.endsWith('_node.json')) {
                    return path.join(this.personalDir, file);
                }
            }
        }

        return null;
    }

    /**
     * Check if identity is set up
     */
    hasIdentity() {
        return this.findIdentityFile() !== null;
    }

    /**
     * Get identity info
     */
    getIdentity() {
        try {
            const identityPath = this.findIdentityFile();
            if (identityPath) {
                const identity = JSON.parse(fs.readFileSync(identityPath, 'utf8'));
                // Normalize field names for compatibility
                return {
                    nodeID: identity.nodeID || identity.node_address || 'Unknown',
                    nodeName: identity.nodeName || identity.node_address?.split('_').pop() || 'RangerNode',
                    nodeType: identity.nodeType || identity.node_type || 'peer',
                    ...identity
                };
            }
        } catch (e) {
            console.error('Failed to read identity:', e.message);
        }
        return null;
    }

    /**
     * Check if port is available
     */
    async isPortAvailable(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.once('error', () => resolve(false));
            server.once('listening', () => {
                server.close();
                resolve(true);
            });
            server.listen(port);
        });
    }

    /**
     * Start the relay server
     */
    async start() {
        if (this.isRunning) {
            console.log('RangerPlexBlock relay already running');
            return { success: true, message: 'Already running' };
        }

        // Check if installed
        if (!this.isInstalled()) {
            console.log('RangerPlexBlock not installed. Run: npm run blockchain:install');
            return { success: false, message: 'Not installed', needsInstall: true };
        }

        // Check if identity exists
        if (!this.hasIdentity()) {
            console.log('No blockchain identity. Run: npm run blockchain:setup');
            return { success: false, message: 'No identity', needsSetup: true };
        }

        // Check port availability
        const portFree = await this.isPortAvailable(this.port);
        if (!portFree) {
            console.log(`Port ${this.port} is in use. Blockchain may already be running.`);
            this.isRunning = true;
            return { success: true, message: 'Port already in use (relay may be running)' };
        }

        // Start relay server
        const relayPath = path.join(this.coreDir, 'relay-server.cjs');
        if (!fs.existsSync(relayPath)) {
            console.log('Relay server not found:', relayPath);
            return { success: false, message: 'Relay server not found' };
        }

        try {
            this.relayProcess = spawn('node', [relayPath], {
                cwd: this.rangerblockDir,
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: false
            });

            this.relayProcess.stdout.on('data', (data) => {
                console.log(`[RangerPlexBlock] ${data.toString().trim()}`);
            });

            this.relayProcess.stderr.on('data', (data) => {
                console.error(`[RangerPlexBlock Error] ${data.toString().trim()}`);
            });

            this.relayProcess.on('close', (code) => {
                console.log(`[RangerPlexBlock] Relay server exited with code ${code}`);
                this.isRunning = false;
                this.relayProcess = null;
            });

            this.relayProcess.on('error', (err) => {
                console.error('[RangerPlexBlock] Failed to start relay:', err);
                this.isRunning = false;
            });

            this.isRunning = true;
            const identity = this.getIdentity();
            console.log(`[RangerPlexBlock] Started - Node: ${identity?.nodeName || 'Unknown'} (${identity?.nodeType || 'peer'})`);
            console.log(`[RangerPlexBlock] Relay server on port ${this.port}`);

            return {
                success: true,
                message: 'Relay server started',
                identity: identity
            };

        } catch (error) {
            console.error('[RangerPlexBlock] Start error:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Stop the relay server
     */
    stop() {
        if (this.relayProcess) {
            console.log('[RangerPlexBlock] Stopping relay server...');
            this.relayProcess.kill('SIGTERM');
            this.relayProcess = null;
        }
        this.isRunning = false;
        return { success: true, message: 'Relay server stopped' };
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            installed: this.isInstalled(),
            hasIdentity: this.hasIdentity(),
            isRunning: this.isRunning,
            port: this.port,
            identity: this.getIdentity()
        };
    }

    /**
     * Graceful shutdown handler
     */
    setupGracefulShutdown() {
        const shutdown = () => {
            console.log('\n[RangerPlexBlock] Graceful shutdown...');
            this.stop();
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
        process.on('exit', shutdown);
    }
}

// Export singleton instance
const blockchainService = new BlockchainService();
module.exports = blockchainService;

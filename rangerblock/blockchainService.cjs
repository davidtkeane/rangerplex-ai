#!/usr/bin/env node
/**
 * 🎖️ RANGERBLOCK SERVICE
 *
 * Manages RangerBlock node lifecycle for RangerPlex
 * Handles auto-start, network modes, and settings
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class BlockchainService {
    constructor() {
        this.nodeProcess = null;
        this.isRunning = false;
        this.config = {
            enabled: false,
            networkMode: 'local', // 'local' | 'local+global' | 'global'
            port: 5555, // Changed from 5000 (conflicts with macOS Control Center)
            relayUrl: null,
            autoStart: true
        };
        this.hardwareInfo = null;
    }

    /**
     * Load hardware detection
     */
    getHardwareInfo() {
        if (this.hardwareInfo) return this.hardwareInfo;

        try {
            const hardwareDetection = require('./hardwareDetection.cjs');
            this.hardwareInfo = hardwareDetection.getHardwareInfo();
            return this.hardwareInfo;
        } catch (error) {
            console.error('❌ Hardware detection failed:', error.message);
            return null;
        }
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('✅ RangerBlock config updated:', this.config);
    }

    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Check if port is already in use
     */
    async isPortInUse(port) {
        return new Promise((resolve) => {
            const net = require('net');
            const server = net.createServer();

            server.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(true); // Port in use
                } else {
                    resolve(false);
                }
            });

            server.once('listening', () => {
                server.close();
                resolve(false); // Port available
            });

            server.listen(port);
        });
    }

    /**
     * Start blockchain node
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️  RangerBlock already running in this process');
            return { success: false, message: 'Already running' };
        }

        if (!this.config.enabled) {
            console.log('⚠️  RangerBlock disabled in settings');
            return { success: false, message: 'RangerBlock disabled' };
        }

        // Check if another instance is using the port
        const portInUse = await this.isPortInUse(this.config.port);
        if (portInUse) {
            console.log(`⚠️  Port ${this.config.port} already in use (another RangerBlock instance running)`);
            return {
                success: false,
                message: `Port ${this.config.port} already in use`,
                hint: 'Another RangerBlock node is already running. Stop PM2 or use a different port.'
            };
        }

        try {
            const hardware = this.getHardwareInfo();
            if (!hardware || !hardware.detected) {
                throw new Error('Hardware detection failed');
            }

            const nodeName = hardware.nodeName || 'RangerNode';
            const args = [
                path.join(__dirname, 'RangerBlockNode.cjs'),
                '--name', nodeName,
                '--port', this.config.port.toString()
            ];

            // Add relay URL based on network mode
            if (this.config.networkMode !== 'local' && this.config.relayUrl) {
                args.push('--relay', this.config.relayUrl);
            }

            console.log('🚀 Starting RangerBlock node...');
            console.log('   Node Name:', nodeName);
            console.log('   Port:', this.config.port);
            console.log('   Network Mode:', this.config.networkMode);
            console.log('   Hardware UUID:', hardware.hardwareSerial);

            this.nodeProcess = spawn('node', args, {
                cwd: __dirname,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            this.isRunning = true;

            // Capture output
            this.nodeProcess.stdout.on('data', (data) => {
                console.log(`[RangerBlock] ${data.toString().trim()}`);
            });

            this.nodeProcess.stderr.on('data', (data) => {
                console.error(`[RangerBlock Error] ${data.toString().trim()}`);
            });

            this.nodeProcess.on('close', (code) => {
                console.log(`🛑 RangerBlock node exited with code ${code}`);
                this.isRunning = false;
                this.nodeProcess = null;
            });

            this.nodeProcess.on('error', (error) => {
                console.error('❌ RangerBlock node error:', error.message);
                this.isRunning = false;
                this.nodeProcess = null;
            });

            return {
                success: true,
                message: 'RangerBlock started',
                nodeName,
                port: this.config.port,
                hardwareSerial: hardware.hardwareSerial
            };

        } catch (error) {
            console.error('❌ Failed to start RangerBlock:', error.message);
            return { success: false, message: error.message };
        }
    }

    /**
     * Stop blockchain node
     */
    async stop() {
        if (!this.isRunning || !this.nodeProcess) {
            console.log('⚠️  RangerBlock not running');
            return { success: false, message: 'Not running' };
        }

        console.log('🛑 Stopping RangerBlock node...');

        return new Promise((resolve) => {
            this.nodeProcess.on('close', () => {
                this.isRunning = false;
                this.nodeProcess = null;
                console.log('✅ RangerBlock stopped');
                resolve({ success: true, message: 'Stopped' });
            });

            // Send SIGINT for graceful shutdown
            this.nodeProcess.kill('SIGINT');

            // Force kill after 5 seconds if still running
            setTimeout(() => {
                if (this.nodeProcess) {
                    console.log('⚠️  Force killing RangerBlock...');
                    this.nodeProcess.kill('SIGKILL');
                }
            }, 5000);
        });
    }

    /**
     * Restart blockchain node
     */
    async restart() {
        console.log('🔄 Restarting RangerBlock...');
        await this.stop();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await this.start();
    }

    /**
     * Get status
     */
    getStatus() {
        const hardware = this.getHardwareInfo();

        return {
            isRunning: this.isRunning,
            config: this.config,
            hardware: hardware ? {
                nodeName: hardware.nodeName,
                machineType: hardware.machineType,
                ipAddress: hardware.ipAddress,
                hardwareSerial: hardware.hardwareSerial ?
                    hardware.hardwareSerial.substring(0, 8) + '...' : null
            } : null,
            pid: this.nodeProcess ? this.nodeProcess.pid : null
        };
    }

    /**
     * Check network mode validity
     */
    isNetworkModeValid() {
        const mode = this.config.networkMode;

        if (mode === 'local') {
            return true; // Always valid
        }

        if (mode === 'local+global' || mode === 'global') {
            // Need relay URL for global modes
            return !!this.config.relayUrl;
        }

        return false;
    }
}

// Export singleton
const blockchainService = new BlockchainService();

module.exports = blockchainService;

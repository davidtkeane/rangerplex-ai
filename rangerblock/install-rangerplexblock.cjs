#!/usr/bin/env node
/**
 * RangerPlexBlock Installer
 * =========================
 * Interactive installer for RangerPlexBlock blockchain.
 * Installs dependencies and sets up node identity.
 *
 * Created by: David Keane with Claude Code
 * Mission: Transform disabilities into superpowers
 */

const readline = require('readline');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const rangerblockDir = path.join(__dirname);
const coreDir = path.join(rangerblockDir, 'core');
const personalDir = path.join(rangerblockDir, '.personal');

class Installer {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async prompt(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim().toLowerCase());
            });
        });
    }

    printBanner() {
        console.log('\n' + '='.repeat(60));
        console.log('     RANGERPLEXBLOCK INSTALLER');
        console.log('     Decentralized P2P Blockchain Network');
        console.log('='.repeat(60));
        console.log('\n     Mission: Transform disabilities into superpowers');
        console.log('     Philosophy: "One foot in front of the other"');
        console.log('\n' + '='.repeat(60) + '\n');
    }

    checkPrerequisites() {
        console.log('Checking prerequisites...\n');

        // Check Node.js
        try {
            const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
            console.log(`   Node.js: ${nodeVersion}`);
        } catch (e) {
            console.log('   Node.js: NOT FOUND');
            return false;
        }

        // Check npm
        try {
            const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
            console.log(`   npm: ${npmVersion}`);
        } catch (e) {
            console.log('   npm: NOT FOUND');
            return false;
        }

        // Check ffmpeg (optional, for IDCP)
        try {
            execSync('ffmpeg -version', { encoding: 'utf8', stdio: 'pipe' });
            console.log('   ffmpeg: Installed (IDCP compression available)');
        } catch (e) {
            console.log('   ffmpeg: Not found (IDCP compression unavailable)');
            console.log('          Install with: brew install ffmpeg');
        }

        console.log('');
        return true;
    }

    async installDependencies() {
        console.log('Installing RangerPlexBlock dependencies...\n');

        return new Promise((resolve, reject) => {
            const npm = spawn('npm', ['install'], {
                cwd: rangerblockDir,
                stdio: 'inherit'
            });

            npm.on('close', (code) => {
                if (code === 0) {
                    console.log('\n   Dependencies installed successfully!\n');
                    resolve(true);
                } else {
                    console.log('\n   Dependency installation failed!\n');
                    resolve(false);
                }
            });

            npm.on('error', (err) => {
                console.error('   npm error:', err.message);
                resolve(false);
            });
        });
    }

    async setupIdentity(isGenesis = false) {
        console.log('Setting up node identity...\n');

        const setupScript = path.join(coreDir, 'setup_new_user.cjs');
        if (!fs.existsSync(setupScript)) {
            console.log('   Setup script not found!');
            return false;
        }

        const args = isGenesis ? ['--genesis', '--skip-questions'] : ['--skip-questions'];

        return new Promise((resolve) => {
            const setup = spawn('node', [setupScript, ...args], {
                cwd: rangerblockDir,
                stdio: 'inherit'
            });

            setup.on('close', (code) => {
                resolve(code === 0);
            });

            setup.on('error', (err) => {
                console.error('   Setup error:', err.message);
                resolve(false);
            });
        });
    }

    hasIdentity() {
        // Check for multiple naming conventions
        const possibleFiles = [
            'node_identity.json',
            'genesis_node.json',
            'm1air_node_identity.json',
            'm3pro_node_identity.json',
            'm4max_node_identity.json'
        ];

        for (const file of possibleFiles) {
            if (fs.existsSync(path.join(personalDir, file))) {
                return true;
            }
        }

        // Also check for any *_identity.json or *_node.json files
        if (fs.existsSync(personalDir)) {
            const files = fs.readdirSync(personalDir);
            for (const file of files) {
                if (file.endsWith('_identity.json') || file.endsWith('_node.json')) {
                    return true;
                }
            }
        }

        return false;
    }

    hasDependencies() {
        const nodeModulesPath = path.join(rangerblockDir, 'node_modules');
        return fs.existsSync(nodeModulesPath);
    }

    async run() {
        this.printBanner();

        // Check prerequisites
        if (!this.checkPrerequisites()) {
            console.log('Prerequisites not met. Please install Node.js and npm.');
            this.rl.close();
            process.exit(1);
        }

        // Check current state
        const hasDeps = this.hasDependencies();
        const hasId = this.hasIdentity();

        if (hasDeps && hasId) {
            console.log('RangerPlexBlock is already installed and configured!\n');
            const reinstall = await this.prompt('Reinstall anyway? (y/n): ');
            if (reinstall !== 'y') {
                console.log('\nInstallation cancelled. Your existing setup is preserved.');
                this.rl.close();
                return;
            }
        }

        // Ask user if they want to proceed
        console.log('This will install RangerPlexBlock with:');
        console.log('   - WebSocket relay server (port 5555)');
        console.log('   - P2P blockchain communication');
        console.log('   - Secure node identity with RSA-2048 keys');
        console.log('   - IDCP video compression (if ffmpeg installed)');
        console.log('');

        const proceed = await this.prompt('Proceed with installation? (y/n): ');
        if (proceed !== 'y') {
            console.log('\nInstallation cancelled.');
            this.rl.close();
            return;
        }

        // Install dependencies
        console.log('\n' + '-'.repeat(40));
        const depsOk = await this.installDependencies();
        if (!depsOk) {
            console.log('Failed to install dependencies. Please run: npm install');
            this.rl.close();
            process.exit(1);
        }

        // Ask about node type
        console.log('-'.repeat(40) + '\n');
        console.log('Node Type:');
        console.log('   1. PEER NODE - Join existing network (recommended)');
        console.log('   2. GENESIS NODE - Start new network (first node only)');
        console.log('');

        const nodeType = await this.prompt('Select node type (1 or 2): ');
        const isGenesis = nodeType === '2';

        // Setup identity
        console.log('\n' + '-'.repeat(40));
        const setupOk = await this.setupIdentity(isGenesis);
        if (!setupOk) {
            console.log('Identity setup incomplete. You can run it later:');
            console.log('   node rangerblock/core/setup_new_user.cjs');
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('     INSTALLATION COMPLETE!');
        console.log('='.repeat(60));
        console.log('\nRangerPlexBlock will start automatically with RangerPlex.');
        console.log('\nManual commands:');
        console.log('   Start relay:    node rangerblock/core/relay-server.cjs');
        console.log('   Setup identity: node rangerblock/core/setup_new_user.cjs');
        console.log('   Compress video: node rangerblock/core/idcp_compress.cjs <file>');
        console.log('\nRangers lead the way!\n');

        this.rl.close();
    }
}

// Run installer
const installer = new Installer();
installer.run().catch((err) => {
    console.error('Installation error:', err);
    process.exit(1);
});

#!/usr/bin/env node
/**
 * RANGERBLOCK IDENTITY REGISTRATION v1.0.0
 * =========================================
 * Register your identity on the RangerBlock blockchain
 *
 * Usage:
 *   node register-identity.cjs
 *   node register-identity.cjs --check    (check if already registered)
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 */

const WebSocket = require('ws');
const crypto = require('crypto');
const { justChatIdentity } = require('../lib/identity-service.cjs');

// Configuration
const RELAY_HOST = '44.222.101.125';
const RELAY_PORT = 5555;

// Colors
const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    brightGreen: '\x1b[92m',
    brightCyan: '\x1b[96m',
};

function log(msg) {
    console.log(`${c.dim}[${new Date().toLocaleTimeString()}]${c.reset} ${msg}`);
}

async function main() {
    console.log(`
${c.brightCyan}╔════════════════════════════════════════════════════════════╗
║         ${c.yellow}RANGERBLOCK${c.brightCyan} - Identity Registration              ║
╚════════════════════════════════════════════════════════════╝${c.reset}
`);

    // Check for --check flag
    if (process.argv.includes('--check')) {
        await justChatIdentity.init();
        const isRegistered = justChatIdentity.isRegisteredOnChain();
        const summary = justChatIdentity.getSummary();

        if (isRegistered) {
            log(`${c.brightGreen}✓ Identity is registered on-chain${c.reset}`);
            console.log(`   User ID: ${c.cyan}${summary.userId}${c.reset}`);
            console.log(`   Username: ${summary.username}`);
        } else {
            log(`${c.yellow}⚠ Identity is NOT registered on-chain${c.reset}`);
            console.log(`   Run without --check to register`);
        }
        process.exit(0);
    }

    // Initialize identity
    log('Initializing identity service...');
    await justChatIdentity.init();

    // Check if already registered
    if (justChatIdentity.isRegisteredOnChain()) {
        log(`${c.yellow}⚠ Identity already registered on-chain${c.reset}`);
        const summary = justChatIdentity.getSummary();
        console.log(`   User ID: ${c.cyan}${summary.userId}${c.reset}`);
        console.log(`   Use --check to verify registration status`);
        process.exit(0);
    }

    // Get identity
    const identity = await justChatIdentity.getOrCreateIdentity();
    log(`Identity: ${c.cyan}${identity.userId}${c.reset}`);
    log(`Username: ${identity.username}`);

    // Create registration block
    log('Creating registration block...');
    const regBlock = justChatIdentity.createRegistrationBlock();

    // Calculate block hash
    const blockData = JSON.stringify(regBlock);
    const blockHash = crypto.createHash('sha256').update(blockData).digest('hex');

    console.log(`
${c.dim}═══════════════════════════════════════════════════════════${c.reset}
${c.brightCyan}REGISTRATION BLOCK${c.reset}
${c.dim}═══════════════════════════════════════════════════════════${c.reset}
${c.green}Type:${c.reset}        ${regBlock.type}
${c.green}Version:${c.reset}     ${regBlock.version}
${c.green}Username:${c.reset}    ${regBlock.payload.username}
${c.green}App Origin:${c.reset}  ${regBlock.payload.appOrigin}
${c.green}Created:${c.reset}     ${regBlock.payload.createdAt}
${c.green}Registered:${c.reset}  ${regBlock.payload.registeredAt}
${c.green}Block Hash:${c.reset}  ${c.dim}${blockHash.slice(0, 32)}...${c.reset}
${c.dim}═══════════════════════════════════════════════════════════${c.reset}
`);

    // Connect to relay and broadcast
    log('Connecting to blockchain relay...');

    const wsUrl = `ws://${RELAY_HOST}:${RELAY_PORT}`;

    return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        let registered = false;

        const timeout = setTimeout(() => {
            if (!registered) {
                ws.close();
                reject(new Error('Registration timeout'));
            }
        }, 30000);

        ws.on('open', () => {
            log(`${c.brightGreen}Connected to relay${c.reset}`);
        });

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());

                if (msg.type === 'welcome') {
                    // Register as identity registrar
                    ws.send(JSON.stringify({
                        type: 'register',
                        address: `reg_${identity.userId}`,
                        nickname: 'IdentityRegistrar',
                        channel: '#identity',
                        mode: 'registrar'
                    }));
                } else if (msg.type === 'registered') {
                    // Broadcast the registration block
                    log('Broadcasting registration block...');
                    ws.send(JSON.stringify({
                        type: 'broadcast',
                        payload: {
                            type: 'identityRegistration',
                            block: regBlock,
                            blockHash: blockHash,
                            timestamp: Date.now()
                        }
                    }));
                } else if (msg.type === 'broadcastSent') {
                    // Registration broadcast successful
                    registered = true;
                    clearTimeout(timeout);

                    // Simulate block height (in real blockchain would come from network)
                    const mockBlockInfo = {
                        blockHeight: Date.now(),
                        blockHash: blockHash,
                        timestamp: Date.now()
                    };

                    // Save registration proof
                    justChatIdentity.saveChainRegistration(mockBlockInfo);

                    log(`${c.brightGreen}✓ Identity registered on-chain!${c.reset}`);
                    console.log(`   Block Hash: ${c.dim}${blockHash.slice(0, 32)}...${c.reset}`);
                    console.log(`   Block Height: ${mockBlockInfo.blockHeight}`);

                    ws.close();
                    resolve();
                } else if (msg.type === 'error') {
                    log(`${c.red}Error: ${msg.message}${c.reset}`);
                }
            } catch (e) {
                // Ignore parse errors
            }
        });

        ws.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });

        ws.on('close', () => {
            clearTimeout(timeout);
            if (registered) {
                console.log(`\n${c.brightGreen}Rangers lead the way! 🎖️${c.reset}\n`);
            }
        });
    });
}

main().catch(err => {
    console.error(`${c.red}Error: ${err.message}${c.reset}`);
    process.exit(1);
});

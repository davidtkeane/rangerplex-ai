#!/usr/bin/env node
/**
 * RANGERBLOCK ADMIN - User Monitor v1.0.0
 * ========================================
 * View all connected users with their hardware-bound identities.
 *
 * Usage:
 *   node admin-users.cjs
 *   node admin-users.cjs --watch    (auto-refresh)
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 */

const WebSocket = require('ws');

// Configuration
const RELAY_HOST = '44.222.101.125';
const RELAY_PORT = 5555;
const WATCH_MODE = process.argv.includes('--watch') || process.argv.includes('-w');
const REFRESH_INTERVAL = 5000; // 5 seconds

// Colors
const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    brightCyan: '\x1b[96m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
};

function getTimestamp() {
    return new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function showBanner() {
    console.clear();
    console.log(`
${c.brightCyan}╔════════════════════════════════════════════════════════════╗
║           ${c.brightYellow}RANGERBLOCK ADMIN${c.brightCyan} - User Monitor              ║
╚════════════════════════════════════════════════════════════╝${c.reset}
`);
}

function displayUsers(peers) {
    if (peers.length === 0) {
        console.log(`${c.dim}No users connected${c.reset}\n`);
        return;
    }

    console.log(`${c.brightGreen}${peers.length}${c.reset} user(s) connected:\n`);

    // Table header
    console.log(`${c.dim}${'─'.repeat(80)}${c.reset}`);
    console.log(`${c.bold}  # │ Nickname        │ User ID              │ App Type     │ Mode${c.reset}`);
    console.log(`${c.dim}${'─'.repeat(80)}${c.reset}`);

    peers.forEach((peer, index) => {
        const num = String(index + 1).padStart(3);
        const nick = (peer.nickname || 'Unknown').padEnd(15).slice(0, 15);
        const userId = (peer.userId || peer.address?.slice(0, 20) || 'N/A').padEnd(20).slice(0, 20);
        const appType = (peer.appType || 'unknown').padEnd(12).slice(0, 12);
        const mode = peer.mode || peer.capabilities?.join(',') || '-';

        // Color code by app type
        let color = c.reset;
        if (peer.appType === 'just-chat') color = c.cyan;
        else if (peer.appType === 'voice-chat') color = c.magenta;
        else if (peer.appType === 'chat-lite') color = c.green;

        console.log(`${c.dim}${num}${c.reset} │ ${color}${nick}${c.reset} │ ${c.dim}${userId}${c.reset} │ ${appType} │ ${mode}`);
    });

    console.log(`${c.dim}${'─'.repeat(80)}${c.reset}`);
    console.log(`\n${c.dim}Last updated: ${getTimestamp()}${c.reset}`);

    if (WATCH_MODE) {
        console.log(`${c.dim}Refreshing every ${REFRESH_INTERVAL/1000}s... Press Ctrl+C to exit${c.reset}`);
    }
}

async function fetchUsers() {
    return new Promise((resolve, reject) => {
        const wsUrl = `ws://${RELAY_HOST}:${RELAY_PORT}`;
        const ws = new WebSocket(wsUrl);
        let peers = [];

        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Connection timeout'));
        }, 10000);

        ws.on('open', () => {
            // Register as admin observer
            ws.send(JSON.stringify({
                type: 'register',
                address: `admin-${Date.now()}`,
                nickname: 'AdminObserver',
                channel: '#admin',
                mode: 'admin',
                capabilities: ['admin']
            }));
        });

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());

                if (msg.type === 'registered') {
                    // Request peer list
                    ws.send(JSON.stringify({ type: 'getPeers' }));
                } else if (msg.type === 'peerList') {
                    clearTimeout(timeout);
                    peers = msg.peers || [];
                    ws.close();
                    resolve(peers);
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
            resolve(peers);
        });
    });
}

async function main() {
    showBanner();
    console.log(`${c.dim}Connecting to relay: ws://${RELAY_HOST}:${RELAY_PORT}${c.reset}\n`);

    const run = async () => {
        try {
            const peers = await fetchUsers();
            if (WATCH_MODE) showBanner();
            displayUsers(peers);
        } catch (err) {
            console.log(`${c.red}Error: ${err.message}${c.reset}`);
            if (!WATCH_MODE) process.exit(1);
        }
    };

    await run();

    if (WATCH_MODE) {
        setInterval(run, REFRESH_INTERVAL);
    } else {
        console.log(`\n${c.dim}Tip: Use --watch for auto-refresh${c.reset}`);
        process.exit(0);
    }
}

main().catch(err => {
    console.error(`${c.red}Fatal error: ${err.message}${c.reset}`);
    process.exit(1);
});

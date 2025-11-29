#!/usr/bin/env node
/**
 * BLOCKCHAIN CHAT
 * ===============
 * Simple P2P chat between RangerBlock nodes
 * Messages are sent through the blockchain relay (not direct IP!)
 *
 * Usage:
 *   node blockchain-chat.cjs                        # Connect to localhost relay
 *   node blockchain-chat.cjs --relay 192.168.1.35:5555  # Connect to remote relay
 *
 * Created by: David Keane with Claude Code
 */

const WebSocket = require('ws');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Parse command line args
const args = process.argv.slice(2);
let relayHost = 'localhost';
let relayPort = 5555;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--relay' && args[i + 1]) {
        const parts = args[i + 1].split(':');
        relayHost = parts[0];
        relayPort = parseInt(parts[1]) || 5555;
        i++;
    } else if (args[i] === '--help') {
        console.log(`
BLOCKCHAIN CHAT - P2P chat between RangerBlock nodes

Usage:
  node blockchain-chat.cjs                        # Connect to localhost relay
  node blockchain-chat.cjs --relay <host:port>    # Connect to remote relay

Examples:
  M3Pro:  node blockchain-chat.cjs
  M1Air:  node blockchain-chat.cjs --relay 192.168.1.35:5555

Commands:
  /peers    - List connected peers
  /quit     - Exit chat
  /clear    - Clear screen
`);
        process.exit(0);
    }
}

// Load node identity
function loadIdentity() {
    const personalDir = path.join(__dirname, '..', '.personal');
    const possibleFiles = [
        'node_identity.json',
        'genesis_node.json',
        'm1air_node_identity.json',
        'm3pro_node_identity.json',
        'm4max_node_identity.json'
    ];

    for (const file of possibleFiles) {
        const filePath = path.join(personalDir, file);
        if (fs.existsSync(filePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                return {
                    nodeID: data.nodeID || data.node_address || 'Unknown',
                    nodeType: data.nodeType || data.node_type || 'peer'
                };
            } catch (e) {
                continue;
            }
        }
    }

    // Check for any *_identity.json
    if (fs.existsSync(personalDir)) {
        const files = fs.readdirSync(personalDir);
        for (const file of files) {
            if (file.endsWith('_identity.json') || file.endsWith('_node.json')) {
                const filePath = path.join(personalDir, file);
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    return {
                        nodeID: data.nodeID || data.node_address || 'Unknown',
                        nodeType: data.nodeType || data.node_type || 'peer'
                    };
                } catch (e) {
                    continue;
                }
            }
        }
    }

    return null;
}

// Get short name from nodeID
function getShortName(nodeID) {
    if (nodeID.includes('GENESIS')) return 'M3Pro';
    if (nodeID.includes('RangerNode-002')) return 'M1Air';
    if (nodeID.includes('M1')) return 'M1Air';
    if (nodeID.includes('M3')) return 'M3Pro';
    if (nodeID.includes('M4')) return 'M4Max';
    return nodeID.slice(0, 12);
}

// Main chat function
async function runChat() {
    const identity = loadIdentity();
    const myName = identity ? getShortName(identity.nodeID) : 'Anonymous';
    const myFullID = identity?.nodeID || `Chat-${Date.now()}`;

    console.log('\n' + '='.repeat(60));
    console.log('   RANGERBLOCK CHAT');
    console.log('   P2P Communication via Blockchain');
    console.log('='.repeat(60));
    console.log(`\n   You are: ${myName}`);
    console.log(`   Relay: ws://${relayHost}:${relayPort}`);
    console.log('\n   Type messages and press Enter to send.');
    console.log('   Commands: /peers /quit /clear\n');
    console.log('='.repeat(60) + '\n');

    // Connect to relay
    const wsUrl = `ws://${relayHost}:${relayPort}`;
    let ws;

    try {
        ws = new WebSocket(wsUrl);
    } catch (err) {
        console.error(`   Failed to connect: ${err.message}`);
        process.exit(1);
    }

    let myNodeId = null;
    let peers = [];
    let connected = false;

    // Setup readline for input
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // Custom prompt
    function showPrompt() {
        process.stdout.write(`\x1b[32m${myName}>\x1b[0m `);
    }

    ws.on('open', () => {
        console.log('   Connected to relay!\n');
        connected = true;
    });

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            handleMessage(msg);
        } catch (err) {
            console.error('   Invalid message:', err.message);
        }
    });

    ws.on('error', (err) => {
        console.error(`\n   Connection error: ${err.message}`);
        console.log('   Make sure relay server is running!');
        rl.close();
        process.exit(1);
    });

    ws.on('close', () => {
        console.log('\n   Disconnected from relay.');
        rl.close();
        process.exit(0);
    });

    function handleMessage(msg) {
        switch (msg.type) {
            case 'welcome':
                myNodeId = msg.nodeId;

                // Register ourselves
                ws.send(JSON.stringify({
                    type: 'register',
                    address: myFullID,
                    port: 0,
                    blockchainHeight: 0
                }));
                break;

            case 'registered':
                // Request peer list
                ws.send(JSON.stringify({
                    type: 'getPeers'
                }));
                break;

            case 'peerList':
            case 'peerListUpdate':
                const oldPeerCount = peers.length;
                peers = msg.peers || [];

                if (msg.type === 'peerList') {
                    // Initial peer list
                    if (peers.length > 0) {
                        console.log(`   ${peers.length} peer(s) online:`);
                        peers.forEach(p => {
                            console.log(`     - ${getShortName(p.address)}`);
                        });
                    } else {
                        console.log('   No other peers online yet.');
                    }
                    console.log('');
                    showPrompt();
                } else {
                    // Peer update
                    if (peers.length > oldPeerCount) {
                        // Someone joined
                        const newPeer = peers.find(p => !peers.slice(0, oldPeerCount).some(op => op.nodeId === p.nodeId));
                        if (newPeer) {
                            process.stdout.write('\r');  // Clear current line
                            console.log(`\x1b[33m   [${getShortName(newPeer.address)} joined the chat]\x1b[0m`);
                            showPrompt();
                        }
                    } else if (peers.length < oldPeerCount) {
                        // Someone left
                        process.stdout.write('\r');
                        console.log(`\x1b[33m   [A peer left the chat]\x1b[0m`);
                        showPrompt();
                    }
                }
                break;

            case 'nodeMessage':
                // Incoming chat message!
                const payload = msg.payload;

                if (payload.type === 'chatMessage') {
                    const senderName = getShortName(msg.from);
                    const timestamp = new Date().toLocaleTimeString();

                    // Clear current line and show message
                    process.stdout.write('\r\x1b[K');  // Clear line
                    console.log(`\x1b[36m${senderName}\x1b[0m [${timestamp}]: ${payload.message}`);
                    showPrompt();

                } else if (payload.type === 'blockchainPing') {
                    // Auto-respond to pings
                    ws.send(JSON.stringify({
                        type: 'relayMessage',
                        targetNodeId: msg.fromNodeId,
                        payload: {
                            type: 'blockchainPong',
                            from: myFullID,
                            pingId: payload.pingId,
                            originalTimestamp: payload.timestamp,
                            timestamp: Date.now()
                        }
                    }));
                }
                break;

            case 'broadcastSent':
                // Our message was sent
                break;

            case 'error':
                console.log(`   Error: ${msg.message}`);
                showPrompt();
                break;
        }
    }

    // Handle user input
    rl.on('line', (input) => {
        const trimmed = input.trim();

        if (!trimmed) {
            showPrompt();
            return;
        }

        // Handle commands
        if (trimmed.startsWith('/')) {
            const cmd = trimmed.toLowerCase();

            if (cmd === '/quit' || cmd === '/exit' || cmd === '/q') {
                console.log('\n   Goodbye! Rangers lead the way! 🎖️\n');
                ws.close();
                return;
            }

            if (cmd === '/peers') {
                if (peers.length === 0) {
                    console.log('   No other peers online.');
                } else {
                    console.log(`   ${peers.length} peer(s) online:`);
                    peers.forEach(p => {
                        console.log(`     - ${getShortName(p.address)} (${p.ip})`);
                    });
                }
                showPrompt();
                return;
            }

            if (cmd === '/clear') {
                console.clear();
                console.log('='.repeat(60));
                console.log('   RANGERBLOCK CHAT');
                console.log('='.repeat(60) + '\n');
                showPrompt();
                return;
            }

            console.log(`   Unknown command: ${trimmed}`);
            console.log('   Commands: /peers /quit /clear');
            showPrompt();
            return;
        }

        // Send chat message to all peers
        if (peers.length === 0) {
            console.log('   No peers online to receive your message.');
            showPrompt();
            return;
        }

        // Broadcast message to all peers
        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'chatMessage',
                from: myFullID,
                message: trimmed,
                timestamp: Date.now()
            }
        }));

        showPrompt();
    });

    // Handle Ctrl+C
    rl.on('close', () => {
        console.log('\n   Goodbye! Rangers lead the way! 🎖️\n');
        ws.close();
    });

    // Send heartbeat every 30 seconds to stay connected
    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
        }
    }, 30000);
}

// Run chat
runChat().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
});

#!/usr/bin/env node
/**
 * BLOCKCHAIN PING TEST
 * ====================
 * Test P2P communication between RangerBlock nodes
 * Uses blockchain relay (not IP!) for node discovery and messaging
 *
 * Usage:
 *   node blockchain-ping.cjs                    # List all nodes, ping all
 *   node blockchain-ping.cjs --target M3Pro    # Ping specific node by name
 *   node blockchain-ping.cjs --relay 192.168.1.30:5555  # Use different relay
 *
 * Created by: David Keane with Claude Code
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Parse command line args
const args = process.argv.slice(2);
let targetNode = null;
let relayHost = 'localhost';  // Default: localhost (use --relay for remote)
let relayPort = 5555;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target' && args[i + 1]) {
        targetNode = args[i + 1];
        i++;
    } else if (args[i] === '--relay' && args[i + 1]) {
        const parts = args[i + 1].split(':');
        relayHost = parts[0];
        relayPort = parseInt(parts[1]) || 5555;
        i++;
    } else if (args[i] === '--help') {
        console.log(`
BLOCKCHAIN PING - Test P2P node communication

Usage:
  node blockchain-ping.cjs                       # Discover and ping all nodes
  node blockchain-ping.cjs --target <name>       # Ping specific node
  node blockchain-ping.cjs --relay <host:port>   # Use different relay

Examples:
  node blockchain-ping.cjs --target M3Pro
  node blockchain-ping.cjs --target M1Air
  node blockchain-ping.cjs --relay localhost:5555 --target M3Pro
`);
        process.exit(0);
    }
}

// Load our node identity
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
                    file,
                    nodeID: data.nodeID || data.node_address || 'Unknown',
                    nodeType: data.nodeType || data.node_type || 'peer'
                };
            } catch (e) {
                continue;
            }
        }
    }

    // Also check for any *_identity.json
    if (fs.existsSync(personalDir)) {
        const files = fs.readdirSync(personalDir);
        for (const file of files) {
            if (file.endsWith('_identity.json') || file.endsWith('_node.json')) {
                const filePath = path.join(personalDir, file);
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    return {
                        file,
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

// Main ping test
async function runPingTest() {
    console.log('\n' + '='.repeat(60));
    console.log('   RANGERBLOCK PING TEST');
    console.log('   P2P Communication via Blockchain Relay');
    console.log('='.repeat(60) + '\n');

    // Load identity
    const identity = loadIdentity();
    if (identity) {
        console.log(`   Your Node: ${identity.nodeID}`);
        console.log(`   Type: ${identity.nodeType}`);
    } else {
        console.log('   Your Node: Anonymous (no identity file)');
    }
    console.log(`   Relay: ws://${relayHost}:${relayPort}`);
    console.log('');

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
    let pingResults = new Map();
    let pendingPings = new Map();

    ws.on('open', () => {
        console.log('   Connected to relay server!\n');
        console.log('-'.repeat(60));
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
        console.log('   Make sure relay server is running on M3Pro:');
        console.log('   npm run blockchain:relay\n');
        process.exit(1);
    });

    ws.on('close', () => {
        console.log('\n   Disconnected from relay.');
        printResults();
        process.exit(0);
    });

    function handleMessage(msg) {
        switch (msg.type) {
            case 'welcome':
                myNodeId = msg.nodeId;
                console.log(`   Assigned ID: ${myNodeId}`);

                // Register ourselves
                ws.send(JSON.stringify({
                    type: 'register',
                    address: identity?.nodeID || `PingTest-${myNodeId.slice(0, 8)}`,
                    port: 0,  // We're not accepting connections
                    blockchainHeight: 0
                }));
                break;

            case 'registered':
                console.log('   Registered with relay!');

                // Request peer list
                ws.send(JSON.stringify({
                    type: 'getPeers'
                }));
                break;

            case 'peerList':
            case 'peerListUpdate':
                peers = msg.peers || [];
                console.log(`\n   Found ${peers.length} peer(s):`);

                if (peers.length === 0) {
                    console.log('   No other nodes connected.');
                    console.log('\n   Start another node to test P2P communication.');
                    setTimeout(() => ws.close(), 1000);
                    return;
                }

                peers.forEach((peer, i) => {
                    console.log(`     ${i + 1}. ${peer.address} (${peer.ip})`);
                });

                console.log('\n' + '-'.repeat(60));
                console.log('   PINGING NODES...\n');

                // Filter peers if target specified
                let targetPeers = peers;
                if (targetNode) {
                    targetPeers = peers.filter(p =>
                        p.address.toLowerCase().includes(targetNode.toLowerCase())
                    );
                    if (targetPeers.length === 0) {
                        console.log(`   No nodes found matching "${targetNode}"`);
                        setTimeout(() => ws.close(), 1000);
                        return;
                    }
                }

                // Send pings to all target peers
                targetPeers.forEach((peer) => {
                    const pingTime = Date.now();
                    pendingPings.set(peer.nodeId, {
                        address: peer.address,
                        sentAt: pingTime
                    });

                    ws.send(JSON.stringify({
                        type: 'relayMessage',
                        targetNodeId: peer.nodeId,
                        targetAddress: peer.address,
                        payload: {
                            type: 'blockchainPing',
                            from: identity?.nodeID || `PingTest-${myNodeId.slice(0, 8)}`,
                            pingId: `ping-${pingTime}`,
                            timestamp: pingTime
                        }
                    }));

                    console.log(`   PING → ${peer.address}...`);
                });

                // Wait for responses, then close
                setTimeout(() => {
                    ws.close();
                }, 5000);
                break;

            case 'nodeMessage':
                // Handle incoming message from another node
                const payload = msg.payload;

                if (payload.type === 'blockchainPing') {
                    // Respond with pong
                    console.log(`\n   PING received from ${msg.from}`);

                    ws.send(JSON.stringify({
                        type: 'relayMessage',
                        targetNodeId: msg.fromNodeId,
                        payload: {
                            type: 'blockchainPong',
                            from: identity?.nodeID || `PingTest-${myNodeId.slice(0, 8)}`,
                            pingId: payload.pingId,
                            originalTimestamp: payload.timestamp,
                            timestamp: Date.now()
                        }
                    }));

                    console.log(`   PONG → ${msg.from}`);

                } else if (payload.type === 'blockchainPong') {
                    // Calculate latency
                    const now = Date.now();
                    const latency = now - payload.originalTimestamp;

                    pingResults.set(msg.from, {
                        address: msg.from,
                        latency: latency,
                        success: true
                    });

                    console.log(`   PONG ← ${msg.from} (${latency}ms)`);
                }
                break;

            case 'relaySuccess':
                // Message was delivered
                break;

            case 'relayFailed':
                console.log(`   PING FAILED: ${msg.reason}`);
                if (msg.targetAddress) {
                    pingResults.set(msg.targetAddress, {
                        address: msg.targetAddress,
                        success: false,
                        error: msg.reason
                    });
                }
                break;

            case 'error':
                console.log(`   Relay error: ${msg.message}`);
                break;
        }
    }

    function printResults() {
        if (pingResults.size === 0 && pendingPings.size === 0) {
            return;
        }

        console.log('\n' + '='.repeat(60));
        console.log('   PING RESULTS');
        console.log('='.repeat(60) + '\n');

        let successful = 0;
        let failed = 0;
        let totalLatency = 0;

        // Check for timeouts
        for (const [nodeId, pending] of pendingPings) {
            if (!pingResults.has(pending.address)) {
                pingResults.set(pending.address, {
                    address: pending.address,
                    success: false,
                    error: 'Timeout (no response in 5s)'
                });
            }
        }

        for (const [address, result] of pingResults) {
            if (result.success) {
                console.log(`   ${result.address}: ${result.latency}ms`);
                successful++;
                totalLatency += result.latency;
            } else {
                console.log(`   ${result.address}: FAILED - ${result.error}`);
                failed++;
            }
        }

        console.log('\n' + '-'.repeat(60));
        console.log(`   Successful: ${successful}/${pingResults.size}`);
        if (successful > 0) {
            console.log(`   Average latency: ${Math.round(totalLatency / successful)}ms`);
        }
        if (failed > 0) {
            console.log(`   Failed: ${failed}`);
        }
        console.log('\n   Rangers lead the way!\n');
    }
}

// Run the test
runPingTest().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
});

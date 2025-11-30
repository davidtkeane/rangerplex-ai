#!/usr/bin/env node
/**
 * 🎖️ RANGERBLOCK RELAY SERVER WITH BRIDGE SUPPORT
 *
 * Version: 2.0.0
 * Created: November 30, 2025
 * Author: David Keane (IrishRanger) + Claude Code (Ranger)
 *
 * Features:
 * - Standard relay functionality (node discovery, message routing)
 * - BRIDGE MODE: Connect to other relay servers
 * - Cross-relay message forwarding
 * - Peer list synchronization across relays
 * - Automatic reconnection to bridge peers
 */

const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

// Load config file or use defaults
let config = {
    relay: {
        name: process.env.RELAY_NAME || 'rangerplex-relay',
        port: parseInt(process.env.WS_PORT) || 5555,
        dashboardPort: parseInt(process.env.HTTP_PORT) || 5556,
        region: process.env.RELAY_REGION || 'local'
    },
    bridge: {
        enabled: process.env.BRIDGE_ENABLED === 'true' || false,
        reconnectInterval: 5000,
        heartbeatInterval: 30000,
        peers: []
    }
};

// Try to load config file
const configPath = path.join(__dirname, 'relay-config.json');
if (fs.existsSync(configPath)) {
    try {
        const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config = { ...config, ...fileConfig };
        console.log('📄 Loaded config from relay-config.json');
    } catch (err) {
        console.log('⚠️  Could not parse relay-config.json, using defaults');
    }
}

const HTTP_PORT = config.relay.dashboardPort;
const WS_PORT = config.relay.port;
const RELAY_NAME = config.relay.name;
const RELAY_REGION = config.relay.region;

const app = express();

// ═══════════════════════════════════════════════════════════════════
// DATA STRUCTURES
// ═══════════════════════════════════════════════════════════════════

// Local nodes (connected directly to this relay)
const nodes = new Map();

// Bridge connections (other relay servers)
const bridgeConnections = new Map();

// Remote peers (nodes on other relays, synced via bridge)
const remotePeers = new Map();

// Statistics
const stats = {
    totalConnections: 0,
    activeNodes: 0,
    bridgeConnections: 0,
    remotePeers: 0,
    totalMessages: 0,
    bridgeMessages: 0,
    startTime: Date.now()
};

// ═══════════════════════════════════════════════════════════════════
// WEBSOCKET SERVER (for local nodes)
// ═══════════════════════════════════════════════════════════════════

const wss = new WebSocket.Server({ port: WS_PORT });

console.log('\n' + '🎖️ '.repeat(30));
console.log('   RANGERBLOCK RELAY SERVER v2.0 (BRIDGE ENABLED)');
console.log(`   Name: ${RELAY_NAME} | Region: ${RELAY_REGION}`);
console.log('🎖️ '.repeat(30));
console.log(`\n✅ WebSocket server listening on port ${WS_PORT}`);

wss.on('connection', (ws, req) => {
    const nodeId = generateNodeId();
    const clientIP = req.socket.remoteAddress;

    stats.totalConnections++;
    stats.activeNodes = nodes.size + 1;

    console.log(`\n📥 New connection from ${clientIP}`);
    console.log(`   Assigned node ID: ${nodeId}`);

    // Check if this is a bridge connection (from another relay)
    const isBridge = req.headers['x-bridge-relay'] === 'true';

    if (isBridge) {
        handleBridgeConnection(ws, nodeId, req);
        return;
    }

    // Regular node connection
    ws.send(JSON.stringify({
        type: 'welcome',
        nodeId: nodeId,
        relayName: RELAY_NAME,
        relayRegion: RELAY_REGION,
        message: 'Connected to RangerBlock Relay Server (Bridge Enabled)',
        timestamp: Date.now()
    }));

    ws.on('message', (data) => {
        stats.totalMessages++;
        try {
            const msg = JSON.parse(data);
            handleNodeMessage(ws, nodeId, msg, clientIP);
        } catch (err) {
            console.error(`❌ Invalid message from ${nodeId}:`, err.message);
        }
    });

    ws.on('close', () => {
        if (nodes.has(nodeId)) {
            const node = nodes.get(nodeId);
            console.log(`\n❌ Node disconnected: ${node.address || nodeId}`);
            nodes.delete(nodeId);
            stats.activeNodes = nodes.size;
            broadcastNodeList();
            syncPeersToBridges();
        }
    });

    ws.on('error', (err) => {
        console.error(`❌ WebSocket error from ${nodeId}:`, err.message);
    });
});

// ═══════════════════════════════════════════════════════════════════
// BRIDGE SYSTEM
// ═══════════════════════════════════════════════════════════════════

/**
 * Handle incoming bridge connection (from another relay)
 */
function handleBridgeConnection(ws, connectionId, req) {
    const bridgeName = req.headers['x-bridge-name'] || 'unknown-relay';
    const bridgeRegion = req.headers['x-bridge-region'] || 'unknown';

    console.log(`\n🌉 BRIDGE CONNECTION from ${bridgeName} (${bridgeRegion})`);

    bridgeConnections.set(connectionId, {
        ws: ws,
        name: bridgeName,
        region: bridgeRegion,
        connectedAt: Date.now(),
        lastSeen: Date.now(),
        peers: []
    });

    stats.bridgeConnections = bridgeConnections.size;

    ws.send(JSON.stringify({
        type: 'bridge_welcome',
        relayName: RELAY_NAME,
        relayRegion: RELAY_REGION,
        localPeers: getLocalPeerList(),
        timestamp: Date.now()
    }));

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            handleBridgeMessage(connectionId, msg);
        } catch (err) {
            console.error(`❌ Bridge message error:`, err.message);
        }
    });

    ws.on('close', () => {
        console.log(`\n🌉 Bridge disconnected: ${bridgeName}`);

        // Remove remote peers from this bridge
        for (const [peerId, peer] of remotePeers) {
            if (peer.bridgeId === connectionId) {
                remotePeers.delete(peerId);
            }
        }

        bridgeConnections.delete(connectionId);
        stats.bridgeConnections = bridgeConnections.size;
        stats.remotePeers = remotePeers.size;
    });
}

/**
 * Handle messages from bridge relays
 */
function handleBridgeMessage(connectionId, msg) {
    const bridge = bridgeConnections.get(connectionId);
    if (!bridge) return;

    bridge.lastSeen = Date.now();

    switch (msg.type) {
        case 'peer_sync':
            // Received peer list from another relay
            console.log(`📋 Peer sync from ${bridge.name}: ${msg.peers?.length || 0} peers`);

            // Clear old peers from this bridge
            for (const [peerId, peer] of remotePeers) {
                if (peer.bridgeId === connectionId) {
                    remotePeers.delete(peerId);
                }
            }

            // Add new peers
            if (msg.peers) {
                msg.peers.forEach(peer => {
                    remotePeers.set(peer.nodeId, {
                        ...peer,
                        bridgeId: connectionId,
                        bridgeName: bridge.name,
                        isRemote: true
                    });
                });
            }

            stats.remotePeers = remotePeers.size;

            // Broadcast updated peer list to local nodes
            broadcastNodeList();
            break;

        case 'bridge_message':
            // Message to forward to a local node
            stats.bridgeMessages++;
            console.log(`📨 Bridge message from ${bridge.name} -> ${msg.targetAddress}`);

            // Find local node
            let targetNode = null;
            for (const [id, node] of nodes) {
                if (node.address === msg.targetAddress || id === msg.targetNodeId) {
                    targetNode = node;
                    break;
                }
            }

            if (targetNode && targetNode.ws.readyState === WebSocket.OPEN) {
                targetNode.ws.send(JSON.stringify({
                    type: 'nodeMessage',
                    from: msg.from,
                    fromNodeId: msg.fromNodeId,
                    fromRelay: bridge.name,
                    payload: msg.payload,
                    bridged: true,
                    timestamp: Date.now()
                }));
                console.log(`   ✅ Delivered to ${msg.targetAddress}`);
            } else {
                console.log(`   ❌ Target not found: ${msg.targetAddress}`);
            }
            break;

        case 'bridge_broadcast':
            // Broadcast from another relay to all local nodes
            stats.bridgeMessages++;
            console.log(`📢 Bridge broadcast from ${bridge.name}`);

            const broadcastMsg = {
                type: 'nodeMessage',
                from: msg.from,
                fromNodeId: msg.fromNodeId,
                fromRelay: bridge.name,
                payload: msg.payload,
                broadcast: true,
                bridged: true,
                timestamp: Date.now()
            };

            for (const [id, node] of nodes) {
                if (node.ws.readyState === WebSocket.OPEN) {
                    node.ws.send(JSON.stringify(broadcastMsg));
                }
            }
            break;

        case 'bridge_ping':
            bridge.ws.send(JSON.stringify({
                type: 'bridge_pong',
                timestamp: Date.now()
            }));
            break;
    }
}

/**
 * Connect to peer relay servers (outbound bridge)
 */
function connectToBridgePeers() {
    if (!config.bridge.enabled || !config.bridge.peers) {
        console.log('🌉 Bridge mode disabled or no peers configured');
        return;
    }

    console.log(`\n🌉 Connecting to ${config.bridge.peers.length} bridge peers...`);

    config.bridge.peers.forEach(peer => {
        if (!peer.enabled) {
            console.log(`   ⏸️  ${peer.name}: Disabled`);
            return;
        }

        connectToBridge(peer);
    });
}

/**
 * Connect to a single bridge peer
 */
function connectToBridge(peer) {
    const url = `ws://${peer.host}:${peer.port}`;
    console.log(`   🔗 Connecting to ${peer.name} (${url})...`);

    try {
        const ws = new WebSocket(url, {
            headers: {
                'x-bridge-relay': 'true',
                'x-bridge-name': RELAY_NAME,
                'x-bridge-region': RELAY_REGION
            }
        });

        ws.on('open', () => {
            console.log(`   ✅ Connected to ${peer.name}!`);

            bridgeConnections.set(peer.name, {
                ws: ws,
                name: peer.name,
                host: peer.host,
                port: peer.port,
                outbound: true,
                connectedAt: Date.now(),
                lastSeen: Date.now(),
                peers: []
            });

            stats.bridgeConnections = bridgeConnections.size;

            // Send our peer list
            syncPeersToBridge(peer.name);
        });

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                handleBridgeMessage(peer.name, msg);
            } catch (err) {
                console.error(`❌ Bridge message error from ${peer.name}:`, err.message);
            }
        });

        ws.on('close', () => {
            console.log(`\n🌉 Lost connection to ${peer.name}`);
            bridgeConnections.delete(peer.name);
            stats.bridgeConnections = bridgeConnections.size;

            // Remove remote peers from this bridge
            for (const [peerId, remotePeer] of remotePeers) {
                if (remotePeer.bridgeName === peer.name) {
                    remotePeers.delete(peerId);
                }
            }
            stats.remotePeers = remotePeers.size;

            // Reconnect after delay
            setTimeout(() => {
                if (peer.enabled) {
                    connectToBridge(peer);
                }
            }, config.bridge.reconnectInterval);
        });

        ws.on('error', (err) => {
            console.error(`   ❌ Bridge error (${peer.name}): ${err.message}`);
        });

    } catch (err) {
        console.error(`   ❌ Failed to connect to ${peer.name}: ${err.message}`);

        // Retry after delay
        setTimeout(() => {
            if (peer.enabled) {
                connectToBridge(peer);
            }
        }, config.bridge.reconnectInterval);
    }
}

/**
 * Sync local peers to a specific bridge
 */
function syncPeersToBridge(bridgeName) {
    const bridge = bridgeConnections.get(bridgeName);
    if (!bridge || bridge.ws.readyState !== WebSocket.OPEN) return;

    bridge.ws.send(JSON.stringify({
        type: 'peer_sync',
        relayName: RELAY_NAME,
        peers: getLocalPeerList(),
        timestamp: Date.now()
    }));
}

/**
 * Sync local peers to all connected bridges
 */
function syncPeersToBridges() {
    for (const [name, bridge] of bridgeConnections) {
        if (bridge.ws.readyState === WebSocket.OPEN) {
            syncPeersToBridge(name);
        }
    }
}

/**
 * Get list of local peers (for syncing)
 */
function getLocalPeerList() {
    return Array.from(nodes.values()).map(n => ({
        nodeId: n.id,
        address: n.address,
        ip: n.ip,
        port: n.port,
        blockchainHeight: n.blockchainHeight,
        relay: RELAY_NAME,
        region: RELAY_REGION
    }));
}

// ═══════════════════════════════════════════════════════════════════
// NODE MESSAGE HANDLING
// ═══════════════════════════════════════════════════════════════════

function handleNodeMessage(ws, nodeId, msg, clientIP) {
    switch (msg.type) {
        case 'register':
            console.log(`\n📝 Registration from ${msg.address || nodeId}`);

            nodes.set(nodeId, {
                id: nodeId,
                address: msg.address,
                ip: clientIP,
                port: msg.port || 5000,
                blockchainHeight: msg.blockchainHeight || 0,
                lastSeen: Date.now(),
                ws: ws
            });

            stats.activeNodes = nodes.size;

            ws.send(JSON.stringify({
                type: 'registered',
                nodeId: nodeId,
                relayName: RELAY_NAME,
                timestamp: Date.now()
            }));

            broadcastNodeList();
            syncPeersToBridges(); // Sync to bridge peers
            break;

        case 'getPeers':
            // Include both local and remote peers
            const allPeers = [
                ...Array.from(nodes.values())
                    .filter(n => n.id !== nodeId)
                    .map(n => ({
                        nodeId: n.id,
                        address: n.address,
                        ip: n.ip,
                        port: n.port,
                        blockchainHeight: n.blockchainHeight,
                        local: true,
                        relay: RELAY_NAME
                    })),
                ...Array.from(remotePeers.values()).map(p => ({
                    nodeId: p.nodeId,
                    address: p.address,
                    ip: p.ip,
                    port: p.port,
                    blockchainHeight: p.blockchainHeight,
                    remote: true,
                    relay: p.relay,
                    bridgeName: p.bridgeName
                }))
            ];

            ws.send(JSON.stringify({
                type: 'peerList',
                peers: allPeers,
                localCount: nodes.size - 1,
                remoteCount: remotePeers.size,
                count: allPeers.length,
                timestamp: Date.now()
            }));
            break;

        case 'ping':
            if (nodes.has(nodeId)) {
                nodes.get(nodeId).lastSeen = Date.now();
            }
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;

        case 'relayMessage':
            // Check if target is local or remote
            const targetAddress = msg.targetAddress;
            const targetNodeId = msg.targetNodeId;

            // Try local first
            let targetNode = null;
            for (const [id, node] of nodes) {
                if (node.address === targetAddress || id === targetNodeId) {
                    targetNode = node;
                    break;
                }
            }

            if (targetNode && targetNode.ws.readyState === WebSocket.OPEN) {
                // Local delivery
                const senderNode = nodes.get(nodeId);
                targetNode.ws.send(JSON.stringify({
                    type: 'nodeMessage',
                    from: senderNode?.address || nodeId,
                    fromNodeId: nodeId,
                    payload: msg.payload,
                    timestamp: Date.now()
                }));
                console.log(`📨 Local relay: ${senderNode?.address} → ${targetNode.address}`);
                ws.send(JSON.stringify({ type: 'relaySuccess', timestamp: Date.now() }));
            } else {
                // Try remote (via bridge)
                let remotePeer = null;
                for (const [id, peer] of remotePeers) {
                    if (peer.address === targetAddress || id === targetNodeId) {
                        remotePeer = peer;
                        break;
                    }
                }

                if (remotePeer) {
                    // Forward via bridge
                    const bridge = bridgeConnections.get(remotePeer.bridgeName);
                    if (bridge && bridge.ws.readyState === WebSocket.OPEN) {
                        const senderNode = nodes.get(nodeId);
                        bridge.ws.send(JSON.stringify({
                            type: 'bridge_message',
                            from: senderNode?.address || nodeId,
                            fromNodeId: nodeId,
                            targetAddress: targetAddress,
                            targetNodeId: targetNodeId,
                            payload: msg.payload,
                            timestamp: Date.now()
                        }));
                        console.log(`🌉 Bridge relay: ${senderNode?.address} → ${remotePeer.address} (via ${remotePeer.bridgeName})`);
                        ws.send(JSON.stringify({ type: 'relaySuccess', bridged: true, timestamp: Date.now() }));
                    } else {
                        ws.send(JSON.stringify({ type: 'relayFailed', reason: 'Bridge not connected' }));
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'relayFailed', reason: 'Target not found' }));
                }
            }
            break;

        case 'broadcast':
            const sender = nodes.get(nodeId);
            const broadcastPayload = {
                type: 'nodeMessage',
                from: sender?.address || nodeId,
                fromNodeId: nodeId,
                payload: msg.payload,
                broadcast: true,
                timestamp: Date.now()
            };

            // Broadcast to local nodes
            let localCount = 0;
            for (const [id, node] of nodes) {
                if (id !== nodeId && node.ws.readyState === WebSocket.OPEN) {
                    node.ws.send(JSON.stringify(broadcastPayload));
                    localCount++;
                }
            }

            // Forward to bridges for remote broadcast
            for (const [name, bridge] of bridgeConnections) {
                if (bridge.ws.readyState === WebSocket.OPEN) {
                    bridge.ws.send(JSON.stringify({
                        type: 'bridge_broadcast',
                        from: sender?.address || nodeId,
                        fromNodeId: nodeId,
                        payload: msg.payload,
                        timestamp: Date.now()
                    }));
                }
            }

            console.log(`📢 Broadcast from ${sender?.address}: ${localCount} local + ${bridgeConnections.size} bridges`);
            ws.send(JSON.stringify({
                type: 'broadcastSent',
                localRecipients: localCount,
                bridgedTo: bridgeConnections.size,
                timestamp: Date.now()
            }));
            break;

        default:
            ws.send(JSON.stringify({ type: 'error', message: `Unknown type: ${msg.type}` }));
    }
}

/**
 * Broadcast peer list to all local nodes
 */
function broadcastNodeList() {
    const allPeers = [
        ...Array.from(nodes.values()).map(n => ({
            nodeId: n.id,
            address: n.address,
            local: true,
            relay: RELAY_NAME
        })),
        ...Array.from(remotePeers.values()).map(p => ({
            nodeId: p.nodeId,
            address: p.address,
            remote: true,
            relay: p.relay,
            bridgeName: p.bridgeName
        }))
    ];

    const message = JSON.stringify({
        type: 'peerListUpdate',
        peers: allPeers,
        localCount: nodes.size,
        remoteCount: remotePeers.size,
        timestamp: Date.now()
    });

    for (const [nodeId, node] of nodes) {
        if (node.ws.readyState === WebSocket.OPEN) {
            node.ws.send(message);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// HTTP DASHBOARD
// ═══════════════════════════════════════════════════════════════════

app.get('/', (req, res) => {
    const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>RangerBlock Relay - ${RELAY_NAME}</title>
    <style>
        body { font-family: 'Monaco', monospace; background: linear-gradient(135deg, #1e3c72, #2a5298); color: #0f0; padding: 40px; margin: 0; }
        .container { max-width: 1200px; margin: 0 auto; background: rgba(0,0,0,0.8); border: 2px solid #0f0; border-radius: 10px; padding: 30px; }
        h1 { text-align: center; text-shadow: 0 0 10px #0f0; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat { background: rgba(0,255,0,0.1); border: 1px solid #0f0; border-radius: 8px; padding: 15px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; }
        .stat-label { color: #0dd; font-size: 0.8em; }
        .section { background: rgba(0,255,0,0.05); border: 1px solid #0f0; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .section h2 { margin-top: 0; color: #0f0; }
        .peer { background: rgba(0,255,0,0.1); border: 1px solid #0f0; border-radius: 5px; padding: 10px; margin: 8px 0; }
        .bridge { background: rgba(0,255,255,0.1); border: 1px solid #0ff; }
        .remote { opacity: 0.8; border-style: dashed; }
        .footer { text-align: center; color: #0dd; margin-top: 20px; padding-top: 15px; border-top: 1px solid #0f0; }
    </style>
    <meta http-equiv="refresh" content="5">
</head>
<body>
    <div class="container">
        <h1>🎖️ RANGERBLOCK RELAY - ${RELAY_NAME.toUpperCase()}</h1>
        <p style="text-align:center;color:#0dd;">Region: ${RELAY_REGION} | Bridge: ${config.bridge.enabled ? 'ENABLED' : 'DISABLED'}</p>

        <div class="stats">
            <div class="stat"><div class="stat-value">${stats.activeNodes}</div><div class="stat-label">Local Nodes</div></div>
            <div class="stat"><div class="stat-value">${stats.remotePeers}</div><div class="stat-label">Remote Peers</div></div>
            <div class="stat"><div class="stat-value">${stats.bridgeConnections}</div><div class="stat-label">Bridges</div></div>
            <div class="stat"><div class="stat-value">${stats.totalMessages}</div><div class="stat-label">Messages</div></div>
            <div class="stat"><div class="stat-value">${stats.bridgeMessages}</div><div class="stat-label">Bridged</div></div>
            <div class="stat"><div class="stat-value">${hours}h${minutes}m</div><div class="stat-label">Uptime</div></div>
        </div>

        <div class="section">
            <h2>🌐 Local Nodes (${nodes.size})</h2>
            ${Array.from(nodes.values()).map(n => `
                <div class="peer">
                    <strong>${n.address || n.id}</strong><br>
                    <small>IP: ${n.ip}:${n.port} | Height: ${n.blockchainHeight} | ${Math.floor((Date.now()-n.lastSeen)/1000)}s ago</small>
                </div>
            `).join('') || '<div style="color:#0dd;padding:10px;">No local nodes</div>'}
        </div>

        <div class="section">
            <h2>🌉 Bridge Connections (${bridgeConnections.size})</h2>
            ${Array.from(bridgeConnections.values()).map(b => `
                <div class="peer bridge">
                    <strong>${b.name}</strong> (${b.region || 'unknown'})<br>
                    <small>${b.host || 'inbound'}:${b.port || ''} | ${b.outbound ? 'Outbound' : 'Inbound'} | ${Math.floor((Date.now()-b.lastSeen)/1000)}s ago</small>
                </div>
            `).join('') || '<div style="color:#0dd;padding:10px;">No bridge connections</div>'}
        </div>

        <div class="section">
            <h2>🌍 Remote Peers (${remotePeers.size})</h2>
            ${Array.from(remotePeers.values()).map(p => `
                <div class="peer remote">
                    <strong>${p.address || p.nodeId}</strong><br>
                    <small>Via: ${p.bridgeName} (${p.relay}) | Height: ${p.blockchainHeight || 0}</small>
                </div>
            `).join('') || '<div style="color:#0dd;padding:10px;">No remote peers</div>'}
        </div>

        <div class="footer">
            WebSocket: ${WS_PORT} | Dashboard: ${HTTP_PORT}<br>
            Rangers lead the way! 🎖️
        </div>
    </div>
</body>
</html>`;
    res.send(html);
});

app.get('/api/nodes', (req, res) => {
    res.json({
        relay: { name: RELAY_NAME, region: RELAY_REGION },
        local: Array.from(nodes.values()).map(n => ({ nodeId: n.id, address: n.address, ip: n.ip, port: n.port })),
        remote: Array.from(remotePeers.values()),
        bridges: Array.from(bridgeConnections.values()).map(b => ({ name: b.name, region: b.region, outbound: b.outbound })),
        stats: stats
    });
});

app.listen(HTTP_PORT, () => {
    console.log(`✅ HTTP dashboard on port ${HTTP_PORT}`);
    console.log(`\n📊 Dashboard: http://localhost:${HTTP_PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${WS_PORT}`);
});

// ═══════════════════════════════════════════════════════════════════
// STARTUP & MAINTENANCE
// ═══════════════════════════════════════════════════════════════════

// Connect to bridge peers on startup
setTimeout(() => {
    connectToBridgePeers();
}, 2000);

// Periodic peer sync to bridges
setInterval(() => {
    syncPeersToBridges();
}, config.bridge.heartbeatInterval);

// Cleanup inactive nodes
setInterval(() => {
    const now = Date.now();
    for (const [id, node] of nodes) {
        if (now - node.lastSeen > 120000) {
            console.log(`🧹 Removing inactive: ${node.address || id}`);
            nodes.delete(id);
        }
    }
    stats.activeNodes = nodes.size;
}, 60000);

// Generate node ID
function generateNodeId() {
    return crypto.randomBytes(8).toString('hex');
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');

    for (const [id, node] of nodes) {
        if (node.ws.readyState === WebSocket.OPEN) {
            node.ws.send(JSON.stringify({ type: 'serverShutdown' }));
            node.ws.close();
        }
    }

    for (const [name, bridge] of bridgeConnections) {
        if (bridge.ws.readyState === WebSocket.OPEN) {
            bridge.ws.close();
        }
    }

    console.log('🎖️ Rangers lead the way!\n');
    process.exit(0);
});

console.log('\n🎖️ Ready! Bridge mode:', config.bridge.enabled ? 'ENABLED' : 'DISABLED');
console.log('');

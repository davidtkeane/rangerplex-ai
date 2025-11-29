#!/usr/bin/env node
/**
 * 🎖️ RANGERBLOCK RELAY SERVER
 *
 * Purpose: Help RangerBlock nodes discover each other across different networks
 * Cost: ~$5/month on DigitalOcean
 * Deployment: Deploy this to any VPS with static IP
 *
 * How it works:
 * 1. Nodes connect to this relay server
 * 2. Nodes register their public IP/port
 * 3. Relay gives nodes a list of other active nodes
 * 4. Nodes connect directly to each other (P2P!)
 * 5. Relay is only for discovery, not for blockchain data
 */

const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');

// Configuration
const HTTP_PORT = 3000;  // For status dashboard
const WS_PORT = 8080;    // For WebSocket connections

const app = express();

// Active nodes registry
const nodes = new Map();

// Statistics
const stats = {
    totalConnections: 0,
    activeNodes: 0,
    totalMessages: 0,
    startTime: Date.now()
};

// WebSocket Server (for node connections)
const wss = new WebSocket.Server({ port: WS_PORT });

console.log('🎖️ '.repeat(30));
console.log('   RANGERBLOCK RELAY SERVER');
console.log('   Discovery & Bootstrap Service');
console.log('🎖️ '.repeat(30));
console.log(`\n✅ WebSocket server listening on port ${WS_PORT}`);

wss.on('connection', (ws, req) => {
    const nodeId = generateNodeId();
    const clientIP = req.socket.remoteAddress;

    stats.totalConnections++;
    stats.activeNodes = nodes.size + 1;

    console.log(`\n📥 New connection from ${clientIP}`);
    console.log(`   Assigned node ID: ${nodeId}`);

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'welcome',
        nodeId: nodeId,
        message: 'Connected to RangerBlock Relay Server',
        timestamp: Date.now()
    }));

    // Handle messages from node
    ws.on('message', (data) => {
        stats.totalMessages++;

        try {
            const msg = JSON.parse(data);
            handleNodeMessage(ws, nodeId, msg, clientIP);
        } catch (err) {
            console.error(`❌ Invalid message from ${nodeId}:`, err.message);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });

    // Handle disconnection
    ws.on('close', () => {
        if (nodes.has(nodeId)) {
            const node = nodes.get(nodeId);
            console.log(`\n❌ Node disconnected: ${node.address || nodeId}`);
            nodes.delete(nodeId);
            stats.activeNodes = nodes.size;

            // Notify other nodes
            broadcastNodeList();
        }
    });

    // Handle errors
    ws.on('error', (err) => {
        console.error(`❌ WebSocket error from ${nodeId}:`, err.message);
    });
});

/**
 * Handle messages from blockchain nodes
 */
function handleNodeMessage(ws, nodeId, msg, clientIP) {
    switch (msg.type) {
        case 'register':
            // Node registers with its information
            console.log(`\n📝 Registration from ${msg.address || nodeId}`);
            console.log(`   Public IP: ${clientIP}`);
            console.log(`   Port: ${msg.port || 'unknown'}`);
            console.log(`   Blockchain Height: ${msg.blockchainHeight || 0}`);

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
                assignedIP: clientIP,
                timestamp: Date.now()
            }));

            // Broadcast updated node list to all nodes
            broadcastNodeList();
            break;

        case 'getPeers':
            // Node requests list of other active nodes
            console.log(`📋 Peer list request from ${msg.address || nodeId}`);

            const peerList = Array.from(nodes.values())
                .filter(n => n.id !== nodeId) // Don't include requester
                .map(n => ({
                    nodeId: n.id,
                    address: n.address,
                    ip: n.ip,
                    port: n.port,
                    blockchainHeight: n.blockchainHeight
                }));

            ws.send(JSON.stringify({
                type: 'peerList',
                peers: peerList,
                count: peerList.length,
                timestamp: Date.now()
            }));

            console.log(`   Sent ${peerList.length} peers`);
            break;

        case 'ping':
            // Node sends heartbeat to stay active
            if (nodes.has(nodeId)) {
                nodes.get(nodeId).lastSeen = Date.now();
            }

            ws.send(JSON.stringify({
                type: 'pong',
                timestamp: Date.now()
            }));
            break;

        case 'updateStatus':
            // Node updates its status (blockchain height, etc.)
            if (nodes.has(nodeId)) {
                const node = nodes.get(nodeId);
                node.blockchainHeight = msg.blockchainHeight || node.blockchainHeight;
                node.lastSeen = Date.now();

                console.log(`🔄 Status update from ${node.address}: Height ${node.blockchainHeight}`);
            }
            break;

        default:
            console.log(`⚠️  Unknown message type: ${msg.type}`);
            ws.send(JSON.stringify({
                type: 'error',
                message: `Unknown message type: ${msg.type}`
            }));
    }
}

/**
 * Broadcast updated node list to all connected nodes
 */
function broadcastNodeList() {
    const peerList = Array.from(nodes.values()).map(n => ({
        nodeId: n.id,
        address: n.address,
        ip: n.ip,
        port: n.port,
        blockchainHeight: n.blockchainHeight
    }));

    const message = JSON.stringify({
        type: 'peerListUpdate',
        peers: peerList,
        count: peerList.length,
        timestamp: Date.now()
    });

    for (const [nodeId, node] of nodes) {
        if (node.ws.readyState === WebSocket.OPEN) {
            node.ws.send(message);
        }
    }
}

/**
 * Cleanup inactive nodes every 60 seconds
 */
setInterval(() => {
    const now = Date.now();
    let removedCount = 0;

    for (const [id, node] of nodes) {
        // Remove nodes that haven't sent a ping in 2 minutes
        if (now - node.lastSeen > 120000) {
            console.log(`\n🧹 Removing inactive node: ${node.address || id}`);
            console.log(`   Last seen: ${Math.floor((now - node.lastSeen) / 1000)}s ago`);
            nodes.delete(id);
            removedCount++;
        }
    }

    if (removedCount > 0) {
        stats.activeNodes = nodes.size;
        broadcastNodeList();
    }
}, 60000);

/**
 * HTTP Server for status dashboard
 */
app.get('/', (req, res) => {
    const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>RangerBlock Relay Server</title>
    <style>
        body {
            font-family: 'Monaco', 'Courier New', monospace;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: #00ff00;
            padding: 40px;
            margin: 0;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        }
        h1 {
            text-align: center;
            color: #00ff00;
            text-shadow: 0 0 10px #00ff00;
            margin-bottom: 30px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .stat-label {
            color: #00dddd;
            font-size: 0.9em;
            margin-bottom: 10px;
        }
        .stat-value {
            color: #00ff00;
            font-size: 2.5em;
            font-weight: bold;
        }
        .node-list {
            background: rgba(0, 255, 0, 0.05);
            border: 1px solid #00ff00;
            border-radius: 8px;
            padding: 20px;
        }
        .node-item {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .node-name {
            color: #00ff00;
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .node-info {
            color: #00dddd;
            font-size: 0.9em;
        }
        .footer {
            text-align: center;
            color: #00dddd;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #00ff00;
        }
    </style>
    <meta http-equiv="refresh" content="5">
</head>
<body>
    <div class="container">
        <h1>🎖️ RANGERBLOCK RELAY SERVER</h1>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-label">Active Nodes</div>
                <div class="stat-value">${stats.activeNodes}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Connections</div>
                <div class="stat-value">${stats.totalConnections}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Messages Processed</div>
                <div class="stat-value">${stats.totalMessages}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Uptime</div>
                <div class="stat-value">${hours}h ${minutes}m ${seconds}s</div>
            </div>
        </div>

        <div class="node-list">
            <h2 style="color: #00ff00; margin-bottom: 20px;">🌐 Active Nodes</h2>
            ${Array.from(nodes.values()).map(node => `
                <div class="node-item">
                    <div class="node-name">${node.address || node.id}</div>
                    <div class="node-info">
                        📍 IP: ${node.ip}:${node.port}<br>
                        ⛓️ Blockchain Height: ${node.blockchainHeight}<br>
                        🕐 Last Seen: ${Math.floor((Date.now() - node.lastSeen) / 1000)}s ago
                    </div>
                </div>
            `).join('') || '<div style="color: #00dddd; text-align: center; padding: 20px;">No active nodes</div>'}
        </div>

        <div class="footer">
            <div style="font-size: 0.9em;">
                WebSocket Port: ${WS_PORT} | HTTP Port: ${HTTP_PORT}
            </div>
            <div style="margin-top: 10px;">
                Rangers lead the way! 🎖️
            </div>
        </div>
    </div>
</body>
</html>
    `;

    res.send(html);
});

// API endpoint for node list (JSON)
app.get('/api/nodes', (req, res) => {
    const nodeList = Array.from(nodes.values()).map(n => ({
        nodeId: n.id,
        address: n.address,
        ip: n.ip,
        port: n.port,
        blockchainHeight: n.blockchainHeight,
        lastSeen: n.lastSeen
    }));

    res.json({
        success: true,
        count: nodeList.length,
        nodes: nodeList,
        timestamp: Date.now()
    });
});

// API endpoint for stats
app.get('/api/stats', (req, res) => {
    res.json({
        success: true,
        stats: {
            ...stats,
            uptime: Date.now() - stats.startTime
        },
        timestamp: Date.now()
    });
});

app.listen(HTTP_PORT, () => {
    console.log(`✅ HTTP server listening on port ${HTTP_PORT}`);
    console.log(`\n📊 Dashboard: http://localhost:${HTTP_PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${WS_PORT}`);
    console.log(`\n🎖️ Ready to help RangerBlock nodes discover each other!\n`);
});

/**
 * Generate unique node ID
 */
function generateNodeId() {
    return crypto.randomBytes(8).toString('hex');
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down relay server...');

    // Notify all nodes
    const shutdownMsg = JSON.stringify({
        type: 'serverShutdown',
        message: 'Relay server is shutting down',
        timestamp: Date.now()
    });

    for (const [nodeId, node] of nodes) {
        if (node.ws.readyState === WebSocket.OPEN) {
            node.ws.send(shutdownMsg);
            node.ws.close();
        }
    }

    console.log('✅ All connections closed');
    console.log('🎖️ Rangers lead the way!\n');
    process.exit(0);
});

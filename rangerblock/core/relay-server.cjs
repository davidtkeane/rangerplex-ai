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
const HTTP_PORT = 5556;  // For status dashboard (5555+1)
const WS_PORT = 5555;    // For WebSocket connections

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

        case 'relayMessage':
            // Route message from one node to another (node-to-node comms!)
            const targetNodeId = msg.targetNodeId;
            const targetAddress = msg.targetAddress;

            // Find target by nodeId or address
            let targetNode = null;
            if (targetNodeId && nodes.has(targetNodeId)) {
                targetNode = nodes.get(targetNodeId);
            } else if (targetAddress) {
                for (const [id, node] of nodes) {
                    if (node.address === targetAddress) {
                        targetNode = node;
                        break;
                    }
                }
            }

            if (targetNode && targetNode.ws.readyState === WebSocket.OPEN) {
                const senderNode = nodes.get(nodeId);
                const relayedMsg = {
                    type: 'nodeMessage',
                    from: senderNode ? senderNode.address : nodeId,
                    fromNodeId: nodeId,
                    payload: msg.payload,
                    timestamp: Date.now()
                };
                targetNode.ws.send(JSON.stringify(relayedMsg));

                console.log(`📨 Relayed message: ${senderNode?.address || nodeId} → ${targetNode.address}`);
                console.log(`   Type: ${msg.payload?.type || 'unknown'}`);

                ws.send(JSON.stringify({
                    type: 'relaySuccess',
                    targetAddress: targetNode.address,
                    timestamp: Date.now()
                }));
            } else {
                console.log(`❌ Relay failed: Target not found (${targetAddress || targetNodeId})`);
                ws.send(JSON.stringify({
                    type: 'relayFailed',
                    reason: 'Target node not found or disconnected',
                    targetAddress: targetAddress,
                    targetNodeId: targetNodeId
                }));
            }
            break;

        case 'broadcast':
            // Broadcast message to ALL connected nodes
            const sender = nodes.get(nodeId);
            const broadcastMsg = {
                type: 'nodeMessage',
                from: sender ? sender.address : nodeId,
                fromNodeId: nodeId,
                payload: msg.payload,
                broadcast: true,
                timestamp: Date.now()
            };

            let sentCount = 0;
            for (const [id, node] of nodes) {
                if (id !== nodeId && node.ws.readyState === WebSocket.OPEN) {
                    node.ws.send(JSON.stringify(broadcastMsg));
                    sentCount++;
                }
            }

            console.log(`📢 Broadcast from ${sender?.address || nodeId} to ${sentCount} nodes`);

            ws.send(JSON.stringify({
                type: 'broadcastSent',
                recipients: sentCount,
                timestamp: Date.now()
            }));
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

// Web Chat endpoint - serves directly from relay (no HTTPS mixed content issues!)
app.get('/chat', (req, res) => {
    const chatHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>RangerBlock Chat v1.1.0</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐉</text></svg>">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --bg-dark: #0a0a1a; --bg-card: #1a1a2e; --bg-input: #0d0d1a;
            --border: #3b82f6; --border-dim: rgba(59, 130, 246, 0.3);
            --text: #e0e0ff; --text-dim: #6b7280; --accent: #3b82f6;
            --accent-glow: rgba(59, 130, 246, 0.5); --success: #22c55e;
            --warning: #f59e0b; --error: #ef4444; --system: #a855f7;
        }
        body {
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            background: var(--bg-dark); color: var(--text);
            min-height: 100vh; display: flex; flex-direction: column;
        }
        .header {
            background: linear-gradient(135deg, var(--bg-card) 0%, #16213e 100%);
            border-bottom: 1px solid var(--border-dim); padding: 12px 16px;
            display: flex; align-items: center; justify-content: space-between;
            position: sticky; top: 0; z-index: 100;
        }
        .header-left { display: flex; align-items: center; gap: 10px; }
        .logo { font-size: 24px; }
        .title { font-weight: bold; font-size: 16px; color: var(--accent); }
        .subtitle { font-size: 10px; color: var(--text-dim); }
        .status {
            display: flex; align-items: center; gap: 6px; font-size: 11px;
            padding: 4px 10px; border-radius: 20px; background: var(--bg-dark);
        }
        .status.connected { color: var(--success); border: 1px solid var(--success); }
        .status.disconnected { color: var(--error); border: 1px solid var(--error); }
        .status.connecting { color: var(--warning); border: 1px solid var(--warning); }
        .status-dot {
            width: 8px; height: 8px; border-radius: 50%; background: currentColor;
            animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .messages {
            flex: 1; overflow-y: auto; padding: 12px;
            display: flex; flex-direction: column; gap: 8px;
        }
        .message {
            padding: 8px 12px; border-radius: 8px; max-width: 85%;
            word-wrap: break-word; animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .message.own {
            align-self: flex-end;
            background: linear-gradient(135deg, var(--accent) 0%, #6366f1 100%); color: white;
        }
        .message.other {
            align-self: flex-start; background: var(--bg-card); border: 1px solid var(--border-dim);
        }
        .message.system {
            align-self: center; background: transparent; color: var(--system);
            font-size: 12px; text-align: center; padding: 4px 12px;
        }
        .message.join { color: var(--success); }
        .message.leave { color: var(--error); }
        .message-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: 11px; }
        .message-sender { font-weight: bold; color: var(--accent); }
        .message.own .message-sender { color: rgba(255,255,255,0.8); }
        .message-time { color: var(--text-dim); font-size: 10px; }
        .message.own .message-time { color: rgba(255,255,255,0.6); }
        .message-content { font-size: 14px; line-height: 1.4; }
        .input-area {
            background: var(--bg-card); border-top: 1px solid var(--border-dim);
            padding: 12px; display: flex; gap: 10px; position: sticky; bottom: 0;
        }
        .input-wrapper { flex: 1; position: relative; }
        .message-input {
            width: 100%; padding: 12px 16px; background: var(--bg-input);
            border: 1px solid var(--border-dim); border-radius: 24px;
            color: var(--text); font-family: inherit; font-size: 14px; outline: none;
        }
        .message-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
        .message-input::placeholder { color: var(--text-dim); }
        .send-btn {
            width: 48px; height: 48px; border-radius: 50%;
            background: linear-gradient(135deg, var(--accent) 0%, #6366f1 100%);
            border: none; color: white; font-size: 20px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
        }
        .send-btn:active { transform: scale(0.95); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.8);
            backdrop-filter: blur(4px); display: flex; align-items: center;
            justify-content: center; z-index: 1000; padding: 20px;
        }
        .modal {
            background: var(--bg-card); border: 1px solid var(--border-dim);
            border-radius: 16px; padding: 24px; width: 100%; max-width: 360px;
            animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .modal-header { text-align: center; margin-bottom: 24px; }
        .modal-logo { font-size: 48px; margin-bottom: 12px; }
        .modal-title { font-size: 20px; font-weight: bold; color: var(--accent); margin-bottom: 4px; }
        .modal-subtitle { font-size: 12px; color: var(--text-dim); }
        .form-group { margin-bottom: 16px; }
        .form-label { display: block; font-size: 11px; color: var(--text-dim); margin-bottom: 6px; text-transform: uppercase; }
        .form-input {
            width: 100%; padding: 12px; background: var(--bg-input);
            border: 1px solid var(--border-dim); border-radius: 8px;
            color: var(--text); font-family: inherit; font-size: 14px; outline: none;
        }
        .form-input:focus { border-color: var(--accent); }
        .connect-btn {
            width: 100%; padding: 14px;
            background: linear-gradient(135deg, var(--accent) 0%, #6366f1 100%);
            border: none; border-radius: 8px; color: white;
            font-family: inherit; font-size: 14px; font-weight: bold; cursor: pointer;
        }
        .connect-btn:hover { box-shadow: 0 4px 20px var(--accent-glow); }
        .connect-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .server-info { text-align: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-dim); font-size: 11px; color: var(--text-dim); }
        .users-panel { background: var(--bg-card); border-bottom: 1px solid var(--border-dim); padding: 8px 12px; display: flex; gap: 8px; overflow-x: auto; }
        .user-chip { display: flex; align-items: center; gap: 4px; padding: 4px 10px; background: var(--bg-dark); border-radius: 16px; font-size: 11px; white-space: nowrap; }
        .footer { text-align: center; padding: 8px; font-size: 10px; color: var(--text-dim); background: var(--bg-card); }
        input { -webkit-appearance: none; }
    </style>
</head>
<body>
    <div class="modal-overlay" id="connectModal">
        <div class="modal">
            <div class="modal-header">
                <div class="modal-logo">🐉</div>
                <div class="modal-title">RangerBlock Chat</div>
                <div class="modal-subtitle">P2P Blockchain Network</div>
            </div>
            <div class="form-group">
                <label class="form-label">Your Nickname</label>
                <input type="text" class="form-input" id="nickname" placeholder="Enter nickname...">
            </div>
            <button class="connect-btn" id="connectBtn" onclick="connect()">🚀 Join Network</button>
            <div class="server-info">
                <div>AWS Relay: Direct Connection</div>
                <div style="margin-top: 4px;">Master's Thesis - NCI College, Dublin</div>
            </div>
        </div>
    </div>
    <div class="header">
        <div class="header-left">
            <span class="logo">🐉</span>
            <div><div class="title">RangerBlock</div><div class="subtitle">#rangers</div></div>
        </div>
        <div class="status disconnected" id="status">
            <span class="status-dot"></span><span id="statusText">Disconnected</span>
        </div>
    </div>
    <div class="users-panel" id="usersPanel"><div class="user-chip"><span>👥</span><span>0 online</span></div></div>
    <div class="messages" id="messages"><div class="message system">Welcome to RangerBlock Chat! 🐉</div></div>
    <div class="input-area">
        <div class="input-wrapper">
            <input type="text" class="message-input" id="messageInput" placeholder="Type a message..." disabled onkeypress="if(event.key==='Enter')sendMessage()">
        </div>
        <button class="send-btn" id="sendBtn" onclick="sendMessage()" disabled>➤</button>
    </div>
    <div class="footer">Created by David Keane (IrishRanger) + Claude Code | Rangers lead the way! 🎖️</div>
    <script>
        const RELAY_HOST = location.hostname;
        const RELAY_PORT = ${WS_PORT};
        let ws = null, nickname = '', nodeId = '', isConnected = false;
        const users = new Map();
        const connectModal = document.getElementById('connectModal');
        const nicknameInput = document.getElementById('nickname');
        const connectBtn = document.getElementById('connectBtn');
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const statusEl = document.getElementById('status');
        const statusText = document.getElementById('statusText');
        const usersPanel = document.getElementById('usersPanel');
        function generateId() { return 'Web-' + Math.random().toString(36).substr(2, 8); }
        function getEmoji(id) {
            const emojis = ['🌐', '📱', '💻', '🖥️', '⌨️', '🔮', '🎮', '🎯', '⚡', '🔥'];
            return emojis[id.split('').reduce((a,b) => a + b.charCodeAt(0), 0) % emojis.length];
        }
        function formatTime(ts) { return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
        function updateStatus(state) {
            statusEl.className = 'status ' + state;
            statusText.textContent = state === 'connected' ? 'Connected' : state === 'connecting' ? 'Connecting...' : 'Disconnected';
        }
        function updateUsers() {
            usersPanel.innerHTML = '<div class="user-chip"><span>👥</span><span>' + users.size + ' online</span></div>' +
                Array.from(users.values()).map(u => '<div class="user-chip"><span>' + (u.emoji||getEmoji(u.id)) + '</span><span>' + u.name + '</span></div>').join('');
        }
        function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
        function addMessage(type, content, sender = null, ts = Date.now()) {
            const msgDiv = document.createElement('div');
            if (type === 'system' || type === 'join' || type === 'leave') {
                msgDiv.className = 'message ' + type; msgDiv.textContent = content;
            } else {
                const isOwn = sender === nodeId;
                msgDiv.className = 'message ' + (isOwn ? 'own' : 'other');
                const senderName = isOwn ? 'You' : (users.get(sender)?.name || sender);
                const emoji = isOwn ? '🌐' : (users.get(sender)?.emoji || getEmoji(sender));
                msgDiv.innerHTML = '<div class="message-header"><span class="message-sender">' + emoji + ' ' + senderName + '</span><span class="message-time">' + formatTime(ts) + '</span></div><div class="message-content">' + escapeHtml(content) + '</div>';
            }
            messagesDiv.appendChild(msgDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        function connect() {
            nickname = nicknameInput.value.trim() || 'Anonymous';
            nodeId = generateId();
            connectBtn.disabled = true; connectBtn.textContent = '⏳ Connecting...';
            updateStatus('connecting');
            try {
                ws = new WebSocket('ws://' + RELAY_HOST + ':' + RELAY_PORT);
                ws.onopen = () => {
                    isConnected = true; updateStatus('connected');
                    connectModal.style.display = 'none';
                    messageInput.disabled = false; sendBtn.disabled = false;
                    messageInput.focus();
                    ws.send(JSON.stringify({ type: 'register', nodeId: nodeId, name: nickname, nodeType: 'web-client', emoji: '🌐' }));
                    addMessage('system', 'Connected as ' + nickname + ' 🎉');
                    users.set(nodeId, { id: nodeId, name: nickname, emoji: '🌐' });
                    updateUsers();
                };
                ws.onmessage = (e) => { try { handleMessage(JSON.parse(e.data)); } catch(ex) {} };
                ws.onclose = () => {
                    isConnected = false; updateStatus('disconnected');
                    messageInput.disabled = true; sendBtn.disabled = true;
                    addMessage('system', 'Disconnected from relay');
                    setTimeout(() => { if (!isConnected) { connectModal.style.display = 'flex'; connectBtn.disabled = false; connectBtn.textContent = '🔄 Reconnect'; } }, 2000);
                };
                ws.onerror = () => { addMessage('system', 'Connection error'); connectBtn.disabled = false; connectBtn.textContent = '🚀 Try Again'; };
            } catch (e) { connectBtn.disabled = false; connectBtn.textContent = '🚀 Try Again'; updateStatus('disconnected'); }
        }
        function handleMessage(data) {
            switch(data.type) {
                case 'peerJoined':
                    users.set(data.nodeId, { id: data.nodeId, name: data.name || data.nodeId, emoji: data.emoji || getEmoji(data.nodeId) });
                    updateUsers();
                    addMessage('join', (data.emoji||'🟢') + ' ' + (data.name||data.nodeId) + ' joined');
                    break;
                case 'peerLeft':
                    const leftUser = users.get(data.nodeId); users.delete(data.nodeId); updateUsers();
                    if (leftUser) addMessage('leave', (leftUser.emoji||'🔴') + ' ' + leftUser.name + ' left');
                    break;
                case 'broadcast':
                    if (data.payload && data.payload.type === 'chatMessage' && data.payload.from !== nodeId)
                        addMessage('other', data.payload.message, data.payload.from, data.payload.timestamp);
                    break;
                case 'peers':
                    if (data.peers) { data.peers.forEach(p => { if (p.nodeId !== nodeId) users.set(p.nodeId, { id: p.nodeId, name: p.name || p.nodeId, emoji: p.emoji || getEmoji(p.nodeId) }); }); updateUsers(); }
                    break;
            }
        }
        function sendMessage() {
            const text = messageInput.value.trim();
            if (!text || !isConnected) return;
            addMessage('own', text, nodeId);
            ws.send(JSON.stringify({ type: 'broadcast', payload: { type: 'chatMessage', from: nodeId, message: text, channel: '#rangers', timestamp: Date.now() } }));
            messageInput.value = ''; messageInput.focus();
        }
        setInterval(() => { if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' })); }, 30000);
        const names = ['Ranger', 'Ghost', 'Shadow', 'Phoenix', 'Storm', 'Blaze', 'Cyber', 'Neon', 'Vector', 'Quantum'];
        nicknameInput.value = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 100);
        nicknameInput.focus(); nicknameInput.select();
        nicknameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') connect(); });
    </script>
</body>
</html>`;
    res.send(chatHtml);
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

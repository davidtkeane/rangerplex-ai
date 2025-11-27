#!/usr/bin/env node
/**
 * 🎖️ RANGERBLOCK P2P NODE
 *
 * A complete peer-to-peer blockchain node with relay server support!
 *
 * Features:
 * - Full blockchain implementation (mining, transactions, validation)
 * - P2P networking (WebSocket server + client)
 * - Relay server integration (cross-network discovery)
 * - Automatic peer discovery and synchronization
 * - Works across different networks (NAT traversal via relay)
 *
 * Usage:
 *   node RangerBlockNode.cjs --name M3Pro-Genesis --port 5000
 *   node RangerBlockNode.cjs --name M1Air-Bob --port 5001
 *   node RangerBlockNode.cjs --name M4Max-Charlie --port 5002
 *
 * Deploy relay server first (see DEPLOY_RELAY.md)!
 */

const crypto = require('crypto');
const WebSocket = require('ws');
const http = require('http');
const express = require('express');

// ============================================================================
// BLOCKCHAIN CORE (from SimpleBlockchain.cjs)
// ============================================================================

class Transaction {
    constructor(from, to, amount, fee = 0) {
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.fee = fee;
        this.timestamp = Date.now();
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return crypto.createHash('sha256')
            .update(this.from + this.to + this.amount + this.fee + this.timestamp)
            .digest('hex');
    }
}

class Block {
    constructor(index, timestamp, transactions, previousHash = '', miner = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.miner = miner;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return crypto.createHash('sha256')
            .update(
                this.index +
                this.previousHash +
                this.timestamp +
                JSON.stringify(this.transactions) +
                this.nonce +
                this.miner
            )
            .digest('hex');
    }

    mineBlock(difficulty) {
        const target = Array(difficulty + 1).join('0');
        const startTime = Date.now();

        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        const miningTime = ((Date.now() - startTime) / 1000).toFixed(3);
        return miningTime;
    }
}

class Blockchain {
    constructor(nodeName) {
        this.nodeName = nodeName;
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 4;
        this.pendingTransactions = [];
        this.miningReward = 10;
        this.wallets = {};

        // Initialize Genesis wallet
        this.wallets['Genesis'] = 1000;
    }

    createGenesisBlock() {
        return new Block(0, Date.now(), [
            new Transaction('Genesis', 'Genesis', 1000, 0)
        ], '0', 'Genesis');
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addTransaction(transaction) {
        if (!this.isValidTransaction(transaction)) {
            return false;
        }
        this.pendingTransactions.push(transaction);
        return true;
    }

    isValidTransaction(transaction) {
        if (transaction.from === 'Genesis') return true;
        if (transaction.amount <= 0) return false;
        if (!this.wallets[transaction.from]) return false;

        const balance = this.getBalance(transaction.from);
        return balance >= (transaction.amount + transaction.fee);
    }

    minePendingTransactions(minerAddress) {
        // Filter valid transactions
        const validTransactions = this.pendingTransactions.filter(tx =>
            this.isValidTransaction(tx)
        );

        if (validTransactions.length === 0) {
            return null;
        }

        // Create new block
        const block = new Block(
            this.chain.length,
            Date.now(),
            validTransactions,
            this.getLatestBlock().hash,
            minerAddress
        );

        // Mine the block
        const miningTime = block.mineBlock(this.difficulty);

        // Add to chain
        this.chain.push(block);

        // Update wallets
        validTransactions.forEach(tx => {
            if (!this.wallets[tx.from]) this.wallets[tx.from] = 0;
            if (!this.wallets[tx.to]) this.wallets[tx.to] = 0;

            this.wallets[tx.from] -= (tx.amount + tx.fee);
            this.wallets[tx.to] += tx.amount;
        });

        // Mining reward + transaction fees
        if (!this.wallets[minerAddress]) this.wallets[minerAddress] = 0;
        const totalFees = validTransactions.reduce((sum, tx) => sum + tx.fee, 0);
        this.wallets[minerAddress] += this.miningReward + totalFees;

        // Clear pending transactions
        this.pendingTransactions = [];

        return { block, miningTime };
    }

    getBalance(address) {
        return this.wallets[address] || 0;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    replaceChain(newChain) {
        if (newChain.length <= this.chain.length) {
            return false;
        }

        // Validate new chain
        const tempBlockchain = new Blockchain('temp');
        tempBlockchain.chain = newChain;

        if (!tempBlockchain.isChainValid()) {
            return false;
        }

        // Replace chain
        this.chain = newChain;

        // Rebuild wallets from scratch
        this.wallets = {};
        this.wallets['Genesis'] = 1000;

        for (let i = 1; i < this.chain.length; i++) {
            const block = this.chain[i];
            block.transactions.forEach(tx => {
                if (!this.wallets[tx.from]) this.wallets[tx.from] = 0;
                if (!this.wallets[tx.to]) this.wallets[tx.to] = 0;

                this.wallets[tx.from] -= (tx.amount + tx.fee);
                this.wallets[tx.to] += tx.amount;
            });

            // Add mining rewards
            if (!this.wallets[block.miner]) this.wallets[block.miner] = 0;
            const totalFees = block.transactions.reduce((sum, tx) => sum + tx.fee, 0);
            this.wallets[block.miner] += this.miningReward + totalFees;
        }

        return true;
    }
}

// ============================================================================
// P2P NETWORKING + RELAY INTEGRATION
// ============================================================================

class RangerBlockNode {
    constructor(config) {
        this.name = config.name || 'RangerNode';
        this.port = config.port || 5000;
        this.relayUrl = config.relayUrl || null;

        // Blockchain
        this.blockchain = new Blockchain(this.name);

        // P2P networking
        this.peers = new Map(); // nodeId -> { ws, address, port, blockchainHeight }
        this.server = null;
        this.relayWs = null;
        this.nodeId = null;

        // Chat system
        this.chatMessages = [];
        this.maxChatMessages = 100;

        // Express app for HTTP API
        this.app = express();
        this.app.use(express.json());
        this.setupAPI();
    }

    // ========================================================================
    // RELAY SERVER INTEGRATION
    // ========================================================================

    async connectToRelay() {
        if (!this.relayUrl) {
            console.log('⚠️  No relay server configured (local network only)');
            return;
        }

        return new Promise((resolve, reject) => {
            console.log(`\n🔌 Connecting to relay: ${this.relayUrl}`);

            this.relayWs = new WebSocket(this.relayUrl);

            this.relayWs.on('open', () => {
                console.log('✅ Connected to relay server');
                resolve();
            });

            this.relayWs.on('message', (data) => {
                this.handleRelayMessage(JSON.parse(data.toString()));
            });

            this.relayWs.on('close', () => {
                console.log('❌ Relay connection closed');
                // Attempt reconnection after 10 seconds
                setTimeout(() => this.connectToRelay(), 10000);
            });

            this.relayWs.on('error', (err) => {
                console.error('❌ Relay connection error:', err.message);
                reject(err);
            });

            // Timeout after 5 seconds
            setTimeout(() => reject(new Error('Relay connection timeout')), 5000);
        });
    }

    async registerWithRelay() {
        if (!this.relayWs || this.relayWs.readyState !== WebSocket.OPEN) {
            return;
        }

        const message = {
            type: 'register',
            address: this.name,
            port: this.port,
            blockchainHeight: this.blockchain.chain.length
        };

        this.relayWs.send(JSON.stringify(message));
        console.log(`📝 Registered with relay: ${this.name} (port ${this.port})`);
    }

    async getPeersFromRelay() {
        if (!this.relayWs || this.relayWs.readyState !== WebSocket.OPEN) {
            return [];
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve([]), 5000);

            const handler = (data) => {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'peerList' || msg.type === 'peerListUpdate') {
                    clearTimeout(timeout);
                    this.relayWs.removeListener('message', handler);
                    resolve(msg.peers || []);
                }
            };

            this.relayWs.on('message', handler);
            this.relayWs.send(JSON.stringify({ type: 'getPeers' }));
        });
    }

    handleRelayMessage(msg) {
        switch (msg.type) {
            case 'welcome':
                this.nodeId = msg.nodeId;
                console.log(`✅ Assigned node ID: ${this.nodeId}`);
                break;

            case 'registered':
                console.log(`✅ Registration confirmed`);
                break;

            case 'peerList':
            case 'peerListUpdate':
                console.log(`📋 Received ${msg.count} peers from relay`);
                this.connectToPeers(msg.peers);
                break;

            case 'pong':
                // Heartbeat response
                break;

            case 'serverShutdown':
                console.log('⚠️  Relay server shutting down');
                break;

            default:
                console.log(`⚠️  Unknown relay message: ${msg.type}`);
        }
    }

    startHeartbeat() {
        setInterval(() => {
            // Relay heartbeat
            if (this.relayWs && this.relayWs.readyState === WebSocket.OPEN) {
                this.relayWs.send(JSON.stringify({
                    type: 'ping',
                    blockchainHeight: this.blockchain.chain.length
                }));
            }

            // Update relay with current blockchain height
            if (this.relayWs && this.relayWs.readyState === WebSocket.OPEN) {
                this.relayWs.send(JSON.stringify({
                    type: 'updateStatus',
                    blockchainHeight: this.blockchain.chain.length
                }));
            }
        }, 60000); // Every 60 seconds
    }

    // ========================================================================
    // P2P NETWORKING
    // ========================================================================

    startP2PServer() {
        const httpServer = http.createServer(this.app);
        this.server = new WebSocket.Server({ server: httpServer });

        this.server.on('connection', (ws, req) => {
            const peerIP = req.socket.remoteAddress;
            console.log(`\n📥 Incoming connection from ${peerIP}`);

            ws.on('message', (data) => {
                this.handlePeerMessage(ws, JSON.parse(data.toString()));
            });

            ws.on('close', () => {
                // Remove peer from our list
                for (const [peerId, peer] of this.peers.entries()) {
                    if (peer.ws === ws) {
                        console.log(`❌ Peer disconnected: ${peer.address}`);
                        this.peers.delete(peerId);
                        break;
                    }
                }
            });

            ws.on('error', (err) => {
                console.error('❌ Peer connection error:', err.message);
            });

            // Send welcome
            ws.send(JSON.stringify({
                type: 'hello',
                from: this.name,
                blockchainHeight: this.blockchain.chain.length
            }));
        });

        httpServer.listen(this.port, () => {
            console.log(`✅ P2P server listening on port ${this.port}`);
            console.log(`📊 HTTP API: http://localhost:${this.port}`);
        });
    }

    async connectToPeers(peerList) {
        for (const peer of peerList) {
            // Don't connect to ourselves
            if (peer.address === this.name) continue;

            // Already connected?
            const existingPeer = Array.from(this.peers.values())
                .find(p => p.address === peer.address);

            if (existingPeer) continue;

            // Attempt connection
            await this.connectToPeer(peer);
        }
    }

    async connectToPeer(peer) {
        return new Promise((resolve) => {
            console.log(`\n🔗 Connecting to ${peer.address} (${peer.ip}:${peer.port})...`);

            const ws = new WebSocket(`ws://${peer.ip}:${peer.port}`);

            const timeout = setTimeout(() => {
                console.log(`⏱️  Connection timeout: ${peer.address}`);
                ws.terminate();
                resolve(false);
            }, 5000);

            ws.on('open', () => {
                clearTimeout(timeout);
                console.log(`✅ Connected to ${peer.address}`);

                this.peers.set(peer.nodeId, {
                    ws: ws,
                    address: peer.address,
                    ip: peer.ip,
                    port: peer.port,
                    blockchainHeight: peer.blockchainHeight
                });

                // Send hello
                ws.send(JSON.stringify({
                    type: 'hello',
                    from: this.name,
                    blockchainHeight: this.blockchain.chain.length
                }));

                resolve(true);
            });

            ws.on('message', (data) => {
                this.handlePeerMessage(ws, JSON.parse(data.toString()));
            });

            ws.on('close', () => {
                console.log(`❌ Connection closed: ${peer.address}`);
                for (const [peerId, p] of this.peers.entries()) {
                    if (p.ws === ws) {
                        this.peers.delete(peerId);
                        break;
                    }
                }
            });

            ws.on('error', (err) => {
                clearTimeout(timeout);
                console.error(`❌ Connection error ${peer.address}:`, err.message);
                resolve(false);
            });
        });
    }

    handlePeerMessage(ws, msg) {
        switch (msg.type) {
            case 'hello':
                console.log(`👋 Hello from ${msg.from} (height: ${msg.blockchainHeight})`);

                // If they have a longer chain, request it
                if (msg.blockchainHeight > this.blockchain.chain.length) {
                    ws.send(JSON.stringify({ type: 'getChain' }));
                }
                break;

            case 'getChain':
                // Send our blockchain
                ws.send(JSON.stringify({
                    type: 'chain',
                    chain: this.blockchain.chain
                }));
                break;

            case 'chain':
                // Received blockchain from peer
                console.log(`📦 Received chain with ${msg.chain.length} blocks`);

                if (this.blockchain.replaceChain(msg.chain)) {
                    console.log(`✅ Updated blockchain (now ${this.blockchain.chain.length} blocks)`);
                } else {
                    console.log(`❌ Rejected chain (ours is valid and longer)`);
                }
                break;

            case 'newBlock':
                // Peer mined a new block
                console.log(`📦 New block received from ${msg.from}`);

                // Validate and add if valid
                const newBlock = Object.assign(new Block(), msg.block);
                if (this.validateNewBlock(newBlock)) {
                    this.blockchain.chain.push(newBlock);
                    console.log(`✅ Added block #${newBlock.index}`);

                    // Broadcast to other peers
                    this.broadcastBlock(newBlock, ws);
                }
                break;

            case 'newTransaction':
                // Peer added a transaction
                const tx = Object.assign(new Transaction(), msg.transaction);
                if (this.blockchain.addTransaction(tx)) {
                    console.log(`📝 New transaction: ${tx.from} → ${tx.to} (${tx.amount} RGR)`);

                    // Broadcast to other peers
                    this.broadcastTransaction(tx, ws);
                }
                break;

            case 'chat':
                // Received chat message from peer
                const chatMsg = {
                    id: msg.id || Date.now() + Math.random(),
                    from: msg.from,
                    message: msg.message,
                    timestamp: msg.timestamp || Date.now()
                };

                // Add to chat history
                this.chatMessages.push(chatMsg);
                if (this.chatMessages.length > this.maxChatMessages) {
                    this.chatMessages.shift(); // Remove oldest
                }

                console.log(`💬 Chat from ${msg.from}: ${msg.message}`);

                // Broadcast to other peers (flood routing)
                this.broadcastChat(chatMsg, ws);
                break;

            default:
                console.log(`⚠️  Unknown message type: ${msg.type}`);
        }
    }

    validateNewBlock(block) {
        const latestBlock = this.blockchain.getLatestBlock();

        // Check index
        if (block.index !== latestBlock.index + 1) {
            return false;
        }

        // Check previous hash
        if (block.previousHash !== latestBlock.hash) {
            return false;
        }

        // Check hash
        if (block.hash !== block.calculateHash()) {
            return false;
        }

        // Check proof of work
        const target = Array(this.blockchain.difficulty + 1).join('0');
        if (block.hash.substring(0, this.blockchain.difficulty) !== target) {
            return false;
        }

        return true;
    }

    broadcastBlock(block, excludeWs = null) {
        const message = JSON.stringify({
            type: 'newBlock',
            from: this.name,
            block: block
        });

        for (const peer of this.peers.values()) {
            if (peer.ws !== excludeWs && peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(message);
            }
        }
    }

    broadcastTransaction(transaction, excludeWs = null) {
        const message = JSON.stringify({
            type: 'newTransaction',
            from: this.name,
            transaction: transaction
        });

        for (const peer of this.peers.values()) {
            if (peer.ws !== excludeWs && peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(message);
            }
        }
    }

    broadcastChat(chatMessage, excludeWs = null) {
        const message = JSON.stringify({
            type: 'chat',
            id: chatMessage.id,
            from: chatMessage.from,
            message: chatMessage.message,
            timestamp: chatMessage.timestamp
        });

        for (const peer of this.peers.values()) {
            if (peer.ws !== excludeWs && peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(message);
            }
        }
    }

    sendChatMessage(messageText) {
        const chatMsg = {
            id: Date.now() + Math.random(),
            from: this.name,
            message: messageText,
            timestamp: Date.now()
        };

        // Add to own chat history
        this.chatMessages.push(chatMsg);
        if (this.chatMessages.length > this.maxChatMessages) {
            this.chatMessages.shift();
        }

        // Broadcast to all peers
        this.broadcastChat(chatMsg);

        return chatMsg;
    }

    // ========================================================================
    // HTTP API
    // ========================================================================

    setupAPI() {
        // Get blockchain
        this.app.get('/api/blockchain', (req, res) => {
            res.json({
                success: true,
                node: this.name,
                chain: this.blockchain.chain,
                height: this.blockchain.chain.length,
                isValid: this.blockchain.isChainValid()
            });
        });

        // Get balance
        this.app.get('/api/balance/:address', (req, res) => {
            const balance = this.blockchain.getBalance(req.params.address);
            res.json({
                success: true,
                address: req.params.address,
                balance: balance
            });
        });

        // Add transaction
        this.app.post('/api/transaction', (req, res) => {
            const { from, to, amount, fee } = req.body;

            const tx = new Transaction(from, to, amount, fee || 0);

            if (this.blockchain.addTransaction(tx)) {
                this.broadcastTransaction(tx);

                res.json({
                    success: true,
                    transaction: tx,
                    message: 'Transaction added to pending pool'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Invalid transaction (insufficient balance or invalid amount)'
                });
            }
        });

        // Mine block
        this.app.post('/api/mine', (req, res) => {
            const { miner } = req.body;
            const minerAddress = miner || this.name;

            if (this.blockchain.pendingTransactions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No pending transactions to mine'
                });
            }

            const result = this.blockchain.minePendingTransactions(minerAddress);

            if (result) {
                // Broadcast new block
                this.broadcastBlock(result.block);

                res.json({
                    success: true,
                    block: result.block,
                    miningTime: result.miningTime,
                    reward: this.blockchain.miningReward,
                    message: `Block mined in ${result.miningTime}s`
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Mining failed'
                });
            }
        });

        // Get peers
        this.app.get('/api/peers', (req, res) => {
            const peerList = Array.from(this.peers.values()).map(p => ({
                address: p.address,
                ip: p.ip,
                port: p.port,
                blockchainHeight: p.blockchainHeight
            }));

            res.json({
                success: true,
                count: peerList.length,
                peers: peerList
            });
        });

        // Node info
        this.app.get('/api/info', (req, res) => {
            res.json({
                success: true,
                node: {
                    name: this.name,
                    nodeId: this.nodeId,
                    port: this.port,
                    relayConnected: this.relayWs ? this.relayWs.readyState === WebSocket.OPEN : false
                },
                blockchain: {
                    height: this.blockchain.chain.length,
                    difficulty: this.blockchain.difficulty,
                    pendingTransactions: this.blockchain.pendingTransactions.length,
                    isValid: this.blockchain.isChainValid()
                },
                peers: {
                    count: this.peers.size,
                    connected: Array.from(this.peers.values()).map(p => p.address)
                },
                chat: {
                    messageCount: this.chatMessages.length
                }
            });
        });

        // Get chat messages
        this.app.get('/api/chat', (req, res) => {
            res.json({
                success: true,
                messages: this.chatMessages,
                count: this.chatMessages.length,
                peerCount: this.peers.size
            });
        });

        // Send chat message
        this.app.post('/api/chat', (req, res) => {
            const { message } = req.body;

            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Message is required'
                });
            }

            const chatMsg = this.sendChatMessage(message.trim());

            res.json({
                success: true,
                message: 'Message sent',
                chatMessage: chatMsg,
                broadcastTo: this.peers.size
            });
        });

        // Dashboard (HTML)
        this.app.get('/', (req, res) => {
            const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${this.name} - RangerBlock Node</title>
    <style>
        body {
            font-family: 'Monaco', 'Courier New', monospace;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: #00ff00;
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 30px;
        }
        h1 { color: #00ff00; text-shadow: 0 0 10px #00ff00; }
        .stat { margin: 10px 0; color: #00dddd; }
        .value { color: #00ff00; font-weight: bold; }
    </style>
    <meta http-equiv="refresh" content="5">
</head>
<body>
    <div class="container">
        <h1>🎖️ ${this.name}</h1>
        <div class="stat">Node ID: <span class="value">${this.nodeId || 'Not connected to relay'}</span></div>
        <div class="stat">Port: <span class="value">${this.port}</span></div>
        <div class="stat">Blockchain Height: <span class="value">${this.blockchain.chain.length}</span></div>
        <div class="stat">Pending Transactions: <span class="value">${this.blockchain.pendingTransactions.length}</span></div>
        <div class="stat">Connected Peers: <span class="value">${this.peers.size}</span></div>
        <div class="stat">Relay Connected: <span class="value">${this.relayWs ? this.relayWs.readyState === WebSocket.OPEN : false}</span></div>
        <div class="stat">Chain Valid: <span class="value">${this.blockchain.isChainValid()}</span></div>
        <hr style="border-color: #00ff00;">
        <div style="color: #00dddd; margin-top: 20px;">
            📊 <a href="/api/info" style="color: #00ff00;">API Info</a> |
            ⛓️ <a href="/api/blockchain" style="color: #00ff00;">View Blockchain</a> |
            👥 <a href="/api/peers" style="color: #00ff00;">View Peers</a>
        </div>
        <div style="margin-top: 20px; color: #00dddd; font-size: 0.9em;">
            Rangers lead the way! 🎖️
        </div>
    </div>
</body>
</html>`;
            res.send(html);
        });
    }

    // ========================================================================
    // STARTUP SEQUENCE
    // ========================================================================

    async start() {
        console.log('\n🎖️ '.repeat(20));
        console.log('   RANGERBLOCK P2P NODE');
        console.log('🎖️ '.repeat(20));
        console.log(`\n🚀 Starting ${this.name}...`);

        try {
            // 1. Start P2P server
            this.startP2PServer();

            // 2. Connect to relay (if configured)
            if (this.relayUrl) {
                await this.connectToRelay();
                await this.registerWithRelay();

                // 3. Get peers from relay
                const peers = await this.getPeersFromRelay();
                console.log(`📋 Received ${peers.length} peers from relay`);

                // 4. Connect to peers
                await this.connectToPeers(peers);

                // 5. Start heartbeat
                this.startHeartbeat();
            } else {
                console.log('⚠️  No relay server configured (local network mode)');
            }

            console.log('\n✅ RangerBlock node ready!');
            console.log(`📊 Dashboard: http://localhost:${this.port}`);
            console.log(`🔌 P2P Port: ${this.port}`);
            console.log(`⛓️  Blockchain Height: ${this.blockchain.chain.length}`);
            console.log(`👥 Connected Peers: ${this.peers.size}`);
            console.log('\n🎖️ Rangers lead the way!\n');

        } catch (err) {
            console.error('❌ Startup failed:', err.message);
            process.exit(1);
        }
    }
}

// ============================================================================
// COMMAND LINE INTERFACE
// ============================================================================

function parseArgs() {
    const args = process.argv.slice(2);
    const config = {
        name: 'RangerNode',
        port: 5000,
        relayUrl: null
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--name':
            case '-n':
                config.name = args[++i];
                break;
            case '--port':
            case '-p':
                config.port = parseInt(args[++i]);
                break;
            case '--relay':
            case '-r':
                config.relayUrl = args[++i];
                break;
            case '--help':
            case '-h':
                console.log(`
🎖️ RANGERBLOCK P2P NODE

Usage:
  node RangerBlockNode.cjs [options]

Options:
  -n, --name <name>       Node name (default: RangerNode)
  -p, --port <port>       P2P port (default: 5000)
  -r, --relay <url>       Relay server URL (e.g., ws://167.99.234.12:8080)
  -h, --help              Show this help

Examples:
  # Genesis node (local network only)
  node RangerBlockNode.cjs --name M3Pro-Genesis --port 5000

  # With relay server (cross-network)
  node RangerBlockNode.cjs --name M1Air-Bob --port 5001 --relay ws://167.99.234.12:8080

  # M4Max on iPhone hotspot
  node RangerBlockNode.cjs --name M4Max-Charlie --port 5002 --relay ws://YOUR_RELAY_IP:8080

Rangers lead the way! 🎖️
                `);
                process.exit(0);
                break;
        }
    }

    return config;
}

// ============================================================================
// MAIN
// ============================================================================

if (require.main === module) {
    const config = parseArgs();
    const node = new RangerBlockNode(config);
    node.start();

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Shutting down node...');

        if (node.relayWs) {
            node.relayWs.close();
        }

        for (const peer of node.peers.values()) {
            peer.ws.close();
        }

        if (node.server) {
            node.server.close();
        }

        console.log('✅ Node shut down gracefully');
        console.log('🎖️ Rangers lead the way!\n');
        process.exit(0);
    });
}

module.exports = { RangerBlockNode, Blockchain, Block, Transaction };

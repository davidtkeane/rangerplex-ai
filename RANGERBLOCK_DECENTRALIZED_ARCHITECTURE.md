# 🎖️ RangerPlex Decentralized Network Architecture

**Vision:** Each RangerPlex = A Node in the Network  
**No Central Hub - Pure Peer-to-Peer!**

---

## 🌐 **DECENTRALIZED ARCHITECTURE**

### **Traditional (Centralized):**
```
        ┌─────────────┐
        │ Central Hub │
        │   (M3 Pro)  │
        └─────────────┘
         ↙     ↓     ↘
    ┌────┐  ┌────┐  ┌────┐
    │ M1 │  │ M3 │  │ M4 │
    └────┘  └────┘  └────┘
```
**Problem:** Single point of failure!

---

### **RangerPlex (Decentralized):** ✅
```
    ┌────────────────────────────────┐
    │  M1 Air RangerPlex (Node 1)    │
    │  - Runs blockchain locally     │
    │  - Syncs with peers            │
    │  - Sends/receives files        │
    └────────────────────────────────┘
         ↕              ↕
    ┌────────┐    ┌────────┐
    │ M3 Mac │←──→│ M4 Max │
    │ Node 2 │    │ Node 3 │
    └────────┘    └────────┘
```
**Benefits:**
- ✅ No single point of failure
- ✅ Each node is independent
- ✅ Network survives if one node goes down
- ✅ True blockchain architecture

---

## 🎯 **HOW IT WORKS**

### **Each RangerPlex Instance:**

1. **Has its own blockchain copy**
   - `rangerblock/genesis_blockchain.json`
   - Syncs with other nodes
   - Updates when new nodes join

2. **Discovers other nodes**
   - Broadcasts presence on local network
   - Finds M1/M3/M4 automatically
   - Maintains peer list

3. **Syncs blockchain data**
   - Receives new blocks from peers
   - Validates transactions
   - Updates local copy

4. **Sends/receives files**
   - Direct peer-to-peer transfer
   - No central server needed
   - Encrypted communication

---

## 🔧 **IMPLEMENTATION**

### **Phase 1: Local Blockchain** ✅ (Already done!)

Each RangerPlex has:
```typescript
// services/rangerBlockAccountService.ts
class RangerBlockAccountService {
  private blockchainPath = './rangerblock/genesis_blockchain.json';
  
  // Read local blockchain
  loadBlockchain() { ... }
  
  // Find accounts
  findAccountBySerial() { ... }
  
  // Create accounts
  createAccount() { ... }
}
```

---

### **Phase 2: Peer Discovery** (NEW!)

**File:** `services/rangerBlockPeerDiscovery.ts`

```typescript
import dgram from 'dgram';
import { EventEmitter } from 'events';

interface Peer {
  nodeId: string;
  nodeName: string;
  ipAddress: string;
  port: number;
  lastSeen: Date;
  status: 'online' | 'offline';
}

class RangerBlockPeerDiscovery extends EventEmitter {
  private peers: Map<string, Peer> = new Map();
  private socket: dgram.Socket;
  private discoveryPort = 9998;
  private broadcastInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.socket = dgram.createSocket('udp4');
  }

  /**
   * Start broadcasting presence to network
   */
  startBroadcast(nodeInfo: { nodeId: string; nodeName: string; port: number }) {
    // Broadcast every 5 seconds
    this.broadcastInterval = setInterval(() => {
      const message = JSON.stringify({
        type: 'PEER_ANNOUNCE',
        nodeId: nodeInfo.nodeId,
        nodeName: nodeInfo.nodeName,
        port: nodeInfo.port,
        timestamp: Date.now()
      });

      // Broadcast to local network
      this.socket.send(message, this.discoveryPort, '255.255.255.255');
    }, 5000);

    // Listen for other peers
    this.socket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        
        if (data.type === 'PEER_ANNOUNCE' && data.nodeId !== nodeInfo.nodeId) {
          // Found a peer!
          this.addPeer({
            nodeId: data.nodeId,
            nodeName: data.nodeName,
            ipAddress: rinfo.address,
            port: data.port,
            lastSeen: new Date(),
            status: 'online'
          });
        }
      } catch (error) {
        // Ignore invalid messages
      }
    });

    this.socket.bind(this.discoveryPort);
  }

  /**
   * Add or update peer
   */
  private addPeer(peer: Peer) {
    const existing = this.peers.get(peer.nodeId);
    
    if (!existing) {
      console.log(`🌐 New peer discovered: ${peer.nodeName} (${peer.ipAddress})`);
      this.emit('peer-discovered', peer);
    }

    this.peers.set(peer.nodeId, peer);
  }

  /**
   * Get all active peers
   */
  getPeers(): Peer[] {
    const now = Date.now();
    const timeout = 15000; // 15 seconds

    // Mark peers as offline if not seen recently
    this.peers.forEach(peer => {
      const timeSinceLastSeen = now - peer.lastSeen.getTime();
      peer.status = timeSinceLastSeen < timeout ? 'online' : 'offline';
    });

    return Array.from(this.peers.values());
  }

  /**
   * Stop broadcasting
   */
  stop() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
    }
    this.socket.close();
  }
}

export const peerDiscovery = new RangerBlockPeerDiscovery();
```

---

### **Phase 3: Blockchain Sync** (NEW!)

**File:** `services/rangerBlockSync.ts`

```typescript
import { rangerBlockAccount } from './rangerBlockAccountService';
import { peerDiscovery } from './rangerBlockPeerDiscovery';
import fetch from 'node-fetch';

class RangerBlockSync {
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Start syncing with peers
   */
  startSync() {
    // Sync every 30 seconds
    this.syncInterval = setInterval(() => {
      this.syncWithPeers();
    }, 30000);

    // Initial sync
    this.syncWithPeers();
  }

  /**
   * Sync blockchain with all peers
   */
  private async syncWithPeers() {
    const peers = peerDiscovery.getPeers().filter(p => p.status === 'online');
    
    if (peers.length === 0) {
      console.log('📡 No peers online - running standalone');
      return;
    }

    console.log(`🔄 Syncing with ${peers.length} peer(s)...`);

    for (const peer of peers) {
      try {
        // Request blockchain from peer
        const response = await fetch(`http://${peer.ipAddress}:${peer.port}/api/rangerblock/blockchain`);
        const peerBlockchain = await response.json();

        // Merge with local blockchain
        this.mergeBlockchain(peerBlockchain);
      } catch (error) {
        console.error(`Failed to sync with ${peer.nodeName}:`, error.message);
      }
    }
  }

  /**
   * Merge peer blockchain with local copy
   */
  private mergeBlockchain(peerBlockchain: any) {
    const localBlockchain = rangerBlockAccount.loadBlockchain();
    
    if (!localBlockchain) return;

    // Find new blocks
    const localBlockNumbers = new Set(localBlockchain.chain.map(b => b.block_number));
    const newBlocks = peerBlockchain.chain.filter(b => !localBlockNumbers.has(b.block_number));

    if (newBlocks.length > 0) {
      console.log(`✅ Received ${newBlocks.length} new block(s) from peer`);
      
      // Add new blocks to local chain
      localBlockchain.chain.push(...newBlocks);
      localBlockchain.node_count = peerBlockchain.node_count;
      localBlockchain.last_updated = new Date().toISOString();

      // Save updated blockchain
      rangerBlockAccount.saveBlockchain(localBlockchain);
    }
  }

  /**
   * Stop syncing
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

export const blockchainSync = new RangerBlockSync();
```

---

### **Phase 4: P2P File Transfer** (NEW!)

**File:** `services/rangerBlockFileTransfer.ts`

```typescript
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { peerDiscovery } from './rangerBlockPeerDiscovery';

class RangerBlockFileTransfer {
  /**
   * Send file to peer
   */
  async sendFile(recipientNodeId: string, filePath: string): Promise<boolean> {
    const peers = peerDiscovery.getPeers();
    const recipient = peers.find(p => p.nodeId === recipientNodeId);

    if (!recipient || recipient.status === 'offline') {
      throw new Error('Recipient not found or offline');
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    // Create form data
    const formData = new FormData();
    formData.append('file', fileBuffer, fileName);

    // Send to peer
    const response = await fetch(`http://${recipient.ipAddress}:${recipient.port}/api/rangerblock/receive`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('File transfer failed');
    }

    console.log(`✅ File sent to ${recipient.nodeName}: ${fileName}`);
    return true;
  }

  /**
   * Receive file from peer
   */
  receiveFile(fileBuffer: Buffer, fileName: string): string {
    const receivePath = path.join(__dirname, '../rangerblock/received_files', fileName);
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(receivePath), { recursive: true });
    
    // Save file
    fs.writeFileSync(receivePath, fileBuffer);
    
    console.log(`✅ File received: ${fileName}`);
    return receivePath;
  }
}

export const fileTransfer = new RangerBlockFileTransfer();
```

---

## 🚀 **STARTUP SEQUENCE**

### **When RangerPlex Starts:**

```typescript
// proxy_server.js

import { rangerBlockAccount } from './services/rangerBlockAccountService';
import { peerDiscovery } from './services/rangerBlockPeerDiscovery';
import { blockchainSync } from './services/rangerBlockSync';

// 1. Load local blockchain
const account = rangerBlockAccount.getCurrentAccount();

if (account.found) {
  console.log(`✅ Node: ${account.account.nodeName}`);
  
  // 2. Start peer discovery
  peerDiscovery.startBroadcast({
    nodeId: account.account.nodeId,
    nodeName: account.account.nodeName,
    port: 3010
  });
  
  // 3. Start blockchain sync
  blockchainSync.startSync();
  
  console.log('🌐 RangerPlex node active - discovering peers...');
} else {
  console.log('⚠️ No account found - running in standalone mode');
}
```

---

## 📊 **NETWORK TOPOLOGY**

### **Scenario: 3 Macs Running RangerPlex**

```
┌──────────────────────────────────────────────────────┐
│ M1 Air (192.168.1.26)                                │
│ RangerPlex Node 1                                    │
│ - Blockchain: 3 blocks                               │
│ - Peers: M3 Mac, M4 Max                              │
│ - Status: Online                                     │
└──────────────────────────────────────────────────────┘
         ↕ UDP Broadcast (peer discovery)
         ↕ HTTP Sync (blockchain)
         ↕ HTTP Transfer (files)
┌──────────────────────────────────────────────────────┐
│ M3 Mac (192.168.1.7)                                 │
│ RangerPlex Node 2 (Genesis)                          │
│ - Blockchain: 3 blocks                               │
│ - Peers: M1 Air, M4 Max                              │
│ - Status: Online                                     │
└──────────────────────────────────────────────────────┘
         ↕ UDP Broadcast
         ↕ HTTP Sync
         ↕ HTTP Transfer
┌──────────────────────────────────────────────────────┐
│ M4 Max (192.168.1.x)                                 │
│ RangerPlex Node 3                                    │
│ - Blockchain: 3 blocks (synced)                      │
│ - Peers: M1 Air, M3 Mac                              │
│ - Status: Online                                     │
└──────────────────────────────────────────────────────┘
```

**Each node:**
- ✅ Runs independently
- ✅ Discovers peers automatically
- ✅ Syncs blockchain
- ✅ Sends/receives files
- ✅ Survives if others go offline

---

## 🎯 **IMPLEMENTATION PHASES**

### **Phase 1: Local Node** ✅ DONE
- [x] Read local blockchain
- [x] Detect hardware
- [x] Find/create accounts

### **Phase 2: Peer Discovery** 🔄 NEXT (2-3 hours)
- [ ] UDP broadcast system
- [ ] Peer list management
- [ ] Online/offline detection

### **Phase 3: Blockchain Sync** 🔄 (2-3 hours)
- [ ] Request blockchain from peers
- [ ] Merge new blocks
- [ ] Validate transactions

### **Phase 4: File Transfer** 🔄 (2-3 hours)
- [ ] Send files to peers
- [ ] Receive files from peers
- [ ] Progress tracking

### **Phase 5: UI Integration** 🔄 (3-4 hours)
- [ ] Network status widget
- [ ] Peer list display
- [ ] File send/receive UI

---

## 📋 **TOTAL EFFORT**

**12-16 hours** for complete decentralized network

**Quick Start:** 2-3 hours for peer discovery

---

## 🎖️ **COMMANDER'S VISION**

**This is TRUE blockchain architecture:**
- ✅ No central hub
- ✅ Each RangerPlex = independent node
- ✅ Peer-to-peer communication
- ✅ Distributed blockchain
- ✅ Network resilience

**Just like Bitcoin, Ethereum, etc!**

---

**Rangers lead the way!** 🎖️

*Decentralized. Distributed. Unstoppable.*

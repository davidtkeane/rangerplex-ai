# 🌐 RangerBlock Networking Architecture

**Complete technical documentation for P2P blockchain networking**

## 📋 Table of Contents

1. [Overview](#overview)
2. [Network Modes](#network-modes)
3. [Peer Discovery](#peer-discovery)
4. [WebSocket Communication](#websocket-communication)
5. [NAT Traversal](#nat-traversal)
6. [Relay Server Architecture](#relay-server-architecture)
7. [Security Model](#security-model)
8. [Message Protocol](#message-protocol)
9. [Network Topology](#network-topology)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

RangerBlock uses a **hybrid P2P networking model** combining:
- **Local Discovery** - UDP broadcast for same-network peers
- **Global Discovery** - Relay server for cross-network peers
- **Direct Connections** - WebSocket peer-to-peer communication

### Key Features
- ✅ Automatic peer discovery (no manual configuration)
- ✅ NAT traversal via relay server
- ✅ Three network modes (Local/Hybrid/Global)
- ✅ Hardware-based node identification (Mac UUID)
- ✅ Self-healing network (auto-reconnect)
- ✅ Low bandwidth (discovery only, not routing)

---

## 🔀 Network Modes

### 1. Local Only Mode 🏠

**Use Case:** Private networks, same WiFi/LAN

**How it works:**
- Node broadcasts UDP discovery messages on LAN (port 5005)
- Other nodes on same network respond
- Establishes direct WebSocket connections
- NO relay server needed

**Advantages:**
- Zero external dependencies
- Maximum privacy (no internet exposure)
- Lowest latency
- Works offline

**Limitations:**
- Only finds nodes on same WiFi/LAN
- Doesn't work across VPNs/different networks
- NAT can block connections

**Command:**
```bash
node RangerBlockNode.cjs --name MyNode --port 5000
```

**Architecture:**
```
[Node A] ←→ UDP Broadcast ←→ [Node B]
   ↓                             ↓
   └─────── WebSocket ──────────┘
   (192.168.1.100:5000 ←→ 192.168.1.101:5000)
```

---

### 2. Hybrid Mode (Local + Global) 🌍

**Use Case:** Best of both worlds - find local AND remote nodes

**How it works:**
- Broadcasts UDP on LAN (finds local nodes)
- Connects to relay server (finds global nodes)
- Direct WebSocket to all discovered peers

**Advantages:**
- Finds local nodes instantly (UDP)
- Finds remote nodes reliably (relay)
- Optimal performance (local nodes prioritized)

**Limitations:**
- Requires relay server
- Slightly higher bandwidth (dual discovery)

**Command:**
```bash
node RangerBlockNode.cjs --name MyNode --port 5000 --relay wss://relay.rangerblock.io
```

**Architecture:**
```
Local Network:
[Node A] ←→ UDP ←→ [Node B]
   ↓                   ↓
   └──── WebSocket ───┘

Cross-Network:
[Node A] → Relay Server ← [Node C]
           (discovers)
[Node A] ←── WebSocket ──→ [Node C]
           (direct connection)
```

---

### 3. Global Only Mode 🌐

**Use Case:** Cross-network only, no local discovery

**How it works:**
- NO UDP broadcast
- Only connects to relay server
- Discovers ONLY nodes registered with relay
- Direct WebSocket to discovered peers

**Advantages:**
- Finds nodes anywhere in the world
- Works behind strict NAT/firewalls
- Controlled network (relay gatekeeping)

**Limitations:**
- Requires relay server
- Won't find local nodes
- Slightly higher latency

**Command:**
```bash
node RangerBlockNode.cjs --name MyNode --port 5000 --relay wss://relay.rangerblock.io --global-only
```

**Architecture:**
```
[Node A] ──→ Relay Server ←── [Node B]
  ↓         (registration)        ↓
  └────────── WebSocket ─────────┘
  (direct P2P, relay not involved in data)
```

---

## 🔍 Peer Discovery

### Local Discovery (UDP Broadcast)

**Protocol:** UDP Multicast
**Port:** 5005 (broadcast)
**Interval:** Every 5 seconds

**Discovery Message:**
```json
{
  "type": "discovery",
  "nodeId": "A794987C-E1B2-5677-A97C-A1AAB8BFFF85",
  "nodeName": "M3-Ranger's MacBook Pro",
  "address": "192.168.1.100",
  "port": 5000,
  "timestamp": 1732723200000
}
```

**Process:**
1. Node creates UDP socket
2. Binds to port 5005
3. Broadcasts discovery message to `255.255.255.255:5005`
4. Listens for responses from other nodes
5. When response received, establishes WebSocket connection

**Code Flow:**
```javascript
// Create UDP socket
this.discoverySocket = dgram.createSocket('udp4');

// Bind and enable broadcast
this.discoverySocket.bind(DISCOVERY_PORT, () => {
    this.discoverySocket.setBroadcast(true);
});

// Broadcast every 5 seconds
setInterval(() => {
    const message = Buffer.from(JSON.stringify({
        type: 'discovery',
        nodeId: this.nodeId,
        nodeName: this.nodeName,
        address: this.getLocalIP(),
        port: this.port,
        timestamp: Date.now()
    }));

    this.discoverySocket.send(message, 0, message.length, DISCOVERY_PORT, '255.255.255.255');
}, 5000);

// Listen for responses
this.discoverySocket.on('message', (msg, rinfo) => {
    const data = JSON.parse(msg.toString());
    if (data.nodeId !== this.nodeId) { // Don't connect to self
        this.connectToPeer(`ws://${data.address}:${data.port}`);
    }
});
```

**IP Detection:**
```javascript
getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address; // e.g., "192.168.1.100"
            }
        }
    }
    return '127.0.0.1';
}
```

---

### Global Discovery (Relay Server)

**Protocol:** WebSocket
**Port:** 3001 (relay server)
**Interval:** Heartbeat every 30 seconds

**Registration Message:**
```json
{
  "type": "register",
  "nodeId": "A794987C-E1B2-5677-A97C-A1AAB8BFFF85",
  "address": "ws://192.168.1.100:5000"
}
```

**Node List Response:**
```json
{
  "type": "node_list",
  "nodes": [
    {
      "nodeId": "B89234FC-1234-5678-ABCD-1234567890AB",
      "address": "ws://10.0.0.50:5000"
    },
    {
      "nodeId": "C12345DE-5678-9ABC-DEF0-1234567890CD",
      "address": "ws://172.16.0.75:5000"
    }
  ]
}
```

**Process:**
1. Node connects to relay WebSocket
2. Sends registration with node ID and address
3. Relay adds node to registry
4. Relay broadcasts updated node list to ALL nodes
5. Each node connects directly to newly discovered peers

**Code Flow:**
```javascript
connectToRelay(relayUrl) {
    this.relayWs = new WebSocket(relayUrl);

    this.relayWs.on('open', () => {
        console.log('🌐 Connected to relay server');

        // Register with relay
        this.relayWs.send(JSON.stringify({
            type: 'register',
            nodeId: this.nodeId,
            address: `ws://${this.getLocalIP()}:${this.port}`
        }));

        // Send heartbeat every 30 seconds
        this.heartbeatInterval = setInterval(() => {
            if (this.relayWs.readyState === WebSocket.OPEN) {
                this.relayWs.send(JSON.stringify({
                    type: 'heartbeat',
                    nodeId: this.nodeId
                }));
            }
        }, 30000);
    });

    this.relayWs.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'node_list') {
            data.nodes.forEach(node => {
                if (node.nodeId !== this.nodeId) {
                    this.connectToPeer(node.address);
                }
            });
        }
    });

    this.relayWs.on('close', () => {
        console.log('📴 Disconnected from relay');
        clearInterval(this.heartbeatInterval);
        // Attempt reconnect after 10 seconds
        setTimeout(() => this.connectToRelay(relayUrl), 10000);
    });
}
```

---

## 🔌 WebSocket Communication

### Connection Establishment

**URL Format:** `ws://IP:PORT` or `wss://domain:port` (SSL)

**Handshake:**
```javascript
// Server side (listening node)
this.wss = new WebSocket.Server({ port: this.port });

this.wss.on('connection', (ws, req) => {
    const peerAddress = req.socket.remoteAddress;
    console.log(`📡 New peer connected: ${peerAddress}`);

    // Send blockchain sync
    ws.send(JSON.stringify({
        type: 'sync_request',
        chainLength: this.blockchain.chain.length
    }));

    ws.on('message', (message) => {
        this.handlePeerMessage(ws, message);
    });
});

// Client side (connecting node)
connectToPeer(address) {
    if (this.peers.has(address)) return; // Already connected

    const ws = new WebSocket(address);

    ws.on('open', () => {
        console.log(`✅ Connected to peer: ${address}`);
        this.peers.set(address, ws);

        // Send hello message
        ws.send(JSON.stringify({
            type: 'hello',
            nodeId: this.nodeId,
            nodeName: this.nodeName,
            chainLength: this.blockchain.chain.length
        }));
    });

    ws.on('message', (message) => {
        this.handlePeerMessage(ws, message);
    });

    ws.on('close', () => {
        console.log(`📴 Peer disconnected: ${address}`);
        this.peers.delete(address);
    });

    ws.on('error', (error) => {
        console.error(`❌ Peer connection error: ${error.message}`);
        this.peers.delete(address);
    });
}
```

### Message Types

| Type | Purpose | Direction | Example |
|------|---------|-----------|---------|
| `hello` | Initial handshake | Both | Node introduces itself |
| `sync_request` | Request blockchain | Server → Client | Compare chain lengths |
| `sync_response` | Send blockchain | Client → Server | Full chain data |
| `new_transaction` | Broadcast transaction | Both | Transaction propagation |
| `new_block` | Broadcast mined block | Both | Block propagation |
| `heartbeat` | Keep connection alive | Both | Every 30 seconds |

---

## 🌉 NAT Traversal

### The NAT Problem

**Scenario:** Node A (home) wants to connect to Node B (office)
- Node A behind home router NAT (192.168.1.100 internal)
- Node B behind office NAT (10.0.0.50 internal)
- Both have different public IPs

**Direct connection fails:**
```
[Node A] → Internet → [Node B's Router] → ❌ NAT blocks
(192.168.1.100)           (NAT)           (10.0.0.50)
```

### Solution: Relay-Assisted Discovery

1. **Both nodes register with relay:**
   - Node A → Relay: "I'm at ws://192.168.1.100:5000"
   - Node B → Relay: "I'm at ws://10.0.0.50:5000"

2. **Relay broadcasts node list:**
   - Relay → Node A: "Node B is at ws://10.0.0.50:5000"
   - Relay → Node B: "Node A is at ws://192.168.1.100:5000"

3. **Nodes attempt direct connection:**
   - If NAT allows (UPnP/port forwarding), direct WebSocket works ✅
   - If NAT blocks, nodes know each other exists but can't connect ❌

4. **Future enhancement: TURN server for relay traffic**

**Current limitations:**
- Relay enables discovery only
- Direct P2P requires open ports or UPnP
- Future: WebRTC/TURN for relay-based traffic routing

### Port Forwarding (Manual NAT Configuration)

**For home users wanting to accept connections:**

1. Log into router admin (usually 192.168.1.1)
2. Find "Port Forwarding" or "Virtual Server"
3. Add rule:
   - **External Port:** 5000
   - **Internal IP:** 192.168.1.100 (your Mac)
   - **Internal Port:** 5000
   - **Protocol:** TCP
4. Save and restart router

Now your node is publicly accessible at `ws://YOUR_PUBLIC_IP:5000`

---

## 🏗️ Relay Server Architecture

### Purpose
- Node registration and discovery
- Broadcast node list to network
- Keep-alive heartbeats
- Stale node cleanup

### NOT Used For
- Routing blockchain data (nodes connect directly)
- Storing blockchain state
- Transaction validation
- Mining

### Data Flow

```
[Node A]                    [Relay Server]                    [Node B]
   │                              │                               │
   │─────── register ────────────→│                               │
   │                              │←───── register ───────────────│
   │                              │                               │
   │                              │ (updates node registry)       │
   │                              │                               │
   │←───── node_list ─────────────│                               │
   │                              │────── node_list ──────────────→│
   │                              │                               │
   │                                                              │
   │────────────────── WebSocket (direct P2P) ───────────────────→│
   │                     (relay not involved)                     │
   │                                                              │
   │─── new_transaction ──────────────────────────────────────────→│
   │                    (blockchain data flows directly)          │
```

### Scalability

**Single relay server:**
- Handles ~1000 concurrent nodes
- Bandwidth: Mostly idle (only discovery messages)
- RAM: ~100MB for 1000 nodes
- CPU: <5%

**Multiple relay servers:**
- Load balance with DNS round-robin
- Redis pub/sub for relay coordination
- Nodes can connect to any relay

---

## 🛡️ Security Model

### Node Authentication

**Hardware-based identity:**
- Each Mac has unique Hardware UUID (from system_profiler)
- UUID = Node ID (no spoofing without hardware access)
- `A794987C-E1B2-5677-A97C-A1AAB8BFFF85`

**Future enhancements:**
- Public/private key pairs (Ed25519)
- Signed transactions
- Node reputation system

### Network Security

**Current:**
- WebSocket connections (unencrypted by default)
- No message signing
- Open network (any node can join)

**Production recommendations:**
- WSS (WebSocket Secure) with SSL certificates
- Message signing with private keys
- Whitelist trusted nodes
- Rate limiting to prevent spam

### Attack Vectors

| Attack | Risk | Mitigation |
|--------|------|------------|
| Sybil Attack | High | Reputation system, proof of work |
| DDoS on Relay | Medium | Rate limiting, multiple relays |
| Man-in-the-Middle | Medium | WSS encryption |
| Chain Poisoning | Low | Longest chain rule, consensus |
| Node Spoofing | Low | Hardware UUID, future key signing |

---

## 📨 Message Protocol

### Transaction Broadcast

```javascript
{
  "type": "new_transaction",
  "transaction": {
    "sender": "Alice",
    "recipient": "Bob",
    "amount": 50,
    "timestamp": 1732723200000
  }
}
```

**Process:**
1. User creates transaction on Node A
2. Node A adds to pending pool
3. Node A broadcasts to ALL connected peers
4. Peers receive, validate, add to their pending pools
5. Peers re-broadcast to THEIR peers (flood routing)

### Block Broadcast

```javascript
{
  "type": "new_block",
  "block": {
    "index": 5,
    "timestamp": 1732723300000,
    "transactions": [...],
    "nonce": 45678,
    "hash": "0000a1b2c3d4e5f6...",
    "previousHash": "00005f6e7d8c9b0a..."
  }
}
```

**Process:**
1. Node A mines block
2. Validates proof of work (hash starts with zeros)
3. Broadcasts to ALL peers
4. Peers receive, validate block
5. If valid, add to chain and re-broadcast
6. If invalid, reject and ignore

### Chain Sync

**When node connects:**
```javascript
// New node connects
{
  "type": "hello",
  "nodeId": "C12345DE...",
  "chainLength": 0  // New node, empty chain
}

// Existing node responds
{
  "type": "sync_response",
  "chain": [
    { block 0 },
    { block 1 },
    { block 2 },
    ...
  ]
}

// New node validates and adopts chain
```

**Consensus rule:** Longest valid chain wins

---

## 🌍 Network Topology

### Mesh Network

RangerBlock uses a **full mesh topology** where every node connects to every other node it discovers.

```
        [Node A]
       /    |    \
      /     |     \
   [Node B] | [Node C]
      \     |     /
       \    |    /
        [Node D]
```

**Advantages:**
- High redundancy (multiple paths)
- Fast propagation (direct connections)
- No single point of failure

**Disadvantages:**
- Scales quadratically (N nodes = N² connections)
- Higher bandwidth usage
- Not practical beyond ~100 nodes

### Future: Hub-and-Spoke Topology

For larger networks (1000+ nodes):

```
          [Hub Node]
         /    |    \
    [Node A] [B] [C]
     /   \         \
  [D]   [E]       [F]
```

**Features:**
- Designated hub nodes (high uptime)
- Leaf nodes connect to hubs only
- Hubs maintain mesh between themselves
- Scales to millions of nodes

---

## 🔧 Troubleshooting

### Nodes Not Discovering Each Other (Local)

**Symptoms:** Peer list stays empty

**Diagnosis:**
```bash
# Check UDP broadcast is working
sudo tcpdump -i any -n port 5005

# Should see discovery messages
```

**Fixes:**
1. **Firewall blocking UDP:**
   ```bash
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
   ```

2. **Wrong network interface:**
   ```bash
   # Check your local IP
   ifconfig | grep "inet "
   # Ensure it matches node's reported IP
   ```

3. **VPN interfering:**
   - Disconnect VPN and retry
   - VPNs often block local UDP broadcast

---

### Relay Connection Fails

**Symptoms:** "Failed to connect to relay server"

**Diagnosis:**
```bash
# Test relay health
curl http://relay-url:3001/health

# Test WebSocket
npm install -g wscat
wscat -c ws://relay-url:3001
```

**Fixes:**
1. **Relay server down:** Check relay logs, restart PM2
2. **Firewall:** Ensure port 3001 open
3. **Wrong URL:** Verify relay URL in config

---

### High Latency

**Symptoms:** Slow block/transaction propagation

**Diagnosis:**
```bash
# Check peer connection quality
curl http://localhost:5000/peers
# Look for high ping times
```

**Fixes:**
1. **Too many peers:** Limit to 20 connections
2. **Slow peers:** Disconnect peers with >500ms latency
3. **Network congestion:** Use QoS on router

---

### Chain Desync

**Symptoms:** Different nodes have different chains

**Diagnosis:**
```bash
# Check chain on each node
curl http://localhost:5000/chain | jq '.chain | length'
curl http://localhost:5001/chain | jq '.chain | length'
```

**Fixes:**
1. **Network partition:** Ensure all nodes connected
2. **Invalid blocks:** Check validation logic
3. **Mining conflict:** Longest chain rule should resolve

**Manual fix:**
```bash
# Stop all nodes
pkill -f RangerBlockNode

# Delete chain files
rm data/blockchain_*.json

# Restart nodes in sequence (30 sec apart)
```

---

## 📚 Further Reading

- **TEST_RANGERBLOCK.md** - Complete testing guide
- **DEPLOY_RELAY.md** - Relay server deployment
- **BLOCKCHAIN_HOMEWORK.md** - Blockchain fundamentals

Rangers lead the way! 🎖️

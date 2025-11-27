# 🧪 RangerBlock Testing Guide

**Complete testing procedures for RangerBlock P2P blockchain**

## 🎯 Testing Overview

We'll test:
1. Single node operation
2. Local network peer discovery (same WiFi)
3. Cross-network communication (relay server)
4. Transaction and mining
5. Network mode switching
6. Hardware detection
7. Multi-machine scenarios

## 📋 Pre-Test Checklist

- [ ] Node.js installed (v18+)
- [ ] WebSocket library installed (`npm install ws`)
- [ ] Firewall allows Node.js connections
- [ ] Know your hardware UUID: `system_profiler SPHardwareDataType | grep "Hardware UUID"`
- [ ] Know your local IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`

## 🧪 Test Suite

### Test 1: Single Node Startup ✅

**Purpose:** Verify node starts correctly and creates genesis block

**Steps:**
```bash
cd /Users/ranger/rangerplex-ai/rangerblock
node RangerBlockNode.cjs --name TestNode1 --port 5000
```

**Expected Output:**
```
🎖️ RangerBlock Node Starting...
   Node Name: TestNode1
   Port: 5000
   Hardware UUID: A794987C-E1B2-5677-A97C-A1AAB8BFFF85
   Machine Type: M3
   Network Mode: Local Only

✅ Genesis block created
🚀 RangerBlock Node running on port 5000
   Dashboard: http://localhost:5000
```

**Verification:**
```bash
# Check dashboard
open http://localhost:5000

# Check API
curl http://localhost:5000/status
```

**Pass Criteria:**
- Node starts without errors
- Genesis block has index 0, hash starts with zeros
- Dashboard loads
- API returns valid JSON

---

### Test 2: Local Peer Discovery 🔍

**Purpose:** Test nodes finding each other on same WiFi/LAN

**Steps:**
```bash
# Terminal 1
node RangerBlockNode.cjs --name Node1 --port 5000

# Terminal 2 (after 5 seconds)
node RangerBlockNode.cjs --name Node2 --port 5001

# Terminal 3 (after 5 seconds)
node RangerBlockNode.cjs --name Node3 --port 5002
```

**Expected Output:**
Each node should output:
```
🔍 Broadcasting discovery message...
📡 Received discovery from Node2 at 192.168.1.100:5001
✅ Connected to peer: Node2 (ws://192.168.1.100:5001)
```

**Verification:**
```bash
# Check peers on Node1
curl http://localhost:5000/peers

# Should show Node2 and Node3
```

**Pass Criteria:**
- All nodes discover each other within 30 seconds
- Each node's peer list shows other nodes
- WebSocket connections established

---

### Test 3: Transaction Broadcasting 💸

**Purpose:** Verify transactions propagate across network

**Setup:** Run Test 2 first (3 nodes connected)

**Steps:**
```bash
# Create transaction on Node1
curl -X POST http://localhost:5000/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "Alice",
    "recipient": "Bob",
    "amount": 50
  }'
```

**Expected Output:**
```json
{
  "success": true,
  "message": "Transaction added to pending pool",
  "transaction": {
    "sender": "Alice",
    "recipient": "Bob",
    "amount": 50,
    "timestamp": 1732723200000
  }
}
```

**Verification:**
```bash
# Check all nodes have the transaction
curl http://localhost:5000/pending
curl http://localhost:5001/pending
curl http://localhost:5002/pending
```

**Pass Criteria:**
- Transaction appears in pending pool on ALL nodes
- Broadcast completes within 2 seconds

---

### Test 4: Mining and Block Propagation ⛏️

**Purpose:** Verify mined blocks propagate to all nodes

**Setup:** Run Test 3 (transaction created)

**Steps:**
```bash
# Mine block on Node1
curl -X POST http://localhost:5000/mine
```

**Expected Output:**
```json
{
  "success": true,
  "message": "Block mined successfully",
  "block": {
    "index": 1,
    "timestamp": 1732723300000,
    "transactions": [...],
    "nonce": 45678,
    "hash": "0000a1b2c3d4...",
    "previousHash": "genesis_hash..."
  }
}
```

**Verification:**
```bash
# Check all nodes have the new block
curl http://localhost:5000/chain | jq '.chain | length'
curl http://localhost:5001/chain | jq '.chain | length'
curl http://localhost:5002/chain | jq '.chain | length'

# All should return "2" (genesis + new block)
```

**Pass Criteria:**
- Block mines successfully (hash starts with zeros)
- New block appears on ALL nodes
- Chain length matches across all nodes

---

### Test 5: Relay Server Operation 🌐

**Purpose:** Test cross-network communication via relay

**Steps:**
```bash
# Terminal 1 - Start relay server
cd rangerblock
node relay-server.cjs

# Terminal 2 - Node1 (local mode)
node RangerBlockNode.cjs --name Node1 --port 5000

# Terminal 3 - Node2 (with relay)
node RangerBlockNode.cjs --name Node2 --port 5001 --relay ws://localhost:3001

# Terminal 4 - Node3 (global only mode)
node RangerBlockNode.cjs --name Node3 --port 5002 --relay ws://localhost:3001 --global-only
```

**Expected Output:**
```
Relay Server:
  📡 Node2 registered: { nodeId: 'A794987C...', address: 'ws://192.168.1.100:5001' }
  📡 Node3 registered: { nodeId: 'B89234FC...', address: 'ws://192.168.1.100:5002' }
  🔄 Broadcasting 2 nodes to network

Node2:
  🌐 Connected to relay server
  📡 Received 1 global node from relay: Node3

Node3:
  🌐 Connected to relay server
  📡 Received 1 global node from relay: Node2
```

**Verification:**
```bash
# Check relay status
curl http://localhost:3001/health

# Check Node2 peers (should have Node1 local + Node3 global)
curl http://localhost:5001/peers

# Check Node3 peers (should have ONLY Node2 - no local discovery)
curl http://localhost:5002/peers
```

**Pass Criteria:**
- Relay server registers nodes
- Node2 sees both local (Node1) and global (Node3) peers
- Node3 sees ONLY global peers (no Node1)

---

### Test 6: Hardware Detection 🖥️

**Purpose:** Verify Mac hardware UUID detection works

**Steps:**
```bash
# Start node and check hardware info
node RangerBlockNode.cjs --name HardwareTest --port 5000

# Query status
curl http://localhost:5000/status | jq '.hardware'
```

**Expected Output:**
```json
{
  "hardware": {
    "uuid": "A794987C-E1B2-5677-A97C-A1AAB8BFFF85",
    "machineType": "M3",
    "nodeName": "M3-Ranger's MacBook Pro",
    "computerName": "Ranger's MacBook Pro"
  }
}
```

**Verification:**
```bash
# Compare with system
system_profiler SPHardwareDataType | grep "Hardware UUID"
sysctl -n machdep.cpu.brand_string
```

**Pass Criteria:**
- Hardware UUID matches system profiler output
- Machine type correctly detected (M1/M2/M3/M4)
- Node name includes machine type and computer name

---

### Test 7: Network Mode Switching 🔄

**Purpose:** Test switching between network modes

**Steps:**
```bash
# Start in local mode
node RangerBlockNode.cjs --name ModeTest --port 5000

# Stop (Ctrl+C)

# Restart in hybrid mode
node RangerBlockNode.cjs --name ModeTest --port 5000 --relay ws://localhost:3001

# Stop (Ctrl+C)

# Restart in global-only mode
node RangerBlockNode.cjs --name ModeTest --port 5000 --relay ws://localhost:3001 --global-only
```

**Expected Behavior:**
- **Local mode**: Broadcasts UDP, no relay connection
- **Hybrid mode**: Broadcasts UDP + connects to relay
- **Global-only mode**: No UDP broadcast, only relay

**Verification:**
Check node logs for:
- Local mode: "🔍 Broadcasting discovery message..."
- Hybrid mode: "🔍 Broadcasting discovery message..." + "🌐 Connected to relay server"
- Global-only mode: ONLY "🌐 Connected to relay server"

**Pass Criteria:**
- Mode switches cleanly without errors
- Peer discovery behavior matches mode

---

### Test 8: Multi-Machine Test 🖥️🖥️

**Purpose:** Test RangerBlock across different machines

**Requirements:**
- 2+ Mac computers (M1Air, M4Max, etc.)
- Same WiFi network OR relay server deployed

**Steps:**

#### Local Network Test
```bash
# Machine 1 (M1Air)
node RangerBlockNode.cjs --name M1Air --port 5000

# Machine 2 (M4Max)
node RangerBlockNode.cjs --name M4Max --port 5000

# Wait 30 seconds for discovery
```

#### Cross-Network Test (with relay)
```bash
# Deploy relay (see DEPLOY_RELAY.md)

# Machine 1 (M1Air - at home)
node RangerBlockNode.cjs --name M1Air --port 5000 --relay ws://your-relay.com:3001

# Machine 2 (M4Max - at office)
node RangerBlockNode.cjs --name M4Max --port 5000 --relay ws://your-relay.com:3001
```

**Expected Output:**
```
M1Air:
  📡 Discovered peer: M4Max at 192.168.1.50:5000 (local)
  OR
  🌐 Discovered peer: M4Max via relay (global)

M4Max:
  📡 Discovered peer: M1Air at 192.168.1.100:5000 (local)
  OR
  🌐 Discovered peer: M1Air via relay (global)
```

**Verification:**
```bash
# On M1Air
curl http://localhost:5000/peers
# Should show M4Max

# On M4Max
curl http://localhost:5000/peers
# Should show M1Air

# Create transaction on M1Air
curl -X POST http://localhost:5000/transaction \
  -H "Content-Type: application/json" \
  -d '{"sender": "M1Air", "recipient": "M4Max", "amount": 100}'

# Mine on M4Max
curl -X POST http://localhost:5000/mine

# Check M1Air received the block
curl http://localhost:5000/chain | jq '.chain | length'
```

**Pass Criteria:**
- Machines discover each other
- Transactions propagate between machines
- Mined blocks sync across machines
- Each machine has unique hardware UUID

---

### Test 9: Stress Test - 10 Nodes 💪

**Purpose:** Test network with many nodes

**Steps:**
```bash
# Start 10 nodes on different ports
for i in {0..9}; do
  port=$((5000 + i))
  node RangerBlockNode.cjs --name "Node$i" --port "$port" &
  sleep 2
done

# Wait 60 seconds for full discovery
sleep 60

# Check Node0's peer count
curl http://localhost:5000/peers | jq 'length'
# Should show 9 peers
```

**Verification:**
```bash
# Create 10 transactions
for i in {0..9}; do
  port=$((5000 + i))
  curl -X POST "http://localhost:$port/transaction" \
    -H "Content-Type: application/json" \
    -d "{\"sender\": \"Node$i\", \"recipient\": \"Bank\", \"amount\": $((i * 10))}"
done

# Mine on Node0
curl -X POST http://localhost:5000/mine

# Check all nodes have the block
for i in {0..9}; do
  port=$((5000 + i))
  echo "Node$i chain length:"
  curl -s "http://localhost:$port/chain" | jq '.chain | length'
done
```

**Pass Criteria:**
- All 10 nodes discover each other
- All transactions broadcast to all nodes
- Mined block propagates to all 10 nodes
- No crashes or memory leaks

**Cleanup:**
```bash
# Kill all nodes
pkill -f "RangerBlockNode.cjs"
```

---

## 🔧 Troubleshooting

### Nodes Not Discovering Each Other

**Symptoms:** Nodes start but peer list stays empty

**Fixes:**
```bash
# 1. Check firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps

# 2. Allow Node.js
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node

# 3. Check network interface
ifconfig | grep "inet "

# 4. Try specific broadcast address
node RangerBlockNode.cjs --name Test --port 5000 --broadcast 192.168.1.255
```

### Relay Server Connection Failed

**Symptoms:** "Failed to connect to relay server"

**Fixes:**
```bash
# 1. Check relay is running
curl http://relay-url:3001/health

# 2. Check relay logs
ssh user@relay-server
pm2 logs relay-server

# 3. Test WebSocket connection
wscat -c ws://relay-url:3001
```

### Blockchain Desync

**Symptoms:** Different nodes have different chain lengths

**Fixes:**
```bash
# 1. Stop all nodes
pkill -f "RangerBlockNode.cjs"

# 2. Delete blockchain data (if testing)
rm -rf data/blockchain_*.json

# 3. Restart in sequence (30 sec apart)
node RangerBlockNode.cjs --name Node1 --port 5000
# Wait 30 seconds
node RangerBlockNode.cjs --name Node2 --port 5001
```

### High CPU Usage

**Symptoms:** Node.js using 100% CPU

**Likely Cause:** Mining difficulty too low, mining too fast

**Fix:**
```javascript
// In RangerBlockNode.cjs, increase difficulty
this.difficulty = 5; // More zeros required in hash
```

---

## 📊 Test Results Template

```markdown
# RangerBlock Test Results - [Date]

**Hardware:**
- Machine: [M1/M2/M3/M4]
- RAM: [GB]
- macOS: [Version]

**Tests:**
- ✅ Test 1: Single Node Startup
- ✅ Test 2: Local Peer Discovery
- ✅ Test 3: Transaction Broadcasting
- ✅ Test 4: Mining and Block Propagation
- ✅ Test 5: Relay Server Operation
- ✅ Test 6: Hardware Detection
- ✅ Test 7: Network Mode Switching
- ⏳ Test 8: Multi-Machine Test (pending second machine)
- ✅ Test 9: Stress Test - 10 Nodes

**Issues Found:**
- [Description]

**Notes:**
- [Additional observations]
```

---

## 🎖️ Advanced Testing

### Performance Benchmarking
```bash
# Time 100 transactions
time for i in {1..100}; do
  curl -s -X POST http://localhost:5000/transaction \
    -H "Content-Type: application/json" \
    -d "{\"sender\": \"User$i\", \"recipient\": \"Bank\", \"amount\": $i}" > /dev/null
done

# Time mining
time curl -X POST http://localhost:5000/mine
```

### Network Latency Test
```bash
# Measure block propagation time
# (requires custom logging in RangerBlockNode.cjs)

# Start 5 nodes
# Create transaction on Node1
# Mine on Node1
# Measure time until Node5 receives block
```

### Security Testing
```bash
# Test invalid transactions
curl -X POST http://localhost:5000/transaction \
  -H "Content-Type: application/json" \
  -d '{"sender": "", "recipient": "Bob", "amount": -50}'

# Test chain tampering (should fail validation)
curl http://localhost:5000/chain
# Manually edit blockchain file
# Restart node (should reject invalid chain)
```

---

## 📚 Next Steps

After testing:
1. Deploy relay server (see DEPLOY_RELAY.md)
2. Test on multiple machines
3. Implement group chat UI
4. Add transaction signing (private keys)
5. Implement consensus algorithm

Rangers lead the way! 🎖️

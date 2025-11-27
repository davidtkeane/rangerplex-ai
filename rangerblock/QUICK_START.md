# 🚀 RangerBlock Quick Start

**Fast reference for starting and testing RangerBlock blockchain**

## 🎯 Start a Node (5 seconds)

```bash
# From rangerblock folder
node RangerBlockNode.cjs --name MyNode --port 5000

# With relay server (for cross-network)
node RangerBlockNode.cjs --name MyNode --port 5000 --relay ws://your-relay.com:3001
```

## 🌐 Network Modes

### 1. Local Only
```bash
# Discovers nodes on same WiFi/LAN only
node RangerBlockNode.cjs --name LocalNode --port 5000
```

### 2. Local + Global (Recommended)
```bash
# Discovers both local AND remote nodes via relay
node RangerBlockNode.cjs --name HybridNode --port 5000 --relay ws://relay.rangerblock.io:3001
```

### 3. Global Only
```bash
# Only uses relay server (no local discovery)
node RangerBlockNode.cjs --name GlobalNode --port 5000 --relay ws://relay.rangerblock.io:3001 --global-only
```

## 🧪 Quick Tests

### Test 1: Single Node
```bash
# Terminal 1
node RangerBlockNode.cjs --name Node1 --port 5000

# Check dashboard
open http://localhost:5000
```

### Test 2: Two Local Nodes
```bash
# Terminal 1
node RangerBlockNode.cjs --name Node1 --port 5000

# Terminal 2
node RangerBlockNode.cjs --name Node2 --port 5001
```

They should find each other on local network!

### Test 3: With Relay Server
```bash
# Terminal 1 - Start relay
cd rangerblock
node relay-server.cjs

# Terminal 2 - Node 1
node RangerBlockNode.cjs --name Node1 --port 5000 --relay ws://localhost:3001

# Terminal 3 - Node 2
node RangerBlockNode.cjs --name Node2 --port 5001 --relay ws://localhost:3001
```

## 📊 Check Status

### Dashboard
```bash
open http://localhost:5000
```

Shows:
- Node info (hardware UUID, machine type)
- Connected peers
- Blockchain stats
- Network mode

### API Endpoints
```bash
# Node status
curl http://localhost:5000/status

# Blockchain data
curl http://localhost:5000/chain

# Connected peers
curl http://localhost:5000/peers
```

## ⛏️ Mining

### Auto-Mining (Default)
Nodes mine automatically when started.

### Manual Mining
```bash
curl -X POST http://localhost:5000/mine
```

### Create Transaction
```bash
curl -X POST http://localhost:5000/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "Alice",
    "recipient": "Bob",
    "amount": 50
  }'
```

## 🔧 Troubleshooting

### Node won't start
```bash
# Check if port is in use
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Nodes won't connect
```bash
# Check firewall (Mac)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps

# Allow Node.js
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
```

### Relay server unreachable
```bash
# Test connection
curl http://relay-url:3001/health

# Check relay logs
# (see DEPLOY_RELAY.md)
```

## 🎖️ Hardware Detection

Check your Mac's hardware UUID:
```bash
system_profiler SPHardwareDataType | grep "Hardware UUID"
```

This UUID is your node's unique identity!

## 📚 More Info

- **TEST_RANGERBLOCK.md** - Complete testing procedures
- **DEPLOY_RELAY.md** - Deploy relay server
- **RANGERBLOCK_NETWORKING.md** - Network architecture
- **BLOCKCHAIN_HOMEWORK.md** - Full learning guide

Rangers lead the way! 🎖️

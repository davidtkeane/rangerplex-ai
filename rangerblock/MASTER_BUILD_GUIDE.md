# RangerBlock Master Build Guide

## Complete Timeline, Instructions & Manual

**Version:** 4.0.24
**Created:** November 30, 2025
**Author:** David Keane (IrishRanger) + Claude Code (Ranger)
**Purpose:** Complete reference for rebuilding, extending, and maintaining RangerBlock

---

# PART 1: BUILD TIMELINE

## The Complete Story of RangerBlock

### Phase 1: Genesis (September 11, 2025)
**Duration:** ~30 hours with 5 AIs (Claude, Gemini, ChatGPT, Qwen, Ollama)

| Date | Milestone | Files Created |
|------|-----------|---------------|
| Sept 11 | Initial blockchain concept | `SimpleBlockchain.cjs` |
| Sept 11 | P2P WebSocket relay | `relay-server.cjs` |
| Sept 11 | Terminal chat client | `blockchain-chat.cjs` |
| Sept 12 | Hardware detection | `hardwareDetection.cjs` |
| Sept 12 | Node identity system | `.personal/node_identity.json` |
| Sept 12 | Genesis node creation | `.personal/genesis_node.json` |

### Phase 2: Multi-Machine Testing (September-October 2025)

| Date | Milestone | Details |
|------|-----------|---------|
| Sept 15 | M3Pro ↔ M1Air test | First successful P2P chat! |
| Sept 20 | M4Max joins network | Beast mode online |
| Oct 1 | Kali VM testing | UTM integration |
| Oct 15 | GUI integration | BlockchainChat.tsx component |

### Phase 3: Cloud & Bridge (November 2025)

| Date | Milestone | Files Created |
|------|-----------|---------------|
| Nov 25 | Bridge architecture | `relay-server-bridge.cjs` |
| Nov 26 | Google Cloud deploy | Cloud relay online |
| Nov 27 | ngrok integration | Ireland tunnel working |
| Nov 28 | Dynamic registry | Machine auto-discovery |
| Nov 29 | Blockchain Explorer | Block visualization |
| Nov 29 | Network Status modal | Node status display |
| Nov 30 | Smart Contracts | 8 .ranger templates |
| Nov 30 | RangerBot chatbot | !help, !fact, games |
| Nov 30 | Setup scripts | Kali + Windows installers |
| Nov 30 | AWS/GCP guides | Cloud documentation |

---

# PART 2: COMPLETE FILE LIST

## Core Files (The Heart of RangerBlock)

```
/Users/ranger/rangerplex-ai/rangerblock/
│
├── core/                              # CORE BLOCKCHAIN ENGINE
│   ├── relay-server-bridge.cjs        # MAIN SERVER (use this!)
│   │   └── Features: WebSocket relay, bridge connections,
│   │       RangerBot, message routing, dashboard API
│   │
│   ├── relay-server.cjs               # Simple relay (legacy)
│   ├── blockchain-chat.cjs            # Terminal chat client
│   ├── blockchain-ping.cjs            # Connectivity tester
│   ├── setup_new_user.cjs             # Node identity creator
│   ├── hardwareDetection.cjs          # Hardware UUID detection
│   └── SimpleBlockchain.cjs           # Blockchain data structure
│
├── server-only/                       # CLOUD/REMOTE DEPLOYMENT
│   ├── setup-kali-relay.sh            # Linux/Kali installer
│   ├── setup-windows-relay.ps1        # Windows installer
│   ├── AWS_SETUP.md                   # AWS guide
│   ├── GOOGLE_CLOUD_SETUP.md          # GCP guide
│   ├── NETWORK_TOPOLOGY.md            # Network diagram
│   └── RELAY_BRIDGE_PLAN.md           # Bridge architecture
│
├── .personal/                         # NODE IDENTITY (SECRET!)
│   ├── genesis_node.json              # Genesis (M3Pro) identity
│   ├── node_identity.json             # Local node identity
│   └── phantom_wallet.json            # Phantom wallet keys
│
├── malware-lab/                       # MASTER'S THESIS TESTING
│   ├── hello_there.py                 # Test malware (GUI)
│   └── hello_there_terminal.py        # Test malware (terminal)
│
├── install-rangerplexblock.cjs        # Interactive installer
├── blockchainService.cjs              # Auto-start service
├── relay-config.json                  # Bridge peer configuration
├── README.md                          # Main documentation
└── MASTER_BUILD_GUIDE.md              # THIS FILE
```

## Frontend Files

```
/Users/ranger/rangerplex-ai/src/components/
│
├── BlockchainChat.tsx                 # MAIN CHAT COMPONENT
│   └── Features:
│       - P2P chat interface
│       - Channel management (#rangers, #general, etc.)
│       - Smart Contract templates & deployment
│       - Blockchain Explorer modal
│       - Network Status modal
│       - Message Journey Tracer (Tron-style)
│       - Settings modal (relay configuration)
│       - File transfer UI (BlockFile)
│
└── [Other RangerPlex components...]
```

## Configuration Files

```
/Users/ranger/rangerplex-ai/
│
├── package.json                       # npm scripts for blockchain
│   └── Scripts:
│       - npm run blockchain:relay-bridge
│       - npm run blockchain:relay
│       - npm run blockchain:chat
│       - npm run blockchain:ping
│       - npm run blockchain:setup
│       - npm run blockchain:status
│
└── rangerblock/relay-config.json      # Bridge peer configuration
    └── Structure:
        {
          "relay": { "name", "port", "dashboardPort" },
          "bridge": {
            "enabled": true,
            "peers": [
              { "name": "ngrok-ireland", "host": "...", "port": 12232 },
              { "name": "aws-relay", "host": "...", "port": 5555 }
            ]
          }
        }
```

---

# PART 3: INSTRUCTIONS FOR FUTURE CLAUDE SESSIONS

## For Claude Code (Ranger): Read This First!

### Understanding the System

1. **This is a P2P blockchain network** - NOT cryptocurrency!
2. **WebSocket-based** - All communication through port 5555
3. **Bridge architecture** - Local relays connect to cloud relays
4. **Hardware-bound identity** - Nodes verified by hardware UUID

### Key Files to Read

When starting work on RangerBlock, read these files first:
```bash
# Main documentation
/rangerblock/README.md
/rangerblock/MASTER_BUILD_GUIDE.md

# Core server (most important!)
/rangerblock/core/relay-server-bridge.cjs

# Frontend component
/src/components/BlockchainChat.tsx

# Configuration
/rangerblock/relay-config.json
```

### How the System Works

```
┌─────────────────────────────────────────────────────────────┐
│                    MESSAGE FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   User types message in BlockchainChat.tsx                   │
│                    ↓                                         │
│   WebSocket sends to relay-server-bridge.cjs                 │
│                    ↓                                         │
│   Server broadcasts to all connected clients                 │
│                    ↓                                         │
│   Bridge forwards to remote peers (cloud servers)            │
│                    ↓                                         │
│   All nodes receive message                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Common Tasks for Claude

| Task | What to Edit |
|------|--------------|
| Add new chat feature | `BlockchainChat.tsx` |
| Modify server behavior | `relay-server-bridge.cjs` |
| Add new bot command | `RANGERBOT` object in relay-server-bridge.cjs |
| Add new smart contract | `SMART_CONTRACT_TEMPLATES` in BlockchainChat.tsx |
| Add new cloud server | `relay-config.json` peers array |
| Create setup script | `/server-only/` directory |

### Version Bumping

Always bump version in `package.json` after significant changes:
```json
"version": "4.0.XX"  // Increment XX
```

### Testing Changes

```bash
# Start the server
npm run blockchain:relay-bridge

# In another terminal, test chat
npm run blockchain:chat

# Check dashboard
open http://localhost:5556
```

---

# PART 4: USER CONNECTION GUIDE

## How to Connect New Users

### Scenario 1: Same Local Network (Home/Office)

1. **Genesis node (M3Pro) starts relay:**
   ```bash
   npm run blockchain:relay-bridge
   ```

2. **New user installs RangerPlex:**
   ```bash
   git clone https://github.com/davidtkeane/rangerplex-ai.git
   cd rangerplex-ai
   npm install
   ```

3. **New user configures relay host:**
   - Open RangerPlex: `npm run browser`
   - Go to Blockchain Chat
   - Click Settings (gear icon)
   - Set relay host: `192.168.1.35:5555` (Genesis IP)

4. **New user connects!**

### Scenario 2: Remote User (Internet)

**Option A: ngrok Tunnel**
1. Genesis runs ngrok: `ngrok tcp 5555`
2. Share ngrok URL: `2.tcp.eu.ngrok.io:12232`
3. Remote user sets that as relay host

**Option B: Cloud Relay**
1. Both users connect to cloud relay
2. Set relay host: `34.26.30.249:5555` (Google Cloud)
3. Or AWS: `YOUR_AWS_IP:5555`

### Scenario 3: New Machine (Windows PC)

1. **Run PowerShell installer:**
   ```powershell
   irm https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-windows-relay.ps1 | iex
   ```

2. **Start relay:**
   ```powershell
   npm run relay
   ```

3. **Machine auto-connects to bridge peers**

### Scenario 4: Kali VM (UTM/VMware)

1. **Set VM to Bridged networking**

2. **Run installer:**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-kali-relay.sh | bash
   ```

3. **Start relay:**
   ```bash
   npm run relay
   ```

---

# PART 5: STEP-BY-STEP MANUAL

## Complete Setup From Scratch

### Step 1: Prerequisites

**On macOS:**
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify
node --version  # Should be 18+
npm --version
```

**On Windows:**
```powershell
# Install via winget
winget install OpenJS.NodeJS.LTS
```

**On Linux/Kali:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Clone RangerPlex

```bash
# Clone repository
git clone https://github.com/davidtkeane/rangerplex-ai.git
cd rangerplex-ai

# Install dependencies
npm install
```

### Step 3: Setup Node Identity

```bash
# Run interactive setup
npm run blockchain:setup

# Or automatic setup (first run creates identity)
npm run blockchain:relay-bridge
```

### Step 4: Start Relay Server

```bash
# Start with bridge connections (RECOMMENDED)
npm run blockchain:relay-bridge

# You should see:
# ========================================
#   RANGERBLOCK P2P RELAY SERVER
#   With Bridge Connections
# ========================================
# WebSocket: ws://0.0.0.0:5555
# Dashboard: http://0.0.0.0:5556
```

### Step 5: Connect from Another Machine

**Terminal Chat:**
```bash
npm run blockchain:chat -- --relay 192.168.1.35:5555
```

**GUI Chat:**
1. Run `npm run browser`
2. Click "Blockchain" tab
3. Settings → Set relay host
4. Start chatting!

### Step 6: Test Connectivity

```bash
# Ping test
npm run blockchain:ping

# Check status
curl http://localhost:5556/api/status
```

---

## Adding a Cloud Server

### Google Cloud

1. **Create Instance:**
   - Go to cloud.google.com → Compute Engine
   - Create e2-micro (free tier)
   - Debian 12, 30GB disk

2. **Configure Firewall:**
   - VPC Network → Firewall → Create Rule
   - Allow TCP 5555, 5556 from 0.0.0.0/0

3. **SSH and Install:**
   ```bash
   # SSH in
   gcloud compute ssh YOUR_INSTANCE

   # Install RangerBlock
   curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-kali-relay.sh | bash

   # Start relay
   cd ~/rangerblock-server
   npm run relay
   ```

4. **Keep Running:**
   ```bash
   npm install -g pm2
   pm2 start relay-server.cjs --name rangerblock
   pm2 save
   pm2 startup
   ```

5. **Add to Bridge Config:**
   Edit `relay-config.json`:
   ```json
   {
     "bridge": {
       "peers": [
         {
           "name": "gcloud-new",
           "host": "YOUR_EXTERNAL_IP",
           "port": 5555,
           "enabled": true
         }
       ]
     }
   }
   ```

### AWS

Same process, see `/rangerblock/server-only/AWS_SETUP.md`

---

## Troubleshooting Guide

### "Port 5555 already in use"
```bash
lsof -ti:5555 | xargs kill -9
```

### "Can't connect to relay"
1. Check relay is running: `curl http://localhost:5556/api/status`
2. Check firewall allows port 5555
3. Verify IP address is correct

### "Bridge connection failed"
1. Check internet connectivity
2. Verify peer is online: `nc -zv PEER_IP 5555`
3. Check relay-config.json syntax

### "No other peers visible"
1. Ensure relay is running on Genesis node
2. Check channel is same (#rangers)
3. Try reconnecting

### "WebSocket disconnects frequently"
1. Check network stability
2. Increase heartbeat interval in relay-config.json
3. Check for firewall interference

---

# PART 6: QUICK REFERENCE CARD

## Commands Cheat Sheet

```bash
# ============ STARTING ============
npm run blockchain:relay-bridge    # Start main relay
npm run blockchain:chat            # Terminal chat
npm run blockchain:ping            # Test connectivity

# ============ STATUS ============
curl http://localhost:5556/api/status    # JSON status
curl http://localhost:5556/api/nodes     # Connected nodes
open http://localhost:5556               # Dashboard

# ============ TROUBLESHOOTING ============
lsof -ti:5555 | xargs kill -9     # Kill port 5555
lsof -ti:5556 | xargs kill -9     # Kill port 5556
npm run stop                       # Stop all servers

# ============ CLOUD ============
pm2 start relay-server.cjs --name rangerblock
pm2 status
pm2 logs rangerblock
pm2 restart rangerblock
```

## Ports Reference

| Port | Service | Protocol |
|------|---------|----------|
| 5555 | WebSocket Relay | TCP |
| 5556 | HTTP Dashboard | TCP |
| 5005 | UDP Discovery | UDP |

## Network Architecture

```
     INTERNET
         │
    ┌────┴────┐
    │  ngrok  │──────────┐
    │ :12232  │          │
    └────┬────┘          │
         │               │
    ┌────┴────┐    ┌─────┴─────┐
    │  GCloud │    │    AWS    │
    │  :5555  │◄──►│   :5555   │
    └────┬────┘    └─────┬─────┘
         │               │
         └───────┬───────┘
                 │
    ┌────────────┴────────────┐
    │      HOME NETWORK       │
    │                         │
    │  M3Pro ◄──► M4Max       │
    │    │                    │
    │    └──► Kali VM         │
    └─────────────────────────┘
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 4.0.24 | Nov 30, 2025 | Kali setup, AWS/GCP guides, this doc |
| 4.0.23 | Nov 30, 2025 | Enhanced RangerBot |
| 4.0.22 | Nov 30, 2025 | RangerBot chatbot |
| 4.0.21 | Nov 30, 2025 | Smart Contracts |
| 4.0.20 | Nov 29, 2025 | Message Journey Tracer |
| 4.0.19 | Nov 29, 2025 | Blockchain Explorer |
| 4.0.18 | Nov 29, 2025 | Network Status modal |
| 4.0.12 | Nov 29, 2025 | Bridge architecture |
| 4.0.9 | Nov 28, 2025 | Dynamic machine registry |
| 1.0.0 | Sept 11, 2025 | Genesis - Initial blockchain |

---

**Rangers lead the way!** 🎖️

*This document should be kept updated as the system evolves.*
*Last updated: November 30, 2025 by Claude Code (Ranger)*

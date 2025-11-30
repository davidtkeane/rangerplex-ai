# RangerPlexBlock - P2P Blockchain for RangerPlex

**Version:** 4.0.24
**Created:** November 29, 2025
**Updated:** November 30, 2025
**Creator:** David Keane (IrishRanger) with Claude Code (Ranger)
**Philosophy:** "One foot in front of the other"

---

## What Is This?

RangerPlexBlock is a **FREE, peer-to-peer blockchain network** integrated into RangerPlex that enables:
- Real-time P2P chat between machines (GUI + Terminal)
- Smart Contracts (.ranger format - like Remix IDE!)
- Secure file transfers (.rangerblock format)
- RangerBot chatbot on all relay servers
- Hardware-bound node identity (Genesis security)
- Multi-platform support (macOS, Windows, Linux/Kali)
- Cloud relay servers (Google Cloud, AWS)
- No cryptocurrency - just secure communication!

**TESTED & WORKING:** M3Pro <--> M1Air <--> M4Max <--> Kali VM <--> Google Cloud!

---

## Quick Start

### For Genesis Node (M3Pro - Main Server)
```bash
# Start RangerPlex (blockchain auto-starts)
npm run browser

# Or start relay with bridge connections
npm run blockchain:relay-bridge
```

### For Peer Nodes (M1Air, M4Max, etc.)
```bash
# Start RangerPlex
npm run browser

# Or use terminal chat
npm run blockchain:chat -- --relay 192.168.1.35:5555
```

### For Cloud Servers (Google Cloud, AWS, etc.)
```bash
# Download and run the server-only files
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-relay-universal.sh | bash

# Start relay
npm run relay
```

### For Windows PCs
```powershell
# Run in PowerShell
irm https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-relay-windows.ps1 | iex
```

---

## npm Commands

| Command | Description |
|---------|-------------|
| `npm run blockchain:relay-bridge` | Start relay with bridge to other servers |
| `npm run blockchain:relay` | Start simple relay server |
| `npm run blockchain:chat` | Terminal P2P chat client |
| `npm run blockchain:ping` | Test P2P connectivity |
| `npm run blockchain:install` | Interactive installer for new users |
| `npm run blockchain:setup` | Setup node identity with security |
| `npm run blockchain:status` | Check blockchain status |

---

## Network Architecture (Current)

```
                         ☁️ INTERNET ☁️
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  🇮🇪 NGROK       │  │  ☁️ GOOGLE CLOUD │  │  ☁️ AWS          │
│  Ireland Tunnel │  │  Kali Server    │  │  (Coming Soon)  │
│ 2.tcp.eu.ngrok  │  │  34.26.30.249   │  │                 │
│     :12232      │  │     :5555       │  │                 │
└────────┬────────┘  └────────┬────────┘  └─────────────────┘
         │                    │
         │   BRIDGED PEERS    │
         │◄──────────────────►│
         │                    │
         ▼                    ▼
    ┌─────────────────────────────────────────────┐
    │              🏠 HOME NETWORK                 │
    │               192.168.x.x                    │
    │                                              │
    │  ┌───────────┐  ┌───────────┐  ┌──────────┐ │
    │  │ 💻 M3 Pro │◄►│ 💻 M4 Max │◄►│ 💻 M1Air │ │
    │  │  Genesis  │  │Beast Mode │  │   Peer   │ │
    │  │   :5555   │  │   :5555   │  │  :5555   │ │
    │  └─────┬─────┘  └───────────┘  └──────────┘ │
    │        │                                     │
    │        ▼                                     │
    │  ┌───────────────────────────────────────┐  │
    │  │          🐉 KALI VM (UTM/VMware)      │  │
    │  │       Bridged: 192.168.x.x            │  │
    │  │       :5555 relay + :5556 dashboard   │  │
    │  └───────────────────────────────────────┘  │
    │                                              │
    └──────────────────────────────────────────────┘
```

**Ports:**
- `5555` - WebSocket P2P relay (main communication)
- `5556` - HTTP dashboard (status monitoring)
- `5005` - UDP discovery (local network auto-discovery)

---

## Features

### Working Now (v4.0.24)
- [x] WebSocket relay server with bridge connections
- [x] GUI chat in RangerPlex browser
- [x] Terminal chat client (`npm run blockchain:chat`)
- [x] P2P ping test (`npm run blockchain:ping`)
- [x] Auto-start with RangerPlex
- [x] Hardware-bound node identity
- [x] Multi-machine communication (M3Pro <-> M1Air <-> M4Max)
- [x] IRC-style channels (#rangers, #general, #admin)
- [x] Live peer join/leave notifications
- [x] **RangerBot chatbot** (!help, !fact, !joke, !8ball, games!)
- [x] **Smart Contracts** (8 templates: Storage, Owner, Ballot, etc.)
- [x] **Contract deployment to blockchain**
- [x] **JSON export** for contracts and blocks
- [x] **Blockchain Explorer** with block details
- [x] **Network Status modal** with connected nodes
- [x] **Message Journey Tracer** (Tron-style visualization)
- [x] **Cloud relay servers** (Google Cloud, ngrok)
- [x] **Windows setup script** (PowerShell one-liner)
- [x] **Kali Linux setup script** (for VMs and cloud)
- [x] **Dynamic machine registry** (auto-discovery)

### Coming Soon
- [ ] AWS relay server deployment
- [ ] BlockCall - Voice calls over blockchain relay
- [ ] BlockVideoCall - Video calls over blockchain relay
- [ ] BlockFile - Secure file transfers UI
- [ ] Admin key system
- [ ] Permission levels

---

## RangerBot Commands

When you connect to any relay server, RangerBot greets you! Commands:

| Command | Description |
|---------|-------------|
| `!help` | Show all commands |
| `!status` | Network statistics |
| `!nodes` | Connected nodes |
| `!fact` | Random fun fact |
| `!joke` | Programmer joke |
| `!8ball <question>` | Magic 8-ball |
| `!fortune` | Fortune cookie |
| `!security` | Security tip |
| `!trivia` | Blockchain trivia |
| `!dice [sides] [count]` | Roll dice |
| `!rps <rock/paper/scissors>` | Play game |
| `!time` | Server time |
| `!ascii <name>` | ASCII art |

---

## Smart Contracts

RangerPlex includes 8 smart contract templates:

| Contract | Extension | Description |
|----------|-----------|-------------|
| Storage | `.storage.ranger` | Key-value storage |
| Owner | `.owner.ranger` | Ownership management |
| Ballot | `.ballot.ranger` | Voting system |
| MultiSig | `.multisig.ranger` | Multi-signature wallet |
| Token | `.token.ranger` | Token creation |
| Escrow | `.escrow.ranger` | Escrow service |
| Registry | `.registry.ranger` | Name registry |
| TimeLock | `.timelock.ranger` | Time-locked actions |

Export contracts as JSON, deploy to blockchain, download blocks!

---

## Folder Structure

```
rangerblock/
├── core/                         # Core blockchain files
│   ├── relay-server-bridge.cjs   # WebSocket relay with bridges (MAIN)
│   ├── relay-server.cjs          # Simple WebSocket relay
│   ├── blockchain-chat.cjs       # Terminal chat client
│   ├── blockchain-ping.cjs       # P2P connectivity test
│   ├── setup_new_user.cjs        # Node identity setup
│   ├── hardwareDetection.cjs     # Hardware UUID detection
│   └── SimpleBlockchain.cjs      # Blockchain template
│
├── server-only/                  # For cloud/remote servers (see below)
│   ├── setup-relay-universal.sh  # Universal installer (8 cloud providers!)
│   ├── setup-relay-simple.sh     # Lightweight PM2 installer
│   ├── setup-relay-windows.ps1   # Windows PowerShell installer
│   └── docs/                     # Setup documentation
│
├── just-chat/                    # Standalone chat client (see below)
│   ├── just-chat.sh              # One-click chat installer
│   ├── blockchain-chat.cjs       # Chat client
│   ├── web-chat.html             # Browser chat client
│   └── README.md                 # Just-Chat documentation
│
├── .personal/                    # Node identity (DO NOT SHARE!)
│   ├── genesis_node.json         # Genesis node identity
│   └── node_identity.json        # Local node identity
│
├── malware-lab/                  # Master's thesis malware testing
│   ├── hello_there.py            # Test malware (GUI)
│   └── hello_there_terminal.py   # Test malware (terminal)
│
├── install-rangerplexblock.cjs   # Interactive installer
├── blockchainService.cjs         # Service manager
├── CHANGELOG.md                  # Version history
└── README.md                     # This file
```

---

## 📁 server-only/ - Cloud Relay Setup

For deploying relay servers on cloud platforms (AWS, GCP, etc.) or VMs.

### Setup Scripts

| Script | Platform | Description |
|--------|----------|-------------|
| `setup-relay-universal.sh` | Linux/Cloud | **RECOMMENDED** - Auto-detects 8 cloud providers + VMs |
| `setup-relay-simple.sh` | Linux | Lightweight with PM2 process manager |
| `setup-relay-windows.ps1` | Windows | PowerShell installer with batch shortcuts |

### Quick Install (Cloud/Linux)
```bash
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-relay-universal.sh | bash
```

### Files Created After Setup
When you run the setup script, these files are created on the server:
```
~/rangerblock-server/
├── relay-server.cjs         # Main relay server (downloaded)
├── blockchain-chat.cjs      # Terminal chat client
├── blockchain-ping.cjs      # Connectivity test tool
├── package.json             # NPM package config
├── relay-config.json        # Bridge/peer configuration
├── node_modules/            # Installed dependencies
├── .personal/
│   └── node_identity.json   # Unique node identity
├── start-relay.sh           # Start relay helper
├── start-chat.sh            # Start chat helper
├── run-background.sh        # Run in background
├── network-diag.sh          # Network diagnostics
└── relay.log                # Server logs (when running)
```

### Documentation
- `docs/AWS_SETUP.md` - AWS EC2 setup guide
- `docs/GOOGLE_CLOUD_SETUP.md` - GCP setup guide
- `docs/NETWORK_TOPOLOGY.md` - Network architecture
- `docs/RELAY_BRIDGE_SETUP.md` - Bridge configuration
- `docs/DEPLOY_RELAY.md` - Complete deployment guide
- `docs/QUICK_START.md` - Fast reference

---

## 📁 just-chat/ - Standalone Chat Client

For users who just want to chat without the full RangerPlex platform.

### One-Click Install
```bash
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/just-chat/just-chat.sh -o just-chat.sh && chmod +x just-chat.sh && ./just-chat.sh
```

### Web Chat (Mobile/Browser)
```
http://44.222.101.125:5556/chat
```

### Features
- Interactive menu with options
- Auto-installs Node.js if needed
- Connects to AWS relay (24/7 uptime)
- Beautiful ASCII art and animations
- Commands: `-c` chat, `-t` test, `-s` status, `-h` help

### Files Created After Setup
```
~/.rangerblock/
├── blockchain-chat.cjs      # Chat client
└── node_identity.json       # Your unique identity
```

### Terminal Commands
| Command | Description |
|---------|-------------|
| `./just-chat.sh` | Interactive menu |
| `./just-chat.sh -c` | Start chatting |
| `./just-chat.sh -t` | Test connection |
| `./just-chat.sh -s` | Network status |
| `./just-chat.sh -u` | Update client |
| `./just-chat.sh -h` | Show help |

---

## Documentation Files

**Main docs:**
- `/rangerblock/README.md` - This file (main documentation)
- `/rangerblock/CHANGELOG.md` - Version history
- `/rangerblock/server-only/docs/` - Server setup guides
- `/rangerblock/just-chat/README.md` - Chat client docs

**Setup scripts:**
- `/rangerblock/server-only/setup-relay-universal.sh` - Universal (Linux/Cloud)
- `/rangerblock/server-only/setup-relay-simple.sh` - Simple (PM2)
- `/rangerblock/server-only/setup-relay-windows.ps1` - Windows

---

## Cloud Deployment

### Google Cloud (Kali Server)
```bash
# SSH into your instance
gcloud compute ssh kali-relay-server

# Run setup
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-relay-universal.sh | bash

# Start relay
npm run relay
```

### AWS (LIVE!)
```bash
# AWS Relay is LIVE at:
# Dashboard: http://44.222.101.125:5556
# WebSocket: ws://44.222.101.125:5555
# Web Chat:  http://44.222.101.125:5556/chat

# To deploy your own:
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-relay-universal.sh | bash
```
See `server-only/docs/AWS_SETUP.md` for detailed instructions.

### ngrok (For behind NAT)
```bash
# Install ngrok
brew install ngrok  # macOS
# or download from ngrok.com

# Start tunnel
ngrok tcp 5555

# Use the provided URL (e.g., 2.tcp.eu.ngrok.io:12232)
```

---

## Troubleshooting

### "Port 5555 already in use"
```bash
lsof -ti:5555 | xargs kill -9
```

### "Can't see other peers"
1. Check relay is running: `curl http://localhost:5556/api/status`
2. Verify relay host setting in BlockchainChat
3. Ensure same network or use ngrok/cloud relay

### "Bridge connection failed"
1. Check internet connectivity
2. Verify peer addresses in relay-config.json
3. Check firewall allows port 5555

---

## For Your Master's Thesis

This blockchain integration demonstrates ALL 4 courses:

1. **Blockchain Technology** - P2P network, smart contracts, blocks
2. **Network Security** - Hardware binding, RSA keys, relay architecture
3. **Penetration Testing** - Kali integration, pentest file sharing
4. **Digital Forensics** - Chain-of-custody, blockchain timestamps

Perfect for demonstrating integrated security platform!

---

Rangers lead the way! 🎖️

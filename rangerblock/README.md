# RangerPlexBlock - P2P Blockchain for RangerPlex

**Version:** 4.0.12
**Created:** November 29, 2025
**Creator:** David Keane (IrishRanger) with Claude Code
**Philosophy:** "One foot in front of the other"

---

## What Is This?

RangerPlexBlock is a **FREE, peer-to-peer blockchain network** integrated into RangerPlex that enables:
- Real-time P2P chat between machines (GUI + Terminal)
- Secure file transfers (coming soon)
- Hardware-bound node identity (Genesis security)
- No cryptocurrency - just secure communication!

**TESTED & WORKING:** M3Pro (Genesis) <--> M1Air (Peer) communication verified!

---

## Quick Start

### For Genesis Node (M3Pro - Main Server)
```bash
# Start RangerPlex (blockchain auto-starts)
npm run browser

# Or start relay manually
npm run blockchain:relay
```

### For Peer Nodes (M1Air, M4Max, etc.)
```bash
# Start RangerPlex without Docker (for machines without Docker)
npm run browser -- --skip-docker

# Or use terminal chat
npm run blockchain:chat -- --relay 192.168.1.35:5555
```

---

## npm Commands

| Command | Description |
|---------|-------------|
| `npm run blockchain:relay` | Start relay server (Genesis node only) |
| `npm run blockchain:chat` | Terminal P2P chat client |
| `npm run blockchain:ping` | Test P2P connectivity |
| `npm run blockchain:install` | Interactive installer for new users |
| `npm run blockchain:setup` | Setup node identity with security |
| `npm run blockchain:status` | Check blockchain status |

### Skip Docker Flag
```bash
# For machines without Docker Desktop
npm run browser -- --skip-docker
npm run browser -- -sd
```

---

## Network Architecture

```
                    INTERNET
                       |
          +-----------+-----------+
          |     M3Pro Genesis     |
          |  192.168.1.35:5555    |
          |  (WebSocket Relay)    |
          +-----------+-----------+
                      |
        +-------------+-------------+
        |             |             |
   +----+----+   +----+----+   +----+----+
   |  M1Air  |   |  M4Max  |   | Kali VM |
   |  Peer   |   |  Peer   |   |  Peer   |
   +---------+   +---------+   +---------+
```

**Ports:**
- `5555` - WebSocket P2P relay (main communication)
- `5556` - HTTP dashboard (status monitoring)
- `5005` - UDP discovery (local network auto-discovery)

---

## Folder Structure

```
rangerblock/
├── core/                        # Core blockchain files
│   ├── relay-server.cjs         # WebSocket relay server
│   ├── blockchain-chat.cjs      # Terminal chat client
│   ├── blockchain-ping.cjs      # P2P connectivity test
│   ├── setup_new_user.cjs       # Node identity setup
│   ├── hardwareDetection.cjs    # Hardware UUID detection
│   └── SimpleBlockchain.cjs     # Blockchain template
│
├── .personal/                   # Node identity (DO NOT SHARE!)
│   ├── genesis_node.json        # Genesis node identity
│   ├── node_identity.json       # Local node identity
│   └── *.json                   # Other identity files
│
├── chat/                        # Chat interfaces
│   ├── terminal_blockchain_chat.html
│   └── rangercode_chat.html
│
├── install-rangerplexblock.cjs  # Interactive installer
├── blockchainService.cjs        # Service manager (auto-start)
└── README.md                    # This file
```

---

## Features

### Working Now (v4.0.9)
- [x] WebSocket relay server
- [x] GUI chat in RangerPlex browser
- [x] Terminal chat client (`npm run blockchain:chat`)
- [x] P2P ping test (`npm run blockchain:ping`)
- [x] Auto-start with RangerPlex
- [x] Hardware-bound node identity
- [x] Multi-machine communication (M3Pro <-> M1Air)
- [x] IRC-style channels (#rangers, #general, #admin)
- [x] Live peer join/leave notifications
- [x] **Configurable relay settings** (connect from any network!)
- [x] **UI buttons for BlockCall, BlockVideoCall, BlockFile** (coming soon!)

### Coming Soon
- [ ] BlockCall - Voice calls over blockchain relay
- [ ] BlockVideoCall - Video calls over blockchain relay
- [ ] BlockFile - Secure file transfers (.rangerblock format)
- [ ] Admin key system
- [ ] Permission levels
- [ ] Cross-network relay (internet)

---

## Troubleshooting

### "Port 5555 already in use"
```bash
# Kill existing process
lsof -ti:5555 | xargs kill -9
```

### "Can't see other peers"
1. Make sure relay is running on Genesis node (M3Pro)
2. Check relay host is set correctly (192.168.1.35:5555)
3. Ensure both machines are on same network

### "Docker Desktop problems on startup"
```bash
# Use skip-docker flag
npm run browser -- --skip-docker
```

### "Electron not found"
```bash
# Use browser mode instead
npm run browser -- -t

# Or install dependencies
npm install
```

---

## Security Notes

- Node identities are stored in `rangerblock/.personal/` - **DO NOT SHARE**
- Hardware UUID binding prevents key theft
- RSA-2048 keypairs for node authentication
- Messages routed through relay (no direct IP exposure)

---

## For Your Master's Thesis

This blockchain integration demonstrates:
1. **Blockchain Technology** - P2P WebSocket network, node identity, message routing
2. **Network Security** - Hardware binding, RSA keys, relay architecture
3. **Practical Application** - Real working multi-machine communication

Perfect for demonstrating blockchain concepts without cryptocurrency complexity!

---

Rangers lead the way! 🎖️

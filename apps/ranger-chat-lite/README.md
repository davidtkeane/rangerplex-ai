# RangerChat Lite

Standalone Electron/React client for the RangerPlex blockchain network. Features secure P2P chat, voice/video calls, hardware-bound wallet, and blockchain ledger.

**Version:** 1.9.9 "Secure Wallet"

## Quick Install

### Windows (PowerShell)
```powershell
irm https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/apps/ranger-chat-lite/scripts/install.ps1 | iex
```

### macOS / Linux (Terminal)
```bash
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/apps/ranger-chat-lite/scripts/install.sh | bash
```

The scripts clone, install dependencies, build, and launch from `~/RangerChat-Lite`.

---

## Features

### 💬 Secure Chat
- P2P messaging via WebSocket relay
- Message history stored on blockchain ledger
- Proof of Work mining (auto every 10 msgs or 5 mins)

### 📞 Voice & Video Calls
- `/call <username>` - Start voice call
- `/video <username>` - Start video call
- Push-to-talk, mute, quality settings
- WebRTC P2P with blockchain fallback

### 💰 Secure Wallet (NEW!)
- Hardware-bound wallet (tied to device UUID)
- Auto-creates on first launch
- Encrypted storage (`~/.rangerblock-secure/`)
- RSA-2048 signed transactions

**Supported Coins:**
| Coin | Symbol | Purpose |
|------|--------|---------|
| RangerDollar | RGD | Free play token (1000 on signup) |
| RangerCoin | RC | Real value (Solana-linked) |
| HellCoin | HELL | Experimental |

### 📻 Ranger Radio & Podcasts
- 22+ SomaFM stations (ambient, electronic, metal, jazz)
- 10 curated security/coding podcasts
- Audio visualizer, playback speed control

### 🎨 Themes
- Classic, Matrix (green), Tron (cyan), Retro

---

## Slash Commands

### Calls
| Command | Description |
|---------|-------------|
| `/call <user>` | Voice call a user |
| `/video <user>` | Video call a user |
| `/hangup` | End current call |
| `/peers` | List online users |

### Wallet
| Command | Description |
|---------|-------------|
| `/wallet` | Full wallet info (address + balances) |
| `/balance` | Quick balance check |
| `/address` | Show wallet address |

### File Transfer (COURIER Protocol)
| Command | Description |
|---------|-------------|
| `/file accept on` | Start accepting files |
| `/file accept off` | Stop accepting files |
| `/file send <user> <path>` | Send file as .rangerblock |
| `/contract send <user> <path>` | Formal blockchain transfer |
| `/contract accept <id>` | Accept transfer contract |
| `/contract reject <id>` | Reject transfer contract |
| `/checksum <path>` | SHA-256 + MD5 hash of any file |
| `/verify <path>` | Verify .rangerblock integrity |

### Media
| Command | Description |
|---------|-------------|
| `/img <search>` | Search memes (FREE, no API key!) |
| `/meme [subreddit]` | Random meme |
| `/gif <search>` | Search GIFs |
| `/weather [city]` | Weather info |

### AI (Local)
| Command | Description |
|---------|-------------|
| `/ai status` | Check Ollama/LM Studio |
| `/model <name>` | Switch AI model |
| `/ask <query>` | Ask AI assistant |

### System
| Command | Description |
|---------|-------------|
| `/version` | Show app version |
| `/update` | Install updates |

---

## Packaged Apps

No build required - use pre-built binaries:

| Platform | Location |
|----------|----------|
| Windows | `release/win-unpacked/RangerChat Lite.exe` |
| macOS (Apple Silicon) | `release/mac-arm64/RangerChat Lite.app` |
| macOS (Intel) | `release/mac/RangerChat Lite.app` |

---

## Development

```bash
cd apps/ranger-chat-lite
npm install
npm run dev            # Vite dev server
npm run dev:electron   # Electron with hot reload
npm run build          # Production build
```

---

## Connect to Relay

1. Launch RangerChat Lite
2. Enter relay URL:
   - AWS: `ws://44.222.101.125:5555`
   - M3 Pro: `ws://64.43.137.153:5555`
   - Local: `ws://localhost:5555`
3. Enter auth token if required

---

## Run Your Own Relay (Admins)

Admins can run RangerChat Lite as a relay node:

```bash
WS_HOST=0.0.0.0 \
RELAY_SHARED_TOKEN=<secret> \
npm run dev:electron
```

Relay binary: `rangerblock/core/relay-server-bridge.cjs`

---

## Storage Locations

| Data | Location |
|------|----------|
| Identity | `~/.rangerblock/identity/` |
| Wallet (encrypted) | `~/.rangerblock-secure/wallet.enc` |
| Keys (encrypted) | `~/.rangerblock-secure/secure_keys.enc` |
| Blockchain | `~/.rangerblock/ledger/` |
| App settings | `localStorage` |

---

## Security Features

- **Hardware-bound identity** - Tied to device UUID
- **Encrypted wallet storage** - AES-256-GCM
- **RSA-2048 signatures** - All transactions signed
- **Replay protection** - Nonce tracking
- **Double-spend prevention** - Transaction validation
- **Rate limiting** - 10 tx/min, 20 EUR/day cap

---

## Requirements

- Node.js 18+
- Windows 10/11 or macOS 12+
- Network access to relay

---

## Author

**David Keane** (IrishRanger)
Email: david.keane.1974@gmail.com
GitHub: [davidtkeane](https://github.com/davidtkeane)

---

Rangers lead the way! 🎖️

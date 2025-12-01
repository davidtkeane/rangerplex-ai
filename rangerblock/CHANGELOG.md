# Changelog - RangerBlock

All notable changes to RangerBlock will be documented here.

---

## [4.2.0] - 2025-12-01

### Added - Super Sexy Chat Client v2.0.0
- **Rainbow ASCII Art Banner**: Beautiful multi-color RANGERBLOCK logo
- **Color-Coded Usernames**: Each user gets a unique color
- **Animated Connecting Spinner**: `⠋ ⠙ ⠹ ⠸...` while connecting
- **System Message Icons**: `✓ ✗ → ← ⚠ ℹ 🤖`
- **Timestamps**: All messages show `[HH:MM]` format
- **New Commands**: `/nick`, `/join`, `/msg`, `/me`, `/channels`, `/who`
- **Auto-reconnect**: Exponential backoff with 5 retry attempts
- **Nickname Persistence**: Saved to `~/.rangerblock-chat/.nickname`

### Changed
- **just-chat.sh v2.0.0**: Now prompts for nickname on first run
- **blockchain-chat.cjs v2.0.0**: Complete rewrite with sexy UI
- Default relay changed to AWS (44.222.101.125:5555)

### Historic Achievement
- **First 4-way multi-cloud chat**: M3Pro + M1Air + Google Cloud + AWS
- Chat log saved to `move/historic_blocks/chat_session_2025-12-01_00-28.json`

---

## [4.1.0] - 2025-11-30

### Added
- **Interactive menus** for all setup scripts (Quick Install, Custom, Help)
- **Web chat endpoint** (`/chat`) in relay-server-bridge.cjs
- `-y` / `--yes` / `--auto` flags to skip menus for automation
- Machine registry support (`getMachineRegistry`, `machine_register`)

### Changed
- **Renamed setup scripts** for clarity:
  - `setup-kali-relay.sh` → `setup-relay-universal.sh`
  - `setup-cloud-relay.sh` → `setup-relay-simple.sh`
  - `setup-windows-relay.ps1` → `setup-relay-windows.ps1`
- Moved documentation to `server-only/docs/` folder
- Simplified to 3 main scripts (deleted `install-rangerblock-relay.sh`)

### Fixed
- Protocol mismatch between terminal chat and web chat
- Unknown message type errors for machine registry

---

## [4.0.24] - 2025-11-30

### Added
- AWS relay server LIVE at `44.222.101.125:5555`
- Web chat page served directly from relay (`/chat` endpoint)
- Dashboard at `http://44.222.101.125:5556`

### Changed
- Updated network topology for AWS
- Improved relay-server-bridge.cjs with full machine registry

---

## [4.0.23] - 2025-11-29

### Added
- Bridge mode for relay servers (connect multiple relays)
- Google Cloud Kali server setup
- ngrok Ireland tunnel support
- Multi-cloud auto-detection (8 providers)

---

## [4.0.22] - 2025-11-29

### Added
- Windows PowerShell setup script
- PM2 process management option
- Kali Linux/VM setup script

---

## [4.0.0] - 2025-11-28

### Added
- RangerBot chatbot on relay servers
- Smart Contracts (8 templates)
- Blockchain Explorer
- Message Journey Tracer
- IRC-style channels (#rangers, #general, #admin)

---

## [3.0.0] - 2025-11-27

### Added
- WebSocket relay server architecture
- Hardware-bound node identity (Genesis security)
- Terminal chat client
- P2P ping test utility

---

## [2.0.0] - 2025-11-26

### Added
- GUI chat integration in RangerPlex browser
- Auto-start with RangerPlex
- Multi-machine communication

---

## [1.0.0] - 2025-11-25

### Added
- Initial RangerBlock release
- Basic P2P blockchain structure
- Genesis node creation

---

## Folder Structure

After setup, these files are created:

### On Cloud/Remote Server (`~/rangerblock-server/`)
```
rangerblock-server/
├── relay-server.cjs         # Main relay server
├── blockchain-chat.cjs      # Terminal chat client
├── blockchain-ping.cjs      # Connectivity test
├── package.json             # Dependencies
├── relay-config.json        # Bridge configuration
├── node_modules/            # Installed packages
├── .personal/
│   └── node_identity.json   # Unique node ID
├── start-relay.sh           # Helper script
├── start-chat.sh            # Helper script
└── relay.log                # Server logs
```

### On Local Machine (just-chat)
```
~/.rangerblock/
├── blockchain-chat.cjs      # Chat client
└── node_identity.json       # Your identity
```

---

## Network Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| 5555 | WebSocket | P2P relay communication |
| 5556 | HTTP | Dashboard & web chat |
| 5005 | UDP | Local network discovery |

---

*Rangers lead the way!*

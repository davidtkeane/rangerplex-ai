# Changelog - RangerBlock

All notable changes to RangerBlock will be documented here.

---

## [4.5.0] - 2025-12-02

### Added - More Slash Commands (voice-chat.cjs v2.2.0)

#### New Info Commands
- **`/relay`**: Show relay server info (host, port, URL, dashboard, status)
- **`/status`**: Show your current status (state, call partner, talking, muted, peers)
- **`/info`**: Show your node info (nickname, node ID, IP, channel, version)
- **`/ping`**: Test relay connection
- **`/clear`**: Clear screen
- **`/debug`**: Toggle debug mode ON/OFF

### Changed
- Debug mode now starts OFF by default (toggle with `/debug`)
- Version bumped to v2.2.0

---

## [4.4.0] - 2025-12-02

### Added - Private Calls & Group Voice (voice-chat.cjs v2.1.0)

#### Private Calling System
- **`/call <user>`**: Call a specific user (e.g., `/call M3Pro`)
- **Incoming Call Notifications**: Big red flashing alert + terminal beep
- **Quick Answer Keys**: Type `a` to answer, `r` to reject
- **`/answer`**: Answer incoming call
- **`/reject`**: Decline incoming call
- **`/hangup`**: End current call
- **30-second timeout**: Auto-cancel if no answer
- **Busy signal**: If user is already in a call

#### Group Voice Channel
- **`/voice`**: Join group voice (Discord-style, everyone hears you)
- **`/leave`**: Leave group voice channel
- **Member notifications**: See who joins/leaves group voice

#### Voice Controls (while in call)
- **`t`**: Start talking (push-to-talk)
- **`s`**: Stop talking
- **`/mute`**: Mute incoming audio
- **`/unmute`**: Unmute audio

#### Integrated Chat
- Type any text to send chat messages (works alongside voice)
- See chat messages from both chat client and voice client users

#### Debug Mode
- Shows voice packet flow for troubleshooting
- Call request matching debug
- Audio playback status

### Fixed
- Nickname matching for calls (partial matches work: "MSI" matches "MSI-123")
- Call notifications now properly display on receiver's terminal

---

## [4.3.0] - 2025-12-02

### Added - Voice Chat & Unified Communications System

#### Voice Chat v1.0.0 (voice-chat.cjs)
- **Push-to-talk**: Press SPACE to transmit, release to stop
- **Mute/Unmute**: Toggle with 'M' key
- **David's 73→27→73 Compression**: zlib compression targeting 27% ratio
- **SoX Integration**: Cross-platform audio capture and playback
- **Peer Status**: See who's online and talking
- **Commands**: `/peers`, `/volume`, `/mute`, `/unmute`, `/quit`

#### Communications Architecture
- **COMMS_ARCHITECTURE.md**: Full documentation of unified system
- **Modular Design**: Chat, Voice, Files (future) as separate modules
- **Placeholder Commands**: `/voice`, `/send`, `/encrypt`, `/verify` in chat client
- **Security Ready**: Infrastructure for future encryption and verification

#### Install Scripts Updated
- **setup-relay-universal.sh**: Now installs SoX, downloads voice-chat.cjs
- **setup-relay-windows.ps1**: Now installs SoX via winget, creates Start-Voice.bat
- **New npm command**: `npm run voice` to start voice chat
- **New helper scripts**: `start-voice.sh` (Linux/Mac), `Start-Voice.bat` (Windows)

### Changed
- **blockchain-chat.cjs v3.0.0**: Added placeholder commands for voice/file/encryption
- Updated package.json in install scripts to include voice command

### Technical
- SoX used for audio recording (rec) and playback (play)
- Audio format: 16-bit, 16kHz mono PCM
- WebSocket protocol extended for voice packets
- Compression uses Node.js zlib module

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

### Cleanup
- **Moved**: `scripts/` folder to `move/old_scripts/` (contained deprecated files)
- **Files archived**: `RangerBlockNode.cjs`, `START_RANGERBLOCKCORE.sh`, `UNIVERSAL_MENU_TEMPLATE.sh`
- **Reason**: These were replaced by `core/relay-server-bridge.cjs` and npm scripts

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
├── voice-chat.cjs           # Voice chat client
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

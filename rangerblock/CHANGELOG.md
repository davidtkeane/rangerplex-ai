# Changelog - RangerBlock

All notable changes to RangerBlock will be documented here.

---

## [5.3.0] - 2025-12-04

### Added - File Transfer Smart Contracts (COURIER PROTOCOL)

#### New Files
| File | Location | Purpose |
|------|----------|---------|
| `RangerFileTransfer.sol` | `Blockchain/contracts/` | Ethereum file transfer contract |
| `ranger_file_transfer.rs` | `Blockchain/contracts/solana/` | Solana file transfer contract |
| `file-transfer-service.cjs` | `lib/` | JavaScript integration service |

#### Features
- **Formal transfers** - Blockchain-recorded file transfer agreements
- **Informal transfers** - Quick send with `/file accept on`
- **.rangerblock format** - Compressed file package with metadata + hash
- **Chain of custody** - Immutable record of sender/receiver/timestamp
- **Dual signatures** - Both parties sign the transfer contract
- **24-hour expiry** - Auto-cancel pending transfers
- **Hash verification** - SHA-256 checksum matching

#### Transfer Modes

| Mode | Use Case | Blockchain Record |
|------|----------|-------------------|
| **Informal** | Quick file share with friend | No |
| **Formal** | Legal/sensitive documents | Yes (immutable) |

#### Chat Commands

```
/file accept on         # Enable receiving files
/file accept off        # Disable receiving files
/file send <user> <path>    # Send file informally

/contract send <user> <path>    # Create formal transfer
/contract accept <id>           # Accept pending transfer
/contract reject <id>           # Reject pending transfer
/contract status <id>           # Check transfer status
```

#### .rangerblock File Format
```
RNGBLK01 (magic)
metadata_length (4 bytes)
metadata (JSON: filename, size, hash, sender, timestamp)
compressed_data (zlib)
```

---

## [5.2.0] - 2025-12-04

### Added - Multi-Chain Smart Contracts

#### Solana/Anchor Contracts
Location: `Blockchain/contracts/solana/`

| Contract | Purpose |
|----------|---------|
| `ranger_registration.rs` | User registration + consent tracking |
| `ranger_token.rs` | SPL Token with 20 EUR/day transfer limit |
| `ranger_bridge.rs` | Cross-chain conversion bridge |
| `Anchor.toml` | Project configuration |

#### Ethereum/Solidity Contracts
Location: `Blockchain/contracts/`

| Contract | Purpose |
|----------|---------|
| `RangerRegistration.sol` | User registration + consent (Remix compatible) |
| `RangerBridge.sol` | Cross-chain conversion bridge |

#### Bridge Features
Convert between RangerCoin and major cryptocurrencies:

| From | To | Method |
|------|-----|--------|
| RangerCoin | Bitcoin | via WBTC (Wrapped Bitcoin) |
| RangerCoin | Ethereum | via ETH/wETH |
| RangerCoin | Solana | via SOL |
| RangerCoin | USD | via USDC (Stablecoin) |

#### Security Features
- **20 EUR/day conversion limit** - Prevents abuse
- **1% fee** - Goes to treasury
- **Oracle-based rates** - Admin-updateable
- **Pause function** - Emergency freeze
- **Hardware ID tracking** - Ban evasion prevention

#### Deployment
- **Ethereum**: Use Remix IDE (https://remix.ethereum.org)
- **Solana**: Use Solana Playground (https://beta.solpg.io)

---

## [5.1.1] - 2025-12-04

### Fixed - AWS Server Path Issue

#### Server Update Script (server-only/update-server.sh) v1.0.0
- **NEW SCRIPT**: One-command update for AWS/remote servers
- **Path fix**: Automatically converts `../lib/` to `./lib/` for flat server structure
- **Full lib download**: Downloads all required lib files (identity-service, hardware-id, crypto-utils, etc.)
- **Works for both users**: Root (relay) and Admin (chat client)

#### Setup Scripts Updated
- **setup-relay-universal.sh**: Now includes path fix + sync-manager.cjs download
- **setup-relay-windows.ps1**: Now includes path fix + sync-manager.cjs download
- **Version bump**: Both scripts now create v5.1.1 package.json

#### Bug Fix
- **identity-service.cjs crash**: Server couldn't find `./hardware-id.cjs` and other lib dependencies
- **Root cause**: Files downloaded from `just-chat/` folder had `../lib/` paths (for nested structure)
- **Server structure is flat**: `rangerblock-server/blockchain-chat.cjs` + `rangerblock-server/lib/`
- **Fix**: Update script now patches all paths after download

#### Usage on AWS
```bash
# One-liner update (run as root OR admin):
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/update-server.sh | bash

# Then test:
bash start-chat.sh
```

---

## [5.1.0] - 2025-12-03

### Added - E2E Encryption Complete 🔐

#### identity-service.cjs v1.1.0
- **`encryptForRecipient()`**: Hybrid RSA + AES-256-GCM encryption
- **`decryptMessage()`**: Decrypt messages encrypted for you
- **Hybrid approach**: RSA-OAEP encrypts random AES key, AES encrypts message
- **E2E test in CLI**: Test #9 verifies encryption roundtrip

#### Security v2.1.0 Complete
- All 4 High Priority security tasks finished
- Ready for `/dm` or `/encrypt` command integration

---

## [5.0.0] - 2025-12-03

### Added - Security Foundation 🛡️

#### Auth Server (lib/auth-server.cjs)
- **Challenge-Response Authentication**: Prove identity without exposing private key
- **30-second challenge expiry**: Time-limited cryptographic nonce
- **1-hour session tokens**: `sess_*` prefixed session IDs
- **Standalone or integrated**: Run on port 5557 or integrate with relay
- **Session management**: `verifySession()`, `revokeSession()`, `getActiveSessions()`

#### On-Chain Registration (just-chat/register-identity.cjs)
- **`node register-identity.cjs`**: Register your identity on the blockchain
- **`node register-identity.cjs --check`**: Check registration status
- **Signed registration block**: IDENTITY_REGISTRATION type with RSA signature
- **Block hash proof**: Saved to `~/.rangerblock/` for verification

#### Message Signing (blockchain-chat.cjs v4.1.0)
- **Outgoing messages signed**: All messages include RSA signature + public key
- **Incoming verification**: Signatures verified on receipt
- **Visual indicators**:
  - ✓ Green = verified sender
  - ✗ Red = invalid signature
  - ? = verification error
- **Trust system**: Know who's really sending messages

#### Shared Identity Library (lib/identity-service.cjs v1.0.0)
- **Hardware-bound identity**: Device fingerprinting
- **RSA-2048 key pairs**: For signing and encryption
- **Cross-app sharing**: `~/.rangerblock/` used by all apps
- **App instances**: `chatLiteIdentity`, `justChatIdentity`, `voiceChatIdentity`

#### Admin Dashboard (private)
- **admin-users.cjs**: View connected users with userIds
- **Real-time monitoring**: See all authenticated connections
- **Private storage**: Not in public git repo

### Changed
- **Shared storage**: All apps now use `~/.rangerblock/` instead of app-specific folders
- **Identity sync**: Same userId across RangerChat Lite, blockchain-chat, voice-chat

---

## [4.7.0] - 2025-12-02

### Added - Visual Audio Meter & Better UX (voice-chat.cjs v2.4.0)

#### 🎉 VOICE CHAT WORKING! M3Pro ↔ MSI Windows Communication Achieved!

#### Live Audio Visualization
- **Audio Level Meter**: Real-time visual bar `[████████░░░░]` showing voice level
- **Color-Coded Levels**:
  - 🔈 Green = quiet/normal
  - 🔉 Yellow = louder
  - 🔊 Red = loud/clipping
- **Live Stats**: Shows compression ratio + packet count

#### Improved UX
- **TRANSMITTING Banner**: Shows who you're talking to
- **Clear Instructions**: "Type s + Enter to stop talking"
- **Headphone Reminder**: Tips to avoid echo/feedback loops
- **Connected Banner**: Nice formatted box with command hints
- **Better Stop Display**: Shows next actions available

#### Windows Fixes
- Fixed SoX audio on Windows (uses `-t waveaudio default`)
- Fixed mic detection on Windows with better PowerShell queries

---

## [4.6.0] - 2025-12-02

### Added - Microphone Selection (voice-chat.cjs v2.3.0)

#### Microphone Commands
- **`/mic`**: List all available microphones on your system
- **`/mic <number>`**: Select a specific microphone by number
- **`/mic test`**: Test current microphone (records 3 seconds, plays back)

#### Why This Feature
- **Teams/Zoom Conflict**: If another app is using your mic exclusively, switch to another
- **External Devices**: Easily switch to USB headsets, webcams, or professional mics
- **Pre-Call Testing**: Verify your mic works before joining a call

#### Cross-Platform Detection
- **macOS**: `system_profiler SPAudioDataType`
- **Windows**: PowerShell `Get-WmiObject Win32_SoundDevice`
- **Linux**: `arecord -l`

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

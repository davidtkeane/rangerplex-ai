# RangerChat Lite - Changelog

All notable changes to RangerChat Lite will be documented in this file.

## [2.0.2] - 2026-01-27 - "README Quick Start Guide"

### Added
- **README.md**: Added Step 1 / Step 2 quick start guide with one-liner install commands for Windows, macOS, and Linux/WSL
- **README.md**: Added Step 2 "Start RangerChat Lite" section with `npm run dev` and `npm run build` commands
- **README.md**: Added note clarifying `npm run build` is NOT required - only needed for packaging the Electron app

---

## [2.0.1] - 2026-01-27 - "Smart Install Scripts"

### Changed

#### Install Scripts (`scripts/install-rangerchat-now.sh` & `.ps1`) - v1.8.0
- **Bash**: Added full OS/distro detection (macOS with version name + chip type, Ubuntu, Kali, Debian, Fedora, Arch, Alpine, openSUSE, CentOS/RHEL, Raspberry Pi, WSL)
- **Bash**: Added system info box displaying OS, Arch, Package Manager, Shell, and WSL status
- **Bash**: Added Alpine (`apk`), openSUSE (`zypper`), and CentOS/RHEL (`yum`) package manager support
- **Bash**: Added git check and auto-install (was missing)
- **Bash**: Added npm fallback install if missing after Node install
- **Bash**: macOS now uses `brew install node@22` for proper v22 targeting
- **PowerShell**: Added system info box showing Windows edition/version, architecture, winget availability, and RAM
- **PowerShell**: Git install via winget now verifies success and gives restart instructions

### Fixed
- **Bash**: NodeSource URL updated from `setup_20.x` to `setup_22.x` (was installing Node 20 instead of 22)
- **PowerShell**: Direct download fallback updated from `node-v20.10.0` to `node-v22.11.0`
- **PowerShell**: npm error message now points to correct Node 22 download URL

## [2.0.0] - 2026-01-27 - "End-to-End Encryption"

### Added

#### E2E Encryption (AES-256-GCM + RSA-2048)
- **Hybrid Encryption**: Messages encrypted with AES-256-GCM, session keys wrapped with RSA-2048 per-peer
- **Unique Session Keys**: Every message uses a fresh AES-256 key (forward secrecy)
- **Digital Signatures**: All encrypted messages signed with sender's RSA private key to prevent impersonation
- **Relay Server Blind**: Server only sees encrypted blobs - true end-to-end encryption
- **Backward Compatible**: Unencrypted clients can still send/receive plaintext messages
- **Lock Icon**: Encrypted messages display 🔒 badge, verified signatures show 🔒✓
- **Key Exchange**: Public keys shared via WebSocket registration message
- **Settings Toggle**: Enable/disable E2EE in Settings > Security & Encryption
- **Status Display**: Shows E2EE status, key loaded state, and peer key count in Settings

#### Crypto IPC Bridge
- 8 new IPC handlers: `crypto:getPublicKey`, `crypto:generateSessionKey`, `crypto:encryptAES`, `crypto:decryptAES`, `crypto:encryptRSA`, `crypto:decryptRSA`, `crypto:sign`, `crypto:verify`
- Uses existing `crypto-utils.cjs` from rangerblock/lib
- Uses existing RSA-2048 keys from identity service

### Security Properties
- AES-256-GCM: Authenticated encryption (tamper-proof)
- RSA-2048 OAEP: Secure key exchange with SHA-256
- Per-message session keys: Compromise of one key doesn't affect others
- Digital signatures: Sender authentication and non-repudiation
- Wireshark capture shows only encrypted blobs on the wire

## [1.9.9] - 2026-01-27 - "Secure Wallet"

### Added

#### Hardware-Bound Secure Wallet
- **Wallet Auto-Init**: Wallet automatically created on first launch, bound to device hardware
- **Wallet Address Display**: Shows your unique wallet address in Settings (format: `RB_XXXX-XXXX-...`)
- **RGD Balance Display**: Shows RangerDollar balance (new users start with 1000 RGD)
- **Accessible Address Format**: Uses only clear characters (`23456789ABCDEFGHJKMNPQRSTUVWXYZ`) - no confusing 0/O, 1/l/I

#### Wallet Security Features
- **Hardware Binding**: Wallet cryptographically tied to device hardware UUID
- **RSA-2048 Signatures**: All transactions signed with hardware-bound keys
- **Replay Protection**: Nonce tracking prevents transaction reuse
- **Double-Spend Prevention**: Same transaction can't be submitted twice
- **Rate Limiting**: 10 transactions/minute, 20 EUR daily cap for real-value coins

#### Supported Coins
| Coin | Symbol | Purpose |
|------|--------|---------|
| RangerCoin | RC | Real value (Solana-linked), 10% education tithe |
| RangerDollar | RGD | Free play token, 100B supply |
| HellCoin | HELL | Experimental testing |

#### Slash Commands (New)
- `/wallet` - Show full wallet info (address + all balances)
- `/balance` - Quick balance check (one-liner)
- `/address` - Show wallet address (easy to copy)
- `/file accept on|off` - Toggle file receiving
- `/file send <user> <path>` - Send file as .rangerblock (informal)
- `/contract send <user> <path>` - Create formal blockchain transfer contract
- `/contract accept <id>` - Accept pending contract
- `/contract reject <id>` - Reject pending contract
- `/checksum <path>` - SHA-256 + MD5 hash of any file (sender shares hash for verification)
- `/verify <path>` - Verify .rangerblock file integrity (receiver confirms file untampered)

#### Blockchain Recording for File Transfers
- **File Package → Block**: Every `.rangerblock` file packaging is recorded on the blockchain ledger
- **Contract Create → Block**: Formal transfer contracts are recorded with sender, receiver, and contract ID
- **Contract Accept → Block**: Contract acceptance and completion recorded on-chain
- **Contract Reject → Block**: Rejections recorded for audit trail with reason
- **Channel**: All file transfer events stored on the `file-transfers` channel
- **Full Audit Trail**: Every file operation is immutable and verifiable on the blockchain

#### IPC Handlers (New)
- `wallet:init` - Initialize hardware-bound wallet
- `wallet:getStatus` - Get wallet address and balances
- `wallet:getAddress` - Get wallet address only
- `wallet:getBalances` - Get all coin balances
- `filetransfer:package` - Package file as .rangerblock
- `filetransfer:extract` - Extract .rangerblock back to original
- `filetransfer:acceptToggle` - Toggle file acceptance
- `filetransfer:isAccepting` - Check if accepting files
- `filetransfer:createContract` - Create formal transfer contract
- `filetransfer:acceptContract` - Accept contract
- `filetransfer:rejectContract` - Reject contract
- `filetransfer:status` - Get file transfer service status
- `filetransfer:checksum` - SHA-256 + MD5 hash of any file
- `filetransfer:verify` - Verify .rangerblock integrity (hash match, signature, metadata)

### Technical
- Uses `secure-wallet.cjs` and `wallet-ledger-integration.cjs` from rangerblock/lib
- Wallet data stored encrypted in `~/.rangerblock-secure/wallet.enc`
- Hardware attestation in `~/.rangerblock-secure/hardware_attestation.json`
- Integrates with existing ledger for on-chain balance tracking

### Documentation
- **GENESIS_WALLET_HISTORY.md**: Historical record of first wallet transaction (Jan 27, 2026)
- **SECURITY_HARDENING.md**: Updated with wallet security details

### Changed
- Updated author email to `david.keane.1974@gmail.com`

---

## [1.9.8] - 2026-01-27 - "Relay Node"

### Added

#### Admin-Only Relay Server
- **Relay Server Integration**: RangerChat Lite can now run as a relay node
- **Admin Detection**: Only Supreme Admins and Admins can start relay servers
- **Auto-Start on Launch**: Relay automatically starts if user is admin
- **Relay Status Indicator**: 🟢 "Relay" badge appears in chat header when relay is active
- **Node Type Display**: Shows "Main Node (Relay)" in Network settings when relay is running
- **Start/Stop Relay**: IPC handlers for manual relay control (`relay:start`, `relay:stop`, `relay:getStatus`)

#### Preload API
- **relay.getStatus()**: Check if relay is running, get port and process info
- **relay.start()**: Manually start relay server (admin-only)
- **relay.stop()**: Manually stop relay server
- **relay.onStatusChange()**: Subscribe to relay status change events

### Technical
- Uses `relay-server-bridge.cjs` from rangerblock core
- Spawns relay as child process with proper cleanup on app quit
- Environment variables: `RELAY_NAME`, `WS_PORT` passed to relay
- Safe logging prevents EPIPE errors on shutdown

### Security
- Non-admin users run as "Sub-nodes" (clients only)
- Only authorized users can become relay nodes
- Future: Option A will allow everyone to become relay nodes with proper controls

### Network Configuration
- **M3 Pro Fallback Server**: Configured at `ws://64.43.137.153:5555`
- **Multi-Node Architecture**: Support for 4 main relay nodes:
  - AWS Primary (☁️): `44.222.101.125:5555`
  - M3 Pro (💻): `64.43.137.153:5555`
  - M4 Max (🦾): `64.43.137.153:5556` (port forward required)
  - MSI Vector (🎮): `64.43.137.153:5557` (port forward required)
- **Port Forwarding Guide**: Multiple machines on same public IP using different external ports

### Documentation
- **NODE_STRUCTURE.md**: Comprehensive network architecture documentation in `theplan/`
  - Network hierarchy diagrams (ASCII art)
  - Port forwarding setup guide for home networks
  - Internal IP mapping (M3 Pro: .3, M4 Max: .12, MSI: .11)
  - Router configuration instructions for Irish ISPs (Eir, Virgin, Sky)
  - Connection flow and failover sequence
  - Admin role system and relay permissions
  - Troubleshooting guide

---

## [1.9.7] - 2026-01-27 - "Quick Fix"

### Added
- **`/img <search>` Command**: Search for memes by keyword using Reddit - **NO API KEY NEEDED!**
  - Uses Electron IPC to bypass CORS restrictions
  - Prioritizes meme subreddits (memes, dankmemes, funny, me_irl, wholesomememes)
  - Sorts by upvotes for quality results
  - Filters NSFW content and low-score posts
  - Shows upvote count (⬆️) in results
- **Image Lightbox**: Click any meme/image to expand in a beautiful fullscreen viewer
- **Image Actions**: View and Save buttons below each image in chat
- **Download Images**: Save memes directly to your computer from lightbox
- **Open Original**: Button to open image in new browser tab
- **Meme Subreddit Quick Select**: Clickable tags in slash commands for popular subreddits (memes, dankmemes, wholesomememes, programmerhumor, prequelmemes, etc.)
- **Weather ASCII Art**: Weather display now shows cool ASCII art for different conditions (sunny, rain, snow, clouds, thunder, fog, night)
- **`/weather large` Option**: Detailed weather view with 6-hour forecast and 3-day outlook
- **Weather Submenu**: Quick select for cities (Dublin, London, New York, Tokyo) and large format in autocomplete
- **`/img` Help Section**: Added clickable search suggestions in slash commands help (chuck norris, star wars, batman, programming, cats, dogs, nature, funny, wholesome, gaming, avengers, the office)
- **Server Fallback System**: Automatic fallback to secondary servers if primary is unavailable
  - AWS Primary (☁️) + M3 Pro Fallback (💻) configured
  - 5-second timeout per server, automatic retry with next server
  - Detailed connection error messages with troubleshooting tips
- **Node Hierarchy System**: Main nodes (AWS, M3 Pro) vs Sub-nodes (regular users)
  - Visual indicator in chat header showing connected server and node type
  - Configurable in Settings with full server list
- **Network & Servers Settings Section**: New prominent settings section showing:
  - Current connection status with server name
  - List of available relay servers with status
  - Custom server URL input
  - Node hierarchy explanation (Main vs Sub nodes)

### Fixed
- **Meme Command**: Fixed `/meme` not displaying images - added proper message display and image rendering
- **Image Rendering**: Added `renderMessageContent()` to parse markdown images `![alt](url)` into actual `<img>` tags
- **Meme Error Messages**: Now shows actual API error and suggests working subreddits
- **Brace Imbalance**: Fixed extra `return` and `}` that prematurely closed `sendMessage` function
- **Weather Command**: Fixed missing `weatherMatch` regex definition causing build error
- **EPIPE Crash**: Fixed "write EPIPE" error on app close with safe logging functions
- **GIF Command**: Fixed `/gif` command not displaying results (was assigning to undefined variable)
- **Weather Display Formatting**: Fixed `/weather large` output being all stuck together - now displays with proper line breaks, aligned columns, and clean ASCII art

### Improved
- **Slash Commands UI**: Redesigned modal with organized sections (Calls, Info, Media, System), clear Close button at bottom, better layout and scrolling
- **Chat Images**: Styled with rounded corners, max-height 280px, hover glow effect, accent border on hover
- **Weather Display**: Enhanced weather output with emoji, temperature, feels-like, condition, wind, humidity, and rain chance
- **Message Content**: Added `white-space: pre-wrap` to preserve line breaks and formatting in chat messages
- **Smart Contracts Section**: Updated voice chat and video chat contracts - removed "COMING SOON" labels as features are now live. Use `/call <user>` for voice and `/video <user>` for video calls


---

## [1.9.6] - 2026-01-27 - "Memes & GIFs"

### Added
- **Meme Command**: `/meme` and `/meme <subreddit>` using free API.
- **GIF Command**: `/gif <search>` using Tenor API.
- **Settings**: New "Media & API Keys" section to configure Tenor API Key.

## [1.9.5] - 2026-01-27 - "Video Calls"

### Added

#### Peer-to-Peer Video Calls
- **WebRTC Video Calling**: Full peer-to-peer video calling with real-time streaming
- **`/video <username>` Command**: Start a video call from chat (like `/call` for voice)
- **Video Call Button**: Click the camera icon next to peers in call list
- **Video Call Overlay**: Full-screen overlay with remote video and local PiP preview
- **Signal Quality Indicator**: Visual bars showing connection quality (0-100%)
- **Call Timer Display**: Shows elapsed call duration (HH:MM:SS)

#### Video Call Controls
- **Camera Toggle**: Turn camera on/off during call
- **Microphone Mute**: Mute/unmute audio during call
- **Mirror Local Preview**: Option to flip local video horizontally
- **End Call Button**: Gracefully end the video call

#### Keyboard Shortcuts
- **M**: Toggle microphone mute
- **V**: Toggle camera on/off
- **Esc**: End the video call
- Shortcuts only active during video calls and when enabled in settings

#### Video Settings (Settings Page)
- **Video Quality**: Low (320p) / Medium (480p) / High (720p) / HD (1080p)
- **Frame Rate**: 15 / 24 / 30 fps
- **Max Bandwidth**: 500 Kbps to 5 Mbps limit
- **Camera Selection**: Choose from available cameras
- **Microphone Selection**: Choose from available mics
- **Mirror Local Video**: Flip local preview horizontally
- **Mute Audio on Join**: Start calls with mic muted
- **Mute Video on Join**: Start calls with camera off

#### Transport Modes
- **WebRTC (P2P)**: Direct peer-to-peer connection (fastest)
- **Blockchain Relay**: Route through RangerBlock relay server
- **Hybrid**: Try P2P first, fallback to relay if needed
- **Transport Indicator**: Shows current transport mode in call overlay

#### Advanced Settings
- **Background Blur**: Off / Light / Medium / Heavy
- **Noise Suppression**: AI-powered noise reduction
- **Echo Cancellation**: Prevent audio feedback
- **Hardware Acceleration**: GPU-accelerated encoding

#### Accessibility
- **High Contrast Controls**: Enhanced visibility for controls
- **Large Control Buttons**: Bigger touch/click targets
- **Screen Reader Announcements**: ARIA live regions for call events
- **Keyboard Shortcuts Toggle**: Enable/disable M/V/Esc shortcuts

### Technical
- WebRTC RTCPeerConnection with ICE candidates
- Signaling via existing WebSocket relay
- Video settings persisted to localStorage
- Compatible with existing voice call system (no regression)
- Theme-aware styling (Matrix green, Tron cyan)

### Fixed
- **Call Crash**: Fixed critical white screen crash when opening peer list caused by malformed server data
- **Defensive Rendering**: Added robust safety checks for peer data processing
- **Crash Recovery**: Added global Error Boundary with detailed crash report screen and reload button

### Improved
- **Update Notification**: Shows update alert in chat after connecting if new version available
- **`/update` Command**: Type `/update` in chat to download and install updates with hard refresh
- **`/version` Command**: Type `/version` to see current and latest version info
- **Update Progress**: Chat messages show download progress and success/failure
- **Hard Refresh**: Updates now do a page refresh instead of full app restart
- **Hourly Version Check**: Automatic check every hour with fun Ranger-themed status messages

### Contributors
- **Colonel Gemini Ranger** - WebRTC core, protocol, signaling
- **ChatGPT** - UI components, CSS styles, settings
- **Claude CLI** - Slash command, keyboard shortcuts, testing, documentation
- **Commander David** - Call flow functions, UI overlay

---

## [1.9.4] - 2026-01-22 - "Local Weather Alerts" 🌦️

### Added
- **/weather command**: Quick local weather snapshot using Open-Meteo (auto-detect or `/weather Dublin`)
- **Rain alerts (local)**: Optional in-app rain warnings while the app is open
- **Weather settings**: Lookahead window, location refresh (IP/GPS), and preview button

### Technical
- IP-based auto-detect with optional GPS override
- No API keys required; location cached in localStorage

## [1.9.3] - 2026-01-22 - "Slash Command Help" ❔💬

### Added
- **Slash Commands Help**: New `?` button in chat header opens a quick command reference
- **Command List**: `/call`, `/hangup` or `/end`, `/peers` or `/online`

### Documentation
- Added a **Slash Commands** section to the README with usage examples

## [1.9.2] - 2025-12-06 - "Chat Matrix Complete" 🎬💬✨

### Added

#### Separate Chat Screensaver Settings
- **New Settings Section**: "💬 Chat Screensaver" with independent controls
- **12 New Settings**: Dedicated chat screensaver configuration separate from radio
  - Enable/Disable toggle
  - Background Mode (Matrix Rain, Slideshow, None)
  - Opacity slider (10-100%)
  - Slide interval and transition effects
  - Matrix on idle with configurable timeout
  - Clock display toggle
  - Matrix density, speed, brightness, trail length

#### Transparent Chat Backgrounds
- **Screensaver Visibility**: Chat history background becomes transparent when screensaver enabled
- **Frosted Glass Effect**: Header and input areas get blur + semi-transparency
- **Message Readability**: Messages keep semi-opaque backgrounds
- **Theme Support**: Custom colors for Matrix, Tron, and Retro themes

### Fixed
- **Chat Screensaver Not Visible**: Fixed solid backgrounds covering screensaver
- **Settings Isolation**: Radio and Chat screensavers now have completely separate controls

### Technical
- Added `screensaver-active` class to chat-interface when enabled
- Extended `RadioSettings` interface with 12 chat screensaver properties
- Theme-aware CSS for transparent backgrounds in screensaver mode

---

## [1.9.1] - 2025-12-06 - "Chat Matrix" 🎬💬

### Added

#### Chat Area Screensaver
- **Matrix Rain in Chat**: Screensaver now applies to the entire chat interface
- **Full Coverage**: Matrix rain and slideshow behind chat messages
- **Proper Layering**: Z-index ensures messages, header, and input stay visible above screensaver
- **Shared Settings**: Uses same screensaver settings as radio panel

### Fixed
- **Chat History Z-Index**: Added `position: relative` and `z-index: 10` to `.chat-history` for proper screensaver layering

---

## [1.9.0] - 2025-12-05 - "Radio Screensaver" 🎬✨

### Added

#### Radio Screensaver Background
- **New Settings Section**: "🎬 Radio Screensaver" in Settings panel
- **Slideshow Mode**: Random HD images from picsum.photos with transition effects
- **Matrix Rain Mode**: Digital rain effect matching app theme colors
- **Idle Detection**: Matrix rain auto-activates after 2 minutes of inactivity
- **Clock Display**: Optional clock overlay on radio panel

#### Screensaver Settings
- **Enable/Disable Toggle**: Turn screensaver on/off
- **Background Mode**: Choose between Slideshow, Matrix Rain, or None
- **Opacity Slider**: Adjust transparency (10-100%, default 30%)
- **Slide Interval**: Time between slides (5-60 seconds)
- **Transition Effects**: Fade, Slide, Zoom, Blur, or Random
- **Matrix on Idle**: Toggle auto-Matrix rain after inactivity
- **Idle Timeout**: Customize inactivity timeout (30-600 seconds)
- **Show Clock**: Toggle clock display on radio panel

#### RangerSmyth Easter Egg
- **Play Button Overlay**: rangersmyth-pic.png appears on play button after 5 seconds of inactivity
- **Hover to Dismiss**: Image hides when hovering over the button
- **Both Views**: Works in minimized and expanded radio views

### Technical
- New `ScreensaverBackground` component with Canvas and CSS animations
- `RadioSettings` interface extended with 8 new screensaver properties
- Theme-aware Matrix rain colors (green, cyan, blue, amber)
- Preloaded images with fallback gradient
- Z-index stacking ensures screensaver stays behind controls

---

## [1.8.0] - 2025-12-05 - "Ranger Radio + Podcasts" 📻🎙️

### Added

#### Ranger Podcasts 🎙️
- **Podcast Mode Toggle**: Switch between 📻 Radio and 🎙️ Podcasts with mode toggle buttons
- **10 Curated Podcast Feeds**:
  - 🔒 **Security**: Darknet Diaries, Security Now, Risky Business, Malicious Life
  - 💻 **Coding**: Syntax.fm, The Changelog, CodeNewbie, Software Engineering Daily
  - 🎤 **Interviews**: Lex Fridman Podcast
  - 🔓 **Hacking**: Hacker Public Radio
- **Episode Browser**: Browse up to 20 recent episodes per podcast with title, date, and duration
- **Playback Speed Control**: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x speed options
- **Seek Bar**: Scrub through podcast episodes with time display
- **Progress Tracking**: Current time and total duration shown for podcasts
- **CORS Proxy**: Uses allorigins.win to fetch RSS feeds from browser
- **Theme-Aware Styling**: Podcast UI matches all 4 themes (Classic, Matrix, Tron, Retro)

#### Ranger Radio Integration
- **📻 Radio Button**: New radio button in header to toggle Ranger Radio on/off
- **22+ SomaFM Stations**: Curated stations organized by genre:
  - 🎧 **Ambient/Focus**: Groove Salad, Drone Zone, Deep Space One, Space Station, Mission Control
  - 💻 **Electronic/Coding**: DEF CON Radio, Beat Blender, cliqhop idm, The Trip, Dubstep Beyond
  - 🎷 **Lounge/Chill**: Lush, Secret Agent, Bossa Beyond
  - 🎸 **Rock/Alternative**: Indie Pop Rocks!, Underground 80s
  - 🤘 **Metal**: Metal Detector
  - 🎺 **Jazz/Soul**: Sonic Universe, Seven Inch Soul
  - 🌍 **World**: ThistleRadio, Heavyweight Reggae
  - 🎄 **Holiday**: Christmas Lounge, Christmas Rocks!

#### Radio UI
- **Minimized Mode**: Slim bar with inline controls (⏮ ▶ ⏭), station name, volume slider, expand/close buttons
- **Expanded Mode**: Full controls with large play button, station description, genre selector dropdown
- **Audio Visualizer**: Real-time frequency bars using Web Audio API - gradient-colored bars pulse to the beat
- **Theme-Aware**: Radio bar styling matches all 4 themes (Classic, Matrix, Tron, Retro)
- **Positioned Above Chat Input**: Radio sits in the chat flow, never covers the message input

#### Radio Controls
- **Play/Pause**: Large play button with glow animation when playing
- **Previous/Next**: Skip through stations
- **Volume Slider**: Adjust volume with visual feedback
- **Station Selector**: Dropdown organized by genre with optgroups
- **Minimize/Expand**: Toggle between compact and full views
- **Close Button**: Stop radio and hide the player

### Changed

#### Header Improvements
- **Removed Peer Count**: Cleaned up header by removing "X online" display
- **Compact Buttons**: Header buttons reduced to 32px for better fit
- **No Overflow**: Buttons use `flex-shrink: 0` so Settings button is always visible
- **Responsive Title**: App title truncates gracefully on narrow windows

### Technical
- **Web Audio API**: AudioContext, AnalyserNode, getByteFrequencyData for visualizer
- **Canvas Rendering**: 32-bar frequency visualizer with gradient colors
- **CORS Handling**: Electron session.webRequest adds User-Agent and Referer headers for SomaFM streams
- **Settings Persistence**: Radio settings (enabled, volume, last station, minimized) saved to localStorage
- **crossOrigin="anonymous"**: Audio element configured for Web Audio API access

### Accessibility (Planned for Phase 3)
- Large touch targets (48px minimum) per WCAG 2.1 AA
- ARIA labels for screen readers
- Keyboard navigation (Space=Play, M=Mute, arrows=Volume/Station)
- High contrast mode support
- Voice commands ("Ranger, play radio")

### Coming in Phase 3
- Podcast progress persistence (resume where you left off)
- Custom podcast feed adding
- Podcast favorites/bookmarks
- Offline podcast downloads

---

## [1.7.6] - 2025-12-04 - "Custom Login Picture"

### Added

#### Login Picture Customization
- **New Settings Section**: "Login Picture" in Settings panel
- **Three Options**:
  - **Eagle (Default)**: Classic eagle emoji logo
  - **RangerSmyth**: David's personal rangersmyth-pic.png picture
  - **Upload Custom**: Upload any image, auto-resized to 128x128
- **Live Preview**: See selected picture in Settings before applying
- **Reset Button**: One-click reset to default eagle

### Technical
- `loginPicture` state stored in localStorage
- Image upload uses Canvas API for 128x128 resize
- Square crop maintains aspect ratio
- Base64 encoding for custom images
- Circular border styling with accent color

---

## [1.7.5] - 2025-12-04 - "One-Click Updates"

### Added

#### In-App Update System
- **Update Now Button**: One-click update directly from Settings
- **Check for Updates Button**: Manual update check in About section
- **Progress Indicator**: Animated spinner shows update progress
- **Status Messages**: Clear feedback for success/error states
- **Auto-Reload**: App reloads automatically after successful update

### Technical
- `app:runUpdate` IPC handler runs `git pull` + `npm install`
- `app:reload` IPC handler reloads the Electron window
- Frontend shows update progress states
- Graceful error handling with user feedback
- Replaces manual terminal commands

---

## [1.7.4] - 2025-12-04 - "Audio Device Selection"

### Added

#### Speaker/Output Device Selection
- **New Settings Section**: "🔊 Speaker Settings" in Settings panel
- **Device Selection**: Dropdown shows all available audio output devices (speakers, headphones, monitors)
- **Refresh Button**: 🔄 button to rescan for new audio output devices
- **Device Count**: Shows number of available speakers
- **Cross-Platform**: Works on macOS, Windows, and Linux
- Selected speaker is used for voice call audio playback

### Technical
- `audioOutputDevices` state stores available output devices
- `selectedSpeakerId` state persists speaker choice
- `selectedSpeakerRef` ref for accessing speaker ID in callbacks
- `initAudioContext()` now supports `setSinkId()` for output device routing
- `loadAudioDevices()` enumerates both input AND output devices
- `playAudio()` routes audio to selected speaker via AudioContext sinkId
- Fixes cross-machine audio issues where wrong output device was selected

---

## [1.7.3] - 2025-12-04 - "Quick Call & Mic Settings"

### Added

#### Quick Call Button in Chat
- **Call Icon in Messages**: Small 📞 button appears when hovering over other users' messages
- Click to instantly call that user (no need to type `/call username`)
- Button hidden on your own messages and system messages
- Smooth hover animation with indigo gradient styling

#### Microphone Settings
- **New Settings Section**: "🎤 Microphone Settings" in Settings panel
- **Device Selection**: Dropdown shows all available microphones
- **Refresh Button**: 🔄 button to rescan for new audio devices
- **Device Count**: Shows number of available microphones
- **Cross-Platform**: Works on macOS, Windows, and Linux
- Selected microphone is used for voice calls

### Technical
- `loadAudioDevices()` function enumerates audio input devices
- `selectedMicId` state persists microphone choice
- `getUserMedia()` uses selected deviceId constraint
- Professional dropdown styling with custom SVG arrow
- Refresh button rotates 180° on hover

---

## [1.7.2] - 2025-12-04 - "Audio Fixed"

### Fixed

#### Cross-Machine Audio Playback
- **Sample Rate Mismatch Bug**: Fixed audio not playing correctly between machines with different sample rates
  - Sender now includes their AudioContext sample rate in voice data
  - Receiver creates playback buffer with original sample rate
  - Fixes pitch/timing issues when Mac (48000Hz) talks to Windows (44100Hz)

- **Volume Too Quiet**: Added GainNode with 4x volume boost
  - Audio was being received and decoded correctly but too quiet to hear
  - Now amplifies incoming voice 4x for clear audibility

### Technical
- Voice data now includes `sampleRate` field (e.g., 48000, 44100)
- `playAudio()` function accepts optional `sourceSampleRate` parameter
- GainNode inserted between buffer source and destination
- Enhanced logging shows sample rate info for debugging

---

## [1.7.1] - 2025-12-04 - "Voice Calls Polished"

### Fixed

#### Critical Bug Fixes
- **Call State Closure Bug**: Fixed caller staying stuck on "Calling..." after callee answers
  - Added `callStateRef` to track current state in WebSocket handler
  - React closure was capturing stale state values
- **Audio Not Sending Bug**: Fixed voice not transmitting when Push-to-Talk pressed
  - Added `isTalkingRef` and `callPartnerRef` for audio processor callback
  - Same closure issue in `onaudioprocess` handler

### Changed

#### Professional UI Redesign
- **Call Button (Header)**:
  - Deep indigo gradient with animated shine effect
  - Glows and scales up on hover
  - Green pulse animation when in active call

- **Call Modal (Peer List)**:
  - Glassmorphism effect with gradient border glow
  - Subtle blue ambient glow behind modal
  - Floating phone icon animation in header

- **Peer Avatars**:
  - Dynamic color gradients (indigo, teal, red, purple, orange)
  - Shows user's first letter instead of generic icon
  - Online indicator with pulsing green glow

- **Call Buttons**:
  - Shimmer effect sweeps across on hover
  - Uppercase text with letter spacing
  - Spring bounce animation on click

- **In-Call Bar**:
  - Animated gradient background (subtle movement)
  - Highlight line at top for depth
  - Professional cohesive look

- **Push-to-Talk Button**:
  - Indigo gradient matching app theme
  - Ripple effect radiates from center on hover
  - Dramatic green pulse animation when talking
  - Uppercase "PUSH TO TALK" styling

### Technical
- Added refs for all state used in callbacks: `callStateRef`, `isTalkingRef`, `callPartnerRef`
- `useEffect` hooks keep refs in sync with state
- Fixes React's stale closure problem in event handlers

---

## [1.7.0] - 2025-12-04 - "Voice Calls"

### Added

#### 1-to-1 Voice Calls
- **Voice Call System**: Make private voice calls to any online peer
- **Call UI**: Phone button in header opens peer list dropdown
- **Incoming Calls**: Animated banner with Answer/Reject buttons
- **In-Call Controls**: Push-to-talk, mute, hang up
- **Audio Level Meter**: Visual indicator when talking
- **Call States**: idle, calling, ringing, in_call

#### Chat Commands
- `/call username` - Call a user by name (e.g., `/call Ranger`)
- `/hangup` or `/end` - Hang up current call
- `/peers` or `/online` - List online users with voice capability

#### Push-to-Talk
- Hold "Push to Talk" button to transmit voice
- Release to stop transmitting
- Visual feedback when talking (green pulse animation)
- Audio level bar shows voice intensity

#### Polished UI
- **Incoming Call Banner**: Animated shimmer gradient, ringing phone icon
- **Calling Bar**: Orange gradient with bouncing dots animation
- **In-Call Bar**: Blue gradient with connected icon pulse
- **Peer Dropdown**: Smooth animations, avatar circles, hover effects
- **Buttons**: Gradient backgrounds, shadows, hover transforms

#### Call Notifications
- Ring sound on incoming calls
- System messages for call events
- Status bar shows current call state

### Technical
- Web Audio API for microphone capture and playback
- Audio data encoded as Int16 PCM, sent as base64 over WebSocket
- Echo cancellation and noise suppression enabled
- Same relay server (44.222.101.125:5555) - compatible with voice-chat.cjs
- Theme-aware styling (Matrix green, Tron cyan)

### Note
- Group voice NOT included (text chat only in group)
- Private 1-to-1 calls only as requested

---

## [1.6.1] - 2025-12-04 - "Admin Detection"

### Added

#### Admin Recognition System
- **Admin Registry Check**: App now reads `~/.claude/ranger/admin/data/users.json` on startup
- **Role Detection**: Detects Supreme Admin, Admin, Moderator, and standard User roles
- **Chat Header Badge**: Animated admin badge appears in chat header
  - 👑 Gold crown for Supreme Admin (with pulse animation)
  - 🛡️ Shield for Admin
  - ⚔️ Sword for Moderator
- **Settings Identity Section**: New "Admin Status" box shows your role and permissions

#### IPC Handlers
- `admin:getStatus` - Check current user's admin status
- `admin:checkUserId` - Check any userId's admin status
- `admin:getRegistryPath` - Get admin registry file path

### Technical
- Admin registry path: `~/.claude/ranger/admin/data/users.json`
- Checks userId from identity against admin registry
- Returns: `isAdmin`, `isSupreme`, `isModerator`, `role`, `adminUsername`

---

## [1.6.0] - 2025-12-04 - "Blockchain Ledger + Smart Contracts"

### Summary
Major release combining Blockchain Ledger (immutable message storage with PoW mining) and Smart Contracts browser (7 contracts including communication protocols). Built by M3Pro + MSI collaboration!

---

### Part 1: Blockchain Ledger (MSI Implementation)

#### Blockchain Ledger Service (rangerblock/lib/ledger-service.cjs)
- **Persistent Blockchain**: All messages stored in blocks on disk
- **Proof of Work Mining**: Blocks mined with configurable difficulty
- **Merkle Trees**: Transaction verification with cryptographic proofs
- **Auto-Mining**: Mines every 10 messages or 5 minutes
- **Message Indexing**: Fast lookup by content hash, user, or channel

#### Ledger Storage Structure
- ~/.rangerblock/ledger/chain.json - Blockchain state
- ~/.rangerblock/ledger/blocks/ - Individual block files
- ~/.rangerblock/ledger/pending.json - Pending transactions
- ~/.rangerblock/ledger/wallets.json - Wallet balances (future)
- ~/.rangerblock/ledger/index/ - Quick lookup indexes

#### Transaction Types
- chat_message - Chat messages with content hash
- identity_register - New user registrations
- channel_join / channel_leave - Channel events
- token_transfer / token_mint / reward - Wallet-ready (future)

#### New IPC Handlers (14 total)
- ledger:init - Initialize the ledger
- ledger:getStatus - Chain height, pending count, stats
- ledger:addMessage - Record a message to ledger
- ledger:getBlocks - Get blocks (paginated)
- ledger:getBlock - Get specific block by index
- ledger:getMessagesByChannel - Query messages by channel
- ledger:getTransactionsByUser - Query transactions by user
- ledger:verifyMessage - Verify message exists in chain
- ledger:mineBlock - Manually trigger mining
- ledger:exportChain - Export full blockchain
- ledger:exportUserAudit - Export user's transaction history
- ledger:getBalance - Get wallet balance (future)
- ledger:addReward - Add reward to wallet (future)

#### Technical
- Genesis block created on first run (Dec 4, 2025)
- SHA-256 hashing for blocks and transactions
- Merkle root for efficient transaction verification
- Block structure: index, hash, previousHash, merkleRoot, nonce, transactions
- Configurable mining: difficulty=2, maxTxPerBlock=10, interval=5min

#### Wallet-Ready Architecture
- Balance tracking infrastructure in place
- Reward transaction type supported
- Ready for future token implementation
- Per-user wallet state persistence

---

### Part 2: Smart Contracts Browser (M3Pro Implementation)

#### Smart Contracts Section in Settings
- **New Settings Tab**: "📜 Smart Contracts" section with interactive contract browser
- **Chain Selector**: Toggle between Solana (◎) and Ethereum (⟠) views
- **Contract Cards**: Visual grid showing all available contracts
- **Contract Details Modal**: Click any contract to see full details

#### Available Contracts (7 Total)
| Contract | Category | Description |
|----------|----------|-------------|
| **RangerRegistration** | Registration | User registration + consent tracking |
| **RangerBridge** | Bridge | Cross-chain crypto conversion |
| **RangerFileTransfer** | Transfer | Formal file transfer agreements |
| **RangerToken** | Token | SPL Token with daily limits (Solana only) |
| **RangerTextChat** | Communication | COMING SOON: WHISPER Protocol |
| **RangerVoiceChat** | Communication | COMING SOON: ECHO Protocol |
| **RangerVideoChat** | Communication | COMING SOON: VISION Protocol |

#### Features
- **Contract Selection**: Select contracts for your session
- **Deploy Links**: Quick links to Solana Playground and Remix IDE
- **Feature Lists**: See all features for each contract
- **File Paths**: Shows contract file locations
- **Status Badges**: Available / Deployed / Selected indicators

#### Visual Polish
- Color-coded category badges (registration=blue, bridge=green, transfer=amber, token=purple, communication=pink)
- Chain icons with Solana purple and Ethereum blue
- Theme-aware styling (Matrix green glow, Tron cyan glow)
- Smooth modal animations

#### Technical
- New React state for contract management
- Contracts filtered by selected chain
- Modal overlay with click-outside-to-close
- Links to deployment IDEs open in new tab

---

## [1.5.0] - 2025-12-04 - "Blockchain Ledger"

*Note: This version was superseded by v1.6.0 which merged M3Pro and MSI implementations*

---

## [1.4.1] - 2025-12-04 - "Identity Bug Fix"

### Fixed
- **Critical Bug**: Fixed `ERR_INVALID_ARG_TYPE` crash on startup
  - `this.identityFile` was undefined (property never declared)
  - Affected methods: `recordMessage()`, `getOrCreateIdentity()`, `resetIdentity()`
  - Changed to use `this.legacyIdentityFile` and `this.sharedIdentityFile`
- RangerBot can now receive messages without crashing the app

---

## [1.4.0] - 2025-12-03 - "Security Foundation"

### Added

#### RangerBlock Security Library Integration
- **Shared Identity System**: Now uses unified identity from `~/.rangerblock/`
- **Hardware-Bound Identity**: Device fingerprint prevents identity theft
- **RSA-2048 Key Pairs**: Ready for message signing and encryption
- **Cross-App Sync**: Identity syncs with RangerPlex when installed

#### New Security Modules (rangerblock/lib/)
- `hardware-id.cjs` - Cross-platform hardware fingerprinting
- `crypto-utils.cjs` - RSA-2048 + AES-256-GCM encryption
- `storage-utils.cjs` - Shared storage (`~/.rangerblock/`)
- `identity-service.cjs` - Unified identity management

### Technical
- Identity now stored in `~/.rangerblock/identity/master_identity.json`
- RSA keys stored in `~/.rangerblock/keys/`
- App-specific settings in `~/.rangerblock/apps/ranger-chat-lite/`
- Supports on-chain identity registration (future feature)

### Coming Soon
- Challenge-response authentication with server
- Message signing for verified sender identity
- Encrypted private messages
- RangerPlex auto-sync on install

---

## [1.3.1] - 2025-12-03 - "Update Notifications"

### Added
- **Update Checker**: App checks GitHub for new versions on startup
- **Update Banner**: Animated banner appears when update is available
- **Update Instructions**: Settings page shows git pull commands
- **Version Display**: Shows current version (v1.3.1) dynamically
- **Theme-aware**: Update banner matches current theme colors

### Technical
- Fetches package.json from GitHub raw to compare versions
- Semantic version comparison (major.minor.patch)
- Auto-check every 30 minutes
- Dismissible banner with ✕ button

---

## [1.3.0] - 2025-12-03 - "Easy Distribution"

### Added

#### Cross-Platform Build System
- **Windows**: NSIS installer (.exe) and portable version (.zip)
- **macOS**: DMG installer for Intel (x64) and Apple Silicon (arm64)
- **Linux**: AppImage and Debian (.deb) packages
- Pre-built binaries available on GitHub Releases

#### GitHub Actions Workflow
- Automatic builds triggered by version tags (`ranger-chat-lite-v*`)
- Builds in parallel on Windows, macOS, and Linux runners
- Auto-creates GitHub Release with all platform binaries
- Release notes template with download table

#### One-Click Install Scripts
- **PowerShell (Windows)**: `irm .../install.ps1 | iex`
- **Bash (macOS/Linux)**: `curl -fsSL .../install.sh | bash`
- ASCII art banner and colored output
- Auto-detects platform and architecture
- Downloads latest release from GitHub

### Changed
- Package.json now includes full electron-builder configuration
- New build scripts: `build:win`, `build:mac`, `build:linux`, `build:all`
- Release artifacts output to `release/` folder
- Updated README with Quick Install section and download links

### Technical
- electron-builder configured for all platforms
- GitHub publish provider for auto-releases
- Custom artifact naming: `${productName}-${version}-${platform}-${arch}.${ext}`

---

## [1.2.0] - 2025-12-02 - "Blockchain Transactions"

### Added
- **Blockchain Transaction Log**: Track all messages as transactions
- **Transaction Stats**: Sent/received/total/bytes counters
- **Live Transaction Feed**: See messages flowing in real-time
- **Theme-aware**: Matrix/Tron themes with glow effects

---

## [1.1.0] - 2025-11-30 - "Emoji & Themes"

### Added
- **Emoji Picker**: 8 categories with search
- **4 Themes**: Classic, Matrix, Tron, Retro
- **Message Search**: Find messages by content or sender
- **Auto-reconnect**: Exponential backoff

---

## [1.0.0] - 2025-11-29 - "Initial Release"

### Added
- Basic chat functionality
- WebSocket connection to relay server
- Username selection
- Peer count display

---

*Rangers lead the way!*

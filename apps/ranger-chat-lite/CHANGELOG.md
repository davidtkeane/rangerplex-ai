# RangerChat Lite - Changelog

All notable changes to RangerChat Lite will be documented in this file.

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

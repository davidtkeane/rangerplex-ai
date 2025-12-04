# RangerChat Lite - Changelog

All notable changes to RangerChat Lite will be documented in this file.

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
- Desktop entry created for Linux (application menu integration)

---

## [1.2.1] - 2025-12-03 - "Blockchain Viewer"

### Added

#### Live Blockchain Transaction Viewer
- **Transaction Feed**: See all network messages in real-time
- **Stats Dashboard**: Track sent/received/total messages and data size
- **Cyberpunk UI**: Cool animated transaction cards with color-coded types
- **Theme Integration**: Matrix/Tron themes have special transaction styling

#### Transaction Features
- Unique transaction IDs (hex format like `0x19384abc...`)
- Direction indicators (📥 incoming, 📤 outgoing)
- Status badges (confirmed/broadcast/pending)
- From/To routing display
- Payload preview (first 100 chars)
- Size in bytes and timestamp

### Technical
- Transaction logging on all WebSocket events
- Keeps last 100 transactions in memory
- Slide-in animation for new transactions
- Color-coded borders: green (in), red (out), yellow (system), blue (peer)

---

## [1.2.0] - 2025-12-03 - "Identity & Security"

### Added

#### Device-Bound Identity System
- **Persistent User Identity**: Each device gets a unique `userId` based on hardware fingerprint
- **Persistent Node ID**: `nodeId` survives app restarts (no more random IDs per session!)
- **Cross-platform hardware detection**: Works on Windows, Mac, and Linux
- **RangerPlex Compatible**: Creates `.personal` folder with `node_identity.json` for RangerPlex browser sync
- **RSA Keypair Generation**: Chat keys generated for future message signing

#### Fun Username Generator
- Click 🎲 to generate fun random names (e.g., "CosmicPhoenix42", "QuantumNinja88")
- 32 adjectives + 31 nouns = 900+ unique combinations
- Animated dice roll effect on button hover
- Username field starts blank - encourages choosing a name

#### Settings Page
- **Profile Section**: Change display name anytime with 🎲 random generator
- **Identity Section**: View your unique User ID, Node ID, device info, creation date
- **Theme Section**: Visual theme grid to pick themes (not just cycle)
- **Storage Section**: See where identity files are stored
- **About Section**: App info with mission statement

#### Moderation Support
- `userId` is now sent with every chat message for admin tracking
- Even if users change display names, admins can identify by device
- Foundation for ban/warn/timeout features

### Changed
- Login screen now starts with blank username (was "RangerUser")
- "Choose Your Name" label instead of just "Username"
- Added "Click 🎲 for a fun random name!" hint text
- Identity badge shows when returning user (saved identity detected)
- Settings button in chat header (⚙️)
- Connect button disabled when username is empty

### Technical
- New `identityService.ts` in Electron main process
- IPC handlers for identity operations (load, save, generate, etc.)
- Updated preload.ts to expose `window.electronAPI.identity`
- Cross-platform UUID detection (Windows WMIC, Mac system_profiler, Linux machine-id)
- SHA-256 hardware fingerprinting
- Electron userData folder for persistence

---

## [1.1.3] - 2025-12-03 - "Message Fix"

### Fixed
- Fixed contextBridge error in preload script (was breaking console)
- Added handler for `peerListUpdate` message type (peer count updates)
- Added handler for `chat` payload type (receiving messages from other clients)
- Added handler for `broadcastSent` confirmation (no longer logs as unknown)
- Messages now properly send and receive!

---

## [1.1.2] - 2025-12-03 - "Neat Header"

### Changed
- Replaced 4 theme buttons with single cycle button
- Click theme button to cycle: Classic -> Matrix -> Tron -> Retro -> Classic...
- Header now has just 2 buttons: Search (🔍) and Theme (💬/🟢/🔵/💾)
- Cleaner, more minimal header design

---

## [1.1.1] - 2025-12-03 - "Clean Login"

### Changed
- Removed theme selector from login screen for cleaner UI
- Theme buttons now only appear in chat header after login
- Login screen is now more compact and focused

---

## [1.1.0] - 2025-12-03 - "Style & Expression"

### Added

#### Emoji Picker
- Full emoji picker with 180+ emojis across 9 categories
- Categories: Frequent, Smileys, Gestures, Hearts, Animals, Food, Activities, Travel, Symbols
- Search functionality to find emojis quickly
- Click emoji button or use picker to insert emojis into messages
- Hover animations on emoji buttons

#### Message Search
- Search bar to find messages by content or sender name
- Toggle search with magnifying glass button in header
- Real-time filtering as you type
- Shows count of matching messages
- Close button to clear search and hide bar

#### Theme System (4 Themes!)
- **Classic** - MSN Messenger inspired blue theme (default)
- **Matrix** - Green on black with scanline effect and text glow
- **Tron** - Cyan neon glow effects on dark background
- **Retro** - 90s Windows 3D button styling
- Theme selector on login screen
- Quick theme switcher in chat header
- Themes saved to localStorage (persists across sessions)

#### Auto-scroll
- Chat automatically scrolls to newest messages
- Smooth scroll animation

#### UI Improvements
- Complete redesign with MSN Messenger inspiration
- Header bar with app icon, title, and peer count badge
- Messages show sender name and timestamp
- Own messages display as "You" instead of username
- Message animation on arrival
- Gradient backgrounds on login screen
- Hover effects on all interactive elements

### Changed
- Removed custom title bar (using native Electron menu bar now)
- New login card design with better spacing
- Input fields have focus states with accent color
- Send button has hover lift effect
- Dark theme by default (Classic theme)

### Technical
- CSS variables for easy theming
- Theme-specific effects (Matrix scanlines, Tron glow, Retro 3D borders)
- Responsive emoji grid (8 columns desktop, 6 mobile)
- Proper flexbox layout with min-height: 0 for scrolling
- localStorage for theme persistence

---

## [1.0.1] - 2025-12-03 - "Menu Bar"

### Added
- Native Electron menu bar with 5 menus:
  - **File**: New Connection, Settings, Quit
  - **Edit**: Undo, Redo, Cut, Copy, Paste, Select All
  - **View**: Reload, Force Reload, Zoom controls, Fullscreen
  - **Developer**: Toggle DevTools, View Console, Inspect Element, Clear Cache
  - **Help**: About, RangerPlex Website, Report Issue
- Keyboard shortcuts for common actions (Ctrl+Shift+I for DevTools)

### Changed
- Switched from frameless to native frame for menu bar visibility
- Window size increased to 450x650
- Dark background color (#1a1a2e)

---

## [1.0.0] - 2025-12-03 - "Initial Release"

### Added
- Basic WebSocket chat functionality
- Connection to RangerPlex blockchain network
- Username and server URL configuration
- Real-time message sending and receiving
- Peer count tracking
- System messages for connection events
- Custom frameless window (removed in 1.0.1)
- Retro-inspired UI design

### Technical
- Built with Electron 29, React 18, Vite 5, TypeScript 5
- WebSocket protocol for real-time communication
- Node ID generation for unique client identification

---

## Version Summary

| Version | Date | Highlights |
|---------|------|------------|
| 1.4.1 | 2025-12-04 | Critical bug fix - identity service undefined property crash |
| 1.4.0 | 2025-12-03 | Security foundation - shared identity, RSA keys, cross-app sync |
| 1.3.1 | 2025-12-03 | Update notifications - checks GitHub for new versions |
| 1.3.0 | 2025-12-03 | Easy distribution - GitHub releases, install scripts |
| 1.2.1 | 2025-12-03 | Live blockchain transaction viewer with cyberpunk UI |
| 1.2.0 | 2025-12-03 | Device-bound identity, random name generator, settings page |
| 1.1.3 | 2025-12-03 | Fixed messaging - send/receive now works! |
| 1.1.2 | 2025-12-03 | Single theme cycle button for cleaner header |
| 1.1.1 | 2025-12-03 | Cleaner login screen, theme buttons moved to chat header |
| 1.1.0 | 2025-12-03 | Emoji picker, message search, 4 themes (Classic/Matrix/Tron/Retro) |
| 1.0.1 | 2025-12-03 | Native menu bar with Developer tools |
| 1.0.0 | 2025-12-03 | Initial release with basic chat |

---

## Upcoming Features

See `FUTURE_PLAN.md` for the complete roadmap.

**Next priorities (v1.4.0 - Social Features):**
- Private/Direct messaging
- User avatars
- Message reactions
- Typing indicators

---

*RangerChat Lite - Lightweight chat for the RangerPlex network*

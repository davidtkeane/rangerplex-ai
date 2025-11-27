# 🚀 RangerPlex Changelog

All notable changes to the **RangerPlex Browser** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.6.5] - 2025-11-27 🎖️ RANGERBLOCK BLOCKCHAIN INTEGRATION

### ✨ Added
- **🎖️ RangerBlock P2P Blockchain**: Fully integrated peer-to-peer blockchain network!
  - **Auto-Start**: Blockchain node starts automatically with RangerPlex (when enabled)
  - **Hardware Detection**: Automatically identifies node by Mac hardware UUID (Genesis security system)
  - **Network Modes**:
    - 🏠 **Local Only**: Connects to devices on your WiFi/LAN
    - 🌐 **Local + Global**: Connects both locally AND globally via relay server
    - 🌍 **Global Only**: Cross-network communication via relay server
  - **Settings Tab**: Complete RangerBlock configuration in Settings
    - Enable/Disable toggle
    - Network mode selector
    - Port configuration (default: 5000)
    - Relay server URL input
    - Auto-start toggle
    - Real-time status panel (running/stopped + hardware info)
  - **Node Management**: Start/Stop/Restart blockchain node from UI
  - **Dashboard Access**: Direct link to blockchain node dashboard (http://localhost:5000)
  - **Secure Identification**: Each node identified by unique hardware UUID
  - **Graceful Shutdown**: Node stops cleanly when RangerPlex closes

### 🔧 Backend
- **blockchainService.cjs**: Complete node lifecycle management
- **hardwareDetection.cjs**: Mac hardware UUID detection (M1/M2/M3/M4)
- **RangerBlockNode.cjs**: Full P2P blockchain node with WebSocket networking
- **relay-server.cjs**: Discovery server for cross-network nodes
- **API Endpoints**:
  - `GET /api/rangerblock/status` - Node status
  - `POST /api/rangerblock/start` - Start node
  - `POST /api/rangerblock/stop` - Stop node
  - `POST /api/rangerblock/restart` - Restart node
  - `POST /api/rangerblock/config` - Update config
  - `GET /api/rangerblock/config` - Get config
- **Database Integration**: Settings saved to SQLite database

### 🎯 Next Steps
- Group chat functionality (coming soon!)
- Relay server deployment guide
- Multi-machine blockchain testing

---

## [2.6.4] - 2025-11-27
### ✨ Added
- **Browser Tab in Sidebar**: Quick access button to open a new browser tab directly from the sidebar.
- **Open Links in App**: New setting (Settings -> General -> Browser) to open external links (like WordPress Admin) in a RangerPlex tab instead of the default system browser.
- **WordPress Dashboard**: Added "New Browser Tab" button for seamless multitasking.
- **Multi-Site WordPress**: You can now run up to **3 independent WordPress sites** locally (Ports 8081, 8082, 8083).
- **Delete / Reinstall**: Added a dedicated button to wipe a WordPress site's data for a fresh start.
- **Log Cleanup**: Terminal output is now cleaner, hiding verbose "Skipping..." messages during site scanning.

### 🛠️ Installer Improvements (v2.5.32)
- **Docker Installation**: Automated installer now includes Docker Desktop setup
  - Updated download URL to https://www.docker.com/get-started/
  - Clear documentation that Docker Desktop includes ALL CLI tools (Engine, CLI, Compose)
  - Added Docker Desktop to API Dashboard Links section (🐳 Development Tools)
  - Platform-specific instructions for Mac (M1/M2/M3/M4), Windows, and WSL
  - Emphasized Docker is HIGHLY RECOMMENDED for WordPress hosting
  - Auto-opens download page in browser during installation

## [2.6.2] - 2025-11-27
### Fixed
- **Browser Launch**: Resolved issue where `npm run browser` opened a Chrome tab instead of the app.
- **White Screen**: Fixed "white screen of death" by ensuring server connection uses `127.0.0.1` instead of `localhost`.
- **Process Cleanup**: Closing the Electron app now correctly terminates the terminal process and all child servers.
- **DevTools Access**: Added a native "View" menu with "Toggle Developer Tools" option.

## [2.6.1] - 2025-11-27 🐳 PROJECT PRESS FORGE: ONLINE

### 🎉 Major Features
**WordPress Integration Complete**: RangerPlex can now manage local WordPress instances via Docker!

### ✨ Added
- **WordPress Dashboard**: Full control center for local WordPress management.
  - **Docker Control**: Start, Stop, and **Uninstall/Reset** containers directly from the UI.
  - **Auto-Start**: Dashboard automatically starts Docker if needed.
  - **Native Integration**: `/wordpress` command opens dashboard; "Open Admin" launches site in a native RangerPlex tab.
  - **Sidebar Access**: New "WP" button for quick access.
- **Browser Launch Modes**: Enhanced `npm run browser` with flexible flags:
  - `npm run browser` (Default): Opens Electron App only.
  - `npm run browser -- -b`: Opens **Both** App and a browser tab.
  - `npm run browser -- -t`: Opens **Tab** only.

### 🔧 Fixed
- **Docker Port Conflict**: Moved WordPress to port **8081** to avoid conflicts.
- **Electron API**: Fixed critical "Electron API unavailable" error by correcting preload script path (`.js` -> `.cjs`).
- **Path Issues**: Fixed `docker-compose` not found error on macOS by explicitly adding `/opt/homebrew/bin` to PATH in Electron.
- **Browser Recursion**: Fixed "Window inside Window" bug in `BrowserLayout.tsx`.

---

## [2.6.0] - 2025-11-26 ⚫ DEATH STAR OPERATIONAL

### 🎉 Major Features
We now have a **fully functional RangerOS Browser Version 2.0**!

### ✨ Added
- **⚫ Death Star Easter Egg**: Type `/deathstar` in chat for epic celebration with timestamp!
  - CSS-created Death Star with pulsing superlaser
  - Commander David Keane nameplate
  - Mission status display (Phantom Persistence, Monaco Editor, Terminal)
  - Real-time timestamp on activation
- **🖥️ Monaco Editor Integration**: Complete VS Code editor embedded in browser
  - File tree navigation with expandable folders
  - Multi-tab editing with unsaved indicators
  - Syntax highlighting for 50+ languages
  - Auto-save with 2-second debounce
  - **Full IndexedDB persistence** - files survive page refresh!
- **👻 Phantom Persistence Architecture**: Proprietary system for PRO feature
  - Terminal state schemas (based on RangerOS v3.0)
  - Restaurant Memory schemas (Seamus's system)
  - Complete implementation documentation
  - Privacy-protected (NOT on GitHub - business strategy)
- **🎨 AI Code Assistant**: Floating button in Monaco Editor
  - Draggable vertically with localStorage position memory
  - Quick actions: Explain, Improve, Fix, Document
  - Creates dedicated "🤖 Code Assistant" chat session
  - Auto-sends code context to AI
- **📚 Documentation Suite**:
  - `PERSISTENCE_QUICK_GUIDE.md` - Implementation reference
  - `GIT_WORKFLOW_GUIDE.md` - Git commands for all skill levels
  - `PHANTOM_BUSINESS_STRATEGY.md` - PRO feature monetization plan
  - `PHANTOM_PROTECTION_STATUS.md` - Security verification

### 🔧 Changed
- **Version Bump**: `package.json` updated to `2.6.0`
- **Editor Layout**: Complete rewrite with full persistence
- **Terminal**: Backend running on `ws://localhost:3010/terminal`
- **Storage**: Dual-layer (Browser: localStorage+IndexedDB, Future: Electron SQLite)

### 🛡️ Security
- **Phantom Persistence**: Fully protected from GitHub with .gitignore
- **Private Vault**: `./data/vault/` blocked from public repo
- **Business Strategy**: Proprietary technology for iCanHelp Ltd funding

### 💰 Business Model
- **Free Version**: Basic editor, terminal, chat (no persistence)
- **PRO Version**: Phantom Persistence, Restaurant Memory, unlimited history
- **Mission**: Fund iCanHelp Ltd to help 1.3 billion disabled people

### 🎯 Mission Status
- ✅ Browser infrastructure deployed
- ✅ Monaco Editor operational with full persistence
- ✅ Terminal system ready
- ⏳ Phantom Persistence: Implementation ready (1.5 hours to complete)
- ⏳ Seamus Memory Manager: Planned for Phase 2

**Rangers Lead The Way!** 🎖️🍀

---

## [2.6.0] - 2025-11-26
### Added
- **Code Editor Polish**: Auto-save (localStorage), Settings button, Terminal toggle, and Neon UI refresh.
- **Project IRON FORGE**: Plan for full VS Code integration (`code-server`).
- **Project PRESS FORGE**: Plan for local WordPress management.

### Fixed
- **Browser Mode**: Resolved Electron launch issues by migrating to `.cjs`.

## [2.5.37] - 2025-11-26 (Project PHANTOM WING)

### 🌟 The Browser Evolution
We are officially transforming RangerPlex from a web app into a **Hybrid Browser-OS**.
- **New Architecture**: "Trinity" Model (Server, Docker, Browser).
- **Documentation**: Created `docs/RangerPlexBrowser/rangerplexOS/RANGERPLEX_BROWSER_ARCHITECTURE.md`.
- **Manual**: Updated `rangerplex_manule.md` to be the Single Source of Truth.

### ✨ Added
- **Electron Wrapper**: Implemented `electron/main.js` and `preload.js`. Run with `npm run browser`.
- **Ghost Protocol**: Added Global Panic Button (`Cmd+Shift+Esc`) to instantly hide window and wipe RAM.
- **Phase 1: The Wrapper**: Electron integration complete.
- **Phase 2: Seamus & The Phantom Tabs**: Memory management system implemented.
- **Phase 3: Security & Ghost Protocol**: Global Panic Button (`Cmd+Shift+Esc`) active.
- **Phase 4: The Lens**: AI Vision implemented with `BrowserView` text extraction.
- **Phase 5: The Mini-OS**: Native File System access (Notes) and Floating Terminal added.
- **Browser UI**: Created `BrowserLayout.tsx` with Seamus's "Phantom Tab" logic (auto-suspend after 10 mins).
- **RangerChain Plan**: Master plan consolidated in `docs/RangerPlexBrowser/rangerplexOS/RANGERCHAIN_COMPLETE_MASTER_PLAN.md`.
- **Vault Plan**: Crypto Vault architecture defined in `docs/security/CRYPTO_VAULT_PLAN.md`. `AES-256-GCM` crypto vault at `./data/vault/`.

### 🔧 Changed
- **Manual Policy**: Explicit warning added to `rangerplex_manule.md` to ignore legacy docs.
- **Version Bump**: `package.json` updated to `2.5.36`.

---

## [2.5.35] - 2025-11-26
### Added
- **Ranger Console**: Embedded terminal in the dashboard.
- **Infinite Canvas**: Canvas board now resizes dynamically.

### Fixed
- **Canvas Settings**: Fixed unclickable settings button in `CanvasBoard.tsx`.

---

## [2.5.34] - 2025-11-25
### Added
- **RangerChain Video**: Initial integration of IDCP video compression.
- **IP Recon**: New `/iprecon` command for advanced threat analysis.

### Fixed
- **Radio Player**: Resolved connection issues after refresh.
- **Spinning Wheel**: Fixed infinite loading spinner bug.

---

## [2.5.33] - 2025-11-25
### Added
- **Docker Support**: Full `docker-compose` setup for containerized deployment.
- **Local AI in Docker**: Smart proxy logic for Ollama/LM Studio access from containers.

---

## [2.5.32] - 2025-11-24
### Fixed
- **Settings Modal**: Fixed syntax error (`Unexpected token`) in `SettingsModal.tsx`.
- **Server Connection**: Resolved WebSocket 404 errors in `proxy_server.js`.

---

## [2.5.31] - 2025-11-21
### Added
- **Memory Consolidation**: Unified AI Trinity memory into `~/.claude/ranger/`.
- **Perplexity MCP**: Fixed "EOF" error in Model Context Protocol setup.

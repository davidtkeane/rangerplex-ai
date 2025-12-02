# 🚀 RangerPlex Changelog

All notable changes to the **RangerPlex Browser** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.1.6] - 2025-12-02 🪟 WINDOWS 11 COMPLETE FIX + 🔧 SETTINGS & PORT FIXES

### 🎉 Historic Achievement
**RangerPlex now runs perfectly on Windows 11!** Complete compatibility fix from macOS (M3 Pro) to Windows (MSI Vector 16").

### 🐛 Windows 11 Compatibility Fixes

#### 1. npm install Failure (Only 3/1,262 packages installed)
- **Problem**: node-pty build failure blocked entire installation
- **Root Cause**: node-pty requires Visual Studio Build Tools
- **Solution**:
  - Created `.npmrc` to skip problematic build scripts
  - Used `npm install --ignore-scripts` approach
  - Rebuilt only critical native modules (better-sqlite3)
- **Result**: ✅ All 1,262 packages installed successfully

#### 2. Windows Script Compatibility
- **Problem**: npm scripts used bash syntax (`2>/dev/null`, `;` separator)
- **Solution**:
  - Changed `2>/dev/null` → `2>nul` (Windows stderr redirect)
  - Changed `;` → `&` (Windows command separator)
  - Created `scripts/shutdown.ps1` (PowerShell version)
  - Updated `package.json` with cross-platform scripts
- **Result**: ✅ All npm scripts work on Windows

#### 3. npm run browser - FIXED! 🎉
- **Problem**: Worked on macOS (M1/M3/M4) but failed on Windows
- **Root Causes**:
  - Bash syntax in command
  - Port cleanup disabled for Windows
  - Electron not installed (optional dependency)
- **Solution**:
  - Rewrote to use `concurrently` (same as `npm start`)
  - Created `scripts/open-browser.cjs` - Simple browser auto-opener
  - Added Windows port cleanup using `netstat` + `taskkill`
  - Waits for API health check before opening browser
- **Result**: ✅ `npm run browser` now works identically to macOS!

#### 4. PM2 Configuration
- **Problem**: PM2 couldn't find Node.js (wrong path), Vite kept restarting
- **Solution**:
  - Updated `ecosystem.config.cjs` with Windows platform detection
  - Fixed Node.js interpreter path resolution
  - Fixed Vite script path (`.cmd` extension on Windows)
- **Result**: ✅ API server works with PM2, Vite more stable with `npm start`

#### 5. PowerShell Variable Bug
- **Problem**: `$PID` is a reserved variable in PowerShell
- **Solution**: Renamed `$PID` → `$ProcessId` in `shutdown.ps1`
- **Result**: ✅ Shutdown script works without errors

### 🔧 macOS UI/UX Improvements

#### Settings Modal Scrollbar Fix
- **Fixed**: COMMANDS tab showing unnecessary scrollbar and reducing content size
- **Root Cause**: `min-h-[65vh]` on content wrapper conflicted with `max-h-[95vh]` outer container
- **Solution**: Removed `min-h-[65vh]` constraint - `flex-1` now properly fills available space

#### Port Auto-Correction (3010 → 3000)
- **Fixed**: Connection refused errors when using slash commands (`/geoip`, etc.)
- **Root Cause**: Old saved settings had `corsProxyUrl` pointing to port 3010
- **Solution**: All proxy URL references now auto-correct 3010 → 3000
- **Scope**: Updated 30+ instances across `ChatInterface.tsx` and `SettingsModal.tsx`

#### Chat Input Positioning
- **Fixed**: Ranger Radio player covering the chat input/settings buttons
- **Solution**: Added `bottomPadding` prop to ChatInterface
- **Behavior**: Input area shifts up when Radio Player visible (+60px) and RSS ticker (+32-48px)

### 📦 New Files Created (Windows Support)

| File | Purpose |
|------|---------|
| `.npmrc` | Skip node-pty build on Windows |
| `scripts/shutdown.ps1` | Windows PowerShell shutdown script |
| `scripts/open-browser.cjs` | Cross-platform browser auto-opener |
| `WINDOWS_SETUP.md` | Detailed Windows setup & troubleshooting |
| `START_WINDOWS.md` | Quick start guide for Windows users |
| `INSTALL_SUMMARY.md` | Complete fix documentation |
| `BROWSER_FIX.md` | Technical details of browser command fix |
| `services/consoleCapture.ts` | Console output capture service |

### 🔧 Files Modified

**Windows Compatibility:**
- `package.json` - Windows-compatible scripts, added browser commands, version 4.1.6
- `ecosystem.config.cjs` - Platform detection, Windows paths
- `install-me-now.ps1` - Enhanced validation, `.npmrc` creation, native module rebuild
- `scripts/launch_browser.cjs` - Windows port cleanup implementation

**macOS UI/UX:**
- `App.tsx` - bottomPadding calculation, port fix
- `components/ChatInterface.tsx` - bottomPadding prop, 20+ port fixes
- `components/SettingsModal.tsx` - scrollbar fix, 10+ port fixes
- `rangerblock/core/blockchain-chat.cjs` - Chat improvements
- `rangerblock/just-chat/blockchain-chat.cjs` - Simplified chat client

### ✅ Verification Tests Passed

- ✅ Node.js v22.21.1 detected
- ✅ npm 10.9.4 working
- ✅ PM2 6.0.14 installed globally
- ✅ All 1,262 packages installed
- ✅ better-sqlite3 built successfully
- ✅ API server starts (port 3000) ✅ ONLINE
- ✅ Vite dev server starts (port 5173) ✅ ready in 347ms
- ✅ Database initialized
- ✅ Health check endpoint responding
- ✅ **npm run browser opens automatically!** 🎉
- ✅ Shutdown script works
- ✅ WebSocket connections stable
- ✅ Port auto-correction working
- ✅ Settings modal scrollbar fixed

### 🚀 Recommended Startup

**Windows:**
```powershell
# Recommended - Auto-opens browser (same as macOS!)
npm run browser

# Alternative - No auto-browser
npm start

# Background with PM2 (API only)
pm2 start proxy_server.js --name rangerplex-api
npm run dev  # Separate terminal
```

**macOS/Linux:**
```bash
# Recommended - Auto-opens browser
npm run browser

# Alternative
npm start

# Background with PM2
npm run pm2:start
```

### 🎯 User Experience

**Before:**
- ❌ npm install failed on Windows (3/1,262 packages)
- ❌ npm scripts crashed (bash syntax errors)
- ❌ npm run browser didn't work on Windows
- ❌ PM2 configuration broken on Windows
- ❌ Shutdown script had PowerShell errors
- ❌ Port 3010 references caused connection errors
- ❌ Settings modal had scrollbar issues

**After:**
- ✅ Complete installation (1,262/1,262 packages)
- ✅ All scripts cross-platform
- ✅ npm run browser works perfectly on all platforms
- ✅ API server works with PM2
- ✅ Clean shutdown on Windows
- ✅ Browser opens automatically when ready
- ✅ Ports auto-correct to 3000
- ✅ Settings modal displays properly

### 📚 Documentation

- **Quick Start**: `START_WINDOWS.md`
- **Troubleshooting**: `WINDOWS_SETUP.md`
- **Technical Details**: `BROWSER_FIX.md`
- **Installation Summary**: `INSTALL_SUMMARY.md`

### 🤖 Credits

**24-Hour Cross-Platform Session:**
- David Keane (IrishRanger) - Windows testing, macOS development
- Claude Code (Ranger) - Cross-platform compatibility engineering

**Platforms:** Windows 11 (MSI Vector) + macOS (M3 Pro MacBook)
**Status:** ✅ **PRODUCTION READY** on both platforms

---

## [4.1.5] - 2025-12-01 🛠️ SIDEBAR & WORDPRESS FIXES

### 🐛 Code Button Fix
- **Fixed**: Code button in sidebar was not properly closing WordPress when opening Editor
- **Root Cause**: `onOpenEditor` was an inline function that only set `isEditorOpen(true)` without closing other surfaces
- **Solution**: Created proper `openEditor` function that:
  - Opens Code Editor
  - Closes WordPress Command Center
  - Closes all other open surfaces (Weather, Podcast, Canvas, etc.)
  - Sets `activeSurface` to `'editor'`

### ✨ WordPress Command Center Enhancements
- **NEW**: "Full Screen" button - Opens WordPress site in full-screen browser mode
  - Closes Command Center and opens browser with WordPress URL
  - Icon: `fa-expand`
- **NEW**: "View Site" button - Opens WordPress site in browser panel
  - Keeps Command Center open (like WP Login button)
  - Icon: `fa-window-restore`

### 🔧 Technical Changes
- `App.tsx`: Added `openEditor` function (lines 873-885)
- `App.tsx`: Added `openBrowserFullScreen` function (lines 475-481)
- `WordPressDashboard.tsx`: Added `onOpenFullScreen` prop
- `WordPressDashboard.tsx`: Added `handleOpenSitePanel` and `handleOpenSiteFullScreen` handlers
- `WordPressDashboard.tsx`: Added two new header buttons

### 📦 Files Modified
- `App.tsx`
- `src/components/WordPress/WordPressDashboard.tsx`

---

## [4.1.4] - 2025-12-01 🧹 RSS AUTO-CLEANUP & DEBUG

### 🗑️ Auto-Cleanup Broken Feeds
- **NEW**: Automatic removal of known broken RSS feeds on startup
- **Runs once per session** - efficient, doesn't slow down refreshes
- **Removes 8 broken feeds by name**:
  - GBHackers on Security
  - Trustwave SpiderLabs
  - KitPloit
  - Volexity
  - Sophos Naked Security
  - SANS Penetration Testing
  - Hacking Articles
  - Packet Storm
- **Problem solved**: These feeds were being restored from cloud sync even after clearing local storage

### 🔍 Debug Logging Added
- Comprehensive RSS data flow logging for troubleshooting
- `📡 RSS loadSettings`: Shows what's loaded from IndexedDB
- `📡 RSS Ticker`: Shows fetch counts, category filtering, merge results
- **Safety fallbacks**: If category filter results in 0 items, shows all items instead

### 🔧 Technical Changes
- `rssService.cleanupBrokenFeeds()` - New method to remove known broken feeds
- `BROKEN_FEED_NAMES` list for easy maintenance
- Session flag prevents cleanup from running multiple times

### 📦 Version Updates
- Sidebar.tsx: 4.1.4
- package.json: 4.1.4
- package-lock.json: 4.1.4
- dbService.ts: 4.1.4
- proxy_server.js: 4.1.4
- README.md badge: 4.1.4

---

## [4.1.3] - 2025-12-01 📻 RADIO & RSS MEGA UPDATE
### 🐛 Radio Bug Fix
- **Fixed**: "MEDIA_ELEMENT_ERROR: Format error" when playing radio streams
- **Root Cause**: JavaScript `const` variable was being reassigned in `proxy_server.js:1568`
- **Symptom**: Browser received `{"error":"Assignment to constant variable."}` instead of audio data
- **Solution**: Changed `const streamUrl` to `let streamUrl` to allow ice1→ice2 redirect logic to work

### 📰 RSS Ticker Fixes
- **Fixed**: RSS items not showing in ticker (only notes displayed)
- **Root Cause**: `loadSettings()` returned saved settings with empty `enabledCategories` array
- **Solution**: Properly merge saved settings with defaults, ensuring `enabledCategories` is never empty

### 🔄 Replaced Broken RSS Feeds
| Old Feed (Broken) | New Feed (Working) | Reason |
|-------------------|-------------------|--------|
| GBHackers on Security | Reddit NetSec | Cloudflare blocking |
| SANS Penetration Testing | SANS ISC | 404 Not Found |
| KitPloit | Rapid7 Blog | XML parse error |
| Hacking Articles | Checkpoint Research | 403 Forbidden |
| Packet Storm | Cisco Talos | Connection failed |
| Sophos Naked Security | SentinelOne Labs | XML parse error |
| Trustwave SpiderLabs | Unit42 Palo Alto | 403 Forbidden |
| Volexity | CrowdStrike Blog | Feed disabled by site |
| SANS DFIR | Huntress Blog | 404 Not Found |

### 🎛️ NEW RSS Settings Features
- **Display Mode**: Choose what shows in ticker
  - `All` - RSS feeds + Notes together
  - `RSS Only` - Only RSS headlines
  - `Notes Only` - Only your study notes
  - `Single Category` - Filter to one topic (e.g., Malware only)
- **Single Category Filter**: When in single-category mode, pick which topic to show
- **Refresh All Feeds**: Force re-fetch all enabled RSS feeds immediately
- **View Database Stats**: See feed counts, item counts, cache size, storage usage

### 🧹 NEW Reset & Clear Options
- **Clear RSS Cache**: Clears in-memory cache (feeds re-fetch on refresh)
- **Reset RSS Settings**: Restore default settings without deleting feeds
- **Delete All RSS Data**: Nuclear option - clears all RSS data from IndexedDB
- **Clear localStorage**: Reset browser preferences
- **View Storage Info**: See IndexedDB databases and storage usage

### 🔧 RSS Service Enhancements
- `rssService.resetSettings()` - Reset settings to defaults
- `rssService.clearCache()` - Clear in-memory cache
- `rssService.clearAllData()` - Delete all RSS data from IndexedDB
- `rssService.getStats()` - Get database statistics
- `rssService.refreshAllFeeds()` - Force re-fetch all feeds

### 📦 Version
- Bumped version to **4.1.3**

---

## [4.1.2] - 2025-12-01 📰 RSS TICKER FIX
### 📰 RSS Ticker Restoration
- **Fixed**: Resolved "Connection Refused" error preventing RSS feeds from loading.
- **Fixed**: Restarted `rangerplex-proxy` backend service to restore `/api/rss/parse` endpoint.
- **Improved**: `RSSService` now dynamically updates its proxy URL from settings, ensuring resilience against future port changes.
- **Improved**: Added settings synchronization in `App.tsx` to keep `rssService` configuration up-to-date.

### 🧹 Cleanup
- **Moved**: Unused debug scripts (`check_electron_deps.cjs`, `check_aws_bridge.cjs`) to `rangerblock/move/`
- **Moved**: Old `rangerblock/scripts/` folder to `rangerblock/move/old_scripts/`
- **Result**: Cleaner project structure, only active scripts remain in `scripts/`

### 📦 Version
- Bumped version to **4.1.2**

---

## [4.1.1] - 2025-12-01 📻 Ranger Radio Stream Fix
- **Fixed**: "Failed to play stream" (403 Forbidden) error on m3pro and m1air.
- **Changed**: Forced all radio streams (including SomaFM) to route through the local proxy.
- **Reason**: Direct browser connections were being blocked by the stream provider. The proxy ensures correct `User-Agent` and `Referer` headers are sent.
- **Improved**: Retry logic now also uses the proxy for better reliability.

### 📦 Version
- Bumped version to **4.1.1**

## [4.1.0] - 2025-12-01 🐉 SUPER SEXY CHAT CLIENT

### 🎨 RangerBlock Chat v2.0.0 - Complete Rewrite
- **Rainbow ASCII Art Banner**: Beautiful multi-color RANGERBLOCK logo on startup
- **Color-Coded Usernames**: Each user gets a unique color in chat
- **Animated Connecting Spinner**: `⠋ ⠙ ⠹ ⠸...` while connecting
- **System Message Icons**: `✓ ✗ → ← ⚠ ℹ 🤖` for different message types
- **Timestamps**: All messages show `[HH:MM]` format

### 💬 New Chat Commands
- `/nick <name>` - Change your nickname on the fly
- `/join #channel` - Switch between channels (#general, #rangers, #admin)
- `/msg user message` - Send private messages
- `/me action` - IRC-style action messages (*David waves*)
- `/channels` - List available channels
- `/who` or `/peers` - Show online users with colors
- Short flags: `-r`, `-n`, `-c`, `-h`, `-v`

### 🔧 Technical Improvements
- **Auto-reconnect**: Exponential backoff with 5 retry attempts
- **Default AWS Relay**: Connects to 44.222.101.125:5555 automatically
- **Graceful Ctrl+C**: Clean shutdown with goodbye message
- **Better Identity Detection**: Checks multiple paths for node identity

### 📝 Just-Chat Updates
- **Nickname Prompt**: First-time users now prompted to choose nickname
- **Nickname Persistence**: Saved to `~/.rangerblock-chat/.nickname`
- **Version 2.0.0**: Updated just-chat.sh with new features

### 🏆 Historic Achievement
- **First 4-way multi-cloud chat**: M3Pro + M1Air + Google Cloud + AWS all connected!
- **Chat log saved**: `rangerblock/move/historic_blocks/chat_session_2025-12-01_00-28.json`

### 📦 Version
- Bumped version to **4.1.0** across all components

---

## [4.0.26] - 2025-11-30 🛠️ STARTUP & MCP FIXES

### 🛠️ Startup Reliability
- **Fixed**: "Connection Refused" loop on startup by updating Electron to use `localhost` instead of `127.0.0.1`.
  - Solves IPv4/IPv6 resolution mismatches with Vite on macOS.
- **Improved**: Smoother launch sequence for Browser, UI, and MCP Gateway.

### 🐳 MCP Gateway Enhancements
- **Fixed**: MCP Gateway now runs on port **8808** (was conflicting on 3000).
- **Fixed**: Corrected `docker mcp secret set` command syntax in backend and documentation.
- **Updated**: Documentation (`DOCKER_MCP_QUICK_REF.md`, `DOCKER_MCP_MANUAL.md`) reflects new port and commands.

### 🤖 RangerBot AI & Deployment
- **New**: `rangerbot-ai.cjs` - AI-powered chatbot using **Gemini 2.0 Flash**.
- **New**: `deploy-bot.sh` - Automated deployment script for remote servers.
- **Moved**: Bot scripts moved to `.personal/` for security.
- **Cleanup**: Removed `setup-relay-simple.sh` (deprecated).
- **Enhanced**: `setup-relay-universal.sh` now supports `systemd` service creation on Linux.

### 🔗 RangerPlexBlock Upgrade
- **Upgraded**: Switched default relay server to `relay-server-bridge.cjs` (v2.0).
- **Fixed**: Resolved WebSocket connection issue in Web Chat (`relay-server-bridge.cjs`) by using dynamic hostname.
- **Fixed**: Resolved "Unknown message type" warnings for `machine_register` and `getMachineRegistry`.
- **Enabled**: Full machine registry and bridge mode support now active by default.

### 🧹 Log Cleanup
- **Silenced**: Suppressed common RSS parsing errors (timeouts, malformed XML) from console logs.
- **Result**: Much cleaner terminal output during operation.

### 📦 Version
- Bumped version to **4.0.26** across all components.

---

## [4.0.12] - 2025-11-30 📡 SERVER SELECTOR & CLOUD VM GUIDE

### 🎛️ Server Selector Dropdown
- **Added**: Professional server selector dropdown in settings
- **Options**: ngrok (Internet), LAN (M3Pro), Cloud (Coming Soon)
- **Default**: ngrok now default for internet-ready experience!
- **Feature**: Test connectivity buttons for each server preset

### 🧪 Test Connectivity
- **Added**: Test buttons for each server preset
- **Shows**: Success/Failed status with visual feedback
- **Quick**: One-click connection testing

### ☁️ Google Cloud VM Guide
- **Added**: Complete guide for FREE 24/7 relay server
- **Location**: `rangerblock/docs/GOOGLE_CLOUD_VM_SETUP.md`
- **Cost**: $0/month using Google Cloud Free Tier (e2-micro)
- **Includes**: Step-by-step setup, PM2, firewall rules

### 📚 Documentation
- **Released**: 36 Genesis docs now public!
- **Includes**: Academic whitepaper, architecture docs, design documents
- **Location**: `rangerblock/docs/Genesis-Docs/`

---

## [4.0.11] - 2025-11-29 🌐 INTERNET BLOCKCHAIN CHAT - HISTORIC MILESTONE!

### 🎉 FIRST INTERNET P2P BLOCKCHAIN CHAT ACHIEVED!
This is a **HISTORIC RELEASE** marking the first successful P2P blockchain chat over the public internet!

### 📜 Historic Blocks Recorded
- **BLOCK_001**: First Internet Chat (23:44:25)
  - M3Pro (Home WiFi 192.168.1.35) ↔ M4Max (iPhone Cellular 172.20.10.5)
  - Connected via ngrok tunnel: `tcp://2.tcp.eu.ngrok.io:12232`
  - First P2P message exchange across network boundaries

- **BLOCK_002**: Three Node Network (23:47:28)
  - M3Pro Genesis (relay) + M4Max (internet) + M1Air (LAN)
  - Mixed topology: LAN + Internet connections simultaneously
  - Full mesh P2P communication achieved

### 🌐 ngrok Integration
- **Added**: Quick preset buttons in relay settings
  - 🏠 LAN (M3Pro) - Local network: 192.168.1.35:5555
  - 🌐 ngrok (Internet) - Remote access via tunnel
- **Added**: `rangerblock/historic_blocks/` folder for blockchain records

### 📋 Chat Transcript (Forever on GitHub's Chain!)
```
[23:41:35] 🟢 M3Pro has joined #rangers
[23:41:41] <🏛️M3 Pro Genesis> hi
[23:44:25] 🟢 M4Max has joined the network (VIA INTERNET!)
[23:44:40] <⚡M4 Max Compute> hi
[23:47:22] 🟢 M1Air has joined the network
[23:47:28] <🍎M1 Air Peer> hello there@ we have 3 machines chatting !!!!!
```

### 🎖️ Significance
- **Master's Thesis**: Practical proof of blockchain P2P communication
- **24-Hour Session**: David Keane (IrishRanger) + Claude Code (Ranger)
- **Networks Bridged**: Home WiFi + iPhone Cellular via ngrok
- **Achievement**: Real-time chat across public internet boundaries

---

## [4.0.10] - 2025-11-29 🌐 NGROK RELAY PRESET

### 🌐 ngrok Internet Connectivity
- **Added**: ngrok preset button in blockchain chat relay settings
- **Added**: Quick switch between LAN and Internet modes
- **Enables**: Remote connections from any network via ngrok tunnel

---

## [4.0.9] - 2025-11-29 📞 BLOCKCALL & BLOCKVIDEOCALL UI BUTTONS

### 📞 Future Features UI (Coming Soon!)
- **Added**: BlockCall button in blockchain chat (voice calls over relay)
- **Added**: BlockVideoCall button in blockchain chat (video calls over relay)
- **Added**: BlockFile button in blockchain chat (secure file transfers)
- **Added**: `rangerblock/future-features/voice-video/` folder with implementation files
- **Added**: Voice chat controls, sender/receiver scripts staged for integration
- **Added**: Video streaming player and server files staged for integration

### 🎨 UI Enhancements
- **Added**: Phone, video, and file icons in chat title bar
- **Added**: "Coming Soon" alerts with feature descriptions
- **Added**: Buttons disabled when not connected (visual feedback)

### 📁 Files Staged
- `voice_chat_controls.html` - Voice chat UI
- `voice_chat_sender.py` - Voice transmission
- `voice_chat_receiver.py` - Voice reception
- `simple_blockchain_video_player.html` - Video streaming UI
- `send_file_to_m4.py` - File transfer script

---

## [4.0.8] - 2025-11-29 ⚙️ CONFIGURABLE RELAY SETTINGS

### ⚙️ Relay Settings Panel
- **Added**: Configurable relay host and port in blockchain chat
- **Added**: Settings stored in localStorage (persists across sessions)
- **Added**: Collapsible settings panel in node selector
- **Added**: Default relay: `192.168.1.35:5555` (Genesis node)
- **Added**: Users can now connect from any network by changing relay address

### 🔧 Technical Details
- **Added**: `getRelaySettings()` - Load relay config from localStorage
- **Added**: `saveRelaySettings()` - Persist relay config
- **Added**: State management for relay host/port
- **Added**: Settings gear icon toggle in node selector

### 🌐 Network Flexibility
- Users can now connect to relay via:
  - Local network (192.168.x.x)
  - VPN (custom IP)
  - Future: Tor/I2P support planned

---

## [4.0.7] - 2025-11-29 🌐 RANGERPLEX GUI CHAT - FULL P2P NETWORK!

### 🌐 RangerPlex GUI Blockchain Chat
- **Added**: Real-time WebSocket chat in RangerPlex browser UI
- **Added**: `BlockchainChat.tsx` updated with WebSocket connection
- **Added**: Auto-connects to M3Pro relay server (192.168.1.35:5555)
- **Added**: Live peer join/leave notifications in GUI
- **Added**: IRC-style chat with channels (#rangers, #general, #admin)
- **Tested**: M3Pro ↔ M1Air GUI chat: **WORKING!**

### 🐳 Skip Docker Flag
- **Added**: `--skip-docker` or `-sd` flag for `npm run browser`
- **Added**: Skips Docker Desktop check for machines without Docker
- **Usage**: `npm run browser -- --skip-docker`

### 🔧 Bug Fixes
- **Fixed**: M1Air connecting to wrong relay (localhost instead of M3Pro)
- **Fixed**: Relay server port conflict (EADDRINUSE on 5555)
- **Fixed**: Node identity detection for multiple naming patterns

### 📦 npm Commands Summary
```bash
npm run blockchain:relay      # Start relay server (M3Pro only)
npm run blockchain:chat       # Terminal chat client
npm run blockchain:ping       # Test P2P connectivity
npm run blockchain:install    # Interactive installer
npm run blockchain:status     # Check status
npm run browser -- --skip-docker  # Skip Docker on startup
```

---

## [4.0.5] - 2025-11-29 💬 BLOCKCHAIN CHAT & P2P PING

### 💬 Blockchain Chat - P2P Messaging!
- **Added**: `blockchain-chat.cjs` - Real-time P2P chat between nodes
- **Added**: `npm run blockchain:chat` - Start chat client
- **Added**: Messages routed through blockchain relay (not direct IP!)
- **Added**: Live peer join/leave notifications
- **Added**: Commands: `/peers`, `/quit`, `/clear`

### 🏓 Blockchain Ping - Test P2P Connectivity
- **Added**: `blockchain-ping.cjs` - Test node-to-node communication
- **Added**: `npm run blockchain:ping` - Ping all connected nodes
- **Added**: `--listen` mode - Stay connected for incoming pings
- **Added**: `--target` flag - Ping specific node by name
- **Added**: `--relay` flag - Connect to remote relay server

### 🔀 Relay Server Enhancements
- **Added**: `relayMessage` type - Route messages between specific nodes
- **Added**: `broadcast` type - Send to all connected nodes
- **Added**: Node-to-node message routing via relay

### ✅ Tested & Verified
- M3Pro (Genesis) ↔ M1Air (Peer) communication: **WORKING**
- Ping latency: 2ms local, 7ms cross-machine
- Real P2P communication using blockchain addresses (not IP!)

---

## [4.0.0] - 2025-11-29 🔗 RANGERPLEXBLOCK BLOCKCHAIN INTEGRATION

### 🔗 RangerPlexBlock - Full Blockchain Integration
This is a **MAJOR RELEASE** marking the complete integration of the RangerBlock P2P blockchain into RangerPlex.

### 🚀 Blockchain Auto-Start
- **Added**: RangerPlexBlock auto-starts with RangerPlex server
- **Added**: Graceful shutdown - blockchain stops when RangerPlex closes
- **Added**: `blockchainService.cjs` - Service manager for relay server lifecycle
- **Added**: Smart identity detection (supports multiple naming conventions)

### 📦 New npm Commands
- `npm run blockchain:install` - Interactive installer for new users
- `npm run blockchain:setup` - Setup node identity with security questions
- `npm run blockchain:relay` - Start relay server manually
- `npm run blockchain:status` - Check blockchain status

### 🎥 IDCP Compression System (JavaScript)
- **Added**: `idcp_compress.cjs` - H.265 CRF 32.5 + LZMA compression
- **Added**: `idcp_decompress.cjs` - Perfect restoration with SHA256 verification
- **Fixed**: Filename spaces handling (quoted paths for ffmpeg)
- **Tested**: Thunder.mp4: 76MB → 20MB (73.8% reduction!) with perfect restoration

### 🔐 Security Features
- RSA-2048 keypairs (node, chat, roaming keys)
- SHA-256 hashed security questions for recovery
- AES-256-GCM encrypted identity bundles
- Hardware UUID binding prevents key theft

### 🌐 Network Architecture
- **WebSocket Relay**: Port 5555 for P2P communication
- **HTTP Dashboard**: Port 5556 for status monitoring
- **Genesis Node**: M3Pro registered as network founder
- **Peer Nodes**: M1Air, Kali VM registered in blockchain

### 📁 New Files
- `rangerblock/blockchainService.cjs` - Service lifecycle manager
- `rangerblock/install-rangerplexblock.cjs` - Interactive installer
- `rangerblock/core/idcp_compress.cjs` - Video compression
- `rangerblock/core/idcp_decompress.cjs` - Video decompression
- `rangerblock/core/setup_new_user.cjs` - Node identity setup
- `rangerblock/core/identity_manager.cjs` - Import/export identities
- `rangerblock/core/relay-server.cjs` - WebSocket relay (ports fixed)

### 🛠️ Port Configuration Fixed
- Relay server moved from 8080 → 5555 (WebSocket)
- Dashboard moved from 3000 → 5556 (HTTP)
- No more port conflicts with main RangerPlex server

### 📋 Mission Statement
- Primary: Transform disabilities into superpowers through blockchain technology
- Education: 10% of transactions fund disability schools
- Philosophy: "One foot in front of the other" - David Keane

---

## [2.13.14] - 2025-11-29 🎙️ PODCAST FIX & RADIO OPTIMIZATION

### 🎙️ Podcast Feed Fix
- **Fixed**: Critical bug where podcast feeds weren't loading (xmlText variable was undefined)
- **Fixed**: Added missing `response.text()` call to read feed XML content
- **Result**: All 15+ cybersecurity podcasts now load correctly!

### 🎵 Radio Stream Optimization
- **Added**: Direct streaming for SomaFM (bypasses proxy - they already have CORS)
- **Added**: URL memoization with `useMemo` to prevent reconnects on re-renders
- **Improved**: Eliminates lag/stuttering caused by constant proxy reconnections
- **Improved**: Only recalculates stream URL when station actually changes

### 📦 Version
- Bumped version to **2.13.14**

---

## [2.13.13] - 2025-11-29 🔧 PORT MIGRATION & STABILITY

### 🔌 Complete Port Migration (3010 → 3000)
- **Fixed**: All hardcoded port 3010 references migrated to port 3000
- **Added**: Inline port detection and auto-fix in App.tsx, RadioPlayer.tsx, SettingsModal.tsx
- **Added**: Auto-save of corrected port settings to IndexedDB
- **Added**: `/api/health` and `/health` endpoints for connectivity checks

### 🎵 Radio Stream Stability
- **Added**: Auto-retry on decode errors (up to 3 attempts with 1s delay)
- **Added**: Cache-buster parameter to force fresh stream on retry
- **Improved**: Transfer-Encoding set to 'identity' to prevent chunked encoding issues
- **Improved**: `res.flushHeaders()` for true streaming without buffering

### 🧠 Gemini Rate Limiting Prevention
- **Added**: 2-second minimum delay between title generation requests
- **Added**: Request debouncing (cancels pending requests if new one arrives)
- **Improved**: Silent fallback to "New Chat" on rate limit errors

### 📰 RSS Console Cleanup
- **Added**: 5-minute quiet period for failed feeds (no repeated error logging)
- **Added**: Summary logging: `📡 RSS: 95/100 feeds loaded (5 temporarily unavailable)`
- **Improved**: Clears failed status when feed recovers

### 📚 Documentation Updates
- **Updated**: README.md - all port references to 3000
- **Updated**: rangerplex_manule.md - all port references to 3000
- **Updated**: help-files/DIAGNOSTICS_COMMANDS.md - all port references to 3000

### 📦 Version
- Bumped version to **2.13.13**

---

## [2.13.12] - 2025-11-29 ⛓️ RANGERPLEXCHAIN + RADIO FIX

### ⛓️ RangerPlexChain Blockchain Playground
Complete JavaScript blockchain system for RangerPlex apps:

**Core Modules (Python → JavaScript Conversion):**
- `AdminSystem.cjs` - Multi-machine admin with hardware UUID verification
- `BlockchainLogger.cjs` - SQLite transaction/event logging
- `KeyValidator.cjs` - Security validation and duplicate detection
- `ChatBridge.cjs` - mIRC-style P2P chat with moderation
- `relay-server.cjs` - WebSocket P2P discovery server

**Admin Features:**
- **Machine Independence**: ANY registered admin machine works alone (M3Pro OR M1Air)
- **Dynamic Management**: Add/remove/block admin machines on the fly
- **mIRC Permissions**: `~`Owner `&`Admin `@`Op `%`HalfOp `+`Voice User Banned
- **Chat Commands**: /kick /ban /op /voice /msg /me + full moderation
- **Audit Logging**: All admin actions tracked in SQLite database

**Security:**
- 3-Layer Admin Verification: JSON key + Hardware UUID + Password
- Genesis identity files for M3Pro and M1Air configured
- Security validator for key files and duplicates

**Location:** `/rangerblock/RangerPlexChain/`

### 📻 Ranger Radio Fix
- **Fixed**: "Failed to play stream" error when starting radio
- **Improved**: Added retry logic with exponential backoff
- **Improved**: Better error messages for stream failures
- **Improved**: Fallback to alternative stream URLs when primary fails

### 📦 Version
- Bumped version to **2.13.12**

---

## [2.13.11] - 2025-11-29 🔨 VS CODE FIXES
- **Fixed**: Resolved `ReferenceError: require is not defined` by converting `codeServerManager` to CommonJS.
- **Fixed**: Improved `isElectron` detection to use `window.electronAPI` instead of `process.type`.
- **Fixed**: Renamed `codeServerManager` to `VSCodeManager` to clear module caching issues.
- **Fixed**: Hardened shutdown logic to prevent zombie processes.

## [2.13.10] - 2025-11-29 🔨 VS CODE INTEGRATION

### 🔨 VS Code (Code Server) Integration
- **Dual-Mode Architecture**:
  - **Web Mode**: Lightweight Monaco Editor (default).
  - **Electron Mode**: Full VS Code experience via `code-server`.
- **Seamless Integration**:
  - "Editor" button renamed to "Code" in Sidebar.
  - Automatically detects Electron environment.
  - Launches `code-server` in the background (port 8081).
  - Embeds VS Code directly in the app interface.
- **Cross-Platform**: Works on macOS, Windows, and Linux.
- **Optional Dependencies**: `code-server` and `electron` are optional, keeping the web build light.

### 📦 Version
- Bumped version to **2.13.10**

---

## [2.13.9] - 2025-11-29 📖 COMMAND REFERENCE TAB

### 📖 New Commands Tab in Settings
- **Command Reference**: Complete searchable catalog of ALL 60+ slash commands
- **9 Categories**: System, Recon, Intel, Forensics, Malware, Crypto, Search, MCP, Fun
- **Live Search**: Instant filtering by command name, description, or tags
- **Quick Stats**: Category counts at a glance (🖥️ 🔍 📊 🎯)
- **Click to Copy**: Click any example to copy it directly to clipboard
- **Collapsible Sections**: Expand/collapse categories for easy browsing
- **Pro Tips**: Helpful hints at the bottom for power users

### 🎨 Visual Features
- **Cyan Theme**: Tron-style glow effects on commands tab
- **Icon Per Command**: Each command has its own icon (Terminal, Globe, Shield, etc.)
- **Tags Display**: Searchable tags under each command
- **Keyboard Friendly**: Full keyboard navigation support

### 📦 Version
- Bumped version to **2.13.9**

---

## [2.13.8] - 2025-11-29 💡 NOTES IN RSS TICKER

### 💡 Study Notes Integration
- **Notes in Ticker**: Your study notes can now scroll in the RSS news ticker!
- **Toggle Setting**: Enable/disable in Settings → RSS → "Show Notes in Ticker"
- **Cool Badge**: Notes display with amber 💡 lightbulb icon and "NOTE" badge
- **Priority Indicator**: High priority notes show 🔥 fire icon
- **Pinned Notes**: Pinned notes show 📌 thumbtack icon in badge
- **Click to Open**: Click any note in ticker to jump directly to it in Study Notes

### 🎨 Visual Design
- **Amber Theme**: Notes use warm amber colors to stand out from RSS items
- **Interleaved Display**: Notes are mixed every 5 RSS items for variety
- **Smart Sorting**: Pinned notes first, then by most recently updated

### 📦 Version
- Bumped version to **2.13.8**

---

## [2.13.7] - 2025-11-29 📁 AI WORKSPACE

### 📁 MCP Filesystem Workspace (NEW!)
- **AI File Access**: Models can now read/write files in a sandboxed workspace
- **Workspace Directory**: `/rangerplex-ai/workspace/` with subdirectories:
  - `projects/` - AI-assisted project files
  - `uploads/` - Files for AI processing
  - `temp/` - Temporary files
  - `shared/` - Persistent shared files

### 🛠️ 11 Filesystem Tools Available
| Tool | Description |
|------|-------------|
| `read_file` | Read file contents |
| `write_file` | Create/overwrite files |
| `edit_file` | Line-based text edits |
| `list_directory` | View folder contents |
| `directory_tree` | Recursive tree view |
| `search_files` | Find files by pattern |
| `move_file` | Move/rename files |
| `create_directory` | Create folders |
| `get_file_info` | File metadata |
| `read_multiple_files` | Batch read |
| `list_allowed_directories` | Show accessible paths |

### 🔒 Security
- **Sandboxed**: AI can ONLY access `/workspace` folder
- **No Execution**: Cannot run scripts or programs
- **Read/Write Only**: Safe file operations within bounds

### 📦 Version
- Bumped version to **2.13.7**

---

## [2.13.6] - 2025-11-29 🎧 PODCAST UI POLISH

### 🎨 UI Improvements
- **CyberSec Podcast Hub**: Fixed floating player positioning
  - Player now floats **above** the news ticker (respects bottom offset)
  - Aligned horizontally with Ranger Radio (2rem gap) for a clean, side-by-side layout
  - Prevents UI overlap when both radio and podcast player are active

### 📦 Version
- Bumped version to **2.13.6**

---

## [2.13.5] - 2025-11-29 🔍 SEARCH COMMANDS & MCP FIXES

### 🆕 New Search Commands
- **`/perplexity <query>`**: AI-powered web search using Perplexity's Sonar models
  - Streams results in real-time with citations
  - Uses configured model from Settings (default: sonar-pro)
  - Example: `/perplexity what is the best M3 Pro price`

- **`/ducky <query>`**: DuckDuckGo web search via MCP Docker gateway
  - Returns formatted search results with titles, URLs, and snippets
  - Uses configured results count from Settings
  - Example: `/ducky where is London`

### ⚙️ Enhanced Search Settings
New comprehensive search configuration in **Settings > Search**:

**Search Preferences:**
- **Default Search Provider**: Perplexity, Brave, DuckDuckGo, Google, Bing, Tavily
- **Perplexity Model**: Sonar, Sonar Pro, Sonar Reasoning, Sonar Reasoning Pro
- **Results Count**: 5, 10, 15, or 20 results
- **Safe Search**: Off, Moderate, Strict
- **Search Region**: US, GB, IE, CA, AU, DE, FR, ES, IT, JP, IN, BR
- **Search Language**: 11 languages supported

**Search Behavior Toggles:**
- Enable DuckDuckGo Fallback (via MCP)
- Enable Web Search for LLMs
- Show Source Links in Results
- Auto-Search on Questions

**Quick Commands Reference**: Handy reference box showing available search commands

### 🔧 Critical Bug Fixes

- **Docker MCP Tools Call**: Fixed stdin JSON parsing issue
  - Docker MCP uses `key=value` command arguments, NOT stdin JSON
  - Rewrote `/api/mcp/call` endpoint to convert JSON to key=value format
  - Added `getToolArgs()` helper for mapping plain text to tool arguments
  - All MCP tools now work correctly: search, brave_web_search, fetch, etc.

- **App Startup Crash**: Fixed Electron crash on `npm run browser`
  - Removed conflicting server startup from `launch_browser.cjs`
  - Electron now manages servers internally (prevents double-start conflicts)
  - MCP Gateway auto-starts 8 seconds after Electron boots

- **Port Cleanup**: Added MCP gateway port (8808) to cleanup list
  - Prevents port conflicts on restart

### 🚀 Launch Script Improvements
Updated `scripts/launch_browser.cjs`:
- Simplified startup sequence: Docker → Port cleanup → UI → MCP Gateway
- Removed server startup (Electron handles this)
- Added delayed MCP Gateway initialization
- Better console output showing startup progress

### 📦 Version
- Bumped version to **2.13.5**

---

## [2.13.4] - 2025-11-29 📡 RSS & UI POLISH

### 🆕 RSS Enhancements
- **Feed Order Control**: Added "Feed Order" setting in RSS configuration.
  - **Newest First**: Default behavior.
  - **Random Shuffle**: Mixes all feeds for variety (fixes "only malware" issue).
  - **Group by Topic**: Organizes ticker by category.
- **Robust Parsing**: Improved RSS parser to handle SSL errors and anti-bot protections.
  - Ignores self-signed/invalid certificates.
  - Uses browser-like User-Agent to bypass blocks.
  - Detailed error logging for broken feeds.

### 🔧 UI/UX Fixes
- **Settings Modal Z-Index**: Fixed issue where Settings Modal appeared behind the Sidebar.
  - Moved modal to root-level overlays for correct stacking.
- **RSS Visuals**:
  - Monochromatic "Zinc" theme for distraction-free reading.
  - Smooth scrolling animation (pixel-perfect speed calculation).
  - FontAwesome icons for categories.

### 🐛 Bug Fixes
- **Electron Startup Crash**: Fixed double-server startup conflict when running `npm run browser`.
  - Electron now checks if the server is already running before attempting to start it.

### 📦 Version
- Bumped version to **2.13.4** across all components.

---

## [2.13.3] - 2025-11-29 📝 NOTES SYNC & API FIXES

### 🔧 Fixed
- **Study Notes Hydration**: Notes now sync from server to browser on app load
  - Added `study_notes_${currentUser}` to hydration process in App.tsx
  - Notes stored on server are now restored to IndexedDB automatically
  - Console logs `📝 Restored study notes from server` on successful sync

- **Perplexity API Tester**: Fixed Advanced Tester for Perplexity
  - Added `perplexity` provider to `apiTestingService.testLLM()`
  - Uses `https://api.perplexity.ai/chat/completions` endpoint
  - Default model: `sonar-reasoning-pro`

- **Body Stream Error**: Fixed "body stream already read" error in API testing
  - Changed response handling to read as text first, then parse JSON
  - Prevents double-read of response body on parse failures

### 📦 Version
- Synced version across badge, package, server banner, sidebar, and DB metadata to **2.13.3**

---

## [2.13.2] - 2025-11-29 📡 RSS NEWS TICKER

### 🆕 New Features
- **Live RSS News Ticker**: TV-style scrolling news below chat
- **120 Pre-configured Feeds**: Pentesting, Malware, Forensics, News, Data Gov, Blockchain
- **Feed Manager**: Add/remove/test unlimited RSS feeds
- **Customizable Ticker**: Adjust speed, height, and behavior
- **Click to Import**: Import articles directly into chat
- **Category Badges**: Color-coded badges for each feed category
- **Auto-refresh**: Configurable refresh intervals (5-60 min)

### ⚙️ Settings
- New "RSS" tab in Settings
- Ticker speed control (1-10)
- Auto-refresh interval (5/10/15/30/60 min)
- Height selector (small/medium/large)
- Category filters
- Pause on hover toggle

### 📡 Supported Categories
- 🔒 Penetration Testing (20 feeds)
- 🦠 Malware Analysis (20 feeds)
- 🔍 Digital Forensics (20 feeds)
- 📰 Cybersecurity News (20 feeds)
- 🛡️ Data Governance (20 feeds)
- ⛓️ Blockchain & Crypto (20 feeds)

### 🔧 Technical
- Backend RSS parsing (Node.js) - Fixed browser incompatibility
- IndexedDB persistence
- CORS bypass via proxy
- Browser-compatible architecture

### 📦 Version
- Synced version across badge, package, server banner, sidebar, and DB metadata to **2.13.2**

---

## [2.13.1] - 2025-11-29 🎬 RANGERPLAYER FIX

### 🔧 Fixed
- **RangerPlayer Profile**: Fixed import error preventing Vite from compiling
  - Changed `setAutoplayEnabled` → `setAutoplayState` (correct export name)
  - Fixed `isAutoplayEnabled()` → `isAutoplayEnabled` (variable, not function)
  - Profile page now loads correctly with autoplay preferences

### 📦 Version
- Synced version across badge, package, server banner, sidebar, and DB metadata to **2.13.1**

---

## [2.13.0] - 2025-11-29 🎧 CYBERSEC PODCAST HUB

### 🎧 Podcast Hub Enhancements
- **New Governance Category**: Added Data Governance & Privacy category for NCI course alignment
  - Cyberlaw Podcast (privacy law with former NSA General Counsel)
  - Privacy Advisor Podcast (IAPP - GDPR, data protection)
  - She Said Privacy / He Said Security (compliance, risk management)
  - Data Protection Made Easy (GDPR simplified)

### 📻 Audio Improvements
- **New Podcasts**: Added 4 new pentesting/malware podcasts
  - Hacking Humans (social engineering - CyberWire)
  - Click Here (Recorded Future award-winning stories)
  - SANS StormCast (daily 5-min threat updates)
- **Feed Fixes**: Updated broken RSS feeds for Malicious Life and 7 Minute Security
- **Refresh Button**: Added manual refresh button in podcast header

### 💬 Chat Commands
- **New `/podcasts` Command**: Open Podcast Hub directly from chat
  - Also works with `/podcast` or `/radio`
  - Added to help catalog for discoverability

### 🎮 Easter Egg
- **Ranger Pic**: Play button shows ranger photo after 5s inactivity (matches Ranger Radio)

### 📦 Version
- Synced version across badge, package, server banner, sidebar, and DB metadata to **2.13.0**

---

## [2.12.9] - 2025-11-29 🐳 MCP PORT FIX

### 🔧 Fixed
- **MCP Docker Integration**: Fixed critical port mismatch preventing MCP servers from working
  - Updated Settings Modal MCP buttons (Start/Stop/Check Status) to use correct port 3000
  - Fixed App.tsx MCP auto-start to use dynamic proxy URL instead of hardcoded port 3010
  - Updated default `corsProxyUrl` and `lmstudioBaseUrl` from port 3010 to 3000
  - All MCP API calls now use `settings.corsProxyUrl` with fallback to port 3000

### 📚 Documentation
- Created comprehensive diagnostic report: `MCP_PORT_FIX_REPORT.md`
- Documented port architecture and testing procedures
- Added troubleshooting guide for common MCP issues

### ✅ Impact
- MCP gateway controls now fully functional in Settings → MCP tab
- Auto-start MCP feature works correctly on app launch
- All `/mcp-*` commands operational (brave_web_search, fetch, youtube_transcript, etc.)
- Eliminated "Failed to fetch" errors when using MCP tools

## [2.12.8] - 2025-11-29
### Changed
- **Port Migration**: Migrated backend server from port 3010 to **3000** for better compatibility and standard usage.
- **Frontend Updates**: Updated all frontend components (Settings, Chat, Radio, Terminal, Blockchain) to communicate with the new backend port 3000.
- **MCP Integration**: Verified and solidified Docker MCP integration on the new port.

## [2.12.7] - 2025-11-29 🛠️ MCP INTEGRATION COMPLETE

### 🐳 Docker MCP
- **Full Integration**: MCP tools (Brave, Fetch, YouTube, Obsidian) are now fully integrated with Gemini, Claude, Ollama, and OpenAI.
- **Smart Proxy**: Backend heuristics automatically wrap raw text inputs into JSON for common tools, simplifying model usage.
- **Model Awareness**: System prompts updated to make models aware of available tools and how to use them via slash commands.
- **Frontend Handler**: Added chat interface support for executing `/mcp` commands and displaying results.

### 📦 Version
- Synced version across badge, package files, server banner, sidebar, and DB metadata to **2.12.7**.

## [2.12.6] - 2025-11-29 🎉 OPENAI CATALOG + CELEBRATIONS

### 🤖 OpenAI Updates
- Added the new ChatGPT/GPT-5 + o-series models into defaults, badges, pricing placeholders, and live fetch filters.
- OpenAI test button now hits `/v1/models` and celebrates success with a confetti blast (toggleable).

### 🎨 Settings UX
- Providers tab gains an OpenAI Models catalog with descriptions, capability icons, and status badges.
- Confetti opt-out toggle relocated beside the Gemini Models controls for quick access.

### 📦 Version
- Synced version across badge, package files, server banner, sidebar, and DB metadata to **2.12.6**.

## [2.12.5] - 2025-12-04 🧭 MCP & HELP IMPROVEMENTS

### 🧭 MCP Experience
- Added a dedicated MCP settings tab (gateway URL, start/stop/status, auto-start toggle using stored keys).
- Improved status UX: connection errors show as “stopped” instead of generic errors; gateway auto-start/stop is handled when enabled.

### 🙋‍♂️ Help System
- Intelligent `/help` handles fuzzy topics/typos and returns concise, runnable examples for key commands.
- Expanded help catalog coverage (networking, MCP, weather, recon) with quick hints.

### 📦 Version
- Synced version across badge, package files, server banner, sidebar, and DB metadata to **2.12.5**.

## [2.12.3] - 2025-12-02 🛠️ WORDPRESS COMMAND CENTER UX

### 🎨 UI/UX
- WordPress Command Center buttons restyled to match the sidebar (neutral dark surfaces, FA icons), with cards aligned to sidebar visuals.
- Header shortcuts for WP Login, Admin, and Settings pick the best available site automatically.

### 🏎️ Behavior
- Browser overlay now reuses an existing tab when opening WordPress pages to prevent duplicates.
- Single-click guardrails on WordPress header buttons to avoid accidental double opens.

### 🔒 Guardrails
- Added small safety checks around WP actions to reduce accidental navigation and double submissions.

### 📦 Version
- Synced version across badge, package files, server banner, sidebar, and DB metadata to **2.12.3**.


## [2.12.2] - 2025-12-01 🛡️ CONTEXT GUARDRAILS

### 🚦 Safety
- Added configurable chat history caps (messages + characters) to keep all providers under token limits; defaults stay at 24 messages / ~120k chars but are now user-tunable in Settings → Params.

### 🛠️ Settings
- New “Conversation History Guardrails” controls in Params tab to set max messages and character cap per request.

### 🔧 Tech
- All provider routes (OpenAI/Anthropic/Perplexity/Gemini/Ollama/LM Studio/HF/Grok) now respect the new caps via a shared trimmer.

## [2.12.1] - 2025-11-29 🎨 WORDPRESS COMMAND CENTER POLISH


### ✨ UI Refresh
- WordPress Command Center now matches the sidebar styling (dark zinc base, cyan accents, glassy cards, refined status pills, and new RangerPlex header avatar).
- Buttons, cards, and loaders updated for a cohesive look; inline header loader keeps the page visible while data streams in.

### ⚡ Performance
- Docker status checks are batched into a single compose call and gated by a 3s timeout alongside site scanning to reduce spinner time.

### 🧹 Housekeeping
- Version synced across app: `package.json`, README badge, package-lock, and server banner now read **2.12.1**.
- Added `docs` to `.gitignore` (memory-system exception still allowed).

## [2.12.0] - 2025-11-28 🐳 DOCKER MCP INTEGRATION & BROWSER FIXES

### 🐳 Docker MCP Integration
- **Docker MCP Toolkit**: Fully integrated Model Context Protocol support
  - 310+ containerized MCP servers available in catalog
  - 6 servers pre-enabled (brave, dice, duckduckgo, fetch, obsidian, youtube_transcript)
  - 30 tools immediately available for use
  - Docker Desktop auto-start on `npm run browser` (all platforms)
- **Cross-Platform Auto-Start**: Automatic Docker Desktop launch
  - macOS: `open -a "Docker Desktop"`
  - Windows: Starts Docker Desktop.exe
  - Linux: systemctl/docker-desktop support
  - Smart detection with 20-second initialization wait
  - Graceful fallback if Docker unavailable
- **Comprehensive Documentation**:
  - `/Users/ranger/rangerplex-ai/help-files/DOCKER_MCP_MANUAL.md` - Complete guide (8.4KB)
  - `/Users/ranger/rangerplex-ai/help-files/DOCKER_MCP_QUICK_REF.md` - Quick reference (3.5KB)
  - Added to help-files INDEX.md with quick commands section
  - Accessible via `/manual` command in RangerPlex

### 🌐 Browser Improvements
- **Fixed Inception Loop**: Default browser URL changed from `localhost:5173` to `https://google.com`
  - Prevents RangerPlex loading inside itself
  - New setting: `defaultBrowserUrl` in Settings → Workspace
  - Configurable per-user preference
- **Fixed Layout Gap**: Eliminated 2-inch gap between sidebar and browser window
  - Removed unnecessary padding from tab bar
  - Removed background color from wrapper div
  - Browser now fills entire tab space seamlessly
- **Fixed Tab Close Button**: Exit button now works correctly
  - Added `e.preventDefault()` to prevent event bubbling
  - Proper state management when closing tabs
  - Smooth tab switching after close

### ⚙️ Settings Enhancements
- **New Browser Settings** (Settings → Workspace):
  - `defaultBrowserUrl` - Set default URL for new browser tabs
  - Prevents inception loop by avoiding localhost:5173
  - Persists across sessions via IndexedDB + server sync

### 🔧 Technical Improvements
- **Browser Component Updates**:
  - `BrowserLayout.tsx`: Added `defaultUrl` prop with default `https://google.com`
  - Proper prop passing from App.tsx to BrowserLayout
  - Fixed close button event handling
- **Launch Script Enhancement**:
  - `scripts/launch_browser.cjs`: New `ensureDockerRunning()` function
  - Cross-platform Docker detection and startup
  - Integrated into all launch modes (default, -t, -b)
- **Type Definitions**:
  - Added `defaultBrowserUrl: string` to `AppSettings` interface
  - Default value: `'https://google.com'` in `DEFAULT_SETTINGS`

### 📚 Documentation
- **README.md**: Updated version badge to 2.12.0
- **CHANGELOG.md**: This entry!
- **Help Files**: Docker MCP manual and quick reference added
- **Mission Complete**: `/Users/ranger/rangerplex-ai/DOCKER_MCP_MISSION_COMPLETE.md`

### 🎯 User Experience
- **Seamless Docker Integration**: No manual Docker startup needed
- **No More Inception**: Browser opens to Google instead of itself
- **Perfect Layout**: Browser fills entire tab space without gaps
- **Working Controls**: All browser buttons (close, new tab, navigate) functional
- **Persistent Settings**: Default URL preference saved across sessions

### 🔥 Benefits
- **310 MCP Servers**: Massive expansion of AI capabilities
- **Zero-Configuration**: Docker starts automatically
- **Better UX**: No more confusing inception loops
- **Clean Layout**: Professional browser experience
- **Cross-Platform**: Works on macOS, Windows, Linux

---

## [2.10.1] - 2025-11-28 🤠 THE LONE RANGER RADIO EASTER EGG

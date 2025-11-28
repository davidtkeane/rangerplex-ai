# 🚀 RangerPlex Changelog

All notable changes to the **RangerPlex Browser** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.10.1] - 2025-11-28 🤠 THE LONE RANGER RADIO EASTER EGG

### 🎸 Ranger Radio Easter Egg
- **Lone Ranger Appears!**: After 5 seconds of inactivity on the radio player, the legendary Lone Ranger (black & white masked face with hat) appears in the play/pause button
- **Hover Interaction**: Move your mouse over the Ranger's face to instantly reveal the play/pause controls
- **Smart Timer**: Resets on any interaction (play/pause, volume change, station change, expanding from minimized)
- **Visual Polish**: Image fits perfectly in circular button with smooth transitions
- **Theme Support**: Works seamlessly with Light, Dark, and Tron themes
- **Non-Intrusive**: Easter egg doesn't interfere with functionality - just a cool surprise for users vibing to the music!

### 🎯 Technical Details
- **File**: RadioPlayer.tsx
- **Image**: `/image/rangersmyth-pic.png` (The iconic Lone Ranger mask and hat)
- **Timer**: 5-second inactivity countdown with proper cleanup
- **State Management**: `showRangerPic`, `isHoveringButton`, `inactivityTimerRef`
- **Interaction Tracking**: All user actions reset the timer (play, pause, volume, station, minimize)

### 🎭 The Lone Ranger Lives!
David's alter ego is now watching over the radio - the masked ranger keeping guard while you code to DEF CON Radio or chill to Groove Salad. A perfect tribute to the legend! 🎖️

---

## [2.11.0] - 2025-12-02 🌙 Alias Outputs & City Weather
### 🎯 Highlights
- Clean alias output formatting: ANSI stripped, curl progress hidden, and truncation for long outputs.
- Moon/Sun/City weather aliases (Dublin/London/Paris/NYC) with monochrome ASCII snapshots and 6s timeout.
- Alias runner state fix to prevent duplicate executions; stop button clearly red while streaming.

### 🧭 Notes
- Default aliases now include OS metadata (Windows/POSIX) and timeouts on curl requests.
- Startup banner, system reports, and badges updated to v2.11.0.

---

## [2.10.0] - 2025-11-28 🌦️ WEATHER STATION & ASTRONOMICAL SKY

### 🌤️ Major Features
- **Weather Station Dashboard**: Complete weather monitoring system with real-time data from 4 APIs
  - OpenWeatherMap (1000 calls/day)
  - Tomorrow.io (500 calls/day)
  - Visual Crossing (1000 calls/day)
  - Open-Meteo (unlimited, FREE)
- **API Usage Meters**: Real-time tracking with visual progress bars
  - Color-coded indicators (green/yellow/red based on usage)
  - Countdown timers showing time until daily reset
  - Persistent tracking via IndexedDB
  - Special "unlimited" meter for Open-Meteo
- **Dynamic Astronomical Sky Background**: Real sun/moon positioning with animations
  - Julian Day calendar calculations for precise time
  - Solar position (altitude, azimuth, right ascension, declination)
  - Lunar phase determination (8 phases across 29.53-day synodic month)
  - 100 animated twinkling stars at night
  - 5 floating clouds with parallax effect
  - 4 time-based sky gradients (night/dawn/day/dusk)
  - Sunrise/sunset calculations
- **Irish Rain Notifications** 🇮🇪: Smart rain alerts with Irish charm
  - Configurable timing (1hr, 3hrs, 12hrs, 24hrs ahead)
  - Rain intensity calculator (Drizzle/Light/Moderate/Heavy)
  - Location-based monitoring (default: Dublin, IE)
  - 30-minute check intervals
  - Irish-specific messaging ("Don't forget your brolly! 🇮🇪")
  - Opens Weather Station on click
  - 10-minute cooldown between notifications

### 🎨 UI Components
- **WeatherStation.tsx**: Enhanced weather display with comprehensive metrics
  - Current conditions with all available data
  - Hourly and daily forecast previews
  - Air quality breakdown
  - UV index, visibility, pressure trends
  - Wind speed and direction
  - Glassmorphism design (backdrop-blur-md)
- **DynamicSky.tsx** (NEW): Realistic astronomical background
  - Real-time celestial object positioning
  - Hour angle and ecliptic coordinate calculations
  - Adaptive sky colors based on solar altitude
  - Star field generation with twinkling animation
  - Cloud movement with CSS animations
- **RainNotification.tsx** (NEW): Blue-themed notification component
  - Matches UpdateNotification design pattern
  - Time formatting (hours/minutes until rain)
  - Precipitation amount display (mm)
  - Theme-aware (Light/Dark/Tron)

### 🔧 Backend Services
- **weatherService.ts**: Enhanced with tracking and rain detection
  - API call tracking across all 9 methods
  - Persistent usage stats with midnight reset
  - `checkForUpcomingRain()` method using Open-Meteo hourly data
  - `getAPIUsageStats()` for meter display
  - Intelligent fallback system across 4 APIs

### ⚙️ Settings Integration
- **Rain Notification Settings** (Settings → Weather tab):
  - Enable/disable toggle
  - Timing selector (1hr, 3hrs, 12hrs, 24hrs)
  - Location input (e.g., "Dublin,IE")
  - Blue-themed section with ☔ icons

### 📊 Type Definitions
- `APIUsageStats` interface for tracking
- `RainAlert` interface for notifications
- `rainNotificationsEnabled: boolean`
- `rainNotificationTiming: '1hour' | '3hours' | '12hours' | '24hours'`
- `rainNotificationLocation: string`

### 🎯 Technical Achievements
- **Zero TypeScript Errors**: All features compiled perfectly on first try
- **Astronomical Accuracy**: Real celestial mechanics calculations
- **API Efficiency**: Smart usage tracking prevents quota exhaustion
- **Notification Intelligence**: Spam prevention with cooldown system
- **Irish Weather Ready**: Perfect for unpredictable Irish climate

### 🌍 Use Cases
- Weather monitoring with API usage awareness
- Rain preparedness for Irish weather
- Educational astronomy (real sun/moon positions)
- Multi-API fallback for reliability
- Beautiful ambient background during work

---

## [2.9.0] - 2025-12-01 ⚡ Alias Runner & Command Safety
### 🎯 Major Features
- **Alias Runner**: Chat detects aliases (with `/alias` support), shows confirmation modal, enforces allowlist/blacklist validation, and streams output.
- **Cancel/Timeout**: 60s default timeout with user-facing Cancel button to abort in-flight commands.
- **Default Alias Pack**: Preloaded aliases (moon, nddy, gitstatus, etc.) for instant use and autocomplete.

### 🛠️ Backend
- Added `services/aliasService.node.js` for server-side alias CRUD and packs; execution logging persisted and exposed via `/api/alias/logs`.
- Startup banner now reflects v2.9.0.

### 🖥️ UI/UX
- Alias Manager launchers in chat controls and Settings; in-manager log viewer.
- Chat controls include “View Logs” + “Cancel Command” while running.
- Autocomplete supports arrow/enter selection and click-outside close; default aliases preloaded.
- Sidebar shows current app version badge (v2.9.0).

### 🧹 Fixes
- Null safety for Open-Meteo parsing in weather service.
- Removed unsupported weather API key inputs from Settings to match `AppSettings` shape.

---

## [2.8.0] - 2025-11-28 💻 VSCODE & WORDPRESS DUAL-MODE INTEGRATION
### 🎯 Major Features
- **VSCode Integration (code-server)**:
  - `/code` command opens VSCode in tab or new window
  - `/code /path/to/folder` opens VSCode with custom folder path
  - Full code-server integration (port 8080)
  - Tab mode: Full-screen overlay with close button
  - Window mode: Opens in new browser window
  - Setting: "Open VSCode in Tab" (default: true)

- **WordPress Dual-Mode System**:
  - **Choice Modal**: Beautiful modal for selecting WordPress mode
  - **Docker Mode**: Full WordPress + MySQL + phpMyAdmin (existing)
  - **PHP Server Mode**: Lightweight standalone from `software/` folder (NEW!)
  - `/wordpress` or `/wp` command with smart routing
  - Setting: "WordPress Default Mode" (Ask/Docker/PHP)
  - Setting: "Open WordPress in Tab" (default: true)

### 🔧 Backend API Endpoints
- `POST /api/wordpress-php/start` - Start PHP server (port 8091)
- `POST /api/wordpress-php/stop` - Stop PHP server
- `GET /api/wordpress-php/status` - Check PHP server status
- `GET /api/code-server/status` - Check VSCode status
- `POST /api/server/restart` - Restart RangerPlex server
- `GET /api/server/check-update` - Check for updates
- `POST /api/server/install-update` - Install updates
- `GET /api/wordpress/status` - WordPress container status

### 🔍 System Diagnostics (NEW!)
- **`/sys-info` Command**: Comprehensive system health report
  - RangerPlex version and uptime
  - Service status monitoring (Proxy, Vite, WordPress)
  - Database connection and statistics
  - Recent error logs (last 10)
  - Performance metrics (memory usage)
- **Error Logging Service**: Automatic error capture and tracking
  - Categorized by service
  - Severity levels (error, warning, info)
  - Stack trace preservation
  - Limited to last 100 errors

### 🔔 Enhanced Update System
- **Smart Update Notifications**: Non-intrusive popup when updates available
  - One-click install from notification
  - Auto-save protection (saves all chats and settings before update)
  - Theme-aware design (Light/Dark/Tron)
- **Improved Version Comparison**: Proper semver comparison logic
- **Cache-Busting**: Ensures latest version info is always fetched
- **Update moved from ChatInterface to App**: Global update checking

### 🎨 UI Components
- **AppChoiceModal**: Reusable modal for app choices
  - Clean design with icons and descriptions
  - Click outside to close
  - Keyboard accessible
  - Hint about setting defaults in Settings

### ⚙️ Settings Panel
**Workspace Behavior Section**:
- ☑ Open VSCode in Tab
- ☑ Open WordPress in Tab
- **WordPress Default Mode** dropdown:
  - "Ask Every Time" (shows choice modal)
  - "Always Use Docker" (skips modal)
  - "Always Use PHP Server" (skips modal)

### 📋 Type Definitions
- `vscodeOpenInTab: boolean`
- `wordpressOpenInTab: boolean`
- `wordpressDefaultMode: 'docker' | 'php' | 'ask'`

### 🎖️ User Experience
- **Smart Routing**: WordPress command routes based on user preference
- **Persistent Settings**: All preferences saved across reloads
- **Consistent Behavior**: VSCode and WordPress follow same tab pattern as Terminal, Notes, Browser
- **Professional UI**: Smooth overlays, clean modals, intuitive controls

### 🔨 Technical Implementation
- State management: `isVSCodeOpen`, `isWordPressChoiceOpen`
- Handler functions: `openVSCode()`, `openWordPress()`, `openWordPressDocker()`, `openWordPressPHP()`
- PHP server: `php -S localhost:8091 -t public_html`
- Process tracking: Map-based PID storage
- Iframe overlays: Full-screen with close buttons
- Settings persistence: IndexedDB + server sync

### 📊 Progress
**100% Complete**:
- ✅ Backend endpoints
- ✅ Type definitions
- ✅ Choice modal component
- ✅ App.tsx state & handlers
- ✅ ChatInterface commands
- ✅ Settings UI
- ✅ Render components
- ✅ Compilation testing

---

## [2.7.7] - 2025-11-28
### Added
- **Smart Update Notification**: A new, non-intrusive popup alerts you when a new version is available.
  - **One-Click Install**: Update directly from the notification with a single click.
  - **Auto-Save Protection**: The system now automatically saves all chats, settings, and syncs data before applying an update to prevent data loss.
- **Tabbed Workspace**: Introduced a new tabbed interface for better multitasking.
  - **Persistent Tabs**: Terminal, Browser, and Notes now stay alive in the background when switching tabs.
  - **Hybrid Mode**: Choose between classic floating windows or docked tabs via Settings.
  - **Dock to Tab**: Easily convert floating windows to tabs with a single click.
- **Settings**: Added "Workspace Behavior" section to control tab preferences.
### Fixed
- **Browser/WordPress Cleanup**: Fixed an issue where closing the WordPress dashboard or Browser tab would leave "ghost" web views active, causing visual glitches in the chat interface.
- **Update Process**: Enhanced the update mechanism to include `npm audit fix` for better security and ensured `npm install` runs reliably.
- **Settings Modal**: Fixed the "Install Update" button logic to correctly trigger the enhanced update flow.

## [2.7.5] - 2025-11-28 👻 PHANTOM EDITOR PERSISTENCE
### 🛡️ Crash-Proof Editor
- **Instant Save-on-Exit**: Implemented a robust `beforeunload` handler that instantly saves your code when you close the tab, refresh, or navigate away.
- **Ref-Based State Tracking**: Uses `useRef` to capture the absolute latest keystrokes, ensuring zero data loss even if you type and immediately quit.
- **Faster Auto-Save**: Reduced auto-save delay from 2s to **1s** for near-real-time persistence.
- **Fixed File Creation**: "New File" button now actually creates the file in the database immediately, preventing "missing file" issues.
- **Full File Operations**: Implemented functional **Delete** and **Rename** handlers for the file tree.
- **UUID Generation**: Switched to `uuid` library for reliable, cross-browser ID generation.

### ⚙️ Editor Settings
- **Terminal Auto-Open**: New setting to control if the terminal opens automatically on launch.
- **Customization**: Added settings for Font Size, Tab Size, Word Wrap, Minimap, and Line Numbers.
- **Settings UI**: Dedicated 'Editor' tab in the Settings Modal.

### 🔧 Technical
- **useRef Implementation**: Solved React state closure staleness in event listeners.
- **Fire-and-Forget Saving**: Optimized save calls during unmount to ensure execution without blocking UI.

---

## [2.7.3] - 2025-11-27 🦠 MALWARE ANALYSIS & WINDOW MANAGEMENT
### 🦠 Malware Analysis Module (New)
- **Core Analysis Tools**:
  - `/malware-hash <file>`: Multi-hash calculation (MD5, SHA1, SHA256).
  - `/malware-fileinfo <file>`: Deep file type and metadata analysis.
  - `/malware-strings <file>`: Extract strings with filters (`--urls`, `--ips`, `--emails`).
  - `/malware-entropy <file>`: Calculate Shannon entropy to detect packing/encryption.
  - `/malware-hexdump <file>`: Canonical hex + ASCII dump.
  - `/malware-pe <file>`: Windows PE header analysis (Imports, Sections).
  - `/malware-elf <file>`: Linux ELF header analysis.
  - `/ioc-extract <file>`: Automated extraction of IPs, URLs, Emails, and Domains.
- **Containment & Testing**:
  - `/malware-quarantine <file>`: Securely isolate files and strip permissions.
  - `/malware-restore <hash>`: Restore files from quarantine.
  - `/malware-test-deploy`: Deploy "General Grievous" safe test malware.
  - `/malware-test-run`: Execute test malware for behavioral analysis.
- **Advanced Operations**:
  - `/vm-list`, `/vm-start`, `/vm-stop`: Control UTM/VirtualBox VMs.
  - `/msfconsole <cmd>`: Execute Metasploit commands on Kali VM via SSH.
  - `/msfvenom <opts>`: Generate payloads remotely.

### 🪟 Window Management System
  - **Normal Mode**: Traditional centered modal (max-width 4xl, 95vh)
  - **Fullscreen Mode**: Entire viewport takeover (100vh x 100vw, edge-to-edge)
  - **Minimized Mode**: Floating bar at bottom-left, positioned above Ranger Radio
  - **Quick Access**: Settings stays accessible while you work in the main app
- **🎮 Window Control Buttons**: Professional desktop app experience
  - **Minimize Button** (`−`): Shrink to floating bar (220px wide)
  - **Fullscreen Toggle** (`⛶`/`⊟`): Expand/compress between normal and fullscreen
  - **Close Button** (`✕`): Traditional close functionality
  - **Smart Icons**: Icons change based on current state (expand ↔ compress)
- **📍 Strategic Positioning**: Minimized bar floats at bottom-left
  - **Above Radio Player**: `bottom: 80px` (5rem) - perfect spacing!
  - **Gap from Radio**: ~12px visual separation
  - **Same Aesthetic**: Matches Ranger Radio player design
  - **Hover Effect**: Scale animation (1.05x) on hover
- **💾 State Persistence**: Remember your preferences
  - **localStorage Key**: `settings_window_mode`
  - **Auto-restore**: Opens in last used mode on next launch
  - **Seamless UX**: Never lose your preferred window configuration

### 🎨 UI/UX Enhancements
- **Smooth Transitions**: All mode changes animated with `transition-all duration-300`
- **Tron Theme Support**: Cyan glow effects on minimized bar and buttons
- **Hover States**: All buttons have opacity transitions and tooltips
- **Click-to-Restore**: Click anywhere on minimized bar to restore window
- **Backdrop Handling**: Blur backdrop only in normal mode, removed in fullscreen
- **Responsive Design**: Adapts perfectly to all screen sizes

### 🎯 Benefits
- **Multitasking**: Adjust settings while seeing real-time app changes
- **Desktop-Class UX**: Professional window management like native apps
- **Screen Optimization**: Fullscreen for complex configuration, minimize when done
- **M3 Pro Friendly**: Perfect for smaller laptop displays
- **Zero Interference**: Minimized mode stays out of your way

### 🔧 Technical Details
- Window modes: `'normal' | 'fullscreen' | 'minimized'`
- Minimized bar: Fixed positioning, z-index 9999
- Fullscreen: Removes max-width, rounds corners, and padding
- Header buttons: Icon-based with tooltips for clarity

---

## [2.7.2] - 2025-11-27 ⚙️ SETTINGS ENHANCEMENT

### ✨ Added
- **⚙️ Server Management in General Settings**: Consolidated server controls in General tab for easier access!
  - **Check for Updates**: GitHub integration to check latest RangerPlex version directly from General tab
  - **Install Update**: One-click update installation with progress feedback
  - **Reload Server**: Quick server restart without updating code (perfect for development)
  - **Stop Server**: PM2 server shutdown control with clear instructions for restart
  - **Beautiful UI Design**: Theme-aware styling with Tron mode support
  - **Loading States**: Spinning icons and disabled states during operations
  - **Success/Error Feedback**: Color-coded messages (green for success, red for errors)
  - **Icon Headers**: Font Awesome icons for visual clarity (GitHub, reload, stop)
  - **Responsive Layout**: Description on left, action buttons on right

### 🎯 Improvements
- **Increased Modal Height**: Settings modal now 95vh (was 90vh) for better content visibility
- **Better Organization**: All server controls accessible from General tab (no need to switch to GitHub tab)
- **Enhanced UX**: Consistent button styling across all server management actions
- **Small Screen Friendly**: Works perfectly on MacBook displays with new height adjustments

### 🎨 UI Enhancements
- Tron theme buttons with cyan glow effects
- Separated sections with border dividers
- Color-coded buttons: Gray (check), Blue (reload), Red (stop)
- Smooth transitions on all interactive elements

---

## [2.7.1] - 2025-11-27 🐾 PET WIDGET OPTIMIZATION

### ✨ Added
- **🐾 Ranger Pet Widget - Minimize/Collapse Feature**: Sidebar space optimization for smaller screens!
  - **Collapse Button**: Click chevron icon to minimize pet widget (saves ~150px of sidebar space)
  - **Collapsed View**: Compact display showing mini pet avatar (8x8), name, level, mood emoji, XP%, and quick action buttons (Feed 🍎 & Play 🎾)
  - **Persistent State**: localStorage saves your collapsed/expanded preference between sessions
  - **Smooth Animations**: Clean transitions with duration-300 ease
  - **Small Screen Optimization**: Perfect for M3 Pro MacBooks and other devices with limited vertical space
  - **More Chat Logs Visible**: Maximizes space for viewing recent chat history in sidebar

### 🎯 Improvements
- Enhanced sidebar usability on smaller displays
- Better mobile and laptop screen compatibility
- User preference persistence across sessions

---

## [2.7.0] - 2025-11-27 🕵️ FORENSICS MODULE DEPLOYED

### ✨ Added
- **🕵️ Forensics Module**: Comprehensive digital forensics toolkit integrated directly into RangerPlex.
  - **Hashing**: `/hash`, `/hash-verify`, `/hash-dir` (MD5, SHA1, SHA256, SHA512)
  - **Metadata**: `/metadata` (File stats), `/exif` (Image metadata)
  - **Timeline**: `/timeline` (Directory event reconstruction)
  - **Analysis**: `/strings` (Binary string extraction), `/grep` (Pattern search)
  - **Chain of Custody**: `/custody-create`, `/custody-update`, `/custody-verify` (Evidence tracking)
  - **Documentation**: Full command reference in `help-files/forensics/COMMAND_REFERENCE.md`
  - **Help Menu**: New "FORENSICS MODULE" section in `/help`

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
    - Port configuration (default: 5555)
    - Relay server URL input
    - Auto-start toggle
    - Real-time status panel (running/stopped + hardware info)
  - **Node Management**: Start/Stop/Restart blockchain node from UI
  - **Dashboard Access**: Direct link to blockchain node dashboard (http://localhost:5555)
  - **Secure Identification**: Each node identified by unique hardware UUID
  - **Graceful Shutdown**: Node stops cleanly when RangerPlex closes
  - **Smart Port Detection**: Prevents multiple instances from conflicting
  - **💬 Group Chat**: Peer-to-peer messaging between blockchain nodes!
    - Chat button in sidebar (💬 icon)
    - Real-time message broadcasting to all connected peers
    - Message history (last 100 messages)
    - Auto-refresh every 2 seconds
    - Shows online peer count
    - Perfect for testing M3Pro ↔ M4Max communication
  - **🔍 UDP Broadcast Discovery**: Local network peer discovery!
    - Automatic peer discovery on same WiFi/LAN (no manual IP entry!)
    - UDP broadcast on port 5005 every 5 seconds
    - Nodes automatically find and connect to each other
    - Works seamlessly for M3Pro ↔ M4Max communication
    - Zero-configuration networking

### 🔧 Fixed
- **Port Conflict**: Changed default port from 5000 → 5555 (macOS Control Center uses port 5000)
- **Dual Instance Prevention**: Added port-in-use detection to prevent crashes when running both PM2 and Electron modes
- **UDP Broadcast Error (EHOSTUNREACH)**: Fixed macOS network security blocking global broadcast (255.255.255.255) by calculating and using subnet broadcast address (e.g., 192.168.1.255). Discovery now works perfectly on all macOS versions!

### 🔧 Backend
- **blockchainService.cjs**: Complete node lifecycle management with port conflict detection
- **hardwareDetection.cjs**: Mac hardware UUID detection (M1/M2/M3/M4)
- **RangerBlockNode.cjs**: Full P2P blockchain node with:
  - WebSocket networking on port 5555
  - UDP broadcast discovery on port 5005
  - Subnet broadcast calculation (`getBroadcastAddress()`)
  - Chat message flood routing
  - Automatic peer connection
- **relay-server.cjs**: Discovery server for cross-network nodes
- **BlockchainChat.tsx**: React component for P2P group chat UI
- **API Endpoints**:
  - `GET /api/rangerblock/status` - Node status
  - `POST /api/rangerblock/start` - Start node
  - `POST /api/rangerblock/stop` - Stop node
  - `POST /api/rangerblock/restart` - Restart node
  - `POST /api/rangerblock/config` - Update config
  - `GET /api/rangerblock/config` - Get config
  - `GET /api/rangerblock/chat` - Get chat messages
  - `POST /api/rangerblock/chat` - Send chat message
- **Database Integration**: Settings saved to SQLite database

### 🎯 Next Steps
- ✅ ~~Group chat functionality~~ **COMPLETE!**
- ✅ ~~Local network discovery~~ **COMPLETE!**
- Relay server deployment guide
- Multi-machine blockchain testing (ready to test!)

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

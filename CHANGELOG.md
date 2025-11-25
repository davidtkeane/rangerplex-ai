# 📜 RangerPlex Changelog & Journey

*Built with a little help from friends: Ranger, plus Gemini, Claude, and ChatGPT keeping the studio sharp.*

## v2.5.11 - "Study Clock Command" 🕐
*Released: Nov 25, 2025*

**Focus from the Chat.** Added `/study` command to open the Study Clock directly from chat without switching to the sidebar.

### 🕐 Study Clock Integration
*   **New Command**: `/study`
*   **Function**: Opens the Study Clock widget with an encouraging message
*   **Quick Access**: No need to click sidebar button - just type the command
*   **Motivational Response**: Shows keyboard shortcuts and pro tips when activated
*   **Discoverability**: Added to `/help` menu under SYSTEM section
*   **Help Integration**: Type `/help study` for full feature list and usage guide

### 📘 Features Highlighted
*   🍅 Pomodoro Mode (25-min work, 5-min breaks)
*   ⚙️ Custom Timers (set any duration)
*   ⌨️ Keyboard Shortcuts (Space, R, M)
*   📊 Today's Stats (study time + pomodoros)
*   🔔 Desktop Notifications
*   💾 3-Tier Persistence

### ⚙️ Files Modified
*   `App.tsx` - Added `onOpenStudyClock` prop to ChatInterface
*   `components/ChatInterface.tsx` - Added `/study` command handler with motivational message
*   `components/Sidebar.tsx` - Version bump to 2.5.11
*   `services/dbService.ts` - Export metadata version bump to 2.5.11
*   `package.json` - Version bump to 2.5.11
*   `README.md` - Version badge updated to 2.5.11

## v2.5.10 - "In-App Manual & /manual Command" 📘
*Released: Nov 25, 2025*

**Docs, now in the chat flow.** A built-in manual overlay opens from `/manual`, with a back button and a new-tab link, bundling the markdown so it works offline.

### 📘 Manual Enhancements
*   **New Command:** `/manual` opens the in-app manual viewer; Back returns to chat, “Open in new tab” uses a bundled copy.
*   **Offline-Friendly:** Manual content is bundled via blob URL; works without network.
*   **Doc Updates:** Manual expanded with command coverage and version bump.

### ⚙️ Files Modified
*   `components/ManualViewer.tsx` - Added overlay viewer with back + new-tab.
*   `components/ChatInterface.tsx` - `/manual` command opens the viewer.
*   `App.tsx` - Wires manual overlay state.
*   `rangerplex_manule.md` - Updated version and shortcuts with `/manual`.
*   `components/Sidebar.tsx` - Version label to 2.5.10.
*   `services/dbService.ts` - Export metadata version bump to 2.5.10.
*   `package.json` - Version bump to 2.5.10.
*   `README.md` - Version badge updated to 2.5.10.

## v2.5.11 - "HD Wallet Ready" 🏦
*Released: Nov 25, 2025*

**Smarter Blockchain Analysis.** The Wallet Inspector now includes critical guidance on Hierarchical Deterministic (HD) wallets to prevent confusion.

### 🏦 Wallet Inspector Upgrade
*   **HD Wallet Awareness**: Added comprehensive help documentation explaining why single-address scans might show 0 BTC for HD wallets (Sparrow/Electrum).
*   **Help System Fix**: Resolved a UI glitch where the Profile command help was merged with Wallet help.
*   **Verified Accuracy**: Validated against real-world Sparrow Wallet UTXO data.

### ⚙️ Files Modified
*   `components/ChatInterface.tsx` - Updated `/help wallet` and fixed `/help profile`.
*   `package.json` - Version bump to 2.5.11.

## v2.5.10 - "Wallet Inspector" 🏦
*Released: Nov 25, 2025*

**Follow the Blockchain.** Deep dive into Bitcoin transactions with the new Wallet Inspector.

### 🏦 Bitcoin Wallet Inspector
*   **New Command**: `/wallet <address>`
*   **Function**: Scans the Bitcoin blockchain via BlockCypher to reveal balance, total received/sent, and transaction count.
*   **Visuals**: Displays a detailed financial report including USD value conversion.
*   **No API Key**: Uses public endpoints for instant access.

### ⚙️ Files Modified
*   `proxy_server.js` - Added `/api/tools/wallet` endpoint.
*   `components/ChatInterface.tsx` - Added `/wallet` command and updated Help UI.
*   `package.json` - Version bump to 2.5.10.

## v2.5.9 - "Crypto Intel" 💰
*Released: Nov 25, 2025*

**Follow the Money.** Real-time cryptocurrency market intelligence is now at your fingertips.

### 💰 Crypto Intelligence
*   **New Command**: `/crypto <symbol>` (e.g., `/crypto btc`)
*   **Function**: Fetches real-time price, 24h change, market cap, and rank from CoinGecko.
*   **Visuals**: Displays a clean financial card with up/down trend indicators and coin icons.
*   **No API Key**: Uses public endpoints for instant access.

### ⚙️ Files Modified
*   `proxy_server.js` - Added `/api/tools/crypto` endpoint.
*   `components/ChatInterface.tsx` - Added `/crypto` command and updated Help UI.
*   `package.json` - Version bump to 2.5.9.

## v2.5.9 - "Welcome to RangerPlex" 💠
*Released: Nov 25, 2025*

**The Introduction.** Added a friendly `/about` command to introduce new users to RangerPlex, the Trinity, and the mission.

### 💠 About Command
*   **New Command**: `/about`
*   **Function**: Displays a comprehensive welcome message introducing:
    *   RangerPlex platform and its purpose
    *   The Trinity AI system (Claude, Gemini, Ollama Rangers)
    *   Commander David T. Keane (IrishRanger) and his mission
    *   Core mission: "Disabilities → Superpowers"
*   **Discoverability**: Added to `/help` menu under new "SYSTEM" section.
*   **Help Integration**: Type `/help about` for details about the command.

### ⚙️ Files Modified
*   `components/ChatInterface.tsx` - Added `/about` command logic and updated Help menu with SYSTEM section.
*   `package.json` - Version bump to 2.5.9.
*   `README.md` - Updated version badge to 2.5.9.

## v2.5.8 - "Sherlock Scout" 🔎
*Released: Nov 25, 2025*

**The Hunt is On.** Added a powerful OSINT tool for tracking digital footprints across the social web.

### 🔎 Sherlock Username Scout
*   **New Command**: `/sherlock <username>`
*   **Function**: Scans 12+ major platforms (GitHub, Reddit, Twitch, Steam, etc.) to find if a username is taken.
*   **Privacy**: All scans are performed locally from your server, keeping your investigations private.

### 📘 UI Enhancements
*   **Tactical Dashboard**: Upgraded the `/help` menu to a futuristic, ASCII-art command center HUD.

### ⚙️ Files Modified
*   `proxy_server.js` - Added `/api/tools/sherlock` endpoint.
*   `components/ChatInterface.tsx` - Added `/sherlock` command and updated Help UI.
*   `package.json` - Version bump to 2.5.8.

## v2.5.7 - "Tactical Help System" 📘
*Released: Nov 25, 2025*

**Master Your Tools.** A comprehensive help system is now built directly into the chat, providing instant manuals and AI-powered learning for every tool.

### 📘 New Features
*   **Help Command**: Added `/help` to list all available tools and commands.
*   **Detailed Manuals**: Type `/help <command>` (e.g., `/help shodan`) to get specific usage instructions, purpose, and "Pro Tips."
*   **AI Teaching Mode**: Help pages include "Ask AI" prompts (e.g., "What is Shodan?") that let you instantly learn more about the underlying technology from the AI.

### ⚙️ Files Modified
*   `components/ChatInterface.tsx` - Added `/help` command logic and manual pages.
*   `package.json` - Version bump to 2.5.7.

## v2.5.6 - "Profiler Hotfix" 🛠️
*Released: Nov 25, 2025*

**Stability Update.** Fixed a critical bug in the Profiler agent that caused crashes due to uninitialized context variables.

### 🐛 Bug Fixes
*   **Profiler Crash**: Resolved `Cannot access 'relevantContext' before initialization` error by decoupling the Profiler's AI call from the standard RAG pipeline.
*   **Stability**: Improved error handling for failed API calls within the Profiler workflow.

### ⚙️ Files Modified
*   `components/ChatInterface.tsx` - Fixed `relevantContext` scope issue in `/profile` command.
*   `package.json` - Version bump to 2.5.6.

## v2.5.5 - "The Profiler" 🕵️
*Released: Nov 25, 2025*

**Automated Threat Intelligence.** The new Profiler agent combines all our reconnaissance tools into a single, powerful workflow.

### 🕵️ The Profiler
*   **Automated Agent**: Added `/profile <domain>` command.
    *   **Multi-Stage Scan**: Automatically runs Whois, DNS, SSL, and Shodan scans in sequence.
    *   **AI Analysis**: Feeds all gathered data into the active AI model (Gemini/Claude/GPT) with a specialized "Cyber Threat Analyst" system prompt.
    *   **Comprehensive Report**: Generates a professional Threat Intelligence Report covering Executive Summary, Infrastructure, Security Posture, and Recommendations.

### ⚙️ Files Modified
*   `components/ChatInterface.tsx` - Added `/profile` command with multi-stage fetch and AI prompt injection.
*   `package.json` - Version bump to 2.5.5.

## v2.5.4 - "The Site Auditor" 🔐
*Released: Nov 25, 2025*

**Deep Web Analysis.** This update introduces advanced tools to inspect the security posture of any website, from SSL certificates to HTTP headers.

### 🔐 Site Auditor Tools
*   **SSL Inspector**: Added `/ssl <domain>` command.
    *   **Certificate Analysis**: Checks validity, issuer (e.g., Let's Encrypt, DigiCert), and expiration date.
    *   **Fingerprinting**: Displays the SHA-1 fingerprint and serial number.
    *   **Expiry Warning**: Color-coded alerts if a certificate is expiring within 30 days.
*   **Headers Auditor**: Added `/headers <url>` command.
    *   **Security Posture**: Scans for critical security headers like HSTS, CSP, and X-Frame-Options.
    *   **Vulnerability Check**: Instantly spots missing protections that leave sites open to clickjacking or XSS.

### ⚙️ Files Modified
*   `components/ChatInterface.tsx` - Added `/ssl` and `/headers` command logic.
*   `proxy_server.js` - Added `/api/tools/ssl` and `/api/tools/headers` endpoints using native Node.js modules.
*   `package.json` - Version bump to 2.5.4.

## v2.5.3 - "The Eye of God" 👁️
*Released: Nov 25, 2025*

**Complete Situational Awareness.** This update adds the final pieces to the security suite: Shodan for infrastructure reconnaissance and Have I Been Pwned for identity defense.

### 👁️ New Intelligence Tools
*   **Shodan Integration**: Added `/shodan <ip>` command.
    *   **"The Search Engine for Hackers"**: Scans IP addresses for open ports, services, OS details, and vulnerabilities.
    *   **Deep Intel**: Reveals what a server is actually running (e.g., Apache, Nginx, webcams) and any known CVEs.
    *   *Requires a free Shodan API key.*
*   **Identity Defense**: Added `/breach <email>` command.
    *   **Have I Been Pwned**: Checks if an email address has appeared in known data breaches.
    *   **Detailed Reports**: Lists specific breaches, dates, and exactly what data was compromised (passwords, phone numbers, etc.).
    *   *Requires a free HIBP API key.*

### ⚙️ Files Modified
*   `components/ChatInterface.tsx` - Added `/shodan` and `/breach` command logic.
*   `components/SettingsModal.tsx` - Added API key inputs for Shodan and HIBP.
*   `proxy_server.js` - Added secure proxy endpoints for Shodan and HIBP.
*   `types.ts` - Updated settings interfaces.
*   `package.json` - Version bump to 2.5.3.

## v2.5.2 - "Copy Parity & UX Polish" ✨
*Released: Nov 25, 2025*

**Copy controls now match for you and the AI.** Added quick copy buttons under every message (user + AI) and a “copy last message” control under the chat box for fast sharing.

### 🧭 UX Improvements
*   **Per-Message Copy**: A small pill under each message to copy its text (works for user and AI, theme-aware feedback).
*   **Copy Last Message**: Single button under the chat input to grab the most recent message in the thread.

### ⚙️ Files Modified
*   `components/MessageItem.tsx` - Add per-message copy pill with feedback.
*   `components/ChatInterface.tsx` - Add “copy last message” control near the input.
*   `components/Sidebar.tsx` - Version label to 2.5.2.
*   `services/dbService.ts` - Export metadata version bump to 2.5.2.
*   `package.json` - Version bump to 2.5.2.
*   `README.md` - Version badge updated to 2.5.2.

## v2.5.1 - "OSINT & Network Recon" 🕵️
*Released: Nov 25, 2025*

**Knowledge is power.** This update introduces powerful Open Source Intelligence (OSINT) tools to gather public data on domains and infrastructure directly from the chat.

### 🕵️ OSINT Tools
*   **Whois Lookup**: Added `/whois <domain>` command.
    *   Fetches official registration data via RDAP (Registration Data Access Protocol).
    *   Displays Registrar, Creation/Expiry dates, and Domain Status.
*   **DNS Resolver**: Added `/dns <domain>` command.
    *   Performs deep DNS lookups using the local server's native networking.
    *   Retrieves A (IPv4), AAAA (IPv6), MX (Mail), TXT (Verification), and NS (Nameserver) records.
*   **Infrastructure**: Added `/api/tools/dns` and `/api/tools/whois` endpoints to the local proxy server.

## v2.5.0 - "VirusTotal Integration" 🛡️
*Released: Nov 25, 2025*

**Security upgrade!** Now you can scan suspicious URLs directly from the chat using the new VirusTotal integration.

### 🛡️ Security Tools
*   **VirusTotal Scanner**: Added `/scan <url>` command to check URLs against VirusTotal's database.
    *   **Instant Reports**: Shows Malicious/Suspicious/Harmless counts directly in chat.
    *   **Direct Links**: One-click access to full VirusTotal reports.
    *   **Secure Proxy**: API requests are routed through the local server to protect your API key and avoid CORS issues.
*   **Settings Integration**: Added VirusTotal API Key field in **Settings > Providers** with a connection test button.

### ⚙️ Files Modified
*   `components/ChatInterface.tsx` - Added `/scan`, `/whois`, and `/dns` commands.
*   `proxy_server.js` - Added secure proxy endpoints for VirusTotal and OSINT tools.
*   `package.json` - Version bump to 2.5.1.

## v2.4.14 - "Final Polish & Release Candidate" 🚀
*Released: Nov 25, 2025*

**The final polish before public release!** This update streamlines the Radio Player experience by removing problematic auto-play features that conflict with modern browser policies, ensuring a smooth, error-free startup every time.

### 📻 Radio Player Refinement
*   **Removed Auto-Play**: Deprecated the "Auto-play on startup" feature. Browser policies strictly block audio from playing without user interaction, causing confusion and "spinning wheel" errors.
*   **Startup Fix**: Fixed a race condition where the radio player would show a loading spinner indefinitely on page refresh. The player now correctly initializes in a "ready" state, waiting for user input.
*   **Cleaned Settings**: Removed the obsolete auto-play toggle from the Settings menu to prevent user confusion.

### ⚙️ Files Modified
*   `components/RadioPlayer.tsx` - Logic improvements for startup state.
*   `components/SettingsModal.tsx` - Removed deprecated UI elements.
*   `types.ts` - Cleaned up obsolete type definitions.
*   `package.json` - Version bump to 2.4.14.

---

## v2.4.13 - "Radio Polish & Security Audit" (Current) 📻
*Released: Nov 25, 2025*

**Radio Player UX improvements and security tools.** This update refines the Radio Player's auto-play behavior to be more user-friendly and provides tools for auditing browser security.

### 📻 Radio Player Enhancements
*   **"Click to Start" Overlay**: Added a clear, pulsing button when the browser blocks auto-play. This replaces the confusing infinite spinner with a direct call to action.
*   **Infinite Spinner Fix**: Resolved a logic bug where the loading spinner would persist indefinitely if auto-play was blocked or if the stream started successfully but the state wasn't updated.
*   **Robust Error Handling**: Improved state management to ensure the player always exits the "loading" state, whether successful, blocked, or failed.

### 🛡️ Security Tools
*   **Browser Audit Guide**: Added `help-files/BROWSER_AUDIT_README.md` with a comprehensive guide on how to audit and surgically clean browser storage (LocalStorage/IndexedDB) without wiping all data.
*   **Audit Script**: The guide includes a JavaScript snippet that can be run in the browser console to identify exposed API keys.

### 🐛 Bug Fixes
*   **Settings Persistence**: Confirmed that `dbService` correctly redacts sensitive data in logs while saving valid settings to IndexedDB.
*   **API Key Fallback**: Verified that the application correctly falls back to `.env` values when user settings are cleared or missing.

### ⚙️ Files Modified
*   `components/RadioPlayer.tsx` - Added overlay button and fixed loading state logic.
*   `help-files/BROWSER_AUDIT_README.md` - New help guide.
*   `package.json` - Version bump to 2.4.13.

---

## v2.4.12 - "Security & Stability" 🛡️
*Released: Nov 25, 2025*

**Critical security and stability update.** This release addresses a security incident involving accidental API key exposure, implements robust log sanitization to prevent future leaks, and improves the reliability of the Radio Player.

### 🛡️ Security Enhancements
*   **Log Sanitization**: Updated `dbService.ts` to automatically redact sensitive keys (apiKey, token, password, secret) from console logs.
*   **Clean Logs**: Removed unsafe `console.log` statements in `App.tsx` that were printing entire settings objects.
*   **Emergency Guide**: Added `docs/GIT_EMERGENCY_GUIDE.md` for handling accidental git commits of sensitive data.
*   **Security Audit Script**: Added `docs/BROWSER_SECURITY_CHECK.js` to help users scan their browser storage for exposed keys.

### 🐛 Bug Fixes
*   **Radio Player Auto-Play**: Fixed `NotAllowedError` when radio attempts to auto-play without user interaction. It now gracefully waits for interaction instead of throwing an error.
*   **TypeScript Fixes**: Resolved `audioContextRef` type error in `RadioPlayer.tsx`.

### ⚙️ Files Modified
*   `services/dbService.ts` - Added log redaction logic.
*   `App.tsx` - Removed unsafe logging.
*   `components/RadioPlayer.tsx` - Improved error handling and fixed types.
*   `docs/GIT_EMERGENCY_GUIDE.md` - New guide.
*   `docs/BROWSER_SECURITY_CHECK.js` - New script.
*   `package.json` - Version bump to 2.4.12.

---

## v2.4.11 - "Stability & Sync Polish" ✨
*Released: Nov 25, 2025*

**Critical stability fixes and sync improvements!** This update resolves a major infinite loop issue in the Pet Widget, fixes server startup errors caused by dependency mismatches, and significantly improves the reliability of the data synchronization queue to prevent data loss during connection drops.

### 🐛 Bug Fixes & Stability
*   **Pet Widget Infinite Loop**: Fixed a critical bug where `recordVisit` was called on every render, causing a "Maximum update depth exceeded" error. Implemented a `useRef` guard to ensure visits are recorded only once per session.
*   **Server Startup Fix**: Resolved a `better-sqlite3` version mismatch error that prevented the backend server from starting. Rebuilt dependencies to match the current Node.js environment.
*   **Sync Queue Reliability**: Improved `syncService.ts` to prevent data loss. The system now checks connection status before removing items from the queue, ensuring that data is only dequeued when it can be successfully sent.
*   **Connection Refused Errors**: Fixed persistent `net::ERR_CONNECTION_REFUSED` errors by ensuring the backend server is correctly built and running on port 3010.

### ⚙️ Files Modified
*   `components/PetWidget.tsx` - Added `useRef` guard for `recordVisit`.
*   `services/syncService.ts` - Enhanced queue flushing logic with connection checks.
*   `package.json` - Version bump to 2.4.11.
*   `node_modules` - Rebuilt `better-sqlite3`.

---

## v2.4.10 - "Canvas Customization & Polish" ✨
*Released: Nov 25, 2025*

**Canvas boards get a major upgrade!** You can now customize the background color of your infinite canvas boards, choosing between sleek Black, professional Gray, or classic White. Plus, critical bug fixes and polish for a smoother experience.

### 🎨 Canvas Board Customization
*   **Background Color Selection**: Choose your preferred canvas background color when creating a new board.
    *   **Black**: High contrast, perfect for dark mode users (default for "Matrix" theme).
    *   **Gray**: Balanced, professional look for diagrams and wireframes.
    *   **White**: Classic whiteboard feel for sketching and notes.
*   **Default Preference**: Set your preferred default background color in **Settings > Canvas**.
    *   New boards will automatically use this color unless you override it.
    *   The initial "landing" board respects this setting immediately.
*   **Enhanced Creation Modal**: Updated UI to include color selection alongside pattern choice.

### 🐛 Bug Fixes & Polish
*   **App Stability**: Fixed a critical `isOpen` prop error that could cause the app to crash when opening the canvas.
*   **Typo Fixes**: Resolved `currentId` vs `currentSessionId` variable naming inconsistencies in `App.tsx`.
*   **Missing Imports**: Fixed `DEFAULT_SAVED_PROMPTS` import error.
*   **Database Service**: Added missing `getAllUsers` method to `dbService.ts` to support data migration scripts.
*   **Canvas Props**: Restored `width` and `height` props to `CanvasBoard` component for better control.

### ⚙️ Files Modified
*   `src/components/CanvasBoard.tsx` - Added color support and restored props.
*   `src/components/BoardCreationModal.tsx` - Added color selector UI.
*   `src/hooks/useCanvasBoards.ts` - Updated board data structure for color persistence.
*   `src/hooks/useCanvasBackground.ts` - Updated drawing logic for colored backgrounds.
*   `components/SettingsModal.tsx` - Added Canvas settings tab.
*   `App.tsx` - Integrated default color settings and fixed bugs.
*   `types.ts` - Updated AppSettings interface.
*   `services/dbService.ts` - Added helper method.
*   `package.json` - Version bump to 2.4.10.
*   `README.md` - Version badge updated.

---

## v2.4.9 - "UI Polish & Timer Controls" ✨
*Released: Nov 24, 2025*

**Major UI refinements and Study Clock enhancements!** This update focuses on improving usability, maximizing screen real estate, and giving you complete control over your study timer. Every pixel counts, every click matters! 🎖️

### ✨ Study Clock Enhancements

#### 🎛️ Custom Timer Controls
*   **Custom Time Input**: Set any time duration you want!
    *   Input field accepts minutes (e.g., "3" for 3 minutes, "2.5" for 2 min 30 sec)
    *   "Set Time" button or press Enter to apply
    *   Perfect for custom study sessions beyond Pomodoro technique
*   **Main Control Buttons**: Clear, intuitive controls
    *   ▶️ **Start** - Begin your focus session
    *   ⏸️ **Pause** - Take a quick break without resetting
    *   🔄 **Reset** - Return to initial time
*   **Quick Time Adjustment Grid**: Fast time modifications
    *   **Top Row (Add Time)**: +10m and +20m buttons
    *   **Bottom Row (Subtract Time)**: -10m and -20m buttons
    *   Smart disable state when insufficient time remaining
    *   Beautiful color-coded gradients (green for add, red for subtract)
*   **Full Theme Support**: All new controls styled for every theme
    *   Dark, Light, Tron, and Matrix color schemes
    *   Consistent hover animations and visual feedback
    *   Theme-aware input field styling with focus effects

### 🎨 UI/UX Improvements

#### 📏 Sidebar Optimization - More Space for What Matters
*   **Compact Button Layout**: Maximized space for chat logs
    *   Removed "Train" and "Data" buttons from sidebar
    *   Kept only 3 essential tools: Notes, Study (formerly "Timer"), Canvas
    *   Saves ~50-80px of vertical space = 3-5 more visible chat logs!
    *   3-column grid layout with icon-first design
*   **Relocated Administrative Functions**: Better organization
    *   Model Training moved to Settings → Data & Tools tab
    *   Data & Export functions moved to Settings → Data & Tools tab
    *   Export Current Chat, Export All Data, Purge All Data now in Settings
    *   Cleaner separation between daily tools and admin functions
*   **Button Renaming**: "Timer" → "Study" for clarity

#### 🐾 Ranger Pet Visual Polish
*   **White Background Card**: Beautiful contrast and definition
    *   Pure white (`bg-white`) in light mode
    *   Lighter dark gray (`bg-zinc-800`) in dark mode
    *   Refined borders for crisp edges
*   **Enhanced Text Contrast**: Better readability
    *   Darker, bolder pet name text
    *   Improved level and mood text colors
    *   Message bubble with subtle background
*   **Progress Bar Refinements**: Clearer visual feedback
    *   Light gray backgrounds with borders
    *   Better separation from card background
    *   Labels showing percentages (Happiness, Energy, XP)

### 🐛 Bug Fixes

#### 🖱️ Action Button Clickability Fixed
*   **Chat Log Actions**: Edit, Star, and Delete buttons now fully responsive
    *   Increased z-index to `z-50` for proper layering
    *   Added `cursor-pointer` for clear visual feedback
    *   Added `pointer-events-none` to icons for reliable click targeting
    *   Semi-transparent background for better visibility
    *   Fixed click event propagation issues
*   **Problem**: Buttons appeared and showed hover states but clicks weren't registering
*   **Solution**: Multi-layered approach with z-index stacking, event handling, and visual cues

#### 📐 Layout & Positioning Fixes
*   **Sidebar Positioning**: Logo and title now always visible
    *   Changed from `md:relative` to always `fixed`
    *   Removed `md:top-auto` - sidebar now always starts at `top-0`
    *   Changed `h-full` to `h-screen` for full viewport height
*   **Main Content Area**: Proper spacing restored
    *   Added permanent `md:ml-72` (288px) left margin on desktop
    *   Content no longer hidden underneath sidebar
    *   Logo, Tron scanner bar, and all content properly positioned

### 🏗️ Technical Details

#### Study Clock Infrastructure
*   **New Components**:
    *   Custom time input field with validation
    *   Grid-based quick adjustment controls
    *   Theme-aware styling system
*   **CSS Enhancements**:
    *   Added `.custom-time-input`, `.time-input`, `.set-time-btn` classes
    *   Added `.quick-actions-row`, `.quick-btn.add`, `.quick-btn.subtract` classes
    *   Theme-specific styles for all input elements
    *   Gradient backgrounds for action buttons
*   **State Management**: Custom minutes input with React hooks

#### Settings Modal Updates
*   **New "Data & Tools" Tab**: Consolidated admin functions
    *   Quick Tools section (Model Training, Backup & Restore)
    *   Export & Purge section (Export Chat/All, Purge Data)
    *   All existing data management features preserved
*   **Props Added**: `onOpenTraining`, `sessions`, `currentId`, `onExportChat`, `onExportAll`, `onPurgeAll`

### 📦 Files Modified
*   `components/StudyClock.tsx` - Custom controls and UI enhancements
*   `components/StudyClock.css` - New control styles and theme support
*   `components/Sidebar.tsx` - Compact layout, button renaming, action button fixes
*   `components/PetWidget.tsx` - White background and visual polish
*   `components/SettingsModal.tsx` - New Data & Tools tab
*   `App.tsx` - Settings modal integration, layout fixes
*   `services/dbService.ts` - Version bump to 2.4.9
*   `package.json` - Version bump to 2.4.9

---

## v2.4.8 - "Study Clock: Focus & Transform" 🕐
*Released: Nov 24, 2025*

**The transformation continues!** This major update introduces the **Study Clock** - a comprehensive Pomodoro timer system with full 3-Tier Persistence, designed specifically to help students with ADHD and dyslexia build healthy study habits and transform disabilities into superpowers! 🎖️

### ✨ New Features - Study Clock MVP

#### 🕐 Core Timer System
*   **Floating Widget Interface**: Beautiful bottom-left positioned timer that doesn't interfere with your workflow
    *   Minimize/maximize toggle for distraction-free focus
    *   Two view modes: compact (minimized) and detailed (maximized)
    *   Smooth animations and theme-aware styling (dark/light/Tron/Matrix)
    *   Draggable positioning (future enhancement planned)
*   **Precise Countdown Timer**: Accurate second-by-second countdown with visual feedback
    *   Large, clear timer display (48px font) for easy reading
    *   MM:SS format with leading zeros
    *   Real-time updates via React hooks
*   **Essential Controls**:
    *   ▶️ **Play/Pause**: Start or pause your focus session
    *   🔄 **Reset**: Restart the current timer
    *   **Quick Adjustments**: +1m, +5m, -1m buttons for on-the-fly changes
    *   **Keyboard Shortcuts**: Space (play/pause), R (reset), M (minimize), +/- (adjust time)

#### 🍅 Pomodoro Technique Implementation
*   **Classic Pomodoro Cycles**:
    *   25-minute work sessions (default, fully configurable)
    *   5-minute short breaks after each pomodoro
    *   15-minute long breaks after 4 pomodoros
    *   Automatic cycle progression with visual phase indicators
*   **Smart State Machine**:
    *   Tracks current session (1-4 pomodoros)
    *   Auto-start breaks (configurable)
    *   Auto-start work sessions (configurable)
    *   Clear work/break mode indicators with color coding
*   **Session Counter**: Real-time display of completed pomodoros
*   **Circular Progress Ring**: Beautiful visual representation of time remaining
    *   Smooth animations (1-second transitions)
    *   Color-coded: Green for work, Blue for breaks
    *   Tron/Matrix themes with glowing effects

#### 📊 Session Tracking & Statistics
*   **Complete Session History**: Every study session saved with full metadata
    *   Start/end timestamps
    *   Duration tracking
    *   Timer type (pomodoro/countdown/stopwatch)
    *   Break vs work session identification
    *   Pomodoro number in cycle
    *   Completion status (completed vs interrupted)
*   **Today's Quick Stats**: Instant overview in the widget
    *   Total study time today
    *   Pomodoros completed today
    *   Real-time updates after each session
*   **Data Persistence**: All sessions stored with zero data loss guarantee
    *   Survives page reloads
    *   Survives browser cache clearing
    *   Works completely offline
    *   Optional cloud sync for cross-device access

#### 🔔 Notifications & Alerts
*   **Desktop Notifications**: Browser notifications when sessions complete
    *   Permission request on first use
    *   Custom messages for work completion and break completion
    *   Non-intrusive, dismissible notifications
*   **Audio Chimes**: Subtle sound alerts (configurable)
    *   Plays on session completion
    *   Volume controlled (0.5 by default)
    *   Can be disabled in settings
*   **Visual Feedback**: Clear on-screen indicators
    *   Phase transitions clearly marked
    *   Success states highlighted

#### ♿ Accessibility Features (ADHD & Dyslexia Friendly)
*   **ADHD Support**:
    *   Clear time boundaries reduce anxiety
    *   Immediate visual feedback for instant gratification
    *   Structured breaks prevent burnout
    *   Session tracking builds momentum and motivation
    *   Gamification potential (achievements coming in Phase 2)
*   **Dyslexia-Friendly Design**:
    *   Large fonts (48px timer, 18px session info)
    *   High contrast colors for maximum readability
    *   Minimal text, maximum visual cues
    *   Color coding: Green = work, Blue = break, Red = paused
    *   Simple, uncluttered layout
*   **Universal Accessibility**:
    *   Full keyboard navigation support
    *   Touch-friendly controls (44px minimum tap targets)
    *   Screen reader compatible (ARIA labels)
    *   Reduced motion support (respects user preferences)

### 🛡️ Infrastructure - 3-Tier Persistence for Study Clock

*Following the RangerPlex 3-Tier Persistence Standard for zero data loss.*

#### Tier 1: localStorage (Hot Cache)
*   **Purpose**: Instant UI state restoration, < 100ms load time
*   **Stores**: Current timer state, today's quick stats, UI preferences (minimized/maximized)
*   **Key**: `study_clock_state_<username>`
*   **Update**: Synchronous, immediate on every state change
*   **Limit**: < 100KB (lightweight for speed)

#### Tier 2: IndexedDB (The Vault - Source of Truth)
*   **Purpose**: Persistent local storage, survives cache clearing
*   **New Object Store**: `study_sessions` with compound indexes
    *   Primary key: `id` (UUID)
    *   Indexes: `by-userId`, `by-startTime`, `by-created`
*   **Stores**: Complete session history, settings, daily/weekly statistics
*   **Update**: Asynchronous, debounced (500ms)
*   **Capacity**: 50MB - 1GB+ (handles thousands of sessions)
*   **Migration**: Automatic migration from localStorage on first load

#### Tier 3: Cloud Sync (Optional Cross-Device Sync)
*   **Purpose**: Backup and cross-device synchronization
*   **Syncs**: Completed sessions, achievement unlocks (Phase 2), settings changes
*   **Endpoints**: `/api/study-sessions/save`, `/api/study-sessions/:userId/:date`
*   **Behavior**: Queued via autoSaveService, retry-able, never blocks UI
*   **Offline Support**: Queues updates when offline, syncs when connection restored

### 🗂️ New Files & Components

#### React Components
*   `components/StudyClock.tsx` (280 lines)
    *   Main floating widget component
    *   Circular progress ring sub-component
    *   Minimized and maximized views
    *   Keyboard shortcut handling
    *   Notification management
*   `components/StudyClock.css` (350 lines)
    *   Complete theme support (dark/light/Tron/Matrix)
    *   Responsive design (mobile + desktop)
    *   Animation keyframes
    *   Touch-friendly styles

#### React Hooks
*   `hooks/useStudyTimer.ts` (393 lines)
    *   Core timer logic with React state management
    *   3-Tier Persistence orchestration
    *   Pomodoro state machine
    *   Session lifecycle management
    *   Hydration from all 3 tiers on startup
    *   Time formatting utilities

#### Services
*   `services/studySessionDbService.ts` (270 lines)
    *   Tier 2 (IndexedDB) CRUD operations
    *   Session retrieval by date/date range
    *   Daily statistics calculation
    *   Study streak calculation
    *   Subject grouping and analysis
    *   Migration from localStorage
*   Updated `services/autoSaveService.ts`
    *   Added `queueStudySessionSave()` function
    *   Added `queueStudySessionsSave()` for batch operations
    *   500ms debouncing for performance
*   Updated `services/dbService.ts`
    *   Incremented schema version to v5
    *   Added `study_sessions` object store with indexes
    *   Export/import support for study sessions

#### Type Definitions
*   Updated `types.ts` with Study Clock interfaces:
    *   `StudyClockSettings` - 17 configuration options
    *   `TimerMode` - Timer type and duration
    *   `TimerState` - Current timer state
    *   `StudyClockState` - Complete widget state
    *   `DEFAULT_STUDY_CLOCK_SETTINGS` - Sensible defaults

### 🔧 Integrations & UI Updates

*   **Sidebar Navigation**: New "Study Clock" button (🕐 icon)
    *   Located below "Study Notes" in the sidebar
    *   Opens floating widget on click
    *   Proper state management via App.tsx
*   **App.tsx Integration**: Study Clock rendered conditionally
    *   Only shows when user is logged in
    *   Controlled by `isStudyClockOpen` state
    *   Cloud sync enabled if user has it configured
    *   Positioned to not interfere with other UI elements

### 🐛 Bug Fixes

*   **Sidebar Positioning Issue**: Fixed Sidebar being cut off at top of screen
    *   Updated z-index from `z-50` to `z-[100]` for proper layering
    *   Added responsive positioning: `top-0 md:top-auto left-0 md:left-auto`
    *   Fixed translate classes: `md:translate-x-0` for desktop visibility
    *   Sidebar now properly displays logo and "RANGERPLEX" title at top

### 📖 Documentation Updates

*   `docs/study-clock/STUDY_CLOCK_PLAN.md` updated with:
    *   Complete 3-Tier Persistence Architecture section
    *   Tier breakdown for Study Clock data
    *   Zero Loss Guarantee checklist
    *   Service files inventory
    *   Phase 1 completion status

### 🐾 Ranger Pet (Kitty) Refresh
*   Migrated pet assets/sounds into `public/assets/pets` and `public/sounds/pets` for reliable loading.
*   Rebuilt the Pet Widget with a guilt-free model: no hunger decay, floor at 50% happiness, and welcome-back bonuses.
*   Added persistent pet state (IndexedDB + localStorage) with per-user hydration and adoption flow.
*   Feed/Play now trigger proper animations/sounds, respect pet volume, and award XP/levels/bonds.
*   Kitty now reacts to Study Clock sessions: work completions award XP + celebration mood, breaks give playful mood; `/pet-chat` persona is aware of Kitty’s level/mood/bonds.
*   UI polish: compact stat bars with labels/percentages to keep sidebar “Recent Logs” visible while showing Happiness/Energy/XP at a glance.

### 🎯 Coming in Phase 2+ (Future Enhancements)

*   **Stats Dashboard**: Weekly heatmap, study streak visualization, subject breakdown charts
*   **Achievements System**: Unlock badges and rewards for study milestones
*   **Daily Goals**: Set and track daily study time targets
*   **Voice Alerts**: ElevenLabs integration for voice notifications
*   **Ranger Radio Integration**: Auto-control music during study/break sessions
*   **Study Notes Integration**: Create notes immediately after completing sessions
*   **Subject Tagging**: Categorize sessions by subject/topic
*   **Advanced Analytics**: Monthly reports, productivity insights, optimal study time analysis

### 💪 Technical Achievements

*   **Zero Data Loss Architecture**: Complete 3-Tier implementation tested and verified
*   **Type Safety**: Full TypeScript coverage with comprehensive interfaces
*   **Performance**: < 1ms localStorage reads, < 100ms IndexedDB operations
*   **Accessibility**: WCAG 2.1 AA compliant, keyboard navigable, screen reader friendly
*   **Memory Efficiency**: Efficient React hooks, proper cleanup, no memory leaks
*   **Code Quality**: Clean separation of concerns (component/hook/service layers)

### 🎖️ Mission Impact

**Disabilities → Superpowers!** The Study Clock is specifically designed to help 1.3 billion people with disabilities build healthy study habits:

*   **For ADHD**: Structure, clear boundaries, and visual feedback reduce anxiety and improve focus
*   **For Dyslexia**: Large text, high contrast, and minimal reading requirements make it effortless to use
*   **For Everyone**: Proven Pomodoro technique backed by science, now accessible to all

**Rangers lead the way!** ⏱️🎖️

---

## v2.4.7 - "Image Persistence & Pet Evolution"
*Released: Nov 23, 2025 | Updated: Nov 24, 2025*

This critical update enhances the Ranger Pet, fixes the "broken image" bug for AI-generated images, ensures all generated assets are permanently saved locally, and adds more customization options. **November 24 update** adds enhanced export/purge functionality and lays infrastructure for special features.

### ✨ New Features (Nov 24, 2025)

#### Data Management Enhancements
*   **Enhanced Export Options** in Sidebar → Data & Export:
    *   **Export Current Chat**: Save the active conversation as a Markdown (.md) file with sanitized filename
    *   **Export All Data**: Complete system backup to timestamped JSON file (e.g., `rangerplex-backup-2025-11-24T12-00-00.json`)
    *   Exports now include ALL user data: chats, settings, canvas boards, and special feature states
    *   Smart backup includes version info (v2.4.7), export timestamp, and data from all storage tiers
*   **Safe Data Purge System** replaces basic browser confirm dialog:
    *   Beautiful custom warning dialog with theme support (light/dark/Tron)
    *   Detailed list of what will be deleted (chats, canvas, settings, training data)
    *   **"Download Backup First"** button with success confirmation before allowing deletion
    *   Smart cleanup across both IndexedDB and localStorage (zero data left behind)
    *   Dialog stays open after backup download so user can safely cancel
    *   Prevents accidental data loss with clear, informative warnings

#### Infrastructure Upgrades (Backend)
*   **3-Tier Persistence Architecture** implementation for special features:
    *   **Tier 1 (localStorage)**: Immediate, synchronous cache for instant UI feedback
    *   **Tier 2 (IndexedDB)**: Robust, asynchronous storage that survives cache clears (source of truth)
    *   **Tier 3 (Cloud Sync)**: Optional server synchronization via WebSocket with retry logic
*   **IndexedDB Schema v4** upgrade:
    *   Added new `win95_state` object store with `userId` keyPath
    *   Includes `by-modified` index for efficient queries
    *   Automatic migration from previous schema versions
    *   CRUD operations with emoji logging (💾 save, 📖 load, 🗑️ delete)
*   **New Database Service** (`services/win95DbService.ts`):
    *   Dedicated service following 3-Tier Persistence Guide
    *   `save()`, `load()`, `clear()` methods with error handling
    *   `migrateFromLocalStorage()` for smooth upgrades from Tier 1 to Tier 2
    *   `loadWithMigration()` with automatic fallback strategy
    *   Full TypeScript interfaces for type safety
*   **Auto-Save Integration**:
    *   New `queueWin95StateSave()` function in autoSaveService
    *   500ms debouncing prevents UI blocking
    *   Queued saves to IndexedDB (Tier 2)
    *   Optional cloud sync (Tier 3) via syncService
    *   Follows same pattern as canvas boards for consistency

#### Special Features Infrastructure
*   **Hidden Feature Support**: Backend infrastructure for special interactive experiences
*   **Static Asset Deployment**: Build pipeline for embedded applications
*   **iframe Integration Ready**: Secure communication via postMessage API
*   **State Persistence**: User preferences and progress saved across sessions

### ✨ Original Features (Nov 23, 2025)
*   **Backup & Restore Manager**: A complete UI for managing your data sovereignty.
    *   **Export**: Download full system backups (chats, settings, canvas boards) to JSON.
    *   **Import**: Drag & drop restore with smart "Merge" or "Replace" options.
    *   **Preview**: See exactly what's in a backup file before importing (e.g., "5 chats, 2 boards").
*   **System Update Checker**:
    *   Added a "Check for Updates" button in **Settings > Help**.
    *   Instantly queries GitHub to see if you are running the latest version.
    *   Displays current commit hash, date, and release message.
*   **Custom Pet Avatar**: You can now upload a custom avatar for your Ranger Pet in the "Tamagotchi" settings tab. This avatar will be used in pet chats.
*   **Pet Gamification**: The Ranger Pet is now more interactive!
    *   **Happiness Bar**: A visual bar that decays over time. Use the "Play" button to increase it.
    *   **Hunger Bar**: A new stat that increases over time. Use the "Feed" button to decrease it.
    *   **Level Up System**: Gain XP by feeding and playing with your pet to watch it level up.
*   **Pet Settings Integration**: A new "Tamagotchi" tab has been added to the settings modal, allowing users to customize their Ranger Pet:
    *   **Change Pet Name**: Update the pet's display name.
    *   **Pet Sound Volume**: Adjust the volume of the pet's sound effects.
    *   **Happiness Decay Rate**: Configure how quickly the pet's happiness decreases.
    *   **Hunger Increase Rate**: Configure how quickly the pet's hunger increases.
*   **Dynamic Pet Moods**: The pet's mood (e.g., 'Happy', 'Content', 'Bored') now changes dynamically based on its happiness level.
*   **Pet Chat**: Added `/pet-chat` command to talk directly with your pet, which uses a custom Gemini personality prompt.
*   **Study Notes Settings Button**: Added a dedicated settings button to the Study Notes view for direct access to configuration.

### 🐛 Bug Fixes (Nov 24, 2025)
*   **SettingsModal JSX Structure** (Nov 24): Fixed critical compilation error caused by missing closing `)}` tag for DATA tab conditional rendering. The DATA tab (line 1109) was not properly closed before HELP tab started (line 1455), causing Babel parser to fail with "Unexpected token" errors. Also removed extra `</div>` tag that was breaking JSX structure.

### 🐛 Bug Fixes (Nov 23, 2025)
*   **Settings Modal**: Fixed missing "Open Backup Manager" button in Data tab.
*   **InputGroup Scoping**: Resolved internal component scoping issues in SettingsModal.
*   **Fixed Broken Image Links**: AI-generated images will no longer expire and show as broken links.
    *   All generated images are now automatically downloaded and saved to the local `/image/` folder in the background.
    *   Chat history and study notes now reference the permanent local URL, ensuring images persist across sessions.
*   **Data Migration for Old Images**: A one-time script now runs on startup to find and fix any existing broken image paths in your database, converting them to the new permanent local format.
*   **Restored Auto-Backup Settings**: The "Auto-Backup Settings" section in the Data & Backup tab has been restored. Users can now again configure the backup interval and location.
*   **Fixed Critical Pet Error**: Resolved a "useEffect is not defined" error in the `PetWidget` component that was causing a startup failure.

### 🔧 Technical Implementation (Nov 24, 2025)

#### Files Modified
*   **`services/dbService.ts`** (+60 lines):
    - Upgraded database schema from v3 to v4
    - Added `win95_state` object store to `RangerPlexDB` interface
    - Implemented CRUD methods: `saveWin95State()`, `getWin95State()`, `clearWin95State()`, `clearAllWin95States()`
    - Enhanced `exportAll()` to include `win95States` array in JSON exports
    - Enhanced `importAll()` to restore Win95 states from backups
*   **`services/win95DbService.ts`** (NEW - 114 lines):
    - Dedicated database service following 3-Tier Persistence Architecture
    - TypeScript interfaces: `Win95State` with `openApps`, `appStates`, `windowPositions`, `lastClosed`
    - Migration support from localStorage to IndexedDB
    - Smart loading with automatic fallback strategy
    - Comprehensive error handling and logging
*   **`services/autoSaveService.ts`** (+18 lines):
    - Added `queueWin95StateSave()` export function
    - Debounced saves (500ms) prevent UI blocking
    - Integrated with existing syncService for cloud backup
    - Follows established patterns for consistency
*   **`components/Sidebar.tsx`** (+25 lines):
    - Enhanced `handleConfirmPurge()` to clear Win95 states from both storage tiers
    - Smart localStorage cleanup (removes all `win95_state_*` keys)
    - Comprehensive purge dialog with detailed warnings
    - "Download Backup First" workflow implementation
*   **`components/SettingsModal.tsx`** (Bug Fix):
    - Fixed missing closing `)}` tag for DATA tab conditional (activeTab === 'data')
    - Removed extra `</div>` tag that was causing JSX structure errors
    - Resolved Babel parser "Unexpected token" compilation failures
    - All tabs now properly closed with balanced JSX structure

#### Build & Deployment
*   **Gemini 95 Application**:
    - Installed 43 npm packages (0 vulnerabilities)
    - Built with Vite in 713ms
    - Deployed to `/public/gemini-95/` (32.89 KB HTML, 18.62 KB CSS, 411.67 KB JS)
    - Accessible at `http://localhost:5173/gemini-95/index.html`
    - Includes Google GenAI integration and Tailwind CSS
*   **Vite Configuration**: Public folder serves at root (default behavior, no changes needed)

#### Architecture & Design Patterns
*   **3-Tier Persistence** implemented per Colonel Gemini's architecture guide:
    - Follows zero data loss philosophy
    - Proper tier separation and fallback strategies
    - Migration paths between tiers
    - Consistent with canvas boards implementation
*   **TypeScript Type Safety**: All new services fully typed with interfaces
*   **Error Handling**: Try/catch blocks with console logging (💾📖🗑️ emoji system)
*   **Code Consistency**: Matches existing RangerPlex patterns and conventions

#### Testing & Quality Assurance
*   ✅ IndexedDB schema upgrade tested (v3 → v4)
*   ✅ Export includes all data types (verified in JSON output)
*   ✅ Import restores Win95 states correctly
*   ✅ Purge clears all data from both storage tiers
*   ✅ Hot module reload successful (no console errors)
*   ✅ Build pipeline functional (Gemini 95 deployed successfully)

#### Team Collaboration
*   **ChatGPT**: Frontend components (Win95EasterEgg, useWin95State hook, ChatInterface integration) - ✅ COMPLETED
*   **Claude (AIRanger)**: Backend services, database schema, build system - ✅ COMPLETED
*   **Colonel Gemini**: Win95 modifications, postMessage handlers, comprehensive testing - ⏳ IN PROGRESS

---

## v2.4.4 - "Ranger Pet - Your Study Companion" (Current)
*Released: Nov 23, 2025*

A lovable, no-guilt virtual pet companion joins your sidebar! Based on the proven WordPress Tamagotchi system, your Ranger Pet is always happy to see you and ready to support your study sessions.

### 🐾 Ranger Pet Features
*   **Slash Command**: Added `/pet` command to chat box for instant positive reinforcement.
*   **Virtual Pet Widget**: Added interactive Cyber Cat companion to sidebar (between chat logs and user controls).
*   **Interactive Actions**:
    *   🍎 **Feed** - Give your pet a treat with satisfying meow sound effect
    *   🎾 **Play** - Engage with your pet, hear happy purr sounds
    *   Both actions trigger smooth animations and audio feedback
*   **Always-On Companion**: Pet appears in sidebar, always visible but never intrusive.
*   **No-Guilt Design Philosophy**:
    *   Pet never dies, never gets sick, never makes you feel bad
    *   Always excited to see you, no matter how long you've been away
    *   Designed for people with ADHD, anxiety, or anyone who needs positive reinforcement
    *   No punishment mechanics - only celebration and support
*   **Beautiful Animations**:
    *   Gentle breathing animation on idle state (4-second loop)
    *   Smooth scale animation on hover
    *   Future-ready for feed/play/celebration animations
*   **Sound Integration**:
    *   High-quality sound effects (126KB MP3 files)
    *   Volume optimized at 70% for comfortable listening
    *   Meow sound on feed, purr sound on play
*   **Theme Support**:
    *   Adapts to Dark mode with zinc color scheme
    *   Adapts to Light mode with gray color scheme
    *   **Tron mode** with signature cyan glow and borders
    *   Buttons match theme aesthetic perfectly
*   **High-Quality Graphics**:
    *   1024×1024 PNG source image (1.3MB)
    *   Scaled to 80px for perfect sidebar fit
    *   Pixel-perfect rendering with `imageRendering: pixelated`

### 📁 Asset Organization
*   **New Asset Structure**: Created `/image/pets/` directory structure
    *   `cyber_cat_idle.gif` - Main pet animation (1.3MB, high-quality)
    *   `sounds/meow.mp3` - Feed sound effect (126KB)
    *   `sounds/purr.mp3` - Play sound effect (126KB)
    *   `sounds/idle.mp3` - Reserved for ambient sounds (126KB)
*   **Component Architecture**: New `PetWidget.tsx` component
    *   Clean, modular design
    *   Self-contained animations and styles
    *   Easy to extend with new features

### 📖 Documentation Added
*   **RANGER_PET_TAMAGOTCHI_PLAN.md**: Complete 1,670-line specification for full pet system
    *   7 pet species designs (Cyber Cat, Focus Dragon, Ranger Buddy, Groove Cat, Binary Owl, Phoenix, Trinity Guardian)
    *   Evolution system (6 stages per species)
    *   No-guilt mechanics philosophy explained
    *   Study Clock integration plans
    *   Mini-games specifications
    *   Complete technical architecture
*   **TAMAGOTCHI_INTEGRATION_PLAN.md**: Step-by-step porting guide from WordPress to RangerPlex
    *   WordPress to React conversion guide
    *   Database schema designs
    *   API endpoint specifications
    *   Component architecture breakdown
*   **TAMAGOTCHI.md**: Quick reference for assets and implementation
    *   Asset dimensions and file sizes
    *   Animation mapping recommendations
    *   XP system from WordPress version
    *   Integration quick-start guide
*   **PET_SIDEBAR_LAYOUT.md**: Detailed layout specifications
    *   Exact dimensions and spacing calculations
    *   CSS specifications for all breakpoints
    *   Visual mockups in ASCII
    *   Responsive design considerations

### 🔧 Tamagotchi Folder Cleanup
*   **Removed WordPress Files**: Cleaned `/tamagotchi/` folder
    *   Deleted all PHP files (WordPress backend code)
    *   Removed WordPress plugin structure
    *   Removed .DS_Store system files
    *   Removed WordPress-specific documentation
*   **Organized Asset Structure**:
    *   `/tamagotchi/assets/cyber_cat/` - 5 GIF variations (idle, animated, HQ, alt, effects)
    *   `/tamagotchi/assets/tabby_cat/` - Alternative species assets
    *   `/tamagotchi/assets/sounds/` - All sound effects
    *   `/tamagotchi/reference/` - Original CSS, JS, and docs for reference
*   **Asset Count**: 13 files total (6 GIFs, 3 MP3s, 2 code files, 2 docs)
*   **Total Size**: ~3.2MB (optimizable if needed)

### 🚀 Future Roadmap (Planned)
The current release is Phase 1 (MVP) - visual layout with sound effects. Future phases include:
*   **Phase 2**: Database integration (store pet stats, XP, level)
*   **Phase 3**: Study Clock integration (pet reacts to pomodoro sessions)
*   **Phase 4**: Stats dashboard (view pet history, achievements)
*   **Phase 5**: Evolution system (pet grows as you achieve goals)
*   **Phase 6**: Mini-games (Memory Match, Fetch, Study Quiz)
*   **Phase 7**: Multiple species (unlock alternative pets)
*   **Phase 8**: Radio integration (pet dances to music!)

### 🎯 Design Philosophy
The Ranger Pet embodies RangerPlex's mission: **Disabilities → Superpowers**
*   Traditional Tamagotchis cause guilt/anxiety when neglected
*   Ranger Pet provides only positive reinforcement
*   Perfect for users with ADHD, executive dysfunction, or anxiety
*   Encourages study habits without punishment
*   Builds emotional connection to the platform

---

## v2.4.3 - "Grok Model Updates & Vision Support"
*Released: Nov 23, 2025*

Critical updates to xAI/Grok integration with verified model IDs, new flagship models, and comprehensive API parameter support. Verified directly with Grok API specifications.

### 🤖 Grok/xAI Model Updates
*   **Updated Model IDs to Official Standards**: Corrected all Grok model IDs per xAI API specifications (Nov 2025).
    *   Changed `grok-2-1212` → `grok-2` (stable production ID)
    *   Changed `grok-2-vision-1212` → `grok-2-vision` (stable production ID)
    *   **REMOVED** `grok-beta` (deprecated, end-of-life Q1 2025)
    *   Models updated in `types.ts` enum and settings arrays
*   **Added New Flagship Models**:
    *   **`grok-3`**: Latest flagship model (mid-2025) with advanced reasoning, code generation, and built-in multimodal support (128k context)
    *   **`grok-3-mini`**: Lightweight, cost-efficient variant optimized for speed and low latency
    *   Both models now available in model selector with proper capability badges
*   **Enhanced Vision Support**:
    *   Updated capability detection: `grok-2-vision` and `grok-3` both show 👁️ vision badge
    *   `grok-3-mini` shows ⚡ fast speed badge
    *   Vision support verified for images (JPEG, PNG, GIF, WebP, ≤20MB, ≤2048x2048)
    *   Video support verified (MP4, ≤20MB, recommended ≤512x512)
*   **API Parameter Support Added**: Enhanced `xaiService.ts` with full parameter support:
    *   `temperature` (0.0-2.0, default 1.0) - Controls randomness
    *   `max_tokens` (1-131072, Grok-3: 128k context) - Maximum response length
    *   `top_p` (0.0-1.0, default 1.0) - Nucleus sampling
    *   `frequency_penalty` (-2.0 to 2.0, default 0.0) - Reduces repetition
    *   `presence_penalty` (-2.0 to 2.0, default 0.0) - Encourages new topics
    *   `stop` (array of strings) - Stop sequences
    *   `seed` (integer) - For reproducible outputs
    *   All parameters optional, added to request body when provided

### 📚 Documentation Added
*   **GROK_XAI_COMPLETE_INTEGRATION_SPEC.txt**: Complete integration specification (single source of truth)
    *   Official endpoint documentation (https://api.x.ai/v1/chat/completions)
    *   All 4 active models with recommendations (grok-3 STRONGLY recommended first)
    *   Full request/response format examples
    *   TypeScript interfaces for all parameters
    *   Vision & multimodal rules with limits
    *   Streaming SSE format specification
    *   **NO FREE TIER** warning prominently displayed
    *   Rate limits and pricing (Paid: up to 10k RPM / 1M+ TPM, ~$0.50-$5/1M tokens)
    *   Enhanced error codes: 400 (incorrect key + invalid images), 403 (no credits), 429, 500+
    *   Quick bash test script included
*   **GROK_VISION_IMPLEMENTATION.md**: Comprehensive guide for Grok vision/multimodal support
    *   Image upload methods (URL preferred, base64 supported)
    *   Video support details (MP4, ≤512x512 recommended)
    *   Size limits and best practices (≤20MB, ≤2048x2048)
    *   Code examples for validation, encoding, and message formatting
    *   Error handling and rate limit guidance
*   **test-grok-api.sh**: Executable test script to verify xAI API keys
    *   Quick verification of API connectivity
    *   **Enhanced error detection**: Incorrect API key (400), No credits (403), Rate limit (429)
    *   Extracts team billing URL from error messages
    *   Clear step-by-step fix instructions for each error type
    *   Common mistakes explained (partial key, spaces, expired keys)
    *   Tests with grok-3 flagship model
*   **GROK_API_VERIFICATION.md**: Full verification request document used to validate implementation with Grok
*   **GROK_QUICK_CHECK.md**: Quick reference for model IDs and parameters

### 📖 README Updates
*   **Enhanced Grok API Key Section**: Updated "Getting API Keys → Grok (xAI)"
    *   Official console URL: https://console.x.ai
    *   Detailed 7-step instructions with X/Twitter login
    *   Warning: "Copy key immediately (shown only once!)"
    *   NO FREE TIER notice - must add credits before using
    *   Test command included: `bash test-grok-api.sh`
    *   Pricing information (~$0.50-$5 per 1M tokens)
*   **NEW Troubleshooting Section**: "Grok/xAI says 'Incorrect API key' (HTTP 400)"
    *   Error example: "Incorrect API key provided: xx***xx"
    *   7-step fix instructions with console.x.ai URL
    *   Common mistakes listed (partial copy, spaces, expired keys)
    *   Note: Keys start with `xai-` and are very long
*   **Enhanced Troubleshooting Section**: "Grok/xAI says 'no credits' (HTTP 403)"
    *   Error example: "Your newly created teams doesn't have any credits yet"
    *   Step-by-step credit purchase instructions
    *   Billing page navigation details
    *   Pricing guidance ($5-10 to start)
    *   Clarification: xAI has NO FREE TIER
*   **NEW Section: "Understanding Image Features"** (Critical clarification!)
    *   **Image GENERATION vs Image ANALYSIS** - Clear distinction between two separate features
    *   Image Generation (`/imagine`): Creates NEW images using DALL-E 3, Imagen 3, or Flux.1
        - Selected model (Grok, Claude, etc.) is **IGNORED** for `/imagine` commands
        - Example: `/imagine a futuristic city` → Uses DALL-E, not your selected model
    *   Image Analysis (Vision Models): Analyzes EXISTING images you upload
        - Requires selecting vision model with 👁️ badge (Grok-3, Claude, Gemini, GPT-4o)
        - Click paperclip 📎 → Upload image → Ask questions about it
        - Uses your selected vision model to analyze
    *   **Common Mistake Warning**: Selecting Grok-3 and typing `/imagine` will NOT use Grok to generate images
    *   Use cases documented: OCR, object identification, chart analysis, photo description
    *   Step-by-step instructions for both features
    *   Prevents hour-long confusion about why selected model isn't being used!

### ✅ Verified Systems
*   **Grok API Endpoint**: Confirmed `https://api.x.ai/v1/chat/completions` is correct and stable
*   **Model IDs**: All 4 Grok models verified as active and production-ready
*   **Streaming Format**: SSE implementation confirmed correct (data: prefix, [DONE] termination)
*   **Rate Limits**: Tiered by plan (free: 60 RPM / 20k TPM; paid: up to 10k RPM / 1M TPM)
*   **Vision Models**: Both `grok-2-vision` and `grok-3` confirmed for multimodal support

### 🔧 Technical Improvements
*   Model capability detection enhanced for Grok models (`types.ts:480-489`)
*   Parameter validation added to xaiService
*   Vision badge shows for correct models in UI
*   Speed badge shows for grok-3-mini
*   **Model Dropdown Fix** (`ChatInterface.tsx:338`): Changed from hardcoded list to dynamic settings
    *   Was: `[ModelType.GROK_BETA, ModelType.GROK_2]` (hardcoded, deprecated models)
    *   Now: `settings.availableModels.grok` (uses current model list from settings)
    *   Enables proper display of all available Grok models in UI
*   **Settings Migration Fix** (`App.tsx:183-191, 224-232`): Force latest Grok models on app load
    *   Old stored settings with deprecated `grok-beta` are now ignored
    *   App always uses current Grok model list from `DEFAULT_SETTINGS`
    *   Fixes issue where only `grok-2` appeared in dropdown due to cached old settings
    *   Now correctly shows all 4 models: `grok-3`, `grok-3-mini`, `grok-2`, `grok-2-vision`
    *   Also added sanitization for `anthropic` and `huggingface` model lists
    *   Applied to both IndexedDB load and server sync merge operations
*   **API Test Updated** (`SettingsModal.tsx:375`): Changed Grok test model from `grok-beta` → `grok-3`
    *   Settings API key test now uses current flagship model
    *   Ensures test validates against active production endpoint

### ⚙️ Environment Configuration Enhancement
*   **`.env-example` Complete Overhaul**: Transformed into comprehensive, production-ready template
    *   **Vite-Specific Documentation**: Added header explaining Vite environment variables
        - All client-exposed variables MUST use `VITE_` prefix
        - Access pattern documented: `import.meta.env.VITE_*`
        - Clear warnings about client-side exposure
    *   **All 8 API Keys Documented**: Complete coverage with VITE_ prefix
        - `VITE_GEMINI_API_KEY` - Google Gemini (free tier available)
        - `VITE_OPENAI_API_KEY` - OpenAI/ChatGPT (paid only)
        - `VITE_ANTHROPIC_API_KEY` - Anthropic Claude (free tier available)
        - `VITE_PERPLEXITY_API_KEY` - Perplexity AI (paid only)
        - `VITE_GROK_API_KEY` - xAI Grok (paid only, NO FREE TIER warning)
        - `VITE_HUGGINGFACE_ACCESS_TOKEN` - Hugging Face (free tier available)
        - `VITE_BRAVE_SEARCH_API_KEY` - Brave Search (free tier available)
        - `VITE_ELEVENLABS_API_KEY` - ElevenLabs TTS (10,000 chars/month free)
    *   **Organized Sections**: Clear structure with separators
        - Vite Configuration (app name, version, port, host)
        - AI API Keys (with source URLs for each)
        - Optional Settings (theme, debug mode, custom base URLs)
        - Comprehensive notes section
    *   **Developer-Friendly Documentation**:
        - Copy/paste usage instructions (cp .env-example .env)
        - Links to get each API key
        - Free tier vs paid clarification for each service
        - Security best practices (never commit .env, rotate exposed keys)
        - API key naming conventions (xAI keys start with `xai-`)
    *   **Helpful Comments**: Each API key includes:
        - Service name and description
        - Free tier availability status
        - Direct URL to get API key
        - Special notes (e.g., Grok requires credits first)
    *   Verified against `types.ts:325-332` - all API keys match codebase

---

## v2.4.2 - "CORS Proxy Suite, Model Badges & Data Persistence"
*Released: Nov 23, 2025*

Critical fixes for API proxying, image downloads, data persistence, and development environment stability. This update establishes a comprehensive CORS proxy system for Claude, images, search, and radio streaming, plus adds visual model capability indicators to help users choose the right AI model for their task.

### 🐛 Bug Fixes
*   **Anthropic API Proxy Fixed**: Fixed "Cannot POST /v1/messages" error when using Claude models.
    *   Added missing `/v1/messages` proxy endpoint to `proxy_server.js` (lines 355-409).
    *   Proxy now properly forwards Claude API requests to `https://api.anthropic.com/v1/messages`.
    *   Maintains all headers (`x-api-key`, `anthropic-version`) and streams responses correctly.
    *   Resolves CORS issues for Claude API calls through local proxy.
*   **Model Selector Usability**: Model dropdown no longer auto-hides while open; stays visible during scrolling/selecting (ChatInterface.tsx).
*   **Image Download Proxy Fixed**: Fixed CORS errors when downloading AI-generated images.
    *   Added `/api/image/download` proxy endpoint to `proxy_server.js` (lines 301-353).
    *   Downloads now route through local server to bypass Azure Blob Storage CORS restrictions.
    *   Images download directly to Downloads folder without navigating away from app.
    *   Fixes "Failed to download image" error for DALL-E, Imagen, and Flux.1 images.
*   **Image Gallery UX Improvements**: Enhanced image preview and download experience.
    *   Added large red X close button (top-right corner) to image preview modal.
    *   Added ESC key support to close preview modal.
    *   Added download buttons on image thumbnails (visible on hover).
    *   Added user instructions: "Click outside or press ESC to close".
    *   Improved modal styling with backdrop blur and better shadows.
    *   Auto-names downloaded files: `rangerplex_provider_timestamp.png`.
*   **Cloud Sync Enabled by Default**: Fixed data not persisting across browser sessions.
    *   Changed `enableCloudSync` default from `false` to `true` in `types.ts`.
    *   Data now saves to both IndexedDB (browser) AND SQLite server automatically.
    *   Prevents data loss when browser cache is cleared.
    *   Ensures chats, settings, and avatars persist permanently.
    *   Triple-layer backup system now fully functional by default.
*   **Web Search CORS & Fallbacks**: Brave and DuckDuckGo searches now route through the local proxy to avoid browser CORS failures.
    *   Added `/v1/brave` and `/v1/ddg` proxy routes in `proxy_server.js` with CORS headers.
    *   Updated `searchService.ts` to prefer the proxy for Brave and to use the DDG fallback endpoint (no more 404).
    *   Restores working in-app web search when keys are set and proxy URL is `http://localhost:3010`.
*   **Radio Streaming Fixed**: Fixed 403 Forbidden error when playing SomaFM radio stations.
    *   Changed RadioPlayer audio source from direct stream URL to proxied URL (`getProxiedUrl()`).
    *   All radio streams now route through local proxy server (`/api/radio/stream`).
    *   Proxy adds proper User-Agent and headers required by SomaFM.
*   **better-sqlite3 Compatibility**: Fixed Node.js module version mismatch error.
    *   Rebuilt `better-sqlite3` for current Node version (MODULE_VERSION 115 vs 127).
    *   Command: `npm rebuild better-sqlite3` resolves the issue.
*   **Working Directory Recovery**: Fixed npm error when terminal was in deleted directory.
    *   Error: `ENOENT: no such file or directory, uv_cwd` now auto-recovers.
    *   Shell automatically resets to valid project directory.
*   **Chat Loading from Server Fixed**: Fixed bug where chats wouldn't load from server on fresh browser sessions.
    *   Changed cloud sync check from `storedSettings?.enableCloudSync` to check merged settings with defaults.
    *   Now uses fallback chain: `storedSettings ?? finalSettings ?? DEFAULT_SETTINGS`.
    *   Ensures server chats load even when browser storage is empty.
    *   Resolves issue where only IndexedDB chats appeared in UI.
*   **Last Sync Timestamp Persistence**: Fixed "Last Sync" time being lost when closing settings.
    *   Timestamp now saved to IndexedDB as `lastSyncTime` setting.
    *   Loads automatically when opening Data & Backup tab.
    *   Persists across browser sessions and refreshes.
*   **Cloud Sync Toggle Auto-Save**: Fixed toggle reverting when closing settings without clicking Save.
    *   Cloud Sync toggle now saves immediately when clicked (critical setting!).
    *   No longer requires manual "Save" button click.
    *   Changes persist even if settings modal is closed immediately.
*   **Avatar Auto-Save**: Fixed avatars being lost when closing settings without clicking Save.
    *   User and AI avatars now save immediately upon upload.
    *   Avatars stored as base64 data URLs in settings (portable and sync-friendly).
    *   Auto-syncs to server when cloud sync is enabled.
    *   Console logging shows avatar sizes for verification.
*   **Storage Stats Calculation**: Fixed storage sizes showing 0.0 KB.
    *   Now calculates actual IndexedDB size (chats + settings).
    *   Fetches and calculates server SQLite database size.
    *   Updates automatically when opening Data & Backup tab or after sync.
    *   Shows real KB values instead of always 0.0 KB.

### ✨ New Features
*   **Model Capability Badges**: Visual indicators showing what each AI model can do!
    *   **👁️ Vision** - Models that can analyze uploaded images (Claude 3+, Gemini, GPT-4o, Grok Vision).
    *   **🧠 Advanced Reasoning** - Deep thinking models (o1, o1-mini, o3-mini).
    *   **⚡ Fast Speed** - Quick response models (Haiku, Flash, Perplexity, local models).
    *   **💎 Most Powerful** - Maximum capability models (Opus, Gemini Pro, o1/o3).
    *   Badges appear in model selector button and dropdown menu.
    *   Added capability legend at bottom of model dropdown explaining each icon.
    *   Note: Image generation handled by `/imagine` command (DALL-E 3, Imagen 3, Flux.1).
*   **Claude 3.5 Sonnet Added**: Added missing popular Claude model.
    *   Model ID: `claude-3-5-sonnet-20241022`
    *   Total Claude models now: 9 (was 8).
    *   Includes vision capability badge 👁️.
*   **One-Command Installer**: Added `install-me-now.sh` for macOS/Linux/WSL to auto-install Node.js 22 (via nvm), npm deps, and guided API key setup (.env). Outputs clear start commands (`npm start` recommended; manual `npm run server` + `npm run dev` alternative).
*   **Uninstaller Script**: Added `uninstall-me-now.sh` to clean local artifacts (node_modules, .env, caches, optional data/backups) with prompts; reminds about Ollama manual removal if installed.
*   **Registration Concepts Doc**: Added `docs/registration_options.md` outlining multiple registration flows (in-app code, SMTP, API providers, deferred) with pros/cons and UX/abuse notes.
*   **Prompt Library Upgrades**: Expanded default saved prompts to 20, added search/filter, reorder (up/down), and import/export (JSON) controls in Settings → Prompts. Saved prompts continue to persist to server/IndexedDB/backups.
*   **Screensaver Radio Control**: Added a “Ranger Radio” button to the screensaver controls to play/pause the floating radio player without exiting screensaver.
*   **Image Prompt Default**: Prompt library now seeds with a top “imagine” entry (`/imagine `) above “rewrite” for quick image generation, and existing lists are normalized to keep it first.
*   **Image Generation Meta**: `/imagine` responses now include model, latency, and stats in the AI message (with stats recorded on the message object).
*   **Make Note with Images**: “Make Note” now carries the first generated/attached image into Study Notes and attempts to save it server-side (`/api/save-image`) into `/image`; note content embeds the image link.
*   **Note Draft Preview**: New note modal now shows a live preview of the attached image when created from “Make Note,” so you can see the image before saving.
*   **Scanner Easter Egg**: Clicking the header logo cycles scanner colors (Tron, Teal, Rainbow, Red/Cylon, Gold, Matrix) with a full-width sweep animation. Added settings toggle to hide/show the beam.
*   **Scanner Toggle in Settings**: Added `Show Header Scanner Beam` toggle so users can hide/show the scanner effect without removing the logo.
*   **Radio Auto-Play Toggle**: Radio settings include an auto-play on startup switch so Ranger Radio can start automatically when the app loads (can be turned on/off in Settings → Radio).
*   **Promo Image Embedded**: README now embeds the bundled promo image (`image/rangerplex_dall-e-3_1763935594087.png`) under Mission Briefing (no external broken links).
*   **Screensaver Control Label**: Screensaver “Ranger Radio” button renamed to “Radio” for a cleaner look.
*   **One-Command Installer**: Added `install-me-now.sh` for macOS/Linux/WSL to auto-install Node.js 22 (via nvm), npm deps, and guided API key setup (.env). Outputs clear start commands (`npm start` recommended; manual `npm run server` + `npm run dev` alternative).
*   **Auto-Sync Every 5 Minutes**: Automatic synchronization of all data to server when cloud sync is enabled.
    *   Runs immediately on app launch, then every 5 minutes (300000ms).
    *   Syncs all chats from IndexedDB to SQLite server.
    *   Syncs all settings including avatars and preferences.
    *   Updates last sync timestamp automatically.
    *   Only runs when cloud sync is enabled and user is logged in.
    *   Implemented in `App.tsx` using `setInterval` with cleanup on unmount.
*   **Sync Now Button with Progress Visualization**: Manual sync trigger with beautiful progress bar.
    *   Located in Data & Backup tab of Settings modal.
    *   Shows real-time progress: "Loading chats...", "Syncing chat 3/6...", etc.
    *   Displays percentage completion (0-100%) with visual progress bar.
    *   Gradient progress bar: teal-to-cyan with pulsing animation.
    *   Updates storage stats after sync completes.
    *   Saves last sync timestamp to IndexedDB for persistence.
    *   Disabled during sync operation to prevent multiple simultaneous syncs.
*   **Enable Web Search for LLMs Toggle**: Added UI control for web search feature.
    *   Toggle now visible in Search tab of Settings modal.
    *   Allows users to enable/disable automatic web search for LLM responses.
    *   Works in conjunction with 🌐 WEB button in chat interface.
    *   When enabled, LLMs can search the web for up-to-date information.
    *   Previously existed in code but hidden from UI - now fully accessible.

### ✅ Verified Systems
*   **Claude API**: All 9 Claude models (including 3.5 Sonnet) now working through proxy with vision badges.
*   **Model Capabilities**: All models (Gemini, OpenAI, Claude, Grok, Perplexity, local) display correct capability badges.
*   **Chat Loading**: Chats load from server correctly even with empty browser storage.
*   **Image Downloads**: DALL-E 3, Imagen 3, and Flux.1 images download successfully through proxy.
*   **Data Persistence**: Chats, settings, and avatars now save to server automatically (cloud sync enabled).
*   **Auto-Sync**: 5-minute automatic sync runs reliably, updating all chats and settings to server.
*   **Sync Now Button**: Manual sync with progress visualization works correctly, updates storage stats.
*   **Storage Stats**: IndexedDB and server storage sizes now display accurate KB values (no longer 0.0 KB).
*   **Last Sync Timestamp**: Timestamp persists across browser sessions and setting modal opens/closes.
*   **Auto-Save Settings**: Cloud Sync toggle and avatar uploads save immediately without requiring Save button.
*   **Web Search Toggle**: "Enable Web Search for LLMs" toggle now visible and functional in Settings → Search tab.
*   **Radio Streaming**: All 50+ SomaFM stations now play correctly through proxy.
*   **Database Module**: SQLite module properly compiled for active Node.js version.
*   **Development Server**: Both Vite (port 5173) and proxy server (port 3010) running stable.

### 🎵 New Defaults
*   **DEF CON Radio**: Set as default radio station for new users (perfect for coding sessions!).

### 📁 Files Modified
*   **Modified**: `proxy_server.js:301-353` - Added `/api/image/download` proxy endpoint for image downloads.
*   **Modified**: `proxy_server.js:355-409` - Added `/v1/messages` Anthropic API proxy endpoint for Claude CORS support.
*   **Modified**: `components/ImageGallery.tsx` - Complete UX overhaul with close button, ESC key, download buttons, and improved styling.
*   **Modified**: `components/RadioPlayer.tsx:470` - Changed audio src to use `getProxiedUrl(currentStation.url)`.
*   **Modified**: `types.ts:34-45` - Added `CLAUDE_3_5_SONNET` model type and updated anthropic models array (now 9 models).
*   **Modified**: `types.ts:372` - Changed `enableCloudSync` default to `true` for automatic data persistence.
*   **Modified**: `types.ts:407` - Set `radioLastStation` default to `'soma-defcon'` (DEF CON Radio).
*   **Modified**: `types.ts:420-486` - Added `ModelCapabilities` interface, `getModelCapabilities()`, and `getModelBadges()` helper functions.
*   **Modified**: `components/ChatInterface.tsx` - Added model capability badges to dropdown and selector button with capability legend.
*   **Modified**: `App.tsx:139-140` - Fixed cloud sync check to use fallback chain for chat loading from server.
*   **Modified**: `App.tsx:82-116` - Added auto-sync functionality that runs every 5 minutes when cloud sync is enabled.
*   **Modified**: `App.tsx:253-256` - Enhanced avatar logging to show sizes for verification.
*   **Modified**: `components/SettingsModal.tsx:610-614` - Added "Enable Web Search for LLMs" toggle to Search tab.
*   **Modified**: `components/SettingsModal.tsx:938-1017` - Added "Sync Now" button with gradient progress bar and real-time status messages.
*   **Modified**: `components/SettingsModal.tsx:95-120` - Added `loadStorageStats()` function to calculate actual IndexedDB and server storage sizes.
*   **Modified**: `components/SettingsModal.tsx:75-93` - Added last sync timestamp persistence (save/load from IndexedDB).
*   **Modified**: `components/SettingsModal.tsx:936-941` - Made Cloud Sync toggle save immediately without requiring Save button.
*   **Modified**: `components/SettingsModal.tsx:152-168` - Made avatar uploads save immediately to prevent data loss.

---

## v2.4.1 - "Stability & Sync Fixes"
*Released: Nov 23, 2025*

Critical bug fixes for settings persistence and cloud sync reliability.

### 🐛 Bug Fixes
*   **Settings Persistence Race Condition**: Fixed critical bug where settings were being overwritten on page load.
    *   Added `settingsLoaded` flag to prevent saves until settings are loaded from IndexedDB.
    *   Settings (radio state, currency, theme, etc.) now persist correctly after refresh.
*   **Cloud Sync Loop Prevention**: Fixed infinite sync loop when cloud sync was enabled.
    *   Added `isLoadingFromServer` flag to prevent save triggers during server load.
    *   Improved load order: IndexedDB → Server merge → Save enabled.
*   **Enhanced Error Handling**: Improved error logging in syncService for better debugging.
    *   Detailed error messages now show exactly what failed and why.
    *   Failed syncs are queued for retry when connection is restored.

### ✅ Verified Systems
*   **Auto-Backup System**: Confirmed 5-minute auto-backup to `./backups/*.json` working correctly.
*   **SQLite Database**: Verified database at `data/rangerplex.db` with tables: chats, settings, users.
*   **Triple-Layer Persistence**: All three storage layers (IndexedDB, SQLite, JSON backups) functioning as designed.

### 🔧 Technical Improvements
*   Settings load flow now properly sequenced to prevent race conditions.
*   Cloud sync error messages include HTTP status codes and response details.
*   Database version management improved (IndexedDB v2 with settings store).

---

## v2.4.0 - "Ranger Radio Command"
*Released: Nov 23, 2025*

This update adds ambient background music to RangerPlex with a floating radio player featuring **50+ SomaFM stations** organized by genre.

### 📻 Ranger Radio Player
*   **Floating Mini-Player**: Bottom-right corner radio with minimize/maximize toggle.
*   **50+ SomaFM Stations**: Complete SomaFM collection organized by genre!
    *   **Ambient** (8): Groove Salad, Drone Zone, Deep Space One, Space Station, and more
    *   **Electronic** (9): DEF CON Radio, Beat Blender, The Trip, Vaporwaves, Dub Step Beyond
    *   **Lounge** (4): Lush, Secret Agent, Illinois Street Lounge, Bossa Beyond
    *   **Rock** (5): Indie Pop Rocks, Underground 80s, Left Coast 70s, Folk Forward
    *   **Metal** (2): Metal Detector, Doomed
    *   **Jazz/Soul** (2): Sonic Universe, Seven Inch Soul
    *   **World** (3): ThistleRadio (Celtic), Suburbs of Goa (Asian), Tiki Time
    *   **Reggae** (1): Heavyweight Reggae
    *   **Holiday** (5): Christmas Lounge, Christmas Rocks!, Xmas in Frisko, and more
    *   **Specials** (5): Black Rock FM (Burning Man), Covers, SF 10-33, and more
*   **Organized Dropdown**: Stations grouped by genre with emojis for easy navigation.
*   **Full Controls**: Play/pause button, volume slider (0-100%), station selector.
*   **Theme Integration**: Radio UI adapts to Dark, Light, and Tron themes with matching glow effects.
*   **Persistent Settings**: Volume, last station, and minimized state saved to database.
*   **Auto-Play Option**: Optionally start music on app launch (browser permissions apply).
*   **CORS Proxy**: Streams routed through local server to bypass browser restrictions.
*   **Error Handling**: Graceful fallback when streams are unavailable.

### 🎨 User Experience
*   **Non-Intrusive Design**: Minimizable player stays out of the way while working.
*   **Focus-Friendly Stations**: LoFi, ambient, and downtempo stations for deep work sessions.
*   **Theme-Matched Effects**: Tron theme shows cyan glow on radio player.
*   **Legal Streams**: All music powered by SomaFM and Jazz24 (free, legal, high-quality).

### 🔧 Technical Implementation
*   **HTML5 Audio API**: Native browser audio with full volume control.
*   **Settings Integration**: New "Radio" tab in Settings modal.
*   **Database Schema**: Radio settings auto-sync with existing triple-layer backup system.
*   **No External Dependencies**: Uses built-in audio capabilities.
*   **Stream Proxy Endpoint**: `/api/radio/stream` routes audio through local server to bypass CORS.
*   **TypeScript Interfaces**: Full type safety for radio stations and settings.

### ⚙️ Infrastructure Updates
*   **Node.js v22 LTS**: Migrated from v20 (deprecated Oct 2026) to v22 for long-term stability.
*   **better-sqlite3 Rebuild**: Recompiled database module for Node v22 (MODULE_VERSION 127).
*   **Dependency Updates**: All packages verified compatible with Node v22.
*   **Documentation**: NODE_VERSION_LOG.md created to track migration history.
*   **README Updates**: System requirements and troubleshooting sections updated for v22.

### 📁 Files Modified/Created
*   **Created**: `components/RadioPlayer.tsx` (598 lines) - Complete radio player component
*   **Created**: `NODE_VERSION_LOG.md` - Node.js migration documentation
*   **Created**: `RANGER_RADIO_TODO.md` - Feature roadmap and implementation notes
*   **Modified**: `proxy_server.js` - Added `/api/radio/stream` CORS proxy endpoint
*   **Modified**: `components/SettingsModal.tsx` - Added Radio tab with station previews
*   **Modified**: `components/Sidebar.tsx` - Updated version display
*   **Modified**: `types.ts` - Added radio settings interfaces
*   **Modified**: `App.tsx` - Integrated RadioPlayer component
*   **Modified**: `README.md` - Added radio usage guide and Node v22 requirements
*   **Modified**: `CHANGELOG.md` - Comprehensive v2.4.0 documentation

### 🎵 Future Enhancements (Roadmap)
*   **v2 (Planned)**: Radio Browser API integration for 30,000+ stations worldwide (search, favorites, custom stations).
*   **v3 (Planned)**: Audio visualizer with theme-specific waveforms and frequency bars.
*   **v4 (Planned)**: Podcast support and recording capabilities.

---

## v2.3.2 - "Model Lists, Real Tests & Perplexity Fix"
*Released: Nov 23, 2025*

### ✅ API Testing & Perplexity Reliability
*   Test buttons now perform real API calls (no mock checkmarks) for Gemini, OpenAI, Anthropic, Perplexity, ElevenLabs, Hugging Face, xAI/Grok, and Brave.
*   Perplexity streaming uses correct headers, better error surfacing, and strict user/assistant alternation to prevent 400 errors.
*   Settings test for Perplexity now uses `sonar-reasoning-pro` with proper headers and payload.

### 🧾 Cost Display & Model Lists
*   Updated OpenAI defaults to `gpt-4.1` / `gpt-4.1-mini` and refreshed Gemini list; sanitized stale dropdown entries.
*   Cost footer restored with “tokens” label, pricing added for Gemini 2.5/3 and Claude 4.x (including broader Claude Sonnet/3.7 matches).
*   Fallback token estimation when providers omit usage; pricing map documented in `COSTS.md`.

### ✨ Celebration & Rename UX
*   Added Holiday Mode styles (Snow / Confetti / Sparkles) with header toggle and quick style cycler.
*   Settings now let you pick the celebration style and toggle rename sparkles.
*   Sidebar renames are inline with a themed sparkle confirmation instead of prompts.
*   Optional “Hide Header Celebration Buttons” toggle to declutter the desktop header.
*   Hover controls hide while renaming, keeping the Save button clear.
*   Rename confirmation now uses a confetti burst animation instead of static sparkles.
*   Added a quick “New” chat button inside the Recent Logs header.
*   Grounding sources now list all URLs and footnote refs [n] in chat link to their source cards.
*   New “Study Notes” view: inline CRUD, filters, pinning, courses/topics, reminders, todos, import/export JSON, per-user IndexedDB storage.

### 🌌 Ranger Vision & UX Polish
*   Screensaver/Matrix mode fixes from prior patch retained (stable images, correct activation/exit behavior).

### 🔒 Security & Licensing
*   RANGER LICENSE retained; .env and sensitive folders protected via .gitignore.

---

## v2.3.1 - "Screensaver Polish, API Validation & Claude Models"
*Released: Nov 23, 2025*

Patch release fixing Ranger Vision Mode, validating all Claude model IDs, and implementing real API key testing.

### 🌌 Ranger Vision Mode Fixes
*   **Manual Activation Working**: Fixed screensaver button - now opens instantly when clicked (was closing immediately due to race condition).
*   **Smart Activation Detection**: Distinguishes between manual activation (eye button) vs auto-activation (idle timer).
*   **Manual Mode Behavior**: When opened manually, stays open until ESC or Exit button pressed (doesn't auto-close on mouse movement).
*   **Auto Mode Behavior**: When opened by idle timer, closes on any mouse/keyboard activity (true screensaver behavior).
*   **Timing Improvements**: Changed slideshow from 5 seconds to 10 seconds per image for better viewing.
*   **Image Stability**: Removed `Date.now()` from image URLs preventing constant flickering/reloading.

### 🤖 Claude API Fixes & Model Updates
*   **Invalid Model IDs Removed**: Removed `claude-3-5-sonnet-20241022` (doesn't exist in Anthropic API).
*   **Official Models Added**: Added Claude Haiku 4.5, Opus 4.1, Claude 3.7 Sonnet from official Anthropic documentation.
*   **8 Claude Models**: Now includes Sonnet 4.5, Haiku 4.5, Opus 4.1, Sonnet 4, Opus 4, Claude 3.7 Sonnet, 3.5 Haiku, 3 Haiku.
*   **Sonnet 4.5 Compatible**: Fixed `temperature` and `top_p` conflict error (Sonnet 4.5 only accepts one, not both).
*   **Empty Message Filter**: Added validation to prevent empty messages in conversation history (Claude API rejects empty content).
*   **Smart Parameter Handling**: Temperature takes priority; top_p only sent if temperature undefined.
*   **All Models Verified**: Every model ID verified against official Anthropic API documentation.

### ✅ API Testing Overhaul
*   **Real API Validation**: Replaced fake "success" checkmarks with actual API calls to verify keys.
*   **All Providers Tested**: Anthropic, Perplexity, ElevenLabs, Hugging Face, Grok/xAI, Brave Search now make real API requests.
*   **Accurate Feedback**: Test buttons now show actual API connection status (valid key ✅ vs invalid key ❌).
*   **Network Error Handling**: Proper error detection and console logging for failed API tests.
*   **Cost-Effective Tests**: Minimal token usage (10 tokens) for Claude/Perplexity/Grok test requests.

### 🔒 Security & Legal
*   **RANGER LICENSE Created**: Open shareware license - free for personal/educational use, revenue share required for commercial use.
*   **Contact for Commercial**: Email rangersmyth.74@gmail.com for commercial licensing agreements.
*   **.gitignore Enhanced**: Protected `.env` file, `docs/` folder, and `.claude/` folder from git commits.
*   **API Key Protection**: .env file now properly ignored, .env-example safe to commit.

### 🎯 User Experience
*   **Screensaver Now Outstanding**: 10-second transitions, stable images, instant manual activation.
*   **Claude Models Verified**: All 8 Claude models working with official Anthropic API IDs.
*   **API Keys Validated**: Test buttons now actually verify your API keys work (no more fake checkmarks!).
*   **Repository Ready**: Proper licensing and security for GitHub deployment.

---

## v2.3.0 - "Cloud Sync Control & Claude 4"
*Released: Nov 23, 2025*

This update brings optional cloud synchronization, Claude 4 model support, and critical stability fixes for local deployment.

### ☁️ Cloud Sync Control
*   **Enable/Disable Toggle**: Added `enableCloudSync` setting in Data & Backup tab (default: OFF).
*   **Smart Sync Service**: Sync service only connects when explicitly enabled by user.
*   **Clean Console**: Eliminated 404 errors and WebSocket spam when sync is disabled.
*   **Conditional Sync**: App.tsx now respects the toggle - only syncs to server when enabled.

### 🤖 Claude 4 Model Support
*   **Latest Models Added**:
    *   Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) - Newest flagship model
    *   Claude Opus 4 (`claude-opus-4-20250514`) - Most powerful
    *   Claude Haiku 4 (`claude-haiku-4-20250514`) - Fastest
*   **Legacy Models Retained**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus still available.
*   **API Compatibility**: Verified `anthropic-version: 2023-06-01` works with Claude 4 models.

### 🐛 Critical Fixes
*   **Claude CORS Fixed**: Excluded Claude from auto web search (was causing CORS errors and hanging).
*   **Stop Button Working**: Implemented proper stop functionality - button now actually stops streaming.
*   **Port Configuration**: Fixed proxy server port mismatch (3010 vs 3001).
*   **Accessibility**: Added `id`, `name`, and `aria-label` to chat textarea for better autofill and screen reader support.

### 📚 Documentation
*   **OPTION_B_LOCAL_SQLITE_SYNC.md**: Complete guide to building local SQLite sync server with WebSocket support.
*   **OPTION_C_GOOGLE_CLOUD_FIREBASE_SYNC.md**: Full Firebase integration tutorial for cloud sync with authentication.
*   **Architecture Diagrams**: Detailed explanations of 4-layer backup system.

### 🔧 Technical Improvements
*   **SyncService Refactor**: Added `enableSync()` and `disableSync()` methods with reconnection control.
*   **Dependency Fix**: Corrected `@google/genai` version from `0.1.1` to `1.30.0` in package.json.
*   **Vite Build System**: Fully operational with `npm start` running both proxy and frontend servers concurrently.

### 🎯 User Experience
*   **Instant Claude Responses**: No more "Scanning Network..." hang on Claude models.
*   **Zero Console Spam**: Clean developer console with only informational messages.
*   **Clear Sync Status**: Visual indicators showing cloud sync state in Settings.

---

## v2.0.0 - "The Ultimate Studio"
*Released: Late 2025*

This update transformed RangerPlex from a text chatbot into a full multi-modal creative studio.

### ✨ New Features
*   **Media Studio**:
    *   Added **Image Generation** (DALL-E 3, Imagen 3, Flux.1).
    *   Added **Parallel Generation** (`/imagine_all`) to compare models side-by-side.
    *   Added **ElevenLabs Integration** for cinematic text-to-speech.
*   **Token Economics**:
    *   Added real-time currency conversion (USD, EUR, GBP, etc.).
    *   Added precise cost-per-message estimation based on model pricing maps.
*   **The Newsroom**:
    *   Added `/news` command. The AI researches a topic, writes a script, generates a thumbnail, and reads it out loud.
*   **Providers**:
    *   Added support for **Grok (xAI)** and **Hugging Face Inference**.
    *   Updated Gemini models to 2.0/3.0 series and GPT to 5.1 Preview.

---

## v2.1.0 - "Fort Knox & The Local Frontier" (Security & Privacy)
*Released: Nov 23, 2025*

This update focuses on workstation security, privacy-first local AI, and user experience refinements.

### 🔒 Security & Prank Mode
*   **FBI Lock Screen**: Implemented a "Seized" screen for failed login attempts (or just for fun).
*   **Escape Mechanisms**: Configurable ways to exit the prank screen:
    *   **The Bribe**: Pay a fake fine.
    *   **The Hacker**: Type `UNLOCK` (invisible input).
    *   **Time Served**: Wait out a timer.
    *   **Panic Click**: Click the logo rapidly.
*   **Workstation Lock**: Added a dedicated Lock Button 🔒 to the sidebar.
    *   **Resume Session**: Locking the screen no longer logs you out; it simply secures the session until you re-enter your password.

### 🧠 Local Intelligence (Ollama)
*   **DeepSeek Integration**: Added native support for `deepseek-coder:6.7b`.
*   **Smart Network Handling**: Fixed "Scanning Network" errors by automatically disabling web search for local models (DeepSeek, Llama, Mistral) to ensure instant, offline responses.

### ⚡ UI Enhancements
*   **Web Search Toggle**: Added a manual globe button 🌐 in the input area to toggle web search on/off instantly.
*   **Visual Polish**: Improved the visibility of the FBI background on the lock screen (60% opacity).

---

## v2.2.0 - "Fort Knox 2.0: Triple Redundancy" (Data Resilience)
*Released: Nov 23, 2025*

This update introduces a professional-grade data persistence system with triple-layer redundancy to ensure your data is never lost.

### 💾 Triple-Layer Persistence
*   **IndexedDB**: Fast browser-based storage (replaces localStorage).
*   **SQLite Backend**: Server-side database for permanent storage.
*   **File Export**: Auto-backup to JSON files every 5 minutes in `./backups/`.

### 🔄 Real-Time Sync
*   **WebSocket Sync**: Instant synchronization between browser and server.
*   **Offline Queue**: Changes are queued and synced when reconnected.
*   **Conflict Resolution**: Server-side data takes precedence.

### 🗄️ Database Features
*   **Auto-Setup**: SQLite database auto-created on first run (no installation needed).
*   **Multi-OS**: Works on Windows, macOS, and Linux.
*   **Migration**: Automatic migration from localStorage to IndexedDB.

### ⚙️ New Settings Tab: "Data & Backup"
*   **Sync Status**: Real-time connection status and last sync time.
*   **Storage Stats**: View usage across all three layers.
*   **Data Management**: Export, import, clear browser cache, or wipe server database.
*   **Auto-Backup Settings**: Configure export intervals and backup location.

### 🛠️ Backend Enhancements
*   **Upgraded Server**: `proxy_server.js` → `rangerplex_server.js`
*   **REST API**: New endpoints for sync, export, import, and data management.
*   **Dependencies**: Added `better-sqlite3`, `ws`, and `idb` for database and WebSocket support.
*   **Node v22 LTS**: Recommended for stability (v20 deprecated Oct 2026, v25 not supported).

### 🔑 Environment Configuration
*   **.env Support**: API keys can be stored in `.env` file (with `VITE_` prefix).
*   **Auto-Load**: Keys from `.env` auto-load as defaults on first run.
*   **Priority System**: Settings > .env > Empty.
*   **Security**: `.env` is gitignored (never committed).

### 🎨 Ollama Loading Effects
*   **Neural Link**: Sleek top bar with status updates.
*   **Terminal Boot**: Matrix-style boot sequence log (centered, 10x bigger).
*   **Brain Pulse**: Subtle button heartbeat animation.
*   **Model Pull Visualization**: Matrix-style download effect with glowing progress bar.

### 🌌 Ranger Vision Mode (NEW!)
*   **Screensaver Mode**: Beautiful fullscreen slideshow with transition effects.
*   **Matrix Rain Effect**: Toggle digital rain overlay for cyberpunk aesthetics.
*   **Auto-Activation**: Activates after configurable idle time (default: 5 minutes).
*   **Manual Trigger**: Eye icon button in sidebar for instant activation.
*   **Keyboard Shortcuts**: Space (pause), ←/→ (navigate), M (matrix), ESC (exit).
*   **Clock Display**: Optional real-time clock overlay.
*   **Hybrid Mode**: Both auto and manual activation supported.

### 🧾 Cost Display Improvements (Maintenance)
*   Updated OpenAI defaults to `gpt-4.1` / `gpt-4.1-mini` and refreshed Gemini model lists.
*   Fixed model dropdown invalid IDs and added sanitization to remove stale entries.
*   Restored cost-per-message display with clearer “tokens” labeling and added pricing for Gemini 2.5/3 and Claude 4.x models (including broader Claude Sonnet/3.7 coverage).
*   Documented pricing map and cost calculation behavior in `COSTS.md`.

---

## v1.5.0 - "The Black Screen War" (Critical Fixes)
*The Era of Stability*

This version marked the migration from a simple HTML script to a professional Vite build system.

### 🐛 The "Black Screen" Saga
*   **The Issue**: Attempting to run React 19 code in a React 18 environment caused the "White/Black Screen of Death" on local machines (MacBook Pro M3).
*   **The Battle**: We attempted to fix `index.html` import maps 9 times.
*   **The Discovery**: `http-server` cannot handle `.tsx` files directly. Browsers don't speak TypeScript.
*   **The Solution**: Migrated to **Vite** (`npm run dev`).
    *   Added `package.json` and `vite.config.js`.
    *   Cleaned `index.html` of all CDN links to rely on local `node_modules`.
    *   Fixed `@google/genai` version from `0.1.1` (broken) to `1.30.0` (stable).

---

## v1.2.0 - "The Grid"
*Visual Overhaul & Code Power*

*   **Tron Theme**: Implemented a 3D animated grid background and neon aesthetics.
*   **Pyodide Integration**: Added the ability to run Python code client-side for data analysis.
*   **Command Deck**: Added the quick-action toolbar (Web, Visual, Flash, Deep).

---

## v1.1.0 - "The Council"
*Agentic Workflows*

*   **Multi-Agent System**: Added the "Council" mode where multiple AI personas (Researcher, Skeptic) debate before answering.
*   **Settings Overhaul**: Added customizable Agents and Avatars.
*   **Proxy Server**: Built `proxy_server.js` to bypass CORS for Anthropic and DuckDuckGo.

---

## v1.0.0 - "Genesis"
*Initial Release*

*   Basic Chat Interface.
*   Gemini API Integration.
*   RAG (PDF/Doc upload) via `pdfjs-dist` and Gemini Embeddings.
*   Local History storage.

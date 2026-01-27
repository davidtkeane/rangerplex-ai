# RangerPlex Changelog

All notable changes to the **RangerPlex Browser** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.4.1] - 2026-01-27 - README Quick Start Guide

### Added
- **README.md**: Added Step 1 / Step 2 quick start guide at the top of the README with one-liner install commands for Windows (`irm ... | iex`), macOS (`curl ... | bash`), and Linux/WSL
- **README.md**: Added Step 2 "Start RangerPlex" section with `npm run pm2:start` (recommended) and `npm run dev` commands, plus PM2 cheat sheet
- **README.md**: Added note clarifying `npm run build` is NOT required to run the app

---

## [4.4.0] - 2026-01-27 - Smart Install Scripts: OS Detection, Auto-Install & Cool UI

### Summary
Overhauled both install scripts (`install-me-now.sh` and `install-me-now.ps1`) to v2.6.0 with smart OS/distro detection, a visual system info dashboard, auto-install via package managers (brew, winget, apt, etc.), and broader Linux distro support.

### Added

#### Bash Script (`install-me-now.sh`)
- **OS/Distro Detection**: New `detect_distro()` function identifies macOS (with version name + Apple Silicon/Intel), Ubuntu, Kali Linux, Debian, Fedora, Arch Linux, Alpine Linux, openSUSE, CentOS/RHEL, Raspberry Pi OS, and WSL
- **System Info Box**: Displays a bordered dashboard showing OS, Architecture, Package Manager, Shell version, and WSL status before preflight check
- **Alpine Linux support**: `apk` package manager now supported in `ensure_pkg`
- **openSUSE support**: `zypper` package manager now supported in `ensure_pkg`
- **CentOS/RHEL support**: `yum` package manager now supported in `ensure_pkg`
- **Homebrew auto-install** (macOS): Docker Desktop (`brew install --cask docker`) and Ollama (`brew install ollama`) install automatically when Homebrew is available
- **Direct Node.js install**: Users can now choose between nvm or system package manager (`brew install node@22` on macOS, `sudo apt install nodejs npm` on Linux with NodeSource for v22, plus dnf/pacman/apk/zypper/yum support)

#### PowerShell Script (`install-me-now.ps1`)
- **Windows System Info**: New `Get-SystemInfo` function detects Windows version/edition/display version (e.g. "Windows 11 Pro (23H2)"), architecture (x86_64/ARM64), winget availability, and total RAM
- **System Info Box**: Displays a bordered dashboard showing OS, Arch, Package Manager, and RAM before preflight check
- **winget auto-install**: Docker Desktop (`winget install Docker.DockerDesktop`), Ollama (`winget install Ollama.Ollama`), LM Studio (`winget install ElementLabs.LMStudio`), and Git (`winget install Git.Git`) can all be auto-installed via winget
- **Batch winget install**: Preflight check now offers to auto-install all missing optional tools in one go via winget

### Changed
- Both scripts bumped to **v2.6.0**
- OS detection in bash script now uses `detect_distro()` globals instead of inline `uname` checks
- Package manager variable (`PM`) now seeded from early distro detection, with fallback detection retained

---

## [4.3.8] - 2026-01-20 - Backup Retention System 💾🧹

### Summary
Implemented automatic backup retention policy to prevent disk bloat. The backup system now keeps only recent backups (~1 hour rolling window) plus one "golden" safety backup for disaster recovery. **Freed 10.8GB of disk space** from accumulated backup files!

### 📁 Backup File Locations

| File Type | Location | Purpose |
|-----------|----------|---------|
| **Rolling Backups** | `./backups/RangerPlex_Backup_YYYY-MM-DDTHH-MM-SS.json` | Last 12 backups (~1 hour) |
| **Golden Backup** | `./backups/RangerPlex_GOLDEN_Backup.json` | Permanent safety backup |
| **Database** | `./data/rangerplex.db` | SQLite database (chats, settings, users) |

### 🔄 How Backup Retention Works

```
Every 5 Minutes:
1. New backup created → RangerPlex_Backup_2026-01-20T21-05-00.json
2. Cleanup runs automatically:
   - Count all timestamped backups
   - If > 12 backups exist:
     a. Keep newest 12 backups (rolling 1-hour window)
     b. If no golden backup exists, promote oldest to golden
     c. Delete remaining old backups
3. Max disk usage: ~110MB (12 × ~9MB + 1 golden)
```

### 📊 Retention Settings

| Setting | Value | Notes |
|---------|-------|-------|
| **Backup Interval** | 5 minutes | Creates timestamped JSON backup |
| **Retention Count** | 12 backups | ~1 hour of rolling history |
| **Golden Backup** | 1 permanent | Never auto-deleted, safety net |
| **Max Disk Usage** | ~110 MB | Previously grew to 11+ GB! |

### 🆘 Recovery Scenarios

#### Restore from Recent Backup (Last Hour)
1. Stop the server
2. Locate desired backup: `ls -la backups/RangerPlex_Backup_*.json`
3. Import via Settings → Import/Export → Import Backup

#### Restore from Golden Backup (Disaster Recovery)
1. Stop the server
2. Use: `backups/RangerPlex_GOLDEN_Backup.json`
3. Import via Settings → Import/Export → Import Backup

### 🔧 Technical Changes

#### `proxy_server.js` (Lines 4212-4278)
- Added `BACKUP_RETENTION_COUNT = 12` constant
- Added `GOLDEN_BACKUP_NAME = 'RangerPlex_GOLDEN_Backup.json'` constant
- Added cleanup logic after each backup creation:
  - Lists all timestamped backups
  - Sorts by modification time (newest first)
  - Keeps newest 12, deletes the rest
  - Creates golden backup from oldest before deletion

### 📈 Disk Space Impact

| Metric | Before | After |
|--------|--------|-------|
| **Backup Count** | 2,126 files | 13 files (12 + 1 golden) |
| **Folder Size** | 11 GB | ~168 MB |
| **Space Freed** | - | **~10.8 GB** |

### 💡 Tips

1. **Golden Backup is Sacred**: The `RangerPlex_GOLDEN_Backup.json` file is never automatically deleted. Keep it as your safety net!

2. **Manual Backup Before Updates**: Before major updates, you can manually copy a backup:
   ```bash
   cp backups/RangerPlex_Backup_*.json ~/Desktop/rangerplex_manual_backup.json
   ```

3. **Check Backup Health**:
   ```bash
   ls -lah backups/
   du -sh backups/
   ```

### 📝 Development Notes
- **Developer**: Colonel Gemini Ranger 🎖️
- **Date**: 2026-01-20
- **Issue**: Backup folder grew to 12GB with 2,126 JSON files over 2 months
- **Solution**: Auto-cleanup with rolling retention + golden safety backup

---

## [4.3.7] - 2026-01-11 - Terminal UI Options 🖥️

### Summary
Added two ways to access the Ranger Terminal: the original in-app bottom panel (Console button) and a new popup window option from the Developer menu.

### 🔄 Changes

#### Console Button Reverted to Original Behavior
- **Console button** now opens the terminal panel from the **bottom of the app** (original behavior)
- This provides the familiar integrated terminal experience within RangerPlex

#### New Developer Menu Option: Ranger Terminal (Popup)
- Added **"Ranger Terminal (Popup)"** option to the **Developer** menu in the Electron app menu bar
- Keyboard shortcut: `Cmd+Shift+T` (macOS) / `Ctrl+Shift+T` (Windows/Linux)
- Opens terminal in a **separate floating window** with:
  - Frameless design
  - Always on top
  - Transparent glass effect
  - Position/size persistence (remembers where you left it)

### 📁 Files Modified

#### App.tsx
- Reverted `toggleTerminal()` to use in-app panel (`setIsTerminalOpen`)
- Added new `openTerminalPopup()` function for popup window functionality
- Added listener for `'open-ranger-terminal'` event from main process

#### electron/main.cjs
- Added **"Ranger Terminal (Popup)"** menu item to Developer submenu
- Shortcut: `CmdOrCtrl+Shift+T`
- Sends `'open-ranger-terminal'` event to renderer

### 📋 Two Terminal Access Methods

| Method | Access | Behavior |
|--------|--------|----------|
| **Console Button** | Toolbar button | Opens panel from bottom of app (in-app) |
| **Developer → Ranger Terminal** | Menu bar or `Cmd+Shift+T` | Opens floating popup window |

### 🗺️ All Terminal Locations in RangerPlex

All terminal instances use the **same core component**: `components/Terminal/RangerTerminal.tsx`

| # | Location | File & Lines | How to Access |
|---|----------|--------------|---------------|
| 1 | **Bottom Panel** | `App.tsx:1560-1588` | Console button (default) |
| 2 | **Workspace Tab** | `App.tsx:1405-1409` | Console button (if `terminalOpenInTab` setting ON) |
| 3 | **Code Editor Split** | `EditorTerminalSplit.tsx:359` | Monaco editor → "Show Term" button |
| 4 | **Popup Window** | `TerminalPopup.tsx` | Developer menu → Ranger Terminal |

#### Core Terminal Component
- **File**: `components/Terminal/RangerTerminal.tsx`
- **Technology**: xterm.js + WebSocket connection to `ws://localhost:3000/terminal`
- **Backend**: `proxy_server.js` uses `node-pty` to spawn shell process

#### Code Editor Terminal (EditorTerminalSplit)
- **File**: `src/components/CodeEditor/EditorTerminalSplit.tsx`
- **Features**:
  - Monaco editor on top, terminal on bottom
  - Resizable split view (drag handle)
  - "Show Term" / "Hide Term" toggle button
  - Run code directly in terminal (Ctrl/Cmd + Enter)
  - Auto-save workspace to localStorage

### 🔍 Terminal Blank Window Investigation (Debug Session)

When the terminal popup window was showing blank (no prompt), we conducted extensive debugging:

#### Problem Reported
- Terminal popup window opened but was completely blank
- No shell prompt visible
- No error messages displayed

#### Architecture Reviewed
1. **TerminalPopup.tsx** (`src/components/Browser/TerminalPopup.tsx`)
   - Renders the popup window UI with drag handle and close button
   - Imports RangerTerminal from `../../../components/Terminal/RangerTerminal`

2. **RangerTerminal.tsx** (`components/Terminal/RangerTerminal.tsx`)
   - Uses xterm.js for terminal rendering
   - Connects to WebSocket at `ws://localhost:3000/terminal`
   - Constructs URL from `window.location.hostname`

3. **proxy_server.js** (lines 4097-4200)
   - WebSocket server handles `/terminal` endpoint
   - Uses `node-pty` to spawn shell process
   - Forwards data between WebSocket and PTY

4. **electron/main.cjs** (lines 280-360)
   - `open-terminal-window` IPC handler
   - Loads `http://localhost:${SERVER_PORT}/terminal-popup`
   - SERVER_PORT = 5173 (Vite), PROXY_PORT = 3000 (WebSocket)

#### Debug Logging Added (Then Removed)

**RangerTerminal.tsx:**
```javascript
console.log('[RangerTerminal] useEffect starting - initializing terminal');
console.log('[RangerTerminal] Container element:', container ? 'found' : 'null');
console.log('[RangerTerminal] Container dimensions:', container.clientWidth, 'x', container.clientHeight);
console.log('[RangerTerminal] Connecting to WebSocket:', socketUrl);
term.writeln('[DEBUG] Terminal initialized, connecting...');
term.writeln(`[DEBUG] WebSocket URL: ${socketUrl}`);

// Proxy server health check
fetch('http://localhost:3000/api/version')
  .then(res => term.writeln(`[DEBUG] Proxy server responded: ${res.status}`))
  .catch(err => term.writeln(`[ERROR] Proxy server (port 3000) not reachable!`));
```

**TerminalPopup.tsx:**
```javascript
console.log('[TerminalPopup] Component mounted');
console.log('[TerminalPopup] Loading complete');
```

**electron/main.cjs:**
```javascript
floatingTerminalWindow.webContents.openDevTools({ mode: 'detach' });
console.log(`[Terminal] Popup loading from: http://localhost:${SERVER_PORT}/terminal-popup`);
floatingTerminalWindow.webContents.on('did-finish-load', () => console.log('[Terminal] Popup finished loading'));
floatingTerminalWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => console.error(`[Terminal] Failed to load: ${errorCode} - ${errorDescription}`));
```

#### Potential Causes Identified

1. **WebSocket Connection Failure**
   - Proxy server on port 3000 not running
   - WebSocket URL incorrectly constructed
   - Connection blocked by security policy

2. **Container Size Issue**
   - If container has 0 dimensions, xterm.js won't render
   - `fit()` returns early if `clientWidth === 0 || clientHeight === 0`

3. **CSS Loading Issue**
   - xterm.css might not load in popup context
   - Import: `import 'xterm/css/xterm.css'`

4. **Routing Issue**
   - App.tsx checks `window.location.pathname === '/terminal-popup'`
   - Vite SPA routing must serve index.html for all routes

5. **Race Condition**
   - Popup opens before proxy server (port 3000) is ready
   - `npm run start` runs both Vite (5173) and proxy (3000) concurrently

#### Resolution
User decided to keep both terminal access methods:
- **Console button** → Original bottom panel (works reliably)
- **Developer menu** → Popup window (for those who prefer it)

This provides flexibility while maintaining the stable in-app terminal option.

---

## [4.3.6] - 2026-01-11 - Console Window Persistence & Canvas Fix 🖥️🎨

### Summary
Added Sublime Text-style window state persistence to the Console (Terminal) button! Also fixed a critical Canvas bug where the drawing canvas was appearing black instead of white/transparent.

### 🚀 New Features

#### Console/Terminal Window Persistence
- **Separate Electron Window**: Console now opens in a separate floating window (like VS Code/WordPress/Canvas)
- **Position & Size Memory**: Window remembers exactly where you left it
- **Debounced Saves**: State saves are debounced (500ms) to avoid excessive writes
- **Close State Capture**: Final window state is saved on window close
- **Always On Top**: Terminal window stays floating above other windows (preserved from original design)
- **Frameless & Transparent**: Retains the sleek glass effect design

### 📁 New Files Created

- `src/services/terminalStateService.ts` - Terminal window state persistence service
  - Saves window position/size (x, y, width, height)
  - Saves maximized state
  - Saves alwaysOnTop preference
  - User-scoped localStorage keys (`ranger_terminal_state_{userId}`)

### 🔧 Modified Files

#### App.tsx
- Added import for `terminalStateService`
- Added `terminalStateService.setUser(currentUser)` in useEffect
- Added `onTerminalWindowState` listener for receiving state updates
- Modified `toggleTerminal()` to call IPC directly in Electron mode (bypasses in-app panel)

#### electron/main.cjs
- Added `open-terminal-window` IPC handler with:
  - Window bounds parameter support
  - Debounced save on move/resize (500ms)
  - Final state save on window close
  - Sends `terminal-window-state` IPC to main window
- Updated `toggle-floating-terminal` for backwards compatibility

#### electron/preload.cjs
- Added `openTerminalWindow(windowBounds)` API method
- Added `onTerminalWindowState(callback)` listener for Terminal state updates

### 🎯 Window Defaults

| App | Default Position | Default Size | Special |
|-----|-----------------|--------------|---------|
| VS Code | (100, 100) | 1600x1000 | - |
| WordPress | (100, 100) | 1400x900 | - |
| Canvas | (50, 50) | 1400x900 | - |
| **Terminal** | (100, 100) | 600x400 | Frameless, Always On Top, Transparent |

### 🔑 localStorage Keys (Complete Suite)

- `ranger_vscode_state_{userId}` - VS Code window state
- `ranger_wordpress_state_{userId}` - WordPress window state
- `ranger_canvas_state_{userId}` - Canvas window state
- `ranger_terminal_state_{userId}` - Terminal window state (NEW!)

### 🐛 Bug Fixes

#### Canvas Black Background Issue (FIXED)
- **Problem**: Canvas was showing a BLACK background when opened, only showing white after clicking Clear
- **Root Cause 1**: Drawing canvas had `.canvas-dark` CSS class applying `background: #2a2a2a`
- **Root Cause 2**: Canvas was saved as JPEG (`toDataURL('image/jpeg')`) which doesn't support transparency - transparent areas became BLACK when saved, then loaded as black
- **Fix 1**: Removed theme class from drawing canvas (it should always be transparent)
- **Fix 2**: Changed save format from JPEG to PNG (`toDataURL('image/png')`) to preserve transparency
- **Result**: Canvas now shows correct white/colored background from the start
- **Note**: Existing boards saved as JPEG may still show black - click Clear once to reset

#### Files Modified for Canvas Fix
- `src/components/CanvasBoard.tsx`:
  - Line 264: Removed `canvas-${theme}` class from drawing canvas
  - Line 124: Changed from `toDataURL('image/jpeg', 0.7)` to `toDataURL('image/png')`
  - Added `hadContent` check before resize to prevent unnecessary operations

### 🔍 Canvas Autosave Debug Logging (Investigation)

Added comprehensive debug logging to investigate canvas autosave issues:

#### `src/components/CanvasBoard.tsx` - Debug Additions:
- **Load function**: Logs board ID, name, and loaded imageData details
  ```
  [Canvas] Loading board image for: board_xxx Blank Board 1
  [Canvas] Loaded imageData: {hasData: true/false, length: xxx, preview: ...}
  ```
- **Save function**: Logs board details and validates canvas dimensions before save
  ```
  [Canvas] Saving board: {id: xxx, name: xxx, imageDataLength: xxx, canvasSize: WxH}
  ```
- **handleMouseUp**: Logs drawing state and stopDrawing result
  ```
  [Canvas] handleMouseUp called, isDrawing: true/false
  [Canvas] stopDrawing returned data: true/false
  ```
- **Dimension validation**: Prevents save if canvas has zero dimensions (logs warning)

#### How to Debug Canvas Save Issues:
1. Open DevTools (Cmd+Option+I) **in the Canvas popup window** (not main window!)
2. Go to Console tab
3. Open Canvas and draw something
4. Watch for `[Canvas]` prefixed logs
5. Check if saves are being triggered and with valid data

#### Canvas Autosave Not Persisting Drawings (FIXED)

**Problem**: Drawings were not persisting between canvas sessions. User would draw, close canvas, reopen, and drawing was gone - even though logs showed saves were succeeding.

**Investigation Steps Taken**:
1. Added debug logging to `saveBoard()` function - confirmed saves were being called
2. Added debug logging to `loadBoardImage()` - confirmed data was being loaded
3. Added debug logging to `handleMouseUp()` - confirmed drawing events were firing
4. Added debug logging to `useCanvasBoards` hook - confirmed board IDs were consistent
5. Added debug logging to `canvasDbService` - confirmed IndexedDB operations succeeded
6. Added debug logging to `autoSaveService` - confirmed queue was flushing
7. Observed console logs showed: `[Canvas] Image drawn to canvas` AND `[canvasDbService] Board saved successfully`
8. BUT also saw: `[Canvas] No imageData to load or canvas not ready`
9. Noticed `[CanvasEditor] Component mounting` appearing 4-6 times rapidly

**Root Cause Found**:
- React was causing rapid mount/unmount cycles of the CanvasEditor component
- The `useEffect` cleanup (unmount) was calling `saveBoard()` every time
- During rapid re-mounts, the cleanup would fire BEFORE the image finished loading
- This saved an **EMPTY canvas** over the existing drawing data
- Sequence: Mount → Start loading image → Unmount (save empty!) → Mount again → Load (but data is now empty)

**Fix Implemented**:
- Added `hasContentRef` (useRef) to track if canvas has content worth saving
- `hasContentRef.current = true` set when:
  1. Image successfully loads from database (`img.onload` callback)
  2. User draws something (`handleMouseUp` after successful stroke)
- Unmount save now checks: `if (hasContentRef.current)` before saving
- If no content, logs: `[Canvas] Unmount save: hasContent=false, skipping save to prevent data loss`

**Files Modified**:
- `src/components/CanvasBoard.tsx`:
  - Added `hasContentRef = useRef(false)` state
  - Set `hasContentRef.current = true` in image load success callback
  - Set `hasContentRef.current = true` in `handleMouseUp` after successful draw
  - Updated unmount useEffect to check `hasContentRef.current` before saving

**Lesson Learned**:
- React StrictMode and component re-renders can cause rapid mount/unmount cycles
- Cleanup functions that save state can overwrite data if the component hasn't fully initialized
- Use refs (not state) for values that need to be accessed in cleanup functions
- Always guard "save on unmount" with a flag indicating valid content exists

### 📝 Development Notes
- **Developer**: Ranger (AIRanger) 🎖️
- **Date**: 2026-01-11
- **Testing**: Restart Electron, click Console button, move/resize window, close and reopen to verify position persistence
- **Canvas Testing**: Open Canvas, verify white background appears immediately (not black)
- **Canvas Autosave Testing**: Draw something, close canvas, reopen - drawing should persist
- **Canvas Debug**: Check browser console for `[Canvas]` logs when drawing/saving

---

## [4.3.5] - 2026-01-11 - Sublime Text-style Window Persistence 🪟

### Summary
Major update adding Sublime Text-style window state persistence for VS Code, WordPress, AND Canvas windows. When you close and reopen these windows, they remember their exact position and size! Also includes critical bug fixes for double window issues and singleton pattern fixes.

### 🚀 New Features

#### Window Persistence (All Three Apps)
- **VS Code Window Persistence**: Code button remembers window position, size, and port (default: 8181)
- **WordPress Window Persistence**: WP button remembers window position, size, and port (default: 8081)
- **Canvas Window Persistence**: Canvas button opens in separate window with position/size memory
- **Debounced Saves**: Window state saves are debounced (500ms) to avoid excessive writes
- **Close State Capture**: Final window state is saved on window close event
- **IPC State Sync**: Main process sends state updates back to renderer for localStorage persistence
- **User-Scoped Storage**: Each user has their own saved window positions

#### Canvas Separate Window
- Canvas now opens in a **separate Electron window** (like VS Code/WordPress)
- Loads the full Canvas drawing board with all tools via `/canvas-popup` route
- Board data still persists via existing `canvasDbService`
- Window position is now ALSO persisted via `canvasStateService`

### 🐛 Bug Fixes

#### Double Window Issue (FIXED)
- **Problem**: Clicking WP/Code/Canvas buttons was opening TWO windows (overlay + new window)
- **Cause**: Button handlers set state to show overlay, then Page components opened new window
- **Fix**: In Electron mode, buttons now call IPC directly without showing overlay
- **Result**: One click = One window (no overlay in Electron mode)

#### Singleton Pattern Fix (FIXED)
- **Problem**: Canvas state wasn't being saved properly
- **Cause**: Dynamic imports (`await import(...)`) were creating separate module instances, breaking singleton pattern
- **Fix**: All three state services are now imported at top-level of App.tsx
- **Result**: State services work correctly with consistent localStorage saves

### 📁 New Files Created

#### State Services
- `src/services/vscodeStateService.ts` - VS Code window state persistence
- `src/services/wordpressStateService.ts` - WordPress window state persistence
- `src/services/canvasStateService.ts` - Canvas window state persistence

#### Page Components
- `src/pages/Canvas/CanvasPage.tsx` - Opens Canvas in separate Electron window

### 🔧 Modified Files

#### App.tsx (Major Changes)
- Added top-level imports for all three state services
- Added `/canvas-popup` route for standalone Canvas window
- Added `useEffect` to set user on all state services when `currentUser` changes
- Added `useEffect` to listen for window state updates from all three windows
- Modified `openCanvas()` - calls IPC directly in Electron mode (no overlay)
- Modified `openWordPress()` - calls IPC directly in Electron mode (no overlay)
- Modified `openEditor()` - calls IPC directly in Electron mode (no overlay)
- Added debug logging for window bounds when opening windows
- Canvas rendering now uses `CanvasPage` in Electron mode, `CanvasBoard` overlay in browser mode

#### electron/main.cjs
- Added `open-canvas-window` IPC handler with:
  - Window bounds parameter support
  - Loads `/canvas-popup` route
  - Debounced save on move/resize (500ms)
  - Final state save on window close
  - Sends `canvas-window-state` IPC to main window
- Updated `open-vscode-window` handler with window bounds support
- Updated `open-wordpress-window` handler with window bounds support

#### electron/preload.cjs
- Added `openCanvasWindow(windowBounds)` API method
- Added `onCanvasWindowState(callback)` listener for Canvas state updates
- Updated `openVSCodeWindow(port, windowBounds)` to accept bounds
- Updated `openWordPressWindow(url, port, windowBounds)` to accept bounds
- Added `onVSCodeWindowState(callback)` listener
- Added `onWordPressWindowState(callback)` listener

#### Page Components Updated
- `src/pages/VSCode/VSCodePage.tsx` - Uses state service, listens for window updates
- `src/pages/WordPress/WordPressPage.tsx` - Uses state service, listens for window updates

### 📝 How Window Persistence Works

```
1. User clicks Code/WP/Canvas button
2. App.tsx handler gets saved bounds from state service
3. Calls Electron IPC with bounds (e.g., openCanvasWindow(bounds))
4. Main process creates BrowserWindow at saved position/size
5. As user moves/resizes window:
   - Main process detects move/resize events
   - Debounces for 500ms
   - Sends state back to main window via IPC
   - App.tsx listener receives state
   - State service saves to localStorage
6. On window close:
   - Final bounds are captured
   - Sent to main window via IPC
   - Saved to localStorage
7. Next time user clicks button:
   - State service loads saved bounds
   - Window opens exactly where user left it!
```

### 🎯 Default Window Sizes

| App | Default Position | Default Size |
|-----|-----------------|--------------|
| VS Code | (100, 100) | 1600x1000 |
| WordPress | (100, 100) | 1400x900 |
| Canvas | (50, 50) | 1400x900 |

### 🔑 localStorage Keys

- `ranger_vscode_state_{userId}` - VS Code window state
- `ranger_wordpress_state_{userId}` - WordPress window state
- `ranger_canvas_state_{userId}` - Canvas window state

### 📝 Development Notes
- **Developer**: Ranger (AIRanger) 🎖️
- **Date**: 2026-01-11
- **Testing**: Restart Electron after changes, check browser console for state save logs

---

## [4.3.4] - 2026-01-11 - Smart Dependency & Native Module Recovery 🔧

### Summary
Enhanced the launch script with intelligent dependency checking and automatic native module recovery. The script now detects Node.js version mismatches and automatically rebuilds native modules like `node-pty` without manual intervention.

### 🚀 New Features
- **Auto-Dependency Check**: Script checks if `node_modules` exists and runs `npm install` automatically if missing.
- **Native Module Recovery**: Detects `NODE_MODULE_VERSION` mismatch errors and auto-runs `npm rebuild`.
- **Critical Dependency Validation**: Verifies `electron`, `vite`, and `node-pty` are installed before launch.
- **Dynamic .nvmrc Support**: Reads expected Node version from `.nvmrc` file for accurate version guidance.

### 🐛 Bug Fixes
- **Native Module Version Mismatch**: Fixed crashes when native modules were compiled for different Node.js version.
  - Affected: `node-pty`, `better-sqlite3`
  - Error: `NODE_MODULE_VERSION 115` vs `NODE_MODULE_VERSION 127`
  - Fix: Auto-detects ALL native modules and rebuilds on startup.
- **WordPress WP Button Black Screen**: Fixed `ERR_BLOCKED_BY_RESPONSE` error when clicking WP button.
  - Cause: WordPress sends `X-Frame-Options: SAMEORIGIN` which blocks iframes.
  - Fix: WordPress now opens in a separate Electron window instead of an iframe.
- **VS Code Button Overlapping X**: Fixed Code button that had overlapping close button and iframe issues.
  - Fix: VS Code now opens in a separate Electron window (1600x1000) matching WP behavior.

### 🔧 Technical Changes
- `scripts/launch_browser.cjs`: Complete rewrite of version check section (lines 63-160).
  - Added `.nvmrc` file reading for expected version.
  - Added `node_modules` existence check with auto-install.
  - Added native module loading test with auto-rebuild on failure.
  - Added critical dependency verification loop.
- `electron/main.cjs`: Added `open-wordpress-window` and `open-vscode-window` IPC handlers.
- `electron/preload.cjs`: Added `openWordPressWindow()` and `openVSCodeWindow()` API methods.
- `src/pages/WordPress/WordPressPage.tsx`: Rewritten to use new window instead of iframe.
- `src/pages/VSCode/VSCodePage.tsx`: Rewritten to use new window instead of iframe.

### 📝 Investigation Notes
- **Investigator**: Ranger (AIRanger) 🎖️
- **Root Cause**: Native modules compiled for Node 20 (v115) but system running Node 22 (v127).
- **Solution**: Try-catch block tests loading `pty.node`, triggers `npm rebuild` on `ERR_DLOPEN_FAILED`.

### 📋 VS Code State Persistence
**Status:** Moved to v4.3.5 (see above) - includes both VS Code AND WordPress persistence!

---

## [4.3.3] - 2026-01-11 - Code & WP Button Fix + Path Portability 🔧

### Summary
Fixed critical bug where Code button opened WordPress instead of VS Code. Separated the WP sidebar button (now opens localhost:8081 directly) from the WordPress Dashboard (now in Developer menu). Also improved codebase portability with relative paths.

### 🐛 Bug Fixes
- **Code Button Fixed**: The "Code" sidebar button now correctly opens code-server on port 8181 (was incorrectly pointing to 8081 where WordPress runs).
- **Dynamic Port Detection**: VSCodePage now gets the actual port from VSCodeManager via IPC, supporting any configured code-server port.

### 🔄 WP Button Redesign
- **WP Button → Direct Access**: Sidebar "WP" button now opens `localhost:8081` directly in an iframe (simple, fast access to WordPress).
- **WordPress Dashboard → Developer Menu**: The Docker/site management dashboard moved to `Developer → WordPress Dashboard` in the menu bar.
- **Cleaner UI**: Sidebar buttons now exclusively launch apps; management tools are in menus.

### 📦 Portability Improvements
- **Relative Path Display**: Server startup banner now shows `./data/rangerplex.db` instead of full absolute paths.
- **Generic Placeholders**: Updated UI placeholder text to use generic paths like `/path/to/project`.

### 🔧 Technical Changes
- `VSCodePage.tsx`: Now uses dynamic port from IPC (`{ running, port }`) with fallback to 8181.
- `electron/main.cjs`: IPC handler `vscode-status` now returns port info; added "WordPress Dashboard" to Developer menu.
- `electron/preload.cjs`: Added `open-wordpress-dashboard` to valid IPC channels.
- `App.tsx`: Added `WordPressPage` component for simple iframe view; `WordPressDashboard` now opens as modal from Developer menu.
- Created `src/pages/WordPress/WordPressPage.tsx`: New lightweight iframe component for localhost WordPress access.

### 📝 Known Issue (TODO)
- WordPress Dashboard auto-start disabled when opened from Developer menu (set `autoStart={false}` to prevent conflicts).

---

## [4.3.2] - 2025-12-30 - LM Studio Status Agent 🕵️‍♂️

### Summary
Added intelligent monitoring for local AI servers. RangerPlex now knows if LM Studio is running and can even start it for you!

### 🕵️‍♂️ Detection & Controls
- **Live Status Indicator**: New badge in Settings tracks if LM Studio is Online (🟢) or Offline (🔴).
- **Auto-Launch**: Added a "Start App" button that appears when LM Studio is offline.
- **Headless Support**: Correctly detects background processes even if the main window isn't visible.

---

## [4.3.1] - 2025-12-30 - Thinking Process Visualization 🧠

### Summary
**AI REASONING UPDATE**: Added visualization for the "Thinking Process" across all models (Ollama, LM Studio, etc.). Now you can see the AI's internal reasoning in real-time!

### 🧠 Thinking Process
- **Universal Support**: Works with standard `<thinking>` tags and DeepSeek's `<think>` tags.
- **Real-Time Streaming**: Watch the thought process evolve line-by-line as it's generated.
- **Enhanced System Prompts**: Instructed Ollama and LM Studio models to explicitly use thinking tags for complex reasoning.
- **Visual Design**: Collapsible, styled blocks that match your current theme (Matrix/Tron/Standard).

---
## [4.3.0] - 2025-12-11 - "Enter The Matrix" 🕶️

### Summary
**VISUAL & EASTER EGG UPDATE**: Introduces dynamic Visual Themes for message bubbles and a hidden set of Matrix-themed personalities! Plus, refined Voice Matching with complex preference lists.

### 🕶️ Visual Themes & Easter Eggs

#### New Features
- **Dynamic Bubble Themes**: Message bubbles now adapt to the personality's theme.
  - **Matrix Theme**: Green code rain aesthetic (used by The Hacker and Matrix crew).
  - **Tron Theme**: Cyan neon glow (used by Tony Stark).
- **Matrix Easter Egg**: 5 hidden personalities triggered by "Matrix" keywords:
  - **Neo**: "Stoic, focused, powerful" (Theme: Matrix)
  - **Morpheus**: "Wise, cryptic, believing" (Theme: Matrix)
  - **Trinity**: "Precise, lethal, loyal" (Theme: Matrix)
  - **The Oracle**: "Mystic Guide" (Theme: Matrix)
  - **Agent Smith**: "System Agent" (Theme: Matrix)
- **Enhanced Voice Matching**: Support for prioritized voice lists to ensure the best possible match on any OS (e.g. prioritizing "Daniel" for Colonel Ranger).

#### Technical Details
- **Theme Property**: Added `theme` to `AIPersonality` interface.
- **Bubble Rendering**: `MessageItem` now supports dynamic styling based on message metadata.
- **Robust Typing**: Updated `Message` interface to include full personality metadata.

## [4.2.0-dev] - 2025-12-11 - "The Many Faces of Ranger" 🎭

### Summary
**MAJOR UPDATE**: AI Personality System! RangerPlex now supports 40 diverse AI personalities, from "Colonel Ranger" to "Dr. Science", tailored for specific domains. Features include Smart Auto-Matching, visual badges, and integrated Voice Matching.

### 🎭 AI Personality System

#### Key Features
- **40 Unique Personalities**: Spanning Science, Creative, Strategy, Philosophy, and more.
- **Smart Auto-Match**: Automatically selects the best expert based on your question topic.
- **Modes**: Fixed, Auto-Match, Random, and Conversation Mode.
- **Visual Identity**: Unique Emojis and Badges for every personality.
- **Voice Matching**: Different personalities prefer different TTS voices (e.g. Colonel Ranger uses male voices).
- **System Prompt Injection**: Dynamically alters AI behavior to match the persona.

#### UI Components
- **Personality Selector**: Dedicated tab in Settings with category filters and live preview.
- **Message Badges**: Visual indicator of who is speaking (Emoji + Name + Confidence).
- **Settings Integration**: Fully integrated into the user preferences system.

#### Technical Details
- **Architecture**: Modular `personalityService` handles matching logic.
- **Data Structure**: Extensible `AIPersonality` interface with traits, expertise, and voice preferences.
- **Voice Integration**: Enhanced `voiceService` supports fallback preference lists.

## [4.2.2] - 2025-12-30 - LM Studio Polish ✨

### Summary
Refined LM Studio integration with better UI and new visual customization options.

### 🎨 Visual & UX
- **LM Studio Loading Effects**: Ported the cool loading effects (Neural, Terminal, Pulse) to LM Studio.
- **Cleanup**: Removed redundant "Refresh Models" button to reduce clutter.
- **Polish**: Improved alignment and consistency in the Settings modal.

---

## [4.2.1] - 2025-12-30 - Visual Polish 🎨

### Summary
Enhanced the "cool factor" of the Settings menu with new animations and improved button visibility requested by user.

### 💄 Visual Upgrades
- **Settings Modal**:
    - **Test Connections**: Added "Scanning..." animation with satellite dish icon and glow effects.
    - **LM Studio**: "Refresh Models" now triggers an epic "Portal Opening" animation (purple glow + scaling).
    - **Ollama**: Made the "Refresh List" button prominent (full width, green) so it's easy to find when adding new models.
- **Cleanup**: Refined button layouts for better usability.

---

## [4.2.0] - 2025-12-30 - Settings & Animatrix Upgrade

### Summary
Major overhaul of the Settings interface for **Ollama** and **LM Studio**, introducing "Animatrix" visual effects, automated model loading, and enhanced granular controls. Also includes UI fixes for dark mode.

### 🚀 New Features

#### Settings Interface
- **LM Studio Integration**: 
    - **Model Dropdown**: Automatically fetches and lists available models from LM Studio (`localhost:1234`).
    - **Advanced Params**: Added controls for **Context Length** and **Temperature**.
    - **Smart Inputs**: Input fields now support placeholder text and validation.
- **Ollama Integration**:
    - **Advanced Params**: Added controls for **Context Length (`num_ctx`)**, **Temperature**, and **Keep Alive**.
    - **Docker Support**: Improved host selection (localhost vs host.docker.internal).
- **"Animatrix" Effects**:
    - **Matrix Rain**: Refresh buttons now trigger a digital rain text scrambling animation.
    - **Visual Feedback**: Buttons pulse green (Ollama) or purple (LM Studio) during loading states.

### 🐛 Bug Fixes
- **Sidebar**: Fixed "New Thread" button visibility in dark mode (was white-on-white, now properly styled).
- **Backend**: Fixed `ollamaService` duplicate keys issue.
- **Backend**: Improved parameter passing to generic service handlers.

### 🔧 Technical
- **Type Definitions**: Updated `AppSettings` with new fields (`lmstudioContextLength`, `ollamaKeepAlive`, etc.).
- **Service Layer**: Refactored `ollamaService.ts` and `lmstudioService.ts` to accept and process optional configuration objects.
- **Chat Interface**: Updated `streamOllamaResponse` and `streamLMStudioResponse` calls to inject user preferences into API requests.

## [2.14.0] - 2025-12-10 - "Accessibility Commander" 🎖️

### Summary
**MAJOR UPDATE**: Multi-Agent Council with Gemini 3.0, Voice Input, and comprehensive Dyslexia Support! Complete accessibility stack for hands-free, dyslexia-friendly AI interaction.

### 🤖 Multi-Agent Council System

#### New Features
- **4-Agent Council**: Lead Researcher → Skeptic → Synthesizer → Judge
- **Gemini 3.0 Integration**: Latest AI models (Pro, Flash, Deep Think)
- **Google Search Grounding**: Real-time internet access for all agents
- **Automatic Citations**: Inline citations with clickable source cards
- **Study Mode**: Academic-focused agents with APA citations
- **References Section**: Compiled bibliography with BibTeX export

#### Standard Mode Agents
1. **Lead Researcher** (Gemini 3 Flash) - Information gathering
2. **The Skeptic** (Gemini 3 Flash) - Critical analysis
3. **The Synthesizer** (Gemini 3 Flash) - Insight combination
4. **The Judge** (Gemini 3 Pro) - Final summary & arbitration

#### Study Mode Agents
1. **Academic Researcher** (Gemini 3 Pro) - Literature review specialist
2. **Methodology Expert** (Gemini 3 Flash) - Research design analyst
3. **Critical Analyst** (Gemini 3 Flash) - Source quality evaluator
4. **Academic Supervisor** (Gemini 3 Pro) - Final review with APA citations

#### Citation Features
- **Perplexity-Style Source Cards**: Glassmorphism design with favicons
- **Multiple Formats**: APA, MLA, Chicago citations
- **BibTeX Export**: Download references for LaTeX/Zotero
- **Inline Citations**: Clickable [1], [2], [3] references
- **Source Verification**: Direct links to all sources
- **Deduplication**: Automatic removal of duplicate sources

### 🎤 Voice Input (Speech-to-Text)

#### New Features
- **Hands-Free Input**: Speak instead of typing
- **Microphone Selection**: Choose which mic to use
- **Audio Level Monitoring**: Real-time visualization
- **Continuous Listening**: Auto-restart on pause
- **Multi-Platform**: Mac, Windows, Linux support

#### Technical
- **Web Speech API**: Browser-native speech recognition
- **MediaDevices API**: Microphone access and enumeration
- **Web Audio API**: Audio level visualization
- **Auto-Transcription**: Words appear as you speak
- **Error Handling**: Graceful failures with user feedback

#### Browser Support
- ✅ Chrome/Edge: Full support (recommended)
- ✅ Safari: Full support
- ❌ Firefox: Limited (no Web Speech API)

### ♿ Dyslexia Support & Accessibility

#### New Accessibility Tab
- **Dedicated Settings**: Complete accessibility control panel
- **Live Preview**: See changes in real-time
- **Helpful Tips**: Integrated usage guidance

#### Font Options
- **OpenDyslexic**: Specially designed for dyslexia
- **Comic Sans**: Easy to read, friendly
- **Arial**: Clean and simple
- **Verdana**: Wide letter spacing

#### Spacing Controls
- **Font Size**: 14-24px (adjustable slider)
- **Line Spacing**: 1.5-2.5 (breathing room)
- **Letter Spacing**: 0-3px (reduce crowding)
- **Word Spacing**: 0-5px (clearer boundaries)

#### Color Schemes
- **Default**: Standard dark theme
- **High Contrast**: Black background, yellow text
- **Cream Paper**: Warm, paper-like background
- **Blue Tint**: Reduces eye strain

#### Reading Assistance
- **Highlight Links**: Make links more visible
- **Simplify Language**: AI-powered simplification
- **Text-to-Speech**: Read messages aloud
- **Reading Guide**: Highlight current line (planned)

#### Text-to-Speech Service
- **Web Speech API**: Browser-native TTS
- **Markdown Cleaning**: Removes code blocks, formatting
- **Sentence Chunking**: Better pacing for long text
- **Voice Selection**: Prefers natural English voices
- **Controls**: Play, pause, stop, resume
- **Adjustable**: Rate, pitch, volume settings

### 🎯 Complete Accessibility Stack

**The Trinity:**
```
1. VOICE INPUT → Speak your question
2. MULTI-AGENT COUNCIL → AI processes with Google Search
3. DYSLEXIA MODE → Read in accessible format + Listen via TTS
```

**Perfect For:**
- Students with dyslexia (10-15% of population)
- Vision impairment (large fonts, high contrast)
- Motor difficulties (hands-free voice input)
- Cognitive load (simplified language, TTS)
- Academic research (Study Mode with citations)

### 📁 New Files Created

#### Components
- `components/GroundingSourceCard.tsx` - Perplexity-style source cards
- `components/ReferencesSection.tsx` - Academic references display
- `components/VoiceInput.tsx` - Voice input with mic selection
- `components/VoiceInput.module.css` - Voice UI styles
- `components/DyslexiaModeControls.tsx` - Accessibility controls

#### Services
- `services/textToSpeechService.ts` - TTS with Web Speech API

### 🔧 Modified Files

#### Core Types (`types.ts`)
- Added `enableGrounding` to `AgentConfig`
- Added `citationStyle` to `AgentConfig`
- Added `GroundingSource` interface
- Added `STUDY_MODE_AGENTS` configuration
- Added `studyModeAgents` to `AppSettings`
- Added `councilMode` to `AppSettings`
- Added `dyslexiaSettings` to `AppSettings`
- Added Gemini 3.0 models to `availableModels`

#### Services
- `services/agentOrchestrator.ts` - Complete rewrite for grounding
  - Google Search integration
  - Source collection and citation tracking
  - Automatic references generation
  - APA/MLA/Chicago formatting

#### Components
- `components/SettingsModal.tsx`
  - Added Council Mode selector (Standard/Study)
  - Added Judge model selector
  - Added Accessibility tab
  - Integrated DyslexiaModeControls

- `components/MessageItem.tsx`
  - Integrated GroundingSourcesGrid
  - Display clickable source cards

- `components/InputArea.tsx`
  - Integrated VoiceInput component
  - Removed old voice button

### 🎨 UI/UX Improvements

#### Source Cards
- Glassmorphism design with backdrop blur
- Favicon display (Google Favicon API)
- Title with citation number badge
- Domain extraction and display
- Snippet preview (3-line clamp)
- Hover effects (lift + teal glow)
- Click to open in new tab
- Responsive grid (1-3 columns)

#### References Section
- Collapsible design with expand/collapse
- APA/MLA/Chicago citation formatting
- Copy all references button
- Export to BibTeX (.bib file)
- Numbered citation list
- Quick links to open sources
- Beautiful academic styling

#### Voice Input
- Circular microphone button
- Pulse animation when listening
- Audio level ring visualization
- Microphone selector dropdown
- Settings gear icon
- Listening indicator with pulse dot

#### Accessibility Controls
- Purple theme for accessibility
- Toggle switches for features
- Range sliders for spacing
- Color scheme previews
- Live text preview panel
- Helpful tips section

### 🎖️ Development Notes

**Development Time**: ~4 hours  
**Lines of Code**: ~3,500 new/modified  
**Components Created**: 6  
**Services Created**: 1  
**Documentation Files**: 6  

**Key Technologies:**
- Google Gemini 3.0 API
- Web Speech API (Recognition + Synthesis)
- MediaDevices API
- Web Audio API
- React + TypeScript
- CSS Modules

### 🚀 Impact

#### Accessibility
- Makes RangerPlex usable for 10-15% of population with dyslexia
- Supports users with vision, motor, and cognitive needs
- Demonstrates commitment to inclusive design
- Aligns with RangerOS mission: "Transform disabilities into superpowers"

#### Academic
- Professional citation support for college assignments
- Literature review assistance
- Source verification with Google Search
- APA/MLA/Chicago formatting
- Perfect for research papers

#### Productivity
- Hands-free operation with voice input
- Faster research with Multi-Agent Council
- Better comprehension with TTS
- Reduced typing fatigue

### 📊 Statistics

- **Browser APIs Used**: 4 (Speech Recognition, Speech Synthesis, MediaDevices, Web Audio)
- **AI Models Integrated**: 7 (Gemini 3.0 Pro, Flash, Deep Think, + others)
- **Citation Formats**: 3 (APA, MLA, Chicago)
- **Font Options**: 4 (OpenDyslexic, Comic Sans, Arial, Verdana)
- **Color Schemes**: 4 (Default, High Contrast, Cream, Blue Tint)
- **Accessibility Features**: 10+ (fonts, spacing, TTS, voice input, etc.)

### 🎯 Usage Examples

#### For Students
```
1. Enable Study Mode (Settings > Council)
2. Enable Dyslexia Mode (Settings > Accessibility)
3. Use Voice Input: "What are the latest malware analysis techniques?"
4. Get: 4 agents research with Google Search
5. Read: Response in dyslexia-friendly format
6. Listen: AI reads answer aloud
7. Copy: APA references directly to your paper
```

#### For Researchers
```
1. Select Multi-Agent model
2. Ask: "Compare different approaches to X"
3. Get: Multiple perspectives from 4 agents
4. See: Clickable source cards with citations
5. Export: BibTeX for reference manager
```

#### For Accessibility
```
1. Enable Voice Input (mic button)
2. Enable Dyslexia Mode (Settings > Accessibility)
3. Customize: Font, spacing, colors
4. Enable: Text-to-Speech
5. Use: Completely hands-free, accessible AI
```

### 🔮 Future Enhancements

**Planned Features:**
- Conversational follow-up (ask follow-up questions to council)
- Export to Word/PDF with citations
- Study notes generator (flashcards, summaries)
- Citation verification
- Reading guide (highlight current line)
- Offline voice recognition
- Multi-language support
- Voice commands ("/search", "/web", etc.)

### 🎖️ Credits

**Development**: Major Gemini Ranger (Deputy AI Operations Commander)  
**Commander**: David Keane (IrishRanger)  
**Date**: December 10, 2025  
**Code Name**: "Accessibility Commander"  

**Rangers lead the way!** 🎖️

---

## [4.1.7] - 2025-12-08 - Browser Launch Improvements

### Summary
Fixed `npm run browser` command behavior, critical race condition, and added comprehensive help system!

### Critical Bug Fix
- **Fixed**: Servers getting killed immediately after starting (SIGKILL crash)
- **Root cause**: Race condition in `npm run start` - used `&` (background) instead of `;` (sequential)
- **What happened**: `npm run stop` was killing servers WHILE they were starting
- **Solution**: Changed `npm run stop 2>nul &` to `npm run stop 2>/dev/null ;` so stop completes FIRST

### Bug Fix
- **Fixed**: `npm run browser` now opens **Electron app** instead of Chrome tab
- **Root cause**: Was using `open-browser.cjs` which always opened browser tabs
- **Solution**: Now uses `launch_browser.cjs` which properly handles launch modes

### New Features
- **Help System**: `npm run browser -- --help` shows full usage guide with ASCII banner
- **Long-form flags**: Added `--tab` and `--both` as aliases for `-t` and `-b`
- **New script**: `browser:tab` for explicit tab-only mode

### Updated Commands
| Command | Action |
|---------|--------|
| `npm run browser` | Launch Electron app (default) |
| `npm run browser:tab` | Launch in browser tab only |
| `npm run browser:both` | Launch both Electron + browser tab |
| `npm run browser -- --help` | Show help with ASCII banner |
| `npm run browser -- --skip-docker` | Skip Docker Desktop check |

### Files Changed
- `package.json` - Fixed race condition in `start` script, updated browser scripts
- `scripts/launch_browser.cjs` - Added help system, long-form flags (--tab, --both)

---

## [RangerChat Lite 2.0.1] - 2025-12-03 - Clean Login

### Changes
- Removed identity badge from login screen
- Removed settings button from login screen
- Removed "Click 🎲 for a fun random name!" hint
- Cleaner, more minimal login experience
- Settings accessible from chat header after login

---

## [RangerBlock Security Library 1.0.0] - 2025-12-03 - Shepherd Protocol

### Summary
New unified security system for all RangerBlock apps! Codename: **Shepherd Protocol**

### New Security Modules (`rangerblock/lib/`)
- **hardware-id.cjs**: Cross-platform hardware fingerprinting (macOS/Windows/Linux)
- **crypto-utils.cjs**: RSA-2048 key generation + AES-256-GCM encryption
- **storage-utils.cjs**: Shared storage system (`~/.rangerblock/`)
- **identity-service.cjs**: Unified identity management for all apps

### Features
- Hardware-bound identity (unique per device, can't be copied)
- RSA-2048 key pairs for message signing and encryption
- Challenge-response authentication framework
- Cross-app identity sharing (RangerChat Lite ↔ RangerPlex sync)
- On-chain identity registration support
- Secure file permissions (600 for private keys)
- Audit logging framework

### Shared Storage Structure
```
~/.rangerblock/
├── identity/       # Master identity + hardware fingerprint
├── keys/           # RSA-2048 keypairs
├── apps/           # Per-app settings (chat-lite, rangerplex, just-chat)
├── sync/           # Cross-app sync state
├── security/       # Audit logs
└── sessions/       # Session tokens
```

### Technical Details
- SHA-256 hardware fingerprinting from Hardware UUID + hostname + username
- AES-256-GCM for data encryption at rest
- JWT-like session tokens with RSA signatures
- PBKDF2 key derivation for password-protected keys (100,000 iterations)

---

## [Voice Chat 3.0.0] - 2025-12-03 - Shared Identity

### Summary
Voice chat now uses shared `~/.rangerblock/` identity system!

### New Features
- **Shared Identity**: Uses unified identity from `~/.rangerblock/`
- **Hardware-Bound**: Persistent userId across sessions
- **Identity Command**: `/identity` shows your info
- **Moderation Ready**: userId sent with registration

### Commands
```
/identity  - Show your hardware-bound identity
/id        - Alias for /identity
```

---

## [Blockchain Chat 4.0.0] - 2025-12-03 - Shared Identity

### Summary
Terminal chat client now uses shared `~/.rangerblock/` identity system!

### New Features
- **Shared Identity**: Uses unified identity from `~/.rangerblock/`
- **Hardware-Bound**: Persistent userId across sessions
- **Message Signing**: RSA-2048 signatures on all messages
- **Identity Command**: `/identity` shows your info
- **Moderation Ready**: userId sent with messages for admin tracking

### Commands
```
/identity  - Show your hardware-bound identity
/id        - Alias for /identity
/help      - Updated with new commands
```

### Technical
- Imports `justChatIdentity` from shared library
- Auto-creates identity on first run
- Syncs with RangerChat Lite and RangerPlex
- Stats tracking (messages sent, session count)

---

## [RangerChat Lite 2.0.0] - 2025-12-03 - Shared Identity

### Summary
RangerChat Lite now uses shared `~/.rangerblock/` identity system with cross-app sync!

### New Features
- **Shared Storage**: Identity stored in `~/.rangerblock/` (shared with all RangerBlock apps)
- **Hardware-Bound**: Persistent userId tied to device fingerprint
- **Cross-App Sync**: Identity syncs with blockchain-chat, voice-chat, and RangerPlex
- **Migration**: Auto-migrates from legacy Electron userData storage
- **RSA Keys**: Public/private key pairs for message signing

### Technical
- Primary storage: `~/.rangerblock/identity/master_identity.json`
- Legacy fallback: Electron userData for backward compatibility
- Auto-migration on first run if legacy identity exists
- New methods: `isRangerPlexInstalled()`, `getPublicKey()`, `signMessage()`

---

## [RangerChat Lite 1.3.1] - 2025-12-03 - Update Notifications

### Summary
App now checks GitHub for updates and shows a banner when new versions are available!

### New Features
- **Update Checker**: Checks GitHub for new versions on startup
- **Update Banner**: Animated orange banner when update is available
- **Settings Integration**: Update instructions shown in Settings > About
- **Theme-Aware**: Banner colors match your selected theme

### How It Works
When a newer version is found on GitHub:
1. An animated banner appears at the top: "🚀 Update Available! v1.x.x is ready"
2. Shows commands: `git pull` then `npm run dev`
3. Can be dismissed with ✕ button
4. Re-checks every 30 minutes

---

## [RangerChat Lite 1.3.0] - 2025-12-03 - Easy Distribution

### Summary
Complete distribution system for sharing RangerChat Lite with friends!

### New Features
- **Cross-Platform Builds**: Windows (.exe), macOS (.dmg), Linux (.AppImage, .deb)
- **GitHub Actions**: Auto-build and release on version tags
- **Install Scripts**: One-liner installers for PowerShell and Bash
- **GitHub Releases**: Pre-built binaries for easy download

### Quick Install
```powershell
# Windows
irm https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/apps/ranger-chat-lite/scripts/install.ps1 | iex

# macOS/Linux
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/apps/ranger-chat-lite/scripts/install.sh | bash
```

### Version History
| Version | Highlights |
|---------|------------|
| 1.3.1 | Update notifications - checks GitHub for new versions |
| 1.3.0 | Easy distribution - GitHub releases, install scripts |
| 1.2.1 | Live blockchain transaction viewer |
| 1.2.0 | Device-bound identity, random names, settings |
| 1.1.3 | Fixed messaging - send/receive works |
| 1.1.0 | Emoji picker, search, 4 themes |
| 1.0.0 | Initial working release |

---

## [RangerChat Lite 1.4.x] - 2025-12-03 - ROLLED BACK

**Status**: These versions were rolled back due to unresponsive UI after login.
See `apps/ranger-chat-lite/_BACKUP_v1.4.3_BROKEN/ROLLBACK_REPORT.md` for details.

Features attempted (to be reimplemented incrementally):
- Private/Direct messaging
- Message reactions
- Typing indicators
- File sharing
- User avatars

---

## [4.1.8] - 2025-12-02 - RangerChat Lite Connection Fix

See previous changelog entries for full RangerPlex history.

---

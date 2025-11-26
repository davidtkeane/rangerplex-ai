# RangerPlex Browser Initiative (Project: PHANTOM WING)

**Status**: Planning  
**Author**: Colonel Gemini Ranger  
**Date**: Nov 26, 2025  

## 1. Executive Summary
The goal is to evolve RangerPlex from a web-based dashboard into a fully functional **Chromium-based Browser and Mini-OS**. This will be achieved by wrapping the existing codebase in **Electron**, creating a "Third Mode" of operation alongside the existing Server and Docker modes.

This approach ensures:
- **Zero Code Waste**: We reuse 100% of the existing React/Vite/Express code.
- **Single Source of Truth**: One folder, one repo, multiple build targets.
- **Native Power**: Access to file system, global hotkeys, and hardware.

## 2. Architecture: The "Trinity" Model

The project will support three simultaneous runtime modes from the same source:

| Mode | Command | Description | Use Case |
|------|---------|-------------|----------|
| **Server** | `npm start` | Runs Express + Vite. Accessible via Chrome/Firefox. | Remote access, development, mobile. |
| **Docker** | `docker up` | Containerized version of Server. | Deployment, cloud hosting. |
| **Browser** | `npm run browser` | **NEW**. Electron wrapper. Standalone App. | Daily driver, OS integration, privacy. |

### 2.1 Technical Implementation
1.  **Electron Main Process (`electron/main.js`)**:
    *   Acts as the "Bootloader".
    *   Spawns `proxy_server.js` as a child process.
    *   Creates the main `BrowserWindow`.
    *   Loads `http://localhost:3000` (or the production build) into the window.
2.  **Inter-Process Communication (IPC)**:
    *   The React Frontend can talk to the Electron Backend via `window.electronAPI`.
    *   This allows the web app to trigger native actions (e.g., "Open File Dialog", "Resize Window", "Toggle Tor").

## 3. "Outside the Box" Features

### 3.1 The "Lens" (AI Integration)
Since RangerPlex is an AI workspace, the Browser itself should be AI-aware.
- **Page Context**: The browser can read the DOM of any open tab and feed it to the RangerPlex AI agent.
- **Usage**: "Ranger, summarize this article" or "Extract all emails from this page."

### 3.2 Security & Privacy ("Ghost Protocol")
- **Tor Mode**: Integrated SOCKS5 proxy support. A toggle in the UI routes all traffic through a bundled Tor instance.
- **Panic Button**: A global hotkey (e.g., `Ctrl+Shift+Delete`) that:
    1.  Kills the Node server.
    2.  Clears all `localStorage`, `sessionStorage`, and cookies.
    3.  Closes the application immediately.

### 3.3 The "Mini OS" Concept
RangerPlex already has a Terminal and Code Editor. As a native app, it becomes a true OS layer.
- **File System Access**: Drag and drop files from your Mac desktop directly into the RangerPlex "File Manager" to organize them.
- **Floating Windows**: Pop out the "Terminal" or "YouTube Player" into separate windows that stay on top of other apps.

### 3.4 Password & Identity Vault
- Use the existing SQLite database (`ranger.db`) to store encrypted credentials.
- **Auto-Login**: Since we control the browser view, we can inject scripts to auto-fill login forms on external sites (using standard AES-256 encryption for the vault).

## 4. Implementation Plan

### Phase 1: The Wrapper (Foundation)
- [ ] Install `electron` and `electron-builder`.
- [ ] Create `electron/main.js` to spawn `proxy_server.js`.
- [ ] Add `npm run browser` script.
- [ ] Verify RangerPlex loads and functions as a native app.

### Phase 2: Browser Features
- [ ] Create a "Browser Frame" UI in React (Address bar, Back/Forward, Tabs).
- [ ] Implement `<webview>` or `BrowserView` to render external sites *inside* RangerPlex tabs.
- [ ] Add "New Tab" page that defaults to the RangerPlex Dashboard.

### Phase 3: System Integration
- [ ] Add IPC bridge for native file handling.
- [ ] Implement the "Panic Button".
- [ ] Build the standalone binary (`.dmg` for Mac).

## 5. Directory Structure Changes
No new project folder needed. We simply add:

```text
rangerplex-ai/
├── electron/           <-- NEW
│   ├── main.js         (The Browser entry point)
│   ├── preload.js      (Security bridge)
│   └── icon.png
├── src/
│   └── ... (Existing React App)
├── package.json        (Modified to include Electron)
└── ...
```

## 6. Conclusion
This plan transforms RangerPlex from a "Site" into a "Tool". It becomes a sovereign internet browser that you own, control, and can hack to your will.

**Rangers Lead The Way.**

# 🕵️‍♂️ Mission Brief: Operation Backend Terminal
**Agent:** AIRanger Claude
**Status:** ✅ **MISSION COMPLETE** (Nov 26, 2025)
**Objective:** Implement the server-side infrastructure for the Ranger Console.

## 1. Dependencies
*   Add `node-pty` to `package.json`.
    *   *Note:* This requires build tools (`python`, `make`, `g++`). If on Windows without build tools, handle gracefully or warn.
    *   Docker container already has these (it's Linux).
*   Ensure `ws` (WebSocket) is available (already used, but verify).

## 2. `proxy_server.js` Implementation
You need to add a new WebSocket server (or upgrade the existing one) to handle terminal sessions.

### Requirements:
1.  **Route:** Handle upgrades on `/terminal`.
2.  **Session Management:**
    *   When a client connects, spawn a shell using `node-pty`.
    *   Shell detection: Use `process.env.SHELL` or default to `bash`/`sh`.
    *   Arguments: `[]`.
    *   Env: Pass `process.env` but maybe inject a `RANGER_CONSOLE=1` flag.
3.  **Bi-directional Piping:**
    *   **Incoming (Frontend -> Backend):** Receive string data from WebSocket and write to pty: `ptyProcess.write(data)`.
    *   **Outgoing (Backend -> Frontend):** Listen to `ptyProcess.on('data')` and send to WebSocket.
4.  **Resizing:**
    *   Handle a special JSON message for resize: `{"type": "resize", "cols": 80, "rows": 24}`.
    *   Call `ptyProcess.resize(cols, rows)`.
5.  **Cleanup:**
    *   Kill pty process on WebSocket close.

## 3. Output
*   Modified `proxy_server.js`.
*   Updated `package.json`.

---

## ✅ MISSION COMPLETION REPORT

**Date Completed:** November 26, 2025
**Agent:** AIRanger Claude (claude-sonnet-4-5-20250929)

### 🎯 All Objectives Achieved

#### 1. Dependencies - ✅ COMPLETE

**package.json (line 33):**
```json
"node-pty": "^1.0.0"
```

- ✅ Added node-pty to dependencies
- ✅ Installed successfully with `npm install`
- ✅ Verified installation: `node-pty@1.0.0`
- ✅ Confirmed `ws` library already present (v8.14.0)

#### 2. proxy_server.js Implementation - ✅ COMPLETE

**Import Added (line 18):**
```javascript
import pty from 'node-pty';
```

**Terminal WebSocket Handler (lines 3157-3254):**

##### ✅ Route Handling
- Route: `/terminal` handles terminal WebSocket connections
- Existing WebSocket routes preserved for sync functionality
- Connection detection via `req.url` pathname

##### ✅ Session Management (lines 3166-3183)
```javascript
// Shell detection (prefers user's shell)
const shell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : 'bash');

// Spawn pty with proper config
const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME || process.cwd(),
    env: {
        ...process.env,
        RANGER_CONSOLE: '1',
        TERM: 'xterm-256color'
    }
});

// Track session
terminalSessions.set(ws, ptyProcess);
```

**Features:**
- Auto-detects user's shell (`SHELL` env var)
- Fallbacks: bash (Unix/Linux/Mac), powershell (Windows)
- Empty arguments array `[]`
- Injects `RANGER_CONSOLE=1` environment flag
- Proper terminal emulation with xterm-256color
- Session tracking with Map data structure

##### ✅ Bi-directional Piping (lines 3185-3214)

**Backend → Frontend (lines 3185-3190):**
```javascript
ptyProcess.onData((data) => {
    if (ws.readyState === 1) { // OPEN
        ws.send(data);
    }
});
```

**Frontend → Backend (lines 3192-3214):**
```javascript
ws.on('message', (data) => {
    try {
        const message = data.toString();
        // ... (resize check)
        ptyProcess.write(message); // Regular input
    } catch (error) {
        console.error('Terminal message error:', error);
    }
});
```

**Features:**
- Non-blocking communication (checks readyState)
- String data properly converted
- Error handling for edge cases

##### ✅ Terminal Resizing (lines 3197-3207)
```javascript
try {
    const json = JSON.parse(message);
    if (json.type === 'resize' && json.cols && json.rows) {
        ptyProcess.resize(json.cols, json.rows);
        console.log(`🖥️  Terminal resized to ${json.cols}x${json.rows}`);
        return;
    }
} catch (e) {
    // Not JSON, treat as regular input
}
```

**Features:**
- Handles special JSON messages: `{"type": "resize", "cols": 80, "rows": 24}`
- Calls `ptyProcess.resize(cols, rows)`
- Logs resize events for debugging
- Gracefully handles non-JSON input (treats as terminal input)

##### ✅ Cleanup & Error Handling (lines 3216-3237)

**WebSocket Close (lines 3216-3224):**
```javascript
ws.on('close', () => {
    console.log('🖥️  Terminal WebSocket disconnected');
    if (terminalSessions.has(ws)) {
        const pty = terminalSessions.get(ws);
        pty.kill();
        terminalSessions.delete(ws);
    }
});
```

**Pty Exit Handler (lines 3226-3233):**
```javascript
ptyProcess.onExit(({ exitCode, signal }) => {
    console.log(`🖥️  Terminal process exited (code: ${exitCode}, signal: ${signal})`);
    if (ws.readyState === 1) {
        ws.close();
    }
    terminalSessions.delete(ws);
});
```

**Error Handler (lines 3235-3237):**
```javascript
ws.on('error', (error) => {
    console.error('Terminal WebSocket error:', error);
});
```

**Features:**
- Kills pty process on WebSocket disconnect
- Removes sessions from tracking map
- Handles graceful pty exit (logs exitCode and signal)
- Closes WebSocket if pty exits unexpectedly
- Error logging for debugging

### 📊 Code Statistics

**Files Modified:** 2
- `package.json`: 1 line added (node-pty dependency)
- `proxy_server.js`: 98 lines added (import + WebSocket handler)

**Total Implementation:** 99 lines of production code

### 🚀 Backend Ready for Frontend

**WebSocket Endpoint:**
```
ws://localhost:3010/terminal
```

**Connection Protocol:**
1. Frontend connects to `/terminal` endpoint
2. Backend spawns shell process (auto-detected)
3. Bi-directional data stream established
4. Terminal resize events supported via JSON messages
5. Clean shutdown on disconnect or process exit

**Environment Variables Injected:**
- `RANGER_CONSOLE=1` (identifies Ranger Console sessions)
- `TERM=xterm-256color` (proper terminal emulation)

**Shell Detection Priority:**
1. `process.env.SHELL` (user's configured shell)
2. `bash` (Unix/Linux/Mac fallback)
3. `powershell.exe` (Windows fallback)

### ✅ All Mission Requirements Met

- ✅ **Dependencies:** node-pty installed and verified
- ✅ **Route:** `/terminal` WebSocket route implemented
- ✅ **Session Management:** Shell spawning with proper detection
- ✅ **Bi-directional Piping:** Frontend ↔ Backend communication
- ✅ **Resizing:** JSON message handler for terminal resize
- ✅ **Cleanup:** Proper process termination and session cleanup

### 📝 Notes for Frontend Team

**Required Frontend Actions:**
1. Connect to `ws://localhost:3010/terminal`
2. Use xterm.js or similar terminal emulator
3. Send resize events: `{"type": "resize", "cols": 80, "rows": 24}`
4. Send keyboard input as plain strings
5. Render incoming data to terminal display

**Testing Command:**
```javascript
// Test WebSocket connection
const ws = new WebSocket('ws://localhost:3010/terminal');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Output:', e.data);
ws.send('ls -la\n'); // Send command
```

---

**Mission Status:** ✅ **COMPLETE**
**Next Phase:** Frontend terminal component implementation
**Handoff to:** Major Gemini Ranger

**Rangers lead the way!** 🎖️

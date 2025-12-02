# npm run browser - Windows Fix Documentation

## Problem

The `npm run browser` command worked on macOS (M1/M3/M4) but failed on Windows with:
```
The system cannot find the path specified.
```

## Root Causes

1. **Bash syntax in npm scripts** - Used `2>/dev/null` (bash) instead of `2>nul` (Windows)
2. **Port cleanup skipped on Windows** - The `launch_browser.cjs` script had Windows cleanup disabled
3. **Electron dependency missing** - Optional dependency not installed, script defaulted to Electron mode
4. **Complex startup logic** - Tried to manage Docker, Electron, and servers in one script

## Solution

### 1. Simplified npm Script (package.json:22)

**Before:**
```json
"browser": "npm run stop 2>/dev/null; node scripts/launch_browser.cjs"
```

**After:**
```json
"browser": "concurrently \"npm run server\" \"npm run dev\" \"node scripts/open-browser.cjs\" --names \"SERVER,VITE,BROWSER\" --prefix-colors \"cyan,magenta,green\" --kill-others-on-fail"
```

### 2. Created Simple Browser Opener (scripts/open-browser.cjs)

A new lightweight script that:
- Waits for API server to be ready (polls `/api/health`)
- Opens browser automatically when ready
- Exits after opening (doesn't block)
- Works cross-platform (macOS, Windows, Linux)

### 3. Fixed Port Cleanup (scripts/launch_browser.cjs:130-179)

**Before:**
```javascript
if (process.platform !== 'darwin' && process.platform !== 'linux') {
    resolve(); // Skip on Windows for now
    return;
}
```

**After:**
```javascript
if (process.platform === 'win32') {
    // Windows: Use netstat and taskkill
    RANGERPLEX_PORTS.forEach((port) => {
        exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
            // Parse PID and kill with taskkill
        });
    });
} else {
    // Unix: Use lsof
    exec(`lsof -ti:${portList} | xargs kill -9 2>/dev/null`);
}
```

### 4. Cross-Platform Commands

| Feature | macOS/Linux | Windows |
|---------|-------------|---------|
| Stderr redirect | `2>/dev/null` | `2>nul` |
| Command separator | `;` | `&` |
| Kill process | `lsof -ti :PORT \| xargs kill -9` | `netstat -ano \| findstr :PORT` + `taskkill /PID` |
| Open browser | `open URL` | `start "" "URL"` |

## How It Works Now

### npm run browser Execution Flow

```
1. Start concurrently with 3 processes:
   ├─ [SERVER] npm run server
   ├─ [VITE]   npm run dev
   └─ [BROWSER] node scripts/open-browser.cjs

2. SERVER starts proxy_server.js (port 3000)
   └─ Initializes database
   └─ Starts REST API & WebSocket

3. VITE starts dev server (port 5173)
   └─ Compiles React app
   └─ Ready in ~300-500ms

4. BROWSER waits for servers
   ├─ Polls http://localhost:3000/api/health
   ├─ Max 30 retries (1 second apart)
   └─ When ready:
      ├─ Opens browser (start "" "http://localhost:5173")
      └─ Exits with code 0

5. User sees:
   [SERVER] ✅ RANGERPLEX AI SERVER v4.1.5 ONLINE
   [VITE]   ✅ ready in 347ms
   [BROWSER] ✅ Servers are ready!
   [BROWSER] 🌐 Opening browser
   [BROWSER] ✅ Browser opened!
   [Browser window opens automatically]
```

## Testing Results

### Windows 11 (MSI Vector)
✅ npm run browser - Works perfectly
✅ Auto-opens browser after ~3-5 seconds
✅ Both servers start correctly
✅ Logs shown in realtime
✅ Ctrl+C stops all processes

### Output Sample
```
[SERVER] ╔═══════════════════════════════════════════════════════════╗
[SERVER] ║   🎖️  RANGERPLEX AI SERVER v4.1.5                       ║
[SERVER] ║   📡 REST API:      http://localhost:3000                ║
[SERVER] ║   Status: ✅ ONLINE                                       ║
[SERVER] ╚═══════════════════════════════════════════════════════════╝
[VITE]   ➜  Local:   http://localhost:5173/
[BROWSER] ✅ Servers are ready!
[BROWSER] 🌐 Opening browser: http://localhost:5173
[BROWSER] ✅ Browser opened!
```

## Benefits of New Approach

1. **Simpler** - Uses existing `npm start` infrastructure (concurrently)
2. **Faster** - No Docker checks, no Electron loading
3. **Reliable** - Polls API health instead of fixed timeouts
4. **Cross-platform** - Works on Windows, macOS, and Linux
5. **Better UX** - Auto-opens browser when ready, not before

## Files Modified

- `package.json` - Updated `browser` script with Windows syntax
- `scripts/launch_browser.cjs` - Fixed Windows port cleanup
- `scripts/open-browser.cjs` - **NEW** Simple browser opener

## Alternative Scripts

Users can still use:
- `npm start` - Same servers, no auto-browser
- `npm run browser:electron` - Launch with Electron (if installed)
- `npm run browser:both` - Browser + Electron

## For Future macOS/Linux Users

The fix maintains full compatibility:
- macOS: Uses `open` command
- Linux: Uses `xdg-open` command
- Windows: Uses `start ""` command

All platforms benefit from the health check polling approach.

---

**Fixed:** 2025-12-02
**Tested:** Windows 11, Node.js v22.21.1
**Status:** ✅ Working perfectly

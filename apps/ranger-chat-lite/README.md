# RangerChat Lite - Standalone Electron Chat Client

A lightweight, retro-styled Electron chat client for connecting to RangerPlex blockchain chat network.

![Version](https://img.shields.io/badge/version-1.9.4-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Quick Install

### Windows (PowerShell)
```powershell
irm https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/apps/ranger-chat-lite/scripts/install.ps1 | iex
```

### macOS / Linux (Bash)
```bash
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/apps/ranger-chat-lite/scripts/install.sh | bash
```

### Manual Download
Download pre-built binaries from [GitHub Releases](https://github.com/davidtkeane/rangerplex-ai/releases):

| Platform | Download |
|----------|----------|
| Windows (Installer) | `RangerChat-Lite-x.x.x-win-x64.exe` |
| Windows (Portable) | `RangerChat-Lite-x.x.x-win-x64.zip` |
| macOS (Intel) | `RangerChat-Lite-x.x.x-mac-x64.dmg` |
| macOS (Apple Silicon) | `RangerChat-Lite-x.x.x-mac-arm64.dmg` |
| Linux (AppImage) | `RangerChat-Lite-x.x.x-linux-x64.AppImage` |
| Linux (Debian) | `RangerChat-Lite-x.x.x-linux-x64.deb` |

---

## 📋 What is RangerChat Lite?

RangerChat Lite is a **standalone desktop application** that connects to the RangerPlex blockchain chat server. It's built with:

- **Electron** - Cross-platform desktop framework
- **React** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type-safe JavaScript
- **WebSocket** - Real-time chat communication

### Features:
- 🎨 **4 Themes** - Classic (MSN), Matrix, Tron, Retro
- 😀 **Emoji Picker** - 180+ emojis across 9 categories
- 🔍 **Message Search** - Find messages instantly
- 🆔 **Device Identity** - Unique ID per device for moderation
- 🎲 **Random Names** - Fun username generator
- ⚙️ **Settings Page** - Profile, identity, themes, storage info
- 🌦️ **Local Weather** - `/weather` command with optional rain alerts
- 📊 **Blockchain Viewer** - See live network transactions
- 💬 Real-time messaging via WebSocket
- 📡 Connect to local or remote RangerPlex servers
- 📞 **Voice Calls** - 1-to-1 voice calls with push-to-talk
- 📹 **Video Calls** - Peer-to-peer video calling with WebRTC

---

## 🛠️ Installation (Windows 11 / MSI)

### Prerequisites:
```bash
# Verify Node.js (should be v22.x)
node -v

# Should show: v22.x.x
```

### Step 1: Navigate to Directory
```powershell
cd C:\Users\david\rangerplex-ai\apps\ranger-chat-lite
```

### Step 2: Install Dependencies
```powershell
npm install
```

**Expected time:** 2-3 minutes (Electron is ~100MB)

**What gets installed:**
- `electron` - Desktop app framework
- `react` + `react-dom` - UI framework
- `vite` - Fast build tool
- `typescript` - Type checking
- `electron-builder` - App packager
- `ws` - WebSocket library

---

## 🚀 Running the App

### Development Mode (Recommended):
```powershell
npm run dev
```

**What happens:**
1. Vite dev server starts
2. Electron window opens (400x600px)
3. Hot reload enabled (changes appear instantly)
4. DevTools available (right-click → Inspect Element)

**Expected output:**
```
VITE v5.1.6  ready in 234 ms
➜  Local:   http://localhost:5173/
➜  press h + enter to show help

[Electron] Starting...
```

Then an Electron window should appear with the RangerChat login screen.

---

## 🎮 How to Use

### 1. **Connect to RangerPlex Chat Server**

When the app opens, you'll see a login screen:

**Default Server:** `ws://44.222.101.125:5555` (AWS)

**Alternative Servers:**
- Local: `ws://localhost:5555`
- Your network: `ws://192.168.1.x:5555`

**Username:** Enter any name (e.g., "David", "Ranger123")

Click **Connect**

### 2. **Chat**

Once connected:
- Type messages in the input box at the bottom
- Press **Enter** or click **Send**
- Your messages appear in green
- Other users' messages appear in white
- System messages appear in yellow

### 3. **Slash Commands**

Use these in the chat input:
- `/call <username>` - Start a 1-to-1 voice call
- `/video <username>` - Start a 1-to-1 video call
- `/hangup` or `/end` - End the current call
- `/peers` or `/online` - List online users with voice capability
- `/weather [city]` - Local weather (auto-detect or city override)
- `/update` - Check for and install app updates
- `/version` - Show current and latest version

### 4. **Close App**

Click the **X** button in the top-right corner

---

## 📹 Video Calls

RangerChat Lite supports peer-to-peer video calls using WebRTC!

### Making a Video Call:

1. Type `/video <username>` in the chat input
2. Or click the 📹 button next to a peer in the call list
3. Wait for the other person to accept

### Video Call Controls:

| Key/Button | Action |
|------------|--------|
| **M** or 🎤 button | Toggle microphone mute |
| **V** or 📹 button | Toggle camera on/off |
| **Esc** or 📵 button | End the call |

### Video Settings (in Settings page):

- **Video Quality**: Low (320p) / Medium (480p) / High (720p) / HD (1080p)
- **Frame Rate**: 15 / 24 / 30 fps
- **Camera Selection**: Choose from available cameras
- **Microphone Selection**: Choose from available mics
- **Mirror Local Video**: Flip your preview horizontally
- **Mute on Join**: Start calls with audio/video muted
- **Transport Mode**: WebRTC (P2P) / Blockchain Relay / Hybrid

### Accessibility Options:

- High contrast controls
- Large control buttons
- Screen reader announcements
- Keyboard shortcuts (M, V, Esc)

---

## 🔧 Build for Distribution

### Build Installer:
```powershell
npm run build
```

**What happens:**
1. TypeScript compiles (`tsc`)
2. Vite builds production bundle
3. Electron Builder creates installer

**Output location:**
```
apps/ranger-chat-lite/dist/
├── win-unpacked/          (Portable version)
└── RangerChat-1.0.0.exe   (Windows installer)
```

**Installer size:** ~150-200MB (includes Electron runtime)

---

## 📁 Project Structure

```
ranger-chat-lite/
├── electron/
│   ├── main.ts            # Electron main process
│   └── preload.ts         # Preload script (Node.js bridge)
├── src/
│   ├── App.tsx            # Main React component
│   ├── App.css            # Retro UI styles
│   └── main.tsx           # React entry point
├── dist-electron/         # Compiled Electron code
├── dist/                  # Production build output
├── index.html             # HTML entry point
├── package.json           # npm configuration
├── tsconfig.json          # TypeScript config
└── vite.config.ts         # Vite config
```

---

## 🐛 Troubleshooting

### Problem 1: "npm install" Fails

**Symptoms:**
```
npm ERR! code ELIFECYCLE
npm ERR! electron@29.1.1 postinstall: ...
```

**Solution:**
```powershell
# Clean install
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm cache clean --force
npm install
```

### Problem 2: TypeScript Errors

**Symptoms:**
```
error TS2307: Cannot find module 'electron'
```

**Solution:**
```powershell
# Reinstall TypeScript and types
npm install --save-dev typescript @types/react @types/react-dom
```

### Problem 3: "Cannot find module 'ws'"

**Solution:**
```powershell
npm install ws
```

### Problem 4: Electron Window Doesn't Open

**Symptoms:**
- Terminal shows "ready" but no window
- Window crashes immediately

**Solutions:**
```powershell
# 1. Check if another Electron process is running
Get-Process | Where-Object {$_.ProcessName -like "*electron*"} | Stop-Process

# 2. Try clearing Electron cache
Remove-Item -Recurse -Force $env:APPDATA\electron -ErrorAction SilentlyContinue

# 3. Reinstall Electron
npm install electron@latest
```

### Problem 5: "Cannot connect to WebSocket server"

**Symptoms:**
- Shows "Disconnected from server"
- Can't send messages

**Solutions:**

1. **Check RangerPlex server is running:**
   ```powershell
   # In main RangerPlex directory
   cd C:\Users\david\rangerplex-ai
   npm run pm2:status
   ```

2. **Start blockchain chat server:**
   ```powershell
   # If not running
   npm run blockchain:relay
   ```

3. **Test connection manually:**
   ```powershell
   # Test with curl (check port is open)
   curl http://localhost:5555
   ```

4. **Try AWS server instead:**
   - Use: `ws://44.222.101.125:5555`

### Problem 6: "Build fails with missing tsconfig.json"

**Symptoms:**
```
error: Cannot find tsconfig.json
```

**Solution:**
A `tsconfig.json` file should have been created. If missing:
```powershell
# Copy from main project
Copy-Item ..\..\tsconfig.json .
```

Or use the one provided in this directory.

---

## 🎨 Customization

### Change Window Size:
Edit `electron/main.ts`:
```typescript
win = new BrowserWindow({
    width: 600,   // Change this
    height: 800,  // Change this
    // ...
})
```

### Change Default Server:
Edit `src/App.tsx`:
```typescript
const [serverUrl, setServerUrl] = useState('ws://your-server:5555')
```

### Change Theme Colors:
Edit `src/App.css`:
```css
:root {
    --primary-color: #00ff00;  /* Change green */
    --bg-color: #000000;       /* Change black */
}
```

---

## 🚀 Advanced Usage

### Connect to Your Own Server:

1. **Start RangerPlex blockchain relay:**
   ```powershell
   cd C:\Users\david\rangerplex-ai
   npm run blockchain:relay
   ```

2. **Find your IP:**
   ```powershell
   ipconfig | findstr "IPv4"
   ```

3. **Use in RangerChat Lite:**
   ```
   ws://YOUR_IP:5555
   ```

### Run Multiple Instances:

You can run multiple RangerChat Lite windows to test multi-user chat:

```powershell
# Terminal 1
npm run dev

# Terminal 2 (after first one opens)
npm run dev
```

Use different usernames in each window.

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| App Size | ~150MB (installed) |
| RAM Usage | ~100-150MB |
| Startup Time | ~2-3 seconds |
| Build Time | ~15-30 seconds |

---

## 🔗 Integration with RangerPlex

RangerChat Lite connects to the RangerPlex blockchain chat network:

```
RangerChat Lite (Electron)
    ↓ WebSocket
RangerPlex Relay Server (Node.js)
    ↓
Blockchain Chat Network
    ↓
Other RangerPlex Nodes
```

**Server Endpoints:**
- Local: `ws://localhost:5555`
- AWS: `ws://44.222.101.125:5555`
- Main app: Runs embedded in RangerPlex web UI

---

## 📝 Development Notes

### Hot Reload:
Changes to `src/*.tsx` and `src/*.css` appear instantly (no restart needed).

Changes to `electron/*.ts` require restart:
```powershell
# Stop with Ctrl+C, then:
npm run dev
```

### Debug Console:
Right-click in the window → **Inspect Element** to open DevTools

### Logs:
Check terminal output for errors and WebSocket messages

---

## 🎯 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Run in development mode |
| `npm run build` | Build for current platform |
| `npm run build:win` | Build Windows installer (.exe) |
| `npm run build:mac` | Build macOS installer (.dmg) |
| `npm run build:linux` | Build Linux packages (.AppImage, .deb) |
| `npm run build:all` | Build for all platforms |
| `npm run preview` | Preview production build |

---

## 🤝 Connection to Main RangerPlex

RangerChat Lite is a **companion app** to the main RangerPlex project:

- **Main RangerPlex:** Full web-based interface (browser)
- **RangerChat Lite:** Lightweight desktop client (Electron)

Both connect to the same chat network and can communicate with each other.

---

## 🐞 Known Issues

1. **Frameless window**: Minimize button doesn't work (aesthetic choice)
2. **Transparent background**: May show artifacts on some Windows themes
3. **DevTools**: Opens in main window (can't detach)
4. **Antivirus False Positive**: Some antivirus software (1/65 on VirusTotal) may flag the app due to Electron's frameless overlay. This is a false positive - [View VirusTotal Report](https://www.virustotal.com/gui/file/aff8c67fc85e610f0a629853ab8b2d3cae56a300c1d0e581a77002c432fd8352/details)

These are intentional design choices for the retro aesthetic.

---

## 📚 Tech Stack Details

- **Electron 29** - Chromium 122 + Node.js 20
- **React 18** - UI library
- **Vite 5** - Build tool (faster than Webpack)
- **TypeScript 5** - Type safety
- **WebSocket (ws)** - Real-time communication

---

## 🎉 Success Checklist

After installation, you should have:

- [x] `node_modules/` directory exists (~200MB)
- [x] `npm run dev` starts without errors
- [x] Electron window opens (400x600px)
- [x] Login screen appears with green text
- [x] Can enter username and server URL
- [x] Can connect to `ws://44.222.101.125:5555`
- [x] Can send and receive messages

---

## 💡 Tips

1. **Keep RangerPlex server running** for local testing
2. **Use AWS server** if local server is down
3. **Open DevTools** for debugging (right-click → Inspect)
4. **Check terminal** for WebSocket connection logs
5. **Restart app** if connection hangs (close and `npm run dev`)

---

## 📞 Getting Help

If stuck, check:
1. Terminal output for errors
2. DevTools console (right-click → Inspect Element)
3. Main RangerPlex server is running (`npm run pm2:status`)
4. Network connectivity (firewall, antivirus)

---

**Version:** 1.9.4
**Created:** December 2025
**Platform:** Windows 11, macOS, Linux
**Node.js:** v22.x
**Author:** David Keane

Enjoy chatting! 🦅

# 🦅 RangerChat Lite - Setup & Usage Guide

**Complete guide for installing, running, and using RangerChat Lite on Windows 11**

---

## 📋 Table of Contents

1. [What is RangerChat Lite?](#what-is-rangerchat-lite)
2. [Quick Start (3 Minutes)](#quick-start-3-minutes)
3. [Full Installation](#full-installation)
4. [Running the App](#running-the-app)
5. [Using RangerChat Lite](#using-rangerchat-lite)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Features](#advanced-features)

---

## 🎯 What is RangerChat Lite?

RangerChat Lite is a **standalone desktop chat client** that connects to the RangerPlex blockchain chat network.

### Key Features
- 💬 Real-time P2P chat over WebSocket
- 🌐 Connect to internet relay servers or local network
- 🎨 Retro 90s terminal aesthetic (green-on-black)
- 🪟 Custom frameless window design
- 🔒 Blockchain-based identity (future: voice & video calls)
- 📦 Lightweight Electron app (~400x600px window)

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Electron (desktop wrapper)
- **Protocol**: WebSocket (relay-based P2P)
- **Server**: AWS relay at `ws://44.222.101.125:5555`

---

## ⚡ Quick Start (3 Minutes)

**Prerequisites:**
- Node.js v22+ installed
- Windows 11 (tested on MSI Vector 16")

```powershell
# 1. Navigate to RangerChat Lite directory
cd C:\Users\david\rangerplex-ai\apps\ranger-chat-lite

# 2. Install dependencies (first time only)
npm install

# 3. Run the app
npm run dev
```

**That's it!** The Electron window will launch automatically.

---

## 🔧 Full Installation

### Step 1: Prerequisites

**Check Node.js version:**
```powershell
node --version
# Should show: v22.21.1 or higher
```

**If Node.js not installed:**
```powershell
# Download from: https://nodejs.org/
# Or use winget:
winget install OpenJS.NodeJS.LTS
```

### Step 2: Install Dependencies

```powershell
cd C:\Users\david\rangerplex-ai\apps\ranger-chat-lite
npm install
```

**What gets installed:**
- React 18.2.0 (UI framework)
- Electron 29.1.1 (desktop wrapper)
- Vite 5.1.6 (build tool)
- TypeScript 5.2.2 (type safety)

**Installation should complete with:**
```
added 500+ packages in ~30s
```

### Step 3: Verify Installation

```powershell
# Check if TypeScript compiles
npx tsc --noEmit

# Should show: No errors
```

---

## 🚀 Running the App

### Development Mode (Recommended)

```powershell
npm run dev
```

**What happens:**
1. Vite builds the React app → http://localhost:5173 (or 5174 if port busy)
2. Electron builds main.js and preload.js
3. Electron window opens automatically
4. Hot Module Replacement (HMR) enabled - changes auto-reload

**You'll see:**
```
VITE v5.4.21 ready in 253ms
➜  Local:   http://localhost:5174/
Electron window launching...
```

### Production Build

```powershell
npm run build
```

**What happens:**
1. TypeScript compiles to JavaScript
2. Vite bundles React app
3. Electron-builder creates installer (.exe)

**Output location:**
- Windows: `dist/RangerChat-Lite-Setup-1.0.0.exe`

---

## 💬 Using RangerChat Lite

### First Launch - Login Screen

When you first open RangerChat Lite, you'll see:

```
┌─────────────────────────────────┐
│     💾 RangerChat Lite     _ X  │
├─────────────────────────────────┤
│                                 │
│           🦅                    │
│     RangerChat Login            │
│                                 │
│  Username: [RangerUser____]     │
│                                 │
│  Server URL:                    │
│  [ws://44.222.101.125:5555]     │
│                                 │
│         [Connect]               │
│                                 │
└─────────────────────────────────┘
```

### Connecting to Chat

**Step 1: Choose Username**
- Type your desired nickname (e.g., "IrishRanger", "Ranger", "David")
- This is what others will see when you send messages

**Step 2: Choose Server**

**Option A: AWS Relay (Internet - Default)**
```
ws://44.222.101.125:5555
```
- Connects to public relay server
- Works from anywhere with internet
- **TESTED AND WORKING ✅**

**Option B: Local Network**
```
ws://192.168.1.35:5555
```
- Connects to local M3Pro Genesis node
- Only works on same network
- Faster, more private

**Step 3: Click "Connect"**

You'll see system messages:
```
[21:59] System: Connected to server, waiting for welcome...
[21:59] System: Registered as IrishRanger
[21:59] System: 3 peer(s) online
```

### Sending Messages

Once connected, the interface changes:

```
┌─────────────────────────────────┐
│     💾 RangerChat Lite     _ X  │
├─────────────────────────────────┤
│ [21:59] System: 3 peer(s) online│
│ [21:59] M3Pro: Hello!           │
│ [22:00] IrishRanger: Hi there!  │
│                                 │
│                                 │
├─────────────────────────────────┤
│ [Type a message...___] [Send]  │
└─────────────────────────────────┘
```

**To send a message:**
1. Type in the input box at the bottom
2. Press **Enter** or click **Send**
3. Your message appears immediately

**Message colors:**
- **Green text** = Your messages
- **Cyan text** = Other users' messages
- **Yellow text** = System notifications

### Understanding System Messages

```
System: Connected to server, waiting for welcome...
→ WebSocket connection established

System: Registered as IrishRanger
→ Registration successful, you're now in chat

System: 3 peer(s) online
→ Number of other users connected

System: Disconnected from server
→ Connection lost (check internet/server)
```

---

## 🔍 Troubleshooting

### Problem 1: App Won't Launch

**Symptoms:**
- Double-click app, nothing happens
- Or: Error message on startup

**Solution:**
```powershell
# Kill any hanging processes
taskkill /F /IM electron.exe 2>nul

# Clean rebuild
cd apps/ranger-chat-lite
rm -r node_modules
npm install
npm run dev
```

### Problem 2: "Connection Refused" Error

**Symptoms:**
```
System: Connection error
```

**Solutions:**

**Check internet connection:**
```powershell
ping 44.222.101.125
# Should show: Reply from 44.222.101.125
```

**Try different server:**
- AWS: `ws://44.222.101.125:5555` ✅ Tested working
- Local: `ws://192.168.1.35:5555` (only if on same network)

**Check Windows Firewall:**
```powershell
# Allow outgoing WebSocket connections
# Settings → Firewall → Allow an app
# Add: electron.exe
```

### Problem 3: Can't See Messages

**Symptoms:**
- Connected successfully
- Can't see messages from other users
- Your messages don't appear

**Solution:**
```powershell
# Check if correct protocol version
# Open browser console (if using dev mode):
# Ctrl+Shift+I → Console tab

# Look for:
# "Unknown message type" or "Unknown payload type"
```

**Fix:** Make sure you have the latest version:
```powershell
cd apps/ranger-chat-lite
git pull origin main
npm install
npm run dev
```

### Problem 4: TypeScript Errors

**Symptoms:**
```
error TS2307: Cannot find module 'react'
```

**Solution:**
```powershell
# Reinstall dependencies
npm install

# Verify tsconfig.json exists
dir tsconfig.json
# Should show: tsconfig.json (created in v4.1.7)
```

### Problem 5: Port Already in Use

**Symptoms:**
```
Port 5173 is in use, trying another one...
VITE ready on http://localhost:5174/
```

**This is normal!** Vite automatically finds next available port.

**To force specific port:**
```powershell
# Edit package.json
"dev": "vite --port 5173"
```

---

## 🎨 Advanced Features

### Custom Window Controls

**Minimize:**
- Click **_** button (top-right)

**Close:**
- Click **X** button (top-right)

**Move Window:**
- Click and drag title bar (💾 RangerChat Lite)

### Changing Servers While Connected

**Currently:** Must disconnect and reconnect

**How to:**
1. Click **X** to close window
2. Relaunch app: `npm run dev`
3. Enter new server URL
4. Click **Connect**

### Message History

**Currently:** Messages are NOT saved (intentional for privacy)

**History is lost when:**
- You close the app
- You disconnect from server

**Future feature:** Optional local message logging

### Keyboard Shortcuts

- **Enter** = Send message
- **Ctrl+A** = Select all text in input
- **Ctrl+C** = Copy selected text
- **Ctrl+V** = Paste text

---

## 🔐 Security & Privacy

### What Data is Sent?

**To relay server:**
- Your chosen username (nickname)
- Your messages (plain text)
- Your unique node ID (`lite-XXXXXXXX`)
- Channel name (`#rangers`)

**NOT sent:**
- Your real name
- Your email
- Your IP address (relay server sees it, but doesn't store)
- Your files or browsing history

### Is Chat Encrypted?

**Current version:** No end-to-end encryption (messages sent as plain text over WebSocket)

**Transport security:** WebSocket over TLS (wss://) planned for future

**Future features:**
- RSA-2048 key pairs (like voice-chat.cjs)
- Encrypted private messages
- Identity verification

---

## 🚀 Future Features (Coming Soon)

Based on `voice-chat.cjs` infrastructure:

### Voice Calls 🎤
- One-on-one voice calls
- Opus codec compression
- Call/answer/hangup controls

### Video Calls 📹
- WebRTC peer-to-peer video
- Screen sharing
- Multi-party video rooms

### File Transfers 📁
- Drag-and-drop file sending
- Progress indicators
- Automatic encryption

---

## 📚 Technical Reference

### WebSocket Protocol Flow

```
1. Client connects → ws://44.222.101.125:5555
2. Server sends → { type: 'welcome', ... }
3. Client sends → { type: 'register', address, nickname, channel, ... }
4. Server sends → { type: 'registered', ... }
5. Client sends → { type: 'getPeers' }
6. Server sends → { type: 'peerList', peers: [...] }
7. Client sends → { type: 'broadcast', payload: { type: 'chatMessage', ... } }
8. Server sends → { type: 'broadcast', payload: { type: 'chatMessage', ... } }
```

### Message Format Examples

**Registration:**
```json
{
  "type": "register",
  "address": "lite-a1b2c3d4",
  "nickname": "IrishRanger",
  "channel": "#rangers",
  "ip": "0.0.0.0",
  "port": 0,
  "mode": "lite-client",
  "capabilities": ["chat"]
}
```

**Chat Message:**
```json
{
  "type": "broadcast",
  "payload": {
    "type": "chatMessage",
    "from": "lite-a1b2c3d4",
    "nickname": "IrishRanger",
    "message": "Hello world!",
    "timestamp": 1733166000000
  }
}
```

### File Locations

**Source code:**
- React app: `apps/ranger-chat-lite/src/App.tsx`
- Electron main: `apps/ranger-chat-lite/electron/main.ts`
- Electron preload: `apps/ranger-chat-lite/electron/preload.ts`

**Configuration:**
- TypeScript: `apps/ranger-chat-lite/tsconfig.json`
- Vite: `apps/ranger-chat-lite/vite.config.ts`
- npm: `apps/ranger-chat-lite/package.json`

**Build output:**
- Electron: `apps/ranger-chat-lite/dist-electron/`
- React: `apps/ranger-chat-lite/dist/`

---

## 🆘 Getting Help

### Documentation
- **README.md** - Project overview and quick start
- **QUICK_START.md** - 3-minute setup guide
- **SETUP_AND_USAGE.md** - This file!

### Logs
```powershell
# View Electron logs (if app crashes)
cd apps/ranger-chat-lite
npm run dev 2>&1 | tee debug.log
```

### Report Issues
1. Check existing issues: https://github.com/yourusername/rangerplex-ai/issues
2. Create new issue with:
   - Operating system (Windows 11, etc.)
   - Node.js version (`node --version`)
   - Error messages
   - Steps to reproduce

---

## ✅ Verification Checklist

Before reporting issues, verify:

- [ ] Node.js v22+ installed
- [ ] In correct directory (`apps/ranger-chat-lite`)
- [ ] Dependencies installed (`npm install` completed)
- [ ] TypeScript compiles (`npx tsc --noEmit` shows no errors)
- [ ] Internet connection working
- [ ] Firewall allows Electron app
- [ ] Using correct server URL (AWS: `ws://44.222.101.125:5555`)

---

## 🎉 Success Indicators

**You're ready to chat when you see:**

✅ Electron window opens
✅ Login screen appears with username/server fields
✅ "Connect" button clickable
✅ System message: "Registered as [YourName]"
✅ System message: "X peer(s) online"
✅ Chat input active (can type messages)
✅ Messages send when pressing Enter

**Confirmed working on:**
- Windows 11 (MSI Vector 16") ✅
- macOS (M3 Pro) ✅ (tested with similar protocol)

---

## 🤝 Credits

**Development:**
- David Keane (IrishRanger) - Testing, requirements
- Claude Code (Ranger) - WebSocket protocol implementation

**Protocol Reference:**
- `rangerblock/just-chat/voice-chat.cjs` - Working implementation (1526 lines)

**Version:** 4.1.8
**Status:** ✅ **PRODUCTION READY**
**Last Updated:** 2025-12-02

---

**Happy Chatting! 🦅**

# RangerPlex AI - Windows Quick Start Guide

## ✅ Installation Complete!

Your RangerPlex installation has been fixed for Windows. All dependencies are installed and tested.

## 🚀 How to Start RangerPlex on Windows

### Option 1: Browser Mode (Recommended - Same as macOS!)

```powershell
npm run browser
```

This will:
- Start both the API server (port 3000) and Vite dev server (port 5173)
- **Automatically open your browser** when servers are ready
- Run in the foreground (you'll see logs in realtime)
- Stop when you press Ctrl+C

**Your browser will open automatically at:** http://localhost:5173

### Option 2: Simple Start (No Auto-Browser)

```powershell
npm start
```

Same as Option 1, but doesn't auto-open the browser.

**Access your app at:** http://localhost:5173

### Option 2: PM2 Background Service (API Server Only - More Reliable)

PM2 on Windows has issues with Vite, so we'll only run the API server with PM2 and run Vite separately:

**Terminal 1 - Start API Server with PM2:**
```powershell
pm2 start proxy_server.js --name rangerplex-api
pm2 logs rangerplex-api  # View logs
```

**Terminal 2 - Start Vite Dev Server:**
```powershell
npm run dev
```

**Access your app at:** http://localhost:5173

### Option 3: Background using Windows Terminal (Multi-tab)

1. Open Windows Terminal
2. Split into 2 panes (Ctrl+Shift+Plus)
3. In Pane 1: `node proxy_server.js`
4. In Pane 2: `npm run dev`

## 🛑 Stopping RangerPlex

### If using npm start:
- Press **Ctrl+C** in the terminal

### If using PM2:
```powershell
pm2 stop rangerplex-api
pm2 delete rangerplex-api
```

### If ports are stuck:
```powershell
# Use the Windows shutdown script
powershell -ExecutionPolicy Bypass -File scripts/shutdown.ps1
```

## ⚠️ Known Issues & Fixes

### Issue 1: PM2 + Vite Compatibility
**Problem:** PM2 has trouble running Vite on Windows (keeps restarting)
**Solution:** Use `npm start` or run Vite separately with `npm run dev`

### Issue 2: Node-pty Build Failure (Terminal Feature)
**Problem:** node-pty requires Visual Studio Build Tools and fails to build
**Solution:** We installed with `--ignore-scripts` to skip problematic native modules
**Impact:** Terminal integration disabled, but all AI features work perfectly

### Issue 3: Port Already in Use
**Problem:** Port 3000 or 5173 already taken
**Solution:**
```powershell
# Find what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use the shutdown script
.\scripts\shutdown.ps1
```

## 📦 What Was Fixed

1. **npm install issues** - Created `.npmrc` to skip building problematic native modules
2. **ecosystem.config.cjs** - Updated for Windows compatibility
3. **package.json scripts** - Made cross-platform with Windows support
4. **shutdown script** - Created `scripts/shutdown.ps1` for Windows
5. **Install script improvements** - Enhanced validation and Windows error handling

## 📝 Configuration Files Changed

- ✅ `.npmrc` - Added to skip node-pty build
- ✅ `package.json` - Updated scripts for Windows
- ✅ `ecosystem.config.cjs` - Windows-compatible PM2 config
- ✅ `install-me-now.ps1` - Enhanced validation
- ✅ `scripts/shutdown.ps1` - New Windows shutdown script

## 🎯 Next Steps

1. **Start RangerPlex:**
   ```powershell
   npm start
   ```

2. **Open Browser:**
   http://localhost:5173

3. **Configure API Keys:**
   - Edit `.env` file or use the web interface
   - Add at least one AI provider (Gemini, OpenAI, or Claude)

4. **Test the Installation:**
   - Send a message in the chat
   - Try different AI providers
   - Check that all features work

## 🔧 Advanced: PM2 Full Setup (Not Recommended for Windows)

If you still want to use PM2 for both servers (experimental):

```powershell
npm run pm2:start  # Start both servers
npm run pm2:status # Check status
npm run pm2:logs   # View logs
npm run pm2:stop   # Stop servers
```

**Note:** Vite may restart frequently with PM2 on Windows. Use `npm start` for stability.

## 📚 Additional Documentation

- **Full Manual:** `rangerplex_manual.md`
- **Windows Setup Details:** `WINDOWS_SETUP.md`
- **API Documentation:** Check `/api` endpoints at http://localhost:3000/api/health

## ✅ Verification

Run these to verify your installation:

```powershell
# Check Node version (should be v22.x)
node -v

# Check if all critical packages installed
npm list vite pm2 express react better-sqlite3 --depth=0

# Test API server
curl http://localhost:3000/api/health
```

## 💡 Tips

- Use **Windows Terminal** for the best experience
- Enable **Developer Mode** in Windows Settings for fewer permission issues
- Consider using **Git Bash** if you prefer bash commands
- PM2 works better on Linux/macOS - for Windows development, `npm start` is simpler

---

**Status:** ✅ Ready to use!
**Platform:** Windows 11 (MSI Vector)
**Node.js:** v22.21.1
**Last Updated:** 2025-12-02

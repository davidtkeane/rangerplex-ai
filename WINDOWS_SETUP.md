# RangerPlex AI - Windows Setup Guide

## Issues Found & Fixed

### 1. Incomplete npm install
**Problem:** Only 3 packages were installed instead of all dependencies.

**Solution:** Run a clean install:
```powershell
# Remove incomplete node_modules
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Clean install
npm install
```

### 2. better-sqlite3 Build Issues (Common on Windows)
**Problem:** better-sqlite3 requires native compilation and may fail with Node.js v23+.

**Requirements:**
- Node.js v22.x (LTS) - **REQUIRED**
- Windows Build Tools (automatically installed by npm)

**If build fails:**
```powershell
# Rebuild native modules
npm rebuild better-sqlite3

# Or force reinstall
npm uninstall better-sqlite3
npm install better-sqlite3
```

### 3. Windows-Specific Script Issues
**Fixed:**
- ✅ Created `scripts/shutdown.ps1` (PowerShell version)
- ✅ Updated `package.json` with Windows-compatible scripts
- ✅ Updated `ecosystem.config.cjs` to use `.cmd` files on Windows

**New Scripts:**
```powershell
npm run stop:win    # Windows-specific shutdown
npm run stop:unix   # macOS/Linux shutdown
npm run stop        # Auto-detects platform
```

### 4. PM2 Configuration
**Fixed:** PM2 ecosystem config now detects Windows and uses correct vite executable:
- Windows: `node_modules/.bin/vite.cmd`
- macOS/Linux: `node_modules/.bin/vite`

## Complete Windows Installation Steps

### Step 1: Prerequisites
```powershell
# Check Node.js version (MUST be v22.x)
node -v  # Should show v22.x.x

# If you have Node 23+, use nvm-windows to downgrade
nvm install 22
nvm use 22
```

### Step 2: Clean Install
```powershell
# Navigate to project directory
cd C:\Users\david\rangerplex-ai

# Clean install
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
```

### Step 3: Verify Installation
```powershell
# Check if all packages installed
npm list --depth=0

# Should see all dependencies including:
# - vite
# - pm2
# - better-sqlite3
# - express
# - react
# - etc.
```

### Step 4: Start RangerPlex
```powershell
# Using PM2 (recommended - runs in background)
npm run pm2:start

# Check status
npm run pm2:status

# View logs
npm run pm2:logs

# Stop servers
npm run pm2:stop
```

**Alternative - Direct Start (foreground):**
```powershell
npm start
```

## Common Windows Issues & Solutions

### Issue: "Cannot find module 'better-sqlite3'"
**Solution:**
```powershell
npm rebuild better-sqlite3
```

### Issue: "node-gyp" build errors
**Solution:**
```powershell
# Install Windows Build Tools (if not already installed)
npm install --global windows-build-tools

# Or use Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/
# Select "Desktop development with C++"
```

### Issue: PM2 not found or fails to start
**Solution:**
```powershell
# Install PM2 globally
npm install -g pm2

# Or use local PM2
npx pm2 start ecosystem.config.cjs
```

### Issue: Port already in use
**Solution:**
```powershell
# Use the shutdown script
npm run stop:win

# Or manually kill processes on ports
netstat -ano | findstr :3000
netstat -ano | findstr :5173
# Then: taskkill /PID <PID> /F
```

### Issue: PowerShell execution policy blocks scripts
**Solution:**
```powershell
# Run PowerShell as Administrator, then:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Differences from macOS/Linux

| Feature | macOS/Linux | Windows |
|---------|-------------|---------|
| Shutdown script | `bash scripts/shutdown.sh` | `powershell scripts/shutdown.ps1` |
| Vite executable | `node_modules/.bin/vite` | `node_modules/.bin/vite.cmd` |
| Port checking | `lsof -ti :PORT` | `netstat -ano` |
| Process killing | `kill -9 PID` | `Stop-Process -Id PID -Force` |
| Environment vars | `BROWSER=none` | Set in ecosystem config |

## Testing Your Installation

Run these commands to verify everything works:

```powershell
# 1. Check Node version
node -v  # Should be v22.x.x

# 2. Check npm packages
npm list --depth=0

# 3. Try starting with PM2
npm run pm2:start

# 4. Check PM2 status
npm run pm2:status

# 5. Open browser
start http://localhost:5173

# 6. Check logs for errors
npm run pm2:logs

# 7. Stop when done testing
npm run pm2:stop
```

## Updated install-me-now.ps1 Notes

The installer should now:
1. ✅ Check for Node.js v22.x
2. ✅ Install nvm-windows if needed
3. ✅ Run `npm install` correctly
4. ✅ Handle Windows paths properly
5. ⚠️ **Need to add:** Check for incomplete installs
6. ⚠️ **Need to add:** Rebuild native modules explicitly

## Recommended Improvements for install-me-now.ps1

Add after the `Install-Dependencies` function:

```powershell
# Verify installation completeness
$criticalPackages = @("vite", "pm2", "better-sqlite3", "express", "react")
$missingPackages = @()

foreach ($pkg in $criticalPackages) {
    if (-not (Test-Path "node_modules\$pkg")) {
        $missingPackages += $pkg
    }
}

if ($missingPackages.Count -gt 0) {
    Write-Warn "Missing critical packages: $($missingPackages -join ', ')"
    Write-Host "Retrying installation..." -ForegroundColor Yellow
    npm install --force
}

# Rebuild native modules on Windows
if ($env:OS -match "Windows") {
    Write-Step "Rebuilding native modules for Windows..."
    npm rebuild better-sqlite3 2>$null
    npm rebuild node-pty 2>$null
}
```

## Support

If you continue to have issues:
1. Check Node.js version: `node -v` (must be v22.x)
2. Check install logs: Look for red error messages during `npm install`
3. Try clean install: Delete node_modules and package-lock.json, run `npm install`
4. Check Windows Build Tools: Some native modules require C++ compiler

## Access Your Installation

After successful start:
- **Web UI:** http://localhost:5173
- **API Server:** http://localhost:3000
- **PM2 Logs:** `npm run pm2:logs`

---

*Generated: 2025-12-02*
*Platform: Windows 11 on MSI Vector*
*Original Development: macOS (M3 Pro MacBook)*

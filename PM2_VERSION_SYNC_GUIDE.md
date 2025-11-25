# 🎖️ PM2 Version Sync Guide

## Problem

When running `npm run pm2:start` on M1 Air, you see:

```
>>>> In-memory PM2 is out-of-date, do:
>>>> $ pm2 update
In memory PM2 version: 6.0.13
Local PM2 version: 5.4.3
```

## Cause

**Version mismatch** between:
- **Global PM2** (installed system-wide): v6.0.13
- **Local PM2** (in package.json): v5.4.3

## Solution

### Option 1: Automated Fix (Recommended)

Run the sync script:

```bash
bash sync-pm2-version.sh
```

This will:
1. Detect version mismatch
2. Update global PM2 to match local version
3. Reinstall dependencies
4. Restart PM2 processes

### Option 2: Manual Fix

```bash
# Update global PM2
pm2 update

# Reinstall dependencies
npm install

# Restart PM2
npm run pm2:restart
```

### Option 3: Use New npm Script

```bash
npm run pm2:update
```

## What Changed

**package.json updates:**
- PM2 version: `5.4.3` → `6.0.13`
- Package version: `2.5.28` → `2.5.31`
- Added script: `"pm2:update": "pm2 update"`

## For M1/M2/M3/M4 Macs

After pulling the latest code:

```bash
# Pull latest changes
git pull origin main

# Sync PM2 versions
bash sync-pm2-version.sh

# Or manually
npm install
pm2 update
npm run pm2:restart
```

## Verification

Check versions match:

```bash
# Global PM2
pm2 -v

# Local PM2
grep '"pm2"' package.json
```

Both should show: **6.0.13**

## Why This Matters

- ✅ Eliminates warning messages
- ✅ Ensures PM2 features work correctly
- ✅ Prevents potential compatibility issues
- ✅ Clean, professional output

## Note

**The warning is harmless** - your apps still start and run correctly. But syncing versions keeps everything clean and professional.

---

**Rangers lead the way!** 🎖️

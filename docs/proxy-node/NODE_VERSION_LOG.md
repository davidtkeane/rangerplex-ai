# Node Version Change Log - RangerPlex AI

## Current State (Before Changes)
**Date**: Sun 23 Nov 2025 14:40:05 GMT
**Issue**: Radio proxy endpoint failing due to Node.js version mismatch

### Current Installation

**Active Node Version**: v25.2.1
**NPM Version**: 11.6.2
**Node Path**: /opt/homebrew/bin/node
**NPM Path**: /opt/homebrew/bin/npm
**Node Module Version**: 141 (v25.x)

### Homebrew Packages Installed
```
node (v25.2.1) ← Currently active
node@22 ← Installed but not active
```

### The Problem
```
Error: The module 'better-sqlite3.node' was compiled against a different Node.js version using
NODE_MODULE_VERSION 115. This version of Node.js requires NODE_MODULE_VERSION 141.
```

**Translation**:
- `better-sqlite3.node` was compiled for Node v20 (MODULE_VERSION 115)
- Current Node v25.2.1 requires MODULE_VERSION 141
- **MISMATCH** → Database won't load → Radio proxy won't start

### CHANGELOG Reference
From `CHANGELOG.md` v2.2.0:
> **Node v20 LTS**: Recommended for stability (v25 not supported).

### better-sqlite3 Build Info
```
File: /Users/ranger/Local Sites/rangerplex-ai/node_modules/better-sqlite3/build/Release/better_sqlite3.node
Size: 1,832,864 bytes
Date: 26 Apr 2024
Status: Compiled for Node v20, incompatible with v25
```

---

## Solution Plan

**Goal**: Switch from Node v25.2.1 → Node v22 LTS (Better long-term support)

**⚠️ Node v20 Deprecation Warning**:
```
Warning: node@20 has been deprecated because it is not supported upstream!
It will be disabled on 2026-10-28.
```
- Node v20 installed but will be deprecated in 11 months
- Node v22 ALREADY INSTALLED and has longer support
- **STRATEGY**: Try Node v22 first (longer support), fallback to v20 if needed

**Steps**:
1. ~~Install Node v20 LTS~~ ✅ Already installed (but deprecating soon)
2. Try Node v22 first (already installed, better support)
3. Rebuild better-sqlite3 for v22
4. If v22 fails, use v20 temporarily and plan migration
5. Verify installation
6. Start proxy server with radio endpoint

---

## Commands to Execute - OPTION 1: Try Node v22 First (Recommended)

```bash
# 1. Unlink current Node v25
brew unlink node

# 2. Link Node v22 (already installed, longer support)
brew link --force node@22

# 3. Verify Node version (should show v22.x.x)
node --version

# 4. Navigate to project directory
cd "/Users/ranger/Local Sites/rangerplex-ai"

# 5. Rebuild better-sqlite3 for Node v22
npm rebuild better-sqlite3

# 6. Start the proxy server
node proxy_server.js
```

## Commands to Execute - OPTION 2: Fallback to Node v20 (If v22 fails)

```bash
# 1. Unlink Node v22
brew unlink node@22

# 2. Link Node v20 (deprecated 2026-10-28, use temporarily)
brew link --force node@20

# 3. Verify Node version (should show v20.x.x)
node --version

# 4. Navigate to project directory
cd "/Users/ranger/Local Sites/rangerplex-ai"

# 5. Rebuild better-sqlite3 for Node v20
npm rebuild better-sqlite3

# 6. Start the proxy server
node proxy_server.js
```

---

## After Changes (✅ SUCCESSFUL MIGRATION)

**Date**: Sun 23 Nov 2025 14:49:10 GMT

**New Node Version**: v22.21.1 ✅
**New NPM Version**: 10.9.4 ✅
**New Module Version**: 127 (Node v22) ✅
**better-sqlite3 Status**: Prebuilt binary installed successfully ✅
**Proxy Server Status**: ONLINE at http://localhost:3010 ✅
**Radio Status**: Endpoint loaded, ready for testing 📻

### Success Output
```
✅ Database initialized at: /Users/ranger/Local Sites/rangerplex-ai/data/rangerplex.db

╔═══════════════════════════════════════════════════════════╗
║   🎖️  RANGERPLEX AI SERVER v2.2.0                        ║
║   📡 REST API:      http://localhost:3010                ║
║   🔌 WebSocket:     ws://localhost:3010                  ║
║   💾 Database:      ...rangerplex.db                     ║
║   Status: ✅ ONLINE                                       ║
╚═══════════════════════════════════════════════════════════╝
```

### Commands That Worked
```bash
# 1. Uninstalled deprecated Node v20
brew uninstall node@20

# 2. Switched to Node v22
brew unlink node
brew link --overwrite node@22

# 3. Fixed PATH
echo 'export PATH="/opt/homebrew/opt/node@22/bin:$PATH"' >> ~/.zshrc

# 4. Reinstalled better-sqlite3 (prebuilt binary)
npm uninstall better-sqlite3
npm install better-sqlite3

# 5. Started server successfully
node proxy_server.js
```

---

## Rollback Plan (If Needed)

```bash
# If neither v22 nor v20 work, rollback to v25
brew unlink node@22  # or node@20
brew link --force node
```

---

## 🔮 Future Plan: Node Version Strategy

**Current Situation**:
- Node v20: Deprecated 2026-10-28 (11 months)
- Node v22: Active LTS, supported longer
- Node v25: Too new, breaks better-sqlite3

**Long-Term Strategy**:
1. **Immediate**: Use Node v22 (if compatible) or v20 (temporary)
2. **Before Oct 2026**: Migrate to whatever is the current LTS (likely v24 or v26)
3. **Alternative**: Consider switching from better-sqlite3 to a pure JS database:
   - `sql.js` (SQLite compiled to WebAssembly, no native modules)
   - `better-sqlite3-multiple-ciphers` (alternative fork)
   - PostgreSQL/MySQL (if scaling up)

**Update CHANGELOG.md** after we confirm which version works:
```markdown
*   **Node v22 LTS**: Recommended for stability (v20 deprecated Oct 2026, v25 not supported).
```

---

**Rangers lead the way!** 🎖️

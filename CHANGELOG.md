# 🚀 RangerPlex Changelog

All notable changes to the **RangerPlex Browser** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.5.36] - 2025-11-26 (Project PHANTOM WING)

### 🌟 The Browser Evolution
We are officially transforming RangerPlex from a web app into a **Hybrid Browser-OS**.
- **New Architecture**: "Trinity" Model (Server, Docker, Browser).
- **Documentation**: Created `docs/RangerPlexBrowser/rangerplexOS/RANGERPLEX_BROWSER_ARCHITECTURE.md`.
- **Manual**: Updated `rangerplex_manule.md` to be the Single Source of Truth.

### ✨ Added
- **Electron Wrapper**: Implemented `electron/main.js` and `preload.js`. Run with `npm run browser`.
- **Ghost Protocol**: Added Global Panic Button (`Cmd+Shift+Esc`) to instantly hide window and wipe RAM.
- **Phase 1: The Wrapper**: Electron integration complete.
- **Phase 2: Seamus & The Phantom Tabs**: Memory management system implemented.
- **Phase 3: Security & Ghost Protocol**: Global Panic Button (`Cmd+Shift+Esc`) active.
- **Phase 4: The Lens**: AI Vision implemented with `BrowserView` text extraction.
- **Phase 5: The Mini-OS**: Native File System access (Notes) and Floating Terminal added.
- **Browser UI**: Created `BrowserLayout.tsx` with Seamus's "Phantom Tab" logic (auto-suspend after 10 mins).
- **RangerChain Plan**: Master plan consolidated in `docs/RangerPlexBrowser/rangerplexOS/RANGERCHAIN_COMPLETE_MASTER_PLAN.md`.
- **Vault Plan**: Crypto Vault architecture defined in `docs/security/CRYPTO_VAULT_PLAN.md`. `AES-256-GCM` crypto vault at `./data/vault/`.

### 🔧 Changed
- **Manual Policy**: Explicit warning added to `rangerplex_manule.md` to ignore legacy docs.
- **Version Bump**: `package.json` updated to `2.5.36`.

---

## [2.5.35] - 2025-11-26
### Added
- **Ranger Console**: Embedded terminal in the dashboard.
- **Infinite Canvas**: Canvas board now resizes dynamically.

### Fixed
- **Canvas Settings**: Fixed unclickable settings button in `CanvasBoard.tsx`.

---

## [2.5.34] - 2025-11-25
### Added
- **RangerChain Video**: Initial integration of IDCP video compression.
- **IP Recon**: New `/iprecon` command for advanced threat analysis.

### Fixed
- **Radio Player**: Resolved connection issues after refresh.
- **Spinning Wheel**: Fixed infinite loading spinner bug.

---

## [2.5.33] - 2025-11-25
### Added
- **Docker Support**: Full `docker-compose` setup for containerized deployment.
- **Local AI in Docker**: Smart proxy logic for Ollama/LM Studio access from containers.

---

## [2.5.32] - 2025-11-24
### Fixed
- **Settings Modal**: Fixed syntax error (`Unexpected token`) in `SettingsModal.tsx`.
- **Server Connection**: Resolved WebSocket 404 errors in `proxy_server.js`.

---

## [2.5.31] - 2025-11-21
### Added
- **Memory Consolidation**: Unified AI Trinity memory into `~/.claude/ranger/`.
- **Perplexity MCP**: Fixed "EOF" error in Model Context Protocol setup.

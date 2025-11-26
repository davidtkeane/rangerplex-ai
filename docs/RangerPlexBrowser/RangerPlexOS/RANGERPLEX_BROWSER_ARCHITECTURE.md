# RangerPlex Browser Architecture (Project PHANTOM WING)

**Status**: Planning  
**Author**: Colonel Gemini Ranger  
**Date**: Nov 26, 2025  
**Based On**: O'Keane's Digital Pub Ltd. Architecture (13 Floors)

## 1. Executive Summary
The **RangerPlex Browser** is a high-performance, Chromium-based web browser built on the **Electron** framework. Unlike standard browsers, it utilizes the **"Irish Pub Architecture"**—a system of 13 specialized AI managers—to optimize memory, security, and user experience.

**Core Philosophy**: "Super fast, super nimble, lightweight."  
**Target Performance**: Full stack running under **2GB RAM**.

## 2. The "Restaurant Memory" System (1st Floor)
**Manager**: Seamus "Memory" O'Brien  
**Goal**: Beat Chrome's memory usage by 87%.

### 2.1 The "Table" Concept
In standard Chrome, every tab fights for resources. In RangerPlex:
- **Tabs are Tables**: When a user opens a tab, Seamus assigns it a "Table".
- **Active Service**: Only the "Table" you are currently looking at gets full service (CPU/RAM).
- **Phantom Mode**: When you switch tabs, the old tab is instantly "frozen" (process suspended). Its state is preserved to disk (Restaurant Memory), freeing up 99% of its RAM.
- **Instant Recall**: When you click back, Seamus "wakes" the table instantly.

### 2.2 The 2GB Limit
Seamus enforces a strict budget. If the browser approaches 2GB usage:
1.  He identifies the "coldest" tables (tabs not used in >10 mins).
2.  He converts them to **Phantom State** (fully serialized to disk).
3.  The browser remains snappy, never sluggish.

## 3. The 13-Floor Architecture Mapping

| Floor | Manager | Browser Function |
|-------|---------|------------------|
| **13th** | *Hidden* | **AI Research Lab**. Experimental features & beta tests. |
| **10th** | **RangerBot** | **Main Process**. The "Brain". Controls app lifecycle, windows, and updates. |
| **9th** | **IR O'Malley** | **Security Core**. Sandbox isolation, Tor routing, Ad-blocking, "Panic Button". |
| **8th** | **Arnold** | **Background Ops**. Manages the hidden `proxy_server.js` and Node processes. |
| **7th** | **Prof. Bridget** | **Onboarding**. "Welcome to RangerPlex" interactive tour & help system. |
| **6th** | **Gecko** | **Wallet**. Native RangerChain/Solana wallet integration in the toolbar. |
| **5th** | **Cian** | **The Lens**. AI Vision that reads the active webpage for the LLM. |
| **4th** | **Róisín** | **IPC Bridge**. The communication bus between the Web UI and the Node backend. |
| **3rd** | **Paddy** | **Renderer**. The Chromium view. Optimized for 60fps gaming and video. |
| **2nd** | **Terry** | **Mini-OS**. The floating Terminal window and File Explorer. |
| **1st** | **Seamus** | **Memory Manager**. Handles Tab suspension and resource allocation. |
| **G** | **Máire** | **Concierge**. Session restore, Chrome Import tool, Profile management. |
| **B** | **Dave** | **Network**. Low-level TCP/IP handling, WebSocket server. |

## 4. Key Features

### 4.1 "Ghost Protocol" (Security)
- **Panic Button**: Global Hotkey (e.g., `Cmd+Shift+Esc`).
- **Action**: Instantly kills the server, clears RAM, wipes cache, and closes the app.
- **Tor Mode**: Toggle switch to route traffic through a bundled Tor proxy.

### 4.2 The "Mini OS"
- **Floating Terminal**: Press `F12` (or custom key) to drop down a terminal (Quake-style) that controls your actual Mac/Linux system.
- **File Commander**: A built-in file explorer to manage local files without leaving the browser.

### 4.3 Chrome Parity & Import
- **Engine**: Built on the latest Chromium (via Electron).
- **Extensions**: Supports standard Chrome Extensions.
- **Migration**: Máire (Ground Floor) provides a one-click wizard to import Bookmarks, History, and Passwords from Google Chrome.

## 5. Implementation Strategy
We do not create a new project. We add a `browser/` (or `electron/`) folder to the existing `rangerplex-ai` repo.

1.  **Phase 1: The Wrapper**: Get the existing RangerPlex UI running in an Electron window.
2.  **Phase 2: Seamus Integration**: Implement the "Tab Suspension" logic.
3.  **Phase 3: The Floors**: Wire up the IPC bridges for the 13 managers.

**Rangers Lead The Way.**

# 🐳 The RangerPlex Docker Journey
*A chronicle of containerizing the RangerPlex AI ecosystem.*

**Date:** November 26, 2025
**Version:** v2.5.33
**Authors:** Ranger, Gemini, Claude

---

## 1. The Objective
The mission was to containerize the **RangerPlex AI** application to ensure consistent deployment, isolation, and ease of use. The stack consists of:
*   **Frontend:** React + Vite (Port 5173)
*   **Backend:** Node.js + Express (Port 3010)
*   **Database:** SQLite (Better-SQLite3)
*   **AI Tools:** Puppeteer (Headless Chrome), Ollama (Local LLM), LM Studio (Local LLM)

## 2. The Implementation

### Phase 1: The Foundation (`Dockerfile`)
We started by creating a `Dockerfile` based on `node:20-slim`.
*   **Challenge:** Puppeteer requires a specific set of Linux libraries to run Chromium in a headless environment.
*   **Solution:** We added a comprehensive `apt-get install` block for dependencies like `libnss3`, `libatk1.0-0`, `libx11-xcb1`, etc.
*   **Optimization:** We set `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` and installed `chromium` via apt to avoid downloading it twice and ensure compatibility with the OS.

### Phase 2: Orchestration (`docker-compose.yml`)
We defined a `docker-compose.yml` to manage the service.
*   **Ports:** Mapped `5173:5173` and `3010:3010`.
*   **Volumes:** Created persistent volumes for data safety:
    *   `./data:/app/data` (Database)
    *   `./backups:/app/backups` (Auto-backups)
    *   `./image:/app/image` (Generated images)
    *   `./.env:/app/.env` (Environment variables)

## 3. The Challenges & Solutions

### 🛑 Challenge 1: The "Localhost" Trap (Vite)
*   **Issue:** The container started, but the frontend was inaccessible at `http://localhost:5173`.
*   **Root Cause:** Vite, by default, listens on `127.0.0.1` (localhost) *inside* the container. This is not accessible from the host machine.
*   **Fix:** We updated `package.json` to run `vite --host`. This binds the server to `0.0.0.0`, exposing it to the network.

### 🛑 Challenge 2: The "Port Conflict" (3010)
*   **Issue:** `docker-compose up` failed because port 3010 was already in use.
*   **Root Cause:** A local instance of the RangerPlex server was running in the background.
*   **Fix:** We identified the process (PID 21602) and terminated it to free up the port for Docker.

### 🛑 Challenge 3: The "Call is Coming from Inside the House" (Networking)
*   **Issue:** The app running inside Docker could not connect to **Ollama** (`localhost:11434`) or **LM Studio** (`localhost:1234`) running on the host Mac.
*   **Root Cause:** `localhost` inside a container refers to the container itself, not the host machine.
*   **Fix Part A (Infrastructure):** We added `extra_hosts` to `docker-compose.yml`:
    ```yaml
    extra_hosts:
      - "host.docker.internal:host-gateway"
    ```
    This maps `host.docker.internal` to the host machine's IP.

*   **Fix Part B (Code Intelligence):** We updated `proxy_server.js` with "Smart Failover" logic.
    *   The proxy first tries `localhost`.
    *   If that fails with `ECONNREFUSED`, it automatically retries using `host.docker.internal`.
    *   This allows the same code to work seamlessly both locally and inside Docker without manual configuration changes.

*   **Fix Part C (UI Control):** We added a "Docker Host Selection" feature in the Settings Modal, giving users manual control if the auto-detection needs an override.

## 4. Final State
The application is now fully containerized and robust.

*   **Command:** `docker-compose up -d --build`
*   **Status:** ✅ Fully Operational
*   **Features:**
    *   Full persistence of data.
    *   Seamless connection to host-based AI models (Ollama/LM Studio).
    *   Hot-reloading for development.
    *   Puppeteer support included.

## 5. Key Files Created/Modified
*   `Dockerfile`
*   `docker-compose.yml`
*   `.dockerignore`
*   `proxy_server.js` (Smart Proxy Logic)
*   `package.json` (Vite Host Flag)
*   `components/SettingsModal.tsx` (UI Controls)

---
*Rangers Lead The Way!* 🎖️

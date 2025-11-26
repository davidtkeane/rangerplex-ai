# RangerPlex Manual (v2.5.35)

Your field guide to every surface in RangerPlex. Use the quick links below to jump between sections. This doc is meant to stay in sync with the app UI; feel free to extend it as features ship.
> Doc policy: Keep this manual and the plan as the primary docs. Only add new docs when strictly necessary (e.g., per-feature deep dives).

## Quick Links
- [Orientation](#orientation)
- [Start a New Chat](#start-a-new-chat)
- [Getting Started](#getting-started)
- [Chat HQ](#chat-hq)
- [Models & Costs](#models--costs)
- [Shortcuts & Commands](#shortcuts--commands)
- [Study Tools](#study-tools)
- [Vision Mode & Holiday FX](#vision-mode--holiday-fx)
- [Kitty (Ranger Pet)](#kitty-ranger-pet)
- [Ranger Console (Terminal)](#ranger-console-terminal)
- [Canvas Board](#canvas-board)
- [Radio](#radio)
- [Win95 Retro Mode](#win95-retro-mode)
- [Notes & Sticky Notes](#notes--sticky-notes)
- [Backups, Sync, Export](#backups-sync-export)
- [Cloud Sync & Proxy](#cloud-sync--proxy)
- [LM Studio (Local AI with GUI)](#lm-studio-local-ai-with-gui)
- [OSINT & Security Tools](#osint--security-tools)
- [Model Training & Data Tools](#model-training--data-tools)
- [Security & Lock Screen](#security--lock-screen)
- [Auto-Update System](#auto-update-system)
- [Docker Support](#docker-support)
- [Settings Reference](#settings-reference)
- [Troubleshooting](#troubleshooting)
- [Glossary](#glossary)
- [Support & Contribute](#support--contribute)

---

## Ranger Console (Terminal)
> **New in v2.5.35:** A fully functional system terminal embedded right in your dashboard.

- **Access:** Click the **Console** button in the sidebar (or use the toggle).
- **Features:**
  - **Real Shell:** Connects directly to your system's shell (bash, zsh, or powershell).
  - **Matrix Theme:** Styled with a retro-futuristic green-on-black aesthetic.
  - **Bi-directional:** Type commands, run scripts, and see output in real-time.
  - **Smart Resize:** Automatically adapts to the panel size.
- **Usage:** Use it to run git commands, check system stats, or execute scripts without leaving RangerPlex.

## Canvas Board
> **Updated in v2.5.35:** Now with Infinite Canvas and Smart Backgrounds.

- **Infinite Canvas:** The board now dynamically resizes to fill your entire screen, no matter how you resize the window.
- **Tools:** Pen, Eraser, Highlighter (toggle via toolbar or keyboard shortcuts `P`, `E`, `H`).
- **Shortcuts:** `Ctrl+Z` (Undo), `Ctrl+Y` (Redo), `Ctrl+S` (Save PNG).
- **Backgrounds:** Choose from Blank, Grid, Lines, Dots, or Graph. The container background now seamlessly matches your board color.
- **Management:** Create multiple boards, switch between them, and delete old ones.


---

## Orientation
- **UI Layout:** Fixed left sidebar (tools + user controls), main chat area, bottom input area with command toggles, floating pet/radio/study widgets.
- **Themes:** Light, Dark, Tron, Matrix; many buttons adapt colors (copy pills, actions, selectors).
- **Autosave:** Runs continuously; save toast appears only after a quiet period. Data persists to IndexedDB and optional local server sync.

## Start a New Chat
1) Click **Start** on the welcome panel (or the plus/new session control if visible).  
2) Pick your model from the selector chip (top).  
3) Type your question; hit **Enter** to send (Shift+Enter for newline).  
4) Attach files if needed (up to 5) before sending.  
5) Use **/manual** anytime to reopen this guide; use the Back button to return to chat.

## Getting Started
1) Run the app (`npm run dev` + proxy server) per README install steps.  
2) Open `http://localhost:5173/` (or configured port).  
3) Create/select a user (avatar optional).  
4) Pick a model, type a message, hit Enter (Shift+Enter = newline).  
5) Explore the sidebar tools: Study, Notes, Canvas, Radio, Settings.

## Chat HQ
- **Message Actions:** Copy pill under every message; action bar on hover for copy, TTS, download, feedback, regenerate (AI only), make note.
- **Attachments:** Up to 5 files; images auto-preview; doc chunks enter RAG pipeline.
- **Grounding Sources:** Show below messages with numbered links for citations.
- **Generated Media:** Image gallery, audio player, artifact previews inline.
- **Stats:** Model name, latency, token counts under responses.

## Models & Costs
- **Model Selector:** Top bar chip (auto-hides if enabled). Supports Gemini, OpenAI, Claude, Ollama/local, Grok, Perplexity, etc.
- **Badges:** Vision, reasoning, speed, power markers (see README “The Intelligence”).
- **Costs:** Token cost hints shown in message stats; currency configurable.

## Shortcuts & Commands
- **Enter:** Send; **Shift+Enter:** New line.  
- **Slash Prompts:** Start typing `/` to auto-complete saved prompts.  
- **Special commands:**
  - `/imagine <prompt>` or natural "draw/generate" → Image generation.
  - `/imagine_all` → Multi-provider image generation.
  - `/pet` → Open Kitty widget. `/pet-chat <msg>` → Talk as/with Kitty.
  - `/scan <url>` → VirusTotal file scan.
  - `/privacy` → Privacy snapshot (public IP, ISP/ASN, coarse geo, and browser headers visible to sites).
  - `/company <name|reg_number> [country]` → Company registry lookup (legal name, status, officers, address). Defaults to UK Companies House; falls back to OpenCorporates for other countries.
  - `/trace <domain_or_ip>` → Traceroute hops (20-hop limit, single probe).
  - `/hash <hash>` → VirusTotal hash intelligence (VT key required).
  - `/certs <domain>` → Certificate Transparency lookup.
  - `/profile <target>` → AI-powered OSINT profiler (automated recon).
  - Typing `canvas` exactly opens Canvas Board.
- **OSINT Commands (Intelligence Gathering):**
  - **Infrastructure:** `/shodan <ip>` → Shodan port/service scan.
  - **Domain Recon:** `/whois <domain>`, `/dns <domain>`, `/subdomains <domain>`, `/certs <domain>`, `/reputation <domain>`.
  - **Network Intel:** `/geoip <ip>`, `/myip`, `/ipinfo <ip>`, `/iprecon <ip>`, `/reverse <ip>`, `/asn <asn/ip>`, `/trace <domain/ip>`.
  - **Port Scanning:** `/ports <ip_or_host> [ports]` → TCP scan (40 default ports; authorization required). `/nmap <target> [flags]` → Nmap network scanner (whitelisted flags only; TryHackMe-ready).
  - **Security Checks:** `/ssl <domain>`, `/headers <url>`, `/breach <email>`, `/hash <hash>`.
  - **Company Intel:** `/company <name|reg_number> [country]` → Company registry lookup (UK Companies House + OpenCorporates).
  - **Hardware:** `/mac <address>`, `/sys` → MAC vendor lookup and system info.
  - **Communications:** `/phone <number>`, `/email <address>`.
  - **Social Intel:** `/sherlock <username>` → Username search across 300+ platforms.
  - **Financial:** `/crypto <coin>`, `/wallet <btc_address>`.
  - **Digital Forensics:** `/exif <url>`, `/wayback <url>`, `/screenshot <url>`.
  - **Fun & Entertainment:** `/chuck` → Random Chuck Norris facts, `/joke` → Random jokes (programming, dad jokes, general humor).
- **Manual:** `/manual` opens the in-app manual overlay (Back button returns to chat).
- **Voice:** Mic toggle in input area; speech-to-text fills the box.
- **Copy Last Message:** Button under the chat input copies the most recent turn.
- **Study Clock keys:** Space (play/pause), R (reset), +/- (adjust time) where available.  
- **Model selector auto-hide:** Moves out of the way after idle (if enabled).

## Study Tools
- **Study Clock:** Floating timer with customizable durations, quick +/- buttons, work/break cycles, session stats. Saves sessions to IndexedDB and (optionally) sync.
- **Notes / Study Notes:** Send any message to notes via “Make Note” button; manage in Notes view.
- **/study Command:** Type `/study` to open the Study Clock instantly. AI replies with encouragement and keyboard shortcuts (Space: play/pause, R: reset, M: minimize). Also discoverable via `/help` (SYSTEM section) and `/help study` for full docs.
  - 🍅 Pomodoro mode (25/5) + custom timers
  - ⌨️ Shortcuts: Space, R, M
  - 📊 Today’s stats, 🔔 desktop notifications (where supported)
  - 💾 3-tier persistence (local + sync if enabled)

## Vision Mode & Holiday FX
- **Ranger Vision Mode:** Toggle to overlay special visuals; launch via sidebar/action.  
- **Holiday Mode:** Seasonal visual effects; cycle effects in Settings.  
- **Scanner Beam:** Optional header beam; can be toggled in Settings.

## Kitty (Ranger Pet)
- **Open/Close:** `/pet` command or sidebar toggle (if present).  
- **Behavior:** Short, warm replies; gains XP; mood tracking.  
- **Settings (Settings → General/Data tabs):**  
  - `petName`, `petAvatar`, `petVolume`, `happinessDecayRate`, `hungerIncreaseRate`, celebration effects.  
  - Cloud sync toggle applies to pet state.
- **Usage Tips:** Keep study sessions going to earn mood boosts; pet chat uses fast model by default.

## Canvas Board
- **Launch:** Sidebar Canvas button or type `canvas` in chat.  
- **Features:** Create boards, cards/nodes, save automatically.  
- **Sync:** Local IndexedDB; optional cloud sync broadcast.

## Radio
- **Player:** Bottom/side widget when enabled.  
- **Controls:** Play/pause, station list (e.g., Soma DEFCON), volume, minimize.  
- **Settings:** `radioEnabled`, `radioAutoPlay` (may be restricted by browsers), `radioVolume`, last station, theme-aware UI.
- **Tips:** If auto-play is blocked, click to start; minimized mode keeps playback with small controls.

## Win95 Retro Mode
- **What:** Retro-themed state (“Windows 95” flavor) persisted in IndexedDB; syncable.  
- **Access:** Trigger via easter egg (text containing “win95” or “window 95”); may surface UI/state changes.

## Notes & Sticky Notes
- **Notes:** In-app notes linked from messages.  
- **Sticky Notes (standalone):** `sticky_notes/sticky_notes.html` mini-app with save/export; runs locally/offline. Use “Save all” to download JSON, “Load” to restore.

## Backups, Sync, Export
- **Auto-backup:** Interval and location configurable (`./backups/` by default).  
- **Export All:** Settings modal Data & Tools tab. Downloads JSON snapshot with version tag.  
- **Export Current Chat:** Same tab; exports markdown.  
- **Purge All:** Full wipe (chats, settings, canvas, Win95 states, study sessions).  
- **Cloud Sync:** Toggle to sync chats/settings/canvas/pet/study via local server if running.  
- **Defaults:** Auto-backup interval 5 minutes; path `./backups/`.

## Cloud Sync & Proxy
- **Sync toggle:** Settings → Data & Tools; uses local sync server (`proxy_server.js`) if running.
- **CORS Proxy Health:** Settings test pings `${corsProxyUrl}/health`; ensure it's reachable.
- **Behavior:** Saves locally first, then syncs (non-blocking). If offline, data stays queued until connection resumes.

## LM Studio (Local AI with GUI)

RangerPlex v2.5.26 adds full support for **LM Studio**, a desktop application for running local LLMs with a user-friendly GUI. Run multiple local AI providers side-by-side (Ollama + LM Studio) or compare models across different machines.

### What is LM Studio?

LM Studio is a desktop app that lets you download, run, and chat with open-source AI models locally on your computer. Unlike Ollama (CLI-focused), LM Studio provides:
- **Graphical Interface:** Easy model browsing, download, and management
- **OpenAI-Compatible API:** Works with port 1234 (vs Ollama's 11434)
- **One-Click Server:** Start/stop server with GUI controls
- **Model Library:** Browse thousands of models from Hugging Face

### Quick Setup (7 Steps)

1. **Download LM Studio**
   - Visit https://lmstudio.ai/
   - Download for your OS (Mac, Windows, Linux)
   - Install and launch the app

2. **Download a Model**
   - Click "Discover" tab in LM Studio
   - Search for models (e.g., "mistral 7b", "deepseek", "gemma")
   - Click download button (models are several GB)
   - Wait for download to complete

3. **Load the Model**
   - After download, click the model in the "My Models" tab
   - Click "Load" button (this puts it in memory)
   - **IMPORTANT:** Loading is separate from downloading!

4. **Start the Server**
   - Click "Local Server" tab in LM Studio
   - Click "Start Server" button (green)
   - Verify it shows "Server running on port 1234"

5. **Configure RangerPlex**
   - Open Settings → LM Studio tab
   - Base URL should be: `http://localhost:3010/api/lmstudio`
   - Click "Test Connection" (should show green checkmark)
   - Click "Refresh Models" to sync available models

6. **Select Model**
   - Click "Save" in settings
   - Use model selector at top of chat
   - Choose your LM Studio model from dropdown
   - **Note:** Models auto-sync when you open LM Studio settings tab

7. **Start Chatting**
   - Type your message and hit Enter
   - LM Studio model will respond via local server
   - Check console for streaming responses

### Features & Benefits

**Why Use LM Studio?**
- ✅ **No Internet Required:** Run AI models 100% offline
- ✅ **Privacy First:** Your data never leaves your computer
- ✅ **Free Forever:** No API costs, no rate limits
- ✅ **GUI Management:** Easy model browsing and switching
- ✅ **OpenAI Compatible:** Drop-in replacement for OpenAI API
- ✅ **Dual AI Setup:** Run both Ollama and LM Studio simultaneously

**Dual Local AI Setup:**
Run both providers for maximum flexibility:
- **Ollama** (port 11434): CLI-focused, lightweight, scripting-friendly
- **LM Studio** (port 1234): GUI-focused, beginner-friendly, visual model browser

Both can run side-by-side on the same machine or different machines on your network!

### Settings Configuration

**Settings → LM Studio Tab:**
- **Base URL:** Proxy endpoint (default: `http://localhost:3010/api/lmstudio`)
  - Uses proxy to bypass CORS restrictions
  - Direct connection: `http://localhost:1234/v1` (may be blocked by browser)
- **Model ID:** Default model (e.g., `mistral-7b-instruct`)
- **Available Models:** Auto-synced from LM Studio server
  - Opens tab → automatically fetches models
  - Manual refresh: Click "Refresh Models" button
- **Test Connection:** Verifies server is running and models are loaded

**Model Selection:**
- Top bar model selector shows all available models
- LM Studio models appear with their full names
- Switch between OpenAI, Gemini, Ollama, and LM Studio models instantly
- Model routing: Automatic detection based on selected model

### Common Issues & Fixes

**Issue 1: Test Connection Fails**
- ❌ **Symptom:** Red X when clicking "Test Connection"
- ✅ **Fix:**
  1. Open LM Studio app
  2. Load a model (not just download—must click "Load")
  3. Click "Start Server" in Local Server tab
  4. Verify port 1234 shows "running"
  5. Click "Test Connection" again in RangerPlex

**Issue 2: "Ollama API Error" When Using LM Studio Model**
- ❌ **Symptom:** Select LM Studio model → get Ollama error
- ✅ **Fix:** This was a routing bug fixed in v2.5.26
  - Update to latest version
  - Model routing now checks both enum and model names
  - Should work automatically after update

**Issue 3: No Models in Dropdown**
- ❌ **Symptom:** Model selector is empty or shows placeholder models
- ✅ **Fix:**
  1. Open Settings → LM Studio tab (auto-syncs on open)
  2. Click "Refresh Models" button manually
  3. Verify LM Studio server is running
  4. Check that at least one model is loaded in LM Studio

**Issue 4: CORS Policy Error**
- ❌ **Symptom:** Browser console shows CORS policy blocked
- ✅ **Fix:** Use proxy URL instead of direct connection
  - Change base URL to: `http://localhost:3010/api/lmstudio`
  - Proxy adds CORS headers and enables browser access
  - Direct URL `http://localhost:1234/v1` will be blocked by browser security

**Issue 5: Connection Refused**
- ❌ **Symptom:** `ERR_CONNECTION_REFUSED` on port 1234
- ✅ **Fix:**
  1. Verify LM Studio server is actually running
  2. Check "Local Server" tab in LM Studio shows green status
  3. Test directly: Open `http://localhost:1234/v1/models` in browser
  4. Should return JSON with model list

**Issue 6: Server Running But No Response**
- ❌ **Symptom:** Green test but chat doesn't work
- ✅ **Fix:**
  1. Verify a model is LOADED (not just downloaded)
  2. Check LM Studio console for errors
  3. Try restarting LM Studio server
  4. Verify proxy server is running: `node proxy_server.js`

### Advanced Configuration

**Network Access (Optional):**
Access LM Studio from other devices on your network:
1. Find your local IP: `ifconfig | grep inet` (Mac/Linux) or `ipconfig` (Windows)
2. Update base URL: `http://YOUR_IP:3010/api/lmstudio`
3. Ensure firewall allows port 3010 and 1234
4. Test connection from remote device

**Model Parameters:**
Customize inference settings in Settings → Model Parameters:
- **Temperature:** Creativity (0.0 = focused, 1.0 = creative)
- **Max Tokens:** Response length limit
- **Top P:** Nucleus sampling (0.9 recommended)
- **Frequency Penalty:** Reduce repetition
- **Presence Penalty:** Encourage topic diversity

**Performance Tips:**
- Use quantized models (Q4, Q5) for better performance
- Larger models need more RAM (8B = 8GB, 13B = 16GB, 70B = 64GB+)
- GPU acceleration: LM Studio auto-detects and uses GPU when available
- Close other apps to free up memory for larger models

### Documentation & Support

**Detailed Guides:**
- **Setup Guide:** `docs/LM_STUDIO_SETUP_GUIDE.md`
  - Step-by-step setup with screenshots
  - Troubleshooting flowchart
  - Common error messages explained
  - Testing and verification steps

- **Technical Deep-Dive:** `docs/LM_STUDIO_INTEGRATION_SUMMARY.md`
  - Architecture overview
  - Files modified with line numbers
  - Bugs encountered and fixes applied
  - Testing results and lessons learned

**Comparison: Ollama vs LM Studio**

| Feature | Ollama | LM Studio |
|---------|--------|-----------|
| **Interface** | CLI (Terminal) | GUI (Desktop App) |
| **Port** | 11434 | 1234 |
| **API Format** | Custom JSON | OpenAI-Compatible |
| **Model Management** | `ollama pull <model>` | GUI download + load |
| **Best For** | Developers, scripting | Beginners, visual users |
| **Server Control** | `ollama serve` | GUI start/stop button |
| **Model Discovery** | Command line search | Visual model browser |

**Use Cases:**
- **Ollama:** Automation, scripts, CI/CD, headless servers, Docker containers
- **LM Studio:** Interactive use, model comparison, GUI preference, easier setup
- **Both:** Maximum flexibility—switch between providers based on task

### Tips & Best Practices

1. **Start Small:** Begin with 7B models (Mistral, Gemma) before trying larger models
2. **Monitor Resources:** Watch RAM/CPU usage in Activity Monitor/Task Manager
3. **Auto-Sync Models:** Open LM Studio settings tab to refresh model list automatically
4. **Test Connection:** Always test after loading new models or restarting server
5. **Dual AI:** Keep both Ollama and LM Studio running for different use cases
6. **Model Naming:** Use full model names from LM Studio (includes variant/quantization)
7. **Server Status:** Check LM Studio's "Local Server" tab shows green before chatting
8. **Proxy Required:** Browser security requires proxy—don't use direct localhost URL

**Tested Models:**
✅ DeepSeek R1 8B MLX (reasoning model)
✅ Mistral 7B Instruct (general purpose)
✅ Google Gemma 3 12B (chat)
✅ Nomic Embed v1.5 (embeddings)

## OSINT & Security Tools

RangerPlex includes a comprehensive OSINT (Open Source Intelligence) arsenal with **23 completed tools** covering domain recon, network intel, security audits, company registry intelligence, social reconnaissance, financial tracking, and digital forensics.

### Infrastructure & Network Intelligence
- **`/shodan <ip>`** - Query Shodan API for open ports, vulnerabilities, and services. Requires API key (Settings → Providers).
- **`/geoip <ip>`** - IP geolocation (city, region, country, ISP, timezone). No API key required.
- **`/myip`** - Display your public IP address and basic info.
- **`/ipinfo <ip>`** - Detailed IP information lookup.
- **`/iprecon <ip>`** - Complete IP reconnaissance (combines multiple intel sources).
- **`/ports <ip_or_host> [ports]`** - TCP port scanner. Default: 40 common ports. Custom: comma-separated list (up to 100). Shows open/closed/filtered status, latency, and service identification (28 services). **Authorization required!**
- **`/trace <domain_or_ip>`** - Traceroute to map network hops (20-hop limit, single probe per hop). Timeouts mid-path are common.
- **`/nmap <target> [flags]`** - Nmap network scanner for comprehensive port scanning and service detection. Perfect for TryHackMe, CTFs, and penetration testing. **Whitelisted flags only for security:**
  - `-A` - Aggressive scan (OS detection, version detection, script scanning, traceroute)
  - `-sV` - Service version detection
  - `-sC` - Default script scan (safe NSE scripts)
  - `-p-` - Scan all 65535 ports
  - `-p <ports>` - Scan specific ports (e.g., `-p 80,443` or `-p 1-1000`)
  - `-Pn` - Skip host discovery (treat host as online, useful for filtered targets)
  - `-T4` - Aggressive timing template (faster scans)
  - `-v` - Verbose output
  - **Examples:**
    - `/nmap 10.10.10.50` - Basic scan (top 1000 ports)
    - `/nmap 10.10.10.50 -A` - Aggressive scan with OS and version detection
    - `/nmap 10.10.10.50 -p-` - Scan all 65535 ports
    - `/nmap scanme.nmap.org -sV -sC` - Version detection + safe scripts
  - **Requirements:** Nmap must be installed (`brew install nmap` on Mac, `apt install nmap` on Linux)
  - **Security:** Only whitelisted flags are allowed; target sanitization prevents command injection
  - **Timeout:** 60 seconds per scan
  - **Output:** Structured table of open ports with service names, plus raw nmap output for advanced analysis

### Domain & DNS Reconnaissance
- **`/whois <domain>`** - Domain registration details (registrar, expiry, name servers, contact info).
- **`/dns <domain>`** - DNS record lookup (A, AAAA, MX, TXT, NS records).
- **`/subdomains <domain>`** - Discover subdomains via Certificate Transparency logs (crt.sh). Maps attack surfaces and finds hidden infrastructure.
- **`/certs <domain>`** - Enumerate issued SSL certificates from Certificate Transparency logs; highlights wildcards, issuers, and history.
- **`/reverse <ip>`** - Reverse DNS lookup. Find all domains hosted on an IP address. No API key required (HackerTarget API).
- **`/asn <asn_number or ip>`** - ASN (Autonomous System Number) lookup. Find all IP ranges (CIDR blocks) owned by organizations. Accepts ASN numbers (AS15169 for Google) or IP addresses. Returns organization name, network ranges, and routing info. No API key required (HackerTarget API).
- **`/trace <domain or ip>`** - Traceroute network path mapping. Discover routing path from your location to target, identify ISPs and intermediate hops. Shows hop number, IP address, hostname, and round-trip time (RTT). Handles timeouts and filtered hops gracefully. 20-hop limit with single probe per hop. No API key required (native CLI).
- **`/reputation <domain>`** - Check domain against Google Safe Browsing for malware, phishing, and threats. Protects 5+ billion devices. Requires API key (free tier: 10,000 requests/day).

### Privacy Snapshot
- **`/privacy`** - Shows what a website can learn from your first request: public IP, ISP/ASN, coarse geolocation, timezone, and the exact request headers your browser sent (User-Agent, Accept-Language, DNT, Referer, client hints). Helpful to validate VPN/proxy setups and header hardening.

### Company & Registry Intelligence
- **`/company <name|reg_number> [country]`** - Company registry lookup. Returns legal name, registration number, status (active/dissolved), incorporation date, registered address, SIC/industry codes, active officers, people with significant control (PSC), and last filing date. Defaults to UK Companies House; falls back to OpenCorporates for other countries. Specify country codes like `uk`, `us-de`, `ie`. Requires API key(s); results are flagged when sourced from fallback or partial data.

### Security Auditing
- **`/ssl <domain>`** - SSL/TLS certificate analysis (validity, expiry, issuer, cipher strength).
- **`/headers <url>`** - HTTP security header audit (HSTS, CSP, X-Frame-Options, XSS protection).
- **`/breach <email>`** - Check if email appears in data breaches (Have I Been Pwned API).
- **`/scan <url>`** - VirusTotal file/URL scan. Shows malicious/suspicious/harmless counts. Requires API key.
- **`/hash <hash>`** - VirusTotal hash intelligence (MD5/SHA1/SHA256/SHA512) with detection stats, filenames, and first/last seen. Requires API key.

### Social & Identity Intelligence
- **`/sherlock <username>`** - Search username across 300+ platforms (GitHub, Twitter, Instagram, etc.). Includes "Entrapment Filter" for false positive detection.
- **`/profile <target>`** - AI-powered OSINT profiler. Automated reconnaissance agent that orchestrates multiple tools.

### Hardware & System Info
- **`/mac <address>`** - MAC address vendor lookup (identifies device manufacturer).
- **`/sys`** - System information (OS, architecture, CPU, memory, uptime).

### Communications Intelligence
- **`/phone <number>`** - Phone number validation and lookup (country, carrier, line type). Uses NumVerify API (100 requests/month free).
- **`/email <address>`** - Email address validation and analysis.

### Financial Intelligence
- **`/crypto <coin>`** - Cryptocurrency price lookup (BTC, ETH, etc.) via CoinGecko API. No API key required.
- **`/wallet <btc_address>`** - Bitcoin wallet balance and transaction count via BlockCypher API.

### Digital Forensics
- **`/exif <url>`** - Extract EXIF metadata from images (GPS coordinates, camera model, software, timestamps).
- **`/wayback <url>`** - Internet Archive lookup. Find historical website snapshots, view past versions, track changes, recover deleted content. Returns total snapshots, years archived, and latest snapshot URL.
- **`/screenshot <url>`** - Capture live website screenshots using Puppeteer (headless Chrome). High-quality 1920x1080 resolution. Includes page metadata (title, dimensions, final URL). Perfect for evidence collection, change detection, and phishing documentation. No API key required.

### Fun & Entertainment 🥋
- **`/chuck`** - Get a random Chuck Norris fact from the legendary api.chucknorris.io database. Hand-curated Chuck Norris jokes with full source attribution. No API key required. Perfect for lightening the mood during intense OSINT sessions! Includes categories when available.
  - **Example:** `/chuck`
  - **Sources:** [api.chucknorris.io](https://api.chucknorris.io/), [GitHub](https://github.com/chucknorris-io/chuck-api), [Free Public APIs](https://www.freepublicapis.com/chuck-norris-jokes-api)
  - **Output:** Displays Chuck Norris fact with 🥋 icon, category (if available), and clickable source links

- **`/joke`** - Get a random joke from multiple curated joke databases. Features classic setup/punchline format with programming jokes, dad jokes, and general humor. No API key required. Perfect for long coding sessions!
  - **Example:** `/joke`
  - **Sources:** [Official Joke API](https://official-joke-api.appspot.com/), [GitHub](https://github.com/15Dkatz/official_joke_api), [icanhazdadjoke](https://icanhazdadjoke.com/api)
  - **Output:** Displays joke with 😂 icon in setup/punchline format, category (when available), and clickable source links
  - **Categories:** Programming, general, dad jokes, and more

### Tool Integration
- **Type `/help <command>`** for detailed docs on any tool (e.g., `/help shodan`, `/help screenshot`).
- **The Profiler (`/profile`)** automatically runs multiple tools and generates comprehensive reports.
- **Tool Chaining:** Many tools suggest complementary commands for deeper analysis (e.g., `/shodan` suggests `/geoip`, `/ssl`, `/reputation`).

### Security & Legal Notes
- **Authorization Required:** `/ports`, `/shodan`, and other network scanning tools should only be used on systems you own or have explicit permission to test.
- **API Keys:** Some tools require free API keys (configurable in Settings → Providers): Shodan, Google Safe Browsing, VirusTotal, NumVerify.
- **Rate Limits:** Free tier limits apply to most APIs. Paid plans available for higher volume.
- **Audit Guides:** See `help-files/BROWSER_AUDIT_README.md` for storage cleanup and key safety best practices.

## Model Training & Data Tools
- **Location:** Settings → Data & Tools tab.  
- **Training:** Launch model training from this tab (moved off sidebar).  
- **Data Tools:** Export current chat, export all data, purge all, check storage stats.

## Security & Lock Screen
- **Lock Screen:** Enable/disable lock; set security mode (e.g., “hacker”).  
- **Tip:** Use lock for shared machines; verify holiday/effects do not expose sensitive UI.

## Auto-Update System
RangerPlex v2.5.25 introduces one-click automatic updates directly from the Settings panel.

### How to Update
1. **Open Settings** → Navigate to "General" or "System Updates" section
2. **Check for Updates** → Click the "Check for Updates" button
3. **View Latest Version** → See the latest commit from GitHub (version hash, date, commit message)
4. **Install Update** → Click the green "Install Update" button
5. **Wait for Completion** → Progress indicator shows "Installing..." with spinner
6. **Restart if Needed** → Follow the on-screen instructions to restart the proxy server

### What Happens During Update
- **Git Pull**: Automatically runs `git pull origin main` to fetch latest code
- **Dependency Check**: Detects if `package.json` changed
- **Auto Install**: Runs `npm install` if dependencies were updated
- **Status Reports**: Shows real-time progress and detailed results
- **Smart Restart**: Only prompts for restart when necessary

### Update Scenarios
1. **Already Up to Date**:
   - Message: "Already up to date"
   - No restart required
   - Continue using the app normally

2. **Code Changes Only**:
   - Message: "Update successful!"
   - Restart required: Stop proxy server (Ctrl+C), then restart: `node proxy_server.js`
   - Refresh browser after proxy restart

3. **Dependency Changes** (package.json modified):
   - Message: "Update successful! Dependencies installed."
   - Auto-runs `npm install`
   - Restart required (as above)

4. **Update Failed**:
   - Shows detailed error message
   - Common causes: Merge conflicts, network issues, git permissions
   - Manual intervention may be needed (see Troubleshooting)

### Safety Features
- **2-Minute Timeout**: Operations automatically timeout after 2 minutes
- **Error Handling**: Detailed error messages for troubleshooting
- **No Data Loss**: Updates only affect code, not your data (stored in database)
- **Graceful Failures**: If update fails, your current version continues working

### Manual Update (Alternative)
If automatic update fails, you can still update manually:
```bash
cd /path/to/rangerplex-ai
git pull origin main
npm install  # Only if package.json changed
node proxy_server.js
```

### Troubleshooting Updates
- **"Git pull failed"**: May have local changes; stash or commit them first
- **"npm install failed"**: Try running `npm install` manually with error details
- **"Timeout"**: Network slow or large update; try manual update
- **Merge Conflicts**: Resolve conflicts manually, then push changes
- **Permission Denied**: Check git credentials and file permissions

**Tip:** Always ensure you're on the `main` branch before updating: `git branch` (should show `* main`)

## Docker Support
RangerPlex v2.5.33 introduces full Docker support, allowing you to run the entire application in a containerized environment.

### Quick Start
1.  **Install Docker:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Mac/Windows) or Docker Engine (Linux).
2.  **Run Command:** `docker-compose up -d --build`
3.  **Access:** Open `http://localhost:5173`

### Key Features
*   **Full Stack Container:** Runs Frontend, Backend, Database, and Puppeteer in one box.
*   **Data Persistence:** Database and backups are saved to your local `./data` and `./backups` folders.
*   **Local AI Support:** Connects seamlessly to Ollama and LM Studio running on your host machine.

### Connecting to Local AI (Ollama/LM Studio)
Docker containers are isolated, so they can't see `localhost` by default. We've solved this with **Smart Proxy Logic**:
1.  **Automatic Failover:** The app tries `localhost` first. If it fails (because it's in Docker), it automatically switches to `host.docker.internal`.
2.  **Manual Override:** Go to **Settings → Ollama/LM Studio** and use the "Docker Host Selection" radio buttons to force a specific connection type.

### Common Docker Commands
| Goal | Command |
| :--- | :--- |
| **Start/Update** | `docker-compose up -d --build` |
| **Stop** | `docker-compose stop` |
| **Restart** | `docker-compose restart` |
| **View Logs** | `docker logs -f rangerplex-ai` |
| **Clean Slate** | `docker-compose down` (Removes containers, keeps data) |

For a deep dive, see the [Docker Beginner's Guide](docs/docker/DOCKER_BEGINNER_GUIDE.md).

## Settings Reference
Key areas (see Settings modal):
- **General:** Theme, avatars, radio, save notifications (duration), autosave, celebration effects, Kitty basics.
- **Data & Tools:** Exports, purge, backups, save status notifications, cloud sync.
- **Providers:** API keys (Gemini, OpenAI, Claude, Grok, Perplexity, VirusTotal), test buttons.
- **Ollama:** Base URL, model pulls, loading effects.
- **LM Studio:** Base URL (proxy endpoint), model ID, available models (auto-sync), test connection, refresh models button.
- **Search:** Web toggle, depth/flash/deep flags defaults.
- **Prompts:** Saved prompt library with triggers.
- **Security:** Lock screen, modes.
- **Holiday/Visuals:** Holiday mode/effects, scanner beam.

## Troubleshooting
- **Radio won't auto-play:** Browser blocks; click to start.
- **Save toast sticks:** Fixed in v2.5.2; ensure save notifications enabled and duration reasonable.
- **Sync errors:** Check local proxy (`proxy_server.js`) is running; verify keys and CORS proxy health.
- **Better-sqlite3 issues:** Rebuild node modules per README if server fails to start.
- **Voice input errors:** Check mic permissions; retry toggle.
- **Vision/Holiday not showing:** Ensure effects toggles are on in Settings; heavy browsers may block animations.
- **Training not visible:** Go to Settings → Data & Tools; feature moved off sidebar.
- **Sticky Notes not saving:** Use "Save all" to export JSON; reload and "Load" to restore.
- **LM Studio not connecting:** Ensure model is LOADED (not just downloaded) and server is started; use proxy URL `http://localhost:3010/api/lmstudio`; test with `http://localhost:1234/v1/models` in browser. See [LM Studio section](#lm-studio-local-ai-with-gui) for detailed fixes.
- **LM Studio "Ollama API Error":** Fixed in v2.5.26; update to latest version for proper model routing.
- **LM Studio models not syncing:** Open Settings → LM Studio tab (auto-syncs) or click "Refresh Models" button; verify server is running with loaded model.

## Support & Contribute
- **Buy Me a Coffee:** https://buymeacoffee.com/davidtkeane  
- **Bitcoin:** Scan the QR in Settings → About (uses `image/bitcoin.png`).  
- **Contribute:** Star the repo, open issues, and submit PRs to improve RangerPlex.

## Glossary

### General Terms
- **Canvas Board:** Visual board for notes/ideas.
- **Study Clock:** Pomodoro-style timer with history.
- **Kitty (Ranger Pet):** Gamified companion with XP/mood.
- **RAG:** Retrieval-Augmented Generation; uses document chunks.
- **Grounding Sources:** Cited sources for AI answers.
- **Autosave Service:** Debounced save queue that writes to IndexedDB and syncs.
- **Cloud Sync:** Optional local server sync for multi-session persistence.

### Local AI Terms
- **LM Studio:** Desktop application for running local LLMs with GUI. OpenAI-compatible API on port 1234.
- **Ollama:** Command-line tool for running local LLMs. Custom API on port 11434.
- **Local LLM:** Large Language Model running on your computer (no internet required).
- **Model Loading:** Process of loading a downloaded model into memory (separate from downloading).
- **OpenAI-Compatible API:** API that follows OpenAI's format (allows drop-in replacement).
- **Quantization:** Model compression technique (Q4, Q5, Q8) that reduces size and memory usage.
- **CORS Proxy:** Proxy server that adds CORS headers to enable browser access to local servers.
- **Streaming Response:** Real-time token-by-token output (Server-Sent Events).

### OSINT & Security Terms
- **OSINT:** Open Source Intelligence—gathering information from publicly available sources (WHOIS, DNS, social media, public databases, etc.).
- **Shodan:** Search engine for internet-connected devices. Finds open ports, vulnerabilities, and exposed services.
- **WHOIS:** Protocol for querying domain registration data (registrar, owner, expiry dates).
- **DNS (Domain Name System):** Translates domain names to IP addresses. Includes A, MX, TXT, NS records.
- **Certificate Transparency:** Public log of SSL certificates. Used to discover subdomains and track certificate issuance.
- **Reverse DNS (PTR):** Lookup that finds domain names associated with an IP address.
- **Port Scanner:** Tool that probes TCP/UDP ports to identify open services and potential vulnerabilities.
- **SSL/TLS:** Secure Sockets Layer / Transport Layer Security. Encrypts web traffic (HTTPS).
- **EXIF Metadata:** Embedded data in images (GPS coordinates, camera model, timestamps, software).
- **MAC Address:** Hardware identifier for network devices. First 6 digits identify the manufacturer.
- **IP Geolocation:** Mapping IP addresses to physical locations (city, country, ISP).
- **Safe Browsing API:** Google's database of malicious websites (malware, phishing, unwanted software).
- **Wayback Machine:** Internet Archive's historical snapshot database of websites.
- **Puppeteer:** Headless Chrome automation library. Used for screenshot capture and web scraping.
- **VirusTotal:** Malware scanning service that aggregates 70+ antivirus engines.
- **Have I Been Pwned (HIBP):** Database of compromised accounts from data breaches.
- **Sherlock:** Username enumeration tool that searches across 300+ social media platforms.
- **Entrapment Filter:** False positive detection system that identifies fake username matches.
- **BlockCypher:** Blockchain API for cryptocurrency wallet lookups and transaction data.
- **NumVerify:** Phone number validation API (carrier, line type, country).
- **crt.sh:** Certificate Transparency log search engine for finding SSL certificates and subdomains.

---

### How to Extend This Manual
- Add new sections per feature; link using `[#heading-text]` anchors.  
- Keep version header aligned with `package.json`.  
- Mirror this markdown into an in-app Help page (render markdown or reuse sections).  
- Cross-link to README for install and to CHANGELOG for release history.  
- Keep docs lean: prefer updating this manual/plan instead of adding new files.  

### Suggested Improvements
- Add screenshots or small GIFs for Study Clock, Kitty, Canvas, and OSINT commands.  
- Inline glossary tooltips in-app that link back to this file’s anchors.  
- “Try it” buttons in the in-app mirror to prefill slash commands (/scan, /whois, /dns, /imagine).  
- Mini “skill quests” for students: timed Study Clock challenges, Kitty tips, and OSINT scavenger hunts.  
- Add a changelog link per section showing the release where the feature landed.

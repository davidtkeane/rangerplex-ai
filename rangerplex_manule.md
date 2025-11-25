# RangerPlex Manual (v2.5.20)

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
- [Canvas Board](#canvas-board)
- [Radio](#radio)
- [Win95 Retro Mode](#win95-retro-mode)
- [Notes & Sticky Notes](#notes--sticky-notes)
- [Backups, Sync, Export](#backups-sync-export)
- [Cloud Sync & Proxy](#cloud-sync--proxy)
- [OSINT & Security Tools](#osint--security-tools)
- [Model Training & Data Tools](#model-training--data-tools)
- [Security & Lock Screen](#security--lock-screen)
- [Settings Reference](#settings-reference)
- [Troubleshooting](#troubleshooting)
- [Glossary](#glossary)
- [Support & Contribute](#support--contribute)

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
  - `/hash <hash>` → VirusTotal hash intelligence (VT key required).
  - `/certs <domain>` → Certificate Transparency lookup.
  - `/profile <target>` → AI-powered OSINT profiler (automated recon).
  - Typing `canvas` exactly opens Canvas Board.
- **OSINT Commands (Intelligence Gathering):**
  - **Infrastructure:** `/shodan <ip>` → Shodan port/service scan.
  - **Domain Recon:** `/whois <domain>`, `/dns <domain>`, `/subdomains <domain>`, `/certs <domain>`, `/reputation <domain>`.
  - **Network Intel:** `/geoip <ip>`, `/myip`, `/ipinfo <ip>`, `/iprecon <ip>`, `/reverse <ip>`.
  - **Port Scanning:** `/ports <ip_or_host> [ports]` → TCP scan (40 default ports; authorization required).
  - **Security Checks:** `/ssl <domain>`, `/headers <url>`, `/breach <email>`, `/hash <hash>`.
  - **Hardware:** `/mac <address>`, `/sys` → MAC vendor lookup and system info.
  - **Communications:** `/phone <number>`, `/email <address>`.
  - **Social Intel:** `/sherlock <username>` → Username search across 300+ platforms.
  - **Financial:** `/crypto <coin>`, `/wallet <btc_address>`.
  - **Digital Forensics:** `/exif <url>`, `/wayback <url>`, `/screenshot <url>`.
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
- **CORS Proxy Health:** Settings test pings `${corsProxyUrl}/health`; ensure it’s reachable.  
- **Behavior:** Saves locally first, then syncs (non-blocking). If offline, data stays queued until connection resumes.

## OSINT & Security Tools

RangerPlex includes a comprehensive OSINT (Open Source Intelligence) arsenal with **19 completed tools** covering domain recon, network intel, security audits, social reconnaissance, financial tracking, and digital forensics.

### Infrastructure & Network Intelligence
- **`/shodan <ip>`** - Query Shodan API for open ports, vulnerabilities, and services. Requires API key (Settings → Providers).
- **`/geoip <ip>`** - IP geolocation (city, region, country, ISP, timezone). No API key required.
- **`/myip`** - Display your public IP address and basic info.
- **`/ipinfo <ip>`** - Detailed IP information lookup.
- **`/iprecon <ip>`** - Complete IP reconnaissance (combines multiple intel sources).
- **`/ports <ip_or_host> [ports]`** - TCP port scanner. Default: 40 common ports. Custom: comma-separated list (up to 100). Shows open/closed/filtered status, latency, and service identification (28 services). **Authorization required!**

### Domain & DNS Reconnaissance
- **`/whois <domain>`** - Domain registration details (registrar, expiry, name servers, contact info).
- **`/dns <domain>`** - DNS record lookup (A, AAAA, MX, TXT, NS records).
- **`/subdomains <domain>`** - Discover subdomains via Certificate Transparency logs (crt.sh). Maps attack surfaces and finds hidden infrastructure.
- **`/certs <domain>`** - Enumerate issued SSL certificates from Certificate Transparency logs; highlights wildcards, issuers, and history.
- **`/reverse <ip>`** - Reverse DNS lookup. Find all domains hosted on an IP address. No API key required (HackerTarget API).
- **`/reputation <domain>`** - Check domain against Google Safe Browsing for malware, phishing, and threats. Protects 5+ billion devices. Requires API key (free tier: 10,000 requests/day).

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

## Settings Reference
Key areas (see Settings modal):
- **General:** Theme, avatars, radio, save notifications (duration), autosave, celebration effects, Kitty basics.
- **Data & Tools:** Exports, purge, backups, save status notifications, cloud sync.
- **Providers:** API keys (Gemini, OpenAI, Claude, Grok, Perplexity, VirusTotal), test buttons.
- **Ollama:** Base URL, model pulls, loading effects.
- **Search:** Web toggle, depth/flash/deep flags defaults.
- **Prompts:** Saved prompt library with triggers.
- **Security:** Lock screen, modes.
- **Holiday/Visuals:** Holiday mode/effects, scanner beam.

## Troubleshooting
- **Radio won’t auto-play:** Browser blocks; click to start.  
- **Save toast sticks:** Fixed in v2.5.2; ensure save notifications enabled and duration reasonable.  
- **Sync errors:** Check local proxy (`proxy_server.js`) is running; verify keys and CORS proxy health.  
- **Better-sqlite3 issues:** Rebuild node modules per README if server fails to start.  
- **Voice input errors:** Check mic permissions; retry toggle.
- **Vision/Holiday not showing:** Ensure effects toggles are on in Settings; heavy browsers may block animations.  
- **Training not visible:** Go to Settings → Data & Tools; feature moved off sidebar.  
- **Sticky Notes not saving:** Use “Save all” to export JSON; reload and “Load” to restore.

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

# 🚀 RangerPlex Changelog

All notable changes to the **RangerPlex Browser** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.13.7] - 2025-11-29 📁 AI WORKSPACE

### 📁 MCP Filesystem Workspace (NEW!)
- **AI File Access**: Models can now read/write files in a sandboxed workspace
- **Workspace Directory**: `/rangerplex-ai/workspace/` with subdirectories:
  - `projects/` - AI-assisted project files
  - `uploads/` - Files for AI processing
  - `temp/` - Temporary files
  - `shared/` - Persistent shared files

### 🛠️ 11 Filesystem Tools Available
| Tool | Description |
|------|-------------|
| `read_file` | Read file contents |
| `write_file` | Create/overwrite files |
| `edit_file` | Line-based text edits |
| `list_directory` | View folder contents |
| `directory_tree` | Recursive tree view |
| `search_files` | Find files by pattern |
| `move_file` | Move/rename files |
| `create_directory` | Create folders |
| `get_file_info` | File metadata |
| `read_multiple_files` | Batch read |
| `list_allowed_directories` | Show accessible paths |

### 🔒 Security
- **Sandboxed**: AI can ONLY access `/workspace` folder
- **No Execution**: Cannot run scripts or programs
- **Read/Write Only**: Safe file operations within bounds

### 📦 Version
- Bumped version to **2.13.7**

---

## [2.13.6] - 2025-11-29 🎧 PODCAST UI POLISH

### 🎨 UI Improvements
- **CyberSec Podcast Hub**: Fixed floating player positioning
  - Player now floats **above** the news ticker (respects bottom offset)
  - Aligned horizontally with Ranger Radio (2rem gap) for a clean, side-by-side layout
  - Prevents UI overlap when both radio and podcast player are active

### 📦 Version
- Bumped version to **2.13.6**

---

## [2.13.5] - 2025-11-29 🔍 SEARCH COMMANDS & MCP FIXES

### 🆕 New Search Commands
- **`/perplexity <query>`**: AI-powered web search using Perplexity's Sonar models
  - Streams results in real-time with citations
  - Uses configured model from Settings (default: sonar-pro)
  - Example: `/perplexity what is the best M3 Pro price`

- **`/ducky <query>`**: DuckDuckGo web search via MCP Docker gateway
  - Returns formatted search results with titles, URLs, and snippets
  - Uses configured results count from Settings
  - Example: `/ducky where is London`

### ⚙️ Enhanced Search Settings
New comprehensive search configuration in **Settings > Search**:

**Search Preferences:**
- **Default Search Provider**: Perplexity, Brave, DuckDuckGo, Google, Bing, Tavily
- **Perplexity Model**: Sonar, Sonar Pro, Sonar Reasoning, Sonar Reasoning Pro
- **Results Count**: 5, 10, 15, or 20 results
- **Safe Search**: Off, Moderate, Strict
- **Search Region**: US, GB, IE, CA, AU, DE, FR, ES, IT, JP, IN, BR
- **Search Language**: 11 languages supported

**Search Behavior Toggles:**
- Enable DuckDuckGo Fallback (via MCP)
- Enable Web Search for LLMs
- Show Source Links in Results
- Auto-Search on Questions

**Quick Commands Reference**: Handy reference box showing available search commands

### 🔧 Critical Bug Fixes

- **Docker MCP Tools Call**: Fixed stdin JSON parsing issue
  - Docker MCP uses `key=value` command arguments, NOT stdin JSON
  - Rewrote `/api/mcp/call` endpoint to convert JSON to key=value format
  - Added `getToolArgs()` helper for mapping plain text to tool arguments
  - All MCP tools now work correctly: search, brave_web_search, fetch, etc.

- **App Startup Crash**: Fixed Electron crash on `npm run browser`
  - Removed conflicting server startup from `launch_browser.cjs`
  - Electron now manages servers internally (prevents double-start conflicts)
  - MCP Gateway auto-starts 8 seconds after Electron boots

- **Port Cleanup**: Added MCP gateway port (8808) to cleanup list
  - Prevents port conflicts on restart

### 🚀 Launch Script Improvements
Updated `scripts/launch_browser.cjs`:
- Simplified startup sequence: Docker → Port cleanup → UI → MCP Gateway
- Removed server startup (Electron handles this)
- Added delayed MCP Gateway initialization
- Better console output showing startup progress

### 📦 Version
- Bumped version to **2.13.5**

---

## [2.13.4] - 2025-11-29 📡 RSS & UI POLISH

### 🆕 RSS Enhancements
- **Feed Order Control**: Added "Feed Order" setting in RSS configuration.
  - **Newest First**: Default behavior.
  - **Random Shuffle**: Mixes all feeds for variety (fixes "only malware" issue).
  - **Group by Topic**: Organizes ticker by category.
- **Robust Parsing**: Improved RSS parser to handle SSL errors and anti-bot protections.
  - Ignores self-signed/invalid certificates.
  - Uses browser-like User-Agent to bypass blocks.
  - Detailed error logging for broken feeds.

### 🔧 UI/UX Fixes
- **Settings Modal Z-Index**: Fixed issue where Settings Modal appeared behind the Sidebar.
  - Moved modal to root-level overlays for correct stacking.
- **RSS Visuals**:
  - Monochromatic "Zinc" theme for distraction-free reading.
  - Smooth scrolling animation (pixel-perfect speed calculation).
  - FontAwesome icons for categories.

### 🐛 Bug Fixes
- **Electron Startup Crash**: Fixed double-server startup conflict when running `npm run browser`.
  - Electron now checks if the server is already running before attempting to start it.

### 📦 Version
- Bumped version to **2.13.4** across all components.

---

## [2.13.3] - 2025-11-29 📝 NOTES SYNC & API FIXES

### 🔧 Fixed
- **Study Notes Hydration**: Notes now sync from server to browser on app load
  - Added `study_notes_${currentUser}` to hydration process in App.tsx
  - Notes stored on server are now restored to IndexedDB automatically
  - Console logs `📝 Restored study notes from server` on successful sync

- **Perplexity API Tester**: Fixed Advanced Tester for Perplexity
  - Added `perplexity` provider to `apiTestingService.testLLM()`
  - Uses `https://api.perplexity.ai/chat/completions` endpoint
  - Default model: `sonar-reasoning-pro`

- **Body Stream Error**: Fixed "body stream already read" error in API testing
  - Changed response handling to read as text first, then parse JSON
  - Prevents double-read of response body on parse failures

### 📦 Version
- Synced version across badge, package, server banner, sidebar, and DB metadata to **2.13.3**

---

## [2.13.2] - 2025-11-29 📡 RSS NEWS TICKER

### 🆕 New Features
- **Live RSS News Ticker**: TV-style scrolling news below chat
- **120 Pre-configured Feeds**: Pentesting, Malware, Forensics, News, Data Gov, Blockchain
- **Feed Manager**: Add/remove/test unlimited RSS feeds
- **Customizable Ticker**: Adjust speed, height, and behavior
- **Click to Import**: Import articles directly into chat
- **Category Badges**: Color-coded badges for each feed category
- **Auto-refresh**: Configurable refresh intervals (5-60 min)

### ⚙️ Settings
- New "RSS" tab in Settings
- Ticker speed control (1-10)
- Auto-refresh interval (5/10/15/30/60 min)
- Height selector (small/medium/large)
- Category filters
- Pause on hover toggle

### 📡 Supported Categories
- 🔒 Penetration Testing (20 feeds)
- 🦠 Malware Analysis (20 feeds)
- 🔍 Digital Forensics (20 feeds)
- 📰 Cybersecurity News (20 feeds)
- 🛡️ Data Governance (20 feeds)
- ⛓️ Blockchain & Crypto (20 feeds)

### 🔧 Technical
- Backend RSS parsing (Node.js) - Fixed browser incompatibility
- IndexedDB persistence
- CORS bypass via proxy
- Browser-compatible architecture

### 📦 Version
- Synced version across badge, package, server banner, sidebar, and DB metadata to **2.13.2**

---

## [2.13.1] - 2025-11-29 🎬 RANGERPLAYER FIX

### 🔧 Fixed
- **RangerPlayer Profile**: Fixed import error preventing Vite from compiling
  - Changed `setAutoplayEnabled` → `setAutoplayState` (correct export name)
  - Fixed `isAutoplayEnabled()` → `isAutoplayEnabled` (variable, not function)
  - Profile page now loads correctly with autoplay preferences

### 📦 Version
- Synced version across badge, package, server banner, sidebar, and DB metadata to **2.13.1**

---

## [2.13.0] - 2025-11-29 🎧 CYBERSEC PODCAST HUB

### 🎧 Podcast Hub Enhancements
- **New Governance Category**: Added Data Governance & Privacy category for NCI course alignment
  - Cyberlaw Podcast (privacy law with former NSA General Counsel)
  - Privacy Advisor Podcast (IAPP - GDPR, data protection)
  - She Said Privacy / He Said Security (compliance, risk management)
  - Data Protection Made Easy (GDPR simplified)

### 📻 Audio Improvements
- **New Podcasts**: Added 4 new pentesting/malware podcasts
  - Hacking Humans (social engineering - CyberWire)
  - Click Here (Recorded Future award-winning stories)
  - SANS StormCast (daily 5-min threat updates)
- **Feed Fixes**: Updated broken RSS feeds for Malicious Life and 7 Minute Security
- **Refresh Button**: Added manual refresh button in podcast header

### 💬 Chat Commands
- **New `/podcasts` Command**: Open Podcast Hub directly from chat
  - Also works with `/podcast` or `/radio`
  - Added to help catalog for discoverability

### 🎮 Easter Egg
- **Ranger Pic**: Play button shows ranger photo after 5s inactivity (matches Ranger Radio)

### 📦 Version
- Synced version across badge, package, server banner, sidebar, and DB metadata to **2.13.0**

---

## [2.12.9] - 2025-11-29 🐳 MCP PORT FIX

### 🔧 Fixed
- **MCP Docker Integration**: Fixed critical port mismatch preventing MCP servers from working
  - Updated Settings Modal MCP buttons (Start/Stop/Check Status) to use correct port 3000
  - Fixed App.tsx MCP auto-start to use dynamic proxy URL instead of hardcoded port 3010
  - Updated default `corsProxyUrl` and `lmstudioBaseUrl` from port 3010 to 3000
  - All MCP API calls now use `settings.corsProxyUrl` with fallback to port 3000

### 📚 Documentation
- Created comprehensive diagnostic report: `MCP_PORT_FIX_REPORT.md`
- Documented port architecture and testing procedures
- Added troubleshooting guide for common MCP issues

### ✅ Impact
- MCP gateway controls now fully functional in Settings → MCP tab
- Auto-start MCP feature works correctly on app launch
- All `/mcp-*` commands operational (brave_web_search, fetch, youtube_transcript, etc.)
- Eliminated "Failed to fetch" errors when using MCP tools

## [2.12.8] - 2025-11-29
### Changed
- **Port Migration**: Migrated backend server from port 3010 to **3000** for better compatibility and standard usage.
- **Frontend Updates**: Updated all frontend components (Settings, Chat, Radio, Terminal, Blockchain) to communicate with the new backend port 3000.
- **MCP Integration**: Verified and solidified Docker MCP integration on the new port.

## [2.12.7] - 2025-11-29 🛠️ MCP INTEGRATION COMPLETE

### 🐳 Docker MCP
- **Full Integration**: MCP tools (Brave, Fetch, YouTube, Obsidian) are now fully integrated with Gemini, Claude, Ollama, and OpenAI.
- **Smart Proxy**: Backend heuristics automatically wrap raw text inputs into JSON for common tools, simplifying model usage.
- **Model Awareness**: System prompts updated to make models aware of available tools and how to use them via slash commands.
- **Frontend Handler**: Added chat interface support for executing `/mcp` commands and displaying results.

### 📦 Version
- Synced version across badge, package files, server banner, sidebar, and DB metadata to **2.12.7**.

## [2.12.6] - 2025-11-29 🎉 OPENAI CATALOG + CELEBRATIONS

### 🤖 OpenAI Updates
- Added the new ChatGPT/GPT-5 + o-series models into defaults, badges, pricing placeholders, and live fetch filters.
- OpenAI test button now hits `/v1/models` and celebrates success with a confetti blast (toggleable).

### 🎨 Settings UX
- Providers tab gains an OpenAI Models catalog with descriptions, capability icons, and status badges.
- Confetti opt-out toggle relocated beside the Gemini Models controls for quick access.

### 📦 Version
- Synced version across badge, package files, server banner, sidebar, and DB metadata to **2.12.6**.

## [2.12.5] - 2025-12-04 🧭 MCP & HELP IMPROVEMENTS

### 🧭 MCP Experience
- Added a dedicated MCP settings tab (gateway URL, start/stop/status, auto-start toggle using stored keys).
- Improved status UX: connection errors show as “stopped” instead of generic errors; gateway auto-start/stop is handled when enabled.

### 🙋‍♂️ Help System
- Intelligent `/help` handles fuzzy topics/typos and returns concise, runnable examples for key commands.
- Expanded help catalog coverage (networking, MCP, weather, recon) with quick hints.

### 📦 Version
- Synced version across badge, package files, server banner, sidebar, and DB metadata to **2.12.5**.

## [2.12.3] - 2025-12-02 🛠️ WORDPRESS COMMAND CENTER UX

### 🎨 UI/UX
- WordPress Command Center buttons restyled to match the sidebar (neutral dark surfaces, FA icons), with cards aligned to sidebar visuals.
- Header shortcuts for WP Login, Admin, and Settings pick the best available site automatically.

### 🏎️ Behavior
- Browser overlay now reuses an existing tab when opening WordPress pages to prevent duplicates.
- Single-click guardrails on WordPress header buttons to avoid accidental double opens.

### 🔒 Guardrails
- Added small safety checks around WP actions to reduce accidental navigation and double submissions.

### 📦 Version
- Synced version across badge, package files, server banner, sidebar, and DB metadata to **2.12.3**.


## [2.12.2] - 2025-12-01 🛡️ CONTEXT GUARDRAILS

### 🚦 Safety
- Added configurable chat history caps (messages + characters) to keep all providers under token limits; defaults stay at 24 messages / ~120k chars but are now user-tunable in Settings → Params.

### 🛠️ Settings
- New “Conversation History Guardrails” controls in Params tab to set max messages and character cap per request.

### 🔧 Tech
- All provider routes (OpenAI/Anthropic/Perplexity/Gemini/Ollama/LM Studio/HF/Grok) now respect the new caps via a shared trimmer.

## [2.12.1] - 2025-11-29 🎨 WORDPRESS COMMAND CENTER POLISH


### ✨ UI Refresh
- WordPress Command Center now matches the sidebar styling (dark zinc base, cyan accents, glassy cards, refined status pills, and new RangerPlex header avatar).
- Buttons, cards, and loaders updated for a cohesive look; inline header loader keeps the page visible while data streams in.

### ⚡ Performance
- Docker status checks are batched into a single compose call and gated by a 3s timeout alongside site scanning to reduce spinner time.

### 🧹 Housekeeping
- Version synced across app: `package.json`, README badge, package-lock, and server banner now read **2.12.1**.
- Added `docs` to `.gitignore` (memory-system exception still allowed).

## [2.12.0] - 2025-11-28 🐳 DOCKER MCP INTEGRATION & BROWSER FIXES

### 🐳 Docker MCP Integration
- **Docker MCP Toolkit**: Fully integrated Model Context Protocol support
  - 310+ containerized MCP servers available in catalog
  - 6 servers pre-enabled (brave, dice, duckduckgo, fetch, obsidian, youtube_transcript)
  - 30 tools immediately available for use
  - Docker Desktop auto-start on `npm run browser` (all platforms)
- **Cross-Platform Auto-Start**: Automatic Docker Desktop launch
  - macOS: `open -a "Docker Desktop"`
  - Windows: Starts Docker Desktop.exe
  - Linux: systemctl/docker-desktop support
  - Smart detection with 20-second initialization wait
  - Graceful fallback if Docker unavailable
- **Comprehensive Documentation**:
  - `/Users/ranger/rangerplex-ai/help-files/DOCKER_MCP_MANUAL.md` - Complete guide (8.4KB)
  - `/Users/ranger/rangerplex-ai/help-files/DOCKER_MCP_QUICK_REF.md` - Quick reference (3.5KB)
  - Added to help-files INDEX.md with quick commands section
  - Accessible via `/manual` command in RangerPlex

### 🌐 Browser Improvements
- **Fixed Inception Loop**: Default browser URL changed from `localhost:5173` to `https://google.com`
  - Prevents RangerPlex loading inside itself
  - New setting: `defaultBrowserUrl` in Settings → Workspace
  - Configurable per-user preference
- **Fixed Layout Gap**: Eliminated 2-inch gap between sidebar and browser window
  - Removed unnecessary padding from tab bar
  - Removed background color from wrapper div
  - Browser now fills entire tab space seamlessly
- **Fixed Tab Close Button**: Exit button now works correctly
  - Added `e.preventDefault()` to prevent event bubbling
  - Proper state management when closing tabs
  - Smooth tab switching after close

### ⚙️ Settings Enhancements
- **New Browser Settings** (Settings → Workspace):
  - `defaultBrowserUrl` - Set default URL for new browser tabs
  - Prevents inception loop by avoiding localhost:5173
  - Persists across sessions via IndexedDB + server sync

### 🔧 Technical Improvements
- **Browser Component Updates**:
  - `BrowserLayout.tsx`: Added `defaultUrl` prop with default `https://google.com`
  - Proper prop passing from App.tsx to BrowserLayout
  - Fixed close button event handling
- **Launch Script Enhancement**:
  - `scripts/launch_browser.cjs`: New `ensureDockerRunning()` function
  - Cross-platform Docker detection and startup
  - Integrated into all launch modes (default, -t, -b)
- **Type Definitions**:
  - Added `defaultBrowserUrl: string` to `AppSettings` interface
  - Default value: `'https://google.com'` in `DEFAULT_SETTINGS`

### 📚 Documentation
- **README.md**: Updated version badge to 2.12.0
- **CHANGELOG.md**: This entry!
- **Help Files**: Docker MCP manual and quick reference added
- **Mission Complete**: `/Users/ranger/rangerplex-ai/DOCKER_MCP_MISSION_COMPLETE.md`

### 🎯 User Experience
- **Seamless Docker Integration**: No manual Docker startup needed
- **No More Inception**: Browser opens to Google instead of itself
- **Perfect Layout**: Browser fills entire tab space without gaps
- **Working Controls**: All browser buttons (close, new tab, navigate) functional
- **Persistent Settings**: Default URL preference saved across sessions

### 🔥 Benefits
- **310 MCP Servers**: Massive expansion of AI capabilities
- **Zero-Configuration**: Docker starts automatically
- **Better UX**: No more confusing inception loops
- **Clean Layout**: Professional browser experience
- **Cross-Platform**: Works on macOS, Windows, Linux

---

## [2.10.1] - 2025-11-28 🤠 THE LONE RANGER RADIO EASTER EGG

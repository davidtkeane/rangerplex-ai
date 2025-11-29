# 🚀 RangerPlex Changelog

All notable changes to the **RangerPlex Browser** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.12.4] - 2025-12-03 🧪 ADVANCED API TESTERS

### 🧪 Advanced API Testing Suite
- **Comprehensive Testing**: Added "Advanced" test buttons for all LLM and Search providers.
- **Detailed Diagnostics**: New `ApiTester` modal provides deep insights:
  - **Latency Metrics**: Track connection speed and response times.
  - **Raw JSON**: View full API response payloads for debugging.
  - **HTTP Status**: Clear success/error reporting with status codes.
- **New Providers**: Added support for **Google Search**, **Bing Search**, and **Tavily** in the Search settings tab.
- **Refactored Logic**: Centralized API testing logic in `apiTestingService` for consistency and reliability.
- **Local LLM Support**: Enhanced testing for **Ollama** and **LM Studio** with real connection checks.

### 🛠️ Fixes & Improvements
- **Type Safety**: Updated `AppSettings` interface to include all new API keys, removing temporary type casts.
- **Code Cleanup**: Removed duplicate functions and improved code organization in `SettingsModal.tsx`.
- **Version Sync**: Updated version to **2.12.4** across all system components.

## [2.12.3] - 2025-12-02 🌦️ WEATHER STATION 2.0

### 🌦️ Weather Station 2.0
- **Major Upgrade**: Weather Station completely overhauled with a new tabbed interface and 4-API fusion engine.
- **New Tabs**:
  - **📊 Dashboard**: Classic view with current conditions, API usage meters, and dynamic sky.
  - **📅 Forecast**: 15-day extended outlook powered by Visual Crossing.
  - **⏱️ Minutely**: "NowCast" precision rain intensity gauge powered by Tomorrow.io.
  - **📡 Radar**: Live Windy.com embed with rain, wind, and cloud layers.
  - **🕰️ History**: "Time Machine" to lookup past weather for any date (Visual Crossing).
  - **⚠️ Alerts**: Severe weather warnings and safety info (The "Guardian").
- **Smart Features**:
  - **Lazy Loading**: Tabs only fetch data when opened to save API calls.
  - **API Fusion**: Combines best-in-class data from OpenWeatherMap, Tomorrow.io, Visual Crossing, and Open-Meteo.

### 🛠️ Fixes & Improvements
- **Radar Button**: Fixed "Radar" button in rain notifications to correctly open the Weather Station's new Radar tab.
- **State Management**: Improved state handling for weather data to support the new multi-tab architecture.

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

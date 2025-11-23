# ⚔️ RangerPlex AI

> 🚀 Skip the bull and install right now: `bash install-me-now.sh`

<div align="center">

![Version](https://img.shields.io/badge/Version-2.4.3-cyan?style=for-the-badge)
![License](https://img.shields.io/badge/License-Ranger_License-green?style=for-the-badge)
![Stack](https://img.shields.io/badge/React-Vite-blue?style=for-the-badge)
![AI](https://img.shields.io/badge/Multi--Model-Gemini%20|%20OpenAI%20|%20Claude-purple?style=for-the-badge)

**The Ultimate Client-Side AI Research Station**

[Features](#-features) • [Prerequisites](#-prerequisites) • [Installation](#-installation) • [Running the App](#-running-the-app-mission-start) • [Data Persistence](#-data-persistence) • [Troubleshooting](#-troubleshooting)

</div>

---

## 🚀 Mission Briefing

**RangerPlex AI** is not just a chatbot. It is a **Command Center** for intelligence gathering, deep research, and creative generation. 

It runs locally on your machine (`localhost`), stores data privately in your browser **and** a local database, and connects to the world's most powerful AI models via a secure local server.

![RangerPlex Promo](./image/rangerplex_dall-e-3_1763935594087.png)

## ✨ Features

### 🧠 The Intelligence
*   **Multi-Model Matrix**: Seamlessly switch between **Gemini 2.0**, **GPT-4o/4.1**, **Claude Sonnet 4.5** (9 Claude models total including 3.5 Sonnet), **Perplexity**, **Grok**, and **Llama 3** (via HuggingFace or Ollama).
*   **Smart Model Selection**: Visual capability badges show what each model can do at a glance:
    - 👁️ **Vision** - Can analyze uploaded images (Claude 3+, Gemini, GPT-4o, Grok Vision)
    - 🧠 **Advanced Reasoning** - Deep thinking models (o1, o1-mini, o3-mini)
    - ⚡ **Fast Speed** - Quick responses (Haiku, Flash, Perplexity, local models)
    - 💎 **Most Powerful** - Maximum capabilities (Opus, Gemini Pro, o1/o3)
*   **The Council**: Assemble a team of AI Agents (The Researcher, The Skeptic, The Synthesizer) to debate and solve complex problems for you.
*   **Deep Research**: Autonomous agent loop that plans, searches the web, and writes academic-grade reports.

### 🛠️ The Tools
*   **RAG (Document Chat)**: Drag & Drop PDFs, DOCX, and Text files. The AI reads them instantly.
*   **Web Search Integration**: Toggle web search for LLMs with the 🌐 WEB button. Enable/disable automatic web search in Settings → Search tab.
*   **Ranger Lens**: A split-screen "Reader Mode" that strips ads from websites for distraction-free analysis.
*   **Code Interpreter**: Runs **Python** code directly in your browser using Pyodide to analyze data and generate charts.
*   **Live Artifacts**: Renders HTML/React code (games, dashboards) directly in the chat stream.
*   **Study Notes**: Inline note board with colors, priorities, due dates, pinning, and JSON import/export.

### 🎨 The Studio
*   **Image Generation**: Parallel generation using DALL-E 3, Imagen 3, and Flux.1.
*   **Cinematic Audio**: Integrated **ElevenLabs** support for Hollywood-quality voice responses.
*   **Newsroom Mode**: Auto-generates a script, thumbnail, and audio briefing on any topic.

### 🖼️ Understanding Image Features (IMPORTANT!)

RangerPlex has **TWO different image features** that work in completely different ways:

#### 1️⃣ Image GENERATION (Creating Images)
**Purpose**: Generate NEW images from text descriptions

**How to use**:
- Type `/imagine` followed by your description
- Example: `/imagine a futuristic city at sunset`
- Uses: **DALL-E 3, Imagen 3, or Flux.1** (dedicated image generators)
- **Note**: Your selected model (Grok, Claude, etc.) is **IGNORED** for `/imagine` commands

**Commands**:
- `/imagine <description>` - Generate with default provider (DALL-E 3)
- `/imagine_all <description>` - Generate with all providers (DALL-E 3, Imagen 3, Flux.1) for comparison

---

#### 2️⃣ Image ANALYSIS (Vision Models)
**Purpose**: Analyze EXISTING images with AI

**How to use**:
1. **Select a vision model** from dropdown (look for 👁️ badge):
   - Grok-3, Grok-2-Vision
   - Claude Sonnet 4.5, Claude 3.5, Claude Opus
   - Gemini models
   - GPT-4o, GPT-4.1
2. **Click the paperclip** 📎 button (bottom-left of input)
3. **Upload an image** (PNG, JPG, WebP, etc.)
4. **Ask about the image**: "What do you see?" or "Describe this image"
5. The selected vision model will analyze it

**Use cases**:
- Describe photos, screenshots, diagrams
- Extract text from images (OCR)
- Analyze charts, graphs, infographics
- Identify objects, people, scenes
- Answer questions about visual content

---

**⚠️ COMMON MISTAKE**: Selecting Grok-3 and typing `/imagine` will NOT use Grok to generate the image. `/imagine` always uses DALL-E/Imagen/Flux. To use Grok's vision, **upload an image** instead!

### 📻 Ranger Radio (NEW in v2.4.0)
*   **50+ SomaFM Stations**: Complete collection of commercial-free radio organized by genre.
*   **Focus-Friendly Music**: Ambient, LoFi, Electronic, Jazz, and more for deep work sessions.
*   **Floating Mini-Player**: Non-intrusive bottom-right player with minimize/maximize controls.
*   **Genre Categories**: Ambient (8), Electronic (9), Lounge (4), Rock (5), Metal (2), Jazz/Soul (2), World (3), Reggae (1), Holiday (5), Specials (5).
*   **Smart Streaming**: CORS proxy routes audio through local server for seamless playback.
*   **Persistent Settings**: Remembers your volume, last station, and player state.
*   **Theme Integration**: Adapts to Dark, Light, and Tron themes with matching effects.

### 💾 Triple-Layer Data Persistence (v2.2.0 - Enhanced in v2.4.2)
*   **IndexedDB** (Browser): Fast, local storage that survives page refreshes.
*   **SQLite** (Server): Persistent database that survives browser cache clears.
*   **File Export**: Auto-backup to JSON files every 5 minutes in `./backups/`.
*   **Auto-Sync Every 5 Minutes** (NEW in v2.4.2): Automatic synchronization of all chats and settings to server when cloud sync is enabled.
    - Runs immediately on app launch, then every 5 minutes
    - Syncs all chats, settings, and avatars from IndexedDB to SQLite
    - Updates last sync timestamp automatically
    - Only runs when cloud sync is enabled (Settings → Data & Backup)
*   **Manual Sync with Progress** (NEW in v2.4.2): Click "Sync Now" button in Settings → Data & Backup tab.
    - Beautiful gradient progress bar (teal-to-cyan with pulsing animation)
    - Real-time status: "Loading chats...", "Syncing chat 3/6...", "Sync complete!"
    - Shows percentage completion (0-100%)
    - Updates storage stats after completion
    - Saves last sync timestamp for reference
*   **Storage Stats** (NEW in v2.4.2): View actual storage usage in KB for both browser (IndexedDB) and server (SQLite) in Data & Backup tab.
*   **Instant Save for Critical Settings** (NEW in v2.4.2): Cloud Sync toggle and avatar uploads now save immediately without requiring Save button.
*   **Real-Time Sync**: WebSocket connection keeps browser and server in perfect sync.
*   **No Data Loss**: Even if you clear your browser cache, your data is safe in the server database.
*   **Rock-Solid Persistence**: Settings now save and load correctly with improved race condition handling.

### 🕶️ The Aesthetic
*   **Tron Theme ("The Grid")**: A glowing, animated 3D interface.
*   **Matrix Mode**: Digital rain overlay and "Operator" persona.
*   **Celebration Overlays**: Holiday Mode with Snow / Confetti / Sparkles plus inline rename sparkles (all toggles in Settings).
*   **Light/Dark Modes**: For day and night operations.

---

## 📦 Prerequisites

Before deploying RangerPlex, you need **Node.js**. This is the engine that runs the local server and the build system.

### 🪟 Windows
1.  Go to [nodejs.org](https://nodejs.org/).
2.  Download the **LTS (Long Term Support)** version.
3.  Run the installer. Keep clicking "Next" (Defaults are fine).
4.  **Verify**: Open "Command Prompt" or "PowerShell" and type:
    ```bash
    node -v
    npm -v
    ```
    *If you see version numbers, you are good to go.*

### 🍎 Mac (macOS)
**Option A: The Easy Way (Installer)**
1.  Go to [nodejs.org](https://nodejs.org/).
2.  Download the **macOS Installer (.pkg)**.
3.  Run it and follow the instructions.

**Option B: The Pro Way (Homebrew)**
1.  Open your Terminal (Command + Space, type "Terminal").
2.  Run:
    ```bash
    brew install node
    ```

### 🐧 Linux (Ubuntu/Debian)
Open your terminal and run:
```bash
sudo apt update
sudo apt install nodejs npm
```

---

## 💿 Installation

1.  **Download the Code**: Unzip the RangerPlex folder to a location of your choice (e.g., `Documents/RangerPlex`).
2.  **Open Terminal**: Open your Terminal/Command Prompt and navigate to that folder:
    ```bash
    cd path/to/RangerPlex
    ```
    *(Tip: You can type `cd ` and drag the folder into the terminal window).*

3.  **Install Dependencies**:
    Run this command to download all the necessary libraries (React, Vite, Express, SQLite, etc.):
    ```bash
    npm install
    ```

4.  **Configure API Keys** (Optional but recommended):
    Copy the example environment file and add your API keys:
    ```bash
    cp .env-example .env
    ```
    Then edit `.env` with your preferred text editor and add your API keys. See [API Key Configuration](#-api-key-configuration-env-file) for details.

---

## 🎮 Running the App (Mission Start)

### Quick Start (Recommended)
Run both the server and app with a single command:
```bash
npm start
```

This will start:
1. **RangerPlex Server** (Port 3010) - Database + WebSocket sync
2. **Vite Dev Server** (Port 5173) - The app interface

### Manual Start (Advanced)
If you prefer to run them separately:

#### Terminal 1: The Server (Database + Sync)
```bash
npm run server
```
✅ **Success:** You will see the RangerPlex Server banner with database path.

#### Terminal 2: The App (Interface)
Open a *new* terminal window/tab in the same folder.
```bash
npm run dev
```
✅ **Success:** You will see: `➜ Local: http://localhost:5173`

### 🚀 Launch
Open your web browser and go to: **[http://localhost:5173](http://localhost:5173)**

---

## 📻 Using Ranger Radio

**Quick Start:**
1. **Enable Radio**: Go to Settings (⚙️) → Radio tab
2. **Toggle ON**: Enable Radio Player
3. **Choose Station**: Select from 50+ channels organized by genre
4. **Adjust Volume**: Set your preferred volume level
5. **Save**: Click Save to remember your settings

**Features:**
- 📁 **Genre Categories**: Ambient, Electronic, Lounge, Rock, Metal, Jazz, World, Reggae, Holiday, Specials
- 🎵 **Popular Stations**: Groove Salad (ambient), DEF CON Radio (hacking), The Trip (trance), Metal Detector (metal)
- 🎛️ **Controls**: Play/pause, volume slider, station selector, minimize/maximize
- 💾 **Persistent**: Remembers your last station, volume, and player state
- 🎨 **Theme-Aware**: Adapts to Dark, Light, and Tron themes

**Floating Player:**
- Located in **bottom-right corner** of the screen
- **Minimize** to save space while coding
- **Maximize** to change stations or adjust volume
- **Close** to disable (re-enable in Settings)

---

## 💾 Data Persistence

RangerPlex uses a **triple-layer backup system** to ensure your data is never lost:

### 1. IndexedDB (Browser)
- **Location**: Your browser's local storage
- **Capacity**: Up to 50MB+
- **Survives**: Page refreshes, browser restarts
- **Cleared by**: Browser cache clear, incognito mode

### 2. SQLite Database (Server)
- **Location**: `./data/rangerplex.db`
- **Capacity**: Unlimited
- **Survives**: Browser cache clears, browser reinstalls
- **Cleared by**: Manual deletion only

### 3. File Backups
- **Location**: `./backups/RangerPlex_Backup_YYYY-MM-DD.json`
- **Frequency**: Auto-export every 5 minutes
- **Survives**: Everything (it's a file on your disk!)
- **Cleared by**: Manual deletion only

### 🔄 How Sync Works
1. You make a change (new chat, edit settings, upload avatar)
2. Change is saved to **IndexedDB** (instant)
3. Critical settings (Cloud Sync toggle, avatars) save immediately without requiring Save button
4. Change is sent to **Server** via WebSocket (real-time)
5. Server saves to **SQLite** database
6. Every 5 minutes, **Auto-Sync** runs (when cloud sync enabled):
   - Syncs all chats from IndexedDB to SQLite
   - Syncs all settings including avatars
   - Updates last sync timestamp
7. Every 5 minutes, server exports to **JSON file** (backup layer)

### 🗄️ Database Setup
**No installation required!** SQLite is embedded via npm package.

The database is automatically created at `./data/rangerplex.db` on first run.

**Multi-OS Support:**
- ✅ Windows
- ✅ macOS
- ✅ Linux

### 📦 Managing Your Data
Go to **Settings → Data & Backup** to:
- **Enable/Disable Cloud Sync**: Toggle automatic synchronization to server (auto-saves immediately)
- **Sync Now**: Manually trigger sync with beautiful progress bar showing real-time status
- **View Storage Stats**: See actual storage usage in KB for browser (IndexedDB) and server (SQLite)
- **Last Sync Time**: View when data was last synchronized to server
- **Export Data**: Download all data to a JSON file for backup
- **Import Backup**: Restore data from a previous backup file
- **Clear Browser Cache**: Remove local IndexedDB data (server data remains safe)
- **Wipe Server Database**: Delete all data from SQLite server (use with caution!)
- **Delete Backup Files**: Remove old JSON backup files from disk

### 🔑 API Key Configuration (.env File)
RangerPlex supports loading API keys from a `.env` file for convenience.

**Quick Setup:**
1. Copy the example file: `cp .env-example .env`
2. Open `.env` in any text editor
3. Fill in your API keys (see [Getting API Keys](#-getting-api-keys) below)
4. Restart the dev server (`npm start`)

**Location**: `.env` in the project root (git-ignored for security)

**Format** (must use `VITE_` prefix for Vite compatibility):
```bash
# Google Gemini (Free tier available)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI / ChatGPT (Paid only)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Anthropic Claude (Free tier available)
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Perplexity AI (Paid only)
VITE_PERPLEXITY_API_KEY=your_perplexity_api_key_here

# xAI Grok (Paid only - NO FREE TIER - Add credits first!)
VITE_GROK_API_KEY=your_grok_api_key_here

# Hugging Face (Free tier available)
VITE_HUGGINGFACE_ACCESS_TOKEN=your_huggingface_token_here

# Brave Search (Free tier available)
VITE_BRAVE_SEARCH_API_KEY=your_brave_search_api_key_here

# ElevenLabs (Text-to-Speech - Free tier: 10,000 chars/month)
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

**How it works:**
- Keys in `.env` are loaded as **defaults** (not saved to database)
- Keys entered in **Settings** override `.env` values
- The `.env-example` file includes comprehensive documentation with:
  - Links to get each API key
  - Free tier vs paid service information
  - Vite-specific configuration notes
  - Security best practices

**Important Notes:**
- **Vite Requirement**: All environment variables exposed to the client must start with `VITE_`
- **Access in code**: `import.meta.env.VITE_GEMINI_API_KEY`
- **Priority**: Settings > .env > Empty (keys in Settings override .env)
- **Security**: Never commit your `.env` file (it's in `.gitignore`)
- **Grok/xAI**: Requires purchasing credits first (NO FREE TIER)

---

## 🔑 Getting API Keys

RangerPlex connects to multiple AI providers. Here's how to get your API keys:

### 🤖 Claude (Anthropic)
1. Go to **[console.anthropic.com](https://console.anthropic.com)**
2. **Create Account** or **Sign In**
3. Click **"API Keys"** in the left sidebar (or go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys))
4. Click **"Create Key"**
5. Give it a name (e.g., "RangerPlex")
6. **Copy the key** immediately (you won't see it again!)
7. Paste it into RangerPlex Settings → **Anthropic API Key**

**Pricing**: Claude offers $5 free credits for new accounts. After that, pay-as-you-go pricing applies.

**Models Available**: Claude Sonnet 4.5, Haiku 4.5, Opus 4.1, and legacy models.

### 🔮 Gemini (Google AI)
1. Go to **[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select or create a Google Cloud project
5. **Copy the API key**
6. Paste it into RangerPlex Settings → **Gemini API Key**

**Pricing**: Generous free tier (1500 requests/day). Pay-as-you-go after limits.

### ⚡ OpenAI (GPT-4, ChatGPT)
1. Go to **[platform.openai.com/api-keys](https://platform.openai.com/api-keys)**
2. **Sign In** or create an account
3. Click **"Create new secret key"**
4. Give it a name and **copy the key**
5. Paste it into RangerPlex Settings → **OpenAI API Key**

**Pricing**: Pay-as-you-go. New accounts get $5 free credits (expires after 3 months).

### 🔍 Perplexity
1. Go to **[perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)**
2. Sign in or create an account
3. Click **"Generate API Key"**
4. Copy and paste into RangerPlex Settings → **Perplexity API Key**

### 🗣️ ElevenLabs (Voice Synthesis)
1. Go to **[elevenlabs.io](https://elevenlabs.io)**
2. Sign up or sign in
3. Go to **Profile → API Keys** or visit [elevenlabs.io/app/settings](https://elevenlabs.io/app/settings)
4. Copy your API key
5. Paste into RangerPlex Settings → **ElevenLabs API Key**

### 🤗 Hugging Face
1. Go to **[huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)**
2. Sign in or create account
3. Click **"New token"**
4. Give it a name and select **"Read"** access
5. Copy the token
6. Paste into RangerPlex Settings → **Hugging Face Access Token**

### 🦅 Grok (xAI)
1. Go to **[console.x.ai](https://console.x.ai)** (official xAI console)
2. Sign in with your **X/Twitter account**
3. Navigate to **API Keys** section (left sidebar)
4. Click **"Create API Key"** or **"New API Key"**
5. **Copy the key immediately** (shown only once!)
6. Paste into RangerPlex Settings → **Grok API Key** field
7. **IMPORTANT**: Add credits to your account (Billing tab) before using
   - xAI has **no free tier** - you must purchase credits first
   - Start with $5-$10 for testing

**Test your key**:
```bash
bash test-grok-api.sh
```

**Pricing** (pay-as-you-go):
- grok-3: ~$2-5 per 1M tokens
- grok-3-mini: ~$0.50-1 per 1M tokens

### 🔎 Brave Search (Web Search)
1. Go to **[brave.com/search/api](https://brave.com/search/api)**
2. Sign up for the API
3. Get your subscription token
4. Paste into RangerPlex Settings → **Brave Search API Key**

### 🦙 Ollama (Local AI - Optional)

**Ollama** enables privacy-first local AI models that run entirely on your machine. No API keys, no internet required, and your data never leaves your computer.

**Why Use Ollama?**
- 🔒 **100% Private** - All processing happens on your machine
- 💸 **Zero Cost** - No API fees, unlimited usage
- ⚡ **Offline Capable** - Works without internet
- 🎯 **Fast** - No network latency for responses
- 🧠 **Powerful Models** - Llama 3.3, DeepSeek, Mistral, and more

**Installation:**

#### macOS (Intel or Apple Silicon)
1. Go to **[ollama.com/download](https://ollama.com/download)**
2. Download the **.dmg** installer
3. Drag Ollama to Applications folder
4. Launch Ollama (menu bar icon will appear)
5. Open Terminal and run:
   ```bash
   OLLAMA_ORIGINS="*" ollama serve
   ```

#### Linux (Ubuntu/Debian/Fedora)
```bash
# One-line install
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama with CORS enabled
OLLAMA_ORIGINS="*" ollama serve
```

#### Windows
1. Go to **[ollama.com/download](https://ollama.com/download)**
2. Download the Windows installer
3. Run the installer
4. Open PowerShell and set environment variable:
   ```powershell
   $env:OLLAMA_ORIGINS="*"
   ollama serve
   ```

**Pulling Models:**
After installing Ollama, download models you want to use:
```bash
# Fast & efficient (recommended for most users)
ollama pull llama3.3:70b

# Coding specialist
ollama pull deepseek-coder:6.7b

# Fast local model
ollama pull mistral

# See all available models: https://ollama.com/library
```

**Using Ollama in RangerPlex:**
1. Make sure Ollama is running with `OLLAMA_ORIGINS="*"` set
2. In RangerPlex Settings → **Providers** tab
3. Set **Ollama URL** to `http://localhost:11434` (default)
4. Select your pulled model from the dropdown
5. Start chatting! Your data stays 100% local

**Troubleshooting:**
- **"Ollama isn't connecting"**: Make sure you started Ollama with `OLLAMA_ORIGINS="*"` environment variable
- **"Model not found"**: Pull the model first using `ollama pull <model-name>`
- **Slow responses**: Larger models (70B+) need powerful hardware; try smaller models like `mistral` or `llama3.3:8b`

**Note**: All API keys are stored **locally** in your browser and server database. They are never sent to us or any third party (except the respective AI providers when you make requests).

---

## ⚙️ Configuration

1.  Click the **Gear Icon** in the top right.
2.  **Providers Tab**: Enter your API Keys (see [Getting API Keys](#-getting-api-keys) above).
    *   *Note: API Keys are stored locally in your browser. They are never sent to us.*
3.  **Test Connection**: Click the "Test" button next to each API key to verify it works.
4.  **Proxy Check**: Ensure the "Proxy URL" is set to `http://localhost:3010` and click "Test". It should turn Green.

### 🚀 One-Command Install

You can set up everything with a single command:
```bash
bash install-me-now.sh
```
The installer will:
- Detect your OS and package manager (macOS/Linux/WSL)
- Ensure Node.js v22 via nvm (recommended) and install npm deps (`npm ci`)
- Guide you through API key entry (Brave, OpenAI, Anthropic, Perplexity, etc.) and write them to `.env`
- Show clear next steps to start the app

### ▶️ How to Start (Two Ways)

**Option 1 (RECOMMENDED):** Start everything with one command:
```bash
npm start
```
Runs BOTH servers (proxy + Vite) together. This is the correct command that starts everything you need.

**Option 2 (manual, if you prefer two terminals):**
```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```
Then open `http://localhost:5173`.

### 🧹 Uninstall
Clean up local artifacts without touching your repo:
```bash
bash uninstall-me-now.sh
```
You’ll be prompted before removing things like `node_modules`, `.env`, caches, or local data/backups.

### 🎵 Ranger Radio in Screensaver
While the screensaver is up, there’s a “Ranger Radio” button in the control bar to play/pause the floating radio player without leaving screensaver mode.

### 🪪 Registration Options (Concept)
We’re planning a lightweight registration flow (collect email, issue a code, show a “Registered” sticker). See `docs/registration_options.md` for approaches:
- Option A: In-app code (no email service)
- Option B: SMTP (nodemailer)
- Option C: Email API (SendGrid/Mailgun/SES/Postmark)
- Option D: Deferred/manual send
Pros/cons and data/UX notes are in that doc.

---

## ❓ Troubleshooting

### "I see a Black Screen!"
*   **Cause**: You might be opening the `index.html` file directly or using an old server.
*   **Fix**: Ensure you are using `npm run dev` to start the app. The app requires **Vite** to compile the TypeScript code.

### "Anthropic/Claude isn't working"
*   **Cause**: The Proxy Server isn't running.
*   **Fix**: Check **Terminal 1**. Ensure `node proxy_server.js` is running. In Settings, verify Proxy URL is `http://localhost:3010`.

### "Ollama isn't connecting"
*   **Cause**: Cross-Origin restrictions or Ollama not running.
*   **Fix**:
    1. Make sure Ollama is installed (see [Ollama Installation](#-ollama-local-ai---optional) above)
    2. Start Ollama with CORS enabled:
       - **Mac/Linux:** `OLLAMA_ORIGINS="*" ollama serve`
       - **Windows PowerShell:** `$env:OLLAMA_ORIGINS="*"; ollama serve`
    3. Verify Ollama is running: `curl http://localhost:11434` (should respond)
    4. Check Ollama URL in Settings → Providers is set to `http://localhost:11434`

### "Grok/xAI says 'Incorrect API key' (HTTP 400)"
*   **Cause**: The API key you entered is invalid or incorrect.
*   **Error**: `"Incorrect API key provided: xx***xx. You can obtain an API key from https://console.x.ai"`
*   **Fix**:
    1. Go to **[console.x.ai](https://console.x.ai)** (official xAI console)
    2. Sign in with your X/Twitter account
    3. Navigate to **API Keys** section (left sidebar)
    4. Click **"Create API Key"** (keys are shown only once when created)
    5. Copy the **entire key** (starts with `xai-`)
    6. Paste into RangerPlex Settings → Providers → **Grok API Key**
    7. Click **Save**
*   **Common mistakes**:
    - Copying only part of the key (keys are long!)
    - Extra spaces before/after the key
    - Using an old/expired key (keys expire after 90 days)
*   **Test your key**: Run `bash test-grok-api.sh` from project root

### "Grok/xAI says 'no credits' (HTTP 403)"
*   **Cause**: Your API key is valid, but your xAI account doesn't have credits yet.
*   **Error**: `"Your newly created teams doesn't have any credits yet"`
*   **Fix**:
    1. Go to **[console.x.ai](https://console.x.ai)**
    2. Click your team name (top right) → **Billing** or **Credits**
    3. Add a payment method
    4. Purchase credits (start with $5-$10 for testing)
    5. xAI uses pay-as-you-go pricing (~$0.50-$5 per 1M tokens depending on model)
*   **Test your key**: Run `bash test-grok-api.sh` from project root
*   **Note**: Unlike some APIs, xAI has **no free tier** - you must add credits to use the API

### "better-sqlite3 won't compile"
*   **Cause**: Using Node.js v25 (too new, experimental) or incompatible version.
*   **Fix**: Use Node.js v22 LTS (recommended, long-term support):
    ```bash
    # Option A: Using Homebrew (Mac)
    brew install node@22
    brew unlink node
    brew link --force node@22

    # Option B: Using nvm (Mac/Linux)
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    source ~/.zshrc
    nvm install 22
    nvm use 22

    # Reinstall dependencies
    cd path/to/RangerPlex
    npm install
    ```
    **Note**: Node v20 is deprecated (Oct 2026), v25 is not supported.

### "API keys disappeared after update"
*   **Cause**: Migration from localStorage to IndexedDB.
*   **Fix**: Your keys are safe! Either:
    - Re-enter them in Settings (they'll be saved to IndexedDB + Server)
    - Or add them to `.env` file (they'll auto-load as defaults)

---

## 🔧 Technical Details

### System Requirements
- **Node.js**: v22.x LTS (recommended)
  - ⚠️ Node v25 is not supported (too new, breaks better-sqlite3)
  - ⚠️ Node v20 is deprecated (Oct 2026, will be disabled)
  - ✅ Node v22 is stable and fully tested
- **npm**: v10.x or higher
- **OS**: Windows, macOS, or Linux

### Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + SQLite
- **Database**: better-sqlite3 (embedded, no installation)
- **Sync**: WebSocket (ws package)
- **Storage**: IndexedDB (idb package)

### File Structure
```
rangerplex-ai/
├── data/
│   └── rangerplex.db          # SQLite database (auto-created)
├── backups/
│   └── RangerPlex_*.json      # Auto-exported backups (every 5 min)
├── services/
│   ├── dbService.ts           # IndexedDB wrapper
│   ├── syncService.ts         # WebSocket sync client
│   └── ...                    # Other services
├── rangerplex_server.js       # Backend server (SQLite + WebSocket)
├── .env                       # API keys (gitignored)
├── vite-env.d.ts              # TypeScript env definitions
└── package.json               # Dependencies
```

### Data Flow
1. User action (new chat, edit settings, upload avatar)
2. Saved to **IndexedDB** (instant, browser)
3. Critical settings auto-save immediately (Cloud Sync toggle, avatars)
4. Sent to **Server** via WebSocket (real-time)
5. Server saves to **SQLite** database (persistent)
6. Every 5 minutes, **Auto-Sync** verifies all data is synchronized (chats, settings, avatars)
7. Every 5 minutes, server exports to **JSON file** (backup layer)

---

## 📜 License
RangerPlex is open shareware licensed under the **RANGER LICENSE**.

**Free for personal, educational, and non-profit use.** For commercial use or SaaS deployment, contact rangersmyth.74@gmail.com for revenue-sharing agreements.

See [LICENSE](./LICENSE) for full details.

*"Rangers Lead The Way!"* 🎖️

---

**Built by David Keane (IrishRanger) | iCanHelp Ltd**
*Transforming disabilities into superpowers - helping 1.3 billion people worldwide.*

---

## ☕ Support the Mission

If RangerPlex AI has helped you, consider supporting the development and mission to help 1.3 billion people with disabilities worldwide.

<div align="center">

<a href="https://buymeacoffee.com/davidtkeane" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" >
</a>

<a href="https://ko-fi.com/mrdavidkeane" target="_blank">
  <img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support on Ko-fi" style="height: 60px !important;width: 217px !important;" >
</a>

<a href="https://www.patreon.com/12521591/join" target="_blank">
  <img src="https://img.shields.io/badge/Patreon-Support%20the%20Mission-FF424D?style=for-the-badge&logo=patreon&logoColor=white" alt="Support on Patreon" style="height: 60px !important;" >
</a>

</div>

Every contribution helps keep the servers running and development moving forward! 🚀

**Support Options:**
- ☕ **Buy Me a Coffee** - One-time support for the project
- 💖 **Ko-fi** - Flexible support with one-time or monthly options
- 🎖️ **Patreon** - Become a monthly supporter and join the Ranger squad

**Other ways to contribute:**
- ⭐ Star the repo on GitHub
- 🐛 Report bugs and suggest features
- 📖 Contribute to documentation
- 💬 Share RangerPlex with others who could benefit

**Thank you for being part of the Ranger squad!** 🎖️

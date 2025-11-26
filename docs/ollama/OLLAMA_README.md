# 🦙 RangerPlex Ollama Setup Guide

## Quick Start (Local Setup - M3 Mac)

### Prerequisites
- Ollama installed ([https://ollama.ai](https://ollama.ai))
- RangerPlex running (`npm run dev`)
- At least one Ollama model installed

### Step 1: Install a Model

```bash
# Fast & capable (recommended)
ollama pull deepseek-r1:14b

# OR other popular models:
ollama pull qwen2.5:32b      # 20GB, very fast
ollama pull llama3.3:70b     # 40GB, very capable
ollama pull mistral:latest   # 4GB, lightweight
```

### Step 2: Configure RangerPlex

1. **Open RangerPlex Settings** (gear icon ⚙️)
2. **Click "Ollama" tab**
3. **Set Connection Settings:**

   **Ollama Base URL:**
   ```
   http://localhost:3010/api/ollama
   ```
   ⚠️ **Important:** Use the **proxy URL** (port 3010), NOT the direct Ollama URL (port 11434) to avoid CORS errors!

   **Ollama Model ID:**
   ```
   deepseek-r1:14b
   ```
   (Use the exact name from `ollama list`)

4. **Click "Test"** - Should show ✅
5. **Click "Save"**

### Step 3: Use It!

1. Create new chat
2. Select **"Local"** model from dropdown
3. Start chatting! 💬

---

## Advanced Setup (M4 + M3 - Network Mode)

If you have an M4 Max running Ollama and want to use it from your M3 Mac:

### On M4 Max (Server):
```bash
# Run the M4 setup script
./M4_OLLAMA_SETUP.sh

# Save the IP address shown (example: 192.168.1.30)
```

### On M3 Mac (Client):
```bash
# Run the M3 setup script
./M3_RANGERPLEX_SETUP.sh

# Enter M4's IP when prompted
# Restart RangerPlex
npm run dev
```

See **SETUP_GUIDE_M4_M3.md** for detailed instructions.

---

## Common Issues

### "Ollama API Error: Not Found"

**Cause:** Wrong Base URL or Model ID

**Fix:**
1. Check Ollama is running: `ollama list`
2. In RangerPlex settings, use proxy URL:
   ```
   http://localhost:3010/api/ollama
   ```
3. Use exact model name from `ollama list`
4. Click "Test" to verify

### "Connection Failed"

**Cause:** RangerPlex proxy not running

**Fix:**
```bash
# Make sure proxy is running on port 3010
lsof -i :3010

# If not running, start RangerPlex:
npm run dev
```

### "Model not appearing in dropdown"

**Cause:** Model not detected

**Fix:**
1. Verify model exists: `ollama list`
2. Restart RangerPlex after pulling new models
3. Check Ollama Base URL is correct

---

## Why Use the Proxy?

**Direct Ollama (❌ Doesn't Work):**
```
http://localhost:11434
```
- Browsers block this due to CORS
- Results in "Not Found" or "Connection Failed" errors

**Through Proxy (✅ Works!):**
```
http://localhost:3010/api/ollama
```
- RangerPlex proxy handles CORS
- Streams work properly
- No browser security issues

---

## Troubleshooting Commands

```bash
# List installed models
ollama list

# Test Ollama directly
curl http://localhost:11434/api/tags

# Test proxy
curl http://localhost:3010/api/ollama/tags

# Check what's running
ps aux | grep ollama
lsof -i :11434
lsof -i :3010

# Pull a new model
ollama pull qwen2.5:32b

# Test a model
ollama run deepseek-r1:14b "Hello!"
```

---

## Recommended Models

| Model | Size | Best For | Speed |
|-------|------|----------|-------|
| **deepseek-r1:14b** | 9GB | Reasoning, coding | ⚡⚡⚡ Fast |
| **qwen2.5:32b** | 20GB | General, fast | ⚡⚡⚡⚡ Very Fast |
| **llama3.3:70b** | 40GB | Most capable | ⚡⚡ Medium |
| **mistral:latest** | 4GB | Lightweight | ⚡⚡⚡⚡⚡ Blazing |

---

## Architecture

```
Browser (http://localhost:3000)
    ↓
RangerPlex UI
    ↓
Proxy Server (port 3010) ← Handles CORS
    ↓
Ollama (port 11434) ← AI models
    ↓
Your Model (e.g. deepseek-r1:14b)
```

---

## Need Help?

- Check the full guide: **SETUP_GUIDE_M4_M3.md**
- For network setup: **M4_OLLAMA_SETUP.sh** & **M3_RANGERPLEX_SETUP.sh**
- For database fix (if needed): **FIX_OLLAMA_DATABASE.sh**

---

**Happy local AI chatting!** 🦙💬

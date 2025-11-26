# 🚀 LM Studio Setup Guide for RangerPlex

**✅ TESTED & WORKING!** This guide has been verified with real-world testing!

---

## Quick Start (5 Minutes)

### Step 1: Install LM Studio
1. Download from: https://lmstudio.ai
2. Install on your Mac/PC
3. Open LM Studio application

### Step 2: Download a Model
1. In LM Studio, go to **"Search"** or **"Discover"** tab
2. Search for a model (recommendations below)
3. Click **"Download"** on your chosen model
4. Wait for download to complete

**Recommended Models:**
- **DeepSeek R1 8B** - Excellent reasoning (TESTED & WORKING!)
- **Mistral 7B Instruct** - Good balance of speed and quality
- **Llama 3 8B** - Fast and efficient
- **Phi-3 Mini** - Very fast, great for quick responses
- **Gemma 3 12B** - Great for general chat
- **DeepSeek Coder** - Excellent for coding tasks

### Step 3: Load the Model (CRITICAL!)
1. Go to **"Local Server"** or **"Developer"** tab
2. In the left sidebar, click on your downloaded model
3. Click **"Load Model"** button at the top
4. **Wait for the model to finish loading** (progress bar will show)
5. You'll see **"Model Loaded"** indicator when ready

⚠️ **IMPORTANT**: The model must be LOADED (in memory), not just downloaded!

### Step 4: Start the Server (CRITICAL!)
1. Look for **"Start Server"** button
2. **CLICK IT!** (Most common mistake is forgetting this step!)
3. Verify it says: `✅ Server running on http://localhost:1234`
4. Default port is **1234** (don't change unless needed)

⚠️ **CRITICAL**: Loading a model ≠ Starting the server! You need BOTH!

### Step 5: Configure RangerPlex (Using Proxy - RECOMMENDED)
1. Make sure RangerPlex proxy server is running (`npm start`)
2. Open RangerPlex in browser
3. Click **Settings** (gear icon)
4. Go to **"LMSTUDIO"** tab
5. Configure:
   - **Base URL**: `http://localhost:3010/api/lmstudio` ← **USE THIS (via proxy)**
   - **Model ID**: Leave as default or enter your model name
6. Click **"Test"** button
7. Should show **green checkmark ✓**

**Why Use Proxy?**
- ✅ Avoids CORS errors
- ✅ Works out of the box
- ✅ Same pattern as Ollama
- ✅ Enables network access

**Alternative (Direct Connection):**
- **Base URL**: `http://localhost:1234/v1`
- May cause CORS errors in browser
- Only use if you know what you're doing

### Step 6: Verify Models Auto-Sync
1. After clicking "Test" button successfully
2. Models should auto-populate in the dropdown
3. Or click **"Refresh Models from LM Studio"** button
4. Check browser console (F12) - should see: `✅ Auto-fetched X LM Studio model(s)`

### Step 7: Use LM Studio in Chat
1. Open any chat in RangerPlex
2. Click the **model selector** dropdown (top center)
3. Look for **"LM Studio"** section
4. Select your model (e.g., `deepseek-r1-0528-qwen3-8b-mlx`)
5. Type a message and hit send!
6. **IT WORKS!** 🚀

---

## Troubleshooting

### ❌ Error: "Failed to fetch" or "net::ERR_CONNECTION_REFUSED"

**Cause**: LM Studio server not running!

**Solution (The #1 Most Common Issue!):**
1. ✅ Open LM Studio app
2. ✅ Go to "Local Server" or "Developer" tab
3. ✅ **CLICK "START SERVER" BUTTON!** ← Most people forget this!
4. ✅ Wait for: `✅ Server running on http://localhost:1234`
5. ✅ Try RangerPlex Test button again

**Why This Happens:**
- Loading a model ≠ Starting the server!
- You need to do BOTH steps separately!

### ❌ Error: "Ollama API Error" When Using LM Studio Model

**Cause**: Model routing bug (now fixed!)

**Solution:**
1. ✅ Refresh RangerPlex (Ctrl+Shift+R or Cmd+Shift+R)
2. ✅ Make sure you saved settings after configuring LM Studio
3. ✅ Select the LM Studio model from dropdown again
4. ✅ Should now route correctly to LM Studio!

**This was fixed in v2.5.22** - model routing now checks the `availableModels.lmstudio` list!

### ⚠️ Error: CORS Policy Block (Direct Connection)

**Full Error:**
```
Access to fetch at 'http://localhost:1234/v1/models' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

**Cause**: Using direct connection instead of proxy

**Solution (Use Proxy!):**
1. ✅ Change Base URL to: `http://localhost:3010/api/lmstudio`
2. ✅ This routes through RangerPlex proxy (no CORS issues!)
3. ✅ Click Test button - should work now!

**Why Proxy?**
- Browsers block cross-origin requests for security
- Proxy lives on same origin as RangerPlex (no CORS!)
- This is the RECOMMENDED setup!

### ❌ Test Button Shows Red ❌ (But Server IS Running)

**Cause**: Using wrong URL or model not loaded

**Solution:**
1. Test server manually: Open browser tab → `http://localhost:1234/v1/models`
2. If you see JSON with models → Server is working!
3. In RangerPlex, use proxy URL: `http://localhost:3010/api/lmstudio`
4. If still red, check browser console (F12) for exact error

### 📋 Models Not Appearing in Dropdown

**Cause**: Models not auto-synced yet

**Solution:**
1. ✅ Go to Settings → LM Studio tab
2. ✅ Click **"Refresh Models from LM Studio"** button
3. ✅ Check browser console (F12) - should see: `✅ Auto-fetched X model(s)`
4. ✅ If empty array, make sure LM Studio server is running!

**Auto-Sync:** Models automatically sync when you open LM Studio tab in Settings!

### 🐌 Slow Response Times

**Cause**: Model too large for your hardware

**Solution:**
1. Try a smaller model (Phi-3 Mini, Mistral 7B)
2. In LM Studio, adjust "GPU Layers" (more = faster but needs more VRAM)
3. Check LM Studio's "Performance" settings
4. Close other applications to free up RAM

### 🔥 Error: Port 3010 Already in Use

**Cause**: RangerPlex proxy already running

**Solution:**
```bash
# Kill existing proxy
lsof -ti:3010 | xargs kill -9

# Restart RangerPlex
npm start
```

---

## Advanced Configuration

### Running on a Different Port

If port 1234 is in use:

1. In LM Studio, change server port (e.g., 5678)
2. In RangerPlex Settings:
   - Base URL: `http://localhost:5678/v1`

### Network Access (Multi-Device)

To access LM Studio from another computer:

1. In LM Studio, enable "Allow network access"
2. Note your computer's IP address (e.g., 192.168.1.100)
3. In RangerPlex (on other device):
   - Base URL: `http://192.168.1.100:1234/v1`

### Using Multiple Models

You can switch between models:

1. Load different models in LM Studio (one at a time)
2. In RangerPlex, change "Model ID" in settings
3. Or use the model selector dropdown in chat

---

## Comparison: Ollama vs LM Studio

| Feature | Ollama | LM Studio |
|---------|--------|-----------|
| **Interface** | Command-line | GUI |
| **Model Management** | `ollama pull model` | Click to download |
| **API** | Custom | OpenAI-compatible |
| **Model Switching** | Instant | Must reload |
| **Port** | 11434 | 1234 |
| **Best For** | Power users, automation | Beginners, visual users |

**Pro Tip**: Use BOTH! Run Ollama on your powerful M4 Max for heavy models, and LM Studio on your M3 Mac for lighter ones. RangerPlex can talk to both! 🚀

---

## Error Messages Explained

### "Cannot connect to server"
- LM Studio is not running
- Check if the app is open

### "Make sure a model is LOADED"
- Model downloaded but not loaded into memory
- Go to LM Studio and click "Load Model"

### "Invalid request"
- Usually means no model is loaded
- Verify model is fully loaded in LM Studio

### "Base URL is set to http://localhost:1234/v1"
- Reminder to check your URL includes `/v1` at the end
- Common mistake: using `http://localhost:1234` (missing `/v1`)

---

## Performance Tips

### For M4 Max (128GB RAM):
- Load larger models (13B, 34B, even 70B quantized)
- Use maximum GPU layers
- Enable Metal acceleration

### For M3 Mac:
- Stick to 7B-13B models
- Adjust GPU layers based on available RAM
- Use quantized models (Q4, Q5)

### For Battery Life:
- Use smaller models (Phi-3 Mini, 3B models)
- Reduce GPU layers
- Close LM Studio when not in use

---

## Recommended Workflows

### Coding Assistance:
1. Load: **DeepSeek Coder 6.7B**
2. Fast responses, excellent code understanding
3. Use with RangerPlex's RAG for your codebase

### General Chat:
1. Load: **Mistral 7B Instruct** or **Llama 3 8B**
2. Good balance of quality and speed
3. Works great with web search

### Quick Questions:
1. Load: **Phi-3 Mini**
2. Lightning fast responses
3. Perfect for simple tasks

### Heavy Reasoning:
1. Load: **DeepSeek R1** (if you have the RAM!)
2. Slower but much smarter
3. Great for complex problems

---

## Need Help?

1. Check LM Studio docs: https://lmstudio.ai/docs
2. Check RangerPlex Settings → LM Studio tab (yellow warning box)
3. Look at browser console (F12) for detailed errors
4. Test connection button should give specific feedback

**Rangers lead the way!** 🎖️

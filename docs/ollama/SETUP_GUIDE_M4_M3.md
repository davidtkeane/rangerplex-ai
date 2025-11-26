# 🎖️ RANGERPLEX + OLLAMA SETUP GUIDE
## M4 Max (Server) + M3 Mac (Client)

---

## OVERVIEW

**Your Setup:**
- **M4 Max (128GB RAM)** - Runs Ollama, serves AI models
- **M3 Mac** - Runs RangerPlex, connects to M4's Ollama

**Why this is AWESOME:**
- M4 Max runs the heavy AI models (40-70GB)
- M3 Mac gets full access to M4's power
- Both Macs can work independently
- Your M4 becomes an AI server for your whole network!

---

## QUICK START (2 Steps)

### ☕ Step 1: Setup M4 Max (Ollama Server)

**ON YOUR M4 MAX**, run:

```bash
cd "/path/to/rangerplex-ai"  # wherever you saved these files
chmod +x M4_OLLAMA_SETUP.sh
./M4_OLLAMA_SETUP.sh
```

This will:
1. Show your M4's IP address (SAVE THIS!)
2. Let you choose and install an AI model
3. Configure Ollama for network access
4. Test connections

**SAVE THE IP ADDRESS IT SHOWS YOU!** (Example: 192.168.1.30)

---

### ☕ Step 2: Setup M3 Mac (RangerPlex Client)

**ON YOUR M3 MAC**, run:

```bash
cd "/Users/ranger/Local Sites/rangerplex-ai"
chmod +x M3_RANGERPLEX_SETUP.sh
./M3_RANGERPLEX_SETUP.sh
```

This will:
1. Ask for your M4's IP address (from Step 1)
2. Test connection to M4
3. Configure RangerPlex to use M4's Ollama
4. Create reference files

Then restart RangerPlex:
```bash
npm run dev
```

**DONE!** Open RangerPlex and select "Local" model!

---

## DETAILED SETUP

### 🖥️ M4 MAX SETUP (Ollama Server)

#### What you need:
- M4 Max with macOS
- Ollama installed (https://ollama.ai)
- Connected to same network as M3

#### Steps:

1. **Transfer the setup script to M4:**
   ```bash
   # Option A: Use AirDrop
   # Send M4_OLLAMA_SETUP.sh to your M4

   # Option B: Use scp (if SSH enabled on M4)
   scp M4_OLLAMA_SETUP.sh username@m4-ip:~/

   # Option C: Use iCloud/Dropbox
   # Copy script to shared folder
   ```

2. **On M4, run the script:**
   ```bash
   cd ~/  # or wherever you saved it
   chmod +x M4_OLLAMA_SETUP.sh
   ./M4_OLLAMA_SETUP.sh
   ```

3. **Follow the prompts:**
   - It will show your M4's IP address - **WRITE THIS DOWN!**
   - Choose a model to install (recommend: qwen2.5:72b)
   - Wait for download (can be 20-40GB, takes 10-30 minutes)
   - Script will configure network access
   - Test connections

4. **Model Recommendations for M4 Max 128GB:**
   - **qwen2.5:72b** (40GB) - Best balance, FAST ⚡⚡⚡
   - **qwen2.5:32b** (20GB) - Maximum speed ⚡⚡⚡⚡
   - **deepseek-r1:70b** (40GB) - Best reasoning
   - **llama3.3:70b** (40GB) - Great general model

5. **Save this info:**
   ```
   M4 IP Address: ______________ (example: 192.168.1.30)
   Ollama URL: http://_______________:11434
   Models installed: ______________
   ```

---

### 💻 M3 MAC SETUP (RangerPlex Client)

#### What you need:
- M3 Mac with RangerPlex installed
- M4's IP address (from above)
- Both Macs on same WiFi network

#### Steps:

1. **Run the setup script:**
   ```bash
   cd "/Users/ranger/Local Sites/rangerplex-ai"
   chmod +x M3_RANGERPLEX_SETUP.sh
   ./M3_RANGERPLEX_SETUP.sh
   ```

2. **Enter M4's IP when prompted**
   - Example: `192.168.1.30`
   - Script will test connection
   - Shows available models on M4

3. **Script will configure RangerPlex:**
   - Updates `.env.local` file
   - Creates `M3_OLLAMA_CONFIG.txt` for reference
   - Tests connections

4. **Restart RangerPlex:**
   ```bash
   # Stop current dev server (Ctrl+C)
   npm run dev
   ```

5. **Use in RangerPlex:**
   - Open browser to RangerPlex (usually http://localhost:3000)
   - Create new chat
   - Select **"Local"** from model dropdown
   - Choose your M4 model (e.g., qwen2.5:72b)
   - Start chatting! 💥

---

## TESTING YOUR SETUP

### 🧪 Test 1: M4 Local Connection (on M4)
```bash
curl http://localhost:11434/api/tags
```
Should show list of installed models.

### 🧪 Test 2: M4 Network Connection (on M3)
```bash
# Replace with your M4's IP
curl http://192.168.1.30:11434/api/tags
```
Should show same model list.

### 🧪 Test 3: Chat Test (on M3)
```bash
curl http://192.168.1.30:11434/api/generate -d '{
  "model": "qwen2.5:72b",
  "prompt": "Hello from M3!",
  "stream": false
}'
```
Should return AI response.

### 🧪 Test 4: RangerPlex UI
1. Open RangerPlex in browser
2. New chat
3. Select "Local" model
4. Send message
5. Should see response from M4!

---

## TROUBLESHOOTING

### ❌ Problem: M3 can't connect to M4

**Solutions:**

1. **Check both on same WiFi:**
   ```bash
   # On M3, try ping
   ping 192.168.1.30  # (your M4 IP)
   ```

2. **Check M4 firewall:**
   - M4: System Settings > Network > Firewall
   - If ON, click "Options"
   - Add `/opt/homebrew/bin/ollama`
   - Allow incoming connections
   - OR turn firewall OFF for testing

3. **Verify M4 IP hasn't changed:**
   ```bash
   # On M4:
   ifconfig en0 | grep "inet "
   ```

4. **Check Ollama is running on M4:**
   ```bash
   # On M4:
   ollama list
   ps aux | grep ollama
   ```

5. **Restart Ollama on M4:**
   ```bash
   # On M4:
   launchctl unload ~/Library/LaunchAgents/com.ollama.server.plist
   launchctl load ~/Library/LaunchAgents/com.ollama.server.plist
   ```

---

### ❌ Problem: Model not showing in RangerPlex

**Solutions:**

1. **Verify model is on M4:**
   ```bash
   # On M4:
   ollama list
   ```

2. **Pull model if missing:**
   ```bash
   # On M4:
   ollama pull qwen2.5:72b
   ```

3. **Check .env.local on M3:**
   ```bash
   # On M3:
   cat .env.local | grep OLLAMA
   ```
   Should show: `NEXT_PUBLIC_OLLAMA_URL=http://192.168.1.30:11434`

4. **Restart RangerPlex:**
   ```bash
   # On M3:
   npm run dev
   ```

---

### ❌ Problem: Model too slow

**Solutions:**

1. **Use smaller/faster model:**
   ```bash
   # On M4:
   ollama pull qwen2.5:32b  # 20GB, much faster
   ```

2. **Check M4 isn't doing other heavy tasks:**
   - Check Activity Monitor on M4
   - Close other apps

3. **Monitor Ollama on M4:**
   ```bash
   # On M4:
   ollama ps  # shows what's running
   tail -f /tmp/ollama.log  # watch logs
   ```

---

## USEFUL COMMANDS

### On M4 Max (Server):

```bash
# List installed models
ollama list

# Pull a new model
ollama pull qwen2.5:72b

# Remove a model
ollama rm qwen2.5:72b

# Test a model
ollama run qwen2.5:72b "Test message"

# Check what's running
ollama ps

# View logs
tail -f /tmp/ollama.log

# Restart Ollama
launchctl unload ~/Library/LaunchAgents/com.ollama.server.plist
launchctl load ~/Library/LaunchAgents/com.ollama.server.plist

# Get M4 IP
ifconfig en0 | grep "inet " | awk '{print $2}'
```

### On M3 Mac (Client):

```bash
# Test connection to M4 (replace IP)
curl http://192.168.1.30:11434/api/tags

# Test chat
curl http://192.168.1.30:11434/api/generate -d '{
  "model": "qwen2.5:72b",
  "prompt": "Hello!"
}'

# Ping M4
ping 192.168.1.30

# Check RangerPlex config
cat .env.local | grep OLLAMA

# Restart RangerPlex
npm run dev
```

---

## MODEL PERFORMANCE ON M4 MAX 128GB

| Model | Size | Speed | Best For | Tokens/sec |
|-------|------|-------|----------|------------|
| qwen2.5:72b | 40GB | ⚡⚡⚡ | General + Fast | 20-25 |
| qwen2.5:32b | 20GB | ⚡⚡⚡⚡ | Maximum Speed | 40-50 |
| deepseek-r1:70b | 40GB | ⚡⚡ | Coding/Reasoning | 15-20 |
| llama3.3:70b | 40GB | ⚡⚡ | General Purpose | 15-20 |
| qwen2.5:14b | 9GB | ⚡⚡⚡⚡⚡ | Lightweight | 60-80 |

**Your M4 Max can run multiple 70B models simultaneously!** 💥

---

## ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────┐
│  M3 MAC (Client)                        │
│  ┌───────────────────────────────────┐  │
│  │  RangerPlex UI                    │  │
│  │  (Browser: localhost:3000)        │  │
│  │                                   │  │
│  │  User selects "Local" model       │  │
│  └───────────────┬───────────────────┘  │
│                  │                       │
│  ┌───────────────▼───────────────────┐  │
│  │  RangerPlex Proxy                 │  │
│  │  (Node.js: localhost:3010)        │  │
│  └───────────────┬───────────────────┘  │
└──────────────────┼───────────────────────┘
                   │
        WiFi Network (192.168.1.x)
                   │
┌──────────────────▼───────────────────────┐
│  M4 MAX (Server)                         │
│  ┌───────────────────────────────────┐   │
│  │  Ollama Server                    │   │
│  │  (Port: 11434)                    │   │
│  │                                   │   │
│  │  Models:                          │   │
│  │  - qwen2.5:72b (40GB)             │   │
│  │  - deepseek-r1:70b (40GB)         │   │
│  │  - etc...                         │   │
│  └───────────────────────────────────┘   │
│                                           │
│  RAM: 128GB (plenty for 70B models!)     │
│  Neural Engine: M4 Max beast mode! 💥    │
└───────────────────────────────────────────┘
```

---

## FILES CREATED

1. **M4_OLLAMA_SETUP.sh** - Run on M4 Max
2. **M3_RANGERPLEX_SETUP.sh** - Run on M3 Mac
3. **SETUP_GUIDE_M4_M3.md** - This file
4. **M3_OLLAMA_CONFIG.txt** - Created by M3 script (reference)
5. **.env.local** - Updated by M3 script (config)

---

## NEXT STEPS

1. ✅ Run `M4_OLLAMA_SETUP.sh` on M4 Max
2. ✅ Save M4 IP address
3. ✅ Run `M3_RANGERPLEX_SETUP.sh` on M3 Mac
4. ✅ Restart RangerPlex
5. ✅ Start chatting with M4 power!
6. 🚀 Add more models on M4
7. 🚀 Try different models for different tasks
8. 🚀 Build RangerOS with unlimited AI power!

---

## FREQUENTLY ASKED QUESTIONS

### Q: Can I use this from other devices too?
**A:** YES! Any device on your network can connect to `http://<M4-IP>:11434`

### Q: What if M4's IP changes?
**A:** Re-run `M3_RANGERPLEX_SETUP.sh` with new IP. Or assign M4 a static IP in router settings.

### Q: Can M4 still use Ollama locally?
**A:** YES! M4 can use Ollama at `http://localhost:11434` while serving to network.

### Q: How many models can M4 run at once?
**A:** With 128GB, you can run 2-3 x 70B models OR 5-6 x 32B models simultaneously!

### Q: Does this work with Claude too?
**A:** YES! RangerPlex supports Claude, OpenAI, Gemini, AND Ollama at the same time!

### Q: Will this slow down my M4?
**A:** Only when actively generating. Idle Ollama uses ~500MB RAM. Models load on-demand.

### Q: Can I access from outside my home network?
**A:** Advanced: Setup VPN or port forwarding. (Security considerations apply!)

---

## SECURITY NOTES

- Ollama is accessible on your local network only
- No authentication by default (local network trust model)
- For external access, use VPN for security
- Firewall controls access to port 11434

---

Rangers lead the way! 🎖️

**Your M4 Max is now a powerful AI server for your whole network!**

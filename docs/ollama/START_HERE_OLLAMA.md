# 🎖️ START HERE - OLLAMA SETUP FOR M4 + M3

---

## YOUR SITUATION:

✅ You have **M4 Max (128GB RAM)** - Currently pulling qwen model
✅ You have **M3 Mac** - Running RangerPlex
✅ You want M3's RangerPlex to use M4's AI power

**Perfect setup! Here's exactly what to do:**

---

## 2-STEP SETUP

### ☕ STEP 1: Setup M4 Max (as Ollama Server)

**Transfer M4_OLLAMA_SETUP.sh to your M4**, then on M4 run:

```bash
chmod +x M4_OLLAMA_SETUP.sh
./M4_OLLAMA_SETUP.sh
```

**IMPORTANT:** Write down the M4 IP address it shows! (e.g., 192.168.1.30)

---

### ☕ STEP 2: Setup M3 Mac (RangerPlex Client)

**On your M3 (where RangerPlex runs)**, run:

```bash
cd "/Users/ranger/Local Sites/rangerplex-ai"
chmod +x M3_RANGERPLEX_SETUP.sh
./M3_RANGERPLEX_SETUP.sh
```

Enter the M4 IP when asked. Then restart RangerPlex:

```bash
npm run dev
```

**DONE!** Open RangerPlex and select "Local" model! 🚀

---

## WHAT EACH SCRIPT DOES:

### M4_OLLAMA_SETUP.sh (Run on M4):
- Shows M4's IP address
- Lets you install AI models (qwen, deepseek, llama)
- Configures network access
- Tests connections
- Sets up LaunchAgent for auto-start

### M3_RANGERPLEX_SETUP.sh (Run on M3):
- Asks for M4's IP address
- Tests connection to M4
- Configures RangerPlex to use M4
- Updates .env.local file
- Creates reference config file

---

## FILES IN THIS DIRECTORY:

| File | Purpose | Where to Use |
|------|---------|--------------|
| **M4_OLLAMA_SETUP.sh** | Setup Ollama server | M4 Max |
| **M3_RANGERPLEX_SETUP.sh** | Configure RangerPlex | M3 Mac |
| **SETUP_GUIDE_M4_M3.md** | Complete guide | Read this! |
| **START_HERE_OLLAMA.md** | This file | Quick start |
| setup_ollama.sh | Old script | Ignore (for single-Mac setup) |
| OLLAMA_SETUP.md | Old docs | Ignore (for single-Mac setup) |
| OLLAMA_QUICK_START.md | Old docs | Ignore (for single-Mac setup) |

---

## RECOMMENDED MODELS FOR M4 MAX:

Since you're pulling qwen on M4, here are the best options:

| Model | Command | Size | Best For |
|-------|---------|------|----------|
| **qwen2.5:72b** | `ollama pull qwen2.5:72b` | 40GB | General + Speed ⚡⚡⚡ |
| **qwen2.5:32b** | `ollama pull qwen2.5:32b` | 20GB | Maximum speed ⚡⚡⚡⚡ |
| **deepseek-r1:70b** | `ollama pull deepseek-r1:70b` | 40GB | Coding/Reasoning |
| **llama3.3:70b** | `ollama pull llama3.3:70b` | 40GB | General purpose |

**M4 Max 128GB can handle 2-3 x 70B models at once!** 💥

---

## QUICK REFERENCE:

### How to transfer M4_OLLAMA_SETUP.sh to M4:

**Option 1: AirDrop**
- Drag `M4_OLLAMA_SETUP.sh` to AirDrop
- Select your M4 Max
- On M4, open Terminal where file was saved
- Run: `chmod +x M4_OLLAMA_SETUP.sh && ./M4_OLLAMA_SETUP.sh`

**Option 2: Shared Folder (iCloud/Dropbox)**
- Copy script to iCloud Drive or Dropbox
- On M4, open from shared folder
- Run in Terminal

**Option 3: USB Drive**
- Copy to USB drive
- Plug into M4
- Copy to Desktop
- Run in Terminal

---

## TESTING YOUR SETUP:

### After M4 setup, test on M4:
```bash
ollama list                           # Should show installed models
curl http://localhost:11434/api/tags  # Should work
```

### After M3 setup, test on M3:
```bash
# Replace 192.168.1.30 with YOUR M4 IP
curl http://192.168.1.30:11434/api/tags  # Should show models
```

### In RangerPlex:
1. Open browser (http://localhost:3000)
2. New chat
3. Select **"Local"** model
4. Choose qwen2.5:72b (or whatever model you installed)
5. Send a message - should get response from M4! 🎉

---

## TROUBLESHOOTING:

### Can't connect M3 to M4?
1. Both on same WiFi? `ping <M4-IP>`
2. M4 firewall? System Settings > Network > Firewall
3. Ollama running on M4? `ollama list` (on M4)

### Model not in RangerPlex?
1. Check model exists on M4: `ollama list` (on M4)
2. Check .env.local on M3: `cat .env.local | grep OLLAMA`
3. Restart RangerPlex: `npm run dev`

### Need help?
Read **SETUP_GUIDE_M4_M3.md** for detailed troubleshooting!

---

## CURRENT STATUS:

Based on your message:
- ✅ M4 Max: Pulling qwen model (in progress)
- ✅ M3 Mac: RangerPlex running
- ⏳ Next: Run M4_OLLAMA_SETUP.sh on M4 (after qwen finishes)
- ⏳ Next: Run M3_RANGERPLEX_SETUP.sh on M3

---

## YOUR NEXT ACTIONS:

1. **Wait for qwen to finish downloading on M4**

2. **On M4 Max**, run:
   ```bash
   ./M4_OLLAMA_SETUP.sh
   ```
   (Script will detect existing qwen, just configure network access)

3. **Save the M4 IP address** it shows you

4. **On M3 Mac**, run:
   ```bash
   ./M3_RANGERPLEX_SETUP.sh
   ```

5. **Restart RangerPlex**:
   ```bash
   npm run dev
   ```

6. **Test it!** Open RangerPlex, select "Local" model, chat away! 💥

---

Rangers lead the way! 🎖️

**Questions? Read SETUP_GUIDE_M4_M3.md for complete details!**

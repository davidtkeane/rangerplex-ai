# 🎖️ OLLAMA QUICK START GUIDE FOR RANGERPLEX

## TL;DR - 3 Step Setup:

```bash
# 1. Run the setup script
cd "/Users/ranger/Local Sites/rangerplex-ai"
./setup_ollama.sh

# 2. Restart your proxy server
npm run dev  # or however you start it

# 3. Access RangerPlex and select "Local" model
```

---

## SETUP OPTIONS:

### Option 1: Automatic Setup (RECOMMENDED)
```bash
./setup_ollama.sh
```
This script will:
- Show your M4 IP address
- Let you choose and pull a model
- Configure network access
- Test connections

### Option 2: Manual Quick Setup
```bash
# Pull a model (choose one):
ollama pull qwen2.5:72b       # 40GB, FAST (recommended)
ollama pull deepseek-r1:70b   # 40GB, reasoning
ollama pull qwen2.5:32b       # 20GB, faster

# Test it works:
ollama run qwen2.5:72b "Hello Ranger!"
```

---

## ACCESSING OLLAMA:

### 1. On M4 Max (Local):
**Direct to Ollama:**
```
URL: http://localhost:11434
```

**Through RangerPlex Proxy:**
```
URL: http://localhost:3010/api/ollama/
Headers: x-ollama-host: http://localhost:11434
```

### 2. From M3 Mac (Network):
First, get your M4's IP:
```bash
ifconfig en0 | grep "inet " | awk '{print $2}'
# Example output: 192.168.1.100
```

**Direct to M4's Ollama:**
```
URL: http://192.168.1.100:11434
```

**Through M4's RangerPlex Proxy:**
```
URL: http://192.168.1.100:3010/api/ollama/
Headers: x-ollama-host: http://localhost:11434
```

---

## TESTING CONNECTIONS:

### Test 1: Local Ollama on M4
```bash
curl http://localhost:11434/api/tags
```

### Test 2: Network Access from M3
```bash
# Replace with your M4's IP
curl http://192.168.1.100:11434/api/tags
```

### Test 3: Chat Test
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:72b",
  "prompt": "Say hello from Ranger!",
  "stream": false
}'
```

### Test 4: RangerPlex Proxy
```bash
curl http://localhost:3010/api/ollama/tags \
  -H "x-ollama-host: http://localhost:11434"
```

---

## USING IN RANGERPLEX UI:

### Configuration:
1. Open RangerPlex in browser
2. Start a new chat
3. Select **"Local"** model from dropdown
4. In settings, set Ollama URL to:
   - M4 Local: `http://localhost:11434`
   - From M3: `http://192.168.1.100:11434`

### Available Models in RangerPlex:
Once you've pulled models, they'll appear automatically.
RangerPlex uses the ModelType.LOCAL enum which maps to Ollama.

---

## PERFORMANCE EXPECTATIONS:

### M4 Max 128GB Performance:

| Model | Size | Tokens/sec | Response Time | RAM Usage |
|-------|------|------------|---------------|-----------|
| qwen2.5:72b | 40GB | 20-25 | Fast (2-3s first token) | ~45GB |
| deepseek-r1:70b | 40GB | 15-20 | Medium (reasoning intensive) | ~45GB |
| llama3.3:70b | 40GB | 15-20 | Fast | ~45GB |
| qwen2.5:32b | 20GB | 40-50 | VERY Fast (1s first token) | ~25GB |

**Your M4 Max is PERFECT for 70B models!** 💥

---

## TROUBLESHOOTING:

### Problem: Can't connect from M3
**Solutions:**
1. Check M4 firewall: System Settings > Network > Firewall
2. Verify M4 IP hasn't changed: `ifconfig en0 | grep inet`
3. Test ping from M3: `ping <M4_IP>`
4. Check Ollama is listening on network:
   ```bash
   lsof -i :11434
   ```

### Problem: Model too slow
**Solutions:**
1. Use smaller model: `ollama pull qwen2.5:32b`
2. Check RAM pressure in Activity Monitor
3. Close other heavy apps
4. Use quantized versions: `qwen2.5:14b-q4_0`

### Problem: Out of memory
**Solutions:**
1. Stop Ollama: `killall ollama`
2. Use smaller model: `qwen2.5:32b` (20GB) or `qwen2.5:14b` (9GB)
3. Check what's using RAM: Activity Monitor

### Problem: "Connection Failed" in RangerPlex
**Solutions:**
1. Verify Ollama is running: `ollama list`
2. Check proxy server is running: `lsof -i :3010`
3. Test direct connection: `curl http://localhost:11434/api/tags`
4. Check browser console for errors (F12)

### Problem: Model not appearing in RangerPlex
**Solutions:**
1. List models: `ollama list`
2. Pull model if missing: `ollama pull qwen2.5:72b`
3. Refresh RangerPlex
4. Check Ollama URL in settings

---

## USEFUL COMMANDS:

```bash
# List installed models
ollama list

# Pull a new model
ollama pull <model-name>

# Delete a model
ollama rm <model-name>

# Check running models
ollama ps

# Test a model
ollama run qwen2.5:72b "Test message"

# Check Ollama logs
tail -f /tmp/ollama.log

# Restart Ollama with network access
killall ollama
OLLAMA_HOST=0.0.0.0:11434 ollama serve

# Get M4 IP address
ifconfig en0 | grep "inet " | awk '{print $2}'

# Check what's using port 11434
lsof -i :11434

# Check RangerPlex proxy is running
lsof -i :3010
```

---

## NEXT STEPS:

1. **Try different models** - Each has unique strengths
2. **Benchmark on M4 Max** - Test your beast mode capabilities!
3. **Connect from M3** - Use M4's power remotely
4. **Integrate with RangerOS** - Build your AI-powered OS!

---

## MODEL RECOMMENDATIONS:

### For Coding & Reasoning:
- **deepseek-r1:70b** - Shows its thinking process, great for complex problems

### For General Chat & Speed:
- **qwen2.5:72b** - Best balance of speed and capability

### For Maximum Speed:
- **qwen2.5:32b** - Still powerful, much faster responses

### For Fun & Experimentation:
- **llama3.3:70b** - Meta's latest, very capable

---

Rangers lead the way! 🎖️

**Your M4 Max with 128GB RAM is a BEAST for running these models locally!**

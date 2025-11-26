# 🎖️ OLLAMA SETUP FOR RANGERPLEX

## Step 1: Pull a Model on M4 Max

Choose one of these commands:

```bash
# Best for reasoning and coding (40GB)
ollama pull deepseek-r1:70b

# Best for speed and general use (40GB)
ollama pull qwen2.5:72b

# Meta's latest (40GB)
ollama pull llama3.3:70b

# Faster option (20GB)
ollama pull qwen2.5:32b
```

## Step 2: Configure Ollama for Network Access

To allow M3 to connect to M4's Ollama:

### Option A: Environment Variable (Temporary)
```bash
# Stop Ollama
killall ollama

# Start with network access
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

### Option B: LaunchAgent (Permanent - RECOMMENDED)
Create file: `~/Library/LaunchAgents/com.ollama.server.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ollama.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/ollama</string>
        <string>serve</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>OLLAMA_HOST</key>
        <string>0.0.0.0:11434</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/ollama.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/ollama.error.log</string>
</dict>
</plist>
```

Then run:
```bash
launchctl unload ~/Library/LaunchAgents/com.ollama.server.plist 2>/dev/null
launchctl load ~/Library/LaunchAgents/com.ollama.server.plist
```

## Step 3: Find M4 Max IP Address

```bash
# Get your M4 IP address
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Example output: `inet 192.168.1.100` <- This is your M4's IP

## Step 4: Test from M3

From your M3 Mac:

```bash
# Replace 192.168.1.100 with your M4's IP
curl http://192.168.1.100:11434/api/tags

# Test chat
curl http://192.168.1.100:11434/api/generate -d '{
  "model": "qwen2.5:72b",
  "prompt": "Why is the sky blue?"
}'
```

## Step 5: RangerPlex Configuration

In your RangerPlex frontend, add Ollama as a model provider:

**Default Ollama URL (local M4):**
```
http://localhost:11434
```

**From M3 to M4:**
```
http://192.168.1.100:11434
```

## Performance Expectations on M4 Max 128GB:

| Model | Size | Speed (tokens/sec) | RAM Usage |
|-------|------|-------------------|-----------|
| deepseek-r1:70b | 40GB | ~15-20 | ~45GB |
| qwen2.5:72b | 40GB | ~20-25 | ~45GB |
| qwen2.5:32b | 20GB | ~40-50 | ~25GB |
| llama3.3:70b | 40GB | ~15-20 | ~45GB |

Your M4 Max will handle these BEAUTIFULLY! 💥

## Testing Commands:

```bash
# List installed models
ollama list

# Test a model
ollama run qwen2.5:72b "Write a hello world in Python"

# Check Ollama is accessible on network
curl http://localhost:11434/api/tags

# Monitor performance
ollama ps
```

## Troubleshooting:

**Can't connect from M3?**
- Check firewall: System Settings > Network > Firewall
- Verify M4 IP: `ifconfig en0 | grep inet`
- Test ping: `ping 192.168.1.100` (from M3)

**Model too slow?**
- Use smaller model (32B instead of 72B)
- Check Activity Monitor for RAM pressure
- Close other apps

**Out of memory?**
- Use `qwen2.5:32b` instead
- Or try quantized versions: `qwen2.5:14b-q4_0`

Rangers lead the way! 🎖️

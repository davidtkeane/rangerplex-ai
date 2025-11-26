#!/bin/bash
# 🎖️ OLLAMA SETUP SCRIPT FOR RANGERPLEX
# Sets up Ollama for network access and pulls recommended model

echo "🎖️ RANGER OLLAMA SETUP"
echo "====================="
echo ""

# Get M4 IP address
echo "📍 Your M4 Max IP addresses:"
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "   " $2}'
M4_IP=$(ifconfig en0 | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}')
echo ""
echo "Primary (en0): $M4_IP"
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found! Install from: https://ollama.ai"
    exit 1
fi

echo "✅ Ollama is installed at: $(which ollama)"
echo ""

# Show current models
echo "📦 Currently installed models:"
ollama list
echo ""

# Ask which model to install
echo "🤖 Which model do you want to install?"
echo ""
echo "1) qwen2.5:72b      - 40GB, FAST & POWERFUL (RECOMMENDED)"
echo "2) deepseek-r1:70b  - 40GB, AMAZING reasoning & coding"
echo "3) llama3.3:70b     - 40GB, Meta's latest"
echo "4) qwen2.5:32b      - 20GB, Even faster"
echo "5) Skip model installation"
echo ""
read -p "Enter choice (1-5): " choice

MODEL=""
case $choice in
    1) MODEL="qwen2.5:72b" ;;
    2) MODEL="deepseek-r1:70b" ;;
    3) MODEL="llama3.3:70b" ;;
    4) MODEL="qwen2.5:32b" ;;
    5) echo "Skipping model installation..." ;;
    *) echo "Invalid choice. Exiting."; exit 1 ;;
esac

if [ ! -z "$MODEL" ]; then
    echo ""
    echo "📥 Pulling $MODEL (this will take a while)..."
    ollama pull $MODEL

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Model installed successfully!"
        echo ""
        echo "🧪 Testing model..."
        echo "Hello from Ranger!" | ollama run $MODEL
    else
        echo "❌ Failed to pull model"
        exit 1
    fi
fi

echo ""
echo "🌐 Configuring Ollama for network access..."
echo ""

# Create LaunchAgent directory if it doesn't exist
mkdir -p ~/Library/LaunchAgents

# Create LaunchAgent plist
cat > ~/Library/LaunchAgents/com.ollama.server.plist << 'EOF'
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
EOF

echo "✅ LaunchAgent created at: ~/Library/LaunchAgents/com.ollama.server.plist"
echo ""

# Stop existing Ollama
echo "Stopping existing Ollama processes..."
launchctl unload ~/Library/LaunchAgents/com.ollama.server.plist 2>/dev/null
killall ollama 2>/dev/null
sleep 2

# Load LaunchAgent
echo "Starting Ollama with network access..."
launchctl load ~/Library/LaunchAgents/com.ollama.server.plist

sleep 3

# Test connection
echo ""
echo "🧪 Testing local connection..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama is running locally!"
else
    echo "❌ Ollama not responding on localhost:11434"
    echo "Check logs: tail -f /tmp/ollama.log /tmp/ollama.error.log"
    exit 1
fi

echo ""
echo "🧪 Testing network connection on $M4_IP..."
if curl -s http://$M4_IP:11434/api/tags > /dev/null; then
    echo "✅ Ollama is accessible on network at $M4_IP:11434"
else
    echo "⚠️  Network test failed. You may need to:"
    echo "   1. Check firewall: System Settings > Network > Firewall"
    echo "   2. Allow incoming connections for Ollama"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎖️ SETUP COMPLETE! RANGERS LEAD THE WAY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Access URLs:"
echo "   Local (M4):  http://localhost:11434"
echo "   Network:     http://$M4_IP:11434"
echo ""
echo "🔧 RangerPlex Configuration:"
echo "   Proxy endpoint: http://localhost:3010/api/ollama/"
echo "   Add header: x-ollama-host: http://localhost:11434"
echo ""
echo "📱 From M3 Mac:"
echo "   Test: curl http://$M4_IP:11434/api/tags"
echo "   Use: x-ollama-host: http://$M4_IP:11434"
echo ""
echo "🛠️  Useful commands:"
echo "   List models:  ollama list"
echo "   Test model:   ollama run $MODEL"
echo "   Check status: ollama ps"
echo "   View logs:    tail -f /tmp/ollama.log"
echo ""

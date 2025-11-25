#!/bin/bash
# 🎖️ M4 MAX - OLLAMA SERVER SETUP
# This script configures your M4 Max as an Ollama server for your M3 Mac
# Run this script ON THE M4 MAX

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎖️  M4 MAX - OLLAMA SERVER SETUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will configure your M4 Max to serve AI models"
echo "to your M3 Mac running RangerPlex."
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found!"
    echo ""
    echo "Please install Ollama first:"
    echo "1. Visit: https://ollama.ai"
    echo "2. Download and install"
    echo "3. Run this script again"
    exit 1
fi

echo "✅ Ollama found at: $(which ollama)"
echo ""

# Get M4 IP address
echo "📍 Your M4 Max Network Information:"
echo ""
M4_IP=$(ifconfig en0 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}')

if [ -z "$M4_IP" ]; then
    # Try en1 if en0 failed
    M4_IP=$(ifconfig en1 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}')
fi

if [ -z "$M4_IP" ]; then
    echo "⚠️  Could not auto-detect IP. All IPs on this machine:"
    ifconfig | grep "inet " | grep -v 127.0.0.1
    echo ""
    read -p "Enter your M4's IP address manually: " M4_IP
fi

echo "   M4 IP Address: $M4_IP"
echo ""
echo "⚠️  IMPORTANT: Save this IP! You'll need it on your M3 Mac:"
echo "   $M4_IP"
echo ""

# Show current models
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Currently Installed Models:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ollama list
echo ""

# Ask if user wants to install a model
read -p "Do you want to install a model now? (y/n): " install_model

if [[ "$install_model" =~ ^[Yy]$ ]]; then
    echo ""
    echo "🤖 Recommended Models for M4 Max 128GB:"
    echo ""
    echo "1) qwen2.5:72b      - 40GB, FAST & POWERFUL ⚡⚡⚡ (RECOMMENDED)"
    echo "2) qwen2.5:32b      - 20GB, MAXIMUM SPEED ⚡⚡⚡⚡"
    echo "3) deepseek-r1:70b  - 40GB, Best for reasoning & coding"
    echo "4) llama3.3:70b     - 40GB, Meta's latest"
    echo "5) qwen2.5:14b      - 9GB, Lightweight & fast"
    echo "6) Enter custom model name"
    echo ""
    read -p "Enter choice (1-6): " model_choice

    MODEL=""
    case $model_choice in
        1) MODEL="qwen2.5:72b" ;;
        2) MODEL="qwen2.5:32b" ;;
        3) MODEL="deepseek-r1:70b" ;;
        4) MODEL="llama3.3:70b" ;;
        5) MODEL="qwen2.5:14b" ;;
        6)
            echo ""
            read -p "Enter model name (e.g., llama2:13b): " MODEL
            ;;
        *)
            echo "❌ Invalid choice. Skipping model installation."
            MODEL=""
            ;;
    esac

    if [ ! -z "$MODEL" ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📥 Pulling $MODEL..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "This will take a while (downloading 20-40GB)..."
        echo "You can check progress below:"
        echo ""

        ollama pull $MODEL

        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Model installed successfully!"
            echo ""
            echo "🧪 Testing model..."
            echo "Hello from M4 Ranger!" | ollama run $MODEL
        else
            echo ""
            echo "❌ Failed to pull model. Check your internet connection."
        fi
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Configuring Ollama for Network Access"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Stop any existing Ollama processes
echo "Stopping existing Ollama processes..."
launchctl unload ~/Library/LaunchAgents/com.ollama.server.plist 2>/dev/null
killall ollama 2>/dev/null
sleep 2

# Create LaunchAgent directory
mkdir -p ~/Library/LaunchAgents

# Create LaunchAgent plist for network access
echo "Creating LaunchAgent configuration..."
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
        <key>OLLAMA_ORIGINS</key>
        <string>*</string>
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

echo "✅ LaunchAgent created"
echo ""

# Load the LaunchAgent
echo "Starting Ollama server with network access..."
launchctl load ~/Library/LaunchAgents/com.ollama.server.plist

echo "Waiting for Ollama to start..."
sleep 5

# Test local connection
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing Connections"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Test 1: Local connection (localhost)..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Local connection works!"
else
    echo "❌ Local connection failed!"
    echo "   Check logs: tail -f /tmp/ollama.log"
    exit 1
fi

echo ""
echo "Test 2: Network connection ($M4_IP)..."
if curl -s http://$M4_IP:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Network connection works!"
else
    echo "⚠️  Network connection test failed."
    echo ""
    echo "This might be normal. To fix:"
    echo "1. Go to: System Settings > Network > Firewall"
    echo "2. If firewall is ON, click 'Options'"
    echo "3. Add '/opt/homebrew/bin/ollama' and allow connections"
    echo "4. Or turn firewall OFF temporarily for testing"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎖️  M4 MAX SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Ollama is now running and accessible on your network!"
echo ""
echo "📍 Your M4 Connection Details:"
echo "   IP Address: $M4_IP"
echo "   Port: 11434"
echo "   Full URL: http://$M4_IP:11434"
echo ""
echo "📝 SAVE THIS FOR YOUR M3 MAC:"
echo "   ┌────────────────────────────────────┐"
echo "   │  Ollama URL: http://$M4_IP:11434  │"
echo "   └────────────────────────────────────┘"
echo ""
echo "🔧 Useful Commands (on M4):"
echo "   List models:    ollama list"
echo "   Pull model:     ollama pull <model-name>"
echo "   Test model:     ollama run <model-name>"
echo "   Check status:   ollama ps"
echo "   View logs:      tail -f /tmp/ollama.log"
echo "   Restart:        launchctl unload ~/Library/LaunchAgents/com.ollama.server.plist"
echo "                   launchctl load ~/Library/LaunchAgents/com.ollama.server.plist"
echo ""
echo "🚀 NEXT STEP:"
echo "   Run the M3 setup script on your M3 Mac"
echo "   to configure RangerPlex to use this M4 server!"
echo ""
echo "Rangers lead the way! 🎖️"
echo ""

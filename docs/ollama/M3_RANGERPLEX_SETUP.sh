#!/bin/bash
# 🎖️ M3 MAC - RANGERPLEX CLIENT SETUP
# This script configures your M3 Mac's RangerPlex to connect to M4's Ollama
# Run this script ON THE M3 MAC (where RangerPlex is running)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎖️  M3 MAC - RANGERPLEX CLIENT SETUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will configure RangerPlex to use your M4 Max"
echo "as the Ollama AI server."
echo ""

# Get M4 IP address from user
echo "📍 Enter your M4 Max IP address:"
echo "   (You got this from running M4_OLLAMA_SETUP.sh on your M4)"
echo ""
read -p "M4 IP Address: " M4_IP

if [ -z "$M4_IP" ]; then
    echo "❌ No IP address entered. Exiting."
    exit 1
fi

echo ""
echo "Testing connection to M4 Max at $M4_IP..."
echo ""

# Test connection to M4's Ollama
if curl -s --connect-timeout 5 http://$M4_IP:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Connection successful!"
    echo ""

    # Get list of models
    echo "📦 Available models on M4 Max:"
    echo ""
    curl -s http://$M4_IP:11434/api/tags | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    models = data.get('models', [])
    if models:
        for model in models:
            name = model.get('name', 'unknown')
            size = model.get('size', 0)
            size_gb = size / (1024**3)
            print(f'   ✓ {name} ({size_gb:.1f} GB)')
    else:
        print('   (No models installed yet)')
except:
    print('   (Could not parse model list)')
"
    echo ""
else
    echo "❌ Cannot connect to M4 Max at $M4_IP:11434"
    echo ""
    echo "Troubleshooting:"
    echo "1. Is M4_OLLAMA_SETUP.sh running on M4?"
    echo "2. Are both Macs on the same network?"
    echo "3. Check M4 firewall: System Settings > Network > Firewall"
    echo "4. Try ping: ping $M4_IP"
    echo ""
    read -p "Continue anyway? (y/n): " continue_anyway
    if [[ ! "$continue_anyway" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Configuring RangerPlex"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create or update .env file
ENV_FILE=".env.local"

echo "Creating/updating $ENV_FILE..."

# Check if file exists
if [ -f "$ENV_FILE" ]; then
    # Backup existing file
    cp "$ENV_FILE" "${ENV_FILE}.backup"
    echo "✅ Backed up existing $ENV_FILE"
fi

# Check if OLLAMA_URL already exists
if grep -q "NEXT_PUBLIC_OLLAMA_URL" "$ENV_FILE" 2>/dev/null; then
    # Update existing entry
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|NEXT_PUBLIC_OLLAMA_URL=.*|NEXT_PUBLIC_OLLAMA_URL=http://$M4_IP:11434|" "$ENV_FILE"
    else
        sed -i "s|NEXT_PUBLIC_OLLAMA_URL=.*|NEXT_PUBLIC_OLLAMA_URL=http://$M4_IP:11434|" "$ENV_FILE"
    fi
    echo "✅ Updated OLLAMA_URL in $ENV_FILE"
else
    # Add new entry
    echo "" >> "$ENV_FILE"
    echo "# Ollama Configuration (M4 Max Server)" >> "$ENV_FILE"
    echo "NEXT_PUBLIC_OLLAMA_URL=http://$M4_IP:11434" >> "$ENV_FILE"
    echo "✅ Added OLLAMA_URL to $ENV_FILE"
fi

echo ""
echo "📝 Configuration written to $ENV_FILE:"
echo "   NEXT_PUBLIC_OLLAMA_URL=http://$M4_IP:11434"
echo ""

# Create a config file for easy reference
cat > M3_OLLAMA_CONFIG.txt << EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎖️  RANGERPLEX OLLAMA CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

M4 Max Ollama Server: http://$M4_IP:11434

This file is for your reference.
The actual config is in: $ENV_FILE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TESTING COMMANDS (run on M3):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Test connection to M4
curl http://$M4_IP:11434/api/tags

# Test chat
curl http://$M4_IP:11434/api/generate -d '{
  "model": "qwen2.5:72b",
  "prompt": "Hello from M3!"
}'

# Check M4 is reachable
ping $M4_IP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USING IN RANGERPLEX:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Restart RangerPlex dev server:
   npm run dev

2. Open RangerPlex in browser

3. Start a new chat

4. Select "Local" model from dropdown

5. Choose the model from M4 (e.g., qwen2.5:72b)

6. Start chatting!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TROUBLESHOOTING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Can't connect?
- Check both Macs are on same WiFi
- Test: ping $M4_IP
- Check M4 firewall settings

Model not appearing?
- Verify model is on M4: ssh to M4, run 'ollama list'
- Pull model on M4: ollama pull <model-name>

RangerPlex not using M4?
- Check $ENV_FILE has correct URL
- Restart dev server: npm run dev
- Check browser console (F12) for errors

Rangers lead the way! 🎖️
EOF

echo "✅ Created reference file: M3_OLLAMA_CONFIG.txt"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing Connection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Final connection test
if curl -s --connect-timeout 5 http://$M4_IP:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Connection to M4 Max successful!"
    echo ""

    # Test through proxy if running
    if lsof -i :3010 > /dev/null 2>&1; then
        echo "✅ RangerPlex proxy detected on port 3010"
        echo ""
        echo "Testing proxy connection..."
        if curl -s -H "x-ollama-host: http://$M4_IP:11434" \
           http://localhost:3010/api/ollama/tags > /dev/null 2>&1; then
            echo "✅ Proxy connection works!"
        else
            echo "⚠️  Proxy test failed (this might be OK)"
        fi
    else
        echo "ℹ️  RangerPlex proxy not running on port 3010"
        echo "   (This is OK - start it with: npm run dev)"
    fi
else
    echo "⚠️  Warning: Cannot verify connection to M4 Max"
    echo "   Please check network and firewall settings"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎖️  M3 SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ RangerPlex is now configured to use M4 Max!"
echo ""
echo "📍 Configuration:"
echo "   M4 Ollama URL: http://$M4_IP:11434"
echo "   Config file: $ENV_FILE"
echo "   Reference: M3_OLLAMA_CONFIG.txt"
echo ""
echo "🚀 NEXT STEPS:"
echo ""
echo "1. Restart RangerPlex (if running):"
echo "   npm run dev"
echo ""
echo "2. Open RangerPlex in browser"
echo ""
echo "3. Create new chat and select 'Local' model"
echo ""
echo "4. Choose your M4 model (e.g., qwen2.5:72b)"
echo ""
echo "5. Start chatting with M4 Max power! 💥"
echo ""
echo "📝 Quick test command:"
echo "   curl http://$M4_IP:11434/api/tags"
echo ""
echo "Rangers lead the way! 🎖️"
echo ""

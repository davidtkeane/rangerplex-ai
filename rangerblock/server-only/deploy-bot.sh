#!/bin/bash
# Deploy RangerBot AI to a remote server
# Usage: ./deploy-bot.sh [user@host]

TARGET=$1

if [ -z "$TARGET" ]; then
    echo "Usage: ./deploy-bot.sh user@host"
    echo "Example: ./deploy-bot.sh david_keane_1974@34.26.30.249"
    exit 1
fi

echo "🤖 RangerBot AI Deployment"
echo "=========================="

read -p "Enter Gemini API Key: " API_KEY

if [ -z "$API_KEY" ]; then
    echo "API Key is required!"
    exit 1
fi

echo ""
echo "📦 Uploading bot script..."
scp rangerbot-ai.cjs $TARGET:~/rangerplex-ai/rangerblock/core/

echo "🚀 Starting bot on remote server..."
ssh $TARGET "cd ~/rangerplex-ai/rangerblock/core && npm install ws && screen -dmS rangerbot node rangerbot-ai.cjs --relay localhost:5555 --key $API_KEY"

echo ""
echo "✅ Bot deployed and running!"
echo "   To check logs: ssh $TARGET 'screen -r rangerbot'"

#!/bin/bash
# 🎖️ START RANGERPLEX WITH OLLAMA SUPPORT

cd "/Users/ranger/Local Sites/rangerplex-ai"

echo "🎖️ Starting RangerPlex with Ollama Support..."
echo ""
echo "✅ Ollama detected: deepseek-r1:14b"
echo "✅ Proxy will run on: http://localhost:3010"
echo "✅ RangerPlex will run on: http://localhost:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 IMPORTANT - Configure in RangerPlex:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open Settings (gear icon ⚙️)"
echo "2. Click 'Ollama' tab"
echo "3. Set Ollama Base URL to:"
echo "   http://localhost:3010/api/ollama"
echo ""
echo "4. Set Ollama Model ID to:"
echo "   deepseek-r1:14b"
echo ""
echo "5. Click 'Test' then 'Save'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Starting server..."
echo ""

npm run dev

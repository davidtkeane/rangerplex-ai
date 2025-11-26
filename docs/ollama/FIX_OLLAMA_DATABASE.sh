#!/bin/bash
# 🎖️ FIX OLLAMA SETTINGS IN DATABASE

cd "/Users/ranger/Local Sites/rangerplex-ai"

echo "🎖️ FIXING RANGERPLEX OLLAMA SETTINGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backup database first
cp data/rangerplex.db data/rangerplex.db.backup.$(date +%Y%m%d%H%M%S)
echo "✅ Backed up database"
echo ""

# Get current settings
echo "📊 Current Ollama settings:"
sqlite3 data/rangerplex.db "SELECT value FROM settings WHERE key='settings_ranger';" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('  ollamaBaseUrl:', data.get('ollamaBaseUrl'))
print('  ollamaModelId:', data.get('ollamaModelId'))
"
echo ""

# Update settings
echo "🔧 Updating settings..."
sqlite3 data/rangerplex.db << 'EOF'
UPDATE settings
SET value = json_set(
    json_set(value, '$.ollamaBaseUrl', 'http://localhost:3010/api/ollama'),
    '$.ollamaModelId', 'deepseek-r1:14b'
)
WHERE key = 'settings_ranger';
EOF

echo "✅ Settings updated!"
echo ""

# Show new settings
echo "📊 New Ollama settings:"
sqlite3 data/rangerplex.db "SELECT value FROM settings WHERE key='settings_ranger';" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('  ollamaBaseUrl:', data.get('ollamaBaseUrl'))
print('  ollamaModelId:', data.get('ollamaModelId'))
"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DONE! Now restart RangerPlex:"
echo "   1. Stop current server (Ctrl+C)"
echo "   2. Start again: npm run dev"
echo "   3. Try chatting with Local model!"
echo ""
echo "Rangers lead the way! 🎖️"

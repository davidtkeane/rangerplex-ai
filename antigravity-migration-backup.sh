#!/bin/bash
# 🎖️ Antigravity macOS App - Migration Script
# Run this on M3 Pro to backup all Antigravity data

set -e  # Exit on error

echo "🎖️ ANTIGRAVITY MIGRATION BACKUP SCRIPT"
echo "======================================"
echo ""

# Check if Antigravity is running
if pgrep -x "Antigravity" > /dev/null; then
    echo "⚠️  WARNING: Antigravity is currently running!"
    echo "Please quit Antigravity (Cmd+Q) before continuing."
    read -p "Press Enter after quitting Antigravity..."
fi

# Create backup directory
BACKUP_DIR=~/Desktop/MSI-Migration-$(date +%Y%m%d)
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup in: $BACKUP_DIR"
echo ""

# 1. Backup Antigravity app data
echo "1️⃣  Backing up Antigravity app data..."
if [ -d ~/Library/Application\ Support/Antigravity ]; then
    cp -R ~/Library/Application\ Support/Antigravity "$BACKUP_DIR/"
    ANTIGRAVITY_SIZE=$(du -sh "$BACKUP_DIR/Antigravity" | cut -f1)
    echo "   ✅ Antigravity data backed up ($ANTIGRAVITY_SIZE)"
else
    echo "   ⚠️  Antigravity folder not found!"
fi

# 2. Backup RangerPlex data (if exists)
echo ""
echo "2️⃣  Backing up RangerPlex data..."
if [ -f ~/rangerplex-ai/data/rangerplex.db ]; then
    mkdir -p "$BACKUP_DIR/RangerPlex"
    cp ~/rangerplex-ai/data/rangerplex.db "$BACKUP_DIR/RangerPlex/"
    cp ~/rangerplex-ai/.env "$BACKUP_DIR/RangerPlex/env-backup.txt" 2>/dev/null || echo "   ⚠️  .env not found"
    echo "   ✅ RangerPlex database backed up"
else
    echo "   ⚠️  RangerPlex database not found"
fi

# 3. Create migration instructions
echo ""
echo "3️⃣  Creating migration instructions..."
cat > "$BACKUP_DIR/MIGRATION_INSTRUCTIONS.txt" << 'EOF'
🎖️ ANTIGRAVITY + RANGERPLEX MIGRATION GUIDE
==========================================

📦 This backup contains:
- Antigravity app data (all conversations)
- RangerPlex database (if available)
- Environment configuration

🚀 INSTALLATION ON MSI WINDOWS:

1. ANTIGRAVITY:
   - Install Antigravity app on Windows
   - Run once to create folder structure
   - Close Antigravity completely
   - Copy "Antigravity" folder to:
     C:\Users\YourUsername\AppData\Roaming\Antigravity\
   - Restart Antigravity app

2. RANGERPLEX:
   - Clone repo: git clone https://github.com/davidtkeane/rangerplex-ai.git
   - Install: npm install
   - Copy RangerPlex/rangerplex.db to: rangerplex-ai/data/
   - Copy RangerPlex/env-backup.txt to: rangerplex-ai/.env
   - Start: npm run pm2:start
   - Import data via Settings → Backup → Import

📝 VERIFICATION:
- Antigravity: Open app, check conversations are present
- RangerPlex: Open browser (localhost:5173), verify chats loaded

🛡️ SAFETY:
- Keep this backup until MSI is fully working
- Test everything before deleting M3 Pro data

Rangers lead the way! 🎖️
EOF
echo "   ✅ Instructions created"

# 4. Compress backup
echo ""
echo "4️⃣  Compressing backup for transfer..."
cd ~/Desktop
tar -czf "MSI-Migration-$(date +%Y%m%d).tar.gz" "MSI-Migration-$(date +%Y%m%d)/"
COMPRESSED_SIZE=$(du -sh "MSI-Migration-$(date +%Y%m%d).tar.gz" | cut -f1)
echo "   ✅ Compressed to: MSI-Migration-$(date +%Y%m%d).tar.gz ($COMPRESSED_SIZE)"

# 5. Summary
echo ""
echo "✅ BACKUP COMPLETE!"
echo "=================="
echo ""
echo "📁 Backup location:"
echo "   Folder: $BACKUP_DIR"
echo "   Archive: ~/Desktop/MSI-Migration-$(date +%Y%m%d).tar.gz"
echo ""
echo "📝 Next steps:"
echo "   1. Transfer .tar.gz file to MSI (USB/cloud)"
echo "   2. Extract on MSI"
echo "   3. Follow MIGRATION_INSTRUCTIONS.txt"
echo ""
echo "🎖️ Rangers lead the way!"

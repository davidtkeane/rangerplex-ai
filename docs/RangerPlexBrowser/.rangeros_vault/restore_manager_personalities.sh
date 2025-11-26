#!/bin/bash
# 🏢 Manager Personality Restoration Script
# Created: 2025-09-10T03:01:38.533003
# Purpose: Restore all 10 Irish manager personalities from backup

echo "🏢 MANAGER PERSONALITY RESTORATION"
echo "=================================="
echo "🎯 Restoring all 10 Irish manager personalities and memories"
echo ""

VAULT_DIR="/Users/ranger/.rangeros_vault"
BACKUP_DIRS=(
    "$VAULT_DIR/manager_backups"
    "$HOME/Library/RangerOS/manager_backups"
    "/tmp/rangeros_manager_emergency"
    "$HOME/Documents/RangerOS_Manager_Backup"
)

# Check which backup location to use
BACKUP_SOURCE=""
for backup_dir in "${BACKUP_DIRS[@]}"; do
    if [ -d "$backup_dir" ] && [ "$(ls -1 "$backup_dir"/*_latest_*memories.sqlite3 2>/dev/null | wc -l)" -gt "5" ]; then
        BACKUP_SOURCE="$backup_dir"
        echo "✅ Using backup location: $backup_dir"
        break
    fi
done

if [ -z "$BACKUP_SOURCE" ]; then
    echo "❌ No valid backup location found!"
    echo "💡 Check backup directories:"
    for dir in "${BACKUP_DIRS[@]}"; do
        echo "   $dir"
    done
    exit 1
fi

echo ""
echo "🔄 Restoring manager personalities..."

# Restore each manager
MANAGERS=("Dave" "Máire" "Seamus" "Declan" "Terry" "Paddy" "Róisín" "RangerBot" "IR" "Professor Bridget")

for manager in "${MANAGERS[@]}"; do
    # Find latest backup for this manager
    LATEST_BACKUP=$(ls -t "$BACKUP_SOURCE/${manager}_latest_"*memories.sqlite3 2>/dev/null | head -1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        # Extract target filename
        TARGET_FILE=$(basename "$LATEST_BACKUP" | sed "s/${manager}_latest_//")
        TARGET_PATH="$VAULT_DIR/$TARGET_FILE"
        
        # Restore from backup
        cp "$LATEST_BACKUP" "$TARGET_PATH"
        
        if [ $? -eq 0 ]; then
            echo "   ✅ $manager: Personality restored from backup"
        else
            echo "   ❌ $manager: Restore failed"
        fi
    else
        echo "   ⚠️ $manager: No backup found"
    fi
done

echo ""
echo "🎉 MANAGER RESTORATION COMPLETE!"
echo "🏢 All available manager personalities have been restored"
echo "💡 Restart RangerOS to activate restored managers"
echo ""
echo "🏔️ 'One foot in front of the other' - Your Irish management team is back!"

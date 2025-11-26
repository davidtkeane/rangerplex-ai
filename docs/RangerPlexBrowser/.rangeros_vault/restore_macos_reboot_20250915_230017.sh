#!/bin/bash
# 🏔️ macOS Reboot Recovery Script
# Created: 20250915_230017
# Archive: rangeros_macos_reboot_state_20250915_230017.zip
# 
# "One foot in front of the other" - David Keane
# This script restores your complete RangerOS ecosystem after macOS reboot

echo "🏔️ macOS REBOOT RECOVERY SYSTEM"
echo "==============================="
echo "📦 Archive: rangeros_macos_reboot_state_20250915_230017.zip"
echo "💾 Compressed Size: 18.6MB"
echo "🎯 Mission: Restore 9.9MB of RangerOS ecosystem"
echo ""

VAULT_DIR="/Users/ranger/.rangeros_vault"
ARCHIVE_PATH="/Users/ranger/.rangeros_vault/compressed_states/rangeros_macos_reboot_state_20250915_230017.zip"
RESTORE_DIR="$VAULT_DIR/macos_reboot_restore_20250915_230017"

# Check if archive exists
if [ ! -f "$ARCHIVE_PATH" ]; then
    echo "❌ Archive not found: $ARCHIVE_PATH"
    echo "💡 Check compression path: $VAULT_DIR/compressed_states/"
    exit 1
fi

echo "🗜️ Extracting RangerOS state archive..."
mkdir -p "$RESTORE_DIR"
cd "$RESTORE_DIR"

# Extract archive
unzip -q "$ARCHIVE_PATH"
echo "✅ Archive extracted to: $RESTORE_DIR"

# Restore databases
echo ""
echo "💾 Restoring SQLite databases..."
if [ -d "databases" ]; then
    cp -r databases/* "$VAULT_DIR/"
    echo "✅ Databases restored"
else
    echo "⚠️ No databases found in archive"
fi

# Restore VSCode sessions
echo ""
echo "📝 Restoring VSCode sessions..."
if [ -d "vscode_sessions" ]; then
    cp -r vscode_sessions/* "$VAULT_DIR/vscode_persistence/"
    echo "✅ VSCode sessions restored"
else
    echo "⚠️ No VSCode sessions found in archive"
fi

# Restore phantom processes
echo ""
echo "👻 Restoring phantom processes..."
if [ -f "phantom_processes/current_phantom_processes.json" ]; then
    cp "phantom_processes/current_phantom_processes.json" "$VAULT_DIR/"
    echo "✅ Phantom process state restored"
else
    echo "⚠️ No phantom process data found"
fi

# Run enhanced phantom restoration
echo ""
echo "🚀 Starting enhanced phantom process restoration..."
if [ -f "$VAULT_DIR/restore_phantom_processes_enhanced.sh" ]; then
    echo "🎯 Executing phantom restoration..."
    bash "$VAULT_DIR/restore_phantom_processes_enhanced.sh"
else
    echo "⚠️ Enhanced restoration script not found"
    echo "💡 Falling back to standard RangerOS launch..."
    cd "/Users/ranger/scripts/Rangers_Stuff/browser-2025/RangerOS"
    ./launch_rangeros_v4.sh
fi

echo ""
echo "🎉 macOS REBOOT RECOVERY COMPLETE!"
echo "🏔️ 'One foot in front of the other' - Your RangerOS ecosystem is restored!"

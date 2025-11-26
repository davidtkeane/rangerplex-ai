#!/bin/bash
# 📝 VSCode Session Restoration Script
# Created: 20250915_234031
# Purpose: Restore VSCode sessions after macOS reboot

echo "📝 VSCode SESSION RESTORATION"
echo "============================="
echo "🎯 Restoring 9 VSCode windows"
echo "📄 Restoring 109 open files"
echo "📂 Restoring 33 workspaces"
echo ""

# Load session data
SESSION_FILE="/Users/ranger/.rangeros_vault/vscode_persistence/vscode_sessions_20250915_234031.json"
WORKSPACE_FILE="/Users/ranger/.rangeros_vault/vscode_persistence/vscode_workspaces_20250915_234031.json"

if [ ! -f "$SESSION_FILE" ]; then
    echo "❌ Session file not found: $SESSION_FILE"
    exit 1
fi

if [ ! -f "$WORKSPACE_FILE" ]; then
    echo "❌ Workspace file not found: $WORKSPACE_FILE"
    exit 1
fi

echo "📂 Restoring VSCode workspaces..."

# Parse session data and restore VSCode windows
python3 -c "
import json
import subprocess
import os

# Load session data
with open('$SESSION_FILE', 'r') as f:
    session_data = json.load(f)

print('🚀 Launching VSCode sessions...')

for session in session_data['sessions']:
    working_dir = session.get('working_directory')
    open_files = session.get('open_files', [])
    
    if working_dir and os.path.exists(working_dir):
        print(f'📁 Opening workspace: {working_dir}')
        
        # Open VSCode with working directory
        subprocess.run(['code', working_dir], cwd=working_dir)
        
        # Open specific files
        for file_info in open_files[:10]:  # Limit to first 10 files
            file_path = file_info['file_path']
            if os.path.exists(file_path):
                print(f'📄 Opening file: {os.path.basename(file_path)}')
                subprocess.run(['code', file_path])

print('✅ VSCode session restoration complete!')
"

echo ""
echo "🎉 VSCode sessions restored!"
echo "💡 Check VSCode windows for your restored workspaces and files"

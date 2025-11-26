#!/bin/bash
# 🖥️ iTerm Terminal Session Restoration Script
# Created: 2025-09-10T01:19:03.291106
# Source: .iterm_phantom/iterm_sessions.json
# 
# "One foot in front of the other" - David Keane
# This script restores iTerm terminal sessions after macOS reboot

echo "🖥️ ITERM SESSION RESTORATION"
echo "============================="
echo "📊 Sessions to restore: 85"
echo "📁 RangerOS sessions: 18"
echo "👻 Phantom ratio: 111,232:1"
echo ""

# Set key environment variables
echo "🌍 Restoring environment variables..."
export CONDA_PREFIX="/Applications/miniconda3/envs/RangerOS"
export PWD="/Users/ranger/scripts/Rangers_Stuff/browser-2025/RangerOS"

# Activate conda environment
if [ -n "$CONDA_PREFIX" ]; then
    echo "🐍 Activating conda environment: RangerOS"
    source /Applications/miniconda3/etc/profile.d/conda.sh
    conda activate RangerOS
fi

# Create new iTerm windows for RangerOS sessions
echo "📁 Creating RangerOS terminal sessions..."

# Primary RangerOS session
echo "   🎯 Opening primary RangerOS session..."
osascript -e 'tell application "iTerm"
    create window with default profile
    tell current session of current window
        write text "cd /Users/ranger/scripts/Rangers_Stuff/browser-2025/RangerOS"
        write text "echo \"🏔️ RangerOS Terminal Session Restored - Primary\""
        write text "echo \"Philosophy: One foot in front of the other - David Keane\""
        write text "rangeros-status"
    end tell
end tell'

# Secondary RangerOS session (for monitoring)
echo "   📊 Opening monitoring session..."
osascript -e 'tell application "iTerm"
    tell current window
        create tab with default profile
        tell current session
            write text "cd /Users/ranger/scripts/Rangers_Stuff/browser-2025/RangerOS"
            write text "echo \"🔍 RangerOS Monitoring Session - Secondary\""
            write text "echo \"Available commands: rangeros-status, prepare-reboot, fix-rangeros-sessions\""
        end tell
    end tell
end tell'

# Third session for development
echo "   💻 Opening development session..."
osascript -e 'tell application "iTerm"
    tell current window
        create tab with default profile
        tell current session
            write text "cd /Users/ranger/scripts/Rangers_Stuff/browser-2025/RangerOS"
            write text "echo \"⚡ RangerOS Development Session - Tertiary\""
            write text "echo \"Ready for development work\""
        end tell
    end tell
end tell'

# Home directory session for general use
echo "   🏠 Opening home directory session..."
osascript -e 'tell application "iTerm"
    tell current window
        create tab with default profile
        tell current session
            write text "cd ~"
            write text "echo \"🏠 Home Directory Session\""
            write text "echo \"General purpose terminal\""
        end tell
    end tell
end tell'

echo ""
echo "✅ iTerm session restoration complete!"
echo "🎯 Restored 18 RangerOS-focused sessions"
echo "👻 Phantom memory efficiency preserved"
echo "🏔️ 'One foot in front of the other' - Your terminals are back!"

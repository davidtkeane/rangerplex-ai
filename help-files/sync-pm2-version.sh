#!/usr/bin/env bash

# PM2 Version Sync Script for M1/M2/M3/M4 Macs
# Fixes version mismatch between global and local PM2

set -euo pipefail

# Colors
if command -v tput >/dev/null 2>&1; then
  bold="$(tput bold)"; reset="$(tput sgr0)"
  green="$(tput setaf 2)"; cyan="$(tput setaf 6)"; yellow="$(tput setaf 3)"
else
  bold=""; reset=""; green=""; cyan=""; yellow=""
fi

log() { printf "%b\n" "$*"; }
step() { log "${cyan}➜${reset} $*"; }
ok() { log "${green}✓${reset} $*"; }
warn() { log "${yellow}⚠${reset} $*"; }

echo ""
echo "${bold}${cyan}╔═══════════════════════════════════════════════╗${reset}"
echo "${bold}${cyan}║   🎖️  PM2 Version Sync for RangerPlex AI 🎖️   ║${reset}"
echo "${bold}${cyan}╚═══════════════════════════════════════════════╝${reset}"
echo ""

step "Checking PM2 versions..."
echo ""

# Get global PM2 version
if command -v pm2 >/dev/null 2>&1; then
    GLOBAL_PM2=$(pm2 -v 2>/dev/null || echo "not installed")
    ok "Global PM2: ${bold}${GLOBAL_PM2}${reset}"
else
    warn "Global PM2: ${bold}not installed${reset}"
    GLOBAL_PM2="not installed"
fi

# Get local PM2 version from package.json
if [ -f package.json ]; then
    LOCAL_PM2=$(grep '"pm2"' package.json | sed 's/.*"\^*\([0-9.]*\)".*/\1/')
    ok "Local PM2 (package.json): ${bold}${LOCAL_PM2}${reset}"
else
    warn "package.json not found!"
    exit 1
fi

echo ""

# Check if versions match
if [ "$GLOBAL_PM2" != "not installed" ] && [ "$GLOBAL_PM2" != "$LOCAL_PM2" ]; then
    warn "Version mismatch detected!"
    echo ""
    echo "${yellow}This causes the warning:${reset}"
    echo "${bold}  >>>> In-memory PM2 is out-of-date, do: $ pm2 update${reset}"
    echo ""
    step "Syncing versions..."
    echo ""
    
    # Update global PM2
    step "Updating global PM2 to v${LOCAL_PM2}..."
    if pm2 update; then
        ok "Global PM2 updated successfully"
    else
        warn "PM2 update had issues (this is usually fine)"
    fi
    
    # Reinstall local PM2
    step "Reinstalling local PM2 dependencies..."
    if npm install; then
        ok "Local dependencies updated"
    else
        warn "npm install had issues"
    fi
    
    echo ""
    ok "${bold}${green}PM2 versions synced!${reset}"
    echo ""
    
    # Show new versions
    NEW_GLOBAL=$(pm2 -v 2>/dev/null || echo "unknown")
    echo "${bold}Updated versions:${reset}"
    echo "  Global PM2: ${bold}${green}${NEW_GLOBAL}${reset}"
    echo "  Local PM2:  ${bold}${green}${LOCAL_PM2}${reset}"
    echo ""
    
    step "Restarting PM2 processes..."
    if pm2 restart ecosystem.config.cjs 2>/dev/null; then
        ok "PM2 processes restarted"
    else
        warn "No PM2 processes were running"
    fi
    
elif [ "$GLOBAL_PM2" = "$LOCAL_PM2" ]; then
    ok "${bold}${green}Versions already in sync!${reset}"
    echo ""
    echo "  Global PM2: ${bold}${green}${GLOBAL_PM2}${reset}"
    echo "  Local PM2:  ${bold}${green}${LOCAL_PM2}${reset}"
    echo ""
    ok "No action needed."
else
    warn "Global PM2 not installed. Installing..."
    npm install -g pm2@${LOCAL_PM2}
    ok "Global PM2 installed"
fi

echo ""
echo "${bold}${green}╔═══════════════════════════════════════════════╗${reset}"
echo "${bold}${green}║          ✅ PM2 Sync Complete! ✅              ║${reset}"
echo "${bold}${green}╚═══════════════════════════════════════════════╝${reset}"
echo ""
echo "${cyan}You can now run:${reset}"
echo "  ${bold}npm run pm2:start${reset}   ${dim}→ Start RangerPlex${reset}"
echo "  ${bold}npm run pm2:status${reset}  ${dim}→ Check status${reset}"
echo ""
echo "${bold}${green}Rangers lead the way!${reset} 🎖️"
echo ""

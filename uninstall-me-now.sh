#!/usr/bin/env bash

# RangerPlex AI Uninstaller (v2.4.2)
# Safely remove local install artifacts (node_modules, .env, caches) without touching your git repo.
#
# IMPROVEMENTS (v2.4.2):
# ✅ Added banner with visual identity
# ✅ Check and kill running processes on ports 3010/5173
# ✅ Remove additional artifacts (.vite cache, build files, .DS_Store)
# ✅ Remove .env backup files (*.bak.*)
# ✅ Show space freed up after cleanup
# ✅ "Uninstall All" option for quick cleanup
# ✅ Better Ollama uninstall instructions
# ✅ Final summary of what was removed

set -euo pipefail

if command -v tput >/dev/null 2>&1; then
  bold="$(tput bold)"; dim="$(tput dim)"; reset="$(tput sgr0)"
  green="$(tput setaf 2)"; cyan="$(tput setaf 6)"; yellow="$(tput setaf 3)"; red="$(tput setaf 1)"
else
  bold=""; dim=""; reset=""; green=""; cyan=""; yellow=""; red=""
fi

log() { printf "%b\n" "$*"; }
step() { log "${cyan}➜${reset} $*"; }
ok() { log "${green}✓${reset} $*"; }
warn() { log "${yellow}⚠${reset} $*"; }
fail() { log "${red}✗${reset} $*"; }

banner() {
  cat <<'EOF'
┌─────────────────────────────────────────────┐
│      R A N G E R P L E X   C L E A N U P    │
│    Safely remove local install artifacts    │
└─────────────────────────────────────────────┘
EOF
}

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

if [ ! -f "$PROJECT_ROOT/package.json" ]; then
  fail "Run this script from the project root (package.json not found)."
  exit 1
fi

# Track what gets removed
REMOVED_ITEMS=()
SPACE_FREED=0

banner
log
log "${bold}This script safely removes local install artifacts.${reset}"
log "${dim}Your git repo and source code remain completely intact.${reset}"
log
log "${bold}What can be removed:${reset}"
log "  • ${dim}node_modules${reset} (npm dependencies)"
log "  • ${dim}.env${reset} (API keys)"
log "  • ${dim}Build artifacts${reset} (.vite cache, dist/, etc.)"
log "  • ${dim}npm cache${reset}"
log "  • ${dim}Local data${reset} (SQLite database + JSON backups)"
log

warn "Choose 'Uninstall All' for quick cleanup, or select items individually."
log
read -r -p "Uninstall ALL artifacts? (y/N): " uninstall_all
log

get_size_kb() {
  local path="$1"
  if [ -e "$path" ]; then
    if du -sk "$path" >/dev/null 2>&1; then
      du -sk "$path" 2>/dev/null | cut -f1
    else
      echo "0"
    fi
  else
    echo "0"
  fi
}

remove_path() {
  local path="$1"
  local label="${2:-$(basename "$path")}"
  if [ -e "$path" ]; then
    local size_kb
    size_kb=$(get_size_kb "$path")
    rm -rf "$path"
    ok "Removed $label"
    REMOVED_ITEMS+=("$label")
    SPACE_FREED=$((SPACE_FREED + size_kb))
  else
    log "${dim}Skipped (not found): $label${reset}"
  fi
}

check_running_processes() {
  local has_processes=0
  if command -v lsof >/dev/null 2>&1; then
    if lsof -Pi :3010 -sTCP:LISTEN -t >/dev/null 2>&1; then
      warn "Process running on port 3010 (proxy server)"
      log "${dim}Kill it: lsof -ti:3010 | xargs kill${reset}"
      has_processes=1
    fi
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
      warn "Process running on port 5173 (Vite dev server)"
      log "${dim}Kill it: lsof -ti:5173 | xargs kill${reset}"
      has_processes=1
    fi
  fi

  if [ $has_processes -eq 1 ]; then
    log
    read -r -p "Kill running processes? (y/N): " kill_procs
    if [[ "$kill_procs" =~ ^[Yy]$ ]]; then
      if command -v lsof >/dev/null 2>&1; then
        lsof -ti:3010 2>/dev/null | xargs kill 2>/dev/null && ok "Killed port 3010"
        lsof -ti:5173 2>/dev/null | xargs kill 2>/dev/null && ok "Killed port 5173"
      fi
    fi
    log
  fi
}

# Check for running processes first
check_running_processes

# If uninstall all, skip individual prompts
if [[ "$uninstall_all" =~ ^[Yy]$ ]]; then
  warn "Removing ALL artifacts (except data/backups - will confirm separately)..."
  log

  step "Removing node_modules..."
  remove_path "$PROJECT_ROOT/node_modules" "node_modules"

  step "Removing package-lock.json..."
  remove_path "$PROJECT_ROOT/package-lock.json" "package-lock.json"

  step "Removing .env and backups..."
  remove_path "$PROJECT_ROOT/.env" ".env"
  for env_backup in "$PROJECT_ROOT"/.env.bak.*; do
    [ -e "$env_backup" ] && remove_path "$env_backup" "$(basename "$env_backup")"
  done

  step "Removing build artifacts..."
  remove_path "$PROJECT_ROOT/dist" "dist/"
  remove_path "$PROJECT_ROOT/.vite" ".vite/ cache"
  remove_path "$PROJECT_ROOT/node_modules/.cache" "node_modules/.cache"

  step "Removing OS artifacts..."
  find "$PROJECT_ROOT" -name ".DS_Store" -type f -delete 2>/dev/null && ok "Removed .DS_Store files"

  step "Clearing npm cache..."
  if npm cache clean --force >/dev/null 2>&1; then
    ok "npm cache cleared"
    REMOVED_ITEMS+=("npm cache")
  fi

else
  # Individual prompts
  read -r -p "Remove node_modules? (y/N): " ans_nm
  if [[ "$ans_nm" =~ ^[Yy]$ ]]; then
    step "Removing node_modules..."
    remove_path "$PROJECT_ROOT/node_modules" "node_modules"
  fi

  read -r -p "Remove package-lock.json? (y/N): " ans_lock
  if [[ "$ans_lock" =~ ^[Yy]$ ]]; then
    step "Removing package-lock.json..."
    remove_path "$PROJECT_ROOT/package-lock.json" "package-lock.json"
  fi

  read -r -p "Remove .env (API keys) and backups? (y/N): " ans_env
  if [[ "$ans_env" =~ ^[Yy]$ ]]; then
    step "Removing .env and backups..."
    remove_path "$PROJECT_ROOT/.env" ".env"
    for env_backup in "$PROJECT_ROOT"/.env.bak.*; do
      [ -e "$env_backup" ] && remove_path "$env_backup" "$(basename "$env_backup")"
    done
  fi

  read -r -p "Remove build artifacts (dist/, .vite/, caches)? (y/N): " ans_build
  if [[ "$ans_build" =~ ^[Yy]$ ]]; then
    step "Removing build artifacts..."
    remove_path "$PROJECT_ROOT/dist" "dist/"
    remove_path "$PROJECT_ROOT/.vite" ".vite/ cache"
    remove_path "$PROJECT_ROOT/node_modules/.cache" "node_modules/.cache"
  fi

  read -r -p "Remove OS artifacts (.DS_Store files)? (y/N): " ans_os
  if [[ "$ans_os" =~ ^[Yy]$ ]]; then
    step "Removing OS artifacts..."
    find "$PROJECT_ROOT" -name ".DS_Store" -type f -delete 2>/dev/null && ok "Removed .DS_Store files"
    REMOVED_ITEMS+=(".DS_Store files")
  fi

  read -r -p "Clear npm cache? (y/N): " ans_cache
  if [[ "$ans_cache" =~ ^[Yy]$ ]]; then
    step "Clearing npm cache..."
    if npm cache clean --force >/dev/null 2>&1; then
      ok "npm cache cleared"
      REMOVED_ITEMS+=("npm cache")
    else
      warn "npm cache clean failed"
    fi
  fi
fi

# Always ask about data/backups separately (dangerous!)
log
read -r -p "Remove local data/backups (SQLite + JSON)? (y/N): " ans_data
if [[ "$ans_data" =~ ^[Yy]$ ]]; then
  warn "This deletes your local database and backups!"
  read -r -p "Type DELETE to confirm: " confirm_data
  if [ "$confirm_data" = "DELETE" ]; then
    step "Removing data..."
    remove_path "$PROJECT_ROOT/data" "data/"
    remove_path "$PROJECT_ROOT/backups" "backups/"
  else
    warn "Data deletion canceled."
  fi
fi

# Ollama uninstall option
if command -v ollama >/dev/null 2>&1; then
  log
  warn "Ollama is installed on this system ($(ollama --version))."
  log "${dim}Ollama is independent of RangerPlex. Remove it only if you don't need it.${reset}"
  log
  read -r -p "Uninstall Ollama? (y/N): " ans_ollama
  if [[ "$ans_ollama" =~ ^[Yy]$ ]]; then
    OS="$(uname -s)"
    case "$OS" in
      Darwin)
        log "${dim}macOS Ollama uninstall:${reset}"
        log "  1. Quit Ollama from menu bar"
        log "  2. Delete: /Applications/Ollama.app"
        log "  3. Delete: ~/.ollama/"
        log "  4. Run: launchctl stop com.ollama.ollama"
        warn "Automatic uninstall not implemented. Follow steps above manually."
        ;;
      Linux)
        warn "Stopping Ollama service..."
        sudo systemctl stop ollama 2>/dev/null && ok "Stopped Ollama service"
        warn "Removing Ollama..."
        sudo rm -f /usr/local/bin/ollama 2>/dev/null && ok "Removed /usr/local/bin/ollama"
        sudo rm -rf /usr/share/ollama 2>/dev/null && ok "Removed /usr/share/ollama"
        sudo systemctl disable ollama 2>/dev/null
        sudo rm -f /etc/systemd/system/ollama.service 2>/dev/null
        rm -rf ~/.ollama 2>/dev/null && ok "Removed ~/.ollama"
        ok "Ollama uninstalled (Linux)"
        REMOVED_ITEMS+=("Ollama")
        ;;
      *)
        log "Visit ${bold}https://ollama.com${reset} for uninstall instructions."
        ;;
    esac
  else
    log "${dim}Skipped Ollama uninstall.${reset}"
  fi
fi

# Final summary
log
log "${green}${bold}╔════════════════════════════════════════════════════╗${reset}"
log "${green}${bold}║           CLEANUP COMPLETE! 🎖️                    ║${reset}"
log "${green}${bold}╚════════════════════════════════════════════════════╝${reset}"
log

if [ ${#REMOVED_ITEMS[@]} -gt 0 ]; then
  ok "Removed items:"
  for item in "${REMOVED_ITEMS[@]}"; do
    log "  • $item"
  done
  log

  # Show space freed
  if [ $SPACE_FREED -gt 0 ]; then
    local space_mb=$((SPACE_FREED / 1024))
    local space_gb=$((space_mb / 1024))
    if [ $space_gb -gt 0 ]; then
      ok "Space freed: ~${space_gb}GB (${space_mb}MB)"
    elif [ $space_mb -gt 0 ]; then
      ok "Space freed: ~${space_mb}MB"
    else
      ok "Space freed: ~${SPACE_FREED}KB"
    fi
  fi
else
  log "${dim}No items were removed.${reset}"
fi

log
log "${bold}Next steps:${reset}"
log "  • Reinstall: ${cyan}bash install-me-now.sh${reset}"
log "  • Source code remains intact in: ${dim}$PROJECT_ROOT${reset}"
log "  • Git repo untouched - all your commits are safe!"
log
log "${bold}Rangers lead the way!${reset} 🎖️"
log

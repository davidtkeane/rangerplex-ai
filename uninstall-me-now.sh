#!/usr/bin/env bash

# RangerPlex AI Uninstaller
# Safely remove local install artifacts (node_modules, .env, caches) without touching your git repo.

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

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

if [ ! -f "$PROJECT_ROOT/package.json" ]; then
  fail "Run this script from the project root (package.json not found)."
  exit 1
fi

log "${bold}RangerPlex Uninstaller${reset}"
log "${dim}This removes local install artifacts. Your git repo remains intact.${reset}"

read -r -p "Proceed? (y/N): " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || { warn "Aborted."; exit 0; }

remove_path() {
  local path="$1"
  if [ -e "$path" ]; then
    rm -rf "$path"
    ok "Removed $path"
  else
    log "${dim}Skipped (not found): $path${reset}"
  fi
}

# node_modules
read -r -p "Remove node_modules? (y/N): " ans_nm
if [[ "$ans_nm" =~ ^[Yy]$ ]]; then
  step "Removing node_modules..."
  remove_path "$PROJECT_ROOT/node_modules"
fi

# .env
read -r -p "Remove .env (API keys)? (y/N): " ans_env
if [[ "$ans_env" =~ ^[Yy]$ ]]; then
  step "Removing .env..."
  remove_path "$PROJECT_ROOT/.env"
fi

# npm cache
read -r -p "Clear npm cache? (y/N): " ans_cache
if [[ "$ans_cache" =~ ^[Yy]$ ]]; then
  step "Clearing npm cache..."
  npm cache clean --force >/dev/null 2>&1 && ok "npm cache cleared" || warn "npm cache clean failed"
fi

# data/backups (danger)
read -r -p "Remove local data/backups (SQLite + JSON)? (y/N): " ans_data
if [[ "$ans_data" =~ ^[Yy]$ ]]; then
  warn "This deletes your local database and backups!"
  read -r -p "Type DELETE to confirm: " confirm_data
  if [ "$confirm_data" = "DELETE" ]; then
    step "Removing data..."
    remove_path "$PROJECT_ROOT/data"
    remove_path "$PROJECT_ROOT/backups"
  else
    warn "Data deletion canceled."
  fi
fi

# Ollama reminder
if command -v ollama >/dev/null 2>&1; then
  log
  warn "Ollama is installed on this system."
  log "${dim}If you installed it for RangerPlex and want to remove it:${reset}"
  log "  • macOS: delete the Ollama app or run their uninstall steps"
  log "  • Linux: stop service and see https://ollama.com for uninstall instructions"
fi

log
ok "Uninstall cleanup complete."
log "${dim}To reinstall later: bash install-me-now.sh${reset}"

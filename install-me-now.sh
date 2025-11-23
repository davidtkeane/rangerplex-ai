#!/usr/bin/env bash

# RangerPlex AI Installer
# One-command setup for macOS/Linux/WSL. Installs Node.js 22, npm deps, and guides API key setup.
# Safe defaults: prompts before package installs; writes .env only when you confirm.

set -euo pipefail

###############
# UI Helpers  #
###############
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
│           R A N G E R P L E X   A I         │
│    One-command install with guided setup    │
└─────────────────────────────────────────────┘
EOF
}

spinner() {
  # spinner "Message" cmd...
  local msg="$1"; shift
  local pid
  ("$@") &
  pid=$!
  local frames=('/' '-' '\' '|')
  local i=0
  printf "%s " "$msg"
  while kill -0 "$pid" >/dev/null 2>&1; do
    printf "\r%s %s" "$msg" "${frames[i++ % ${#frames[@]}]}"
    sleep 0.1
  done
  wait "$pid"
  local status=$?
  printf "\r"
  return $status
}

################
# Pre-flight   #
################
banner
log "${bold}Hello there!${reset} Let's get your RangerPlex AI workstation ready."
log "${dim}We'll check OS, install Node.js 22, fetch npm deps, and collect API keys for .env.${reset}"
log

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
  fail "Run this script from the project root (package.json not found)."
  exit 1
fi

OS="$(uname -s)"
PM=""
case "$OS" in
  Darwin) PM="brew" ;;
  Linux)
    if command -v apt >/dev/null 2>&1; then PM="apt"
    elif command -v apt-get >/dev/null 2>&1; then PM="apt-get"
    elif command -v dnf >/dev/null 2>&1; then PM="dnf"
    elif command -v pacman >/dev/null 2>&1; then PM="pacman"
    fi
    ;;
  *)
    fail "Unsupported OS: $OS. Please use macOS or Linux/WSL."
    exit 1
    ;;
esac

###############
# Utilities   #
###############
ensure_pkg() {
  local name="$1"
  local pkg="${2:-$1}"
  if command -v "$name" >/dev/null 2>&1; then
    ok "$name already installed."
    return 0
  fi
  if [ -z "$PM" ]; then
    fail "$name is missing and no package manager was detected. Install it manually and re-run."
    return 1
  fi
  warn "$name not found. Install $pkg via $PM? (y/N)"
  read -r reply
  if [[ ! "$reply" =~ ^[Yy]$ ]]; then
    fail "Cannot continue without $name."
    exit 1
  fi
  case "$PM" in
    brew) spinner "Installing $pkg..." brew install "$pkg" ;;
    apt|apt-get) spinner "Installing $pkg..." sudo "$PM" update && sudo "$PM" install -y "$pkg" ;;
    dnf) spinner "Installing $pkg..." sudo dnf install -y "$pkg" ;;
    pacman) spinner "Installing $pkg..." sudo pacman -Sy --noconfirm "$pkg" ;;
  esac
  ok "$name installed."
}

########################
# Node.js via nvm      #
########################
install_nvm() {
  warn "nvm not found. Install nvm? (recommended) (y/N)"
  read -r reply
  if [[ ! "$reply" =~ ^[Yy]$ ]]; then
    fail "nvm required to install Node.js 22 safely. Please install manually."
    exit 1
  fi
  spinner "Installing nvm..." bash -c "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
  # shellcheck source=/dev/null
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  ok "nvm installed."
}

ensure_node() {
  # Prefer Node 22.x
  if command -v node >/dev/null 2>&1; then
    local ver
    ver="$(node -v | sed 's/^v//')"
    if [[ "$ver" == 22.* ]]; then
      ok "Node.js $ver detected (meets requirement)."
      return
    else
      warn "Node.js v$ver detected; v22.x is recommended. Install v22 with nvm? (y/N)"
      read -r reply
      if [[ ! "$reply" =~ ^[Yy]$ ]]; then
        warn "Continuing with Node $ver (may break native modules like better-sqlite3)."
        return
      fi
    fi
  fi

  if ! command -v nvm >/dev/null 2>&1; then
    install_nvm
  else
    # shellcheck source=/dev/null
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  fi

  spinner "Installing Node.js v22 (via nvm)..." nvm install 22
  nvm use 22
  ok "Node.js $(node -v) ready."
}

########################
# Dependency install   #
########################
prepare_deps() {
  cd "$PROJECT_ROOT"
  if [ -d node_modules ]; then
    warn "Existing node_modules detected. Reinstall to match lockfile? (y/N)"
    read -r reply
    if [[ "$reply" =~ ^[Yy]$ ]]; then
      rm -rf node_modules
    fi
  fi
  spinner "Installing npm dependencies (npm ci)..." npm ci
  ok "Dependencies installed."
}

########################
# API key collection   #
########################
collect_env() {
  local env_file="$PROJECT_ROOT/.env"
  if [ ! -f "$env_file" ]; then
    touch "$env_file"
  else
    cp "$env_file" "$env_file.bak.$(date +%s)"
    warn "Backed up existing .env to $(basename "$env_file").bak.$(date +%s)"
  fi

  declare -a providers=(
    "Brave Search|BRAVE_API_KEY|https://brave.com/search/api"
    "OpenAI|OPENAI_API_KEY|https://platform.openai.com/api-keys"
    "Anthropic|ANTHROPIC_API_KEY|https://console.anthropic.com"
    "Perplexity|PERPLEXITY_API_KEY|https://www.perplexity.ai/settings/api"
    "Hugging Face|HUGGINGFACE_API_KEY|https://huggingface.co/settings/tokens"
    "xAI (Grok)|XAI_API_KEY|https://console.x.ai"
    "ElevenLabs (Voice)|ELEVENLABS_API_KEY|https://elevenlabs.io/app/speech-synthesis"
  )

  log
  step "API key setup (press ENTER to skip any provider)."
  for entry in "${providers[@]}"; do
    IFS='|' read -r name var url <<<"$entry"
    log
    log "${bold}${name}${reset} — ${dim}${url}${reset}"
    printf "Paste %s (or leave blank to skip): " "$name"
    read -r key
    if [ -n "$key" ]; then
      # Escape single quotes
      sanitized="${key//\'/}"
      # Remove existing line
      grep -v "^$var=" "$env_file" > "$env_file.tmp" || true
      mv "$env_file.tmp" "$env_file"
      echo "${var}=${sanitized}" >> "$env_file"
      ok "Saved $var to .env"
    else
      warn "Skipped $name. You can add it later in .env."
    fi
  done
}

########################
# Main sequence        #
########################
step "Checking essentials (curl, git)..."
ensure_pkg curl
ensure_pkg git

step "Ensuring Node.js 22.x..."
ensure_node

step "Installing project dependencies..."
prepare_deps

step "Collecting API keys into .env..."
collect_env

log
ok "All done! Next steps:"
log "  Option 1 (RECOMMENDED): ${bold}npm start${reset}"
log "    • Runs BOTH servers (proxy + Vite) in one command."
log "  Option 2 (manual):"
log "    • Terminal 1: ${bold}npm run server${reset}"
log "    • Terminal 2: ${bold}npm run dev${reset}"
log "  Visit ${bold}http://localhost:5173${reset} once running."
log "  Always use ${bold}npm start${reset}, brother — that's the command that starts everything you need! 🎖️"
log
log "${dim}If you added a new Node via nvm, open a fresh terminal or run 'source ~/.nvm/nvm.sh' before 'npm start'.${reset}"

#!/usr/bin/env bash

# RangerPlex AI Installer (v2.4.2)
# One-command setup for macOS/Linux/WSL. Installs Node.js 22, npm deps, and guides API key setup.
# Safe defaults: prompts before package installs; writes .env only when you confirm.
#
# IMPROVEMENTS (v2.4.2):
# ✅ FIXED: Added VITE_ prefix to ALL environment variables (CRITICAL - was broken!)
# ✅ FIXED: Corrected variable names to match app expectations
# ✅ ADDED: Gemini API key collection (was missing!)
# ✅ ADDED: better-sqlite3 rebuild after npm ci
# ✅ ADDED: Port availability check (3010, 5173)
# ✅ ADDED: Verification that at least one AI provider is configured
# ✅ ADDED: ESSENTIAL vs OPTIONAL provider labels
# ✅ IMPROVED: Better final output with clear next steps
# ✅ IMPROVED: Key sanitization (removes quotes and whitespace)
#
# Variable name mappings (app expects these exact names):
#   VITE_GEMINI_API_KEY          - Gemini (Google AI)
#   VITE_OPENAI_API_KEY          - OpenAI (GPT-4)
#   VITE_ANTHROPIC_API_KEY       - Anthropic (Claude)
#   VITE_PERPLEXITY_API_KEY      - Perplexity
#   VITE_BRAVE_SEARCH_API_KEY    - Brave Search (web search)
#   VITE_HUGGINGFACE_ACCESS_TOKEN - Hugging Face (note: ACCESS_TOKEN not API_KEY)
#   VITE_GROK_API_KEY            - xAI Grok
#   VITE_ELEVENLABS_API_KEY      - ElevenLabs (voice synthesis)

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

check_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    if lsof -Pi ":$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
      return 1
    fi
  elif command -v netstat >/dev/null 2>&1; then
    if netstat -an | grep -q ":$port.*LISTEN"; then
      return 1
    fi
  fi
  return 0
}

verify_ports() {
  step "Checking if ports 3010 and 5173 are available..."
  local port_issues=0

  if ! check_port 3010; then
    warn "Port 3010 (proxy server) is already in use."
    log "${dim}Kill the process: lsof -ti:3010 | xargs kill${reset}"
    port_issues=1
  else
    ok "Port 3010 available."
  fi

  if ! check_port 5173; then
    warn "Port 5173 (Vite dev server) is already in use."
    log "${dim}Kill the process: lsof -ti:5173 | xargs kill${reset}"
    port_issues=1
  else
    ok "Port 5173 available."
  fi

  if [ $port_issues -eq 1 ]; then
    warn "Ports are in use. Stop them before running 'npm start'."
  fi
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
# Ollama (Optional)    #
########################
check_ollama() {
  if command -v ollama >/dev/null 2>&1; then
    ok "Ollama already installed ($(ollama --version))."
    return 0
  fi

  log
  warn "Ollama not detected. Ollama enables local AI models (Llama, Mistral, DeepSeek, etc.)."
  log "${dim}Ollama is OPTIONAL - RangerPlex works with cloud models (Gemini, Claude, GPT).${reset}"
  log "${dim}But if you want privacy-first local AI, Ollama is the way!${reset}"
  printf "Install Ollama now? (y/N): "
  read -r reply
  if [[ ! "$reply" =~ ^[Yy]$ ]]; then
    log "${dim}Skipped Ollama. Install later from https://ollama.com${reset}"
    return 0
  fi

  case "$OS" in
    Darwin)
      log "Opening Ollama download page in your browser..."
      log "${dim}Download the .dmg, drag to Applications, then run Ollama from there.${reset}"
      open "https://ollama.com/download/mac" 2>/dev/null || log "Visit: https://ollama.com/download/mac"
      ;;
    Linux)
      log "Installing Ollama via official script..."
      if curl -fsSL https://ollama.com/install.sh | sh; then
        ok "Ollama installed successfully!"
        log "${dim}Start Ollama: OLLAMA_ORIGINS=\"*\" ollama serve${reset}"
      else
        warn "Ollama installation failed. Visit https://ollama.com for manual install."
      fi
      ;;
    *)
      log "Visit https://ollama.com to download Ollama for your system."
      ;;
  esac
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

  # Rebuild better-sqlite3 for current Node version
  step "Rebuilding better-sqlite3 for Node.js $(node -v)..."
  if npm rebuild better-sqlite3 >/dev/null 2>&1; then
    ok "Database module rebuilt successfully."
  else
    warn "Failed to rebuild better-sqlite3 (may cause database issues)."
  fi
}

########################
# API key collection   #
########################
collect_env() {
  local env_file="$PROJECT_ROOT/.env"
  if [ ! -f "$env_file" ]; then
    touch "$env_file"
  else
    local backup_name="$env_file.bak.$(date +%s)"
    cp "$env_file" "$backup_name"
    warn "Backed up existing .env to $(basename "$backup_name")"
  fi

  # IMPORTANT: All variables MUST have VITE_ prefix to work with Vite!
  declare -a providers=(
    "Gemini (Google AI)|VITE_GEMINI_API_KEY|https://aistudio.google.com/app/apikey|ESSENTIAL"
    "OpenAI (GPT-4)|VITE_OPENAI_API_KEY|https://platform.openai.com/api-keys|ESSENTIAL"
    "Anthropic (Claude)|VITE_ANTHROPIC_API_KEY|https://console.anthropic.com/settings/keys|ESSENTIAL"
    "Perplexity|VITE_PERPLEXITY_API_KEY|https://www.perplexity.ai/settings/api|OPTIONAL"
    "Brave Search (Web Search)|VITE_BRAVE_SEARCH_API_KEY|https://brave.com/search/api|OPTIONAL"
    "Hugging Face|VITE_HUGGINGFACE_ACCESS_TOKEN|https://huggingface.co/settings/tokens|OPTIONAL"
    "xAI Grok|VITE_GROK_API_KEY|https://console.x.ai|OPTIONAL"
    "ElevenLabs (Voice)|VITE_ELEVENLABS_API_KEY|https://elevenlabs.io/app/speech-synthesis|OPTIONAL"
  )

  log
  step "API key setup (press ENTER to skip any provider)."
  log "${dim}Tip: At minimum, add ONE of: Gemini, OpenAI, or Claude to use the app.${reset}"
  log

  for entry in "${providers[@]}"; do
    IFS='|' read -r name var url priority <<<"$entry"
    log
    if [ "$priority" = "ESSENTIAL" ]; then
      log "${bold}${green}${name}${reset} ${dim}[$priority]${reset} — ${dim}${url}${reset}"
    else
      log "${bold}${name}${reset} ${dim}[$priority]${reset} — ${dim}${url}${reset}"
    fi
    printf "Paste API key for %s (or leave blank to skip): " "$name"
    read -r key
    if [ -n "$key" ]; then
      # Remove any surrounding quotes and whitespace
      sanitized="${key//\'/}"
      sanitized="${sanitized//\"/}"
      sanitized="$(echo "$sanitized" | xargs)"
      # Remove existing line if present
      grep -v "^$var=" "$env_file" > "$env_file.tmp" 2>/dev/null || touch "$env_file.tmp"
      mv "$env_file.tmp" "$env_file"
      # Write new line
      echo "${var}=${sanitized}" >> "$env_file"
      ok "Saved $var to .env"
    else
      if [ "$priority" = "ESSENTIAL" ]; then
        warn "Skipped $name. You'll need at least one AI provider to use RangerPlex!"
      else
        log "${dim}Skipped $name. Add it later in .env if needed.${reset}"
      fi
    fi
  done

  log
  ok "API keys saved to .env with VITE_ prefix (required for Vite build system)."

  # Check if at least one essential provider was added
  local has_provider=0
  for essential in "VITE_GEMINI_API_KEY" "VITE_OPENAI_API_KEY" "VITE_ANTHROPIC_API_KEY"; do
    if grep -q "^$essential=" "$env_file" 2>/dev/null; then
      has_provider=1
      break
    fi
  done

  if [ $has_provider -eq 0 ]; then
    warn "No AI provider API keys detected!"
    log "${dim}You'll need to add at least one of these to .env:${reset}"
    log "${dim}  • VITE_GEMINI_API_KEY${reset}"
    log "${dim}  • VITE_OPENAI_API_KEY${reset}"
    log "${dim}  • VITE_ANTHROPIC_API_KEY${reset}"
    log "${dim}Or add them in Settings after starting the app.${reset}"
  else
    ok "At least one AI provider configured."
  fi
}

########################
# Main sequence        #
########################
step "Checking essentials (curl, git)..."
ensure_pkg curl
ensure_pkg git

step "Ensuring Node.js 22.x..."
ensure_node

step "Checking for Ollama (optional local AI)..."
check_ollama

step "Installing project dependencies..."
prepare_deps

step "Collecting API keys into .env..."
collect_env

log
verify_ports

log
log "${green}${bold}╔════════════════════════════════════════════════════╗${reset}"
log "${green}${bold}║   🎖️  INSTALLATION COMPLETE! RANGERS READY! 🎖️    ║${reset}"
log "${green}${bold}╚════════════════════════════════════════════════════╝${reset}"
log
ok "RangerPlex AI is ready to deploy!"
log
log "${bold}▶ QUICK START (RECOMMENDED):${reset}"
log "  ${cyan}${bold}npm start${reset}"
log "  ${dim}↳ Runs BOTH servers (proxy + Vite) in one command${reset}"
log
log "${bold}▶ MANUAL START (if you prefer two terminals):${reset}"
log "  ${dim}Terminal 1:${reset} ${cyan}npm run server${reset}  ${dim}(proxy + database)${reset}"
log "  ${dim}Terminal 2:${reset} ${cyan}npm run dev${reset}     ${dim}(Vite frontend)${reset}"
log
log "${bold}▶ OPEN IN BROWSER:${reset}"
log "  ${cyan}${bold}http://localhost:5173${reset}"
log
log "${bold}📝 NEXT STEPS:${reset}"
log "  1. Run ${bold}npm start${reset} to launch RangerPlex"
log "  2. Open ${bold}http://localhost:5173${reset} in your browser"
log "  3. Test your API keys in Settings (⚙️ gear icon)"
log "  4. Start chatting with your AI squad! 🚀"
log
if [ -f "$PROJECT_ROOT/.env" ]; then
  log "${dim}💡 Tip: Your API keys are in .env (gitignored, safe)${reset}"
  log "${dim}   Add more keys anytime by editing .env with VITE_ prefix${reset}"
fi
log
log "${dim}If you installed Node via nvm, you may need to:${reset}"
log "${dim}  • Open a fresh terminal OR${reset}"
log "${dim}  • Run: source ~/.nvm/nvm.sh${reset}"
log
log "${bold}Rangers lead the way!${reset} 🎖️"
log

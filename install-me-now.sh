#!/usr/bin/env bash

# RangerPlex AI Installer (v2.5.28)
# One-command setup for macOS/Linux/WSL. Installs Node.js 22, PM2, npm deps, and guides API key setup.
# Safe defaults: prompts before package installs; writes .env only when you confirm.
#
# IMPROVEMENTS (v2.5.28):
# ✅ ADDED: Beautiful colorful ASCII banner with RANGERPLEX branding
# ✅ ADDED: Welcome message thanking users for downloading
# ✅ ADDED: Documentation references (/manual command, rangerplex_manual.md)
# ✅ ADDED: Shell alias setup (auto-detects zsh/bash, adds "rangerplex" alias)
# ✅ ADDED: Interactive "Start now?" prompt with auto-start option
# ✅ ADDED: Organized API dashboard links (16 services in 4 categories)
# ✅ IMPROVED: Comprehensive UX - from welcome to running in one flow
#
# PREVIOUS (v2.5.27+):
# ✅ ADDED: PM2 process manager installation (enables zero-downtime auto-restart)
# ✅ ADDED: PM2 command instructions (pm2:start, pm2:status, pm2:logs, etc.)
# ✅ IMPROVED: Recommended start command now uses PM2 for production-ready deployment
#
# PREVIOUS (v2.5.26):
# ✅ ADDED: Node.js v25+ detection with mandatory downgrade requirement
# ✅ ADDED: Automatic native module rebuild when Node version changes
# ✅ ADDED: Node version tracking (.node_version file in node_modules)
# ✅ IMPROVED: Full npm rebuild (all native modules, not just better-sqlite3)
# ✅ IMPROVED: Clear error messages for incompatible Node versions
#
# PREVIOUS (v2.4.2):
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
  cat <<EOF
${cyan}╔═══════════════════════════════════════════════════════════════════════╗${reset}
${cyan}║${reset}                                                                       ${cyan}║${reset}
${cyan}║${reset}  ${bold}${green}██████╗  █████╗ ███╗   ██╗ ██████╗ ███████╗██████╗ ██████╗ ██╗     ███████╗██╗  ██╗${reset}  ${cyan}║${reset}
${cyan}║${reset}  ${bold}${green}██╔══██╗██╔══██╗████╗  ██║██╔════╝ ██╔════╝██╔══██╗██╔══██╗██║     ██╔════╝╚██╗██╔╝${reset}  ${cyan}║${reset}
${cyan}║${reset}  ${bold}${green}██████╔╝███████║██╔██╗ ██║██║  ███╗█████╗  ██████╔╝██████╔╝██║     █████╗   ╚███╔╝${reset}   ${cyan}║${reset}
${cyan}║${reset}  ${bold}${green}██╔══██╗██╔══██║██║╚██╗██║██║   ██║██╔══╝  ██╔══██╗██╔═══╝ ██║     ██╔══╝   ██╔██╗${reset}   ${cyan}║${reset}
${cyan}║${reset}  ${bold}${green}██║  ██║██║  ██║██║ ╚████║╚██████╔╝███████╗██║  ██║██║     ███████╗███████╗██╔╝ ██╗${reset}  ${cyan}║${reset}
${cyan}║${reset}  ${bold}${green}╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚══════╝╚═╝  ╚═╝${reset}  ${cyan}║${reset}
${cyan}║${reset}                                                                       ${cyan}║${reset}
${cyan}║${reset}            ${bold}${yellow}🎖️  Multi-AI Command Center with Local AI Power 🎖️${reset}             ${cyan}║${reset}
${cyan}║${reset}                                                                       ${cyan}║${reset}
${cyan}║${reset}               ${dim}Gemini • Claude • GPT • Grok • Perplexity${reset}              ${cyan}║${reset}
${cyan}║${reset}               ${dim}Ollama • LM Studio • HuggingFace • Brave${reset}              ${cyan}║${reset}
${cyan}║${reset}                                                                       ${cyan}║${reset}
${cyan}╚═══════════════════════════════════════════════════════════════════════╝${reset}

${bold}${green}🎉 Thank you for downloading RangerPlex AI!${reset}

${dim}This installer will guide you through:${reset}
  ${cyan}•${reset} Node.js 22.x setup (via nvm)
  ${cyan}•${reset} PM2 process manager (zero-downtime updates!)
  ${cyan}•${reset} Ollama & LM Studio (optional local AI)
  ${cyan}•${reset} API key collection for cloud providers
  ${cyan}•${reset} Automatic alias setup (type ${bold}rangerplex${reset}${dim} to start anytime)${reset}

${bold}${yellow}📚 Documentation:${reset}
  ${cyan}•${reset} Type ${bold}/manual${reset} in chat for the complete user guide
  ${cyan}•${reset} Or read: ${bold}rangerplex_manual.md${reset} in project folder
  ${cyan}•${reset} README.md has quick start guide and features list

${bold}${green}Let's get started!${reset} 🚀

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
    local major_ver="${ver%%.*}"

    if [[ "$ver" == 22.* ]]; then
      ok "Node.js $ver detected (meets requirement)."
      return
    elif [[ "$major_ver" -ge 25 ]]; then
      fail "Node.js v$ver detected - TOO NEW!"
      log "${red}${bold}Node v25+ breaks native modules (better-sqlite3).${reset}"
      log "${dim}This is a known incompatibility. You MUST downgrade to v22.${reset}"
      warn "Install Node v22 with nvm? (REQUIRED) (y/N)"
      read -r reply
      if [[ ! "$reply" =~ ^[Yy]$ ]]; then
        fail "Cannot continue with Node v$ver. Please install Node v22."
        exit 1
      fi
    else
      warn "Node.js v$ver detected; v22.x is recommended. Install v22 with nvm? (y/N)"
      read -r reply
      if [[ ! "$reply" =~ ^[Yy]$ ]]; then
        warn "Continuing with Node $ver (may break native modules like better-sqlite3)."
        log "${dim}We'll rebuild native modules to be safe...${reset}"
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
# PM2 Process Manager  #
########################
install_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    ok "PM2 already installed ($(pm2 -v))."
    return 0
  fi

  step "Installing PM2 process manager (enables zero-downtime restarts)..."
  if npm install -g pm2 >/dev/null 2>&1; then
    ok "PM2 installed globally."
  else
    warn "PM2 global install failed. Will use local PM2 from node_modules."
  fi
}

####################################
# Local AI Providers (Optional)   #
####################################
check_ollama() {
  if command -v ollama >/dev/null 2>&1; then
    ok "Ollama already installed ($(ollama --version))."
    return 0
  fi

  log
  warn "Ollama not detected. Ollama enables local AI models (Llama, Mistral, DeepSeek, etc.)."
  log "${dim}Ollama is OPTIONAL - RangerPlex works with cloud models (Gemini, Claude, GPT).${reset}"
  log "${dim}But if you want privacy-first local AI, Ollama is the way!${reset}"
  log
  log "${dim}💡 Alternative: LM Studio provides a GUI for local models${reset}"
  log "${dim}   Download from: ${cyan}https://lmstudio.ai/${reset}"
  log
  printf "Install Ollama now? (y/N): "
  read -r reply
  if [[ ! "$reply" =~ ^[Yy]$ ]]; then
    log "${dim}Skipped Ollama. Install later from:${reset}"
    log "${dim}   • Ollama: ${cyan}https://ollama.com${reset}"
    log "${dim}   • LM Studio: ${cyan}https://lmstudio.ai/${reset}"
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
  local needs_full_rebuild=0

  # Check if node_modules exists and if Node version has changed
  if [ -d node_modules ]; then
    # Check if .node_version file exists (we'll create it to track Node version)
    if [ -f node_modules/.node_version ]; then
      local saved_version
      saved_version="$(cat node_modules/.node_version)"
      local current_version
      current_version="$(node -v)"

      if [ "$saved_version" != "$current_version" ]; then
        warn "Node.js version changed: $saved_version → $current_version"
        log "${dim}Native modules must be rebuilt for the new Node.js version.${reset}"
        needs_full_rebuild=1
      fi
    fi

    if [ $needs_full_rebuild -eq 0 ]; then
      warn "Existing node_modules detected. Reinstall to match lockfile? (y/N)"
      read -r reply
      if [[ "$reply" =~ ^[Yy]$ ]]; then
        rm -rf node_modules
      fi
    else
      log "${bold}Automatically rebuilding all native modules...${reset}"
    fi
  fi

  spinner "Installing npm dependencies (npm install)..." npm install
  ok "Dependencies installed."

  # Save current Node version for future checks
  node -v > node_modules/.node_version

  # Rebuild all native modules for current Node version
  step "Rebuilding native modules for Node.js $(node -v)..."
  if npm rebuild >/dev/null 2>&1; then
    ok "All native modules rebuilt successfully."
  else
    warn "Some native modules failed to rebuild."
    log "${dim}Trying to rebuild better-sqlite3 specifically...${reset}"
    if npm rebuild better-sqlite3 >/dev/null 2>&1; then
      ok "Database module (better-sqlite3) rebuilt successfully."
    else
      fail "Failed to rebuild better-sqlite3 (database may not work)."
      log "${dim}Try manually: npm rebuild better-sqlite3${reset}"
    fi
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

  # Show helpful dashboard links organized by category
  log
  log "${bold}${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}"
  log "${bold}          📋 API Dashboard Links (Clickable in Terminal)${reset}"
  log "${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}"
  log
  log "${bold}🤖 AI Providers (ESSENTIAL - Need at least ONE):${reset}"
  log "   ${green}•${reset} Google AI Studio:  ${cyan}https://aistudio.google.com/${reset}"
  log "   ${green}•${reset} Google Cloud:      ${cyan}https://console.cloud.google.com/${reset}"
  log "   ${green}•${reset} Google Developers: ${cyan}https://developers.google.com/${reset}"
  log "   ${green}•${reset} OpenAI Platform:   ${cyan}https://platform.openai.com/${reset}"
  log "   ${green}•${reset} Anthropic Console: ${cyan}https://console.anthropic.com/${reset}"
  log
  log "${bold}🔍 Search & Intelligence (OPTIONAL):${reset}"
  log "   ${yellow}•${reset} Perplexity:        ${cyan}https://www.perplexity.ai/${reset}"
  log "   ${yellow}•${reset} Brave Search:      ${cyan}https://api-dashboard.search.brave.com/${reset}"
  log "   ${yellow}•${reset} xAI Grok:          ${cyan}https://console.x.ai/${reset}"
  log
  log "${bold}🔐 Security & Network APIs (OPTIONAL):${reset}"
  log "   ${yellow}•${reset} HaveIBeenPwned:    ${cyan}https://haveibeenpwned.com/${reset}"
  log "   ${yellow}•${reset} Shodan:            ${cyan}https://account.shodan.io/${reset}"
  log "   ${yellow}•${reset} IPInfo:            ${cyan}https://ipinfo.io/${reset}"
  log "   ${yellow}•${reset} Numverify:         ${cyan}https://numverify.com/${reset}"
  log "   ${yellow}•${reset} Abstract API:      ${cyan}https://app.abstractapi.com/${reset}"
  log
  log "${bold}🖥️  Local AI (NO API KEY NEEDED):${reset}"
  log "   ${green}•${reset} Ollama (Mac):      ${cyan}https://ollama.com/download/mac${reset}"
  log "   ${green}•${reset} Ollama (Windows):  ${cyan}https://ollama.com/download/windows${reset}"
  log "   ${green}•${reset} LM Studio:         ${cyan}https://lmstudio.ai/${reset}"
  log
  log "${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}"
  log

  # IMPORTANT: All variables MUST have VITE_ prefix to work with Vite!
  declare -a providers=(
    "Gemini (Google AI)|VITE_GEMINI_API_KEY|https://aistudio.google.com/app/apikey|ESSENTIAL"
    "OpenAI (GPT-4)|VITE_OPENAI_API_KEY|https://platform.openai.com/api-keys|ESSENTIAL"
    "Anthropic (Claude)|VITE_ANTHROPIC_API_KEY|https://console.anthropic.com/settings/keys|ESSENTIAL"
    "Perplexity|VITE_PERPLEXITY_API_KEY|https://www.perplexity.ai/settings/api|OPTIONAL"
    "Brave Search (Web Search)|VITE_BRAVE_SEARCH_API_KEY|https://api-dashboard.search.brave.com/|OPTIONAL"
    "Hugging Face|VITE_HUGGINGFACE_ACCESS_TOKEN|https://huggingface.co/settings/tokens|OPTIONAL"
    "xAI Grok|VITE_GROK_API_KEY|https://console.x.ai/|OPTIONAL"
    "ElevenLabs (Voice)|VITE_ELEVENLABS_API_KEY|https://elevenlabs.io/app/speech-synthesis|OPTIONAL"
  )

  log
  step "API key setup (press ENTER to skip any provider)."
  log "${dim}Tip: At minimum, add ONE of: Gemini, OpenAI, or Claude to use the app.${reset}"
  log "${dim}     Security APIs (HIBP, Shodan, IPInfo, etc.) can be added later in Settings.${reset}"
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

####################################
# Shell Alias Setup                #
####################################
setup_alias() {
  log
  step "Setting up ${bold}rangerplex${reset} alias..."

  # Detect shell
  local shell_config=""
  local shell_name=""

  if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "$(command -v zsh)" ]; then
    shell_config="$HOME/.zshrc"
    shell_name="zsh"
  elif [ -n "$BASH_VERSION" ] || [ "$SHELL" = "$(command -v bash)" ]; then
    shell_config="$HOME/.bashrc"
    shell_name="bash"
  else
    warn "Could not detect shell (zsh/bash). Skipping alias setup."
    log "${dim}You can manually add: alias rangerplex='cd \"$PROJECT_ROOT\" && npm run pm2:start'${reset}"
    return
  fi

  # Check if alias already exists
  if [ -f "$shell_config" ] && grep -q "alias rangerplex=" "$shell_config" 2>/dev/null; then
    ok "Alias 'rangerplex' already exists in $shell_name config."
    return
  fi

  # Add alias to shell config
  log "${dim}Adding alias to $shell_config...${reset}"
  cat >> "$shell_config" <<EOF

# RangerPlex AI alias (added by installer)
alias rangerplex='cd "$PROJECT_ROOT" && npm run pm2:start'
EOF

  ok "Alias 'rangerplex' added to $shell_name config!"
  log "${dim}Usage: Just type ${bold}rangerplex${reset}${dim} from anywhere to start RangerPlex${reset}"
  log "${dim}Note: Open a new terminal or run: ${bold}source $shell_config${reset}"
}

########################
# Main sequence        #
########################
step "Checking essentials (curl, git)..."
ensure_pkg curl
ensure_pkg git

step "Ensuring Node.js 22.x..."
ensure_node

step "Installing PM2 process manager..."
install_pm2

step "Checking for Ollama (optional local AI)..."
check_ollama

step "Installing project dependencies..."
prepare_deps

step "Collecting API keys into .env..."
collect_env

log
verify_ports

# Setup shell alias
setup_alias

log
log "${green}${bold}╔════════════════════════════════════════════════════╗${reset}"
log "${green}${bold}║   🎖️  INSTALLATION COMPLETE! RANGERS READY! 🎖️    ║${reset}"
log "${green}${bold}╚════════════════════════════════════════════════════╝${reset}"
log
ok "RangerPlex AI is ready to deploy!"
log
log "${bold}${yellow}📚 Quick Reference:${reset}"
log "  ${cyan}•${reset} Type ${bold}/manual${reset} in chat for complete user guide"
log "  ${cyan}•${reset} Read ${bold}rangerplex_manual.md${reset} for detailed documentation"
log "  ${cyan}•${reset} Use ${bold}rangerplex${reset} alias from anywhere to start (after new terminal)"
log
log "${bold}${cyan}▶ PM2 COMMANDS (for future use):${reset}"
log "  ${cyan}npm run pm2:start${reset}    ${dim}→ Start RangerPlex${reset}"
log "  ${cyan}npm run pm2:stop${reset}     ${dim}→ Stop all servers${reset}"
log "  ${cyan}npm run pm2:status${reset}   ${dim}→ Check server status${reset}"
log "  ${cyan}npm run pm2:logs${reset}     ${dim}→ View real-time logs${reset}"
log "  ${cyan}npm run pm2:restart${reset}  ${dim}→ Restart servers${reset}"
log
log "${bold}${cyan}▶ BROWSER ACCESS:${reset}"
log "  ${bold}${green}http://localhost:5173${reset}"
log
if [ -f "$PROJECT_ROOT/.env" ]; then
  log "${dim}💡 Tip: Your API keys are in .env (gitignored, safe)${reset}"
  log "${dim}   Add more keys anytime in Settings or by editing .env${reset}"
  log
fi
log "${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}"
log
log "${bold}${green}🚀 Ready to launch RangerPlex now?${reset}"
log
printf "${bold}Start RangerPlex with PM2? (Y/n): ${reset}"
read -r start_now

if [[ ! "$start_now" =~ ^[Nn]$ ]]; then
  log
  step "Starting RangerPlex with PM2..."
  log

  cd "$PROJECT_ROOT"
  npm run pm2:start

  local pm2_exit=$?
  log

  if [ $pm2_exit -eq 0 ]; then
    log "${green}${bold}╔═══════════════════════════════════════════════════╗${reset}"
    log "${green}${bold}║              🎉 RANGERPLEX IS LIVE! 🎉            ║${reset}"
    log "${green}${bold}╚═══════════════════════════════════════════════════╝${reset}"
    log
    ok "Servers are running in background via PM2 daemon!"
    log
    log "${bold}${green}➜ Open in browser:${reset} ${cyan}${bold}http://localhost:5173${reset}"
    log
    log "${dim}💡 You can close this terminal - servers will keep running!${reset}"
    log "${dim}   View logs anytime: ${bold}npm run pm2:logs${reset}"
    log "${dim}   Stop servers: ${bold}npm run pm2:stop${reset}"
    log
  else
    warn "PM2 start had issues. Try manually: ${bold}npm run pm2:start${reset}"
    log "${dim}Or fallback to: ${bold}npm start${reset}"
  fi
else
  log
  ok "Skipped auto-start. Ready when you are!"
  log
  log "${bold}${yellow}To start RangerPlex:${reset}"
  log "  ${cyan}${bold}npm run pm2:start${reset}  ${dim}(recommended - background daemon)${reset}"
  log "  ${dim}Or just type: ${bold}rangerplex${reset}${dim} (after opening new terminal)${reset}"
  log
  log "${dim}If you installed Node via nvm, you may need to:${reset}"
  log "${dim}  • Open a fresh terminal OR${reset}"
  log "${dim}  • Run: ${bold}source ~/.nvm/nvm.sh${reset}"
  log
fi

log
log "${bold}${green}Rangers lead the way!${reset} 🎖️"
log

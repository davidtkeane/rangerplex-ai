#!/usr/bin/env bash

# RangerPlex AI Installer (v2.6.0)
# One-command setup for macOS/Linux/WSL. Installs Node.js 22, PM2, npm deps, and guides API key setup.
# Safe defaults: prompts before package installs; writes .env only when you confirm.
#
# IMPROVEMENTS (v2.6.0):
# ✅ NEW: Smart OS/distro detection (macOS, Ubuntu, Kali, Debian, Fedora, Arch, Alpine, openSUSE, CentOS/RHEL, Raspberry Pi, WSL)
# ✅ NEW: Cool system info box showing OS, arch, package manager, shell, and WSL status
# ✅ NEW: Alpine (apk) and openSUSE (zypper) package manager support
# ✅ NEW: Auto-install via Homebrew on macOS (Docker, Ollama, LM Studio)
# ✅ NEW: Auto-install Ollama on Linux via official script
# ✅ KEPT: Existing install flow (Node, PM2, deps, key prompts, service checks) unchanged after preflight.
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
  ${cyan}•${reset} Docker Desktop (WordPress hosting + containers!)
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
  local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
  local i=0
  
  # Hide cursor
  tput civis 2>/dev/null || true
  
  while kill -0 "$pid" >/dev/null 2>&1; do
    printf "\r${cyan}%s${reset} %s" "${frames[i++ % ${#frames[@]}]}" "$msg"
    sleep 0.1
  done
  
  wait "$pid"
  local status=$?
  
  # Show cursor
  tput cnorm 2>/dev/null || true
  
  if [ $status -eq 0 ]; then
    printf "\r${green}✓${reset} %s\n" "$msg"
  else
    printf "\r${red}✗${reset} %s\n" "$msg"
  fi
  return $status
}

progress_bar() {
    local duration=${1}
    local prefix=${2}
    local width=40
    local progress=0
    local step_size=$((100 / (duration * 10))) # Update every 0.1s

    tput civis 2>/dev/null || true
    
    while [ $progress -le 100 ]; do
        local filled=$((progress * width / 100))
        local empty=$((width - filled))
        
        printf "\r${cyan}%s${reset} [" "$prefix"
        printf "%${filled}s" | tr ' ' '█'
        printf "%${empty}s" | tr ' ' '░'
        printf "] %d%%" "$progress"
        
        progress=$((progress + 1))
        sleep 0.01
    done
    printf "\n"
    tput cnorm 2>/dev/null || true
}

###########################
# OS / Distro Detection   #
###########################
DISTRO_NAME="Unknown"
DISTRO_VERSION=""
DISTRO_PRETTY="Unknown"
ARCH="$(uname -m)"
IS_WSL="No"
PKG_MANAGER=""

detect_distro() {
  local os_type
  os_type="$(uname -s)"

  # Architecture friendly name
  case "$ARCH" in
    x86_64)       ARCH_LABEL="x86_64 (amd64)" ;;
    aarch64|arm64) ARCH_LABEL="arm64 (aarch64)" ;;
    armv7l)       ARCH_LABEL="armv7l (armhf)" ;;
    *)            ARCH_LABEL="$ARCH" ;;
  esac

  # WSL detection (do this early)
  if [ -f /proc/version ]; then
    if grep -qi "microsoft\|wsl" /proc/version 2>/dev/null; then
      IS_WSL="Yes"
    fi
  fi

  case "$os_type" in
    Darwin)
      DISTRO_NAME="macOS"
      local sw_ver sw_build sw_name chip_info
      sw_ver="$(sw_vers -productVersion 2>/dev/null || echo '')"
      sw_build="$(sw_vers -buildVersion 2>/dev/null || echo '')"
      sw_name=""
      # Map macOS version to name
      case "${sw_ver%%.*}" in
        15) sw_name="Sequoia" ;;
        14) sw_name="Sonoma" ;;
        13) sw_name="Ventura" ;;
        12) sw_name="Monterey" ;;
        11) sw_name="Big Sur" ;;
        *)  sw_name="" ;;
      esac
      DISTRO_VERSION="$sw_ver"
      if [ -n "$sw_name" ]; then
        DISTRO_PRETTY="macOS $sw_name $sw_ver ($sw_build)"
      else
        DISTRO_PRETTY="macOS $sw_ver ($sw_build)"
      fi
      # Detect Apple Silicon vs Intel
      if [ "$ARCH" = "arm64" ]; then
        chip_info="Apple Silicon"
      else
        chip_info="Intel"
      fi
      DISTRO_PRETTY="$DISTRO_PRETTY [$chip_info]"
      PKG_MANAGER="brew"
      ;;
    Linux)
      # Use /etc/os-release (standard on all modern distros)
      if [ -f /etc/os-release ]; then
        # shellcheck source=/dev/null
        . /etc/os-release
        DISTRO_NAME="${ID:-Linux}"
        DISTRO_VERSION="${VERSION_ID:-}"
        DISTRO_PRETTY="${PRETTY_NAME:-Linux}"
      elif [ -f /etc/lsb-release ]; then
        # shellcheck source=/dev/null
        . /etc/lsb-release
        DISTRO_NAME="${DISTRIB_ID:-Linux}"
        DISTRO_VERSION="${DISTRIB_RELEASE:-}"
        DISTRO_PRETTY="${DISTRIB_DESCRIPTION:-Linux}"
      else
        DISTRO_NAME="Linux"
        DISTRO_PRETTY="Linux (unknown distro)"
      fi

      # Raspberry Pi detection
      if [ -f /proc/device-tree/model ] && grep -qi "raspberry" /proc/device-tree/model 2>/dev/null; then
        local pi_model
        pi_model="$(cat /proc/device-tree/model 2>/dev/null | tr -d '\0')"
        DISTRO_PRETTY="$DISTRO_PRETTY [$pi_model]"
      fi

      # WSL annotation
      if [ "$IS_WSL" = "Yes" ]; then
        DISTRO_PRETTY="$DISTRO_PRETTY (WSL)"
      fi

      # Detect package manager
      if command -v apt >/dev/null 2>&1; then PKG_MANAGER="apt"
      elif command -v apt-get >/dev/null 2>&1; then PKG_MANAGER="apt-get"
      elif command -v dnf >/dev/null 2>&1; then PKG_MANAGER="dnf"
      elif command -v pacman >/dev/null 2>&1; then PKG_MANAGER="pacman"
      elif command -v apk >/dev/null 2>&1; then PKG_MANAGER="apk"
      elif command -v zypper >/dev/null 2>&1; then PKG_MANAGER="zypper"
      elif command -v yum >/dev/null 2>&1; then PKG_MANAGER="yum"
      fi
      ;;
    MINGW*|MSYS*|CYGWIN*)
      DISTRO_NAME="Windows"
      DISTRO_PRETTY="Windows (Git Bash / MSYS)"
      PKG_MANAGER=""
      ;;
    *)
      DISTRO_NAME="Unknown"
      DISTRO_PRETTY="$os_type (unrecognized)"
      ;;
  esac
}

show_system_info() {
  local shell_ver=""
  if [ -n "${BASH_VERSION:-}" ]; then
    shell_ver="bash $BASH_VERSION"
  elif [ -n "${ZSH_VERSION:-}" ]; then
    shell_ver="zsh $ZSH_VERSION"
  else
    shell_ver="$(basename "${SHELL:-sh}")"
  fi

  local pkg_display="${PKG_MANAGER:-none detected}"
  local box_width=53

  log
  log "  ${cyan}┌─────────────────────────────────────────────────────┐${reset}"
  log "  ${cyan}│${reset}  ${bold}System Detected${reset}                                    ${cyan}│${reset}"
  printf "  ${cyan}│${reset}  OS:     %-43s${cyan}│${reset}\n" "$DISTRO_PRETTY"
  printf "  ${cyan}│${reset}  Arch:   %-43s${cyan}│${reset}\n" "${ARCH_LABEL:-$ARCH}"
  printf "  ${cyan}│${reset}  Pkg:    %-43s${cyan}│${reset}\n" "$pkg_display"
  printf "  ${cyan}│${reset}  Shell:  %-43s${cyan}│${reset}\n" "$shell_ver"
  printf "  ${cyan}│${reset}  WSL:    %-43s${cyan}│${reset}\n" "$IS_WSL"
  log "  ${cyan}└─────────────────────────────────────────────────────┘${reset}"
  log
}

# Preflight detection variables (set by preflight_detect, used by main sequence)
PF_NODE_INSTALLED=false
PF_NODE_VERSION=""
PF_NODE_OK=false
PF_PM2_INSTALLED=false
PF_PM2_VERSION=""
PF_DOCKER_INSTALLED=false
PF_DOCKER_VERSION=""
PF_OLLAMA_INSTALLED=false
PF_LMSTUDIO_INSTALLED=false
PF_GIT_INSTALLED=false
PF_GIT_VERSION=""
PF_CURL_INSTALLED=false
PF_NVM_INSTALLED=false
PF_BREW_INSTALLED=false

preflight_detect() {
    # Node.js
    if command -v node >/dev/null 2>&1; then
        PF_NODE_INSTALLED=true
        PF_NODE_VERSION="$(node -v 2>/dev/null)"
        local major="${PF_NODE_VERSION#v}"
        major="${major%%.*}"
        if [ "$major" = "22" ]; then
            PF_NODE_OK=true
        fi
    fi

    # PM2
    if command -v pm2 >/dev/null 2>&1; then
        PF_PM2_INSTALLED=true
        PF_PM2_VERSION="$(pm2 -v 2>/dev/null)"
    fi

    # Docker
    if command -v docker >/dev/null 2>&1; then
        PF_DOCKER_INSTALLED=true
        PF_DOCKER_VERSION="$(docker --version 2>/dev/null)"
    fi

    # Ollama
    if command -v ollama >/dev/null 2>&1; then
        PF_OLLAMA_INSTALLED=true
    fi

    # LM Studio - check common install paths
    local lm_paths=(
        "$HOME/Applications/LM Studio.app"
        "/Applications/LM Studio.app"
        "$HOME/.local/bin/lms"
    )
    for p in "${lm_paths[@]}"; do
        if [ -e "$p" ]; then
            PF_LMSTUDIO_INSTALLED=true
            break
        fi
    done

    # Git
    if command -v git >/dev/null 2>&1; then
        PF_GIT_INSTALLED=true
        PF_GIT_VERSION="$(git --version 2>/dev/null)"
    fi

    # Curl
    if command -v curl >/dev/null 2>&1; then
        PF_CURL_INSTALLED=true
    fi

    # nvm
    load_nvm
    if command -v nvm >/dev/null 2>&1; then
        PF_NVM_INSTALLED=true
    fi

    # Homebrew
    if command -v brew >/dev/null 2>&1; then
        PF_BREW_INSTALLED=true
    fi
}

preflight_downloads() {
    log "${bold}${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}"
    log "${bold}  Preflight Check - Detecting installed software...${reset}"
    log "${bold}${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}"
    log

    detect_distro
    show_system_info

    preflight_detect

    local missing_required=0
    local missing_optional=0

    # --- Required ---
    # Node.js
    if [ "$PF_NODE_OK" = true ]; then
        log "  ${green}[INSTALLED]${reset}  Node.js $PF_NODE_VERSION"
    elif [ "$PF_NODE_INSTALLED" = true ]; then
        log "  ${yellow}[WRONG VER]${reset}  Node.js $PF_NODE_VERSION (need v22.x)"
        missing_required=1
    else
        log "  ${red}[MISSING]${reset}    Node.js 22"
        missing_required=1
    fi

    # PM2
    if [ "$PF_PM2_INSTALLED" = true ]; then
        log "  ${green}[INSTALLED]${reset}  PM2 v$PF_PM2_VERSION"
    else
        log "  ${red}[MISSING]${reset}    PM2 (will install via npm after Node.js)"
        missing_required=1
    fi

    # Git
    if [ "$PF_GIT_INSTALLED" = true ]; then
        log "  ${green}[INSTALLED]${reset}  $PF_GIT_VERSION"
    else
        log "  ${red}[MISSING]${reset}    Git"
        missing_required=1
    fi

    # Curl
    if [ "$PF_CURL_INSTALLED" = true ]; then
        log "  ${green}[INSTALLED]${reset}  curl"
    else
        log "  ${red}[MISSING]${reset}    curl"
        missing_required=1
    fi

    log
    log "  ${dim}Optional:${reset}"

    # Docker
    if [ "$PF_DOCKER_INSTALLED" = true ]; then
        log "  ${green}[INSTALLED]${reset}  $PF_DOCKER_VERSION"
    else
        log "  ${yellow}[MISSING]${reset}    Docker Desktop (for WordPress + containers)"
        missing_optional=1
    fi

    # Ollama
    if [ "$PF_OLLAMA_INSTALLED" = true ]; then
        log "  ${green}[INSTALLED]${reset}  Ollama"
    else
        log "  ${yellow}[MISSING]${reset}    Ollama (local AI models)"
        missing_optional=1
    fi

    # LM Studio
    if [ "$PF_LMSTUDIO_INSTALLED" = true ]; then
        log "  ${green}[INSTALLED]${reset}  LM Studio"
    else
        log "  ${yellow}[MISSING]${reset}    LM Studio (local AI GUI)"
        missing_optional=1
    fi

    log

    # Summary
    local total_missing=$((missing_required + missing_optional))
    if [ $total_missing -eq 0 ]; then
        log "  ${green}${bold}All software detected! Ready to proceed.${reset}"
        log
        return
    fi

    # Show download links only for missing items
    if [ $missing_required -gt 0 ] || [ $missing_optional -gt 0 ]; then
        log "  ${dim}Download links for missing software:${reset}"
        if [ "$PF_NODE_OK" = false ]; then
            log "    ${cyan}•${reset} Node.js 22: ${green}https://nodejs.org/dist/v22.11.0/${reset} (or use nvm)"
        fi
        if [ "$PF_DOCKER_INSTALLED" = false ]; then
            log "    ${cyan}•${reset} Docker Desktop: ${green}https://www.docker.com/get-started${reset}"
        fi
        if [ "$PF_OLLAMA_INSTALLED" = false ]; then
            log "    ${cyan}•${reset} Ollama: ${green}https://ollama.com/download${reset}"
        fi
        if [ "$PF_LMSTUDIO_INSTALLED" = false ]; then
            log "    ${cyan}•${reset} LM Studio: ${green}https://lmstudio.ai/download${reset}"
        fi
        log
    fi

    if [ $missing_required -gt 0 ]; then
        printf "${yellow}Exit now to install missing software and rerun the script? (y/N): ${reset}"
        read -r ans
        if [[ "$ans" =~ ^[Yy]$ ]]; then
            log "${dim}Okay! Download/install the missing apps above, then re-run install-me-now.sh${reset}"
            exit 0
        fi
    else
        log "  ${dim}Required software is installed. Optional tools can be added later.${reset}"
        log
    fi
}

################
# Pre-flight   #
################
banner
log "${bold}Hello there!${reset} Let's get your RangerPlex AI workstation ready."
log "${dim}We'll check OS, install Node.js 22, fetch npm deps, and collect API keys for .env.${reset}"
log

# Offer to download core apps first
preflight_downloads

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
  fail "Run this script from the project root (package.json not found)."
  exit 1
fi

OS="$(uname -s)"
PM="$PKG_MANAGER"
case "$OS" in
  Darwin) PM="${PM:-brew}" ;;
  Linux)
    # PM already set by detect_distro; fallback detection if empty
    if [ -z "$PM" ]; then
      if command -v apt >/dev/null 2>&1; then PM="apt"
      elif command -v apt-get >/dev/null 2>&1; then PM="apt-get"
      elif command -v dnf >/dev/null 2>&1; then PM="dnf"
      elif command -v pacman >/dev/null 2>&1; then PM="pacman"
      elif command -v apk >/dev/null 2>&1; then PM="apk"
      elif command -v zypper >/dev/null 2>&1; then PM="zypper"
      elif command -v yum >/dev/null 2>&1; then PM="yum"
      fi
    fi
    ;;
  MINGW*|MSYS*|CYGWIN*)
    log "${yellow}Windows detected (Git Bash/MSYS).${reset}"
    log "${dim}This script is designed for macOS, Linux, or WSL (Windows Subsystem for Linux).${reset}"
    log "${dim}For Windows, we HIGHLY recommend using WSL 2.${reset}"
    log "${dim}1. Open PowerShell as Admin${reset}"
    log "${dim}2. Run: wsl --install${reset}"
    log "${dim}3. Reboot and open 'Ubuntu' from Start Menu${reset}"
    log "${dim}4. Run this script again inside Ubuntu${reset}"
    log
    warn "Proceeding with limited Windows support (manual installs may be needed)..."
    OS="Windows"
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
    apk) spinner "Installing $pkg..." sudo apk add --no-cache "$pkg" ;;
    zypper) spinner "Installing $pkg..." sudo zypper install -y "$pkg" ;;
    yum) spinner "Installing $pkg..." sudo yum install -y "$pkg" ;;
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

show_node_manual_instructions() {
  log
  log "${cyan}════════════════════════════════════════════════════════════${reset}"
  log "${bold}        MANUAL NODE.JS VERSION MANAGEMENT (macOS/Linux)${reset}"
  log "${cyan}════════════════════════════════════════════════════════════${reset}"
  log
  log "${bold}${yellow}Using nvm (RECOMMENDED):${reset}"
  log "${dim}  # Install nvm first (if not installed):${reset}"
  log "  ${green}curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash${reset}"
  log "  ${dim}source ~/.nvm/nvm.sh${reset}"
  log
  log "${cyan}  nvm install 22          ${dim}# Install Node 22${reset}"
  log "${cyan}  nvm use 22              ${dim}# Switch to Node 22${reset}"
  log "${cyan}  nvm alias default 22    ${dim}# Make Node 22 the default${reset}"
  log "${cyan}  nvm list                ${dim}# See installed versions${reset}"
  log
  log "${bold}${yellow}To return to Node 25 later:${reset}"
  log "${cyan}  nvm install 25          ${dim}# Install Node 25 (if not installed)${reset}"
  log "${cyan}  nvm use 25              ${dim}# Switch back to Node 25${reset}"
  log "${cyan}  nvm alias default 25    ${dim}# Make Node 25 the default${reset}"
  log
  log "${bold}${yellow}Alternative - Homebrew (macOS only):${reset}"
  log "${cyan}  brew install node@22${reset}"
  log "${cyan}  brew link --overwrite node@22${reset}"
  log
  log "${cyan}════════════════════════════════════════════════════════════${reset}"
  log
}

install_nvm() {
  warn "nvm not found. Install nvm? (recommended for managing Node versions) (Y/n)"
  read -r reply
  if [[ "$reply" =~ ^[Nn]$ ]]; then
    fail "nvm is required to manage Node.js versions safely."
    show_node_manual_instructions
    exit 1
  fi

  log "${dim}Installing nvm (Node Version Manager)...${reset}"
  spinner "Downloading nvm..." bash -c "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"

  # shellcheck source=/dev/null
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

  # Verify nvm is now available
  if ! command -v nvm >/dev/null 2>&1; then
    fail "nvm installation completed but nvm command not found."
    log "${dim}Try opening a new terminal and running this script again.${reset}"
    log "${dim}Or run: ${bold}source ~/.nvm/nvm.sh${reset}"
    exit 1
  fi
  ok "nvm installed successfully!"
}

load_nvm() {
  # Try to load nvm if it exists but isn't in current shell
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
}

downgrade_node_with_nvm() {
  local current_major="$1"

  log
  log "${green}${bold}Good news! nvm is available for automatic downgrade.${reset}"
  log
  warn "Automatically downgrade from Node $current_major to Node 22? (Y/n)"
  read -r reply

  if [[ "$reply" =~ ^[Nn]$ ]]; then
    show_node_manual_instructions
    return 1
  fi

  step "Installing Node.js v22 via nvm..."
  if ! nvm install 22; then
    fail "Failed to install Node 22 via nvm."
    return 1
  fi

  step "Switching to Node.js v22..."
  nvm use 22
  nvm alias default 22

  # Verify the switch worked
  local new_ver
  new_ver="$(node -v 2>/dev/null)"

  if [[ "$new_ver" == v22.* ]]; then
    ok "Successfully downgraded to Node.js $new_ver!"
    log
    log "${yellow}To return to Node $current_major later:${reset}"
    log "  ${cyan}nvm use $current_major${reset}"
    log "  ${cyan}nvm alias default $current_major${reset}"
    log
    return 0
  else
    warn "nvm switch may require a new terminal session."
    log "${dim}Close this terminal, reopen, and run:${reset}"
    log "  ${cyan}nvm use 22${reset}"
    log "  ${dim}Then re-run this installer.${reset}"
    return 1
  fi
}

ensure_node() {
  # Try to load nvm first
  load_nvm

  # Check current Node version
  if command -v node >/dev/null 2>&1; then
    local ver
    ver="$(node -v | sed 's/^v//')"
    local major_ver="${ver%%.*}"

    if [[ "$ver" == 22.* ]]; then
      ok "Node.js v$ver detected (meets requirement)."
      return
    elif [[ "$major_ver" -ge 23 ]]; then
      # Node is too new - needs downgrade
      log
      fail "Node.js v$ver detected - TOO NEW!"
      log
      log "${red}${bold}Node v23+ breaks native modules like better-sqlite3.${reset}"
      log "${red}RangerPlex requires Node.js v22.x (LTS).${reset}"
      log

      # Check if nvm is available
      if command -v nvm >/dev/null 2>&1; then
        if downgrade_node_with_nvm "$major_ver"; then
          return
        fi
      else
        # nvm not installed - offer to install
        warn "nvm is NOT installed."
        log "${dim}nvm lets you easily switch between Node versions.${reset}"
        log

        printf "${yellow}Install nvm to manage Node versions? (Y/n): ${reset}"
        read -r reply

        if [[ ! "$reply" =~ ^[Nn]$ ]]; then
          install_nvm
          if downgrade_node_with_nvm "$major_ver"; then
            return
          fi
        fi
      fi

      # If we get here, automatic downgrade failed or was declined
      show_node_manual_instructions

      printf "${yellow}Continue anyway with Node v$major_ver? (may cause errors) (y/N): ${reset}"
      read -r reply
      if [[ "$reply" =~ ^[Yy]$ ]]; then
        warn "Continuing with Node v$ver - native modules may fail!"
        return
      fi

      fail "Cannot continue without Node v22. Please downgrade manually."
      exit 1

    else
      # Node version is older than 22
      warn "Node.js v$ver detected; v22.x is recommended."
      printf "${yellow}Upgrade to Node 22? (Y/n): ${reset}"
      read -r reply

      if [[ "$reply" =~ ^[Nn]$ ]]; then
        warn "Continuing with Node v$ver (may have compatibility issues)."
        return
      fi
    fi
  fi

  # Need to install Node 22 - offer multiple methods
  log
  log "${bold}${yellow}Choose Node.js install method:${reset}"
  log "  ${green}1)${reset} nvm (recommended - manage multiple versions)"

  case "$OS" in
    Darwin)
      log "  ${cyan}2)${reset} Homebrew: brew install node@22"
      ;;
    Linux)
      if [ -n "$PM" ]; then
        case "$PM" in
          apt|apt-get) log "  ${cyan}2)${reset} System package manager: sudo $PM install nodejs npm" ;;
          dnf)         log "  ${cyan}2)${reset} System package manager: sudo dnf install nodejs npm" ;;
          pacman)      log "  ${cyan}2)${reset} System package manager: sudo pacman -S nodejs npm" ;;
          apk)         log "  ${cyan}2)${reset} System package manager: sudo apk add nodejs npm" ;;
          zypper)      log "  ${cyan}2)${reset} System package manager: sudo zypper install nodejs npm" ;;
          yum)         log "  ${cyan}2)${reset} System package manager: sudo yum install nodejs npm" ;;
        esac
      fi
      ;;
  esac

  log
  printf "${yellow}Install via [1] nvm or [2] system package manager? (1/2): ${reset}"
  read -r node_choice

  case "$node_choice" in
    2)
      # Direct install via system package manager
      case "$OS" in
        Darwin)
          if [ "$PF_BREW_INSTALLED" = true ]; then
            step "Installing Node.js 22 via Homebrew..."
            if brew install node@22; then
              brew link --overwrite node@22 2>/dev/null || true
              ok "Node.js installed via Homebrew!"
            else
              warn "Homebrew install failed. Falling back to nvm..."
              node_choice="1"
            fi
          else
            warn "Homebrew not found. Install Homebrew first: https://brew.sh"
            log "${dim}Falling back to nvm...${reset}"
            node_choice="1"
          fi
          ;;
        Linux)
          if [ -n "$PM" ]; then
            step "Installing Node.js and npm via $PM..."
            case "$PM" in
              apt|apt-get)
                # Use NodeSource for v22 on Debian/Ubuntu
                if curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - 2>/dev/null; then
                  sudo $PM install -y nodejs
                else
                  warn "NodeSource setup failed. Installing distro default Node..."
                  sudo $PM update && sudo $PM install -y nodejs npm
                fi
                ;;
              dnf)    sudo dnf install -y nodejs npm ;;
              pacman) sudo pacman -Sy --noconfirm nodejs npm ;;
              apk)    sudo apk add --no-cache nodejs npm ;;
              zypper) sudo zypper install -y nodejs npm ;;
              yum)    sudo yum install -y nodejs npm ;;
            esac
            if command -v node >/dev/null 2>&1; then
              local sys_ver
              sys_ver="$(node -v)"
              ok "Node.js $sys_ver installed via $PM."
              if [[ ! "$sys_ver" == v22.* ]]; then
                warn "System package manager installed $sys_ver (not v22.x)."
                log "${dim}Distro repos may not have Node 22 yet. For exact v22, use nvm.${reset}"
              fi
            else
              warn "Node install via $PM may have failed. Falling back to nvm..."
              node_choice="1"
            fi
          else
            warn "No package manager detected. Falling back to nvm..."
            node_choice="1"
          fi
          ;;
        *)
          warn "Direct install not supported on $OS. Falling back to nvm..."
          node_choice="1"
          ;;
      esac
      ;;
  esac

  # Fallback / explicit choice: nvm
  if [ "$node_choice" != "2" ] || ! command -v node >/dev/null 2>&1; then
    if ! command -v nvm >/dev/null 2>&1; then
      install_nvm
    fi

    step "Installing Node.js v22 via nvm..."
    nvm install 22
    nvm use 22
    nvm alias default 22
  fi

  # Verify Node is now available and correct version
  if ! command -v node >/dev/null 2>&1; then
    fail "Node.js installation completed but node command not found."
    log "${dim}Try opening a new terminal and running this script again.${reset}"
    log "${dim}Or run: ${bold}source ~/.nvm/nvm.sh && nvm use 22${reset}"
    exit 1
  fi

  local installed_ver
  installed_ver="$(node -v)"
  if [[ ! "$installed_ver" == v22.* ]]; then
    warn "Expected Node v22.x but got $installed_ver"
    log "${dim}Attempting to switch to Node 22 via nvm...${reset}"
    if command -v nvm >/dev/null 2>&1; then
      nvm install 22 2>/dev/null
      nvm use 22
    fi
  fi

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
  # Try global install first (preferred for CLI usage)
  if npm install -g pm2 >/dev/null 2>&1; then
    ok "PM2 installed globally."
  else
    warn "PM2 global install failed (may need sudo or different permissions)."
    log "${dim}No worries - PM2 is also in package.json devDependencies.${reset}"
    log "${dim}It will be available after npm install completes.${reset}"
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
    log "${dim}   • Installation Tutorial: ${cyan}https://www.hostinger.com/tutorials/how-to-install-ollama${reset}"
    return 0
  fi

  case "$OS" in
    Darwin)
      if [ "$PF_BREW_INSTALLED" = true ]; then
        log "${green}Homebrew detected!${reset} Installing Ollama via brew..."
        if brew install ollama; then
          ok "Ollama installed via Homebrew!"
          log "${dim}Start Ollama: ${bold}ollama serve${reset}"
        else
          warn "Brew install failed. Falling back to manual download..."
          open "https://ollama.com/download/mac" 2>/dev/null || log "Visit: https://ollama.com/download/mac"
        fi
      else
        log "Opening Ollama download page in your browser..."
        log "${dim}On macOS, the Ollama Desktop App INCLUDES the command-line tools.${reset}"
        log "${dim}You do NOT need to install the CLI separately.${reset}"
        log "${dim}1. Download the .zip/.dmg${reset}"
        log "${dim}2. Drag to Applications${reset}"
        log "${dim}3. Run 'Ollama' from Applications to start the server${reset}"
        open "https://ollama.com/download/mac" 2>/dev/null || log "Visit: https://ollama.com/download/mac"
      fi
      ;;
    Linux)
      # Check for WSL
      if grep -q Microsoft /proc/version 2>/dev/null || grep -q microsoft /proc/version 2>/dev/null; then
         log "${cyan}WSL (Windows Subsystem for Linux) detected.${reset}"
         log "${dim}Installing the Linux version of Ollama inside WSL is recommended for performance.${reset}"
         log "${dim}Note: If you already have Ollama installed on Windows (outside WSL), you can use that too,${reset}"
         log "${dim}but you'll need to configure the host IP. Installing inside WSL is easier.${reset}"
      fi
      
      log "Installing Ollama via official script..."
      if curl -fsSL https://ollama.com/install.sh | sh; then
        ok "Ollama installed successfully!"
        log "${dim}Start Ollama: OLLAMA_ORIGINS=\"*\" ollama serve${reset}"
      else
        warn "Ollama installation failed. Visit https://ollama.com for manual install."
      fi
      ;;
    Windows)
      log "${cyan}Windows detected.${reset}"
      log "Please download the official Windows installer:"
      log "${bold}${cyan}https://ollama.com/download/windows${reset}"
      log "${dim}Run the .exe file to install Ollama.${reset}"
      if command -v start >/dev/null 2>&1; then start "https://ollama.com/download/windows"; fi
      ;;
    *)
      log "Visit https://ollama.com to download Ollama for your system."
      ;;
  esac
}

check_docker() {
  if command -v docker >/dev/null 2>&1; then
    ok "Docker already installed ($(docker --version))."
    return 0
  fi

  log
  warn "Docker not detected. Docker enables WordPress hosting and containerized deployments."
  log "${dim}Docker is OPTIONAL but HIGHLY RECOMMENDED for WordPress integration.${reset}"
  log "${dim}Docker Desktop includes: Docker Engine, CLI tools, and Docker Compose.${reset}"
  log
  printf "Install Docker now? (y/N): "
  read -r reply
  if [[ ! "$reply" =~ ^[Yy]$ ]]; then
    log "${dim}Skipped Docker. Install later from: ${cyan}https://www.docker.com/get-started/${reset}"
    return 0
  fi

  case "$OS" in
    Darwin)
      if [ "$PF_BREW_INSTALLED" = true ]; then
        log "${green}Homebrew detected!${reset} Installing Docker Desktop via brew..."
        if brew install --cask docker; then
          ok "Docker Desktop installed via Homebrew!"
          log "${dim}Open Docker from Applications to start the daemon.${reset}"
          log "${dim}Wait for the whale icon in the menu bar before using docker commands.${reset}"
        else
          warn "Brew cask install failed. Falling back to manual download..."
          open "https://docs.docker.com/desktop/setup/install/mac-install/" 2>/dev/null || log "Visit: ${cyan}https://docs.docker.com/desktop/setup/install/mac-install/${reset}"
        fi
      else
        log "Opening Docker Desktop download page..."
        log "${dim}${bold}Docker Desktop for Mac includes ALL CLI tools:${reset}"
        log "${dim}  ✓ Docker Engine (daemon)${reset}"
        log "${dim}  ✓ Docker CLI (docker command)${reset}"
        log "${dim}  ✓ Docker Compose (multi-container management)${reset}"
        log "${dim}  ✓ Docker Desktop GUI${reset}"
        log
        log "${dim}Installation steps:${reset}"
        log "${dim}1. Download the .dmg (Apple Chip for M1/M2/M3/M4, Intel for others)${reset}"
        log "${dim}2. Drag Docker.app to Applications folder${reset}"
        log "${dim}3. Open Docker from Applications to start${reset}"
        log "${dim}4. Wait for Docker to fully start (whale icon in menu bar)${reset}"
        log
        open "https://docs.docker.com/desktop/setup/install/mac-install/" 2>/dev/null || log "Visit: ${cyan}https://docs.docker.com/desktop/setup/install/mac-install/${reset}"
      fi
      ;;
    Linux)
      # Check for WSL
      if grep -q Microsoft /proc/version 2>/dev/null || grep -q microsoft /proc/version 2>/dev/null; then
         log "${cyan}WSL (Windows Subsystem for Linux) detected.${reset}"
         log "${yellow}STOP! Do NOT install Docker Engine here.${reset}"
         log "${dim}For WSL, install Docker Desktop for Windows on your main Windows system.${reset}"
         log "${dim}Then enable 'WSL 2 Integration' in Docker Desktop settings.${reset}"
         log
         log "${dim}${bold}Docker Desktop for Windows includes ALL CLI tools:${reset}"
         log "${dim}  ✓ Docker Engine${reset}"
         log "${dim}  ✓ Docker CLI (works in WSL too!)${reset}"
         log "${dim}  ✓ Docker Compose${reset}"
         log
         log "${dim}Download: ${cyan}https://docs.docker.com/desktop/setup/install/windows-install/${reset}"
         return 0
      fi

      log "Installing Docker via official convenience script..."
      if curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh; then
        ok "Docker installed successfully!"
        log "${dim}Adding $USER to docker group...${reset}"
        sudo usermod -aG docker "$USER"
        log "${dim}You may need to log out and back in for this to take effect.${reset}"
      else
        warn "Docker installation failed. Visit https://docs.docker.com/desktop/setup/install/linux/ for manual install."
      fi
      ;;
    Windows)
      log "${cyan}Windows detected.${reset}"
      log "Please download Docker Desktop for Windows:"
      log "${bold}${cyan}https://docs.docker.com/desktop/setup/install/windows-install/${reset}"
      log
      log "${dim}${bold}Docker Desktop for Windows includes ALL CLI tools:${reset}"
      log "${dim}  ✓ Docker Engine${reset}"
      log "${dim}  ✓ Docker CLI (docker command)${reset}"
      log "${dim}  ✓ Docker Compose${reset}"
      log "${dim}  ✓ WSL 2 integration (works seamlessly!)${reset}"
      log
      log "${dim}Installation tips:${reset}"
      log "${dim}  • Run the installer and ensure 'Use WSL 2 instead of Hyper-V' is checked${reset}"
      log "${dim}  • Restart after installation if prompted${reset}"
      if command -v start >/dev/null 2>&1; then start "https://docs.docker.com/desktop/setup/install/windows-install/"; fi
      ;;
    *)
      log "Visit ${cyan}https://www.docker.com/get-started/${reset} to download Docker."
      ;;
  esac
}

check_lmstudio() {
  if [ "$PF_LMSTUDIO_INSTALLED" = true ]; then
    ok "LM Studio already installed."
    return 0
  fi

  # LM Studio is already shown as optional in preflight - only offer install
  # if the user goes through the Ollama check and declines it, or as a bonus.
  # This function is called from the main sequence if LM Studio is missing.
  return 0
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

  step "Installing npm dependencies (this may take a minute)..."
  if npm install; then
    ok "Dependencies installed successfully."
  else
    fail "npm install failed!"
    log "${dim}This usually means:${reset}"
    log "${dim}  1. Network connectivity issues${reset}"
    log "${dim}  2. Incompatible Node.js version${reset}"
    log "${dim}  3. Corrupted package-lock.json${reset}"
    log
    warn "Try these fixes:"
    log "${dim}  • rm -rf node_modules package-lock.json && npm install${reset}"
    log "${dim}  • Ensure you're using Node.js v22.x${reset}"
    exit 1
  fi

  # Save current Node version for future checks
  node -v > node_modules/.node_version

  # Rebuild all native modules for current Node version (critical for M1/ARM)
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
      log "${dim}This is critical for M1/ARM Macs. Try manually:${reset}"
      log "${dim}  npm rebuild better-sqlite3${reset}"
      log "${dim}  Or: npm install --build-from-source better-sqlite3${reset}"
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
  log "${bold}🐳 Development Tools (RECOMMENDED):${reset}"
  log "   ${green}•${reset} Docker Desktop:    ${cyan}https://www.docker.com/get-started/${reset}"
  log "   ${dim}   (Includes Engine, CLI, Compose - Required for WordPress hosting)${reset}"
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
    
    local key_accepted=false
    while [ "$key_accepted" = false ]; do
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
        
        # Show masked preview (first 8 chars + ... + last 4 chars)
        local key_length=${#sanitized}
        local preview=""
        if [ $key_length -le 12 ]; then
          # Short key - show first 4 and last 4 with asterisks in middle
          preview="${sanitized:0:4}****${sanitized: -4}"
        else
          # Long key - show first 8 and last 4
          preview="${sanitized:0:8}...${sanitized: -4}"
        fi
        
        log "${dim}Preview: ${preview}${reset}"
        printf "${yellow}Is this key correct?${reset} (Y/n/r to re-enter): "
        read -r confirm
        
        case "$confirm" in
          [Nn]*)
            warn "Key discarded. Skipping $name."
            key_accepted=true  # Exit loop without saving
            ;;
          [Rr]*)
            warn "Re-entering key for $name..."
            # Loop continues, will prompt again
            ;;
          *)
            # Default to Yes - save the key
            # Remove existing line if present
            grep -v "^$var=" "$env_file" > "$env_file.tmp" 2>/dev/null || touch "$env_file.tmp"
            mv "$env_file.tmp" "$env_file"
            # Write new line
            echo "${var}=${sanitized}" >> "$env_file"
            ok "Saved $var to .env"
            key_accepted=true
            ;;
        esac
      else
        # User pressed ENTER to skip
        if [ "$priority" = "ESSENTIAL" ]; then
          warn "Skipped $name. You'll need at least one AI provider to use RangerPlex!"
        else
          log "${dim}Skipped $name. Add it later in .env if needed.${reset}"
        fi
        key_accepted=true
      fi
    done
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

  if [ -n "${ZSH_VERSION:-}" ] || [ "${SHELL:-}" = "$(command -v zsh)" ]; then
    shell_config="$HOME/.zshrc"
    shell_name="zsh"
  elif [ -n "${BASH_VERSION:-}" ] || [ "${SHELL:-}" = "$(command -v bash)" ]; then
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

log
progress_bar 1 "Initializing Installer"
log

# Step 1: System checks (curl, git)
if [ "$PF_CURL_INSTALLED" = true ] && [ "$PF_GIT_INSTALLED" = true ]; then
    ok "curl and git already installed - skipping system checks."
else
    step "Checking essentials (curl, git)..."
    ensure_pkg curl
    ensure_pkg git
fi

# Step 2: Node.js
if [ "$PF_NODE_OK" = true ]; then
    ok "Node.js $PF_NODE_VERSION already installed - skipping."
else
    step "Ensuring Node.js 22.x..."
    ensure_node
fi

# Step 3: PM2
if [ "$PF_PM2_INSTALLED" = true ]; then
    ok "PM2 v$PF_PM2_VERSION already installed - skipping."
else
    step "Installing PM2 process manager..."
    install_pm2
fi

# Step 4: Ollama
if [ "$PF_OLLAMA_INSTALLED" = true ]; then
    ok "Ollama already installed - skipping."
else
    step "Checking for Ollama (optional local AI)..."
    check_ollama
fi

# Step 5: Docker
if [ "$PF_DOCKER_INSTALLED" = true ]; then
    ok "Docker already installed - skipping."
else
    step "Checking for Docker (optional container support)..."
    check_docker
fi

# Step 6: Dependencies
cd "$PROJECT_ROOT"
local_deps_ok=false
if [ -d "node_modules" ]; then
    deps_missing=false
    for pkg in vite pm2 better-sqlite3 express react; do
        if [ ! -d "node_modules/$pkg" ]; then
            deps_missing=true
            break
        fi
    done
    if [ "$deps_missing" = false ]; then
        local_pkg_count="$(ls -d node_modules/*/ 2>/dev/null | wc -l | tr -d ' ')"
        ok "Dependencies already installed ($local_pkg_count packages) - skipping."
        printf "${yellow}  Reinstall anyway? (y/N): ${reset}"
        read -r reinstall_reply
        if [[ "$reinstall_reply" =~ ^[Yy]$ ]]; then
            step "Reinstalling project dependencies..."
            prepare_deps
        fi
        local_deps_ok=true
    fi
fi
if [ "$local_deps_ok" = false ]; then
    step "Installing project dependencies..."
    prepare_deps
fi

# Step 7: API Keys
env_file="$PROJECT_ROOT/.env"
if [ -f "$env_file" ]; then
    existing_keys="$(grep -c "^VITE_.*=.\+" "$env_file" 2>/dev/null || echo 0)"
    if [ "$existing_keys" -gt 0 ]; then
        ok "API keys file exists ($existing_keys keys configured)."
        printf "${yellow}  Reconfigure API keys? (y/N): ${reset}"
        read -r reconfig_reply
        if [[ "$reconfig_reply" =~ ^[Yy]$ ]]; then
            step "Collecting API keys into .env..."
            collect_env
        fi
    else
        step "Collecting API keys into .env..."
        collect_env
    fi
else
    step "Collecting API keys into .env..."
    collect_env
fi

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

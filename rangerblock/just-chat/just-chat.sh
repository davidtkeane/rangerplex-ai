#!/bin/bash
# ============================================================================
#  RANGERBLOCK JUST-CHAT - One-Click Blockchain Chat Client
# ============================================================================
#  Connect to the RangerBlock P2P Network instantly!
#  Created by: David Keane (IrishRanger) + Claude Code (Ranger)
#  Version: 1.0.0 | November 2025
#  Project: RangerBlock P2P Network
# ============================================================================

VERSION="2.0.0"
INSTALL_DIR="$HOME/.rangerblock-chat"
AWS_RELAY="44.222.101.125"
AWS_PORT="5555"
DASHBOARD_PORT="5556"
GITHUB_RAW="https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock"

# ============================================================================
# COLORS & STYLING
# ============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
BOLD='\033[1m'
DIM='\033[2m'
BLINK='\033[5m'
NC='\033[0m' # No Color

# Gradient colors for rainbow effects
GRADIENT_1='\033[38;5;196m'  # Red
GRADIENT_2='\033[38;5;208m'  # Orange
GRADIENT_3='\033[38;5;226m'  # Yellow
GRADIENT_4='\033[38;5;46m'   # Green
GRADIENT_5='\033[38;5;51m'   # Cyan
GRADIENT_6='\033[38;5;129m'  # Purple

# Box drawing characters
BOX_TL="╔"
BOX_TR="╗"
BOX_BL="╚"
BOX_BR="╝"
BOX_H="═"
BOX_V="║"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

print_banner() {
    clear
    echo ""
    echo -e "${CYAN}"
    cat << 'BANNER'
    ██████╗  █████╗ ███╗   ██╗ ██████╗ ███████╗██████╗ ██████╗ ██╗      ██████╗  ██████╗██╗  ██╗
    ██╔══██╗██╔══██╗████╗  ██║██╔════╝ ██╔════╝██╔══██╗██╔══██╗██║     ██╔═══██╗██╔════╝██║ ██╔╝
    ██████╔╝███████║██╔██╗ ██║██║  ███╗█████╗  ██████╔╝██████╔╝██║     ██║   ██║██║     █████╔╝
    ██╔══██╗██╔══██║██║╚██╗██║██║   ██║██╔══╝  ██╔══██╗██╔══██╗██║     ██║   ██║██║     ██╔═██╗
    ██║  ██║██║  ██║██║ ╚████║╚██████╔╝███████╗██║  ██║██████╔╝███████╗╚██████╔╝╚██████╗██║  ██╗
    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝
BANNER
    echo -e "${NC}"
    echo -e "${YELLOW}    ════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}                     ${BOLD}🐉 P2P BLOCKCHAIN CHAT CLIENT 🐉${NC}"
    echo -e "${GRAY}                        Version $VERSION | Just-Chat Edition${NC}"
    echo -e "${YELLOW}    ════════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_small_banner() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}${WHITE}🐉 RANGERBLOCK${NC} ${GRAY}|${NC} ${GREEN}Just-Chat v$VERSION${NC}                           ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Animated spinner
spin() {
    local pid=$1
    local delay=0.1
    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " ${CYAN}[%c]${NC}  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# Progress bar
progress_bar() {
    local current=$1
    local total=$2
    local width=50
    local percent=$((current * 100 / total))
    local filled=$((current * width / total))
    local empty=$((width - filled))

    printf "\r  ${GRAY}[${NC}"
    printf "${GREEN}%${filled}s${NC}" | tr ' ' '█'
    printf "${GRAY}%${empty}s${NC}" | tr ' ' '░'
    printf "${GRAY}]${NC} ${WHITE}%3d%%${NC}" $percent
}

# Success message with checkmark
success() {
    echo -e "  ${GREEN}✓${NC} $1"
}

# Error message with X
error() {
    echo -e "  ${RED}✗${NC} $1"
}

# Info message
info() {
    echo -e "  ${CYAN}ℹ${NC} $1"
}

# Warning message
warning() {
    echo -e "  ${YELLOW}⚠${NC} $1"
}

# Step header
step() {
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}${BOLD}  $1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Fireworks effect!
fireworks() {
    local colors=("${RED}" "${GREEN}" "${YELLOW}" "${BLUE}" "${PURPLE}" "${CYAN}")
    local symbols=("✦" "✧" "★" "☆" "✴" "✵" "❋" "❊" "✺" "✹")

    echo ""
    for i in {1..3}; do
        for j in {1..60}; do
            color=${colors[$RANDOM % ${#colors[@]}]}
            symbol=${symbols[$RANDOM % ${#symbols[@]}]}
            printf "${color}${symbol}${NC}"
        done
        echo ""
    done
    echo ""
}

# Typing effect
type_text() {
    local text="$1"
    local delay=${2:-0.03}
    for ((i=0; i<${#text}; i++)); do
        printf "%s" "${text:$i:1}"
        sleep $delay
    done
    echo ""
}

# ============================================================================
# INSTALLATION
# ============================================================================

install() {
    print_banner

    echo -e "${WHITE}${BOLD}  Welcome to the RangerBlock Network!${NC}"
    echo -e "${GRAY}  This installer will set up everything you need to chat.${NC}"
    echo ""
    sleep 1

    # ===== STEP 1: Environment Check =====
    step "📋 STEP 1/5: Checking Environment"
    sleep 0.5

    # Detect OS
    OS="unknown"
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        if [ -f /etc/debian_version ]; then
            DISTRO="debian"
        elif [ -f /etc/redhat-release ]; then
            DISTRO="redhat"
        else
            DISTRO="other"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        DISTRO="macos"
    fi

    success "Operating System: ${WHITE}$OS${NC} ($DISTRO)"
    success "Home Directory: ${WHITE}$HOME${NC}"
    success "Install Location: ${WHITE}$INSTALL_DIR${NC}"

    # Check for required commands
    if command -v curl &> /dev/null; then
        success "curl: ${GREEN}installed${NC}"
    else
        error "curl: ${RED}not found${NC}"
        exit 1
    fi

    # ===== STEP 2: Install Node.js =====
    step "📦 STEP 2/5: Installing Node.js"
    sleep 0.5

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        success "Node.js already installed: ${GREEN}$NODE_VERSION${NC}"
    else
        warning "Node.js not found - installing..."
        echo ""

        if [[ "$OS" == "macos" ]]; then
            if command -v brew &> /dev/null; then
                info "Installing via Homebrew..."
                brew install node 2>/dev/null &
                spin $!
                success "Node.js installed via Homebrew"
            else
                error "Please install Homebrew first: https://brew.sh"
                exit 1
            fi
        elif [[ "$DISTRO" == "debian" ]]; then
            info "Installing via NodeSource..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1 &
            spin $!
            sudo apt-get install -y nodejs > /dev/null 2>&1 &
            spin $!
            # Refresh PATH to find newly installed node
            hash -r 2>/dev/null
            export PATH="/usr/bin:/usr/local/bin:$PATH"
            success "Node.js installed"
        elif [[ "$DISTRO" == "redhat" ]]; then
            info "Installing via NodeSource..."
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - > /dev/null 2>&1 &
            spin $!
            sudo yum install -y nodejs > /dev/null 2>&1 &
            spin $!
            # Refresh PATH to find newly installed node
            hash -r 2>/dev/null
            export PATH="/usr/bin:/usr/local/bin:$PATH"
            success "Node.js installed"
        fi

        # Verify node is now accessible
        if ! command -v node &> /dev/null; then
            # Try to find it
            for nodepath in /usr/bin/node /usr/local/bin/node; do
                if [ -x "$nodepath" ]; then
                    export PATH="$(dirname $nodepath):$PATH"
                    break
                fi
            done
        fi

        NODE_VERSION=$(node --version 2>/dev/null || echo "unknown")
        success "Node.js version: ${GREEN}$NODE_VERSION${NC}"
    fi

    # ===== STEP 2.5: Install SoX (for voice chat) =====
    step "🎤 STEP 2.5/5: Installing SoX (Voice Chat)"
    sleep 0.5

    if command -v sox &> /dev/null; then
        success "SoX already installed: ${GREEN}$(sox --version 2>&1 | head -1)${NC}"
    else
        warning "SoX not found - installing..."
        echo ""

        if [[ "$OS" == "macos" ]]; then
            if command -v brew &> /dev/null; then
                info "Installing via Homebrew..."
                brew install sox 2>/dev/null &
                spin $!
                success "SoX installed via Homebrew"
            else
                warning "Install Homebrew first or: brew install sox"
            fi
        elif [[ "$DISTRO" == "debian" ]]; then
            info "Installing via apt..."
            sudo apt-get install -y sox libsox-fmt-all > /dev/null 2>&1 &
            spin $!
            success "SoX installed"
        elif [[ "$DISTRO" == "redhat" ]]; then
            info "Installing via yum..."
            sudo yum install -y sox > /dev/null 2>&1 &
            spin $!
            success "SoX installed"
        fi
    fi

    # ===== STEP 2.6: Install ffmpeg (for video chat) =====
    step "📹 STEP 2.6/5: Installing ffmpeg (Video Chat)"
    sleep 0.5

    if command -v ffmpeg &> /dev/null; then
        success "ffmpeg already installed: ${GREEN}$(ffmpeg -version 2>&1 | head -1)${NC}"
    else
        warning "ffmpeg not found - installing..."
        echo ""

        if [[ "$OS" == "macos" ]]; then
            if command -v brew &> /dev/null; then
                info "Installing via Homebrew..."
                brew install ffmpeg 2>/dev/null &
                spin $!
                success "ffmpeg installed via Homebrew"
            else
                warning "Install Homebrew first or: brew install ffmpeg"
            fi
        elif [[ "$DISTRO" == "debian" ]]; then
            info "Installing via apt..."
            sudo apt-get install -y ffmpeg > /dev/null 2>&1 &
            spin $!
            success "ffmpeg installed"
        elif [[ "$DISTRO" == "redhat" ]]; then
            info "Installing via yum..."
            sudo yum install -y ffmpeg > /dev/null 2>&1 &
            spin $!
            success "ffmpeg installed"
        fi
    fi

    # ===== STEP 3: Download Chat Client =====
    step "📥 STEP 3/5: Downloading Chat Client"
    sleep 0.5

    # Create install directory
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"

    info "Downloading files from GitHub..."
    echo ""

    # Files to download
    FILES=(
        "core/blockchain-chat.cjs"
        "core/blockchain-ping.cjs"
        "core/voice-chat.cjs"
        "core/video-chat.cjs"
    )

    for i in "${!FILES[@]}"; do
        file="${FILES[$i]}"
        filename=$(basename "$file")
        progress_bar $((i + 1)) ${#FILES[@]}
        curl -fsSL "$GITHUB_RAW/$file" -o "$filename" 2>/dev/null
        sleep 0.3
    done
    echo ""
    success "Downloaded ${#FILES[@]} files"

    # Create package.json
    cat > package.json << 'PKGJSON'
{
  "name": "rangerblock-chat",
  "version": "2.0.0",
  "description": "RangerBlock P2P Blockchain Chat, Voice & Video Client",
  "scripts": {
    "chat": "node blockchain-chat.cjs",
    "voice": "node voice-chat.cjs",
    "video": "node video-chat.cjs",
    "ping": "node blockchain-ping.cjs"
  },
  "dependencies": {
    "ws": "^8.14.2",
    "readline": "*"
  }
}
PKGJSON
    success "Created package.json"

    # Create identity file
    RANDOM_ID=$(head -c 4 /dev/urandom | xxd -p)
    HOSTNAME=$(hostname | cut -c1-10)
    cat > node-identity.json << IDENTITY
{
  "nodeId": "${HOSTNAME}-${RANDOM_ID}",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "type": "chat-client"
}
IDENTITY
    success "Created node identity: ${CYAN}${HOSTNAME}-${RANDOM_ID}${NC}"

    # ===== STEP 4: Install Dependencies =====
    step "🔧 STEP 4/5: Installing Dependencies"
    sleep 0.5

    info "Running npm install..."
    npm install --silent 2>/dev/null &
    spin $!
    success "Dependencies installed"

    # ===== STEP 5: Test Connection =====
    step "🌐 STEP 5/5: Testing AWS Relay Connection"
    sleep 0.5

    info "Connecting to RangerBlock Network..."
    info "Target: ${CYAN}$AWS_RELAY:$AWS_PORT${NC}"
    echo ""

    # Test with curl (dashboard API)
    if curl -s --connect-timeout 5 "http://$AWS_RELAY:$DASHBOARD_PORT/api/nodes" > /dev/null 2>&1; then
        success "${GREEN}${BOLD}CONNECTION SUCCESSFUL!${NC}"

        # Get network info
        NETWORK_INFO=$(curl -s "http://$AWS_RELAY:$DASHBOARD_PORT/api/nodes" 2>/dev/null)
        if [ -n "$NETWORK_INFO" ]; then
            RELAY_NAME=$(echo "$NETWORK_INFO" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
            ACTIVE_NODES=$(echo "$NETWORK_INFO" | grep -o '"activeNodes":[0-9]*' | cut -d':' -f2)
            success "Relay Name: ${CYAN}${RELAY_NAME:-AWS-Relay}${NC}"
            success "Active Nodes: ${CYAN}${ACTIVE_NODES:-0}${NC}"
        fi
    else
        warning "AWS Relay not responding (it may be starting up)"
        info "You can still try to connect - the relay might come online soon"
    fi

    # ===== COMPLETE =====
    echo ""
    echo ""
    fireworks

    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}                                                                              ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${WHITE}${BOLD}🎉 INSTALLATION COMPLETE! 🎉${NC}                                             ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                                              ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${GRAY}You are now part of the RangerBlock P2P Network!${NC}                         ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                                              ${GREEN}║${NC}"
    echo -e "${GREEN}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}                                                                              ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${CYAN}QUICK COMMANDS:${NC}                                                           ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                                              ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${WHITE}./just-chat.sh -c${NC}              ${GRAY}Start chatting${NC}                          ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${WHITE}./just-chat.sh -v${NC}              ${GRAY}Start voice chat${NC}                        ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${WHITE}./just-chat.sh -video${NC}          ${GRAY}Start video chat${NC}                        ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${WHITE}./just-chat.sh -t${NC}              ${GRAY}Test connection${NC}                         ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${WHITE}./just-chat.sh -u${NC}              ${GRAY}Update to latest version${NC}                ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${WHITE}./just-chat.sh -h${NC}              ${GRAY}Show help${NC}                               ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${WHITE}./just-chat.sh -getoffmymachine${NC} ${GRAY}Uninstall everything${NC}                   ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                                              ${GREEN}║${NC}"
    echo -e "${GREEN}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}                                                                              ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${YELLOW}🎖️  Created by: David Keane (IrishRanger) + Claude Code${NC}                   ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${YELLOW}🚀  Project: RangerBlock P2P Network${NC}                                      ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${YELLOW}🌐  Decentralized Communication System${NC}                                    ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                                              ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   ${PURPLE}${BOLD}\"Rangers lead the way!\"${NC}                                                  ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                                              ${GREEN}║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${WHITE}Ready to chat? Run: ${CYAN}${BOLD}./just-chat.sh -c${NC}"
    echo ""

    # Ask user if they want to start chatting now
    read -p "  Start chatting now? (Y/n): " start_chat
    if [[ ! "$start_chat" =~ ^[Nn]$ ]]; then
        echo ""
        chat
    fi
}

# ============================================================================
# CHAT
# ============================================================================

chat() {
    print_small_banner

    if [ ! -d "$INSTALL_DIR" ]; then
        error "RangerBlock not installed! Run: ./just-chat.sh (no args) to install"
        exit 1
    fi

    cd "$INSTALL_DIR"

    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        # Try common Node.js locations
        if [ -x "/usr/bin/node" ]; then
            NODE_CMD="/usr/bin/node"
        elif [ -x "/usr/local/bin/node" ]; then
            NODE_CMD="/usr/local/bin/node"
        elif [ -x "$HOME/.nvm/versions/node/*/bin/node" ]; then
            NODE_CMD=$(ls -1 $HOME/.nvm/versions/node/*/bin/node 2>/dev/null | head -1)
        else
            echo ""
            error "Node.js not found in PATH!"
            echo ""
            echo -e "  ${YELLOW}To fix, run one of these:${NC}"
            echo ""
            echo -e "  ${CYAN}# Debian/Ubuntu:${NC}"
            echo -e "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
            echo -e "  sudo apt-get install -y nodejs"
            echo ""
            echo -e "  ${CYAN}# Then restart your shell:${NC}"
            echo -e "  exec bash"
            echo ""
            exit 1
        fi
    else
        NODE_CMD="node"
    fi

    # Check for saved nickname or prompt for one
    NICK_FILE="$INSTALL_DIR/.nickname"
    if [ -f "$NICK_FILE" ]; then
        SAVED_NICK=$(cat "$NICK_FILE")
    else
        SAVED_NICK=""
    fi

    # Ask for nickname on first run or if user wants to change
    if [ -z "$SAVED_NICK" ]; then
        echo ""
        echo -e "  ${CYAN}╔════════════════════════════════════════════════╗${NC}"
        echo -e "  ${CYAN}║${NC}  ${WHITE}${BOLD}CHOOSE YOUR NICKNAME${NC}                          ${CYAN}║${NC}"
        echo -e "  ${CYAN}╚════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "  ${GRAY}This is how others will see you in chat.${NC}"
        echo -e "  ${GRAY}Max 15 characters. Letters, numbers, and - _ allowed.${NC}"
        echo ""
        read -p "  Enter nickname: " USER_NICK

        # Validate and clean nickname
        USER_NICK=$(echo "$USER_NICK" | tr -cd '[:alnum:]-_' | cut -c1-15)

        if [ -z "$USER_NICK" ]; then
            # Generate random nickname if empty
            USER_NICK="Ranger-$(head -c 4 /dev/urandom | xxd -p)"
        fi

        # Save nickname
        echo "$USER_NICK" > "$NICK_FILE"
        echo ""
        success "Nickname saved: ${CYAN}$USER_NICK${NC}"
        echo -e "  ${GRAY}(Change later with: /nick NewName)${NC}"
        echo ""
        sleep 1
    else
        USER_NICK="$SAVED_NICK"
        echo -e "  ${GRAY}Chatting as: ${CYAN}$USER_NICK${NC}"
    fi

    echo -e "  ${CYAN}Connecting to RangerBlock Network...${NC}"
    echo -e "  ${GRAY}Relay: ws://$AWS_RELAY:$AWS_PORT${NC}"
    echo ""
    echo -e "  ${YELLOW}Commands: /help, /who, /nick, /quit${NC}"
    echo -e "  ${GRAY}────────────────────────────────────────────────────${NC}"
    echo ""

    # Run the chat client with nickname
    if [ -f blockchain-chat.cjs ]; then
        $NODE_CMD blockchain-chat.cjs --relay "$AWS_RELAY:$AWS_PORT" --nick "$USER_NICK"
    else
        error "Chat client not found. Run: ./just-chat.sh to reinstall"
        exit 1
    fi
}

# ============================================================================
# VOICE CHAT
# ============================================================================

voice() {
    print_small_banner

    if [ ! -d "$INSTALL_DIR" ]; then
        error "RangerBlock not installed! Run: ./just-chat.sh (no args) to install"
        exit 1
    fi

    cd "$INSTALL_DIR"

    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        error "Node.js not found in PATH!"
        exit 1
    fi

    # Check for SoX
    if ! command -v sox &> /dev/null; then
        warning "SoX not installed! Voice chat requires SoX."
        echo ""
        echo -e "  ${CYAN}Install with:${NC}"
        echo -e "    macOS:  brew install sox"
        echo -e "    Debian: sudo apt install sox libsox-fmt-all"
        echo ""
        exit 1
    fi

    echo -e "  ${CYAN}Starting Voice Chat...${NC}"
    echo -e "  ${GRAY}Relay: ws://$AWS_RELAY:$AWS_PORT${NC}"
    echo ""
    echo -e "  ${YELLOW}Commands: /voice on, /voice off, /call <user>, /help${NC}"
    echo -e "  ${GRAY}────────────────────────────────────────────────────${NC}"
    echo ""

    # Run voice chat client
    if [ -f voice-chat.cjs ]; then
        node voice-chat.cjs --relay "$AWS_RELAY:$AWS_PORT"
    else
        error "Voice chat client not found. Run: ./just-chat.sh -u to update"
        exit 1
    fi
}

# ============================================================================
# VIDEO CHAT
# ============================================================================

video() {
    print_small_banner

    if [ ! -d "$INSTALL_DIR" ]; then
        error "RangerBlock not installed! Run: ./just-chat.sh (no args) to install"
        exit 1
    fi

    cd "$INSTALL_DIR"

    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        error "Node.js not found in PATH!"
        exit 1
    fi

    # Check for ffmpeg
    if ! command -v ffmpeg &> /dev/null; then
        warning "ffmpeg not installed! Video chat requires ffmpeg."
        echo ""
        echo -e "  ${CYAN}Install with:${NC}"
        echo -e "    macOS:  brew install ffmpeg"
        echo -e "    Debian: sudo apt install ffmpeg"
        echo ""
        exit 1
    fi

    # Check for SoX (for audio)
    if ! command -v sox &> /dev/null; then
        warning "SoX not installed! Audio in video chat requires SoX."
        echo ""
        echo -e "  ${CYAN}Install with:${NC}"
        echo -e "    macOS:  brew install sox"
        echo -e "    Debian: sudo apt install sox libsox-fmt-all"
        echo ""
        exit 1
    fi

    echo -e "  ${CYAN}Starting Video Chat...${NC}"
    echo -e "  ${GRAY}Relay: ws://$AWS_RELAY:$AWS_PORT${NC}"
    echo ""
    echo -e "  ${YELLOW}Commands: /video on, /video off, /voice on, /call <user>, /help${NC}"
    echo -e "  ${GRAY}────────────────────────────────────────────────────${NC}"
    echo ""

    # Run video chat client
    if [ -f video-chat.cjs ]; then
        node video-chat.cjs --relay "$AWS_RELAY:$AWS_PORT"
    else
        error "Video chat client not found. Run: ./just-chat.sh -u to update"
        exit 1
    fi
}

# ============================================================================
# TEST CONNECTION
# ============================================================================

test_connection() {
    print_small_banner

    echo -e "  ${WHITE}${BOLD}Testing RangerBlock Network Connection${NC}"
    echo ""

    step "🔍 Network Test"

    info "Target: ${CYAN}$AWS_RELAY:$AWS_PORT${NC}"
    echo ""

    # Test 1: Ping
    echo -ne "  ${GRAY}[1/3]${NC} Ping test... "
    if ping -c 1 -W 3 "$AWS_RELAY" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Reachable${NC}"
        PING_OK=true
    else
        echo -e "${YELLOW}⚠ No ping (may be blocked)${NC}"
        PING_OK=false
    fi

    # Test 2: Dashboard API
    echo -ne "  ${GRAY}[2/3]${NC} Dashboard API... "
    RESPONSE=$(curl -s --connect-timeout 5 "http://$AWS_RELAY:$DASHBOARD_PORT/api/nodes" 2>/dev/null)
    if [ -n "$RESPONSE" ]; then
        echo -e "${GREEN}✓ Online${NC}"
        API_OK=true
    else
        echo -e "${RED}✗ Not responding${NC}"
        API_OK=false
    fi

    # Test 3: WebSocket port
    echo -ne "  ${GRAY}[3/3]${NC} WebSocket port... "
    if nc -zw3 "$AWS_RELAY" "$AWS_PORT" 2>/dev/null; then
        echo -e "${GREEN}✓ Open${NC}"
        WS_OK=true
    elif command -v nc &> /dev/null; then
        echo -e "${RED}✗ Closed/blocked${NC}"
        WS_OK=false
    else
        echo -e "${YELLOW}⚠ nc not installed (skipped)${NC}"
        WS_OK=true  # Assume OK if we can't test
    fi

    echo ""

    # Summary
    if [ "$API_OK" = true ] && [ "$WS_OK" = true ]; then
        echo -e "  ${GREEN}${BOLD}╔════════════════════════════════════════╗${NC}"
        echo -e "  ${GREEN}${BOLD}║   ✓ ALL TESTS PASSED - READY TO CHAT!  ║${NC}"
        echo -e "  ${GREEN}${BOLD}╚════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "  Run: ${CYAN}./just-chat.sh -c${NC} to start chatting"
    else
        echo -e "  ${YELLOW}╔════════════════════════════════════════╗${NC}"
        echo -e "  ${YELLOW}║   ⚠ SOME TESTS FAILED                  ║${NC}"
        echo -e "  ${YELLOW}╚════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "  ${GRAY}The relay may be offline. Try again later.${NC}"
    fi
    echo ""
}

# ============================================================================
# UPDATE
# ============================================================================

update() {
    print_small_banner

    step "🔄 Updating RangerBlock Chat"

    if [ ! -d "$INSTALL_DIR" ]; then
        error "RangerBlock not installed! Run: ./just-chat.sh to install"
        exit 1
    fi

    cd "$INSTALL_DIR"

    info "Downloading latest files..."

    FILES=(
        "core/blockchain-chat.cjs"
        "core/blockchain-ping.cjs"
        "core/voice-chat.cjs"
        "core/video-chat.cjs"
    )

    for file in "${FILES[@]}"; do
        filename=$(basename "$file")
        echo -ne "  Updating ${WHITE}$filename${NC}... "
        if curl -fsSL "$GITHUB_RAW/$file" -o "$filename" 2>/dev/null; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗${NC}"
        fi
    done

    # Update this script too
    SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
    echo -ne "  Updating ${WHITE}just-chat.sh${NC}... "
    if curl -fsSL "$GITHUB_RAW/just-chat/just-chat.sh" -o "$SCRIPT_PATH.new" 2>/dev/null; then
        mv "$SCRIPT_PATH.new" "$SCRIPT_PATH"
        chmod +x "$SCRIPT_PATH"
        echo -e "${GREEN}✓${NC}"
    else
        rm -f "$SCRIPT_PATH.new"
        echo -e "${YELLOW}⚠ (kept current version)${NC}"
    fi

    echo ""
    success "Update complete!"
    echo ""
}

# ============================================================================
# UNINSTALL
# ============================================================================

uninstall() {
    print_small_banner

    echo -e "  ${RED}${BOLD}⚠️  UNINSTALL RANGERBLOCK${NC}"
    echo ""
    echo -e "  ${GRAY}This will remove:${NC}"
    echo -e "  ${GRAY}  • ${WHITE}$INSTALL_DIR${NC}"
    echo -e "  ${GRAY}  • All chat client files${NC}"
    echo -e "  ${GRAY}  • Your node identity${NC}"
    echo ""

    read -p "  Are you sure? (y/N): " confirm

    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        echo ""
        info "Removing files..."

        if [ -d "$INSTALL_DIR" ]; then
            rm -rf "$INSTALL_DIR"
            success "Removed $INSTALL_DIR"
        fi

        echo ""
        echo -e "  ${GREEN}${BOLD}Uninstall complete!${NC}"
        echo ""
        echo -e "  ${GRAY}Thanks for trying RangerBlock!${NC}"
        echo -e "  ${GRAY}To reinstall: curl the setup script again${NC}"
        echo ""
        echo -e "  ${PURPLE}Rangers lead the way! 🎖️${NC}"
        echo ""
    else
        echo ""
        info "Uninstall cancelled"
        echo ""
    fi
}

# ============================================================================
# HELP
# ============================================================================

show_help() {
    print_small_banner

    echo -e "  ${WHITE}${BOLD}USAGE:${NC}"
    echo ""
    echo -e "  ${CYAN}./just-chat.sh${NC}                   ${GRAY}Install RangerBlock Chat${NC}"
    echo -e "  ${CYAN}./just-chat.sh -c${NC}                ${GRAY}Start chatting${NC}"
    echo -e "  ${CYAN}./just-chat.sh -chat${NC}             ${GRAY}Start chatting (alias)${NC}"
    echo -e "  ${CYAN}./just-chat.sh -v${NC}                ${GRAY}Start voice chat${NC}"
    echo -e "  ${CYAN}./just-chat.sh -voice${NC}            ${GRAY}Start voice chat (alias)${NC}"
    echo -e "  ${CYAN}./just-chat.sh -video${NC}            ${GRAY}Start video chat${NC}"
    echo -e "  ${CYAN}./just-chat.sh -t${NC}                ${GRAY}Test connection${NC}"
    echo -e "  ${CYAN}./just-chat.sh -test${NC}             ${GRAY}Test connection (alias)${NC}"
    echo -e "  ${CYAN}./just-chat.sh -u${NC}                ${GRAY}Update to latest version${NC}"
    echo -e "  ${CYAN}./just-chat.sh -update${NC}           ${GRAY}Update (alias)${NC}"
    echo -e "  ${CYAN}./just-chat.sh -h${NC}                ${GRAY}Show this help${NC}"
    echo -e "  ${CYAN}./just-chat.sh -getoffmymachine${NC}  ${GRAY}Uninstall everything${NC}"
    echo ""
    echo -e "  ${WHITE}${BOLD}CHAT COMMANDS:${NC}"
    echo ""
    echo -e "  ${CYAN}/help${NC}      ${GRAY}Show chat commands${NC}"
    echo -e "  ${CYAN}/who${NC}       ${GRAY}List online users${NC}"
    echo -e "  ${CYAN}/nick${NC}      ${GRAY}Change nickname${NC}"
    echo -e "  ${CYAN}/msg${NC}       ${GRAY}Private message${NC}"
    echo -e "  ${CYAN}/voice${NC}     ${GRAY}Toggle voice chat (on/off)${NC}"
    echo -e "  ${CYAN}/video${NC}     ${GRAY}Toggle video chat (on/off)${NC}"
    echo -e "  ${CYAN}/call${NC}      ${GRAY}Private call to user${NC}"
    echo -e "  ${CYAN}/quit${NC}      ${GRAY}Leave chat${NC}"
    echo ""
    echo -e "  ${WHITE}${BOLD}NETWORK INFO:${NC}"
    echo ""
    echo -e "  ${GRAY}Relay Server:${NC}  ${CYAN}$AWS_RELAY:$AWS_PORT${NC}"
    echo -e "  ${GRAY}Dashboard:${NC}     ${CYAN}http://$AWS_RELAY:$DASHBOARD_PORT${NC}"
    echo -e "  ${GRAY}Protocol:${NC}      ${CYAN}WebSocket + JSON${NC}"
    echo ""
    echo -e "  ${YELLOW}🎖️  Created by David Keane (IrishRanger) + Claude Code${NC}"
    echo -e "  ${YELLOW}🚀  Project: RangerBlock P2P Network${NC}"
    echo ""
}

# ============================================================================
# STATUS
# ============================================================================

status() {
    print_small_banner

    echo -e "  ${WHITE}${BOLD}NETWORK STATUS${NC}"
    echo ""

    # Check if installed
    if [ -d "$INSTALL_DIR" ]; then
        success "Client installed: ${CYAN}$INSTALL_DIR${NC}"

        # Get node identity
        if [ -f "$INSTALL_DIR/node-identity.json" ]; then
            NODE_ID=$(grep -o '"nodeId":"[^"]*"' "$INSTALL_DIR/node-identity.json" | cut -d'"' -f4)
            success "Node ID: ${CYAN}$NODE_ID${NC}"
        fi
    else
        warning "Client not installed"
    fi

    echo ""

    # Check relay status
    info "Checking AWS Relay..."
    RESPONSE=$(curl -s --connect-timeout 5 "http://$AWS_RELAY:$DASHBOARD_PORT/api/nodes" 2>/dev/null)

    if [ -n "$RESPONSE" ]; then
        RELAY_NAME=$(echo "$RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
        ACTIVE_NODES=$(echo "$RESPONSE" | grep -o '"activeNodes":[0-9]*' | cut -d':' -f2)
        TOTAL_MSGS=$(echo "$RESPONSE" | grep -o '"totalMessages":[0-9]*' | cut -d':' -f2)

        success "Relay: ${GREEN}ONLINE${NC}"
        success "Name: ${CYAN}${RELAY_NAME:-AWS-Relay}${NC}"
        success "Active Nodes: ${CYAN}${ACTIVE_NODES:-0}${NC}"
        success "Total Messages: ${CYAN}${TOTAL_MSGS:-0}${NC}"
    else
        error "Relay: ${RED}OFFLINE${NC}"
    fi

    echo ""
}

# ============================================================================
# MAIN
# ============================================================================

# ============================================================================
# WELCOME MENU
# ============================================================================

welcome_menu() {
    print_banner

    echo -e "${WHITE}${BOLD}  Welcome to RangerBlock P2P Chat!${NC}"
    echo ""
    echo -e "${GRAY}  A secure blockchain-based chat network created for${NC}"
    echo -e "${GRAY}  educational and research purposes.${NC}"
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${WHITE}${BOLD}WHAT WOULD YOU LIKE TO DO?${NC}                                  ${CYAN}║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}                                                              ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${GREEN}[1]${NC} ${WHITE}Install & Chat${NC}  - First time? Start here!              ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${GREEN}[2]${NC} ${WHITE}Start Chatting${NC}  - Text chat                            ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${GREEN}[3]${NC} ${WHITE}Voice Chat${NC}      - Talk with voice! 🎤                   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${GREEN}[4]${NC} ${WHITE}Video Chat${NC}      - Video + Voice + Text! 📹             ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${GREEN}[5]${NC} ${WHITE}Test Connection${NC} - Check if AWS relay is online         ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${GREEN}[6]${NC} ${WHITE}Network Status${NC}  - See who's online                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${GREEN}[7]${NC} ${WHITE}Help${NC}            - Show all commands                    ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}   ${GREEN}[0]${NC} ${WHITE}Exit${NC}                                                   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                              ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GRAY}  AWS Relay: ${CYAN}44.222.101.125:5555${NC} ${GRAY}(24/7 uptime)${NC}"
    echo ""

    read -p "  Enter choice [1-7, 0 to exit]: " choice

    case "$choice" in
        1)
            install
            ;;
        2)
            chat
            ;;
        3)
            voice
            ;;
        4)
            video
            ;;
        5)
            test_connection
            ;;
        6)
            status
            ;;
        7)
            show_help
            ;;
        0|q|Q)
            echo ""
            echo -e "  ${PURPLE}Rangers lead the way! 🎖️${NC}"
            echo ""
            exit 0
            ;;
        *)
            echo ""
            warning "Invalid choice. Please enter 1-7 or 0."
            sleep 1
            welcome_menu
            ;;
    esac
}

# ============================================================================
# MAIN
# ============================================================================

case "${1:-}" in
    -c|-chat|--chat)
        chat
        ;;
    -v|-voice|--voice)
        voice
        ;;
    -video|--video)
        video
        ;;
    -t|-test|--test)
        test_connection
        ;;
    -u|-update|--update)
        update
        ;;
    -h|-help|--help)
        show_help
        ;;
    -s|-status|--status)
        status
        ;;
    -i|-install|--install)
        install
        ;;
    -getoffmymachine|--getoffmymachine|-uninstall|--uninstall)
        uninstall
        ;;
    "")
        # No args = show welcome menu
        welcome_menu
        ;;
    *)
        echo ""
        echo -e "  ${RED}Unknown option: $1${NC}"
        echo ""
        echo -e "  Run ${CYAN}./just-chat.sh -h${NC} for help"
        echo ""
        exit 1
        ;;
esac

#!/bin/bash
#
# RangerBlock Relay Setup Script
# ================================
# Lightweight relay server for any Linux server
# Includes optional ngrok for internet exposure
#
# Created: November 30, 2025
# Author: David Keane (IrishRanger) + Claude Code (Ranger)
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-cloud-relay.sh | bash
#
# Options:
#   --with-ngrok     Install ngrok for internet access
#   --ngrok-token    Your ngrok authtoken
#   --bridge         Enable bridge mode (connect to other relays)
#
# Rangers lead the way!

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Parse arguments
INSTALL_NGROK=false
NGROK_TOKEN=""
ENABLE_BRIDGE=false

for arg in "$@"; do
    case $arg in
        --with-ngrok)
            INSTALL_NGROK=true
            shift
            ;;
        --ngrok-token=*)
            NGROK_TOKEN="${arg#*=}"
            INSTALL_NGROK=true
            shift
            ;;
        --bridge)
            ENABLE_BRIDGE=true
            shift
            ;;
    esac
done

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║       🎖️  RangerBlock Relay Server Setup  🎖️                  ║"
echo "║                                                               ║"
echo "║       Lightweight P2P Blockchain Relay Server                 ║"
echo "║       Created by IrishRanger + Claude Code                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ═══════════════════════════════════════════════════════════════════
# DETECT OS
# ═══════════════════════════════════════════════════════════════════

detect_os() {
    if [ -f /etc/debian_version ]; then
        OS="debian"
        PKG_MANAGER="apt"
    elif [ -f /etc/redhat-release ]; then
        OS="redhat"
        PKG_MANAGER="yum"
    elif [ -f /etc/arch-release ]; then
        OS="arch"
        PKG_MANAGER="pacman"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        PKG_MANAGER="brew"
    else
        OS="unknown"
        PKG_MANAGER="unknown"
    fi
    echo -e "${BLUE}Detected OS: ${OS}${NC}"
}

# ═══════════════════════════════════════════════════════════════════
# INSTALL NODE.JS
# ═══════════════════════════════════════════════════════════════════

install_nodejs() {
    echo -e "\n${YELLOW}[1/6] Installing Node.js 20...${NC}"

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        echo -e "${GREEN}Node.js already installed: ${NODE_VERSION}${NC}"
    else
        if [ "$OS" = "debian" ]; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt install -y nodejs
        elif [ "$OS" = "redhat" ]; then
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo yum install -y nodejs
        elif [ "$OS" = "arch" ]; then
            sudo pacman -S --noconfirm nodejs npm
        elif [ "$OS" = "macos" ]; then
            brew install node@20
        fi
        echo -e "${GREEN}Node.js installed: $(node --version)${NC}"
    fi
}

# ═══════════════════════════════════════════════════════════════════
# INSTALL PM2
# ═══════════════════════════════════════════════════════════════════

install_pm2() {
    echo -e "\n${YELLOW}[2/6] Installing PM2 process manager...${NC}"

    if command -v pm2 &> /dev/null; then
        echo -e "${GREEN}PM2 already installed${NC}"
    else
        sudo npm install -g pm2 || npm install -g pm2
        echo -e "${GREEN}PM2 installed${NC}"
    fi
}

# ═══════════════════════════════════════════════════════════════════
# INSTALL NGROK (OPTIONAL)
# ═══════════════════════════════════════════════════════════════════

install_ngrok() {
    if [ "$INSTALL_NGROK" = false ]; then
        echo -e "\n${YELLOW}[3/6] Skipping ngrok (use --with-ngrok to install)${NC}"
        return
    fi

    echo -e "\n${YELLOW}[3/6] Installing ngrok...${NC}"

    if command -v ngrok &> /dev/null; then
        echo -e "${GREEN}ngrok already installed${NC}"
    else
        if [ "$OS" = "debian" ]; then
            curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
            echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
            sudo apt update && sudo apt install -y ngrok
        elif [ "$OS" = "redhat" ]; then
            curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/yum.repos.d/ngrok.asc
            echo "[ngrok]
name=ngrok
baseurl=https://ngrok-agent.s3.amazonaws.com/rpm
enabled=1
gpgcheck=1
gpgkey=https://ngrok-agent.s3.amazonaws.com/ngrok.asc" | sudo tee /etc/yum.repos.d/ngrok.repo
            sudo yum install -y ngrok
        elif [ "$OS" = "macos" ]; then
            brew install ngrok/ngrok/ngrok
        else
            # Generic install via snap or binary
            curl -s https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz | sudo tar xzf - -C /usr/local/bin
        fi
        echo -e "${GREEN}ngrok installed${NC}"
    fi

    # Configure ngrok authtoken
    if [ -n "$NGROK_TOKEN" ]; then
        echo -e "${CYAN}Configuring ngrok authtoken...${NC}"
        ngrok config add-authtoken "$NGROK_TOKEN"
        echo -e "${GREEN}ngrok configured with authtoken${NC}"
    else
        echo -e "${YELLOW}Note: Run 'ngrok config add-authtoken YOUR_TOKEN' to configure${NC}"
        echo -e "${YELLOW}Get your token at: https://dashboard.ngrok.com/get-started/your-authtoken${NC}"
    fi
}

# ═══════════════════════════════════════════════════════════════════
# SETUP DIRECTORIES
# ═══════════════════════════════════════════════════════════════════

setup_directories() {
    echo -e "\n${YELLOW}[4/6] Setting up directories...${NC}"

    INSTALL_DIR="$HOME/rangerblock-server"
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$INSTALL_DIR/.personal"
    cd "$INSTALL_DIR"

    echo -e "${GREEN}Created: $INSTALL_DIR${NC}"
}

# ═══════════════════════════════════════════════════════════════════
# DOWNLOAD FILES
# ═══════════════════════════════════════════════════════════════════

download_files() {
    echo -e "\n${YELLOW}[5/6] Downloading server files...${NC}"

    REPO_URL="https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock"

    # Download relay server (bridge version for full features)
    echo "  Downloading relay-server-bridge.cjs..."
    curl -sSL "$REPO_URL/core/relay-server-bridge.cjs" -o relay-server.cjs

    # Download terminal chat
    echo "  Downloading blockchain-chat.cjs..."
    curl -sSL "$REPO_URL/core/blockchain-chat.cjs" -o blockchain-chat.cjs

    # Download ping tool
    echo "  Downloading blockchain-ping.cjs..."
    curl -sSL "$REPO_URL/core/blockchain-ping.cjs" -o blockchain-ping.cjs

    # Create package.json
    cat > package.json << 'PACKAGE_EOF'
{
  "name": "rangerblock-server",
  "version": "2.0.0",
  "description": "RangerBlock P2P Relay Server with Bridge Support",
  "main": "relay-server.cjs",
  "scripts": {
    "relay": "node relay-server.cjs",
    "chat": "node blockchain-chat.cjs",
    "ping": "node blockchain-ping.cjs",
    "start": "pm2 start relay-server.cjs --name rangerblock-relay",
    "stop": "pm2 stop rangerblock-relay",
    "restart": "pm2 restart rangerblock-relay",
    "logs": "pm2 logs rangerblock-relay",
    "status": "pm2 status",
    "ngrok": "ngrok tcp 5555",
    "ngrok:start": "pm2 start 'ngrok tcp 5555' --name rangerblock-ngrok"
  },
  "dependencies": {
    "ws": "^8.14.2",
    "uuid": "^9.0.0",
    "express": "^4.19.2"
  },
  "author": "David Keane (IrishRanger) + Claude Code",
  "license": "MIT"
}
PACKAGE_EOF

    # Create default config
    cat > relay-config.json << 'CONFIG_EOF'
{
  "relay": {
    "name": "rangerblock-relay",
    "port": 5555,
    "dashboardPort": 5556,
    "region": "local"
  },
  "bridge": {
    "enabled": false,
    "reconnectInterval": 5000,
    "heartbeatInterval": 30000,
    "peers": []
  }
}
CONFIG_EOF

    # Install dependencies
    npm install --production 2>/dev/null || npm install

    echo -e "${GREEN}Files downloaded and dependencies installed${NC}"
}

# ═══════════════════════════════════════════════════════════════════
# START RELAY
# ═══════════════════════════════════════════════════════════════════

start_relay() {
    echo -e "\n${YELLOW}[6/6] Starting relay server...${NC}"

    # Start with PM2
    pm2 start relay-server.cjs --name rangerblock-relay

    # Save PM2 config
    pm2 save

    # Setup startup script (may need sudo)
    echo -e "${CYAN}Setting up auto-start on boot...${NC}"
    if [ "$OS" = "macos" ]; then
        pm2 startup launchd -u $USER --hp $HOME 2>/dev/null || true
    else
        sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || pm2 startup 2>/dev/null || true
    fi

    echo -e "${GREEN}Relay server started!${NC}"

    # Start ngrok if requested
    if [ "$INSTALL_NGROK" = true ] && [ -n "$NGROK_TOKEN" ]; then
        echo -e "${CYAN}Starting ngrok tunnel...${NC}"
        pm2 start "ngrok tcp 5555" --name rangerblock-ngrok
        pm2 save
        sleep 3
        echo -e "${GREEN}ngrok tunnel started!${NC}"
    fi
}

# ═══════════════════════════════════════════════════════════════════
# PRINT INFO
# ═══════════════════════════════════════════════════════════════════

print_info() {
    EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || echo "UNKNOWN")

    echo -e "\n${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║               🎉 SETUP COMPLETE! 🎉                           ║"
    echo "╠═══════════════════════════════════════════════════════════════╣"
    echo -e "║  ${GREEN}External IP: ${EXTERNAL_IP}${CYAN}                              ║"
    echo "║  Relay Port: 5555                                             ║"
    echo "║  Dashboard:  5556                                             ║"
    echo "╠═══════════════════════════════════════════════════════════════╣"
    echo "║  COMMANDS:                                                    ║"
    echo "║    npm run relay     - Start relay (foreground)               ║"
    echo "║    npm run chat      - Terminal chat client                   ║"
    echo "║    npm run start     - Start with PM2 (background)            ║"
    echo "║    npm run logs      - View relay logs                        ║"
    echo "║    npm run status    - Check PM2 status                       ║"

    if [ "$INSTALL_NGROK" = true ]; then
        echo "║                                                               ║"
        echo "║  NGROK COMMANDS:                                              ║"
        echo "║    npm run ngrok       - Start ngrok tunnel (foreground)     ║"
        echo "║    npm run ngrok:start - Start ngrok with PM2                ║"
        echo "║                                                               ║"
        echo "║  Get ngrok URL:                                               ║"
        echo "║    curl -s localhost:4040/api/tunnels | jq '.tunnels[0].public_url'"
    fi

    echo "╠═══════════════════════════════════════════════════════════════╣"
    echo "║  FIREWALL (if needed):                                        ║"
    echo "║    sudo ufw allow 5555/tcp                                    ║"
    echo "║    sudo ufw allow 5556/tcp                                    ║"
    echo "╠═══════════════════════════════════════════════════════════════╣"
    echo -e "║  ${GREEN}Dashboard: http://${EXTERNAL_IP}:5556${CYAN}                       ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo "Rangers lead the way! 🎖️"
    echo ""
}

# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

main() {
    detect_os

    if [ "$OS" = "unknown" ]; then
        echo -e "${RED}Unknown OS. Please install manually.${NC}"
        exit 1
    fi

    # Update system (optional for speed)
    echo -e "\n${YELLOW}Updating system packages...${NC}"
    if [ "$PKG_MANAGER" = "apt" ]; then
        sudo apt update -y 2>/dev/null || true
    fi

    install_nodejs
    install_pm2
    install_ngrok
    setup_directories
    download_files
    start_relay
    print_info
}

# Run
main

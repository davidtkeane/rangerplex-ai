#!/bin/bash
#
# RangerBlock Cloud Relay Setup Script
# =====================================
# Lightweight relay server for Google Cloud VM (or any Linux server)
# No UI, just relay server + terminal chat
#
# Created: November 30, 2025
# Author: David Keane (IrishRanger) + Claude Code (Ranger)
#
# Usage: curl -sSL https://raw.githubusercontent.com/davidtkeane/rangerblock-server/main/setup.sh | bash
#
# Rangers lead the way!

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     🎖️  RangerBlock Cloud Relay Setup  🎖️                 ║"
echo "║                                                           ║"
echo "║     Lightweight P2P Blockchain Relay Server               ║"
echo "║     Created by IrishRanger + Claude Code                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Detect OS
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
    else
        OS="unknown"
        PKG_MANAGER="unknown"
    fi
    echo -e "${BLUE}Detected OS: ${OS}${NC}"
}

# Install Node.js
install_nodejs() {
    echo -e "\n${YELLOW}[1/5] Installing Node.js 20...${NC}"

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
            sudo pacman -S nodejs npm
        fi
        echo -e "${GREEN}Node.js installed: $(node --version)${NC}"
    fi
}

# Install PM2
install_pm2() {
    echo -e "\n${YELLOW}[2/5] Installing PM2 process manager...${NC}"

    if command -v pm2 &> /dev/null; then
        echo -e "${GREEN}PM2 already installed${NC}"
    else
        sudo npm install -g pm2
        echo -e "${GREEN}PM2 installed${NC}"
    fi
}

# Create directory structure
setup_directories() {
    echo -e "\n${YELLOW}[3/5] Setting up directories...${NC}"

    INSTALL_DIR="$HOME/rangerblock-server"
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$INSTALL_DIR/.personal"
    cd "$INSTALL_DIR"

    echo -e "${GREEN}Created: $INSTALL_DIR${NC}"
}

# Download server files
download_files() {
    echo -e "\n${YELLOW}[4/5] Downloading server files...${NC}"

    REPO_URL="https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock"

    # Download relay server
    echo "  Downloading relay-server.cjs..."
    curl -sSL "$REPO_URL/core/relay-server.cjs" -o relay-server.cjs

    # Download terminal chat
    echo "  Downloading blockchain-chat.cjs..."
    curl -sSL "$REPO_URL/core/blockchain-chat.cjs" -o blockchain-chat.cjs

    # Download ping tool
    echo "  Downloading blockchain-ping.cjs..."
    curl -sSL "$REPO_URL/core/blockchain-ping.cjs" -o blockchain-ping.cjs

    # Create minimal package.json
    cat > package.json << 'PACKAGE_EOF'
{
  "name": "rangerblock-server",
  "version": "1.0.0",
  "description": "RangerBlock P2P Relay Server - Lightweight Edition",
  "main": "relay-server.cjs",
  "scripts": {
    "relay": "node relay-server.cjs",
    "chat": "node blockchain-chat.cjs",
    "ping": "node blockchain-ping.cjs",
    "start": "pm2 start relay-server.cjs --name rangerblock-relay",
    "stop": "pm2 stop rangerblock-relay",
    "restart": "pm2 restart rangerblock-relay",
    "logs": "pm2 logs rangerblock-relay",
    "status": "pm2 status"
  },
  "dependencies": {
    "ws": "^8.14.2",
    "uuid": "^9.0.0"
  },
  "author": "David Keane (IrishRanger) + Claude Code",
  "license": "MIT"
}
PACKAGE_EOF

    # Install dependencies
    npm install --production

    echo -e "${GREEN}Files downloaded and dependencies installed${NC}"
}

# Configure and start relay
start_relay() {
    echo -e "\n${YELLOW}[5/5] Starting relay server...${NC}"

    # Start with PM2
    pm2 start relay-server.cjs --name rangerblock-relay

    # Save PM2 config
    pm2 save

    # Setup startup script
    echo -e "${CYAN}Setting up auto-start on boot...${NC}"
    pm2 startup systemd -u $USER --hp $HOME | tail -1 | bash 2>/dev/null || true

    echo -e "${GREEN}Relay server started!${NC}"
}

# Print connection info
print_info() {
    # Get external IP
    EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || echo "UNKNOWN")

    echo -e "\n${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║           🎉 SETUP COMPLETE! 🎉                           ║"
    echo "╠═══════════════════════════════════════════════════════════╣"
    echo -e "║  ${GREEN}External IP: ${EXTERNAL_IP}${CYAN}                          ║"
    echo "║  Relay Port: 5555                                         ║"
    echo "║  Dashboard:  5556                                         ║"
    echo "╠═══════════════════════════════════════════════════════════╣"
    echo "║  COMMANDS:                                                ║"
    echo "║    npm run relay    - Start relay (foreground)            ║"
    echo "║    npm run chat     - Terminal chat client                ║"
    echo "║    npm run start    - Start with PM2 (background)         ║"
    echo "║    npm run logs     - View relay logs                     ║"
    echo "║    npm run status   - Check PM2 status                    ║"
    echo "╠═══════════════════════════════════════════════════════════╣"
    echo "║  FIREWALL: Make sure port 5555 is open!                   ║"
    echo "║                                                           ║"
    echo "║  gcloud compute firewall-rules create rangerblock \\       ║"
    echo "║    --allow tcp:5555 --source-ranges 0.0.0.0/0             ║"
    echo "╠═══════════════════════════════════════════════════════════╣"
    echo "║  Connect from RangerPlex:                                 ║"
    echo -e "║    Host: ${GREEN}${EXTERNAL_IP}${CYAN}    Port: 5555                   ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo "Rangers lead the way! 🎖️"
}

# Main installation
main() {
    detect_os

    if [ "$OS" = "unknown" ]; then
        echo -e "${RED}Unsupported OS. Please install manually.${NC}"
        exit 1
    fi

    # Update system
    echo -e "\n${YELLOW}Updating system packages...${NC}"
    if [ "$PKG_MANAGER" = "apt" ]; then
        sudo apt update -y
    fi

    install_nodejs
    install_pm2
    setup_directories
    download_files
    start_relay
    print_info
}

# Run main
main

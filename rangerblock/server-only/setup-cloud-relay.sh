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
#   --with-ngrok       Install ngrok for internet access
#   --ngrok-token=XXX  Your ngrok authtoken
#   --bridge           Enable bridge mode (connect to other relays)
#   --machine=NAME     Machine name (M3Pro, M1Air, M4Max, KaliCloud, LenovoWin11, MSIVector, etc.)
#   --import-id=FILE   Import existing node_identity.json file
#
# Rangers lead the way!

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Parse arguments
INSTALL_NGROK=false
NGROK_TOKEN=""
ENABLE_BRIDGE=false
MACHINE_NAME=""
IMPORT_ID=""

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
        --machine=*)
            MACHINE_NAME="${arg#*=}"
            shift
            ;;
        --import-id=*)
            IMPORT_ID="${arg#*=}"
            shift
            ;;
    esac
done

# Machine selection menu if not provided
select_machine() {
    if [ -z "$MACHINE_NAME" ]; then
        echo -e "\n${MAGENTA}Select your machine:${NC}"
        echo ""
        echo -e "  ${GREEN}[1]${NC} M3Pro      - M3 Pro Genesis (macOS)"
        echo -e "  ${GREEN}[2]${NC} M1Air      - M1 Air Peer (macOS)"
        echo -e "  ${GREEN}[3]${NC} M4Max      - M4 Max Compute (macOS)"
        echo -e "  ${GREEN}[4]${NC} KaliCloud  - Kali Cloud VM (Google Cloud)"
        echo -e "  ${GREEN}[5]${NC} LenovoWin11- Lenovo Windows 11"
        echo -e "  ${GREEN}[6]${NC} MSIVector  - MSI Vector Gaming"
        echo -e "  ${GREEN}[7]${NC} KaliVM     - Kali VM (Local)"
        echo -e "  ${GREEN}[8]${NC} Other      - Enter custom name"
        echo ""
        read -p "Enter choice (1-8): " machine_choice

        case $machine_choice in
            1) MACHINE_NAME="M3Pro" ;;
            2) MACHINE_NAME="M1Air" ;;
            3) MACHINE_NAME="M4Max" ;;
            4) MACHINE_NAME="KaliCloud" ;;
            5) MACHINE_NAME="LenovoWin11" ;;
            6) MACHINE_NAME="MSIVector" ;;
            7) MACHINE_NAME="KaliVM" ;;
            8)
                read -p "Enter machine name: " MACHINE_NAME
                ;;
            *)
                MACHINE_NAME="RangerNode-$(hostname | tr -d ' ')"
                ;;
        esac

        echo -e "${GREEN}Selected: $MACHINE_NAME${NC}"
    fi
}

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

    # Create minimal package.json (only 2 dependencies!)
    cat > package.json << 'PACKAGE_EOF'
{
  "name": "rangerblock-server",
  "version": "2.0.0",
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
    "status": "pm2 status",
    "ngrok": "ngrok tcp 5555",
    "ngrok:start": "pm2 start 'ngrok tcp 5555' --name rangerblock-ngrok"
  },
  "dependencies": {
    "ws": "^8.18.0",
    "express": "^4.21.0"
  },
  "author": "David Keane (IrishRanger) + Claude Code",
  "license": "MIT"
}
PACKAGE_EOF

    # Create relay config with machine name and bridge peers
    cat > relay-config.json << CONFIG_EOF
{
  "relay": {
    "name": "${MACHINE_NAME:-rangerblock-relay}",
    "port": 5555,
    "dashboardPort": 5556,
    "region": "local"
  },
  "bridge": {
    "enabled": true,
    "reconnectInterval": 5000,
    "heartbeatInterval": 30000,
    "peers": [
      {
        "name": "ngrok-ireland",
        "host": "YOUR_NGROK_HOST_HERE",
        "port": 12345,
        "enabled": true,
        "comment": "M3Pro Genesis via ngrok tunnel"
      },
      {
        "name": "kali-cloud",
        "host": "YOUR_CLOUD_IP_HERE",
        "port": 5555,
        "enabled": true,
        "comment": "Google Cloud 24/7 relay"
      }
    ]
  }
}
CONFIG_EOF

    # Handle identity file
    if [ -n "$IMPORT_ID" ] && [ -f "$IMPORT_ID" ]; then
        echo -e "${CYAN}  Importing existing identity from: $IMPORT_ID${NC}"
        cp "$IMPORT_ID" .personal/node_identity.json
        echo -e "${GREEN}  Identity preserved!${NC}"
    else
        # Create new identity with machine name
        NODE_ID="${MACHINE_NAME:-RangerNode}-$(date +%s | tail -c 5)"
        cat > .personal/node_identity.json << IDENTITY_EOF
{
  "node_id": "$NODE_ID",
  "node_type": "relay",
  "node_name": "${MACHINE_NAME:-RangerBlock} Node",
  "platform": {
    "system": "$(uname -s)",
    "machine": "$(hostname)",
    "processor": "$(uname -m)"
  },
  "network": {
    "relay_port": 5555,
    "dashboard_port": 5556
  },
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "philosophy": "One foot in front of the other",
  "mission": "RangerBlock P2P Network Relay"
}
IDENTITY_EOF
        echo -e "${GREEN}  Created new identity: $NODE_ID${NC}"
    fi

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
    echo -e "║  ${GREEN}Machine:     ${MACHINE_NAME}${CYAN}                                       ║"
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

    # Select machine if not provided via argument
    select_machine

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

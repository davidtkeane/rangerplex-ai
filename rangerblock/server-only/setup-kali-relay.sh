#!/bin/bash
#
# RangerBlock Relay Setup Script for Kali Linux (VM or Native)
# ============================================================
# Works on: Kali UTM (Mac), VMware, VirtualBox, WSL2, AWS, GCP, Native Linux
#
# Created: November 30, 2025
# Author: David Keane (IrishRanger) + Claude Code (Ranger)
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-kali-relay.sh | bash
#
# Options:
#   -n, --name        Machine name (default: auto-detect)
#   --fresh           Force fresh install (delete existing)
#   --update          Update existing installation
#   --with-ngrok      Install ngrok for internet tunneling
#   --ngrok-token     Your ngrok authtoken
#   --auto-start      Start relay server after install
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
NC='\033[0m' # No Color

# Defaults
MACHINE_NAME=""
NETWORK_MODE="auto"
WITH_NGROK=false
NGROK_TOKEN=""
FRESH_INSTALL=false
UPDATE_ONLY=false
AUTO_START=false
INSTALL_DIR="$HOME/rangerblock-server"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            MACHINE_NAME="$2"
            shift 2
            ;;
        --fresh)
            FRESH_INSTALL=true
            shift
            ;;
        --update)
            UPDATE_ONLY=true
            shift
            ;;
        --with-ngrok)
            WITH_NGROK=true
            shift
            ;;
        --ngrok-token)
            NGROK_TOKEN="$2"
            shift 2
            ;;
        --auto-start)
            AUTO_START=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Banner
clear
echo -e "${CYAN}"
cat << 'EOF'
 ======================================================================
       RANGERBLOCK RELAY SERVER - ONE-CLICK INSTALLER
 ======================================================================
       🐉 P2P Blockchain Network for Security Professionals 🐉
       Created by IrishRanger + Claude Code (Ranger)
       Version 2.1.0 - Fully Automatic Installation
 ======================================================================
EOF
echo -e "${NC}"

# =====================================================================
# CHECK FOR EXISTING INSTALLATION
# =====================================================================

EXISTING_INSTALL=false
if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/relay-server.cjs" ]; then
    EXISTING_INSTALL=true
fi

if [ "$EXISTING_INSTALL" = true ]; then
    if [ "$FRESH_INSTALL" = true ]; then
        echo -e "${YELLOW}🗑️  Fresh install requested - removing existing installation...${NC}"
        rm -rf "$INSTALL_DIR"
        echo -e "${GREEN}   Existing installation removed.${NC}"
    elif [ "$UPDATE_ONLY" = true ]; then
        echo -e "${BLUE}🔄 Update mode - updating server files only...${NC}"
    else
        echo -e "${MAGENTA}"
        echo " ┌─────────────────────────────────────────────────────────────┐"
        echo " │           EXISTING INSTALLATION DETECTED                     │"
        echo " │                                                              │"
        echo " │   Location: $INSTALL_DIR"
        echo " │                                                              │"
        echo " │   What would you like to do?                                │"
        echo " │                                                              │"
        echo " │   [1] Fresh Install (delete and reinstall everything)       │"
        echo " │   [2] Update (download latest server files only)            │"
        echo " │   [3] Cancel (keep existing installation)                   │"
        echo " │                                                              │"
        echo " └─────────────────────────────────────────────────────────────┘"
        echo -e "${NC}"

        read -p "Enter choice [1-3] (default: 2): " choice
        choice=${choice:-2}

        case $choice in
            1)
                echo -e "${YELLOW}🗑️  Removing existing installation...${NC}"
                rm -rf "$INSTALL_DIR"
                FRESH_INSTALL=true
                ;;
            2)
                echo -e "${BLUE}🔄 Updating existing installation...${NC}"
                UPDATE_ONLY=true
                ;;
            3)
                echo -e "${GREEN}✅ Keeping existing installation. Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${BLUE}🔄 Defaulting to update...${NC}"
                UPDATE_ONLY=true
                ;;
        esac
    fi
fi

# =====================================================================
# DETECT ENVIRONMENT
# =====================================================================

echo -e "\n${YELLOW}[1/6] Detecting environment...${NC}"

# Detect platform type
PLATFORM_TYPE="linux"
VM_TYPE="native"

# Check for cloud providers
if [ -f /sys/hypervisor/uuid ] && grep -qi ec2 /sys/hypervisor/uuid 2>/dev/null; then
    PLATFORM_TYPE="aws"
    VM_TYPE="aws-ec2"
elif curl -s -m 1 http://metadata.google.internal/computeMetadata/v1/ -H "Metadata-Flavor: Google" &>/dev/null; then
    PLATFORM_TYPE="gcp"
    VM_TYPE="gcp-compute"
elif curl -s -m 1 http://169.254.169.254/metadata/instance?api-version=2021-02-01 -H "Metadata:true" &>/dev/null; then
    PLATFORM_TYPE="azure"
    VM_TYPE="azure-vm"
elif [ -f /sys/class/dmi/id/product_name ]; then
    PRODUCT=$(cat /sys/class/dmi/id/product_name 2>/dev/null || echo "")
    if [[ "$PRODUCT" == *"VirtualBox"* ]]; then
        VM_TYPE="virtualbox"
    elif [[ "$PRODUCT" == *"VMware"* ]]; then
        VM_TYPE="vmware"
    elif [[ "$PRODUCT" == *"QEMU"* ]] || [[ "$PRODUCT" == *"UTM"* ]]; then
        VM_TYPE="utm"
    elif [[ "$PRODUCT" == *"Parallels"* ]]; then
        VM_TYPE="parallels"
    fi
fi

# Check for WSL
if grep -qi microsoft /proc/version 2>/dev/null; then
    VM_TYPE="wsl2"
fi

# Auto-generate machine name if not provided
if [ -z "$MACHINE_NAME" ]; then
    case $VM_TYPE in
        aws-ec2)    MACHINE_NAME="AWS-Relay" ;;
        gcp-compute) MACHINE_NAME="GCloud-Relay" ;;
        azure-vm)   MACHINE_NAME="Azure-Relay" ;;
        virtualbox) MACHINE_NAME="VBox-Relay" ;;
        vmware)     MACHINE_NAME="VMware-Relay" ;;
        utm)        MACHINE_NAME="UTM-Relay" ;;
        wsl2)       MACHINE_NAME="WSL2-Relay" ;;
        *)          MACHINE_NAME="Linux-Relay" ;;
    esac
fi

echo -e "${GREEN}  Platform: $PLATFORM_TYPE${NC}"
echo -e "${GREEN}  VM Type: $VM_TYPE${NC}"
echo -e "${GREEN}  Machine Name: $MACHINE_NAME${NC}"

# Detect network configuration
HOST_IP=""
GATEWAY_IP=""

# Get primary interface
PRIMARY_IF=$(ip route 2>/dev/null | grep default | awk '{print $5}' | head -1)
if [ -n "$PRIMARY_IF" ]; then
    HOST_IP=$(ip -4 addr show "$PRIMARY_IF" 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1)
    GATEWAY_IP=$(ip route 2>/dev/null | grep default | awk '{print $3}' | head -1)
fi

# Auto-detect network mode
if [ "$NETWORK_MODE" == "auto" ]; then
    if [[ "$HOST_IP" == 192.168.* ]] || [[ "$HOST_IP" == 10.* ]]; then
        NETWORK_MODE="bridged"
    elif [[ "$HOST_IP" == 172.* ]]; then
        # Check if it's AWS/cloud (172.x) vs local hostonly
        if [[ "$PLATFORM_TYPE" == "aws" ]] || [[ "$PLATFORM_TYPE" == "gcp" ]]; then
            NETWORK_MODE="cloud"
        else
            NETWORK_MODE="hostonly"
        fi
    else
        NETWORK_MODE="unknown"
    fi
fi

echo -e "${GREEN}  Network Mode: $NETWORK_MODE${NC}"
echo -e "${GREEN}  IP Address: $HOST_IP${NC}"
echo -e "${GREEN}  Gateway: $GATEWAY_IP${NC}"

# =====================================================================
# INSTALL DEPENDENCIES (AUTOMATIC)
# =====================================================================

echo -e "\n${YELLOW}[2/6] Installing dependencies (automatic)...${NC}"

# Update apt cache quietly
echo -e "${BLUE}  Updating package lists...${NC}"
sudo apt-get update -qq 2>/dev/null || true

# Check and install Node.js + npm
NEED_NODE_INSTALL=false

if ! command -v node &>/dev/null; then
    echo -e "${YELLOW}  Node.js not found - will install${NC}"
    NEED_NODE_INSTALL=true
elif ! command -v npm &>/dev/null; then
    echo -e "${YELLOW}  npm not found - will reinstall Node.js${NC}"
    NEED_NODE_INSTALL=true
else
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}  ✅ Node.js: $NODE_VERSION${NC}"
    echo -e "${GREEN}  ✅ npm: $NPM_VERSION${NC}"
fi

if [ "$NEED_NODE_INSTALL" = true ]; then
    echo -e "${BLUE}  Installing Node.js 20.x + npm (this may take a minute)...${NC}"

    # Remove any existing nodejs to avoid conflicts
    sudo apt-get remove -y nodejs npm 2>/dev/null || true

    # Install Node.js via NodeSource (includes npm)
    curl -fsSL https://deb.nodesource.com/setup_20.x 2>/dev/null | sudo -E bash - >/dev/null 2>&1
    sudo apt-get install -y nodejs >/dev/null 2>&1

    # Verify installation
    if command -v node &>/dev/null && command -v npm &>/dev/null; then
        NODE_VERSION=$(node --version)
        NPM_VERSION=$(npm --version)
        echo -e "${GREEN}  ✅ Node.js installed: $NODE_VERSION${NC}"
        echo -e "${GREEN}  ✅ npm installed: $NPM_VERSION${NC}"
    else
        echo -e "${RED}  ❌ ERROR: Node.js/npm installation failed!${NC}"
        echo -e "${RED}     Try manually: sudo apt install nodejs npm${NC}"
        exit 1
    fi
fi

# Install other dependencies quietly
for pkg in git curl jq; do
    if ! command -v $pkg &>/dev/null; then
        echo -e "${BLUE}  Installing $pkg...${NC}"
        sudo apt-get install -y $pkg >/dev/null 2>&1
    else
        echo -e "${GREEN}  ✅ $pkg installed${NC}"
    fi
done

# =====================================================================
# SETUP DIRECTORY
# =====================================================================

echo -e "\n${YELLOW}[3/6] Setting up directory...${NC}"

mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/.personal"
cd "$INSTALL_DIR"

echo -e "${GREEN}  ✅ Directory: $INSTALL_DIR${NC}"

# =====================================================================
# DOWNLOAD SERVER FILES
# =====================================================================

echo -e "\n${YELLOW}[4/6] Downloading server files...${NC}"

REPO_URL="https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock"

# Download relay server
echo -e "${BLUE}  📥 relay-server-bridge.cjs${NC}"
curl -fsSL "$REPO_URL/core/relay-server-bridge.cjs" -o relay-server.cjs

# Download chat client
echo -e "${BLUE}  📥 blockchain-chat.cjs${NC}"
curl -fsSL "$REPO_URL/core/blockchain-chat.cjs" -o blockchain-chat.cjs

# Download ping tool
echo -e "${BLUE}  📥 blockchain-ping.cjs${NC}"
curl -fsSL "$REPO_URL/core/blockchain-ping.cjs" -o blockchain-ping.cjs

echo -e "${GREEN}  ✅ Server files downloaded${NC}"

# Create package.json
cat > package.json << 'PACKAGE_EOF'
{
  "name": "rangerblock-server",
  "version": "2.1.0",
  "description": "RangerBlock P2P Relay Server",
  "main": "relay-server.cjs",
  "scripts": {
    "relay": "node relay-server.cjs",
    "start": "node relay-server.cjs",
    "chat": "node blockchain-chat.cjs",
    "ping": "node blockchain-ping.cjs",
    "ngrok": "ngrok tcp 5555",
    "status": "curl -s http://localhost:5556/api/status | jq .",
    "diag": "./network-diag.sh"
  },
  "dependencies": {
    "ws": "^8.18.0",
    "express": "^4.21.0"
  },
  "author": "David Keane (IrishRanger) + Claude Code",
  "license": "MIT"
}
PACKAGE_EOF

# Skip identity creation if update only and identity exists
if [ "$UPDATE_ONLY" = true ] && [ -f ".personal/node_identity.json" ]; then
    echo -e "${GREEN}  ✅ Keeping existing node identity${NC}"
else
    # Generate node ID
    NODE_ID="${MACHINE_NAME}-$(cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 8 | head -n 1)"

    # Create node identity
    cat > .personal/node_identity.json << IDENTITY_EOF
{
  "node_id": "$NODE_ID",
  "node_type": "relay-peer",
  "node_name": "$MACHINE_NAME RangerBlock Node",
  "platform": {
    "system": "$(uname -s)",
    "machine": "$(uname -m)",
    "kernel": "$(uname -r)",
    "platform_type": "$PLATFORM_TYPE",
    "vm_type": "$VM_TYPE"
  },
  "network": {
    "mode": "$NETWORK_MODE",
    "relay_port": 5555,
    "dashboard_port": 5556,
    "local_ip": "$HOST_IP",
    "gateway": "$GATEWAY_IP"
  },
  "capabilities": ["relay", "chat", "file-transfer"],
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%S)Z",
  "philosophy": "One foot in front of the other",
  "mission": "RangerBlock P2P Network"
}
IDENTITY_EOF
    echo -e "${GREEN}  ✅ Node identity created: $NODE_ID${NC}"
fi

# Create relay config
cat > relay-config.json << CONFIG_EOF
{
  "relay": {
    "name": "$MACHINE_NAME",
    "port": 5555,
    "dashboardPort": 5556,
    "region": "$PLATFORM_TYPE",
    "vmType": "$VM_TYPE",
    "networkMode": "$NETWORK_MODE"
  },
  "bridge": {
    "enabled": true,
    "reconnectInterval": 5000,
    "heartbeatInterval": 30000,
    "peers": []
  }
}
CONFIG_EOF

# Install npm dependencies
echo -e "${BLUE}  📦 Installing npm packages...${NC}"
npm install --production --silent 2>/dev/null || npm install --production
echo -e "${GREEN}  ✅ Dependencies installed${NC}"

# =====================================================================
# NGROK SETUP (IF REQUESTED)
# =====================================================================

if [ "$WITH_NGROK" = true ]; then
    echo -e "\n${YELLOW}[5/6] Installing ngrok...${NC}"

    if command -v ngrok &>/dev/null; then
        echo -e "${GREEN}  ✅ ngrok already installed${NC}"
    else
        echo -e "${BLUE}  📥 Installing ngrok...${NC}"
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list >/dev/null
        sudo apt-get update -qq && sudo apt-get install ngrok -y >/dev/null 2>&1
        echo -e "${GREEN}  ✅ ngrok installed${NC}"
    fi

    if [ -n "$NGROK_TOKEN" ]; then
        ngrok config add-authtoken "$NGROK_TOKEN" 2>/dev/null
        echo -e "${GREEN}  ✅ ngrok configured with token${NC}"
    fi
else
    echo -e "\n${YELLOW}[5/6] Skipping ngrok (use --with-ngrok to install)${NC}"
fi

# =====================================================================
# CREATE HELPER SCRIPTS
# =====================================================================

echo -e "\n${YELLOW}[6/6] Creating helper scripts...${NC}"

# Start relay script
cat > start-relay.sh << 'SCRIPT_EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 Starting RangerBlock Relay Server..."
echo "   Dashboard: http://localhost:5556"
echo "   WebSocket: ws://localhost:5555"
echo ""
node relay-server.cjs
SCRIPT_EOF
chmod +x start-relay.sh

# Start chat script
cat > start-chat.sh << 'SCRIPT_EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "💬 Starting RangerBlock Chat Client..."
node blockchain-chat.cjs
SCRIPT_EOF
chmod +x start-chat.sh

# Network diagnostic script
cat > network-diag.sh << 'SCRIPT_EOF'
#!/bin/bash
echo "========================================"
echo "   RANGERBLOCK NETWORK DIAGNOSTICS"
echo "========================================"
echo ""
echo "📍 Local Configuration:"
echo "   IP Address: $(hostname -I 2>/dev/null | awk '{print $1}' || echo 'N/A')"
echo "   Gateway: $(ip route 2>/dev/null | grep default | awk '{print $3}' || echo 'N/A')"
echo ""
echo "📡 Port Status:"
echo "   Relay (5555): $(ss -tlnp 2>/dev/null | grep 5555 >/dev/null && echo '✅ LISTENING' || echo '⚪ NOT LISTENING')"
echo "   Dashboard (5556): $(ss -tlnp 2>/dev/null | grep 5556 >/dev/null && echo '✅ LISTENING' || echo '⚪ NOT LISTENING')"
echo ""
echo "🌐 External IP:"
curl -s --max-time 5 https://ifconfig.me 2>/dev/null || echo "Unable to detect"
echo ""
SCRIPT_EOF
chmod +x network-diag.sh

echo -e "${GREEN}  ✅ Helper scripts created${NC}"

# =====================================================================
# CONFIGURE FIREWALL (AUTOMATIC)
# =====================================================================

# Try to open firewall ports automatically
if command -v ufw &>/dev/null; then
    if sudo ufw status 2>/dev/null | grep -q "Status: active"; then
        sudo ufw allow 5555/tcp >/dev/null 2>&1 || true
        sudo ufw allow 5556/tcp >/dev/null 2>&1 || true
        echo -e "${GREEN}  ✅ Firewall configured (ports 5555, 5556)${NC}"
    fi
fi

# =====================================================================
# DONE!
# =====================================================================

EXTERNAL_IP=$(curl -s --max-time 5 https://ifconfig.me 2>/dev/null || echo "Unable to detect")

echo -e "\n${CYAN}"
cat << EOF
 ======================================================================
                    🎉 SETUP COMPLETE! 🎉
 ======================================================================

  Machine Name: $MACHINE_NAME
  Platform:     $PLATFORM_TYPE ($VM_TYPE)
  Install Dir:  $INSTALL_DIR

  YOUR ADDRESSES:
    Local IP:     $HOST_IP
    External IP:  $EXTERNAL_IP
    Dashboard:    http://$HOST_IP:5556

  QUICK START:
    cd $INSTALL_DIR
    npm run relay        # Start the relay server
    npm run chat         # Terminal chat client
    npm run diag         # Network diagnostics

  OR USE SCRIPTS:
    ./start-relay.sh     # Start relay server
    ./start-chat.sh      # Start chat client

EOF
echo -e "${NC}"

# Cloud-specific instructions
if [[ "$PLATFORM_TYPE" == "aws" ]]; then
    echo -e "${YELLOW}  ☁️  AWS EC2 DETECTED:${NC}"
    echo -e "${YELLOW}     Make sure Security Group allows TCP ports 5555 and 5556${NC}"
    echo ""
elif [[ "$PLATFORM_TYPE" == "gcp" ]]; then
    echo -e "${YELLOW}  ☁️  GOOGLE CLOUD DETECTED:${NC}"
    echo -e "${YELLOW}     Make sure Firewall Rules allow TCP ports 5555 and 5556${NC}"
    echo ""
fi

echo -e "${GREEN}  🎖️ Rangers lead the way!${NC}"
echo -e "${NC}"

# Auto-start if requested
if [ "$AUTO_START" = true ]; then
    echo -e "${CYAN}  🚀 Auto-starting relay server...${NC}"
    echo ""
    cd "$INSTALL_DIR"
    npm run relay
fi

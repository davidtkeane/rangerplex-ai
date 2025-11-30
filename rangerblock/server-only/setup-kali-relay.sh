#!/bin/bash
#
# RangerBlock Relay Setup Script for Kali Linux (VM or Native)
# ============================================================
# Works on: Kali UTM (Mac), VMware, VirtualBox, WSL2, Native Kali
#
# Created: November 30, 2025
# Author: David Keane (IrishRanger) + Claude Code (Ranger)
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-kali-relay.sh | bash
#
# Options:
#   -n, --name        Machine name (default: KaliVM)
#   -m, --mode        Network mode: bridged, nat, hostonly (default: auto-detect)
#   --with-ngrok      Install ngrok for internet tunneling
#   --ngrok-token     Your ngrok authtoken
#   --full            Install full RangerPlex (not just relay)
#
# Rangers lead the way!

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Defaults
MACHINE_NAME="KaliVM"
NETWORK_MODE="auto"
WITH_NGROK=false
NGROK_TOKEN=""
FULL_INSTALL=false
INSTALL_DIR="$HOME/rangerblock-server"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            MACHINE_NAME="$2"
            shift 2
            ;;
        -m|--mode)
            NETWORK_MODE="$2"
            shift 2
            ;;
        --with-ngrok)
            WITH_NGROK=true
            shift
            ;;
        --ngrok-token)
            NGROK_TOKEN="$2"
            shift 2
            ;;
        --full)
            FULL_INSTALL=true
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
       RANGERBLOCK RELAY SERVER SETUP - KALI LINUX EDITION
 ======================================================================
       🐉 Penetration Testing + P2P Blockchain = UNSTOPPABLE 🐉
       Created by IrishRanger + Claude Code (Ranger)
 ======================================================================
EOF
echo -e "${NC}"

# =====================================================================
# DETECT ENVIRONMENT
# =====================================================================

echo -e "${YELLOW}[1/6] Detecting environment...${NC}"

# Detect if running in VM
VM_TYPE="native"
if [ -f /sys/class/dmi/id/product_name ]; then
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

echo -e "${GREEN}  VM Type: $VM_TYPE${NC}"

# Detect network configuration
HOST_IP=""
GATEWAY_IP=""

# Get primary interface
PRIMARY_IF=$(ip route | grep default | awk '{print $5}' | head -1)
if [ -n "$PRIMARY_IF" ]; then
    HOST_IP=$(ip -4 addr show "$PRIMARY_IF" | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
    GATEWAY_IP=$(ip route | grep default | awk '{print $3}' | head -1)
fi

# Auto-detect network mode
if [ "$NETWORK_MODE" == "auto" ]; then
    if [[ "$HOST_IP" == 192.168.* ]] || [[ "$HOST_IP" == 10.* ]]; then
        # Check if we can see the host machine
        if ping -c 1 -W 1 "$GATEWAY_IP" &>/dev/null; then
            NETWORK_MODE="bridged"
        else
            NETWORK_MODE="nat"
        fi
    elif [[ "$HOST_IP" == 172.* ]]; then
        NETWORK_MODE="hostonly"
    else
        NETWORK_MODE="unknown"
    fi
fi

echo -e "${GREEN}  Network Mode: $NETWORK_MODE${NC}"
echo -e "${GREEN}  VM IP Address: $HOST_IP${NC}"
echo -e "${GREEN}  Gateway: $GATEWAY_IP${NC}"

# =====================================================================
# CHECK DEPENDENCIES
# =====================================================================

echo -e "\n${YELLOW}[2/6] Checking dependencies...${NC}"

# Check Node.js and npm
NEED_NODE_INSTALL=false

if ! command -v node &>/dev/null; then
    echo -e "${YELLOW}  Node.js not found.${NC}"
    NEED_NODE_INSTALL=true
elif ! command -v npm &>/dev/null; then
    echo -e "${YELLOW}  npm not found (Node.js exists but npm missing).${NC}"
    NEED_NODE_INSTALL=true
else
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}  Node.js: $NODE_VERSION${NC}"
    echo -e "${GREEN}  npm: $NPM_VERSION${NC}"
fi

if [ "$NEED_NODE_INSTALL" = true ]; then
    echo -e "${YELLOW}  Installing Node.js + npm via NodeSource...${NC}"

    # Remove any existing nodejs to avoid conflicts
    sudo apt-get remove -y nodejs npm 2>/dev/null || true

    # Install Node.js via NodeSource (includes npm)
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs

    # Verify installation
    if command -v node &>/dev/null && command -v npm &>/dev/null; then
        NODE_VERSION=$(node --version)
        NPM_VERSION=$(npm --version)
        echo -e "${GREEN}  Node.js installed: $NODE_VERSION${NC}"
        echo -e "${GREEN}  npm installed: $NPM_VERSION${NC}"
    else
        echo -e "${RED}  ERROR: Node.js/npm installation failed!${NC}"
        echo -e "${RED}  Try manually: sudo apt install nodejs npm${NC}"
        exit 1
    fi
fi

# Check git (usually pre-installed)
if command -v git &>/dev/null; then
    echo -e "${GREEN}  git: $(git --version | cut -d' ' -f3)${NC}"
else
    echo -e "${YELLOW}  Installing git...${NC}"
    sudo apt-get install -y git
fi

# =====================================================================
# SETUP DIRECTORY
# =====================================================================

echo -e "\n${YELLOW}[3/6] Setting up directory...${NC}"

mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/.personal"
cd "$INSTALL_DIR"

echo -e "${GREEN}  Created: $INSTALL_DIR${NC}"

# =====================================================================
# DOWNLOAD FILES
# =====================================================================

echo -e "\n${YELLOW}[4/6] Downloading server files...${NC}"

REPO_URL="https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock"

# Download relay server
echo -e "${BLUE}  Downloading relay-server-bridge.cjs...${NC}"
curl -fsSL "$REPO_URL/core/relay-server-bridge.cjs" -o relay-server.cjs

# Download chat client
echo -e "${BLUE}  Downloading blockchain-chat.cjs...${NC}"
curl -fsSL "$REPO_URL/core/blockchain-chat.cjs" -o blockchain-chat.cjs

# Download ping tool
echo -e "${BLUE}  Downloading blockchain-ping.cjs...${NC}"
curl -fsSL "$REPO_URL/core/blockchain-ping.cjs" -o blockchain-ping.cjs

# Create package.json
cat > package.json << 'PACKAGE_EOF'
{
  "name": "rangerblock-server",
  "version": "2.0.0",
  "description": "RangerBlock P2P Relay Server - Kali Linux Edition",
  "main": "relay-server.cjs",
  "scripts": {
    "relay": "node relay-server.cjs",
    "chat": "node blockchain-chat.cjs",
    "ping": "node blockchain-ping.cjs",
    "ngrok": "ngrok tcp 5555",
    "status": "curl -s http://localhost:5556/api/status | jq .",
    "pentest": "echo 'RangerBlock + Kali = Ultimate Pentest Platform'"
  },
  "dependencies": {
    "ws": "^8.18.0",
    "express": "^4.21.0"
  },
  "author": "David Keane (IrishRanger) + Claude Code",
  "license": "MIT"
}
PACKAGE_EOF

# Generate node ID
NODE_ID="${MACHINE_NAME}-$(cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 8 | head -n 1)"

# Create node identity
cat > .personal/node_identity.json << IDENTITY_EOF
{
  "node_id": "$NODE_ID",
  "node_type": "kali-peer",
  "node_name": "$MACHINE_NAME RangerBlock Node",
  "platform": {
    "system": "$(uname -s)",
    "machine": "$(uname -m)",
    "kernel": "$(uname -r)",
    "distro": "Kali Linux",
    "vm_type": "$VM_TYPE"
  },
  "network": {
    "mode": "$NETWORK_MODE",
    "relay_port": 5555,
    "dashboard_port": 5556,
    "local_ip": "$HOST_IP",
    "gateway": "$GATEWAY_IP"
  },
  "capabilities": [
    "relay",
    "chat",
    "file-transfer",
    "pentest-tools",
    "forensics"
  ],
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%S)Z",
  "philosophy": "One foot in front of the other",
  "mission": "RangerBlock P2P Network + Penetration Testing"
}
IDENTITY_EOF

# Create relay config based on network mode
cat > relay-config.json << CONFIG_EOF
{
  "relay": {
    "name": "$MACHINE_NAME",
    "port": 5555,
    "dashboardPort": 5556,
    "region": "local",
    "vmType": "$VM_TYPE",
    "networkMode": "$NETWORK_MODE"
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
        "comment": "M3Pro Genesis via ngrok (Ireland)"
      },
      {
        "name": "kali-cloud",
        "host": "YOUR_CLOUD_IP_HERE",
        "port": 5555,
        "enabled": true,
        "comment": "Google Cloud 24/7 relay"
      },
      {
        "name": "host-machine",
        "host": "$GATEWAY_IP",
        "port": 5555,
        "enabled": $([ "$NETWORK_MODE" == "bridged" ] && echo "true" || echo "false"),
        "comment": "Host machine (if running RangerPlex)"
      }
    ]
  },
  "kali": {
    "toolsIntegration": true,
    "supportedTools": [
      "nmap",
      "metasploit",
      "burpsuite",
      "wireshark",
      "hashcat",
      "john"
    ],
    "forensicsMode": true
  }
}
CONFIG_EOF

# Install dependencies
echo -e "\n${BLUE}  Installing npm dependencies...${NC}"
npm install --production 2>/dev/null

echo -e "${GREEN}  Files downloaded and configured!${NC}"

# =====================================================================
# NGROK SETUP (OPTIONAL)
# =====================================================================

if [ "$WITH_NGROK" = true ]; then
    echo -e "\n${YELLOW}[5/6] Installing ngrok...${NC}"

    if command -v ngrok &>/dev/null; then
        echo -e "${GREEN}  ngrok already installed${NC}"
    else
        # Install ngrok
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt update && sudo apt install ngrok -y
        echo -e "${GREEN}  ngrok installed!${NC}"
    fi

    if [ -n "$NGROK_TOKEN" ]; then
        ngrok config add-authtoken "$NGROK_TOKEN"
        echo -e "${GREEN}  ngrok configured with authtoken${NC}"
    else
        echo -e "${YELLOW}  Note: Run 'ngrok config add-authtoken YOUR_TOKEN' to configure${NC}"
    fi
else
    echo -e "\n${YELLOW}[5/6] Skipping ngrok (use --with-ngrok to install)${NC}"
fi

# =====================================================================
# CREATE HELPER SCRIPTS
# =====================================================================

echo -e "\n${YELLOW}[6/6] Creating helper scripts...${NC}"

# Start relay script
cat > start-relay.sh << 'RELAY_SCRIPT'
#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 Starting RangerBlock Relay Server..."
echo "   Dashboard: http://localhost:5556"
echo "   WebSocket: ws://localhost:5555"
echo ""
node relay-server.cjs
RELAY_SCRIPT
chmod +x start-relay.sh

# Start chat script
cat > start-chat.sh << 'CHAT_SCRIPT'
#!/bin/bash
cd "$(dirname "$0")"
echo "💬 Starting RangerBlock Chat Client..."
node blockchain-chat.cjs
CHAT_SCRIPT
chmod +x start-chat.sh

# Network diagnostic script (useful for Kali!)
cat > network-diag.sh << 'DIAG_SCRIPT'
#!/bin/bash
echo "========================================"
echo "   RANGERBLOCK NETWORK DIAGNOSTICS"
echo "========================================"
echo ""
echo "📍 Local Configuration:"
echo "   IP Address: $(hostname -I | awk '{print $1}')"
echo "   Gateway: $(ip route | grep default | awk '{print $3}')"
echo "   Interface: $(ip route | grep default | awk '{print $5}')"
echo ""
echo "🔗 Peer Connectivity:"
echo ""

# Test ngrok Ireland
echo -n "   ngrok-ireland (2.tcp.eu.ngrok.io:12232): "
if nc -z -w 3 2.tcp.eu.ngrok.io 12232 2>/dev/null; then
    echo "✅ CONNECTED"
else
    echo "❌ UNREACHABLE"
fi

# Test Google Cloud
echo -n "   kali-cloud (34.26.30.249:5555): "
if nc -z -w 3 34.26.30.249 5555 2>/dev/null; then
    echo "✅ CONNECTED"
else
    echo "❌ UNREACHABLE"
fi

# Test host machine (if bridged)
GATEWAY=$(ip route | grep default | awk '{print $3}')
echo -n "   host-machine ($GATEWAY:5555): "
if nc -z -w 3 "$GATEWAY" 5555 2>/dev/null; then
    echo "✅ CONNECTED"
else
    echo "⚠️  NOT RUNNING or NAT mode"
fi

echo ""
echo "🌐 Internet Connectivity:"
echo -n "   External IP: "
curl -s --max-time 5 https://ifconfig.me || echo "Unable to reach"
echo ""
echo ""
echo "📡 Port Status:"
echo "   Relay (5555): $(ss -tlnp | grep 5555 >/dev/null && echo '✅ LISTENING' || echo '⚪ NOT LISTENING')"
echo "   Dashboard (5556): $(ss -tlnp | grep 5556 >/dev/null && echo '✅ LISTENING' || echo '⚪ NOT LISTENING')"
echo ""
DIAG_SCRIPT
chmod +x network-diag.sh

# Pentest integration script (Kali-specific!)
cat > pentest-share.sh << 'PENTEST_SCRIPT'
#!/bin/bash
# Share pentest results via RangerBlock
# Usage: ./pentest-share.sh <file>

if [ -z "$1" ]; then
    echo "Usage: ./pentest-share.sh <file>"
    echo ""
    echo "Examples:"
    echo "  ./pentest-share.sh nmap-scan.xml"
    echo "  ./pentest-share.sh hashcat-results.txt"
    echo "  ./pentest-share.sh metasploit-session.log"
    exit 1
fi

FILE="$1"
if [ ! -f "$FILE" ]; then
    echo "Error: File not found: $FILE"
    exit 1
fi

# Create shareable package
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="pentest_${TIMESTAMP}.rangerblock"

# Package with metadata
cat > /tmp/metadata.json << EOF
{
  "type": "pentest-results",
  "filename": "$(basename "$FILE")",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S)Z",
  "machine": "$HOSTNAME",
  "hash": "$(sha256sum "$FILE" | cut -d' ' -f1)"
}
EOF

tar -czf "$PACKAGE_NAME" -C /tmp metadata.json -C "$(dirname "$FILE")" "$(basename "$FILE")"
rm /tmp/metadata.json

echo "✅ Created: $PACKAGE_NAME"
echo "   Size: $(ls -lh "$PACKAGE_NAME" | awk '{print $5}')"
echo "   SHA256: $(sha256sum "$PACKAGE_NAME" | cut -d' ' -f1)"
echo ""
echo "📤 Ready to share via RangerBlock chat!"
PENTEST_SCRIPT
chmod +x pentest-share.sh

echo -e "${GREEN}  Helper scripts created!${NC}"

# =====================================================================
# FIREWALL CONFIGURATION
# =====================================================================

echo -e "\n${CYAN}Configuring firewall (if ufw is active)...${NC}"

if command -v ufw &>/dev/null; then
    if sudo ufw status | grep -q "Status: active"; then
        sudo ufw allow 5555/tcp comment "RangerBlock Relay"
        sudo ufw allow 5556/tcp comment "RangerBlock Dashboard"
        echo -e "${GREEN}  Firewall rules added for ports 5555 and 5556${NC}"
    else
        echo -e "${YELLOW}  UFW is not active (ports should be open by default)${NC}"
    fi
else
    echo -e "${YELLOW}  UFW not installed (ports should be open)${NC}"
fi

# =====================================================================
# DONE!
# =====================================================================

EXTERNAL_IP=$(curl -s --max-time 5 https://ifconfig.me || echo "Unable to detect")

echo -e "\n${CYAN}"
cat << EOF
 ======================================================================
                       SETUP COMPLETE! 🎉
 ======================================================================

  Machine Name: $MACHINE_NAME
  Node ID:      $NODE_ID
  VM Type:      $VM_TYPE
  Network Mode: $NETWORK_MODE
  Install Dir:  $INSTALL_DIR

  LOCAL ADDRESSES:
    VM IP:        $HOST_IP
    Gateway:      $GATEWAY_IP
    External IP:  $EXTERNAL_IP

  COMMANDS:
    npm run relay     - Start relay server
    npm run chat      - Terminal chat client
    npm run ping      - Test connectivity
    npm run status    - Check server status

  HELPER SCRIPTS:
    ./start-relay.sh    - Start relay server
    ./start-chat.sh     - Start chat client
    ./network-diag.sh   - Network diagnostics
    ./pentest-share.sh  - Share pentest results

EOF

if [ "$NETWORK_MODE" == "nat" ]; then
    echo -e "${YELLOW}  ⚠️  NAT MODE DETECTED - IMPORTANT:${NC}"
    echo -e "${YELLOW}     Your VM cannot receive incoming connections!${NC}"
    echo -e "${YELLOW}     Options:${NC}"
    echo -e "${YELLOW}       1. Use ngrok: npm run ngrok${NC}"
    echo -e "${YELLOW}       2. Switch to Bridged networking in VM settings${NC}"
    echo -e "${YELLOW}       3. Configure port forwarding in your VM software${NC}"
    echo ""
fi

if [ "$VM_TYPE" == "utm" ]; then
    echo -e "${BLUE}  📱 UTM on Mac Detected:${NC}"
    echo -e "${BLUE}     For bridged mode: UTM → VM Settings → Network → Bridged${NC}"
    echo -e "${BLUE}     Host machine should be reachable at: $GATEWAY_IP${NC}"
    echo ""
fi

echo -e "${GREEN}  🐉 Kali + RangerBlock = Ultimate Security Platform!${NC}"
echo -e "${GREEN}  🎖️ Rangers lead the way!${NC}"
echo -e "${NC}"

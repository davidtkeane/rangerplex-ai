#!/bin/bash
#
# RangerBlock Relay Setup Script - UNIVERSAL
# ============================================================
# Works on: AWS, GCP, Azure, DigitalOcean, Linode, Vultr, Oracle, Hetzner
#           + Kali UTM (Mac), VMware, VirtualBox, WSL2, Native Linux
#
# Created: November 30, 2025
# Author: David Keane (IrishRanger) + Claude Code (Ranger)
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-relay-universal.sh | bash
#
# Options:
#   -n, --name        Machine name (default: auto-detect)
#   -p, --platform    Force platform (aws, gcp, azure, digitalocean, linode, vultr, oracle, hetzner)
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
FORCE_PLATFORM=""
INSTALL_DIR="$HOME/rangerblock-server"
SKIP_MENU=false
BOLD='\033[1m'

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            MACHINE_NAME="$2"
            shift 2
            ;;
        -p|--platform)
            FORCE_PLATFORM="$2"
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
        -y|--yes|--auto)
            SKIP_MENU=true
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
       Version 2.2.0 - Multi-Cloud Auto-Detection (8 providers!)
 ======================================================================
EOF
echo -e "${NC}"

# =====================================================================
# INTERACTIVE MENU (skip with -y or --auto flag)
# =====================================================================

if [ "$SKIP_MENU" = false ]; then
    echo -e "${BOLD}What would you like to do?${NC}\n"

    echo -e "${GREEN}┌─────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${GREEN}│  ${BOLD}1. 🚀 QUICK INSTALL (Recommended)${NC}${GREEN}                             │${NC}"
    echo -e "${GREEN}│     Auto-detects your platform and installs everything         │${NC}"
    echo -e "${GREEN}│     Works on: AWS, GCP, Azure, DigitalOcean, Linode, Vultr,    │${NC}"
    echo -e "${GREEN}│               Oracle, Hetzner, VMs, and local Linux/Mac        │${NC}"
    echo -e "${GREEN}└─────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    echo -e "${BLUE}┌─────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${BLUE}│  ${BOLD}2. 🔧 CUSTOM INSTALL${NC}${BLUE}                                            │${NC}"
    echo -e "${BLUE}│     Choose your machine name and enable ngrok                   │${NC}"
    echo -e "${BLUE}└─────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    echo -e "${MAGENTA}┌─────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${MAGENTA}│  ${BOLD}3. 📖 SHOW HELP & MANUAL INSTRUCTIONS${NC}${MAGENTA}                        │${NC}"
    echo -e "${MAGENTA}└─────────────────────────────────────────────────────────────────┘${NC}"
    echo ""

    read -p "Enter your choice [1-3] (default: 1): " menu_choice
    menu_choice=${menu_choice:-1}

    case $menu_choice in
        1)
            echo -e "\n${GREEN}🚀 Starting Quick Install...${NC}\n"
            ;;
        2)
            echo -e "\n${BLUE}🔧 Custom Install${NC}\n"
            read -p "Enter machine name (or press Enter for auto-detect): " custom_name
            if [ -n "$custom_name" ]; then
                MACHINE_NAME="$custom_name"
            fi

            read -p "Install ngrok for internet tunneling? (y/N): " install_ngrok
            if [ "$install_ngrok" = "y" ] || [ "$install_ngrok" = "Y" ]; then
                WITH_NGROK=true
                read -p "Enter ngrok authtoken (or press Enter to add later): " ngrok_input
                if [ -n "$ngrok_input" ]; then
                    NGROK_TOKEN="$ngrok_input"
                fi
            fi

            read -p "Auto-start relay after install? (Y/n): " auto_start_input
            if [ "$auto_start_input" != "n" ] && [ "$auto_start_input" != "N" ]; then
                AUTO_START=true
            fi
            echo ""
            ;;
        3)
            clear
            echo -e "${CYAN}"
            echo "╔═══════════════════════════════════════════════════════════════════╗"
            echo "║              📖 MANUAL INSTALLATION GUIDE 📖                      ║"
            echo "╚═══════════════════════════════════════════════════════════════════╝"
            echo -e "${NC}"

            echo -e "${BOLD}${GREEN}=== SUPPORTED PLATFORMS ===${NC}"
            echo "  ☁️  Cloud: AWS, GCP, Azure, DigitalOcean, Linode, Vultr, Oracle, Hetzner"
            echo "  💻 VMs: VirtualBox, VMware, UTM, Parallels, KVM, WSL2, Docker"
            echo "  🐧 Linux: Debian, Ubuntu, Kali, RedHat, Arch, and more"
            echo ""

            echo -e "${BOLD}${BLUE}=== QUICK ONE-LINERS ===${NC}"
            echo ""
            echo "# Auto-detect everything (recommended):"
            echo -e "${YELLOW}curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-relay-universal.sh | bash${NC}"
            echo ""
            echo "# Skip menu (for scripts/automation):"
            echo -e "${YELLOW}curl -fsSL ... | bash -s -- -y${NC}"
            echo ""
            echo "# With custom name:"
            echo -e "${YELLOW}curl -fsSL ... | bash -s -- --name \"MyRelay\"${NC}"
            echo ""
            echo "# With ngrok:"
            echo -e "${YELLOW}curl -fsSL ... | bash -s -- --with-ngrok --ngrok-token YOUR_TOKEN${NC}"
            echo ""
            echo "# Force platform:"
            echo -e "${YELLOW}curl -fsSL ... | bash -s -- --platform aws${NC}"
            echo ""

            echo -e "${BOLD}${MAGENTA}=== MANUAL STEPS ===${NC}"
            echo ""
            echo "1. Install Node.js 20.x:"
            echo -e "${YELLOW}   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
            echo "   sudo apt install -y nodejs${NC}"
            echo ""
            echo "2. Clone and setup:"
            echo -e "${YELLOW}   git clone https://github.com/davidtkeane/rangerplex-ai.git"
            echo "   cd rangerplex-ai/rangerblock/core"
            echo "   npm install ws express${NC}"
            echo ""
            echo "3. Start relay:"
            echo -e "${YELLOW}   node relay-server-bridge.cjs${NC}"
            echo ""

            echo -e "${BOLD}${RED}=== FIREWALL PORTS ===${NC}"
            echo "  • 5555/tcp - WebSocket relay"
            echo "  • 5556/tcp - HTTP dashboard"
            echo ""

            read -p "Press Enter to continue with installation, or Ctrl+C to exit..."
            clear
            echo -e "${CYAN}"
            cat << 'BANNER'
 ======================================================================
       RANGERBLOCK RELAY SERVER - ONE-CLICK INSTALLER
 ======================================================================
       🐉 P2P Blockchain Network for Security Professionals 🐉
       Created by IrishRanger + Claude Code (Ranger)
       Version 2.2.0 - Multi-Cloud Auto-Detection (8 providers!)
 ======================================================================
BANNER
            echo -e "${NC}"
            ;;
        *)
            echo -e "${RED}Invalid choice. Using Quick Install...${NC}\n"
            ;;
    esac
fi

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

echo -e "${BLUE}  Detecting cloud provider...${NC}"

# =====================================================================
# CLOUD PROVIDER DETECTION (Top 8 providers)
# =====================================================================

# Force platform override (--platform flag)
if [ -n "$FORCE_PLATFORM" ]; then
    echo -e "${YELLOW}  Using forced platform: $FORCE_PLATFORM${NC}"
    case $FORCE_PLATFORM in
        aws)
            PLATFORM_TYPE="aws"
            VM_TYPE="aws-ec2"
            ;;
        gcp|google)
            PLATFORM_TYPE="gcp"
            VM_TYPE="gcp-compute"
            ;;
        azure)
            PLATFORM_TYPE="azure"
            VM_TYPE="azure-vm"
            ;;
        digitalocean|do)
            PLATFORM_TYPE="digitalocean"
            VM_TYPE="do-droplet"
            ;;
        linode)
            PLATFORM_TYPE="linode"
            VM_TYPE="linode-instance"
            ;;
        vultr)
            PLATFORM_TYPE="vultr"
            VM_TYPE="vultr-instance"
            ;;
        oracle|oci)
            PLATFORM_TYPE="oracle"
            VM_TYPE="oci-instance"
            ;;
        hetzner)
            PLATFORM_TYPE="hetzner"
            VM_TYPE="hetzner-cloud"
            ;;
        *)
            echo -e "${RED}  Unknown platform: $FORCE_PLATFORM${NC}"
            echo -e "${RED}  Valid options: aws, gcp, azure, digitalocean, linode, vultr, oracle, hetzner${NC}"
            PLATFORM_TYPE="linux"
            VM_TYPE="native"
            ;;
    esac
# Auto-detect if no force platform
# 1. AWS EC2 Detection (multiple methods)
elif [ -f /sys/hypervisor/uuid ] && grep -qi ec2 /sys/hypervisor/uuid 2>/dev/null; then
    PLATFORM_TYPE="aws"
    VM_TYPE="aws-ec2"
elif [ -f /sys/devices/virtual/dmi/id/product_uuid ] && grep -qi ec2 /sys/devices/virtual/dmi/id/product_uuid 2>/dev/null; then
    PLATFORM_TYPE="aws"
    VM_TYPE="aws-ec2"
elif [ -f /sys/devices/virtual/dmi/id/bios_vendor ] && grep -qi "Amazon" /sys/devices/virtual/dmi/id/bios_vendor 2>/dev/null; then
    PLATFORM_TYPE="aws"
    VM_TYPE="aws-ec2"
elif curl -s -m 2 http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null | grep -q "^i-"; then
    PLATFORM_TYPE="aws"
    VM_TYPE="aws-ec2"

# 2. Google Cloud Platform (GCP) Detection
elif curl -s -m 2 http://metadata.google.internal/computeMetadata/v1/instance/id -H "Metadata-Flavor: Google" &>/dev/null; then
    PLATFORM_TYPE="gcp"
    VM_TYPE="gcp-compute"
elif [ -f /sys/devices/virtual/dmi/id/product_name ] && grep -qi "Google" /sys/devices/virtual/dmi/id/product_name 2>/dev/null; then
    PLATFORM_TYPE="gcp"
    VM_TYPE="gcp-compute"

# 3. Microsoft Azure Detection
elif curl -s -m 2 -H "Metadata:true" "http://169.254.169.254/metadata/instance?api-version=2021-02-01" 2>/dev/null | grep -q "azEnvironment"; then
    PLATFORM_TYPE="azure"
    VM_TYPE="azure-vm"
elif [ -f /sys/devices/virtual/dmi/id/chassis_asset_tag ] && grep -qi "Azure" /sys/devices/virtual/dmi/id/chassis_asset_tag 2>/dev/null; then
    PLATFORM_TYPE="azure"
    VM_TYPE="azure-vm"

# 4. DigitalOcean Detection
elif curl -s -m 2 http://169.254.169.254/metadata/v1/id 2>/dev/null | grep -qE "^[0-9]+$"; then
    PLATFORM_TYPE="digitalocean"
    VM_TYPE="do-droplet"
elif [ -f /sys/devices/virtual/dmi/id/sys_vendor ] && grep -qi "DigitalOcean" /sys/devices/virtual/dmi/id/sys_vendor 2>/dev/null; then
    PLATFORM_TYPE="digitalocean"
    VM_TYPE="do-droplet"

# 5. Linode (Akamai) Detection
elif curl -s -m 2 http://169.254.169.254/v1/instance 2>/dev/null | grep -q "linode"; then
    PLATFORM_TYPE="linode"
    VM_TYPE="linode-instance"
elif [ -f /sys/devices/virtual/dmi/id/product_name ] && grep -qi "Linode" /sys/devices/virtual/dmi/id/product_name 2>/dev/null; then
    PLATFORM_TYPE="linode"
    VM_TYPE="linode-instance"

# 6. Vultr Detection
elif curl -s -m 2 http://169.254.169.254/v1/instanceid 2>/dev/null | grep -qE "^[a-f0-9-]+$"; then
    # Could be Vultr - check further
    if curl -s -m 2 http://169.254.169.254/v1.json 2>/dev/null | grep -q "vultr"; then
        PLATFORM_TYPE="vultr"
        VM_TYPE="vultr-instance"
    fi
elif [ -f /sys/devices/virtual/dmi/id/sys_vendor ] && grep -qi "Vultr" /sys/devices/virtual/dmi/id/sys_vendor 2>/dev/null; then
    PLATFORM_TYPE="vultr"
    VM_TYPE="vultr-instance"

# 7. Oracle Cloud (OCI) Detection
elif curl -s -m 2 http://169.254.169.254/opc/v1/instance/ 2>/dev/null | grep -q "availabilityDomain"; then
    PLATFORM_TYPE="oracle"
    VM_TYPE="oci-instance"
elif [ -f /sys/devices/virtual/dmi/id/chassis_asset_tag ] && grep -qi "OracleCloud" /sys/devices/virtual/dmi/id/chassis_asset_tag 2>/dev/null; then
    PLATFORM_TYPE="oracle"
    VM_TYPE="oci-instance"

# 8. Hetzner Cloud Detection
elif curl -s -m 2 http://169.254.169.254/hetzner/v1/metadata 2>/dev/null | grep -q "instance-id"; then
    PLATFORM_TYPE="hetzner"
    VM_TYPE="hetzner-cloud"

# =====================================================================
# VM/LOCAL DETECTION (if not cloud)
# =====================================================================
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
    elif [[ "$PRODUCT" == *"KVM"* ]]; then
        VM_TYPE="kvm"
    fi
fi

# Check for WSL
if grep -qi microsoft /proc/version 2>/dev/null; then
    VM_TYPE="wsl2"
    PLATFORM_TYPE="wsl"
fi

# Check for Docker/Container
if [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup 2>/dev/null; then
    VM_TYPE="docker"
    PLATFORM_TYPE="container"
fi

# Auto-generate machine name if not provided
if [ -z "$MACHINE_NAME" ]; then
    case $VM_TYPE in
        # Cloud providers
        aws-ec2)        MACHINE_NAME="AWS-Relay" ;;
        gcp-compute)    MACHINE_NAME="GCloud-Relay" ;;
        azure-vm)       MACHINE_NAME="Azure-Relay" ;;
        do-droplet)     MACHINE_NAME="DigitalOcean-Relay" ;;
        linode-instance) MACHINE_NAME="Linode-Relay" ;;
        vultr-instance) MACHINE_NAME="Vultr-Relay" ;;
        oci-instance)   MACHINE_NAME="Oracle-Relay" ;;
        hetzner-cloud)  MACHINE_NAME="Hetzner-Relay" ;;
        # VMs
        virtualbox)     MACHINE_NAME="VBox-Relay" ;;
        vmware)         MACHINE_NAME="VMware-Relay" ;;
        utm)            MACHINE_NAME="UTM-Relay" ;;
        parallels)      MACHINE_NAME="Parallels-Relay" ;;
        kvm)            MACHINE_NAME="KVM-Relay" ;;
        wsl2)           MACHINE_NAME="WSL2-Relay" ;;
        docker)         MACHINE_NAME="Docker-Relay" ;;
        # Default
        *)              MACHINE_NAME="Linux-Relay" ;;
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
    sudo apt-get autoremove -y 2>/dev/null || true

    # Try NodeSource first
    echo -e "${BLUE}  Downloading NodeSource setup...${NC}"
    if curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -; then
        echo -e "${BLUE}  Installing nodejs from NodeSource...${NC}"
        sudo apt-get install -y nodejs
    else
        # Fallback: install from default repos
        echo -e "${YELLOW}  NodeSource failed, trying default repos...${NC}"
        sudo apt-get update
        sudo apt-get install -y nodejs npm
    fi

    # Verify installation
    if command -v node &>/dev/null && command -v npm &>/dev/null; then
        NODE_VERSION=$(node --version)
        NPM_VERSION=$(npm --version)
        echo -e "${GREEN}  ✅ Node.js installed: $NODE_VERSION${NC}"
        echo -e "${GREEN}  ✅ npm installed: $NPM_VERSION${NC}"
    else
        # Last resort fallback
        echo -e "${YELLOW}  Trying alternative install method...${NC}"
        sudo apt-get update
        sudo apt-get install -y nodejs npm || {
            echo -e "${RED}  ❌ ERROR: Node.js/npm installation failed!${NC}"
            echo -e "${RED}     Try manually:${NC}"
            echo -e "${RED}     curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -${NC}"
            echo -e "${RED}     sudo apt install -y nodejs${NC}"
            exit 1
        }
        NODE_VERSION=$(node --version 2>/dev/null || echo "unknown")
        NPM_VERSION=$(npm --version 2>/dev/null || echo "unknown")
        echo -e "${GREEN}  ✅ Node.js installed: $NODE_VERSION${NC}"
        echo -e "${GREEN}  ✅ npm installed: $NPM_VERSION${NC}"
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

# Create a "Keep Alive" script using screen
cat > run-background.sh << 'BG_SCRIPT'
#!/bin/bash
echo "🚀 Starting RangerBlock in background (screen session 'relay')..."
screen -dmS relay bash -c 'cd "$(dirname "$0")"; node relay-server.cjs; exec bash'
echo "✅ Relay is running!"
echo ""
echo "commands:"
echo "  screen -r relay    (View logs/Attach)"
echo "  Ctrl+A, D          (Detach/Exit view)"
BG_SCRIPT
chmod +x run-background.sh

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
# =====================================================================
# SYSTEMD SERVICE SETUP (LINUX ONLY)
# =====================================================================

if [ "$PLATFORM_TYPE" != "mac" ] && [ "$PLATFORM_TYPE" != "windows" ] && command -v systemctl &>/dev/null; then
    echo -e "\n${YELLOW}[7/6] Setting up background service...${NC}"
    
    SERVICE_NAME="rangerblock-relay"
    SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
    NODE_PATH=$(command -v node)
    USER_NAME=$(whoami)
    
    # Ask user if they want to enable the service
    read -p "Do you want to enable RangerBlock as a system service (starts on boot)? (Y/n): " enable_service
    if [ "$enable_service" != "n" ] && [ "$enable_service" != "N" ]; then
        
        echo -e "${BLUE}  Creating service file at ${SERVICE_FILE}...${NC}"
        
        # Create service file content
        cat > /tmp/${SERVICE_NAME}.service << SERVICE_EOF
[Unit]
Description=RangerBlock Relay Server
After=network.target

[Service]
Type=simple
User=${USER_NAME}
WorkingDirectory=${INSTALL_DIR}
ExecStart=${NODE_PATH} relay-server.cjs
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICE_EOF

        # Install service file (requires sudo)
        if sudo mv /tmp/${SERVICE_NAME}.service ${SERVICE_FILE}; then
            echo -e "${GREEN}  ✅ Service file created${NC}"
            
            # Reload daemon
            sudo systemctl daemon-reload
            
            # Enable service
            sudo systemctl enable ${SERVICE_NAME}
            echo -e "${GREEN}  ✅ Service enabled on boot${NC}"
            
            # Start service?
            if [ "$AUTO_START" = true ]; then
                sudo systemctl start ${SERVICE_NAME}
                echo -e "${GREEN}  ✅ Service started${NC}"
            else
                read -p "Start the service now? (Y/n): " start_now
                if [ "$start_now" != "n" ] && [ "$start_now" != "N" ]; then
                    sudo systemctl start ${SERVICE_NAME}
                    echo -e "${GREEN}  ✅ Service started${NC}"
                fi
            fi
            
            # Show status
            if systemctl is-active --quiet ${SERVICE_NAME}; then
                echo -e "${GREEN}  ✅ Status: ACTIVE${NC}"
            else
                echo -e "${YELLOW}  ⚠️  Status: INACTIVE (check logs with: journalctl -u ${SERVICE_NAME})${NC}"
            fi
            
        else
            echo -e "${RED}  ❌ Failed to install service file (sudo required)${NC}"
        fi
    else
        echo -e "${BLUE}  Skipping service setup.${NC}"
    fi
fi

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}   🎉 INSTALLATION COMPLETE! 🎉${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo ""
echo -e "  📍 Installed to: ${BOLD}$INSTALL_DIR${NC}"
echo -e "  🆔 Node ID:      ${BOLD}$NODE_ID${NC}"
echo ""
echo -e "${BOLD}Commands:${NC}"
echo -e "  ${YELLOW}./start-relay.sh${NC}   - Start relay manually"
echo -e "  ${YELLOW}./start-chat.sh${NC}    - Start chat client"
echo -e "  ${YELLOW}./network-diag.sh${NC}  - Check network status"
if [ "$PLATFORM_TYPE" != "mac" ] && [ "$PLATFORM_TYPE" != "windows" ] && command -v systemctl &>/dev/null; then
    echo -e "  ${YELLOW}sudo systemctl status rangerblock-relay${NC} - Check service status"
fi
echo ""
echo -e "${GREEN}Rangers lead the way! 🎖️${NC}"
echo ""
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

  QUICK START (Single Terminal):
    cd $INSTALL_DIR
    nohup npm run relay > relay.log 2>&1 &   # Start relay in BACKGROUND
    npm run chat                              # Chat in foreground!
    tail -f relay.log                         # View relay logs

  BACKGROUND JOB CONTROL:
    jobs                 # List background jobs
    fg %1                # Bring relay to foreground
    Ctrl+Z then bg %1    # Send to background
    kill %1              # Stop background relay
    pkill -f relay       # Kill relay by name

  FOR 24/7 RUNNING (recommended):
    npm install -g pm2
    pm2 start relay-server.cjs --name relay
    pm2 save && pm2 startup

EOF
echo -e "${NC}"

# Cloud-specific instructions
case "$PLATFORM_TYPE" in
    aws)
        echo -e "${YELLOW}  ☁️  AWS EC2 DETECTED:${NC}"
        echo -e "${YELLOW}     → Security Group: Allow TCP ports 5555 and 5556 (0.0.0.0/0)${NC}"
        echo -e "${YELLOW}     → Free tier: t3.micro (750 hrs/month)${NC}"
        echo ""
        ;;
    gcp)
        echo -e "${YELLOW}  ☁️  GOOGLE CLOUD DETECTED:${NC}"
        echo -e "${YELLOW}     → Firewall Rules: Create rule for TCP 5555 and 5556${NC}"
        echo -e "${YELLOW}     → Free tier: e2-micro in us-west1/us-central1/us-east1${NC}"
        echo ""
        ;;
    azure)
        echo -e "${YELLOW}  ☁️  MICROSOFT AZURE DETECTED:${NC}"
        echo -e "${YELLOW}     → Network Security Group: Add inbound rules for ports 5555 and 5556${NC}"
        echo -e "${YELLOW}     → Free tier: B1S VM (750 hrs/month for 12 months)${NC}"
        echo ""
        ;;
    digitalocean)
        echo -e "${YELLOW}  ☁️  DIGITALOCEAN DETECTED:${NC}"
        echo -e "${YELLOW}     → Cloud Firewall: Add rules for TCP 5555 and 5556${NC}"
        echo -e "${YELLOW}     → No free tier - \$4/month basic droplet${NC}"
        echo ""
        ;;
    linode)
        echo -e "${YELLOW}  ☁️  LINODE (AKAMAI) DETECTED:${NC}"
        echo -e "${YELLOW}     → Cloud Firewall: Create firewall with TCP 5555 and 5556${NC}"
        echo -e "${YELLOW}     → No free tier - \$5/month nanode${NC}"
        echo ""
        ;;
    vultr)
        echo -e "${YELLOW}  ☁️  VULTR DETECTED:${NC}"
        echo -e "${YELLOW}     → Firewall: Add rules for ports 5555 and 5556${NC}"
        echo -e "${YELLOW}     → No free tier - \$5/month cloud compute${NC}"
        echo ""
        ;;
    oracle)
        echo -e "${YELLOW}  ☁️  ORACLE CLOUD (OCI) DETECTED:${NC}"
        echo -e "${YELLOW}     → Security List: Add ingress rules for TCP 5555 and 5556${NC}"
        echo -e "${YELLOW}     → Always Free: 2 AMD VMs (1 OCPU, 1GB RAM each) - FOREVER!${NC}"
        echo ""
        ;;
    hetzner)
        echo -e "${YELLOW}  ☁️  HETZNER CLOUD DETECTED:${NC}"
        echo -e "${YELLOW}     → Firewall: Create firewall with TCP 5555 and 5556${NC}"
        echo -e "${YELLOW}     → No free tier - €3.79/month CX11${NC}"
        echo ""
        ;;
esac

echo -e "${GREEN}  🎖️ Rangers lead the way!${NC}"
echo -e "${NC}"

# Auto-start if requested
if [ "$AUTO_START" = true ]; then
    echo -e "${CYAN}  🚀 Auto-starting relay server...${NC}"
    echo ""
    cd "$INSTALL_DIR"
    npm run relay
fi

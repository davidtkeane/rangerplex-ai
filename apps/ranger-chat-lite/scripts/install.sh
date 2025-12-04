#!/bin/bash
#
# RangerChat Lite - One-Command Installer
# ============================================================
# Works on: macOS (Intel & Apple Silicon), Linux (Ubuntu, Debian, Fedora, Arch)
#
# Created: December 4, 2025
# Author: David Keane (IrishRanger) + Claude Code (Ranger)
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/apps/ranger-chat-lite/scripts/install.sh | bash
#
# Options:
#   --dev         Development mode (npm run dev)
#   --build       Build production app after install
#   --no-start    Don't start the app after install
#   -y, --yes     Skip confirmation prompts
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
BOLD='\033[1m'
NC='\033[0m' # No Color

# Defaults
INSTALL_DIR="$HOME/RangerChat-Lite"
DEV_MODE=true
BUILD_MODE=false
AUTO_START=true
SKIP_CONFIRM=false
VERSION="1.7.3"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            DEV_MODE=true
            BUILD_MODE=false
            shift
            ;;
        --build)
            BUILD_MODE=true
            DEV_MODE=false
            shift
            ;;
        --no-start)
            AUTO_START=false
            shift
            ;;
        -y|--yes)
            SKIP_CONFIRM=true
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
 ══════════════════════════════════════════════════════════════════════
    ██████╗  █████╗ ███╗   ██╗ ██████╗ ███████╗██████╗  ██████╗██╗  ██╗
    ██╔══██╗██╔══██╗████╗  ██║██╔════╝ ██╔════╝██╔══██╗██╔════╝██║  ██║
    ██████╔╝███████║██╔██╗ ██║██║  ███╗█████╗  ██████╔╝██║     ███████║
    ██╔══██╗██╔══██║██║╚██╗██║██║   ██║██╔══╝  ██╔══██╗██║     ██╔══██║
    ██║  ██║██║  ██║██║ ╚████║╚██████╔╝███████╗██║  ██║╚██████╗██║  ██║
    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
                           ██╗     ██╗████████╗███████╗
                           ██║     ██║╚══██╔══╝██╔════╝
                           ██║     ██║   ██║   █████╗
                           ██║     ██║   ██║   ██╔══╝
                           ███████╗██║   ██║   ███████╗
                           ╚══════╝╚═╝   ╚═╝   ╚══════╝
 ══════════════════════════════════════════════════════════════════════
            🦅 Lightweight Chat for RangerBlock Network 🦅
            Version 1.7.3 - One-Command Installer
            Created by IrishRanger + Claude Code (Ranger)
 ══════════════════════════════════════════════════════════════════════
EOF
echo -e "${NC}"

# Detect OS
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

echo -e "${YELLOW}Detecting system...${NC}"
echo -e "  OS: ${GREEN}$OS${NC}"
echo -e "  Architecture: ${GREEN}$ARCH${NC}"

# Check if macOS or Linux
if [[ "$OS" != "darwin" && "$OS" != "linux" ]]; then
    echo -e "${RED}Error: Unsupported operating system: $OS${NC}"
    echo "This installer supports macOS and Linux only."
    echo "For Windows, please use install.ps1"
    exit 1
fi

echo ""

# ============================================================
# STEP 1: Check/Install Node.js
# ============================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 1: Checking Node.js${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"
else
    echo -e "${YELLOW}Node.js not found. Installing...${NC}"

    if [[ "$OS" == "darwin" ]]; then
        # macOS - use Homebrew or direct download
        if command -v brew &> /dev/null; then
            echo -e "${BLUE}Installing via Homebrew...${NC}"
            brew install node
        else
            echo -e "${BLUE}Installing Homebrew first...${NC}"
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

            # Add Homebrew to PATH for Apple Silicon
            if [[ "$ARCH" == "arm64" ]]; then
                eval "$(/opt/homebrew/bin/brew shellenv)"
            fi

            brew install node
        fi
    else
        # Linux - detect package manager
        if command -v apt-get &> /dev/null; then
            echo -e "${BLUE}Installing via apt (Debian/Ubuntu)...${NC}"
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command -v dnf &> /dev/null; then
            echo -e "${BLUE}Installing via dnf (Fedora)...${NC}"
            sudo dnf install -y nodejs npm
        elif command -v yum &> /dev/null; then
            echo -e "${BLUE}Installing via yum (CentOS/RHEL)...${NC}"
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo yum install -y nodejs
        elif command -v pacman &> /dev/null; then
            echo -e "${BLUE}Installing via pacman (Arch)...${NC}"
            sudo pacman -S --noconfirm nodejs npm
        else
            echo -e "${RED}Error: Could not detect package manager${NC}"
            echo "Please install Node.js manually: https://nodejs.org"
            exit 1
        fi
    fi

    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm found: $NPM_VERSION${NC}"
else
    echo -e "${RED}Error: npm not found${NC}"
    exit 1
fi

echo ""

# ============================================================
# STEP 2: Download RangerChat Lite
# ============================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 2: Downloading RangerChat Lite${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if already installed
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}RangerChat Lite already exists at: $INSTALL_DIR${NC}"

    if [ "$SKIP_CONFIRM" = false ]; then
        read -p "Update existing installation? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Skipping download, using existing files...${NC}"
        else
            echo -e "${BLUE}Updating...${NC}"
            cd "$INSTALL_DIR"
            git pull 2>/dev/null || echo "Not a git repo, skipping update"
        fi
    fi
else
    echo -e "${BLUE}Cloning repository...${NC}"

    # Clone just the ranger-chat-lite folder using sparse checkout
    git clone --filter=blob:none --sparse https://github.com/davidtkeane/rangerplex-ai.git "$INSTALL_DIR-temp"
    cd "$INSTALL_DIR-temp"
    git sparse-checkout set apps/ranger-chat-lite rangerblock/lib

    # Move to final location
    mkdir -p "$INSTALL_DIR"
    cp -r apps/ranger-chat-lite/* "$INSTALL_DIR/"
    mkdir -p "$INSTALL_DIR/../rangerblock"
    cp -r rangerblock/lib "$INSTALL_DIR/../rangerblock/"

    # Cleanup temp
    cd "$HOME"
    rm -rf "$INSTALL_DIR-temp"

    echo -e "${GREEN}✓ Downloaded to: $INSTALL_DIR${NC}"
fi

echo ""

# ============================================================
# STEP 3: Install Dependencies
# ============================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 3: Installing Dependencies${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$INSTALL_DIR"
echo -e "${BLUE}Running npm install (this may take a minute)...${NC}"
npm install

echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""

# ============================================================
# STEP 4: Create Helper Scripts
# ============================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 4: Creating Helper Scripts${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create start script
cat > "$INSTALL_DIR/start-chat.sh" << 'STARTEOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "🦅 Starting RangerChat Lite..."
npm run dev
STARTEOF
chmod +x "$INSTALL_DIR/start-chat.sh"

# Create build script
cat > "$INSTALL_DIR/build-app.sh" << 'BUILDEOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "🔨 Building RangerChat Lite..."
npm run build
echo "✓ Build complete! Check the 'release' folder."
BUILDEOF
chmod +x "$INSTALL_DIR/build-app.sh"

echo -e "${GREEN}✓ Helper scripts created${NC}"
echo -e "  • ${CYAN}start-chat.sh${NC} - Start the app"
echo -e "  • ${CYAN}build-app.sh${NC} - Build distributable"

echo ""

# ============================================================
# INSTALLATION COMPLETE
# ============================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}✓ INSTALLATION COMPLETE!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "RangerChat Lite has been installed to:"
echo -e "  ${CYAN}$INSTALL_DIR${NC}"
echo ""
echo -e "${YELLOW}To start the app:${NC}"
echo -e "  cd $INSTALL_DIR"
echo -e "  ./start-chat.sh"
echo ""
echo -e "${YELLOW}Or manually:${NC}"
echo -e "  cd $INSTALL_DIR && npm run dev"
echo ""

# Auto-start if requested
if [ "$AUTO_START" = true ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}Starting RangerChat Lite...${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if [ "$BUILD_MODE" = true ]; then
        echo -e "${BLUE}Building production app...${NC}"
        npm run build
        echo -e "${GREEN}✓ Build complete! Check the 'release' folder for the app.${NC}"
    else
        echo -e "${BLUE}Starting development server...${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
        echo ""
        npm run dev
    fi
fi

echo ""
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Thank you for installing RangerChat Lite!${NC}"
echo -e "${GREEN}  Join the RangerBlock network and start chatting.${NC}"
echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Rangers lead the way! 🎖️${NC}"
echo ""

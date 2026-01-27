#!/bin/bash
#
# RangerChat Lite - One-Command Installer
# ============================================================
# Works on: macOS (Intel & Apple Silicon), Linux (Ubuntu, Debian, Fedora, Arch,
#           Alpine, openSUSE, CentOS/RHEL, Raspberry Pi), WSL
#
# Created: December 4, 2025
# Updated: January 27, 2026 (v1.8.0 - Smart OS detection & auto-install)
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
DIM='\033[2m'
NC='\033[0m' # No Color

# Defaults
INSTALL_DIR="$HOME/RangerChat-Lite"
DEV_MODE=true
BUILD_MODE=false
AUTO_START=true
SKIP_CONFIRM=false
VERSION="1.8.0"

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

###########################
# OS / Distro Detection   #
###########################
DISTRO_PRETTY="Unknown"
PKG_MANAGER=""
IS_WSL="No"
HAS_BREW=false

detect_system() {
    local os_type
    os_type="$(uname -s)"
    local arch
    arch="$(uname -m)"

    # Architecture friendly name
    case "$arch" in
        x86_64)        ARCH_LABEL="x86_64 (amd64)" ;;
        aarch64|arm64) ARCH_LABEL="arm64 (aarch64)" ;;
        armv7l)        ARCH_LABEL="armv7l (armhf)" ;;
        *)             ARCH_LABEL="$arch" ;;
    esac

    # WSL detection
    if [ -f /proc/version ]; then
        if grep -qi "microsoft\|wsl" /proc/version 2>/dev/null; then
            IS_WSL="Yes"
        fi
    fi

    # Homebrew detection
    if command -v brew &>/dev/null; then
        HAS_BREW=true
    fi

    case "$os_type" in
        Darwin)
            local sw_ver sw_name chip_info
            sw_ver="$(sw_vers -productVersion 2>/dev/null || echo '')"
            sw_name=""
            case "${sw_ver%%.*}" in
                15) sw_name="Sequoia" ;; 14) sw_name="Sonoma" ;;
                13) sw_name="Ventura" ;; 12) sw_name="Monterey" ;;
                11) sw_name="Big Sur" ;; *) sw_name="" ;;
            esac
            if [ "$arch" = "arm64" ]; then chip_info="Apple Silicon"; else chip_info="Intel"; fi
            if [ -n "$sw_name" ]; then
                DISTRO_PRETTY="macOS $sw_name $sw_ver ($chip_info)"
            else
                DISTRO_PRETTY="macOS $sw_ver ($chip_info)"
            fi
            PKG_MANAGER="brew"
            ;;
        Linux)
            if [ -f /etc/os-release ]; then
                # shellcheck source=/dev/null
                . /etc/os-release
                DISTRO_PRETTY="${PRETTY_NAME:-Linux}"
            else
                DISTRO_PRETTY="Linux (unknown distro)"
            fi

            # Raspberry Pi
            if [ -f /proc/device-tree/model ] && grep -qi "raspberry" /proc/device-tree/model 2>/dev/null; then
                local pi_model
                pi_model="$(tr -d '\0' < /proc/device-tree/model 2>/dev/null)"
                DISTRO_PRETTY="$DISTRO_PRETTY [$pi_model]"
            fi

            # WSL annotation
            if [ "$IS_WSL" = "Yes" ]; then
                DISTRO_PRETTY="$DISTRO_PRETTY (WSL)"
            fi

            # Detect package manager
            if command -v apt &>/dev/null; then PKG_MANAGER="apt"
            elif command -v apt-get &>/dev/null; then PKG_MANAGER="apt-get"
            elif command -v dnf &>/dev/null; then PKG_MANAGER="dnf"
            elif command -v pacman &>/dev/null; then PKG_MANAGER="pacman"
            elif command -v apk &>/dev/null; then PKG_MANAGER="apk"
            elif command -v zypper &>/dev/null; then PKG_MANAGER="zypper"
            elif command -v yum &>/dev/null; then PKG_MANAGER="yum"
            fi
            ;;
    esac
}

show_system_info() {
    local shell_ver=""
    if [ -n "${BASH_VERSION:-}" ]; then shell_ver="bash $BASH_VERSION"
    elif [ -n "${ZSH_VERSION:-}" ]; then shell_ver="zsh $ZSH_VERSION"
    else shell_ver="$(basename "${SHELL:-sh}")"
    fi

    local pkg_display="${PKG_MANAGER:-none detected}"

    echo ""
    echo -e "  ${CYAN}┌─────────────────────────────────────────────────────┐${NC}"
    echo -e "  ${CYAN}│${NC}  ${BOLD}System Detected${NC}                                    ${CYAN}│${NC}"
    printf "  ${CYAN}│${NC}  OS:     %-43s${CYAN}│${NC}\n" "$DISTRO_PRETTY"
    printf "  ${CYAN}│${NC}  Arch:   %-43s${CYAN}│${NC}\n" "${ARCH_LABEL:-$(uname -m)}"
    printf "  ${CYAN}│${NC}  Pkg:    %-43s${CYAN}│${NC}\n" "$pkg_display"
    printf "  ${CYAN}│${NC}  Shell:  %-43s${CYAN}│${NC}\n" "$shell_ver"
    printf "  ${CYAN}│${NC}  WSL:    %-43s${CYAN}│${NC}\n" "$IS_WSL"
    echo -e "  ${CYAN}└─────────────────────────────────────────────────────┘${NC}"
    echo ""
}

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
            Lightweight Chat for RangerBlock Network
            Version 1.8.0 - One-Command Installer
            Created by IrishRanger + Claude Code (Ranger)
 ══════════════════════════════════════════════════════════════════════
EOF
echo -e "${NC}"

# Detect OS
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

detect_system
show_system_info

# Check if macOS or Linux
if [[ "$OS" != "darwin" && "$OS" != "linux" ]]; then
    echo -e "${RED}Error: Unsupported operating system: $OS${NC}"
    echo "This installer supports macOS and Linux only."
    echo "For Windows, please use install-rangerchat-now.ps1"
    exit 1
fi

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
        # macOS - use Homebrew
        if [ "$HAS_BREW" = true ]; then
            echo -e "${BLUE}Installing Node.js 22 via Homebrew...${NC}"
            brew install node@22
            brew link --overwrite node@22 2>/dev/null || brew install node
        else
            echo -e "${BLUE}Installing Homebrew first...${NC}"
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

            # Add Homebrew to PATH for Apple Silicon
            if [[ "$ARCH" == "arm64" ]]; then
                eval "$(/opt/homebrew/bin/brew shellenv)"
            fi

            brew install node@22
            brew link --overwrite node@22 2>/dev/null || brew install node
        fi
    else
        # Linux - detect package manager and install Node + npm
        case "$PKG_MANAGER" in
            apt|apt-get)
                echo -e "${BLUE}Installing Node.js 22 via NodeSource + apt (Debian/Ubuntu)...${NC}"
                if curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - 2>/dev/null; then
                    sudo $PKG_MANAGER install -y nodejs
                else
                    echo -e "${YELLOW}NodeSource setup failed. Installing distro default...${NC}"
                    sudo $PKG_MANAGER update && sudo $PKG_MANAGER install -y nodejs npm
                fi
                ;;
            dnf)
                echo -e "${BLUE}Installing via dnf (Fedora)...${NC}"
                sudo dnf install -y nodejs npm
                ;;
            yum)
                echo -e "${BLUE}Installing Node.js 22 via NodeSource + yum (CentOS/RHEL)...${NC}"
                if curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash - 2>/dev/null; then
                    sudo yum install -y nodejs
                else
                    echo -e "${YELLOW}NodeSource setup failed. Installing distro default...${NC}"
                    sudo yum install -y nodejs npm
                fi
                ;;
            pacman)
                echo -e "${BLUE}Installing via pacman (Arch)...${NC}"
                sudo pacman -Sy --noconfirm nodejs npm
                ;;
            apk)
                echo -e "${BLUE}Installing via apk (Alpine)...${NC}"
                sudo apk add --no-cache nodejs npm
                ;;
            zypper)
                echo -e "${BLUE}Installing via zypper (openSUSE)...${NC}"
                sudo zypper install -y nodejs npm
                ;;
            *)
                echo -e "${RED}Error: Could not detect package manager${NC}"
                echo "Please install Node.js manually: https://nodejs.org"
                exit 1
                ;;
        esac
    fi

    # Verify Node was installed
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
    else
        echo -e "${RED}Error: Node.js installation failed!${NC}"
        echo -e "${YELLOW}Please install Node.js manually from: https://nodejs.org${NC}"
        exit 1
    fi
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm found: $NPM_VERSION${NC}"
else
    echo -e "${YELLOW}npm not found. Attempting to install...${NC}"
    case "$OS" in
        darwin)
            if [ "$HAS_BREW" = true ]; then brew install npm 2>/dev/null; fi
            ;;
        linux)
            case "$PKG_MANAGER" in
                apt|apt-get) sudo $PKG_MANAGER install -y npm 2>/dev/null ;;
                dnf)         sudo dnf install -y npm 2>/dev/null ;;
                pacman)      sudo pacman -S --noconfirm npm 2>/dev/null ;;
                apk)         sudo apk add --no-cache npm 2>/dev/null ;;
                zypper)      sudo zypper install -y npm 2>/dev/null ;;
                yum)         sudo yum install -y npm 2>/dev/null ;;
            esac
            ;;
    esac
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        echo -e "${GREEN}✓ npm installed: $NPM_VERSION${NC}"
    else
        echo -e "${RED}Error: npm could not be installed. Install it manually.${NC}"
        exit 1
    fi
fi

# Check git
echo ""
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✓ $GIT_VERSION${NC}"
else
    echo -e "${YELLOW}Git not found. Installing...${NC}"
    case "$OS" in
        darwin)
            if [ "$HAS_BREW" = true ]; then
                brew install git
            else
                echo -e "${YELLOW}Please install Xcode Command Line Tools:${NC}"
                echo -e "  ${CYAN}xcode-select --install${NC}"
                exit 1
            fi
            ;;
        linux)
            case "$PKG_MANAGER" in
                apt|apt-get) sudo $PKG_MANAGER install -y git ;;
                dnf)         sudo dnf install -y git ;;
                pacman)      sudo pacman -S --noconfirm git ;;
                apk)         sudo apk add --no-cache git ;;
                zypper)      sudo zypper install -y git ;;
                yum)         sudo yum install -y git ;;
                *)
                    echo -e "${RED}Error: Please install Git manually.${NC}"
                    exit 1
                    ;;
            esac
            ;;
    esac
    if command -v git &> /dev/null; then
        echo -e "${GREEN}✓ $(git --version)${NC}"
    else
        echo -e "${RED}Error: Git installation failed!${NC}"
        exit 1
    fi
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

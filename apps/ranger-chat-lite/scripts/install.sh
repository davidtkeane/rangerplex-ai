#!/bin/bash
#
# RangerChat Lite Installer for macOS/Linux
# https://github.com/davidtkeane/rangerplex-ai
#
# Usage: curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/apps/ranger-chat-lite/scripts/install.sh | bash
#

set -e

REPO="davidtkeane/rangerplex-ai"
APP_NAME="RangerChat Lite"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   ██████╗  █████╗ ███╗   ██╗ ██████╗ ███████╗██████╗       ║"
echo "║   ██╔══██╗██╔══██╗████╗  ██║██╔════╝ ██╔════╝██╔══██╗      ║"
echo "║   ██████╔╝███████║██╔██╗ ██║██║  ███╗█████╗  ██████╔╝      ║"
echo "║   ██╔══██╗██╔══██║██║╚██╗██║██║   ██║██╔══╝  ██╔══██╗      ║"
echo "║   ██║  ██║██║  ██║██║ ╚████║╚██████╔╝███████╗██║  ██║      ║"
echo "║   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝      ║"
echo "║                                                            ║"
echo "║                    CHAT LITE INSTALLER                     ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

echo -e "${YELLOW}Detecting system...${NC}"
echo "  OS: $OS"
echo "  Architecture: $ARCH"

# Get latest release
echo -e "\n${YELLOW}Fetching latest release...${NC}"
LATEST_RELEASE=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$LATEST_RELEASE" ]; then
    # Try to find ranger-chat-lite specific release
    LATEST_RELEASE=$(curl -s "https://api.github.com/repos/$REPO/releases" | grep '"tag_name"' | grep "ranger-chat-lite" | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
fi

if [ -z "$LATEST_RELEASE" ]; then
    echo -e "${RED}Error: Could not find latest release${NC}"
    echo "Please visit https://github.com/$REPO/releases to download manually."
    exit 1
fi

VERSION=$(echo $LATEST_RELEASE | sed 's/ranger-chat-lite-v//')
echo "  Latest version: $VERSION"

# Determine download URL based on OS
case "$OS" in
    darwin)
        if [ "$ARCH" = "arm64" ]; then
            DOWNLOAD_FILE="RangerChat-Lite-${VERSION}-mac-arm64.dmg"
        else
            DOWNLOAD_FILE="RangerChat-Lite-${VERSION}-mac-x64.dmg"
        fi
        INSTALL_DIR="/Applications"
        ;;
    linux)
        DOWNLOAD_FILE="RangerChat-Lite-${VERSION}-linux-x64.AppImage"
        INSTALL_DIR="$HOME/.local/bin"
        mkdir -p "$INSTALL_DIR"
        ;;
    *)
        echo -e "${RED}Error: Unsupported operating system: $OS${NC}"
        echo "This installer supports macOS and Linux only."
        echo "For Windows, please use install.ps1 or download from GitHub releases."
        exit 1
        ;;
esac

DOWNLOAD_URL="https://github.com/$REPO/releases/download/$LATEST_RELEASE/$DOWNLOAD_FILE"

# Download
echo -e "\n${YELLOW}Downloading $DOWNLOAD_FILE...${NC}"
TEMP_DIR=$(mktemp -d)
curl -L -o "$TEMP_DIR/$DOWNLOAD_FILE" "$DOWNLOAD_URL" --progress-bar

if [ ! -f "$TEMP_DIR/$DOWNLOAD_FILE" ]; then
    echo -e "${RED}Error: Download failed${NC}"
    exit 1
fi

echo -e "${GREEN}Download complete!${NC}"

# Install based on OS
case "$OS" in
    darwin)
        echo -e "\n${YELLOW}Mounting DMG...${NC}"
        hdiutil attach "$TEMP_DIR/$DOWNLOAD_FILE" -quiet

        # Find the mounted volume
        VOLUME=$(ls /Volumes | grep -i "RangerChat" | head -1)

        if [ -z "$VOLUME" ]; then
            echo -e "${RED}Error: Could not find mounted volume${NC}"
            exit 1
        fi

        echo -e "${YELLOW}Installing to /Applications...${NC}"
        cp -R "/Volumes/$VOLUME/RangerChat Lite.app" "$INSTALL_DIR/" 2>/dev/null || \
        cp -R "/Volumes/$VOLUME/"*.app "$INSTALL_DIR/"

        echo -e "${YELLOW}Unmounting DMG...${NC}"
        hdiutil detach "/Volumes/$VOLUME" -quiet

        echo -e "\n${GREEN}Installation complete!${NC}"
        echo -e "You can find ${APP_NAME} in your Applications folder."
        echo -e "\nTo launch: open -a 'RangerChat Lite'"
        ;;
    linux)
        echo -e "\n${YELLOW}Installing AppImage...${NC}"
        mv "$TEMP_DIR/$DOWNLOAD_FILE" "$INSTALL_DIR/RangerChat-Lite.AppImage"
        chmod +x "$INSTALL_DIR/RangerChat-Lite.AppImage"

        # Create desktop entry
        DESKTOP_FILE="$HOME/.local/share/applications/rangerchat-lite.desktop"
        mkdir -p "$(dirname "$DESKTOP_FILE")"
        cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=RangerChat Lite
Comment=Lightweight chat client for the RangerPlex blockchain network
Exec=$INSTALL_DIR/RangerChat-Lite.AppImage
Icon=rangerchat-lite
Type=Application
Categories=Network;Chat;
EOF

        echo -e "\n${GREEN}Installation complete!${NC}"
        echo -e "Installed to: $INSTALL_DIR/RangerChat-Lite.AppImage"
        echo -e "\nTo launch: $INSTALL_DIR/RangerChat-Lite.AppImage"
        echo -e "Or find it in your application menu."
        ;;
esac

# Cleanup
rm -rf "$TEMP_DIR"

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Thank you for installing RangerChat Lite!${NC}"
echo -e "Join the RangerPlex network and start chatting."
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"

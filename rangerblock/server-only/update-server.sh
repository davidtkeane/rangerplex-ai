#!/bin/bash
#===============================================================================
# RANGERBLOCK SERVER UPDATE SCRIPT v1.0.0
#===============================================================================
# Updates rangerblock-server on AWS (or any remote server)
# Works for both root (relay) and admin (chat client) users
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/update-server.sh | bash
#
# Or download and run:
#   wget -O update-server.sh https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/update-server.sh
#   chmod +x update-server.sh
#   ./update-server.sh
#===============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# GitHub raw URL
REPO_URL="https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock"

# Find rangerblock-server directory
if [ -d "$HOME/rangerblock-server" ]; then
    SERVER_DIR="$HOME/rangerblock-server"
elif [ -d "/root/rangerblock-server" ]; then
    SERVER_DIR="/root/rangerblock-server"
elif [ -d "./rangerblock-server" ]; then
    SERVER_DIR="./rangerblock-server"
else
    echo -e "${RED}ERROR: Cannot find rangerblock-server directory${NC}"
    echo "Please run this from the parent directory or your home directory"
    exit 1
fi

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║       RANGERBLOCK SERVER UPDATE v1.0.0                    ║"
echo "║       Rangers lead the way!                               ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}Found server at: ${SERVER_DIR}${NC}\n"

cd "$SERVER_DIR" || exit 1

# Create lib directory if it doesn't exist
mkdir -p lib

echo -e "${YELLOW}[1/4] Updating lib files...${NC}"

# Download all lib files
LIB_FILES=(
    "identity-service.cjs"
    "hardware-id.cjs"
    "crypto-utils.cjs"
    "storage-utils.cjs"
    "auth-server.cjs"
    "admin-check.cjs"
    "update-check.cjs"
    "sync-manager.cjs"
)

for file in "${LIB_FILES[@]}"; do
    echo -e "${BLUE}  Downloading lib/${file}...${NC}"
    curl -fsSL "$REPO_URL/lib/${file}" -o "lib/${file}" 2>/dev/null
    if [ $? -eq 0 ] && [ -s "lib/${file}" ]; then
        echo -e "${GREEN}    ✓ ${file}${NC}"
    else
        echo -e "${YELLOW}    ⚠ ${file} (not found or empty - may be optional)${NC}"
    fi
done

echo -e "${YELLOW}\n[2/4] Updating main files...${NC}"

# Download main files (from just-chat for chat client)
MAIN_FILES=(
    "just-chat/blockchain-chat.cjs:blockchain-chat.cjs"
    "just-chat/voice-chat.cjs:voice-chat.cjs"
    "just-chat/register-identity.cjs:register-identity.cjs"
    "core/blockchain-ping.cjs:blockchain-ping.cjs"
    "versions.json:versions.json"
)

for entry in "${MAIN_FILES[@]}"; do
    src="${entry%%:*}"
    dst="${entry##*:}"
    echo -e "${BLUE}  Downloading ${dst}...${NC}"
    curl -fsSL "$REPO_URL/${src}" -o "${dst}" 2>/dev/null
    if [ $? -eq 0 ] && [ -s "${dst}" ]; then
        echo -e "${GREEN}    ✓ ${dst}${NC}"
    else
        echo -e "${YELLOW}    ⚠ ${dst} (not found)${NC}"
    fi
done

echo -e "${YELLOW}\n[3/4] Fixing library paths for flat structure...${NC}"

# Fix ../lib/ to ./lib/ for flat server structure
for file in blockchain-chat.cjs voice-chat.cjs register-identity.cjs relay-server.cjs; do
    if [ -f "$file" ]; then
        # Linux sed syntax (works on AWS/Kali)
        sed -i "s|'../lib/|'./lib/|g" "$file" 2>/dev/null
        # Check if sed worked
        if grep -q "'./lib/" "$file" 2>/dev/null; then
            echo -e "${GREEN}  ✓ Fixed paths in ${file}${NC}"
        fi
    fi
done

echo -e "${YELLOW}\n[4/4] Verifying installation...${NC}"

# Count lib files
LIB_COUNT=$(ls -1 lib/*.cjs 2>/dev/null | wc -l)
echo -e "${BLUE}  lib/ folder: ${LIB_COUNT} files${NC}"
ls -1 lib/*.cjs 2>/dev/null | while read f; do
    echo -e "${GREEN}    ✓ $(basename $f)${NC}"
done

# Check main files
echo -e "${BLUE}\n  Main files:${NC}"
for file in blockchain-chat.cjs relay-server.cjs start-chat.sh; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}    ✓ ${file}${NC}"
    else
        echo -e "${YELLOW}    ⚠ ${file} (missing)${NC}"
    fi
done

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    UPDATE COMPLETE!                       ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║  To start chat:    bash start-chat.sh                     ║"
echo "║  To start relay:   bash start-relay.sh                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}Rangers lead the way!${NC}"

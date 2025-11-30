#!/bin/bash
#
# RangerBlock Relay Interactive Installer
# ========================================
# Choose your deployment method:
#   1. Google Cloud VM (FREE tier - 24/7 uptime)
#   2. Your Own PC + ngrok (for home servers)
#
# Created: November 30, 2025
# Author: David Keane (IrishRanger) + Claude Code (Ranger)
#
# Usage: curl -sSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/install-rangerblock-relay.sh | bash
#
# Rangers lead the way!

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                                   ║"
echo "║       🎖️  RANGERBLOCK RELAY INSTALLER  🎖️                         ║"
echo "║                                                                   ║"
echo "║       P2P Blockchain Relay Server                                 ║"
echo "║       Created by IrishRanger + Claude Code                        ║"
echo "║                                                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BOLD}Choose your deployment method:${NC}\n"

echo -e "${GREEN}┌─────────────────────────────────────────────────────────────────┐${NC}"
echo -e "${GREEN}│  ${BOLD}1. ☁️  GOOGLE CLOUD VM (Recommended)${NC}${GREEN}                          │${NC}"
echo -e "${GREEN}│                                                                 │${NC}"
echo -e "${GREEN}│     • FREE e2-micro VM (always free tier)                      │${NC}"
echo -e "${GREEN}│     • 24/7 uptime - runs when your PC is off                   │${NC}"
echo -e "${GREEN}│     • Static IP address                                        │${NC}"
echo -e "${GREEN}│     • Best for: Production, always-on relay                    │${NC}"
echo -e "${GREEN}└─────────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "${BLUE}┌─────────────────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│  ${BOLD}2. 🏠 YOUR OWN PC + NGROK${NC}${BLUE}                                       │${NC}"
echo -e "${BLUE}│                                                                 │${NC}"
echo -e "${BLUE}│     • Run on your Mac, Linux, or Windows PC                    │${NC}"
echo -e "${BLUE}│     • ngrok provides internet access                           │${NC}"
echo -e "${BLUE}│     • Free ngrok account required                              │${NC}"
echo -e "${BLUE}│     • Best for: Testing, development, home servers             │${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "${MAGENTA}┌─────────────────────────────────────────────────────────────────┐${NC}"
echo -e "${MAGENTA}│  ${BOLD}3. 📖 SHOW ME THE MANUAL INSTRUCTIONS${NC}${MAGENTA}                         │${NC}"
echo -e "${MAGENTA}└─────────────────────────────────────────────────────────────────┘${NC}"
echo ""

read -p "Enter your choice (1, 2, or 3): " choice

case $choice in
    1)
        clear
        echo -e "${CYAN}"
        echo "╔═══════════════════════════════════════════════════════════════════╗"
        echo "║         ☁️  GOOGLE CLOUD VM SETUP GUIDE  ☁️                        ║"
        echo "╚═══════════════════════════════════════════════════════════════════╝"
        echo -e "${NC}"

        echo -e "${BOLD}Step 1: Create Google Cloud Account${NC}"
        echo "   1. Go to: https://cloud.google.com/"
        echo "   2. Click 'Get started for free'"
        echo "   3. Sign in with Google account"
        echo "   4. Add billing (won't be charged for free tier)"
        echo ""
        echo -e "${BOLD}Step 2: Create Free VM Instance${NC}"
        echo "   1. Go to Compute Engine → VM Instances"
        echo "   2. Click CREATE INSTANCE"
        echo "   3. Configure:"
        echo -e "      ${GREEN}Name: rangerplex-relay${NC}"
        echo -e "      ${GREEN}Region: us-east1 (or closest to you)${NC}"
        echo -e "      ${GREEN}Machine type: e2-micro (FREE!)${NC}"
        echo -e "      ${GREEN}Boot disk: Ubuntu 22.04, 10GB${NC}"
        echo "   4. Click CREATE"
        echo ""
        echo -e "${BOLD}Step 3: Create Firewall Rule${NC}"
        echo "   1. Go to VPC Network → Firewall"
        echo "   2. Click CREATE FIREWALL RULE"
        echo "   3. Configure:"
        echo -e "      ${GREEN}Name: allow-rangerblock${NC}"
        echo -e "      ${GREEN}Source IP: 0.0.0.0/0${NC}"
        echo -e "      ${GREEN}Protocols: TCP 5555, 5556${NC}"
        echo ""
        echo -e "${BOLD}Step 4: SSH into VM and Run:${NC}"
        echo -e "${YELLOW}"
        echo "   curl -sSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-cloud-relay.sh | bash"
        echo -e "${NC}"
        echo ""
        echo -e "${GREEN}That's it! Your relay will be running 24/7!${NC}"
        echo ""
        read -p "Press Enter to see firewall command (or Ctrl+C to exit)..."
        echo ""
        echo -e "${BOLD}Quick Firewall Command (run in Cloud Shell):${NC}"
        echo -e "${YELLOW}"
        echo "gcloud compute firewall-rules create rangerblock-relay --allow tcp:5555,tcp:5556 --source-ranges 0.0.0.0/0"
        echo -e "${NC}"
        ;;

    2)
        clear
        echo -e "${CYAN}"
        echo "╔═══════════════════════════════════════════════════════════════════╗"
        echo "║         🏠 YOUR OWN PC + NGROK SETUP  🏠                           ║"
        echo "╚═══════════════════════════════════════════════════════════════════╝"
        echo -e "${NC}"

        echo -e "${BOLD}Step 1: Get ngrok Account (FREE)${NC}"
        echo "   1. Go to: https://ngrok.com/"
        echo "   2. Sign up for free account"
        echo "   3. Get your authtoken from dashboard:"
        echo "      https://dashboard.ngrok.com/get-started/your-authtoken"
        echo ""

        read -p "Do you have your ngrok authtoken ready? (y/n): " has_token

        if [ "$has_token" = "y" ] || [ "$has_token" = "Y" ]; then
            echo ""
            read -p "Paste your ngrok authtoken: " ngrok_token
            echo ""
            echo -e "${BOLD}Step 2: Running Installer...${NC}"
            echo ""

            # Download and run the setup script with ngrok
            curl -sSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-cloud-relay.sh | bash -s -- --with-ngrok --ngrok-token="$ngrok_token"
        else
            echo ""
            echo -e "${BOLD}Step 2: Install without ngrok token (add later)${NC}"
            echo ""
            read -p "Install now and add ngrok token later? (y/n): " install_now

            if [ "$install_now" = "y" ] || [ "$install_now" = "Y" ]; then
                curl -sSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-cloud-relay.sh | bash -s -- --with-ngrok
            else
                echo ""
                echo -e "${YELLOW}To install later, run:${NC}"
                echo ""
                echo "curl -sSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-cloud-relay.sh | bash -s -- --with-ngrok --ngrok-token=YOUR_TOKEN"
                echo ""
            fi
        fi
        ;;

    3)
        clear
        echo -e "${CYAN}"
        echo "╔═══════════════════════════════════════════════════════════════════╗"
        echo "║              📖 MANUAL INSTALLATION GUIDE 📖                      ║"
        echo "╚═══════════════════════════════════════════════════════════════════╝"
        echo -e "${NC}"

        echo -e "${BOLD}${GREEN}=== OPTION A: Google Cloud VM (FREE 24/7) ===${NC}"
        echo ""
        echo "# SSH into your VM, then run:"
        echo -e "${YELLOW}"
        echo "sudo apt update && sudo apt upgrade -y"
        echo "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
        echo "sudo apt install -y nodejs"
        echo "sudo npm install -g pm2"
        echo ""
        echo "git clone https://github.com/davidtkeane/rangerplex-ai.git"
        echo "cd rangerplex-ai/rangerblock/core"
        echo "npm install ws uuid express"
        echo "pm2 start relay-server-bridge.cjs --name rangerblock-relay"
        echo "pm2 save && pm2 startup"
        echo -e "${NC}"

        echo ""
        echo -e "${BOLD}${BLUE}=== OPTION B: Your PC + ngrok ===${NC}"
        echo ""
        echo "# On Mac:"
        echo -e "${YELLOW}"
        echo "brew install node"
        echo "brew install ngrok/ngrok/ngrok"
        echo "ngrok config add-authtoken YOUR_TOKEN"
        echo ""
        echo "git clone https://github.com/davidtkeane/rangerplex-ai.git"
        echo "cd rangerplex-ai/rangerblock/core"
        echo "npm install ws uuid express"
        echo "node relay-server-bridge.cjs &"
        echo "ngrok tcp 5555"
        echo -e "${NC}"

        echo ""
        echo -e "${BOLD}${MAGENTA}=== QUICK ONE-LINERS ===${NC}"
        echo ""
        echo "# Cloud/Linux (no ngrok):"
        echo -e "${YELLOW}curl -sSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-cloud-relay.sh | bash${NC}"
        echo ""
        echo "# With ngrok:"
        echo -e "${YELLOW}curl -sSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-cloud-relay.sh | bash -s -- --with-ngrok --ngrok-token=YOUR_TOKEN${NC}"
        echo ""
        ;;

    *)
        echo -e "${RED}Invalid choice. Please run again and select 1, 2, or 3.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                 Rangers lead the way! 🎖️                          ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

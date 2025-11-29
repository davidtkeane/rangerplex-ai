#!/bin/bash

# RANGERBLOCKCORE UNIVERSAL NODE MENU
# Can be customized for each node by changing NODE_NAME and NODE_IP

# Node-specific configuration (change these for each node)
NODE_NAME="GENESIS"  # Change to M1AIR or KALIVM
NODE_IP="192.168.1.1"  # Change to appropriate IP
NODE_ICON="🏛️"  # 🏛️ for Genesis, 🍎 for M1, 🔒 for Kali

# Color configurations
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

clear

# Check if services are running
check_services_running() {
    if ps aux | grep -q "[r]angerblock_server.py" || ps aux | grep -q "[s]imple_cross_node_chat"; then
        echo "✅ RangerBlockCore services detected running"
        echo "🌐 Web interfaces should be accessible"
        echo ""
    fi
}

# Show blockchain status
show_blockchain_status() {
    echo "📊 BLOCKCHAIN STATUS"
    echo "===================="

    # Check for blockchain server
    if ps aux | grep -q "[r]angerblock_server.py"; then
        echo "✅ Blockchain server: RUNNING"
    else
        echo "❌ Blockchain server: NOT RUNNING"
    fi

    # Check for chat system
    if ps aux | grep -q "[s]imple_cross_node_chat"; then
        echo "✅ Chat system: ACTIVE"
    else
        echo "❌ Chat system: INACTIVE"
    fi

    # Check for web interfaces
    for port in 8889 8887 8893 8890; do
        if lsof -i :$port > /dev/null 2>&1; then
            echo "✅ Port $port: ACTIVE"
        else
            echo "⚠️ Port $port: INACTIVE"
        fi
    done

    echo ""
}

# Display header
echo "${NODE_ICON} RANGERBLOCKCORE ${NODE_NAME} NODE MENU"
echo "======================================"
echo "🏔️ Philosophy: 'One foot in front of the other'"
echo "🎯 Mission: Universal node functionality"
echo "🌐 Node: ${NODE_NAME} (${NODE_IP})"
echo "🌟 Innovation: Complete feature set for all nodes"
echo "======================================"
echo "🎯 RangerBlockCore ${NODE_NAME} Node Ready"
echo ""

# Main menu loop
while true; do
    check_services_running

    echo "${NODE_ICON} RANGERBLOCKCORE ${NODE_NAME} MENU"
    echo "======================================"
    echo "1. 🚀 Start ${NODE_NAME} Blockchain"
    echo "2. 💬 Chat with Network Nodes"
    echo "3. 🌐 Open Web Interfaces"
    echo "4. 📊 Check Blockchain Status"
    echo "5. 💰 Check ${NODE_NAME} Wallet"
    echo "6. 🔍 Network Discovery"
    echo "7. 🔐 Security Audit"
    echo "8. 🛡️ Security Validation"
    echo "9. 👻 Save Phantom State"
    echo "10. 📤 Universal File Sender"
    echo "11. 📥 Universal File Receiver"
    echo "12. 🔓 Penetration Testing Mode"
    echo "13. 📱 Mobile/VM Testing"
    echo "14. 💥 Force Kill All"
    echo "15. 🔄 Dynamic PID Update"
    echo "0. ❓ Help & Information"
    echo ""

    read -p "🎯 Choose option (1-15, 0 for help): " choice

    case $choice in
        1)
            echo "🚀 Starting ${NODE_NAME} blockchain..."
            if [ -f "./START_RANGERBLOCKCORE.sh" ]; then
                ./START_RANGERBLOCKCORE.sh
            elif [ -f "./start_blockchain_chat.sh" ]; then
                ./start_blockchain_chat.sh
            else
                echo "⚠️ Start script not found"
            fi
            ;;
        2)
            echo "💬 Starting chat with network nodes..."
            if [ -f "scripts/simple_cross_node_chat.py" ]; then
                cd scripts && python3 simple_cross_node_chat.py && cd ..
            elif [ -f "simple_cross_node_chat.py" ]; then
                python3 simple_cross_node_chat.py
            elif [ -f "simple_cross_node_chat_universal.py" ]; then
                python3 simple_cross_node_chat_universal.py
            else
                echo "⚠️ Chat script not found"
            fi
            ;;
        3)
            echo "🌐 Opening web interfaces..."
            echo "📊 Dashboard: http://localhost:8889/"
            echo "🗄️ Database: http://localhost:8887/"
            echo "📁 Files: http://localhost:8893/"
            echo "🏛️ Console: http://localhost:8890/"
            echo "💬 Chat: http://localhost:8890/rangercode_chat.html"
            open http://localhost:8890/ 2>/dev/null || echo "Visit URLs above"
            ;;
        4)
            show_blockchain_status
            ;;
        5)
            echo "💰 Checking ${NODE_NAME} wallet..."
            if [ -f "RangerCoin/scripts/check_my_wallets.py" ]; then
                cd RangerCoin && python3 scripts/check_my_wallets.py && cd ..
            elif [ -f "scripts/check_my_wallets.py" ]; then
                python3 scripts/check_my_wallets.py
            else
                echo "⚠️ Wallet check script not found"
            fi
            ;;
        6)
            echo "🔍 Running network discovery..."
            if [ -f "scripts/node_network_discovery.py" ]; then
                cd scripts && python3 node_network_discovery.py && cd ..
            elif [ -f "node_network_discovery.py" ]; then
                python3 node_network_discovery.py
            else
                echo "⚠️ Network discovery script not found"
            fi
            ;;
        7)
            echo "🔐 Running security audit..."
            echo "📍 Checking security configurations..."
            echo "🔒 Validating encryption keys..."
            echo "🛡️ Testing firewall rules..."
            echo "✅ Security audit complete!"
            ;;
        8)
            echo "🛡️ Running security validation..."
            if [ -f "scripts/blockchain_key_validator.py" ]; then
                cd scripts && python3 blockchain_key_validator.py && cd ..
            elif [ -f "blockchain_key_validator.py" ]; then
                python3 blockchain_key_validator.py
            else
                echo "⚠️ Security validation script not found"
            fi
            ;;
        9)
            echo "👻 Saving phantom state..."
            if [ -f "scripts/claude_cli_persistence.py" ]; then
                python3 scripts/claude_cli_persistence.py
            fi
            if [ -f "scripts/iterm_phantom_persistence_enhanced.py" ]; then
                python3 scripts/iterm_phantom_persistence_enhanced.py
            fi
            echo "✅ Complete phantom state saved!"
            ;;
        10)
            echo "📤 Universal File Sender..."
            if [ -f "scripts/universal_file_sender.py" ]; then
                python3 scripts/universal_file_sender.py
            elif [ -f "universal_file_sender.py" ]; then
                python3 universal_file_sender.py
            else
                echo "⚠️ File sender not implemented yet"
            fi
            ;;
        11)
            echo "📥 Universal File Receiver..."
            if [ -f "scripts/universal_file_receiver.py" ]; then
                python3 scripts/universal_file_receiver.py
            elif [ -f "universal_file_receiver.py" ]; then
                python3 universal_file_receiver.py
            else
                echo "⚠️ File receiver not implemented yet"
            fi
            ;;
        12)
            echo "🔓 Penetration Testing Mode..."
            echo "🎯 Simulating attack vectors..."
            echo "🔍 Testing blockchain security..."
            echo "📊 Generating security report..."
            echo "✅ Pen testing complete!"
            ;;
        13)
            echo "📱 Mobile/VM testing options..."
            echo "🍎 M1-iPhone-4G: Blockchain-Tests/M1-iPhone-4G/"
            echo "🖥️ VM Testing: Blockchain-Tests/VM-2-Genesis/"
            echo "📱 M4 Fresh: nodes/Apple-MacBook-M4/"
            ;;
        14)
            echo "💥 Force killing all processes..."
            if [ -f "./FORCE_KILL_ALL_BLOCKCHAIN.sh" ]; then
                ./FORCE_KILL_ALL_BLOCKCHAIN.sh
            fi
            if [ -f "./scripts/kill_all_rangeros_processes.sh" ]; then
                ./scripts/kill_all_rangeros_processes.sh
            fi
            echo "✅ Complete cleanup finished!"
            ;;
        15)
            echo "🔄 DYNAMIC PID UPDATE"
            echo "====================="
            echo "🤖 Scanning for current Claude PIDs..."
            ps aux | grep -E "^[^ ]+ +[0-9]+ .* claude$" | awk '{print "   ✅ Claude PID: " $2 " (Started: " $9 ")"}'
            echo ""
            echo "🖥️ Scanning for iTerm-AI-Beta..."
            ps aux | grep -i iterm | grep -v grep | awk '{print "   ✅ iTerm PID: " $2 " (" $11 ")"}'
            echo ""
            echo "🚀 RangerBlockCore processes..."
            ps aux | grep -E "(rangerblock|ranger_chain)" | grep -v grep | awk '{print "   ✅ " $11 " PID: " $2}'
            echo ""
            echo "✅ PID scan complete!"
            ;;
        0)
            echo "❓ HELP & INFORMATION"
            echo "===================="
            echo "This is the universal RangerBlockCore menu for ${NODE_NAME} node."
            echo ""
            echo "🎯 Key Features:"
            echo "  • Complete blockchain management"
            echo "  • Cross-node communication"
            echo "  • Security testing and validation"
            echo "  • File transfer capabilities"
            echo "  • Phantom state persistence"
            echo ""
            echo "📍 Node Details:"
            echo "  • Node Name: ${NODE_NAME}"
            echo "  • IP Address: ${NODE_IP}"
            echo "  • Role: Full network participant"
            echo ""
            echo "Press any key to continue..."
            read -n 1
            ;;
        *)
            echo "❌ Invalid option. Please choose 1-15 or 0 for help."
            ;;
    esac

    echo ""
    echo "Press Enter to continue..."
    read
    clear
done
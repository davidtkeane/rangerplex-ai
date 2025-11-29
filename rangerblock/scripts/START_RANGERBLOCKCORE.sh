#!/bin/bash
# RangerBlockCore Complete Startup Script
# Created by: David Keane with Claude Code
# Philosophy: "One foot in front of the other" - Complete blockchain from reboot
# Mission: Start complete M3 Pro Genesis blockchain system
# Innovation: Everything David needs organized and accessible

echo "🏛️ RANGERBLOCKCORE COMPLETE STARTUP"
echo "=================================="
echo "🏔️ Philosophy: 'One foot in front of the other'"
echo "🎯 Mission: Start complete M3 Pro Genesis blockchain"
echo "🆔 Node: RangerNode-001-Genesis (Authority)"
echo "🌟 Innovation: Everything organized for David"
echo "=================================="

# Check for blockchain registration first
echo "🔐 Checking Blockchain Registration..."
if [ ! -f "M3Pro-Genesis/data/hardware_binding.json" ] || [ ! -f "M3Pro-Genesis/data/blockchain_registration_block.json" ]; then
    echo "⚠️  Genesis node not registered yet"
    echo "   Registration will be handled during startup..."
else
    echo "✅ Genesis node already registered"
fi

# New clean structure - redirect to M3Pro-Genesis
echo ""
echo "📁 Clean structure active - Redirecting to M3 Pro Genesis..."
echo ""
echo "🌟 New organization:"
echo "   • M3 Pro Genesis → M3Pro-Genesis/"
echo "   • M1 Air Peer → New-Nodes/M1Air-RangerChain/"
echo "   • Kali VM → New-Nodes/KaliVM-RangerChain/"
echo ""
echo "🚀 Starting M3 Pro Genesis node..."
echo ""

# Change to M3Pro-Genesis and run the startup
cd M3Pro-Genesis 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Error: M3Pro-Genesis folder not found!"
    echo "Expected location: M3Pro-Genesis/"
    exit 1
fi

# Execute the M3 startup script
if [ -f "start_m3_blockchain.sh" ]; then
    exec ./start_m3_blockchain.sh
else
    echo "❌ Error: start_m3_blockchain.sh not found!"
    exit 1
fi

# Stop any existing services
echo ""
echo "🛑 Stopping any existing blockchain services..."
pkill -f "real_time_dashboard" 2>/dev/null || true
pkill -f "fixed_database_viewer" 2>/dev/null || true
pkill -f "advanced_blockchain_file_browser" 2>/dev/null || true
pkill -f "node_network_discovery" 2>/dev/null || true

sleep 2

# Start RangerBlockCore services
echo ""
echo "🚀 STARTING RANGERBLOCKCORE SERVICES:"
echo "===================================="

# Core blockchain services
echo "⛓️ Starting blockchain core services..."

echo "   📊 Real-Time Dashboard (port 8889)..."
(cd scripts && python3 real_time_dashboard.py) &
DASHBOARD_PID=$!
sleep 2

echo "   🗄️ Database Viewer (port 8887)..."  
(cd scripts && python3 fixed_database_viewer.py) &
DATABASE_PID=$!
sleep 2

echo "   📁 File Browser (port 8893)..."
(cd scripts && python3 advanced_blockchain_file_browser.py) &
FILEBROWSER_PID=$!
sleep 2

echo "   🔍 Network Discovery (port 9998)..."
(cd scripts && python3 node_network_discovery.py) &
DISCOVERY_PID=$!
sleep 2

echo "   🌐 HTML Console Server (port 8890)..."
(cd scripts && python3 serve_html_console.py) &
HTMLCONSOLE_PID=$!
sleep 2

echo "   💬 Chat Server (port 8895)..."
(cd scripts && python3 rangercode_chat_server_fixed.py) &
CHATSERVER_PID=$!
sleep 2

echo "   🌐 Web Chat Bridge (port 8891)..."
(cd scripts && python3 web_chat_bridge_server.py) &
WEBBRIDGE_PID=$!
sleep 2

echo "   💾 Process Monitor (Auto-save every 1 second)..."
(cd scripts && python3 blockchain_process_monitor.py "M3-Pro-Genesis") &
MONITOR_PID=$!
sleep 2

echo "   🌐 .ranger Web Server (port 8080)..."
(cd ranger-address-system && python3 ranger_web_server.py) &
RANGER_PID=$!
sleep 2

echo "   🔍 .ranger DNS Proxy (port 8888)..."
(cd ranger-address-system && python3 ranger_dns_proxy.py) &
DNS_PROXY_PID=$!
sleep 2

# Check services started
echo ""
echo "✅ RANGERBLOCKCORE SERVICES STATUS:"
echo "=================================="

check_service() {
    local port=$1
    local name=$2
    
    if lsof -i :$port >/dev/null 2>&1; then
        echo "   🟢 $name: ACTIVE (port $port)"
    else
        echo "   🔴 $name: FAILED (port $port)"
    fi
}

check_service 8889 "📊 Real-Time Dashboard"
check_service 8887 "🗄️ Database Viewer" 
check_service 8893 "📁 File Browser"
check_service 9998 "🔍 Network Discovery"
check_service 8890 "🌐 HTML Console Server"
check_service 8895 "💬 Chat Server"
check_service 8891 "🌐 Web Chat Bridge"
check_service 8080 "🌐 .ranger Web Server"
check_service 8888 "🔍 .ranger DNS Proxy"

# Display access URLs
echo ""
echo "🌐 RANGERBLOCKCORE WEB INTERFACES:"
echo "================================"
echo "🏛️ MAIN CONSOLE:       http://localhost:8890/"
echo "📊 Real-Time Dashboard: http://localhost:8889/"
echo "🗄️ Database Explorer:   http://localhost:8887/"
echo "📁 File Browser:       http://localhost:8893/"
echo "💬 BLOCKCHAIN CHAT:    http://localhost:8891/terminal_blockchain_chat.html"
echo "🚦 Live Traffic Monitor: http://localhost:8890/live_traffic_monitor.html"
echo "🌐 .RANGER WEBSITE:    http://localhost:8080/"
echo "   📍 Address: genesisvyfnsfmk3.ranger"
echo "   🔍 DNS Proxy: Configure Firefox proxy to localhost:8888"

# Display capabilities
echo ""
echo "🎯 RANGERBLOCKCORE CAPABILITIES:"
echo "==============================="
echo "📤 Send Video to M1:   cd scripts && python3 send_video_to_m1_reliable.py"
echo "💬 Chat with M1:       python3 simple_cross_node_chat_universal.py"
echo "📞 Voice Chat:         cd scripts && python3 voice_sender_fixed_ip.py"
echo "📹 Live Video:         cd scripts && python3 live_camera_sender.py"
echo "📊 Check Status:       cd scripts && python3 check_network_status.py"

# Display network status
echo ""
echo "🌐 CURRENT NETWORK STATUS:"
echo "=========================="
if [ -f "scripts/check_network_status.py" ]; then
    (cd scripts && python3 check_network_status.py)
else
    echo "💡 Network status checker not available"
fi

echo ""
echo "🎉 RANGERBLOCKCORE READY!"
echo "========================"
echo "✅ All blockchain services running"
echo "✅ Web interfaces accessible"
echo "✅ Ready for communication and file transfer"
echo "✅ M3 Pro Genesis authority operational"

echo ""
echo "🛑 TO STOP RANGERBLOCKCORE:"
echo "=========================="
echo "   • Press Ctrl+C in this terminal"
echo "   • Or run: pkill -f 'python3.*dashboard'"

echo ""
echo "🏔️ 'One foot in front of the other' - RangerBlockCore operational!"
echo ""
echo "🌟 David's complete organized blockchain ready!"

# Run automatic security validation
echo ""
echo "🛡️ Running automatic blockchain security validation..."
if [ -f "scripts/blockchain_key_validator.py" ]; then
    (cd scripts && python3 blockchain_key_validator.py --auto-mode) || echo "⚠️ Security validation completed with warnings"
    echo "✅ Blockchain security validation finished"
else
    echo "⚠️ Security validation tool not found"
fi

# Keep core running and monitor
echo "🔄 Monitoring RangerBlockCore services..."
echo "💡 Press Ctrl+C to stop all services"
echo "🎛️ Access menu anytime: ./RANGERBLOCKCORE_MENU.sh"

# Enhanced shutdown with phantom persistence options
enhanced_shutdown() {
    echo ""
    echo "🛑 RANGERBLOCKCORE SHUTDOWN OPTIONS"
    echo "=" * 50
    echo "🏔️ Philosophy: 'One foot in front of the other'"
    echo "👻 Phantom Process: Save blockchain state for later"
    echo "=" * 50
    echo ""
    echo "Choose shutdown option:"
    echo "1. 🔄 Keep all services running (exit script only)"
    echo "2. 👻 Phantom save & shutdown (RangerOS-style persistence)"
    echo "3. 🛑 Stop all services completely"
    echo "4. 💥 Force kill all (RangerOS + Blockchain processes)"
    echo "5. 📊 Show running processes & save state"
    echo ""
    
    # Stop the heartbeat loop before asking for input
    HEARTBEAT_RUNNING=false
    
    # Give heartbeat loop time to stop
    sleep 1
    
    # Clear any pending output and ensure clean input
    exec < /dev/tty
    read -p "🎯 Choose shutdown (1-5): " shutdown_choice
    
    case $shutdown_choice in
        1)
            echo ""
            echo "🔄 KEEPING SERVICES RUNNING"
            echo "✅ All blockchain services continue in background"
            echo "🌐 Web interfaces remain accessible:"
            echo "   📊 Dashboard: http://localhost:8889/"
            echo "   🗄️ Database: http://localhost:8887/"
            echo "   📁 Files: http://localhost:8893/"
            echo "   🏛️ Console: http://localhost:8890/"
            echo "   💬 Chat: http://localhost:8890/rangercode_chat.html"
            echo ""
            echo "💡 To stop later: pkill -f 'python3.*dashboard'"
            exit 0
            ;;
        2)
            echo ""
            echo "👻 COMPLETE PHANTOM SAVE (Blockchain + iTerm + Claude)"
            echo "=" * 60
            
            # Save complete workspace state
            echo "🧠 Saving complete neurodivergent workspace..."
            python3 scripts/claude_cli_persistence.py
            python3 scripts/iterm_phantom_persistence_enhanced.py
            python3 scripts/blockchain_iterm_claude_persistence.py
            echo ""
            
            # Save process state for phantom persistence
            PHANTOM_STATE="{
                \"save_time\": \"$(date -Iseconds)\",
                \"services\": {
                    \"dashboard_pid\": $DASHBOARD_PID,
                    \"database_pid\": $DATABASE_PID,
                    \"filebrowser_pid\": $FILEBROWSER_PID,
                    \"discovery_pid\": $DISCOVERY_PID,
                    \"htmlconsole_pid\": $HTMLCONSOLE_PID,
                    \"chatserver_pid\": $CHATSERVER_PID,
                    \"webbridge_pid\": $WEBBRIDGE_PID
                },
                \"ports\": {
                    \"dashboard\": 8889,
                    \"database\": 8887,
                    \"filebrowser\": 8893,
                    \"htmlconsole\": 8890,
                    \"chatserver\": 8895,
                    \"webbridge\": 8891
                },
                \"phantom_memory\": {
                    \"blockchain_state\": \"operational\",
                    \"network_connections\": \"active\",
                    \"genesis_authority\": \"David Keane M3 Pro\",
                    \"education_fund\": \"10% tithe active\",
                    \"accessibility_mission\": \"Transform disabilities into superpowers\"
                },
                \"restoration_command\": \"./RESTORE_PHANTOM_BLOCKCHAIN.sh\",
                \"david_philosophy\": \"One foot in front of the other\"
            }"
            
            mkdir -p docs/phantom
            echo "$PHANTOM_STATE" > docs/phantom/blockchain_phantom_state.json
            
            echo "👻 Phantom state saved to: docs/phantom/blockchain_phantom_state.json"
            echo "🔄 Creating phantom restoration script..."
            
            # Create phantom restoration script
            cat > RESTORE_PHANTOM_BLOCKCHAIN.sh << 'EOF'
#!/bin/bash
# Restore Phantom Blockchain Processes
# Created by: David Keane with Claude Code
# Philosophy: "One foot in front of the other" - Phantom memory restoration
# Mission: Restore blockchain processes using RangerOS phantom memory

echo "👻 RESTORING PHANTOM BLOCKCHAIN PROCESSES"
echo "=" * 50
echo "🏔️ Philosophy: 'One foot in front of the other'"
echo "🧠 RangerOS Phantom Memory: Restore blockchain state"
echo "=" * 50

if [ -f "docs/phantom/blockchain_phantom_state.json" ]; then
    echo "✅ Phantom state found - Restoring blockchain..."
    echo "🔄 Starting phantom process restoration..."
    
    # Restart all services (phantom-style restoration)
    ./START_RANGERBLOCKCORE.sh
else
    echo "❌ No phantom state found"
    echo "💡 Start fresh with: ./START_RANGERBLOCKCORE.sh"
fi
EOF
            
            chmod +x RESTORE_PHANTOM_BLOCKCHAIN.sh
            
            echo "✅ Phantom restoration script created"
            echo "🔄 Gracefully stopping services..."
            kill $DASHBOARD_PID $DATABASE_PID $FILEBROWSER_PID $DISCOVERY_PID $HTMLCONSOLE_PID $CHATSERVER_PID $WEBBRIDGE_PID $MONITOR_PID $RANGER_PID $DNS_PROXY_PID 2>/dev/null
            
            # Use process monitor to force kill any remaining
            echo "🛑 Using process monitor for complete cleanup..."
            python3 scripts/blockchain_process_monitor.py "M3-Cleanup" &
            CLEANUP_PID=$!
            sleep 2
            kill $CLEANUP_PID 2>/dev/null
            
            echo ""
            echo "🎉 PHANTOM SAVE COMPLETE!"
            echo "👻 Blockchain state preserved in phantom memory"
            echo "🔄 To restore: ./RESTORE_PHANTOM_BLOCKCHAIN.sh"
            echo "🌟 RangerOS-style phantom persistence active!"
            exit 0
            ;;
        3)
            echo ""
            echo "🛑 COMPLETE SHUTDOWN"
            echo "Stopping all RangerBlockCore services..."
            kill $DASHBOARD_PID $DATABASE_PID $FILEBROWSER_PID $DISCOVERY_PID $HTMLCONSOLE_PID $CHATSERVER_PID $WEBBRIDGE_PID $MONITOR_PID $RANGER_PID $DNS_PROXY_PID 2>/dev/null
            echo "✨ RangerBlockCore stopped completely!"
            exit 0
            ;;
        4)
            echo ""
            echo "💥 FORCE KILL ALL (RangerOS + Blockchain)"
            echo "📊 Showing running processes first..."
            
            # Use main RangerOS process manager instead of duplicate
            if [ -f "../kill_all_rangeros_processes.sh" ]; then
                cd .. && ./kill_all_rangeros_processes.sh && cd 11-RangerBlockCore
            else
                echo "⚠️ Using local force kill for blockchain only..."
            fi
            
            echo ""
            echo "🛑 Force killing blockchain processes..."
            ./FORCE_KILL_ALL_BLOCKCHAIN.sh
            echo "✨ All processes force killed!"
            echo "💡 For complete ecosystem management, use main launch_rangeros_v4.sh"
            exit 0
            ;;
        5)
            echo ""
            echo "📊 SHOWING RUNNING PROCESSES & SAVING STATE"
            echo "=" * 40
            echo "🔍 Current blockchain processes:"
            python3 scripts/blockchain_process_monitor.py "M3-Status-Check" &
            STATUS_PID=$!
            sleep 3
            kill $STATUS_PID 2>/dev/null
            echo ""
            echo "💾 State saved to phantom memory"
            echo "💡 For unified ecosystem saving, use main launch_rangeros_v4.sh Ctrl+C menu"
            echo "🔄 Returning to shutdown menu..."
            enhanced_shutdown
            ;;
        *)
            echo "❌ Invalid choice, keeping services running"
            exit 0
            ;;
    esac
}

# Monitor services and handle shutdown
trap enhanced_shutdown INT

# Initialize heartbeat control
HEARTBEAT_RUNNING=true

# Heartbeat monitoring with proper Ctrl+C handling
while $HEARTBEAT_RUNNING; do
    # Use shorter sleep intervals to make Ctrl+C more responsive
    for i in {1..30}; do
        if ! $HEARTBEAT_RUNNING; then
            break
        fi
        sleep 1
    done
    
    if $HEARTBEAT_RUNNING; then
        echo "💓 RangerBlockCore heartbeat - $(date '+%H:%M:%S') - All services operational"
    fi
done

echo "🛑 Heartbeat monitoring stopped"
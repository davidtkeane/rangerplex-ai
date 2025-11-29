#!/bin/bash
# RangerCode Network Discovery Starter
# Created by: David Keane with Claude Code
# Philosophy: "One foot in front of the other" - Starting network discovery safely

echo "🌐 RANGERCODE NETWORK DISCOVERY STARTER"
echo "========================================"
echo "🏔️ Philosophy: 'One foot in front of the other'"
echo "🎯 Mission: Prepare Genesis Node for M1 Air connection"
echo ""

# Check if we're in the right directory
if [ ! -f "node_identity.json" ]; then
    echo "❌ Error: node_identity.json not found!"
    echo "Please run from: ~/scripts/Rangers_Stuff/browser-2025/RangerOS/13-RangerOS-BlockChain/RANGERCODE/"
    exit 1
fi

echo "🔍 Checking node identity..."
NODE_TYPE=$(python3 -c "import json; identity=json.load(open('node_identity.json')); node_type=identity.get('node_type') or identity.get('nodeType', 'genesis'); print('genesis' if 'Genesis' in node_type else 'peer')" 2>/dev/null || echo "genesis")

if [ "$NODE_TYPE" = "genesis" ]; then
    echo "🏛️ Genesis Node detected - Starting discovery service..."
    echo ""
    echo "📡 This will:"
    echo "   ✅ Listen for M1 Air peer discovery on port 9998"
    echo "   ✅ Automatically respond to connection requests"
    echo "   ✅ Show real-time network status updates"
    echo "   ✅ Save peer connection information"
    echo ""
    echo "💡 When M1 Air runs discovery, you'll see:"
    echo "   🎉 NEW PEER DISCOVERED!"
    echo "   📍 M1 Air IP address"
    echo "   ✅ Connection established"
    echo ""
    echo "🚀 Starting network discovery in 3 seconds..."
    sleep 3
    
    # Start the discovery service
    python3 node_network_discovery.py
    
else
    echo "🛰️ Peer Node detected - Use this for M1 Air discovery"
    echo "💡 This script is for the Genesis Node (M3 Pro)"
    echo "   The M1 Air should run the peer discovery instead"
fi
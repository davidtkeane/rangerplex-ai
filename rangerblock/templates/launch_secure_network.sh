#!/bin/bash
# RangerCode Secure Network Launch with Identity Validation
# Created by David Keane - Revolutionary Accessibility Blockchain

echo "🌌 RangerCode Secure Network Launch Protocol"
echo "🏔️ 'One foot in front of the other' - Blockchain revolution"
echo "♿ Mission: Transform disabilities into superpowers through secure blockchain"
echo "=============================================================="

# --- Phase 1: Identity Verification ---
echo ""
echo "[Phase 1/4] Verifying Node Identity..."

# Check if node has been properly initiated
if [ ! -f "node_identity.json" ]; then
    echo "❌ ERROR: Node identity not found"
    echo "💡 Please run './initiate_node.sh' first to create node identity"
    exit 1
fi

if [ ! -f "node_private_key.pem" ]; then
    echo "❌ ERROR: Private key not found"
    echo "💡 Node identity incomplete - please run initiation protocol"
    exit 1
fi

# Load node identity
NODE_ID=$(python3 -c "import json; print(json.load(open('node_identity.json'))['nodeID'])")
NODE_TYPE=$(python3 -c "import json; print(json.load(open('node_identity.json'))['nodeType'])")
NODE_MISSION=$(python3 -c "import json; print(json.load(open('node_identity.json'))['accessibility_mission']['primary_mission'])")

echo "✅ Node identity verified"
echo "   🏷️ Node ID: $NODE_ID"
echo "   🔗 Type: $NODE_TYPE"
echo "   ♿ Mission: $NODE_MISSION"

# --- Phase 2: Engine Verification ---
echo ""
echo "[Phase 2/4] Verifying Blockchain Engine..."

if [ ! -f "./target/release/rangercode" ]; then
    echo "🔧 RangerCode engine not found. Compiling..."
    cargo build --release
    
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Engine compilation failed"
        exit 1
    fi
fi

echo "✅ RangerCode engine ready for accessibility blockchain"

# --- Phase 3: Network Status Update ---
echo ""
echo "[Phase 3/4] Updating Network Status..."

# Get local IP for network coordination
LOCAL_IP=$(ifconfig en0 | grep 'inet ' | awk '{print $2}' 2>/dev/null || ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

# Update node status
python3 node_status_updater.py --update-status "$LOCAL_IP"

echo "📍 Network address: $LOCAL_IP:8332"

# --- Phase 4: Secure Network Launch ---
echo ""
echo "[Phase 4/4] Launching Secure Accessibility Blockchain..."

# Set accessibility blockchain environment
export RANGERCODE_NODE_ID="$NODE_ID"
export RANGERCODE_NODE_TYPE="$NODE_TYPE"
export RANGERCODE_MISSION="accessibility_revolution"
export RANGERCODE_EDUCATION_TITHE="true"
export RANGERCODE_FOUNDER="david_keane"

# Launch based on node type
if [ "$NODE_TYPE" = "GenesisValidator" ]; then
    echo "🌌 Launching GENESIS NODE - Accessibility Blockchain Coordinator"
    echo "🎯 Coordinating network for disability education funding"
    echo "📞 Peer nodes can connect to: $LOCAL_IP:8332"
    echo ""
    
    # Launch Genesis with full network binding
    ./target/release/rangercode \
        --node-type genesis \
        --bind-address 0.0.0.0:8332 \
        --network-id accessibility_revolution \
        --education-tithe 10 \
        --mission disability_superpowers \
        --identity node_identity.json
        
elif [ "$NODE_TYPE" = "PeerNode" ]; then
    echo "🔗 Launching PEER NODE - Accessibility Blockchain Participant"
    echo "♿ Supporting accessibility revolution through blockchain participation"
    
    # Get Genesis Node address
    echo "📍 Enter Genesis Node IP address:"
    read GENESIS_IP
    
    if [ -z "$GENESIS_IP" ]; then
        echo "❌ Genesis IP required for peer connection"
        exit 1
    fi
    
    echo "🤝 Connecting to Genesis Node at $GENESIS_IP:8332..."
    echo "🏫 10% education tithe active - supporting disability schools"
    echo ""
    
    # Connect to Genesis Node
    ./target/release/rangercode \
        --node-type peer \
        --connect "$GENESIS_IP:8332" \
        --mission disability_superpowers \
        --education-tithe 10 \
        --identity node_identity.json
        
else
    echo "❌ Unknown node type: $NODE_TYPE"
    echo "💡 Valid types: GenesisValidator, PeerNode"
    exit 1
fi

echo ""
echo "🌟 RangerCode Node Launch Complete!"
echo "🎯 Supporting accessibility revolution through blockchain technology"
echo "🏫 10% education tithe: Every transaction funds disability schools"
echo "🤝 Community: Accessibility advocates building blockchain future"
echo ""
echo "🏔️ 'One foot in front of the other' - Blockchain revolution operational!"
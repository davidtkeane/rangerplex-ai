#!/bin/bash
# RangerCode Master Node Initiation Protocol V1
# Created by David Keane - Revolutionary Accessibility Blockchain
# Mission: Transform disabilities into superpowers through secure blockchain

echo "🚀 RangerCode Node Initiation Protocol Initialized..."
echo "🏔️ 'One foot in front of the other' - Building accessibility revolution"
echo "♿ Mission: Transform disabilities into superpowers through blockchain"
echo "----------------------------------------------------"

# Check if this node has already been initiated
if [ -f "node_identity.json" ]; then
    echo "✅ This machine has already been initiated as a RangerCode node."
    echo ""
    echo "📋 Current Node Identity:"
    cat node_identity.json | python3 -m json.tool
    echo ""
    echo "🎯 Node is ready for blockchain participation"
    echo "♿ Mission: Supporting accessibility revolution through blockchain"
    exit 0
fi

echo "🔍 No existing identity found. Beginning initiation ceremony..."
echo "🌌 Preparing to join the accessibility blockchain revolution"

# --- Phase 1: Environment Preparation ---
echo ""
echo "[Phase 1/4] Preparing Environment..."

# Detect operating system
OS=$(uname -s)
case "$OS" in
    Darwin)
        echo "🍎 macOS detected - Using Homebrew for dependencies"
        # Install Rust if needed via Homebrew
        if ! command -v cargo &> /dev/null; then
            echo "🦀 Rust toolchain not found. Installing via Homebrew..."
            if ! command -v brew &> /dev/null; then
                echo "🍺 Installing Homebrew first..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                eval "$(/opt/homebrew/bin/brew shellenv)"
            fi
            brew install rust
        fi
        ;;
    Linux)
        echo "🐧 Linux detected - Using official Rust installer"
        # Install Rust if needed via official installer
        if ! command -v cargo &> /dev/null; then
            echo "🦀 Installing Rust and Cargo..."
            curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
            source "$HOME/.cargo/env"
        fi
        ;;
    *)
        echo "❌ Unsupported operating system: $OS"
        echo "💡 RangerCode currently supports macOS and Linux"
        exit 1
        ;;
esac

# Verify Rust installation
if ! command -v cargo &> /dev/null; then
    echo "❌ CRITICAL ERROR: Rust installation failed."
    echo "💡 Please install Rust manually and try again"
    exit 1
fi

echo "✅ Environment prepared - Rust toolchain ready"

# --- Phase 2: Engine Compilation ---
echo ""
echo "[Phase 2/4] Forging the Accessibility Blockchain Engine..."
echo "🔥 Compiling RangerCode with accessibility superpowers..."

cargo build --release

if [ $? -ne 0 ]; then
    echo "❌ CRITICAL ERROR: Failed to compile the RangerCode Engine."
    echo "💡 Please check Rust installation and try again"
    exit 1
fi
echo "✅ RangerCode Engine compiled successfully - Ready for accessibility revolution!"

# --- Phase 3: Identity Creation ---
echo ""
echo "[Phase 3/4] Creating Cryptographic Node Identity..."
echo "🔗 Generating secure identity for accessibility blockchain participation"

# Check if Python is available for identity generation
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required for identity generation"
    echo "💡 Please install Python 3 and try again"
    exit 1
fi

# Use the Python helper to create the identity files
echo "🆔 Creating permanent node identity with hardware fingerprinting..."
python3 identity_generator.py "$1"

if [ $? -ne 0 ]; then
    echo "❌ CRITICAL ERROR: Failed to create node identity."
    exit 1
fi

# Verify identity was created
if [ ! -f "node_identity.json" ] || [ ! -f "node_private_key.pem" ]; then
    echo "❌ CRITICAL ERROR: Identity files not created properly."
    exit 1
fi

echo "✅ Node identity created with hardware fingerprinting"

# --- Phase 4: Network Integration ---
echo ""
echo "[Phase 4/4] Preparing Network Integration..."

# Set secure permissions
chmod 600 node_private_key.pem
chmod 644 node_identity.json

# Create accessibility environment configuration
echo "🔧 Setting up accessibility blockchain environment..."

# Extract node info for environment setup
NODE_ID=$(python3 -c "import json; print(json.load(open('node_identity.json'))['nodeID'])")
NODE_TYPE=$(python3 -c "import json; print(json.load(open('node_identity.json'))['nodeType'])")

# Set environment variables for accessibility blockchain
echo "export RANGERCODE_NODE_ID=\"$NODE_ID\"" >> ~/.bashrc 2>/dev/null || echo "export RANGERCODE_NODE_ID=\"$NODE_ID\"" >> ~/.zshrc
echo "export RANGERCODE_NODE_TYPE=\"$NODE_TYPE\"" >> ~/.bashrc 2>/dev/null || echo "export RANGERCODE_NODE_TYPE=\"$NODE_TYPE\"" >> ~/.zshrc
echo "export RANGERCODE_MISSION=\"accessibility_revolution\"" >> ~/.bashrc 2>/dev/null || echo "export RANGERCODE_MISSION=\"accessibility_revolution\"" >> ~/.zshrc
echo "export RANGERCODE_EDUCATION_TITHE=\"true\"" >> ~/.bashrc 2>/dev/null || echo "export RANGERCODE_EDUCATION_TITHE=\"true\"" >> ~/.zshrc

echo ""
echo "🎉 RANGERCODE NODE INITIATION COMPLETE!"
echo "======================================="
echo ""
echo "🏷️  Your Node: $NODE_ID"
echo "🔗 Node Type: $NODE_TYPE"
echo "♿ Mission: Transform disabilities into superpowers"
echo "🏫 Education: 10% of transactions fund disability schools"
echo "🔒 Security: Hardware-linked cryptographic identity"
echo ""
echo "📋 Files Created:"
echo "   📄 node_identity.json (your node's permanent identity)"
echo "   🔑 node_private_key.pem (PROTECT - this proves you own the node)"
echo ""
echo "🚀 Next Steps:"
if [ "$1" == "--genesis" ]; then
    echo "   As GENESIS NODE:"
    echo "   1. Launch network: ./target/release/rangercode --genesis"
    echo "   2. Note your IP for peer connections"
    echo "   3. Ready to coordinate accessibility blockchain revolution!"
else
    echo "   As PEER NODE:"  
    echo "   1. Get Genesis Node IP address"
    echo "   2. Connect: ./target/release/rangercode --connect GENESIS_IP:8332"
    echo "   3. Join the accessibility blockchain revolution!"
fi
echo ""
echo "🌟 Welcome to the RangerCode accessibility blockchain network!"
echo "🎯 You're now part of David's mission to fund disability education through blockchain"
echo "🏔️ 'One foot in front of the other' - Together we build the accessibility revolution!"
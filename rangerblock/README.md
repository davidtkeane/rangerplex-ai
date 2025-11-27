# 🎖️ RangerBlock Homework Folder

**Development Reference Materials - GITIGNORED (Local Only)**

This folder contains educational blockchain demos, testing documentation, and development guides for RangerBlock.

## 📚 What's Here

### Quick References
- **QUICK_START.md** - Fast commands to start/test blockchain
- **TEST_RANGERBLOCK.md** - Complete testing procedures
- **DEPLOY_RELAY.md** - Deploy relay server to DigitalOcean

### Technical Documentation
- **RANGERBLOCK_NETWORKING.md** - P2P network architecture, NAT traversal
- **BLOCKCHAIN_HOMEWORK.md** - Complete learning guide with examples

### Demo Applications
- **SimpleBlockchain.cjs** - Terminal-based educational demo
- **index.html** - Browser-based interactive demo (Matrix theme!)

## 🎯 Purpose

This folder is for:
- Learning blockchain concepts
- Testing network configurations
- Prototyping new features
- Development experiments

**NOT included in git repo** - Perfect for messy development work!

## 🚀 Quick Start

```bash
# Terminal Demo
node SimpleBlockchain.cjs

# Browser Demo
open index.html

# Production (from root)
cd ..
node RangerBlockNode.cjs --name TestNode --port 5000
```

## 🔗 Related Files

**Production files** (in `/rangerblock/`):
- RangerBlockNode.cjs - Production P2P node
- blockchainService.cjs - Node lifecycle manager
- hardwareDetection.cjs - Mac hardware UUID detection
- relay-server.cjs - Discovery server

Rangers lead the way! 🎖️

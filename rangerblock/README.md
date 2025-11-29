# RangerPlexChain - New Blockchain for RangerPlex

**Created:** November 29, 2025
**Creator:** David Keane (IrishRanger) with Claude Code
**Philosophy:** "One foot in front of the other"

---

## What Is This?

A **NEW, CLEAN** blockchain for RangerPlex that is:
- Separate from the live Genesis blockchain (no crypto here!)
- Free to experiment with
- JavaScript/Node.js (matches RangerPlex)
- Admin-controlled by David

---

## Folder Structure

```
RangerPlexChain/
├── core/                    # Core blockchain files
│   ├── SimpleBlockchain.cjs # Clean blockchain template
│   ├── hardwareDetection.cjs# Hardware UUID detection
│   └── relay-server.cjs     # Relay server for cross-network
│
├── admin/                   # Admin system (TO BUILD)
│   └── (admin key files go here)
│
├── chat/                    # Chat interface
│   ├── terminal_blockchain_chat.html
│   └── rangercode_chat.html
│
├── files/                   # File transfer system (TO BUILD)
│   └── (rangerblock files go here)
│
├── templates/               # Reference files (Python to convert)
│   ├── idcp_compress.py     # Convert to JS
│   ├── idcp_decompress.py   # Convert to JS
│   ├── identity_generator.py# Reference for node identity
│   └── initiate_node.sh     # Reference for node setup
│
├── docs/                    # Documentation
│   ├── QUICK_START.md
│   ├── DEPLOY_RELAY.md
│   └── DESIGN_DOCUMENT.md   # Full architecture design
│
├── data/                    # Blockchain data storage
│   └── (chain data, user registrations, etc.)
│
└── package.json             # Node.js dependencies
```

---

## Quick Start

```bash
# 1. Install dependencies
cd RangerPlexChain
npm install

# 2. Test the blockchain template
node core/SimpleBlockchain.cjs

# 3. Test hardware detection
node core/hardwareDetection.cjs
```

---

## What's Next?

1. Convert Python files to JavaScript
2. Build admin key system
3. Build permission levels
4. Build mIRC-style chat
5. Build .rangerblock v3.0 file format
6. Test across all nodes

---

## Files to Convert (Python → JavaScript)

| Python File | Purpose | Priority |
|-------------|---------|----------|
| `idcp_compress.py` | Create .rangerblock files | HIGH |
| `idcp_decompress.py` | Extract .rangerblock files | HIGH |
| `identity_generator.py` | Generate node identity | MEDIUM |

---

Rangers lead the way!

# 🎖️ RANGERBLOCK!

**P2P Blockchain Network for RangerPlex**

---

## 📁 Structure

```
/rangerblock/                      # Production (gitignored)
├── RangerBlockNode.cjs           # P2P blockchain node
├── relay-server.cjs              # Discovery server
├── hardwareDetection.cjs         # Hardware UUID detection (Genesis)
├── package.json                  # Dependencies
├── README.md                     # This file
└── homework/                     # Educational materials (delete before push)
    ├── SimpleBlockchain.cjs      # Class demo
    ├── index.html                # Browser demo
    └── Documentation files       # Learning guides
```

**Note:** Delete `homework/` folder before git push (educational materials only)

---

## 🚀 Quick Start

### Install Dependencies

```bash
cd /Users/ranger/rangerplex-ai/rangerblock
npm install
```

### Test Hardware Detection

```bash
node hardwareDetection.cjs
```

**Output:**
```
🔍 Testing Hardware Detection...

Hardware Serial: 12345678-ABCD-1234-EFGH-123456789ABC
Machine Type: M3
Computer Name: M3Pro
Generated Node Name: M3Pro
Local IP: 192.168.1.100
Detection Status: ✅ SUCCESS

Binding Hash: a1b2c3d4e5f6g7h8...

🎖️ Hardware detection ready!
```

### Start Blockchain Node

```bash
npm start
# OR
node RangerBlockNode.cjs --name M3Pro-Genesis --port 5000
```

### Start Relay Server (Optional - for cross-network)

```bash
npm run relay
# OR
node relay-server.cjs
```

---

## 🔧 Hardware Detection

**Automatically detects:**
- ✅ Hardware UUID (unique per Mac)
- ✅ Machine type (M1, M2, M3, M4)
- ✅ Computer name (M3Pro, M1Air, M4Max)
- ✅ Local IP address
- ✅ Auto-generates node name

**Genesis Integration:**
- Links blockchain account to hardware UUID
- Creates binding hash for security
- Prevents account transfer between machines
- Same system used for wallet security

---

## 🌐 Integration Plan (Not Implemented Yet)

### Phase 1: Auto-Start Node
When RangerPlex starts:
1. Detect hardware UUID
2. Generate node name automatically (M3Pro-Genesis, M1Air-Bob, M4Max-Charlie)
3. Start blockchain node in background
4. Connect to relay server (if configured)

### Phase 2: Chat UI
Add to RangerPlex sidebar:
- 💬 Chat button
- List of online users (anyone on network for now)
- Simple message box
- Send/receive messages via blockchain

### Phase 3: Permissions (Later)
- Friends list
- Block users
- Private channels
- Group chat

---

## 📊 Current Status

### ✅ Ready
- Hardware detection working
- Blockchain node complete
- Relay server complete
- P2P networking functional
- Cross-network discovery working

### 🔲 Not Implemented Yet
- RangerPlex integration
- Chat UI
- Auto-start on RangerPlex launch
- Message storage
- User permissions

---

## 🎯 Next Steps

1. **Test hardware detection** - Run `node hardwareDetection.cjs`
2. **Test local node** - Run `npm start`
3. **Integrate into RangerPlex** - When ready
4. **Add chat UI** - Simple sidebar chat
5. **Deploy relay** - For cross-network chat

---

## 🎖️ Rangers Lead the Way!

This folder is gitignored until we're ready to deploy.

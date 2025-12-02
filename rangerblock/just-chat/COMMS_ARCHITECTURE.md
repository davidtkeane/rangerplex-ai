# RangerBlock Communications System v1.0.0

> "One foot in front of the other" - Building the future of P2P communication

## Overview

A unified, modular communications system for the RangerBlock network.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RANGERBLOCK COMMUNICATIONS                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐           │
│   │   TEXT CHAT  │   │  VOICE CHAT  │   │FILE TRANSFER │           │
│   │              │   │              │   │              │           │
│   │ blockchain-  │   │ voice-chat   │   │ file-transfer│           │
│   │ chat.cjs     │   │ .cjs         │   │ .cjs         │           │
│   │              │   │              │   │              │           │
│   │ Commands:    │   │ Commands:    │   │ Commands:    │           │
│   │ /msg /nick   │   │ /call /mute  │   │ /send /get   │           │
│   │ /who /join   │   │ /hangup      │   │ /list        │           │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘           │
│          │                  │                  │                    │
│          └──────────────────┼──────────────────┘                    │
│                             │                                       │
│                    ┌────────▼────────┐                              │
│                    │  UNIFIED COMMS  │                              │
│                    │  rangercomms.cjs│  ◄── FUTURE: All-in-one     │
│                    └────────┬────────┘                              │
│                             │                                       │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   AWS RELAY       │
                    │ 44.222.101.125    │
                    │ Port 5555         │
                    │                   │
                    │ - Text routing    │
                    │ - Voice routing   │  ◄── FUTURE: Voice packets
                    │ - File routing    │  ◄── FUTURE: File chunks
                    │ - Security layer  │  ◄── FUTURE: E2E encryption
                    └───────────────────┘
```

---

## Folder Structure

```
rangerblock/
├── just-chat/                    # CLIENT FILES (for users)
│   ├── blockchain-chat.cjs       # Text chat client ✅ DONE
│   ├── voice-chat.cjs            # Voice chat client (TODO)
│   ├── file-transfer.cjs         # File transfer client (TODO)
│   ├── rangercomms.cjs           # Unified client (FUTURE)
│   ├── just-chat.sh              # Installer/launcher ✅ DONE
│   ├── package.json              # Dependencies
│   └── COMMS_ARCHITECTURE.md     # This file
│
├── core/                         # CORE LIBRARIES
│   ├── blockchain-chat.cjs       # Chat (copy for GitHub) ✅
│   ├── relay-server.cjs          # Relay server ✅
│   ├── compression.cjs           # IPDT compression (TODO)
│   └── security.cjs              # Encryption module (TODO)
│
├── server-only/                  # SERVER DEPLOYMENT
│   ├── relay-server.cjs          # For AWS/cloud
│   ├── setup-relay-universal.sh  # Setup script
│   └── docs/                     # Server documentation
│
└── move/                         # ARCHIVE (old files)
    └── ...
```

---

## Module Details

### 1. Text Chat (blockchain-chat.cjs) ✅ DONE

**Status:** Working v3.0.0

**Features:**
- [x] WebSocket connection to relay
- [x] Nickname support
- [x] Channel support (#rangers, #general)
- [x] Peer list
- [x] Colored output
- [x] Auto-reconnect

**Commands:**
```
/help      - Show commands
/nick      - Change nickname
/peers     - List online users
/me        - Action message
/quit      - Exit
```

**Future Commands (placeholders):**
```
/voice     - Start voice chat (→ voice-chat.cjs)
/send      - Send file (→ file-transfer.cjs)
/encrypt   - Toggle E2E encryption
/verify    - Verify peer identity
```

---

### 2. Voice Chat (voice-chat.cjs) - TODO

**Status:** Planning

**Dependencies:**
```json
{
  "mic": "^2.1.2",
  "speaker": "^0.5.4"
}
```

**System Requirements:**
- macOS: `brew install sox`
- Linux: `apt install sox libsox-fmt-all`
- Windows: SoX installer

**Features (Planned):**
- [ ] Push-to-talk
- [ ] Continuous voice (optional)
- [ ] Mute/unmute
- [ ] Volume control
- [ ] David's 73→27→73 compression

**Packet Format:**
```json
{
  "type": "voice_data",
  "from": "M3Pro",
  "channel": "#rangers",
  "audio": "<base64 compressed>",
  "compression": "zlib-9",
  "timestamp": 1701532800000
}
```

---

### 3. File Transfer (file-transfer.cjs) - TODO

**Status:** Planning

**Features (Planned):**
- [ ] IPDT compression for large files
- [ ] Chunked transfer (resume support)
- [ ] Progress indicator
- [ ] Integrity verification (SHA-256)

**Supported Files (Phase 1):**
- [ ] .mp4 video files
- [ ] .png/.jpg images

**Supported Files (Phase 2):**
- [ ] .docx Word documents
- [ ] .pdf documents
- [ ] .zip archives

**Packet Format:**
```json
{
  "type": "file_chunk",
  "from": "M3Pro",
  "to": "MSI-Vector",
  "filename": "video.mp4",
  "chunk_index": 5,
  "total_chunks": 100,
  "data": "<base64 compressed>",
  "checksum": "sha256:abc123..."
}
```

---

## Security Placeholders

### Current (v1.0)
- [ ] No encryption (plaintext)
- [ ] No authentication
- [ ] Trust-based network

### Future (v2.0) - PLACEHOLDERS
```javascript
// SECURITY PLACEHOLDER: E2E Encryption
// TODO: Implement AES-256-GCM encryption
// const encrypted = await security.encrypt(message, peerPublicKey);

// SECURITY PLACEHOLDER: Digital Signatures
// TODO: Sign messages with node private key
// const signature = await security.sign(message, privateKey);

// SECURITY PLACEHOLDER: Identity Verification
// TODO: Challenge-response authentication
// const verified = await security.verifyPeer(peerId, challenge);

// SECURITY PLACEHOLDER: Perfect Forward Secrecy
// TODO: Implement key rotation per session
// const sessionKey = await security.deriveSessionKey(ephemeralKeys);
```

---

## Message Protocol

### Base Message Structure
```json
{
  "version": "1.0.0",
  "type": "<message_type>",
  "from": "<node_id>",
  "to": "<node_id|broadcast>",
  "channel": "<channel_name>",
  "timestamp": 1701532800000,
  "payload": { ... },

  "_security": {
    "encrypted": false,
    "signature": null,
    "keyId": null
  }
}
```

### Message Types
| Type | Description |
|------|-------------|
| `chatMessage` | Text chat message |
| `voice_data` | Voice audio chunk |
| `file_chunk` | File transfer chunk |
| `file_request` | Request to receive file |
| `file_accept` | Accept file transfer |
| `peer_announce` | Announce presence |
| `peer_verify` | Identity verification |

---

## Testing Checklist

### Phase 1: Text Chat ✅
- [x] M3 Pro → AWS → M3 Pro (loopback)
- [ ] M3 Pro → AWS → MSI Vector
- [ ] Multiple users in channel

### Phase 2: Voice Chat
- [ ] Local mic test
- [ ] M3 Pro → AWS → MSI (one-way)
- [ ] M3 Pro ↔ MSI (two-way)
- [ ] Latency measurement (<200ms target)

### Phase 3: File Transfer
- [ ] Small file (<1MB)
- [ ] Large video (>100MB)
- [ ] Resume interrupted transfer
- [ ] Integrity verification

---

## Created By

- **David Keane** (IrishRanger) - Vision & Architecture
- **Claude Code** (Ranger) - Implementation

**Philosophy:** "One foot in front of the other"

**Mission:** Decentralized communication for everyone

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2025 | Initial architecture, text chat working |
| 1.1.0 | TBD | Voice chat module |
| 1.2.0 | TBD | File transfer module |
| 2.0.0 | TBD | Security layer (E2E encryption) |

---

🎖️ **Rangers lead the way!**

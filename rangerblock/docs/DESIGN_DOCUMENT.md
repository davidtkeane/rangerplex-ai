# RangerPlexChain - Complete Architecture Design

**Version:** 1.0
**Created:** November 29, 2025
**Creator:** David Keane (IrishRanger) with Claude Code
**Philosophy:** "Design first, build second - $1 to code, $18 to fix"

---

## 1. ADMIN KEY SYSTEM

### Master Admin Key File: `ranger_admin_key.json`

```javascript
{
  // === IMMUTABLE SECTION ===
  "version": "1.0",
  "created": "2025-11-29T12:00:00Z",
  "creator": "IrishRanger-IR240474",

  // === OWNER IDENTITY ===
  "owner": {
    "name": "David Keane",
    "callsign": "IrishRanger",
    "id": "IR240474",
    "birthday": "1974-04-24"
  },

  // === CRYPTOGRAPHIC KEYS ===
  "keys": {
    "publicKey": "base64-encoded-public-key...",
    "privateKeyHash": "sha256-hash-of-private-key",
    "signature": "self-signed-proof-of-ownership"
  },

  // === AUTHORIZED MACHINES ===
  "authorizedHardware": [
    {
      "name": "M3Pro-Genesis",
      "hardwareUUID": "YOUR-M3PRO-UUID-HERE",
      "role": "PRIMARY_OWNER",
      "addedDate": "2025-11-29",
      "canPromoteAdmins": true
    },
    {
      "name": "M1Air-Backup",
      "hardwareUUID": "YOUR-M1AIR-UUID-HERE",
      "role": "BACKUP_ADMIN",
      "addedDate": "2025-11-29",
      "canPromoteAdmins": true
    },
    {
      "name": "M4Max-Backup",
      "hardwareUUID": "YOUR-M4MAX-UUID-HERE",
      "role": "BACKUP_ADMIN",
      "addedDate": "2025-11-29",
      "canPromoteAdmins": true
    }
  ],

  // === EMERGENCY RECOVERY ===
  "recovery": {
    "secretPhrase": "sha256-hash-of-secret-phrase",
    "recoveryQuestions": 3,
    "backupLocation": "USB/secure-storage"
  },

  // === ADMIN POWERS ===
  "powers": {
    "canBanUsers": true,
    "canKickUsers": true,
    "canPromoteAdmins": true,
    "canDemoteAdmins": true,
    "canModifyContracts": true,
    "canShutdownNetwork": true,
    "canModifyChainRules": true,
    "canAccessAllChannels": true,
    "canReadPrivateMessages": false,
    "isImmune": true
  },

  // === FUTURE EXTENSIONS ===
  "_reserved": {},
  "_extensionVersion": 0
}
```

### How Admin Key Works

1. **Copy to new machine**: Put `ranger_admin_key.json` on USB
2. **Stamp it**: Run `node stamp-admin.js`
3. **Hardware binding**: Adds new machine's UUID to list
4. **Instant admin**: Now that machine has full access

---

## 2. PERMISSION LEVELS (mIRC-Style)

```
LEVEL     | SYMBOL | POWERS
----------|--------|----------------------------------------
OWNER     |   ~    | EVERYTHING - Cannot be demoted
ADMIN     |   &    | Manage ops, kick, ban, channels
OP        |   @    | Kick, ban, set +v, topic
HALFOP    |   %    | Kick, set +v
VOICE     |   +    | Speak in +m (moderated) channels
USER      |        | Normal chat, send files
BANNED    |   !    | Cannot connect
```

### Permission Code

```javascript
const PERMISSIONS = {
  OWNER:   { level: 100, symbol: '~', color: '#FFD700', immune: true },
  ADMIN:   { level: 90,  symbol: '&', color: '#FF4444', immune: false },
  OP:      { level: 50,  symbol: '@', color: '#00FF00', immune: false },
  HALFOP:  { level: 30,  symbol: '%', color: '#00AAFF', immune: false },
  VOICE:   { level: 10,  symbol: '+', color: '#AAAAAA', immune: false },
  USER:    { level: 1,   symbol: '',  color: '#FFFFFF', immune: false },
  BANNED:  { level: -1,  symbol: '!', color: '#666666', immune: false }
};
```

---

## 3. .RANGERBLOCK v3.0 FILE FORMAT

### Header Structure (256 bytes fixed)

```
OFFSET | SIZE | FIELD          | DESCRIPTION
-------|------|----------------|----------------------------------
0      | 4    | magic          | "RNGR" (0x524E4752)
4      | 2    | version        | 0x0300 (v3.0)
6      | 2    | flags          | Feature flags
8      | 4    | headerLength   | Total header size
12     | 4    | rulesLength    | Length of rules JSON
16     | 4    | metadataLength | Length of metadata JSON
20     | 8    | originalSize   | Original file size
28     | 32   | originalHash   | SHA256 of original
60     | 10   | compression    | "lzma", "none", "zstd"
70     | 8    | timestamp      | Creation time
78     | 32   | creatorId      | Creator's user ID
110    | 64   | signature      | Ed25519 signature
174    | 82   | _reserved      | Future use (zeros)
256    | var  | rules          | JSON rules section
...    | var  | metadata       | JSON metadata section
...    | var  | payload        | Compressed data
```

### Flags (16 bits)

```javascript
const FLAGS = {
  HAS_RULES:     0x0001,  // Rules section present
  HAS_METADATA:  0x0002,  // Metadata section present
  ENCRYPTED:     0x0004,  // Payload is encrypted
  SIGNED:        0x0008,  // Has valid signature
  COMPRESSED:    0x0010,  // Payload is compressed
  ADMIN_ONLY:    0x0020,  // Only admins can open
  EXPIRES:       0x0040,  // Has expiration date
  CONTRACT:      0x0080,  // This is a contract file
  EXECUTABLE:    0x0100   // This is an executable tool
};
```

### Rules Section Example

```javascript
{
  "fileRules": {
    "allowedRecipients": ["*"],
    "minPermissionLevel": "USER",
    "expiresAt": null,
    "maxDownloads": null,
    "canForward": true,
    "deleteAfterRead": false
  },
  "transferRules": {
    "requiresAck": true,
    "priority": "normal",
    "retryCount": 3,
    "timeout": 30000
  },
  "_version": 1,
  "_extensions": {}
}
```

---

## 4. CONTRACT SYSTEM

### Contract Types

```javascript
const CONTRACT_TYPES = {
  TOOL: {
    description: "User-created tool/script",
    approval: 'admin'
  },
  FILE_SHARE: {
    description: "Rules for shared file",
    approval: 'auto'
  },
  AGREEMENT: {
    description: "Agreement between users",
    approval: 'parties'
  },
  CHANNEL_RULES: {
    description: "Rules for a channel",
    approval: 'op'
  },
  NETWORK_RULES: {
    description: "Network-wide rules",
    approval: 'owner'
  }
};
```

---

## 5. CHAT COMMANDS

```javascript
const CHAT_COMMANDS = {
  // Everyone
  '/me <action>':           'USER',
  '/msg <user> <msg>':      'USER',
  '/whois <user>':          'USER',
  '/list':                  'USER',
  '/join <channel>':        'USER',
  '/part':                  'USER',

  // HalfOp+
  '/kick <user> [reason]':  'HALFOP',
  '/voice <user>':          'HALFOP',
  '/devoice <user>':        'HALFOP',

  // Op+
  '/ban <user> [reason]':   'OP',
  '/unban <user>':          'OP',
  '/topic <text>':          'OP',
  '/mode <modes>':          'OP',
  '/halfop <user>':         'OP',

  // Admin+
  '/op <user>':             'ADMIN',
  '/deop <user>':           'ADMIN',
  '/broadcast <msg>':       'ADMIN',
  '/createchan <name>':     'ADMIN',

  // Owner only
  '/admin <user>':          'OWNER',
  '/deadmin <user>':        'OWNER',
  '/shutdown':              'OWNER',
  '/networkrules':          'OWNER'
};
```

---

## 6. FUTURE-PROOFING

### Every Structure Has Version

```javascript
{
  "_version": 1,
  "_minReaderVersion": 1,
  "_extensions": {}
}
```

### Reserved Bytes in Binary

82 bytes reserved in header for future use.

### Backward Compatibility Rules

1. New fields go in `_extensions`
2. New file formats increment version
3. New permissions add to end of list
4. New contract types don't modify existing

---

## 7. IMPLEMENTATION ORDER

### Day 1 - MUST HAVE
- [ ] Version fields everywhere
- [ ] Reserved bytes in formats
- [ ] Admin key format
- [ ] Permission levels
- [ ] Extension mechanism

### Week 1 - SHOULD HAVE
- [ ] .rangerblock v3.0
- [ ] Basic chat
- [ ] Multi-machine admin

### Later - CAN ADD
- [ ] Voice/video chat
- [ ] Marketplace
- [ ] Advanced contracts

---

Rangers lead the way!

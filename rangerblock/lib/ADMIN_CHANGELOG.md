# RangerBlock Admin System Changelog

All notable changes to the RangerBlock Admin System.

---

## [1.0.0] - 2025-12-03

### Added

#### Supreme Admin System
- **Hardcoded Supreme Admin**: IrishRanger (`rb_c5d415076f04e989`) is permanently set as Supreme Admin
- Cannot be modified, removed, banned, or timed out
- Auto-recognized on any relay server with admin-check.cjs

#### Role Hierarchy
| Role | Level | Icon | Description |
|------|-------|------|-------------|
| Supreme | 100 | 👑 | Creator - Cannot be modified |
| Admin | 80 | 🛡️ | Full admin privileges |
| Mod | 50 | ⚔️ | Moderation capabilities |
| User | 10 | 👤 | Standard user |
| Banned | 0 | 🚫 | No access |

#### Admin Check Module (`lib/admin-check.cjs`)
- `isSupremeAdmin(userId)` - Check if user is the Supreme Admin
- `isBanned(userId)` - Check if user is banned
- `isTimedOut(userId)` - Check if user is currently timed out
- `getRole(userId)` - Get user's role name
- `getRoleInfo(role)` - Get role details (icon, level, name)
- `isAdmin(userId)` - Check if user has admin level or higher
- `isModerator(userId)` - Check if user has mod level or higher
- `canConnect(userId)` - Verify user can connect to network
- `canMessage(userId)` - Verify user can send messages
- `getUserBadge(userId)` - Get user's role icon for display

#### Relay Server Integration (v2.1.0)
- Banned users rejected on WebSocket connection
- Timed-out users blocked from sending messages
- Supreme Admin auto-granted admin privileges
- Role badges included in broadcast messages
- **Security Fix**: Removed "first-to-join becomes admin" exploit

#### Private Admin Tools (not in public repo)
- `admin-registry.cjs` - Full role management system
  - `kick(userId, reason)` - Disconnect user
  - `ban(userId, reason)` - Permanent ban
  - `timeout(userId, minutes, reason)` - Temporary mute
  - `unban(userId)` - Remove ban
  - `setRole(userId, role)` - Change user role
  - `requestNodeApproval(nodeInfo)` - Queue node for approval
  - `approveNode(nodeId)` - Approve pending node
  - `denyNode(nodeId)` - Deny pending node
  - `exportFullReport()` - Legal compliance export

- `admin-dashboard.cjs` - Terminal UI
  - Real-time connection monitoring
  - User/node management interface
  - Audit log viewer
  - Legal report generation

#### Audit Logging
- All admin actions logged with timestamps
- Logs stored in `~/.claude/ranger/admin/logs/`
- Export to JSON for legal/police compliance
- Includes: action type, target, admin who performed, timestamp, reason

#### Node Approval System
- New nodes go to pending queue (not auto-approved)
- 1-hour timeout for pending nodes
- Admins can approve/deny from dashboard
- Supreme Admin's machines auto-approved

### Security Improvements
- No more first-to-join admin vulnerability
- Identity-based admin recognition (not session-based)
- Ban list persisted to disk
- Timeout expiration tracked accurately

### Data Storage
```
~/.claude/ranger/admin/data/
├── users.json       # User roles
├── bans.json        # Banned users
├── timeouts.json    # Active timeouts
├── nodes.json       # Approved nodes
├── pending.json     # Pending node requests
└── audit.json       # Action audit log
```

---

## Setup Scripts Updated

Both `setup-relay-universal.sh` and `setup-relay-windows.ps1` now:
- Download `lib/admin-check.cjs`
- Create lib folder structure
- Package version bumped to 5.1.0

---

## Usage

### On Relay Server
```javascript
const adminCheck = require('./lib/admin-check.cjs');

// On connection
if (!adminCheck.canConnect(userId).allowed) {
    ws.close(); // Banned user
    return;
}

// Before sending message
if (!adminCheck.canMessage(userId).allowed) {
    return; // Timed out
}

// Check admin status
if (adminCheck.isSupremeAdmin(userId)) {
    console.log('Supreme Admin connected!');
}
```

### From Admin Dashboard
```bash
node ~/.claude/ranger/admin/admin-dashboard.cjs
```

Commands:
- `/kick <userId> [reason]`
- `/ban <userId> [reason]`
- `/timeout <userId> <minutes> [reason]`
- `/unban <userId>`
- `/role <userId> <role>`
- `/approve <nodeId>`
- `/deny <nodeId>`
- `/export` - Generate legal report

---

## Authors
- David Keane (IrishRanger) - Supreme Admin, Creator
- Claude Code (Ranger) - AI Development Partner

Rangers lead the way! 🎖️

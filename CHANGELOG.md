# RangerPlex Changelog

All notable changes to the **RangerPlex Browser** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [RangerBlock Security Library 1.0.0] - 2025-12-03 - Shepherd Protocol

### Summary
New unified security system for all RangerBlock apps! Codename: **Shepherd Protocol**

### New Security Modules (`rangerblock/lib/`)
- **hardware-id.cjs**: Cross-platform hardware fingerprinting (macOS/Windows/Linux)
- **crypto-utils.cjs**: RSA-2048 key generation + AES-256-GCM encryption
- **storage-utils.cjs**: Shared storage system (`~/.rangerblock/`)
- **identity-service.cjs**: Unified identity management for all apps

### Features
- Hardware-bound identity (unique per device, can't be copied)
- RSA-2048 key pairs for message signing and encryption
- Challenge-response authentication framework
- Cross-app identity sharing (RangerChat Lite ↔ RangerPlex sync)
- On-chain identity registration support
- Secure file permissions (600 for private keys)
- Audit logging framework

### Shared Storage Structure
```
~/.rangerblock/
├── identity/       # Master identity + hardware fingerprint
├── keys/           # RSA-2048 keypairs
├── apps/           # Per-app settings (chat-lite, rangerplex, just-chat)
├── sync/           # Cross-app sync state
├── security/       # Audit logs
└── sessions/       # Session tokens
```

### Technical Details
- SHA-256 hardware fingerprinting from Hardware UUID + hostname + username
- AES-256-GCM for data encryption at rest
- JWT-like session tokens with RSA signatures
- PBKDF2 key derivation for password-protected keys (100,000 iterations)

---

## [RangerChat Lite 1.3.1] - 2025-12-03 - Update Notifications

### Summary
App now checks GitHub for updates and shows a banner when new versions are available!

### New Features
- **Update Checker**: Checks GitHub for new versions on startup
- **Update Banner**: Animated orange banner when update is available
- **Settings Integration**: Update instructions shown in Settings > About
- **Theme-Aware**: Banner colors match your selected theme

### How It Works
When a newer version is found on GitHub:
1. An animated banner appears at the top: "🚀 Update Available! v1.x.x is ready"
2. Shows commands: `git pull` then `npm run dev`
3. Can be dismissed with ✕ button
4. Re-checks every 30 minutes

---

## [RangerChat Lite 1.3.0] - 2025-12-03 - Easy Distribution

### Summary
Complete distribution system for sharing RangerChat Lite with friends!

### New Features
- **Cross-Platform Builds**: Windows (.exe), macOS (.dmg), Linux (.AppImage, .deb)
- **GitHub Actions**: Auto-build and release on version tags
- **Install Scripts**: One-liner installers for PowerShell and Bash
- **GitHub Releases**: Pre-built binaries for easy download

### Quick Install
```powershell
# Windows
irm https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/apps/ranger-chat-lite/scripts/install.ps1 | iex

# macOS/Linux
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/apps/ranger-chat-lite/scripts/install.sh | bash
```

### Version History
| Version | Highlights |
|---------|------------|
| 1.3.1 | Update notifications - checks GitHub for new versions |
| 1.3.0 | Easy distribution - GitHub releases, install scripts |
| 1.2.1 | Live blockchain transaction viewer |
| 1.2.0 | Device-bound identity, random names, settings |
| 1.1.3 | Fixed messaging - send/receive works |
| 1.1.0 | Emoji picker, search, 4 themes |
| 1.0.0 | Initial working release |

---

## [RangerChat Lite 1.4.x] - 2025-12-03 - ROLLED BACK

**Status**: These versions were rolled back due to unresponsive UI after login.
See `apps/ranger-chat-lite/_BACKUP_v1.4.3_BROKEN/ROLLBACK_REPORT.md` for details.

Features attempted (to be reimplemented incrementally):
- Private/Direct messaging
- Message reactions
- Typing indicators
- File sharing
- User avatars

---

## [4.1.8] - 2025-12-02 - RangerChat Lite Connection Fix

See previous changelog entries for full RangerPlex history.

---

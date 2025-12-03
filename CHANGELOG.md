# RangerPlex Changelog

All notable changes to the **RangerPlex Browser** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [RangerChat Lite 1.2.0] - 2025-12-03 - Identity & Security

### Summary
Major update adding device-bound identity system for user tracking and moderation.
Users can now have fun with any display name while admins can track their real identity.

### New Features
- **Device-Bound Identity**: Unique `userId` per device using hardware fingerprint
- **Persistent Node ID**: `nodeId` survives restarts (compatible with RangerPlex)
- **Fun Username Generator**: 🎲 button generates names like "CosmicPhoenix42"
- **Settings Page**: Profile, Identity, Theme picker, Storage info, About
- **Moderation Foundation**: `userId` sent with messages for ban/warn/timeout

### Security
- Cross-platform hardware detection (Windows/Mac/Linux)
- SHA-256 fingerprinting for unique device identification
- Creates `.personal` folder compatible with RangerPlex browser
- RSA keypair generation for future message signing

### UI Changes
- Blank username on launch (was "RangerUser")
- "Choose Your Name" with 🎲 random generator button
- Identity badge for returning users
- Settings button (⚙️) in chat header
- Connect button disabled until name entered

### Version History
| Version | Highlights |
|---------|------------|
| 1.2.0 | Device-bound identity, random names, settings |
| 1.1.3 | Fixed messaging - send/receive works |
| 1.1.2 | Single theme cycle button |
| 1.1.0 | Emoji picker, search, 4 themes |
| 1.0.1 | Native menu bar with DevTools |
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

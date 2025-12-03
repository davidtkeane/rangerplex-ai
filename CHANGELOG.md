# RangerPlex Changelog

All notable changes to the **RangerPlex Browser** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [RangerChat Lite 1.1.3] - 2025-12-03 - Working Release!

### Summary
Complete rebuild of RangerChat Lite after rolling back from broken v1.4.x.
This version is stable, clean, and fully functional.

### Features
- **Emoji Picker**: 180+ emojis across 9 categories with search
- **Message Search**: Filter messages by content or sender
- **4 Themes**: Classic (blue), Matrix (green), Tron (cyan), Retro (90s Windows)
- **Native Menu Bar**: File, Edit, View, Developer, Help menus
- **Developer Tools**: Ctrl+Shift+I to open DevTools
- **Auto-scroll**: Chat scrolls to new messages
- **Clean UI**: Minimal header with search and theme cycle buttons

### Fixed in 1.1.3
- Fixed contextBridge preload error
- Added missing message handlers (peerListUpdate, chat, broadcastSent)
- Messages now send and receive properly!

### Version History
| Version | Highlights |
|---------|------------|
| 1.1.3 | Fixed messaging - send/receive works |
| 1.1.2 | Single theme cycle button |
| 1.1.1 | Cleaner login screen |
| 1.1.0 | Emoji picker, search, 4 themes |
| 1.0.1 | Native menu bar with DevTools |
| 1.0.0 | Initial working release |

### Note
Previous v1.4.x was rolled back due to UI freeze issues.
All attempted features are documented in `apps/ranger-chat-lite/_BACKUP_v1.4.3_BROKEN/`

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

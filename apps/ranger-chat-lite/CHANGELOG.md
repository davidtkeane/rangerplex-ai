# RangerChat Lite - Changelog

All notable changes to RangerChat Lite will be documented in this file.

---

## [1.1.3] - 2025-12-03 - "Message Fix"

### Fixed
- Fixed contextBridge error in preload script (was breaking console)
- Added handler for `peerListUpdate` message type (peer count updates)
- Added handler for `chat` payload type (receiving messages from other clients)
- Added handler for `broadcastSent` confirmation (no longer logs as unknown)
- Messages now properly send and receive!

---

## [1.1.2] - 2025-12-03 - "Neat Header"

### Changed
- Replaced 4 theme buttons with single cycle button
- Click theme button to cycle: Classic -> Matrix -> Tron -> Retro -> Classic...
- Header now has just 2 buttons: Search (🔍) and Theme (💬/🟢/🔵/💾)
- Cleaner, more minimal header design

---

## [1.1.1] - 2025-12-03 - "Clean Login"

### Changed
- Removed theme selector from login screen for cleaner UI
- Theme buttons now only appear in chat header after login
- Login screen is now more compact and focused

---

## [1.1.0] - 2025-12-03 - "Style & Expression"

### Added

#### Emoji Picker
- Full emoji picker with 180+ emojis across 9 categories
- Categories: Frequent, Smileys, Gestures, Hearts, Animals, Food, Activities, Travel, Symbols
- Search functionality to find emojis quickly
- Click emoji button or use picker to insert emojis into messages
- Hover animations on emoji buttons

#### Message Search
- Search bar to find messages by content or sender name
- Toggle search with magnifying glass button in header
- Real-time filtering as you type
- Shows count of matching messages
- Close button to clear search and hide bar

#### Theme System (4 Themes!)
- **Classic** - MSN Messenger inspired blue theme (default)
- **Matrix** - Green on black with scanline effect and text glow
- **Tron** - Cyan neon glow effects on dark background
- **Retro** - 90s Windows 3D button styling
- Theme selector on login screen
- Quick theme switcher in chat header
- Themes saved to localStorage (persists across sessions)

#### Auto-scroll
- Chat automatically scrolls to newest messages
- Smooth scroll animation

#### UI Improvements
- Complete redesign with MSN Messenger inspiration
- Header bar with app icon, title, and peer count badge
- Messages show sender name and timestamp
- Own messages display as "You" instead of username
- Message animation on arrival
- Gradient backgrounds on login screen
- Hover effects on all interactive elements

### Changed
- Removed custom title bar (using native Electron menu bar now)
- New login card design with better spacing
- Input fields have focus states with accent color
- Send button has hover lift effect
- Dark theme by default (Classic theme)

### Technical
- CSS variables for easy theming
- Theme-specific effects (Matrix scanlines, Tron glow, Retro 3D borders)
- Responsive emoji grid (8 columns desktop, 6 mobile)
- Proper flexbox layout with min-height: 0 for scrolling
- localStorage for theme persistence

---

## [1.0.1] - 2025-12-03 - "Menu Bar"

### Added
- Native Electron menu bar with 5 menus:
  - **File**: New Connection, Settings, Quit
  - **Edit**: Undo, Redo, Cut, Copy, Paste, Select All
  - **View**: Reload, Force Reload, Zoom controls, Fullscreen
  - **Developer**: Toggle DevTools, View Console, Inspect Element, Clear Cache
  - **Help**: About, RangerPlex Website, Report Issue
- Keyboard shortcuts for common actions (Ctrl+Shift+I for DevTools)

### Changed
- Switched from frameless to native frame for menu bar visibility
- Window size increased to 450x650
- Dark background color (#1a1a2e)

---

## [1.0.0] - 2025-12-03 - "Initial Release"

### Added
- Basic WebSocket chat functionality
- Connection to RangerPlex blockchain network
- Username and server URL configuration
- Real-time message sending and receiving
- Peer count tracking
- System messages for connection events
- Custom frameless window (removed in 1.0.1)
- Retro-inspired UI design

### Technical
- Built with Electron 29, React 18, Vite 5, TypeScript 5
- WebSocket protocol for real-time communication
- Node ID generation for unique client identification

---

## Version Summary

| Version | Date | Highlights |
|---------|------|------------|
| 1.1.3 | 2025-12-03 | Fixed messaging - send/receive now works! |
| 1.1.2 | 2025-12-03 | Single theme cycle button for cleaner header |
| 1.1.1 | 2025-12-03 | Cleaner login screen, theme buttons moved to chat header |
| 1.1.0 | 2025-12-03 | Emoji picker, message search, 4 themes (Classic/Matrix/Tron/Retro) |
| 1.0.1 | 2025-12-03 | Native menu bar with Developer tools |
| 1.0.0 | 2025-12-03 | Initial release with basic chat |

---

## Upcoming Features

See `FUTURE_PLAN.md` in the backup folder for the complete roadmap.

**Next priorities:**
- Sound notifications
- Message persistence (localStorage)
- Connection status indicator
- Reconnection on disconnect
- Desktop notifications

---

*RangerChat Lite - Lightweight chat for the RangerPlex network*

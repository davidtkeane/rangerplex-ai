# RangerChat Lite - Future Development Plan

**Last Updated:** December 3, 2025
**Current Version:** 2.0.1
**Next Release:** 2.1.0 (Target: December 2025)

---

## 📦 Distribution Plan (Priority!)

### v1.3.0 - "Easy Distribution" 📤
**Target:** December 2025
**Focus:** Make it easy to share RangerChat Lite with friends

#### Phase 1: GitHub Releases with Pre-built Binaries (RECOMMENDED)

**Why this approach:**
- Friends just download and run - no dev setup needed
- No Node.js, npm, or git required
- Works for non-technical users
- Professional distribution method

**Build Outputs:**
- [ ] `.exe` installer for Windows (NSIS or Squirrel)
- [ ] `.dmg` for macOS
- [ ] `.AppImage` for Linux
- [ ] Portable `.zip` versions for each platform

**GitHub Actions Workflow:**
- [ ] Auto-build on git tag (e.g., `v1.3.0`)
- [ ] Upload artifacts to GitHub Releases
- [ ] Generate checksums for security

**What friends need:**
1. Download the app from GitHub Releases
2. Run it (connects to YOUR RangerPlex server URL)
3. No need to install full RangerPlex or run their own node

#### Phase 2: Auto-Update System
- [ ] electron-updater integration
- [ ] Check for updates on startup
- [ ] One-click update installation
- [ ] Version mismatch warnings

#### Phase 3: Install Scripts (Optional - for power users)

**Bash Script (macOS/Linux):**
```bash
#!/bin/bash
# install-rangerchat.sh
curl -L https://github.com/davidtkeane/rangerplex-ai/releases/latest/download/RangerChat-Lite-linux.AppImage -o RangerChat
chmod +x RangerChat
./RangerChat
```

**PowerShell Script (Windows):**
```powershell
# install-rangerchat.ps1
$url = "https://github.com/davidtkeane/rangerplex-ai/releases/latest/download/RangerChat-Lite-win.exe"
Invoke-WebRequest -Uri $url -OutFile "RangerChat-Lite.exe"
Start-Process "RangerChat-Lite.exe"
```

#### Distribution Checklist
- [ ] Configure electron-builder for all platforms
- [ ] Set up code signing (optional but recommended)
- [ ] Create GitHub Actions release workflow
- [ ] Add README with download links and screenshots
- [ ] Create release notes template
- [ ] Test on fresh machines (no dev tools)

---

## 🎯 Development Philosophy

**Core Principles:**
1. **Simplicity First** - Keep the retro aesthetic and lightweight feel
2. **Reliability** - Stable connections, automatic recovery
3. **User Experience** - Smooth, intuitive, delightful
4. **Community** - Features that encourage interaction
5. **Performance** - Fast, responsive, minimal resource usage

---

## 📋 Release Roadmap

### **v1.1.0 - "Stability & Polish"** ✅ COMPLETE
**Released:** December 2025
**Focus:** Fix core UX issues, improve reliability

#### High Priority (Must-Have)
- [x] Auto-scroll to bottom when new messages arrive
- [x] Show peer count in title bar (e.g., "RangerChat Lite (3 online)")
- [x] Emoji picker with 180+ emojis across 9 categories
- [x] Message search functionality
- [x] Theme system (4 themes: Classic, Matrix, Tron, Retro)
- [x] Show "You" instead of username for own messages

#### Medium Priority (Should-Have)
- [ ] Message persistence to localStorage
- [ ] Desktop notifications (Electron Notification API)
- [ ] Connection status indicator (🟢 Connected / 🔴 Disconnected)
- [ ] Better error messages for connection failures
- [ ] "Scroll to bottom" button when scrolled up

---

### **v1.2.0 - "Identity & Security"** ✅ COMPLETE
**Released:** December 2025
**Focus:** Device-bound identity for moderation

#### Completed Features
- [x] Device-bound identity (hardware fingerprinting)
- [x] Persistent userId and nodeId across sessions
- [x] Random username generator (🎲 button)
- [x] Settings page with Profile, Identity, Theme, Storage, About sections
- [x] RangerPlex compatible identity files (.personal folder)
- [x] RSA keypair generation for future message signing
- [x] Moderation support (userId sent with every message)

---

### **v1.2.1 - "Blockchain Viewer"** ✅ COMPLETE
**Released:** December 2025
**Focus:** Visualize network transactions

#### Completed Features
- [x] Live blockchain transaction viewer in Settings
- [x] Stats dashboard (sent/received/total/bytes)
- [x] Cyberpunk UI with animated transaction cards
- [x] Color-coded transaction types (green=in, red=out, yellow=system, blue=peer)
- [x] Theme-specific styling (Matrix green glow, Tron cyan glow)

---

### **v1.3.0 - "Easy Distribution"** ✅ COMPLETE
**Released:** December 2025
**Focus:** Build and share standalone app with friends

See **Distribution Plan** section at top for full details.

#### Completed Features
- [x] Electron-builder configuration for Win/Mac/Linux
- [x] GitHub Actions workflow for auto-releases
- [x] Pre-built binaries on GitHub Releases
- [x] One-click install scripts (bash/powershell)
- [x] README with download links

---

### **v2.0.0 - "Security Foundation"** 🔐 ✅ COMPLETE
**Released:** December 2025
**Focus:** Shared identity system across all RangerBlock apps

#### Completed Features
- [x] Shared `~/.rangerblock/` storage system
- [x] Hardware-bound identity (device fingerprinting)
- [x] RSA-2048 key pairs for signing
- [x] Cross-app identity sync (RangerChat Lite ↔ blockchain-chat ↔ voice-chat)
- [x] Migration from legacy Electron userData
- [x] Clean login UI (removed badges/hints)

---

### **v2.1.0 - "Security Enhancement"** 🛡️
**Target:** December 2025
**Focus:** Advanced security and authentication

#### High Priority
- [ ] Auth server for challenge-response verification
- [ ] On-chain identity registration (blockchain)
- [ ] Message signing verification (verify sender)
- [ ] Admin dashboard (view all userIds)

#### Medium Priority
- [ ] RAIN Protocol implementation (kill switch)
- [ ] E2E message encryption (AES-256-GCM)
- [ ] Session tokens with expiry
- [ ] Identity revocation support

#### Low Priority
- [ ] Multi-device identity sync
- [ ] Identity backup/restore
- [ ] Hardware security key support (YubiKey)

---

### **v1.4.0 - "Social Features"** 👥
**Target:** January 2026
**Focus:** Enhanced communication and interaction

#### High Priority
- [ ] Private/Direct messaging (DM system)
- [ ] User avatars (generated or Gravatar)
- [ ] Message reactions (👍 ❤️ 😂 etc.)
- [ ] Typing indicators ("User is typing...")
- [ ] User status/presence (Online, Away, Busy)

#### Medium Priority
- [ ] User profiles (click username for info)
- [ ] @mentions with notifications
- [ ] User blocking/muting
- [ ] Message edit/delete (with history)
- [ ] Read receipts (optional)

#### Low Priority
- [ ] Custom emoji/reactions
- [ ] User nicknames (display names)
- [ ] Status messages ("In a meeting", etc.)
- [ ] Idle detection (auto-away after 5 min)

**Estimated Development Time:** 2-3 weeks

---

### **v1.5.0 - "Rich Media"** 🎨
**Target:** February 2026
**Focus:** File sharing and rich content

#### High Priority
- [ ] File sharing (drag & drop)
- [ ] Image previews inline
- [ ] Markdown support (bold, italic, code)
- [ ] Code syntax highlighting
- [ ] Link previews (show website title/image)

#### Medium Priority
- [ ] Voice messages (record & playback)
- [ ] GIF support via Giphy/Tenor
- [ ] Video file support
- [ ] Audio file playback
- [ ] PDF viewer

#### Low Priority
- [ ] Screen sharing (advanced)
- [ ] Collaborative whiteboard
- [ ] File download manager

**Estimated Development Time:** 3-4 weeks

---

### **v2.0.0 - "Channels & Customization"** 🚀
**Target:** March 2026
**Focus:** Multi-room support and personalization

#### High Priority
- [ ] Multi-channel/room support (#general, #random, etc.)
- [ ] Channel creation and management
- [ ] Channel switching UI (tabs or sidebar)
- [ ] Settings panel (persistent preferences)
- [ ] Theme customization (dark, light, matrix, custom)
- [ ] Keyboard shortcuts (Ctrl+K for commands)

#### Medium Priority
- [ ] Server bookmarks (save multiple servers)
- [ ] Channel search and discovery
- [ ] Channel notifications settings
- [ ] Import/export settings
- [ ] Custom CSS themes

#### Low Priority
- [ ] Slash commands (/help, /clear, /nick)
- [ ] Bot integration API
- [ ] Plugin system
- [ ] Scripting support

**Estimated Development Time:** 4-6 weeks

---

### **v2.1.0 - "Power User Features"** ⚡
**Target:** April 2026
**Focus:** Advanced features for heavy users

#### Features
- [ ] Message history export (JSON, TXT, HTML)
- [ ] Advanced search (date ranges, user filters)
- [ ] Message threads/replies
- [ ] Pinned messages
- [ ] Message bookmarks/favorites
- [ ] Multiple server accounts
- [ ] System tray integration
- [ ] Auto-start on login
- [ ] Window size/position memory
- [ ] Minimize to tray option
- [ ] Custom notification sounds
- [ ] Do Not Disturb mode
- [ ] Focus/Zen mode (hide sidebar)

**Estimated Development Time:** 3-4 weeks

---

### **v3.0.0 - "Platform Expansion"** 🌐
**Target:** TBD (2026 Q3+)
**Focus:** Cross-platform and mobile support

#### Major Features
- [ ] Mobile companion app (React Native)
- [ ] Web version (browser-based client)
- [ ] End-to-end encryption (E2E)
- [ ] Voice/video calling (WebRTC)
- [ ] Screen sharing
- [ ] Groups and communities
- [ ] Federation support (connect multiple networks)
- [ ] API for third-party clients

**Estimated Development Time:** 8-12 weeks

---

## 🔥 Quick Wins (Can Be Done Anytime)

These are small improvements that can be added in any version:

### UI Polish
- [ ] Loading spinner when connecting
- [ ] Better error styling (red badges, icons)
- [ ] Smooth animations for messages
- [ ] Message grouping (consecutive messages from same user)
- [ ] Date separators ("Today", "Yesterday")
- [ ] Unread message indicator
- [ ] Badge for new messages when window inactive

### Technical Improvements
- [ ] Error logging to file
- [ ] Crash reporting
- [ ] Performance monitoring
- [ ] Message queue for offline sending
- [ ] Heartbeat/keepalive for connection
- [ ] Better TypeScript types
- [ ] Unit tests for core functions
- [ ] E2E tests with Playwright

### Accessibility
- [ ] Screen reader support
- [ ] Keyboard navigation
- [ ] High contrast theme
- [ ] Font size adjustment
- [ ] Color blind friendly themes

---

## 🛠️ Technical Debt & Refactoring

### Code Quality
- [ ] Extract WebSocket logic to custom hook
- [ ] Create message components (reusable)
- [ ] Add PropTypes/TypeScript strict mode
- [ ] Implement React Context for state
- [ ] Add error boundaries
- [ ] Create utility functions module

### Performance
- [ ] Virtual scrolling for large message lists
- [ ] Message pagination/lazy loading
- [ ] Optimize re-renders with React.memo
- [ ] Image lazy loading
- [ ] Message caching strategy

### Infrastructure
- [ ] Add CI/CD pipeline
- [ ] Automated builds for Windows/Mac/Linux
- [ ] Auto-update mechanism
- [ ] Version checking
- [ ] Analytics (optional, privacy-friendly)

---

## 📊 Metrics & Success Criteria

### v1.1.0 Goals
- [ ] Zero crashes in 7-day test period
- [ ] Reconnection success rate > 95%
- [ ] Message delivery latency < 100ms
- [ ] App startup time < 3 seconds
- [ ] Memory usage < 200MB

### User Feedback
- [ ] Collect feedback from 10+ users
- [ ] Create feedback form/survey
- [ ] Track feature requests
- [ ] Monitor GitHub issues

---

## 🚧 Current Limitations & Considerations

### Known Constraints
1. **No Server Modification** - Client-only changes (server API is fixed)
2. **WebSocket Protocol** - Limited to text-based messages (binary for files)
3. **Electron Bundle Size** - ~150MB minimum (Chromium + Node.js)
4. **Single Channel** - Currently hardcoded to #rangers

### Future Considerations
1. **Server Updates** - May need to coordinate with RangerPlex backend team
2. **Protocol Changes** - Breaking changes require version negotiation
3. **Scalability** - Performance with 1000+ messages, 100+ users
4. **Security** - Authentication, encryption, message validation

---

## 🎨 Design System (Future)

### Themes to Implement
1. **Retro Terminal** (Current) - Green on black, monospace
2. **Dark Mode** - Modern dark UI, blue accents
3. **Light Mode** - Clean white, subtle shadows
4. **Matrix** - Falling green code aesthetic
5. **Cyberpunk** - Neon pink/purple/cyan
6. **Nord** - Popular color scheme
7. **Dracula** - Popular dark theme
8. **Custom** - User-defined colors

### UI Components Needed
- [ ] Modal system
- [ ] Dropdown menus
- [ ] Context menus (right-click)
- [ ] Toast notifications
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Tooltips

---

## 🤝 Community & Collaboration

### Open Source Preparation
- [ ] Add LICENSE file
- [ ] Add CONTRIBUTING.md
- [ ] Add CODE_OF_CONDUCT.md
- [ ] Create issue templates
- [ ] Create PR template
- [ ] Add GitHub Actions workflows

### Documentation
- [ ] API documentation
- [ ] Architecture diagrams
- [ ] Developer guide
- [ ] User guide with screenshots
- [ ] Video tutorials

---

## 💡 Innovation Ideas (Experimental)

These are ambitious ideas to explore:

### Security & Infrastructure
1. **Auth Server** - Challenge-response identity verification
2. **RAIN Protocol** - Emergency kill switch for blockchain
3. **On-Chain Registration** - Register identities to blockchain
4. **File Transfer Encryption** - E2E encrypted file sharing

### Mobile & Cross-Platform
5. **Mobile App** - React Native companion app
6. **Web Client** - Browser-based version
7. **CLI Client** - Terminal-only chat (already have blockchain-chat.cjs!)

### AI & Smart Features
8. **AI Integration** - Claude/GPT assistant in chat
9. **Translation** - Real-time message translation
10. **Voice-to-Text** - Speak messages
11. **Sentiment Analysis** - Mood indicators
12. **Smart Replies** - Suggested responses

### Voice & Media
13. **Voice Chat Improvements** - Better push-to-talk, noise cancellation
14. **Video Calling** - WebRTC integration
15. **Screen Sharing** - Share screen in chat
16. **Music Sharing** - Spotify/YouTube integration

### Fun & Social
17. **Game Integration** - Play mini-games in chat
18. **Calendar** - Schedule meetings in chat
19. **Task Management** - Create todos from messages
20. **Code Execution** - Run code snippets (sandboxed)

---

## 📅 Development Schedule

### December 2025
- Week 1: v1.1.0 development (stability features)
- Week 2: v1.1.0 testing and bug fixes
- Week 3: v1.1.0 release + documentation
- Week 4: Holiday break / minor fixes

### January 2026
- Week 1-2: v1.2.0 development (social features)
- Week 3: v1.2.0 testing
- Week 4: v1.2.0 release

### February 2026
- Week 1-3: v1.3.0 development (rich media)
- Week 4: v1.3.0 testing and release

### March 2026
- Week 1-4: v2.0.0 development (channels)

---

## 🎯 Success Vision

**By v2.0.0, RangerChat Lite should be:**

✅ Stable and reliable (99.9% uptime)
✅ Feature-rich without bloat
✅ Beautiful and delightful to use
✅ Fast and responsive
✅ Accessible to all users
✅ Well-documented
✅ Active community of users
✅ Extensible via plugins/themes

---

**Next Steps:** Start v1.1.0 development today! 🚀

Let's build something amazing! 🦅

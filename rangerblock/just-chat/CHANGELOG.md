# Changelog - RangerBlock Just-Chat

All notable changes to Just-Chat will be documented here.

---

## [1.3.0] - 2025-12-02

### Added - Private Calls & Group Voice (v2.1.0)

#### Private Calling
- **`/call <user>`**: Call specific user (e.g., `/call M3Pro`)
- **Incoming Call Alert**: Big red flashing notification + beep
- **Quick Keys**: `a` to answer, `r` to reject
- **`/answer`, `/reject`, `/hangup`**: Call management
- **30-second timeout**: Auto-cancel unanswered calls
- **Busy signal**: When user is already in call

#### Group Voice
- **`/voice`**: Join group channel (everyone hears you)
- **`/leave`**: Exit group voice
- **Join/leave notifications**: See who enters/exits

#### Voice Controls
- **`t`**: Start talking (push-to-talk)
- **`s`**: Stop talking
- **`/mute`, `/unmute`**: Audio control

#### Debug Mode
- Voice packet tracing
- Call request matching debug

### Fixed
- Nickname matching for calls
- Call notifications display

---

## [1.2.0] - 2025-12-02

### Added - Voice Chat Module

#### voice-chat.cjs v1.0.0
- **Push-to-talk Voice Chat**: Press SPACE to transmit
- **SoX Audio Integration**: Cross-platform mic/speaker support
- **David's 73→27→73 Compression**: zlib compression for bandwidth efficiency
- **Mute/Unmute**: Toggle with 'M' key
- **Peer Status Display**: See who's online and talking
- **Commands**: `/peers`, `/volume`, `/mute`, `/unmute`, `/quit`

#### COMMS_ARCHITECTURE.md
- Full documentation of unified communications system
- Module specifications for Chat, Voice, Files
- Message protocol definitions
- Security placeholder infrastructure

### Changed
- **blockchain-chat.cjs v3.0.0**: Complete rewrite
  - Fixed message receiving (proper `nodeMessage` handling)
  - Added placeholder commands: `/voice`, `/send`, `/encrypt`, `/verify`
  - Username prompt on startup
  - Improved connection status display

### Requirements
- **SoX**: Required for voice chat
  - macOS: `brew install sox`
  - Linux: `sudo apt-get install sox libsox-fmt-all`
  - Windows: `winget install sox.sox`

---

## [1.1.0] - 2025-11-30

### Added
- Interactive welcome menu when running `./just-chat.sh` without arguments
- Menu options: Install, Chat, Test, Status, Help, Exit
- Auto-refresh PATH after Node.js installation
- Search for node in common locations as fallback
- "Start chatting now?" prompt after install completion
- `-i` / `--install` flag for direct install
- Web chat client (`web-chat.html`) for mobile browsers

### Changed
- School name corrected to NCI College, Dublin
- Improved Node.js detection in chat function
- Better error messages when node not found

### Fixed
- Node.js PATH not found after fresh install on Debian/Ubuntu
- Chat function failing with "node: command not found"

---

## [1.0.0] - 2025-11-30

### Added
- Initial release
- One-click installer for RangerBlock chat client
- ASCII art banner with colors
- Progress bars and animated spinners
- Fireworks effect on completion
- Auto-detect OS (Linux/macOS)
- Auto-install Node.js if not present
- Download chat client from GitHub
- Test AWS relay connection
- Commands: -c (chat), -t (test), -u (update), -h (help), -s (status)
- Uninstall with -getoffmymachine

### Network
- AWS Relay: 44.222.101.125:5555
- Dashboard: 44.222.101.125:5556
- 24/7 uptime on AWS EC2

---

## Future Plans

- [ ] Add private messaging in terminal client
- [ ] Add file transfer support
- [x] Add voice chat integration (v1.2.0 - 2025-12-02)
- [ ] Add more relay servers (EU, US-West)
- [ ] Add encryption for messages

---

*Rangers lead the way!*

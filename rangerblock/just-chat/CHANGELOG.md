# Changelog - RangerBlock Just-Chat

All notable changes to Just-Chat will be documented here.

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
- [ ] Add voice chat integration
- [ ] Add more relay servers (EU, US-West)
- [ ] Add encryption for messages

---

*Rangers lead the way!*

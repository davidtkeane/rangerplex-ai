# 🔧 System Command Reference

This document provides a comprehensive guide to system management commands available in RangerPlex. These commands allow you to control the application, check for updates, manage services, and access settings directly from the chat interface.

---

## ⚙️ Configuration & Settings

### `/settings`
Opens the Settings Modal directly from chat.
- **Aliases**: `/open settings`
- **Access**: API keys, model preferences, theme settings, notifications
- **Auto-Save**: Settings persist to both IndexedDB and server
- **Example**: Type `/settings` in chat

**Features Available:**
- Configure API keys (Claude, Gemini, OpenAI, Perplexity, etc.)
- Model selection and preferences
- Theme customization (Light, Dark, Tron)
- Matrix Mode toggle
- Celebration effects
- Export/Import data
- Avatar management

---

## 🔄 Server Management

### `/restart` or `/restart server`
Restarts the RangerPlex proxy server.
- **Duration**: ~5-10 seconds
- **Behavior**: Server sends response, then restarts
- **PM2 Compatible**: Automatic restart with PM2 process manager
- **Auto-Reconnect**: Browser reconnects when server is back online
- **Example**: `/restart server`

**Use Cases:**
- Server becomes unresponsive
- After configuration changes
- Memory cleanup
- Troubleshooting connection issues

**Note:** If using PM2, the server will auto-restart. If running manually (`npm start`), you'll need to restart it manually.

---

## 📦 Update Management

### `/check update`
Checks GitHub for the latest RangerPlex release.
- **Aliases**: `/update check`
- **Source**: https://github.com/davidtkeane/rangerplex-ai
- **Shows**: Current version, latest version, update status
- **Changelog**: Displays what's new if update available
- **No Auth Required**: Public GitHub API access
- **Example**: `/check update`

**Response Format:**
```markdown
### 📦 RangerPlex Update Status

**Current Version:** v2.7.5
**Latest Version:** v2.7.6

✨ Update Available!

Run `/install update` to upgrade to the latest version.

**What's New:**
- Compact Sidebar Mode
- New slash commands
- Bug fixes
```

### `/install update`
Automatically installs the latest RangerPlex update from GitHub.
- **Aliases**: `/update install`
- **Process**:
  1. Pulls latest code from GitHub (`git pull origin main`)
  2. Installs dependencies (`npm install`)
  3. Restarts server automatically
- **Progress**: Check terminal for real-time output
- **Automatic Restart**: Server restarts after 2 seconds
- **Example**: `/install update`

**Requirements:**
- Git repository initialized
- Internet connection
- Write permissions to project directory
- PM2 recommended for auto-restart

**Safety:**
- Always backs up data before updating
- Preserves settings and chats (stored in database)
- Non-destructive update (only pulls new code)

---

## 📝 WordPress Management

### `/check wordpress`
Checks the status of the WordPress Docker container.
- **Aliases**: `/wordpress status`
- **Checks**: Docker container running status
- **Shows**: URL, post count, page count, WordPress version
- **Example**: `/check wordpress`

**Online Response:**
```markdown
### 📝 WordPress Status Report

✅ **Status:** Online
🌐 **URL:** http://localhost:8080
📊 **Posts:** 15
📄 **Pages:** 8
⚙️ **Version:** 6.4.2

Type `/wordpress` to open the dashboard.
```

**Offline Response:**
```markdown
### 📝 WordPress Status Report

❌ **Status:** Offline

WordPress is not currently running.

**Start WordPress:**
```bash
cd ~/your-wordpress-path
php -S localhost:8080
```
```

**Requirements:**
- Docker installed
- WordPress container named `rangerplex-wordpress`
- Container configured in Settings

---

## 🕐 Quick Access Commands

### `/study`
Opens the Study Clock / Pomodoro Timer.
- **Features**: 25-minute work sessions, breaks, custom timers
- **Keyboard Shortcuts**: Space (Play/Pause), R (Reset), M (Minimize)
- **Persistence**: Sessions saved to database
- **Example**: `/study`

### `/wordpress`
Opens the WordPress Dashboard in a modal.
- **Access**: Local WordPress environment
- **Features**: Post management, content publishing
- **Example**: `/wordpress`

### `/manual`
Opens the in-app RangerPlex Manual.
- **Features**: Interactive guide, back button, new-tab view
- **Example**: `/manual`

### `/about`
Displays information about RangerPlex and the Trinity AI system.
- **Shows**: Creator info, mission statement, support options
- **Example**: `/about`

---

## 🎯 Easter Eggs & Fun

### `canvas`
Opens the Canvas Board for digital sketching.
- **No Slash Required**: Just type `canvas` in chat
- **Example**: `canvas`

### `/deathstar`
Activates the Death Star celebration animation.
- **Imperial Theme**: Special visual effects
- **Example**: `/deathstar`

### Special Names
Typing certain names triggers easter eggs:
- `David T Keane` - Creator tribute
- `Fazal` - Team member tribute
- `Sowmya` - Team member tribute
- `Michael` - Team member tribute
- `Window 95` or `Win95` - Launches Windows 95 emulator

---

## 📊 System Information

### `/sys-info`
Displays comprehensive system diagnostics and health report.
- **Aliases**: `/sysinfo`
- **Shows**: 
  - RangerPlex version and uptime
  - Service status (Proxy, Vite, WordPress)
  - Database connection and stats
  - Recent errors (last 10)
  - Performance metrics (memory usage)
- **Example**: `/sys-info`

**Sample Output:**
```markdown
# 🎖️ RangerPlex System Report

**Version**: 2.7.7
**Uptime**: 2h 15m

## 🔧 Services

✅ **Proxy Server** (Port 3010) - RUNNING
✅ **Vite Dev Server** (Port 5173) - RUNNING
⏸️ **WordPress** (Port 8080) - STOPPED

## 💾 Database

- **Status**: ✅ Connected
- **Chat Sessions**: 42

## ✅ No Recent Errors

System is running smoothly!

## 📊 Performance

- **Memory Usage**: 125.45 MB
```

**Use Cases:**
- Quick health check
- Troubleshooting issues
- Monitoring system performance
- Checking service status
- Reviewing recent errors

---

## 💡 Pro Tips

1. **Fast Access**: Bookmark frequently-used commands for quick access
2. **Keyboard Navigation**: Most commands respond instantly
3. **Check Updates Regularly**: Type `/check update` weekly for latest features
4. **Settings Persistence**: Settings auto-save - no need to manually save
5. **Server Restart**: Only restart if experiencing issues
6. **Update Safety**: Always check changelog before installing updates

---

## 🔐 Security & Privacy

- **Local First**: All commands execute locally on your machine
- **No Telemetry**: RangerPlex doesn't send usage data
- **API Keys**: Stored encrypted in local database
- **Updates**: Pulled directly from official GitHub repository
- **Open Source**: All code visible and auditable

---

## ⚠️ Troubleshooting

### Server Won't Restart
**Symptom**: `/restart` doesn't bring server back online
**Solutions**:
- Check terminal for error messages
- Manually restart: `npm start` or `pm2 restart ecosystem.config.cjs`
- Check port 3010 isn't blocked

### Update Fails
**Symptom**: `/install update` shows error
**Solutions**:
- Check internet connection
- Verify git repository status: `git status`
- Ensure no uncommitted changes
- Check disk space
- Try manual update: `git pull && npm install`

### WordPress Status Shows Offline
**Symptom**: WordPress shows offline but it's running
**Solutions**:
- Check Docker container name: `docker ps`
- Verify container named `rangerplex-wordpress`
- Check WordPress settings in Settings Modal
- Restart Docker service

### Settings Won't Open
**Symptom**: `/settings` doesn't open modal
**Solutions**:
- Check browser console for errors (F12)
- Refresh page (Ctrl+R / Cmd+R)
- Clear browser cache
- Check for JavaScript errors

---

## 📚 Related Documentation

- **Forensics Commands**: See `help-files/forensics/COMMAND_REFERENCE.md`
- **Malware Analysis**: See `help-files/malware/` (coming soon)
- **Canvas Shortcuts**: See `help-files/canvas/CANVAS_SHORTCUTS.md`
- **Main Manual**: Type `/manual` in chat

---

## 🎖️ Command Summary

| Command | Purpose | Example |
|---------|---------|---------|
| `/settings` | Open settings | `/settings` |
| `/restart` | Restart server | `/restart server` |
| `/check update` | Check for updates | `/check update` |
| `/install update` | Install update | `/install update` |
| `/check wordpress` | WordPress status | `/check wordpress` |
| `/sys-info` | System diagnostics | `/sys-info` |
| `/study` | Open study timer | `/study` |
| `/wordpress` | Open WordPress | `/wordpress` |
| `/manual` | Open manual | `/manual` |
| `/about` | About RangerPlex | `/about` |
| `/help` | Show all commands | `/help` |

---

**Built with ❤️ by David Keane (IrishRanger) | iCanHelp Ltd**
*Transforming disabilities into superpowers - helping 1.3 billion people worldwide.*

🎖️ **Rangers lead the way!**

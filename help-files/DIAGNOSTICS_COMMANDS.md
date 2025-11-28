# 🔍 System Diagnostics & Monitoring Commands

This guide covers RangerPlex's system diagnostics, monitoring, and update management commands.

---

## 📊 System Information

### `/sys-info`

Displays a comprehensive system health report with real-time diagnostics.

**Aliases**: `/sysinfo`

**What It Shows:**
- ✅ RangerPlex version number
- ⏱️ System uptime (how long RangerPlex has been running)
- 🔧 Service status (Proxy Server, Vite Dev Server, WordPress)
- 💾 Database connection status and statistics
- ⚠️ Recent error logs (last 10 errors)
- 📊 Performance metrics (memory usage)

**Example Usage:**
```
/sys-info
```

**Sample Output:**
```markdown
# 🎖️ RangerPlex System Report

**Version**: 2.7.7
**Uptime**: 2h 15m 30s

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

**When to Use:**
- 🔍 **Quick Health Check**: Verify all services are running
- 🐛 **Troubleshooting**: Identify which service is having issues
- 📈 **Performance Monitoring**: Check memory usage
- ⚠️ **Error Review**: See recent errors and warnings
- 📊 **Status Report**: Get a snapshot of system health

**Service Status Indicators:**
- ✅ **RUNNING** - Service is active and responding
- ⏸️ **STOPPED** - Service is not currently running
- ❌ **ERROR** - Service encountered an error

---

## 🔔 Update Management

### Smart Update Notifications

RangerPlex automatically checks for updates and displays a non-intrusive notification when a new version is available.

**Features:**
- 🔔 **Automatic Detection**: Checks GitHub every hour
- 📦 **Version Info**: Shows current vs. latest version
- 📝 **Changelog Preview**: See what's new before updating
- 🛡️ **Auto-Save Protection**: Automatically saves all data before updating
- 🎨 **Theme-Aware**: Matches your current theme (Light/Dark/Tron)

**Update Notification Actions:**
- **Install Now**: One-click update installation
- **Later**: Dismiss notification (will reappear next session)
- **View on GitHub**: Open release page in browser

**What Happens During Update:**
1. 💾 All chat sessions are saved
2. ⚙️ All settings are persisted
3. ☁️ Cloud sync triggered (if enabled)
4. 📥 Latest code pulled from GitHub
5. 📦 Dependencies installed
6. 🔄 Server automatically restarts

**Manual Update Check:**
```
/check update
```

**Manual Update Install:**
```
/install update
```

---

## 📝 Error Logging System

RangerPlex includes an automatic error logging system that captures and tracks errors across all services.

**Features:**
- 📋 **Automatic Capture**: Errors are logged automatically
- 🏷️ **Categorized**: Organized by service (Database, API, etc.)
- 🎯 **Severity Levels**: Error, Warning, Info
- 📚 **Stack Traces**: Full error details preserved
- 🔄 **Limited History**: Last 100 errors kept

**Error Levels:**
- ❌ **ERROR**: Critical issues requiring attention
- ⚠️ **WARNING**: Potential problems to monitor
- ℹ️ **INFO**: Informational messages

**Viewing Errors:**
Use `/sys-info` to see the last 10 errors in the system report.

**Error Information Includes:**
- ⏰ Timestamp (when the error occurred)
- 🏷️ Service name (which component had the issue)
- 📝 Error message (what went wrong)
- 📚 Stack trace (technical details for debugging)

---

## 🔧 Service Monitoring

### Monitored Services

RangerPlex monitors the following services:

1. **Proxy Server (Port 3010)**
   - Backend API server
   - Handles all external API calls
   - Manages WordPress, code-server, and system operations

2. **Vite Dev Server (Port 5173)**
   - Frontend development server
   - Serves the React application
   - Hot module replacement (HMR)

3. **WordPress (Port 8080/8091)**
   - Docker container (port 8080)
   - PHP server (port 8091)
   - Status depends on mode selected

### Service Health Checks

Each service is checked via HTTP HEAD request to verify it's responding.

**Check Frequency:**
- On-demand via `/sys-info` command
- Automatic on app startup
- After service restarts

---

## 💡 Use Cases

### Troubleshooting Workflow

1. **Problem Detected**: Something isn't working
2. **Run Diagnostics**: Type `/sys-info`
3. **Check Services**: Identify which service is down
4. **Review Errors**: Look at recent error logs
5. **Take Action**: Restart service or check logs

### Performance Monitoring

1. **Regular Checks**: Run `/sys-info` periodically
2. **Memory Usage**: Monitor for memory leaks
3. **Service Uptime**: Track how long services have been running
4. **Error Trends**: Watch for recurring errors

### Pre-Update Verification

1. **Check System Health**: Run `/sys-info`
2. **Verify All Services**: Ensure everything is running
3. **Review Errors**: Fix any critical issues first
4. **Proceed with Update**: Install update when system is healthy

---

## 🎯 Best Practices

### Regular Monitoring

- ✅ Run `/sys-info` daily for health checks
- ✅ Review error logs weekly
- ✅ Monitor memory usage for trends
- ✅ Keep services updated

### Before Major Operations

- ✅ Check system health before updates
- ✅ Verify database connection before backups
- ✅ Ensure services are running before heavy tasks

### After Issues

- ✅ Run `/sys-info` after fixing problems
- ✅ Verify error logs are clear
- ✅ Confirm all services restarted successfully

---

## ⚠️ Common Issues

### Service Shows "STOPPED"

**Symptom**: Service status shows ⏸️ STOPPED

**Solutions:**
1. Check if service is supposed to be running
2. Restart the service manually
3. Check terminal for error messages
4. Verify port isn't blocked by firewall

### High Memory Usage

**Symptom**: Memory usage over 500 MB

**Solutions:**
1. Restart RangerPlex
2. Clear browser cache
3. Close unused tabs
4. Check for memory leaks in console

### Database Connection Failed

**Symptom**: Database shows ❌ Disconnected

**Solutions:**
1. Refresh the page
2. Check IndexedDB in browser DevTools
3. Clear browser data (Settings → Privacy)
4. Restart browser

### Recent Errors Showing

**Symptom**: Error logs in system report

**Solutions:**
1. Read error messages carefully
2. Check if errors are recurring
3. Note which service is affected
4. Report persistent errors on GitHub

---

## 🔐 Privacy & Security

- **Local Only**: All diagnostics run locally
- **No Telemetry**: Error logs stay on your machine
- **No External Calls**: System info doesn't phone home
- **User Control**: You decide when to check system info

---

## 📚 Related Commands

- `/settings` - Open settings panel
- `/restart` - Restart proxy server
- `/check update` - Check for updates manually
- `/install update` - Install updates manually
- `/help` - View all commands

---

## 🎖️ Quick Reference

| Command | Purpose | Output |
|---------|---------|--------|
| `/sys-info` | Full system report | Version, services, errors, performance |
| `/sysinfo` | Alias for `/sys-info` | Same as above |

---

**Built with ❤️ by David Keane (IrishRanger) | iCanHelp Ltd**
*Transforming disabilities into superpowers - helping 1.3 billion people worldwide.*

🎖️ **Rangers lead the way!**

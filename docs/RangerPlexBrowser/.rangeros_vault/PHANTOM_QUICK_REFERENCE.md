# 👻 RangerOS Phantom Persistence - Quick Reference

**Essential commands for phantom process survival after macOS restart**

---

## 🚀 **Most Used Commands**

```bash
# After macOS restart - restore everything
restore-rangeros

# Check what's currently running
rangeros status

# Create snapshot before restart
rangeros snapshot

# Check phantom health
rangeros phantom
```

---

## 📋 **All Commands**

### **🎮 Core Operations**
```bash
rangeros start           # Launch complete RangerOS ecosystem
rangeros restore         # Restore from phantom snapshot  
rangeros status          # Check all services
rangeros phantom         # Check phantom health
```

### **👻 Phantom Snapshots**
```bash
rangeros snapshot        # Create enhanced snapshot (with PIDs)
rangeros snapshot-info   # Show latest snapshot details  
rangeros history         # View capture history
```

### **☘️ Irish Management Team**
```bash
rangeros irish          # Check Seamus, Declan, Terry status
rangeros irish-restore  # Restore Irish managers
```

### **🔧 Advanced Restoration**
```bash
rangeros-restore quick   # Fast restore all processes
rangeros-restore smart   # Only restore missing processes
rangeros-restore analyze # Compare current vs target
```

---

## 🏗️ **Irish Management Team**

**🏠 Ground Floor**: Seamus 'Memory' O'Brien (Memory Foundation)
**🎵 1st Floor**: Declan 'Cosmic' Murphy (Entertainment Harmony)  
**🖥️ 2nd Floor**: Terry 'Terminal' Sullivan (Terminal Safety)

```bash
# Check if all three are on duty
rangeros irish
```

---

## 📊 **System Status**

**Typical RangerOS Ecosystem:**
- **~30 processes** total
- **~1.6GB memory** usage  
- **3 Irish Management daemons** (critical)
- **8-10 Chrome processes** (web interfaces)
- **6+ AI/web services** (APIs)

---

## 🔄 **Restart Workflow**

### **Before macOS Restart:**
```bash
# Optional - create fresh snapshot
rangeros snapshot
```

### **After macOS Restart:**
```bash
# Should happen automatically when you open terminal
# If not, run manually:
restore-rangeros

# Verify restoration
rangeros status
```

---

## ⚡ **Quick Troubleshooting**

### **Problem: Auto-restore didn't run**
```bash
# Check if alias exists
grep "restore-rangeros" ~/.zshrc_aliases_folder/ranger_aliases.zsh

# Run manually  
restore-rangeros
```

### **Problem: No snapshot found**
```bash
# Create one now
rangeros snapshot

# Check it exists
ls ~/.rangeros_vault/current_phantom_processes.json
```

### **Problem: Irish Management Team missing**
```bash
# Check status
rangeros irish

# Restore manually
rangeros irish-restore
```

### **Problem: Services on wrong ports**
```bash
# Check port usage
lsof -i :8000 -i :8002 -i :8003 -i :8005

# Full system status  
rangeros status
```

---

## 📁 **Important File Locations**

```bash
# Main restoration script
~/.rangeros_vault/restore_phantom_processes_enhanced.sh

# Current phantom state
~/.rangeros_vault/current_phantom_processes.json

# Snapshot history  
~/.rangeros_vault/process_snapshots/

# Irish manager logs
~/.rangeros_vault/logs/
```

---

## 🎯 **Key Ports**

- **8000**: Main web server (VLC, StreamLabs interfaces)
- **8002**: VLC Database API  
- **8003**: RangerBot Ollama AI
- **8005**: Browserpad Database
- **8085**: MCP Server API
- **8091**: WordPress
- **3001**: VLC Media Server

---

## 🏔️ **Philosophy Reminders**

- **"One foot in front of the other"** - Steady progress
- **"Come home alive"** - System stability first
- **Disabilities → Superpowers** - Accessibility-first design
- **Reduce cognitive load** - Automation supports neurodivergent users

---

## 🆘 **Emergency Recovery**

### **If everything fails:**
```bash
# Full manual launch
cd /Users/ranger/scripts/Rangers_Stuff/browser-2025/RangerOS
./launch_rangeros_v4.sh

# Then create new snapshot
rangeros snapshot
```

### **Check system health:**
```bash
# Complete diagnostic
rangeros status

# Phantom analysis
rangeros phantom

# View restoration history
rangeros history
```

---

**Quick Reference Version**: 3.0 (September 2025)  
**Author**: David Keane with Claude Code

**"The technology that never forgets - one command to restore your complete accessibility ecosystem."** 👻✨
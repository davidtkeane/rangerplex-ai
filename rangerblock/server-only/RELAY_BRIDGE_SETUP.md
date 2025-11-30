# RangerBlock Relay & Bridge Setup Guide

**Quick Reference for Running Relay Servers**
**Updated:** November 30, 2025

---

## Step 1: Install RangerBlock (One-Liner)

```bash
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-kali-relay.sh | bash
```

### Expected Output:

```
 ======================================================================
       RANGERBLOCK RELAY SERVER - ONE-CLICK INSTALLER
 ======================================================================
       🐉 P2P Blockchain Network for Security Professionals 🐉
       Created by IrishRanger + Claude Code (Ranger)
       Version 2.2.0 - Multi-Cloud Auto-Detection (8 providers!)
 ======================================================================

[1/6] Detecting environment...
  Detecting cloud provider...
  Platform: aws
  VM Type: aws-ec2
  Machine Name: AWS-Relay
  Network Mode: cloud
  IP Address: 172.31.65.91
  Gateway: 172.31.64.1

[2/6] Installing dependencies (automatic)...
  Updating package lists...
  Node.js not found - will install
  Installing Node.js 20.x + npm (this may take a minute)...
  Downloading NodeSource setup...
  Installing nodejs from NodeSource...
  ✅ Node.js installed: v20.19.5
  ✅ npm installed: 9.2.0
  ✅ git installed
  ✅ curl installed
  Installing jq...

[3/6] Setting up directory...
  ✅ Directory: /root/rangerblock-server

[4/6] Downloading server files...
  📥 relay-server-bridge.cjs
  📥 blockchain-chat.cjs
  📥 blockchain-ping.cjs
  ✅ Server files downloaded
  ✅ Node identity created: AWS-Relay-dc5658f5
  📦 Installing npm packages...
  ✅ Dependencies installed

[5/6] Skipping ngrok (use --with-ngrok to install)

[6/6] Creating helper scripts...
  ✅ Helper scripts created

 ======================================================================
                    🎉 SETUP COMPLETE! 🎉
 ======================================================================

  Machine Name: AWS-Relay
  Platform:     aws (aws-ec2)
  Install Dir:  /root/rangerblock-server

  YOUR ADDRESSES:
    Local IP:     172.31.65.91
    External IP:  44.222.101.125
    Dashboard:    http://172.31.65.91:5556

  ☁️  AWS EC2 DETECTED:
     → Security Group: Allow TCP ports 5555 and 5556 (0.0.0.0/0)
     → Free tier: t3.micro (750 hrs/month)

  🎖️ Rangers lead the way!
```

---

## Step 2: Start the Relay Server

### Go to Install Directory
```bash
cd /root/rangerblock-server
```

### Check Files Are There
```bash
ls
```

**Expected output:**
```
blockchain-chat.cjs  network-diag.sh   package.json       relay-server.cjs  start-relay.sh
blockchain-ping.cjs  node_modules      package-lock.json  relay-config.json start-chat.sh
```

### Start Relay in Background
```bash
nohup npm run relay > relay.log 2>&1 &
```

**Expected output:**
```
[1] 8250
```
(The number is the process ID - yours will be different)

### Press Enter, Then Verify It's Running
```bash
ss -tlnp | grep 555
```

**Expected output (SUCCESS!):**
```
LISTEN 0      511                *:5555             *:*    users:(("node",pid=8262,fd=21))
LISTEN 0      511                *:5556             *:*    users:(("node",pid=8262,fd=22))
```

If you see both ports 5555 and 5556 LISTENING, your relay is running!

---

## Step 3: Test Connection

### From Your Local Machine (Mac/PC)
```bash
curl http://YOUR_EXTERNAL_IP:5556/api/status
```

**Expected output:**
```json
{"status":"online","connections":0,"uptime":123}
```

### From Inside the Server
```bash
curl http://localhost:5556/api/status
```

---

## Background Job Control

| Command | What it does |
|---------|--------------|
| `jobs` | List all background jobs |
| `fg %1` | Bring job #1 to foreground |
| `Ctrl+Z` | Pause current foreground process |
| `bg %1` | Resume paused job in background |
| `kill %1` | Stop background job #1 |
| `pkill -f relay` | Kill relay by name |
| `tail -f relay.log` | Watch relay logs live |
| `cat relay.log` | View all relay logs |

### Kill a Wrong Background Job
If you started relay in wrong folder:
```bash
# Kill by job number
kill %1

# Or kill all relay processes
pkill -f relay

# Verify it's stopped
ps aux | grep relay
```

**Expected output (no relay running):**
```
root     7189  0.0  0.2   4080  2160 pts/1    S+   17:04   0:00 grep --color=auto relay
```
(Only the grep command shows - no actual relay process)

---

## 24/7 Running with PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start relay with PM2
pm2 start relay-server.cjs --name relay

# Save PM2 config
pm2 save

# Setup auto-start on boot
pm2 startup
# Copy and run the command it outputs!

# PM2 Commands
pm2 status          # Check status
pm2 logs relay      # View logs
pm2 restart relay   # Restart
pm2 stop relay      # Stop
pm2 delete relay    # Remove from PM2
```

---

## AWS Security Group Setup (REQUIRED!)

**You MUST open ports 5555 and 5556 or external connections will fail!**

### Step-by-Step:

1. **AWS Console** → EC2 → Instances
2. **Click your instance** → Security tab
3. **Click the security group link** (sg-xxxxx)
4. **Click "Edit inbound rules"**
5. **Add 2 rules:**

| Type | Port Range | Source | Description |
|------|------------|--------|-------------|
| Custom TCP | **5555** | 0.0.0.0/0 | RangerBlock Relay |
| Custom TCP | **5556** | 0.0.0.0/0 | RangerBlock Dashboard |

6. **Click "Save rules"**

### Test Ports Are Open
```bash
# From your Mac
nc -zv 44.222.101.125 5555
nc -zv 44.222.101.125 5556
```

**Expected output (SUCCESS):**
```
Connection to 44.222.101.125 port 5555 [tcp/*] succeeded!
Connection to 44.222.101.125 port 5556 [tcp/*] succeeded!
```

**If you see "Operation timed out"** - ports are NOT open in Security Group!

---

## Bridge Configuration

### File Locations
- **Mac (RangerPlex)**: `~/rangerplex-ai/rangerblock/core/relay-config.json`
- **Cloud Server**: `~/rangerblock-server/relay-config.json`

### Example relay-config.json

```json
{
  "relay": {
    "name": "my-relay-name",
    "port": 5555,
    "dashboardPort": 5556,
    "region": "aws"
  },
  "bridge": {
    "enabled": true,
    "reconnectInterval": 5000,
    "heartbeatInterval": 30000,
    "peers": [
      {
        "name": "aws-relay",
        "host": "44.222.101.125",
        "port": 5555,
        "enabled": true,
        "comment": "AWS EC2 relay server"
      }
    ]
  }
}
```

---

## Connecting from RangerPlex GUI

1. Open RangerPlex → Blockchain Chat
2. Click Settings (gear icon)
3. Select **"☁️ AWS Cloud (24/7)"** from dropdown
4. Or set custom: Host: `44.222.101.125`, Port: `5555`
5. Click Save and Reconnect

---

## Troubleshooting

### "Connection timed out" from Mac
1. Check AWS Security Group has ports 5555/5556 open
2. Check relay is running: `ss -tlnp | grep 555`
3. Verify external IP is correct

### "Port already in use"
```bash
pkill -f relay
# Wait 2 seconds, then restart
nohup npm run relay > relay.log 2>&1 &
```

### "npm not found"
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Check Relay Logs for Errors
```bash
cat relay.log
```

---

## Current Network

| Server | IP | Port | Status |
|--------|-----|------|--------|
| AWS Kali Relay | 44.222.101.125 | 5555 | Active |
| M3Pro Genesis | 192.168.1.35 | 5555 | Home Network |

---

## Quick Start Summary

```bash
# 1. Install (one-liner)
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-kali-relay.sh | bash

# 2. Start relay in background
cd /root/rangerblock-server
nohup npm run relay > relay.log 2>&1 &

# 3. Verify running
ss -tlnp | grep 555

# 4. Open AWS ports 5555 & 5556 in Security Group

# 5. Test from Mac
curl http://YOUR_IP:5556/api/status
```

---

Created by David Keane (IrishRanger) + Claude Code (Ranger)
Rangers lead the way! 🎖️

# RangerBlock Relay & Bridge Setup Guide

**Quick Reference for Running Relay Servers**

---

## AWS / Cloud Server Commands

### Start Relay (Background) + Chat

```bash
# 1. Go to install directory
cd ~/rangerblock-server

# 2. Start relay in BACKGROUND (survives disconnection)
nohup npm run relay > relay.log 2>&1 &

# 3. Press Enter to get prompt back

# 4. Run chat in foreground
npm run chat

# 5. Exit chat with Ctrl+C when done
```

### Background Job Control

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

### 24/7 Running with PM2 (Recommended)

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

## Bridge Configuration

### File Location
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
      },
      {
        "name": "home-mac",
        "host": "192.168.1.35",
        "port": 5555,
        "enabled": true,
        "comment": "Home network Mac"
      }
    ]
  }
}
```

### Adding a New Bridge Peer

Edit `relay-config.json` and add to the `peers` array:

```json
{
  "name": "new-server",
  "host": "IP_ADDRESS_HERE",
  "port": 5555,
  "enabled": true,
  "comment": "Description"
}
```

Then restart the relay to apply changes.

---

## Network Requirements

### Ports to Open

| Port | Protocol | Purpose |
|------|----------|---------|
| 5555 | TCP | WebSocket Relay |
| 5556 | TCP | HTTP Dashboard |

### Cloud Firewall Setup

**AWS EC2:**
- EC2 → Security Groups → Edit inbound rules
- Add: TCP 5555 from 0.0.0.0/0
- Add: TCP 5556 from 0.0.0.0/0

**Google Cloud:**
- VPC Network → Firewall → Create rule
- Allow TCP 5555, 5556 from 0.0.0.0/0

**Azure:**
- Network Security Group → Inbound rules
- Add rules for TCP 5555, 5556

---

## Quick Diagnostic Commands

```bash
# Check if relay is running
ps aux | grep relay

# Check listening ports
ss -tlnp | grep 555

# Test local relay
curl http://localhost:5556/api/status

# Test remote relay
curl http://REMOTE_IP:5556/api/status

# Network diagnostics
./network-diag.sh
```

---

## Connecting from RangerPlex GUI

1. Open RangerPlex → Blockchain Chat
2. Click Settings (gear icon)
3. Set Relay Host: `IP_ADDRESS`
4. Set Relay Port: `5555`
5. Click Save and Reconnect

---

## Troubleshooting

### "Connection refused"
1. Check relay is running: `ps aux | grep relay`
2. Check firewall allows port 5555
3. Check correct IP address

### "Bridge not connecting"
1. Verify both relays are running
2. Check relay-config.json has correct IPs
3. Check `enabled: true` for peers
4. Restart relay after config changes

### "npm not found"
```bash
# Reinstall Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### "Port already in use"
```bash
# Kill process on port 5555
kill $(lsof -t -i:5555)
# Or
pkill -f relay
```

---

## Current Network

| Server | IP | Port | Status |
|--------|-----|------|--------|
| AWS Relay | 44.222.101.125 | 5555 | Active |
| M3Pro Genesis | 192.168.1.35 | 5555 | Home |

---

Created by David Keane (IrishRanger) + Claude Code (Ranger)
Rangers lead the way! 🎖️

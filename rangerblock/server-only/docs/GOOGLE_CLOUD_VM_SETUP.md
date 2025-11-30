# Google Cloud VM Setup for RangerPlexBlock Relay

**Purpose:** Run a 24/7 relay server so your M3Pro doesn't need to be online all the time.

**Cost:** FREE (using Google Cloud Free Tier e2-micro VM)

---

## Step 1: Create Google Cloud Account

1. Go to https://cloud.google.com/
2. Click "Get started for free"
3. Sign in with your Google account
4. Enter billing info (won't be charged for free tier)

---

## Step 2: Create a Free VM Instance

1. Go to **Compute Engine** → **VM Instances**
2. Click **CREATE INSTANCE**
3. Configure:
   ```
   Name: rangerplex-relay
   Region: europe-west1 (or closest to you)
   Zone: europe-west1-b

   Machine type: e2-micro (FREE TIER!)

   Boot disk:
   - OS: Ubuntu 22.04 LTS
   - Size: 10GB (free tier)

   Firewall:
   ✅ Allow HTTP traffic
   ✅ Allow HTTPS traffic
   ```
4. Click **CREATE**

---

## Step 3: Open Port 5555 for WebSocket

1. Go to **VPC Network** → **Firewall**
2. Click **CREATE FIREWALL RULE**
3. Configure:
   ```
   Name: allow-rangerplex-relay
   Direction: Ingress
   Targets: All instances in the network
   Source IP ranges: 0.0.0.0/0
   Protocols and ports:
   ✅ TCP: 5555
   ```
4. Click **CREATE**

---

## Step 4: SSH into Your VM

1. In VM Instances, click **SSH** next to your VM
2. A terminal will open in your browser

---

## Step 5: Install Node.js and Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Install PM2 for process management
sudo npm install -g pm2
```

---

## Step 6: Clone and Setup RangerPlexBlock

```bash
# Clone the repo
git clone https://github.com/davidtkeane/rangerplex-ai.git
cd rangerplex-ai

# Install dependencies
npm install

# Navigate to relay server
cd rangerblock/core
```

---

## Step 7: Start the Relay Server

```bash
# Start with PM2 (keeps running after you disconnect)
pm2 start relay-server.cjs --name rangerplex-relay

# Save PM2 config to survive reboots
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs rangerplex-relay
```

---

## Step 8: Get Your VM's External IP

1. Go back to **VM Instances** in Google Cloud Console
2. Copy the **External IP** (e.g., `34.76.123.45`)

---

## Step 9: Update RangerPlexBlock Settings

In `BlockchainChat.tsx`, update the cloud preset:

```typescript
cloud: {
    name: '☁️ Cloud (24/7)',
    host: '34.76.123.45',  // Your VM's external IP
    port: 5555,
    description: 'Google Cloud VM - 24/7 uptime'
}
```

---

## Step 10: Test Connection

1. Open RangerPlex on your M3Pro
2. Go to Blockchain Chat → Settings
3. Select **☁️ Cloud** from dropdown
4. Click **Test** to verify connection
5. Connect and chat!

---

## Optional: Setup ngrok on Cloud VM

If you want a stable hostname instead of IP:

```bash
# Install ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Add your authtoken
ngrok config add-authtoken YOUR_TOKEN_HERE

# Start ngrok in background
pm2 start "ngrok tcp 5555" --name ngrok-tunnel

# Get your public URL
curl -s http://localhost:4040/api/tunnels | jq '.tunnels[0].public_url'
```

---

## Maintenance Commands

```bash
# View logs
pm2 logs rangerplex-relay

# Restart relay
pm2 restart rangerplex-relay

# Stop relay
pm2 stop rangerplex-relay

# Check status
pm2 status
```

---

## Cost Breakdown

| Resource | Free Tier Limit | Your Usage |
|----------|-----------------|------------|
| e2-micro VM | 1 per month | ✅ 1 |
| Disk | 30GB | ✅ 10GB |
| Egress | 1GB/month | ✅ ~100MB |
| **Total Cost** | | **$0/month** |

---

## Troubleshooting

### "Connection refused"
- Check firewall rule allows port 5555
- Verify relay is running: `pm2 status`

### "Cannot connect from internet"
- Make sure you're using External IP, not internal
- Check VM is running in Cloud Console

### "Relay crashes"
- Check logs: `pm2 logs rangerplex-relay`
- Restart: `pm2 restart rangerplex-relay`

---

**Created:** November 29, 2025
**Author:** David Keane (IrishRanger) + Claude Code

Rangers lead the way! 🎖️

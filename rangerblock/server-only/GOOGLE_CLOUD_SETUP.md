# Google Cloud Setup for RangerBlock Relay Server

**Created:** November 30, 2025
**Author:** David Keane (IrishRanger) + Claude Code (Ranger)

---

## Google Cloud Free Tier

### Always Free:
- **e2-micro** instance (1 shared vCPU, 1 GB RAM)
- 30 GB standard persistent disk
- Available in: Oregon, Iowa, South Carolina (us-west1, us-central1, us-east1)

### Free Trial:
- **$300 credit** for 90 days (new accounts)
- Use any instance type during trial

---

## Step-by-Step Setup

### Step 1: Create GCP Account
1. Go to [cloud.google.com](https://cloud.google.com)
2. Click "Get started for free"
3. Sign in with Google account
4. Add payment method (required, but not charged for free tier)

### Step 2: Create New VM Instance

1. **Go to Compute Engine**
   - Console → Navigation Menu → Compute Engine → VM instances

2. **Click "Create Instance"**

3. **Configure Instance:**

   | Setting | Value |
   |---------|-------|
   | Name | `rangerblock-relay` |
   | Region | `europe-west1` (Belgium) or `us-west1` (Oregon) |
   | Zone | Any available |
   | Machine Type | `e2-micro` (Free Tier) or `e2-small` |
   | Boot Disk | Debian 12, 30 GB |

4. **Firewall:**
   - [x] Allow HTTP traffic
   - [x] Allow HTTPS traffic

5. **Click "Create"**

### Step 3: Configure Firewall Rules

1. Go to **VPC Network → Firewall**
2. Click **"Create Firewall Rule"**

   | Setting | Value |
   |---------|-------|
   | Name | `rangerblock-relay` |
   | Direction | Ingress |
   | Targets | All instances |
   | Source IP ranges | `0.0.0.0/0` |
   | Protocols/ports | TCP: 5555, 5556 |

3. Click **"Create"**

### Step 4: Connect via SSH

**Option 1: Browser SSH (Easiest)**
- Click "SSH" button next to your instance

**Option 2: gcloud CLI**
```bash
# Install gcloud CLI first if needed
gcloud compute ssh rangerblock-relay --zone=YOUR_ZONE
```

**Option 3: Direct SSH**
```bash
# Add your SSH key to instance metadata first
ssh YOUR_USERNAME@EXTERNAL_IP
```

### Step 5: Install RangerBlock

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Run RangerBlock setup
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-kali-relay.sh | bash -s -- --name "GCloud-Relay"

# Start relay
cd ~/rangerblock-server
npm run relay
```

### Step 6: Keep Running with PM2

```bash
# Install PM2
npm install -g pm2

# Start relay
pm2 start relay-server.cjs --name rangerblock

# Save config
pm2 save

# Setup startup script
pm2 startup
# Copy and run the command it gives you

# Verify
pm2 status
```

---

## Converting Debian to Kali (Optional)

**WARNING:** This can break things. Use fresh Debian instead if the old one failed.

If you want Kali tools on your GCP instance:

```bash
# Add Kali repository
echo "deb http://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware" | sudo tee /etc/apt/sources.list.d/kali.list

# Add Kali keys
wget -q -O - https://archive.kali.org/archive-key.asc | sudo apt-key add -

# Update and install basic Kali tools
sudo apt update
sudo apt install -y kali-linux-headless  # Minimal tools without GUI

# OR just install specific tools
sudo apt install -y nmap metasploit-framework nikto
```

**Better Alternative:** Just use Debian with manual tool installation:
```bash
sudo apt install -y nmap hydra john hashcat aircrack-ng
```

---

## Quick Reference

### Instance Recommendations

| Use Case | Machine Type | Cost |
|----------|--------------|------|
| Free Tier | e2-micro | FREE |
| Better Performance | e2-small | ~$14/month |
| Production | e2-medium | ~$27/month |

### Regions Close to Ireland

| Region | Location | Latency |
|--------|----------|---------|
| europe-west1 | Belgium | Best |
| europe-west2 | London | Good |
| europe-west3 | Frankfurt | Good |
| europe-north1 | Finland | Okay |

### Useful gcloud Commands

```bash
# List instances
gcloud compute instances list

# Start instance
gcloud compute instances start rangerblock-relay --zone=YOUR_ZONE

# Stop instance
gcloud compute instances stop rangerblock-relay --zone=YOUR_ZONE

# SSH into instance
gcloud compute ssh rangerblock-relay --zone=YOUR_ZONE

# Get external IP
gcloud compute instances describe rangerblock-relay --zone=YOUR_ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

---

## Connect to Your GCP Relay

### Get Your External IP
1. Go to Compute Engine → VM instances
2. Copy the "External IP" column

### From RangerPlex GUI
1. Open Blockchain Chat
2. Click Settings (gear icon)
3. Add new server:
   - Host: `YOUR_GCP_EXTERNAL_IP`
   - Port: `5555`

### From Terminal
```bash
npm run blockchain:chat -- --relay YOUR_GCP_EXTERNAL_IP:5555
```

### Update relay-config.json (Bridge Mode)
```json
{
  "bridge": {
    "peers": [
      {
        "name": "gcloud-relay",
        "host": "YOUR_GCP_EXTERNAL_IP",
        "port": 5555,
        "enabled": true
      }
    ]
  }
}
```

---

## Troubleshooting

### Previous Instance Failed During Debian→Kali Upgrade

**Solution:** Create fresh instance with just Debian:
1. Delete the old instance
2. Create new e2-micro with Debian 12
3. Install only what you need:
```bash
# Just install RangerBlock (no Kali conversion)
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-kali-relay.sh | bash

# Install individual pentest tools if needed
sudo apt install nmap nikto hydra -y
```

### "Connection refused"
1. Check firewall rules allow port 5555
2. Verify relay is running: `pm2 status`
3. Check instance is started: `gcloud compute instances list`

### "Instance not starting"
1. Check billing/quota limits
2. Verify free tier eligibility (e2-micro in specific regions)

### "SSH not working"
1. Use browser SSH from console
2. Check firewall allows port 22
3. Verify SSH keys in metadata

---

## Cost Tips

1. **Use e2-micro in free regions** (us-west1, us-central1, us-east1)
2. **Stop instance when not testing** (but keeps IP)
3. **Set up billing alerts**:
   - Billing → Budgets & alerts → Create budget
   - Set to $0 or $1 to catch any unexpected charges

4. **Delete unused resources**:
   - Snapshots
   - Old disks
   - Static IPs not attached to instances ($0.01/hour!)

---

Rangers lead the way! 🎖️

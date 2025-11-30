# AWS EC2 Setup for RangerBlock Relay Server

**Created:** November 30, 2025
**Author:** David Keane (IrishRanger) + Claude Code (Ranger)

---

## AWS Free Tier (2025 Update)

### For NEW accounts (after July 15, 2025):
- **$100 credit** on sign-up + **$100 more** for using services
- **6-month free plan** (credit-based)
- Instance types: `t3.micro`, `t3.small`, `t4g.micro`, `t4g.small`
- 30 GB EBS storage (gp3)

### For LEGACY accounts (before July 15, 2025):
- **12-month free tier**
- Instance types: `t2.micro`, `t3.micro`
- 30 GB EBS storage
- 750 hours/month of EC2

---

## Step-by-Step Setup

### Step 1: Create AWS Account (if needed)
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Complete registration (credit card required but won't be charged for free tier)

### Step 2: Launch EC2 Instance

1. **Go to EC2 Dashboard**
   - AWS Console → Services → EC2

2. **Click "Launch Instance"**

3. **Configure Instance:**

   | Setting | Value |
   |---------|-------|
   | Name | `rangerblock-relay` |
   | AMI | Debian 12 or Amazon Linux 2023 |
   | Instance Type | `t3.micro` (Free Tier) |
   | Key Pair | Create new or use existing |
   | Storage | 30 GB gp3 |

4. **Network Settings:**
   - Allow SSH (port 22)
   - Click "Add security group rule" for:
     - Port 5555 (TCP) - RangerBlock Relay
     - Port 5556 (TCP) - Dashboard

5. **Launch Instance**

### Step 3: Connect via SSH

```bash
# Download your key pair (.pem file) first
chmod 400 your-key.pem

# Connect (replace with your instance's public IP)
ssh -i your-key.pem ec2-user@YOUR_PUBLIC_IP

# Or for Debian:
ssh -i your-key.pem admin@YOUR_PUBLIC_IP
```

### Step 4: Install RangerBlock

```bash
# Update system
sudo apt update && sudo apt upgrade -y  # Debian
# OR
sudo yum update -y  # Amazon Linux

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs  # Debian
# OR
sudo yum install nodejs npm -y  # Amazon Linux

# Run RangerBlock setup
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-kali-relay.sh | bash -s -- --name "AWS-Relay"

# Start relay
cd ~/rangerblock-server
npm run relay
```

### Step 5: Configure Security Group

In AWS Console → EC2 → Security Groups:

| Type | Port | Source | Description |
|------|------|--------|-------------|
| SSH | 22 | Your IP | Admin access |
| Custom TCP | 5555 | 0.0.0.0/0 | RangerBlock Relay |
| Custom TCP | 5556 | 0.0.0.0/0 | Dashboard |

### Step 6: Keep Running (Optional)

Use `screen` or `pm2` to keep the server running:

```bash
# Option 1: Screen
screen -S relay
npm run relay
# Press Ctrl+A, then D to detach

# Option 2: PM2 (recommended)
npm install -g pm2
pm2 start relay-server.cjs --name rangerblock
pm2 save
pm2 startup  # Follow instructions to start on boot
```

---

## Quick Reference

### Instance Recommendations

| Use Case | Instance | Cost |
|----------|----------|------|
| Free Tier | t3.micro | FREE (750 hrs/mo) |
| Light Use | t3.small | ~$15/month |
| Production | t3.medium | ~$30/month |

### Regions Close to Ireland

| Region | Code | Latency |
|--------|------|---------|
| Ireland | eu-west-1 | Best |
| London | eu-west-2 | Good |
| Frankfurt | eu-central-1 | Good |

### Useful Commands

```bash
# Check relay status
curl http://localhost:5556/api/status

# View logs
pm2 logs rangerblock

# Restart relay
pm2 restart rangerblock

# Stop relay
pm2 stop rangerblock
```

---

## Connect to Your AWS Relay

### From RangerPlex GUI
1. Open Blockchain Chat
2. Click Settings (gear icon)
3. Add new server:
   - Host: `YOUR_AWS_PUBLIC_IP`
   - Port: `5555`

### From Terminal
```bash
npm run blockchain:chat -- --relay YOUR_AWS_PUBLIC_IP:5555
```

### Update relay-config.json (Bridge Mode)
```json
{
  "bridge": {
    "peers": [
      {
        "name": "aws-relay",
        "host": "YOUR_AWS_PUBLIC_IP",
        "port": 5555,
        "enabled": true
      }
    ]
  }
}
```

---

## Cost Monitoring

1. Go to AWS Billing Dashboard
2. Set up Billing Alerts:
   - Budget → Create Budget → Zero spend budget
   - Get email if you exceed free tier

### Free Tier Limits (Monthly)
- 750 hours t3.micro
- 30 GB EBS storage
- 15 GB data transfer out
- 1 million Lambda requests

---

## Troubleshooting

### "Connection refused"
1. Check security group allows port 5555
2. Verify relay is running: `pm2 status`
3. Check firewall: `sudo iptables -L`

### "Instance stopped"
- Check AWS console for billing issues
- Verify you're within free tier limits

### "SSH timeout"
1. Check security group allows port 22
2. Verify instance is running
3. Check your IP hasn't changed (update security group)

---

## Alternative: AWS Lightsail

For simpler setup, try AWS Lightsail:
- $3.50/month for 512MB RAM
- Fixed pricing (no surprises)
- Easier interface

```bash
# After creating Lightsail instance:
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-kali-relay.sh | bash
```

---

## Sources

- [AWS Free Tier 2025](https://dev.to/aws-builders/whats-new-in-aws-free-tier-2025-2ba5)
- [AWS Free Tier Details](https://cloudwithalon.com/aws-free-tier-2025-whats-free-and-for-how-long)
- [EC2 Free Tier Tracking](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-free-tier-usage.html)

---

Rangers lead the way! 🎖️

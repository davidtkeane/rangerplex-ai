# 🌐 Deploy RangerBlock Relay Server

**Complete guide to deploying relay server for cross-network blockchain nodes**

## 🎯 What is the Relay Server?

The relay server acts as a **discovery hub** for RangerBlock nodes that can't directly reach each other (different networks, behind NAT, different countries).

**What it does:**
- Nodes register with relay (send their address)
- Relay broadcasts list of all nodes to everyone
- Nodes connect to each other directly via WebSocket
- Relay enables cross-network peer discovery

**What it DOESN'T do:**
- Store blockchain data
- Process transactions
- Validate blocks
- Route all traffic (only discovery, then direct connections)

## 🏗️ Deployment Options

### Option 1: DigitalOcean Droplet (Recommended)
**Cost:** $6/month
**Best for:** Production use

### Option 2: AWS EC2
**Cost:** ~$8-10/month
**Best for:** Enterprise deployments

### Option 3: Home Server
**Cost:** Free (electricity)
**Best for:** Testing, local development

## 📋 Prerequisites

- [ ] Server with public IP address
- [ ] Ubuntu 22.04 LTS (or similar Linux)
- [ ] Domain name (optional but recommended)
- [ ] Basic SSH knowledge

## 🚀 Deploy to DigitalOcean (RECOMMENDED)

### Step 1: Create Droplet

1. Go to https://www.digitalocean.com/
2. Click "Create" → "Droplets"
3. Choose:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic $6/month (1GB RAM, 25GB SSD)
   - **Datacenter:** Closest to your users
   - **Authentication:** SSH Key (more secure than password)
   - **Hostname:** `rangerblock-relay`
4. Click "Create Droplet"
5. Note your droplet's IP address (e.g., `167.99.123.45`)

**Cost:** $6/month = $72/year

### Step 2: Connect to Server

```bash
# Replace IP with your droplet's IP
ssh root@167.99.123.45
```

### Step 3: Install Node.js

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show v10.x.x
```

### Step 4: Setup Relay Server

```bash
# Create directory
mkdir -p /opt/rangerblock-relay
cd /opt/rangerblock-relay

# Create relay-server.js
cat > relay-server.js << 'EOF'
const WebSocket = require('ws');
const http = require('http');

class RelayServer {
    constructor(port = 3001) {
        this.port = port;
        this.nodes = new Map(); // nodeId -> { ws, address, lastSeen }
        this.server = http.createServer((req, res) => {
            if (req.url === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'healthy',
                    nodes: this.nodes.size,
                    uptime: process.uptime()
                }));
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        this.wss = new WebSocket.Server({ server: this.server });
        this.setupWebSocket();
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('📡 New connection from relay client');

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleMessage(ws, data);
                } catch (error) {
                    console.error('❌ Invalid message:', error.message);
                }
            });

            ws.on('close', () => {
                this.removeNode(ws);
            });

            ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error.message);
                this.removeNode(ws);
            });
        });

        // Cleanup stale nodes every 60 seconds
        setInterval(() => {
            this.cleanupStaleNodes();
        }, 60000);
    }

    handleMessage(ws, data) {
        switch (data.type) {
            case 'register':
                this.registerNode(ws, data.nodeId, data.address);
                this.broadcastNodeList();
                break;

            case 'heartbeat':
                this.updateNodeHeartbeat(data.nodeId);
                break;

            case 'request_nodes':
                this.sendNodeList(ws);
                break;

            default:
                console.log('⚠️  Unknown message type:', data.type);
        }
    }

    registerNode(ws, nodeId, address) {
        console.log(`📡 Node registered: ${nodeId}`);
        this.nodes.set(nodeId, {
            ws,
            address,
            lastSeen: Date.now()
        });

        ws.nodeId = nodeId; // Store nodeId on WebSocket for cleanup
    }

    updateNodeHeartbeat(nodeId) {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.lastSeen = Date.now();
        }
    }

    sendNodeList(ws) {
        const nodeList = Array.from(this.nodes.entries())
            .filter(([id, node]) => node.ws !== ws) // Don't send node to itself
            .map(([id, node]) => ({
                nodeId: id,
                address: node.address
            }));

        ws.send(JSON.stringify({
            type: 'node_list',
            nodes: nodeList
        }));
    }

    broadcastNodeList() {
        const nodeList = Array.from(this.nodes.entries()).map(([id, node]) => ({
            nodeId: id,
            address: node.address
        }));

        console.log(`🔄 Broadcasting ${nodeList.length} nodes to network`);

        this.nodes.forEach((node, nodeId) => {
            if (node.ws.readyState === WebSocket.OPEN) {
                // Send all nodes except itself
                const filteredList = nodeList.filter(n => n.nodeId !== nodeId);
                node.ws.send(JSON.stringify({
                    type: 'node_list',
                    nodes: filteredList
                }));
            }
        });
    }

    removeNode(ws) {
        if (ws.nodeId) {
            console.log(`📴 Node disconnected: ${ws.nodeId}`);
            this.nodes.delete(ws.nodeId);
            this.broadcastNodeList(); // Update all nodes
        }
    }

    cleanupStaleNodes() {
        const now = Date.now();
        const timeout = 120000; // 2 minutes

        let cleaned = 0;
        this.nodes.forEach((node, nodeId) => {
            if (now - node.lastSeen > timeout) {
                console.log(`🗑️  Removing stale node: ${nodeId}`);
                this.nodes.delete(nodeId);
                cleaned++;
            }
        });

        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} stale nodes`);
            this.broadcastNodeList();
        }
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🎖️ RangerBlock Relay Server`);
            console.log(`   Port: ${this.port}`);
            console.log(`   WebSocket: ws://YOUR_IP:${this.port}`);
            console.log(`   Health Check: http://YOUR_IP:${this.port}/health`);
            console.log(`🚀 Relay server online!`);
        });
    }
}

// Start relay server
const relay = new RelayServer(3001);
relay.start();
EOF

# Install dependencies
npm install ws

# Test relay server
node relay-server.js
```

You should see:
```
🎖️ RangerBlock Relay Server
   Port: 3001
   WebSocket: ws://YOUR_IP:3001
   Health Check: http://YOUR_IP:3001/health
🚀 Relay server online!
```

Press Ctrl+C to stop.

### Step 5: Install PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start relay with PM2
pm2 start relay-server.js --name rangerblock-relay

# Make PM2 start on system boot
pm2 startup systemd
# Run the command PM2 outputs

# Save PM2 process list
pm2 save

# Check status
pm2 status
```

### Step 6: Configure Firewall

```bash
# Allow SSH (port 22)
ufw allow 22/tcp

# Allow relay server (port 3001)
ufw allow 3001/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### Step 7: Setup Domain (Optional but Recommended)

1. Buy domain (e.g., `rangerblock.io` - $12/year)
2. Add A record: `relay.rangerblock.io` → `167.99.123.45`
3. Wait 5-60 minutes for DNS propagation
4. Test: `ping relay.rangerblock.io`

### Step 8: Setup SSL (HTTPS/WSS)

```bash
# Install Certbot
apt install -y certbot

# Get SSL certificate (requires domain)
certbot certonly --standalone -d relay.rangerblock.io

# Install nginx
apt install -y nginx

# Create nginx config
cat > /etc/nginx/sites-available/rangerblock-relay << 'EOF'
server {
    listen 80;
    server_name relay.rangerblock.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name relay.rangerblock.io;

    ssl_certificate /etc/letsencrypt/live/relay.rangerblock.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/relay.rangerblock.io/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/rangerblock-relay /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx

# Allow HTTPS in firewall
ufw allow 443/tcp
```

Now you can use: `wss://relay.rangerblock.io` (secure WebSocket!)

### Step 9: Test Relay Server

```bash
# From your Mac
curl http://167.99.123.45:3001/health

# Or with domain
curl https://relay.rangerblock.io/health
```

Expected output:
```json
{
  "status": "healthy",
  "nodes": 0,
  "uptime": 123.45
}
```

### Step 10: Connect Nodes to Relay

```bash
# From your Mac
cd /Users/ranger/rangerplex-ai/rangerblock

# Connect to relay
node RangerBlockNode.cjs --name MyNode --port 5000 --relay ws://167.99.123.45:3001

# Or with SSL
node RangerBlockNode.cjs --name MyNode --port 5000 --relay wss://relay.rangerblock.io
```

---

## 🔧 Maintenance

### Check Relay Status
```bash
# PM2 status
pm2 status

# PM2 logs
pm2 logs rangerblock-relay

# Check connected nodes
curl http://localhost:3001/health
```

### Restart Relay
```bash
pm2 restart rangerblock-relay
```

### Update Relay Server
```bash
cd /opt/rangerblock-relay

# Edit relay-server.js
nano relay-server.js

# Restart
pm2 restart rangerblock-relay
```

### Monitor Performance
```bash
# Install monitoring
pm2 install pm2-server-monit

# View dashboard
pm2 monit
```

---

## 📊 Scaling

### Current Setup
- **Capacity:** ~1000 concurrent nodes
- **RAM:** 1GB
- **Bandwidth:** 1TB/month

### Scale to 10,000 nodes
- **Droplet:** $18/month (4GB RAM)
- **Load Balancer:** $12/month
- **Total:** ~$30/month

### Scale to 100,000 nodes
- **Multiple relay servers** (3-5 servers)
- **Redis pub/sub** for relay coordination
- **CDN** for global distribution
- **Total:** ~$200-300/month

---

## 🛡️ Security

### Basic Security
```bash
# Change SSH port
nano /etc/ssh/sshd_config
# Change Port 22 to Port 2222
systemctl restart sshd

# Disable root login
nano /etc/ssh/sshd_config
# Set PermitRootLogin no

# Create regular user
adduser ranger
usermod -aG sudo ranger

# Setup SSH key auth only
# (copy your SSH key to ~/.ssh/authorized_keys)

# Disable password auth
nano /etc/ssh/sshd_config
# Set PasswordAuthentication no
```

### Advanced Security
- **Fail2Ban:** Block brute-force attacks
- **Rate Limiting:** Limit connections per IP
- **DDoS Protection:** CloudFlare proxy
- **Node Authentication:** Require API keys

---

## 💰 Cost Breakdown

### DigitalOcean Setup
- **Droplet:** $6/month
- **Domain:** $12/year ($1/month)
- **SSL:** Free (Let's Encrypt)
- **Total:** ~$7/month = $84/year

### AWS Setup
- **EC2 t3.micro:** $8.50/month
- **Data Transfer:** ~$2/month
- **Domain:** $12/year
- **Total:** ~$11/month = $142/year

### Home Server Setup
- **Hardware:** $0 (use old laptop/PC)
- **Electricity:** ~$2/month
- **Dynamic DNS:** Free (DuckDNS)
- **Total:** ~$24/year

---

## 🧪 Testing Checklist

After deployment, test:

- [ ] Health check returns 200 OK
- [ ] Node can register with relay
- [ ] Node list broadcasts to connected nodes
- [ ] Nodes discover each other via relay
- [ ] Transactions propagate across relay nodes
- [ ] SSL certificate works (if using HTTPS)
- [ ] Relay survives node disconnections
- [ ] Stale nodes cleaned up after 2 minutes
- [ ] PM2 restarts relay on crash
- [ ] Relay starts on server reboot

---

## 📚 Next Steps

After relay is deployed:
1. Update RangerPlex settings to use relay URL
2. Test cross-network connections (home → office)
3. Test multi-machine blockchain (M1Air + M4Max)
4. Monitor relay performance
5. Setup backup relay server (redundancy)

---

## 🆘 Troubleshooting

### Relay won't start
```bash
# Check port 3001 is free
lsof -i :3001

# Check PM2 logs
pm2 logs rangerblock-relay --lines 50
```

### Nodes can't connect to relay
```bash
# Check firewall
ufw status

# Check relay is listening
netstat -tlnp | grep 3001

# Test WebSocket connection
npm install -g wscat
wscat -c ws://your-ip:3001
```

### SSL certificate issues
```bash
# Renew certificate
certbot renew

# Check certificate
certbot certificates

# Test SSL
curl https://relay.rangerblock.io/health
```

### High CPU usage
```bash
# Check node count
curl http://localhost:3001/health

# If >1000 nodes, upgrade droplet or implement rate limiting
```

---

## 🎖️ Production Checklist

Before going live:

- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] PM2 auto-restart enabled
- [ ] Monitoring setup (PM2 or external)
- [ ] Backup relay server deployed
- [ ] Rate limiting implemented
- [ ] Health check alerts configured
- [ ] Domain DNS configured
- [ ] Documentation updated with relay URL
- [ ] Test all network modes (local/hybrid/global)

Rangers lead the way! 🎖️

# RangerBlock Network Topology Guide

## How Everything Connects 🌐

```
                            ☁️ INTERNET ☁️
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  🇮🇪 NGROK       │    │  ☁️ GOOGLE CLOUD │    │  ☁️ AWS         │
│  Ireland Tunnel │    │  Kali Server    │    │  (Future)       │
│  2.tcp.eu.ngrok │    │  34.26.30.249   │    │                 │
│  :12232         │    │  :5555          │    │                 │
└────────┬────────┘    └────────┬────────┘    └─────────────────┘
         │                      │
         │    BRIDGED PEERS     │
         │◄────────────────────►│
         │                      │
         ▼                      ▼
    ┌─────────────────────────────────────────┐
    │             🏠 HOME NETWORK              │
    │                192.168.x.x               │
    │                                          │
    │  ┌─────────────┐    ┌─────────────┐     │
    │  │ 💻 M3 Pro   │◄──►│ 💻 M4 Max   │     │
    │  │ Genesis     │    │ Beast Mode  │     │
    │  │ :5555       │    │ :5555       │     │
    │  └──────┬──────┘    └──────┬──────┘     │
    │         │                  │             │
    │         │    LOCAL MESH    │             │
    │         │◄────────────────►│             │
    │         │                  │             │
    │         ▼                  ▼             │
    │  ┌─────────────────────────────────┐    │
    │  │        🐉 KALI VM (UTM)         │    │
    │  │  Bridged Mode: 192.168.x.x      │    │
    │  │  NAT Mode: 10.0.2.x (isolated)  │    │
    │  │  :5555 relay + :5556 dashboard  │    │
    │  └─────────────────────────────────┘    │
    │                                          │
    └──────────────────────────────────────────┘
```

## Network Modes Explained

### 1. Bridged Mode (RECOMMENDED) ✅
```
Host Machine ◄───► Kali VM ◄───► Other Network Devices
     │                │
     └────────────────┴──────► Same IP Range (192.168.x.x)
```
- VM gets its own IP on the same network as host
- Can communicate directly with all devices
- Other machines can connect TO the VM
- **Best for RangerBlock**

**UTM Setup:**
1. UTM → Select VM → Settings → Network
2. Mode: Bridged
3. Interface: en0 (or your active interface)

**VMware Setup:**
1. VM Settings → Network Adapter
2. Select: Bridged (connect directly to network)

### 2. NAT Mode ⚠️
```
Host Machine ◄───► NAT Gateway ◄───► Kali VM
     │                              │
   192.168.x.x                   10.0.2.x (isolated)
```
- VM gets isolated IP (usually 10.0.2.x)
- VM can reach OUT but not receive connections IN
- **Need ngrok or port forwarding**

**Solutions for NAT:**
- Use ngrok: `ngrok tcp 5555`
- Configure port forwarding in VM software
- Switch to Bridged mode

### 3. Host-Only Mode 🔒
```
Host Machine ◄───► Kali VM
     │                │
   Direct connection only
```
- Only host and VM can communicate
- No internet access from VM
- **Good for isolated testing**

## Connection Flows

### Scenario 1: Full Network (Your Setup)
```
M3Pro (RangerPlex) → ngrok tunnel → Internet
        ↓
     Kali VM (bridged) connects to M3Pro AND ngrok
        ↓
   Google Cloud relay also connected
        ↓
   ALL NODES CAN COMMUNICATE!
```

### Scenario 2: Kali VM Testing Malware
```
M3Pro (RangerPlex) running
        ↓
   Kali VM (bridged) with malware lab
        ↓
   Send malware samples via RangerBlock chat
        ↓
   Analyze on Kali, share results back
```

### Scenario 3: Penetration Testing
```
Kali VM running nmap/metasploit
        ↓
   Results saved to .rangerblock file
        ↓
   Share via RangerBlock to M4 Max
        ↓
   Team collaboration in real-time!
```

## Quick Setup Commands

### On Kali VM:
```bash
# One-liner install
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-kali-relay.sh | bash

# With ngrok
curl -fsSL ... | bash -s -- --with-ngrok --ngrok-token YOUR_TOKEN

# Custom name
curl -fsSL ... | bash -s -- --name "KaliPentest"
```

### On Mac (Host):
```bash
# Start relay on M3Pro/M4Max
cd ~/rangerplex-ai
npm run blockchain:relay-bridge
```

### Test Connectivity:
```bash
# From Kali VM
./network-diag.sh

# Or manually
nc -zv 192.168.1.x 5555  # Host machine
nc -zv 34.26.30.249 5555  # Google Cloud
nc -zv 2.tcp.eu.ngrok.io 12232  # ngrok tunnel
```

## Port Reference

| Port | Service | Protocol |
|------|---------|----------|
| 5555 | Relay WebSocket | TCP |
| 5556 | Dashboard HTTP | TCP |
| 5005 | UDP Discovery | UDP |

## Troubleshooting

### VM can't connect to host
1. Check network mode (should be Bridged)
2. Verify host is running relay: `lsof -i :5555`
3. Check firewall: `sudo ufw allow 5555`

### VM can't reach internet
1. Check DNS: `ping 8.8.8.8`
2. Check gateway: `ip route`
3. Try NAT mode if bridged fails

### Other nodes can't reach VM
1. VM must be in Bridged mode
2. Or use ngrok: `ngrok tcp 5555`
3. Share ngrok URL with peers

## Network Security Notes (For Master's Thesis!)

The RangerBlock network is designed for:
- **Secure file transfer** between pentest machines
- **Encrypted chat** for team coordination
- **Evidence chain** with blockchain timestamping
- **Isolated malware analysis** (Kali VM)

Best practices:
1. Keep malware analysis in isolated VMs
2. Use Host-Only mode for dangerous tests
3. Share results, not live malware, over network
4. Document all transfers in blockchain

---

Created by David Keane (IrishRanger) + Claude Code (Ranger)
Rangers lead the way! 🎖️

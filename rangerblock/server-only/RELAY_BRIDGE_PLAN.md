# RangerBlock Relay Bridge Architecture

**Created:** November 30, 2025
**Author:** David Keane (IrishRanger) + Claude Code (Ranger)
**Status:** PLANNED

---

## The Vision

Multiple relay servers that communicate with each other, creating a **mesh network** of P2P blockchain relays.

```
                         INTERNET
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
  │ ngrok Relay │◄──►│ Cloud Relay │◄──►│ Future EU   │
  │  M3Pro:5555 │    │ 34.26.30.249│    │   Relay     │
  │  (Ireland)  │    │  (US-East)  │    │ (Frankfurt) │
  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
         │                  │                  │
    Local Peers         Web Peers         EU Peers
    M1Air, M4Max       Anyone online      Future users
```

---

## How Bridge Works

### 1. Relay Registration
Each relay registers with known peers on startup:

```javascript
const KNOWN_RELAYS = [
    { host: '2.tcp.eu.ngrok.io', port: 12232, name: 'ngrok-ireland' },
    { host: '34.26.30.249', port: 5555, name: 'gcloud-us-east' }
];

// On startup, connect to other relays
KNOWN_RELAYS.forEach(relay => {
    connectToPeerRelay(relay);
});
```

### 2. Message Forwarding
When a message arrives, relay checks if recipient is:
- **Local**: Deliver directly
- **Remote**: Forward to appropriate bridge relay

```javascript
function routeMessage(message) {
    const recipient = findPeer(message.to);

    if (recipient.isLocal) {
        // Deliver to local WebSocket
        recipient.ws.send(message);
    } else {
        // Forward to bridge relay that has this peer
        const bridgeRelay = findRelayWithPeer(message.to);
        bridgeRelay.forward(message);
    }
}
```

### 3. Peer Discovery Across Relays
Relays share their peer lists:

```javascript
// Broadcast peer list to bridge relays every 30 seconds
setInterval(() => {
    bridgeRelays.forEach(relay => {
        relay.send({
            type: 'peer_sync',
            peers: getLocalPeerList()
        });
    });
}, 30000);
```

---

## Benefits

| Benefit | Description |
|---------|-------------|
| **Redundancy** | If ngrok dies, users connect to Cloud VM |
| **Load Balancing** | Distribute users across relays |
| **Geographic** | Users connect to closest relay |
| **Decentralization** | No single point of failure |
| **Scalability** | Add relays as network grows |

---

## Implementation Phases

### Phase 1: Manual Bridge (NOW)
- Two relays running independently
- Users manually choose which relay to connect to
- **Status: READY TO TEST**

### Phase 2: Relay-to-Relay Communication
- Relays connect to each other via WebSocket
- Share peer lists
- Forward messages between relays
- **Estimated: 2-3 hours development**

### Phase 3: Auto-Discovery
- Relays broadcast presence via DHT or known seed list
- New relays auto-join the network
- Dynamic routing based on latency
- **Estimated: Future enhancement**

---

## New Repo Structure: `rangerblock-server`

Minimal, standalone relay server:

```
rangerblock-server/
├── relay-server.cjs        # Main relay with bridge support
├── blockchain-chat.cjs     # Terminal chat client
├── blockchain-ping.cjs     # Connectivity test
├── bridge-connector.cjs    # Bridge to other relays (Phase 2)
├── package.json            # Minimal dependencies
├── setup.sh                # One-command installer
├── config.json             # Relay configuration
└── README.md               # Documentation
```

### package.json (Minimal)
```json
{
  "name": "rangerblock-server",
  "version": "1.0.0",
  "scripts": {
    "relay": "node relay-server.cjs",
    "chat": "node blockchain-chat.cjs",
    "bridge": "node bridge-connector.cjs"
  },
  "dependencies": {
    "ws": "^8.14.2",
    "uuid": "^9.0.0"
  }
}
```

---

## Quick Commands

### On VM (Cloud Relay)
```bash
# One-line install
curl -sSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-cloud-relay.sh | bash

# Or manual
git clone https://github.com/davidtkeane/rangerblock-server.git
cd rangerblock-server
npm install
npm run relay
```

### Test Connection
```bash
# From M3Pro, test cloud relay
node rangerblock/core/blockchain-ping.cjs --relay 34.26.30.249:5555

# From anywhere, test ngrok relay
node blockchain-ping.cjs --relay 2.tcp.eu.ngrok.io:12232
```

---

## Configuration File (config.json)

```json
{
  "relay": {
    "port": 5555,
    "name": "gcloud-us-east",
    "region": "us-east1"
  },
  "bridge": {
    "enabled": true,
    "peers": [
      {
        "host": "2.tcp.eu.ngrok.io",
        "port": 12232,
        "name": "ngrok-ireland"
      }
    ]
  },
  "dashboard": {
    "enabled": true,
    "port": 5556
  }
}
```

---

## Next Steps

1. **NOW**: Run setup script on Cloud VM
2. **NOW**: Create firewall rule for port 5555
3. **NOW**: Test connection from M3Pro
4. **LATER**: Add bridge connector code
5. **LATER**: Create separate GitHub repo

---

Rangers lead the way! 🎖️

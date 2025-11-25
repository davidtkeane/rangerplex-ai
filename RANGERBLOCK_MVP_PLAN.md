# 🎖️ RangerBlock MVP Implementation Plan

**Mission:** Get RangerBlock running with network traffic monitoring and account management  
**Goal:** Enable file/video sending across M1/M3/M4 network

---

## 🎯 PHASE 1: GET RANGERBLOCK RUNNING (2-3 hours)

### **Step 1.1: Start RangerChain Services**

**On M3 Pro (Genesis Node):**
```bash
cd "/Users/ranger/Local Sites/rangerplex-ai/rangerblock"
bash START_RANGERBLOCKCORE.sh
```

**Services Started:**
- ✅ Real-Time Dashboard (port 8889)
- ✅ Database Viewer (port 8887)
- ✅ File Browser (port 8893)
- ✅ Network Discovery (port 9998)
- ✅ HTML Console (port 8890)
- ✅ Chat Server (port 8895)
- ✅ Web Chat Bridge (port 8891)

### **Step 1.2: Verify Services Running**

```bash
# Check all ports are active
lsof -i :8889  # Dashboard
lsof -i :8887  # Database
lsof -i :8893  # File Browser
lsof -i :9998  # Network Discovery
```

**Test URLs:**
- http://localhost:8889/ - Dashboard
- http://localhost:8887/ - Database
- http://localhost:8893/ - File Browser
- http://localhost:8890/ - Console

---

## 🎯 PHASE 2: NETWORK TRAFFIC PAGE (4-6 hours)

### **Step 2.1: Create Network Monitor Component**

**File:** `components/RangerBlockNetworkMonitor.tsx`

**Features:**
- 📊 Live network traffic visualization
- 🌐 Connected nodes (M1, M3, M4)
- 📡 Real-time packet monitoring
- 📈 Bandwidth usage charts
- 🔄 Connection status indicators

**Implementation:**
```typescript
// components/RangerBlockNetworkMonitor.tsx
import React, { useState, useEffect } from 'react';

interface NetworkNode {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline';
  lastSeen: string;
}

interface NetworkTraffic {
  timestamp: string;
  source: string;
  destination: string;
  type: string;
  size: number;
}

export const RangerBlockNetworkMonitor = () => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [traffic, setTraffic] = useState<NetworkTraffic[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Poll network status every 5 seconds
    const interval = setInterval(async () => {
      const response = await fetch('/api/rangerblock/network/status');
      const data = await response.json();
      setNodes(data.nodes);
      setTraffic(data.recentTraffic);
      setIsConnected(data.connected);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rangerblock-network-monitor">
      <h2>🌐 RangerBlock Network Monitor</h2>
      
      {/* Connection Status */}
      <div className="connection-status">
        <span className={isConnected ? 'online' : 'offline'}>
          {isConnected ? '🟢 Connected' : '🔴 Offline'}
        </span>
      </div>

      {/* Node List */}
      <div className="nodes-list">
        <h3>📡 Network Nodes</h3>
        {nodes.map(node => (
          <div key={node.id} className="node-card">
            <span className={`status ${node.status}`}>
              {node.status === 'online' ? '🟢' : '🔴'}
            </span>
            <strong>{node.name}</strong>
            <span>{node.ip}</span>
            <small>Last seen: {node.lastSeen}</small>
          </div>
        ))}
      </div>

      {/* Traffic Monitor */}
      <div className="traffic-monitor">
        <h3>📊 Live Traffic</h3>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>From</th>
              <th>To</th>
              <th>Type</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            {traffic.map((t, i) => (
              <tr key={i}>
                <td>{t.timestamp}</td>
                <td>{t.source}</td>
                <td>{t.destination}</td>
                <td>{t.type}</td>
                <td>{t.size} bytes</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

### **Step 2.2: Add API Endpoints**

**File:** `proxy_server.js`

```javascript
// RangerBlock Network API
app.get('/api/rangerblock/network/status', async (req, res) => {
  try {
    // Fetch from RangerChain Network Discovery (port 9998)
    const response = await fetch('http://localhost:9998/api/network/status');
    const data = await response.json();
    
    res.json({
      connected: true,
      nodes: data.nodes || [],
      recentTraffic: data.traffic || []
    });
  } catch (error) {
    res.json({
      connected: false,
      nodes: [],
      recentTraffic: []
    });
  }
});
```

---

## 🎯 PHASE 3: ACCOUNT MANAGEMENT (4-6 hours)

### **Step 3.1: Account Detection Service**

**File:** `services/rangerblock-account.js`

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class RangerBlockAccount {
  constructor() {
    this.accountsPath = path.join(__dirname, '../rangerblock/M3Pro-Genesis/data');
  }

  // Detect current machine's hardware serial
  detectHardwareSerial() {
    try {
      // macOS: Get hardware UUID
      const serial = execSync('system_profiler SPHardwareDataType | grep "Hardware UUID"')
        .toString()
        .split(':')[1]
        .trim();
      return serial;
    } catch (error) {
      console.error('Failed to detect hardware serial:', error);
      return null;
    }
  }

  // Find account by hardware serial
  findAccount(hardwareSerial) {
    try {
      const blockchainPath = path.join(this.accountsPath, 'genesis_blockchain.json');
      const blockchain = JSON.parse(fs.readFileSync(blockchainPath, 'utf8'));

      // Search blockchain for matching hardware serial
      for (const block of blockchain.chain) {
        for (const tx of block.transactions) {
          if (tx.hardware_serial === hardwareSerial) {
            return {
              nodeId: tx.node_id,
              nodeName: tx.node_name,
              nodeType: tx.node_type,
              ipAddress: tx.ip_address,
              hardwareSerial: tx.hardware_serial,
              blockNumber: block.block_number,
              registered: true
            };
          }
        }
      }

      return null; // Not found
    } catch (error) {
      console.error('Failed to find account:', error);
      return null;
    }
  }

  // Create new account
  async createAccount(nodeName, nodeType = 'peer') {
    const hardwareSerial = this.detectHardwareSerial();
    
    if (!hardwareSerial) {
      throw new Error('Failed to detect hardware serial');
    }

    // Call RangerChain registration API
    const response = await fetch('http://localhost:8890/api/register-node', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        node_name: nodeName,
        node_type: nodeType,
        hardware_serial: hardwareSerial
      })
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    return await response.json();
  }

  // Get current account
  getCurrentAccount() {
    const hardwareSerial = this.detectHardwareSerial();
    
    if (!hardwareSerial) {
      return { found: false, serial: null };
    }

    const account = this.findAccount(hardwareSerial);
    
    return {
      found: !!account,
      serial: hardwareSerial,
      account: account
    };
  }
}

module.exports = new RangerBlockAccount();
```

### **Step 3.2: Account Management UI**

**File:** `components/RangerBlockAccountManager.tsx`

```typescript
import React, { useState, useEffect } from 'react';

interface Account {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  ipAddress: string;
  hardwareSerial: string;
  registered: boolean;
}

export const RangerBlockAccountManager = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [nodeName, setNodeName] = useState('');

  useEffect(() => {
    checkAccount();
  }, []);

  const checkAccount = async () => {
    setLoading(true);
    const response = await fetch('/api/rangerblock/account/current');
    const data = await response.json();
    
    if (data.found) {
      setAccount(data.account);
    }
    setLoading(false);
  };

  const createAccount = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/rangerblock/account/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeName: nodeName,
          nodeType: 'peer'
        })
      });

      const data = await response.json();
      setAccount(data.account);
      alert('✅ Account created successfully!');
    } catch (error) {
      alert('❌ Failed to create account: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div>🔄 Checking for account...</div>;
  }

  if (account) {
    return (
      <div className="rangerblock-account">
        <h2>✅ Account Found</h2>
        <div className="account-details">
          <p><strong>Node Name:</strong> {account.nodeName}</p>
          <p><strong>Node ID:</strong> {account.nodeId}</p>
          <p><strong>Type:</strong> {account.nodeType}</p>
          <p><strong>IP Address:</strong> {account.ipAddress}</p>
          <p><strong>Hardware Serial:</strong> {account.hardwareSerial.substring(0, 16)}...</p>
          <p><strong>Status:</strong> <span className="online">🟢 Registered</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="rangerblock-account-create">
      <h2>⚠️ No Account Found</h2>
      <p>This machine is not registered on the RangerBlock network.</p>
      
      <div className="create-form">
        <label>Node Name:</label>
        <input
          type="text"
          value={nodeName}
          onChange={e => setNodeName(e.target.value)}
          placeholder="e.g., M4 Max Node"
        />
        
        <button onClick={createAccount} disabled={!nodeName || creating}>
          {creating ? '🔄 Creating...' : '✅ Create Account'}
        </button>
      </div>
    </div>
  );
};
```

### **Step 3.3: Add Account API Endpoints**

```javascript
// proxy_server.js

const rangerBlockAccount = require('./services/rangerblock-account');

// Get current account
app.get('/api/rangerblock/account/current', (req, res) => {
  const result = rangerBlockAccount.getCurrentAccount();
  res.json(result);
});

// Create new account
app.post('/api/rangerblock/account/create', async (req, res) => {
  try {
    const { nodeName, nodeType } = req.body;
    const account = await rangerBlockAccount.createAccount(nodeName, nodeType);
    res.json({ success: true, account });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## 🎯 PHASE 4: FILE SENDING (2-3 hours)

### **Step 4.1: File Send Component**

**File:** `components/RangerBlockFileSender.tsx`

```typescript
export const RangerBlockFileSender = () => {
  const [file, setFile] = useState<File | null>(null);
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);

  const sendFile = async () => {
    if (!file || !recipient) return;

    setSending(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('recipient', recipient);

    try {
      const response = await fetch('/api/rangerblock/send', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      alert(`✅ File sent to ${recipient}!`);
    } catch (error) {
      alert('❌ Send failed: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="file-sender">
      <h3>📤 Send File</h3>
      
      <input
        type="file"
        onChange={e => setFile(e.target.files?.[0] || null)}
      />
      
      <select value={recipient} onChange={e => setRecipient(e.target.value)}>
        <option value="">Select recipient...</option>
        <option value="m1air">M1 Air</option>
        <option value="m3pro">M3 Pro</option>
        <option value="m4max">M4 Max</option>
      </select>
      
      <button onClick={sendFile} disabled={!file || !recipient || sending}>
        {sending ? '📤 Sending...' : '📤 Send File'}
      </button>
    </div>
  );
};
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 1: Get RangerBlock Running** ✅
- [ ] Start RangerChain services on M3 Pro
- [ ] Verify all ports are active
- [ ] Test web interfaces
- [ ] Confirm network discovery working

### **Phase 2: Network Traffic Page** 🔄
- [ ] Create `RangerBlockNetworkMonitor.tsx`
- [ ] Add `/api/rangerblock/network/status` endpoint
- [ ] Implement live traffic polling
- [ ] Add node status indicators
- [ ] Create traffic visualization

### **Phase 3: Account Management** 🔄
- [ ] Create `rangerblock-account.js` service
- [ ] Implement hardware serial detection
- [ ] Add account lookup from blockchain
- [ ] Create `RangerBlockAccountManager.tsx`
- [ ] Add account creation flow
- [ ] Add API endpoints for accounts

### **Phase 4: File Sending** 🔄
- [ ] Create `RangerBlockFileSender.tsx`
- [ ] Add file upload handling
- [ ] Implement recipient selection
- [ ] Add `/api/rangerblock/send` endpoint
- [ ] Test file transfer M3 → M1

---

## 🚀 QUICK START (First 2 Hours)

1. **Start RangerBlock Services** (10 min)
   ```bash
   cd rangerblock
   bash START_RANGERBLOCKCORE.sh
   ```

2. **Create Account Service** (30 min)
   - `services/rangerblock-account.js`
   - Hardware detection
   - Account lookup

3. **Add Account API** (20 min)
   - `/api/rangerblock/account/current`
   - Test with curl

4. **Create Basic UI** (1 hour)
   - Account manager component
   - Network status display
   - Add to RangerPlex

---

## 🎯 SUCCESS CRITERIA

**MVP Complete When:**
- ✅ RangerBlock services running
- ✅ Network traffic visible in RangerPlex
- ✅ Account detected or created
- ✅ Can send files between nodes

---

**Rangers lead the way!** 🎖️

# Option B: Local SQLite Sync Server

## 🎖️ OVERVIEW

Build a Node.js server with SQLite database to enable 4-layer backup system with local sync across devices on the same network.

**Estimated Time:** 2-3 hours
**Difficulty:** ⭐⭐⭐ Intermediate
**Dependencies:** Node.js, SQLite3, WebSocket

---

## 📋 WHAT YOU'LL BUILD

A complete sync server (`sync_server.js`) that:
- ✅ Runs alongside your proxy server
- ✅ Stores all chats + settings in SQLite database
- ✅ Provides WebSocket for real-time sync
- ✅ Exposes REST API for data operations
- ✅ Syncs across multiple devices on same network
- ✅ Works 100% offline (no cloud needed!)

---

## 🏗️ ARCHITECTURE

```
Browser (IndexedDB) ✅ Already Working
    ↕ WebSocket + REST API
Local Sync Server (sync_server.js) 🔨 Build This
    ↕ SQL Queries
SQLite Database (rangerplex.db) 🔨 Auto-created
```

---

## 📦 DEPENDENCIES TO INSTALL

```bash
cd "/Users/ranger/Local Sites/rangerplex-ai"

npm install --save \
  ws \
  better-sqlite3 \
  express \
  cors \
  body-parser
```

**What each does:**
- `ws` - WebSocket server for real-time sync
- `better-sqlite3` - Fast SQLite database (synchronous API)
- `express` - Web server framework (already have this!)
- `cors` - Enable cross-origin requests (already have this!)
- `body-parser` - Parse JSON request bodies

---

## 🛠️ FILE TO CREATE

**Location:** `/Users/ranger/Local Sites/rangerplex-ai/sync_server.js`

**Full Implementation:**

```javascript
// sync_server.js - RangerPlex Local Sync Server
// Provides SQLite database + WebSocket sync

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const Database = require('better-sqlite3');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3011; // Different from proxy (3010)
const WS_PORT = 3012;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Initialize SQLite Database
const db = new Database('rangerplex.db');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    title TEXT,
    model TEXT,
    messages TEXT,
    knowledgeBase TEXT,
    updatedAt INTEGER,
    isStarred INTEGER
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_chats_updated ON chats(updatedAt DESC);
`);

console.log('✅ SQLite database initialized');

// ============================================
// REST API ENDPOINTS
// ============================================

// GET /api/chats - Get all chats
app.get('/api/chats', (req, res) => {
  try {
    const chats = db.prepare('SELECT * FROM chats ORDER BY updatedAt DESC').all();
    const parsed = chats.map(chat => ({
      ...chat,
      messages: JSON.parse(chat.messages || '[]'),
      knowledgeBase: JSON.parse(chat.knowledgeBase || '[]'),
      isStarred: !!chat.isStarred
    }));
    res.json(parsed);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/chat - Save/update a chat
app.post('/api/sync/chat', (req, res) => {
  try {
    const chat = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO chats (id, title, model, messages, knowledgeBase, updatedAt, isStarred)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      chat.id,
      chat.title,
      chat.model,
      JSON.stringify(chat.messages || []),
      JSON.stringify(chat.knowledgeBase || []),
      chat.updatedAt || Date.now(),
      chat.isStarred ? 1 : 0
    );

    // Broadcast to all connected WebSocket clients
    broadcastToClients({ type: 'chat_updated', chatId: chat.id });

    res.json({ success: true, chatId: chat.id });
  } catch (error) {
    console.error('Error syncing chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/settings - Get all settings
app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM settings').all();
    const settings = {};
    rows.forEach(row => {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/settings - Save settings
app.post('/api/sync/settings', (req, res) => {
  try {
    const { key, value } = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run(key, JSON.stringify(value));

    broadcastToClients({ type: 'settings_updated', key });

    res.json({ success: true });
  } catch (error) {
    console.error('Error syncing settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/export - Export all data
app.get('/api/export', (req, res) => {
  try {
    const chats = db.prepare('SELECT * FROM chats').all();
    const settings = db.prepare('SELECT * FROM settings').all();

    const parsed = {
      version: '2.2.0',
      exportedAt: Date.now(),
      chats: chats.map(chat => ({
        ...chat,
        messages: JSON.parse(chat.messages || '[]'),
        knowledgeBase: JSON.parse(chat.knowledgeBase || '[]'),
        isStarred: !!chat.isStarred
      })),
      settings: {}
    };

    settings.forEach(row => {
      try {
        parsed.settings[row.key] = JSON.parse(row.value);
      } catch {
        parsed.settings[row.key] = row.value;
      }
    });

    res.json(parsed);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/import - Import data
app.post('/api/import', (req, res) => {
  try {
    const data = req.body;

    // Clear existing data
    db.prepare('DELETE FROM chats').run();
    db.prepare('DELETE FROM settings').run();

    // Import chats
    const chatStmt = db.prepare(`
      INSERT INTO chats (id, title, model, messages, knowledgeBase, updatedAt, isStarred)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    (data.chats || []).forEach(chat => {
      chatStmt.run(
        chat.id,
        chat.title,
        chat.model,
        JSON.stringify(chat.messages || []),
        JSON.stringify(chat.knowledgeBase || []),
        chat.updatedAt || Date.now(),
        chat.isStarred ? 1 : 0
      );
    });

    // Import settings
    const settingsStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    Object.entries(data.settings || {}).forEach(([key, value]) => {
      settingsStmt.run(key, JSON.stringify(value));
    });

    broadcastToClients({ type: 'full_import' });

    res.json({ success: true, chatsImported: data.chats?.length || 0 });
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/clear - Clear all data
app.delete('/api/clear', (req, res) => {
  try {
    db.prepare('DELETE FROM chats').run();
    db.prepare('DELETE FROM settings').run();

    broadcastToClients({ type: 'data_cleared' });

    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// WEBSOCKET SERVER
// ============================================

const wss = new WebSocket.Server({ port: WS_PORT });
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    clients.delete(ws);
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received message:', data.type);
      // Handle incoming messages if needed
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  // Send welcome message
  ws.send(JSON.stringify({ type: 'connected', message: 'Connected to RangerPlex Sync Server' }));
});

function broadcastToClients(data) {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// ============================================
// START SERVERS
// ============================================

app.listen(PORT, () => {
  console.log(`\n🎖️ RangerPlex Sync Server Running!`);
  console.log(`📡 REST API: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${WS_PORT}`);
  console.log(`💾 Database: rangerplex.db`);
  console.log(`\n✅ Enable Cloud Sync in RangerPlex Settings to connect!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down sync server...');
  db.close();
  process.exit(0);
});
```

---

## 🚀 HOW TO RUN

### **Terminal 1: Proxy Server (Anthropic API)**
```bash
cd "/Users/ranger/Local Sites/rangerplex-ai"
node proxy_server.js
```

### **Terminal 2: Sync Server (Database)**
```bash
cd "/Users/ranger/Local Sites/rangerplex-ai"
node sync_server.js
```

### **Terminal 3: Frontend (Vite)**
```bash
cd "/Users/ranger/Local Sites/rangerplex-ai"
npm run dev
```

---

## 🔧 UPDATE SYNC SERVICE CONFIG

**File:** `services/syncService.ts`

**Change line 6:**
```typescript
// BEFORE:
private serverUrl = 'ws://localhost:3010';

// AFTER:
private serverUrl = 'ws://localhost:3012'; // Match WS_PORT in sync_server.js
```

**Also update API endpoints (around line 151, 167, 178, 189, 200, 216):**
```typescript
// BEFORE:
const response = await fetch('http://localhost:3010/api/...');

// AFTER:
const response = await fetch('http://localhost:3011/api/...');
```

---

## ✅ TESTING

1. **Start all 3 servers** (proxy, sync, frontend)
2. **Open RangerPlex** in browser
3. **Go to Settings → Data & Backup**
4. **Enable "Enable Cloud Sync"** toggle
5. **Check console** - should see "☁️ Cloud sync enabled" and "🔌 WebSocket connected"
6. **Create a new chat** - Should auto-sync to database
7. **Check database:**
```bash
sqlite3 rangerplex.db "SELECT id, title FROM chats;"
```

---

## 🎯 BENEFITS

✅ **Backup survives browser clear** - Data safe in database file
✅ **Sync across devices** - Same network = shared database
✅ **100% local** - No cloud, no monthly fees, complete privacy
✅ **Fast** - SQLite is blazing fast
✅ **Real-time** - WebSocket syncs instantly
✅ **Portable** - Copy `rangerplex.db` file = full backup

---

## 📚 NEXT STEPS

Once working, you can:
- Add user authentication
- Network access from other devices (change `localhost` to your IP)
- Auto-backup script (cron job to copy `.db` file)
- Web UI to browse database
- Upgrade to PostgreSQL for multi-user

---

**Rangers lead the way!** 🎖️

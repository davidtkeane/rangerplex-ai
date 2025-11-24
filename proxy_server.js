import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3010;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/image', express.static(path.join(__dirname, 'image')));

// Ensure data and backups directories exist
const dataDir = path.join(__dirname, 'data');
const backupsDir = path.join(__dirname, 'backups');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);

// Initialize SQLite Database
const dbPath = path.join(dataDir, 'rangerplex.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    model TEXT NOT NULL,
    messages TEXT NOT NULL,
    knowledge_base TEXT,
    updated_at INTEGER NOT NULL,
    is_starred INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

console.log('✅ Database initialized at:', dbPath);

// REST API Endpoints

// Sync chat
app.post('/api/sync/chat', (req, res) => {
    try {
        const { id, title, model, messages, knowledgeBase, updatedAt, isStarred } = req.body;

        const stmt = db.prepare(`
      INSERT OR REPLACE INTO chats (id, title, model, messages, knowledge_base, updated_at, is_starred)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            title,
            model,
            JSON.stringify(messages),
            JSON.stringify(knowledgeBase || []),
            updatedAt,
            isStarred ? 1 : 0
        );

        broadcastSync({ type: 'chat_updated', chatId: id });
        res.json({ success: true });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all chats
app.get('/api/chats', (req, res) => {
    try {
        const chats = db.prepare('SELECT * FROM chats ORDER BY updated_at DESC').all();
        const parsed = chats.map(chat => ({
            id: chat.id,
            title: chat.title,
            model: chat.model,
            messages: JSON.parse(chat.messages),
            knowledgeBase: JSON.parse(chat.knowledge_base || '[]'),
            updatedAt: chat.updated_at,
            isStarred: chat.is_starred === 1
        }));
        res.json(parsed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete chat
app.delete('/api/chat/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM chats WHERE id = ?').run(req.params.id);
        broadcastSync({ type: 'chat_deleted', chatId: req.params.id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sync settings
app.post('/api/sync/settings', (req, res) => {
    try {
        const { key, value } = req.body;
        db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
        broadcastSync({ type: 'settings_updated', key });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all settings
app.get('/api/settings', (req, res) => {
    try {
        const settings = db.prepare('SELECT * FROM settings').all();
        const parsed = {};
        settings.forEach(s => {
            parsed[s.key] = JSON.parse(s.value);
        });
        res.json(parsed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export all data
app.get('/api/export', (req, res) => {
    try {
        const chats = db.prepare('SELECT * FROM chats').all();
        const settings = db.prepare('SELECT * FROM settings').all();
        const users = db.prepare('SELECT * FROM users').all();

        const exportData = {
            version: '2.2.0',
            exportedAt: Date.now(),
            chats: chats.map(c => ({
                ...c,
                messages: JSON.parse(c.messages),
                knowledge_base: JSON.parse(c.knowledge_base || '[]')
            })),
            settings: settings.reduce((acc, s) => {
                acc[s.key] = JSON.parse(s.value);
                return acc;
            }, {}),
            users
        };

        res.json(exportData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Import data
app.post('/api/import', (req, res) => {
    try {
        const { chats, settings, users } = req.body;

        // Clear existing data
        db.exec('DELETE FROM chats; DELETE FROM settings; DELETE FROM users;');

        // Import chats
        const chatStmt = db.prepare(`
      INSERT INTO chats (id, title, model, messages, knowledge_base, updated_at, is_starred)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        chats?.forEach(chat => {
            chatStmt.run(
                chat.id,
                chat.title,
                chat.model,
                JSON.stringify(chat.messages),
                JSON.stringify(chat.knowledge_base || []),
                chat.updated_at,
                chat.is_starred || 0
            );
        });

        // Import settings
        const settingsStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
        Object.entries(settings || {}).forEach(([key, value]) => {
            settingsStmt.run(key, JSON.stringify(value));
        });

        // Import users
        const userStmt = db.prepare('INSERT INTO users (username, password, created_at) VALUES (?, ?, ?)');
        users?.forEach(user => {
            userStmt.run(user.username, user.password, user.created_at);
        });

        broadcastSync({ type: 'full_import' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clear all data
app.delete('/api/clear', (req, res) => {
    try {
        db.exec('DELETE FROM chats; DELETE FROM settings;');
        broadcastSync({ type: 'data_cleared' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', database: 'connected' });
});

// Brave Search proxy (avoids browser CORS)
app.get('/v1/brave', async (req, res) => {
    try {
        const query = req.query.q;
        const apiKey = req.headers['x-subscription-token'];
        const count = Math.min(Number(req.query.count) || 5, 20);

        if (!query) return res.status(400).json({ error: 'Missing query' });
        if (!apiKey) return res.status(400).json({ error: 'Missing Brave API key' });

        const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'X-Subscription-Token': apiKey
            }
        });

        const bodyText = await response.text();
        if (!response.ok) return res.status(response.status).send(bodyText);

        res.set('Access-Control-Allow-Origin', '*');
        res.json(JSON.parse(bodyText));
    } catch (error) {
        console.error('❌ Brave proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save image server-side to /image/saved_*.{ext}
app.get('/api/save-image', async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) return res.status(400).json({ error: 'Missing url' });

        const imagesDir = path.join(__dirname, 'image');
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

        const urlObj = new URL(imageUrl);
        const extMatch = urlObj.pathname.match(/\.(png|jpg|jpeg|gif|webp)$/i);
        const ext = extMatch ? extMatch[1] : 'png';
        const filename = `saved_${Date.now()}.${ext}`;
        const filepath = path.join(imagesDir, filename);

        const response = await fetch(imageUrl);
        if (!response.ok) return res.status(response.status).send(await response.text());

        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(filepath, buffer);

        const fullUrl = `http://localhost:${PORT}/${relativePath}`;
        res.set('Access-Control-Allow-Origin', '*');
        res.json({ savedPath: fullUrl, filename });
    } catch (error) {
        console.error('❌ Save image error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DuckDuckGo proxy (fallback search)
app.get('/v1/ddg', async (req, res) => {
    try {
        const query = req.query.q;
        const count = Math.min(Number(req.query.count) || 5, 20);

        if (!query) return res.status(400).json({ error: 'Missing query' });

        const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const response = await fetch(ddgUrl, { headers: { 'Accept': 'application/json' } });

        if (!response.ok) return res.status(response.status).send(await response.text());

        const data = await response.json();
        const results = [];

        if (Array.isArray(data.Results)) {
            data.Results.forEach(r => {
                if (r.Text && r.FirstURL) {
                    results.push({ title: r.Text, link: r.FirstURL, snippet: r.Text });
                }
            });
        }

        const pullTopics = (topics) => {
            topics?.forEach(t => {
                if (t.Topics) return pullTopics(t.Topics);
                if (t.Text && t.FirstURL) {
                    results.push({ title: t.Text, link: t.FirstURL, snippet: t.Text });
                }
            });
        };
        if (Array.isArray(data.RelatedTopics)) pullTopics(data.RelatedTopics);

        res.set('Access-Control-Allow-Origin', '*');
        res.json({ results: results.slice(0, count) });
    } catch (error) {
        console.error('❌ DDG proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Image proxy (for downloading generated images)
app.get('/api/image/download', async (req, res) => {
    try {
        const imageUrl = req.query.url;

        if (!imageUrl) {
            return res.status(400).json({ error: 'Missing image URL' });
        }

        console.log('🖼️ Proxying image download:', imageUrl);

        const response = await fetch(imageUrl);

        if (!response.ok) {
            console.error('❌ Image fetch failed:', response.status, response.statusText);
            return res.status(response.status).json({
                error: `Image unavailable: ${response.statusText}`
            });
        }

        // Set proper headers for download
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': response.headers.get('content-type') || 'image/png',
            'Content-Disposition': 'attachment; filename="rangerplex_image.png"',
            'Cache-Control': 'no-cache'
        });

        // Stream the image back
        const reader = response.body.getReader();
        const pump = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (!res.write(value)) {
                        await new Promise(resolve => res.once('drain', resolve));
                    }
                }
                res.end();
                console.log('✅ Image download completed');
            } catch (error) {
                console.error('❌ Stream pump error:', error);
                res.end();
            }
        };
        pump();

    } catch (error) {
        console.error('❌ Image proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Anthropic API proxy (to bypass CORS)
app.post('/v1/messages', async (req, res) => {
    try {
        console.log('🤖 Proxying Anthropic API request...');

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': req.headers['x-api-key'],
                'anthropic-version': req.headers['anthropic-version'] || '2023-06-01'
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Anthropic API error:', response.status, errorText);
            return res.status(response.status).send(errorText);
        }

        // Set CORS headers
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': response.headers.get('content-type') || 'text/event-stream',
            'Cache-Control': 'no-cache'
        });

        // Stream the response back
        const reader = response.body.getReader();
        const pump = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (!res.write(value)) {
                        await new Promise(resolve => res.once('drain', resolve));
                    }
                }
                res.end();
                console.log('✅ Anthropic stream completed');
            } catch (error) {
                console.error('❌ Stream pump error:', error);
                res.end();
            }
        };
        pump();

    } catch (error) {
        console.error('❌ Anthropic proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Radio stream proxy (to bypass CORS)
app.get('/api/radio/stream', async (req, res) => {
    try {
        const streamUrl = req.query.url;

        if (!streamUrl) {
            return res.status(400).json({ error: 'Missing stream URL' });
        }

        console.log('📻 Proxying radio stream:', streamUrl);

        // Fetch the stream with proper headers
        const response = await fetch(streamUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Referer': 'https://somafm.com/',
                'Accept': 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8'
            }
        });

        if (!response.ok) {
            console.error('❌ Stream fetch failed:', response.status, response.statusText);
            return res.status(response.status).json({
                error: `Stream unavailable: ${response.statusText}`
            });
        }

        // Set CORS headers
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'no-cache'
        });

        // Convert Web ReadableStream to Node.js stream and pipe to response
        const reader = response.body.getReader();

        const pump = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (!res.write(value)) {
                        // Backpressure handling
                        await new Promise(resolve => res.once('drain', resolve));
                    }
                }
                res.end();
            } catch (error) {
                console.error('❌ Stream pump error:', error);
                res.end();
            }
        };

        pump();

    } catch (error) {
        console.error('❌ Radio proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// WebSocket Server
const server = createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set();

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('🔌 WebSocket client connected. Total:', clients.size);

    ws.on('close', () => {
        clients.delete(ws);
        console.log('🔌 WebSocket client disconnected. Total:', clients.size);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

function broadcastSync(message) {
    const data = JSON.stringify(message);
    clients.forEach(client => {
        if (client.readyState === 1) { // OPEN
            client.send(data);
        }
    });
}

// Auto-backup every 5 minutes
setInterval(() => {
    try {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const backupPath = path.join(backupsDir, `RangerPlex_Backup_${timestamp}.json`);

        const chats = db.prepare('SELECT * FROM chats').all();
        const settings = db.prepare('SELECT * FROM settings').all();
        const users = db.prepare('SELECT * FROM users').all();

        const backup = {
            version: '2.2.0',
            exportedAt: Date.now(),
            chats: chats.map(c => ({
                ...c,
                messages: JSON.parse(c.messages),
                knowledge_base: JSON.parse(c.knowledge_base || '[]')
            })),
            settings: settings.reduce((acc, s) => {
                acc[s.key] = JSON.parse(s.value);
                return acc;
            }, {}),
            users
        };

        fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
        console.log('💾 Auto-backup created:', backupPath);
    } catch (error) {
        console.error('Auto-backup failed:', error);
    }
}, 5 * 60 * 1000); // 5 minutes

// Start server
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎖️  RANGERPLEX AI SERVER v2.4.2                        ║
║                                                           ║
║   📡 REST API:      http://localhost:${PORT}                ║
║   🔌 WebSocket:     ws://localhost:${PORT}                  ║
║   💾 Database:      ${dbPath}     ║
║   📦 Backups:       ${backupsDir}                ║
║                                                           ║
║   Status: ✅ ONLINE                                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

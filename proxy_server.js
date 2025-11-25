import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import tls from 'tls';
import https from 'https';
import { promisify } from 'util';
import exifParser from 'exif-parser';
import os from 'os';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolveNs = promisify(dns.resolveNs);

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

// VirusTotal Proxy
app.post('/api/virustotal/scan', async (req, res) => {
    try {
        const { url, apiKey } = req.body;
        if (!url || !apiKey) return res.status(400).json({ error: 'Missing url or apiKey' });

        console.log('🛡️ VirusTotal Check:', url);

        // 1. Check if already scanned (GET /urls/{id})
        // ID is base64 encoded URL without padding
        const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');
        const reportUrl = `https://www.virustotal.com/api/v3/urls/${urlId}`;

        let response = await fetch(reportUrl, {
            headers: { 'x-apikey': apiKey }
        });

        if (response.ok) {
            const data = await response.json();
            return res.json({ status: 'found', data: data.data });
        }

        if (response.status === 404) {
            // 2. Not found, submit for scanning (POST /urls)
            console.log('🛡️ URL not found, submitting scan...');
            const scanResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
                method: 'POST',
                headers: {
                    'x-apikey': apiKey,
                    'content-type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({ url })
            });

            if (!scanResponse.ok) {
                const errText = await scanResponse.text();
                return res.status(scanResponse.status).json({ error: 'Scan submission failed: ' + errText });
            }

            const scanData = await scanResponse.json();
            return res.json({ status: 'queued', data: scanData.data });
        }

        // Other error
        const errText = await response.text();
        res.status(response.status).json({ error: errText });

    } catch (error) {
        console.error('❌ VirusTotal error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DNS Lookup Tool
app.post('/api/tools/dns', async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.status(400).json({ error: 'Missing domain' });

        console.log('🔍 DNS Lookup:', domain);

        const results = {};

        // Parallel lookups
        await Promise.allSettled([
            resolve4(domain).then(r => results.A = r).catch(e => results.A = []),
            resolve6(domain).then(r => results.AAAA = r).catch(e => results.AAAA = []),
            resolveMx(domain).then(r => results.MX = r).catch(e => results.MX = []),
            resolveTxt(domain).then(r => results.TXT = r).catch(e => results.TXT = []),
            resolveNs(domain).then(r => results.NS = r).catch(e => results.NS = [])
        ]);

        res.json(results);
    } catch (error) {
        console.error('❌ DNS error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Whois (RDAP) Tool
app.post('/api/tools/whois', async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.status(400).json({ error: 'Missing domain' });

        console.log('🏢 Whois/RDAP Lookup:', domain);

        // Use RDAP.org which redirects to the authoritative registrar
        const response = await fetch(`https://rdap.org/domain/${domain}`, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            if (response.status === 404) return res.status(404).json({ error: 'Domain not found' });
            throw new Error(`RDAP error: ${response.statusText}`);
        }

        const data = await response.json();

        // Extract useful info
        const cleanData = {
            handle: data.handle,
            name: data.name,
            status: data.status || [],
            events: data.events || [], // Created, Updated, Expiration
            entities: (data.entities || []).map(e => ({
                roles: e.roles,
                name: e.vcardArray?.[1]?.find(x => x[0] === 'fn')?.[3] || 'Unknown'
            })),
            nameservers: (data.nameservers || []).map(n => n.ldhName)
        };

        res.json(cleanData);
    } catch (error) {
        console.error('❌ Whois error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Have I Been Pwned (HIBP) Tool
app.post('/api/tools/breach', async (req, res) => {
    try {
        const { email, apiKey } = req.body;
        if (!email || !apiKey) return res.status(400).json({ error: 'Missing email or apiKey' });

        console.log('🕵️ HIBP Breach Check:', email);

        const response = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`, {
            headers: {
                'hibp-api-key': apiKey,
                'user-agent': 'RangerPlex-AI'
            }
        });

        if (response.status === 404) {
            return res.json({ status: 'clean', data: [] }); // No breaches found
        }

        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: `HIBP Error: ${errText}` });
        }

        const data = await response.json();
        res.json({ status: 'pwned', data });

    } catch (error) {
        console.error('❌ HIBP error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Shodan Host Lookup Tool
app.post('/api/tools/shodan', async (req, res) => {
    try {
        const { ip, apiKey } = req.body;
        if (!ip || !apiKey) return res.status(400).json({ error: 'Missing ip or apiKey' });

        console.log('👁️ Shodan Lookup:', ip);

        const response = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${apiKey}`);

        if (response.status === 404) {
            return res.status(404).json({ error: 'IP not found in Shodan database' });
        }

        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: `Shodan Error: ${errText}` });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('❌ Shodan error:', error);
        res.status(500).json({ error: error.message });
    }
});

// SSL Certificate Inspector
app.post('/api/tools/ssl', async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.status(400).json({ error: 'Missing domain' });

        console.log('🔒 SSL Check:', domain);

        const options = {
            host: domain,
            port: 443,
            method: 'GET',
            rejectUnauthorized: false, // We want to see the cert even if invalid
            agent: new https.Agent({ maxCachedSessions: 0 })
        };

        const reqSSL = https.request(options, (resSSL) => {
            const cert = resSSL.connection.getPeerCertificate(true);
            if (!cert || Object.keys(cert).length === 0) {
                return res.status(404).json({ error: 'No certificate found' });
            }

            const cleanCert = {
                subject: cert.subject,
                issuer: cert.issuer,
                valid_from: cert.valid_from,
                valid_to: cert.valid_to,
                days_remaining: Math.floor((new Date(cert.valid_to) - new Date()) / (1000 * 60 * 60 * 24)),
                fingerprint: cert.fingerprint,
                serialNumber: cert.serialNumber,
                valid: (new Date() >= new Date(cert.valid_from) && new Date() <= new Date(cert.valid_to))
            };

            res.json(cleanCert);
        });

        reqSSL.on('error', (e) => {
            res.status(500).json({ error: e.message });
        });

        reqSSL.end();

    } catch (error) {
        console.error('❌ SSL error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Security Headers Auditor
app.post('/api/tools/headers', async (req, res) => {
    try {
        let { url } = req.body;
        if (!url) return res.status(400).json({ error: 'Missing url' });

        if (!url.startsWith('http')) url = 'https://' + url;

        console.log('🛡️ Headers Audit:', url);

        const response = await fetch(url, { method: 'HEAD' });
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });

        const analysis = {
            hsts: headers['strict-transport-security'] ? '✅ Present' : '❌ Missing',
            csp: headers['content-security-policy'] ? '✅ Present' : '❌ Missing',
            xFrame: headers['x-frame-options'] ? '✅ Present' : '❌ Missing',
            xContentType: headers['x-content-type-options'] ? '✅ Present' : '❌ Missing',
            referrerPolicy: headers['referrer-policy'] ? '✅ Present' : '❌ Missing',
            server: headers['server'] || 'Hidden/Unknown'
        };

        res.json({ headers, analysis, status: response.status });

    } catch (error) {
        console.error('❌ Headers error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 5. Sherlock (Username Scout)
app.post('/api/tools/sherlock', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ error: 'Missing username' });

        console.log('🕵️ Sherlock Scan:', username);

        const SITES = [
            { name: 'GitHub', url: `https://github.com/${username}`, type: 'status' },
            { name: 'Reddit', url: `https://www.reddit.com/user/${username}`, type: 'status' },
            { name: 'Twitch', url: `https://m.twitch.tv/${username}`, type: 'status' },
            { name: 'Steam', url: `https://steamcommunity.com/id/${username}`, type: 'status' },
            { name: 'GitLab', url: `https://gitlab.com/${username}`, type: 'status' },
            { name: 'Pinterest', url: `https://www.pinterest.com/${username}/`, type: 'status' },
            { name: 'SoundCloud', url: `https://soundcloud.com/${username}`, type: 'status' },
            { name: 'Dev.to', url: `https://dev.to/${username}`, type: 'status' },
            { name: 'Medium', url: `https://medium.com/@${username}`, type: 'status' },
            { name: 'Wikipedia', url: `https://en.wikipedia.org/wiki/User:${username}`, type: 'status' },
            { name: 'HackerNews', url: `https://news.ycombinator.com/user?id=${username}`, type: 'body', text: 'No such user' },
            { name: 'Patreon', url: `https://www.patreon.com/${username}`, type: 'status' },
            { name: 'YouTube', url: `https://www.youtube.com/@${username}`, type: 'status' }
        ];

        const checkSite = async (site) => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

                const response = await fetch(site.url, {
                    method: 'GET',
                    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
                    signal: controller.signal
                });
                clearTimeout(timeout);

                let status = 'not_found';

                // 1. Check HTTP Status
                if (response.status === 200) {
                    status = 'found';

                    // 2. Check for "False Positive" text traps
                    // Some sites return 200 OK but say "User not found" in the body
                    const text = await response.text().then(t => t.toLowerCase()).catch(() => '');

                    const TRAP_PHRASES = [
                        'user not found',
                        'page not found',
                        'this channel does not exist',
                        'sorry, nobody on reddit goes by that name',
                        'the specified profile could not be found',
                        'content not found'
                    ];

                    if (TRAP_PHRASES.some(phrase => text.includes(phrase))) {
                        status = 'false_positive';
                    }
                }

                return { name: site.name, url: site.url, status, http_code: response.status };
            } catch (e) {
                return { name: site.name, url: site.url, status: 'error', error: true };
            }
        };

        const results = await Promise.all(SITES.map(checkSite));

        // We return ALL results that are not 'not_found' or 'error'
        // This includes 'found' AND 'false_positive'
        const matches = results.filter(r => r.status === 'found' || r.status === 'false_positive');

        res.json({ username, total_checked: SITES.length, matches });

    } catch (error) {
        console.error('❌ Sherlock error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 6. Crypto Intelligence (CoinGecko)
app.post('/api/tools/crypto', async (req, res) => {
    try {
        const { symbol } = req.body;
        if (!symbol) return res.status(400).json({ error: 'Missing symbol' });

        console.log('💰 Crypto Check:', symbol);

        // 1. Search for the coin ID (e.g. "btc" -> "bitcoin")
        const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${symbol}`);
        const searchData = await searchRes.json();

        if (!searchData.coins || searchData.coins.length === 0) {
            return res.status(404).json({ error: 'Coin not found' });
        }

        // Find best match (exact symbol match preferred)
        const coin = searchData.coins.find(c => c.symbol.toLowerCase() === symbol.toLowerCase()) || searchData.coins[0];

        // 2. Get Price Data
        const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin.id}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`);
        const priceData = await priceRes.json();
        const data = priceData[coin.id];

        if (!data) return res.status(404).json({ error: 'Price data unavailable' });

        res.json({
            name: coin.name,
            symbol: coin.symbol,
            rank: coin.market_cap_rank,
            thumb: coin.thumb,
            price: data.usd,
            change_24h: data.usd_24h_change,
            market_cap: data.usd_market_cap,
            volume_24h: data.usd_24h_vol,
            updated: data.last_updated_at
        });

    } catch (error) {
        console.error('❌ Crypto error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 7. Bitcoin Wallet Inspector (BlockCypher)
app.post('/api/tools/wallet', async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) return res.status(400).json({ error: 'Missing address' });

        console.log('🏦 Wallet Check:', address);

        // 1. Get Wallet Data
        const walletRes = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`);
        if (walletRes.status === 404) return res.status(404).json({ error: 'Address not found' });
        const walletData = await walletRes.json();

        // 2. Get Current BTC Price for Conversion
        const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const priceData = await priceRes.json();
        const btcPrice = priceData.bitcoin.usd;

        // Convert Satoshis to BTC
        const balanceBTC = walletData.balance / 100000000;
        const totalReceivedBTC = walletData.total_received / 100000000;
        const totalSentBTC = walletData.total_sent / 100000000;

        res.json({
            address: walletData.address,
            balance_btc: balanceBTC,
            balance_usd: balanceBTC * btcPrice,
            total_received: totalReceivedBTC,
            total_sent: totalSentBTC,
            n_tx: walletData.n_tx,
            unconfirmed_balance: walletData.unconfirmed_balance / 100000000
        });

    } catch (error) {
        console.error('❌ Wallet error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 8. Digital Forensics (Exif)
app.post('/api/tools/exif', async (req, res) => {
    try {
        const { url, image } = req.body;
        let buffer;

        if (url) {
            console.log('📸 Exif Check URL:', url);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        } else if (image) {
            console.log('📸 Exif Check Base64');
            const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
            buffer = Buffer.from(base64Data, 'base64');
        } else {
            return res.status(400).json({ error: 'Missing url or image data' });
        }

        const parser = exifParser.create(buffer);
        const result = parser.parse();

        res.json({
            tags: result.tags,
            imageSize: result.imageSize,
            thumbnail: result.thumbnail ? true : false,
            hasExif: Object.keys(result.tags).length > 0
        });

    } catch (error) {
        console.error('❌ Exif error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 9. IP Geolocation (ip-api.com)
app.post('/api/tools/geoip', async (req, res) => {
    try {
        const { ip } = req.body;
        if (!ip) return res.status(400).json({ error: 'Missing IP address' });

        console.log('🌍 GeoIP Check:', ip);

        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
        const data = await response.json();

        if (data.status === 'fail') {
            return res.status(404).json({ error: data.message });
        }

        res.json(data);

    } catch (error) {
        console.error('❌ GeoIP error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 10. MAC Address Lookup (macvendors.co)
app.post('/api/tools/mac', async (req, res) => {
    try {
        const { mac } = req.body;
        if (!mac) return res.status(400).json({ error: 'Missing MAC address' });

        console.log('📟 MAC Check:', mac);

        const response = await fetch(`https://api.macvendors.com/${mac}`);

        if (response.status === 404) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        const vendor = await response.text();

        res.json({
            mac: mac,
            vendor: vendor
        });

    } catch (error) {
        console.error('❌ MAC error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 11. IPInfo (Dual-Source: IPInfo API + ip-api fallback)
app.post('/api/tools/ipinfo', async (req, res) => {
    try {
        const { ip, token } = req.body;
        if (!ip) return res.status(400).json({ error: 'Missing IP address' });

        console.log('🌐 IPInfo Check:', ip);

        let data;

        // Try IPInfo first if token is provided
        if (token) {
            try {
                const response = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
                if (response.ok) {
                    data = await response.json();
                    data.source = 'ipinfo';
                }
            } catch (e) {
                console.log('IPInfo failed, falling back to ip-api');
            }
        }

        // Fallback to ip-api if IPInfo failed or no token
        if (!data) {
            const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
            const apiData = await response.json();

            if (apiData.status === 'fail') {
                return res.status(404).json({ error: apiData.message });
            }

            // Convert ip-api format to IPInfo-like format
            data = {
                ip: apiData.query,
                city: apiData.city,
                region: apiData.regionName,
                country: apiData.country,
                loc: `${apiData.lat},${apiData.lon}`,
                org: apiData.org,
                timezone: apiData.timezone,
                source: 'ip-api'
            };
        }

        res.json(data);

    } catch (error) {
        console.error('❌ IPInfo error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 12. My IP (Get user's public IP)
app.post('/api/tools/myip', async (req, res) => {
    try {
        console.log('🔍 MyIP Request');

        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();

        res.json({ ip: data.ip });

    } catch (error) {
        console.error('❌ MyIP error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 13. Phone Intel (NumVerify) with Monthly Counter
let phoneRequestCount = 0;
let phoneCounterMonth = new Date().getMonth();

app.post('/api/tools/phone', async (req, res) => {
    try {
        const { number, apiKey } = req.body;
        if (!number) return res.status(400).json({ error: 'Missing phone number' });
        if (!apiKey) return res.status(400).json({ error: 'Missing NumVerify API key' });

        console.log('📱 Phone Check:', number);

        // Reset counter if new month
        const currentMonth = new Date().getMonth();
        if (currentMonth !== phoneCounterMonth) {
            phoneRequestCount = 0;
            phoneCounterMonth = currentMonth;
        }

        // Check limit
        if (phoneRequestCount >= 100) {
            return res.status(429).json({
                error: 'Monthly limit reached (100/100)',
                count: phoneRequestCount,
                limit: 100
            });
        }

        const response = await fetch(`http://apilayer.net/api/validate?access_key=${apiKey}&number=${number}`);
        const data = await response.json();

        if (!data.valid && data.error) {
            return res.status(400).json({ error: data.error.info || 'Invalid phone number' });
        }

        // Increment counter
        phoneRequestCount++;

        res.json({
            ...data,
            requestCount: phoneRequestCount,
            requestLimit: 100
        });

    } catch (error) {
        console.error('❌ Phone error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 14. Email Validation (AbstractAPI) with Monthly Counter
let emailRequestCount = 0;
let emailCounterMonth = new Date().getMonth();

app.post('/api/tools/email', async (req, res) => {
    try {
        const { email, apiKey } = req.body;
        if (!email) return res.status(400).json({ error: 'Missing email address' });
        if (!apiKey) return res.status(400).json({ error: 'Missing AbstractAPI key' });

        console.log('📧 Email Check:', email);

        // Reset counter if new month
        const currentMonth = new Date().getMonth();
        if (currentMonth !== emailCounterMonth) {
            emailRequestCount = 0;
            emailCounterMonth = currentMonth;
        }

        // Check limit
        if (emailRequestCount >= 100) {
            return res.status(429).json({
                error: 'Monthly limit reached (100/100)',
                count: emailRequestCount,
                limit: 100
            });
        }

        const response = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`);
        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message || 'Invalid email' });
        }

        // Increment counter
        emailRequestCount++;

        res.json({
            ...data,
            requestCount: emailRequestCount,
            requestLimit: 100
        });

    } catch (error) {
        console.error('❌ Email error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 15. IP Reconnaissance (AbstractAPI IP Intelligence)
app.post('/api/tools/iprecon', async (req, res) => {
    try {
        const { ip, apiKey } = req.body;
        if (!ip) return res.status(400).json({ error: 'Missing IP address' });
        if (!apiKey) return res.status(400).json({ error: 'Missing AbstractAPI key' });

        console.log('🛡️ IP Recon:', ip);

        const response = await fetch(`https://ip-intelligence.abstractapi.com/v1/?api_key=${apiKey}&ip_address=${ip}`);
        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message || 'Invalid IP' });
        }

        res.json(data);

    } catch (error) {
        console.error('❌ IP Recon error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 16. System Info (Local Server)
app.post('/api/tools/system', async (req, res) => {
    try {
        console.log('💻 System Info Request');

        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const platform = os.platform();
        const release = os.release();
        const hostname = os.hostname();

        // Get Network Interfaces (MAC Address)
        const nets = os.networkInterfaces();
        const networks = {};
        let macAddress = 'Unknown';

        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                // Skip internal (i.e. 127.0.0.1) and non-ipv4 addresses
                if (net.family === 'IPv4' && !net.internal) {
                    if (!networks[name]) {
                        networks[name] = [];
                    }
                    networks[name].push(net.address);
                    macAddress = net.mac; // Grab the first valid MAC
                }
            }
        }

        res.json({
            hostname,
            platform,
            release,
            cpu: cpus[0].model,
            cores: cpus.length,
            memory: {
                total: totalMem,
                free: freeMem
            },
            mac: macAddress,
            network: networks
        });

    } catch (error) {
        console.error('❌ System Info error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Wayback Machine (Internet Archive)
app.post('/api/tools/wayback', async (req, res) => {
    try {
        const { url } = req.body;
        console.log('🕰️ Wayback Machine Request:', url);

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Clean URL (remove protocol for consistent results)
        const cleanUrl = url.replace(/^https?:\/\//, '');

        // Query Wayback Machine Availability API
        const apiUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(cleanUrl)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.archived_snapshots || !data.archived_snapshots.closest) {
            return res.json({
                status: 'not_found',
                url: url,
                message: 'No archived snapshots found for this URL'
            });
        }

        const snapshot = data.archived_snapshots.closest;

        // Get all snapshots count (optional - requires CDX API)
        const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(cleanUrl)}&output=json&limit=1000`;
        let totalSnapshots = 0;
        let years = [];

        try {
            const cdxResponse = await fetch(cdxUrl);
            const cdxData = await cdxResponse.json();

            if (cdxData && cdxData.length > 1) { // First row is header
                totalSnapshots = cdxData.length - 1;

                // Extract unique years
                const yearSet = new Set();
                cdxData.slice(1).forEach(row => {
                    if (row[1]) { // timestamp
                        const year = row[1].substring(0, 4);
                        yearSet.add(year);
                    }
                });
                years = Array.from(yearSet).sort();
            }
        } catch (cdxError) {
            console.log('⚠️ CDX API call failed (non-critical):', cdxError.message);
        }

        res.json({
            status: 'found',
            url: url,
            latest_snapshot: {
                url: snapshot.url,
                timestamp: snapshot.timestamp,
                status: snapshot.status,
                available: snapshot.available
            },
            total_snapshots: totalSnapshots,
            years_archived: years,
            first_snapshot: years.length > 0 ? years[0] : null,
            last_snapshot: years.length > 0 ? years[years.length - 1] : null
        });

    } catch (error) {
        console.error('❌ Wayback Machine error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Subdomain Enumeration (Certificate Transparency)
app.post('/api/tools/subdomains', async (req, res) => {
    try {
        const { domain } = req.body;
        console.log('🔍 Subdomain Enumeration Request:', domain);

        if (!domain) {
            return res.status(400).json({ error: 'Domain is required' });
        }

        // Clean domain (remove protocol, www, trailing slash)
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
        console.log('🧹 Cleaned domain:', cleanDomain);

        // Query crt.sh for certificate transparency logs
        const crtshUrl = `https://crt.sh/?q=%25.${encodeURIComponent(cleanDomain)}&output=json`;
        console.log('🔗 Querying:', crtshUrl);

        const response = await fetch(crtshUrl, {
            headers: {
                'User-Agent': 'RangerPlex-OSINT/2.5.16'
            }
        });

        if (!response.ok) {
            throw new Error(`crt.sh returned status ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Total certificates found:', data.length);

        // Extract unique subdomains
        const subdomains = new Set();
        const wildcardDomains = new Set();

        for (const cert of data) {
            // Parse name_value which contains the domain names
            const names = cert.name_value.split('\n');

            for (const name of names) {
                const cleanName = name.trim().toLowerCase();

                // Skip if it doesn't end with our target domain
                if (!cleanName.endsWith(cleanDomain)) {
                    continue;
                }

                // Separate wildcards
                if (cleanName.startsWith('*.')) {
                    wildcardDomains.add(cleanName);
                } else {
                    subdomains.add(cleanName);
                }
            }
        }

        // Convert to sorted arrays
        const subdomainList = Array.from(subdomains).sort();
        const wildcardList = Array.from(wildcardDomains).sort();

        console.log('✅ Unique subdomains found:', subdomainList.length);
        console.log('🌟 Wildcard domains found:', wildcardList.length);

        res.json({
            domain: cleanDomain,
            total_certificates: data.length,
            subdomains: subdomainList,
            wildcards: wildcardList,
            total_subdomains: subdomainList.length,
            total_wildcards: wildcardList.length
        });

    } catch (error) {
        console.error('❌ Subdomain enumeration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reverse DNS / Reverse IP Lookup (HackerTarget API - Free)
app.post('/api/tools/reverse', async (req, res) => {
    try {
        const { ip } = req.body;
        console.log('🔄 Reverse DNS/IP Lookup:', ip);

        if (!ip) {
            return res.status(400).json({ error: 'IP address is required' });
        }

        // Validate IP format (basic check)
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) {
            return res.status(400).json({ error: 'Invalid IP address format' });
        }

        // Use HackerTarget's free Reverse IP Lookup API (no key required)
        const hackerTargetUrl = `https://api.hackertarget.com/reverseiplookup/?q=${encodeURIComponent(ip)}`;
        console.log('🔗 Querying HackerTarget:', hackerTargetUrl);

        const response = await fetch(hackerTargetUrl, {
            headers: {
                'User-Agent': 'RangerPlex-OSINT/2.5.18'
            }
        });

        const text = await response.text();

        // Check for errors
        if (text.includes('error') || text.includes('invalid')) {
            return res.json({
                status: 'not_found',
                ip: ip,
                domains: [],
                total_domains: 0,
                message: 'No domains found for this IP address, or IP is invalid',
                source: 'HackerTarget (Free)'
            });
        }

        // Parse domains (HackerTarget returns newline-separated domain list)
        const domains = text.trim().split('\n').filter(d => d.length > 0 && !d.includes('error'));

        if (domains.length === 0) {
            return res.json({
                status: 'not_found',
                ip: ip,
                domains: [],
                total_domains: 0,
                message: 'No domains found for this IP address',
                source: 'HackerTarget (Free)'
            });
        }

        // Sort domains alphabetically
        domains.sort();

        console.log('✅ Found domains:', domains.length);

        res.json({
            status: 'found',
            ip: ip,
            domains: domains,
            total_domains: domains.length,
            source: 'HackerTarget (Free)',
            note: 'Free tier may have rate limits. Consider upgrading for heavy usage.',
            checked_at: Date.now()
        });

    } catch (error) {
        console.error('❌ Reverse DNS error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Domain Reputation Checker (Google Safe Browsing API)
app.post('/api/tools/reputation', async (req, res) => {
    try {
        const { domain, apiKey } = req.body;
        console.log('🛡️ Domain Reputation Check:', domain);

        if (!domain) {
            return res.status(400).json({ error: 'Domain is required' });
        }

        // Clean domain (remove protocol, www, trailing slash)
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
        const urlToCheck = `http://${cleanDomain}`;
        const urlToCheckHttps = `https://${cleanDomain}`;

        // If API key provided, use Google Safe Browsing API
        if (apiKey) {
            console.log('🔑 Using Google Safe Browsing API');

            const safeBrowsingUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

            const requestBody = {
                client: {
                    clientId: "rangerplex-osint",
                    clientVersion: "2.5.17"
                },
                threatInfo: {
                    threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                    platformTypes: ["ANY_PLATFORM"],
                    threatEntryTypes: ["URL"],
                    threatEntries: [
                        { url: urlToCheck },
                        { url: urlToCheckHttps }
                    ]
                }
            };

            const response = await fetch(safeBrowsingUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (data.error) {
                return res.status(400).json({
                    error: data.error.message || 'Google Safe Browsing API error',
                    code: data.error.code
                });
            }

            // Check if threats were found
            if (data.matches && data.matches.length > 0) {
                // Domain is flagged
                const threats = data.matches.map(match => ({
                    threatType: match.threatType,
                    platformType: match.platformType,
                    url: match.threat.url
                }));

                res.json({
                    status: 'threat_detected',
                    domain: cleanDomain,
                    safe: false,
                    threats: threats,
                    total_threats: threats.length,
                    source: 'Google Safe Browsing API',
                    checked_at: Date.now()
                });
            } else {
                // No threats found
                res.json({
                    status: 'clean',
                    domain: cleanDomain,
                    safe: true,
                    threats: [],
                    total_threats: 0,
                    source: 'Google Safe Browsing API',
                    checked_at: Date.now(),
                    message: 'No threats detected in Google Safe Browsing database'
                });
            }

        } else {
            // No API key - return basic info
            console.log('⚠️ No API key provided - returning basic check');
            res.json({
                status: 'no_api_key',
                domain: cleanDomain,
                safe: null,
                message: 'API key required for reputation checks. Add your Google Safe Browsing API key in Settings.',
                get_api_key: 'https://developers.google.com/safe-browsing/v4/get-started'
            });
        }

    } catch (error) {
        console.error('❌ Domain reputation error:', error);
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

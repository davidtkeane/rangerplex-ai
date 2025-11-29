import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import dns from 'dns';
import tls from 'tls';
import https from 'https';
import { promisify } from 'util';
import exifParser from 'exif-parser';
import os from 'os';
import net from 'net';
import puppeteer from 'puppeteer';
import pty from 'node-pty';
import { createRequire } from 'module';
import { allowlistValidator } from './services/allowlistValidator.js';
import { commandExecutor } from './services/commandExecutor.js';
import { executionLogger } from './services/executionLogger.js';
import { aliasService } from './services/aliasService.node.js';

// Import blockchain service (CommonJS)
const require = createRequire(import.meta.url);
const blockchainService = require('./rangerblock/blockchainService.cjs');

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);
const resolveNs = promisify(dns.resolveNs);
const lookup = promisify(dns.lookup);
const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const startDockerDesktop = async () => {
    const platform = process.platform;
    let cmd = null;
    if (platform === 'darwin') {
        cmd = 'open -a "Docker"';
    } else if (platform === 'win32') {
        cmd = 'powershell -Command "Start-Process \\"C:\\\\Program Files\\\\Docker\\\\Docker\\\\Docker Desktop.exe\\""';
    } else {
        cmd = 'systemctl --user start docker-desktop || systemctl start docker || true';
    }
    if (cmd) {
        await execAsync(cmd);
    }
};
let mcpGatewayProc = null;

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

  CREATE TABLE IF NOT EXISTS execution_logs (
    id TEXT PRIMARY KEY,
    command TEXT NOT NULL,
    cwd TEXT NOT NULL,
    user TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    exit_code INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    source TEXT NOT NULL,
    stdout TEXT,
    stderr TEXT
  );
`);

console.log('✅ Database initialized at:', dbPath);
executionLogger.setDb(db);

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

// Execute allowlisted command or alias
app.post('/api/alias/execute', async (req, res) => {
    const { aliasName, command, cwd, timeout } = req.body || {};

    if (!command || typeof command !== 'string') {
        return res.status(400).json({ success: false, error: 'Command is required' });
    }

    const validation = allowlistValidator.validateCommand(command);
    if (!validation.valid) {
        return res.status(403).json({
            success: false,
            error: validation.reason,
        });
    }

    const workingDir = typeof cwd === 'string' && cwd.trim().length ? cwd : process.cwd();
    const timeoutMs = typeof timeout === 'number' ? timeout : 60000;

    try {
        const result = await commandExecutor.execute(command, workingDir, timeoutMs);

        await executionLogger.log({
            command,
            cwd: workingDir,
            user: 'current-user',
            timestamp: result.timestamp,
            exitCode: result.exitCode,
            duration: result.executionTime,
            source: aliasName ? 'alias' : 'allowlist',
            stdout: result.stdout,
            stderr: result.stderr,
        });

        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// MCP (Docker MCP CLI Bridge)
// ========================================
app.post('/api/mcp/ensure', async (req, res) => {
    const { secrets = {} } = req.body || {};
    try {
        const secretCmds = [];
        if (secrets.braveApiKey) secretCmds.push(`docker mcp secret set brave BRAVE_API_KEY \"${secrets.braveApiKey}\"`);
        if (secrets.obsidianApiKey) secretCmds.push(`docker mcp secret set obsidian OBSIDIAN_API_KEY \"${secrets.obsidianApiKey}\"`);
        for (const cmd of secretCmds) {
            try { await execAsync(cmd); } catch (err) { console.warn('MCP secret set failed:', cmd, err?.message); }
        }
        if (mcpGatewayProc && !mcpGatewayProc.killed) {
            return res.json({ success: true, status: 'running' });
        }
        const child = spawn('docker', ['mcp', 'gateway', 'run'], {
            detached: true,
            stdio: 'ignore'
        });
        child.unref();
        mcpGatewayProc = child;
        child.on('exit', (code) => {
            if (mcpGatewayProc === child) mcpGatewayProc = null;
            console.log('MCP gateway exited with code', code);
        });
        res.json({ success: true, status: 'starting' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/mcp/stop', (req, res) => {
    try {
        if (mcpGatewayProc && !mcpGatewayProc.killed) {
            mcpGatewayProc.kill('SIGTERM');
            mcpGatewayProc = null;
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/mcp/status', (req, res) => {
    res.json({ success: true, running: Boolean(mcpGatewayProc && !mcpGatewayProc.killed) });
});

app.get('/api/mcp/tools', async (req, res) => {
    try {
        const { stdout, stderr } = await execAsync('docker mcp tools ls');
        res.json({ success: true, stdout, stderr });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, stdout: error.stdout, stderr: error.stderr });
    }
});

app.post('/api/mcp/call', async (req, res) => {
    try {
        const { tool, input } = req.body || {};
        if (!tool || !/^[A-Za-z0-9_.:-]+$/.test(tool)) {
            return res.status(400).json({ success: false, error: 'Invalid MCP tool name' });
        }
        const args = ['mcp', 'tools', 'call', tool];
        const child = spawn('docker', args);
        let stdout = '';
        let stderr = '';

        const killer = setTimeout(() => child.kill('SIGKILL'), 60000);

        child.stdout.on('data', (d) => stdout += d.toString());
        child.stderr.on('data', (d) => stderr += d.toString());

        child.on('error', (err) => {
            clearTimeout(killer);
            const msg = err.message || '';
            const dockerHint = 'Docker daemon not available';
            res.status(500).json({ success: false, error: msg, hint: dockerHint });
        });

        child.on('close', (code) => {
            clearTimeout(killer);
            res.json({ success: code === 0, code, stdout: stdout.trim(), stderr: stderr.trim() });
        });

        // Heuristic: for fetch tools, wrap plain URL into JSON {url}
        if (input && typeof input === 'string' && input.trim().length > 0) {
            const trimmed = input.trim();
            if (!trimmed.startsWith('{')) {
                if (tool === 'fetch' || tool === 'fetch_content') {
                    child.stdin.write(JSON.stringify({ url: trimmed }));
                } else if (tool === 'brave_web_search' || tool === 'brave_image_search' || tool === 'brave_news_search' || tool === 'brave_video_search') {
                    child.stdin.write(JSON.stringify({ q: trimmed }));
                } else if (tool === 'obsidian_search') {
                    child.stdin.write(JSON.stringify({ query: trimmed }));
                } else if (tool === 'search') {
                    child.stdin.write(JSON.stringify({ query: trimmed }));
                } else if (tool === 'obsidian_get_file_contents') {
                    child.stdin.write(JSON.stringify({ path: trimmed }));
                } else if (tool === 'get_transcript' || tool === 'get_timed_transcript' || tool === 'get_video_info') {
                    child.stdin.write(JSON.stringify({ url: trimmed }));
                } else {
                    child.stdin.write(input);
                }
            } else {
                child.stdin.write(input);
            }
        }
        child.stdin.end();
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get execution logs
app.get('/api/alias/logs', async (req, res) => {
    const limit = Number(req.query.limit) || 10;
    try {
        const logs = await executionLogger.getRecentLogs(limit);
        res.json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========================================
// ALIAS MANAGEMENT ENDPOINTS (Phase 3)
// ========================================

// Get all aliases
app.get('/api/alias/list', async (req, res) => {
    try {
        const aliases = await aliasService.getAllAliases();
        res.json({ success: true, aliases });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create alias
app.post('/api/alias/create', async (req, res) => {
    try {
        await aliasService.createAlias(req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Update alias
app.put('/api/alias/update/:name', async (req, res) => {
    try {
        await aliasService.updateAlias(req.params.name, req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Delete alias
app.delete('/api/alias/delete/:name', async (req, res) => {
    try {
        await aliasService.deleteAlias(req.params.name);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Export aliases
app.get('/api/alias/export', async (req, res) => {
    try {
        const json = await aliasService.exportAliases();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=aliases.json');
        res.send(json);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Import aliases
app.post('/api/alias/import', async (req, res) => {
    try {
        const count = await aliasService.importAliases(req.body.json);
        res.json({ success: true, importedCount: count });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Install pre-built pack
app.post('/api/alias/install-pack', async (req, res) => {
    try {
        await aliasService.installPack(req.body.packName);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
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

// Ollama API proxy (to bypass CORS and enable M3 -> M4 access)
// Ollama API proxy (to bypass CORS and enable M3 -> M4 access)
app.post('/api/ollama/*', async (req, res) => {
    try {
        const ollamaPath = req.params[0];
        const ollamaHost = req.headers['x-ollama-host'] || 'http://localhost:11434';

        // Handle both /api/ollama/chat AND /api/ollama/api/chat patterns
        const cleanPath = ollamaPath.startsWith('api/') ? ollamaPath.substring(4) : ollamaPath;

        // Try localhost first, then fallback to host.docker.internal for Docker support
        let targetUrl = `${ollamaHost}/api/${cleanPath}`;

        // If the host is localhost, we might need to try host.docker.internal if inside Docker
        if (ollamaHost.includes('localhost')) {
            try {
                // Attempt connection to localhost
                await fetch(targetUrl, { method: 'HEAD' }).catch(() => { });
            } catch (e) {
                // If it fails, we'll try the fetch and catch the error below
            }
        }

        const fetchOptions = {
            method: req.method,
            headers: { 'Content-Type': 'application/json' }
        };

        if (req.method === 'POST' && req.body) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        try {
            const response = await fetch(targetUrl, fetchOptions);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ollama API error:', response.status, errorText);
                return res.status(response.status).send(errorText);
            }

            // Stream the response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(decoder.decode(value));
            }
            res.end();

        } catch (error) {
            // If localhost failed, try host.docker.internal
            if (ollamaHost.includes('localhost') && error.cause && (error.cause.code === 'ECONNREFUSED' || error.cause.code === 'EADDRNOTAVAIL')) {
                console.log('🔄 Localhost failed, trying host.docker.internal for Docker...');
                const dockerUrl = targetUrl.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal');

                try {
                    const response = await fetch(dockerUrl, fetchOptions);

                    if (!response.ok) {
                        const errorText = await response.text();
                        return res.status(response.status).send(errorText);
                    }

                    // Stream the response
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        res.write(decoder.decode(value));
                    }
                    res.end();
                    return;
                } catch (dockerError) {
                    console.error('❌ Docker host also failed:', dockerError);
                    res.status(500).json({ error: 'Ollama connection failed on both localhost and host.docker.internal', details: dockerError });
                    return;
                }
            }
            throw error;
        }
    } catch (error) {
        console.error('❌ Ollama proxy error:', error);
        res.status(500).json({ error: error.message, cause: error.cause });
    }
});

// Ollama tags endpoint (list models) - handle both /api/ollama/tags AND /api/ollama/api/tags
app.get('/api/ollama/tags', async (req, res) => {
    try {
        const ollamaHost = req.headers['x-ollama-host'] || 'http://localhost:11434';

        // Try localhost first, then fallback to host.docker.internal for Docker support
        let targetUrl = `${ollamaHost}/api/tags`;

        // If the host is localhost, we might need to try host.docker.internal if inside Docker
        if (ollamaHost.includes('localhost')) {
            try {
                // Attempt connection to localhost
                await fetch(targetUrl, { method: 'HEAD' }).catch(() => { });
            } catch (e) {
                // If it fails, we'll try the fetch and catch the error below
            }
        }

        console.log(`🦙 Fetching Ollama models from: ${targetUrl}`);

        try {
            const response = await fetch(targetUrl);
            const data = await response.json();

            res.set('Access-Control-Allow-Origin', '*');
            res.json(data);
        } catch (error) {
            // If localhost failed, try host.docker.internal
            if (ollamaHost.includes('localhost') && error.cause && (error.cause.code === 'ECONNREFUSED' || error.cause.code === 'EADDRNOTAVAIL')) {
                console.log('🔄 Localhost failed, trying host.docker.internal for Docker...');
                const dockerUrl = targetUrl.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal');

                try {
                    const response = await fetch(dockerUrl);
                    const data = await response.json();
                    res.set('Access-Control-Allow-Origin', '*');
                    res.json(data);
                    return;
                } catch (dockerError) {
                    console.error('❌ Docker host also failed:', dockerError);
                    res.status(500).json({ error: 'Ollama connection failed on both localhost and host.docker.internal', details: dockerError });
                    return;
                }
            }
            throw error;
        }
    } catch (error) {
        console.error('❌ Ollama tags error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Ollama tags endpoint - alternate path with double "api"
app.get('/api/ollama/api/tags', async (req, res) => {
    try {
        const ollamaHost = req.headers['x-ollama-host'] || 'http://localhost:11434';

        // Try localhost first, then fallback to host.docker.internal for Docker support
        let targetUrl = `${ollamaHost}/api/tags`;

        // If the host is localhost, we might need to try host.docker.internal if inside Docker
        if (ollamaHost.includes('localhost')) {
            try {
                // Attempt connection to localhost
                await fetch(targetUrl, { method: 'HEAD' }).catch(() => { });
            } catch (e) {
                // If it fails, we'll try the fetch and catch the error below
            }
        }

        console.log(`🦙 Fetching Ollama models from: ${targetUrl} (via double-api path)`);

        try {
            const response = await fetch(targetUrl);
            const data = await response.json();

            res.set('Access-Control-Allow-Origin', '*');
            res.json(data);
        } catch (error) {
            // If localhost failed, try host.docker.internal
            if (ollamaHost.includes('localhost') && error.cause && (error.cause.code === 'ECONNREFUSED' || error.cause.code === 'EADDRNOTAVAIL')) {
                console.log('🔄 Localhost failed, trying host.docker.internal for Docker...');
                const dockerUrl = targetUrl.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal');

                try {
                    const response = await fetch(dockerUrl);
                    const data = await response.json();
                    res.set('Access-Control-Allow-Origin', '*');
                    res.json(data);
                    return;
                } catch (dockerError) {
                    console.error('❌ Docker host also failed:', dockerError);
                    res.status(500).json({ error: 'Ollama connection failed on both localhost and host.docker.internal', details: dockerError });
                    return;
                }
            }
            throw error;
        }
    } catch (error) {
        console.error('❌ Ollama tags error:', error);
        res.status(500).json({ error: error.message });
    }
});

// LM Studio API proxy (to bypass CORS)
app.all('/api/lmstudio/*', async (req, res) => {
    try {
        const lmstudioPath = req.params[0];
        const lmstudioHost = req.headers['x-lmstudio-host'] || 'http://localhost:1234';

        // Build the full URL (LM Studio uses /v1/ prefix)
        const url = `${lmstudioHost}/v1/${lmstudioPath}`;

        console.log(`🤖 Proxying LM Studio API request to: ${url}`);

        const fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Include body for POST requests
        if (req.method === 'POST' && req.body) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        try {
            const response = await fetch(url, fetchOptions);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ LM Studio API error:', response.status, errorText);
                return res.status(response.status).send(errorText);
            }

            // Set CORS headers
            res.set({
                'Access-Control-Allow-Origin': '*',
                'Content-Type': response.headers.get('content-type') || 'application/json',
                'Cache-Control': 'no-cache'
            });

            // Handle streaming responses
            if (response.headers.get('content-type')?.includes('text/event-stream') ||
                response.headers.get('transfer-encoding') === 'chunked') {
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
                    } catch (err) {
                        console.error('Stream pump error:', err);
                        res.end();
                    }
                };
                pump();
            } else {
                const data = await response.json();
                res.json(data);
            }

        } catch (error) {
            // If localhost failed, try host.docker.internal
            if (lmstudioHost.includes('localhost') && error.cause && (error.cause.code === 'ECONNREFUSED' || error.cause.code === 'EADDRNOTAVAIL')) {
                console.log('🔄 Localhost failed, trying host.docker.internal for Docker...');
                const dockerUrl = url.replace('localhost', 'host.docker.internal').replace('127.0.0.1', 'host.docker.internal');

                try {
                    const response = await fetch(dockerUrl, fetchOptions);

                    if (!response.ok) {
                        const errorText = await response.text();
                        return res.status(response.status).send(errorText);
                    }

                    // Set CORS headers
                    res.set({
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': response.headers.get('content-type') || 'application/json',
                        'Cache-Control': 'no-cache'
                    });

                    // Handle streaming responses
                    if (response.headers.get('content-type')?.includes('text/event-stream') ||
                        response.headers.get('transfer-encoding') === 'chunked') {
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
                            } catch (err) {
                                console.error('Stream pump error:', err);
                                res.end();
                            }
                        };
                        pump();
                    } else {
                        const data = await response.json();
                        res.json(data);
                    }
                    return;
                } catch (dockerError) {
                    console.error('❌ Docker host also failed:', dockerError);
                    res.status(500).json({ error: 'LM Studio connection failed on both localhost and host.docker.internal', details: dockerError });
                    return;
                }
            }
            throw error;
        }

        // Set CORS headers
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': response.headers.get('content-type') || 'application/json',
            'Cache-Control': 'no-cache'
        });

        // Handle streaming responses
        if (response.headers.get('content-type')?.includes('text/event-stream') ||
            response.headers.get('transfer-encoding') === 'chunked') {
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
                    console.log('✅ LM Studio stream completed');
                } catch (error) {
                    console.error('❌ Stream pump error:', error);
                    res.end();
                }
            };
            pump();
        } else {
            // Non-streaming response
            const data = await response.json();
            res.json(data);
        }

    } catch (error) {
        console.error('❌ LM Studio proxy error:', error);
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

// RSS/Podcast feed proxy (to bypass CORS for XML feeds)
app.get('/api/podcast/feed', async (req, res) => {
    try {
        const feedUrl = req.query.url;

        if (!feedUrl) {
            return res.status(400).json({ error: 'Missing feed URL' });
        }

        console.log('🎙️ Fetching podcast RSS feed:', feedUrl);

        const response = await fetch(feedUrl, {
            headers: {
                'User-Agent': 'RangerPlex/1.0 (Podcast Client)',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            }
        });

        if (!response.ok) {
            console.error('❌ RSS fetch failed:', response.status, response.statusText);
            return res.status(response.status).json({
                error: `Feed unavailable: ${response.statusText}`
            });
        }

        const xmlText = await response.text();

        res.set({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        });

        res.send(xmlText);
        console.log('✅ RSS feed fetched successfully');

    } catch (error) {
        console.error('❌ RSS proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Podcast audio stream proxy (for MP3 episodes)
app.get('/api/podcast/stream', async (req, res) => {
    try {
        const audioUrl = req.query.url;

        if (!audioUrl) {
            return res.status(400).json({ error: 'Missing audio URL' });
        }

        console.log('🎧 Streaming podcast episode:', audioUrl);

        const response = await fetch(audioUrl, {
            headers: {
                'User-Agent': 'RangerPlex/1.0 (Podcast Client)',
                'Accept': 'audio/mpeg, audio/mp3, audio/*;q=0.9, */*;q=0.8',
                'Range': req.headers.range || 'bytes=0-'
            }
        });

        if (!response.ok && response.status !== 206) {
            console.error('❌ Podcast stream failed:', response.status, response.statusText);
            return res.status(response.status).json({
                error: `Stream unavailable: ${response.statusText}`
            });
        }

        // Forward relevant headers
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=86400' // Cache audio for 24h
        });

        // Forward content-length and content-range if present
        if (response.headers.get('content-length')) {
            res.set('Content-Length', response.headers.get('content-length'));
        }
        if (response.headers.get('content-range')) {
            res.set('Content-Range', response.headers.get('content-range'));
            res.status(206);
        }

        // Stream the audio
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
            } catch (error) {
                console.error('❌ Podcast stream pump error:', error);
                res.end();
            }
        };
        pump();

    } catch (error) {
        console.error('❌ Podcast stream error:', error);
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

// Company Registry Lookup (Companies House primary, OpenCorporates fallback)
app.post('/api/tools/company', async (req, res) => {
    try {
        const { query, country, chApiKey, ocApiKey } = req.body;
        if (!query) return res.status(400).json({ error: 'Missing company query' });

        const normalizedCountry = (country || 'uk').toLowerCase();
        const preferCompaniesHouse = normalizedCountry === 'uk' || normalizedCountry === 'gb' || !country;
        const sanitizedQuery = String(query).trim();

        const looksLikeNumber = (candidate) => /^[A-Za-z0-9]{6,12}$/.test(candidate.replace(/\s+/g, ''));
        const formatAddress = (addr) => {
            if (!addr || typeof addr !== 'object') return null;
            const parts = [
                addr.address_line_1,
                addr.address_line_2,
                addr.premises,
                addr.locality,
                addr.region,
                addr.postal_code,
                addr.country
            ].filter(Boolean);
            return parts.join(', ');
        };

        const companiesHouseLookup = async () => {
            if (!chApiKey) return null;
            const base = 'https://api.company-information.service.gov.uk';
            const authHeader = { Authorization: 'Basic ' + Buffer.from(`${chApiKey}:`).toString('base64') };

            let companyNumber = looksLikeNumber(sanitizedQuery) ? sanitizedQuery.replace(/\s+/g, '') : null;
            let matchedFromSearch = false;
            let matchedName = null;

            // Search by name when no clean number provided
            if (!companyNumber) {
                const searchRes = await fetch(`${base}/search/companies?q=${encodeURIComponent(sanitizedQuery)}&items_per_page=5`, { headers: authHeader });
                if (!searchRes.ok) {
                    const msg = await searchRes.text();
                    return { error: `Companies House search failed (${searchRes.status}): ${msg}` };
                }
                const searchData = await searchRes.json();
                const top = searchData?.items?.[0];
                if (top) {
                    companyNumber = top.company_number;
                    matchedFromSearch = true;
                    matchedName = top.title;
                }
            }

            if (!companyNumber) {
                return { status: 'not_found', source: 'companies_house', country: normalizedCountry, query: sanitizedQuery };
            }

            // Company profile
            const companyRes = await fetch(`${base}/company/${companyNumber}`, { headers: authHeader });
            if (!companyRes.ok) {
                const msg = await companyRes.text();
                return { error: `Companies House lookup failed (${companyRes.status}): ${msg}` };
            }
            const company = await companyRes.json();

            // Parallel officer + PSC + filing pulls (best-effort)
            const [officers, pscs, filings] = await Promise.all([
                fetch(`${base}/company/${companyNumber}/officers?items_per_page=10`, { headers: authHeader })
                    .then(r => r.ok ? r.json() : null)
                    .then(d => d?.items || [])
                    .catch(() => []),
                fetch(`${base}/company/${companyNumber}/persons-with-significant-control?items_per_page=10`, { headers: authHeader })
                    .then(r => r.ok ? r.json() : null)
                    .then(d => d?.items || [])
                    .catch(() => []),
                fetch(`${base}/company/${companyNumber}/filing-history?items_per_page=5`, { headers: authHeader })
                    .then(r => r.ok ? r.json() : null)
                    .then(d => d?.items || [])
                    .catch(() => [])
            ]);

            return {
                status: 'ok',
                source: 'companies_house',
                country: normalizedCountry,
                query: sanitizedQuery,
                matchedFromSearch,
                company: {
                    name: company.company_name || matchedName,
                    number: company.company_number || companyNumber,
                    status: company.company_status,
                    category: company.type,
                    jurisdiction: company.jurisdiction || 'uk',
                    incorporation_date: company.date_of_creation,
                    dissolution_date: company.date_of_cessation,
                    address: formatAddress(company.registered_office_address),
                    sic_codes: company.sic_codes || [],
                    last_accounts: company.accounts?.last_accounts?.made_up_to,
                    last_confirmation_statement: company.confirmation_statement?.last_made_up_to,
                    has_insolvency_history: company.has_insolvency_history
                },
                officers: officers.map((o) => ({
                    name: o.name,
                    role: o.officer_role,
                    appointed_on: o.appointed_on,
                    resigned_on: o.resigned_on,
                    nationality: o.nationality,
                    country_of_residence: o.country_of_residence
                })),
                pscs: pscs.map((p) => ({
                    name: p.name,
                    natures_of_control: p.natures_of_control,
                    notified_on: p.notified_on,
                    ceased_on: p.ceased_on
                })),
                filings: filings.map((f) => ({
                    type: f.type,
                    category: f.category,
                    description: f.description || f.description_values?.description,
                    date: f.date
                }))
            };
        };

        const openCorporatesLookup = async (reason = 'direct') => {
            if (!ocApiKey) return null;

            const base = 'https://api.opencorporates.com/v0.4';
            const searchUrl = `${base}/companies/search?q=${encodeURIComponent(sanitizedQuery)}${normalizedCountry ? `&jurisdiction_code=${normalizedCountry}` : ''}&api_token=${ocApiKey}`;

            const searchRes = await fetch(searchUrl);
            if (!searchRes.ok) {
                const msg = await searchRes.text();
                return { error: `OpenCorporates search failed (${searchRes.status}): ${msg}` };
            }

            const searchData = await searchRes.json();
            const company = searchData?.results?.companies?.[0]?.company;

            if (!company) {
                return { status: 'not_found', source: 'opencorporates', country: normalizedCountry, query: sanitizedQuery, usedFallback: reason !== 'direct' };
            }

            return {
                status: 'ok',
                source: 'opencorporates',
                country: normalizedCountry,
                query: sanitizedQuery,
                usedFallback: reason !== 'direct',
                company: {
                    name: company.name,
                    number: company.company_number,
                    status: company.current_status,
                    incorporation_date: company.incorporation_date,
                    dissolution_date: company.dissolution_date,
                    jurisdiction: company.jurisdiction_code,
                    address: company.registered_address || company.registered_address_in_full,
                    industry_codes: company.industry_codes,
                    opencorporates_url: company.opencorporates_url
                }
            };
        };

        // Primary preference: Companies House for UK queries (when key present)
        if (preferCompaniesHouse && chApiKey) {
            const result = await companiesHouseLookup();
            if (result) {
                if (result.error) return res.status(400).json(result);
                return res.json(result);
            }
        }

        // Fallback to OpenCorporates if UK key missing or non-UK query
        if (ocApiKey) {
            const result = await openCorporatesLookup(preferCompaniesHouse ? 'fallback_no_ch_key' : 'direct');
            if (result) {
                if (result.error) return res.status(400).json(result);
                return res.json(result);
            }
        }

        // If still nothing, try Companies House even when non-UK but key exists
        if (!preferCompaniesHouse && chApiKey) {
            const result = await companiesHouseLookup();
            if (result) {
                if (result.error) return res.status(400).json(result);
                return res.json(result);
            }
        }

        res.status(400).json({
            error: 'API key required. Add a Companies House key (UK) or OpenCorporates API token in Settings > Providers.'
        });
    } catch (error) {
        console.error('❌ Company lookup error:', error);
        res.status(500).json({ error: error.message || 'Company lookup failed' });
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

// 13. LM Studio Proxy
app.post('/api/tools/lmstudio', async (req, res) => {
    try {
        console.log('🔍 LM Studio Proxy Request');

        // Try localhost first, then fallback to host.docker.internal for Docker support
        let targetUrl = 'http://localhost:1234/v1/models';
        try {
            const response = await fetch(targetUrl);
            const data = await response.json();
            res.json(data);
        } catch (error) {
            // If localhost failed, try host.docker.internal
            if (error.cause && (error.cause.code === 'ECONNREFUSED' || error.cause.code === 'EADDRNOTAVAIL')) {
                console.log('🔄 Localhost failed, trying host.docker.internal for Docker...');
                targetUrl = 'http://host.docker.internal:1234/v1/models';
                try {
                    const response = await fetch(targetUrl);
                    const data = await response.json();
                    res.json(data);
                    return;
                } catch (dockerError) {
                    console.error('❌ Docker host also failed:', dockerError);
                    res.status(500).json({ error: 'LM Studio connection failed on both localhost and host.docker.internal', details: dockerError });
                    return;
                }
            }
            console.error('❌ LM Studio proxy error:', error);
            res.status(500).json({ error: error.message, cause: error.cause });
        }
    } catch (error) {
        console.error('❌ LM Studio proxy setup error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Privacy Snapshot (IP + ISP + request headers)
app.post('/api/tools/privacy', async (req, res) => {
    try {
        console.log('🛡️ Privacy Snapshot Request');

        const clientHeaders = req.headers || {};
        const clientReportedIp = (() => {
            const xfwd = clientHeaders['x-forwarded-for'];
            if (xfwd) return xfwd.split(',')[0].trim();
            if (clientHeaders['x-real-ip']) return clientHeaders['x-real-ip'];
            return null;
        })();

        // Fetch public IP
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipJson = await ipRes.json();
        const publicIp = ipJson.ip;

        // Geo / ISP intel
        const geoRes = await fetch(`http://ip-api.com/json/${publicIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,query`);
        const geo = await geoRes.json();

        const headerPick = (key) => clientHeaders[key] || null;

        res.json({
            status: geo.status === 'success' ? 'ok' : 'partial',
            ip: {
                public: publicIp,
                clientReported: clientReportedIp,
                source: 'ipify.org',
                note: clientReportedIp && clientReportedIp !== publicIp ? 'client vs public mismatch (proxy/VPN?)' : undefined
            },
            network: geo.status === 'success' ? {
                country: geo.country,
                countryCode: geo.countryCode,
                region: geo.regionName || geo.region,
                city: geo.city,
                zip: geo.zip,
                lat: geo.lat,
                lon: geo.lon,
                timezone: geo.timezone,
                isp: geo.isp,
                org: geo.org,
                asn: geo.as,
                asName: geo.asname
            } : { error: geo.message || 'Geo lookup failed' },
            headers: {
                'user-agent': headerPick('user-agent'),
                'accept-language': headerPick('accept-language'),
                'accept': headerPick('accept'),
                'accept-encoding': headerPick('accept-encoding'),
                'dnt': headerPick('dnt'),
                'referer': headerPick('referer'),
                'sec-ch-ua': headerPick('sec-ch-ua'),
                'sec-ch-ua-platform': headerPick('sec-ch-ua-platform'),
                'sec-ch-ua-mobile': headerPick('sec-ch-ua-mobile'),
                'sec-fetch-site': headerPick('sec-fetch-site'),
                'sec-fetch-mode': headerPick('sec-fetch-mode'),
                'sec-fetch-dest': headerPick('sec-fetch-dest'),
                'sec-fetch-user': headerPick('sec-fetch-user'),
                'upgrade-insecure-requests': headerPick('upgrade-insecure-requests'),
                'x-forwarded-for': headerPick('x-forwarded-for'),
                'x-real-ip': headerPick('x-real-ip')
            },
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('❌ Privacy snapshot error:', error);
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

        const response = await fetch(`https://emailreputation.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`);
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

        // Check for rate limit errors
        if (text.includes('API count exceeded') || text.includes('Quota') || text.includes('rate limit')) {
            return res.json({
                status: 'rate_limited',
                ip: ip,
                domains: [],
                total_domains: 0,
                message: 'HackerTarget API rate limit reached. The free tier has limited requests per day. Try again later or consider using an alternative service.',
                source: 'HackerTarget (Free)',
                error_type: 'rate_limit'
            });
        }

        // Check for other errors
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
        const domains = text.trim().split('\n').filter(d => d.length > 0 && !d.includes('error') && !d.includes('API count') && !d.includes('Quota'));

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

// Port Scanner (TCP connect - top/common ports)
app.post('/api/tools/ports', async (req, res) => {
    const start = Date.now();
    try {
        const { target, ports } = req.body;
        if (!target) {
            return res.status(400).json({ error: 'Target IP or hostname is required' });
        }

        const cleanTarget = String(target).trim();

        // Resolve hostnames to IPs (allow raw IP input)
        let resolvedIp = cleanTarget;
        if (!net.isIP(cleanTarget)) {
            try {
                const lookupResult = await lookup(cleanTarget);
                resolvedIp = lookupResult.address;
            } catch (err) {
                return res.status(400).json({ error: 'Invalid IP/hostname. Unable to resolve.' });
            }
        }

        // Sanitize ports: allow comma-separated string or array of numbers
        const defaultPorts = [21, 22, 23, 25, 53, 80, 110, 111, 123, 135, 139, 143, 161, 389, 443, 445, 465, 514, 587, 636, 993, 995, 1433, 1521, 1723, 2049, 2082, 2083, 2087, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9000, 9200, 10000, 27017];
        const parsePorts = (value) => {
            if (Array.isArray(value)) return value;
            if (typeof value === 'string') {
                return value.split(',').map(p => p.trim()).filter(Boolean);
            }
            return [];
        };

        const rawPorts = parsePorts(ports);
        const sanitizedPorts = (rawPorts.length ? rawPorts : defaultPorts)
            .map(p => Number(p))
            .filter(p => Number.isInteger(p) && p > 0 && p <= 65535);

        // Prevent abuse: limit to 100 ports max
        const uniquePorts = Array.from(new Set(sanitizedPorts)).slice(0, 100);
        if (uniquePorts.length === 0) {
            return res.status(400).json({ error: 'No valid ports provided. Use comma-separated numbers or leave empty for defaults.' });
        }

        const commonServices = {
            21: 'FTP',
            22: 'SSH',
            23: 'Telnet',
            25: 'SMTP',
            53: 'DNS',
            80: 'HTTP',
            110: 'POP3',
            111: 'RPC',
            123: 'NTP',
            135: 'RPC',
            139: 'SMB',
            143: 'IMAP',
            161: 'SNMP',
            389: 'LDAP',
            443: 'HTTPS',
            445: 'SMB',
            465: 'SMTPS',
            514: 'Syslog',
            587: 'SMTP Submission',
            636: 'LDAPS',
            993: 'IMAPS',
            995: 'POP3S',
            1433: 'MSSQL',
            1521: 'Oracle DB',
            1723: 'PPTP',
            2049: 'NFS',
            2082: 'cPanel',
            2083: 'cPanel (SSL)',
            2087: 'WHM',
            3306: 'MySQL',
            3389: 'RDP',
            5432: 'PostgreSQL',
            5900: 'VNC',
            6379: 'Redis',
            8080: 'HTTP-Alt/Proxy',
            8443: 'HTTPS-Alt',
            9000: 'App/Dev',
            9200: 'Elasticsearch',
            10000: 'Webmin',
            27017: 'MongoDB'
        };

        const scanPort = (host, port, timeout = 1200) => {
            return new Promise(resolve => {
                const socket = new net.Socket();
                const startTime = Date.now();
                let status = 'closed';
                let errorCode = '';

                socket.setTimeout(timeout);

                socket.once('connect', () => {
                    status = 'open';
                    socket.destroy();
                });

                socket.once('timeout', () => {
                    status = 'filtered';
                    socket.destroy();
                });

                socket.once('error', (err) => {
                    errorCode = err.code || 'ERROR';
                    if (err.code === 'ECONNREFUSED') status = 'closed';
                    else if (err.code === 'EHOSTUNREACH' || err.code === 'ENETUNREACH') status = 'filtered';
                    socket.destroy();
                });

                socket.once('close', () => {
                    resolve({
                        port,
                        status,
                        latency_ms: Date.now() - startTime,
                        service: commonServices[port] || 'Unknown',
                        error: errorCode
                    });
                });

                socket.connect(port, host);
            });
        };

        const results = await Promise.all(uniquePorts.map(p => scanPort(resolvedIp, p)));
        const openPorts = results.filter(r => r.status === 'open');
        const filteredPorts = results.filter(r => r.status === 'filtered');

        res.json({
            target: cleanTarget,
            resolved_ip: resolvedIp,
            scanned_ports: uniquePorts,
            open_ports: openPorts,
            open_count: openPorts.length,
            filtered_count: filteredPorts.length,
            closed_count: results.length - openPorts.length - filteredPorts.length,
            total_scanned: uniquePorts.length,
            duration_ms: Date.now() - start,
            disclaimer: 'Port scanning requires authorization. Only scan systems you have explicit permission to test.',
            source: 'Native TCP connect'
        });

    } catch (error) {
        console.error('❌ Port scan error:', error);
        res.status(500).json({ error: error.message || 'Port scan failed' });
    }
});

// Traceroute
app.post('/api/tools/trace', async (req, res) => {
    try {
        const { target } = req.body;
        if (!target) return res.status(400).json({ error: 'Target domain or IP is required' });

        const cleanTarget = String(target).trim();
        const safeTarget = cleanTarget.replace(/[^a-zA-Z0-9:.\-]/g, '');
        if (!safeTarget || safeTarget !== cleanTarget) {
            return res.status(400).json({ error: 'Invalid target. Use domain or IP only.' });
        }

        const isWin = process.platform === 'win32';
        const cmd = isWin ? 'tracert' : 'traceroute';
        const args = isWin ? ['-d', '-h', '20', cleanTarget] : ['-m', '20', '-q', '1', cleanTarget];

        const stdoutChunks = [];
        const stderrChunks = [];

        const child = spawn(cmd, args);

        const killer = setTimeout(() => {
            child.kill('SIGKILL');
        }, 20000);

        child.stdout.on('data', (d) => stdoutChunks.push(d.toString()));
        child.stderr.on('data', (d) => stderrChunks.push(d.toString()));

        child.on('error', (err) => {
            clearTimeout(killer);
            console.error('❌ Traceroute spawn error:', err);
            res.status(500).json({ error: `Traceroute command failed: ${err.message}` });
        });

        child.on('close', (code) => {
            clearTimeout(killer);
            const stdout = stdoutChunks.join('');
            const stderr = stderrChunks.join('');

            if (!stdout && stderr) {
                return res.status(500).json({ error: `Traceroute failed: ${stderr.trim() || 'Unknown error'}` });
            }

            const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
            const hops = [];

            const hopRegex = /^\d+\s+/;

            lines.forEach((line) => {
                if (!hopRegex.test(line)) return;
                const numMatch = line.match(/^(\d+)/);
                const hopNum = numMatch ? parseInt(numMatch[1], 10) : null;

                const isTimeout = line.includes('*');
                let ip = null;
                let host = null;
                const ipMatch = line.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
                if (ipMatch) {
                    ip = ipMatch[1];
                    const hostMatch = line.match(/^\d+\s+([^\s(]+)?/);
                    host = hostMatch && hostMatch[1] && hostMatch[1] !== ip ? hostMatch[1] : null;
                }

                const rttMatch = line.match(/(\d+(?:\.\d+)?)\s*ms/);
                const rtt = rttMatch ? parseFloat(rttMatch[1]) : null;

                hops.push({
                    hop: hopNum,
                    host: host || (ip && !isTimeout ? ip : null),
                    ip: ip || null,
                    rtt_ms: isTimeout ? null : rtt,
                    status: isTimeout ? 'timeout' : 'ok'
                });
            });

            if (hops.length === 0) {
                return res.status(500).json({ error: stderr.trim() || 'Traceroute produced no output' });
            }

            res.json({
                target: cleanTarget,
                total_hops: hops.length,
                hops,
                source: cmd,
                note: code !== 0 ? `Traceroute exited with code ${code}` : undefined
            });
        });
    } catch (error) {
        console.error('❌ Traceroute error:', error);
        res.status(500).json({ error: error.message || 'Traceroute failed' });
    }
});

// Nmap Port Scanner (/nmap)
app.post('/api/tools/nmap', async (req, res) => {
    try {
        const { target, flags } = req.body;
        if (!target) return res.status(400).json({ error: 'Target IP or hostname is required' });

        const cleanTarget = String(target).trim();

        // Sanitize target (prevent command injection)
        const safeTarget = cleanTarget.replace(/[^a-zA-Z0-9:.\-]/g, '');
        if (!safeTarget || safeTarget !== cleanTarget) {
            return res.status(400).json({ error: 'Invalid target. Use IP or hostname only.' });
        }

        // Whitelist safe nmap flags only
        const whitelistFlags = ['-A', '-sV', '-sC', '-p-', '-Pn', '-T4', '-v', '-p'];
        const parsedFlags = [];

        if (flags) {
            const flagArray = String(flags).trim().split(/\s+/);
            for (let i = 0; i < flagArray.length; i++) {
                const flag = flagArray[i];

                // Check if flag is whitelisted
                if (whitelistFlags.includes(flag)) {
                    parsedFlags.push(flag);

                    // If -p flag, get the port specification (next argument)
                    if (flag === '-p' && i + 1 < flagArray.length) {
                        const portSpec = flagArray[i + 1];
                        // Sanitize port specification (allow numbers, commas, hyphens only)
                        if (/^[0-9,\-]+$/.test(portSpec)) {
                            parsedFlags.push(portSpec);
                            i++; // Skip next argument
                        }
                    }
                } else if (flag.startsWith('-p') && /^-p[0-9,\-]+$/.test(flag)) {
                    // Handle combined -p80,443 format
                    parsedFlags.push(flag);
                }
            }
        }

        // Build nmap command
        const args = [...parsedFlags, safeTarget];

        console.log(`🔍 Running nmap scan: nmap ${args.join(' ')}`);

        const stdoutChunks = [];
        const stderrChunks = [];

        const child = spawn('nmap', args);

        // 60 second timeout for scans
        const killer = setTimeout(() => {
            child.kill('SIGKILL');
        }, 60000);

        child.stdout.on('data', (d) => stdoutChunks.push(d.toString()));
        child.stderr.on('data', (d) => stderrChunks.push(d.toString()));

        child.on('error', (err) => {
            clearTimeout(killer);
            console.error('❌ Nmap spawn error:', err);

            if (err.code === 'ENOENT') {
                return res.status(500).json({
                    error: 'Nmap is not installed. Install with: brew install nmap (Mac) or apt install nmap (Linux)'
                });
            }

            res.status(500).json({ error: `Nmap command failed: ${err.message}` });
        });

        child.on('close', (code) => {
            clearTimeout(killer);
            const stdout = stdoutChunks.join('');
            const stderr = stderrChunks.join('');

            if (!stdout && stderr) {
                return res.status(500).json({ error: `Nmap failed: ${stderr.trim() || 'Unknown error'}` });
            }

            // Parse nmap output for structured data
            const lines = stdout.split('\n');
            const openPorts = [];
            let scanInfo = {};

            lines.forEach((line) => {
                // Extract open ports (format: "22/tcp   open  ssh")
                const portMatch = line.match(/^(\d+)\/(tcp|udp)\s+(open|filtered|closed)\s+(.+)$/);
                if (portMatch) {
                    openPorts.push({
                        port: parseInt(portMatch[1]),
                        protocol: portMatch[2],
                        state: portMatch[3],
                        service: portMatch[4].trim()
                    });
                }

                // Extract scan info
                if (line.includes('Nmap scan report for')) {
                    scanInfo.target = line.replace('Nmap scan report for ', '').trim();
                }
                if (line.includes('Host is up')) {
                    const latencyMatch = line.match(/\((.+?) latency\)/);
                    if (latencyMatch) {
                        scanInfo.latency = latencyMatch[1];
                    }
                }
                if (line.includes('OS details:')) {
                    scanInfo.os = line.replace('OS details:', '').trim();
                }
            });

            res.json({
                target: cleanTarget,
                flags: parsedFlags.join(' ') || 'default',
                scan_info: scanInfo,
                open_ports: openPorts,
                total_open: openPorts.filter(p => p.state === 'open').length,
                raw_output: stdout,
                exit_code: code,
                note: code !== 0 ? `Nmap exited with code ${code}` : undefined
            });
        });
    } catch (error) {
        console.error('❌ Nmap error:', error);
        res.status(500).json({ error: error.message || 'Nmap scan failed' });
    }
});

// Chuck Norris Jokes (api.chucknorris.io)
app.post('/api/fun/chuck', async (req, res) => {
    try {
        console.log('🥋 Fetching Chuck Norris fact...');

        const apiUrl = 'https://api.chucknorris.io/jokes/random';
        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Chuck Norris API error ${response.status}:`, errorText);
            throw new Error(`Chuck Norris API returned ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const body = await response.text();
            console.error('❌ Chuck Norris API returned non-JSON:', body.substring(0, 200));
            throw new Error('API returned non-JSON response');
        }

        const data = await response.json();

        res.json({
            success: true,
            joke: data.value,
            id: data.id,
            icon_url: data.icon_url,
            url: data.url,
            categories: data.categories || [],
            sources: [
                { name: 'Chuck Norris Jokes API', url: 'https://api.chucknorris.io/' },
                { name: 'GitHub - chucknorris-io/chuck-api', url: 'https://github.com/chucknorris-io/chuck-api' },
                { name: 'Free Public APIs - Chuck Norris', url: 'https://www.freepublicapis.com/chuck-norris-jokes-api' }
            ]
        });

        console.log(`✅ Chuck Norris fact retrieved: ${data.id}`);
    } catch (error) {
        console.error('❌ Chuck Norris API error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch Chuck Norris fact',
            fallback: "Chuck Norris doesn't need APIs. APIs call Chuck Norris."
        });
    }
});

// Random Jokes (Official Joke API + icanhazdadjoke)
app.post('/api/fun/joke', async (req, res) => {
    try {
        console.log('😂 Fetching random joke...');

        // Try Official Joke API first (has setup/punchline format)
        const apiUrl = 'https://official-joke-api.appspot.com/jokes/random';
        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Joke API error ${response.status}:`, errorText);
            throw new Error(`Joke API returned ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const body = await response.text();
            console.error('❌ Joke API returned non-JSON:', body.substring(0, 200));
            throw new Error('API returned non-JSON response');
        }

        const data = await response.json();

        res.json({
            success: true,
            type: data.type || 'general',
            setup: data.setup || '',
            punchline: data.punchline || '',
            id: data.id,
            sources: [
                { name: 'Official Joke API', url: 'https://official-joke-api.appspot.com/' },
                { name: 'GitHub - Official Joke API', url: 'https://github.com/15Dkatz/official_joke_api' },
                { name: 'icanhazdadjoke API', url: 'https://icanhazdadjoke.com/api' }
            ]
        });

        console.log(`✅ Joke retrieved: ${data.id} (${data.type})`);
    } catch (error) {
        console.error('❌ Joke API error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch joke',
            fallback: {
                setup: "Why do programmers prefer dark mode?",
                punchline: "Because light attracts bugs!"
            }
        });
    }
});

// Random Bible Verse (bible-api.com)
app.post('/api/fun/bible', async (req, res) => {
    try {
        console.log('📖 Fetching random Bible verse...');
        const apiUrl = 'https://bible-api.com/?random=verse';
        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Bible API error ${response.status}:`, errorText);
            throw new Error(`Bible API returned ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const body = await response.text();
            console.error('❌ Bible API returned non-JSON:', body.substring(0, 200));
            throw new Error('API returned non-JSON response');
        }

        const data = await response.json();

        res.json({
            success: true,
            reference: data.reference,
            text: data.text,
            verses: data.verses || [],
            translation: data.translation_name || 'World English Bible',
            translationNote: data.translation_note || 'Public Domain',
            sources: [
                { name: 'Bible API', url: 'https://bible-api.com/' },
                { name: 'GitHub - Bible API', url: 'https://github.com/wldeh/bible-api' },
                { name: 'NET Bible Web Service', url: 'https://labs.bible.org/api_web_service' }
            ]
        });
    } catch (error) {
        console.error('❌ Bible verse fetch error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch Bible verse',
            fallback: {
                reference: "John 3:16",
                text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life."
            }
        });
    }
});

// Certificate Transparency Lookup (crt.sh)
app.post('/api/tools/certs', async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.status(400).json({ error: 'Domain is required' });

        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
        console.log('📜 Certificate Transparency Lookup:', cleanDomain);

        const crtUrl = `https://crt.sh/?q=${encodeURIComponent(cleanDomain)}&output=json`;
        const response = await fetch(crtUrl, {
            headers: { 'User-Agent': 'RangerPlex-OSINT/2.5.19' }
        });

        if (!response.ok) {
            return res.status(500).json({ error: `crt.sh returned status ${response.status}` });
        }

        const raw = await response.text();
        let data;
        try {
            data = JSON.parse(raw);
        } catch (err) {
            console.error('crt.sh non-JSON response preview:', raw.slice(0, 200));
            return res.status(500).json({ error: 'crt.sh returned non-JSON response. Try again later.' });
        }

        const names = new Set();
        const wildcards = new Set();
        const issuers = {};
        const certificates = [];
        let firstSeen = null;
        let lastSeen = null;

        data.forEach((cert) => {
            const entryTime = cert.entry_timestamp ? new Date(cert.entry_timestamp).getTime() : null;
            if (entryTime) {
                if (!firstSeen || entryTime < firstSeen) firstSeen = entryTime;
                if (!lastSeen || entryTime > lastSeen) lastSeen = entryTime;
            }

            const nameValues = cert.name_value ? cert.name_value.split('\n') : [];
            nameValues.forEach((raw) => {
                const n = raw.trim().toLowerCase();
                if (!n || !n.endsWith(cleanDomain)) return;
                if (n.startsWith('*.')) wildcards.add(n);
                else names.add(n);
            });

            if (cert.issuer_name) {
                issuers[cert.issuer_name] = (issuers[cert.issuer_name] || 0) + 1;
            }

            certificates.push({
                id: cert.id,
                logged_at: cert.entry_timestamp,
                not_before: cert.not_before,
                not_after: cert.not_after,
                issuer: cert.issuer_name,
                serial_number: cert.serial_number
            });
        });

        // Limit certificates to avoid overly large payloads
        const trimmedCerts = certificates.slice(0, 150);

        res.json({
            domain: cleanDomain,
            total_certificates: data.length,
            unique_names: Array.from(names).sort(),
            wildcards: Array.from(wildcards).sort(),
            total_names: names.size,
            total_wildcards: wildcards.size,
            issuers,
            certificates: trimmedCerts,
            first_seen: firstSeen,
            last_seen: lastSeen,
            note: data.length > trimmedCerts.length ? 'Certificate list truncated for size' : null,
            source: 'crt.sh'
        });
    } catch (error) {
        console.error('❌ Certificate Transparency error:', error);
        res.status(500).json({ error: error.message || 'Certificate lookup failed' });
    }
});

// Hash Lookup (VirusTotal)
app.post('/api/tools/hash', async (req, res) => {
    try {
        const { hash, apiKey } = req.body;
        if (!hash) return res.status(400).json({ error: 'Hash is required' });
        if (!apiKey) return res.status(400).json({ error: 'VirusTotal API key required' });

        const normalizedHash = hash.trim().toLowerCase();
        const hashRegex = /^[a-f0-9]{32,128}$/;
        if (!hashRegex.test(normalizedHash)) {
            return res.status(400).json({ error: 'Invalid hash format. Use MD5, SHA1, SHA256, or SHA512 hex.' });
        }

        console.log('🧬 Hash Lookup:', normalizedHash);

        const vtUrl = `https://www.virustotal.com/api/v3/files/${encodeURIComponent(normalizedHash)}`;
        const response = await fetch(vtUrl, {
            headers: {
                'x-apikey': apiKey,
                'accept': 'application/json'
            }
        });

        if (response.status === 404) {
            return res.json({ status: 'not_found', hash: normalizedHash, source: 'VirusTotal' });
        }

        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).json({ error: `VirusTotal error ${response.status}: ${text}` });
        }

        const data = await response.json();
        const attr = data?.data?.attributes || {};
        const stats = attr.last_analysis_stats || {};
        const names = Array.isArray(attr.names) ? attr.names.slice(0, 10) : [];

        res.json({
            status: 'found',
            hash: normalizedHash,
            stats,
            reputation: attr.reputation,
            first_submission: attr.first_submission_date ? attr.first_submission_date * 1000 : null,
            last_modification: attr.last_modification_date ? attr.last_modification_date * 1000 : null,
            type_description: attr.type_description,
            size: attr.size,
            names,
            md5: attr.md5,
            sha1: attr.sha1,
            sha256: attr.sha256,
            source: 'VirusTotal'
        });
    } catch (error) {
        console.error('❌ Hash lookup error:', error);
        res.status(500).json({ error: error.message || 'Hash lookup failed' });
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

// Screenshot Capture Tool
app.post('/api/tools/screenshot', async (req, res) => {
    let browser = null;
    try {
        const { url, fullPage = false, width = 1920, height = 1080 } = req.body;
        console.log('📸 Screenshot Request:', url);

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL format
        let targetUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            targetUrl = 'https://' + url;
        }

        console.log('🌐 Capturing screenshot of:', targetUrl);
        console.log('📐 Dimensions:', `${width}x${height}`, fullPage ? '(Full Page)' : '(Viewport)');

        // Launch Puppeteer
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080'
            ]
        });

        const page = await browser.newPage();

        // Set viewport
        await page.setViewport({
            width: parseInt(width),
            height: parseInt(height)
        });

        // Set user agent to avoid bot detection
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate to URL with timeout
        try {
            await page.goto(targetUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
        } catch (navError) {
            // If networkidle2 times out, try with just 'load'
            console.log('⚠️ Navigation timeout, retrying with load event...');
            await page.goto(targetUrl, {
                waitUntil: 'load',
                timeout: 30000
            });
        }

        // Get page title
        const pageTitle = await page.title();

        // Take screenshot
        const screenshotBuffer = await page.screenshot({
            fullPage: fullPage,
            type: 'png'
        });

        // Convert buffer to base64
        const base64Image = screenshotBuffer.toString('base64');

        // Get page info
        const pageInfo = await page.evaluate(() => {
            return {
                width: document.documentElement.scrollWidth,
                height: document.documentElement.scrollHeight,
                url: window.location.href
            };
        });

        await browser.close();
        browser = null;

        console.log('✅ Screenshot captured successfully');

        res.json({
            status: 'success',
            url: targetUrl,
            title: pageTitle,
            image: `data:image/png;base64,${base64Image}`,
            pageInfo: {
                width: pageInfo.width,
                height: pageInfo.height,
                finalUrl: pageInfo.url
            },
            capturedAt: Date.now(),
            viewport: {
                width: parseInt(width),
                height: parseInt(height)
            },
            fullPage: fullPage
        });

    } catch (error) {
        console.error('❌ Screenshot error:', error);

        if (browser) {
            await browser.close();
        }

        res.status(500).json({
            error: error.message,
            details: 'Failed to capture screenshot. The URL may be unreachable or blocked.'
        });
    }
});

// ASN Lookup (Autonomous System Number)
app.post('/api/tools/asn', async (req, res) => {
    try {
        const { query } = req.body;
        console.log('🌐 ASN Lookup Request:', query);

        if (!query) {
            return res.status(400).json({ error: 'ASN or IP address is required' });
        }

        const cleanQuery = query.trim();

        // HackerTarget ASN Lookup API (free, no key required)
        const apiUrl = `https://api.hackertarget.com/aslookup/?q=${encodeURIComponent(cleanQuery)}`;

        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'RangerPlex-OSINT/2.5.20'
            }
        });

        const textData = await response.text();

        // Check for errors
        if (textData.includes('error') || textData.includes('invalid')) {
            return res.json({
                status: 'not_found',
                query: cleanQuery,
                message: 'No ASN data found for this query'
            });
        }

        // Parse the response (format: "IP","ASN","Network","Name")
        const lines = textData.trim().split('\n').filter(line => line.length > 0);

        if (lines.length === 0) {
            return res.json({
                status: 'not_found',
                query: cleanQuery,
                message: 'No ASN data found'
            });
        }

        const entries = [];
        let primaryASN = null;
        let primaryOrg = null;
        const ipRanges = [];
        const organizations = new Set();

        for (const line of lines) {
            // Parse CSV format: "IP","ASN","Network","Name"
            const matches = line.match(/"([^"]*)"/g);
            if (!matches || matches.length < 4) continue;

            const ip = matches[0].replace(/"/g, '');
            const asn = matches[1].replace(/"/g, '');
            const network = matches[2].replace(/"/g, '');
            const name = matches[3].replace(/"/g, '');

            // Store first ASN as primary
            if (!primaryASN) {
                primaryASN = 'AS' + asn;
                primaryOrg = name;
            }

            ipRanges.push(network);
            organizations.add(name);

            entries.push({
                ip: ip,
                asn: 'AS' + asn,
                network: network,
                organization: name
            });
        }

        res.json({
            status: 'found',
            query: cleanQuery,
            primary_asn: primaryASN,
            organization: primaryOrg,
            total_ranges: ipRanges.length,
            ip_ranges: ipRanges,
            organizations: Array.from(organizations),
            entries: entries,
            source: 'HackerTarget ASN Lookup'
        });

    } catch (error) {
        console.error('❌ ASN Lookup error:', error);
        res.status(500).json({ error: error.message || 'ASN lookup failed' });
    }
});


// WebSocket Server
const server = createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set();
const terminalSessions = new Map(); // Map of ws -> ptyProcess

wss.on('connection', (ws, req) => {
    const pathname = req.url;

    // Route: /terminal - Terminal sessions
    if (pathname === '/terminal') {
        console.log('🖥️  Terminal WebSocket connected');

        // Detect shell (prefer user's shell, fallback to bash/sh)
        const shell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : 'bash');

        // Spawn pty process
        const ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
            cwd: process.env.HOME || process.cwd(),
            env: {
                ...process.env,
                RANGER_CONSOLE: '1',
                TERM: 'xterm-256color'
            }
        });

        // Store session
        terminalSessions.set(ws, ptyProcess);

        // Backend -> Frontend: Send pty output to WebSocket
        ptyProcess.onData((data) => {
            if (ws.readyState === 1) { // OPEN
                ws.send(data);
            }
        });

        // Frontend -> Backend: Receive input and write to pty
        ws.on('message', (data) => {
            try {
                const message = data.toString();

                // Check if it's a resize command
                try {
                    if (message.startsWith('{')) {
                        const json = JSON.parse(message);
                        if (json.type === 'resize' && json.cols && json.rows) {
                            ptyProcess.resize(json.cols, json.rows);
                            console.log(`🖥️  Terminal resized to ${json.cols}x${json.rows}`);
                            return;
                        }
                    }
                } catch (e) {
                    // Not JSON, treat as regular input
                }

                // Regular input - write to pty
                ptyProcess.write(message);
            } catch (error) {
                console.error('Terminal message error:', error);
            }
        });

        // Cleanup on close
        ws.on('close', () => {
            console.log('🖥️  Terminal WebSocket disconnected');
            if (terminalSessions.has(ws)) {
                const pty = terminalSessions.get(ws);
                pty.kill();
                terminalSessions.delete(ws);
            }
        });

        // Handle pty exit
        ptyProcess.onExit(({ exitCode, signal }) => {
            console.log(`🖥️  Terminal process exited (code: ${exitCode}, signal: ${signal})`);
            if (ws.readyState === 1) {
                ws.close();
            }
            terminalSessions.delete(ws);
        });

        ws.on('error', (error) => {
            console.error('Terminal WebSocket error:', error);
        });

        return; // Don't add to general clients
    }

    // Default: General WebSocket connections (existing sync functionality)
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

// System Update Endpoint
app.post('/api/system/update', async (req, res) => {
    try {
        console.log('🔄 Starting system update...');

        // 2 minute timeout for the whole operation
        let isTimeout = false;
        const timeout = setTimeout(() => {
            isTimeout = true;
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: 'Update timeout (2 minutes)',
                    details: 'Update took too long'
                });
            }
        }, 120000);

        // Run Force Update (Fetch + Reset)
        // This ensures local changes (like package-lock.json) don't block updates
        console.log('🔄 Fetching latest changes...');
        const gitFetch = spawn('git', ['fetch', 'origin', 'main']);

        gitFetch.on('close', (fetchCode) => {
            if (isTimeout) return;

            if (fetchCode !== 0) {
                clearTimeout(timeout);
                console.error('❌ Git fetch failed');
                return res.status(500).json({
                    success: false,
                    error: 'Update failed (Network error)',
                    details: 'Could not connect to update server'
                });
            }

            console.log('🔄 Resetting to latest version...');
            const gitReset = spawn('git', ['reset', '--hard', 'origin/main']);
            const gitOutput = [];
            const gitErrors = [];

            gitReset.stdout.on('data', (data) => {
                const output = data.toString();
                gitOutput.push(output);
                console.log('Git:', output);
            });

            gitReset.stderr.on('data', (data) => {
                const error = data.toString();
                gitErrors.push(error);
                console.error('Git Error:', error);
            });

            gitReset.on('close', async (code) => {
                if (isTimeout) return;
                clearTimeout(timeout);

                const fullOutput = gitOutput.join('');
                const fullErrors = gitErrors.join('');

                if (code !== 0) {
                    console.error('❌ Git reset failed:', fullErrors);
                    return res.status(500).json({
                        success: false,
                        error: 'Update failed (File error)',
                        details: fullErrors || 'Unknown error'
                    });
                }

                // Always run npm install after a hard reset to ensure dependencies match
                console.log('📦 Running npm install...');
                const npmInstall = spawn('npm', ['install']);
                const npmOutput = [];
                const npmErrors = [];

                npmInstall.stdout.on('data', (data) => {
                    const output = data.toString();
                    npmOutput.push(output);
                    console.log('NPM:', output);
                });

                npmInstall.stderr.on('data', (data) => {
                    const error = data.toString();
                    npmErrors.push(error);
                    console.log('NPM:', error);
                });

                npmInstall.on('close', async (npmCode) => {
                    if (npmCode !== 0) {
                        console.error('❌ npm install failed');
                        return res.status(500).json({
                            success: false,
                            error: 'npm install failed',
                            details: npmErrors.join('')
                        });
                    }



                    // Run npm audit fix (safe only) to help keep dependencies secure
                    console.log('🛡️ Running npm audit fix...');
                    const npmAudit = spawn('npm', ['audit', 'fix']);

                    npmAudit.stdout.on('data', (data) => console.log('AUDIT:', data.toString()));
                    npmAudit.stderr.on('data', (data) => console.log('AUDIT:', data.toString()));

                    // We don't wait for audit to fail/succeed to block the restart, 
                    // we just run it and then proceed to restart.
                    // Actually, better to wait for it to finish so we don't restart mid-process.
                    npmAudit.on('close', (auditCode) => {
                        console.log(`✅ Audit complete (Code: ${auditCode})`);

                        console.log('✅ Update complete! Restarting server with PM2...');

                        // Attempt PM2 reload for zero-downtime restart
                        try {
                            const pm2Reload = spawn('pm2', ['reload', 'ecosystem.config.cjs']);
                            const pm2Output = [];
                            const pm2Errors = [];

                            pm2Reload.stdout.on('data', (data) => {
                                pm2Output.push(data.toString());
                                console.log('PM2:', data.toString());
                            });

                            pm2Reload.stderr.on('data', (data) => {
                                pm2Errors.push(data.toString());
                                console.error('PM2:', data.toString());
                            });

                            pm2Reload.on('close', (pm2Code) => {
                                if (pm2Code === 0) {
                                    console.log('✅ Server restarted automatically!');
                                    return res.json({
                                        success: true,
                                        message: 'Update successful! Server restarted automatically.',
                                        autoRestarted: true,
                                        needsRestart: false,
                                        output: fullOutput,
                                        npmOutput: npmOutput.join(''),
                                        pm2Output: pm2Output.join('')
                                    });
                                } else {
                                    // PM2 failed, fall back to manual restart
                                    console.log('⚠️ PM2 reload failed, manual restart needed');
                                    return res.json({
                                        success: true,
                                        message: 'Update successful! Dependencies installed. Please restart manually.',
                                        needsRestart: true,
                                        autoRestarted: false,
                                        output: fullOutput,
                                        npmOutput: npmOutput.join(''),
                                        pm2Error: pm2Errors.join('')
                                    });
                                }
                            });
                        } catch (pm2Error) {
                            // PM2 not available, fall back to manual restart
                            console.log('⚠️ PM2 not available, manual restart needed');
                            return res.json({
                                success: true,
                                message: 'Update successful! Dependencies installed. Please restart manually.',
                                needsRestart: true,
                                autoRestarted: false,
                                output: fullOutput,
                                npmOutput: npmOutput.join(''),
                                pm2Error: pm2Error.message
                            });
                        }
                    });
                });
            });

        });
    } catch (error) {
        console.error('❌ Update error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error.message || 'Update failed'
            });
        }
    }
});

// PM2 Server Reload (without git pull)
app.post('/api/system/reload', async (req, res) => {
    try {
        console.log('🔄 Reloading server with PM2...');

        const pm2Reload = spawn('pm2', ['reload', 'ecosystem.config.cjs']);
        const pm2Output = [];
        const pm2Errors = [];

        pm2Reload.stdout.on('data', (data) => {
            pm2Output.push(data.toString());
            console.log('PM2:', data.toString());
        });

        pm2Reload.stderr.on('data', (data) => {
            pm2Errors.push(data.toString());
        });

        pm2Reload.on('close', (code) => {
            if (code === 0) {
                return res.json({
                    success: true,
                    message: 'Server reloaded successfully! New routes and changes are now active.',
                    output: pm2Output.join('')
                });
            } else {
                return res.status(500).json({
                    success: false,
                    error: 'PM2 reload failed',
                    details: pm2Errors.join(''),
                    fallback: 'Please restart manually with: npm run pm2:reload'
                });
            }
        });

        pm2Reload.on('error', (error) => {
            console.error('❌ PM2 reload error:', error);
            return res.status(500).json({
                success: false,
                error: 'PM2 not available',
                message: 'PM2 is not running. Please use: npm run pm2:reload',
                details: error.message
            });
        });
    } catch (error) {
        console.error('❌ Reload error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Reload failed',
            message: 'Please restart manually with: npm run pm2:reload'
        });
    }
});

// System Stop Endpoint - Stop PM2 servers
app.post('/api/system/stop', async (req, res) => {
    try {
        console.log('🛑 Stopping servers with PM2...');

        const pm2Stop = spawn('pm2', ['stop', 'ecosystem.config.cjs']);
        const pm2Output = [];
        const pm2Errors = [];

        pm2Stop.stdout.on('data', (data) => {
            pm2Output.push(data.toString());
            console.log('PM2:', data.toString());
        });

        pm2Stop.stderr.on('data', (data) => {
            pm2Errors.push(data.toString());
        });

        pm2Stop.on('close', (code) => {
            if (code === 0) {
                return res.json({
                    success: true,
                    message: 'Servers stopped successfully! Use npm run pm2:start to restart.',
                    output: pm2Output.join('')
                });
            } else {
                return res.status(500).json({
                    success: false,
                    error: 'PM2 stop failed',
                    details: pm2Errors.join(''),
                    fallback: 'Please stop manually with: npm run pm2:stop'
                });
            }
        });

        pm2Stop.on('error', (error) => {
            console.error('❌ PM2 stop error:', error);
            return res.status(500).json({
                success: false,
                error: 'PM2 not available',
                message: 'PM2 is not running. Please use: npm run pm2:stop',
                details: error.message
            });
        });
    } catch (error) {
        console.error('❌ Stop error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Stop failed',
            message: 'Please stop manually with: npm run pm2:stop'
        });
    }
});

// ========================================
// WORDPRESS INTEGRATION (Project PRESS FORGE)
// ========================================

// WordPress Start
app.post('/api/wordpress/start', async (req, res) => {
    try {
        console.log('🐳 Starting WordPress Docker stack...');

        const { stdout, stderr } = await execAsync('docker-compose -f docker-compose.wordpress.yml up -d');

        res.json({
            success: true,
            message: '✅ WordPress started successfully!\n📝 Access at: http://localhost:8080',
            url: 'http://localhost:8080',
            output: stdout
        });
    } catch (error) {
        console.error('❌ WordPress start error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start WordPress',
            error: error.message
        });
    }
});

// WordPress Stop
app.post('/api/wordpress/stop', async (req, res) => {
    try {
        console.log('🐳 Stopping WordPress Docker stack...');

        const { stdout } = await execAsync('docker-compose -f docker-compose.wordpress.yml down');

        res.json({
            success: true,
            message: '✅ WordPress stopped successfully',
            output: stdout
        });
    } catch (error) {
        console.error('❌ WordPress stop error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to stop WordPress',
            error: error.message
        });
    }
});

// WordPress Status
app.get('/api/wordpress/status', async (req, res) => {
    try {
        try {
            const { stdout } = await execAsync('docker-compose -f docker-compose.wordpress.yml ps');
            const isRunning = stdout.includes('Up') || stdout.includes('running');

            res.json({
                success: true,
                status: isRunning ? 'running' : 'stopped',
                output: stdout
            });
        } catch {
            res.json({
                success: true,
                status: 'stopped'
            });
        }
    } catch (error) {
        console.error('❌ WordPress status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================================================
// RANGERBLOCK BLOCKCHAIN API
// ============================================================================

// Get blockchain status
app.get('/api/rangerblock/status', (req, res) => {
    try {
        const status = blockchainService.getStatus();
        res.json({ success: true, ...status });
    } catch (error) {
        console.error('❌ Blockchain status error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start blockchain node
app.post('/api/rangerblock/start', async (req, res) => {
    try {
        const result = await blockchainService.start();
        res.json(result);
    } catch (error) {
        console.error('❌ Blockchain start error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Stop blockchain node
app.post('/api/rangerblock/stop', async (req, res) => {
    try {
        const result = await blockchainService.stop();
        res.json(result);
    } catch (error) {
        console.error('❌ Blockchain stop error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Restart blockchain node
app.post('/api/rangerblock/restart', async (req, res) => {
    try {
        const result = await blockchainService.restart();
        res.json(result);
    } catch (error) {
        console.error('❌ Blockchain restart error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update blockchain config
app.post('/api/rangerblock/config', (req, res) => {
    try {
        const { enabled, networkMode, port, relayUrl, autoStart } = req.body;

        // Update config
        blockchainService.updateConfig({
            enabled,
            networkMode,
            port,
            relayUrl,
            autoStart
        });

        // Save to database
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
        stmt.run('rangerblock_config', JSON.stringify(blockchainService.getConfig()));

        res.json({ success: true, config: blockchainService.getConfig() });
    } catch (error) {
        console.error('❌ Blockchain config error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get blockchain config
app.get('/api/rangerblock/config', (req, res) => {
    try {
        res.json({ success: true, config: blockchainService.getConfig() });
    } catch (error) {
        console.error('❌ Blockchain config error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get blockchain chat messages
app.get('/api/rangerblock/chat', async (req, res) => {
    try {
        const config = blockchainService.getConfig();
        const response = await fetch(`http://localhost:${config.port}/api/chat`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('❌ Blockchain chat get error:', error);
        res.status(500).json({ success: false, error: error.message, messages: [] });
    }
});

// Send blockchain chat message
app.post('/api/rangerblock/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const config = blockchainService.getConfig();

        if (!blockchainService.isRunning) {
            return res.status(400).json({
                success: false,
                error: 'Blockchain node is not running'
            });
        }

        const response = await fetch(`http://localhost:${config.port}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('❌ Blockchain chat send error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// WordPress Publish Note
app.post('/api/wordpress/publish', async (req, res) => {
    try {
        const { filePath, title } = req.body;

        if (!filePath) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a file path'
            });
        }

        console.log(`📝 Publishing note to WordPress: ${filePath}`);

        // Read the file
        const content = fs.readFileSync(filePath, 'utf-8');

        // Extract title from filename if not provided
        const postTitle = title || path.basename(filePath, path.extname(filePath))
            .replace(/-/g, ' ')
            .replace(/_/g, ' ');

        // Basic Markdown to HTML conversion
        let html = content;
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
        html = html.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        html = html.replace(/\n\n/g, '</p><p>');
        html = `<p>${html}</p>`;

        // Create WordPress post using WP-CLI
        const wpCommand = `docker exec rangerplex-wordpress wp post create --post_title="${postTitle}" --post_content="${html.replace(/"/g, '\\"')}" --post_status=draft --allow-root`;

        const { stdout } = await execAsync(wpCommand);

        res.json({
            success: true,
            message: `✅ Published "${postTitle}" to WordPress as draft`,
            title: postTitle,
            output: stdout
        });
    } catch (error) {
        console.error('❌ WordPress publish error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to publish note',
            error: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════
// 🔧 SERVER MANAGEMENT ENDPOINTS
// ═══════════════════════════════════════════════════════════

// Server Restart
app.post('/api/server/restart', (req, res) => {
    console.log('🔄 Server restart requested...');

    res.json({
        success: true,
        message: 'Server restarting...'
    });

    // Restart after sending response
    setTimeout(() => {
        console.log('🔄 Restarting server...');
        process.exit(0); // PM2 will auto-restart
    }, 1000);
});

// Check for updates
app.get('/api/server/check-update', async (req, res) => {
    try {
        console.log('🔍 Checking for RangerPlex updates...');

        // Get current version from package.json
        const packagePath = path.join(__dirname, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        const currentVersion = packageJson.version;

        // Fetch latest version from GitHub
        const response = await fetch('https://api.github.com/repos/davidtkeane/rangerplex-ai/releases/latest');
        const latestRelease = await response.json();
        const latestVersion = latestRelease.tag_name.replace('v', '');

        const updateAvailable = latestVersion !== currentVersion;

        res.json({
            success: true,
            currentVersion,
            latestVersion,
            updateAvailable,
            changelog: updateAvailable ? latestRelease.body : null,
            releaseUrl: latestRelease.html_url
        });

    } catch (error) {
        console.error('❌ Update check failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Install update
app.post('/api/server/install-update', async (req, res) => {
    try {
        console.log('📥 Installing RangerPlex update...');

        // Execute git pull
        console.log('📦 Pulling latest code...');
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        const { stdout: gitOut } = await execAsync('git pull origin main');
        console.log(gitOut);

        // Install dependencies
        console.log('📦 Installing dependencies...');
        const { stdout: npmOut } = await execAsync('npm install');
        console.log(npmOut);

        // Get new version
        const packagePath = path.join(__dirname, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        const newVersion = packageJson.version;

        res.json({
            success: true,
            message: 'Update installed successfully',
            newVersion,
            gitOutput: gitOut,
            npmOutput: npmOut
        });

        // Restart server after 2 seconds
        setTimeout(() => {
            console.log('🔄 Restarting server with new version...');
            process.exit(0); // PM2 will auto-restart
        }, 2000);

    } catch (error) {
        console.error('❌ Update installation failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// WordPress Status Check
app.get('/api/wordpress/status', async (req, res) => {
    try {
        console.log('🔍 Checking WordPress status...');

        // Check if WordPress container is running
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        try {
            const { stdout } = await execAsync('docker ps --filter "name=rangerplex-wordpress" --format "{{.Names}}"');
            const running = stdout.trim().includes('rangerplex-wordpress');

            if (running) {
                // WordPress is running - try to get stats
                const wpUrl = 'http://localhost:8080'; // Default WordPress port

                res.json({
                    success: true,
                    running: true,
                    url: wpUrl,
                    postCount: 'N/A', // Would need WP-CLI to fetch
                    pageCount: 'N/A',
                    version: 'N/A'
                });
            } else {
                res.json({
                    success: true,
                    running: false
                });
            }
        } catch (err) {
            // Docker not running or container not found
            res.json({
                success: true,
                running: false
            });
        }

    } catch (error) {
        console.error('❌ WordPress status check failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Load blockchain config from database
function loadBlockchainConfig() {
    try {
        const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
        const row = stmt.get('rangerblock_config');

        if (row) {
            const config = JSON.parse(row.value);
            blockchainService.updateConfig(config);
            console.log('✅ RangerBlock config loaded');
        }
    } catch (error) {
        console.log('⚠️  No RangerBlock config found (using defaults)');
    }
}

// Start server
server.listen(PORT, async () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎖️  RANGERPLEX AI SERVER v2.13.0                       ║
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

    // Load and auto-start blockchain
    loadBlockchainConfig();

    const config = blockchainService.getConfig();
    if (config.enabled && config.autoStart) {
        console.log('🚀 Auto-starting RangerBlock...');
        const result = await blockchainService.start();

        if (result.success) {
            console.log(`🚀 RangerPlex AI Server v2.12.9 running on port ${PORT}`);
        } else {
            console.error(`❌ RangerBlock failed to start: ${result.message}`);
        }
    } else {
        console.log('⚠️  RangerBlock disabled (enable in settings)');
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down RangerPlex...');

    // Stop blockchain
    if (blockchainService.isRunning) {
        console.log('🛑 Stopping RangerBlock...');
        await blockchainService.stop();
    }

    // Close database
    db.close();
    console.log('✅ Database closed');

    // Exit
    console.log('🎖️ Rangers lead the way!\n');
    process.exit(0);
});

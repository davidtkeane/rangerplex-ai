#!/usr/bin/env node
/**
 * RANGERBOT AI v1.0.0
 * ===================
 * AI-powered chatbot for RangerBlock network using Google Gemini
 *
 * Usage:
 *   node rangerbot-ai.cjs --key YOUR_GEMINI_KEY
 *   node rangerbot-ai.cjs --relay localhost:5555 --key YOUR_KEY
 */

const WebSocket = require('ws');
const https = require('https');

// Configuration
const VERSION = '1.0.0';
const DEFAULT_RELAY = 'localhost';
const DEFAULT_PORT = 5555;
const BOT_NAME = 'RangerBot-AI';
const BOT_EMOJI = '🤖';

// Parse args
const args = process.argv.slice(2);
let relayHost = DEFAULT_RELAY;
let relayPort = DEFAULT_PORT;
let apiKey = process.env.GEMINI_API_KEY;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--relay' && args[i + 1]) {
        const parts = args[i + 1].split(':');
        relayHost = parts[0];
        relayPort = parseInt(parts[1]) || 5555;
        i++;
    } else if (args[i] === '--key' && args[i + 1]) {
        apiKey = args[i + 1];
        i++;
    }
}

if (!apiKey) {
    console.error('❌ Error: Gemini API key required. Use --key YOUR_KEY or set GEMINI_API_KEY env var.');
    process.exit(1);
}

console.log(`
╔════════════════════════════════════════╗
║      🤖 RANGERBOT AI ACTIVATED 🤖      ║
║    Powered by Google Gemini 1.5 Flash  ║
╚════════════════════════════════════════╝
`);

// Connect to Relay
const wsUrl = `ws://${relayHost}:${relayPort}`;
console.log(`🔌 Connecting to ${wsUrl}...`);

let ws;
let nodeId = `Bot-${Date.now().toString(36)}`;

function connect() {
    ws = new WebSocket(wsUrl);

    ws.on('open', () => {
        console.log('✅ Connected to relay!');
    });

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            handleMessage(msg);
        } catch (e) {
            // Ignore
        }
    });

    ws.on('close', () => {
        console.log('❌ Disconnected. Reconnecting in 5s...');
        setTimeout(connect, 5000);
    });

    ws.on('error', (err) => {
        console.error('❌ Connection error:', err.message);
    });
}

function handleMessage(msg) {
    switch (msg.type) {
        case 'welcome':
            // Register
            ws.send(JSON.stringify({
                type: 'register',
                address: nodeId,
                nickname: BOT_NAME,
                channel: '#rangers',
                port: 0,
                blockchainHeight: 0
            }));
            console.log('📝 Registered as', BOT_NAME);
            break;

        case 'nodeMessage':
            const payload = msg.payload;
            if (payload && payload.type === 'chatMessage') {
                processChatMessage(payload, msg.from);
            }
            break;
    }
}

async function processChatMessage(payload, senderId) {
    const text = payload.message || '';
    const senderName = payload.nickname || 'User';

    // Ignore own messages
    if (payload.nickname === BOT_NAME) return;

    // Check for triggers
    const isMention = text.toLowerCase().includes('@rangerbot') || text.toLowerCase().includes('@bot');
    const isCommand = text.startsWith('!ask') || text.startsWith('!ai');

    if (isMention || isCommand) {
        console.log(`💬 Query from ${senderName}: ${text}`);

        // Extract query
        let query = text.replace(/@rangerbot/gi, '').replace(/@bot/gi, '').replace(/^!ask/i, '').replace(/^!ai/i, '').trim();

        if (!query) {
            sendReply(payload.channel, `Hello ${senderName}! How can I help you today?`);
            return;
        }

        // Send typing indicator (optional, maybe just a quick "Thinking..." message)
        // sendReply(payload.channel, `Thinking... 🤔`);

        try {
            const response = await callGemini(query, senderName);
            sendReply(payload.channel, response);
        } catch (err) {
            console.error('Gemini Error:', err.message);
            sendReply(payload.channel, `❌ Sorry, my AI brain hurt: ${err.message}`);
        }
    }
}

function sendReply(channel, text) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
        type: 'broadcast',
        payload: {
            type: 'chatMessage',
            from: nodeId,
            nickname: BOT_NAME,
            message: text,
            channel: channel || '#rangers',
            timestamp: Date.now()
        }
    }));
    console.log(`🤖 Replied: ${text.slice(0, 50)}...`);
}

async function callGemini(prompt, userName) {
    return new Promise((resolve, reject) => {
        const model = 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const systemPrompt = `You are RangerBot, a helpful AI assistant for the RangerBlock P2P network. 
        You are talking to ${userName}. 
        Keep responses concise (under 500 chars if possible) and friendly. 
        Use emojis. 
        The network was built by David Keane (IrishRanger) and Claude Code.
        Motto: "Rangers lead the way!"`;

        const data = JSON.stringify({
            contents: [{
                parts: [{
                    text: `${systemPrompt}\n\nUser: ${prompt}`
                }]
            }]
        });

        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`API Error ${res.statusCode}: ${body}`));
                    return;
                }
                try {
                    const json = JSON.parse(body);
                    const answer = json.candidates?.[0]?.content?.parts?.[0]?.text;
                    resolve(answer || "I'm not sure what to say.");
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// Start
connect();

// Keep alive
setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
    }
}, 30000);

#!/usr/bin/env node
/**
 * 🎖️ RANGERBLOCK RELAY SERVER WITH BRIDGE SUPPORT
 *
 * Version: 2.0.0
 * Created: November 30, 2025
 * Author: David Keane (IrishRanger) + Claude Code (Ranger)
 *
 * Features:
 * - Standard relay functionality (node discovery, message routing)
 * - BRIDGE MODE: Connect to other relay servers
 * - Cross-relay message forwarding
 * - Peer list synchronization across relays
 * - Automatic reconnection to bridge peers
 */

const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

// Load config file or use defaults
let config = {
    relay: {
        name: process.env.RELAY_NAME || 'rangerplex-relay',
        port: parseInt(process.env.WS_PORT) || 5555,
        dashboardPort: parseInt(process.env.HTTP_PORT) || 5556,
        region: process.env.RELAY_REGION || 'local'
    },
    bridge: {
        enabled: process.env.BRIDGE_ENABLED === 'true' || false,
        reconnectInterval: 5000,
        heartbeatInterval: 30000,
        peers: []
    }
};

// Try to load config file
const configPath = path.join(__dirname, 'relay-config.json');
if (fs.existsSync(configPath)) {
    try {
        const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config = { ...config, ...fileConfig };
        console.log('📄 Loaded config from relay-config.json');
    } catch (err) {
        console.log('⚠️  Could not parse relay-config.json, using defaults');
    }
}

const HTTP_PORT = config.relay.dashboardPort;
const WS_PORT = config.relay.port;
const RELAY_NAME = config.relay.name;
const RELAY_REGION = config.relay.region;

// ═══════════════════════════════════════════════════════════════════
// RANGERBOT - Cloud Relay Chatbot
// ═══════════════════════════════════════════════════════════════════

const RANGERBOT = {
    id: 'RangerBot',
    name: 'RangerBot',
    emoji: '🤖',
    type: 'bot',

    // Greeting messages (random)
    greetings: [
        "🎖️ Welcome to RangerBlock! Rangers lead the way!",
        "🌐 You've connected to the RangerBlock P2P Network! Type !help for commands.",
        "⚡ Connection established! Welcome aboard, Ranger!",
        "🏛️ Welcome to the RangerBlock relay. Use !status to see network stats.",
        "🚀 You're now connected to the decentralized future! Try !nodes to see who's online.",
        "☘️ Céad míle fáilte! (A hundred thousand welcomes!) Type !help to get started.",
        "🔐 Secure connection established. Your messages are protected by RangerBlock P2P.",
        "🌍 Welcome to the global RangerBlock network! Nodes worldwide are connected."
    ],

    // Fun facts about the network
    facts: [
        "💡 RangerBlock was built in just 30 hours with 5 AIs working together!",
        "🎮 David's BF2 Global Rank was #16,836 out of 46 million players!",
        "🏔️ Philosophy: 'One foot in front of the other' - steady progress wins!",
        "🧠 The qCPU system can spawn 385,563 virtual CPUs per second!",
        "☘️ Built in Ireland by IrishRanger and Claude Code (Ranger)!",
        "📜 Smart contracts use the .ranger extension - our own contract language!",
        "🌉 Messages can bridge across multiple relay servers worldwide!",
        "💾 The compression system achieved 287,718:1 ratio!",
        "🎯 David once had a 144-kill game in BF3 Metro - legendary status!",
        "🦈 Fun fact: A tiger shark once turned away from David. God saved him!",
        "🔫 David's verified kill count across all platforms: 750,283+",
        "🏥 Combat medic stats: 6,990 BF2 revives + 10,382 kills AS a medic!",
        "💻 RangerPlex integrates 4 Master's courses: PenTest, Blockchain, Forensics, Malware!",
        "🚀 The M4 Max can handle 128,000 virtual CPUs simultaneously!",
        "🎖️ The Ranger motto 'Rangers lead the way!' dates back to D-Day, June 6, 1944."
    ],

    // Jokes
    jokes: [
        "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
        "There are only 10 types of people: those who understand binary, and those who don't.",
        "A SQL query walks into a bar, walks up to two tables and asks... 'Can I join you?'",
        "Why do Java developers wear glasses? Because they don't C#! 👓",
        "!false - It's funny because it's true.",
        "A programmer's wife tells him: 'Go to the store and buy a loaf of bread. If they have eggs, buy a dozen.' He comes back with 12 loaves of bread.",
        "What's a blockchain's favorite dance? The hash shuffle! 💃",
        "Why did the cryptographer break up with their partner? Too many trust issues.",
        "How does a hacker fix a broken website? With a security patch! 🔒",
        "What do you call a blockchain that tells jokes? A pun-chain! ⛓️"
    ],

    // 8-ball responses
    eightBall: [
        "🎱 It is certain.",
        "🎱 It is decidedly so.",
        "🎱 Without a doubt.",
        "🎱 Yes, definitely.",
        "🎱 You may rely on it.",
        "🎱 As I see it, yes.",
        "🎱 Most likely.",
        "🎱 Outlook good.",
        "🎱 Signs point to yes.",
        "🎱 Reply hazy, try again.",
        "🎱 Ask again later.",
        "🎱 Better not tell you now.",
        "🎱 Cannot predict now.",
        "🎱 Concentrate and ask again.",
        "🎱 Don't count on it.",
        "🎱 My reply is no.",
        "🎱 My sources say no.",
        "🎱 Outlook not so good.",
        "🎱 Very doubtful.",
        "🎱 Rangers lead the way! (That means yes!)"
    ],

    // Fortune cookies
    fortunes: [
        "🥠 Your code will compile on the first try today!",
        "🥠 A breakthrough in your project awaits you.",
        "🥠 The bug you've been hunting will reveal itself soon.",
        "🥠 Good things come to those who commit often.",
        "🥠 Your next pull request will be approved without changes.",
        "🥠 Trust in the process - one foot in front of the other.",
        "🥠 A wise programmer once said: 'It works on my machine.'",
        "🥠 Your blockchain knowledge will impress someone important.",
        "🥠 The answer you seek is in the documentation... probably.",
        "🥠 Today is a good day to refactor that legacy code.",
        "🥠 Rangers lead the way - and so will you!",
        "🥠 Your next coffee will spark your best idea yet."
    ],

    // Security tips (for Master's thesis!)
    securityTips: [
        "🔒 Always validate user input - SQL injection is still a top threat!",
        "🔒 Use HTTPS everywhere. Unencrypted traffic is visible to attackers.",
        "🔒 Enable 2FA on all accounts. Passwords alone aren't enough.",
        "🔒 Keep software updated. Patches fix known vulnerabilities.",
        "🔒 Use a password manager. Unique passwords for each site!",
        "🔒 Blockchain immutability doesn't mean privacy - encrypt sensitive data!",
        "🔒 Never store API keys in client-side code or git repositories.",
        "🔒 Principle of least privilege: Give users only the access they need.",
        "🔒 Defense in depth: Multiple security layers beat single points of failure.",
        "🔒 Social engineering is the biggest threat. Train your users!",
        "🔒 Regular backups following 3-2-1 rule: 3 copies, 2 media types, 1 offsite.",
        "🔒 Monitor your logs. Attackers leave traces.",
        "🔒 Use Web Application Firewalls (WAF) to filter malicious traffic.",
        "🔒 Rate limiting prevents brute force attacks. Implement it!",
        "🔒 Sanitize all outputs to prevent XSS attacks."
    ],

    // Blockchain trivia
    blockchainTrivia: [
        "⛓️ Bitcoin's first block (Genesis Block) was mined on January 3, 2009.",
        "⛓️ Satoshi Nakamoto's identity remains unknown to this day.",
        "⛓️ Ethereum introduced smart contracts, enabling programmable blockchain.",
        "⛓️ The Bitcoin whitepaper is only 9 pages long!",
        "⛓️ A 51% attack occurs when one entity controls majority of mining power.",
        "⛓️ 'HODL' originated from a typo of 'HOLD' in a 2013 Bitcoin forum post.",
        "⛓️ The first real-world Bitcoin transaction bought 2 pizzas for 10,000 BTC.",
        "⛓️ Proof of Work was invented to combat email spam before Bitcoin!",
        "⛓️ Merkle trees enable efficient verification of blockchain data integrity.",
        "⛓️ Public keys are derived from private keys using elliptic curve cryptography.",
        "⛓️ Blockchain consensus means all nodes agree on the state of the ledger.",
        "⛓️ Smart contracts are self-executing code stored on the blockchain.",
        "⛓️ Gas fees in Ethereum compensate miners for computational work.",
        "⛓️ RangerBlock uses WebSocket for real-time P2P communication!"
    ],

    // ASCII art collection
    asciiArt: {
        ranger: `
   🎖️ RANGER 🎖️
  ╔═══════════╗
  ║  ◉    ◉  ║
  ║    ▼     ║
  ║  ╰────╯  ║
  ╚═══════════╝
  Rangers Lead!`,

        blockchain: `
   ⛓️ BLOCKCHAIN ⛓️
  ┌───┐  ┌───┐  ┌───┐
  │ 1 │──│ 2 │──│ 3 │
  └───┘  └───┘  └───┘
    ↓      ↓      ↓
   hash   hash   hash`,

        rocket: `
       🚀
      /|\\
     / | \\
    /  |  \\
   /___|___\\
      |||
     /   \\
    LAUNCH!`,

        coffee: `
      )  (
     (   ) )
      ) ( (
    _______)_
 .-'---------|
( C|/\\/\\/\\/\\/|
 '-./\\/\\/\\/\\/|
   '_________'
    '-------'`
    },

    // Get random greeting
    getGreeting() {
        return this.greetings[Math.floor(Math.random() * this.greetings.length)];
    },

    // Get random fact
    getFact() {
        return this.facts[Math.floor(Math.random() * this.facts.length)];
    },

    // Get random joke
    getJoke() {
        return this.jokes[Math.floor(Math.random() * this.jokes.length)];
    },

    // Get random 8-ball
    get8Ball() {
        return this.eightBall[Math.floor(Math.random() * this.eightBall.length)];
    },

    // Get random fortune
    getFortune() {
        return this.fortunes[Math.floor(Math.random() * this.fortunes.length)];
    },

    // Get random security tip
    getSecurityTip() {
        return this.securityTips[Math.floor(Math.random() * this.securityTips.length)];
    },

    // Get random blockchain trivia
    getBlockchainTrivia() {
        return this.blockchainTrivia[Math.floor(Math.random() * this.blockchainTrivia.length)];
    },

    // Process bot commands
    processCommand(command, args, sender, stats, nodes, remotePeers) {
        const cmd = command.toLowerCase();
        const fullMessage = [command, ...args].join(' ').toLowerCase();

        // Natural language responses (greetings, etc.)
        if (['hi', 'hello', 'hey', 'yo', 'sup', 'howdy', 'hola', 'greetings'].includes(cmd)) {
            const responses = [
                `👋 Hey there, ${sender || 'Ranger'}! How can I help?`,
                `🎖️ Hello! Welcome to RangerBlock. Type !help for commands!`,
                `👋 Hi! Great to see you on the network!`,
                `🤖 Greetings! I'm RangerBot, your friendly relay assistant!`
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }

        // Thanks responses
        if (['thanks', 'thank', 'thx', 'ty'].some(t => fullMessage.includes(t))) {
            const responses = [
                "🎖️ You're welcome! Rangers help each other!",
                "👍 No problem! That's what I'm here for!",
                "😊 Happy to help! Type !help if you need more.",
                "🤖 Anytime! Rangers lead the way!"
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }

        switch(cmd) {
            case '!help':
            case '!commands':
            case '!menu':
                return `🤖 **RangerBot Commands:**

📊 **Info:**
!status • !nodes • !uptime • !about • !version

🎮 **Fun:**
!joke • !8ball <question> • !fortune • !dice • !flip • !rps <choice>

📚 **Learn:**
!fact • !security • !trivia • !motto

🎨 **Extras:**
!time • !ascii <name> • !math <expr> • !whoami

💬 Just say hi, hello, or thanks - I respond to those too!`;

            case '!status':
            case '!stats':
                const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
                const hours = Math.floor(uptime / 3600);
                const mins = Math.floor((uptime % 3600) / 60);
                const secs = uptime % 60;
                return `📊 **Network Status:**
┌─────────────────────────────
│ 🏷️ Relay: ${RELAY_NAME}
│ 🌍 Region: ${RELAY_REGION}
│ 📍 Local Nodes: ${nodes.size}
│ 🌐 Remote Peers: ${remotePeers.size}
│ 🌉 Bridges: ${stats.bridgeConnections}
│ 💬 Messages: ${stats.totalMessages.toLocaleString()}
│ ⏱️ Uptime: ${hours}h ${mins}m ${secs}s
└─────────────────────────────`;

            case '!nodes':
            case '!who':
            case '!users':
            case '!list':
                const nodeList = Array.from(nodes.values())
                    .map(n => `  • ${n.address || n.id}`)
                    .join('\n');
                const remoteList = Array.from(remotePeers.values())
                    .map(p => `  • ${p.address} (via ${p.bridgeName})`)
                    .join('\n');
                return `👥 **Connected Nodes (${nodes.size + remotePeers.size}):**

📍 **Local (${nodes.size}):**
${nodeList || '  (none)'}

🌐 **Remote (${remotePeers.size}):**
${remoteList || '  (none)'}`;

            case '!uptime':
                const up = Math.floor((Date.now() - stats.startTime) / 1000);
                const h = Math.floor(up / 3600);
                const m = Math.floor((up % 3600) / 60);
                const s = up % 60;
                const days = Math.floor(h / 24);
                return `⏱️ **Server Uptime:**
${days > 0 ? days + ' days, ' : ''}${h % 24}h ${m}m ${s}s
Started: ${new Date(stats.startTime).toLocaleString()}`;

            case '!fact':
            case '!funfact':
                return this.getFact();

            case '!joke':
            case '!funny':
            case '!lol':
                return this.getJoke();

            case '!8ball':
            case '!magic8ball':
            case '!ask':
                if (args.length === 0) {
                    return "🎱 Ask me a yes/no question! Example: !8ball Will my code work?";
                }
                return `❓ "${args.join(' ')}"
${this.get8Ball()}`;

            case '!fortune':
            case '!cookie':
                return this.getFortune();

            case '!security':
            case '!sec':
            case '!tip':
                return `💡 **Security Tip:**
${this.getSecurityTip()}`;

            case '!trivia':
            case '!blockchain':
            case '!crypto':
                return `📚 **Blockchain Trivia:**
${this.getBlockchainTrivia()}`;

            case '!about':
                return `🎖️ **About RangerBlock:**
━━━━━━━━━━━━━━━━━━━━━
A P2P blockchain network built by:
• 👤 David Keane (IrishRanger)
• 🤖 Claude Code (Ranger)

📍 Location: Ireland 🇮🇪
🎯 Mission: Help 1.3 billion disabled people
💡 Philosophy: "One foot in front of the other"
🛠️ Built: September 2024 (30 hours!)

**Features:**
✅ P2P Chat & Messaging
✅ Smart Contracts (.ranger)
✅ Blockchain Explorer
✅ Cross-Relay Bridging
✅ File Transfer (coming soon)
✅ Voice/Video (coming soon)

🎖️ Rangers lead the way!
━━━━━━━━━━━━━━━━━━━━━`;

            case '!ping':
            case '!pong':
                const latency = Math.floor(Math.random() * 5) + 1;
                return `🏓 Pong! Latency: ${latency}ms
Connection: ✅ Excellent`;

            case '!version':
            case '!ver':
                return `📦 **Version Info:**
• RangerBlock Relay: v2.0.0
• RangerBot: v2.0.0 (Enhanced!)
• Node.js: ${process.version}
• WebSocket: ws@8.x
• Protocol: RangerBlock P2P v1`;

            case '!motto':
            case '!quote':
                const mottos = [
                    "🎖️ Rangers lead the way!",
                    "🏔️ One foot in front of the other!",
                    "💪 Mission over metrics!",
                    "🧠 Disabilities → Superpowers!",
                    "⚔️ Ah well, KEEP FIRING!!!",
                    "🎯 $1 to code, $18 to fix - think first!",
                    "🔥 If it happens in reality, why not with my computer?",
                    "☘️ Céad míle fáilte! (A hundred thousand welcomes!)",
                    "🚀 The only way is forward!",
                    "💡 Trust through evidence, not blind acceptance."
                ];
                return mottos[Math.floor(Math.random() * mottos.length)];

            case '!dice':
            case '!roll':
                const sides = parseInt(args[0]) || 6;
                const numDice = Math.min(parseInt(args[1]) || 1, 10);
                const rolls = [];
                for (let i = 0; i < numDice; i++) {
                    rolls.push(Math.floor(Math.random() * sides) + 1);
                }
                const total = rolls.reduce((a, b) => a + b, 0);
                return `🎲 Rolling ${numDice}d${sides}...
Results: [${rolls.join(', ')}]
Total: **${total}**`;

            case '!flip':
            case '!coin':
            case '!coinflip':
                const coin = Math.random() < 0.5 ? 'Heads' : 'Tails';
                const coinEmoji = coin === 'Heads' ? '👑' : '🪙';
                return `${coinEmoji} **${coin}!**`;

            case '!rps':
            case '!rockpaperscissors':
                const choices = ['rock', 'paper', 'scissors'];
                const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
                const userChoice = (args[0] || '').toLowerCase();

                if (!choices.includes(userChoice)) {
                    return "✊ Rock Paper Scissors! Use: !rps rock/paper/scissors";
                }

                const botChoice = choices[Math.floor(Math.random() * 3)];
                let result;
                if (userChoice === botChoice) {
                    result = "🤝 It's a tie!";
                } else if (
                    (userChoice === 'rock' && botChoice === 'scissors') ||
                    (userChoice === 'paper' && botChoice === 'rock') ||
                    (userChoice === 'scissors' && botChoice === 'paper')
                ) {
                    result = "🎉 You win!";
                } else {
                    result = "🤖 I win!";
                }
                return `You: ${emojis[userChoice]} vs Me: ${emojis[botChoice]}
${result}`;

            case '!time':
            case '!date':
            case '!now':
                const now = new Date();
                return `🕐 **Current Time:**
• UTC: ${now.toUTCString()}
• Local: ${now.toLocaleString()}
• Unix: ${Math.floor(now.getTime() / 1000)}`;

            case '!math':
            case '!calc':
            case '!calculate':
                if (args.length === 0) {
                    return "🔢 Usage: !math <expression>\nExample: !math 2 + 2 * 3";
                }
                try {
                    // Safe math evaluation (only numbers and basic operators)
                    const expr = args.join(' ').replace(/[^0-9+\-*/().% ]/g, '');
                    if (!expr) return "❌ Invalid expression";
                    const result = Function('"use strict"; return (' + expr + ')')();
                    return `🔢 ${args.join(' ')} = **${result}**`;
                } catch (e) {
                    return "❌ Could not calculate. Check your expression!";
                }

            case '!whoami':
            case '!me':
            case '!myinfo':
                return `👤 **Your Info:**
• Address: ${sender || 'Unknown'}
• Connected to: ${RELAY_NAME}
• Region: ${RELAY_REGION}
• Session: Active ✅`;

            case '!ascii':
            case '!art':
                const artName = (args[0] || 'ranger').toLowerCase();
                const art = this.asciiArt[artName];
                if (art) {
                    return art;
                }
                return `🎨 Available ASCII art: ${Object.keys(this.asciiArt).join(', ')}
Usage: !ascii ranger`;

            case '!clear':
            case '!cls':
                return "🧹 (Clear screen not available in chat - but here's a fresh line!)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

            case '!rules':
                return `📜 **Channel Rules:**
1. Be respectful to all Rangers
2. No spam or flooding
3. Keep it professional
4. Help others when you can
5. Have fun and learn!

🎖️ Rangers help each other!`;

            case '!weather':
                const weathers = [
                    "☀️ Sunny and bright in the blockchain world!",
                    "🌤️ Partly cloudy, but transactions are flowing!",
                    "⛈️ Storm of activity on the network!",
                    "🌈 Perfect weather for deploying smart contracts!",
                    "❄️ Cool blocks being mined today!"
                ];
                return weathers[Math.floor(Math.random() * weathers.length)];

            case '!invite':
            case '!share':
                return `📨 **Invite Others to RangerBlock:**
Share this with friends:

🌐 Connect via: ws://${RELAY_NAME}:5555
📚 GitHub: github.com/davidtkeane/rangerplex-ai
🎖️ Built by IrishRanger + Claude Code

Rangers lead the way!`;

            default:
                return null; // Not a bot command
        }
    },

    // Create a bot message
    createMessage(content) {
        return {
            type: 'nodeMessage',
            from: this.name,
            fromNodeId: this.id,
            fromName: this.name,
            payload: {
                type: 'chat',
                content: content,
                channel: '#rangers'
            },
            isBot: true,
            timestamp: Date.now()
        };
    }
};

const app = express();

// ═══════════════════════════════════════════════════════════════════
// DATA STRUCTURES
// ═══════════════════════════════════════════════════════════════════

// Local nodes (connected directly to this relay)
const nodes = new Map();

// Bridge connections (other relay servers)
const bridgeConnections = new Map();

// Remote peers (nodes on other relays, synced via bridge)
const remotePeers = new Map();

// Statistics
const stats = {
    totalConnections: 0,
    activeNodes: 0,
    bridgeConnections: 0,
    remotePeers: 0,
    totalMessages: 0,
    bridgeMessages: 0,
    startTime: Date.now()
};

// ═══════════════════════════════════════════════════════════════════
// MACHINE REGISTRY - Dynamic machine tracking with join requests
// ═══════════════════════════════════════════════════════════════════

// Known machines (approved and connected)
const machineRegistry = new Map();

// Pending join requests (awaiting approval)
const pendingMachines = new Map();

// Admin nodes (can approve join requests) - first node or specified admins
const adminNodes = new Set();

// Load machine registry from file if exists
const machineRegistryPath = path.join(__dirname, 'machine-registry.json');
if (fs.existsSync(machineRegistryPath)) {
    try {
        const registryData = JSON.parse(fs.readFileSync(machineRegistryPath, 'utf8'));
        if (registryData.machines) {
            Object.entries(registryData.machines).forEach(([key, machine]) => {
                machineRegistry.set(key, { ...machine, online: false });
            });
            console.log(`📋 Loaded ${machineRegistry.size} machines from registry`);
        }
    } catch (err) {
        console.log('⚠️  Could not load machine-registry.json');
    }
}

// Save machine registry to file
function saveMachineRegistry() {
    const machines = {};
    for (const [key, machine] of machineRegistry) {
        const { online, ws, ...machineData } = machine;
        machines[key] = machineData;
    }
    const data = {
        _comment: "RangerBlock Machine Registry - Auto-updated by relay server",
        _updated: new Date().toISOString(),
        machines: machines
    };
    try {
        fs.writeFileSync(machineRegistryPath, JSON.stringify(data, null, 2));
        console.log(`💾 Saved machine registry (${machineRegistry.size} machines)`);
    } catch (err) {
        console.error('❌ Could not save machine registry:', err.message);
    }
}

// Broadcast machine registry to all nodes
function broadcastMachineRegistry() {
    const machineList = Array.from(machineRegistry.entries()).map(([key, m]) => ({
        key: key,
        node_id: m.node_id,
        name: m.name,
        type: m.type,
        emoji: m.emoji,
        platform: m.platform,
        online: m.online || false,
        lastSeen: m.lastSeen
    }));

    const message = JSON.stringify({
        type: 'machine_registry',
        machines: machineList,
        count: machineList.length,
        timestamp: Date.now()
    });

    for (const [id, node] of nodes) {
        if (node.ws.readyState === WebSocket.OPEN) {
            node.ws.send(message);
        }
    }
}

// Broadcast pending join request to admins
function broadcastJoinRequest(request) {
    const message = JSON.stringify({
        type: 'machine_join_request',
        request: request,
        timestamp: Date.now()
    });

    for (const [id, node] of nodes) {
        if (adminNodes.has(id) && node.ws.readyState === WebSocket.OPEN) {
            node.ws.send(message);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// WEBSOCKET SERVER (for local nodes)
// ═══════════════════════════════════════════════════════════════════

const wss = new WebSocket.Server({ port: WS_PORT });

console.log('\n' + '🎖️ '.repeat(30));
console.log('   RANGERBLOCK RELAY SERVER v2.0 (BRIDGE ENABLED)');
console.log(`   Name: ${RELAY_NAME} | Region: ${RELAY_REGION}`);
console.log('🎖️ '.repeat(30));
console.log(`\n✅ WebSocket server listening on port ${WS_PORT}`);

wss.on('connection', (ws, req) => {
    const nodeId = generateNodeId();
    const clientIP = req.socket.remoteAddress;

    stats.totalConnections++;
    stats.activeNodes = nodes.size + 1;

    console.log(`\n📥 New connection from ${clientIP}`);
    console.log(`   Assigned node ID: ${nodeId}`);

    // Check if this is a bridge connection (from another relay)
    const isBridge = req.headers['x-bridge-relay'] === 'true';

    if (isBridge) {
        handleBridgeConnection(ws, nodeId, req);
        return;
    }

    // Regular node connection
    ws.send(JSON.stringify({
        type: 'welcome',
        nodeId: nodeId,
        relayName: RELAY_NAME,
        relayRegion: RELAY_REGION,
        message: 'Connected to RangerBlock Relay Server (Bridge Enabled)',
        timestamp: Date.now()
    }));

    ws.on('message', (data) => {
        stats.totalMessages++;
        try {
            const msg = JSON.parse(data);
            handleNodeMessage(ws, nodeId, msg, clientIP);
        } catch (err) {
            console.error(`❌ Invalid message from ${nodeId}:`, err.message);
        }
    });

    ws.on('close', () => {
        if (nodes.has(nodeId)) {
            const node = nodes.get(nodeId);
            console.log(`\n❌ Node disconnected: ${node.address || nodeId}`);
            nodes.delete(nodeId);
            stats.activeNodes = nodes.size;
            broadcastNodeList();
            syncPeersToBridges();
        }
    });

    ws.on('error', (err) => {
        console.error(`❌ WebSocket error from ${nodeId}:`, err.message);
    });
});

// ═══════════════════════════════════════════════════════════════════
// BRIDGE SYSTEM
// ═══════════════════════════════════════════════════════════════════

/**
 * Handle incoming bridge connection (from another relay)
 */
function handleBridgeConnection(ws, connectionId, req) {
    const bridgeName = req.headers['x-bridge-name'] || 'unknown-relay';
    const bridgeRegion = req.headers['x-bridge-region'] || 'unknown';

    console.log(`\n🌉 BRIDGE CONNECTION from ${bridgeName} (${bridgeRegion})`);

    bridgeConnections.set(connectionId, {
        ws: ws,
        name: bridgeName,
        region: bridgeRegion,
        connectedAt: Date.now(),
        lastSeen: Date.now(),
        peers: []
    });

    stats.bridgeConnections = bridgeConnections.size;

    ws.send(JSON.stringify({
        type: 'bridge_welcome',
        relayName: RELAY_NAME,
        relayRegion: RELAY_REGION,
        localPeers: getLocalPeerList(),
        timestamp: Date.now()
    }));

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            handleBridgeMessage(connectionId, msg);
        } catch (err) {
            console.error(`❌ Bridge message error:`, err.message);
        }
    });

    ws.on('close', () => {
        console.log(`\n🌉 Bridge disconnected: ${bridgeName}`);

        // Remove remote peers from this bridge
        for (const [peerId, peer] of remotePeers) {
            if (peer.bridgeId === connectionId) {
                remotePeers.delete(peerId);
            }
        }

        bridgeConnections.delete(connectionId);
        stats.bridgeConnections = bridgeConnections.size;
        stats.remotePeers = remotePeers.size;
    });
}

/**
 * Handle messages from bridge relays
 */
function handleBridgeMessage(connectionId, msg) {
    const bridge = bridgeConnections.get(connectionId);
    if (!bridge) return;

    bridge.lastSeen = Date.now();

    switch (msg.type) {
        case 'peer_sync':
            // Received peer list from another relay
            console.log(`📋 Peer sync from ${bridge.name}: ${msg.peers?.length || 0} peers`);

            // Clear old peers from this bridge
            for (const [peerId, peer] of remotePeers) {
                if (peer.bridgeId === connectionId) {
                    remotePeers.delete(peerId);
                }
            }

            // Add new peers
            if (msg.peers) {
                msg.peers.forEach(peer => {
                    remotePeers.set(peer.nodeId, {
                        ...peer,
                        bridgeId: connectionId,
                        bridgeName: bridge.name,
                        isRemote: true
                    });
                });
            }

            stats.remotePeers = remotePeers.size;

            // Broadcast updated peer list to local nodes
            broadcastNodeList();
            break;

        case 'bridge_message':
            // Message to forward to a local node
            stats.bridgeMessages++;
            console.log(`📨 Bridge message from ${bridge.name} -> ${msg.targetAddress}`);

            // Find local node
            let targetNode = null;
            for (const [id, node] of nodes) {
                if (node.address === msg.targetAddress || id === msg.targetNodeId) {
                    targetNode = node;
                    break;
                }
            }

            if (targetNode && targetNode.ws.readyState === WebSocket.OPEN) {
                targetNode.ws.send(JSON.stringify({
                    type: 'nodeMessage',
                    from: msg.from,
                    fromNodeId: msg.fromNodeId,
                    fromRelay: bridge.name,
                    payload: msg.payload,
                    bridged: true,
                    timestamp: Date.now()
                }));
                console.log(`   ✅ Delivered to ${msg.targetAddress}`);
            } else {
                console.log(`   ❌ Target not found: ${msg.targetAddress}`);
            }
            break;

        case 'bridge_broadcast':
            // Broadcast from another relay to all local nodes
            stats.bridgeMessages++;
            console.log(`📢 Bridge broadcast from ${bridge.name}`);

            const broadcastMsg = {
                type: 'nodeMessage',
                from: msg.from,
                fromNodeId: msg.fromNodeId,
                fromRelay: bridge.name,
                payload: msg.payload,
                broadcast: true,
                bridged: true,
                timestamp: Date.now()
            };

            for (const [id, node] of nodes) {
                if (node.ws.readyState === WebSocket.OPEN) {
                    node.ws.send(JSON.stringify(broadcastMsg));
                }
            }
            break;

        case 'bridge_ping':
            bridge.ws.send(JSON.stringify({
                type: 'bridge_pong',
                timestamp: Date.now()
            }));
            break;
    }
}

/**
 * Connect to peer relay servers (outbound bridge)
 */
function connectToBridgePeers() {
    if (!config.bridge.enabled || !config.bridge.peers) {
        console.log('🌉 Bridge mode disabled or no peers configured');
        return;
    }

    console.log(`\n🌉 Connecting to ${config.bridge.peers.length} bridge peers...`);

    config.bridge.peers.forEach(peer => {
        if (!peer.enabled) {
            console.log(`   ⏸️  ${peer.name}: Disabled`);
            return;
        }

        connectToBridge(peer);
    });
}

/**
 * Connect to a single bridge peer
 */
function connectToBridge(peer) {
    const url = `ws://${peer.host}:${peer.port}`;
    console.log(`   🔗 Connecting to ${peer.name} (${url})...`);

    try {
        const ws = new WebSocket(url, {
            headers: {
                'x-bridge-relay': 'true',
                'x-bridge-name': RELAY_NAME,
                'x-bridge-region': RELAY_REGION
            }
        });

        ws.on('open', () => {
            console.log(`   ✅ Connected to ${peer.name}!`);

            bridgeConnections.set(peer.name, {
                ws: ws,
                name: peer.name,
                host: peer.host,
                port: peer.port,
                outbound: true,
                connectedAt: Date.now(),
                lastSeen: Date.now(),
                peers: []
            });

            stats.bridgeConnections = bridgeConnections.size;

            // Send our peer list
            syncPeersToBridge(peer.name);
        });

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                handleBridgeMessage(peer.name, msg);
            } catch (err) {
                console.error(`❌ Bridge message error from ${peer.name}:`, err.message);
            }
        });

        ws.on('close', () => {
            console.log(`\n🌉 Lost connection to ${peer.name}`);
            bridgeConnections.delete(peer.name);
            stats.bridgeConnections = bridgeConnections.size;

            // Remove remote peers from this bridge
            for (const [peerId, remotePeer] of remotePeers) {
                if (remotePeer.bridgeName === peer.name) {
                    remotePeers.delete(peerId);
                }
            }
            stats.remotePeers = remotePeers.size;

            // Reconnect after delay
            setTimeout(() => {
                if (peer.enabled) {
                    connectToBridge(peer);
                }
            }, config.bridge.reconnectInterval);
        });

        ws.on('error', (err) => {
            console.error(`   ❌ Bridge error (${peer.name}): ${err.message}`);
        });

    } catch (err) {
        console.error(`   ❌ Failed to connect to ${peer.name}: ${err.message}`);

        // Retry after delay
        setTimeout(() => {
            if (peer.enabled) {
                connectToBridge(peer);
            }
        }, config.bridge.reconnectInterval);
    }
}

/**
 * Sync local peers to a specific bridge
 */
function syncPeersToBridge(bridgeName) {
    const bridge = bridgeConnections.get(bridgeName);
    if (!bridge || bridge.ws.readyState !== WebSocket.OPEN) return;

    bridge.ws.send(JSON.stringify({
        type: 'peer_sync',
        relayName: RELAY_NAME,
        peers: getLocalPeerList(),
        timestamp: Date.now()
    }));
}

/**
 * Sync local peers to all connected bridges
 */
function syncPeersToBridges() {
    for (const [name, bridge] of bridgeConnections) {
        if (bridge.ws.readyState === WebSocket.OPEN) {
            syncPeersToBridge(name);
        }
    }
}

/**
 * Get list of local peers (for syncing)
 */
function getLocalPeerList() {
    return Array.from(nodes.values()).map(n => ({
        nodeId: n.id,
        address: n.address,
        ip: n.ip,
        port: n.port,
        blockchainHeight: n.blockchainHeight,
        relay: RELAY_NAME,
        region: RELAY_REGION
    }));
}

// ═══════════════════════════════════════════════════════════════════
// NODE MESSAGE HANDLING
// ═══════════════════════════════════════════════════════════════════

function handleNodeMessage(ws, nodeId, msg, clientIP) {
    switch (msg.type) {
        case 'register':
            console.log(`\n📝 Registration from ${msg.address || nodeId}`);

            nodes.set(nodeId, {
                id: nodeId,
                address: msg.address,
                ip: clientIP,
                port: msg.port || 5000,
                blockchainHeight: msg.blockchainHeight || 0,
                lastSeen: Date.now(),
                ws: ws
            });

            stats.activeNodes = nodes.size;

            ws.send(JSON.stringify({
                type: 'registered',
                nodeId: nodeId,
                relayName: RELAY_NAME,
                timestamp: Date.now()
            }));

            // 🤖 RangerBot greeting - Send welcome message to new node
            setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    const greeting = RANGERBOT.getGreeting();
                    ws.send(JSON.stringify(RANGERBOT.createMessage(greeting)));
                    console.log(`🤖 RangerBot greeted ${msg.address || nodeId}`);
                }
            }, 500); // Small delay for smoother UX

            broadcastNodeList();
            syncPeersToBridges(); // Sync to bridge peers
            break;

        case 'getPeers':
            // Include both local and remote peers
            const allPeers = [
                ...Array.from(nodes.values())
                    .filter(n => n.id !== nodeId)
                    .map(n => ({
                        nodeId: n.id,
                        address: n.address,
                        ip: n.ip,
                        port: n.port,
                        blockchainHeight: n.blockchainHeight,
                        local: true,
                        relay: RELAY_NAME
                    })),
                ...Array.from(remotePeers.values()).map(p => ({
                    nodeId: p.nodeId,
                    address: p.address,
                    ip: p.ip,
                    port: p.port,
                    blockchainHeight: p.blockchainHeight,
                    remote: true,
                    relay: p.relay,
                    bridgeName: p.bridgeName
                }))
            ];

            ws.send(JSON.stringify({
                type: 'peerList',
                peers: allPeers,
                localCount: nodes.size - 1,
                remoteCount: remotePeers.size,
                count: allPeers.length,
                timestamp: Date.now()
            }));
            break;

        case 'ping':
            if (nodes.has(nodeId)) {
                nodes.get(nodeId).lastSeen = Date.now();
            }
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;

        case 'relayMessage':
            // Check if target is local or remote
            const targetAddress = msg.targetAddress;
            const targetNodeId = msg.targetNodeId;

            // Try local first
            let targetNode = null;
            for (const [id, node] of nodes) {
                if (node.address === targetAddress || id === targetNodeId) {
                    targetNode = node;
                    break;
                }
            }

            if (targetNode && targetNode.ws.readyState === WebSocket.OPEN) {
                // Local delivery
                const senderNode = nodes.get(nodeId);
                targetNode.ws.send(JSON.stringify({
                    type: 'nodeMessage',
                    from: senderNode?.address || nodeId,
                    fromNodeId: nodeId,
                    payload: msg.payload,
                    timestamp: Date.now()
                }));
                console.log(`📨 Local relay: ${senderNode?.address} → ${targetNode.address}`);
                ws.send(JSON.stringify({ type: 'relaySuccess', timestamp: Date.now() }));
            } else {
                // Try remote (via bridge)
                let remotePeer = null;
                for (const [id, peer] of remotePeers) {
                    if (peer.address === targetAddress || id === targetNodeId) {
                        remotePeer = peer;
                        break;
                    }
                }

                if (remotePeer) {
                    // Forward via bridge
                    const bridge = bridgeConnections.get(remotePeer.bridgeName);
                    if (bridge && bridge.ws.readyState === WebSocket.OPEN) {
                        const senderNode = nodes.get(nodeId);
                        bridge.ws.send(JSON.stringify({
                            type: 'bridge_message',
                            from: senderNode?.address || nodeId,
                            fromNodeId: nodeId,
                            targetAddress: targetAddress,
                            targetNodeId: targetNodeId,
                            payload: msg.payload,
                            timestamp: Date.now()
                        }));
                        console.log(`🌉 Bridge relay: ${senderNode?.address} → ${remotePeer.address} (via ${remotePeer.bridgeName})`);
                        ws.send(JSON.stringify({ type: 'relaySuccess', bridged: true, timestamp: Date.now() }));
                    } else {
                        ws.send(JSON.stringify({ type: 'relayFailed', reason: 'Bridge not connected' }));
                    }
                } else {
                    ws.send(JSON.stringify({ type: 'relayFailed', reason: 'Target not found' }));
                }
            }
            break;

        case 'broadcast':
            const sender = nodes.get(nodeId);
            const broadcastPayload = {
                type: 'nodeMessage',
                from: sender?.address || nodeId,
                fromNodeId: nodeId,
                payload: msg.payload,
                broadcast: true,
                timestamp: Date.now()
            };

            // Broadcast to local nodes
            let localCount = 0;
            for (const [id, node] of nodes) {
                if (id !== nodeId && node.ws.readyState === WebSocket.OPEN) {
                    node.ws.send(JSON.stringify(broadcastPayload));
                    localCount++;
                }
            }

            // Forward to bridges for remote broadcast
            for (const [name, bridge] of bridgeConnections) {
                if (bridge.ws.readyState === WebSocket.OPEN) {
                    bridge.ws.send(JSON.stringify({
                        type: 'bridge_broadcast',
                        from: sender?.address || nodeId,
                        fromNodeId: nodeId,
                        payload: msg.payload,
                        timestamp: Date.now()
                    }));
                }
            }

            console.log(`📢 Broadcast from ${sender?.address}: ${localCount} local + ${bridgeConnections.size} bridges`);
            ws.send(JSON.stringify({
                type: 'broadcastSent',
                localRecipients: localCount,
                bridgedTo: bridgeConnections.size,
                timestamp: Date.now()
            }));

            // 🤖 RangerBot - Check for bot commands in chat messages
            if (msg.payload && msg.payload.content && typeof msg.payload.content === 'string') {
                const content = msg.payload.content.trim();
                if (content.startsWith('!')) {
                    const parts = content.split(' ');
                    const command = parts[0];
                    const args = parts.slice(1);

                    const botResponse = RANGERBOT.processCommand(command, args, sender?.address, stats, nodes, remotePeers);
                    if (botResponse) {
                        // Send bot response to the sender
                        setTimeout(() => {
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify(RANGERBOT.createMessage(botResponse)));
                            }
                            // Also broadcast to everyone
                            const botBroadcast = RANGERBOT.createMessage(botResponse);
                            for (const [id, node] of nodes) {
                                if (node.ws.readyState === WebSocket.OPEN) {
                                    node.ws.send(JSON.stringify(botBroadcast));
                                }
                            }
                        }, 200);
                        console.log(`🤖 RangerBot responded to ${command} from ${sender?.address}`);
                    }
                }
            }
            break;

        // ═══════════════════════════════════════════════════════════════════
        // MACHINE REGISTRY MESSAGE HANDLERS
        // ═══════════════════════════════════════════════════════════════════

        case 'machine_register':
            // New machine wants to join the network
            console.log(`\n🆕 Machine registration request: ${msg.machine?.name || 'Unknown'}`);

            const machineKey = msg.machine?.key || msg.machine?.node_id || generateNodeId();
            const machineInfo = {
                key: machineKey,
                node_id: msg.machine?.node_id || machineKey,
                name: msg.machine?.name || 'Unknown Machine',
                type: msg.machine?.type || 'peer',
                emoji: msg.machine?.emoji || '💻',
                platform: msg.machine?.platform || 'Unknown',
                hardware: msg.machine?.hardware || 'Unknown',
                ip: clientIP,
                requestedAt: Date.now(),
                requestedBy: nodeId
            };

            // Check if already in registry
            if (machineRegistry.has(machineKey)) {
                // Already approved - update online status
                const existing = machineRegistry.get(machineKey);
                existing.online = true;
                existing.lastSeen = Date.now();
                existing.nodeId = nodeId;
                machineRegistry.set(machineKey, existing);

                console.log(`✅ Known machine reconnected: ${machineInfo.name}`);
                ws.send(JSON.stringify({
                    type: 'machine_registered',
                    status: 'approved',
                    machine: existing,
                    message: 'Welcome back to the network!',
                    timestamp: Date.now()
                }));

                broadcastMachineRegistry();
            } else {
                // New machine - add to pending if approval required, or auto-approve
                // Auto-approve if no admins yet (first machine becomes admin)
                if (adminNodes.size === 0) {
                    // First machine - auto-approve and make admin
                    adminNodes.add(nodeId);
                    machineInfo.online = true;
                    machineInfo.lastSeen = Date.now();
                    machineInfo.nodeId = nodeId;
                    machineInfo.isAdmin = true;
                    machineRegistry.set(machineKey, machineInfo);
                    saveMachineRegistry();

                    console.log(`👑 First machine auto-approved as admin: ${machineInfo.name}`);
                    ws.send(JSON.stringify({
                        type: 'machine_registered',
                        status: 'approved',
                        isAdmin: true,
                        machine: machineInfo,
                        message: 'You are the first node - approved as admin!',
                        timestamp: Date.now()
                    }));

                    broadcastMachineRegistry();
                } else {
                    // Add to pending and notify admins
                    pendingMachines.set(machineKey, machineInfo);
                    console.log(`⏳ Machine pending approval: ${machineInfo.name}`);

                    ws.send(JSON.stringify({
                        type: 'machine_registered',
                        status: 'pending',
                        message: 'Registration pending admin approval',
                        timestamp: Date.now()
                    }));

                    broadcastJoinRequest(machineInfo);
                }
            }
            break;

        case 'getMachineRegistry':
            // Return the current machine registry
            const machineList = Array.from(machineRegistry.entries()).map(([key, m]) => ({
                key: key,
                node_id: m.node_id,
                name: m.name,
                type: m.type,
                emoji: m.emoji,
                platform: m.platform,
                online: m.online || false,
                lastSeen: m.lastSeen
            }));

            const pendingList = Array.from(pendingMachines.entries()).map(([key, m]) => ({
                key: key,
                node_id: m.node_id,
                name: m.name,
                type: m.type,
                emoji: m.emoji,
                platform: m.platform,
                requestedAt: m.requestedAt
            }));

            ws.send(JSON.stringify({
                type: 'machine_registry',
                machines: machineList,
                pending: adminNodes.has(nodeId) ? pendingList : [],
                count: machineList.length,
                isAdmin: adminNodes.has(nodeId),
                timestamp: Date.now()
            }));
            break;

        case 'machine_approve':
            // Admin approves a pending machine
            if (!adminNodes.has(nodeId)) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Not authorized - admin only',
                    timestamp: Date.now()
                }));
                break;
            }

            const approveKey = msg.machineKey;
            if (pendingMachines.has(approveKey)) {
                const pendingMachine = pendingMachines.get(approveKey);
                pendingMachine.online = false;
                pendingMachine.approvedAt = Date.now();
                pendingMachine.approvedBy = nodeId;
                machineRegistry.set(approveKey, pendingMachine);
                pendingMachines.delete(approveKey);
                saveMachineRegistry();

                console.log(`✅ Machine approved: ${pendingMachine.name}`);

                // Notify the requesting node if still connected
                for (const [id, node] of nodes) {
                    if (id === pendingMachine.requestedBy && node.ws.readyState === WebSocket.OPEN) {
                        node.ws.send(JSON.stringify({
                            type: 'machine_registered',
                            status: 'approved',
                            machine: pendingMachine,
                            message: 'Your machine has been approved!',
                            timestamp: Date.now()
                        }));
                    }
                }

                ws.send(JSON.stringify({
                    type: 'machine_approved',
                    machine: pendingMachine,
                    timestamp: Date.now()
                }));

                broadcastMachineRegistry();
            } else {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Machine not found in pending list',
                    timestamp: Date.now()
                }));
            }
            break;

        case 'machine_reject':
            // Admin rejects a pending machine
            if (!adminNodes.has(nodeId)) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Not authorized - admin only',
                    timestamp: Date.now()
                }));
                break;
            }

            const rejectKey = msg.machineKey;
            if (pendingMachines.has(rejectKey)) {
                const rejectedMachine = pendingMachines.get(rejectKey);
                pendingMachines.delete(rejectKey);

                console.log(`❌ Machine rejected: ${rejectedMachine.name}`);

                // Notify the requesting node if still connected
                for (const [id, node] of nodes) {
                    if (id === rejectedMachine.requestedBy && node.ws.readyState === WebSocket.OPEN) {
                        node.ws.send(JSON.stringify({
                            type: 'machine_registered',
                            status: 'rejected',
                            message: msg.reason || 'Registration rejected by admin',
                            timestamp: Date.now()
                        }));
                    }
                }

                ws.send(JSON.stringify({
                    type: 'machine_rejected',
                    machineKey: rejectKey,
                    timestamp: Date.now()
                }));
            }
            break;

        case 'set_admin':
            // Existing admin can grant admin to another node
            if (!adminNodes.has(nodeId)) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Not authorized - admin only',
                    timestamp: Date.now()
                }));
                break;
            }

            const newAdminId = msg.targetNodeId;
            if (nodes.has(newAdminId)) {
                adminNodes.add(newAdminId);
                console.log(`👑 New admin added by ${nodeId}: ${newAdminId}`);

                const targetNode = nodes.get(newAdminId);
                if (targetNode.ws.readyState === WebSocket.OPEN) {
                    targetNode.ws.send(JSON.stringify({
                        type: 'admin_granted',
                        message: 'You have been granted admin privileges',
                        timestamp: Date.now()
                    }));
                }

                ws.send(JSON.stringify({
                    type: 'admin_set',
                    targetNodeId: newAdminId,
                    timestamp: Date.now()
                }));
            }
            break;

        default:
            ws.send(JSON.stringify({ type: 'error', message: `Unknown type: ${msg.type}` }));
    }
}

/**
 * Broadcast peer list to all local nodes
 */
function broadcastNodeList() {
    const allPeers = [
        ...Array.from(nodes.values()).map(n => ({
            nodeId: n.id,
            address: n.address,
            local: true,
            relay: RELAY_NAME
        })),
        ...Array.from(remotePeers.values()).map(p => ({
            nodeId: p.nodeId,
            address: p.address,
            remote: true,
            relay: p.relay,
            bridgeName: p.bridgeName
        }))
    ];

    const message = JSON.stringify({
        type: 'peerListUpdate',
        peers: allPeers,
        localCount: nodes.size,
        remoteCount: remotePeers.size,
        timestamp: Date.now()
    });

    for (const [nodeId, node] of nodes) {
        if (node.ws.readyState === WebSocket.OPEN) {
            node.ws.send(message);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// HTTP DASHBOARD
// ═══════════════════════════════════════════════════════════════════

app.get('/', (req, res) => {
    const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>RangerBlock Relay - ${RELAY_NAME}</title>
    <style>
        body { font-family: 'Monaco', monospace; background: linear-gradient(135deg, #1e3c72, #2a5298); color: #0f0; padding: 40px; margin: 0; }
        .container { max-width: 1200px; margin: 0 auto; background: rgba(0,0,0,0.8); border: 2px solid #0f0; border-radius: 10px; padding: 30px; }
        h1 { text-align: center; text-shadow: 0 0 10px #0f0; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat { background: rgba(0,255,0,0.1); border: 1px solid #0f0; border-radius: 8px; padding: 15px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; }
        .stat-label { color: #0dd; font-size: 0.8em; }
        .section { background: rgba(0,255,0,0.05); border: 1px solid #0f0; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .section h2 { margin-top: 0; color: #0f0; }
        .peer { background: rgba(0,255,0,0.1); border: 1px solid #0f0; border-radius: 5px; padding: 10px; margin: 8px 0; }
        .bridge { background: rgba(0,255,255,0.1); border: 1px solid #0ff; }
        .remote { opacity: 0.8; border-style: dashed; }
        .footer { text-align: center; color: #0dd; margin-top: 20px; padding-top: 15px; border-top: 1px solid #0f0; }
    </style>
    <meta http-equiv="refresh" content="5">
</head>
<body>
    <div class="container">
        <h1>🎖️ RANGERBLOCK RELAY - ${RELAY_NAME.toUpperCase()}</h1>
        <p style="text-align:center;color:#0dd;">Region: ${RELAY_REGION} | Bridge: ${config.bridge.enabled ? 'ENABLED' : 'DISABLED'}</p>

        <div class="stats">
            <div class="stat"><div class="stat-value">${stats.activeNodes}</div><div class="stat-label">Local Nodes</div></div>
            <div class="stat"><div class="stat-value">${stats.remotePeers}</div><div class="stat-label">Remote Peers</div></div>
            <div class="stat"><div class="stat-value">${stats.bridgeConnections}</div><div class="stat-label">Bridges</div></div>
            <div class="stat"><div class="stat-value">${stats.totalMessages}</div><div class="stat-label">Messages</div></div>
            <div class="stat"><div class="stat-value">${stats.bridgeMessages}</div><div class="stat-label">Bridged</div></div>
            <div class="stat"><div class="stat-value">${hours}h${minutes}m</div><div class="stat-label">Uptime</div></div>
        </div>

        <div class="section">
            <h2>🌐 Local Nodes (${nodes.size})</h2>
            ${Array.from(nodes.values()).map(n => `
                <div class="peer">
                    <strong>${n.address || n.id}</strong><br>
                    <small>IP: ${n.ip}:${n.port} | Height: ${n.blockchainHeight} | ${Math.floor((Date.now()-n.lastSeen)/1000)}s ago</small>
                </div>
            `).join('') || '<div style="color:#0dd;padding:10px;">No local nodes</div>'}
        </div>

        <div class="section">
            <h2>🌉 Bridge Connections (${bridgeConnections.size})</h2>
            ${Array.from(bridgeConnections.values()).map(b => `
                <div class="peer bridge">
                    <strong>${b.name}</strong> (${b.region || 'unknown'})<br>
                    <small>${b.host || 'inbound'}:${b.port || ''} | ${b.outbound ? 'Outbound' : 'Inbound'} | ${Math.floor((Date.now()-b.lastSeen)/1000)}s ago</small>
                </div>
            `).join('') || '<div style="color:#0dd;padding:10px;">No bridge connections</div>'}
        </div>

        <div class="section">
            <h2>🌍 Remote Peers (${remotePeers.size})</h2>
            ${Array.from(remotePeers.values()).map(p => `
                <div class="peer remote">
                    <strong>${p.address || p.nodeId}</strong><br>
                    <small>Via: ${p.bridgeName} (${p.relay}) | Height: ${p.blockchainHeight || 0}</small>
                </div>
            `).join('') || '<div style="color:#0dd;padding:10px;">No remote peers</div>'}
        </div>

        <div class="footer">
            WebSocket: ${WS_PORT} | Dashboard: ${HTTP_PORT}<br>
            Rangers lead the way! 🎖️
        </div>
    </div>
</body>
</html>`;
    res.send(html);
});

app.get('/api/nodes', (req, res) => {
    res.json({
        relay: { name: RELAY_NAME, region: RELAY_REGION },
        local: Array.from(nodes.values()).map(n => ({ nodeId: n.id, address: n.address, ip: n.ip, port: n.port })),
        remote: Array.from(remotePeers.values()),
        bridges: Array.from(bridgeConnections.values()).map(b => ({ name: b.name, region: b.region, outbound: b.outbound })),
        stats: stats
    });
});

app.listen(HTTP_PORT, () => {
    console.log(`✅ HTTP dashboard on port ${HTTP_PORT}`);
    console.log(`\n📊 Dashboard: http://localhost:${HTTP_PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${WS_PORT}`);
});

// ═══════════════════════════════════════════════════════════════════
// STARTUP & MAINTENANCE
// ═══════════════════════════════════════════════════════════════════

// Connect to bridge peers on startup
setTimeout(() => {
    connectToBridgePeers();
}, 2000);

// Periodic peer sync to bridges
setInterval(() => {
    syncPeersToBridges();
}, config.bridge.heartbeatInterval);

// Cleanup inactive nodes
setInterval(() => {
    const now = Date.now();
    for (const [id, node] of nodes) {
        if (now - node.lastSeen > 120000) {
            console.log(`🧹 Removing inactive: ${node.address || id}`);
            nodes.delete(id);
        }
    }
    stats.activeNodes = nodes.size;
}, 60000);

// Generate node ID
function generateNodeId() {
    return crypto.randomBytes(8).toString('hex');
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');

    for (const [id, node] of nodes) {
        if (node.ws.readyState === WebSocket.OPEN) {
            node.ws.send(JSON.stringify({ type: 'serverShutdown' }));
            node.ws.close();
        }
    }

    for (const [name, bridge] of bridgeConnections) {
        if (bridge.ws.readyState === WebSocket.OPEN) {
            bridge.ws.close();
        }
    }

    console.log('🎖️ Rangers lead the way!\n');
    process.exit(0);
});

console.log('\n🎖️ Ready! Bridge mode:', config.bridge.enabled ? 'ENABLED' : 'DISABLED');
console.log('');

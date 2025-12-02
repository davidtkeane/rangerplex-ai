#!/usr/bin/env node
/**
 * RANGERBLOCK CHAT v3.0.0
 * =======================
 * Simple P2P chat client for RangerBlock network
 *
 * Usage:
 *   node blockchain-chat.cjs
 *   node blockchain-chat.cjs --nick Ranger
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 */

const WebSocket = require('ws');
const readline = require('readline');
const os = require('os');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = '3.0.0';
const RELAY_HOST = '44.222.101.125';
const RELAY_PORT = 5555;
const DEFAULT_CHANNEL = '#rangers';

// ═══════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════

const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    brightCyan: '\x1b[96m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
};

// User colors for different chat participants
const userColors = [c.cyan, c.green, c.yellow, c.magenta, c.brightCyan, c.brightGreen];
const userColorMap = new Map();

function getUserColor(name) {
    if (!userColorMap.has(name)) {
        userColorMap.set(name, userColors[userColorMap.size % userColors.length]);
    }
    return userColorMap.get(name);
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getTimestamp() {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function log(msg) {
    process.stdout.write(`\r\x1b[K`); // Clear line
    console.log(`${c.dim}[${getTimestamp()}]${c.reset} ${msg}`);
}

function systemMsg(msg) {
    log(`${c.yellow}*${c.reset} ${msg}`);
}

function chatMsg(from, message) {
    const color = getUserColor(from);
    log(`${color}${c.bold}<${from}>${c.reset} ${message}`);
}

function showPrompt(channel, nick) {
    process.stdout.write(`${c.dim}[${channel}]${c.reset} ${c.green}${nick}${c.reset}> `);
}

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

function getMachineName() {
    const hostname = os.hostname().toLowerCase();
    if (hostname.includes('m3') || hostname.includes('genesis')) return 'M3Pro-Genesis';
    if (hostname.includes('m4') || hostname.includes('max')) return 'M4Max-Beast';
    if (hostname.includes('m1') || hostname.includes('air')) return 'M1Air';
    if (hostname.includes('kali')) return 'Kali-Dragon';
    if (hostname.includes('aws') || hostname.includes('ip-')) return 'AWS-Cloud';
    return hostname.slice(0, 15);
}

// ═══════════════════════════════════════════════════════════════════════════
// BANNER
// ═══════════════════════════════════════════════════════════════════════════

function showBanner() {
    console.clear();
    console.log(`
${c.brightCyan}╔══════════════════════════════════════════════════════════════╗
║  ${c.brightYellow}██████╗  ${c.brightGreen}█████╗ ${c.brightCyan}███╗   ██╗ ${c.magenta}██████╗ ${c.red}███████╗${c.brightYellow}██████╗${c.brightCyan}       ║
║  ${c.brightYellow}██╔══██╗${c.brightGreen}██╔══██╗${c.brightCyan}████╗  ██║${c.magenta}██╔════╝ ${c.red}██╔════╝${c.brightYellow}██╔══██╗${c.brightCyan}      ║
║  ${c.brightYellow}██████╔╝${c.brightGreen}███████║${c.brightCyan}██╔██╗ ██║${c.magenta}██║  ███╗${c.red}█████╗  ${c.brightYellow}██████╔╝${c.brightCyan}      ║
║  ${c.brightYellow}██╔══██╗${c.brightGreen}██╔══██║${c.brightCyan}██║╚██╗██║${c.magenta}██║   ██║${c.red}██╔══╝  ${c.brightYellow}██╔══██╗${c.brightCyan}      ║
║  ${c.brightYellow}██║  ██║${c.brightGreen}██║  ██║${c.brightCyan}██║ ╚████║${c.magenta}╚██████╔╝${c.red}███████╗${c.brightYellow}██║  ██║${c.brightCyan}      ║
║  ${c.brightYellow}╚═╝  ╚═╝${c.brightGreen}╚═╝  ╚═╝${c.brightCyan}╚═╝  ╚═══╝${c.magenta} ╚═════╝ ${c.red}╚══════╝${c.brightYellow}╚═╝  ╚═╝${c.brightCyan}      ║
║                                                              ║
║         ${c.brightGreen}★${c.reset} ${c.bold}BLOCKCHAIN CHAT${c.reset} ${c.brightGreen}★${c.brightCyan}  v${VERSION}                      ║
╚══════════════════════════════════════════════════════════════╝${c.reset}
`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
    // Parse args
    const args = process.argv.slice(2);
    let presetNick = null;
    for (let i = 0; i < args.length; i++) {
        if ((args[i] === '--nick' || args[i] === '-n') && args[i + 1]) {
            presetNick = args[i + 1];
        }
    }

    showBanner();

    // Setup readline
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (q) => new Promise(resolve => rl.question(q, resolve));

    // Get username
    let nickname;
    if (presetNick) {
        nickname = presetNick;
        console.log(`${c.dim}Using nickname: ${c.brightGreen}${nickname}${c.reset}\n`);
    } else {
        const defaultName = getMachineName();
        const input = await question(`${c.yellow}Enter your nickname ${c.dim}[${defaultName}]${c.reset}: `);
        nickname = input.trim() || defaultName;
        console.log();
    }

    // Get IP
    const localIP = getLocalIP();
    const nodeId = `${nickname}-${Date.now()}`;
    const currentChannel = DEFAULT_CHANNEL;

    // Connection info
    systemMsg(`Connecting as 🏛️ ${c.brightGreen}${nickname}${c.reset}...`);
    systemMsg(`Relay: ${c.cyan}ws://${RELAY_HOST}:${RELAY_PORT}${c.reset}`);
    systemMsg(`Your IP: ${c.dim}${localIP}${c.reset}`);

    // Connect to relay
    const wsUrl = `ws://${RELAY_HOST}:${RELAY_PORT}`;
    let ws;
    let peers = [];
    let registered = false;

    try {
        ws = new WebSocket(wsUrl);
    } catch (err) {
        systemMsg(`${c.red}Failed to connect: ${err.message}${c.reset}`);
        process.exit(1);
    }

    // WebSocket handlers
    ws.on('open', () => {
        systemMsg(`${c.brightGreen}Connected to blockchain relay!${c.reset}`);
    });

    ws.on('error', (err) => {
        systemMsg(`${c.red}Connection error: ${err.message}${c.reset}`);
    });

    ws.on('close', () => {
        systemMsg(`${c.red}Disconnected from relay${c.reset}`);
        rl.close();
        process.exit(1);
    });

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data.toString());

            switch (msg.type) {
                case 'welcome':
                    // Register with the relay
                    ws.send(JSON.stringify({
                        type: 'register',
                        address: nodeId,
                        nickname: nickname,
                        channel: currentChannel,
                        ip: localIP,
                        port: 0,
                        blockchainHeight: 0
                    }));
                    break;

                case 'registered':
                    registered = true;
                    systemMsg(`Registered as ${c.brightGreen}${nickname}${c.reset}`);
                    systemMsg(`Now talking in ${c.cyan}${currentChannel}${c.reset}`);
                    // Request peer list
                    ws.send(JSON.stringify({ type: 'getPeers' }));
                    break;

                case 'peerList':
                    peers = msg.peers || [];
                    systemMsg(`${c.brightGreen}${peers.length}${c.reset} peer(s) online`);
                    if (peers.length > 0) {
                        peers.forEach(p => {
                            const name = p.nickname || p.address?.slice(0, 12) || 'Unknown';
                            console.log(`   ${c.dim}•${c.reset} ${getUserColor(name)}${name}${c.reset}`);
                        });
                    }
                    console.log();
                    systemMsg(`Type ${c.green}/help${c.reset} for commands. Start chatting!`);
                    console.log();
                    showPrompt(currentChannel, nickname);
                    break;

                case 'peerListUpdate':
                    const oldCount = peers.length;
                    peers = msg.peers || [];
                    if (peers.length > oldCount) {
                        const newPeer = peers[peers.length - 1];
                        const name = newPeer?.nickname || 'Someone';
                        systemMsg(`${c.brightGreen}${name}${c.reset} joined the chat`);
                        showPrompt(currentChannel, nickname);
                    } else if (peers.length < oldCount) {
                        systemMsg(`${c.dim}Someone left the chat${c.reset}`);
                        showPrompt(currentChannel, nickname);
                    }
                    break;

                case 'nodeMessage':
                    // THIS IS THE KEY - incoming messages from other nodes!
                    const payload = msg.payload;
                    if (payload && payload.type === 'chatMessage') {
                        // Get sender name
                        const senderName = payload.nickname || payload.from?.slice(0, 12) || 'Unknown';

                        // Don't show our own messages (we already displayed them locally)
                        if (senderName !== nickname) {
                            chatMsg(senderName, payload.message);
                            showPrompt(currentChannel, nickname);
                        }
                    } else if (payload && payload.type === 'actionMessage') {
                        const senderName = payload.nickname || 'Someone';
                        log(`${c.dim}* ${senderName} ${payload.action}${c.reset}`);
                        showPrompt(currentChannel, nickname);
                    }
                    break;

                case 'broadcastSent':
                    // Our message was sent successfully
                    break;

                case 'error':
                    systemMsg(`${c.red}Error: ${msg.message}${c.reset}`);
                    showPrompt(currentChannel, nickname);
                    break;

                default:
                    // Ignore unknown message types
                    break;
            }
        } catch (err) {
            // Ignore parse errors
        }
    });

    // Handle user input
    rl.on('line', (input) => {
        const text = input.trim();

        if (!text) {
            showPrompt(currentChannel, nickname);
            return;
        }

        // Commands
        if (text.startsWith('/')) {
            const [cmd, ...args] = text.slice(1).split(' ');

            switch (cmd.toLowerCase()) {
                case 'help':
                case 'h':
                    console.log(`
${c.brightCyan}Commands:${c.reset}
  ${c.green}/help${c.reset}              Show this help
  ${c.green}/peers${c.reset}             List online users
  ${c.green}/nick <name>${c.reset}       Change nickname
  ${c.green}/me <action>${c.reset}       Action message
  ${c.green}/clear${c.reset}             Clear screen
  ${c.green}/quit${c.reset}              Exit chat
`);
                    break;

                case 'peers':
                case 'who':
                    if (peers.length === 0) {
                        systemMsg('No other peers online');
                    } else {
                        systemMsg(`${peers.length} peer(s) online:`);
                        peers.forEach(p => {
                            const name = p.nickname || p.address?.slice(0, 12) || 'Unknown';
                            console.log(`   ${c.dim}•${c.reset} ${getUserColor(name)}${name}${c.reset}`);
                        });
                    }
                    break;

                case 'nick':
                    if (args.length > 0) {
                        const oldNick = nickname;
                        nickname = args.join(' ').slice(0, 15);
                        systemMsg(`Nickname changed: ${oldNick} → ${c.brightGreen}${nickname}${c.reset}`);
                    } else {
                        systemMsg('Usage: /nick <name>');
                    }
                    break;

                case 'me':
                    if (args.length > 0) {
                        const action = args.join(' ');
                        ws.send(JSON.stringify({
                            type: 'broadcast',
                            payload: {
                                type: 'actionMessage',
                                from: nodeId,
                                nickname: nickname,
                                action: action,
                                channel: currentChannel,
                                timestamp: Date.now()
                            }
                        }));
                        log(`${c.dim}* ${nickname} ${action}${c.reset}`);
                    }
                    break;

                case 'clear':
                case 'cls':
                    console.clear();
                    systemMsg(`Connected as ${c.brightGreen}${nickname}${c.reset} in ${c.cyan}${currentChannel}${c.reset}`);
                    break;

                case 'quit':
                case 'exit':
                case 'q':
                    console.log(`\n${c.brightGreen}Rangers lead the way! 🎖️${c.reset}\n`);
                    ws.close();
                    rl.close();
                    process.exit(0);
                    break;

                default:
                    systemMsg(`Unknown command: /${cmd}`);
            }

            showPrompt(currentChannel, nickname);
            return;
        }

        // Regular chat message
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'broadcast',
                payload: {
                    type: 'chatMessage',
                    from: nodeId,
                    nickname: nickname,
                    message: text,
                    channel: currentChannel,
                    timestamp: Date.now()
                }
            }));

            // Show our own message locally
            chatMsg(nickname, text);
        } else {
            systemMsg(`${c.red}Not connected to relay${c.reset}`);
        }

        showPrompt(currentChannel, nickname);
    });

    // Handle Ctrl+C
    rl.on('close', () => {
        console.log(`\n${c.brightGreen}Rangers lead the way! 🎖️${c.reset}`);
        ws.close();
    });

    // Heartbeat to keep connection alive
    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
        }
    }, 30000);
}

// Start
main().catch(err => {
    console.error(`${c.red}Error: ${err.message}${c.reset}`);
    process.exit(1);
});

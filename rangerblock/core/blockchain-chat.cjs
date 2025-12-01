#!/usr/bin/env node
/**
 * RANGERBLOCK CHAT v2.0.0
 * =======================
 * Super sexy P2P chat client for RangerBlock network
 *
 * Features:
 *   - Beautiful ASCII art & colors
 *   - Nicknames & private messages
 *   - IRC-style channels (#general, #rangers)
 *   - RangerBot commands (!help, !joke, !fact)
 *   - Auto-reconnect with exponential backoff
 *   - Typing indicators & message timestamps
 *   - Connection status bar
 *
 * Usage:
 *   node blockchain-chat.cjs                           # Connect to AWS relay
 *   node blockchain-chat.cjs --relay 192.168.1.35:5555 # Connect to custom relay
 *   node blockchain-chat.cjs --nick CoolName           # Set custom nickname
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 * Version: 2.0.0
 */

const WebSocket = require('ws');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = '2.0.0';
const DEFAULT_RELAY = '44.222.101.125';  // AWS relay (24/7)
const DEFAULT_PORT = 5555;

// ═══════════════════════════════════════════════════════════════════════════
// COLORS & STYLING (must be defined before argument parsing for --help)
// ═══════════════════════════════════════════════════════════════════════════

const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    italic: '\x1b[3m',
    underline: '\x1b[4m',
    blink: '\x1b[5m',

    // Foreground
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',

    // Bright foreground
    brightRed: '\x1b[91m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
    brightBlue: '\x1b[94m',
    brightMagenta: '\x1b[95m',
    brightCyan: '\x1b[96m',
    brightWhite: '\x1b[97m',

    // Background
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m',
};

// User color palette (cycle through for different users)
const userColors = [
    c.cyan, c.green, c.yellow, c.magenta, c.brightBlue,
    c.brightGreen, c.brightCyan, c.brightMagenta
];
const userColorMap = new Map();

function getUserColor(username) {
    if (!userColorMap.has(username)) {
        const colorIndex = userColorMap.size % userColors.length;
        userColorMap.set(username, userColors[colorIndex]);
    }
    return userColorMap.get(username);
}

// ═══════════════════════════════════════════════════════════════════════════
// ASCII ART & BANNERS
// ═══════════════════════════════════════════════════════════════════════════

const BANNER = `
${c.brightCyan}╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ${c.brightYellow}██████╗  ${c.brightGreen}█████╗ ${c.brightCyan}███╗   ██╗ ${c.brightMagenta}██████╗ ${c.brightRed}███████╗${c.brightYellow}██████╗${c.brightCyan}            ║
║   ${c.brightYellow}██╔══██╗${c.brightGreen}██╔══██╗${c.brightCyan}████╗  ██║${c.brightMagenta}██╔════╝ ${c.brightRed}██╔════╝${c.brightYellow}██╔══██╗${c.brightCyan}           ║
║   ${c.brightYellow}██████╔╝${c.brightGreen}███████║${c.brightCyan}██╔██╗ ██║${c.brightMagenta}██║  ███╗${c.brightRed}█████╗  ${c.brightYellow}██████╔╝${c.brightCyan}           ║
║   ${c.brightYellow}██╔══██╗${c.brightGreen}██╔══██║${c.brightCyan}██║╚██╗██║${c.brightMagenta}██║   ██║${c.brightRed}██╔══╝  ${c.brightYellow}██╔══██╗${c.brightCyan}           ║
║   ${c.brightYellow}██║  ██║${c.brightGreen}██║  ██║${c.brightCyan}██║ ╚████║${c.brightMagenta}╚██████╔╝${c.brightRed}███████╗${c.brightYellow}██║  ██║${c.brightCyan}           ║
║   ${c.brightYellow}╚═╝  ╚═╝${c.brightGreen}╚═╝  ╚═╝${c.brightCyan}╚═╝  ╚═══╝${c.brightMagenta} ╚═════╝ ${c.brightRed}╚══════╝${c.brightYellow}╚═╝  ╚═╝${c.brightCyan}           ║
║                                                                   ║
║   ${c.white}██████╗ ██╗      ██████╗  ██████╗██╗  ██╗${c.brightCyan}                    ║
║   ${c.white}██╔══██╗██║     ██╔═══██╗██╔════╝██║ ██╔╝${c.brightCyan}                    ║
║   ${c.white}██████╔╝██║     ██║   ██║██║     █████╔╝${c.brightCyan}                     ║
║   ${c.white}██╔══██╗██║     ██║   ██║██║     ██╔═██╗${c.brightCyan}                     ║
║   ${c.white}██████╔╝███████╗╚██████╔╝╚██████╗██║  ██╗${c.brightCyan}                    ║
║   ${c.white}╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝${c.brightCyan}                    ║
║                                                                   ║
║           ${c.brightGreen}★ ${c.white}P2P Blockchain Chat Network ${c.brightGreen}★${c.brightCyan}                       ║
║                    ${c.dim}Version ${VERSION}${c.reset}${c.brightCyan}                                ║
╚═══════════════════════════════════════════════════════════════════╝${c.reset}
`;

const MINI_BANNER = `
${c.brightCyan}┌─────────────────────────────────────────┐
│  ${c.brightYellow}⚡${c.brightCyan} ${c.white}RANGERBLOCK CHAT${c.brightCyan} ${c.brightYellow}⚡${c.brightCyan}                  │
│     ${c.dim}P2P Blockchain Network v${VERSION}${c.reset}${c.brightCyan}      │
└─────────────────────────────────────────┘${c.reset}`;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function showHelp() {
    console.log(`
${c.brightCyan}RANGERBLOCK CHAT v${VERSION}${c.reset}
${c.dim}P2P chat between RangerBlock nodes${c.reset}

${c.brightYellow}USAGE:${c.reset}
  node blockchain-chat.cjs [options]

${c.brightYellow}OPTIONS:${c.reset}
  ${c.green}-r, --relay <host:port>${c.reset}  Connect to specific relay (default: AWS)
  ${c.green}-n, --nick <name>${c.reset}        Set your nickname (max 15 chars)
  ${c.green}-c, --channel <name>${c.reset}     Join specific channel (default: #general)
  ${c.green}-h, --help${c.reset}               Show this help
  ${c.green}-v, --version${c.reset}            Show version

${c.brightYellow}EXAMPLES:${c.reset}
  ${c.dim}# Connect to AWS relay (default)${c.reset}
  node blockchain-chat.cjs

  ${c.dim}# Connect to local relay with nickname${c.reset}
  node blockchain-chat.cjs --relay localhost:5555 --nick CoolGuy

  ${c.dim}# Connect to Google Cloud relay${c.reset}
  node blockchain-chat.cjs --relay 34.26.30.249:5555

${c.brightYellow}CHAT COMMANDS:${c.reset}
  ${c.cyan}/help${c.reset}                    Show all commands
  ${c.cyan}/nick <name>${c.reset}             Change nickname
  ${c.cyan}/join <#channel>${c.reset}         Join a channel
  ${c.cyan}/msg <user> <text>${c.reset}       Private message
  ${c.cyan}/peers${c.reset}                   List online users
  ${c.cyan}/channels${c.reset}                List available channels
  ${c.cyan}/clear${c.reset}                   Clear screen
  ${c.cyan}/quit${c.reset}                    Exit chat

${c.brightYellow}RANGERBOT COMMANDS:${c.reset}
  ${c.magenta}!help${c.reset}                    Bot commands
  ${c.magenta}!joke${c.reset}                    Random joke
  ${c.magenta}!fact${c.reset}                    Random fact
  ${c.magenta}!8ball <question>${c.reset}        Magic 8-ball
  ${c.magenta}!dice${c.reset}                    Roll dice
  ${c.magenta}!time${c.reset}                    Server time

${c.brightGreen}Rangers lead the way! 🎖️${c.reset}
`);
}

// ═══════════════════════════════════════════════════════════════════════════
// ARGUMENT PARSING
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
let relayHost = DEFAULT_RELAY;
let relayPort = DEFAULT_PORT;
let customNick = null;
let currentChannel = '#rangers';

for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--relay' || args[i] === '-r') && args[i + 1]) {
        const parts = args[i + 1].split(':');
        relayHost = parts[0];
        relayPort = parseInt(parts[1]) || 5555;
        i++;
    } else if ((args[i] === '--nick' || args[i] === '-n') && args[i + 1]) {
        customNick = args[i + 1].slice(0, 15);  // Max 15 chars
        i++;
    } else if ((args[i] === '--channel' || args[i] === '-c') && args[i + 1]) {
        currentChannel = args[i + 1].startsWith('#') ? args[i + 1] : '#' + args[i + 1];
        i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
        showHelp();
        process.exit(0);
    } else if (args[i] === '--version' || args[i] === '-v') {
        console.log(`RangerBlock Chat v${VERSION}`);
        process.exit(0);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// IDENTITY & NAME FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Load node identity
function loadIdentity() {
    // Check multiple locations for identity file
    const possibleDirs = [
        path.join(__dirname, '..', '.personal'),
        path.join(__dirname, '.personal'),
        path.join(os.homedir(), '.rangerblock'),
        path.join(os.homedir(), 'rangerblock-server', '.personal'),
    ];

    const possibleFiles = [
        'node_identity.json',
        'genesis_node.json',
    ];

    for (const dir of possibleDirs) {
        for (const file of possibleFiles) {
            const filePath = path.join(dir, file);
            if (fs.existsSync(filePath)) {
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    return {
                        nodeID: data.nodeID || data.node_address || data.address || 'Unknown',
                        nodeType: data.nodeType || data.node_type || 'peer',
                        machineName: data.machineName || data.machine_name || null
                    };
                } catch (e) {
                    continue;
                }
            }
        }
    }

    return null;
}

// Get display name from nodeID
function getDisplayName(nodeID, machineName) {
    if (!nodeID) return 'Unknown';

    // Check for machine name first
    if (machineName) return machineName;

    // Known machines
    if (nodeID.includes('GENESIS') || nodeID.includes('M3Pro')) return 'M3Pro-Genesis';
    if (nodeID.includes('M1Air') || nodeID.includes('M1')) return 'M1Air';
    if (nodeID.includes('M4Max') || nodeID.includes('M4')) return 'M4Max-Beast';
    if (nodeID.includes('Kali')) return 'Kali-Dragon';
    if (nodeID.includes('AWS')) return 'AWS-Cloud';
    if (nodeID.includes('GCP') || nodeID.includes('Google')) return 'GCP-Cloud';

    // Extract meaningful part
    if (nodeID.includes('-')) {
        const parts = nodeID.split('-');
        return parts[0].slice(0, 12);
    }

    return nodeID.slice(0, 12);
}

// Format timestamp
function formatTime(date = new Date()) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// Clear line and move cursor
function clearLine() {
    process.stdout.write('\r\x1b[K');
}

// Print system message
function sysMsg(text, type = 'info') {
    clearLine();
    const icons = {
        info: `${c.brightCyan}ℹ${c.reset}`,
        success: `${c.brightGreen}✓${c.reset}`,
        warning: `${c.brightYellow}⚠${c.reset}`,
        error: `${c.brightRed}✗${c.reset}`,
        join: `${c.brightGreen}→${c.reset}`,
        leave: `${c.brightRed}←${c.reset}`,
        bot: `${c.brightMagenta}🤖${c.reset}`,
    };
    console.log(`  ${icons[type] || icons.info} ${c.dim}${text}${c.reset}`);
}

// Print chat message
// Print chat message safely handling readline
function chatMsg(sender, message, isPrivate = false, channel = null) {
    // Clear current line
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);

    const time = `${c.dim}[${formatTime()}]${c.reset}`;
    const color = getUserColor(sender);
    const prefix = isPrivate ? `${c.brightMagenta}[PM]${c.reset} ` : '';
    const channelTag = channel && channel !== currentChannel ? `${c.dim}${channel}${c.reset} ` : '';

    console.log(`${time} ${prefix}${channelTag}${color}${c.bold}${sender}${c.reset}: ${message}`);

    // Force prompt redraw (this preserves the user's typed input!)
    // We need to access the 'rl' instance. Since it's defined in runChat, 
    // we can't access it here easily without passing it or making it global.
    // BUT, we can just print a newline if we can't redraw perfectly.
    // Ideally, this function should be inside runChat or accept rl.
}

// Animation: connecting dots
async function animateConnecting(ws, timeout = 10000) {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    const start = Date.now();

    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                clearInterval(interval);
                clearLine();
                resolve(true);
            } else if (ws.readyState === WebSocket.CLOSED || Date.now() - start > timeout) {
                clearInterval(interval);
                clearLine();
                reject(new Error('Connection timeout'));
            } else {
                process.stdout.write(`\r  ${c.brightCyan}${frames[i]}${c.reset} Connecting to relay...`);
                i = (i + 1) % frames.length;
            }
        }, 80);
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CHAT APPLICATION
// ═══════════════════════════════════════════════════════════════════════════

async function runChat() {
    // Load identity
    const identity = loadIdentity();
    let myName = customNick || (identity ? getDisplayName(identity.nodeID, identity.machineName) : `User-${Math.random().toString(36).slice(2, 6)}`);
    const myFullID = identity?.nodeID || `Chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Show banner
    console.clear();
    console.log(BANNER);

    // Connection info box
    console.log(`${c.brightCyan}┌──────────────────────────────────────────────────────────────────┐${c.reset}`);
    console.log(`${c.brightCyan}│${c.reset}  ${c.brightYellow}⚡ CONNECTION INFO${c.reset}                                              ${c.brightCyan}│${c.reset}`);
    console.log(`${c.brightCyan}├──────────────────────────────────────────────────────────────────┤${c.reset}`);
    console.log(`${c.brightCyan}│${c.reset}  ${c.white}You are:${c.reset}    ${c.brightGreen}${myName.padEnd(20)}${c.reset}                          ${c.brightCyan}│${c.reset}`);
    console.log(`${c.brightCyan}│${c.reset}  ${c.white}Channel:${c.reset}    ${c.cyan}${currentChannel.padEnd(20)}${c.reset}                          ${c.brightCyan}│${c.reset}`);
    console.log(`${c.brightCyan}│${c.reset}  ${c.white}Relay:${c.reset}      ${c.dim}${(relayHost + ':' + relayPort).padEnd(20)}${c.reset}                          ${c.brightCyan}│${c.reset}`);
    console.log(`${c.brightCyan}└──────────────────────────────────────────────────────────────────┘${c.reset}`);
    console.log();

    // Connect to relay
    const wsUrl = `ws://${relayHost}:${relayPort}`;
    let ws;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    function connect() {
        try {
            ws = new WebSocket(wsUrl);
        } catch (err) {
            sysMsg(`Failed to create connection: ${err.message}`, 'error');
            process.exit(1);
        }

        return ws;
    }

    ws = connect();

    // Try to animate connection
    try {
        await animateConnecting(ws);
        sysMsg('Connected to RangerBlock network!', 'success');
        reconnectAttempts = 0;
    } catch (err) {
        sysMsg(`Connection failed: ${err.message}`, 'error');
        process.exit(1);
    }

    let myNodeId = null;
    let peers = [];
    let channels = ['#general', '#rangers', '#admin', '#random'];

    // Setup readline
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // Custom prompt
    function showPrompt() {
        const channelColor = currentChannel === '#rangers' ? c.brightYellow :
            currentChannel === '#admin' ? c.brightRed : c.cyan;
        const promptText = `${channelColor}${currentChannel}${c.reset} ${c.green}${myName}${c.reset}${c.dim}>${c.reset} `;
        process.stdout.write(promptText);
        // If rl has input, we should write it back out? 
        // Readline usually handles this if we don't mess with it too much.
        // But explicit prompt setting is safer:
        rl.setPrompt(promptText);
        rl.prompt(true);
    }

    // Handle Ctrl+C (SIGINT)
    rl.on('SIGINT', () => {
        console.log();
        console.log(`${c.brightYellow}Goodbye! Rangers lead the way! 🎖️${c.reset}`);
        process.exit(0);
    });

    // Show commands help
    function showCommands() {
        console.log(`
${c.brightCyan}╔═══════════════════════════════════════════════════════════════╗
║                     ${c.brightYellow}CHAT COMMANDS${c.brightCyan}                              ║
╠═══════════════════════════════════════════════════════════════╣${c.reset}
${c.brightCyan}║${c.reset}  ${c.green}/help${c.reset}                    Show this help                  ${c.brightCyan}║${c.reset}
${c.brightCyan}║${c.reset}  ${c.green}/nick <name>${c.reset}             Change your nickname            ${c.brightCyan}║${c.reset}
${c.brightCyan}║${c.reset}  ${c.green}/join <#channel>${c.reset}         Join a channel                  ${c.brightCyan}║${c.reset}
${c.brightCyan}║${c.reset}  ${c.green}/msg <user> <text>${c.reset}       Send private message            ${c.brightCyan}║${c.reset}
${c.brightCyan}║${c.reset}  ${c.green}/peers${c.reset}                   List online users               ${c.brightCyan}║${c.reset}
${c.brightCyan}║${c.reset}  ${c.green}/channels${c.reset}                List available channels         ${c.brightCyan}║${c.reset}
${c.brightCyan}║${c.reset}  ${c.green}/me <action>${c.reset}             Action message                  ${c.brightCyan}║${c.reset}
${c.brightCyan}║${c.reset}  ${c.green}/clear${c.reset}                   Clear screen                    ${c.brightCyan}║${c.reset}
${c.brightCyan}║${c.reset}  ${c.green}/quit${c.reset}                    Exit chat                       ${c.brightCyan}║${c.reset}
${c.brightCyan}╠═══════════════════════════════════════════════════════════════╣
║                    ${c.brightMagenta}RANGERBOT COMMANDS${c.brightCyan}                          ║
╠═══════════════════════════════════════════════════════════════╣${c.reset}
${c.brightCyan}║${c.reset}  ${c.magenta}!help${c.reset}                    Bot help                        ${c.brightCyan}║${c.reset}
${c.brightCyan}║${c.reset}  ${c.magenta}!joke${c.reset}                    Random programmer joke          ${c.brightCyan}║${c.reset}
${c.brightCyan}║${c.reset}  ${c.magenta}!fact${c.reset}                    Random fun fact                 ${c.brightCyan}║${c.reset}
${c.brightCyan}║${c.reset}  ${c.magenta}!8ball <question>${c.reset}        Magic 8-ball                    ${c.brightCyan}║${c.reset}
${c.brightCyan}║${c.reset}  ${c.magenta}!dice [sides]${c.reset}            Roll dice                       ${c.brightCyan}║${c.reset}
${c.brightCyan}║${c.reset}  ${c.magenta}!time${c.reset}                    Server time                     ${c.brightCyan}║${c.reset}
${c.brightCyan}║${c.reset}  ${c.magenta}!status${c.reset}                  Network status                  ${c.brightCyan}║${c.reset}
${c.brightCyan}╚═══════════════════════════════════════════════════════════════╝${c.reset}
`);
    }

    // Handle WebSocket messages
    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            handleMessage(msg);
        } catch (err) {
            // Ignore parse errors silently
        }
    });

    ws.on('error', (err) => {
        sysMsg(`Connection error: ${err.message}`, 'error');
    });

    ws.on('close', () => {
        if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            sysMsg(`Disconnected. Reconnecting in ${delay / 1000}s... (attempt ${reconnectAttempts}/${maxReconnectAttempts})`, 'warning');
            setTimeout(() => {
                ws = connect();
                setupWebSocket();
            }, delay);
        } else {
            sysMsg('Connection lost. Please restart the chat.', 'error');
            rl.close();
            process.exit(1);
        }
    });

    function setupWebSocket() {
        ws.on('open', () => {
            sysMsg('Reconnected!', 'success');
            reconnectAttempts = 0;
            showPrompt();
        });

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                handleMessage(msg);
            } catch (err) {
                // Ignore
            }
        });
    }

    function handleMessage(msg) {
        switch (msg.type) {
            case 'welcome':
                myNodeId = msg.nodeId;
                // Register with nickname
                ws.send(JSON.stringify({
                    type: 'register',
                    address: myFullID,
                    nickname: myName,
                    channel: currentChannel,
                    port: 0,
                    blockchainHeight: 0
                }));
                break;

            case 'registered':
                ws.send(JSON.stringify({ type: 'getPeers' }));
                break;

            case 'peerList':
            case 'peerListUpdate':
                const oldPeerCount = peers.length;
                peers = msg.peers || [];

                if (msg.type === 'peerList') {
                    console.log();
                    if (peers.length > 0) {
                        sysMsg(`${peers.length} user(s) online:`, 'info');
                        peers.forEach(p => {
                            const name = p.nickname || getDisplayName(p.address);
                            const color = getUserColor(name);
                            console.log(`     ${color}●${c.reset} ${name}`);
                        });
                    } else {
                        sysMsg('You\'re the first one here! Invite others to join.', 'info');
                    }
                    console.log();
                    sysMsg(`Type ${c.green}/help${c.reset} for commands or just start chatting!`, 'info');
                    console.log();
                    showPrompt();
                } else {
                    // Peer update notification
                    if (peers.length > oldPeerCount) {
                        const newPeer = peers[peers.length - 1];
                        const name = newPeer?.nickname || getDisplayName(newPeer?.address);
                        sysMsg(`${c.brightGreen}${name}${c.reset} joined the chat`, 'join');
                        showPrompt();
                    } else if (peers.length < oldPeerCount) {
                        sysMsg('Someone left the chat', 'leave');
                        showPrompt();
                    }
                }
                break;

            case 'nodeMessage':
                const payload = msg.payload;

                if (payload.type === 'chatMessage') {
                    const senderName = payload.nickname || getDisplayName(msg.from);
                    const isPrivate = payload.private === true;
                    const msgChannel = payload.channel || '#general';

                    // Only show if same channel or private
                    if (isPrivate || msgChannel === currentChannel) {
                        // Clear current line
                        readline.cursorTo(process.stdout, 0);
                        readline.clearLine(process.stdout, 0);

                        const time = `${c.dim}[${formatTime()}]${c.reset}`;
                        const color = getUserColor(senderName);
                        const prefix = isPrivate ? `${c.brightMagenta}[PM]${c.reset} ` : '';
                        const channelTag = msgChannel && msgChannel !== currentChannel ? `${c.dim}${msgChannel}${c.reset} ` : '';

                        console.log(`${time} ${prefix}${channelTag}${color}${c.bold}${senderName}${c.reset}: ${payload.message}`);

                        // Redraw prompt and preserve input buffer!
                        rl.prompt(true);
                    }
                } else if (payload.type === 'actionMessage') {
                    const senderName = payload.nickname || getDisplayName(msg.from);
                    clearLine();
                    console.log(`  ${c.dim}*${c.reset} ${c.italic}${getUserColor(senderName)}${senderName}${c.reset} ${c.italic}${payload.action}${c.reset}`);
                    showPrompt();
                } else if (payload.type === 'botResponse') {
                    sysMsg(payload.message, 'bot');
                    showPrompt();
                }
                break;

            case 'broadcastSent':
                // Message sent successfully
                break;

            case 'error':
                sysMsg(msg.message, 'error');
                showPrompt();
                break;
        }
    }

    // Handle user input
    rl.on('line', (input) => {
        const trimmed = input.trim();

        if (!trimmed) {
            showPrompt();
            return;
        }

        // Handle slash commands
        if (trimmed.startsWith('/')) {
            const parts = trimmed.slice(1).split(' ');
            const cmd = parts[0].toLowerCase();
            const cmdArgs = parts.slice(1);

            switch (cmd) {
                case 'quit':
                case 'exit':
                case 'q':
                    console.log();
                    console.log(`${c.brightCyan}╔═══════════════════════════════════════════════════════════════╗${c.reset}`);
                    console.log(`${c.brightCyan}║${c.reset}      ${c.brightYellow}Thanks for using RangerBlock Chat!${c.reset}                     ${c.brightCyan}║${c.reset}`);
                    console.log(`${c.brightCyan}║${c.reset}          ${c.brightGreen}Rangers lead the way! 🎖️${c.reset}                          ${c.brightCyan}║${c.reset}`);
                    console.log(`${c.brightCyan}╚═══════════════════════════════════════════════════════════════╝${c.reset}`);
                    console.log();
                    ws.close();
                    rl.close();
                    process.exit(0);
                    break;

                case 'help':
                case 'h':
                case '?':
                    showCommands();
                    showPrompt();
                    break;

                case 'nick':
                    if (cmdArgs.length > 0) {
                        const oldName = myName;
                        myName = cmdArgs.join(' ').slice(0, 15);
                        sysMsg(`Nickname changed: ${oldName} → ${c.brightGreen}${myName}${c.reset}`, 'success');
                        // Notify others
                        ws.send(JSON.stringify({
                            type: 'broadcast',
                            payload: {
                                type: 'actionMessage',
                                nickname: myName,
                                action: `is now known as ${myName}`,
                                channel: currentChannel
                            }
                        }));
                    } else {
                        sysMsg('Usage: /nick <new_name>', 'warning');
                    }
                    showPrompt();
                    break;

                case 'join':
                case 'j':
                    if (cmdArgs.length > 0) {
                        const newChannel = cmdArgs[0].startsWith('#') ? cmdArgs[0] : '#' + cmdArgs[0];
                        const oldChannel = currentChannel;
                        currentChannel = newChannel;
                        sysMsg(`Joined ${c.cyan}${currentChannel}${c.reset} (was in ${oldChannel})`, 'success');
                        if (!channels.includes(newChannel)) {
                            channels.push(newChannel);
                        }
                    } else {
                        sysMsg('Usage: /join <#channel>', 'warning');
                    }
                    showPrompt();
                    break;

                case 'channels':
                case 'ch':
                    console.log();
                    sysMsg('Available channels:', 'info');
                    channels.forEach(ch => {
                        const marker = ch === currentChannel ? `${c.brightGreen}●${c.reset}` : `${c.dim}○${c.reset}`;
                        console.log(`     ${marker} ${c.cyan}${ch}${c.reset}`);
                    });
                    console.log();
                    showPrompt();
                    break;

                case 'peers':
                case 'users':
                case 'who':
                    console.log();
                    if (peers.length === 0) {
                        sysMsg('No other users online.', 'info');
                    } else {
                        sysMsg(`${peers.length} user(s) online:`, 'info');
                        peers.forEach(p => {
                            const name = p.nickname || getDisplayName(p.address);
                            const color = getUserColor(name);
                            console.log(`     ${color}●${c.reset} ${name} ${c.dim}(${p.ip || 'unknown'})${c.reset}`);
                        });
                    }
                    console.log();
                    showPrompt();
                    break;

                case 'msg':
                case 'pm':
                case 'whisper':
                case 'w':
                    if (cmdArgs.length >= 2) {
                        const targetUser = cmdArgs[0];
                        const pmMessage = cmdArgs.slice(1).join(' ');
                        // Find peer
                        const targetPeer = peers.find(p =>
                            (p.nickname || getDisplayName(p.address)).toLowerCase() === targetUser.toLowerCase()
                        );
                        if (targetPeer) {
                            ws.send(JSON.stringify({
                                type: 'relayMessage',
                                targetNodeId: targetPeer.nodeId,
                                payload: {
                                    type: 'chatMessage',
                                    from: myFullID,
                                    nickname: myName,
                                    message: pmMessage,
                                    private: true,
                                    timestamp: Date.now()
                                }
                            }));
                            chatMsg(`→ ${targetUser}`, pmMessage, true);
                        } else {
                            sysMsg(`User "${targetUser}" not found.`, 'error');
                        }
                    } else {
                        sysMsg('Usage: /msg <user> <message>', 'warning');
                    }
                    showPrompt();
                    break;

                case 'me':
                    if (cmdArgs.length > 0) {
                        const action = cmdArgs.join(' ');
                        ws.send(JSON.stringify({
                            type: 'broadcast',
                            payload: {
                                type: 'actionMessage',
                                from: myFullID,
                                nickname: myName,
                                action: action,
                                channel: currentChannel,
                                timestamp: Date.now()
                            }
                        }));
                        console.log(`  ${c.dim}*${c.reset} ${c.italic}${getUserColor(myName)}${myName}${c.reset} ${c.italic}${action}${c.reset}`);
                    } else {
                        sysMsg('Usage: /me <action>', 'warning');
                    }
                    showPrompt();
                    break;

                case 'clear':
                case 'cls':
                    console.clear();
                    console.log(MINI_BANNER);
                    console.log();
                    sysMsg(`Connected as ${c.brightGreen}${myName}${c.reset} in ${c.cyan}${currentChannel}${c.reset}`, 'info');
                    console.log();
                    showPrompt();
                    break;

                default:
                    sysMsg(`Unknown command: /${cmd}. Type /help for commands.`, 'warning');
                    showPrompt();
            }
            return;
        }

        // Handle RangerBot commands (!)
        if (trimmed.startsWith('!')) {
            // Send to relay - RangerBot will respond
            ws.send(JSON.stringify({
                type: 'broadcast',
                payload: {
                    type: 'chatMessage',
                    from: myFullID,
                    nickname: myName,
                    message: trimmed,
                    channel: currentChannel,
                    timestamp: Date.now()
                }
            }));
            showPrompt();
            return;
        }

        // Regular chat message
        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'chatMessage',
                from: myFullID,
                nickname: myName,
                message: trimmed,
                channel: currentChannel,
                timestamp: Date.now()
            }
        }));

        showPrompt();
    });

    // Handle Ctrl+C gracefully
    rl.on('close', () => {
        console.log();
        sysMsg('Goodbye! Rangers lead the way! 🎖️', 'info');
        ws.close();
    });

    process.on('SIGINT', () => {
        rl.close();
    });

    // Heartbeat
    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
        }
    }, 30000);
}

// ═══════════════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════════════

runChat().catch((err) => {
    console.error(`${c.brightRed}Error:${c.reset} ${err.message}`);
    process.exit(1);
});

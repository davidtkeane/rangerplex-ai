#!/usr/bin/env node
/**
 * RANGERBLOCK VOICE CHAT v1.0.0
 * =============================
 * P2P Voice communication over blockchain relay
 *
 * Usage:
 *   node voice-chat.cjs
 *   node voice-chat.cjs --nick Ranger
 *
 * Requirements:
 *   - macOS: brew install sox
 *   - Linux: apt install sox libsox-fmt-all
 *   - Windows: Install SoX from https://sox.sourceforge.net/
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 * Philosophy: "One foot in front of the other"
 * Innovation: David's 73→27→73 compression mathematics
 */

const WebSocket = require('ws');
const readline = require('readline');
const os = require('os');
const zlib = require('zlib');
const { spawn } = require('child_process');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = '1.1.0';
const RELAY_HOST = '44.222.101.125';
const RELAY_PORT = 5555;
const DEFAULT_CHANNEL = '#rangers-voice';

// Audio settings
const SAMPLE_RATE = 16000;      // 16kHz for voice (smaller than 44.1kHz CD quality)
const CHANNELS = 1;              // Mono
const BIT_DEPTH = 16;            // 16-bit
const CHUNK_DURATION_MS = 100;   // 100ms chunks

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
    brightMagenta: '\x1b[95m',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getTimestamp() {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function log(msg) {
    process.stdout.write(`\r\x1b[K`);
    console.log(`${c.dim}[${getTimestamp()}]${c.reset} ${msg}`);
}

function systemMsg(msg) {
    log(`${c.yellow}*${c.reset} ${msg}`);
}

function voiceMsg(from, status) {
    log(`${c.brightMagenta}🎤${c.reset} ${c.bold}${from}${c.reset} ${status}`);
}

function showPrompt(channel, nick) {
    process.stdout.write(`${c.dim}[${channel}]${c.reset} ${c.magenta}${nick}${c.reset}> `);
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
    if (hostname.includes('m3') || hostname.includes('genesis')) return 'M3Pro-Voice';
    if (hostname.includes('m4') || hostname.includes('max')) return 'M4Max-Voice';
    if (hostname.includes('m1') || hostname.includes('air')) return 'M1Air-Voice';
    if (hostname.includes('msi') || hostname.includes('vector')) return 'MSI-Voice';
    if (hostname.includes('aws') || hostname.includes('ip-')) return 'AWS-Voice';
    return hostname.slice(0, 12) + '-Voice';
}

// ═══════════════════════════════════════════════════════════════════════════
// DAVID'S 73→27→73 COMPRESSION
// ═══════════════════════════════════════════════════════════════════════════

function compressAudio(audioBuffer) {
    /**
     * David's compression mathematics:
     * - Compress to ~27% of original size for transmission
     * - Decompress to ~73% quality on receive
     * - Balance between size and quality
     */
    try {
        const compressed = zlib.deflateSync(audioBuffer, { level: 9 });
        const ratio = compressed.length / audioBuffer.length;
        return {
            data: compressed,
            originalSize: audioBuffer.length,
            compressedSize: compressed.length,
            ratio: ratio,
            davidMath: ratio <= 0.27 ? '27% achieved!' : `${(ratio * 100).toFixed(1)}%`
        };
    } catch (err) {
        return { data: audioBuffer, error: err.message };
    }
}

function decompressAudio(compressedBuffer) {
    /**
     * David's decompression: Restore from 27% to playable audio
     */
    try {
        return zlib.inflateSync(compressedBuffer);
    } catch (err) {
        console.error(`Decompression error: ${err.message}`);
        return compressedBuffer;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO CAPTURE (using SoX)
// ═══════════════════════════════════════════════════════════════════════════

class AudioCapture {
    constructor() {
        this.recording = false;
        this.process = null;
        this.chunks = [];
    }

    checkSoxInstalled() {
        return new Promise((resolve) => {
            const check = spawn('sox', ['--version']);
            check.on('error', () => resolve(false));
            check.on('close', (code) => resolve(code === 0));
        });
    }

    startRecording(onData) {
        if (this.recording) return;

        // SoX command to capture audio
        // -d = default input device
        // -t raw = raw audio output
        // -r = sample rate
        // -c = channels
        // -b = bit depth
        // -e signed = signed integer encoding
        const args = [
            '-d',                    // Default input device
            '-t', 'raw',            // Raw output format
            '-r', String(SAMPLE_RATE),
            '-c', String(CHANNELS),
            '-b', String(BIT_DEPTH),
            '-e', 'signed-integer',
            '-'                      // Output to stdout
        ];

        this.process = spawn('sox', args);
        this.recording = true;

        this.process.stdout.on('data', (chunk) => {
            if (onData) onData(chunk);
        });

        this.process.stderr.on('data', (data) => {
            // SoX outputs info to stderr, ignore unless error
            const msg = data.toString();
            if (msg.includes('error') || msg.includes('FAIL')) {
                console.error(`${c.red}SoX error: ${msg}${c.reset}`);
            }
        });

        this.process.on('error', (err) => {
            console.error(`${c.red}Audio capture error: ${err.message}${c.reset}`);
            this.recording = false;
        });

        this.process.on('close', () => {
            this.recording = false;
        });
    }

    stopRecording() {
        if (this.process) {
            this.process.kill('SIGTERM');
            this.process = null;
        }
        this.recording = false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO PLAYBACK (using SoX)
// ═══════════════════════════════════════════════════════════════════════════

class AudioPlayback {
    constructor() {
        this.playing = false;
        this.queue = [];
    }

    play(audioBuffer) {
        // SoX play command
        // -t raw = raw input format
        // -r = sample rate
        // -c = channels
        // -b = bit depth
        // -e signed = signed integer encoding
        const args = [
            '-t', 'raw',
            '-r', String(SAMPLE_RATE),
            '-c', String(CHANNELS),
            '-b', String(BIT_DEPTH),
            '-e', 'signed-integer',
            '-',                     // Input from stdin
            '-d'                     // Output to default device
        ];

        const player = spawn('sox', args);

        player.stdin.write(audioBuffer);
        player.stdin.end();

        player.on('error', (err) => {
            // Silently handle - likely just no audio device
        });

        return player;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// BANNER
// ═══════════════════════════════════════════════════════════════════════════

function showBanner() {
    console.clear();
    console.log(`
${c.brightMagenta}╔══════════════════════════════════════════════════════════════╗
║  ${c.brightYellow}██╗   ██╗${c.brightGreen} ██████╗ ${c.brightCyan}██╗${c.magenta} ██████╗${c.red}███████╗${c.brightMagenta}                     ║
║  ${c.brightYellow}██║   ██║${c.brightGreen}██╔═══██╗${c.brightCyan}██║${c.magenta}██╔════╝${c.red}██╔════╝${c.brightMagenta}                     ║
║  ${c.brightYellow}██║   ██║${c.brightGreen}██║   ██║${c.brightCyan}██║${c.magenta}██║     ${c.red}█████╗  ${c.brightMagenta}                     ║
║  ${c.brightYellow}╚██╗ ██╔╝${c.brightGreen}██║   ██║${c.brightCyan}██║${c.magenta}██║     ${c.red}██╔══╝  ${c.brightMagenta}                     ║
║  ${c.brightYellow} ╚████╔╝ ${c.brightGreen}╚██████╔╝${c.brightCyan}██║${c.magenta}╚██████╗${c.red}███████╗${c.brightMagenta}                     ║
║  ${c.brightYellow}  ╚═══╝  ${c.brightGreen} ╚═════╝ ${c.brightCyan}╚═╝${c.magenta} ╚═════╝${c.red}╚══════╝${c.brightMagenta}                     ║
║                                                              ║
║     ${c.brightGreen}★${c.reset} ${c.bold}RANGERBLOCK VOICE CHAT${c.reset} ${c.brightGreen}★${c.brightMagenta}  v${VERSION}                  ║
║     ${c.dim}David's 73→27→73 Compression${c.brightMagenta}                          ║
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

    // Check SoX installation
    const audioCapture = new AudioCapture();
    const audioPlayback = new AudioPlayback();

    const soxInstalled = await audioCapture.checkSoxInstalled();
    if (!soxInstalled) {
        console.log(`${c.red}╔════════════════════════════════════════════════════════════╗${c.reset}`);
        console.log(`${c.red}║  ⚠️  SoX NOT INSTALLED - Required for audio                 ║${c.reset}`);
        console.log(`${c.red}╠════════════════════════════════════════════════════════════╣${c.reset}`);
        console.log(`${c.red}║${c.reset}                                                            ${c.red}║${c.reset}`);
        console.log(`${c.red}║${c.reset}  ${c.cyan}macOS:${c.reset}   brew install sox                              ${c.red}║${c.reset}`);
        console.log(`${c.red}║${c.reset}  ${c.cyan}Linux:${c.reset}   sudo apt install sox libsox-fmt-all           ${c.red}║${c.reset}`);
        console.log(`${c.red}║${c.reset}  ${c.cyan}Windows:${c.reset} Download from https://sox.sourceforge.net/    ${c.red}║${c.reset}`);
        console.log(`${c.red}║${c.reset}                                                            ${c.red}║${c.reset}`);
        console.log(`${c.red}╚════════════════════════════════════════════════════════════╝${c.reset}`);
        console.log();
        process.exit(1);
    }

    systemMsg(`${c.green}SoX audio system detected${c.reset}`);

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
        console.log(`${c.dim}Using nickname: ${c.brightMagenta}${nickname}${c.reset}\n`);
    } else {
        const defaultName = getMachineName();
        const input = await question(`${c.yellow}Enter your nickname ${c.dim}[${defaultName}]${c.reset}: `);
        nickname = input.trim() || defaultName;
        console.log();
    }

    // Connection info
    const localIP = getLocalIP();
    const nodeId = `${nickname}-${Date.now()}`;
    const currentChannel = DEFAULT_CHANNEL;

    systemMsg(`Connecting as 🎤 ${c.brightMagenta}${nickname}${c.reset}...`);
    systemMsg(`Relay: ${c.cyan}ws://${RELAY_HOST}:${RELAY_PORT}${c.reset}`);

    // Connect to relay
    const wsUrl = `ws://${RELAY_HOST}:${RELAY_PORT}`;
    let ws;
    let peers = [];
    let isTalking = false;
    let isMuted = false;

    try {
        ws = new WebSocket(wsUrl);
    } catch (err) {
        systemMsg(`${c.red}Failed to connect: ${err.message}${c.reset}`);
        process.exit(1);
    }

    // WebSocket handlers
    ws.on('open', () => {
        systemMsg(`${c.brightGreen}Connected to voice relay!${c.reset}`);
    });

    ws.on('error', (err) => {
        systemMsg(`${c.red}Connection error: ${err.message}${c.reset}`);
    });

    ws.on('close', () => {
        systemMsg(`${c.red}Disconnected from relay${c.reset}`);
        audioCapture.stopRecording();
        rl.close();
        process.exit(1);
    });

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data.toString());

            switch (msg.type) {
                case 'welcome':
                    ws.send(JSON.stringify({
                        type: 'register',
                        address: nodeId,
                        nickname: nickname,
                        channel: currentChannel,
                        ip: localIP,
                        port: 0,
                        mode: 'voice'
                    }));
                    break;

                case 'registered':
                    systemMsg(`Registered as ${c.brightMagenta}${nickname}${c.reset}`);
                    systemMsg(`Voice channel: ${c.cyan}${currentChannel}${c.reset}`);
                    ws.send(JSON.stringify({ type: 'getPeers' }));
                    break;

                case 'peerList':
                    peers = msg.peers || [];
                    systemMsg(`${c.brightGreen}${peers.length}${c.reset} peer(s) in voice channel`);
                    console.log();
                    showHelp();
                    console.log();
                    showPrompt(currentChannel, nickname);
                    break;

                case 'peerListUpdate':
                    const oldCount = peers.length;
                    peers = msg.peers || [];
                    if (peers.length > oldCount) {
                        const newPeer = peers[peers.length - 1];
                        const name = newPeer?.nickname || 'Someone';
                        voiceMsg(name, `${c.green}joined voice channel${c.reset}`);
                        showPrompt(currentChannel, nickname);
                    } else if (peers.length < oldCount) {
                        systemMsg(`${c.dim}Someone left voice channel${c.reset}`);
                        showPrompt(currentChannel, nickname);
                    }
                    break;

                case 'broadcast':
                case 'nodeMessage':
                    // Handle both broadcast and nodeMessage types
                    const payload = msg.payload;
                    if (payload && payload.type === 'voiceData') {
                        // Incoming voice data!
                        const senderName = payload.nickname || 'Unknown';

                        if (senderName !== nickname && !isMuted) {
                            // Decompress and play
                            const compressedAudio = Buffer.from(payload.audio, 'base64');
                            const audioBuffer = decompressAudio(compressedAudio);
                            audioPlayback.play(audioBuffer);

                            // Show indicator (don't spam)
                            if (!payload.continuous) {
                                voiceMsg(senderName, `${c.cyan}speaking...${c.reset}`);
                                showPrompt(currentChannel, nickname);
                            }
                        }
                    } else if (payload && payload.type === 'voiceStatus') {
                        const senderName = payload.nickname || 'Unknown';
                        if (senderName !== nickname) {
                            if (payload.status === 'started') {
                                voiceMsg(senderName, `${c.green}started talking${c.reset}`);
                            } else if (payload.status === 'stopped') {
                                voiceMsg(senderName, `${c.dim}stopped talking${c.reset}`);
                            }
                            showPrompt(currentChannel, nickname);
                        }
                    } else if (payload && payload.type === 'chatMessage') {
                        // Also show chat messages in voice client
                        const senderName = payload.nickname || payload.from?.slice(0, 12) || 'Unknown';
                        if (senderName !== nickname) {
                            log(`${c.cyan}💬${c.reset} ${c.bold}${senderName}${c.reset}: ${payload.message}`);
                            showPrompt(currentChannel, nickname);
                        }
                    }
                    break;

                case 'error':
                    systemMsg(`${c.red}Error: ${msg.message}${c.reset}`);
                    showPrompt(currentChannel, nickname);
                    break;
            }
        } catch (err) {
            // Ignore parse errors
        }
    });

    function showHelp() {
        console.log(`
${c.brightMagenta}═══ VOICE + CHAT COMMANDS ═══${c.reset}
  ${c.green}/talk${c.reset}    or ${c.green}t${c.reset}     Start talking (push-to-talk)
  ${c.green}/stop${c.reset}    or ${c.green}s${c.reset}     Stop talking
  ${c.green}/mute${c.reset}              Mute incoming audio
  ${c.green}/unmute${c.reset}            Unmute incoming audio
  ${c.green}/peers${c.reset}             List peers in channel
  ${c.green}/quit${c.reset}              Leave voice chat

${c.brightCyan}═══ CHAT ═══${c.reset}
  Just type a message and press Enter to send text chat!

${c.dim}Tip: Type 't' to talk, or just type to send chat${c.reset}
`);
    }

    function sendChatMessage(message) {
        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'chatMessage',
                from: nodeId,
                nickname: nickname,
                message: message,
                channel: currentChannel,
                timestamp: Date.now()
            }
        }));
        log(`${c.cyan}💬${c.reset} ${c.magenta}${nickname}${c.reset}: ${message}`);
    }

    function startTalking() {
        if (isTalking) {
            systemMsg('Already talking! Type /stop or s to stop.');
            return;
        }

        isTalking = true;
        systemMsg(`${c.brightGreen}🎤 TALKING - Speak now!${c.reset}`);

        // Notify peers
        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'voiceStatus',
                nickname: nickname,
                status: 'started',
                channel: currentChannel,
                timestamp: Date.now()
            }
        }));

        // Start capturing audio
        let chunkCount = 0;
        audioCapture.startRecording((chunk) => {
            if (!isTalking) return;

            // Compress with David's math
            const compressed = compressAudio(chunk);

            // Send to relay
            ws.send(JSON.stringify({
                type: 'broadcast',
                payload: {
                    type: 'voiceData',
                    from: nodeId,
                    nickname: nickname,
                    audio: compressed.data.toString('base64'),
                    compression: compressed.davidMath,
                    channel: currentChannel,
                    continuous: true,
                    timestamp: Date.now()
                }
            }));

            chunkCount++;
            process.stdout.write(`\r${c.brightGreen}🎤 Talking...${c.reset} ${c.dim}[${chunkCount} chunks sent]${c.reset}  `);
        });
    }

    function stopTalking() {
        if (!isTalking) {
            systemMsg('Not currently talking.');
            return;
        }

        audioCapture.stopRecording();
        isTalking = false;

        console.log(); // New line after the "Talking..." indicator
        systemMsg(`${c.dim}Stopped talking${c.reset}`);

        // Notify peers
        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'voiceStatus',
                nickname: nickname,
                status: 'stopped',
                channel: currentChannel,
                timestamp: Date.now()
            }
        }));
    }

    // Handle user input
    rl.on('line', (input) => {
        const text = input.trim().toLowerCase();

        if (!text) {
            showPrompt(currentChannel, nickname);
            return;
        }

        // Quick commands
        if (text === 't' || text === 'talk') {
            startTalking();
            showPrompt(currentChannel, nickname);
            return;
        }

        if (text === 's' || text === 'stop') {
            stopTalking();
            showPrompt(currentChannel, nickname);
            return;
        }

        // Slash commands
        if (text.startsWith('/')) {
            const [cmd, ...args] = text.slice(1).split(' ');

            switch (cmd) {
                case 'help':
                case 'h':
                    showHelp();
                    break;

                case 'talk':
                case 't':
                    startTalking();
                    break;

                case 'stop':
                case 's':
                    stopTalking();
                    break;

                case 'mute':
                    isMuted = true;
                    systemMsg(`${c.yellow}Incoming audio muted${c.reset}`);
                    break;

                case 'unmute':
                    isMuted = false;
                    systemMsg(`${c.green}Incoming audio unmuted${c.reset}`);
                    break;

                case 'peers':
                case 'who':
                    if (peers.length === 0) {
                        systemMsg('No other peers in voice channel');
                    } else {
                        systemMsg(`${peers.length} peer(s) in voice channel:`);
                        peers.forEach(p => {
                            const name = p.nickname || p.address?.slice(0, 12) || 'Unknown';
                            console.log(`   ${c.dim}•${c.reset} ${c.brightMagenta}${name}${c.reset}`);
                        });
                    }
                    break;

                case 'quit':
                case 'exit':
                case 'q':
                    stopTalking();
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

        // Regular text = send as chat message
        sendChatMessage(input.trim());
        showPrompt(currentChannel, nickname);
    });

    // Handle Ctrl+C
    rl.on('close', () => {
        stopTalking();
        console.log(`\n${c.brightGreen}Rangers lead the way! 🎖️${c.reset}`);
        ws.close();
    });

    // Heartbeat
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

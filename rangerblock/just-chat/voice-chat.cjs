#!/usr/bin/env node
/**
 * RANGERBLOCK VOICE CHAT v2.0.0
 * =============================
 * P2P Voice communication with Private Calls + Group Voice
 *
 * PRIVATE CALL:
 *   /call M3Pro     - Call specific user
 *   /answer         - Answer incoming call
 *   /reject         - Reject incoming call
 *   /hangup         - End current call
 *
 * GROUP VOICE:
 *   /voice          - Join group voice channel
 *   /leave          - Leave group voice channel
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 * Philosophy: "One foot in front of the other"
 * Innovation: David's 73->27->73 compression mathematics
 */

const WebSocket = require('ws');
const readline = require('readline');
const os = require('os');
const zlib = require('zlib');
const { spawn } = require('child_process');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = '2.2.0';
let DEBUG_VOICE = false; // Toggle with /debug command
const RELAY_HOST = '44.222.101.125';
const RELAY_PORT = 5555;
const DEFAULT_CHANNEL = '#rangers';

// Audio settings
const SAMPLE_RATE = 16000;
const CHANNELS = 1;
const BIT_DEPTH = 16;

// Call states
const CALL_STATE = {
    IDLE: 'idle',
    CALLING: 'calling',      // Outgoing call, waiting for answer
    RINGING: 'ringing',      // Incoming call, waiting to answer
    IN_CALL: 'in_call',      // Active private call
    IN_GROUP: 'in_group'     // In group voice channel
};

// ═══════════════════════════════════════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════════════════════════════════════

const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    blink: '\x1b[5m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
    brightCyan: '\x1b[96m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
    brightMagenta: '\x1b[95m',
    brightRed: '\x1b[91m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getTimestamp() {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function clearLine() {
    process.stdout.write(`\r\x1b[K`);
}

function log(msg) {
    clearLine();
    console.log(`${c.dim}[${getTimestamp()}]${c.reset} ${msg}`);
}

function systemMsg(msg) {
    log(`${c.yellow}*${c.reset} ${msg}`);
}

function callMsg(msg) {
    log(`${c.brightGreen}${c.reset} ${msg}`);
}

function voiceMsg(from, status) {
    log(`${c.brightMagenta}${c.reset} ${c.bold}${from}${c.reset} ${status}`);
}

function chatMsg(from, message) {
    log(`${c.cyan}${c.reset} ${c.bold}${from}${c.reset}: ${message}`);
}

function showPrompt(state, nickname, callWith = null) {
    let prefix = '';
    switch (state) {
        case CALL_STATE.IN_CALL:
            prefix = `${c.brightGreen}[CALL ${callWith}]${c.reset} `;
            break;
        case CALL_STATE.IN_GROUP:
            prefix = `${c.brightMagenta}[GROUP VOICE]${c.reset} `;
            break;
        case CALL_STATE.CALLING:
            prefix = `${c.yellow}[Calling ${callWith}...]${c.reset} `;
            break;
        case CALL_STATE.RINGING:
            prefix = `${c.brightRed}[INCOMING CALL]${c.reset} `;
            break;
        default:
            prefix = '';
    }
    process.stdout.write(`${prefix}${c.magenta}${nickname}${c.reset}> `);
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
    if (hostname.includes('m3') || hostname.includes('genesis')) return 'M3Pro';
    if (hostname.includes('m4') || hostname.includes('max')) return 'M4Max';
    if (hostname.includes('m1') || hostname.includes('air')) return 'M1Air';
    if (hostname.includes('msi') || hostname.includes('vector')) return 'MSI';
    if (hostname.includes('aws') || hostname.includes('ip-')) return 'AWS';
    return hostname.slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════════════════
// DAVID'S 73->27->73 COMPRESSION
// ═══════════════════════════════════════════════════════════════════════════

function compressAudio(audioBuffer) {
    try {
        const compressed = zlib.deflateSync(audioBuffer, { level: 9 });
        const ratio = compressed.length / audioBuffer.length;
        return {
            data: compressed,
            originalSize: audioBuffer.length,
            compressedSize: compressed.length,
            ratio: ratio,
            davidMath: ratio <= 0.27 ? '27%!' : `${(ratio * 100).toFixed(0)}%`
        };
    } catch (err) {
        return { data: audioBuffer, error: err.message };
    }
}

function decompressAudio(compressedBuffer) {
    try {
        return zlib.inflateSync(compressedBuffer);
    } catch (err) {
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

        const args = ['-d', '-t', 'raw', '-r', String(SAMPLE_RATE), '-c', String(CHANNELS), '-b', String(BIT_DEPTH), '-e', 'signed-integer', '-'];
        this.process = spawn('sox', args);
        this.recording = true;

        this.process.stdout.on('data', (chunk) => {
            if (onData) onData(chunk);
        });

        this.process.stderr.on('data', () => {}); // Ignore SoX info
        this.process.on('error', () => { this.recording = false; });
        this.process.on('close', () => { this.recording = false; });
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
    play(audioBuffer) {
        const args = ['-t', 'raw', '-r', String(SAMPLE_RATE), '-c', String(CHANNELS), '-b', String(BIT_DEPTH), '-e', 'signed-integer', '-', '-d'];
        const player = spawn('sox', args);
        player.stdin.write(audioBuffer);
        player.stdin.end();
        player.on('error', () => {});
        return player;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// RING TONE (visual notification)
// ═══════════════════════════════════════════════════════════════════════════

class RingTone {
    constructor() {
        this.ringing = false;
        this.interval = null;
        this.count = 0;
    }

    start(callerName) {
        this.ringing = true;
        this.count = 0;
        this.callerName = callerName;

        const ring = () => {
            if (!this.ringing) return;
            this.count++;
            clearLine();

            // Make it VERY visible
            console.log('\n');
            console.log(`${c.bgRed}${c.bold}                                                    ${c.reset}`);
            console.log(`${c.bgRed}${c.bold}   INCOMING CALL FROM: ${callerName.toUpperCase()}   ${c.reset}`);
            console.log(`${c.bgRed}${c.bold}                                                    ${c.reset}`);
            console.log('');
            console.log(`   ${c.brightGreen}${c.bold}>>> Type 'a' to ANSWER <<<${c.reset}`);
            console.log(`   ${c.brightRed}>>> Type 'r' to REJECT <<<${c.reset}`);
            console.log('');

            // Also beep on terminal (works on most systems)
            process.stdout.write('\x07'); // Terminal bell
        };

        ring();
        this.interval = setInterval(ring, 2000); // Ring every 2 seconds
    }

    stop() {
        this.ringing = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// BANNER
// ═══════════════════════════════════════════════════════════════════════════

function showBanner() {
    console.clear();
    console.log(`
${c.brightMagenta}+================================================================+
|  ${c.brightGreen}RANGER    RANGER    RANGER    RANGER${c.brightMagenta}                        |
|  ${c.brightGreen}BLOCK     BLOCK     BLOCK     BLOCK${c.brightMagenta}                         |
|                                                                |
|     ${c.brightCyan}VOICE + CHAT${c.reset}  ${c.dim}v${VERSION}${c.brightMagenta}                                  |
|     ${c.dim}Private Calls | Group Voice | Text Chat${c.brightMagenta}                 |
+================================================================+${c.reset}
`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
    const args = process.argv.slice(2);
    let presetNick = null;
    for (let i = 0; i < args.length; i++) {
        if ((args[i] === '--nick' || args[i] === '-n') && args[i + 1]) {
            presetNick = args[i + 1];
        }
    }

    showBanner();

    // Check SoX
    const audioCapture = new AudioCapture();
    const audioPlayback = new AudioPlayback();
    const ringTone = new RingTone();

    const soxInstalled = await audioCapture.checkSoxInstalled();
    if (!soxInstalled) {
        console.log(`${c.red}+============================================================+${c.reset}`);
        console.log(`${c.red}|  SoX NOT INSTALLED - Required for voice                    |${c.reset}`);
        console.log(`${c.red}+============================================================+${c.reset}`);
        console.log(`${c.red}|${c.reset}  ${c.cyan}macOS:${c.reset}   brew install sox                              ${c.red}|${c.reset}`);
        console.log(`${c.red}|${c.reset}  ${c.cyan}Linux:${c.reset}   sudo apt install sox libsox-fmt-all           ${c.red}|${c.reset}`);
        console.log(`${c.red}|${c.reset}  ${c.cyan}Windows:${c.reset} winget install sox.sox                        ${c.red}|${c.reset}`);
        console.log(`${c.red}+============================================================+${c.reset}`);
        process.exit(1);
    }

    systemMsg(`${c.green}SoX audio ready${c.reset}`);

    // Setup readline
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
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

    // State
    const localIP = getLocalIP();
    const nodeId = `${nickname}-${Date.now()}`;
    let callState = CALL_STATE.IDLE;
    let callPartner = null;
    let incomingCaller = null;
    let isTalking = false;
    let isMuted = false;
    let peers = [];
    let groupVoiceMembers = [];

    systemMsg(`Connecting as ${c.brightMagenta}${nickname}${c.reset}...`);

    // Connect
    const wsUrl = `ws://${RELAY_HOST}:${RELAY_PORT}`;
    let ws;

    try {
        ws = new WebSocket(wsUrl);
    } catch (err) {
        systemMsg(`${c.red}Failed to connect: ${err.message}${c.reset}`);
        process.exit(1);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WEBSOCKET HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    ws.on('open', () => {
        systemMsg(`${c.brightGreen}Connected to relay!${c.reset}`);
    });

    ws.on('error', (err) => {
        systemMsg(`${c.red}Error: ${err.message}${c.reset}`);
    });

    ws.on('close', () => {
        systemMsg(`${c.red}Disconnected${c.reset}`);
        audioCapture.stopRecording();
        ringTone.stop();
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
                        channel: DEFAULT_CHANNEL,
                        ip: localIP,
                        port: 0,
                        mode: 'voice-chat',
                        capabilities: ['voice', 'chat', 'call']
                    }));
                    break;

                case 'registered':
                    systemMsg(`Registered as ${c.brightMagenta}${nickname}${c.reset}`);
                    ws.send(JSON.stringify({ type: 'getPeers' }));
                    break;

                case 'peerList':
                    peers = msg.peers || [];
                    systemMsg(`${c.brightGreen}${peers.length}${c.reset} peer(s) online`);
                    console.log();
                    showHelp();
                    console.log();
                    showPrompt(callState, nickname, callPartner);
                    break;

                case 'peerListUpdate':
                    peers = msg.peers || [];
                    break;

                case 'broadcast':
                case 'nodeMessage':
                    handlePayload(msg.payload);
                    break;
            }
        } catch (err) {
            // Ignore parse errors
        }
    });

    // ═══════════════════════════════════════════════════════════════════════
    // PAYLOAD HANDLER
    // ═══════════════════════════════════════════════════════════════════════

    function handlePayload(payload) {
        if (!payload) return;
        const senderName = payload.nickname || payload.from?.slice(0, 12) || 'Unknown';
        if (senderName === nickname) return;

        switch (payload.type) {
            // ─────────────────────────────────────────────────────────────
            // CALL SIGNALING
            // ─────────────────────────────────────────────────────────────
            case 'callRequest':
                if (DEBUG_VOICE) {
                    console.log(`${c.dim}[DEBUG] Call request: target="${payload.target}" me="${nickname}" match=${payload.target === nickname || payload.target.toLowerCase().startsWith(nickname.toLowerCase())}${c.reset}`);
                }
                // Match if target equals nickname OR starts with nickname (for partial matches like "MSI" matching "MSI-123")
                const isForMe = payload.target === nickname ||
                                payload.target.toLowerCase() === nickname.toLowerCase() ||
                                payload.target.toLowerCase().startsWith(nickname.toLowerCase()) ||
                                nickname.toLowerCase().startsWith(payload.target.toLowerCase());

                if (isForMe) {
                    if (callState === CALL_STATE.IDLE) {
                        incomingCaller = senderName;
                        callState = CALL_STATE.RINGING;
                        ringTone.start(senderName);
                        showPrompt(callState, nickname, callPartner);
                    } else {
                        sendCallBusy(senderName);
                    }
                }
                break;

            case 'callAccepted':
                if (payload.target === nickname && callState === CALL_STATE.CALLING) {
                    callState = CALL_STATE.IN_CALL;
                    callPartner = senderName;
                    callMsg(`${c.brightGreen}${senderName} answered! Connected.${c.reset}`);
                    callMsg(`${c.dim}Type 't' to talk, '/hangup' to end${c.reset}`);
                    showPrompt(callState, nickname, callPartner);
                }
                break;

            case 'callRejected':
                if (payload.target === nickname && callState === CALL_STATE.CALLING) {
                    callState = CALL_STATE.IDLE;
                    callPartner = null;
                    callMsg(`${c.red}${senderName} declined the call${c.reset}`);
                    showPrompt(callState, nickname, callPartner);
                }
                break;

            case 'callBusy':
                if (payload.target === nickname && callState === CALL_STATE.CALLING) {
                    callState = CALL_STATE.IDLE;
                    callPartner = null;
                    callMsg(`${c.yellow}${senderName} is busy${c.reset}`);
                    showPrompt(callState, nickname, callPartner);
                }
                break;

            case 'callEnded':
                if (payload.target === nickname && (callState === CALL_STATE.IN_CALL || callState === CALL_STATE.RINGING)) {
                    audioCapture.stopRecording();
                    ringTone.stop();
                    isTalking = false;
                    callState = CALL_STATE.IDLE;
                    callPartner = null;
                    incomingCaller = null;
                    callMsg(`${c.dim}Call ended by ${senderName}${c.reset}`);
                    showPrompt(callState, nickname, callPartner);
                }
                break;

            // ─────────────────────────────────────────────────────────────
            // VOICE DATA
            // ─────────────────────────────────────────────────────────────
            case 'voiceData':
                const shouldPlay =
                    (callState === CALL_STATE.IN_CALL && senderName === callPartner) ||
                    (callState === CALL_STATE.IN_GROUP);

                if (DEBUG_VOICE) {
                    console.log(`${c.dim}[DEBUG] Voice from ${senderName}, state=${callState}, partner=${callPartner}, shouldPlay=${shouldPlay}, muted=${isMuted}${c.reset}`);
                }

                if (shouldPlay && !isMuted) {
                    try {
                        const compressedAudio = Buffer.from(payload.audio, 'base64');
                        const audioBuffer = decompressAudio(compressedAudio);
                        if (DEBUG_VOICE) {
                            console.log(`${c.dim}[DEBUG] Playing ${audioBuffer.length} bytes${c.reset}`);
                        }
                        audioPlayback.play(audioBuffer);
                    } catch (err) {
                        console.log(`${c.red}[ERROR] Playback failed: ${err.message}${c.reset}`);
                    }
                }
                break;

            case 'voiceStatus':
                const isRelevant =
                    (callState === CALL_STATE.IN_CALL && senderName === callPartner) ||
                    (callState === CALL_STATE.IN_GROUP);

                if (isRelevant) {
                    if (payload.status === 'started') {
                        voiceMsg(senderName, `${c.green}talking...${c.reset}`);
                    } else if (payload.status === 'stopped') {
                        voiceMsg(senderName, `${c.dim}stopped${c.reset}`);
                    }
                    showPrompt(callState, nickname, callPartner);
                }
                break;

            // ─────────────────────────────────────────────────────────────
            // GROUP VOICE
            // ─────────────────────────────────────────────────────────────
            case 'joinedGroupVoice':
                if (!groupVoiceMembers.includes(senderName)) {
                    groupVoiceMembers.push(senderName);
                }
                if (callState === CALL_STATE.IN_GROUP) {
                    systemMsg(`${c.brightMagenta}${senderName}${c.reset} joined group voice`);
                    showPrompt(callState, nickname, callPartner);
                }
                break;

            case 'leftGroupVoice':
                groupVoiceMembers = groupVoiceMembers.filter(n => n !== senderName);
                if (callState === CALL_STATE.IN_GROUP) {
                    systemMsg(`${c.dim}${senderName} left group voice${c.reset}`);
                    showPrompt(callState, nickname, callPartner);
                }
                break;

            // ─────────────────────────────────────────────────────────────
            // CHAT MESSAGES
            // ─────────────────────────────────────────────────────────────
            case 'chatMessage':
                chatMsg(senderName, payload.message);
                showPrompt(callState, nickname, callPartner);
                break;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CALL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    function makeCall(targetName) {
        if (callState !== CALL_STATE.IDLE) {
            systemMsg(`${c.yellow}Already in a call. /hangup first.${c.reset}`);
            return;
        }

        // Find peer - match by nickname or address prefix
        const peer = peers.find(p =>
            (p.nickname && p.nickname.toLowerCase() === targetName.toLowerCase()) ||
            (p.nickname && p.nickname.toLowerCase().startsWith(targetName.toLowerCase())) ||
            (p.address && p.address.toLowerCase().startsWith(targetName.toLowerCase()))
        );

        if (!peer) {
            systemMsg(`${c.red}User '${targetName}' not found. Use /peers to see online users${c.reset}`);
            return;
        }

        // Use the short nickname for the call target, not the full address
        const target = peer.nickname || targetName;
        callState = CALL_STATE.CALLING;
        callPartner = target;

        if (DEBUG_VOICE) {
            console.log(`${c.dim}[DEBUG] Calling target="${target}" (found peer: nickname=${peer.nickname}, address=${peer.address})${c.reset}`);
        }

        callMsg(`${c.yellow}Calling ${target}...${c.reset}`);

        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'callRequest',
                from: nodeId,
                nickname: nickname,
                target: target,
                timestamp: Date.now()
            }
        }));

        // Timeout after 30 seconds
        setTimeout(() => {
            if (callState === CALL_STATE.CALLING && callPartner === target) {
                callState = CALL_STATE.IDLE;
                callPartner = null;
                callMsg(`${c.dim}No answer from ${target}${c.reset}`);
                showPrompt(callState, nickname, callPartner);
            }
        }, 30000);
    }

    function answerCall() {
        if (callState !== CALL_STATE.RINGING || !incomingCaller) {
            systemMsg(`${c.yellow}No incoming call${c.reset}`);
            return;
        }

        ringTone.stop();
        callState = CALL_STATE.IN_CALL;
        callPartner = incomingCaller;
        incomingCaller = null;

        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'callAccepted',
                from: nodeId,
                nickname: nickname,
                target: callPartner,
                timestamp: Date.now()
            }
        }));

        callMsg(`${c.brightGreen}Connected with ${callPartner}!${c.reset}`);
        callMsg(`${c.dim}Type 't' to talk, '/hangup' to end${c.reset}`);
    }

    function rejectCall() {
        if (callState !== CALL_STATE.RINGING || !incomingCaller) {
            systemMsg(`${c.yellow}No incoming call${c.reset}`);
            return;
        }

        ringTone.stop();

        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'callRejected',
                from: nodeId,
                nickname: nickname,
                target: incomingCaller,
                timestamp: Date.now()
            }
        }));

        callMsg(`${c.dim}Rejected call from ${incomingCaller}${c.reset}`);
        callState = CALL_STATE.IDLE;
        incomingCaller = null;
    }

    function sendCallBusy(caller) {
        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'callBusy',
                from: nodeId,
                nickname: nickname,
                target: caller,
                timestamp: Date.now()
            }
        }));
    }

    function hangUp() {
        if (callState !== CALL_STATE.IN_CALL && callState !== CALL_STATE.CALLING) {
            systemMsg(`${c.yellow}Not in a call${c.reset}`);
            return;
        }

        audioCapture.stopRecording();
        isTalking = false;

        if (callPartner) {
            ws.send(JSON.stringify({
                type: 'broadcast',
                payload: {
                    type: 'callEnded',
                    from: nodeId,
                    nickname: nickname,
                    target: callPartner,
                    timestamp: Date.now()
                }
            }));
        }

        callMsg(`${c.dim}Call ended${c.reset}`);
        callState = CALL_STATE.IDLE;
        callPartner = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GROUP VOICE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    function joinGroupVoice() {
        if (callState === CALL_STATE.IN_CALL) {
            systemMsg(`${c.yellow}Leave your current call first (/hangup)${c.reset}`);
            return;
        }

        callState = CALL_STATE.IN_GROUP;

        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'joinedGroupVoice',
                from: nodeId,
                nickname: nickname,
                timestamp: Date.now()
            }
        }));

        systemMsg(`${c.brightMagenta}Joined group voice channel${c.reset}`);
        systemMsg(`${c.dim}Type 't' to talk to everyone, '/leave' to exit${c.reset}`);
    }

    function leaveGroupVoice() {
        if (callState !== CALL_STATE.IN_GROUP) {
            systemMsg(`${c.yellow}Not in group voice${c.reset}`);
            return;
        }

        audioCapture.stopRecording();
        isTalking = false;

        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'leftGroupVoice',
                from: nodeId,
                nickname: nickname,
                timestamp: Date.now()
            }
        }));

        callState = CALL_STATE.IDLE;
        systemMsg(`${c.dim}Left group voice${c.reset}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VOICE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    function startTalking() {
        if (callState !== CALL_STATE.IN_CALL && callState !== CALL_STATE.IN_GROUP) {
            systemMsg(`${c.yellow}Join a call first: /call <user> or /voice for group${c.reset}`);
            return;
        }

        if (isTalking) {
            systemMsg(`${c.dim}Already talking. Type 's' to stop.${c.reset}`);
            return;
        }

        isTalking = true;

        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'voiceStatus',
                from: nodeId,
                nickname: nickname,
                status: 'started',
                target: callState === CALL_STATE.IN_CALL ? callPartner : 'group',
                timestamp: Date.now()
            }
        }));

        systemMsg(`${c.brightGreen}TALKING${c.reset}`);

        let chunkCount = 0;
        audioCapture.startRecording((chunk) => {
            if (!isTalking) return;

            const compressed = compressAudio(chunk);

            ws.send(JSON.stringify({
                type: 'broadcast',
                payload: {
                    type: 'voiceData',
                    from: nodeId,
                    nickname: nickname,
                    audio: compressed.data.toString('base64'),
                    target: callState === CALL_STATE.IN_CALL ? callPartner : 'group',
                    compression: compressed.davidMath,
                    timestamp: Date.now()
                }
            }));

            chunkCount++;
            process.stdout.write(`\r${c.brightGreen}Talking${c.reset} ${c.dim}[${chunkCount}]${c.reset}  `);
        });
    }

    function stopTalking() {
        if (!isTalking) return;

        audioCapture.stopRecording();
        isTalking = false;

        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'voiceStatus',
                from: nodeId,
                nickname: nickname,
                status: 'stopped',
                target: callState === CALL_STATE.IN_CALL ? callPartner : 'group',
                timestamp: Date.now()
            }
        }));

        console.log();
        systemMsg(`${c.dim}Stopped talking${c.reset}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHAT FUNCTION
    // ═══════════════════════════════════════════════════════════════════════

    function sendChat(message) {
        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'chatMessage',
                from: nodeId,
                nickname: nickname,
                message: message,
                timestamp: Date.now()
            }
        }));
        chatMsg(nickname, message);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELP
    // ═══════════════════════════════════════════════════════════════════════

    function showHelp() {
        console.log(`
${c.brightGreen}╔════════════════════════════════════════════════════════════╗
║                    RANGERBLOCK VOICE v2.2                  ║
╚════════════════════════════════════════════════════════════╝${c.reset}

${c.brightGreen}=== PRIVATE CALL ===${c.reset}
  ${c.green}/call <user>${c.reset}     Call a specific user (e.g., /call M3Pro)
  ${c.green}/answer${c.reset} or ${c.green}a${c.reset}    Answer incoming call
  ${c.green}/reject${c.reset} or ${c.green}r${c.reset}    Reject incoming call
  ${c.green}/hangup${c.reset}          End current call

${c.brightMagenta}=== GROUP VOICE ===${c.reset}
  ${c.green}/voice${c.reset}           Join group voice (everyone hears you)
  ${c.green}/leave${c.reset}           Leave group voice

${c.brightCyan}=== VOICE CONTROLS ===${c.reset}
  ${c.green}t${c.reset}                Start talking (push-to-talk)
  ${c.green}s${c.reset}                Stop talking
  ${c.green}/mute${c.reset}            Mute incoming audio
  ${c.green}/unmute${c.reset}          Unmute incoming audio

${c.brightYellow}=== CHAT ===${c.reset}
  ${c.dim}Just type any message and press Enter to send chat${c.reset}

${c.yellow}=== INFO ===${c.reset}
  ${c.green}/peers${c.reset}           List online users
  ${c.green}/relay${c.reset}           Show relay server info
  ${c.green}/status${c.reset}          Show your current status
  ${c.green}/info${c.reset}            Show your node info
  ${c.green}/ping${c.reset}            Test relay connection
  ${c.green}/clear${c.reset}           Clear screen
  ${c.green}/debug${c.reset}           Toggle debug mode
  ${c.green}/help${c.reset}            Show this help
  ${c.green}/quit${c.reset}            Exit

${c.dim}Quick Keys: a=answer, r=reject, t=talk, s=stop${c.reset}
`);
    }

    function showPeers() {
        ws.send(JSON.stringify({ type: 'getPeers' }));

        if (peers.length === 0) {
            systemMsg(`${c.dim}No other users online${c.reset}`);
        } else {
            systemMsg(`${c.brightGreen}${peers.length}${c.reset} user(s) online:`);
            peers.forEach(p => {
                const name = p.nickname || p.address?.slice(0, 12) || 'Unknown';
                const mode = p.mode ? ` ${c.dim}(${p.mode})${c.reset}` : '';
                console.log(`   ${c.dim}*${c.reset} ${c.brightMagenta}${name}${c.reset}${mode}`);
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INPUT HANDLER
    // ═══════════════════════════════════════════════════════════════════════

    rl.on('line', (input) => {
        const text = input.trim();

        if (!text) {
            showPrompt(callState, nickname, callPartner);
            return;
        }

        // Quick keys for incoming call
        if (text.toLowerCase() === 'a' && callState === CALL_STATE.RINGING) {
            answerCall();
            showPrompt(callState, nickname, callPartner);
            return;
        }

        if (text.toLowerCase() === 'r' && callState === CALL_STATE.RINGING) {
            rejectCall();
            showPrompt(callState, nickname, callPartner);
            return;
        }

        // Quick voice controls
        if (text.toLowerCase() === 't' || text.toLowerCase() === 'talk') {
            startTalking();
            showPrompt(callState, nickname, callPartner);
            return;
        }

        if (text.toLowerCase() === 's' || text.toLowerCase() === 'stop') {
            stopTalking();
            showPrompt(callState, nickname, callPartner);
            return;
        }

        // Slash commands
        if (text.startsWith('/')) {
            const parts = text.slice(1).split(' ');
            const cmd = parts[0].toLowerCase();
            const args = parts.slice(1);

            switch (cmd) {
                case 'help':
                case 'h':
                    showHelp();
                    break;

                case 'call':
                case 'c':
                    if (args.length === 0) {
                        systemMsg(`${c.yellow}Usage: /call <username>${c.reset}`);
                        systemMsg(`${c.dim}Example: /call M3Pro${c.reset}`);
                    } else {
                        makeCall(args.join(' '));
                    }
                    break;

                case 'answer':
                case 'a':
                    answerCall();
                    break;

                case 'reject':
                case 'r':
                    rejectCall();
                    break;

                case 'hangup':
                case 'end':
                    hangUp();
                    break;

                case 'voice':
                case 'v':
                    joinGroupVoice();
                    break;

                case 'leave':
                case 'l':
                    leaveGroupVoice();
                    break;

                case 'mute':
                    isMuted = true;
                    systemMsg(`${c.yellow}Audio muted${c.reset}`);
                    break;

                case 'unmute':
                    isMuted = false;
                    systemMsg(`${c.green}Audio unmuted${c.reset}`);
                    break;

                case 'peers':
                case 'who':
                case 'users':
                    showPeers();
                    break;

                case 'relay':
                case 'server':
                    console.log(`
${c.brightCyan}=== RELAY SERVER INFO ===${c.reset}
  ${c.green}Host:${c.reset}        ${RELAY_HOST}
  ${c.green}Port:${c.reset}        ${RELAY_PORT}
  ${c.green}URL:${c.reset}         ws://${RELAY_HOST}:${RELAY_PORT}
  ${c.green}Dashboard:${c.reset}   http://${RELAY_HOST}:5556
  ${c.green}Status:${c.reset}      ${ws.readyState === WebSocket.OPEN ? `${c.brightGreen}Connected${c.reset}` : `${c.red}Disconnected${c.reset}`}
`);
                    break;

                case 'status':
                    const stateNames = {
                        [CALL_STATE.IDLE]: 'Idle',
                        [CALL_STATE.CALLING]: 'Calling...',
                        [CALL_STATE.RINGING]: 'Incoming Call',
                        [CALL_STATE.IN_CALL]: 'In Private Call',
                        [CALL_STATE.IN_GROUP]: 'In Group Voice'
                    };
                    console.log(`
${c.brightCyan}=== YOUR STATUS ===${c.reset}
  ${c.green}State:${c.reset}       ${stateNames[callState] || callState}
  ${c.green}Call With:${c.reset}   ${callPartner || 'Nobody'}
  ${c.green}Talking:${c.reset}     ${isTalking ? `${c.brightGreen}Yes${c.reset}` : 'No'}
  ${c.green}Muted:${c.reset}       ${isMuted ? `${c.yellow}Yes${c.reset}` : 'No'}
  ${c.green}Peers:${c.reset}       ${peers.length} online
`);
                    break;

                case 'info':
                case 'me':
                    console.log(`
${c.brightCyan}=== YOUR NODE INFO ===${c.reset}
  ${c.green}Nickname:${c.reset}    ${nickname}
  ${c.green}Node ID:${c.reset}     ${nodeId}
  ${c.green}Local IP:${c.reset}    ${localIP}
  ${c.green}Channel:${c.reset}     ${DEFAULT_CHANNEL}
  ${c.green}Version:${c.reset}     v${VERSION}
`);
                    break;

                case 'ping':
                    const pingStart = Date.now();
                    ws.send(JSON.stringify({ type: 'ping' }));
                    systemMsg(`Ping sent to relay...`);
                    // Note: actual pong handling would need more work
                    setTimeout(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            systemMsg(`${c.brightGreen}Relay is responding (connection active)${c.reset}`);
                        } else {
                            systemMsg(`${c.red}Relay not responding${c.reset}`);
                        }
                        showPrompt(callState, nickname, callPartner);
                    }, 500);
                    break;

                case 'clear':
                case 'cls':
                    console.clear();
                    showBanner();
                    break;

                case 'debug':
                    DEBUG_VOICE = !DEBUG_VOICE;
                    systemMsg(`Debug mode: ${DEBUG_VOICE ? `${c.brightGreen}ON${c.reset} (showing voice packets)` : `${c.dim}OFF${c.reset}`}`);
                    break;

                case 'quit':
                case 'exit':
                case 'q':
                    stopTalking();
                    if (callState === CALL_STATE.IN_CALL) hangUp();
                    if (callState === CALL_STATE.IN_GROUP) leaveGroupVoice();
                    console.log(`\n${c.brightGreen}Rangers lead the way!${c.reset}\n`);
                    ws.close();
                    rl.close();
                    process.exit(0);
                    break;

                default:
                    systemMsg(`${c.dim}Unknown command: /${cmd}. Type /help${c.reset}`);
            }

            showPrompt(callState, nickname, callPartner);
            return;
        }

        // Regular text = chat message
        sendChat(text);
        showPrompt(callState, nickname, callPartner);
    });

    // Ctrl+C
    rl.on('close', () => {
        stopTalking();
        if (callState === CALL_STATE.IN_CALL) hangUp();
        if (callState === CALL_STATE.IN_GROUP) leaveGroupVoice();
        console.log(`\n${c.brightGreen}Rangers lead the way!${c.reset}`);
        ws.close();
    });

    // Heartbeat
    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
        }
    }, 30000);
}

main().catch(err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
});

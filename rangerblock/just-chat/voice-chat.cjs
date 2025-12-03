#!/usr/bin/env node
/**
 * RANGERBLOCK VOICE CHAT v3.0.0
 * =============================
 * P2P Voice communication with Private Calls + Group Voice
 *
 * NEW IN v3.0.0:
 * - Uses shared ~/.rangerblock/ identity (cross-app sync!)
 * - Hardware-bound persistent identity
 * - RSA-2048 message signing
 * - Identity verification support
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

// Import shared identity service
const { justChatIdentity } = require('../lib/identity-service.cjs');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = '3.0.0';
let DEBUG_VOICE = false; // Toggle with /debug command
const RELAY_HOST = '44.222.101.125';
const RELAY_PORT = 5555;
const DEFAULT_CHANNEL = '#rangers';

// Microphone settings
let selectedMic = 'default'; // 'default' or device name/number

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

        let args;
        if (os.platform() === 'win32') {
            // Windows: use waveaudio driver
            args = ['-t', 'waveaudio', 'default', '-t', 'raw', '-r', String(SAMPLE_RATE), '-c', String(CHANNELS), '-b', String(BIT_DEPTH), '-e', 'signed-integer', '-'];
        } else {
            // macOS/Linux: use default device
            args = ['-d', '-t', 'raw', '-r', String(SAMPLE_RATE), '-c', String(CHANNELS), '-b', String(BIT_DEPTH), '-e', 'signed-integer', '-'];
        }

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
            if (os.platform() === 'win32') {
                this.process.kill(); // Windows doesn't support SIGTERM well
            } else {
                this.process.kill('SIGTERM');
            }
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
        let args;
        if (os.platform() === 'win32') {
            // Windows: use waveaudio driver for output
            args = ['-t', 'raw', '-r', String(SAMPLE_RATE), '-c', String(CHANNELS), '-b', String(BIT_DEPTH), '-e', 'signed-integer', '-', '-t', 'waveaudio', 'default'];
        } else {
            // macOS/Linux: use default device
            args = ['-t', 'raw', '-r', String(SAMPLE_RATE), '-c', String(CHANNELS), '-b', String(BIT_DEPTH), '-e', 'signed-integer', '-', '-d'];
        }
        const player = spawn('sox', args);
        player.stdin.write(audioBuffer);
        player.stdin.end();
        player.on('error', () => {});
        return player;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MICROPHONE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

const { execSync } = require('child_process');

function listMicrophones() {
    const platform = os.platform();
    const mics = [];

    try {
        if (platform === 'darwin') {
            // macOS - use system_profiler and parse properly
            const output = execSync('system_profiler SPAudioDataType 2>/dev/null', { encoding: 'utf8' });
            const lines = output.split('\n');
            let currentDevice = null;
            let hasInput = false;
            let isDefault = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                // Device name: 8 spaces, then name ending with colon
                // e.g. "        Logitech Webcam C930e:"
                const deviceMatch = line.match(/^        ([^:]+):$/);
                if (deviceMatch) {
                    // Save previous device if it had input
                    if (currentDevice && hasInput) {
                        mics.push({
                            name: currentDevice,
                            id: mics.length,
                            device: currentDevice,
                            isDefault: isDefault
                        });
                    }
                    // Start new device
                    currentDevice = deviceMatch[1];
                    hasInput = false;
                    isDefault = false;
                    continue;
                }

                // Check if this device has input capability
                if (currentDevice && line.includes('Input Channels:')) {
                    hasInput = true;
                }

                // Check if this is the default input
                if (currentDevice && line.includes('Default Input Device: Yes')) {
                    isDefault = true;
                }
            }

            // Don't forget the last device
            if (currentDevice && hasInput) {
                mics.push({
                    name: currentDevice,
                    id: mics.length,
                    device: currentDevice,
                    isDefault: isDefault
                });
            }

            // Sort so default is first
            mics.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

            // Reassign IDs after sorting
            mics.forEach((m, i) => m.id = i);

            // Fallback
            if (mics.length === 0) {
                mics.push({ name: 'Built-in Microphone', id: 0, device: 'default', isDefault: true });
            }
        } else if (platform === 'win32') {
            // Windows - try multiple methods to find audio input devices
            try {
                // Method 1: Get audio endpoint devices (more accurate)
                const psCmd = `
                    Get-CimInstance Win32_PnPEntity |
                    Where-Object { $_.PNPClass -eq 'AudioEndpoint' -or $_.PNPClass -eq 'MEDIA' } |
                    Where-Object { $_.Name -match 'Microphone|Input|Audio|Capture' } |
                    Select-Object -Property Name -Unique |
                    Format-List
                `.replace(/\n/g, ' ');
                const output = execSync(`powershell -Command "${psCmd}"`, { encoding: 'utf8' });
                const lines = output.split('\n');
                for (const line of lines) {
                    if (line.includes('Name') && line.includes(':')) {
                        const name = line.split(':').slice(1).join(':').trim();
                        if (name && name.length > 0 && !mics.find(m => m.name === name)) {
                            mics.push({
                                name: name,
                                id: mics.length,
                                device: 'default',
                                isDefault: mics.length === 0
                            });
                        }
                    }
                }
            } catch (e) {}

            // Method 2: Fallback to Win32_SoundDevice
            if (mics.length === 0) {
                try {
                    const output = execSync('powershell -Command "Get-WmiObject Win32_SoundDevice | Select-Object Name | Format-List"', { encoding: 'utf8' });
                    const lines = output.split('\n');
                    for (const line of lines) {
                        if (line.includes('Name') && line.includes(':')) {
                            const name = line.split(':').slice(1).join(':').trim();
                            if (name && name.length > 0) {
                                mics.push({ name: name, id: mics.length, device: 'default', isDefault: mics.length === 0 });
                            }
                        }
                    }
                } catch (e) {}
            }

            // Final fallback
            if (mics.length === 0) {
                mics.push({ name: 'Default Microphone', id: 0, device: 'default', isDefault: true });
            }
        } else {
            // Linux - use arecord
            try {
                const output = execSync('arecord -l 2>/dev/null', { encoding: 'utf8' });
                const lines = output.split('\n');
                for (const line of lines) {
                    if (line.includes('card')) {
                        const match = line.match(/card (\d+):.*\[(.+?)\]/);
                        if (match) {
                            mics.push({ name: match[2], id: parseInt(match[1]), device: `hw:${match[1]}` });
                        }
                    }
                }
            } catch (e) {}

            if (mics.length === 0) {
                mics.push({ name: 'Default Microphone', id: 0, device: 'default' });
            }
        }
    } catch (err) {
        mics.push({ name: 'Default Microphone', id: 0, device: 'default' });
    }

    return mics;
}

function testMicrophone(callback) {
    // Record 3 seconds of audio
    const testFile = os.tmpdir() + (os.platform() === 'win32' ? '\\rangerblock_mic_test.raw' : '/rangerblock_mic_test.raw');
    const duration = 3;

    console.log(`\n${c.brightCyan}=== MICROPHONE TEST ===${c.reset}`);
    console.log(`${c.yellow}Recording for ${duration} seconds... Say "Hello There!"${c.reset}\n`);

    let args;
    if (os.platform() === 'win32') {
        // Windows: use waveaudio driver
        args = ['-t', 'waveaudio', 'default', '-t', 'raw', '-r', String(SAMPLE_RATE), '-c', String(CHANNELS), '-b', String(BIT_DEPTH), '-e', 'signed-integer', testFile, 'trim', '0', String(duration)];
    } else {
        // macOS/Linux
        args = ['-d', '-t', 'raw', '-r', String(SAMPLE_RATE), '-c', String(CHANNELS), '-b', String(BIT_DEPTH), '-e', 'signed-integer', testFile, 'trim', '0', String(duration)];
    }

    const recorder = spawn('sox', args);

    recorder.stderr.on('data', (data) => {
        // SoX outputs progress to stderr
    });

    recorder.on('error', (err) => {
        console.log(`${c.red}Error: Could not access microphone${c.reset}`);
        console.log(`${c.dim}Make sure no other app is using it exclusively${c.reset}`);
        if (callback) callback(false);
    });

    recorder.on('close', (code) => {
        if (code === 0) {
            console.log(`${c.brightGreen}Recording complete!${c.reset}`);
            console.log(`${c.yellow}Playing back...${c.reset}\n`);

            // Play it back
            let playArgs;
            if (os.platform() === 'win32') {
                playArgs = ['-t', 'raw', '-r', String(SAMPLE_RATE), '-c', String(CHANNELS), '-b', String(BIT_DEPTH), '-e', 'signed-integer', testFile, '-t', 'waveaudio', 'default'];
            } else {
                playArgs = ['-t', 'raw', '-r', String(SAMPLE_RATE), '-c', String(CHANNELS), '-b', String(BIT_DEPTH), '-e', 'signed-integer', testFile, '-d'];
            }
            const player = spawn('sox', playArgs);

            player.on('close', () => {
                console.log(`\n${c.brightGreen}Test complete!${c.reset}`);
                console.log(`${c.dim}Did you hear your voice? If not, check mic selection.${c.reset}\n`);

                // Clean up
                try {
                    require('fs').unlinkSync(testFile);
                } catch (e) {}

                if (callback) callback(true);
            });

            player.on('error', () => {
                console.log(`${c.red}Playback failed${c.reset}`);
                if (callback) callback(false);
            });
        } else {
            console.log(`${c.red}Recording failed (code: ${code})${c.reset}`);
            console.log(`${c.dim}The microphone might be in use by another application.${c.reset}`);
            if (callback) callback(false);
        }
    });
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

    // Initialize identity service
    await justChatIdentity.init();

    // Setup readline
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (q) => new Promise(resolve => rl.question(q, resolve));

    // Get or create identity
    let identity;
    let nickname;

    if (justChatIdentity.hasIdentity()) {
        // Load existing identity
        identity = await justChatIdentity.getOrCreateIdentity();
        const defaultNick = presetNick || identity.username;

        console.log(`${c.dim}Found existing identity: ${c.brightMagenta}${identity.userId.slice(0, 12)}...${c.reset}`);
        const input = await question(`${c.yellow}Your nickname ${c.dim}[${defaultNick}]${c.reset}: `);
        nickname = input.trim() || defaultNick;

        // Update username if changed
        if (nickname !== identity.username) {
            justChatIdentity.updateUsername(nickname);
        }
    } else {
        // Create new identity
        if (presetNick) {
            nickname = presetNick;
            console.log(`${c.dim}Using nickname: ${c.brightMagenta}${nickname}${c.reset}`);
        } else {
            const defaultName = getMachineName();
            const input = await question(`${c.yellow}Enter your nickname ${c.dim}[${defaultName}]${c.reset}: `);
            nickname = input.trim() || defaultName;
        }

        identity = await justChatIdentity.getOrCreateIdentity(nickname);
        console.log(`${c.dim}Created new identity: ${c.brightMagenta}${identity.userId.slice(0, 12)}...${c.reset}`);
    }
    console.log();

    // State - use identity for nodeId/userId
    const localIP = getLocalIP();
    const nodeId = identity.nodeId;
    const userId = identity.userId;
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
                        userId: userId,
                        nickname: nickname,
                        channel: DEFAULT_CHANNEL,
                        ip: localIP,
                        port: 0,
                        mode: 'voice-chat',
                        capabilities: ['voice', 'chat', 'call'],
                        appType: 'voice-chat',
                        version: VERSION
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

                    // Show nice connected banner
                    console.log();
                    console.log(`${c.brightGreen}╔════════════════════════════════════════════════════════╗${c.reset}`);
                    console.log(`${c.brightGreen}║${c.reset}  📞 ${c.bold}CONNECTED${c.reset} with ${c.brightMagenta}${c.bold}${senderName}${c.reset}                           ${c.brightGreen}║${c.reset}`);
                    console.log(`${c.brightGreen}╚════════════════════════════════════════════════════════╝${c.reset}`);
                    console.log();
                    console.log(`   ${c.brightCyan}t${c.reset} + Enter  │  Start talking`);
                    console.log(`   ${c.brightCyan}s${c.reset} + Enter  │  Stop talking`);
                    console.log(`   ${c.brightCyan}/hangup${c.reset}    │  End call`);
                    console.log();
                    console.log(`   ${c.dim}💡 TIP: Use headphones to avoid echo/feedback${c.reset}`);
                    console.log();
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

        // Show nice connected banner
        console.log();
        console.log(`${c.brightGreen}╔════════════════════════════════════════════════════════╗${c.reset}`);
        console.log(`${c.brightGreen}║${c.reset}  📞 ${c.bold}CONNECTED${c.reset} with ${c.brightMagenta}${c.bold}${callPartner}${c.reset}                           ${c.brightGreen}║${c.reset}`);
        console.log(`${c.brightGreen}╚════════════════════════════════════════════════════════╝${c.reset}`);
        console.log();
        console.log(`   ${c.brightCyan}t${c.reset} + Enter  │  Start talking`);
        console.log(`   ${c.brightCyan}s${c.reset} + Enter  │  Stop talking`);
        console.log(`   ${c.brightCyan}/hangup${c.reset}    │  End call`);
        console.log();
        console.log(`   ${c.dim}💡 TIP: Use headphones to avoid echo/feedback${c.reset}`);
        console.log();
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

    // Calculate audio level from buffer (0-100)
    function getAudioLevel(buffer) {
        if (!buffer || buffer.length < 2) return 0;

        let sum = 0;
        // Read 16-bit samples
        for (let i = 0; i < buffer.length - 1; i += 2) {
            const sample = buffer.readInt16LE(i);
            sum += Math.abs(sample);
        }
        const avg = sum / (buffer.length / 2);
        // Normalize to 0-100 (32768 is max for 16-bit)
        const level = Math.min(100, Math.round((avg / 32768) * 100 * 3)); // *3 for sensitivity
        return level;
    }

    // Create visual audio meter
    function drawAudioMeter(level, maxBars = 20) {
        const filledBars = Math.round((level / 100) * maxBars);
        const emptyBars = maxBars - filledBars;

        let meter = '';
        // Color based on level
        if (level > 70) {
            meter = `${c.brightRed}${'█'.repeat(filledBars)}${c.dim}${'░'.repeat(emptyBars)}${c.reset}`;
        } else if (level > 40) {
            meter = `${c.brightYellow}${'█'.repeat(filledBars)}${c.dim}${'░'.repeat(emptyBars)}${c.reset}`;
        } else if (level > 10) {
            meter = `${c.brightGreen}${'█'.repeat(filledBars)}${c.dim}${'░'.repeat(emptyBars)}${c.reset}`;
        } else {
            meter = `${c.green}${'█'.repeat(filledBars)}${c.dim}${'░'.repeat(emptyBars)}${c.reset}`;
        }
        return meter;
    }

    function startTalking() {
        if (callState !== CALL_STATE.IN_CALL && callState !== CALL_STATE.IN_GROUP) {
            systemMsg(`${c.yellow}Join a call first: /call <user> or /voice for group${c.reset}`);
            return;
        }

        if (isTalking) {
            systemMsg(`${c.dim}Already talking. Type 's' + Enter to stop.${c.reset}`);
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

        // Show nice talking header
        console.log();
        console.log(`${c.bgGreen}${c.bold}                                                        ${c.reset}`);
        console.log(`${c.bgGreen}${c.bold}   🎤 TRANSMITTING TO: ${callState === CALL_STATE.IN_CALL ? callPartner : 'GROUP'}   ${c.reset}`);
        console.log(`${c.bgGreen}${c.bold}                                                        ${c.reset}`);
        console.log();
        console.log(`${c.brightCyan}   Type ${c.bold}s${c.reset}${c.brightCyan} + Enter to stop talking${c.reset}`);
        console.log(`${c.dim}   Use headphones to avoid echo/feedback${c.reset}`);
        console.log();

        let chunkCount = 0;
        let peakLevel = 0;

        audioCapture.startRecording((chunk) => {
            if (!isTalking) return;

            const compressed = compressAudio(chunk);
            const level = getAudioLevel(chunk);
            peakLevel = Math.max(peakLevel, level);

            // Decay peak slowly
            if (chunkCount % 5 === 0) {
                peakLevel = Math.max(level, peakLevel - 5);
            }

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

            // Draw live audio meter
            const meter = drawAudioMeter(level);
            const peakMark = level > 70 ? '🔊' : level > 30 ? '🔉' : '🔈';
            process.stdout.write(`\r   ${peakMark} ${c.brightGreen}LIVE${c.reset} [${meter}] ${c.dim}${compressed.davidMath} #${chunkCount}${c.reset}   `);
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
        console.log();
        console.log(`${c.dim}   ─────────────────────────────────────────${c.reset}`);
        console.log(`   ${c.yellow}⏹${c.reset}  ${c.dim}Transmission ended${c.reset}`);
        console.log(`${c.dim}   ─────────────────────────────────────────${c.reset}`);
        console.log();
        console.log(`   ${c.brightCyan}t${c.reset} ${c.dim}= talk again${c.reset}  │  ${c.brightCyan}/hangup${c.reset} ${c.dim}= end call${c.reset}`);
        console.log();
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
║                    RANGERBLOCK VOICE v3.0                  ║
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

${c.yellow}=== MICROPHONE ===${c.reset}
  ${c.green}/mic${c.reset}             List available microphones
  ${c.green}/mic <number>${c.reset}    Select microphone by number
  ${c.green}/mic test${c.reset}        Test current microphone (record & playback)

${c.yellow}=== INFO ===${c.reset}
  ${c.green}/peers${c.reset}           List online users
  ${c.green}/relay${c.reset}           Show relay server info
  ${c.green}/status${c.reset}          Show your current status
  ${c.green}/identity${c.reset}        Show your hardware-bound identity
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

                case 'identity':
                case 'id':
                    // Show identity information
                    const summary = justChatIdentity.getSummary();
                    if (summary) {
                        console.log(`
${c.brightCyan}=== YOUR IDENTITY ===${c.reset}
  ${c.green}User ID:${c.reset}    ${summary.userId}
  ${c.green}Username:${c.reset}   ${summary.username}
  ${c.green}Machine:${c.reset}    ${summary.machineName}
  ${c.green}Created:${c.reset}    ${new Date(summary.created).toLocaleDateString()}
  ${c.green}Messages:${c.reset}   ${summary.messagesSent}
  ${c.green}Sessions:${c.reset}   ${summary.sessionsCount}
  ${c.green}On-Chain:${c.reset}   ${summary.isOnChain ? c.brightGreen + 'YES' : c.dim + 'NO'}${c.reset}
  ${c.green}Has Keys:${c.reset}   ${justChatIdentity.getPublicKey() ? c.brightGreen + 'YES ✓' : c.dim + 'NO'}${c.reset}

${c.dim}Your identity is hardware-bound and syncs across RangerBlock apps.${c.reset}
`);
                    } else {
                        systemMsg(`${c.red}No identity found${c.reset}`);
                    }
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

                case 'mic':
                case 'microphone':
                    // Handle /mic subcommands
                    const micArg = args[0]?.toLowerCase();

                    if (!micArg || micArg === 'list') {
                        // List available microphones
                        console.log(`\n${c.brightCyan}=== AVAILABLE MICROPHONES ===${c.reset}`);
                        const mics = listMicrophones();
                        if (mics.length === 0) {
                            console.log(`  ${c.yellow}No microphones detected${c.reset}`);
                        } else {
                            mics.forEach((mic, i) => {
                                const isSelected = (selectedMic === 'default' && mic.isDefault) || selectedMic === mic.name;
                                const selectedMarker = isSelected ? `${c.brightGreen} ◀ SELECTED${c.reset}` : '';
                                const defaultMarker = mic.isDefault ? `${c.dim}(system default)${c.reset}` : '';
                                console.log(`  ${c.green}${i}${c.reset}. ${mic.name} ${defaultMarker}${selectedMarker}`);
                            });
                        }
                        console.log(`\n${c.dim}Currently using: ${selectedMic}${c.reset}`);
                        console.log(`${c.dim}Use /mic <number> to select, /mic test to test${c.reset}\n`);
                    } else if (micArg === 'test') {
                        // Test current microphone
                        testMicrophone((success) => {
                            showPrompt(callState, nickname, callPartner);
                        });
                        return; // Don't show prompt yet, testMicrophone will do it
                    } else if (!isNaN(parseInt(micArg))) {
                        // Select microphone by number
                        const micIndex = parseInt(micArg);
                        const mics = listMicrophones();
                        if (micIndex >= 0 && micIndex < mics.length) {
                            selectedMic = mics[micIndex].name;
                            systemMsg(`${c.brightGreen}Selected microphone: ${selectedMic}${c.reset}`);
                            systemMsg(`${c.dim}Use /mic test to verify it works${c.reset}`);
                        } else {
                            systemMsg(`${c.red}Invalid mic number. Use /mic to see list.${c.reset}`);
                        }
                    } else {
                        systemMsg(`${c.yellow}Usage: /mic [list|test|<number>]${c.reset}`);
                    }
                    break;

                case 'mic-test':
                    testMicrophone((success) => {
                        showPrompt(callState, nickname, callPartner);
                    });
                    return; // Don't show prompt yet

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

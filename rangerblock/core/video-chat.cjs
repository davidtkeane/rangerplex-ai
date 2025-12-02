#!/usr/bin/env node
/**
 * RANGERBLOCK VIDEO + VOICE CHAT v1.0.0
 * =====================================
 * P2P Video & Voice communication with Private Calls + Group Mode
 *
 * VIDEO:
 *   /video on       - Start video transmission
 *   /video off      - Stop video transmission
 *   /video test     - Test webcam capture
 *
 * PRIVATE CALL:
 *   /call M3Pro     - Call specific user (voice + optional video)
 *   /answer         - Answer incoming call
 *   /reject         - Reject incoming call
 *   /hangup         - End current call
 *
 * GROUP:
 *   /voice          - Join group voice channel
 *   /leave          - Leave group channel
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 * Philosophy: "One foot in front of the other"
 * Innovation: David's 73->27->73 compression mathematics
 */

const WebSocket = require('ws');
const readline = require('readline');
const os = require('os');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = '1.1.0';
let DEBUG_MODE = false;
const RELAY_HOST = '44.222.101.125';
const RELAY_PORT = 5555;
const DEFAULT_CHANNEL = '#rangers';

// Audio settings
const SAMPLE_RATE = 16000;
const CHANNELS = 1;
const BIT_DEPTH = 16;

// Video settings
const VIDEO_WIDTH = 320;
const VIDEO_HEIGHT = 240;
const VIDEO_FPS = 30; // macOS cameras require 15-30fps minimum!
const VIDEO_QUALITY = 30; // JPEG quality (lower = smaller)

// Device selection
let selectedMic = 'default';
let selectedCamera = 'default';
let availableCameras = [];
let availableMics = [];

// Call states
const CALL_STATE = {
    IDLE: 'idle',
    CALLING: 'calling',
    RINGING: 'ringing',
    IN_CALL: 'in_call',
    IN_GROUP: 'in_group'
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
    brightBlue: '\x1b[94m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
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

function videoMsg(msg) {
    log(`${c.brightBlue}📹${c.reset} ${msg}`);
}

function callMsg(msg) {
    log(`${c.brightGreen}📞${c.reset} ${msg}`);
}

function voiceMsg(from, status) {
    log(`${c.brightMagenta}🎤${c.reset} ${c.bold}${from}${c.reset} ${status}`);
}

function chatMsg(from, message) {
    log(`${c.cyan}💬${c.reset} ${c.bold}${from}${c.reset}: ${message}`);
}

function showPrompt(state, nickname, callWith = null) {
    let prefix = '';
    switch (state) {
        case CALL_STATE.IN_CALL:
            prefix = `${c.brightGreen}[CALL ${callWith}]${c.reset} `;
            break;
        case CALL_STATE.IN_GROUP:
            prefix = `${c.brightMagenta}[GROUP]${c.reset} `;
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

function compressData(buffer) {
    try {
        const compressed = zlib.deflateSync(buffer, { level: 9 });
        const ratio = compressed.length / buffer.length;
        return {
            data: compressed,
            originalSize: buffer.length,
            compressedSize: compressed.length,
            ratio: ratio,
            davidMath: ratio <= 0.27 ? '27%!' : `${(ratio * 100).toFixed(0)}%`
        };
    } catch (err) {
        return { data: buffer, error: err.message };
    }
}

function decompressData(compressedBuffer) {
    try {
        return zlib.inflateSync(compressedBuffer);
    } catch (err) {
        return compressedBuffer;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEVICE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

function listCameras() {
    return new Promise((resolve) => {
        const platform = os.platform();
        const cameras = [];

        if (platform === 'darwin') {
            // macOS: Use ffmpeg to list avfoundation devices
            const proc = spawn('ffmpeg', ['-f', 'avfoundation', '-list_devices', 'true', '-i', '']);
            let output = '';

            proc.stderr.on('data', (data) => {
                output += data.toString();
            });

            proc.on('close', () => {
                // Parse video devices from ffmpeg output
                const lines = output.split('\n');
                let inVideoSection = false;
                let index = 0;

                for (const line of lines) {
                    if (line.includes('AVFoundation video devices:')) {
                        inVideoSection = true;
                        continue;
                    }
                    if (line.includes('AVFoundation audio devices:')) {
                        inVideoSection = false;
                        continue;
                    }
                    if (inVideoSection) {
                        // Match lines like "[AVFoundation indev @ 0x...] [0] FaceTime HD Camera"
                        const match = line.match(/\[(\d+)\]\s+(.+)$/);
                        if (match) {
                            cameras.push({
                                index: parseInt(match[1]),
                                name: match[2].trim(),
                                id: match[1]
                            });
                        }
                    }
                }

                availableCameras = cameras;
                resolve(cameras);
            });

            proc.on('error', () => {
                resolve([{ index: 0, name: 'Default Camera', id: '0' }]);
            });

        } else if (platform === 'win32') {
            // Windows: Use ffmpeg to list dshow devices
            const proc = spawn('ffmpeg', ['-f', 'dshow', '-list_devices', 'true', '-i', 'dummy']);
            let output = '';

            proc.stderr.on('data', (data) => {
                output += data.toString();
            });

            proc.on('close', () => {
                const lines = output.split('\n');
                let inVideoSection = false;
                let index = 0;

                for (const line of lines) {
                    if (line.includes('DirectShow video devices')) {
                        inVideoSection = true;
                        continue;
                    }
                    if (line.includes('DirectShow audio devices')) {
                        inVideoSection = false;
                        continue;
                    }
                    if (inVideoSection) {
                        // Match lines like "  "Integrated Webcam""
                        const match = line.match(/"([^"]+)"/);
                        if (match && !line.includes('Alternative name')) {
                            cameras.push({
                                index: index,
                                name: match[1],
                                id: `video=${match[1]}`
                            });
                            index++;
                        }
                    }
                }

                availableCameras = cameras;
                resolve(cameras);
            });

            proc.on('error', () => {
                resolve([{ index: 0, name: 'Integrated Webcam', id: 'video=Integrated Webcam' }]);
            });

        } else {
            // Linux: Check /dev/video* devices
            try {
                const videoDevices = fs.readdirSync('/dev').filter(f => f.startsWith('video'));
                videoDevices.forEach((dev, i) => {
                    cameras.push({
                        index: i,
                        name: `/dev/${dev}`,
                        id: `/dev/${dev}`
                    });
                });
                availableCameras = cameras;
                resolve(cameras);
            } catch (err) {
                resolve([{ index: 0, name: '/dev/video0', id: '/dev/video0' }]);
            }
        }
    });
}

function listMicrophones() {
    return new Promise((resolve) => {
        const platform = os.platform();
        const mics = [];

        if (platform === 'darwin') {
            // macOS: Use system_profiler to list audio devices
            try {
                const output = execSync('system_profiler SPAudioDataType 2>/dev/null').toString();
                const lines = output.split('\n');
                let currentDevice = null;
                let hasInput = false;

                for (const line of lines) {
                    const trimmed = line.trim();

                    // New device block
                    if (trimmed.endsWith(':') && !trimmed.startsWith('Input') && !trimmed.startsWith('Output') &&
                        !trimmed.startsWith('Audio') && !trimmed.startsWith('Devices') && !trimmed.startsWith('Default')) {
                        if (currentDevice && hasInput) {
                            mics.push(currentDevice);
                        }
                        currentDevice = {
                            index: mics.length,
                            name: trimmed.replace(':', ''),
                            id: 'default'
                        };
                        hasInput = false;
                    }

                    // Check for input capability
                    if (trimmed.includes('Input Source:') || trimmed.includes('Input Channels:')) {
                        hasInput = true;
                    }
                }

                // Add last device
                if (currentDevice && hasInput) {
                    mics.push(currentDevice);
                }

                // Always add default as option
                if (mics.length === 0) {
                    mics.push({ index: 0, name: 'Default Microphone', id: 'default' });
                }

                availableMics = mics;
                resolve(mics);

            } catch (err) {
                resolve([{ index: 0, name: 'Default Microphone', id: 'default' }]);
            }

        } else if (platform === 'win32') {
            // Windows: Use ffmpeg to list audio devices
            const proc = spawn('ffmpeg', ['-f', 'dshow', '-list_devices', 'true', '-i', 'dummy']);
            let output = '';

            proc.stderr.on('data', (data) => {
                output += data.toString();
            });

            proc.on('close', () => {
                const lines = output.split('\n');
                let inAudioSection = false;
                let index = 0;

                for (const line of lines) {
                    if (line.includes('DirectShow audio devices')) {
                        inAudioSection = true;
                        continue;
                    }
                    if (inAudioSection) {
                        const match = line.match(/"([^"]+)"/);
                        if (match && !line.includes('Alternative name')) {
                            mics.push({
                                index: index,
                                name: match[1],
                                id: match[1]
                            });
                            index++;
                        }
                    }
                }

                if (mics.length === 0) {
                    mics.push({ index: 0, name: 'Default', id: 'default' });
                }

                availableMics = mics;
                resolve(mics);
            });

            proc.on('error', () => {
                resolve([{ index: 0, name: 'Default', id: 'default' }]);
            });

        } else {
            // Linux: Use arecord -l
            try {
                const output = execSync('arecord -l 2>/dev/null').toString();
                const lines = output.split('\n');

                for (const line of lines) {
                    const match = line.match(/card (\d+):.*\[(.+?)\]/);
                    if (match) {
                        mics.push({
                            index: parseInt(match[1]),
                            name: match[2],
                            id: `hw:${match[1]}`
                        });
                    }
                }

                if (mics.length === 0) {
                    mics.push({ index: 0, name: 'Default', id: 'default' });
                }

                availableMics = mics;
                resolve(mics);

            } catch (err) {
                resolve([{ index: 0, name: 'Default', id: 'default' }]);
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO CAPTURE (using ffmpeg)
// ═══════════════════════════════════════════════════════════════════════════

class VideoCapture {
    constructor() {
        this.capturing = false;
        this.process = null;
        this.frameBuffer = Buffer.alloc(0);
    }

    checkFfmpegInstalled() {
        return new Promise((resolve) => {
            const check = spawn('ffmpeg', ['-version']);
            check.on('error', () => resolve(false));
            check.on('close', (code) => resolve(code === 0));
        });
    }

    getVideoDevice() {
        const platform = os.platform();
        if (platform === 'darwin') {
            return '0'; // Default FaceTime camera
        } else if (platform === 'win32') {
            return 'video="Integrated Camera"'; // Common Windows webcam name
        } else {
            return '/dev/video0'; // Linux
        }
    }

    getInputFormat() {
        const platform = os.platform();
        if (platform === 'darwin') {
            return 'avfoundation';
        } else if (platform === 'win32') {
            return 'dshow';
        } else {
            return 'v4l2';
        }
    }

    getSelectedCameraInput() {
        const platform = os.platform();

        // If a specific camera is selected, use it
        if (selectedCamera !== 'default' && availableCameras.length > 0) {
            const cam = availableCameras.find(c =>
                c.index === parseInt(selectedCamera) ||
                c.name.toLowerCase().includes(selectedCamera.toLowerCase()) ||
                c.id === selectedCamera
            );
            if (cam) {
                return cam.id;
            }
        }

        // Default camera by platform
        if (platform === 'darwin') {
            return '0';
        } else if (platform === 'win32') {
            return availableCameras.length > 0 ? availableCameras[0].id : 'video=Integrated Webcam';
        } else {
            return '/dev/video0';
        }
    }

    startCapture(onFrame) {
        if (this.capturing) return;

        const platform = os.platform();
        const cameraInput = this.getSelectedCameraInput();
        let args;

        if (platform === 'darwin') {
            // macOS: Use avfoundation
            args = [
                '-f', 'avfoundation',
                '-framerate', String(VIDEO_FPS),
                '-video_size', `${VIDEO_WIDTH}x${VIDEO_HEIGHT}`,
                '-i', cameraInput,
                '-f', 'mjpeg',
                '-q:v', String(Math.round(31 - (VIDEO_QUALITY / 100) * 30)), // ffmpeg quality (2-31, lower=better)
                '-'
            ];
        } else if (platform === 'win32') {
            // Windows: Use dshow
            args = [
                '-f', 'dshow',
                '-framerate', String(VIDEO_FPS),
                '-video_size', `${VIDEO_WIDTH}x${VIDEO_HEIGHT}`,
                '-i', cameraInput,
                '-f', 'mjpeg',
                '-q:v', String(Math.round(31 - (VIDEO_QUALITY / 100) * 30)),
                '-'
            ];
        } else {
            // Linux: Use v4l2
            args = [
                '-f', 'v4l2',
                '-framerate', String(VIDEO_FPS),
                '-video_size', `${VIDEO_WIDTH}x${VIDEO_HEIGHT}`,
                '-i', cameraInput,
                '-f', 'mjpeg',
                '-q:v', String(Math.round(31 - (VIDEO_QUALITY / 100) * 30)),
                '-'
            ];
        }

        this.process = spawn('ffmpeg', args);
        this.capturing = true;

        // MJPEG frames are separated by FFD8 (start) and FFD9 (end) markers
        let frameData = Buffer.alloc(0);

        this.process.stdout.on('data', (chunk) => {
            frameData = Buffer.concat([frameData, chunk]);

            // Look for JPEG frame boundaries
            let startIdx = 0;
            while (true) {
                const jpegStart = frameData.indexOf(Buffer.from([0xFF, 0xD8]), startIdx);
                if (jpegStart === -1) break;

                const jpegEnd = frameData.indexOf(Buffer.from([0xFF, 0xD9]), jpegStart + 2);
                if (jpegEnd === -1) break;

                // Extract complete JPEG frame
                const frame = frameData.slice(jpegStart, jpegEnd + 2);
                if (onFrame) onFrame(frame);

                startIdx = jpegEnd + 2;
            }

            // Keep unprocessed data
            if (startIdx > 0) {
                frameData = frameData.slice(startIdx);
            }

            // Prevent buffer overflow
            if (frameData.length > 1000000) {
                frameData = Buffer.alloc(0);
            }
        });

        this.process.stderr.on('data', (data) => {
            // Log ffmpeg errors if debug mode
            const msg = data.toString();
            if (msg.includes('Error') || msg.includes('error')) {
                console.log(`\n   ${c.red}ffmpeg error: ${msg.trim()}${c.reset}\n`);
            }
        });
        this.process.on('error', (err) => {
            console.log(`\n   ${c.red}Video capture error: ${err.message}${c.reset}\n`);
            this.capturing = false;
        });
        this.process.on('close', (code) => {
            if (code !== 0 && code !== null) {
                console.log(`\n   ${c.yellow}Video capture stopped (code: ${code})${c.reset}\n`);
            }
            this.capturing = false;
        });
    }

    stopCapture() {
        if (this.process) {
            this.process.kill('SIGTERM');
            this.process = null;
        }
        this.capturing = false;
    }

    // Capture single frame for testing
    captureTestFrame(callback) {
        const platform = os.platform();
        const testFile = path.join(os.tmpdir(), 'rangerblock_video_test.jpg');
        const cameraInput = this.getSelectedCameraInput();

        let args;
        if (platform === 'darwin') {
            // macOS cameras require 15-30fps minimum, can't use 1fps
            args = ['-f', 'avfoundation', '-framerate', '30', '-i', cameraInput, '-frames:v', '1', '-update', '1', '-y', testFile];
        } else if (platform === 'win32') {
            args = ['-f', 'dshow', '-framerate', '30', '-i', cameraInput, '-frames:v', '1', '-update', '1', '-y', testFile];
        } else {
            args = ['-f', 'v4l2', '-framerate', '30', '-i', cameraInput, '-frames:v', '1', '-update', '1', '-y', testFile];
        }

        const proc = spawn('ffmpeg', args);

        proc.on('close', (code) => {
            if (code === 0 && fs.existsSync(testFile)) {
                const frame = fs.readFileSync(testFile);
                fs.unlinkSync(testFile);
                callback(null, frame, cameraInput);
            } else {
                callback(new Error('Failed to capture test frame'));
            }
        });

        proc.on('error', (err) => {
            callback(err);
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO DISPLAY
// ═══════════════════════════════════════════════════════════════════════════

class VideoDisplay {
    constructor() {
        this.outputDir = path.join(os.tmpdir(), 'rangerblock_video');
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
        this.frameCount = 0;
        this.viewerOpened = false;
        this.liveFile = path.join(this.outputDir, 'live_video.jpg');
    }

    displayFrame(jpegBuffer, senderName) {
        try {
            this.frameCount++;

            // Always save to the same file for live viewing
            fs.writeFileSync(this.liveFile, jpegBuffer);

            // On first frame, open viewer
            if (!this.viewerOpened) {
                this.viewerOpened = true;
                const platform = os.platform();

                console.log(`\n   ${c.brightBlue}📺 Opening video viewer for ${senderName}...${c.reset}`);
                console.log(`   ${c.dim}File: ${this.liveFile}${c.reset}\n`);

                if (platform === 'darwin') {
                    // Use Preview which auto-refreshes
                    spawn('open', ['-a', 'Preview', this.liveFile]);
                } else if (platform === 'win32') {
                    spawn('start', ['', this.liveFile], { shell: true });
                } else {
                    spawn('xdg-open', [this.liveFile]);
                }
            }

            return true;
        } catch (err) {
            return false;
        }
    }

    // Save video stream to file for playback
    saveStreamFrame(jpegBuffer, senderName) {
        try {
            fs.writeFileSync(this.liveFile, jpegBuffer);

            // Open viewer on first frame
            if (!this.viewerOpened) {
                this.viewerOpened = true;
                const platform = os.platform();

                console.log(`\n   ${c.brightBlue}📺 Receiving video from ${senderName}!${c.reset}`);
                console.log(`   ${c.dim}Opening viewer: ${this.liveFile}${c.reset}\n`);

                if (platform === 'darwin') {
                    spawn('open', ['-a', 'Preview', this.liveFile]);
                } else if (platform === 'win32') {
                    spawn('start', ['', this.liveFile], { shell: true });
                } else {
                    spawn('xdg-open', [this.liveFile]);
                }
            }

            this.frameCount++;
            return this.liveFile;
        } catch (err) {
            return null;
        }
    }

    resetViewer() {
        this.viewerOpened = false;
        this.frameCount = 0;
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
            args = ['-t', 'waveaudio', 'default', '-t', 'raw', '-r', String(SAMPLE_RATE), '-c', String(CHANNELS), '-b', String(BIT_DEPTH), '-e', 'signed-integer', '-'];
        } else {
            args = ['-d', '-t', 'raw', '-r', String(SAMPLE_RATE), '-c', String(CHANNELS), '-b', String(BIT_DEPTH), '-e', 'signed-integer', '-'];
        }

        this.process = spawn('sox', args);
        this.recording = true;

        this.process.stdout.on('data', (chunk) => {
            if (onData) onData(chunk);
        });

        this.process.stderr.on('data', () => {});
        this.process.on('error', () => { this.recording = false; });
        this.process.on('close', () => { this.recording = false; });
    }

    stopRecording() {
        if (this.process) {
            if (os.platform() === 'win32') {
                this.process.kill();
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
            args = ['-t', 'raw', '-r', String(SAMPLE_RATE), '-c', String(CHANNELS), '-b', String(BIT_DEPTH), '-e', 'signed-integer', '-', '-t', 'waveaudio', 'default'];
        } else {
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
// RING TONE
// ═══════════════════════════════════════════════════════════════════════════

class RingTone {
    constructor() {
        this.ringing = false;
        this.interval = null;
    }

    start(callerName) {
        this.ringing = true;
        this.callerName = callerName;

        const ring = () => {
            if (!this.ringing) return;
            clearLine();
            console.log('\n');
            console.log(`${c.bgRed}${c.bold}                                                    ${c.reset}`);
            console.log(`${c.bgRed}${c.bold}   📹 INCOMING VIDEO CALL FROM: ${callerName.toUpperCase()}   ${c.reset}`);
            console.log(`${c.bgRed}${c.bold}                                                    ${c.reset}`);
            console.log('');
            console.log(`   ${c.brightGreen}${c.bold}>>> Type 'a' to ANSWER <<<${c.reset}`);
            console.log(`   ${c.brightRed}>>> Type 'r' to REJECT <<<${c.reset}`);
            console.log('');
            process.stdout.write('\x07');
        };

        ring();
        this.interval = setInterval(ring, 2000);
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
${c.brightBlue}+================================================================+
|  ${c.brightGreen}RANGER    RANGER    RANGER    RANGER${c.brightBlue}                        |
|  ${c.brightGreen}BLOCK     BLOCK     BLOCK     BLOCK${c.brightBlue}                         |
|                                                                |
|     ${c.brightCyan}VIDEO + VOICE + CHAT${c.reset}  ${c.dim}v${VERSION}${c.brightBlue}                          |
|     ${c.dim}Private Calls | Group Mode | Video Streaming${c.brightBlue}               |
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

    // Initialize components
    const audioCapture = new AudioCapture();
    const audioPlayback = new AudioPlayback();
    const videoCapture = new VideoCapture();
    const videoDisplay = new VideoDisplay();
    const ringTone = new RingTone();

    // Check dependencies
    const soxInstalled = await audioCapture.checkSoxInstalled();
    const ffmpegInstalled = await videoCapture.checkFfmpegInstalled();

    if (!soxInstalled) {
        console.log(`${c.red}SoX NOT INSTALLED - Required for voice${c.reset}`);
        console.log(`  macOS:   brew install sox`);
        console.log(`  Linux:   sudo apt install sox`);
        console.log(`  Windows: winget install sox.sox`);
    } else {
        systemMsg(`${c.green}SoX audio ready${c.reset}`);
    }

    if (!ffmpegInstalled) {
        console.log(`${c.yellow}ffmpeg NOT INSTALLED - Required for video${c.reset}`);
        console.log(`  macOS:   brew install ffmpeg`);
        console.log(`  Linux:   sudo apt install ffmpeg`);
        console.log(`  Windows: winget install ffmpeg`);
        console.log(`${c.dim}Voice chat will still work without video.${c.reset}`);
    } else {
        videoMsg(`${c.green}ffmpeg video ready${c.reset}`);

        // Detect available cameras
        const cameras = await listCameras();
        if (cameras.length > 0) {
            videoMsg(`${c.brightCyan}${cameras.length}${c.reset} camera(s) detected:`);
            cameras.forEach((cam, i) => {
                const marker = i === 0 ? `${c.green}→${c.reset}` : ` `;
                console.log(`   ${marker} ${c.dim}[${cam.index}]${c.reset} ${cam.name}`);
            });
            console.log(`   ${c.dim}Use /camera list or /camera <n> to change${c.reset}`);
        }
    }

    // Detect available microphones
    if (soxInstalled) {
        const mics = await listMicrophones();
        if (mics.length > 0) {
            systemMsg(`${c.brightCyan}${mics.length}${c.reset} microphone(s) detected:`);
            mics.forEach((mic, i) => {
                const marker = i === 0 ? `${c.green}→${c.reset}` : ` `;
                console.log(`   ${marker} ${c.dim}[${mic.index}]${c.reset} ${mic.name}`);
            });
            console.log(`   ${c.dim}Use /mic list or /mic <n> to change${c.reset}`);
        }
    }

    console.log();

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
    let isVideoOn = false;
    let peers = [];

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
        videoCapture.stopCapture();
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
                        mode: 'video-chat',
                        capabilities: ['voice', 'chat', 'call', 'video']
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
            // CALL SIGNALING
            case 'callRequest':
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

                    console.log();
                    console.log(`${c.brightGreen}╔════════════════════════════════════════════════════════╗${c.reset}`);
                    console.log(`${c.brightGreen}║${c.reset}  📹 ${c.bold}CONNECTED${c.reset} with ${c.brightMagenta}${c.bold}${senderName}${c.reset}                           ${c.brightGreen}║${c.reset}`);
                    console.log(`${c.brightGreen}╚════════════════════════════════════════════════════════╝${c.reset}`);
                    console.log();
                    console.log(`   ${c.brightCyan}t${c.reset} + Enter     │  Start talking`);
                    console.log(`   ${c.brightCyan}s${c.reset} + Enter     │  Stop talking`);
                    console.log(`   ${c.brightCyan}/video on${c.reset}    │  Start video`);
                    console.log(`   ${c.brightCyan}/video off${c.reset}   │  Stop video`);
                    console.log(`   ${c.brightCyan}/hangup${c.reset}      │  End call`);
                    console.log();
                    console.log(`   ${c.dim}💡 TIP: Use headphones to avoid echo${c.reset}`);
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
                    videoCapture.stopCapture();
                    ringTone.stop();
                    isTalking = false;
                    isVideoOn = false;
                    callState = CALL_STATE.IDLE;
                    callPartner = null;
                    incomingCaller = null;
                    callMsg(`${c.dim}Call ended by ${senderName}${c.reset}`);
                    showPrompt(callState, nickname, callPartner);
                }
                break;

            // VOICE DATA
            case 'voiceData':
                const shouldPlayVoice =
                    (callState === CALL_STATE.IN_CALL && senderName === callPartner) ||
                    (callState === CALL_STATE.IN_GROUP);

                if (shouldPlayVoice && !isMuted) {
                    try {
                        const compressedAudio = Buffer.from(payload.audio, 'base64');
                        const audioBuffer = decompressData(compressedAudio);
                        audioPlayback.play(audioBuffer);
                    } catch (err) {}
                }
                break;

            case 'voiceStatus':
                const isRelevantVoice =
                    (callState === CALL_STATE.IN_CALL && senderName === callPartner) ||
                    (callState === CALL_STATE.IN_GROUP);

                if (isRelevantVoice) {
                    if (payload.status === 'started') {
                        voiceMsg(senderName, `${c.green}talking...${c.reset}`);
                    } else if (payload.status === 'stopped') {
                        voiceMsg(senderName, `${c.dim}stopped${c.reset}`);
                    }
                    showPrompt(callState, nickname, callPartner);
                }
                break;

            // VIDEO DATA
            case 'videoFrame':
                const shouldPlayVideo =
                    (callState === CALL_STATE.IN_CALL && senderName === callPartner) ||
                    (callState === CALL_STATE.IN_GROUP);

                if (shouldPlayVideo) {
                    try {
                        const compressedFrame = Buffer.from(payload.frame, 'base64');
                        const frameBuffer = decompressData(compressedFrame);
                        videoDisplay.saveStreamFrame(frameBuffer, senderName);
                        if (DEBUG_MODE) {
                            videoMsg(`Frame from ${senderName} (${frameBuffer.length} bytes)`);
                        }
                    } catch (err) {}
                }
                break;

            case 'videoStatus':
                const isRelevantVideo =
                    (callState === CALL_STATE.IN_CALL && senderName === callPartner) ||
                    (callState === CALL_STATE.IN_GROUP);

                if (isRelevantVideo) {
                    if (payload.status === 'started') {
                        videoMsg(`${senderName} ${c.brightBlue}started video${c.reset}`);
                    } else if (payload.status === 'stopped') {
                        videoMsg(`${senderName} ${c.dim}stopped video${c.reset}`);
                    }
                    showPrompt(callState, nickname, callPartner);
                }
                break;

            // GROUP
            case 'joinedGroupVoice':
                if (callState === CALL_STATE.IN_GROUP) {
                    systemMsg(`${c.brightMagenta}${senderName}${c.reset} joined group`);
                    showPrompt(callState, nickname, callPartner);
                }
                break;

            case 'leftGroupVoice':
                if (callState === CALL_STATE.IN_GROUP) {
                    systemMsg(`${c.dim}${senderName} left group${c.reset}`);
                    showPrompt(callState, nickname, callPartner);
                }
                break;

            // CHAT
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

        const peer = peers.find(p =>
            (p.nickname && p.nickname.toLowerCase() === targetName.toLowerCase()) ||
            (p.nickname && p.nickname.toLowerCase().startsWith(targetName.toLowerCase())) ||
            (p.address && p.address.toLowerCase().startsWith(targetName.toLowerCase()))
        );

        if (!peer) {
            systemMsg(`${c.red}User '${targetName}' not found. Use /peers${c.reset}`);
            return;
        }

        const target = peer.nickname || targetName;
        callState = CALL_STATE.CALLING;
        callPartner = target;

        callMsg(`${c.yellow}Calling ${target}...${c.reset}`);

        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'callRequest',
                from: nodeId,
                nickname: nickname,
                target: target,
                hasVideo: ffmpegInstalled,
                timestamp: Date.now()
            }
        }));

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
                hasVideo: ffmpegInstalled,
                timestamp: Date.now()
            }
        }));

        console.log();
        console.log(`${c.brightGreen}╔════════════════════════════════════════════════════════╗${c.reset}`);
        console.log(`${c.brightGreen}║${c.reset}  📹 ${c.bold}CONNECTED${c.reset} with ${c.brightMagenta}${c.bold}${callPartner}${c.reset}                           ${c.brightGreen}║${c.reset}`);
        console.log(`${c.brightGreen}╚════════════════════════════════════════════════════════╝${c.reset}`);
        console.log();
        console.log(`   ${c.brightCyan}t${c.reset} + Enter     │  Start talking`);
        console.log(`   ${c.brightCyan}s${c.reset} + Enter     │  Stop talking`);
        console.log(`   ${c.brightCyan}/video on${c.reset}    │  Start video`);
        console.log(`   ${c.brightCyan}/video off${c.reset}   │  Stop video`);
        console.log(`   ${c.brightCyan}/hangup${c.reset}      │  End call`);
        console.log();
        console.log(`   ${c.dim}💡 TIP: Use headphones to avoid echo${c.reset}`);
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
        videoCapture.stopCapture();
        isTalking = false;
        isVideoOn = false;

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
    // VIDEO FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    function startVideo() {
        if (callState !== CALL_STATE.IN_CALL && callState !== CALL_STATE.IN_GROUP) {
            systemMsg(`${c.yellow}Join a call first to start video${c.reset}`);
            return;
        }

        if (!ffmpegInstalled) {
            systemMsg(`${c.red}ffmpeg not installed. Cannot start video.${c.reset}`);
            return;
        }

        if (isVideoOn) {
            systemMsg(`${c.dim}Video already on. Use /video off to stop.${c.reset}`);
            return;
        }

        isVideoOn = true;

        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'videoStatus',
                from: nodeId,
                nickname: nickname,
                status: 'started',
                target: callState === CALL_STATE.IN_CALL ? callPartner : 'group',
                timestamp: Date.now()
            }
        }));

        console.log();
        console.log(`${c.bgBlue}${c.bold}                                                        ${c.reset}`);
        console.log(`${c.bgBlue}${c.bold}   📹 VIDEO STREAMING TO: ${callState === CALL_STATE.IN_CALL ? callPartner : 'GROUP'}   ${c.reset}`);
        console.log(`${c.bgBlue}${c.bold}                                                        ${c.reset}`);
        console.log();
        console.log(`${c.dim}   /video off to stop streaming${c.reset}`);
        console.log();

        let frameCount = 0;

        videoCapture.startCapture((frame) => {
            if (!isVideoOn) return;

            const compressed = compressData(frame);

            ws.send(JSON.stringify({
                type: 'broadcast',
                payload: {
                    type: 'videoFrame',
                    from: nodeId,
                    nickname: nickname,
                    frame: compressed.data.toString('base64'),
                    target: callState === CALL_STATE.IN_CALL ? callPartner : 'group',
                    compression: compressed.davidMath,
                    timestamp: Date.now()
                }
            }));

            frameCount++;
            process.stdout.write(`\r   ${c.brightBlue}📹 LIVE${c.reset} [${c.green}${'█'.repeat(Math.min(10, frameCount % 20))}${c.dim}${'░'.repeat(Math.max(0, 10 - (frameCount % 20)))}${c.reset}] ${c.dim}${compressed.davidMath} #${frameCount}${c.reset}   `);
        });
    }

    function stopVideo() {
        if (!isVideoOn) {
            systemMsg(`${c.dim}Video is not on${c.reset}`);
            return;
        }

        videoCapture.stopCapture();
        isVideoOn = false;

        ws.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'videoStatus',
                from: nodeId,
                nickname: nickname,
                status: 'stopped',
                target: callState === CALL_STATE.IN_CALL ? callPartner : 'group',
                timestamp: Date.now()
            }
        }));

        console.log();
        console.log(`${c.dim}   Video streaming stopped${c.reset}`);
        console.log();
    }

    function testVideo() {
        if (!ffmpegInstalled) {
            systemMsg(`${c.red}ffmpeg not installed. Cannot test video.${c.reset}`);
            return;
        }

        // Get camera name for display
        const camInfo = availableCameras.find(c =>
            c.index === parseInt(selectedCamera) ||
            c.name.toLowerCase().includes(selectedCamera.toLowerCase())
        ) || availableCameras[0] || { name: 'Default Camera' };

        videoMsg(`Testing camera: ${c.brightCyan}${camInfo.name}${c.reset}...`);

        videoCapture.captureTestFrame((err, frame, cameraUsed) => {
            if (err) {
                videoMsg(`${c.red}Camera test failed: ${err.message}${c.reset}`);
                videoMsg(`${c.dim}Make sure no other app is using the camera${c.reset}`);
                if (availableCameras.length > 1) {
                    videoMsg(`${c.dim}Try another camera with /camera <number>${c.reset}`);
                }
            } else {
                videoMsg(`${c.brightGreen}Camera test successful!${c.reset}`);
                videoMsg(`${c.dim}Camera: ${camInfo.name}${c.reset}`);
                videoMsg(`${c.dim}Frame size: ${frame.length} bytes${c.reset}`);

                // Save and open test frame
                const testFile = path.join(os.tmpdir(), 'rangerblock_video_test.jpg');
                fs.writeFileSync(testFile, frame);

                if (os.platform() === 'darwin') {
                    spawn('open', [testFile]);
                } else if (os.platform() === 'win32') {
                    spawn('start', [testFile], { shell: true });
                } else {
                    spawn('xdg-open', [testFile]);
                }

                videoMsg(`${c.dim}Test image opened in viewer${c.reset}`);
            }
            showPrompt(callState, nickname, callPartner);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VOICE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    function getAudioLevel(buffer) {
        if (!buffer || buffer.length < 2) return 0;
        let sum = 0;
        for (let i = 0; i < buffer.length - 1; i += 2) {
            const sample = buffer.readInt16LE(i);
            sum += Math.abs(sample);
        }
        const avg = sum / (buffer.length / 2);
        const level = Math.min(100, Math.round((avg / 32768) * 100 * 3));
        return level;
    }

    function drawAudioMeter(level, maxBars = 20) {
        const filledBars = Math.round((level / 100) * maxBars);
        const emptyBars = maxBars - filledBars;

        if (level > 70) {
            return `${c.brightRed}${'█'.repeat(filledBars)}${c.dim}${'░'.repeat(emptyBars)}${c.reset}`;
        } else if (level > 40) {
            return `${c.brightYellow}${'█'.repeat(filledBars)}${c.dim}${'░'.repeat(emptyBars)}${c.reset}`;
        } else if (level > 10) {
            return `${c.brightGreen}${'█'.repeat(filledBars)}${c.dim}${'░'.repeat(emptyBars)}${c.reset}`;
        } else {
            return `${c.green}${'█'.repeat(filledBars)}${c.dim}${'░'.repeat(emptyBars)}${c.reset}`;
        }
    }

    function startTalking() {
        if (callState !== CALL_STATE.IN_CALL && callState !== CALL_STATE.IN_GROUP) {
            systemMsg(`${c.yellow}Join a call first: /call <user> or /voice${c.reset}`);
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

        console.log();
        console.log(`${c.bgGreen}${c.bold}                                                        ${c.reset}`);
        console.log(`${c.bgGreen}${c.bold}   🎤 TRANSMITTING TO: ${callState === CALL_STATE.IN_CALL ? callPartner : 'GROUP'}   ${c.reset}`);
        console.log(`${c.bgGreen}${c.bold}                                                        ${c.reset}`);
        console.log();
        console.log(`${c.brightCyan}   Type ${c.bold}s${c.reset}${c.brightCyan} + Enter to stop talking${c.reset}`);
        console.log();

        let chunkCount = 0;

        audioCapture.startRecording((chunk) => {
            if (!isTalking) return;

            const compressed = compressData(chunk);
            const level = getAudioLevel(chunk);

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
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GROUP FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    function joinGroup() {
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

        systemMsg(`${c.brightMagenta}Joined group channel${c.reset}`);
        systemMsg(`${c.dim}t = talk, /video on = video, /leave = exit${c.reset}`);
    }

    function leaveGroup() {
        if (callState !== CALL_STATE.IN_GROUP) {
            systemMsg(`${c.yellow}Not in group${c.reset}`);
            return;
        }

        audioCapture.stopRecording();
        videoCapture.stopCapture();
        isTalking = false;
        isVideoOn = false;

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
        systemMsg(`${c.dim}Left group${c.reset}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHAT & HELP
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

    function showHelp() {
        console.log(`
${c.brightBlue}╔════════════════════════════════════════════════════════════╗
║               RANGERBLOCK VIDEO + VOICE v${VERSION}               ║
╚════════════════════════════════════════════════════════════╝${c.reset}

${c.brightBlue}=== VIDEO ===${c.reset}
  ${c.green}/video on${c.reset}        Start video streaming
  ${c.green}/video off${c.reset}       Stop video streaming
  ${c.green}/video test${c.reset}      Test selected camera

${c.brightBlue}=== CAMERA ===${c.reset}
  ${c.green}/camera list${c.reset}     List available cameras
  ${c.green}/camera <n>${c.reset}      Select camera by number
  ${c.green}/camera test${c.reset}     Test selected camera

${c.brightMagenta}=== MICROPHONE ===${c.reset}
  ${c.green}/mic list${c.reset}        List available microphones
  ${c.green}/mic <n>${c.reset}         Select microphone by number
  ${c.green}/mic test${c.reset}        Test selected microphone

${c.brightGreen}=== PRIVATE CALL ===${c.reset}
  ${c.green}/call <user>${c.reset}     Call a user (e.g., /call M3Pro)
  ${c.green}/answer${c.reset} or ${c.green}a${c.reset}    Answer incoming call
  ${c.green}/reject${c.reset} or ${c.green}r${c.reset}    Reject incoming call
  ${c.green}/hangup${c.reset}          End current call

${c.brightMagenta}=== GROUP ===${c.reset}
  ${c.green}/voice${c.reset}           Join group channel
  ${c.green}/leave${c.reset}           Leave group channel

${c.brightCyan}=== VOICE CONTROLS ===${c.reset}
  ${c.green}t${c.reset}                Start talking
  ${c.green}s${c.reset}                Stop talking
  ${c.green}/mute${c.reset}            Mute incoming audio
  ${c.green}/unmute${c.reset}          Unmute audio

${c.brightYellow}=== CHAT ===${c.reset}
  ${c.dim}Just type any message and press Enter${c.reset}

${c.yellow}=== INFO ===${c.reset}
  ${c.green}/peers${c.reset}           List online users
  ${c.green}/status${c.reset}          Show your status
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

        // Quick keys
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

                case 'video':
                    const videoArg = args[0]?.toLowerCase();
                    if (videoArg === 'on' || videoArg === 'start') {
                        startVideo();
                    } else if (videoArg === 'off' || videoArg === 'stop') {
                        stopVideo();
                    } else if (videoArg === 'test') {
                        testVideo();
                        return; // testVideo handles its own prompt
                    } else {
                        systemMsg(`${c.yellow}Usage: /video [on|off|test]${c.reset}`);
                    }
                    break;

                case 'camera':
                case 'cam':
                    const camArg = args[0]?.toLowerCase();
                    if (camArg === 'list' || !camArg) {
                        if (availableCameras.length === 0) {
                            videoMsg(`${c.yellow}No cameras detected. Try /video test${c.reset}`);
                        } else {
                            videoMsg(`${c.brightCyan}Available cameras:${c.reset}`);
                            availableCameras.forEach((cam) => {
                                const selected = (selectedCamera === 'default' && cam.index === 0) ||
                                                 selectedCamera === String(cam.index) ||
                                                 selectedCamera === cam.id;
                                const marker = selected ? `${c.green}→${c.reset}` : ` `;
                                console.log(`   ${marker} ${c.dim}[${cam.index}]${c.reset} ${cam.name}`);
                            });
                        }
                    } else if (camArg === 'test') {
                        testVideo();
                        return;
                    } else {
                        // Select camera by number or name
                        const camNum = parseInt(camArg);
                        const cam = availableCameras.find(c =>
                            c.index === camNum ||
                            c.name.toLowerCase().includes(camArg.toLowerCase())
                        );
                        if (cam) {
                            selectedCamera = String(cam.index);
                            videoMsg(`${c.brightGreen}Camera selected:${c.reset} ${cam.name}`);
                            videoMsg(`${c.dim}Use /camera test to verify${c.reset}`);
                        } else {
                            videoMsg(`${c.red}Camera '${camArg}' not found. Use /camera list${c.reset}`);
                        }
                    }
                    break;

                case 'mic':
                case 'microphone':
                    const micArg = args[0]?.toLowerCase();
                    if (micArg === 'list' || !micArg) {
                        if (availableMics.length === 0) {
                            systemMsg(`${c.yellow}No microphones detected${c.reset}`);
                        } else {
                            systemMsg(`${c.brightCyan}Available microphones:${c.reset}`);
                            availableMics.forEach((mic) => {
                                const selected = selectedMic === 'default' && mic.index === 0 ||
                                                 selectedMic === String(mic.index) ||
                                                 selectedMic === mic.id;
                                const marker = selected ? `${c.green}→${c.reset}` : ` `;
                                console.log(`   ${marker} ${c.dim}[${mic.index}]${c.reset} ${mic.name}`);
                            });
                        }
                    } else if (micArg === 'test') {
                        systemMsg(`Testing microphone...`);
                        systemMsg(`${c.dim}Speak now - you should see audio levels:${c.reset}`);
                        let testChunks = 0;
                        const testDuration = 3000; // 3 seconds

                        audioCapture.startRecording((chunk) => {
                            const level = getAudioLevel(chunk);
                            const meter = drawAudioMeter(level);
                            testChunks++;
                            process.stdout.write(`\r   🎤 [${meter}] ${c.dim}Level: ${level}%${c.reset}   `);
                        });

                        setTimeout(() => {
                            audioCapture.stopRecording();
                            console.log();
                            if (testChunks > 0) {
                                systemMsg(`${c.brightGreen}Microphone test complete!${c.reset} (${testChunks} chunks received)`);
                            } else {
                                systemMsg(`${c.red}No audio received. Check your microphone.${c.reset}`);
                            }
                            showPrompt(callState, nickname, callPartner);
                        }, testDuration);
                        return;
                    } else {
                        // Select mic by number or name
                        const micNum = parseInt(micArg);
                        const mic = availableMics.find(m =>
                            m.index === micNum ||
                            m.name.toLowerCase().includes(micArg.toLowerCase())
                        );
                        if (mic) {
                            selectedMic = mic.id;
                            systemMsg(`${c.brightGreen}Microphone selected:${c.reset} ${mic.name}`);
                            systemMsg(`${c.dim}Use /mic test to verify${c.reset}`);
                        } else {
                            systemMsg(`${c.red}Microphone '${micArg}' not found. Use /mic list${c.reset}`);
                        }
                    }
                    break;

                case 'call':
                case 'c':
                    if (args.length === 0) {
                        systemMsg(`${c.yellow}Usage: /call <username>${c.reset}`);
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
                    joinGroup();
                    break;

                case 'leave':
                case 'l':
                    leaveGroup();
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

                case 'status':
                    const stateNames = {
                        [CALL_STATE.IDLE]: 'Idle',
                        [CALL_STATE.CALLING]: 'Calling...',
                        [CALL_STATE.RINGING]: 'Incoming Call',
                        [CALL_STATE.IN_CALL]: 'In Private Call',
                        [CALL_STATE.IN_GROUP]: 'In Group'
                    };
                    console.log(`
${c.brightCyan}=== YOUR STATUS ===${c.reset}
  ${c.green}State:${c.reset}       ${stateNames[callState] || callState}
  ${c.green}Call With:${c.reset}   ${callPartner || 'Nobody'}
  ${c.green}Talking:${c.reset}     ${isTalking ? `${c.brightGreen}Yes${c.reset}` : 'No'}
  ${c.green}Video:${c.reset}       ${isVideoOn ? `${c.brightBlue}On${c.reset}` : 'Off'}
  ${c.green}Muted:${c.reset}       ${isMuted ? `${c.yellow}Yes${c.reset}` : 'No'}
  ${c.green}Peers:${c.reset}       ${peers.length} online
`);
                    break;

                case 'debug':
                    DEBUG_MODE = !DEBUG_MODE;
                    systemMsg(`Debug mode: ${DEBUG_MODE ? `${c.brightGreen}ON${c.reset}` : `${c.dim}OFF${c.reset}`}`);
                    break;

                case 'quit':
                case 'exit':
                case 'q':
                    stopTalking();
                    stopVideo();
                    if (callState === CALL_STATE.IN_CALL) hangUp();
                    if (callState === CALL_STATE.IN_GROUP) leaveGroup();
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
        stopVideo();
        if (callState === CALL_STATE.IN_CALL) hangUp();
        if (callState === CALL_STATE.IN_GROUP) leaveGroup();
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

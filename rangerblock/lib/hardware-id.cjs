#!/usr/bin/env node
/**
 * RANGERBLOCK HARDWARE ID MODULE v1.0.0
 * =====================================
 * Cross-platform hardware fingerprinting for persistent identity
 *
 * Ported from: apps/ranger-chat-lite/electron/identityService.ts
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 *
 * Supports: macOS, Windows, Linux
 */

const crypto = require('crypto');
const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// HARDWARE ID CLASS
// ═══════════════════════════════════════════════════════════════════════════

class HardwareId {
    constructor() {
        this.platform = os.platform();
        this.cached = null;
    }

    /**
     * Get the hardware fingerprint for this device
     * Returns a 32-character hex string unique to this machine
     */
    getFingerprint() {
        if (this.cached) {
            return this.cached;
        }

        const result = this._generateFingerprint();
        this.cached = result;
        return result;
    }

    /**
     * Generate the hardware fingerprint
     * Uses multiple sources for uniqueness
     */
    _generateFingerprint() {
        const components = [];

        // 1. Hardware UUID (most reliable, platform-specific)
        const hardwareUuid = this._getHardwareUuid();
        if (hardwareUuid) {
            components.push(hardwareUuid);
        }

        // 2. Hostname (user can change, but adds entropy)
        components.push(os.hostname());

        // 3. Username (ties to user account)
        try {
            components.push(os.userInfo().username);
        } catch (e) {
            components.push('unknown');
        }

        // 4. Machine architecture
        components.push(os.arch());

        // 5. CPU model (stable identifier)
        const cpus = os.cpus();
        if (cpus.length > 0) {
            components.push(cpus[0].model);
        }

        // 6. Total memory (relatively stable)
        components.push(os.totalmem().toString());

        // Create SHA-256 hash of all components
        const fingerprint = crypto
            .createHash('sha256')
            .update(components.join('|'))
            .digest('hex')
            .substring(0, 32);

        return fingerprint;
    }

    /**
     * Get hardware UUID (platform-specific)
     */
    _getHardwareUuid() {
        try {
            switch (this.platform) {
                case 'darwin':
                    return this._getMacHardwareUuid();
                case 'win32':
                    return this._getWindowsHardwareUuid();
                case 'linux':
                    return this._getLinuxMachineId();
                default:
                    return null;
            }
        } catch (e) {
            console.error('Failed to get hardware UUID:', e.message);
            return null;
        }
    }

    /**
     * macOS: Get Hardware UUID from system_profiler
     */
    _getMacHardwareUuid() {
        try {
            const output = execSync('system_profiler SPHardwareDataType', {
                encoding: 'utf8',
                timeout: 5000
            });

            const match = output.match(/Hardware UUID:\s*(.+)/);
            if (match) {
                return match[1].trim();
            }

            // Fallback: try ioreg
            const ioregOutput = execSync('ioreg -rd1 -c IOPlatformExpertDevice', {
                encoding: 'utf8',
                timeout: 5000
            });

            const ioMatch = ioregOutput.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
            if (ioMatch) {
                return ioMatch[1];
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Windows: Get BIOS UUID from wmic
     */
    _getWindowsHardwareUuid() {
        try {
            const output = execSync('wmic csproduct get uuid', {
                encoding: 'utf8',
                timeout: 5000
            });

            const lines = output.split('\n').filter(l => l.trim());
            if (lines.length > 1) {
                return lines[1].trim();
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Linux: Get machine-id
     */
    _getLinuxMachineId() {
        const paths = [
            '/etc/machine-id',
            '/var/lib/dbus/machine-id'
        ];

        for (const p of paths) {
            try {
                if (fs.existsSync(p)) {
                    return fs.readFileSync(p, 'utf8').trim();
                }
            } catch (e) {
                continue;
            }
        }

        return null;
    }

    /**
     * Get detailed hardware info (for debugging/display)
     */
    getDetails() {
        return {
            fingerprint: this.getFingerprint(),
            platform: this.platform,
            arch: os.arch(),
            hostname: os.hostname(),
            username: os.userInfo().username,
            cpuModel: os.cpus()[0]?.model || 'unknown',
            cpuCount: os.cpus().length,
            totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
            nodeVersion: process.version
        };
    }

    /**
     * Get a shorter version of the fingerprint (for display)
     */
    getShortId() {
        const full = this.getFingerprint();
        return full.substring(0, 8);
    }

    /**
     * Generate a machine-friendly name based on hardware
     */
    getMachineName() {
        const hostname = os.hostname().toLowerCase();

        // Known machines in David's fleet
        if (hostname.includes('m3') || hostname.includes('genesis')) return 'M3Pro-Genesis';
        if (hostname.includes('m4') || hostname.includes('max')) return 'M4Max-Beast';
        if (hostname.includes('m1') || hostname.includes('air')) return 'M1Air';
        if (hostname.includes('msi') || hostname.includes('vector')) return 'MSI-Vector';
        if (hostname.includes('kali')) return 'Kali-Dragon';
        if (hostname.includes('aws') || hostname.includes('ip-')) return 'AWS-Cloud';

        // Generic name
        return hostname.substring(0, 15);
    }

    /**
     * Get local IP address
     */
    getLocalIP() {
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

    /**
     * Check if this is a known trusted machine
     */
    isTrustedMachine() {
        const name = this.getMachineName();
        const trusted = ['M3Pro-Genesis', 'M4Max-Beast', 'M1Air', 'MSI-Vector', 'Kali-Dragon'];
        return trusted.includes(name);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

// Singleton instance
const hardwareId = new HardwareId();

module.exports = {
    HardwareId,
    hardwareId,

    // Convenience exports
    getFingerprint: () => hardwareId.getFingerprint(),
    getShortId: () => hardwareId.getShortId(),
    getMachineName: () => hardwareId.getMachineName(),
    getLocalIP: () => hardwareId.getLocalIP(),
    getDetails: () => hardwareId.getDetails(),
    isTrustedMachine: () => hardwareId.isTrustedMachine()
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI TEST
// ═══════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    console.log('\n🔐 RANGERBLOCK HARDWARE ID TEST\n');
    console.log('================================');

    const details = hardwareId.getDetails();

    console.log(`Platform:     ${details.platform}`);
    console.log(`Arch:         ${details.arch}`);
    console.log(`Hostname:     ${details.hostname}`);
    console.log(`Username:     ${details.username}`);
    console.log(`CPU:          ${details.cpuModel}`);
    console.log(`CPU Cores:    ${details.cpuCount}`);
    console.log(`Memory:       ${details.totalMemory}`);
    console.log(`Node:         ${details.nodeVersion}`);
    console.log('--------------------------------');
    console.log(`Machine Name: ${hardwareId.getMachineName()}`);
    console.log(`Local IP:     ${hardwareId.getLocalIP()}`);
    console.log(`Trusted:      ${hardwareId.isTrustedMachine() ? 'YES ✅' : 'NO'}`);
    console.log('--------------------------------');
    console.log(`Short ID:     ${hardwareId.getShortId()}`);
    console.log(`Fingerprint:  ${details.fingerprint}`);
    console.log('================================\n');
}

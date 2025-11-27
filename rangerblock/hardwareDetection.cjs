#!/usr/bin/env node
/**
 * 🎖️ HARDWARE DETECTION SERVICE
 *
 * Detects Mac hardware UUID and machine type
 * Used for secure node identification
 *
 * Based on Genesis system - links blockchain account to hardware
 */

const { execSync } = require('child_process');
const crypto = require('crypto');

class HardwareDetection {
    /**
     * Detect Mac hardware serial/UUID
     * Works on M1, M2, M3, M4
     *
     * Returns: "12345678-ABCD-1234-EFGH-123456789ABC"
     */
    detectMacHardwareSerial() {
        try {
            const output = execSync('system_profiler SPHardwareDataType', { encoding: 'utf8' });

            // Extract Hardware UUID
            const match = output.match(/Hardware UUID:\s*(.+)/);
            if (match && match[1]) {
                return match[1].trim();
            }

            return null;
        } catch (error) {
            console.error('Failed to detect Mac hardware serial:', error.message);
            return null;
        }
    }

    /**
     * Get machine type (M1, M2, M3, M4)
     */
    getMachineType() {
        try {
            const output = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' });

            if (output.includes('M1')) return 'M1';
            if (output.includes('M2')) return 'M2';
            if (output.includes('M3')) return 'M3';
            if (output.includes('M4')) return 'M4';

            return 'Unknown';
        } catch (error) {
            return 'Unknown';
        }
    }

    /**
     * Get computer name (e.g., "M3Pro", "M1Air", "M4Max")
     */
    getComputerName() {
        try {
            const output = execSync('scutil --get ComputerName', { encoding: 'utf8' });
            return output.trim();
        } catch (error) {
            return 'RangerNode';
        }
    }

    /**
     * Get local IP address
     */
    getLocalIPAddress() {
        try {
            const output = execSync('ipconfig getifaddr en0', { encoding: 'utf8' });
            return output.trim();
        } catch (error) {
            // Try en1 if en0 fails
            try {
                const output = execSync('ipconfig getifaddr en1', { encoding: 'utf8' });
                return output.trim();
            } catch (error2) {
                return '127.0.0.1';
            }
        }
    }

    /**
     * Generate node ID from hardware UUID
     * Format: "M3Pro-Genesis" or "M1Air-Bob"
     */
    generateNodeName() {
        const computerName = this.getComputerName();
        const machineType = this.getMachineType();

        // If computer name already includes machine type, use as-is
        if (computerName.includes(machineType)) {
            return computerName;
        }

        // Otherwise combine: M3Pro, M1Air, M4Max, etc.
        return `${machineType}-${computerName}`;
    }

    /**
     * Create binding hash (for Genesis compatibility)
     * Links hardware UUID to node ID for security
     */
    createBindingHash(hardwareSerial, nodeId) {
        return crypto
            .createHash('sha256')
            .update(hardwareSerial + nodeId)
            .digest('hex');
    }

    /**
     * Get all hardware info
     */
    getHardwareInfo() {
        const serial = this.detectMacHardwareSerial();
        const machineType = this.getMachineType();
        const computerName = this.getComputerName();
        const nodeName = this.generateNodeName();
        const ipAddress = this.getLocalIPAddress();

        return {
            hardwareSerial: serial,
            machineType: machineType,
            computerName: computerName,
            nodeName: nodeName,
            ipAddress: ipAddress,
            detected: !!serial
        };
    }

    /**
     * Test hardware detection (for debugging)
     */
    test() {
        console.log('🔍 Testing Hardware Detection...\n');

        const info = this.getHardwareInfo();

        console.log('Hardware Serial:', info.hardwareSerial || 'NOT DETECTED');
        console.log('Machine Type:', info.machineType);
        console.log('Computer Name:', info.computerName);
        console.log('Generated Node Name:', info.nodeName);
        console.log('Local IP:', info.ipAddress);
        console.log('Detection Status:', info.detected ? '✅ SUCCESS' : '❌ FAILED');

        if (info.detected) {
            const bindingHash = this.createBindingHash(info.hardwareSerial, info.nodeName);
            console.log('\nBinding Hash:', bindingHash.substring(0, 16) + '...');
        }

        console.log('\n🎖️ Hardware detection ready!');
    }
}

// Export singleton
const hardwareDetection = new HardwareDetection();

// Run test if executed directly
if (require.main === module) {
    hardwareDetection.test();
}

module.exports = hardwareDetection;

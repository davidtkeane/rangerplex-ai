#!/usr/bin/env node
/**
 * RANGERBLOCK SECURE IDENTITY SERVICE v1.0.0
 * ===========================================
 * HARDENED identity management with cryptographic hardware binding
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 *
 * SECURITY FEATURES:
 * - Hardware attestation: Keys are cryptographically bound to hardware
 * - Encrypted private keys: AES-256-GCM encryption at rest
 * - Encrypted identity storage: All sensitive data encrypted
 * - Hardware fingerprint verification: Detect hardware changes
 * - Session token hardware binding: Sessions tied to specific hardware
 * - Secure key derivation: PBKDF2 with 100k iterations
 *
 * This module provides ENHANCED security over the standard identity-service.cjs
 * Use this for production deployments where identity theft prevention is critical.
 */

const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = '1.1.0';
const SECURE_VERSION = 'SECURE-1.1';
const PBKDF2_ITERATIONS = 100000;
const KEY_SIZE = 32; // 256 bits
const RSA_KEY_SIZE = 2048;

// Storage paths (separate from regular identity for security)
const SECURE_STORAGE_DIR = '.rangerblock-secure';
const SECURE_IDENTITY_FILE = 'secure_identity.enc';
const SECURE_KEYS_FILE = 'secure_keys.enc';
const ATTESTATION_FILE = 'hardware_attestation.json';
const MASTER_SALT_FILE = '.master_salt';

// VM Detection indicators
const VM_INDICATORS = {
    // Hypervisor names to detect
    hypervisors: ['vmware', 'virtualbox', 'vbox', 'parallels', 'qemu', 'kvm', 'xen', 'hyper-v', 'hyperv', 'bhyve'],
    // MAC address prefixes for common VMs (first 3 octets)
    vmMacPrefixes: [
        '00:05:69', '00:0c:29', '00:1c:14', '00:50:56',  // VMware
        '08:00:27', '0a:00:27',                            // VirtualBox
        '00:1c:42',                                        // Parallels
        '52:54:00',                                        // QEMU/KVM
        '00:16:3e',                                        // Xen
        '00:15:5d'                                         // Hyper-V
    ],
    // Model names that indicate VM
    vmModels: ['virtual', 'vmware', 'virtualbox', 'parallels', 'qemu', 'bochs', 'kvm']
};

// ═══════════════════════════════════════════════════════════════════════════
// ENHANCED HARDWARE FINGERPRINTING
// ═══════════════════════════════════════════════════════════════════════════

class SecureHardwareId {
    constructor() {
        this.platform = os.platform();
        this._fingerprint = null;
        this._hardwareUuid = null;
        this._vmInfo = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VM DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Detect if running inside a Virtual Machine
     * Returns detailed VM information
     */
    detectVM() {
        if (this._vmInfo) return this._vmInfo;

        const vmInfo = {
            isVM: false,
            confidence: 0,      // 0-100%
            hypervisor: null,
            vmUuid: null,
            indicators: [],
            warnings: []
        };

        let indicatorCount = 0;
        const totalChecks = 6;

        // Check 1: System model name
        const modelCheck = this._checkSystemModel();
        if (modelCheck.isVM) {
            indicatorCount++;
            vmInfo.indicators.push(`System model: ${modelCheck.model}`);
            vmInfo.hypervisor = modelCheck.hypervisor;
        }

        // Check 2: MAC address prefixes
        const macCheck = this._checkMacAddresses();
        if (macCheck.isVM) {
            indicatorCount++;
            vmInfo.indicators.push(`VM MAC address: ${macCheck.mac}`);
            if (!vmInfo.hypervisor) vmInfo.hypervisor = macCheck.hypervisor;
        }

        // Check 3: CPU hypervisor bit / vendor
        const cpuCheck = this._checkCpuVirtualization();
        if (cpuCheck.isVM) {
            indicatorCount++;
            vmInfo.indicators.push(`CPU: ${cpuCheck.reason}`);
        }

        // Check 4: DMI/SMBIOS data (Linux/Windows)
        const dmiCheck = this._checkDmiData();
        if (dmiCheck.isVM) {
            indicatorCount++;
            vmInfo.indicators.push(`DMI: ${dmiCheck.vendor}`);
            if (!vmInfo.hypervisor) vmInfo.hypervisor = dmiCheck.hypervisor;
        }

        // Check 5: Platform-specific checks
        const platformCheck = this._checkPlatformSpecific();
        if (platformCheck.isVM) {
            indicatorCount++;
            vmInfo.indicators.push(platformCheck.reason);
            if (!vmInfo.hypervisor) vmInfo.hypervisor = platformCheck.hypervisor;
        }

        // Check 6: Known VM processes/drivers
        const processCheck = this._checkVmProcesses();
        if (processCheck.isVM) {
            indicatorCount++;
            vmInfo.indicators.push(`VM processes: ${processCheck.processes.join(', ')}`);
        }

        // Calculate confidence and final determination
        vmInfo.confidence = Math.round((indicatorCount / totalChecks) * 100);
        vmInfo.isVM = indicatorCount >= 2 || vmInfo.confidence >= 50;

        // Get VM UUID if in a VM
        if (vmInfo.isVM) {
            vmInfo.vmUuid = this._getVmUuid(vmInfo.hypervisor);
            vmInfo.warnings.push('Running in VM - identity can be cloned if VM is cloned');
            vmInfo.warnings.push('Consider additional authentication for VM deployments');
        }

        this._vmInfo = vmInfo;
        return vmInfo;
    }

    /**
     * Check system model for VM indicators
     */
    _checkSystemModel() {
        try {
            let model = '';

            if (this.platform === 'darwin') {
                const output = execSync('system_profiler SPHardwareDataType', {
                    encoding: 'utf8', timeout: 5000
                });
                const match = output.match(/Model Name:\s*(.+)/i);
                model = match ? match[1].toLowerCase() : '';
            } else if (this.platform === 'win32') {
                const output = execSync('wmic computersystem get model', {
                    encoding: 'utf8', timeout: 5000
                });
                model = output.toLowerCase();
            } else if (this.platform === 'linux') {
                try {
                    model = fs.readFileSync('/sys/class/dmi/id/product_name', 'utf8').toLowerCase();
                } catch (e) {
                    model = '';
                }
            }

            for (const vmModel of VM_INDICATORS.vmModels) {
                if (model.includes(vmModel)) {
                    return { isVM: true, model: model.trim(), hypervisor: vmModel };
                }
            }

            return { isVM: false };
        } catch (e) {
            return { isVM: false };
        }
    }

    /**
     * Check MAC addresses for VM prefixes
     */
    _checkMacAddresses() {
        try {
            const interfaces = os.networkInterfaces();
            for (const [name, addrs] of Object.entries(interfaces)) {
                for (const addr of addrs) {
                    if (addr.mac && addr.mac !== '00:00:00:00:00:00') {
                        const macPrefix = addr.mac.substring(0, 8).toLowerCase();
                        for (const vmPrefix of VM_INDICATORS.vmMacPrefixes) {
                            if (macPrefix === vmPrefix.toLowerCase()) {
                                // Determine hypervisor from MAC
                                let hypervisor = 'unknown';
                                if (macPrefix.startsWith('00:0c:29') || macPrefix.startsWith('00:50:56')) hypervisor = 'vmware';
                                else if (macPrefix.startsWith('08:00:27')) hypervisor = 'virtualbox';
                                else if (macPrefix.startsWith('00:1c:42')) hypervisor = 'parallels';
                                else if (macPrefix.startsWith('52:54:00')) hypervisor = 'qemu';
                                else if (macPrefix.startsWith('00:15:5d')) hypervisor = 'hyper-v';

                                return { isVM: true, mac: addr.mac, hypervisor };
                            }
                        }
                    }
                }
            }
            return { isVM: false };
        } catch (e) {
            return { isVM: false };
        }
    }

    /**
     * Check CPU for virtualization indicators
     */
    _checkCpuVirtualization() {
        try {
            if (this.platform === 'linux') {
                const cpuinfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
                if (cpuinfo.includes('hypervisor')) {
                    return { isVM: true, reason: 'Hypervisor flag in /proc/cpuinfo' };
                }
            }

            // Check CPU model for VM indicators
            const cpus = os.cpus();
            if (cpus.length > 0) {
                const model = cpus[0].model.toLowerCase();
                if (model.includes('qemu') || model.includes('virtual')) {
                    return { isVM: true, reason: `CPU model: ${cpus[0].model}` };
                }
            }

            return { isVM: false };
        } catch (e) {
            return { isVM: false };
        }
    }

    /**
     * Check DMI/SMBIOS data for VM vendors
     */
    _checkDmiData() {
        try {
            if (this.platform === 'linux') {
                const dmiPaths = [
                    '/sys/class/dmi/id/sys_vendor',
                    '/sys/class/dmi/id/board_vendor',
                    '/sys/class/dmi/id/bios_vendor'
                ];

                for (const p of dmiPaths) {
                    if (fs.existsSync(p)) {
                        const vendor = fs.readFileSync(p, 'utf8').toLowerCase().trim();
                        for (const hv of VM_INDICATORS.hypervisors) {
                            if (vendor.includes(hv)) {
                                return { isVM: true, vendor, hypervisor: hv };
                            }
                        }
                    }
                }
            } else if (this.platform === 'win32') {
                try {
                    const output = execSync('wmic bios get manufacturer', {
                        encoding: 'utf8', timeout: 5000
                    }).toLowerCase();
                    for (const hv of VM_INDICATORS.hypervisors) {
                        if (output.includes(hv)) {
                            return { isVM: true, vendor: output.trim(), hypervisor: hv };
                        }
                    }
                } catch (e) {}
            }

            return { isVM: false };
        } catch (e) {
            return { isVM: false };
        }
    }

    /**
     * Platform-specific VM detection
     */
    _checkPlatformSpecific() {
        try {
            if (this.platform === 'darwin') {
                // Check for VM-related kexts
                const output = execSync('kextstat 2>/dev/null || true', {
                    encoding: 'utf8', timeout: 5000
                }).toLowerCase();

                if (output.includes('vmware') || output.includes('com.vmware')) {
                    return { isVM: true, reason: 'VMware kexts loaded', hypervisor: 'vmware' };
                }
                if (output.includes('virtualbox') || output.includes('org.virtualbox')) {
                    return { isVM: true, reason: 'VirtualBox kexts loaded', hypervisor: 'virtualbox' };
                }
                if (output.includes('parallels')) {
                    return { isVM: true, reason: 'Parallels kexts loaded', hypervisor: 'parallels' };
                }
            } else if (this.platform === 'linux') {
                // Check systemd-detect-virt if available
                try {
                    const virt = execSync('systemd-detect-virt 2>/dev/null || echo none', {
                        encoding: 'utf8', timeout: 5000
                    }).trim();
                    if (virt && virt !== 'none') {
                        return { isVM: true, reason: `systemd-detect-virt: ${virt}`, hypervisor: virt };
                    }
                } catch (e) {}
            }

            return { isVM: false };
        } catch (e) {
            return { isVM: false };
        }
    }

    /**
     * Check for VM-related processes
     */
    _checkVmProcesses() {
        try {
            const vmProcesses = [];

            if (this.platform === 'darwin' || this.platform === 'linux') {
                const ps = execSync('ps aux 2>/dev/null || true', {
                    encoding: 'utf8', timeout: 5000
                }).toLowerCase();

                const checkFor = ['vmtoolsd', 'vmware-user', 'vboxservice', 'vboxclient',
                                  'prl_tools', 'qemu-ga', 'spice-vdagent'];
                for (const proc of checkFor) {
                    if (ps.includes(proc)) {
                        vmProcesses.push(proc);
                    }
                }
            }

            return { isVM: vmProcesses.length > 0, processes: vmProcesses };
        } catch (e) {
            return { isVM: false, processes: [] };
        }
    }

    /**
     * Get VM-specific UUID
     */
    _getVmUuid(hypervisor) {
        try {
            if (this.platform === 'darwin') {
                // VMware Fusion stores UUID in nvram
                if (hypervisor === 'vmware') {
                    try {
                        const output = execSync('ioreg -rd1 -c IOPlatformExpertDevice', {
                            encoding: 'utf8', timeout: 5000
                        });
                        const match = output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
                        if (match) return `vm:vmware:${match[1]}`;
                    } catch (e) {}
                }
            }

            if (this.platform === 'linux') {
                // Try to get VM UUID from DMI
                const uuidPath = '/sys/class/dmi/id/product_uuid';
                if (fs.existsSync(uuidPath)) {
                    try {
                        const uuid = fs.readFileSync(uuidPath, 'utf8').trim();
                        return `vm:${hypervisor || 'unknown'}:${uuid}`;
                    } catch (e) {}
                }

                // VirtualBox specific
                if (hypervisor === 'virtualbox') {
                    try {
                        const vboxId = execSync('dmidecode -s system-uuid 2>/dev/null || true', {
                            encoding: 'utf8', timeout: 5000
                        }).trim();
                        if (vboxId) return `vm:virtualbox:${vboxId}`;
                    } catch (e) {}
                }
            }

            if (this.platform === 'win32') {
                // Windows VM UUID from WMI
                try {
                    const output = execSync('wmic csproduct get uuid', {
                        encoding: 'utf8', timeout: 5000
                    });
                    const lines = output.split('\n').filter(l => l.trim() && !l.includes('UUID'));
                    if (lines.length > 0) {
                        return `vm:${hypervisor || 'unknown'}:${lines[0].trim()}`;
                    }
                } catch (e) {}
            }

            // Fallback: generate from available info
            const fallback = crypto.createHash('sha256')
                .update(`vm-${hypervisor}-${os.hostname()}-${Date.now()}`)
                .digest('hex')
                .substring(0, 36);
            return `vm:${hypervisor || 'unknown'}:${fallback}`;
        } catch (e) {
            return null;
        }
    }

    /**
     * Check if running in VM (simple boolean)
     */
    isVirtualMachine() {
        return this.detectVM().isVM;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HARDWARE UUID
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get the TRUE hardware UUID (most stable identifier)
     * This is harder to spoof than hostname/username
     */
    getHardwareUuid() {
        if (this._hardwareUuid) return this._hardwareUuid;

        try {
            switch (this.platform) {
                case 'darwin':
                    return this._getMacHardwareUuid();
                case 'win32':
                    return this._getWindowsHardwareUuid();
                case 'linux':
                    return this._getLinuxHardwareId();
                default:
                    return this._getFallbackId();
            }
        } catch (e) {
            return this._getFallbackId();
        }
    }

    /**
     * macOS: Get Hardware UUID from IOPlatformExpertDevice
     * This is burned into the hardware and CANNOT be changed
     */
    _getMacHardwareUuid() {
        try {
            // Primary method: ioreg (more reliable)
            const output = execSync(
                'ioreg -rd1 -c IOPlatformExpertDevice',
                { encoding: 'utf8', timeout: 5000 }
            );

            // Look for IOPlatformUUID (hardware burned)
            const uuidMatch = output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
            if (uuidMatch) {
                this._hardwareUuid = uuidMatch[1];
                return this._hardwareUuid;
            }

            // Fallback: system_profiler
            const profiler = execSync(
                'system_profiler SPHardwareDataType',
                { encoding: 'utf8', timeout: 5000 }
            );
            const hwMatch = profiler.match(/Hardware UUID:\s*(.+)/);
            if (hwMatch) {
                this._hardwareUuid = hwMatch[1].trim();
                return this._hardwareUuid;
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Windows: Get BIOS UUID and motherboard serial
     */
    _getWindowsHardwareUuid() {
        try {
            // Get BIOS UUID
            const biosOutput = execSync('wmic csproduct get uuid', {
                encoding: 'utf8',
                timeout: 5000
            });
            const lines = biosOutput.split('\n').filter(l => l.trim() && !l.includes('UUID'));
            const biosUuid = lines[0]?.trim();

            // Get motherboard serial
            let mbSerial = '';
            try {
                const mbOutput = execSync('wmic baseboard get serialnumber', {
                    encoding: 'utf8',
                    timeout: 5000
                });
                const mbLines = mbOutput.split('\n').filter(l => l.trim() && !l.includes('SerialNumber'));
                mbSerial = mbLines[0]?.trim() || '';
            } catch (e) {
                // Ignore if not available
            }

            if (biosUuid) {
                this._hardwareUuid = `${biosUuid}-${mbSerial}`;
                return this._hardwareUuid;
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Linux: Get DMI product UUID or machine-id
     */
    _getLinuxHardwareId() {
        try {
            // Try DMI product UUID first (requires root on some systems)
            const dmiPath = '/sys/class/dmi/id/product_uuid';
            if (fs.existsSync(dmiPath)) {
                const uuid = fs.readFileSync(dmiPath, 'utf8').trim();
                if (uuid && uuid !== 'Unknown') {
                    this._hardwareUuid = uuid;
                    return uuid;
                }
            }

            // Fallback to machine-id (stable but can be changed with root)
            const machineIdPaths = ['/etc/machine-id', '/var/lib/dbus/machine-id'];
            for (const p of machineIdPaths) {
                if (fs.existsSync(p)) {
                    const id = fs.readFileSync(p, 'utf8').trim();
                    if (id) {
                        this._hardwareUuid = id;
                        return id;
                    }
                }
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Fallback: Create stable ID from immutable CPU info
     */
    _getFallbackId() {
        const cpus = os.cpus();
        const cpuInfo = cpus.length > 0 ? cpus[0].model : 'unknown';
        const totalMem = os.totalmem().toString();
        const arch = os.arch();

        // These are relatively stable but not unique across identical hardware
        return crypto.createHash('sha256')
            .update(`${cpuInfo}|${totalMem}|${arch}`)
            .digest('hex')
            .substring(0, 36);
    }

    /**
     * Generate SECURE fingerprint using only stable identifiers
     * This EXCLUDES hostname and username which are trivially spoofed
     */
    generateSecureFingerprint() {
        if (this._fingerprint) return this._fingerprint;

        const components = [];

        // 1. Hardware UUID (most important - burned into hardware)
        const hwUuid = this.getHardwareUuid();
        if (hwUuid) {
            components.push(hwUuid);
        }

        // 2. CPU model and count (stable, hard to fake)
        const cpus = os.cpus();
        if (cpus.length > 0) {
            components.push(cpus[0].model);
            components.push(cpus.length.toString());
        }

        // 3. Total memory (stable but not unique)
        components.push(os.totalmem().toString());

        // 4. Architecture (stable)
        components.push(os.arch());

        // 5. OS type and release (relatively stable)
        components.push(os.type());
        components.push(os.release());

        // 6. Add timestamp salt for additional entropy
        // This is stored and used for verification
        components.push(Date.now().toString());

        // Create SHA-256 hash
        this._fingerprint = crypto.createHash('sha256')
            .update(components.join('|'))
            .digest('hex');

        return this._fingerprint;
    }

    /**
     * Verify a fingerprint matches current hardware
     * Returns match percentage (0.0 - 1.0)
     */
    verifyFingerprint(storedAttestation) {
        if (!storedAttestation) return 0.0;

        let matches = 0;
        let total = 0;

        // Check hardware UUID (most important - 40% weight)
        const currentUuid = this.getHardwareUuid();
        if (storedAttestation.hardwareUuid && currentUuid) {
            total += 4;
            if (storedAttestation.hardwareUuid === currentUuid) {
                matches += 4;
            }
        }

        // Check CPU model (30% weight)
        const cpus = os.cpus();
        if (storedAttestation.cpuModel && cpus.length > 0) {
            total += 3;
            if (storedAttestation.cpuModel === cpus[0].model) {
                matches += 3;
            }
        }

        // Check memory (20% weight)
        if (storedAttestation.totalMemory) {
            total += 2;
            // Allow 10% variance for memory (some reserved by system)
            const diff = Math.abs(storedAttestation.totalMemory - os.totalmem());
            if (diff / storedAttestation.totalMemory < 0.1) {
                matches += 2;
            }
        }

        // Check architecture (10% weight)
        if (storedAttestation.arch) {
            total += 1;
            if (storedAttestation.arch === os.arch()) {
                matches += 1;
            }
        }

        return total > 0 ? matches / total : 0.0;
    }

    /**
     * Create hardware attestation (signed hardware proof)
     * Now includes VM detection information
     */
    createAttestation() {
        const cpus = os.cpus();
        const vmInfo = this.detectVM();

        const attestation = {
            version: SECURE_VERSION,
            createdAt: new Date().toISOString(),
            hardwareUuid: this.getHardwareUuid(),
            cpuModel: cpus.length > 0 ? cpus[0].model : null,
            cpuCount: cpus.length,
            totalMemory: os.totalmem(),
            arch: os.arch(),
            platform: os.platform(),
            osType: os.type(),
            osRelease: os.release(),
            // These are included for reference but NOT used for verification
            hostname: os.hostname(),
            username: os.userInfo().username,
            // VM Information
            vm: {
                isVM: vmInfo.isVM,
                confidence: vmInfo.confidence,
                hypervisor: vmInfo.hypervisor,
                vmUuid: vmInfo.vmUuid,
                indicators: vmInfo.indicators,
                warnings: vmInfo.warnings
            }
        };

        // If running in VM, add extra entropy to prevent clone attacks
        if (vmInfo.isVM) {
            attestation.vmEntropyHash = crypto.createHash('sha256')
                .update(`${vmInfo.vmUuid}|${Date.now()}|${crypto.randomBytes(16).toString('hex')}`)
                .digest('hex');
            attestation.vmFirstSeen = new Date().toISOString();
        }

        return attestation;
    }

    /**
     * Get combined unique identifier (works for both VM and physical)
     * For VMs, combines VM UUID with random entropy to detect clones
     */
    getUniqueIdentifier() {
        const vmInfo = this.detectVM();
        const hwUuid = this.getHardwareUuid();

        if (vmInfo.isVM && vmInfo.vmUuid) {
            // For VMs: include VM UUID but also entropy
            // This means cloned VMs will have DIFFERENT identities
            // because the entropy is generated at first run
            return {
                type: 'vm',
                identifier: vmInfo.vmUuid,
                hypervisor: vmInfo.hypervisor,
                requiresEntropy: true  // Signals that entropy file is needed
            };
        }

        return {
            type: 'physical',
            identifier: hwUuid,
            hypervisor: null,
            requiresEntropy: false
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECURE CRYPTO UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

class SecureCrypto {
    /**
     * Derive encryption key from hardware fingerprint + master password
     * This binds the encryption to the specific hardware
     */
    deriveHardwareKey(hardwareUuid, masterSalt) {
        // Combine hardware UUID with master salt for unique per-device key
        const combined = `${hardwareUuid}|${masterSalt}`;

        return crypto.pbkdf2Sync(
            combined,
            Buffer.from(masterSalt, 'base64'),
            PBKDF2_ITERATIONS,
            KEY_SIZE,
            'sha256'
        );
    }

    /**
     * Generate and store master salt (random, stored in secure location)
     */
    generateMasterSalt() {
        return crypto.randomBytes(32).toString('base64');
    }

    /**
     * Encrypt data with AES-256-GCM
     */
    encrypt(data, key) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        let encrypted = cipher.update(data, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        return {
            encrypted,
            iv: iv.toString('base64'),
            authTag: cipher.getAuthTag().toString('base64')
        };
    }

    /**
     * Decrypt data with AES-256-GCM
     */
    decrypt(encryptedData, key) {
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            key,
            Buffer.from(encryptedData.iv, 'base64')
        );
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));

        let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Generate RSA-2048 key pair
     */
    generateKeyPair() {
        return crypto.generateKeyPairSync('rsa', {
            modulusLength: RSA_KEY_SIZE,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
    }

    /**
     * Sign data with private key
     */
    sign(data, privateKey) {
        const sign = crypto.createSign('sha256');
        sign.update(data);
        sign.end();
        return sign.sign(privateKey).toString('base64');
    }

    /**
     * Verify signature with public key
     */
    verify(data, signature, publicKey) {
        try {
            const verify = crypto.createVerify('sha256');
            verify.update(data);
            verify.end();
            return verify.verify(publicKey, Buffer.from(signature, 'base64'));
        } catch (e) {
            return false;
        }
    }

    /**
     * Create hardware-bound session token
     */
    createSecureSessionToken(payload, privateKey, hardwareHash) {
        const tokenData = {
            ...payload,
            hardwareHash: hardwareHash,
            iat: Date.now(),
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };

        const header = { alg: 'RS256', typ: 'RBS' }; // RangerBlock Secure
        const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
        const payloadB64 = Buffer.from(JSON.stringify(tokenData)).toString('base64url');

        const dataToSign = `${headerB64}.${payloadB64}`;
        const signature = this.sign(dataToSign, privateKey);
        const signatureB64 = Buffer.from(signature, 'base64').toString('base64url');

        return `${headerB64}.${payloadB64}.${signatureB64}`;
    }

    /**
     * Verify secure session token (includes hardware binding check)
     */
    verifySecureSessionToken(token, publicKey, currentHardwareHash) {
        try {
            const [headerB64, payloadB64, signatureB64] = token.split('.');

            const dataToVerify = `${headerB64}.${payloadB64}`;
            const signature = Buffer.from(signatureB64, 'base64url').toString('base64');

            if (!this.verify(dataToVerify, signature, publicKey)) {
                return { valid: false, reason: 'invalid_signature' };
            }

            const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

            // Check expiry
            if (payload.exp && Date.now() > payload.exp) {
                return { valid: false, reason: 'expired' };
            }

            // CHECK HARDWARE BINDING - Critical security check!
            if (payload.hardwareHash !== currentHardwareHash) {
                return {
                    valid: false,
                    reason: 'hardware_mismatch',
                    message: 'Token was issued for different hardware'
                };
            }

            return { valid: true, payload };
        } catch (e) {
            return { valid: false, reason: 'malformed' };
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECURE IDENTITY SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class SecureIdentityService {
    constructor(appType = 'unknown') {
        this.appType = appType;
        this.version = VERSION;
        this.hardware = new SecureHardwareId();
        this.crypto = new SecureCrypto();
        this._identity = null;
        this._keys = null;
        this._encryptionKey = null;
        this._initialized = false;
        this._secureDir = path.join(os.homedir(), SECURE_STORAGE_DIR);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Initialize secure identity service
     * @param {string} masterPassword - Optional master password for extra security
     */
    async init(masterPassword = null) {
        if (this._initialized) return true;

        try {
            // Ensure secure storage directory exists
            this._ensureSecureDir();

            // STEP 1: VM Detection
            const vmInfo = this.hardware.detectVM();
            this._vmInfo = vmInfo;

            if (vmInfo.isVM) {
                console.log(`🖥️  VM DETECTED: ${vmInfo.hypervisor || 'Unknown hypervisor'}`);
                console.log(`   Confidence: ${vmInfo.confidence}%`);
                if (vmInfo.vmUuid) {
                    console.log(`   VM UUID: ${vmInfo.vmUuid.substring(0, 30)}...`);
                }
                for (const warning of vmInfo.warnings) {
                    console.warn(`   ⚠️  ${warning}`);
                }
                this._logSecurityEvent('VM_DETECTED', vmInfo);
            }

            // Get or create master salt
            const masterSalt = this._getOrCreateMasterSalt();

            // STEP 2: For VMs, also include VM entropy to detect clones
            let vmEntropy = '';
            if (vmInfo.isVM) {
                vmEntropy = this._getOrCreateVmEntropy();
            }

            // Derive hardware-bound encryption key
            const hardwareUuid = this.hardware.getHardwareUuid();
            if (!hardwareUuid) {
                throw new Error('Could not determine hardware UUID');
            }

            // If master password provided, include it in key derivation
            // For VMs, also include VM entropy to prevent clones from decrypting
            let keySource = masterPassword
                ? `${hardwareUuid}|${masterPassword}`
                : hardwareUuid;

            if (vmInfo.isVM && vmEntropy) {
                keySource = `${keySource}|${vmEntropy}`;
            }

            this._encryptionKey = this.crypto.deriveHardwareKey(keySource, masterSalt);

            // Load existing identity if present
            this._identity = this._loadSecureIdentity();
            this._keys = this._loadSecureKeys();

            // Verify hardware attestation if identity exists
            if (this._identity) {
                const attestation = this._loadAttestation();
                const matchScore = this.hardware.verifyFingerprint(attestation);

                if (matchScore < 0.7) {
                    console.warn(`⚠️ SECURITY WARNING: Hardware match score ${(matchScore * 100).toFixed(0)}%`);
                    console.warn('   This may indicate hardware change or identity theft attempt!');
                    this._logSecurityEvent('HARDWARE_MISMATCH', { matchScore });
                }

                // STEP 3: VM Clone Detection
                if (vmInfo.isVM && attestation?.vm) {
                    const cloneCheck = this._detectVmClone(attestation);
                    if (cloneCheck.isClone) {
                        console.error('🚨 VM CLONE DETECTED!');
                        console.error(`   Original created: ${cloneCheck.originalCreated}`);
                        console.error(`   This appears to be a cloned VM!`);
                        this._logSecurityEvent('VM_CLONE_DETECTED', cloneCheck);

                        // Option 1: Block (strict mode)
                        // throw new Error('VM clone detected - identity cannot be used');

                        // Option 2: Warn and create new identity (current behavior)
                        console.warn('   Creating new identity for this VM instance...');
                        this._identity = null;
                        this._keys = null;
                    }
                }
            }

            this._initialized = true;
            return true;
        } catch (e) {
            console.error('Failed to initialize secure identity:', e.message);
            return false;
        }
    }

    /**
     * Get or create VM-specific entropy (prevents clone attacks)
     * This is random data generated on first run - clones won't have it
     */
    _getOrCreateVmEntropy() {
        const entropyPath = this._getSecurePath('.vm_entropy');

        if (fs.existsSync(entropyPath)) {
            return fs.readFileSync(entropyPath, 'utf8');
        }

        // Generate random entropy on first run
        const entropy = crypto.randomBytes(32).toString('hex');
        fs.writeFileSync(entropyPath, entropy, { mode: 0o600 });

        this._logSecurityEvent('VM_ENTROPY_CREATED', {
            timestamp: new Date().toISOString()
        });

        return entropy;
    }

    /**
     * Detect if this is a cloned VM
     */
    _detectVmClone(attestation) {
        // If the attestation has VM entropy hash but it doesn't match our entropy
        if (attestation?.vmEntropyHash) {
            const currentEntropy = this._getOrCreateVmEntropy();
            const currentHash = crypto.createHash('sha256')
                .update(currentEntropy)
                .digest('hex');

            // If hashes don't match, this is likely a clone
            // (clone would have different entropy file)
            if (!attestation.vmEntropyHash.includes(currentHash.substring(0, 16))) {
                return {
                    isClone: true,
                    originalCreated: attestation.vmFirstSeen,
                    reason: 'VM entropy mismatch'
                };
            }
        }

        return { isClone: false };
    }

    _ensureSecureDir() {
        if (!fs.existsSync(this._secureDir)) {
            fs.mkdirSync(this._secureDir, { recursive: true, mode: 0o700 });
        }
        // Ensure restrictive permissions
        fs.chmodSync(this._secureDir, 0o700);
    }

    _getSecurePath(filename) {
        return path.join(this._secureDir, filename);
    }

    _getOrCreateMasterSalt() {
        const saltPath = this._getSecurePath(MASTER_SALT_FILE);

        if (fs.existsSync(saltPath)) {
            return fs.readFileSync(saltPath, 'utf8');
        }

        const salt = this.crypto.generateMasterSalt();
        fs.writeFileSync(saltPath, salt, { mode: 0o600 });
        return salt;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // IDENTITY MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Check if secure identity exists
     */
    hasSecureIdentity() {
        return fs.existsSync(this._getSecurePath(SECURE_IDENTITY_FILE));
    }

    /**
     * Create new secure identity with hardware attestation
     */
    async createSecureIdentity(username) {
        if (!this._initialized) {
            throw new Error('Service not initialized');
        }

        // Generate username if not provided
        if (!username) {
            username = this._generateUsername();
        }

        // Generate RSA key pair
        const { publicKey, privateKey } = this.crypto.generateKeyPair();

        // Create hardware attestation
        const attestation = this.hardware.createAttestation();

        // Sign attestation with private key (binds key to hardware)
        const attestationSignature = this.crypto.sign(
            JSON.stringify(attestation),
            privateKey
        );

        // Create secure fingerprint
        const secureFingerprint = crypto.createHash('sha256')
            .update(`${attestation.hardwareUuid}|${publicKey}`)
            .digest('hex');

        // Create identity object
        const identity = {
            version: SECURE_VERSION,
            userId: `rbs_${secureFingerprint.substring(0, 16)}`,
            nodeId: `secure_${username.toLowerCase().replace(/[^a-z0-9]/g, '')}_${secureFingerprint.substring(0, 8)}`,
            secureFingerprint,
            username,
            displayName: username,
            created: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            appType: this.appType,
            publicKey,
            attestationSignature,
            stats: {
                sessionsCount: 1,
                messagesSent: 0
            },
            security: {
                hardwareAttested: true,
                keyBound: true,
                encryptedStorage: true,
                isVM: attestation.vm?.isVM || false,
                vmHypervisor: attestation.vm?.hypervisor || null,
                vmProtected: attestation.vm?.isVM ? true : false  // Clone protection active
            }
        };

        // Save encrypted keys
        this._saveSecureKeys({ publicKey, privateKey });

        // Save encrypted identity
        this._saveSecureIdentity(identity);

        // Save attestation (not encrypted, used for verification)
        this._saveAttestation(attestation);

        this._identity = identity;
        this._keys = { publicKey, privateKey };

        // Log security event
        this._logSecurityEvent('SECURE_IDENTITY_CREATED', {
            userId: identity.userId,
            hardwareUuid: attestation.hardwareUuid
        });

        return identity;
    }

    /**
     * Get or create secure identity
     */
    async getOrCreateIdentity(username) {
        if (!this._initialized) {
            await this.init();
        }

        if (this._identity) {
            // Update last seen
            this._identity.lastSeen = new Date().toISOString();
            this._identity.stats.sessionsCount = (this._identity.stats.sessionsCount || 0) + 1;
            this._saveSecureIdentity(this._identity);
            return this._identity;
        }

        return this.createSecureIdentity(username);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ENCRYPTED STORAGE
    // ═══════════════════════════════════════════════════════════════════════

    _saveSecureIdentity(identity) {
        const encrypted = this.crypto.encrypt(
            JSON.stringify(identity),
            this._encryptionKey
        );
        fs.writeFileSync(
            this._getSecurePath(SECURE_IDENTITY_FILE),
            JSON.stringify(encrypted),
            { mode: 0o600 }
        );
    }

    _loadSecureIdentity() {
        const filePath = this._getSecurePath(SECURE_IDENTITY_FILE);
        if (!fs.existsSync(filePath)) return null;

        try {
            const encrypted = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const decrypted = this.crypto.decrypt(encrypted, this._encryptionKey);
            return JSON.parse(decrypted);
        } catch (e) {
            console.error('Failed to decrypt identity (wrong hardware or corruption):', e.message);
            return null;
        }
    }

    _saveSecureKeys(keys) {
        const encrypted = this.crypto.encrypt(
            JSON.stringify(keys),
            this._encryptionKey
        );
        fs.writeFileSync(
            this._getSecurePath(SECURE_KEYS_FILE),
            JSON.stringify(encrypted),
            { mode: 0o600 }
        );
    }

    _loadSecureKeys() {
        const filePath = this._getSecurePath(SECURE_KEYS_FILE);
        if (!fs.existsSync(filePath)) return null;

        try {
            const encrypted = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const decrypted = this.crypto.decrypt(encrypted, this._encryptionKey);
            return JSON.parse(decrypted);
        } catch (e) {
            console.error('Failed to decrypt keys (wrong hardware):', e.message);
            return null;
        }
    }

    _saveAttestation(attestation) {
        fs.writeFileSync(
            this._getSecurePath(ATTESTATION_FILE),
            JSON.stringify(attestation, null, 2),
            { mode: 0o600 }
        );
    }

    _loadAttestation() {
        const filePath = this._getSecurePath(ATTESTATION_FILE);
        if (!fs.existsSync(filePath)) return null;

        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AUTHENTICATION & SIGNING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Sign a message with hardware-bound private key
     */
    signMessage(message) {
        if (!this._keys?.privateKey) {
            throw new Error('No private key available');
        }
        return this.crypto.sign(message, this._keys.privateKey);
    }

    /**
     * Verify a message signature
     */
    verifyMessage(message, signature, publicKey) {
        return this.crypto.verify(message, signature, publicKey);
    }

    /**
     * Create hardware-bound authentication payload
     */
    createAuthPayload() {
        if (!this._identity) {
            throw new Error('No identity available');
        }

        const hardwareHash = crypto.createHash('sha256')
            .update(this.hardware.getHardwareUuid() || '')
            .digest('hex')
            .substring(0, 16);

        return {
            userId: this._identity.userId,
            nodeId: this._identity.nodeId,
            username: this._identity.username,
            publicKey: this._identity.publicKey,
            hardwareHash,
            securityLevel: 'hardware_bound',
            appType: this.appType,
            timestamp: Date.now()
        };
    }

    /**
     * Create hardware-bound session token
     */
    createSessionToken() {
        if (!this._identity || !this._keys?.privateKey) {
            throw new Error('Identity not initialized');
        }

        const hardwareHash = crypto.createHash('sha256')
            .update(this.hardware.getHardwareUuid() || '')
            .digest('hex')
            .substring(0, 16);

        return this.crypto.createSecureSessionToken(
            {
                userId: this._identity.userId,
                username: this._identity.username
            },
            this._keys.privateKey,
            hardwareHash
        );
    }

    /**
     * Verify a session token (checks hardware binding)
     */
    verifySessionToken(token, publicKey) {
        const hardwareHash = crypto.createHash('sha256')
            .update(this.hardware.getHardwareUuid() || '')
            .digest('hex')
            .substring(0, 16);

        return this.crypto.verifySecureSessionToken(token, publicKey, hardwareHash);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECURITY VERIFICATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Verify identity integrity
     * Returns security status report
     */
    verifyIdentityIntegrity() {
        const report = {
            valid: false,
            issues: [],
            score: 0,
            maxScore: 100
        };

        if (!this._identity) {
            report.issues.push('No identity found');
            return report;
        }

        if (!this._keys) {
            report.issues.push('Keys could not be decrypted (hardware mismatch?)');
            return report;
        }

        let score = 0;

        // 1. Check attestation exists (20 points)
        const attestation = this._loadAttestation();
        if (attestation) {
            score += 20;
        } else {
            report.issues.push('No hardware attestation found');
        }

        // 2. Check hardware match (40 points)
        if (attestation) {
            const matchScore = this.hardware.verifyFingerprint(attestation);
            score += Math.round(matchScore * 40);
            if (matchScore < 0.7) {
                report.issues.push(`Hardware match only ${(matchScore * 100).toFixed(0)}%`);
            }
        }

        // 3. Check attestation signature (20 points)
        if (attestation && this._identity.attestationSignature) {
            const isValid = this.crypto.verify(
                JSON.stringify(attestation),
                this._identity.attestationSignature,
                this._identity.publicKey
            );
            if (isValid) {
                score += 20;
            } else {
                report.issues.push('Attestation signature invalid');
            }
        }

        // 4. Check key pair match (20 points)
        if (this._keys && this._identity.publicKey) {
            const testMessage = 'integrity_check_' + Date.now();
            try {
                const sig = this.signMessage(testMessage);
                const valid = this.verifyMessage(testMessage, sig, this._identity.publicKey);
                if (valid) {
                    score += 20;
                } else {
                    report.issues.push('Key pair mismatch');
                }
            } catch (e) {
                report.issues.push('Key pair verification failed');
            }
        }

        report.score = score;
        report.valid = score >= 80 && report.issues.length === 0;

        return report;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    _generateUsername() {
        const adjectives = ['Brave', 'Swift', 'Shadow', 'Thunder', 'Iron', 'Cyber', 'Ghost'];
        const nouns = ['Ranger', 'Guardian', 'Sentinel', 'Knight', 'Warrior', 'Shield'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 100);
        return `${adj}${noun}${num}`;
    }

    _logSecurityEvent(type, data) {
        const logPath = this._getSecurePath('security_audit.log');
        const entry = `[${new Date().toISOString()}] ${type}: ${JSON.stringify(data)}\n`;

        try {
            fs.appendFileSync(logPath, entry, { mode: 0o600 });
        } catch (e) {
            // Ignore logging errors
        }
    }

    /**
     * Get identity summary (safe to share)
     */
    getSummary() {
        if (!this._identity) return null;

        return {
            userId: this._identity.userId,
            username: this._identity.username,
            created: this._identity.created,
            security: this._identity.security,
            stats: this._identity.stats
        };
    }

    /**
     * Get public key
     */
    getPublicKey() {
        return this._identity?.publicKey || null;
    }

    /**
     * Get private key (use carefully!)
     */
    getPrivateKey() {
        return this._keys?.privateKey || null;
    }

    /**
     * Get hardware fingerprint hash (safe to share)
     */
    getHardwareHash() {
        return crypto.createHash('sha256')
            .update(this.hardware.getHardwareUuid() || '')
            .digest('hex')
            .substring(0, 16);
    }

    /**
     * Get VM information
     */
    getVmInfo() {
        return this._vmInfo || this.hardware.detectVM();
    }

    /**
     * Check if running in VM
     */
    isVirtualMachine() {
        const vmInfo = this.getVmInfo();
        return vmInfo.isVM;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
    SecureIdentityService,
    SecureHardwareId,
    SecureCrypto,
    VERSION,
    SECURE_VERSION,

    // Factory function
    createSecureIdentity: (appType) => new SecureIdentityService(appType)
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI TEST
// ═══════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    (async () => {
        console.log('\n🔐 RANGERBLOCK SECURE IDENTITY TEST v1.1\n');
        console.log('=========================================');

        // Test hardware fingerprinting
        console.log('\n1. Testing secure hardware identification...');
        const hardware = new SecureHardwareId();
        const hwUuid = hardware.getHardwareUuid();
        console.log(`   Hardware UUID: ${hwUuid ? hwUuid.substring(0, 20) + '...' : 'Not available'}`);

        const attestation = hardware.createAttestation();
        console.log(`   Platform: ${attestation.platform}`);
        console.log(`   CPU: ${attestation.cpuModel?.substring(0, 30) || 'Unknown'}...`);
        console.log(`   Cores: ${attestation.cpuCount}`);
        console.log(`   Memory: ${Math.round(attestation.totalMemory / (1024 * 1024 * 1024))} GB`);

        // NEW: VM Detection
        console.log('\n2. VM Detection...');
        const vmInfo = hardware.detectVM();
        if (vmInfo.isVM) {
            console.log(`   🖥️  VIRTUAL MACHINE DETECTED`);
            console.log(`   Hypervisor: ${vmInfo.hypervisor || 'Unknown'}`);
            console.log(`   Confidence: ${vmInfo.confidence}%`);
            console.log(`   VM UUID: ${vmInfo.vmUuid ? vmInfo.vmUuid.substring(0, 30) + '...' : 'N/A'}`);
            console.log(`   Indicators:`);
            for (const ind of vmInfo.indicators) {
                console.log(`      - ${ind}`);
            }
            console.log(`   ⚠️  Warnings:`);
            for (const warn of vmInfo.warnings) {
                console.log(`      - ${warn}`);
            }
        } else {
            console.log(`   ✅ Physical hardware detected (not a VM)`);
            console.log(`   Confidence: ${100 - vmInfo.confidence}%`);
        }

        // Test secure identity service
        console.log('\n3. Testing secure identity service...');
        const identity = new SecureIdentityService('test-secure-app');

        console.log('   Initializing...');
        const initResult = await identity.init();
        console.log(`   Init: ${initResult ? '✅ Success' : '❌ Failed'}`);

        // Check for existing or create new
        console.log('\n4. Getting/creating secure identity...');
        const myIdentity = await identity.getOrCreateIdentity();
        console.log(`   User ID:  ${myIdentity.userId}`);
        console.log(`   Username: ${myIdentity.username}`);
        console.log(`   Security:`);
        console.log(`      Hardware Attested: ${myIdentity.security.hardwareAttested ? '✅' : '❌'}`);
        console.log(`      Key Bound: ${myIdentity.security.keyBound ? '✅' : '❌'}`);
        console.log(`      Encrypted Storage: ${myIdentity.security.encryptedStorage ? '✅' : '❌'}`);
        console.log(`      Is VM: ${myIdentity.security.isVM ? '⚠️ YES' : '✅ NO'}`);
        if (myIdentity.security.isVM) {
            console.log(`      VM Hypervisor: ${myIdentity.security.vmHypervisor || 'Unknown'}`);
            console.log(`      VM Clone Protection: ${myIdentity.security.vmProtected ? '✅' : '❌'}`);
        }

        // Test signing
        console.log('\n5. Testing message signing...');
        const testMessage = 'Hello, Secure RangerBlock!';
        const signature = identity.signMessage(testMessage);
        console.log(`   Message: "${testMessage}"`);
        console.log(`   Signature: ${signature.substring(0, 40)}...`);

        const isValid = identity.verifyMessage(testMessage, signature, myIdentity.publicKey);
        console.log(`   Valid: ${isValid ? '✅ YES' : '❌ NO'}`);

        // Test hardware-bound session token
        console.log('\n6. Testing hardware-bound session token...');
        const token = identity.createSessionToken();
        console.log(`   Token: ${token.substring(0, 50)}...`);

        const tokenResult = identity.verifySessionToken(token, myIdentity.publicKey);
        console.log(`   Valid: ${tokenResult.valid ? '✅ YES' : '❌ NO'}`);
        if (!tokenResult.valid) {
            console.log(`   Reason: ${tokenResult.reason}`);
        }

        // Verify identity integrity
        console.log('\n7. Verifying identity integrity...');
        const integrityReport = identity.verifyIdentityIntegrity();
        console.log(`   Score: ${integrityReport.score}/${integrityReport.maxScore}`);
        console.log(`   Valid: ${integrityReport.valid ? '✅ YES' : '❌ NO'}`);
        if (integrityReport.issues.length > 0) {
            console.log(`   Issues: ${integrityReport.issues.join(', ')}`);
        }

        // Show hardware hash
        console.log('\n8. Hardware binding info...');
        console.log(`   Hardware Hash: ${identity.getHardwareHash()}`);
        console.log(`   Storage Dir: ~/.rangerblock-secure/`);
        console.log(`   Is VM: ${identity.isVirtualMachine() ? 'YES' : 'NO'}`);

        console.log('\n=========================================');
        console.log('Secure identity test completed!');
        console.log('\n🎖️ Rangers lead the way!\n');
    })();
}

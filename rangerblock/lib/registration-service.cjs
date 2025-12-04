#!/usr/bin/env node
/**
 * RANGERBLOCK REGISTRATION SERVICE v1.0.0
 * ========================================
 * Creates registration blocks combining identity + consent
 * Submits to relay for admin approval queue
 *
 * Features:
 * - Registration block creation
 * - Submission to relay server
 * - Status tracking (pending/approved/denied/revoked)
 * - Admin notification integration
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const WebSocket = require('ws');

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = '1.0.0';

// Storage paths
const RANGERBLOCK_DIR = path.join(os.homedir(), '.rangerblock');
const REGISTRATION_DIR = path.join(RANGERBLOCK_DIR, 'registration');

// Registration statuses
const STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    DENIED: 'denied',
    REVOKED: 'revoked'
};

// Default relay
const DEFAULT_RELAY_HOST = '44.222.101.125';
const DEFAULT_RELAY_PORT = 5555;

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRATION SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class RegistrationService {
    constructor(identityService = null, consentService = null) {
        this.identity = identityService;
        this.consent = consentService;
        this.version = VERSION;
        this._initialized = false;
        this._registration = null;
        this._callbacks = {
            onApproved: null,
            onDenied: null,
            onStatusChange: null
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Initialize the registration service
     */
    init() {
        if (this._initialized) return true;

        try {
            // Create registration directory
            if (!fs.existsSync(REGISTRATION_DIR)) {
                fs.mkdirSync(REGISTRATION_DIR, { recursive: true });
            }

            // Load existing registration if present
            this._registration = this._loadRegistration();
            this._initialized = true;
            return true;
        } catch (e) {
            console.error('Failed to initialize registration service:', e.message);
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REGISTRATION BLOCK CREATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Create a registration block
     * @param {object} identityData - User identity
     * @param {object} consentData - Consent acceptance record
     * @returns {object} Registration block
     */
    createRegistrationBlock(identityData, consentData) {
        if (!identityData || !identityData.userId) {
            throw new Error('Identity required for registration');
        }

        if (!consentData || !consentData.termsVersion) {
            throw new Error('Consent required for registration');
        }

        const timestamp = new Date().toISOString();
        const blockId = `reg_${crypto.randomBytes(16).toString('hex')}`;

        // Create registration block (compatible with both P2P chain and Solidity)
        const registrationBlock = {
            // Block identification
            blockType: 'USER_REGISTRATION',
            blockId: blockId,
            version: this.version,

            // Identity (hashed for privacy on public chain)
            identity: {
                userIdHash: this._hashString(identityData.userId),
                publicKeyHash: this._hashString(identityData.publicKey || ''),
                hardwareIdHash: this._hashString(identityData.hardwareFingerprint || ''),
                username: identityData.username || 'Anonymous',
                appType: identityData.appType || 'unknown'
            },

            // Full identity (for admin, not broadcast publicly)
            identityPrivate: {
                userId: identityData.userId,
                nodeId: identityData.nodeId
            },

            // Consent record
            consent: {
                termsVersion: consentData.termsVersion,
                termsHash: consentData.termsHash,
                acceptedAt: consentData.acceptedAt,
                ageConfirmed: consentData.ageConfirmed || true,
                signature: consentData.signature
            },

            // Block metadata
            metadata: {
                createdAt: timestamp,
                submittedAt: null,
                previousHash: null,
                nonce: Math.floor(Math.random() * 1000000)
            },

            // Status (updated by admin)
            status: {
                current: STATUS.PENDING,
                updatedAt: null,
                updatedBy: null,
                reason: null
            },

            // Platform info
            platform: {
                os: os.platform(),
                arch: os.arch(),
                hostname: os.hostname(),
                nodeVersion: process.version
            }
        };

        // Calculate block hash
        registrationBlock.blockHash = this._calculateBlockHash(registrationBlock);

        return registrationBlock;
    }

    /**
     * Calculate block hash for verification
     */
    _calculateBlockHash(block) {
        const dataToHash = JSON.stringify({
            identity: block.identity,
            consent: block.consent,
            metadata: {
                createdAt: block.metadata.createdAt,
                nonce: block.metadata.nonce
            }
        });

        return crypto.createHash('sha256').update(dataToHash).digest('hex');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUBMISSION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Submit registration to relay server
     * @param {object} registrationBlock - Registration block to submit
     * @param {string} relayHost - Relay server host
     * @param {number} relayPort - Relay server port
     * @returns {Promise<object>} Submission result
     */
    async submitRegistration(registrationBlock, relayHost = DEFAULT_RELAY_HOST, relayPort = DEFAULT_RELAY_PORT) {
        return new Promise((resolve, reject) => {
            const wsUrl = `ws://${relayHost}:${relayPort}`;

            try {
                const ws = new WebSocket(wsUrl);
                let resolved = false;

                const timeout = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        ws.close();
                        reject(new Error('Registration submission timeout'));
                    }
                }, 30000);

                ws.on('open', () => {
                    // Update submission timestamp
                    registrationBlock.metadata.submittedAt = new Date().toISOString();

                    // Send registration
                    ws.send(JSON.stringify({
                        type: 'registration_submit',
                        payload: registrationBlock
                    }));
                });

                ws.on('message', (data) => {
                    try {
                        const msg = JSON.parse(data.toString());

                        if (msg.type === 'registration_received' || msg.type === 'registration_queued') {
                            clearTimeout(timeout);
                            resolved = true;

                            // Save registration locally
                            this._registration = registrationBlock;
                            this._saveRegistration();

                            ws.close();
                            resolve({
                                success: true,
                                blockId: registrationBlock.blockId,
                                status: STATUS.PENDING,
                                message: 'Registration submitted, pending admin approval'
                            });
                        } else if (msg.type === 'registration_error') {
                            clearTimeout(timeout);
                            resolved = true;
                            ws.close();
                            reject(new Error(msg.error || 'Registration failed'));
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                });

                ws.on('error', (err) => {
                    if (!resolved) {
                        clearTimeout(timeout);
                        resolved = true;
                        reject(new Error(`WebSocket error: ${err.message}`));
                    }
                });

                ws.on('close', () => {
                    if (!resolved) {
                        clearTimeout(timeout);
                        resolved = true;

                        // Save locally even if relay didn't confirm
                        this._registration = registrationBlock;
                        this._saveRegistration();

                        resolve({
                            success: true,
                            blockId: registrationBlock.blockId,
                            status: STATUS.PENDING,
                            message: 'Registration saved locally, will sync when relay available'
                        });
                    }
                });

            } catch (e) {
                reject(e);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STATUS CHECKING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Check if user is registered
     */
    isRegistered() {
        this.init();
        return !!this._registration;
    }

    /**
     * Get current registration status
     */
    getStatus() {
        this.init();

        if (!this._registration) {
            return null;
        }

        return this._registration.status.current;
    }

    /**
     * Check if registration is approved
     */
    isApproved() {
        return this.getStatus() === STATUS.APPROVED;
    }

    /**
     * Check if registration is pending
     */
    isPending() {
        return this.getStatus() === STATUS.PENDING;
    }

    /**
     * Check if registration is denied
     */
    isDenied() {
        return this.getStatus() === STATUS.DENIED;
    }

    /**
     * Get registration block
     */
    getRegistration() {
        this.init();
        return this._registration;
    }

    /**
     * Get registration summary
     */
    getSummary() {
        this.init();

        if (!this._registration) {
            return {
                registered: false,
                status: null,
                username: null,
                registeredAt: null
            };
        }

        return {
            registered: true,
            status: this._registration.status.current,
            username: this._registration.identity.username,
            appType: this._registration.identity.appType,
            registeredAt: this._registration.metadata.createdAt,
            submittedAt: this._registration.metadata.submittedAt,
            approvedAt: this._registration.status.current === STATUS.APPROVED
                ? this._registration.status.updatedAt : null
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STATUS UPDATES (called by relay notifications)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Update registration status (called when admin approves/denies)
     */
    updateStatus(newStatus, updatedBy = null, reason = null) {
        this.init();

        if (!this._registration) {
            throw new Error('No registration to update');
        }

        const oldStatus = this._registration.status.current;

        this._registration.status = {
            current: newStatus,
            updatedAt: new Date().toISOString(),
            updatedBy: updatedBy,
            reason: reason,
            previousStatus: oldStatus
        };

        this._saveRegistration();

        // Trigger callbacks
        if (newStatus === STATUS.APPROVED && this._callbacks.onApproved) {
            this._callbacks.onApproved(this._registration);
        } else if (newStatus === STATUS.DENIED && this._callbacks.onDenied) {
            this._callbacks.onDenied(this._registration, reason);
        }

        if (this._callbacks.onStatusChange) {
            this._callbacks.onStatusChange(oldStatus, newStatus, this._registration);
        }

        return this._registration;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CALLBACKS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Set callback for when registration is approved
     */
    onApproved(callback) {
        this._callbacks.onApproved = callback;
    }

    /**
     * Set callback for when registration is denied
     */
    onDenied(callback) {
        this._callbacks.onDenied = callback;
    }

    /**
     * Set callback for any status change
     */
    onStatusChange(callback) {
        this._callbacks.onStatusChange = callback;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PRIVILEGE CHECKING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Check if user can perform action based on registration status
     */
    canPerformAction(action) {
        const status = this.getStatus();

        const PERMISSIONS = {
            [STATUS.APPROVED]: ['chat', 'voice', 'video', 'files', 'dm', 'channels', 'view', '*'],
            [STATUS.PENDING]: ['view', 'exit'], // View only while pending
            [STATUS.DENIED]: ['exit'],
            [STATUS.REVOKED]: ['exit'],
            null: ['register', 'exit'] // Not registered yet
        };

        const allowed = PERMISSIONS[status] || [];
        return allowed.includes(action) || allowed.includes('*');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STORAGE
    // ═══════════════════════════════════════════════════════════════════════

    _loadRegistration() {
        const regFile = path.join(REGISTRATION_DIR, 'registration.json');

        try {
            if (fs.existsSync(regFile)) {
                return JSON.parse(fs.readFileSync(regFile, 'utf8'));
            }
        } catch (e) {
            console.error('Error loading registration:', e.message);
        }

        return null;
    }

    _saveRegistration() {
        const regFile = path.join(REGISTRATION_DIR, 'registration.json');

        try {
            fs.writeFileSync(regFile, JSON.stringify(this._registration, null, 2));
        } catch (e) {
            console.error('Error saving registration:', e.message);
        }
    }

    _hashString(str) {
        return crypto.createHash('sha256').update(str || '').digest('hex');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SOLIDITY-COMPATIBLE BLOCK FORMAT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert registration block to Solidity-compatible format
 * For use with RangerRegistration.sol contract
 */
function toSolidityFormat(registrationBlock) {
    return {
        userIdHash: '0x' + registrationBlock.identity.userIdHash,
        publicKeyHash: '0x' + registrationBlock.identity.publicKeyHash,
        hardwareIdHash: '0x' + registrationBlock.identity.hardwareIdHash,
        username: registrationBlock.identity.username,
        appType: registrationBlock.identity.appType,
        termsVersion: registrationBlock.consent.termsVersion,
        termsHash: '0x' + registrationBlock.consent.termsHash,
        signature: registrationBlock.consent.signature
            ? '0x' + Buffer.from(registrationBlock.consent.signature, 'base64').toString('hex')
            : '0x'
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

// Create singleton instance
const registrationService = new RegistrationService();

module.exports = {
    RegistrationService,
    registrationService,
    toSolidityFormat,
    STATUS,
    VERSION
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI MODE
// ═══════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    const c = {
        reset: '\x1b[0m',
        bold: '\x1b[1m',
        dim: '\x1b[2m',
        cyan: '\x1b[36m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        red: '\x1b[31m',
        brightGreen: '\x1b[92m',
        brightCyan: '\x1b[96m',
    };

    console.log(`
${c.brightCyan}╔════════════════════════════════════════════════════════════╗
║         ${c.yellow}RANGERBLOCK${c.brightCyan} - Registration Service Test          ║
╚════════════════════════════════════════════════════════════╝${c.reset}
`);

    registrationService.init();

    const summary = registrationService.getSummary();

    console.log(`${c.dim}Service Version:${c.reset} ${registrationService.version}`);
    console.log(`${c.dim}Registered:${c.reset} ${summary.registered ? c.brightGreen + 'Yes' : c.yellow + 'No'}${c.reset}`);

    if (summary.registered) {
        console.log(`${c.dim}Status:${c.reset} ${summary.status}`);
        console.log(`${c.dim}Username:${c.reset} ${summary.username}`);
        console.log(`${c.dim}App Type:${c.reset} ${summary.appType}`);
        console.log(`${c.dim}Registered At:${c.reset} ${summary.registeredAt}`);

        const statusColor = {
            'approved': c.brightGreen,
            'pending': c.yellow,
            'denied': c.red,
            'revoked': c.red
        };

        console.log(`\n${c.dim}Can Chat:${c.reset} ${registrationService.canPerformAction('chat') ? c.brightGreen + 'Yes' : c.red + 'No'}${c.reset}`);
        console.log(`${c.dim}Can Voice:${c.reset} ${registrationService.canPerformAction('voice') ? c.brightGreen + 'Yes' : c.red + 'No'}${c.reset}`);
    } else {
        console.log(`\n${c.yellow}No registration found. User needs to accept terms and register.${c.reset}`);
    }

    console.log(`\n${c.brightGreen}Rangers lead the way!${c.reset}\n`);
}

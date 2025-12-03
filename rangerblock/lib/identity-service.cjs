#!/usr/bin/env node
/**
 * RANGERBLOCK IDENTITY SERVICE v1.0.0
 * =====================================
 * Unified identity management for all RangerBlock apps
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 *
 * Features:
 * - Hardware-bound identity (unique per device)
 * - RSA-2048 key pairs for signing/encryption
 * - Cross-app identity sharing
 * - On-chain registration support
 * - App sync (ranger-chat-lite ↔ RangerPlex)
 */

const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { hardwareId, getFingerprint, getMachineName, getLocalIP } = require('./hardware-id.cjs');
const { cryptoUtils, generateKeyPair, sign, verify, generateChallenge, signChallenge } = require('./crypto-utils.cjs');
const { storage, init: initStorage, STORAGE_PATHS } = require('./storage-utils.cjs');

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = '1.1.0';
const APP_TYPE_CHAT_LITE = 'ranger-chat-lite';
const APP_TYPE_RANGERPLEX = 'rangerplex';
const APP_TYPE_JUST_CHAT = 'just-chat';
const APP_TYPE_VOICE_CHAT = 'voice-chat';

// Adjectives and nouns for random username generation
const ADJECTIVES = [
    'Brave', 'Swift', 'Silent', 'Shadow', 'Storm', 'Thunder', 'Iron', 'Steel',
    'Golden', 'Silver', 'Crimson', 'Azure', 'Emerald', 'Phantom', 'Ghost',
    'Night', 'Dawn', 'Frost', 'Fire', 'Lightning', 'Mystic', 'Cyber', 'Digital'
];

const NOUNS = [
    'Ranger', 'Wolf', 'Eagle', 'Hawk', 'Tiger', 'Lion', 'Dragon', 'Phoenix',
    'Knight', 'Warrior', 'Guardian', 'Sentinel', 'Hunter', 'Blade', 'Arrow',
    'Storm', 'Shield', 'Fist', 'Hammer', 'Falcon', 'Viper', 'Cobra', 'Raven'
];

// ═══════════════════════════════════════════════════════════════════════════
// IDENTITY SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class IdentityService {
    constructor(appType = 'unknown') {
        this.appType = appType;
        this.version = VERSION;
        this._identity = null;
        this._keys = null;
        this._initialized = false;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Initialize the identity service
     */
    async init() {
        if (this._initialized) return true;

        try {
            // Initialize storage
            initStorage();

            // Load existing identity if present
            this._identity = storage.loadMasterIdentity();
            this._keys = this._loadKeys();

            this._initialized = true;
            return true;
        } catch (e) {
            console.error('Failed to initialize identity service:', e.message);
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // IDENTITY MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Check if identity exists
     */
    hasIdentity() {
        return storage.hasMasterIdentity();
    }

    /**
     * Get or create identity
     * @param {string} username - Optional username (will generate if not provided)
     * @returns {object} Identity object
     */
    async getOrCreateIdentity(username) {
        await this.init();

        // Check for existing identity
        if (this._identity) {
            // Update last seen
            this._identity.lastSeen = new Date().toISOString();
            this._identity.sessionsCount = (this._identity.sessionsCount || 0) + 1;
            storage.saveMasterIdentity(this._identity);
            return this._identity;
        }

        // Create new identity
        return this._createIdentity(username);
    }

    /**
     * Create a new identity
     */
    _createIdentity(username) {
        const fingerprint = getFingerprint();
        const machineName = getMachineName();

        // Generate username if not provided
        if (!username) {
            username = this.generateRandomUsername();
        }

        // Generate RSA key pair
        const { publicKey, privateKey } = generateKeyPair();

        // Save keys
        this._saveKeys(privateKey, publicKey);

        // Create identity object
        const identity = {
            // Unique identifiers
            userId: `rb_${fingerprint.substring(0, 16)}`,
            nodeId: `rangerplex_${username.toLowerCase().replace(/[^a-z0-9]/g, '')}_${fingerprint.substring(0, 8)}`,
            hardwareFingerprint: fingerprint,

            // User info
            username: username,
            displayName: username,

            // Timestamps
            created: new Date().toISOString(),
            lastSeen: new Date().toISOString(),

            // Platform info
            platform: {
                system: os.platform(),
                arch: os.arch(),
                hostname: os.hostname(),
                machineName: machineName
            },

            // App info
            appType: this.appType,
            version: this.version,

            // Stats
            sessionsCount: 1,
            messagesSent: 0,

            // Crypto
            publicKey: publicKey,

            // Chain registration (will be filled when registered)
            chainRegistration: null
        };

        // Save identity
        storage.saveMasterIdentity(identity);
        storage.saveHardwareFingerprint(fingerprint);

        // Log security event
        storage.logSecurityEvent({
            type: 'IDENTITY_CREATED',
            userId: identity.userId,
            appType: this.appType,
            machineName: machineName
        });

        this._identity = identity;
        return identity;
    }

    /**
     * Load existing identity
     */
    loadIdentity() {
        return storage.loadMasterIdentity();
    }

    /**
     * Update username
     */
    updateUsername(newUsername) {
        if (!this._identity) {
            throw new Error('No identity to update');
        }

        const oldUsername = this._identity.username;
        this._identity.username = newUsername;
        this._identity.displayName = newUsername;
        this._identity.lastSeen = new Date().toISOString();

        storage.saveMasterIdentity(this._identity);

        // Log security event
        storage.logSecurityEvent({
            type: 'USERNAME_CHANGED',
            userId: this._identity.userId,
            oldUsername,
            newUsername
        });

        return this._identity;
    }

    /**
     * Record a message sent
     */
    recordMessage() {
        if (this._identity) {
            this._identity.messagesSent = (this._identity.messagesSent || 0) + 1;
            storage.saveMasterIdentity(this._identity);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // KEY MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Save key pair to storage
     */
    _saveKeys(privateKey, publicKey) {
        const keysDir = storage.getKeysPath();
        cryptoUtils.saveKeyPair(keysDir, privateKey, publicKey, 'master');
        this._keys = { privateKey, publicKey };
    }

    /**
     * Load key pair from storage
     */
    _loadKeys() {
        const keysDir = storage.getKeysPath();
        return cryptoUtils.loadKeyPair(keysDir, 'master');
    }

    /**
     * Get public key
     */
    getPublicKey() {
        if (!this._keys) {
            this._keys = this._loadKeys();
        }
        return this._keys?.publicKey || null;
    }

    /**
     * Get private key (use carefully!)
     */
    getPrivateKey() {
        if (!this._keys) {
            this._keys = this._loadKeys();
        }
        return this._keys?.privateKey || null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SIGNING & AUTHENTICATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Sign a message
     */
    signMessage(message) {
        const privateKey = this.getPrivateKey();
        if (!privateKey) {
            throw new Error('No private key available');
        }
        return sign(message, privateKey);
    }

    /**
     * Verify a message signature
     */
    verifyMessage(message, signature, publicKey) {
        return verify(message, signature, publicKey);
    }

    /**
     * Encrypt a message for a recipient (E2E)
     * Uses hybrid encryption: RSA encrypts AES key, AES encrypts message
     */
    encryptForRecipient(message, recipientPublicKey) {
        // Generate random AES key
        const aesKey = crypto.randomBytes(32);

        // Encrypt message with AES
        const encrypted = cryptoUtils.encryptAES(message, aesKey);

        // Encrypt AES key with recipient's RSA public key
        const encryptedKey = crypto.publicEncrypt(
            {
                key: recipientPublicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            aesKey
        ).toString('base64');

        return {
            encryptedMessage: encrypted,
            encryptedKey: encryptedKey,
            senderPublicKey: this.getPublicKey()
        };
    }

    /**
     * Decrypt a message sent to us (E2E)
     */
    decryptMessage(encryptedData) {
        const privateKey = this.getPrivateKey();
        if (!privateKey) {
            throw new Error('No private key available');
        }

        // Decrypt the AES key with our RSA private key
        const aesKey = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            Buffer.from(encryptedData.encryptedKey, 'base64')
        );

        // Decrypt the message with AES key
        return cryptoUtils.decryptAES(encryptedData.encryptedMessage, aesKey);
    }

    /**
     * Create authentication payload for server
     */
    createAuthPayload() {
        const identity = this.loadIdentity();
        if (!identity) {
            throw new Error('No identity available');
        }

        return {
            userId: identity.userId,
            nodeId: identity.nodeId,
            hardwareIdHash: cryptoUtils.hash(identity.hardwareFingerprint),
            publicKey: identity.publicKey,
            username: identity.username,
            appType: this.appType,
            timestamp: Date.now()
        };
    }

    /**
     * Sign an authentication challenge
     */
    signAuthChallenge(challenge) {
        return signChallenge(challenge, this.getPrivateKey());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHAIN REGISTRATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Create on-chain registration block
     */
    createRegistrationBlock() {
        const identity = this.loadIdentity();
        if (!identity) {
            throw new Error('No identity to register');
        }

        const registrationData = {
            type: 'IDENTITY_REGISTRATION',
            version: '1.0.0',
            payload: {
                publicKey: identity.publicKey,
                hardwareIdHash: cryptoUtils.hash(identity.hardwareFingerprint),
                username: identity.username,
                appOrigin: this.appType,
                capabilities: this._getCapabilities(),
                createdAt: identity.created,
                registeredAt: new Date().toISOString()
            }
        };

        // Sign the registration
        const signature = this.signMessage(JSON.stringify(registrationData.payload));
        registrationData.payload.signature = signature;

        return registrationData;
    }

    /**
     * Save chain registration proof
     */
    saveChainRegistration(blockInfo) {
        if (this._identity) {
            this._identity.chainRegistration = {
                blockHeight: blockInfo.blockHeight,
                blockHash: blockInfo.blockHash,
                registeredAt: new Date().toISOString()
            };
            storage.saveMasterIdentity(this._identity);
            storage.saveChainRegistration(blockInfo);
        }
    }

    /**
     * Check if registered on chain
     */
    isRegisteredOnChain() {
        const identity = this.loadIdentity();
        return identity?.chainRegistration != null;
    }

    /**
     * Get capabilities based on app type
     */
    _getCapabilities() {
        switch (this.appType) {
            case APP_TYPE_CHAT_LITE:
                return ['chat'];
            case APP_TYPE_JUST_CHAT:
                return ['chat'];
            case APP_TYPE_VOICE_CHAT:
                return ['chat', 'voice'];
            case APP_TYPE_RANGERPLEX:
                return ['chat', 'voice', 'files', 'blockchain', 'forensics'];
            default:
                return ['chat'];
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // USERNAME GENERATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Generate a random username
     */
    generateRandomUsername() {
        const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
        const num = Math.floor(Math.random() * 100);
        return `${adj}${noun}${num}`;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // APP SYNC
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Check for other RangerBlock apps
     */
    detectOtherApps() {
        return storage.detectInstalledApps();
    }

    /**
     * Sync with other apps
     */
    async syncWithApps() {
        const apps = this.detectOtherApps();
        const syncResults = [];

        for (const app of apps) {
            if (app.name !== this.appType) {
                try {
                    // Load settings from other app
                    const settings = storage.loadAppSettings(app.name);
                    if (settings) {
                        syncResults.push({
                            app: app.name,
                            synced: true,
                            settings: Object.keys(settings)
                        });
                    }
                } catch (e) {
                    syncResults.push({
                        app: app.name,
                        synced: false,
                        error: e.message
                    });
                }
            }
        }

        // Update sync state
        storage.saveSyncState({
            lastSync: new Date().toISOString(),
            apps: apps.map(a => a.name),
            results: syncResults
        });

        return syncResults;
    }

    /**
     * Export identity for backup
     */
    exportIdentity() {
        const identity = this.loadIdentity();
        if (!identity) {
            throw new Error('No identity to export');
        }

        return {
            identity: {
                userId: identity.userId,
                nodeId: identity.nodeId,
                username: identity.username,
                created: identity.created
            },
            stats: {
                messagesSent: identity.messagesSent,
                sessionsCount: identity.sessionsCount
            },
            chainRegistration: identity.chainRegistration,
            exportedAt: new Date().toISOString(),
            exportedFrom: this.appType
        };
    }

    /**
     * Reset identity (DANGEROUS - for testing)
     */
    resetIdentity() {
        this._identity = null;
        this._keys = null;
        storage.clearAll();
        initStorage();

        // Log security event
        storage.logSecurityEvent({
            type: 'IDENTITY_RESET',
            appType: this.appType
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get storage paths
     */
    getPaths() {
        return {
            base: storage.basePath,
            identity: storage.getIdentityPath(),
            keys: storage.getKeysPath(),
            app: storage.getAppPath(this.appType)
        };
    }

    /**
     * Get identity summary for display
     */
    getSummary() {
        const identity = this.loadIdentity();
        if (!identity) {
            return null;
        }

        return {
            userId: identity.userId,
            username: identity.username,
            machineName: identity.platform?.machineName || getMachineName(),
            created: identity.created,
            messagesSent: identity.messagesSent,
            sessionsCount: identity.sessionsCount,
            isOnChain: this.isRegisteredOnChain(),
            localIP: getLocalIP()
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create identity service for specific app
 */
function createIdentityService(appType) {
    return new IdentityService(appType);
}

// Pre-configured instances
const chatLiteIdentity = new IdentityService(APP_TYPE_CHAT_LITE);
const rangerplexIdentity = new IdentityService(APP_TYPE_RANGERPLEX);
const justChatIdentity = new IdentityService(APP_TYPE_JUST_CHAT);
const voiceChatIdentity = new IdentityService(APP_TYPE_VOICE_CHAT);

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
    IdentityService,
    createIdentityService,

    // Pre-configured instances
    chatLiteIdentity,
    rangerplexIdentity,
    justChatIdentity,
    voiceChatIdentity,

    // App type constants
    APP_TYPE_CHAT_LITE,
    APP_TYPE_RANGERPLEX,
    APP_TYPE_JUST_CHAT,
    APP_TYPE_VOICE_CHAT,

    // Version
    VERSION
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI TEST
// ═══════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    (async () => {
        console.log('\n🎖️ RANGERBLOCK IDENTITY SERVICE TEST\n');
        console.log('======================================');

        // Create service for testing
        const identity = createIdentityService('test-app');
        await identity.init();

        // Check for existing identity
        console.log('\n1. Checking for existing identity...');
        console.log(`   Has identity: ${identity.hasIdentity() ? 'YES' : 'NO'}`);

        // Get or create identity
        console.log('\n2. Getting/creating identity...');
        const myIdentity = await identity.getOrCreateIdentity();
        console.log(`   User ID:  ${myIdentity.userId}`);
        console.log(`   Node ID:  ${myIdentity.nodeId}`);
        console.log(`   Username: ${myIdentity.username}`);
        console.log(`   Machine:  ${myIdentity.platform.machineName}`);

        // Test signing
        console.log('\n3. Testing message signing...');
        const testMessage = 'Hello, RangerBlock!';
        const signature = identity.signMessage(testMessage);
        console.log(`   Message: "${testMessage}"`);
        console.log(`   Signature: ${signature.substring(0, 40)}...`);

        // Verify signature
        const isValid = identity.verifyMessage(testMessage, signature, myIdentity.publicKey);
        console.log(`   Valid: ${isValid ? '✅ YES' : '❌ NO'}`);

        // Create auth payload
        console.log('\n4. Creating auth payload...');
        const authPayload = identity.createAuthPayload();
        console.log(`   User ID: ${authPayload.userId}`);
        console.log(`   Has public key: ${authPayload.publicKey ? 'YES' : 'NO'}`);

        // Create registration block
        console.log('\n5. Creating chain registration block...');
        const regBlock = identity.createRegistrationBlock();
        console.log(`   Type: ${regBlock.type}`);
        console.log(`   Capabilities: ${regBlock.payload.capabilities.join(', ')}`);
        console.log(`   Signed: ${regBlock.payload.signature ? 'YES' : 'NO'}`);

        // Detect other apps
        console.log('\n6. Detecting other RangerBlock apps...');
        const apps = identity.detectOtherApps();
        if (apps.length > 0) {
            for (const app of apps) {
                console.log(`   - ${app.name}`);
            }
        } else {
            console.log('   No other apps detected');
        }

        // Get summary
        console.log('\n7. Identity summary:');
        const summary = identity.getSummary();
        console.log(`   Username: ${summary.username}`);
        console.log(`   Machine: ${summary.machineName}`);
        console.log(`   Messages: ${summary.messagesSent}`);
        console.log(`   Sessions: ${summary.sessionsCount}`);
        console.log(`   On-chain: ${summary.isOnChain ? 'YES' : 'NO'}`);
        console.log(`   Local IP: ${summary.localIP}`);

        // Get paths
        console.log('\n8. Storage paths:');
        const paths = identity.getPaths();
        console.log(`   Base:     ${paths.base}`);
        console.log(`   Identity: ${paths.identity}`);
        console.log(`   Keys:     ${paths.keys}`);

        // Test E2E encryption
        console.log('\n9. Testing E2E encryption...');
        const secretMessage = 'This is a secret message for testing E2E encryption!';
        const recipientPublicKey = myIdentity.publicKey; // Encrypting to ourselves for test

        try {
            const encrypted = identity.encryptForRecipient(secretMessage, recipientPublicKey);
            console.log(`   Original: "${secretMessage}"`);
            console.log(`   Encrypted key: ${encrypted.encryptedKey.substring(0, 40)}...`);
            console.log(`   Has sender key: ${encrypted.senderPublicKey ? 'YES' : 'NO'}`);

            // Decrypt
            const decrypted = identity.decryptMessage(encrypted);
            console.log(`   Decrypted: "${decrypted}"`);
            console.log(`   Match: ${decrypted === secretMessage ? '✅ YES' : '❌ NO'}`);
        } catch (e) {
            console.log(`   ❌ E2E encryption error: ${e.message}`);
        }

        console.log('\n======================================');
        console.log('Identity service test completed!\n');
        console.log('🎖️ Rangers lead the way!\n');
    })();
}

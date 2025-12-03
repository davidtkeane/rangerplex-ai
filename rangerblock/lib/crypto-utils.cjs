#!/usr/bin/env node
/**
 * RANGERBLOCK CRYPTO UTILITIES v1.0.0
 * ====================================
 * RSA-2048 key generation, signing, verification, and encryption
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 *
 * Features:
 * - RSA-2048 key pair generation
 * - Message signing and verification
 * - Challenge-response authentication
 * - AES-256-GCM encryption for data
 * - Secure key storage (encrypted with password)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// CRYPTO UTILS CLASS
// ═══════════════════════════════════════════════════════════════════════════

class CryptoUtils {
    constructor() {
        this.RSA_KEY_SIZE = 2048;
        this.AES_ALGORITHM = 'aes-256-gcm';
        this.HASH_ALGORITHM = 'sha256';
        this.PBKDF2_ITERATIONS = 100000;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RSA KEY GENERATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Generate a new RSA-2048 key pair
     * @returns {{ publicKey: string, privateKey: string }}
     */
    generateKeyPair() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: this.RSA_KEY_SIZE,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        return { publicKey, privateKey };
    }

    /**
     * Save key pair to files
     */
    saveKeyPair(keysDir, privateKey, publicKey, namePrefix = 'rangerblock') {
        if (!fs.existsSync(keysDir)) {
            fs.mkdirSync(keysDir, { recursive: true, mode: 0o700 });
        }

        const privatePath = path.join(keysDir, `${namePrefix}_private_key.pem`);
        const publicPath = path.join(keysDir, `${namePrefix}_public_key.pem`);

        // Save with restrictive permissions
        fs.writeFileSync(privatePath, privateKey, { mode: 0o600 });
        fs.writeFileSync(publicPath, publicKey, { mode: 0o644 });

        return { privatePath, publicPath };
    }

    /**
     * Load key pair from files
     */
    loadKeyPair(keysDir, namePrefix = 'rangerblock') {
        const privatePath = path.join(keysDir, `${namePrefix}_private_key.pem`);
        const publicPath = path.join(keysDir, `${namePrefix}_public_key.pem`);

        if (!fs.existsSync(privatePath) || !fs.existsSync(publicPath)) {
            return null;
        }

        return {
            privateKey: fs.readFileSync(privatePath, 'utf8'),
            publicKey: fs.readFileSync(publicPath, 'utf8')
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SIGNING & VERIFICATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Sign a message with private key
     * @param {string} message - Message to sign
     * @param {string} privateKey - PEM-encoded private key
     * @returns {string} Base64-encoded signature
     */
    sign(message, privateKey) {
        const sign = crypto.createSign(this.HASH_ALGORITHM);
        sign.update(message);
        sign.end();

        const signature = sign.sign(privateKey);
        return signature.toString('base64');
    }

    /**
     * Verify a message signature
     * @param {string} message - Original message
     * @param {string} signature - Base64-encoded signature
     * @param {string} publicKey - PEM-encoded public key
     * @returns {boolean}
     */
    verify(message, signature, publicKey) {
        try {
            const verify = crypto.createVerify(this.HASH_ALGORITHM);
            verify.update(message);
            verify.end();

            return verify.verify(publicKey, Buffer.from(signature, 'base64'));
        } catch (e) {
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHALLENGE-RESPONSE AUTHENTICATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Generate a random challenge for authentication
     * @returns {{ challenge: string, timestamp: number, expiresAt: number }}
     */
    generateChallenge() {
        const challenge = crypto.randomBytes(32).toString('hex');
        const timestamp = Date.now();
        const expiresAt = timestamp + (5 * 60 * 1000); // 5 minutes

        return { challenge, timestamp, expiresAt };
    }

    /**
     * Sign a challenge with private key
     */
    signChallenge(challenge, privateKey) {
        return this.sign(challenge, privateKey);
    }

    /**
     * Verify a signed challenge
     */
    verifyChallenge(challenge, signature, publicKey, expiresAt) {
        // Check if expired
        if (Date.now() > expiresAt) {
            return { valid: false, reason: 'expired' };
        }

        // Verify signature
        if (!this.verify(challenge, signature, publicKey)) {
            return { valid: false, reason: 'invalid_signature' };
        }

        return { valid: true };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AES ENCRYPTION (for data at rest)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Encrypt data with AES-256-GCM
     * @param {string|Buffer} data - Data to encrypt
     * @param {Buffer} key - 32-byte encryption key
     * @returns {{ encrypted: string, iv: string, authTag: string }}
     */
    encryptAES(data, key) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(this.AES_ALGORITHM, key, iv);

        let encrypted = cipher.update(data, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        return {
            encrypted,
            iv: iv.toString('base64'),
            authTag: cipher.getAuthTag().toString('base64')
        };
    }

    /**
     * Decrypt AES-256-GCM encrypted data
     * @param {object} encryptedData - { encrypted, iv, authTag }
     * @param {Buffer} key - 32-byte encryption key
     * @returns {string}
     */
    decryptAES(encryptedData, key) {
        const decipher = crypto.createDecipheriv(
            this.AES_ALGORITHM,
            key,
            Buffer.from(encryptedData.iv, 'base64')
        );
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));

        let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // KEY DERIVATION (for password-based encryption)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Derive an encryption key from a password
     * @param {string} password - User password
     * @param {string|Buffer} salt - Salt (should be stored with encrypted data)
     * @returns {Buffer} 32-byte key
     */
    deriveKey(password, salt) {
        const saltBuffer = typeof salt === 'string' ? Buffer.from(salt, 'base64') : salt;

        return crypto.pbkdf2Sync(
            password,
            saltBuffer,
            this.PBKDF2_ITERATIONS,
            32,
            this.HASH_ALGORITHM
        );
    }

    /**
     * Generate a random salt
     * @returns {string} Base64-encoded salt
     */
    generateSalt() {
        return crypto.randomBytes(16).toString('base64');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECURE KEY STORAGE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Encrypt a private key with a password for storage
     * @param {string} privateKey - PEM-encoded private key
     * @param {string} password - Password to encrypt with
     * @returns {{ encrypted: string, iv: string, authTag: string, salt: string }}
     */
    encryptPrivateKey(privateKey, password) {
        const salt = this.generateSalt();
        const key = this.deriveKey(password, salt);
        const encrypted = this.encryptAES(privateKey, key);

        return {
            ...encrypted,
            salt
        };
    }

    /**
     * Decrypt a password-protected private key
     * @param {object} encryptedData - { encrypted, iv, authTag, salt }
     * @param {string} password - Password to decrypt with
     * @returns {string} PEM-encoded private key
     */
    decryptPrivateKey(encryptedData, password) {
        const key = this.deriveKey(password, encryptedData.salt);
        return this.decryptAES(encryptedData, key);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RSA ENCRYPTION (for key exchange)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Encrypt data with RSA public key
     * (Used for encrypting AES session keys)
     */
    encryptRSA(data, publicKey) {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
        const encrypted = crypto.publicEncrypt(
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            buffer
        );
        return encrypted.toString('base64');
    }

    /**
     * Decrypt data with RSA private key
     */
    decryptRSA(encryptedData, privateKey) {
        const buffer = Buffer.from(encryptedData, 'base64');
        const decrypted = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            buffer
        );
        return decrypted;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HASHING UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Create a SHA-256 hash
     */
    hash(data) {
        return crypto.createHash(this.HASH_ALGORITHM)
            .update(data)
            .digest('hex');
    }

    /**
     * Create a short hash (first 8 characters)
     */
    shortHash(data) {
        return this.hash(data).substring(0, 8);
    }

    /**
     * Generate random bytes
     */
    randomBytes(length = 32) {
        return crypto.randomBytes(length);
    }

    /**
     * Generate random hex string
     */
    randomHex(length = 32) {
        return crypto.randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .substring(0, length);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SESSION KEY GENERATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Generate a session key for encrypted communication
     * @returns {Buffer} 32-byte session key
     */
    generateSessionKey() {
        return crypto.randomBytes(32);
    }

    /**
     * Create a session token (JWT-like but simpler)
     */
    createSessionToken(payload, privateKey) {
        const header = { alg: 'RS256', typ: 'RBT' }; // RangerBlock Token
        const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
        const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

        const dataToSign = `${headerB64}.${payloadB64}`;
        const signature = this.sign(dataToSign, privateKey);
        const signatureB64 = Buffer.from(signature, 'base64').toString('base64url');

        return `${headerB64}.${payloadB64}.${signatureB64}`;
    }

    /**
     * Verify and decode a session token
     */
    verifySessionToken(token, publicKey) {
        try {
            const [headerB64, payloadB64, signatureB64] = token.split('.');

            const dataToVerify = `${headerB64}.${payloadB64}`;
            const signature = Buffer.from(signatureB64, 'base64url').toString('base64');

            if (!this.verify(dataToVerify, signature, publicKey)) {
                return { valid: false, reason: 'invalid_signature' };
            }

            const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

            // Check expiry if present
            if (payload.exp && Date.now() > payload.exp) {
                return { valid: false, reason: 'expired' };
            }

            return { valid: true, payload };
        } catch (e) {
            return { valid: false, reason: 'malformed' };
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

const cryptoUtils = new CryptoUtils();

module.exports = {
    CryptoUtils,
    cryptoUtils,

    // Key generation
    generateKeyPair: () => cryptoUtils.generateKeyPair(),
    saveKeyPair: (dir, priv, pub, prefix) => cryptoUtils.saveKeyPair(dir, priv, pub, prefix),
    loadKeyPair: (dir, prefix) => cryptoUtils.loadKeyPair(dir, prefix),

    // Signing
    sign: (msg, key) => cryptoUtils.sign(msg, key),
    verify: (msg, sig, key) => cryptoUtils.verify(msg, sig, key),

    // Challenge-response
    generateChallenge: () => cryptoUtils.generateChallenge(),
    signChallenge: (c, k) => cryptoUtils.signChallenge(c, k),
    verifyChallenge: (c, s, k, e) => cryptoUtils.verifyChallenge(c, s, k, e),

    // AES encryption
    encryptAES: (d, k) => cryptoUtils.encryptAES(d, k),
    decryptAES: (d, k) => cryptoUtils.decryptAES(d, k),

    // Key derivation
    deriveKey: (p, s) => cryptoUtils.deriveKey(p, s),
    generateSalt: () => cryptoUtils.generateSalt(),

    // Private key protection
    encryptPrivateKey: (k, p) => cryptoUtils.encryptPrivateKey(k, p),
    decryptPrivateKey: (d, p) => cryptoUtils.decryptPrivateKey(d, p),

    // RSA encryption
    encryptRSA: (d, k) => cryptoUtils.encryptRSA(d, k),
    decryptRSA: (d, k) => cryptoUtils.decryptRSA(d, k),

    // Hashing
    hash: (d) => cryptoUtils.hash(d),
    shortHash: (d) => cryptoUtils.shortHash(d),
    randomBytes: (l) => cryptoUtils.randomBytes(l),
    randomHex: (l) => cryptoUtils.randomHex(l),

    // Session
    generateSessionKey: () => cryptoUtils.generateSessionKey(),
    createSessionToken: (p, k) => cryptoUtils.createSessionToken(p, k),
    verifySessionToken: (t, k) => cryptoUtils.verifySessionToken(t, k)
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI TEST
// ═══════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    console.log('\n🔐 RANGERBLOCK CRYPTO UTILITIES TEST\n');
    console.log('=====================================');

    // Test key generation
    console.log('\n1. Generating RSA-2048 key pair...');
    const { publicKey, privateKey } = cryptoUtils.generateKeyPair();
    console.log('   ✅ Keys generated');
    console.log(`   Public key: ${publicKey.substring(0, 50)}...`);

    // Test signing
    console.log('\n2. Testing signature...');
    const message = 'Hello, RangerBlock!';
    const signature = cryptoUtils.sign(message, privateKey);
    console.log(`   Message: "${message}"`);
    console.log(`   Signature: ${signature.substring(0, 40)}...`);

    // Test verification
    console.log('\n3. Verifying signature...');
    const isValid = cryptoUtils.verify(message, signature, publicKey);
    console.log(`   Valid: ${isValid ? '✅ YES' : '❌ NO'}`);

    // Test challenge-response
    console.log('\n4. Testing challenge-response...');
    const challenge = cryptoUtils.generateChallenge();
    console.log(`   Challenge: ${challenge.challenge.substring(0, 16)}...`);
    const challengeSig = cryptoUtils.signChallenge(challenge.challenge, privateKey);
    const challengeResult = cryptoUtils.verifyChallenge(
        challenge.challenge, challengeSig, publicKey, challenge.expiresAt
    );
    console.log(`   Verified: ${challengeResult.valid ? '✅ YES' : '❌ NO'}`);

    // Test AES encryption
    console.log('\n5. Testing AES-256-GCM encryption...');
    const sessionKey = cryptoUtils.generateSessionKey();
    const secretData = 'This is secret data for RangerBlock!';
    const encrypted = cryptoUtils.encryptAES(secretData, sessionKey);
    console.log(`   Original: "${secretData}"`);
    console.log(`   Encrypted: ${encrypted.encrypted.substring(0, 30)}...`);
    const decrypted = cryptoUtils.decryptAES(encrypted, sessionKey);
    console.log(`   Decrypted: "${decrypted}"`);
    console.log(`   Match: ${secretData === decrypted ? '✅ YES' : '❌ NO'}`);

    // Test session token
    console.log('\n6. Testing session token...');
    const tokenPayload = {
        userId: 'ranger123',
        exp: Date.now() + 3600000 // 1 hour
    };
    const token = cryptoUtils.createSessionToken(tokenPayload, privateKey);
    console.log(`   Token: ${token.substring(0, 50)}...`);
    const tokenResult = cryptoUtils.verifySessionToken(token, publicKey);
    console.log(`   Valid: ${tokenResult.valid ? '✅ YES' : '❌ NO'}`);
    if (tokenResult.payload) {
        console.log(`   User ID: ${tokenResult.payload.userId}`);
    }

    console.log('\n=====================================');
    console.log('All tests completed!\n');
}

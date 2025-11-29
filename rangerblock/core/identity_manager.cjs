#!/usr/bin/env node
/**
 * 🎖️ RANGERPLEX IDENTITY MANAGER
 * ==============================
 * Import/export identity files for account recovery and multi-device access.
 *
 * Created by: David Keane with Claude Code
 * Mission: Transform disabilities into superpowers
 *
 * Features:
 * - Export identity bundle (encrypted .rangerblock file)
 * - Import identity with security question verification
 * - Merge identities (add new device to existing account)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const zlib = require('zlib');

class IdentityManager {
    constructor() {
        this.rl = null;
        this.personalDir = path.join(__dirname, '..', '.personal');
        this.keysDir = path.join(this.personalDir, 'keys');
    }

    /**
     * Initialize readline interface
     */
    initReadline() {
        if (!this.rl) {
            this.rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
        }
        return this.rl;
    }

    /**
     * Prompt user for input
     */
    async prompt(question) {
        this.initReadline();
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    /**
     * Hash answer for comparison
     */
    hashAnswer(answer) {
        return crypto
            .createHash('sha256')
            .update(answer.toLowerCase().trim())
            .digest('hex');
    }

    /**
     * Derive encryption key from security answers
     */
    deriveKey(answers) {
        // Combine all answers and hash to create encryption key
        const combined = Object.values(answers).sort().join('');
        return crypto.createHash('sha256').update(combined).digest();
    }

    /**
     * Encrypt data using AES-256-GCM
     */
    encrypt(data, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return {
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            data: encrypted
        };
    }

    /**
     * Decrypt data using AES-256-GCM
     */
    decrypt(encrypted, key) {
        try {
            const iv = Buffer.from(encrypted.iv, 'hex');
            const authTag = Buffer.from(encrypted.authTag, 'hex');
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return JSON.parse(decrypted);
        } catch (error) {
            return null;
        }
    }

    /**
     * Export identity to encrypted bundle
     */
    async exportIdentity(outputPath = null) {
        console.log('\n' + '='.repeat(60));
        console.log('📤 EXPORT IDENTITY');
        console.log('='.repeat(60));

        // Check if identity exists
        const identityPath = path.join(this.personalDir, 'node_identity.json');
        if (!fs.existsSync(identityPath)) {
            console.log('\n❌ No identity found. Run setup first.');
            return null;
        }

        // Load identity
        const identity = JSON.parse(fs.readFileSync(identityPath, 'utf8'));
        console.log(`\n📋 Exporting identity: ${identity.nodeName}`);
        console.log(`   Type: ${identity.nodeType}`);

        // Load security answers
        const securityPath = path.join(this.personalDir, 'security_answers.json');
        if (!fs.existsSync(securityPath)) {
            console.log('\n⚠️  No security answers found!');
            console.log('   Export will be unencrypted. Run setup with security questions for encryption.');

            // Create unencrypted bundle
            const bundle = this.createBundle(identity, false);
            return await this.saveBundle(bundle, outputPath, identity.nodeName);
        }

        const securityData = JSON.parse(fs.readFileSync(securityPath, 'utf8'));

        // Verify user knows answers before exporting
        console.log('\n🔐 Verify security answers to export:');
        const verifiedAnswers = {};
        const questions = Object.keys(securityData.answers);

        let verified = 0;
        for (const question of questions.slice(0, 3)) {
            const answer = await this.prompt(`   ${question}: `);
            const hashedAnswer = this.hashAnswer(answer);

            if (hashedAnswer === securityData.answers[question]) {
                verified++;
                verifiedAnswers[question] = hashedAnswer;
                console.log('   ✅ Correct');
            } else {
                console.log('   ❌ Incorrect');
            }
        }

        if (verified < 2) {
            console.log('\n❌ Verification failed. At least 2 correct answers required.');
            return null;
        }

        console.log(`\n✅ Verified ${verified}/3 answers`);

        // Create encrypted bundle
        const key = this.deriveKey(securityData.answers);
        const bundle = this.createBundle(identity, true, key);

        return await this.saveBundle(bundle, outputPath, identity.nodeName);
    }

    /**
     * Create export bundle with all identity files
     */
    createBundle(identity, encrypted = false, key = null) {
        const bundle = {
            version: '1.0.0',
            format: 'rangerblock',
            created: new Date().toISOString(),
            encrypted: encrypted,
            identity: identity,
            keys: {},
            security: null
        };

        // Load all keys
        if (fs.existsSync(this.keysDir)) {
            const keyFiles = fs.readdirSync(this.keysDir);
            for (const file of keyFiles) {
                if (file.endsWith('.pem')) {
                    const keyPath = path.join(this.keysDir, file);
                    bundle.keys[file] = fs.readFileSync(keyPath, 'utf8');
                }
            }
        }

        // Load security answers (hashed)
        const securityPath = path.join(this.personalDir, 'security_answers.json');
        if (fs.existsSync(securityPath)) {
            bundle.security = JSON.parse(fs.readFileSync(securityPath, 'utf8'));
        }

        // Encrypt sensitive data if key provided
        if (encrypted && key) {
            bundle.keys = this.encrypt(bundle.keys, key);
            if (bundle.security) {
                bundle.security = this.encrypt(bundle.security, key);
            }
        }

        // Compress bundle
        const compressed = zlib.gzipSync(JSON.stringify(bundle));
        return compressed.toString('base64');
    }

    /**
     * Save bundle to file
     */
    async saveBundle(bundleData, outputPath, nodeName) {
        if (!outputPath) {
            const defaultName = `${nodeName}_identity_${Date.now()}.rangerblock`;
            outputPath = await this.prompt(`\n📁 Save as (default: ${defaultName}): `);
            if (!outputPath) {
                outputPath = path.join(process.cwd(), defaultName);
            }
        }

        if (!outputPath.endsWith('.rangerblock')) {
            outputPath += '.rangerblock';
        }

        fs.writeFileSync(outputPath, bundleData);
        console.log(`\n✅ Identity exported: ${outputPath}`);
        console.log('   Keep this file safe - it contains your private keys!');

        return outputPath;
    }

    /**
     * Import identity from bundle
     */
    async importIdentity(bundlePath = null) {
        console.log('\n' + '='.repeat(60));
        console.log('📥 IMPORT IDENTITY');
        console.log('='.repeat(60));

        // Get bundle path
        if (!bundlePath) {
            bundlePath = await this.prompt('\n📁 Path to .rangerblock file: ');
        }

        if (!fs.existsSync(bundlePath)) {
            console.log('\n❌ File not found:', bundlePath);
            return null;
        }

        // Load and decompress bundle
        console.log('\n🔓 Loading identity bundle...');
        const bundleData = fs.readFileSync(bundlePath, 'utf8');
        const decompressed = zlib.gunzipSync(Buffer.from(bundleData, 'base64'));
        const bundle = JSON.parse(decompressed.toString());

        console.log(`   Version: ${bundle.version}`);
        console.log(`   Created: ${bundle.created}`);
        console.log(`   Encrypted: ${bundle.encrypted ? 'Yes' : 'No'}`);
        console.log(`   Node: ${bundle.identity.nodeName}`);

        // Decrypt if needed
        if (bundle.encrypted) {
            console.log('\n🔐 Answer security questions to decrypt:');

            // Get security questions from bundle
            const encryptedSecurity = bundle.security;

            // User must know the answers to decrypt
            const questions = [
                "What was the name of your first pet?",
                "What was your childhood nickname?",
                "What was the name of your first school?"
            ];

            const userAnswers = {};
            for (const question of questions) {
                const answer = await this.prompt(`   ${question}: `);
                if (answer) {
                    userAnswers[question] = this.hashAnswer(answer);
                }
            }

            // Try to derive key and decrypt
            const key = this.deriveKey(userAnswers);

            const decryptedKeys = this.decrypt(bundle.keys, key);
            if (!decryptedKeys) {
                console.log('\n❌ Decryption failed. Security answers incorrect.');
                return null;
            }

            bundle.keys = decryptedKeys;
            if (bundle.security) {
                bundle.security = this.decrypt(bundle.security, key);
            }
            console.log('\n✅ Decryption successful!');
        }

        // Check for existing identity
        const existingPath = path.join(this.personalDir, 'node_identity.json');
        if (fs.existsSync(existingPath)) {
            const overwrite = await this.prompt('\n⚠️  Existing identity found. Overwrite? (y/n): ');
            if (overwrite.toLowerCase() !== 'y') {
                console.log('   Import cancelled.');
                return null;
            }

            // Backup existing
            const backupDir = path.join(this.personalDir, 'backup_' + Date.now());
            fs.mkdirSync(backupDir, { recursive: true });
            fs.cpSync(this.personalDir, backupDir, { recursive: true });
            console.log(`   📦 Backup created: ${backupDir}`);
        }

        // Create directories
        fs.mkdirSync(this.personalDir, { recursive: true });
        fs.mkdirSync(this.keysDir, { recursive: true });

        // Save identity
        fs.writeFileSync(
            path.join(this.personalDir, 'node_identity.json'),
            JSON.stringify(bundle.identity, null, 2)
        );
        console.log('\n✅ Identity restored: node_identity.json');

        // Save keys
        for (const [filename, content] of Object.entries(bundle.keys)) {
            const keyPath = path.join(this.keysDir, filename);
            fs.writeFileSync(keyPath, content);

            // Set permissions for private keys
            if (filename.includes('private')) {
                try { fs.chmodSync(keyPath, 0o600); } catch (e) {}
            } else {
                try { fs.chmodSync(keyPath, 0o644); } catch (e) {}
            }
        }
        console.log(`✅ Keys restored: ${Object.keys(bundle.keys).length} files`);

        // Save security answers
        if (bundle.security) {
            const securityPath = path.join(this.personalDir, 'security_answers.json');
            fs.writeFileSync(securityPath, JSON.stringify(bundle.security, null, 2));
            try { fs.chmodSync(securityPath, 0o600); } catch (e) {}
            console.log('✅ Security answers restored');
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 IMPORT COMPLETE!');
        console.log('='.repeat(60));
        console.log(`\n📋 Imported: ${bundle.identity.nodeName}`);
        console.log(`   Type: ${bundle.identity.nodeType}`);
        console.log(`   Original Hardware: ${bundle.identity.hardwareUUID || 'Not recorded'}`);

        console.log('\n🚀 Next Steps:');
        console.log('   1. Start the relay server: node core/relay-server.cjs');
        console.log('   2. Open RangerPlex and type /blockchain');
        console.log('   3. Your identity is restored!');

        console.log('\n🎖️  Rangers lead the way!\n');

        return bundle.identity;
    }

    /**
     * Close readline
     */
    close() {
        if (this.rl) {
            this.rl.close();
        }
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const manager = new IdentityManager();

    const run = async () => {
        if (args.includes('--export') || args.includes('-e')) {
            await manager.exportIdentity();
        } else if (args.includes('--import') || args.includes('-i')) {
            const filePath = args.find(a => a.endsWith('.rangerblock'));
            await manager.importIdentity(filePath);
        } else {
            console.log('\n🎖️  RANGERPLEX IDENTITY MANAGER');
            console.log('================================');
            console.log('\nUsage:');
            console.log('  node identity_manager.cjs --export    Export identity to .rangerblock file');
            console.log('  node identity_manager.cjs --import    Import identity from .rangerblock file');
            console.log('  node identity_manager.cjs -i file.rangerblock   Import specific file');
            console.log('\n');
        }
        manager.close();
    };

    run().catch(err => {
        console.error('Error:', err);
        manager.close();
        process.exit(1);
    });
}

module.exports = IdentityManager;

#!/usr/bin/env node
/**
 * 🎖️ RANGERPLEX NEW USER SETUP
 * ============================
 * Generates all required keys and identity files for a new user.
 *
 * Created by: David Keane with Claude Code
 * Mission: Transform disabilities into superpowers
 * Philosophy: "One foot in front of the other"
 *
 * This script creates:
 * 1. Node identity (node_identity.json)
 * 2. Node keypair (node_private_key.pem, node_public_key.pem)
 * 3. Chat keypair (rangercode_chat_private_key.pem, rangercode_chat_public_key.pem)
 * 4. Genesis keys (for genesis nodes only)
 * 5. Roaming keys (for multi-device access)
 * 6. Security answers (hashed for account recovery)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const hardwareDetection = require('./hardwareDetection.cjs');

// Security questions from template
const SECURITY_QUESTIONS = {
    childhood: [
        "What was the name of your first pet?",
        "What was your childhood nickname?",
        "What street did you grow up on?",
        "What was the name of your best friend in primary school?"
    ],
    family: [
        "What is your mother's maiden name?",
        "In what city were your parents married?",
        "What is your grandmother's first name?"
    ],
    personal: [
        "What was the name of your first school?",
        "What city were you born in?",
        "What hospital were you born in?"
    ],
    unique: [
        "What was the destination of your first flight?",
        "What was the name of your first teacher?",
        "What was your first email address?"
    ]
};

class RangerSetup {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * Prompt user for input
     */
    async prompt(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    /**
     * Generate RSA-2048 keypair
     */
    generateKeypair(namePrefix, outputDir) {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        const privatePath = path.join(outputDir, `${namePrefix}_private_key.pem`);
        const publicPath = path.join(outputDir, `${namePrefix}_public_key.pem`);

        fs.writeFileSync(privatePath, privateKey);
        fs.writeFileSync(publicPath, publicKey);

        // Set secure permissions (Unix only)
        try {
            fs.chmodSync(privatePath, 0o600);
            fs.chmodSync(publicPath, 0o644);
        } catch (e) {
            // Windows doesn't support chmod
        }

        return { privatePath, publicPath };
    }

    /**
     * Hash a security answer (case-insensitive)
     */
    hashAnswer(answer) {
        return crypto
            .createHash('sha256')
            .update(answer.toLowerCase().trim())
            .digest('hex');
    }

    /**
     * Ask security questions
     */
    async askSecurityQuestions() {
        console.log('\n🔐 SECURITY QUESTIONS');
        console.log('These are personal facts you cannot forget.');
        console.log('Answer at least 3 questions for account recovery.\n');

        const answers = {};
        const categories = Object.keys(SECURITY_QUESTIONS);
        let answered = 0;

        for (const category of categories) {
            if (answered >= 3) {
                const more = await this.prompt(`\n✓ You have ${answered} answers. Add more? (y/n): `);
                if (more.toLowerCase() !== 'y') break;
            }

            console.log(`\n📁 ${category.toUpperCase()}:`);
            const questions = SECURITY_QUESTIONS[category];

            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                const answer = await this.prompt(`   ${i + 1}. ${question} (or press Enter to skip): `);

                if (answer) {
                    answers[question] = this.hashAnswer(answer);
                    answered++;
                    console.log(`   ✅ Answer saved (hashed)`);
                }
            }
        }

        if (answered < 3) {
            console.log('\n⚠️  WARNING: You answered less than 3 questions.');
            console.log('   Account recovery may be difficult without security answers.');
        }

        return {
            questionCount: answered,
            answers: answers,
            created: new Date().toISOString()
        };
    }

    /**
     * Main setup function
     */
    async setup(options = {}) {
        const isGenesis = options.genesis || false;
        const skipQuestions = options.skipQuestions || false;

        console.log('\n' + '='.repeat(60));
        console.log('🎖️  RANGERPLEX NEW USER SETUP');
        console.log('='.repeat(60));
        console.log("🏔️  Philosophy: 'One foot in front of the other'");
        console.log('♿ Mission: Transform disabilities into superpowers');
        console.log('='.repeat(60));

        if (isGenesis) {
            console.log('\n🌟 Setting up GENESIS NODE (network founder)');
        } else {
            console.log('\n🔗 Setting up PEER NODE');
        }

        // Get hardware info
        console.log('\n🔍 Detecting hardware...');
        const hwInfo = hardwareDetection.getHardwareInfo();
        console.log(`   Platform: macOS (${hwInfo.machineType})`);
        console.log(`   Computer: ${hwInfo.computerName}`);
        console.log(`   UUID: ${hwInfo.hardwareSerial || 'Not detected'}`);
        console.log(`   IP: ${hwInfo.ipAddress}`);

        // Get node name
        let nodeName = await this.prompt(`\n📛 Enter your node name (default: ${hwInfo.nodeName}): `);
        if (!nodeName) nodeName = hwInfo.nodeName;

        // Set output directory
        const baseDir = path.join(__dirname, '..', '.personal');
        const keysDir = path.join(baseDir, 'keys');

        fs.mkdirSync(baseDir, { recursive: true });
        fs.mkdirSync(keysDir, { recursive: true });

        console.log(`\n📁 Output directory: ${baseDir}`);
        console.log(`🔑 Keys directory: ${keysDir}`);

        // Generate node identity
        console.log('\n🆔 Generating node identity...');
        const nodeType = isGenesis ? 'genesis' : 'peer';
        const nodeId = `rangerplex_${nodeName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${crypto.randomBytes(4).toString('hex')}`;

        const identity = {
            nodeID: nodeId,
            nodeName: nodeName,
            nodeType: nodeType,
            created: new Date().toISOString(),
            hardwareUUID: hwInfo.hardwareSerial,
            hardwareFingerprint: hardwareDetection.createBindingHash(hwInfo.hardwareSerial || 'unknown', nodeId),
            platform: {
                system: 'Darwin',
                machine: hwInfo.machineType,
                processor: hwInfo.machineType,
                node_name: hwInfo.computerName,
                ip_address: hwInfo.ipAddress
            },
            version: '1.0.0',
            blockchain: 'rangerplex',
            network: 'rangerplex_mainnet',
            mission: {
                primary: 'Transform disabilities into superpowers',
                education_tithe: '10% funds disability schools',
                philosophy: 'One foot in front of the other - David Keane'
            }
        };

        const identityPath = path.join(baseDir, 'node_identity.json');
        fs.writeFileSync(identityPath, JSON.stringify(identity, null, 2));
        console.log('   ✅ Saved: node_identity.json');

        // Generate keys
        console.log('\n🔐 Generating security keys...');

        // 1. Node key
        this.generateKeypair('node', keysDir);
        console.log('   ✅ Node keypair');

        // 2. Chat key
        this.generateKeypair('rangercode_chat', keysDir);
        console.log('   ✅ Chat keypair');

        // 3. Genesis key (only for genesis nodes)
        if (isGenesis) {
            this.generateKeypair('rangercoin_genesis', keysDir);
            console.log('   ✅ Genesis keypair');
        }

        // 4. Roaming key (for multi-device access)
        this.generateKeypair('rangercoin_roaming', keysDir);
        console.log('   ✅ Roaming keypair');

        // Security questions
        let securityData = null;
        if (!skipQuestions) {
            securityData = await this.askSecurityQuestions();
            if (securityData.questionCount > 0) {
                const securityPath = path.join(baseDir, 'security_answers.json');
                fs.writeFileSync(securityPath, JSON.stringify(securityData, null, 2));
                fs.chmodSync(securityPath, 0o600);
                console.log('\n   ✅ Security answers saved (hashed)');
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('🎉 SETUP COMPLETE!');
        console.log('='.repeat(60));
        console.log('\n📋 Your Node Details:');
        console.log(`   Node ID: ${nodeId}`);
        console.log(`   Node Name: ${nodeName}`);
        console.log(`   Type: ${nodeType.toUpperCase()}`);
        console.log(`   Hardware UUID: ${hwInfo.hardwareSerial || 'Not detected'}`);

        console.log('\n📁 Files Created:');
        console.log(`   ${baseDir}/`);
        console.log('   ├── node_identity.json');
        if (securityData && securityData.questionCount > 0) {
            console.log('   ├── security_answers.json');
        }
        console.log('   └── keys/');
        console.log('       ├── node_private_key.pem');
        console.log('       ├── node_public_key.pem');
        console.log('       ├── rangercode_chat_private_key.pem');
        console.log('       ├── rangercode_chat_public_key.pem');
        console.log('       ├── rangercoin_roaming_private_key.pem');
        console.log('       └── rangercoin_roaming_public_key.pem');
        if (isGenesis) {
            console.log('       ├── rangercoin_genesis_private_key.pem');
            console.log('       └── rangercoin_genesis_public_key.pem');
        }

        console.log('\n⚠️  IMPORTANT:');
        console.log('   • NEVER share your *_private_key.pem files!');
        console.log('   • Keep .personal/ folder backed up securely');
        console.log('   • These files are NOT pushed to git');

        console.log('\n🚀 Next Steps:');
        console.log('   1. Start the relay server: node core/relay-server.cjs');
        console.log('   2. Open RangerPlex and type /blockchain');
        console.log('   3. Select your node and start chatting!');

        console.log('\n🎖️  Rangers lead the way!\n');

        this.rl.close();
        return identity;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const isGenesis = args.includes('--genesis');
    const skipQuestions = args.includes('--skip-questions');

    const setup = new RangerSetup();
    setup.setup({ genesis: isGenesis, skipQuestions: skipQuestions })
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Setup failed:', err);
            process.exit(1);
        });
}

module.exports = RangerSetup;

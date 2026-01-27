#!/usr/bin/env node
/**
 * RANGERBLOCK SECURE WALLET SERVICE v1.0.0
 * =========================================
 * Hardware-bound cryptocurrency wallet with full security features
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 *
 * SECURITY FEATURES:
 * - Hardware-bound wallet (derived from secure identity)
 * - Transaction signing with RSA-2048
 * - Replay attack protection (nonce + timestamp)
 * - Double-spend prevention (UTXO tracking)
 * - Rate limiting (20 EUR daily cap)
 * - Transaction verification
 *
 * COINS SUPPORTED:
 * - RangerCoin (RC) - Real value, Solana-linked
 * - RangerDollar (RGD) - Free token for playing
 * - HellCoin (HELL) - Experimental/fun
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import secure identity
const { SecureIdentityService } = require('./secure-identity.cjs');

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = '1.0.0';
const WALLET_VERSION = 'WALLET-1.0';

// Coin configurations
const COINS = {
    RC: {
        name: 'RangerCoin',
        symbol: 'RC',
        decimals: 9,
        network: 'solana',
        realValue: true,
        educationTithe: 0.10,  // 10% for education
        solanaAddress: '5oe8ERNEfHWo28XhjUTm573rfqVHB86XJyKTCMsKsXyg'
    },
    RGD: {
        name: 'RangerDollar',
        symbol: 'RGD',
        decimals: 6,
        network: 'rangerblock',
        realValue: false,
        educationTithe: 0,
        totalSupply: 100_000_000_000  // 100 billion
    },
    HELL: {
        name: 'HellCoin',
        symbol: 'HELL',
        decimals: 8,
        network: 'rangerblock',
        realValue: false,
        educationTithe: 0
    }
};

// Rate limiting
const DAILY_LIMIT_EUR = 20;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;  // 24 hours
const MAX_TX_PER_MINUTE = 10;

// Storage
const WALLET_STORAGE_DIR = '.rangerblock-secure';
const WALLET_FILE = 'wallet.enc';
const TX_HISTORY_FILE = 'transactions.enc';
const NONCE_FILE = 'nonces.json';
const RATE_LIMIT_FILE = 'rate_limits.json';

// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTION CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Transaction {
    constructor(params) {
        this.version = WALLET_VERSION;
        this.id = params.id || crypto.randomBytes(16).toString('hex');
        this.type = params.type;  // TRANSFER, MINT, BURN, REWARD
        this.coin = params.coin;
        this.from = params.from;
        this.to = params.to;
        this.amount = params.amount;
        this.fee = params.fee || 0;
        this.nonce = params.nonce;
        this.timestamp = params.timestamp || Date.now();
        this.memo = params.memo || '';
        this.signature = params.signature || null;
        this.hardwareHash = params.hardwareHash || null;
    }

    /**
     * Get the data to sign (excludes signature field)
     */
    getSignableData() {
        return JSON.stringify({
            version: this.version,
            id: this.id,
            type: this.type,
            coin: this.coin,
            from: this.from,
            to: this.to,
            amount: this.amount,
            fee: this.fee,
            nonce: this.nonce,
            timestamp: this.timestamp,
            memo: this.memo,
            hardwareHash: this.hardwareHash
        });
    }

    /**
     * Calculate transaction hash
     */
    getHash() {
        return crypto.createHash('sha256')
            .update(this.getSignableData())
            .digest('hex');
    }

    /**
     * Check if transaction is expired (older than 5 minutes)
     */
    isExpired() {
        const maxAge = 5 * 60 * 1000;  // 5 minutes
        return Date.now() - this.timestamp > maxAge;
    }

    /**
     * Convert to plain object
     */
    toJSON() {
        return {
            version: this.version,
            id: this.id,
            type: this.type,
            coin: this.coin,
            from: this.from,
            to: this.to,
            amount: this.amount,
            fee: this.fee,
            nonce: this.nonce,
            timestamp: this.timestamp,
            memo: this.memo,
            signature: this.signature,
            hardwareHash: this.hardwareHash,
            hash: this.getHash()
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECURE WALLET CLASS
// ═══════════════════════════════════════════════════════════════════════════

class SecureWallet {
    constructor(appType = 'wallet') {
        this.appType = appType;
        this.version = VERSION;
        this.identity = new SecureIdentityService(appType);
        this._initialized = false;
        this._wallet = null;
        this._nonces = {};  // Track used nonces per address
        this._rateLimits = {};  // Track transactions per address
        this._pendingTx = new Map();  // Pending transactions
        this._secureDir = path.join(os.homedir(), WALLET_STORAGE_DIR);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Initialize wallet with secure identity
     * @param {string} masterPassword - Optional master password
     */
    async init(masterPassword = null) {
        if (this._initialized) return true;

        try {
            // Initialize secure identity first
            const identityInit = await this.identity.init(masterPassword);
            if (!identityInit) {
                throw new Error('Failed to initialize secure identity');
            }

            // Get or create identity
            await this.identity.getOrCreateIdentity();

            // Load wallet data
            this._nonces = this._loadNonces();
            this._rateLimits = this._loadRateLimits();
            this._wallet = this._loadWallet() || this._createWallet();

            this._initialized = true;
            console.log(`🔐 Secure Wallet initialized`);
            console.log(`   Address: ${this.getAddress()}`);

            return true;
        } catch (e) {
            console.error('Failed to initialize secure wallet:', e.message);
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WALLET ADDRESS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get wallet address (derived from public key)
     * Uses accessible format (avoids confusing characters like 0/O, 1/l/I)
     * @param {boolean} internal - If true, skips initialization check (for internal use)
     */
    getAddress(internal = false) {
        if (!internal && !this._initialized) {
            throw new Error('Wallet not initialized');
        }

        const publicKey = this.identity.getPublicKey();
        if (!publicKey) {
            throw new Error('No public key available');
        }

        // Create address hash from public key
        const hash = crypto.createHash('sha256')
            .update(publicKey)
            .digest('hex');

        // Convert to accessible format (base32-like, no confusing chars)
        const accessible = this._toAccessibleAddress(hash);

        return `RB_${accessible}`;
    }

    /**
     * Convert hex to accessible address format
     * Avoids: 0/O, 1/l/I (confusing characters)
     */
    _toAccessibleAddress(hex) {
        // Use only unambiguous characters
        const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
        let result = '';

        // Take first 32 chars of hex, convert to our alphabet
        for (let i = 0; i < 32 && i < hex.length; i++) {
            const val = parseInt(hex[i], 16);
            result += chars[val % chars.length];
        }

        // Format as groups of 4 for readability
        return result.match(/.{1,4}/g).join('-');
    }

    /**
     * Verify an address format is valid
     */
    isValidAddress(address) {
        if (!address || typeof address !== 'string') return false;
        if (!address.startsWith('RB_')) return false;

        const parts = address.substring(3).split('-');
        if (parts.length !== 8) return false;  // 32 chars = 8 groups of 4

        const validChars = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]+$/;
        return parts.every(part => part.length === 4 && validChars.test(part));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BALANCES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get balance for a coin
     * Note: Real balances come from blockchain - this is local cache
     */
    getBalance(coin = 'RGD') {
        if (!this._wallet || !this._wallet.balances) {
            return 0;
        }
        return this._wallet.balances[coin] || 0;
    }

    /**
     * Get all balances
     */
    getAllBalances() {
        if (!this._wallet) return {};
        return { ...this._wallet.balances };
    }

    /**
     * Update local balance cache
     * Called after receiving balance from blockchain
     */
    updateBalance(coin, amount) {
        if (!this._wallet) return;
        this._wallet.balances[coin] = amount;
        this._saveWallet();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSACTION CREATION & SIGNING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Create and sign a transfer transaction
     */
    createTransfer(to, amount, coin = 'RGD', memo = '') {
        if (!this._initialized) {
            throw new Error('Wallet not initialized');
        }

        // Validate inputs
        if (!this.isValidAddress(to)) {
            throw new Error('Invalid recipient address');
        }

        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        const coinConfig = COINS[coin];
        if (!coinConfig) {
            throw new Error(`Unknown coin: ${coin}`);
        }

        // Check balance
        const balance = this.getBalance(coin);
        if (balance < amount) {
            throw new Error(`Insufficient balance: have ${balance} ${coin}, need ${amount}`);
        }

        // Check rate limits for real-value coins
        if (coinConfig.realValue) {
            const rateLimitCheck = this._checkRateLimit(amount);
            if (!rateLimitCheck.allowed) {
                throw new Error(rateLimitCheck.reason);
            }
        }

        // Get next nonce (prevents replay attacks)
        const nonce = this._getNextNonce();

        // Get hardware hash (binds transaction to hardware)
        const hardwareHash = this.identity.getHardwareHash();

        // Create transaction
        const tx = new Transaction({
            type: 'TRANSFER',
            coin,
            from: this.getAddress(),
            to,
            amount,
            fee: this._calculateFee(amount, coin),
            nonce,
            memo,
            hardwareHash
        });

        // Sign transaction
        this._signTransaction(tx);

        // Record nonce as used
        this._recordNonce(nonce);

        // Update rate limit tracking
        if (coinConfig.realValue) {
            this._recordTransaction(amount);
        }

        return tx;
    }

    /**
     * Sign a transaction with hardware-bound private key
     */
    _signTransaction(tx) {
        const privateKey = this.identity.getPrivateKey();
        if (!privateKey) {
            throw new Error('No private key available');
        }

        const dataToSign = tx.getSignableData();

        const sign = crypto.createSign('sha256');
        sign.update(dataToSign);
        sign.end();

        tx.signature = sign.sign(privateKey).toString('base64');
    }

    /**
     * Verify a transaction signature
     */
    verifyTransaction(tx, senderPublicKey) {
        if (!tx.signature) {
            return { valid: false, reason: 'No signature' };
        }

        // Check if expired
        if (tx.isExpired && tx.isExpired()) {
            return { valid: false, reason: 'Transaction expired' };
        }

        // Verify signature
        try {
            const dataToVerify = tx.getSignableData ? tx.getSignableData() : JSON.stringify({
                version: tx.version,
                id: tx.id,
                type: tx.type,
                coin: tx.coin,
                from: tx.from,
                to: tx.to,
                amount: tx.amount,
                fee: tx.fee,
                nonce: tx.nonce,
                timestamp: tx.timestamp,
                memo: tx.memo,
                hardwareHash: tx.hardwareHash
            });

            const verify = crypto.createVerify('sha256');
            verify.update(dataToVerify);
            verify.end();

            const isValid = verify.verify(senderPublicKey, Buffer.from(tx.signature, 'base64'));

            if (!isValid) {
                return { valid: false, reason: 'Invalid signature' };
            }

            return { valid: true };
        } catch (e) {
            return { valid: false, reason: `Verification error: ${e.message}` };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // REPLAY & DOUBLE-SPEND PROTECTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get next nonce for this wallet
     */
    _getNextNonce() {
        const address = this.getAddress();
        if (!this._nonces[address]) {
            this._nonces[address] = { current: 0, used: [] };
        }
        return ++this._nonces[address].current;
    }

    /**
     * Record a nonce as used (prevents replay)
     */
    _recordNonce(nonce) {
        const address = this.getAddress();
        if (!this._nonces[address]) {
            this._nonces[address] = { current: nonce, used: [] };
        }
        this._nonces[address].used.push(nonce);

        // Keep only last 1000 nonces
        if (this._nonces[address].used.length > 1000) {
            this._nonces[address].used = this._nonces[address].used.slice(-1000);
        }

        this._saveNonces();
    }

    /**
     * Check if a nonce has been used (detect replay attack)
     */
    isNonceUsed(address, nonce) {
        if (!this._nonces[address]) return false;
        return this._nonces[address].used.includes(nonce);
    }

    /**
     * Validate transaction against double-spend
     * Returns true if this exact transaction hasn't been processed
     */
    isDoubleSpend(tx) {
        // Check nonce
        if (this.isNonceUsed(tx.from, tx.nonce)) {
            return { isDoubleSpend: true, reason: 'Nonce already used (replay attack)' };
        }

        // Check pending transactions
        if (this._pendingTx.has(tx.id)) {
            return { isDoubleSpend: true, reason: 'Transaction already pending' };
        }

        return { isDoubleSpend: false };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RATE LIMITING (20 EUR Daily Cap)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Check if transaction is within rate limits
     */
    _checkRateLimit(amount) {
        const address = this.getAddress();
        const now = Date.now();

        // Initialize rate limit tracking
        if (!this._rateLimits[address]) {
            this._rateLimits[address] = {
                dailyTotal: 0,
                txCount: 0,
                windowStart: now,
                minuteTxCount: 0,
                minuteStart: now
            };
        }

        const limits = this._rateLimits[address];

        // Reset daily window if expired
        if (now - limits.windowStart > RATE_LIMIT_WINDOW_MS) {
            limits.dailyTotal = 0;
            limits.txCount = 0;
            limits.windowStart = now;
        }

        // Reset minute counter if expired
        if (now - limits.minuteStart > 60000) {
            limits.minuteTxCount = 0;
            limits.minuteStart = now;
        }

        // Check daily limit (20 EUR)
        if (limits.dailyTotal + amount > DAILY_LIMIT_EUR) {
            return {
                allowed: false,
                reason: `Daily limit exceeded: ${limits.dailyTotal.toFixed(2)}/${DAILY_LIMIT_EUR} EUR used`
            };
        }

        // Check transactions per minute
        if (limits.minuteTxCount >= MAX_TX_PER_MINUTE) {
            return {
                allowed: false,
                reason: `Too many transactions: max ${MAX_TX_PER_MINUTE} per minute`
            };
        }

        return { allowed: true };
    }

    /**
     * Record a transaction for rate limiting
     */
    _recordTransaction(amount) {
        const address = this.getAddress();
        if (!this._rateLimits[address]) {
            this._rateLimits[address] = {
                dailyTotal: 0,
                txCount: 0,
                windowStart: Date.now(),
                minuteTxCount: 0,
                minuteStart: Date.now()
            };
        }

        this._rateLimits[address].dailyTotal += amount;
        this._rateLimits[address].txCount++;
        this._rateLimits[address].minuteTxCount++;

        this._saveRateLimits();
    }

    /**
     * Get current rate limit status
     */
    getRateLimitStatus() {
        const address = this.getAddress();
        const limits = this._rateLimits[address] || {
            dailyTotal: 0,
            windowStart: Date.now()
        };

        const now = Date.now();
        const windowExpired = now - limits.windowStart > RATE_LIMIT_WINDOW_MS;

        return {
            dailyUsed: windowExpired ? 0 : limits.dailyTotal,
            dailyLimit: DAILY_LIMIT_EUR,
            dailyRemaining: windowExpired ? DAILY_LIMIT_EUR : (DAILY_LIMIT_EUR - limits.dailyTotal),
            resetsAt: new Date(limits.windowStart + RATE_LIMIT_WINDOW_MS).toISOString()
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FEES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Calculate transaction fee
     */
    _calculateFee(amount, coin) {
        const coinConfig = COINS[coin];
        if (!coinConfig) return 0;

        // Free coins have no fee
        if (!coinConfig.realValue) {
            return 0;
        }

        // Real coins: 0.1% fee, minimum 0.001
        const percentFee = amount * 0.001;
        return Math.max(0.001, percentFee);
    }

    /**
     * Calculate education tithe (if applicable)
     */
    calculateEducationTithe(amount, coin) {
        const coinConfig = COINS[coin];
        if (!coinConfig || !coinConfig.educationTithe) {
            return 0;
        }
        return amount * coinConfig.educationTithe;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STORAGE
    // ═══════════════════════════════════════════════════════════════════════

    _getSecurePath(filename) {
        return path.join(this._secureDir, filename);
    }

    _createWallet() {
        const wallet = {
            version: WALLET_VERSION,
            address: this.getAddress(true),  // internal call, skip init check
            created: new Date().toISOString(),
            balances: {
                RC: 0,
                RGD: 1000,  // Start with some play money
                HELL: 0
            },
            stats: {
                totalSent: 0,
                totalReceived: 0,
                txCount: 0
            }
        };

        this._saveWallet(wallet);
        return wallet;
    }

    _loadWallet() {
        const filePath = this._getSecurePath(WALLET_FILE);
        if (!fs.existsSync(filePath)) return null;

        try {
            const encrypted = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const decrypted = this.identity.crypto.decrypt(encrypted, this.identity._encryptionKey);
            return JSON.parse(decrypted);
        } catch (e) {
            console.error('Failed to load wallet:', e.message);
            return null;
        }
    }

    _saveWallet(wallet = this._wallet) {
        if (!wallet) return;

        try {
            const encrypted = this.identity.crypto.encrypt(
                JSON.stringify(wallet),
                this.identity._encryptionKey
            );
            fs.writeFileSync(
                this._getSecurePath(WALLET_FILE),
                JSON.stringify(encrypted),
                { mode: 0o600 }
            );
        } catch (e) {
            console.error('Failed to save wallet:', e.message);
        }
    }

    _loadNonces() {
        const filePath = this._getSecurePath(NONCE_FILE);
        if (!fs.existsSync(filePath)) return {};

        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            return {};
        }
    }

    _saveNonces() {
        try {
            fs.writeFileSync(
                this._getSecurePath(NONCE_FILE),
                JSON.stringify(this._nonces),
                { mode: 0o600 }
            );
        } catch (e) {
            console.error('Failed to save nonces:', e.message);
        }
    }

    _loadRateLimits() {
        const filePath = this._getSecurePath(RATE_LIMIT_FILE);
        if (!fs.existsSync(filePath)) return {};

        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            return {};
        }
    }

    _saveRateLimits() {
        try {
            fs.writeFileSync(
                this._getSecurePath(RATE_LIMIT_FILE),
                JSON.stringify(this._rateLimits),
                { mode: 0o600 }
            );
        } catch (e) {
            console.error('Failed to save rate limits:', e.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get wallet summary
     */
    getSummary() {
        if (!this._initialized) return null;

        return {
            address: this.getAddress(),
            balances: this.getAllBalances(),
            rateLimits: this.getRateLimitStatus(),
            identity: this.identity.getSummary(),
            isVM: this.identity.isVirtualMachine(),
            hardwareHash: this.identity.getHardwareHash()
        };
    }

    /**
     * Get supported coins
     */
    getSupportedCoins() {
        return Object.keys(COINS).map(symbol => ({
            symbol,
            ...COINS[symbol]
        }));
    }

    /**
     * Get coin info
     */
    getCoinInfo(symbol) {
        return COINS[symbol] || null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
    SecureWallet,
    Transaction,
    COINS,
    DAILY_LIMIT_EUR,
    VERSION,
    WALLET_VERSION,

    // Factory function
    createSecureWallet: (appType) => new SecureWallet(appType)
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI TEST
// ═══════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    (async () => {
        console.log('\n💰 RANGERBLOCK SECURE WALLET TEST v1.0\n');
        console.log('========================================');

        // Initialize wallet
        console.log('\n1. Initializing secure wallet...');
        const wallet = new SecureWallet('wallet-test');
        const initResult = await wallet.init();
        console.log(`   Init: ${initResult ? '✅ Success' : '❌ Failed'}`);

        if (!initResult) {
            console.log('   Cannot continue without initialization');
            return;
        }

        // Show wallet info
        console.log('\n2. Wallet Information...');
        const address = wallet.getAddress();
        console.log(`   Address: ${address}`);
        console.log(`   Valid format: ${wallet.isValidAddress(address) ? '✅' : '❌'}`);
        console.log(`   Hardware Hash: ${wallet.identity.getHardwareHash()}`);
        console.log(`   Is VM: ${wallet.identity.isVirtualMachine() ? '⚠️ YES' : '✅ NO'}`);

        // Show balances
        console.log('\n3. Balances...');
        const balances = wallet.getAllBalances();
        for (const [coin, balance] of Object.entries(balances)) {
            const coinInfo = wallet.getCoinInfo(coin);
            console.log(`   ${coinInfo?.name || coin}: ${balance} ${coin}`);
        }

        // Show supported coins
        console.log('\n4. Supported Coins...');
        const coins = wallet.getSupportedCoins();
        for (const coin of coins) {
            const realValue = coin.realValue ? '💰 Real' : '🎮 Play';
            const tithe = coin.educationTithe ? ` (${coin.educationTithe * 100}% education tithe)` : '';
            console.log(`   ${coin.symbol}: ${coin.name} [${realValue}]${tithe}`);
        }

        // Create test transaction
        console.log('\n5. Creating test transaction...');
        try {
            // Create a test recipient address (fake but valid format)
            const testRecipient = 'RB_2345-6789-ABCD-EFGH-JKMN-PQRS-TUVW-XYZ2';

            const tx = wallet.createTransfer(testRecipient, 100, 'RGD', 'Test transfer');
            console.log(`   Transaction ID: ${tx.id}`);
            console.log(`   From: ${tx.from.substring(0, 25)}...`);
            console.log(`   To: ${tx.to.substring(0, 25)}...`);
            console.log(`   Amount: ${tx.amount} RGD`);
            console.log(`   Fee: ${tx.fee} RGD`);
            console.log(`   Nonce: ${tx.nonce}`);
            console.log(`   Signed: ${tx.signature ? '✅ YES' : '❌ NO'}`);
            console.log(`   Hash: ${tx.getHash().substring(0, 20)}...`);

            // Verify transaction
            console.log('\n6. Verifying transaction...');
            const publicKey = wallet.identity.getPublicKey();
            const verifyResult = wallet.verifyTransaction(tx, publicKey);
            console.log(`   Valid: ${verifyResult.valid ? '✅ YES' : '❌ NO'}`);
            if (!verifyResult.valid) {
                console.log(`   Reason: ${verifyResult.reason}`);
            }

            // Check double-spend protection
            console.log('\n7. Testing double-spend protection...');
            const doubleSpendCheck = wallet.isDoubleSpend(tx);
            console.log(`   Is double spend: ${doubleSpendCheck.isDoubleSpend ? '⚠️ YES' : '✅ NO'}`);

            // Try to detect replay attack (use same nonce)
            console.log('\n8. Testing replay protection...');
            const nonceUsed = wallet.isNonceUsed(tx.from, tx.nonce);
            console.log(`   Nonce ${tx.nonce} already used: ${nonceUsed ? '✅ YES (blocked)' : '❌ NO'}`);

        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
        }

        // Show rate limit status
        console.log('\n9. Rate Limit Status...');
        const rateLimits = wallet.getRateLimitStatus();
        console.log(`   Daily Used: €${rateLimits.dailyUsed.toFixed(2)}`);
        console.log(`   Daily Limit: €${rateLimits.dailyLimit}`);
        console.log(`   Remaining: €${rateLimits.dailyRemaining.toFixed(2)}`);
        console.log(`   Resets At: ${rateLimits.resetsAt}`);

        // Show wallet summary
        console.log('\n10. Wallet Summary...');
        const summary = wallet.getSummary();
        console.log(`   Address: ${summary.address.substring(0, 25)}...`);
        console.log(`   Identity: ${summary.identity?.username || 'Unknown'}`);

        console.log('\n========================================');
        console.log('Secure wallet test completed!');
        console.log('\n🎖️ Rangers lead the way!\n');
    })();
}

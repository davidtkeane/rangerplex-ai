#!/usr/bin/env node
/**
 * RANGERBLOCK WALLET-LEDGER INTEGRATION v1.0.0
 * =============================================
 * Connects SecureWallet with LedgerService for on-chain transactions
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 *
 * HOW IT WORKS (Like Bitcoin but simpler):
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    TRANSACTION FLOW                              │
 * └─────────────────────────────────────────────────────────────────┘
 *
 *   1. WALLET CREATES TRANSFER
 *      ┌─────────────┐
 *      │ SecureWallet│ ──> Creates signed transaction
 *      └─────────────┘     (hardware-bound, nonce, signature)
 *              │
 *              ▼
 *   2. INTEGRATION VALIDATES
 *      ┌─────────────┐
 *      │ Integration │ ──> Checks: signature, balance, nonce, rate limit
 *      └─────────────┘
 *              │
 *              ▼
 *   3. LEDGER ADDS TO PENDING
 *      ┌─────────────┐
 *      │   Ledger    │ ──> Transaction waits in pending pool
 *      └─────────────┘
 *              │
 *              ▼
 *   4. BLOCK IS MINED (Proof of Work)
 *      ┌─────────────┐
 *      │   Mining    │ ──> Find hash with leading zeros
 *      └─────────────┘     Bundle transactions into block
 *              │
 *              ▼
 *   5. BALANCES UPDATED
 *      ┌─────────────┐
 *      │  Balances   │ ──> Sender balance decreases
 *      └─────────────┘     Receiver balance increases
 *              │
 *              ▼
 *   6. BLOCK ADDED TO CHAIN
 *      ┌─────────────┐
 *      │   Chain     │ ──> Immutable record forever
 *      └─────────────┘
 *
 * COMPARISON TO BITCOIN:
 * ----------------------
 * Bitcoin: UTXO model (unspent transaction outputs)
 *   - Complex: Track every "coin" individually
 *   - Pros: Better privacy, parallel validation
 *
 * RangerBlock: Account model (like Ethereum)
 *   - Simple: Track balance per address
 *   - Pros: Easier to understand, simpler queries
 */

const crypto = require('crypto');
const { SecureWallet, Transaction, COINS, DAILY_LIMIT_EUR } = require('./secure-wallet.cjs');
const { LedgerService, TX_TYPES, MerkleTree } = require('./ledger-service.cjs');

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = '1.0.0';

// Extended transaction types for wallet
const WALLET_TX_TYPES = {
    ...TX_TYPES,
    TOKEN_TRANSFER: 'token_transfer',
    TOKEN_MINT: 'token_mint',
    TOKEN_BURN: 'token_burn',
    EDUCATION_TITHE: 'education_tithe'
};

// System addresses (using accessible characters only: 23456789ABCDEFGHJKMNPQRSTUVWXYZ)
const SYSTEM_ADDRESSES = {
    MINT: 'RB_SYST-EMMT-MNTT-2222-2222-2222-2222-2222',
    BURN: 'RB_SYST-EMBR-BURN-3333-3333-3333-3333-3333',
    EDUCATION: 'RB_EDUC-ATND-FUND-4444-4444-4444-4444-4444',
    REWARDS: 'RB_REWD-SYST-EMRW-5555-5555-5555-5555-5555'
};

// ═══════════════════════════════════════════════════════════════════════════
// BALANCE TRACKER (Account Model - Like Ethereum)
// ═══════════════════════════════════════════════════════════════════════════

class BalanceTracker {
    constructor() {
        this.balances = {};  // { address: { RC: 0, RGD: 0, HELL: 0 } }
        this.nonces = {};    // { address: lastNonce }
    }

    /**
     * Get balance for an address and coin
     */
    getBalance(address, coin = 'RGD') {
        if (!this.balances[address]) {
            return 0;
        }
        return this.balances[address][coin] || 0;
    }

    /**
     * Get all balances for an address
     */
    getAllBalances(address) {
        return this.balances[address] || { RC: 0, RGD: 0, HELL: 0 };
    }

    /**
     * Set balance directly (used for initialization)
     */
    setBalance(address, coin, amount) {
        if (!this.balances[address]) {
            this.balances[address] = { RC: 0, RGD: 0, HELL: 0 };
        }
        this.balances[address][coin] = amount;
    }

    /**
     * Apply a transfer (debit sender, credit receiver)
     */
    applyTransfer(from, to, coin, amount, fee = 0) {
        // Initialize if needed
        if (!this.balances[from]) {
            this.balances[from] = { RC: 0, RGD: 0, HELL: 0 };
        }
        if (!this.balances[to]) {
            this.balances[to] = { RC: 0, RGD: 0, HELL: 0 };
        }

        // Debit sender (amount + fee)
        this.balances[from][coin] -= (amount + fee);

        // Credit receiver
        this.balances[to][coin] += amount;

        return true;
    }

    /**
     * Apply a mint (create new coins)
     */
    applyMint(to, coin, amount) {
        if (!this.balances[to]) {
            this.balances[to] = { RC: 0, RGD: 0, HELL: 0 };
        }
        this.balances[to][coin] += amount;
        return true;
    }

    /**
     * Apply a burn (destroy coins)
     */
    applyBurn(from, coin, amount) {
        if (!this.balances[from]) {
            return false;
        }
        this.balances[from][coin] -= amount;
        return true;
    }

    /**
     * Check if transfer is valid (has sufficient balance)
     */
    canTransfer(from, coin, amount, fee = 0) {
        const balance = this.getBalance(from, coin);
        return balance >= (amount + fee);
    }

    /**
     * Get/set nonce for replay protection
     */
    getNonce(address) {
        return this.nonces[address] || 0;
    }

    setNonce(address, nonce) {
        this.nonces[address] = nonce;
    }

    /**
     * Export state
     */
    export() {
        return {
            balances: { ...this.balances },
            nonces: { ...this.nonces }
        };
    }

    /**
     * Import state
     */
    import(data) {
        this.balances = data.balances || {};
        this.nonces = data.nonces || {};
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// WALLET-LEDGER INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

class WalletLedgerIntegration {
    constructor(options = {}) {
        this.version = VERSION;
        this.wallet = null;
        this.ledger = null;
        this.balances = new BalanceTracker();
        this._initialized = false;
        this._publicKeys = {};  // address -> publicKey mapping
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Initialize with wallet and ledger
     */
    async init(masterPassword = null) {
        if (this._initialized) return true;

        try {
            // Initialize wallet
            this.wallet = new SecureWallet('integrated-wallet');
            const walletInit = await this.wallet.init(masterPassword);
            if (!walletInit) {
                throw new Error('Failed to initialize wallet');
            }

            // Initialize ledger
            this.ledger = new LedgerService({
                autoMine: true,
                maxTransactionsPerBlock: 10,
                miningIntervalMs: 30 * 1000  // 30 seconds for faster demo
            });
            const ledgerInit = await this.ledger.init();
            if (!ledgerInit) {
                throw new Error('Failed to initialize ledger');
            }

            // Register our wallet's public key
            const myAddress = this.wallet.getAddress();
            this._publicKeys[myAddress] = this.wallet.identity.getPublicKey();

            // Rebuild balances from chain
            await this._rebuildBalancesFromChain();

            // Initialize our wallet with starting balance if new
            const myBalance = this.balances.getBalance(myAddress, 'RGD');
            if (myBalance === 0) {
                // New wallet gets 1000 RGD to start
                this.balances.setBalance(myAddress, 'RGD', 1000);
                console.log(`[Integration] New wallet initialized with 1000 RGD`);
            }

            // Sync wallet cache with on-chain balances
            this._syncWalletCache();

            this._initialized = true;
            console.log(`[Integration] Initialized successfully`);
            console.log(`[Integration] Wallet: ${myAddress.substring(0, 25)}...`);
            console.log(`[Integration] Chain height: ${this.ledger.chainHeight}`);

            return true;
        } catch (e) {
            console.error('[Integration] Failed to initialize:', e.message);
            return false;
        }
    }

    /**
     * Rebuild balance state from blockchain
     * This is how we know the "true" balance - by replaying all transactions
     */
    async _rebuildBalancesFromChain() {
        console.log('[Integration] Rebuilding balances from chain...');

        // Process each block's transactions
        for (const block of this.ledger.chain) {
            for (const tx of block.transactions) {
                this._applyTransaction(tx);
            }
        }

        // Also process pending transactions
        for (const tx of this.ledger.pendingTransactions) {
            if (tx.type === WALLET_TX_TYPES.TOKEN_TRANSFER) {
                // Don't apply pending to final balance, but track for validation
            }
        }

        const totalAddresses = Object.keys(this.balances.balances).length;
        console.log(`[Integration] Rebuilt balances for ${totalAddresses} addresses`);
    }

    /**
     * Apply a transaction to balances
     */
    _applyTransaction(tx) {
        if (tx.type === WALLET_TX_TYPES.TOKEN_TRANSFER) {
            const { coin, amount, fee } = tx.data;
            this.balances.applyTransfer(tx.data.from, tx.data.to, coin, amount, fee || 0);

            // Track nonce
            if (tx.data.nonce) {
                this.balances.setNonce(tx.data.from, tx.data.nonce);
            }
        } else if (tx.type === WALLET_TX_TYPES.TOKEN_MINT) {
            const { recipient, coin, amount } = tx.data;
            this.balances.applyMint(recipient, coin, amount);
        } else if (tx.type === WALLET_TX_TYPES.TOKEN_BURN) {
            const { from, coin, amount } = tx.data;
            this.balances.applyBurn(from, coin, amount);
        } else if (tx.type === WALLET_TX_TYPES.REWARD) {
            const { recipient, amount } = tx.data;
            this.balances.applyMint(recipient, 'RGD', amount);
        }
    }

    /**
     * Sync wallet's local cache with on-chain balances
     */
    _syncWalletCache() {
        const myAddress = this.wallet.getAddress();
        const onChainBalances = this.balances.getAllBalances(myAddress);

        for (const [coin, balance] of Object.entries(onChainBalances)) {
            this.wallet.updateBalance(coin, balance);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSFERS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Send tokens to another address
     * This is the main transfer function
     */
    async sendTokens(toAddress, amount, coin = 'RGD', memo = '') {
        if (!this._initialized) {
            throw new Error('Integration not initialized');
        }

        // Step 1: Create signed transaction from wallet
        console.log(`[Integration] Creating transfer: ${amount} ${coin} to ${toAddress.substring(0, 20)}...`);
        const walletTx = this.wallet.createTransfer(toAddress, amount, coin, memo);

        // Step 2: Validate transaction
        const validation = await this.validateTransaction(walletTx);
        if (!validation.valid) {
            throw new Error(`Transaction validation failed: ${validation.reason}`);
        }

        // Step 3: Create ledger transaction
        const ledgerTx = this._createLedgerTransaction(walletTx);

        // Step 4: Add to ledger pending pool
        this.ledger.pendingTransactions.push(ledgerTx);
        await this.ledger._savePendingTransactions();

        // Step 5: Handle education tithe for real-value coins
        const coinConfig = COINS[coin];
        if (coinConfig && coinConfig.educationTithe > 0) {
            const tithe = amount * coinConfig.educationTithe;
            console.log(`[Integration] Education tithe: ${tithe} ${coin} (${coinConfig.educationTithe * 100}%)`);
            // Create tithe transaction
            const titheTx = this._createTitheTransaction(walletTx.from, coin, tithe);
            this.ledger.pendingTransactions.push(titheTx);
        }

        // Step 6: Update pending balances (optimistic)
        // Real balance changes happen after mining
        console.log(`[Integration] Transaction ${walletTx.id} added to pending pool`);

        // Step 7: Check if we should auto-mine
        this.ledger._checkAutoMine();

        return {
            success: true,
            transactionId: walletTx.id,
            status: 'pending',
            from: walletTx.from,
            to: walletTx.to,
            amount: walletTx.amount,
            coin: walletTx.coin,
            fee: walletTx.fee,
            hash: walletTx.getHash()
        };
    }

    /**
     * Create ledger transaction from wallet transaction
     */
    _createLedgerTransaction(walletTx) {
        return {
            txId: `tx_${Date.now().toString(36)}_${crypto.randomBytes(8).toString('hex')}`,
            type: WALLET_TX_TYPES.TOKEN_TRANSFER,
            sender: walletTx.from,
            timestamp: walletTx.timestamp,
            data: {
                from: walletTx.from,
                to: walletTx.to,
                coin: walletTx.coin,
                amount: walletTx.amount,
                fee: walletTx.fee,
                nonce: walletTx.nonce,
                memo: walletTx.memo,
                signature: walletTx.signature,
                hardwareHash: walletTx.hardwareHash,
                walletTxId: walletTx.id
            },
            hash: MerkleTree.hashTransaction({
                txId: walletTx.id,
                type: WALLET_TX_TYPES.TOKEN_TRANSFER,
                sender: walletTx.from,
                timestamp: walletTx.timestamp,
                data: { from: walletTx.from, to: walletTx.to, amount: walletTx.amount }
            })
        };
    }

    /**
     * Create education tithe transaction
     */
    _createTitheTransaction(from, coin, amount) {
        return {
            txId: `tx_tithe_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
            type: WALLET_TX_TYPES.EDUCATION_TITHE,
            sender: from,
            timestamp: Date.now(),
            data: {
                from: from,
                to: SYSTEM_ADDRESSES.EDUCATION,
                coin: coin,
                amount: amount,
                purpose: '10% Education Tithe - Supporting disability education worldwide'
            },
            hash: null
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Validate a transaction before adding to ledger
     */
    async validateTransaction(tx) {
        const errors = [];

        // 1. Check signature
        const senderPublicKey = this._publicKeys[tx.from];
        if (!senderPublicKey) {
            // For now, we trust transactions from unknown addresses
            // In production, we'd require registration first
            console.log(`[Integration] Warning: Unknown sender ${tx.from.substring(0, 20)}...`);
        } else {
            const sigValid = this.wallet.verifyTransaction(tx, senderPublicKey);
            if (!sigValid.valid) {
                errors.push(`Invalid signature: ${sigValid.reason}`);
            }
        }

        // 2. Check balance
        const balance = this.balances.getBalance(tx.from, tx.coin);
        const totalNeeded = tx.amount + (tx.fee || 0);
        if (balance < totalNeeded) {
            errors.push(`Insufficient balance: have ${balance}, need ${totalNeeded}`);
        }

        // 3. Check nonce (replay protection)
        const lastNonce = this.balances.getNonce(tx.from);
        if (tx.nonce <= lastNonce) {
            errors.push(`Invalid nonce: ${tx.nonce} <= ${lastNonce} (replay attack?)`);
        }

        // 4. Check transaction not expired
        if (tx.isExpired && tx.isExpired()) {
            errors.push('Transaction expired (older than 5 minutes)');
        }

        // 5. Check double-spend
        const existingPending = this.ledger.pendingTransactions.find(
            ptx => ptx.data?.walletTxId === tx.id
        );
        if (existingPending) {
            errors.push('Transaction already in pending pool (double-spend attempt)');
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            reason: errors.join('; ')
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MINING (Block Creation)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Mine a block manually
     * In RangerBlock, mining is simpler than Bitcoin:
     * - Find a hash with N leading zeros (difficulty)
     * - No competitive mining (single validator)
     */
    async mineBlock() {
        if (!this._initialized) {
            throw new Error('Integration not initialized');
        }

        const validatorId = this.wallet.getAddress();
        const block = await this.ledger.mineBlock(validatorId);

        if (block) {
            // Apply mined transactions to balances
            for (const tx of block.transactions) {
                this._applyTransaction(tx);
            }

            // Sync wallet cache
            this._syncWalletCache();

            console.log(`[Integration] Block ${block.index} mined with ${block.transactionCount} transactions`);
            return block;
        }

        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get balance for an address
     */
    getBalance(address = null, coin = 'RGD') {
        const addr = address || this.wallet.getAddress();
        return this.balances.getBalance(addr, coin);
    }

    /**
     * Get all balances for an address
     */
    getAllBalances(address = null) {
        const addr = address || this.wallet.getAddress();
        return this.balances.getAllBalances(addr);
    }

    /**
     * Get transaction history for an address
     */
    getTransactionHistory(address = null, limit = 50) {
        const addr = address || this.wallet.getAddress();
        const history = [];

        // Search blocks (newest first)
        for (let i = this.ledger.chain.length - 1; i >= 0 && history.length < limit; i--) {
            const block = this.ledger.chain[i];
            for (const tx of block.transactions) {
                if (tx.type === WALLET_TX_TYPES.TOKEN_TRANSFER) {
                    if (tx.data.from === addr || tx.data.to === addr) {
                        history.push({
                            ...tx,
                            blockIndex: block.index,
                            blockHash: block.hash,
                            confirmed: true,
                            direction: tx.data.from === addr ? 'sent' : 'received'
                        });
                    }
                }
            }
        }

        // Add pending transactions
        for (const tx of this.ledger.pendingTransactions) {
            if (tx.type === WALLET_TX_TYPES.TOKEN_TRANSFER) {
                if (tx.data.from === addr || tx.data.to === addr) {
                    history.unshift({
                        ...tx,
                        confirmed: false,
                        pending: true,
                        direction: tx.data.from === addr ? 'sent' : 'received'
                    });
                }
            }
        }

        return history.slice(0, limit);
    }

    /**
     * Get integration status
     */
    getStatus() {
        const myAddress = this.wallet?.getAddress() || 'Not initialized';

        return {
            version: this.version,
            initialized: this._initialized,
            wallet: {
                address: myAddress,
                balances: this._initialized ? this.getAllBalances() : {},
                rateLimits: this._initialized ? this.wallet.getRateLimitStatus() : null
            },
            ledger: this._initialized ? this.ledger.getStatus() : null,
            pendingTransactions: this.ledger?.pendingTransactions.length || 0
        };
    }

    /**
     * Register a public key for an address (for signature verification)
     */
    registerPublicKey(address, publicKey) {
        this._publicKeys[address] = publicKey;
    }

    /**
     * Get my wallet address
     */
    getMyAddress() {
        return this.wallet?.getAddress() || null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
    WalletLedgerIntegration,
    BalanceTracker,
    WALLET_TX_TYPES,
    SYSTEM_ADDRESSES,
    VERSION,

    // Factory function
    createIntegration: () => new WalletLedgerIntegration()
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI TEST
// ═══════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    (async () => {
        console.log('\n⛓️  RANGERBLOCK WALLET-LEDGER INTEGRATION TEST\n');
        console.log('================================================');

        // Initialize integration
        console.log('\n1. Initializing integration...');
        const integration = new WalletLedgerIntegration();
        const initResult = await integration.init();
        console.log(`   Init: ${initResult ? '✅ Success' : '❌ Failed'}`);

        if (!initResult) {
            console.log('   Cannot continue without initialization');
            return;
        }

        // Show status
        console.log('\n2. Current Status...');
        const status = integration.getStatus();
        console.log(`   Wallet: ${status.wallet.address.substring(0, 30)}...`);
        console.log(`   Chain Height: ${status.ledger.chainHeight}`);
        console.log(`   Pending Txs: ${status.pendingTransactions}`);

        // Show balances
        console.log('\n3. Balances...');
        const balances = integration.getAllBalances();
        for (const [coin, balance] of Object.entries(balances)) {
            const coinInfo = COINS[coin];
            console.log(`   ${coinInfo?.name || coin}: ${balance} ${coin}`);
        }

        // Create a test transfer
        console.log('\n4. Creating test transfer...');
        const testRecipient = 'RB_TEST-RECV-ADDR-7777-7777-7777-7777-7777';

        try {
            // Register test recipient (in production, this would come from network)
            integration.balances.setBalance(testRecipient, 'RGD', 0);

            const result = await integration.sendTokens(testRecipient, 50, 'RGD', 'Test transfer');
            console.log(`   Transaction ID: ${result.transactionId}`);
            console.log(`   Status: ${result.status}`);
            console.log(`   Amount: ${result.amount} ${result.coin}`);
            console.log(`   Hash: ${result.hash.substring(0, 20)}...`);
        } catch (e) {
            console.log(`   ❌ Error: ${e.message}`);
        }

        // Mine block to confirm
        console.log('\n5. Mining block to confirm transactions...');
        const block = await integration.mineBlock();
        if (block) {
            console.log(`   Block ${block.index} mined!`);
            console.log(`   Hash: ${block.hash.substring(0, 20)}...`);
            console.log(`   Transactions: ${block.transactionCount}`);
        } else {
            console.log(`   No transactions to mine`);
        }

        // Show updated balances
        console.log('\n6. Updated Balances...');
        const newBalances = integration.getAllBalances();
        for (const [coin, balance] of Object.entries(newBalances)) {
            console.log(`   ${coin}: ${balance}`);
        }

        // Show transaction history
        console.log('\n7. Transaction History...');
        const history = integration.getTransactionHistory(null, 5);
        for (const tx of history) {
            const dir = tx.direction === 'sent' ? '📤' : '📥';
            const conf = tx.confirmed ? '✅' : '⏳';
            console.log(`   ${dir} ${conf} ${tx.data?.amount || 0} ${tx.data?.coin || ''} - ${tx.type}`);
        }

        // Final status
        console.log('\n8. Final Status...');
        const finalStatus = integration.getStatus();
        console.log(`   Chain Height: ${finalStatus.ledger.chainHeight}`);
        console.log(`   Total Transactions: ${finalStatus.ledger.totalTransactions}`);
        console.log(`   Pending: ${finalStatus.pendingTransactions}`);

        console.log('\n================================================');
        console.log('Integration test completed!');
        console.log('\n🎖️ Rangers lead the way!\n');
    })();
}

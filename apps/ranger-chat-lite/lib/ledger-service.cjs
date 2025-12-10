#!/usr/bin/env node
/**
 * RANGERBLOCK LEDGER SERVICE v1.0.0
 * ==================================
 * Standalone blockchain ledger for RangerChat Lite
 * Wallet-ready architecture for future token integration
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 *
 * Features:
 * - Persistent message ledger with blockchain structure
 * - Block mining with configurable triggers
 * - Merkle tree for transaction verification
 * - Wallet-ready balance tracking (future)
 * - Export/import for backup and audit trails
 *
 * Storage Location:
 * ~/.rangerblock/ledger/
 * ├── chain.json          # Blockchain state + block hashes
 * ├── blocks/             # Individual block files
 * │   ├── block_0.json    # Genesis block
 * │   └── block_N.json
 * ├── pending.json        # Pending transactions (not yet mined)
 * ├── wallets.json        # Wallet balances (future)
 * └── index/              # Quick lookup indexes
 *     ├── messages.json   # Message hash → block number
 *     └── users.json      # User ID → transaction list
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = '1.0.0';
const GENESIS_TIMESTAMP = 1701648000000; // Dec 4, 2025

// Mining configuration
const DEFAULT_MINING_CONFIG = {
    difficulty: 2,                    // Number of leading zeros required in hash
    maxTransactionsPerBlock: 10,      // Mine when this many pending txs
    miningIntervalMs: 5 * 60 * 1000,  // Or mine every 5 minutes
    autoMine: true                    // Automatically mine blocks
};

// Transaction types (wallet-ready)
const TX_TYPES = {
    CHAT_MESSAGE: 'chat_message',
    IDENTITY_REGISTER: 'identity_register',
    CHANNEL_JOIN: 'channel_join',
    CHANNEL_LEAVE: 'channel_leave',
    // Future wallet types
    TOKEN_TRANSFER: 'token_transfer',
    TOKEN_MINT: 'token_mint',
    TOKEN_BURN: 'token_burn',
    REWARD: 'reward'
};

// Storage paths
const LEDGER_PATHS = {
    BASE: path.join(os.homedir(), '.rangerblock', 'ledger'),
    CHAIN: 'chain.json',
    PENDING: 'pending.json',
    WALLETS: 'wallets.json',
    BLOCKS_DIR: 'blocks',
    INDEX_DIR: 'index',
    MESSAGES_INDEX: 'messages.json',
    USERS_INDEX: 'users.json'
};

// ═══════════════════════════════════════════════════════════════════════════
// MERKLE TREE
// ═══════════════════════════════════════════════════════════════════════════

class MerkleTree {
    /**
     * Build a Merkle tree from an array of transactions
     * @param {Array} transactions - Array of transaction objects
     * @returns {string} Merkle root hash
     */
    static buildRoot(transactions) {
        if (!transactions || transactions.length === 0) {
            return crypto.createHash('sha256').update('empty').digest('hex');
        }

        // Get leaf hashes (transaction hashes)
        let hashes = transactions.map(tx =>
            typeof tx === 'string' ? tx : MerkleTree.hashTransaction(tx)
        );

        // Build tree bottom-up
        while (hashes.length > 1) {
            const newLevel = [];
            for (let i = 0; i < hashes.length; i += 2) {
                const left = hashes[i];
                const right = hashes[i + 1] || left; // Duplicate if odd
                const combined = crypto.createHash('sha256')
                    .update(left + right)
                    .digest('hex');
                newLevel.push(combined);
            }
            hashes = newLevel;
        }

        return hashes[0];
    }

    /**
     * Hash a transaction object
     */
    static hashTransaction(tx) {
        const data = JSON.stringify({
            txId: tx.txId,
            type: tx.type,
            sender: tx.sender,
            timestamp: tx.timestamp,
            data: tx.data
        });
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Verify a transaction exists in the merkle root
     * @param {string} txHash - Transaction hash to verify
     * @param {Array} proof - Merkle proof (sibling hashes)
     * @param {string} root - Expected merkle root
     * @returns {boolean}
     */
    static verify(txHash, proof, root) {
        let hash = txHash;
        for (const { sibling, position } of proof) {
            if (position === 'left') {
                hash = crypto.createHash('sha256').update(sibling + hash).digest('hex');
            } else {
                hash = crypto.createHash('sha256').update(hash + sibling).digest('hex');
            }
        }
        return hash === root;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOCK CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Block {
    constructor(index, previousHash, transactions, timestamp = Date.now()) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.transactionCount = transactions.length;
        this.merkleRoot = MerkleTree.buildRoot(transactions);
        this.nonce = 0;
        this.hash = '';
        this.validator = null;
    }

    /**
     * Calculate block hash
     */
    calculateHash() {
        const data = JSON.stringify({
            index: this.index,
            previousHash: this.previousHash,
            timestamp: this.timestamp,
            merkleRoot: this.merkleRoot,
            nonce: this.nonce
        });
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Mine the block (Proof of Work)
     * @param {number} difficulty - Number of leading zeros required
     */
    mine(difficulty) {
        const target = '0'.repeat(difficulty);
        while (!this.hash.startsWith(target)) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        return this.hash;
    }

    /**
     * Convert block to plain object for storage
     */
    toJSON() {
        return {
            index: this.index,
            hash: this.hash,
            previousHash: this.previousHash,
            timestamp: this.timestamp,
            merkleRoot: this.merkleRoot,
            nonce: this.nonce,
            transactionCount: this.transactionCount,
            transactions: this.transactions,
            validator: this.validator
        };
    }

    /**
     * Create Block instance from JSON
     */
    static fromJSON(json) {
        const block = new Block(
            json.index,
            json.previousHash,
            json.transactions,
            json.timestamp
        );
        block.hash = json.hash;
        block.nonce = json.nonce;
        block.merkleRoot = json.merkleRoot;
        block.validator = json.validator;
        return block;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// LEDGER SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class LedgerService {
    constructor(config = {}) {
        this.version = VERSION;
        this.config = { ...DEFAULT_MINING_CONFIG, ...config };
        this.basePath = config.basePath || LEDGER_PATHS.BASE;

        // Chain state
        this.chain = [];
        this.pendingTransactions = [];
        this.chainHeight = 0;
        this.lastBlockHash = '0';

        // Indexes for fast lookup
        this.messageIndex = {};  // contentHash → { blockIndex, txIndex }
        this.userIndex = {};     // userId → [txId, ...]

        // Wallet balances (future use)
        this.wallets = {};

        // Mining state
        this.miningTimer = null;
        this._initialized = false;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Initialize the ledger service
     */
    async init() {
        if (this._initialized) return true;

        try {
            // Create directory structure
            this._ensureDirectories();

            // Load existing chain state
            await this._loadChainState();

            // Load indexes
            await this._loadIndexes();

            // Load wallets
            await this._loadWallets();

            // Create genesis block if chain is empty
            if (this.chain.length === 0) {
                await this._createGenesisBlock();
            }

            // Start auto-mining if enabled
            if (this.config.autoMine) {
                this._startAutoMining();
            }

            this._initialized = true;
            console.log(`[Ledger] Initialized. Chain height: ${this.chainHeight}, Pending: ${this.pendingTransactions.length}`);
            return true;
        } catch (e) {
            console.error('[Ledger] Failed to initialize:', e.message);
            return false;
        }
    }

    /**
     * Shutdown the ledger service
     */
    async shutdown() {
        if (this.miningTimer) {
            clearInterval(this.miningTimer);
            this.miningTimer = null;
        }

        // Save any pending state
        await this._savePendingTransactions();
        await this._saveIndexes();

        console.log('[Ledger] Shutdown complete');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSACTION MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Add a chat message to the ledger
     * @param {object} message - Message object
     * @param {string} message.sender - Sender user ID
     * @param {string} message.senderName - Sender display name
     * @param {string} message.content - Message content
     * @param {string} message.channel - Channel name
     * @param {string} message.signature - RSA signature (optional)
     * @returns {object} Transaction object
     */
    addMessage(message) {
        const tx = this._createTransaction(TX_TYPES.CHAT_MESSAGE, message.sender, {
            senderName: message.senderName,
            content: message.content,
            contentHash: this._hashContent(message.content),
            channel: message.channel || '#general',
            signature: message.signature || null
        });

        this.pendingTransactions.push(tx);
        this._updateUserIndex(message.sender, tx.txId);
        this._savePendingTransactions();

        // Check if we should mine
        this._checkAutoMine();

        return tx;
    }

    /**
     * Add identity registration to ledger
     */
    addIdentityRegistration(identity) {
        const tx = this._createTransaction(TX_TYPES.IDENTITY_REGISTER, identity.userId, {
            username: identity.username,
            nodeId: identity.nodeId,
            publicKey: identity.publicKey,
            hardwareFingerprint: identity.hardwareFingerprint
        });

        this.pendingTransactions.push(tx);
        this._updateUserIndex(identity.userId, tx.txId);
        this._savePendingTransactions();

        return tx;
    }

    /**
     * Add channel join/leave event
     */
    addChannelEvent(userId, channel, isJoin) {
        const type = isJoin ? TX_TYPES.CHANNEL_JOIN : TX_TYPES.CHANNEL_LEAVE;
        const tx = this._createTransaction(type, userId, { channel });

        this.pendingTransactions.push(tx);
        this._savePendingTransactions();

        return tx;
    }

    /**
     * Create a transaction object
     */
    _createTransaction(type, sender, data) {
        const tx = {
            txId: this._generateTxId(),
            type: type,
            sender: sender,
            timestamp: Date.now(),
            data: data,
            hash: null
        };
        tx.hash = MerkleTree.hashTransaction(tx);
        return tx;
    }

    /**
     * Generate unique transaction ID
     */
    _generateTxId() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(8).toString('hex');
        return `tx_${timestamp}_${random}`;
    }

    /**
     * Hash message content
     */
    _hashContent(content) {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BLOCK MINING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Mine a new block with pending transactions
     * @param {string} validatorId - ID of the validating node
     * @returns {Block|null} Mined block or null if no pending txs
     */
    async mineBlock(validatorId = 'local') {
        if (this.pendingTransactions.length === 0) {
            return null;
        }

        // Get transactions to include
        const txsToMine = this.pendingTransactions.splice(
            0,
            this.config.maxTransactionsPerBlock
        );

        // Create new block
        const block = new Block(
            this.chainHeight,
            this.lastBlockHash,
            txsToMine
        );

        // Set validator info
        block.validator = {
            nodeId: validatorId,
            timestamp: Date.now()
        };

        // Mine the block
        console.log(`[Ledger] Mining block ${block.index} with ${txsToMine.length} transactions...`);
        const startTime = Date.now();
        block.mine(this.config.difficulty);
        const mineTime = Date.now() - startTime;
        console.log(`[Ledger] Block ${block.index} mined in ${mineTime}ms. Hash: ${block.hash.substring(0, 16)}...`);

        // Add to chain
        this.chain.push(block);
        this.chainHeight = block.index + 1;
        this.lastBlockHash = block.hash;

        // Update indexes
        this._indexBlock(block);

        // Save block and state
        await this._saveBlock(block);
        await this._saveChainState();
        await this._savePendingTransactions();
        await this._saveIndexes();

        return block;
    }

    /**
     * Check if we should auto-mine
     */
    _checkAutoMine() {
        if (!this.config.autoMine) return;

        if (this.pendingTransactions.length >= this.config.maxTransactionsPerBlock) {
            this.mineBlock();
        }
    }

    /**
     * Start auto-mining timer
     */
    _startAutoMining() {
        if (this.miningTimer) return;

        this.miningTimer = setInterval(async () => {
            if (this.pendingTransactions.length > 0) {
                await this.mineBlock();
            }
        }, this.config.miningIntervalMs);

        console.log(`[Ledger] Auto-mining enabled. Interval: ${this.config.miningIntervalMs / 1000}s`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get ledger status
     */
    getStatus() {
        return {
            version: this.version,
            chainHeight: this.chainHeight,
            lastBlockHash: this.lastBlockHash,
            pendingTransactions: this.pendingTransactions.length,
            totalTransactions: this._countTotalTransactions(),
            totalMessages: this._countMessages(),
            totalUsers: Object.keys(this.userIndex).length,
            lastBlockTime: this.chain.length > 0
                ? this.chain[this.chain.length - 1].timestamp
                : null
        };
    }

    /**
     * Get block by index
     */
    getBlock(index) {
        if (index < 0 || index >= this.chain.length) {
            return null;
        }
        return this.chain[index].toJSON();
    }

    /**
     * Get blocks (paginated)
     */
    getBlocks(page = 0, limit = 10) {
        const start = page * limit;
        const end = start + limit;
        return this.chain.slice(start, end).map(b => b.toJSON());
    }

    /**
     * Get messages by channel
     */
    getMessagesByChannel(channel, page = 0, limit = 50) {
        const messages = [];

        // Search through all blocks (reverse for newest first)
        for (let i = this.chain.length - 1; i >= 0 && messages.length < limit; i--) {
            const block = this.chain[i];
            for (const tx of block.transactions) {
                if (tx.type === TX_TYPES.CHAT_MESSAGE && tx.data.channel === channel) {
                    messages.push({
                        ...tx,
                        blockIndex: block.index,
                        blockHash: block.hash
                    });
                    if (messages.length >= limit) break;
                }
            }
        }

        // Also check pending
        for (const tx of this.pendingTransactions) {
            if (tx.type === TX_TYPES.CHAT_MESSAGE && tx.data.channel === channel) {
                messages.unshift({
                    ...tx,
                    blockIndex: null,
                    blockHash: null,
                    pending: true
                });
            }
        }

        return messages.slice(0, limit);
    }

    /**
     * Get transactions by user
     */
    getTransactionsByUser(userId, page = 0, limit = 50) {
        const txIds = this.userIndex[userId] || [];
        const transactions = [];

        for (const txId of txIds.slice(page * limit, (page + 1) * limit)) {
            const tx = this._findTransaction(txId);
            if (tx) transactions.push(tx);
        }

        return transactions;
    }

    /**
     * Verify a message exists in the ledger
     */
    verifyMessage(contentHash) {
        const location = this.messageIndex[contentHash];
        if (!location) {
            // Check pending
            const pending = this.pendingTransactions.find(
                tx => tx.data?.contentHash === contentHash
            );
            return pending ? { verified: true, pending: true, transaction: pending } : null;
        }

        const block = this.chain[location.blockIndex];
        const tx = block.transactions[location.txIndex];

        return {
            verified: true,
            pending: false,
            blockIndex: location.blockIndex,
            blockHash: block.hash,
            merkleRoot: block.merkleRoot,
            transaction: tx
        };
    }

    /**
     * Find a transaction by ID
     */
    _findTransaction(txId) {
        // Check pending first
        const pending = this.pendingTransactions.find(tx => tx.txId === txId);
        if (pending) return { ...pending, pending: true };

        // Search blocks
        for (const block of this.chain) {
            const tx = block.transactions.find(t => t.txId === txId);
            if (tx) {
                return {
                    ...tx,
                    blockIndex: block.index,
                    blockHash: block.hash,
                    pending: false
                };
            }
        }

        return null;
    }

    /**
     * Count total transactions
     */
    _countTotalTransactions() {
        let count = this.pendingTransactions.length;
        for (const block of this.chain) {
            count += block.transactionCount;
        }
        return count;
    }

    /**
     * Count chat messages
     */
    _countMessages() {
        let count = 0;
        for (const block of this.chain) {
            count += block.transactions.filter(tx => tx.type === TX_TYPES.CHAT_MESSAGE).length;
        }
        count += this.pendingTransactions.filter(tx => tx.type === TX_TYPES.CHAT_MESSAGE).length;
        return count;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WALLET SUPPORT (Future)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get wallet balance (future use)
     */
    getBalance(userId) {
        return this.wallets[userId] || { balance: 0, transactions: [] };
    }

    /**
     * Add reward to wallet (future use)
     */
    addReward(userId, amount, reason) {
        if (!this.wallets[userId]) {
            this.wallets[userId] = { balance: 0, transactions: [] };
        }

        const tx = this._createTransaction(TX_TYPES.REWARD, 'system', {
            recipient: userId,
            amount: amount,
            reason: reason
        });

        this.wallets[userId].balance += amount;
        this.wallets[userId].transactions.push(tx.txId);

        this.pendingTransactions.push(tx);
        this._saveWallets();
        this._savePendingTransactions();

        return tx;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INDEXING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Index a mined block
     */
    _indexBlock(block) {
        block.transactions.forEach((tx, txIndex) => {
            // Index messages by content hash
            if (tx.type === TX_TYPES.CHAT_MESSAGE && tx.data.contentHash) {
                this.messageIndex[tx.data.contentHash] = {
                    blockIndex: block.index,
                    txIndex: txIndex
                };
            }

            // Index by user
            this._updateUserIndex(tx.sender, tx.txId);
        });
    }

    /**
     * Update user index
     */
    _updateUserIndex(userId, txId) {
        if (!this.userIndex[userId]) {
            this.userIndex[userId] = [];
        }
        if (!this.userIndex[userId].includes(txId)) {
            this.userIndex[userId].push(txId);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORT / IMPORT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Export entire chain for backup/audit
     */
    exportChain() {
        return {
            version: this.version,
            exportedAt: new Date().toISOString(),
            chainHeight: this.chainHeight,
            blocks: this.chain.map(b => b.toJSON()),
            pendingTransactions: this.pendingTransactions,
            wallets: this.wallets
        };
    }

    /**
     * Export audit trail for specific user
     */
    exportUserAudit(userId) {
        const transactions = this.getTransactionsByUser(userId, 0, 10000);
        return {
            userId: userId,
            exportedAt: new Date().toISOString(),
            transactionCount: transactions.length,
            transactions: transactions,
            wallet: this.wallets[userId] || null
        };
    }

    /**
     * Import chain from backup
     */
    async importChain(data) {
        if (!data.blocks || !Array.isArray(data.blocks)) {
            throw new Error('Invalid chain data');
        }

        // Validate chain integrity
        for (let i = 1; i < data.blocks.length; i++) {
            if (data.blocks[i].previousHash !== data.blocks[i - 1].hash) {
                throw new Error(`Chain broken at block ${i}`);
            }
        }

        // Import blocks
        this.chain = data.blocks.map(b => Block.fromJSON(b));
        this.chainHeight = this.chain.length;
        this.lastBlockHash = this.chain.length > 0
            ? this.chain[this.chain.length - 1].hash
            : '0';

        // Rebuild indexes
        this.messageIndex = {};
        this.userIndex = {};
        for (const block of this.chain) {
            this._indexBlock(block);
        }

        // Import pending and wallets
        this.pendingTransactions = data.pendingTransactions || [];
        this.wallets = data.wallets || {};

        // Save everything
        await this._saveChainState();
        await this._saveIndexes();
        await this._saveWallets();
        for (const block of this.chain) {
            await this._saveBlock(block);
        }

        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STORAGE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Ensure directory structure exists
     */
    _ensureDirectories() {
        const dirs = [
            this.basePath,
            path.join(this.basePath, LEDGER_PATHS.BLOCKS_DIR),
            path.join(this.basePath, LEDGER_PATHS.INDEX_DIR)
        ];

        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
            }
        }
    }

    /**
     * Load chain state from disk
     */
    async _loadChainState() {
        const chainPath = path.join(this.basePath, LEDGER_PATHS.CHAIN);

        if (!fs.existsSync(chainPath)) {
            return;
        }

        try {
            const data = JSON.parse(fs.readFileSync(chainPath, 'utf8'));
            this.chainHeight = data.chainHeight || 0;
            this.lastBlockHash = data.lastBlockHash || '0';

            // Load blocks
            for (let i = 0; i < this.chainHeight; i++) {
                const block = await this._loadBlock(i);
                if (block) {
                    this.chain.push(block);
                }
            }

            // Load pending transactions
            const pendingPath = path.join(this.basePath, LEDGER_PATHS.PENDING);
            if (fs.existsSync(pendingPath)) {
                this.pendingTransactions = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
            }
        } catch (e) {
            console.error('[Ledger] Error loading chain state:', e.message);
        }
    }

    /**
     * Save chain state to disk
     */
    async _saveChainState() {
        const chainPath = path.join(this.basePath, LEDGER_PATHS.CHAIN);
        const data = {
            version: this.version,
            chainHeight: this.chainHeight,
            lastBlockHash: this.lastBlockHash,
            updatedAt: Date.now()
        };
        fs.writeFileSync(chainPath, JSON.stringify(data, null, 2));
    }

    /**
     * Load a block from disk
     */
    async _loadBlock(index) {
        const blockPath = path.join(this.basePath, LEDGER_PATHS.BLOCKS_DIR, `block_${index}.json`);

        if (!fs.existsSync(blockPath)) {
            return null;
        }

        try {
            const data = JSON.parse(fs.readFileSync(blockPath, 'utf8'));
            return Block.fromJSON(data);
        } catch (e) {
            console.error(`[Ledger] Error loading block ${index}:`, e.message);
            return null;
        }
    }

    /**
     * Save a block to disk
     */
    async _saveBlock(block) {
        const blockPath = path.join(this.basePath, LEDGER_PATHS.BLOCKS_DIR, `block_${block.index}.json`);
        fs.writeFileSync(blockPath, JSON.stringify(block.toJSON(), null, 2));
    }

    /**
     * Save pending transactions
     */
    async _savePendingTransactions() {
        const pendingPath = path.join(this.basePath, LEDGER_PATHS.PENDING);
        fs.writeFileSync(pendingPath, JSON.stringify(this.pendingTransactions, null, 2));
    }

    /**
     * Load indexes
     */
    async _loadIndexes() {
        const messagesPath = path.join(this.basePath, LEDGER_PATHS.INDEX_DIR, LEDGER_PATHS.MESSAGES_INDEX);
        const usersPath = path.join(this.basePath, LEDGER_PATHS.INDEX_DIR, LEDGER_PATHS.USERS_INDEX);

        if (fs.existsSync(messagesPath)) {
            this.messageIndex = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
        }
        if (fs.existsSync(usersPath)) {
            this.userIndex = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        }
    }

    /**
     * Save indexes
     */
    async _saveIndexes() {
        const messagesPath = path.join(this.basePath, LEDGER_PATHS.INDEX_DIR, LEDGER_PATHS.MESSAGES_INDEX);
        const usersPath = path.join(this.basePath, LEDGER_PATHS.INDEX_DIR, LEDGER_PATHS.USERS_INDEX);

        fs.writeFileSync(messagesPath, JSON.stringify(this.messageIndex, null, 2));
        fs.writeFileSync(usersPath, JSON.stringify(this.userIndex, null, 2));
    }

    /**
     * Load wallets
     */
    async _loadWallets() {
        const walletsPath = path.join(this.basePath, LEDGER_PATHS.WALLETS);
        if (fs.existsSync(walletsPath)) {
            this.wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
        }
    }

    /**
     * Save wallets
     */
    async _saveWallets() {
        const walletsPath = path.join(this.basePath, LEDGER_PATHS.WALLETS);
        fs.writeFileSync(walletsPath, JSON.stringify(this.wallets, null, 2));
    }

    /**
     * Create genesis block
     */
    async _createGenesisBlock() {
        const genesisTx = {
            txId: 'tx_genesis',
            type: 'genesis',
            sender: 'system',
            timestamp: GENESIS_TIMESTAMP,
            data: {
                message: 'RangerBlock Ledger Genesis - Created by IrishRanger',
                version: this.version
            },
            hash: null
        };
        genesisTx.hash = MerkleTree.hashTransaction(genesisTx);

        const genesisBlock = new Block(0, '0', [genesisTx], GENESIS_TIMESTAMP);
        genesisBlock.validator = { nodeId: 'genesis', timestamp: GENESIS_TIMESTAMP };
        genesisBlock.mine(this.config.difficulty);

        this.chain.push(genesisBlock);
        this.chainHeight = 1;
        this.lastBlockHash = genesisBlock.hash;

        await this._saveBlock(genesisBlock);
        await this._saveChainState();

        console.log(`[Ledger] Genesis block created. Hash: ${genesisBlock.hash.substring(0, 16)}...`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

// Create singleton instance
const ledger = new LedgerService();

// Export
module.exports = {
    LedgerService,
    ledger,
    Block,
    MerkleTree,
    TX_TYPES,
    LEDGER_PATHS
};

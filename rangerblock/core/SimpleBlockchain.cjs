#!/usr/bin/env node

/**
 * 🎖️ SimpleBlockchain - Educational Terminal Demo
 *
 * A simple blockchain implementation for learning purposes.
 * Run: node SimpleBlockchain.cjs
 *
 * Features:
 * - Create transactions
 * - Mine blocks with proof of work
 * - Validate blockchain integrity
 * - Interactive terminal interface
 */

const crypto = require('crypto');
const readline = require('readline');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    magenta: '\x1b[35m'
};

class Block {
    constructor(index, timestamp, transactions, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return crypto
            .createHash('sha256')
            .update(
                this.index +
                this.previousHash +
                this.timestamp +
                JSON.stringify(this.transactions) +
                this.nonce
            )
            .digest('hex');
    }

    mineBlock(difficulty) {
        const target = '0'.repeat(difficulty);
        const startTime = Date.now();

        console.log(`${colors.cyan}⛏️  Mining block ${this.index}...${colors.reset}`);

        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();

            // Show progress every 100,000 hashes
            if (this.nonce % 100000 === 0) {
                process.stdout.write(`\r   Nonce: ${this.nonce.toLocaleString()} | Hash: ${this.hash.substring(0, 20)}...`);
            }
        }

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log(`\n${colors.green}✅ Block mined!${colors.reset}`);
        console.log(`   Nonce: ${colors.yellow}${this.nonce.toLocaleString()}${colors.reset}`);
        console.log(`   Hash: ${colors.yellow}${this.hash}${colors.reset}`);
        console.log(`   Time: ${colors.yellow}${duration}s${colors.reset}`);
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 4; // Number of leading zeros required
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    createGenesisBlock() {
        const genesisBlock = new Block(0, Date.now(), [{ sender: 'Genesis', recipient: 'Network', amount: 0 }], '0');
        console.log(`${colors.bright}${colors.magenta}🎖️  Genesis block created!${colors.reset}`);
        return genesisBlock;
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress) {
        // Add mining reward transaction
        this.pendingTransactions.push({
            sender: 'Network',
            recipient: miningRewardAddress,
            amount: this.miningReward
        });

        const block = new Block(
            this.chain.length,
            Date.now(),
            this.pendingTransactions,
            this.getLatestBlock().hash
        );

        block.mineBlock(this.difficulty);

        this.chain.push(block);
        this.pendingTransactions = [];
    }

    createTransaction(sender, recipient, amount) {
        if (!sender || !recipient) {
            console.log(`${colors.red}❌ Invalid transaction: sender and recipient required${colors.reset}`);
            return false;
        }

        if (amount <= 0) {
            console.log(`${colors.red}❌ Invalid transaction: amount must be positive${colors.reset}`);
            return false;
        }

        this.pendingTransactions.push({
            sender,
            recipient,
            amount,
            timestamp: Date.now()
        });

        console.log(`${colors.green}✅ Transaction added to pending pool${colors.reset}`);
        console.log(`   ${sender} → ${recipient}: ${amount} coins`);
        return true;
    }

    getBalanceOfAddress(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.sender === address) {
                    balance -= trans.amount;
                }

                if (trans.recipient === address) {
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

    isChainValid() {
        // Check genesis block
        const genesisBlock = this.chain[0];
        if (genesisBlock.hash !== genesisBlock.calculateHash()) {
            return false;
        }

        // Check rest of chain
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Verify hash
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                console.log(`${colors.red}❌ Invalid hash at block ${i}${colors.reset}`);
                return false;
            }

            // Verify previous hash link
            if (currentBlock.previousHash !== previousBlock.hash) {
                console.log(`${colors.red}❌ Broken chain at block ${i}${colors.reset}`);
                return false;
            }

            // Verify proof of work
            const target = '0'.repeat(this.difficulty);
            if (currentBlock.hash.substring(0, this.difficulty) !== target) {
                console.log(`${colors.red}❌ Invalid proof of work at block ${i}${colors.reset}`);
                return false;
            }
        }

        return true;
    }

    printChain() {
        console.log(`\n${colors.bright}${colors.cyan}📊 Blockchain Status${colors.reset}`);
        console.log(`${'='.repeat(60)}\n`);

        for (const block of this.chain) {
            console.log(`${colors.bright}Block #${block.index}${colors.reset}`);
            console.log(`  Timestamp: ${new Date(block.timestamp).toLocaleString()}`);
            console.log(`  Previous Hash: ${colors.yellow}${block.previousHash.substring(0, 20)}...${colors.reset}`);
            console.log(`  Hash: ${colors.yellow}${block.hash.substring(0, 20)}...${colors.reset}`);
            console.log(`  Nonce: ${block.nonce.toLocaleString()}`);
            console.log(`  Transactions (${block.transactions.length}):`);

            block.transactions.forEach((tx, i) => {
                console.log(`    ${i + 1}. ${tx.sender} → ${tx.recipient}: ${tx.amount} coins`);
            });

            console.log('');
        }

        console.log(`${colors.green}✅ Chain is ${this.isChainValid() ? 'VALID' : 'INVALID'}${colors.reset}`);
        console.log(`${'='.repeat(60)}\n`);
    }
}

class BlockchainDemo {
    constructor() {
        this.blockchain = new Blockchain();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.userAddress = 'Alice';
    }

    showMenu() {
        console.log(`\n${colors.bright}${colors.magenta}🎖️  RangerBlock - Simple Blockchain Demo${colors.reset}`);
        console.log(`${'='.repeat(60)}`);
        console.log(`${colors.cyan}1.${colors.reset} Create Transaction`);
        console.log(`${colors.cyan}2.${colors.reset} Mine Pending Transactions`);
        console.log(`${colors.cyan}3.${colors.reset} View Blockchain`);
        console.log(`${colors.cyan}4.${colors.reset} Check Balance`);
        console.log(`${colors.cyan}5.${colors.reset} Validate Chain`);
        console.log(`${colors.cyan}6.${colors.reset} View Pending Transactions`);
        console.log(`${colors.cyan}7.${colors.reset} Change Difficulty`);
        console.log(`${colors.cyan}8.${colors.reset} Tamper with Chain (test security)`);
        console.log(`${colors.cyan}9.${colors.reset} Exit`);
        console.log(`${'='.repeat(60)}\n`);
    }

    async createTransaction() {
        const sender = await this.question(`Sender [${this.userAddress}]: `) || this.userAddress;
        const recipient = await this.question('Recipient: ');
        const amount = parseFloat(await this.question('Amount: '));

        this.blockchain.createTransaction(sender, recipient, amount);
    }

    minePendingTransactions() {
        if (this.blockchain.pendingTransactions.length === 0) {
            console.log(`${colors.yellow}⚠️  No pending transactions to mine${colors.reset}`);
            return;
        }

        console.log(`\n${colors.cyan}Mining ${this.blockchain.pendingTransactions.length} pending transactions...${colors.reset}`);
        this.blockchain.minePendingTransactions(this.userAddress);
        console.log(`${colors.green}✅ Mining reward: ${this.blockchain.miningReward} coins → ${this.userAddress}${colors.reset}`);
    }

    async checkBalance() {
        const address = await this.question(`Address [${this.userAddress}]: `) || this.userAddress;
        const balance = this.blockchain.getBalanceOfAddress(address);

        console.log(`\n${colors.cyan}💰 Balance of ${address}: ${colors.yellow}${balance} coins${colors.reset}`);
    }

    validateChain() {
        console.log(`\n${colors.cyan}🔍 Validating blockchain...${colors.reset}`);
        const isValid = this.blockchain.isChainValid();

        if (isValid) {
            console.log(`${colors.green}✅ Blockchain is VALID!${colors.reset}`);
        } else {
            console.log(`${colors.red}❌ Blockchain is INVALID! (tampered)${colors.reset}`);
        }
    }

    viewPendingTransactions() {
        console.log(`\n${colors.cyan}📋 Pending Transactions (${this.blockchain.pendingTransactions.length})${colors.reset}`);
        console.log(`${'='.repeat(60)}\n`);

        if (this.blockchain.pendingTransactions.length === 0) {
            console.log(`${colors.yellow}No pending transactions${colors.reset}`);
        } else {
            this.blockchain.pendingTransactions.forEach((tx, i) => {
                console.log(`${i + 1}. ${tx.sender} → ${tx.recipient}: ${tx.amount} coins`);
            });
        }
    }

    async changeDifficulty() {
        const newDifficulty = parseInt(await this.question(`New difficulty (current: ${this.blockchain.difficulty}): `));

        if (newDifficulty >= 1 && newDifficulty <= 6) {
            this.blockchain.difficulty = newDifficulty;
            console.log(`${colors.green}✅ Difficulty changed to ${newDifficulty}${colors.reset}`);
            console.log(`${colors.yellow}⚠️  Mining will now require ${newDifficulty} leading zeros${colors.reset}`);
        } else {
            console.log(`${colors.red}❌ Invalid difficulty (must be 1-6)${colors.reset}`);
        }
    }

    async tamperWithChain() {
        console.log(`\n${colors.red}⚠️  SECURITY TEST: Tampering with blockchain${colors.reset}`);

        if (this.blockchain.chain.length < 2) {
            console.log(`${colors.yellow}Need at least 2 blocks to tamper${colors.reset}`);
            return;
        }

        // Tamper with a random block
        const blockIndex = Math.floor(Math.random() * (this.blockchain.chain.length - 1)) + 1;
        const block = this.blockchain.chain[blockIndex];

        console.log(`\n${colors.yellow}Tampering with block ${blockIndex}...${colors.reset}`);
        console.log(`Original hash: ${block.hash}`);

        // Change transaction amount
        if (block.transactions.length > 0) {
            block.transactions[0].amount = 999999;
            console.log(`${colors.red}Changed transaction amount to 999999${colors.reset}`);
        }

        console.log(`\n${colors.cyan}Validating chain...${colors.reset}`);
        const isValid = this.blockchain.isChainValid();

        if (isValid) {
            console.log(`${colors.red}❌ Blockchain STILL VALID (shouldn't happen!)${colors.reset}`);
        } else {
            console.log(`${colors.green}✅ Blockchain INVALID - tampering detected!${colors.reset}`);
            console.log(`${colors.cyan}This proves the blockchain is secure.${colors.reset}`);
        }
    }

    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(`${colors.cyan}${prompt}${colors.reset} `, (answer) => {
                resolve(answer);
            });
        });
    }

    async run() {
        console.clear();
        console.log(`${colors.bright}${colors.magenta}`);
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║    🎖️  RangerBlock - Simple Blockchain Demo               ║');
        console.log('║    Educational Terminal Interface                          ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log(colors.reset);

        while (true) {
            this.showMenu();
            const choice = await this.question('Select option: ');

            switch (choice) {
                case '1':
                    await this.createTransaction();
                    break;
                case '2':
                    this.minePendingTransactions();
                    break;
                case '3':
                    this.blockchain.printChain();
                    break;
                case '4':
                    await this.checkBalance();
                    break;
                case '5':
                    this.validateChain();
                    break;
                case '6':
                    this.viewPendingTransactions();
                    break;
                case '7':
                    await this.changeDifficulty();
                    break;
                case '8':
                    await this.tamperWithChain();
                    break;
                case '9':
                    console.log(`\n${colors.green}Rangers lead the way! 🎖️${colors.reset}\n`);
                    this.rl.close();
                    process.exit(0);
                    break;
                default:
                    console.log(`${colors.red}Invalid option${colors.reset}`);
            }

            await this.question(`\n${colors.yellow}Press Enter to continue...${colors.reset}`);
            console.clear();
        }
    }
}

// Run demo
if (require.main === module) {
    const demo = new BlockchainDemo();
    demo.run().catch(error => {
        console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
        process.exit(1);
    });
}

module.exports = { Block, Blockchain };

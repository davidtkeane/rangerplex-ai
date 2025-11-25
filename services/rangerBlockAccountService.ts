// RangerBlock Account Service - Pure Node.js/TypeScript
// No Python, No Bash - Just clean JavaScript!

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface BlockchainTransaction {
    type: string;
    node_id: string;
    hardware_serial: string;
    binding_hash: string;
    tx_hash: string;
    node_type: string;
    node_name: string;
    ip_address: string;
}

interface BlockchainBlock {
    block_number: number;
    block_hash: string;
    previous_hash: string;
    timestamp: string;
    transactions: BlockchainTransaction[];
    merkle_root: string;
    validator: string;
    signature: string;
}

interface Blockchain {
    chain: BlockchainBlock[];
    node_count: number;
    last_updated: string;
}

interface RangerBlockAccount {
    nodeId: string;
    nodeName: string;
    nodeType: string;
    ipAddress: string;
    hardwareSerial: string;
    blockNumber: number;
    registered: boolean;
    timestamp: string;
}

class RangerBlockAccountService {
    private blockchainPath: string;

    constructor() {
        // Path to blockchain JSON file
        this.blockchainPath = path.join(
            __dirname,
            '../rangerblock/M3Pro-Genesis/data/genesis_blockchain.json'
        );
    }

    /**
     * Detect Mac hardware serial number
     * Works on M1, M2, M3, M4 - Pure Node.js!
     */
    detectMacHardwareSerial(): string | null {
        try {
            const output = execSync('system_profiler SPHardwareDataType', { encoding: 'utf8' });

            // Extract Hardware UUID
            const match = output.match(/Hardware UUID:\s*(.+)/);
            if (match && match[1]) {
                return match[1].trim();
            }

            return null;
        } catch (error) {
            console.error('Failed to detect Mac hardware serial:', error);
            return null;
        }
    }

    /**
     * Load blockchain from JSON file
     */
    loadBlockchain(): Blockchain | null {
        try {
            if (!fs.existsSync(this.blockchainPath)) {
                console.error('Blockchain file not found:', this.blockchainPath);
                return null;
            }

            const data = fs.readFileSync(this.blockchainPath, 'utf8');
            return JSON.parse(data) as Blockchain;
        } catch (error) {
            console.error('Failed to load blockchain:', error);
            return null;
        }
    }

    /**
     * Find account by hardware serial
     * Searches blockchain for matching registration
     */
    findAccountBySerial(hardwareSerial: string): RangerBlockAccount | null {
        const blockchain = this.loadBlockchain();
        if (!blockchain) return null;

        // Search all blocks for matching hardware serial
        for (const block of blockchain.chain) {
            for (const tx of block.transactions) {
                if (tx.type === 'node_registration' && tx.hardware_serial === hardwareSerial) {
                    return {
                        nodeId: tx.node_id,
                        nodeName: tx.node_name,
                        nodeType: tx.node_type,
                        ipAddress: tx.ip_address,
                        hardwareSerial: tx.hardware_serial,
                        blockNumber: block.block_number,
                        registered: true,
                        timestamp: block.timestamp
                    };
                }
            }
        }

        return null;
    }

    /**
     * Get all registered accounts from blockchain
     */
    getAllAccounts(): RangerBlockAccount[] {
        const blockchain = this.loadBlockchain();
        if (!blockchain) return [];

        const accounts: RangerBlockAccount[] = [];

        for (const block of blockchain.chain) {
            for (const tx of block.transactions) {
                if (tx.type === 'node_registration') {
                    accounts.push({
                        nodeId: tx.node_id,
                        nodeName: tx.node_name,
                        nodeType: tx.node_type,
                        ipAddress: tx.ip_address,
                        hardwareSerial: tx.hardware_serial,
                        blockNumber: block.block_number,
                        registered: true,
                        timestamp: block.timestamp
                    });
                }
            }
        }

        return accounts;
    }

    /**
     * Get current machine's account
     * Auto-detects hardware and finds matching account
     */
    getCurrentAccount(): { found: boolean; serial: string | null; account: RangerBlockAccount | null } {
        const serial = this.detectMacHardwareSerial();

        if (!serial) {
            return { found: false, serial: null, account: null };
        }

        const account = this.findAccountBySerial(serial);

        return {
            found: !!account,
            serial: serial,
            account: account
        };
    }

    /**
     * Check if current machine is registered
     */
    isCurrentMachineRegistered(): boolean {
        const result = this.getCurrentAccount();
        return result.found;
    }

    /**
     * Get machine type (M1, M2, M3, M4)
     */
    getMachineType(): string {
        try {
            const output = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' });

            if (output.includes('M1')) return 'M1';
            if (output.includes('M2')) return 'M2';
            if (output.includes('M3')) return 'M3';
            if (output.includes('M4')) return 'M4';

            return 'Unknown';
        } catch (error) {
            return 'Unknown';
        }
    }

    /**
     * Create new account (adds to blockchain)
     * Pure Node.js implementation!
     */
    async createAccount(nodeName: string, nodeType: string = 'peer'): Promise<RangerBlockAccount> {
        const serial = this.detectMacHardwareSerial();

        if (!serial) {
            throw new Error('Failed to detect hardware serial');
        }

        // Check if already registered
        const existing = this.findAccountBySerial(serial);
        if (existing) {
            throw new Error('Machine already registered');
        }

        const blockchain = this.loadBlockchain();
        if (!blockchain) {
            throw new Error('Failed to load blockchain');
        }

        // Generate node ID
        const nodeId = `${nodeType}_${crypto.randomBytes(8).toString('hex')}`;

        // Get local IP address
        const ipAddress = this.getLocalIPAddress();

        // Create binding hash
        const bindingHash = crypto
            .createHash('sha256')
            .update(serial + nodeId)
            .digest('hex');

        // Create transaction hash
        const txHash = crypto
            .createHash('sha256')
            .update(JSON.stringify({ nodeId, serial, nodeName, nodeType }))
            .digest('hex');

        // Create new transaction
        const transaction: BlockchainTransaction = {
            type: 'node_registration',
            node_id: nodeId,
            hardware_serial: serial,
            binding_hash: bindingHash,
            tx_hash: txHash,
            node_type: nodeType,
            node_name: nodeName,
            ip_address: ipAddress
        };

        // Create new block
        const lastBlock = blockchain.chain[blockchain.chain.length - 1];
        const newBlock: BlockchainBlock = {
            block_number: Math.floor(Date.now() / 1000),
            block_hash: crypto.randomBytes(32).toString('hex'),
            previous_hash: lastBlock.block_hash,
            timestamp: new Date().toISOString(),
            transactions: [transaction],
            merkle_root: txHash,
            validator: 'genesis_node',
            signature: crypto.randomBytes(32).toString('hex')
        };

        // Add block to chain
        blockchain.chain.push(newBlock);
        blockchain.node_count += 1;
        blockchain.last_updated = new Date().toISOString();

        // Save blockchain
        fs.writeFileSync(this.blockchainPath, JSON.stringify(blockchain, null, 2), 'utf8');

        return {
            nodeId,
            nodeName,
            nodeType,
            ipAddress,
            hardwareSerial: serial,
            blockNumber: newBlock.block_number,
            registered: true,
            timestamp: newBlock.timestamp
        };
    }

    /**
     * Get local IP address
     */
    private getLocalIPAddress(): string {
        try {
            const output = execSync('ipconfig getifaddr en0', { encoding: 'utf8' });
            return output.trim();
        } catch (error) {
            return '127.0.0.1';
        }
    }

    /**
     * Get account statistics
     */
    getStats() {
        const blockchain = this.loadBlockchain();
        if (!blockchain) {
            return { totalNodes: 0, totalBlocks: 0 };
        }

        return {
            totalNodes: blockchain.node_count,
            totalBlocks: blockchain.chain.length,
            lastUpdated: blockchain.last_updated
        };
    }
}

// Export singleton instance
export const rangerBlockAccount = new RangerBlockAccountService();

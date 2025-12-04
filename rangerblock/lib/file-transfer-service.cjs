#!/usr/bin/env node
/**
 * RANGERBLOCK FILE TRANSFER SERVICE v1.0.0
 * =========================================
 * Handles formal (contract) and informal file transfers
 * Integrates with ranger-chat-app for /file and /contract commands
 *
 * Features:
 * - Convert files to .rangerblock format
 * - Create transfer contracts on blockchain
 * - Verify file integrity with checksums
 * - Track transfer status
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const os = require('os');

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = '1.0.0';
const RANGERBLOCK_MAGIC = 'RNGBLK01'; // File format identifier
const RANGERBLOCK_DIR = path.join(os.homedir(), '.rangerblock');
const TRANSFERS_DIR = path.join(RANGERBLOCK_DIR, 'transfers');

// Transfer modes
const MODE = {
    INFORMAL: 'informal',   // Direct transfer, no contract
    FORMAL: 'formal'        // Contract-based transfer
};

// Transfer status
const STATUS = {
    PENDING: 'pending',
    WAITING_ACCEPT: 'waiting_accept',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    TRANSFERRING: 'transferring',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};

// ═══════════════════════════════════════════════════════════════════════════
// FILE TRANSFER SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class FileTransferService {
    constructor(identityService = null) {
        this.identity = identityService;
        this.version = VERSION;
        this._initialized = false;
        this._pendingTransfers = new Map();
        this._incomingTransfers = new Map();
        this._acceptingFiles = false;

        // Callbacks
        this._callbacks = {
            onTransferRequest: null,
            onTransferAccepted: null,
            onTransferRejected: null,
            onFileReceived: null,
            onTransferComplete: null
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    init() {
        if (this._initialized) return true;

        try {
            if (!fs.existsSync(TRANSFERS_DIR)) {
                fs.mkdirSync(TRANSFERS_DIR, { recursive: true });
            }

            this._initialized = true;
            return true;
        } catch (e) {
            console.error('Failed to initialize file transfer service:', e.message);
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FILE PACKAGING (.rangerblock format)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Convert any file to .rangerblock format
     * @param {string} filePath - Path to original file
     * @param {object} options - Packaging options
     * @returns {object} Package info with path and hashes
     */
    packageFile(filePath, options = {}) {
        this.init();

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const stats = fs.statSync(filePath);
        const fileName = path.basename(filePath);
        const fileExt = path.extname(filePath);
        const originalData = fs.readFileSync(filePath);

        // Calculate original hash
        const originalHash = crypto.createHash('sha256').update(originalData).digest('hex');

        // Compress data
        const compressedData = zlib.gzipSync(originalData, { level: 9 });
        const compressionRatio = ((1 - compressedData.length / originalData.length) * 100).toFixed(1);

        // Create package metadata
        const metadata = {
            magic: RANGERBLOCK_MAGIC,
            version: this.version,
            originalName: fileName,
            originalExt: fileExt,
            originalSize: stats.size,
            originalHash: originalHash,
            compressedSize: compressedData.length,
            compressionRatio: parseFloat(compressionRatio),
            mimeType: this._getMimeType(fileExt),
            createdAt: new Date().toISOString(),
            senderId: this.identity?.userId || 'unknown',
            signature: null // Will be set if identity service available
        };

        // Sign if identity available
        if (this.identity && this.identity.signData) {
            const metaString = JSON.stringify(metadata);
            metadata.signature = this.identity.signData(metaString);
        }

        // Create .rangerblock package
        const metadataJson = JSON.stringify(metadata);
        const metadataBuffer = Buffer.from(metadataJson);

        // Package format: [4 bytes metadata length][metadata JSON][compressed data]
        const metaLengthBuffer = Buffer.alloc(4);
        metaLengthBuffer.writeUInt32BE(metadataBuffer.length, 0);

        const packageBuffer = Buffer.concat([
            metaLengthBuffer,
            metadataBuffer,
            compressedData
        ]);

        // Calculate package hash
        const packageHash = crypto.createHash('sha256').update(packageBuffer).digest('hex');

        // Save package
        const packageName = `${path.basename(fileName, fileExt)}.rangerblock`;
        const packagePath = path.join(TRANSFERS_DIR, packageName);
        fs.writeFileSync(packagePath, packageBuffer);

        return {
            success: true,
            packagePath,
            packageName,
            originalHash,
            packageHash,
            originalSize: stats.size,
            packageSize: packageBuffer.length,
            compressionRatio: parseFloat(compressionRatio),
            metadata
        };
    }

    /**
     * Extract a .rangerblock file back to original
     * @param {string} packagePath - Path to .rangerblock file
     * @param {string} outputDir - Directory to extract to
     * @returns {object} Extraction result with verification
     */
    extractFile(packagePath, outputDir = null) {
        this.init();

        if (!fs.existsSync(packagePath)) {
            throw new Error(`Package not found: ${packagePath}`);
        }

        const packageData = fs.readFileSync(packagePath);

        // Calculate package hash for verification
        const packageHash = crypto.createHash('sha256').update(packageData).digest('hex');

        // Read metadata length
        const metaLength = packageData.readUInt32BE(0);

        // Extract metadata
        const metadataJson = packageData.slice(4, 4 + metaLength).toString();
        const metadata = JSON.parse(metadataJson);

        // Verify magic number
        if (metadata.magic !== RANGERBLOCK_MAGIC) {
            throw new Error('Invalid .rangerblock file format');
        }

        // Extract compressed data
        const compressedData = packageData.slice(4 + metaLength);

        // Decompress
        const originalData = zlib.gunzipSync(compressedData);

        // Verify hash
        const extractedHash = crypto.createHash('sha256').update(originalData).digest('hex');
        const hashMatch = extractedHash === metadata.originalHash;

        // Determine output path
        const outDir = outputDir || TRANSFERS_DIR;
        const outputPath = path.join(outDir, metadata.originalName);

        // Write original file
        fs.writeFileSync(outputPath, originalData);

        return {
            success: true,
            outputPath,
            fileName: metadata.originalName,
            fileSize: originalData.length,
            originalHash: metadata.originalHash,
            extractedHash,
            packageHash,
            hashMatch,
            verified: hashMatch,
            metadata
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INFORMAL TRANSFER (Direct /file command)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Enable accepting files (receiver side)
     * Usage: /file accept on
     */
    enableAccept() {
        this._acceptingFiles = true;
        return {
            success: true,
            message: 'Now accepting files. Waiting for incoming transfers...'
        };
    }

    /**
     * Disable accepting files
     * Usage: /file accept off
     */
    disableAccept() {
        this._acceptingFiles = false;
        return {
            success: true,
            message: 'File acceptance disabled.'
        };
    }

    /**
     * Check if accepting files
     */
    isAcceptingFiles() {
        return this._acceptingFiles;
    }

    /**
     * Send a file informally (no contract)
     * Usage: /file send <userId> <filePath>
     */
    async sendFile(receiverId, filePath, ws = null) {
        this.init();

        // Package the file
        const pkg = this.packageFile(filePath);

        // Create transfer record
        const transferId = `xfer_${crypto.randomBytes(8).toString('hex')}`;
        const transfer = {
            id: transferId,
            mode: MODE.INFORMAL,
            status: STATUS.PENDING,
            senderId: this.identity?.userId || 'unknown',
            receiverId,
            fileName: path.basename(filePath),
            packagePath: pkg.packagePath,
            originalHash: pkg.originalHash,
            packageHash: pkg.packageHash,
            originalSize: pkg.originalSize,
            packageSize: pkg.packageSize,
            createdAt: new Date().toISOString()
        };

        this._pendingTransfers.set(transferId, transfer);

        // If WebSocket provided, send transfer request
        if (ws) {
            ws.send(JSON.stringify({
                type: 'file_transfer_request',
                transferId,
                senderId: transfer.senderId,
                receiverId,
                fileName: transfer.fileName,
                fileSize: transfer.originalSize,
                packageSize: transfer.packageSize,
                originalHash: transfer.originalHash,
                mode: MODE.INFORMAL
            }));
        }

        return {
            success: true,
            transferId,
            packagePath: pkg.packagePath,
            originalHash: pkg.originalHash,
            packageHash: pkg.packageHash,
            message: `File packaged. Transfer ID: ${transferId}`
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FORMAL TRANSFER (Contract-based)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Create a formal file transfer contract
     * Usage: /contract send <userId> <filePath>
     */
    createTransferContract(receiverId, filePath) {
        this.init();

        // Package the file
        const pkg = this.packageFile(filePath);

        // Create contract
        const contractId = `contract_${crypto.randomBytes(12).toString('hex')}`;
        const contract = {
            contractId,
            mode: MODE.FORMAL,
            status: STATUS.WAITING_ACCEPT,

            // Parties
            senderId: this.identity?.userId || 'unknown',
            senderIdHash: this._hashString(this.identity?.userId || 'unknown'),
            receiverId,
            receiverIdHash: this._hashString(receiverId),

            // File info
            fileName: path.basename(filePath),
            fileType: path.extname(filePath),
            originalHash: pkg.originalHash,
            packageHash: pkg.packageHash,
            originalSize: pkg.originalSize,
            packageSize: pkg.packageSize,
            packagePath: pkg.packagePath,

            // Timestamps
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            acceptedAt: null,
            completedAt: null,

            // Signatures
            senderSignature: null,
            receiverSignature: null,

            // For blockchain
            blockchainTxId: null
        };

        // Sign contract
        if (this.identity && this.identity.signData) {
            const contractData = JSON.stringify({
                senderIdHash: contract.senderIdHash,
                receiverIdHash: contract.receiverIdHash,
                originalHash: contract.originalHash,
                createdAt: contract.createdAt
            });
            contract.senderSignature = this.identity.signData(contractData);
        }

        // Save contract
        const contractPath = path.join(TRANSFERS_DIR, `${contractId}.json`);
        fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2));

        this._pendingTransfers.set(contractId, contract);

        return {
            success: true,
            contractId,
            contract,
            message: `Contract created. Waiting for ${receiverId} to accept.`,
            // Data for blockchain submission
            blockchainData: {
                senderIdHash: contract.senderIdHash,
                receiverIdHash: contract.receiverIdHash,
                fileHash: contract.originalHash,
                fileName: contract.fileName,
                fileSize: contract.originalSize,
                fileType: contract.fileType,
                senderSignature: contract.senderSignature
            }
        };
    }

    /**
     * Accept a formal transfer contract
     * Usage: /contract accept <contractId>
     */
    acceptContract(contractId) {
        const contract = this._incomingTransfers.get(contractId) ||
                        this._loadContract(contractId);

        if (!contract) {
            return { success: false, error: 'Contract not found' };
        }

        if (contract.status !== STATUS.WAITING_ACCEPT) {
            return { success: false, error: 'Contract not pending acceptance' };
        }

        // Check expiry
        if (new Date(contract.expiresAt) < new Date()) {
            contract.status = STATUS.FAILED;
            return { success: false, error: 'Contract has expired' };
        }

        // Accept
        contract.status = STATUS.ACCEPTED;
        contract.acceptedAt = new Date().toISOString();

        // Sign acceptance
        if (this.identity && this.identity.signData) {
            const acceptData = JSON.stringify({
                contractId,
                senderIdHash: contract.senderIdHash,
                receiverIdHash: contract.receiverIdHash,
                acceptedAt: contract.acceptedAt
            });
            contract.receiverSignature = this.identity.signData(acceptData);
        }

        // Save updated contract
        this._saveContract(contract);

        // Trigger callback
        if (this._callbacks.onTransferAccepted) {
            this._callbacks.onTransferAccepted(contract);
        }

        return {
            success: true,
            contractId,
            message: 'Contract accepted. Ready to receive file.',
            receiverSignature: contract.receiverSignature
        };
    }

    /**
     * Reject a formal transfer contract
     * Usage: /contract reject <contractId> [reason]
     */
    rejectContract(contractId, reason = 'Rejected by receiver') {
        const contract = this._incomingTransfers.get(contractId) ||
                        this._loadContract(contractId);

        if (!contract) {
            return { success: false, error: 'Contract not found' };
        }

        contract.status = STATUS.REJECTED;
        contract.rejectReason = reason;
        contract.rejectedAt = new Date().toISOString();

        this._saveContract(contract);

        if (this._callbacks.onTransferRejected) {
            this._callbacks.onTransferRejected(contract, reason);
        }

        return {
            success: true,
            contractId,
            message: `Contract rejected: ${reason}`
        };
    }

    /**
     * Complete a transfer (after file received and verified)
     */
    completeTransfer(contractId, receivedPackagePath) {
        const contract = this._incomingTransfers.get(contractId) ||
                        this._pendingTransfers.get(contractId) ||
                        this._loadContract(contractId);

        if (!contract) {
            return { success: false, error: 'Contract not found' };
        }

        // Extract and verify
        try {
            const result = this.extractFile(receivedPackagePath);

            if (!result.verified) {
                contract.status = STATUS.FAILED;
                contract.failReason = 'Hash verification failed';
                this._saveContract(contract);

                return {
                    success: false,
                    error: 'File verification failed - hashes do not match!',
                    expectedHash: contract.originalHash,
                    receivedHash: result.extractedHash
                };
            }

            // Mark complete
            contract.status = STATUS.COMPLETED;
            contract.completedAt = new Date().toISOString();
            contract.rangerblockHash = result.packageHash;

            this._saveContract(contract);

            if (this._callbacks.onTransferComplete) {
                this._callbacks.onTransferComplete(contract, result);
            }

            return {
                success: true,
                contractId,
                verified: true,
                outputPath: result.outputPath,
                originalHash: contract.originalHash,
                extractedHash: result.extractedHash,
                message: `File verified and extracted: ${result.fileName}`
            };
        } catch (e) {
            contract.status = STATUS.FAILED;
            contract.failReason = e.message;
            this._saveContract(contract);

            return {
                success: false,
                error: e.message
            };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CALLBACKS
    // ═══════════════════════════════════════════════════════════════════════

    onTransferRequest(callback) {
        this._callbacks.onTransferRequest = callback;
    }

    onTransferAccepted(callback) {
        this._callbacks.onTransferAccepted = callback;
    }

    onTransferRejected(callback) {
        this._callbacks.onTransferRejected = callback;
    }

    onFileReceived(callback) {
        this._callbacks.onFileReceived = callback;
    }

    onTransferComplete(callback) {
        this._callbacks.onTransferComplete = callback;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    _hashString(str) {
        return crypto.createHash('sha256').update(str || '').digest('hex');
    }

    _getMimeType(ext) {
        const mimeTypes = {
            '.mp4': 'video/mp4',
            '.mp3': 'audio/mpeg',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.txt': 'text/plain',
            '.zip': 'application/zip',
            '.json': 'application/json'
        };
        return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
    }

    _loadContract(contractId) {
        const contractPath = path.join(TRANSFERS_DIR, `${contractId}.json`);
        if (fs.existsSync(contractPath)) {
            return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        }
        return null;
    }

    _saveContract(contract) {
        const contractPath = path.join(TRANSFERS_DIR, `${contract.contractId}.json`);
        fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2));
    }

    /**
     * Handle incoming transfer request (from WebSocket)
     */
    handleIncomingRequest(requestData) {
        if (!this._acceptingFiles && requestData.mode === MODE.INFORMAL) {
            return {
                accepted: false,
                reason: 'User not accepting files. Tell them to run: /file accept on'
            };
        }

        // Store incoming transfer
        const transferId = requestData.transferId || requestData.contractId;
        this._incomingTransfers.set(transferId, {
            ...requestData,
            receivedAt: new Date().toISOString()
        });

        if (this._callbacks.onTransferRequest) {
            this._callbacks.onTransferRequest(requestData);
        }

        return {
            accepted: true,
            transferId
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

const fileTransferService = new FileTransferService();

module.exports = {
    FileTransferService,
    fileTransferService,
    MODE,
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
        cyan: '\x1b[36m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        red: '\x1b[31m',
        dim: '\x1b[2m'
    };

    console.log(`
${c.cyan}╔════════════════════════════════════════════════════════════╗
║      ${c.yellow}RANGERBLOCK${c.cyan} - File Transfer Service v${VERSION}          ║
╚════════════════════════════════════════════════════════════╝${c.reset}
`);

    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'package' && args[1]) {
        console.log(`${c.dim}Packaging file: ${args[1]}${c.reset}\n`);
        const result = fileTransferService.packageFile(args[1]);
        console.log(`${c.green}✓ Package created:${c.reset} ${result.packagePath}`);
        console.log(`${c.dim}Original hash:${c.reset}  ${result.originalHash}`);
        console.log(`${c.dim}Package hash:${c.reset}   ${result.packageHash}`);
        console.log(`${c.dim}Compression:${c.reset}    ${result.compressionRatio}%`);
        console.log(`${c.dim}Size:${c.reset}           ${result.originalSize} → ${result.packageSize} bytes`);
    } else if (command === 'extract' && args[1]) {
        console.log(`${c.dim}Extracting: ${args[1]}${c.reset}\n`);
        const result = fileTransferService.extractFile(args[1], args[2]);
        console.log(`${c.green}✓ Extracted:${c.reset} ${result.outputPath}`);
        console.log(`${c.dim}Original hash:${c.reset}  ${result.originalHash}`);
        console.log(`${c.dim}Extracted hash:${c.reset} ${result.extractedHash}`);
        console.log(`${c.dim}Verified:${c.reset}       ${result.verified ? c.green + 'YES ✓' : c.red + 'NO ✗'}${c.reset}`);
    } else {
        console.log(`${c.bold}Usage:${c.reset}`);
        console.log(`  node file-transfer-service.cjs package <file>   - Create .rangerblock`);
        console.log(`  node file-transfer-service.cjs extract <file>   - Extract .rangerblock`);
        console.log(`\n${c.bold}Chat Commands:${c.reset}`);
        console.log(`  /file accept on              - Start accepting files`);
        console.log(`  /file accept off             - Stop accepting files`);
        console.log(`  /file send <user> <path>     - Send file informally`);
        console.log(`  /contract send <user> <path> - Create formal contract`);
        console.log(`  /contract accept <id>        - Accept contract`);
        console.log(`  /contract reject <id>        - Reject contract`);
    }

    console.log(`\n${c.green}Rangers lead the way!${c.reset}\n`);
}

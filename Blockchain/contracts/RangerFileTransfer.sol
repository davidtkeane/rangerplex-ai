// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RangerFileTransfer
 * @dev Smart contract for formal file transfer agreements
 * @author David Keane (IrishRanger) + Claude Code (Ranger)
 *
 * Use Cases:
 * - Legal file transfers with proof
 * - Sending sensitive documents
 * - .rangerblock file verification
 * - Chain of custody for files
 *
 * Flow:
 * 1. Sender creates transfer request with file hash
 * 2. Receiver accepts or rejects
 * 3. Both parties sign the contract
 * 4. Immutable record created on blockchain
 *
 * Rangers lead the way!
 */

contract RangerFileTransfer {

    // ========================================================================
    // ENUMS
    // ========================================================================

    enum TransferStatus {
        PENDING,        // 0 - Waiting for receiver
        ACCEPTED,       // 1 - Receiver accepted
        REJECTED,       // 2 - Receiver rejected
        COMPLETED,      // 3 - Transfer verified complete
        CANCELLED,      // 4 - Sender cancelled
        EXPIRED         // 5 - Timed out
    }

    // ========================================================================
    // STRUCTS
    // ========================================================================

    struct FileTransfer {
        // Identities (hashed for privacy)
        bytes32 senderIdHash;
        bytes32 receiverIdHash;

        // File info
        bytes32 fileHash;           // SHA256 of original file
        bytes32 rangerblockHash;    // SHA256 of .rangerblock package
        string fileName;            // Original filename
        uint256 fileSize;           // Size in bytes
        string fileType;            // MIME type or extension

        // Transfer metadata
        uint256 createdAt;
        uint256 expiresAt;
        uint256 acceptedAt;
        uint256 completedAt;

        // Status
        TransferStatus status;
        string message;             // Optional message from sender

        // Signatures
        bytes32 senderSignature;
        bytes32 receiverSignature;
    }

    // ========================================================================
    // STATE VARIABLES
    // ========================================================================

    // Transfer ID => FileTransfer
    mapping(bytes32 => FileTransfer) public transfers;

    // User's pending transfers (userIdHash => transferIds)
    mapping(bytes32 => bytes32[]) public userPendingTransfers;

    // User's completed transfers
    mapping(bytes32 => bytes32[]) public userCompletedTransfers;

    // All transfer IDs
    bytes32[] public allTransfers;

    // Statistics
    uint256 public totalTransfers;
    uint256 public completedTransfers;
    uint256 public totalBytesTransferred;

    // Settings
    uint256 public defaultExpiry = 24 hours;
    address public owner;

    // ========================================================================
    // EVENTS
    // ========================================================================

    event TransferRequested(
        bytes32 indexed transferId,
        bytes32 indexed senderIdHash,
        bytes32 indexed receiverIdHash,
        bytes32 fileHash,
        string fileName,
        uint256 fileSize,
        uint256 expiresAt
    );

    event TransferAccepted(
        bytes32 indexed transferId,
        bytes32 indexed receiverIdHash,
        uint256 timestamp
    );

    event TransferRejected(
        bytes32 indexed transferId,
        bytes32 indexed receiverIdHash,
        string reason,
        uint256 timestamp
    );

    event TransferCompleted(
        bytes32 indexed transferId,
        bytes32 fileHash,
        bytes32 rangerblockHash,
        uint256 timestamp
    );

    event TransferCancelled(
        bytes32 indexed transferId,
        bytes32 indexed senderIdHash,
        uint256 timestamp
    );

    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================

    constructor() {
        owner = msg.sender;
    }

    // ========================================================================
    // MAIN FUNCTIONS
    // ========================================================================

    /**
     * @dev Create a new file transfer request
     * @param receiverIdHash Hash of receiver's userId
     * @param fileHash SHA256 hash of the original file
     * @param fileName Original filename
     * @param fileSize File size in bytes
     * @param fileType File MIME type or extension
     * @param message Optional message to receiver
     * @param senderSignature Sender's signature
     */
    function requestTransfer(
        bytes32 senderIdHash,
        bytes32 receiverIdHash,
        bytes32 fileHash,
        string calldata fileName,
        uint256 fileSize,
        string calldata fileType,
        string calldata message,
        bytes32 senderSignature
    ) external returns (bytes32 transferId) {
        require(senderIdHash != bytes32(0), "Invalid sender");
        require(receiverIdHash != bytes32(0), "Invalid receiver");
        require(fileHash != bytes32(0), "Invalid file hash");
        require(bytes(fileName).length > 0, "Invalid filename");
        require(fileSize > 0, "Invalid file size");

        // Generate unique transfer ID
        transferId = keccak256(abi.encodePacked(
            senderIdHash,
            receiverIdHash,
            fileHash,
            block.timestamp,
            block.number
        ));

        // Ensure unique
        require(transfers[transferId].createdAt == 0, "Transfer ID collision");

        // Create transfer
        FileTransfer storage transfer = transfers[transferId];
        transfer.senderIdHash = senderIdHash;
        transfer.receiverIdHash = receiverIdHash;
        transfer.fileHash = fileHash;
        transfer.fileName = fileName;
        transfer.fileSize = fileSize;
        transfer.fileType = fileType;
        transfer.message = message;
        transfer.createdAt = block.timestamp;
        transfer.expiresAt = block.timestamp + defaultExpiry;
        transfer.status = TransferStatus.PENDING;
        transfer.senderSignature = senderSignature;

        // Track
        allTransfers.push(transferId);
        userPendingTransfers[senderIdHash].push(transferId);
        userPendingTransfers[receiverIdHash].push(transferId);
        totalTransfers++;

        emit TransferRequested(
            transferId,
            senderIdHash,
            receiverIdHash,
            fileHash,
            fileName,
            fileSize,
            transfer.expiresAt
        );

        return transferId;
    }

    /**
     * @dev Accept a pending transfer
     * @param transferId The transfer to accept
     * @param receiverSignature Receiver's signature
     */
    function acceptTransfer(
        bytes32 transferId,
        bytes32 receiverIdHash,
        bytes32 receiverSignature
    ) external {
        FileTransfer storage transfer = transfers[transferId];

        require(transfer.createdAt > 0, "Transfer not found");
        require(transfer.status == TransferStatus.PENDING, "Not pending");
        require(transfer.receiverIdHash == receiverIdHash, "Not receiver");
        require(block.timestamp < transfer.expiresAt, "Transfer expired");

        transfer.status = TransferStatus.ACCEPTED;
        transfer.acceptedAt = block.timestamp;
        transfer.receiverSignature = receiverSignature;

        emit TransferAccepted(transferId, receiverIdHash, block.timestamp);
    }

    /**
     * @dev Reject a pending transfer
     * @param transferId The transfer to reject
     * @param reason Optional rejection reason
     */
    function rejectTransfer(
        bytes32 transferId,
        bytes32 receiverIdHash,
        string calldata reason
    ) external {
        FileTransfer storage transfer = transfers[transferId];

        require(transfer.createdAt > 0, "Transfer not found");
        require(transfer.status == TransferStatus.PENDING, "Not pending");
        require(transfer.receiverIdHash == receiverIdHash, "Not receiver");

        transfer.status = TransferStatus.REJECTED;

        emit TransferRejected(transferId, receiverIdHash, reason, block.timestamp);
    }

    /**
     * @dev Mark transfer as completed (after file received and verified)
     * @param transferId The transfer ID
     * @param rangerblockHash Hash of the .rangerblock file that was received
     */
    function completeTransfer(
        bytes32 transferId,
        bytes32 receiverIdHash,
        bytes32 rangerblockHash
    ) external {
        FileTransfer storage transfer = transfers[transferId];

        require(transfer.createdAt > 0, "Transfer not found");
        require(transfer.status == TransferStatus.ACCEPTED, "Not accepted");
        require(transfer.receiverIdHash == receiverIdHash, "Not receiver");

        transfer.status = TransferStatus.COMPLETED;
        transfer.completedAt = block.timestamp;
        transfer.rangerblockHash = rangerblockHash;

        // Update stats
        completedTransfers++;
        totalBytesTransferred += transfer.fileSize;

        // Move to completed
        userCompletedTransfers[transfer.senderIdHash].push(transferId);
        userCompletedTransfers[transfer.receiverIdHash].push(transferId);

        emit TransferCompleted(
            transferId,
            transfer.fileHash,
            rangerblockHash,
            block.timestamp
        );
    }

    /**
     * @dev Cancel a pending transfer (sender only)
     */
    function cancelTransfer(bytes32 transferId, bytes32 senderIdHash) external {
        FileTransfer storage transfer = transfers[transferId];

        require(transfer.createdAt > 0, "Transfer not found");
        require(transfer.status == TransferStatus.PENDING, "Not pending");
        require(transfer.senderIdHash == senderIdHash, "Not sender");

        transfer.status = TransferStatus.CANCELLED;

        emit TransferCancelled(transferId, senderIdHash, block.timestamp);
    }

    // ========================================================================
    // VIEW FUNCTIONS
    // ========================================================================

    /**
     * @dev Get transfer details
     */
    function getTransfer(bytes32 transferId) external view returns (
        bytes32 senderIdHash,
        bytes32 receiverIdHash,
        bytes32 fileHash,
        string memory fileName,
        uint256 fileSize,
        TransferStatus status,
        uint256 createdAt,
        uint256 completedAt
    ) {
        FileTransfer storage t = transfers[transferId];
        return (
            t.senderIdHash,
            t.receiverIdHash,
            t.fileHash,
            t.fileName,
            t.fileSize,
            t.status,
            t.createdAt,
            t.completedAt
        );
    }

    /**
     * @dev Get user's pending transfers
     */
    function getPendingTransfers(bytes32 userIdHash) external view returns (bytes32[] memory) {
        return userPendingTransfers[userIdHash];
    }

    /**
     * @dev Get user's completed transfers
     */
    function getCompletedTransfers(bytes32 userIdHash) external view returns (bytes32[] memory) {
        return userCompletedTransfers[userIdHash];
    }

    /**
     * @dev Verify a transfer was completed (for legal/audit purposes)
     */
    function verifyTransfer(
        bytes32 transferId,
        bytes32 expectedFileHash,
        bytes32 expectedRangerblockHash
    ) external view returns (bool isValid, string memory reason) {
        FileTransfer storage t = transfers[transferId];

        if (t.createdAt == 0) {
            return (false, "Transfer not found");
        }
        if (t.status != TransferStatus.COMPLETED) {
            return (false, "Transfer not completed");
        }
        if (t.fileHash != expectedFileHash) {
            return (false, "File hash mismatch");
        }
        if (t.rangerblockHash != expectedRangerblockHash) {
            return (false, "Rangerblock hash mismatch");
        }

        return (true, "Transfer verified");
    }

    /**
     * @dev Get transfer statistics
     */
    function getStats() external view returns (
        uint256 total,
        uint256 completed,
        uint256 bytesTransferred
    ) {
        return (totalTransfers, completedTransfers, totalBytesTransferred);
    }

    // ========================================================================
    // ADMIN FUNCTIONS
    // ========================================================================

    /**
     * @dev Update default expiry time
     */
    function setDefaultExpiry(uint256 newExpiry) external {
        require(msg.sender == owner, "Not owner");
        require(newExpiry >= 1 hours && newExpiry <= 7 days, "Invalid expiry");
        defaultExpiry = newExpiry;
    }
}

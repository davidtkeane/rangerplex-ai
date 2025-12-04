// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RangerRegistration
 * @dev User registration and consent tracking for RangerBlock ecosystem
 * @author David Keane (IrishRanger) + Claude Code (Ranger)
 *
 * Features:
 * - User registration with consent
 * - Hardware ID tracking (prevents ban evasion)
 * - Admin approval workflow (pending → approved/denied)
 * - Revocation support
 * - Event logging for transparency
 *
 * IMPORTANT: 18+ platform - NOT an adult content site
 * 18+ means mature, responsible users only
 *
 * Rangers lead the way!
 */
contract RangerRegistration {

    // ========================================================================
    // ENUMS
    // ========================================================================

    enum RegistrationStatus {
        PENDING,    // 0 - Awaiting admin approval
        APPROVED,   // 1 - Full access granted
        DENIED,     // 2 - Access denied
        REVOKED     // 3 - Previously approved, now revoked
    }

    // ========================================================================
    // STRUCTURES
    // ========================================================================

    struct Registration {
        // Identity (hashed for privacy)
        bytes32 userIdHash;           // SHA256 of userId
        bytes32 publicKeyHash;        // SHA256 of RSA public key
        bytes32 hardwareIdHash;       // SHA256 of hardware fingerprint

        // Public info
        string username;              // Display name (max 32 chars)
        string appType;               // ranger-chat-lite, just-chat, etc.

        // Consent
        string termsVersion;          // e.g., "1.0.0"
        bytes32 termsHash;            // SHA256 of terms text
        uint256 consentTimestamp;     // When terms accepted

        // Registration
        uint256 registeredAt;         // Block timestamp
        uint256 registeredBlock;      // Block number

        // Status
        RegistrationStatus status;
        string statusReason;          // Reason for denial/revocation
        address approvedBy;           // Admin who approved
        uint256 statusUpdatedAt;      // Last status change
    }

    // ========================================================================
    // STATE VARIABLES
    // ========================================================================

    // Ownership
    address public owner;
    address public supremeAdmin;

    // Admin list
    mapping(address => bool) public isAdmin;

    // Registrations
    mapping(bytes32 => Registration) public registrations;    // userIdHash => Registration
    mapping(bytes32 => bool) public hardwareRegistered;       // hardwareIdHash => used
    bytes32[] public registrationIds;                         // All registration hashes

    // Statistics
    uint256 public totalRegistrations;
    uint256 public pendingCount;
    uint256 public approvedCount;
    uint256 public deniedCount;
    uint256 public revokedCount;

    // Terms tracking
    string public currentTermsVersion;
    bytes32 public currentTermsHash;

    // ========================================================================
    // EVENTS
    // ========================================================================

    event RegistrationSubmitted(
        bytes32 indexed userIdHash,
        string username,
        string appType,
        string termsVersion,
        uint256 timestamp
    );

    event RegistrationApproved(
        bytes32 indexed userIdHash,
        address indexed approvedBy,
        uint256 timestamp
    );

    event RegistrationDenied(
        bytes32 indexed userIdHash,
        address indexed deniedBy,
        string reason,
        uint256 timestamp
    );

    event RegistrationRevoked(
        bytes32 indexed userIdHash,
        address indexed revokedBy,
        string reason,
        uint256 timestamp
    );

    event AdminAdded(address indexed admin, address indexed addedBy);
    event AdminRemoved(address indexed admin, address indexed removedBy);
    event TermsUpdated(string version, bytes32 termsHash);

    // ========================================================================
    // MODIFIERS
    // ========================================================================

    modifier onlyOwner() {
        require(msg.sender == owner || msg.sender == supremeAdmin, "Not owner");
        _;
    }

    modifier onlyAdmin() {
        require(
            msg.sender == owner ||
            msg.sender == supremeAdmin ||
            isAdmin[msg.sender],
            "Not admin"
        );
        _;
    }

    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================

    /**
     * @dev Initialize contract with supreme admin address
     * @param _supremeAdmin Address of the supreme admin (IrishRanger)
     */
    constructor(address _supremeAdmin) {
        owner = msg.sender;
        supremeAdmin = _supremeAdmin;
        isAdmin[_supremeAdmin] = true;

        // Set initial terms
        currentTermsVersion = "1.0.0";
        currentTermsHash = bytes32(0); // Will be set by updateTerms
    }

    // ========================================================================
    // REGISTRATION FUNCTIONS
    // ========================================================================

    /**
     * @dev Submit a new registration with consent
     * @param userIdHash SHA256 hash of userId
     * @param publicKeyHash SHA256 hash of public key
     * @param hardwareIdHash SHA256 hash of hardware fingerprint
     * @param username Display name
     * @param appType Application type
     * @param termsVersion Version of accepted terms
     * @param termsHash SHA256 hash of terms text
     */
    function register(
        bytes32 userIdHash,
        bytes32 publicKeyHash,
        bytes32 hardwareIdHash,
        string calldata username,
        string calldata appType,
        string calldata termsVersion,
        bytes32 termsHash
    ) external returns (bool) {
        // Validate inputs
        require(userIdHash != bytes32(0), "Invalid userId");
        require(hardwareIdHash != bytes32(0), "Invalid hardwareId");
        require(bytes(username).length > 0 && bytes(username).length <= 32, "Invalid username");

        // Check not already registered
        require(registrations[userIdHash].registeredAt == 0, "Already registered");

        // Check hardware not already used (prevents ban evasion)
        require(!hardwareRegistered[hardwareIdHash], "Hardware already registered");

        // Create registration
        Registration storage reg = registrations[userIdHash];
        reg.userIdHash = userIdHash;
        reg.publicKeyHash = publicKeyHash;
        reg.hardwareIdHash = hardwareIdHash;
        reg.username = username;
        reg.appType = appType;
        reg.termsVersion = termsVersion;
        reg.termsHash = termsHash;
        reg.consentTimestamp = block.timestamp;
        reg.registeredAt = block.timestamp;
        reg.registeredBlock = block.number;
        reg.status = RegistrationStatus.PENDING;

        // Mark hardware as used
        hardwareRegistered[hardwareIdHash] = true;

        // Add to list
        registrationIds.push(userIdHash);

        // Update stats
        totalRegistrations++;
        pendingCount++;

        emit RegistrationSubmitted(
            userIdHash,
            username,
            appType,
            termsVersion,
            block.timestamp
        );

        return true;
    }

    // ========================================================================
    // ADMIN FUNCTIONS
    // ========================================================================

    /**
     * @dev Approve a pending registration
     * @param userIdHash Hash of user to approve
     */
    function approve(bytes32 userIdHash) external onlyAdmin {
        Registration storage reg = registrations[userIdHash];

        require(reg.registeredAt > 0, "Registration not found");
        require(reg.status == RegistrationStatus.PENDING, "Not pending");

        reg.status = RegistrationStatus.APPROVED;
        reg.approvedBy = msg.sender;
        reg.statusUpdatedAt = block.timestamp;

        pendingCount--;
        approvedCount++;

        emit RegistrationApproved(userIdHash, msg.sender, block.timestamp);
    }

    /**
     * @dev Deny a pending registration
     * @param userIdHash Hash of user to deny
     * @param reason Reason for denial
     */
    function deny(bytes32 userIdHash, string calldata reason) external onlyAdmin {
        Registration storage reg = registrations[userIdHash];

        require(reg.registeredAt > 0, "Registration not found");
        require(reg.status == RegistrationStatus.PENDING, "Not pending");

        reg.status = RegistrationStatus.DENIED;
        reg.statusReason = reason;
        reg.statusUpdatedAt = block.timestamp;

        pendingCount--;
        deniedCount++;

        emit RegistrationDenied(userIdHash, msg.sender, reason, block.timestamp);
    }

    /**
     * @dev Revoke an approved registration
     * @param userIdHash Hash of user to revoke
     * @param reason Reason for revocation
     */
    function revoke(bytes32 userIdHash, string calldata reason) external onlyAdmin {
        Registration storage reg = registrations[userIdHash];

        require(reg.registeredAt > 0, "Registration not found");
        require(reg.status == RegistrationStatus.APPROVED, "Not approved");

        reg.status = RegistrationStatus.REVOKED;
        reg.statusReason = reason;
        reg.statusUpdatedAt = block.timestamp;

        approvedCount--;
        revokedCount++;

        emit RegistrationRevoked(userIdHash, msg.sender, reason, block.timestamp);
    }

    /**
     * @dev Add an admin
     * @param admin Address to add as admin
     */
    function addAdmin(address admin) external onlyOwner {
        require(admin != address(0), "Invalid address");
        require(!isAdmin[admin], "Already admin");

        isAdmin[admin] = true;

        emit AdminAdded(admin, msg.sender);
    }

    /**
     * @dev Remove an admin
     * @param admin Address to remove
     */
    function removeAdmin(address admin) external onlyOwner {
        require(admin != supremeAdmin, "Cannot remove supreme admin");
        require(isAdmin[admin], "Not admin");

        isAdmin[admin] = false;

        emit AdminRemoved(admin, msg.sender);
    }

    /**
     * @dev Update terms version and hash
     * @param version New terms version
     * @param termsHash New terms hash
     */
    function updateTerms(string calldata version, bytes32 termsHash) external onlyOwner {
        currentTermsVersion = version;
        currentTermsHash = termsHash;

        emit TermsUpdated(version, termsHash);
    }

    // ========================================================================
    // VIEW FUNCTIONS
    // ========================================================================

    /**
     * @dev Get registration details
     */
    function getRegistration(bytes32 userIdHash) external view returns (
        string memory username,
        string memory appType,
        RegistrationStatus status,
        string memory statusReason,
        uint256 registeredAt,
        uint256 statusUpdatedAt
    ) {
        Registration storage reg = registrations[userIdHash];
        return (
            reg.username,
            reg.appType,
            reg.status,
            reg.statusReason,
            reg.registeredAt,
            reg.statusUpdatedAt
        );
    }

    /**
     * @dev Check if user is approved
     */
    function isApproved(bytes32 userIdHash) external view returns (bool) {
        return registrations[userIdHash].status == RegistrationStatus.APPROVED;
    }

    /**
     * @dev Check if user is pending
     */
    function isPending(bytes32 userIdHash) external view returns (bool) {
        return registrations[userIdHash].status == RegistrationStatus.PENDING;
    }

    /**
     * @dev Check if hardware is registered
     */
    function isHardwareUsed(bytes32 hardwareIdHash) external view returns (bool) {
        return hardwareRegistered[hardwareIdHash];
    }

    /**
     * @dev Get statistics
     */
    function getStats() external view returns (
        uint256 total,
        uint256 pending,
        uint256 approved,
        uint256 denied,
        uint256 revoked
    ) {
        return (totalRegistrations, pendingCount, approvedCount, deniedCount, revokedCount);
    }

    /**
     * @dev Get all pending registration IDs
     */
    function getPendingRegistrations() external view returns (bytes32[] memory) {
        // Count pending
        uint256 count = 0;
        for (uint256 i = 0; i < registrationIds.length; i++) {
            if (registrations[registrationIds[i]].status == RegistrationStatus.PENDING) {
                count++;
            }
        }

        // Build array
        bytes32[] memory pending = new bytes32[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < registrationIds.length; i++) {
            if (registrations[registrationIds[i]].status == RegistrationStatus.PENDING) {
                pending[index] = registrationIds[i];
                index++;
            }
        }

        return pending;
    }

    /**
     * @dev Get total registration count
     */
    function getRegistrationCount() external view returns (uint256) {
        return registrationIds.length;
    }
}

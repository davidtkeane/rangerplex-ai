import React, { useState, useEffect, useRef, useCallback } from 'react';

// ==================== TYPES ====================

interface ChatMessage {
    id: string;
    from: string;
    fromName: string;
    content: string;
    timestamp: number;
    type: 'message' | 'action' | 'system' | 'join' | 'part' | 'kick' | 'ban' | 'pm';
    channel?: string;
}

interface NodeInfo {
    key: string;
    name: string;
    ip: string;
    type: string;
    emoji: string;
    online: boolean;
    permission: PermissionLevel;
}

type PermissionLevel = 'owner' | 'admin' | 'op' | 'halfop' | 'voice' | 'user' | 'banned';

interface Channel {
    name: string;
    topic: string;
    users: string[];
    moderated: boolean;
}

interface BlockchainChatProps {
    isOpen: boolean;
    onClose: () => void;
}

// Block structure for blockchain explorer
interface Block {
    index: number;
    timestamp: number;
    data: {
        type: 'message' | 'join' | 'part' | 'system' | 'genesis';
        from?: string;
        fromName?: string;
        content: string;
        channel?: string;
    };
    previousHash: string;
    hash: string;
    nonce: number;
}

// ==================== CONSTANTS ====================

const PERMISSION_SYMBOLS: Record<PermissionLevel, string> = {
    owner: '~',
    admin: '&',
    op: '@',
    halfop: '%',
    voice: '+',
    user: '',
    banned: '!'
};

const PERMISSION_COLORS: Record<PermissionLevel, string> = {
    owner: 'text-red-400',
    admin: 'text-purple-400',
    op: 'text-green-400',
    halfop: 'text-cyan-400',
    voice: 'text-yellow-400',
    user: 'text-gray-300',
    banned: 'text-gray-600'
};

// Machine Registry - All RangerBlock Network Nodes
// These sync across the network when machines connect
const NODE_NETWORK: Record<string, Omit<NodeInfo, 'online' | 'permission' | 'key'>> = {
    // === MACOS MACHINES (RangerPlex Full Install) ===
    'M3Pro': { name: 'M3 Pro Genesis', ip: '192.168.1.35', type: 'genesis', emoji: '🏛️' },
    'M1Air': { name: 'M1 Air Peer', ip: '192.168.1.31', type: 'peer', emoji: '🍎' },
    'M4Max': { name: 'M4 Max Compute', ip: '192.168.1.4', type: 'compute', emoji: '⚡' },
    // === CLOUD SERVERS (24/7 Relay) ===
    'GCloudKali': { name: 'GCloud Kali', ip: '34.26.30.249', type: 'relay', emoji: '☁️' },
    'AWSKali': { name: 'AWS Kali', ip: 'pending', type: 'relay', emoji: '🌩️' },
    // === WINDOWS MACHINES (Relay-Only) ===
    'LenovoWin11': { name: 'Lenovo Win11', ip: 'dynamic', type: 'peer', emoji: '💻' },
    'MSIVector': { name: 'MSI Vector', ip: 'dynamic', type: 'gaming', emoji: '🎮' },
    // === VIRTUAL MACHINES ===
    'KaliVM': { name: 'Kali VM Security', ip: '192.168.66.2', type: 'security', emoji: '🔒' },
    'WindowsVM': { name: 'Windows VM', ip: '192.168.66.3', type: 'peer', emoji: '🪟' }
};

// WebSocket relay configuration
// Default: ngrok (Internet) for global connectivity
// Users can switch between servers in Settings panel

// Relay Server Presets - Choose your connection method
const RELAY_PRESETS = {
    ngrok: {
        name: '🌐 ngrok (Internet)',
        host: '2.tcp.eu.ngrok.io',
        port: 12232,
        description: 'Connect from anywhere via ngrok tunnel'
    },
    cloud: {
        name: '☁️ Kali Cloud (24/7)',
        host: '34.26.30.249',
        port: 5555,
        description: 'Google Cloud VM - Always online relay'
    },
    lan: {
        name: '🏠 LAN (M3Pro)',
        host: '192.168.1.35',
        port: 5555,
        description: 'Local network - M3Pro Genesis'
    }
};

// Default to ngrok for internet connectivity
const DEFAULT_RELAY_HOST = RELAY_PRESETS.ngrok.host;
const DEFAULT_RELAY_PORT = RELAY_PRESETS.ngrok.port;

// Get saved relay settings from localStorage
const getRelaySettings = () => {
    try {
        const saved = localStorage.getItem('rangerblock_relay_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            return {
                host: settings.host || DEFAULT_RELAY_HOST,
                port: settings.port || DEFAULT_RELAY_PORT,
                preset: settings.preset || 'ngrok'
            };
        }
    } catch (e) {
        console.error('Failed to load relay settings:', e);
    }
    return { host: DEFAULT_RELAY_HOST, port: DEFAULT_RELAY_PORT, preset: 'ngrok' };
};

// Save relay settings to localStorage
const saveRelaySettings = (host: string, port: number, preset?: string) => {
    try {
        localStorage.setItem('rangerblock_relay_settings', JSON.stringify({ host, port, preset: preset || 'custom' }));
    } catch (e) {
        console.error('Failed to save relay settings:', e);
    }
};

// ==================== SMART CONTRACT TEMPLATES ====================
// RangerBlock Smart Contracts - .ranger extension
// Inspired by Remix IDE but designed for RangerPlexChain

interface SmartContractTemplate {
    id: string;
    name: string;
    description: string;
    category: 'basic' | 'governance' | 'token' | 'utility';
    icon: string;
    fields: ContractField[];
    code: string;
}

interface ContractField {
    name: string;
    label: string;
    type: 'string' | 'number' | 'address' | 'boolean' | 'array' | 'select';
    required: boolean;
    placeholder?: string;
    options?: string[];
    default?: string | number | boolean;
}

interface DeployedContract {
    id: string;
    templateId: string;
    name: string;
    deployer: string;
    deployedAt: number;
    blockIndex: number;
    address: string;
    data: Record<string, any>;
    state: Record<string, any>;
}

const CONTRACT_TEMPLATES: SmartContractTemplate[] = [
    // === BASIC CONTRACTS ===
    {
        id: 'storage',
        name: 'Storage.ranger',
        description: 'Simple storage contract - Store and retrieve a value on the blockchain',
        category: 'basic',
        icon: '💾',
        fields: [
            { name: 'initialValue', label: 'Initial Value', type: 'string', required: false, placeholder: 'Enter initial stored value', default: '' },
            { name: 'owner', label: 'Owner Address', type: 'address', required: true, placeholder: 'Your node ID' },
            { name: 'description', label: 'Description', type: 'string', required: false, placeholder: 'What is this storage for?' }
        ],
        code: `// SPDX-License-Identifier: MIT
// Storage.ranger - RangerBlock Simple Storage Contract

contract Storage {
    string private storedValue;
    address public owner;

    event ValueChanged(string oldValue, string newValue);

    constructor(string _initialValue, address _owner) {
        storedValue = _initialValue;
        owner = _owner;
    }

    function store(string _value) public {
        require(msg.sender == owner, "Only owner can store");
        emit ValueChanged(storedValue, _value);
        storedValue = _value;
    }

    function retrieve() public view returns (string) {
        return storedValue;
    }
}`
    },
    {
        id: 'owner',
        name: 'Owner.ranger',
        description: 'Ownership contract - Manage ownership and access control',
        category: 'basic',
        icon: '👑',
        fields: [
            { name: 'owner', label: 'Initial Owner', type: 'address', required: true, placeholder: 'Owner node ID' },
            { name: 'contractName', label: 'Contract Name', type: 'string', required: true, placeholder: 'MyContract' },
            { name: 'transferable', label: 'Ownership Transferable', type: 'boolean', required: false, default: true }
        ],
        code: `// SPDX-License-Identifier: MIT
// Owner.ranger - RangerBlock Ownership Contract

contract Owner {
    address public owner;
    string public contractName;
    bool public transferable;

    event OwnershipTransferred(address previousOwner, address newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    constructor(address _owner, string _name, bool _transferable) {
        owner = _owner;
        contractName = _name;
        transferable = _transferable;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(transferable, "Ownership not transferable");
        require(newOwner != address(0), "Invalid address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }
}`
    },
    // === GOVERNANCE CONTRACTS ===
    {
        id: 'ballot',
        name: 'Ballot.ranger',
        description: 'Voting contract - Create proposals and vote on decisions',
        category: 'governance',
        icon: '🗳️',
        fields: [
            { name: 'proposalName', label: 'Proposal Name', type: 'string', required: true, placeholder: 'What are we voting on?' },
            { name: 'description', label: 'Proposal Description', type: 'string', required: true, placeholder: 'Detailed description' },
            { name: 'options', label: 'Voting Options (comma-separated)', type: 'string', required: true, placeholder: 'Yes, No, Abstain', default: 'Yes, No, Abstain' },
            { name: 'duration', label: 'Voting Duration (hours)', type: 'number', required: true, placeholder: '24', default: 24 },
            { name: 'creator', label: 'Creator Address', type: 'address', required: true, placeholder: 'Your node ID' }
        ],
        code: `// SPDX-License-Identifier: MIT
// Ballot.ranger - RangerBlock Voting Contract

contract Ballot {
    struct Proposal {
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        string[] options;
        mapping(string => uint256) votes;
        mapping(address => bool) hasVoted;
    }

    Proposal public proposal;
    address public creator;

    event VoteCast(address voter, string option);
    event ProposalEnded(string winner, uint256 votes);

    constructor(string _name, string _desc, string[] _options, uint256 _duration, address _creator) {
        proposal.name = _name;
        proposal.description = _desc;
        proposal.options = _options;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + (_duration * 3600);
        creator = _creator;
    }

    function vote(string _option) public {
        require(block.timestamp < proposal.endTime, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        proposal.votes[_option]++;
        proposal.hasVoted[msg.sender] = true;
        emit VoteCast(msg.sender, _option);
    }

    function getResults() public view returns (string[] options, uint256[] votes) {
        return (proposal.options, getVoteCounts());
    }
}`
    },
    {
        id: 'multisig',
        name: 'MultiSig.ranger',
        description: 'Multi-signature contract - Require multiple approvals for actions',
        category: 'governance',
        icon: '✍️',
        fields: [
            { name: 'signers', label: 'Signers (comma-separated addresses)', type: 'string', required: true, placeholder: 'M3Pro, M4Max, M1Air' },
            { name: 'requiredSignatures', label: 'Required Signatures', type: 'number', required: true, placeholder: '2', default: 2 },
            { name: 'purpose', label: 'Contract Purpose', type: 'string', required: false, placeholder: 'What requires multi-sig?' }
        ],
        code: `// SPDX-License-Identifier: MIT
// MultiSig.ranger - RangerBlock Multi-Signature Contract

contract MultiSig {
    address[] public signers;
    uint256 public requiredSignatures;
    string public purpose;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }

    mapping(uint256 => mapping(address => bool)) public confirmations;
    Transaction[] public transactions;

    event TransactionSubmitted(uint256 txId, address to);
    event TransactionConfirmed(uint256 txId, address signer);
    event TransactionExecuted(uint256 txId);

    constructor(address[] _signers, uint256 _required, string _purpose) {
        require(_required <= _signers.length, "Invalid signature requirement");
        signers = _signers;
        requiredSignatures = _required;
        purpose = _purpose;
    }

    function submitTransaction(address _to, uint256 _value, bytes _data) public returns (uint256) {
        require(isSigner(msg.sender), "Not a signer");
        uint256 txId = transactions.length;
        transactions.push(Transaction(_to, _value, _data, false, 0));
        emit TransactionSubmitted(txId, _to);
        return txId;
    }

    function confirmTransaction(uint256 _txId) public {
        require(isSigner(msg.sender), "Not a signer");
        require(!confirmations[_txId][msg.sender], "Already confirmed");
        confirmations[_txId][msg.sender] = true;
        transactions[_txId].confirmations++;
        emit TransactionConfirmed(_txId, msg.sender);
    }
}`
    },
    // === TOKEN CONTRACTS ===
    {
        id: 'token',
        name: 'RangerToken.ranger',
        description: 'Custom token contract - Create your own RangerBlock token',
        category: 'token',
        icon: '🪙',
        fields: [
            { name: 'tokenName', label: 'Token Name', type: 'string', required: true, placeholder: 'RangerCoin' },
            { name: 'symbol', label: 'Token Symbol', type: 'string', required: true, placeholder: 'RGR' },
            { name: 'totalSupply', label: 'Total Supply', type: 'number', required: true, placeholder: '1000000', default: 1000000 },
            { name: 'decimals', label: 'Decimals', type: 'number', required: false, placeholder: '18', default: 18 },
            { name: 'owner', label: 'Token Owner', type: 'address', required: true, placeholder: 'Your node ID' }
        ],
        code: `// SPDX-License-Identifier: MIT
// RangerToken.ranger - RangerBlock ERC20-like Token

contract RangerToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address from, address to, uint256 value);
    event Approval(address owner, address spender, uint256 value);

    constructor(string _name, string _symbol, uint256 _supply, uint8 _decimals, address _owner) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _supply * (10 ** _decimals);
        owner = _owner;
        balanceOf[_owner] = totalSupply;
    }

    function transfer(address _to, uint256 _value) public returns (bool) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
}`
    },
    // === UTILITY CONTRACTS ===
    {
        id: 'escrow',
        name: 'Escrow.ranger',
        description: 'Escrow contract - Hold funds until conditions are met',
        category: 'utility',
        icon: '🔐',
        fields: [
            { name: 'buyer', label: 'Buyer Address', type: 'address', required: true, placeholder: 'Buyer node ID' },
            { name: 'seller', label: 'Seller Address', type: 'address', required: true, placeholder: 'Seller node ID' },
            { name: 'arbiter', label: 'Arbiter Address', type: 'address', required: true, placeholder: 'Arbiter node ID' },
            { name: 'amount', label: 'Escrow Amount', type: 'number', required: true, placeholder: '100' },
            { name: 'description', label: 'What is being escrowed?', type: 'string', required: true, placeholder: 'Item/Service description' }
        ],
        code: `// SPDX-License-Identifier: MIT
// Escrow.ranger - RangerBlock Escrow Contract

contract Escrow {
    address public buyer;
    address public seller;
    address public arbiter;
    uint256 public amount;
    string public description;

    enum State { AWAITING_PAYMENT, AWAITING_DELIVERY, COMPLETE, REFUNDED, DISPUTED }
    State public state;

    event FundsDeposited(address buyer, uint256 amount);
    event DeliveryConfirmed(address buyer);
    event FundsReleased(address seller, uint256 amount);
    event FundsRefunded(address buyer, uint256 amount);
    event DisputeRaised(address initiator);

    constructor(address _buyer, address _seller, address _arbiter, uint256 _amount, string _desc) {
        buyer = _buyer;
        seller = _seller;
        arbiter = _arbiter;
        amount = _amount;
        description = _desc;
        state = State.AWAITING_PAYMENT;
    }

    function deposit() public payable {
        require(msg.sender == buyer, "Only buyer can deposit");
        require(state == State.AWAITING_PAYMENT, "Invalid state");
        require(msg.value == amount, "Incorrect amount");
        state = State.AWAITING_DELIVERY;
        emit FundsDeposited(buyer, msg.value);
    }

    function confirmDelivery() public {
        require(msg.sender == buyer, "Only buyer can confirm");
        require(state == State.AWAITING_DELIVERY, "Invalid state");
        state = State.COMPLETE;
        emit DeliveryConfirmed(buyer);
        emit FundsReleased(seller, amount);
    }

    function raiseDispute() public {
        require(msg.sender == buyer || msg.sender == seller, "Not authorized");
        require(state == State.AWAITING_DELIVERY, "Invalid state");
        state = State.DISPUTED;
        emit DisputeRaised(msg.sender);
    }
}`
    },
    {
        id: 'registry',
        name: 'Registry.ranger',
        description: 'Name registry contract - Register and lookup .ranger domains',
        category: 'utility',
        icon: '📛',
        fields: [
            { name: 'registrar', label: 'Registrar Address', type: 'address', required: true, placeholder: 'Your node ID' },
            { name: 'registrationFee', label: 'Registration Fee', type: 'number', required: false, placeholder: '10', default: 0 },
            { name: 'reservedNames', label: 'Reserved Names (comma-separated)', type: 'string', required: false, placeholder: 'admin, system, root' }
        ],
        code: `// SPDX-License-Identifier: MIT
// Registry.ranger - RangerBlock Name Registry

contract Registry {
    address public registrar;
    uint256 public registrationFee;
    string[] public reservedNames;

    struct Domain {
        address owner;
        string name;
        uint256 registeredAt;
        uint256 expiresAt;
        mapping(string => string) records;
    }

    mapping(string => Domain) public domains;
    mapping(address => string[]) public ownerDomains;

    event DomainRegistered(string name, address owner);
    event DomainTransferred(string name, address from, address to);
    event RecordSet(string domain, string key, string value);

    constructor(address _registrar, uint256 _fee, string[] _reserved) {
        registrar = _registrar;
        registrationFee = _fee;
        reservedNames = _reserved;
    }

    function register(string _name) public payable {
        require(domains[_name].owner == address(0), "Already registered");
        require(msg.value >= registrationFee, "Insufficient fee");
        domains[_name].owner = msg.sender;
        domains[_name].name = _name;
        domains[_name].registeredAt = block.timestamp;
        domains[_name].expiresAt = block.timestamp + 365 days;
        ownerDomains[msg.sender].push(_name);
        emit DomainRegistered(_name, msg.sender);
    }

    function resolve(string _name) public view returns (address) {
        return domains[_name].owner;
    }

    function setRecord(string _domain, string _key, string _value) public {
        require(domains[_domain].owner == msg.sender, "Not owner");
        domains[_domain].records[_key] = _value;
        emit RecordSet(_domain, _key, _value);
    }
}`
    },
    {
        id: 'timelock',
        name: 'TimeLock.ranger',
        description: 'Time-locked contract - Execute actions after a delay',
        category: 'utility',
        icon: '⏰',
        fields: [
            { name: 'admin', label: 'Admin Address', type: 'address', required: true, placeholder: 'Your node ID' },
            { name: 'delay', label: 'Minimum Delay (hours)', type: 'number', required: true, placeholder: '24', default: 24 },
            { name: 'gracePeriod', label: 'Grace Period (hours)', type: 'number', required: false, placeholder: '48', default: 48 }
        ],
        code: `// SPDX-License-Identifier: MIT
// TimeLock.ranger - RangerBlock Time-Lock Contract

contract TimeLock {
    address public admin;
    uint256 public delay;
    uint256 public gracePeriod;

    struct QueuedTransaction {
        address target;
        uint256 value;
        bytes data;
        uint256 eta;
        bool executed;
    }

    mapping(bytes32 => QueuedTransaction) public queuedTransactions;

    event TransactionQueued(bytes32 txHash, address target, uint256 eta);
    event TransactionExecuted(bytes32 txHash);
    event TransactionCancelled(bytes32 txHash);

    constructor(address _admin, uint256 _delay, uint256 _grace) {
        admin = _admin;
        delay = _delay * 3600;
        gracePeriod = _grace * 3600;
    }

    function queueTransaction(address _target, uint256 _value, bytes _data) public returns (bytes32) {
        require(msg.sender == admin, "Only admin");
        uint256 eta = block.timestamp + delay;
        bytes32 txHash = keccak256(abi.encode(_target, _value, _data, eta));
        queuedTransactions[txHash] = QueuedTransaction(_target, _value, _data, eta, false);
        emit TransactionQueued(txHash, _target, eta);
        return txHash;
    }

    function executeTransaction(bytes32 _txHash) public {
        require(msg.sender == admin, "Only admin");
        QueuedTransaction storage txn = queuedTransactions[_txHash];
        require(block.timestamp >= txn.eta, "Too early");
        require(block.timestamp <= txn.eta + gracePeriod, "Grace period expired");
        require(!txn.executed, "Already executed");
        txn.executed = true;
        emit TransactionExecuted(_txHash);
    }
}`
    }
];

const IRC_COLORS = [
    'text-white', 'text-gray-900', 'text-blue-600', 'text-green-600',
    'text-red-500', 'text-amber-800', 'text-purple-600', 'text-orange-500',
    'text-yellow-400', 'text-lime-400', 'text-teal-500', 'text-cyan-400',
    'text-blue-400', 'text-pink-400', 'text-gray-500', 'text-gray-400'
];

// ==================== COMPONENT ====================

const BlockchainChat: React.FC<BlockchainChatProps> = ({ isOpen, onClose }) => {
    // State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [currentNode, setCurrentNode] = useState<string | null>(null);
    const [nodes, setNodes] = useState<NodeInfo[]>([]);
    const [channels, setChannels] = useState<Channel[]>([
        { name: '#rangers', topic: '🎖️ Rangers Lead The Way! | RangerPlexChain HQ', users: [], moderated: false },
        { name: '#general', topic: 'General chat for all nodes', users: [], moderated: false },
        { name: '#admin', topic: '🔐 Admin channel - Ops only', users: [], moderated: true }
    ]);
    const [currentChannel, setCurrentChannel] = useState('#rangers');
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [showNodeSelector, setShowNodeSelector] = useState(true);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [showUserList, setShowUserList] = useState(true);

    // Relay settings state
    const [relayHost, setRelayHost] = useState(() => getRelaySettings().host);
    const [relayPort, setRelayPort] = useState(() => getRelaySettings().port);
    const [relayPreset, setRelayPreset] = useState(() => getRelaySettings().preset || 'ngrok');
    const [showRelaySettings, setShowRelaySettings] = useState(false);
    const [testStatus, setTestStatus] = useState<{[key: string]: 'idle' | 'testing' | 'success' | 'failed'}>({});

    // Blockchain Explorer state
    const [showBlockExplorer, setShowBlockExplorer] = useState(false);
    const [blockchain, setBlockchain] = useState<Block[]>([{
        index: 0,
        timestamp: Date.now(),
        data: { type: 'genesis', content: 'RangerPlexChain Genesis Block - Rangers Lead The Way!' },
        previousHash: '0',
        hash: 'genesis_' + Math.random().toString(36).substr(2, 16),
        nonce: 0
    }]);
    const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

    // Dynamic Machine Registry state
    const [dynamicMachines, setDynamicMachines] = useState<any[]>([]);
    const [pendingJoinRequests, setPendingJoinRequests] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showJoinRequests, setShowJoinRequests] = useState(false);
    const [machineRegistrationStatus, setMachineRegistrationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');

    // Message Journey Tracer state (Tron-style)
    const [showMessageTracer, setShowMessageTracer] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
    const [messageRoutes, setMessageRoutes] = useState<Map<string, MessageRoute>>(new Map());

    // Message route tracking
    interface MessageRoute {
        messageId: string;
        timestamp: number;
        source: { node: string; name: string; emoji: string };
        path: Array<{ node: string; name: string; type: 'relay' | 'bridge' | 'node'; timestamp: number }>;
        destinations: Array<{ node: string; name: string; emoji: string; received: number }>;
        totalHops: number;
        latency: number;
    }

    // Smart Contracts state
    const [showSmartContracts, setShowSmartContracts] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<SmartContractTemplate | null>(null);
    const [contractFormData, setContractFormData] = useState<Record<string, any>>({});
    const [deployedContracts, setDeployedContracts] = useState<DeployedContract[]>([]);
    const [contractView, setContractView] = useState<'templates' | 'deployed' | 'editor'>('templates');
    const [showContractCode, setShowContractCode] = useState(false);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const wsNodeIdRef = useRef<string | null>(null);

    // ==================== HELPERS ====================

    const getNodeColor = useCallback((nodeName: string): string => {
        // Consistent color based on node name hash
        let hash = 0;
        for (let i = 0; i < nodeName.length; i++) {
            hash = nodeName.charCodeAt(i) + ((hash << 5) - hash);
        }
        return IRC_COLORS[Math.abs(hash) % IRC_COLORS.length];
    }, []);

    const formatTimestamp = (ts: number): string => {
        return new Date(ts).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    // Simple hash function for blocks
    const calculateHash = (index: number, timestamp: number, data: any, previousHash: string, nonce: number): string => {
        const str = `${index}${timestamp}${JSON.stringify(data)}${previousHash}${nonce}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(16, '0');
    };

    // Add a new block to the blockchain
    const addBlock = useCallback((data: Block['data']) => {
        setBlockchain(prev => {
            const lastBlock = prev[prev.length - 1];
            const newIndex = lastBlock.index + 1;
            const timestamp = Date.now();
            const previousHash = lastBlock.hash;
            const nonce = Math.floor(Math.random() * 1000);
            const hash = calculateHash(newIndex, timestamp, data, previousHash, nonce);

            return [...prev, {
                index: newIndex,
                timestamp,
                data,
                previousHash,
                hash,
                nonce
            }];
        });
    }, []);

    // Download block as JSON
    const downloadBlock = (block: Block) => {
        const json = JSON.stringify(block, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `block_${block.index}_${block.hash.substring(0, 8)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Download entire blockchain
    const downloadBlockchain = () => {
        const json = JSON.stringify(blockchain, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rangerplexchain_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const addSystemMessage = useCallback((content: string, type: ChatMessage['type'] = 'system') => {
        const msg: ChatMessage = {
            id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            from: 'System',
            fromName: 'System',
            content,
            timestamp: Date.now(),
            type,
            channel: currentChannel
        };
        setMessages(prev => [...prev, msg]);
    }, [currentChannel]);

    // ==================== CONNECTION ====================

    const connectToNetwork = useCallback(async (nodeKey: string) => {
        setIsConnecting(true);
        setCurrentNode(nodeKey);

        addSystemMessage(`* Connecting as ${NODE_NETWORK[nodeKey].emoji} ${NODE_NETWORK[nodeKey].name}...`);
        addSystemMessage(`* Relay: ws://${relayHost}:${relayPort}`);

        try {
            // Connect to WebSocket relay using configured settings
            const ws = new WebSocket(`ws://${relayHost}:${relayPort}`);
            wsRef.current = ws;

            ws.onopen = () => {
                addSystemMessage(`* Connected to blockchain relay!`);
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    handleWebSocketMessage(msg, nodeKey);
                } catch (e) {
                    console.error('Invalid WS message:', e);
                }
            };

            ws.onerror = (err) => {
                console.error('WebSocket error:', err);
                addSystemMessage(`* Connection error - relay may not be running`);
                addSystemMessage(`* Start relay with: npm run blockchain:relay`);

                // Fall back to offline mode
                const nodeList: NodeInfo[] = Object.entries(NODE_NETWORK).map(([key, info]) => ({
                    key,
                    ...info,
                    online: key === nodeKey,
                    permission: key === nodeKey ? 'owner' : 'user'
                }));
                setNodes(nodeList);
                setIsConnected(true);
                setShowNodeSelector(false);
                setIsConnecting(false);
            };

            ws.onclose = () => {
                addSystemMessage(`* Disconnected from relay`);
                setIsConnected(false);
            };

        } catch (err) {
            // Offline mode
            const nodeList: NodeInfo[] = Object.entries(NODE_NETWORK).map(([key, info]) => ({
                key,
                ...info,
                online: key === nodeKey,
                permission: key === nodeKey ? 'owner' : 'user'
            }));

            setNodes(nodeList);
            setIsConnected(true);
            setShowNodeSelector(false);
            addSystemMessage(`* Running in offline mode`);
            setIsConnecting(false);
        }
    }, [addSystemMessage, relayHost, relayPort]);

    // Handle WebSocket messages from relay
    const handleWebSocketMessage = useCallback((msg: any, nodeKey: string) => {
        switch (msg.type) {
            case 'welcome':
                wsNodeIdRef.current = msg.nodeId;
                // Register ourselves
                wsRef.current?.send(JSON.stringify({
                    type: 'register',
                    address: nodeKey,
                    port: 0,
                    blockchainHeight: 0
                }));
                break;

            case 'registered':
                addSystemMessage(`* Registered as ${nodeKey}`);
                // Request peer list
                wsRef.current?.send(JSON.stringify({ type: 'getPeers' }));
                // Request machine registry
                wsRef.current?.send(JSON.stringify({ type: 'getMachineRegistry' }));
                // Register this machine with the relay
                const machineInfo = NODE_NETWORK[nodeKey];
                if (machineInfo) {
                    wsRef.current?.send(JSON.stringify({
                        type: 'machine_register',
                        machine: {
                            key: nodeKey,
                            node_id: nodeKey,
                            name: machineInfo.name,
                            type: machineInfo.type,
                            emoji: machineInfo.emoji,
                            platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
                            hardware: 'RangerPlex Full Install'
                        }
                    }));
                }
                break;

            case 'peerList':
            case 'peerListUpdate':
                const peers = msg.peers || [];
                // Build node list from peers
                const nodeList: NodeInfo[] = Object.entries(NODE_NETWORK).map(([key, info]) => {
                    const peer = peers.find((p: any) => p.address === key || p.address.includes(key));
                    return {
                        key,
                        ...info,
                        online: key === nodeKey || !!peer,
                        permission: key === nodeKey ? 'owner' : 'user'
                    };
                });
                setNodes(nodeList);

                if (msg.type === 'peerList') {
                    // Initial connection complete
                    setIsConnected(true);
                    setShowNodeSelector(false);
                    setIsConnecting(false);
                    addSystemMessage(`* Now talking in ${currentChannel}`);
                    addSystemMessage(`* ${peers.length} peer(s) online`);
                    addSystemMessage(`* ${nodeKey} has joined ${currentChannel}`, 'join');
                } else {
                    // Peer update
                    if (peers.length > 0) {
                        const latestPeer = peers[peers.length - 1];
                        if (latestPeer.address !== nodeKey) {
                            addSystemMessage(`* ${latestPeer.address} has joined the network`, 'join');
                        }
                    }
                }
                break;

            case 'nodeMessage':
                // Incoming message from another node!
                const payload = msg.payload;
                if (payload.type === 'chatMessage') {
                    const chatMsg: ChatMessage = {
                        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        from: msg.from,
                        fromName: NODE_NETWORK[msg.from]?.name || msg.from,
                        content: payload.message,
                        timestamp: payload.timestamp || Date.now(),
                        type: 'message',
                        channel: currentChannel
                    };
                    setMessages(prev => [...prev, chatMsg]);
                }
                break;

            case 'broadcastSent':
                // Our message was sent
                break;

            case 'error':
                addSystemMessage(`* Error: ${msg.message}`);
                break;

            // ========== MACHINE REGISTRY HANDLERS ==========

            case 'machine_registry':
                // Received machine list from relay
                if (msg.machines) {
                    setDynamicMachines(msg.machines);
                    // Update NODE_NETWORK with dynamic machines
                    msg.machines.forEach((m: any) => {
                        if (m.key && !NODE_NETWORK[m.key]) {
                            // Add dynamically discovered machine
                            (NODE_NETWORK as any)[m.key] = {
                                name: m.name || m.key,
                                ip: 'dynamic',
                                type: m.type || 'peer',
                                emoji: m.emoji || '💻'
                            };
                        }
                    });
                }
                if (msg.pending) {
                    setPendingJoinRequests(msg.pending);
                }
                if (msg.isAdmin !== undefined) {
                    setIsAdmin(msg.isAdmin);
                }
                break;

            case 'machine_join_request':
                // Admin received a join request
                if (msg.request) {
                    setPendingJoinRequests(prev => [...prev, msg.request]);
                    addSystemMessage(`* 🆕 Join request from: ${msg.request.name} (${msg.request.type})`);
                    // Auto-show the notification
                    setShowJoinRequests(true);
                }
                break;

            case 'machine_registered':
                // Response to our registration
                if (msg.status === 'approved') {
                    setMachineRegistrationStatus('approved');
                    if (msg.isAdmin) {
                        setIsAdmin(true);
                        addSystemMessage(`* 👑 You are a network admin!`);
                    }
                    addSystemMessage(`* ✅ ${msg.message || 'Machine registered!'}`);
                } else if (msg.status === 'pending') {
                    setMachineRegistrationStatus('pending');
                    addSystemMessage(`* ⏳ ${msg.message || 'Registration pending approval'}`);
                } else if (msg.status === 'rejected') {
                    setMachineRegistrationStatus('rejected');
                    addSystemMessage(`* ❌ ${msg.message || 'Registration rejected'}`);
                }
                break;

            case 'machine_approved':
                // Confirmation that we approved a machine
                if (msg.machine) {
                    addSystemMessage(`* ✅ Approved: ${msg.machine.name}`);
                    // Remove from pending
                    setPendingJoinRequests(prev => prev.filter(p => p.key !== msg.machine.key));
                    // Request updated registry
                    wsRef.current?.send(JSON.stringify({ type: 'getMachineRegistry' }));
                }
                break;

            case 'admin_granted':
                setIsAdmin(true);
                addSystemMessage(`* 👑 ${msg.message || 'You are now an admin!'}`);
                break;
        }
    }, [addSystemMessage, currentChannel]);

    // ==================== COMMANDS ====================

    const executeCommand = useCallback((input: string) => {
        const parts = input.trim().split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (cmd) {
            case '/help':
            case '/h':
                addSystemMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                addSystemMessage('💡 RANGERPLEXCHAIN CHAT COMMANDS');
                addSystemMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                addSystemMessage('/help (/h)     - Show this help');
                addSystemMessage('/quit (/q)     - Disconnect from chat');
                addSystemMessage('/join #channel - Join a channel');
                addSystemMessage('/part          - Leave current channel');
                addSystemMessage('/who           - List online nodes');
                addSystemMessage('/clear (/c)    - Clear messages');
                addSystemMessage('/me <action>   - Send action (/me waves)');
                addSystemMessage('/msg <node>    - Private message');
                addSystemMessage('/topic <text>  - Set channel topic (ops)');
                addSystemMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                addSystemMessage('🔐 ADMIN COMMANDS:');
                addSystemMessage('/kick <user>   - Kick user');
                addSystemMessage('/ban <user>    - Ban user');
                addSystemMessage('/op <user>     - Give operator status');
                addSystemMessage('/voice <user>  - Give voice');
                addSystemMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                addSystemMessage('🏆 EASTER EGG:');
                addSystemMessage('/block         - View the first internet blockchain chat!');
                addSystemMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                break;

            case '/quit':
            case '/q':
                addSystemMessage(`* ${currentNode} has quit (Leaving)`);
                setIsConnected(false);
                setShowNodeSelector(true);
                setCurrentNode(null);
                break;

            case '/clear':
            case '/c':
                setMessages([]);
                addSystemMessage('* Screen cleared');
                break;

            case '/who':
            case '/w':
                addSystemMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                addSystemMessage(`📊 NODES IN ${currentChannel.toUpperCase()}`);
                nodes.forEach(node => {
                    const status = node.online ? '🟢' : '🔴';
                    const perm = PERMISSION_SYMBOLS[node.permission];
                    addSystemMessage(`  ${status} ${perm}${node.emoji} ${node.name} (${node.ip})`);
                });
                addSystemMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                break;

            case '/join':
                if (args[0]) {
                    const channelName = args[0].startsWith('#') ? args[0] : `#${args[0]}`;
                    setCurrentChannel(channelName);
                    addSystemMessage(`* Now talking in ${channelName}`);
                }
                break;

            case '/me':
                if (args.length > 0) {
                    const action = args.join(' ');
                    const msg: ChatMessage = {
                        id: `action-${Date.now()}`,
                        from: currentNode || 'Unknown',
                        fromName: currentNode ? NODE_NETWORK[currentNode]?.name || currentNode : 'Unknown',
                        content: action,
                        timestamp: Date.now(),
                        type: 'action',
                        channel: currentChannel
                    };
                    setMessages(prev => [...prev, msg]);
                }
                break;

            case '/msg':
                if (args.length >= 2) {
                    const target = args[0].toUpperCase();
                    const pmContent = args.slice(1).join(' ');
                    addSystemMessage(`-> *${target}* ${pmContent}`);
                } else {
                    addSystemMessage('* Usage: /msg <node> <message>');
                }
                break;

            case '/topic':
                if (args.length > 0) {
                    const newTopic = args.join(' ');
                    setChannels(prev => prev.map(ch =>
                        ch.name === currentChannel ? { ...ch, topic: newTopic } : ch
                    ));
                    addSystemMessage(`* ${currentNode} changes topic to: ${newTopic}`);
                }
                break;

            case '/kick':
                if (args[0]) {
                    addSystemMessage(`* ${args[0]} was kicked by ${currentNode} (${args.slice(1).join(' ') || 'No reason given'})`, 'kick');
                }
                break;

            case '/ban':
                if (args[0]) {
                    addSystemMessage(`* ${args[0]} was banned by ${currentNode}`, 'ban');
                }
                break;

            case '/op':
                if (args[0]) {
                    addSystemMessage(`* ${currentNode} sets mode: +o ${args[0]}`);
                }
                break;

            case '/block':
            case '/genesis':
            case '/first':
                // 🎉 EASTER EGG: The First Internet Blockchain Chat!
                addSystemMessage('');
                addSystemMessage('╔═══════════════════════════════════════════════════════════════╗');
                addSystemMessage('║  🏆 BLOCK_001 - FIRST INTERNET BLOCKCHAIN CHAT 🏆             ║');
                addSystemMessage('║  November 29, 2025 at 23:44:25 UTC                            ║');
                addSystemMessage('╠═══════════════════════════════════════════════════════════════╣');
                addSystemMessage('║                                                               ║');
                addSystemMessage('║  📜 HISTORIC TRANSCRIPT:                                      ║');
                addSystemMessage('║  ────────────────────────────────────────────────────────     ║');
                addSystemMessage('║  [23:41:35] 🟢 M3Pro has joined #rangers                      ║');
                addSystemMessage('║  [23:41:41] <🏛️M3 Pro Genesis> hi                             ║');
                addSystemMessage('║  [23:44:25] 🟢 M4Max has joined the network                   ║');
                addSystemMessage('║  [23:44:40] <⚡M4 Max Compute> hi  ← INTERNET!                ║');
                addSystemMessage('║  [23:47:22] 🟢 M1Air has joined the network                   ║');
                addSystemMessage('║  [23:47:28] <🍎M1 Air Peer> hello there@ we have 3 machines!  ║');
                addSystemMessage('║                                                               ║');
                addSystemMessage('╠═══════════════════════════════════════════════════════════════╣');
                addSystemMessage('║  🌐 NETWORK TOPOLOGY:                                         ║');
                addSystemMessage('║  M3Pro (192.168.1.35) ←─ ngrok ─→ M4Max (iPhone/Cellular)    ║');
                addSystemMessage('║  tcp://2.tcp.eu.ngrok.io:12232                                ║');
                addSystemMessage('╠═══════════════════════════════════════════════════════════════╣');
                addSystemMessage('║  👨‍💻 Created by: David Keane (IrishRanger) + Claude Code       ║');
                addSystemMessage('║  🎓 Purpose: Master\'s Thesis - Blockchain Technology         ║');
                addSystemMessage('║  🎖️ "Rangers lead the way!"                                   ║');
                addSystemMessage('╚═══════════════════════════════════════════════════════════════╝');
                addSystemMessage('');
                break;

            case '/voice':
                if (args[0]) {
                    addSystemMessage(`* ${currentNode} sets mode: +v ${args[0]}`);
                }
                break;

            default:
                addSystemMessage(`* Unknown command: ${cmd} - Type /help for commands`);
        }
    }, [addSystemMessage, currentChannel, currentNode, nodes]);

    // ==================== SEND MESSAGE ====================

    const sendMessage = useCallback(async () => {
        if (!inputMessage.trim() || !currentNode) return;

        // Add to command history
        if (inputMessage.startsWith('/')) {
            setCommandHistory(prev => [...prev.slice(-49), inputMessage]);
        }
        setHistoryIndex(-1);

        // Handle commands
        if (inputMessage.startsWith('/')) {
            executeCommand(inputMessage);
            setInputMessage('');
            return;
        }

        // Regular message
        const msg: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            from: currentNode,
            fromName: NODE_NETWORK[currentNode]?.name || currentNode,
            content: inputMessage,
            timestamp: Date.now(),
            type: 'message',
            channel: currentChannel
        };

        setMessages(prev => [...prev, msg]);
        setInputMessage('');

        // Add message to blockchain
        addBlock({
            type: 'message',
            from: currentNode,
            fromName: NODE_NETWORK[currentNode]?.name || currentNode,
            content: inputMessage,
            channel: currentChannel
        });

        // Send via WebSocket broadcast to all peers
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'broadcast',
                payload: {
                    type: 'chatMessage',
                    from: currentNode,
                    message: inputMessage,
                    channel: currentChannel,
                    timestamp: Date.now()
                }
            }));
        }
    }, [inputMessage, currentNode, currentChannel, executeCommand, addBlock]);

    // ==================== KEY HANDLERS ====================

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
                setHistoryIndex(newIndex);
                setInputMessage(commandHistory[commandHistory.length - 1 - newIndex] || '');
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInputMessage(commandHistory[commandHistory.length - 1 - newIndex] || '');
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInputMessage('');
            }
        }
    };

    // ==================== EFFECTS ====================

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, showNodeSelector]);

    // WebSocket cleanup and heartbeat
    useEffect(() => {
        if (!isConnected || !wsRef.current) return;

        // Send heartbeat every 30 seconds to stay connected
        const heartbeat = setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);

        return () => {
            clearInterval(heartbeat);
            // Close WebSocket on unmount
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [isConnected]);

    if (!isOpen) return null;

    // ==================== NODE SELECTOR ====================

    if (showNodeSelector) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
                <div className="bg-[#1a1a2e] border-2 border-blue-500/50 rounded-lg shadow-2xl w-full max-w-md">
                    {/* Header */}
                    <div className="p-4 border-b border-blue-500/30 bg-gradient-to-r from-blue-900/30 to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🌐</span>
                                <div>
                                    <h2 className="text-lg font-bold text-blue-400 font-mono">
                                        RANGERPLEXCHAIN
                                    </h2>
                                    <p className="text-xs text-blue-400/60">Universal Chat Bridge</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-blue-400 hover:text-blue-300 text-2xl">×</button>
                        </div>
                    </div>

                    {/* Node Selection */}
                    <div className="p-4">
                        <p className="text-blue-400/80 text-sm mb-4 font-mono">🔐 SELECT YOUR NODE:</p>
                        <div className="space-y-2">
                            {Object.entries(NODE_NETWORK).map(([key, node]) => (
                                <button
                                    key={key}
                                    onClick={() => connectToNetwork(key)}
                                    disabled={isConnecting}
                                    className="w-full p-3 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/30 hover:border-blue-500 rounded-lg transition-all text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{node.emoji}</span>
                                        <div className="flex-1">
                                            <div className="text-blue-200 font-mono font-bold group-hover:text-white">
                                                {node.name}
                                            </div>
                                            <div className="text-xs text-blue-400/60 font-mono">
                                                {node.ip} • {node.type}
                                            </div>
                                        </div>
                                        <div className="text-blue-500/50 group-hover:text-blue-400">
                                            <i className="fa-solid fa-chevron-right"></i>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Relay Settings Toggle */}
                        <div className="mt-4 pt-4 border-t border-blue-500/20">
                            <button
                                onClick={() => setShowRelaySettings(!showRelaySettings)}
                                className="w-full flex items-center justify-between text-xs text-blue-400/60 hover:text-blue-400 font-mono py-2"
                            >
                                <span>⚙️ RELAY SETTINGS</span>
                                <span>{showRelaySettings ? '▼' : '▶'}</span>
                            </button>

                            {showRelaySettings && (
                                <div className="mt-2 p-3 bg-blue-900/20 rounded-lg border border-blue-500/20 space-y-3">
                                    {/* Server Selector Dropdown */}
                                    <div>
                                        <label className="text-xs text-blue-400/60 font-mono block mb-2">
                                            🖥️ SELECT DEFAULT SERVER:
                                        </label>
                                        <select
                                            value={relayPreset}
                                            onChange={(e) => {
                                                const preset = e.target.value as keyof typeof RELAY_PRESETS;
                                                setRelayPreset(preset);
                                                if (RELAY_PRESETS[preset]) {
                                                    setRelayHost(RELAY_PRESETS[preset].host);
                                                    setRelayPort(RELAY_PRESETS[preset].port);
                                                }
                                            }}
                                            className="w-full bg-blue-900/40 border border-blue-500/30 rounded px-2 py-2 text-blue-200 font-mono text-sm focus:border-blue-400 focus:outline-none cursor-pointer"
                                        >
                                            <option value="ngrok">🌐 ngrok (Internet) - Default</option>
                                            <option value="lan">🏠 LAN (M3Pro) - Local Network</option>
                                            <option value="cloud">☁️ Cloud (Coming Soon)</option>
                                            <option value="custom">⚙️ Custom Server</option>
                                        </select>
                                        <p className="text-[10px] text-blue-400/40 font-mono mt-1">
                                            {relayPreset === 'ngrok' && '→ Connect from anywhere via ngrok tunnel'}
                                            {relayPreset === 'lan' && '→ Local network only - M3Pro must be online'}
                                            {relayPreset === 'cloud' && '→ 24/7 uptime - Google Cloud VM (setup required)'}
                                            {relayPreset === 'custom' && '→ Enter your own relay server below'}
                                        </p>
                                    </div>

                                    {/* Test Buttons */}
                                    <div>
                                        <label className="text-xs text-blue-400/60 font-mono block mb-2">
                                            🧪 TEST CONNECTIVITY:
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={async () => {
                                                    setTestStatus(prev => ({ ...prev, lan: 'testing' }));
                                                    try {
                                                        const ws = new WebSocket(`ws://${RELAY_PRESETS.lan.host}:${RELAY_PRESETS.lan.port}`);
                                                        await new Promise((resolve, reject) => {
                                                            ws.onopen = () => { ws.close(); resolve(true); };
                                                            ws.onerror = reject;
                                                            setTimeout(() => reject(new Error('timeout')), 3000);
                                                        });
                                                        setTestStatus(prev => ({ ...prev, lan: 'success' }));
                                                    } catch {
                                                        setTestStatus(prev => ({ ...prev, lan: 'failed' }));
                                                    }
                                                }}
                                                className={`py-1.5 px-2 rounded text-xs font-mono border transition-colors ${
                                                    testStatus.lan === 'success' ? 'bg-green-900/40 border-green-500/50 text-green-400' :
                                                    testStatus.lan === 'failed' ? 'bg-red-900/40 border-red-500/50 text-red-400' :
                                                    testStatus.lan === 'testing' ? 'bg-yellow-900/40 border-yellow-500/50 text-yellow-400' :
                                                    'bg-blue-900/40 hover:bg-blue-900/60 border-blue-500/30 text-blue-300'
                                                }`}
                                            >
                                                {testStatus.lan === 'testing' ? '⏳ Testing...' :
                                                 testStatus.lan === 'success' ? '✅ LAN OK' :
                                                 testStatus.lan === 'failed' ? '❌ LAN Fail' :
                                                 '🏠 Test LAN'}
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setTestStatus(prev => ({ ...prev, ngrok: 'testing' }));
                                                    try {
                                                        const ws = new WebSocket(`ws://${RELAY_PRESETS.ngrok.host}:${RELAY_PRESETS.ngrok.port}`);
                                                        await new Promise((resolve, reject) => {
                                                            ws.onopen = () => { ws.close(); resolve(true); };
                                                            ws.onerror = reject;
                                                            setTimeout(() => reject(new Error('timeout')), 5000);
                                                        });
                                                        setTestStatus(prev => ({ ...prev, ngrok: 'success' }));
                                                    } catch {
                                                        setTestStatus(prev => ({ ...prev, ngrok: 'failed' }));
                                                    }
                                                }}
                                                className={`py-1.5 px-2 rounded text-xs font-mono border transition-colors ${
                                                    testStatus.ngrok === 'success' ? 'bg-green-900/40 border-green-500/50 text-green-400' :
                                                    testStatus.ngrok === 'failed' ? 'bg-red-900/40 border-red-500/50 text-red-400' :
                                                    testStatus.ngrok === 'testing' ? 'bg-yellow-900/40 border-yellow-500/50 text-yellow-400' :
                                                    'bg-purple-900/40 hover:bg-purple-900/60 border-purple-500/30 text-purple-300'
                                                }`}
                                            >
                                                {testStatus.ngrok === 'testing' ? '⏳ Testing...' :
                                                 testStatus.ngrok === 'success' ? '✅ ngrok OK' :
                                                 testStatus.ngrok === 'failed' ? '❌ ngrok Fail' :
                                                 '🌐 Test ngrok'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Manual Host/Port (for custom) */}
                                    {relayPreset === 'custom' && (
                                        <>
                                            <div>
                                                <label className="text-xs text-blue-400/60 font-mono block mb-1">
                                                    Relay Host:
                                                </label>
                                                <input
                                                    type="text"
                                                    value={relayHost}
                                                    onChange={(e) => setRelayHost(e.target.value)}
                                                    className="w-full bg-blue-900/30 border border-blue-500/30 rounded px-2 py-1 text-blue-200 font-mono text-sm focus:border-blue-400 focus:outline-none"
                                                    placeholder="your-server.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-blue-400/60 font-mono block mb-1">
                                                    Relay Port:
                                                </label>
                                                <input
                                                    type="number"
                                                    value={relayPort}
                                                    onChange={(e) => setRelayPort(parseInt(e.target.value) || 5555)}
                                                    className="w-full bg-blue-900/30 border border-blue-500/30 rounded px-2 py-1 text-blue-200 font-mono text-sm focus:border-blue-400 focus:outline-none"
                                                    placeholder="5555"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Current Settings Display */}
                                    <div className="p-2 bg-black/30 rounded border border-blue-500/20">
                                        <p className="text-[10px] text-blue-400/60 font-mono">CURRENT RELAY:</p>
                                        <p className="text-xs text-cyan-400 font-mono">{relayHost}:{relayPort}</p>
                                    </div>

                                    {/* Save Button */}
                                    <button
                                        onClick={() => {
                                            saveRelaySettings(relayHost, relayPort, relayPreset);
                                            alert(`✅ Saved!\n\nServer: ${relayPreset}\nRelay: ${relayHost}:${relayPort}`);
                                        }}
                                        className="w-full py-2 bg-green-900/40 hover:bg-green-900/60 text-green-400 rounded text-sm font-mono border border-green-500/30 font-bold"
                                    >
                                        💾 SAVE AS DEFAULT
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-blue-500/20 text-center">
                            <p className="text-xs text-blue-400/40 font-mono">
                                🏔️ "One foot in front of the other"
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==================== MAIN CHAT UI ====================

    const currentNodeInfo = currentNode ? NODE_NETWORK[currentNode] : null;
    const currentChannelInfo = channels.find(c => c.name === currentChannel);

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-[#0d0d1a] border border-blue-500/30 rounded-lg shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">

                {/* ===== TITLE BAR ===== */}
                <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-900/40 to-purple-900/20 border-b border-blue-500/30">
                    <div className="flex items-center gap-3">
                        <span className="text-lg">🌐</span>
                        <span className="font-mono font-bold text-blue-400">RangerPlexChain</span>
                        <span className="text-blue-400/50">|</span>
                        <span className="font-mono text-sm text-blue-300">{currentChannel}</span>
                        {isConnected && (
                            <span className="px-2 py-0.5 bg-green-900/50 text-green-400 text-xs rounded font-mono">
                                CONNECTED
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Voice Call Button */}
                        <button
                            onClick={() => alert('📞 BlockCall coming soon!\n\nVoice calls over blockchain relay.\nFiles ready in: rangerblock/future-features/voice-video/')}
                            className="p-1.5 text-green-500/50 hover:text-green-400 hover:bg-green-500/20 rounded transition-colors"
                            title="BlockCall (Coming Soon)"
                            disabled={!isConnected}
                        >
                            <i className="fa-solid fa-phone text-sm"></i>
                        </button>
                        {/* Video Call Button */}
                        <button
                            onClick={() => alert('🎥 BlockVideoCall coming soon!\n\nVideo calls over blockchain relay.\nFiles ready in: rangerblock/future-features/voice-video/')}
                            className="p-1.5 text-purple-500/50 hover:text-purple-400 hover:bg-purple-500/20 rounded transition-colors"
                            title="BlockVideoCall (Coming Soon)"
                            disabled={!isConnected}
                        >
                            <i className="fa-solid fa-video text-sm"></i>
                        </button>
                        {/* File Transfer Button */}
                        <button
                            onClick={() => alert('📁 BlockFile coming soon!\n\nSecure file transfer over blockchain.\nFiles ready in: rangerblock/future-features/voice-video/')}
                            className="p-1.5 text-yellow-500/50 hover:text-yellow-400 hover:bg-yellow-500/20 rounded transition-colors"
                            title="BlockFile Transfer (Coming Soon)"
                            disabled={!isConnected}
                        >
                            <i className="fa-solid fa-file-arrow-up text-sm"></i>
                        </button>
                        <span className="w-px h-4 bg-blue-500/30"></span>
                        {/* Blockchain Explorer Button */}
                        <button
                            onClick={() => setShowBlockExplorer(true)}
                            className="p-1.5 text-cyan-500/70 hover:text-cyan-400 hover:bg-cyan-500/20 rounded transition-colors relative"
                            title="Blockchain Explorer"
                        >
                            <i className="fa-solid fa-cubes text-sm"></i>
                            <span className="absolute -top-1 -right-1 bg-cyan-500 text-[9px] text-black font-bold px-1 rounded-full">
                                {blockchain.length}
                            </span>
                        </button>
                        {/* Smart Contracts Button */}
                        <button
                            onClick={() => setShowSmartContracts(true)}
                            className="p-1.5 text-emerald-500/70 hover:text-emerald-400 hover:bg-emerald-500/20 rounded transition-colors relative"
                            title="Smart Contracts"
                        >
                            <i className="fa-solid fa-file-contract text-sm"></i>
                            {deployedContracts.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-emerald-500 text-[9px] text-black font-bold px-1 rounded-full">
                                    {deployedContracts.length}
                                </span>
                            )}
                        </button>
                        {/* Join Requests Button (Admin Only) */}
                        {isAdmin && pendingJoinRequests.length > 0 && (
                            <button
                                onClick={() => setShowJoinRequests(true)}
                                className="p-1.5 text-orange-500/70 hover:text-orange-400 hover:bg-orange-500/20 rounded transition-colors relative animate-pulse"
                                title="Pending Join Requests"
                            >
                                <i className="fa-solid fa-user-plus text-sm"></i>
                                <span className="absolute -top-1 -right-1 bg-orange-500 text-[9px] text-black font-bold px-1 rounded-full">
                                    {pendingJoinRequests.length}
                                </span>
                            </button>
                        )}
                        {/* Admin Badge */}
                        {isAdmin && (
                            <span className="text-[10px] text-yellow-500 bg-yellow-500/20 px-1.5 rounded" title="Network Admin">
                                👑
                            </span>
                        )}
                        <span className="w-px h-4 bg-blue-500/30"></span>
                        <button
                            onClick={() => setShowUserList(!showUserList)}
                            className={`p-1.5 rounded ${showUserList ? 'bg-blue-500/30 text-blue-300' : 'text-blue-500/50 hover:text-blue-400'}`}
                            title="Toggle user list"
                        >
                            <i className="fa-solid fa-users text-sm"></i>
                        </button>
                        <button
                            onClick={() => { setShowNodeSelector(true); setIsConnected(false); }}
                            className="p-1.5 text-blue-500/50 hover:text-blue-400 rounded"
                            title="Switch node"
                        >
                            <i className="fa-solid fa-right-left text-sm"></i>
                        </button>
                        <button onClick={onClose} className="p-1.5 text-blue-500/50 hover:text-red-400 rounded">
                            <i className="fa-solid fa-xmark text-sm"></i>
                        </button>
                    </div>
                </div>

                {/* ===== TOPIC BAR ===== */}
                <div className="px-3 py-1.5 bg-blue-900/10 border-b border-blue-500/20 text-xs font-mono text-blue-400/80 truncate">
                    📌 {currentChannelInfo?.topic || 'No topic set'}
                </div>

                {/* ===== MAIN CONTENT ===== */}
                <div className="flex-1 flex overflow-hidden">

                    {/* ===== CHANNEL LIST ===== */}
                    <div className="w-40 border-r border-blue-500/20 bg-[#0a0a15] flex flex-col">
                        <div className="p-2 text-xs font-mono text-blue-500/60 uppercase tracking-wider">
                            Channels
                        </div>
                        {channels.map(ch => (
                            <button
                                key={ch.name}
                                onClick={() => setCurrentChannel(ch.name)}
                                className={`px-3 py-1.5 text-left font-mono text-sm transition-colors ${
                                    ch.name === currentChannel
                                        ? 'bg-blue-900/40 text-blue-300 border-l-2 border-blue-500'
                                        : 'text-blue-500/70 hover:bg-blue-900/20 hover:text-blue-400'
                                }`}
                            >
                                {ch.moderated && <i className="fa-solid fa-lock text-[10px] mr-1 opacity-50"></i>}
                                {ch.name}
                            </button>
                        ))}

                        {/* Current Identity */}
                        <div className="mt-auto p-2 border-t border-blue-500/20 bg-blue-900/10">
                            <div className="text-xs text-blue-400/60 font-mono mb-1">Your Node:</div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{currentNodeInfo?.emoji}</span>
                                <span className="text-xs text-blue-300 font-mono truncate">{currentNodeInfo?.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* ===== MESSAGES AREA ===== */}
                    <div className="flex-1 flex flex-col bg-[#0d0d1a]">
                        <div className="flex-1 overflow-y-auto p-2 font-mono text-sm">
                            {messages.filter(m => !m.channel || m.channel === currentChannel).map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`py-0.5 hover:bg-white/5 px-2 -mx-2 ${msg.type === 'message' ? 'cursor-pointer group' : ''}`}
                                    onClick={() => {
                                        if (msg.type === 'message') {
                                            setSelectedMessage(msg);
                                            setShowMessageTracer(true);
                                        }
                                    }}
                                >
                                    <span className="text-blue-500/50">[{formatTimestamp(msg.timestamp)}]</span>
                                    {msg.type === 'system' ? (
                                        <span className="text-yellow-500/80 ml-2">{msg.content}</span>
                                    ) : msg.type === 'action' ? (
                                        <span className="text-purple-400 ml-2">
                                            * {NODE_NETWORK[msg.from]?.emoji || '❓'} {msg.fromName} {msg.content}
                                        </span>
                                    ) : msg.type === 'join' ? (
                                        <span className="text-green-500 ml-2">
                                            → {NODE_NETWORK[msg.from]?.emoji || '🟢'} {msg.content}
                                        </span>
                                    ) : msg.type === 'part' || msg.type === 'kick' ? (
                                        <span className="text-red-400 ml-2">
                                            ← {msg.content}
                                        </span>
                                    ) : (
                                        <>
                                            <span className="ml-2">
                                                <span className="text-blue-400/70">&lt;</span>
                                                <span className={getNodeColor(msg.from)}>
                                                    {NODE_NETWORK[msg.from]?.emoji || '❓'}
                                                    {msg.fromName}
                                                </span>
                                                <span className="text-blue-400/70">&gt;</span>
                                            </span>
                                            <span className="text-gray-200 ml-1">{msg.content}</span>
                                            {/* Trace indicator */}
                                            <span className="ml-2 opacity-0 group-hover:opacity-100 text-cyan-500/50 text-xs transition-opacity">
                                                <i className="fa-solid fa-route"></i> trace
                                            </span>
                                        </>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* ===== INPUT ===== */}
                        <div className="border-t border-blue-500/30 bg-[#0a0a15] p-2">
                            <div className="flex items-center gap-2">
                                <span className="text-blue-400 font-mono text-sm">
                                    {currentNodeInfo?.emoji} {currentChannel} &gt;
                                </span>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message or /help for commands..."
                                    className="flex-1 bg-transparent border-none outline-none text-gray-200 font-mono text-sm placeholder-blue-500/30"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!inputMessage.trim()}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/30 disabled:text-blue-500/30 text-white text-sm font-mono rounded transition-colors"
                                >
                                    SEND
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ===== USER LIST ===== */}
                    {showUserList && (
                        <div className="w-48 border-l border-blue-500/20 bg-[#0a0a15] flex flex-col">
                            <div className="p-2 text-xs font-mono text-blue-500/60 uppercase tracking-wider border-b border-blue-500/20">
                                Users ({nodes.filter(n => n.online).length})
                            </div>
                            <div className="flex-1 overflow-y-auto p-1">
                                {/* Owners */}
                                {nodes.filter(n => n.permission === 'owner' && n.online).length > 0 && (
                                    <div className="mb-2">
                                        <div className="text-[10px] text-red-400/60 px-2 mb-1">OWNERS</div>
                                        {nodes.filter(n => n.permission === 'owner' && n.online).map(node => (
                                            <div key={node.key} className="px-2 py-0.5 text-sm font-mono flex items-center gap-1.5 hover:bg-white/5 rounded">
                                                <span className="text-red-400 font-bold">~</span>
                                                <span>{node.emoji}</span>
                                                <span className={PERMISSION_COLORS[node.permission]}>{node.name.split(' ')[0]}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Admins/Ops */}
                                {nodes.filter(n => ['admin', 'op'].includes(n.permission) && n.online).length > 0 && (
                                    <div className="mb-2">
                                        <div className="text-[10px] text-green-400/60 px-2 mb-1">OPS</div>
                                        {nodes.filter(n => ['admin', 'op'].includes(n.permission) && n.online).map(node => (
                                            <div key={node.key} className="px-2 py-0.5 text-sm font-mono flex items-center gap-1.5 hover:bg-white/5 rounded">
                                                <span className="text-green-400 font-bold">{PERMISSION_SYMBOLS[node.permission]}</span>
                                                <span>{node.emoji}</span>
                                                <span className={PERMISSION_COLORS[node.permission]}>{node.name.split(' ')[0]}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Regular Users */}
                                {nodes.filter(n => ['user', 'voice'].includes(n.permission) && n.online).length > 0 && (
                                    <div className="mb-2">
                                        <div className="text-[10px] text-gray-400/60 px-2 mb-1">USERS</div>
                                        {nodes.filter(n => ['user', 'voice'].includes(n.permission) && n.online).map(node => (
                                            <div key={node.key} className="px-2 py-0.5 text-sm font-mono flex items-center gap-1.5 hover:bg-white/5 rounded">
                                                <span className="text-yellow-400">{PERMISSION_SYMBOLS[node.permission]}</span>
                                                <span>{node.emoji}</span>
                                                <span className="text-gray-300">{node.name.split(' ')[0]}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Offline */}
                                {nodes.filter(n => !n.online).length > 0 && (
                                    <div className="mt-4 pt-2 border-t border-blue-500/10">
                                        <div className="text-[10px] text-gray-600 px-2 mb-1">OFFLINE</div>
                                        {nodes.filter(n => !n.online).map(node => (
                                            <div key={node.key} className="px-2 py-0.5 text-sm font-mono flex items-center gap-1.5 opacity-40">
                                                <span className="text-gray-600">•</span>
                                                <span>{node.emoji}</span>
                                                <span className="text-gray-500">{node.name.split(' ')[0]}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ===== STATUS BAR ===== */}
                <div className="flex items-center justify-between px-3 py-1 bg-blue-900/20 border-t border-blue-500/20 text-xs font-mono text-blue-400/60">
                    <div className="flex items-center gap-4">
                        <span>🎖️ Rangers Lead The Way!</span>
                        <span>|</span>
                        <span>{nodes.filter(n => n.online).length} online</span>
                        <span>|</span>
                        <span className="text-cyan-400">{blockchain.length} blocks</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Type /help for commands</span>
                    </div>
                </div>
            </div>

            {/* ===== BLOCKCHAIN EXPLORER MODAL ===== */}
            {showBlockExplorer && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
                    <div className="bg-[#0a0a15] border-2 border-cyan-500/50 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-cyan-500/20">
                        {/* Explorer Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-900/40 to-blue-900/20 border-b border-cyan-500/30">
                            <div className="flex items-center gap-3">
                                <i className="fa-solid fa-cubes text-cyan-400 text-xl"></i>
                                <span className="font-mono font-bold text-cyan-300 text-lg">RangerPlexChain Explorer</span>
                                <span className="px-2 py-0.5 bg-cyan-900/50 text-cyan-300 text-xs rounded font-mono">
                                    {blockchain.length} BLOCKS
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={downloadBlockchain}
                                    className="px-3 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-sm font-mono rounded flex items-center gap-2 transition-colors"
                                >
                                    <i className="fa-solid fa-download"></i>
                                    Export Chain
                                </button>
                                <button
                                    onClick={() => { setShowBlockExplorer(false); setSelectedBlock(null); }}
                                    className="p-2 text-cyan-500/70 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                                >
                                    <i className="fa-solid fa-xmark text-lg"></i>
                                </button>
                            </div>
                        </div>

                        {/* Explorer Content */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Block List */}
                            <div className="w-1/2 border-r border-cyan-500/20 overflow-y-auto p-4">
                                <div className="text-xs font-mono text-cyan-500/60 mb-3">BLOCKCHAIN VISUALIZATION</div>

                                {/* Chain visualization */}
                                <div className="space-y-2">
                                    {[...blockchain].reverse().map((block, idx) => (
                                        <div key={block.index} className="relative">
                                            {/* Chain link */}
                                            {idx < blockchain.length - 1 && (
                                                <div className="absolute left-6 -bottom-2 w-0.5 h-4 bg-gradient-to-b from-cyan-500/50 to-cyan-500/20"></div>
                                            )}

                                            {/* Block card */}
                                            <button
                                                onClick={() => setSelectedBlock(block)}
                                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                                    selectedBlock?.index === block.index
                                                        ? 'bg-cyan-900/40 border-cyan-500 shadow-lg shadow-cyan-500/20'
                                                        : 'bg-[#0d0d1a] border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-900/20'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Block icon */}
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                        block.data.type === 'genesis'
                                                            ? 'bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border border-yellow-500/50'
                                                            : block.data.type === 'message'
                                                            ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-cyan-500/50'
                                                            : 'bg-gradient-to-br from-green-500/30 to-teal-500/30 border border-green-500/50'
                                                    }`}>
                                                        {block.data.type === 'genesis' ? '🏛️' :
                                                         block.data.type === 'message' ? '💬' :
                                                         block.data.type === 'join' ? '🟢' : '📦'}
                                                    </div>

                                                    {/* Block info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-cyan-300">
                                                                Block #{block.index}
                                                            </span>
                                                            {block.data.type === 'genesis' && (
                                                                <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] rounded font-bold">
                                                                    GENESIS
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-400 truncate mt-0.5">
                                                            {block.data.type === 'message' ? (
                                                                <><span className="text-cyan-400">{block.data.fromName}:</span> {block.data.content}</>
                                                            ) : (
                                                                block.data.content
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-cyan-600 font-mono mt-1">
                                                            {new Date(block.timestamp).toLocaleString()}
                                                        </div>
                                                    </div>

                                                    {/* Hash preview */}
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-gray-500 font-mono">
                                                            {block.hash.substring(0, 8)}...
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Block Detail Panel */}
                            <div className="w-1/2 overflow-y-auto p-4 bg-[#080810]">
                                {selectedBlock ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-mono font-bold text-cyan-300 text-lg">
                                                Block #{selectedBlock.index} Details
                                            </h3>
                                            <button
                                                onClick={() => downloadBlock(selectedBlock)}
                                                className="px-2 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-xs font-mono rounded flex items-center gap-1.5 transition-colors"
                                            >
                                                <i className="fa-solid fa-download text-[10px]"></i>
                                                Download JSON
                                            </button>
                                        </div>

                                        {/* Block metadata */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-[#0d0d1a] p-3 rounded-lg border border-cyan-500/20">
                                                <div className="text-[10px] text-cyan-500/60 font-mono mb-1">INDEX</div>
                                                <div className="text-lg font-mono text-cyan-300">{selectedBlock.index}</div>
                                            </div>
                                            <div className="bg-[#0d0d1a] p-3 rounded-lg border border-cyan-500/20">
                                                <div className="text-[10px] text-cyan-500/60 font-mono mb-1">NONCE</div>
                                                <div className="text-lg font-mono text-cyan-300">{selectedBlock.nonce}</div>
                                            </div>
                                            <div className="bg-[#0d0d1a] p-3 rounded-lg border border-cyan-500/20 col-span-2">
                                                <div className="text-[10px] text-cyan-500/60 font-mono mb-1">TIMESTAMP</div>
                                                <div className="font-mono text-cyan-300">
                                                    {new Date(selectedBlock.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hashes */}
                                        <div className="space-y-2">
                                            <div className="bg-[#0d0d1a] p-3 rounded-lg border border-cyan-500/20">
                                                <div className="text-[10px] text-cyan-500/60 font-mono mb-1">HASH</div>
                                                <div className="font-mono text-xs text-green-400 break-all">
                                                    {selectedBlock.hash}
                                                </div>
                                            </div>
                                            <div className="bg-[#0d0d1a] p-3 rounded-lg border border-cyan-500/20">
                                                <div className="text-[10px] text-cyan-500/60 font-mono mb-1">PREVIOUS HASH</div>
                                                <div className="font-mono text-xs text-yellow-400 break-all">
                                                    {selectedBlock.previousHash}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Block Data */}
                                        <div className="bg-[#0d0d1a] p-3 rounded-lg border border-cyan-500/20">
                                            <div className="text-[10px] text-cyan-500/60 font-mono mb-2">BLOCK DATA</div>
                                            <div className="bg-black/50 p-3 rounded font-mono text-xs overflow-x-auto">
                                                <pre className="text-gray-300 whitespace-pre-wrap">
{JSON.stringify(selectedBlock.data, null, 2)}
                                                </pre>
                                            </div>
                                        </div>

                                        {/* Full JSON */}
                                        <div className="bg-[#0d0d1a] p-3 rounded-lg border border-cyan-500/20">
                                            <div className="text-[10px] text-cyan-500/60 font-mono mb-2">FULL BLOCK JSON</div>
                                            <div className="bg-black/50 p-3 rounded font-mono text-[11px] overflow-x-auto max-h-64 overflow-y-auto">
                                                <pre className="text-cyan-200 whitespace-pre-wrap">
{JSON.stringify(selectedBlock, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                        <i className="fa-solid fa-cube text-4xl mb-3 text-cyan-500/30"></i>
                                        <div className="font-mono text-sm">Select a block to view details</div>
                                        <div className="text-xs mt-1 text-gray-600">Click any block on the left</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Explorer Footer */}
                        <div className="px-4 py-2 bg-cyan-900/20 border-t border-cyan-500/30 text-xs font-mono text-cyan-400/60 flex items-center justify-between">
                            <span>🎖️ RangerPlexChain - P2P Blockchain Network</span>
                            <span>Chain Height: {blockchain.length - 1} | Genesis: Block #0</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== TRON MESSAGE JOURNEY TRACER ===== */}
            {showMessageTracer && selectedMessage && (
                <div className="fixed inset-0 bg-black/98 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
                    <div className="bg-[#050510] border-2 border-cyan-500/60 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-cyan-500/30">
                        {/* Tron Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-900/50 via-blue-900/30 to-purple-900/30 border-b border-cyan-500/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-cyan-500/30 border-2 border-cyan-400 flex items-center justify-center animate-pulse">
                                    <i className="fa-solid fa-route text-cyan-400 text-sm"></i>
                                </div>
                                <span className="font-mono font-bold text-cyan-300 text-lg tracking-wider">MESSAGE JOURNEY TRACER</span>
                                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full font-mono border border-cyan-500/40">
                                    TRON MODE
                                </span>
                            </div>
                            <button
                                onClick={() => { setShowMessageTracer(false); setSelectedMessage(null); }}
                                className="p-2 text-cyan-500/70 hover:text-red-400 hover:bg-red-500/20 rounded-full transition-all border border-transparent hover:border-red-500/50"
                            >
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Network Visualization Panel */}
                            <div className="flex-1 relative overflow-hidden bg-[#020208]">
                                {/* Grid Background */}
                                <div className="absolute inset-0 opacity-20"
                                    style={{
                                        backgroundImage: `
                                            linear-gradient(to right, rgba(0,255,255,0.1) 1px, transparent 1px),
                                            linear-gradient(to bottom, rgba(0,255,255,0.1) 1px, transparent 1px)
                                        `,
                                        backgroundSize: '50px 50px'
                                    }}
                                />

                                {/* Glowing Border Lines */}
                                <div className="absolute inset-4 border border-cyan-500/20 rounded-lg pointer-events-none">
                                    <div className="absolute top-0 left-0 w-32 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent animate-pulse"></div>
                                    <div className="absolute top-0 right-0 w-32 h-0.5 bg-gradient-to-l from-cyan-500 to-transparent animate-pulse"></div>
                                    <div className="absolute bottom-0 left-0 w-32 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent animate-pulse"></div>
                                    <div className="absolute bottom-0 right-0 w-32 h-0.5 bg-gradient-to-l from-cyan-500 to-transparent animate-pulse"></div>
                                </div>

                                {/* Network Title */}
                                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-center">
                                    <div className="text-[10px] font-mono text-cyan-500/60 tracking-[0.3em]">RANGERBLOCK P2P NETWORK</div>
                                    <div className="text-xs text-cyan-400/40 font-mono mt-0.5">MESSAGE ROUTE VISUALIZATION</div>
                                </div>

                                {/* SVG Network Map */}
                                <svg className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,255,0.3))' }}>
                                    {/* Connection Lines with Animation */}
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#00ffff" stopOpacity="0.8" />
                                            <stop offset="50%" stopColor="#00ccff" stopOpacity="1" />
                                            <stop offset="100%" stopColor="#00ffff" stopOpacity="0.8" />
                                        </linearGradient>
                                        <filter id="glow">
                                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                            <feMerge>
                                                <feMergeNode in="coloredBlur"/>
                                                <feMergeNode in="SourceGraphic"/>
                                            </feMerge>
                                        </filter>
                                        {/* Animated dash for data flow */}
                                        <pattern id="flow-pattern" width="20" height="1" patternUnits="userSpaceOnUse">
                                            <rect width="10" height="1" fill="url(#lineGradient)">
                                                <animate attributeName="x" from="-20" to="0" dur="0.5s" repeatCount="indefinite"/>
                                            </rect>
                                        </pattern>
                                    </defs>

                                    {/* Source to Relay Line */}
                                    <line x1="20%" y1="50%" x2="50%" y2="30%" stroke="url(#lineGradient)" strokeWidth="2" filter="url(#glow)" strokeDasharray="8,4">
                                        <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite"/>
                                    </line>

                                    {/* Relay to Bridge Line */}
                                    <line x1="50%" y1="30%" x2="50%" y2="70%" stroke="url(#lineGradient)" strokeWidth="2" filter="url(#glow)" strokeDasharray="8,4">
                                        <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite"/>
                                    </line>

                                    {/* Bridge to Destinations */}
                                    <line x1="50%" y1="70%" x2="80%" y2="40%" stroke="url(#lineGradient)" strokeWidth="2" filter="url(#glow)" strokeDasharray="8,4">
                                        <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite"/>
                                    </line>
                                    <line x1="50%" y1="70%" x2="80%" y2="60%" stroke="url(#lineGradient)" strokeWidth="2" filter="url(#glow)" strokeDasharray="8,4">
                                        <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite"/>
                                    </line>
                                    <line x1="50%" y1="70%" x2="80%" y2="80%" stroke="url(#lineGradient)" strokeWidth="2" filter="url(#glow)" strokeDasharray="8,4">
                                        <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite"/>
                                    </line>
                                </svg>

                                {/* Node: Source */}
                                <div className="absolute left-[15%] top-[45%] transform -translate-x-1/2 -translate-y-1/2 text-center group cursor-pointer">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/40 to-emerald-600/20 border-2 border-green-400 flex items-center justify-center relative shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                                        <div className="absolute inset-0 rounded-full border-2 border-green-400/50 animate-ping"></div>
                                        <span className="text-3xl">{NODE_NETWORK[selectedMessage.from]?.emoji || '📡'}</span>
                                    </div>
                                    <div className="mt-2 font-mono text-xs text-green-400 font-bold tracking-wider">SOURCE</div>
                                    <div className="text-[10px] text-green-300/80 font-mono">{selectedMessage.fromName}</div>
                                </div>

                                {/* Node: Relay (ngrok or M3Pro) */}
                                <div className="absolute left-[50%] top-[25%] transform -translate-x-1/2 -translate-y-1/2 text-center group cursor-pointer">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/40 to-indigo-600/20 border-2 border-blue-400 flex items-center justify-center relative shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                        <span className="text-2xl">🌐</span>
                                    </div>
                                    <div className="mt-2 font-mono text-xs text-blue-400 font-bold tracking-wider">RELAY</div>
                                    <div className="text-[10px] text-blue-300/80 font-mono">ngrok (Internet)</div>
                                </div>

                                {/* Node: Bridge */}
                                <div className="absolute left-[50%] top-[65%] transform -translate-x-1/2 -translate-y-1/2 text-center group cursor-pointer">
                                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/40 to-violet-600/20 border-2 border-purple-400 flex items-center justify-center relative shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                                        <span className="text-2xl">🌉</span>
                                    </div>
                                    <div className="mt-2 font-mono text-xs text-purple-400 font-bold tracking-wider">BRIDGE</div>
                                    <div className="text-[10px] text-purple-300/80 font-mono">Cloud Relay</div>
                                </div>

                                {/* Destination Nodes */}
                                {Object.entries(NODE_NETWORK).filter(([key]) => key !== selectedMessage.from).slice(0, 3).map(([key, node], idx) => (
                                    <div
                                        key={key}
                                        className="absolute right-[15%] transform translate-x-1/2 -translate-y-1/2 text-center group cursor-pointer"
                                        style={{ top: `${35 + idx * 20}%` }}
                                    >
                                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/20 border-2 border-cyan-400/70 flex items-center justify-center relative shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform ${idx === 0 ? 'animate-pulse' : ''}`}>
                                            <span className="text-xl">{node.emoji}</span>
                                        </div>
                                        <div className="mt-1 font-mono text-[10px] text-cyan-400 font-bold">{key}</div>
                                    </div>
                                ))}

                                {/* Traveling Packet Animation */}
                                <div className="absolute w-4 h-4 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/80 animate-bounce"
                                    style={{
                                        left: '35%',
                                        top: '40%',
                                        animation: 'pulse 1s infinite, tronMove 3s ease-in-out infinite'
                                    }}
                                />

                                {/* Stats Overlay */}
                                <div className="absolute bottom-6 left-6 bg-black/80 border border-cyan-500/40 rounded-lg p-3 backdrop-blur-sm">
                                    <div className="text-[10px] font-mono text-cyan-500/60 mb-2 tracking-wider">ROUTE STATISTICS</div>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-mono">
                                        <span className="text-cyan-400/60">Total Hops:</span>
                                        <span className="text-cyan-300">3</span>
                                        <span className="text-cyan-400/60">Latency:</span>
                                        <span className="text-green-400">&lt; 50ms</span>
                                        <span className="text-cyan-400/60">Protocol:</span>
                                        <span className="text-purple-400">WebSocket</span>
                                        <span className="text-cyan-400/60">Encryption:</span>
                                        <span className="text-yellow-400">TLS 1.3</span>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="absolute bottom-6 right-6 bg-black/80 border border-cyan-500/40 rounded-lg p-3 backdrop-blur-sm">
                                    <div className="text-[10px] font-mono text-cyan-500/60 mb-2 tracking-wider">LEGEND</div>
                                    <div className="space-y-1.5 text-xs font-mono">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-500/60 border border-green-400"></div>
                                            <span className="text-green-400">Source Node</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-500/60 border border-blue-400"></div>
                                            <span className="text-blue-400">Relay Server</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-purple-500/60 border border-purple-400"></div>
                                            <span className="text-purple-400">Bridge Node</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-cyan-500/60 border border-cyan-400"></div>
                                            <span className="text-cyan-400">Destination</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Message Details Panel */}
                            <div className="w-80 border-l border-cyan-500/30 bg-[#0a0a15] overflow-y-auto">
                                <div className="p-4 border-b border-cyan-500/20">
                                    <div className="text-[10px] font-mono text-cyan-500/60 tracking-wider mb-2">MESSAGE CONTENT</div>
                                    <div className="bg-black/50 border border-cyan-500/20 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">{NODE_NETWORK[selectedMessage.from]?.emoji || '❓'}</span>
                                            <span className="font-mono text-sm text-cyan-300">{selectedMessage.fromName}</span>
                                        </div>
                                        <div className="text-sm text-gray-200 font-mono leading-relaxed">
                                            {selectedMessage.content}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border-b border-cyan-500/20">
                                    <div className="text-[10px] font-mono text-cyan-500/60 tracking-wider mb-2">TIMESTAMP</div>
                                    <div className="font-mono text-sm text-cyan-300">
                                        {new Date(selectedMessage.timestamp).toLocaleString()}
                                    </div>
                                    <div className="text-xs text-cyan-500/50 font-mono mt-1">
                                        UNIX: {selectedMessage.timestamp}
                                    </div>
                                </div>

                                <div className="p-4 border-b border-cyan-500/20">
                                    <div className="text-[10px] font-mono text-cyan-500/60 tracking-wider mb-2">MESSAGE ID</div>
                                    <div className="font-mono text-xs text-purple-400 break-all">
                                        {selectedMessage.id}
                                    </div>
                                </div>

                                <div className="p-4 border-b border-cyan-500/20">
                                    <div className="text-[10px] font-mono text-cyan-500/60 tracking-wider mb-2">CHANNEL</div>
                                    <div className="font-mono text-sm text-yellow-400">
                                        {selectedMessage.channel || '#rangers'}
                                    </div>
                                </div>

                                <div className="p-4 border-b border-cyan-500/20">
                                    <div className="text-[10px] font-mono text-cyan-500/60 tracking-wider mb-2">ROUTE PATH</div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-mono">
                                            <span className="text-green-400">1.</span>
                                            <span className="text-green-300">{selectedMessage.fromName}</span>
                                            <span className="text-gray-500">→</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-mono">
                                            <span className="text-blue-400">2.</span>
                                            <span className="text-blue-300">ngrok Relay</span>
                                            <span className="text-gray-500">→</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-mono">
                                            <span className="text-purple-400">3.</span>
                                            <span className="text-purple-300">Cloud Bridge</span>
                                            <span className="text-gray-500">→</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-mono">
                                            <span className="text-cyan-400">4.</span>
                                            <span className="text-cyan-300">All Connected Nodes</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="text-[10px] font-mono text-cyan-500/60 tracking-wider mb-2">BLOCKCHAIN STATUS</div>
                                    <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
                                        <div className="flex items-center gap-2">
                                            <i className="fa-solid fa-check-circle text-green-400"></i>
                                            <span className="font-mono text-sm text-green-300">Recorded in Block</span>
                                        </div>
                                        <div className="text-xs text-green-400/60 mt-1 font-mono">
                                            Block #{blockchain.length - 1} on chain
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tron Footer */}
                        <div className="px-4 py-2 bg-gradient-to-r from-cyan-900/30 via-blue-900/20 to-purple-900/30 border-t border-cyan-500/40 flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs font-mono text-cyan-400/60">
                                <span>🎖️ RANGERBLOCK P2P</span>
                                <span className="text-cyan-500/40">|</span>
                                <span>MESSAGE JOURNEY COMPLETE</span>
                            </div>
                            <div className="text-xs font-mono text-cyan-400/40">
                                Powered by RangerPlexChain™
                            </div>
                        </div>
                    </div>

                    {/* Global Animation Styles */}
                    <style>{`
                        @keyframes tronMove {
                            0% { left: 18%; top: 45%; opacity: 1; }
                            25% { left: 45%; top: 28%; opacity: 0.8; }
                            50% { left: 48%; top: 62%; opacity: 0.9; }
                            75% { left: 75%; top: 45%; opacity: 0.7; }
                            100% { left: 18%; top: 45%; opacity: 1; }
                        }
                    `}</style>
                </div>
            )}

            {/* ===== SMART CONTRACTS MODAL ===== */}
            {showSmartContracts && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
                    <div className="bg-[#0a0a15] border-2 border-emerald-500/50 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-emerald-500/20">
                        {/* Smart Contracts Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-900/40 to-green-900/20 border-b border-emerald-500/30">
                            <div className="flex items-center gap-3">
                                <i className="fa-solid fa-file-contract text-emerald-400 text-xl"></i>
                                <span className="font-mono font-bold text-emerald-300 text-lg">RangerBlock Smart Contracts</span>
                                <span className="px-2 py-0.5 bg-emerald-900/50 text-emerald-300 text-xs rounded font-mono">
                                    .ranger
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* View Toggle */}
                                <div className="flex bg-black/30 rounded-lg p-0.5 border border-emerald-500/20">
                                    <button
                                        onClick={() => { setContractView('templates'); setSelectedTemplate(null); }}
                                        className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                                            contractView === 'templates'
                                                ? 'bg-emerald-600/50 text-emerald-200'
                                                : 'text-emerald-400/60 hover:text-emerald-300'
                                        }`}
                                    >
                                        Templates
                                    </button>
                                    <button
                                        onClick={() => setContractView('deployed')}
                                        className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                                            contractView === 'deployed'
                                                ? 'bg-emerald-600/50 text-emerald-200'
                                                : 'text-emerald-400/60 hover:text-emerald-300'
                                        }`}
                                    >
                                        Deployed ({deployedContracts.length})
                                    </button>
                                </div>
                                <button
                                    onClick={() => { setShowSmartContracts(false); setSelectedTemplate(null); setContractFormData({}); }}
                                    className="p-2 text-emerald-500/70 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                                >
                                    <i className="fa-solid fa-xmark text-lg"></i>
                                </button>
                            </div>
                        </div>

                        {/* Smart Contracts Content */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Templates/Deployed List */}
                            <div className="w-1/3 border-r border-emerald-500/20 overflow-y-auto p-4 bg-[#080810]">
                                {contractView === 'templates' ? (
                                    <>
                                        <div className="text-xs font-mono text-emerald-500/60 mb-3 tracking-wider">CONTRACT TEMPLATES</div>

                                        {/* Category: Basic */}
                                        <div className="mb-4">
                                            <div className="text-[10px] text-emerald-400/40 font-mono mb-2">BASIC</div>
                                            {CONTRACT_TEMPLATES.filter(t => t.category === 'basic').map(template => (
                                                <button
                                                    key={template.id}
                                                    onClick={() => {
                                                        setSelectedTemplate(template);
                                                        setContractView('editor');
                                                        // Initialize form with defaults
                                                        const defaults: Record<string, any> = {};
                                                        template.fields.forEach(f => {
                                                            if (f.default !== undefined) defaults[f.name] = f.default;
                                                            if (f.name === 'owner' && currentNode) defaults[f.name] = currentNode;
                                                        });
                                                        setContractFormData(defaults);
                                                    }}
                                                    className={`w-full text-left p-3 rounded-lg border mb-2 transition-all ${
                                                        selectedTemplate?.id === template.id
                                                            ? 'bg-emerald-900/40 border-emerald-500'
                                                            : 'bg-[#0d0d1a] border-emerald-500/20 hover:border-emerald-500/50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl">{template.icon}</span>
                                                        <div>
                                                            <div className="font-mono font-bold text-emerald-300 text-sm">{template.name}</div>
                                                            <div className="text-[10px] text-gray-400">{template.description}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Category: Governance */}
                                        <div className="mb-4">
                                            <div className="text-[10px] text-blue-400/40 font-mono mb-2">GOVERNANCE</div>
                                            {CONTRACT_TEMPLATES.filter(t => t.category === 'governance').map(template => (
                                                <button
                                                    key={template.id}
                                                    onClick={() => {
                                                        setSelectedTemplate(template);
                                                        setContractView('editor');
                                                        const defaults: Record<string, any> = {};
                                                        template.fields.forEach(f => {
                                                            if (f.default !== undefined) defaults[f.name] = f.default;
                                                            if (f.name === 'creator' && currentNode) defaults[f.name] = currentNode;
                                                        });
                                                        setContractFormData(defaults);
                                                    }}
                                                    className={`w-full text-left p-3 rounded-lg border mb-2 transition-all ${
                                                        selectedTemplate?.id === template.id
                                                            ? 'bg-blue-900/40 border-blue-500'
                                                            : 'bg-[#0d0d1a] border-blue-500/20 hover:border-blue-500/50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl">{template.icon}</span>
                                                        <div>
                                                            <div className="font-mono font-bold text-blue-300 text-sm">{template.name}</div>
                                                            <div className="text-[10px] text-gray-400">{template.description}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Category: Token */}
                                        <div className="mb-4">
                                            <div className="text-[10px] text-yellow-400/40 font-mono mb-2">TOKEN</div>
                                            {CONTRACT_TEMPLATES.filter(t => t.category === 'token').map(template => (
                                                <button
                                                    key={template.id}
                                                    onClick={() => {
                                                        setSelectedTemplate(template);
                                                        setContractView('editor');
                                                        const defaults: Record<string, any> = {};
                                                        template.fields.forEach(f => {
                                                            if (f.default !== undefined) defaults[f.name] = f.default;
                                                            if (f.name === 'owner' && currentNode) defaults[f.name] = currentNode;
                                                        });
                                                        setContractFormData(defaults);
                                                    }}
                                                    className={`w-full text-left p-3 rounded-lg border mb-2 transition-all ${
                                                        selectedTemplate?.id === template.id
                                                            ? 'bg-yellow-900/40 border-yellow-500'
                                                            : 'bg-[#0d0d1a] border-yellow-500/20 hover:border-yellow-500/50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl">{template.icon}</span>
                                                        <div>
                                                            <div className="font-mono font-bold text-yellow-300 text-sm">{template.name}</div>
                                                            <div className="text-[10px] text-gray-400">{template.description}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Category: Utility */}
                                        <div className="mb-4">
                                            <div className="text-[10px] text-purple-400/40 font-mono mb-2">UTILITY</div>
                                            {CONTRACT_TEMPLATES.filter(t => t.category === 'utility').map(template => (
                                                <button
                                                    key={template.id}
                                                    onClick={() => {
                                                        setSelectedTemplate(template);
                                                        setContractView('editor');
                                                        const defaults: Record<string, any> = {};
                                                        template.fields.forEach(f => {
                                                            if (f.default !== undefined) defaults[f.name] = f.default;
                                                            if (f.name === 'registrar' || f.name === 'admin') {
                                                                if (currentNode) defaults[f.name] = currentNode;
                                                            }
                                                        });
                                                        setContractFormData(defaults);
                                                    }}
                                                    className={`w-full text-left p-3 rounded-lg border mb-2 transition-all ${
                                                        selectedTemplate?.id === template.id
                                                            ? 'bg-purple-900/40 border-purple-500'
                                                            : 'bg-[#0d0d1a] border-purple-500/20 hover:border-purple-500/50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl">{template.icon}</span>
                                                        <div>
                                                            <div className="font-mono font-bold text-purple-300 text-sm">{template.name}</div>
                                                            <div className="text-[10px] text-gray-400">{template.description}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    /* Deployed Contracts */
                                    <>
                                        <div className="text-xs font-mono text-emerald-500/60 mb-3 tracking-wider">DEPLOYED CONTRACTS</div>
                                        {deployedContracts.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <i className="fa-solid fa-file-circle-xmark text-4xl mb-3 text-emerald-500/30"></i>
                                                <div className="font-mono text-sm">No contracts deployed</div>
                                                <div className="text-xs mt-1">Select a template to deploy</div>
                                            </div>
                                        ) : (
                                            deployedContracts.map(contract => (
                                                <div
                                                    key={contract.id}
                                                    className="p-3 rounded-lg border border-emerald-500/30 bg-[#0d0d1a] mb-2"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{CONTRACT_TEMPLATES.find(t => t.id === contract.templateId)?.icon}</span>
                                                            <span className="font-mono text-sm text-emerald-300">{contract.name}</span>
                                                        </div>
                                                        <span className="text-[10px] text-emerald-500 bg-emerald-500/20 px-2 py-0.5 rounded">
                                                            Block #{contract.blockIndex}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 font-mono mb-2">
                                                        Address: {contract.address}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const json = JSON.stringify(contract, null, 2);
                                                                const blob = new Blob([json], { type: 'application/json' });
                                                                const url = URL.createObjectURL(blob);
                                                                const a = document.createElement('a');
                                                                a.href = url;
                                                                a.download = `${contract.name.replace('.ranger', '')}_${contract.address.slice(0, 8)}.json`;
                                                                a.click();
                                                                URL.revokeObjectURL(url);
                                                            }}
                                                            className="flex-1 py-1 text-[10px] bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded font-mono"
                                                        >
                                                            <i className="fa-solid fa-download mr-1"></i> Download
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Contract Editor Panel */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {contractView === 'editor' && selectedTemplate ? (
                                    <div className="space-y-4">
                                        {/* Contract Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">{selectedTemplate.icon}</span>
                                                <div>
                                                    <h3 className="font-mono font-bold text-emerald-300 text-lg">{selectedTemplate.name}</h3>
                                                    <p className="text-xs text-gray-400">{selectedTemplate.description}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowContractCode(!showContractCode)}
                                                className="px-3 py-1 text-xs font-mono bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-600"
                                            >
                                                <i className={`fa-solid ${showContractCode ? 'fa-eye-slash' : 'fa-code'} mr-1`}></i>
                                                {showContractCode ? 'Hide Code' : 'View Code'}
                                            </button>
                                        </div>

                                        {/* Code View */}
                                        {showContractCode && (
                                            <div className="bg-black/50 border border-emerald-500/20 rounded-lg p-4 max-h-64 overflow-auto">
                                                <pre className="text-xs text-emerald-200 font-mono whitespace-pre-wrap">
                                                    {selectedTemplate.code}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Form Fields */}
                                        <div className="bg-[#0d0d1a] border border-emerald-500/20 rounded-lg p-4">
                                            <div className="text-xs font-mono text-emerald-500/60 mb-4 tracking-wider">CONTRACT PARAMETERS</div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedTemplate.fields.map(field => (
                                                    <div key={field.name}>
                                                        <label className="text-xs text-emerald-400/80 font-mono block mb-1">
                                                            {field.label}
                                                            {field.required && <span className="text-red-400 ml-1">*</span>}
                                                        </label>
                                                        {field.type === 'boolean' ? (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={contractFormData[field.name] ?? field.default ?? false}
                                                                    onChange={(e) => setContractFormData(prev => ({ ...prev, [field.name]: e.target.checked }))}
                                                                    className="w-4 h-4 accent-emerald-500"
                                                                />
                                                                <span className="text-sm text-gray-300">{contractFormData[field.name] ? 'Yes' : 'No'}</span>
                                                            </div>
                                                        ) : field.type === 'number' ? (
                                                            <input
                                                                type="number"
                                                                value={contractFormData[field.name] ?? field.default ?? ''}
                                                                onChange={(e) => setContractFormData(prev => ({ ...prev, [field.name]: parseInt(e.target.value) || 0 }))}
                                                                placeholder={field.placeholder}
                                                                className="w-full bg-black/50 border border-emerald-500/30 rounded px-3 py-2 text-emerald-200 font-mono text-sm focus:border-emerald-400 focus:outline-none"
                                                            />
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={contractFormData[field.name] ?? field.default ?? ''}
                                                                onChange={(e) => setContractFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                                placeholder={field.placeholder}
                                                                className="w-full bg-black/50 border border-emerald-500/30 rounded px-3 py-2 text-emerald-200 font-mono text-sm focus:border-emerald-400 focus:outline-none"
                                                            />
                                                        )}
                                                        {field.type === 'address' && (
                                                            <p className="text-[10px] text-gray-500 mt-1">Node ID (e.g., M3Pro, M4Max)</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => {
                                                    // Save contract as JSON
                                                    const contractData = {
                                                        template: selectedTemplate.id,
                                                        name: selectedTemplate.name,
                                                        parameters: contractFormData,
                                                        code: selectedTemplate.code,
                                                        createdAt: new Date().toISOString(),
                                                        deployer: currentNode
                                                    };
                                                    const json = JSON.stringify(contractData, null, 2);
                                                    const blob = new Blob([json], { type: 'application/json' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `${selectedTemplate.name.replace('.ranger', '')}_contract.json`;
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                }}
                                                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm font-mono transition-colors flex items-center justify-center gap-2"
                                            >
                                                <i className="fa-solid fa-download"></i>
                                                Save as JSON
                                            </button>
                                            <button
                                                onClick={() => {
                                                    // Validate required fields
                                                    const missingFields = selectedTemplate.fields
                                                        .filter(f => f.required && !contractFormData[f.name])
                                                        .map(f => f.label);

                                                    if (missingFields.length > 0) {
                                                        alert(`Missing required fields:\n${missingFields.join('\n')}`);
                                                        return;
                                                    }

                                                    // Generate contract address
                                                    const contractAddress = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;

                                                    // Create deployed contract
                                                    const deployed: DeployedContract = {
                                                        id: `contract_${Date.now()}`,
                                                        templateId: selectedTemplate.id,
                                                        name: selectedTemplate.name,
                                                        deployer: currentNode || 'Unknown',
                                                        deployedAt: Date.now(),
                                                        blockIndex: blockchain.length,
                                                        address: contractAddress,
                                                        data: contractFormData,
                                                        state: {}
                                                    };

                                                    // Add to deployed contracts
                                                    setDeployedContracts(prev => [...prev, deployed]);

                                                    // Add block to blockchain
                                                    addBlock({
                                                        type: 'system' as any,
                                                        content: `Smart Contract Deployed: ${selectedTemplate.name}`,
                                                        from: currentNode || 'System',
                                                        fromName: currentNodeInfo?.name || 'System'
                                                    });

                                                    // Add system message
                                                    addSystemMessage(`📜 Contract deployed: ${selectedTemplate.name} at ${contractAddress}`);

                                                    // Download the deployed block
                                                    const blockData = {
                                                        contract: deployed,
                                                        block: {
                                                            index: blockchain.length,
                                                            timestamp: Date.now(),
                                                            type: 'contract_deployment',
                                                            data: deployed
                                                        }
                                                    };
                                                    const json = JSON.stringify(blockData, null, 2);
                                                    const blob = new Blob([json], { type: 'application/json' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `${selectedTemplate.name.replace('.ranger', '')}_block_${blockchain.length}.json`;
                                                    a.click();
                                                    URL.revokeObjectURL(url);

                                                    // Show success
                                                    alert(`✅ Contract Deployed!\n\nName: ${selectedTemplate.name}\nAddress: ${contractAddress}\nBlock: #${blockchain.length}\n\nBlock JSON has been downloaded.`);

                                                    // Switch to deployed view
                                                    setContractView('deployed');
                                                }}
                                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-mono font-bold transition-colors flex items-center justify-center gap-2"
                                            >
                                                <i className="fa-solid fa-rocket"></i>
                                                Deploy to Blockchain
                                            </button>
                                        </div>
                                    </div>
                                ) : contractView === 'templates' ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                        <i className="fa-solid fa-file-contract text-6xl mb-4 text-emerald-500/30"></i>
                                        <div className="font-mono text-lg text-emerald-400/60">Select a Contract Template</div>
                                        <div className="text-sm mt-2 text-gray-500 max-w-md text-center">
                                            Choose from 8 pre-built smart contract templates including Storage, Owner, Ballot, MultiSig, Token, Escrow, Registry, and TimeLock.
                                        </div>
                                        <div className="mt-6 grid grid-cols-4 gap-3">
                                            {CONTRACT_TEMPLATES.map(t => (
                                                <div key={t.id} className="text-center">
                                                    <span className="text-2xl">{t.icon}</span>
                                                    <div className="text-[10px] text-gray-500 mt-1">{t.name.replace('.ranger', '')}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                        <i className="fa-solid fa-cubes text-6xl mb-4 text-emerald-500/30"></i>
                                        <div className="font-mono text-lg text-emerald-400/60">Deployed Contracts</div>
                                        <div className="text-sm mt-2 text-gray-500">
                                            {deployedContracts.length === 0
                                                ? 'No contracts deployed yet. Select a template to get started.'
                                                : `${deployedContracts.length} contract(s) deployed on the blockchain.`}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Smart Contracts Footer */}
                        <div className="px-4 py-2 bg-emerald-900/20 border-t border-emerald-500/30 text-xs font-mono text-emerald-400/60 flex items-center justify-between">
                            <span>🎖️ RangerBlock Smart Contracts - .ranger Extension</span>
                            <span>Templates: {CONTRACT_TEMPLATES.length} | Deployed: {deployedContracts.length}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== JOIN REQUESTS MODAL (ADMIN) ===== */}
            {showJoinRequests && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-900/95 border border-orange-500/50 rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 bg-orange-900/30 border-b border-orange-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <i className="fa-solid fa-user-plus text-orange-400"></i>
                                <span className="font-mono font-bold text-orange-300">Pending Join Requests</span>
                                <span className="text-xs bg-orange-500 text-black px-1.5 rounded-full font-bold">
                                    {pendingJoinRequests.length}
                                </span>
                            </div>
                            <button
                                onClick={() => setShowJoinRequests(false)}
                                className="text-orange-400/60 hover:text-orange-400"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        {/* Requests List */}
                        <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
                            {pendingJoinRequests.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <i className="fa-solid fa-check-circle text-4xl mb-3 text-green-500/30"></i>
                                    <div className="font-mono">No pending requests</div>
                                </div>
                            ) : (
                                pendingJoinRequests.map((request, index) => (
                                    <div
                                        key={request.key || index}
                                        className="bg-gray-800/50 border border-orange-500/30 rounded-lg p-3"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{request.emoji || '💻'}</span>
                                                <div>
                                                    <div className="font-mono text-sm text-orange-300">{request.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {request.type} | {request.platform || 'Unknown'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 mb-2">
                                            ID: {request.node_id || request.key}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    wsRef.current?.send(JSON.stringify({
                                                        type: 'machine_approve',
                                                        machineKey: request.key
                                                    }));
                                                }}
                                                className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 text-xs py-1.5 rounded font-mono transition-colors"
                                            >
                                                <i className="fa-solid fa-check mr-1"></i> Approve
                                            </button>
                                            <button
                                                onClick={() => {
                                                    wsRef.current?.send(JSON.stringify({
                                                        type: 'machine_reject',
                                                        machineKey: request.key,
                                                        reason: 'Rejected by admin'
                                                    }));
                                                    setPendingJoinRequests(prev => prev.filter(p => p.key !== request.key));
                                                }}
                                                className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 text-xs py-1.5 rounded font-mono transition-colors"
                                            >
                                                <i className="fa-solid fa-xmark mr-1"></i> Reject
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 bg-orange-900/20 border-t border-orange-500/30 text-xs font-mono text-orange-400/60">
                            👑 Admin Panel - Approve machines to join the network
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlockchainChat;

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
    // === CLOUD SERVERS (Relay-Only) ===
    'KaliCloud': { name: 'Kali Cloud VM', ip: '34.26.30.249', type: 'relay', emoji: '☁️' },
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
                                <div key={msg.id} className="py-0.5 hover:bg-white/5 px-2 -mx-2">
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

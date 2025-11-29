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

const NODE_NETWORK: Record<string, Omit<NodeInfo, 'online' | 'permission' | 'key'>> = {
    'M3': { name: 'M3 Pro Genesis', ip: '192.168.1.7', type: 'genesis', emoji: '🏛️' },
    'M1': { name: 'M1 Air Peer', ip: '192.168.1.3', type: 'peer', emoji: '🍎' },
    'M4': { name: 'M4 Max Compute', ip: '192.168.1.4', type: 'compute', emoji: '⚡' },
    'Kali': { name: 'Kali VM Security', ip: '192.168.66.2', type: 'security', emoji: '🔒' },
    'Windows': { name: 'Windows VM', ip: '192.168.66.3', type: 'peer', emoji: '🪟' }
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

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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

        // Simulate connection
        addSystemMessage(`* Connecting as ${NODE_NETWORK[nodeKey].emoji} ${NODE_NETWORK[nodeKey].name}...`);

        try {
            // Check which nodes are online
            const response = await fetch('http://127.0.0.1:3000/api/rangerblock/status');
            const data = await response.json();

            // Build node list with online status
            const nodeList: NodeInfo[] = Object.entries(NODE_NETWORK).map(([key, info]) => ({
                key,
                ...info,
                online: key === nodeKey || (data.onlineNodes?.includes(key) ?? false),
                permission: key === nodeKey ? 'owner' : (data.permissions?.[key] ?? 'user')
            }));

            setNodes(nodeList);
            setIsConnected(true);
            setShowNodeSelector(false);

            addSystemMessage(`* Now talking in ${currentChannel}`);
            addSystemMessage(`* Topic is: ${channels.find(c => c.name === currentChannel)?.topic}`);
            addSystemMessage(`* ${nodeKey} has joined ${currentChannel}`, 'join');

        } catch (err) {
            // Offline mode - show all nodes as potentially available
            const nodeList: NodeInfo[] = Object.entries(NODE_NETWORK).map(([key, info]) => ({
                key,
                ...info,
                online: key === nodeKey,
                permission: key === nodeKey ? 'owner' : 'user'
            }));

            setNodes(nodeList);
            setIsConnected(true);
            setShowNodeSelector(false);

            addSystemMessage(`* Connected in offline mode (blockchain server not running)`);
            addSystemMessage(`* Now talking in ${currentChannel}`);
        }

        setIsConnecting(false);
    }, [addSystemMessage, channels, currentChannel]);

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

        // Send to backend
        try {
            await fetch('http://127.0.0.1:3000/api/rangerblock/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: currentNode,
                    fromName: NODE_NETWORK[currentNode]?.name,
                    content: inputMessage,
                    channel: currentChannel
                })
            });
        } catch {
            // Offline mode - message already shown locally
        }
    }, [inputMessage, currentNode, currentChannel, executeCommand]);

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

    // Poll for messages when connected
    useEffect(() => {
        if (!isConnected || !currentNode) return;

        const pollMessages = async () => {
            try {
                const response = await fetch('http://127.0.0.1:3000/api/rangerblock/chat');
                const data = await response.json();
                if (data.success && data.messages) {
                    // Merge new messages
                    setMessages(prev => {
                        const existingIds = new Set(prev.map(m => m.id));
                        const newMsgs = data.messages.filter((m: ChatMessage) => !existingIds.has(m.id));
                        return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
                    });
                }
            } catch {
                // Offline mode
            }
        };

        const interval = setInterval(pollMessages, 2000);
        return () => clearInterval(interval);
    }, [isConnected, currentNode]);

    if (!isOpen) return null;

    // ==================== NODE SELECTOR ====================

    if (showNodeSelector) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Type /help for commands</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlockchainChat;

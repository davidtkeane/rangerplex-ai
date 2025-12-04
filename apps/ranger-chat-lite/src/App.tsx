import { useState, useEffect, useRef } from 'react'
import './App.css'

// Electron API type declaration
declare global {
    interface Window {
        electronAPI?: {
            identity: {
                has: () => Promise<boolean>
                load: () => Promise<any>
                getOrCreate: (username?: string) => Promise<any>
                generateUsername: () => Promise<string>
                updateUsername: (newUsername: string) => Promise<any>
                recordMessage: () => Promise<void>
                getPaths: () => Promise<{ storageDir: string; personalDir: string; identityFile: string }>
                export: () => Promise<string | null>
                reset: () => Promise<void>
            }
            ledger: {
                init: () => Promise<boolean>
                getStatus: () => Promise<LedgerStatus>
                addMessage: (msg: { sender: string; senderName: string; content: string; channel: string }) => Promise<any>
                getBlocks: (page?: number, limit?: number) => Promise<LedgerBlock[]>
                getBlock: (index: number) => Promise<LedgerBlock | null>
                mineBlock: (validatorId?: string) => Promise<LedgerBlock | null>
                exportChain: () => Promise<any>
                getBalance: (userId: string) => Promise<{ balance: number; transactions: string[] }>
            }
            admin: {
                getStatus: () => Promise<AdminStatus>
                checkUserId: (userId: string) => Promise<AdminStatus>
                getRegistryPath: () => Promise<string>
            }
        }
    }
}

// Admin status type
interface AdminStatus {
    isAdmin: boolean
    isSupreme: boolean
    isModerator: boolean
    role: string
    adminUsername?: string
}

// Ledger types
interface LedgerStatus {
    version: string
    chainHeight: number
    lastBlockHash: string
    pendingTransactions: number
    totalTransactions: number
    totalMessages: number
    totalUsers: number
    lastBlockTime: number | null
}

interface LedgerBlock {
    index: number
    hash: string
    previousHash: string
    timestamp: number
    merkleRoot: string
    nonce: number
    transactionCount: number
    transactions: LedgerTransaction[]
    validator: { nodeId: string; timestamp: number } | null
}

interface LedgerTransaction {
    txId: string
    type: string
    sender: string
    timestamp: number
    data: any
    hash: string
    pending?: boolean
    blockIndex?: number
    blockHash?: string
}

// Types
interface Message {
    type: 'chat' | 'system'
    sender: string
    senderId?: string  // For tracking real identity
    content: string
    timestamp: string
}

interface UserIdentity {
    userId: string
    nodeId: string
    username: string
    created: string
    lastSeen: string
    hardwareFingerprint: string
    platform: {
        system: string
        machine: string
        hostname: string
    }
    version: string
    appType: string
}

// Blockchain transaction type
interface BlockchainTx {
    id: string
    type: 'send' | 'receive' | 'system' | 'peer'
    direction: 'in' | 'out'
    from: string
    to: string
    payload: string
    size: number
    timestamp: number
    status: 'pending' | 'confirmed' | 'broadcast'
}

// Voice call states
type CallState = 'idle' | 'calling' | 'ringing' | 'in_call'

// Peer info
interface PeerInfo {
    address: string
    userId?: string
    nickname: string
    mode?: string
    capabilities?: string[]
}

// Smart Contract type
interface SmartContract {
    id: string
    name: string
    description: string
    chain: 'ethereum' | 'solana' | 'both'
    category: 'registration' | 'bridge' | 'transfer' | 'token'
    icon: string
    status: 'available' | 'deployed' | 'selected'
    features: string[]
    contractAddress?: string
}

// Available Smart Contracts
const SMART_CONTRACTS: SmartContract[] = [
    {
        id: 'ranger-registration',
        name: 'RangerRegistration',
        description: 'User registration with consent tracking and hardware ID verification',
        chain: 'both',
        category: 'registration',
        icon: '📋',
        status: 'available',
        features: ['User registration', 'Consent bundled', 'Hardware ID tracking', 'Admin approve/deny', 'Ban evasion prevention']
    },
    {
        id: 'ranger-bridge',
        name: 'RangerBridge',
        description: 'Cross-chain conversion between RangerCoin and major cryptocurrencies',
        chain: 'both',
        category: 'bridge',
        icon: '🌉',
        status: 'available',
        features: ['BTC conversion (WBTC)', 'ETH conversion', 'SOL conversion', 'USDC stablecoin', '20 EUR/day limit', '1% fee']
    },
    {
        id: 'ranger-file-transfer',
        name: 'RangerFileTransfer',
        description: 'Formal file transfer agreements with blockchain verification',
        chain: 'both',
        category: 'transfer',
        icon: '📁',
        status: 'available',
        features: ['Legal transfers', 'Chain of custody', '.rangerblock format', 'Dual signatures', '24h expiry', 'Hash verification']
    },
    {
        id: 'ranger-token',
        name: 'RangerToken',
        description: 'SPL Token with daily transfer limits for Solana',
        chain: 'solana',
        category: 'token',
        icon: '🪙',
        status: 'available',
        features: ['SPL Token standard', '20 EUR/day limit', 'Admin freeze', 'Mint/burn controls', 'Treasury management']
    },
    // === COMING SOON: SECURE COMMUNICATION CONTRACTS ===
    {
        id: 'ranger-text-chat',
        name: 'RangerTextChat',
        description: 'COMING SOON: Secure text messaging with 99.99% identity verification',
        chain: 'both',
        category: 'communication' as any,
        icon: '💬',
        status: 'available',
        features: ['Identity verification', 'E2E encryption', 'Session keys', 'Challenge-response auth', 'Block/report system', 'WHISPER PROTOCOL']
    },
    {
        id: 'ranger-voice-chat',
        name: 'RangerVoiceChat',
        description: 'COMING SOON: Secure voice calls with blockchain identity verification',
        chain: 'both',
        category: 'communication' as any,
        icon: '🎙️',
        status: 'available',
        features: ['Pre-call ID verification', 'DTLS/SRTP encryption', 'Call duration logging', 'Missed call tracking', 'DND status', 'ECHO PROTOCOL']
    },
    {
        id: 'ranger-video-chat',
        name: 'RangerVideoChat',
        description: 'COMING SOON: Secure video calls with verified identity before answering',
        chain: 'both',
        category: 'communication' as any,
        icon: '📹',
        status: 'available',
        features: ['Face-to-identity confirmation', 'WebRTC encryption', 'Screen share flag', 'Recording consent', 'Quality negotiation', 'VISION PROTOCOL']
    }
]

// Theme definitions
type ThemeName = 'classic' | 'matrix' | 'tron' | 'retro'

const THEMES: Record<ThemeName, { name: string; icon: string }> = {
    classic: { name: 'Classic', icon: '💬' },
    matrix: { name: 'Matrix', icon: '🟢' },
    tron: { name: 'Tron', icon: '🔵' },
    retro: { name: 'Retro', icon: '💾' }
}

// Emoji categories
const EMOJI_DATA = {
    frequent: ['😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤔', '👍', '👎', '👏', '🙌', '🔥', '❤️', '💯', '🎉', '✨', '🚀', '💪', '🙏'],
    smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮', '🤯', '😱', '😨', '😰', '😥'],
    gestures: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪', '🦾'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦅', '🦆', '🦉', '🐺', '🦈'],
    food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍕', '🍔', '🍟', '🌭', '🍿', '🧁', '🍩', '🍪', '☕', '🍺', '🍷', '🥤', '🧃'],
    activities: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎮', '🎲', '🎯', '🎪', '🎨', '🎬', '🎤', '🎧', '🎸', '🎹', '🎺', '🥁', '🏆', '🥇'],
    travel: ['🚗', '🚕', '🚌', '🚎', '🏎️', '🚓', '🚑', '✈️', '🚀', '🛸', '🚁', '⛵', '🚢', '🏠', '🏰', '🗼', '🗽', '⛰️', '🏝️', '🌋'],
    symbols: ['💯', '🔥', '⭐', '✨', '💫', '🌟', '⚡', '💥', '💢', '💤', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🎵', '🎶', '➕']
}

// App views
type ViewType = 'login' | 'chat' | 'settings' | 'ledger'

// Current app version
const APP_VERSION = '1.7.1'
const GITHUB_REPO = 'davidtkeane/rangerplex-ai'

function App() {
    // View state
    const [view, setView] = useState<ViewType>('login')
    const [connected, setConnected] = useState(false)
    const [loading, setLoading] = useState(true)

    // Identity state
    const [identity, setIdentity] = useState<UserIdentity | null>(null)
    const [username, setUsername] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)

    // Connection state
    const [serverUrl, setServerUrl] = useState('ws://44.222.101.125:5555')
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [peerCount, setPeerCount] = useState(0)

    // UI state
    const [theme, setTheme] = useState<ThemeName>('classic')
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [emojiCategory, setEmojiCategory] = useState<keyof typeof EMOJI_DATA>('frequent')
    const [emojiSearch, setEmojiSearch] = useState('')
    const [showSearch, setShowSearch] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Settings state
    const [storagePaths, setStoragePaths] = useState<any>(null)
    const [identityExport, setIdentityExport] = useState<string | null>(null)

    // Blockchain transaction log
    const [transactions, setTransactions] = useState<BlockchainTx[]>([])
    const [showTransactions, setShowTransactions] = useState(false)
    const [txStats, setTxStats] = useState({ sent: 0, received: 0, total: 0, bytes: 0 })

    // Smart contracts state
    const [contracts, setContracts] = useState<SmartContract[]>(SMART_CONTRACTS)
    const [selectedContract, setSelectedContract] = useState<SmartContract | null>(null)
    const [showContractDetails, setShowContractDetails] = useState(false)
    const [preferredChain, setPreferredChain] = useState<'ethereum' | 'solana'>('solana')

    // Update notification state
    const [updateAvailable, setUpdateAvailable] = useState(false)
    const [latestVersion, setLatestVersion] = useState<string | null>(null)
    const [showUpdateBanner, setShowUpdateBanner] = useState(true)

    // Ledger state
    const [ledgerStatus, setLedgerStatus] = useState<LedgerStatus | null>(null)
    const [ledgerBlocks, setLedgerBlocks] = useState<LedgerBlock[]>([])
    const [selectedBlock, setSelectedBlock] = useState<LedgerBlock | null>(null)
    const [ledgerLoading, setLedgerLoading] = useState(false)

    // Admin state
    const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null)

    // Voice call state
    const [callState, setCallState] = useState<CallState>('idle')
    const [callPartner, setCallPartner] = useState<string | null>(null)
    const [incomingCaller, setIncomingCaller] = useState<string | null>(null)
    const [isTalking, setIsTalking] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [peers, setPeers] = useState<PeerInfo[]>([])
    const [showPeerList, setShowPeerList] = useState(false)
    const [audioLevel, setAudioLevel] = useState(0)

    const wsRef = useRef<WebSocket | null>(null)
    const mediaStreamRef = useRef<MediaStream | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const processorRef = useRef<ScriptProcessorNode | null>(null)
    const audioQueueRef = useRef<Float32Array[]>([])
    const ringIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatHistoryRef = useRef<HTMLDivElement>(null)
    const callStateRef = useRef<CallState>('idle')
    const isTalkingRef = useRef(false)
    const callPartnerRef = useRef<string | null>(null)

    // Keep refs in sync with state (fixes closure bugs in audio processor and WebSocket handlers)
    useEffect(() => {
        callStateRef.current = callState
    }, [callState])

    useEffect(() => {
        isTalkingRef.current = isTalking
    }, [isTalking])

    useEffect(() => {
        callPartnerRef.current = callPartner
    }, [callPartner])

    // Check for existing identity on load
    useEffect(() => {
        const checkIdentity = async () => {
            try {
                if (window.electronAPI) {
                    const hasIdentity = await window.electronAPI.identity.has()
                    if (hasIdentity) {
                        const storage = await window.electronAPI.identity.load()
                        if (storage?.identity) {
                            setIdentity(storage.identity)
                            setUsername(storage.identity.username)

                            // Check admin status
                            try {
                                const status = await window.electronAPI.admin.getStatus()
                                setAdminStatus(status)
                                console.log('[Admin] Status:', JSON.stringify(status, null, 2))
                                console.log('[Admin] isSupreme:', status.isSupreme, 'isAdmin:', status.isAdmin, 'role:', status.role)
                            } catch (e) {
                                console.log('[Admin] Could not check admin status:', e)
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking identity:', error)
            }
            setLoading(false)
        }
        checkIdentity()
    }, [])

    // Check for updates on load
    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                // Check the package.json in the repo for the latest version
                const response = await fetch(
                    `https://raw.githubusercontent.com/${GITHUB_REPO}/main/apps/ranger-chat-lite/package.json`
                )
                if (response.ok) {
                    const packageJson = await response.json()
                    const remoteVersion = packageJson.version

                    // Compare versions (simple string comparison works for semver)
                    if (remoteVersion && remoteVersion !== APP_VERSION) {
                        // Check if remote version is newer
                        const current = APP_VERSION.split('.').map(Number)
                        const remote = remoteVersion.split('.').map(Number)

                        let isNewer = false
                        for (let i = 0; i < 3; i++) {
                            if (remote[i] > current[i]) {
                                isNewer = true
                                break
                            } else if (remote[i] < current[i]) {
                                break
                            }
                        }

                        if (isNewer) {
                            setLatestVersion(remoteVersion)
                            setUpdateAvailable(true)
                            console.log(`Update available: v${remoteVersion} (current: v${APP_VERSION})`)
                        }
                    }
                }
            } catch (error) {
                console.log('Could not check for updates:', error)
            }
        }

        // Check immediately and then every 30 minutes
        checkForUpdates()
        const interval = setInterval(checkForUpdates, 30 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Load theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('rangerChatTheme') as ThemeName
        if (savedTheme && THEMES[savedTheme]) {
            setTheme(savedTheme)
        }
    }, [])

    // Save theme to localStorage
    useEffect(() => {
        localStorage.setItem('rangerChatTheme', theme)
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    // Load ledger status when entering ledger view
    const loadLedgerData = async () => {
        if (!window.electronAPI?.ledger) return
        setLedgerLoading(true)
        try {
            const status = await window.electronAPI.ledger.getStatus()
            setLedgerStatus(status)
            const blocks = await window.electronAPI.ledger.getBlocks(0, 20)
            setLedgerBlocks(blocks.reverse()) // Newest first
        } catch (error) {
            console.error('Error loading ledger:', error)
        }
        setLedgerLoading(false)
    }

    // Refresh ledger data
    const refreshLedger = async () => {
        await loadLedgerData()
    }

    // Manual mine block
    const manualMineBlock = async () => {
        if (!window.electronAPI?.ledger) return
        setLedgerLoading(true)
        try {
            const block = await window.electronAPI.ledger.mineBlock(identity?.nodeId)
            if (block) {
                await loadLedgerData()
            }
        } catch (error) {
            console.error('Error mining block:', error)
        }
        setLedgerLoading(false)
    }

    // Export chain
    const exportChain = async () => {
        if (!window.electronAPI?.ledger) return
        try {
            const chainData = await window.electronAPI.ledger.exportChain()
            const blob = new Blob([JSON.stringify(chainData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `rangerblock-chain-${Date.now()}.json`
            a.click()
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error exporting chain:', error)
        }
    }

    // Format timestamp
    const formatTime = (ts: number) => {
        const date = new Date(ts)
        return date.toLocaleString()
    }

    // Format hash for display
    const formatHash = (hash: string) => {
        if (!hash) return 'N/A'
        return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`
    }

    // Generate random username
    const generateRandomUsername = async () => {
        setIsGenerating(true)
        try {
            if (window.electronAPI) {
                const newName = await window.electronAPI.identity.generateUsername()
                setUsername(newName)
            } else {
                // Fallback for browser dev
                const adjectives = ['Cosmic', 'Cyber', 'Digital', 'Electric', 'Quantum', 'Turbo', 'Mega', 'Ultra']
                const nouns = ['Ranger', 'Phoenix', 'Dragon', 'Wolf', 'Falcon', 'Tiger', 'Hawk', 'Eagle']
                const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
                const noun = nouns[Math.floor(Math.random() * nouns.length)]
                const num = Math.floor(Math.random() * 100)
                setUsername(`${adj}${noun}${num}`)
            }
        } catch (error) {
            console.error('Error generating username:', error)
        }
        // Animation delay
        setTimeout(() => setIsGenerating(false), 300)
    }

    // Log blockchain transaction
    const logTransaction = (
        type: BlockchainTx['type'],
        direction: BlockchainTx['direction'],
        from: string,
        to: string,
        payload: any,
        status: BlockchainTx['status'] = 'confirmed'
    ) => {
        const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload)
        const tx: BlockchainTx = {
            id: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 6)}`,
            type,
            direction,
            from,
            to,
            payload: payloadStr.length > 100 ? payloadStr.substring(0, 100) + '...' : payloadStr,
            size: new Blob([payloadStr]).size,
            timestamp: Date.now(),
            status
        }
        setTransactions(prev => [tx, ...prev].slice(0, 100)) // Keep last 100 transactions
        setTxStats(prev => ({
            sent: direction === 'out' ? prev.sent + 1 : prev.sent,
            received: direction === 'in' ? prev.received + 1 : prev.received,
            total: prev.total + 1,
            bytes: prev.bytes + tx.size
        }))
    }

    // Connect to server
    const connect = async () => {
        if (!username.trim()) {
            alert('Please choose a username first!')
            return
        }

        // Create or update identity
        try {
            if (window.electronAPI) {
                const newIdentity = await window.electronAPI.identity.getOrCreate(username)
                setIdentity(newIdentity)
            }
        } catch (error) {
            console.error('Error creating identity:', error)
        }

        // Connect to WebSocket
        if (wsRef.current) wsRef.current.close()
        const nodeId = identity?.nodeId || `lite-${Math.random().toString(36).substring(2, 10)}`
        const ws = new WebSocket(serverUrl)

        ws.onopen = () => {
            logTransaction('system', 'in', 'relay-server', nodeId, 'WebSocket connected', 'confirmed')
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: 'Connected to server, waiting for welcome...',
                timestamp: new Date().toLocaleTimeString()
            }])
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                // Log incoming transaction
                logTransaction(
                    data.type === 'broadcast' || data.type === 'nodeMessage' ? 'receive' : 'system',
                    'in',
                    data.from || 'relay-server',
                    nodeId,
                    data,
                    'confirmed'
                )

                switch (data.type) {
                    case 'welcome':
                        const registerMsg = {
                            type: 'register',
                            address: nodeId,
                            userId: identity?.userId,
                            nickname: username,
                            channel: '#rangers',
                            ip: '0.0.0.0',
                            port: 0,
                            mode: 'lite-client',
                            capabilities: ['chat', 'voice', 'call']
                        }
                        ws.send(JSON.stringify(registerMsg))
                        logTransaction('system', 'out', nodeId, 'relay-server', registerMsg, 'broadcast')
                        break
                    case 'registered':
                        setConnected(true)
                        setView('chat')
                        setMessages(prev => [...prev, {
                            type: 'system',
                            sender: 'System',
                            content: `Registered as ${username}`,
                            timestamp: new Date().toLocaleTimeString()
                        }])
                        const getPeersMsg = { type: 'getPeers' }
                        ws.send(JSON.stringify(getPeersMsg))
                        logTransaction('peer', 'out', nodeId, 'relay-server', getPeersMsg, 'broadcast')
                        break
                    case 'peerList':
                        const peerList = data.peers || []
                        setPeers(peerList.filter((p: PeerInfo) => p.nickname !== username))
                        setPeerCount(peerList.length)
                        setMessages(prev => [...prev, {
                            type: 'system',
                            sender: 'System',
                            content: `${peerList.length} peer(s) online`,
                            timestamp: new Date().toLocaleTimeString()
                        }])
                        break
                    case 'peerListUpdate':
                        const updatedPeers = data.peers || []
                        setPeers(updatedPeers.filter((p: PeerInfo) => p.nickname !== username))
                        setPeerCount(updatedPeers.length)
                        break
                    case 'broadcast':
                    case 'nodeMessage':
                        if (data.payload) handlePayload(data.payload)
                        break
                    case 'broadcastSent':
                        break
                    default:
                        console.log('Unknown message type:', data.type)
                }
            } catch (e) {
                console.error('Failed to parse message', e)
            }
        }

        ws.onclose = () => {
            logTransaction('system', 'in', 'relay-server', nodeId, 'WebSocket disconnected', 'confirmed')
            setConnected(false)
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: 'Disconnected from server',
                timestamp: new Date().toLocaleTimeString()
            }])
        }

        ws.onerror = (error) => {
            logTransaction('system', 'in', 'relay-server', nodeId, 'Connection error', 'confirmed')
            console.error('WebSocket error:', error)
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: 'Connection error',
                timestamp: new Date().toLocaleTimeString()
            }])
        }

        wsRef.current = ws
    }

    const handlePayload = (payload: any) => {
        // Handle voice-related payloads
        if (['callRequest', 'callAccepted', 'callRejected', 'callBusy', 'callEnded', 'voiceData', 'voiceStatus'].includes(payload.type)) {
            handleVoicePayload(payload)
            return
        }

        switch (payload.type) {
            case 'chatMessage':
            case 'chat':
                setMessages(prev => [...prev, {
                    type: 'chat',
                    sender: payload.nickname || payload.from || 'Unknown',
                    senderId: payload.userId,  // Track userId for moderation
                    content: payload.message || payload.content || '',
                    timestamp: new Date().toLocaleTimeString()
                }])
                break
            default:
                console.log('Unknown payload type:', payload.type)
        }
    }

    const sendMessage = async () => {
        if (!wsRef.current || !connected || !input.trim()) return

        // Handle /call command
        const callMatch = input.match(/^\/call\s+(.+)$/i)
        if (callMatch) {
            const targetUser = callMatch[1].trim()
            if (targetUser) {
                makeCall(targetUser)
                setInput('')
                return
            }
        }

        // Handle /hangup command
        if (input.toLowerCase() === '/hangup' || input.toLowerCase() === '/end') {
            if (callState !== 'idle') {
                hangUp()
            } else {
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: 'Not in a call',
                    timestamp: new Date().toLocaleTimeString()
                }])
            }
            setInput('')
            return
        }

        // Handle /peers command
        if (input.toLowerCase() === '/peers' || input.toLowerCase() === '/online') {
            if (peers.length === 0) {
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: 'No other users online',
                    timestamp: new Date().toLocaleTimeString()
                }])
            } else {
                const peerList = peers.map(p => `  • ${p.nickname}${p.capabilities?.includes('voice') ? ' 🎙️' : ''}`).join('\n')
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: `Online peers:\n${peerList}`,
                    timestamp: new Date().toLocaleTimeString()
                }])
            }
            setInput('')
            return
        }

        const msg = {
            type: 'broadcast',
            payload: {
                type: 'chatMessage',
                from: identity?.nodeId,
                userId: identity?.userId,  // Include for moderation
                nickname: username,
                message: input,
                timestamp: Date.now()
            }
        }

        wsRef.current.send(JSON.stringify(msg))
        // Log outgoing chat transaction
        logTransaction('send', 'out', identity?.nodeId || 'local', 'broadcast', msg, 'broadcast')

        setMessages(prev => [...prev, {
            type: 'chat',
            sender: username,
            senderId: identity?.userId,
            content: input,
            timestamp: new Date().toLocaleTimeString()
        }])
        setInput('')

        // Record message for stats
        try {
            if (window.electronAPI) {
                await window.electronAPI.identity.recordMessage()
            }
        } catch (error) {
            console.error('Error recording message:', error)
        }
    }

    const insertEmoji = (emoji: string) => {
        setInput(prev => prev + emoji)
    }

    const getFilteredEmojis = () => {
        const categoryEmojis = EMOJI_DATA[emojiCategory]
        if (!emojiSearch) return categoryEmojis
        const allEmojis = Object.values(EMOJI_DATA).flat()
        return allEmojis.filter(emoji => emoji.includes(emojiSearch))
    }

    const getFilteredMessages = () => {
        if (!searchQuery) return messages
        return messages.filter(msg =>
            msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.sender.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }

    const cycleTheme = () => {
        const themeOrder: ThemeName[] = ['classic', 'matrix', 'tron', 'retro']
        const currentIndex = themeOrder.indexOf(theme)
        const nextIndex = (currentIndex + 1) % themeOrder.length
        setTheme(themeOrder[nextIndex])
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VOICE CALL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    // Initialize audio context for playback
    const initAudioContext = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        return audioContextRef.current
    }

    // Start audio capture
    const startAudioCapture = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000
                }
            })
            mediaStreamRef.current = stream

            const audioContext = initAudioContext()
            const source = audioContext.createMediaStreamSource(stream)
            const analyser = audioContext.createAnalyser()
            analyser.fftSize = 256
            analyserRef.current = analyser

            // Create script processor for capturing audio
            const processor = audioContext.createScriptProcessor(4096, 1, 1)
            processorRef.current = processor

            source.connect(analyser)
            analyser.connect(processor)
            processor.connect(audioContext.destination)

            processor.onaudioprocess = (e) => {
                // Use refs for current values (fixes closure bug)
                if (!isTalkingRef.current || !wsRef.current || callStateRef.current !== 'in_call') return

                const inputData = e.inputBuffer.getChannelData(0)
                const audioData = new Float32Array(inputData)

                // Calculate audio level
                let sum = 0
                for (let i = 0; i < audioData.length; i++) {
                    sum += Math.abs(audioData[i])
                }
                const level = Math.min(100, Math.round((sum / audioData.length) * 300))
                setAudioLevel(level)

                // Convert to base64 and send
                const int16Data = new Int16Array(audioData.length)
                for (let i = 0; i < audioData.length; i++) {
                    int16Data[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32767))
                }

                const base64Audio = btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)))

                wsRef.current.send(JSON.stringify({
                    type: 'broadcast',
                    payload: {
                        type: 'voiceData',
                        from: identity?.nodeId,
                        nickname: username,
                        audio: base64Audio,
                        target: callPartnerRef.current,
                        timestamp: Date.now()
                    }
                }))
            }

            return true
        } catch (error) {
            console.error('Error accessing microphone:', error)
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: 'Could not access microphone. Please grant permission.',
                timestamp: new Date().toLocaleTimeString()
            }])
            return false
        }
    }

    // Stop audio capture
    const stopAudioCapture = () => {
        if (processorRef.current) {
            processorRef.current.disconnect()
            processorRef.current = null
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop())
            mediaStreamRef.current = null
        }
        setAudioLevel(0)
    }

    // Play received audio
    const playAudio = (base64Audio: string) => {
        if (isMuted) return

        try {
            const audioContext = initAudioContext()
            const binaryString = atob(base64Audio)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
            }

            const int16Data = new Int16Array(bytes.buffer)
            const floatData = new Float32Array(int16Data.length)
            for (let i = 0; i < int16Data.length; i++) {
                floatData[i] = int16Data[i] / 32767
            }

            const audioBuffer = audioContext.createBuffer(1, floatData.length, 16000)
            audioBuffer.copyToChannel(floatData, 0)

            const source = audioContext.createBufferSource()
            source.buffer = audioBuffer
            source.connect(audioContext.destination)
            source.start()
        } catch (error) {
            console.error('Error playing audio:', error)
        }
    }

    // Make a call
    const makeCall = (targetNickname: string) => {
        if (callState !== 'idle') {
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: 'Already in a call. Hang up first.',
                timestamp: new Date().toLocaleTimeString()
            }])
            return
        }

        setCallState('calling')
        setCallPartner(targetNickname)

        wsRef.current?.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'callRequest',
                from: identity?.nodeId,
                nickname: username,
                target: targetNickname,
                timestamp: Date.now()
            }
        }))

        setMessages(prev => [...prev, {
            type: 'system',
            sender: 'System',
            content: `Calling ${targetNickname}...`,
            timestamp: new Date().toLocaleTimeString()
        }])

        // Timeout after 30 seconds
        setTimeout(() => {
            if (callState === 'calling') {
                setCallState('idle')
                setCallPartner(null)
                setMessages(prev => [...prev, {
                    type: 'system',
                    sender: 'System',
                    content: `No answer from ${targetNickname}`,
                    timestamp: new Date().toLocaleTimeString()
                }])
            }
        }, 30000)
    }

    // Answer incoming call
    const answerCall = async () => {
        if (callState !== 'ringing' || !incomingCaller) return

        // Stop ring tone
        if (ringIntervalRef.current) {
            clearInterval(ringIntervalRef.current)
            ringIntervalRef.current = null
        }

        // Request microphone permission before answering
        const hasAudio = await startAudioCapture()
        if (!hasAudio) {
            rejectCall()
            return
        }

        setCallState('in_call')
        setCallPartner(incomingCaller)
        setIncomingCaller(null)

        wsRef.current?.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'callAccepted',
                from: identity?.nodeId,
                nickname: username,
                target: incomingCaller,
                timestamp: Date.now()
            }
        }))

        setMessages(prev => [...prev, {
            type: 'system',
            sender: 'System',
            content: `Connected with ${incomingCaller}`,
            timestamp: new Date().toLocaleTimeString()
        }])
    }

    // Reject incoming call
    const rejectCall = () => {
        if (callState !== 'ringing' || !incomingCaller) return

        // Stop ring tone
        if (ringIntervalRef.current) {
            clearInterval(ringIntervalRef.current)
            ringIntervalRef.current = null
        }

        wsRef.current?.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'callRejected',
                from: identity?.nodeId,
                nickname: username,
                target: incomingCaller,
                timestamp: Date.now()
            }
        }))

        setMessages(prev => [...prev, {
            type: 'system',
            sender: 'System',
            content: `Rejected call from ${incomingCaller}`,
            timestamp: new Date().toLocaleTimeString()
        }])

        setCallState('idle')
        setIncomingCaller(null)
    }

    // Hang up
    const hangUp = () => {
        if (callState !== 'in_call' && callState !== 'calling') return

        stopAudioCapture()
        setIsTalking(false)

        if (callPartner) {
            wsRef.current?.send(JSON.stringify({
                type: 'broadcast',
                payload: {
                    type: 'callEnded',
                    from: identity?.nodeId,
                    nickname: username,
                    target: callPartner,
                    timestamp: Date.now()
                }
            }))
        }

        setMessages(prev => [...prev, {
            type: 'system',
            sender: 'System',
            content: 'Call ended',
            timestamp: new Date().toLocaleTimeString()
        }])

        setCallState('idle')
        setCallPartner(null)
    }

    // Start talking (push-to-talk)
    const startTalking = async () => {
        if (callState !== 'in_call') return

        if (!mediaStreamRef.current) {
            const hasAudio = await startAudioCapture()
            if (!hasAudio) return
        }

        setIsTalking(true)

        wsRef.current?.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'voiceStatus',
                from: identity?.nodeId,
                nickname: username,
                status: 'started',
                target: callPartner,
                timestamp: Date.now()
            }
        }))
    }

    // Stop talking
    const stopTalking = () => {
        if (!isTalking) return

        setIsTalking(false)
        setAudioLevel(0)

        wsRef.current?.send(JSON.stringify({
            type: 'broadcast',
            payload: {
                type: 'voiceStatus',
                from: identity?.nodeId,
                nickname: username,
                status: 'stopped',
                target: callPartner,
                timestamp: Date.now()
            }
        }))
    }

    // Handle voice payload
    const handleVoicePayload = (payload: any) => {
        const senderName = payload.nickname || payload.from?.slice(0, 12) || 'Unknown'
        if (senderName === username) return

        switch (payload.type) {
            case 'callRequest':
                // Check if this call is for us
                if (payload.target === username || payload.target.toLowerCase() === username.toLowerCase()) {
                    if (callStateRef.current === 'idle') {
                        setIncomingCaller(senderName)
                        setCallState('ringing')

                        // Play ring sound (visual notification)
                        ringIntervalRef.current = setInterval(() => {
                            // Terminal bell sound
                            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleHsYcKjm8tK7egMthNT82suxcCM1jdb/3syrXSEzkt7/3MmgWzEqiNX/3cmfWzYqiNT/3saYWz4pid3/3MWQWEpVi9n/28OLXFRSkNf/2sCIYl1Li9X/27+IY11PjNP/276FY2JOjdH/2ryFZWNPjtD/2rqFZWNPjtD/2rmFZWJQjtD/2rqFZGNPjtH/27uFZWFOjdD/2ruGZmBPjdD/2rqHZl9Qj9D/27qGZl9RjtD/2ryGZl5RkNL/2ryGZl5Rj9H/27qJZlxTkdP/2rqIZlxTkdT/2rmIZltUk9X/2riJZlpVlNX/2reKZlhXldX/2raKZldYldX/27aJZldZltX/2raKZlZalt3/27WKZldaltz/27WLZlVcltr/27SNZVRdl9n/2rOOZVJfl9n/2rGPZVFfl9r/2rCQZVBhmdr/2a+RZE9imdr/2a+RZE5jmtr/2a6TY01kmtr/2a2TY0xkmtr/2ayVYktlm9r/2KuWYkpnm9v/2KqWYkhonNz/2KqXYUdon93/2KmYYUdpnt3/2KiZYEZqnt7/2KeaYEVrn97/16ebX0Rsn97/16acXkNtoN7/16WdXkJuoN7/16SdXUFvoN//16OeXUBwoN//1qKfXD9xod//1qGfXD5yod//1qCgWz5zot//1qChWz10ot//1p+hWjx1o+D/1p6iWjt2pOD/1p2jWTp3pOH/1pykWDl4peH/1pylVzl5peH/1pqmVjh6puL/1pmm');
                            audio.volume = 0.3
                            audio.play().catch(() => {})
                        }, 2000)

                        setMessages(prev => [...prev, {
                            type: 'system',
                            sender: 'System',
                            content: `📞 Incoming call from ${senderName}`,
                            timestamp: new Date().toLocaleTimeString()
                        }])
                    } else {
                        // Send busy signal
                        wsRef.current?.send(JSON.stringify({
                            type: 'broadcast',
                            payload: {
                                type: 'callBusy',
                                from: identity?.nodeId,
                                nickname: username,
                                target: senderName,
                                timestamp: Date.now()
                            }
                        }))
                    }
                }
                break

            case 'callAccepted':
                if (payload.target === username && callStateRef.current === 'calling') {
                    setCallState('in_call')
                    setCallPartner(senderName)
                    startAudioCapture()
                    setMessages(prev => [...prev, {
                        type: 'system',
                        sender: 'System',
                        content: `Connected with ${senderName}`,
                        timestamp: new Date().toLocaleTimeString()
                    }])
                }
                break

            case 'callRejected':
                if (payload.target === username && callStateRef.current === 'calling') {
                    setCallState('idle')
                    setCallPartner(null)
                    setMessages(prev => [...prev, {
                        type: 'system',
                        sender: 'System',
                        content: `${senderName} declined the call`,
                        timestamp: new Date().toLocaleTimeString()
                    }])
                }
                break

            case 'callBusy':
                if (payload.target === username && callStateRef.current === 'calling') {
                    setCallState('idle')
                    setCallPartner(null)
                    setMessages(prev => [...prev, {
                        type: 'system',
                        sender: 'System',
                        content: `${senderName} is busy`,
                        timestamp: new Date().toLocaleTimeString()
                    }])
                }
                break

            case 'callEnded':
                if (payload.target === username && (callStateRef.current === 'in_call' || callStateRef.current === 'ringing')) {
                    stopAudioCapture()
                    if (ringIntervalRef.current) {
                        clearInterval(ringIntervalRef.current)
                        ringIntervalRef.current = null
                    }
                    setIsTalking(false)
                    setCallState('idle')
                    setCallPartner(null)
                    setIncomingCaller(null)
                    setMessages(prev => [...prev, {
                        type: 'system',
                        sender: 'System',
                        content: `Call ended by ${senderName}`,
                        timestamp: new Date().toLocaleTimeString()
                    }])
                }
                break

            case 'voiceData':
                if (callState === 'in_call' && senderName === callPartner) {
                    playAudio(payload.audio)
                }
                break

            case 'voiceStatus':
                if (callState === 'in_call' && senderName === callPartner) {
                    setMessages(prev => [...prev, {
                        type: 'system',
                        sender: 'System',
                        content: payload.status === 'started' ? `${senderName} is talking...` : `${senderName} stopped`,
                        timestamp: new Date().toLocaleTimeString()
                    }])
                }
                break
        }
    }

    // Settings functions
    const openSettings = async () => {
        try {
            if (window.electronAPI) {
                const paths = await window.electronAPI.identity.getPaths()
                setStoragePaths(paths)
                const exported = await window.electronAPI.identity.export()
                setIdentityExport(exported)
            }
        } catch (error) {
            console.error('Error loading settings:', error)
        }
        setView('settings')
    }

    const updateDisplayName = async () => {
        if (!username.trim()) return
        try {
            if (window.electronAPI) {
                const updated = await window.electronAPI.identity.updateUsername(username)
                if (updated) setIdentity(updated)
            }
        } catch (error) {
            console.error('Error updating username:', error)
        }
    }

    // Loading screen
    if (loading) {
        return (
            <div className={`ranger-chat-container theme-${theme}`}>
                <div className="loading-screen">
                    <div className="loading-spinner">🦅</div>
                    <p>Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`ranger-chat-container theme-${theme}`}>
            {/* UPDATE BANNER - Shows on all views */}
            {updateAvailable && showUpdateBanner && (
                <div className="update-banner">
                    <div className="update-content">
                        <span className="update-icon">🚀</span>
                        <span className="update-text">
                            <strong>Update Available!</strong> v{latestVersion} is ready.
                        </span>
                        <span className="update-command">
                            Run: <code>git pull</code> then <code>npm run dev</code>
                        </span>
                    </div>
                    <button className="update-dismiss" onClick={() => setShowUpdateBanner(false)}>
                        ✕
                    </button>
                </div>
            )}

            {/* LOGIN VIEW */}
            {view === 'login' && (
                <div className="login-screen">
                    <div className="login-card">
                        <div className="logo">🦅</div>
                        <h1>RangerChat</h1>
                        <p className="subtitle">Lite Edition v{APP_VERSION}</p>

                        <div className="input-group">
                            <label>Choose Your Name</label>
                            <div className="username-input-row">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter a display name..."
                                    className={isGenerating ? 'generating' : ''}
                                />
                                <button
                                    className="random-btn"
                                    onClick={generateRandomUsername}
                                    title="Generate random name"
                                >
                                    🎲
                                </button>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Server</label>
                            <input
                                type="text"
                                value={serverUrl}
                                onChange={(e) => setServerUrl(e.target.value)}
                                placeholder="ws://..."
                            />
                        </div>

                        <button className="connect-btn" onClick={connect} disabled={!username.trim()}>
                            Connect
                        </button>
                    </div>
                </div>
            )}

            {/* CHAT VIEW */}
            {view === 'chat' && (
                <div className="chat-interface">
                    <div className="chat-header">
                        <div className="header-left">
                            <span className="header-icon">🦅</span>
                            <span className="header-title">RangerChat</span>
                            <span className="peer-count">{peerCount} online</span>
                        </div>
                        <div className="header-right">
                            {/* Voice Call Button */}
                            <button
                                className={`header-btn call-btn ${callState !== 'idle' ? 'active' : ''}`}
                                onClick={() => setShowPeerList(!showPeerList)}
                                title={callState === 'idle' ? 'Make a call' : callState === 'in_call' ? `In call with ${callPartner}` : 'Calling...'}
                                disabled={callState === 'ringing'}
                            >
                                {callState === 'idle' ? '📞' : callState === 'in_call' ? '🔊' : '📱'}
                            </button>
                            <button
                                className={`header-btn ${showSearch ? 'active' : ''}`}
                                onClick={() => setShowSearch(!showSearch)}
                                title="Search messages"
                            >
                                🔍
                            </button>
                            <button
                                className="header-btn"
                                onClick={cycleTheme}
                                title={`Theme: ${THEMES[theme].name} (click to change)`}
                            >
                                {THEMES[theme].icon}
                            </button>
                            <button
                                className="header-btn"
                                onClick={() => { loadLedgerData(); setView('ledger') }}
                                title="Blockchain Ledger"
                            >
                                ⛓️
                            </button>
                            <button
                                className="header-btn"
                                onClick={openSettings}
                                title="Settings"
                            >
                                ⚙️
                            </button>
                        </div>
                    </div>

                    {showSearch && (
                        <div className="search-bar">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search messages..."
                                autoFocus
                            />
                            {searchQuery && (
                                <span className="search-count">
                                    {getFilteredMessages().length} found
                                </span>
                            )}
                            <button onClick={() => { setSearchQuery(''); setShowSearch(false); }}>✕</button>
                        </div>
                    )}

                    {/* Incoming Call Banner */}
                    {callState === 'ringing' && incomingCaller && (
                        <div className="incoming-call-banner">
                            <div className="call-info">
                                <span className="call-icon ringing">📞</span>
                                <span className="caller-name">{incomingCaller}</span>
                                <span className="call-status">is calling...</span>
                            </div>
                            <div className="call-actions">
                                <button className="call-answer-btn" onClick={answerCall}>
                                    ✓ Answer
                                </button>
                                <button className="call-reject-btn" onClick={rejectCall}>
                                    ✕ Reject
                                </button>
                            </div>
                        </div>
                    )}

                    {/* In-Call Control Bar */}
                    {callState === 'in_call' && (
                        <div className="in-call-bar">
                            <div className="call-info">
                                <span className="call-icon connected">🔊</span>
                                <span className="call-partner">{callPartner}</span>
                                {isTalking && (
                                    <div className="audio-meter">
                                        <div
                                            className="audio-level"
                                            style={{ width: `${audioLevel}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="call-controls">
                                <button
                                    className={`talk-btn ${isTalking ? 'talking' : ''}`}
                                    onMouseDown={startTalking}
                                    onMouseUp={stopTalking}
                                    onMouseLeave={stopTalking}
                                    onTouchStart={startTalking}
                                    onTouchEnd={stopTalking}
                                >
                                    {isTalking ? '🎤 Talking...' : '🎤 Push to Talk'}
                                </button>
                                <button
                                    className={`mute-btn ${isMuted ? 'muted' : ''}`}
                                    onClick={() => setIsMuted(!isMuted)}
                                    title={isMuted ? 'Unmute' : 'Mute'}
                                >
                                    {isMuted ? '🔇' : '🔊'}
                                </button>
                                <button className="hangup-btn" onClick={hangUp}>
                                    📵 Hang Up
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Calling Status Bar */}
                    {callState === 'calling' && (
                        <div className="calling-bar">
                            <div className="call-info">
                                <span className="call-icon calling">📱</span>
                                <span className="call-partner">
                                    Calling {callPartner}
                                    <span className="call-dots">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </span>
                                </span>
                            </div>
                            <button className="cancel-call-btn" onClick={hangUp}>
                                ✕ Cancel
                            </button>
                        </div>
                    )}

                    <div className="chat-history" ref={chatHistoryRef}>
                        {getFilteredMessages().map((msg, i) => (
                            <div key={i} className={`message ${msg.type} ${msg.sender === username ? 'own' : ''}`}>
                                <div className="message-meta">
                                    <span className="sender">
                                        {msg.sender === username && adminStatus?.isSupreme && <span className="msg-admin-badge">👑</span>}
                                        {msg.sender}
                                    </span>
                                    <span className="timestamp">{msg.timestamp}</span>
                                </div>
                                <div className="message-content">{msg.content}</div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {showEmojiPicker && (
                        <div className="emoji-picker">
                            <div className="emoji-header">
                                <input
                                    type="text"
                                    value={emojiSearch}
                                    onChange={(e) => setEmojiSearch(e.target.value)}
                                    placeholder="Search emojis..."
                                    className="emoji-search"
                                />
                                <button className="emoji-close" onClick={() => setShowEmojiPicker(false)}>✕</button>
                            </div>
                            <div className="emoji-categories">
                                {(Object.keys(EMOJI_DATA) as (keyof typeof EMOJI_DATA)[]).map(cat => (
                                    <button
                                        key={cat}
                                        className={`cat-btn ${emojiCategory === cat ? 'active' : ''}`}
                                        onClick={() => { setEmojiCategory(cat); setEmojiSearch(''); }}
                                    >
                                        {EMOJI_DATA[cat][0]}
                                    </button>
                                ))}
                            </div>
                            <div className="emoji-grid">
                                {getFilteredEmojis().map((emoji, i) => (
                                    <button
                                        key={i}
                                        className="emoji-btn"
                                        onClick={() => insertEmoji(emoji)}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="chat-input-area">
                        <button
                            className={`emoji-toggle ${showEmojiPicker ? 'active' : ''}`}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                            😀
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                            className="message-input"
                        />
                        <button className="send-btn" onClick={sendMessage}>
                            Send
                        </button>
                    </div>

                    {/* Call Modal */}
                    {showPeerList && callState === 'idle' && (
                        <div className="call-modal-overlay" onClick={() => setShowPeerList(false)}>
                            <div className="call-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="call-modal-header">
                                    <div className="call-modal-title">
                                        <span className="call-icon">📱</span>
                                        <span>Voice Call</span>
                                    </div>
                                    <button className="call-modal-close" onClick={() => setShowPeerList(false)}>
                                        ✕
                                    </button>
                                </div>
                                <div className="call-modal-body">
                                    {peers.length === 0 ? (
                                        <div className="peer-list-empty">
                                            <div className="empty-icon">📡</div>
                                            <div className="empty-text">Waiting for Rangers...</div>
                                            <div className="empty-hint">No other users are online yet. Share the app with a friend!</div>
                                        </div>
                                    ) : (
                                        peers.map((peer, i) => (
                                            <div key={i} className="peer-list-item">
                                                <div className="peer-avatar" style={{
                                                    background: `linear-gradient(135deg, ${
                                                        ['#5c6bc0', '#26a69a', '#ef5350', '#ab47bc', '#ffa726'][i % 5]
                                                    } 0%, ${
                                                        ['#3949ab', '#00897b', '#c62828', '#7b1fa2', '#f57c00'][i % 5]
                                                    } 100%)`
                                                }}>
                                                    {peer.nickname.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="peer-info">
                                                    <div className="peer-name">{peer.nickname}</div>
                                                    <div className="peer-status">
                                                        <span className="online-dot"></span>
                                                        Online{peer.capabilities?.includes('voice') && ' • Voice Ready'}
                                                    </div>
                                                </div>
                                                <button
                                                    className="peer-call-btn"
                                                    onClick={() => {
                                                        makeCall(peer.nickname)
                                                        setShowPeerList(false)
                                                    }}
                                                >
                                                    📞 Call
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="call-modal-footer">
                                    <div className="call-modal-tip">
                                        💡 Tip: Type <code>/call username</code> in chat
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* SETTINGS VIEW */}
            {view === 'settings' && (
                <div className="settings-screen">
                    <div className="settings-header">
                        <button className="back-btn" onClick={() => setView(connected ? 'chat' : 'login')}>
                            ← Back
                        </button>
                        <h2>Settings</h2>
                    </div>

                    <div className="settings-content">
                        {/* Profile Section */}
                        <div className="settings-section">
                            <h3>👤 Profile</h3>
                            <div className="setting-item">
                                <label>Display Name</label>
                                <div className="username-input-row">
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                    <button className="random-btn" onClick={generateRandomUsername}>🎲</button>
                                </div>
                                <button className="save-btn" onClick={updateDisplayName}>
                                    Save Name
                                </button>
                            </div>
                        </div>

                        {/* Identity Section */}
                        {identity && (
                            <div className="settings-section">
                                <h3>🔐 Identity</h3>
                                <div className="identity-info">
                                    <div className="info-row">
                                        <span className="info-label">User ID:</span>
                                        <span className="info-value mono">{identity.userId}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Node ID:</span>
                                        <span className="info-value mono">{identity.nodeId.substring(0, 30)}...</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Created:</span>
                                        <span className="info-value">{new Date(identity.created).toLocaleDateString()}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Device:</span>
                                        <span className="info-value">{identity.platform.hostname} ({identity.platform.system})</span>
                                    </div>
                                </div>
                                <p className="identity-note">
                                    🛡️ Your identity is linked to this device. Even if you change your display name,
                                    admins can track your real identity for moderation purposes.
                                </p>

                                {/* Admin Status */}
                                {adminStatus && (
                                    <div className="admin-status-box">
                                        <div className="admin-status-header">
                                            {adminStatus.isSupreme ? '👑' : adminStatus.isAdmin ? '🛡️' : adminStatus.isModerator ? '⚔️' : '👤'}
                                            <span>Role: <strong>{adminStatus.role.toUpperCase()}</strong></span>
                                        </div>
                                        {adminStatus.isSupreme && (
                                            <div className="admin-status-detail supreme">
                                                SUPREME ADMIN - Full control over RangerBlock network
                                            </div>
                                        )}
                                        {adminStatus.isAdmin && !adminStatus.isSupreme && (
                                            <div className="admin-status-detail admin">
                                                ADMIN - Can approve users, moderate chat, manage bans
                                            </div>
                                        )}
                                        {adminStatus.isModerator && (
                                            <div className="admin-status-detail mod">
                                                MODERATOR - Can moderate chat and report users
                                            </div>
                                        )}
                                        {!adminStatus.isAdmin && !adminStatus.isModerator && !adminStatus.isSupreme && (
                                            <div className="admin-status-detail user">
                                                Standard user - No special permissions
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Blockchain Transactions Section */}
                        <div className="settings-section blockchain-section">
                            <div className="section-header-row">
                                <h3>⛓️ Blockchain Transactions</h3>
                                <button
                                    className={`toggle-btn ${showTransactions ? 'active' : ''}`}
                                    onClick={() => setShowTransactions(!showTransactions)}
                                >
                                    {showTransactions ? 'Hide' : 'Show'}
                                </button>
                            </div>

                            {/* Transaction Stats */}
                            <div className="tx-stats">
                                <div className="tx-stat">
                                    <span className="stat-icon">📤</span>
                                    <span className="stat-value">{txStats.sent}</span>
                                    <span className="stat-label">Sent</span>
                                </div>
                                <div className="tx-stat">
                                    <span className="stat-icon">📥</span>
                                    <span className="stat-value">{txStats.received}</span>
                                    <span className="stat-label">Received</span>
                                </div>
                                <div className="tx-stat">
                                    <span className="stat-icon">📊</span>
                                    <span className="stat-value">{txStats.total}</span>
                                    <span className="stat-label">Total</span>
                                </div>
                                <div className="tx-stat">
                                    <span className="stat-icon">💾</span>
                                    <span className="stat-value">{(txStats.bytes / 1024).toFixed(1)}KB</span>
                                    <span className="stat-label">Data</span>
                                </div>
                            </div>

                            {/* Transaction Feed */}
                            {showTransactions && (
                                <div className="tx-feed">
                                    <div className="tx-feed-header">
                                        <span className="feed-title">Live Transaction Feed</span>
                                        <span className="feed-count">{transactions.length} transactions</span>
                                    </div>
                                    <div className="tx-list">
                                        {transactions.length === 0 ? (
                                            <div className="tx-empty">
                                                <span>No transactions yet</span>
                                                <span className="tx-empty-hint">Connect to chat to see blockchain activity</span>
                                            </div>
                                        ) : (
                                            transactions.map(tx => (
                                                <div key={tx.id} className={`tx-item tx-${tx.direction} tx-type-${tx.type}`}>
                                                    <div className="tx-header">
                                                        <span className={`tx-direction ${tx.direction}`}>
                                                            {tx.direction === 'in' ? '📥' : '📤'}
                                                        </span>
                                                        <span className="tx-id">{tx.id.substring(0, 14)}...</span>
                                                        <span className={`tx-status ${tx.status}`}>{tx.status}</span>
                                                    </div>
                                                    <div className="tx-body">
                                                        <div className="tx-route">
                                                            <span className="tx-from" title={tx.from}>
                                                                {tx.from.length > 12 ? tx.from.substring(0, 12) + '...' : tx.from}
                                                            </span>
                                                            <span className="tx-arrow">→</span>
                                                            <span className="tx-to" title={tx.to}>
                                                                {tx.to.length > 12 ? tx.to.substring(0, 12) + '...' : tx.to}
                                                            </span>
                                                        </div>
                                                        <div className="tx-payload">{tx.payload}</div>
                                                    </div>
                                                    <div className="tx-footer">
                                                        <span className="tx-size">{tx.size} bytes</span>
                                                        <span className="tx-time">
                                                            {new Date(tx.timestamp).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Smart Contracts Section */}
                        <div className="settings-section contracts-section">
                            <div className="section-header-row">
                                <h3>📜 Smart Contracts</h3>
                                <div className="chain-selector">
                                    <button
                                        className={`chain-btn ${preferredChain === 'solana' ? 'active' : ''}`}
                                        onClick={() => setPreferredChain('solana')}
                                    >
                                        ◎ Solana
                                    </button>
                                    <button
                                        className={`chain-btn ${preferredChain === 'ethereum' ? 'active' : ''}`}
                                        onClick={() => setPreferredChain('ethereum')}
                                    >
                                        ⟠ Ethereum
                                    </button>
                                </div>
                            </div>

                            <div className="contracts-grid">
                                {contracts
                                    .filter(c => c.chain === 'both' || c.chain === preferredChain)
                                    .map(contract => (
                                    <div
                                        key={contract.id}
                                        className={`contract-card ${selectedContract?.id === contract.id ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedContract(contract)
                                            setShowContractDetails(true)
                                        }}
                                    >
                                        <div className="contract-header">
                                            <span className="contract-icon">{contract.icon}</span>
                                            <span className="contract-name">{contract.name}</span>
                                            <span className={`contract-chain chain-${contract.chain}`}>
                                                {contract.chain === 'both' ? '◎⟠' : contract.chain === 'solana' ? '◎' : '⟠'}
                                            </span>
                                        </div>
                                        <p className="contract-description">{contract.description}</p>
                                        <div className="contract-category">
                                            <span className={`category-badge cat-${contract.category}`}>
                                                {contract.category}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Contract Details Modal */}
                            {showContractDetails && selectedContract && (
                                <div className="contract-details-overlay" onClick={() => setShowContractDetails(false)}>
                                    <div className="contract-details" onClick={e => e.stopPropagation()}>
                                        <div className="details-header">
                                            <span className="details-icon">{selectedContract.icon}</span>
                                            <h3>{selectedContract.name}</h3>
                                            <button className="close-details" onClick={() => setShowContractDetails(false)}>✕</button>
                                        </div>

                                        <div className="details-body">
                                            <p className="details-description">{selectedContract.description}</p>

                                            <div className="details-chain">
                                                <span className="label">Available on:</span>
                                                <span className="value">
                                                    {selectedContract.chain === 'both' ? 'Solana & Ethereum' :
                                                     selectedContract.chain === 'solana' ? 'Solana' : 'Ethereum'}
                                                </span>
                                            </div>

                                            <div className="details-features">
                                                <span className="label">Features:</span>
                                                <ul className="features-list">
                                                    {selectedContract.features.map((feature, i) => (
                                                        <li key={i}>{feature}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="details-files">
                                                <span className="label">Contract Files:</span>
                                                <div className="file-list">
                                                    {(selectedContract.chain === 'both' || selectedContract.chain === 'solana') && (
                                                        <code className="file-path">
                                                            Blockchain/contracts/solana/ranger_{selectedContract.category === 'registration' ? 'registration' :
                                                                selectedContract.category === 'bridge' ? 'bridge' :
                                                                selectedContract.category === 'transfer' ? 'file_transfer' : 'token'}.rs
                                                        </code>
                                                    )}
                                                    {(selectedContract.chain === 'both' || selectedContract.chain === 'ethereum') && (
                                                        <code className="file-path">
                                                            Blockchain/contracts/Ranger{selectedContract.category === 'registration' ? 'Registration' :
                                                                selectedContract.category === 'bridge' ? 'Bridge' :
                                                                selectedContract.category === 'transfer' ? 'FileTransfer' : 'Token'}.sol
                                                        </code>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="details-status">
                                                <span className={`status-badge status-${selectedContract.status}`}>
                                                    {selectedContract.status === 'available' ? '🟢 Available' :
                                                     selectedContract.status === 'deployed' ? '🔵 Deployed' : '⭐ Selected'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="details-actions">
                                            <button
                                                className="action-btn select-btn"
                                                onClick={() => {
                                                    setContracts(prev => prev.map(c => ({
                                                        ...c,
                                                        status: c.id === selectedContract.id ? 'selected' : c.status === 'selected' ? 'available' : c.status
                                                    })))
                                                    setSelectedContract({ ...selectedContract, status: 'selected' })
                                                }}
                                            >
                                                {selectedContract.status === 'selected' ? '⭐ Selected' : 'Select Contract'}
                                            </button>
                                            <button
                                                className="action-btn deploy-btn"
                                                onClick={() => window.open(
                                                    preferredChain === 'solana'
                                                        ? 'https://beta.solpg.io'
                                                        : 'https://remix.ethereum.org',
                                                    '_blank'
                                                )}
                                            >
                                                🚀 Deploy on {preferredChain === 'solana' ? 'Solana Playground' : 'Remix IDE'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <p className="contracts-note">
                                📜 Select a contract to view details. Deploy contracts using{' '}
                                <a href="https://beta.solpg.io" target="_blank" rel="noopener">Solana Playground</a> or{' '}
                                <a href="https://remix.ethereum.org" target="_blank" rel="noopener">Remix IDE</a>.
                            </p>
                        </div>

                        {/* Theme Section */}
                        <div className="settings-section">
                            <h3>🎨 Theme</h3>
                            <div className="theme-grid">
                                {(Object.keys(THEMES) as ThemeName[]).map(t => (
                                    <button
                                        key={t}
                                        className={`theme-option ${theme === t ? 'active' : ''}`}
                                        onClick={() => setTheme(t)}
                                    >
                                        <span className="theme-icon">{THEMES[t].icon}</span>
                                        <span className="theme-name">{THEMES[t].name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Storage Section */}
                        {storagePaths && (
                            <div className="settings-section">
                                <h3>📁 Storage</h3>
                                <div className="storage-info">
                                    <div className="info-row">
                                        <span className="info-label">Identity File:</span>
                                        <span className="info-value small">{storagePaths.identityFile}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">RangerPlex Folder:</span>
                                        <span className="info-value small">{storagePaths.personalDir}</span>
                                    </div>
                                </div>
                                <p className="storage-note">
                                    📦 Identity files are compatible with RangerPlex browser.
                                </p>
                            </div>
                        )}

                        {/* About Section */}
                        <div className="settings-section">
                            <h3>ℹ️ About</h3>
                            <div className="about-info">
                                <p><strong>RangerChat Lite</strong> v{APP_VERSION}</p>
                                <p>A lightweight chat client for the RangerPlex network.</p>
                                {updateAvailable && (
                                    <div className="update-notice">
                                        <span className="update-badge">🚀 Update Available: v{latestVersion}</span>
                                        <div className="update-instructions">
                                            <p>To update, run in terminal:</p>
                                            <code>cd apps/ranger-chat-lite</code>
                                            <code>git pull</code>
                                            <code>npm install</code>
                                            <code>npm run dev</code>
                                        </div>
                                    </div>
                                )}
                                <p className="mission">🎖️ Mission: Transform disabilities into superpowers</p>
                                <p className="philosophy">"One foot in front of the other" - David Keane</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LEDGER VIEW */}
            {view === 'ledger' && (
                <div className="ledger-screen">
                    <div className="ledger-header">
                        <button className="back-btn" onClick={() => setView(connected ? 'chat' : 'login')}>
                            ← Back
                        </button>
                        <h2>⛓️ Blockchain Ledger</h2>
                        <button className="refresh-btn" onClick={refreshLedger} disabled={ledgerLoading}>
                            🔄
                        </button>
                    </div>

                    <div className="ledger-content">
                        {/* Status Section */}
                        {ledgerStatus && (
                            <div className="ledger-section status-section">
                                <h3>📊 Chain Status</h3>
                                <div className="status-grid">
                                    <div className="status-item">
                                        <span className="status-value">{ledgerStatus.chainHeight}</span>
                                        <span className="status-label">Blocks</span>
                                    </div>
                                    <div className="status-item">
                                        <span className="status-value">{ledgerStatus.totalMessages}</span>
                                        <span className="status-label">Messages</span>
                                    </div>
                                    <div className="status-item">
                                        <span className="status-value">{ledgerStatus.pendingTransactions}</span>
                                        <span className="status-label">Pending</span>
                                    </div>
                                    <div className="status-item">
                                        <span className="status-value">{ledgerStatus.totalUsers}</span>
                                        <span className="status-label">Users</span>
                                    </div>
                                </div>
                                <div className="status-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Last Block:</span>
                                        <span className="detail-value mono">{formatHash(ledgerStatus.lastBlockHash)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Last Mined:</span>
                                        <span className="detail-value">
                                            {ledgerStatus.lastBlockTime ? formatTime(ledgerStatus.lastBlockTime) : 'Never'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions Section */}
                        <div className="ledger-section actions-section">
                            <h3>⚡ Actions</h3>
                            <div className="action-buttons">
                                <button
                                    className="action-btn mine-btn"
                                    onClick={manualMineBlock}
                                    disabled={ledgerLoading || (ledgerStatus?.pendingTransactions === 0)}
                                >
                                    ⛏️ Mine Block
                                </button>
                                <button className="action-btn export-btn" onClick={exportChain}>
                                    📥 Export Chain
                                </button>
                            </div>
                            {ledgerStatus?.pendingTransactions === 0 && (
                                <p className="action-note">No pending transactions to mine</p>
                            )}
                        </div>

                        {/* Blocks Section */}
                        <div className="ledger-section blocks-section">
                            <h3>🧱 Recent Blocks</h3>
                            {ledgerLoading ? (
                                <div className="loading-blocks">Loading...</div>
                            ) : ledgerBlocks.length === 0 ? (
                                <div className="no-blocks">No blocks yet. Mine some transactions!</div>
                            ) : (
                                <div className="blocks-list">
                                    {ledgerBlocks.map(block => (
                                        <div
                                            key={block.index}
                                            className={`block-card ${selectedBlock?.index === block.index ? 'selected' : ''}`}
                                            onClick={() => setSelectedBlock(selectedBlock?.index === block.index ? null : block)}
                                        >
                                            <div className="block-header">
                                                <span className="block-number">Block #{block.index}</span>
                                                <span className="block-txcount">{block.transactionCount} txs</span>
                                            </div>
                                            <div className="block-hash mono">{formatHash(block.hash)}</div>
                                            <div className="block-time">{formatTime(block.timestamp)}</div>

                                            {selectedBlock?.index === block.index && (
                                                <div className="block-details">
                                                    <div className="detail-row">
                                                        <span className="detail-label">Merkle Root:</span>
                                                        <span className="detail-value mono">{formatHash(block.merkleRoot)}</span>
                                                    </div>
                                                    <div className="detail-row">
                                                        <span className="detail-label">Previous:</span>
                                                        <span className="detail-value mono">{formatHash(block.previousHash)}</span>
                                                    </div>
                                                    <div className="detail-row">
                                                        <span className="detail-label">Nonce:</span>
                                                        <span className="detail-value">{block.nonce}</span>
                                                    </div>

                                                    {block.transactions.length > 0 && (
                                                        <div className="block-transactions">
                                                            <h4>Transactions:</h4>
                                                            {block.transactions.map((tx, i) => (
                                                                <div key={i} className="tx-item">
                                                                    <span className={`tx-type tx-type-${tx.type}`}>{tx.type}</span>
                                                                    <span className="tx-sender">{tx.data?.senderName || tx.sender?.substring(0, 8) || 'System'}</span>
                                                                    {tx.data?.content && (
                                                                        <span className="tx-content">
                                                                            {tx.data.content.substring(0, 50)}{tx.data.content.length > 50 ? '...' : ''}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info Section */}
                        <div className="ledger-section info-section">
                            <h3>ℹ️ About the Ledger</h3>
                            <p>
                                Every message is recorded on an immutable blockchain. Blocks are mined
                                automatically every 10 messages or 5 minutes using Proof of Work.
                            </p>
                            <p className="wallet-preview">
                                💰 <strong>Coming Soon:</strong> Wallet integration with token rewards!
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App

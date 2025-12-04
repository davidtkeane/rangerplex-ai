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
const APP_VERSION = '1.6.1'
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

    const wsRef = useRef<WebSocket | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatHistoryRef = useRef<HTMLDivElement>(null)

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
                            capabilities: ['chat']
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
                        const peers = data.peers || []
                        setPeerCount(peers.length)
                        setMessages(prev => [...prev, {
                            type: 'system',
                            sender: 'System',
                            content: `${peers.length} peer(s) online`,
                            timestamp: new Date().toLocaleTimeString()
                        }])
                        break
                    case 'peerListUpdate':
                        const updatedPeers = data.peers || []
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

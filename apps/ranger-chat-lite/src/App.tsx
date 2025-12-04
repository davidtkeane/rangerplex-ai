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
        }
    }
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
type ViewType = 'login' | 'chat' | 'settings'

// Current app version
const APP_VERSION = '1.4.1'
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

    // Update notification state
    const [updateAvailable, setUpdateAvailable] = useState(false)
    const [latestVersion, setLatestVersion] = useState<string | null>(null)
    const [showUpdateBanner, setShowUpdateBanner] = useState(true)

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
                                    <span className="sender">{msg.sender === username ? 'You' : msg.sender}</span>
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
        </div>
    )
}

export default App

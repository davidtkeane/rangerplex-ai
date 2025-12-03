import { useState, useEffect, useRef } from 'react'
import './App.css'

// Types
interface Message {
    type: 'chat' | 'system'
    sender: string
    content: string
    timestamp: string
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

function App() {
    const [connected, setConnected] = useState(false)
    const [username, setUsername] = useState('RangerUser')
    const [serverUrl, setServerUrl] = useState('ws://44.222.101.125:5555')
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [peerCount, setPeerCount] = useState(0)

    // New features
    const [theme, setTheme] = useState<ThemeName>('classic')
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [emojiCategory, setEmojiCategory] = useState<keyof typeof EMOJI_DATA>('frequent')
    const [emojiSearch, setEmojiSearch] = useState('')
    const [showSearch, setShowSearch] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const wsRef = useRef<WebSocket | null>(null)
    const nodeIdRef = useRef<string>('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatHistoryRef = useRef<HTMLDivElement>(null)

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

    const connect = () => {
        if (wsRef.current) wsRef.current.close()
        nodeIdRef.current = `lite-${Math.random().toString(36).substring(2, 10)}`
        const ws = new WebSocket(serverUrl)

        ws.onopen = () => {
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
                switch (data.type) {
                    case 'welcome':
                        ws.send(JSON.stringify({
                            type: 'register',
                            address: nodeIdRef.current,
                            nickname: username,
                            channel: '#rangers',
                            ip: '0.0.0.0',
                            port: 0,
                            mode: 'lite-client',
                            capabilities: ['chat']
                        }))
                        break
                    case 'registered':
                        setConnected(true)
                        setMessages(prev => [...prev, {
                            type: 'system',
                            sender: 'System',
                            content: `Registered as ${username}`,
                            timestamp: new Date().toLocaleTimeString()
                        }])
                        ws.send(JSON.stringify({ type: 'getPeers' }))
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
                        // Update peer count when peers join/leave
                        const updatedPeers = data.peers || []
                        setPeerCount(updatedPeers.length)
                        break
                    case 'broadcast':
                    case 'nodeMessage':
                        if (data.payload) handlePayload(data.payload)
                        break
                    case 'broadcastSent':
                        // Confirmation that our message was broadcast - ignore
                        break
                    default:
                        console.log('Unknown message type:', data.type)
                }
            } catch (e) {
                console.error('Failed to parse message', e)
            }
        }

        ws.onclose = () => {
            setConnected(false)
            setMessages(prev => [...prev, {
                type: 'system',
                sender: 'System',
                content: 'Disconnected from server',
                timestamp: new Date().toLocaleTimeString()
            }])
        }

        ws.onerror = (error) => {
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
                // Handle both chatMessage and chat payload types
                setMessages(prev => [...prev, {
                    type: 'chat',
                    sender: payload.nickname || payload.from || 'Unknown',
                    content: payload.message || payload.content || '',
                    timestamp: new Date().toLocaleTimeString()
                }])
                break
            default:
                console.log('Unknown payload type:', payload.type)
        }
    }

    const sendMessage = () => {
        if (!wsRef.current || !connected || !input.trim()) return

        const msg = {
            type: 'broadcast',
            payload: {
                type: 'chatMessage',
                from: nodeIdRef.current,
                nickname: username,
                message: input,
                timestamp: Date.now()
            }
        }

        wsRef.current.send(JSON.stringify(msg))
        setMessages(prev => [...prev, {
            type: 'chat',
            sender: username,
            content: input,
            timestamp: new Date().toLocaleTimeString()
        }])
        setInput('')
    }

    const insertEmoji = (emoji: string) => {
        setInput(prev => prev + emoji)
    }

    // Filter emojis by search
    const getFilteredEmojis = () => {
        const categoryEmojis = EMOJI_DATA[emojiCategory]
        if (!emojiSearch) return categoryEmojis

        // Search across all categories
        const allEmojis = Object.values(EMOJI_DATA).flat()
        return allEmojis.filter(emoji => emoji.includes(emojiSearch))
    }

    // Filter messages by search
    const getFilteredMessages = () => {
        if (!searchQuery) return messages
        return messages.filter(msg =>
            msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.sender.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }

    // Cycle through themes
    const cycleTheme = () => {
        const themeOrder: ThemeName[] = ['classic', 'matrix', 'tron', 'retro']
        const currentIndex = themeOrder.indexOf(theme)
        const nextIndex = (currentIndex + 1) % themeOrder.length
        setTheme(themeOrder[nextIndex])
    }

    return (
        <div className={`ranger-chat-container theme-${theme}`}>
            {!connected ? (
                <div className="login-screen">
                    <div className="login-card">
                        <div className="logo">🦅</div>
                        <h1>RangerChat</h1>
                        <p className="subtitle">Lite Edition</p>

                        <div className="input-group">
                            <label>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your name"
                            />
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

                        <button className="connect-btn" onClick={connect}>
                            Connect
                        </button>
                    </div>
                </div>
            ) : (
                <div className="chat-interface">
                    {/* Header */}
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
                        </div>
                    </div>

                    {/* Search Bar */}
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

                    {/* Chat History */}
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

                    {/* Emoji Picker */}
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

                    {/* Input Area */}
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
        </div>
    )
}

export default App

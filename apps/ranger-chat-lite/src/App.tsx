import { useState, useEffect, useRef } from 'react'
import './App.css'

// Types
interface Message {
    type: 'chat' | 'system'
    sender: string
    content: string
    timestamp: string
}

function App() {
    const [connected, setConnected] = useState(false)
    const [username, setUsername] = useState('RangerUser')
    const [serverUrl, setServerUrl] = useState('ws://44.222.101.125:5555') // Default to AWS
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [peerCount, setPeerCount] = useState(0)
    const wsRef = useRef<WebSocket | null>(null)
    const nodeIdRef = useRef<string>('')

    const connect = () => {
        if (wsRef.current) wsRef.current.close()

        // Generate unique node ID
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
                        // Server welcomed us, now register
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
                        // Request peer list
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

                    case 'broadcast':
                    case 'nodeMessage':
                        // Handle payload-wrapped messages
                        if (data.payload) {
                            handlePayload(data.payload)
                        }
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
                setMessages(prev => [...prev, {
                    type: 'chat',
                    sender: payload.nickname || 'Unknown',
                    content: payload.message,
                    timestamp: new Date().toLocaleTimeString()
                }])
                break

            default:
                console.log('Unknown payload type:', payload.type)
        }
    }

    const sendMessage = () => {
        if (!wsRef.current || !connected || !input.trim()) return

        // Use broadcast format with chatMessage payload (matching voice-chat.cjs)
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

        // Add to local view immediately
        setMessages(prev => [...prev, {
            type: 'chat',
            sender: username,
            content: input,
            timestamp: new Date().toLocaleTimeString()
        }])

        setInput('')
    }

    return (
        <div className="ranger-chat-container">
            {/* Custom Title Bar */}
            <div className="title-bar">
                <div className="title-text">💾 RangerChat Lite</div>
                <div className="window-controls">
                    <button className="minimize">_</button>
                    <button className="close" onClick={() => window.close()}>X</button>
                </div>
            </div>

            {!connected ? (
                <div className="login-screen">
                    <div className="logo">🦅</div>
                    <h2>RangerChat Login</h2>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Server URL (ws://...)"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                    />
                    <button onClick={connect}>Connect</button>
                </div>
            ) : (
                <div className="chat-interface">
                    <div className="chat-history">
                        {messages.map((msg, i) => (
                            <div key={i} className={`message ${msg.type} ${msg.sender === username ? 'own' : ''}`}>
                                <span className="sender">{msg.sender}:</span>
                                <span className="content">{msg.content}</span>
                            </div>
                        ))}
                    </div>
                    <div className="chat-input">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                        />
                        <button onClick={sendMessage}>Send</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App

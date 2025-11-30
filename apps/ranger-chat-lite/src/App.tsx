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
    const wsRef = useRef<WebSocket | null>(null)

    const connect = () => {
        if (wsRef.current) wsRef.current.close()

        const ws = new WebSocket(serverUrl)

        ws.onopen = () => {
            setConnected(true)
            // Register
            ws.send(JSON.stringify({
                type: 'register',
                name: username,
                nodeType: 'lite-client'
            }))
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                if (data.type === 'chat') {
                    setMessages(prev => [...prev, {
                        type: 'chat',
                        sender: data.sender || 'Unknown',
                        content: data.content,
                        timestamp: new Date().toLocaleTimeString()
                    }])
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

        wsRef.current = ws
    }

    const sendMessage = () => {
        if (!wsRef.current || !connected || !input.trim()) return

        const msg = {
            type: 'chat',
            sender: username,
            content: input,
            timestamp: Date.now()
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

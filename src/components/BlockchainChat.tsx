import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
    id: number | string;
    from: string;
    message: string;
    timestamp: number;
}

interface BlockchainChatProps {
    isOpen: boolean;
    onClose: () => void;
}

const BlockchainChat: React.FC<BlockchainChatProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [peerCount, setPeerCount] = useState(0);
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load messages
    const loadMessages = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://127.0.0.1:3000/api/rangerblock/chat');
            const data = await response.json();

            if (data.success) {
                setMessages(data.messages || []);
                setPeerCount(data.peerCount || 0);
            }
        } catch (error) {
            console.error('Failed to load chat messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Send message
    const sendMessage = async () => {
        if (!inputMessage.trim() || isSending) return;

        try {
            setIsSending(true);

            const response = await fetch('http://127.0.0.1:3000/api/rangerblock/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: inputMessage.trim() })
            });

            const data = await response.json();

            if (data.success) {
                setInputMessage('');
                await loadMessages(); // Reload to show new message
            } else {
                alert(data.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message. Is blockchain running?');
        } finally {
            setIsSending(false);
        }
    };

    // Handle Enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Poll for new messages every 2 seconds
    useEffect(() => {
        if (!isOpen) return;

        loadMessages();
        const interval = setInterval(loadMessages, 2000);

        return () => clearInterval(interval);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-zinc-900 border-2 border-green-500 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-green-500/30 bg-gradient-to-r from-green-900/20 to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <h2 className="text-xl font-bold text-green-400">
                                🎖️ RangerBlock Chat
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-green-400/60">
                                👥 {peerCount} Peer{peerCount !== 1 ? 's' : ''}
                            </span>
                            <button
                                onClick={onClose}
                                className="text-green-400 hover:text-green-300 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoading && messages.length === 0 ? (
                        <div className="text-center text-green-400/40 py-8">
                            Loading messages...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-green-400/40 py-8">
                            No messages yet. Start the conversation! 🎖️
                            <br />
                            <span className="text-xs">
                                {peerCount === 0 && '(Waiting for peers to connect...)'}
                            </span>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className="bg-green-900/10 border border-green-500/20 rounded-lg p-3"
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <span className="font-bold text-green-400 text-sm">
                                        {msg.from}
                                    </span>
                                    <span className="text-xs text-green-400/40">
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className="text-green-200 break-words">{msg.message}</p>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-green-500/30 bg-zinc-950">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={peerCount === 0 ? "Waiting for peers..." : "Type a message..."}
                            disabled={isSending}
                            className="flex-1 bg-zinc-800 border border-green-500/30 rounded-lg px-4 py-2 text-green-200 placeholder-green-400/30 focus:outline-none focus:border-green-500"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!inputMessage.trim() || isSending}
                            className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-lg transition-colors"
                        >
                            {isSending ? '...' : 'Send'}
                        </button>
                    </div>
                    <div className="text-xs text-green-400/40 mt-2 text-center">
                        Press Enter to send • Shift+Enter for new line
                        {peerCount === 0 && ' • Start blockchain node to chat'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlockchainChat;

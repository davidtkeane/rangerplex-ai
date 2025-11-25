// WebSocket Sync Service for RangerPlex AI
// Handles real-time synchronization between browser and server

class SyncService {
    private ws: WebSocket | null = null;
    private serverUrl = 'ws://localhost:3010';
    private reconnectInterval = 5000;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private isConnected = false;
    private syncQueue: any[] = [];
    private listeners: Map<string, Set<Function>> = new Map();
    private enabled = true;
    private queueStorageKey = 'rangerplex_sync_queue';

    constructor() {
        this.loadQueue();
        if (typeof window !== 'undefined') {
            this.connect();
        } else {
            console.log('📴 Sync service initialized (SSR) - will connect in browser');
        }
    }

    enableSync() {
        this.enabled = true;
        this.connect();
    }

    disableSync() {
        this.enabled = false;
        this.disconnect();
    }

    connect() {
        if (typeof window === 'undefined') return;
        try {
            this.ws = new WebSocket(this.serverUrl);

            this.ws.onopen = () => {
                this.isConnected = true;
                console.log('🔌 WebSocket connected to server');
                this.emit('connected');
                this.flushQueue();

                // Clear reconnect timer
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.emit('message', message);

                    // Handle specific message types
                    if (message.type === 'chat_updated') {
                        this.emit('chat_updated', message.chatId);
                    } else if (message.type === 'settings_updated') {
                        this.emit('settings_updated', message.key);
                    } else if (message.type === 'full_import') {
                        this.emit('full_import');
                    } else if (message.type === 'data_cleared') {
                        this.emit('data_cleared');
                    }
                } catch (error) {
                    console.error('WebSocket message parse error:', error);
                }
            };

            this.ws.onclose = () => {
                this.isConnected = false;
                console.log('🔌 WebSocket disconnected. Reconnecting...');
                this.emit('disconnected');
                this.scheduleReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.emit('error', error);
            };
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        if (this.reconnectTimer || !this.enabled) return;

        this.reconnectTimer = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            this.connect();
        }, this.reconnectInterval);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    // Send data to server (with offline queue)
    send(data: any) {
        if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            // Queue for later
            this.syncQueue.push(data);
            console.log('📦 Queued for sync (offline):', data.type);
            this.persistQueue();
        }
    }

    // Flush queued messages
    flushQueue() {
        if (this.syncQueue.length === 0) return;

        console.log(`📤 Flushing ${this.syncQueue.length} queued messages...`);
        while (this.syncQueue.length > 0) {
            if (this.ws?.readyState !== WebSocket.OPEN) {
                console.warn('⚠️ Connection lost while flushing queue');
                break;
            }
            const data = this.syncQueue.shift();
            try {
                this.ws.send(JSON.stringify(data));
            } catch (error) {
                console.error('Failed to send queued message:', error);
                // Put it back at the front
                this.syncQueue.unshift(data);
                break;
            }
        }
        this.persistQueue();
    }

    // Event system
    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    off(event: string, callback: Function) {
        this.listeners.get(event)?.delete(callback);
    }

    emit(event: string, ...args: any[]) {
        this.listeners.get(event)?.forEach(callback => callback(...args));
    }

    // Sync methods
    async syncChat(chat: any) {
        try {
            const response = await fetch('http://localhost:3010/api/sync/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(chat)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Sync failed: ${response.status} ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('❌ Chat sync error:', error);
            console.error('Failed to sync chat:', chat.id);
            // Queue for retry when connection is restored
            this.send({ type: 'sync_chat', data: chat });
            throw error; // Re-throw so caller knows it failed
        }
    }

    async syncSettings(key: string, value: any) {
        try {
            const response = await fetch('http://localhost:3010/api/sync/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Sync failed: ${response.status} ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('❌ Settings sync error:', error);
            console.error('Failed to sync key:', key);
            // Queue for retry when connection is restored
            this.send({ type: 'sync_settings', data: { key, value } });
            throw error; // Re-throw so caller knows it failed
        }
    }

    async getAllChats() {
        try {
            const response = await fetch('http://localhost:3010/api/chats');
            if (!response.ok) throw new Error('Fetch failed');
            return await response.json();
        } catch (error) {
            console.error('Fetch chats error:', error);
            return [];
        }
    }

    async getAllSettings() {
        try {
            const response = await fetch('http://localhost:3010/api/settings');
            if (!response.ok) throw new Error('Fetch failed');
            return await response.json();
        } catch (error) {
            console.error('Fetch settings error:', error);
            return {};
        }
    }

    async exportData() {
        try {
            const response = await fetch('http://localhost:3010/api/export');
            if (!response.ok) throw new Error('Export failed');
            return await response.json();
        } catch (error) {
            console.error('Export error:', error);
            throw error;
        }
    }

    async importData(data: any) {
        try {
            const response = await fetch('http://localhost:3010/api/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Import failed');
            return await response.json();
        } catch (error) {
            console.error('Import error:', error);
            throw error;
        }
    }

    async clearAllData() {
        try {
            const response = await fetch('http://localhost:3010/api/clear', {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Clear failed');
            return await response.json();
        } catch (error) {
            console.error('Clear error:', error);
            throw error;
        }
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            queuedMessages: this.syncQueue.length
        };
    }

    isEnabled() {
        return this.enabled;
    }

    private persistQueue() {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(this.queueStorageKey, JSON.stringify(this.syncQueue));
        } catch (error) {
            console.warn('Failed to persist sync queue:', error);
        }
    }

    private loadQueue() {
        if (typeof window === 'undefined') return;
        try {
            const saved = window.localStorage.getItem(this.queueStorageKey);
            if (saved) {
                this.syncQueue = JSON.parse(saved);
                console.log(`🔁 Restored ${this.syncQueue.length} queued sync ops from storage`);
            }
        } catch (error) {
            console.warn('Failed to load sync queue:', error);
            this.syncQueue = [];
        }
    }
}

export const syncService = new SyncService();

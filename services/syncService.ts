// WebSocket Sync Service for RangerPlex AI
// Handles real-time synchronization between browser and server

class SyncService {
    private ws: WebSocket | null = null;
    private serverUrl = 'ws://localhost:3000';
    private httpBaseUrl = 'http://localhost:3000';
    private reconnectInterval = 5000;
    private maxReconnectInterval = 60000; // Max 1 minute between retries
    private currentReconnectInterval = 5000;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private isConnected = false;
    private serverAvailable = false; // Track if server is reachable
    private lastServerCheck = 0;
    private serverCheckInterval = 30000; // Check server every 30s when offline
    private syncQueue: any[] = [];
    private listeners: Map<string, Set<Function>> = new Map();
    private enabled = true;
    private queueStorageKey = 'rangerplex_sync_queue';
    private connectionAttempts = 0;
    private maxLoggedAttempts = 3; // Only log first 3 connection failures

    constructor() {
        this.loadQueue();
        if (typeof window !== 'undefined') {
            // Check server availability before connecting
            this.checkServerAvailability().then(available => {
                if (available) {
                    this.connect();
                } else {
                    console.log('📴 Sync server not available - running in offline mode');
                    this.scheduleServerCheck();
                }
            });
        } else {
            console.log('📴 Sync service initialized (SSR) - will connect in browser');
        }
    }

    // Check if the server is available before attempting connection
    private async checkServerAvailability(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

            const response = await fetch(`${this.httpBaseUrl}/api/health`, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            this.serverAvailable = response.ok;
            this.lastServerCheck = Date.now();

            if (this.serverAvailable) {
                this.connectionAttempts = 0; // Reset on successful check
                this.currentReconnectInterval = this.reconnectInterval; // Reset backoff
            }

            return this.serverAvailable;
        } catch {
            this.serverAvailable = false;
            this.lastServerCheck = Date.now();
            return false;
        }
    }

    // Schedule periodic server availability checks when offline
    private scheduleServerCheck() {
        if (this.reconnectTimer) return;

        this.reconnectTimer = setTimeout(async () => {
            this.reconnectTimer = null;
            const available = await this.checkServerAvailability();
            if (available) {
                console.log('🔌 Server became available, connecting...');
                this.connect();
            } else {
                // Exponential backoff for server checks
                this.currentReconnectInterval = Math.min(
                    this.currentReconnectInterval * 1.5,
                    this.maxReconnectInterval
                );
                this.scheduleServerCheck();
            }
        }, this.currentReconnectInterval);
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
        if (!this.enabled) return;

        // Don't attempt connection if we know server is unavailable
        if (!this.serverAvailable && this.connectionAttempts > 0) {
            this.scheduleServerCheck();
            return;
        }

        try {
            this.connectionAttempts++;
            this.ws = new WebSocket(this.serverUrl);

            this.ws.onopen = () => {
                this.isConnected = true;
                this.serverAvailable = true;
                this.connectionAttempts = 0;
                this.currentReconnectInterval = this.reconnectInterval; // Reset backoff
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
                this.serverAvailable = false;
                // Only log if we haven't logged too many times
                if (this.connectionAttempts <= this.maxLoggedAttempts) {
                    console.log('🔌 WebSocket disconnected. Will retry when server is available.');
                }
                this.emit('disconnected');
                this.scheduleServerCheck(); // Use server check instead of blind reconnect
            };

            this.ws.onerror = () => {
                // Only log errors for first few attempts to avoid console spam
                if (this.connectionAttempts <= this.maxLoggedAttempts) {
                    console.log('📴 WebSocket connection failed - server may be offline');
                }
                this.serverAvailable = false;
            };
        } catch (error) {
            if (this.connectionAttempts <= this.maxLoggedAttempts) {
                console.log('📴 WebSocket connection error - server may be offline');
            }
            this.serverAvailable = false;
            this.scheduleServerCheck();
        }
    }

    scheduleReconnect() {
        // Deprecated: use scheduleServerCheck instead for smarter reconnection
        this.scheduleServerCheck();
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

    // Check if we should attempt server operations
    private shouldAttemptServerOp(): boolean {
        // If we recently checked and server was unavailable, skip
        if (!this.serverAvailable && (Date.now() - this.lastServerCheck) < this.serverCheckInterval) {
            return false;
        }
        return true;
    }

    // Sync methods
    async syncChat(chat: any) {
        // Skip if server known to be offline
        if (!this.shouldAttemptServerOp()) {
            this.send({ type: 'sync_chat', data: chat }); // Queue silently
            return { queued: true };
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.httpBaseUrl}/api/sync/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(chat),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Sync failed: ${response.status} ${errorText}`);
            }
            this.serverAvailable = true;
            return await response.json();
        } catch (error) {
            // Silently queue - don't spam console
            this.serverAvailable = false;
            this.lastServerCheck = Date.now();
            this.send({ type: 'sync_chat', data: chat });
            return { queued: true };
        }
    }

    async syncSettings(key: string, value: any) {
        // Skip if server known to be offline
        if (!this.shouldAttemptServerOp()) {
            this.send({ type: 'sync_settings', data: { key, value } }); // Queue silently
            return { queued: true };
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.httpBaseUrl}/api/sync/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Sync failed: ${response.status} ${errorText}`);
            }
            this.serverAvailable = true;
            return await response.json();
        } catch (error) {
            // Silently queue - don't spam console
            this.serverAvailable = false;
            this.lastServerCheck = Date.now();
            this.send({ type: 'sync_settings', data: { key, value } });
            return { queued: true };
        }
    }

    async getAllChats() {
        if (!this.shouldAttemptServerOp()) {
            return []; // Return empty, app will use local data
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.httpBaseUrl}/api/chats`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Fetch failed');
            this.serverAvailable = true;
            return await response.json();
        } catch (error) {
            this.serverAvailable = false;
            this.lastServerCheck = Date.now();
            return [];
        }
    }

    async getAllSettings() {
        if (!this.shouldAttemptServerOp()) {
            return {}; // Return empty, app will use local data
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.httpBaseUrl}/api/settings`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Fetch failed');
            this.serverAvailable = true;
            return await response.json();
        } catch (error) {
            this.serverAvailable = false;
            this.lastServerCheck = Date.now();
            return {};
        }
    }

    async exportData() {
        if (!this.serverAvailable) {
            throw new Error('Server not available - cannot export from server');
        }

        try {
            const response = await fetch(`${this.httpBaseUrl}/api/export`);
            if (!response.ok) throw new Error('Export failed');
            return await response.json();
        } catch (error) {
            console.error('Export error:', error);
            throw error;
        }
    }

    async importData(data: any) {
        if (!this.serverAvailable) {
            throw new Error('Server not available - cannot import to server');
        }

        try {
            const response = await fetch(`${this.httpBaseUrl}/api/import`, {
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
        if (!this.serverAvailable) {
            throw new Error('Server not available - cannot clear server data');
        }

        try {
            const response = await fetch(`${this.httpBaseUrl}/api/clear`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Clear failed');
            return await response.json();
        } catch (error) {
            console.error('Clear error:', error);
            throw error;
        }
    }

    // Check if server is currently available
    isServerAvailable(): boolean {
        return this.serverAvailable;
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

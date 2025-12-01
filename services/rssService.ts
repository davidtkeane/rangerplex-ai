// 🎖️ RangerPlex RSS Service (Browser-Compatible)
// Handles RSS feed fetching and management via backend proxy

import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import type {
    RSSFeed,
    RSSItem,
    RSSSettings,
    RSSCategory,
    RSSFeedTest
} from '../types/rss';
import { DEFAULT_RSS_FEEDS, DEFAULT_RSS_SETTINGS } from '../types/rss';

class RSSService {
    private cache: Map<string, { items: RSSItem[]; timestamp: number }>;
    private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
    private readonly DB_NAME = 'rangerplex_rss';
    private readonly FEEDS_STORE = 'feeds';
    private readonly ITEMS_STORE = 'items';
    private readonly SETTINGS_STORE = 'settings';
    private PROXY_URL = 'http://localhost:3000';

    // Track failed feeds to avoid spamming console with same errors
    private failedFeeds: Map<string, number> = new Map();
    private readonly FAILED_FEED_QUIET_PERIOD = 5 * 60 * 1000; // 5 minutes

    // Track if cleanup has been run this session
    private cleanupDone = false;

    constructor() {
        this.cache = new Map();
        this.initializeDatabase();
    }

    /**
     * Update service settings
     */
    public updateSettings(settings: any) {
        if (settings.corsProxyUrl) {
            this.PROXY_URL = settings.corsProxyUrl;
            // Ensure no trailing slash
            if (this.PROXY_URL.endsWith('/')) {
                this.PROXY_URL = this.PROXY_URL.slice(0, -1);
            }
        }
    }

    /**
     * Initialize IndexedDB for RSS data persistence
     */
    private async initializeDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Feeds store
                if (!db.objectStoreNames.contains(this.FEEDS_STORE)) {
                    const feedsStore = db.createObjectStore(this.FEEDS_STORE, { keyPath: 'id' });
                    feedsStore.createIndex('category', 'category', { unique: false });
                    feedsStore.createIndex('enabled', 'enabled', { unique: false });
                }

                // Items store
                if (!db.objectStoreNames.contains(this.ITEMS_STORE)) {
                    const itemsStore = db.createObjectStore(this.ITEMS_STORE, { keyPath: 'id' });
                    itemsStore.createIndex('feedId', 'feedId', { unique: false });
                    itemsStore.createIndex('category', 'category', { unique: false });
                    itemsStore.createIndex('pubDate', 'pubDate', { unique: false });
                }

                // Settings store
                if (!db.objectStoreNames.contains(this.SETTINGS_STORE)) {
                    db.createObjectStore(this.SETTINGS_STORE, { keyPath: 'id' });
                }
            };
        });
    }

    /**
     * Get database connection
     */
    private async getDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Known broken feeds to auto-remove (URLs that no longer work)
    private readonly BROKEN_FEED_URLS = [
        'https://gbhackers.com/feed/',
        'https://www.yourticketstatus.com/GBHackers/feed/',
        'https://www.yourticketstatus.com/rss.xml',
        'https://www.yourticketstatus.com/feed/',
        'https://www.yourticketstatus.com/blog/feed/',
        'https://www.yourticketstatus.com/rss/',
        'https://www.yourticketstatus.com/blog/rss.xml',
        'https://www.yourticketstatus.com/blog/',
        'https://www.yourticketstatus.com/',
        'https://www.yourticketstatus.com/blog/rss/',
        'https://www.yourticketstatus.com/blog/feed',
        'https://www.yourticketstatus.com/rss.xml/',
        'https://www.yourticketstatus.com/rss',
        'https://www.yourticketstatus.com/feed',
        'https://www.yourticketstatus.com/blog/rss',
        'https://www.yourticketstatus.com/blog/feed/',
        'https://www.yourticketstatus.com/blog/rss.xml/',
        'https://www.yourticketstatus.com/blog/rss/',
        'https://www.yourticketstatus.com/blog/feed',
        'https://www.yourticketstatus.com/blog/',
        'https://www.yourticketstatus.com/blog',
        'https://www.yourticketstatus.com/blog/rss',
        'https://www.yourticketstatus.com/blog/rss.xml',
        'https://www.trustwave.com/en-us/resources/blogs/spiderlabs-blog/rss.xml',
        'https://www.kitploit.com/feeds/posts/default',
        'https://www.volexity.com/blog/feed/',
        'https://nakedsecurity.sophos.com/feed/',
        'https://pen-testing.sans.org/blog/feed/',
        'https://www.yourticketstatus.com/hack',
        'https://www.yourticketstatus.com/hack/',
        'https://www.yourticketstatus.com/hack/feed/',
        'https://www.yourticketstatus.com/hack/rss.xml',
        'https://www.yourticketstatus.com/hack/rss/',
        'https://www.yourticketstatus.com/hack/feed',
        'https://www.yourticketstatus.com/hack/rss',
        'https://www.yourticketstatus.com/hack/rss.xml/',
        'https://www.yourticketstatus.com/hack/feed/',
        'https://www.hackingarticles.in/feed/',
        'https://packetstormsecurity.com/feeds/files/',
    ];

    // Known broken feed names to auto-remove
    private readonly BROKEN_FEED_NAMES = [
        'GBHackers on Security',
        'Trustwave SpiderLabs',
        'KitPloit',
        'Volexity',
        'Sophos Naked Security',
        'SANS Penetration Testing',
        'Hacking Articles',
        'Packet Storm',
    ];

    /**
     * Initialize default feeds on first run
     */
    async initializeDefaultFeeds(): Promise<void> {
        const feeds = await this.getAllFeeds();
        if (feeds.length === 0) {
            console.log('🎖️ Initializing default RSS feeds...');
            for (const feedData of DEFAULT_RSS_FEEDS) {
                await this.addFeed(feedData);
            }
            console.log(`✅ Initialized ${DEFAULT_RSS_FEEDS.length} default feeds`);
        }
    }

    /**
     * Remove known broken feeds from IndexedDB
     * This runs on startup to clean up old/broken feeds
     */
    async cleanupBrokenFeeds(): Promise<number> {
        const feeds = await this.getAllFeeds();
        let removedCount = 0;

        for (const feed of feeds) {
            const isBrokenUrl = this.BROKEN_FEED_URLS.some(url =>
                feed.url.toLowerCase().includes(url.toLowerCase()) ||
                url.toLowerCase().includes(feed.url.toLowerCase())
            );
            const isBrokenName = this.BROKEN_FEED_NAMES.some(name =>
                feed.name.toLowerCase() === name.toLowerCase()
            );

            if (isBrokenUrl || isBrokenName) {
                try {
                    await this.removeFeed(feed.id);
                    console.log(`🗑️ Removed broken feed: ${feed.name}`);
                    removedCount++;
                } catch (error) {
                    console.warn(`Failed to remove broken feed: ${feed.name}`, error);
                }
            }
        }

        if (removedCount > 0) {
            console.log(`📡 RSS Cleanup: Removed ${removedCount} broken feeds`);
        }

        return removedCount;
    }

    /**
     * Add a new RSS feed
     */
    async addFeed(feedData: Omit<RSSFeed, 'id' | 'lastFetched' | 'lastError' | 'itemCount'>): Promise<RSSFeed> {
        const feed: RSSFeed = {
            ...feedData,
            id: this.generateFeedId(feedData.url),
            lastFetched: null,
            lastError: null,
            itemCount: 0,
        };

        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.FEEDS_STORE], 'readwrite');
            const store = transaction.objectStore(this.FEEDS_STORE);
            const request = store.add(feed);

            request.onsuccess = () => resolve(feed);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Remove an RSS feed
     */
    async removeFeed(feedId: string): Promise<void> {
        const db = await this.getDB();

        // Remove feed
        await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([this.FEEDS_STORE], 'readwrite');
            const store = transaction.objectStore(this.FEEDS_STORE);
            const request = store.delete(feedId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        // Remove associated items
        await this.clearFeedItems(feedId);
    }

    /**
     * Get all RSS feeds
     */
    async getAllFeeds(): Promise<RSSFeed[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.FEEDS_STORE], 'readonly');
            const store = transaction.objectStore(this.FEEDS_STORE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get feeds by category
     */
    async getFeedsByCategory(category: RSSCategory): Promise<RSSFeed[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.FEEDS_STORE], 'readonly');
            const store = transaction.objectStore(this.FEEDS_STORE);
            const index = store.index('category');
            const request = index.getAll(category);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update feed enabled status
     */
    async toggleFeed(feedId: string, enabled: boolean): Promise<void> {
        const db = await this.getDB();
        const feed = await this.getFeed(feedId);
        if (!feed) throw new Error('Feed not found');

        feed.enabled = enabled;

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.FEEDS_STORE], 'readwrite');
            const store = transaction.objectStore(this.FEEDS_STORE);
            const request = store.put(feed);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get a single feed
     */
    async getFeed(feedId: string): Promise<RSSFeed | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.FEEDS_STORE], 'readonly');
            const store = transaction.objectStore(this.FEEDS_STORE);
            const request = store.get(feedId);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Fetch and parse RSS feed via backend
     */
    async fetchFeed(feed: RSSFeed): Promise<RSSItem[]> {
        try {
            // Check cache first
            const cached = this.cache.get(feed.id);
            if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
                return cached.items;
            }

            // Fetch via backend RSS parser
            const response = await fetch(`${this.PROXY_URL}/api/rss/parse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: feed.url }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to parse feed');
            }

            // Convert to RSSItem format
            const items: RSSItem[] = data.items.map((item: any) => ({
                id: this.generateItemId(feed.id, item.link || item.guid),
                feedId: feed.id,
                feedName: feed.name,
                title: this.sanitizeText(item.title || 'Untitled'),
                link: item.link || '',
                pubDate: new Date(item.pubDate || Date.now()),
                description: this.sanitizeText(item.description || ''),
                category: feed.category,
                read: false,
                content: this.sanitizeHTML(item.content || item.description || ''),
            }));

            // Update cache
            this.cache.set(feed.id, { items, timestamp: Date.now() });

            // Update feed metadata
            await this.updateFeedMetadata(feed.id, items.length, null);

            // Save items to database
            await this.saveItems(items);

            return items;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Only log error if we haven't logged it recently (prevent console spam)
            const lastFailed = this.failedFeeds.get(feed.id);
            const now = Date.now();
            if (!lastFailed || (now - lastFailed) > this.FAILED_FEED_QUIET_PERIOD) {
                console.warn(`⚠️ Feed temporarily unavailable: ${feed.name}`);
                this.failedFeeds.set(feed.id, now);
            }

            // Update feed with error
            await this.updateFeedMetadata(feed.id, 0, errorMessage);

            throw error;
        }
    }

    /**
     * Fetch all enabled feeds
     */
    async fetchAllFeeds(): Promise<RSSItem[]> {
        // Auto-cleanup broken feeds on first fetch (once per session)
        if (!this.cleanupDone) {
            await this.cleanupBrokenFeeds();
            this.cleanupDone = true;
        }

        let feeds = await this.getAllFeeds();

        // Auto-initialize default feeds if none exist
        if (feeds.length === 0) {
            console.log('📡 No feeds found - auto-initializing defaults...');
            await this.initializeDefaultFeeds();
            feeds = await this.getAllFeeds();
        }

        const enabledFeeds = feeds.filter(f => f.enabled);

        console.log(`📡 Fetching ${enabledFeeds.length} enabled RSS feeds...`);

        const results = await Promise.allSettled(
            enabledFeeds.map(feed => this.fetchFeed(feed))
        );

        const allItems: RSSItem[] = [];
        let failedCount = 0;
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                allItems.push(...result.value);
                // Clear from failed feeds if it succeeded
                this.failedFeeds.delete(enabledFeeds[index].id);
            } else {
                failedCount++;
                // Error already logged in fetchFeed, no need to log again
            }
        });

        // Log summary instead of individual errors
        if (failedCount > 0) {
            console.log(`📡 RSS: ${results.length - failedCount}/${results.length} feeds loaded (${failedCount} temporarily unavailable)`);
        }

        // Sort by publication date (newest first)
        allItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

        return allItems;
    }

    /**
     * Get all items from database
     */
    async getAllItems(limit?: number): Promise<RSSItem[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.ITEMS_STORE], 'readonly');
            const store = transaction.objectStore(this.ITEMS_STORE);
            const index = store.index('pubDate');
            const request = index.openCursor(null, 'prev'); // Newest first

            const items: RSSItem[] = [];
            let count = 0;

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor && (!limit || count < limit)) {
                    items.push(cursor.value);
                    count++;
                    cursor.continue();
                } else {
                    resolve(items);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Test an RSS feed URL via backend
     */
    async testFeed(url: string): Promise<RSSFeedTest> {
        try {
            const response = await fetch(`${this.PROXY_URL}/api/rss/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to test feed',
            };
        }
    }

    /**
     * Save RSS settings
     */
    async saveSettings(settings: RSSSettings): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.SETTINGS_STORE], 'readwrite');
            const store = transaction.objectStore(this.SETTINGS_STORE);
            const request = store.put({ ...settings, id: 'rss_settings' });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Load RSS settings
     */
    async loadSettings(): Promise<RSSSettings> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.SETTINGS_STORE], 'readonly');
            const store = transaction.objectStore(this.SETTINGS_STORE);
            const request = store.get('rss_settings');

            request.onsuccess = () => {
                const savedSettings = request.result;
                console.log('📡 RSS loadSettings: savedSettings from IndexedDB:', savedSettings);

                if (!savedSettings) {
                    console.log('📡 RSS loadSettings: No saved settings, using defaults');
                    resolve(DEFAULT_RSS_SETTINGS);
                    return;
                }
                // Merge saved settings with defaults to ensure all fields exist
                // This fixes issues where old settings don't have enabledCategories
                const merged: RSSSettings = {
                    ...DEFAULT_RSS_SETTINGS,
                    ...savedSettings,
                    // Ensure enabledCategories is never empty (use defaults if empty/missing)
                    enabledCategories: (savedSettings.enabledCategories && savedSettings.enabledCategories.length > 0)
                        ? savedSettings.enabledCategories
                        : DEFAULT_RSS_SETTINGS.enabledCategories,
                };
                console.log('📡 RSS loadSettings: merged settings:', {
                    enabled: merged.enabled,
                    enabledCategories: merged.enabledCategories,
                    displayMode: merged.displayMode,
                    showNotesInTicker: merged.showNotesInTicker
                });
                resolve(merged);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Mark item as read
     */
    async markAsRead(itemId: string): Promise<void> {
        const db = await this.getDB();
        const item = await this.getItem(itemId);
        if (!item) return;

        item.read = true;

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.ITEMS_STORE], 'readwrite');
            const store = transaction.objectStore(this.ITEMS_STORE);
            const request = store.put(item);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all items for a feed
     */
    private async clearFeedItems(feedId: string): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.ITEMS_STORE], 'readwrite');
            const store = transaction.objectStore(this.ITEMS_STORE);
            const index = store.index('feedId');
            const request = index.openCursor(IDBKeyRange.only(feedId));

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Save items to database
     */
    private async saveItems(items: RSSItem[]): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.ITEMS_STORE], 'readwrite');
            const store = transaction.objectStore(this.ITEMS_STORE);

            items.forEach(item => {
                store.put(item);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * Get a single item
     */
    private async getItem(itemId: string): Promise<RSSItem | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.ITEMS_STORE], 'readonly');
            const store = transaction.objectStore(this.ITEMS_STORE);
            const request = store.get(itemId);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update feed metadata
     */
    private async updateFeedMetadata(feedId: string, itemCount: number, error: string | null): Promise<void> {
        const db = await this.getDB();
        const feed = await this.getFeed(feedId);
        if (!feed) return;

        feed.lastFetched = Date.now();
        feed.itemCount = itemCount;
        feed.lastError = error;

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.FEEDS_STORE], 'readwrite');
            const store = transaction.objectStore(this.FEEDS_STORE);
            const request = store.put(feed);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generate feed ID from URL
     */
    private generateFeedId(url: string): string {
        return `feed_${this.hashCode(url)}`;
    }

    /**
     * Generate item ID
     */
    private generateItemId(feedId: string, link: string): string {
        return `item_${feedId}_${this.hashCode(link)}`;
    }

    /**
     * Simple hash function
     */
    private hashCode(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Sanitize HTML content
     */
    private sanitizeHTML(html: string): string {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
            ALLOWED_ATTR: ['href', 'target', 'rel'],
        });
    }

    /**
     * Sanitize plain text
     */
    private sanitizeText(text: string): string {
        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Reset RSS settings to defaults
     */
    async resetSettings(): Promise<void> {
        await this.saveSettings(DEFAULT_RSS_SETTINGS);
        this.cache.clear();
        this.failedFeeds.clear();
        console.log('📡 RSS settings reset to defaults');
    }

    /**
     * Clear all RSS cache (in-memory)
     */
    clearCache(): void {
        this.cache.clear();
        this.failedFeeds.clear();
        console.log('📡 RSS cache cleared');
    }

    /**
     * Clear all RSS data from IndexedDB (full reset)
     */
    async clearAllData(): Promise<void> {
        const db = await this.getDB();

        // Clear all stores
        await Promise.all([
            new Promise<void>((resolve, reject) => {
                const tx = db.transaction([this.FEEDS_STORE], 'readwrite');
                tx.objectStore(this.FEEDS_STORE).clear();
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            }),
            new Promise<void>((resolve, reject) => {
                const tx = db.transaction([this.ITEMS_STORE], 'readwrite');
                tx.objectStore(this.ITEMS_STORE).clear();
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            }),
            new Promise<void>((resolve, reject) => {
                const tx = db.transaction([this.SETTINGS_STORE], 'readwrite');
                tx.objectStore(this.SETTINGS_STORE).clear();
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            }),
        ]);

        // Clear memory cache
        this.cache.clear();
        this.failedFeeds.clear();

        console.log('📡 All RSS data cleared from IndexedDB');
    }

    /**
     * Get IndexedDB statistics
     */
    async getStats(): Promise<{
        feedCount: number;
        itemCount: number;
        enabledFeedCount: number;
        cacheSize: number;
        failedFeedCount: number;
        dbSizeEstimate: string;
    }> {
        const db = await this.getDB();

        const feedCount = await new Promise<number>((resolve, reject) => {
            const tx = db.transaction([this.FEEDS_STORE], 'readonly');
            const req = tx.objectStore(this.FEEDS_STORE).count();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        const itemCount = await new Promise<number>((resolve, reject) => {
            const tx = db.transaction([this.ITEMS_STORE], 'readonly');
            const req = tx.objectStore(this.ITEMS_STORE).count();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        const feeds = await this.getAllFeeds();
        const enabledFeedCount = feeds.filter(f => f.enabled).length;

        // Estimate storage using Storage API if available
        let dbSizeEstimate = 'Unknown';
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            if (estimate.usage) {
                dbSizeEstimate = this.formatBytes(estimate.usage);
            }
        }

        return {
            feedCount,
            itemCount,
            enabledFeedCount,
            cacheSize: this.cache.size,
            failedFeedCount: this.failedFeeds.size,
            dbSizeEstimate,
        };
    }

    /**
     * Format bytes to human readable
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Refresh all feeds (force re-fetch)
     */
    async refreshAllFeeds(): Promise<{ success: number; failed: number }> {
        // Clear cache first
        this.cache.clear();
        this.failedFeeds.clear();

        // Re-fetch all feeds
        const feeds = await this.getAllFeeds();
        const enabledFeeds = feeds.filter(f => f.enabled);

        let success = 0;
        let failed = 0;

        for (const feed of enabledFeeds) {
            try {
                await this.fetchFeed(feed);
                success++;
            } catch {
                failed++;
            }
        }

        console.log(`📡 RSS refresh complete: ${success} success, ${failed} failed`);
        return { success, failed };
    }
}

// Export singleton instance
export const rssService = new RSSService();

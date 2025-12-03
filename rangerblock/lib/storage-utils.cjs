#!/usr/bin/env node
/**
 * RANGERBLOCK STORAGE UTILITIES v1.0.0
 * =====================================
 * Cross-platform storage management for RangerBlock identity and settings
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 *
 * Storage Locations:
 * - ~/.rangerblock/           - Main shared storage (all apps)
 * - ~/.rangerblock/identity/  - Identity files
 * - ~/.rangerblock/keys/      - RSA keys
 * - ~/.rangerblock/apps/      - Per-app settings
 * - ~/.rangerblock/sync/      - Sync state
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE PATHS
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_PATHS = {
    // Base directory
    BASE: path.join(os.homedir(), '.rangerblock'),

    // Sub-directories
    IDENTITY: 'identity',
    KEYS: 'keys',
    APPS: 'apps',
    SYNC: 'sync',
    SECURITY: 'security',
    SESSIONS: 'sessions',
    CONFIG: 'config',

    // Known apps
    APPS_CHAT_LITE: 'ranger-chat-lite',
    APPS_RANGERPLEX: 'rangerplex',
    APPS_JUST_CHAT: 'just-chat'
};

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE UTILS CLASS
// ═══════════════════════════════════════════════════════════════════════════

class StorageUtils {
    constructor(basePath = STORAGE_PATHS.BASE) {
        this.basePath = basePath;
        this._initialized = false;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Initialize the storage directory structure
     */
    init() {
        if (this._initialized) return true;

        try {
            // Create base directory
            this._ensureDir(this.basePath);

            // Create sub-directories
            const dirs = [
                STORAGE_PATHS.IDENTITY,
                STORAGE_PATHS.KEYS,
                STORAGE_PATHS.APPS,
                STORAGE_PATHS.SYNC,
                STORAGE_PATHS.SECURITY,
                STORAGE_PATHS.SESSIONS,
                STORAGE_PATHS.CONFIG,
                path.join(STORAGE_PATHS.APPS, STORAGE_PATHS.APPS_CHAT_LITE),
                path.join(STORAGE_PATHS.APPS, STORAGE_PATHS.APPS_RANGERPLEX),
                path.join(STORAGE_PATHS.APPS, STORAGE_PATHS.APPS_JUST_CHAT)
            ];

            for (const dir of dirs) {
                this._ensureDir(this.getPath(dir));
            }

            this._initialized = true;
            return true;
        } catch (e) {
            console.error('Failed to initialize storage:', e.message);
            return false;
        }
    }

    /**
     * Ensure a directory exists
     */
    _ensureDir(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PATH HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get full path for a storage location
     */
    getPath(...segments) {
        return path.join(this.basePath, ...segments);
    }

    /**
     * Get identity directory path
     */
    getIdentityPath() {
        return this.getPath(STORAGE_PATHS.IDENTITY);
    }

    /**
     * Get keys directory path
     */
    getKeysPath() {
        return this.getPath(STORAGE_PATHS.KEYS);
    }

    /**
     * Get app-specific storage path
     */
    getAppPath(appName) {
        return this.getPath(STORAGE_PATHS.APPS, appName);
    }

    /**
     * Get sync directory path
     */
    getSyncPath() {
        return this.getPath(STORAGE_PATHS.SYNC);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FILE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Check if a file exists
     */
    exists(filePath) {
        return fs.existsSync(filePath);
    }

    /**
     * Read a JSON file
     */
    readJSON(filePath) {
        try {
            if (!this.exists(filePath)) {
                return null;
            }
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            console.error(`Failed to read ${filePath}:`, e.message);
            return null;
        }
    }

    /**
     * Write a JSON file
     */
    writeJSON(filePath, data, pretty = true) {
        try {
            const dir = path.dirname(filePath);
            this._ensureDir(dir);

            const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
            fs.writeFileSync(filePath, content, { mode: 0o600 });
            return true;
        } catch (e) {
            console.error(`Failed to write ${filePath}:`, e.message);
            return false;
        }
    }

    /**
     * Delete a file
     */
    delete(filePath) {
        try {
            if (this.exists(filePath)) {
                fs.unlinkSync(filePath);
            }
            return true;
        } catch (e) {
            console.error(`Failed to delete ${filePath}:`, e.message);
            return false;
        }
    }

    /**
     * Read a text file
     */
    readText(filePath) {
        try {
            if (!this.exists(filePath)) {
                return null;
            }
            return fs.readFileSync(filePath, 'utf8');
        } catch (e) {
            console.error(`Failed to read ${filePath}:`, e.message);
            return null;
        }
    }

    /**
     * Write a text file
     */
    writeText(filePath, content) {
        try {
            const dir = path.dirname(filePath);
            this._ensureDir(dir);

            fs.writeFileSync(filePath, content, { mode: 0o600 });
            return true;
        } catch (e) {
            console.error(`Failed to write ${filePath}:`, e.message);
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // IDENTITY STORAGE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Save master identity
     */
    saveMasterIdentity(identity) {
        const filePath = path.join(this.getIdentityPath(), 'master_identity.json');
        return this.writeJSON(filePath, identity);
    }

    /**
     * Load master identity
     */
    loadMasterIdentity() {
        const filePath = path.join(this.getIdentityPath(), 'master_identity.json');
        return this.readJSON(filePath);
    }

    /**
     * Check if master identity exists
     */
    hasMasterIdentity() {
        const filePath = path.join(this.getIdentityPath(), 'master_identity.json');
        return this.exists(filePath);
    }

    /**
     * Save hardware fingerprint
     */
    saveHardwareFingerprint(fingerprint) {
        const filePath = path.join(this.getIdentityPath(), 'hardware_fingerprint.json');
        return this.writeJSON(filePath, {
            fingerprint,
            recordedAt: new Date().toISOString(),
            platform: os.platform(),
            hostname: os.hostname()
        });
    }

    /**
     * Load hardware fingerprint
     */
    loadHardwareFingerprint() {
        const filePath = path.join(this.getIdentityPath(), 'hardware_fingerprint.json');
        return this.readJSON(filePath);
    }

    /**
     * Save chain registration proof
     */
    saveChainRegistration(registration) {
        const filePath = path.join(this.getIdentityPath(), 'chain_registration.json');
        return this.writeJSON(filePath, registration);
    }

    /**
     * Load chain registration proof
     */
    loadChainRegistration() {
        const filePath = path.join(this.getIdentityPath(), 'chain_registration.json');
        return this.readJSON(filePath);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // APP-SPECIFIC STORAGE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Save app settings
     */
    saveAppSettings(appName, settings) {
        const filePath = path.join(this.getAppPath(appName), 'settings.json');
        return this.writeJSON(filePath, settings);
    }

    /**
     * Load app settings
     */
    loadAppSettings(appName) {
        const filePath = path.join(this.getAppPath(appName), 'settings.json');
        return this.readJSON(filePath);
    }

    /**
     * Save app-specific data
     */
    saveAppData(appName, fileName, data) {
        const filePath = path.join(this.getAppPath(appName), fileName);
        return this.writeJSON(filePath, data);
    }

    /**
     * Load app-specific data
     */
    loadAppData(appName, fileName) {
        const filePath = path.join(this.getAppPath(appName), fileName);
        return this.readJSON(filePath);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SYNC STATE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Save sync state
     */
    saveSyncState(state) {
        const filePath = path.join(this.getSyncPath(), 'sync_state.json');
        return this.writeJSON(filePath, {
            ...state,
            lastUpdated: new Date().toISOString()
        });
    }

    /**
     * Load sync state
     */
    loadSyncState() {
        const filePath = path.join(this.getSyncPath(), 'sync_state.json');
        return this.readJSON(filePath);
    }

    /**
     * Log sync conflict
     */
    logSyncConflict(conflict) {
        const filePath = path.join(this.getSyncPath(), 'conflict_log.json');
        const existing = this.readJSON(filePath) || { conflicts: [] };
        existing.conflicts.push({
            ...conflict,
            timestamp: new Date().toISOString()
        });
        return this.writeJSON(filePath, existing);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECURITY AUDIT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Log security event
     */
    logSecurityEvent(event) {
        const filePath = path.join(this.getPath(STORAGE_PATHS.SECURITY), 'audit_log.json');
        const existing = this.readJSON(filePath) || { events: [] };

        existing.events.push({
            ...event,
            timestamp: new Date().toISOString()
        });

        // Keep only last 1000 events
        if (existing.events.length > 1000) {
            existing.events = existing.events.slice(-1000);
        }

        return this.writeJSON(filePath, existing);
    }

    /**
     * Get security events
     */
    getSecurityEvents(limit = 100) {
        const filePath = path.join(this.getPath(STORAGE_PATHS.SECURITY), 'audit_log.json');
        const data = this.readJSON(filePath);
        if (!data || !data.events) return [];
        return data.events.slice(-limit);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // APP DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Detect installed RangerBlock apps
     */
    detectInstalledApps() {
        const apps = [];
        const appsDir = this.getPath(STORAGE_PATHS.APPS);

        // Check for ranger-chat-lite
        const chatLitePath = path.join(appsDir, STORAGE_PATHS.APPS_CHAT_LITE, 'settings.json');
        if (this.exists(chatLitePath)) {
            apps.push({
                name: 'ranger-chat-lite',
                path: path.dirname(chatLitePath),
                hasSettings: true
            });
        }

        // Check for RangerPlex
        const rangerplexPath = path.join(appsDir, STORAGE_PATHS.APPS_RANGERPLEX, 'settings.json');
        if (this.exists(rangerplexPath)) {
            apps.push({
                name: 'rangerplex',
                path: path.dirname(rangerplexPath),
                hasSettings: true
            });
        }

        // Check for just-chat
        const justChatPath = path.join(appsDir, STORAGE_PATHS.APPS_JUST_CHAT, 'settings.json');
        if (this.exists(justChatPath)) {
            apps.push({
                name: 'just-chat',
                path: path.dirname(justChatPath),
                hasSettings: true
            });
        }

        // Also check legacy RangerPlex locations
        const legacyPaths = [
            path.join(os.homedir(), '.rangerplex'),
            path.join(os.homedir(), 'Library', 'Application Support', 'RangerPlex')
        ];

        for (const legacyPath of legacyPaths) {
            if (fs.existsSync(legacyPath)) {
                apps.push({
                    name: 'rangerplex-legacy',
                    path: legacyPath,
                    isLegacy: true
                });
            }
        }

        return apps;
    }

    /**
     * Check if RangerPlex is installed
     */
    isRangerPlexInstalled() {
        const apps = this.detectInstalledApps();
        return apps.some(app => app.name.includes('rangerplex'));
    }

    /**
     * Check if Chat Lite is installed
     */
    isChatLiteInstalled() {
        const apps = this.detectInstalledApps();
        return apps.some(app => app.name === 'ranger-chat-lite');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Clear all data (DANGEROUS - for testing only)
     */
    clearAll() {
        try {
            if (fs.existsSync(this.basePath)) {
                fs.rmSync(this.basePath, { recursive: true });
            }
            this._initialized = false;
            return true;
        } catch (e) {
            console.error('Failed to clear storage:', e.message);
            return false;
        }
    }

    /**
     * Get storage statistics
     */
    getStats() {
        const stats = {
            basePath: this.basePath,
            exists: fs.existsSync(this.basePath),
            hasMasterIdentity: this.hasMasterIdentity(),
            installedApps: this.detectInstalledApps(),
            syncState: this.loadSyncState()
        };

        // Calculate total size
        if (stats.exists) {
            stats.totalSize = this._getDirSize(this.basePath);
        }

        return stats;
    }

    /**
     * Get directory size in bytes
     */
    _getDirSize(dirPath) {
        let size = 0;
        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const entryPath = path.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    size += this._getDirSize(entryPath);
                } else {
                    size += fs.statSync(entryPath).size;
                }
            }
        } catch (e) {
            // Ignore errors
        }
        return size;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

const storage = new StorageUtils();

module.exports = {
    StorageUtils,
    storage,
    STORAGE_PATHS,

    // Initialization
    init: () => storage.init(),

    // Paths
    getPath: (...args) => storage.getPath(...args),
    getIdentityPath: () => storage.getIdentityPath(),
    getKeysPath: () => storage.getKeysPath(),
    getAppPath: (app) => storage.getAppPath(app),

    // File operations
    exists: (p) => storage.exists(p),
    readJSON: (p) => storage.readJSON(p),
    writeJSON: (p, d) => storage.writeJSON(p, d),
    delete: (p) => storage.delete(p),

    // Identity
    saveMasterIdentity: (i) => storage.saveMasterIdentity(i),
    loadMasterIdentity: () => storage.loadMasterIdentity(),
    hasMasterIdentity: () => storage.hasMasterIdentity(),
    saveHardwareFingerprint: (f) => storage.saveHardwareFingerprint(f),
    loadHardwareFingerprint: () => storage.loadHardwareFingerprint(),

    // App detection
    detectInstalledApps: () => storage.detectInstalledApps(),
    isRangerPlexInstalled: () => storage.isRangerPlexInstalled(),
    isChatLiteInstalled: () => storage.isChatLiteInstalled(),

    // Stats
    getStats: () => storage.getStats()
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI TEST
// ═══════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    console.log('\n📁 RANGERBLOCK STORAGE UTILITIES TEST\n');
    console.log('======================================');

    // Initialize storage
    console.log('\n1. Initializing storage...');
    const result = storage.init();
    console.log(`   Result: ${result ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Base path: ${storage.basePath}`);

    // Check paths
    console.log('\n2. Storage paths:');
    console.log(`   Identity: ${storage.getIdentityPath()}`);
    console.log(`   Keys:     ${storage.getKeysPath()}`);
    console.log(`   Chat Lite: ${storage.getAppPath('ranger-chat-lite')}`);
    console.log(`   RangerPlex: ${storage.getAppPath('rangerplex')}`);

    // Check for existing identity
    console.log('\n3. Checking for existing identity...');
    console.log(`   Has master identity: ${storage.hasMasterIdentity() ? 'YES' : 'NO'}`);

    // Detect installed apps
    console.log('\n4. Detecting installed apps...');
    const apps = storage.detectInstalledApps();
    if (apps.length > 0) {
        for (const app of apps) {
            console.log(`   - ${app.name} at ${app.path}`);
        }
    } else {
        console.log('   No apps detected yet');
    }

    // Get stats
    console.log('\n5. Storage statistics:');
    const stats = storage.getStats();
    console.log(`   Exists: ${stats.exists}`);
    console.log(`   Total size: ${stats.totalSize || 0} bytes`);

    console.log('\n======================================');
    console.log('Storage test completed!\n');
}

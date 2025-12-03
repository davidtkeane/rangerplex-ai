#!/usr/bin/env node
/**
 * RANGERBLOCK SYNC MANAGER v1.0.0
 * ================================
 * Handles synchronization between RangerBlock apps
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 *
 * Features:
 * - Detect installed RangerBlock apps
 * - Sync identity across apps (Chat Lite ↔ RangerPlex)
 * - Migrate settings when upgrading apps
 * - Handle sync conflicts
 * - Background sync with file watching
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { storage, STORAGE_PATHS } = require('./storage-utils.cjs');

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = '1.0.0';

// App identifiers
const APPS = {
    CHAT_LITE: 'ranger-chat-lite',
    RANGERPLEX: 'rangerplex',
    JUST_CHAT: 'just-chat',
    VOICE_CHAT: 'voice-chat'
};

// Legacy app locations (before unified storage)
const LEGACY_PATHS = {
    // Electron app data locations
    CHAT_LITE_MAC: path.join(os.homedir(), 'Library', 'Application Support', 'ranger-chat-lite'),
    CHAT_LITE_WIN: path.join(process.env.APPDATA || '', 'ranger-chat-lite'),
    CHAT_LITE_LINUX: path.join(os.homedir(), '.config', 'ranger-chat-lite'),

    // RangerPlex locations
    RANGERPLEX_MAC: path.join(os.homedir(), 'Library', 'Application Support', 'RangerPlex'),
    RANGERPLEX_WIN: path.join(process.env.APPDATA || '', 'RangerPlex'),
    RANGERPLEX_LINUX: path.join(os.homedir(), '.config', 'RangerPlex'),
    RANGERPLEX_HOME: path.join(os.homedir(), '.rangerplex'),

    // Personal folder (created by Chat Lite 1.2.0+)
    PERSONAL: path.join(os.homedir(), '.personal')
};

// Sync priorities (higher = more authoritative)
const SYNC_PRIORITY = {
    [APPS.RANGERPLEX]: 100,    // Full app takes priority
    [APPS.CHAT_LITE]: 50,      // Lite app
    [APPS.JUST_CHAT]: 30,      // Terminal chat
    [APPS.VOICE_CHAT]: 30      // Terminal voice
};

// ═══════════════════════════════════════════════════════════════════════════
// SYNC MANAGER CLASS
// ═══════════════════════════════════════════════════════════════════════════

class SyncManager {
    constructor() {
        this.version = VERSION;
        this._watchers = [];
        this._lastSync = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // APP DETECTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Detect all installed RangerBlock apps
     * @returns {Array} List of detected apps with their locations
     */
    detectApps() {
        const detected = [];
        const platform = os.platform();

        // Check unified storage first
        const unifiedApps = storage.detectInstalledApps();
        for (const app of unifiedApps) {
            detected.push({
                ...app,
                storage: 'unified',
                priority: SYNC_PRIORITY[app.name] || 0
            });
        }

        // Check legacy locations
        const legacyChecks = this._getLegacyPaths(platform);
        for (const check of legacyChecks) {
            if (fs.existsSync(check.path)) {
                // Check if it has identity data
                const identityPath = path.join(check.path, 'identity', 'user_identity.json');
                const hasIdentity = fs.existsSync(identityPath);

                detected.push({
                    name: check.app,
                    path: check.path,
                    storage: 'legacy',
                    hasIdentity,
                    priority: SYNC_PRIORITY[check.app] || 0
                });
            }
        }

        // Check .personal folder (Chat Lite 1.2.0+ compatibility)
        if (fs.existsSync(LEGACY_PATHS.PERSONAL)) {
            const nodeIdentityPath = path.join(LEGACY_PATHS.PERSONAL, 'node_identity.json');
            if (fs.existsSync(nodeIdentityPath)) {
                detected.push({
                    name: 'personal-folder',
                    path: LEGACY_PATHS.PERSONAL,
                    storage: 'legacy',
                    hasIdentity: true,
                    priority: 10  // Low priority, just for migration
                });
            }
        }

        // Sort by priority (highest first)
        detected.sort((a, b) => b.priority - a.priority);

        return detected;
    }

    /**
     * Get legacy paths for current platform
     */
    _getLegacyPaths(platform) {
        const checks = [];

        switch (platform) {
            case 'darwin':
                checks.push({ app: APPS.CHAT_LITE, path: LEGACY_PATHS.CHAT_LITE_MAC });
                checks.push({ app: APPS.RANGERPLEX, path: LEGACY_PATHS.RANGERPLEX_MAC });
                checks.push({ app: APPS.RANGERPLEX, path: LEGACY_PATHS.RANGERPLEX_HOME });
                break;
            case 'win32':
                checks.push({ app: APPS.CHAT_LITE, path: LEGACY_PATHS.CHAT_LITE_WIN });
                checks.push({ app: APPS.RANGERPLEX, path: LEGACY_PATHS.RANGERPLEX_WIN });
                break;
            case 'linux':
                checks.push({ app: APPS.CHAT_LITE, path: LEGACY_PATHS.CHAT_LITE_LINUX });
                checks.push({ app: APPS.RANGERPLEX, path: LEGACY_PATHS.RANGERPLEX_LINUX });
                checks.push({ app: APPS.RANGERPLEX, path: LEGACY_PATHS.RANGERPLEX_HOME });
                break;
        }

        return checks;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // IDENTITY SYNC
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Sync identity across all detected apps
     * Uses highest priority app as the source of truth
     */
    async syncIdentity() {
        const apps = this.detectApps();
        const results = {
            success: false,
            sourceApp: null,
            targetApps: [],
            conflicts: [],
            errors: []
        };

        if (apps.length === 0) {
            results.errors.push('No RangerBlock apps detected');
            return results;
        }

        // Find the best source (highest priority with identity)
        const source = apps.find(app => app.hasIdentity || app.hasSettings);

        if (!source) {
            // No existing identity - nothing to sync
            results.errors.push('No existing identity found to sync');
            return results;
        }

        results.sourceApp = source.name;

        // Load source identity
        let sourceIdentity;
        try {
            sourceIdentity = await this._loadIdentityFromApp(source);
            if (!sourceIdentity) {
                results.errors.push(`Failed to load identity from ${source.name}`);
                return results;
            }
        } catch (e) {
            results.errors.push(`Error loading identity from ${source.name}: ${e.message}`);
            return results;
        }

        // Sync to unified storage (the new standard location)
        const unifiedIdentity = storage.loadMasterIdentity();

        if (!unifiedIdentity) {
            // No unified identity yet - migrate from source
            storage.saveMasterIdentity(sourceIdentity);
            results.targetApps.push('unified-storage');
        } else {
            // Check for conflicts
            if (unifiedIdentity.userId !== sourceIdentity.userId) {
                results.conflicts.push({
                    type: 'identity_mismatch',
                    unified: unifiedIdentity.userId,
                    source: sourceIdentity.userId,
                    resolution: 'kept_unified'  // Unified storage takes priority
                });
            }
        }

        // Sync to other apps
        for (const app of apps) {
            if (app.name === source.name) continue;
            if (app.storage === 'unified') continue;

            try {
                await this._syncIdentityToApp(app, sourceIdentity);
                results.targetApps.push(app.name);
            } catch (e) {
                results.errors.push(`Failed to sync to ${app.name}: ${e.message}`);
            }
        }

        // Update sync state
        storage.saveSyncState({
            lastIdentitySync: new Date().toISOString(),
            sourceApp: source.name,
            targetApps: results.targetApps,
            conflicts: results.conflicts
        });

        results.success = results.errors.length === 0;
        this._lastSync = new Date();

        return results;
    }

    /**
     * Load identity from a specific app
     */
    async _loadIdentityFromApp(app) {
        if (app.storage === 'unified') {
            return storage.loadMasterIdentity();
        }

        // Legacy storage
        const identityPath = path.join(app.path, 'identity', 'user_identity.json');
        if (fs.existsSync(identityPath)) {
            try {
                const data = fs.readFileSync(identityPath, 'utf8');
                const parsed = JSON.parse(data);
                // Handle wrapped format (identity property) or direct format
                return parsed.identity || parsed;
            } catch (e) {
                return null;
            }
        }

        // Check for .personal folder format
        if (app.name === 'personal-folder') {
            const nodeIdentityPath = path.join(app.path, 'node_identity.json');
            if (fs.existsSync(nodeIdentityPath)) {
                try {
                    const data = fs.readFileSync(nodeIdentityPath, 'utf8');
                    return JSON.parse(data);
                } catch (e) {
                    return null;
                }
            }
        }

        return null;
    }

    /**
     * Sync identity to a specific app
     */
    async _syncIdentityToApp(app, identity) {
        if (app.storage === 'unified') {
            storage.saveMasterIdentity(identity);
            return;
        }

        // Legacy storage
        const identityDir = path.join(app.path, 'identity');
        if (!fs.existsSync(identityDir)) {
            fs.mkdirSync(identityDir, { recursive: true });
        }

        const identityPath = path.join(identityDir, 'user_identity.json');

        // Wrap in expected format for legacy apps
        const wrapped = {
            identity,
            settings: {},
            stats: {
                messagesSent: identity.messagesSent || 0,
                sessionsCount: identity.sessionsCount || 0
            }
        };

        fs.writeFileSync(identityPath, JSON.stringify(wrapped, null, 2));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SETTINGS SYNC
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Sync settings from one app to another
     */
    async syncSettings(fromApp, toApp) {
        const results = {
            success: false,
            settingsSynced: [],
            errors: []
        };

        try {
            const fromSettings = storage.loadAppSettings(fromApp);
            if (!fromSettings) {
                results.errors.push(`No settings found for ${fromApp}`);
                return results;
            }

            const toSettings = storage.loadAppSettings(toApp) || {};

            // Merge settings (from takes priority for common keys)
            const merged = { ...toSettings, ...fromSettings };

            // Save merged settings
            storage.saveAppSettings(toApp, merged);

            results.settingsSynced = Object.keys(fromSettings);
            results.success = true;
        } catch (e) {
            results.errors.push(e.message);
        }

        return results;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MIGRATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Migrate from legacy storage to unified storage
     */
    async migrateToUnified() {
        const results = {
            success: false,
            migrated: [],
            skipped: [],
            errors: []
        };

        const apps = this.detectApps();
        const legacyApps = apps.filter(a => a.storage === 'legacy');

        if (legacyApps.length === 0) {
            results.skipped.push('No legacy apps to migrate');
            results.success = true;
            return results;
        }

        // Check if unified storage already has identity
        const hasUnifiedIdentity = storage.hasMasterIdentity();

        for (const app of legacyApps) {
            try {
                // Load legacy identity
                const legacyIdentity = await this._loadIdentityFromApp(app);

                if (!legacyIdentity) {
                    results.skipped.push(`${app.name}: No identity found`);
                    continue;
                }

                if (!hasUnifiedIdentity) {
                    // Migrate identity to unified storage
                    storage.saveMasterIdentity(legacyIdentity);
                    results.migrated.push(`${app.name}: Identity migrated`);
                } else {
                    results.skipped.push(`${app.name}: Unified identity already exists`);
                }

                // Migrate app-specific settings
                const legacySettingsPath = path.join(app.path, 'settings.json');
                if (fs.existsSync(legacySettingsPath)) {
                    const settings = JSON.parse(fs.readFileSync(legacySettingsPath, 'utf8'));
                    storage.saveAppSettings(app.name, settings);
                    results.migrated.push(`${app.name}: Settings migrated`);
                }

            } catch (e) {
                results.errors.push(`${app.name}: ${e.message}`);
            }
        }

        results.success = results.errors.length === 0;
        return results;
    }

    /**
     * Migrate from Chat Lite to RangerPlex
     * Called when user installs RangerPlex after using Chat Lite
     */
    async migrateToRangerPlex() {
        const results = {
            success: false,
            imported: {
                identity: false,
                settings: false,
                chatHistory: false,
                contacts: false
            },
            errors: []
        };

        // First ensure unified storage is populated
        const migrationResult = await this.migrateToUnified();
        if (!migrationResult.success && migrationResult.errors.length > 0) {
            results.errors.push(...migrationResult.errors);
        }

        // Load from unified storage
        const identity = storage.loadMasterIdentity();
        if (identity) {
            results.imported.identity = true;
        }

        // Load Chat Lite specific data
        const chatLiteData = storage.loadAppData(APPS.CHAT_LITE, 'chat_history.json');
        if (chatLiteData) {
            // Save to RangerPlex app folder
            storage.saveAppData(APPS.RANGERPLEX, 'imported_chat_history.json', {
                importedFrom: APPS.CHAT_LITE,
                importedAt: new Date().toISOString(),
                data: chatLiteData
            });
            results.imported.chatHistory = true;
        }

        const contacts = storage.loadAppData(APPS.CHAT_LITE, 'contacts.json');
        if (contacts) {
            storage.saveAppData(APPS.RANGERPLEX, 'contacts.json', contacts);
            results.imported.contacts = true;
        }

        const settings = storage.loadAppSettings(APPS.CHAT_LITE);
        if (settings) {
            // Merge with any existing RangerPlex settings
            const existingSettings = storage.loadAppSettings(APPS.RANGERPLEX) || {};
            storage.saveAppSettings(APPS.RANGERPLEX, { ...settings, ...existingSettings });
            results.imported.settings = true;
        }

        results.success = results.imported.identity;
        return results;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONFLICT RESOLUTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Resolve identity conflict between two apps
     */
    resolveConflict(keepApp, discardApp) {
        const apps = this.detectApps();
        const keep = apps.find(a => a.name === keepApp);
        const discard = apps.find(a => a.name === discardApp);

        if (!keep || !discard) {
            return { success: false, error: 'App not found' };
        }

        // Log the conflict resolution
        storage.logSyncConflict({
            type: 'manual_resolution',
            kept: keepApp,
            discarded: discardApp,
            timestamp: new Date().toISOString()
        });

        // The kept identity is already in unified storage (or should be migrated)
        return { success: true };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FILE WATCHING (for real-time sync)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Start watching for changes in identity files
     */
    startWatching() {
        const identityPath = path.join(storage.getIdentityPath(), 'master_identity.json');

        if (fs.existsSync(identityPath)) {
            const watcher = fs.watch(identityPath, (eventType) => {
                if (eventType === 'change') {
                    this._onIdentityChange();
                }
            });
            this._watchers.push(watcher);
        }
    }

    /**
     * Stop all file watchers
     */
    stopWatching() {
        for (const watcher of this._watchers) {
            watcher.close();
        }
        this._watchers = [];
    }

    /**
     * Handle identity file changes
     */
    _onIdentityChange() {
        // Debounce - only sync if last sync was more than 5 seconds ago
        if (this._lastSync && (Date.now() - this._lastSync.getTime()) < 5000) {
            return;
        }

        console.log('[SyncManager] Identity changed, syncing...');
        this.syncIdentity().then(results => {
            if (results.success) {
                console.log('[SyncManager] Sync complete');
            } else {
                console.error('[SyncManager] Sync failed:', results.errors);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STATUS & INFO
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get sync status
     */
    getStatus() {
        const syncState = storage.loadSyncState();
        const apps = this.detectApps();

        return {
            version: this.version,
            lastSync: syncState?.lastIdentitySync || null,
            appsDetected: apps.length,
            apps: apps.map(a => ({
                name: a.name,
                storage: a.storage,
                hasIdentity: a.hasIdentity,
                priority: a.priority
            })),
            unifiedStorageReady: storage.hasMasterIdentity(),
            conflicts: syncState?.conflicts || []
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

const syncManager = new SyncManager();

module.exports = {
    SyncManager,
    syncManager,
    APPS,
    LEGACY_PATHS,

    // Convenience exports
    detectApps: () => syncManager.detectApps(),
    syncIdentity: () => syncManager.syncIdentity(),
    migrateToUnified: () => syncManager.migrateToUnified(),
    migrateToRangerPlex: () => syncManager.migrateToRangerPlex(),
    getStatus: () => syncManager.getStatus(),
    startWatching: () => syncManager.startWatching(),
    stopWatching: () => syncManager.stopWatching()
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI TEST
// ═══════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    (async () => {
        console.log('\n🔄 RANGERBLOCK SYNC MANAGER TEST\n');
        console.log('=================================');

        // Detect apps
        console.log('\n1. Detecting installed apps...');
        const apps = syncManager.detectApps();
        if (apps.length > 0) {
            for (const app of apps) {
                console.log(`   - ${app.name}`);
                console.log(`     Path: ${app.path}`);
                console.log(`     Storage: ${app.storage}`);
                console.log(`     Priority: ${app.priority}`);
            }
        } else {
            console.log('   No apps detected');
        }

        // Get status
        console.log('\n2. Sync status:');
        const status = syncManager.getStatus();
        console.log(`   Version: ${status.version}`);
        console.log(`   Last sync: ${status.lastSync || 'Never'}`);
        console.log(`   Apps detected: ${status.appsDetected}`);
        console.log(`   Unified storage ready: ${status.unifiedStorageReady ? 'YES' : 'NO'}`);

        // Try migration
        console.log('\n3. Checking for legacy data to migrate...');
        const migrationResult = await syncManager.migrateToUnified();
        if (migrationResult.migrated.length > 0) {
            console.log('   Migrated:');
            for (const item of migrationResult.migrated) {
                console.log(`     - ${item}`);
            }
        }
        if (migrationResult.skipped.length > 0) {
            console.log('   Skipped:');
            for (const item of migrationResult.skipped) {
                console.log(`     - ${item}`);
            }
        }

        // Sync identity
        console.log('\n4. Syncing identity across apps...');
        const syncResult = await syncManager.syncIdentity();
        console.log(`   Success: ${syncResult.success ? 'YES' : 'NO'}`);
        if (syncResult.sourceApp) {
            console.log(`   Source: ${syncResult.sourceApp}`);
        }
        if (syncResult.targetApps.length > 0) {
            console.log(`   Synced to: ${syncResult.targetApps.join(', ')}`);
        }
        if (syncResult.errors.length > 0) {
            console.log('   Errors:');
            for (const err of syncResult.errors) {
                console.log(`     - ${err}`);
            }
        }

        console.log('\n=================================');
        console.log('Sync manager test completed!\n');
    })();
}

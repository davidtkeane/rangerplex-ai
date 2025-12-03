#!/usr/bin/env node
/**
 * RANGERBLOCK UPDATE CHECK v1.0.0
 * ================================
 * Checks for updates from GitHub and notifies users
 *
 * Usage:
 *   const updateCheck = require('./lib/update-check.cjs');
 *   await updateCheck.check('blockchain-chat', '4.1.0');
 *
 * Features:
 * - Fetches versions.json from GitHub
 * - Compares semantic versions
 * - Caches results (24h) to avoid spam
 * - Non-blocking (won't crash if offline)
 * - Pretty console output
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const VERSIONS_URL = 'https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/versions.json';
const CACHE_FILE = path.join(process.env.HOME || '/tmp', '.rangerblock-update-cache.json');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms
const FETCH_TIMEOUT = 5000; // 5 second timeout

// ═══════════════════════════════════════════════════════════════════════════
// COLORS (ANSI)
// ═══════════════════════════════════════════════════════════════════════════

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m'
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compare semantic versions
 * @param {string} current - Current version (e.g., "1.0.0")
 * @param {string} latest - Latest version (e.g., "1.1.0")
 * @returns {number} -1 if current < latest, 0 if equal, 1 if current > latest
 */
function compareVersions(current, latest) {
    const currentParts = current.replace(/^v/, '').split('.').map(Number);
    const latestParts = latest.replace(/^v/, '').split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const c = currentParts[i] || 0;
        const l = latestParts[i] || 0;
        if (c < l) return -1;
        if (c > l) return 1;
    }
    return 0;
}

/**
 * Fetch JSON from URL with timeout
 * @param {string} url - URL to fetch
 * @returns {Promise<object>} Parsed JSON
 */
function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Timeout'));
        }, FETCH_TIMEOUT);

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                clearTimeout(timeout);
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });
    });
}

/**
 * Load cache from file
 * @returns {object|null}
 */
function loadCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
            if (Date.now() - cache.timestamp < CACHE_DURATION) {
                return cache;
            }
        }
    } catch (e) {
        // Cache invalid or expired
    }
    return null;
}

/**
 * Save cache to file
 * @param {object} data
 */
function saveCache(data) {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify({
            timestamp: Date.now(),
            versions: data
        }));
    } catch (e) {
        // Ignore cache write errors
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CHECK FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check for updates
 * @param {string} component - Component name (e.g., 'blockchain-chat')
 * @param {string} currentVersion - Current installed version
 * @param {object} options - Options { silent: false, showBanner: true }
 * @returns {Promise<object>} { updateAvailable, currentVersion, latestVersion, component }
 */
async function check(component, currentVersion, options = {}) {
    const { silent = false, showBanner = true } = options;

    const result = {
        updateAvailable: false,
        currentVersion: currentVersion,
        latestVersion: null,
        component: component,
        error: null
    };

    try {
        // Try cache first
        let versions = loadCache()?.versions;

        if (!versions) {
            // Fetch from GitHub
            versions = await fetchJSON(VERSIONS_URL);
            saveCache(versions);
        }

        // Get component version
        const componentInfo = versions.components?.[component];
        if (!componentInfo) {
            result.error = `Component '${component}' not found in versions.json`;
            return result;
        }

        result.latestVersion = componentInfo.version;

        // Compare versions
        if (compareVersions(currentVersion, componentInfo.version) < 0) {
            result.updateAvailable = true;

            // Show banner if not silent
            if (!silent && showBanner) {
                printUpdateBanner(component, currentVersion, componentInfo.version, versions.latest?.notes);
            }
        }

    } catch (e) {
        result.error = e.message;
        // Don't print errors - silent fail for offline/timeout
    }

    return result;
}

/**
 * Check all components at once
 * @param {object} components - { componentName: currentVersion, ... }
 * @returns {Promise<object[]>} Array of check results
 */
async function checkAll(components) {
    const results = [];

    try {
        // Fetch versions once
        let versions = loadCache()?.versions;
        if (!versions) {
            versions = await fetchJSON(VERSIONS_URL);
            saveCache(versions);
        }

        for (const [component, currentVersion] of Object.entries(components)) {
            const componentInfo = versions.components?.[component];
            if (componentInfo && compareVersions(currentVersion, componentInfo.version) < 0) {
                results.push({
                    component,
                    currentVersion,
                    latestVersion: componentInfo.version,
                    updateAvailable: true
                });
            }
        }

        if (results.length > 0) {
            printMultiUpdateBanner(results, versions.latest?.notes);
        }

    } catch (e) {
        // Silent fail
    }

    return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// BANNER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Print update available banner for single component
 */
function printUpdateBanner(component, current, latest, notes) {
    const c = colors;
    console.log('');
    console.log(`${c.yellow}${c.bright}╔══════════════════════════════════════════════════════════╗${c.reset}`);
    console.log(`${c.yellow}${c.bright}║${c.reset}  ${c.cyan}📦 UPDATE AVAILABLE${c.reset}                                      ${c.yellow}${c.bright}║${c.reset}`);
    console.log(`${c.yellow}${c.bright}║${c.reset}                                                          ${c.yellow}${c.bright}║${c.reset}`);
    console.log(`${c.yellow}${c.bright}║${c.reset}  ${c.white}${component}:${c.reset} ${c.red}${current}${c.reset} ${c.dim}→${c.reset} ${c.green}${c.bright}${latest}${c.reset}                          ${c.yellow}${c.bright}║${c.reset}`);
    if (notes) {
        const truncatedNotes = notes.length > 50 ? notes.substring(0, 47) + '...' : notes;
        console.log(`${c.yellow}${c.bright}║${c.reset}  ${c.dim}${truncatedNotes}${c.reset}${' '.repeat(Math.max(0, 56 - truncatedNotes.length))}${c.yellow}${c.bright}║${c.reset}`);
    }
    console.log(`${c.yellow}${c.bright}║${c.reset}                                                          ${c.yellow}${c.bright}║${c.reset}`);
    console.log(`${c.yellow}${c.bright}║${c.reset}  ${c.cyan}Update:${c.reset} Re-run setup script or pull latest             ${c.yellow}${c.bright}║${c.reset}`);
    console.log(`${c.yellow}${c.bright}╚══════════════════════════════════════════════════════════╝${c.reset}`);
    console.log('');
}

/**
 * Print update banner for multiple components
 */
function printMultiUpdateBanner(updates, notes) {
    const c = colors;
    console.log('');
    console.log(`${c.yellow}${c.bright}╔══════════════════════════════════════════════════════════╗${c.reset}`);
    console.log(`${c.yellow}${c.bright}║${c.reset}  ${c.cyan}📦 UPDATES AVAILABLE (${updates.length})${c.reset}${' '.repeat(Math.max(0, 35 - String(updates.length).length))}${c.yellow}${c.bright}║${c.reset}`);
    console.log(`${c.yellow}${c.bright}║${c.reset}                                                          ${c.yellow}${c.bright}║${c.reset}`);

    for (const update of updates.slice(0, 5)) { // Max 5 shown
        const line = `  ${update.component}: ${update.currentVersion} → ${update.latestVersion}`;
        const padding = ' '.repeat(Math.max(0, 58 - line.length));
        console.log(`${c.yellow}${c.bright}║${c.reset}${c.white}${line}${c.reset}${padding}${c.yellow}${c.bright}║${c.reset}`);
    }

    if (updates.length > 5) {
        console.log(`${c.yellow}${c.bright}║${c.reset}  ${c.dim}... and ${updates.length - 5} more${c.reset}                                      ${c.yellow}${c.bright}║${c.reset}`);
    }

    console.log(`${c.yellow}${c.bright}║${c.reset}                                                          ${c.yellow}${c.bright}║${c.reset}`);
    console.log(`${c.yellow}${c.bright}║${c.reset}  ${c.cyan}Update:${c.reset} Re-run setup script or pull latest             ${c.yellow}${c.bright}║${c.reset}`);
    console.log(`${c.yellow}${c.bright}╚══════════════════════════════════════════════════════════╝${c.reset}`);
    console.log('');
}

/**
 * Get update info without printing (for programmatic use)
 * @param {string} component
 * @param {string} currentVersion
 * @returns {Promise<object>}
 */
async function getUpdateInfo(component, currentVersion) {
    return check(component, currentVersion, { silent: true, showBanner: false });
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
    check,
    checkAll,
    getUpdateInfo,
    compareVersions,
    VERSIONS_URL
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI TEST
// ═══════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    console.log('\n🔄 RangerBlock Update Check v1.0.0\n');

    // Test with an old version to trigger banner
    check('blockchain-chat', '3.0.0').then(result => {
        console.log('\nResult:', JSON.stringify(result, null, 2));
    });
}

#!/usr/bin/env node
/**
 * RANGERBLOCK ADMIN CHECK v1.0.0
 * ==============================
 * Lightweight admin/ban check for relay servers
 *
 * Usage:
 *   const { isSupremeAdmin, isBanned, getRole } = require('./admin-check.cjs');
 *
 *   // On connection:
 *   if (isBanned(userId)) { ws.close(); return; }
 *   if (isSupremeAdmin(userId)) { user.isAdmin = true; }
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════
// SUPREME ADMIN - HARDCODED (Cannot be changed or removed)
// ═══════════════════════════════════════════════════════════════════════════

const SUPREME_ADMIN = {
    userId: 'rb_c5d415076f04e989',
    username: 'IrishRanger',
    publicKeyHash: 'a4b8c9d0e1f2a3b4c5d6e7f8g9h0i1j2k3l4m5n6',
    role: 'supreme'
};

// ═══════════════════════════════════════════════════════════════════════════
// ROLE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const ROLES = {
    supreme: { level: 100, name: 'Supreme Admin', icon: '👑' },
    admin: { level: 80, name: 'Admin', icon: '🛡️' },
    mod: { level: 50, name: 'Moderator', icon: '⚔️' },
    user: { level: 10, name: 'User', icon: '👤' },
    banned: { level: 0, name: 'Banned', icon: '🚫' }
};

// ═══════════════════════════════════════════════════════════════════════════
// DATA PATHS
// ═══════════════════════════════════════════════════════════════════════════

const ADMIN_DATA_DIR = process.env.ADMIN_DATA_DIR ||
    path.join(process.env.HOME || '/tmp', '.claude', 'ranger', 'admin', 'data');

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function loadJSON(filename) {
    const filepath = path.join(ADMIN_DATA_DIR, filename);
    try {
        if (fs.existsSync(filepath)) {
            return JSON.parse(fs.readFileSync(filepath, 'utf8'));
        }
    } catch (e) {
        console.error(`Error loading ${filename}:`, e.message);
    }
    return {};
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CHECK FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if userId is the Supreme Admin
 * @param {string} userId
 * @returns {boolean}
 */
function isSupremeAdmin(userId) {
    return userId === SUPREME_ADMIN.userId;
}

/**
 * Check if user is banned
 * @param {string} userId
 * @returns {boolean}
 */
function isBanned(userId) {
    // Supreme admin can never be banned
    if (isSupremeAdmin(userId)) return false;

    const bans = loadJSON('bans.json');
    return bans[userId] !== undefined;
}

/**
 * Check if user is timed out
 * @param {string} userId
 * @returns {boolean}
 */
function isTimedOut(userId) {
    // Supreme admin can never be timed out
    if (isSupremeAdmin(userId)) return false;

    const timeouts = loadJSON('timeouts.json');
    const timeout = timeouts[userId];

    if (!timeout) return false;
    if (new Date(timeout.expiresAt) < new Date()) return false;

    return true;
}

/**
 * Get user's role
 * @param {string} userId
 * @returns {string} Role name: 'supreme', 'admin', 'mod', 'user', or 'banned'
 */
function getRole(userId) {
    if (isSupremeAdmin(userId)) return 'supreme';
    if (isBanned(userId)) return 'banned';

    const users = loadJSON('users.json');
    return users[userId]?.role || 'user';
}

/**
 * Get role info (icon, level, name)
 * @param {string} role
 * @returns {object}
 */
function getRoleInfo(role) {
    return ROLES[role] || ROLES.user;
}

/**
 * Check if user has admin level (admin or supreme)
 * @param {string} userId
 * @returns {boolean}
 */
function isAdmin(userId) {
    const role = getRole(userId);
    return role === 'supreme' || role === 'admin';
}

/**
 * Check if user has mod level or higher
 * @param {string} userId
 * @returns {boolean}
 */
function isModerator(userId) {
    const role = getRole(userId);
    const level = ROLES[role]?.level || 0;
    return level >= ROLES.mod.level;
}

/**
 * Verify user can connect
 * @param {string} userId
 * @returns {object} { allowed: boolean, reason?: string }
 */
function canConnect(userId) {
    if (isBanned(userId)) {
        return { allowed: false, reason: 'You are banned from this network.' };
    }
    return { allowed: true };
}

/**
 * Verify user can send messages
 * @param {string} userId
 * @returns {object} { allowed: boolean, reason?: string, remaining?: number }
 */
function canMessage(userId) {
    if (isBanned(userId)) {
        return { allowed: false, reason: 'You are banned.' };
    }
    if (isTimedOut(userId)) {
        const timeouts = loadJSON('timeouts.json');
        const remaining = Math.ceil((new Date(timeouts[userId].expiresAt) - new Date()) / 1000 / 60);
        return { allowed: false, reason: `You are timed out for ${remaining} more minutes.`, remaining };
    }
    return { allowed: true };
}

/**
 * Get user badge/icon for display
 * @param {string} userId
 * @returns {string}
 */
function getUserBadge(userId) {
    const role = getRole(userId);
    return ROLES[role]?.icon || '👤';
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
    // Core checks
    isSupremeAdmin,
    isBanned,
    isTimedOut,
    getRole,
    getRoleInfo,
    isAdmin,
    isModerator,

    // Connection checks
    canConnect,
    canMessage,
    getUserBadge,

    // Constants
    SUPREME_ADMIN,
    ROLES
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI TEST
// ═══════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    console.log('\n🔐 RANGERBLOCK ADMIN CHECK v1.0.0\n');
    console.log('═'.repeat(40));

    console.log('\nSupreme Admin:');
    console.log(`  userId: ${SUPREME_ADMIN.userId}`);
    console.log(`  Is Supreme: ${isSupremeAdmin(SUPREME_ADMIN.userId)}`);

    console.log('\nRole Check (test user):');
    const testUser = 'rb_test123';
    console.log(`  getRole("${testUser}"): ${getRole(testUser)}`);
    console.log(`  isBanned: ${isBanned(testUser)}`);
    console.log(`  canConnect: ${JSON.stringify(canConnect(testUser))}`);

    console.log('\n═'.repeat(40));
    console.log('Ready for relay integration!\n');
}

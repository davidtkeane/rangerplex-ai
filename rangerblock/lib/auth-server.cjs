#!/usr/bin/env node
/**
 * RANGERBLOCK AUTH SERVER v1.0.0
 * ==============================
 * Challenge-response authentication for identity verification
 *
 * Flow:
 * 1. Client connects with userId + publicKey
 * 2. Server sends random challenge (nonce)
 * 3. Client signs challenge with private key
 * 4. Server verifies signature → grants session
 *
 * Usage:
 *   const authServer = require('./auth-server.cjs');
 *   authServer.startServer(5557);  // Start standalone
 *
 *   // Or integrate with existing WebSocket:
 *   authServer.handleAuth(ws, message);
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 */

const crypto = require('crypto');
const WebSocket = require('ws');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = '1.0.0';
const DEFAULT_PORT = 5557;
const CHALLENGE_EXPIRY = 30000; // 30 seconds
const SESSION_EXPIRY = 3600000; // 1 hour

// ═══════════════════════════════════════════════════════════════════════════
// AUTH STATE
// ═══════════════════════════════════════════════════════════════════════════

// Pending challenges: Map<challengeId, { userId, challenge, publicKey, expiresAt }>
const pendingChallenges = new Map();

// Authenticated sessions: Map<sessionId, { userId, publicKey, authenticatedAt, expiresAt }>
const activeSessions = new Map();

// Known public keys: Map<userId, publicKey>
const knownKeys = new Map();

// ═══════════════════════════════════════════════════════════════════════════
// CRYPTO HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function generateChallenge() {
    return crypto.randomBytes(32).toString('hex');
}

function generateSessionId() {
    return 'sess_' + crypto.randomBytes(16).toString('hex');
}

function verifySignature(message, signature, publicKey) {
    try {
        const verify = crypto.createVerify('SHA256');
        verify.update(message);
        verify.end();
        return verify.verify(publicKey, Buffer.from(signature, 'base64'));
    } catch (e) {
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// CHALLENGE-RESPONSE HANDLER
// ═══════════════════════════════════════════════════════════════════════════

class AuthHandler {
    constructor() {
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    /**
     * Step 1: Client requests authentication
     * Returns a challenge that must be signed
     */
    initiateAuth(userId, publicKey) {
        const challenge = generateChallenge();
        const challengeId = 'chal_' + crypto.randomBytes(8).toString('hex');
        const expiresAt = Date.now() + CHALLENGE_EXPIRY;

        pendingChallenges.set(challengeId, {
            userId,
            challenge,
            publicKey,
            expiresAt,
            createdAt: Date.now()
        });

        // Store/update known public key
        knownKeys.set(userId, publicKey);

        return {
            type: 'authChallenge',
            challengeId,
            challenge,
            expiresAt
        };
    }

    /**
     * Step 2: Client responds with signed challenge
     * Returns session token if valid
     */
    verifyChallenge(challengeId, signature) {
        const pending = pendingChallenges.get(challengeId);

        if (!pending) {
            return { type: 'authError', error: 'Invalid or expired challenge' };
        }

        if (Date.now() > pending.expiresAt) {
            pendingChallenges.delete(challengeId);
            return { type: 'authError', error: 'Challenge expired' };
        }

        // Verify the signature
        const isValid = verifySignature(pending.challenge, signature, pending.publicKey);

        if (!isValid) {
            pendingChallenges.delete(challengeId);
            return { type: 'authError', error: 'Invalid signature' };
        }

        // Success! Create session
        const sessionId = generateSessionId();
        const expiresAt = Date.now() + SESSION_EXPIRY;

        activeSessions.set(sessionId, {
            userId: pending.userId,
            publicKey: pending.publicKey,
            authenticatedAt: Date.now(),
            expiresAt
        });

        pendingChallenges.delete(challengeId);

        return {
            type: 'authSuccess',
            sessionId,
            userId: pending.userId,
            expiresAt
        };
    }

    /**
     * Verify a session is still valid
     */
    verifySession(sessionId) {
        const session = activeSessions.get(sessionId);

        if (!session) {
            return { valid: false, error: 'Session not found' };
        }

        if (Date.now() > session.expiresAt) {
            activeSessions.delete(sessionId);
            return { valid: false, error: 'Session expired' };
        }

        return {
            valid: true,
            userId: session.userId,
            authenticatedAt: session.authenticatedAt,
            expiresAt: session.expiresAt
        };
    }

    /**
     * Revoke a session
     */
    revokeSession(sessionId) {
        const existed = activeSessions.has(sessionId);
        activeSessions.delete(sessionId);
        return { revoked: existed };
    }

    /**
     * Get public key for a userId
     */
    getPublicKey(userId) {
        return knownKeys.get(userId) || null;
    }

    /**
     * Get all active sessions (admin)
     */
    getActiveSessions() {
        const sessions = [];
        for (const [sessionId, session] of activeSessions) {
            sessions.push({
                sessionId: sessionId.slice(0, 12) + '...',
                userId: session.userId,
                authenticatedAt: new Date(session.authenticatedAt).toISOString(),
                expiresIn: Math.round((session.expiresAt - Date.now()) / 1000) + 's'
            });
        }
        return sessions;
    }

    /**
     * Cleanup expired challenges and sessions
     */
    cleanup() {
        const now = Date.now();

        for (const [id, challenge] of pendingChallenges) {
            if (now > challenge.expiresAt) {
                pendingChallenges.delete(id);
            }
        }

        for (const [id, session] of activeSessions) {
            if (now > session.expiresAt) {
                activeSessions.delete(id);
            }
        }
    }

    /**
     * Handle WebSocket auth message
     */
    handleMessage(message) {
        switch (message.type) {
            case 'authRequest':
                if (!message.userId || !message.publicKey) {
                    return { type: 'authError', error: 'Missing userId or publicKey' };
                }
                return this.initiateAuth(message.userId, message.publicKey);

            case 'authResponse':
                if (!message.challengeId || !message.signature) {
                    return { type: 'authError', error: 'Missing challengeId or signature' };
                }
                return this.verifyChallenge(message.challengeId, message.signature);

            case 'sessionVerify':
                if (!message.sessionId) {
                    return { type: 'authError', error: 'Missing sessionId' };
                }
                return { type: 'sessionStatus', ...this.verifySession(message.sessionId) };

            case 'sessionRevoke':
                if (!message.sessionId) {
                    return { type: 'authError', error: 'Missing sessionId' };
                }
                return { type: 'sessionRevoked', ...this.revokeSession(message.sessionId) };

            default:
                return { type: 'authError', error: 'Unknown auth message type' };
        }
    }
}

// Create singleton instance
const authHandler = new AuthHandler();

// ═══════════════════════════════════════════════════════════════════════════
// STANDALONE SERVER
// ═══════════════════════════════════════════════════════════════════════════

function startServer(port = DEFAULT_PORT) {
    const wss = new WebSocket.Server({ port });

    console.log(`\n🔐 RangerBlock Auth Server v${VERSION}`);
    console.log(`   Listening on port ${port}`);
    console.log(`   Challenge expiry: ${CHALLENGE_EXPIRY/1000}s`);
    console.log(`   Session expiry: ${SESSION_EXPIRY/1000}s\n`);

    wss.on('connection', (ws) => {
        console.log('🔌 Client connected');

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                const response = authHandler.handleMessage(message);
                ws.send(JSON.stringify(response));

                // Log auth events
                if (response.type === 'authSuccess') {
                    console.log(`✅ Authenticated: ${response.userId}`);
                } else if (response.type === 'authError') {
                    console.log(`❌ Auth failed: ${response.error}`);
                }
            } catch (e) {
                ws.send(JSON.stringify({ type: 'authError', error: 'Invalid message format' }));
            }
        });

        ws.on('close', () => {
            console.log('🔌 Client disconnected');
        });
    });

    return wss;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
    // Main handler
    authHandler,

    // Convenience methods
    initiateAuth: (userId, publicKey) => authHandler.initiateAuth(userId, publicKey),
    verifyChallenge: (challengeId, signature) => authHandler.verifyChallenge(challengeId, signature),
    verifySession: (sessionId) => authHandler.verifySession(sessionId),
    revokeSession: (sessionId) => authHandler.revokeSession(sessionId),
    getPublicKey: (userId) => authHandler.getPublicKey(userId),
    getActiveSessions: () => authHandler.getActiveSessions(),
    handleMessage: (message) => authHandler.handleMessage(message),

    // Server
    startServer,

    // Constants
    VERSION,
    CHALLENGE_EXPIRY,
    SESSION_EXPIRY
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI MODE
// ═══════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    const port = parseInt(process.argv[2]) || DEFAULT_PORT;
    startServer(port);
}

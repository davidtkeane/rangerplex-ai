/**
 * 🎖️ RANGERCHAT LITE - IDENTITY SERVICE v2.0.0
 * =============================================
 * Manages user identity compatible with RangerPlex/RangerBlock
 *
 * NEW IN v2.0.0:
 * - Uses shared ~/.rangerblock/ storage (cross-app sync!)
 * - RSA-2048 key pairs for message signing
 * - Automatic migration from legacy storage
 * - RangerPlex detection and sync
 *
 * Features:
 * - Cross-platform hardware detection (Windows/Mac/Linux)
 * - Persistent identity storage in ~/.rangerblock/
 * - Backward compatible with Electron userData
 * - Fun username generator
 * - Admin tracking for moderation (ban/warn/timeout)
 */

import { app } from 'electron'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import * as os from 'os'

// Shared storage location (used by ALL RangerBlock apps)
const RANGERBLOCK_HOME = path.join(os.homedir(), '.rangerblock')

// Fun username word lists
const ADJECTIVES = [
    'Cosmic', 'Cyber', 'Digital', 'Electric', 'Quantum', 'Turbo', 'Mega', 'Ultra',
    'Neo', 'Techno', 'Laser', 'Plasma', 'Atomic', 'Hyper', 'Super', 'Epic',
    'Mystic', 'Shadow', 'Thunder', 'Storm', 'Frost', 'Fire', 'Neon', 'Pixel',
    'Stealth', 'Swift', 'Rapid', 'Sonic', 'Wild', 'Brave', 'Noble', 'Bold'
]

const NOUNS = [
    'Ranger', 'Phoenix', 'Dragon', 'Wolf', 'Falcon', 'Tiger', 'Hawk', 'Eagle',
    'Knight', 'Ninja', 'Samurai', 'Wizard', 'Pilot', 'Hacker', 'Coder', 'Agent',
    'Pioneer', 'Explorer', 'Voyager', 'Seeker', 'Hunter', 'Guardian', 'Sentinel',
    'Phantom', 'Specter', 'Raven', 'Cobra', 'Viper', 'Panther', 'Lion', 'Bear'
]

export interface UserIdentity {
    userId: string           // Unique hardware-bound ID
    nodeId: string           // P2P network ID (compatible with RangerBlock)
    username: string         // Display name (can be changed)
    created: string          // ISO timestamp
    lastSeen: string         // Last connection time
    hardwareFingerprint: string
    platform: {
        system: string
        machine: string
        hostname: string
    }
    version: string
    appType: 'ranger-chat-lite'
    publicKey?: string       // RSA-2048 public key (for signing)
    chainRegistration?: {    // On-chain registration proof
        blockHeight: number
        blockHash: string
        registeredAt: string
    } | null
}

export interface IdentityStorage {
    identity: UserIdentity
    settings: {
        theme: string
        soundEnabled: boolean
        notificationsEnabled: boolean
    }
    stats: {
        messagesSent: number
        sessionsCount: number
        firstSeen: string
    }
}

class IdentityService {
    // NEW: Shared storage (all RangerBlock apps)
    private sharedStorageDir: string
    private sharedIdentityFile: string
    private sharedKeysDir: string
    private sharedAppDir: string

    // LEGACY: Electron userData (for backward compatibility)
    private legacyStorageDir: string
    private legacyIdentityFile: string
    private personalDir: string  // RangerPlex compatible .personal folder

    constructor() {
        // NEW: Shared ~/.rangerblock/ storage (used by ALL RangerBlock apps)
        this.sharedStorageDir = path.join(RANGERBLOCK_HOME, 'identity')
        this.sharedIdentityFile = path.join(this.sharedStorageDir, 'master_identity.json')
        this.sharedKeysDir = path.join(RANGERBLOCK_HOME, 'keys')
        this.sharedAppDir = path.join(RANGERBLOCK_HOME, 'apps', 'ranger-chat-lite')

        // LEGACY: Electron's userData folder (check for migration)
        this.legacyStorageDir = path.join(app.getPath('userData'), 'identity')
        this.legacyIdentityFile = path.join(this.legacyStorageDir, 'user_identity.json')

        // Also create RangerPlex-compatible .personal folder
        this.personalDir = path.join(app.getPath('userData'), '.personal')

        // Ensure directories exist
        this.ensureDirectories()

        // Migrate from legacy storage if needed
        this.migrateFromLegacy()
    }

    private ensureDirectories(): void {
        // Shared storage directories
        const sharedDirs = [
            RANGERBLOCK_HOME,
            this.sharedStorageDir,
            this.sharedKeysDir,
            this.sharedAppDir,
            path.join(RANGERBLOCK_HOME, 'sync'),
            path.join(RANGERBLOCK_HOME, 'security'),
            path.join(RANGERBLOCK_HOME, 'sessions')
        ]

        for (const dir of sharedDirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
            }
        }

        // Legacy directories (for backward compatibility)
        if (!fs.existsSync(this.legacyStorageDir)) {
            fs.mkdirSync(this.legacyStorageDir, { recursive: true })
        }
        if (!fs.existsSync(this.personalDir)) {
            fs.mkdirSync(this.personalDir, { recursive: true })
        }
        const keysDir = path.join(this.personalDir, 'keys')
        if (!fs.existsSync(keysDir)) {
            fs.mkdirSync(keysDir, { recursive: true })
        }
    }

    /**
     * Migrate from legacy Electron userData to shared ~/.rangerblock/
     */
    private migrateFromLegacy(): void {
        // Check if we have legacy data but no shared data
        if (fs.existsSync(this.legacyIdentityFile) && !fs.existsSync(this.sharedIdentityFile)) {
            try {
                console.log('[IdentityService] Migrating from legacy storage to ~/.rangerblock/')

                // Read legacy identity
                const legacyData = fs.readFileSync(this.legacyIdentityFile, 'utf8')
                const legacyStorage = JSON.parse(legacyData)
                const identity = legacyStorage.identity || legacyStorage

                // Save to shared storage
                fs.writeFileSync(this.sharedIdentityFile, JSON.stringify(identity, null, 2), { mode: 0o600 })

                // Save hardware fingerprint separately
                const fingerprintFile = path.join(this.sharedStorageDir, 'hardware_fingerprint.json')
                fs.writeFileSync(fingerprintFile, JSON.stringify({
                    fingerprint: identity.hardwareFingerprint,
                    recordedAt: new Date().toISOString(),
                    platform: os.platform(),
                    hostname: os.hostname()
                }, null, 2), { mode: 0o600 })

                // Copy keys if they exist
                const legacyKeysDir = path.join(this.personalDir, 'keys')
                if (fs.existsSync(legacyKeysDir)) {
                    const keyFiles = fs.readdirSync(legacyKeysDir)
                    for (const keyFile of keyFiles) {
                        const src = path.join(legacyKeysDir, keyFile)
                        const dest = path.join(this.sharedKeysDir, keyFile.replace('rangercode_chat', 'master'))
                        if (!fs.existsSync(dest)) {
                            fs.copyFileSync(src, dest)
                            fs.chmodSync(dest, keyFile.includes('private') ? 0o600 : 0o644)
                        }
                    }
                }

                // Save app-specific settings
                if (legacyStorage.settings) {
                    const appSettingsFile = path.join(this.sharedAppDir, 'settings.json')
                    fs.writeFileSync(appSettingsFile, JSON.stringify(legacyStorage.settings, null, 2))
                }

                console.log('[IdentityService] Migration complete!')
            } catch (error) {
                console.error('[IdentityService] Migration failed:', error)
            }
        }
    }

    /**
     * Generate a fun random username
     */
    generateRandomUsername(): string {
        const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
        const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
        const num = Math.floor(Math.random() * 100)
        return `${adj}${noun}${num}`
    }

    /**
     * Detect hardware fingerprint (cross-platform)
     */
    private getHardwareFingerprint(): { fingerprint: string; details: any } {
        const platform = os.platform()
        let hardwareId = ''
        let details: any = {
            system: platform,
            machine: os.arch(),
            hostname: os.hostname()
        }

        try {
            if (platform === 'darwin') {
                // macOS: Get Hardware UUID
                const output = execSync('system_profiler SPHardwareDataType', { encoding: 'utf8' })
                const match = output.match(/Hardware UUID:\s*(.+)/)
                if (match) hardwareId = match[1].trim()

                // Get machine type (M1, M2, etc.)
                try {
                    const cpuOutput = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' })
                    details.cpu = cpuOutput.trim()
                } catch {}

            } else if (platform === 'win32') {
                // Windows: Get Machine GUID or BIOS Serial
                try {
                    const output = execSync('wmic csproduct get uuid', { encoding: 'utf8' })
                    const lines = output.trim().split('\n')
                    if (lines.length > 1) {
                        hardwareId = lines[1].trim()
                    }
                } catch {
                    // Fallback to hostname + username combo
                    hardwareId = `${os.hostname()}-${os.userInfo().username}`
                }

                // Get processor info
                try {
                    const cpuOutput = execSync('wmic cpu get name', { encoding: 'utf8' })
                    const cpuLines = cpuOutput.trim().split('\n')
                    if (cpuLines.length > 1) details.cpu = cpuLines[1].trim()
                } catch {}

            } else {
                // Linux: Get machine-id
                try {
                    hardwareId = fs.readFileSync('/etc/machine-id', 'utf8').trim()
                } catch {
                    // Fallback
                    hardwareId = `${os.hostname()}-${os.userInfo().username}`
                }
            }
        } catch (error) {
            console.error('Hardware detection error:', error)
            hardwareId = `fallback-${os.hostname()}-${Date.now()}`
        }

        // Create fingerprint hash
        const fingerprint = crypto
            .createHash('sha256')
            .update(hardwareId + os.hostname() + os.userInfo().username)
            .digest('hex')
            .substring(0, 32)

        return { fingerprint, details }
    }

    /**
     * Generate a new user identity
     */
    generateIdentity(username?: string): UserIdentity {
        const { fingerprint, details } = this.getHardwareFingerprint()
        const displayName = username || this.generateRandomUsername()

        // Create nodeId compatible with RangerBlock format
        const nodeId = `rangerplex_${displayName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${crypto.randomBytes(4).toString('hex')}`

        // Create unique userId based on hardware
        const userId = `rclite_${fingerprint.substring(0, 16)}`

        const identity: UserIdentity = {
            userId,
            nodeId,
            username: displayName,
            created: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            hardwareFingerprint: fingerprint,
            platform: {
                system: details.system,
                machine: details.machine,
                hostname: details.hostname
            },
            version: '1.2.0',
            appType: 'ranger-chat-lite'
        }

        return identity
    }

    /**
     * Generate RSA keypair for message signing (RangerPlex compatible)
     * Now supports both shared (~/.rangerblock/keys/) and legacy locations
     */
    private generateKeypair(namePrefix: string): void {
        // Determine which directory to use based on prefix
        const keysDir = namePrefix === 'master'
            ? this.sharedKeysDir
            : path.join(this.personalDir, 'keys')

        const privatePath = path.join(keysDir, `${namePrefix}_private_key.pem`)
        const publicPath = path.join(keysDir, `${namePrefix}_public_key.pem`)

        // Don't regenerate if keys exist
        if (fs.existsSync(privatePath) && fs.existsSync(publicPath)) {
            return
        }

        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        })

        // Save with appropriate permissions
        fs.writeFileSync(privatePath, privateKey, { mode: 0o600 })
        fs.writeFileSync(publicPath, publicKey, { mode: 0o644 })
    }

    /**
     * Load existing identity or return null
     * Checks shared storage first, then legacy
     */
    loadIdentity(): IdentityStorage | null {
        try {
            // First check shared storage (~/.rangerblock/)
            if (fs.existsSync(this.sharedIdentityFile)) {
                const data = fs.readFileSync(this.sharedIdentityFile, 'utf8')
                const identity = JSON.parse(data)

                // Load app-specific settings
                const settingsFile = path.join(this.sharedAppDir, 'settings.json')
                let settings = {
                    theme: 'classic',
                    soundEnabled: true,
                    notificationsEnabled: true
                }
                if (fs.existsSync(settingsFile)) {
                    settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
                }

                // Load stats from legacy if available
                let stats = {
                    messagesSent: identity.messagesSent || 0,
                    sessionsCount: identity.sessionsCount || 1,
                    firstSeen: identity.created
                }

                return { identity, settings, stats }
            }

            // Fallback to legacy storage
            if (fs.existsSync(this.legacyIdentityFile)) {
                const data = fs.readFileSync(this.legacyIdentityFile, 'utf8')
                return JSON.parse(data)
            }
        } catch (error) {
            console.error('Error loading identity:', error)
        }
        return null
    }

    /**
     * Save identity to storage and create RangerPlex-compatible files
     * Now saves to shared ~/.rangerblock/ storage
     */
    saveIdentity(identity: UserIdentity, settings?: any): void {
        const finalSettings = settings || {
            theme: 'classic',
            soundEnabled: true,
            notificationsEnabled: true
        }

        // Update lastSeen
        identity.lastSeen = new Date().toISOString()

        // Load public key if we have one
        const publicKeyPath = path.join(this.sharedKeysDir, 'master_public_key.pem')
        if (fs.existsSync(publicKeyPath) && !identity.publicKey) {
            identity.publicKey = fs.readFileSync(publicKeyPath, 'utf8')
        }

        // Save to shared storage (~/.rangerblock/)
        fs.writeFileSync(this.sharedIdentityFile, JSON.stringify(identity, null, 2), { mode: 0o600 })

        // Save app-specific settings
        const appSettingsFile = path.join(this.sharedAppDir, 'settings.json')
        fs.writeFileSync(appSettingsFile, JSON.stringify(finalSettings, null, 2))

        // Also save to legacy location for backward compatibility
        const legacyStorage: IdentityStorage = {
            identity,
            settings: finalSettings,
            stats: {
                messagesSent: identity.messagesSent || 0,
                sessionsCount: identity.sessionsCount || 1,
                firstSeen: identity.created
            }
        }
        fs.writeFileSync(this.legacyIdentityFile, JSON.stringify(legacyStorage, null, 2))

        // Also create RangerPlex-compatible node_identity.json
        const nodeIdentity = {
            nodeID: identity.nodeId,
            nodeName: identity.username,
            nodeType: 'lite-client',
            created: identity.created,
            hardwareFingerprint: identity.hardwareFingerprint,
            platform: identity.platform,
            version: identity.version,
            blockchain: 'rangerplex',
            network: 'rangerplex_mainnet',
            source: 'ranger-chat-lite',
            publicKey: identity.publicKey,
            mission: {
                primary: 'Transform disabilities into superpowers',
                philosophy: 'One foot in front of the other - David Keane'
            }
        }

        const nodeIdentityPath = path.join(this.personalDir, 'node_identity.json')
        fs.writeFileSync(nodeIdentityPath, JSON.stringify(nodeIdentity, null, 2))

        // Generate keypair if not exists (in shared location)
        this.generateKeypair('master')
        // Also generate in legacy location for backward compatibility
        this.generateKeypair('rangercode_chat')
    }

    /**
     * Update just the username (keep same userId/nodeId)
     */
    updateUsername(newUsername: string): UserIdentity | null {
        const storage = this.loadIdentity()
        if (!storage) return null

        storage.identity.username = newUsername
        storage.identity.lastSeen = new Date().toISOString()

        this.saveIdentity(storage.identity, storage.settings)
        return storage.identity
    }

    /**
     * Increment message count
     */
    recordMessage(): void {
        const storage = this.loadIdentity()
        if (storage) {
            storage.stats.messagesSent++
            fs.writeFileSync(this.identityFile, JSON.stringify(storage, null, 2))
        }
    }

    /**
     * Get or create identity
     */
    getOrCreateIdentity(username?: string): UserIdentity {
        const existing = this.loadIdentity()

        if (existing) {
            // Update lastSeen and session count
            existing.identity.lastSeen = new Date().toISOString()
            existing.stats.sessionsCount++
            fs.writeFileSync(this.identityFile, JSON.stringify(existing, null, 2))
            return existing.identity
        }

        // Create new identity
        const identity = this.generateIdentity(username)
        this.saveIdentity(identity)
        return identity
    }

    /**
     * Check if identity exists (in shared or legacy storage)
     */
    hasIdentity(): boolean {
        return fs.existsSync(this.sharedIdentityFile) || fs.existsSync(this.legacyIdentityFile)
    }

    /**
     * Get storage paths (for Settings UI)
     */
    getPaths(): {
        storageDir: string
        personalDir: string
        identityFile: string
        sharedDir: string
        keysDir: string
    } {
        return {
            storageDir: this.legacyStorageDir,
            personalDir: this.personalDir,
            identityFile: this.sharedIdentityFile,
            sharedDir: RANGERBLOCK_HOME,
            keysDir: this.sharedKeysDir
        }
    }

    /**
     * Check if RangerPlex is installed
     */
    isRangerPlexInstalled(): boolean {
        const rangerplexPaths = [
            path.join(os.homedir(), '.rangerplex'),
            path.join(RANGERBLOCK_HOME, 'apps', 'rangerplex', 'settings.json')
        ]
        return rangerplexPaths.some(p => fs.existsSync(p))
    }

    /**
     * Get the public key for signing
     */
    getPublicKey(): string | null {
        const publicKeyPath = path.join(this.sharedKeysDir, 'master_public_key.pem')
        if (fs.existsSync(publicKeyPath)) {
            return fs.readFileSync(publicKeyPath, 'utf8')
        }
        return null
    }

    /**
     * Sign a message with the private key
     */
    signMessage(message: string): string | null {
        const privateKeyPath = path.join(this.sharedKeysDir, 'master_private_key.pem')
        if (!fs.existsSync(privateKeyPath)) {
            return null
        }

        try {
            const privateKey = fs.readFileSync(privateKeyPath, 'utf8')
            const sign = crypto.createSign('sha256')
            sign.update(message)
            sign.end()
            return sign.sign(privateKey).toString('base64')
        } catch (error) {
            console.error('Error signing message:', error)
            return null
        }
    }

    /**
     * Export identity for backup
     */
    exportIdentity(): string | null {
        const storage = this.loadIdentity()
        if (!storage) return null
        return JSON.stringify(storage, null, 2)
    }

    /**
     * Reset identity (for testing/debugging)
     */
    resetIdentity(): void {
        if (fs.existsSync(this.identityFile)) {
            fs.unlinkSync(this.identityFile)
        }
        // Note: We keep .personal folder and keys for RangerPlex compatibility
    }
}

// Export singleton
export const identityService = new IdentityService()
export default identityService

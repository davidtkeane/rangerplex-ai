/**
 * 🎖️ RANGERCHAT LITE - IDENTITY SERVICE
 * ======================================
 * Manages user identity compatible with RangerPlex/RangerBlock
 *
 * Features:
 * - Cross-platform hardware detection (Windows/Mac/Linux)
 * - Persistent identity storage in Electron userData
 * - RangerPlex .personal folder compatibility
 * - Fun username generator
 * - Admin tracking for moderation (ban/warn/timeout)
 */

import { app } from 'electron'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import * as os from 'os'

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
    private storageDir: string
    private identityFile: string
    private personalDir: string  // RangerPlex compatible .personal folder

    constructor() {
        // Use Electron's userData folder for persistence
        this.storageDir = path.join(app.getPath('userData'), 'identity')
        this.identityFile = path.join(this.storageDir, 'user_identity.json')

        // Also create RangerPlex-compatible .personal folder
        this.personalDir = path.join(app.getPath('userData'), '.personal')

        // Ensure directories exist
        this.ensureDirectories()
    }

    private ensureDirectories(): void {
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true })
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
     */
    private generateKeypair(namePrefix: string): void {
        const keysDir = path.join(this.personalDir, 'keys')
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

        fs.writeFileSync(privatePath, privateKey)
        fs.writeFileSync(publicPath, publicKey)
    }

    /**
     * Load existing identity or return null
     */
    loadIdentity(): IdentityStorage | null {
        try {
            if (fs.existsSync(this.identityFile)) {
                const data = fs.readFileSync(this.identityFile, 'utf8')
                return JSON.parse(data)
            }
        } catch (error) {
            console.error('Error loading identity:', error)
        }
        return null
    }

    /**
     * Save identity to storage and create RangerPlex-compatible files
     */
    saveIdentity(identity: UserIdentity, settings?: any): void {
        const storage: IdentityStorage = {
            identity,
            settings: settings || {
                theme: 'classic',
                soundEnabled: true,
                notificationsEnabled: true
            },
            stats: {
                messagesSent: 0,
                sessionsCount: 1,
                firstSeen: identity.created
            }
        }

        // Update lastSeen
        storage.identity.lastSeen = new Date().toISOString()

        // Save to Electron userData
        fs.writeFileSync(this.identityFile, JSON.stringify(storage, null, 2))

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
            mission: {
                primary: 'Transform disabilities into superpowers',
                philosophy: 'One foot in front of the other - David Keane'
            }
        }

        const nodeIdentityPath = path.join(this.personalDir, 'node_identity.json')
        fs.writeFileSync(nodeIdentityPath, JSON.stringify(nodeIdentity, null, 2))

        // Generate chat keypair if not exists
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
     * Check if identity exists
     */
    hasIdentity(): boolean {
        return fs.existsSync(this.identityFile)
    }

    /**
     * Get storage paths (for Settings UI)
     */
    getPaths(): { storageDir: string; personalDir: string; identityFile: string } {
        return {
            storageDir: this.storageDir,
            personalDir: this.personalDir,
            identityFile: this.identityFile
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

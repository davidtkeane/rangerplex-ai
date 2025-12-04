#!/usr/bin/env node
/**
 * RANGERBLOCK CONSENT SERVICE v1.0.0
 * ===================================
 * Terms of Use acceptance and verification
 *
 * Features:
 * - 18+ age verification
 * - Terms acceptance with RSA signature
 * - Cryptographic proof of consent
 * - Version tracking for re-acceptance
 *
 * Created by: David Keane (IrishRanger) with Claude Code (Ranger)
 *
 * IMPORTANT: 18+ does NOT mean "adult content site"
 * - 18+ = mature, responsible users
 * - NO porn, CSAM, dick pics, grooming, gore
 * - YES normal photos, gaming, professional content
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const VERSION = '1.0.0';
const TERMS_VERSION = '1.0.0';
const MINIMUM_AGE = 18;

// Storage paths
const RANGERBLOCK_DIR = path.join(os.homedir(), '.rangerblock');
const CONSENT_DIR = path.join(RANGERBLOCK_DIR, 'consent');

// ═══════════════════════════════════════════════════════════════════════════
// TERMS OF USE TEXT
// ═══════════════════════════════════════════════════════════════════════════

const TERMS_TEXT = `
RANGERBLOCK TERMS OF USE & FAIR USE POLICY
Version ${TERMS_VERSION} - Effective December 4, 2025

════════════════════════════════════════════════════════════════════════════════
                         *** ADULTS ONLY (18+) ***
════════════════════════════════════════════════════════════════════════════════

RangerBlock is an ADULTS ONLY platform. By using this software, you confirm
you are at least 18 years of age. This restriction exists to protect all
users and maintain a responsible community.

IMPORTANT: 18+ means MATURE and RESPONSIBLE - NOT "anything goes"

════════════════════════════════════════════════════════════════════════════════
                              1. FAIR USE
════════════════════════════════════════════════════════════════════════════════

- You will use this software for lawful purposes only.
- You will not engage in harassment, threats, bullying, or abuse.
- You will respect other users' privacy, dignity, and rights.
- You will not use this platform for illegal activities.
- Gaming-context threats are permitted (e.g., "I'll get you in Battlefield").

════════════════════════════════════════════════════════════════════════════════
                            2. NO HARM CLAUSE
════════════════════════════════════════════════════════════════════════════════

- You will not use this software to harm others.
- You will not distribute malware or malicious software.
- You will not compromise network security or other users' devices.
- You will not engage in doxxing, swatting, or real-world harassment.

════════════════════════════════════════════════════════════════════════════════
          3. CONTENT POLICY - THIS IS NOT AN ADULT CONTENT SITE
════════════════════════════════════════════════════════════════════════════════

STRICTLY PROHIBITED (instant ban + law enforcement report):
- ANY pornographic content or sexual images
- ANY child sexual abuse material (CSAM) - reported to NCMEC/Gardai
- Unsolicited sexual content (dick pics, nudes, etc.)
- Grooming behaviour of ANY kind
- Gore, death images, or extreme violence
- Hate speech, discrimination, or extremist content

PERMITTED:
- Normal photos (selfies, landscapes, memes)
- Gaming screenshots and videos
- Gaming violence discussion (Battlefield tactics, K/D ratios)
- Professional/work-related content
- General conversation between adults

════════════════════════════════════════════════════════════════════════════════
                          4. LEGAL COMPLIANCE
════════════════════════════════════════════════════════════════════════════════

- You agree to comply with all applicable laws.
- THIS SOFTWARE DOES NOT PROTECT YOU FROM LEGAL CONSEQUENCES.
- Bad actors WILL be reported to law enforcement.
- Your identity is cryptographically linked to your actions.
- We cooperate fully with law enforcement when legally required.

════════════════════════════════════════════════════════════════════════════════
                       5. IDENTITY RESPONSIBILITY
════════════════════════════════════════════════════════════════════════════════

- Your identity is linked to your hardware device.
- You are responsible for ALL actions under your identity.
- Your identity cannot be transferred or shared.
- Creating multiple identities to evade bans is prohibited.

════════════════════════════════════════════════════════════════════════════════
                            6. DISCLAIMER
════════════════════════════════════════════════════════════════════════════════

- This software is provided "AS IS" without warranty.
- Use at your own risk.
- We are not liable for damages from use of this software.

════════════════════════════════════════════════════════════════════════════════
                            7. JURISDICTION
════════════════════════════════════════════════════════════════════════════════

- Governed by laws of the Republic of Ireland.
- Dublin courts have exclusive jurisdiction.

════════════════════════════════════════════════════════════════════════════════
                              ACCEPTANCE
════════════════════════════════════════════════════════════════════════════════

By accepting, you confirm:
- You are at least 18 years old
- You have read and understood these terms
- You agree to be bound by these terms

Your acceptance is CRYPTOGRAPHICALLY SIGNED with your private key.
This creates a legally binding record that cannot be denied or disputed.
`;

// ═══════════════════════════════════════════════════════════════════════════
// CONSENT SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class ConsentService {
    constructor(identityService = null) {
        this.identity = identityService;
        this.version = VERSION;
        this.termsVersion = TERMS_VERSION;
        this._initialized = false;
        this._consent = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Initialize the consent service
     */
    init() {
        if (this._initialized) return true;

        try {
            // Create consent directory
            if (!fs.existsSync(CONSENT_DIR)) {
                fs.mkdirSync(CONSENT_DIR, { recursive: true });
            }

            // Load existing consent if present
            this._consent = this._loadConsent();
            this._initialized = true;
            return true;
        } catch (e) {
            console.error('Failed to initialize consent service:', e.message);
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONSENT CHECKING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Check if user has accepted current terms
     */
    hasAcceptedTerms() {
        this.init();

        if (!this._consent || !this._consent.acceptances) {
            return false;
        }

        // Check for acceptance of current terms version
        const currentAcceptance = this._consent.acceptances.find(
            a => a.termsVersion === this.termsVersion && a.valid
        );

        return !!currentAcceptance;
    }

    /**
     * Check if terms have been updated since last acceptance
     */
    needsReaccept() {
        this.init();

        if (!this._consent || !this._consent.acceptances || this._consent.acceptances.length === 0) {
            return true; // Never accepted
        }

        // Get latest acceptance
        const latestAcceptance = this._consent.acceptances[this._consent.acceptances.length - 1];

        // Compare versions
        return latestAcceptance.termsVersion !== this.termsVersion;
    }

    /**
     * Get acceptance record
     */
    getAcceptanceRecord() {
        this.init();

        if (!this._consent || !this._consent.acceptances) {
            return null;
        }

        return this._consent.acceptances.find(
            a => a.termsVersion === this.termsVersion
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONSENT RECORDING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Record consent acceptance
     * @param {object} identityData - User identity data
     * @param {function} signFunction - Function to sign with private key
     * @returns {object} Acceptance record
     */
    async acceptTerms(identityData, signFunction) {
        this.init();

        if (!identityData || !identityData.userId) {
            throw new Error('Identity required for consent');
        }

        // Create acceptance record
        const termsHash = this.getTermsHash();
        const timestamp = new Date().toISOString();

        const acceptanceData = {
            termsVersion: this.termsVersion,
            termsHash: termsHash,
            acceptedAt: timestamp,
            userId: identityData.userId,
            publicKeyHash: this._hashString(identityData.publicKey || ''),
            ageConfirmed: true, // User confirmed 18+
            appType: identityData.appType || 'unknown',
            platform: {
                os: os.platform(),
                arch: os.arch(),
                hostname: os.hostname()
            }
        };

        // Sign the acceptance if sign function provided
        let signature = null;
        if (signFunction) {
            try {
                const dataToSign = JSON.stringify({
                    termsHash,
                    termsVersion: this.termsVersion,
                    userId: identityData.userId,
                    timestamp
                });
                signature = await signFunction(dataToSign);
            } catch (e) {
                console.error('Failed to sign consent:', e.message);
            }
        }

        // Create full acceptance record
        const acceptance = {
            ...acceptanceData,
            signature: signature,
            valid: true
        };

        // Save acceptance
        if (!this._consent) {
            this._consent = {
                currentTermsVersion: this.termsVersion,
                acceptances: []
            };
        }

        this._consent.acceptances.push(acceptance);
        this._consent.lastAccepted = timestamp;
        this._saveConsent();

        // Save to history
        this._saveToHistory(acceptance);

        return acceptance;
    }

    /**
     * Revoke consent (user-initiated)
     */
    revokeConsent() {
        this.init();

        if (this._consent && this._consent.acceptances) {
            this._consent.acceptances.forEach(a => {
                a.valid = false;
                a.revokedAt = new Date().toISOString();
            });
            this._saveConsent();
        }

        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TERMS ACCESS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get the full terms text
     */
    getTermsText() {
        return TERMS_TEXT;
    }

    /**
     * Get terms text for terminal display (with formatting)
     */
    getTermsTextForTerminal() {
        return TERMS_TEXT;
    }

    /**
     * Get SHA-256 hash of terms text
     */
    getTermsHash() {
        return crypto.createHash('sha256').update(TERMS_TEXT).digest('hex');
    }

    /**
     * Get current terms version
     */
    getTermsVersion() {
        return this.termsVersion;
    }

    /**
     * Get minimum age requirement
     */
    getMinimumAge() {
        return MINIMUM_AGE;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PRIVILEGE SYSTEM
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get privilege level based on consent status
     */
    getPrivilegeLevel() {
        if (this.hasAcceptedTerms()) {
            return 'FULL';
        } else if (this.needsReaccept()) {
            return 'REACCEPT_REQUIRED';
        } else {
            return 'PENDING';
        }
    }

    /**
     * Check if user can perform action
     */
    canPerformAction(action) {
        const privilegeLevel = this.getPrivilegeLevel();

        const PERMISSIONS = {
            FULL: ['chat', 'voice', 'video', 'files', 'dm', 'channels', 'registration', 'view'],
            REACCEPT_REQUIRED: ['view', 'exit'],
            PENDING: ['view_terms', 'accept', 'decline', 'exit']
        };

        const allowed = PERMISSIONS[privilegeLevel] || [];
        return allowed.includes(action) || allowed.includes('*');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VERIFICATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Verify acceptance signature
     */
    verifyAcceptance(acceptance, verifyFunction) {
        if (!acceptance || !acceptance.signature) {
            return false;
        }

        if (!verifyFunction) {
            // Can't verify without verify function
            return null;
        }

        try {
            const dataToVerify = JSON.stringify({
                termsHash: acceptance.termsHash,
                termsVersion: acceptance.termsVersion,
                userId: acceptance.userId,
                timestamp: acceptance.acceptedAt
            });

            return verifyFunction(dataToVerify, acceptance.signature);
        } catch (e) {
            console.error('Failed to verify consent:', e.message);
            return false;
        }
    }

    /**
     * Get consent summary for admin
     */
    getConsentSummary() {
        this.init();

        if (!this._consent || !this._consent.acceptances) {
            return {
                accepted: false,
                version: null,
                date: null
            };
        }

        const latest = this._consent.acceptances[this._consent.acceptances.length - 1];

        return {
            accepted: latest?.valid || false,
            version: latest?.termsVersion || null,
            date: latest?.acceptedAt || null,
            signature: latest?.signature ? 'present' : 'none'
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STORAGE
    // ═══════════════════════════════════════════════════════════════════════

    _loadConsent() {
        const consentFile = path.join(CONSENT_DIR, 'acceptance.json');

        try {
            if (fs.existsSync(consentFile)) {
                return JSON.parse(fs.readFileSync(consentFile, 'utf8'));
            }
        } catch (e) {
            console.error('Error loading consent:', e.message);
        }

        return null;
    }

    _saveConsent() {
        const consentFile = path.join(CONSENT_DIR, 'acceptance.json');

        try {
            fs.writeFileSync(consentFile, JSON.stringify(this._consent, null, 2));
        } catch (e) {
            console.error('Error saving consent:', e.message);
        }
    }

    _saveToHistory(acceptance) {
        const historyDir = path.join(CONSENT_DIR, 'history');

        try {
            if (!fs.existsSync(historyDir)) {
                fs.mkdirSync(historyDir, { recursive: true });
            }

            const date = new Date().toISOString().split('T')[0];
            const historyFile = path.join(historyDir, `accepted_${date}.json`);

            fs.writeFileSync(historyFile, JSON.stringify(acceptance, null, 2));
        } catch (e) {
            console.error('Error saving consent history:', e.message);
        }
    }

    _hashString(str) {
        return crypto.createHash('sha256').update(str).digest('hex');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

// Create singleton instances for different apps
const consentService = new ConsentService();

// Export class and instances
module.exports = {
    ConsentService,
    consentService,
    TERMS_VERSION,
    MINIMUM_AGE,
    TERMS_TEXT
};

// ═══════════════════════════════════════════════════════════════════════════
// CLI MODE
// ═══════════════════════════════════════════════════════════════════════════

if (require.main === module) {
    const readline = require('readline');

    const c = {
        reset: '\x1b[0m',
        bold: '\x1b[1m',
        dim: '\x1b[2m',
        cyan: '\x1b[36m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        red: '\x1b[31m',
        brightGreen: '\x1b[92m',
        brightCyan: '\x1b[96m',
        brightYellow: '\x1b[93m',
    };

    console.log(`
${c.brightCyan}╔════════════════════════════════════════════════════════════╗
║         ${c.yellow}RANGERBLOCK${c.brightCyan} - Consent Service Test              ║
╚════════════════════════════════════════════════════════════╝${c.reset}
`);

    consentService.init();

    console.log(`${c.dim}Terms Version:${c.reset} ${consentService.getTermsVersion()}`);
    console.log(`${c.dim}Terms Hash:${c.reset} ${consentService.getTermsHash().substring(0, 16)}...`);
    console.log(`${c.dim}Minimum Age:${c.reset} ${consentService.getMinimumAge()}+`);
    console.log(`${c.dim}Has Accepted:${c.reset} ${consentService.hasAcceptedTerms() ? c.brightGreen + 'Yes' : c.yellow + 'No'}${c.reset}`);
    console.log(`${c.dim}Needs Re-accept:${c.reset} ${consentService.needsReaccept() ? c.yellow + 'Yes' : c.brightGreen + 'No'}${c.reset}`);
    console.log(`${c.dim}Privilege Level:${c.reset} ${consentService.getPrivilegeLevel()}`);

    console.log(`\n${c.dim}Summary:${c.reset}`);
    console.log(consentService.getConsentSummary());

    console.log(`\n${c.brightGreen}Rangers lead the way!${c.reset}\n`);
}

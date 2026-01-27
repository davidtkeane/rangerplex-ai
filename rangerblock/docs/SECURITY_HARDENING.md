# RangerBlock Security Hardening Guide

> **Version**: 1.0.0
> **Last Updated**: January 27, 2026
> **Created by**: David Keane (IrishRanger) with Claude Code (Ranger)

---

## Overview

This document describes the security hardening measures implemented in RangerBlock to prevent identity theft and ensure secure operation of the peer-to-peer network.

---

## Security Vulnerabilities (FIXED)

### Previous Vulnerabilities in `identity-service.cjs`

| Vulnerability | Severity | Status |
|--------------|----------|--------|
| Hardware ID spoofing via hostname | **CRITICAL** | FIXED |
| Hardware ID spoofing via username | **CRITICAL** | FIXED |
| Private keys stored unencrypted | **HIGH** | FIXED |
| Identity JSON in plaintext | **HIGH** | FIXED |
| Trust based on hostname check | **MEDIUM** | FIXED |
| No cryptographic hardware binding | **HIGH** | FIXED |
| Session tokens not hardware-bound | **MEDIUM** | FIXED |

### How Each Was Fixed

#### 1. Hardware ID Spoofing (FIXED)

**Before**: Used hostname + username in fingerprint
```javascript
// OLD (INSECURE) - trivially spoofed
components.push(os.hostname());  // sudo scutil --set HostName
components.push(os.userInfo().username);  // create new user
```

**After**: Uses immutable hardware UUID
```javascript
// NEW (SECURE) - burned into hardware, cannot be changed
const hwUuid = hardware.getHardwareUuid();  // IOPlatformUUID on macOS
// Windows: BIOS UUID + motherboard serial
// Linux: DMI product UUID
```

#### 2. Private Keys Now Encrypted (FIXED)

**Before**: Raw PEM files on disk
```
~/.rangerblock/keys/master_private_key.pem  (PLAINTEXT!)
```

**After**: AES-256-GCM encrypted with hardware-derived key
```
~/.rangerblock-secure/secure_keys.enc  (ENCRYPTED)
```

The encryption key is derived from:
- Hardware UUID (burned into device)
- Master salt (random, stored separately)
- PBKDF2 with 100,000 iterations

**Even if someone copies the encrypted file, they CANNOT decrypt it without the original hardware.**

#### 3. Identity Storage Now Encrypted (FIXED)

**Before**: Plaintext JSON
```json
// ~/.rangerblock/identity/master_identity.json (EXPOSED!)
{
  "userId": "rb_...",
  "hardwareFingerprint": "...",
  "privateKey": "..."
}
```

**After**: AES-256-GCM encrypted
```
~/.rangerblock-secure/secure_identity.enc (ENCRYPTED)
```

#### 4. Hardware Attestation Added (NEW)

When identity is created, a hardware attestation is generated and signed:

```javascript
const attestation = {
    hardwareUuid: "A794987C-E1B2-5677-A...",  // Immutable
    cpuModel: "Apple M3 Pro",                   // Stable
    cpuCount: 12,                               // Stable
    totalMemory: 19327352832,                   // Stable
    arch: "arm64",                              // Stable
    // ... more stable identifiers
};

// Signed with private key - binds key to hardware
const signature = sign(JSON.stringify(attestation), privateKey);
```

On every startup, attestation is verified:
- Match score calculated (0-100%)
- Score < 70% triggers security warning
- Score < 50% could block access entirely

#### 5. Session Tokens Hardware-Bound (NEW)

Session tokens now include hardware hash:

```javascript
const token = {
    userId: "rbs_...",
    hardwareHash: "5ad2fa96e7fe12c3",  // Derived from hardware UUID
    iat: 1706400000000,
    exp: 1706486400000
};
// Signed with RSA-2048
```

If someone steals a token and uses it on different hardware:
```javascript
verifySessionToken(token, publicKey);
// Result: { valid: false, reason: 'hardware_mismatch' }
```

---

## Secure Identity Module

### Location
```
rangerblock/lib/secure-identity.cjs
```

### Usage

```javascript
const { SecureIdentityService } = require('./lib/secure-identity.cjs');

// Create secure identity service
const identity = new SecureIdentityService('my-app');

// Initialize (with optional master password for extra security)
await identity.init();
// OR with master password:
await identity.init('super-secret-password');

// Get or create identity
const myIdentity = await identity.getOrCreateIdentity('MyUsername');

// Sign messages
const signature = identity.signMessage('Hello, World!');

// Create hardware-bound session token
const token = identity.createSessionToken();

// Verify identity integrity
const report = identity.verifyIdentityIntegrity();
console.log(`Score: ${report.score}/100`);
console.log(`Valid: ${report.valid}`);
```

### Security Features

| Feature | Description |
|---------|-------------|
| Hardware Attestation | Keys cryptographically bound to hardware |
| Encrypted Keys | AES-256-GCM with hardware-derived key |
| Encrypted Identity | All sensitive data encrypted at rest |
| Hardware Verification | Checks hardware on every startup |
| Session Binding | Tokens tied to specific hardware |
| Audit Logging | All security events logged |

---

## Storage Locations

### Secure Storage (NEW)
```
~/.rangerblock-secure/
├── .master_salt           # Random salt (never share!)
├── secure_identity.enc    # Encrypted identity
├── secure_keys.enc        # Encrypted keys
├── hardware_attestation.json  # Hardware proof
└── security_audit.log     # Security events
```

### Legacy Storage (still exists for compatibility)
```
~/.rangerblock/
├── identity/
│   └── master_identity.json  # DEPRECATED - use secure
├── keys/
│   ├── master_private_key.pem  # DEPRECATED - use secure
│   └── master_public_key.pem
└── ...
```

---

## Migration Guide

### For Existing Users

1. **Backup existing identity** (optional):
   ```bash
   cp -r ~/.rangerblock ~/.rangerblock-backup
   ```

2. **Start using secure identity**:
   ```javascript
   const { SecureIdentityService } = require('./lib/secure-identity.cjs');
   const secureId = new SecureIdentityService('my-app');
   await secureId.init();
   ```

3. **New identity will be created** with hardware attestation

4. **Old identity remains** for compatibility (can be deleted later)

### For New Users

New users automatically get the secure identity when using `secure-identity.cjs`.

---

## Threat Model

### What We Protect Against

| Threat | Protection |
|--------|------------|
| Someone copies your identity files | Encrypted with hardware key |
| Attacker spoofs hostname | Hostname not used in secure mode |
| Attacker creates new user account | Username not used in secure mode |
| Stolen session token | Hardware binding verification |
| VM cloning attack | Hardware UUID differs in VMs |
| Replay attacks | Tokens have expiration |

### What We DON'T Protect Against

| Threat | Why |
|--------|-----|
| Physical access to running machine | If they have your unlocked computer, game over |
| Root/Admin access | Can extract memory, read process |
| Hardware key extraction | TPM not used (future improvement) |
| Quantum computing | RSA-2048 vulnerable in future |

---

## Security Recommendations

### For Users

1. **Use a master password** for extra security:
   ```javascript
   await identity.init('my-strong-password');
   ```

2. **Don't share your ~/.rangerblock-secure folder**

3. **Regularly check integrity**:
   ```javascript
   const report = identity.verifyIdentityIntegrity();
   if (!report.valid) {
       console.warn('Security issue detected!', report.issues);
   }
   ```

### For Developers

1. **Always use SecureIdentityService** for new code
2. **Migrate away from identity-service.cjs** for production
3. **Log all authentication failures**
4. **Implement rate limiting** on authentication endpoints

---

## Testing

Run the secure identity test:
```bash
cd rangerblock
node lib/secure-identity.cjs
```

Expected output:
```
🔐 RANGERBLOCK SECURE IDENTITY TEST

1. Testing secure hardware identification...
   Hardware UUID: A794987C-E1B2-5677-A...
   Platform: darwin
   CPU: Apple M3 Pro...

2. Testing secure identity service...
   Init: ✅ Success

3. Getting/creating secure identity...
   User ID:  rbs_021a932607637b2b
   Security: {"hardwareAttested":true,"keyBound":true,"encryptedStorage":true}

4. Testing message signing...
   Valid: ✅ YES

5. Testing hardware-bound session token...
   Valid: ✅ YES

6. Verifying identity integrity...
   Score: 100/100
   Valid: ✅ YES

🎖️ Rangers lead the way!
```

---

## VM Detection & Security

### How VM Detection Works

The secure identity module automatically detects if it's running in a Virtual Machine using multiple detection methods:

| Method | What It Checks |
|--------|----------------|
| System Model | Checks for "Virtual", "VMware", "VirtualBox" in model name |
| MAC Address | VM vendors have specific MAC prefixes (00:0c:29 = VMware, 08:00:27 = VirtualBox) |
| CPU Info | Checks for hypervisor flag in /proc/cpuinfo (Linux) |
| DMI/SMBIOS | Checks vendor info for VM indicators |
| Kernel Extensions | Checks for VMware/VirtualBox kexts (macOS) |
| Running Processes | Checks for vmtoolsd, vboxservice, etc. |

### Supported Hypervisors

| Hypervisor | Detection | UUID Support |
|------------|-----------|--------------|
| VMware Fusion/Workstation | ✅ | ✅ |
| VirtualBox | ✅ | ✅ |
| Parallels Desktop | ✅ | ✅ |
| QEMU/KVM | ✅ | ✅ |
| Hyper-V | ✅ | ✅ |
| Xen | ✅ | ✅ |

### VM Clone Protection

**Problem**: VMs can be cloned, which would duplicate the identity.

**Solution**: We generate random "VM entropy" on first run:
1. When identity is created in a VM, random entropy is generated
2. This entropy is included in the encryption key derivation
3. If the VM is cloned, the clone will have DIFFERENT entropy
4. The clone CANNOT decrypt the original identity
5. Clone detection triggers creation of a NEW identity

```
Original VM                    Cloned VM
┌────────────────────┐        ┌────────────────────┐
│ VM UUID: abc123    │        │ VM UUID: abc123    │ (same)
│ Entropy: xyz789    │───────▶│ Entropy: (new!)    │ (different)
│ Identity: Alice    │        │ Identity: (new!)   │
└────────────────────┘        └────────────────────┘
```

### VM Security Recommendations

1. **Use a master password** (even more important in VMs):
   ```javascript
   await identity.init('strong-password');
   ```

2. **Monitor for clone attempts**:
   ```javascript
   const vmInfo = identity.getVmInfo();
   if (vmInfo.isVM) {
       console.log('Running in VM - clone protection active');
   }
   ```

3. **Consider requiring master password for VMs**:
   ```javascript
   if (identity.isVirtualMachine()) {
       // Force password for VM deployments
       await identity.init(promptForPassword());
   }
   ```

---

## Future Improvements

- [ ] **TPM Integration**: Use hardware TPM for key storage
- [ ] **Secure Enclave** (macOS): Store keys in Secure Enclave
- [ ] **YubiKey Support**: Hardware token authentication
- [ ] **Post-Quantum Crypto**: Upgrade to quantum-resistant algorithms
- [ ] **Multi-Factor**: Add TOTP/WebAuthn support
- [ ] **VM Snapshot Detection**: Detect VM state restoration

---

## Changelog

### v1.1.0 (2026-01-27)
- **VM Detection**: Detects VMware, VirtualBox, Parallels, QEMU, Hyper-V, Xen
- **VM UUID Extraction**: Gets unique identifier for VMs
- **Clone Protection**: Random entropy prevents cloned VMs from using stolen identity
- **Clone Detection**: Automatically detects and handles VM clones

### v1.0.0 (2026-01-27)
- Initial secure identity module
- Hardware attestation
- Encrypted key storage
- Encrypted identity storage
- Hardware-bound session tokens
- Integrity verification

---

*"Rangers lead the way - and protect their digital identity!"* 🎖️

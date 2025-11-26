# 🔐 RangerPlex Crypto Vault Plan

**Status**: Planning  
**Manager**: Dave "Server" O'Malley (Basement IT Security)  
**Algorithm**: AES-256-GCM + Argon2id  

## 1. Executive Summary
The **Crypto Vault** is a secure, encrypted storage system for RangerPlex. It allows the user to store passwords, API keys, and sensitive notes. It is designed to be **Zero Knowledge**—even the AI cannot read the data until the user unlocks the vault with their Master Password.

## 2. Cryptographic Standards

### 2.1 Encryption: AES-256-GCM
We use **AES (Advanced Encryption Standard)** with a 256-bit key in **GCM (Galois/Counter Mode)**.
- **Why GCM?**: It provides both encryption (privacy) and authentication (integrity). If a hacker tries to modify the encrypted file, the decryption will fail instantly.
- **IV (Initialization Vector)**: A unique 96-bit random IV is generated for *every* encryption operation and stored alongside the ciphertext.

### 2.2 Key Derivation: Argon2id
We do **NOT** use the user's password directly as the encryption key. We use **Argon2id** to derive a key from the password.
- **Why Argon2id?**: It is the winner of the Password Hashing Competition. It is "memory-hard", meaning it requires significant RAM to compute. This makes it resistant to GPU/ASIC brute-force attacks.
- **Parameters**:
    - Memory: 64MB
    - Iterations: 3
    - Parallelism: 4

## 3. Architecture

### 3.1 The Vault File
Location: `./data/vault/secure_storage.json.enc`
Format:
```json
{
  "salt": "random_salt_string",
  "iv": "random_iv_string",
  "data": "encrypted_ciphertext_string",
  "authTag": "authentication_tag_string"
}
```

### 3.2 The Workflow
1.  **Unlock**: User enters Master Password.
2.  **Derive**: App reads `salt` from file, runs `Argon2id(password, salt)` to get the 32-byte Key.
3.  **Decrypt**: App runs `AES-256-GCM-Decrypt(data, key, iv, authTag)`.
4.  **Result**: If successful, the decrypted JSON (passwords/keys) is loaded into **RAM only**. It is never written to disk unencrypted.

### 3.3 Auto-Lock
- The vault automatically locks (clears RAM) after 15 minutes of inactivity or when the "Ghost Protocol" (Panic Button) is triggered.

## 4. Implementation Plan

### Phase 1: Core Crypto Module
- Create `services/cryptoService.ts`.
- Implement `encrypt(data, password)` and `decrypt(encryptedData, password)`.
- Use `libsodium` or Web Crypto API for primitives.

### Phase 2: UI Integration
- Create "Vault" tab in Settings.
- "Create Master Password" flow.
- "Unlock Vault" modal.

### Phase 3: AI Integration (Dave O'Malley)
- Dave can request access to keys (e.g., "I need the OpenAI Key").
- User must approve/unlock.
- Dave *never* stores the key in his long-term memory/context. He uses it for the session and forgets it.

## 5. Security Rules
1.  **Never log passwords**.
2.  **Never save decrypted data to disk**.
3.  **Clear clipboard** after copying a password.
4.  **Panic Button** wipes the Vault from memory immediately.

**Dave O'Malley says**: "If you lose your Master Password, your data is gone forever. Even I can't recover it. That's the point."

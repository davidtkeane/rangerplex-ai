# RangerChat Lite - Changelog

All notable changes to RangerChat Lite will be documented in this file.

---

## [1.6.0] - 2025-12-04 - "Blockchain Ledger + Smart Contracts"

### Summary
Major release combining Blockchain Ledger (immutable message storage with PoW mining) and Smart Contracts browser (7 contracts including communication protocols). Built by M3Pro + MSI collaboration!

---

### Part 1: Blockchain Ledger (MSI Implementation)

#### Blockchain Ledger Service (rangerblock/lib/ledger-service.cjs)
- **Persistent Blockchain**: All messages stored in blocks on disk
- **Proof of Work Mining**: Blocks mined with configurable difficulty
- **Merkle Trees**: Transaction verification with cryptographic proofs
- **Auto-Mining**: Mines every 10 messages or 5 minutes
- **Message Indexing**: Fast lookup by content hash, user, or channel

#### Ledger Storage Structure
- ~/.rangerblock/ledger/chain.json - Blockchain state
- ~/.rangerblock/ledger/blocks/ - Individual block files
- ~/.rangerblock/ledger/pending.json - Pending transactions
- ~/.rangerblock/ledger/wallets.json - Wallet balances (future)
- ~/.rangerblock/ledger/index/ - Quick lookup indexes

#### Transaction Types
- chat_message - Chat messages with content hash
- identity_register - New user registrations
- channel_join / channel_leave - Channel events
- token_transfer / token_mint / reward - Wallet-ready (future)

#### New IPC Handlers (14 total)
- ledger:init - Initialize the ledger
- ledger:getStatus - Chain height, pending count, stats
- ledger:addMessage - Record a message to ledger
- ledger:getBlocks - Get blocks (paginated)
- ledger:getBlock - Get specific block by index
- ledger:getMessagesByChannel - Query messages by channel
- ledger:getTransactionsByUser - Query transactions by user
- ledger:verifyMessage - Verify message exists in chain
- ledger:mineBlock - Manually trigger mining
- ledger:exportChain - Export full blockchain
- ledger:exportUserAudit - Export user's transaction history
- ledger:getBalance - Get wallet balance (future)
- ledger:addReward - Add reward to wallet (future)

#### Technical
- Genesis block created on first run (Dec 4, 2025)
- SHA-256 hashing for blocks and transactions
- Merkle root for efficient transaction verification
- Block structure: index, hash, previousHash, merkleRoot, nonce, transactions
- Configurable mining: difficulty=2, maxTxPerBlock=10, interval=5min

#### Wallet-Ready Architecture
- Balance tracking infrastructure in place
- Reward transaction type supported
- Ready for future token implementation
- Per-user wallet state persistence

---

### Part 2: Smart Contracts Browser (M3Pro Implementation)

#### Smart Contracts Section in Settings
- **New Settings Tab**: "📜 Smart Contracts" section with interactive contract browser
- **Chain Selector**: Toggle between Solana (◎) and Ethereum (⟠) views
- **Contract Cards**: Visual grid showing all available contracts
- **Contract Details Modal**: Click any contract to see full details

#### Available Contracts (7 Total)
| Contract | Category | Description |
|----------|----------|-------------|
| **RangerRegistration** | Registration | User registration + consent tracking |
| **RangerBridge** | Bridge | Cross-chain crypto conversion |
| **RangerFileTransfer** | Transfer | Formal file transfer agreements |
| **RangerToken** | Token | SPL Token with daily limits (Solana only) |
| **RangerTextChat** | Communication | COMING SOON: WHISPER Protocol |
| **RangerVoiceChat** | Communication | COMING SOON: ECHO Protocol |
| **RangerVideoChat** | Communication | COMING SOON: VISION Protocol |

#### Features
- **Contract Selection**: Select contracts for your session
- **Deploy Links**: Quick links to Solana Playground and Remix IDE
- **Feature Lists**: See all features for each contract
- **File Paths**: Shows contract file locations
- **Status Badges**: Available / Deployed / Selected indicators

#### Visual Polish
- Color-coded category badges (registration=blue, bridge=green, transfer=amber, token=purple, communication=pink)
- Chain icons with Solana purple and Ethereum blue
- Theme-aware styling (Matrix green glow, Tron cyan glow)
- Smooth modal animations

#### Technical
- New React state for contract management
- Contracts filtered by selected chain
- Modal overlay with click-outside-to-close
- Links to deployment IDEs open in new tab

---

## [1.5.0] - 2025-12-04 - "Blockchain Ledger"

*Note: This version was superseded by v1.6.0 which merged M3Pro and MSI implementations*

---

## [1.4.1] - 2025-12-04 - "Identity Bug Fix"

### Fixed
- **Critical Bug**: Fixed `ERR_INVALID_ARG_TYPE` crash on startup
  - `this.identityFile` was undefined (property never declared)
  - Affected methods: `recordMessage()`, `getOrCreateIdentity()`, `resetIdentity()`
  - Changed to use `this.legacyIdentityFile` and `this.sharedIdentityFile`
- RangerBot can now receive messages without crashing the app

---

## [1.4.0] - 2025-12-03 - "Security Foundation"

### Added

#### RangerBlock Security Library Integration
- **Shared Identity System**: Now uses unified identity from `~/.rangerblock/`
- **Hardware-Bound Identity**: Device fingerprint prevents identity theft
- **RSA-2048 Key Pairs**: Ready for message signing and encryption
- **Cross-App Sync**: Identity syncs with RangerPlex when installed

#### New Security Modules (rangerblock/lib/)
- `hardware-id.cjs` - Cross-platform hardware fingerprinting
- `crypto-utils.cjs` - RSA-2048 + AES-256-GCM encryption
- `storage-utils.cjs` - Shared storage (`~/.rangerblock/`)
- `identity-service.cjs` - Unified identity management

### Technical
- Identity now stored in `~/.rangerblock/identity/master_identity.json`
- RSA keys stored in `~/.rangerblock/keys/`
- App-specific settings in `~/.rangerblock/apps/ranger-chat-lite/`
- Supports on-chain identity registration (future feature)

### Coming Soon
- Challenge-response authentication with server
- Message signing for verified sender identity
- Encrypted private messages
- RangerPlex auto-sync on install

---

## [1.3.1] - 2025-12-03 - "Update Notifications"

### Added
- **Update Checker**: App checks GitHub for new versions on startup
- **Update Banner**: Animated banner appears when update is available
- **Update Instructions**: Settings page shows git pull commands
- **Version Display**: Shows current version (v1.3.1) dynamically
- **Theme-aware**: Update banner matches current theme colors

### Technical
- Fetches package.json from GitHub raw to compare versions
- Semantic version comparison (major.minor.patch)
- Auto-check every 30 minutes
- Dismissible banner with ✕ button

---

## [1.3.0] - 2025-12-03 - "Easy Distribution"

### Added

#### Cross-Platform Build System
- **Windows**: NSIS installer (.exe) and portable version (.zip)
- **macOS**: DMG installer for Intel (x64) and Apple Silicon (arm64)
- **Linux**: AppImage and Debian (.deb) packages
- Pre-built binaries available on GitHub Releases

#### GitHub Actions Workflow
- Automatic builds triggered by version tags (`ranger-chat-lite-v*`)
- Builds in parallel on Windows, macOS, and Linux runners
- Auto-creates GitHub Release with all platform binaries
- Release notes template with download table

#### One-Click Install Scripts
- **PowerShell (Windows)**: `irm .../install.ps1 | iex`
- **Bash (macOS/Linux)**: `curl -fsSL .../install.sh | bash`
- ASCII art banner and colored output
- Auto-detects platform and architecture
- Downloads latest release from GitHub

### Changed
- Package.json now includes full electron-builder configuration
- New build scripts: `build:win`, `build:mac`, `build:linux`, `build:all`
- Release artifacts output to `release/` folder
- Updated README with Quick Install section and download links

### Technical
- electron-builder configured for all platforms
- GitHub publish provider for auto-releases
- Custom artifact naming: `${productName}-${version}-${platform}-${arch}.${ext}`

---

## [1.2.0] - 2025-12-02 - "Blockchain Transactions"

### Added
- **Blockchain Transaction Log**: Track all messages as transactions
- **Transaction Stats**: Sent/received/total/bytes counters
- **Live Transaction Feed**: See messages flowing in real-time
- **Theme-aware**: Matrix/Tron themes with glow effects

---

## [1.1.0] - 2025-11-30 - "Emoji & Themes"

### Added
- **Emoji Picker**: 8 categories with search
- **4 Themes**: Classic, Matrix, Tron, Retro
- **Message Search**: Find messages by content or sender
- **Auto-reconnect**: Exponential backoff

---

## [1.0.0] - 2025-11-29 - "Initial Release"

### Added
- Basic chat functionality
- WebSocket connection to relay server
- Username selection
- Peer count display

---

*Rangers lead the way!*

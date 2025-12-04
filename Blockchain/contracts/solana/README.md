# RangerBlock Solana Smart Contracts

Solana/Anchor smart contracts for the RangerBlock ecosystem.

## Contracts

| Contract | File | Purpose |
|----------|------|---------|
| **RangerRegistration** | `ranger_registration.rs` | User registration with consent |
| **RangerToken** | `ranger_token.rs` | SPL token with transfer limits |

## Features

### RangerRegistration
- User registration with consent bundled
- Hardware ID tracking (ban evasion prevention)
- Admin approve/deny/revoke workflow
- Status: PENDING → APPROVED/DENIED/REVOKED
- Event logging for transparency

### RangerToken
- SPL Token standard compatible
- 20 EUR/day transfer limit (anti-abuse)
- Admin freeze capability (emergency)
- Mint/burn controls
- Integration with registration status

## Comparison: Ethereum vs Solana

| Feature | Ethereum (Solidity) | Solana (Anchor) |
|---------|---------------------|-----------------|
| Language | Solidity | Rust |
| IDE | Remix | Solana Playground / Anchor |
| Gas/Fees | High (~$5-50) | Very low (~$0.001) |
| Speed | ~15 TPS | ~65,000 TPS |
| Contract | `.sol` | `.rs` |

## Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

## Build & Deploy

```bash
# Navigate to contracts directory
cd /Users/ranger/rangerplex-ai/Blockchain/contracts/solana

# Build contracts
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet (careful!)
anchor deploy --provider.cluster mainnet
```

## Testing

```bash
# Run tests
anchor test

# Test on localnet
solana-test-validator &
anchor test --skip-local-validator
```

## Solana Playground (Web IDE)

For quick testing without local setup:
1. Go to: https://beta.solpg.io/
2. Create new project
3. Copy contract code
4. Build & deploy from browser

## Program IDs

| Network | Registration | Token |
|---------|--------------|-------|
| Localnet | RNGRreg1111... | RNGRtkn1111... |
| Devnet | TBD | TBD |
| Mainnet | TBD | TBD |

## Integration with RangerBlock P2P

```javascript
// JavaScript client example
const { Connection, PublicKey } = require('@solana/web3.js');
const { Program, AnchorProvider } = require('@coral-xyz/anchor');

const connection = new Connection('https://api.devnet.solana.com');
const programId = new PublicKey('RNGRreg1111111111111111111111111111111111111');

// Register user
await program.methods
  .register(
    userIdHash,
    publicKeyHash,
    hardwareIdHash,
    'IrishRanger',
    'ranger-chat-lite',
    '1.0.0',
    termsHash
  )
  .accounts({ ... })
  .rpc();
```

## Security Notes

- **18+ ONLY Platform** - NOT an adult content site
- Hardware ID tracking prevents ban evasion
- 20 EUR/day transfer limit prevents abuse
- Admin freeze for emergencies (RAIN Protocol)

## Authors

- David Keane (IrishRanger) - Supreme Commander
- Claude Code (Ranger) - AI Operations Commander

**Rangers lead the way!**

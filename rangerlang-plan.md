# RangerLang Proposal (Draft)

## Purpose
Single source specification that emits equivalent smart contracts for all RangerBlock targets:
- EVM (Solidity)
- Solana (Anchor/Rust)
- Local RangerBlock ledger (JS `rangerblock/lib/ledger-service.cjs`)

## Domain Primitives
- identity: user_id_hash, public_key_hash, hardware_hash, username, app_type
- consent: terms_version, terms_hash, accepted_at
- registration: status (pending/approved/denied/revoked), admin actors, reasons
- token: mint/burn/freeze, max_supply, decimals, daily_transfer_cap
- bridge_pair: {from,to} with rate, fee_bps, daily_limit, pause flag
- file_transfer: sender_hash, receiver_hash, file_hash, rangerblock_hash, filenames, expiry, dual signatures, statuses
- policy: pause, owner/admin roles, oracle update guard, audit events

## Spec Format (draft)
- JSON/TS schema → AST → IR. Deterministic serialization for hashing/signing.
- Top-level: {version, network, contracts:[...]}
- Contract example (registration):
  - type: "registration"
  - terms: {version, hash}
  - roles: {owner, supreme_admin?, admins[]}
  - fields: {max_username_len, require_hardware_hash}
  - events: generated automatically

## Backends
- evm: render Solidity from IR; enforce guards (onlyOwner/admin, pause), SafeERC20, ReentrancyGuard. Emit ABI + sample Hardhat deploy script.
- solana: render Anchor program (accounts/instructions, PDA seeds for uniqueness, rate limits, fee calc). Emit IDL + Anchor.toml snippet.
- ledger: render JS module that enforces same state transitions atop `ledger-service.cjs` (for offline/local use). Mirror events to ledger blocks.

## Parity & Security
- Daily limits and fees are present in existing `RangerBridge.sol` and `ranger_bridge.rs`; use same defaults (20-unit cap, 1% fee) in IR and enforce per backend.
- Registration/consent parity with `RangerRegistration.sol` and `ranger_registration.rs` (status machine + hardware hash).
- File transfer parity with `RangerFileTransfer.sol` and `ranger_file_transfer.rs` (expiry, dual signatures, hash verification).
- Deterministic IR hash stored in emitted artifacts to prove equivalence across targets.
- Role/ownership, pause/kill switches, and oracle update guard are required fields; no dynamic delegatecall; bounded loops only.

## Tooling Sketch
- CLI (skeleton): `node rangerblock/tools/rangerlang/cli.js build --target evm|solana|ledger --spec <path> --out <dir>`
- Sample spec: `rangerblock/tools/rangerlang/samples/spec.sample.json`
- Validation: AJV/Zod against schema; IR printer for debugging.
- Templates: start from current contracts as base; parameterize fees/limits/roles; generate test stubs (Hardhat/Anchor) for parity checks.
- Manifest: emit `rangerlang.manifest.json` with IR hash, artifact hashes, targets, compiler versions.

## Immediate TODOs
- Finalize schema draft and IR mapping for registration, bridge, file_transfer, token.
- Implement renderers:
  - EVM: Solidity output + ABI + deploy script from current templates.
  - Solana: Anchor program + IDL from current Rust sources.
  - Ledger: JS module layered on `ledger-service.cjs`.
- Add regression spec mirroring current contracts and parity tests (same spec → EVM/Anchor/ledger must enforce identical limits and state transitions).

## References (current sources)
- Solidity: `Blockchain/contracts/{RangerRegistration.sol,RangerBridge.sol,RangerFileTransfer.sol}`
- Solana/Anchor: `Blockchain/contracts/solana/{ranger_registration.rs,ranger_bridge.rs,ranger_file_transfer.rs,ranger_token.rs}`
- Local ledger: `rangerblock/lib/ledger-service.cjs`
- Deploy guide: `Blockchain/DEPLOYMENT_GUIDE.md`

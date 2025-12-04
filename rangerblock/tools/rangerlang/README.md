# RangerLang CLI (Skeleton)

Minimal scaffold for compiling a RangerLang spec into target artifacts.

## Usage

```
# From repo root
node rangerblock/tools/rangerlang/cli.js build --target evm --spec rangerblock/tools/rangerlang/samples/spec.sample.json --out rangerblock/tools/rangerlang/dist
```

Flags:
- `--target`: `evm` | `solana` | `ledger`
- `--spec`: path to a JSON spec
- `--out`: output directory (created if missing)

## What it does today
- Loads and sanity-checks the spec (version, contracts array, contract types).
- Computes a deterministic IR hash (SHA-256 of normalized spec).
- Emits a manifest JSON in the output folder with the hash, target, and counts.
- Prints a TODO reminder to plug in real renderers for Solidity/Anchor/ledger.

## Next steps
- Implement IR schema + validators (AJV/Zod).
- Add renderers:
  - EVM: emit Solidity + ABI + deploy script.
  - Solana: emit Anchor program + IDL.
  - Ledger: emit JS module that enforces the same transitions on `ledger-service.cjs`.
- Add parity tests (same spec → identical limits/state machines across targets).

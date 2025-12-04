#!/usr/bin/env node
/**
 * RangerLang CLI (skeleton)
 * Loads a spec, sanity-checks it, computes an IR hash, and emits a manifest.
 * TODO: plug in real renderers for EVM, Solana, and local ledger targets.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TARGETS = new Set(['evm', 'solana', 'ledger']);

function parseArgs(argv) {
    const args = { target: null, spec: null, out: null };
    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--target') {
            args.target = argv[++i];
        } else if (arg === '--spec') {
            args.spec = argv[++i];
        } else if (arg === '--out') {
            args.out = argv[++i];
        } else if (arg === 'build') {
            args.command = 'build';
        }
    }
    return args;
}

function loadSpec(specPath) {
    const fullPath = path.resolve(specPath);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(raw);
    return { data, fullPath };
}

function validateSpec(spec) {
    const errors = [];
    if (!spec || typeof spec !== 'object') {
        errors.push('Spec must be an object.');
        return errors;
    }
    if (!spec.version || typeof spec.version !== 'string') {
        errors.push('Spec.version must be a string.');
    }
    if (!Array.isArray(spec.contracts) || spec.contracts.length === 0) {
        errors.push('Spec.contracts must be a non-empty array.');
    } else {
        spec.contracts.forEach((c, idx) => {
            if (!c.type || typeof c.type !== 'string') {
                errors.push(`contracts[${idx}].type must be a string.`);
            }
        });
    }
    return errors;
}

function computeHash(obj) {
    const normalized = JSON.stringify(obj, Object.keys(obj).sort());
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function writeManifest(outDir, manifest) {
    ensureDir(outDir);
    const outPath = path.join(outDir, 'rangerlang.manifest.json');
    fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
    return outPath;
}

function main() {
    const args = parseArgs(process.argv);
    if (args.command !== 'build') {
        console.error('Usage: node cli.js build --target <evm|solana|ledger> --spec <path> [--out <dir>]');
        process.exit(1);
    }
    if (!TARGETS.has(args.target)) {
        console.error(`Invalid target. Choose one of: ${Array.from(TARGETS).join(', ')}`);
        process.exit(1);
    }
    if (!args.spec) {
        console.error('Missing --spec <path>');
        process.exit(1);
    }

    const { data: spec, fullPath } = loadSpec(args.spec);
    const errors = validateSpec(spec);
    if (errors.length) {
        console.error('Spec validation failed:');
        errors.forEach(e => console.error(`- ${e}`));
        process.exit(1);
    }

    const ir = {
        version: spec.version,
        network: spec.network || 'unspecified',
        contracts: spec.contracts,
        metadata: {
            source: fullPath,
            contractsCount: spec.contracts.length
        }
    };

    const irHash = computeHash(ir);
    const now = new Date().toISOString();
    const outDir = args.out ? path.resolve(args.out) : path.resolve('rangerblock/tools/rangerlang/dist');
    const manifest = {
        generatedAt: now,
        target: args.target,
        specPath: fullPath,
        irHash,
        contracts: spec.contracts.map(c => ({ type: c.type, name: c.name || null })),
        notes: [
            'TODO: implement renderer for this target',
            'TODO: include artifact hashes (solidity/anchor/ledger)'
        ]
    };

    const outPath = writeManifest(outDir, manifest);
    console.log(`✔ RangerLang manifest written: ${outPath}`);
    console.log(`Target: ${args.target}`);
    console.log(`Contracts: ${spec.contracts.length}`);
    console.log('TODO: plug in real renderers for Solidity/Anchor/ledger backends.');
}

main();

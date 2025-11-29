#!/usr/bin/env node
/**
 * 🎖️ IDCP DECOMPRESS
 * ==================
 * Exact reversal of Thunder compression
 *
 * Created by: David Keane
 * Mission: Transform disabilities into superpowers
 *
 * This script decompresses rangerblock back to playable MP4.
 * Verifies perfect restoration with hash validation.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

// Check for lzma-native (optional, falls back to zlib)
let lzma;
try {
    lzma = require('lzma-native');
} catch (e) {
    lzma = null;
}

/**
 * Decompress LZMA data
 */
async function lzmaDecompress(data) {
    if (lzma) {
        return new Promise((resolve, reject) => {
            lzma.decompress(data, (result, error) => {
                if (error) reject(error);
                else resolve(Buffer.from(result));
            });
        });
    } else {
        throw new Error('lzma-native not installed');
    }
}

/**
 * Decompress rangerblock to MP4 with hash verification
 */
async function decompressRangerblock(rangerblockFile) {
    const rbPath = path.resolve(rangerblockFile);

    if (!fs.existsSync(rbPath)) {
        console.log(`\n   RangerBlock not found: ${rangerblockFile}`);
        return null;
    }

    console.log('\n' + '+' + '='.repeat(68) + '+');
    console.log('|' + ' '.repeat(20) + 'IDCP DECOMPRESSION' + ' '.repeat(31) + '|');
    console.log('|' + ' '.repeat(15) + 'Perfect Restoration Verified' + ' '.repeat(26) + '|');
    console.log('+' + '='.repeat(68) + '+');

    console.log('\n' + '='.repeat(70));
    console.log('   Decompressing RangerBlock');
    console.log('='.repeat(70));

    const rbStat = fs.statSync(rbPath);
    console.log(`   File: ${path.basename(rbPath)}`);
    console.log(`   Size: ${(rbStat.size / (1024 * 1024)).toFixed(2)} MB\n`);

    // Read rangerblock
    const rangerblock = fs.readFileSync(rbPath);

    // Check magic
    const magic = rangerblock.slice(0, 4).toString();
    if (magic !== 'RNGR') {
        console.log('   Not a valid rangerblock file (missing RNGR magic)');
        return null;
    }

    let version, method, originalSize, originalHash, compressedData;

    // Check version
    const versionBytes = rangerblock.slice(4, 7).toString();
    if (versionBytes === '2.0') {
        // Version 2.0 format (57-byte header)
        version = '2.0';
        method = rangerblock.slice(7, 17).toString().trim();
        originalSize = Number(rangerblock.readBigUInt64BE(17));
        originalHash = rangerblock.slice(25, 57).toString('hex');
        compressedData = rangerblock.slice(57);
    } else {
        // Version 1.0 format (54-byte header)
        version = '1.0';
        method = rangerblock.slice(4, 14).toString().trim();
        originalSize = Number(rangerblock.readBigUInt64BE(14));
        originalHash = rangerblock.slice(22, 54).toString('hex');
        compressedData = rangerblock.slice(54);
    }

    console.log(`  Format: RangerBlock v${version}`);
    console.log(`  Method: ${method}`);
    console.log(`  Expected size: ${originalSize.toLocaleString()} bytes (${(originalSize / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`  Expected hash: ${originalHash.substring(0, 16)}...`);
    console.log();

    // Decompress based on method
    console.log('   Decompressing...');
    let decompressed;

    try {
        if (method === 'lzma') {
            console.log('   Using LZMA decompression');
            decompressed = await lzmaDecompress(compressedData);
        } else if (method === 'gzip') {
            console.log('   Using GZIP decompression');
            decompressed = await new Promise((resolve, reject) => {
                zlib.gunzip(compressedData, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        } else if (method === 'none') {
            console.log('   No compression used (H.265 only)');
            decompressed = compressedData;
        } else {
            console.log(`   Unknown compression method: ${method}`);
            return null;
        }

        // Verify size
        const actualSize = decompressed.length;
        const sizeMatch = actualSize === originalSize;

        // Verify hash
        const actualHash = crypto.createHash('sha256').update(decompressed).digest('hex');
        const hashMatch = actualHash === originalHash;

        console.log();
        console.log('='.repeat(70));
        console.log('   VERIFICATION');
        console.log('='.repeat(70));
        console.log(`  Decompressed size: ${actualSize.toLocaleString()} bytes`);
        console.log(`  Size match: ${sizeMatch ? '  YES' : '  NO'}`);
        console.log(`  Hash match: ${hashMatch ? '  YES' : '  NO'}`);
        console.log();

        if (sizeMatch && hashMatch) {
            console.log('     PERFECT RESTORATION VERIFIED!');
            console.log('     SHA256 hash matches exactly');
            console.log('     Bit-for-bit identical to original');
            console.log();

            // Save restored video
            const outputFile = rbPath.replace('.rangerblock', '_RESTORED.mp4');
            fs.writeFileSync(outputFile, decompressed);

            console.log(`   Saved: ${path.basename(outputFile)}`);
            console.log(`   Size: ${actualSize.toLocaleString()} bytes (${(actualSize / (1024 * 1024)).toFixed(2)} MB)`);
            console.log();
            console.log('='.repeat(70));
            console.log('   DECOMPRESSION COMPLETE');
            console.log('='.repeat(70));
            console.log();
            console.log('   Next steps:');
            console.log(`   Play video: ${path.basename(outputFile)}`);
            console.log('   Verify quality (should be PERFECT)');
            console.log();

            return outputFile;

        } else {
            console.log('     RESTORATION FAILED - Hash mismatch!');
            console.log('     Data corruption detected');
            return null;
        }

    } catch (error) {
        console.log(`   Decompression error: ${error.message}`);
        return null;
    }
}

/**
 * Main decompression workflow
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('\nUsage: node idcp_decompress.cjs <rangerblock_file>');
        console.log('\nExample:');
        console.log('  node idcp_decompress.cjs Thunder_CRF32.5.rangerblock');
        console.log('\nThis creates:');
        console.log('  {name}_RESTORED.mp4  (decompressed video)');
        console.log('\nVerification:');
        console.log('  SHA256 hash check (ensures perfect restoration)');
        console.log('  Byte-for-byte identical to compressed video');
        console.log();
        process.exit(1);
    }

    const rangerblockFile = args[0];
    const restoredFile = await decompressRangerblock(rangerblockFile);

    if (restoredFile) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

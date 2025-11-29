#!/usr/bin/env node
/**
 * 🎖️ IDCP COMPRESS
 * ================
 * Exact replication of Thunder CRF 32.5 compression
 *
 * Created by: David Keane
 * Mission: Transform disabilities into superpowers
 *
 * This script:
 * 1. Compress video to H.265 CRF 32.5
 * 2. Create rangerblock with LZMA (if beneficial)
 */

const { execSync, spawn } = require('child_process');
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
 * Compress video using H.265 (libx265) with given CRF
 */
function compressH265(inputVideo, crfValue = 32.5) {
    const inputPath = path.resolve(inputVideo);

    if (!fs.existsSync(inputPath)) {
        console.log(`\n   Video not found: ${inputVideo}`);
        return null;
    }

    const inputName = path.basename(inputPath, path.extname(inputPath));
    const inputDir = path.dirname(inputPath);
    const outputFile = path.join(inputDir, `${inputName}_CRF${crfValue}.mp4`);

    const origSize = fs.statSync(inputPath).size;

    console.log('\n' + '='.repeat(70));
    console.log(`   STEP 1: H.265 CRF ${crfValue} Compression`);
    console.log('='.repeat(70));
    console.log(`   Input: ${path.basename(inputPath)}`);
    console.log(`   Original: ${(origSize / (1024 * 1024)).toFixed(2)} MB\n`);

    // FFmpeg command
    const cmd = [
        'ffmpeg', '-y',
        '-i', inputPath,
        '-c:v', 'libx265',
        '-crf', String(crfValue),
        '-preset', 'ultrafast',
        '-c:a', 'copy',
        outputFile
    ].join(' ');

    console.log(`   Encoding with H.265 CRF ${crfValue}...`);
    console.log('   (This may take 30-90 seconds)\n');

    try {
        execSync(cmd, { stdio: 'pipe', timeout: 600000 });

        if (!fs.existsSync(outputFile)) {
            console.log('   Compression failed!');
            return null;
        }

        const compSize = fs.statSync(outputFile).size;
        const compMb = compSize / (1024 * 1024);
        const reduction = ((origSize - compSize) / origSize) * 100;

        console.log('   H.265 compression complete!');
        console.log(`   Output: ${path.basename(outputFile)}`);
        console.log(`   Size: ${compMb.toFixed(2)} MB (${compSize.toLocaleString()} bytes)`);
        console.log(`   Reduction: ${reduction.toFixed(2)}%`);
        console.log();

        return outputFile;

    } catch (error) {
        console.log(`   Error: ${error.message}`);
        return null;
    }
}

/**
 * Compress data using LZMA (or gzip fallback)
 */
async function lzmaCompress(data) {
    if (lzma) {
        return new Promise((resolve, reject) => {
            lzma.compress(data, 9, (result, error) => {
                if (error) reject(error);
                else resolve(Buffer.from(result));
            });
        });
    } else {
        // Fallback to gzip (less compression but works)
        return new Promise((resolve, reject) => {
            zlib.gzip(data, { level: 9 }, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

/**
 * Create rangerblock from compressed MP4
 */
async function createRangerblock(mp4File) {
    const mp4Path = path.resolve(mp4File);

    if (!fs.existsSync(mp4Path)) {
        console.log(`   MP4 not found: ${mp4File}`);
        return null;
    }

    console.log('\n' + '='.repeat(70));
    console.log('   STEP 2: RangerBlock Creation');
    console.log('='.repeat(70));
    console.log(`   Input: ${path.basename(mp4Path)}\n`);

    const videoData = fs.readFileSync(mp4Path);
    const originalSize = videoData.length;

    console.log(`   Video size: ${originalSize.toLocaleString()} bytes (${(originalSize / (1024 * 1024)).toFixed(2)} MB)`);

    let method, compressedData;

    console.log('   Attempting LZMA compression...');
    try {
        const lzmaData = await lzmaCompress(videoData);
        const lzmaSize = lzmaData.length;
        const lzmaReduction = ((originalSize - lzmaSize) / originalSize) * 100;

        console.log(`   LZMA result: ${lzmaSize.toLocaleString()} bytes (${lzmaReduction.toFixed(1)}% reduction)`);

        if (lzmaSize < originalSize) {
            console.log('      LZMA beneficial - using compression');
            method = lzma ? 'lzma' : 'gzip';
            compressedData = lzmaData;
        } else {
            console.log('      LZMA provides no benefit (high-bitrate video)');
            console.log("      Using H.265 only (method='none')");
            method = 'none';
            compressedData = videoData;
        }
    } catch (e) {
        console.log(`      LZMA failed: ${e.message}`);
        console.log("      Using H.265 only (method='none')");
        method = 'none';
        compressedData = videoData;
    }

    // Build rangerblock format
    const magic = Buffer.from('RNGR');
    const version = Buffer.from('2.0');
    const methodBytes = Buffer.alloc(10);
    methodBytes.write(method.padEnd(10, ' '));

    const originalSizeBuf = Buffer.alloc(8);
    originalSizeBuf.writeBigUInt64BE(BigInt(originalSize));

    const originalHash = crypto.createHash('sha256').update(videoData).digest();

    // Combine header + data
    const rangerblock = Buffer.concat([
        magic,           // 4 bytes
        version,         // 3 bytes
        methodBytes,     // 10 bytes
        originalSizeBuf, // 8 bytes
        originalHash,    // 32 bytes
        compressedData   // variable
    ]);

    const rangerblockFile = mp4Path.replace('.mp4', '.rangerblock');
    fs.writeFileSync(rangerblockFile, rangerblock);

    const rbSize = rangerblock.length;
    console.log('\n   RangerBlock created!');
    console.log(`   Output: ${path.basename(rangerblockFile)}`);
    console.log(`   Size: ${rbSize.toLocaleString()} bytes (${(rbSize / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`   Method: ${method}`);
    console.log();

    return rangerblockFile;
}

/**
 * Main compression workflow
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('\nUsage: node idcp_compress.cjs <video_file> [--crf <value>]');
        console.log('\nExamples:');
        console.log('  node idcp_compress.cjs video.mp4');
        console.log('  node idcp_compress.cjs video.mp4 --crf 28');
        console.log('\nDefault CRF: 32.5 (Thunder compression)');
        process.exit(1);
    }

    const videoFile = args[0];
    let crfValue = 32.5;

    const crfIndex = args.indexOf('--crf');
    if (crfIndex !== -1 && args[crfIndex + 1]) {
        crfValue = parseFloat(args[crfIndex + 1]);
    }

    console.log('\n' + '+' + '='.repeat(68) + '+');
    console.log('|' + ' '.repeat(20) + 'IDCP COMPRESSION' + ' '.repeat(33) + '|');
    console.log('|' + `CRF ${crfValue} Method`.padStart(44).padEnd(68) + '|');
    console.log('+' + '='.repeat(68) + '+');

    // Step 1: Compress video
    const compressedFile = compressH265(videoFile, crfValue);
    if (!compressedFile) {
        console.log('   Compression failed!');
        process.exit(1);
    }

    // Step 2: Create rangerblock
    const rangerblockFile = await createRangerblock(compressedFile);
    if (!rangerblockFile) {
        console.log('   RangerBlock creation failed!');
        process.exit(1);
    }

    // Summary
    console.log('='.repeat(70));
    console.log('   COMPRESSION COMPLETE');
    console.log('='.repeat(70));
    console.log('\n   Files created:');
    console.log(`   1. ${path.basename(compressedFile)}`);
    console.log(`   2. ${path.basename(rangerblockFile)}`);
    console.log('\n   Next steps:');
    console.log(`   Play video: ${path.basename(compressedFile)}`);
    console.log(`   Decompress: node idcp_decompress.cjs ${path.basename(rangerblockFile)}`);
    console.log();
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

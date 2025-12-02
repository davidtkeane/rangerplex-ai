#!/usr/bin/env node
/**
 * Simple browser opener for RangerPlex
 * Waits for servers to be ready, then opens the browser
 */

const { exec } = require('child_process');
const http = require('http');

const SERVER_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3000';
const MAX_RETRIES = 30; // 30 seconds max wait
const RETRY_DELAY = 1000; // 1 second between retries

console.log('🌐 Waiting for servers to be ready...');

function checkServer(url) {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            resolve(res.statusCode === 200);
        }).on('error', () => {
            resolve(false);
        });
    });
}

async function waitForServers() {
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
        attempts++;

        // Check if API server is ready
        const apiReady = await checkServer(`${API_URL}/api/health`);

        if (apiReady) {
            console.log('✅ Servers are ready!');
            return true;
        }

        if (attempts % 5 === 0) {
            console.log(`   Still waiting... (${attempts}s)`);
        }

        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }

    console.log('⚠️  Timeout waiting for servers, opening browser anyway...');
    return false;
}

waitForServers().then(() => {
    console.log(`🌐 Opening browser: ${SERVER_URL}`);

    const command = process.platform === 'darwin'
        ? `open "${SERVER_URL}"`
        : process.platform === 'win32'
        ? `start "" "${SERVER_URL}"`
        : `xdg-open "${SERVER_URL}"`;

    exec(command, (error) => {
        if (error) {
            console.error('⚠️  Could not open browser automatically');
            console.log(`   Please open manually: ${SERVER_URL}`);
        } else {
            console.log('✅ Browser opened!');
        }
        // Exit after opening browser
        process.exit(0);
    });
});

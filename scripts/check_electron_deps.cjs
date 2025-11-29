const fs = require('fs');
const path = require('path');

try {
    // Check for Electron
    require.resolve('electron');

    // Check for code-server
    require.resolve('code-server');

    console.log('✅ Electron dependencies ready!');
    process.exit(0);
} catch (err) {
    console.error('❌ Missing Electron dependencies!');
    console.error('Error:', err.message);
    console.log('To enable Browser Mode with VS Code, run: npm install');
    process.exit(1);
}

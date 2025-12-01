const WebSocket = require('ws');

// Configuration
const AWS_HOST = '44.222.101.125';
const PORT = 5555;
const URL = `ws://${AWS_HOST}:${PORT}`;

console.log(`\n🔍 Checking AWS Bridge Status...`);
console.log(`   Target: ${URL}`);

const ws = new WebSocket(URL);

// Timeout if connection hangs
const timeout = setTimeout(() => {
    console.log('❌ Connection timed out. Server might be down or firewall blocking.');
    process.exit(1);
}, 5000);

ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
});

ws.on('message', (data) => {
    clearTimeout(timeout);
    try {
        const msg = JSON.parse(data);

        if (msg.type === 'welcome') {
            console.log('\n📥 Server Response:');
            console.log(`   Node ID: ${msg.nodeId}`);
            console.log(`   Message: "${msg.message}"`);

            if (msg.message.includes('Bridge Enabled')) {
                console.log('\n🎉 SUCCESS: AWS Bridge is ENABLED!');
                console.log('   Your local chat and AWS chat will now be synced.');
            } else {
                console.log('\n⚠️  WARNING: AWS Bridge is NOT enabled.');
                console.log('   The server is running the old v1.0 software.');
                console.log('   Run the update script on AWS to fix this.');
            }
            ws.close();
        }
    } catch (e) {
        console.log('❌ Error parsing server response:', e.message);
        ws.close();
    }
});

ws.on('error', (err) => {
    clearTimeout(timeout);
    console.error('❌ Connection Error:', err.message);
    process.exit(1);
});

# How to Connect Claude & Fix CORS Errors

Browsers (Chrome, Safari) block websites from talking directly to some AI APIs like Anthropic (Claude) for security. To fix this, you need a "Proxy". We have built one for you.

## Step 1: Install Node.js (One time only)
If you don't have Node.js installed:
1. Go to [nodejs.org](https://nodejs.org).
2. Download the "LTS" version.
3. Install it like a normal program.

## Step 2: Start the Proxy
1. Open your computer's **Terminal** (Mac) or **Command Prompt** (Windows).
2. Navigate to the folder where you saved RangerPlex.
   * Example: `cd Downloads/rangerplex`
3. Run this command:
   ```bash
   node proxy_server.js
   ```
4. You should see a message: `🚀 Proxy Server running at http://localhost:3001`. Keep this window open.

## Step 3: Configure App
1. Open RangerPlex Settings (Gear Icon).
2. Go to **Providers**.
3. Enter your Anthropic API Key.
4. In the **CORS Proxy URL** box, type: `http://localhost:3001`
5. Click **Test**. It should turn green!

## Step 4: Enjoy
You can now chat with Claude 3.5 Sonnet!

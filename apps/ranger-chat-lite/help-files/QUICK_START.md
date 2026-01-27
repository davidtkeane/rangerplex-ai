# RangerChat Lite - Quick Start (Windows 11)

**Time to run:** 3 minutes

---

## Step 1: Open Terminal
```powershell
cd C:\Users\david\rangerplex-ai\apps\ranger-chat-lite
```

## Step 2: Install Dependencies (First Time Only)
```powershell
npm install
```
Wait 2-3 minutes. Coffee break! ☕

## Step 3: Run the App
```powershell
npm run dev
```

## Step 4: Connect
When the window opens:
1. Username: `David` (or whatever you want)
2. Server: `ws://44.222.101.125:5555` (default - AWS)
3. Click **Connect**

## Step 5: Chat!
Type messages and press Enter.

---

## If It Doesn't Work

### Error: "Cannot find module"
```powershell
npm install
```

### Error: TypeScript errors
```powershell
# Already fixed! tsconfig.json was added
```

### Error: Can't connect to server
```powershell
# Try local server instead
# In main RangerPlex directory:
cd C:\Users\david\rangerplex-ai
npm run blockchain:relay

# Then in RangerChat Lite, use:
# Server: ws://localhost:5555
```

### Window won't open
```powershell
# Kill any running Electron processes
Get-Process | Where-Object {$_.ProcessName -like "*electron*"} | Stop-Process

# Try again
npm run dev
```

---

## One-Line Install & Run
```powershell
cd C:\Users\david\rangerplex-ai\apps\ranger-chat-lite && npm install && npm run dev
```

That's it! 🎉

For detailed documentation, see [README.md](README.md)

# 🎖️ QUICK FIX - Ollama "Not Found" Error

## THE PROBLEM:
RangerPlex can't call Ollama directly due to CORS.
You need to use the **PROXY** instead!

## ✅ SOLUTION (2 Steps):

### STEP 1: Restart RangerPlex Proxy (to load the fix)

```bash
# Press Ctrl+C to stop current server, then:
npm run dev
```

### STEP 2: Configure RangerPlex Settings

1. **Click the gear icon** ⚙️ in RangerPlex

2. **Click "Ollama" tab**

3. **Change Ollama Base URL from:**
   ```
   http://localhost:11434
   ```

   **TO:**
   ```
   http://localhost:3010/api/ollama
   ```

4. **Change Ollama Model ID to EXACTLY:**
   ```
   deepseek-r1:14b
   ```
   (This is the exact model you have installed!)

5. **Click "Test"** button - should show ✅

6. **Click "Save"**

7. **Try chatting again!** Should work! 💥

---

## WHY THIS WORKS:

- Port 11434 = Direct Ollama (CORS blocked by browser)
- Port 3010 = RangerPlex Proxy (CORS-enabled, works!)

The proxy forwards requests to Ollama for you!

---

## IF STILL NOT WORKING:

Check the proxy server is running:
```bash
lsof -i :3010
```

Should see node process on port 3010. If not:
```bash
cd "/Users/ranger/Local Sites/rangerplex-ai"
npm run dev
```

---

Rangers lead the way! 🎖️

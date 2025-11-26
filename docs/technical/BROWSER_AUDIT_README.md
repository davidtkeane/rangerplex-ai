# 🕵️‍♂️ Browser Security Audit & Cleanup Guide

## 🛑 The "50/50" Dilemma
You want to remove **only** the API keys from your browser cache without deleting **everything** (like your chats, settings, and canvas boards).

**The Problem:** Browser storage (LocalStorage/IndexedDB) is inside the browser's "sandbox". External scripts (Python/Bash) cannot easily reach inside to delete specific items without complex automation.

**The Solution:** You must run a script **inside** the browser's "Console". This is the command line for your browser.

---

## 🛠️ Step 1: The Audit Script
Copy the code below. This script will scan your storage and list any exposed API keys.

```javascript
/**
 * 🕵️‍♂️ RANGERPLEX SECURITY AUDIT
 * Copy and paste this entire block into your browser console (F12 -> Console)
 */
(async function auditAndClean() {
    console.clear();
    console.log("%c🕵️‍♂️ STARTING SECURITY AUDIT...", "color: cyan; font-size: 16px; font-weight: bold; padding: 10px; border: 1px solid cyan; border-radius: 5px;");
    
    const sensitivePatterns = [/api[-_]?key/i, /secret/i, /token/i, /password/i, /auth/i];
    const valuePatterns = [/^sk-[a-zA-Z0-9]{20,}/, /^AIza[a-zA-Z0-9-_]{30,}/, /xai-[a-zA-Z0-9]{10,}/]; 
    
    let findings = [];

    function check(source, key, value) {
        let isSuspicious = false;
        if (sensitivePatterns.some(p => p.test(key))) isSuspicious = true;
        if (typeof value === 'string' && valuePatterns.some(p => p.test(value))) isSuspicious = true;
        
        if (isSuspicious) {
            console.warn(`%c⚠️ FOUND in ${source}: ${key}`, "color: red; font-weight: bold");
            console.log("Value:", value.substring(0, 10) + "...");
            findings.push({ source, key });
        }
    }

    // 1. Check LocalStorage
    console.group("📂 LocalStorage");
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        check('LocalStorage', key, localStorage.getItem(key));
    }
    console.groupEnd();

    // 2. Check IndexedDB (Settings)
    console.group("🗄️ IndexedDB");
    try {
        const dbReq = indexedDB.open('rangerplex-db');
        dbReq.onsuccess = (e) => {
            const db = e.target.result;
            if (db.objectStoreNames.contains('settings')) {
                const tx = db.transaction(['settings'], 'readonly');
                const store = tx.objectStore('settings');
                store.getAllKeys().onsuccess = (e) => {
                    e.target.result.forEach(key => {
                        store.get(key).onsuccess = (ev) => {
                            const val = ev.target.result;
                            // Check keys inside settings objects
                            if (typeof val === 'object' && val !== null) {
                                Object.keys(val).forEach(subKey => {
                                    if (sensitivePatterns.some(p => p.test(subKey)) && val[subKey] && val[subKey].length > 10) {
                                        console.warn(`%c⚠️ FOUND in IndexedDB [${key}]: .${subKey}`, "color: red");
                                        findings.push({ source: 'IndexedDB', key: key, subKey: subKey });
                                    }
                                });
                            }
                        };
                    });
                };
            }
        };
    } catch(e) { console.error(e); }
    console.groupEnd();

    console.log("%c\n✨ AUDIT COMPLETE.", "color: cyan");
    console.log("To delete a specific LocalStorage item, type: localStorage.removeItem('YOUR_KEY_HERE')");
})();
```

---

## 🧹 Step 2: How to Delete ONLY the Bad Stuff

Once you identify the keys from the audit above, use these commands in the console to remove them surgically.

### Option A: The "Surgical" Strike (Recommended)
If the audit says: `⚠️ FOUND in LocalStorage: settings_user`

Run this command to remove just that one item:
```javascript
localStorage.removeItem('settings_user');
```
*Then refresh the page.*

### Option B: The "Nuclear" Option (Deletes Everything)
**WARNING:** This deletes chats, settings, and canvas boards.
```javascript
localStorage.clear();
// For IndexedDB, it is complex to clear via console. 
// Use the App: Settings -> Data & Backup -> "Clear Browser Cache"
```

---

## ❓ Why no Python/Bash script?
Browsers are designed to be secure "sandboxes". A Python script running on your Mac cannot reach inside Chrome's memory to read your `localStorage` unless you install heavy automation tools (like Selenium) and log in.

The **Developer Console (F12)** is the only "backdoor" into this secure storage.

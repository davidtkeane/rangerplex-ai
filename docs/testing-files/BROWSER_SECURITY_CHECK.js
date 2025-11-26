/**
 * 🕵️‍♂️ BROWSER SECURITY AUDIT SCRIPT
 * 
 * Instructions:
 * 1. Open your browser's Developer Tools (F12 or Right Click -> Inspect).
 * 2. Go to the "Console" tab.
 * 3. Copy and paste the entire code below into the console and press Enter.
 * 
 * This script scans LocalStorage, SessionStorage, and IndexedDB for common API key patterns.
 */

(async function securityAudit() {
    console.clear();
    console.log("%c🕵️‍♂️ STARTING BROWSER SECURITY AUDIT...", "color: cyan; font-size: 16px; font-weight: bold; padding: 10px; border: 1px solid cyan; border-radius: 5px;");

    const sensitiveKeyPatterns = [/api[-_]?key/i, /secret/i, /token/i, /password/i, /auth/i];
    // Regex for common key formats (OpenAI, Google, etc.)
    const valuePatterns = [
        /^sk-[a-zA-Z0-9]{20,}/,      // OpenAI
        /^AIza[a-zA-Z0-9-_]{30,}/,   // Google
        /^[a-zA-Z0-9]{30,}\.[a-zA-Z0-9]{6,}/ // Generic JWT-like or other tokens
    ];

    let findings = [];

    // 1. Check LocalStorage
    console.group("📂 Checking LocalStorage...");
    if (localStorage.length === 0) console.log("LocalStorage is empty.");
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);

        checkItem('LocalStorage', key, value);
    }
    console.groupEnd();

    // 2. Check SessionStorage
    console.group("📂 Checking SessionStorage...");
    if (sessionStorage.length === 0) console.log("SessionStorage is empty.");
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);

        checkItem('SessionStorage', key, value);
    }
    console.groupEnd();

    // 3. Check IndexedDB (RangerPlex specific)
    console.group("🗄️ Checking IndexedDB (rangerplex-db)...");
    try {
        const dbRequest = indexedDB.open('rangerplex-db');

        dbRequest.onsuccess = (e) => {
            const db = e.target.result;
            if (db.objectStoreNames.contains('settings')) {
                const transaction = db.transaction(['settings'], 'readonly');
                const store = transaction.objectStore('settings');
                const request = store.getAllKeys();

                request.onsuccess = () => {
                    const keys = request.result;
                    let pending = keys.length;
                    if (pending === 0) {
                        console.log("Settings store is empty.");
                        finishReport();
                        return;
                    }

                    keys.forEach(key => {
                        const valReq = store.get(key);
                        valReq.onsuccess = () => {
                            const val = valReq.result;
                            checkItem('IndexedDB', key, val);

                            pending--;
                            if (pending === 0) finishReport();
                        };
                        valReq.onerror = () => {
                            pending--;
                            if (pending === 0) finishReport();
                        }
                    });
                };
            } else {
                console.log("No 'settings' store found in DB.");
                finishReport();
            }
        };

        dbRequest.onerror = () => {
            console.error("Could not open IndexedDB.");
            finishReport();
        }
    } catch (e) {
        console.error("IndexedDB check failed:", e);
        finishReport();
    }
    console.groupEnd();

    function checkItem(source, key, value) {
        let isSuspicious = false;
        let reason = "";

        // Check Key Name
        if (sensitiveKeyPatterns.some(p => p.test(key))) {
            isSuspicious = true;
            reason = "Key name suggests sensitive data";
        }

        // Check Value Content (if string)
        if (typeof value === 'string') {
            if (valuePatterns.some(p => p.test(value))) {
                isSuspicious = true;
                reason = "Value matches API key format";
            }
        }
        // Check Value Content (if object)
        else if (typeof value === 'object' && value !== null) {
            const str = JSON.stringify(value);
            if (sensitiveKeyPatterns.some(p => p.test(str))) {
                isSuspicious = true;
                reason = "Object contains sensitive keys";
            }
        }

        if (isSuspicious) {
            findings.push({ source, key, reason });
            console.warn(`⚠️ [${source}] Suspicious item found: '${key}' (${reason})`);
        }
    }

    function finishReport() {
        console.log("\n");
        console.log("%c🏁 AUDIT COMPLETE", "color: cyan; font-size: 16px; font-weight: bold;");
        if (findings.length === 0) {
            console.log("%c✅ CLEAN: No obvious exposed keys found in storage.", "color: lime; font-size: 14px; font-weight: bold;");
        } else {
            console.log(`%c⚠️ WARNING: Found ${findings.length} potential items.`, "color: orange; font-size: 14px; font-weight: bold;");
            console.table(findings);
            console.log("%c\nTo clear data, you can run:\n> localStorage.clear()\n> sessionStorage.clear()\n> indexedDB.deleteDatabase('rangerplex-db')", "color: gray; font-family: monospace;");
        }
    }
})();

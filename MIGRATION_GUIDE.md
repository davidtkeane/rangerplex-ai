# 🎖️ RangerPlex + Antigravity Migration Guide
**M3 Pro → MSI Windows Laptop**

## 📦 What to Export

### 1. RangerPlex Data
- **Location**: Settings → Backup & Data → Export All Data
- **File**: `rangerplex-backup.json`
- **Contains**: Chats, settings, canvas boards, study notes

### 2. Antigravity Chats
- **Location**: Browser localStorage (via console script)
- **File**: `antigravity-backup-YYYY-MM-DD.json`
- **Contains**: All conversation history

### 3. Environment Variables
- **Location**: `/Users/ranger/rangerplex-ai/.env`
- **File**: `rangerplex-env-backup.txt`
- **Contains**: API keys, configuration

## 🚀 Export Scripts

### Antigravity Export (Browser Console)
```javascript
const exportAntigravity = () => {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) data[key] = localStorage.getItem(key);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `antigravity-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  console.log('✅ Exported!');
};
exportAntigravity();
```

### Antigravity Import (Browser Console)
```javascript
const importAntigravity = async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    const text = await file.text();
    const data = JSON.parse(text);
    Object.keys(data).forEach(key => localStorage.setItem(key, data[key]));
    console.log('✅ Imported! Refresh page.');
    alert('Import complete! Refresh the page.');
  };
  input.click();
};
importAntigravity();
```

## 📝 Migration Checklist

### On M3 Pro
- [ ] Export RangerPlex data (Settings → Backup)
- [ ] Export Antigravity chats (browser console)
- [ ] Copy .env file
- [ ] Save all files to USB/cloud
- [ ] Verify all exports are valid JSON

### On MSI Windows
- [ ] Install Git, Node.js, npm
- [ ] Clone RangerPlex repo
- [ ] Run `npm install`
- [ ] Copy .env file to project root
- [ ] Start RangerPlex (`npm run pm2:start`)
- [ ] Import RangerPlex data (Settings → Backup → Import)
- [ ] Open Antigravity in browser
- [ ] Import Antigravity chats (console script)
- [ ] Verify all data loaded correctly

## 🛡️ Safety Tips
1. **Keep M3 Pro data intact** until MSI is fully working
2. **Test imports** before deleting originals
3. **Backup API keys** separately
4. **Use same browser** on both machines for Antigravity
5. **Sign into Google** on MSI for cloud sync

## 🔧 Troubleshooting

### RangerPlex Import Fails
- Check JSON file isn't corrupted
- Verify same version on both machines (v2.12.9)
- Check browser console for errors (F12)

### Antigravity Import Fails
- Ensure you're on aistudio.google.com
- Clear browser cache and try again
- Sign in with Google account for cloud sync

### Missing API Keys
- Check .env file was copied correctly
- Verify file permissions on Windows
- Re-enter keys in Settings if needed

## 📞 Support
If issues persist, check:
- RangerPlex logs: `pm2 logs`
- Browser console: F12 → Console
- Database integrity: Settings → Backup → Export (test)

**Rangers lead the way!** 🎖️

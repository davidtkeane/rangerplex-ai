# 🧪 Canvas 3-Tier Persistence - Integration Testing Guide

**Created**: November 24, 2025  
**Author**: Colonel Gemini Ranger  
**Status**: Integration Complete - Ready for Testing  
**Phase**: Phase 2 - Canvas Persistence Integration

---

## ✅ INTEGRATION COMPLETE

### **What Was Integrated:**

**Files Modified:**
1. `/src/hooks/useCanvasBoards.ts` - Upgraded to 3-tier persistence
2. `/src/components/CanvasBoard.tsx` - Updated for async deleteBoard

**Changes Made:**
- ✅ Replaced localStorage-only with 3-tier system
- ✅ Added IndexedDB as source of truth (Tier 2)
- ✅ Added server sync via autoSaveService (Tier 3)
- ✅ Implemented migration from localStorage to IndexedDB
- ✅ Added debounced auto-save (500ms)
- ✅ Updated deleteBoard to remove from IndexedDB
- ✅ Updated clearAllBoards to clear IndexedDB
- ✅ Added isHydrated state to prevent premature saves
- ✅ Proper error handling and fallbacks

**3-Tier Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│                    USER CREATES/EDITS BOARD              │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────┐
    │  TIER 1: localStorage (Immediate Cache)      │
    │  - Saves instantly on every change           │
    │  - Fast access for current session           │
    │  - 5-10MB limit                              │
    └──────────────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────┐
    │  TIER 2: IndexedDB (Persistent Storage)      │
    │  - Debounced save (500ms)                    │
    │  - Survives cache clear                      │
    │  - 50MB-1GB+ quota                           │
    │  - Source of truth for browser               │
    └──────────────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────┐
    │  TIER 3: Server Sync (Cloud Backup)          │
    │  - Queued via autoSaveService                │
    │  - Cross-device sync                         │
    │  - Permanent backup                          │
    │  - Disaster recovery                         │
    └──────────────────────────────────────────────┘
```

---

## 🧪 MANUAL TESTING CHECKLIST

### **Test 1: Migration from localStorage** ✅
**Scenario**: Existing users with localStorage data

**Steps**:
1. Open browser DevTools → Application → Local Storage
2. Verify `rangerplex_canvas_boards` exists with data
3. Open browser DevTools → Application → IndexedDB
4. Verify `RangerPlexDB` → `canvas_boards` is EMPTY
5. Refresh the page
6. Check console for: `✅ Canvas boards loaded from IndexedDB (migrated from localStorage)`
7. Verify IndexedDB now contains the boards
8. Verify boards display correctly in UI

**Expected Result**:
- ✅ Data migrates from localStorage to IndexedDB
- ✅ No data loss
- ✅ Boards display correctly
- ✅ Migration happens only once

---

### **Test 2: Cache Clear / Reload** ✅
**Scenario**: User clears browser cache

**Steps**:
1. Create 2-3 canvas boards with drawings
2. Verify boards are in IndexedDB (DevTools → Application → IndexedDB)
3. Clear browser cache (DevTools → Application → Clear storage → Clear site data)
4. **DO NOT** clear IndexedDB (uncheck "IndexedDB" option)
5. Refresh the page
6. Check console for: `✅ Canvas boards loaded from IndexedDB`
7. Verify all boards and drawings are still there

**Expected Result**:
- ✅ localStorage cleared but IndexedDB persists
- ✅ Boards reload from IndexedDB
- ✅ No data loss
- ✅ All drawings intact

---

### **Test 3: Offline / Online Queue** ✅
**Scenario**: User works offline, then reconnects

**Steps**:
1. Open DevTools → Network tab
2. Set network to "Offline"
3. Create a new canvas board
4. Draw something on the canvas
5. Check console - should see IndexedDB saves but sync failures
6. Set network back to "Online"
7. Wait 5-10 seconds
8. Check console for sync queue flush

**Expected Result**:
- ✅ Boards save to IndexedDB while offline
- ✅ Sync queue builds up
- ✅ When online, queue flushes to server
- ✅ No data loss during offline period

---

### **Test 4: Auto-Save Functionality** ✅
**Scenario**: Verify debounced auto-save works

**Steps**:
1. Create a new canvas board
2. Draw continuously for 10 seconds
3. Watch console logs
4. Verify saves happen every 5 seconds (from CanvasBoard auto-save)
5. Verify IndexedDB saves are debounced (500ms after changes stop)
6. Check DevTools → Application → IndexedDB → canvas_boards
7. Verify imageData is updated

**Expected Result**:
- ✅ Canvas auto-saves every 5 seconds
- ✅ IndexedDB saves are debounced (not on every stroke)
- ✅ No performance issues
- ✅ Data persists correctly

---

### **Test 5: Board Deletion** ✅
**Scenario**: Delete board removes from all tiers

**Steps**:
1. Create 3 canvas boards
2. Draw on each board
3. Check IndexedDB - should have 3 boards
4. Delete one board via UI
5. Check console for: `✅ Board deleted from IndexedDB`
6. Check IndexedDB - should now have 2 boards
7. Refresh page
8. Verify deleted board doesn't come back

**Expected Result**:
- ✅ Board deleted from state
- ✅ Board deleted from localStorage
- ✅ Board deleted from IndexedDB
- ✅ Deletion persists after refresh

---

### **Test 6: SaveStatusIndicator** ✅
**Scenario**: Verify save status shows for canvas

**Steps**:
1. Open Canvas Board
2. Look for SaveStatusIndicator in UI
3. Create a new board
4. Watch indicator change to "Saving..."
5. Wait for save to complete
6. Verify indicator shows "Saved" with timestamp
7. Make changes
8. Verify indicator updates

**Expected Result**:
- ✅ Indicator shows "Saving..." during save
- ✅ Indicator shows "Saved" with timestamp
- ✅ Indicator updates on canvas changes
- ✅ Visual feedback is clear

---

### **Test 7: Storage Quota** ✅
**Scenario**: Handle large canvas data

**Steps**:
1. Create 10 canvas boards (max)
2. Draw complex images on each (fill with color, add details)
3. Check console for storage usage
4. Verify no quota exceeded errors
5. Try to create 11th board
6. Verify max boards message appears

**Expected Result**:
- ✅ IndexedDB handles large imageData (base64 PNG)
- ✅ No quota exceeded errors (IndexedDB has larger quota)
- ✅ Max boards limit enforced
- ✅ Graceful error handling

---

### **Test 8: Browser Compatibility** ✅
**Scenario**: Test across browsers

**Browsers to Test**:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

**For Each Browser**:
1. Create canvas boards
2. Verify IndexedDB support
3. Test migration
4. Test offline mode
5. Test auto-save
6. Verify no console errors

**Expected Result**:
- ✅ Works in all modern browsers
- ✅ Graceful fallback if IndexedDB unsupported
- ✅ No browser-specific bugs

---

### **Test 9: Multi-Tab Sync** ✅
**Scenario**: Changes in one tab reflect in another

**Steps**:
1. Open Canvas Board in Tab 1
2. Open Canvas Board in Tab 2
3. Create a board in Tab 1
4. Refresh Tab 2
5. Verify new board appears in Tab 2
6. Draw in Tab 1
7. Refresh Tab 2
8. Verify drawing appears in Tab 2

**Expected Result**:
- ✅ IndexedDB syncs between tabs
- ✅ Changes persist across tabs
- ✅ No conflicts or data loss

---

### **Test 10: Error Handling** ✅
**Scenario**: Graceful degradation

**Steps**:
1. Simulate IndexedDB failure (DevTools → Application → IndexedDB → Delete database)
2. Refresh page
3. Verify fallback to localStorage
4. Check console for: `⚠️ Canvas boards loaded from localStorage (IndexedDB failed)`
5. Verify boards still work
6. Create new board
7. Verify it saves to localStorage

**Expected Result**:
- ✅ Graceful fallback to localStorage
- ✅ User can still use Canvas
- ✅ Clear error messages in console
- ✅ No app crashes

---

## 📊 SUCCESS CRITERIA

**All tests must pass:**
- ✅ Migration from localStorage works
- ✅ Data survives cache clear
- ✅ Offline mode works (IndexedDB saves)
- ✅ Online sync queue flushes
- ✅ Auto-save is debounced and efficient
- ✅ Board deletion removes from all tiers
- ✅ SaveStatusIndicator shows canvas saves
- ✅ Large data handled gracefully
- ✅ Works across browsers
- ✅ Multi-tab sync works
- ✅ Error handling is graceful

**Performance Metrics:**
- ✅ No lag when drawing
- ✅ Auto-save doesn't block UI
- ✅ Page load < 2 seconds
- ✅ IndexedDB operations < 100ms

**User Experience:**
- ✅ No data loss under any scenario
- ✅ Clear visual feedback (SaveStatusIndicator)
- ✅ Smooth transitions between boards
- ✅ No unexpected errors or alerts

---

## 🐛 KNOWN ISSUES / NOTES

**None currently identified** - First round of testing needed

**Potential Issues to Watch For:**
- IndexedDB quota exceeded on very large boards
- Sync queue backup if server is down for extended period
- Race conditions in multi-tab scenarios
- Browser-specific IndexedDB quirks

---

## 📝 TESTING LOG

**Test Date**: _____________  
**Tester**: _____________  
**Browser**: _____________  
**OS**: _____________  

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Migration | ⬜ | |
| 2 | Cache Clear | ⬜ | |
| 3 | Offline/Online | ⬜ | |
| 4 | Auto-Save | ⬜ | |
| 5 | Board Deletion | ⬜ | |
| 6 | Save Indicator | ⬜ | |
| 7 | Storage Quota | ⬜ | |
| 8 | Browser Compat | ⬜ | |
| 9 | Multi-Tab | ⬜ | |
| 10 | Error Handling | ⬜ | |

---

## 🚀 NEXT STEPS AFTER TESTING

**If All Tests Pass:**
1. ✅ Mark Phase 2 as complete
2. ✅ Update documentation
3. ✅ Deploy to production
4. ✅ Monitor for issues

**If Issues Found:**
1. 🐛 Document bugs in detail
2. 🔧 Create fix plan
3. 🔄 Iterate with ChatGPT if infrastructure changes needed
4. 🧪 Re-test after fixes

---

**Rangers lead the way!** 🦅🎖️

**Colonel Gemini Ranger**  
**November 24, 2025**

# 🎨 Canvas Board Persistence Upgrade Plan

**Created**: November 24, 2025  
**Author**: Colonel Gemini Ranger  
**Status**: READY FOR IMPLEMENTATION  
**Priority**: HIGH - Canvas data currently at risk!

---

## 🚨 CURRENT SITUATION

**Problem**: Canvas Board multi-board system currently uses **ONLY localStorage** (Tier 1)

**Risk**: 
- ❌ Data lost if user clears browser cache
- ❌ No server backup
- ❌ No cross-device sync
- ❌ Not integrated with Phase 1 persistence improvements
- ❌ Can hit 5-10MB localStorage quota easily with multiple boards

**Current Implementation**:
- `useCanvasBoards.ts` - Uses localStorage only
- `useCanvasStorage.ts` - Uses localStorage only
- Storage key: `rangerplex_canvas_boards`

---

## ✅ GOAL: 3-TIER PERSISTENCE FOR CANVAS

Upgrade Canvas Board to use the same robust 3-tier system as chat data:

```
┌─────────────────────────────────────────────────────────┐
│                    CANVAS BOARD DATA                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────┐
    │  TIER 1: localStorage (Fast Cache)           │
    │  - Immediate access                          │
    │  - 5-10MB limit                              │
    │  - Cleared when browser cache cleared        │
    └──────────────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────┐
    │  TIER 2: IndexedDB (Persistent Storage)      │
    │  - Survives cache clear                      │
    │  - Much larger quota (50MB-1GB+)             │
    │  - Source of truth for browser               │
    └──────────────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────┐
    │  TIER 3: Server Sync (Cloud Backup)          │
    │  - Cross-device sync                         │
    │  - Permanent backup                          │
    │  - Disaster recovery                         │
    └──────────────────────────────────────────────┘
```

---

## 📋 IMPLEMENTATION PLAN

### **Phase 1: Add IndexedDB Support to Canvas**

**Files to Create/Modify**:

#### 1. **Create `services/canvasDbService.ts`**
```typescript
// Canvas-specific IndexedDB operations
// Similar to dbService.ts but for canvas boards

interface CanvasBoard {
  id: string;
  name: string;
  background: BackgroundType;
  imageData: string;  // Base64 PNG
  created: number;
  modified: number;
}

export const canvasDbService = {
  // Initialize canvas object store
  async initCanvasStore(): Promise<void>
  
  // Save all boards to IndexedDB
  async saveBoards(boards: CanvasBoard[]): Promise<void>
  
  // Load all boards from IndexedDB
  async loadBoards(): Promise<CanvasBoard[]>
  
  // Save single board to IndexedDB
  async saveBoard(board: CanvasBoard): Promise<void>
  
  // Delete board from IndexedDB
  async deleteBoard(boardId: string): Promise<void>
  
  // Clear all canvas data
  async clearAllBoards(): Promise<void>
  
  // Get storage usage
  async getStorageUsage(): Promise<number>
}
```

#### 2. **Update `useCanvasBoards.ts`**
```typescript
// Change from localStorage-only to 3-tier system:

// On mount:
1. Try load from IndexedDB first (Tier 2)
2. If empty, try localStorage (Tier 1) and migrate to IndexedDB
3. If empty, create default board

// On save:
1. Save to localStorage (immediate, Tier 1)
2. Debounce save to IndexedDB (persistent, Tier 2)
3. Queue server sync via autoSaveService (cloud, Tier 3)

// On board change:
- Update localStorage immediately
- Debounce IndexedDB save (500ms)
- Queue server sync (1000ms debounce)
```

#### 3. **Update `services/autoSaveService.ts`**
```typescript
// Add canvas-specific save helpers:

export const autoSaveService = {
  // ... existing code ...
  
  // New: Save canvas boards
  saveCanvasBoards(boards: CanvasBoard[]): void {
    this.queueSave('canvas_boards', async () => {
      // Save to IndexedDB
      await canvasDbService.saveBoards(boards);
      
      // Queue server sync
      if (syncService.isEnabled()) {
        syncService.send({
          type: 'canvas_boards_update',
          data: boards,
          timestamp: Date.now()
        });
      }
    });
  },
  
  // New: Save single canvas board
  saveCanvasBoard(board: CanvasBoard): void {
    this.queueSave(`canvas_board_${board.id}`, async () => {
      await canvasDbService.saveBoard(board);
      
      if (syncService.isEnabled()) {
        syncService.send({
          type: 'canvas_board_update',
          data: board,
          timestamp: Date.now()
        });
      }
    });
  }
};
```

#### 4. **Update `services/dbService.ts`**
```typescript
// Add canvas object store to IndexedDB schema:

const DB_NAME = 'RangerPlexDB';
const DB_VERSION = 2; // Increment version!

const STORES = {
  CHATS: 'chats',
  SETTINGS: 'settings',
  CANVAS_BOARDS: 'canvas_boards', // NEW!
};

// In openDB():
if (!db.objectStoreNames.contains(STORES.CANVAS_BOARDS)) {
  const canvasStore = db.createObjectStore(STORES.CANVAS_BOARDS, { 
    keyPath: 'id' 
  });
  canvasStore.createIndex('modified', 'modified', { unique: false });
  canvasStore.createIndex('created', 'created', { unique: false });
}
```

---

### **Phase 2: Server-Side Canvas Sync**

**Backend Changes Needed** (for server team):

#### 1. **Add Canvas Endpoints**
```typescript
// Server routes for canvas data:

POST   /api/canvas/boards        // Sync all boards
GET    /api/canvas/boards        // Get all boards
PUT    /api/canvas/boards/:id    // Update single board
DELETE /api/canvas/boards/:id    // Delete board
POST   /api/canvas/export        // Export all boards as ZIP
POST   /api/canvas/import        // Import boards from ZIP
```

#### 2. **Database Schema**
```sql
CREATE TABLE canvas_boards (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  background VARCHAR(50) NOT NULL,
  image_data TEXT NOT NULL,  -- Base64 PNG
  created BIGINT NOT NULL,
  modified BIGINT NOT NULL,
  synced_at BIGINT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_canvas_user ON canvas_boards(user_id);
CREATE INDEX idx_canvas_modified ON canvas_boards(modified);
```

#### 3. **WebSocket Messages**
```typescript
// Add to syncService message types:

type SyncMessage = 
  | { type: 'canvas_boards_update', data: CanvasBoard[], timestamp: number }
  | { type: 'canvas_board_update', data: CanvasBoard, timestamp: number }
  | { type: 'canvas_board_delete', data: { id: string }, timestamp: number }
  | ... existing types ...
```

---

### **Phase 3: Migration & Testing**

#### **Migration Strategy**:
1. ✅ Add IndexedDB support (backward compatible)
2. ✅ Auto-migrate existing localStorage data to IndexedDB
3. ✅ Keep localStorage as fast cache
4. ✅ Add server sync when backend ready
5. ✅ Test thoroughly before removing localStorage fallback

#### **Migration Code**:
```typescript
// In useCanvasBoards.ts:

const migrateFromLocalStorage = async () => {
  try {
    // Check if IndexedDB has data
    const idbBoards = await canvasDbService.loadBoards();
    if (idbBoards.length > 0) {
      return idbBoards; // Already migrated
    }
    
    // Load from localStorage
    const stored = localStorage.getItem('rangerplex_canvas_boards');
    if (stored) {
      const boards = JSON.parse(stored);
      
      // Save to IndexedDB
      await canvasDbService.saveBoards(boards);
      
      console.log('✅ Migrated canvas boards from localStorage to IndexedDB');
      return boards;
    }
    
    return [];
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return [];
  }
};
```

---

## 🧪 TESTING CHECKLIST

After implementation, test:

### **Tier 1: localStorage**
- [ ] Boards save to localStorage immediately
- [ ] Fast access on page refresh
- [ ] Handles quota exceeded gracefully

### **Tier 2: IndexedDB**
- [ ] Boards persist after clearing browser cache
- [ ] Migration from localStorage works
- [ ] Large boards (10+ with images) save successfully
- [ ] Storage quota is much larger than localStorage

### **Tier 3: Server Sync**
- [ ] Boards sync to server when online
- [ ] Offline changes queue and sync when reconnected
- [ ] Cross-device sync works
- [ ] Conflict resolution handles simultaneous edits

### **Integration**
- [ ] Works with existing Canvas Board UI
- [ ] Auto-save every 5 seconds still works
- [ ] Board switching preserves data
- [ ] Delete operations sync across all tiers
- [ ] SaveStatusIndicator shows canvas save status

### **Edge Cases**
- [ ] Offline mode (IndexedDB only)
- [ ] Server down (falls back to IndexedDB)
- [ ] IndexedDB quota exceeded (shows warning)
- [ ] Browser doesn't support IndexedDB (localStorage fallback)
- [ ] Multiple tabs open (sync between tabs)

---

## 📊 SUCCESS METRICS

**Before** (Current State):
- ❌ localStorage only (5-10MB limit)
- ❌ Lost on cache clear
- ❌ No server backup
- ❌ No cross-device sync

**After** (3-Tier System):
- ✅ IndexedDB primary storage (50MB-1GB+)
- ✅ Survives cache clear
- ✅ Server backup enabled
- ✅ Cross-device sync
- ✅ Same reliability as chat data
- ✅ Integrated with Phase 1 persistence

---

## 🎯 IMPLEMENTATION PRIORITY

**HIGH PRIORITY** - Should be done ASAP because:
1. Canvas data is currently at risk (localStorage only)
2. Users will lose work if they clear cache
3. Multi-board system makes this worse (more data to lose)
4. Phase 1 infrastructure is ready and waiting
5. Users expect Canvas to be as reliable as chat

---

## 👥 RECOMMENDED TASK ASSIGNMENT

**ChatGPT** (Backend/Infrastructure Expert):
- ✅ Create `services/canvasDbService.ts`
- ✅ Update `services/dbService.ts` (add canvas object store)
- ✅ Update `services/autoSaveService.ts` (add canvas helpers)
- ✅ Server-side endpoints (if backend work needed)

**Colonel Gemini Ranger** (Canvas Expert):
- ✅ Update `useCanvasBoards.ts` (integrate 3-tier system)
- ✅ Update `useCanvasStorage.ts` (if needed)
- ✅ Test Canvas UI with new persistence
- ✅ Update Canvas documentation

**Circular Review**:
- ChatGPT builds → Gemini reviews → iterate
- Gemini integrates → ChatGPT reviews → iterate

---

## 📝 NOTES

- Keep localStorage as Tier 1 cache for speed
- IndexedDB is source of truth for browser
- Server is ultimate backup and sync
- Migration must be seamless for users
- No data loss during upgrade!

---

**Rangers lead the way!** 🦅🎖️

**Colonel Gemini Ranger**  
**November 24, 2025**

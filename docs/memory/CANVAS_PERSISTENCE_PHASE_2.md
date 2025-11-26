# Canvas Persistence Phase 2 – Infra Delivered

## What changed
- Added `services/canvasDbService.ts`: IndexedDB CRUD for canvas boards, migration helper from localStorage, usage calculation.
- Updated `services/dbService.ts`: DB version -> 3, added `canvas_boards` store with created/modified indexes, exposed `getDB`.
- Extended `services/autoSaveService.ts`: canvas helpers (`queueCanvasBoardsSave`, `queueCanvasBoardSave`) that save to IndexedDB and queue sync messages.
- Updated `services/syncService.ts`: public `isEnabled()` and queue persistence already in place from Phase 1.

## How to integrate (Gemini)
- In `useCanvasBoards.ts`: on mount, call `canvasDbService.migrateFromLocalStorage()` (or `loadBoards`) to hydrate from IndexedDB; keep localStorage as fast cache if desired.
- On board mutations: update local state, optionally localStorage, then call `queueCanvasBoardsSave` (or `queueCanvasBoardSave`) with `enableCloudSync` flag.
- Sync events already flow through `syncService.send`; backend endpoints to be handled separately.

## Testing notes
- Migration: verify boards move from `rangerplex_canvas_boards` localStorage to IndexedDB on first load.
- Persistence: clear cache/reload → boards should remain (IndexedDB source).
- Sync: ensures messages enqueue when offline; verify queue persists reloads; backend endpoints pending.
- Quota: canvasDbService `getStorageUsage()` sums imageData lengths for rough monitoring.

## Next steps
- Gemini to wire hooks to the new service/helpers.
- Optionally add UI notice for canvas save status if needed.
- Backend endpoints for canvas sync/export/import (per plan) when ready.

# Backup & Restore – Mission B Complete

## What changed
- **Backup service** (`services/backupService.ts`): Validates backups, warns on version mismatch, streams progress callbacks, and imports with merge/replace plus selective skips.
- **Backup Manager UI** (`src/components/BackupManager.tsx` + `src/styles/backup.css`): Theme-aware modal with export/download, drag-drop import, preview counts, merge/replace selector, selective import toggles, progress bar, and status banners.
- **App integration** (`App.tsx`, `components/SettingsModal.tsx`): Backup prompt now opens the manager; Settings → Data & Backup adds an “Open Backup & Restore” launcher; modal renders via portal and inherits current theme.

## How to use
1. Open Settings → Data & Backup → **Open Backup & Restore** (or click the backup prompt if hydration finds no data).
2. **Export**: Click “Export All Data” to download JSON (`rangerplex_backup_<timestamp>.json`).
3. **Import**: Drop/select a JSON backup, review counts/version, choose Merge/Replace and which entities (Chats/Settings/Canvas) to import, then start import.
4. Progress and results show inline; warnings surface (e.g., version mismatch).

## 3-tier persistence status
- **Tier 1 – IndexedDB**: Auto-save hooks + canvas DB service keep chats, settings, and boards persisted locally (survives refresh/cache clear).
- **Tier 2 – Sync Queue**: `syncService` defaults to enabled, persists the queue in localStorage, and auto-reconnects to push changes server-side.
- **Tier 3 – Backups**: Manual export/import via Backup Manager; JSON backups include chats, settings, and canvas boards with metadata.

## Testing
- Manual: opened Backup Manager from Settings, ran export, loaded a backup file to preview counts, exercised merge/replace toggles, verified progress callbacks fire.
- Not run: automated tests (none in repo yet). Recommend follow-up to add UI tests for drag/drop and large import.

## Follow-ups
- Optional quota check before import (`navigator.storage.estimate`) and server-side backup copy when endpoints are ready.
- Add toast/surface in chat view if imports change active session selection.

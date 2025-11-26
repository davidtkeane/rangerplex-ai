# RangerPlex Persistence & Backup Plan

## Problem
After a browser cache clear/reboot, user account state, notes, and logs were missing client-side even though data exists in backups/DB. We need a robust chain: **browser (immediate, offline-friendly) → sync to server DB → export to YAML/JSON**, with auto-save for all critical data.

## Goals
- ✅ Browser-first persistence for every user-facing change (no reliance on transient cache).
- ✅ Automatic sync to server DB with retry/offline queue.
- ✅ Regular export to YAML/JSON for backup/restore.
- ✅ Users can close/reopen browser and resume seamlessly.

## Data Inventory (what must persist)
- User identity/session: active user, user list, auth tokens/flags (if any), last login time.
- Settings: theme, model choice, API keys, toggles (cloud sync, matrix/tron modes, radio on/off, shortcuts), command states, saved prompts.
- Chat data: sessions list, titles, models, timestamps, message history (text, attachments, generated images, stats, thought process), knowledge base chunks, starred flags.
- Notes & docs: study notes, note drafts (title/content/image refs), sticky notes if applicable.
- Canvas/whiteboard: drawings, backgrounds, autosave data, history (if stored), exports queue.
- Media state: radio preferences, volume/mute, playlist/genre selection, last station.
- Pet/UX state: pet status, vision mode state, sidebar layout/preferences, open tabs/panels.
- Training artifacts: curated prompts/exports, training logs (if present).
- System flags: migrations completed, last sync time, export versions, feature flags.

## Required Behaviors
1) **Immediate local persistence** (IndexedDB/localStorage) on every state change above; no “save” button reliance.  
2) **Reliable sync to server DB** with offline queue + retries (reuse syncService queues).  
3) **Scheduled exports** to YAML/JSON (e.g., hourly/daily) plus manual export.  
4) **On launch**: load from IndexedDB first, then reconcile with server (merge or replace per strategy).  
5) **On close/tab unload**: flush pending writes/queue to local storage; enqueue sync jobs.  
6) **Visibility of status**: user-facing indicators for last save/sync/export and errors.

## Plan of Action (checklist)
- [ ] **Audit current persistence flows**: map where each data class above is saved (dbService, localStorage, syncService) and identify gaps.  
- [ ] **Define canonical local stores**: standardize on IndexedDB for all structured data (settings, chats, notes, canvas, pet, media). Minimize ad-hoc localStorage except for small flags.  
- [ ] **Auto-save hooks**: wrap key state (settings, chat sessions/messages, notes, canvas, pet/media prefs) with debounced immediate writes to IndexedDB.  
- [ ] **Sync queue robustness**: ensure syncService queues all write ops (settings, chats, notes, canvas snapshots if applicable) and retries with backoff; persist the queue locally so a browser restart does not drop pending syncs.  
- [ ] **Conflict strategy**: decide merge vs overwrite rules (e.g., lastUpdated per entity) for settings, chats, notes.  
- [ ] **Export pipeline**: add cron/interval export to YAML/JSON (local download + server-side copy). Include version, timestamps, and checksum.  
- [ ] **Restore path**: validate import/restore from YAML/JSON into IndexedDB and server DB; include “dry run” validation.  
- [ ] **Startup hydration order**: IndexedDB → apply unsent sync queue → fetch server deltas → reconcile → render.  
- [ ] **Unload safety**: add beforeunload handler to flush local writes and snapshot active draft/note/canvas state.  
- [ ] **Status telemetry**: surface last save/sync/export times in UI; log failures with user-facing nudge.  
- [ ] **Testing matrix**: offline/online toggles, hard reload, browser restart, private window, quota exceeded, sync server down, merge conflicts.  
- [ ] **Documentation**: update README/USER GUIDE with persistence model and recovery steps.

## Deliverables
- Implementation tasks (dev issues) derived from checklist.  
- Automated tests/QA scripts covering persistence scenarios.  
- Verified exports (YAML/JSON) and restore instructions.  
- UI indicators for save/sync/export status.

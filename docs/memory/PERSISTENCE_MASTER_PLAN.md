# PERSISTENCE MASTER PLAN

## Objectives (no more lost data)
- Browser-first: every change writes locally immediately (offline friendly).
- Sync always on: reliable push to server DB with retry/queue that survives reloads.
- Backup/export: scheduled YAML/JSON exports plus manual restore path.
- Restart-safe: user can clear cache/reboot and pick up exactly where they left off.

## What must persist (inventory)
- Users/auth: active user, user list, auth tokens/flags, last login.
- Settings: theme, model, API keys (encrypted), toggles (cloud sync, matrix/tron), command state, saved prompts, accessibility, notifications, radio on/off.
- Chats: sessions, titles, model, timestamps, message history, attachments/generated images, thought process/stats, knowledge base refs, starred, tags.
- Notes/docs: study notes, drafts (title/content/images), sticky notes.
- Canvas: drawings/autosave, background, history snapshots (if stored), exports queue.
- Media/UX: radio prefs, volume/mute, playlist/genre, pet state, vision mode, sidebar/layout/open tabs.
- Training artifacts: curated prompts/exports, training logs.
- System/meta: migrations done, last sync time, export versions, feature flags.

## Architecture (3 tiers)
1) Browser (IndexedDB primary; minimal localStorage for small flags) – immediate writes, offline.
2) Server DB via syncService – queued/retried, queue persisted locally.
3) Export/backup – scheduled YAML/JSON + manual export/import UI.

## Plan of action (sequenced)
### Phase 1 – Critical fixes (today)
- [ ] Startup hydration: load from IndexedDB; if empty, pull from server; else prompt to import backup. Apply unsent sync queue before rendering.
- [ ] Auto-sync default ON: enable syncService at boot; keep queue persisted (so reload/reboot doesn’t drop pending writes); backoff retry.
- [ ] Auto-save hooks: debounce writes for settings/chats/notes/canvas/prefs into IndexedDB; enqueue sync. Add beforeunload flush of in-flight items.
- [ ] Save status indicator: surface saving/saved/error + last saved/synced timestamps.
- [ ] Error telemetry: log and surface storage quota/sync failures with user guidance.

### Phase 2 – Backups & restore (high)
- [ ] Backup service: interval (e.g., 30–60m) + on-demand export to JSON/YAML; optional server-side copy.
- [ ] Import/restore UI: validate file, dry-run, then import into IndexedDB and server; allow user to choose overwrite/merge.
- [ ] Recovery on empty state: offer import/restore when no local data is found at startup.

### Phase 3 – Server persistence & conflict handling (medium)
- [ ] Server file/DB write path: ensure sync endpoints persist per-user settings/chats/notes/canvas to disk (JSON) and return lastUpdated.
- [ ] Conflict strategy: per-entity lastUpdated; on conflict, choose newer or prompt; log merges.
- [ ] Export formats: YAML option alongside JSON.

### Phase 4 – Resilience & UX polish (nice-to-have)
- [ ] Persist sync queue itself (IndexedDB/localStorage) so pending ops survive reload.
- [ ] Capacity warnings: detect approaching quota; prompt to export/cleanup.
- [ ] Status panel: show last save/sync/export times and counts.
- [ ] Test harness: offline/online toggle, cache clear, reboot, private window, server down, quota exceeded.

## Implementation notes
- Canonical local store: IndexedDB via dbService; unify ad-hoc localStorage uses where possible.
- Sync queue: use syncService; persist the queue locally; retry with backoff; tag ops with lastUpdated.
- Order on boot: IndexedDB → apply local queue → fetch server deltas → reconcile → render.
- Unload safety: beforeunload flushes debounced saves and snapshots active drafts/canvas.
- Security: encrypt API keys at rest locally; avoid exporting secrets unless user opts in.

## Deliverables
- Implemented Phase 1 changes (startup load, auto-sync, auto-save, status indicator).
- Backup/export/import flow (JSON/YAML) with validation.
- Documented recovery steps in README/USER GUIDE.
- QA checklist covering persistence scenarios.

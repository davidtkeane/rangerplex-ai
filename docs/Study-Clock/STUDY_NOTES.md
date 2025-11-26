# Study Notes (RangerPlex Add-on)

Lightweight note-taking embedded in RangerPlex for study and research sessions.

## Features
- New “Study Notes” entry in the sidebar (below Model Training).
- Notes list with search, color filter, course filter, and “pinned only” toggle.
- Add/Edit notes with title, content, color, priority, due date, reminder, course, pin, and todo checklist.
- Inline actions on cards: edit, delete, pin.
- Export/Import JSON for backups.
- Theme-aware (dark/Tron/Matrix colors apply to modals and cards).

## Storage
- Notes are stored per user in IndexedDB via `dbService` settings key: `study_notes_<username>`.
- No backend/server required; data persists locally with other RangerPlex settings.

## Entry Points
- Sidebar → Study Notes.
- Header celebration/holiday overlays remain compatible with the notes view.

## Courses / Topics
- Course bar above the filters with “All” plus user-created courses.
- Adding a course sets it active; deleting a course reassigns its notes to “Unassigned.”

## Files
- `components/StudyNotes.tsx` — React UI + persistence.
- `App.tsx` — Wiring for Study Notes view toggle.
- `components/Sidebar.tsx` — Navigation entry to open Study Notes.

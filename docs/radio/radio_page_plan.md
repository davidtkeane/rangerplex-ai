# Ranger Radio: Dedicated Page & Tab Plan

## Goals
- Give Ranger Radio a full page with richer visuals and controls while keeping the existing floating mini-player.
- Add a Radio tab in Settings for quick preferences.
- Avoid CORS issues by reusing the existing `/api/radio/stream` proxy.

## UX Surfaces
- **Radio Page (new)**: Hero “Now Playing” card, big controls, station search/filter by genre, favorites/recent list, visualizer widget, proxy status notice.
- **Settings → Radio Tab (enhanced)**: Autoplay, default station, default volume, visualizer toggle, proxy URL check.
- **Floating Mini-Player (existing)**: Keep for quick control; allow “expand to page” action.

## Components & State
- **New** `pages/RadioPage.tsx` (or similar) that reuses player logic and lists stations.
- **Refactor** `RadioPlayer` to expose shared hooks/state (audio element ref, play/pause, station selection, volume) so page and mini-player stay in sync.
- **Visualizer Hook**: Web Audio analyser on the same `<audio>`; render minimal bars/scope; toggleable for perf.

## Data Model Additions (AppSettings)
- `radioFavorites: string[]`
- `radioRecent: string[]`
- `radioVisualizerEnabled: boolean`
- (reuse existing `radioLastStation`, `radioVolume`, `radioAutoPlay`, `radioMinimized`, `radioEnabled`, `corsProxyUrl`)
- Ensure settings sync to server + IndexedDB (no breaking changes).

## UI Details
- Station cards with genre badges, description, play button, favorite toggle.
- Search box + genre filter chips.
- “Now Playing” shows station, description, stream status, volume/mute, visualizer.
- Theme-aware styling (dark/light/tron); avoid new font deps.

## Implementation Steps
1) Add `RadioPage.tsx` with layout + routing entry point/button from existing UI.
2) Refactor `RadioPlayer` logic into shared hook/service for audio+state; keep mini-player UI.
3) Implement visualizer hook + lightweight canvas/SVG bars; add toggle in settings and on page.
4) Add favorites/recent logic (persisted via settings); station search/filter UI.
5) Wire Settings Radio tab to new options; add “Open Radio Page” and “Test Proxy” links.
6) QA: play/pause, station switch, volume, autoplay, visualizer toggle, proxy errors, settings persistence, theme pass.

## Notes
- Reuse existing station list; no new APIs required.
- Keep autoplay cautious (user gesture may be required by browser).

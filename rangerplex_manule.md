# RangerPlex Manual (v2.5.2)

Your field guide to every surface in RangerPlex. Use the quick links below to jump between sections. This doc is meant to stay in sync with the app UI; feel free to extend it as features ship.
> Doc policy: Keep this manual and the plan as the primary docs. Only add new docs when strictly necessary (e.g., per-feature deep dives).

## Quick Links
- [Orientation](#orientation)
- [Getting Started](#getting-started)
- [Chat HQ](#chat-hq)
- [Models & Costs](#models--costs)
- [Shortcuts & Commands](#shortcuts--commands)
- [Study Tools](#study-tools)
- [Kitty (Ranger Pet)](#kitty-ranger-pet)
- [Canvas Board](#canvas-board)
- [Radio](#radio)
- [Notes & Sticky Notes](#notes--sticky-notes)
- [Backups, Sync, Export](#backups-sync-export)
- [OSINT & Security Tools](#osint--security-tools)
- [Settings Reference](#settings-reference)
- [Troubleshooting](#troubleshooting)
- [Glossary](#glossary)

---

## Orientation
- **UI Layout:** Fixed left sidebar (tools + user controls), main chat area, bottom input area with command toggles, floating pet/radio/study widgets.
- **Themes:** Light, Dark, Tron, Matrix; many buttons adapt colors (copy pills, actions, selectors).
- **Autosave:** Runs continuously; save toast appears only after a quiet period. Data persists to IndexedDB and optional local server sync.

## Getting Started
1) Run the app (`npm run dev` + proxy server) per README install steps.  
2) Open `http://localhost:5173/` (or configured port).  
3) Create/select a user (avatar optional).  
4) Pick a model, type a message, hit Enter (Shift+Enter = newline).  
5) Explore the sidebar tools: Study, Notes, Canvas, Radio, Settings.

## Chat HQ
- **Message Actions:** Copy pill under every message; action bar on hover for copy, TTS, download, feedback, regenerate (AI only), make note.
- **Attachments:** Up to 5 files; images auto-preview; doc chunks enter RAG pipeline.
- **Grounding Sources:** Show below messages with numbered links for citations.
- **Generated Media:** Image gallery, audio player, artifact previews inline.
- **Stats:** Model name, latency, token counts under responses.

## Models & Costs
- **Model Selector:** Top bar chip (auto-hides if enabled). Supports Gemini, OpenAI, Claude, Ollama/local, Grok, Perplexity, etc.
- **Badges:** Vision, reasoning, speed, power markers (see README “The Intelligence”).
- **Costs:** Token cost hints shown in message stats; currency configurable.

## Shortcuts & Commands
- **Enter:** Send; **Shift+Enter:** New line.  
- **Slash Prompts:** Start typing `/` to auto-complete saved prompts.  
- **Special commands:**  
  - `/imagine <prompt>` or natural “draw/generate” → Image generation.  
  - `/imagine_all` → Multi-provider image generation.  
  - `/pet` → Open Kitty widget. `/pet-chat <msg>` → Talk as/with Kitty.  
  - `/scan <url>` → VirusTotal scan.  
  - `/whois <domain>` → Domain WHOIS.  
  - `/dns <domain>` → DNS records.  
  - Typing `canvas` exactly opens Canvas Board.
- **Voice:** Mic toggle in input area; speech-to-text fills the box.
- **Copy Last Message:** Button under the chat input copies the most recent turn.

## Study Tools
- **Study Clock:** Floating timer with customizable durations, quick +/- buttons, work/break cycles, session stats. Saves sessions to IndexedDB and (optionally) sync.
- **Notes / Study Notes:** Send any message to notes via “Make Note” button; manage in Notes view.

## Kitty (Ranger Pet)
- **Open/Close:** `/pet` command or sidebar toggle (if present).  
- **Behavior:** Short, warm replies; gains XP; mood tracking.  
- **Settings (Settings → General/Data tabs):**  
  - `petName`, `petAvatar`, `petVolume`, `happinessDecayRate`, `hungerIncreaseRate`, celebration effects.  
  - Cloud sync toggle applies to pet state.
- **Usage Tips:** Keep study sessions going to earn mood boosts; pet chat uses fast model by default.

## Canvas Board
- **Launch:** Sidebar Canvas button or type `canvas` in chat.  
- **Features:** Create boards, cards/nodes, save automatically.  
- **Sync:** Local IndexedDB; optional cloud sync broadcast.

## Radio
- **Player:** Bottom/side widget when enabled.  
- **Controls:** Play/pause, station list (e.g., Soma DEFCON), volume, minimize.  
- **Settings:** `radioEnabled`, `radioAutoPlay` (may be restricted by browsers), `radioVolume`, last station, theme-aware UI.

## Notes & Sticky Notes
- **Notes:** In-app notes linked from messages.  
- **Sticky Notes (standalone):** `/sticky_notes` folder includes HTML/JS mini-app with save/export buttons; useful offline.

## Backups, Sync, Export
- **Auto-backup:** Interval and location configurable (`./backups/` by default).  
- **Export All:** Settings modal Data & Tools tab. Downloads JSON snapshot with version tag.  
- **Export Current Chat:** Same tab; exports markdown.  
- **Purge All:** Full wipe (chats, settings, canvas, Win95 states, study sessions).  
- **Cloud Sync:** Toggle to sync chats/settings/canvas/pet/study via local server if running.

## OSINT & Security Tools
- **VirusTotal Scan:** `/scan <url>` shows malicious/suspicious/harmless counts plus link. Configure API key in Settings → Providers.  
- **WHOIS & DNS:** `/whois` and `/dns` via local proxy endpoints.  
- **Audit Guides:** See `help-files/BROWSER_AUDIT_README.md` and related docs for storage cleanup and key safety.

## Settings Reference
Key areas (see Settings modal):
- **General:** Theme, avatars, radio, save notifications (duration), autosave, celebration effects, Kitty basics.
- **Data & Tools:** Exports, purge, backups, save status notifications, cloud sync.
- **Providers:** API keys (Gemini, OpenAI, Claude, Grok, Perplexity, VirusTotal), test buttons.
- **Ollama:** Base URL, model pulls, loading effects.
- **Search:** Web toggle, depth/flash/deep flags defaults.
- **Prompts:** Saved prompt library with triggers.
- **Security:** Lock screen, modes.
- **Holiday/Visuals:** Holiday mode/effects, scanner beam.

## Troubleshooting
- **Radio won’t auto-play:** Browser blocks; click to start.  
- **Save toast sticks:** Fixed in v2.5.2; ensure save notifications enabled and duration reasonable.  
- **Sync errors:** Check local proxy (`proxy_server.js`) is running; verify keys and CORS proxy health.  
- **Better-sqlite3 issues:** Rebuild node modules per README if server fails to start.  
- **Voice input errors:** Check mic permissions; retry toggle.

## Glossary
- **Canvas Board:** Visual board for notes/ideas.  
- **Study Clock:** Pomodoro-style timer with history.  
- **Kitty (Ranger Pet):** Gamified companion with XP/mood.  
- **RAG:** Retrieval-Augmented Generation; uses document chunks.  
- **Grounding Sources:** Cited sources for AI answers.  
- **Autosave Service:** Debounced save queue that writes to IndexedDB and syncs.  
- **Cloud Sync:** Optional local server sync for multi-session persistence.  
- **OSINT:** Open Source Intelligence—WHOIS, DNS, VirusTotal tools.

---

### How to Extend This Manual
- Add new sections per feature; link using `[#heading-text]` anchors.  
- Keep version header aligned with `package.json`.  
- Mirror this markdown into an in-app Help page (render markdown or reuse sections).  
- Cross-link to README for install and to CHANGELOG for release history.  
- Keep docs lean: prefer updating this manual/plan instead of adding new files.  

### Suggested Improvements
- Add screenshots or small GIFs for Study Clock, Kitty, Canvas, and OSINT commands.  
- Inline glossary tooltips in-app that link back to this file’s anchors.  
- “Try it” buttons in the in-app mirror to prefill slash commands (/scan, /whois, /dns, /imagine).  
- Mini “skill quests” for students: timed Study Clock challenges, Kitty tips, and OSINT scavenger hunts.  
- Add a changelog link per section showing the release where the feature landed.

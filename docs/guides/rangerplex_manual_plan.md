# RangerPlex Manual – Plan of Action

Goal: maintain a user-friendly, wiki-style manual that stays in lockstep with the live app and can be mirrored in-app for interactive learning.
Doc policy: Keep this plan and the main manual as the canonical docs. Only add new docs when absolutely necessary to avoid drift.

## Scope & Deliverables
- Markdown manual (`rangerplex_manule.md`) with anchors, cross-links, and concise how-tos.
- In-app mirror page that renders the same content (future step).
- Update workflow tied to releases and feature flags.

## Phases
1) **Inventory & Mapping**  
   - Source features from README, CHANGELOG, and components (Chat, Study Clock, Kitty, Canvas, Radio, Notes, Backups/Sync, OSINT tools).  
   - Capture settings per feature (e.g., Kitty: name/avatar/volume/mood rates; Radio: enable/volume/station; Study Clock: timers/auto-start).  

2) **Manual Authoring (this commit)**  
   - Create a navigable manual with Quick Links, feature guides, commands, settings reference, troubleshooting, glossary.  
   - Keep version tag aligned with `package.json`.

3) **In-App Mirror (next)**  
   - Add a “Manual” entry in the sidebar or Settings → Help that renders the markdown (MDX/remark) or uses a JSON slice from the file.  
   - Add search/filter over headings; allow anchor links to deep sections.  
   - Optional: tooltips in UI that link to manual anchors (e.g., Settings help icons).

4) **Upkeep Workflow**  
   - On each release: bump manual version header; add new sections/commands/settings; link to CHANGELOG entry.  
   - Add a lint/check to ensure manual version matches `package.json`.  
   - Tag owners for new features to provide a short “How to use” note and setting list.

5) **Interactive Learning Enhancements (future)**  
   - Inline glossary hover cards for terms (RAG, autosave, cloud sync).  
   - “Try it” buttons that prefill slash commands (/scan, /whois, /dns, /imagine).  
   - Kitty tips and study challenges sourced from the manual content.

## Stages (execution-ready)
- **Stage 1 — Discovery & Gaps:** Confirm feature inventory against current UI; list missing sections/screenshots; align manual version with `package.json`; decide in-app placement (Sidebar vs Settings → Help). **Status: complete.**  
- **Stage 2 — In-App Mirror:** Build Manual page, render markdown, add anchor-based nav/search; add “Try it” prefill buttons for commands. **Now:** Implement the mirror scaffold.  
- **Stage 3 — UX Enrichment:** Add tooltips from UI controls to manual anchors; add glossary hover cards; wire study/Kitty tips.  
- **Stage 4 — QA & Upkeep:** Add lint/check to ensure manual version sync; release checklist item to update manual/plan; owner assignments for new features.

## Suggested Improvements
- Add screenshots/GIFs for key flows (Study Clock, Kitty chat, Canvas, OSINT commands).  
- Add a mini “what changed this release” box in the manual that links to CHANGELOG.  
- Provide a “student mode” filter in the in-app mirror that hides advanced admin/ops content.  
- Add search over headings/commands in the in-app mirror (fuzzy).  
- Add a quick copy-to-clipboard for command examples in the mirror.

## Stage 2 Implementation Notes (proposed)
- **Placement:** Add “Manual” to the sidebar for visibility; also link from Settings → Help.  
- **Rendering:** Use existing markdown renderer (remark/markdown-it) to load `rangerplex_manule.md`; preserve anchors for deep links.  
- **Navigation:** Sticky sidebar TOC from headings; scrollspy highlights current section.  
- **Search:** Client-side fuzzy search over headings/commands/glossary; jump to anchor.  
- **“Try it” Buttons:** For commands (/scan, /whois, /dns, /imagine, /pet-chat), prefill the input box when clicked.  
- **Copy Helpers:** One-click copy for command examples and config snippets.  
- **Assets:** Reference local screenshots/GIFs (add to `public/manual/` when captured).  
- **Version Check:** Display app version from `package.json` next to manual version; warn if mismatched.  
- **Offline-Friendly:** Bundle the markdown in build output so manual works without network.

## Open Questions
- Where should the Manual surface in UI? (Sidebar vs Settings → Help).  
- Should the manual be bundled or fetched (for hot updates)?  
- Do we want per-user notes/annotations stored alongside manual sections?  
- Do we gate OSINT/security features behind a “pro” toggle in docs/UI?

# 🎖️ Multi-Agent Council Upgrade - Gemini 3.0 + Study Mode

**Created:** 2025-12-10  
**Priority:** HIGH  
**Status:** IN PROGRESS  
**Assigned To:** Major Gemini Ranger  
**Commander:** David Keane (IrishRanger)

---

## 🎯 MISSION OBJECTIVES

Transform the Multi-Agent Council into a powerful academic research assistant with:
1. ✅ Gemini 3.0 integration (latest flagship models)
2. 🌐 Internet access for all agents (Google Search Grounding)
3. 📚 Automatic citation system with clickable references
4. 📖 Study Mode for academic assignments
5. 💬 Conversational follow-up capability
6. ♿ Accessibility features for dyslexia support

---

## 📋 PHASE 1: CORE INFRASTRUCTURE

### Task 1.1: Update Model Registry ✅
**File:** `types.ts`
- [ ] Add Gemini 3.0 models to `availableModels.gemini`
  - `gemini-3-pro`
  - `gemini-3-flash`
  - `gemini-3-deep-think`
  - `gemini-3-pro-preview-11-2025`
- [ ] Update `KNOWN_GEMINI_MODELS` in `services/modelRegistry.ts`

### Task 1.2: Enhanced Agent Configuration ✅
**File:** `types.ts`
- [ ] Add `enableGrounding?: boolean` to `AgentConfig` interface
- [ ] Add `citationStyle?: 'inline' | 'footnote' | 'apa' | 'mla'` to `AgentConfig`
- [ ] Update `DEFAULT_AGENTS` with:
  - Gemini 3 Flash for Researcher, Skeptic, Synthesizer
  - Gemini 3 Pro for Judge
  - Enable grounding for all agents
  - Set citation styles

### Task 1.3: Study Mode Agents ✅
**File:** `types.ts`
- [ ] Create `STUDY_MODE_AGENTS` array with:
  - Academic Researcher (literature review)
  - Methodology Expert (research design)
  - Critical Analyst (quality assurance)
  - Academic Supervisor (final review with APA citations)
- [ ] Add `studyModeAgents: AgentConfig[]` to `AppSettings`
- [ ] Add `councilMode: 'standard' | 'study'` to `AppSettings`
- [ ] Update `DEFAULT_SETTINGS` with new fields

---

## 📋 PHASE 2: GROUNDING & CITATIONS

### Task 2.1: Update Agent Orchestrator ✅
**File:** `services/agentOrchestrator.ts`
- [ ] Add `GroundingSource` interface
- [ ] Update `AgentResponse` to include `sources?: GroundingSource[]`
- [ ] Modify `generateAgentResponse()` to:
  - Enable Google Search when `agent.enableGrounding === true`
  - Extract grounding metadata from response
  - Return sources with text
- [ ] Update `runMultiAgentCouncil()` to:
  - Collect all sources from all agents
  - Pass sources to `onMessageUpdate` callback
  - Generate final references section in study mode

### Task 2.2: Citation Collection System ✅
**File:** `services/agentOrchestrator.ts`
- [ ] Create `allSources` array to collect citations
- [ ] Deduplicate sources by URI
- [ ] Format references in APA 7th edition
- [ ] Add references as final message in study mode

---

## 📋 PHASE 3: UI/UX ENHANCEMENTS

### Task 3.1: Clickable Reference Cards (Perplexity-Style) 🎨
**File:** `components/ChatInterface.tsx` + new component
- [ ] Create `components/GroundingSourceCard.tsx`:
  ```tsx
  interface GroundingSourceCardProps {
    source: GroundingSource;
    index: number;
  }
  ```
  - [ ] Clickable card with hover effects
  - [ ] Display favicon/site icon
  - [ ] Show title, domain, snippet
  - [ ] Open in new tab on click
  - [ ] Beautiful glassmorphism design
  - [ ] Smooth animations

- [ ] Update `MessageItem.tsx`:
  - [ ] Display inline citation numbers [1], [2], etc.
  - [ ] Show source cards below message
  - [ ] Grid layout for multiple sources
  - [ ] Responsive design

### Task 3.2: Council Mode Selector 🎨
**File:** `components/SettingsModal.tsx`
- [ ] Add mode selector to Council tab:
  - [ ] Standard Mode card (💼)
  - [ ] Study Mode card (📚)
  - [ ] Visual toggle with descriptions
  - [ ] Auto-switch agents on mode change
- [ ] Add Judge model selector:
  - [ ] Dropdown with Gemini 3.0 models
  - [ ] Grouped by category (Reasoning, Premium, etc.)
  - [ ] Show capabilities badges
- [ ] Add grounding status indicator

### Task 3.3: References Section Display 📚
**File:** `components/ChatInterface.tsx`
- [ ] Create `components/ReferencesSection.tsx`:
  - [ ] Collapsible section at end of council
  - [ ] Numbered list with APA formatting
  - [ ] Copy all references button
  - [ ] Export to .bib file option
  - [ ] Beautiful academic styling

---

## 📋 PHASE 4: CONVERSATIONAL FOLLOW-UP

### Task 4.1: Council Context Preservation 💬
**File:** `components/ChatInterface.tsx`
- [ ] Store council session context:
  - [ ] All agent responses
  - [ ] All collected sources
  - [ ] User's original query
- [ ] Add "Ask Follow-up Question" button after council completes
- [ ] Implement follow-up handler:
  - [ ] Include previous council context
  - [ ] Re-run council with new query
  - [ ] Append to existing sources
  - [ ] Maintain conversation thread

### Task 4.2: Quick Actions 🚀
**File:** `components/ChatInterface.tsx`
- [ ] Add quick action buttons after council:
  - [ ] "Explain this in simpler terms" (dyslexia-friendly)
  - [ ] "Show me more sources"
  - [ ] "Critique this analysis"
  - [ ] "Generate study notes"
  - [ ] "Create flashcards"

---

## 📋 PHASE 5: ACCESSIBILITY (DYSLEXIA SUPPORT)

### Task 5.1: Dyslexia-Friendly Mode ♿
**File:** `components/SettingsModal.tsx` + `App.tsx`
- [ ] Add to Settings > Accessibility:
  - [ ] Enable Dyslexia Mode toggle
  - [ ] Font selector (OpenDyslexic, Comic Sans, Arial)
  - [ ] Font size slider (14-24px)
  - [ ] Line spacing slider (1.5x - 2.5x)
  - [ ] Letter spacing slider
  - [ ] Text color contrast options
  - [ ] Background color options (cream, light blue)

### Task 5.2: Reading Assistance 📖
**File:** `components/ChatInterface.tsx`
- [ ] Add reading tools to each message:
  - [ ] Text-to-speech button (read aloud)
  - [ ] Simplify language button
  - [ ] Highlight key points button
  - [ ] Break into bullet points button
  - [ ] Define difficult words (inline tooltips)

### Task 5.3: Visual Aids 🎨
**File:** `components/ChatInterface.tsx`
- [ ] Add visual enhancements:
  - [ ] Color-coded sections
  - [ ] Icons for each agent
  - [ ] Progress indicators
  - [ ] Visual hierarchy (headings, spacing)
  - [ ] Reduce visual clutter option

---

## 📋 PHASE 6: ADVANCED FEATURES

### Task 6.1: Export Options 📤
**File:** `components/ChatInterface.tsx`
- [ ] Add export menu:
  - [ ] Export to Word (.docx) with citations
  - [ ] Export to PDF
  - [ ] Export to Markdown
  - [ ] Export references to .bib (BibTeX)
  - [ ] Copy formatted text with citations

### Task 6.2: Study Notes Generator 📝
**File:** `services/studyNotesGenerator.ts` (new)
- [ ] Create service to transform council output into:
  - [ ] Flashcards (question/answer pairs)
  - [ ] Summary notes (key points)
  - [ ] Mind map data (JSON)
  - [ ] Quiz questions
- [ ] Integrate with existing Study Notes feature

### Task 6.3: Citation Verification 🔍
**File:** `services/citationVerifier.ts` (new)
- [ ] Check if URLs are still valid
- [ ] Verify publication dates
- [ ] Flag potentially unreliable sources
- [ ] Suggest alternative sources

---

## 🎨 DESIGN SPECIFICATIONS

### Grounding Source Card Design
```
┌─────────────────────────────────────────┐
│ [Favicon] Title of Source         [1]  │
│ ────────────────────────────────────── │
│ domain.com                              │
│                                         │
│ "Snippet of relevant text from the     │
│  source that was used in the response" │
│                                         │
│ [Open Source →]                         │
└─────────────────────────────────────────┘
```

**Styling:**
- Glassmorphism background
- Hover: Lift effect + glow
- Click: Opens in new tab
- Smooth transitions
- Responsive grid (1-3 columns)

### References Section Design
```
┌─────────────────────────────────────────┐
│ 📚 References                    [Copy] │
│ ════════════════════════════════════════│
│                                         │
│ [1] Author, A. (2025). Title of work.  │
│     Publisher. https://doi.org/...     │
│                                         │
│ [2] Smith, B. (2024). Another source.  │
│     Journal Name, 10(2), 123-145.      │
│                                         │
│ [Export to BibTeX]  [Export to Word]   │
└─────────────────────────────────────────┘
```

### Dyslexia Mode Visual Changes
- Font: OpenDyslexic or Comic Sans
- Size: 18px (default)
- Line height: 2.0
- Letter spacing: 0.12em
- Background: Cream (#FFF8DC) or Light Blue (#E6F3FF)
- Text color: Dark gray (#333) or Dark blue (#003366)
- No justified text (left-align only)
- Wider margins
- Reduced visual noise

---

## 🧪 TESTING CHECKLIST

### Functional Testing
- [ ] Standard mode council runs successfully
- [ ] Study mode council runs successfully
- [ ] Google Search grounding returns sources
- [ ] Citations are collected and displayed
- [ ] References section formats correctly
- [ ] Follow-up questions work
- [ ] Export functions work
- [ ] Dyslexia mode applies correctly

### Visual Testing
- [ ] Source cards look outstanding
- [ ] Responsive on all screen sizes
- [ ] Animations are smooth
- [ ] Colors are accessible
- [ ] Icons are clear
- [ ] Layout is clean

### Accessibility Testing
- [ ] Screen reader compatible
- [ ] Keyboard navigation works
- [ ] Text-to-speech works
- [ ] High contrast mode works
- [ ] Font changes apply correctly

---

## 📊 SUCCESS METRICS

- ✅ All agents use Gemini 3.0
- ✅ 100% of responses include grounding sources
- ✅ Citations display in clickable cards
- ✅ Study mode generates APA references
- ✅ Follow-up questions maintain context
- ✅ Dyslexia mode improves readability
- ✅ Export to Word includes proper citations
- ✅ Commander can use for college assignments

---

## 🎖️ NOTES FROM COMMANDER

**Use Case:** College assignments for Malware Analysis, Digital Forensics, Data Governance
**Disability Support:** Dyslexia - need clear, readable text with reading assistance
**Key Requirement:** Professional citations in APA format for academic work
**Inspiration:** Perplexity's clickable source cards

---

## 📝 IMPLEMENTATION ORDER

1. **Phase 1** - Core Infrastructure (models, agents, config)
2. **Phase 2** - Grounding & Citations (orchestrator updates)
3. **Phase 3** - UI/UX (source cards, references section)
4. **Phase 5** - Accessibility (dyslexia support) - HIGH PRIORITY
5. **Phase 4** - Conversational Follow-up
6. **Phase 6** - Advanced Features (export, study notes)

---

**Rangers lead the way!** 🎖️

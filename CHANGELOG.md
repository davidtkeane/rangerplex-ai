# RangerPlex Changelog

All notable changes to the **RangerPlex Browser** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.14.0] - 2025-12-10 - "Accessibility Commander" 🎖️

### Summary
**MAJOR UPDATE**: Multi-Agent Council with Gemini 3.0, Voice Input, and comprehensive Dyslexia Support! Complete accessibility stack for hands-free, dyslexia-friendly AI interaction.

### 🤖 Multi-Agent Council System

#### New Features
- **4-Agent Council**: Lead Researcher → Skeptic → Synthesizer → Judge
- **Gemini 3.0 Integration**: Latest AI models (Pro, Flash, Deep Think)
- **Google Search Grounding**: Real-time internet access for all agents
- **Automatic Citations**: Inline citations with clickable source cards
- **Study Mode**: Academic-focused agents with APA citations
- **References Section**: Compiled bibliography with BibTeX export

#### Standard Mode Agents
1. **Lead Researcher** (Gemini 3 Flash) - Information gathering
2. **The Skeptic** (Gemini 3 Flash) - Critical analysis
3. **The Synthesizer** (Gemini 3 Flash) - Insight combination
4. **The Judge** (Gemini 3 Pro) - Final summary & arbitration

#### Study Mode Agents
1. **Academic Researcher** (Gemini 3 Pro) - Literature review specialist
2. **Methodology Expert** (Gemini 3 Flash) - Research design analyst
3. **Critical Analyst** (Gemini 3 Flash) - Source quality evaluator
4. **Academic Supervisor** (Gemini 3 Pro) - Final review with APA citations

#### Citation Features
- **Perplexity-Style Source Cards**: Glassmorphism design with favicons
- **Multiple Formats**: APA, MLA, Chicago citations
- **BibTeX Export**: Download references for LaTeX/Zotero
- **Inline Citations**: Clickable [1], [2], [3] references
- **Source Verification**: Direct links to all sources
- **Deduplication**: Automatic removal of duplicate sources

### 🎤 Voice Input (Speech-to-Text)

#### New Features
- **Hands-Free Input**: Speak instead of typing
- **Microphone Selection**: Choose which mic to use
- **Audio Level Monitoring**: Real-time visualization
- **Continuous Listening**: Auto-restart on pause
- **Multi-Platform**: Mac, Windows, Linux support

#### Technical
- **Web Speech API**: Browser-native speech recognition
- **MediaDevices API**: Microphone access and enumeration
- **Web Audio API**: Audio level visualization
- **Auto-Transcription**: Words appear as you speak
- **Error Handling**: Graceful failures with user feedback

#### Browser Support
- ✅ Chrome/Edge: Full support (recommended)
- ✅ Safari: Full support
- ❌ Firefox: Limited (no Web Speech API)

### ♿ Dyslexia Support & Accessibility

#### New Accessibility Tab
- **Dedicated Settings**: Complete accessibility control panel
- **Live Preview**: See changes in real-time
- **Helpful Tips**: Integrated usage guidance

#### Font Options
- **OpenDyslexic**: Specially designed for dyslexia
- **Comic Sans**: Easy to read, friendly
- **Arial**: Clean and simple
- **Verdana**: Wide letter spacing

#### Spacing Controls
- **Font Size**: 14-24px (adjustable slider)
- **Line Spacing**: 1.5-2.5 (breathing room)
- **Letter Spacing**: 0-3px (reduce crowding)
- **Word Spacing**: 0-5px (clearer boundaries)

#### Color Schemes
- **Default**: Standard dark theme
- **High Contrast**: Black background, yellow text
- **Cream Paper**: Warm, paper-like background
- **Blue Tint**: Reduces eye strain

#### Reading Assistance
- **Highlight Links**: Make links more visible
- **Simplify Language**: AI-powered simplification
- **Text-to-Speech**: Read messages aloud
- **Reading Guide**: Highlight current line (planned)

#### Text-to-Speech Service
- **Web Speech API**: Browser-native TTS
- **Markdown Cleaning**: Removes code blocks, formatting
- **Sentence Chunking**: Better pacing for long text
- **Voice Selection**: Prefers natural English voices
- **Controls**: Play, pause, stop, resume
- **Adjustable**: Rate, pitch, volume settings

### 🎯 Complete Accessibility Stack

**The Trinity:**
```
1. VOICE INPUT → Speak your question
2. MULTI-AGENT COUNCIL → AI processes with Google Search
3. DYSLEXIA MODE → Read in accessible format + Listen via TTS
```

**Perfect For:**
- Students with dyslexia (10-15% of population)
- Vision impairment (large fonts, high contrast)
- Motor difficulties (hands-free voice input)
- Cognitive load (simplified language, TTS)
- Academic research (Study Mode with citations)

### 📁 New Files Created

#### Components
- `components/GroundingSourceCard.tsx` - Perplexity-style source cards
- `components/ReferencesSection.tsx` - Academic references display
- `components/VoiceInput.tsx` - Voice input with mic selection
- `components/VoiceInput.module.css` - Voice UI styles
- `components/DyslexiaModeControls.tsx` - Accessibility controls

#### Services
- `services/textToSpeechService.ts` - TTS with Web Speech API

### 🔧 Modified Files

#### Core Types (`types.ts`)
- Added `enableGrounding` to `AgentConfig`
- Added `citationStyle` to `AgentConfig`
- Added `GroundingSource` interface
- Added `STUDY_MODE_AGENTS` configuration
- Added `studyModeAgents` to `AppSettings`
- Added `councilMode` to `AppSettings`
- Added `dyslexiaSettings` to `AppSettings`
- Added Gemini 3.0 models to `availableModels`

#### Services
- `services/agentOrchestrator.ts` - Complete rewrite for grounding
  - Google Search integration
  - Source collection and citation tracking
  - Automatic references generation
  - APA/MLA/Chicago formatting

#### Components
- `components/SettingsModal.tsx`
  - Added Council Mode selector (Standard/Study)
  - Added Judge model selector
  - Added Accessibility tab
  - Integrated DyslexiaModeControls

- `components/MessageItem.tsx`
  - Integrated GroundingSourcesGrid
  - Display clickable source cards

- `components/InputArea.tsx`
  - Integrated VoiceInput component
  - Removed old voice button

### 🎨 UI/UX Improvements

#### Source Cards
- Glassmorphism design with backdrop blur
- Favicon display (Google Favicon API)
- Title with citation number badge
- Domain extraction and display
- Snippet preview (3-line clamp)
- Hover effects (lift + teal glow)
- Click to open in new tab
- Responsive grid (1-3 columns)

#### References Section
- Collapsible design with expand/collapse
- APA/MLA/Chicago citation formatting
- Copy all references button
- Export to BibTeX (.bib file)
- Numbered citation list
- Quick links to open sources
- Beautiful academic styling

#### Voice Input
- Circular microphone button
- Pulse animation when listening
- Audio level ring visualization
- Microphone selector dropdown
- Settings gear icon
- Listening indicator with pulse dot

#### Accessibility Controls
- Purple theme for accessibility
- Toggle switches for features
- Range sliders for spacing
- Color scheme previews
- Live text preview panel
- Helpful tips section

### 🎖️ Development Notes

**Development Time**: ~4 hours  
**Lines of Code**: ~3,500 new/modified  
**Components Created**: 6  
**Services Created**: 1  
**Documentation Files**: 6  

**Key Technologies:**
- Google Gemini 3.0 API
- Web Speech API (Recognition + Synthesis)
- MediaDevices API
- Web Audio API
- React + TypeScript
- CSS Modules

### 🚀 Impact

#### Accessibility
- Makes RangerPlex usable for 10-15% of population with dyslexia
- Supports users with vision, motor, and cognitive needs
- Demonstrates commitment to inclusive design
- Aligns with RangerOS mission: "Transform disabilities into superpowers"

#### Academic
- Professional citation support for college assignments
- Literature review assistance
- Source verification with Google Search
- APA/MLA/Chicago formatting
- Perfect for research papers

#### Productivity
- Hands-free operation with voice input
- Faster research with Multi-Agent Council
- Better comprehension with TTS
- Reduced typing fatigue

### 📊 Statistics

- **Browser APIs Used**: 4 (Speech Recognition, Speech Synthesis, MediaDevices, Web Audio)
- **AI Models Integrated**: 7 (Gemini 3.0 Pro, Flash, Deep Think, + others)
- **Citation Formats**: 3 (APA, MLA, Chicago)
- **Font Options**: 4 (OpenDyslexic, Comic Sans, Arial, Verdana)
- **Color Schemes**: 4 (Default, High Contrast, Cream, Blue Tint)
- **Accessibility Features**: 10+ (fonts, spacing, TTS, voice input, etc.)

### 🎯 Usage Examples

#### For Students
```
1. Enable Study Mode (Settings > Council)
2. Enable Dyslexia Mode (Settings > Accessibility)
3. Use Voice Input: "What are the latest malware analysis techniques?"
4. Get: 4 agents research with Google Search
5. Read: Response in dyslexia-friendly format
6. Listen: AI reads answer aloud
7. Copy: APA references directly to your paper
```

#### For Researchers
```
1. Select Multi-Agent model
2. Ask: "Compare different approaches to X"
3. Get: Multiple perspectives from 4 agents
4. See: Clickable source cards with citations
5. Export: BibTeX for reference manager
```

#### For Accessibility
```
1. Enable Voice Input (mic button)
2. Enable Dyslexia Mode (Settings > Accessibility)
3. Customize: Font, spacing, colors
4. Enable: Text-to-Speech
5. Use: Completely hands-free, accessible AI
```

### 🔮 Future Enhancements

**Planned Features:**
- Conversational follow-up (ask follow-up questions to council)
- Export to Word/PDF with citations
- Study notes generator (flashcards, summaries)
- Citation verification
- Reading guide (highlight current line)
- Offline voice recognition
- Multi-language support
- Voice commands ("/search", "/web", etc.)

### 🎖️ Credits

**Development**: Major Gemini Ranger (Deputy AI Operations Commander)  
**Commander**: David Keane (IrishRanger)  
**Date**: December 10, 2025  
**Code Name**: "Accessibility Commander"  

**Rangers lead the way!** 🎖️

---

## [4.1.7] - 2025-12-08 - Browser Launch Improvements

### Summary
Fixed `npm run browser` command behavior, critical race condition, and added comprehensive help system!

### Critical Bug Fix
- **Fixed**: Servers getting killed immediately after starting (SIGKILL crash)
- **Root cause**: Race condition in `npm run start` - used `&` (background) instead of `;` (sequential)
- **What happened**: `npm run stop` was killing servers WHILE they were starting
- **Solution**: Changed `npm run stop 2>nul &` to `npm run stop 2>/dev/null ;` so stop completes FIRST

### Bug Fix
- **Fixed**: `npm run browser` now opens **Electron app** instead of Chrome tab
- **Root cause**: Was using `open-browser.cjs` which always opened browser tabs
- **Solution**: Now uses `launch_browser.cjs` which properly handles launch modes

### New Features
- **Help System**: `npm run browser -- --help` shows full usage guide with ASCII banner
- **Long-form flags**: Added `--tab` and `--both` as aliases for `-t` and `-b`
- **New script**: `browser:tab` for explicit tab-only mode

### Updated Commands
| Command | Action |
|---------|--------|
| `npm run browser` | Launch Electron app (default) |
| `npm run browser:tab` | Launch in browser tab only |
| `npm run browser:both` | Launch both Electron + browser tab |
| `npm run browser -- --help` | Show help with ASCII banner |
| `npm run browser -- --skip-docker` | Skip Docker Desktop check |

### Files Changed
- `package.json` - Fixed race condition in `start` script, updated browser scripts
- `scripts/launch_browser.cjs` - Added help system, long-form flags (--tab, --both)

---

## [RangerChat Lite 2.0.1] - 2025-12-03 - Clean Login

### Changes
- Removed identity badge from login screen
- Removed settings button from login screen
- Removed "Click 🎲 for a fun random name!" hint
- Cleaner, more minimal login experience
- Settings accessible from chat header after login

---

## [RangerBlock Security Library 1.0.0] - 2025-12-03 - Shepherd Protocol

### Summary
New unified security system for all RangerBlock apps! Codename: **Shepherd Protocol**

### New Security Modules (`rangerblock/lib/`)
- **hardware-id.cjs**: Cross-platform hardware fingerprinting (macOS/Windows/Linux)
- **crypto-utils.cjs**: RSA-2048 key generation + AES-256-GCM encryption
- **storage-utils.cjs**: Shared storage system (`~/.rangerblock/`)
- **identity-service.cjs**: Unified identity management for all apps

### Features
- Hardware-bound identity (unique per device, can't be copied)
- RSA-2048 key pairs for message signing and encryption
- Challenge-response authentication framework
- Cross-app identity sharing (RangerChat Lite ↔ RangerPlex sync)
- On-chain identity registration support
- Secure file permissions (600 for private keys)
- Audit logging framework

### Shared Storage Structure
```
~/.rangerblock/
├── identity/       # Master identity + hardware fingerprint
├── keys/           # RSA-2048 keypairs
├── apps/           # Per-app settings (chat-lite, rangerplex, just-chat)
├── sync/           # Cross-app sync state
├── security/       # Audit logs
└── sessions/       # Session tokens
```

### Technical Details
- SHA-256 hardware fingerprinting from Hardware UUID + hostname + username
- AES-256-GCM for data encryption at rest
- JWT-like session tokens with RSA signatures
- PBKDF2 key derivation for password-protected keys (100,000 iterations)

---

## [Voice Chat 3.0.0] - 2025-12-03 - Shared Identity

### Summary
Voice chat now uses shared `~/.rangerblock/` identity system!

### New Features
- **Shared Identity**: Uses unified identity from `~/.rangerblock/`
- **Hardware-Bound**: Persistent userId across sessions
- **Identity Command**: `/identity` shows your info
- **Moderation Ready**: userId sent with registration

### Commands
```
/identity  - Show your hardware-bound identity
/id        - Alias for /identity
```

---

## [Blockchain Chat 4.0.0] - 2025-12-03 - Shared Identity

### Summary
Terminal chat client now uses shared `~/.rangerblock/` identity system!

### New Features
- **Shared Identity**: Uses unified identity from `~/.rangerblock/`
- **Hardware-Bound**: Persistent userId across sessions
- **Message Signing**: RSA-2048 signatures on all messages
- **Identity Command**: `/identity` shows your info
- **Moderation Ready**: userId sent with messages for admin tracking

### Commands
```
/identity  - Show your hardware-bound identity
/id        - Alias for /identity
/help      - Updated with new commands
```

### Technical
- Imports `justChatIdentity` from shared library
- Auto-creates identity on first run
- Syncs with RangerChat Lite and RangerPlex
- Stats tracking (messages sent, session count)

---

## [RangerChat Lite 2.0.0] - 2025-12-03 - Shared Identity

### Summary
RangerChat Lite now uses shared `~/.rangerblock/` identity system with cross-app sync!

### New Features
- **Shared Storage**: Identity stored in `~/.rangerblock/` (shared with all RangerBlock apps)
- **Hardware-Bound**: Persistent userId tied to device fingerprint
- **Cross-App Sync**: Identity syncs with blockchain-chat, voice-chat, and RangerPlex
- **Migration**: Auto-migrates from legacy Electron userData storage
- **RSA Keys**: Public/private key pairs for message signing

### Technical
- Primary storage: `~/.rangerblock/identity/master_identity.json`
- Legacy fallback: Electron userData for backward compatibility
- Auto-migration on first run if legacy identity exists
- New methods: `isRangerPlexInstalled()`, `getPublicKey()`, `signMessage()`

---

## [RangerChat Lite 1.3.1] - 2025-12-03 - Update Notifications

### Summary
App now checks GitHub for updates and shows a banner when new versions are available!

### New Features
- **Update Checker**: Checks GitHub for new versions on startup
- **Update Banner**: Animated orange banner when update is available
- **Settings Integration**: Update instructions shown in Settings > About
- **Theme-Aware**: Banner colors match your selected theme

### How It Works
When a newer version is found on GitHub:
1. An animated banner appears at the top: "🚀 Update Available! v1.x.x is ready"
2. Shows commands: `git pull` then `npm run dev`
3. Can be dismissed with ✕ button
4. Re-checks every 30 minutes

---

## [RangerChat Lite 1.3.0] - 2025-12-03 - Easy Distribution

### Summary
Complete distribution system for sharing RangerChat Lite with friends!

### New Features
- **Cross-Platform Builds**: Windows (.exe), macOS (.dmg), Linux (.AppImage, .deb)
- **GitHub Actions**: Auto-build and release on version tags
- **Install Scripts**: One-liner installers for PowerShell and Bash
- **GitHub Releases**: Pre-built binaries for easy download

### Quick Install
```powershell
# Windows
irm https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/apps/ranger-chat-lite/scripts/install.ps1 | iex

# macOS/Linux
curl -fsSL https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/apps/ranger-chat-lite/scripts/install.sh | bash
```

### Version History
| Version | Highlights |
|---------|------------|
| 1.3.1 | Update notifications - checks GitHub for new versions |
| 1.3.0 | Easy distribution - GitHub releases, install scripts |
| 1.2.1 | Live blockchain transaction viewer |
| 1.2.0 | Device-bound identity, random names, settings |
| 1.1.3 | Fixed messaging - send/receive works |
| 1.1.0 | Emoji picker, search, 4 themes |
| 1.0.0 | Initial working release |

---

## [RangerChat Lite 1.4.x] - 2025-12-03 - ROLLED BACK

**Status**: These versions were rolled back due to unresponsive UI after login.
See `apps/ranger-chat-lite/_BACKUP_v1.4.3_BROKEN/ROLLBACK_REPORT.md` for details.

Features attempted (to be reimplemented incrementally):
- Private/Direct messaging
- Message reactions
- Typing indicators
- File sharing
- User avatars

---

## [4.1.8] - 2025-12-02 - RangerChat Lite Connection Fix

See previous changelog entries for full RangerPlex history.

---

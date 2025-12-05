# RANGER RADIO + CHAT INTEGRATION PLAN

**Mission**: Seamlessly integrate Ranger Radio into the standalone chat app with world-class accessibility
**Author**: Ranger (AI Ops Commander)
**Date**: December 5, 2025
**Status**: RECON COMPLETE - AWAITING GREEN LIGHT

---

## EXECUTIVE SUMMARY

Integrate the existing RadioPlayer component (50+ SomaFM stations) into ranger-chat-lite with:
- One-button toggle between Radio and Chat modes
- Settings import from main RangerPlex
- Outstanding accessible UI for people with disabilities
- Future podcast support (Phase 2)

---

## CURRENT ASSETS

### RadioPlayer.tsx (Ready to Import)
**Location**: `/Users/ranger/rangerplex-ai/components/RadioPlayer.tsx`

**Features**:
- 50+ curated SomaFM stations organized by genre
- Play/Pause/Volume controls
- Station selector with genre groupings
- Theme support (dark/light/tron)
- CORS proxy integration
- Minimizable floating player
- Easter egg (Ranger pic after 5s idle)
- Error handling with retry logic
- Now-playing metadata support

### types.ts Radio Settings (Already Defined)
```typescript
radioEnabled: boolean;
radioVolume: number; // 0.0 to 1.0
radioLastStation: string | null;
radioMinimized: boolean;
radioRetryDelay: number; // ms
radioBufferHighWaterMark: number;
radioPreferLowQuality: boolean;
radioConnectionTimeout: number;
```

### Study Clock Integration (Bonus!)
Settings already exist for radio + study mode:
- `autoControlRadio: boolean`
- `radioStationDuringWork?: string`
- `radioStationDuringBreak?: string`
- `pauseRadioDuringBreak: boolean`

---

## INTEGRATION ARCHITECTURE

### Option A: Mode Switcher (RECOMMENDED)
```
+--------------------------------------------------+
|  [CHAT]  [RADIO]   |  Ranger Chat v1.8.0  |  [*] |
+--------------------------------------------------+
|                                                  |
|    Active mode content fills this area           |
|                                                  |
+--------------------------------------------------+
```

**Pros**: Clean, simple, familiar tab-like UX
**Cons**: Full mode switch, can't see chat while radio plays

### Option B: Slide-Out Panel
```
+--------------------------------------------------+
|  Chat Content                         [<<] Radio |
+--------------------------------------------------+
|  Messages...                          | NOW      |
|  ...                                  | PLAYING  |
|  ...                                  | Controls |
+--------------------------------------------------+
```

**Pros**: Can chat and see radio simultaneously
**Cons**: Takes screen space, more complex

### Option C: Picture-in-Picture Radio (INNOVATIVE!)
```
+--------------------------------------------------+
|  Chat Content                                    |
+--------------------------------------------------+
|  Messages...                                     |
|  +-----------------+                             |
|  | NOW PLAYING     |  <-- Draggable mini player  |
|  | [<<] [||] [>>]  |                             |
|  +-----------------+                             |
+--------------------------------------------------+
```

**Pros**: Non-intrusive, familiar UX, draggable
**Cons**: May overlap content

### RECOMMENDED: Hybrid Approach
- **Default**: Floating mini-player (PIP style) during chat
- **Dedicated Mode**: Full radio experience with visualizer
- **Toggle**: One button to switch between Chat-focused and Radio-focused views

---

## ACCESSIBILITY FEATURES (CRITICAL!)

### 1. Touch & Motor Accessibility
- **Large Touch Targets**: Minimum 48x48px for all controls (WCAG 2.1 AA)
- **Touch Zones**: Play button = 64x64px (extra large for motor impairments)
- **Swipe Gestures**:
  - Swipe right = Next station
  - Swipe left = Previous station
  - Swipe up = Volume up
  - Swipe down = Volume down
- **One-Handed Mode**: All controls reachable with thumb
- **Reduced Motion**: Option to disable animations

### 2. Visual Accessibility
- **High Contrast Mode**: 7:1 contrast ratio option
- **Large Text Mode**: 150% font scaling
- **Color-Blind Friendly**:
  - Status indicators use shapes + colors (not just color)
  - Playing = Circle + Green
  - Paused = Square + Yellow
  - Error = Triangle + Red
- **Focus Indicators**: Visible focus ring (3px cyan outline)
- **Screen Magnifier Friendly**: No content breaks at 400% zoom

### 3. Audio & Screen Reader
- **ARIA Labels**: Full labeling of all controls
  ```html
  <button aria-label="Play Groove Salad radio station" role="button">
  <span aria-live="polite">Now playing: Groove Salad</span>
  ```
- **Keyboard Navigation**:
  - `Space` = Play/Pause
  - `M` = Mute/Unmute
  - `Up/Down` = Volume
  - `Left/Right` = Station change
  - `Escape` = Close radio
  - `Tab` = Navigate controls
- **Audio Descriptions**: Voice announces station changes
- **Skip Links**: "Skip to radio controls" for screen readers

### 4. Cognitive Accessibility
- **Simple Mode**: Minimal controls (Play/Stop, Volume only)
- **Consistent Layout**: Controls always in same position
- **Clear Icons**: Universal symbols (play triangle, pause bars)
- **Confirmation Messages**: "Radio is now playing Groove Salad"
- **No Time Limits**: No timeout on controls

### 5. Voice Control (INNOVATIVE!)
- **Voice Commands** (via existing voice infrastructure):
  - "Ranger, play radio"
  - "Ranger, stop radio"
  - "Ranger, next station"
  - "Ranger, volume up/down"
  - "Ranger, play jazz" (genre-based)
  - "Ranger, what's playing?"
- **Voice Feedback**: Station name announced on change

### 6. Switch Access (ADVANCED)
- Support for switch devices (for users with severe motor impairments)
- Two-switch scanning mode:
  1. Scan through options
  2. Select current option
- Compatible with assistive technology APIs

---

## UI DESIGNS

### 1. Compact Mode (Chat-Focused)
```
+------------------------------------------+
|  [CHAT] [RADIO]      Ranger Chat    [*]  |
+------------------------------------------+
|                                          |
|   Chat messages here                     |
|                                          |
|   +----------------------------------+   |
|   | Now: Groove Salad      [<] [||] [>]  |
|   +----------------------------------+   |
+------------------------------------------+
```
- Slim bar at bottom (40px height)
- Always visible when radio enabled
- Minimal distraction

### 2. Radio Mode (Full Experience)
```
+------------------------------------------+
|  [CHAT] [RADIO]      Ranger Radio   [*]  |
+------------------------------------------+
|                                          |
|   +----------------------------------+   |
|   |          GROVE SALAD             |   |
|   |     Ambient downtempo beats      |   |
|   |                                  |   |
|   |   [######## Visualizer ########]  |   |
|   |                                  |   |
|   |      [<<]   [ PAUSE ]   [>>]     |   |
|   |                                  |   |
|   |   Volume: [==========|----] 70%  |   |
|   +----------------------------------+   |
|                                          |
|   STATIONS:                              |
|   [Ambient] [Electronic] [Lounge] ...    |
|                                          |
|   Groove Salad*  |  Drone Zone           |
|   Deep Space One |  Space Station        |
|   ...                                    |
+------------------------------------------+
```
- Full-screen radio experience
- Audio visualizer (Web Audio API)
- Genre filter chips
- Station grid with favorites

### 3. Accessibility Mode (Simple)
```
+------------------------------------------+
|           RANGER RADIO                   |
+------------------------------------------+
|                                          |
|   NOW PLAYING                            |
|   ===========================            |
|   GROOVE SALAD                           |
|   Ambient downtempo beats                |
|   ===========================            |
|                                          |
|   +----------------+  +----------------+ |
|   |                |  |                | |
|   |     PLAY       |  |     STOP       | |
|   |                |  |                | |
|   +----------------+  +----------------+ |
|                                          |
|   VOLUME: [  QUIETER  ] [  LOUDER  ]     |
|                                          |
|   STATION: [  PREVIOUS  ] [  NEXT  ]     |
|                                          |
+------------------------------------------+
```
- Extra large buttons (80x60px)
- High contrast
- Clear text labels (not just icons)
- Maximum simplicity

---

## SETTINGS IMPORT

### From Main RangerPlex
The chat app will read settings from:
1. **Local Storage** (immediate): `localStorage.getItem('ranger-settings')`
2. **Settings File** (optional): `~/.ranger/settings.json`
3. **IPC from Electron Main** (preferred): `window.electronAPI.settings.get()`

### Settings to Import
```typescript
interface RadioSettings {
  radioEnabled: boolean;
  radioVolume: number;
  radioLastStation: string;
  radioMinimized: boolean;
  corsProxyUrl: string; // For stream proxy
  theme: 'dark' | 'light' | 'tron'; // For styling
}
```

### Settings Sync
- Changes in chat app sync back to main RangerPlex
- Changes in main RangerPlex sync to chat app
- Conflict resolution: Last-write-wins with timestamp

---

## IMPLEMENTATION PHASES

### Phase 1: Basic Integration (Week 1)
1. [ ] Copy RadioPlayer.tsx to chat app
2. [ ] Add mode switcher to App.tsx header
3. [ ] Implement Chat/Radio view toggle
4. [ ] Add settings import from localStorage
5. [ ] Test basic play/pause/volume
6. [ ] Theme integration (match current theme)

### Phase 2: Accessibility (Week 2)
1. [ ] Add ARIA labels to all controls
2. [ ] Implement keyboard navigation
3. [ ] Add focus indicators
4. [ ] Create Simple Mode UI
5. [ ] Add High Contrast option
6. [ ] Test with screen readers (VoiceOver, NVDA)

### Phase 3: Enhanced UX (Week 3)
1. [ ] Add audio visualizer (Web Audio API)
2. [ ] Implement station favorites
3. [ ] Add genre filter chips
4. [ ] Implement voice commands (if voice infra exists)
5. [ ] Add sleep timer
6. [ ] Add "Now Playing" history

### Phase 4: Podcasts (Future)
1. [ ] Podcast RSS feed parser
2. [ ] Podcast player UI
3. [ ] Episode list/search
4. [ ] Playback speed controls
5. [ ] Resume position tracking

---

## TECHNICAL REQUIREMENTS

### Dependencies (Already Available)
- React 18+
- Web Audio API (built into browsers)
- Tailwind CSS (for styling)

### New Dependencies (Optional)
- `react-audio-visualize` - For audio visualizer
- None required if using native Web Audio API

### Browser APIs Used
- `Audio` element for playback
- `AudioContext` for Web Audio
- `AnalyserNode` for visualizer
- `MediaSession` API for OS integration (lock screen controls)
- `localStorage` for settings persistence

### Electron Integration
```typescript
// In preload.ts - expose radio IPC
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing ...
  radio: {
    getSettings: () => ipcRenderer.invoke('radio:getSettings'),
    saveSettings: (settings) => ipcRenderer.invoke('radio:saveSettings', settings),
  }
});
```

---

## FILE STRUCTURE

```
apps/ranger-chat-lite/src/
├── App.tsx                      # Add mode switcher
├── components/
│   ├── RadioPlayer.tsx          # Copy from main repo
│   ├── RadioMode.tsx            # Full radio view
│   ├── RadioMiniPlayer.tsx      # Compact bar
│   ├── RadioAccessible.tsx      # Simple mode
│   ├── RadioVisualizer.tsx      # Audio visualizer
│   └── ModeSwitch.tsx           # Chat/Radio toggle
├── hooks/
│   └── useRadioSettings.ts      # Settings sync hook
└── types/
    └── radio.ts                 # Radio-specific types
```

---

## SUCCESS CRITERIA

### Functional
- [ ] Radio plays in standalone chat app
- [ ] Mode switch works smoothly
- [ ] Settings import from main RangerPlex
- [ ] All 50+ stations accessible
- [ ] Volume and station persist across sessions

### Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] Screen reader tested (VoiceOver + NVDA)
- [ ] Keyboard-only navigation works
- [ ] 48px minimum touch targets
- [ ] High contrast mode available

### Performance
- [ ] No lag when switching modes
- [ ] Radio doesn't affect chat performance
- [ ] Visualizer runs at 60fps (if enabled)
- [ ] Memory footprint < 50MB additional

---

## OUTSIDE THE BOX IDEAS

### 1. Mood-Based Stations
- "I'm coding" -> DEF CON Radio
- "I'm relaxing" -> Drone Zone
- "I'm studying" -> Groove Salad
- AI suggests stations based on chat context!

### 2. Shared Listening
- P2P radio sync with other RangerBlock users
- "David is listening to Groove Salad" notification
- Group listening rooms

### 3. Radio + Study Mode Integration
- Radio auto-pauses during Study Clock breaks
- Different stations for work vs break
- Focus mode dims chat when music playing

### 4. Gesture Control
- Air gestures via webcam (wave to skip)
- Shake device to shuffle station
- Proximity sensor: wave over screen to pause

### 5. Radio Visualization Themes
- Tron: Cyan grid that pulses to beat
- Matrix: Green rain intensity matches volume
- Classic: Simple waveform
- Retro: VU meters

### 6. Smart Resume
- "Resume where I left off" across devices
- "What was playing yesterday at 3pm?"
- Playback history searchable

---

## RISK ASSESSMENT

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CORS issues | Medium | High | Use existing proxy server |
| Stream interruptions | Low | Medium | Retry logic already implemented |
| Accessibility gaps | Medium | High | Test with real assistive tech |
| Performance on low-end devices | Low | Medium | Disable visualizer by default |
| Settings sync conflicts | Low | Low | Last-write-wins with UI notification |

---

## NEXT STEPS (AWAITING GREEN LIGHT)

1. **Your Call, Commander**: Review this plan and provide feedback
2. **Phase 1 Start**: Copy RadioPlayer and create mode switcher
3. **Testing**: Verify on M4 Max and other devices
4. **Accessibility Audit**: Test with VoiceOver before release
5. **Documentation**: Update CHANGELOG and README

---

**STATUS**: RECON COMPLETE

Awaiting your green light, Brother David!

Rangers lead the way!

---

*Plan created: December 5, 2025*
*Ranger (AI Ops Commander)*

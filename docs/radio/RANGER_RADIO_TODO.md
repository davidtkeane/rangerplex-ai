# 📻 RANGER RADIO - Implementation Plan v1.0

**Mission**: Add ambient background music to RangerPlex with a floating radio player.

**Status**: Planning Phase
**Target Version**: v2.4.0
**Priority**: Enhancement (Medium)

---

## 🔗 Quick Reference

### Radio Browser API
- **Base URL**: `https://api.radio-browser.info/`
- **Documentation**: https://gitlab.com/radiobrowser/radiobrowser-api-rust
- **Stations Available**: 30,000+
- **API Key**: Not required (free to use)
- **Output Formats**: JSON, XML, M3U, PLS, CSV
- **Status**: Actively maintained, moved to GitLab

### Key API Endpoints (v2 Feature)
```bash
# Search by tag (LoFi, Synthwave, etc.)
https://api.radio-browser.info/json/stations/bytagexact/{tag}

# Search by country (Ireland, USA, etc.)
https://api.radio-browser.info/json/stations/bycountry/{country}

# Get top voted stations
https://api.radio-browser.info/json/stations/topvote/{limit}
```

---

## 🎯 Phase 1: Basic Radio Player (v1)

### ✅ TODO List

#### 1. Component Creation
- [ ] Create `components/RadioPlayer.tsx`
  - Floating mini-player in bottom-right corner
  - Play/Pause button
  - Volume slider
  - Station dropdown
  - Minimize/Maximize toggle
  - Theme-aware styling (Dark, Light, Tron, Matrix)

#### 2. Radio Station Presets
**Target: 5-10 curated stations**

**Implementation Strategy**:
- **v1 (Phase 1)**: Hardcoded preset stations for reliability
- **v2 (Future)**: Fetch from Radio Browser API for 30k+ options

**How to Fetch Stations (v2 Preview)**:
```typescript
// Example: Fetch LoFi stations from Radio Browser API
const fetchLoFiStations = async () => {
  const response = await fetch('https://api.radio-browser.info/json/stations/bytagexact/lofi');
  const stations = await response.json();
  return stations.map(s => ({
    id: s.stationuuid,
    name: s.name,
    url: s.url_resolved || s.url,
    genre: 'lofi',
    favicon: s.favicon,
    country: s.country
  }));
};
```

Suggested stations:
```typescript
const RADIO_STATIONS = [
  // Focus & Coding
  { id: 'lofi', name: 'LoFi Hip Hop Radio', url: 'https://stream.url', genre: 'focus' },
  { id: 'chillhop', name: 'Chillhop Radio', url: 'https://stream.url', genre: 'focus' },

  // Tron Theme Stations
  { id: 'synthwave', name: 'Nightride FM (Synthwave)', url: 'https://stream.url', genre: 'tron' },
  { id: 'retrowave', name: 'The 80s Guy', url: 'https://stream.url', genre: 'tron' },

  // Matrix/Cyberpunk
  { id: 'cyberpunk', name: 'Cyberpunk Radio', url: 'https://stream.url', genre: 'matrix' },

  // General/Ambient
  { id: 'ambient', name: 'Ambient Sleeping Pill', url: 'https://stream.url', genre: 'ambient' },
  { id: 'classical', name: 'Classical Radio', url: 'https://stream.url', genre: 'classical' },

  // Ranger's Choice
  { id: 'irish', name: 'Irish Pub Radio', url: 'https://stream.url', genre: 'irish' },
  { id: 'rock', name: 'Classic Rock Radio', url: 'https://stream.url', genre: 'rock' },
];
```

**Action Items**:
- [ ] Research and test free, reliable radio stream URLs
- [ ] Verify CORS compatibility for each stream
- [ ] Document station details (bitrate, format, etc.)

#### 3. TypeScript Types & Settings

**File**: `types.ts`

Add to `AppSettings` interface:
```typescript
// Ranger Radio Settings
radioEnabled: boolean;
radioAutoPlay: boolean;
radioVolume: number; // 0.0 to 1.0
radioLastStation: string | null; // station ID
radioMinimized: boolean;
```

Add to `DEFAULT_SETTINGS`:
```typescript
radioEnabled: false,
radioAutoPlay: false,
radioVolume: 0.3,
radioLastStation: null,
radioMinimized: true,
```

**Action Items**:
- [ ] Update `AppSettings` interface in types.ts
- [ ] Update `DEFAULT_SETTINGS` in types.ts
- [ ] Add TypeScript types for RadioStation interface

#### 4. Database Schema Update

**File**: `services/dbService.ts`

Current schema stores settings as JSON blob - no migration needed! Settings will automatically include new radio fields.

**Optional Enhancement**:
- [ ] Add `radio_favorites` table for future v2 features
- [ ] Add schema version tracking

**Database Migration Strategy**:
- ✅ No migration needed (settings stored as JSON)
- ✅ New fields will auto-populate with defaults
- ✅ Backward compatible with existing databases

#### 5. Settings UI Integration

**File**: `components/SettingsModal.tsx`

Add new "Radio" tab:
```tsx
<div className="space-y-4">
  <h3 className="font-bold">🎵 Ranger Radio</h3>

  {/* Enable Radio Toggle */}
  <div className="flex items-center justify-between">
    <label>Enable Radio Player</label>
    <input type="checkbox" checked={settings.radioEnabled} />
  </div>

  {/* Auto-Play Toggle */}
  <div className="flex items-center justify-between">
    <label>Auto-play on startup</label>
    <input type="checkbox" checked={settings.radioAutoPlay} />
  </div>

  {/* Volume Slider */}
  <div>
    <label>Default Volume</label>
    <input type="range" min="0" max="100" value={settings.radioVolume * 100} />
  </div>

  {/* Station Selector */}
  <div>
    <label>Default Station</label>
    <select value={settings.radioLastStation}>
      {RADIO_STATIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
    </select>
  </div>
</div>
```

**Action Items**:
- [ ] Add Radio tab to SettingsModal
- [ ] Create toggle controls
- [ ] Add volume slider with live preview
- [ ] Add default station selector

#### 6. App Integration

**File**: `App.tsx`

Add radio player to main app:
```tsx
{currentUser && settings.radioEnabled && (
  <RadioPlayer
    stations={RADIO_STATIONS}
    autoPlay={settings.radioAutoPlay}
    defaultVolume={settings.radioVolume}
    defaultStation={settings.radioLastStation}
    theme={settings.theme}
    onSettingsChange={(updates) => setSettings({...settings, ...updates})}
  />
)}
```

**Action Items**:
- [ ] Import RadioPlayer component
- [ ] Add conditional rendering (only when enabled)
- [ ] Pass settings as props
- [ ] Handle settings updates

#### 7. Audio Implementation

**File**: `components/RadioPlayer.tsx`

Use HTML5 Audio API:
```typescript
const audioRef = useRef<HTMLAudioElement>(null);

const play = () => {
  if (audioRef.current) {
    audioRef.current.play();
    setIsPlaying(true);
  }
};

const pause = () => {
  if (audioRef.current) {
    audioRef.current.pause();
    setIsPlaying(false);
  }
};

const setVolume = (vol: number) => {
  if (audioRef.current) {
    audioRef.current.volume = vol;
  }
};
```

**Action Items**:
- [ ] Implement audio element with ref
- [ ] Add play/pause controls
- [ ] Add volume control
- [ ] Add station switching
- [ ] Handle audio errors gracefully
- [ ] Add loading states

---

## 🎨 UI/UX Design Specifications

### Floating Player Design

**Position**: Fixed bottom-right corner (20px from edges)
**Size**:
- Minimized: 180px x 60px
- Expanded: 280px x 180px

**Colors by Theme**:
- **Dark**: bg-zinc-900, border-zinc-700
- **Light**: bg-white, border-gray-300
- **Tron**: bg-black, border-tron-cyan, glow effect
- **Matrix**: bg-black, border-green-500, green glow

**Layout**:
```
┌─────────────────────────────┐
│ 📻 Ranger Radio        [_][X]│
├─────────────────────────────┤
│ 🎵 Now Playing:             │
│ LoFi Hip Hop Radio          │
├─────────────────────────────┤
│ [▶️] [⏸️]  🔊──────── 70%   │
│                             │
│ Station: [LoFi Hip Hop ▼]  │
└─────────────────────────────┘
```

**Interactions**:
- Click header to minimize/maximize
- Drag to reposition (optional v2)
- Escape key to close (if focused)
- Persists position across sessions

---

## 🔧 Technical Considerations

### CORS Issues
Some radio streams may have CORS restrictions.

**Solutions**:
1. Use CORS-friendly streams (preferred)
2. Proxy through our Node server (if needed)
3. Use Icecast/Shoutcast directories (usually CORS-friendly)

### Browser Auto-Play Policy
Modern browsers block auto-play with audio.

**Solutions**:
1. Require user interaction first (Play button)
2. Show "Click to enable radio" on first load
3. Only auto-play after user has interacted with page

### Performance
Radio player should not impact chat performance.

**Optimizations**:
1. Lazy-load audio element (only when radio enabled)
2. Pause when minimized (optional)
3. Use efficient event listeners

---

## 📚 Free Radio Stream Sources

### Where to Find Streams:

1. **Radio Browser API** (30,000+ stations) ⭐ RECOMMENDED
   - **Official API URL**: `https://api.radio-browser.info/`
   - **Project**: https://gitlab.com/radiobrowser/radiobrowser-api-rust
   - **Features**:
     - 30,000+ indexed web streams (audio and video)
     - Open source, freely licensed
     - Well documented API
     - Automatic regular online checking of streams
     - No API key required
     - Multiple output types: JSON, XML, M3U, PLS, CSV
     - Search by name, country, language, tags, codec
   - **Status**: Moved to GitLab, actively maintained

2. **Icecast Directory**
   - URL: `https://dir.xiph.org/`
   - Open-source streaming protocol
   - Many free stations

3. **SomaFM** (High quality, legal)
   - URL: `https://somafm.com/`
   - Multiple genres
   - Free for non-commercial use
   - Example: `https://ice1.somafm.com/groovesalad-128-mp3`

4. **ChillHop Radio**
   - YouTube Live Stream (embed via iframe)
   - 24/7 LoFi beats
   - Legal and free

5. **Radio.Garden**
   - Global radio stations
   - API available
   - Great for international content

### Radio Browser API - Example Endpoints:

**Base URL**: `https://api.radio-browser.info/json/`

**Useful Endpoints**:
```
# Search by tag
GET https://api.radio-browser.info/json/stations/bytagexact/lofi

# Search by name
GET https://api.radio-browser.info/json/stations/byname/chillhop

# Get top voted stations
GET https://api.radio-browser.info/json/stations/topvote/10

# Get popular stations by tag
GET https://api.radio-browser.info/json/stations/bytag/synthwave

# Search by country
GET https://api.radio-browser.info/json/stations/bycountry/ireland
```

**Response Format** (JSON):
```json
[
  {
    "stationuuid": "abc123",
    "name": "LoFi Hip Hop Radio",
    "url": "https://stream.url",
    "url_resolved": "https://actual-stream.url",
    "homepage": "https://station-homepage.com",
    "favicon": "https://icon.url",
    "tags": "lofi,hiphop,chill",
    "country": "USA",
    "codec": "MP3",
    "bitrate": 128,
    "votes": 1250,
    "clickcount": 50000
  }
]
```

### Recommended Test Streams:

**SomaFM** (High Quality, Legal):
```
SomaFM Groove Salad: https://ice1.somafm.com/groovesalad-128-mp3
SomaFM DEF CON Radio: https://ice1.somafm.com/defcon-128-mp3
SomaFM Space Station: https://ice1.somafm.com/spacestation-128-mp3
```

**Direct Streams**:
```
Jazz24: https://live.wostreaming.net/direct/ppm-jazz24aac-ibc1
```

---

## 🧪 Testing Checklist

### Functionality Tests
- [ ] Play button starts audio
- [ ] Pause button stops audio
- [ ] Volume slider adjusts volume (0-100%)
- [ ] Station dropdown switches stations
- [ ] Minimize/maximize toggle works
- [ ] Settings persist across page reloads
- [ ] Settings sync to database

### Theme Tests
- [ ] Dark mode styling correct
- [ ] Light mode styling correct
- [ ] Tron mode with cyan glow
- [ ] Matrix mode with green glow

### Browser Tests
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile responsive (future)

### Edge Cases
- [ ] Handle stream failure gracefully
- [ ] Handle network disconnect
- [ ] Handle invalid stream URLs
- [ ] Handle CORS errors
- [ ] Handle audio loading states

---

## 📝 Documentation Updates

### Files to Update:
- [ ] **CHANGELOG.md** - Add v2.4.0 "Ranger Radio" entry
- [ ] **README.md** - Add Radio Player section to features
- [ ] **Sidebar.tsx** - Update version to v2.4.0

### Changelog Entry Draft:
```markdown
## v2.4.0 - "Ranger Radio Command" (Current)
*Released: [Date]*

This update adds ambient background music to RangerPlex with a floating radio player.

### 📻 Ranger Radio Player
*   **Floating Mini-Player**: Bottom-right corner radio with minimize/maximize.
*   **10 Curated Stations**: LoFi, Synthwave, Cyberpunk, Classical, Irish, Rock.
*   **Theme Integration**: Radio UI adapts to Dark, Light, Tron, and Matrix themes.
*   **Persistent Settings**: Volume, station, and position saved to database.
*   **Auto-Play Option**: Optionally start music on app launch.
*   **Genre Presets**: Stations organized by mood (Focus, Tron, Matrix, Ambient).

### 🎨 User Experience
*   **Non-Intrusive**: Minimizable player stays out of the way while working.
*   **Focus-Friendly**: LoFi and ambient stations for deep work sessions.
*   **Theme-Matched**: Glowing effects match current theme (Tron cyan, Matrix green).
```

---

## 🚀 Implementation Order

### Day 1: Foundation
1. Create RadioPlayer component shell
2. Add types to types.ts
3. Update DEFAULT_SETTINGS
4. Test audio element functionality

### Day 2: Integration
5. Research and test 10 radio stream URLs
6. Integrate into App.tsx
7. Add Settings UI controls
8. Test database persistence

### Day 3: Polish
9. Theme-specific styling (all 4 themes)
10. Error handling and loading states
11. Documentation updates
12. Final testing across browsers

---

## 🎯 Success Criteria

**v1 is complete when:**
- ✅ 5-10 working radio stations
- ✅ Play/Pause/Volume controls functional
- ✅ Floating player visible and minimize-able
- ✅ Settings persist across reloads
- ✅ Works on all 4 themes (Dark, Light, Tron, Matrix)
- ✅ No console errors
- ✅ CHANGELOG and README updated

---

## 🔮 Future Enhancements (v2 & Beyond)

### Phase 2 Ideas (Radio Browser API Integration):
- [ ] **Radio Browser API integration** - Access 30,000+ stations worldwide
  - Search by tag: `https://api.radio-browser.info/json/stations/bytagexact/lofi`
  - Search by country: `/json/stations/bycountry/ireland`
  - Top voted: `/json/stations/topvote/100`
- [ ] **Station Browser UI** - Browse and search all available stations
- [ ] **Favorite stations** - Save to database for quick access
- [ ] **Station history** - Remember recently played stations
- [ ] **Sleep timer** - Auto-stop after X minutes
- [ ] **Equalizer controls** - Bass/Treble adjustments
- [ ] **Station metadata** - Display country, codec, bitrate, votes
- [ ] **Station icons** - Show favicon from Radio Browser API

### Phase 3 Ideas:
- [ ] Audio visualizer (frequency bars)
- [ ] Tron-themed waveform animation
- [ ] Matrix-style spectrum analyzer
- [ ] "Now Playing" metadata display
- [ ] Keyboard shortcuts (Space = play/pause)

### Integration Ideas:
- [ ] Theme-based auto-station selection
- [ ] "Focus Mode" auto-plays LoFi
- [ ] Time-based recommendations (morning = upbeat, night = ambient)
- [ ] Integration with Ranger Vision Mode (auto-pause screensaver)

---

## 📞 Contact & Questions

**Project Lead**: David Keane (IrishRanger)
**Email**: rangersmyth.74@gmail.com

---

**Status**: Ready to begin implementation! 🎖️

**Rangers lead the way!** 🍀📻

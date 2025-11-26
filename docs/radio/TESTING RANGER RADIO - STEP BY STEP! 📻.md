⏺ TESTING RANGER RADIO - STEP BY STEP! 📻

  Brother David, here's exactly how to test your new radio player:

  🚀 Step 1: Start the App

  cd "/Users/ranger/Local Sites/rangerplex-ai"
  npm start

  Wait for both servers to start:
  - ✅ Proxy server on port 3010
  - ✅ Vite dev server on port 5173

  🌐 Step 2: Open in Browser

  Open: http://localhost:5173

  Login if needed

  ⚙️ Step 3: Enable Radio

  1. Click the ⚙️ Gear Icon (top-right)
  2. Click the "RADIO" tab
  3. Check the box: "Enable Radio Player"
  4. Optional: Check "Auto-play on startup" (if you want music to start automatically)
  5. Optional: Adjust the volume slider to your preference
  6. Click "Save"

  📻 Step 4: See the Player!

  You should now see a floating radio player in the bottom-right corner that looks like:

  ┌─────────────────────────────┐
  │ 📻 Ranger Radio        [_][X]│
  ├─────────────────────────────┤
  │ 🎵 Now Playing:             │
  │ SomaFM Groove Salad         │
  ├─────────────────────────────┤
  │ [▶️]  🔊──────── 30%        │
  │ Station: [Select... ▼]     │
  └─────────────────────────────┘

  🎵 Step 5: Test Controls

  Play Music:

  - Click the ▶️ Play button
  - You should hear ambient music start playing!
  - The button changes to ⏸️ Pause

  Change Volume:

  - Drag the volume slider left/right
  - Volume adjusts in real-time (0-100%)

  Switch Stations:

  - Click the Station dropdown
  - Choose from 10 stations:
    - SomaFM Groove Salad (Ambient downtempo)
    - SomaFM DEF CON Radio (Hacking music)
    - SomaFM Space Station (Ambient space)
    - SomaFM The Trip (Progressive house)
    - SomaFM Drone Zone (Atmospheric)
    - SomaFM Underground 80s (Alternative)
    - SomaFM Digitalis (Downtempo beats)
    - Jazz24 (Contemporary jazz)
    - SomaFM Metal Detector (Heavy metal)
    - SomaFM Left Coast 70s (Mellow rock)

  Minimize Player:

  - Click the header (where it says "Ranger Radio")
  - Player shrinks to small bar
  - Click again to expand

  Close Player:

  - Click the X button
  - Radio closes and stops playing
  - Re-enable in Settings to bring it back

  🎨 Step 6: Test Themes

  Dark Mode:

  - Settings → General → Theme: Dark
  - Radio player shows dark background with white text

  Light Mode:

  - Settings → General → Theme: Light
  - Radio player shows white background with dark text

  Tron Mode (EPIC!):

  - Settings → General → Theme: Tron
  - Radio player shows CYAN GLOW effect! 🌟
  - Black background with glowing cyan borders

  ✅ What to Check:

  Audio Tests:
  - Click Play - music starts
  - Click Pause - music stops
  - Volume slider - adjusts volume smoothly
  - Station change - switches to new station
  - Auto-resume - if playing, new station auto-starts

  UI Tests:
  - Minimize/Maximize - works smoothly
  - Close button - stops music and hides player
  - Reopen (Settings → Enable) - player returns
  - Settings persist - reload page, volume/station remembered

  Theme Tests:
  - Dark mode - clean minimal style
  - Light mode - bright and clear
  - Tron mode - CYAN GLOW visible

  🐛 Troubleshooting:

  "No sound playing"
  - Check your computer volume isn't muted
  - Try a different station (some streams may be down)
  - Click Play button (auto-play blocked by browser)

  "Stream unavailable" error
  - Some stations may be temporarily offline
  - Try a different station
  - Check your internet connection

  "Radio player not showing"
  - Make sure you enabled it in Settings → Radio tab
  - Click "Save" after enabling
  - Make sure you're logged in

  "Auto-play not working"
  - Browsers block auto-play by default
  - You need to interact with the page first (click anything)
  - Then reload - auto-play should work

  🎯 Quick Test Checklist:

  ✅ npm start (both servers running)
  ✅ Open http://localhost:5173
  ✅ Login
  ✅ Settings → RADIO tab
  ✅ Enable Radio Player
  ✅ Save settings
  ✅ See floating player (bottom-right)
  ✅ Click ▶️ Play
  ✅ Hear music! 🎵

  Try it now, Brother! Let me know if you hear the music! 🎖️📻

  Rangers lead the way! 🍀
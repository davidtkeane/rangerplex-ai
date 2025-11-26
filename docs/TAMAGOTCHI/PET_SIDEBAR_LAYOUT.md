# 🐾 Pet Widget Sidebar Layout Plan

## 📐 Image Dimensions Analysis

### Cyber Cat Assets
| File | Actual Size | File Size | Best Use |
|------|-------------|-----------|----------|
| `idle.gif` | **150 x 150px** | 2.2KB | ✅ **PERFECT for sidebar!** |
| `animated.gif` | 1024 x 1024px | 183KB | Scale to 80-100px |
| `animated_alt.gif` | 1024 x 1024px | 182KB | Scale to 80-100px |
| `animated_hq.gif` | 1024 x 1024px (PNG!) | 1.3MB | Too large, skip |
| `effects.gif` | 1024 x 1024px | 94KB | Scale to 80-100px for celebrations |

### Tabby Cat
| File | Actual Size | File Size |
|------|-------------|-----------|
| `animated.gif` | 1024 x 1024px (PNG!) | 699KB | Scale to 80-100px |

### Recommendation
**Use `idle.gif` (150x150) as default** - it's already perfect size and tiny file (2.2KB)!
Scale down to **80px or 100px** for compact sidebar look.

---

## 📏 Sidebar Space Calculations

### Current Sidebar Layout (Estimated)
```
Total Sidebar Height: 100vh (full screen)

┌─────────────────────┐
│ Header (~60px)      │
├─────────────────────┤
│ Chat Logs           │
│ (flexible, 6 max)   │
│ ~400-500px          │
├─────────────────────┤
│ 🐾 PET WIDGET       │  ← NEW! We need ~200-220px
│ (~200-220px)        │
├─────────────────────┤
│ User Controls       │
│ (~180-200px)        │
│ - Username          │
│ - Matrix toggle     │
│ - Dark mode         │
│ - Screensaver       │
│ - Lock              │
└─────────────────────┘
```

### Pet Widget Space Breakdown

**Compact Mode** (Recommended):
```
Total Height: ~200px

┌──────────────────┐
│ 🐾 Ranger Pet    │  ← Header (30px)
├──────────────────┤
│   [  🐱  ]       │  ← Pet Image (80-100px)
│                  │
│   Pixel          │  ← Name (20px)
│   Level 12 ⭐    │  ← Level (20px)
│   💚 Happy       │  ← Mood (20px)
├──────────────────┤
│ [Feed]  [Play]   │  ← Buttons (40px)
└──────────────────┘

Total: 30 + 100 + 60 + 40 = 230px
With padding: ~250px max
```

**Mini Mode** (If space tight):
```
Total Height: ~160px

┌──────────────────┐
│ 🐾 Pet           │  ← Compact header (25px)
├──────────────────┤
│   [  🐱  ]       │  ← Pet Image (60px, smaller)
│   Pixel • Lv 12  │  ← Name + Level inline (18px)
│   💚 Happy       │  ← Mood (18px)
├──────────────────┤
│ [🍎]  [🎾]       │  ← Icon-only buttons (35px)
└──────────────────┘

Total: 25 + 60 + 36 + 35 = 156px
With padding: ~180px max
```

---

## 🎨 Recommended Layout: Compact Mode

### Dimensions
- **Width**: Full sidebar width (220-280px typical)
- **Height**: 200-220px
- **Pet Image**: 80px × 80px (scaled from 150px idle.gif)
- **Buttons**: 2 buttons, 40px height each, side by side

### Visual Mockup
```
┌────────────────────────┐
│  🐾 Ranger Pet         │  30px header
├────────────────────────┤
│         ┌────┐         │
│         │ 🐱 │         │  80x80px pet
│         │    │         │  (centered)
│         └────┘         │
│                        │
│        Pixel           │  Name: 16px
│      Level 12 ⭐       │  Level: 14px
│      💚 Happy          │  Mood: 14px
│                        │
│  ┌─────────┬─────────┐│
│  │🍎 Feed  │🎾 Play  ││  40px buttons
│  └─────────┴─────────┘│
└────────────────────────┘
  Total: ~220px height
```

---

## 💻 CSS Specifications

### Container
```css
.pet-widget-sidebar {
  width: 100%;
  height: 220px; /* Fixed height */
  padding: 12px;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
```

### Header
```css
.pet-header {
  width: 100%;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  color: var(--text-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color-subtle);
}
```

### Pet Display
```css
.pet-avatar {
  width: 80px;
  height: 80px;
  image-rendering: pixelated; /* Keep pixel art crisp */
  margin: 8px 0;
}
```

### Info
```css
.pet-info {
  text-align: center;
  line-height: 1.4;
}

.pet-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.pet-level {
  font-size: 14px;
  color: var(--text-secondary);
}

.pet-mood {
  font-size: 14px;
  color: var(--text-secondary);
}
```

### Buttons
```css
.pet-actions {
  display: flex;
  gap: 8px;
  width: 100%;
  margin-top: 8px;
}

.pet-btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pet-btn-feed {
  background: #4caf50;
  color: white;
}

.pet-btn-feed:hover {
  background: #45a049;
  transform: translateY(-2px);
}

.pet-btn-play {
  background: #2196f3;
  color: white;
}

.pet-btn-play:hover {
  background: #1976d2;
  transform: translateY(-2px);
}
```

---

## 📱 Responsive Considerations

### Desktop (Sidebar width: 280px)
- Pet image: 80px
- Buttons: Full width, side by side
- Total height: 220px

### Tablet (Sidebar width: 240px)
- Pet image: 70px (slightly smaller)
- Buttons: Full width, side by side
- Total height: 200px

### Mobile (Sidebar collapsed or narrow: 200px)
- Pet image: 60px
- Buttons: Stacked vertically OR icon-only
- Total height: 180px OR expand to modal

---

## 🎯 Implementation Phases

### Phase 1: Static Layout (TODAY!)
- [ ] Add pet widget container to sidebar
- [ ] Display idle.gif at 80px
- [ ] Add static text (name, level, mood)
- [ ] Add Feed/Play buttons (no functionality yet)
- [ ] Verify spacing fits between chat logs and user controls

### Phase 2: Basic Functionality (NEXT)
- [ ] Load pet data from API
- [ ] Feed button → Play meow sound + animation
- [ ] Play button → Play purr sound + animation
- [ ] Update stats (XP, hunger, happiness)

### Phase 3: Animations & Behaviors (AFTER)
- [ ] Breathing animation on idle
- [ ] Bounce animation on feed
- [ ] Spin animation on play
- [ ] Mood changes based on stats

### Phase 4: Advanced Features (LATER)
- [ ] Study session integration
- [ ] Achievement celebrations
- [ ] Evolution system
- [ ] Mini-games

---

## ✅ Space Verification

### Sidebar Height Budget (1080p screen example)
```
Screen Height: 1080px

├── Header: 60px
├── Chat Logs: 500px (6 logs @ ~80px each, scrollable)
├── Pet Widget: 220px ← NEW!
├── User Controls: 200px
└── Padding/margins: 100px
────────────────────
Total: 1080px ✅ FITS!
```

### Sidebar Height Budget (Laptop 900px example)
```
Screen Height: 900px

├── Header: 60px
├── Chat Logs: 350px (scrollable, shows 4-5 logs)
├── Pet Widget: 200px ← NEW! (compact mode)
├── User Controls: 200px
└── Padding: 90px
────────────────────
Total: 900px ✅ FITS!
```

---

## 🎨 Color Scheme (Suggested)

### Light Mode
- Background: `#f9fafb`
- Border: `#e5e7eb`
- Text: `#1f2937`
- Feed button: `#4caf50`
- Play button: `#2196f3`

### Dark Mode
- Background: `#1e1e1e`
- Border: `#374151`
- Text: `#f3f4f6`
- Feed button: `#4caf50` (same, stands out)
- Play button: `#2196f3` (same, stands out)

### Tron Mode (Optional)
- Background: `#0a0e1a`
- Border: `#00f3ff` with glow
- Text: `#00f3ff`
- Feed button: `#00f3ff` outline
- Play button: `#00f3ff` outline
- Pet has cyan glow effect!

---

## 🚀 Next Steps

1. **Review this layout** - Does 220px height work for you?
2. **Pick pet size** - 80px or 100px for the cat image?
3. **Button style** - Full text or icon-only for tight spaces?
4. **Build static layout** - Add the box and positioning first
5. **Test spacing** - Verify it fits with chat logs + controls

**Ready to build the layout box?** Just say the word! 🎖️

# 🐾 Tamagotchi Assets Reference

**Location**: `/tamagotchi/`
**Status**: Ready for RangerPlex integration
**Source**: WordPress plugin (cleaned and organized for React)

---

## 📁 Folder Structure

```
tamagotchi/
├── assets/
│   ├── cyber_cat/          # Cyber Cat species animations
│   │   ├── idle.gif        # Idle/breathing animation (2.2KB) - MAIN
│   │   ├── animated.gif    # Happy/active animation (183KB)
│   │   ├── animated_hq.gif # High-quality version (1.3MB)
│   │   ├── animated_alt.gif# Alternative animation (182KB)
│   │   └── effects.gif     # Special effects version (94KB)
│   ├── tabby_cat/          # Tabby Cat species (alternative)
│   │   └── animated.gif    # Main animation (699KB)
│   └── sounds/             # Sound effects
│       ├── meow.mp3        # Feed sound (126KB)
│       ├── purr.mp3        # Play sound (126KB)
│       └── idle.mp3        # Background/idle sound (126KB)
└── reference/              # Original WordPress code for reference
    ├── pet.css             # CSS animations (breathing, bounce, spin, wiggle)
    ├── pet.js              # jQuery interaction logic
    └── docs/
        ├── README.md       # Original WordPress documentation
        └── XP_SYSTEM.md    # XP and leveling system documentation
```

---

## 🎨 Asset Recommendations

### Cyber Cat (Primary Species)

| File | Size | Use For |
|------|------|---------|
| `idle.gif` | 2.2KB | **Default idle state** (lightweight!) |
| `animated.gif` | 183KB | Feed, play, celebrate |
| `animated_hq.gif` | 1.3MB | High-quality option (larger file) |
| `animated_alt.gif` | 182KB | Alternative mood/variation |
| `effects.gif` | 94KB | Level up, achievements |

**Recommended**: Use `idle.gif` as default, `animated.gif` for interactions.

### Tabby Cat (Alternative Species)

| File | Size | Use For |
|------|------|---------|
| `animated.gif` | 699KB | Second species option |

### Sound Effects

| File | Purpose | When to Play |
|------|---------|--------------|
| `meow.mp3` | Feed sound | User feeds pet |
| `purr.mp3` | Play sound | User plays with pet |
| `idle.mp3` | Ambient | Background (optional) |

**Volume**: 0.5 - 0.7 recommended

---

## 🚀 Quick Integration

### Copy Assets to Public
```bash
cp -r tamagotchi/assets/* public/assets/pets/
```

### Use in React Component
```typescript
const PET_ASSETS = {
  cyber_cat: {
    idle: '/assets/pets/cyber_cat/idle.gif',
    happy: '/assets/pets/cyber_cat/animated.gif',
    celebrating: '/assets/pets/cyber_cat/effects.gif',
  },
  sounds: {
    meow: '/assets/pets/sounds/meow.mp3',
    purr: '/assets/pets/sounds/purr.mp3',
  }
};

// Play sound
const audio = new Audio(PET_ASSETS.sounds.meow);
audio.volume = 0.7;
audio.play();

// Display pet
<img src={PET_ASSETS.cyber_cat.idle} alt="Pet" className="pet-avatar" />
```

---

## 💡 Animation Mapping (Proven from WordPress)

| Pet State | GIF | CSS Animation | Sound |
|-----------|-----|---------------|-------|
| Idle | `idle.gif` | `breathing` | None |
| Feeding | `animated.gif` | `bounce` | `meow.mp3` |
| Playing | `animated.gif` | `spin` | `purr.mp3` |
| Happy | `animated.gif` | `wiggle` | None |
| Celebrating | `effects.gif` | `wiggle` + sparkles | None |

**CSS animations available in**: `tamagotchi/reference/pet.css`

---

## 🚧 Implementation Status (RangerPlex)
- ✅ Assets/sounds copied to `public/assets/pets/` and `public/sounds/pets/`.
- ✅ Pet widget rebuilt with no-guilt mechanics (happiness floor 50%), XP/level/bonds, welcome-back bonuses, and per-user persistence (IndexedDB + localStorage).
- ✅ Adoption flow (name/species default) + Feed/Play trigger animations/sounds and respect `petVolume`.
- ⏳ Next: hook Study Clock/achievements for XP/bond boosts and `/pet-chat` persona responses.

---

## 📊 XP System (WordPress Proven)

**XP Gains:**
- Feed: +10 XP
- Play: +10 XP
- Study session: +50 XP (RangerPlex)
- Achievement: +100 XP (RangerPlex)

**Leveling:**
- Level = `Math.floor(XP / 100) + 1`
- Every 100 XP = 1 level

**Stats:**
- Hunger: 0-100 (feed to increase)
- Happiness: 0-100 (play to increase)
- Energy: 0-100 (RangerPlex - new)
- Bonds: 0-1000 (RangerPlex - never decays!)

See `tamagotchi/reference/docs/XP_SYSTEM.md` for details.

---

## 📖 Related Documentation

- **Integration Guide**: `/docs/TAMAGOTCHI_INTEGRATION_PLAN.md`
- **Full Feature Plan**: `/docs/RANGER_PET_TAMAGOTCHI_PLAN.md`
- **Original WordPress Docs**: `tamagotchi/reference/docs/`

---

## ✅ What Was Cleaned

**Removed** (WordPress-specific):
- ❌ PHP files (includes/)
- ❌ WordPress plugin structure (pro/)
- ❌ .DS_Store system files
- ❌ WordPress documentation

**Kept** (RangerPlex ready):
- ✅ All GIF animations (6 files)
- ✅ All sound effects (3 files)
- ✅ CSS animation reference
- ✅ JS logic reference
- ✅ XP system docs

**Total Size**: ~3.2MB (can optimize if needed)

---

🎖️ **Ready to integrate!** All assets are organized and WordPress code removed. Pure assets + reference docs only!

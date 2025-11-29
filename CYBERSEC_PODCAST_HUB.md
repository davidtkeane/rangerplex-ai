# CyberSec Podcast Hub - Development Roadmap

**Created:** November 29, 2025
**Status:** Phase 1 & 2 Complete, Phase 3 Pending

---

## Overview

The CyberSec Podcast Hub is a built-in podcast player for RangerPlex that provides curated cybersecurity content aligned with NCI Cybersecurity course topics:

- **Penetration Testing**
- **Malware Analysis**
- **Digital Forensics**
- **Data Governance & Privacy**
- **Blockchain Security**
- **General Security News**

### Access Points:
1. **Sidebar Button** - Click the headphones icon in the sidebar (expand apps view)
2. **Chat Command** - Type `/podcasts`, `/podcast`, or `/radio` in chat
3. **Settings Easter Egg** - Settings → PODCAST tab (hidden gem!)

---

## Phase 1: RSS Podcast Player ✅ COMPLETE

**No API keys required - uses direct RSS feeds**

### Features Implemented:
- [x] CyberSecPodcast.tsx component
- [x] Dedicated podcast page with sidebar button
- [x] Server endpoints for RSS proxy (`/api/podcast/feed`)
- [x] Server endpoints for audio streaming (`/api/podcast/stream`)
- [x] Settings tab integration (Settings → PODCAST) - Easter egg!
- [x] Category filtering (Pentesting, Malware, Forensics, News, Blockchain)
- [x] Full audio player controls (play/pause, seek, volume, playback speed)
- [x] Episode list with descriptions and dates
- [x] Floating mini-player with minimize/expand
- [x] Theme support (dark/light/tron)
- [x] Refresh button to reload current podcast feed
- [x] Chat command `/podcasts` to open hub from anywhere
- [x] Ranger Easter Egg on play button (shows after 5s inactivity)

### Curated Podcasts:
| Podcast | Category | RSS Feed |
|---------|----------|----------|
| Darknet Diaries | Pentesting | `https://feeds.megaphone.fm/darknetdiaries` |
| 7 Minute Security | Pentesting | `https://7minsec.libsyn.com/rss` |
| Hacking Humans | Pentesting | `https://feeds.megaphone.fm/hacking-humans` |
| Click Here | Pentesting | `https://feeds.megaphone.fm/clickhere` |
| Security Now | Malware | `https://feeds.twit.tv/sn.xml` |
| Malicious Life | Malware | `https://feeds.redcircle.com/597cfd00-b29a-49c6-9622-03c8decfc35f` |
| SANS StormCast | Malware | `https://isc.sans.edu/dailypodcast.xml` |
| Risky Business | Forensics | `https://risky.biz/rss.xml` |
| Defensive Security | Forensics | `https://defensivesecurity.org/feed/podcast` |
| CyberWire Daily | News | `https://thecyberwire.libsyn.com/rss` |
| Smashing Security | News | `https://www.smashingsecurity.com/rss` |
| Cyberlaw Podcast | Governance | `https://www.steptoe.com/feed-Cyberlaw.rss` |
| Privacy Advisor | Governance | `https://iapp.org/media/rss/privacy-advisor-podcast.xml` |
| She Said Privacy | Governance | `https://feeds.captivate.fm/she-said-privacy-he-said-security/` |
| Data Protection Made Easy | Governance | `https://feeds.buzzsprout.com/1041595.rss` |
| Unchained | Blockchain | `https://feeds.simplecast.com/JGE3yC0V` |

### Files Created/Modified:
- `components/CyberSecPodcast.tsx` - Main podcast component
- `components/Sidebar.tsx` - Added podcast button
- `App.tsx` - Added podcast surface and openPodcast handler
- `proxy_server.js` - Added `/api/podcast/feed` and `/api/podcast/stream` endpoints
- `components/SettingsModal.tsx` - Added PODCAST tab (Easter egg)

---

## Phase 2: YouTube Video Integration ✅ COMPLETE

**Uses: FREE YouTube Data API v3 key**

### Features Implemented:
- [x] Audio/Video toggle tabs
- [x] YouTube API integration for video search
- [x] Curated video categories:
  - DEFCON Conference Talks
  - Black Hat Conference
  - Security Now (video version)
  - Hacking Tutorials
  - Malware Analysis
  - CTF Walkthroughs
  - Digital Forensics
  - Blockchain Security
- [x] Custom search with cybersecurity filter
- [x] Embedded YouTube player with autoplay
- [x] Video thumbnails and metadata
- [x] Responsive video grid layout

### API Setup:
Your YouTube API key is already configured in `.env`:
```
VITE_YOUTUBE_API_KEY=AIzaSyC6uHwp3wtWhmUc8cjNoPxCIqwkuNc5YY4
```

### Quota Limits (FREE tier):
- 10,000 units/day
- Search costs 100 units each
- ~100 searches per day on free tier

---

## Phase 3: PodcastIndex Search 🔲 PENDING

**Requires: FREE PodcastIndex API key**

### Planned Features:
- [ ] Search across 4+ million podcasts
- [ ] Discover new cybersecurity podcasts
- [ ] Auto-fetch RSS feeds from search results
- [ ] Trending podcasts section
- [ ] Podcast recommendations
- [ ] Save favorites
- [ ] Recently played history

### API Setup Required:
1. Go to [PodcastIndex API](https://api.podcastindex.org/)
2. Create free developer account
3. Get API Key and Secret
4. Add credentials to `.env` file:
   ```
   VITE_PODCASTINDEX_KEY=your_key
   VITE_PODCASTINDEX_SECRET=your_secret
   ```

### Quota Limits:
- FREE tier with generous limits
- No strict daily quotas
- Rate limiting applies

---

## Known Issues ✅ ALL FIXED

### Port 3010 → 3000 Migration ✅ FIXED
All code files have been updated to use port 3000.

### LocalStorage Quota
- Sync queue can overflow localStorage
- Run `localStorage.removeItem('rangerplex_sync_queue')` in browser console if needed

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CyberSec Podcast Hub                      │
├─────────────────────────────────────────────────────────────┤
│  Phase 1 (Complete)     │  Phase 2 (Complete)               │
│  📻 Audio Podcasts      │  📺 Video Podcasts                │
│  - RSS Feed Parsing     │  - YouTube API                    │
│  - Audio Streaming      │  - Video Embedding                │
│  - Episode Lists        │  - DEFCON/BlackHat Talks          │
│  - Floating Player      │  - Custom Search                  │
├─────────────────────────────────────────────────────────────┤
│  Phase 3 (Pending)                                          │
│  🔍 PodcastIndex Search                                     │
│  - Search 4M+ podcasts                                      │
│  - Discover new content                                     │
│  - Favorites & History                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Commands

```bash
# Start RangerPlex (auto-cleans ports)
npm run browser

# Stop all servers
npm run stop

# Manual port cleanup
./scripts/shutdown.sh
```

---

## Contributing

### Adding New Podcasts
Update the `CYBERSEC_PODCASTS` array in `components/CyberSecPodcast.tsx`:

```typescript
{
  id: 'unique-id',
  name: 'Podcast Name',
  rssUrl: 'https://example.com/feed.xml',
  category: 'pentesting' | 'malware' | 'forensics' | 'news' | 'blockchain',
  description: 'Brief description',
  website: 'https://example.com'
}
```

### Adding New YouTube Categories
Update the `YOUTUBE_CHANNELS` array in `components/CyberSecPodcast.tsx`:

```typescript
{
  id: 'unique-id',
  query: 'search query for YouTube',
  label: 'Display Label',
  icon: 'fa-icon-name'
}
```

---

**Rangers lead the way!** 🎖️

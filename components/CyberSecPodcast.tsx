import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppSettings } from '../types';

// YouTube API Key from environment
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

// YouTube video result
interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
}

// YouTube search queries for cybersecurity content
const YOUTUBE_CHANNELS = [
  { id: 'defcon', query: 'DEFCON conference', label: 'DEFCON Talks', icon: 'fa-shield-halved' },
  { id: 'blackhat', query: 'Black Hat conference security', label: 'Black Hat', icon: 'fa-user-secret' },
  { id: 'securitynow', query: 'Security Now TWiT', label: 'Security Now', icon: 'fa-video' },
  { id: 'hacking', query: 'ethical hacking tutorial 2024', label: 'Hacking Tutorials', icon: 'fa-terminal' },
  { id: 'malware', query: 'malware analysis reverse engineering', label: 'Malware Analysis', icon: 'fa-virus' },
  { id: 'ctf', query: 'CTF walkthrough cybersecurity', label: 'CTF Walkthroughs', icon: 'fa-flag' },
  { id: 'forensics', query: 'digital forensics investigation', label: 'Digital Forensics', icon: 'fa-magnifying-glass' },
  { id: 'blockchain', query: 'blockchain security smart contract audit', label: 'Blockchain Security', icon: 'fa-link' }
];

// Podcast feed configuration
interface PodcastFeed {
  id: string;
  name: string;
  rssUrl: string;
  category: 'pentesting' | 'malware' | 'forensics' | 'news' | 'governance' | 'blockchain' | 'webdev';
  description: string;
  website?: string;
}

// Episode parsed from RSS
interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  pubDate: string;
  duration?: string;
  podcastName: string;
  podcastId: string;
}

// Curated cybersecurity podcast feeds (NCI course topics!)
const CYBERSEC_PODCASTS: PodcastFeed[] = [
  // === PENETRATION TESTING ===
  {
    id: 'darknet-diaries',
    name: 'Darknet Diaries',
    rssUrl: 'https://feeds.megaphone.fm/darknetdiaries',
    category: 'pentesting',
    description: 'True stories from the dark side of the internet - hacking, social engineering, pentesting',
    website: 'https://darknetdiaries.com'
  },
  {
    id: '7min-security',
    name: '7 Minute Security',
    rssUrl: 'https://7minsec.libsyn.com/rss',
    category: 'pentesting',
    description: 'Weekly pentesting tips, blue teaming, and security career advice',
    website: 'https://7minsec.com'
  },
  {
    id: 'hacking-humans',
    name: 'Hacking Humans',
    rssUrl: 'https://feeds.megaphone.fm/hacking-humans',
    category: 'pentesting',
    description: 'Social engineering, deception, and influence in cybercrime - CyberWire',
    website: 'https://thecyberwire.com/podcasts/hacking-humans'
  },
  {
    id: 'click-here',
    name: 'Click Here',
    rssUrl: 'https://feeds.megaphone.fm/clickhere',
    category: 'pentesting',
    description: 'Award-winning stories about hackers, ransomware, and disinformation - Recorded Future',
    website: 'https://therecord.media'
  },

  // === MALWARE ANALYSIS ===
  {
    id: 'security-now',
    name: 'Security Now',
    rssUrl: 'https://feeds.twit.tv/sn.xml',
    category: 'malware',
    description: 'Deep technical security analysis with Steve Gibson - malware, exploits, vulnerabilities',
    website: 'https://twit.tv/shows/security-now'
  },
  {
    id: 'malicious-life',
    name: 'Malicious Life',
    rssUrl: 'https://feeds.redcircle.com/597cfd00-b29a-49c6-9622-03c8decfc35f',
    category: 'malware',
    description: 'The history of cybercrime and malware - nation-state attacks, famous hacks',
    website: 'https://malicious.life'
  },
  {
    id: 'sans-stormcast',
    name: 'SANS StormCast',
    rssUrl: 'https://isc.sans.edu/dailypodcast.xml',
    category: 'malware',
    description: 'Daily 5-minute threat updates from SANS Internet Storm Center',
    website: 'https://isc.sans.edu/podcast.html'
  },

  // === DIGITAL FORENSICS ===
  {
    id: 'risky-business',
    name: 'Risky Business',
    rssUrl: 'https://risky.biz/rss.xml',
    category: 'forensics',
    description: 'Weekly security news and analysis - breaches, incident response, industry insights',
    website: 'https://risky.biz'
  },
  {
    id: 'defensive-security',
    name: 'Defensive Security',
    rssUrl: 'https://defensivesecurity.org/feed/podcast',
    category: 'forensics',
    description: 'Lessons from breaches, malware infections, and intrusions',
    website: 'https://defensivesecurity.org'
  },

  // === SECURITY NEWS ===
  {
    id: 'cyberwire-daily',
    name: 'CyberWire Daily',
    rssUrl: 'https://thecyberwire.libsyn.com/rss',
    category: 'news',
    description: 'Daily cybersecurity news briefing - essential listening for security pros',
    website: 'https://thecyberwire.com'
  },
  {
    id: 'smashing-security',
    name: 'Smashing Security',
    rssUrl: 'https://www.smashingsecurity.com/rss',
    category: 'news',
    description: 'Award-winning entertaining security podcast - hacking, privacy, cybercrime',
    website: 'https://www.smashingsecurity.com'
  },

  // === DATA GOVERNANCE & PRIVACY ===
  {
    id: 'cyberlaw-podcast',
    name: 'Cyberlaw Podcast',
    rssUrl: 'https://www.steptoe.com/feed-Cyberlaw.rss',
    category: 'governance',
    description: 'Technology, security, privacy law with former NSA General Counsel Stewart Baker',
    website: 'https://www.lawfaremedia.org/podcasts-multimedia/podcast/cyberlaw-podcast'
  },
  {
    id: 'privacy-advisor',
    name: 'Privacy Advisor Podcast',
    rssUrl: 'https://iapp.org/media/rss/privacy-advisor-podcast.xml',
    category: 'governance',
    description: 'IAPP podcast on privacy law, GDPR, data protection, and compliance',
    website: 'https://iapp.org/news/privacy-advisor-podcast/'
  },
  {
    id: 'she-said-privacy',
    name: 'She Said Privacy / He Said Security',
    rssUrl: 'https://feeds.captivate.fm/she-said-privacy-he-said-security/',
    category: 'governance',
    description: 'Privacy and security experts discuss compliance, data protection, and risk management',
    website: 'https://www.privacysecuritybrainiacs.com/'
  },
  {
    id: 'data-protection-made-easy',
    name: 'Data Protection Made Easy',
    rssUrl: 'https://feeds.buzzsprout.com/1041595.rss',
    category: 'governance',
    description: 'GDPR, privacy regulations, and data protection best practices simplified',
    website: 'https://www.yourowndata.eu/'
  },

  // === BLOCKCHAIN SECURITY ===
  {
    id: 'unchained',
    name: 'Unchained',
    rssUrl: 'https://feeds.simplecast.com/JGE3yC0V',
    category: 'blockchain',
    description: 'Crypto and blockchain security, DeFi hacks, smart contract vulnerabilities',
    website: 'https://unchainedpodcast.com'
  },

  // === WEB DEVELOPMENT ===
  {
    id: 'html-all-the-things',
    name: 'HTML All The Things',
    rssUrl: 'https://podcast.htmlallthethings.com/feed.xml',
    category: 'webdev',
    description: 'Web development, web design, and small business goodies for developers',
    website: 'https://www.htmlallthethings.com'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'fa-podcast' },
  { id: 'pentesting', label: 'Pentesting', icon: 'fa-user-secret' },
  { id: 'malware', label: 'Malware', icon: 'fa-virus' },
  { id: 'forensics', label: 'Forensics', icon: 'fa-magnifying-glass' },
  { id: 'news', label: 'News', icon: 'fa-newspaper' },
  { id: 'governance', label: 'Governance', icon: 'fa-scale-balanced' },
  { id: 'blockchain', label: 'Blockchain', icon: 'fa-link' },
  { id: 'webdev', label: 'Web Dev', icon: 'fa-code' }
];

interface CyberSecPodcastProps {
  settings: AppSettings;
  bottomOffset?: number; // Offset from bottom (e.g. for RSS ticker)
}

const CyberSecPodcast: React.FC<CyberSecPodcastProps> = ({ settings, bottomOffset = 0 }) => {
  const theme = settings.theme || 'dark';
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastFeed | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  // Tab state: 'audio' or 'video'
  const [activeTab, setActiveTab] = useState<'audio' | 'video'>('audio');

  // YouTube state
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [selectedYoutubeCategory, setSelectedYoutubeCategory] = useState<string>('defcon');
  const [loadingYoutube, setLoadingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState('');
  const [hasYoutubeKey, setHasYoutubeKey] = useState(!!YOUTUBE_API_KEY);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🎧 Ranger Easter Egg - Show rangersmyth-pic.png after 5s of inactivity
  const [showRangerPic, setShowRangerPic] = useState(false);
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 🎧 Reset inactivity timer (called on any user interaction)
  const resetInactivityTimer = useCallback(() => {
    setShowRangerPic(false);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setShowRangerPic(true);
    }, 5000); // 5 seconds
  }, []);

  // 🎧 Setup and cleanup inactivity timer
  useEffect(() => {
    if (showPlayer && !isMinimized) {
      resetInactivityTimer();
    }
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [showPlayer, isMinimized, resetInactivityTimer]);

  // Get proxy URL
  const proxyBaseUrl = settings.corsProxyUrl || 'http://localhost:3000';

  // Parse RSS XML to extract episodes
  const parseRSSFeed = useCallback((xmlText: string, podcast: PodcastFeed): PodcastEpisode[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const items = doc.querySelectorAll('item');
    const episodesList: PodcastEpisode[] = [];

    items.forEach((item, index) => {
      const title = item.querySelector('title')?.textContent || `Episode ${index + 1}`;
      const description = item.querySelector('description')?.textContent ||
        item.querySelector('itunes\\:summary')?.textContent || '';
      const enclosure = item.querySelector('enclosure');
      const audioUrl = enclosure?.getAttribute('url') || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const duration = item.querySelector('itunes\\:duration')?.textContent || '';

      if (audioUrl) {
        episodesList.push({
          id: `${podcast.id}-${index}`,
          title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
          description: description.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').substring(0, 300),
          audioUrl,
          pubDate,
          duration,
          podcastName: podcast.name,
          podcastId: podcast.id
        });
      }
    });

    return episodesList.slice(0, 50); // Limit to 50 episodes
  }, []);

  // Fetch RSS feed
  const fetchPodcastFeed = useCallback(async (podcast: PodcastFeed) => {
    setLoadingFeed(true);
    setError(null);
    setSelectedPodcast(podcast);

    // Always use localhost:3000 for the proxy
    const baseUrl = 'http://localhost:3000';
    const feedUrl = `${baseUrl}/api/podcast/feed?url=${encodeURIComponent(podcast.rssUrl)}`;

    console.log('🎙️ Fetching podcast:', podcast.name);
    console.log('🔗 Feed URL:', feedUrl);

    try {
      const response = await fetch(feedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml, text/xml, */*'
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Feed error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      console.log('✅ Got XML, length:', xmlText.length);

      const parsedEpisodes = parseRSSFeed(xmlText, podcast);
      console.log('📋 Parsed episodes:', parsedEpisodes.length);

      setEpisodes(parsedEpisodes);

    } catch (err) {
      console.error('❌ Failed to fetch podcast feed:', err);
      // More helpful error message
      const errorMsg = (err as Error).message;
      if (errorMsg.includes('Failed to fetch')) {
        setError(`Cannot reach server. Make sure proxy_server is running on port 3000.`);
      } else {
        setError(`Failed to load ${podcast.name}: ${errorMsg}`);
      }
      setEpisodes([]);
    } finally {
      setLoadingFeed(false);
    }
  }, [parseRSSFeed]);

  // Refresh current podcast feed
  const refreshCurrentFeed = useCallback(async () => {
    if (selectedPodcast) {
      setIsRefreshing(true);
      await fetchPodcastFeed(selectedPodcast);
      setLastRefreshed(new Date());
      setIsRefreshing(false);
    }
  }, [selectedPodcast, fetchPodcastFeed]);

  // Play episode
  const playEpisode = useCallback((episode: PodcastEpisode) => {
    if (audioRef.current) {
      // Always use localhost:3000 for the proxy (same as feed fetch)
      const baseUrl = 'http://localhost:3000';
      const proxiedUrl = `${baseUrl}/api/podcast/stream?url=${encodeURIComponent(episode.audioUrl)}`;
      console.log('🎧 Playing episode:', episode.title);
      console.log('🔗 Stream URL:', proxiedUrl);
      audioRef.current.src = proxiedUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setCurrentEpisode(episode);
        setShowPlayer(true);
        setError(null);
      }).catch(err => {
        console.error('Playback error:', err);
        setError('Failed to play episode. Check if server is running on port 3000.');
      });
    }
  }, []);

  // Pause
  const pausePlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    resetInactivityTimer(); // 🎧 Reset timer on interaction
    if (isPlaying) {
      pausePlayback();
    } else if (currentEpisode && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  }, [isPlaying, currentEpisode, pausePlayback, resetInactivityTimer]);

  // Seek
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Skip forward/backward
  const skip = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  }, [duration]);

  // Format time
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setIsLoading(false);
      setError('Failed to load audio');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Playback rate control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // YouTube search function
  const searchYouTube = useCallback(async (query: string) => {
    if (!YOUTUBE_API_KEY) {
      setYoutubeError('YouTube API key not configured. Add VITE_YOUTUBE_API_KEY to .env file.');
      return;
    }

    setLoadingYoutube(true);
    setYoutubeError(null);

    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;

      const response = await fetch(searchUrl);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      const videos: YouTubeVideo[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt
      }));

      setYoutubeVideos(videos);
    } catch (err) {
      console.error('YouTube search error:', err);
      setYoutubeError((err as Error).message);
      setYoutubeVideos([]);
    } finally {
      setLoadingYoutube(false);
    }
  }, []);

  // Load YouTube videos when category changes
  useEffect(() => {
    if (activeTab === 'video' && hasYoutubeKey) {
      const category = YOUTUBE_CHANNELS.find(c => c.id === selectedYoutubeCategory);
      if (category) {
        searchYouTube(category.query);
      }
    }
  }, [activeTab, selectedYoutubeCategory, searchYouTube, hasYoutubeKey]);

  // Handle custom YouTube search
  const handleYoutubeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (youtubeSearchQuery.trim()) {
      searchYouTube(youtubeSearchQuery.trim() + ' cybersecurity');
    }
  };

  // Filter podcasts by category
  const filteredPodcasts = selectedCategory === 'all'
    ? CYBERSEC_PODCASTS
    : CYBERSEC_PODCASTS.filter(p => p.category === selectedCategory);

  // Theme styles
  const isTron = theme === 'tron';
  const isDark = theme === 'dark' || isTron;

  const containerClass = isTron
    ? 'bg-black border-tron-cyan'
    : isDark
      ? 'bg-zinc-900 border-zinc-700'
      : 'bg-white border-gray-200';

  const textClass = isTron ? 'text-tron-cyan' : isDark ? 'text-white' : 'text-gray-900';
  const mutedTextClass = isTron ? 'text-tron-cyan/60' : isDark ? 'text-zinc-400' : 'text-gray-600';
  const cardClass = isTron
    ? 'bg-black/50 border-tron-cyan/30 hover:border-tron-cyan hover:shadow-[0_0_10px_rgba(0,243,255,0.3)]'
    : isDark
      ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-500'
      : 'bg-gray-50 border-gray-200 hover:border-gray-400';

  const categoryColors: Record<string, string> = {
    pentesting: 'bg-red-500',
    malware: 'bg-purple-500',
    forensics: 'bg-blue-500',
    news: 'bg-green-500',
    governance: 'bg-yellow-500',
    blockchain: 'bg-orange-500'
  };

  return (
    <div className={`h-full flex flex-col ${containerClass} ${textClass}`}>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="none" />

      {/* Header */}
      <div className="p-4 border-b border-inherit">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <i className={`fa-solid ${activeTab === 'audio' ? 'fa-headphones' : 'fa-video'} text-2xl`}></i>
            <div>
              <h2 className="text-xl font-bold">CyberSec Podcast Hub</h2>
              <p className={`text-xs ${mutedTextClass}`}>NCI Cybersecurity Course Topics</p>
            </div>
          </div>
          {/* Refresh Button */}
          {activeTab === 'audio' && selectedPodcast && (
            <button
              onClick={refreshCurrentFeed}
              disabled={isRefreshing || loadingFeed}
              title={lastRefreshed ? `Last refreshed: ${lastRefreshed.toLocaleTimeString()}` : 'Refresh podcast feed'}
              className={`px-3 py-2 rounded-lg text-sm font-bold mr-3 transition-all ${isTron
                ? 'bg-tron-cyan/20 text-tron-cyan hover:bg-tron-cyan/30 border border-tron-cyan/50'
                : 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 border border-teal-500/50'
                } ${(isRefreshing || loadingFeed) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <i className={`fa-solid fa-sync ${isRefreshing ? 'fa-spin' : ''} mr-2`}></i>
              Refresh
            </button>
          )}
          {/* Audio/Video Toggle */}
          <div className={`flex rounded-lg overflow-hidden border ${isTron ? 'border-tron-cyan' : 'border-zinc-600'}`}>
            <button
              onClick={() => setActiveTab('audio')}
              className={`px-4 py-2 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'audio'
                ? isTron ? 'bg-tron-cyan text-black' : 'bg-teal-500 text-white'
                : isTron ? 'bg-black/50 text-tron-cyan hover:bg-tron-cyan/20' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
            >
              <i className="fa-solid fa-headphones"></i>
              Audio
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`px-4 py-2 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'video'
                ? isTron ? 'bg-tron-cyan text-black' : 'bg-teal-500 text-white'
                : isTron ? 'bg-black/50 text-tron-cyan hover:bg-tron-cyan/20' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
            >
              <i className="fa-solid fa-video"></i>
              Video
            </button>
          </div>
        </div>

        {/* Category filters - Audio */}
        {activeTab === 'audio' && (
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${selectedCategory === cat.id
                  ? isTron
                    ? 'bg-tron-cyan text-black'
                    : 'bg-teal-500 text-white'
                  : isTron
                    ? 'bg-tron-cyan/10 border border-tron-cyan/50 hover:bg-tron-cyan/20'
                    : isDark
                      ? 'bg-zinc-800 border border-zinc-600 hover:bg-zinc-700'
                      : 'bg-gray-100 border border-gray-300 hover:bg-gray-200'
                  }`}
              >
                <i className={`fa-solid ${cat.icon}`}></i>
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Category filters - Video */}
        {activeTab === 'video' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {YOUTUBE_CHANNELS.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedYoutubeCategory(channel.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${selectedYoutubeCategory === channel.id
                    ? isTron
                      ? 'bg-tron-cyan text-black'
                      : 'bg-red-500 text-white'
                    : isTron
                      ? 'bg-tron-cyan/10 border border-tron-cyan/50 hover:bg-tron-cyan/20'
                      : isDark
                        ? 'bg-zinc-800 border border-zinc-600 hover:bg-zinc-700'
                        : 'bg-gray-100 border border-gray-300 hover:bg-gray-200'
                    }`}
                >
                  <i className={`fa-solid ${channel.icon}`}></i>
                  {channel.label}
                </button>
              ))}
            </div>
            {/* YouTube Search Bar */}
            <form onSubmit={handleYoutubeSearch} className="flex gap-2">
              <input
                type="text"
                value={youtubeSearchQuery}
                onChange={(e) => setYoutubeSearchQuery(e.target.value)}
                placeholder="Search cybersecurity videos..."
                className={`flex-1 px-3 py-2 rounded-lg text-sm ${isTron
                  ? 'bg-black border border-tron-cyan/50 text-tron-cyan placeholder:text-tron-cyan/40'
                  : isDark
                    ? 'bg-zinc-800 border border-zinc-600 text-white placeholder:text-zinc-500'
                    : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400'
                  }`}
              />
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg font-bold text-sm ${isTron ? 'bg-tron-cyan text-black' : 'bg-red-500 text-white'
                  }`}
              >
                <i className="fa-solid fa-search"></i>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Main content - Audio Podcasts */}
      {activeTab === 'audio' && (
        <div className="flex-1 overflow-hidden flex">
          {/* Podcast list */}
          <div className="w-1/3 border-r border-inherit overflow-y-auto p-3 space-y-2">
            <h3 className="text-sm font-bold mb-2 opacity-70">Podcasts</h3>
            {filteredPodcasts.map(podcast => (
              <button
                key={podcast.id}
                onClick={() => fetchPodcastFeed(podcast)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${cardClass} ${selectedPodcast?.id === podcast.id ? 'ring-2 ring-teal-500' : ''
                  }`}
              >
                <div className="flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1.5 ${categoryColors[podcast.category]}`}></span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{podcast.name}</div>
                    <div className={`text-xs ${mutedTextClass} line-clamp-2`}>{podcast.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Episodes list */}
          <div className="flex-1 overflow-y-auto p-3">
            {loadingFeed ? (
              <div className="flex items-center justify-center h-full">
                <i className="fa-solid fa-circle-notch fa-spin text-2xl opacity-50"></i>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <i className="fa-solid fa-exclamation-triangle text-3xl text-red-500 mb-2"></i>
                <p className="text-sm text-red-500">{error}</p>
              </div>
            ) : !selectedPodcast ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                <i className="fa-solid fa-arrow-left text-3xl mb-2"></i>
                <p className="text-sm">Select a podcast to view episodes</p>
              </div>
            ) : episodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                <i className="fa-solid fa-podcast text-3xl mb-2"></i>
                <p className="text-sm">No episodes found</p>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <span>{selectedPodcast.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[selectedPodcast.category]} text-white`}>
                    {selectedPodcast.category}
                  </span>
                  <span className={`text-xs ${mutedTextClass}`}>({episodes.length} episodes)</span>
                </h3>
                <div className="space-y-2">
                  {episodes.map(episode => (
                    <div
                      key={episode.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${cardClass} ${currentEpisode?.id === episode.id ? 'ring-2 ring-teal-500' : ''
                        }`}
                      onClick={() => playEpisode(episode)}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isTron ? 'bg-tron-cyan/20 text-tron-cyan' : 'bg-teal-500/20 text-teal-500'
                            }`}
                        >
                          {currentEpisode?.id === episode.id && isPlaying ? (
                            <i className="fa-solid fa-pause"></i>
                          ) : (
                            <i className="fa-solid fa-play ml-0.5"></i>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm line-clamp-2">{episode.title}</div>
                          <div className={`text-xs ${mutedTextClass} mt-1 line-clamp-2`}>{episode.description}</div>
                          <div className={`text-xs ${mutedTextClass} mt-1 flex items-center gap-3`}>
                            {episode.pubDate && (
                              <span><i className="fa-solid fa-calendar mr-1"></i>{new Date(episode.pubDate).toLocaleDateString()}</span>
                            )}
                            {episode.duration && (
                              <span><i className="fa-solid fa-clock mr-1"></i>{episode.duration}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main content - Video */}
      {activeTab === 'video' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {!hasYoutubeKey ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <i className="fa-brands fa-youtube text-6xl text-red-500 mb-4"></i>
              <h3 className="text-xl font-bold mb-2">YouTube API Key Required</h3>
              <p className={`text-sm ${mutedTextClass} max-w-md mb-4`}>
                To access cybersecurity videos, you need a FREE YouTube Data API v3 key.
              </p>
              <ol className={`text-sm ${mutedTextClass} text-left space-y-2 mb-4`}>
                <li>1. Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener" className="text-teal-400 underline">Google Cloud Console</a></li>
                <li>2. Create a project and enable "YouTube Data API v3"</li>
                <li>3. Create an API key under Credentials</li>
                <li>4. Add <code className="bg-zinc-800 px-1 rounded">VITE_YOUTUBE_API_KEY=your_key</code> to your <code className="bg-zinc-800 px-1 rounded">.env</code> file</li>
                <li>5. Restart the app</li>
              </ol>
              <p className={`text-xs ${mutedTextClass}`}>
                Free tier: ~100 searches per day (10,000 quota units)
              </p>
            </div>
          ) : currentVideo ? (
            // Video Player
            <div className="flex-1 flex flex-col">
              <div className="flex-1 bg-black flex items-center justify-center">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1`}
                  title={currentVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="p-4 border-t border-inherit">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg line-clamp-2">{currentVideo.title}</h3>
                    <p className={`text-sm ${mutedTextClass} mt-1`}>{currentVideo.channelTitle}</p>
                  </div>
                  <button
                    onClick={() => setCurrentVideo(null)}
                    className={`px-3 py-2 rounded-lg text-sm ${isTron ? 'bg-tron-cyan/20 hover:bg-tron-cyan/30' : 'bg-zinc-700 hover:bg-zinc-600'
                      }`}
                  >
                    <i className="fa-solid fa-list mr-2"></i>Back to List
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Video List
            <div className="flex-1 overflow-y-auto p-4">
              {loadingYoutube ? (
                <div className="flex items-center justify-center h-full">
                  <i className="fa-solid fa-circle-notch fa-spin text-3xl opacity-50"></i>
                </div>
              ) : youtubeError ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <i className="fa-solid fa-exclamation-triangle text-3xl text-red-500 mb-2"></i>
                  <p className="text-sm text-red-500">{youtubeError}</p>
                </div>
              ) : youtubeVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                  <i className="fa-brands fa-youtube text-4xl mb-2"></i>
                  <p className="text-sm">Select a category or search for videos</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {youtubeVideos.map(video => (
                    <div
                      key={video.id}
                      onClick={() => setCurrentVideo(video)}
                      className={`rounded-lg overflow-hidden border cursor-pointer transition-all ${cardClass} hover:scale-[1.02]`}
                    >
                      <div className="relative">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-36 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <i className="fa-solid fa-play text-3xl text-white"></i>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-bold text-sm line-clamp-2">{video.title}</h4>
                        <p className={`text-xs ${mutedTextClass} mt-1`}>{video.channelTitle}</p>
                        <p className={`text-xs ${mutedTextClass} mt-1`}>
                          <i className="fa-solid fa-calendar mr-1"></i>
                          {new Date(video.publishedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Player - positioned left of Ranger Radio */}
      {showPlayer && currentEpisode && (
        <div
          className={`fixed right-[23rem] z-50 rounded-xl border-2 shadow-2xl backdrop-blur-sm transition-all ${isTron ? 'bg-black/90 border-tron-cyan' : isDark ? 'bg-zinc-900/95 border-zinc-600' : 'bg-white/95 border-gray-300'
            } ${isMinimized ? 'w-72' : 'w-96'}`}
          style={{
            bottom: `${16 + bottomOffset}px`
          }}
        >
          {/* Player header */}
          <div
            className={`flex items-center justify-between p-3 cursor-pointer ${textClass}`}
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isTron ? 'bg-tron-cyan/20' : 'bg-teal-500/20'
                }`}>
                {isLoading ? (
                  <i className="fa-solid fa-circle-notch fa-spin text-sm"></i>
                ) : isPlaying ? (
                  <i className="fa-solid fa-volume-high text-sm"></i>
                ) : (
                  <i className="fa-solid fa-headphones text-sm"></i>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs truncate">{currentEpisode.title}</div>
                <div className={`text-xs ${mutedTextClass} truncate`}>{currentEpisode.podcastName}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                className="w-6 h-6 flex items-center justify-center hover:opacity-70"
              >
                <i className={`fa-solid ${isMinimized ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`}></i>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); pausePlayback(); setShowPlayer(false); }}
                className="w-6 h-6 flex items-center justify-center hover:opacity-70"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
          </div>

          {/* Expanded controls */}
          {!isMinimized && (
            <div className="px-3 pb-3 space-y-3">
              {/* Progress bar */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: isTron
                      ? `linear-gradient(to right, #00f3ff 0%, #00f3ff ${(currentTime / duration) * 100}%, rgba(0,243,255,0.2) ${(currentTime / duration) * 100}%, rgba(0,243,255,0.2) 100%)`
                      : `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
                  }}
                />
                <div className={`flex justify-between text-xs ${mutedTextClass}`}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main controls */}
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => { resetInactivityTimer(); skip(-15); }} className="w-8 h-8 flex items-center justify-center hover:opacity-70" title="Back 15s">
                  <i className="fa-solid fa-rotate-left text-sm"></i>
                </button>
                <button
                  onClick={togglePlayPause}
                  onMouseEnter={() => setIsHoveringButton(true)}
                  onMouseLeave={() => setIsHoveringButton(false)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden transition-all ${isTron ? 'bg-tron-cyan text-black' : 'bg-teal-500 text-white'
                    }`}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {/* 🎧 Show Ranger's picture after 5s of inactivity, hide on hover */}
                  {showRangerPic && !isHoveringButton ? (
                    <img
                      src="/image/rangersmyth-pic.png"
                      alt="Ranger"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : isLoading ? (
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                  ) : isPlaying ? (
                    <i className="fa-solid fa-pause text-lg"></i>
                  ) : (
                    <i className="fa-solid fa-play text-lg ml-1"></i>
                  )}
                </button>
                <button onClick={() => { resetInactivityTimer(); skip(30); }} className="w-8 h-8 flex items-center justify-center hover:opacity-70" title="Forward 30s">
                  <i className="fa-solid fa-rotate-right text-sm"></i>
                </button>
              </div>

              {/* Volume & Speed */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <i className="fa-solid fa-volume-low text-xs opacity-60"></i>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume * 100}
                    onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
                    className="flex-1 h-1 rounded-lg appearance-none cursor-pointer bg-gray-600"
                  />
                  <i className="fa-solid fa-volume-high text-xs opacity-60"></i>
                </div>
                <select
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                  className={`text-xs px-2 py-1 rounded border ${isTron ? 'bg-black border-tron-cyan text-tron-cyan' : isDark ? 'bg-zinc-800 border-zinc-600' : 'bg-white border-gray-300'
                    }`}
                >
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1">1x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CyberSecPodcast;

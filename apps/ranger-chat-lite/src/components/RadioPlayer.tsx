import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

interface RadioStation {
  id: string;
  name: string;
  url: string;
  genre: string;
  description: string;
}

interface PodcastFeed {
  id: string;
  name: string;
  feedUrl: string;
  category: string;
  description: string;
  imageUrl?: string;
}

interface PodcastEpisode {
  id: string;
  feedId: string;
  feedName: string;
  title: string;
  audioUrl: string;
  description: string;
  pubDate: string;
  duration?: string;
  imageUrl?: string;
}

// Radio settings interface (standalone)
export interface RadioSettings {
  radioEnabled: boolean;
  radioVolume: number;
  radioLastStation: string | null;
  radioMinimized: boolean;
  // Podcast settings
  podcastMode?: boolean;
  podcastLastEpisode?: string | null;
  podcastPlaybackSpeed?: number;
  podcastProgress?: { [episodeId: string]: number };
}

// 🎵 SomaFM Radio Stations
const RADIO_STATIONS: RadioStation[] = [
  // 🎧 AMBIENT / FOCUS
  { id: 'soma-groovesalad', name: 'Groove Salad', url: 'https://ice1.somafm.com/groovesalad-128-mp3', genre: 'Ambient', description: 'Ambient/downtempo beats' },
  { id: 'soma-dronezone', name: 'Drone Zone', url: 'https://ice1.somafm.com/dronezone-128-mp3', genre: 'Ambient', description: 'Atmospheric textures' },
  { id: 'soma-deepspaceone', name: 'Deep Space One', url: 'https://ice1.somafm.com/deepspaceone-128-mp3', genre: 'Ambient', description: 'Deep ambient space music' },
  { id: 'soma-spacestation', name: 'Space Station', url: 'https://ice1.somafm.com/spacestation-128-mp3', genre: 'Ambient', description: 'Spaced-out electronica' },
  { id: 'soma-missioncontrol', name: 'Mission Control', url: 'https://ice1.somafm.com/missioncontrol-128-mp3', genre: 'Ambient', description: 'NASA & space explorers' },
  // 💻 ELECTRONIC / CODING
  { id: 'soma-defcon', name: 'DEF CON Radio', url: 'https://ice1.somafm.com/defcon-128-mp3', genre: 'Electronic', description: 'Music for hacking' },
  { id: 'soma-beatblender', name: 'Beat Blender', url: 'https://ice1.somafm.com/beatblender-128-mp3', genre: 'Electronic', description: 'Deep-house chill' },
  { id: 'soma-cliqhop', name: 'cliqhop idm', url: 'https://ice1.somafm.com/cliqhop-128-mp3', genre: 'Electronic', description: 'Intelligent Dance Music' },
  { id: 'soma-thetrip', name: 'The Trip', url: 'https://ice1.somafm.com/thetrip-128-mp3', genre: 'Electronic', description: 'Progressive house' },
  { id: 'soma-dubstep', name: 'Dub Step Beyond', url: 'https://ice1.somafm.com/dubstep-128-mp3', genre: 'Electronic', description: 'Dubstep & deep bass' },
  // 🎷 LOUNGE / CHILL
  { id: 'soma-lush', name: 'Lush', url: 'https://ice1.somafm.com/lush-128-mp3', genre: 'Lounge', description: 'Mellow female vocals' },
  { id: 'soma-secretagent', name: 'Secret Agent', url: 'https://ice1.somafm.com/secretagent-128-mp3', genre: 'Lounge', description: 'Mysterious soundtrack' },
  { id: 'soma-bossabeyond', name: 'Bossa Beyond', url: 'https://ice1.somafm.com/bossa-128-mp3', genre: 'Lounge', description: 'Brazilian Bossa Nova' },
  // 🎸 ROCK / ALTERNATIVE
  { id: 'soma-indiepop', name: 'Indie Pop Rocks!', url: 'https://ice1.somafm.com/indiepop-128-mp3', genre: 'Rock', description: 'Indie pop tracks' },
  { id: 'soma-u80s', name: 'Underground 80s', url: 'https://ice1.somafm.com/u80s-128-mp3', genre: 'Rock', description: '80s Synthpop & New Wave' },
  // 🤘 METAL
  { id: 'soma-metal', name: 'Metal Detector', url: 'https://ice1.somafm.com/metal-128-mp3', genre: 'Metal', description: 'Black to doom, thrash to post' },
  // 🎺 JAZZ / SOUL
  { id: 'soma-sonicuniverse', name: 'Sonic Universe', url: 'https://ice1.somafm.com/sonicuniverse-128-mp3', genre: 'Jazz', description: 'Avant-garde jazz' },
  { id: 'soma-7soul', name: 'Seven Inch Soul', url: 'https://ice1.somafm.com/7soul-128-mp3', genre: 'Jazz', description: 'Vintage soul vinyl' },
  // 🌍 WORLD
  { id: 'soma-thistle', name: 'ThistleRadio', url: 'https://ice1.somafm.com/thistle-128-mp3', genre: 'World', description: 'Celtic roots' },
  { id: 'soma-reggae', name: 'Heavyweight Reggae', url: 'https://ice1.somafm.com/reggae-128-mp3', genre: 'World', description: 'Reggae & Ska classics' },
  // 🎄 HOLIDAY
  { id: 'soma-xmaslounge', name: 'Christmas Lounge', url: 'https://ice1.somafm.com/christmas-128-mp3', genre: 'Holiday', description: 'Chilled holiday grooves' },
  { id: 'soma-xmasrocks', name: 'Christmas Rocks!', url: 'https://ice1.somafm.com/xmasrocks-128-mp3', genre: 'Holiday', description: 'Indie holiday season' },
];

// 🎙️ Default Podcast Feeds
const PODCAST_FEEDS: PodcastFeed[] = [
  // 🔒 SECURITY & HACKING
  { id: 'darknet-diaries', name: 'Darknet Diaries', feedUrl: 'https://feeds.megaphone.fm/darknetdiaries', category: 'Security', description: 'True stories from the dark side of the Internet' },
  { id: 'security-now', name: 'Security Now', feedUrl: 'https://feeds.twit.tv/sn.xml', category: 'Security', description: 'Deep dive into security topics with Steve Gibson' },
  { id: 'risky-business', name: 'Risky Business', feedUrl: 'https://risky.biz/feeds/risky-business/', category: 'Security', description: 'News and commentary from the security industry' },
  { id: 'malicious-life', name: 'Malicious Life', feedUrl: 'https://malicious.life/feed/podcast/', category: 'Security', description: 'Untold stories of the history of cybersecurity' },
  // 💻 TECH & CODING
  { id: 'syntax', name: 'Syntax.fm', feedUrl: 'https://feed.syntax.fm/rss', category: 'Coding', description: 'Tasty web development treats' },
  { id: 'changelog', name: 'The Changelog', feedUrl: 'https://changelog.com/podcast/feed', category: 'Coding', description: 'News and conversations for software developers' },
  { id: 'codenewbie', name: 'CodeNewbie', feedUrl: 'https://feeds.codenewbie.org/codenewbie.xml', category: 'Coding', description: 'Stories from people on their coding journey' },
  { id: 'software-engineering-daily', name: 'Software Engineering Daily', feedUrl: 'https://softwareengineeringdaily.com/feed/podcast/', category: 'Coding', description: 'Technical interviews about software topics' },
  // 🎤 TECH INTERVIEWS
  { id: 'lex-fridman', name: 'Lex Fridman Podcast', feedUrl: 'https://lexfridman.com/feed/podcast/', category: 'Interviews', description: 'Conversations about AI, science, and the human condition' },
  { id: 'hpr', name: 'Hacker Public Radio', feedUrl: 'https://hackerpublicradio.org/hpr_rss.php', category: 'Hacking', description: 'Community-driven podcast by and for hackers' },
];

interface RadioPlayerProps {
  settings: RadioSettings;
  onSettingsChange: (updates: Partial<RadioSettings>) => void;
  theme: 'classic' | 'matrix' | 'tron' | 'retro';
}

const RadioPlayer: React.FC<RadioPlayerProps> = ({ settings, onSettingsChange, theme }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Mode: radio or podcast
  const [mode, setMode] = useState<'radio' | 'podcast'>(settings.podcastMode ? 'podcast' : 'radio');

  // Radio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStation, setCurrentStation] = useState<RadioStation>(
    RADIO_STATIONS.find(s => s.id === settings.radioLastStation) || RADIO_STATIONS[0]
  );
  const [volume, setVolume] = useState(settings.radioVolume);
  const [isMinimized, setIsMinimized] = useState(settings.radioMinimized);
  const [error, setError] = useState<string | null>(null);

  // Podcast state
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null);
  const [selectedFeed, setSelectedFeed] = useState<PodcastFeed>(PODCAST_FEEDS[0]);
  const [playbackSpeed, setPlaybackSpeed] = useState(settings.podcastPlaybackSpeed || 1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const memoizedStreamUrl = useMemo(() => {
    if (mode === 'podcast' && currentEpisode) {
      return currentEpisode.audioUrl;
    }
    return currentStation.url;
  }, [mode, currentStation.url, currentEpisode]);

  // Get theme colors
  const getThemeColors = useCallback(() => {
    switch (theme) {
      case 'matrix': return { primary: '#00ff00', secondary: '#00aa00', bg: '#0a1a0a' };
      case 'tron': return { primary: '#00d4ff', secondary: '#0088aa', bg: '#0a0a1a' };
      case 'retro': return { primary: '#f59e0b', secondary: '#d97706', bg: '#fef3c7' };
      default: return { primary: '#4da6ff', secondary: '#2d5a87', bg: '#1e3a5f' };
    }
  }, [theme]);

  // 🎵 Audio Visualizer
  const drawVisualizer = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current || !isPlaying) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = getThemeColors();
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / 32;
    const barGap = 2;

    for (let i = 0; i < 32; i++) {
      const dataIndex = Math.floor(i * bufferLength / 32);
      const value = dataArray[dataIndex];
      const barHeight = (value / 255) * canvas.height * 0.9;

      const x = i * (barWidth + barGap);
      const y = canvas.height - barHeight;

      const gradient = ctx.createLinearGradient(x, y, x, canvas.height);
      gradient.addColorStop(0, colors.primary);
      gradient.addColorStop(1, colors.secondary);

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
    }

    animationRef.current = requestAnimationFrame(drawVisualizer);
  }, [isPlaying, getThemeColors]);

  // Setup audio context and analyser
  const setupAudioContext = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;

    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    } catch (e) {
      console.log('Audio context setup failed:', e);
    }
  }, []);

  // Start/stop visualizer
  useEffect(() => {
    if (isPlaying && analyserRef.current) {
      drawVisualizer();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, drawVisualizer]);

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Update playback speed
  useEffect(() => {
    if (audioRef.current && mode === 'podcast') {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, mode]);

  // Fetch podcast episodes when feed changes
  useEffect(() => {
    if (mode === 'podcast' && selectedFeed) {
      fetchEpisodes(selectedFeed);
    }
  }, [selectedFeed, mode]);

  // Fetch episodes from podcast feed
  const fetchEpisodes = async (feed: PodcastFeed) => {
    setLoadingEpisodes(true);
    setError(null);

    try {
      // Use a CORS proxy or backend
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feed.feedUrl)}`;
      const response = await fetch(proxyUrl);
      const text = await response.text();

      // Parse XML
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');

      const items = xml.querySelectorAll('item');
      const parsedEpisodes: PodcastEpisode[] = [];

      items.forEach((item, index) => {
        if (index >= 20) return; // Limit to 20 episodes

        const enclosure = item.querySelector('enclosure');
        const audioUrl = enclosure?.getAttribute('url');

        if (audioUrl) {
          parsedEpisodes.push({
            id: `${feed.id}-${index}`,
            feedId: feed.id,
            feedName: feed.name,
            title: item.querySelector('title')?.textContent || 'Untitled Episode',
            audioUrl,
            description: item.querySelector('description')?.textContent?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
            pubDate: item.querySelector('pubDate')?.textContent || '',
            duration: item.querySelector('itunes\\:duration, duration')?.textContent || '',
          });
        }
      });

      setEpisodes(parsedEpisodes);
      if (parsedEpisodes.length > 0 && !currentEpisode) {
        setCurrentEpisode(parsedEpisodes[0]);
      }
    } catch (err) {
      console.error('Failed to fetch podcast:', err);
      setError('Failed to load podcast');
      setEpisodes([]);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const handlePlay = async () => {
    if (!audioRef.current) return;

    setIsLoading(true);
    setError(null);

    if (!audioContextRef.current) {
      setupAudioContext();
    }

    try {
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      await audioRef.current.play();
      setIsPlaying(true);
      setIsLoading(false);
    } catch (err) {
      if ((err as Error).name === 'NotAllowedError') {
        console.log('📻 Auto-play prevented');
      } else {
        console.error('Play error:', err);
        setError('Failed to play');
      }
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    onSettingsChange({ radioVolume: newVolume });
  };

  const handleStationChange = (stationId: string) => {
    const station = RADIO_STATIONS.find(s => s.id === stationId);
    if (station) {
      const wasPlaying = isPlaying;
      handlePause();
      setCurrentStation(station);
      onSettingsChange({ radioLastStation: stationId });
      if (wasPlaying) {
        setTimeout(() => handlePlay(), 100);
      }
    }
  };

  const handleEpisodeChange = (episode: PodcastEpisode) => {
    const wasPlaying = isPlaying;
    handlePause();
    setCurrentEpisode(episode);
    setCurrentTime(0);
    onSettingsChange({ podcastLastEpisode: episode.id });
    if (wasPlaying) {
      setTimeout(() => handlePlay(), 100);
    }
  };

  const handlePrevStation = () => {
    if (mode === 'podcast') {
      const currentIndex = episodes.findIndex(e => e.id === currentEpisode?.id);
      if (currentIndex > 0) {
        handleEpisodeChange(episodes[currentIndex - 1]);
      }
    } else {
      const currentIndex = RADIO_STATIONS.findIndex(s => s.id === currentStation.id);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : RADIO_STATIONS.length - 1;
      handleStationChange(RADIO_STATIONS[prevIndex].id);
    }
  };

  const handleNextStation = () => {
    if (mode === 'podcast') {
      const currentIndex = episodes.findIndex(e => e.id === currentEpisode?.id);
      if (currentIndex < episodes.length - 1) {
        handleEpisodeChange(episodes[currentIndex + 1]);
      }
    } else {
      const currentIndex = RADIO_STATIONS.findIndex(s => s.id === currentStation.id);
      const nextIndex = currentIndex < RADIO_STATIONS.length - 1 ? currentIndex + 1 : 0;
      handleStationChange(RADIO_STATIONS[nextIndex].id);
    }
  };

  const toggleMinimize = () => {
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    onSettingsChange({ radioMinimized: newMinimized });
  };

  const handleClose = () => {
    handlePause();
    onSettingsChange({ radioEnabled: false });
  };

  const handleModeSwitch = (newMode: 'radio' | 'podcast') => {
    if (newMode !== mode) {
      handlePause();
      setMode(newMode);
      onSettingsChange({ podcastMode: newMode === 'podcast' });
      if (newMode === 'radio') {
        // Reset to radio mode
        if (audioRef.current) {
          audioRef.current.playbackRate = 1;
        }
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    onSettingsChange({ podcastPlaybackSpeed: speed });
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleAudioError = () => {
    setError('Stream unavailable');
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleAudioCanPlay = () => {
    setIsLoading(false);
    setError(null);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentName = mode === 'podcast' && currentEpisode
    ? currentEpisode.title.slice(0, 30) + (currentEpisode.title.length > 30 ? '...' : '')
    : currentStation.name;

  return (
    <>
      <audio
        ref={audioRef}
        src={memoizedStreamUrl}
        onError={handleAudioError}
        onCanPlay={handleAudioCanPlay}
        onTimeUpdate={handleTimeUpdate}
        preload="none"
        crossOrigin="anonymous"
      />

      {/* Radio/Podcast Bar */}
      <div className={`radio-bar ${theme} ${isMinimized ? 'minimized' : 'expanded'}`}>
        {/* Visualizer Canvas */}
        <canvas
          ref={canvasRef}
          className="radio-visualizer"
          width={isMinimized ? 100 : 280}
          height={isMinimized ? 30 : 40}
        />

        {/* Minimized View */}
        {isMinimized ? (
          <div className="radio-mini">
            <button className="radio-ctrl-btn" onClick={handlePrevStation} title="Previous">⏮</button>
            <button
              className={`radio-ctrl-btn play ${isPlaying ? 'playing' : ''}`}
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={isLoading}
            >
              {isLoading ? '⟳' : isPlaying ? '⏸' : '▶'}
            </button>
            <button className="radio-ctrl-btn" onClick={handleNextStation} title="Next">⏭</button>

            <div className="radio-mini-info">
              <span className="radio-mini-mode">{mode === 'podcast' ? '🎙️' : '📻'}</span>
              <span className="radio-mini-name">{currentName}</span>
              {isPlaying && <span className="radio-mini-playing">🎵</span>}
            </div>

            {mode === 'podcast' && duration > 0 && (
              <span className="radio-mini-time">{formatTime(currentTime)}</span>
            )}

            <input
              type="range"
              className="radio-mini-volume"
              min="0"
              max="100"
              value={volume * 100}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value) / 100)}
              title={`Volume: ${Math.round(volume * 100)}%`}
            />

            <button className="radio-ctrl-btn" onClick={toggleMinimize} title="Expand">▲</button>
            <button className="radio-ctrl-btn close" onClick={handleClose} title="Close">✕</button>
          </div>
        ) : (
          /* Expanded View */
          <div className="radio-expanded">
            {/* Header with mode toggle */}
            <div className="radio-exp-header">
              <div className="radio-mode-toggle">
                <button
                  className={`radio-mode-btn ${mode === 'radio' ? 'active' : ''}`}
                  onClick={() => handleModeSwitch('radio')}
                >
                  📻 Radio
                </button>
                <button
                  className={`radio-mode-btn ${mode === 'podcast' ? 'active' : ''}`}
                  onClick={() => handleModeSwitch('podcast')}
                >
                  🎙️ Podcasts
                </button>
              </div>
              <div className="radio-exp-controls-top">
                <button className="radio-ctrl-btn" onClick={toggleMinimize} title="Minimize">▼</button>
                <button className="radio-ctrl-btn close" onClick={handleClose} title="Close">✕</button>
              </div>
            </div>

            {/* Current playing info */}
            <div className="radio-exp-station">
              <div className="radio-exp-name">
                {mode === 'podcast' && currentEpisode ? currentEpisode.title : currentStation.name}
              </div>
              <div className="radio-exp-desc">
                {mode === 'podcast' && currentEpisode ? currentEpisode.feedName : currentStation.description}
              </div>
            </div>

            {error && <div className="radio-error">{error}</div>}

            {/* Progress bar for podcasts */}
            {mode === 'podcast' && duration > 0 && (
              <div className="radio-progress">
                <span className="radio-time">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  className="radio-seek-bar"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                />
                <span className="radio-time">{formatTime(duration)}</span>
              </div>
            )}

            {/* Main controls */}
            <div className="radio-exp-main-controls">
              <button className="radio-ctrl-btn lg" onClick={handlePrevStation}>⏮</button>
              <button
                className={`radio-ctrl-btn xl play ${isPlaying ? 'playing' : ''}`}
                onClick={isPlaying ? handlePause : handlePlay}
                disabled={isLoading}
              >
                {isLoading ? '⟳' : isPlaying ? '⏸' : '▶'}
              </button>
              <button className="radio-ctrl-btn lg" onClick={handleNextStation}>⏭</button>
            </div>

            {/* Volume */}
            <div className="radio-exp-volume">
              <span className="radio-vol-icon">🔊</span>
              <input
                type="range"
                className="radio-volume-slider"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value) / 100)}
              />
              <span className="radio-vol-value">{Math.round(volume * 100)}%</span>
            </div>

            {/* Playback speed for podcasts */}
            {mode === 'podcast' && (
              <div className="radio-speed-control">
                <span className="radio-speed-label">Speed:</span>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                  <button
                    key={speed}
                    className={`radio-speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                    onClick={() => handleSpeedChange(speed)}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}

            {/* Station/Episode selector */}
            {mode === 'radio' ? (
              <select
                className="radio-station-select"
                value={currentStation.id}
                onChange={(e) => handleStationChange(e.target.value)}
              >
                {['Ambient', 'Electronic', 'Lounge', 'Rock', 'Metal', 'Jazz', 'World', 'Holiday'].map(genre => {
                  const genreStations = RADIO_STATIONS.filter(s => s.genre === genre);
                  if (genreStations.length === 0) return null;
                  return (
                    <optgroup key={genre} label={`🎵 ${genre}`}>
                      {genreStations.map(station => (
                        <option key={station.id} value={station.id}>{station.name}</option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            ) : (
              <>
                {/* Podcast feed selector */}
                <select
                  className="radio-station-select"
                  value={selectedFeed.id}
                  onChange={(e) => {
                    const feed = PODCAST_FEEDS.find(f => f.id === e.target.value);
                    if (feed) {
                      setSelectedFeed(feed);
                      setCurrentEpisode(null);
                    }
                  }}
                >
                  {['Security', 'Coding', 'Interviews', 'Hacking'].map(category => {
                    const categoryFeeds = PODCAST_FEEDS.filter(f => f.category === category);
                    if (categoryFeeds.length === 0) return null;
                    return (
                      <optgroup key={category} label={`🎙️ ${category}`}>
                        {categoryFeeds.map(feed => (
                          <option key={feed.id} value={feed.id}>{feed.name}</option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>

                {/* Episode list */}
                <div className="radio-episode-list">
                  {loadingEpisodes ? (
                    <div className="radio-loading">Loading episodes...</div>
                  ) : episodes.length === 0 ? (
                    <div className="radio-loading">No episodes found</div>
                  ) : (
                    episodes.slice(0, 10).map(episode => (
                      <div
                        key={episode.id}
                        className={`radio-episode-item ${currentEpisode?.id === episode.id ? 'active' : ''}`}
                        onClick={() => handleEpisodeChange(episode)}
                      >
                        <div className="radio-episode-title">{episode.title}</div>
                        <div className="radio-episode-meta">
                          {episode.duration && <span>{episode.duration}</span>}
                          {episode.pubDate && <span>{new Date(episode.pubDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default RadioPlayer;

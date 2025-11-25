import React, { useState, useRef, useEffect } from 'react';
import { AppSettings } from '../types';

interface RadioStation {
  id: string;
  name: string;
  url: string;
  genre: string;
  description: string;
  metadataUrl?: string; // optional now-playing/metadata endpoint
}

// 🎵 ALL SomaFM Radio Stations (50+ channels!)
const RADIO_STATIONS: RadioStation[] = [
  // 🎧 AMBIENT / FOCUS (Top picks for coding!)
  {
    id: 'soma-groovesalad',
    name: 'Groove Salad',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
    genre: 'Ambient',
    description: 'Ambient/downtempo beats and grooves'
  },
  {
    id: 'soma-dronezone',
    name: 'Drone Zone',
    url: 'https://ice1.somafm.com/dronezone-128-mp3',
    genre: 'Ambient',
    description: 'Atmospheric textures with minimal beats'
  },
  {
    id: 'soma-deepspaceone',
    name: 'Deep Space One',
    url: 'https://ice1.somafm.com/deepspaceone-128-mp3',
    genre: 'Ambient',
    description: 'Deep ambient electronic and space music'
  },
  {
    id: 'soma-groovesalad-classic',
    name: 'Groove Salad Classic',
    url: 'https://ice1.somafm.com/gsclassic-128-mp3',
    genre: 'Ambient',
    description: 'Classic early 2000s ambient/downtempo'
  },
  {
    id: 'soma-spacestation',
    name: 'Space Station Soma',
    url: 'https://ice1.somafm.com/spacestation-128-mp3',
    genre: 'Ambient',
    description: 'Spaced-out ambient and mid-tempo electronica'
  },
  {
    id: 'soma-synphaera',
    name: 'Synphaera Radio',
    url: 'https://ice1.somafm.com/synphaera-128-mp3',
    genre: 'Ambient',
    description: 'Modern electronic ambient and space music'
  },
  {
    id: 'soma-darkzone',
    name: 'The Dark Zone',
    url: 'https://ice1.somafm.com/darkzone-128-mp3',
    genre: 'Ambient',
    description: 'The darker side of deep ambient'
  },
  {
    id: 'soma-missioncontrol',
    name: 'Mission Control',
    url: 'https://ice1.somafm.com/missioncontrol-128-mp3',
    genre: 'Ambient',
    description: 'Celebrating NASA and space explorers'
  },

  // 💻 ELECTRONIC / CODING
  {
    id: 'soma-defcon',
    name: 'DEF CON Radio',
    url: 'https://ice1.somafm.com/defcon-128-mp3',
    genre: 'Electronic',
    description: 'Music for hacking and coding'
  },
  {
    id: 'soma-beatblender',
    name: 'Beat Blender',
    url: 'https://ice1.somafm.com/beatblender-128-mp3',
    genre: 'Electronic',
    description: 'Deep-house and downtempo chill'
  },
  {
    id: 'soma-cliqhop',
    name: 'cliqhop idm',
    url: 'https://ice1.somafm.com/cliqhop-128-mp3',
    genre: 'Electronic',
    description: 'Intelligent Dance Music (IDM)'
  },
  {
    id: 'soma-thetrip',
    name: 'The Trip',
    url: 'https://ice1.somafm.com/thetrip-128-mp3',
    genre: 'Electronic',
    description: 'Progressive house and trance'
  },
  {
    id: 'soma-poptron',
    name: 'PopTron',
    url: 'https://ice1.somafm.com/poptron-128-mp3',
    genre: 'Electronic',
    description: 'Electropop and indie dance rock'
  },
  {
    id: 'soma-fluid',
    name: 'Fluid',
    url: 'https://ice1.somafm.com/fluid-128-mp3',
    genre: 'Electronic',
    description: 'Instrumental hiphop and liquid trap'
  },
  {
    id: 'soma-vaporwaves',
    name: 'Vaporwaves',
    url: 'https://ice1.somafm.com/vaporwaves-128-mp3',
    genre: 'Electronic',
    description: 'All Vaporwave, all the time'
  },
  {
    id: 'soma-digitalis',
    name: 'Digitalis',
    url: 'https://ice1.somafm.com/digitalis-128-mp3',
    genre: 'Electronic',
    description: 'Digitally affected analog rock'
  },
  {
    id: 'soma-dubstep',
    name: 'Dub Step Beyond',
    url: 'https://ice1.somafm.com/dubstep-128-mp3',
    genre: 'Electronic',
    description: 'Dubstep, dub and deep bass'
  },

  // 🎷 LOUNGE / CHILL
  {
    id: 'soma-lush',
    name: 'Lush',
    url: 'https://ice1.somafm.com/lush-128-mp3',
    genre: 'Lounge',
    description: 'Sensuous mellow female vocals'
  },
  {
    id: 'soma-secretagent',
    name: 'Secret Agent',
    url: 'https://ice1.somafm.com/secretagent-128-mp3',
    genre: 'Lounge',
    description: 'Soundtrack for your mysterious life'
  },
  {
    id: 'soma-illinoisstreet',
    name: 'Illinois Street Lounge',
    url: 'https://ice1.somafm.com/illstreet-128-mp3',
    genre: 'Lounge',
    description: 'Classic bachelor pad and exotica'
  },
  {
    id: 'soma-bossabeyond',
    name: 'Bossa Beyond',
    url: 'https://ice1.somafm.com/bossa-128-mp3',
    genre: 'Lounge',
    description: 'Brazilian Bossa Nova and Samba'
  },

  // 🎸 ROCK / ALTERNATIVE
  {
    id: 'soma-indiepop',
    name: 'Indie Pop Rocks!',
    url: 'https://ice1.somafm.com/indiepop-128-mp3',
    genre: 'Rock',
    description: 'Favorite indie pop tracks'
  },
  {
    id: 'soma-u80s',
    name: 'Underground 80s',
    url: 'https://ice1.somafm.com/u80s-128-mp3',
    genre: 'Rock',
    description: 'Early 80s UK Synthpop and New Wave'
  },
  {
    id: 'soma-seventies',
    name: 'Left Coast 70s',
    url: 'https://ice1.somafm.com/seventies-128-mp3',
    genre: 'Rock',
    description: 'Mellow album rock from the 70s'
  },
  {
    id: 'soma-folkforward',
    name: 'Folk Forward',
    url: 'https://ice1.somafm.com/folkfwd-128-mp3',
    genre: 'Rock',
    description: 'Indie Folk and Alt-folk'
  },
  {
    id: 'soma-bootliquor',
    name: 'Boot Liquor',
    url: 'https://ice1.somafm.com/bootliquor-128-mp3',
    genre: 'Rock',
    description: 'Americana Roots music'
  },

  // 🤘 METAL / HEAVY
  {
    id: 'soma-metal',
    name: 'Metal Detector',
    url: 'https://ice1.somafm.com/metal-128-mp3',
    genre: 'Metal',
    description: 'From black to doom, thrash to post'
  },
  {
    id: 'soma-doomed',
    name: 'Doomed',
    url: 'https://ice1.somafm.com/doomed-128-mp3',
    genre: 'Metal',
    description: 'Dark industrial/ambient music'
  },

  // 🎺 JAZZ / SOUL
  {
    id: 'soma-sonicuniverse',
    name: 'Sonic Universe',
    url: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    genre: 'Jazz',
    description: 'Eclectic avant-garde jazz'
  },
  {
    id: 'soma-7soul',
    name: 'Seven Inch Soul',
    url: 'https://ice1.somafm.com/7soul-128-mp3',
    genre: 'Jazz',
    description: 'Vintage soul from vinyl 45s'
  },

  // 🌍 WORLD / INTERNATIONAL
  {
    id: 'soma-thistle',
    name: 'ThistleRadio',
    url: 'https://ice1.somafm.com/thistle-128-mp3',
    genre: 'World',
    description: 'Celtic roots and branches'
  },
  {
    id: 'soma-suburbsofgoa',
    name: 'Suburbs of Goa',
    url: 'https://ice1.somafm.com/suburbsofgoa-128-mp3',
    genre: 'World',
    description: 'Asian world beats and beyond'
  },
  {
    id: 'soma-tikitime',
    name: 'Tiki Time',
    url: 'https://ice1.somafm.com/tikitime-128-mp3',
    genre: 'World',
    description: 'Classic Tiki and island rhythms'
  },

  // 🎵 REGGAE
  {
    id: 'soma-reggae',
    name: 'Heavyweight Reggae',
    url: 'https://ice1.somafm.com/reggae-128-mp3',
    genre: 'Reggae',
    description: 'Reggae, Ska, Rocksteady classics'
  },

  // 🎄 HOLIDAY (Seasonal)
  {
    id: 'soma-xmaslounge',
    name: 'Christmas Lounge',
    url: 'https://ice1.somafm.com/christmas-128-mp3',
    genre: 'Holiday',
    description: 'Chilled holiday grooves'
  },
  {
    id: 'soma-xmasrocks',
    name: 'Christmas Rocks!',
    url: 'https://ice1.somafm.com/xmasrocks-128-mp3',
    genre: 'Holiday',
    description: 'Indie/alternative holiday season'
  },
  {
    id: 'soma-xmasinfrisko',
    name: 'Xmas in Frisko',
    url: 'https://ice1.somafm.com/xmasinfrisko-128-mp3',
    genre: 'Holiday',
    description: 'Wacky eclectic holiday mix'
  },
  {
    id: 'soma-jollysoul',
    name: 'Jolly Ol\' Soul',
    url: 'https://ice1.somafm.com/jollysoul-128-mp3',
    genre: 'Holiday',
    description: 'Soul of the season'
  },
  {
    id: 'soma-deptstore',
    name: 'Department Store Christmas',
    url: 'https://ice1.somafm.com/deptstore-128-mp3',
    genre: 'Holiday',
    description: 'Holiday elevator music'
  },

  // 🎭 SPECIALS / ECLECTIC
  {
    id: 'soma-blackrock',
    name: 'Black Rock FM',
    url: 'https://ice1.somafm.com/brfm-128-mp3',
    genre: 'Specials',
    description: 'From Burning Man festival'
  },
  {
    id: 'soma-covers',
    name: 'Covers',
    url: 'https://ice1.somafm.com/covers-128-mp3',
    genre: 'Specials',
    description: 'Songs you know by artists you don\'t'
  },
  {
    id: 'soma-sf1033',
    name: 'SF 10-33',
    url: 'https://ice1.somafm.com/sf1033-128-mp3',
    genre: 'Specials',
    description: 'Ambient + SF public safety radio'
  },
  {
    id: 'soma-n5md',
    name: 'n5MD Radio',
    url: 'https://ice1.somafm.com/n5md-128-mp3',
    genre: 'Specials',
    description: 'Emotional experiments in music'
  },
  {
    id: 'soma-insound',
    name: 'The In-Sound',
    url: 'https://ice1.somafm.com/insound-128-mp3',
    genre: 'Specials',
    description: '60s/70s Hipster Euro Pop'
  }
];

interface RadioPlayerProps {
  settings: AppSettings;
  onSettingsChange: (updates: Partial<AppSettings>) => void;
  theme: 'dark' | 'light' | 'tron';
  externalToggleSignal?: number; // toggles play/pause when changed
}

const RadioPlayer: React.FC<RadioPlayerProps> = ({ settings, onSettingsChange, theme, externalToggleSignal }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStation, setCurrentStation] = useState<RadioStation>(
    RADIO_STATIONS.find(s => s.id === settings.radioLastStation) || RADIO_STATIONS[0]
  );
  const [volume, setVolume] = useState(settings.radioVolume);
  const [isMinimized, setIsMinimized] = useState(settings.radioMinimized);
  const [error, setError] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<string>('');
  const [nowPlayingTimer, setNowPlayingTimer] = useState<NodeJS.Timeout | null>(null);

  // Helper function to get proxied stream URL (bypass CORS)
  const getProxiedUrl = (originalUrl: string) => {
    const proxyBaseUrl = settings.corsProxyUrl || 'http://localhost:3010';
    return `${proxyBaseUrl}/api/radio/stream?url=${encodeURIComponent(originalUrl)}`;
  };



  // Fetch now-playing metadata if station exposes it (placeholder; SomaFM needs specific endpoints per station)
  useEffect(() => {
    if (nowPlayingTimer) clearInterval(nowPlayingTimer);
    const fetchNowPlaying = async () => {
      if (!currentStation.metadataUrl) {
        setNowPlaying('');
        return;
      }
      try {
        const res = await fetch(currentStation.metadataUrl);
        if (!res.ok) throw new Error('metadata fetch failed');
        const data = await res.json();
        // Expecting data.nowPlaying or similar; this is station-specific.
        const title = data.nowPlaying || data.title || data.song || '';
        setNowPlaying(title);
      } catch (e) {
        setNowPlaying('');
      }
    };

    fetchNowPlaying();
    const t = setInterval(fetchNowPlaying, 30000); // refresh every 30s
    setNowPlayingTimer(t as any);
    return () => {
      clearInterval(t);
    };
  }, [currentStation]);

  // Update audio volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handlePlay = async () => {
    if (!audioRef.current) return;

    setIsLoading(true);
    setError(null);

    // Initialize AudioContext if not already done
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    try {
      // Resume context if suspended (browser policy)
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
        setError(null);
        setIsLoading(false); // Success! Stop spinner.
      }
    } catch (err) {
      // Auto-play policy error is expected if user hasn't interacted yet
      if ((err as Error).name === 'NotAllowedError') {
        console.log('📻 Radio auto-play prevented by browser policy (waiting for interaction)');
        setIsPlaying(false);
        setIsLoading(false); // Stop the spinner so the "Click to Start" button shows!
      } else {
        console.error('Radio play error:', err);
        setError('Failed to play stream');
        setIsPlaying(false);
        setIsLoading(false);
      }
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

      // Resume playing with new station
      if (wasPlaying) {
        setTimeout(() => handlePlay(), 100);
      }
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

  const handleAudioError = () => {
    setError('Stream unavailable');
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleAudioCanPlay = () => {
    setIsLoading(false);
    setError(null);
  };

  // External toggle (e.g., from screensaver)
  useEffect(() => {
    if (externalToggleSignal === undefined) return;
    setIsMinimized(false);
    setError(null);
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }, [externalToggleSignal]);

  // Theme-specific styles
  const isTron = theme === 'tron';
  const isDark = theme === 'dark' || isTron;

  const containerClass = isTron
    ? 'bg-black border-tron-cyan shadow-[0_0_20px_rgba(0,243,255,0.3)]'
    : isDark
      ? 'bg-zinc-900 border-zinc-700'
      : 'bg-white border-gray-300';

  const textClass = isTron ? 'text-tron-cyan' : isDark ? 'text-white' : 'text-gray-900';
  const mutedTextClass = isTron ? 'text-tron-cyan/60' : isDark ? 'text-zinc-400' : 'text-gray-600';

  const buttonClass = isTron
    ? 'bg-tron-cyan/10 border border-tron-cyan text-tron-cyan hover:bg-tron-cyan/20 hover:shadow-[0_0_10px_rgba(0,243,255,0.5)]'
    : isDark
      ? 'bg-zinc-800 border border-zinc-600 text-white hover:bg-zinc-700'
      : 'bg-gray-100 border border-gray-300 text-gray-900 hover:bg-gray-200';

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={getProxiedUrl(currentStation.url)}
        onError={handleAudioError}
        onCanPlay={handleAudioCanPlay}
        preload="none"
      />

      {/* Floating Radio Player */}
      <div
        className={`fixed bottom-4 right-4 rounded-lg border-2 backdrop-blur-sm z-50 transition-all duration-300 ${containerClass} ${isMinimized ? 'w-64' : 'w-80'
          }`}
        style={{ maxHeight: isMinimized ? '70px' : '280px' }}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-3 cursor-pointer ${textClass}`}
          onClick={toggleMinimize}
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-radio text-lg"></i>
            <span className="font-bold text-sm">Ranger Radio</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}
              className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              <i className={`fa-solid ${isMinimized ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`}></i>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleClose(); }}
              className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
              title="Close Radio"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {!isMinimized && (
          <div className="px-3 pb-3 space-y-3">
            {/* Now Playing */}
            <div className={`text-center ${mutedTextClass}`}>
              <div className="text-xs uppercase tracking-wide mb-1">Now Playing</div>
              <div className={`text-sm font-bold ${textClass}`}>{currentStation.name}</div>
              <div className="text-xs mt-0.5">{currentStation.description}</div>
              {nowPlaying && (
                <div className="text-xs mt-1 opacity-80">
                  <i className="fa-solid fa-music mr-1"></i>
                  {nowPlaying}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 relative">


              <button
                onClick={isPlaying ? handlePause : handlePlay}
                disabled={isLoading}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${buttonClass} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <i className="fa-solid fa-circle-notch fa-spin text-lg"></i>
                ) : isPlaying ? (
                  <i className="fa-solid fa-pause text-lg"></i>
                ) : (
                  <i className="fa-solid fa-play text-lg ml-1"></i>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-center text-xs text-red-500">{error}</div>
            )}

            {/* Volume Control */}
            <div className="space-y-1">
              <div className={`flex items-center justify-between text-xs ${mutedTextClass}`}>
                <span>Volume</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-volume-low text-xs"></i>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value) / 100)}
                  className="flex-1 h-2 rounded-lg appearance-none bg-gray-300 dark:bg-zinc-700 accent-teal-500"
                  style={{
                    background: isTron
                      ? `linear-gradient(to right, #00f3ff 0%, #00f3ff ${volume * 100}%, rgba(0,243,255,0.2) ${volume * 100}%, rgba(0,243,255,0.2) 100%)`
                      : undefined
                  }}
                />
                <i className="fa-solid fa-volume-high text-xs"></i>
              </div>
            </div>

            {/* Station Selector */}
            <div className="space-y-1">
              <label className={`text-xs ${mutedTextClass}`}>Station ({RADIO_STATIONS.length} channels)</label>
              <select
                value={currentStation.id}
                onChange={(e) => handleStationChange(e.target.value)}
                className={`w-full px-3 py-2 rounded border text-sm ${isTron
                  ? 'bg-black border-tron-cyan text-tron-cyan'
                  : isDark
                    ? 'bg-zinc-800 border-zinc-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  }`}
              >
                {/* Group stations by genre */}
                {['Ambient', 'Electronic', 'Lounge', 'Rock', 'Metal', 'Jazz', 'World', 'Reggae', 'Holiday', 'Specials'].map(genre => {
                  const genreStations = RADIO_STATIONS.filter(s => s.genre === genre);
                  if (genreStations.length === 0) return null;
                  return (
                    <optgroup key={genre} label={`🎵 ${genre}`}>
                      {genreStations.map(station => (
                        <option key={station.id} value={station.id}>
                          {station.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RadioPlayer;

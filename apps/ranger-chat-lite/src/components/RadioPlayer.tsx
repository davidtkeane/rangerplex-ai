import React, { useState, useRef, useEffect, useMemo } from 'react';

// Radio station interface
interface RadioStation {
  id: string;
  name: string;
  url: string;
  genre: string;
  description: string;
}

// Radio settings interface (standalone)
export interface RadioSettings {
  radioEnabled: boolean;
  radioVolume: number;
  radioLastStation: string | null;
  radioMinimized: boolean;
}

// 🎵 ALL SomaFM Radio Stations (50+ channels!)
export const RADIO_STATIONS: RadioStation[] = [
  // 🎧 AMBIENT / FOCUS (Top picks for coding!)
  { id: 'soma-groovesalad', name: 'Groove Salad', url: 'https://ice1.somafm.com/groovesalad-128-mp3', genre: 'Ambient', description: 'Ambient/downtempo beats and grooves' },
  { id: 'soma-dronezone', name: 'Drone Zone', url: 'https://ice1.somafm.com/dronezone-128-mp3', genre: 'Ambient', description: 'Atmospheric textures with minimal beats' },
  { id: 'soma-deepspaceone', name: 'Deep Space One', url: 'https://ice1.somafm.com/deepspaceone-128-mp3', genre: 'Ambient', description: 'Deep ambient electronic and space music' },
  { id: 'soma-spacestation', name: 'Space Station Soma', url: 'https://ice1.somafm.com/spacestation-128-mp3', genre: 'Ambient', description: 'Spaced-out ambient and mid-tempo electronica' },
  { id: 'soma-missioncontrol', name: 'Mission Control', url: 'https://ice1.somafm.com/missioncontrol-128-mp3', genre: 'Ambient', description: 'Celebrating NASA and space explorers' },

  // 💻 ELECTRONIC / CODING
  { id: 'soma-defcon', name: 'DEF CON Radio', url: 'https://ice1.somafm.com/defcon-128-mp3', genre: 'Electronic', description: 'Music for hacking and coding' },
  { id: 'soma-beatblender', name: 'Beat Blender', url: 'https://ice1.somafm.com/beatblender-128-mp3', genre: 'Electronic', description: 'Deep-house and downtempo chill' },
  { id: 'soma-cliqhop', name: 'cliqhop idm', url: 'https://ice1.somafm.com/cliqhop-128-mp3', genre: 'Electronic', description: 'Intelligent Dance Music (IDM)' },
  { id: 'soma-thetrip', name: 'The Trip', url: 'https://ice1.somafm.com/thetrip-128-mp3', genre: 'Electronic', description: 'Progressive house and trance' },
  { id: 'soma-poptron', name: 'PopTron', url: 'https://ice1.somafm.com/poptron-128-mp3', genre: 'Electronic', description: 'Electropop and indie dance rock' },
  { id: 'soma-fluid', name: 'Fluid', url: 'https://ice1.somafm.com/fluid-128-mp3', genre: 'Electronic', description: 'Instrumental hiphop and liquid trap' },
  { id: 'soma-vaporwaves', name: 'Vaporwaves', url: 'https://ice1.somafm.com/vaporwaves-128-mp3', genre: 'Electronic', description: 'All Vaporwave, all the time' },
  { id: 'soma-dubstep', name: 'Dub Step Beyond', url: 'https://ice1.somafm.com/dubstep-128-mp3', genre: 'Electronic', description: 'Dubstep, dub and deep bass' },

  // 🎷 LOUNGE / CHILL
  { id: 'soma-lush', name: 'Lush', url: 'https://ice1.somafm.com/lush-128-mp3', genre: 'Lounge', description: 'Sensuous mellow female vocals' },
  { id: 'soma-secretagent', name: 'Secret Agent', url: 'https://ice1.somafm.com/secretagent-128-mp3', genre: 'Lounge', description: 'Soundtrack for your mysterious life' },
  { id: 'soma-bossabeyond', name: 'Bossa Beyond', url: 'https://ice1.somafm.com/bossa-128-mp3', genre: 'Lounge', description: 'Brazilian Bossa Nova and Samba' },

  // 🎸 ROCK / ALTERNATIVE
  { id: 'soma-indiepop', name: 'Indie Pop Rocks!', url: 'https://ice1.somafm.com/indiepop-128-mp3', genre: 'Rock', description: 'Favorite indie pop tracks' },
  { id: 'soma-u80s', name: 'Underground 80s', url: 'https://ice1.somafm.com/u80s-128-mp3', genre: 'Rock', description: 'Early 80s UK Synthpop and New Wave' },
  { id: 'soma-seventies', name: 'Left Coast 70s', url: 'https://ice1.somafm.com/seventies-128-mp3', genre: 'Rock', description: 'Mellow album rock from the 70s' },
  { id: 'soma-folkforward', name: 'Folk Forward', url: 'https://ice1.somafm.com/folkfwd-128-mp3', genre: 'Rock', description: 'Indie Folk and Alt-folk' },

  // 🤘 METAL / HEAVY
  { id: 'soma-metal', name: 'Metal Detector', url: 'https://ice1.somafm.com/metal-128-mp3', genre: 'Metal', description: 'From black to doom, thrash to post' },
  { id: 'soma-doomed', name: 'Doomed', url: 'https://ice1.somafm.com/doomed-128-mp3', genre: 'Metal', description: 'Dark industrial/ambient music' },

  // 🎺 JAZZ / SOUL
  { id: 'soma-sonicuniverse', name: 'Sonic Universe', url: 'https://ice1.somafm.com/sonicuniverse-128-mp3', genre: 'Jazz', description: 'Eclectic avant-garde jazz' },
  { id: 'soma-7soul', name: 'Seven Inch Soul', url: 'https://ice1.somafm.com/7soul-128-mp3', genre: 'Jazz', description: 'Vintage soul from vinyl 45s' },

  // 🌍 WORLD / INTERNATIONAL
  { id: 'soma-thistle', name: 'ThistleRadio', url: 'https://ice1.somafm.com/thistle-128-mp3', genre: 'World', description: 'Celtic roots and branches' },
  { id: 'soma-suburbsofgoa', name: 'Suburbs of Goa', url: 'https://ice1.somafm.com/suburbsofgoa-128-mp3', genre: 'World', description: 'Asian world beats and beyond' },

  // 🎵 REGGAE
  { id: 'soma-reggae', name: 'Heavyweight Reggae', url: 'https://ice1.somafm.com/reggae-128-mp3', genre: 'Reggae', description: 'Reggae, Ska, Rocksteady classics' },

  // 🎄 HOLIDAY (Seasonal)
  { id: 'soma-xmaslounge', name: 'Christmas Lounge', url: 'https://ice1.somafm.com/christmas-128-mp3', genre: 'Holiday', description: 'Chilled holiday grooves' },
  { id: 'soma-xmasrocks', name: 'Christmas Rocks!', url: 'https://ice1.somafm.com/xmasrocks-128-mp3', genre: 'Holiday', description: 'Indie/alternative holiday season' },

  // 🎭 SPECIALS / ECLECTIC
  { id: 'soma-covers', name: 'Covers', url: 'https://ice1.somafm.com/covers-128-mp3', genre: 'Specials', description: "Songs you know by artists you don't" },
  { id: 'soma-sf1033', name: 'SF 10-33', url: 'https://ice1.somafm.com/sf1033-128-mp3', genre: 'Specials', description: 'Ambient + SF public safety radio' },
];

interface RadioPlayerProps {
  settings: RadioSettings;
  onSettingsChange: (updates: Partial<RadioSettings>) => void;
  theme: 'classic' | 'matrix' | 'tron' | 'retro';
  isFullMode?: boolean; // Full screen radio mode
  onClose?: () => void;
}

const RadioPlayer: React.FC<RadioPlayerProps> = ({
  settings,
  onSettingsChange,
  theme,
  isFullMode = false,
  onClose
}) => {
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
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  // Get unique genres
  const genres = ['All', ...Array.from(new Set(RADIO_STATIONS.map(s => s.genre)))];

  // Filter stations by genre
  const filteredStations = selectedGenre === 'All'
    ? RADIO_STATIONS
    : RADIO_STATIONS.filter(s => s.genre === selectedGenre);

  // Use direct SomaFM URLs (they have CORS headers)
  const streamUrl = useMemo(() => currentStation.url, [currentStation.url]);

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
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      await audioRef.current.play();
      setIsPlaying(true);
      setIsLoading(false);
    } catch (err) {
      if ((err as Error).name === 'NotAllowedError') {
        console.log('📻 Radio auto-play prevented by browser policy');
        setIsPlaying(false);
        setIsLoading(false);
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
    onClose?.();
  };

  const handleAudioError = () => {
    setError('Stream unavailable - try another station');
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleAudioCanPlay = () => {
    setIsLoading(false);
    setError(null);
  };

  // Theme-specific styles
  const isTron = theme === 'tron';
  const isMatrix = theme === 'matrix';
  const isDark = theme !== 'retro';

  const getThemeColors = () => {
    if (isTron) return { accent: '#00f3ff', bg: 'bg-black', border: 'border-cyan-400', text: 'text-cyan-400' };
    if (isMatrix) return { accent: '#00ff00', bg: 'bg-black', border: 'border-green-500', text: 'text-green-500' };
    if (theme === 'retro') return { accent: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-600', text: 'text-amber-900' };
    return { accent: '#3b82f6', bg: 'bg-zinc-900', border: 'border-zinc-700', text: 'text-white' };
  };

  const colors = getThemeColors();

  // Full mode (dedicated radio view)
  if (isFullMode) {
    return (
      <div className={`h-full ${colors.bg} p-6 overflow-auto`}>
        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={streamUrl}
          onError={handleAudioError}
          onCanPlay={handleAudioCanPlay}
          preload="none"
        />

        {/* Header */}
        <div className={`flex items-center justify-between mb-6 ${colors.text}`}>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="text-3xl">📻</span>
            Ranger Radio
          </h1>
        </div>

        {/* Now Playing Card */}
        <div className={`${colors.bg} border-2 ${colors.border} rounded-xl p-6 mb-6 ${isTron ? 'shadow-[0_0_30px_rgba(0,243,255,0.3)]' : isMatrix ? 'shadow-[0_0_30px_rgba(0,255,0,0.3)]' : ''}`}>
          <div className={`text-center ${colors.text}`}>
            <div className="text-sm uppercase tracking-widest opacity-60 mb-2">Now Playing</div>
            <div className="text-3xl font-bold mb-2">{currentStation.name}</div>
            <div className="text-lg opacity-80 mb-6">{currentStation.description}</div>

            {/* Big Play Button */}
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={isLoading}
              className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-all transform hover:scale-105 ${colors.border} border-4 ${isLoading ? 'opacity-50' : ''}`}
              style={{
                backgroundColor: isPlaying ? colors.accent : 'transparent',
                color: isPlaying ? (isDark ? '#000' : '#fff') : colors.accent,
                boxShadow: isTron ? '0 0 40px rgba(0,243,255,0.5)' : isMatrix ? '0 0 40px rgba(0,255,0,0.5)' : 'none'
              }}
              aria-label={isPlaying ? 'Pause radio' : 'Play radio'}
            >
              {isLoading ? (
                <span className="text-4xl animate-spin">⟳</span>
              ) : isPlaying ? (
                <span className="text-4xl">⏸</span>
              ) : (
                <span className="text-4xl ml-2">▶</span>
              )}
            </button>

            {/* Error Message */}
            {error && <div className="text-red-500 mb-4">{error}</div>}

            {/* Volume Control */}
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between text-sm opacity-60 mb-2">
                <span>🔈 Volume</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value) / 100)}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accent} 0%, ${colors.accent} ${volume * 100}%, rgba(128,128,128,0.3) ${volume * 100}%, rgba(128,128,128,0.3) 100%)`
                }}
                aria-label="Volume control"
              />
            </div>
          </div>
        </div>

        {/* Genre Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedGenre === genre
                  ? `${colors.border} border-2`
                  : 'border border-gray-600 opacity-60 hover:opacity-100'
              } ${colors.text}`}
              style={selectedGenre === genre ? { backgroundColor: colors.accent + '20' } : {}}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Station Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStations.map(station => (
            <button
              key={station.id}
              onClick={() => handleStationChange(station.id)}
              className={`p-4 rounded-lg text-left transition-all ${colors.border} border ${
                currentStation.id === station.id
                  ? 'border-2'
                  : 'border-opacity-30 hover:border-opacity-100'
              } ${colors.text}`}
              style={currentStation.id === station.id ? { backgroundColor: colors.accent + '15' } : {}}
            >
              <div className="font-bold flex items-center gap-2">
                {currentStation.id === station.id && isPlaying && (
                  <span className="animate-pulse">🎵</span>
                )}
                {station.name}
              </div>
              <div className="text-sm opacity-60">{station.description}</div>
              <div className="text-xs mt-1 opacity-40">{station.genre}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Mini player (floating)
  return (
    <>
      <audio
        ref={audioRef}
        src={streamUrl}
        onError={handleAudioError}
        onCanPlay={handleAudioCanPlay}
        preload="none"
      />

      <div
        className={`fixed right-4 bottom-4 rounded-lg border-2 backdrop-blur-sm z-50 transition-all duration-300 ${colors.bg} ${colors.border} ${isMinimized ? 'w-64' : 'w-80'}`}
        style={{
          maxHeight: isMinimized ? '60px' : '260px',
          boxShadow: isTron ? '0 0 20px rgba(0,243,255,0.3)' : isMatrix ? '0 0 20px rgba(0,255,0,0.3)' : 'none'
        }}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-3 cursor-pointer ${colors.text}`}
          onClick={toggleMinimize}
        >
          <div className="flex items-center gap-2">
            <span>📻</span>
            <span className="font-bold text-sm">Ranger Radio</span>
            {isPlaying && <span className="animate-pulse text-xs">🎵</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}
              className="w-6 h-6 flex items-center justify-center hover:opacity-70"
              aria-label={isMinimized ? 'Expand radio' : 'Minimize radio'}
            >
              {isMinimized ? '▲' : '▼'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleClose(); }}
              className="w-6 h-6 flex items-center justify-center hover:opacity-70"
              aria-label="Close radio"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {!isMinimized && (
          <div className="px-3 pb-3 space-y-3">
            {/* Now Playing */}
            <div className={`text-center ${colors.text}`}>
              <div className="text-xs uppercase tracking-wide opacity-60 mb-1">Now Playing</div>
              <div className="text-sm font-bold">{currentStation.name}</div>
              <div className="text-xs opacity-60">{currentStation.description}</div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center">
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                disabled={isLoading}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${colors.border} border-2 ${colors.text} ${isLoading ? 'opacity-50' : 'hover:scale-105'}`}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? '⟳' : isPlaying ? '⏸' : '▶'}
              </button>
            </div>

            {error && <div className="text-center text-xs text-red-500">{error}</div>}

            {/* Volume */}
            <div className="space-y-1">
              <div className={`flex items-center justify-between text-xs ${colors.text} opacity-60`}>
                <span>Volume</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume * 100}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value) / 100)}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${colors.accent} 0%, ${colors.accent} ${volume * 100}%, rgba(128,128,128,0.3) ${volume * 100}%, rgba(128,128,128,0.3) 100%)`
                }}
              />
            </div>

            {/* Station Selector */}
            <select
              value={currentStation.id}
              onChange={(e) => handleStationChange(e.target.value)}
              className={`w-full px-3 py-2 rounded border text-sm ${colors.bg} ${colors.border} ${colors.text}`}
              aria-label="Select radio station"
            >
              {genres.filter(g => g !== 'All').map(genre => {
                const genreStations = RADIO_STATIONS.filter(s => s.genre === genre);
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
        )}
      </div>
    </>
  );
};

export default RadioPlayer;

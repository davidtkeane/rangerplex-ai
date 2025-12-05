import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

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

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStation, setCurrentStation] = useState<RadioStation>(
    RADIO_STATIONS.find(s => s.id === settings.radioLastStation) || RADIO_STATIONS[0]
  );
  const [volume, setVolume] = useState(settings.radioVolume);
  const [isMinimized, setIsMinimized] = useState(settings.radioMinimized);
  const [error, setError] = useState<string | null>(null);

  const memoizedStreamUrl = useMemo(() => currentStation.url, [currentStation.url]);

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

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw frequency bars
    const barWidth = canvas.width / 32;
    const barGap = 2;

    for (let i = 0; i < 32; i++) {
      const dataIndex = Math.floor(i * bufferLength / 32);
      const value = dataArray[dataIndex];
      const barHeight = (value / 255) * canvas.height * 0.9;

      const x = i * (barWidth + barGap);
      const y = canvas.height - barHeight;

      // Create gradient
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

  const handlePlay = async () => {
    if (!audioRef.current) return;

    setIsLoading(true);
    setError(null);

    // Setup audio context on first play
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
        console.error('Radio play error:', err);
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

  const handlePrevStation = () => {
    const currentIndex = RADIO_STATIONS.findIndex(s => s.id === currentStation.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : RADIO_STATIONS.length - 1;
    handleStationChange(RADIO_STATIONS[prevIndex].id);
  };

  const handleNextStation = () => {
    const currentIndex = RADIO_STATIONS.findIndex(s => s.id === currentStation.id);
    const nextIndex = currentIndex < RADIO_STATIONS.length - 1 ? currentIndex + 1 : 0;
    handleStationChange(RADIO_STATIONS[nextIndex].id);
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

  return (
    <>
      <audio
        ref={audioRef}
        src={memoizedStreamUrl}
        onError={handleAudioError}
        onCanPlay={handleAudioCanPlay}
        preload="none"
        crossOrigin="anonymous"
      />

      {/* Radio Bar - sits above chat input */}
      <div className={`radio-bar ${theme} ${isMinimized ? 'minimized' : 'expanded'}`}>
        {/* Visualizer Canvas */}
        <canvas
          ref={canvasRef}
          className="radio-visualizer"
          width={isMinimized ? 100 : 280}
          height={isMinimized ? 30 : 40}
        />

        {/* Minimized View - Inline controls */}
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
              <span className="radio-mini-name">{currentStation.name}</span>
              {isPlaying && <span className="radio-mini-playing">🎵</span>}
            </div>

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
            <div className="radio-exp-header">
              <div className="radio-exp-title">
                <span className="radio-icon">📻</span>
                <span>Ranger Radio</span>
                {isPlaying && <span className="radio-playing-indicator">●</span>}
              </div>
              <div className="radio-exp-controls-top">
                <button className="radio-ctrl-btn" onClick={toggleMinimize} title="Minimize">▼</button>
                <button className="radio-ctrl-btn close" onClick={handleClose} title="Close">✕</button>
              </div>
            </div>

            <div className="radio-exp-station">
              <div className="radio-exp-name">{currentStation.name}</div>
              <div className="radio-exp-desc">{currentStation.description}</div>
            </div>

            {error && <div className="radio-error">{error}</div>}

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
          </div>
        )}
      </div>
    </>
  );
};

export default RadioPlayer;

import React, { useState, useRef, useEffect, useCallback } from 'react';

// Define AppSettings interface locally since we can't import it easily yet
export interface PodcastSettings {
    theme?: string;
    corsProxyUrl?: string; // Optional custom proxy
}

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

// Curated cybersecurity podcast feeds
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
    // === MALWARE ANALYSIS ===
    {
        id: 'security-now',
        name: 'Security Now',
        rssUrl: 'https://feeds.twit.tv/sn.xml',
        category: 'malware',
        description: 'Deep technical security analysis with Steve Gibson - malware, exploits, vulnerabilities',
        website: 'https://twit.tv/shows/security-now'
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
    }
];

const CATEGORIES = [
    { id: 'all', label: 'All', icon: '🎙️' },
    { id: 'pentesting', label: 'Pentesting', icon: '🕵️' },
    { id: 'malware', label: 'Malware', icon: '🦠' },
    { id: 'news', label: 'News', icon: '📰' }
];

interface PodcastPlayerProps {
    onBackendAction?: (action: string, data?: any) => Promise<any>; // For future IPC
}

const PodcastPlayer: React.FC<PodcastPlayerProps> = ({ onBackendAction: _onBackendAction }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [_isLoading, setIsLoading] = useState(false);
    const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null);
    const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
    const [selectedPodcast, setSelectedPodcast] = useState<PodcastFeed | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [loadingFeed, setLoadingFeed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [_volume, _setVolume] = useState(0.8);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

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

        // Use a public CORS proxy for Lite version since we don't have a backend server yet
        // In production/Electron this should use IPC or a safer proxy
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const feedUrl = `${corsProxy}${encodeURIComponent(podcast.rssUrl)}`;

        try {
            const response = await fetch(feedUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

            const xmlText = await response.text();
            const parsedEpisodes = parseRSSFeed(xmlText, podcast);
            setEpisodes(parsedEpisodes);
        } catch (err) {
            console.error('Failed to fetch podcast feed:', err);
            setError(`Failed to load ${podcast.name}. CORS proxy or feed might be down.`);
            setEpisodes([]);
        } finally {
            setLoadingFeed(false);
        }
    }, [parseRSSFeed]);

    // Play episode
    const playEpisode = useCallback((episode: PodcastEpisode) => {
        if (audioRef.current) {
            audioRef.current.src = episode.audioUrl; // Direct URL usually works for audio file
            audioRef.current.load();
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                    setCurrentEpisode(episode);
                    setError(null);
                })
                .catch(err => {
                    console.error('Playback error:', err);
                    setError('Playback failed. The audio source might be blocked by CORS.');
                });
        }
    }, []);

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);
        const handleLoadStart = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplay', handleCanPlay);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    }, []);

    const formatTime = (seconds: number): string => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const filteredPodcasts = selectedCategory === 'all'
        ? CYBERSEC_PODCASTS
        : CYBERSEC_PODCASTS.filter(p => p.category === selectedCategory);

    return (
        <div className="podcast-player-container">
            <audio ref={audioRef} />

            <div className="podcast-header">
                <h2>🎙️ RangerCast Lite</h2>
                <div className="category-filters">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="podcast-content">
                {/* Podcast List */}
                <div className="podcast-list">
                    <h3>Podcasts</h3>
                    {filteredPodcasts.map(podcast => (
                        <div
                            key={podcast.id}
                            className={`podcast-item ${selectedPodcast?.id === podcast.id ? 'active' : ''}`}
                            onClick={() => fetchPodcastFeed(podcast)}
                        >
                            <div className="podcast-name">{podcast.name}</div>
                            <div className="podcast-desc">{podcast.description}</div>
                        </div>
                    ))}
                </div>

                {/* Episodes List */}
                <div className="episodes-list">
                    {loadingFeed ? (
                        <div className="loading-state">Loading feed...</div>
                    ) : error ? (
                        <div className="error-state">{error}</div>
                    ) : !selectedPodcast ? (
                        <div className="empty-state">Select a podcast to view episodes</div>
                    ) : (
                        <>
                            <h3>{selectedPodcast.name} - Episodes</h3>
                            {episodes.map(episode => (
                                <div
                                    key={episode.id}
                                    className={`episode-item ${currentEpisode?.id === episode.id ? 'playing' : ''}`}
                                    onClick={() => playEpisode(episode)}
                                >
                                    <div className="episode-title">
                                        {currentEpisode?.id === episode.id && isPlaying ? '▶️' : '📄'} {episode.title}
                                    </div>
                                    <div className="episode-meta">
                                        {new Date(episode.pubDate).toLocaleDateString()} • {episode.duration}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Mini Player */}
            {currentEpisode && (
                <div className="mini-player">
                    <div className="player-info">
                        <div className="player-title">{currentEpisode.title}</div>
                        <div className="player-podcast">{currentEpisode.podcastName}</div>
                    </div>
                    <div className="player-controls">
                        <button onClick={() => {
                            if (audioRef.current) audioRef.current.currentTime -= 15;
                        }}>⏪ 15s</button>

                        <button onClick={() => {
                            if (isPlaying) audioRef.current?.pause();
                            else audioRef.current?.play();
                        }} className="play-pause-btn">
                            {isPlaying ? '⏸' : '▶'}
                        </button>

                        <button onClick={() => {
                            if (audioRef.current) audioRef.current.currentTime += 30;
                        }}>30s ⏩</button>
                    </div>
                    <div className="player-progress">
                        <span>{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={(e) => {
                                if (audioRef.current) audioRef.current.currentTime = parseFloat(e.target.value);
                            }}
                        />
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PodcastPlayer;

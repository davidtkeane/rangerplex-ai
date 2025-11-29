// 🎖️ RangerPlex RSS News Ticker Component
// TV-style scrolling news ticker with notes integration

import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { rssService } from '../services/rssService';
import type { RSSItem, RSSSettings } from '../types/rss';
import { RSS_CATEGORIES } from '../types/rss';

// Study note type for ticker integration
interface TickerNote {
    id: string;
    title: string;
    content: string;
    updatedAt: number;
    pinned?: boolean;
    priority?: 'high' | 'medium' | 'low';
}

// Union type for ticker items
type TickerItem =
    | { type: 'rss'; data: RSSItem }
    | { type: 'note'; data: TickerNote };

interface RSSNewsTickerProps {
    settings: RSSSettings;
    onItemClick: (item: RSSItem) => void;
    onSettingsClick: () => void;
    notes?: TickerNote[];
    onNoteClick?: (noteId: string) => void;
}

export const RSSNewsTicker: React.FC<RSSNewsTickerProps> = ({
    settings,
    onItemClick,
    onSettingsClick,
    notes = [],
    onNoteClick,
}) => {
    const [rssItems, setRssItems] = useState<RSSItem[]>([]);
    const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [duration, setDuration] = useState(0);
    const tickerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Fetch RSS items
    useEffect(() => {
        const fetchItems = async () => {
            try {
                setIsLoading(true);
                const allItems = await rssService.fetchAllFeeds();

                // Filter by enabled categories
                let processedItems = allItems.filter(item =>
                    settings.enabledCategories.includes(item.category)
                );

                // Apply sorting/ordering
                if (settings.feedOrder === 'random') {
                    // Fisher-Yates shuffle
                    for (let i = processedItems.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [processedItems[i], processedItems[j]] = [processedItems[j], processedItems[i]];
                    }
                } else if (settings.feedOrder === 'category') {
                    // Sort by category, then date
                    processedItems.sort((a, b) => {
                        if (a.category !== b.category) {
                            return a.category.localeCompare(b.category);
                        }
                        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
                    });
                } else {
                    // Default: newest first
                    processedItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
                }

                // Limit to max headlines
                const limited = processedItems.slice(0, settings.maxHeadlines);

                setRssItems(limited);
            } catch (error) {
                console.error('Failed to fetch RSS items:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchItems();

        // Auto-refresh on interval
        const intervalMs = settings.autoRefreshInterval * 60 * 1000;
        const interval = setInterval(fetchItems, intervalMs);

        return () => clearInterval(interval);
    }, [settings.enabledCategories, settings.maxHeadlines, settings.autoRefreshInterval, settings.feedOrder]);

    // Merge RSS items and notes into ticker items
    useEffect(() => {
        const combined: TickerItem[] = [];

        // Add RSS items
        rssItems.forEach(item => {
            combined.push({ type: 'rss', data: item });
        });

        // Add notes if enabled
        if (settings.showNotesInTicker && notes.length > 0) {
            // Sort notes by updated time, pinned first
            const sortedNotes = [...notes].sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return b.updatedAt - a.updatedAt;
            });

            // Interleave notes with RSS items (every 5 items)
            sortedNotes.forEach((note, index) => {
                const insertPosition = Math.min((index + 1) * 5, combined.length);
                combined.splice(insertPosition + index, 0, { type: 'note', data: note });
            });
        }

        setTickerItems(combined);
    }, [rssItems, notes, settings.showNotesInTicker]);

    // Measure content width and set animation duration for constant speed
    useLayoutEffect(() => {
        if (contentRef.current && tickerItems.length > 0) {
            const totalWidth = contentRef.current.scrollWidth;
            const halfWidth = totalWidth / 2; // We scroll half the width (one set of items)
            const speed = settings.speed * 30; // Adjust multiplier for reasonable speed (pixels per second)
            const newDuration = halfWidth / speed;
            setDuration(newDuration);
        }
    }, [tickerItems, settings.speed]);

    // Handle RSS item click
    const handleRssItemClick = async (item: RSSItem) => {
        await rssService.markAsRead(item.id);
        onItemClick(item);
    };

    // Handle note click - opens notes panel to that note
    const handleNoteClick = (noteId: string) => {
        if (onNoteClick) {
            onNoteClick(noteId);
        }
    };

    // Calculate ticker height
    const getHeight = () => {
        switch (settings.height) {
            case 'small': return '32px';
            case 'large': return '48px';
            default: return '40px';
        }
    };

    if (!settings.enabled) {
        return null;
    }

    if (isLoading) {
        return (
            <div
                className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-zinc-800 flex items-center justify-center"
                style={{ height: getHeight() }}
            >
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                    <div className="animate-spin"><i className="fa-solid fa-circle-notch"></i></div>
                    <span>Loading Feeds...</span>
                </div>
            </div>
        );
    }

    if (tickerItems.length === 0) {
        return (
            <div
                className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-zinc-800 flex items-center justify-between px-4"
                style={{ height: getHeight() }}
            >
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <span>No items available</span>
                </div>
                <button
                    onClick={onSettingsClick}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded transition-colors border border-zinc-700"
                >
                    Configure
                </button>
            </div>
        );
    }

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-zinc-800 overflow-hidden select-none"
            style={{ height: getHeight() }}
            onMouseEnter={() => settings.pauseOnHover && setIsPaused(true)}
            onMouseLeave={() => settings.pauseOnHover && setIsPaused(false)}
        >
            <div className="relative h-full flex items-center">
                {/* Live indicator (Neutral) */}
                <div className="absolute left-0 top-0 bottom-0 flex items-center px-3 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse" />
                        <span className="text-zinc-500 font-bold text-[10px] tracking-wider">RSS</span>
                    </div>
                </div>

                {/* Settings button (Neutral) */}
                <button
                    onClick={onSettingsClick}
                    className="absolute right-0 top-0 bottom-0 px-3 bg-gradient-to-l from-black to-transparent z-10 hover:text-zinc-300 text-zinc-600 transition-colors"
                    title="RSS Settings"
                >
                    <i className="fa-solid fa-gear text-sm" />
                </button>

                {/* Scrolling ticker */}
                <div
                    ref={tickerRef}
                    className="absolute left-0 right-0 flex items-center whitespace-nowrap will-change-transform"
                >
                    <div
                        ref={contentRef}
                        className="flex items-center"
                        style={{
                            animation: (isPaused || duration === 0) ? 'none' : `scroll-left ${duration}s linear infinite`,
                        }}
                    >
                        {/* Duplicate items for seamless loop */}
                        {[...tickerItems, ...tickerItems].map((tickerItem, index) => {
                            if (tickerItem.type === 'note') {
                                // Render note item
                                const note = tickerItem.data;
                                return (
                                    <div
                                        key={`note-${note.id}-${index}`}
                                        className="inline-flex items-center gap-3 px-6 cursor-pointer group"
                                        onClick={() => handleNoteClick(note.id)}
                                    >
                                        {/* Note badge with cool icon */}
                                        {settings.showCategoryBadges && (
                                            <span
                                                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-900/50 text-amber-400 border border-amber-700/50"
                                                title="Your Study Note"
                                            >
                                                <i className="fa-solid fa-lightbulb mr-1"></i>
                                                NOTE
                                                {note.pinned && <i className="fa-solid fa-thumbtack ml-1 text-[8px]"></i>}
                                            </span>
                                        )}

                                        {/* Note title */}
                                        <span className="text-amber-300/80 text-sm font-medium group-hover:text-amber-200 transition-colors">
                                            {note.title || 'Untitled Note'}
                                        </span>

                                        {/* Priority indicator */}
                                        {note.priority === 'high' && (
                                            <i className="fa-solid fa-fire text-red-500 text-xs" title="High Priority"></i>
                                        )}

                                        {/* Separator */}
                                        <span className="text-zinc-800 text-xs">●</span>
                                    </div>
                                );
                            } else {
                                // Render RSS item
                                const item = tickerItem.data;
                                return (
                                    <div
                                        key={`rss-${item.id}-${index}`}
                                        className="inline-flex items-center gap-3 px-6 cursor-pointer group"
                                        onClick={() => handleRssItemClick(item)}
                                    >
                                        {/* Category badge (Neutral) */}
                                        {settings.showCategoryBadges && (
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${RSS_CATEGORIES[item.category].badgeColor}`}
                                                title={RSS_CATEGORIES[item.category].name}
                                            >
                                                <i className={`${RSS_CATEGORIES[item.category].icon} mr-1`}></i>
                                                {item.category}
                                            </span>
                                        )}

                                        {/* Headline */}
                                        <span className="text-zinc-400 text-sm font-medium group-hover:text-zinc-200 transition-colors">
                                            {item.title}
                                        </span>

                                        {/* Separator */}
                                        <span className="text-zinc-800 text-xs">●</span>
                                    </div>
                                );
                            }
                        })}
                    </div>
                </div>
            </div>

            {/* CSS Animation */}
            <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
        </div>
    );
};

export default RSSNewsTicker;

// 🎖️ RangerPlex RSS Feed Manager Component
// Manage RSS feeds - add, remove, test, enable/disable

import React, { useEffect, useState } from 'react';
import { rssService } from '../services/rssService';
import type { RSSFeed, RSSCategory, RSSFeedTest } from '../types/rss';
import { RSS_CATEGORIES } from '../types/rss';

interface RSSFeedManagerProps {
    onClose?: () => void;
}

export const RSSFeedManager: React.FC<RSSFeedManagerProps> = ({ onClose }) => {
    const [feeds, setFeeds] = useState<RSSFeed[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<RSSCategory | 'all'>('all');
    const [isAddingFeed, setIsAddingFeed] = useState(false);
    const [newFeed, setNewFeed] = useState({
        name: '',
        url: '',
        category: 'news' as RSSCategory,
    });
    const [testResult, setTestResult] = useState<RSSFeedTest | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load feeds
    useEffect(() => {
        loadFeeds();
    }, []);

    const loadFeeds = async () => {
        try {
            setIsLoading(true);
            const allFeeds = await rssService.getAllFeeds();
            setFeeds(allFeeds);
        } catch (error) {
            console.error('Failed to load feeds:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter feeds by category
    const filteredFeeds = selectedCategory === 'all'
        ? feeds
        : feeds.filter(f => f.category === selectedCategory);

    // Group feeds by category
    const groupedFeeds = filteredFeeds.reduce((acc, feed) => {
        if (!acc[feed.category]) {
            acc[feed.category] = [];
        }
        acc[feed.category].push(feed);
        return acc;
    }, {} as Record<RSSCategory, RSSFeed[]>);

    // Add feed
    const handleAddFeed = async () => {
        if (!newFeed.name || !newFeed.url) {
            alert('Please enter feed name and URL');
            return;
        }

        try {
            await rssService.addFeed({
                name: newFeed.name,
                url: newFeed.url,
                category: newFeed.category,
                enabled: true,
            });

            setNewFeed({ name: '', url: '', category: 'news' });
            setIsAddingFeed(false);
            setTestResult(null);
            await loadFeeds();
        } catch (error) {
            alert('Failed to add feed: ' + (error as Error).message);
        }
    };

    // Remove feed
    const handleRemoveFeed = async (feedId: string, feedName: string) => {
        if (!confirm(`Remove feed "${feedName}"?`)) return;

        try {
            await rssService.removeFeed(feedId);
            await loadFeeds();
        } catch (error) {
            alert('Failed to remove feed: ' + (error as Error).message);
        }
    };

    // Toggle feed
    const handleToggleFeed = async (feedId: string, enabled: boolean) => {
        try {
            await rssService.toggleFeed(feedId, enabled);
            await loadFeeds();
        } catch (error) {
            alert('Failed to toggle feed: ' + (error as Error).message);
        }
    };

    // Test feed
    const handleTestFeed = async (url?: string) => {
        const testUrl = url || newFeed.url;
        if (!testUrl) {
            alert('Please enter a feed URL');
            return;
        }

        try {
            setIsTesting(true);
            setTestResult(null);
            const result = await rssService.testFeed(testUrl);
            setTestResult(result);
        } catch (error) {
            setTestResult({
                success: false,
                error: (error as Error).message,
            });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-rss text-cyan-400 text-2xl" />
                    <h2 className="text-2xl font-bold text-white">RSS Feed Manager</h2>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors"
                    >
                        <i className="fa-solid fa-times text-xl" />
                    </button>
                )}
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === 'all'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                >
                    All ({feeds.length})
                </button>
                {Object.values(RSS_CATEGORIES).map(cat => {
                    const count = feeds.filter(f => f.category === cat.id).length;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === cat.id
                                ? `${cat.badgeColor} text-white`
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                        >
                            <i className={`${cat.icon} mr-2`} /> {cat.name} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Add feed button */}
            <div className="mb-6">
                <button
                    onClick={() => setIsAddingFeed(!isAddingFeed)}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <i className="fa-solid fa-plus" />
                    <span>Add New Feed</span>
                </button>
            </div>

            {/* Add feed form */}
            {isAddingFeed && (
                <div className="bg-zinc-800 rounded-lg p-4 mb-6 border border-zinc-700">
                    <h3 className="text-lg font-bold text-white mb-4">Add New RSS Feed</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Feed Name
                            </label>
                            <input
                                type="text"
                                value={newFeed.name}
                                onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                                placeholder="e.g., The Hacker News"
                                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white focus:outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Feed URL
                            </label>
                            <input
                                type="url"
                                value={newFeed.url}
                                onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                                placeholder="https://example.com/feed.xml"
                                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white focus:outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Category
                            </label>
                            <select
                                value={newFeed.category}
                                onChange={(e) => setNewFeed({ ...newFeed, category: e.target.value as RSSCategory })}
                                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white focus:outline-none focus:border-cyan-500"
                            >
                                {Object.values(RSS_CATEGORIES).map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.emoji} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Test result */}
                        {testResult && (
                            <div className={`p-3 rounded ${testResult.success ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'}`}>
                                {testResult.success ? (
                                    <div className="text-green-300">
                                        <div className="font-bold mb-2">✅ Feed is valid!</div>
                                        <div className="text-sm">
                                            <div><strong>Title:</strong> {testResult.preview?.title}</div>
                                            <div><strong>Items:</strong> {testResult.preview?.itemCount}</div>
                                            {testResult.preview && testResult.preview.latestItems.length > 0 && (
                                                <div className="mt-2">
                                                    <strong>Latest items:</strong>
                                                    <ul className="list-disc list-inside ml-2 mt-1">
                                                        {testResult.preview.latestItems.map((item, i) => (
                                                            <li key={i} className="text-xs">{item.title}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-red-300">
                                        <div className="font-bold mb-1">❌ Feed test failed</div>
                                        <div className="text-sm">{testResult.error}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleTestFeed()}
                                disabled={isTesting || !newFeed.url}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded font-medium transition-colors"
                            >
                                {isTesting ? 'Testing...' : 'Test Feed'}
                            </button>
                            <button
                                onClick={handleAddFeed}
                                disabled={!newFeed.name || !newFeed.url}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded font-medium transition-colors"
                            >
                                Add Feed
                            </button>
                            <button
                                onClick={() => {
                                    setIsAddingFeed(false);
                                    setTestResult(null);
                                    setNewFeed({ name: '', url: '', category: 'news' });
                                }}
                                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feed list */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="text-center py-8 text-zinc-400">
                        <div className="animate-spin text-2xl mb-2">⚡</div>
                        <div>Loading feeds...</div>
                    </div>
                ) : Object.keys(groupedFeeds).length === 0 ? (
                    <div className="text-center py-8 text-zinc-400">
                        <div className="text-4xl mb-2">📡</div>
                        <div>No feeds found</div>
                        <div className="text-sm mt-2">Add a feed to get started</div>
                    </div>
                ) : (
                    Object.entries(groupedFeeds).map(([category, categoryFeeds]) => {
                        const cat = RSS_CATEGORIES[category as RSSCategory];
                        return (
                            <div key={category}>
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-sm ${cat.badgeColor}`}>
                                        <i className={cat.icon} />
                                    </span>
                                    {cat.name} ({categoryFeeds.length})
                                </h3>
                                <div className="space-y-2">
                                    {categoryFeeds.map(feed => (
                                        <div
                                            key={feed.id}
                                            className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 hover:border-zinc-600 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium text-white truncate">{feed.name}</h4>
                                                        {feed.lastError && (
                                                            <span className="text-red-400 text-xs" title={feed.lastError}>
                                                                ⚠️
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-zinc-400 truncate mb-2">{feed.url}</div>
                                                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                                                        <span>Items: {feed.itemCount}</span>
                                                        {feed.lastFetched && (
                                                            <span>Last fetched: {new Date(feed.lastFetched).toLocaleString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleFeed(feed.id, !feed.enabled)}
                                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${feed.enabled
                                                            ? 'bg-green-600 hover:bg-green-500 text-white'
                                                            : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-400'
                                                            }`}
                                                        title={feed.enabled ? 'Disable feed' : 'Enable feed'}
                                                    >
                                                        {feed.enabled ? 'Enabled' : 'Disabled'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleTestFeed(feed.url)}
                                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
                                                        title="Test feed"
                                                    >
                                                        Test
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveFeed(feed.id, feed.name)}
                                                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium transition-colors"
                                                        title="Remove feed"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RSSFeedManager;

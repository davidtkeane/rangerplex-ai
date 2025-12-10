import React from 'react';
import { GroundingSource } from '../types';

export type { GroundingSource };

interface GroundingSourceCardProps {
    source: GroundingSource;
    index: number;
}

export const GroundingSourceCard: React.FC<GroundingSourceCardProps> = ({ source, index }) => {
    // Extract domain from URI
    const getDomain = (uri: string) => {
        try {
            const url = new URL(uri);
            return url.hostname.replace('www.', '');
        } catch {
            return 'source';
        }
    };

    // Get favicon URL
    const getFaviconUrl = (uri: string) => {
        try {
            const url = new URL(uri);
            return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
        } catch {
            return null;
        }
    };

    const domain = getDomain(source.uri);
    const faviconUrl = getFaviconUrl(source.uri);

    return (
        <a
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-4 rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 backdrop-blur-sm hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/10 hover:-translate-y-1 transition-all duration-300 ease-out"
        >
            {/* Header */}
            <div className="flex items-start gap-3 mb-2">
                {/* Favicon */}
                {faviconUrl && (
                    <img
                        src={faviconUrl}
                        alt=""
                        className="w-5 h-5 mt-0.5 rounded flex-shrink-0"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                )}

                {/* Title & Citation Number */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm text-zinc-100 group-hover:text-teal-400 transition-colors line-clamp-2">
                            {source.title || 'Untitled Source'}
                        </h4>
                        <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold border border-teal-500/30">
                            {index}
                        </span>
                    </div>
                </div>
            </div>

            {/* Domain */}
            <div className="text-xs text-zinc-500 mb-2 flex items-center gap-1.5">
                <i className="fa-solid fa-link text-[10px]"></i>
                <span className="truncate">{domain}</span>
            </div>

            {/* Snippet */}
            {source.snippet && (
                <p className="text-xs text-zinc-400 line-clamp-3 italic leading-relaxed">
                    "{source.snippet}"
                </p>
            )}

            {/* Open Link Indicator */}
            <div className="mt-3 pt-3 border-t border-zinc-700/30 flex items-center justify-between">
                <span className="text-xs text-zinc-500 group-hover:text-teal-400 transition-colors font-medium">
                    Open Source
                </span>
                <i className="fa-solid fa-arrow-up-right-from-square text-xs text-zinc-600 group-hover:text-teal-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"></i>
            </div>
        </a>
    );
};

// Grid container for multiple source cards
interface GroundingSourcesGridProps {
    sources: GroundingSource[];
    startIndex?: number;
}

export const GroundingSourcesGrid: React.FC<GroundingSourcesGridProps> = ({
    sources,
    startIndex = 1
}) => {
    if (!sources || sources.length === 0) return null;

    return (
        <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <i className="fa-solid fa-link"></i>
                <span>Sources ({sources.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sources.map((source, idx) => (
                    <GroundingSourceCard
                        key={`${source.uri}-${idx}`}
                        source={source}
                        index={startIndex + idx}
                    />
                ))}
            </div>
        </div>
    );
};

export default GroundingSourceCard;

import React, { useState } from 'react';
import { GroundingSource } from '../types';

interface ReferencesSectionProps {
    sources: GroundingSource[];
    citationStyle?: 'apa' | 'mla' | 'chicago';
}

export const ReferencesSection: React.FC<ReferencesSectionProps> = ({
    sources,
    citationStyle = 'apa'
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [copied, setCopied] = useState(false);

    if (!sources || sources.length === 0) return null;

    // Deduplicate sources by URI
    const uniqueSources = Array.from(
        new Map(sources.map(s => [s.uri, s])).values()
    );

    // Format citation based on style
    const formatCitation = (source: GroundingSource, index: number): string => {
        const domain = new URL(source.uri).hostname.replace('www.', '');
        const year = new Date().getFullYear(); // Fallback to current year

        switch (citationStyle) {
            case 'apa':
                return `[${index}] ${source.title}. (${year}). Retrieved from ${source.uri}`;
            case 'mla':
                return `[${index}] "${source.title}." ${domain}, ${year}, ${source.uri}.`;
            case 'chicago':
                return `[${index}] "${source.title}," ${domain}, accessed ${new Date().toLocaleDateString()}, ${source.uri}.`;
            default:
                return `[${index}] ${source.title}. ${source.uri}`;
        }
    };

    // Copy all references to clipboard
    const handleCopyAll = () => {
        const allRefs = uniqueSources
            .map((source, idx) => formatCitation(source, idx + 1))
            .join('\n\n');

        navigator.clipboard.writeText(allRefs);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Export to BibTeX format
    const handleExportBibTeX = () => {
        const bibEntries = uniqueSources.map((source, idx) => {
            const key = `source${idx + 1}`;
            const domain = new URL(source.uri).hostname.replace('www.', '');
            const year = new Date().getFullYear();

            return `@misc{${key},
  title = {${source.title}},
  author = {${domain}},
  year = {${year}},
  url = {${source.uri}},
  note = {Accessed: ${new Date().toLocaleDateString()}}
}`;
        }).join('\n\n');

        const blob = new Blob([bibEntries], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'references.bib';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="mt-6 rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800/30 to-zinc-900/30 backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-book text-amber-500 text-lg"></i>
                    <h3 className="font-bold text-zinc-100">
                        References
                        <span className="ml-2 text-sm font-normal text-zinc-500">
                            ({uniqueSources.length} {uniqueSources.length === 1 ? 'source' : 'sources'})
                        </span>
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    {/* Copy Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCopyAll();
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 transition-colors flex items-center gap-2"
                    >
                        <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                        {copied ? 'Copied!' : 'Copy All'}
                    </button>

                    {/* Expand/Collapse */}
                    <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-zinc-500 transition-transform`}></i>
                </div>
            </div>

            {/* References List */}
            {isExpanded && (
                <div className="border-t border-zinc-700/30">
                    <div className="p-4 space-y-3">
                        {uniqueSources.map((source, idx) => (
                            <div
                                key={`${source.uri}-${idx}`}
                                className="flex gap-3 p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors group"
                            >
                                {/* Citation Number */}
                                <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                                    {idx + 1}
                                </span>

                                {/* Citation Text */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-zinc-300 leading-relaxed">
                                        {formatCitation(source, idx + 1)}
                                    </p>

                                    {/* Quick Link */}
                                    <a
                                        href={source.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 mt-2 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                                    >
                                        <i className="fa-solid fa-external-link-alt"></i>
                                        <span>Open source</span>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-zinc-700/30 p-4 flex items-center justify-between bg-zinc-800/20">
                        <div className="text-xs text-zinc-500">
                            Citation Style: <span className="text-zinc-400 font-semibold uppercase">{citationStyle}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportBibTeX}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-700/50 text-zinc-300 border border-zinc-600/50 hover:bg-zinc-700 transition-colors flex items-center gap-2"
                            >
                                <i className="fa-solid fa-download"></i>
                                Export BibTeX
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReferencesSection;

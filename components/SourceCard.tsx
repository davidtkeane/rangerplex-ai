import React from 'react';
import { GroundingSource } from '../types';

interface SourceCardProps {
  source: GroundingSource;
  index: number;
  messageId?: string;
}

const SourceCard: React.FC<SourceCardProps> = ({ source, index, messageId }) => {
  // Extract domain for display
  let domain = 'Web';
  try {
    if (source.uri) {
        const url = new URL(source.uri);
        domain = url.hostname.replace('www.', '');
    }
  } catch (e) {}

  const faviconUrl = source.uri ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(source.uri)}&sz=64` : '';
  const fallbackInitials = domain.slice(0, 2).toUpperCase();

  return (
    <a
      id={messageId ? `source-${messageId}-${index + 1}` : undefined}
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex flex-col p-2.5 bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/50 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600 transition-all group min-h-[86px] justify-between shadow-sm dark:shadow-none"
    >
      <span className="absolute -left-2 -top-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-blue-500 text-white shadow">
        {index + 1}
      </span>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
          {faviconUrl ? (
            <img
              src={faviconUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <span className="text-[10px] font-bold text-gray-600 dark:text-zinc-200">{fallbackInitials}</span>
          )}
        </div>
        <div className="text-[11px] text-gray-500 dark:text-zinc-500 font-medium truncate group-hover:text-gray-700 dark:group-hover:text-zinc-400">
          {domain}
        </div>
      </div>
      <div className="text-xs text-gray-800 dark:text-zinc-200 font-semibold line-clamp-2 leading-tight mt-1">
        {source.title || "Source " + (index + 1)}
      </div>
    </a>
  );
};

export default SourceCard;

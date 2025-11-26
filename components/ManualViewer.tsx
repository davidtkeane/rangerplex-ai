import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import manualContent from '../rangerplex_manule.md?raw';

interface ManualViewerProps {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

const ManualViewer: React.FC<ManualViewerProps> = ({ open, onClose, onOpenSettings }) => {
  const content = useMemo(() => manualContent, []);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(new Blob([manualContent], { type: 'text/markdown' }));
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, []);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[12000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-teal-200">RangerPlex Manual</span>
            <a
              href={blobUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] px-2 py-1 rounded-full border border-teal-600 text-teal-200 hover:bg-teal-700/20 transition-colors"
            >
              Open in new tab
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="text-xs px-3 py-1 rounded-md border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 transition-colors flex items-center gap-1"
            >
              <i className="fa-solid fa-gear"></i> Settings
            </button>
            <button
              onClick={onClose}
              className="text-xs px-3 py-1 rounded-md border border-green-500 text-green-400 hover:bg-green-500/10 transition-colors flex items-center gap-1"
            >
              <i className="fa-solid fa-house"></i> Main Area
            </button>
            <button
              onClick={onClose}
              className="text-xs px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-1 font-bold shadow-[0_0_10px_rgba(220,38,38,0.5)]"
            >
              <i className="fa-solid fa-xmark"></i> Close
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 prose prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ManualViewer;

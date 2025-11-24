import React, { useEffect, useState } from 'react';
import { autoSaveService } from '../services/autoSaveService';

type Status = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  enabled?: boolean;
  displayMs?: number;
}

export const SaveStatusIndicator: React.FC<Props> = ({ enabled = true, displayMs = 5000 }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleSaving = () => {
      setStatus('saving');
      setErrorMessage(null);
    };
    const handleSaved = (ts?: number) => {
      setStatus('saved');
      setLastSaved(ts || Date.now());
      setErrorMessage(null);
    };
    const handleError = (err: unknown) => {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Save failed');
    };

    autoSaveService.on('saving', handleSaving);
    autoSaveService.on('saved', handleSaved);
    autoSaveService.on('error', handleError);

    return () => {
      autoSaveService.off('saving', handleSaving);
      autoSaveService.off('saved', handleSaved);
      autoSaveService.off('error', handleError);
    };
  }, []);

  useEffect(() => {
    if (status === 'saved' || status === 'error') {
      const timer = setTimeout(() => setStatus('idle'), displayMs);
      return () => clearTimeout(timer);
    }
  }, [status, displayMs]);

  if (!enabled || status === 'idle') return null;

  const label =
    status === 'saving'
      ? 'Saving...'
      : status === 'saved'
        ? 'All changes saved'
        : 'Save issue';

  return (
    <div className="fixed bottom-3 right-3 z-[20000] px-3 py-2 rounded shadow-md text-xs flex items-center gap-2 border bg-white/80 dark:bg-zinc-900/90 dark:text-zinc-100">
      {status === 'saving' && <span aria-hidden>💾</span>}
      {status === 'saved' && <span aria-hidden>✅</span>}
      {status === 'error' && <span aria-hidden>⚠️</span>}
      <div className="flex flex-col">
        <span>{label}</span>
        {lastSaved && status === 'saved' && (
          <span className="text-[10px] opacity-70">Saved at {new Date(lastSaved).toLocaleTimeString()}</span>
        )}
        {errorMessage && (
          <span className="text-[10px] text-red-500">Retrying… {errorMessage}</span>
        )}
      </div>
    </div>
  );
};

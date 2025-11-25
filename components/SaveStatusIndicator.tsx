import React, { useEffect, useRef, useState } from 'react';
import { autoSaveService } from '../services/autoSaveService';

type Status = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  enabled?: boolean;
  displayMs?: number;
}

const SAVING_INDICATOR_DELAY = 200; // Avoid flicker for very short saves
const QUIET_AFTER_SAVE_MS = 2200; // Wait for autosave to settle before showing "saved"

export const SaveStatusIndicator: React.FC<Props> = ({ enabled = true, displayMs = 5000 }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const savingDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (savingDelayRef.current) clearTimeout(savingDelayRef.current);
      if (savedDebounceRef.current) clearTimeout(savedDebounceRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      savingDelayRef.current = null;
      savedDebounceRef.current = null;
      hideTimerRef.current = null;
    };

    const handleSaving = () => {
      if (!enabled) return;

      if (savedDebounceRef.current) {
        clearTimeout(savedDebounceRef.current);
        savedDebounceRef.current = null;
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (savingDelayRef.current) clearTimeout(savingDelayRef.current);

      savingDelayRef.current = setTimeout(() => {
        setStatus('saving');
        setErrorMessage(null);
      }, SAVING_INDICATOR_DELAY);
    };

    const handleSaved = (ts?: number) => {
      if (!enabled) return;

      const timestamp = ts || Date.now();
      setLastSaved(timestamp);

      if (savingDelayRef.current) {
        clearTimeout(savingDelayRef.current);
        savingDelayRef.current = null;
      }
      if (savedDebounceRef.current) clearTimeout(savedDebounceRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

      // Hide while autosave is still firing; only show "saved" after a quiet beat.
      setStatus('idle');
      setErrorMessage(null);
      savedDebounceRef.current = setTimeout(() => {
        setStatus('saved');
        hideTimerRef.current = setTimeout(() => {
          setStatus('idle');
        }, displayMs);
      }, QUIET_AFTER_SAVE_MS);
    };

    const handleError = (err: unknown) => {
      if (savingDelayRef.current) {
        clearTimeout(savingDelayRef.current);
        savingDelayRef.current = null;
      }
      if (savedDebounceRef.current) {
        clearTimeout(savedDebounceRef.current);
        savedDebounceRef.current = null;
      }
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Save failed');
      hideTimerRef.current = setTimeout(() => {
        setStatus('idle');
      }, displayMs);
    };

    autoSaveService.on('saving', handleSaving);
    autoSaveService.on('saved', handleSaved);
    autoSaveService.on('error', handleError);

    return () => {
      autoSaveService.off('saving', handleSaving);
      autoSaveService.off('saved', handleSaved);
      autoSaveService.off('error', handleError);
      clearTimers();
    };
  }, [displayMs, enabled]);

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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useWin95State } from '../src/hooks/useWin95State';

interface Win95EasterEggProps {
  onClose: () => void;
  currentUser?: string;
}

const Win95EasterEgg: React.FC<Win95EasterEggProps> = ({ onClose, currentUser }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [progress, setProgress] = useState(12);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { state, setState, isHydrated } = useWin95State(currentUser || 'guest', true);

  // Bump open count + last opened (Tiered persistence handled in hook)
  useEffect(() => {
    if (!isHydrated) return;
    setState(prev => ({
      ...(prev || {}),
      lastOpened: Date.now(),
      openCount: (prev?.openCount || 0) + 1,
    }));
  }, [isHydrated, setState]);

  useEffect(() => {
    setShowOverlay(true);
    setIsMobile(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const resizeHandler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, []);

  // Fake progress bar while iframe boots
  useEffect(() => {
    if (!isLoading) {
      if (progressTimer.current) clearInterval(progressTimer.current);
      setProgress(100);
      return;
    }
    progressTimer.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 92) return prev;
        return prev + Math.random() * 6;
      });
    }, 180);
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [isLoading]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event?.data) return;
      if (event.data.type === 'CLOSE_WIN95') {
        onClose();
      }
      if (event.data.type === 'SAVE_STATE') {
        setState(prev => ({ ...(prev || {}), ...event.data.payload, lastSaved: Date.now() }));
      }
    };
    window.addEventListener('message', handleMessage);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose, setState]);

  const handleIframeLoad = () => {
    setTimeout(() => setIsLoading(false), 500);
  };

  const overlayClass = useMemo(
    () =>
      `fixed inset-0 z-[10000] transition-opacity duration-300 ${
        showOverlay ? 'opacity-100' : 'opacity-0'
      }`,
    [showOverlay]
  );

  return (
    <div className={overlayClass} role="dialog" aria-label="Windows 95 Simulator">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0b1021] to-black/90" />

      {/* Loading Screen */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm text-cyan-100">
          <div className="text-4xl mb-2">💾</div>
          <div className="text-lg font-semibold mb-3">Loading Windows 95...</div>
          <div className="w-64 h-2 bg-cyan-900/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-200 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {state?.openCount ? (
            <div className="mt-2 text-xs opacity-70">Session #{state.openCount + 1}</div>
          ) : null}
        </div>
      )}

      {/* Mobile notice */}
      {isMobile && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75 text-center text-sm text-white px-6">
          Windows 95 works best on desktop. Please switch to a larger screen.
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 rounded-full bg-cyan-500 text-black font-bold"
          >
            Close
          </button>
        </div>
      )}

      {/* Iframe */}
      <iframe
        title="Windows 95"
        src="/gemini-95/index.html"
        onLoad={handleIframeLoad}
        className="absolute inset-0 w-full h-full border-0"
        allowFullScreen
      />

      {/* Fallback close control */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 px-3 py-2 rounded-md bg-white/10 text-white text-sm hover:bg-white/20 backdrop-blur border border-white/20"
        aria-label="Close Windows 95"
      >
        Exit
      </button>
    </div>
  );
};

export default Win95EasterEgg;

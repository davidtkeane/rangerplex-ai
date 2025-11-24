import { useState, useCallback } from 'react';

export const useBackgroundLock = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Lock the background after first stroke
  const lockBackground = useCallback(() => {
    if (!isLocked) {
      setIsLocked(true);
      setHasDrawn(true);
    }
  }, [isLocked]);

  // Unlock background (when starting new board or clearing)
  const unlockBackground = useCallback(() => {
    setIsLocked(false);
    setHasDrawn(false);
  }, []);

  // Check if user has started drawing (for locking)
  const markAsDrawn = useCallback(() => {
    if (!hasDrawn) {
      setHasDrawn(true);
      // Lock after first stroke
      setTimeout(() => setIsLocked(true), 100);
    }
  }, [hasDrawn]);

  return {
    isLocked,
    hasDrawn,
    lockBackground,
    unlockBackground,
    markAsDrawn
  };
};

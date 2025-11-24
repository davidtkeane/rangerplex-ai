import { useCallback, useEffect, useMemo, useState } from 'react';
import { dbService } from '../../services/dbService';
import { queueSettingSave } from '../../services/autoSaveService';

export interface Win95State {
  data?: unknown;
  lastOpened?: number;
  openCount?: number;
  [key: string]: any;
}

/**
 * Win95 state hook following the 3-tier pattern:
 * Tier 1: localStorage (immediate)
 * Tier 2: IndexedDB via dbService (source of truth)
 * Tier 3: Sync queue via queueSettingSave (cloud)
 */
export const useWin95State = (userId?: string, enableCloudSync = true) => {
  const storageKey = useMemo(
    () => (userId ? `win95_state_${userId}` : 'win95_state_shared'),
    [userId]
  );
  const [state, setState] = useState<Win95State | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from IndexedDB first, then localStorage fallback
  useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      try {
        const dbValue = await dbService.getSetting(storageKey);
        if (isMounted && dbValue) {
          setState(dbValue as Win95State);
          setIsHydrated(true);
          return;
        }
      } catch (error) {
        console.warn('Win95 state DB load failed, falling back to localStorage', error);
      }

      try {
        const localValue = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
        if (isMounted && localValue) {
          setState(JSON.parse(localValue));
        }
      } catch (error) {
        console.warn('Win95 state localStorage load failed', error);
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    };

    hydrate();
    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  // Persist on change
  useEffect(() => {
    if (!isHydrated) return;
    if (typeof window !== 'undefined') {
      try {
        if (state) {
          window.localStorage.setItem(storageKey, JSON.stringify(state));
        } else {
          window.localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.warn('Win95 state localStorage save failed', error);
      }
    }

    // Queue to IndexedDB + cloud sync
    queueSettingSave(storageKey, state, enableCloudSync);
  }, [state, isHydrated, storageKey, enableCloudSync]);

  const clearState = useCallback(async () => {
    setState(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
    }
    try {
      await dbService.saveSetting(storageKey, null);
    } catch (error) {
      console.warn('Failed to clear Win95 state in DB', error);
    }
  }, [storageKey]);

  return { state, setState, isHydrated, clearState };
};

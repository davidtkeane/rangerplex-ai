import { useCallback, useEffect, useMemo, useState } from 'react';
import { dbService } from '../../services/dbService';
import { queueSettingSave } from '../../services/autoSaveService';

export type PetMood = 'idle' | 'happy' | 'playful' | 'celebrating' | 'studying' | 'sleeping';

export interface PetState {
  name: string;
  species: 'cyber_cat';
  level: number;
  xp: number;
  happiness: number; // 50-100 floor to avoid guilt mechanics
  energy: number; // 0-100
  bonds: number; // grows over time, no decay
  mood: PetMood;
  currentAnimation: 'idle' | 'happy' | 'play' | 'celebrate' | 'study' | 'sleep';
  adoptedAt: number;
  lastVisit: number;
  lastInteraction: number;
}

const createDefaultPet = (name = 'Kitty'): PetState => ({
  name,
  species: 'cyber_cat',
  level: 1,
  xp: 0,
  happiness: 85,
  energy: 90,
  bonds: 10,
  mood: 'happy',
  currentAnimation: 'idle',
  adoptedAt: Date.now(),
  lastVisit: Date.now(),
  lastInteraction: Date.now(),
});

const clampPet = (pet: PetState): PetState => ({
  ...pet,
  happiness: Math.min(100, Math.max(50, pet.happiness)),
  energy: Math.min(100, Math.max(0, pet.energy)),
  bonds: Math.max(0, pet.bonds),
});

const calculateLevel = (xp: number, currentLevel: number): { level: number; xpRemainder: number } => {
  // Progressive leveling: level * 100 per level
  let level = currentLevel;
  let remainingXp = xp;
  let xpForNext = level * 100;

  while (remainingXp >= xpForNext) {
    remainingXp -= xpForNext;
    level += 1;
    xpForNext = level * 100;
  }

  return { level, xpRemainder: remainingXp };
};

export const usePetState = (userId?: string, defaultName?: string) => {
  const storageKey = useMemo(
    () => (userId ? `pet_state_${userId}` : 'pet_state_guest'),
    [userId]
  );

  const [pet, setPet] = useState<PetState | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);

  // Hydrate from IndexedDB first, fallback to localStorage
  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        const dbValue = await dbService.getSetting(storageKey);
        if (dbValue && mounted) {
          setPet(clampPet(dbValue as PetState));
          setIsHydrated(true);
          return;
        }
      } catch (error) {
        console.warn('Pet state DB load failed, falling back to localStorage', error);
      }

      try {
        const localValue = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
        if (localValue && mounted) {
          setPet(clampPet(JSON.parse(localValue)));
        } else if (mounted && defaultName) {
          setPet(createDefaultPet(defaultName));
        }
      } catch (error) {
        console.warn('Pet state localStorage load failed', error);
      } finally {
        if (mounted) setIsHydrated(true);
      }
    };

    void hydrate();
    return () => {
      mounted = false;
    };
  }, [storageKey, defaultName]);

  // Persist to IndexedDB + localStorage
  useEffect(() => {
    if (!isHydrated) return;
    if (typeof window !== 'undefined') {
      try {
        if (pet) {
          window.localStorage.setItem(storageKey, JSON.stringify(pet));
        } else {
          window.localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.warn('Pet state localStorage save failed', error);
      }
    }
    queueSettingSave(storageKey, pet, true);
  }, [pet, isHydrated, storageKey]);

  const adoptPet = useCallback((name: string, species: PetState['species'] = 'cyber_cat') => {
    setPet(createDefaultPet(name || defaultName || 'Kitty'));
    setWelcomeMessage(`Welcome, ${name || defaultName || 'Kitty'}! Let's learn together!`);
  }, [defaultName]);

  const recordVisit = useCallback(() => {
    setPet(prev => {
      if (!prev) return prev;
      const hoursAway = (Date.now() - prev.lastVisit) / (1000 * 60 * 60);
      if (hoursAway < 1) return { ...prev, lastVisit: Date.now() };

      const daysAway = Math.floor(hoursAway / 24);
      let bonusXp = 0;
      let bonusBonds = 1;
      let message = 'Hey! Back already? 💚';

      if (daysAway >= 30) {
        bonusXp = 1000;
        bonusBonds = 25;
        message = `OH MY GOSH! You came back after ${daysAway} days! 💚`;
      } else if (daysAway >= 7) {
        bonusXp = 200;
        bonusBonds = 10;
        message = `You're back! ${daysAway} days away — I missed you!`;
      } else if (daysAway >= 1) {
        bonusXp = daysAway * 20;
        bonusBonds = Math.min(8, daysAway * 2);
        message = `Welcome back! ${daysAway} day(s) away 💚`;
      }

      setWelcomeMessage(message);
      const xpTotal = prev.xp + bonusXp;
      const { level, xpRemainder } = calculateLevel(xpTotal, prev.level);

      return clampPet({
        ...prev,
        xp: xpRemainder,
        level,
        bonds: prev.bonds + bonusBonds,
        happiness: Math.min(100, prev.happiness + 5),
        mood: 'happy',
        currentAnimation: 'happy',
        lastVisit: Date.now(),
      });
    });
  }, []);

  const addXP = useCallback((amount: number) => {
    setPet(prev => {
      if (!prev) return prev;
      const xpTotal = prev.xp + amount;
      const { level, xpRemainder } = calculateLevel(xpTotal, prev.level);
      return clampPet({
        ...prev,
        xp: xpRemainder,
        level,
      });
    });
  }, []);

  const feedPet = useCallback(() => {
    setPet(prev => {
      if (!prev) return prev;
      const xpTotal = prev.xp + 10;
      const { level, xpRemainder } = calculateLevel(xpTotal, prev.level);
      return clampPet({
        ...prev,
        happiness: Math.min(100, prev.happiness + 8),
        energy: Math.min(100, prev.energy + 5),
        bonds: prev.bonds + 2,
        xp: xpRemainder,
        level,
        mood: 'happy',
        currentAnimation: 'happy',
        lastInteraction: Date.now(),
      });
    });
    setWelcomeMessage('Yum! Thank you! 😸');
  }, []);

  const playWithPet = useCallback(() => {
    setPet(prev => {
      if (!prev) return prev;
      const xpTotal = prev.xp + 15;
      const { level, xpRemainder } = calculateLevel(xpTotal, prev.level);
      return clampPet({
        ...prev,
        happiness: Math.min(100, prev.happiness + 10),
        energy: Math.max(0, prev.energy - 5),
        bonds: prev.bonds + 3,
        xp: xpRemainder,
        level,
        mood: 'playful',
        currentAnimation: 'play',
        lastInteraction: Date.now(),
      });
    });
    setWelcomeMessage('This is fun! 🎾');
  }, []);

  const setMood = useCallback((mood: PetMood) => {
    setPet(prev => (prev ? { ...prev, mood, currentAnimation: mood === 'celebrating' ? 'celebrate' : 'idle' } : prev));
  }, []);

  return {
    pet,
    isHydrated,
    welcomeMessage,
    adoptPet,
    recordVisit,
    feedPet,
    playWithPet,
    addXP,
    setMood,
  };
};

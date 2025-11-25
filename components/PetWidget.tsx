import React, { useEffect, useMemo, useState } from 'react';
import { AppSettings } from '../types';
import { usePetState, PetState } from '../src/hooks/usePetState';

interface PetWidgetProps {
  isTron?: boolean;
  settings: AppSettings;
  currentUser?: string;
  petBridge?: {
    pet: PetState | null;
    isHydrated: boolean;
    welcomeMessage: string | null;
    adoptPet: (name: string, species?: PetState['species']) => void;
    recordVisit: () => void;
    feedPet: () => void;
    playWithPet: () => void;
  };
}

const PET_ASSETS = {
  idle: '/assets/pets/cyber_cat_idle_animated.gif',
  action: '/assets/pets/animated.gif',
  celebrate: '/assets/pets/effects.gif',
  avatar: '/assets/pets/cyber_cat_idle_animated.gif',
};

const PetWidget: React.FC<PetWidgetProps> = ({ isTron = false, settings, currentUser, petBridge }) => {
  const internal = usePetState(currentUser, settings.petName || 'Kitty');
  const pet = petBridge?.pet ?? internal.pet;
  const isHydrated = petBridge?.isHydrated ?? internal.isHydrated;
  const welcomeMessage = petBridge?.welcomeMessage ?? internal.welcomeMessage;
  const adoptPet = petBridge?.adoptPet ?? internal.adoptPet;
  const recordVisit = petBridge?.recordVisit ?? internal.recordVisit;
  const feedPet = petBridge?.feedPet ?? internal.feedPet;
  const playWithPet = petBridge?.playWithPet ?? internal.playWithPet;
  const [message, setMessage] = useState<string>('');
  const [showAdoption, setShowAdoption] = useState(false);
  const [adoptionName, setAdoptionName] = useState(settings.petName || 'Kitty');

  const xpProgress = useMemo(() => {
    if (!pet) return 0;
    const xpToNext = pet.level * 100;
    return Math.min(100, Math.round((pet.xp / xpToNext) * 100));
  }, [pet]);

  const currentAnimationSrc = useMemo(() => {
    if (!pet) return PET_ASSETS.idle;
    if (pet.currentAnimation === 'celebrate') return PET_ASSETS.celebrate;
    if (pet.currentAnimation === 'happy' || pet.currentAnimation === 'play') return PET_ASSETS.action;
    return PET_ASSETS.idle;
  }, [pet]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!pet) {
      setShowAdoption(true);
      return;
    }
    recordVisit();
  }, [isHydrated, pet, recordVisit]);

  useEffect(() => {
    if (welcomeMessage) setMessage(welcomeMessage);
  }, [welcomeMessage]);

  const playSound = (src: string) => {
    try {
      const audio = new Audio(src);
      audio.volume = Math.min(1, Math.max(0, settings.petVolume ?? 0.7));
      void audio.play();
    } catch (error) {
      console.warn('Pet sound failed', error);
    }
  };

  const handleFeed = () => {
    feedPet();
    playSound('/sounds/pets/meow.mp3');
    setMessage('Yum! Thank you! 😸');
  };

  const handlePlay = () => {
    playWithPet();
    playSound('/sounds/pets/purr.mp3');
    setMessage('This is fun! 🎾');
  };

  if (!isHydrated) {
    return (
      <div
        className={`pet-widget-sidebar border-t border-b p-3 ${
          isTron ? 'border-tron-cyan/30 bg-black' : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
        }`}
      >
        <div className={`text-center text-xs ${isTron ? 'text-tron-cyan' : 'text-gray-600 dark:text-zinc-400'}`}>Loading pet...</div>
      </div>
    );
  }

  if (!pet || showAdoption) {
    return (
      <div
        className={`pet-widget-sidebar border-t border-b p-3 space-y-3 ${
          isTron ? 'border-tron-cyan/30 bg-black' : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
        }`}
      >
        <div
          className={`text-center text-xs font-bold uppercase tracking-wider mb-1 pb-2 border-b ${
            isTron ? 'text-tron-cyan border-tron-cyan/20' : 'text-gray-700 dark:text-zinc-300 border-gray-300 dark:border-zinc-600'
          }`}
        >
          🐾 Adopt your Ranger Pet
        </div>
        <div className="flex items-center gap-3">
          <img src={PET_ASSETS.avatar} alt="Pet avatar" className="w-14 h-14" style={{ imageRendering: 'pixelated' }} />
          <div className="flex-1">
            <label className={`text-xs block mb-1 ${isTron ? 'text-tron-cyan/80' : 'text-gray-700 dark:text-zinc-300'}`}>Pet name</label>
            <input
              value={adoptionName}
              onChange={e => setAdoptionName(e.target.value)}
              className={`w-full rounded px-2 py-1 text-sm ${
                isTron ? 'bg-black border border-tron-cyan/40 text-tron-cyan' : 'bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 text-gray-900 dark:text-zinc-100'
              }`}
            />
          </div>
        </div>
        <button
          onClick={() => {
            adoptPet(adoptionName || 'Kitty');
            setShowAdoption(false);
          }}
          className={`w-full py-2 rounded text-xs font-semibold ${
            isTron ? 'bg-tron-cyan/10 border border-tron-cyan/50 text-tron-cyan hover:bg-tron-cyan hover:text-black' : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          Adopt {adoptionName || 'Kitty'}
        </button>
        <div className={`text-[11px] ${isTron ? 'text-tron-cyan/60' : 'text-gray-600 dark:text-zinc-400'}`}>
          Guilt-free companion: never dies, never gets sad. Only celebrations.
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
      pet-widget-sidebar
      border-t border-b p-3
      ${isTron ? 'border-tron-cyan/30 bg-black' : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'}
    `}
    >
      {/* Header */}
      <div
        className={`
        text-center text-xs font-bold uppercase tracking-wider mb-2 pb-2 border-b
        ${isTron ? 'text-tron-cyan border-tron-cyan/20' : 'text-gray-700 dark:text-zinc-300 border-gray-300 dark:border-zinc-600'}
      `}
      >
        🐾 Ranger Pet
      </div>

      {/* Pet Display */}
      <div className="flex flex-col items-center gap-2 mb-4">
        <img
          src={currentAnimationSrc}
          alt={pet.name}
          className="pet-avatar w-20 h-20"
          style={{ imageRendering: 'pixelated' }}
          key={pet.currentAnimation}
        />

        <div className="flex flex-col items-center gap-1">
          <div className={`font-semibold text-sm ${isTron ? 'text-tron-cyan' : 'text-gray-900 dark:text-zinc-100'}`}>
            {pet.name}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`${isTron ? 'text-tron-cyan/70' : 'text-gray-700 dark:text-zinc-300'}`}>Lvl {pet.level} ⭐</span>
            <span className={`${isTron ? 'text-tron-cyan/70' : 'text-gray-700 dark:text-zinc-300'}`}>
              Mood: {pet.mood === 'playful' ? 'Playful' : pet.mood === 'celebrating' ? 'Celebrating' : 'Happy'} 💚
            </span>
            <span className={`${isTron ? 'text-tron-cyan/70' : 'text-gray-700 dark:text-zinc-300'}`}>XP {xpProgress}%</span>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`text-center text-[11px] px-3 py-2 rounded mb-3 ${
            isTron ? 'bg-tron-cyan/10 text-tron-cyan' : 'bg-gray-100 dark:bg-zinc-700 text-gray-800 dark:text-zinc-100 border border-gray-300 dark:border-zinc-600'
          }`}
        >
          {message}
        </div>
      )}

      {/* Compact Bars */}
      <div className="space-y-1.5 w-full flex flex-col items-center mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] min-w-[64px] text-right ${isTron ? 'text-tron-cyan/70' : 'text-gray-600 dark:text-zinc-400'}`}>Happiness</span>
          <div className={`w-32 h-1 rounded-full overflow-hidden ${isTron ? 'bg-tron-cyan/10 border border-tron-cyan/30' : 'bg-gray-200 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600'}`}>
            <div
              className={`
                h-full rounded-full transition-all duration-500
                ${pet.happiness > 70 ? (isTron ? 'bg-tron-cyan' : 'bg-green-500') : pet.happiness > 50 ? (isTron ? 'bg-yellow-400' : 'bg-yellow-500') : (isTron ? 'bg-red-500' : 'bg-red-600')}
              `}
              style={{ width: `${pet.happiness}%` }}
            />
          </div>
          <span className={`text-[11px] min-w-[38px] text-right ${isTron ? 'text-tron-cyan/70' : 'text-gray-600 dark:text-zinc-400'}`}>{Math.round(pet.happiness)}%</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] min-w-[64px] text-right ${isTron ? 'text-tron-cyan/70' : 'text-gray-600 dark:text-zinc-400'}`}>Energy</span>
          <div className={`w-32 h-1 rounded-full overflow-hidden ${isTron ? 'bg-tron-cyan/10 border border-tron-cyan/30' : 'bg-gray-200 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600'}`}>
            <div
              className={`
                h-full rounded-full transition-all duration-500
                ${pet.energy > 60 ? (isTron ? 'bg-blue-400' : 'bg-blue-500') : pet.energy > 30 ? (isTron ? 'bg-orange-400' : 'bg-orange-500') : (isTron ? 'bg-red-500' : 'bg-red-600')}
              `}
              style={{ width: `${pet.energy}%` }}
            />
          </div>
          <span className={`text-[11px] min-w-[38px] text-right ${isTron ? 'text-tron-cyan/70' : 'text-gray-600 dark:text-zinc-400'}`}>{Math.round(pet.energy)}%</span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[11px] min-w-[64px] text-right ${isTron ? 'text-tron-cyan/70' : 'text-gray-600 dark:text-zinc-400'}`}>XP</span>
          <div className={`w-32 h-1 rounded-full overflow-hidden ${isTron ? 'bg-tron-cyan/10 border border-tron-cyan/30' : 'bg-gray-200 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600'}`}>
            <div
              className={`
                h-full rounded-full transition-all duration-500
                ${isTron ? 'bg-tron-cyan' : 'bg-amber-500'}
              `}
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <span className={`text-[11px] min-w-[38px] text-right ${isTron ? 'text-tron-cyan/70' : 'text-gray-600 dark:text-zinc-400'}`}>{xpProgress}%</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleFeed}
          className={`
            flex-1 px-3 py-2 rounded text-xs font-semibold transition-all
            ${isTron ? 'bg-tron-cyan/10 border border-tron-cyan/50 text-tron-cyan hover:bg-tron-cyan hover:text-black hover:shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'bg-green-500 text-white hover:bg-green-600'}
          `}
        >
          🍎 Feed
        </button>
        <button
          onClick={handlePlay}
          className={`
            flex-1 px-3 py-2 rounded text-xs font-semibold transition-all
            ${isTron ? 'bg-tron-cyan/10 border border-tron-cyan/50 text-tron-cyan hover:bg-tron-cyan hover:text-black hover:shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'bg-blue-500 text-white hover:bg-blue-600'}
          `}
        >
          🎾 Play
        </button>
      </div>

      {/* Simple CSS animations */}
      <style>{`
        .pet-avatar {
          animation: breathing 4s ease-in-out infinite;
        }

        @keyframes breathing {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }

        .pet-avatar:hover {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
      `}</style>
    </div>
  );
};

export default PetWidget;

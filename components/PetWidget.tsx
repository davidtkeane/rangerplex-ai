import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';

interface PetWidgetProps {
  isTron?: boolean;
  settings: AppSettings;
}

const PetWidget: React.FC<PetWidgetProps> = ({ isTron = false, settings }) => {
  const [petLevel, setPetLevel] = useState(1);
  const [petXP, setPetXP] = useState(0);
  const [petMood, setPetMood] = useState('Happy');
  const [happiness, setHappiness] = useState(100);
  const [hunger, setHunger] = useState(0);
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'effects'>('idle');

  // Happiness Decay and Hunger Increase
  useEffect(() => {
    const gameLoop = setInterval(() => {
      // Decrease Happiness
      setHappiness(prev => {
        const newHappiness = Math.max(0, prev - (settings.happinessDecayRate || 2));
        if (newHappiness > 80) setPetMood('Ecstatic');
        else if (newHappiness > 60) setPetMood('Happy');
        else if (newHappiness > 40) setPetMood('Content');
        else if (newHappiness > 20) setPetMood('Bored');
        else setPetMood('Sad');
        return newHappiness;
      });
      // Increase Hunger
      setHunger(prev => Math.min(100, prev + (settings.hungerIncreaseRate || 3)));
    }, 5000); // Run every 5 seconds

    return () => clearInterval(gameLoop);
  }, [settings.happinessDecayRate, settings.hungerIncreaseRate]);

  const handleInteraction = (xpGained: number, happinessGained: number) => {
    // Increase Happiness
    setHappiness(prev => Math.min(100, prev + happinessGained));

    // Increase XP and check for Level Up
    const newXP = petXP + xpGained;
    const xpToNextLevel = petLevel * 100;

    if (newXP >= xpToNextLevel) {
      setPetLevel(petLevel + 1);
      setPetXP(newXP - xpToNextLevel); // Rollover XP
      console.log('🎉 LEVEL UP! New level:', petLevel + 1);
      // You could trigger a special level-up animation here
    } else {
      setPetXP(newXP);
    }
  };

  const handleFeed = () => {
    // Decrease Hunger
    setHunger(prev => Math.max(0, prev - 25)); // Feeding reduces hunger by 25

    // Play meow sound
    const audio = new Audio('/image/pets/sounds/meow.mp3');
    audio.volume = settings.petVolume || 0.7;
    audio.play().catch(err => console.log('Audio play failed:', err));

    // Trigger effects animation
    setCurrentAnimation('effects');
    setTimeout(() => setCurrentAnimation('idle'), 2000);

    handleInteraction(10, 5); // Feed gives 10 XP and 5 Happiness now
    console.log('🍎 Fed pet!');
  };

  const handlePlay = () => {
    // Play purr sound
    const audio = new Audio('/image/pets/sounds/purr.mp3');
    audio.volume = settings.petVolume || 0.7;
    audio.play().catch(err => console.log('Audio play failed:', err));

    handleInteraction(20, 10); // Play gives 20 XP and 10 Happiness
    console.log('🎾 Played with pet!');
  };

  const getAnimationSrc = () => {
    return currentAnimation === 'effects'
      ? '/image/pets/cyber_cat_effects.gif'
      : '/image/pets/cyber_cat_idle_animated.gif';
  };

  return (
    <div className={`
      pet-widget-sidebar
      border-t border-b p-3
      ${isTron
        ? 'border-tron-cyan/30 bg-black'
        : 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900'
      }
    `}>
      {/* Header */}
      <div className={`
        text-center text-xs font-bold uppercase tracking-wider mb-2 pb-2 border-b
        ${isTron
          ? 'text-tron-cyan border-tron-cyan/20'
          : 'text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-800'
        }
      `}>
        🐾 Ranger Pet
      </div>

      {/* Pet Display */}
      <div className="flex flex-col items-center gap-2 mb-3">
        <img
          src={getAnimationSrc()}
          alt={settings.petName || 'Pixel'}
          className="pet-avatar w-20 h-20"
          style={{ imageRendering: 'pixelated' }}
          key={currentAnimation}
        />

        <div className="text-center">
          <div className={`
            font-semibold text-sm
            ${isTron ? 'text-tron-cyan' : 'text-gray-800 dark:text-zinc-200'}
          `}>
            {settings.petName || 'Pixel'}
          </div>
          <div className={`
            text-xs
            ${isTron ? 'text-tron-cyan/70' : 'text-gray-600 dark:text-zinc-400'}
          `}>
            Level {petLevel} ⭐
          </div>
          <div className={`
            text-xs
            ${isTron ? 'text-tron-cyan/70' : 'text-gray-600 dark:text-zinc-400'}
          `}>
            {petMood} 💚
          </div>
        </div>
      </div>

      {/* Happiness Bar */}
      <div className={`
        w-full rounded-full h-2 mb-3
        ${isTron ? 'bg-tron-cyan/10 border border-tron-cyan/30' : 'bg-gray-200 dark:bg-zinc-800'}
      `}>
        <div
          className={`
            h-full rounded-full transition-all duration-500
            ${happiness > 60 ? (isTron ? 'bg-tron-cyan' : 'bg-green-500') : happiness > 30 ? (isTron ? 'bg-yellow-400' : 'bg-yellow-500') : (isTron ? 'bg-red-500' : 'bg-red-600')}
          `}
          style={{ width: `${happiness}%` }}
        ></div>
      </div>

      {/* Hunger Bar */}
      <div className={`
        w-full rounded-full h-2 mb-3
        ${isTron ? 'bg-tron-cyan/10 border border-tron-cyan/30' : 'bg-gray-200 dark:bg-zinc-800'}
      `}>
        <div
          className={`
            h-full rounded-full transition-all duration-500
            ${hunger < 40 ? (isTron ? 'bg-blue-400' : 'bg-blue-500') : hunger < 70 ? (isTron ? 'bg-orange-400' : 'bg-orange-500') : (isTron ? 'bg-red-500' : 'bg-red-600')}
          `}
          style={{ width: `${hunger}%` }}
        ></div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleFeed}
          className={`
            flex-1 px-3 py-2 rounded text-xs font-semibold transition-all
            ${isTron
              ? 'bg-tron-cyan/10 border border-tron-cyan/50 text-tron-cyan hover:bg-tron-cyan hover:text-black hover:shadow-[0_0_10px_rgba(0,243,255,0.3)]'
              : 'bg-green-500 text-white hover:bg-green-600'
            }
          `}
        >
          🍎 Feed
        </button>
        <button
          onClick={handlePlay}
          className={`
            flex-1 px-3 py-2 rounded text-xs font-semibold transition-all
            ${isTron
              ? 'bg-tron-cyan/10 border border-tron-cyan/50 text-tron-cyan hover:bg-tron-cyan hover:text-black hover:shadow-[0_0_10px_rgba(0,243,255,0.3)]'
              : 'bg-blue-500 text-white hover:bg-blue-600'
            }
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

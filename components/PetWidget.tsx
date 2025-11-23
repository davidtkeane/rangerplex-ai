import React, { useState } from 'react';

interface PetWidgetProps {
  isTron?: boolean;
}

const PetWidget: React.FC<PetWidgetProps> = ({ isTron = false }) => {
  const [petName] = useState('Pixel');
  const [petLevel] = useState(1);
  const [petMood] = useState('Happy');
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'effects'>('idle');

  const handleFeed = () => {
    // Play meow sound
    const audio = new Audio('/image/pets/sounds/meow.mp3');
    audio.volume = 0.7;
    audio.play().catch(err => console.log('Audio play failed:', err));

    // Trigger effects animation
    setCurrentAnimation('effects');

    // Return to idle after 2 seconds
    setTimeout(() => {
      setCurrentAnimation('idle');
    }, 2000);

    console.log('🍎 Fed pet!');
  };

  const handlePlay = () => {
    // Play purr sound
    const audio = new Audio('/image/pets/sounds/purr.mp3');
    audio.volume = 0.7;
    audio.play().catch(err => console.log('Audio play failed:', err));
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
          alt={petName}
          className="pet-avatar w-20 h-20"
          style={{ imageRendering: 'pixelated' }}
          key={currentAnimation}
        />

        <div className="text-center">
          <div className={`
            font-semibold text-sm
            ${isTron ? 'text-tron-cyan' : 'text-gray-800 dark:text-zinc-200'}
          `}>
            {petName}
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
            💚 {petMood}
          </div>
        </div>
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

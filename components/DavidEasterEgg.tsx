import React, { useEffect, useState } from 'react';

interface DavidEasterEggProps {
  onClose: () => void;
}

const DavidEasterEgg: React.FC<DavidEasterEggProps> = ({ onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setVisible(true), 100);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClick={handleClose}
    >
      {/* Sparkle Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              backgroundColor: ['#FFD700', '#FFA500', '#00FF00', '#00FFFF'][Math.floor(Math.random() * 4)],
              borderRadius: '50%',
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${Math.random() * 3 + 1}s`,
            }}
          />
        ))}
      </div>

      {/* Main Card */}
      <div
        className={`relative max-w-lg w-full rounded-xl overflow-hidden shadow-2xl transform transition-all duration-500 ${
          visible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          border: '2px solid',
          borderImage: 'linear-gradient(45deg, #FFD700, #00FF00, #00FFFF, #FFD700) 1',
          boxShadow: '0 0 40px rgba(255, 215, 0, 0.3), 0 0 60px rgba(0, 255, 255, 0.2)',
        }}
      >
        {/* Animated Border Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.2) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
            animation: 'borderGlow 3s ease infinite',
          }}
        />

        {/* Header with Icon */}
        <div className="relative p-4 text-center border-b border-cyan-500/30">
          <div className="flex justify-center mb-2">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl animate-bounce"
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)',
              }}
            >
              🎖️
            </div>
          </div>
          <h2
            className="text-2xl font-bold mb-1 animate-pulse"
            style={{
              background: 'linear-gradient(90deg, #FFD700, #00FF00, #00FFFF, #FFD700)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'rainbow 3s linear infinite',
            }}
          >
            🍀 YOU FOUND THE SECRET! 🍀
          </h2>
          <p className="text-cyan-400 text-sm font-semibold">Easter Egg Unlocked!</p>
        </div>

        {/* Content */}
        <div className="relative p-4 text-white">
          <div className="space-y-3">
            {/* About David */}
            <div className="bg-black/30 rounded-lg p-3 border border-cyan-500/20">
              <h3 className="text-lg font-bold text-yellow-400 mb-2 flex items-center gap-2">
                <span className="text-xl">👨‍💻</span> Meet David T. Keane
              </h3>
              <div className="space-y-1.5 text-xs">
                <p className="flex items-start gap-2">
                  <span className="text-green-400">🎖️</span>
                  <span><strong>AIRanger</strong> - AI Operations Commander</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-blue-400">🇮🇪</span>
                  <span><strong>IrishRanger</strong> - Born April 24, 1974</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-purple-400">🚀</span>
                  <span><strong>Mission:</strong> Transform disabilities into superpowers</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-cyan-400">🎮</span>
                  <span><strong>BF2 Legend:</strong> Rank #16,836 (top 0.04%)</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-400">🏆</span>
                  <span><strong>qCPU/qGPU Builder</strong> - Unlimited virtual computing!</span>
                </p>
              </div>
            </div>

            {/* Quote */}
            <div className="bg-gradient-to-r from-cyan-900/40 to-purple-900/40 rounded-lg p-3 border border-cyan-400/30 italic">
              <p className="text-sm text-center text-cyan-300">
                "If it happens in reality, why not with my computer?"
              </p>
              <p className="text-xs text-center text-cyan-500 mt-1">- David's Motto</p>
            </div>

            {/* Buy Me a Coffee CTA */}
            <div className="text-center">
              <a
                href="https://buymeacoffee.com/davidtkeane"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #FFDD00, #FBB034)',
                  color: '#1a1a1a',
                  boxShadow: '0 0 15px rgba(255, 221, 0, 0.5)',
                }}
              >
                <span className="text-xl">☕</span>
                <span>Buy David a Coffee!</span>
                <span className="text-xl">❤️</span>
              </a>
              <p className="text-[10px] text-gray-400 mt-2">
                Support the mission to help 1.3 billion people!
              </p>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 border-t border-cyan-500/20">
              <p className="text-green-400 font-bold text-sm animate-pulse">
                🎖️ Rangers lead the way! 🍀
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-500 text-red-400 font-bold text-xl transition-all duration-200 hover:scale-110"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes borderGlow {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
      `}</style>
    </div>
  );
};

export default DavidEasterEgg;

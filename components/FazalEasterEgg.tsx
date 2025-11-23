import React, { useEffect, useState } from 'react';

interface FazalEasterEggProps {
  onClose: () => void;
}

const FazalEasterEgg: React.FC<FazalEasterEggProps> = ({ onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
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
              backgroundColor: ['#FFD700', '#FF69B4', '#00FF00', '#00FFFF'][Math.floor(Math.random() * 4)],
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
          background: 'linear-gradient(135deg, #1a1a2e 0%, #2e1a4e 50%, #4e1a2e 100%)',
          border: '2px solid',
          borderImage: 'linear-gradient(45deg, #FFD700, #FF69B4, #00FFFF, #FFD700) 1',
          boxShadow: '0 0 40px rgba(255, 105, 180, 0.3), 0 0 60px rgba(255, 215, 0, 0.2)',
        }}
      >
        {/* Animated Border Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255, 105, 180, 0.2) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
            animation: 'borderGlow 3s ease infinite',
          }}
        />

        {/* Header with Icon */}
        <div className="relative p-4 text-center border-b border-pink-500/30">
          <div className="flex justify-center mb-2">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl animate-bounce"
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FF69B4)',
                boxShadow: '0 0 20px rgba(255, 105, 180, 0.6)',
              }}
            >
              🌟
            </div>
          </div>
          <h2
            className="text-2xl font-bold mb-1 animate-pulse"
            style={{
              background: 'linear-gradient(90deg, #FFD700, #FF69B4, #00FFFF, #FFD700)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'rainbow 3s linear infinite',
            }}
          >
            ⭐ YOU FOUND FAZAL! ⭐
          </h2>
          <p className="text-pink-400 text-sm font-semibold">Easter Egg Unlocked!</p>
        </div>

        {/* Content */}
        <div className="relative p-4 text-white">
          <div className="space-y-3">
            {/* Thank You Message */}
            <div className="bg-black/30 rounded-lg p-4 border border-pink-500/20">
              <h3 className="text-xl font-bold text-yellow-400 mb-3 text-center flex items-center justify-center gap-2">
                <span className="text-2xl">🙏</span> Thank You, Fazal! <span className="text-2xl">🙏</span>
              </h3>
              <div className="space-y-2 text-sm text-center">
                <p className="text-pink-300">
                  Your help and support have been <strong className="text-yellow-400">absolutely incredible</strong>!
                </p>
                <p className="text-cyan-300">
                  We couldn't have done this without you. Thank you for being amazing! 🌟
                </p>
              </div>
            </div>

            {/* Appreciation Box */}
            <div className="bg-gradient-to-r from-pink-900/40 to-purple-900/40 rounded-lg p-4 border border-pink-400/30">
              <div className="text-center space-y-2">
                <p className="text-2xl">🎉 🎊 🎈</p>
                <p className="text-lg font-bold text-yellow-300">You're a STAR!</p>
                <p className="text-xs text-pink-300 italic">
                  "Gratitude is the memory of the heart"
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 border-t border-pink-500/20">
              <p className="text-pink-400 font-bold text-sm animate-pulse">
                💖 With sincere thanks from the RangerPlex team! 💖
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

export default FazalEasterEgg;

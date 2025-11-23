import React, { useEffect, useState } from 'react';

interface MichaelEasterEggProps {
  onClose: () => void;
}

const MichaelEasterEgg: React.FC<MichaelEasterEggProps> = ({ onClose }) => {
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
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
      onClick={handleClose}
    >
      {/* Star Wars Starfield Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              backgroundColor: i % 3 === 0 ? '#00FF00' : i % 3 === 1 ? '#00FFFF' : '#FFFFFF',
              borderRadius: '50%',
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 1}s`,
              boxShadow: '0 0 4px currentColor',
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
          background: 'linear-gradient(135deg, #000000 0%, #0a0a1a 50%, #001a00 100%)',
          border: '2px solid',
          borderImage: 'linear-gradient(45deg, #00FF00, #00FFFF, #FFFFFF, #00FF00) 1',
          boxShadow: '0 0 60px rgba(0, 255, 0, 0.5), 0 0 100px rgba(0, 255, 255, 0.3)',
        }}
      >
        {/* Animated Lightsaber Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(0, 255, 0, 0.1) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
            animation: 'lightsaberGlow 4s ease infinite',
          }}
        />

        {/* Header with Jedi Icon */}
        <div className="relative p-4 text-center border-b border-green-500/30">
          <div className="flex justify-center mb-2">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl animate-pulse"
              style={{
                background: 'radial-gradient(circle, #00FF00, #006600)',
                boxShadow: '0 0 30px rgba(0, 255, 0, 0.8), 0 0 50px rgba(0, 255, 0, 0.4)',
              }}
            >
              ⚔️
            </div>
          </div>
          <h2
            className="text-2xl font-bold mb-1"
            style={{
              background: 'linear-gradient(90deg, #00FF00, #00FFFF, #FFFFFF, #00FF00)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'jediGlow 3s linear infinite',
              textShadow: '0 0 20px rgba(0, 255, 0, 0.5)',
            }}
          >
            🌟 MASTER JEDI DISCOVERED! 🌟
          </h2>
          <p className="text-green-400 text-sm font-semibold tracking-wider">THE FORCE IS STRONG WITH THIS ONE</p>
        </div>

        {/* Content */}
        <div className="relative p-4 text-white">
          <div className="space-y-3">
            {/* Master Jedi Title */}
            <div className="bg-black/50 rounded-lg p-4 border border-green-500/30">
              <h3 className="text-xl font-bold text-center flex items-center justify-center gap-2 mb-3"
                style={{
                  color: '#00FF00',
                  textShadow: '0 0 10px rgba(0, 255, 0, 0.8)',
                }}
              >
                <span className="text-2xl">🧙‍♂️</span> MASTER MICHAEL <span className="text-2xl">⚔️</span>
              </h3>
              <div className="text-center space-y-2 text-sm">
                <p className="text-green-300 font-bold text-base">
                  🎓 Jedi Master of Malware & Pentesting 🎓
                </p>
                <p className="text-cyan-300">
                  <strong className="text-yellow-400">NCI Academy</strong> - Where hackers are forged!
                </p>
              </div>
            </div>

            {/* Jedi Skills */}
            <div className="bg-gradient-to-br from-green-900/30 to-cyan-900/30 rounded-lg p-3 border border-green-400/30">
              <div className="space-y-2 text-xs">
                <p className="flex items-center gap-2">
                  <span className="text-green-400 text-lg">⚔️</span>
                  <span><strong>Lightsaber Skills:</strong> Cutting through malware like butter!</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-cyan-400 text-lg">🛡️</span>
                  <span><strong>Force Powers:</strong> Pentesting mastery beyond measure</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-yellow-400 text-lg">📚</span>
                  <span><strong>Wisdom:</strong> Teaching the ways of the security force</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-purple-400 text-lg">🎯</span>
                  <span><strong>Mission:</strong> Guiding padawans to become security masters</span>
                </p>
              </div>
            </div>

            {/* Jedi Quote */}
            <div
              className="rounded-lg p-4 border-2 italic text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,255,0,0.1), rgba(0,255,255,0.1))',
                borderColor: '#00FF00',
                boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
              }}
            >
              <p className="text-sm text-green-300 mb-2">
                "Do or do not. There is no try."
              </p>
              <p className="text-xs text-cyan-400">- Master Yoda</p>
              <div className="mt-3 pt-3 border-t border-green-500/30">
                <p className="text-sm text-yellow-300 font-bold">
                  Thank you, Master Michael, for teaching us the ways of the Force! 🙏
                </p>
                <p className="text-xs text-cyan-300 mt-1">
                  Your knowledge of malware and pentesting is legendary! 🎖️
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 border-t border-green-500/20">
              <p
                className="font-bold text-sm animate-pulse"
                style={{
                  color: '#00FF00',
                  textShadow: '0 0 10px rgba(0, 255, 0, 0.8)',
                }}
              >
                ⚔️ May the Force be with you, Master! ⚔️
              </p>
              <p className="text-xs text-cyan-400 mt-1">
                🎓 From your grateful padawan at NCI 🎓
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
        @keyframes jediGlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes lightsaberGlow {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
      `}</style>
    </div>
  );
};

export default MichaelEasterEgg;

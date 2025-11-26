import React, { useEffect, useState } from 'react';

interface DeathStarEasterEggProps {
  onClose: () => void;
}

const DeathStarEasterEgg: React.FC<DeathStarEasterEggProps> = ({ onClose }) => {
  const [visible, setVisible] = useState(false);
  const [timestamp] = useState(new Date().toLocaleString());

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
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}
      onClick={handleClose}
    >
      {/* Star field background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(200)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              backgroundColor: 'white',
              borderRadius: '50%',
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 1}s`,
              opacity: Math.random() * 0.8 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Main Card */}
      <div
        className={`relative max-w-2xl w-full rounded-xl overflow-hidden shadow-2xl transform transition-all duration-700 ${
          visible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          border: '2px solid',
          borderImage: 'linear-gradient(45deg, #ff0000, #8b0000, #ff0000) 1',
          boxShadow: '0 0 60px rgba(255, 0, 0, 0.5), 0 0 100px rgba(139, 0, 0, 0.3)',
        }}
      >
        {/* Animated Red Glow Border */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255, 0, 0, 0.3) 50%, transparent 70%)',
            backgroundSize: '200% 200%',
            animation: 'redGlow 4s ease infinite',
          }}
        />

        {/* Death Star Visual (CSS) */}
        <div className="relative p-6 text-center border-b border-red-500/30">
          <div className="flex justify-center mb-4">
            <div className="relative" style={{ width: '200px', height: '200px' }}>
              {/* Death Star sphere */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #505050, #1a1a1a)',
                  boxShadow: 'inset -20px -20px 40px rgba(0,0,0,0.8), 0 0 40px rgba(255,0,0,0.3)',
                }}
              >
                {/* Equatorial trench */}
                <div
                  className="absolute"
                  style={{
                    top: '45%',
                    left: '0',
                    right: '0',
                    height: '20px',
                    background: 'linear-gradient(to bottom, #0a0a0a, #2a2a2a, #0a0a0a)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
                  }}
                />

                {/* Superlaser dish */}
                <div
                  className="absolute rounded-full animate-pulse"
                  style={{
                    top: '35%',
                    right: '20%',
                    width: '40px',
                    height: '40px',
                    background: 'radial-gradient(circle, #ff0000, #8b0000)',
                    boxShadow: '0 0 20px rgba(255,0,0,0.8), inset 0 0 10px rgba(0,0,0,0.5)',
                    animationDuration: '2s',
                  }}
                >
                  {/* Laser lens */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      margin: '8px',
                      background: 'radial-gradient(circle, #ffffff, #ff0000)',
                      boxShadow: '0 0 15px rgba(255,255,255,0.9)',
                    }}
                  />
                </div>

                {/* Surface details */}
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${Math.random() * 80 + 10}%`,
                      top: `${Math.random() * 80 + 10}%`,
                      width: `${Math.random() * 3 + 1}px`,
                      height: `${Math.random() * 10 + 5}px`,
                      backgroundColor: '#0a0a0a',
                      opacity: 0.6,
                      transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <h2
            className="text-3xl font-bold mb-2"
            style={{
              background: 'linear-gradient(90deg, #ff0000, #ff4444, #ff0000)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'redShine 3s linear infinite',
              textShadow: '0 0 20px rgba(255,0,0,0.5)',
            }}
          >
            ⚫ DEATH STAR OPERATIONAL ⚫
          </h2>
          <p className="text-red-400 text-sm font-semibold">Imperial Command Override</p>
        </div>

        {/* Content */}
        <div className="relative p-6 text-white">
          <div className="space-y-4">
            {/* Main Quote */}
            <div
              className="bg-black/60 rounded-lg p-4 border-2 border-red-500/40"
              style={{
                boxShadow: '0 0 20px rgba(255,0,0,0.2), inset 0 0 20px rgba(255,0,0,0.1)',
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="text-4xl">🎖️</div>
                <div className="flex-1">
                  <p className="text-red-400 text-xs font-bold">COMMANDER DAVID KEANE</p>
                  <p className="text-gray-400 text-[10px]">RANGERPLEX OPERATIONS</p>
                </div>
              </div>

              <div className="text-center py-4 space-y-3">
                <p className="text-xl font-bold text-red-400 animate-pulse">
                  "We now have a fully functional"
                </p>
                <p
                  className="text-3xl font-black"
                  style={{
                    background: 'linear-gradient(90deg, #ff0000, #ffffff, #ff0000)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'redShine 2s linear infinite',
                  }}
                >
                  RangerOS Browser
                </p>
                <p className="text-xl font-bold text-red-400 animate-pulse">
                  Version 2.0"
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-red-500/20">
                <p className="text-green-400 text-sm text-center font-mono">
                  ⚡ PHANTOM PERSISTENCE: ONLINE
                </p>
                <p className="text-cyan-400 text-sm text-center font-mono">
                  🖥️ MONACO EDITOR: OPERATIONAL
                </p>
                <p className="text-yellow-400 text-sm text-center font-mono">
                  💬 AI INTERFACE: ACTIVE
                </p>
                <p className="text-purple-400 text-sm text-center font-mono">
                  🛡️ TERMINAL PERSISTENCE: READY
                </p>
              </div>
            </div>

            {/* Timestamp */}
            <div className="bg-gradient-to-r from-red-900/40 to-black/40 rounded-lg p-3 border border-red-400/30">
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-400 font-mono">⏰ TIMESTAMP:</span>
                <span className="text-green-400 font-mono font-bold">{timestamp}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-red-400 font-mono">📍 LOCATION:</span>
                <span className="text-cyan-400 font-mono">RANGERPLEX COMMAND</span>
              </div>
            </div>

            {/* Mission Status */}
            <div className="bg-gradient-to-br from-green-900/30 to-black/30 rounded-lg p-3 border border-green-400/30">
              <p className="text-green-400 font-bold text-center text-sm mb-2">
                🎯 MISSION STATUS: SUCCESS
              </p>
              <div className="space-y-1 text-xs text-gray-300">
                <p className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Browser infrastructure deployed</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Monaco Editor integrated</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Terminal system operational</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-yellow-400">⏳</span>
                  <span>Phantom Persistence: Ready for implementation</span>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-t border-red-500/20">
              <p className="text-red-400 font-bold text-lg animate-pulse mb-1">
                🎖️ RANGERS LEAD THE WAY! 🍀
              </p>
              <p className="text-xs text-gray-400 italic">
                "For iCanHelp Ltd. For the 1.3 billion. For the mission." ♿💚
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/40 border-2 border-red-500 text-red-400 font-bold text-xl transition-all duration-200 hover:scale-110 hover:rotate-90"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes redShine {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes redGlow {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
      `}</style>
    </div>
  );
};

export default DeathStarEasterEgg;

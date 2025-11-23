
import React, { useState, useEffect } from 'react';

interface AuthPageProps {
  onLogin: (username: string) => void;
  securityMode?: 'none' | 'bribe' | 'hacker' | 'time' | 'panic' | 'escape';
  isLocked?: boolean;
  lockedUser?: string;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, securityMode = 'none', isLocked = false, lockedUser = '' }) => {
  const [isLogin, setIsLogin] = useState(!isLocked); // If locked, force login mode
  const [username, setUsername] = useState(lockedUser || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [isSeized, setIsSeized] = useState(false);
  const [hackerInput, setHackerInput] = useState('');
  const [panicCount, setPanicCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(10);

  // Load cached background image if available
  useEffect(() => {
    const cachedBg = localStorage.getItem('perplex_login_bg_cache');
    if (cachedBg) {
      setBgImage(cachedBg);
    }
  }, []);

  // Handle Hacker Mode Input
  useEffect(() => {
    if (isSeized && securityMode === 'hacker') {
      const handleKeyDown = (e: KeyboardEvent) => {
        setHackerInput(prev => {
          const next = (prev + e.key).toUpperCase();
          if (next.includes('UNLOCK')) {
            setIsSeized(false);
            setHackerInput('');
            return '';
          }
          return next.slice(-6); // Keep last 6 chars
        });
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSeized, securityMode]);

  // Handle Escape Key
  useEffect(() => {
    if (isSeized && securityMode === 'escape') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsSeized(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSeized, securityMode]);

  // Handle Timer
  useEffect(() => {
    let interval: any;
    if (isSeized && securityMode === 'time') {
      setTimeRemaining(10);
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsSeized(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSeized, securityMode]);

  const handlePanicClick = () => {
    if (securityMode === 'panic') {
      setPanicCount(prev => {
        if (prev + 1 >= 5) {
          setIsSeized(false);
          return 0;
        }
        return prev + 1;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    const users = JSON.parse(localStorage.getItem('perplex_users') || '{}');

    if (isLogin || isLocked) {
      // LOGIN
      if (users[username] && users[username] === password) {
        onLogin(username);
      } else {
        // TRIGGER PRANK IF ENABLED
        if (securityMode !== 'none') {
          setIsSeized(true);
        } else {
          setError("Invalid username or password.");
        }
      }
    } else {
      // SIGN UP
      if (users[username]) {
        setError("Username already exists.");
      } else {
        users[username] = password;
        localStorage.setItem('perplex_users', JSON.stringify(users));
        onLogin(username);
      }
    }
  };

  if (isSeized) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* Use the local image if available, otherwise fallback to a scary placeholder */}
          <img
            src="/image/FBI-screen.jpg"
            onError={(e) => e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Seal_of_the_Federal_Bureau_of_Investigation.svg/1200px-Seal_of_the_Federal_Bureau_of_Investigation.svg.png'}
            className="w-full h-full object-contain md:object-cover"
            alt="SEIZED"
            onClick={handlePanicClick}
          />
        </div>

        {/* Overlay Content based on Mode */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-end pb-20 pointer-events-none">

          {securityMode === 'bribe' && (
            <button
              onClick={() => setIsSeized(false)}
              className="pointer-events-auto bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full shadow-lg animate-bounce border-2 border-white"
            >
              <i className="fa-brands fa-bitcoin mr-2"></i> PAY FINE (0.5 BTC)
            </button>
          )}

          {securityMode === 'time' && (
            <div className="bg-black/80 text-red-500 font-mono text-2xl p-4 border border-red-500 rounded">
              LOCKOUT ACTIVE: {timeRemaining}s
            </div>
          )}

          {securityMode === 'hacker' && (
            <div className="text-green-500 font-mono text-xs opacity-50">
              _TERMINAL_LOCKED_ // AWAITING_OVERRIDE_CODE
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-zinc-950">
      {/* Background Image */}
      {(bgImage || isLocked) && (
        <div className="absolute inset-0 z-0">
          <img
            src={isLocked ? "/image/FBI-screen.jpg" : bgImage!}
            alt="Background"
            onError={(e) => { if (isLocked) e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Seal_of_the_Federal_Bureau_of_Investigation.svg/1200px-Seal_of_the_Federal_Bureau_of_Investigation.svg.png'; }}
            className={`w-full h-full object-cover ${isLocked ? 'opacity-60 blur-[2px]' : 'opacity-60 blur-[2px]'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>
      )}

      {!bgImage && (
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/20 via-zinc-950 to-zinc-950"></div>
      )}

      {/* Content Card */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4">
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 animate-fade-in">

          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-teal-900/50">
              <i className="fa-solid fa-compass text-3xl text-white"></i>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">RangerPlex AI</h1>
            <p className="text-zinc-400 text-sm mt-1">Your Ranger for the Digital Frontier</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">USERNAME</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-user text-zinc-500 text-xs"></i>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLocked}
                  className={`w-full bg-zinc-950/50 border border-zinc-700/50 text-white text-sm rounded-xl focus:ring-teal-500 focus:border-teal-500 block w-full pl-9 p-3 outline-none transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">PASSWORD</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-lock text-zinc-500 text-xs"></i>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-700/50 text-white text-sm rounded-xl focus:ring-teal-500 focus:border-teal-500 block w-full pl-9 p-3 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-teal-900/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-2"
            >
              {isLocked ? 'Resume Session' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            {!isLocked && (
              <button
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                {isLogin ? "New Ranger? Create an account" : "Already have an account? Sign in"}
              </button>
            )}
            {isLocked && (
              <p className="text-xs text-zinc-500">Session Locked. Enter password to resume.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
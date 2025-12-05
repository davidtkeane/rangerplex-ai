import React, { useEffect, useRef, useState, useCallback } from 'react';

interface ScreensaverBackgroundProps {
  enabled: boolean;
  mode: 'slideshow' | 'matrix' | 'none';
  opacity: number; // 0-100
  interval: number; // seconds between slides
  transition: 'fade' | 'slide' | 'zoom' | 'blur' | 'random';
  matrixOnIdle: boolean;
  idleTimeout: number; // seconds before matrix rain
  showClock: boolean;
  theme: 'classic' | 'matrix' | 'tron' | 'retro';
}

const ScreensaverBackground: React.FC<ScreensaverBackgroundProps> = ({
  enabled,
  mode,
  opacity,
  interval,
  transition,
  matrixOnIdle,
  idleTimeout,
  showClock,
  theme
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const imageIndexRef = useRef(0);

  const [currentImage, setCurrentImage] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showMatrix, setShowMatrix] = useState(mode === 'matrix');
  const [currentTime, setCurrentTime] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get transition effect (handle random)
  const getTransitionClass = useCallback(() => {
    const transitions = ['fade', 'slide', 'zoom', 'blur'];
    const effect = transition === 'random'
      ? transitions[Math.floor(Math.random() * transitions.length)]
      : transition;
    return `screensaver-transition-${effect}`;
  }, [transition]);

  // Matrix rain effect
  const drawMatrix = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to fit container
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
    }

    // Matrix rain colors based on theme
    let matrixColor = '#00ff00'; // Default green
    if (theme === 'tron') matrixColor = '#00d4ff';
    if (theme === 'classic') matrixColor = '#4da6ff';
    if (theme === 'retro') matrixColor = '#f59e0b';

    // Semi-transparent black for trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw matrix characters
    ctx.fillStyle = matrixColor;
    ctx.font = '12px monospace';

    const columns = Math.floor(canvas.width / 14);
    for (let i = 0; i < columns; i++) {
      const char = String.fromCharCode(33 + Math.floor(Math.random() * 94));
      const x = i * 14;
      const y = Math.random() * canvas.height;
      ctx.fillText(char, x, y);
    }

    if (showMatrix && enabled) {
      animationRef.current = requestAnimationFrame(drawMatrix);
    }
  }, [theme, showMatrix, enabled]);

  // Start matrix animation
  useEffect(() => {
    if (showMatrix && enabled) {
      animationRef.current = requestAnimationFrame(drawMatrix);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showMatrix, enabled, drawMatrix]);

  // Handle mode changes
  useEffect(() => {
    if (mode === 'matrix') {
      setShowMatrix(true);
    } else if (mode === 'slideshow') {
      setShowMatrix(false);
    } else {
      setShowMatrix(false);
    }
  }, [mode]);

  // Load a new image
  const loadNewImage = useCallback(() => {
    imageIndexRef.current += 1;
    // Use picsum.photos - no CORS issues
    const imageUrl = `https://picsum.photos/800/600?random=${imageIndexRef.current}`;
    console.log('[Screensaver] Loading image:', imageUrl);

    // Preload the image
    const img = new Image();
    img.onload = () => {
      console.log('[Screensaver] Image loaded successfully:', imageUrl);
      setCurrentImage(imageUrl);
      setImageLoaded(true);
    };
    img.onerror = (e) => {
      console.log('[Screensaver] Image load failed:', e);
      // Use a fallback gradient instead
      setCurrentImage('');
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, []);

  // Initial image load and slideshow timer
  useEffect(() => {
    if (mode === 'slideshow' && enabled && !showMatrix) {
      // Load initial image
      if (!currentImage) {
        loadNewImage();
      }

      // Set up interval for slideshow
      slideTimerRef.current = setInterval(() => {
        loadNewImage();
      }, interval * 1000);

      return () => {
        if (slideTimerRef.current) {
          clearInterval(slideTimerRef.current);
        }
      };
    }
  }, [mode, enabled, showMatrix, interval, loadNewImage, currentImage]);

  // Idle detection for matrix rain
  useEffect(() => {
    if (!matrixOnIdle || !enabled || mode === 'matrix') return;

    const resetIdleTimer = () => {
      setShowMatrix(false);

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = setTimeout(() => {
        setShowMatrix(true);
      }, idleTimeout * 1000);
    };

    // Listen for activity
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });

    // Start initial timer
    resetIdleTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [matrixOnIdle, enabled, mode, idleTimeout]);

  // Clock update
  useEffect(() => {
    if (!showClock) return;

    const updateClock = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };

    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    return () => clearInterval(clockInterval);
  }, [showClock]);

  // Debug logging
  console.log('[Screensaver] Render - enabled:', enabled, 'mode:', mode, 'showMatrix:', showMatrix, 'currentImage:', currentImage ? 'set' : 'empty', 'imageLoaded:', imageLoaded);

  if (!enabled) return null;

  return (
    <div
      className="screensaver-container"
      style={{ opacity: opacity / 100 }}
    >
      {/* Slideshow Background */}
      {mode === 'slideshow' && !showMatrix && (
        <div
          className={`screensaver-slide ${isTransitioning ? getTransitionClass() : ''} ${imageLoaded ? 'loaded' : ''}`}
          style={{ backgroundImage: currentImage ? `url(${currentImage})` : 'none' }}
        />
      )}

      {/* Matrix Rain Canvas */}
      {showMatrix && (
        <canvas
          ref={canvasRef}
          className="screensaver-matrix-canvas"
        />
      )}

      {/* Clock Display */}
      {showClock && (
        <div className="screensaver-clock">
          {currentTime}
        </div>
      )}
    </div>
  );
};

export default ScreensaverBackground;

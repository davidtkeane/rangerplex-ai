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
  // Matrix settings
  matrixDensity: number; // 1-5
  matrixSpeed: number; // 1-5
  matrixBrightness: number; // 1-5
  matrixTrailLength: number; // 1-5
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
  theme,
  matrixDensity,
  matrixSpeed,
  matrixBrightness,
  matrixTrailLength
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const imageIndexRef = useRef(0);
  const matrixDropsRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(0);

  const [currentImage, setCurrentImage] = useState<string>('');
  const [isTransitioning, _setIsTransitioning] = useState(false);
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

  // Matrix rain effect - proper falling columns
  const drawMatrix = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to fit container
    const parent = canvas.parentElement;
    if (parent) {
      if (canvas.width !== parent.offsetWidth || canvas.height !== parent.offsetHeight) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
        // Reset drops when canvas resizes
        matrixDropsRef.current = [];
      }
    }

    // Speed control - skip frames based on speed setting (1=slow, 5=fast)
    const frameDelay = 100 - (matrixSpeed * 18); // 82ms at speed 1, 10ms at speed 5
    if (timestamp - lastFrameTimeRef.current < frameDelay) {
      if (showMatrix && enabled) {
        animationRef.current = requestAnimationFrame(drawMatrix);
      }
      return;
    }
    lastFrameTimeRef.current = timestamp;

    // Matrix rain colors based on theme
    let matrixColor = '#00ff00'; // Default green
    let glowColor = 'rgba(0, 255, 0, 0.8)';
    if (theme === 'tron') {
      matrixColor = '#00d4ff';
      glowColor = 'rgba(0, 212, 255, 0.8)';
    }
    if (theme === 'classic') {
      matrixColor = '#4da6ff';
      glowColor = 'rgba(77, 166, 255, 0.8)';
    }
    if (theme === 'retro') {
      matrixColor = '#f59e0b';
      glowColor = 'rgba(245, 158, 11, 0.8)';
    }

    // Trail length - lower = longer trails (more visible)
    const trailOpacity = 0.02 + ((6 - matrixTrailLength) * 0.03); // 0.17 at length 1, 0.02 at length 5
    ctx.fillStyle = `rgba(0, 0, 0, ${trailOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Character settings based on density (1-5)
    const fontSize = 10 + matrixDensity * 2; // 12-20px
    const columnWidth = fontSize + 2;
    const columns = Math.floor(canvas.width / columnWidth);

    // Initialize drops if needed
    if (matrixDropsRef.current.length !== columns) {
      matrixDropsRef.current = Array(columns).fill(0).map(() => Math.random() * -100);
    }

    // Glow effect based on brightness (1-5)
    if (matrixBrightness >= 3) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = matrixBrightness * 3; // 9-15px blur
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.font = `${fontSize}px monospace`;

    // Draw falling characters
    for (let i = 0; i < columns; i++) {
      // Random character (ASCII 33-126 for printable chars, or katakana-style)
      const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const char = chars[Math.floor(Math.random() * chars.length)];

      const x = i * columnWidth;
      const y = matrixDropsRef.current[i] * fontSize;

      // Brighter head character
      ctx.fillStyle = matrixBrightness >= 4 ? '#fff' : matrixColor;
      ctx.fillText(char, x, y);

      // Draw trailing characters with fade based on density
      if (matrixDensity >= 3) {
        ctx.fillStyle = matrixColor;
        for (let j = 1; j <= matrixDensity; j++) {
          const trailChar = chars[Math.floor(Math.random() * chars.length)];
          const trailY = y - (j * fontSize);
          if (trailY > 0) {
            ctx.globalAlpha = 1 - (j / (matrixDensity + 1));
            ctx.fillText(trailChar, x, trailY);
          }
        }
        ctx.globalAlpha = 1;
      }

      // Move drop down
      matrixDropsRef.current[i]++;

      // Reset drop to top with some randomness
      if (y > canvas.height && Math.random() > 0.98) {
        matrixDropsRef.current[i] = 0;
      }
    }

    // Reset shadow
    ctx.shadowBlur = 0;

    if (showMatrix && enabled) {
      animationRef.current = requestAnimationFrame(drawMatrix);
    }
  }, [theme, showMatrix, enabled, matrixDensity, matrixSpeed, matrixBrightness, matrixTrailLength]);

  // Start matrix animation
  useEffect(() => {
    if (showMatrix && enabled) {
      // Reset drops when starting fresh
      matrixDropsRef.current = [];
      animationRef.current = requestAnimationFrame((ts) => drawMatrix(ts));
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

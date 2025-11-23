import React, { useEffect, useRef } from 'react';

interface SnowOverlayProps {
  isTron?: boolean;
}

// Lightweight canvas-based snow/confetti mix for holiday mode
const SnowOverlay: React.FC<SnowOverlayProps> = ({ isTron }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const flakes = Array.from({ length: 80 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 1,
      d: Math.random() * 1 + 0.5,
      drift: Math.random() * 0.5 + 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = isTron ? 'rgba(0,243,255,0.8)' : 'rgba(255,255,255,0.85)';
      ctx.shadowColor = isTron ? '#00f3ff' : '#ffffff';
      ctx.shadowBlur = 4;

      for (const f of flakes) {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update positions
      flakes.forEach(f => {
        f.y += f.d;
        f.x += Math.sin(f.y * 0.01) * f.drift;
        if (f.y > height) {
          f.y = -5;
          f.x = Math.random() * width;
        }
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [isTron]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-40 mix-blend-screen opacity-60"
      aria-hidden="true"
    />
  );
};

export default SnowOverlay;

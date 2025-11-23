import React, { useEffect, useRef } from 'react';

interface SparkleOverlayProps {
  isTron?: boolean;
}

const SparkleOverlay: React.FC<SparkleOverlayProps> = ({ isTron }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const sparks = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
      pulse: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.005,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      sparks.forEach(s => {
        s.pulse += s.speed;
        const alpha = 0.3 + Math.abs(Math.sin(s.pulse)) * 0.7;
        ctx.fillStyle = isTron ? `rgba(0,243,255,${alpha})` : `rgba(255,215,128,${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * (0.8 + Math.sin(s.pulse) * 0.3), 0, Math.PI * 2);
        ctx.fill();
      });
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isTron]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-40 mix-blend-screen opacity-70" aria-hidden="true" />;
};

export default SparkleOverlay;

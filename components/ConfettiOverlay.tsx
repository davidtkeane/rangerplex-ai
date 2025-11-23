import React, { useEffect, useRef } from 'react';

interface ConfettiOverlayProps {
  isTron?: boolean;
}

const ConfettiOverlay: React.FC<ConfettiOverlayProps> = ({ isTron }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const colors = isTron
      ? ['#00f3ff', '#ff6d00', '#9b51e0']
      : ['#facc15', '#fb7185', '#22c55e', '#38bdf8', '#a855f7'];

    const pieces = Array.from({ length: 80 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 8 + 4,
      rot: Math.random() * Math.PI * 2,
      dr: (Math.random() - 0.5) * 0.05,
      dy: Math.random() * 2 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      pieces.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        ctx.restore();

        p.y += p.dy;
        p.rot += p.dr;
        if (p.y > h + 10) {
          p.y = -10;
          p.x = Math.random() * w;
        }
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

export default ConfettiOverlay;

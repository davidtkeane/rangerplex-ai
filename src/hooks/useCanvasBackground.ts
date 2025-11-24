export type BackgroundType = 'blank' | 'grid' | 'lines' | 'dots' | 'graph';

interface BackgroundColors {
  base: string;
  line: string;
}

const getColors = (theme: 'dark' | 'light' | 'tron'): BackgroundColors => {
  switch (theme) {
    case 'dark':
      return { base: '#2a2a2a', line: '#404040' };
    case 'light':
      return { base: '#ffffff', line: '#e5e5e5' };
    case 'tron':
      return { base: '#0a0a0a', line: '#00f3ff' };
    default:
      return { base: '#ffffff', line: '#e5e5e5' };
  }
};

const drawGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing: number,
  color: string
) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;

  for (let x = 0; x <= width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1.0;
};

const drawLines = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing: number,
  color: string
) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;

  for (let y = 0; y <= height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1.0;
};

const drawDots = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spacing: number,
  color: string
) => {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.5;

  for (let x = 0; x <= width; x += spacing) {
    for (let y = 0; y <= height; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1.0;
};

export const useCanvasBackground = () => {
  const drawBackground = (
    canvas: HTMLCanvasElement,
    type: BackgroundType,
    theme: 'dark' | 'light' | 'tron'
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { base, line } = getColors(theme);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    switch (type) {
      case 'grid':
        drawGrid(ctx, canvas.width, canvas.height, 20, line);
        break;
      case 'lines':
        drawLines(ctx, canvas.width, canvas.height, 30, line);
        break;
      case 'dots':
        drawDots(ctx, canvas.width, canvas.height, 20, line);
        break;
      case 'graph':
        drawGrid(ctx, canvas.width, canvas.height, 10, line);
        break;
      case 'blank':
      default:
        break;
    }
  };

  return { drawBackground };
};

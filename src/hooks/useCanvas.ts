import { useEffect, useRef, useState } from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface DrawingTool {
  type: 'pen' | 'eraser' | 'highlighter';
  color: string;
  size: number;
  opacity: number;
  lineCap: 'round' | 'square' | 'butt';
  lineJoin: 'round' | 'bevel' | 'miter';
}

const applyToolSettings = (ctx: CanvasRenderingContext2D, tool: DrawingTool) => {
  ctx.globalCompositeOperation = tool.type === 'eraser' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = tool.color;
  ctx.lineWidth = tool.size;
  ctx.globalAlpha = tool.type === 'eraser' ? 1 : tool.opacity;
  ctx.lineCap = tool.lineCap;
  ctx.lineJoin = tool.lineJoin;
};

const drawStroke = (ctx: CanvasRenderingContext2D, points: Point[]) => {
  if (!points.length) return;

  ctx.beginPath();

  if (points.length === 1) {
    const [p] = points;
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.01, p.y + 0.01);
    ctx.stroke();
    return;
  }

  if (points.length === 2) {
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
    return;
  }

  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }

  const penultimate = points[points.length - 2];
  const last = points[points.length - 1];
  ctx.quadraticCurveTo(penultimate.x, penultimate.y, last.x, last.y);
  ctx.stroke();
};

export const useCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const lastToolRef = useRef<DrawingTool | null>(null);

  useEffect(
    () => () => {
      setIsDrawing(false);
      setCurrentPoints([]);
    },
    []
  );

  const startDrawing = (point: Point) => {
    if (!canvasRef.current) return;
    setIsDrawing(true);
    setCurrentPoints([point]);

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  };

  const draw = (point: Point, tool: DrawingTool) => {
    if (!isDrawing || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    lastToolRef.current = tool;
    applyToolSettings(ctx, tool);

    setCurrentPoints(prevPoints => {
      const nextPoints = [...prevPoints, point];
      drawStroke(ctx, nextPoints);
      return nextPoints;
    });
  };

  const stopDrawing = () => {
    if (!canvasRef.current) {
      setIsDrawing(false);
      setCurrentPoints([]);
      return null;
    }

    const ctx = canvasRef.current.getContext('2d');
    setIsDrawing(false);
    setCurrentPoints([]);

    if (!ctx) return null;
    return ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleTouchStart = (e: TouchEvent, tool?: DrawingTool) => {
    if (!canvasRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const point = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };

    if (tool) {
      lastToolRef.current = tool;
    }
    startDrawing(point);
  };

  const handleTouchMove = (e: TouchEvent, tool?: DrawingTool) => {
    if (!canvasRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const point = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    const activeTool = tool || lastToolRef.current;

    if (activeTool) {
      draw(point, activeTool);
    }
  };

  const handleTouchEnd = (e?: TouchEvent) => {
    if (e) e.preventDefault();
    return stopDrawing();
  };

  return {
    canvasRef,
    isDrawing,
    currentPoints,
    startDrawing,
    draw,
    stopDrawing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};

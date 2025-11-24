import { useState } from 'react';

export const useCanvasHistory = (maxSteps: number = 50) => {
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(0);

  const saveToHistory = (imageData: ImageData) => {
    setHistory(prevHistory => {
      const effectiveStep = Math.min(historyStep, prevHistory.length - 1);
      const baseHistory = effectiveStep >= 0 ? prevHistory.slice(0, effectiveStep + 1) : [];
      const nextHistory = [...baseHistory, imageData];

      const trimmedHistory =
        nextHistory.length > maxSteps
          ? nextHistory.slice(nextHistory.length - maxSteps)
          : nextHistory;

      setHistoryStep(Math.max(0, trimmedHistory.length - 1));
      return trimmedHistory;
    });
  };

  const undo = (canvas: HTMLCanvasElement): ImageData | null => {
    if (historyStep <= 0) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const newStep = historyStep - 1;
    const snapshot = history[newStep];
    if (!snapshot) return null;

    ctx.putImageData(snapshot, 0, 0);
    setHistoryStep(newStep);
    return snapshot;
  };

  const redo = (canvas: HTMLCanvasElement): ImageData | null => {
    if (historyStep >= history.length - 1) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const newStep = historyStep + 1;
    const snapshot = history[newStep];
    if (!snapshot) return null;

    ctx.putImageData(snapshot, 0, 0);
    setHistoryStep(newStep);
    return snapshot;
  };

  const clearHistory = () => {
    setHistory([]);
    setHistoryStep(0);
  };

  const canUndo = historyStep > 0;
  const canRedo = historyStep < history.length - 1;

  return {
    saveToHistory,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
  };
};

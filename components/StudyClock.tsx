// StudyClock.tsx
// Floating timer widget for focus and productivity
// Phase 1: Core timer with 3-Tier Persistence 🎖️

import React, { useEffect } from 'react';
import { useStudyTimer } from '../hooks/useStudyTimer';
import './StudyClock.css';

interface StudyClockProps {
  userId: string;
  theme: 'dark' | 'light' | 'tron' | 'matrix';
  enableCloudSync?: boolean;
  onClose?: () => void;
  onSessionComplete?: (info: { isBreak: boolean; modeType: string; duration: number; pomodoroNumber?: number }) => void;
}

// Circular Progress Ring Component
const ProgressRing: React.FC<{
  progress: number; // 0-1
  size: number;
  strokeWidth: number;
  theme: string;
  isBreak: boolean;
}> = ({ progress, size, strokeWidth, theme, isBreak }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;

  // Color based on mode and theme
  const getStrokeColor = () => {
    if (theme === 'tron') return '#00f3ff';
    if (theme === 'matrix') return '#00ff41';
    if (isBreak) return '#3b82f6'; // Blue for breaks
    return '#22c55e'; // Green for work
  };

  const strokeColor = getStrokeColor();
  const bgColor = theme === 'dark' ? '#374151' : '#e5e7eb';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={bgColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000"
        style={{
          filter:
            theme === 'tron' || theme === 'matrix'
              ? `drop-shadow(0 0 6px ${strokeColor})`
              : 'none',
        }}
      />
    </svg>
  );
};

export const StudyClock: React.FC<StudyClockProps> = ({
  userId,
  theme,
  enableCloudSync = false,
  onClose,
  onSessionComplete,
}) => {
  const [customMinutes, setCustomMinutes] = React.useState<string>('');

  const {
    timerState,
    isMinimized,
    settings,
    todayStats,
    isHydrated,
    start,
    pause,
    reset,
    addTime,
    toggleMinimize,
    formatTime,
    formatTimeShort,
  } = useStudyTimer({
    userId,
    enableCloudSync,
    onTimerComplete: (info) => {
      // Play sound notification
      if (settings.soundEnabled && settings.soundType === 'chime') {
        playChime();
      }

      // Desktop notification
      if (settings.desktopNotifications) {
        showNotification(info.isBreak);
      }

      if (onSessionComplete) {
        onSessionComplete(info);
      }
    },
  });

  // Play chime sound
  const playChime = () => {
    try {
      const audio = new Audio('/sounds/chime.mp3');
      audio.volume = 0.5;
      audio.play().catch((err) => console.warn('Audio playback failed:', err));
    } catch (error) {
      console.warn('Failed to play chime:', error);
    }
  };

  // Show desktop notification
  const showNotification = (isBreak: boolean) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = isBreak ? '🎯 Break Over!' : '✅ Session Complete!';
      const body = isBreak
        ? 'Time to get back to work, Ranger!'
        : 'Great work! Take a well-deserved break.';

      new Notification(title, {
        body,
        icon: '/image/rangerplex_logo.png',
        badge: '/image/rangerplex_logo.png',
        tag: 'study-timer',
        requireInteraction: false,
        silent: false,
      });
    }
  };

  // Handle custom time input
  const handleSetCustomTime = () => {
    const minutes = parseFloat(customMinutes);
    if (isNaN(minutes) || minutes <= 0) {
      alert('Please enter a valid number of minutes');
      return;
    }
    const targetSeconds = Math.floor(minutes * 60);
    const currentSeconds = timerState.timeRemaining;
    const difference = targetSeconds - currentSeconds;

    addTime(difference); // Adjust to reach target time
    setCustomMinutes(''); // Clear input
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          timerState.isRunning ? pause() : start();
          break;
        case 'r':
          e.preventDefault();
          reset();
          break;
        case 'm':
          e.preventDefault();
          toggleMinimize();
          break;
        case '+':
        case '=':
          e.preventDefault();
          addTime(60); // Add 1 minute
          break;
        case '-':
          e.preventDefault();
          addTime(-60); // Subtract 1 minute
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [timerState.isRunning, start, pause, reset, toggleMinimize, addTime]);

  if (!isHydrated) {
    return (
      <div className={`study-clock study-clock-${theme} minimized`}>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  // Calculate progress (0-1)
  const progress = timerState.timeRemaining / timerState.mode.duration;

  // Theme classes
  const themeClass = `study-clock-${theme}`;
  const phaseClass = timerState.mode.isBreak ? 'break-mode' : 'work-mode';

  return (
    <div className={`study-clock ${themeClass} ${isMinimized ? 'minimized' : 'maximized'}`}>
      {/* Header */}
      <div className="study-clock-header">
        <div className="title">
          🕐 Study Clock
          {timerState.mode.isBreak && ' - Break Time'}
        </div>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={toggleMinimize}
            title={isMinimized ? 'Maximize (M)' : 'Minimize (M)'}
          >
            {isMinimized ? '⬆️' : '⬇️'}
          </button>
          {onClose && (
            <button className="icon-btn close-btn" onClick={onClose} title="Close">
              ❌
            </button>
          )}
        </div>
      </div>

      {/* Minimized View */}
      {isMinimized && (
        <div className="minimized-content">
          <div className="timer-display-mini">{formatTimeShort(timerState.timeRemaining)}</div>
          <div className="controls-mini">
            <button
              className="control-btn"
              onClick={timerState.isRunning ? pause : start}
              title={timerState.isRunning ? 'Pause (Space)' : 'Play (Space)'}
            >
              {timerState.isRunning ? '⏸️' : '▶️'}
            </button>
            <button className="control-btn" onClick={() => reset()} title="Reset (R)">
              🔄
            </button>
          </div>
        </div>
      )}

      {/* Maximized View */}
      {!isMinimized && (
        <div className={`maximized-content ${phaseClass}`}>
          {/* Progress Ring */}
          <div className="progress-container">
            <ProgressRing
              progress={progress}
              size={180}
              strokeWidth={12}
              theme={theme}
              isBreak={timerState.mode.isBreak}
            />
            <div className="timer-display-large">{formatTime(timerState.timeRemaining)}</div>
          </div>

          {/* Session Info */}
          <div className="session-info">
            {timerState.mode.type === 'pomodoro' && (
              <>
                <div className="pomodoro-count">
                  🍅 Pomodoro {timerState.currentSession}/
                  {settings.pomodorosUntilLongBreak}
                </div>
                <div className="session-phase">
                  {timerState.mode.isBreak
                    ? timerState.currentSession === 1
                      ? 'Long Break'
                      : 'Short Break'
                    : 'Work Session'}
                </div>
              </>
            )}
          </div>

          {/* Custom Time Input */}
          <div className="custom-time-input">
            <input
              type="number"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              placeholder="Enter Time"
              className="time-input"
              step="0.1"
              min="0.1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSetCustomTime();
              }}
            />
            <button
              className="set-time-btn"
              onClick={handleSetCustomTime}
              title="Set custom timer"
            >
              Set Time
            </button>
          </div>

          {/* Controls */}
          <div className="controls-large">
            <button
              className={`control-btn-large ${timerState.isRunning ? 'pause' : 'play'}`}
              onClick={timerState.isRunning ? pause : start}
              title={timerState.isRunning ? 'Pause (Space)' : 'Play (Space)'}
            >
              {timerState.isRunning ? '⏸️ Pause' : '▶️ Start'}
            </button>
            <button
              className="control-btn-large reset"
              onClick={() => reset()}
              title="Reset (R)"
            >
              🔄 Reset
            </button>
          </div>

          {/* Quick Time Adjustments */}
          <div className="quick-actions">
            <div className="quick-actions-row">
              <button
                className="quick-btn add"
                onClick={() => addTime(600)}
                title="Add 10 minutes"
              >
                +10m
              </button>
              <button
                className="quick-btn add"
                onClick={() => addTime(1200)}
                title="Add 20 minutes"
              >
                +20m
              </button>
            </div>
            <div className="quick-actions-row">
              <button
                className="quick-btn subtract"
                onClick={() => addTime(-600)}
                title="Subtract 10 minutes"
                disabled={timerState.timeRemaining < 600}
              >
                -10m
              </button>
              <button
                className="quick-btn subtract"
                onClick={() => addTime(-1200)}
                title="Subtract 20 minutes"
                disabled={timerState.timeRemaining < 1200}
              >
                -20m
              </button>
            </div>
          </div>

          {/* Today's Stats */}
          <div className="today-stats">
            <div className="stat-item">
              <div className="stat-label">Today</div>
              <div className="stat-value">{formatTime(todayStats.studyTime)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Pomodoros</div>
              <div className="stat-value">🍅 {todayStats.pomodorosCompleted}</div>
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="shortcuts-hint">
            Space: Play/Pause | R: Reset | M: Minimize | +/-: Adjust Time
          </div>
        </div>
      )}
    </div>
  );
};

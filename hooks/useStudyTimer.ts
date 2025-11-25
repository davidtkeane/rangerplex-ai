// useStudyTimer.ts
// Core timer hook with 3-Tier Persistence for Study Clock
// Brother David, this follows the RangerPlex 3-Tier Standard! 🎖️

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  StudyClockState,
  TimerState,
  DEFAULT_STUDY_CLOCK_SETTINGS,
  StudyClockSettings,
} from '../types';
import { studySessionDbService, StudySession } from '../services/studySessionDbService';
import { queueStudySessionSave } from '../services/autoSaveService';
import { v4 as uuidv4 } from 'uuid';

// Time formatting utilities
export const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatTimeShort = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface UseStudyTimerProps {
  userId: string;
  enableCloudSync?: boolean;
  onTimerComplete?: (info: { isBreak: boolean; modeType: string; duration: number; pomodoroNumber?: number }) => void;
  onTick?: (timeRemaining: number) => void;
}

export const useStudyTimer = ({
  userId,
  enableCloudSync = false,
  onTimerComplete,
  onTick,
}: UseStudyTimerProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionRef = useRef<Partial<StudySession> | null>(null);

  // Default timer state
  const defaultTimerState: TimerState = {
    mode: { type: 'pomodoro', duration: 1500, isBreak: false },
    timeRemaining: 1500,
    isRunning: false,
    isPaused: false,
    currentSession: 1,
    pomodorosCompleted: 0,
  };

  const [timerState, setTimerState] = useState<TimerState>(defaultTimerState);
  const [isMinimized, setIsMinimized] = useState(false);
  const [settings, setSettings] = useState<StudyClockSettings>(DEFAULT_STUDY_CLOCK_SETTINGS);
  const [todayStats, setTodayStats] = useState({ studyTime: 0, pomodorosCompleted: 0 });

  // ============================================
  // TIER 1: localStorage (Hot Cache)
  // ============================================
  const loadFromTier1 = (): Partial<StudyClockState> | null => {
    try {
      const key = `study_clock_state_${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Failed to load from Tier 1:', error);
    }
    return null;
  };

  const saveToTier1 = (state: Partial<StudyClockState>) => {
    try {
      const key = `study_clock_state_${userId}`;
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error('❌ Failed to save to Tier 1:', error);
    }
  };

  // ============================================
  // TIER 2 & 3: IndexedDB + Cloud (via autoSaveService)
  // ============================================
  const saveSession = useCallback(
    async (session: StudySession) => {
      // Queue save to Tier 2 (IndexedDB) + Tier 3 (Cloud)
      queueStudySessionSave(session, enableCloudSync);
    },
    [enableCloudSync]
  );

  // ============================================
  // HYDRATION: Load on mount
  // ============================================
  useEffect(() => {
    const hydrate = async () => {
      try {
        // Initialize IndexedDB
        await studySessionDbService.init();

        // Try Tier 1 first (localStorage) for instant UI
        const tier1Data = loadFromTier1();
        if (tier1Data) {
          if (tier1Data.timer) setTimerState(tier1Data.timer);
          if (tier1Data.isMinimized !== undefined) setIsMinimized(tier1Data.isMinimized);
          if (tier1Data.settings) setSettings(tier1Data.settings);
        }

        // Load settings from Tier 2 (IndexedDB) - source of truth
        // Note: Settings are stored via dbService.getSetting
        // For now, we'll use localStorage as primary for settings
        // In Phase 2+, we'll move settings to IndexedDB properly

        // Load today's stats from Tier 2
        const todaySessions = await studySessionDbService.getTodaySessions(userId);
        const studyTime = todaySessions
          .filter((s) => !s.isBreak && s.completed)
          .reduce((sum, s) => sum + s.duration, 0);
        const pomodoros = todaySessions.filter(
          (s) => s.timerType === 'pomodoro' && !s.isBreak && s.completed
        ).length;

        setTodayStats({ studyTime, pomodorosCompleted: pomodoros });

        setIsHydrated(true);
        console.log('✅ Study Clock hydrated from 3-Tier persistence');
      } catch (error) {
        console.error('❌ Hydration failed:', error);
        setIsHydrated(true); // Continue anyway
      }
    };

    hydrate();
  }, [userId]);

  // ============================================
  // PERSISTENCE: Save on state change
  // ============================================
  useEffect(() => {
    if (!isHydrated) return;

    const state: Partial<StudyClockState> = {
      timer: timerState,
      isMinimized,
      settings,
      todayStudyTime: todayStats.studyTime,
      todayPomodorosCompleted: todayStats.pomodorosCompleted,
    };

    // Tier 1: Immediate save (synchronous)
    saveToTier1(state);

    // Tier 2 & 3: Sessions are saved via saveSession() when completed
  }, [timerState, isMinimized, settings, todayStats, isHydrated]);

  // ============================================
  // TIMER LOGIC
  // ============================================
  const startSession = () => {
    currentSessionRef.current = {
      id: uuidv4(),
      userId,
      startTime: Date.now(),
      timerType: timerState.mode.type,
      isBreak: timerState.mode.isBreak,
      pomodoroNumber: timerState.mode.isBreak ? undefined : timerState.currentSession,
      completed: false,
      duration: 0,
      created: Date.now(),
    };

    setTimerState((prev) => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      sessionStartTime: Date.now(),
    }));
  };

  const completeSession = async () => {
    if (currentSessionRef.current) {
      const session: StudySession = {
        ...currentSessionRef.current,
        endTime: Date.now(),
        duration: timerState.mode.duration - timerState.timeRemaining,
        completed: true,
      } as StudySession;

      await saveSession(session);

      // Update today's stats
      if (!session.isBreak) {
        setTodayStats((prev) => ({
          studyTime: prev.studyTime + session.duration,
          pomodorosCompleted:
            session.timerType === 'pomodoro'
              ? prev.pomodorosCompleted + 1
              : prev.pomodorosCompleted,
        }));

        if (session.timerType === 'pomodoro') {
          setTimerState((prev) => ({
            ...prev,
            pomodorosCompleted: prev.pomodorosCompleted + 1,
          }));
        }
      }

      currentSessionRef.current = null;
    }
  };

  useEffect(() => {
    if (timerState.isRunning && timerState.timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimerState((prev) => {
          const newTime = prev.timeRemaining - 1;

          if (onTick) {
            onTick(newTime);
          }

          if (newTime <= 0) {
            // Timer complete!
            void completeSession();

            if (onTimerComplete) {
              onTimerComplete({
                isBreak: prev.mode.isBreak,
                modeType: prev.mode.type,
                duration: prev.mode.duration,
                pomodoroNumber: prev.mode.isBreak ? undefined : prev.currentSession,
              });
            }

            // Handle Pomodoro cycle
            if (prev.mode.type === 'pomodoro') {
              return handlePomodoroComplete(prev, settings);
            }

            return {
              ...prev,
              timeRemaining: 0,
              isRunning: false,
            };
          }

          return { ...prev, timeRemaining: newTime };
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.timeRemaining, onTick, onTimerComplete, settings]);

  // ============================================
  // POMODORO STATE MACHINE
  // ============================================
  const handlePomodoroComplete = (
    state: TimerState,
    settings: StudyClockSettings
  ): TimerState => {
    if (state.mode.isBreak) {
      // Break finished, back to work
      return {
        ...state,
        mode: { type: 'pomodoro', duration: settings.workDuration, isBreak: false },
        timeRemaining: settings.workDuration,
        isRunning: settings.autoStartWork,
        currentSession: state.currentSession,
      };
    } else {
      // Work session finished
      const nextSession = state.currentSession + 1;

      // Time for long break?
      if (nextSession > settings.pomodorosUntilLongBreak) {
        return {
          ...state,
          mode: { type: 'pomodoro', duration: settings.longBreakDuration, isBreak: true },
          timeRemaining: settings.longBreakDuration,
          isRunning: settings.autoStartBreaks,
          currentSession: 1, // Reset cycle
        };
      }

      // Short break
      return {
        ...state,
        mode: { type: 'pomodoro', duration: settings.shortBreakDuration, isBreak: true },
        timeRemaining: settings.shortBreakDuration,
        isRunning: settings.autoStartBreaks,
        currentSession: nextSession,
      };
    }
  };

  // ============================================
  // CONTROL FUNCTIONS
  // ============================================
  const start = () => {
    if (!timerState.isRunning) {
      startSession();
    }
  };

  const pause = () => {
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: true,
    }));

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const reset = (newDuration?: number) => {
    pause();

    // Save incomplete session if there was one
    if (currentSessionRef.current) {
      const session: StudySession = {
        ...currentSessionRef.current,
        endTime: Date.now(),
        duration: timerState.mode.duration - timerState.timeRemaining,
        completed: false, // Interrupted
      } as StudySession;

      void saveSession(session);
      currentSessionRef.current = null;
    }

    setTimerState((prev) => ({
      ...prev,
      timeRemaining: newDuration || prev.mode.duration,
      isRunning: false,
      isPaused: false,
    }));
  };

  const addTime = (seconds: number) => {
    setTimerState((prev) => ({
      ...prev,
      timeRemaining: Math.max(0, prev.timeRemaining + seconds),
    }));
  };

  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  const updateSettings = (newSettings: Partial<StudyClockSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return {
    // State
    timerState,
    isMinimized,
    settings,
    todayStats,
    isHydrated,

    // Controls
    start,
    pause,
    reset,
    addTime,
    toggleMinimize,
    updateSettings,

    // Utilities
    formatTime,
    formatTimeShort,
  };
};

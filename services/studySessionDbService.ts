// Study Session Database Service
// Tier 2 (IndexedDB) operations for Study Clock feature

import { dbService } from './dbService';

export interface StudySession {
  id: string;
  userId: string;
  startTime: number;
  endTime: number;
  duration: number;
  timerType: 'pomodoro' | 'countdown' | 'stopwatch';
  isBreak: boolean;
  pomodoroNumber?: number;
  subject?: string;
  notes?: string;
  completed: boolean;
  created: number;
}

export interface DailyStudyStats {
  date: string; // YYYY-MM-DD
  totalStudyTime: number; // seconds
  totalBreakTime: number; // seconds
  pomodorosCompleted: number;
  sessionsCompleted: number;
  sessionsInterrupted: number;
  subjects: Record<string, number>; // subject -> time spent
}

export interface StudyStreak {
  currentStreak: number; // consecutive days
  longestStreak: number;
  lastStudyDate: string; // YYYY-MM-DD
  totalDaysStudied: number;
}

const STORE = 'study_sessions';

export const studySessionDbService = {
  async init() {
    await dbService.init();
  },

  // Save a single session
  async saveSession(session: StudySession): Promise<void> {
    const db = await dbService.getDB();
    await db.put(STORE, session);
    console.log('💾 Study session saved:', session.id);
  },

  // Save multiple sessions
  async saveSessions(sessions: StudySession[]): Promise<void> {
    const db = await dbService.getDB();
    const tx = db.transaction(STORE, 'readwrite');
    for (const session of sessions) {
      await tx.store.put(session);
    }
    await tx.done;
    console.log(`💾 ${sessions.length} study sessions saved`);
  },

  // Get a single session by ID
  async getSession(sessionId: string): Promise<StudySession | undefined> {
    const db = await dbService.getDB();
    return await db.get(STORE, sessionId);
  },

  // Get all sessions for a user
  async getAllSessions(userId: string): Promise<StudySession[]> {
    const db = await dbService.getDB();
    const allSessions = await db.getAllFromIndex(STORE, 'by-userId', userId);
    // Sort by start time descending (newest first)
    return allSessions.sort((a, b) => b.startTime - a.startTime);
  },

  // Get sessions for a specific date
  async getSessionsByDate(userId: string, date: string): Promise<StudySession[]> {
    const startOfDay = new Date(date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(date).setHours(23, 59, 59, 999);

    const db = await dbService.getDB();
    const allSessions = await db.getAllFromIndex(STORE, 'by-userId', userId);

    return allSessions.filter(
      (s) => s.startTime >= startOfDay && s.startTime <= endOfDay
    );
  },

  // Get sessions for a date range
  async getSessionsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<StudySession[]> {
    const startTime = new Date(startDate).setHours(0, 0, 0, 0);
    const endTime = new Date(endDate).setHours(23, 59, 59, 999);

    const db = await dbService.getDB();
    const allSessions = await db.getAllFromIndex(STORE, 'by-userId', userId);

    return allSessions.filter(
      (s) => s.startTime >= startTime && s.startTime <= endTime
    );
  },

  // Get today's sessions
  async getTodaySessions(userId: string): Promise<StudySession[]> {
    const today = new Date().toISOString().split('T')[0];
    return await this.getSessionsByDate(userId, today);
  },

  // Calculate daily statistics
  async getDailyStats(userId: string, date: string): Promise<DailyStudyStats> {
    const sessions = await this.getSessionsByDate(userId, date);

    const studySessions = sessions.filter((s) => !s.isBreak);
    const breakSessions = sessions.filter((s) => s.isBreak);

    return {
      date,
      totalStudyTime: studySessions
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.duration, 0),
      totalBreakTime: breakSessions
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.duration, 0),
      pomodorosCompleted: studySessions.filter(
        (s) => s.timerType === 'pomodoro' && s.completed
      ).length,
      sessionsCompleted: sessions.filter((s) => s.completed).length,
      sessionsInterrupted: sessions.filter((s) => !s.completed).length,
      subjects: this.groupBySubject(studySessions),
    };
  },

  // Calculate study streak
  async getStudyStreak(userId: string): Promise<StudyStreak> {
    const allSessions = await this.getAllSessions(userId);

    // Get unique study dates (sorted)
    const studyDates = [
      ...new Set(
        allSessions
          .filter((s) => !s.isBreak && s.completed)
          .map((s) => new Date(s.startTime).toISOString().split('T')[0])
      ),
    ].sort();

    if (studyDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: '',
        totalDaysStudied: 0,
      };
    }

    // Calculate streaks
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < studyDates.length; i++) {
      const prevDate = new Date(studyDates[i - 1]);
      const currDate = new Date(studyDates[i]);
      const dayDiff = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    // Check if streak is current (includes today or yesterday)
    const lastDate = new Date(studyDates[studyDates.length - 1]);
    const today = new Date();
    const daysSinceLastStudy = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const currentStreak = daysSinceLastStudy <= 1 ? tempStreak : 0;

    return {
      currentStreak,
      longestStreak,
      lastStudyDate: studyDates[studyDates.length - 1],
      totalDaysStudied: studyDates.length,
    };
  },

  // Delete a session
  async deleteSession(sessionId: string): Promise<void> {
    const db = await dbService.getDB();
    await db.delete(STORE, sessionId);
    console.log('🗑️ Study session deleted:', sessionId);
  },

  // Clear all sessions for a user
  async clearUserSessions(userId: string): Promise<void> {
    const sessions = await this.getAllSessions(userId);
    const db = await dbService.getDB();
    const tx = db.transaction(STORE, 'readwrite');
    for (const session of sessions) {
      await tx.store.delete(session.id);
    }
    await tx.done;
    console.log(`🗑️ Cleared all sessions for user: ${userId}`);
  },

  // Clear all sessions
  async clearAllSessions(): Promise<void> {
    const db = await dbService.getDB();
    await db.clear(STORE);
    console.log('🗑️ All study sessions cleared');
  },

  // Migration from localStorage
  async migrateFromLocalStorage(
    userId: string,
    storageKey = `study_sessions_${userId}`
  ): Promise<StudySession[]> {
    const dbSessions = await this.getAllSessions(userId);
    if (dbSessions.length > 0) return dbSessions;

    try {
      const stored =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(storageKey)
          : null;
      if (!stored) return [];

      const parsed: StudySession[] = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        await this.saveSessions(parsed);
        console.log('✅ Migrated study sessions from localStorage to IndexedDB');
        return parsed;
      }
    } catch (error) {
      console.error('❌ Failed to migrate study sessions from localStorage:', error);
    }
    return [];
  },

  // Get storage usage (data size)
  async getStorageUsage(): Promise<number> {
    const db = await dbService.getDB();
    const allSessions = await db.getAll(STORE);
    return allSessions.length;
  },

  // Private helper: Group sessions by subject
  groupBySubject(sessions: StudySession[]): Record<string, number> {
    return sessions
      .filter((s) => s.completed && s.subject)
      .reduce((acc, s) => {
        acc[s.subject!] = (acc[s.subject!] || 0) + s.duration;
        return acc;
      }, {} as Record<string, number>);
  },
};

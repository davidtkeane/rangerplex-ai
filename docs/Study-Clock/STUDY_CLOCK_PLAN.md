# 🕐 Study Clock Feature - RangerPlex Integration Plan

## Mission: Focus, Track, and Transform Study Habits

**Purpose**: Add a comprehensive study timer system with Pomodoro technique, session tracking, and focus tools to help students build healthy study habits and stay productive.

**Audience**: Students, knowledge workers, anyone learning new skills, people with ADHD/dyslexia who benefit from structured time management

**Accessibility Impact**: Helps ADHD focus, provides structure for dyslexic learners, builds consistent study habits - transforms learning disabilities into superpowers! 🎖️

---

## Why This Feature Matters

### Educational Benefits
- **Pomodoro Technique**: Proven method for maintaining focus and preventing burnout
- **Time Awareness**: Students learn how long tasks actually take
- **Break Reminders**: Prevents mental fatigue and improves retention
- **Study Tracking**: Visualize progress and build momentum
- **Habit Formation**: Consistent study routines lead to better outcomes

### Accessibility Wins
- **ADHD Support**: Clear time boundaries, immediate visual feedback, structured breaks
- **Dyslexia-Friendly**: Large, clear timer display, minimal text, high contrast
- **Motivation**: Gamification and achievements for dopamine-seeking brains
- **Routine Building**: Automated structure reduces decision fatigue
- **Progress Visualization**: Seeing accumulated study time builds confidence

---

## 🛡️ The 3-Tier Persistence Architecture

**CRITICAL**: All Study Clock data follows the **RangerPlex 3-Tier Persistence Standard** for zero data loss.

### Study Clock Data Tiers

#### **Tier 1: localStorage (Hot Cache)**
- **Purpose**: Instant UI feedback, session speed
- **Stores**:
  - Current timer state (running/paused/time remaining)
  - Today's session count (quick access)
  - UI preferences (minimized state, last selected mode)
- **Key**: `study_clock_state_<username>`
- **Limit**: < 100KB
- **Behavior**: Synchronous, instant saves

#### **Tier 2: IndexedDB (The Vault - Source of Truth)**
- **Purpose**: Persistent local storage, survives cache clearing
- **Stores**:
  - All study sessions (complete history)
  - Study clock settings
  - Daily/weekly statistics
  - Achievements and streaks
- **Object Store**: `study_sessions`, `study_stats`, `study_achievements`
- **Limit**: 50MB - 1GB+
- **Behavior**: Asynchronous, transactional
- **Priority**: ALWAYS load from here on startup

#### **Tier 3: Server Sync (Cloud Backup)**
- **Purpose**: Cross-device sync, disaster recovery
- **Syncs**:
  - Completed study sessions
  - Achievement unlocks
  - Settings changes
- **Endpoint**: `/api/study-sessions/save`, `/api/study-sessions/:userId/:date`
- **Behavior**: Queued via `autoSaveService`, retry-able, never blocks UI
- **Fallback**: If offline, queues for later sync

### Implementation Pattern

```typescript
// Study Clock follows this flow:
// 1. User action → Update React state
// 2. React state → Tier 1 (localStorage) immediate
// 3. Debounced → Tier 2 (IndexedDB) via studySessionDbService
// 4. Queued → Tier 3 (Server) via autoSaveService + syncService
```

### Zero Loss Guarantee

All Study Clock data passes the **Zero Loss Checklist**:
- ✅ **Refresh Test**: Timer state persists across page reloads
- ✅ **Cache Clear Test**: Sessions survive browser cache clearing
- ✅ **Offline Test**: Works completely offline, syncs when online
- ✅ **Migration Test**: Automatically migrates from old localStorage-only data
- ✅ **Quota Test**: Handles 10,000+ sessions efficiently

### Service Files

```
services/
├── studySessionDbService.ts       # NEW - Tier 2 (IndexedDB) operations
├── autoSaveService.ts             # MODIFY - Add Study Clock queue
├── syncService.ts                 # MODIFY - Add study session endpoints
└── dbService.ts                   # MODIFY - Add study_sessions store
```

---

## Phase 1: Core Timer System ⏱️

**Difficulty**: ⭐⭐☆☆☆ (Easy-Medium)
**Time Estimate**: 6-8 hours

### Step 1: Create StudyClock Component

**File**: `/components/StudyClock.tsx`

**Core Features**:
- Floating widget (bottom-left corner, mirrors Radio player position)
- Minimize/maximize toggle
- Timer display with countdown
- Play/pause/reset controls
- Theme integration (dark/light/tron)

**Technical Requirements**:
```tsx
interface StudyClockProps {
  theme: 'dark' | 'light' | 'tron';
  onClose?: () => void;
}

interface TimerMode {
  type: 'pomodoro' | 'countdown' | 'stopwatch';
  duration: number; // in seconds
  isBreak: boolean;
}

interface TimerState {
  mode: TimerMode;
  timeRemaining: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  currentSession: number; // Current pomodoro number (1-4)
  pomodorosCompleted: number; // Total today
}

interface StudyClockSettings {
  // Pomodoro durations
  workDuration: number; // Default: 25 minutes (1500 seconds)
  shortBreakDuration: number; // Default: 5 minutes (300 seconds)
  longBreakDuration: number; // Default: 15 minutes (900 seconds)
  pomodorosUntilLongBreak: number; // Default: 4

  // Auto behaviors
  autoStartBreaks: boolean; // Default: true
  autoStartWork: boolean; // Default: false

  // Alerts
  soundEnabled: boolean; // Default: true
  soundType: 'chime' | 'voice' | 'silent'; // Default: 'chime'
  voiceAlertsEnabled: boolean; // Default: false (requires ElevenLabs)
  desktopNotifications: boolean; // Default: true

  // Visual
  showProgressRing: boolean; // Default: true
  showSessionCount: boolean; // Default: true
  minimizeOnStart: boolean; // Default: false
}
```

**State Management**:
```tsx
const [timerState, setTimerState] = useState<TimerState>({
  mode: { type: 'pomodoro', duration: 1500, isBreak: false },
  timeRemaining: 1500,
  isRunning: false,
  isPaused: false,
  currentSession: 1,
  pomodorosCompleted: 0
});

const [isMinimized, setIsMinimized] = useState(false);
const [settings, setSettings] = useState<StudyClockSettings>(DEFAULT_SETTINGS);
```

---

### Step 2: Timer Logic Implementation

**Hook**: `/hooks/useStudyTimer.ts`

**Core Functions**:
```typescript
export const useStudyTimer = (
  initialDuration: number,
  onComplete: () => void,
  onTick?: (timeRemaining: number) => void
) => {
  const [timeRemaining, setTimeRemaining] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    if (!isRunning) {
      setIsRunning(true);
    }
  };

  const pause = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const reset = (newDuration?: number) => {
    pause();
    setTimeRemaining(newDuration || initialDuration);
  };

  const addTime = (seconds: number) => {
    setTimeRemaining(prev => Math.max(0, prev + seconds));
  };

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;

          if (onTick) {
            onTick(newTime);
          }

          if (newTime <= 0) {
            pause();
            onComplete();
            return 0;
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  return {
    timeRemaining,
    isRunning,
    start,
    pause,
    reset,
    addTime
  };
};
```

**Time Formatting Utility**:
```typescript
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
```

---

### Step 3: Notification System

**Service**: `/services/timerNotificationService.ts`

**Implementation**:
```typescript
// Audio alerts
const playChime = () => {
  const audio = new Audio('/sounds/chime.mp3');
  audio.volume = 0.5;
  audio.play().catch(err => console.error('Audio playback failed:', err));
};

// Desktop notifications
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const showTimerNotification = (
  title: string,
  body: string,
  icon: string = '/image/rangerplex_logo.png'
) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: 'study-timer',
      requireInteraction: false,
      silent: false
    });
  }
};

// Voice alerts (ElevenLabs integration)
export const speakTimerAlert = async (
  message: string,
  voiceId: string,
  apiKey: string
) => {
  // Reuse existing speakText from voiceService
  // Or create dedicated timer voice prompts
  // Example: "Break time, Ranger! You've earned it!"
};

// Complete notification handler
export const handleTimerComplete = (
  isBreak: boolean,
  settings: StudyClockSettings,
  elevenLabsKey?: string,
  voiceId?: string
) => {
  const title = isBreak ? '🎯 Break Over!' : '✅ Session Complete!';
  const body = isBreak
    ? 'Time to get back to work, Ranger!'
    : 'Great work! Take a well-deserved break.';

  // Sound alert
  if (settings.soundEnabled && settings.soundType === 'chime') {
    playChime();
  }

  // Voice alert
  if (settings.voiceAlertsEnabled && settings.soundType === 'voice' && elevenLabsKey) {
    speakTimerAlert(body, voiceId || 'Rachel', elevenLabsKey);
  }

  // Desktop notification
  if (settings.desktopNotifications) {
    showTimerNotification(title, body);
  }
};
```

---

## Phase 2: Pomodoro System 🍅

**Difficulty**: ⭐⭐⭐☆☆ (Medium)
**Time Estimate**: 4-6 hours

### Pomodoro State Machine

**Logic**:
```typescript
interface PomodoroState {
  currentPhase: 'work' | 'shortBreak' | 'longBreak';
  sessionNumber: number; // 1-4 (resets after long break)
  totalPomodoros: number; // Total completed today
  cycleComplete: boolean; // True after long break
}

const handlePomodoroComplete = (
  state: PomodoroState,
  settings: StudyClockSettings
): { nextPhase: 'work' | 'shortBreak' | 'longBreak', newState: PomodoroState } => {

  if (state.currentPhase === 'work') {
    const newSessionNumber = state.sessionNumber + 1;
    const totalPomodoros = state.totalPomodoros + 1;

    // Time for long break?
    if (newSessionNumber > settings.pomodorosUntilLongBreak) {
      return {
        nextPhase: 'longBreak',
        newState: {
          ...state,
          sessionNumber: 0, // Reset after long break
          totalPomodoros,
          cycleComplete: false
        }
      };
    }

    // Short break
    return {
      nextPhase: 'shortBreak',
      newState: {
        ...state,
        sessionNumber: newSessionNumber,
        totalPomodoros,
        currentPhase: 'shortBreak'
      }
    };
  }

  // Break finished, back to work
  return {
    nextPhase: 'work',
    newState: {
      ...state,
      currentPhase: 'work',
      cycleComplete: state.currentPhase === 'longBreak'
    }
  };
};
```

### Visual Progress Indicator

**Circular Progress Ring**:
```tsx
interface ProgressRingProps {
  progress: number; // 0-1
  size: number; // diameter in pixels
  strokeWidth: number;
  theme: 'dark' | 'light' | 'tron';
}

const ProgressRing: React.FC<ProgressRingProps> = ({ progress, size, strokeWidth, theme }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;

  const strokeColor = theme === 'tron' ? '#00f3ff' :
                      theme === 'dark' ? '#22c55e' : '#0ea5e9';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={theme === 'dark' ? '#374151' : '#e5e7eb'}
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
          filter: theme === 'tron' ? 'drop-shadow(0 0 6px #00f3ff)' : 'none'
        }}
      />
    </svg>
  );
};
```

---

## Phase 3: Study Session Tracking 📊

**Difficulty**: ⭐⭐⭐☆☆ (Medium)
**Time Estimate**: 5-7 hours

### Data Model

**Interface**: `/types/studySession.ts`
```typescript
export interface StudySession {
  id: string; // UUID
  userId: string;
  startTime: number; // Unix timestamp
  endTime: number; // Unix timestamp
  duration: number; // seconds
  timerType: 'pomodoro' | 'countdown' | 'stopwatch';
  isBreak: boolean;
  pomodoroNumber?: number; // Which pomodoro in the cycle (1-4)
  subject?: string; // Optional subject/topic tag
  notes?: string; // Optional session notes
  completed: boolean; // False if interrupted
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
```

### Session Storage Service

**Service**: `/services/studySessionService.ts`
```typescript
import { dbService } from './dbService';
import { syncService } from './syncService';

export class StudySessionService {

  // Save session to IndexedDB
  async saveSession(session: StudySession): Promise<void> {
    await dbService.saveStudySession(session);

    // Sync to server if cloud sync enabled
    if (this.cloudSyncEnabled) {
      await syncService.syncStudySession(session);
    }
  }

  // Get today's sessions
  async getTodaySessions(userId: string): Promise<StudySession[]> {
    const today = new Date().toISOString().split('T')[0];
    return await dbService.getStudySessionsByDate(userId, today);
  }

  // Calculate daily stats
  async getDailyStats(userId: string, date: string): Promise<DailyStudyStats> {
    const sessions = await dbService.getStudySessionsByDate(userId, date);

    return {
      date,
      totalStudyTime: sessions
        .filter(s => !s.isBreak && s.completed)
        .reduce((sum, s) => sum + s.duration, 0),
      totalBreakTime: sessions
        .filter(s => s.isBreak && s.completed)
        .reduce((sum, s) => sum + s.duration, 0),
      pomodorosCompleted: sessions
        .filter(s => s.timerType === 'pomodoro' && !s.isBreak && s.completed)
        .length,
      sessionsCompleted: sessions.filter(s => s.completed).length,
      sessionsInterrupted: sessions.filter(s => !s.completed).length,
      subjects: this.groupBySubject(sessions)
    };
  }

  // Calculate study streak
  async getStudyStreak(userId: string): Promise<StudyStreak> {
    const allSessions = await dbService.getAllStudySessions(userId);

    // Get unique study dates (sorted)
    const studyDates = [...new Set(
      allSessions
        .filter(s => !s.isBreak && s.completed)
        .map(s => new Date(s.startTime).toISOString().split('T')[0])
    )].sort();

    if (studyDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: '',
        totalDaysStudied: 0
      };
    }

    // Calculate streaks
    let currentStreak = 1;
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < studyDates.length; i++) {
      const prevDate = new Date(studyDates[i - 1]);
      const currDate = new Date(studyDates[i]);
      const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

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
    const daysSinceLastStudy = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    currentStreak = daysSinceLastStudy <= 1 ? tempStreak : 0;

    return {
      currentStreak,
      longestStreak,
      lastStudyDate: studyDates[studyDates.length - 1],
      totalDaysStudied: studyDates.length
    };
  }

  private groupBySubject(sessions: StudySession[]): Record<string, number> {
    return sessions
      .filter(s => !s.isBreak && s.completed && s.subject)
      .reduce((acc, s) => {
        acc[s.subject!] = (acc[s.subject!] || 0) + s.duration;
        return acc;
      }, {} as Record<string, number>);
  }
}

export const studySessionService = new StudySessionService();
```

### Database Schema Addition

**Update**: `/services/dbService.ts`
```typescript
// Add to IndexedDB schema
const DB_NAME = 'RangerPlexDB';
const DB_VERSION = 3; // Increment version

// In upgrade handler
if (oldVersion < 3) {
  // Create study sessions store
  if (!db.objectStoreNames.contains('studySessions')) {
    const studyStore = db.createObjectStore('studySessions', { keyPath: 'id' });
    studyStore.createIndex('userId', 'userId', { unique: false });
    studyStore.createIndex('startTime', 'startTime', { unique: false });
    studyStore.createIndex('userId_date', ['userId', 'date'], { unique: false });
  }
}

// Add methods
async saveStudySession(session: StudySession): Promise<void> {
  const db = await this.openDB();
  const tx = db.transaction('studySessions', 'readwrite');
  await tx.objectStore('studySessions').put(session);
  await tx.done;
}

async getStudySessionsByDate(userId: string, date: string): Promise<StudySession[]> {
  const db = await this.openDB();
  const tx = db.transaction('studySessions', 'readonly');
  const store = tx.objectStore('studySessions');

  const startOfDay = new Date(date).setHours(0, 0, 0, 0);
  const endOfDay = new Date(date).setHours(23, 59, 59, 999);

  const allSessions = await store.getAll();
  return allSessions.filter(s =>
    s.userId === userId &&
    s.startTime >= startOfDay &&
    s.startTime <= endOfDay
  );
}
```

**Server-Side**: Add to `rangerplex_server.js`
```javascript
// SQLite table
db.exec(`
  CREATE TABLE IF NOT EXISTS study_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    timer_type TEXT NOT NULL,
    is_break INTEGER NOT NULL,
    pomodoro_number INTEGER,
    subject TEXT,
    notes TEXT,
    completed INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  )
`);

// API endpoints
app.post('/api/study-sessions/save', async (req, res) => {
  const session = req.body;
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO study_sessions
    (id, user_id, start_time, end_time, duration, timer_type, is_break, pomodoro_number, subject, notes, completed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    session.id,
    session.userId,
    session.startTime,
    session.endTime,
    session.duration,
    session.timerType,
    session.isBreak ? 1 : 0,
    session.pomodoroNumber || null,
    session.subject || null,
    session.notes || null,
    session.completed ? 1 : 0
  );

  res.json({ success: true });
});

app.get('/api/study-sessions/:userId/:date', (req, res) => {
  const { userId, date } = req.params;
  const startOfDay = new Date(date).setHours(0, 0, 0, 0);
  const endOfDay = new Date(date).setHours(23, 59, 59, 999);

  const sessions = db.prepare(`
    SELECT * FROM study_sessions
    WHERE user_id = ? AND start_time >= ? AND start_time <= ?
    ORDER BY start_time DESC
  `).all(userId, startOfDay, endOfDay);

  res.json(sessions);
});
```

---

## Phase 4: Stats Dashboard 📈

**Difficulty**: ⭐⭐⭐⭐☆ (Medium-Hard)
**Time Estimate**: 6-8 hours

### Stats Display Component

**File**: `/components/StudyStatsPanel.tsx`

**Features**:
```tsx
interface StudyStatsPanelProps {
  userId: string;
  theme: 'dark' | 'light' | 'tron';
}

const StudyStatsPanel: React.FC<StudyStatsPanelProps> = ({ userId, theme }) => {
  const [todayStats, setTodayStats] = useState<DailyStudyStats | null>(null);
  const [weekStats, setWeekStats] = useState<DailyStudyStats[]>([]);
  const [streak, setStreak] = useState<StudyStreak | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Display sections:
  // 1. Today's Summary
  //    - Total study time (with progress ring)
  //    - Pomodoros completed
  //    - Current streak

  // 2. Weekly Heatmap
  //    - 7-day calendar view
  //    - Color intensity based on study time
  //    - Click day to see details

  // 3. Subject Breakdown
  //    - Pie chart or bar chart
  //    - Time per subject

  // 4. Achievements
  //    - Recent milestones
  //    - Progress toward next goal

  return (
    <div className={`study-stats-panel study-stats-${theme}`}>
      {/* Implementation details */}
    </div>
  );
};
```

### Visualizations

**Weekly Heatmap**:
```tsx
const WeeklyHeatmap: React.FC<{ stats: DailyStudyStats[], theme: string }> = ({ stats, theme }) => {
  const getIntensity = (studyTime: number): number => {
    // 0 minutes = 0, 4+ hours = 1.0
    return Math.min(studyTime / (4 * 3600), 1);
  };

  const getColor = (intensity: number, theme: string): string => {
    if (theme === 'tron') {
      return `rgba(0, 243, 255, ${0.2 + intensity * 0.8})`;
    }
    // GitHub-style green gradient
    const alpha = 0.1 + intensity * 0.9;
    return `rgba(34, 197, 94, ${alpha})`;
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="heatmap-grid grid grid-cols-7 gap-2">
      {stats.map((dayStat, i) => {
        const intensity = getIntensity(dayStat.totalStudyTime);
        const hours = Math.floor(dayStat.totalStudyTime / 3600);
        const mins = Math.floor((dayStat.totalStudyTime % 3600) / 60);

        return (
          <div
            key={i}
            className="heatmap-cell relative group"
            style={{ backgroundColor: getColor(intensity, theme) }}
            title={`${days[new Date(dayStat.date).getDay()]}: ${hours}h ${mins}m`}
          >
            <span className="text-xs">{days[new Date(dayStat.date).getDay()]}</span>
            {/* Tooltip on hover */}
            <div className="absolute hidden group-hover:block bottom-full mb-2 p-2 bg-black text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
              {dayStat.date}<br />
              {hours}h {mins}m studied<br />
              {dayStat.pomodorosCompleted} 🍅
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

**Subject Breakdown Chart**:
```tsx
const SubjectPieChart: React.FC<{ subjects: Record<string, number>, theme: string }> = ({ subjects, theme }) => {
  const total = Object.values(subjects).reduce((sum, time) => sum + time, 0);

  const colors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  let currentAngle = 0;
  const slices = Object.entries(subjects).map(([subject, time], i) => {
    const percentage = (time / total) * 100;
    const angle = (time / total) * 360;
    const slice = {
      subject,
      time,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: colors[i % colors.length]
    };
    currentAngle += angle;
    return slice;
  });

  return (
    <div className="subject-chart">
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        {slices.map((slice, i) => (
          <path
            key={i}
            d={describePieSlice(100, 100, 80, slice.startAngle, slice.endAngle)}
            fill={slice.color}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
        ))}
      </svg>
      <div className="legend mt-4">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: slice.color }}></div>
            <span>{slice.subject}: {formatTime(slice.time)} ({slice.percentage.toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Phase 5: Integration & Polish 🔗

**Difficulty**: ⭐⭐⭐☆☆ (Medium)
**Time Estimate**: 4-6 hours

### Integration Points

#### **1. Study Notes Integration**
```tsx
// When timer completes, offer to create study note
const handleTimerComplete = async () => {
  if (timerState.mode.isBreak) {
    // Break complete
    handleBreakComplete();
  } else {
    // Study session complete
    const session: StudySession = {
      id: uuidv4(),
      userId: currentUser,
      startTime: sessionStartTime,
      endTime: Date.now(),
      duration: settings.workDuration,
      timerType: 'pomodoro',
      isBreak: false,
      pomodoroNumber: timerState.currentSession,
      completed: true
    };

    // Save session
    await studySessionService.saveSession(session);

    // Prompt for study notes
    if (settings.promptForNotes) {
      setShowNotesPrompt(true);
    }
  }
};

// Notes prompt dialog
const NotesPrompt: React.FC = () => (
  <div className="notes-prompt-overlay">
    <div className="notes-prompt-dialog">
      <h3>🎯 Session Complete!</h3>
      <p>What did you study?</p>
      <input
        type="text"
        placeholder="Subject or topic..."
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <textarea
        placeholder="Quick notes about this session..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="actions">
        <button onClick={() => saveToStudyNotes(subject, notes)}>
          Save to Study Notes
        </button>
        <button onClick={() => setShowNotesPrompt(false)}>
          Skip
        </button>
      </div>
    </div>
  </div>
);
```

#### **2. Ranger Radio Integration**
```tsx
// Auto-control radio during study sessions
const handleSessionStateChange = (isStudying: boolean) => {
  if (settings.autoControlRadio) {
    if (isStudying) {
      // Start work session
      if (settings.radioStationDuringWork) {
        // Switch to focus music (Groove Salad, DEF CON, etc.)
        setRadioStation(settings.radioStationDuringWork);
        setRadioPlaying(true);
      }
    } else {
      // Start break
      if (settings.pauseRadioDuringBreak) {
        setRadioPlaying(false);
      } else if (settings.radioStationDuringBreak) {
        // Switch to different station for break
        setRadioStation(settings.radioStationDuringBreak);
      }
    }
  }
};
```

#### **3. Settings Integration**
Add Study Clock tab to Settings modal:
```tsx
// In SettingsModal.tsx
<div className="settings-tab" data-tab="studyclock">
  <h3>🕐 Study Clock Settings</h3>

  {/* Pomodoro Durations */}
  <div className="setting-group">
    <label>Work Duration (minutes)</label>
    <input
      type="number"
      min="5"
      max="90"
      value={settings.workDuration / 60}
      onChange={(e) => updateSetting('workDuration', parseInt(e.target.value) * 60)}
    />
  </div>

  <div className="setting-group">
    <label>Short Break (minutes)</label>
    <input
      type="number"
      min="1"
      max="30"
      value={settings.shortBreakDuration / 60}
      onChange={(e) => updateSetting('shortBreakDuration', parseInt(e.target.value) * 60)}
    />
  </div>

  <div className="setting-group">
    <label>Long Break (minutes)</label>
    <input
      type="number"
      min="5"
      max="60"
      value={settings.longBreakDuration / 60}
      onChange={(e) => updateSetting('longBreakDuration', parseInt(e.target.value) * 60)}
    />
  </div>

  {/* Auto Behaviors */}
  <div className="setting-group">
    <label>
      <input
        type="checkbox"
        checked={settings.autoStartBreaks}
        onChange={(e) => updateSetting('autoStartBreaks', e.target.checked)}
      />
      Auto-start breaks
    </label>
  </div>

  <div className="setting-group">
    <label>
      <input
        type="checkbox"
        checked={settings.autoStartWork}
        onChange={(e) => updateSetting('autoStartWork', e.target.checked)}
      />
      Auto-start next work session
    </label>
  </div>

  {/* Alerts */}
  <div className="setting-group">
    <label>Alert Sound</label>
    <select
      value={settings.soundType}
      onChange={(e) => updateSetting('soundType', e.target.value)}
    >
      <option value="chime">Chime</option>
      <option value="voice">Voice (ElevenLabs)</option>
      <option value="silent">Silent</option>
    </select>
  </div>

  {/* Radio Integration */}
  <div className="setting-group">
    <label>
      <input
        type="checkbox"
        checked={settings.autoControlRadio}
        onChange={(e) => updateSetting('autoControlRadio', e.target.checked)}
      />
      Auto-control Ranger Radio
    </label>
  </div>
</div>
```

### Keyboard Shortcuts

**Implementation**: Add to StudyClock component
```tsx
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Only if Study Clock is open and not typing in input
    if (!isOpen || (e.target as HTMLElement).tagName === 'INPUT') return;

    switch(e.key.toLowerCase()) {
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
        setIsMinimized(!isMinimized);
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
      case 's':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          // Open stats panel
        }
        break;
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [isOpen, timerState, isMinimized]);
```

---

## Phase 6: Advanced Features 🚀

**Difficulty**: ⭐⭐⭐⭐☆ (Hard)
**Time Estimate**: 8-10 hours

### Gamification & Achievements

**Data Model**:
```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji
  requirement: number;
  category: 'pomodoros' | 'time' | 'streak' | 'subjects';
  unlocked: boolean;
  unlockedDate?: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_pomodoro',
    name: 'First Pomodoro',
    description: 'Complete your first pomodoro session',
    icon: '🍅',
    requirement: 1,
    category: 'pomodoros',
    unlocked: false
  },
  {
    id: 'ten_pomodoros',
    name: 'Pomodoro Pro',
    description: 'Complete 10 pomodoro sessions',
    icon: '🎯',
    requirement: 10,
    category: 'pomodoros',
    unlocked: false
  },
  {
    id: 'hundred_pomodoros',
    name: 'Century Club',
    description: 'Complete 100 pomodoro sessions',
    icon: '💯',
    requirement: 100,
    category: 'pomodoros',
    unlocked: false
  },
  {
    id: 'seven_day_streak',
    name: 'Study Warrior',
    description: 'Study 7 days in a row',
    icon: '⚔️',
    requirement: 7,
    category: 'streak',
    unlocked: false
  },
  {
    id: 'thirty_day_streak',
    name: 'Study Master',
    description: 'Study 30 days in a row',
    icon: '🎖️',
    requirement: 30,
    category: 'streak',
    unlocked: false
  },
  {
    id: 'ten_hours',
    name: 'Time Traveler',
    description: 'Study for 10 hours total',
    icon: '⏰',
    requirement: 36000, // seconds
    category: 'time',
    unlocked: false
  },
  {
    id: 'hundred_hours',
    name: 'Dedicated Scholar',
    description: 'Study for 100 hours total',
    icon: '📚',
    requirement: 360000,
    category: 'time',
    unlocked: false
  },
  {
    id: 'five_subjects',
    name: 'Renaissance Ranger',
    description: 'Study 5 different subjects',
    icon: '🌟',
    requirement: 5,
    category: 'subjects',
    unlocked: false
  }
];
```

**Achievement Checking**:
```typescript
const checkAchievements = async (
  userId: string,
  currentAchievements: Achievement[]
): Promise<Achievement[]> => {
  const stats = await studySessionService.getDailyStats(userId, new Date().toISOString().split('T')[0]);
  const allSessions = await dbService.getAllStudySessions(userId);
  const streak = await studySessionService.getStudyStreak(userId);

  const totalPomodoros = allSessions.filter(s =>
    s.timerType === 'pomodoro' && !s.isBreak && s.completed
  ).length;

  const totalStudyTime = allSessions
    .filter(s => !s.isBreak && s.completed)
    .reduce((sum, s) => sum + s.duration, 0);

  const uniqueSubjects = new Set(
    allSessions
      .filter(s => s.subject && !s.isBreak && s.completed)
      .map(s => s.subject!)
  ).size;

  const newlyUnlocked: Achievement[] = [];

  currentAchievements.forEach(achievement => {
    if (achievement.unlocked) return;

    let shouldUnlock = false;

    switch (achievement.category) {
      case 'pomodoros':
        shouldUnlock = totalPomodoros >= achievement.requirement;
        break;
      case 'time':
        shouldUnlock = totalStudyTime >= achievement.requirement;
        break;
      case 'streak':
        shouldUnlock = streak.currentStreak >= achievement.requirement;
        break;
      case 'subjects':
        shouldUnlock = uniqueSubjects >= achievement.requirement;
        break;
    }

    if (shouldUnlock) {
      achievement.unlocked = true;
      achievement.unlockedDate = Date.now();
      newlyUnlocked.push(achievement);
    }
  });

  // Save updated achievements
  await dbService.saveAchievements(userId, currentAchievements);

  return newlyUnlocked;
};
```

**Achievement Notification**:
```tsx
const AchievementUnlockedNotification: React.FC<{ achievement: Achievement }> = ({ achievement }) => (
  <div className="achievement-notification animate-slide-in">
    <div className="achievement-content">
      <div className="achievement-icon text-6xl">{achievement.icon}</div>
      <div className="achievement-text">
        <h3>Achievement Unlocked!</h3>
        <h2>{achievement.name}</h2>
        <p>{achievement.description}</p>
      </div>
    </div>
  </div>
);
```

### Daily Goals

**Interface**:
```typescript
interface DailyGoal {
  type: 'time' | 'pomodoros' | 'sessions';
  target: number;
  current: number;
  completed: boolean;
}

interface GoalSettings {
  enabled: boolean;
  dailyTimeGoal: number; // seconds (default: 2 hours = 7200)
  dailyPomodoroGoal: number; // count (default: 4)
  goalReminderTime?: string; // HH:MM format
}
```

**Goal Tracking**:
```tsx
const GoalProgress: React.FC<{ goal: DailyGoal, theme: string }> = ({ goal, theme }) => {
  const percentage = Math.min((goal.current / goal.target) * 100, 100);

  return (
    <div className="goal-progress">
      <div className="goal-header">
        <span className="goal-type">
          {goal.type === 'time' ? '⏰' : goal.type === 'pomodoros' ? '🍅' : '📝'}
          Daily {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)} Goal
        </span>
        <span className="goal-status">
          {goal.current} / {goal.target}
          {goal.type === 'time' && ` (${formatTime(goal.current)} / ${formatTime(goal.target)})`}
        </span>
      </div>
      <div className="goal-bar">
        <div
          className="goal-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: goal.completed ? '#22c55e' : theme === 'tron' ? '#00f3ff' : '#0ea5e9'
          }}
        />
      </div>
      {goal.completed && (
        <div className="goal-complete-badge">
          ✅ Goal Complete!
        </div>
      )}
    </div>
  );
};
```

---

## Phase 7: File Structure 📁

```
rangerplex-ai/
├── components/
│   ├── StudyClock.tsx                  # NEW - Main clock widget
│   ├── StudyStatsPanel.tsx            # NEW - Stats dashboard
│   ├── ProgressRing.tsx                # NEW - Circular progress indicator
│   ├── WeeklyHeatmap.tsx              # NEW - 7-day study heatmap
│   ├── AchievementNotification.tsx    # NEW - Achievement popup
│   ├── GoalProgress.tsx                # NEW - Daily goal tracker
│   ├── NotesPrompt.tsx                 # NEW - Post-session notes dialog
│   └── SettingsModal.tsx               # MODIFY - Add Study Clock tab
├── hooks/
│   ├── useStudyTimer.ts                # NEW - Core timer logic
│   ├── useStudyStats.ts                # NEW - Stats calculations
│   └── useAchievements.ts              # NEW - Achievement tracking
├── services/
│   ├── studySessionService.ts          # NEW - Session CRUD operations
│   ├── timerNotificationService.ts     # NEW - Alerts & notifications
│   └── dbService.ts                    # MODIFY - Add study session methods
├── types/
│   ├── studySession.ts                 # NEW - Study session interfaces
│   └── types.ts                        # MODIFY - Add StudyClockSettings
├── sounds/
│   ├── chime.mp3                       # NEW - Timer complete sound
│   ├── break-start.mp3                 # NEW - Break notification
│   └── work-start.mp3                  # NEW - Work notification
├── docs/
│   └── STUDY_CLOCK_PLAN.md            # This file
└── rangerplex_server.js                # MODIFY - Add study sessions API
```

---

## Phase 8: Implementation Checklist ✅

### Core Timer (Must-Have)
- [ ] Create StudyClock.tsx component
- [ ] Implement useStudyTimer hook
- [ ] Floating widget with minimize/maximize
- [ ] Play/pause/reset controls
- [ ] Time display (MM:SS format)
- [ ] Theme support (dark/light/tron)
- [ ] Keyboard shortcuts (Space, R, M)

### Pomodoro System (Must-Have)
- [ ] Pomodoro state machine (work/break cycles)
- [ ] Configurable durations (work/short/long break)
- [ ] Auto-start options
- [ ] Session counter (1-4)
- [ ] Circular progress ring
- [ ] Phase indicators (work vs break)

### Notifications (Must-Have)
- [ ] Audio chime on completion
- [ ] Desktop notifications
- [ ] Visual alerts (flash/pulse)
- [ ] Permission request handling
- [ ] Silent mode option

### Session Tracking (Should-Have)
- [ ] Save sessions to IndexedDB
- [ ] Sync to SQLite server
- [ ] Track completion status
- [ ] Subject/topic tagging
- [ ] Session notes
- [ ] Daily stats calculation

### Stats Dashboard (Should-Have)
- [ ] Today's summary (time, pomodoros)
- [ ] Weekly heatmap calendar
- [ ] Study streak calculation
- [ ] Subject breakdown chart
- [ ] Total stats (all-time)

### Integrations (Should-Have)
- [ ] Study Notes integration
- [ ] Ranger Radio auto-control
- [ ] Settings modal tab
- [ ] Cloud sync support
- [ ] Per-user tracking

### Advanced Features (Nice-to-Have)
- [ ] Achievements system
- [ ] Daily goals
- [ ] Goal progress tracking
- [ ] Achievement notifications
- [ ] Voice alerts (ElevenLabs)
- [ ] Export stats (CSV/JSON)
- [ ] Monthly reports

### Testing (Must-Have)
- [ ] Test timer accuracy (1-minute test)
- [ ] Test pause/resume
- [ ] Test reset functionality
- [ ] Test notification permissions
- [ ] Test session saving
- [ ] Test stats calculations
- [ ] Test streak logic
- [ ] Test theme switching
- [ ] Test keyboard shortcuts
- [ ] Test on mobile (touch)

### Documentation (Should-Have)
- [ ] User guide (how to use timer)
- [ ] Keyboard shortcuts reference
- [ ] Pomodoro technique explanation
- [ ] Stats interpretation guide
- [ ] Update main README

---

## Phase 9: Accessibility Checklist ♿

### ADHD-Friendly Features
- [x] **Clear Visual Progress**: Circular ring shows time remaining at a glance
- [x] **Immediate Feedback**: Timer updates every second, no lag
- [x] **Structured Breaks**: Automatic break reminders prevent burnout
- [x] **Session Tracking**: See progress accumulate (dopamine!)
- [x] **"Just 5 More Minutes"**: Extension button for hyperfocus moments
- [x] **Minimal Decisions**: Auto-start options reduce decision fatigue
- [x] **Gamification**: Achievements provide motivation boosts
- [x] **Visual Alerts**: Don't rely solely on audio (might be hyperfocused)

### Dyslexia-Friendly Features
- [x] **Large, Clear Fonts**: Timer display uses 48px+ font size
- [x] **High Contrast**: Strong color contrast for readability
- [x] **Minimal Text**: Icons and numbers over paragraphs
- [x] **Simple Layout**: No cluttered interface
- [x] **OpenDyslexic Font Option**: Special font for numbers (optional setting)
- [x] **Color Coding**: Green = work, Blue = break, Red = paused

### General Accessibility
- [x] **Keyboard Navigation**: Full control without mouse
- [x] **Screen Reader Support**: ARIA labels on all interactive elements
- [x] **Focus Indicators**: Clear visual focus states
- [x] **Touch-Friendly**: Large touch targets (minimum 44px)
- [x] **Reduced Motion Option**: Disable animations if requested
- [x] **No Time Pressure**: Pause anytime, no penalties

---

## Phase 10: Success Metrics 📊

### User Engagement
- [ ] % of users who enable Study Clock
- [ ] Average sessions per day
- [ ] Total study time tracked
- [ ] Most popular timer mode (pomodoro vs countdown)

### Feature Usage
- [ ] Pomodoro completion rate
- [ ] Average work duration
- [ ] Break compliance (% of breaks taken)
- [ ] Stats dashboard views

### Effectiveness Indicators
- [ ] Study streaks maintained
- [ ] Daily goal achievement rate
- [ ] Subject diversity (breadth of learning)
- [ ] Session completion rate (vs interrupted)

### Accessibility Impact
- [ ] Usage by students with ADHD/dyslexia
- [ ] Feedback from accessibility-focused users
- [ ] Average session length (focus sustainability)
- [ ] Break adherence rate

---

## Estimated Timeline ⏱️

### Minimum Viable Product (MVP)
- **Phase 1 (Core Timer)**: 6-8 hours
- **Phase 2 (Pomodoro)**: 4-6 hours
- **Phase 3 (Notifications)**: 2-3 hours

**MVP Total**: ~12-17 hours (2 solid coding days!)

### Full Featured Version
- **MVP**: 12-17 hours
- **Phase 3 (Session Tracking)**: 5-7 hours
- **Phase 4 (Stats Dashboard)**: 6-8 hours
- **Phase 5 (Integration)**: 4-6 hours

**Full Version Total**: ~27-38 hours (4-5 coding days)

### Complete Package (All Features)
- **Full Version**: 27-38 hours
- **Phase 6 (Advanced/Gamification)**: 8-10 hours
- **Polish & Testing**: 4-6 hours

**Complete Total**: ~39-54 hours (5-7 coding days)

---

## Priority Recommendation 🎯

### Must-Have (Ship with MVP)
1. ✅ Pomodoro timer (25/5/15 minutes)
2. ✅ Play/pause/reset controls
3. ✅ Circular progress ring
4. ✅ Audio chime on completion
5. ✅ Floating widget (minimize/maximize)
6. ✅ Theme support (dark/light/tron)
7. ✅ Basic session tracking

### Should-Have (Add Soon After)
1. ✅ Desktop notifications
2. ✅ Study stats dashboard
3. ✅ Weekly heatmap
4. ✅ Study streak tracking
5. ✅ Study Notes integration
6. ✅ Keyboard shortcuts
7. ✅ Subject tagging

### Nice-to-Have (Future Updates)
1. Achievements system
2. Daily goals
3. Voice alerts (ElevenLabs)
4. Ranger Radio integration
5. Export stats
6. Monthly reports
7. Custom timer presets

### Dream Features (Long-Term)
1. Collaborative study sessions (real-time)
2. Study groups/challenges
3. Leaderboards (optional, privacy-respecting)
4. AI study recommendations
5. Focus music generation
6. Binaural beats integration

---

## Integration Decision Matrix 🤔

| Approach | Visibility | Effort | User Discovery | Recommendation |
|----------|-----------|--------|----------------|----------------|
| Floating Widget | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Best for MVP** |
| Main Tab | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Good alternative |
| Settings-Only | ⭐⭐ | ⭐⭐ | ⭐⭐ | Not recommended |
| **Hybrid (Widget + Stats Tab)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **BEST OVERALL** 🎖️ |

**Recommendation**: Use **Hybrid Approach**
- Floating widget for timer (always accessible during study)
- Dedicated "Stats" tab or section for analytics
- Settings tab for configuration
- Best user experience + comprehensive feature set

---

## UI/UX Design (ASCII Mockups) 🎨

### Minimized Widget
```
┌─────────────────┐
│ 🕐 24:37    ⬆️  │
│ ▶️ ⏸️ 🔄        │
└─────────────────┘
```

### Maximized Widget
```
┌───────────────────────────────┐
│ 🕐 Study Clock           ❌ ⬇️ │
├───────────────────────────────┤
│                               │
│       ⭕ 24:37                │
│     [Progress Ring]           │
│                               │
│   🍅 Pomodoro 2/4             │
│   Session: Work Phase         │
│                               │
│   ▶️  ⏸️  🔄  ⏭️              │
│   Play Pause Reset Skip       │
│                               │
│   Today: 1h 23m  🍅 3         │
│   Streak: 7 days ⚔️           │
│                               │
└───────────────────────────────┘
```

### Stats Dashboard
```
┌────────────────────────────────────────────┐
│ 📊 Study Statistics                        │
├────────────────────────────────────────────┤
│                                            │
│ Today's Summary                            │
│ ┌──────────────────────────────────────┐  │
│ │  ⭕ 2h 45m studied                   │  │
│ │  🍅 6 pomodoros completed            │  │
│ │  ⚔️ 12-day streak                    │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ This Week                                  │
│ ┌─┬─┬─┬─┬─┬─┬─┐                           │
│ │░│▓│▓│█│▓│░│ │  Mon-Sun heatmap         │
│ └─┴─┴─┴─┴─┴─┴─┘                           │
│                                            │
│ Top Subjects                               │
│ ┌──────────────────────────────────────┐  │
│ │ Math ████████░░ 45%                  │  │
│ │ Code █████░░░░░ 30%                  │  │
│ │ Lang ███░░░░░░░ 25%                  │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Achievements 🏆                            │
│ ✅ 🍅 First Pomodoro                      │
│ ✅ ⚔️ 7-Day Streak                        │
│ 🔒 💯 Century Club (6/100)                │
│                                            │
└────────────────────────────────────────────┘
```

---

## Safety & Performance 🔒

### Memory Management
- Clear interval on component unmount
- Limit stored sessions (keep last 90 days)
- Compress old session data
- Periodic cleanup of completed sessions

### Data Storage
- IndexedDB: Current + last 30 days
- Server: All historical data
- Automatic archival of old sessions
- Option to export before deletion

### Performance Optimization
- Use `requestAnimationFrame` for smooth progress ring
- Debounce stats calculations
- Lazy load stats dashboard
- Virtual scrolling for long session lists

### Privacy & Security
- All data stored locally by default
- Cloud sync opt-in only
- No telemetry without consent
- Export/delete all data option

---

## Next Steps 🎯

**Immediate Actions**:
1. ✅ Review this plan with David
2. Get approval on:
   - Integration approach (floating widget + stats tab?)
   - MVP feature priority
   - Timeline expectations
   - Gamification (yes/no?)
3. Create component file structure
4. Start Phase 1 implementation

**Questions to Answer**:
- Floating widget location (bottom-left like Radio?)
- Stats in dedicated tab or modal?
- Daily goals enabled by default?
- Achievements system in MVP or later?
- Voice alerts priority (requires ElevenLabs)?
- Multi-user support priority?

**Ready to Start?**
Once approved, can begin building:
1. Core timer component (6-8 hours)
2. Pomodoro system (4-6 hours)
3. Notifications (2-3 hours)
4. Session tracking (5-7 hours)

**MVP delivery: 17-24 hours of focused work (3-4 coding days)!**

---

🎖️ **Rangers lead the way!** 🕐

Let's build this and help students develop unbreakable study habits! This is gonna be TRANSFORMATIVE for people with ADHD and dyslexia!

**Disabilities → Superpowers!** 💥

**Focus, Track, Transform!** 📊⏱️🎯

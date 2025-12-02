// Console Capture Service
// Captures console.log, console.warn, console.error for in-app viewing

export interface ConsoleEntry {
  id: string;
  timestamp: Date;
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  data?: any;
}

class ConsoleCaptureService {
  private entries: ConsoleEntry[] = [];
  private maxEntries = 500;
  private listeners: Set<(entries: ConsoleEntry[]) => void> = new Set();
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
    info: typeof console.info;
    debug: typeof console.debug;
  };
  private isCapturing = false;

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
    };
  }

  start() {
    if (this.isCapturing) return;
    this.isCapturing = true;

    // Override console methods
    console.log = (...args) => {
      this.capture('log', args);
      this.originalConsole.log(...args);
    };

    console.warn = (...args) => {
      this.capture('warn', args);
      this.originalConsole.warn(...args);
    };

    console.error = (...args) => {
      this.capture('error', args);
      this.originalConsole.error(...args);
    };

    console.info = (...args) => {
      this.capture('info', args);
      this.originalConsole.info(...args);
    };

    console.debug = (...args) => {
      this.capture('debug', args);
      this.originalConsole.debug(...args);
    };

    this.originalConsole.log('📋 Console capture started');
  }

  stop() {
    if (!this.isCapturing) return;
    this.isCapturing = false;

    // Restore original console methods
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;

    console.log('📋 Console capture stopped');
  }

  private capture(type: ConsoleEntry['type'], args: any[]) {
    const message = args
      .map(arg => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      })
      .join(' ');

    const entry: ConsoleEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      message,
      data: args.length > 1 ? args : args[0],
    };

    this.entries.push(entry);

    // Trim if over max
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    // Notify listeners
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.entries]));
  }

  subscribe(listener: (entries: ConsoleEntry[]) => void): () => void {
    this.listeners.add(listener);
    // Send current entries immediately
    listener([...this.entries]);
    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }

  getEntries(): ConsoleEntry[] {
    return [...this.entries];
  }

  clear() {
    this.entries = [];
    this.notifyListeners();
  }

  getEntriesAsText(): string {
    return this.entries
      .map(entry => {
        const time = entry.timestamp.toISOString();
        const type = entry.type.toUpperCase().padEnd(5);
        return `[${time}] [${type}] ${entry.message}`;
      })
      .join('\n');
  }

  getEntriesAsJSON(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  downloadAsText(filename?: string) {
    const text = this.getEntriesAsText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `rangerplex-console-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadAsJSON(filename?: string) {
    const json = this.getEntriesAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `rangerplex-console-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async copyToClipboard(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(this.getEntriesAsText());
      return true;
    } catch (err) {
      this.originalConsole.error('Failed to copy to clipboard:', err);
      return false;
    }
  }

  setMaxEntries(max: number) {
    this.maxEntries = max;
    if (this.entries.length > max) {
      this.entries = this.entries.slice(-max);
      this.notifyListeners();
    }
  }
}

// Singleton instance
export const consoleCapture = new ConsoleCaptureService();

// Auto-start in development or when enabled
if (typeof window !== 'undefined') {
  // Start capturing after a small delay to avoid capturing initial noise
  setTimeout(() => {
    consoleCapture.start();
  }, 1000);
}

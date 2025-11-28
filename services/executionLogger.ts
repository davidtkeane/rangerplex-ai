import { v4 as uuidv4 } from 'uuid';

export interface ExecutionLog {
    id: string;
    command: string;
    cwd: string;
    user: string;
    timestamp: number;
    exitCode: number;
    duration: number;
    source: 'alias' | 'allowlist' | 'manual';
    stdout?: string;
    stderr?: string;
}

class ExecutionLogger {
    private logs: ExecutionLog[] = [];
    private maxLogs = 100;
    private db: any;

    setDb(db: any): void {
        this.db = db;
    }

    async log(execution: Omit<ExecutionLog, 'id'>): Promise<void> {
        const log: ExecutionLog = {
            id: uuidv4(),
            ...execution,
        };

        this.logs.unshift(log);

        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        if (this.db) {
            try {
                this.db.prepare(
                    `INSERT OR REPLACE INTO execution_logs (id, command, cwd, user, timestamp, exit_code, duration, source, stdout, stderr)
                     VALUES (@id, @command, @cwd, @user, @timestamp, @exitCode, @duration, @source, @stdout, @stderr)`
                ).run({
                    id: log.id,
                    command: log.command,
                    cwd: log.cwd,
                    user: log.user,
                    timestamp: log.timestamp,
                    exitCode: log.exitCode,
                    duration: log.duration,
                    source: log.source,
                    stdout: log.stdout ?? null,
                    stderr: log.stderr ?? null,
                });
            } catch (error) {
                console.error('[AUDIT] Failed to persist execution log:', error);
            }
        }

        console.log(`[AUDIT] ${log.command} (exit: ${log.exitCode}, duration: ${log.duration}ms)`);
    }

    async getRecentLogs(limit: number = 10): Promise<ExecutionLog[]> {
        if (this.db) {
            try {
                const rows = this.db
                    .prepare(
                        `SELECT id, command, cwd, user, timestamp, exit_code as exitCode, duration, source, stdout, stderr
                         FROM execution_logs
                         ORDER BY timestamp DESC
                         LIMIT ?`
                    )
                    .all(limit);
                return rows as ExecutionLog[];
            } catch (error) {
                console.error('[AUDIT] Failed to load logs from database:', error);
            }
        }

        return this.logs.slice(0, limit);
    }

    async clearLogs(): Promise<void> {
        this.logs = [];
        if (this.db) {
            try {
                this.db.prepare('DELETE FROM execution_logs').run();
            } catch (error) {
                console.error('[AUDIT] Failed to clear execution logs:', error);
            }
        }
    }

    async getLogById(id: string): Promise<ExecutionLog | null> {
        if (this.db) {
            try {
                const row = this.db
                    .prepare(
                        `SELECT id, command, cwd, user, timestamp, exit_code as exitCode, duration, source, stdout, stderr
                         FROM execution_logs WHERE id = ?`
                    )
                    .get(id);
                return (row as ExecutionLog) ?? null;
            } catch (error) {
                console.error('[AUDIT] Failed to fetch execution log:', error);
            }
        }

        return this.logs.find(entry => entry.id === id) ?? null;
    }
}

export const executionLogger = new ExecutionLogger();

export { ExecutionLogger };

import { v4 as uuidv4 } from 'uuid';

class ExecutionLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 100;
        this.db = null;
    }

    setDb(db) {
        this.db = db;
    }

    async log(execution) {
        const log = {
            id: uuidv4(),
            ...execution,
        };

        this.logs.unshift(log);

        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        if (this.db) {
            try {
                this.db
                    .prepare(
                        `INSERT OR REPLACE INTO execution_logs (id, command, cwd, user, timestamp, exit_code, duration, source, stdout, stderr)
                         VALUES (@id, @command, @cwd, @user, @timestamp, @exitCode, @duration, @source, @stdout, @stderr)`
                    )
                    .run({
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

    async getRecentLogs(limit = 10) {
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
                return rows;
            } catch (error) {
                console.error('[AUDIT] Failed to load logs from database:', error);
            }
        }

        return this.logs.slice(0, limit);
    }

    async clearLogs() {
        this.logs = [];
        if (this.db) {
            try {
                this.db.prepare('DELETE FROM execution_logs').run();
            } catch (error) {
                console.error('[AUDIT] Failed to clear execution logs:', error);
            }
        }
    }

    async getLogById(id) {
        if (this.db) {
            try {
                const row = this.db
                    .prepare(
                        `SELECT id, command, cwd, user, timestamp, exit_code as exitCode, duration, source, stdout, stderr
                         FROM execution_logs WHERE id = ?`
                    )
                    .get(id);
                return row ?? null;
            } catch (error) {
                console.error('[AUDIT] Failed to fetch execution log:', error);
            }
        }

        return this.logs.find(entry => entry.id === id) ?? null;
    }
}

export const executionLogger = new ExecutionLogger();
export { ExecutionLogger };

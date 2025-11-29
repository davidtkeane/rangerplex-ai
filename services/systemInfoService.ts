// System Information Service
// Provides comprehensive diagnostics for RangerPlex

export interface SystemInfo {
    version: string;
    uptime: number;
    services: ServiceStatus[];
    errors: ErrorLog[];
    performance: PerformanceMetrics;
    database: DatabaseStatus;
}

export interface ServiceStatus {
    name: string;
    status: 'running' | 'stopped' | 'error';
    port?: number;
    uptime?: number;
    lastError?: string;
}

export interface ErrorLog {
    timestamp: number;
    level: 'error' | 'warning' | 'info';
    service: string;
    message: string;
    stack?: string;
}

export interface PerformanceMetrics {
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
    requestsPerMinute: number;
}

export interface DatabaseStatus {
    connected: boolean;
    size: number;
    chatCount: number;
    lastBackup?: number;
}

class SystemInfoService {
    private errorLogs: ErrorLog[] = [];
    private maxLogs = 100;
    private startTime = Date.now();

    // Log an error
    logError(service: string, message: string, level: 'error' | 'warning' | 'info' = 'error', stack?: string) {
        const log: ErrorLog = {
            timestamp: Date.now(),
            level,
            service,
            message,
            stack
        };

        this.errorLogs.unshift(log);

        // Keep only last 100 logs
        if (this.errorLogs.length > this.maxLogs) {
            this.errorLogs = this.errorLogs.slice(0, this.maxLogs);
        }

        // Also log to console
        const method: 'error' | 'warn' | 'info' = level === 'warning' ? 'warn' : level;
        (console as Console)[method](`[${service}] ${message}`, stack || '');
    }

    // Get recent errors
    getRecentErrors(count = 10): ErrorLog[] {
        return this.errorLogs.slice(0, count);
    }

    // Clear error logs
    clearErrors() {
        this.errorLogs = [];
    }

    // Check service status
    async checkServiceStatus(name: string, url: string, port?: number): Promise<ServiceStatus> {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return {
                name,
                status: response.ok ? 'running' : 'error',
                port,
                uptime: Date.now() - this.startTime
            };
        } catch (error) {
            return {
                name,
                status: 'stopped',
                port,
                lastError: error instanceof Error ? error.message : String(error)
            };
        }
    }

    // Get comprehensive system info
    async getSystemInfo(): Promise<SystemInfo> {
        const services: ServiceStatus[] = [];

        // Check proxy server
        services.push(await this.checkServiceStatus('Proxy Server', 'http://localhost:3000/health', 3000));

        // Check Vite dev server
        services.push(await this.checkServiceStatus('Vite Dev Server', 'http://localhost:5173', 5173));

        // Check WordPress (if running)
        try {
            const wpStatus = await fetch('http://localhost:3000/api/wordpress/status');
            const wpData = await wpStatus.json();
            services.push({
                name: 'WordPress',
                status: wpData.running ? 'running' : 'stopped',
                port: 8080
            });
        } catch {
            services.push({
                name: 'WordPress',
                status: 'stopped',
                port: 8080
            });
        }

        // Check RangerPlexChain Blockchain
        try {
            const bcStatus = await fetch('http://localhost:3000/api/rangerblock/status');
            const bcData = await bcStatus.json();
            services.push({
                name: 'RangerPlexChain',
                status: bcData.running ? 'running' : 'stopped',
                port: 5555
            });
        } catch {
            services.push({
                name: 'RangerPlexChain',
                status: 'stopped',
                port: 5555
            });
        }

        // Get database status
        let dbStatus: DatabaseStatus = {
            connected: false,
            size: 0,
            chatCount: 0
        };

        try {
            const { dbService } = await import('./dbService');
            await dbService.init();
            const chats = await dbService.getAllChats();

            dbStatus = {
                connected: true,
                size: 0, // Would need to calculate actual DB size
                chatCount: chats.length
            };
        } catch (error) {
            this.logError('Database', 'Failed to connect to database', 'error', error instanceof Error ? error.stack : undefined);
        }

        // Get performance metrics
        const metrics: PerformanceMetrics = {
            memoryUsage: typeof performance !== 'undefined' ? (performance as any).memory?.usedJSHeapSize || 0 : 0,
            cpuUsage: 0, // Browser doesn't expose CPU usage
            activeConnections: 0,
            requestsPerMinute: 0
        };

        return {
            version: '2.11.1',
            uptime: Date.now() - this.startTime,
            services,
            errors: this.getRecentErrors(10),
            performance: metrics,
            database: dbStatus
        };
    }

    // Format uptime
    formatUptime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    // Generate system report
    async generateReport(): Promise<string> {
        const info = await this.getSystemInfo();

        let report = `# 🎖️ RangerPlex System Report\n\n`;
        report += `**Version**: ${info.version}\n`;
        report += `**Uptime**: ${this.formatUptime(info.uptime)}\n\n`;

        report += `## 🔧 Services\n\n`;
        for (const service of info.services) {
            const icon = service.status === 'running' ? '✅' : service.status === 'stopped' ? '⏸️' : '❌';
            report += `${icon} **${service.name}**`;
            if (service.port) report += ` (Port ${service.port})`;
            report += ` - ${service.status.toUpperCase()}\n`;
            if (service.lastError) report += `   └─ Error: ${service.lastError}\n`;
        }

        report += `\n## 💾 Database\n\n`;
        report += `- **Status**: ${info.database.connected ? '✅ Connected' : '❌ Disconnected'}\n`;
        report += `- **Chat Sessions**: ${info.database.chatCount}\n`;

        if (info.errors.length > 0) {
            report += `\n## ⚠️ Recent Errors (${info.errors.length})\n\n`;
            for (const error of info.errors.slice(0, 5)) {
                const icon = error.level === 'error' ? '❌' : error.level === 'warning' ? '⚠️' : 'ℹ️';
                const time = new Date(error.timestamp).toLocaleTimeString();
                report += `${icon} **[${time}] ${error.service}**: ${error.message}\n`;
            }
        } else {
            report += `\n## ✅ No Recent Errors\n\n`;
            report += `System is running smoothly!\n`;
        }

        report += `\n## 📊 Performance\n\n`;
        report += `- **Memory Usage**: ${(info.performance.memoryUsage / 1024 / 1024).toFixed(2)} MB\n`;

        return report;
    }
}

export const systemInfoService = new SystemInfoService();

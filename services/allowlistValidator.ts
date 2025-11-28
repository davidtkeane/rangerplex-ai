export interface ValidationResult {
    valid: boolean;
    reason?: string;
}

class AllowlistValidator {
    private allowlist: string[] = [
        // Git (read-only)
        'git status',
        'git diff',
        'git log',
        'git show',
        'git branch',
        'git fetch',

        // File inspection (POSIX)
        'ls',
        'pwd',
        'cat',
        'head',
        'tail',
        'rg',
        'find',

        // File inspection (Windows/PowerShell)
        'dir',
        'powershell -Command Get-ChildItem',
        'powershell -Command Get-Item',
        'powershell -Command Get-Content',

        // Scripts
        'python3',
        'python',
        'npm test',
        'npm run',
        'node',
        'bun',

        // Networking / small utilities
        'curl',
        'tty-clock',
        'powershell -Command Invoke-RestMethod',

        // System info (POSIX)
        'whoami',
        'uname',
        'df',
        'date',
        'uptime',

        // System info (Windows/PowerShell)
        'powershell -Command Get-ComputerInfo',
        'powershell -Command Get-Process',
        'powershell -Command Get-WmiObject',
    ];

    private blacklist: string[] = [
        'rm -rf',
        'dd',
        'mkfs',
        'sudo',
        'chmod',
        'chown',
        'apt',
        'brew install',
        'npm install'
    ];

    isAllowed(command: string): boolean {
        const normalized = command.trim().toLowerCase();
        const withoutEnvPrefix = normalized.replace(/^(?:[a-z_][a-z0-9_]*=(?:"[^"]*"|'[^']*'|\S+)\s*)+/i, '');

        if (this.blacklist.some(blocked => normalized.includes(blocked))) {
            return false;
        }

        return this.allowlist.some(allowed => withoutEnvPrefix.startsWith(allowed.toLowerCase()));
    }

    validateCommand(command: string): ValidationResult {
        if (/[|><&;`$()]/.test(command)) {
            return {
                valid: false,
                reason: 'Command contains forbidden characters (pipes, redirects, subshells, or chaining)'
            };
        }

        if (!this.isAllowed(command)) {
            return {
                valid: false,
                reason: 'Command not in allowlist. Add as alias if needed.'
            };
        }

        return { valid: true };
    }

    getAllowlist(): string[] {
        return [...this.allowlist];
    }

    addToAllowlist(pattern: string): void {
        if (!this.allowlist.includes(pattern)) {
            this.allowlist.push(pattern);
        }
    }
}

export const allowlistValidator = new AllowlistValidator();

export { AllowlistValidator };

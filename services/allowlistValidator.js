class AllowlistValidator {
    constructor() {
        this.allowlist = [
            'git status',
            'git diff',
            'git log',
            'git show',
            'git branch',
            'git fetch',
            'ls',
            'pwd',
            'cat',
            'head',
            'tail',
            'rg',
            'find',
            'dir',
            'powershell -Command Get-ChildItem',
            'powershell -Command Get-Item',
            'powershell -Command Get-Content',
            'python3',
            'python',
            'npm test',
            'npm run',
            'node',
            'bun',
            'curl',
            'tty-clock',
            'powershell -Command Invoke-RestMethod',
            'whoami',
            'uname',
            'df',
            'date',
            'uptime',
            'powershell -Command Get-ComputerInfo',
            'powershell -Command Get-Process',
            'powershell -Command Get-WmiObject',
        ];

        this.blacklist = [
            'rm -rf',
            'dd',
            'mkfs',
            'sudo',
            'chmod',
            'chown',
            'apt',
            'brew install',
            'npm install',
        ];
    }

    isAllowed(command) {
        const normalized = command.trim().toLowerCase();
        const withoutEnvPrefix = normalized.replace(/^(?:[a-z_][a-z0-9_]*=(?:"[^"]*"|'[^']*'|\S+)\s*)+/i, '');

        if (this.blacklist.some(blocked => normalized.includes(blocked))) {
            return false;
        }

        return this.allowlist.some(allowed => withoutEnvPrefix.startsWith(allowed.toLowerCase()));
    }

    validateCommand(command) {
        if (/[|;`><]/.test(command) || /&&/.test(command)) {
            return {
                valid: false,
                reason: 'Command contains forbidden characters (pipes, redirects, subshells, or chaining)',
            };
        }

        if (!this.isAllowed(command)) {
            return {
                valid: false,
                reason: 'Command not in allowlist. Add as alias if needed.',
            };
        }

        return { valid: true };
    }

    getAllowlist() {
        return [...this.allowlist];
    }

    addToAllowlist(pattern) {
        if (!this.allowlist.includes(pattern)) {
            this.allowlist.push(pattern);
        }
    }
}

export const allowlistValidator = new AllowlistValidator();
export { AllowlistValidator };

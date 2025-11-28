import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

class CommandExecutor {
    constructor() {
        this.runningProcesses = new Map();
    }

    async execute(command, cwd = process.cwd(), timeout = 60000) {
        const startTime = Date.now();
        const processId = uuidv4();

        return new Promise((resolve, reject) => {
            const tokens = this.tokenize(command);
            if (tokens.length === 0) {
                reject(new Error('No command specified'));
                return;
            }

            const env = { ...process.env, PATH: process.env.PATH };
            let index = 0;

            while (index < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=.*/.test(tokens[index])) {
                const [key, ...rest] = tokens[index].split('=');
                const value = rest.join('=');
                env[key] = this.stripWrappingQuotes(value);
                index += 1;
            }

            const cmd = tokens[index];
            const args = tokens.slice(index + 1);

            if (!cmd) {
                reject(new Error('No command specified after environment assignments'));
                return;
            }

            const proc = spawn(cmd, args, {
                cwd,
                shell: false,
                env,
            });

            this.runningProcesses.set(processId, proc);

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', data => {
                stdout += data.toString();
            });

            proc.stderr.on('data', data => {
                stderr += data.toString();
            });

            const timeoutId = setTimeout(() => {
                proc.kill('SIGTERM');
                setTimeout(() => proc.kill('SIGKILL'), 5000);
            }, timeout);

            proc.on('close', code => {
                clearTimeout(timeoutId);
                this.runningProcesses.delete(processId);

                const result = {
                    success: code === 0,
                    stdout,
                    stderr,
                    exitCode: code ?? 0,
                    executionTime: Date.now() - startTime,
                    command,
                    cwd,
                    timestamp: startTime,
                    processId,
                };

                resolve(result);
            });

            proc.on('error', error => {
                clearTimeout(timeoutId);
                this.runningProcesses.delete(processId);
                reject(error);
            });
        });
    }

    tokenize(input) {
        const matches = input.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
        return matches.map(token => {
            if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
                return token.slice(1, -1);
            }
            return token;
        });
    }

    stripWrappingQuotes(value) {
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }
        return value;
    }

    async cancel(processId) {
        const proc = this.runningProcesses.get(processId);
        if (proc) {
            proc.kill('SIGINT');
            setTimeout(() => proc.kill('SIGKILL'), 5000);
        }
    }
}

export const commandExecutor = new CommandExecutor();
export { CommandExecutor };

import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

export interface ExecutionResult {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
    executionTime: number;
    command: string;
    cwd: string;
    timestamp: number;
    processId: string;
}

class CommandExecutor {
    private runningProcesses: Map<string, ChildProcessWithoutNullStreams> = new Map();

    async execute(command: string, cwd: string = process.cwd(), timeout: number = 60000): Promise<ExecutionResult> {
        const startTime = Date.now();
        const processId = uuidv4();

        return new Promise((resolve, reject) => {
            const tokens = this.tokenize(command);
            if (tokens.length === 0) {
                reject(new Error('No command specified'));
                return;
            }

            const env = { ...process.env, PATH: process.env.PATH } as NodeJS.ProcessEnv;
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

                const result: ExecutionResult = {
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

    private tokenize(input: string): string[] {
        const matches = input.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
        return matches.map(token => {
            if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
                return token.slice(1, -1);
            }
            return token;
        });
    }

    private stripWrappingQuotes(value: string): string {
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }
        return value;
    }

    async cancel(processId: string): Promise<void> {
        const proc = this.runningProcesses.get(processId);
        if (proc) {
            proc.kill('SIGINT');
            setTimeout(() => proc.kill('SIGKILL'), 5000);
        }
    }
}

export const commandExecutor = new CommandExecutor();

export { CommandExecutor };

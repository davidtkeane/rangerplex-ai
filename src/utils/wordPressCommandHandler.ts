/**
 * WordPress Command Handler
 * Handles /wordpress and /blog commands in RangerPlex
 */

import { wordPressAPI } from '../services/wordPressAPI';

export interface CommandResult {
    success: boolean;
    message: string;
    action?: 'open-tab' | 'none';
    url?: string;
}

export class WordPressCommandHandler {
    /**
     * Handle /wordpress or /blog commands
     */
    static async handle(command: string, args: string[]): Promise<CommandResult> {
        const subcommand = args[0]?.toLowerCase() || 'open';

        switch (subcommand) {
            case 'open':
            case 'start':
                return await this.handleOpen();

            case 'stop':
                return await this.handleStop();

            case 'status':
                return await this.handleStatus();

            case 'publish':
                return await this.handlePublish(args[1], args[2]);

            case 'help':
                return this.handleHelp();

            default:
                // If no subcommand, treat as 'open'
                return await this.handleOpen();
        }
    }

    /**
     * Open WordPress (start if needed, then open in RangerPlex tab)
     */
    private static async handleOpen(): Promise<CommandResult> {
        try {
            // Check if WordPress is running
            const statusResult = await wordPressAPI.getStatus();

            if (statusResult.status !== 'running') {
                // Start WordPress
                const startResult = await wordPressAPI.start();

                if (!startResult.success) {
                    return {
                        success: false,
                        message: `❌ Failed to start WordPress: ${startResult.message}`,
                    };
                }

                // Wait for WordPress to be ready
                await this.waitForWordPress();
            }

            // Open in RangerPlex browser tab
            return {
                success: true,
                message: '✅ Opening WordPress in new tab...',
                action: 'open-tab',
                url: 'http://localhost:8080',
            };
        } catch (error: any) {
            return {
                success: false,
                message: `❌ Error: ${error.message}`,
            };
        }
    }

    /**
     * Stop WordPress
     */
    private static async handleStop(): Promise<CommandResult> {
        try {
            const result = await wordPressAPI.stop();

            return {
                success: result.success,
                message: result.message,
            };
        } catch (error: any) {
            return {
                success: false,
                message: `❌ Error: ${error.message}`,
            };
        }
    }

    /**
     * Check WordPress status
     */
    private static async handleStatus(): Promise<CommandResult> {
        try {
            const result = await wordPressAPI.getStatus();

            const statusEmoji = result.status === 'running' ? '🟢' : '🔴';
            const message = `${statusEmoji} WordPress Status: ${result.status.toUpperCase()}`;

            return {
                success: true,
                message,
            };
        } catch (error: any) {
            return {
                success: false,
                message: `❌ Error: ${error.message}`,
            };
        }
    }

    /**
     * Publish a note to WordPress
     */
    private static async handlePublish(filePath?: string, title?: string): Promise<CommandResult> {
        if (!filePath) {
            return {
                success: false,
                message: '❌ Please provide a file path\nUsage: /wordpress publish <file> [title]',
            };
        }

        try {
            const result = await wordPressAPI.publishNote(filePath, title);

            return {
                success: result.success,
                message: result.message,
            };
        } catch (error: any) {
            return {
                success: false,
                message: `❌ Error: ${error.message}`,
            };
        }
    }

    /**
     * Show help
     */
    private static handleHelp(): CommandResult {
        const helpText = `
📝 WordPress Commands

/wordpress              - Open WordPress (starts if needed)
/wordpress start        - Start Docker WordPress
/wordpress stop         - Stop Docker WordPress
/wordpress status       - Check WordPress status
/wordpress publish <file> [title] - Publish Markdown file
/wordpress help         - Show this help

Aliases:
/blog <command>         - Same as /wordpress <command>

Examples:
  /wordpress
  /wordpress start
  /wordpress publish ./my-note.md "My Post"
  /blog status
    `.trim();

        return {
            success: true,
            message: helpText,
        };
    }

    /**
     * Wait for WordPress to be ready
     */
    private static async waitForWordPress(maxAttempts: number = 30): Promise<void> {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await fetch('http://localhost:8080', { method: 'HEAD' });
                if (response.ok) {
                    return;
                }
            } catch {
                // Not ready yet
            }

            // Wait 1 second before next attempt
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        throw new Error('WordPress did not start in time');
    }
}

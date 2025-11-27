/**
 * WordPress Command Service
 * Handles WordPress-related commands and operations
 * 
 * Commands:
 * - /blog start - Start Docker WordPress
 * - /blog stop - Stop Docker WordPress
 * - /blog status - Check WordPress status
 * - /blog publish <file> - Publish Markdown file to WordPress
 * - /wordpress scan - Scan for Local Sites
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface WordPressCommandResult {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}

export class WordPressCommandService {
    private dockerComposeFile = 'docker-compose.wordpress.yml';

    /**
     * Execute WordPress command
     */
    async executeCommand(command: string, args: string[]): Promise<WordPressCommandResult> {
        const subcommand = args[0]?.toLowerCase();

        switch (subcommand) {
            case 'start':
                return await this.startWordPress();

            case 'stop':
                return await this.stopWordPress();

            case 'status':
                return await this.getStatus();

            case 'publish':
                return await this.publishNote(args[1], args[2]);

            case 'scan':
                return await this.scanLocalSites();

            case 'help':
                return this.getHelp();

            default:
                return {
                    success: false,
                    message: 'Unknown WordPress command. Use /blog help for available commands.',
                };
        }
    }

    /**
     * Start Docker WordPress stack
     */
    private async startWordPress(): Promise<WordPressCommandResult> {
        try {
            console.log('🐳 Starting WordPress Docker stack...');

            const { stdout, stderr } = await execAsync(
                `docker-compose -f ${this.dockerComposeFile} up -d`
            );

            if (stderr && !stderr.includes('Creating') && !stderr.includes('Starting')) {
                return {
                    success: false,
                    message: 'Failed to start WordPress',
                    error: stderr,
                };
            }

            return {
                success: true,
                message: '✅ WordPress started successfully!\n📝 Access at: http://localhost:8080',
                data: { url: 'http://localhost:8080', output: stdout },
            };
        } catch (error: any) {
            return {
                success: false,
                message: '❌ Failed to start WordPress',
                error: error.message,
            };
        }
    }

    /**
     * Stop Docker WordPress stack
     */
    private async stopWordPress(): Promise<WordPressCommandResult> {
        try {
            console.log('🐳 Stopping WordPress Docker stack...');

            const { stdout } = await execAsync(
                `docker-compose -f ${this.dockerComposeFile} down`
            );

            return {
                success: true,
                message: '✅ WordPress stopped successfully',
                data: { output: stdout },
            };
        } catch (error: any) {
            return {
                success: false,
                message: '❌ Failed to stop WordPress',
                error: error.message,
            };
        }
    }

    /**
     * Get WordPress status
     */
    private async getStatus(): Promise<WordPressCommandResult> {
        try {
            const { stdout } = await execAsync(
                `docker-compose -f ${this.dockerComposeFile} ps`
            );

            const isRunning = stdout.includes('Up') || stdout.includes('running');
            const status = isRunning ? 'running' : 'stopped';

            return {
                success: true,
                message: `📊 WordPress Status: ${status.toUpperCase()}`,
                data: { status, output: stdout },
            };
        } catch (error: any) {
            return {
                success: true,
                message: '📊 WordPress Status: STOPPED',
                data: { status: 'stopped' },
            };
        }
    }

    /**
     * Publish Markdown note to WordPress
     */
    private async publishNote(filePath?: string, title?: string): Promise<WordPressCommandResult> {
        if (!filePath) {
            return {
                success: false,
                message: '❌ Please provide a file path\nUsage: /blog publish <file> [title]',
            };
        }

        try {
            // Read the Markdown file
            const fullPath = path.resolve(filePath);
            const content = await fs.readFile(fullPath, 'utf-8');

            // Extract title from filename if not provided
            const postTitle = title || path.basename(filePath, path.extname(filePath))
                .replace(/-/g, ' ')
                .replace(/_/g, ' ');

            // Convert Markdown to HTML (basic conversion)
            const htmlContent = this.markdownToHtml(content);

            // Create WordPress post using WP-CLI
            const wpCommand = `docker exec rangerplex-wordpress wp post create \\
        --post_title="${postTitle}" \\
        --post_content="${htmlContent.replace(/"/g, '\\"')}" \\
        --post_status=draft \\
        --allow-root`;

            const { stdout } = await execAsync(wpCommand);

            return {
                success: true,
                message: `✅ Published "${postTitle}" to WordPress as draft\n📝 Edit at: http://localhost:8080/wp-admin`,
                data: { title: postTitle, output: stdout },
            };
        } catch (error: any) {
            return {
                success: false,
                message: `❌ Failed to publish note: ${error.message}`,
                error: error.message,
            };
        }
    }

    /**
     * Scan for Local by Flywheel sites
     */
    private async scanLocalSites(): Promise<WordPressCommandResult> {
        try {
            const os = require('os');
            const localSitesPath = path.join(os.homedir(), 'Local Sites');

            // Check if directory exists
            try {
                await fs.access(localSitesPath);
            } catch {
                return {
                    success: true,
                    message: '📁 No Local Sites directory found',
                    data: { sites: [] },
                };
            }

            const entries = await fs.readdir(localSitesPath, { withFileTypes: true });
            const sites = [];

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const sitePath = path.join(localSitesPath, entry.name);
                    const configPath = path.join(sitePath, 'conf', 'local-site.json');

                    try {
                        const configData = await fs.readFile(configPath, 'utf-8');
                        const config = JSON.parse(configData);

                        sites.push({
                            name: entry.name,
                            url: `http://${entry.name}.local`,
                            phpVersion: config.phpVersion || 'unknown',
                            wpVersion: config.wpVersion || 'unknown',
                        });
                    } catch {
                        // Skip sites without config
                    }
                }
            }

            return {
                success: true,
                message: `📝 Found ${sites.length} WordPress site(s)`,
                data: { sites, count: sites.length },
            };
        } catch (error: any) {
            return {
                success: false,
                message: '❌ Failed to scan Local Sites',
                error: error.message,
            };
        }
    }

    /**
     * Get help information
     */
    private getHelp(): WordPressCommandResult {
        const helpText = `
📝 WordPress Commands (Project PRESS FORGE)

/blog start          - Start Docker WordPress (http://localhost:8080)
/blog stop           - Stop Docker WordPress
/blog status         - Check WordPress status
/blog publish <file> - Publish Markdown file to WordPress as draft
/blog scan           - Scan for Local by Flywheel sites
/blog help           - Show this help

Aliases:
/wordpress <command> - Same as /blog <command>

Examples:
  /blog start
  /blog publish ./notes/my-post.md "My Blog Post"
  /blog scan
    `.trim();

        return {
            success: true,
            message: helpText,
        };
    }

    /**
     * Basic Markdown to HTML conversion
     */
    private markdownToHtml(markdown: string): string {
        let html = markdown;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');

        // Links
        html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

        // Code blocks
        html = html.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');

        // Line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');

        // Wrap in paragraphs
        html = `<p>${html}</p>`;

        return html;
    }
}

// Export singleton instance
export const wordPressCommandService = new WordPressCommandService();

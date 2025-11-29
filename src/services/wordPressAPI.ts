/**
 * WordPress API Service
 * Handles WordPress operations via REST API (works in both web and Electron modes)
 */

const API_BASE = 'http://localhost:3000/api/wordpress';

export interface WordPressAPIResult {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}

export class WordPressAPIService {
    /**
     * Start WordPress Docker stack
     */
    async start(): Promise<WordPressAPIResult> {
        try {
            const response = await fetch(`${API_BASE}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const result = await response.json();
            return result;
        } catch (error: any) {
            return {
                success: false,
                message: 'Failed to start WordPress',
                error: error.message,
            };
        }
    }

    /**
     * Stop WordPress Docker stack
     */
    async stop(): Promise<WordPressAPIResult> {
        try {
            const response = await fetch(`${API_BASE}/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const result = await response.json();
            return result;
        } catch (error: any) {
            return {
                success: false,
                message: 'Failed to stop WordPress',
                error: error.message,
            };
        }
    }

    /**
     * Get WordPress status
     */
    async getStatus(): Promise<{ status: 'running' | 'stopped' | 'unknown'; output?: string }> {
        try {
            const response = await fetch(`${API_BASE}/status`);
            const result = await response.json();
            return result;
        } catch (error) {
            return { status: 'unknown' };
        }
    }

    /**
     * Publish Markdown file to WordPress
     */
    async publishNote(filePath: string, title?: string): Promise<WordPressAPIResult> {
        try {
            const response = await fetch(`${API_BASE}/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath, title }),
            });

            const result = await response.json();
            return result;
        } catch (error: any) {
            return {
                success: false,
                message: 'Failed to publish note',
                error: error.message,
            };
        }
    }
}

// Export singleton instance
export const wordPressAPI = new WordPressAPIService();

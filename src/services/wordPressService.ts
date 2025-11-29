/**
 * WordPress Integration Service
 * Handles WordPress site management (Electron mode only)
 * 
 * This service provides:
 * - Local Sites scanning (Local by Flywheel)
 * - Docker WordPress management
 * - WordPress Playground integration
 */

import { FEATURES } from '../utils/features';
import type { WordPressSite } from '../types/electron';

class WordPressService {
    private sites: WordPressSite[] = [];
    private dockerSites: Map<string, boolean> = new Map();

    /**
     * Check if WordPress features are available
     */
    isAvailable(): boolean {
        return FEATURES.WORDPRESS_INTEGRATION;
    }

    /**
   * Scan for Local by Flywheel WordPress installations
   */
    async scanLocalSites(): Promise<WordPressSite[]> {
        if (!this.isAvailable()) {
            console.warn('WordPress integration not available in web mode');
            return [];
        }

        try {
            if (window.electronAPI?.scanLocalSites) {
                const result = await window.electronAPI.scanLocalSites();

                // Check if result is an error
                if (result && typeof result === 'object' && 'error' in result) {
                    console.error('Failed to scan local WordPress sites:', result.error);
                    return [];
                }

                this.sites = Array.isArray(result) ? result : [];
                console.log(`📝 Found ${this.sites.length} WordPress sites`);
                return this.sites;
            }
        } catch (error) {
            console.error('Failed to scan local WordPress sites:', error);
        }

        return [];
    }

    /**
     * Get all WordPress sites
     */
    getSites(): WordPressSite[] {
        return this.sites;
    }

    /**
     * Start a WordPress site (Local by Flywheel)
     */
    async startSite(siteName: string): Promise<boolean> {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            if (window.electronAPI?.startWordPressSite) {
                return await window.electronAPI.startWordPressSite(siteName);
            }
        } catch (error) {
            console.error(`Failed to start WordPress site ${siteName}:`, error);
        }

        return false;
    }

    /**
     * Stop a WordPress site (Local by Flywheel)
     */
    async stopSite(siteName: string): Promise<boolean> {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            if (window.electronAPI?.stopWordPressSite) {
                return await window.electronAPI.stopWordPressSite(siteName);
            }
        } catch (error) {
            console.error(`Failed to stop WordPress site ${siteName}:`, error);
        }

        return false;
    }

    /**
     * Start Docker WordPress stack
     */
    /**
     * Start Docker WordPress stack
     */
    /**
     * Start Docker WordPress stack
     */
    async startDockerWordPress(siteId: number = 1): Promise<{ success: boolean; error?: string; isDockerMissing?: boolean }> {
        if (!FEATURES.WORDPRESS_DOCKER) {
            return { success: false, error: 'Docker feature disabled' };
        }

        try {
            console.log('Checking electronAPI:', window.electronAPI);
            if (window.electronAPI?.dockerCompose) {
                const profile = `site${siteId}`;
                const command = `--profile ${profile} up -d`;
                const result = await window.electronAPI.dockerCompose(command, 'docker-compose.wordpress.yml');

                if (result && typeof result === 'object' && 'error' in result) {
                    console.error('Docker error:', result.error);
                    const errorMsg = result.error || '';
                    const isDockerMissing = errorMsg.includes('command not found') ||
                        errorMsg.includes('is not recognized') ||
                        errorMsg.includes('docker-compose: not found') ||
                        errorMsg.includes('docker: command not found');

                    return {
                        success: false,
                        error: result.error,
                        isDockerMissing
                    };
                }

                this.dockerSites.set(`rangerplex-wp-${siteId}`, true);
                const output = result && typeof result === 'object' && 'output' in result ? result.output : '';
                const isSuccess = output.includes('Started') || output.includes('Running') || output.includes('up') || output.includes('Creating') || output.includes('Recreating');

                return {
                    success: isSuccess,
                    error: isSuccess ? undefined : 'Unexpected output from Docker'
                };
            }
        } catch (error: any) {
            console.error('Failed to start Docker WordPress:', error);
            return { success: false, error: error.message || String(error) };
        }

        return { success: false, error: 'Electron API unavailable' };
    }

    /**
     * Stop Docker WordPress stack
     */
    async stopDockerWordPress(siteId: number = 1): Promise<boolean> {
        if (!FEATURES.WORDPRESS_DOCKER) return false;

        try {
            if (window.electronAPI?.dockerCompose) {
                const profile = `site${siteId}`;
                const command = `--profile ${profile} stop`;
                const result = await window.electronAPI.dockerCompose(command, 'docker-compose.wordpress.yml');

                if (result && typeof result === 'object' && 'error' in result) {
                    console.error('Docker error:', result.error);
                    return false;
                }

                this.dockerSites.set(`rangerplex-wp-${siteId}`, false);
                const output = result && typeof result === 'object' && 'output' in result ? result.output : '';
                return output.includes('Stopped') || output.includes('Removed') || output.includes('down') || output.includes('Stop');
            }
        } catch (error) {
            console.error('Failed to stop Docker WordPress:', error);
        }

        return false;
    }

    /**
     * Uninstall Docker WordPress (Remove volumes)
     */
    async uninstallDockerWordPress(siteId: number = 1): Promise<boolean> {
        if (!FEATURES.WORDPRESS_DOCKER) return false;

        try {
            if (window.electronAPI?.dockerCompose) {
                const profile = `site${siteId}`;
                const command = `--profile ${profile} down -v`;
                const result = await window.electronAPI.dockerCompose(command, 'docker-compose.wordpress.yml');

                if (result && typeof result === 'object' && 'error' in result) {
                    console.error('Docker error:', result.error);
                    return false;
                }

                this.dockerSites.set(`rangerplex-wp-${siteId}`, false);
                return true;
            }
        } catch (error) {
            console.error('Failed to uninstall Docker WordPress:', error);
        }

        return false;
    }

    /**
     * Check Docker WordPress status
     */
    async getDockerStatus(siteId: number = 1): Promise<'running' | 'stopped' | 'unknown'> {
        if (!FEATURES.WORDPRESS_DOCKER) {
            return 'unknown';
        }

        try {
            if (window.electronAPI?.dockerCompose) {
                const result = await window.electronAPI.dockerCompose('ps', 'docker-compose.wordpress.yml');

                if (result && typeof result === 'object' && 'error' in result) {
                    return 'stopped';
                }

                const output = result && typeof result === 'object' && 'output' in result ? result.output : '';
                const containerName = `rangerplex-wp-${siteId}`;

                // Check if our specific container is running
                if (output.includes(containerName) && (output.includes('Up') || output.includes('running'))) {
                    return 'running';
                }

                return 'stopped';
            }
        } catch (error) {
            console.error('Failed to check Docker WordPress status:', error);
        }

        return 'unknown';
    }

    /**
     * Get Docker status for multiple sites with a single compose call
     */
    async getDockerStatuses(siteIds: number[]): Promise<Record<number, 'running' | 'stopped' | 'unknown'>> {
        const statuses: Record<number, 'running' | 'stopped' | 'unknown'> = {};
        if (!FEATURES.WORDPRESS_DOCKER) {
            siteIds.forEach(id => { statuses[id] = 'unknown'; });
            return statuses;
        }

        try {
            if (window.electronAPI?.dockerCompose) {
                const result = await window.electronAPI.dockerCompose('ps', 'docker-compose.wordpress.yml');

                // Default to stopped if compose reports an error
                if (result && typeof result === 'object' && 'error' in result) {
                    siteIds.forEach(id => { statuses[id] = 'stopped'; });
                    return statuses;
                }

                const output = result && typeof result === 'object' && 'output' in result ? String(result.output) : '';

                siteIds.forEach(siteId => {
                    const containerName = `rangerplex-wp-${siteId}`;
                    const lineMatch = output.split('\n').find(line => line.includes(containerName));
                    if (lineMatch && /Up|running/i.test(lineMatch)) {
                        statuses[siteId] = 'running';
                    } else if (lineMatch) {
                        statuses[siteId] = 'stopped';
                    } else {
                        statuses[siteId] = 'unknown';
                    }
                });

                return statuses;
            }
        } catch (error) {
            console.error('Failed to check Docker WordPress statuses:', error);
        }

        siteIds.forEach(id => { statuses[id] = 'unknown'; });
        return statuses;
    }

    /**
     * Open WordPress admin in browser
     */
    async openAdmin(siteUrl: string): Promise<void> {
        if (!this.isAvailable()) {
            return;
        }

        const adminUrl = `${siteUrl}/wp-admin`;

        if (window.electronAPI?.openExternal) {
            await window.electronAPI.openExternal(adminUrl);
        } else {
            window.open(adminUrl, '_blank');
        }
    }

    /**
     * Convert Markdown note to WordPress post
     */
    async publishNote(filePath: string, title: string): Promise<boolean> {
        if (!FEATURES.WORDPRESS_DOCKER) {
            console.warn('WordPress Docker not available');
            return false;
        }

        try {
            // This will be implemented when we add the backend service
            // For now, just log the intent
            console.log(`📝 Publishing note to WordPress: ${title} from ${filePath}`);

            // TODO: Implement WP-CLI or REST API integration
            // await window.electronAPI?.publishToWordPress(filePath, title);

            return true;
        } catch (error) {
            console.error('Failed to publish note to WordPress:', error);
            return false;
        }
    }
}

// Export singleton instance
export const wordPressService = new WordPressService();

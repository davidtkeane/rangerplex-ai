// Alias Management Service for RangerPlex AI
// Manages command aliases with validation, execution tracking, and pre-built packs

import { dbService } from './dbService';

export interface Alias {
    name: string;
    command: string;
    description: string;
    cwd?: string;
    requires_confirmation: boolean;
    tags?: string[];
    category: 'fun' | 'utility' | 'system' | 'custom';
    icon?: string;
    created: number;
    lastUsed?: number;
    useCount: number;
    outputMode?: 'chat' | 'terminal' | 'both';
    acceptsParams?: boolean;
    paramPlaceholder?: string;
}

export interface ExecutionConfig {
    command: string;
    cwd: string;
    outputMode: 'chat' | 'terminal' | 'both';
    requiresConfirmation: boolean;
}

class AliasService {
    // Load default aliases from config/aliases.json
    async loadDefaultAliases(): Promise<void> {
        try {
            const response = await fetch('/config/aliases.json');
            const aliases: Alias[] = await response.json();

            for (const alias of aliases) {
                const existing = await dbService.getAlias(alias.name);
                if (!existing) {
                    await dbService.saveAlias(alias);
                }
            }
            console.log(`✅ Loaded ${aliases.length} default aliases`);
        } catch (error) {
            console.error('Failed to load default aliases:', error);
        }
    }

    // Validate alias (no pipes/redirects/subshells)
    validateAlias(alias: Alias): { valid: boolean; reason?: string } {
        // Check for forbidden characters
        if (/[|><;`]/.test(alias.command) && !alias.command.includes('&&')) {
            return {
                valid: false,
                reason: 'Command contains forbidden characters (pipes, redirects, etc.)'
            };
        }

        // Validate name (alphanumeric + dashes/underscores)
        if (!/^[a-zA-Z0-9_-]+$/.test(alias.name)) {
            return {
                valid: false,
                reason: 'Alias name must be alphanumeric with dashes/underscores only'
            };
        }

        // Name length check
        if (alias.name.length < 2 || alias.name.length > 50) {
            return {
                valid: false,
                reason: 'Alias name must be between 2 and 50 characters'
            };
        }

        // Command must not be empty
        if (!alias.command || alias.command.trim().length === 0) {
            return {
                valid: false,
                reason: 'Command cannot be empty'
            };
        }

        return { valid: true };
    }

    // CRUD Operations
    async createAlias(alias: Alias): Promise<void> {
        const validation = this.validateAlias(alias);
        if (!validation.valid) {
            throw new Error(validation.reason);
        }

        // Check if alias already exists
        const existing = await dbService.getAlias(alias.name);
        if (existing) {
            throw new Error(`Alias '${alias.name}' already exists`);
        }

        await dbService.saveAlias({
            ...alias,
            created: Date.now(),
            useCount: 0
        });

        console.log('✅ Alias created:', alias.name);
    }

    async getAlias(name: string): Promise<Alias | null> {
        const result = await dbService.getAlias(name);
        return result || null;
    }

    async getAllAliases(): Promise<Alias[]> {
        return await dbService.getAllAliases();
    }

    async getAliasesByCategory(category: string): Promise<Alias[]> {
        return await dbService.getAliasesByCategory(category);
    }

    async updateAlias(name: string, updates: Partial<Alias>): Promise<void> {
        const existing = await dbService.getAlias(name);
        if (!existing) {
            throw new Error(`Alias '${name}' not found`);
        }

        const updated = { ...existing, ...updates };
        const validation = this.validateAlias(updated);
        if (!validation.valid) {
            throw new Error(validation.reason);
        }

        await dbService.saveAlias(updated);
        console.log('✅ Alias updated:', name);
    }

    async deleteAlias(name: string): Promise<void> {
        const existing = await dbService.getAlias(name);
        if (!existing) {
            throw new Error(`Alias '${name}' not found`);
        }

        await dbService.deleteAlias(name);
        console.log('✅ Alias deleted:', name);
    }

    // Execution
    async executeAlias(name: string, params?: string[]): Promise<ExecutionConfig> {
        const alias = await dbService.getAlias(name);
        if (!alias) {
            throw new Error(`Alias '${name}' not found`);
        }

        // Update stats
        await dbService.updateAliasStats(name);

        // Build command with params if needed
        let command = alias.command;
        if (alias.acceptsParams && params && params.length > 0) {
            command = command.replace(/\$1/g, params[0] || '');
        }

        // Return for execution by commandExecutor
        return {
            command,
            cwd: alias.cwd || process.cwd(),
            outputMode: alias.outputMode || 'chat',
            requiresConfirmation: alias.requires_confirmation
        };
    }

    // Import/Export
    async exportAliases(): Promise<string> {
        const aliases = await dbService.getAllAliases();
        return JSON.stringify(aliases, null, 2);
    }

    async importAliases(json: string): Promise<number> {
        let aliases: Alias[];

        try {
            aliases = JSON.parse(json);
        } catch (error) {
            throw new Error('Invalid JSON format');
        }

        if (!Array.isArray(aliases)) {
            throw new Error('JSON must contain an array of aliases');
        }

        let importedCount = 0;
        for (const alias of aliases) {
            const validation = this.validateAlias(alias);
            if (validation.valid) {
                await dbService.saveAlias(alias);
                importedCount++;
            } else {
                console.warn(`Skipped invalid alias '${alias.name}':`, validation.reason);
            }
        }

        console.log(`✅ Imported ${importedCount} aliases`);
        return importedCount;
    }

    // Pre-built Packs
    async installPack(packName: 'fun' | 'utility' | 'system' | 'development' | 'ranger-ai'): Promise<void> {
        const packs: Record<string, Alias[]> = {
            fun: [
                {
                    name: 'moon',
                    command: 'curl http://wttr.in/Moon',
                    description: 'Show moon phase',
                    icon: '🌙',
                    category: 'fun',
                    requires_confirmation: false,
                    created: Date.now(),
                    useCount: 0,
                    tags: ['weather', 'ascii']
                },
                {
                    name: 'weather',
                    command: 'curl wttr.in',
                    description: 'Weather report',
                    icon: '🌤️',
                    category: 'fun',
                    requires_confirmation: false,
                    created: Date.now(),
                    useCount: 0,
                    tags: ['weather']
                },
                {
                    name: 'parrot',
                    command: 'curl parrot.live',
                    description: 'Party parrot animation',
                    icon: '🦜',
                    category: 'fun',
                    requires_confirmation: false,
                    created: Date.now(),
                    useCount: 0,
                    tags: ['animation', 'fun']
                }
            ],
            utility: [
                {
                    name: 'nddy',
                    command: 'date +"%d %b %Y %T %z"',
                    description: 'Human-friendly timestamp',
                    icon: '📅',
                    category: 'utility',
                    requires_confirmation: false,
                    created: Date.now(),
                    useCount: 0,
                    tags: ['time', 'date']
                },
                {
                    name: 'ny',
                    command: 'date +"%Y"',
                    description: 'Current year',
                    icon: '📆',
                    category: 'utility',
                    requires_confirmation: false,
                    created: Date.now(),
                    useCount: 0,
                    tags: ['time']
                },
                {
                    name: 'myip',
                    command: 'curl ifconfig.me',
                    description: 'Show public IP address',
                    icon: '🌐',
                    category: 'utility',
                    requires_confirmation: false,
                    created: Date.now(),
                    useCount: 0,
                    tags: ['network', 'ip']
                }
            ],
            system: [
                {
                    name: 'status',
                    command: 'uptime',
                    description: 'System uptime and load',
                    icon: '⚡',
                    category: 'system',
                    requires_confirmation: false,
                    created: Date.now(),
                    useCount: 0,
                    tags: ['system', 'monitoring']
                },
                {
                    name: 'diskspace',
                    command: 'df -h',
                    description: 'Disk space usage',
                    icon: '💾',
                    category: 'system',
                    requires_confirmation: false,
                    created: Date.now(),
                    useCount: 0,
                    tags: ['system', 'disk']
                }
            ],
            development: [
                {
                    name: 'gitlog',
                    command: 'git log --oneline -10',
                    description: 'Recent git commits',
                    icon: '📝',
                    category: 'utility',
                    requires_confirmation: false,
                    created: Date.now(),
                    useCount: 0,
                    tags: ['git', 'development']
                },
                {
                    name: 'npmlist',
                    command: 'npm list --depth=0',
                    description: 'List installed npm packages',
                    icon: '📦',
                    category: 'utility',
                    requires_confirmation: false,
                    created: Date.now(),
                    useCount: 0,
                    tags: ['npm', 'development']
                },
                {
                    name: 'ports',
                    command: 'lsof -i -P -n',
                    description: 'Show open ports',
                    icon: '🔌',
                    category: 'system',
                    requires_confirmation: false,
                    created: Date.now(),
                    useCount: 0,
                    tags: ['network', 'ports']
                }
            ],
            'ranger-ai': [
                {
                    name: 'rangerbot',
                    command: 'echo "RangerPlex AI v2.7.7 - Rangers lead the way! 🎖️"',
                    description: 'RangerPlex AI info',
                    icon: '🎖️',
                    category: 'fun',
                    requires_confirmation: false,
                    created: Date.now(),
                    useCount: 0,
                    tags: ['ranger', 'info']
                },
                {
                    name: 'ollama-list',
                    command: 'ollama list',
                    description: 'List Ollama models',
                    icon: '🤖',
                    category: 'utility',
                    requires_confirmation: false,
                    created: Date.now(),
                    useCount: 0,
                    tags: ['ai', 'ollama']
                }
            ]
        };

        const pack = packs[packName];
        if (!pack) {
            throw new Error(`Pack '${packName}' not found`);
        }

        let installedCount = 0;
        for (const alias of pack) {
            try {
                await this.createAlias(alias);
                installedCount++;
            } catch (error) {
                // Alias might already exist, skip it
                console.log(`Skipped '${alias.name}':`, (error as Error).message);
            }
        }

        console.log(`✅ Installed ${installedCount}/${pack.length} aliases from '${packName}' pack`);
    }
}

export const aliasService = new AliasService();

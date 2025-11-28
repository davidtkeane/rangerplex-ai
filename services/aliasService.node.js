import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'config', 'aliases.json');

const defaultPacks = {
    fun: [
        { name: 'moon', command: 'curl http://wttr.in/Moon', description: 'Show moon phase', icon: '🌙', category: 'fun', requires_confirmation: false, tags: ['weather', 'ascii'] },
        { name: 'weather', command: 'curl wttr.in', description: 'Weather report', icon: '🌤️', category: 'fun', requires_confirmation: false, tags: ['weather'] },
        { name: 'parrot', command: 'curl parrot.live', description: 'Party parrot animation', icon: '🦜', category: 'fun', requires_confirmation: false, tags: ['animation', 'fun'] },
    ],
    utility: [
        { name: 'nddy', command: 'date +"%d %b %Y %T %z"', description: 'Human-friendly timestamp', icon: '📅', category: 'utility', requires_confirmation: false, tags: ['time'] },
        { name: 'ny', command: 'TZ="America/New_York" tty-clock -sct -f "%a, %d %b %Y %T %z"', description: 'NY clock', icon: '🗽', category: 'utility', requires_confirmation: false, tags: ['time', 'ny'] },
        { name: 'myip', command: 'curl https://ipinfo.io/ip', description: 'Show public IP', icon: '📡', category: 'utility', requires_confirmation: false, tags: ['network'] },
    ],
    system: [
        { name: 'status', command: 'uptime', description: 'System uptime and load', icon: '⚡', category: 'system', requires_confirmation: false, tags: ['system'] },
        { name: 'diskspace', command: 'df -h', description: 'Disk space usage', icon: '💾', category: 'system', requires_confirmation: false, tags: ['system', 'disk'] },
    ],
    development: [
        { name: 'gitlog', command: 'git log --oneline -10', description: 'Recent git commits', icon: '📝', category: 'utility', requires_confirmation: false, tags: ['git', 'dev'] },
        { name: 'npmlist', command: 'npm list --depth=0', description: 'List npm packages', icon: '📦', category: 'utility', requires_confirmation: false, tags: ['npm', 'dev'] },
        { name: 'ports', command: 'lsof -i -P -n', description: 'Show open ports', icon: '🔌', category: 'system', requires_confirmation: false, tags: ['network', 'ports'] },
    ],
    'ranger-ai': [
        { name: 'rangerbot', command: 'echo "RangerPlex AI"', description: 'Ranger info', icon: '🎖️', category: 'fun', requires_confirmation: false, tags: ['ranger'] },
        { name: 'ollama-list', command: 'ollama list', description: 'List Ollama models', icon: '🤖', category: 'utility', requires_confirmation: false, tags: ['ai'] },
    ],
};

let aliases = [];

function loadFromDisk() {
    try {
        const raw = fs.readFileSync(configPath, 'utf8');
        aliases = JSON.parse(raw);
    } catch {
        aliases = [];
    }
}

function saveToDisk() {
    try {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(aliases, null, 2));
    } catch (err) {
        console.error('Failed to save aliases.json:', err);
    }
}

function validateAlias(alias) {
    if (!alias.name || !/^[a-zA-Z0-9_-]+$/.test(alias.name)) {
        throw new Error('Alias name must be alphanumeric with dashes/underscores');
    }
    if (!alias.command || alias.command.trim().length === 0) {
        throw new Error('Command cannot be empty');
    }
    if (/[|><;`]/.test(alias.command) && !alias.command.includes('&&')) {
        throw new Error('Command contains forbidden characters');
    }
}

function withDefaults(alias) {
    return {
        ...alias,
        created: alias.created || Date.now(),
        useCount: alias.useCount || 0,
        requires_confirmation: alias.requires_confirmation ?? true,
    };
}

loadFromDisk();

export const aliasService = {
    async getAllAliases() {
        return aliases;
    },
    async getAlias(name) {
        return aliases.find(a => a.name === name) || null;
    },
    async createAlias(alias) {
        validateAlias(alias);
        if (aliases.find(a => a.name === alias.name)) throw new Error(`Alias '${alias.name}' already exists`);
        aliases.unshift(withDefaults(alias));
        saveToDisk();
    },
    async updateAlias(name, updates) {
        const idx = aliases.findIndex(a => a.name === name);
        if (idx === -1) throw new Error(`Alias '${name}' not found`);
        const updated = withDefaults({ ...aliases[idx], ...updates, name });
        validateAlias(updated);
        aliases[idx] = updated;
        saveToDisk();
    },
    async deleteAlias(name) {
        aliases = aliases.filter(a => a.name !== name);
        saveToDisk();
    },
    async exportAliases() {
        return JSON.stringify(aliases, null, 2);
    },
    async importAliases(json) {
        const parsed = JSON.parse(json);
        if (!Array.isArray(parsed)) throw new Error('JSON must be an array of aliases');
        let count = 0;
        parsed.forEach(alias => {
            try {
                validateAlias(alias);
                const existing = aliases.find(a => a.name === alias.name);
                if (existing) return;
                aliases.push(withDefaults(alias));
                count += 1;
            } catch (err) {
                console.warn('Skipped alias import:', err?.message || err);
            }
        });
        saveToDisk();
        return count;
    },
    async installPack(packName) {
        const pack = defaultPacks[packName];
        if (!pack) throw new Error(`Pack '${packName}' not found`);
        for (const alias of pack) {
            try {
                await this.createAlias(alias);
            } catch {
                // ignore duplicates
            }
        }
    }
};

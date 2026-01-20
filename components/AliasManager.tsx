import React, { useEffect, useMemo, useState } from 'react';
import { aliasService, type Alias } from '../services/aliasService';

interface ExecutionLog {
    id: string;
    command: string;
    cwd: string;
    user: string;
    timestamp: number;
    exitCode: number;
    duration: number;
    source: 'alias' | 'allowlist' | 'manual';
}

interface AliasManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const defaultAlias = (): Alias => ({
    name: '',
    command: '',
    description: '',
    cwd: '',
    requires_confirmation: true,
    category: 'custom',
    icon: '⚡',
    tags: [],
    created: Date.now(),
    useCount: 0,
    outputMode: 'chat',
});

const AliasManager: React.FC<AliasManagerProps> = ({ isOpen, onClose }) => {
    const [aliases, setAliases] = useState<Alias[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [editingAlias, setEditingAlias] = useState<Alias | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tagInput, setTagInput] = useState('');
    const [logs, setLogs] = useState<ExecutionLog[]>([]);
    const [logsError, setLogsError] = useState<string | null>(null);
    const [logsLoading, setLogsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadAliases();
            loadLogs();
        }
    }, [isOpen]);

    useEffect(() => {
        if (editingAlias) {
            setTagInput((editingAlias.tags || []).join(', '));
        }
    }, [editingAlias]);

    const loadAliases = async () => {
        const all = await aliasService.getAllAliases();
        setAliases(all || []);
    };

    const loadLogs = async () => {
        setLogsLoading(true);
        setLogsError(null);
        try {
            const res = await fetch('http://localhost:3000/api/alias/logs?limit=20');
            const body = await res.json();
            if (!res.ok || !body.success) {
                throw new Error(body?.error || 'Failed to load logs');
            }
            setLogs(body.logs || []);
        } catch (err: any) {
            setLogsError(err?.message || 'Failed to load logs');
        } finally {
            setLogsLoading(false);
        }
    };

    const filteredAliases = useMemo(() => {
        return aliases.filter(a => {
            const matchesFilter = filter === 'all' || a.category === filter;
            const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
                a.description.toLowerCase().includes(search.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [aliases, filter, search]);

    if (!isOpen) return null;

    const startNewAlias = () => {
        setError(null);
        setEditingAlias(defaultAlias());
    };

    const handleEdit = (alias: Alias) => {
        setError(null);
        setEditingAlias({ ...alias });
    };

    const handleDelete = async (name: string) => {
        if (!confirm(`Delete alias '${name}'?`)) return;
        await aliasService.deleteAlias(name);
        await loadAliases();
    };

    const handleSave = async () => {
        if (!editingAlias) return;
        setIsSaving(true);
        setError(null);

        const tags = tagInput
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);

        const payload: Alias = {
            ...editingAlias,
            tags,
            created: editingAlias.created || Date.now(),
            useCount: editingAlias.useCount ?? 0,
        };

        try {
            const exists = aliases.some(a => a.name === payload.name);
            if (exists) {
                await aliasService.updateAlias(payload.name, payload);
            } else {
                await aliasService.createAlias({ ...payload, created: Date.now(), useCount: 0 });
            }
            setEditingAlias(null);
            await loadAliases();
        } catch (err: any) {
            setError(err?.message || 'Failed to save alias');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async () => {
        const json = await aliasService.exportAliases();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'aliases.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = async () => {
        const json = window.prompt('Paste alias JSON to import');
        if (!json) return;
        try {
            await aliasService.importAliases(json);
            await loadAliases();
        } catch (err: any) {
            setError(err?.message || 'Import failed');
        }
    };

    const renderEditor = () => {
        if (!editingAlias) return null;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center">
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-6 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">{aliases.some(a => a.name === editingAlias.name) ? 'Edit Alias' : 'New Alias'}</h3>
                        <button onClick={() => setEditingAlias(null)} className="text-zinc-500 hover:text-zinc-300">
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs uppercase tracking-wide text-zinc-500">Name</label>
                            <input
                                value={editingAlias.name}
                                onChange={e => setEditingAlias(prev => prev ? { ...prev, name: e.target.value } : prev)}
                                className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                placeholder="moon"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wide text-zinc-500">Icon</label>
                            <input
                                value={editingAlias.icon || ''}
                                onChange={e => setEditingAlias(prev => prev ? { ...prev, icon: e.target.value } : prev)}
                                className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                placeholder="🌙"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs uppercase tracking-wide text-zinc-500">Description</label>
                            <input
                                value={editingAlias.description}
                                onChange={e => setEditingAlias(prev => prev ? { ...prev, description: e.target.value } : prev)}
                                className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                placeholder="Show moon phase"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs uppercase tracking-wide text-zinc-500">Command</label>
                            <textarea
                                value={editingAlias.command}
                                onChange={e => setEditingAlias(prev => prev ? { ...prev, command: e.target.value } : prev)}
                                className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wide text-zinc-500">Category</label>
                            <select
                                value={editingAlias.category}
                                onChange={e => setEditingAlias(prev => prev ? { ...prev, category: e.target.value as Alias['category'] } : prev)}
                                className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                            >
                                <option value="fun">Fun</option>
                                <option value="utility">Utility</option>
                                <option value="system">System</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wide text-zinc-500">CWD (optional)</label>
                            <input
                                value={editingAlias.cwd || ''}
                                onChange={e => setEditingAlias(prev => prev ? { ...prev, cwd: e.target.value } : prev)}
                                className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                placeholder="/path/to/project"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wide text-zinc-500">Tags (comma separated)</label>
                            <input
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                placeholder="weather, ascii"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wide text-zinc-500">Output Mode</label>
                            <select
                                value={editingAlias.outputMode || 'chat'}
                                onChange={e => setEditingAlias(prev => prev ? { ...prev, outputMode: e.target.value as 'chat' | 'terminal' | 'both' } : prev)}
                                className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                            >
                                <option value="chat">Chat</option>
                                <option value="terminal">Terminal</option>
                                <option value="both">Both</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                id="requires_confirmation"
                                type="checkbox"
                                checked={editingAlias.requires_confirmation}
                                onChange={e => setEditingAlias(prev => prev ? { ...prev, requires_confirmation: e.target.checked } : prev)}
                                className="w-4 h-4"
                            />
                            <label htmlFor="requires_confirmation" className="text-sm text-zinc-700 dark:text-zinc-300">
                                Require confirmation before running
                            </label>
                        </div>
                    </div>

                    {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setEditingAlias(null)}
                            className="px-4 py-2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
                        >
                            {isSaving ? 'Saving...' : 'Save Alias'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] flex flex-col border border-zinc-200 dark:border-zinc-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-700">
                    <h2 className="text-2xl font-bold">🎖️ Alias Manager</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex gap-4 flex-wrap">
                    <input
                        type="text"
                        placeholder="Search aliases..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 min-w-[200px] px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    >
                        <option value="all">All Categories</option>
                        <option value="fun">Fun</option>
                        <option value="utility">Utility</option>
                        <option value="system">System</option>
                        <option value="custom">Custom</option>
                    </select>
                    <button
                        onClick={startNewAlias}
                        className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-500"
                    >
                        + New Alias
                    </button>
                </div>

                {/* Alias List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredAliases.map(alias => (
                        <div
                            key={alias.name}
                            className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                <span className="text-3xl">{alias.icon || '⚡'}</span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-bold text-lg">{alias.name}</h3>
                                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded">{alias.category}</span>
                                        {alias.requires_confirmation && (
                                            <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded text-yellow-700 dark:text-yellow-200">
                                                Confirmation
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{alias.description}</p>
                                    <pre className="text-xs mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded overflow-x-auto">{alias.command}</pre>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500 flex-wrap">
                                        <span>Used {alias.useCount} times</span>
                                        {alias.lastUsed && <span>Last: {new Date(alias.lastUsed).toLocaleDateString()}</span>}
                                        {alias.cwd && <span>CWD: {alias.cwd}</span>}
                                    </div>
                                    {alias.tags && alias.tags.length > 0 && (
                                        <div className="flex gap-2 flex-wrap mt-2">
                                            {alias.tags.map(tag => (
                                                <span key={tag} className="text-[11px] px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded-full">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(alias)}
                                        className="px-3 py-1 text-sm bg-zinc-200 dark:bg-zinc-800 rounded hover:bg-zinc-300"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(alias.name)}
                                        className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredAliases.length === 0 && (
                        <div className="text-center text-sm text-zinc-500 py-8">No aliases yet. Create one to get started.</div>
                    )}

                    <div className="mt-4 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-800/40">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold">Execution Logs</h3>
                            <button
                                onClick={loadLogs}
                                className="px-3 py-1 text-xs rounded bg-amber-500 text-white hover:bg-amber-400"
                            >
                                {logsLoading ? 'Loading...' : 'Refresh'}
                            </button>
                        </div>
                        {logsError && <p className="text-xs text-red-500 mb-2">{logsError}</p>}
                        {logs.length === 0 && !logsLoading && <p className="text-xs text-zinc-500">No logs yet.</p>}
                        <div className="space-y-2 max-h-64 overflow-y-auto text-xs font-mono">
                            {logs.map(log => (
                                <div key={log.id} className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                                    <div className="flex justify-between text-[11px] text-zinc-500">
                                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                                        <span>{log.source} · exit {log.exitCode} · {log.duration}ms</span>
                                    </div>
                                    <div className="mt-1 text-zinc-800 dark:text-zinc-100">{log.command}</div>
                                    <div className="text-[11px] text-zinc-500">cwd: {log.cwd}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 flex gap-2 justify-end">
                    <button className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 rounded" onClick={handleImport}>Import Aliases</button>
                    <button className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 rounded" onClick={handleExport}>Export Aliases</button>
                </div>
            </div>

            {renderEditor()}
        </div>
    );
};

export default AliasManager;

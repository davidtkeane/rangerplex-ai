import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { backupService, BackupData } from '../../services/backupService';
import { syncService } from '../../services/syncService';
import '../styles/backup.css';

interface BackupManagerProps {
  theme: 'dark' | 'light' | 'tron';
  onClose?: () => void;
}

type ImportMode = 'merge' | 'replace';

interface BackupSummary {
  itemCounts: {
    chats: number;
    settings: number;
    canvasBoards: number;
    editorFiles: number;
    editorFolders: number;
  };
  totalSize: number;
  timestamp: number;
  version: string;
}

export const BackupManager: React.FC<BackupManagerProps> = ({ theme, onClose }) => {
  const [info, setInfo] = useState<BackupSummary | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BackupData | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [mode, setMode] = useState<ImportMode>('merge');
  const [includeChats, setIncludeChats] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(true);
  const [includeCanvas, setIncludeCanvas] = useState(true);
  const [includeEditor, setIncludeEditor] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [syncConnected, setSyncConnected] = useState(syncService.getConnectionStatus().connected);
  const [queuedMessages, setQueuedMessages] = useState(syncService.getConnectionStatus().queuedMessages);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const loadInfo = useCallback(async () => {
    setLoadingInfo(true);
    setError(null);
    try {
      const details = await backupService.getBackupInfo();
      setInfo(details);
    } catch (err) {
      setError('Failed to load backup stats. Try again.');
    } finally {
      setLoadingInfo(false);
    }
  }, []);

  const refreshSyncStatus = useCallback(() => {
    const { connected, queuedMessages: queued } = syncService.getConnectionStatus();
    setSyncConnected(connected);
    setQueuedMessages(queued);
  }, []);

  useEffect(() => {
    void loadInfo();
    refreshSyncStatus();

    const handleConnected = () => refreshSyncStatus();
    const handleDisconnected = () => refreshSyncStatus();
    syncService.on('connected', handleConnected);
    syncService.on('disconnected', handleDisconnected);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      syncService.off('connected', handleConnected);
      syncService.off('disconnected', handleDisconnected);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadInfo, onClose, refreshSyncStatus]);

  const handleFile = async (file: File) => {
    setFileError(null);
    setPreview(null);
    setStatus(null);
    setImportSummary(null);
    setSelectedFileName(file.name);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const validation = backupService.validateBackup(data);
      if (!validation.valid) {
        setFileError(validation.errors.join('; '));
        return;
      }
      setPreview(data as BackupData);
      setStatus('Backup file loaded. Review details before import.');
    } catch (err) {
      setFileError('Invalid JSON file. Please select a valid backup.');
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setStatus('Preparing backup...');
    setProgress(10);
    try {
      await backupService.exportToFile();
      setStatus('Backup downloaded.');
      setProgress(100);
      setImportSummary(null);
      await loadInfo();
    } catch (err) {
      setError('Export failed. Please try again.');
    } finally {
      setTimeout(() => setProgress(0), 800);
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setError(null);
    setImportSummary(null);
    if (!preview) {
      setFileError('Select a backup file first.');
      return;
    }
    if (mode === 'replace' && !window.confirm('Replace mode will overwrite existing data. Continue?')) {
      return;
    }

    setIsImporting(true);
    setProgress(5);
    setStatus('Starting import...');

    try {
      const result = await backupService.importBackupData(preview, {
        mode,
        skipChats: !includeChats,
        skipSettings: !includeSettings,
        skipCanvas: !includeCanvas,
        skipEditor: !includeEditor,
        onProgress: (value, label) => {
          setProgress(Math.min(100, Math.max(0, value)));
          if (label) setStatus(label);
        },
      });

      if (!result.success) {
        setError(`Import finished with errors: ${result.errors.join('; ')}`);
      } else {
        const summary = `Imported chats:${result.imported.chats} settings:${result.imported.settings} canvas:${result.imported.canvasBoards} editorFiles:${result.imported.editorFiles} editorFolders:${result.imported.editorFolders}`;
        setImportSummary(summary);
        setStatus('Import complete.');
      }

      if (result.warnings.length > 0) {
        setStatus(`Import complete with warnings: ${result.warnings.join('; ')}`);
      }

      await loadInfo();
    } catch (err) {
      setError(`Import failed: ${String(err)}`);
    } finally {
      setIsImporting(false);
      setTimeout(() => setProgress(0), 1200);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const renderPreviewStats = () => {
    if (!preview) return null;
    const counts = preview.metadata?.itemCounts || {
      chats: preview.chats?.length || 0,
      settings: Object.keys(preview.settings || {}).length,
      canvasBoards: preview.canvasBoards?.length || 0,
      editorFiles: preview.editorFiles?.length || 0,
      editorFolders: preview.editorFolders?.length || 0,
    };
    const totalSize = preview.metadata?.totalSize || 0;

    return (
      <div className="backup-card">
        <div className="backup-card-title">Backup Preview</div>
        <div className="backup-summary">
          <div>
            <div className="backup-summary-label">Version</div>
            <div className="backup-summary-value">{preview.version || 'unknown'}</div>
          </div>
          <div>
            <div className="backup-summary-label">Created</div>
            <div className="backup-summary-value">{preview.timestamp ? new Date(preview.timestamp).toLocaleString() : 'n/a'}</div>
          </div>
          <div>
            <div className="backup-summary-label">Approx Size</div>
            <div className="backup-summary-value">{formatBytes(totalSize)}</div>
          </div>
        </div>
        <div className="backup-counts">
          <div className="pill">Chats: {counts.chats}</div>
          <div className="pill">Settings: {counts.settings}</div>
          <div className="pill">Canvas Boards: {counts.canvasBoards}</div>
          <div className="pill">Editor Files: {counts.editorFiles}</div>
          <div className="pill">Editor Folders: {counts.editorFolders}</div>
        </div>
        <div className="backup-import-options">
          <div className="radio-group">
            <label>
              <input type="radio" checked={mode === 'merge'} onChange={() => setMode('merge')} />
              Merge (keep existing)
            </label>
            <label>
              <input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} />
              Replace (overwrite)
            </label>
          </div>
          <div className="checkbox-row">
            <label><input type="checkbox" checked={includeChats} onChange={e => setIncludeChats(e.target.checked)} /> Chats</label>
            <label><input type="checkbox" checked={includeSettings} onChange={e => setIncludeSettings(e.target.checked)} /> Settings</label>
            <label><input type="checkbox" checked={includeCanvas} onChange={e => setIncludeCanvas(e.target.checked)} /> Canvas</label>
            <label><input type="checkbox" checked={includeEditor} onChange={e => setIncludeEditor(e.target.checked)} /> Editor</label>
          </div>
          <button
            className="primary-btn"
            onClick={handleImport}
            disabled={isImporting}
            aria-label="Start import"
          >
            {isImporting ? 'Importing...' : mode === 'replace' ? 'Import (Replace)' : 'Import (Merge)'}
          </button>
        </div>
      </div>
    );
  };

  if (typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <div className={`backup-modal-backdrop theme-${theme}`} role="dialog" aria-modal="true" aria-label="Backup Manager">
      <div className={`backup-modal theme-${theme}`}>
        <header className="backup-header">
          <div>
            <div className="backup-title">Backup & Restore</div>
            <div className="backup-subtitle">3-tier protection: IndexedDB (local) → Sync Queue (server) → Downloadable backups.</div>
          </div>
          <button className="ghost-btn" onClick={onClose} aria-label="Close backup manager">
            ✖
          </button>
        </header>

        {status && <div className="status-banner">{status}</div>}
        {error && <div className="status-banner error">{error}</div>}
        {fileError && <div className="status-banner error">{fileError}</div>}
        {importSummary && <div className="status-banner success">{importSummary}</div>}

        {progress > 0 && (
          <div className="progress-wrap" aria-label="Progress">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div className="backup-grid">
          <div className="backup-card">
            <div className="backup-card-title">Export</div>
            <p className="muted">Download a full JSON backup of chats, settings, canvas boards, and editor files.</p>
            <button className="primary-btn" onClick={handleExport} disabled={isExporting} aria-label="Export all data">
              {isExporting ? 'Exporting...' : 'Export All Data'}
            </button>
            <div className="inline-stats">
              <span>Backup size (est): {info ? formatBytes(info.totalSize) : '...'}</span>
              <span>Version: {info?.version || '1.0'}</span>
            </div>
          </div>

          <div className={`backup-card dropzone ${dragActive ? 'drag-active' : ''}`} ref={dropRef}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className="backup-card-title">Import</div>
            <p className="muted">Drop a JSON backup or select a file to preview before import.</p>
            <label className="drop-label">
              <input type="file" accept=".json,application/json" onChange={handleFileInput} aria-label="Choose backup file" />
              <div className="drop-hint">
                <span className="drop-icon">📁</span>
                <span>{selectedFileName || 'Drop or click to browse'}</span>
              </div>
            </label>
            <div className="inline-stats">
              <span>Mode: {mode === 'merge' ? 'Merge' : 'Replace'}</span>
              <span>Includes: {[
                includeChats ? 'Chats' : null,
                includeSettings ? 'Settings' : null,
                includeCanvas ? 'Canvas' : null,
                includeEditor ? 'Editor' : null,
              ].filter(Boolean).join(', ') || 'None selected'}</span>
            </div>
          </div>
        </div>

        <div className="backup-grid secondary">
          <div className="backup-card">
            <div className="backup-card-title">Current Data</div>
            <div className="backup-summary">
              <div>
                <div className="backup-summary-label">Chats</div>
                <div className="backup-summary-value">{loadingInfo ? '...' : info?.itemCounts.chats ?? 0}</div>
              </div>
              <div>
                <div className="backup-summary-label">Settings</div>
                <div className="backup-summary-value">{loadingInfo ? '...' : info?.itemCounts.settings ?? 0}</div>
              </div>
              <div>
                <div className="backup-summary-label">Canvas</div>
                <div className="backup-summary-value">{loadingInfo ? '...' : info?.itemCounts.canvasBoards ?? 0}</div>
              </div>
              <div>
                <div className="backup-summary-label">Editor Files</div>
                <div className="backup-summary-value">{loadingInfo ? '...' : info?.itemCounts.editorFiles ?? 0}</div>
              </div>
              <div>
                <div className="backup-summary-label">Editor Folders</div>
                <div className="backup-summary-value">{loadingInfo ? '...' : info?.itemCounts.editorFolders ?? 0}</div>
              </div>
            </div>
            <div className="inline-stats">
              <span>Total size: {info ? formatBytes(info.totalSize) : '...'}</span>
              <span>Last backup: {info ? new Date(info.timestamp).toLocaleString() : '...'}</span>
            </div>
            <div className="inline-stats">
              <span>Sync: {syncConnected ? 'Online' : 'Offline'}</span>
              <span>Queue: {queuedMessages}</span>
              <span>3-tier: {syncConnected ? 'IndexedDB + Sync + Backup active' : 'IndexedDB + Queue + Backup'}</span>
            </div>
            <button className="ghost-btn" onClick={() => void loadInfo()} aria-label="Refresh backup info">Refresh Stats</button>
          </div>

          {renderPreviewStats()}
        </div>
      </div>
    </div>,
    document.body
  );
};

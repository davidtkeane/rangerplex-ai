/**
 * WordPress Dashboard Component
 * Displays WordPress sites and management controls (Electron mode only)
 */

import React, { useEffect, useState } from 'react';
import { FEATURES } from '../../utils/features';
import { wordPressService } from '../../services/wordPressService';
import type { WordPressSite } from '../../types/electron';
import { WordPressPlayground } from './WordPressPlayground';
import styles from './WordPressDashboard.module.css';

interface WordPressDashboardProps {
    onOpenBrowser?: (url: string) => void;
    autoStart?: boolean;
}

export const WordPressDashboard: React.FC<WordPressDashboardProps> = ({ onOpenBrowser, autoStart = false }) => {
    const [sites, setSites] = useState<WordPressSite[]>([]);
    const [dockerStatuses, setDockerStatuses] = useState<{ [key: number]: string }>({});
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [showPlayground, setShowPlayground] = useState(false);
    const [hasAutoStarted, setHasAutoStarted] = useState(false);

    const [dockerMissing, setDockerMissing] = useState(false);

    // Check if WordPress features are available
    if (!FEATURES.WORDPRESS_INTEGRATION) {
        return (
            <div className={styles.unavailable}>
                <h2>🚫 WordPress Integration Unavailable</h2>
                <p>WordPress features are only available in Electron mode.</p>
                <p>Run <code>npm run browser</code> to access WordPress integration.</p>
            </div>
        );
    }

    useEffect(() => {
        loadData();
    }, []);

    // Helper to cap slow Electron calls so UI unblocks quickly
    const withTimeout = async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
        return Promise.race([
            promise,
            new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
        ]) as Promise<T>;
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [foundSites, statuses] = await Promise.all([
                withTimeout(wordPressService.scanLocalSites(), 3000, []),
                withTimeout(wordPressService.getDockerStatuses([1, 2, 3]), 3000, { 1: 'unknown', 2: 'unknown', 3: 'unknown' }),
            ]);

            setSites(foundSites);
            setDockerStatuses(statuses);

            // Auto-start site 1 if requested
            if (autoStart && !hasAutoStarted && statuses[1] !== 'running' && FEATURES.WORDPRESS_DOCKER) {
                setHasAutoStarted(true);
                handleStartDocker(1);
            }
        } catch (error) {
            console.error('Failed to load WordPress data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScanSites = async () => {
        setScanning(true);
        try {
            const foundSites = await withTimeout(wordPressService.scanLocalSites(), 3000, sites);
            setSites(foundSites);
        } finally {
            setScanning(false);
        }
    };

    const handleStartSite = async (siteName: string) => {
        const success = await wordPressService.startSite(siteName);
        if (success) {
            await loadData();
        }
    };

    const handleStopSite = async (siteName: string) => {
        const success = await wordPressService.stopSite(siteName);
        if (success) {
            await loadData();
        }
    };

    const handleOpenAdmin = async (siteUrl: string) => {
        const adminUrl = `${siteUrl}/wp-admin`;
        if (onOpenBrowser) {
            onOpenBrowser(adminUrl);
        } else {
            await wordPressService.openAdmin(siteUrl);
        }
    };

    const handleStartDocker = async (siteId: number) => {
        const result = await wordPressService.startDockerWordPress(siteId);
        if (result.success) {
            await loadData();
        } else {
            if (result.isDockerMissing) {
                setDockerMissing(true);
            } else {
                alert(`Failed to start Docker WordPress Site #${siteId}: ${result.error || 'Unknown error'}`);
            }
        }
    };

    const handleStopDocker = async (siteId: number) => {
        const success = await wordPressService.stopDockerWordPress(siteId);
        if (success) {
            await loadData();
        }
    };

    const handleUninstallDocker = async (siteId: number) => {
        if (confirm(`⚠️ Are you sure? This will DELETE the database and files for Site #${siteId}. This cannot be undone.`)) {
            const success = await wordPressService.uninstallDockerWordPress(siteId);
            if (success) {
                await loadData();
            }
        }
    };

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <h1 className={styles.titleRow}>
                    <img src="/image/rangersmyth-pic.png" alt="RangerPlex" className={styles.titleIcon} />
                    WordPress Command Center
                </h1>
                <p>Project PRESS FORGE</p>
                {loading && (
                    <div className={styles.inlineLoader}>
                        <div className={styles.smallSpinner}></div>
                        <span>Loading WordPress data…</span>
                    </div>
                )}
                <button
                    onClick={() => onOpenBrowser && onOpenBrowser('https://google.com')}
                    className={styles.newTabButton}
                >
                    <i className="fa-solid fa-plus"></i>
                    New Browser Tab
                </button>
            </header>

            {/* Local Sites Section */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>🏠 Local Sites (Local by Flywheel)</h2>
                    <button
                        onClick={handleScanSites}
                        disabled={scanning}
                        className={styles.scanButton}
                    >
                        {scanning ? '🔄 Scanning...' : '🔍 Scan Sites'}
                    </button>
                </div>

                {sites.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No Local Sites found</p>
                        <p className={styles.hint}>
                            Make sure Local by Flywheel is installed and has sites configured.
                        </p>
                    </div>
                ) : (
                    <div className={styles.siteGrid}>
                        {sites.map((site) => (
                            <div key={site.name} className={styles.siteCard}>
                                <div className={styles.siteHeader}>
                                    <h3>{site.name}</h3>
                                    <span className={`${styles.status} ${styles[site.status]}`}>
                                        {site.status === 'running' ? '🟢' : '🔴'} {site.status}
                                    </span>
                                </div>
                                <div className={styles.siteInfo}>
                                    <p><strong>URL:</strong> {site.url}</p>
                                    {site.phpVersion && <p><strong>PHP:</strong> {site.phpVersion}</p>}
                                    {site.wpVersion && <p><strong>WordPress:</strong> {site.wpVersion}</p>}
                                </div>
                                <div className={styles.siteActions}>
                                    {site.status === 'running' ? (
                                        <>
                                            <button onClick={() => handleOpenAdmin(site.url)}>
                                                🔗 Open Admin
                                            </button>
                                            <button onClick={() => handleStopSite(site.name)}>
                                                ⏹️ Stop
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleStartSite(site.name)}>
                                            ▶️ Start
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Docker WordPress Section */}
            {FEATURES.WORDPRESS_DOCKER && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>🐳 Docker WordPress</h2>
                    </div>

                    <div className={styles.siteGrid}>
                        {[1, 2, 3].map(siteId => (
                            <div key={siteId} className={`${styles.siteCard} ${styles.dockerSiteCard}`}>
                                <div className={styles.siteHeader}>
                                    <h3>Site #{siteId}</h3>
                                    <span className={`${styles.status} ${styles[dockerStatuses[siteId] || 'unknown']}`}>
                                        {dockerStatuses[siteId] === 'running' ? '🟢' : '🔴'} {dockerStatuses[siteId] || 'unknown'}
                                    </span>
                                </div>
                                <div className={styles.siteInfo}>
                                    <p><strong>URL:</strong> http://localhost:{8080 + siteId}</p>
                                    <p><strong>Port:</strong> {8080 + siteId}</p>
                                </div>
                                <div className={styles.siteActions}>
                                    {dockerStatuses[siteId] === 'running' ? (
                                        <>
                                            <button onClick={() => handleOpenAdmin(`http://localhost:${8080 + siteId}`)}>
                                                🔗 Open Admin
                                            </button>
                                            <button onClick={() => handleStopDocker(siteId)}>
                                                🛑 Stop
                                            </button>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                            <button onClick={() => handleStartDocker(siteId)}>
                                                ▶️ Start
                                            </button>
                                            <button
                                                onClick={() => handleUninstallDocker(siteId)}
                                                className={styles.dangerBtn}
                                            >
                                                🗑️ Delete / Reinstall
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* WordPress Playground Section */}
            {FEATURES.WORDPRESS_PLAYGROUND && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>👻 WordPress Playground</h2>
                    </div>
                    <div className={styles.playgroundCard}>
                        <p>Instant WordPress sandbox (WASM)</p>
                        <button
                            className={styles.playgroundButton}
                            onClick={() => setShowPlayground(true)}
                        >
                            🚀 Launch Sandbox
                        </button>
                        <p className={styles.hint}>
                            Zero setup, disposable WordPress instance for testing
                        </p>
                    </div>
                </section>
            )}

            {/* Playground Modal */}
            {showPlayground && (
                <div className={styles.modal} onClick={() => setShowPlayground(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button
                            className={styles.closeButton}
                            onClick={() => setShowPlayground(false)}
                        >
                            ✕
                        </button>
                        <WordPressPlayground />
                    </div>
                </div>
            )}

            {/* Docker Missing Modal */}
            {dockerMissing && (
                <div className={styles.modal} onClick={() => setDockerMissing(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeButton} onClick={() => setDockerMissing(false)}>✕</button>
                        <h2>🐳 Docker Not Found</h2>
                        <p>To run WordPress locally, you need Docker Desktop installed.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                            <h3>Download Docker Desktop:</h3>
                            <a href="https://docs.docker.com/desktop/setup/install/mac-install/" target="_blank" rel="noopener noreferrer"
                                style={{ padding: '10px', background: '#007bff', color: 'white', borderRadius: '5px', textDecoration: 'none', textAlign: 'center' }}>
                                🍎 macOS (Apple Silicon/Intel)
                            </a>
                            <a href="https://docs.docker.com/desktop/setup/install/windows-install/" target="_blank" rel="noopener noreferrer"
                                style={{ padding: '10px', background: '#007bff', color: 'white', borderRadius: '5px', textDecoration: 'none', textAlign: 'center' }}>
                                🪟 Windows
                            </a>
                            <a href="https://docs.docker.com/desktop/setup/install/linux/" target="_blank" rel="noopener noreferrer"
                                style={{ padding: '10px', background: '#007bff', color: 'white', borderRadius: '5px', textDecoration: 'none', textAlign: 'center' }}>
                                🐧 Linux
                            </a>
                        </div>
                        <p className={styles.hint} style={{ marginTop: '20px' }}>After installing, please restart RangerPlex.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

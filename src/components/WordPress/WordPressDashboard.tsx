/**
 * WordPress Dashboard Component
 * Displays WordPress sites and management controls (Electron mode only)
 */

import React, { useEffect, useState, useRef } from 'react';
import { FEATURES } from '../../utils/features';
import { wordPressService } from '../../services/wordPressService';
import type { WordPressSite } from '../../types/electron';
import { WordPressPlayground } from './WordPressPlayground';
import styles from './WordPressDashboard.module.css';

interface WordPressDashboardProps {
    onOpenBrowser?: (url: string) => void;
    onOpenFullScreen?: (url: string) => void;
    autoStart?: boolean;
}

export const WordPressDashboard: React.FC<WordPressDashboardProps> = ({ onOpenBrowser, onOpenFullScreen, autoStart = false }) => {
    const [sites, setSites] = useState<WordPressSite[]>([]);
    const [dockerStatuses, setDockerStatuses] = useState<{ [key: number]: string }>({});
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [showPlayground, setShowPlayground] = useState(false);
    const [hasAutoStarted, setHasAutoStarted] = useState(false);

    const [dockerMissing, setDockerMissing] = useState(false);
    const navGuardRef = useRef<{ [key: string]: number }>({});

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

    // Deprecated: kept for backward calls; replaced by guarded openWpPath version
    const handleOpenAdminLegacy = async (siteUrl: string) => {
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

    const getPreferredBaseUrl = () => {
        const runningDockerId = [1, 2, 3].find(id => dockerStatuses[id] === 'running');
        if (runningDockerId) {
            return `http://localhost:${8080 + runningDockerId}`;
        }

        const runningLocal = sites.find(site => site.status === 'running' && site.url);
        if (runningLocal?.url) {
            return runningLocal.url;
        }

        if (sites[0]?.url) {
            return sites[0].url;
        }

        return 'http://localhost:8081';
    };

    const openWpPath = (path: string) => {
        const now = Date.now();
        if (now - (navGuardRef.current[path] || 0) < 800) return;
        navGuardRef.current[path] = now;

        const base = getPreferredBaseUrl().replace(/\/$/, '');
        const targetUrl = `${base}${path}`;
        onOpenBrowser ? onOpenBrowser(targetUrl) : window.open(targetUrl, '_blank');
    };

    const handleOpenSettings = () => {
        openWpPath('/wp-admin/options-general.php');
    };

    const handleOpenAdmin = () => {
        openWpPath('/wp-admin/');
    };

    const handleOpenLogin = () => {
        openWpPath('/wp-login.php');
    };

    const handleOpenSitePanel = () => {
        const base = getPreferredBaseUrl().replace(/\/$/, '');
        onOpenBrowser ? onOpenBrowser(base) : window.open(base, '_blank');
    };

    const handleOpenSiteFullScreen = () => {
        const base = getPreferredBaseUrl().replace(/\/$/, '');
        onOpenFullScreen ? onOpenFullScreen(base) : window.open(base, '_blank');
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
                <div className={styles.headerActions}>
                    <button className={`${styles.newTabButton} ${styles.headerButton}`} onClick={handleOpenSiteFullScreen} title="Open WordPress site in full screen">
                        <i className={`fa-solid fa-expand ${styles.btnIcon}`}></i>
                        Full Screen
                    </button>
                    <button className={`${styles.newTabButton} ${styles.headerButton}`} onClick={handleOpenSitePanel} title="Open WordPress site in browser panel">
                        <i className={`fa-solid fa-window-restore ${styles.btnIcon}`}></i>
                        View Site
                    </button>
                    <button className={`${styles.newTabButton} ${styles.headerButton}`} onClick={handleOpenLogin}>
                        <i className={`fa-solid fa-right-to-bracket ${styles.btnIcon}`}></i>
                        WP Login
                    </button>
                    <button className={`${styles.newTabButton} ${styles.headerButton}`} onClick={handleOpenAdmin}>
                        <i className={`fa-solid fa-gauge-high ${styles.btnIcon}`}></i>
                        Admin
                    </button>
                    <button className={`${styles.newTabButton} ${styles.headerButton}`} onClick={handleOpenSettings}>
                        <i className={`fa-solid fa-gear ${styles.btnIcon}`}></i>
                        Settings
                    </button>
                </div>
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
                        <i className={`fa-solid ${scanning ? 'fa-arrows-rotate' : 'fa-magnifying-glass'} ${styles.btnIcon}`}></i>
                        {scanning ? 'Scanning...' : 'Scan Sites'}
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
                                            <button onClick={() => handleOpenAdminLegacy(site.url)}>
                                                <i className={`fa-solid fa-up-right-from-square ${styles.btnIcon}`}></i>
                                                Open Admin
                                            </button>
                                            <button onClick={() => handleStopSite(site.name)}>
                                                <i className={`fa-solid fa-stop ${styles.btnIcon}`}></i>
                                                Stop
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleStartSite(site.name)}>
                                            <i className={`fa-solid fa-play ${styles.btnIcon}`}></i>
                                            Start
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
                                            <button onClick={() => handleOpenAdminLegacy(`http://localhost:${8080 + siteId}`)}>
                                                <i className={`fa-solid fa-up-right-from-square ${styles.btnIcon}`}></i>
                                                Open Admin
                                            </button>
                                            <button onClick={() => handleStopDocker(siteId)}>
                                                <i className={`fa-solid fa-stop ${styles.btnIcon}`}></i>
                                                Stop
                                            </button>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                            <button onClick={() => handleStartDocker(siteId)}>
                                                <i className={`fa-solid fa-play ${styles.btnIcon}`}></i>
                                                Start
                                            </button>
                                            <button
                                                onClick={() => handleUninstallDocker(siteId)}
                                                className={styles.dangerBtn}
                                            >
                                                <i className={`fa-solid fa-trash ${styles.btnIcon}`}></i>
                                                Delete / Reinstall
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
                            <i className={`fa-solid fa-rocket ${styles.btnIcon}`}></i>
                            Launch Sandbox
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

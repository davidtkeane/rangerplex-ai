/**
 * WordPress Playground Component
 * Embeds WordPress Playground via iframe (secure, no dependencies)
 */

import React, { useState } from 'react';
import { FEATURES } from '../../utils/features';
import styles from './WordPressPlayground.module.css';

export const WordPressPlayground: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [playgroundUrl, setPlaygroundUrl] = useState('https://playground.wordpress.net/');

    // Check if WordPress features are available
    if (!FEATURES.WORDPRESS_PLAYGROUND) {
        return (
            <div className={styles.unavailable}>
                <h2>🚫 WordPress Playground Unavailable</h2>
                <p>WordPress Playground is only available in Electron mode.</p>
                <p>Run <code>npm run browser</code> to access this feature.</p>
            </div>
        );
    }

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleReset = () => {
        setIsLoading(true);
        // Force reload by changing URL slightly
        setPlaygroundUrl(`https://playground.wordpress.net/?reset=${Date.now()}`);
    };

    const handleOpenBlueprint = () => {
        // Open with a custom blueprint (example: install a plugin)
        const blueprint = {
            steps: [
                {
                    step: 'installPlugin',
                    pluginZipFile: {
                        resource: 'wordpress.org/plugins',
                        slug: 'classic-editor'
                    }
                }
            ]
        };

        const blueprintJson = encodeURIComponent(JSON.stringify(blueprint));
        setPlaygroundUrl(`https://playground.wordpress.net/#${blueprintJson}`);
        setIsLoading(true);
    };

    return (
        <div className={styles.playground}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2>👻 WordPress Playground</h2>
                    <p>Instant WordPress sandbox - No setup required</p>
                </div>
                <div className={styles.headerRight}>
                    <button onClick={handleReset} className={styles.resetButton}>
                        🔄 Reset Sandbox
                    </button>
                    <button onClick={handleOpenBlueprint} className={styles.blueprintButton}>
                        📦 Load with Classic Editor
                    </button>
                </div>
            </header>

            <div className={styles.playgroundContainer}>
                {isLoading && (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading WordPress Playground...</p>
                        <p className={styles.hint}>This may take a few seconds</p>
                    </div>
                )}

                <iframe
                    src={playgroundUrl}
                    className={styles.iframe}
                    onLoad={handleLoad}
                    title="WordPress Playground"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                />
            </div>

            <div className={styles.info}>
                <div className={styles.infoCard}>
                    <h3>ℹ️ About WordPress Playground</h3>
                    <ul>
                        <li>✅ Runs entirely in your browser (WASM)</li>
                        <li>✅ No server or database needed</li>
                        <li>✅ Perfect for testing themes and plugins</li>
                        <li>✅ Data is temporary (resets on refresh)</li>
                        <li>✅ Hosted by WordPress.org (always up-to-date)</li>
                    </ul>
                </div>

                <div className={styles.infoCard}>
                    <h3>🚀 Quick Tips</h3>
                    <ul>
                        <li><strong>Login:</strong> Username: <code>admin</code>, Password: <code>password</code></li>
                        <li><strong>Reset:</strong> Click "Reset Sandbox" to start fresh</li>
                        <li><strong>Blueprints:</strong> Load pre-configured WordPress setups</li>
                        <li><strong>Export:</strong> Download your work before closing</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

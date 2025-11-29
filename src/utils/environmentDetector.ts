/**
 * Detects if the application is running in Electron mode.
 */
export const isElectron = (): boolean => {
    return !!(
        typeof window !== 'undefined' &&
        (window as any).electronAPI
    );
};

/**
 * Checks if the VS Code Server is available (only in Electron).
 */
export const hasCodeServer = async (): Promise<boolean> => {
    if (!isElectron()) return false;

    try {
        // We check port 8081 where we spawn code-server
        const response = await fetch('http://localhost:8081/healthz');
        return response.ok;
    } catch {
        return false;
    }
};

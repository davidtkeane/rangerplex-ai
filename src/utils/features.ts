/**
 * Feature Detection Utilities
 * Determines which features are available based on runtime environment
 * 
 * RangerPlex operates in two modes:
 * - WEB MODE: npm start (browser-based, limited features)
 * - ELECTRON MODE: npm run browser (native app, full features)
 */

/**
 * Detects if the application is running in Electron
 * @returns true if running in Electron, false otherwise
 */
export const isElectron = (): boolean => {
  // Check if we're in a browser environment first
  if (typeof window === 'undefined') {
    return false;
  }

  // Method 1: Check for Electron-specific properties
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.indexOf(' electron/') > -1) {
    return true;
  }

  // Method 2: Check for window.electronAPI (injected by preload script)
  if (typeof (window as any).electronAPI !== 'undefined') {
    return true;
  }

  // Method 3: Check process type (if available)
  if (typeof (window as any).process === 'object' && 
      (window as any).process.type === 'renderer') {
    return true;
  }

  // Method 4: Check environment variable
  if (process.env.ELECTRON === 'true') {
    return true;
  }

  return false;
};

/**
 * Detects if Docker is available (Electron mode only)
 * @returns true if Docker is available
 */
export const isDockerAvailable = async (): Promise<boolean> => {
  if (!isElectron()) {
    return false;
  }

  // In Electron mode, we can check if Docker is installed
  // This will be implemented when we add the Electron IPC bridge
  try {
    if (typeof (window as any).electronAPI?.checkDocker === 'function') {
      return await (window as any).electronAPI.checkDocker();
    }
  } catch (error) {
    console.warn('Docker availability check failed:', error);
  }

  return false;
};

/**
 * Feature flags based on environment
 */
export const FEATURES = {
  // WordPress Integration (Electron only)
  WORDPRESS_INTEGRATION: isElectron(),
  WORDPRESS_LOCAL_SITES: isElectron(),
  WORDPRESS_DOCKER: isElectron(),
  WORDPRESS_PLAYGROUND: isElectron(),

  // VS Code Integration (Electron only)
  VSCODE_INTEGRATION: isElectron(),
  CODE_SERVER: isElectron(),

  // Docker Support (Electron only)
  DOCKER_SUPPORT: isElectron(),

  // File System Access (Electron only)
  FILE_SYSTEM_ACCESS: isElectron(),
  NATIVE_FILE_PICKER: isElectron(),

  // System Integration (Electron only)
  GLOBAL_HOTKEYS: isElectron(),
  SYSTEM_TRAY: isElectron(),
  NATIVE_NOTIFICATIONS: isElectron(),

  // Security Features (Electron only)
  PANIC_BUTTON: isElectron(),
  TOR_MODE: isElectron(),
  CREDENTIAL_VAULT: isElectron(),

  // Available in both modes
  MONACO_EDITOR: true,
  TERMINAL: true,
  BROWSER_TABS: true,
  AI_CHAT: true,
  BLOCKCHAIN: true,
} as const;

/**
 * Get runtime mode as a string
 */
export const getRuntimeMode = (): 'web' | 'electron' => {
  return isElectron() ? 'electron' : 'web';
};

/**
 * Log feature availability (for debugging)
 */
export const logFeatureStatus = (): void => {
  const mode = getRuntimeMode();
  console.log(`🎖️ RangerPlex Runtime Mode: ${mode.toUpperCase()}`);
  console.log('📋 Feature Availability:');
  
  Object.entries(FEATURES).forEach(([feature, enabled]) => {
    const icon = enabled ? '✅' : '❌';
    console.log(`  ${icon} ${feature}: ${enabled}`);
  });
};

// Auto-log on import in development
if (process.env.NODE_ENV === 'development') {
  logFeatureStatus();
}

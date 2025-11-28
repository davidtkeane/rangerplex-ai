export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  latestDate: string;
  latestMessage: string;
  htmlUrl: string;
  error?: string;
}

export const updateService = {
  async checkForUpdates(currentVersion: string = '0.0.0'): Promise<UpdateInfo> {
    try {
      // 1. Fetch package.json to get the latest version number (with cache-busting)
      const cacheBuster = `?t=${Date.now()}`;
      const pkgResponse = await fetch(`https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/package.json${cacheBuster}`);
      if (!pkgResponse.ok) {
        throw new Error(`GitHub API Error: ${pkgResponse.statusText}`);
      }
      const remotePkg = await pkgResponse.json();
      const remoteVersion = remotePkg.version;

      // 2. Fetch latest commit for details
      const commitResponse = await fetch('https://api.github.com/repos/davidtkeane/rangerplex-ai/commits/main');
      const commitData = await commitResponse.json();

      const latestCommit = commitData.sha.substring(0, 7);
      const message = commitData.commit.message;
      const date = new Date(commitData.commit.author.date).toLocaleDateString();
      const htmlUrl = commitData.html_url;

      // 3. Compare versions using semver logic
      const hasUpdate = this.isNewerVersion(remoteVersion, currentVersion);

      return {
        hasUpdate,
        latestVersion: remoteVersion,
        latestDate: date,
        latestMessage: message,
        htmlUrl: htmlUrl
      };
    } catch (error) {
      console.error('Update check failed:', error);
      return {
        hasUpdate: false,
        latestVersion: '',
        latestDate: '',
        latestMessage: '',
        htmlUrl: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  // Helper function to compare semver versions
  isNewerVersion(remote: string, local: string): boolean {
    const parseVersion = (v: string) => {
      const cleaned = v.replace(/^v/, '');
      return cleaned.split('.').map(n => parseInt(n) || 0);
    };

    const [rMajor, rMinor, rPatch] = parseVersion(remote);
    const [lMajor, lMinor, lPatch] = parseVersion(local);

    if (rMajor > lMajor) return true;
    if (rMajor < lMajor) return false;
    if (rMinor > lMinor) return true;
    if (rMinor < lMinor) return false;
    return rPatch > lPatch;
  }
};

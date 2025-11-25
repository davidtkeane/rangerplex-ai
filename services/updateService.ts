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
      // 1. Fetch package.json to get the latest version number
      const pkgResponse = await fetch('https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/package.json');
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

      // 3. Compare versions
      // Simple string comparison for now, assuming standard semver increases
      const hasUpdate = remoteVersion !== currentVersion;

      return {
        hasUpdate,
        latestVersion: remoteVersion, // Use semver as the primary version identifier
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
  }
};

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  latestDate: string;
  latestMessage: string;
  htmlUrl: string;
  error?: string;
}

export const updateService = {
  async checkForUpdates(): Promise<UpdateInfo> {
    try {
      const response = await fetch('https://api.github.com/repos/davidtkeane/rangerplex-ai/commits/main');
      
      if (!response.ok) {
        throw new Error(`GitHub API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const latestCommit = data.sha.substring(0, 7);
      const message = data.commit.message;
      const date = new Date(data.commit.author.date).toLocaleDateString();
      const htmlUrl = data.html_url;

      // In a real app, we'd compare with a local version.
      // For now, we just report the latest version from GitHub.
      
      return {
        hasUpdate: true, // Always show as available for now, or logic to compare
        latestVersion: latestCommit,
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

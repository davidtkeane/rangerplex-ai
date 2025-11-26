# 🚀 Feature Design: System Update Checker

**Objective**: Enable RangerPlex AI users to check for the latest updates from the official GitHub repository directly within the application settings.

## 📋 Overview
Users need a way to know if they are running the latest version of RangerPlex AI. This feature adds a "Check for Updates" mechanism that queries the GitHub repository and provides visual feedback on the current version status.

## 🛠️ Technical Implementation

### 1. GitHub API Integration
- **Endpoint**: `https://api.github.com/repos/davidtkeane/rangerplex-ai/commits/main` (or `/releases/latest` if we start using releases).
- **Method**: `GET`
- **Logic**:
  - Fetch the latest commit hash/date from GitHub.
  - Compare it with a local version identifier (e.g., `build_date` or `commit_hash` stored in `package.json` or a `version.ts` file).
  - *Note*: Since this is a local app often run via `npm start`, "version" might be best approximated by checking if the local `HEAD` matches the remote `HEAD`, or simply showing the latest commit message and asking the user to verify.
  - **Simpler Approach for v1**: Just fetch the latest commit info and display it: "Latest version: [Date] - [Message]". User can compare with their own knowledge or we display the current app build date.

### 2. UI Components
- **Location**: `SettingsModal.tsx` -> **Help** tab (or a new **System** tab).
- **Elements**:
  - **Button**: "Check for Updates" (with loading spinner).
  - **Status Display**:
    - ✅ "You are up to date."
    - 🚀 "Update Available! (Latest: [Date])"
    - 🔗 Link to GitHub repository.

### 3. Service Layer
- **File**: `src/services/updateService.ts` (New)
- **Functions**:
  - `checkForUpdates()`: Returns `{ hasUpdate: boolean, latestVersion: string, latestUrl: string }`.

## 📝 Integration Plan (Mission B)
This feature will be added to **Mission B: System Management Suite**.

### Tasks
1.  **Create `updateService.ts`**: Handle GitHub API requests.
2.  **Update `SettingsModal.tsx`**: Add the UI section in the Help tab.
3.  **Add Version Tracking**: Add a `buildInfo.ts` or similar to track the current running version (optional for v1, can just show remote info).

## 🎯 Success Metrics
- Users can click a button and see the latest commit message from GitHub.
- UI handles network errors gracefully.
- Provides a direct link to the repo for manual updating (git pull).

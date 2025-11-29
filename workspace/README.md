# RangerPlex AI Workspace

This is a sandboxed folder where AI models can safely read and write files.

## Directory Structure

```
workspace/
├── projects/     # AI-assisted project files
├── uploads/      # Files uploaded for AI processing
├── temp/         # Temporary files (auto-cleaned)
└── shared/       # Files shared between sessions
```

## Usage

### Available Operations
AI models can perform these operations within this workspace:

- **Read files** - View any file in the workspace
- **Write files** - Create or overwrite files
- **Edit files** - Make line-based edits to existing files
- **List directories** - See folder contents
- **Search files** - Find files by name pattern
- **Move/rename** - Reorganize files
- **Create directories** - Make new folders
- **Get file info** - View metadata (size, dates, etc.)

### Security

- AI access is **sandboxed** to this folder only
- Cannot access files outside `/workspace`
- Cannot execute programs or scripts
- All operations are logged

### Commands in RangerPlex

Use these slash commands to interact with the workspace:

```
/workspace list          - List workspace contents
/workspace read <file>   - Read a file
/workspace write <file>  - Write to a file (prompts for content)
/workspace search <term> - Search for files
```

## Folder Purposes

### `/projects`
Store ongoing project files that AI helps you work on.
Example: code snippets, drafts, configurations

### `/uploads`
Drop files here that you want AI to analyze or process.
Example: documents, images, data files

### `/temp`
Temporary working files. May be cleaned periodically.
Example: intermediate processing results

### `/shared`
Files meant to persist across multiple chat sessions.
Example: reference documents, templates

---

*RangerPlex AI v2.13.6 - Workspace Feature*

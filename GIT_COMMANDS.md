# Git Commands Cheat Sheet for RangerPlex AI

## Table of Contents
1. [Understanding Git Pull Errors](#understanding-git-pull-errors)
2. [Decision Trees for Common Errors](#decision-trees-for-common-errors)
3. [Basic Daily Workflow](#basic-daily-workflow)
4. [Viewing Changes](#viewing-changes)
5. [Undoing Things](#undoing-things)
6. [Stashing](#stashing-temporary-storage)
7. [Branches](#branches)
8. [Handling Merge Conflicts](#handling-merge-conflicts)
9. [Syncing Between Machines](#syncing-between-machines-m3pro--m4max)
10. [Multi-File Commits with Detailed Messages](#multi-file-commits-with-detailed-messages)
11. [Checking Remote Status](#checking-remote-status)
12. [Clean Up](#clean-up)
13. [Emergency Commands](#emergency-commands)
14. [Quick Reference](#quick-reference)

---

## Understanding Git Pull Errors

### Error 1: "Your local changes would be overwritten"

```
error: Your local changes to the following files would be overwritten by merge:
    package-lock.json
Please commit your changes or stash them before you merge.
Aborting
```

**What it means:**
- You changed a file locally
- Someone else (or you on another machine) changed the same file on GitHub
- Git refuses to overwrite your local work

**Decision Tree:**

| Question | If YES | If NO |
|----------|--------|-------|
| Is it `package-lock.json` or `package.json`? | Discard local: `git checkout -- package-lock.json` | Go to next question |
| Is it a generated file (`.lock`, `dist/`, `build/`)? | Discard local: `git checkout -- filename` | Go to next question |
| Did YOU make important changes to this file? | Stash: `git stash` → `git pull` → `git stash pop` | Discard: `git checkout -- filename` |
| Do you want BOTH versions merged? | Commit yours: `git add . && git commit -m "msg"` → `git pull` | Pick one version |

**Quick Fixes:**
```bash
# Fix for package-lock.json (most common)
git checkout -- package-lock.json && git pull

# Fix for any single file you don't care about
git checkout -- path/to/file && git pull

# Fix when you want to save your changes
git stash && git pull && git stash pop
```

---

### Error 2: "Untracked working tree files would be overwritten"

```
error: The following untracked working tree files would be overwritten by merge:
    FIXES_2025-12-01.md
Please move or remove them before you merge.
Aborting
```

**What it means:**
- You have a NEW file locally that was never committed
- Someone else created a file with the SAME NAME on GitHub
- Git doesn't know which one you want

**Decision Tree:**

| Question | If YES | If NO |
|----------|--------|-------|
| Is your local file important? | Move it: `mv FILE ~/FILE.backup` → `git pull` → compare versions | Delete it: `rm FILE` → `git pull` |
| Do you want YOUR version? | Move remote's: `git pull` will fail, so rename yours first, pull, then compare | Use remote's: `rm FILE` → `git pull` |
| Are they the same file? | Delete yours: `rm FILE` → `git pull` | Keep both with different names |

**Quick Fixes:**
```bash
# Backup your file, then pull
mv FIXES_2025-12-01.md ~/FIXES_2025-12-01.md.backup && git pull

# Or just delete it if you don't need it
rm FIXES_2025-12-01.md && git pull

# Or add it to git first (if you want to keep yours)
git add FIXES_2025-12-01.md && git commit -m "Add fixes doc" && git pull
```

---

### Error 3: "You have divergent branches"

```
hint: You have divergent branches and need to specify how to reconcile them.
hint: You can do so by running one of the following commands sometime before
hint: your next pull:
hint:
hint:   git config pull.rebase false  # merge
hint:   git config pull.rebase true   # rebase
hint:   git config pull.ff only       # fast-forward only
```

**What it means:**
- Your local branch and remote branch have BOTH moved forward
- Git doesn't know if you want to merge or rebase

**Decision Tree:**

| Question | If YES | If NO |
|----------|--------|-------|
| Do you understand rebasing? | Your choice | Use merge (safer) |
| Is this a shared branch (main/master)? | Use merge: `git pull --no-rebase` | Rebase is OK: `git pull --rebase` |
| Do you want to set a default? | Run: `git config pull.rebase false` | Specify each time |

**Quick Fixes:**
```bash
# Just merge (safest, creates merge commit)
git pull --no-rebase

# Or set merge as default forever
git config --global pull.rebase false
git pull
```

---

### Error 4: "CONFLICT (content)"

```
Auto-merging components/RadioPlayer.tsx
CONFLICT (content): Merge conflict in components/RadioPlayer.tsx
Automatic merge failed; fix conflicts and then commit the result.
```

**What it means:**
- Git tried to merge but found conflicting changes on the SAME LINES
- You must manually choose which version to keep

**Decision Tree:**

| Question | If YES | If NO |
|----------|--------|-------|
| Do you know which version is correct? | Edit file, remove conflict markers, save | Open in VS Code to compare |
| Do you want to abort and start over? | Run: `git merge --abort` | Continue fixing |
| Is this too complicated? | Abort: `git merge --abort`, then ask for help | Fix it yourself |

**How conflicts look in the file:**
```
<<<<<<< HEAD
Your local changes are here
=======
Remote changes are here
>>>>>>> origin/main
```

**Quick Fixes:**
```bash
# Option 1: Keep YOUR version of the file
git checkout --ours path/to/file
git add path/to/file

# Option 2: Keep THEIR (remote) version
git checkout --theirs path/to/file
git add path/to/file

# Option 3: Abort the merge entirely
git merge --abort

# Option 4: After manually editing, mark as resolved
git add path/to/file
git commit -m "Resolve merge conflict"
```

---

### Error 5: "Cannot pull with rebase: You have unstaged changes"

```
error: cannot pull with rebase: You have unstaged changes.
error: please commit or stash them.
```

**What it means:**
- You have modified files that aren't staged
- Git can't rebase with uncommitted work

**Decision Tree:**

| Question | If YES | If NO |
|----------|--------|-------|
| Are your changes ready to commit? | Commit: `git add . && git commit -m "msg"` → `git pull` | Stash them |
| Do you want to save changes for later? | Stash: `git stash` → `git pull` → `git stash pop` | Discard: `git checkout -- .` |

**Quick Fix:**
```bash
git stash && git pull && git stash pop
```

---

### Error 6: "fatal: Not a git repository"

```
fatal: not a git repository (or any of the parent directories): .git
```

**What it means:**
- You're not inside a git project folder
- Or the `.git` folder was deleted

**Quick Fix:**
```bash
# Navigate to your project
cd /path/to/rangerplex-ai

# Verify it's a git repo
ls -la .git
```

---

### Error 7: "Permission denied (publickey)"

```
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.
```

**What it means:**
- Your SSH key isn't set up or isn't recognized by GitHub

**Decision Tree:**

| Question | If YES | If NO |
|----------|--------|-------|
| Do you have an SSH key? | Check: `ls ~/.ssh/id_*` | Create one: `ssh-keygen -t ed25519` |
| Is it added to GitHub? | Test: `ssh -T git@github.com` | Add it at github.com/settings/keys |
| Want to use HTTPS instead? | Change remote URL (see below) | Fix SSH setup |

**Quick Fixes:**
```bash
# Switch to HTTPS (easier)
git remote set-url origin https://github.com/davidtkeane/rangerplex-ai.git

# Or test SSH connection
ssh -T git@github.com

# Or use credential manager
git config --global credential.helper osxkeychain
```

---

### Error 8: "refusing to merge unrelated histories"

```
fatal: refusing to merge unrelated histories
```

**What it means:**
- The local and remote repos have completely different histories
- Usually happens with fresh clones or repo resets

**Quick Fix:**
```bash
git pull origin main --allow-unrelated-histories
```

---

### Error 9: "Your branch is behind"

```
Your branch is behind 'origin/main' by 3 commits, and can be fast-forwarded.
```

**What it means:**
- This is NOT an error! It's just information
- Remote has new commits you don't have locally

**Quick Fix:**
```bash
git pull
```

---

### Error 10: "Your branch is ahead"

```
Your branch is ahead of 'origin/main' by 2 commits.
```

**What it means:**
- You have commits locally that aren't on GitHub yet
- You need to push

**Quick Fix:**
```bash
git push
```

---

## Decision Trees for Common Errors

### Master Decision Tree: "git pull failed"

```
git pull failed
    │
    ├── "local changes would be overwritten"
    │       │
    │       ├── Is it package-lock.json? → git checkout -- package-lock.json && git pull
    │       │
    │       ├── Important changes? → git stash && git pull && git stash pop
    │       │
    │       └── Don't care? → git checkout -- filename && git pull
    │
    ├── "untracked files would be overwritten"
    │       │
    │       ├── Need your file? → mv FILE ~/FILE.backup && git pull
    │       │
    │       └── Don't need it? → rm FILE && git pull
    │
    ├── "CONFLICT"
    │       │
    │       ├── Too complex? → git merge --abort
    │       │
    │       ├── Want yours? → git checkout --ours FILE && git add FILE
    │       │
    │       └── Want theirs? → git checkout --theirs FILE && git add FILE
    │
    ├── "divergent branches"
    │       │
    │       └── Just merge → git pull --no-rebase
    │
    └── "unstaged changes"
            │
            └── Stash first → git stash && git pull && git stash pop
```

---

## Common Scenarios

### Scenario: I just want to throw away everything local and get fresh from GitHub

```bash
# Nuclear option - discards ALL local changes
git fetch origin
git reset --hard origin/main
```

### Scenario: I want to see what would happen before I pull

```bash
# Fetch without merging
git fetch origin

# See what's different
git diff main origin/main

# See commit list
git log main..origin/main --oneline
```

### Scenario: I accidentally started editing on wrong branch

```bash
# Stash your changes
git stash

# Switch to correct branch
git checkout correct-branch

# Apply your changes there
git stash pop
```

---

## Basic Daily Workflow

```bash
# Check status
git status

# Pull latest changes
git pull

# Make your changes to files...

# Stage all changes
git add .

# Or stage specific files
git add path/to/file1.tsx path/to/file2.ts

# Commit with message
git commit -m "feat: Description of what you did"

# Push to remote
git push
```

---

## Viewing Changes

```bash
# See what files changed
git status

# See detailed changes (diff)
git diff

# See changes for specific file
git diff path/to/file.tsx

# See staged changes (already added)
git diff --staged

# See recent commits
git log --oneline -10

# See what changed in last commit
git show
```

---

## Undoing Things

```bash
# Discard changes to a file (before staging)
git checkout -- path/to/file.tsx

# Unstage a file (after git add, before commit)
git reset HEAD path/to/file.tsx

# Undo last commit but keep changes
git reset --soft HEAD~1

# Undo last commit and discard changes (DANGEROUS)
git reset --hard HEAD~1

# Revert a specific commit (creates new commit)
git revert COMMIT_HASH
```

---

## Stashing (Temporary Storage)

```bash
# Stash current changes
git stash

# Stash with a name
git stash save "WIP: radio player fixes"

# List all stashes
git stash list

# Apply most recent stash (keeps it in stash list)
git stash apply

# Apply and remove most recent stash
git stash pop

# Apply specific stash
git stash apply stash@{2}

# Delete a stash
git stash drop stash@{0}

# Clear all stashes
git stash clear
```

---

## Branches

```bash
# List all branches
git branch -a

# Create new branch
git checkout -b feature/my-new-feature

# Switch to existing branch
git checkout main

# Delete local branch
git branch -d branch-name

# Push new branch to remote
git push -u origin feature/my-new-feature

# Merge branch into current branch
git merge feature/my-new-feature
```

---

## Handling Merge Conflicts

When you see conflict markers in files:
```
<<<<<<< HEAD
Your local changes
=======
Remote changes
>>>>>>> origin/main
```

```bash
# 1. Open the file and manually edit to resolve
# 2. Remove the conflict markers (<<<<, ====, >>>>)
# 3. Stage the resolved file
git add path/to/resolved-file.tsx

# 4. Continue the merge
git commit -m "Resolve merge conflicts"

# Or abort the merge entirely
git merge --abort
```

---

## Syncing Between Machines (M3Pro & M4Max)

### On M4Max (make changes):
```bash
git add .
git commit -m "fix: Radio player and sync service improvements"
git push
```

### On M3Pro (get changes):
```bash
git pull
```

### If M3Pro has local changes blocking pull:
```bash
# For package-lock.json (most common)
git checkout -- package-lock.json && git pull

# For other files you want to keep
git stash && git pull && git stash pop

# Resolve any conflicts, then commit
git add .
git commit -m "Merge M4Max and M3Pro changes"
git push
```

---

## Multi-File Commits with Detailed Messages

When committing multiple related files with detailed explanations (like documentation updates, feature additions, or large refactors):

### Pattern: Staging Specific Files

```bash
# Check what's changed first
git status

# Stage specific files (more control than 'git add .')
git add file1.md file2.js file3.cpp

# Or stage entire directories
git add docs/ src/

# Verify what's staged
git status
```

**Why stage specific files?**
- More control over what goes in each commit
- Keep commits focused on one logical change
- Easier to review and understand commit history

### Pattern: Multi-line Commit Messages with Heredoc

For commits with detailed descriptions:

```bash
git commit -m "$(cat <<'EOF'
Short summary line (50 chars or less)

Detailed explanation of what changed and why. This can be multiple
paragraphs explaining the context, the problem being solved, and
the approach taken.

New Features:
- Feature 1 description
- Feature 2 description
- Feature 3 description

Modified Files:
- file1.js: Description of changes
- file2.ts: Description of changes

Testing:
- All tests passing
- Verified on Windows 11 and macOS

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Heredoc Syntax Breakdown:**
```bash
git commit -m "$(cat <<'EOF'
               ↑    ↑   ↑
               |    |   └── Start marker (must match end marker)
               |    └────── Here-document operator
               └─────────── Command substitution (runs cat)
# Your multi-line message here
EOF
)"
↑
└── End marker (must match start marker)
```

**Key Points:**
- `'EOF'` (with quotes) prevents variable expansion
- Message can contain special characters, quotes, emoji
- Easier to write multi-paragraph messages than using multiple `-m` flags
- Great for comprehensive commit messages with lists and sections

### Pattern: Handling "Push Rejected" Errors

```
! [rejected]        main -> main (fetch first)
error: failed to push some refs
hint: Updates were rejected because the remote contains work that you do not have locally.
```

**What it means:**
- Someone else (or you on another machine) pushed commits to GitHub
- Your local branch is behind the remote branch
- You need to pull first, then push

**Solution 1: Pull with Rebase (Clean History)**
```bash
# Pull and rebase your commits on top of remote changes
git pull --rebase

# If successful, push
git push
```

**Benefits of rebase:**
- ✅ Creates linear history (no merge commits)
- ✅ Cleaner git log
- ✅ Easier to understand project history

**Solution 2: Pull with Merge (Safer)**
```bash
# Pull and create a merge commit
git pull --no-rebase

# Push the merge
git push
```

**When to use each:**

| Use Rebase When | Use Merge When |
|-----------------|----------------|
| Working on personal branches | Working on shared branches with team |
| Want clean linear history | Want to preserve exact timeline |
| Commits are not yet public | Commits are already public |
| Comfortable with git | New to git (safer) |

### Pattern: Check Before Push

```bash
# See if remote has new commits
git fetch

# Compare your branch to remote
git status
# Shows: "Your branch is ahead/behind/diverged"

# See what commits are different
git log main..origin/main --oneline  # Remote commits you don't have
git log origin/main..main --oneline  # Your commits not on remote

# See actual code differences
git diff origin/main

# If behind, pull first
git pull --rebase

# Then push
git push
```

### Complete Workflow Example: Windows Compatibility Update

This was the actual workflow from the Windows 11 compatibility session:

```bash
# 1. Check what files changed
git status

# Output showed:
# Untracked files:
#   .npmrc
#   BROWSER_FIX.md
#   INSTALL_SUMMARY.md
#   scripts/shutdown.ps1
#   scripts/open-browser.cjs
#   ...

# 2. Stage specific files (not everything)
git add .npmrc BROWSER_FIX.md INSTALL_SUMMARY.md START_WINDOWS.md \
        WINDOWS_SETUP.md scripts/open-browser.cjs scripts/shutdown.ps1 \
        setup-node22.ps1 .gitignore

# 3. Verify staging
git status

# 4. Commit with detailed message using heredoc
git commit -m "$(cat <<'EOF'
Add Windows 11 compatibility files and documentation

Added Windows-specific scripts, configuration, and comprehensive documentation
to ensure smooth installation and operation on Windows 11.

New Files:
- .npmrc: Skip node-pty build on Windows (requires VS Build Tools)
- scripts/shutdown.ps1: PowerShell port cleanup script
- scripts/open-browser.cjs: Cross-platform browser auto-launcher
- setup-node22.ps1: Helper script for Node.js 22 setup via nvm
- WINDOWS_SETUP.md: Detailed Windows troubleshooting guide
- START_WINDOWS.md: Quick start guide for Windows users
- INSTALL_SUMMARY.md: Complete technical fix documentation
- BROWSER_FIX.md: Browser command fix technical details

Modified:
- .gitignore: Exclude .env.bak and *.bak.* backup files

These changes enable full Windows 11 support alongside existing macOS/Linux
compatibility, with comprehensive documentation for troubleshooting.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Output:
# [main d84488c] Add Windows 11 compatibility files and documentation
#  9 files changed, 899 insertions(+)

# 5. Try to push
git push

# Error! Remote has new commits
# ! [rejected]        main -> main (fetch first)

# 6. Pull with rebase to maintain clean history
git pull --rebase

# Output:
# From https://github.com/davidtkeane/rangerplex-ai
#    d84488c..edf8470  main       -> origin/main
# Rebasing (1/1)
# Successfully rebased and updated refs/heads/main.

# 7. Now push successfully
git push

# Output:
# To https://github.com/davidtkeane/rangerplex-ai.git
#    edf8470..c0639c0  main -> main
```

### Pattern: Short Status for Quick Checks

```bash
# Compact status view
git status --short

# Output format:
# ?? untracked-file.md      (new file, not staged)
# M  modified-file.js       (modified, staged)
#  M modified-file2.js      (modified, not staged)
# A  added-file.cpp         (new file, staged)
# D  deleted-file.txt       (deleted)
# R  old.md -> new.md       (renamed)
```

**Status Symbols:**
- `??` = Untracked (new file Git doesn't know about)
- `A` = Added (new file staged)
- `M` = Modified (file changed)
- `D` = Deleted
- `R` = Renamed
- First column = staging area status
- Second column = working directory status

### Pattern: View Recent Commits

```bash
# See last 5 commits (one line each)
git log --oneline -5

# Output:
# c0639c0 Add C++ companion project framework
# edf8470 Resolved merge conflict - Combined Windows 11 fixes
# d84488c Add Windows 11 compatibility files
# f6befd0 Merge branch 'main' of https://github.com/...
# b887dd6 fixed the windows install script

# See last 3 commits with more detail
git log -3

# See commits with file changes
git log --oneline --stat -3

# See commits with actual diff
git log -p -2
```

### Real-World Example: C++ Project Addition

```bash
# 1. Create new files
mkdir -p cpp/modules/hello-world
# ... created multiple files ...

# 2. Check what's new
git status --short
# ?? CPP_PROJECT.md
# ?? CPP_ROADMAP.md
# ?? CPP_SETUP.md
# ?? cpp/

# 3. Stage all new C++ files
git add CPP_PROJECT.md CPP_ROADMAP.md CPP_SETUP.md cpp/

# 4. Verify staging
git status
# Changes to be committed:
#   new file:   CPP_PROJECT.md
#   new file:   CPP_ROADMAP.md
#   new file:   CPP_SETUP.md
#   new file:   cpp/modules/hello-world/CMakeLists.txt
#   ... etc ...

# 5. Commit with comprehensive message
git commit -m "$(cat <<'EOF'
Add C++ companion project framework and learning path

Created comprehensive C++ development framework for RangerPlex to support
applying C++ and Assembly language class concepts to real-world projects.

New Documentation (3 files):
- CPP_ROADMAP.md: 3-phase development plan (Native Modules → Tools → Embedded)
- CPP_SETUP.md: Complete Windows 11 C++ environment setup guide
- CPP_PROJECT.md: Quick reference and daily development guide

Starter Project - hello-world Native Module (6 files):
- hello.cpp: First C++ N-API module with 3 example functions
- CMakeLists.txt: Cross-platform build configuration
- package.json: npm integration for native modules
- index.js: JavaScript wrapper for C++ module
- test.js: Comprehensive test suite
- README.md: Step-by-step tutorial

This framework allows applying C++ class knowledge to enhance RangerPlex
with high-performance native modules.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# 6. View the commit
git log --oneline -1
# 57ad28e Add C++ companion project framework and learning path

# 7. Try to push
git push
# Error: rejected (remote has changes)

# 8. Pull with rebase
git pull --rebase
# Successfully rebased and updated refs/heads/main.

# 9. Push successfully
git push
# To https://github.com/davidtkeane/rangerplex-ai.git
#    edf8470..c0639c0  main -> main
```

### Tips for Better Commits

**DO:**
- ✅ Write clear, descriptive commit messages
- ✅ Use present tense ("Add feature" not "Added feature")
- ✅ Group related changes in one commit
- ✅ Stage specific files for focused commits
- ✅ Pull before push to avoid conflicts
- ✅ Use heredoc for multi-line messages
- ✅ Include "why" not just "what" in message

**DON'T:**
- ❌ Commit with generic messages like "update" or "fix"
- ❌ Mix unrelated changes in one commit
- ❌ Forget to pull before starting work
- ❌ Force push without understanding consequences
- ❌ Commit sensitive data (API keys, passwords)
- ❌ Commit generated files (dist/, build/, node_modules/)

### Commit Message Template

```bash
git commit -m "$(cat <<'EOF'
<type>: <short summary in present tense>

<Detailed description of what changed and why>

<Optional sections:>
- New Features:
- Bug Fixes:
- Breaking Changes:
- Documentation:
- Testing:
- Performance:

<Optional footer:>
Fixes #123
Closes #456
Related to #789

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Common types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code formatting (no functional changes)
- `refactor:` Code restructuring (no functional changes)
- `test:` Adding or updating tests
- `chore:` Maintenance tasks (dependencies, config)
- `perf:` Performance improvements

---

## Checking Remote Status

```bash
# See remote URLs
git remote -v

# Fetch remote changes without merging
git fetch

# See difference between local and remote
git diff main origin/main

# See commits on remote not in local
git log main..origin/main --oneline
```

---

## Clean Up

```bash
# Remove untracked files (dry run first)
git clean -n

# Actually remove untracked files
git clean -f

# Remove untracked files and directories
git clean -fd

# Remove ignored files too
git clean -fdx
```

---

## Useful Aliases (Add to ~/.gitconfig)

```ini
[alias]
    s = status
    co = checkout
    br = branch
    ci = commit
    lg = log --oneline --graph --decorate -10
    last = log -1 HEAD
    unstage = reset HEAD --
    undo = reset --soft HEAD~1
```

To add these:
```bash
git config --global alias.s status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.lg "log --oneline --graph --decorate -10"
```

---

## Emergency Commands

```bash
# I messed everything up, start fresh from remote
git fetch origin
git reset --hard origin/main

# I accidentally deleted a file
git checkout HEAD -- path/to/deleted-file.tsx

# Find a lost commit
git reflog

# Restore from reflog
git checkout HEAD@{2}
```

---

## Quick Reference

| What you want | Command |
|---------------|---------|
| Check status | `git status` |
| Pull changes | `git pull` |
| Stage all | `git add .` |
| Commit | `git commit -m "message"` |
| Push | `git push` |
| Discard file changes | `git checkout -- file` |
| Stash changes | `git stash` |
| Unstash changes | `git stash pop` |
| View log | `git log --oneline -10` |
| View diff | `git diff` |
| Abort merge | `git merge --abort` |
| Reset to remote | `git reset --hard origin/main` |

---

## Common File-Specific Decisions

| File | Usually do... |
|------|---------------|
| `package-lock.json` | Discard local: `git checkout -- package-lock.json` |
| `package.json` | Stash and merge carefully |
| `.env` files | Should be in `.gitignore` |
| `node_modules/` | Should be in `.gitignore` |
| `dist/` or `build/` | Discard local, regenerate after pull |
| Your source code (`.tsx`, `.ts`) | Stash or commit, then merge carefully |
| Config files (`.json`, `.yaml`) | Review changes, merge manually if needed |

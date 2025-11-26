# Git Workflow for RangerPlex (Quick Reference)

**Author**: AIRanger Claude
**Date**: Nov 26, 2025
**Audience**: Commander David and future collaborators

---

## 1. Quick Commands (Copy-Paste Ready)

### Check Status
```bash
# See what files changed
git status

# See detailed changes
git diff
```

### Save Your Changes
```bash
# Stage ALL changes
git add .

# Stage specific file
git add path/to/file.ts

# Commit with message
git commit -m "Brief description of what you did"

# Push to GitHub
git push origin main
```

### Get Updates from GitHub
```bash
# Pull latest changes
git pull origin main

# If you get conflicts, Git will tell you which files
# Open those files, look for <<<<<<< and >>>>>>> markers
# Fix them, then:
git add .
git commit -m "Resolved merge conflicts"
git push origin main
```

---

## 2. Common Workflows

### Workflow 1: Uploading Your Work
```bash
# 1. See what you changed
git status

# 2. Stage everything
git add .

# 3. Commit with meaningful message
git commit -m "Added terminal persistence system"

# 4. Push to GitHub
git push origin main
```

### Workflow 2: Getting Updates from Collaborators
```bash
# 1. Save your current work first!
git add .
git commit -m "Work in progress - before pulling updates"

# 2. Pull latest changes
git pull origin main

# 3. If conflicts occur, resolve them (see Section 4)
```

### Workflow 3: Starting a New Feature
```bash
# 1. Make sure you're up to date
git pull origin main

# 2. Create a new branch (optional but recommended)
git checkout -b feature/my-new-feature

# 3. Work on your feature...
# ... make changes ...

# 4. Commit your work
git add .
git commit -m "Implemented my new feature"

# 5. Push the branch
git push origin feature/my-new-feature

# 6. Create Pull Request on GitHub website (optional)
```

---

## 3. Understanding Git Branches

**What is a branch?**
- Think of it like a parallel universe for your code
- `main` = production-ready code
- `feature/xyz` = experimental work-in-progress

**Why use branches?**
- Keeps main branch stable
- Allows multiple people to work simultaneously
- Easy to abandon bad ideas without affecting main

**Common commands:**
```bash
# See all branches
git branch

# Create new branch
git checkout -b feature/new-thing

# Switch to existing branch
git checkout main

# Delete branch
git branch -d feature/old-thing
```

---

## 4. Handling Merge Conflicts

**What's a conflict?**
- Happens when you and someone else changed the same line
- Git doesn't know which version to keep

**How to resolve:**
```bash
# 1. Git will tell you which files have conflicts
git status

# 2. Open the conflicted file(s)
# Look for these markers:
<<<<<<< HEAD
Your changes
=======
Their changes
>>>>>>> origin/main

# 3. Edit the file to keep what you want
# Remove the <<<, ===, >>> markers

# 4. Stage the resolved file
git add path/to/resolved/file.ts

# 5. Complete the merge
git commit -m "Resolved merge conflict in file.ts"

# 6. Push
git push origin main
```

---

## 5. Protecting Private Data

### What Gets Committed?
✅ **YES - Commit These:**
- Source code (.ts, .tsx, .js, .jsx)
- Configuration files (package.json, tsconfig.json)
- Documentation (.md files)
- SQL schemas (templates only)
- Example JSON files (dummy data only)

❌ **NO - NEVER Commit These:**
- Actual database files (.sqlite3, .db)
- User state files (*_phantom_state.json in root data/vault/)
- API keys and secrets (.env files)
- Personal logs
- node_modules/ (already in .gitignore)
- Build outputs (dist/, build/)

### How .gitignore Works
The file `./data/vault/.gitignore` tells Git to IGNORE certain files:

```gitignore
# This protects user data from being uploaded
*.sqlite3
*_phantom_state.json

# But allows documentation
!README.md
!schemas/
!examples/
```

**Result:**
- `./data/vault/schemas/` → ✅ Gets committed (safe templates)
- `./data/vault/terminal_phantom_state.json` → ❌ Ignored (private data)
- `./data/vault/examples/` → ✅ Gets committed (dummy data only)

---

## 6. GitHub Web Interface

### Creating a Pull Request (PR)
1. Go to https://github.com/yourusername/rangerplex-ai
2. Click "Pull Requests" tab
3. Click "New Pull Request"
4. Select your branch → compare with main
5. Add title and description
6. Click "Create Pull Request"
7. Others can review and approve

### Viewing Changes
- **Commits**: See all changes over time
- **Files**: Browse code directly on GitHub
- **Issues**: Track bugs and feature requests
- **Actions**: Automated tests (if configured)

---

## 7. Emergency Commands

### Undo Last Commit (Not Yet Pushed)
```bash
# Keep your changes, just undo the commit
git reset --soft HEAD~1

# Completely undo commit AND changes (DANGEROUS!)
git reset --hard HEAD~1
```

### Discard All Local Changes
```bash
# WARNING: This deletes ALL uncommitted changes!
git reset --hard HEAD
git clean -fd
```

### See Commit History
```bash
# Simple list
git log --oneline

# Detailed view
git log

# Visual graph
git log --graph --oneline --all
```

### Find Out Who Changed What
```bash
# See who changed each line
git blame path/to/file.ts

# See changes in a specific file
git log -p path/to/file.ts
```

---

## 8. First-Time Setup

### Set Your Identity
```bash
git config --global user.name "David Keane"
git config --global user.email "your.email@example.com"
```

### Connect to GitHub
```bash
# If repo already exists on GitHub
git remote add origin https://github.com/yourusername/rangerplex-ai.git

# Check connection
git remote -v
```

### SSH Key Setup (Recommended for security)
```bash
# 1. Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# 2. Copy public key
cat ~/.ssh/id_ed25519.pub

# 3. Add to GitHub:
#    - Go to GitHub Settings → SSH Keys
#    - Click "New SSH Key"
#    - Paste the key from step 2

# 4. Test connection
ssh -T git@github.com

# 5. Update remote URL to use SSH
git remote set-url origin git@github.com:yourusername/rangerplex-ai.git
```

---

## 9. Useful Aliases

Add these to your `~/.zshrc` or `~/.bashrc`:

```bash
# Git shortcuts
alias gs='git status'
alias ga='git add .'
alias gc='git commit -m'
alias gp='git push origin main'
alias gl='git pull origin main'
alias glog='git log --oneline --graph --all'

# After adding, reload shell:
source ~/.zshrc
```

**Usage:**
```bash
gs              # Instead of: git status
ga              # Instead of: git add .
gc "message"    # Instead of: git commit -m "message"
gp              # Instead of: git push origin main
```

---

## 10. Common Issues & Solutions

### Issue: "Permission denied (publickey)"
**Solution:** Set up SSH key (see Section 8) or use HTTPS URL

### Issue: "fatal: refusing to merge unrelated histories"
**Solution:**
```bash
git pull origin main --allow-unrelated-histories
```

### Issue: "Your branch is ahead of 'origin/main' by X commits"
**Solution:** Just push!
```bash
git push origin main
```

### Issue: "Failed to push some refs"
**Solution:** Pull first, then push:
```bash
git pull origin main
git push origin main
```

### Issue: Accidentally committed a large file
**Solution:**
```bash
# Remove from last commit
git rm --cached path/to/large/file
git commit --amend -m "Removed large file"
git push origin main --force
```

---

## 11. Best Practices

### Commit Message Style
```bash
# Good ✅
git commit -m "Add terminal persistence with localStorage"
git commit -m "Fix editor auto-save debounce timing"
git commit -m "Update PERSISTENCE_QUICK_GUIDE with examples"

# Bad ❌
git commit -m "stuff"
git commit -m "fix"
git commit -m "asdf"
```

### Commit Frequency
- **Too often**: Every keystroke = noisy history
- **Too rare**: Once per month = hard to track changes
- **Just right**: After completing a logical unit of work

**Examples of good commit timing:**
- ✅ Finished implementing a feature
- ✅ Fixed a bug completely
- ✅ Refactored a component
- ✅ Updated documentation

### When to Push
- At least once per day if working actively
- Before asking for help (so others can see your code)
- After completing a feature
- Before switching computers/locations

---

## 12. Collaboration Tips

### Working with Others
1. **Pull often**: `git pull origin main` at start of each session
2. **Communicate**: Tell team what you're working on
3. **Small commits**: Easier to review and merge
4. **Branch per feature**: Keeps work isolated
5. **Review PRs**: Help teammates by reviewing their code

### Code Review Checklist
When reviewing Pull Requests:
- ✅ Code works (test it locally if possible)
- ✅ No hardcoded secrets or API keys
- ✅ Documentation updated
- ✅ Follows project style
- ✅ No unnecessary files committed

---

## 13. Resources

### Learn More
- **Git Book**: https://git-scm.com/book/en/v2
- **GitHub Guides**: https://guides.github.com/
- **Interactive Tutorial**: https://learngitbranching.js.org/

### Quick Reference Cards
- https://education.github.com/git-cheat-sheet-education.pdf

### Visual Tools
- **GitHub Desktop**: https://desktop.github.com/ (GUI alternative)
- **GitKraken**: https://www.gitkraken.com/ (Visual Git client)
- **VSCode**: Built-in Git support

---

**"One foot in front of the other" - Steady progress with Git.** 🏔️

**Rangers Lead The Way.** 🎖️

---

**Created**: November 26, 2025
**Purpose**: Simplify Git workflows for RangerPlex development
**Audience**: All skill levels, especially Git beginners

# 🚨 Emergency Git Surgery: How to Remove Sensitive Data from History

*A field guide for when you accidentally commit API keys or secrets.*

## The Scenario
You accidentally committed sensitive data (like API keys) to your git repository and pushed it to GitHub. You need to remove it **immediately** and ensure it's gone from the history.

---

## ⚠️ Immediate Action Required
1.  **Assume Compromise:** If keys were pushed to a public repo, bots scraped them instantly.
2.  **Rotate Keys:** Go to your API providers and generate new keys. Delete the old ones.
3.  **Stop Work:** Do not make new commits until this is resolved.

---

## The Fix: Reset & Force Push
This method rewinds your local branch to a safe point before the bad commit, then forces GitHub to match your local state.

### Step 1: Find the "Safe" Commit Hash
Look at your log to find the commit *before* the mistake.
```bash
git log --oneline -n 10
```
*Example Output:*
```
09ec1e0 (HEAD) Oops, added API keys (BAD COMMIT)
8e65823 Fixed Ranger Pet Memory (GOOD COMMIT)
311255d Canvas board updates
```
In this case, `8e65823` is our **Safe Commit**.

### Step 2: Hard Reset
**Warning:** This will lose any work done *after* the safe commit. Back up files manually if needed.
```bash
git reset --hard 8e65823
```
*Your local branch is now back in time, before the bad commit existed.*

### Step 3: Force Push
This overwrites the history on GitHub with your clean local history.
```bash
git push --force
```
*The bad commit is now gone from the visible history on GitHub.*

---

## 🔥 The Nuclear Option: Complete History Rewrite

**Use this when secrets are buried deep in git history** (not just the latest commit). This method completely erases files from ALL commits.

### ⚠️ WARNING
- This rewrites the **entire git history**
- Only use if you **haven't pushed yet** OR you're okay with force-pushing
- Collaborators will need to re-clone the repository
- **NO UNDO** - make a backup first!

### When to Use This
- Secret scanner detected keys in old commits
- Multiple commits contain the sensitive file
- File is in commit history even though you deleted it
- Need to completely purge file from all branches/tags

### Step 1: Backup Your Repository (Optional but Recommended)
```bash
cp -r .git .git.backup
```

### Step 2: Run Git Filter-Branch
This command removes the file from **every commit** in history:

```bash
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/sensitive/file' \
  --prune-empty --tag-name-filter cat -- --all
```

**Replace** `path/to/sensitive/file` with your actual file path.

**Real Example** (from RangerPlex incident):
```bash
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch data/rangerplex.db.backup.20251125132745' \
  --prune-empty --tag-name-filter cat -- --all
```

**What This Does:**
- `--force`: Overwrites any existing backups from previous filter-branch runs
- `--index-filter`: Runs command on git index (staging area) for every commit
- `git rm --cached --ignore-unmatch`: Removes file from index without failing if file doesn't exist
- `--prune-empty`: Removes commits that become empty after file removal
- `--tag-name-filter cat`: Updates all tags to point to rewritten commits
- `-- --all`: Processes all branches and tags

**Expected Output:**
```
Rewrite 857a2d9... (107/119) rm 'data/rangerplex.db.backup.20251125132745'
Ref 'refs/heads/main' was rewritten
```

### Step 3: Clean Up Git Internals
Remove backup references and garbage collect:
```bash
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**What This Does:**
- Removes backup refs created by filter-branch
- Expires all reflog entries (clears history of history)
- Aggressively garbage collects unreachable objects
- File is now **completely gone** from repository

### Step 4: Verify File Is Gone
```bash
git log --all --full-history --name-only | grep "sensitive-file"
```

**Expected:** No output (file no longer exists in history)

### Step 5: Force Push to Remote
```bash
git push origin main --force
```

### Step 6: Verify with Secret Scanner
Try pushing again - the secret scanner should now pass! ✅

---

## Real-World Example: RangerPlex API Key Leak (Nov 25, 2025)

### The Incident
- Database backup file with API keys committed in `857a2d9`
- GitHub secret scanner blocked push (OpenAI, Anthropic, Perplexity keys detected)
- File was deleted locally but still existed in commit history
- Standard `git rm` didn't work because file was in **past commits**

### The Response
1. **Identified the problem commit**: `857a2d9` contained `data/rangerplex.db.backup.20251125132745`
2. **Ran filter-branch**: Rewrote all 119 commits to remove the file
3. **Cleaned git internals**: Removed backup refs and garbage collected
4. **Verified**: `git log --all --full-history` showed file was gone
5. **Force pushed**: Successfully pushed to GitHub (commit `ba769f8`)
6. **Updated .gitignore**: Added `backups/` and `data/*.backup.*`

### Response Time
- **Detection to resolution**: 15 minutes
- **Commits rewritten**: 119
- **Processing time**: 8 seconds
- **Result**: ✅ Repository clean, keys purged, push successful

### Commands Used (Copy-Paste Ready)
```bash
# 1. Rewrite history to remove file
cd "/path/to/repo"
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch data/rangerplex.db.backup.20251125132745' \
  --prune-empty --tag-name-filter cat -- --all

# 2. Clean up git internals
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 3. Verify file is gone
git log --all --full-history --name-only | grep "rangerplex.db.backup"

# 4. Force push clean history
git push origin main --force

# 5. Verify final status
git status
```

---

## Alternative: Amending the Last Commit
If the bad commit was the **very last one** you made, and you haven't pushed yet (or you are force pushing anyway), you can just edit it.

1.  **Stage the correct files** (remove the bad ones).
2.  **Amend the commit:**
    ```bash
    git commit --amend -m "New clean message"
    ```
3.  **Force push:**
    ```bash
    git push --force
    ```

---

## 🛡️ Prevention: Stop it Before it Happens

### 1. Use `.gitignore`
Always ensure your `.env` file is ignored.
```bash
echo ".env" >> .gitignore
```

### 2. Sanitize Logs
Never `console.log` entire objects that might contain secrets.
**Bad:**
```javascript
console.log('Settings:', settings); // Leaks settings.apiKey
```
**Good:**
```javascript
const safeSettings = { ...settings, apiKey: 'REDACTED' };
console.log('Settings:', safeSettings);
```

### 3. Pre-commit Hooks (Advanced)
Use tools like `husky` or `pre-commit` to scan for secrets before allowing a commit.

---

*Stay safe, Ranger!* 🎖️

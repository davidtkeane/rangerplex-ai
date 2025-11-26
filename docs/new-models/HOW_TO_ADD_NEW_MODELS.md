# 🚀 How to Add New AI Models to RangerPlex
## Complete Guide for Adding Claude, Gemini, OpenAI, or Other Models

**Last Updated:** November 26, 2025
**Example:** Adding Claude Opus 4.5 (claude-opus-4-5-20251101)

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Process](#step-by-step-process)
4. [File Locations](#file-locations)
5. [Testing & Verification](#testing--verification)
6. [Troubleshooting](#troubleshooting)
7. [Real Example: Claude Opus 4.5](#real-example-claude-opus-45)

---

## 🎯 OVERVIEW

### What This Guide Covers:
- ✅ Adding new models to the model list
- ✅ Updating type definitions
- ✅ Ensuring model shows in UI dropdown
- ✅ Testing the new model works
- ✅ Updating documentation

### Supported Providers:
- **Anthropic** (Claude models)
- **Google** (Gemini models)
- **OpenAI** (GPT models)
- **xAI** (Grok models)
- **Ollama** (Local models)
- **LM Studio** (Local models)
- **Hugging Face** (Open source models)

---

## 📦 PREREQUISITES

### Before You Start:
1. **Model Information:**
   - Exact model ID (e.g., `claude-opus-4-5-20251101`)
   - Provider (Anthropic, OpenAI, etc.)
   - Release date
   - Capabilities (vision, context window, etc.)

2. **API Access:**
   - Valid API key for the provider
   - Model available in your region
   - API documentation link

3. **Development Setup:**
   - RangerPlex running locally
   - Text editor or IDE
   - Git for version control

---

## 📝 STEP-BY-STEP PROCESS

### **Step 1: Update Type Definitions**

**File:** `/types.ts`

#### **1a. Add to ModelType Enum (Optional)**
If this is a commonly used model, add it to the enum:

```typescript
export enum ModelType {
  // ... existing models

  // Anthropic (Claude 4 - Latest 2025)
  CLAUDE_SONNET_4_5 = 'claude-sonnet-4-5-20250929',
  CLAUDE_HAIKU_4_5 = 'claude-haiku-4-5-20251001',
  CLAUDE_OPUS_4_5 = 'claude-opus-4-5-20251101',  // ← NEW MODEL HERE!
  CLAUDE_OPUS_4_1 = 'claude-opus-4-1-20250805',

  // ... other models
}
```

**Location:** Around line 34-46 (Anthropic section)

---

#### **1b. Add to availableModels Array (REQUIRED)**
This makes the model show in the UI dropdown:

```typescript
export const DEFAULT_SETTINGS: AppSettings = {
  // ... other settings

  availableModels: {
    anthropic: [
      'claude-sonnet-4-5-20250929',  // Sonnet 4.5
      'claude-haiku-4-5-20251001',   // Haiku 4.5
      'claude-opus-4-5-20251101',    // ← NEW MODEL HERE!
      'claude-opus-4-1-20250805',    // Opus 4.1
      // ... other models
    ],
    // ... other providers
  }
}
```

**Location:** Around line 392-403 (Anthropic section)

**Important:** Add the model in the RIGHT provider array:
- Anthropic models → `anthropic: []`
- OpenAI models → `openai: []`
- Gemini models → `gemini: []`
- Grok models → `grok: []`
- etc.

---

### **Step 2: Add Model Description Comment**

Add a helpful comment next to the model ID:

```typescript
anthropic: [
  'claude-sonnet-4-5-20250929',  // Sonnet 4.5 (Latest!)
  'claude-haiku-4-5-20251001',   // Haiku 4.5 (Latest!)
  'claude-opus-4-5-20251101',    // Opus 4.5 (PREMIUM - Maximum Intelligence!)  ← DESCRIPTIVE!
  'claude-opus-4-1-20250805',    // Opus 4.1 (Latest!)
]
```

**Why?** Helps future developers understand which model is which!

---

### **Step 3: Update Version Numbers**

After adding new models, update version numbers in:

#### **3a. package.json**
```json
{
  "name": "rangerplex-ai",
  "version": "2.5.35",  // ← Increment version
}
```

**Location:** Line 2-3

---

#### **3b. components/Sidebar.tsx**
```typescript
<span>v2.5.35 // CHUCK NORRIS 🥋</span>  // ← Update version
```

**Location:** Around line 315

---

#### **3c. services/dbService.ts**
```typescript
return {
  version: '2.5.35',  // ← Update version
  exportedAt: Date.now(),
```

**Location:** Around line 284

---

#### **3d. README.md**
```markdown
![Version](https://img.shields.io/badge/Version-2.5.35-cyan?style=for-the-badge)
```

**Location:** Line 6-7

---

### **Step 4: Update CHANGELOG.md**

Add entry for the new model:

```markdown
## v2.5.35 - "Model Name Added" 🚀
*Released: November 26, 2025*

**New AI Model Support.** Added [Provider] [Model Name] to RangerPlex.

### 🤖 New Models
*   **Model Name**: `model-id-here` - Description of capabilities
*   **Use Cases**: When to use this model

### 📊 Current [Provider] Lineup
*   List all models available from this provider

---
```

**Location:** Top of CHANGELOG.md (after header)

---

### **Step 5: Rebuild & Test**

#### **5a. Rebuild Docker (if using Docker):**
```bash
cd /Users/ranger/Local\ Sites/rangerplex-ai
docker-compose down
docker-compose up -d --build
```

#### **5b. Or Restart Dev Server:**
```bash
npm run dev
```

#### **5c. Check Logs:**
```bash
# Docker logs
docker logs rangerplex-ai

# Or local dev server
# Watch the terminal output
```

---

### **Step 6: Verify in UI**

1. **Open RangerPlex:**
   ```
   http://localhost:5173
   ```

2. **Open Model Selector:**
   - Click the model dropdown (top of chat)

3. **Find Your Model:**
   - Scroll through the list
   - Look for your new model ID
   - Should appear with the comment you added

4. **Test the Model:**
   - Select the new model
   - Send a test message
   - Verify it responds correctly
   - Check console for errors (F12)

---

## 📂 FILE LOCATIONS

### **Files You MUST Edit:**

| File | Purpose | Location |
|------|---------|----------|
| `types.ts` | Add model to enum & available list | Lines 34-46, 392-403 |
| `package.json` | Version bump | Line 2-3 |
| `Sidebar.tsx` | Version display | Line 315 |
| `dbService.ts` | Export version | Line 284 |
| `README.md` | Badge version | Line 6-7 |
| `CHANGELOG.md` | Document change | Top of file |

### **Files You DON'T Need to Edit:**

These files automatically work with new models:
- ✅ `anthropicService.ts` - Uses model string parameter
- ✅ `ChatInterface.tsx` - Routes based on model name
- ✅ `SettingsModal.tsx` - Reads from availableModels array
- ✅ Service files (geminiService, openaiService, etc.) - Generic model handling

---

## 🧪 TESTING & VERIFICATION

### **Checklist:**

- [ ] Model appears in dropdown
- [ ] Can select the model
- [ ] Model sends/receives messages
- [ ] No console errors (F12 → Console)
- [ ] Token counting works (if applicable)
- [ ] Model capabilities detected (vision, etc.)
- [ ] Version numbers updated
- [ ] CHANGELOG documented
- [ ] Git commit created

### **Test Commands:**

```bash
# Check types file has model
grep -n "claude-opus-4-5" /Users/ranger/Local\ Sites/rangerplex-ai/types.ts

# Check version numbers match
grep -n "version" /Users/ranger/Local\ Sites/rangerplex-ai/package.json
grep -n "v2.5" /Users/ranger/Local\ Sites/rangerplex-ai/components/Sidebar.tsx

# Check CHANGELOG
head -30 /Users/ranger/Local\ Sites/rangerplex-ai/CHANGELOG.md
```

---

## 🔍 TROUBLESHOOTING

### **Model Doesn't Appear in Dropdown:**

**Check:**
1. Is it in `types.ts` → `availableModels` → correct provider array?
2. Did you restart the server/rebuild Docker?
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
4. Check browser console for errors (F12)

**Fix:**
```typescript
// Make sure it's in the RIGHT array!
availableModels: {
  anthropic: ['claude-opus-4-5-20251101'],  // ← For Claude
  openai: ['gpt-5'],                         // ← For GPT
  gemini: ['gemini-3-pro'],                  // ← For Gemini
}
```

---

### **Model Sends Request But Gets Error:**

**Check:**
1. Do you have a valid API key?
2. Is the model ID exactly correct?
3. Is the model available in your region?
4. Check API provider's status page

**Fix:**
```typescript
// Verify exact model ID from provider docs
'claude-opus-4-5-20251101'  // ✅ Correct
'claude-opus-4.5'           // ❌ Wrong format
'opus-4-5'                  // ❌ Missing provider prefix
```

---

### **Token Errors (Prompt Too Long):**

**Symptom:**
```
Error: prompt is too long: 219809 tokens > 200000 maximum
```

**Fix:**
The token limiting in `anthropicService.ts` should handle this automatically, but if you're adding a model with a DIFFERENT context window:

```typescript
// In anthropicService.ts
const trimmedHistory = trimHistory(history, 100000);  // Adjust limit here
```

---

### **Model Capabilities Not Detected:**

**Check:** `types.ts` → `getModelCapabilities()` function

```typescript
export function getModelCapabilities(modelId: string): ModelCapabilities {
  // ... existing code

  if (modelId.includes('claude')) {
    const caps: ModelCapabilities = { ...defaults, vision: true };
    if (modelId.includes('haiku')) caps.speed = 'fast';
    else if (modelId.includes('opus')) caps.speed = 'powerful';  // ← Opus detection
    else caps.speed = 'balanced';
    return caps;
  }
}
```

**Location:** Around line 510-570 in `types.ts`

---

## 📚 REAL EXAMPLE: Claude Opus 4.5

### **Context:**
On November 26, 2025, we added Claude Opus 4.5 (claude-opus-4-5-20251101) to RangerPlex.

### **What We Did:**

#### **1. Researched the Model:**
- Checked Anthropic's official docs: https://platform.claude.com/docs/en/about-claude/models
- Found model ID: `claude-opus-4-5-20251101`
- Release date: November 1, 2025
- Description: "Premium model combining maximum intelligence with practical performance"
- Context window: 200K tokens

---

#### **2. Updated types.ts:**

**Added to ModelType Enum (line 38):**
```typescript
CLAUDE_OPUS_4_5 = 'claude-opus-4-5-20251101', // PREMIUM Opus 4.5! (Maximum Intelligence!)
```

**Added to availableModels (line 395):**
```typescript
anthropic: [
  'claude-sonnet-4-5-20250929',
  'claude-haiku-4-5-20251001',
  'claude-opus-4-5-20251101',    // ← NEW!
  'claude-opus-4-1-20250805',
  // ... rest
]
```

---

#### **3. Updated Version Numbers:**

**package.json (line 3):**
```json
"version": "2.5.34",
```

**Sidebar.tsx (line 315):**
```typescript
<span>v2.5.34 // CHUCK NORRIS 🥋</span>
```

**dbService.ts (line 284):**
```typescript
version: '2.5.34',
```

**README.md (line 7):**
```markdown
![Version](https://img.shields.io/badge/Version-2.5.34-cyan?style=for-the-badge)
```

---

#### **4. Updated CHANGELOG.md:**

```markdown
## v2.5.34 - "Maximum Intelligence Unleashed" 🧠
*Released: Nov 26, 2025*

**Claude Opus 4.5 Support.** Added the latest and most powerful Claude model...

### 🚀 New Claude Models
*   **Claude Opus 4.5**: `claude-opus-4-5-20251101` - Premium model...
```

---

#### **5. Rebuilt Docker:**
```bash
docker-compose down
docker-compose up -d --build
```

---

#### **6. Verified:**
- ✅ Model appeared in dropdown
- ✅ Selected Claude Opus 4.5
- ✅ Sent test message: "Hello, how are you?"
- ✅ Received response successfully
- ✅ No console errors
- ✅ Token limiting working correctly

---

### **Git Commit:**
```bash
git add types.ts package.json components/Sidebar.tsx services/dbService.ts README.md CHANGELOG.md
git commit -m "Add Claude Opus 4.5 model support

- Added claude-opus-4-5-20251101 to available models
- Updated version to 2.5.34
- Updated CHANGELOG with new model details
- Verified model works correctly

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 🎯 QUICK REFERENCE CHECKLIST

### **Adding a New Model (Copy This!):**

```
[ ] 1. Get model ID from provider docs
[ ] 2. Add to types.ts → ModelType enum (optional)
[ ] 3. Add to types.ts → availableModels array (REQUIRED)
[ ] 4. Add descriptive comment next to model
[ ] 5. Update package.json version
[ ] 6. Update Sidebar.tsx version
[ ] 7. Update dbService.ts version
[ ] 8. Update README.md badge
[ ] 9. Update CHANGELOG.md with entry
[ ] 10. Rebuild Docker / Restart server
[ ] 11. Verify model in UI dropdown
[ ] 12. Test model sends/receives
[ ] 13. Check console for errors
[ ] 14. Git commit with descriptive message
```

---

## 📖 PROVIDER-SPECIFIC NOTES

### **Anthropic (Claude):**
- Model IDs: `claude-{model}-{version}-{date}`
- Example: `claude-opus-4-5-20251101`
- Docs: https://platform.claude.com/docs/en/about-claude/models
- Context window: Varies (200K for Claude 4.5)
- Vision support: Most models

### **OpenAI (GPT):**
- Model IDs: `gpt-{version}` or `o1`, `o3-mini`
- Example: `gpt-4o`, `o1`
- Docs: https://platform.openai.com/docs/models
- Context window: Varies by model
- Vision: GPT-4 Vision, GPT-4o

### **Google (Gemini):**
- Model IDs: `gemini-{version}-{variant}`
- Example: `gemini-2.5-pro`, `gemini-2.0-flash`
- Docs: https://ai.google.dev/models/gemini
- Context window: Up to 2M tokens!
- Vision: Most Gemini models

### **xAI (Grok):**
- Model IDs: `grok-{version}`
- Example: `grok-3`, `grok-3-mini`
- Docs: https://docs.x.ai/
- Context window: Varies
- Vision: grok-2-vision

---

## 🔗 USEFUL LINKS

**Provider Documentation:**
- Anthropic: https://platform.claude.com/docs
- OpenAI: https://platform.openai.com/docs
- Google Gemini: https://ai.google.dev/docs
- xAI Grok: https://docs.x.ai/

**RangerPlex Files:**
- `types.ts` - Model definitions
- `anthropicService.ts` - Claude API
- `openaiService.ts` - OpenAI API
- `geminiService.ts` - Gemini API

**Testing:**
- Local: http://localhost:5173
- Docker logs: `docker logs rangerplex-ai`
- Browser console: F12 → Console tab

---

## 📝 NOTES FOR FUTURE CLAUDE INSTANCES

**Hey there, future AI assistant! 👋**

If you're helping David add a new model, here's what you need to know:

### **The Essential Steps:**
1. Update `types.ts` (lines 34-46 for enum, 392-417 for array)
2. Bump version in 4 places (package.json, Sidebar, dbService, README)
3. Update CHANGELOG.md
4. Rebuild/restart
5. Test in UI

### **Common Mistakes to Avoid:**
- ❌ Forgetting to add to `availableModels` array (model won't show!)
- ❌ Adding to wrong provider array (Claude in `openai:` won't work!)
- ❌ Typo in model ID (API will reject it!)
- ❌ Forgetting to rebuild Docker (changes won't apply!)
- ❌ Not testing in UI (might have errors!)

### **Pro Tips:**
- Always verify model ID from official docs
- Add descriptive comments (helps future devs!)
- Test before committing
- Update CHANGELOG with use cases
- Document any special configuration needed

### **David's Preferences:**
- Clear, descriptive comments
- Version bumps for new features
- Comprehensive CHANGELOG entries
- Testing before declaring done
- "Rangers lead the way!" 🎖️

---

## 🎖️ SUCCESS!

**You now know how to add new AI models to RangerPlex!**

Follow this guide, and you'll have new models working in minutes! 🚀

**Questions? Check:**
1. This guide
2. Provider documentation
3. Existing model examples in `types.ts`
4. Troubleshooting section above

---

**Rangers lead the way! 🎖️**

_Guide created by Ranger & David Keane (IrishRanger IR240474)_
_"One foot in front of the other" - Steady progress!_

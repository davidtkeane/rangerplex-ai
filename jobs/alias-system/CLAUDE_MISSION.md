# 🎖️ AIRanger Claude's Mission: Alias Management & Database
## Alias System - Phase 3

**Assigned To**: AIRanger Claude (Claude 3.5 Sonnet)  
**Estimated Time**: 1 hour  
**Priority**: HIGH - Core Functionality  
**Status**: 🔴 Not Started

---

## 🎯 Your Mission

Build the **alias management system** with database integration, CRUD operations, and pre-built alias packs.

---

## 📋 Tasks

### Phase 3: Alias Management (1 hour)

#### Task 3.1: Extend Database Schema
**File**: `services/dbService.ts`

Add new object store for aliases and execution logs:

```typescript
interface RangerPlexDB extends DBSchema {
  // ... existing stores ...
  
  aliases: {
    key: string; // alias name
    value: {
      name: string;
      command: string;
      description: string;
      cwd?: string;
      requires_confirmation: boolean;
      tags?: string[];
      category: 'fun' | 'utility' | 'system' | 'custom';
      icon?: string;
      created: number;
      lastUsed?: number;
      useCount: number;
      outputMode?: 'chat' | 'terminal' | 'both';
      acceptsParams?: boolean;
      paramPlaceholder?: string;
    };
    indexes: { 'by-category': string; 'by-useCount': number };
  };
  
  execution_logs: {
    key: string; // log id
    value: {
      id: string;
      command: string;
      cwd: string;
      user: string;
      timestamp: number;
      exitCode: number;
      duration: number;
      source: 'alias' | 'allowlist' | 'manual';
      stdout?: string;
      stderr?: string;
    };
    indexes: { 'by-timestamp': number };
  };
}
```

**Database Methods:**

```typescript
// Alias CRUD
async saveAlias(alias: Alias): Promise<void>
async getAlias(name: string): Promise<Alias | null>
async getAllAliases(): Promise<Alias[]>
async deleteAlias(name: string): Promise<void>
async updateAliasStats(name: string): Promise<void> // Increment useCount, update lastUsed

// Execution Logs
async saveExecutionLog(log: ExecutionLog): Promise<void>
async getExecutionLogs(limit: number = 10): Promise<ExecutionLog[]>
async clearExecutionLogs(): Promise<void>
```

**Acceptance Criteria:**
- ✅ Database schema updated
- ✅ All CRUD methods implemented
- ✅ Indexes created for performance
- ✅ Methods tested and working

---

#### Task 3.2: Create Alias Service
**File**: `services/aliasService.ts`

```typescript
import { dbService } from './dbService';
import { allowlistValidator } from './allowlistValidator';

interface Alias {
  name: string;
  command: string;
  description: string;
  cwd?: string;
  requires_confirmation: boolean;
  tags?: string[];
  category: 'fun' | 'utility' | 'system' | 'custom';
  icon?: string;
  created: number;
  lastUsed?: number;
  useCount: number;
  outputMode?: 'chat' | 'terminal' | 'both';
  acceptsParams?: boolean;
  paramPlaceholder?: string;
}

class AliasService {
  // Load default aliases from config/aliases.json
  async loadDefaultAliases(): Promise<void> {
    const response = await fetch('/config/aliases.json');
    const aliases: Alias[] = await response.json();
    
    for (const alias of aliases) {
      const existing = await dbService.getAlias(alias.name);
      if (!existing) {
        await dbService.saveAlias(alias);
      }
    }
  }

  // Validate alias (no pipes/redirects/subshells)
  validateAlias(alias: Alias): { valid: boolean; reason?: string } {
    // Check for forbidden characters
    if (/[|><;`]/.test(alias.command) && !alias.command.includes('&&')) {
      return {
        valid: false,
        reason: 'Command contains forbidden characters (pipes, redirects, etc.)'
      };
    }

    // Validate name (alphanumeric + dashes/underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(alias.name)) {
      return {
        valid: false,
        reason: 'Alias name must be alphanumeric with dashes/underscores only'
      };
    }

    return { valid: true };
  }

  // CRUD Operations
  async createAlias(alias: Alias): Promise<void> {
    const validation = this.validateAlias(alias);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    await dbService.saveAlias({
      ...alias,
      created: Date.now(),
      useCount: 0
    });
  }

  async getAlias(name: string): Promise<Alias | null> {
    return await dbService.getAlias(name);
  }

  async getAllAliases(): Promise<Alias[]> {
    return await dbService.getAllAliases();
  }

  async updateAlias(name: string, updates: Partial<Alias>): Promise<void> {
    const existing = await dbService.getAlias(name);
    if (!existing) {
      throw new Error(`Alias '${name}' not found`);
    }

    const updated = { ...existing, ...updates };
    const validation = this.validateAlias(updated);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    await dbService.saveAlias(updated);
  }

  async deleteAlias(name: string): Promise<void> {
    await dbService.deleteAlias(name);
  }

  // Execution
  async executeAlias(name: string, params?: string[]): Promise<void> {
    const alias = await dbService.getAlias(name);
    if (!alias) {
      throw new Error(`Alias '${name}' not found`);
    }

    // Update stats
    await dbService.updateAliasStats(name);

    // Build command with params if needed
    let command = alias.command;
    if (alias.acceptsParams && params) {
      command = command.replace(/\$1/g, params[0] || '');
    }

    // Return for execution by commandExecutor
    return {
      command,
      cwd: alias.cwd || process.cwd(),
      outputMode: alias.outputMode || 'chat',
      requiresConfirmation: alias.requires_confirmation
    };
  }

  // Import/Export
  async exportAliases(): Promise<string> {
    const aliases = await dbService.getAllAliases();
    return JSON.stringify(aliases, null, 2);
  }

  async importAliases(json: string): Promise<void> {
    const aliases: Alias[] = JSON.parse(json);
    
    for (const alias of aliases) {
      const validation = this.validateAlias(alias);
      if (validation.valid) {
        await dbService.saveAlias(alias);
      }
    }
  }

  // Pre-built Packs (from your design!)
  async installPack(packName: 'fun' | 'utility' | 'system' | 'development' | 'ranger-ai'): Promise<void> {
    const packs = {
      fun: [
        {
          name: 'moon',
          command: 'curl http://wttr.in/Moon',
          description: 'Show moon phase',
          icon: '🌙',
          category: 'fun',
          requires_confirmation: false
        },
        {
          name: 'weather',
          command: 'curl wttr.in',
          description: 'Weather report',
          icon: '🌤️',
          category: 'fun',
          requires_confirmation: false
        }
      ],
      utility: [
        {
          name: 'nddy',
          command: 'date +"%d %b %Y %T %z"',
          description: 'Human-friendly timestamp',
          icon: '📅',
          category: 'utility',
          requires_confirmation: false
        }
      ],
      // ... other packs
    };

    const pack = packs[packName];
    for (const alias of pack) {
      await this.createAlias({
        ...alias,
        created: Date.now(),
        useCount: 0
      });
    }
  }
}

export const aliasService = new AliasService();
```

**Acceptance Criteria:**
- ✅ All CRUD operations working
- ✅ Validation prevents invalid aliases
- ✅ Import/Export functionality works
- ✅ Pre-built packs can be installed
- ✅ Usage stats tracked correctly

---

#### Task 3.3: Create Backend API Endpoints
**File**: `proxy_server.js` (add these endpoints)

```javascript
// Get all aliases
app.get('/api/alias/list', async (req, res) => {
  const aliases = await aliasService.getAllAliases();
  res.json({ success: true, aliases });
});

// Create alias
app.post('/api/alias/create', async (req, res) => {
  try {
    await aliasService.createAlias(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update alias
app.put('/api/alias/update/:name', async (req, res) => {
  try {
    await aliasService.updateAlias(req.params.name, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete alias
app.delete('/api/alias/delete/:name', async (req, res) => {
  try {
    await aliasService.deleteAlias(req.params.name);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Export aliases
app.get('/api/alias/export', async (req, res) => {
  const json = await aliasService.exportAliases();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=aliases.json');
  res.send(json);
});

// Import aliases
app.post('/api/alias/import', async (req, res) => {
  try {
    await aliasService.importAliases(req.body.json);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Install pre-built pack
app.post('/api/alias/install-pack', async (req, res) => {
  try {
    await aliasService.installPack(req.body.packName);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
```

**Acceptance Criteria:**
- ✅ All endpoints working
- ✅ Proper error handling
- ✅ Export downloads JSON file
- ✅ Import validates aliases

---

## ✅ Definition of Done

- [ ] Database schema extended
- [ ] All database methods implemented
- [ ] AliasService created and tested
- [ ] All API endpoints working
- [ ] Pre-built packs can be installed
- [ ] Import/Export functionality works
- [ ] Usage stats tracked correctly

---

## 📊 Your Special Additions

These are YOUR brilliant ideas from your design:

1. **Pre-built Alias Packs** ✨
   - Fun Pack (moon, weather, parrot)
   - Utility Pack (nddy, ny, myip)
   - System Pack (status, logs, restart)
   - Development Pack (gitlog, npmlist, ports-kill)
   - Ranger AI Pack (rangerbot, ollama-list)

2. **Output Modes** 🎯
   - `chat`: Display in chat
   - `terminal`: Send to RangerConsole
   - `both`: Show in both places

3. **Parameter Support** 🔧
   - `acceptsParams`: true/false
   - `paramPlaceholder`: "<city>" for weather
   - `$1` substitution in commands

4. **Usage Statistics** 📊
   - Track execution count
   - Last used timestamp
   - Success/failure rate

---

## 🎖️ Next Steps

After completion, hand off to Major Gemini Ranger for:
- Chat Integration (Phase 4)
- Alias Manager UI (Phase 5)

**Rangers lead the way!** 🎖️

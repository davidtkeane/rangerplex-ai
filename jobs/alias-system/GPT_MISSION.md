# 🤖 Brother GPT's Mission: Security & Backend Foundation
## Alias System - Phase 1 & 2

**Assigned To**: Brother GPT (ChatGPT-4)  
**Estimated Time**: 3 hours  
**Priority**: CRITICAL - Security Foundation  
**Status**: 🔴 Not Started

---

## 🎯 Your Mission

Build the **security-first backend foundation** for the alias system with maximum safety and audit capabilities.

---

## 📋 Tasks

### Phase 1: Security Foundation (1.5 hours)

#### Task 1.1: Create Allowlist Validator
**File**: `services/allowlistValidator.ts`

```typescript
class AllowlistValidator {
  private allowlist: string[] = [
    // Git (read-only)
    'git status',
    'git diff',
    'git log',
    'git show',
    'git branch',
    'git fetch',
    
    // File inspection
    'ls', 'pwd', 'cat', 'head', 'tail', 'rg', 'find',
    
    // Scripts
    'python3', 'npm test', 'npm run', 'node', 'bun',
    
    // System info
    'whoami', 'uname', 'df', 'date', 'uptime'
  ];

  private blacklist: string[] = [
    'rm -rf', 'dd', 'mkfs', 'sudo', 'chmod', 'chown',
    'apt', 'brew install', 'npm install'
  ];

  isAllowed(command: string): boolean {
    // Check blacklist first
    if (this.blacklist.some(blocked => command.includes(blocked))) {
      return false;
    }
    
    // Check if command starts with allowed pattern
    return this.allowlist.some(allowed => 
      command.trim().startsWith(allowed)
    );
  }

  validateCommand(command: string): {
    valid: boolean;
    reason?: string;
  } {
    // No pipes, redirects, or subshells from free text
    if (/[|><&;`$()]/.test(command)) {
      return {
        valid: false,
        reason: 'Command contains forbidden characters (pipes, redirects, etc.)'
      };
    }

    if (!this.isAllowed(command)) {
      return {
        valid: false,
        reason: 'Command not in allowlist. Add as alias if needed.'
      };
    }

    return { valid: true };
  }
}

export const allowlistValidator = new AllowlistValidator();
```

**Acceptance Criteria:**
- ✅ Blocks all blacklisted commands
- ✅ Only allows whitelisted command prefixes
- ✅ Prevents pipes, redirects, and subshells
- ✅ Returns clear error messages

---

#### Task 1.2: Create Execution Logger
**File**: `services/executionLogger.ts`

```typescript
interface ExecutionLog {
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
}

class ExecutionLogger {
  private logs: ExecutionLog[] = [];
  private maxLogs = 100;

  async log(execution: Omit<ExecutionLog, 'id'>): Promise<void> {
    const log: ExecutionLog = {
      id: uuidv4(),
      ...execution
    };

    this.logs.unshift(log);
    
    // Keep only last 100 logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Also save to database
    await dbService.saveExecutionLog(log);
    
    console.log(`[AUDIT] ${execution.command} (exit: ${execution.exitCode}, duration: ${execution.duration}ms)`);
  }

  async getRecentLogs(limit: number = 10): Promise<ExecutionLog[]> {
    return this.logs.slice(0, limit);
  }

  async clearLogs(): Promise<void> {
    this.logs = [];
    await dbService.clearExecutionLogs();
  }

  async getLogById(id: string): Promise<ExecutionLog | null> {
    return this.logs.find(log => log.id === id) || null;
  }
}

export const executionLogger = new ExecutionLogger();
```

**Acceptance Criteria:**
- ✅ Logs all command executions
- ✅ Stores in memory (last 100)
- ✅ Persists to database
- ✅ Provides audit trail

---

#### Task 1.3: Create Alias Configuration
**File**: `config/aliases.json`

```json
[
  {
    "name": "moon",
    "command": "curl http://wttr.in/Moon",
    "description": "Show moon phase/weather",
    "requires_confirmation": false,
    "category": "fun",
    "tags": ["weather", "ascii"],
    "icon": "🌙",
    "created": 1732752000000,
    "useCount": 0
  },
  {
    "name": "nddy",
    "command": "date +\"%d %b %Y %T %z\"",
    "description": "Human-friendly timestamp",
    "requires_confirmation": false,
    "category": "utility",
    "tags": ["time"],
    "icon": "📅",
    "created": 1732752000000,
    "useCount": 0
  },
  {
    "name": "weather",
    "command": "curl wttr.in",
    "description": "Weather report",
    "requires_confirmation": false,
    "category": "fun",
    "tags": ["weather"],
    "icon": "🌤️",
    "created": 1732752000000,
    "useCount": 0
  }
]
```

**Acceptance Criteria:**
- ✅ Valid JSON format
- ✅ 10+ default aliases
- ✅ Covers all categories (fun, utility, system, custom)
- ✅ Includes icons and tags

---

### Phase 2: Execution Engine (1.5 hours)

#### Task 2.1: Create Command Executor
**File**: `services/commandExecutor.ts`

```typescript
import { spawn } from 'child_process';

interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  command: string;
  cwd: string;
  timestamp: number;
}

class CommandExecutor {
  private runningProcesses: Map<string, any> = new Map();

  async execute(
    command: string,
    cwd: string = process.cwd(),
    timeout: number = 60000
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const processId = uuidv4();

    return new Promise((resolve, reject) => {
      // Spawn without shell sourcing
      const [cmd, ...args] = command.split(' ');
      const proc = spawn(cmd, args, {
        cwd,
        shell: false, // CRITICAL: No shell sourcing
        env: { ...process.env, PATH: process.env.PATH }
      });

      this.runningProcesses.set(processId, proc);

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Timeout handler
      const timeoutId = setTimeout(() => {
        proc.kill('SIGTERM');
        setTimeout(() => proc.kill('SIGKILL'), 5000);
      }, timeout);

      proc.on('close', (code) => {
        clearTimeout(timeoutId);
        this.runningProcesses.delete(processId);

        const result: ExecutionResult = {
          success: code === 0,
          stdout,
          stderr,
          exitCode: code || 0,
          executionTime: Date.now() - startTime,
          command,
          cwd,
          timestamp: startTime
        };

        resolve(result);
      });

      proc.on('error', (error) => {
        clearTimeout(timeoutId);
        this.runningProcesses.delete(processId);
        reject(error);
      });
    });
  }

  async cancel(processId: string): Promise<void> {
    const proc = this.runningProcesses.get(processId);
    if (proc) {
      proc.kill('SIGINT');
      setTimeout(() => proc.kill('SIGKILL'), 5000);
    }
  }
}

export const commandExecutor = new CommandExecutor();
```

**Acceptance Criteria:**
- ✅ Executes commands without shell sourcing
- ✅ Implements timeout (60s default)
- ✅ Captures stdout and stderr
- ✅ Supports cancellation
- ✅ Returns execution time

---

#### Task 2.2: Create Backend API Endpoints
**File**: `proxy_server.js` (add these endpoints)

```javascript
// Execute alias
app.post('/api/alias/execute', async (req, res) => {
  const { aliasName, command, cwd } = req.body;

  try {
    // Validate command
    const validation = allowlistValidator.validateCommand(command);
    if (!validation.valid) {
      return res.status(403).json({
        success: false,
        error: validation.reason
      });
    }

    // Execute
    const result = await commandExecutor.execute(command, cwd);

    // Log execution
    await executionLogger.log({
      command,
      cwd,
      user: 'current-user', // TODO: Get from session
      timestamp: Date.now(),
      exitCode: result.exitCode,
      duration: result.executionTime,
      source: aliasName ? 'alias' : 'allowlist',
      stdout: result.stdout,
      stderr: result.stderr
    });

    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get execution logs
app.get('/api/alias/logs', async (req, res) => {
  const { limit = 10 } = req.query;
  const logs = await executionLogger.getRecentLogs(Number(limit));
  res.json({ success: true, logs });
});
```

**Acceptance Criteria:**
- ✅ `/api/alias/execute` endpoint working
- ✅ `/api/alias/logs` endpoint working
- ✅ Proper error handling
- ✅ Security validation before execution

---

## ✅ Definition of Done

- [ ] All TypeScript files compile without errors
- [ ] Allowlist validator blocks dangerous commands
- [ ] Execution logger saves to database
- [ ] Command executor runs without shell sourcing
- [ ] Timeout and cancel functionality works
- [ ] Backend API endpoints respond correctly
- [ ] `config/aliases.json` created with 10+ aliases
- [ ] All code reviewed for security vulnerabilities

---

## 🔐 Security Checklist

- [ ] No arbitrary shell execution
- [ ] Blacklist prevents destructive commands
- [ ] Whitelist enforces safe commands only
- [ ] No pipes/redirects/subshells from user input
- [ ] Timeout prevents infinite loops
- [ ] Execution logs provide audit trail
- [ ] WebSocket bound to localhost only

---

## 📚 Resources

- node-pty documentation: https://github.com/microsoft/node-pty
- Command injection prevention: https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html

---

**Status**: Ready for implementation  
**Next**: Hand off to AIRanger Claude for Alias Management (Phase 3)

**Rangers lead the way!** 🎖️

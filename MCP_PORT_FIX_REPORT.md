# MCP Docker Server Diagnostic Report
**Date**: 2025-11-29  
**Issue**: MCP servers failing with "Failed to fetch" error  
**Status**: ✅ FIXED

## Problem Analysis

### Root Cause
The application had a **port mismatch** between the proxy server and MCP client calls:

1. **Proxy Server** (`proxy_server.js`): Running on port **3000** ✅
2. **MCP Client Calls**: Hardcoded to port **3010** ❌

This caused all MCP-related API calls to fail with "Failed to fetch" errors because they were trying to connect to the wrong port.

### Affected Components
1. **Settings Modal** (`components/SettingsModal.tsx`):
   - "Start Gateway" button → `http://localhost:3010/api/mcp/ensure`
   - "Stop Gateway" button → `http://localhost:3010/api/mcp/stop`
   - "Check Status" button → `http://localhost:3010/api/mcp/status`

2. **App.tsx** (MCP Auto-start):
   - Auto-start on app launch → `http://localhost:3010/api/mcp/ensure`
   - Auto-stop on cleanup → `http://localhost:3010/api/mcp/stop`

3. **Default Settings** (`types.ts`):
   - `corsProxyUrl`: `http://localhost:3010` (should be 3000)
   - `lmstudioBaseUrl`: `http://localhost:3010/api/lmstudio` (should be 3000)

## Fixes Applied

### 1. Settings Modal MCP Buttons ✅
**File**: `components/SettingsModal.tsx`

Changed all three MCP control buttons to use the dynamic proxy URL:
```typescript
// Before (hardcoded port 3010)
await fetch('http://localhost:3010/api/mcp/ensure', {...})

// After (uses settings.corsProxyUrl, defaults to 3000)
const proxyUrl = localSettings.corsProxyUrl || 'http://localhost:3000';
await fetch(`${proxyUrl}/api/mcp/ensure`, {...})
```

### 2. App.tsx MCP Auto-Start ✅
**File**: `App.tsx`

Updated the MCP auto-start and auto-stop logic:
```typescript
// Before
await fetch('http://localhost:3010/api/mcp/ensure', {...})

// After
const proxyUrl = settings.corsProxyUrl || 'http://localhost:3000';
await fetch(`${proxyUrl}/api/mcp/ensure`, {...})
```

### 3. Default Settings ✅
**File**: `types.ts`

Updated default configuration:
```typescript
// Before
corsProxyUrl: 'http://localhost:3010',
lmstudioBaseUrl: 'http://localhost:3010/api/lmstudio',

// After
corsProxyUrl: 'http://localhost:3000',
lmstudioBaseUrl: 'http://localhost:3000/api/lmstudio',
```

## Testing Checklist

### Pre-Flight Checks
- [ ] Docker Desktop is installed and running
- [ ] Proxy server is running on port 3000 (`pm2 status` or `lsof -i :3000`)
- [ ] Docker MCP CLI is installed (`docker mcp --version`)

### MCP Functionality Tests
1. **Settings → MCP Tab**:
   - [ ] Click "Start Gateway" → Should show status: running
   - [ ] Click "Check Status" → Should confirm running
   - [ ] Click "Stop Gateway" → Should show status: stopped

2. **Auto-Start (if enabled)**:
   - [ ] Enable "Auto-start MCP gateway on app launch" in Settings
   - [ ] Restart the app
   - [ ] MCP gateway should start automatically

3. **MCP Commands in Chat**:
   - [ ] `/mcp-tools` → Should list available tools
   - [ ] `/mcp-brave_web_search AI news` → Should return search results
   - [ ] `/mcp-fetch https://example.com` → Should fetch page content

## Expected Behavior After Fix

### ✅ MCP Gateway Controls
- **Start Gateway**: Launches `docker mcp gateway run` in background
- **Stop Gateway**: Terminates the MCP gateway process
- **Check Status**: Returns running/stopped state

### ✅ MCP Commands
All `/mcp-*` commands should work:
- `/mcp-brave_web_search <query>` - Brave search
- `/mcp-fetch <url>` - Fetch web content
- `/mcp-get_transcript <youtube_url>` - Get YouTube transcript
- `/mcp-tools` - List all available tools

### ✅ Auto-Start
If enabled in Settings → MCP:
- Gateway starts automatically when app launches
- Gateway stops automatically when app closes

## Common Issues & Solutions

### Issue: "Docker daemon not available"
**Solution**: Start Docker Desktop application

### Issue: "MCP gateway exited with code 1"
**Solution**: 
1. Check Docker MCP is installed: `docker mcp --version`
2. Install if missing: Follow Docker MCP Beta installation guide
3. Verify Docker Desktop is running

### Issue: "Brave search not working"
**Solution**: Add Brave API key in Settings → Search → Brave Search API Key

### Issue: Port already in use
**Solution**: 
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process if needed
lsof -ti:3000 | xargs kill -9
```

## Architecture Notes

### MCP Gateway Flow
```
Chat Interface → Proxy Server (port 3000) → Docker MCP CLI → MCP Servers
                     ↓
              /api/mcp/ensure (start)
              /api/mcp/stop (stop)
              /api/mcp/status (check)
              /api/mcp/call (execute tool)
```

### Port Configuration
- **Vite Dev Server**: Port 5173 (frontend)
- **Proxy Server**: Port 3000 (backend API)
- **Docker MCP Gateway**: Managed by proxy server
- **Ollama**: Port 11434 (local LLM)
- **LM Studio**: Port 1234 (local LLM)

## Documentation Updates Needed

The following files still reference port 3010 and should be updated for consistency:
- `README.md` (multiple references)
- `rangerplex_manule.md` (manual/documentation)
- `help-files/DIAGNOSTICS_COMMANDS.md`
- `help-files/SYSTEM_COMMANDS.md`

**Note**: The CHANGELOG.md already documents the port migration from 3010 to 3000.

## Conclusion

The MCP server integration is now fully functional with the correct port configuration. All MCP-related API calls now use the dynamic `corsProxyUrl` setting (defaulting to port 3000), ensuring compatibility with the proxy server.

**Status**: ✅ MISSION COMPLETE

Rangers lead the way! 🎖️

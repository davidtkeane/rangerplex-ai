# 🐳 Docker MCP Quick Reference Card

## 🚀 Getting Started (3 Commands)

```bash
# 1. List what's already running
docker mcp server list

# 2. Browse all 310 available servers
docker mcp catalog show docker-mcp

# 3. See what tools you can use right now
docker mcp tools list
```

---

## 📦 Server Management

```bash
# Enable a new server
docker mcp server enable <server-name>

# Disable a server
docker mcp server disable <server-name>

# Get server details
docker mcp server inspect <server-name>

# View server logs
docker mcp server logs <server-name>
```

---

## 🔍 Finding Servers

```bash
# Search for database servers
docker mcp catalog show docker-mcp | grep -i database

# Search for AI/ML servers
docker mcp catalog show docker-mcp | grep -i "ai\|ml\|openai"

# Search for WordPress-related servers
docker mcp catalog show docker-mcp | grep -i wordpress
```

---

## 🛠️ Using Tools

```bash
# List all available tools (30 currently)
docker mcp tools list

# Get details about a specific tool
docker mcp tools inspect <tool-name>

# Test a tool
docker mcp tools call <tool-name>

# Example: Search with DuckDuckGo
docker mcp tools call search
```

---

## 🌐 Gateway (WordPress Integration)

```bash
# Start the HTTP gateway
docker mcp gateway run

# This creates an HTTP endpoint at http://localhost:8808
# WordPress can make HTTP requests to access all MCP tools
```

---

## 🔐 Secrets Management

```bash
# Set an API key for a server
docker mcp secret set <server-name> <key-name> "your-api-key"

# Example: Set Brave API key
docker mcp secret set BRAVE_API_KEY="your-brave-api-key"

# List all secrets
docker mcp secret list

# Delete a secret
docker mcp secret delete <server-name> <key-name>
```

---

## 🔌 Client Integration

```bash
# Connect to AI clients
docker mcp client connect claude-desktop
docker mcp client connect cursor
docker mcp client connect vscode
docker mcp client connect gemini

# List connected clients
docker mcp client ls

# Disconnect a client
docker mcp client disconnect <client-name>
```

---

## 📊 Currently Enabled (6 Servers)

| Server | Ready? | Description |
|--------|--------|-------------|
| **duckduckgo** | ✅ | Privacy-focused web search |
| **fetch** | ✅ | URL content extraction |
| **youtube_transcript** | ✅ | YouTube transcripts |
| **dice** | ✅ | Random number generation |
| **brave** | ⚠️ API key needed | Comprehensive web search |
| **obsidian** | ⚠️ Config needed | Obsidian vault integration |

---

## 🎯 Recommended Servers for WordPress

```bash
# Database integration
docker mcp server enable postgresql
docker mcp server enable mongodb
docker mcp server enable sqlite-mcp-server

# Content & SEO
docker mcp server enable fetch          # Already enabled!
docker mcp server enable tavily         # Advanced web search

# Security
docker mcp server enable sonarqube      # Code quality
docker mcp server enable stackhawk      # Security scanning

# Communication
docker mcp server enable slack
docker mcp server enable email
```

---

## 🚨 Troubleshooting

```bash
# Check if Docker is running
docker info

# Restart Docker Desktop (macOS)
killall "Docker Desktop" && open -a "Docker Desktop"

# View all Docker MCP help
docker mcp --help

# Check specific command help
docker mcp server --help
docker mcp catalog --help
docker mcp tools --help
```

---

## 💡 Pro Tips

1. **Auto-complete**: Use Tab key when typing server names
2. **Pipe to less**: `docker mcp catalog show docker-mcp | less` for easier browsing
3. **Save searches**: `docker mcp catalog show docker-mcp | grep -i "keyword" > results.txt`
4. **Test first**: Always `inspect` and `call` tools before production use
5. **Update regularly**: `docker mcp catalog update` for new servers

---

## 🎖️ Auto-Start Feature

Docker Desktop now **automatically starts** when you run:
```bash
npm run browser      # Default (Electron)
npm run browser -t   # Browser tab only
npm run browser -b   # Both Electron + tab
```

**Cross-platform support**: macOS, Windows, Linux

---

## 📚 Full Documentation

- **Complete Manual**: `help-files/DOCKER_MCP_MANUAL.md`
- **In RangerPlex**: Type `/manual` and navigate to Docker MCP section
- **Mission Summary**: `DOCKER_MCP_MISSION_COMPLETE.md`

---

**Rangers lead the way!** 🎖️

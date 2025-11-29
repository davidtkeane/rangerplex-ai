# MCP Servers & Tools (Docker MCP Gateway)

Use any tool with the slash form: `/mcp-<tool> [input]` (or `/mcp <tool> [input]`).

- **Brave (search)**
  - `brave_web_search` → `/mcp-brave_web_search <query>`
  - `brave_image_search` → `/mcp-brave_image_search <query>`
  - `brave_news_search` → `/mcp-brave_news_search <query>`
  - `brave_video_search` → `/mcp-brave_video_search <query>`
- **DuckDuckGo**
  - `search` → `/mcp-search <query>`
- **Fetch**
  - `fetch` → `/mcp-fetch <url>`
  - `fetch_content` → `/mcp-fetch_content <url>`
- **YouTube Transcript**
  - `get_transcript` → `/mcp-get_transcript <youtube_url>`
  - `get_timed_transcript` → `/mcp-get_timed_transcript <youtube_url>`
  - `get_video_info` → `/mcp-get_video_info <youtube_url>`
- **Obsidian** (needs vault config/secret)
  - `obsidian_get_file_contents` → `/mcp-obsidian_get_file_contents <path>`
  - `obsidian_append_content` → `/mcp-obsidian_append_content <path> <content>`
  - `obsidian_search` → `/mcp-obsidian_search <query>`
  - `obsidian_list_files_in_vault` → `/mcp-obsidian_list_files_in_vault`
  - `obsidian_get_recent_changes` → `/mcp-obsidian_get_recent_changes`
  - (additional Obsidian tools may be available depending on your gateway config)
- **MCP Management / Meta**
  - `mcp-add`, `mcp-remove`, `mcp-find`, `mcp-exec`, `mcp-config-set`, `mcp-discover`, `code-mode`
  - Run as `/mcp-mcp-add ...`, etc.

Notes:
- Docker Desktop must be running; gateway can be started in Settings → MCP or via `/api/mcp/ensure`.
- Brave tools require a Brave API key set in Settings.
- Obsidian tools require Obsidian config/secret set for the gateway.
- Use `/mcp-tools` to see the live list from your running gateway.

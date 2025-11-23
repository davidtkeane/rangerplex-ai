import { MCPServerConfig } from "../types";
import { convertHtmlToMarkdown } from "./htmlToMarkdown";

// This service acts as a Client for MCP.
// Since we are in a browser, we primarily support "Internal" tools
// or potential WebSocket bridges.

export interface MCPTool {
  name: string;
  description: string;
  execute: (args: any) => Promise<string>;
}

class MCPRegistry {
  private tools: Map<string, MCPTool> = new Map();

  constructor() {
    this.registerInternalTools();
  }

  private registerInternalTools() {
    // 1. Firecrawl Clone (HTML to Markdown)
    this.registerTool({
      name: "html_to_markdown",
      description: "Converts raw HTML code into clean Markdown, removing scripts and styles.",
      execute: async ({ html }) => {
        return convertHtmlToMarkdown(html);
      }
    });

    // 2. Echo (Test Tool)
    this.registerTool({
        name: "echo",
        description: "Returns the input string. Useful for testing connection.",
        execute: async ({ text }) => `Echo: ${text}`
    });

    // 3. Research Planner (Inspired by gpt-researcher)
    this.registerTool({
        name: "research_planner",
        description: "Generates a structured research plan based on a topic.",
        execute: async ({ topic }) => {
            return JSON.stringify({
                topic,
                status: "planned",
                sections: [
                    "Introduction & Background",
                    "Key Recent Developments (2023-2025)",
                    "Comparative Analysis",
                    "Future Outlook",
                    "References"
                ],
                search_queries: [
                    `${topic} latest developments 2024 2025`,
                    `${topic} comprehensive guide`,
                    `${topic} analysis and statistics`,
                    `${topic} future trends`
                ]
            }, null, 2);
        }
    });
  }

  registerTool(tool: MCPTool) {
    this.tools.set(tool.name, tool);
  }

  getTools() {
    return Array.from(this.tools.values()).map(t => ({ name: t.name, description: t.description }));
  }

  async executeTool(name: string, args: any) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool ${name} not found`);
    return await tool.execute(args);
  }

  async checkServerStatus(server: MCPServerConfig): Promise<'connected' | 'disconnected' | 'error'> {
      if (server.type === 'internal') return 'connected';
      if (server.type === 'websocket') {
          // Mock check for now
          try {
              // In a real scenario, we'd try to open a WS connection here
              // const ws = new WebSocket(server.url);
              return 'error'; // Fail default for now until real WS server is available
          } catch {
              return 'error';
          }
      }
      return 'disconnected';
  }
}

export const mcpRegistry = new MCPRegistry();
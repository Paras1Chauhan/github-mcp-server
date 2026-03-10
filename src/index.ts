import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerRepoTools } from "./tools/repo-tools.js";
import { registerFileTools } from "./tools/file-tools.js";
import { registerProfileTools } from "./tools/profile-tools.js";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;

if (!GITHUB_TOKEN) {
  console.error("❌ Error: GITHUB_TOKEN environment variable is required.");
  process.exit(1);
}

if (!GITHUB_USERNAME) {
  console.error("❌ Error: GITHUB_USERNAME environment variable is required.");
  process.exit(1);
}

const server = new McpServer({
  name: "github-mcp-server",
  version: "1.0.0",
});

const getToken = (): string => GITHUB_TOKEN;
const getUsername = (): string => GITHUB_USERNAME;

registerRepoTools(server, getToken, getUsername);
registerFileTools(server, getToken, getUsername);
registerProfileTools(server, getToken);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ GitHub MCP Server running (stdio)");
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerRepoTools } from './tools/repo-tools.js';
import { registerFileTools } from './tools/file-tools.js';
import { registerProfileTools } from './tools/profile-tools.js';

const server = new McpServer({
  name: 'github-mcp-server',
  version: '2.0.0',
});

registerRepoTools(server);
registerFileTools(server);
registerProfileTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GitHub MCP Server v2.0.0 running on stdio');
}

main().catch(console.error);

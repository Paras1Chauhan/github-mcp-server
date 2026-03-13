import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const server = new Server(
  { name: 'github-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_profile',
      description: 'Get authenticated GitHub user profile',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'list_repos',
      description: 'List repositories for a GitHub user',
      inputSchema: {
        type: 'object',
        properties: {
          username: { type: 'string', description: 'GitHub username (optional)' },
        },
      },
    },
    {
      name: 'create_repo',
      description: 'Create a new GitHub repository',
      inputSchema: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: 'Repository name' },
          description: { type: 'string', description: 'Repository description' },
          private: { type: 'boolean', description: 'Make repo private' },
          auto_init: { type: 'boolean', description: 'Initialize with README' },
        },
      },
    },
    {
      name: 'read_file',
      description: 'Read a file from a GitHub repository',
      inputSchema: {
        type: 'object',
        required: ['repo', 'path'],
        properties: {
          repo: { type: 'string', description: 'Repository name' },
          path: { type: 'string', description: 'File path in the repo' },
          owner: { type: 'string', description: 'Repo owner (optional)' },
        },
      },
    },
    {
      name: 'push_file',
      description: 'Create or update a file in a GitHub repository',
      inputSchema: {
        type: 'object',
        required: ['repo', 'path', 'content', 'message'],
        properties: {
          repo: { type: 'string', description: 'Repository name' },
          path: { type: 'string', description: 'File path in the repo' },
          content: { type: 'string', description: 'File content' },
          message: { type: 'string', description: 'Commit message' },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_profile': {
        const { data } = await octokit.users.getAuthenticated();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              login: data.login,
              name: data.name,
              bio: data.bio,
              location: data.location,
              public_repos: data.public_repos,
              followers: data.followers,
              following: data.following,
            }, null, 2),
          }],
        };
      }

      case 'list_repos': {
        const username = (args as any)?.username;
        const { data } = username
          ? await octokit.repos.listForUser({ username })
          : await octokit.repos.listForAuthenticatedUser();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(
              data.map((r) => ({
                name: r.name,
                description: r.description,
                language: r.language,
                stars: r.stargazers_count,
                private: r.private,
                url: r.html_url,
              })),
              null, 2
            ),
          }],
        };
      }

      case 'create_repo': {
        const { name: repoName, description, private: isPrivate, auto_init } = args as any;
        const { data } = await octokit.repos.createForAuthenticatedUser({
          name: repoName,
          description,
          private: isPrivate ?? false,
          auto_init: auto_init ?? true,
        });
        return {
          content: [{ type: 'text', text: `Repository created: ${data.html_url}` }],
        };
      }

      case 'read_file': {
        const { repo, path, owner } = args as any;
        const { data } = await octokit.repos.getContent({
          owner: owner || (await octokit.users.getAuthenticated()).data.login,
          repo,
          path,
        });
        const content = Buffer.from((data as any).content, 'base64').toString('utf-8');
        return {
          content: [{ type: 'text', text: content }],
        };
      }

      case 'push_file': {
        const { repo, path, content, message } = args as any;
        const { data: user } = await octokit.users.getAuthenticated();
        let sha: string | undefined;
        try {
          const { data } = await octokit.repos.getContent({ owner: user.login, repo, path });
          sha = (data as any).sha;
        } catch {}
        await octokit.repos.createOrUpdateFileContents({
          owner: user.login,
          repo,
          path,
          message,
          content: Buffer.from(content).toString('base64'),
          sha,
        });
        return {
          content: [{ type: 'text', text: `File '${path}' pushed to '${repo}' successfully.` }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GitHub MCP Server running on stdio');
}

main().catch(console.error);

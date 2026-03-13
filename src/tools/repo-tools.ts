import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { octokit, getAuthenticatedUser, handleGitHubError } from '../services/github.js';

export function registerRepoTools(server: McpServer) {

  // List repos
  server.tool(
    'github_list_repos',
    'List all repositories for a GitHub user',
    { username: z.string().optional().describe('GitHub username (defaults to authenticated user)') },
    async ({ username }) => {
      try {
        const { data } = username
          ? await octokit.repos.listForUser({ username, per_page: 100 })
          : await octokit.repos.listForAuthenticatedUser({ per_page: 100 });
        const repos = data.map(r => ({
          name: r.name,
          description: r.description,
          language: r.language,
          stars: r.stargazers_count,
          private: r.private,
          url: r.html_url,
          topics: r.topics,
        }));
        return { content: [{ type: 'text' as const, text: JSON.stringify(repos, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${handleGitHubError(e)}` }], isError: true };
      }
    }
  );

  // Get repo details
  server.tool(
    'github_get_repo',
    'Get detailed information about a specific repository',
    {
      repo: z.string().describe('Repository name'),
      owner: z.string().optional().describe('Repo owner (defaults to authenticated user)'),
    },
    async ({ repo, owner }) => {
      try {
        const user = owner || (await getAuthenticatedUser()).login;
        const { data } = await octokit.repos.get({ owner: user, repo });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            name: data.name,
            description: data.description,
            language: data.language,
            stars: data.stargazers_count,
            forks: data.forks_count,
            private: data.private,
            topics: data.topics,
            url: data.html_url,
            default_branch: data.default_branch,
            created_at: data.created_at,
            updated_at: data.updated_at,
          }, null, 2) }],
        };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${handleGitHubError(e)}` }], isError: true };
      }
    }
  );

  // Update repo
  server.tool(
    'github_update_repo',
    'Update repo name, description, or topics',
    {
      repo: z.string().describe('Current repository name'),
      owner: z.string().optional(),
      new_name: z.string().optional().describe('New repository name'),
      description: z.string().optional().describe('New description'),
      topics: z.array(z.string()).optional().describe('Topics/tags'),
    },
    async ({ repo, owner, new_name, description, topics }) => {
      try {
        const user = owner || (await getAuthenticatedUser()).login;
        if (new_name || description !== undefined) {
          await octokit.repos.update({
            owner: user, repo,
            ...(new_name && { name: new_name }),
            ...(description !== undefined && { description }),
          });
        }
        if (topics) {
          await octokit.repos.replaceAllTopics({ owner: user, repo: new_name || repo, names: topics });
        }
        return { content: [{ type: 'text' as const, text: `Repo '${repo}' updated successfully.` }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${handleGitHubError(e)}` }], isError: true };
      }
    }
  );

  // Set visibility
  server.tool(
    'github_set_repo_visibility',
    'Make a repo public or private',
    {
      repo: z.string(),
      private: z.boolean().describe('true = private, false = public'),
      owner: z.string().optional(),
    },
    async ({ repo, private: isPrivate, owner }) => {
      try {
        const user = owner || (await getAuthenticatedUser()).login;
        await octokit.repos.update({ owner: user, repo, private: isPrivate });
        return { content: [{ type: 'text' as const, text: `Repo '${repo}' is now ${isPrivate ? 'private' : 'public'}.` }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${handleGitHubError(e)}` }], isError: true };
      }
    }
  );

  // Delete repo
  server.tool(
    'github_delete_repo',
    'Permanently delete a repository (requires confirm=true)',
    {
      repo: z.string(),
      owner: z.string().optional(),
      confirm: z.boolean().describe('Must be true to proceed'),
    },
    async ({ repo, owner, confirm }) => {
      if (!confirm) return { content: [{ type: 'text' as const, text: 'Deletion cancelled. Pass confirm=true to proceed.' }] };
      try {
        const user = owner || (await getAuthenticatedUser()).login;
        await octokit.repos.delete({ owner: user, repo });
        return { content: [{ type: 'text' as const, text: `Repo '${repo}' permanently deleted.` }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${handleGitHubError(e)}` }], isError: true };
      }
    }
  );

  // Create repo
  server.tool(
    'github_create_repo',
    'Create a new GitHub repository',
    {
      name: z.string().describe('Repository name'),
      description: z.string().optional(),
      private: z.boolean().optional().default(false),
      auto_init: z.boolean().optional().default(true),
    },
    async ({ name, description, private: isPrivate, auto_init }) => {
      try {
        const { data } = await octokit.repos.createForAuthenticatedUser({
          name, description, private: isPrivate, auto_init,
        });
        return { content: [{ type: 'text' as const, text: `Repository created: ${data.html_url}` }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${handleGitHubError(e)}` }], isError: true };
      }
    }
  );

  // List branches
  server.tool(
    'github_list_branches',
    'List all branches in a repository',
    {
      repo: z.string(),
      owner: z.string().optional(),
    },
    async ({ repo, owner }) => {
      try {
        const user = owner || (await getAuthenticatedUser()).login;
        const { data } = await octokit.repos.listBranches({ owner: user, repo });
        return { content: [{ type: 'text' as const, text: JSON.stringify(data.map(b => b.name), null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${handleGitHubError(e)}` }], isError: true };
      }
    }
  );
}

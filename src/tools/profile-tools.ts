import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { octokit, handleGitHubError } from '../services/github.js';

export function registerProfileTools(server: McpServer) {

  server.tool(
    'github_get_profile',
    'Get the authenticated GitHub user profile',
    {},
    async () => {
      try {
        const { data } = await octokit.users.getAuthenticated();
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            login: data.login,
            name: data.name,
            bio: data.bio,
            location: data.location,
            email: data.email,
            blog: data.blog,
            twitter_username: data.twitter_username,
            public_repos: data.public_repos,
            followers: data.followers,
            following: data.following,
            avatar_url: data.avatar_url,
            html_url: data.html_url,
          }, null, 2) }],
        };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${handleGitHubError(e)}` }], isError: true };
      }
    }
  );

  server.tool(
    'github_update_profile',
    'Update GitHub profile: name, bio, location, website, email, or Twitter username',
    {
      name: z.string().optional(),
      bio: z.string().optional(),
      location: z.string().optional(),
      blog: z.string().optional().describe('Website or blog URL'),
      email: z.string().optional(),
      twitter_username: z.string().optional(),
    },
    async ({ name, bio, location, blog, email, twitter_username }) => {
      try {
        await octokit.users.updateAuthenticated({
          ...(name && { name }),
          ...(bio && { bio }),
          ...(location && { location }),
          ...(blog && { blog }),
          ...(email && { email }),
          ...(twitter_username && { twitter_username }),
        });
        return { content: [{ type: 'text' as const, text: 'Profile updated successfully.' }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${handleGitHubError(e)}` }], isError: true };
      }
    }
  );
}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { octokit, getAuthenticatedUser, handleGitHubError } from '../services/github.js';

export function registerFileTools(server: McpServer) {

  // Read file
  server.tool(
    'github_read_file',
    'Read any file from a GitHub repository',
    {
      repo: z.string(),
      path: z.string().describe('File path (e.g. src/index.ts)'),
      owner: z.string().optional(),
    },
    async ({ repo, path, owner }) => {
      try {
        const user = owner || (await getAuthenticatedUser()).login;
        const { data } = await octokit.repos.getContent({ owner: user, repo, path });
        const content = Buffer.from((data as any).content, 'base64').toString('utf-8');
        return { content: [{ type: 'text' as const, text: content }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${handleGitHubError(e)}` }], isError: true };
      }
    }
  );

  // Write single file
  server.tool(
    'github_write_file',
    'Create or update a single file in a repository',
    {
      repo: z.string(),
      path: z.string(),
      content: z.string().describe('Full file content'),
      message: z.string().describe('Commit message'),
      owner: z.string().optional(),
    },
    async ({ repo, path, content, message, owner }) => {
      try {
        const user = owner || (await getAuthenticatedUser()).login;
        let sha: string | undefined;
        try {
          const { data } = await octokit.repos.getContent({ owner: user, repo, path });
          sha = (data as any).sha;
        } catch {}
        await octokit.repos.createOrUpdateFileContents({
          owner: user, repo, path, message,
          content: Buffer.from(content).toString('base64'),
          sha,
        });
        return { content: [{ type: 'text' as const, text: `File '${path}' pushed to '${repo}' successfully.` }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${handleGitHubError(e)}` }], isError: true };
      }
    }
  );

  // Push multiple files
  server.tool(
    'github_push_files',
    'Push multiple files to a repo in a single commit using Git Trees API',
    {
      repo: z.string(),
      files: z.array(z.object({
        path: z.string(),
        content: z.string(),
      })).describe('Array of { path, content } objects'),
      message: z.string().describe('Commit message'),
      owner: z.string().optional(),
      branch: z.string().optional().default('main'),
    },
    async ({ repo, files, message, owner, branch }) => {
      try {
        const user = owner || (await getAuthenticatedUser()).login;

        // 1. Get latest commit SHA
        const { data: refData } = await octokit.git.getRef({ owner: user, repo, ref: `heads/${branch}` });
        const latestCommitSha = refData.object.sha;

        // 2. Get base tree SHA
        const { data: commitData } = await octokit.git.getCommit({ owner: user, repo, commit_sha: latestCommitSha });
        const baseTreeSha = commitData.tree.sha;

        // 3. Create blobs
        const treeItems = await Promise.all(files.map(async (file) => {
          const { data: blob } = await octokit.git.createBlob({
            owner: user, repo,
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          });
          return { path: file.path, mode: '100644' as const, type: 'blob' as const, sha: blob.sha };
        }));

        // 4. Create tree
        const { data: newTree } = await octokit.git.createTree({
          owner: user, repo, base_tree: baseTreeSha, tree: treeItems,
        });

        // 5. Create commit
        const { data: newCommit } = await octokit.git.createCommit({
          owner: user, repo, message,
          tree: newTree.sha,
          parents: [latestCommitSha],
        });

        // 6. Update ref
        await octokit.git.updateRef({ owner: user, repo, ref: `heads/${branch}`, sha: newCommit.sha });

        return { content: [{ type: 'text' as const, text: `✅ ${files.length} files pushed to '${repo}' on branch '${branch}'.\nCommit: ${newCommit.sha.slice(0, 7)}` }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${handleGitHubError(e)}` }], isError: true };
      }
    }
  );

  // Auto-generate README
  server.tool(
    'github_create_repo_readme',
    'Auto-generate and push a professional README.md for a repository',
    {
      repo: z.string(),
      project_title: z.string(),
      description: z.string(),
      tech_stack: z.array(z.string()),
      features: z.array(z.string()).optional(),
      setup_steps: z.array(z.string()).optional(),
      live_url: z.string().optional(),
      owner: z.string().optional(),
    },
    async ({ repo, project_title, description, tech_stack, features, setup_steps, live_url, owner }) => {
      try {
        const user = owner || (await getAuthenticatedUser()).login;
        const badges = tech_stack.map(tech => {
          const t = tech.toLowerCase().replace(/[^a-z0-9]/g, '');
          return `![${tech}](https://img.shields.io/badge/${tech.replace(/-/g, '--')}-informational?style=flat-square)`;
        }).join(' ');

        const featuresSection = features?.length
          ? `\n## ✨ Features\n\n${features.map(f => `- ${f}`).join('\n')}\n`
          : '';

        const setupSection = setup_steps?.length
          ? `\n## 🚀 Getting Started\n\n\`\`\`bash\n${setup_steps.join('\n')}\n\`\`\`\n`
          : `\n## 🚀 Getting Started\n\n\`\`\`bash\ngit clone https://github.com/${user}/${repo}.git\ncd ${repo}\nnpm install\nnpm run dev\n\`\`\`\n`;

        const demoSection = live_url ? `\n## 🌐 Live Demo\n\n[${project_title}](${live_url})\n` : '';

        const readme = `# ${project_title}\n\n> ${description}\n\n${badges}\n${demoSection}\n## 📖 About\n\n${description}\n${featuresSection}\n## 🛠️ Tech Stack\n\n${tech_stack.map(t => `- **${t}**`).join('\n')}\n${setupSection}\n## 📄 License\n\nMIT License\n\n---\n\n*Made with ❤️ by [${user}](https://github.com/${user})*\n`;

        let sha: string | undefined;
        try {
          const { data } = await octokit.repos.getContent({ owner: user, repo, path: 'README.md' });
          sha = (data as any).sha;
        } catch {}

        await octokit.repos.createOrUpdateFileContents({
          owner: user, repo, path: 'README.md',
          message: 'docs: add professional README',
          content: Buffer.from(readme).toString('base64'),
          sha,
        });
        return { content: [{ type: 'text' as const, text: `README.md generated and pushed to '${repo}' successfully.` }] };
      } catch (e: any) {
        return { content: [{ type: 'text' as const, text: `Error: ${handleGitHubError(e)}` }], isError: true };
      }
    }
  );
}

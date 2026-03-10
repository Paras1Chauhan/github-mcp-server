import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listRepos, getRepo, updateRepo, deleteRepo, setRepoVisibility } from "../services/github.js";

export function registerRepoTools(server: McpServer, getToken: () => string, getUsername: () => string): void {

  server.registerTool("github_list_repos", {
    title: "List GitHub Repos",
    description: "List all repositories for a GitHub user.",
    inputSchema: z.object({ username: z.string().optional() }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ username }) => {
    const user = username || getUsername();
    const repos = await listRepos(getToken(), user);
    const lines = repos.map((r) => `• **${r.name}** [${r.visibility}] ${r.language ? `(${r.language})` : ""} ⭐${r.stargazers_count}\n  ${r.description || "_No description_"}`);
    return { content: [{ type: "text" as const, text: `## ${user}'s Repos (${repos.length})\n\n${lines.join("\n\n")}` }] };
  });

  server.registerTool("github_get_repo", {
    title: "Get GitHub Repo Details",
    description: "Get detailed info about a specific repository.",
    inputSchema: z.object({ repo: z.string(), owner: z.string().optional() }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ repo, owner }) => {
    const data = await getRepo(getToken(), owner || getUsername(), repo);
    const text = `## ${data.full_name}\n- **Description**: ${data.description || "_none_"}\n- **Language**: ${data.language || "_none_"}\n- **Visibility**: ${data.visibility}\n- **Stars**: ${data.stargazers_count} | **Forks**: ${data.forks_count}\n- **Topics**: ${data.topics?.join(", ") || "_none_"}\n- **URL**: ${data.html_url}`;
    return { content: [{ type: "text" as const, text }] };
  });

  server.registerTool("github_update_repo", {
    title: "Update GitHub Repo",
    description: "Update a repo's name, description, or topics.",
    inputSchema: z.object({
      repo: z.string(),
      owner: z.string().optional(),
      new_name: z.string().optional(),
      description: z.string().max(350).optional(),
      topics: z.array(z.string()).optional(),
    }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ repo, owner, new_name, description, topics }) => {
    const updated = await updateRepo(getToken(), owner || getUsername(), repo, { name: new_name, description, topics });
    return { content: [{ type: "text" as const, text: `✅ Repo updated!\n- Name: ${updated.name}\n- Description: ${updated.description}\n- URL: ${updated.html_url}` }] };
  });

  server.registerTool("github_set_repo_visibility", {
    title: "Set Repo Visibility",
    description: "Make a repo public or private.",
    inputSchema: z.object({ repo: z.string(), owner: z.string().optional(), private: z.boolean() }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ repo, owner, private: isPrivate }) => {
    const updated = await setRepoVisibility(getToken(), owner || getUsername(), repo, isPrivate);
    return { content: [{ type: "text" as const, text: `✅ **${updated.name}** is now **${isPrivate ? "private 🔒" : "public 🌍"}**` }] };
  });

  server.registerTool("github_delete_repo", {
    title: "Delete GitHub Repo",
    description: "⚠️ PERMANENTLY delete a repository. Cannot be undone.",
    inputSchema: z.object({ repo: z.string(), owner: z.string().optional(), confirm: z.literal(true) }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  }, async ({ repo, owner, confirm: _ }) => {
    await deleteRepo(getToken(), owner || getUsername(), repo);
    return { content: [{ type: "text" as const, text: `🗑️ Repo **${repo}** permanently deleted.` }] };
  });
}

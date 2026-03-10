import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getProfile, updateProfile } from "../services/github.js";

export function registerProfileTools(server: McpServer, getToken: () => string): void {

  server.registerTool("github_get_profile", {
    title: "Get GitHub Profile",
    description: "Get the authenticated user's GitHub profile.",
    inputSchema: z.object({}).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async () => {
    const p = await getProfile(getToken());
    const text = `## @${p.login}\n- **Name**: ${p.name || "_not set_"}\n- **Bio**: ${p.bio || "_not set_"}\n- **Location**: ${p.location || "_not set_"}\n- **Blog**: ${p.blog || "_not set_"}\n- **Followers**: ${p.followers} | **Following**: ${p.following}\n- **Public Repos**: ${p.public_repos}`;
    return { content: [{ type: "text" as const, text }] };
  });

  server.registerTool("github_update_profile", {
    title: "Update GitHub Profile",
    description: "Update your GitHub profile: name, bio, location, website, email, or Twitter.",
    inputSchema: z.object({
      name: z.string().optional(),
      bio: z.string().max(160).optional(),
      blog: z.string().optional(),
      location: z.string().optional(),
      email: z.string().email().optional(),
      twitter_username: z.string().optional(),
    }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async (updates) => {
    await updateProfile(getToken(), updates);
    const changes = Object.entries(updates).filter(([, v]) => v !== undefined).map(([k, v]) => `- **${k}**: ${v}`).join("\n");
    return { content: [{ type: "text" as const, text: `✅ Profile updated!\n\n${changes}` }] };
  });
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getFile, upsertFile, pushMultipleFiles, createRepo, listBranches } from "../services/github.js";

export function registerFileTools(server: McpServer, getToken: () => string, getUsername: () => string): void {

  server.registerTool("github_read_file", {
    title: "Read File from Repo",
    description: "Read any file from a GitHub repository.",
    inputSchema: z.object({ repo: z.string(), path: z.string().default("README.md"), owner: z.string().optional() }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ repo, path, owner }) => {
    const file = await getFile(getToken(), owner || getUsername(), repo, path);
    if (!file) return { content: [{ type: "text" as const, text: `❌ File '${path}' not found in ${repo}.` }] };
    const content = file.content ? Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf-8") : "_Binary or empty file_";
    return { content: [{ type: "text" as const, text: `## ${repo}/${path}\n\n\`\`\`\n${content}\n\`\`\`` }] };
  });

  server.registerTool("github_write_file", {
    title: "Write/Update File in Repo",
    description: "Create or update any file in a repository.",
    inputSchema: z.object({ repo: z.string(), path: z.string().default("README.md"), content: z.string(), message: z.string().default("docs: update file"), owner: z.string().optional() }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ repo, path, content, message, owner }) => {
    await upsertFile(getToken(), owner || getUsername(), repo, path, content, message);
    return { content: [{ type: "text" as const, text: `✅ **${path}** updated in **${repo}**` }] };
  });

  server.registerTool("github_push_files", {
    title: "Push Multiple Files in One Commit",
    description: "Push multiple files to a repo in a single commit using Git Trees API.",
    inputSchema: z.object({
      repo: z.string(),
      owner: z.string().optional(),
      files: z.array(z.object({ path: z.string(), content: z.string() })).min(1),
      message: z.string(),
      branch: z.string().optional(),
    }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ repo, owner, files, message, branch }) => {
    const result = await pushMultipleFiles(getToken(), owner || getUsername(), repo, files, message, branch);
    const fileList = files.map((f) => `  • ${f.path}`).join("\n");
    return { content: [{ type: "text" as const, text: `✅ **${result.files_pushed} files pushed** to **${repo}** on \`${result.branch}\`\n\n**Files:**\n${fileList}\n\n**Commit**: \`${result.commit_sha.slice(0, 7)}\` — "${message}"` }] };
  });

  server.registerTool("github_create_repo", {
    title: "Create New GitHub Repository",
    description: "Create a brand new GitHub repository.",
    inputSchema: z.object({ name: z.string(), description: z.string().optional(), private: z.boolean().default(false), auto_init: z.boolean().default(true) }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ name, description, private: isPrivate, auto_init }) => {
    const repo = await createRepo(getToken(), { name, description, private: isPrivate, auto_init });
    return { content: [{ type: "text" as const, text: `✅ Repo **${repo.name}** created!\n- URL: ${repo.html_url}` }] };
  });

  server.registerTool("github_list_branches", {
    title: "List Repo Branches",
    description: "List all branches in a repository.",
    inputSchema: z.object({ repo: z.string(), owner: z.string().optional() }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ repo, owner }) => {
    const branches = await listBranches(getToken(), owner || getUsername(), repo);
    return { content: [{ type: "text" as const, text: `## Branches in ${repo}\n\n${branches.map((b) => `• \`${b}\``).join("\n")}` }] };
  });

  server.registerTool("github_create_repo_readme", {
    title: "Create Professional README for Repo",
    description: "Generate and push a professional README.md for a repository.",
    inputSchema: z.object({
      repo: z.string(), owner: z.string().optional(), project_title: z.string(), description: z.string(),
      tech_stack: z.array(z.string()), features: z.array(z.string()).optional(),
      setup_steps: z.array(z.string()).optional(), live_url: z.string().optional(),
    }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ repo, owner, project_title, description, tech_stack, features, setup_steps, live_url }) => {
    const badgeColors: Record<string, string> = { "Node.js": "339933", "Laravel": "FF2D20", "Vue.js": "4FC08D", "PHP": "777BB4", "MySQL": "4479A1", "JavaScript": "F7DF1E", "TypeScript": "3178C6", "Python": "3776AB", "React": "61DAFB" };
    const badges = tech_stack.map((tech) => { const color = badgeColors[tech] || "555555"; const logo = tech.toLowerCase().replace(/\./g, "").replace(/ /g, ""); return `![${tech}](https://img.shields.io/badge/${encodeURIComponent(tech)}-${color}?style=for-the-badge&logo=${logo}&logoColor=white)`; }).join(" ");
    const featuresSection = features?.length ? `\n## ✨ Features\n\n${features.map((f) => `- ${f}`).join("\n")}\n` : "";
    const setupSection = setup_steps?.length ? `\n## 🚀 Getting Started\n\n\`\`\`bash\n${setup_steps.join("\n")}\n\`\`\`\n` : "";
    const demoSection = live_url ? `\n## 🌐 Live Demo\n\n[View Live →](${live_url})\n` : "";
    const readme = `# ${project_title}\n\n> ${description}\n\n${badges}\n${demoSection}\n## 📖 About\n\n${description}\n${featuresSection}\n## 🛠️ Tech Stack\n\n${tech_stack.map((t) => `- **${t}**`).join("\n")}\n${setupSection}\n## 📄 License\n\nMIT License\n\n---\n\n*Made with ❤️ by [${owner || "Paras Chauhan"}](https://github.com/${owner || "Paras1Chauhan"})*\n`;
    await upsertFile(getToken(), owner || getUsername(), repo, "README.md", readme, "docs: add professional README");
    return { content: [{ type: "text" as const, text: `✅ Professional README created for **${repo}**!` }] };
  });
}

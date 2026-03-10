# 🐙 GitHub MCP Server

> A custom MCP server built with **Node.js & TypeScript** that lets Claude AI directly manage your GitHub — create repos, push code, update READMEs, manage visibility, and update your profile — all through natural language.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub_API-181717?style=for-the-badge&logo=github&logoColor=white)
![Claude](https://img.shields.io/badge/Claude_MCP-CC785C?style=for-the-badge&logo=anthropic&logoColor=white)

---

## ✨ Features

- 📁 **Create & delete** GitHub repositories
- 🚀 **Push multiple files** in one commit via Git Trees API
- ✏️ **Update** repo names, descriptions & topics
- 🔒 **Set visibility** — make repos public or private
- 📝 **Generate professional READMEs** automatically
- 👤 **Update GitHub profile** — bio, location, website & more
- 📖 **Read any file** from any repository
- 🌿 **List branches** in any repository

---

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `github_list_repos` | List all repos for a user |
| `github_get_repo` | Get detailed info about a repo |
| `github_update_repo` | Rename, add description & topics |
| `github_set_repo_visibility` | Make repo public or private |
| `github_delete_repo` | Permanently delete a repo |
| `github_read_file` | Read any file from a repo |
| `github_write_file` | Create or update a single file |
| `github_push_files` | Push multiple files in one commit |
| `github_create_repo` | Create a brand new repository |
| `github_list_branches` | List all branches in a repo |
| `github_create_repo_readme` | Auto-generate a professional README |
| `github_get_profile` | View your GitHub profile |
| `github_update_profile` | Update bio, location, website, etc. |

---

## 🚀 Setup & Installation

### Step 1 — Clone & Build

```bash
git clone https://github.com/Paras1Chauhan/github-mcp-server.git
cd github-mcp-server
npm install
npm run build
```

You should see a `dist/` folder created. That's the compiled server ready to run.

---

### Step 2 — Create a GitHub Personal Access Token

1. Go to → [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Give it a name: `Claude MCP`
4. Select these scopes:
   - ✅ `repo` — Full repository access
   - ✅ `user` — Update your profile
   - ✅ `delete_repo` — Delete repositories
5. Click **Generate token** and **copy it immediately**

> ⚠️ You won't be able to see the token again after leaving the page!

---

### Step 3 — Connect to Claude Desktop

Find your Claude Desktop config file:

| OS | Path |
|----|------|
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **Mac** | `~/Library/Application Support/Claude/claude_desktop_config.json` |

Open the file and add the following JSON:

#### 🪟 Windows

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\github-mcp-server\\dist\\index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here",
        "GITHUB_USERNAME": "YourGitHubUsername"
      }
    }
  }
}
```

#### 🍎 Mac / Linux

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["/Users/YourName/github-mcp-server/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here",
        "GITHUB_USERNAME": "YourGitHubUsername"
      }
    }
  }
}
```

> 💡 **Tips:**
> - Replace `YourName` with your actual system username
> - Replace `ghp_your_token_here` with your GitHub token
> - Replace `YourGitHubUsername` with your GitHub username
> - On Windows, use double backslashes `\\` in the path

---

### Step 4 — Restart Claude Desktop

Fully **quit** and **reopen** Claude Desktop (don't just reload).
You should see a 🔌 tools icon appear in the chat input box.

---

### Step 5 — Test It!

Type this in Claude:

> *"List all my GitHub repos"*

If you see your repos listed — **it's working!** 🎉

Then you can say things like:
> *"Fix all issues on my GitHub profile — rename bad repos, add descriptions, and make throwaway repos private"*

And Claude will do everything automatically!

---

## 💬 Example Prompts

Once connected, you can ask Claude:

```
"List all my GitHub repos"
"Create a new repo called my-portfolio"
"Push these files to my-project repo"
"Make the Hello repo private"
"Add a description and topics to my weather-app repo"
"Generate a professional README for my quiz-app"
"Update my GitHub bio to 'Full Stack Developer | Node.js | Laravel'"
```

---

## 🔧 Troubleshooting

| Problem | Fix |
|---------|-----|
| `Cannot find module` | Run `npm run build` again |
| `Invalid token (401)` | Regenerate your GitHub token |
| `Forbidden (403)` | Make sure `repo`, `user`, `delete_repo` scopes are checked |
| `Not found (404)` | Check repo name and username are correct |
| Tools not showing in Claude | Fully restart Claude Desktop |
| Path errors on Windows | Use double backslashes `\\` in the path |

---

## 📁 Project Structure

```
github-mcp-server/
├── src/
│   ├── index.ts              # Main entry point
│   ├── services/
│   │   └── github.ts         # GitHub API client & all API functions
│   └── tools/
│       ├── repo-tools.ts     # Repo management tools
│       ├── file-tools.ts     # File push & management tools
│       └── profile-tools.ts  # Profile tools
├── dist/                     # Compiled JavaScript (after npm run build)
├── package.json
└── tsconfig.json
```

---

## 📄 License

MIT License — feel free to use, modify and share!

---

*Made with ❤️ by [Paras Chauhan](https://github.com/Paras1Chauhan)*

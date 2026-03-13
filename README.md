# 🐙 GitHub MCP Server

A **Model Context Protocol (MCP)** server that lets Claude AI interact directly with GitHub — manage repositories, read files, push code, and view your profile.

---

## 🚀 Features

- 👤 **Get Profile** — Fetch your authenticated GitHub profile
- 📁 **List Repos** — List all repositories for any user
- ➕ **Create Repo** — Create new GitHub repositories
- 📄 **Read File** — Read any file from a repository
- 📤 **Push File** — Create or update files in a repository

---

## 🛠️ Tech Stack

- **TypeScript**
- **@modelcontextprotocol/sdk**
- **@octokit/rest** (GitHub API)
- **Node.js**

---

## ⚙️ Setup

### 1. Clone the repository
```bash
git clone https://github.com/Paras1Chauhan/github-mcp-server.git
cd github-mcp-server
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Add your GitHub Personal Access Token to .env
```

> Generate a token at: https://github.com/settings/tokens  
> Required scopes: `repo`, `read:user`, `user:email`

### 4. Build and run
```bash
npm run build
npm start
```

---

## 🔌 Claude Desktop Integration

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["/path/to/github-mcp-server/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

---

## 📌 Available Tools

| Tool | Description |
|------|-------------|
| `get_profile` | Get authenticated user's GitHub profile |
| `list_repos` | List repos for a user |
| `create_repo` | Create a new repository |
| `read_file` | Read a file from a repo |
| `push_file` | Push/update a file in a repo |

---

## 👨‍💻 Author

Made by [Paras Chauhan](https://github.com/Paras1Chauhan)

# 🔌 GitHub MCP Server v2.0

> A powerful Model Context Protocol (MCP) server for **GitHub** automation — built with TypeScript

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![MCP](https://img.shields.io/badge/MCP-SDK-blueviolet?style=flat-square)
![GitHub API](https://img.shields.io/badge/GitHub-API-181717?style=flat-square&logo=github)

---

## ✨ Tools (13 total)

### 🗂️ Repo Tools
| Tool | Description |
|---|---|
| `github_list_repos` | List all repos for any user |
| `github_get_repo` | Get detailed repo info |
| `github_create_repo` | Create a new repo |
| `github_update_repo` | Rename, add description & topics |
| `github_set_repo_visibility` | Make repo public or private |
| `github_delete_repo` | Permanently delete a repo |
| `github_list_branches` | List all branches |

### 📁 File Tools
| Tool | Description |
|---|---|
| `github_read_file` | Read any file from a repo |
| `github_write_file` | Create or update a single file |
| `github_push_files` | Push multiple files in one commit (Git Trees API) |
| `github_create_repo_readme` | Auto-generate a professional README |

### 👤 Profile Tools
| Tool | Description |
|---|---|
| `github_get_profile` | View your GitHub profile |
| `github_update_profile` | Update bio, location, website, Twitter |

---

## 🚀 Setup

### 1. Clone & Install
```bash
git clone https://github.com/Paras1Chauhan/github-mcp-server.git
cd github-mcp-server
npm install
```

### 2. Build
```bash
npm run build
```

### 3. Configure Claude Desktop

Edit `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac):

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\github-mcp-server\\dist\\index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here",
        "GITHUB_USERNAME": "YourUsername"
      }
    }
  }
}
```

### 4. GitHub Token Scopes Required
- ✅ `repo` — full repo access
- ✅ `user` — update profile
- ✅ `delete_repo` — delete repos

Get your token → [github.com/settings/tokens](https://github.com/settings/tokens)

---

## 📄 License

MIT License

---

*Made with ❤️ by [Paras1Chauhan](https://github.com/Paras1Chauhan)*

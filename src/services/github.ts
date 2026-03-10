import axios, { AxiosInstance, AxiosError } from "axios";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  visibility: string;
  updated_at: string;
  default_branch: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  content?: string;
  encoding?: string;
}

export interface GitHubProfile {
  login: string;
  name: string | null;
  bio: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  twitter_username: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

export interface FileEntry {
  path: string;
  content: string;
}

export interface PushResult {
  commit_sha: string;
  commit_url: string;
  files_pushed: number;
  branch: string;
}

export interface CreateRepoOptions {
  name: string;
  description?: string;
  private?: boolean;
  auto_init?: boolean;
}

function createGitHubClient(token: string): AxiosInstance {
  return axios.create({
    baseURL: "https://api.github.com",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    timeout: 15000,
  });
}

function handleGitHubError(error: unknown): never {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const message = (error.response?.data as { message?: string })?.message || error.message;
    if (status === 401) throw new Error("Invalid GitHub token. Check your GITHUB_TOKEN.");
    if (status === 403) throw new Error(`Forbidden: ${message}. Token may lack required permissions.`);
    if (status === 404) throw new Error(`Not found: ${message}. Check repo name / username.`);
    if (status === 422) throw new Error(`Validation error: ${message}`);
    if (status === 429) throw new Error("Rate limit exceeded. Please wait and try again.");
    throw new Error(`GitHub API error (${status}): ${message}`);
  }
  throw new Error(`Unexpected error: ${String(error)}`);
}

export async function listRepos(token: string, username: string): Promise<GitHubRepo[]> {
  try {
    const client = createGitHubClient(token);
    const { data } = await client.get<GitHubRepo[]>(`/users/${username}/repos`, {
      params: { per_page: 100, sort: "updated" },
    });
    return data;
  } catch (e) { handleGitHubError(e); }
}

export async function getRepo(token: string, owner: string, repo: string): Promise<GitHubRepo> {
  try {
    const client = createGitHubClient(token);
    const { data } = await client.get<GitHubRepo>(`/repos/${owner}/${repo}`);
    return data;
  } catch (e) { handleGitHubError(e); }
}

export async function updateRepo(
  token: string, owner: string, repo: string,
  updates: { name?: string; description?: string; private?: boolean; topics?: string[] }
): Promise<GitHubRepo> {
  try {
    const client = createGitHubClient(token);
    if (updates.topics !== undefined) {
      await client.put(`/repos/${owner}/${repo}/topics`, { names: updates.topics });
    }
    const repoUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) repoUpdates.name = updates.name;
    if (updates.description !== undefined) repoUpdates.description = updates.description;
    if (updates.private !== undefined) repoUpdates.private = updates.private;
    if (Object.keys(repoUpdates).length > 0) {
      const { data } = await client.patch<GitHubRepo>(`/repos/${owner}/${repo}`, repoUpdates);
      return data;
    }
    return await getRepo(token, owner, repo);
  } catch (e) { handleGitHubError(e); }
}

export async function deleteRepo(token: string, owner: string, repo: string): Promise<void> {
  try {
    const client = createGitHubClient(token);
    await client.delete(`/repos/${owner}/${repo}`);
  } catch (e) { handleGitHubError(e); }
}

export async function getFile(token: string, owner: string, repo: string, path: string): Promise<GitHubFile | null> {
  try {
    const client = createGitHubClient(token);
    const { data } = await client.get<GitHubFile>(`/repos/${owner}/${repo}/contents/${path}`);
    return data;
  } catch (e) {
    if (e instanceof AxiosError && e.response?.status === 404) return null;
    handleGitHubError(e);
  }
}

export async function upsertFile(token: string, owner: string, repo: string, path: string, content: string, message: string): Promise<void> {
  try {
    const client = createGitHubClient(token);
    const existing = await getFile(token, owner, repo, path);
    const encoded = Buffer.from(content, "utf-8").toString("base64");
    if (existing?.sha) {
      await client.put(`/repos/${owner}/${repo}/contents/${path}`, { message, content: encoded, sha: existing.sha });
    } else {
      await client.put(`/repos/${owner}/${repo}/contents/${path}`, { message, content: encoded });
    }
  } catch (e) { handleGitHubError(e); }
}

export async function pushMultipleFiles(token: string, owner: string, repo: string, files: FileEntry[], message: string, branch?: string): Promise<PushResult> {
  try {
    const client = createGitHubClient(token);
    const repoData = await getRepo(token, owner, repo);
    const targetBranch = branch || repoData.default_branch;
    const { data: refData } = await client.get(`/repos/${owner}/${repo}/git/refs/heads/${targetBranch}`);
    const latestCommitSha: string = refData.object.sha;
    const { data: commitData } = await client.get(`/repos/${owner}/${repo}/git/commits/${latestCommitSha}`);
    const baseTreeSha: string = commitData.tree.sha;
    const treeItems = await Promise.all(files.map(async (file) => {
      const { data: blob } = await client.post(`/repos/${owner}/${repo}/git/blobs`, {
        content: Buffer.from(file.content, "utf-8").toString("base64"),
        encoding: "base64",
      });
      return { path: file.path, mode: "100644" as const, type: "blob" as const, sha: blob.sha as string };
    }));
    const { data: newTree } = await client.post(`/repos/${owner}/${repo}/git/trees`, { base_tree: baseTreeSha, tree: treeItems });
    const { data: newCommit } = await client.post(`/repos/${owner}/${repo}/git/commits`, { message, tree: newTree.sha, parents: [latestCommitSha] });
    await client.patch(`/repos/${owner}/${repo}/git/refs/heads/${targetBranch}`, { sha: newCommit.sha, force: false });
    return { commit_sha: newCommit.sha as string, commit_url: newCommit.html_url as string, files_pushed: files.length, branch: targetBranch };
  } catch (e) { handleGitHubError(e); }
}

export async function createRepo(token: string, options: CreateRepoOptions): Promise<GitHubRepo> {
  try {
    const client = createGitHubClient(token);
    const { data } = await client.post<GitHubRepo>("/user/repos", {
      name: options.name,
      description: options.description || "",
      private: options.private ?? false,
      auto_init: options.auto_init ?? true,
    });
    return data;
  } catch (e) { handleGitHubError(e); }
}

export async function listBranches(token: string, owner: string, repo: string): Promise<string[]> {
  try {
    const client = createGitHubClient(token);
    const { data } = await client.get<Array<{ name: string }>>(`/repos/${owner}/${repo}/branches`);
    return data.map((b) => b.name);
  } catch (e) { handleGitHubError(e); }
}

export async function getProfile(token: string): Promise<GitHubProfile> {
  try {
    const client = createGitHubClient(token);
    const { data } = await client.get<GitHubProfile>("/user");
    return data;
  } catch (e) { handleGitHubError(e); }
}

export async function updateProfile(token: string, updates: { name?: string; bio?: string; blog?: string; location?: string; email?: string; twitter_username?: string }): Promise<GitHubProfile> {
  try {
    const client = createGitHubClient(token);
    const { data } = await client.patch<GitHubProfile>("/user", updates);
    return data;
  } catch (e) { handleGitHubError(e); }
}

export async function setRepoVisibility(token: string, owner: string, repo: string, isPrivate: boolean): Promise<GitHubRepo> {
  return updateRepo(token, owner, repo, { private: isPrivate });
}

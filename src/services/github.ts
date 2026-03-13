import { Octokit } from '@octokit/rest';

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function getAuthenticatedUser() {
  const { data } = await octokit.users.getAuthenticated();
  return data;
}

export function handleGitHubError(error: any): string {
  if (error.status === 401) return 'Authentication failed. Check your GITHUB_TOKEN.';
  if (error.status === 403) return 'Permission denied. Check token scopes (repo, user, delete_repo).';
  if (error.status === 404) return 'Resource not found. Check repo name or file path.';
  if (error.status === 422) return 'Validation failed. Repo may already exist or input is invalid.';
  if (error.status === 429) return 'Rate limit exceeded. Please wait and try again.';
  return error.message || 'Unknown GitHub API error';
}

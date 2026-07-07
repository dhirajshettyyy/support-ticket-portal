// lib/githubClient.ts
const GITHUB_API_URL = "https://api.github.com";

export class GithubApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GithubApiError";
    this.status = status;
  }
}

export async function githubRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new GithubApiError("GITHUB_TOKEN is not set");
  }

  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new GithubApiError(`GitHub API error ${response.status}: ${body}`, response.status);
  }

  return response.json() as Promise<T>;
}

// lib/github.ts
import { githubRequest } from "./githubClient";

function repoPath(): string {
  const repo = process.env.GITHUB_REPO;
  if (!repo) {
    throw new Error("GITHUB_REPO is not set");
  }
  return `/repos/${repo}`;
}

export interface CreateIssueParams {
  title: string;
  body: string;
  labels: string[];
}

export async function createIssue(params: CreateIssueParams): Promise<{ number: number; htmlUrl: string }> {
  const issue = await githubRequest<{ number: number; html_url: string }>(`${repoPath()}/issues`, {
    method: "POST",
    body: JSON.stringify({ title: params.title, body: params.body, labels: params.labels }),
  });
  return { number: issue.number, htmlUrl: issue.html_url };
}

export async function getIssue(issueNumber: number): Promise<{ state: "open" | "closed"; body: string | null }> {
  const issue = await githubRequest<{ state: "open" | "closed"; body: string | null }>(
    `${repoPath()}/issues/${issueNumber}`
  );
  return { state: issue.state, body: issue.body };
}

export async function closeIssue(issueNumber: number): Promise<void> {
  await githubRequest(`${repoPath()}/issues/${issueNumber}`, {
    method: "PATCH",
    body: JSON.stringify({ state: "closed" }),
  });
}

const MARKER_REGEX = /<!--\s*plain-thread-id:\s*([^\s]+)\s*-->/g;

export function buildGithubIssueBody(params: {
  description: string;
  plainThreadRef: string;
  plainThreadId: string;
}): string {
  return [
    params.description,
    "",
    "---",
    `Plain ticket: ${params.plainThreadRef}`,
    `<!-- plain-thread-id: ${params.plainThreadId} -->`,
  ].join("\n");
}

export function parsePlainThreadId(issueBody: string | null): string | null {
  if (!issueBody) return null;
  const matches = [...issueBody.matchAll(MARKER_REGEX)];
  if (matches.length === 0) return null;
  return matches[matches.length - 1][1];
}

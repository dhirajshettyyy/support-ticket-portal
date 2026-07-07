const MARKER_REGEX = /<!--\s*plain-thread-id:\s*([^\s]+)\s*-->/;

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
  const match = issueBody.match(MARKER_REGEX);
  return match ? match[1] : null;
}

// lib/__tests__/github.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createIssue, getIssue, closeIssue } from "../github";
import { GithubApiError } from "../githubClient";

function mockFetchOnce(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    })
  );
}

describe("lib/github", () => {
  beforeEach(() => {
    process.env.GITHUB_TOKEN = "test-token";
    process.env.GITHUB_REPO = "acme/support";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("createIssue posts to the configured repo and returns number/htmlUrl", async () => {
    mockFetchOnce(201, { number: 42, html_url: "https://github.com/acme/support/issues/42" });
    const result = await createIssue({ title: "Bug", body: "Details", labels: ["type:bug"] });
    expect(result).toEqual({ number: 42, htmlUrl: "https://github.com/acme/support/issues/42" });

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toBe("https://api.github.com/repos/acme/support/issues");
    expect(JSON.parse(call[1]?.body as string)).toEqual({ title: "Bug", body: "Details", labels: ["type:bug"] });
  });

  it("getIssue returns the state and body", async () => {
    mockFetchOnce(200, { state: "open", body: "Details" });
    const result = await getIssue(42);
    expect(result).toEqual({ state: "open", body: "Details" });
  });

  it("closeIssue sends a PATCH with state closed", async () => {
    mockFetchOnce(200, { number: 42, state: "closed" });
    await closeIssue(42);

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toBe("https://api.github.com/repos/acme/support/issues/42");
    expect(call[1]?.method).toBe("PATCH");
    expect(JSON.parse(call[1]?.body as string)).toEqual({ state: "closed" });
  });

  it("throws GithubApiError on a non-2xx response", async () => {
    mockFetchOnce(404, { message: "Not Found" });
    await expect(getIssue(999)).rejects.toThrow(GithubApiError);
  });
});

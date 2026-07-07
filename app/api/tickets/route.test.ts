// app/api/tickets/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/plain", () => ({
  upsertTenant: vi.fn(),
  upsertCustomer: vi.fn(),
  createThread: vi.fn(),
  upsertThreadField: vi.fn(),
}));
vi.mock("@/lib/github", () => ({
  createIssue: vi.fn(),
}));

import { upsertTenant, upsertCustomer, createThread, upsertThreadField } from "@/lib/plain";
import { createIssue } from "@/lib/github";
import { POST } from "./route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/tickets", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  email: "jane@example.com",
  fullName: "Jane Doe",
  title: "Login broken",
  description: "Cannot log in with SSO",
  productArea: "api",
  severity: "high",
  ticketType: "bug",
};

describe("POST /api/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a Plain thread and GitHub issue and links them", async () => {
    vi.mocked(upsertCustomer).mockResolvedValue({ customerId: "cust_1" });
    vi.mocked(createThread).mockResolvedValue({ threadId: "th_1", ref: "T-1" });
    vi.mocked(createIssue).mockResolvedValue({ number: 42, htmlUrl: "https://github.com/acme/repo/issues/42" });

    const response = await POST(makeRequest(VALID_BODY));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ticketRef: "T-1", githubIssueUrl: "https://github.com/acme/repo/issues/42" });
    expect(upsertTenant).not.toHaveBeenCalled();
    expect(createThread).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: "cust_1", priority: 1 })
    );
    expect(upsertThreadField).toHaveBeenCalledWith(
      expect.objectContaining({ threadId: "th_1", key: "github_issue_number", numberValue: 42 })
    );
    expect(upsertThreadField).toHaveBeenCalledWith(
      expect.objectContaining({
        threadId: "th_1",
        key: "github_issue_url",
        stringValue: "https://github.com/acme/repo/issues/42",
      })
    );
  });

  it("upserts a tenant when a company name is provided", async () => {
    vi.mocked(upsertTenant).mockResolvedValue({ tenantId: "tenant_1" });
    vi.mocked(upsertCustomer).mockResolvedValue({ customerId: "cust_1" });
    vi.mocked(createThread).mockResolvedValue({ threadId: "th_1", ref: "T-1" });
    vi.mocked(createIssue).mockResolvedValue({ number: 1, htmlUrl: "https://github.com/acme/repo/issues/1" });

    await POST(makeRequest({ ...VALID_BODY, companyName: "Acme Inc" }));

    expect(upsertTenant).toHaveBeenCalledWith({ externalId: "acme-inc", name: "Acme Inc" });
    expect(upsertCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ tenantExternalId: "acme-inc" })
    );
  });

  it("returns 400 for a payload missing required fields", async () => {
    const response = await POST(makeRequest({ email: "jane@example.com" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for an invalid enum value", async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, severity: "banana" }));
    expect(response.status).toBe(400);
  });

  it("returns 502 and never creates a GitHub issue when Plain thread creation fails", async () => {
    vi.mocked(upsertCustomer).mockResolvedValue({ customerId: "cust_1" });
    vi.mocked(createThread).mockRejectedValue(new Error("Plain API down"));

    const response = await POST(makeRequest(VALID_BODY));

    expect(response.status).toBe(502);
    expect(createIssue).not.toHaveBeenCalled();
  });

  it("returns 502 when upsertTenant fails, before ever creating a Plain thread or GitHub issue", async () => {
    vi.mocked(upsertTenant).mockRejectedValue(new Error("Plain API down"));

    const response = await POST(makeRequest({ ...VALID_BODY, companyName: "Acme Inc" }));

    expect(response.status).toBe(502);
    expect(createThread).not.toHaveBeenCalled();
    expect(createIssue).not.toHaveBeenCalled();
  });

  it("tags the thread needs_github_issue when GitHub issue creation fails twice", async () => {
    vi.mocked(upsertCustomer).mockResolvedValue({ customerId: "cust_1" });
    vi.mocked(createThread).mockResolvedValue({ threadId: "th_1", ref: "T-1" });
    vi.mocked(createIssue).mockRejectedValue(new Error("GitHub API down"));

    const response = await POST(makeRequest(VALID_BODY));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.githubIssueUrl).toBeNull();
    expect(createIssue).toHaveBeenCalledTimes(2);
    expect(upsertThreadField).toHaveBeenCalledWith(
      expect.objectContaining({ threadId: "th_1", key: "needs_github_issue", booleanValue: true })
    );
  });

  it("still returns 200 with the ticket ref when the post-creation link write-back fails", async () => {
    vi.mocked(upsertCustomer).mockResolvedValue({ customerId: "cust_1" });
    vi.mocked(createThread).mockResolvedValue({ threadId: "th_1", ref: "T-1" });
    vi.mocked(createIssue).mockResolvedValue({ number: 42, htmlUrl: "https://github.com/acme/repo/issues/42" });
    vi.mocked(upsertThreadField).mockRejectedValue(new Error("Plain API down"));

    const response = await POST(makeRequest(VALID_BODY));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ticketRef: "T-1", githubIssueUrl: "https://github.com/acme/repo/issues/42" });
  });

  it("still returns 200 when tagging needs_github_issue fails after GitHub creation fails twice", async () => {
    vi.mocked(upsertCustomer).mockResolvedValue({ customerId: "cust_1" });
    vi.mocked(createThread).mockResolvedValue({ threadId: "th_1", ref: "T-1" });
    vi.mocked(createIssue).mockRejectedValue(new Error("GitHub API down"));
    vi.mocked(upsertThreadField).mockRejectedValue(new Error("Plain API down"));

    const response = await POST(makeRequest(VALID_BODY));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.githubIssueUrl).toBeNull();
  });
});

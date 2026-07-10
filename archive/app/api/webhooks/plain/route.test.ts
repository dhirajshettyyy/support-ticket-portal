import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";

vi.mock("@/lib/plain", () => ({
  getThread: vi.fn(),
}));
vi.mock("@/lib/github", () => ({
  getIssue: vi.fn(),
  closeIssue: vi.fn(),
}));

import { getThread } from "@/lib/plain";
import { getIssue, closeIssue } from "@/lib/github";
import { POST } from "./route";

const SECRET = "test-secret";

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("hex");
}

function makeRequest(body: string, signature: string): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/plain", {
    method: "POST",
    headers: { "plain-request-signature": signature },
    body,
  });
}

describe("POST /api/webhooks/plain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PLAIN_WEBHOOK_SECRET = SECRET;
  });

  it("rejects requests with an invalid signature", async () => {
    const body = JSON.stringify({ eventType: "thread.thread_status_transitioned", thread: { id: "th_1", status: "DONE" } });
    const response = await POST(makeRequest(body, "deadbeef"));
    expect(response.status).toBe(401);
    expect(getThread).not.toHaveBeenCalled();
  });

  it("closes the linked GitHub issue when a thread transitions to done", async () => {
    const body = JSON.stringify({
      eventType: "thread.thread_status_transitioned",
      thread: { id: "th_1", status: "DONE" },
    });
    vi.mocked(getThread).mockResolvedValue({
      id: "th_1",
      status: "DONE",
      threadFields: [{ key: "github_issue_number", stringValue: null, numberValue: 42 }],
    });
    vi.mocked(getIssue).mockResolvedValue({ state: "open", body: "..." });

    const response = await POST(makeRequest(body, sign(body)));

    expect(response.status).toBe(200);
    expect(closeIssue).toHaveBeenCalledWith(42);
  });

  it("is a no-op when the GitHub issue is already closed", async () => {
    const body = JSON.stringify({
      eventType: "thread.thread_status_transitioned",
      thread: { id: "th_1", status: "DONE" },
    });
    vi.mocked(getThread).mockResolvedValue({
      id: "th_1",
      status: "DONE",
      threadFields: [{ key: "github_issue_number", stringValue: null, numberValue: 42 }],
    });
    vi.mocked(getIssue).mockResolvedValue({ state: "closed", body: "..." });

    const response = await POST(makeRequest(body, sign(body)));

    expect(response.status).toBe(200);
    expect(closeIssue).not.toHaveBeenCalled();
  });

  it("ignores transitions that are not to done", async () => {
    const body = JSON.stringify({
      eventType: "thread.thread_status_transitioned",
      thread: { id: "th_1", status: "SNOOZED" },
    });
    const response = await POST(makeRequest(body, sign(body)));
    expect(response.status).toBe(200);
    expect(getThread).not.toHaveBeenCalled();
  });

  it("ignores unrelated event types", async () => {
    const body = JSON.stringify({ eventType: "thread.thread_created", thread: { id: "th_1", status: "TODO" } });
    const response = await POST(makeRequest(body, sign(body)));
    expect(response.status).toBe(200);
    expect(getThread).not.toHaveBeenCalled();
  });

  it("no-ops when the thread has no linked GitHub issue", async () => {
    const body = JSON.stringify({
      eventType: "thread.thread_status_transitioned",
      thread: { id: "th_1", status: "DONE" },
    });
    vi.mocked(getThread).mockResolvedValue({ id: "th_1", status: "DONE", threadFields: [] });

    const response = await POST(makeRequest(body, sign(body)));

    expect(response.status).toBe(200);
    expect(getIssue).not.toHaveBeenCalled();
  });
});

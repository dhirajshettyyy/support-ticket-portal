import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";

vi.mock("@/lib/plain", () => ({
  getThread: vi.fn(),
  markThreadAsDone: vi.fn(),
}));

import { getThread, markThreadAsDone } from "@/lib/plain";
import { POST } from "./route";

const SECRET = "test-secret";

function sign(body: string): string {
  return "sha256=" + createHmac("sha256", SECRET).update(body).digest("hex");
}

function makeRequest(body: string, signature: string): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/github", {
    method: "POST",
    headers: { "x-hub-signature-256": signature },
    body,
  });
}

describe("POST /api/webhooks/github", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_WEBHOOK_SECRET = SECRET;
  });

  it("rejects requests with an invalid signature", async () => {
    const body = JSON.stringify({ action: "closed", issue: { body: "" } });
    const response = await POST(makeRequest(body, "sha256=deadbeef"));
    expect(response.status).toBe(401);
    expect(getThread).not.toHaveBeenCalled();
  });

  it("marks the linked Plain thread as done when the issue closes", async () => {
    const body = JSON.stringify({
      action: "closed",
      issue: { body: "<!-- plain-thread-id: th_123 -->" },
    });
    vi.mocked(getThread).mockResolvedValue({ id: "th_123", status: "TODO", threadFields: [] });

    const response = await POST(makeRequest(body, sign(body)));

    expect(response.status).toBe(200);
    expect(markThreadAsDone).toHaveBeenCalledWith("th_123");
  });

  it("is a no-op when the thread is already done", async () => {
    const body = JSON.stringify({
      action: "closed",
      issue: { body: "<!-- plain-thread-id: th_123 -->" },
    });
    vi.mocked(getThread).mockResolvedValue({ id: "th_123", status: "DONE", threadFields: [] });

    const response = await POST(makeRequest(body, sign(body)));

    expect(response.status).toBe(200);
    expect(markThreadAsDone).not.toHaveBeenCalled();
  });

  it("ignores events that are not issue closures", async () => {
    const body = JSON.stringify({ action: "opened", issue: { body: "" } });
    const response = await POST(makeRequest(body, sign(body)));
    expect(response.status).toBe(200);
    expect(getThread).not.toHaveBeenCalled();
  });

  it("no-ops when the issue body has no linked Plain thread", async () => {
    const body = JSON.stringify({ action: "closed", issue: { body: "unrelated issue" } });
    const response = await POST(makeRequest(body, sign(body)));
    expect(response.status).toBe(200);
    expect(getThread).not.toHaveBeenCalled();
  });
});

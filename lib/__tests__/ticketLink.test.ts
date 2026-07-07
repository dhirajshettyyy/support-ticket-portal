import { describe, it, expect } from "vitest";
import { buildGithubIssueBody, parsePlainThreadId } from "../ticketLink";

describe("buildGithubIssueBody", () => {
  it("includes the description, ref, and a parseable marker", () => {
    const body = buildGithubIssueBody({
      description: "Cannot log in with SSO",
      plainThreadRef: "T-123",
      plainThreadId: "th_abc",
    });
    expect(body).toContain("Cannot log in with SSO");
    expect(body).toContain("T-123");
    expect(body).toContain("<!-- plain-thread-id: th_abc -->");
  });
});

describe("parsePlainThreadId", () => {
  it("extracts the thread id from a body containing the marker", () => {
    const body = "Some text\n<!-- plain-thread-id: th_abc -->";
    expect(parsePlainThreadId(body)).toBe("th_abc");
  });

  it("returns null when there is no marker", () => {
    expect(parsePlainThreadId("A regular GitHub issue with no marker")).toBeNull();
  });

  it("returns null for a null body", () => {
    expect(parsePlainThreadId(null)).toBeNull();
  });

  it("round-trips with buildGithubIssueBody", () => {
    const body = buildGithubIssueBody({
      description: "desc",
      plainThreadRef: "T-9",
      plainThreadId: "th_xyz",
    });
    expect(parsePlainThreadId(body)).toBe("th_xyz");
  });
});

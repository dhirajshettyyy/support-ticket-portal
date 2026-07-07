import { describe, it, expect } from "vitest";
import {
  severityToPlainPriority,
  severityToGithubLabel,
  productAreaToGithubLabel,
  ticketTypeToGithubLabel,
  SEVERITIES,
  PRODUCT_AREAS,
  TICKET_TYPES,
  DESCRIPTION_MAX_LENGTH,
} from "../taxonomy";

describe("taxonomy", () => {
  it("maps severity to Plain priority, most urgent to lowest int", () => {
    expect(severityToPlainPriority("urgent")).toBe(0);
    expect(severityToPlainPriority("high")).toBe(1);
    expect(severityToPlainPriority("medium")).toBe(2);
    expect(severityToPlainPriority("low")).toBe(3);
  });

  it("formats GitHub labels with a namespaced prefix", () => {
    expect(severityToGithubLabel("high")).toBe("severity:high");
    expect(productAreaToGithubLabel("billing")).toBe("area:billing");
    expect(ticketTypeToGithubLabel("bug")).toBe("type:bug");
  });

  it("exposes the full option lists for the form", () => {
    expect(SEVERITIES).toEqual(["low", "medium", "high", "urgent"]);
    expect(PRODUCT_AREAS).toEqual(["billing", "onboarding", "api", "dashboard", "other"]);
    expect(TICKET_TYPES).toEqual(["bug", "feature", "question"]);
  });

  it("caps description length at Plain's createThread limit", () => {
    expect(DESCRIPTION_MAX_LENGTH).toBe(500);
  });
});

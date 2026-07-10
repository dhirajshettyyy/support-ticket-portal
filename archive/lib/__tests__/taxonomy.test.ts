import { describe, it, expect } from "vitest";
import {
  priorityToPlainPriority,
  priorityToGithubLabel,
  fabricModuleToGithubLabel,
  projectToGithubLabel,
  ticketTypeToGithubLabel,
  FABRIC_MODULES,
  PROJECTS,
  PRIORITIES,
  PRIORITY_LABELS,
  TICKET_TYPES,
  TICKET_TYPE_LABELS,
  DESCRIPTION_MAX_LENGTH,
} from "../taxonomy";

describe("taxonomy", () => {
  it("maps priority code to Plain priority, S1 (critical) to lowest int", () => {
    expect(priorityToPlainPriority("S1")).toBe(0);
    expect(priorityToPlainPriority("S2")).toBe(1);
    expect(priorityToPlainPriority("S3")).toBe(2);
    expect(priorityToPlainPriority("S4")).toBe(3);
  });

  it("formats GitHub labels with a namespaced, slugified prefix", () => {
    expect(priorityToGithubLabel("S1")).toBe("priority:s1");
    expect(fabricModuleToGithubLabel("DISCOVR")).toBe("module:discovr");
    expect(fabricModuleToGithubLabel("VC on EDGE")).toBe("module:vc-on-edge");
    expect(projectToGithubLabel("UP ONA")).toBe("project:up-ona");
    expect(ticketTypeToGithubLabel("feature_request")).toBe("type:feature_request");
  });

  it("exposes the full option lists for the form, exactly as specified", () => {
    expect(FABRIC_MODULES).toEqual(["DISCOVR", "CATALG", "ONIX", "REGISTR", "VC on EDGE", "Other"]);
    expect(PROJECTS).toEqual(["ION", "UP ONA", "NY", "ONCM", "IES", "Other"]);
    expect(PRIORITIES).toEqual(["S1", "S2", "S3", "S4"]);
    expect(TICKET_TYPES).toEqual(["bug", "feature_request", "documentation", "question"]);
  });

  it("provides human-readable display labels for priority and ticket type", () => {
    expect(PRIORITY_LABELS.S1).toBe("S1 — Critical");
    expect(PRIORITY_LABELS.S4).toBe("S4 — Low");
    expect(TICKET_TYPE_LABELS.bug).toBe("Bug");
    expect(TICKET_TYPE_LABELS.feature_request).toBe("Feature request");
  });

  it("caps description length at Plain's createThread limit", () => {
    expect(DESCRIPTION_MAX_LENGTH).toBe(500);
  });
});

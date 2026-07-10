export type FabricModule = "DISCOVR" | "CATALG" | "ONIX" | "REGISTR" | "VC on EDGE" | "Other";
export type Project = "ION" | "UP ONA" | "NY" | "ONCM" | "IES" | "Other";
export type Priority = "S1" | "S2" | "S3" | "S4";
export type TicketType = "bug" | "feature_request" | "documentation" | "question";

export const FABRIC_MODULES: FabricModule[] = ["DISCOVR", "CATALG", "ONIX", "REGISTR", "VC on EDGE", "Other"];
export const PROJECTS: Project[] = ["ION", "UP ONA", "NY", "ONCM", "IES", "Other"];
export const PRIORITIES: Priority[] = ["S1", "S2", "S3", "S4"];
export const TICKET_TYPES: TicketType[] = ["bug", "feature_request", "documentation", "question"];

// Display labels for values that aren't self-explanatory as raw option values.
export const PRIORITY_LABELS: Record<Priority, string> = {
  S1: "S1 — Critical",
  S2: "S2 — High",
  S3: "S3 — Medium",
  S4: "S4 — Low",
};

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  bug: "Bug",
  feature_request: "Feature request",
  documentation: "Documentation",
  question: "Question",
};

// Plain's createThread `description` field rejects strings longer than this.
export const DESCRIPTION_MAX_LENGTH = 500;

const PRIORITY_TO_PLAIN_PRIORITY: Record<Priority, number> = {
  S1: 0,
  S2: 1,
  S3: 2,
  S4: 3,
};

export function priorityToPlainPriority(priority: Priority): number {
  return PRIORITY_TO_PLAIN_PRIORITY[priority];
}

function toLabelSlug(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}

export function priorityToGithubLabel(priority: Priority): string {
  return `priority:${toLabelSlug(priority)}`;
}

export function fabricModuleToGithubLabel(module: FabricModule): string {
  return `module:${toLabelSlug(module)}`;
}

export function projectToGithubLabel(project: Project): string {
  return `project:${toLabelSlug(project)}`;
}

export function ticketTypeToGithubLabel(type: TicketType): string {
  return `type:${toLabelSlug(type)}`;
}

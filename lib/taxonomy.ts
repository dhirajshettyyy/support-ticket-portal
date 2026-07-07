export type Severity = "low" | "medium" | "high" | "urgent";
export type ProductArea = "billing" | "onboarding" | "api" | "dashboard" | "other";
export type TicketType = "bug" | "feature" | "question";

export const SEVERITIES: Severity[] = ["low", "medium", "high", "urgent"];
export const PRODUCT_AREAS: ProductArea[] = ["billing", "onboarding", "api", "dashboard", "other"];
export const TICKET_TYPES: TicketType[] = ["bug", "feature", "question"];

// Plain's createThread `description` field rejects strings longer than this.
export const DESCRIPTION_MAX_LENGTH = 500;

const SEVERITY_TO_PRIORITY: Record<Severity, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function severityToPlainPriority(severity: Severity): number {
  return SEVERITY_TO_PRIORITY[severity];
}

export function severityToGithubLabel(severity: Severity): string {
  return `severity:${severity}`;
}

export function productAreaToGithubLabel(area: ProductArea): string {
  return `area:${area}`;
}

export function ticketTypeToGithubLabel(type: TicketType): string {
  return `type:${type}`;
}

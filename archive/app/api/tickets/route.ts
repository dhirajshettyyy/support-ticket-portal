import { NextRequest, NextResponse } from "next/server";
import { upsertTenant, upsertCustomer, createThread, upsertThreadField } from "@/lib/plain";
import { createIssue } from "@/lib/github";
import { buildGithubIssueBody } from "@/lib/ticketLink";
import {
  priorityToPlainPriority,
  priorityToGithubLabel,
  fabricModuleToGithubLabel,
  projectToGithubLabel,
  ticketTypeToGithubLabel,
  PRIORITIES,
  FABRIC_MODULES,
  PROJECTS,
  TICKET_TYPES,
  DESCRIPTION_MAX_LENGTH,
  type Priority,
  type FabricModule,
  type Project,
  type TicketType,
} from "@/lib/taxonomy";

interface TicketRequestBody {
  email: string;
  fullName: string;
  companyName?: string;
  title: string;
  description: string;
  fabricModule: FabricModule;
  project: Project;
  priority: Priority;
  ticketType: TicketType;
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}

/**
 * Returns a human-readable message per invalid field, empty if the body is
 * valid. These messages describe the caller's own input, so they're safe to
 * return directly in the API response (unlike Plain/GitHub error detail,
 * which stays server-side only).
 */
function getValidationErrors(body: unknown): string[] {
  if (typeof body !== "object" || body === null) {
    return ["Request body must be a JSON object"];
  }
  const b = body as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof b.email !== "string" || b.email.trim() === "") errors.push("email is required");
  if (typeof b.fullName !== "string" || b.fullName.trim() === "") errors.push("fullName is required");
  if (typeof b.title !== "string" || b.title.trim() === "") errors.push("title is required");

  if (typeof b.description !== "string" || b.description.trim() === "") {
    errors.push("description is required");
  } else if (b.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.push(`description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`);
  }

  if (typeof b.fabricModule !== "string" || !(FABRIC_MODULES as string[]).includes(b.fabricModule)) {
    errors.push(`fabricModule must be one of: ${FABRIC_MODULES.join(", ")}`);
  }
  if (typeof b.project !== "string" || !(PROJECTS as string[]).includes(b.project)) {
    errors.push(`project must be one of: ${PROJECTS.join(", ")}`);
  }
  if (typeof b.priority !== "string" || !(PRIORITIES as string[]).includes(b.priority)) {
    errors.push(`priority must be one of: ${PRIORITIES.join(", ")}`);
  }
  if (typeof b.ticketType !== "string" || !(TICKET_TYPES as string[]).includes(b.ticketType)) {
    errors.push(`ticketType must be one of: ${TICKET_TYPES.join(", ")}`);
  }

  return errors;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.json();

  const validationErrors = getValidationErrors(rawBody);
  if (validationErrors.length > 0) {
    return NextResponse.json({ error: validationErrors.join("; ") }, { status: 400 });
  }
  const body = rawBody as TicketRequestBody;

  let threadId: string;
  let threadRef: string;
  let tenantExternalId: string | undefined;
  try {
    if (body.companyName) {
      tenantExternalId = slugify(body.companyName);
      await upsertTenant({ externalId: tenantExternalId, name: body.companyName });
    }

    const customer = await upsertCustomer({
      email: body.email,
      fullName: body.fullName,
      tenantExternalId,
    });

    const thread = await createThread({
      customerId: customer.customerId,
      tenantExternalId,
      title: body.title,
      description: body.description,
      priority: priorityToPlainPriority(body.priority),
      threadFields: [
        { key: "product_area", type: "STRING", stringValue: body.fabricModule },
        { key: "project", type: "STRING", stringValue: body.project },
        { key: "ticket_type", type: "STRING", stringValue: body.ticketType },
      ],
    });
    threadId = thread.threadId;
    threadRef = thread.ref;
  } catch (error) {
    console.error("Failed to create Plain thread", error);
    return NextResponse.json({ error: "Failed to submit ticket. Please try again." }, { status: 502 });
  }

  const issueBody = buildGithubIssueBody({
    description: body.description,
    plainThreadRef: threadRef,
    plainThreadId: threadId,
  });
  const labels = [
    priorityToGithubLabel(body.priority),
    fabricModuleToGithubLabel(body.fabricModule),
    projectToGithubLabel(body.project),
    ticketTypeToGithubLabel(body.ticketType),
  ];

  let issueNumber: number | undefined;
  let issueUrl: string | undefined;
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const issue = await createIssue({ title: body.title, body: issueBody, labels });
      issueNumber = issue.number;
      issueUrl = issue.htmlUrl;
      break;
    } catch (error) {
      console.error(`GitHub issue creation attempt ${attempt} failed`, error);
      if (attempt === maxAttempts) {
        try {
          await upsertThreadField({ threadId, key: "needs_github_issue", type: "BOOL", booleanValue: true });
        } catch (tagError) {
          console.error("Failed to tag thread needs_github_issue", tagError);
        }
      }
    }
  }

  if (issueNumber !== undefined && issueUrl !== undefined) {
    try {
      await upsertThreadField({ threadId, key: "github_issue_number", type: "NUMBER", numberValue: issueNumber });
      await upsertThreadField({ threadId, key: "github_issue_url", type: "STRING", stringValue: issueUrl });
    } catch (linkError) {
      console.error("Failed to write back GitHub issue link to Plain thread", linkError);
    }
  }

  return NextResponse.json({ ticketRef: threadRef, githubIssueUrl: issueUrl ?? null });
}

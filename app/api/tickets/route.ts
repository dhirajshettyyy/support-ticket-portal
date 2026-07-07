import { NextRequest, NextResponse } from "next/server";
import { upsertTenant, upsertCustomer, createThread, upsertThreadField } from "@/lib/plain";
import { createIssue } from "@/lib/github";
import { buildGithubIssueBody } from "@/lib/ticketLink";
import {
  severityToPlainPriority,
  severityToGithubLabel,
  productAreaToGithubLabel,
  ticketTypeToGithubLabel,
  SEVERITIES,
  PRODUCT_AREAS,
  TICKET_TYPES,
  type Severity,
  type ProductArea,
  type TicketType,
} from "@/lib/taxonomy";

interface TicketRequestBody {
  email: string;
  fullName: string;
  companyName?: string;
  title: string;
  description: string;
  productArea: ProductArea;
  severity: Severity;
  ticketType: TicketType;
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}

function isValidTicketRequestBody(body: unknown): body is TicketRequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.email === "string" &&
    typeof b.fullName === "string" &&
    typeof b.title === "string" &&
    typeof b.description === "string" &&
    typeof b.productArea === "string" &&
    (PRODUCT_AREAS as string[]).includes(b.productArea) &&
    typeof b.severity === "string" &&
    (SEVERITIES as string[]).includes(b.severity) &&
    typeof b.ticketType === "string" &&
    (TICKET_TYPES as string[]).includes(b.ticketType)
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!isValidTicketRequestBody(body)) {
    return NextResponse.json({ error: "Invalid ticket payload" }, { status: 400 });
  }

  let tenantExternalId: string | undefined;
  if (body.companyName) {
    tenantExternalId = slugify(body.companyName);
    await upsertTenant({ externalId: tenantExternalId, name: body.companyName });
  }

  let threadId: string;
  let threadRef: string;
  try {
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
      priority: severityToPlainPriority(body.severity),
      threadFields: [
        { key: "product_area", type: "STRING", stringValue: body.productArea },
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
    severityToGithubLabel(body.severity),
    productAreaToGithubLabel(body.productArea),
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
        await upsertThreadField({ threadId, key: "needs_github_issue", type: "BOOL", booleanValue: true });
      }
    }
  }

  if (issueNumber !== undefined && issueUrl !== undefined) {
    await upsertThreadField({ threadId, key: "github_issue_number", type: "NUMBER", numberValue: issueNumber });
    await upsertThreadField({ threadId, key: "github_issue_url", type: "STRING", stringValue: issueUrl });
  }

  return NextResponse.json({ ticketRef: threadRef, githubIssueUrl: issueUrl ?? null });
}

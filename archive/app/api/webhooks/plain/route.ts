import { NextRequest, NextResponse } from "next/server";
import { verifyPlainSignature } from "@/lib/webhookSignatures";
import { getThread } from "@/lib/plain";
import { getIssue, closeIssue } from "@/lib/github";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("plain-request-signature");
  const secret = process.env.PLAIN_WEBHOOK_SECRET ?? "";

  if (!verifyPlainSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  if (payload.eventType !== "thread.thread_status_transitioned") {
    return NextResponse.json({ ok: true });
  }

  if (payload.thread?.status !== "DONE") {
    return NextResponse.json({ ok: true });
  }

  const threadId: string = payload.thread.id;
  const thread = await getThread(threadId);
  const issueNumberField = thread?.threadFields.find((field) => field.key === "github_issue_number");

  if (!issueNumberField || issueNumberField.numberValue === null) {
    console.log(`No linked GitHub issue for thread ${threadId}, skipping`);
    return NextResponse.json({ ok: true });
  }

  const issueNumber = issueNumberField.numberValue;
  const issue = await getIssue(issueNumber);

  if (issue.state === "closed") {
    return NextResponse.json({ ok: true });
  }

  await closeIssue(issueNumber);
  return NextResponse.json({ ok: true });
}

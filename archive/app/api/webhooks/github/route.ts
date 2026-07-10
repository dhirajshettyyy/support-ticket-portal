import { NextRequest, NextResponse } from "next/server";
import { verifyGithubSignature } from "@/lib/webhookSignatures";
import { parsePlainThreadId } from "@/lib/ticketLink";
import { getThread, markThreadAsDone } from "@/lib/plain";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const secret = process.env.GITHUB_WEBHOOK_SECRET ?? "";

  if (!verifyGithubSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  if (payload.action !== "closed") {
    return NextResponse.json({ ok: true });
  }

  const threadId = parsePlainThreadId(payload.issue?.body ?? null);
  if (!threadId) {
    console.log("GitHub issue closed with no linked Plain thread, skipping");
    return NextResponse.json({ ok: true });
  }

  const thread = await getThread(threadId);
  if (!thread) {
    console.log(`No Plain thread found for id ${threadId}, skipping`);
    return NextResponse.json({ ok: true });
  }

  if (thread.status === "DONE") {
    return NextResponse.json({ ok: true });
  }

  await markThreadAsDone(threadId);
  return NextResponse.json({ ok: true });
}

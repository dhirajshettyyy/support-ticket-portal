import { NextResponse } from "next/server";
import * as crypto from "node:crypto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const secret = process.env.PLAIN_CHAT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Chat authentication is not configured" }, { status: 503 });
  }

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(email);
  const emailHash = hmac.digest("hex");

  return NextResponse.json({ email, emailHash }, { headers: { "Cache-Control": "no-store" } });
}

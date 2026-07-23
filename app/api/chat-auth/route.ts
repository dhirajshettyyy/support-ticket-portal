import { NextResponse } from "next/server";
import * as crypto from "node:crypto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COOKIE_NAME = "nfh_chat_rl";
const BURST_WINDOW_MS = 10 * 60 * 1000;
const BURST_MAX = 4;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const DAILY_MAX = 8;

// Best-effort only: this Map lives in one serverless instance's memory, so it
// resets on cold start and isn't shared across instances/regions. It's a free
// extra speed bump against a burst hitting one warm instance, not a real global
// limit - the cookie-based check above is what's actually enforced, since it
// round-trips with the client regardless of which instance serves the request.
const IP_BURST_WINDOW_MS = 60 * 1000;
const IP_BURST_MAX = 6;
const ipHits = new Map<string, number[]>();

function parseCookieTimestamps(cookieHeader: string | null): number[] {
  if (!cookieHeader) return [];
  const match = cookieHeader.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (!match) return [];
  return decodeURIComponent(match[1])
    .split(",")
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

function ipBurstExceeded(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_BURST_WINDOW_MS);
  hits.push(now);
  ipHits.set(ip, hits);
  return hits.length > IP_BURST_MAX;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (ipBurstExceeded(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const now = Date.now();
  const withinDay = parseCookieTimestamps(request.headers.get("cookie")).filter(
    (t) => now - t < DAILY_WINDOW_MS
  );
  const withinBurst = withinDay.filter((t) => now - t < BURST_WINDOW_MS);

  if (withinBurst.length >= BURST_MAX) {
    return NextResponse.json(
      { error: "Too many chat sessions started - please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": "600" } }
    );
  }
  if (withinDay.length >= DAILY_MAX) {
    return NextResponse.json(
      { error: "Daily chat session limit reached - please try again tomorrow." },
      { status: 429, headers: { "Retry-After": "86400" } }
    );
  }

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

  const response = NextResponse.json({ email, emailHash }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(COOKIE_NAME, [...withinDay, now].join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.VERCEL === "1",
    maxAge: DAILY_WINDOW_MS / 1000,
    path: "/api/chat-auth",
  });
  return response;
}

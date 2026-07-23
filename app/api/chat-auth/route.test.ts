import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as crypto from "node:crypto";
import { POST } from "./route";

const SECRET = "test-secret-for-vitest";

function makeRequest(
  body: unknown,
  opts: { cookie?: string; ip?: string; rawBody?: string } = {}
): Request {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (opts.cookie) headers.set("Cookie", opts.cookie);
  if (opts.ip) headers.set("x-forwarded-for", opts.ip);
  return new Request("http://localhost/api/chat-auth", {
    method: "POST",
    headers,
    body: opts.rawBody ?? JSON.stringify(body),
  });
}

let ipCounter = 0;
function uniqueIp(): string {
  ipCounter += 1;
  return `10.0.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
}

describe("POST /api/chat-auth", () => {
  beforeEach(() => {
    process.env.PLAIN_CHAT_SECRET = SECRET;
  });
  afterEach(() => {
    delete process.env.PLAIN_CHAT_SECRET;
  });

  it("returns a matching HMAC-SHA256 hash for a valid, normalized email", async () => {
    const res = await POST(makeRequest({ email: "  Test@Example.com  " }, { ip: uniqueIp() }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.email).toBe("test@example.com");
    const expected = crypto.createHmac("sha256", SECRET).update("test@example.com").digest("hex");
    expect(data.emailHash).toBe(expected);
  });

  it("fails closed with 503 when PLAIN_CHAT_SECRET is not configured", async () => {
    delete process.env.PLAIN_CHAT_SECRET;
    const res = await POST(makeRequest({ email: "a@b.com" }, { ip: uniqueIp() }));
    expect(res.status).toBe(503);
  });

  it.each([
    ["missing field", {}],
    ["empty string", { email: "" }],
    ["wrong type: number", { email: 12345 }],
    ["wrong type: array", { email: ["a@b.com"] }],
    ["html/script shaped", { email: "<script>alert(1)</script>@example.com" }],
    ["no @", { email: "not-an-email" }],
    ["empty domain", { email: "a@" }],
    ["empty local part", { email: "@example.com" }],
  ])("rejects invalid email (%s) with 400", async (_label, body) => {
    const res = await POST(makeRequest(body, { ip: uniqueIp() }));
    expect(res.status).toBe(400);
  });

  it("rejects an email over the 254-character limit", async () => {
    const long = "a".repeat(250) + "@example.com";
    const res = await POST(makeRequest({ email: long }, { ip: uniqueIp() }));
    expect(res.status).toBe(400);
  });

  it("accepts an email at exactly the 254-character boundary", async () => {
    const local = "a".repeat(254 - "@example.com".length);
    const res = await POST(makeRequest({ email: `${local}@example.com` }, { ip: uniqueIp() }));
    expect(res.status).toBe(200);
  });

  it("rejects malformed JSON with 400, not a 500", async () => {
    const res = await POST(makeRequest(null, { ip: uniqueIp(), rawBody: "{not json" }));
    expect(res.status).toBe(400);
  });

  describe("rate limiting", () => {
    it("allows 4 sessions within the burst window, blocks the 5th", async () => {
      const ip = uniqueIp();
      let cookie: string | undefined;
      for (let i = 0; i < 4; i++) {
        const res = await POST(makeRequest({ email: `burst${i}@example.com` }, { cookie, ip }));
        expect(res.status).toBe(200);
        cookie = res.headers.get("set-cookie")?.split(";")[0];
      }
      const blocked = await POST(makeRequest({ email: "burst5@example.com" }, { cookie, ip }));
      expect(blocked.status).toBe(429);
    });

    it("blocks a session once 8 prior timestamps exist within 24h, even outside the burst window", async () => {
      const ip = uniqueIp();
      const now = Date.now();
      const timestamps = Array.from({ length: 8 }, (_, i) => now - (i + 1) * 20 * 60 * 1000);
      const cookie = `nfh_chat_rl=${timestamps.join(",")}`;
      const res = await POST(makeRequest({ email: "daily-boundary@example.com" }, { cookie, ip }));
      expect(res.status).toBe(429);
    });

    it("allows a session when only 7 prior timestamps exist", async () => {
      const ip = uniqueIp();
      const now = Date.now();
      const timestamps = Array.from({ length: 7 }, (_, i) => now - (i + 1) * 20 * 60 * 1000);
      const cookie = `nfh_chat_rl=${timestamps.join(",")}`;
      const res = await POST(makeRequest({ email: "daily-boundary-ok@example.com" }, { cookie, ip }));
      expect(res.status).toBe(200);
    });

    it("ignores tampered timestamps (negative, non-numeric) without crashing", async () => {
      const ip = uniqueIp();
      const res = await POST(
        makeRequest({ email: "tampered@example.com" }, { cookie: "nfh_chat_rl=-999999999999,abc,NaN", ip })
      );
      expect(res.status).toBe(200);
    });
  });

  describe("regression: cookie value round-trips through URL-encoding", () => {
    it("decodes a %2C-encoded cookie back into its full timestamp list", async () => {
      // Found manually this session: NextResponse URL-encodes commas as
      // %2C in Set-Cookie, and the parser has to decode before splitting -
      // otherwise every multi-session cookie silently reset to empty,
      // making the burst/daily caps never trigger.
      const ip = uniqueIp();
      const now = Date.now();
      const encoded = `nfh_chat_rl=${now - 1000}%2C${now - 500}`;
      const res = await POST(makeRequest({ email: "encoding-check@example.com" }, { cookie: encoded, ip }));
      expect(res.status).toBe(200);
      const setCookie = res.headers.get("set-cookie") ?? "";
      const match = setCookie.match(/nfh_chat_rl=([^;]*)/);
      const decoded = decodeURIComponent(match?.[1] ?? "");
      const count = decoded.split(",").filter(Boolean).length;
      expect(count).toBe(3);
    });
  });
});

// app/help-embed/proxyShared.ts
import { NextRequest, NextResponse } from "next/server";

export const UPSTREAM_ORIGIN = "https://fabric.support.site";
const UPSTREAM_CANONICAL_ORIGIN = "https://support.nfh.global";
export const PROXY_PREFIX = "/help-embed";
export const ASSET_PREFIX = "/help-embed/next-assets";

const FORWARD_REQUEST_HEADERS = ["cookie", "content-type", "accept", "accept-language", "user-agent"];

const STRIP_RESPONSE_HEADERS = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "content-length",
  "content-encoding",
  "transfer-encoding",
  "connection",
  "strict-transport-security",
  "set-cookie",
  // Carries raw /_next/... preload hints that bypass the HTML body rewrite
  // below entirely; dropped rather than rewritten since the equivalent
  // <link> tags in the (rewritten) HTML body still load the same assets.
  "link",
]);

// Matches /_next/ and /api/ wherever they appear (HTML attributes, RSC
// payload JSON embedded in <script> tags, webpack runtime chunk-loading
// code, client-side fetch() calls) rather than only in specific quoted
// forms — the upstream app's client bundle references its own asset base
// path and backend API in more shapes than plain href="/_next/...". Both
// prefixes are safe to rewrite unconditionally here because this proxy
// targets exactly one known upstream app: any root-relative /_next/ or
// /api/ reference in its own bundle can only mean "load my own asset" or
// "call my own backend" — never a different, unrelated site. /help-embed/api/*
// resolves through the same generic catch-all as every other proxied path.
function rewriteAssetPaths(text: string): string {
  return text.replaceAll("/_next/", `${ASSET_PREFIX}/`).replaceAll("/api/", `${PROXY_PREFIX}/api/`);
}

function rewriteHtml(text: string): string {
  return rewriteAssetPaths(text).replaceAll(UPSTREAM_ORIGIN, "").replaceAll(UPSTREAM_CANONICAL_ORIGIN, "");
}

// The identity provider (WorkOS AuthKit, at *.auth.support.site) sends its
// own frame-ancestors/X-Frame-Options that refuse to render inside anyone
// else's iframe — a hard security policy on their end, not something a
// proxy can override. Any JSON response handing the client a URL on that
// host is rewritten to point at our own popup-launcher page instead, so the
// client opens it in a real top-level popup window rather than trying to
// navigate the iframe there directly.
const AUTH_PROVIDER_URL_PATTERN = /^https:\/\/[a-zA-Z0-9.-]*\.auth\.support\.site\/.*/;

function redirectAuthUrlsThroughPopup(value: unknown): unknown {
  if (typeof value === "string" && AUTH_PROVIDER_URL_PATTERN.test(value)) {
    return `${PROXY_PREFIX}/popup-auth?target=${encodeURIComponent(value)}`;
  }
  if (Array.isArray(value)) {
    return value.map(redirectAuthUrlsThroughPopup);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, redirectAuthUrlsThroughPopup(val)]),
    );
  }
  return value;
}

function rewriteLocation(location: string): string {
  let path = location;
  if (path.startsWith(UPSTREAM_ORIGIN)) {
    path = path.slice(UPSTREAM_ORIGIN.length);
  } else if (path.startsWith(UPSTREAM_CANONICAL_ORIGIN)) {
    path = path.slice(UPSTREAM_CANONICAL_ORIGIN.length);
  }
  return path.startsWith("/") ? `${PROXY_PREFIX}${path}` : path;
}

function forwardSetCookies(upstreamResponse: Response, outHeaders: Headers) {
  const headersWithGetSetCookie = upstreamResponse.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const cookies = headersWithGetSetCookie.getSetCookie?.() ?? [];
  for (const cookie of cookies) {
    // Drop any explicit Domain attribute so the cookie becomes host-only,
    // scoping it to this proxy's own domain instead of the upstream's.
    const rewritten = cookie.replace(/;\s*Domain=[^;]+/i, "");
    outHeaders.append("set-cookie", rewritten);
  }
}

/**
 * Proxies a single request to the upstream help-center app, rewriting the
 * response so it can be served from our own domain under PROXY_PREFIX:
 * - HTML: strip references to the upstream origin, rewrite /_next/ asset
 *   paths to ASSET_PREFIX so they resolve through the asset proxy instead of
 *   colliding with this app's own /_next/ build output.
 * - Redirects: rewrite Location back onto PROXY_PREFIX so the iframe never
 *   navigates to the upstream's real domain.
 * - Cookies: re-scoped to this domain (host-only, no Domain attribute).
 * - Upstream's own framing/CSP headers are dropped; we set our own
 *   frame-ancestors so only this site can embed the proxied page.
 */
export async function proxyToUpstream(req: NextRequest, upstreamPath: string): Promise<NextResponse> {
  const upstreamUrl = new URL(`${UPSTREAM_ORIGIN}/${upstreamPath}${req.nextUrl.search}`);

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Presented to the upstream as same-origin traffic so its own CSRF /
  // origin checks (if any) see a request that looks like it came from its
  // own frontend, not from our domain.
  headers.set("origin", UPSTREAM_ORIGIN);
  headers.set("referer", `${UPSTREAM_ORIGIN}/`);

  const method = req.method;
  const body = method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  const upstreamResponse = await fetch(upstreamUrl, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  if (upstreamResponse.status >= 300 && upstreamResponse.status < 400) {
    const location = upstreamResponse.headers.get("location");
    const outHeaders = new Headers();
    if (location) {
      outHeaders.set("location", rewriteLocation(location));
    }
    forwardSetCookies(upstreamResponse, outHeaders);
    return new NextResponse(null, { status: upstreamResponse.status, headers: outHeaders });
  }

  const contentType = upstreamResponse.headers.get("content-type") ?? "";
  const outHeaders = new Headers();
  upstreamResponse.headers.forEach((value, key) => {
    if (!STRIP_RESPONSE_HEADERS.has(key.toLowerCase())) {
      outHeaders.set(key, value);
    }
  });
  forwardSetCookies(upstreamResponse, outHeaders);
  outHeaders.set("content-security-policy", "frame-ancestors 'self'");
  outHeaders.set("x-robots-tag", "noindex, nofollow");

  if (contentType.includes("text/html")) {
    const html = await upstreamResponse.text();
    return new NextResponse(rewriteHtml(html), { status: upstreamResponse.status, headers: outHeaders });
  }

  if (contentType.includes("application/json")) {
    const raw = await upstreamResponse.text();
    try {
      const rewritten = JSON.stringify(redirectAuthUrlsThroughPopup(JSON.parse(raw)));
      return new NextResponse(rewritten, { status: upstreamResponse.status, headers: outHeaders });
    } catch {
      // Not actually parseable JSON despite the content-type; pass through
      // unmodified rather than fail the request.
      return new NextResponse(raw, { status: upstreamResponse.status, headers: outHeaders });
    }
  }

  // JS/CSS chunks can themselves embed the webpack runtime's asset base
  // path or further /_next/ references (e.g. dynamic import()); rewrite
  // those too so a page that loaded via the asset proxy doesn't turn around
  // and request /_next/... directly against this app's own domain.
  if (contentType.includes("javascript") || contentType.includes("text/css")) {
    const text = await upstreamResponse.text();
    return new NextResponse(rewriteAssetPaths(text), { status: upstreamResponse.status, headers: outHeaders });
  }

  const buffer = await upstreamResponse.arrayBuffer();
  return new NextResponse(buffer, { status: upstreamResponse.status, headers: outHeaders });
}

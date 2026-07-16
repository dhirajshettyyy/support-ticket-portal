const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://chat.cdn-plain.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' https://chat.cdn-plain.com data:",
  "img-src 'self' data: https:",
  "connect-src 'self' https://chat.cdn-plain.com https://chat.uk.plain.com wss://chat.uk.plain.com",
  // 'self' so this site can iframe its own /help-embed/* proxy pages.
  // https://*.support.site: the proxied help-center's own sign-in step
  // navigates the iframe to a separate auth subdomain on the same platform
  // (observed: api.auth.support.site) for the actual login widget. That
  // hop isn't proxied — its content briefly comes from support.site's own
  // domain (visible only via devtools frame inspection, never in the
  // browser's address bar, which never leaves this site).
  "frame-src 'self' https://*.support.site",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: import.meta.dirname,
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Excludes /help-embed/*: that proxy sets its own headers per
        // response (see app/help-embed/proxyShared.ts) because the proxied
        // third-party app needs a materially different CSP than the rest of
        // this site, and X-Frame-Options: DENY here would stop this site
        // from framing its own proxied pages.
        source: "/:path((?!help-embed/).*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/help-embed/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;

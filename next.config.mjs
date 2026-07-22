const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://chat.cdn-plain.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' https://chat.cdn-plain.com data:",
  "img-src 'self' data: https:",
  "connect-src 'self' https://chat.cdn-plain.com https://chat.uk.plain.com wss://chat.uk.plain.com",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  // fabric.support.site for the Help Center search box, which submits
  // there directly (opens in a new tab) rather than through a proxy.
  "form-action 'self' https://fabric.support.site",
].join("; ");

// GitHub Pages serves static files only, so it can't run headers() below.
// The pages.yml workflow sets BUILD_TARGET=github-pages for that build;
// the live app (Vercel) builds normally and keeps the security headers.
const isPagesBuild = process.env.BUILD_TARGET === "github-pages";

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: import.meta.dirname,
  poweredByHeader: false,
  ...(isPagesBuild
    ? { output: "export" }
    : {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "Content-Security-Policy", value: csp },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;

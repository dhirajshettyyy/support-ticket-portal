const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://chat.cdn-plain.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://chat.cdn-plain.com data:",
  "img-src 'self' data: https:",
  // The attachments upload bucket is per Plain's own documented CSP
  // requirements (help.plain.com/article/chat) - without it, attaching a
  // file in the chat widget silently fails: createAttachmentUploadUrl
  // succeeds, but the follow-up PUT straight to S3 gets blocked here.
  "connect-src 'self' https://chat.cdn-plain.com https://chat.uk.plain.com wss://chat.uk.plain.com https://prod-uk-services-attachm-attachmentsuploadbucket2-1l2e4906o2asm.s3.eu-west-2.amazonaws.com",
  "frame-src 'none'",
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
};

export default nextConfig;

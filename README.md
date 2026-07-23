# Support Ticket Portal

NFH's community hub landing page — a branded hero, an embedded Plain
(Nova/Ari) live chat widget gated behind an email-verification step, and
links out to docs, Discord, LinkedIn, and GitHub. No database, but it does
have one backend route (`/api/chat-auth`) and one required secret.

For the full picture — what's live, what's archived and why, current
security posture, and how to pick this back up for future work — see
[`BUILD_CONTEXT.md`](./BUILD_CONTEXT.md).

## Setup

```
npm install
cp .env.example .env.local   # then fill in PLAIN_CHAT_SECRET
npm run dev
```

`PLAIN_CHAT_SECRET` comes from Plain's Chat settings page (see
`.env.example` for details) and is required — `/api/chat-auth` returns 503
without it, which means the chat widget won't open at all.

**Testing interactivity:** `next dev`'s CSP doesn't allow the `eval()` that
webpack's dev-mode HMR needs, which silently breaks client-side handlers
(clicking things does nothing). Always verify interactive changes against
`npm run build && npm run start`, not `npm run dev`.

## Development

- `npm run dev` — local dev server (see the CSP/eval note above)
- `npm test` — test suite for the live app (`app/api/chat-auth`); the
  tests that belonged to the archived ticket workflow moved with it, see
  below
- `npm run build` — production build

## About the retired ticket workflow

This project originally also raised tickets as linked Plain threads +
GitHub issues, kept in sync via webhooks. That code has been moved to
`archive/` (not deleted — full git history preserved) after a security
review found the live endpoint reachable, unauthenticated, and with a
tenant-hijacking flaw. See [`archive/README.md`](./archive/README.md)
before reviving any of it — it needs real fixes, not just a restore.

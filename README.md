# Support Ticket Portal

NFH's support landing page — a branded hero, an embedded Plain (Nova/Ari)
live chat widget, links to Fabric component documentation, and a Help
Center button. No backend, no database, no environment variables required.

For the full picture — what's live, what's archived and why, current
security posture, and how to pick this back up for future work — see
[`BUILD_CONTEXT.md`](./BUILD_CONTEXT.md).

## Setup

```
npm install
npm run dev
```

That's it — no `.env.local` needed for the app as it currently stands.

## Development

- `npm run dev` — local dev server
- `npm test` — test suite (currently no live tests; the ones that existed
  belonged to the archived ticket workflow, see below)
- `npm run build` — production build

## About the retired ticket workflow

This project originally also raised tickets as linked Plain threads +
GitHub issues, kept in sync via webhooks. That code has been moved to
`archive/` (not deleted — full git history preserved) after a security
review found the live endpoint reachable, unauthenticated, and with a
tenant-hijacking flaw. See [`archive/README.md`](./archive/README.md)
before reviving any of it — it needs real fixes, not just a restore.

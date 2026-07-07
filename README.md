# Support Ticket Portal

Customers submit a structured ticket once; it is created as both a Plain
thread (for support) and a GitHub issue (for engineering), cross-linked and
kept in sync when either side is closed. See
`docs/superpowers/specs/2026-07-07-support-ticket-portal-design.md` for the
full design.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `PLAIN_API_KEY` — needs `thread:create`, `thread:read`, `tenant:create`,
     `threadField:create`, `threadField:update`, `threadFieldSchema:create`,
     `threadFieldSchema:read` permissions.
   - `GITHUB_TOKEN` — a fine-grained PAT scoped to Issues read/write on the
     target repo.
   - `GITHUB_REPO` — `owner/repo` of the target repo.
   - `GITHUB_WEBHOOK_SECRET` — a secret you choose; used to verify inbound
     GitHub webhook requests.
   - `PLAIN_WEBHOOK_SECRET` — the HMAC secret configured on your Plain
     webhook target.
3. Run `npm run setup:plain` once to create the required Thread Field
   Schemas in your Plain workspace (`product_area`, `ticket_type`,
   `github_issue_number`, `github_issue_url`, `needs_github_issue`).
4. In GitHub, go to the target repo's Settings → Webhooks → Add webhook:
   - Payload URL: `https://<your-deployment>/api/webhooks/github`
   - Content type: `application/json`
   - Secret: same value as `GITHUB_WEBHOOK_SECRET`
   - Events: select "Issues" only.
5. In Plain, go to Settings → Webhooks → Add webhook target:
   - URL: `https://<your-deployment>/api/webhooks/plain`
   - Events: `thread.thread_status_transitioned`
   - Note the signing secret Plain gives you and set it as
     `PLAIN_WEBHOOK_SECRET`.

## Development

- `npm run dev` — start the local dev server.
- `npm test` — run the unit and integration test suite.
- `npm run build` — production build.

## Manual end-to-end verification

1. Submit a ticket through the form at `/`.
2. In Plain, confirm a new thread appears with the correct title, priority,
   and `product_area`/`ticket_type` thread field values.
3. In GitHub, confirm a new issue appears in the target repo with matching
   labels and a body containing the Plain ticket reference.
4. Close the GitHub issue. Confirm the Plain thread's status flips to Done.
5. Submit a second ticket, then mark its Plain thread as Done instead.
   Confirm the corresponding GitHub issue closes.

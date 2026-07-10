# Archived: Plain + GitHub ticket workflow

This is the "raise a ticket" feature that used to create a Plain thread and a
GitHub issue together for every support request, and kept their statuses in
sync via webhooks. It was removed from the deployed app on 2026-07-10 (kept
here, not deleted, in case it's needed again) because:

- The UI entry point to it had already been removed from the support page.
- The API route was still live and reachable directly, unauthenticated and
  unrate-limited, which came up in a security review as an open risk.
- `companyName` was used to upsert a Plain tenant keyed by a slug derived
  from it, with no ownership check — an anonymous caller could rename an
  existing customer's tenant and attach their own email to it. This needs a
  real fix (e.g. verifying company affiliation) before this goes live again,
  not just a redeploy.

No credentials of any kind live in this repo, archived or otherwise, and
none ever did — check git history if you want to confirm.

## What's here

- `app/api/tickets/route.ts` — ticket creation endpoint (Plain thread +
  GitHub issue)
- `app/api/webhooks/plain/route.ts` — Plain thread closed → closes the
  linked GitHub issue
- `app/api/webhooks/github/route.ts` — GitHub issue closed → marks the
  linked Plain thread done
- `app/TicketForm.tsx` — the form UI (title, description, Fabric Module,
  Project, Priority, Type)
- `lib/plain.ts`, `lib/plainClient.ts` — Plain GraphQL client
- `lib/github.ts`, `lib/githubClient.ts` — GitHub REST client
- `lib/ticketLink.ts` — correlates a GitHub issue back to its Plain thread
  via a hidden marker in the issue body
- `lib/webhookSignatures.ts` — HMAC signature verification for both webhooks
- `lib/taxonomy.ts` — the Fabric Module / Project / Priority / Type enums
  and their GitHub label / Plain field mappings
- `scripts/setup-plain-workspace.ts` — one-time script that provisions the
  custom thread field schemas in Plain

## To revive this

1. Move everything back under the live `app/` and `lib/` directories
   (reverse of how it got here — `git mv archive/app/api/tickets
   app/api/tickets`, etc.), and move the matching `__tests__` files back too.
2. Fix the tenant-hijacking issue in `lib/plain.ts` — `upsertTenant` /
   `upsertCustomer` need an ownership check before letting an anonymous
   caller attach themselves to an existing tenant, not just a slug match.
3. Add rate limiting and/or a CAPTCHA to `app/api/tickets/route.ts` before
   it's reachable again — it was hit directly with `curl`, no UI needed,
   during the security review that led to this archive.
4. Have the secrets ready (get fresh ones — don't reuse anything that was
   ever in this project's `.env.local`, treat it as retired):
   - `PLAIN_API_KEY`
   - `GITHUB_TOKEN`
   - `GITHUB_REPO` (e.g. `owner/repo`)
   - `GITHUB_WEBHOOK_SECRET`
   - `PLAIN_WEBHOOK_SECRET`
5. Re-add those to Vercel (`vercel env add <name> production`) and to
   `.env.local` locally.
6. Re-register the GitHub and Plain webhooks pointing at
   `/api/webhooks/github` and `/api/webhooks/plain` if they were removed
   from either platform's dashboard after this was archived (check first —
   removing the registrations was a separate followup, not guaranteed to
   have happened at the same time as this archive).

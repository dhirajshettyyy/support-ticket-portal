# Support Ticket Portal — Design

## Purpose

A standalone web app where customers submit structured support tickets that are
simultaneously raised as a **Plain thread** (for the support team) and a
**GitHub issue** (for engineering), kept in sync when either side is closed.

Client conversations themselves are already handled by Ari (Plain's AI agent) in a
separate surface — out of scope here. This portal covers only the structured
ticket intake and its fan-out to Plain + GitHub.

## User Flow

1. A customer reaches the portal either directly, or via a link Ari drops into a
   chat conversation that needs to become a tracked ticket.
2. They fill out one form: email, company name (optional), title, description,
   and three dropdowns — product area, severity, ticket type (bug / feature /
   question).
3. On submit, the backend creates a Plain thread and a GitHub issue with the
   same information, cross-linked to each other. This takes a couple of
   seconds.
4. The customer sees a confirmation with a ticket reference. From here the
   ticket is invisible to them — support works it in Plain, engineering works
   it in GitHub.
5. When engineering closes the GitHub issue, the Plain thread automatically
   moves to done, so support knows to follow up. The reverse also holds: if
   support closes the Plain thread first, the GitHub issue closes too.

## Architecture

A single Next.js (App Router) app. No database, no queue, no worker process.

- **`/` (portal page)** — public form, no auth required. Fields: email,
  company name (optional), title, description, product area, severity, ticket
  type.
- **`POST /api/tickets`** — orchestration route. Upserts the Plain
  tenant/customer, creates the Plain thread, creates the GitHub issue,
  cross-links both, returns a confirmation.
- **`POST /api/webhooks/github`** — receives GitHub's `issues` webhook. On
  `closed`, updates the linked Plain thread's status.
- **`POST /api/webhooks/plain`** — receives Plain's
  `thread.thread_status_transitioned` webhook. When a thread transitions to a
  done/closed status, closes the linked GitHub issue.

### Environment variables

| Variable | Purpose |
|---|---|
| `PLAIN_API_KEY` | Plain API key with `thread:create`, `thread:read`, `tenant:create`, `customer:create`, `threadField:create`/`update` permissions |
| `GITHUB_TOKEN` | Fine-grained PAT, Issues read/write scope, on the single target repo |
| `GITHUB_REPO` | `org/repo` the issue is created in |
| `GITHUB_WEBHOOK_SECRET` | Validates inbound GitHub webhook signatures |
| `PLAIN_WEBHOOK_SECRET` | Validates inbound Plain webhook signatures |

### Auth model

No existing login system to reuse. The submitter is identified by the email
they type into the form. That email is used to upsert a Plain customer; the
company name (if given) is used to upsert a Plain tenant so tickets from the
same company group together in Plain.

## Components

- `lib/plain.ts` — thin GraphQL client wrapper exposing `upsertTenant`,
  `upsertCustomer`, `createThread`, `upsertThreadField`, `changeThreadStatus`.
- `lib/github.ts` — REST client wrapper exposing `createIssue`, `closeIssue`,
  `addComment`.
- `app/api/tickets/route.ts` — orchestration handler for the flow above.
- `app/api/webhooks/github/route.ts`, `app/api/webhooks/plain/route.ts` —
  inbound sync handlers.
- `app/page.tsx` — the form UI.
- `lib/taxonomy.ts` — constants mapping form values (product area, severity,
  ticket type) to Plain label IDs and GitHub label names, so both sides use a
  consistent vocabulary.

## Data Flow

1. Customer submits the form → `POST /api/tickets`.
2. Handler upserts the Plain tenant (if company given) and customer (by
   email).
3. Handler creates the Plain thread: title, description as the initial
   message, priority derived from severity, labels for product area and
   ticket type.
4. Handler sets Plain thread fields for the structured values (product area,
   severity, ticket type) via `upsertThreadField`.
5. Handler creates the GitHub issue: title, body containing the description,
   the structured fields, and a deep link to the Plain thread. GitHub labels
   are applied matching product area/severity/type.
6. Handler writes the GitHub issue URL back onto the Plain thread (as a thread
   field) and confirms the Plain thread link is present in the GitHub issue
   body.
7. Handler returns a confirmation + ticket reference to the customer.
8. Later, independently: GitHub issue closed → `/api/webhooks/github` looks up
   the linked Plain thread (via the stored thread field/external ID) and
   transitions its status to done.
9. Later, independently: Plain thread transitions to a done/closed status by a
   human → `/api/webhooks/plain` looks up the linked GitHub issue and closes
   it.
10. Each sync direction checks the current state of the target before acting,
    so the two webhooks cannot loop each other (closing an already-closed
    issue/thread is a no-op).

## Error Handling

- Plain call fails during creation → abort before touching GitHub; nothing is
  created; the customer sees an error and can resubmit. This fails closed so
  no GitHub issue is ever created without a corresponding Plain thread.
- Plain thread succeeds but GitHub issue creation fails → retry once; if it
  still fails, tag the Plain thread `needs-github-issue` and log the failure,
  so the team can create the GitHub issue manually from the thread that
  already exists in Plain.
- Invalid webhook signature (either direction) → reject with 401, no
  processing.
- Webhook references a thread/issue this app has no record of linking → no-op,
  log, return 200 (avoids retry storms from Plain/GitHub's at-least-once
  redelivery).
- Duplicate webhook delivery → idempotent; handler checks current status
  before mutating, so redelivery is a safe no-op.

## Testing

- Unit tests for `lib/plain.ts` and `lib/github.ts` request builders (mocked
  fetch), covering the taxonomy mapping.
- Integration test for the happy path through `POST /api/tickets`.
- Manual verification checklist:
  1. Submit a ticket → thread appears in Plain with correct fields/labels.
  2. GitHub issue appears in the target repo with correct labels/body and a
     link back to the Plain thread.
  3. Close the GitHub issue → Plain thread status updates.
  4. Reopen, then close the Plain thread instead → GitHub issue closes.

## Out of Scope (v1)

- Any handling of Ari's conversation content itself — Ari only links out to
  this portal.
- Multi-repo routing (all tickets go to one fixed GitHub repo).
- Authenticated login for submitters.
- A database/outbox for guaranteed delivery — creation failures are
  surfaced/logged for manual follow-up rather than auto-retried indefinitely.

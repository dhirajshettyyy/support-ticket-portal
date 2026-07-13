# Build context — NFH Support Portal

Written 2026-07-13 as a handoff/upgrade reference. If you're coming back to
this repo after a break, start here.

## What this is, right now

A single Next.js page at `support-ticket-portal.vercel.app`, meant to be
NFH's support landing page (branded to match networksforhumanity.org
exactly — nav, fonts, colors, footer content all pulled from the live site,
not approximated). It has:

- A hero ("Welcome to NFH Support")
- A compact "Hey, how can I help you?" bar that expands into Plain's live
  chat widget (Nova/Ari) on click, and can be minimized back down
- A documentation section linking out to each core Fabric component's real
  docs (Fabric, UNITS, DeDi, Vouch, Pincer)
- A "Help Center" button
- A footer matching networksforhumanity.org's real footer (address, quick
  links, contact, logo)
- Full light/dark theme support via system preference

That's it. **There is no backend.** No database, no API routes, no
environment variables, no secrets. It's a fully static page plus one
third-party embedded script (Plain's chat widget).

## What used to be here

The original build was a ticket portal: a form that created a Plain thread
*and* a GitHub issue together, cross-linked, with webhooks keeping their
statuses in sync in both directions. That code still exists — it's in
`archive/`, not deleted, with full git history preserved (check `git log
--follow` on any archived file).

It was pulled out of the live app in two steps:
1. The UI entry point (the "Raise a ticket" button) was removed first, per
   a product decision to route support through chat + Help Center instead.
2. The backend was archived shortly after, once a security review found the
   API route was still live and directly reachable (`curl` could hit it
   with no UI involved), unauthenticated, unrate-limited, and had a
   business-logic flaw: `companyName` was slugified and used as a Plain
   tenant's `externalId` in an *upsert* — meaning any anonymous caller could
   rename an existing customer's tenant and attach their own email to it,
   with no ownership check.

**Read `archive/README.md` before reviving any of this.** It documents what
has to actually be fixed (not just restored) first, plus the full list of
env vars/secrets you'd need again (get fresh ones — treat anything that was
ever in this project's `.env.local` as retired, don't reuse it).

## Security posture (last hardened 2026-07-10)

- `next.config.mjs` sets a CSP, `frame-ancestors 'none'` (page can't be
  iframed anywhere), `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, and disables the `X-Powered-By` header.
- The CSP's script/font/connect allowlist (`chat.cdn-plain.com`,
  `chat.uk.plain.com`) was built from the widget's actual observed network
  traffic, not guessed — tested against a real `next build && next start`
  server (not dev mode) before ever deploying a CSP change.
- `script-src` needs `'unsafe-inline'` because Next.js's own App Router
  hydration relies on inline scripts. A nonce-based CSP would fix that but
  forces this page off static prerendering into per-request dynamic
  rendering — not worth the performance cost for a page with zero
  user-content rendering surface right now. Revisit if that changes (e.g.
  if a form or any user-submitted content ever gets rendered back on this
  page).
- `postcss` is pinned via `package.json` `overrides` to `^8.5.10` (Next.js
  15.5.20 still ships a vulnerable `8.4.31` internally) — closes a moderate
  advisory without touching the Next.js version.
- `npm audit --omit=dev` → 0 vulnerabilities. Full `npm audit` still shows
  findings, but they're entirely in the `vitest`/`vite`/`esbuild` dev-tooling
  chain (about exposing a *local dev server*, not applicable to what's
  deployed) — not urgent, would require a breaking `vitest@4` upgrade to
  clear.
- No credentials have ever been committed to this repo — checked via
  `git grep` across full history, not just the current tree.
- Production has zero environment variables configured on Vercel as of this
  writing.

### Known open items, not yet done
- The actual GitHub PAT and Plain API key that used to power the ticket
  workflow were removed from Vercel but **never revoked at the source**
  (GitHub → Developer settings, Plain → workspace API keys). They're still
  technically valid, just unused by this app.
- If GitHub/Plain webhook registrations still point at
  `/api/webhooks/github` and `/api/webhooks/plain`, they now just get 404s
  — harmless, but dead config worth removing from both dashboards.
- `img-src` in the CSP is `'self' data: https:` — permissive. Low practical
  risk today (nothing on this page renders user-controlled content), but
  worth tightening to the specific domains actually used if this page ever
  changes.

## Deployment

- Vercel project: `nfh/support-ticket-portal`
- Production: `https://support-ticket-portal.vercel.app`
- GitHub: `https://github.com/dhirajshettyyy/support-ticket-portal` (public)
- Deploy flow: merge to `main` → `git push origin main` → `vercel deploy
  --prod` from the repo root (Vercel doesn't auto-deploy on push in this
  setup; it's manual).

## Key files

| File | What it does |
|---|---|
| `app/SupportPage.tsx` | Page composition — nav, hero, chat entry, docs section, footer |
| `app/ChatEntry.tsx` | The compact→expand→minimize wrapper around the Plain widget |
| `app/PlainChatWidget.tsx` | Loads Plain's script, calls `Plain.init` with `embedAt` pointing at a container element (not a CSS selector string — that's a real gotcha, see inline comment) |
| `app/fabricComponents.ts` | The five Fabric component names + doc links shown as buttons |
| `app/globals.css` | All styling; light/dark theme via CSS custom properties in `:root` / `@media (prefers-color-scheme: dark)` |
| `app/layout.tsx` | Self-hosted Space Grotesk font via `next/font/google` |
| `next.config.mjs` | Security headers / CSP |
| `archive/` | The retired ticket workflow — see its own README |
| `docs/superpowers/` | Original design spec and plan from the initial build (2026-07-07), now historical — describes the ticket-portal version, predates the archival |

## Brand-matching notes

The visual design was matched against the *actual live* networksforhumanity.org
site (scraped directly, not assumed) more than once over the course of this
build, including a precise re-audit of computed styles (not just visual
approximation) for the footer specifically — exact colors, font sizes, and
weights for section headings, address text, links, and the "Write to Us."
treatment. If NFH's marketing site gets redesigned, this page will drift out
of sync and would need another pass.

The Plain chat widget's `appId` (`liveChatApp_01KWH2XSVE4CPF90QTG7ZDR8CA`) is
hardcoded in `PlainChatWidget.tsx` — it's a public client-side identifier by
design, not a secret.

## If you want to pick this back up

- For a UI change: this repo's whole workflow has been screenshot-driven —
  build in an isolated git worktree, screenshot desktop + mobile (and
  light + dark, since both are supported) before touching production,
  iterate on feedback, only then merge/push/deploy.
- For anything touching the CSP or headers: test against a real
  `next build && next start` server first, not `next dev` — dev mode
  doesn't apply the same headers reliably, and it's the only way to catch
  a CSP violation before it's live. Watch the browser console for
  `Content-Security-Policy` violation messages; they name the exact
  blocked directive and source.
- For reviving the ticket workflow: don't just move the files back. Read
  `archive/README.md` — there's a real vulnerability to fix first.

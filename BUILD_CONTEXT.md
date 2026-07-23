# Build context — NFH Support Portal

Written 2026-07-13, substantially rewritten 2026-07-17 after a full
community-hub redesign. If you're coming back to this repo after a break,
start here.

## What this is, right now

A single Next.js page — the **"NFH Community" hub** — reachable reliably at
`https://support-ticket-portal.vercel.app` (see "Deployment" below for why
that's the URL to trust, not the custom domain). It has:

- Header: NFH logo (left) → `networksforhumanity.org`; social icons
  (Discord/LinkedIn/GitHub) + a light/dark theme toggle (right). One row,
  nothing else — no CTA button lives in the header.
- Hero: "Welcome to the NFH Community" + subtitle, sitting in front of a
  world map made of dots (see "The world map" below).
- A compact chat bar ("Ask Node anything about NFH Fabric") that expands
  into Plain's live chat widget on click, and can be minimized back down.
  Directly below it: `Still can't find an answer?  [Get Help →]`, linking
  to `support.nfh.global` — a small inline CTA, deliberately *not* a
  full-width button (an earlier version looked too much like a form submit
  button).
- Four community tiles in a single row on desktop (2-up tablet, 1-up
  mobile): Learn → docs, Interact → Discord, Connect → LinkedIn,
  Contribute → GitHub *Discussions* specifically (not the main repo — the
  header's GitHub icon points at the repo itself). Buttons are
  bottom-aligned across all four tiles via flexbox regardless of how long
  each description runs.
- A footer: just the "Write to Us" contact block (address + quick-links
  columns were deliberately removed), NFH logo, copyright.
- Full light/dark theme support — **not just system preference**: an
  explicit toggle in the header persists the choice to `localStorage` and
  applies it via a blocking inline script in `layout.tsx` (no
  flash-of-wrong-theme on reload). System preference is still the fallback
  when no explicit choice has been made.

That's it. **There is no backend.** No database, no API routes, no
environment variables, no secrets. It's a fully static page plus one
third-party embedded script (Plain's chat widget).

### The world map

Background world map is procedurally generated via the `dotted-map` npm
package (MIT, no external/scraped assets) into `public/world-map-mask.svg`,
used as a CSS `mask-image`. It's a `position: sticky` layer spanning the
entire `<main>` (not just the hero) — stays pinned in the viewport as you
scroll through hero/chat/tiles, and is clipped by `.landing`'s
`overflow: clip` so it physically cannot bleed past the footer boundary.
`mask-size: cover` (not `contain` — that left blank letterbox bands above
the header and above the footer). Tile cards and the footer keep their own
opaque backgrounds and sit on top of it; only the gutters around/between
tiles show the map through. Opacity is `--map-opacity` (currently
0.32 light / 0.35 dark) — this value has swung a few times this session
(too faint → invisible complaints → too strong → current middle ground),
so if it gets revisited, check `git log -p -- app/globals.css` around the
`--map-opacity` lines for the full back-and-forth before picking a number.

If a `position: relative` (or other positioning) gets removed from any
section sitting on top of the map, dots can bleed through solid buttons
inside it — CSS paints non-positioned elements *before* positioned
siblings regardless of DOM order, so a non-positioned section painted
before this sticky, positioned map layer even though it's later in the
markup. Bit us once (`.help-center-section`); worth remembering if a
similar bug resurfaces elsewhere.

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
- **Reliable public URL: `https://support-ticket-portal.vercel.app`.**
  Two other things that look like "the URL" are not safe to hand out:
  - `dhirajshetty.com` is the custom domain Vercel currently aliases to
    production, but its DNS is broken (Cloudflare nameservers active with
    no correct record pointing at Vercel → SSL handshake failure, HTTP 525).
    Fix (needs Cloudflare dashboard access, not doable via this repo/CLI):
    add `A dhirajshetty.com → 76.76.21.21`. This was already broken before
    this session touched anything.
  - `community.nfh.global`, the domain named in the original design brief,
    was never actually attached to this Vercel project at all.
  - Per-deployment `*-nfh.vercel.app` URLs (the unique one `vercel --prod`
    prints on every deploy) are gated behind Vercel's login/SSO for anyone
    not on the `nfh` team — fine for you, broken for anyone else you send
    a link to.
- GitHub: `https://github.com/dhirajshettyyy/support-ticket-portal` (public)
- **Deploy flow actually used this session: `vercel --prod --yes` run
  directly from the `worktree-community-hub-redesign` feature branch, after
  every change — never merged to `main`.** As of this writing `main` is 16
  commits behind that branch and does not reflect any of the community-hub
  redesign; production has been kept up to date entirely via direct
  `vercel --prod` promotions from the branch, independent of git's default
  branch. PR #18 (`Match community hub to NFH's real brand, fix world map`)
  is open and still in **draft** — merging it (and fast-forwarding `main`)
  hasn't happened. If you pick this up again, either keep deploying from
  the feature branch as before, or merge #18 first and switch back to the
  documented merge-to-main flow — just don't assume `main` is current.

## Key files

| File | What it does |
|---|---|
| `app/SupportPage.tsx` | Page composition — header, hero, chat entry + inline Get Help CTA, tiles, footer |
| `app/CommunityTiles.tsx` | Renders the 4 tiles from `communityLinks.ts` |
| `app/TileIcons.tsx` | Solid-fill geometric icons for the 4 tiles (matches NFH's blocky logo/favicon style — not the thin-stroke outlines from an earlier pass) |
| `app/ThemeToggle.tsx` | Light/dark toggle — reads/writes `localStorage`, stamps `data-theme` on `<html>` |
| `app/communityLinks.ts` | All external URLs + tile copy in one place — check here first for any link/text change |
| `app/ChatEntry.tsx` | The compact→expand→minimize wrapper around the Plain widget |
| `app/PlainChatWidget.tsx` | Loads Plain's script, calls `Plain.init` with `embedAt` pointing at a container element (not a CSS selector string — that's a real gotcha, see inline comment) |
| `app/globals.css` | All styling; light/dark theme via CSS custom properties, both `@media (prefers-color-scheme: dark)` *and* explicit `:root[data-theme]` overrides |
| `app/layout.tsx` | Self-hosted Space Grotesk font via `next/font/google`, plus the blocking anti-flash theme script |
| `next.config.mjs` | Security headers / CSP |
| `public/world-map-mask.svg` | Generated by `dotted-map` — see "The world map" above before regenerating it |
| `archive/` | The retired ticket workflow — see its own README |
| `docs/superpowers/` | Original design spec and plan from the initial build (2026-07-07), now historical — describes the ticket-portal version, predates both the archival and this redesign |

Deleted this session, no longer exist: `app/fabricComponents.ts` (the
Fabric/UNITS/DeDi/Vouch/Pincer doc-links row was removed from the page
entirely) and `app/HelpCenterSection.tsx` (the separate "Need a hand?"
section was removed — its one CTA got folded into the inline Get Help
link under the chat box).

## Brand-matching notes

Colors, footer copy/structure, and general layout language were matched
against the *actual live* networksforhumanity.org site (scraped directly,
not assumed) more than once over the course of this build. If NFH's
marketing site gets redesigned, this page will drift out of sync and would
need another pass.

**Fonts, specifically, do *not* match the live NFH site — deliberately.**
Their site actually uses two typefaces: a Typekit face called "tenon" for
headings and self-hosted Space Grotesk for body text. This page tried
matching that exactly (wiring up the Typekit stylesheet, adjusting the
CSP to allow it) — but the two-font split read as a visual mismatch in
practice ("ALL FONTS NEED TO MATCH, WHY ARE THEY DIFFERENT"), so it was
reverted. The page now uses Space Grotesk everywhere, headings and body
alike, and the Typekit `<link>` + CSP allowance were removed again. If a
future redesign wants tenon back, know going in that it looked
inconsistent last time and be ready to justify why headings should look
different from body copy before reintroducing the split.

The Plain chat widget's `appId` (`liveChatApp_01KWH2XSVE4CPF90QTG7ZDR8CA`) is
hardcoded in `PlainChatWidget.tsx` — it's a public client-side identifier by
design, not a secret.

## Known open items from the 2026-07-17 redesign

- `dhirajshetty.com`'s DNS is broken (see "Deployment" above) — needs
  someone with Cloudflare dashboard access, not fixable from this repo.
- `community.nfh.global`, the domain named in the original brief, was
  never attached to the Vercel project. Unclear if that's still the
  intended final domain.
- PR #18 is open in draft, `main` is 16 commits behind the deployed
  branch. Nothing is lost (it's all pushed to
  `worktree-community-hub-redesign`), but `main` should not be trusted as
  "current" until that PR is merged.
- Not independently verified this session, inherited as-is from the prior
  build: real cross-browser testing (only headless Chromium was available
  here), a real Lighthouse run, and manual screen-reader/keyboard-nav
  passes. Contrast ratios *were* computed and confirmed WCAG AA across all
  major text/background pairs.

## If you want to pick this back up

- For a UI change: this repo's whole workflow has been screenshot-driven —
  build in an isolated git worktree, screenshot desktop + mobile (and
  light + dark, since both are supported) before touching production,
  iterate on feedback, only then push + `vercel --prod`. This session
  leaned on real `getBoundingClientRect()` measurements for spacing claims
  rather than eyeballing screenshots, and on real `window.scrollTo()`
  positions rather than Playwright's `fullPage` screenshots — the latter
  renders `position: sticky` elements incorrectly (only correct at their
  initial scroll-0 position), which produced at least one false "the map
  is broken on mobile" alarm before that was caught.
- **`next dev` cannot be used to test any click/interaction on this repo.**
  This project's CSP has no `unsafe-eval` in `script-src`, and Next's dev
  server relies on `eval()` for its module system — every `onClick`
  silently no-ops in dev mode with only a console CSP warning to explain
  why. Always verify interactive changes (the theme toggle, the chat
  expand button, anything with `onClick`) against `next build && next
  start`, not `next dev`.
- For anything touching the CSP or headers: same rule applies, and doubly
  so — test against a real `next build && next start` server first. Watch
  the browser console for `Content-Security-Policy` violation messages;
  they name the exact blocked directive and source.
- For reviving the ticket workflow: don't just move the files back. Read
  `archive/README.md` — there's a real vulnerability to fix first.

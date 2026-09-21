# CastEasy.io — Handoff

*Last updated 2026-09-20. Read this first on a new machine.*

## What this repo is

**CastEasy.io** (brand also written *CastEZ*) is a rebrand and redesign of the
**Community Bulletin** app: a digital-billboard marketplace where advertisers
book ad slots on screens in local store windows, and store owners earn Stripe
payouts for hosting them.

The code was imported from `attapeutech/Community-Bulletin-2026`, branch
**`claude/ad-submission-payment-x36DJ`** — **not `main`**, which is stale and
missing ~27 routes (the public site, ad renew/end/track, cron expiry, earnings,
geo admin). All of that history is here; the scaffold commit it replaced is
tagged `pre-import-scaffold`.

Stack: Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 3.4 · Drizzle
ORM on Postgres (Neon) · better-auth · Stripe + PayPal · Resend · Socket.io ·
Cloudflare R2.

---

## Setting up on a new machine

```bash
git clone <repo-url> casteasy-io && cd casteasy-io
npm install
cp .env.example .env.local      # then fill it in — see below
npm run db:migrate              # only for a fresh database
npm run db:seed:geo             # only for a fresh database
npm run dev                     # http://localhost:3000
```

The Neon database is **already migrated and seeded**. If you point
`.env.local` at it, skip both `db:` commands.

### Environment variables

Next.js and `drizzle.config.ts` both read **`.env.local` first**, then `.env`.
`.env.local` is gitignored — it will not come with the clone.

| Variable | Needed for | Status |
|---|---|---|
| `DATABASE_URL` | everything | Neon, working |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` | auth | set on the old machine |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` | `/register`, `/contact` | **never set — see open issue 1** |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_ADMIN_EMAIL`, `RESEND_APPROVER_EMAIL` | verification + notification email | carry over from the old site |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | ad payments | carry over |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | ad payments | carry over |
| `CLOUDFLARE_R2_*` (5 vars) | ad image uploads | were not set on the old machine |
| `CRON_SECRET` | `/api/cron/expire-ads` | not set |

`NEXT_PUBLIC_*` values are baked in at build time — restart `npm run dev`
after changing them.

---

## Database

- **Neon Postgres**, migrations `0000`–`0005` applied.
- `0005_many_stark_industries` added 18 columns that were in the Drizzle schema
  but in no migration file (they had been created with `db:push`). If a query
  ever fails with *"column … does not exist"*, suspect this pattern first: run
  `npm run db:generate` and look at the diff.
- **Geo data**: 1 country, 8 states, 6 cities (all in Washington), 8 postal
  codes. Demo-sized — pick California and the city list is empty. Add more via
  `/dashboard/admin/geo` or extend `scripts/seed-geo.ts`.
- **No users exist yet.**

### Making yourself admin

Register through the app (needs the reCAPTCHA keys first), then in Neon:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

`role` is a Postgres enum: `user`, `store_owner`, `approver`, `admin` —
**lowercase**. `'ADMIN'` is rejected.

### Seeds

- `npm run db:seed:geo` — geography only, no users, no credentials. Safe for
  production. Refuses to run twice.
- `npm run db:seed` — **don't use.** It creates `admin@communitybulletin.com`
  and `approver@communitybulletin.com` with passwords hardcoded in the repo,
  and those logins probably don't work anyway: it writes `users.password_hash`,
  but better-auth authenticates against `account.password`.

---

## How the app is laid out

Route groups do not change URLs.

```
src/app/
  layout.tsx        html/body, ThemeProvider, Toaster
  (site)/           shared shell: Nav + Footer (SiteChrome)
    page.tsx        the landing page at /
    help/ contact/ privacy/ terms/ live-ads/ ad/[id]/ stores/[slug]/ ads/
    dashboard/      nests its own layout — just the role-filtered sidebar
  (auth)/           standalone, no nav/footer, pinned dark
    login/ register/ forgot-password/ reset-password/ two-factor/ verify-email/
  display/[slug]/   kiosk screen — outside the shell on purpose
  demo/             franchise demo — own stylesheet, outside the shell
  api/
```

**Redesign code** lives in `src/components/castez/`: `SiteChrome`, `Nav`,
`NavSearch`, `NavAuth`, `NavBell`, `UserMenu`, `MobileMenu`, `AuthShell`,
`Hero`, `Audiences`, `Flow`, `Footer`, `Brand`. Shared fonts are in
`src/lib/fonts.ts`.

### Design tokens

37 colours namespaced **`ce-*`** (`bg-ce-ground`, `text-ce-muted`,
`border-ce-line3`…) so they cannot collide with the older shadcn tokens still
used by unredesigned pages.

- Values live in `src/app/globals.css` as HSL triplets: light on `:root`, dark
  on `.dark`. `tailwind.config.js` maps them as `hsl(var(--ce-x) / <alpha-value>)`,
  which is what keeps opacity modifiers like `bg-ce-accent/30` working.
- **Both sets come from the design.** Change them there, not by eye.
- `ce-screen` and `ce-slot` are dark in both themes on purpose — they depict a
  physical display panel. The design does the same.
- `.ce-grad` (in `globals.css`) is the theme-aware headline gradient.
- Theme is next-themes on the `class` strategy. Auth pins `dark` because its
  design has no light variant.

---

## The design source

**`castez-package/`** is the Claude Design handoff and the source of truth for
how things look.

- `design-components/*.dc.html` — **the real designs.** Open in a browser with
  `support.js` beside them.
- `nextjs/` — a *simplified* port of those designs: no notification bell, no
  theme toggle, different CTAs, hardcoded dark `zinc-*` colours, static mock
  data. **Read the `.dc.html` first**; use `nextjs/` only for structure.

Working rule so far: **the design is the truth for looks; our code is the truth
for behaviour.** Port the markup onto `ce-*` tokens and keep the real wiring
(better-auth, `/api/geo`, `/live-ads`) rather than the design's stubs.

`castez-handoff/` and the root `CastEZ Landing.html` are an earlier,
landing-only export, superseded by `castez-package/`. Uncommitted and safe to
delete.

---

## Status

**Done**
- Landing page live at `/`, light and dark
- Nav from the design: logo mark, segmented location + search, notification
  bell, theme toggle, account menu when signed in, mobile sheet
- Location dialog from the design, on the real `/api/geo` data
- Login, register and forgot-password on the design's `AuthShell`
- Shared `(site)` layout; dashboard trimmed to a sidebar under it
- Schema drift fixed; Neon migrated and geo-seeded

**Not done**
- `reset-password`, `two-factor`, `verify-email` still use the old two-column
  `AuthLayout` (`src/components/auth/AuthLayout.tsx`)
- Interior pages — `/help`, `/live-ads`, `/contact`, the dashboard — still carry
  the old light styling inside the new chrome
- Notification bell shows a real empty state. The `notifications` table exists
  but no `/api/notifications` route serves it.

---

## Open issues, in priority order

1. **Nobody can register.** `/register` requires reCAPTCHA v3 and neither key
   is set, so submit stops at *"reCAPTCHA not ready"*. `/contact` has the same
   dependency. Add the keys, or decide to skip the check when they are absent.
2. **better-auth 1.2.0 has a 2FA bypass** (GHSA-xg6x-h9c9-2m83) that affects the
   live `/two-factor` flow, via `session.cookieCache`, which is enabled. `next`
   16.2.3 has middleware-bypass and CSP-nonce advisories. Both fixes are inside
   the existing semver ranges: `npm update better-auth next`. Test login and 2FA
   afterwards — better-auth moves five minor versions.
3. **Google sign-in is a dead button.** Login and register call
   `signIn.social({ provider: "google" })`, but `src/lib/auth/index.ts` has no
   `socialProviders` block. Deliberately left in place for now.
4. **`/demo` requires login** — it isn't in `PUBLIC_ROUTES` in
   `src/middleware.ts`. The mobile menu links to it, so logged-out users get
   bounced to `/login`.
5. **`middleware.ts` is deprecated in Next 16** — renamed to `proxy.ts`. The dev
   server warns on every boot. A codemod exists.
6. **No ESLint config** — no `eslint.config.js`, so `npm run lint` has never
   worked here.

---

## Gotchas worth knowing

- **Three silent CSS positioning bugs** have come from ancestor properties
  quietly changing what a child's positioning means. None of them errors:
  - `overflow-x: hidden` on `body` made body a scroll container and disabled
    every `position: sticky` in the app. It is now on `html` only — keep it
    that way.
  - `overflow-x: hidden` on a wrapper broke the sticky nav the same way.
  - `backdrop-filter` on the nav makes it a containing block for
    `position: fixed` children, trapping modals under the nav. The location
    dialog is portalled to `document.body` for this reason — do the same for
    any new overlay rendered from inside the nav.
- **Anything rendered inside the nav that uses `position: fixed` must portal.**
  Radix `Sheet` and `DropdownMenu` already do.
- **Windows file locks:** `git mv` of a route directory fails with *Permission
  denied* while `npm run dev` is running. Stop the server first.
- **Stale route types:** after moving routes, `tsc` reports missing modules
  under `.next/dev/types/`. Delete that folder or load a page and it
  regenerates.
- **`castez/` components must not import each other in a cycle.** `Nav`
  imports `MobileMenu`, so anything they share lives in `Brand.tsx`,
  `NavItems.tsx` or `navStyles.ts`.
- **Handoff folders are excluded from `tsconfig.json`** — their `@/` imports
  resolve against our `src/` and break typecheck otherwise.

# Handoff: 2026-10-22

## Where things stand

- **Branch:** `claude/ad-submission-payment-x36DJ` was synced with origin, `main` was merged into it, and it was then merged into `main` via PR. `main` now holds everything.
- **Production:** deployed from `main` in Coolify (manual **Redeploy**; auto-deploy is not on). The deploy succeeded, and login and ad renewals work.
- **Database:** moved from the Coolify Postgres container to **Neon** (Postgres 18, `us-east-2`).
  - Data was copied with `pg_dump` / `pg_restore` (14 tables: users, ads, payments, sessions, locations, geography, etc.).
  - Coolify's `DATABASE_URL` now points to the Neon **pooled** connection string.
  - Verified after cutover: two ad renewals on 2026-10-23 were written to Neon (payments 55 → 57).
- **Socket.io:** runs inside the main Next.js server (`server.ts`, port 3000). No separate service is needed.

## Environment and config

- Local config is in **`.env.local`** (git-ignored). It points at the **production** Neon database (pooled), so admin actions taken locally change live data.
- In `.env.local`, `APP_URL`, `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` must be `http://localhost:3000`, or local login silently fails (the auth cookie lands on the production domain). Run locally with `npm start`; it includes Socket.io.
- **`.env` is no longer tracked** (commit `2cec282`). It still exists in older git history, including the old Coolify Postgres password.
- `drizzle.config.ts` loads `.env.local` first, then `.env`.

## Migrations

- Production had been built with `db:push`, so Drizzle's migration history was empty. All migrations up to `0004_ad_analytics` were recorded as applied in Neon's `drizzle.__drizzle_migrations`, so `npm run db:migrate` works normally from here.
- **Run migrations against the direct (non-pooled) Neon host:** remove `-pooler` from the hostname. Restores and DDL can fail through the pooler.
- `0003` and `0004` have hand-written timestamps (`when: 1750…`) that are older than `0002`. They are already applied, so this is harmless, but generate future migrations with `npm run db:generate` rather than writing them by hand.

## Store owner earnings and payouts (Phase 1, added 2026-10-23)

- **Ledger:** `owner_earnings` has one row per advertiser payment at a location owned by a `store_owner`. Admin-owned locations earn nothing. `payouts` has one row per manual payment sent.
- **Rules:** the owner's share is the location's `share_rate_bps` (admin-set; default 25%), taken **after processor fees**. The rate is locked at payment time.
- **Pricing:** each location's `price_per_week_cents` is what Stripe and PayPal charge. Only admins can change price, share or `equipment_provided` (now informational only). The locations API strips those fields for store owners. Limits are $10–$1,000 a week and 0–90% share (`src/types`).
- **Lifecycle:**
  - **pending:** created when the payment is recorded
  - **available date:** set to the run's end when the ad is approved
  - **available:** set by the daily `POST /api/cron/expire-ads` job once the run ends, which also fetches the Stripe fee
  - **paid:** set when an admin clicks Mark paid on `/dashboard/admin/payouts`
  - **void:** set on refund
- **Payouts:** monthly, minimum $25 (`MIN_PAYOUT_CENTS` in `src/types`), by Zelle or check only. No bank details are stored. Owners enter their payout details on their Earnings page.
- **Code:** `src/lib/earnings.ts`. Hooks are in the Stripe webhook and confirm routes, PayPal capture, both approve paths, and `src/lib/refund.ts`.
- **Requires** the Coolify scheduled task that calls the cron endpoint daily. Without it, earnings never leave *pending*.
- **Phase 2 (agreed 2026-10-24, awaiting partner review, not built):** Stripe Connect Express, with transfers from the same ledger. The plan is summarised for partners on `/dashboard/admin/payouts` (`DirectDepositPlanNotes` in `PayoutsClient.tsx`; remove or update it once Phase 2 ships).
  - **Payout method:** direct deposit is the standard. Zelle or check only as an admin-approved exception per owner.
  - **Schedule:** automatic on the 15th of each month (once per owner per month; idempotent), plus an admin "Run direct deposits now" button and a summary email to admins.
  - **Fees:** AdsEZ absorbs Stripe Connect fees. Owners receive exactly their available balance.
  - **Funding:** PayPal-funded earnings are paid from the Stripe balance too. If the balance is short, the rest wait until next month.
  - **Taxes:** no payroll, and owners handle their own taxes. Turn on Stripe 1099 tax reporting for connected accounts (confirm with an accountant).
  - **Stripe setup needed first (test mode):** enable Connect (Express) with the platform profile, 1099 reporting, and a Connect webhook at `/api/payments/stripe/connect-webhook` for `account.updated`, with its secret in `STRIPE_CONNECT_WEBHOOK_SECRET`.
  - **Agreement:** update sections 6.4 (direct deposit through Stripe) and 6.6 (owner handles taxes; AdsEZ issues forms through its payment provider) in the sublease agreement doc.

## In-app notifications (bell), added 2026-10-23

- **Separate Socket.io namespace `/notifications`** in `server.ts`:
  - It has its own login check, which reads the better-auth session cookie when a user connects.
  - Each user is placed in their own room, `user:<id>`, chosen by the server.
  - The default namespace (`display:<slug>` and `dashboard` rooms, with the `ads:refresh` and `ad:status_changed` events) is unchanged and still needs no login. Display screens never connect to `/notifications`.
- **The database is the source of truth:** `notifications` rows use `channel = 'socket'`, with `read_at` and `link`. The bell refetches `GET /api/notifications` on every connect or reconnect and when the browser tab regains focus. The socket `notification:new` event is only a nudge.
- **Sending:** `notifyUser()` and the event helpers in `src/lib/notifications.ts`. They never throw.
- **Hooked into:** payments (advertiser, reviewers, store owner), approve, deny, admin cancel, the cron job (expiring within 24h, expired), earnings release, and payouts.
- **UI:** `src/components/layout/NotificationBell.tsx`, in the dashboard sidebar, the dashboard mobile header, and the public navbar when logged in.
- **Limit:** pushes reach only users connected to this one server process. Running several app instances later would need the Socket.io Redis adapter.

## Admin-created accounts and temporary passwords

- **What admins do:** on the Users tab, **Add user** creates an account with any role. **Reset password** issues a new temporary password. Both show the password once (format `Word-Word-Word-NN`). It expires after 7 days (`TEMP_PASSWORD_DAYS`).
- **Account state:** admin-created accounts are email-confirmed, with `users.must_change_password = true`. `requireAuth()` redirects flagged users to `/set-password`. Only `POST /api/user/set-password` opts out (`allowTempPassword`).
- **Expiry:** an expired temporary password is refused at sign-in in the auth `session.create.before` hook, with a 403 message the login page shows.
- **Welcome email:** optional `sendAccountCreatedEmail`. It never includes the password.
- **Code:** `src/lib/temp-password.ts`, which hashes with better-auth's own hasher and writes the `credential` account.

## "Advertise here" slide on display screens

- **Built-in slide:** `AdvertiseHereSlide` in `display/[slug]/page.tsx`, a built-in slide (not an ad record). It appears after every N paid ads, once per loop when a store has fewer than N, and alone when a store has none. It's never counted as an ad view.
- **Settings:** stored in `app_settings`, key `advertise_slide` (enabled, headline, sub-line with `{store}`, every N). They're edited on the Admin Panel's Overview tab, and saving refreshes all screens. The display feed returns them as `advertiseSlide`.
- **QR code:** opens `/ads/new?location=<slug>&src=screen`. Post a New Ad pre-selects the store through `GET /api/locations?slug=`.
- **Return trip after login or sign-up:**
  - The middleware keeps the query string in `callbackUrl`.
  - Login and register read it with `useNextParam()` and pass it to sign-in, Google sign-in, the verification email (`callbackURL`) and the links between the two pages.
  - `safeNext()` allows same-site paths only.
- **Later (option 2):** custom house ads (admin-made, no payment, chosen stores).

## Display screens (2026-10-24)

- **Layouts:**
  - Portrait phones (`usePortraitPhone`, ≤820px) stack the image on top, with the text and QR below.
  - Short landscape (`useShortLandscape`, height ≤560px) is compacted.
  - TVs and computers are unchanged.
  - The root uses `100dvh` with a `100vh` fallback (`.cb-display-root` in `globals.css`).
- **Motion** (CSS in `globals.css`, all off for `prefers-reduced-motion`):
  - Slow zoom on photos (`cb-kenburns`, gentler `cb-kenburns-soft` for image-only ads).
  - Title words reveal one by one (`cb-word`, 180ms apart) and then pop (`cb-pop`), with a coral bar (`cb-underline`); the rest of the text rises after (`cb-rise`).
  - Triggered by the selected slide, starting `REVEAL_START_MS` (280ms) into the glide.
- **`?ad=<id>`** opens the screen on that ad (used by "View Live Display" links and the approval email).
- **iPhone has no page fullscreen:** a "Full screen tip" explains Add to Home Screen instead. The display layout and `public/display.webmanifest` open it standalone.
- **Tap/hover controls:** Home, Fullscreen, ♡ Save and Share for the ad on screen. Store TVs never show them.
- **Offline:** screens keep the current ads and retry silently; a never-loaded screen shows "Connecting…".

## Sharing and deploys

- **`ShareButton`** (`src/components/ui`): native share sheet, or a menu (copy link, Facebook, X, WhatsApp, email). It's on the public ad page, the advertiser's live ad page and the display controls. The public ad page has Open Graph and Twitter preview tags using the ad image. If WhatsApp previews lack the image (WebP), add a JPEG preview image.
- **Zero-downtime deploys:** Coolify health check on `GET /api/health` (public; checks the DB within 4s). Without it, Traefik shows "no available server" during deploys.

## Store partner applications (2026-10-25)

- **How people apply:**
  - The register page's "I own or manage a store" checkbox reveals store fields (`StorePartnerFields`, schema in `src/lib/partner-application-schema.ts`). After `signUp`, the form posts to public `POST /api/partners/apply-signup`, which only accepts unconfirmed accounts created in the last 30 minutes.
  - Signed-in users (including Google sign-ups) apply at `/partners/apply` (`POST /api/partners/apply`).
- **Table:** `partner_applications` (migration 0011), with the address as free text. Status: pending → approved / declined. One pending application per user.
- **Admin page:** `/dashboard/admin/applications`, via `PATCH /api/admin/applications/[id]` with `{action: approve | decline | agreement}`.
  - **Approve:** role `user` becomes `store_owner`, and `users.partner_agreement_status` is set to `not_sent`.
  - **Set up location:** opens `/dashboard/store-owner/locations/new?application=<id>`, pre-filled, and `POST /api/locations` with `applicationId` creates the store under the applicant's account.
  - **Notifications:** bell and email to admins on a new application, and to the applicant on approve or decline.
- **Agreement:** `users.partner_agreement_status` is `not_sent`, `sent` or `signed`; `null` means not tracked (older partners). Manual payouts are refused until it's `signed`, and the Payouts page shows a notice. Signing itself happens outside the app for now.
- **Applicant status:** shown on My Ads and on `/partners/apply`.

## Saved ads (wishlist hearts)

- **Table:** `saved_ads` has primary key (`user_id`, `ad_id`), cascading on user and ad delete, and an index on `ad_id` for per-ad counts (migration 0010).
- **API:** `GET`/`POST`/`DELETE /api/saved`, signed-in users only (401 in the route; the middleware also requires a session).
- **UI:**
  - `HeartButton` (`src/components/ui`): `overlay` variant on Live Ads cards, `pill` variant on the public ad page. Signed-out visitors go to login and are returned to the page.
  - Shared client store in `src/lib/use-saved-ads.ts`, with one fetch per page and optimistic updates.
  - `/dashboard/saved` lists saved ads; "Saved" is in the dashboard menu.
  - Advertisers see a **Saves** count on the ad page's Performance card and in My Ads.

## Ad analytics definitions

- **Screen views** (`ads.view_count`): one each time a display screen actually shows the ad.
  - Sent by `display/[slug]` on each carousel `select`, plus once at load. Data refreshes never re-count.
  - Recorded by public `POST /api/ads/[id]/track` with `{event:"view", location:<slug>}`. It only counts approved, currently running ads booked at that store.
  - Repeats from the same IP within 5 seconds are ignored (in-memory, per server process).
  - Dashboard page opens no longer count.
- **Website visits** (`ads.website_click_count`): QR scans via `/go/[id]` plus website-link clicks on the public ad page (track route, `website_click`), both through `recordWebsiteVisit()` in `src/lib/click-tracking.ts`.
  - Counted once per IP per ad per minute (shared between both paths).
  - Bots and link-preview fetchers are skipped by user-agent.
  - Visitors are always redirected, whether or not the visit is counted.
  - The owner's own dashboard link isn't tracked, and the old `/api/ads/[id]/visit-website` route was removed.
- **Reset:** view counts and website visits were inflated before these fixes and were reset to 0 at deploy.

## To do

- [ ] **About 1 week after 2026-10-23:** if Neon is stable, delete the old Postgres resource in Coolify (`postgresql-database-gt2gswqg8jmybj5l2ydntnfg`). Until then, don't reuse its password; it's in git history.
- [ ] If a separate Socket.io service still exists in the Coolify project, stop and remove it.
- [ ] Check that every variable in `.env.local` also exists in Coolify's environment variables (reCAPTCHA, cron secret, R2, email).
- [ ] Optional: turn on **Auto Deploy** in Coolify (needs the GitHub App source or a webhook).
- [ ] Put the Coolify dashboard behind a domain with HTTPS. It's currently plain HTTP on `:8000`.
- [ ] `npm audit` reports 39 vulnerabilities (3 critical). Review with `npm audit` before running `npm audit fix`.
- [ ] Remote has a stray `master` branch alongside `main`. Delete it if it isn't intentional.
- [ ] Local `git stash@{0}` holds only lockfile `"peer": true` noise and can be dropped (`git stash drop`).
- [ ] **Sales team role, later:** add a `sales` value to the `user_role` enum (migration), decide what sales staff can see and do, and add it to `ROLE_OPTIONS` in `UserCredentials.tsx` and the role menus.
- [ ] **Home page stats, later:** the bar under the hero shows launch highlights (`HIGHLIGHTS` in `LandingPage.tsx`) instead of the old made-up figures. When the numbers are worth showing, add live stats (stores, cities, ads run) that switch on automatically above a chosen threshold, for example 25+ stores.

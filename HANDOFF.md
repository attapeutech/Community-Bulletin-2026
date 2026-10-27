# Handoff: 2026-10-22 (updated 2026-10-26)

## Where things stand

- **Branch:** `claude/ad-submission-payment-x36DJ` was synced with origin, `main` was merged into it, and it was then merged into `main` via PR. `main` now holds everything.
- **Production:** deployed from `main` in Coolify (manual **Redeploy**; auto-deploy is not on). The deploy succeeded, and login and ad renewals work.
  - On 2026-10-27 a Redeploy kept serving an older build until the app's **Git Source** settings were saved again (Branch `main`, Commit SHA `HEAD`) and it was redeployed. If a deploy doesn't show a merged change, check those two fields and the commit line in the deployment log.
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
- **PayPal is off** (2026-10-26) unless `NEXT_PUBLIC_PAYPAL_ENABLED=true` (`src/lib/payment-options.ts`). While it's off, checkout shows card only, `create-order` refuses, and the Help and home page text drops PayPal. Refunds of older PayPal payments still work. Turning it on needs a redeploy (build-time variable), plus `PAYPAL_MODE=live` and live credentials.

## Migrations

- Production had been built with `db:push`, so Drizzle's migration history was empty. All migrations up to `0004_ad_analytics` were recorded as applied in Neon's `drizzle.__drizzle_migrations`, so `npm run db:migrate` works normally from here.
- **Run migrations against the direct (non-pooled) Neon host:** remove `-pooler` from the hostname. Restores and DDL can fail through the pooler.
- `0003` and `0004` have hand-written timestamps (`when: 1750…`) that are older than `0002`. They are already applied, so this is harmless, but generate future migrations with `npm run db:generate` rather than writing them by hand.
- **Applied to Neon through `0014`:**
  - `0012_location_traffic`: `locations.daily_customers` and `traffic_updated_at`
  - `0013_screen_devices`
  - `0014_direct_deposits`

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
- **Phase 2 (direct deposits)** is built; see the next section.

## Direct deposits (Phase 2, built 2026-10-26, off in production)

- **On/off switch:** `STRIPE_CONNECT_ENABLED=true`. It's set only in local `.env.local`, not in Coolify, so live owners see nothing yet. Production also runs on Stripe **test** keys, which is why the switch exists.
- **Stripe account:** **Bulletin Board** (`acct_1QVftJIAfIVqJj1P`), the account customers pay through.
  - Connect is set up in **test mode**: platform; "buyers purchase from you"; payouts split between sellers; Stripe-hosted onboarding; Express Dashboard.
  - A second, unused account (`acct_1UUztilbfkCF3OIq`) was created by mistake and can be closed.
- **Owner setup** (`/dashboard/store-owner/earnings`, `DirectDepositCard`):
  - `POST /api/stripe/connect/onboard` creates the Express account once (`users.stripe_account_id`) and returns a Stripe onboarding link.
  - Returning to the Earnings page re-checks the account with Stripe (`syncConnectAccount`), as does the Connect webhook.
  - `POST /api/stripe/connect/dashboard` returns an Express Dashboard login link.
- **Status fields:** `users.stripe_details_submitted` and `stripe_payouts_enabled` give the status: not set up, incomplete or active. `manual_payout_allowed` is the admin-approved Zelle/check exception.
- **Payout run** (`runDirectDeposits` in `src/lib/direct-deposits.ts`) pays each eligible owner's full available balance by Stripe **transfer**.
  - **Skipped:** exception owners; owners not set up or incomplete; unsigned agreements; owners already paid this month; balances under $25; and anyone whose payout exceeds the Stripe available balance.
- **Never paying twice:**
  - a unique index on `payouts` (`owner_id`, `period`, e.g. `2026-11`, Pacific time)
  - a transfer group plus idempotency key `dd_<ownerId>_<period>`
  - a check for an existing transfer in that group before sending
  - everything happens inside a DB transaction that locks the earnings rows
- **Payout records:** method `stripe`, with the transfer id in `payouts.reference` and `created_by` null for automatic runs.
- **Schedule:** the daily `POST /api/cron/expire-ads` job calls the run when it's day 15 or later (Pacific). Each owner is paid once a month, a missed day catches up, and there's no extra Coolify task.
- **Admin run:** `POST /api/admin/direct-deposits/run`, the "Run direct deposits now" button.
- **Saved and sent:** the last run is saved in `app_settings` (`direct_deposit_last_run`), and admins get a summary email when anything was paid or failed.
- **Admin Payouts page:** shows each owner's direct deposit status and the exception toggle (`PATCH /api/admin/direct-deposits/owner/[id]`). Mark paid is hidden for owners on direct deposit, and the payouts API refuses it.
- **Connect webhook:** `POST /api/payments/stripe/connect-webhook` (`account.updated`) needs `STRIPE_CONNECT_WEBHOOK_SECRET`.
- **Middleware fix:** both Stripe webhooks are now public (they check signatures). The payment webhook was previously redirected to `/login`, so payments were only recorded by the browser-side confirm call.
- **Test data left on purpose:**
  - owner `dd-test-owner@example.com` (password not recorded here; reset it from the Admin Panel if needed), with an inactive "DD Test Store (ignore)"
  - $38.69 in earnings, paid by test transfer `tr_1UV0jg…`
  - Stripe test account `acct_1UV0boIYAyzHtHLa`
- **Test values for Express onboarding:**
  - SMS code `000000`
  - date of birth `01/01/1901`
  - address line `address_full_match`
  - SSN `000-00-0000`
  - routing `110000000`, account `000123456789` (or the "Test (Non-OAuth)" bank)
- **Stripe costs (confirm):** about $2 per paid owner per month, plus 0.25% + 25¢ per payout, absorbed by us.

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

- **Built-in slide:** `AdvertiseHereSlide` (now shared, in `src/components/display/AdvertiseHereSlide.tsx`, with the motion helpers and layout hooks), a built-in slide (not an ad record). It appears after every N paid ads, once per loop when a store has fewer than N, and alone when a store has none. It's never counted as an ad view.
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
- **Auto-reload after deploys:** `/api/display/[slug]` returns `version`, set per server process (`globalThis.__cbServerVersion`). Screens reload once when it changes. The carousel also resets to the first slide if its current slide disappears.
- **Store traffic:** `locations.daily_customers` is admin-set in Edit Location and dated automatically (`traffic_updated_at`). It's shown as "~500 shoppers a day" on that store's Advertise slide only (not on `/display/all`), in Post an Ad together with the cost per 1,000 shoppers (`src/lib/traffic.ts`), and on the location page.

## All-locations screen and Live Ads (2026-10-25)

- **`/display/all`:** the reserved slug `all` in the display API returns every live ad from active stores, plus "From $<lowest price>". It uses generic copy, doesn't count views, and its QR code goes to `/ads/new` with no store chosen.
- **Instant updates:** `notifyDisplayScreen()` also pushes `ads:refresh` to the `display:all` room.
- **Live Ads:** with no ads live anywhere (and no search), `/live-ads` opens `/display/all` full screen in an iframe with a Close button (`AdvertiseFullscreen`). A search with no results shows a "Your ad could be here / Post an Ad" card instead.

## Remote screen setup (2026-10-26)

- **Check-ins:** every display page (including the iframe inside Live Ads) keeps a random device id in localStorage (`src/lib/screen-device.ts`). It checks in about once a minute through public `POST /api/display/screen/checkin`, which records it in `screen_devices` and ignores bots, including headless browsers.
- **Admin page:** **Admin → Screens** (`/dashboard/admin/screens`) lists screens with online status, uptime, check-ins, device and IP. Assign a location and label with `PATCH /api/admin/screens/[id]`.
- **Switching:** the screen switches to `/display/<slug>` (the whole tab, even from inside the iframe) at its next check-in. It remembers the slug, so `/live-ads` jumps straight there after a reboot.
- **Clean-up:** unassigned devices not seen for 30 days are deleted when the Screens page loads.
- **Fast Eddies TV:** assigned this way on 2026-10-26 (IP 174.61.164.96, label "Fast Eddies TV"), after it had been set up pointing at `/live-ads`.

## Locations (2026-10-25)

- **Edit Location:** has Country, State, City and ZIP dropdowns. The PATCH accepts all four together and checks that the ZIP belongs to the city, the city to the state, and the state to the country.
- **Admin Danger zone:**
  - **Deactivate / Reactivate.** Admins still see inactive stores on All Locations, labeled Inactive.
  - **Delete** (`DELETE /api/locations/[id]`, admin only, type the store name to confirm). It's refused when the location has payments or owner earnings; otherwise it removes the location and its unpaid draft ads.

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

- [ ] **Direct deposits go-live:**
  1. Partner sign-off.
  2. Finish Stripe's live-mode steps (activate account, verify ID, branding, 1099 reporting).
  3. Add a Connect webhook (`account.updated`, "events on Connected accounts") at `https://communitybulletin.com/api/payments/stripe/connect-webhook`, and put its secret in Coolify as `STRIPE_CONNECT_WEBHOOK_SECRET`.
  4. Switch the live site to Stripe live keys.
  5. Update agreement sections 6.4 and 6.6.
  6. Set `STRIPE_CONNECT_ENABLED=true` in Coolify.
  7. Delete the direct-deposit test owner and their data.
- [ ] Check that `STRIPE_WEBHOOK_SECRET` in Coolify matches the payment webhook endpoint in Stripe. Stripe can reach the webhook now.
- [ ] Optional: hide the clock on display screens while the tap/hover controls are showing (they overlap on desktop).

- [ ] **About 1 week after 2026-10-23:** if Neon is stable, delete the old Postgres resource in Coolify (`postgresql-database-gt2gswqg8jmybj5l2ydntnfg`). Until then, don't reuse its password; it's in git history.
- [ ] If a separate Socket.io service still exists in the Coolify project, stop and remove it.
- [ ] Check that every variable in `.env.local` also exists in Coolify's environment variables (reCAPTCHA, cron secret, R2, email).
- [ ] Optional: turn on **Auto Deploy** in Coolify (needs the GitHub App source or a webhook).
- [ ] Put the Coolify dashboard behind a domain with HTTPS. It's currently plain HTTP on `:8000`.
- [ ] `npm audit` reports 39 vulnerabilities (3 critical). Review with `npm audit` before running `npm audit fix`.
- [ ] Local `git stash@{0}` holds only lockfile `"peer": true` noise and can be dropped (`git stash drop`).
- [ ] **Sales team role, later:** add a `sales` value to the `user_role` enum (migration), decide what sales staff can see and do, and add it to `ROLE_OPTIONS` in `UserCredentials.tsx` and the role menus.
- [ ] **Home page stats, later:** the bar under the hero shows launch highlights (`HIGHLIGHTS` in `LandingPage.tsx`) instead of the old made-up figures. When the numbers are worth showing, add live stats (stores, cities, ads run) that switch on automatically above a chosen threshold, for example 25+ stores.

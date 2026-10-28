# Handoff: 2026-10-22 (updated 2026-10-28)

## Where things stand

- **Branch:** everything is merged into `main`. Work goes on a short-lived branch per change and is merged by PR; `gh` isn't installed locally, so PRs are opened from the GitHub link that `git push` prints.
- **Production:** deployed from `main` in Coolify (manual **Redeploy**; auto-deploy is not on). The deploy succeeded, and login and ad renewals work.
  - On 2026-10-27 a Redeploy kept serving an older build until the app's **Git Source** settings were saved again (Branch `main`, Commit SHA `HEAD`) and it was redeployed. If a deploy doesn't show a merged change, check those two fields and the commit line in the deployment log.
- **Database:** moved from the Coolify Postgres container to **Neon** (Postgres 18, `us-east-2`).
  - Data was copied with `pg_dump` / `pg_restore` (14 tables: users, ads, payments, sessions, locations, geography, etc.).
  - Coolify's `DATABASE_URL` now points to the Neon **pooled** connection string.
  - Verified after cutover: two ad renewals on 2026-10-23 were written to Neon (payments 55 → 57).
- **Socket.io:** runs inside the main Next.js server (`server.ts`, port 3000). No separate service is needed.

## 2026-10-28 summary

- **Stripe is live.** Coolify has the live `STRIPE_SECRET_KEY` and a live-mode `STRIPE_WEBHOOK_SECRET`. The account (**Bulletin Board**, `acct_1QVftJIAfIVqJj1P`) shows card payments as Active.
  - Its public business name is now **Community Bulletin** (it showed "ADS EZ").
  - Stripe's review was still in progress.
  - **Open task:** provide the tax ID (EIN), or Stripe pauses payouts to our bank on 2026-11-27 or after $600 in volume.
- **Live webhook events:** `checkout.session.completed` and `checkout.session.async_payment_succeeded`, sent to `/api/payments/stripe/webhook`.
- **Webhook fix:** the webhook now records a payment only when `payment_status` is `paid`. Bank payments offered through Link complete as "unpaid" and are recorded on `async_payment_succeeded`. Before this, it marked any completed checkout as paid.
- **First live test passed at Fast Eddies:**
  - a $10 real card payment, recorded once
  - Approve put the ad on the store TV
  - admin cancel refunded it (Stripe live refund `re_3UV…`) and removed it from the screen
  - no owner earnings were created (Fast Eddies is admin-owned)
  - the cancelled test ad "Test--please ignorer!!!" stays in the database as history
  - Fast Eddies was set back to $100
- **Pricing is $100 per 4 weeks** (28-day runs); see "4-week pricing" below.
- **Live Ads frame fix:**
  - the display screen's logo and Home links use `target="_top"`
  - `LeaveFrame` (`src/components/layout/LeaveFrame.tsx`, in the root layout) moves any non-display page out of a frame
  - before this, tapping Home inside the Live Ads full-screen view loaded the site inside the iframe, where Stripe checkout can't open
- **This computer** (the second dev machine) was synced to `main`. Its `.env.local` now uses `sslmode=verify-full`, but it still lacks the Google sign-in variables.

## 2026-10-28 (later): direct deposits are live

- **`STRIPE_CONNECT_ENABLED=true` and `STRIPE_CONNECT_WEBHOOK_SECRET` are set in Coolify** (live Connect webhook: `account.updated`, events on connected accounts, to `/api/payments/stripe/connect-webhook`). Store owners now see the Direct Deposit card on Earnings; admins see the Direct Deposits card on Payouts.
- **Stripe live Connect:** the platform profile is complete; branding is set (Community Bulletin, the CB icon from `src/app/icon.png`, navy `#1A3A5C`, coral `#E8563A`). The EIN is available.
- **The DD test owner was deleted** (`dd-test-owner@example.com`, their test store, 2 earnings rows and the test payout) by a one-off script, so no account holds a test-mode Stripe id.
- **First automatic run** (daily cron, 2026-10-28 8:00 AM): 0 paid, as expected: no owner has finished onboarding or has a signed agreement.
- **Agreement status on Payouts:** each owner row has Not sent / Sent / Signed buttons (`PATCH /api/admin/direct-deposits/owner/[id]` with `agreementStatus`). Owners set up from a Sales lead have no partner application, so before this their agreement could never be marked Signed and payouts stayed held.
- **Onboarding is real now:** Express onboarding asks for a real name, date of birth, SSN and bank. The test values further down only work in test mode.

## 2026-10-27 summary

- **Home page badge** now says "Now booking ad space" (was a hard-coded "Now live in 48 states").
- **Database SSL:** `DATABASE_URL` uses `sslmode=verify-full` (locally and in Coolify) instead of `require`, which silences the `pg` warning and keeps the strict check after future driver upgrades.
- **Sign in with Google** is live (section below).
- **`src/middleware.ts` is now `src/proxy.ts`** (Next.js 16 rename; same logic, exported function `proxy`).
- **Dark mode** is readable across the app: `:where(.dark)` rules and `--cb-*` variables in `globals.css` remap the hard-coded light colors. Anything that must stay white in dark mode (QR codes, the Live Ads dot) uses `dark:bg-white`.
- **Mobile:** the dashboard menu closes when a link is tapped; All Locations cards no longer squeeze on phones.
- **Admin → Screens:** the "Showing" path opens that display in a new tab.
- **Sales** page for the field sales process (section below), with migrations `0015` and `0016` applied to Neon.
- **Coolify:** all `.env.local` variables were checked against Coolify; the Git Source settings were re-saved (see Production above).

## 4-week pricing (2026-10-27)

- **Ads are priced per 4-week run and run 28 days** (`AD_DURATION_DAYS = 28` in `src/types`). This was briefly "per month / 30 days" earlier on 2026-10-27. The partner preferred 4 weeks, because "a month" varies in length and 13 runs a year earn about 7% more than 12.
- **The price field is now `pricePerRunCents`** (also `MIN_/MAX_PRICE_PER_RUN_CENTS`). The database column is still `price_per_week_cents`, so no migration was needed.
- **Copy:** says "per 4 weeks" / "4 weeks (28 days)" everywhere. Owner payouts stay **monthly** (on the 15th).
- **Cost per 1,000 shoppers** is worked out over 28 days. For Fast Eddies: $100 / (500 x 28) x 1,000 = $7.14.
- **Demo page projections** use 40 ads x $100 per 4 weeks, 13 runs a year and about 3% card fees: ~$2,100/mo average (~$25,200/yr) at a 50% share, ~$1,050/mo (~$12,600/yr) at 25%.
- **First live payment test passed on 2026-10-28:** a $10 card payment, then an admin cancel with automatic refund, at Fast Eddies. Afterwards, set the Fast Eddies price back to $100.

## Environment and config

- Local config is in **`.env.local`** (git-ignored). It points at the **production** Neon database (pooled), so admin actions taken locally change live data.
- In `.env.local`, `APP_URL`, `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` must be `http://localhost:3000`, or local login silently fails (the auth cookie lands on the production domain). Run locally with `npm start`; it includes Socket.io.
- **`.env` is no longer tracked** (commit `2cec282`). It still exists in older git history, including the old Coolify Postgres password.
- `drizzle.config.ts` loads `.env.local` first, then `.env`.
- **`DATABASE_URL`** ends with `?sslmode=verify-full&channel_binding=require` (locally and in Coolify).
- **Google sign-in:** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (a Coolify **build variable**) and `GOOGLE_CLIENT_SECRET`, in both `.env.local` and Coolify.
- **Stripe** runs on **live** keys in production (since 2026-10-28): `STRIPE_SECRET_KEY` (`sk_live_…`) and the live-mode `STRIPE_WEBHOOK_SECRET`. Checkout uses Stripe-hosted pages, so no publishable key is needed (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `APP_URL` in `.env.local` are unused). **Keep test keys in `.env.local`:** it points at the production database. With test keys, local scripts can't look up live payments.
- **PayPal is off** (2026-10-26) unless `NEXT_PUBLIC_PAYPAL_ENABLED=true` (`src/lib/payment-options.ts`). While it's off, checkout shows card only, `create-order` refuses, and the Help and home page text drops PayPal. Refunds of older PayPal payments still work. Turning it on needs a redeploy (build-time variable), plus `PAYPAL_MODE=live` and live credentials.

## Migrations

- Production had been built with `db:push`, so Drizzle's migration history was empty. All migrations up to `0004_ad_analytics` were recorded as applied in Neon's `drizzle.__drizzle_migrations`, so `npm run db:migrate` works normally from here.
- **Run migrations against the direct (non-pooled) Neon host:** remove `-pooler` from the hostname. Restores and DDL can fail through the pooler.
- `0003` and `0004` have hand-written timestamps (`when: 1750…`) that are older than `0002`. They are already applied, so this is harmless, but generate future migrations with `npm run db:generate` rather than writing them by hand.
- **Applied to Neon through `0016`** (17 rows in `drizzle.__drizzle_migrations`):
  - `0012_location_traffic`: `locations.daily_customers` and `traffic_updated_at`
  - `0013_screen_devices`
  - `0014_direct_deposits`
  - `0015_sales_leads` (leads, lead_notes, `lead_stage` enum, `lead_follow_up` notification type)
  - `0016_lead_locations` (`leads.location_id`)

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

## Direct deposits (Phase 2, built 2026-10-26, live since 2026-10-28)

- **On/off switch:** `STRIPE_CONNECT_ENABLED=true`, set in Coolify since 2026-10-28 (live keys, so onboarding and transfers are real).
- **Stripe account:** **Bulletin Board** (`acct_1QVftJIAfIVqJj1P`), the account customers pay through.
  - Connect is set up in **live and test mode** the same way: platform; "buyers purchase from you"; payouts split between sellers; Stripe-hosted onboarding; Express Dashboard.
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
- **Admin Payouts page:** shows each owner's direct deposit status, the exception toggle and the agreement buttons (`PATCH /api/admin/direct-deposits/owner/[id]`). Mark paid is hidden for owners on direct deposit, and the payouts API refuses it.
- **Connect webhook:** `POST /api/payments/stripe/connect-webhook` (`account.updated`) needs `STRIPE_CONNECT_WEBHOOK_SECRET`.
- **Middleware fix:** both Stripe webhooks are now public (they check signatures). The payment webhook was previously redirected to `/login`, so payments were only recorded by the browser-side confirm call.
- **Test data:** the test-mode owner, store, earnings and payout were deleted on 2026-10-28 (the Stripe test-mode account `acct_1UV0boIYAyzHtHLa` and transfer `tr_1UV0jg…` remain in Stripe's test mode only).
- **Test values for Express onboarding (test mode only):**
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

## Sign in with Google (2026-10-27)

- **On/off:** on when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (build variable) and `GOOGLE_CLIENT_SECRET` are set (`src/lib/google-auth.ts`, `socialProviders` in `src/lib/auth/index.ts`). Without them the "Continue with Google" buttons are hidden. Both are set in Coolify and `.env.local`.
- **Google Cloud:** OAuth client "Community Bulletin" (Web application) in the **laotech** project. Redirect URIs: `https://communitybulletin.com/api/auth/callback/google` and `http://localhost:3000/api/auth/callback/google`. The consent screen's Branding (app name, support email) and Audience (must be **In production**) are set there.
- **Accounts:** a Google sign-in with the same email as an existing account links to it (Google confirms the email). New Google users get role `user`; store owners apply at `/partners/apply`.
- **Errors** (e.g. suspended account) return to `/login?error=…`, which shows a message.

## Sales leads (2026-10-27)

- **Page:** **Sales** (`/dashboard/sales`), admin-only (the co-founder doing sales is an admin). A `sales` role can come later.
- **Process (two tabs):** 1 · **Stores**: sign up store owners to host a screen (`kind = store_partner`). 2 · **Advertisers**: sign up businesses near each store (`kind = advertiser`). **Goal: 40 live ads per store** (`ADS_PER_STORE_GOAL` in `src/lib/leads.ts`).
- **Tables** (migrations `0015_sales_leads`, `0016_lead_locations`): `leads` (kind, business, contact, phone, email, city, address, source, `stage`, `next_follow_up`, `lost_reason`, `location_id`, `owner_id`, linked customer `user_id`, `won_at`) and `lead_notes` (time-stamped history).
- **`location_id`:** for an advertiser lead, the store they'd advertise at; for a store lead, the location it became. **Set up this store** on a store lead opens the new-location form pre-filled from the lead (`?lead=<id>`); the store belongs to the lead's linked account (promoted to store owner, agreement `not_sent`), or to the admin if none is linked, and the lead is marked Won with a note.
- **Store goal cards** (Advertisers tab): per active store, ads live now (approved and inside their run dates) out of 40, plus paid ads awaiting review and open / interested advertiser leads. Clicking a card filters the leads to that store.
- **Stages:** new → contacted → interested → won / lost. Stage changes add an automatic note; Won sets `won_at`; Won/Lost clear the follow-up; Lost asks for a reason.
- **Follow-up dates** are calendar days in Pacific time (`src/lib/leads.ts`).
- **List:** counts (due today, overdue, interested, won in 30 days) double as filters; search, stage (default: open leads), follow-up window, city, owner, sort; 25 per page. Filters are in the URL. Quick actions: stage, follow-up tomorrow / +1 week / date. Tap to call or email.
- **Lead page:** details (edit), notes timeline, stage and follow-up, delete. **Link account** attaches the customer account (by email) and shows what it has paid: kept so sales credit or commission can be calculated later (payments from that account after `won_at`).
- **Reminder:** the daily cron (`notifyLeadFollowUps`) sends each owner one bell notification when they have follow-ups due today or overdue (split into stores and advertisers), at most once a day.
- **API:** `POST /api/admin/leads`, `PATCH`/`DELETE /api/admin/leads/[id]`, `POST /api/admin/leads/[id]/notes`.

## "Advertise here" slide on display screens

- **Built-in slide:** `AdvertiseHereSlide` (now shared, in `src/components/display/AdvertiseHereSlide.tsx`, with the motion helpers and layout hooks), a built-in slide (not an ad record). It appears after every N paid ads, once per loop when a store has fewer than N, and alone when a store has none. It's never counted as an ad view.
- **Settings:** stored in `app_settings`, key `advertise_slide` (enabled, headline, sub-line with `{store}`, every N). They're edited on the Admin Panel's Overview tab, and saving refreshes all screens. The display feed returns them as `advertiseSlide`.
- **QR code:** opens `/ads/new?location=<slug>&src=screen`. Post a New Ad pre-selects the store through `GET /api/locations?slug=`.
- **Return trip after login or sign-up:**
  - The proxy (`src/proxy.ts`, formerly `middleware.ts`) keeps the query string in `callbackUrl`.
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
- **API:** `GET`/`POST`/`DELETE /api/saved`, signed-in users only (401 in the route; the proxy also requires a session).
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

- [ ] **Stripe: enter the EIN** (Dashboard → Settings → Business → Account status → "Provide a tax ID for Bulletin Board"). If it's missing, payouts to our bank pause on 2026-11-27 or after $600 in volume.
- [ ] Watch for the email saying Stripe's account review is complete (it said 2–3 days on 2026-10-27).
- [ ] In Stripe → Webhooks (live), check that deliveries to `/api/payments/stripe/webhook` succeed. The test payment was recorded; confirm the webhook also returned 200, not only the browser confirm call.
- [ ] Optional: turn off Link's **Bank** and **Klarna** options in Stripe (Settings → Payment methods) to keep checkout to cards. Bank payments work, but the advertiser sees "payment not confirmed" until the payment clears.
- [ ] **Local checkouts:** local `.env.local` (test keys) points at the production database, so a local test checkout would create a fake "paid" ad and owner earnings in production. Avoid local test checkouts, or set up a Neon branch for local development.
- [ ] **Stripe: add the business bank account** (Home → Add bank), once the business partner provides it. Card revenue stays in the Stripe balance until then; direct deposits are paid from that balance, so they don't depend on it.
- [ ] **Direct deposits, remaining:**
  1. Partner sign-off on direct deposits and Stripe's costs.
  2. Update the store owner agreement, sections 6.4 and 6.6 (payouts by direct deposit through Stripe; owners handle their own taxes). The agreement lives outside the app.
  3. First real owner: they onboard from Earnings with their real details, an admin marks their agreement **Signed** on Payouts, and from the 15th their available balance (at least $25) is paid automatically.
  4. **1099 tax forms:** Stripe opens Connect → Tax forms only once there's a US connected account. After the first owner onboards and before January 2027, turn on 1099 reporting and pick the form type (MISC vs NEC: ask the accountant).
- [ ] Optional: hide the clock on display screens while the tap/hover controls are showing (they overlap on desktop).

- [ ] **About 1 week after 2026-10-23:** if Neon is stable, delete the old Postgres resource in Coolify (`postgresql-database-gt2gswqg8jmybj5l2ydntnfg`). Until then, don't reuse its password; it's in git history.
- [ ] If a separate Socket.io service still exists in the Coolify project, stop and remove it.
- [ ] Optional: turn on **Auto Deploy** in Coolify (needs the GitHub App source or a webhook).
- [ ] Put the Coolify dashboard behind a domain with HTTPS. It's currently plain HTTP on `:8000`.
- [ ] `npm audit` reports 39 vulnerabilities (3 critical). Review with `npm audit` before running `npm audit fix`.
- [ ] Local `git stash@{0}` holds only lockfile `"peer": true` noise and can be dropped (`git stash drop`).
- [ ] **Test data from 2026-10-27:** **Thai Grocery Tacoma #TGT-101** is an active location owned by `demonterock@gmail.com` (now a store owner), with a Won store lead in Sales. If it was only a test: deactivate or delete the location (Danger zone), set the account back to User, and delete the lead.
- [ ] Delete the leftover remote branch `feat/google-signin-and-proxy` (an early, broken version of PR #68).
- [ ] **Sales team role, later:** the Sales page is admin-only today (the co-founder doing sales is an admin). When a sales team joins: add `sales` to the `user_role` enum (migration), allow it on `/dashboard/sales` and `/api/admin/leads` (`requireRole("sales", "admin")`), add it to `ROLE_OPTIONS` in `UserCredentials.tsx` and the role menus, and decide whether sales staff see all leads or only their own. Store setup stays admin-only.
- [ ] **Sales, optional ideas:** create a store lead automatically when someone applies on the website (source "Website"); a clearer Delete lead button or bulk delete; a per-store goal instead of the fixed 40.
- [ ] **Home page stats, later:** the bar under the hero shows launch highlights (`HIGHLIGHTS` in `LandingPage.tsx`) instead of the old made-up figures. When the numbers are worth showing, add live stats (stores, cities, ads run) that switch on automatically above a chosen threshold, for example 25+ stores.

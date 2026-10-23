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
- **Rules:** the owner's share is 25%, or 50% if they provided the equipment, taken **after processor fees**. The rate is locked at payment time.
- **Lifecycle:**
  - **pending:** created when the payment is recorded
  - **available date:** set to the run's end when the ad is approved
  - **available:** set by the daily `POST /api/cron/expire-ads` job once the run ends, which also fetches the Stripe fee
  - **paid:** set when an admin clicks Mark paid on `/dashboard/admin/payouts`
  - **void:** set on refund
- **Payouts:** monthly, minimum $25 (`MIN_PAYOUT_CENTS` in `src/types`), by Zelle or check only. No bank details are stored. Owners enter their payout details on their Earnings page.
- **Code:** `src/lib/earnings.ts`. Hooks are in the Stripe webhook and confirm routes, PayPal capture, both approve paths, and `src/lib/refund.ts`.
- **Requires** the Coolify scheduled task that calls the cron endpoint daily. Without it, earnings never leave *pending*.
- **Phase 2 (later):** Stripe Connect Express, with transfers from the same ledger.

## To do

- [ ] **About 1 week after 2026-10-23:** if Neon is stable, delete the old Postgres resource in Coolify (`postgresql-database-gt2gswqg8jmybj5l2ydntnfg`). Until then, don't reuse its password; it's in git history.
- [ ] If a separate Socket.io service still exists in the Coolify project, stop and remove it.
- [ ] Check that every variable in `.env.local` also exists in Coolify's environment variables (reCAPTCHA, cron secret, R2, email).
- [ ] Optional: turn on **Auto Deploy** in Coolify (needs the GitHub App source or a webhook).
- [ ] Put the Coolify dashboard behind a domain with HTTPS. It's currently plain HTTP on `:8000`.
- [ ] `npm audit` reports 39 vulnerabilities (3 critical). Review with `npm audit` before running `npm audit fix`.
- [ ] Remote has a stray `master` branch alongside `main`. Delete it if it isn't intentional.
- [ ] Local `git stash@{0}` holds only lockfile `"peer": true` noise and can be dropped (`git stash drop`).

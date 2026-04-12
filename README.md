# AdBoard — Digital In-Store Billboard Platform

Full-stack Next.js platform for posting and displaying digital ads at store locations.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS, shadcn/ui |
| Auth | better-auth (email/password, 2FA, email verify) |
| Database | PostgreSQL + Drizzle ORM |
| File Storage | Cloudflare R2 + CDN |
| Email | Resend |
| Payments | Stripe + PayPal |
| Real-time | Socket.io |
| Hosting | Hostinger VPS + Coolify + Nginx |

---

## Local Development Setup

### 1. Clone and install

```bash
git clone <repo>
cd adboard
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
# Fill in all values in .env
```

### 3. Database

Start a local Postgres instance (or use your VPS):

```bash
# Generate migrations from schema
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed reference data + admin/approver users
npm run db:seed
```

### 4. Run dev servers

In two terminals:

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — Socket.io server
npm run socket
```

Open [http://localhost:3000](http://localhost:3000).

---

## Default Seed Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@adboard.com | Admin@123! |
| Approver | approver@adboard.com | Approver@123! |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── auth/           # better-auth handler
│   │   ├── ads/            # Ad CRUD + approval
│   │   ├── locations/      # Location listing
│   │   ├── payments/       # Stripe + PayPal
│   │   ├── upload/         # R2 presigned URLs
│   │   └── webhooks/       # Stripe + PayPal webhooks
│   ├── (auth)/             # Login, register, forgot-password
│   ├── dashboard/          # Role-based dashboards
│   └── display/[slug]/     # Public display screen
├── components/             # Shared React components
├── lib/
│   ├── auth/               # better-auth server + client + session helpers
│   ├── db/
│   │   ├── schema/         # All Drizzle table definitions
│   │   ├── migrations/     # Generated SQL migrations
│   │   └── client.ts       # DB connection
│   ├── email/              # Resend mailer + templates
│   ├── storage/            # Cloudflare R2 client
│   ├── payments/           # Stripe + PayPal helpers
│   └── socket/             # Socket.io server + client hooks
├── types/                  # Shared TypeScript types
└── middleware.ts            # Route protection
scripts/
└── seed.ts                 # DB seed script
```

---

## Deployment (Coolify on Hostinger VPS)

1. Push repo to GitHub
2. In Coolify: New Application → GitHub repo → Next.js preset
3. Add all `.env` values in Coolify's environment secrets
4. Add a second service for the Socket.io server (`npm run socket`)
5. Configure Nginx reverse proxy:
   - `yourdomain.com` → Next.js (port 3000)
   - `socket.yourdomain.com` → Socket.io (port 3001)
6. Enable SSL via Let's Encrypt in Coolify

---

## Phases

- [x] **Phase 1** — Schema, auth, email, storage, socket foundation
- [ ] **Phase 2** — Ad submission flow, Stripe/PayPal, approval engine
- [ ] **Phase 3** — Display screen carousel with Socket.io live refresh
- [ ] **Phase 4** — Dashboards (admin, approver, store owner, user)
- [ ] **Phase 5** — Deploy, Nginx, SSL hardening

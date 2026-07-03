# SmartRent

SmartRent is an MVP rental-management monorepo. The frontend is a UI shell only; validation, auth workflows, business rules, and database access are handled by Spring services behind the gateway.

- `apps/web`: Next.js 15 dashboard UI
- `services/gateway`: Spring Cloud Gateway entrypoint, JWT validation, routing
- `services/core-service`: auth endpoints, profiles, properties, units, tenants, leases
- `services/billing-service`: invoices, UPI QR payments, overdue jobs
- `services/ops-service`: maintenance tickets, notifications, reports
- `supabase/migrations`: hosted Supabase PostgreSQL schema and RLS

## Local URLs

| App | URL |
| --- | --- |
| Next.js web | <http://localhost:3000> |
| API gateway | <http://localhost:8080> |
| Core service | <http://localhost:8081> |
| Billing service | <http://localhost:8082> |
| Ops service | <http://localhost:8083> |

## First-Time Setup

1. Copy `.env.example` to `.env` and fill private values locally.
2. Copy `apps/web/.env.local.example` to `apps/web/.env.local`.
3. Apply Supabase SQL from `supabase/migrations/0001_initial_schema.sql`.
4. Install frontend dependencies from `apps/web`.
5. Start backend services with Docker Compose.

More detail is in `docs/SETUP.md`.

## Commands

```powershell
# frontend
cd D:\Dev\Projects\smartrent\apps\web
pnpm install
pnpm dev

# backend containers
cd D:\Dev\Projects\smartrent
docker compose up --build
```

## Security Notes

Do not commit `.env`, service role keys, database passwords, or SMTP credentials.
The Supabase database password was shared during planning, so rotate it before public deployment.

## Architecture Rule

The browser must not talk to Supabase PostgreSQL directly. UI calls go to the gateway, and Spring services perform validation plus Supabase Auth/PostgreSQL interactions.

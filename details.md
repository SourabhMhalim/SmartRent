# SmartRent Details

This file is for learning notes, setup decisions, and safe environment guidance.
Do not store real secrets here.

## Important Security Note

Real Supabase keys, service role keys, database passwords, SMTP passwords, and deployment secrets must stay only in local `.env` files or deployment dashboards.

If a real secret was written into this repository before, rotate it before using the project seriously.

## Current Direction

We are restarting SmartRent from zero, slowly.

The goal is not to generate a complete application in one pass. The goal is to learn each layer and build one small working feature at a time.

## Product Idea

SmartRent is a rental management application for landlords.

The first version should help a landlord:

- add a property
- add rooms or units
- add tenants
- create a lease
- enter monthly electricity meter readings
- generate rent bills
- show a UPI payment link or QR
- manually mark a bill as paid

Tenant login, notifications, reports, mobile apps, and production deployment are later phases.

## Learning-First Stack

We will keep the original stack, but introduce it slowly.

| Layer | Technology | When We Learn It |
| --- | --- | --- |
| Frontend | Next.js, TypeScript, Tailwind | after the backend data model is understood |
| Backend | Java 21, Spring Boot 3 | first |
| Database | PostgreSQL / Supabase | first |
| Auth | Supabase Auth / JWT | after basic CRUD |
| Payments | UPI link / QR only | after invoices work |
| PDF | OpenPDF | after invoice data is correct |
| Deployment | Vercel + backend host | last |

## Safe Environment Template

## Supabase Project Values

These values are safe to keep in documentation because they identify the project but do not grant admin access by themselves.

```env
SUPABASE_PROJECT_ID=szyzeroacnensxqnpgsw
SUPABASE_REGION=ap-southeast-1
SUPABASE_URL=https://szyzeroacnensxqnpgsw.supabase.co
SUPABASE_JWKS_URL=https://szyzeroacnensxqnpgsw.supabase.co/auth/v1/.well-known/jwks.json
```

The publishable/anon key can be used by public clients, but we will still keep it in `.env` while learning so the setup habit stays clean.

Never write these real values in this file:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SPRING_DATASOURCE_PASSWORD`
- `DATABASE_URL` when it contains a password
- production deployment secrets

Create a local `.env` file when the project is ready for backend setup.

```env
# Supabase
SUPABASE_URL=https://szyzeroacnensxqnpgsw.supabase.co
SUPABASE_PROJECT_ID=szyzeroacnensxqnpgsw
SUPABASE_JWKS_URL=https://szyzeroacnensxqnpgsw.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# PostgreSQL
SPRING_DATASOURCE_URL=
SPRING_DATASOURCE_USERNAME=
SPRING_DATASOURCE_PASSWORD=
DATABASE_URL=

# Application
NEXT_PUBLIC_API_URL=http://localhost:8080
```

For the frontend, create `apps/web/.env.local` only when the frontend exists.

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Do not add `NEXT_PUBLIC_SUPABASE_*` variables unless we intentionally decide that the browser should talk to Supabase. For the current learning plan, the frontend should call our backend API.

## Local Tools To Check

Before coding, verify these tools one by one:

```powershell
java -version
mvn -version
node -v
pnpm -v
git --version
docker --version
```

## Architecture Decision For The Restart

Start simple:

```text
Browser -> Spring Boot API -> PostgreSQL/Supabase
```

Later, if the project grows, we can split into:

```text
Browser -> API Gateway -> Core/Billing/Ops Services -> PostgreSQL/Supabase
```

For learning, one backend service is better. It makes the database, API, validation, and business rules easier to understand.

## First MVP Boundary

Included:

- landlord-only login
- properties
- units
- tenants
- leases
- meter readings
- invoices
- manual payments
- UPI payment link

Not included yet:

- tenant portal
- WhatsApp/SMS
- PDF invoices
- dashboards and charts
- property manager role
- mobile app
- production deployment

## Personal Learning Rule

For each feature:

1. Understand the business rule.
2. Draw the database table.
3. Write the backend API.
4. Test the API manually.
5. Build the frontend screen.
6. Review what was learned.
7. Commit only when it works.

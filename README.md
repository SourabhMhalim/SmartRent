# SmartRent

SmartRent is a landlord and tenant rent-management workspace backed by a
Spring Boot API, Supabase PostgreSQL/Auth, and a Next.js web app.

The repository also contains Sourabh Mhalim's portfolio. In production, the
single domain is routed as follows:

- `https://sourabhmhalim.in/` serves `apps/portfolio`.
- `https://sourabhmhalim.in/app/smartrent` serves `apps/web`.
- `https://sourabhmhalim.in/app/smartrent/api/*` proxies to the Spring Boot API.

Nginx is the public entry point. The portfolio listens on `127.0.0.1:3001`,
SmartRent listens on `127.0.0.1:3000`, and the API listens on
`127.0.0.1:8080`. Production service configuration and secrets live on the
server; local deployment credentials and scratch files under `tmp/` are ignored.

## Local services

Run the API from `api/`:

```powershell
mvn spring-boot:run
```

Run the web app from `apps/web/`:

```powershell
.\node_modules\.bin\next.cmd dev
```

Run the portfolio from `apps/portfolio/`:

```powershell
corepack pnpm install
corepack pnpm dev
```

Local SmartRent development remains at `/`. A production build automatically
uses `/app/smartrent` as its base path and same-origin API prefix.

Health check:

```powershell
Invoke-RestMethod http://localhost:8080/api/health
```

## Branch and release workflow

```text
feature/fix branch -> pull request to develop -> CI -> merge
develop -> pull request to main -> CI -> merge -> production deployment
```

`develop` is the integration branch and `main` is production. CI validates the
Spring Boot API, SmartRent web app, and portfolio. Production deployment runs
only after CI succeeds for a commit on `main`.

Required GitHub Actions secrets:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_PATH`
- `DEPLOY_SSH_KEY`
- `DEPLOY_KNOWN_HOSTS`

The deployment SSH key is dedicated to GitHub Actions. Do not reuse a personal
SSH key or keep a plaintext copy inside the repository workspace.

Application and database secrets are not GitHub build secrets. They remain in
the production server's `/opt/smartrent/.env`, readable only by the service user.

## PWA installation

- Android Chrome: open SmartRent and choose **Install app**.
- iPhone/iPad: open SmartRent in Safari, tap **Share**, then **Add to Home Screen**.

The PWA uses the same SmartRent account and data as the website.

## Important local workflow note

Stop `next dev` before running `next build`. In this workspace, running a
production build while the dev server is still using `.next` can poison the dev
cache and cause transient React Server Components manifest errors. Safe order:

1. Stop the web dev server.
2. Run `.\node_modules\.bin\next.cmd build`.
3. Delete `apps/web/.next` if you are returning to dev mode.
4. Start `next dev` again.

## Test accounts

Use temporary local/demo accounts only. Do not commit passwords to code,
documentation, screenshots, or issue trackers. Rotate these accounts before any
public demo or deployment.

## Payment flow checklist

1. Landlord logs in.
2. Landlord creates or reviews property/unit/tenant/lease data.
3. Landlord generates an invoice.
4. Tenant activates/logs in.
5. Tenant submits a 12-digit UTR for an invoice.
6. Landlord receives a payment-review notification.
7. Landlord approves or rejects the UTR.
8. Tenant receives approval/rejection notification.
9. Dashboard and invoice totals reflect the final payment state.

## Smoke check

From `apps/web/`, set credentials in environment variables and run:

```powershell
$env:SMARTRENT_LANDLORD_EMAIL = "landlord@example.com"
$env:SMARTRENT_LANDLORD_PASSWORD = "<password>"
$env:SMARTRENT_TENANT_EMAIL = "tenant@example.com"
$env:SMARTRENT_TENANT_PASSWORD = "<password>"
.\node_modules\.bin\npm.cmd run smoke:payments
```

The script checks login, roles, tenant invoice visibility, and whether a paid or
awaiting-review invoice is present.

## Supabase and migrations

The API runs Flyway migrations automatically against the configured Supabase
PostgreSQL database. Treat startup as a schema-changing operation when new
migration files are present. Never point local experiments at production unless
you intend to migrate production.

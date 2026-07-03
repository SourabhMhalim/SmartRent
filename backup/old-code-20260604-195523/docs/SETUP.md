# SmartRent Setup

## Accounts

You already created:

- Supabase
- Vercel

Vercel is only needed when the frontend is ready to deploy. For now, local development uses Docker Desktop and Supabase cloud.

The frontend is UI only. It calls Spring Gateway at `http://localhost:8080`; Spring services handle auth, validation, business rules, and Supabase database interactions.

## Local Tool Check

Required:

- Git
- Node.js 22 LTS
- pnpm or npm
- Java 21
- Maven 3.9+
- Docker Desktop

Useful installs:

```powershell
corepack enable
corepack prepare pnpm@10.12.4 --activate
winget install Apache.Maven
```

If `node` opens from the Codex app path or gives "Access is denied", fix your PATH so the Node 22 install appears before WindowsApps/Codex entries.

## Environment Files

Create:

```powershell
Copy-Item .env.example .env
Copy-Item apps\web\.env.local.example apps\web\.env.local
```

Then edit `.env` with private values:

- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SPRING_DATASOURCE_PASSWORD`
- `DATABASE_URL`

The web app's local env only needs:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Supabase Schema

Open Supabase Dashboard, choose the SmartRent project, then use SQL Editor to run:

```text
supabase/migrations/0001_initial_schema.sql
```

## Run Locally

Terminal 1:

```powershell
cd D:\Dev\Projects\smartrent\apps\web
pnpm install
pnpm dev
```

Terminal 2:

```powershell
cd D:\Dev\Projects\smartrent
docker compose up --build
```

The login page calls:

```text
POST http://localhost:8080/api/auth/login
POST http://localhost:8080/api/auth/signup
```

Those gateway routes forward to `core-service`.

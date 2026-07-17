# SmartRent Project Status

SmartRent is a production full-stack rental-management application. The original
learning plan has been completed and this file now records the current state.

## Production architecture

```text
Browser/PWA -> Nginx -> Next.js web -> Spring Boot API -> Supabase PostgreSQL/Auth
```

- Portfolio: `https://sourabhmhalim.in/`
- SmartRent: `https://sourabhmhalim.in/app/smartrent`
- API: `https://sourabhmhalim.in/app/smartrent/api`

## Delivered features

- Landlord and tenant registration, login, password recovery, and automatic session refresh
- Role-scoped landlord and tenant dashboards
- Property, unit, tenant, and lease management
- Invoice generation with rent and electricity calculations
- UPI QR payments and UTR review
- PDF invoices and notifications
- Installable Android/iOS PWA
- Production deployment behind Nginx and systemd

## Security model

- Supabase issues and validates authentication tokens.
- The backend validates JWTs and scopes data by authenticated user ID.
- Production runtime secrets stay in `/opt/smartrent/.env` with mode `600`.
- Deployment credentials belong in GitHub Actions secrets, never in the repository.
- Browser code receives no service-role key or database credential.

## Current engineering workflow

Feature and fix branches target `develop`. After CI passes, `develop` is merged
into `main`. A successful CI run on `main` triggers the production deployment.

See [README.md](README.md) for setup and [plan.md](plan.md) for remaining work.

# SmartRent Roadmap

The first production release is complete. Work now follows the priorities below.

## Release workflow

1. Create `feature/*` or `fix/*` from `develop`.
2. Open a pull request into `develop`.
3. Merge only after API, SmartRent web, and portfolio CI checks pass.
4. Open a release pull request from `develop` into `main`.
5. Merge after checks pass; production deploys the verified `main` revision.

## Near-term priorities

- Complete recurring real-device and production smoke testing.
- Add browser-level tests for registration, login, session refresh, and payment review.
- Add deployment rollback support and monitoring alerts.
- Review accessibility and performance budgets.
- Keep dependencies and Supabase integration guidance current.

## Completed milestones

- Core database and Spring Boot API
- Landlord and tenant authentication and authorization
- Properties, units, tenants, leases, invoices, and payments
- UPI/UTR workflow, PDFs, and notifications
- Responsive dashboards and installable PWA
- Production hosting, CI validation, and main-only deployment automation

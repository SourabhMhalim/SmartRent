# Architecture

## Current Rule

Next.js is used for frontend UI only. It must not read or write Supabase tables directly from the browser.

```text
Browser -> Next.js UI -> Spring Gateway -> Spring Services -> Supabase Auth/PostgreSQL
```

## Service Ownership

| Area | Owner |
| --- | --- |
| Screens and form rendering | Next.js |
| Request validation | Spring services |
| Authentication workflows | core-service via Supabase Auth REST API |
| Database access | Spring services |
| Property/unit/tenant/lease rules | core-service |
| Invoice, overdue, and QR rules | billing-service |
| Tickets, notifications, reports | ops-service |
| JWT validation and routing | gateway |

## Frontend Contract

The frontend can store session tokens for local development, but it should call only `NEXT_PUBLIC_API_URL` for application functionality.

Do not add browser-side Supabase clients unless the architecture is intentionally changed again.


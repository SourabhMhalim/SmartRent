# Emergent SmartRent Prototype Evaluation

Source reviewed: the exported Emergent session supplied with this task.

## What the prototype contains

The export describes an Expo/React Native client backed by FastAPI and MongoDB.
It covers properties, units, tenants, leases, meter readings, invoice generation,
a UPI QR flow, manual payment marking, and a dashboard summary.

The export is a tool transcript rather than a complete source archive. It cannot
be installed or run independently because it does not contain every generated
file or asset. This folder therefore records the useful findings while keeping
the experiment separate from the production application.

## Feature comparison

| Emergent idea | Existing SmartRent status | Decision |
| --- | --- | --- |
| Prevent a decreasing meter reading | Implemented and unit tested | Keep existing Java implementation |
| Prevent duplicate lease/month invoices | Implemented and unit tested | Keep existing database-backed check |
| Rent plus metered electricity calculation | Implemented with `BigDecimal` | Keep existing implementation |
| UPI deep link and QR | Implemented | Keep existing web flow |
| Manual mark-paid | Implemented with unique 12-digit UTR | Keep the safer existing flow |
| Dashboard collection summary | Previously absent from the main dashboard | Adopt |
| Mobile Expo application | Not part of the current learning-first scope | Defer |
| MongoDB and no authentication | Conflicts with PostgreSQL/Supabase ownership model | Reject |
| Permissive `Access-Control-Allow-Origin: *` | Weaker than the existing configuration | Reject |
| Suppressing all client warnings | Hides defects | Reject |

## Adopted change

The main dashboard now loads invoices alongside property data and presents:

- money collected for invoices in the current billing month;
- total outstanding money across pending and overdue invoices;
- counts of invoices included in each figure.

This reuses the existing authenticated invoice API and preserves the current
Next.js/Spring Boot architecture.

## Verification

Run from the repository root:

```powershell
cd apps/web
pnpm lint
pnpm build

cd ../../api
mvn test
```


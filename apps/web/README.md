# SmartRent Web

Next.js frontend for landlord and tenant workflows.

## Run

```powershell
.\node_modules\.bin\next.cmd dev
```

Open `http://localhost:3000`.

## Validate

```powershell
.\node_modules\.bin\eslint.cmd .
.\node_modules\.bin\next.cmd build
```

Stop `next dev` before running `next build`; both use `.next`, and mixing them
can cause temporary dev-server manifest/cache errors. If the dev server becomes
unstable after a build, stop it, delete `.next`, and start dev again.

## Payment smoke check

The smoke script intentionally reads credentials from environment variables so
test passwords are not stored in the repo.

```powershell
$env:SMARTRENT_API_URL = "http://localhost:8080"
$env:SMARTRENT_LANDLORD_EMAIL = "landlord@example.com"
$env:SMARTRENT_LANDLORD_PASSWORD = "<password>"
$env:SMARTRENT_TENANT_EMAIL = "tenant@example.com"
$env:SMARTRENT_TENANT_PASSWORD = "<password>"
node scripts/payment-flow-smoke.mjs
```

It verifies:

- landlord login and role;
- tenant login and role;
- tenant invoice visibility;
- whether a paid invoice or awaiting-review invoice exists.

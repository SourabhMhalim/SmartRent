# SplitSafari

SplitSafari now lives at `apps/SplitSafari` in the SmartRent repository and runs
as a Node/Next.js application at **/app/SplitSafari**. The portfolio's **/apps**
page launches it alongside SmartRent. No signup is required.

## Local development

Requires Node 22.13 or newer; CI and production use Node 24.

```powershell
npm ci
npm run dev
```

Open `http://localhost:3002/app/SplitSafari` directly or launch it through the
portfolio at `http://localhost:3001/apps`. Both applications must be running for
portfolio launch links to work locally. The prefix is case-sensitive.

```powershell
npm run build
npm start
```

## Data preserved during the move

The previous Cloudflare D1 development database was copied using SQLite's backup
API into `data/splitsafari.sqlite`. The original `.wrangler/` database remains
untouched. The copy retains all groups, expenses, planned contributions,
settlements, invitation hashes and session records, including Alibag trip.
Neither data directory is tracked in Git. The SmartRent database is unchanged.

The app uses Node's SQLite driver with the existing tables, integer amounts and
optimistic version checks. Set `SPLITSAFARI_DATABASE_PATH` to choose a persistent
absolute file location on the server. A fresh installation creates empty tables.
The server should keep data outside its source checkout; see `../../deploy/README.md`.

`npm run db:import-local` is a one-time import for an existing D1 development
SQLite file. It refuses to overwrite an existing destination and verifies the
copied database. It is not run automatically on startup or deployment.

The old Sites/Vinext configuration and migration files are retained for reference.
They are not used by the active npm dev/build/start commands. No Sites deployment
or Cloudflare credentials are needed to run the app on the portfolio host.

## Access

The organiser adds participants and issues personal links. Link possession grants
access as that participant, so links must be shared privately. Invitation secrets
are hashed in the database and passed in URL fragments. The browser uses an
HttpOnly, SameSite cookie scoped to `/app/SplitSafari`; production requires HTTPS.
Only expense authors can edit or delete their expenses. Payment participants or
the organiser can record a payment. Group data is never served without a session.

Existing invitation tokens remain valid at the new prefix. Old localhost links
must be updated from `/#invite=...` to `/app/SplitSafari/#invite=...` on the new host.
The People tab generates links with the correct current origin and prefix.
The browser remembers one active group; a personal recovery link switches groups.

## Verification

With the server running, `npm run test:api` checks rounding, participant exclusion,
invite/session isolation, permissions, partial payments and validation. Tests
create test groups; use an isolated database for automated testing. Set
`SPLITSAFARI_TEST_ORIGIN` to the direct app or portfolio origin to test either route.
Run `npx tsc --noEmit` for type checking. CI builds and runs API tests against a
fresh temporary database.

Currency is INR. Contributions are planned targets, not collected funds.
Settlement records do not transfer money. Local sample data is not deployed by Git.

# SplitSafari on the portfolio host

The public routes are `/apps`, `/app/portfolio`, `/app/smartrent`, and `/app/SplitSafari`.
The portfolio also remains at `/`; `/app/Smartrent` redirects to the lowercase
SmartRent route. Leave `/app/portfolio` and the alias with the portfolio upstream.
The portfolio already links to Apps. Its application cards use full navigations
so Next.js does not mix the independent applications' client routers.

## One-time server setup

1. Install Node 24 and configure `splitsafari.service` for the actual service
   account, checkout directory, and absolute Node executable. The provided
   defaults assume `smartrent`, `/opt/smartrent`, and `/usr/bin/node`.
2. Install that unit as `/etc/systemd/system/splitsafari.service`, then run
   `sudo systemctl daemon-reload` and `sudo systemctl enable splitsafari`.
3. Include `splitsafari.nginx.conf` inside the existing HTTPS server block.
   Preserve the existing portfolio, SmartRent, and API locations. Validate with
   `sudo nginx -t` before reloading Nginx.
4. Build `apps/SplitSafari` with `npm ci && npm run build`, then start the unit.

The service stores SQLite data outside the Git checkout at
`/var/lib/splitsafari/splitsafari.sqlite`. It must be writable only by its service
account. An optional `/etc/splitsafari.env` may override that path. Never put the
database or participant invitation tokens in Git or public static directories.

No data is uploaded by the build or deployment workflow. The local Alibag sample
remains local until an explicit database migration to the server is performed.
Back up a live database using SQLite's backup API rather than copying only its
main file while WAL writes are active. Do not overwrite an existing server DB.

The portfolio can also proxy both app prefixes to ports 3000 and 3002. This lets
local development use one launch page; production Nginx can route directly using
the supplied snippet. HTTPS is required for production session cookies.

The production workflow builds and health-checks SplitSafari alongside the
existing services. Install the new unit before deploying the first revision
that enables it. None of these files changes the live server by itself.

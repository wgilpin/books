# Epic 03 — Container

**Phase:** 01 Tracer: award list on screen
**Goal:** Run the app in OrbStack with daily database backups.
**Done criteria covered:** DC-8, DC-9

## Behaviour

`docker compose up -d` starts the app on `localhost:3000` and a backup sidecar.
Both restart with OrbStack. The sidecar copies the database to `./backups/`
once a day and prunes old copies.

## Acceptance criteria

- **AC-1** — Given the repo, when I run `docker compose up -d`, then
  `localhost:3000` shows the app.
- **AC-2** — Given a running stack, when OrbStack restarts, then the app comes
  back without a command from me.
- **AC-3** — Given a dated set of backup files, when the retention script runs,
  then it keeps the newest 7 daily, 4 weekly and 6 monthly copies and deletes
  the rest.
- **AC-4** — Given the sidecar, when its schedule fires, then a new
  `sqlite3 .backup` copy appears in `./backups/`.

## Tests

- `scripts/backup/retention.test.ts` — the retention rule on a dated set
  (AC-3).
- Manual (AC-1, AC-2, AC-4): run the stack, open the page, restart OrbStack,
  open it again; next day, `ls backups/`.

## Files

- `Dockerfile`, `docker-compose.yml`, `.dockerignore`
- `scripts/backup/backup.sh`, `scripts/backup/retention.sh`,
  `scripts/backup/retention.test.ts`

## Out of scope

The Caddy route and internet exposure. Off-machine backups.

## Notes

The app uses `node:24-alpine` and `restart: unless-stopped`. The database lives
on a named volume, mounted into both containers. Every `docker` command needs
the user's yes, by the user's rules.

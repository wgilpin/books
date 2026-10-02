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

---

## Build note — 2026-10-02

**Result:** green

### Tasks done

1. Wrote the retention rule test first, then `retention.mjs` (AC-3). Ran its
   CLI on 60 scratch files: 50 deleted, 10 kept.
2. Added `Dockerfile` (Node 24 Alpine, pnpm 12.8.1, sqlite CLI in the runtime
   image), `.dockerignore` and `docker-compose.yml` with `books-app` and
   `books-backup`, both `restart: unless-stopped`, on the `books-data` volume.
3. Added `backup.sh`: `sqlite3 .backup` into `./backups/`, then retention,
   once a day.
4. With the user's yes, ran `docker compose up -d --build`. `localhost:3000`
   returned 200; a refresh through the container stored 913 books (AC-1).
5. Found that the sidecar slept 24 hours when it started before the database
   existed. Changed it to check again every 5 minutes. With the user's yes,
   ran `docker compose up -d --build backup`. `backups/books-2026-10-02.db`
   appeared in seconds; `PRAGMA integrity_check` returned `ok` and the copy
   holds 913 works (AC-4).
6. AC-2: the user declined an OrbStack restart, because OrbStack runs their
   production apps. With the user's yes, `docker inspect` shows
   `restart=unless-stopped` on both containers. The user accepted this as the
   proof until the next natural OrbStack restart.

### Tests added

- `scripts/backup/retention.test.ts` — keeps the newest 7 daily copies; keeps
  the newest copy of each of the last 4 weeks; keeps the newest copy of each of
  the last 6 months; deletes every other copy; ignores files that are not dated
  backups.

### Suite result

`pnpm test` — Test Files 7 passed (7), Tests 26 passed (26).

### Deviations from the plan

- The retention rule is `retention.mjs` in Node, not `retention.sh`. Date
  arithmetic in BusyBox `sh` is fragile, and the image already has Node.
- The sidecar uses the app image, so it needs no second image.
- Weeks start on Monday, and the current week and month count toward the 4 and
  the 6.
- AC-2 is proved by the restart policy, not by an observed OrbStack restart.
- The second compose command also recreated `books-app`, because it shares the
  rebuilt image. The data volume kept all 913 books.

### Follow-ups

- Check that `books-app` comes back at the next natural OrbStack restart.
- Backups stay on this Mac. An off-machine copy is out of scope.

---

## Review — 2026-10-02

**Verdict:** pass with follow-ups

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | Manual, recorded in the build note: `docker compose up -d --build`, then `GET /` 200 and a refresh storing 913 books |
| AC-2 | yes, by configuration | Manual, recorded: `docker inspect` shows `unless-stopped` on both containers. No observed OrbStack restart; the user accepted this proof |
| AC-3 | yes | `retention.test.ts` — five tests |
| AC-4 | yes | Manual, recorded: `backups/books-2026-10-02.db` appeared after the sidecar started; integrity `ok`, 913 works |

Suite run by the reviewer: `pnpm test` — 26 passed.

### Drift

None against `architecture.md`: one container in OrbStack on port 3000, the
database on a named volume, a daily backup sidecar into `./backups/` with
7/4/6 retention. The user's rule names `prodrigestivill/postgres-backup-local`
for Postgres; this project uses SQLite, so a sidecar with `sqlite3 .backup`
keeps the same schedule and retention.

### Findings

- Medium: `books-app` and `rayv-app` both map host port 3000. Starting one
  while the other runs fails.
- Low: `backup.sh` sleeps 24 hours after each backup. A container restart
  backs up at once, so several restarts in a day overwrite the same file. No
  data loss.
- Low: the image runs as root. It is not exposed in phase 01.

### Follow-ups

- Observe AC-2 at the next natural OrbStack restart.
- Resolve the port 3000 clash with `rayv`.

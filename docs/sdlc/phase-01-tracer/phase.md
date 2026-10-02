# Phase 01 — Tracer: award list on screen

**Goal:** Show the newest Hugo, Nebula, Clarke and BSFA novels from Wikidata in
the app, running in OrbStack.

## Scope

A new SvelteKit 3 app with SQLite, migrations and an in-memory test database.
The `sources/wikidata` module with the award-novel query. The `/` route with a
refresh action and a Kindle UK link per book. A Dockerfile, a compose file and
a daily backup sidecar.

## Done criteria

- **DC-1** — `pnpm test` runs the full suite and passes.
- **DC-2** — Tests never open the live database file. They use in-memory
  SQLite.
- **DC-3** — Before the first refresh, `/` shows an empty state and a refresh
  button.
- **DC-4** — After a refresh, `/` lists the award novels newest first. Each
  shows title, author, award, year and result (won or shortlisted).
- **DC-5** — Each book links to a Kindle UK search for its title and author,
  limited to Kindle books.
- **DC-6** — A second refresh adds no duplicate books or award entries.
- **DC-7** — A failed refresh keeps the old list and shows an error.
- **DC-8** — `docker compose up -d` serves the app on `localhost:3000`, and it
  comes back after OrbStack restarts.
- **DC-9** — The backup sidecar writes a copy of the database to `./backups/`
  each day and keeps 7 daily, 4 weekly and 6 monthly copies.

## Not in this phase

The Kindle import, the owned filter, the series rule, the ten-entry limit, and
login.

## Epics

1. `epic-01-skeleton.md` — the app, the database and an empty `/` page, with
   one passing test.
2. `epic-02-award-list.md` — the Wikidata refresh, the award list and the
   Kindle links.
3. `epic-03-container.md` — Docker, compose and the backup sidecar.

Epic 02 depends on epic 01. Epic 03 depends on epic 01 only, so it can go before
or after epic 02.

## Risks

- SvelteKit 3.0.0 is new. A day-one bug sends the project back to kit 2.70.
- Wikimedia can block the generic user agent that my global rule fixes.
- Docker commands need a question each time, by my rules, so epic 03 pauses.

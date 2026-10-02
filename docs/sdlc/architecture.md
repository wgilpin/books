# Architecture — books (speculative fiction discovery)

## Goals

- Show ten entries from Hugo, Nebula, Clarke and BSFA winners and shortlists,
  newest first, with every book I own on Kindle hidden and the series rule
  applied.
- Import my owned list from a Kindle library export in one step, a few times a
  year.
- Run all the time on my Mac, with no work from me between uses.

## Constraints

- One user. About 2,300 owned books and a few hundred award novels.
- Runs in OrbStack on my Mac. v1 is reachable on `localhost` only. Internet
  exposure through the existing Caddy proxy and Cloudflare tunnel comes later,
  together with a login.
- Copy the shape of `~/projects/rayv`, which I already run, on current major
  versions.
- My rules: ask before any `docker` command; never use the live database for
  tests; scheduled backups on every live database.
- ISFDB is a volunteer site. Fetch slowly, and never twice for the same page.

## Approaches considered

- **Scrape ISFDB, cache the pages.** One source holds awards, results, series
  and series order. A few hundred page fetches in total. Trade-off: depends on
  ISFDB's HTML, which can change.
- **Load the ISFDB MySQL dump.** No HTML risk. Trade-off: a MySQL container and
  a large dump to extract a few thousand rows.
- **Wikipedia for shortlists, plus a second source for series.** Two formats,
  and a cross-match between them, which is the same problem as Kindle titles.

## Recommended approach

Scrape ISFDB and cache the raw pages in SQLite. The deciding factor is one
source for all four facts at a tiny volume. The spike below confirms it before
the build starts. The dump stays as the fallback.

## Stack

- Language: TypeScript 6.0, Node 24 LTS
- Framework: SvelteKit 3 with Svelte 5.57, adapter-node 6, Vite 8
- Database: SQLite 3 through better-sqlite3 13, WAL mode, plain SQL migrations
- Tests: Vitest 5, run with `pnpm test`
- Package manager: pnpm 12
- Deploy: one Docker container in OrbStack, port 3000 on localhost, database on
  a named volume, a daily backup sidecar writing to `./backups/`

## Shape of the system

- **`sources`** — one module per data source behind a shared interface. Each
  returns plain records: works, award entries, series and series entries, each
  tagged with its source and the source's own id. v1 has one source:
- **`sources/isfdb`** — fetches award-year pages and series pages, stores the
  raw HTML in a page cache, and parses it. Parsing never fetches. A rate limit
  of one request a second.
- **`kindle`** — parses the CSV from the library export script. The script
  lives in `scripts/kindle-export.js`, so the export stays repeatable.
- **`match`** — normalises authors and titles and links owned books to works.
  Pure functions.
- **`discover`** — builds the list. Takes awards, series and the owned set, and
  returns the entries. Pure functions. This is the core, and most tests sit
  here.
- **`db`** — the SQLite connection and migrations.
- **Routes** — `/` the list; `/import` uploads the Kindle CSV; `/refresh`
  starts an ISFDB refresh in the background and shows its progress. "I own
  this" is a form action on each entry.

The seams are the pure modules and the source interface. `sources` and
`kindle` turn the outside world into plain records. `match` and `discover` never touch the network or the database.

## Data

Every row from a source carries `source` and `source_id`, unique together. A
refresh upserts on that pair, so internal ids stay stable across refreshes.

- **work** — id, source, source_id, title, author, year, and variant titles.
- **award_entry** — work, award, year, result (`won` or `shortlisted`),
  source, source_id.
- **series** and **series_entry** — a series, and each work in it with its
  position.
- **owned** — one row per Kindle book: ASIN, raw title, raw author, and the
  matched work when one exists. An import replaces the whole table.
- **owned_override** — works I ticked as "I own this", keyed by source and
  source_id so it survives a rebuild. It survives every import. This is the only
  data that cannot be rebuilt.
- **page_cache** — source, URL, fetched time, raw content.

## Key decisions

- **One entry per series.** The entry is the book after the last one I own, or
  book 1 if I own none. A fully owned series is dropped. Entries sort by their
  newest award year.
- **Match on author first, then title.** Authors arrive as "Last, First" and
  normalise cleanly. Titles are cut at the first colon or bracket, then
  compared. A missed match shows an owned book, and the checkbox fixes it. A
  false match hides a book I want, with no sign. So the match must stay strict.
- **No login in v1.** It is reachable on `localhost` only. The env-var password
  and a signed cookie come with internet exposure.
- **Refresh runs inside the app**, not as a host script. The database lives in
  the container's volume. A host process writing the same SQLite file across
  the OrbStack VM boundary risks lock trouble.
- **Source-neutral model, ISFDB only.** Rows carry their source, and sources sit
  behind one interface, so a second source is a new module with no schema
  change. Merging several sources is rejected for now: it repeats the fuzzy
  matching problem between sources, before any source has failed. See
  [ADR 0001](../adr/0001-source-neutral-isfdb-only.md).
- **SvelteKit 3, not 2.** Kit 3.0.0 shipped on 2026-10-01. A new project on
  kit 2 faces a migration soon. A day-one bug is the risk, and moving back to
  kit 2.70 early is cheap. TypeScript stays on 6.0, because kit 3 declares
  `typescript ^6.0.0` as a peer and excludes 7.
- **Tests use an in-memory SQLite database.** They never open the live file.
- **Backups:** a sidecar runs `sqlite3 .backup` daily into `./backups/`, keeping
  7 daily, 4 weekly and 6 monthly. `backups/` and `data/` stay out of git.

## Risks and spikes

- **Spike — ISFDB as the only source.** Question: can a script pull the Clarke
  and Hugo novel shortlists from 2015 to 2025 from ISFDB, with series name,
  position and the full series list, in under 200 requests? Time box: half a
  day. Changes the design if: series pages lack clean positions, or ISFDB
  blocks the fetch. Then add a second source for the missing fact only, or
  switch to the dump.
- **Title variants.** UK and US editions can carry different titles. ISFDB lists
  variants, so match against those too. The spike checks that they are on the
  pages it fetches.
- **The export script breaks** when Amazon changes its page. The checkbox is the
  fallback, and the last import stays in place.
- **ISFDB HTML changes.** The parsers run against saved fixture pages in tests.
  A failed refresh rolls back and keeps the old data.

## Open questions

- When the app goes on the internet, does the env-var password need rate
  limiting, or does Cloudflare's own protection do?

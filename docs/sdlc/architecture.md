# Architecture — books (speculative fiction discovery)

## Goals

- Show ten entries from Hugo, Nebula, Clarke and BSFA winners and shortlists,
  newest first, with every book I own on Kindle hidden and the series rule
  applied.
- Import my owned list from a Kindle library export in one step, a few times a
  year.
- Run all the time on my Mac, with no work from me between uses.

## Constraints

- Two users (me and my daughter), identified by which of the two env-var
  passwords was entered on `/login`. About 2,300 owned books per user and a few
  hundred award novels.
- Runs in OrbStack on my Mac. v1 is reachable on `localhost` only. Internet
  exposure through the existing Caddy proxy and Cloudflare tunnel comes later,
  together with a login.
- Copy the shape of `~/projects/rayv`, which I already run, on current major
  versions.
- My rules: ask before any `docker` command; never use the live database for
  tests; scheduled backups on every live database.
- Wikidata is a shared public service. Query rarely, cache the results, and
  never query on a page load.

## Approaches considered

- **Scrape ISFDB, cache the pages.** One source for all four facts. Ruled out by
  the spike: every ISFDB page sits behind a Cloudflare bot challenge.
- **Load the ISFDB MySQL dump.** No HTML risk. Trade-off: a MySQL container, a
  large dump, and the download page sits behind the same challenge.
- **Query Wikidata.** A public SPARQL service built for scripts. Two queries
  return the shortlists, results, series and series order. Trade-off: series
  membership lags for recent books.

## Recommended approach

Query Wikidata and cache the results in SQLite. The deciding factor: the spike
got every shortlist from 2015 to 2025 in two queries, with no scraping. The
series gaps cost little, because most gaps are recent book 1s, which show
correctly anyway.

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
- **`sources/wikidata`** — runs two SPARQL queries: award novels with year,
  result and series; then every member of those series with its position. It
  stores the raw JSON in a cache table and parses it. Parsing never fetches.
  The spike queries are in `docs/spikes/wikidata/`.
- **`kindle`** — parses the CSV from the library export script. The script
  lives in `scripts/kindle-export.js`, so the export stays repeatable.
- **`match`** — normalises authors and titles and links owned books to works.
  Pure functions.
- **`discover`** — builds the list. Takes awards, series and the owned set, and
  returns the entries. Pure functions. This is the core, and most tests sit
  here.
- **`db`** — the SQLite connection and migrations.
- **Routes** — `/` the list; `/import` uploads the Kindle CSV; `/refresh`
  starts a Wikidata refresh in the background and shows its progress. "I own
  this" is a form action on each entry.

The seams are the pure modules and the source interface. `sources` and
`kindle` turn the outside world into plain records. `match` and `discover` never touch the network or the database.

## Data

Every row from a source carries `source` and `source_id`, unique together. A
refresh upserts on that pair, so internal ids stay stable across refreshes.
Award, series, cover and genre-override rows are shared; `owned`, `owned_import`
and `book_mark` rows carry a `user` key (`'1'` or `'2'`).

- **work** — id, source, source_id, title, author, year, and variant titles.
- **award_entry** — work, award, year, result (`won` or `shortlisted`),
  source, source_id.
- **series** and **series_entry** — a series, and each work in it with its
  position.
- **owned** — one row per Kindle book per user: user, ASIN, raw title, raw
  author. An import replaces that user's rows only.
- **book_mark** — works a user marked (`owned`, `read`, `rejected`, `queued`),
  keyed by user, source and source_id so it survives a rebuild and every import.
- **source_cache** — source, query, fetched time, raw response.

## Key decisions

- **One entry per series.** The entry is the book after the last one I own, or
  book 1 if I own none. A fully owned series is dropped. Entries sort by their
  newest award year.
- **Match on author first, then title.** Authors arrive as "Last, First" and
  normalise cleanly. Titles are cut at the first colon or bracket, then
  compared. A missed match shows an owned book, and the checkbox fixes it. A
  false match hides a book I want, with no sign. So the match must stay strict.
- **Password-only login for two users.** `APP_PASSWORD` logs in user `'1'` and
  `APP_PASSWORD_2` logs in user `'2'`, with a signed session cookie carrying the
  user id and expiry. No username field, logout button or user switcher.
- **Refresh runs inside the app**, not as a host script. The database lives in
  the container's volume. A host process writing the same SQLite file across
  the OrbStack VM boundary risks lock trouble.
- **Source-neutral model, Wikidata only.** Rows carry their source, and sources
  sit behind one interface, so a second source is a new module with no schema
  change. Merging several sources is rejected for now. See
  [ADR 0002](../adr/0002-wikidata-as-only-source.md), which supersedes
  [ADR 0001](../adr/0001-source-neutral-isfdb-only.md).
- **Numbered series entries only.** The series rule ignores members with no
  position, which drops most short fiction. Positions are decimals, so 4.5
  sorts between 4 and 5. A book with no English title shows its Wikidata id.
- **SvelteKit 3, not 2.** Kit 3.0.0 shipped on 2026-10-01. A new project on
  kit 2 faces a migration soon. A day-one bug is the risk, and moving back to
  kit 2.70 early is cheap. TypeScript stays on 6.0, because kit 3 declares
  `typescript ^6.0.0` as a peer and excludes 7.
- **Tests use an in-memory SQLite database.** They never open the live file.
- **Backups:** a sidecar runs `sqlite3 .backup` daily into `./backups/`, keeping
  7 daily, 4 weekly and 6 monthly. `backups/` and `data/` stay out of git.

## Risks and spikes

- **Spike result (2026-10-02).** ISFDB pages, wiki and dump downloads sit
  behind a Cloudflare bot challenge; its REST API has no awards or series.
  Wikidata, in two queries: 198 award novels from 2015 to 2025, with complete
  shortlists. 50 carry a series, 48 with a position. Established series list
  every book in order. Gaps: recent books with no series (*The Tainted Cup*,
  *Legends & Lattes*), a series with no English name (*Witch King*), and BSFA
  2020 showing 10 books.
- **Series gaps.** A later book with no series data shows as itself, not as the
  next book I need. I fix a gap by editing Wikidata. If gaps hurt in use, add a
  manual series override.
- **User agent.** Wikimedia asks scripts to send a user agent that names the
  tool and a contact. My global rule fixes a generic one. It worked in the
  spike, but Wikimedia can block it.
- **Title variants.** UK and US editions can carry different titles. Match
  against Wikidata's aliases as well as the main title.
- **The export script breaks** when Amazon changes its page. The checkbox is the
  fallback, and the last import stays in place.
- **Wikidata data changes.** Anyone can edit it, so a refresh can lose or
  change a row. The parsers run against saved fixture responses in tests. A
  failed refresh rolls back and keeps the old data.

## Open questions

- When the app goes on the internet, does the env-var password need rate
  limiting, or does Cloudflare's own protection do?

# SDLC state

Project: books — speculative fiction discovery
Updated: 2026-10-02

## Stack

- Language: TypeScript 6.0, Node 24 LTS
- Framework: SvelteKit 3 with Svelte 5.57, adapter-node 6, Vite 8
- Database: SQLite 3 through better-sqlite3 13, WAL mode, plain SQL migrations
- Tests: Vitest 5, run with `pnpm test`
- Package manager: pnpm 12
- Deploy: one Docker container in OrbStack, port 3000 on localhost, database on
  a named volume, a daily backup sidecar writing to `./backups/`

## Stages

- concept: approved 2026-10-02
- explore: approved 2026-10-02
- architecture: approved 2026-10-02
- design: approved 2026-10-02
- phases: approved 2026-10-02

## Phases

- [x] 01-tracer — done
  - [x] epic-01-skeleton — merged 2026-10-02
  - [x] epic-02-award-list — merged 2026-10-02
  - [x] epic-03-container — merged 2026-10-02
- [x] 02-owned-filter — done
  - [x] epic-01-kindle-import — merged 2026-10-02
  - [x] epic-02-hide-owned — merged 2026-10-02
  - [x] epic-03-own-button — merged 2026-10-02
- [x] 03-series-rule — done
  - [x] epic-01-apply-design — merged 2026-10-02
  - [x] epic-02-series-data — merged 2026-10-02
  - [x] epic-03-series-entries — merged 2026-10-02
- [x] 06-genre-filter — done
  - [x] epic-01-genre-data — merged 2026-10-02
  - [x] epic-02-genre-filter — merged 2026-10-02
  - [x] epic-03-genre-override — merged 2026-10-02
- [ ] 04-on-the-internet — pending
- [x] 05-triage — done
  - [x] epic-01-marks — merged 2026-10-02
  - [x] epic-02-queue — merged 2026-10-02

## Notes for a fresh session

- The root `concept.md` is the user's first draft. It holds build ideas (schema, sources, UI) for stage 3.
- Stop condition 1 passed 2026-10-02: `data/kindle_books.csv` holds 2,324 owned books (asin,title,author), scraped from the read.amazon library page by a console script. 939 titles carry store copy after a colon; 668 name a series or book number. `data/` is personal and stays out of git.
- Spike done 2026-10-02: ISFDB is behind a Cloudflare challenge; Wikidata is the source (ADR 0002). Queries in docs/spikes/wikidata/.
- The live database is disposable until every phase is done (user, 2026-10-02). Migrations and resets on it are not hazards. Docker commands still need a yes.

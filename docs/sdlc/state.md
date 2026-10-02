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
- design: pending
- phases: pending

## Phases

## Notes for a fresh session

- The root `concept.md` is the user's first draft. It holds build ideas (schema, sources, UI) for stage 3.
- Stop condition 1 passed 2026-10-02: `data/kindle_books.csv` holds 2,324 owned books (asin,title,author), scraped from the read.amazon library page by a console script. 939 titles carry store copy after a colon; 668 name a series or book number. `data/` is personal and stays out of git.
- Spike pending before /sdlc:phases: ISFDB as the only source for awards and series order (see architecture.md).

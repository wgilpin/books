# Epic 01 — Skeleton

**Phase:** 01 Tracer: award list on screen
**Goal:** Start the app with a migrated SQLite database and an empty `/` page.
**Done criteria covered:** DC-1, DC-2, DC-3

## Behaviour

I run the app and open `/`. It shows "No award data yet" and a refresh button.
The database file and its tables exist. The test suite runs on an in-memory
database.

## Acceptance criteria

- **AC-1** — Given a new checkout, when I run `pnpm install` and `pnpm test`,
  then the suite passes.
- **AC-2** — Given no database file, when the app opens the database, then it
  creates the file and applies every migration once.
- **AC-3** — Given a test, when it asks for a database, then it gets in-memory
  SQLite with every migration applied, and the live path is never opened.
- **AC-4** — Given an empty database, when `/` loads, then it returns no books
  and no last refresh time, and the page shows the empty state and a refresh
  button.

## Tests

- `src/lib/server/db.test.ts` — migrations apply once and twice without error
  (AC-2); the test helper returns `:memory:` (AC-3).
- `src/routes/page.server.test.ts` — load on an empty database (AC-4).
- The suite itself (AC-1).

## Files

- `package.json`, `pnpm-lock.yaml`, `svelte.config.js`, `vite.config.ts`,
  `tsconfig.json`, `.gitignore`
- `src/lib/server/db.ts`, `migrations/001_init.sql`
- `src/routes/+page.server.ts`, `src/routes/+page.svelte`
- `src/lib/server/db.test.ts`, `src/routes/page.server.test.ts`

## Out of scope

The refresh itself. The button posts to an action that does nothing yet.

## Notes

The schema follows `architecture.md`: `work`, `award_entry`, `series`,
`series_entry`, `source_cache`, `refresh_log`. Every source row carries
`source` and `source_id`, unique together. Series and owned tables come in
later phases. Database path from `DATABASE_PATH`, default `data/books.db`.

---

## Build note — 2026-10-02

**Result:** green

### Tasks done

1. Scaffolded SvelteKit 3 by hand: `package.json`, `vite.config.js`,
   `tsconfig.json`, `src/app.html`, `src/app.d.ts`.
2. Added `/` with an empty state and a refresh form (AC-4).
3. Added `openDb` and `getDb` with bundled SQL migrations and a
   `schema_migrations` table (AC-2).
4. Pointed the test run at in-memory SQLite through `DATABASE_PATH` in the
   Vitest config (AC-3).
5. Built the app and checked it by hand on a scratch database: `/` shows the
   empty state, and the refresh POST returns 200.

### Tests added

- `src/lib/server/db.test.ts` — creates a missing database file and applies
  every migration; applies each migration once when opened twice; uses an
  in-memory database, never the live file.
- `src/routes/page.server.test.ts` — returns no books and no last refresh on an
  empty database.

### Suite result

`pnpm test` — Test Files 2 passed (2), Tests 4 passed (4).
`pnpm check` — 0 errors, 0 warnings.

### Deviations from the plan

- `vite.config.js`, not `vite.config.ts`. Vite 8 bundles a TypeScript config
  through rolldown, which fails before `.svelte-kit/tsconfig.json` exists.
- SvelteKit 3 removed `svelte.config.js`, `$lib` and the `ORIGIN` env var.
  Config lives in `vite.config.js`; imports use `#lib/...js` through the
  `imports` field in `package.json`; the CSRF origin is `paths.origin`, set
  from `APP_ORIGIN` at build time, default `http://localhost:3000`. Phase 04
  rebuilds with the public origin.
- `pnpm` 12 runs through `npx -y pnpm@12.8.1`, because the host has pnpm 11.
  `packageManager` pins 12.8.1.
- The host runs Node 26; the container runs Node 24 (epic 03).
- The series and owned tables wait for phases 02 and 03, as the epic's out of
  scope says. The schema has `work`, `award_entry`, `source_cache` and
  `refresh_log`.
- The phase plan files (`docs/sdlc/phase-01-tracer/`) and the `state.md`
  update ride on this branch, so the plan lands with the first epic.

### Follow-ups

- `~/projects/rayv` also maps host port 3000. Port 3000 was free during this
  build, but both containers cannot run at once.

---

## Review — 2026-10-02

**Verdict:** fail

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `pnpm test` — 4 passed |
| AC-2 | yes | `db.test.ts` — creates a missing database file; applies each migration once |
| AC-3 | yes | `db.test.ts` — uses an in-memory database, never the live file |
| AC-4 | no | `page.server.test.ts` proves the load data only. No test proves that the page shows the empty state and the refresh button. The build note's manual check does not count, because the test plan lists DC-3 as automated. |

### Drift

None. The stack matches `architecture.md` on current majors. The `paths.origin`
build-time setting is new in SvelteKit 3 and does not contradict the
architecture.

### Findings

- No finding that changes behaviour. `getDb` resolves `data/books.db` against
  the working directory; the container must run from `/app` (epic 03).

### Follow-ups

- Port 3000 clash with `rayv`, from the build note.

---

## Build note — 2026-10-02 (repair for AC-4)

**Result:** green

### Tasks done

1. Added a server-render test of `+page.svelte` with empty data.
2. Checked that the test fails when the empty-state text changes, then
   restored the text.

### Tests added

- `src/routes/page.test.ts` — shows the empty state and a refresh button when
  there are no books.

### Suite result

`pnpm test` — Test Files 3 passed (3), Tests 5 passed (5).

### Deviations from the plan

None.

### Follow-ups

None.

---

## Review — 2026-10-02 (second)

**Verdict:** pass with follow-ups

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `pnpm test` — 5 passed |
| AC-2 | yes | `db.test.ts` — creates a missing database file; applies each migration once |
| AC-3 | yes | `db.test.ts` — uses an in-memory database, never the live file |
| AC-4 | yes | `page.server.test.ts` (load data) and `page.test.ts` (empty state and refresh button) |

### Drift

None.

### Findings

- None that change behaviour.

### Follow-ups

- Port 3000 clash with `rayv`: both map host port 3000.

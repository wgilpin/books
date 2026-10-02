# Epic 02 — Award list

**Phase:** 01 Tracer: award list on screen
**Goal:** Refresh award novels from Wikidata and list them with Kindle links.
**Done criteria covered:** DC-4, DC-5, DC-6, DC-7

## Behaviour

I press refresh. The app runs the Wikidata award-novel query in the background
and stores the result. `/` shows that a refresh is running, then lists every
award novel newest first, with award, year, result and a Kindle UK link. A
failed refresh leaves the old list and shows the error.

## Acceptance criteria

- **AC-1** — Given the spike fixture, when the parser runs, then it returns
  books with title, author and Wikidata id, and award entries with award, year
  and result, with author-only rows dropped.
- **AC-2** — Given parsed records, when they are stored twice, then the work and
  award entry counts do not change.
- **AC-3** — Given stored books, when `/` loads, then they come newest award
  year first, each with its award entries.
- **AC-4** — Given a book, when its link is built, then it is
  `https://www.amazon.co.uk/s?k=<title>+<author>&i=digital-text`, URL-encoded.
- **AC-5** — Given a refresh that fails, when it ends, then the old rows remain
  and `/` shows the error and the time it failed.
- **AC-6** — Given a refresh that is running, when `/` loads, then it shows that
  a refresh is running, and a second press does not start another.

## Tests

- `src/lib/server/sources/wikidata.test.ts` — parse the fixture (AC-1).
- `src/lib/server/refresh.test.ts` — store twice (AC-2); a failed fetch keeps
  rows (AC-5); a second start while running is ignored (AC-6).
- `src/routes/page.server.test.ts` — ordering and entries (AC-3); error and
  running state (AC-5, AC-6).
- `src/lib/kindle-link.test.ts` — link format (AC-4).

## Files

- `src/lib/server/sources/wikidata.ts`, `src/lib/server/sources/types.ts`
- `src/lib/server/refresh.ts`, `src/lib/kindle-link.ts`
- `src/routes/+page.server.ts`, `src/routes/+page.svelte`
- `tests/fixtures/wikidata-award-novels.json`
- the tests above

## Out of scope

Series data, the owned filter, the ten-entry limit.

## Notes

The query is `docs/spikes/wikidata/award-novels.rq`. Keep only rows with an
author. Send the user agent from the global rule. Tests mock `fetch`. They never
call Wikidata. Store the raw response in `source_cache` before parsing.

---

## Build note — 2026-10-02

**Result:** green

### Tasks done

1. Added the source record types and the Wikidata parser, tested on a trimmed
   spike fixture (AC-1).
2. Added the background refresh: fetch, cache the raw response, upsert works
   and award entries in one transaction, and log the run (AC-2, AC-5, AC-6).
3. Added the Kindle UK link builder (AC-4).
4. Added `listAwardBooks`, the `/` load and the refresh action (AC-3).
5. Rendered the list, the running state, the error and the last refresh time
   on `/` (AC-5, AC-6).
6. Ran a live refresh on a scratch database: 913 award novels and 1,232 award
   entries, from 1953 to 2026, in about 10 seconds.

### Tests added

- `src/lib/server/sources/wikidata.test.ts` — one work per book with its
  Wikidata id; author-only rows dropped; award entries with award, year and
  result; the Wikidata id for a book with no English title; no row without a
  year.
- `src/lib/server/refresh.test.ts` — stores novels and records a finished
  refresh; no duplicates on a second run; old rows kept and error recorded on a
  failed fetch; no second refresh while one runs.
- `src/lib/kindle-link.test.ts` — Kindle UK search for title and author;
  encodes characters that break the query.
- `src/routes/page.server.test.ts` — empty database; newest award year first
  with entries and link; error returned and books kept after a failed refresh.
- `src/routes/page.test.ts` — book with awards and link; running state with a
  disabled button; error with its time.

### Suite result

`pnpm test` — Test Files 6 passed (6), Tests 21 passed (21).
`pnpm check` — 0 errors, 0 warnings.

### Deviations from the plan

- The fixture holds the 2023 and 2024 rows of the spike response plus one row
  with no year, to keep it at 52 KB.
- A book whose only award has no year is dropped, because it has nothing to
  show.
- The load returns `refresh` (status, times, error) in place of
  `lastRefresh`.
- The running page reloads itself with a `<meta http-equiv="refresh">` tag, so
  it needs no JavaScript.
- The award query leaves out the series columns. Phase 03 adds them.
- `src/lib/server/books.ts` holds the list query. The epic's file list did not
  name it.
- The phase 01 state update from the epic 01 merge rides on this branch.

### Follow-ups

- Times show in UTC with no zone label.
- An award entry that Wikidata later removes stays in the database.

---

## Review — 2026-10-02

**Verdict:** pass with follow-ups

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `wikidata.test.ts` — five tests on the fixture |
| AC-2 | yes | `refresh.test.ts` — adds no duplicates when it runs twice (counts and ids unchanged) |
| AC-3 | yes | `page.server.test.ts` — newest award year first, each with its entries and Kindle link |
| AC-4 | yes | `kindle-link.test.ts` — both tests |
| AC-5 | yes | `refresh.test.ts` — keeps old rows and records the error; `page.server.test.ts` — error returned, books kept; `page.test.ts` — error and time shown |
| AC-6 | yes | `refresh.test.ts` — no second refresh while one runs; `page.test.ts` — running state, disabled button |

Suite run by the reviewer: `pnpm test` — 21 passed.

### Drift

None. The refresh runs inside the app, in the background, as `architecture.md`
says. Rows carry `source` and `source_id` (ADR 0002). Nothing from the
concept's out-of-scope list is built.

### Findings

- Low: times are UTC with no zone label. A reader in the UK sees a time one
  hour off in summer.
- Low: an award entry removed from Wikidata stays in the database, so a
  corrected nomination stays wrong until the database is rebuilt.
- Low: `{#each}` over books has no key. Correct, but a full re-render on
  change. No user impact at this size.

### Follow-ups

- Show local times, or label them UTC.
- Remove award entries that a successful refresh no longer returns.

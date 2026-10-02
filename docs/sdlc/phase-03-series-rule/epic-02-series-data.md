# Epic 02 — Series data

**Phase:** 03 Series rule
**Goal:** Store the numbered members of every series that holds an award book.
**Done criteria covered:** DC-3

## Behaviour

A refresh runs a third Wikidata query. It finds each series that holds an award
book, then every member of it with a number. The app stores the series, the
member books and their positions.

## Acceptance criteria

- **AC-1** — Given the series fixture, when it is parsed, then each row gives a
  series id and name, and a member id, title, author and numeric position.
- **AC-2** — Given a member with no number or a number that is not numeric, when
  it is parsed, then it is skipped.
- **AC-3** — Given a refresh, when it ends, then `series` and `series_entry`
  hold the parsed series and positions, and member books exist as works.
- **AC-4** — Given two refreshes, when the second ends, then no series, entry or
  work is duplicated.
- **AC-5** — Given the series query, when it is built, then it asks for `en,mul`
  labels and numbered members only.

## Tests

- `src/lib/server/sources/wikidata.test.ts` — AC-1, AC-2, AC-5.
- `src/lib/server/refresh.test.ts` — AC-3, AC-4.

## Files

- `migrations/005_series.sql`
- `src/lib/server/sources/wikidata.ts`, `src/lib/server/sources/types.ts`
- `src/lib/server/refresh.ts`
- `tests/fixtures/wikidata-series.json`
- the tests above

## Out of scope

Using the series in the list (epic 03).

## Notes

Member books carry `source` and `source_id` like award books. A member with no
award has no `award_entry`, so it never lists on its own.

---

## Build note — 2026-10-02

**Result:** green

### Tasks done

1. Ran the planned single series query live: Wikidata timed out after 65
   seconds, with and without a join-order hint. Split it in two: a series-id
   query (158 ids, under 1 second), then a members query with those ids in a
   `VALUES` list (572 rows, 4.5 seconds). No member had a non-numeric number.
2. Trimmed the live members response to the 3 series of the fixture award books
   (8 rows) as `tests/fixtures/wikidata-series.json`.
3. Wrote the parser tests first, then `SERIES_IDS_QUERY`, `seriesMembersQuery`,
   `parseSeriesIds` and `parseSeriesMembers` (AC-1, AC-2, AC-5).
4. Moved every Wikidata query to POST, because 158 ids make the URL too long.
5. Added `tests/fake-wikidata.ts`, one fake endpoint that routes on the query,
   and used it in the refresh, books and page tests.
6. Added `migrations/005_series.sql` and `storeSeries`; the refresh runs four
   queries and stores the series in the same transaction (AC-3, AC-4).
7. Live check on a scratch build: refresh `ok`; 127 series, 545 entries, 1,233
   works.

### Tests added

- `src/lib/server/sources/wikidata.test.ts` — series-id query and parser;
  members query with `VALUES`, `pq:P1545` and `en,mul`; members with series,
  title, author and position; non-numeric number skipped.
- `src/lib/server/refresh.test.ts` — series and numbered members stored as
  works; no duplicates on a second run.

### Suite result

`pnpm test` — Test Files 13 passed (13), Tests 73 passed (73).
`pnpm check` — 0 errors, 0 warnings.

### Deviations from the plan

- Two queries in place of one, because the single query times out.
- All queries use POST.
- The new shared fake changed three existing test files.
- My first expected work count (41) was wrong: only 2 of the 8 fixture members
  are award works in the fixture, so the count is 42.
- A member that is also an award book keeps its award title and author.

### Follow-ups

None.

---

## Review — 2026-10-02

**Verdict:** pass

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `wikidata.test.ts` — members with series, title, author and position |
| AC-2 | yes | `wikidata.test.ts` — non-numeric number skipped |
| AC-3 | yes | `refresh.test.ts` — series and numbered members stored as works, Locked Tomb positions 1 to 3 |
| AC-4 | yes | `refresh.test.ts` — no duplicate series, entries or member works |
| AC-5 | yes | `wikidata.test.ts` — members query has `en,mul` and `pq:P1545` |

Suite run by the reviewer: `pnpm test` — 73 passed.

### Drift

None. Wikidata stays the only source (ADR 0002); rows carry `source` and
`source_id`. The two-step query is an implementation detail inside
`sources/wikidata`.

### Findings

- Low: a refresh now makes four requests, about 6 seconds in total. Still well
  within "query rarely".

### Follow-ups

None.

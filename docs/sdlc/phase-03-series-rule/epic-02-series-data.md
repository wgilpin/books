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

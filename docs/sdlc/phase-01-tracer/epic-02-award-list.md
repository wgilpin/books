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

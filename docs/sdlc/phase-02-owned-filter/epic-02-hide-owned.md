# Epic 02 — Hide owned books

**Phase:** 02 Owned filter
**Goal:** Show the ten newest award books I do not own.
**Done criteria covered:** DC-3, DC-4, DC-5, DC-7

## Behaviour

After an import, `/` drops every award book that matches a book I own, by
author and title, and shows the ten newest that remain. Names that Wikidata
holds only as a `mul` label show as names, not ids.

## Acceptance criteria

- **AC-1** — Given "Beauman, Ned" and "Venomous Lumpsucker: A Novel", when
  matched against "Venomous Lumpsucker" by Ned Beauman, then they match.
- **AC-2** — Given "N. K. Jemisin" against "Jemisin, N.K." and accents against
  plain letters, when matched, then they match.
- **AC-3** — Given the same title by a different author, when matched, then it
  does not match.
- **AC-4** — Given a Kindle title equal to a Wikidata alias of the work, when
  matched, then it matches.
- **AC-5** — Given owned books and award books, when `/` loads, then it returns
  the ten newest award books with no owned book among them.
- **AC-6** — Given a book whose author has only a `mul` label, when the refresh
  stores it, then the author is the name (ISS-5).

## Tests

- `src/lib/match.test.ts` — AC-1 to AC-4.
- `src/lib/server/sources/wikidata.test.ts` — the query asks for `en,mul`; the
  alias parser (AC-4, AC-6).
- `src/routes/page.server.test.ts` — ten unowned books, newest first (AC-5).

## Files

- `src/lib/match.ts`
- `src/lib/server/sources/wikidata.ts`, `src/lib/server/refresh.ts`,
  `src/lib/server/books.ts`
- `migrations/003_work_alias.sql`
- `tests/fixtures/wikidata-aliases.json`
- `src/routes/+page.server.ts`
- the tests above

## Out of scope

The series rule. "I own this".

## Notes

Normalise both sides the same way: cut the title at the first colon, bracket or
" - "; drop a leading "the", "a" or "an"; keep letters and digits only, after
removing accents. Authors: turn "Last, First" into "First Last", then keep
letters only. A work matches when any author and the title or an alias match.
Aliases come from a second query in the same refresh.

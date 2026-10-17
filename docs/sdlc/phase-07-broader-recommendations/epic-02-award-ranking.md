# Epic 02 — Award-weight ranking

**Phase:** 07 Broader recommendations
**Goal:** Rank entries from the same award year by award count and wins before title.
**Done criteria covered:** DC-4

## Behaviour

When building the discovery list, entries are still ordered newest award year
first, but ties within the same year are broken by total award entries
descending, then wins descending, and only then alphabetically by title. Multi-
award standouts and winners surface ahead of single-shortlist entries from the
same year.

## Acceptance criteria

- **AC-1** — Given three books in the same year where Book C has three
  shortlistings, Book B has one win, and Book A has one shortlisting, when
  `buildEntries` runs, then it orders them Book C, Book B, Book A despite their
  alphabetical titles.
- **AC-2** — Given a series with two award entries in 2024 and a standalone book
  with one award entry in 2024, when `buildEntries` runs, then the series entry
  ranks ahead of the standalone book.
- **AC-3** — Given two books in the same year with the same award count and win
  count, when `buildEntries` runs, then it orders them alphabetically by title,
  and an entry with a newer award year still ranks ahead of any entry from an
  older year.

## Tests

- `src/lib/discover.test.ts` — AC-1, AC-2, AC-3.
- `src/routes/page.server.test.ts` — AC-1 on `/` with fixture data.

## Files

- `src/lib/discover.ts`
- `src/lib/discover.test.ts`
- `src/routes/page.server.test.ts`

## Out of scope

UI sort controls or filters beyond genre and unknown-genre.

## Notes

Count awards and wins from the group's award books so series entries sum the
awards of their award books.

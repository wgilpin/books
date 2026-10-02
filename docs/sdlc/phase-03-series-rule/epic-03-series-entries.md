# Epic 03 — Series entries

**Phase:** 03 Series rule
**Goal:** Show one entry per series, for the next book I do not own.
**Done criteria covered:** DC-4, DC-5, DC-6, DC-7, DC-8, DC-9, DC-10

## Behaviour

An award book in a series stands for its series. The entry shows the book
after the last one I own, or the lowest-numbered book if I own none, with
"Book N of <series>" and the award badges of the award books it stands for. A
fully owned series is gone. "I own this" on the entry moves it on.

## Acceptance criteria

- **AC-1** — Given a series with books 1 to 4, book 3 shortlisted and book 2
  owned, when entries are built, then the entry is book 3.
- **AC-2** — Given the same series with nothing owned, when entries are built,
  then the entry is book 1.
- **AC-3** — Given every numbered book owned, when entries are built, then the
  series has no entry.
- **AC-4** — Given books 3 and 4 both awarded, when entries are built, then one
  entry stands for both, with both award books' badges and titles.
- **AC-5** — Given an entry for book N of a series, when it is built, then it
  carries N and the series name; the card shows "Book N of <series>".
- **AC-6** — Given a book in two series, when entries are built, then it uses
  the series with fewer numbered members.
- **AC-7** — Given twelve candidate entries, when entries are built with limit
  ten, then ten come back, a series counting once, newest award year first.
- **AC-8** — Given a series entry on `/`, when I press "I own this", then the
  next load shows the following book of that series.
- **AC-9** — Given an award book in no series, when entries are built, then it
  shows as itself, as before.

## Tests

- `src/lib/discover.test.ts` — AC-1 to AC-7, AC-9.
- `src/routes/page.server.test.ts` — AC-8.
- `src/routes/page.test.ts` — AC-5 card line.

## Files

- `src/lib/discover.ts`
- `src/lib/server/books.ts`
- `src/routes/+page.svelte`
- the tests above

## Out of scope

Unnumbered members. Manual series overrides.

## Notes

`discover` is pure: it takes plain records and an `owns` function and returns
entries. "Owned" means the Kindle match or an override.

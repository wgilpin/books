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

---

## Build note — 2026-10-02

**Result:** green

### Tasks done

1. Wrote `discover.test.ts` first, with synthetic series (AC-1 to AC-7,
   AC-9), then `src/lib/discover.ts`: group award books by their most specific
   series, take the book after the last owned one, drop a fully owned series,
   cut to the limit with a series counting once.
2. `listAwardBooks` now loads award books, aliases, series members, the Kindle
   match and the overrides, and calls `buildEntries`.
3. Added route tests: Locked Tomb shows Gideon the Ninth (book 1) for Nona the
   Ninth's award; "I own this" moves it to Harrow the Ninth (AC-8).
4. The card shows "Book N of <series>" and "Award for <award books>" when the
   award book is not the book shown (AC-5).
5. Live check on a scratch build: 216 award books sit in a numbered series. The
   newest is from 2024 (Witch King), so today's top ten (2025–26) hold no
   series entry: Wikidata has no series data yet for most recent books.

### Tests added

- `src/lib/discover.test.ts` — next after last owned; past a gap; lowest when
  none owned; all owned dropped; last owned with gaps dropped; two award books
  one entry; fewer-member series; standalone shown and hidden; limit and order.
- `src/routes/page.server.test.ts` — book 1 for a later award; I own this moves
  the entry on.
- `src/routes/page.test.ts` — "Book N of" line with a decimal position; "Award
  for" line; no repeat when the award book is shown.

### Suite result

`pnpm test` — Test Files 14 passed (14), Tests 87 passed (87).
`pnpm check` — 0 errors, 0 warnings.

### Deviations from the plan

- The AC-8 route test reads `listAwardBooks(db, Infinity)` after the action,
  because the fixture's series books are not in the top ten.
- The ten-newest route test now expects `series: null` on a standalone book.
- My first expectation listed one award entry for Nona the Ninth; it has two
  (two awards), so the test now checks the set of award books.

### Follow-ups

- A series with no English or `mul` label on Wikidata shows its id
  (`Q126690200`).

---

## Review — 2026-10-02

**Verdict:** pass with follow-ups

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `discover.test.ts` — shows the book after the last one I own |
| AC-2 | yes | `discover.test.ts` — lowest-numbered book when I own none; `page.server.test.ts` — Gideon for Nona's award |
| AC-3 | yes | `discover.test.ts` — drops a fully owned series; drops after the last book owned |
| AC-4 | yes | `discover.test.ts` — one entry for two award books, both badges and titles |
| AC-5 | yes | `discover.test.ts` — series name and position; `page.test.ts` — "Book N of" line |
| AC-6 | yes | `discover.test.ts` — fewer-member series |
| AC-7 | yes | `discover.test.ts` — limit, order, a series counting once |
| AC-8 | yes | `page.server.test.ts` — I own this moves the entry to Harrow the Ninth |
| AC-9 | yes | `discover.test.ts` — standalone shown and hidden |

Suite run by the reviewer: `pnpm test` — 87 passed.

### Drift

None. `discover` is pure and holds the core rule, as `architecture.md` names
it. The concept's series rule (next unowned, book 1 if none, drop if all owned)
is what the tests prove.

### Findings

- Low: a series name falls back to its Wikidata id when no `en` or `mul` label
  exists.
- Low: the decision "after the last owned book" means owning only book 4 of 4
  drops the series, even when books 1 to 3 are unowned. This follows the
  concept's rule; it is not a defect.

### Follow-ups

- Series names with no label show as an id.

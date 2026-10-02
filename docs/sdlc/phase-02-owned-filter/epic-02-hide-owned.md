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

---

## Build note — 2026-10-02

**Result:** green

### Tasks done

1. Wrote the matching tests first, then `titleKey`, `authorKey` and
   `ownedIndex` in `src/lib/match.ts` (AC-1 to AC-4).
2. Ran the match against the real `data/kindle_books.csv` (2,324 books) and a
   live set of 913 award works: 95 matched. A near-miss scan found 3 pairs, all
   real differences ("Schismatrix" against "Schismatrix Plus", "Dune World"
   against "Dune", "Time" against "Time's Eye").
3. Changed the label language to `en,mul` and added the alias query and parser
   (AC-4, AC-6).
4. Added `migrations/003_work_alias.sql`; the refresh runs both queries, caches
   both responses and replaces the aliases in the same transaction.
5. `listAwardBooks` drops owned works and cuts the list to ten; `/` uses it
   (AC-5).
6. Live check on a scratch build: refresh, then real import. 0 of 913 works
   show a Wikidata id as author or title (29 authors and 5 titles before);
   79 aliases stored; `/` lists ten 2026 books.

### Tests added

- `src/lib/match.test.ts` — titleKey: store copy cut; case, accents,
  punctuation, article. authorKey: "Last, First"; initials and accents.
  ownedIndex: author and title; any one of several authors; not the same title
  by a different author; not a different title by the same author; alias.
- `src/lib/server/sources/wikidata.test.ts` — `en,mul` labels; alias query;
  alias parser.
- `src/lib/server/refresh.test.ts` — stores aliases of award books only.
- `src/lib/server/books.test.ts` — all books with no owned list; hides a store
  title; hides by alias; keeps a different author; limit after removal.
- `src/routes/page.server.test.ts` — ten newest, all 2024 in the fixture;
  owned books left out.

### Suite result

`pnpm test` — Test Files 13 passed (13), Tests 56 passed (56).
`pnpm check` — 0 errors, 0 warnings.

### Deviations from the plan

- Added `src/lib/server/books.test.ts` and `src/lib/server/sources/types.ts`
  changes, which the epic did not list.
- The refresh tests now serve the alias fixture for the alias query, and expect
  two cached responses.
- Fixed ISS-5 here, as the phase plan scheduled.

### Follow-ups

- A work title with its own colon ("The Red: First Light") is cut before the
  colon on both sides. Two books by one author that share the part before the
  colon would match each other.

---

## Review — 2026-10-02

**Verdict:** pass with follow-ups

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `match.test.ts` — store copy cut; "Last, First"; `ownedIndex` author and title; `books.test.ts` — hides a store title |
| AC-2 | yes | `match.test.ts` — initials, dots and accents |
| AC-3 | yes | `match.test.ts` — not the same title by a different author; `books.test.ts` — keeps a different author |
| AC-4 | yes | `match.test.ts` — alias; `books.test.ts` — hides by alias; `refresh.test.ts` — stores aliases |
| AC-5 | yes | `page.server.test.ts` — ten newest; owned left out; `books.test.ts` — limit after removal |
| AC-6 | yes | `wikidata.test.ts` — query asks for `en,mul`; live check in the build note shows 0 id-only names. The fixture predates the change, so no fixture row carries a `mul` label |

Suite run by the reviewer: `pnpm test` — 56 passed.

### Drift

None. Matching is author first, then title, strict, as `architecture.md`
says, and uses aliases, as its risk list asks. `match` is pure and touches no
database.

### Findings

- Low: AC-6 is proved by the query text and a live run, not by a parser test
  on a `mul` row. The parser ignores the label language, so the risk is small.
- Low: the colon cut on work titles (build note follow-up).
- Low: `listAwardBooks` reads every work, alias and owned row on each page
  load. At 913 works and 2,324 owned books this takes milliseconds.

### Follow-ups

- Two books by one author that share the text before a colon match each other.

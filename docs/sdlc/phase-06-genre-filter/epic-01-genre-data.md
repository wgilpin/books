# Epic 01 — Genre data

**Phase:** 06 Genre filter
**Goal:** Store each award book's Wikidata genres and classify them.
**Done criteria covered:** DC-1, DC-2

## Behaviour

A refresh also fetches the genre labels of every award book and stores them. A
pure classifier says whether a book is science fiction, fantasy, both or
unknown.

## Acceptance criteria

- **AC-1** — Given the genre fixture, when it is parsed, then each row gives a
  book id and a genre label.
- **AC-2** — Given a refresh, when it ends, then `work_genre` holds the labels
  of the award books, and a second refresh adds no duplicates.
- **AC-3** — Given the label "science fiction", "space opera", "cyberpunk
  novel", "dystopian fiction", "post-apocalyptic fiction" or "time-travel
  fiction", when classified, then the book is science fiction.
- **AC-4** — Given a label containing "fantasy", when classified, then the book
  is fantasy; "science fantasy" makes it both.
- **AC-5** — Given no science fiction label but a Clarke entry, when
  classified, then the book is science fiction.
- **AC-6** — Given no label, or only labels like "horror fiction", and no
  Clarke entry, when classified, then the genre is unknown.

## Tests

- `src/lib/server/sources/wikidata.test.ts` — AC-1.
- `src/lib/server/refresh.test.ts` — AC-2.
- `src/lib/genre.test.ts` — AC-3 to AC-6.

## Files

- `migrations/006_work_genre.sql`
- `src/lib/genre.ts`
- `src/lib/server/sources/wikidata.ts`, `src/lib/server/refresh.ts`
- `tests/fixtures/wikidata-genres.json`, `tests/fake-wikidata.ts`
- the tests above

## Out of scope

The filter on `/` (epic 02).

## Notes

Store raw labels, not the classification, so a rule change needs no refresh.

---

## Build note — 2026-10-02

**Result:** green

### Tasks done

1. Trimmed the live genre response from the ISS-8 check (787 of 913 award
   books tagged) to the fixture award books: 37 rows.
2. Wrote the classifier, parser and refresh tests first.
3. Added `src/lib/genre.ts` (`classifyGenre`), `GENRES_QUERY` and
   `parseGenres`, `migrations/006_work_genre.sql`, and `storeGenres` in the
   refresh transaction. The shared fake answers the genre query.

### Tests added

- `src/lib/genre.test.ts` — eight science fiction labels; fantasy labels;
  science fantasy and mixed as both; Clarke as science fiction; unknown.
- `src/lib/server/sources/wikidata.test.ts` — genre query; genre parser.
- `src/lib/server/refresh.test.ts` — labels stored once each across two
  refreshes.

### Suite result

`pnpm test` — Test Files 15 passed (15), Tests 102 passed (102).
`pnpm check` — 0 errors, 0 warnings.

### Deviations from the plan

- My first expected row count (24) was wrong. A series-member work
  (`Q30131633`, an award book with no dated award) also gets its labels, so
  the count is 25.
- "postcyberpunk" and "hard science fiction" are covered by the same rule.
- The refresh tests expect five cached responses.

### Follow-ups

None.

---

## Review — 2026-10-02

**Verdict:** pass

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `wikidata.test.ts` — genre label with book id |
| AC-2 | yes | `refresh.test.ts` — labels stored once each across two refreshes |
| AC-3 | yes | `genre.test.ts` — eight science fiction labels |
| AC-4 | yes | `genre.test.ts` — fantasy labels; science fantasy as both |
| AC-5 | yes | `genre.test.ts` — Clarke entry as science fiction |
| AC-6 | yes | `genre.test.ts` — no label and other-only labels unknown |

Suite run by the reviewer: `pnpm test` — 102 passed.

### Drift

None. Wikidata stays the only source; the classifier is pure.

### Findings

- None that change behaviour.

### Follow-ups

None.

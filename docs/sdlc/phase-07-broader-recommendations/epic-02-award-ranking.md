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

---

## Build note — 2026-10-17

**Result:** green

### Tasks done

1. Wrote failing tests in `src/lib/discover.test.ts` and
   `src/routes/page.server.test.ts` for same-year award-weight and win-count
   tie-breaking on standalone and series entries.
2. Updated `buildEntries` in `src/lib/discover.ts` to sort groups by newest
   award year descending, then total award count descending, then win count
   descending, then title alphabetically.

### Tests added

- `src/lib/discover.test.ts` — orders books in the same year by award count,
  then win count, then title; orders a series entry ahead of a standalone book
  in the same year when the series has more awards.
- `src/routes/page.server.test.ts` — `/ load` asserts that 2024 entries sort by
  award count descending with multi-award books first.

### Suite result

`pnpm test` — `Test Files 22 passed (22)`, `Tests 200 passed (200)`.
`pnpm check` — `svelte-check found 0 errors and 0 warnings`.

### Deviations from the plan

None.

### Follow-ups

None.

---

## Review — 2026-10-17

**Verdict:** pass

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `discover.test.ts` — orders books in the same year by award count, then win count, then title; `page.server.test.ts` — `/ load` sorts 2024 entries by award count |
| AC-2 | yes | `discover.test.ts` — orders a series entry ahead of a standalone book in the same year when the series has more awards |
| AC-3 | yes | `discover.test.ts` — orders books in the same year by award count, then win count, then title (`Alpha` before `Delta`, and 2024 entries before 2023 `Older Hit`) |

Suite run for review: `pnpm test` — `Test Files 22 passed (22)`, `Tests 200 passed (200)`.

### Drift

None. `discover.ts` remains pure and newest award year remains the primary sort
key.

### Findings

- None that change behaviour.

### Follow-ups

None.

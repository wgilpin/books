# Epic 01 — Marks: Read and Reject

**Phase:** 05 Triage
**Goal:** Mark a book owned, read or rejected, with Reject dropping a series.
**Done criteria covered:** DC-1, DC-2, DC-3, DC-4, DC-7

## Behaviour

Each card has "I own this", "Read" and "Reject". Read works like owning.
Reject removes a standalone book for good and a whole series from a series
entry. Earlier "I own this" marks carry over.

## Acceptance criteria

- **AC-1** — Given the old `owned_override` rows, when the migration runs, then
  each becomes an `owned` mark and the old table is gone.
- **AC-2** — Given a book marked twice, when the second mark is saved, then only
  the second remains.
- **AC-3** — Given a series member marked read, when entries are built, then it
  counts as owned: the entry moves past it.
- **AC-4** — Given a standalone award book marked rejected, when entries are
  built, then it has no entry.
- **AC-5** — Given any member of a series marked rejected, when entries are
  built, then the series has no entry.
- **AC-6** — Given `/`, when I post `mark=read` or `mark=rejected` for an entry,
  then the next load reflects AC-3 to AC-5, after an import and a refresh too.
- **AC-7** — Given a card, when it renders, then it has "I own this", "Read" and
  "Reject" buttons posting `mark`, each with the book title in its accessible
  name.
- **AC-8** — Given a post with an unknown mark, when the action runs, then it
  fails with 400 and saves nothing.

## Tests

- `src/lib/server/db.test.ts` — AC-1.
- `src/lib/server/marks.test.ts` — AC-2.
- `src/lib/discover.test.ts` — AC-3 to AC-5.
- `src/routes/page.server.test.ts` — AC-6, AC-8.
- `src/routes/page.test.ts` — AC-7.

## Files

- `migrations/007_book_mark.sql`
- `src/lib/server/marks.ts` (replaces `markOwned` in `owned.ts`)
- `src/lib/discover.ts`, `src/lib/server/books.ts`
- `src/routes/+page.server.ts`, `src/routes/+page.svelte`
- the tests above

## Out of scope

Queue (epic 02). Undo.

## Notes

`discover` takes a `markOf(work)` function returning `owned`, `read`,
`rejected`, `queued` or nothing; the Kindle match counts as `owned`.

---

## Build note — 2026-10-02

**Result:** green

### Tasks done

1. Wrote the tests first: migration, `markBook`, the `discover` rules, the
   route and the buttons.
2. Added `migrations/007_book_mark.sql`: `book_mark` with a mark check, old
   overrides copied as `owned`, `owned_override` dropped (AC-1).
3. Added `src/lib/server/marks.ts` (`markBook`, `marksBySource`, `isMark`);
   removed `markOwned` (AC-2).
4. `discover` takes `markOf`: owned and read count as done; a rejected
   standalone book or any rejected series member drops the entry (AC-3 to
   AC-5).
5. One `mark` action replaces `own`; it rejects an unknown mark with 400
   (AC-6, AC-8).
6. Each card has I own this, Read and Reject in one form, each button naming
   its book (AC-7).
7. Scratch check: the migration turned 2 old overrides into 2 `owned` marks and
   dropped the old table; Reject on the first entry returned 200 and removed it.

### Tests added

- `src/lib/server/db.test.ts` — migration 007 copies overrides and drops the
  table.
- `src/lib/server/marks.test.ts` — latest mark wins; unknown mark throws.
- `src/lib/discover.test.ts` — read counts as owned; rejected standalone;
  rejected series member, first and later.
- `src/routes/page.server.test.ts` — Read moves a series on; Reject drops a
  series through an import and a refresh; Reject removes a standalone book;
  unknown mark 400.
- `src/routes/page.test.ts` — three mark buttons with accessible names.

### Suite result

`pnpm test` — Test Files 16 passed (16), Tests 123 passed (123).
`pnpm check` — 0 errors, 0 warnings.

### Deviations from the plan

- The `own` action is now `mark`. Two earlier tests (form action, own helper)
  now post to `mark`; the route tests share a `resetDb` helper.
- `discover` tests use `markOf` in place of `owns`.
- Reject is a quiet button, so it reads as the least likely action.

### Follow-ups

None.

---

## Review — 2026-10-02

**Verdict:** pass

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `db.test.ts` — migration 007 |
| AC-2 | yes | `marks.test.ts` — latest mark wins |
| AC-3 | yes | `discover.test.ts` — read counts as owned; `page.server.test.ts` — Read moves the series on |
| AC-4 | yes | `discover.test.ts` — rejected standalone; `page.server.test.ts` — removed for good |
| AC-5 | yes | `discover.test.ts` — rejected series member; `page.server.test.ts` — series stays gone after import and refresh |
| AC-6 | yes | `page.server.test.ts` — Read and Reject tests |
| AC-7 | yes | `page.test.ts` — three mark buttons with accessible names |
| AC-8 | yes | `page.server.test.ts` — unknown mark 400, nothing saved |

Suite run by the reviewer: `pnpm test` — 123 passed.

### Drift

None. Marks keyed by source and source id (ADR 0002); the rule stays in the
pure `discover` module.

### Findings

- None that change behaviour.

### Follow-ups

None.

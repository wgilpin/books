# Epic 03 — "I own this" button

**Phase:** 02 Owned filter
**Goal:** Hide a book the match missed, for good.
**Done criteria covered:** DC-6

## Behaviour

Each entry on `/` has an "I own this" button. Pressing it hides the book. It
stays hidden after a new Kindle import and after a Wikidata refresh.

## Acceptance criteria

- **AC-1** — Given a book on `/`, when I press "I own this", then the next load
  does not include it.
- **AC-2** — Given an overridden book, when I import a new Kindle CSV, then the
  book stays hidden.
- **AC-3** — Given an overridden book, when a refresh runs, then the book stays
  hidden.
- **AC-4** — Given a book on `/`, when the page renders, then the entry has an
  "I own this" form that posts its id.

## Tests

- `src/routes/page.server.test.ts` — AC-1 to AC-3.
- `src/routes/page.test.ts` — AC-4.

## Files

- `migrations/004_owned_override.sql`
- `src/lib/server/books.ts`, `src/lib/server/owned.ts`
- `src/routes/+page.server.ts`, `src/routes/+page.svelte`
- the tests above

## Out of scope

Undoing an override.

## Notes

Key the override on `source` and `source_id`, so it survives a rebuild of the
`work` table (ADR 0002).

---

## Build note — 2026-10-02

**Result:** green

### Tasks done

1. Wrote the route and render tests first (AC-1 to AC-4).
2. Added `migrations/004_owned_override.sql`, keyed on `source` and
   `source_id`, and `markOwned`.
3. `listAwardBooks` skips overridden works and now returns `source` and
   `sourceId` for each book.
4. Added the `own` action and an "I own this" form on each entry.
5. Smoke check on a scratch build with live data: posting `own` for the first
   book returned 200; the book left the list and ten entries remained.

### Tests added

- `src/routes/page.server.test.ts` — hides the book on the next load; stays
  hidden after a new Kindle import; stays hidden after a refresh; rejects a
  request with no book.
- `src/routes/page.test.ts` — each entry has a form that posts its source and
  id.

### Suite result

`pnpm test` — Test Files 13 passed (13), Tests 61 passed (61).
`pnpm check` — 0 errors, 0 warnings.

### Deviations from the plan

- The form posts `source` and `sourceId`, not an internal id, so the override
  key matches the table key.
- The ten-newest test now expects `source` and `sourceId` on each book.

### Follow-ups

None.

---

## Review — 2026-10-02

**Verdict:** pass

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `page.server.test.ts` — hides the book on the next load |
| AC-2 | yes | `page.server.test.ts` — keeps the book hidden after a new Kindle import |
| AC-3 | yes | `page.server.test.ts` — keeps the book hidden after a refresh |
| AC-4 | yes | `page.test.ts` — each entry has a form that posts its source and id |

Suite run by the reviewer: `pnpm test` — 61 passed.

### Drift

None. The override is keyed by source and source id, as `architecture.md` and
ADR 0002 say. The page uses plain forms and no JavaScript.

### Findings

- None that change behaviour. The `own` action accepts any source and id, but
  the app is reachable on `localhost` only in this phase, and an unknown id
  hides nothing.

### Follow-ups

None.

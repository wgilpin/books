# Epic 02 — User isolation

**Phase:** 08 Second user
**Goal:** Scope `owned`, `owned_import` and `book_mark` to the logged-in user so both users have independent Kindle libraries, marks, lists and queues on the shared catalog.
**Done criteria covered:** DC-4, DC-5

## Behaviour

Migration `009_user_scope.sql` rebuilds `owned`, `owned_import` and `book_mark`
with a `user TEXT NOT NULL DEFAULT '1'` column, keeping all existing rows under
user `'1'`. Every read and write on those tables (`replaceOwned`, `ownedSummary`,
`markBook`, `marksBySource`, `markFromForm`, `queueCount`, `listQueue`,
`listAwardBooks`) scopes by `user`, and the server routes (`/`, `/queue`,
`/import`, `+layout.server.ts`) pass `locals.user`.

## Acceptance criteria

- **AC-1** — Given a database at migration 008 with rows in `owned`,
  `owned_import` and `book_mark`, when migration `009_user_scope.sql` runs, then
  all existing rows belong to user `'1'` and user `'2'` can insert rows with the
  same `asin` or `(source, source_id)` without conflict.
- **AC-2** — Given user `'1'` has imported a Kindle CSV on `/import`, when user
  `'2'` loads `/import` and uploads her own CSV, then user `'2'` sees only her
  own count and import time and user `'1'`'s `owned` rows and summary are
  unchanged.
- **AC-3** — Given user `'1'` owns or marks a book (`owned`, `read`, `rejected`,
  `queued`), when user `'2'` loads `/`, then that book still appears for user
  `'2'` (and series position is calculated from user `'2'`'s own books and
  marks).
- **AC-4** — Given user `'1'` and user `'2'` each queue different books, when
  each loads `/queue` and the layout header, then each sees only their own
  queued books and `queueCount`, and marking a book on `/` or `/queue` changes
  only that user's mark.

## Tests

- `src/lib/server/db.test.ts` — AC-1.
- `src/routes/import/page.server.test.ts` — AC-2.
- `src/lib/server/marks.test.ts` — AC-3, AC-4.
- `src/routes/page.server.test.ts` — AC-3, AC-4.
- `src/routes/queue/page.server.test.ts` — AC-4.

## Files

- `migrations/009_user_scope.sql`
- `src/lib/server/owned.ts`
- `src/lib/server/marks.ts`
- `src/lib/server/books.ts`
- `src/routes/+layout.server.ts`
- `src/routes/+page.server.ts`
- `src/routes/queue/+page.server.ts`
- `src/routes/import/+page.server.ts`
- the tests above

## Out of scope

Per-user genre overrides or Wikidata refreshes — those remain shared across both
users.

## Notes

Default `user = '1'` on the server helper functions and `locals?.user ?? '1'` in
route actions/loads so existing single-user unit tests keep working alongside
the new multi-user isolation tests.

---

## Build note — 2026-10-18

**Result:** green

### Tasks done

1. Added `migrations/009_user_scope.sql` to rebuild `owned`, `owned_import` and
   `book_mark` with `user TEXT NOT NULL DEFAULT '1'`, preserving all existing
   rows under user `'1'` (AC-1).
2. Updated `replaceOwned` and `ownedSummary` in `src/lib/server/owned.ts` and
   `src/routes/import/+page.server.ts` to filter and write per `user` (AC-2).
3. Updated `markBook`, `marksBySource`, `markFromForm`, `queueCount` and
   `listQueue` in `src/lib/server/marks.ts`, `listAwardBooks` in
   `src/lib/server/books.ts`, and `src/routes/+layout.server.ts`,
   `src/routes/+page.server.ts` and `src/routes/queue/+page.server.ts` to scope
   by `user` (AC-3, AC-4).

### Tests added

- `src/lib/server/db.test.ts` — migration 009 scopes `owned`, `owned_import`
  and `book_mark` by `user`, keeping existing rows under user `'1'`.
- `src/routes/import/page.server.test.ts` — keeps each user's owned list and
  import summary separate.
- `src/lib/server/marks.test.ts` — keeps marks separate per user.
- `src/routes/page.server.test.ts` — isolates owned books, marks and series
  progress between user `'1'` and user `'2'`.
- `src/routes/queue/page.server.test.ts` — lists and marks only the logged-in
  user's queue.
- `src/routes/layout.server.test.ts` — returns `queueCount` for the logged-in
  user only.

### Suite result

`pnpm test` — `Test Files 26 passed (26)`, `Tests 229 passed (229)`.
`pnpm check` — `svelte-check found 0 errors and 0 warnings`.

### Deviations from the plan

- Built on the same branch (`epic-01-user-sessions`) before landing on `main`.

### Follow-ups

None.

---

## Review — 2026-10-18

**Verdict:** pass

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `db.test.ts` — migration 009 preserves existing rows under `'1'` and allows `'2'` rows for the same ASIN and work |
| AC-2 | yes | `import/page.server.test.ts` — keeps each user's owned list and import summary separate |
| AC-3 | yes | `marks.test.ts` and `page.server.test.ts` — isolates owned books, marks and series progress between user `'1'` and user `'2'` |
| AC-4 | yes | `queue/page.server.test.ts` and `layout.server.test.ts` — lists, counts and marks only the logged-in user's queue |

Suite run for review: `pnpm test` — `Test Files 26 passed (26)`, `Tests 229 passed (229)`. `pnpm check` — `0 errors and 0 warnings`.

### Drift

None.

### Findings

- None that change behaviour.

### Follow-ups

None.


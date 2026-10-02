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

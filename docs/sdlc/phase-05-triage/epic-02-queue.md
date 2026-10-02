# Epic 02 — Queue

**Phase:** 05 Triage
**Goal:** Queue a book for later and see the queue on its own page.
**Done criteria covered:** DC-1, DC-5, DC-6

## Behaviour

Each card gets a "Queue" button. A queued book leaves the list, and its series
waits on it. `/queue` lists queued books, newest first, with Kindle and the
other marks. The header shows "Queue (N)".

## Acceptance criteria

- **AC-1** — Given a series entry whose book is queued, when entries are built,
  then the series has no entry on the list.
- **AC-2** — Given a standalone queued book, when entries are built, then it has
  no entry on the list.
- **AC-3** — Given queued books, when `/queue` loads, then it returns them
  newest queued first, each with title, author, Kindle link and series line.
- **AC-4** — Given `/queue`, when it renders, then each card has Kindle, "I own
  this", "Read" and "Reject", and an empty queue says "Nothing queued".
- **AC-5** — Given queued books, when any page renders the header, then it
  shows a "Queue (N)" link.
- **AC-6** — Given a card on `/`, when it renders, then it has a "Queue"
  button with the title in its accessible name.
- **AC-7** — Given a queued book, when I mark it read on `/queue`, then it
  leaves the queue.

## Tests

- `src/lib/discover.test.ts` — AC-1, AC-2.
- `src/routes/queue/page.server.test.ts` — AC-3, AC-7.
- `src/routes/queue/page.test.ts` — AC-4.
- `src/routes/page.test.ts` — AC-5, AC-6.

## Files

- `src/lib/server/marks.ts`, `src/lib/discover.ts`
- `src/routes/+layout.server.ts`
- `src/routes/queue/+page.server.ts`, `src/routes/queue/+page.svelte`
- `src/lib/components/BookCard.svelte`
- `src/routes/+page.svelte`, `src/lib/components/PageHeader.svelte`
- the tests above

## Out of scope

Reordering the queue. Undo.

## Notes

The book card moves into `BookCard.svelte` so `/` and `/queue` share it.

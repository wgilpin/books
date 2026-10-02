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

---

## Build note — 2026-10-02

**Result:** green

### Tasks done

1. Wrote the tests first: `discover` queue rules, `/queue` load and action,
   `/queue` render, and the Queue button and header link on `/`.
2. `discover` leaves out a queued standalone book and any series with a queued
   member (AC-1, AC-2).
3. Added `listQueue`, `queueCount` and `markFromForm` to `marks.ts`; both pages
   use the one form action.
4. Added `src/routes/+layout.server.ts` (`queueCount`), the `/queue` page, and
   `BookCard.svelte`, now shared by `/` and `/queue` (AC-3, AC-4, AC-7).
5. Each card on `/` has Queue; `/` and `/import` link to "Queue (N)" (AC-5,
   AC-6).
6. Scratch check: queueing the first entry returned 200; the header showed
   "Queue (1)"; the book left `/` and showed on `/queue`. Screenshots of `/`
   and `/queue` at 360px in light mode: buttons wrap cleanly.

### Tests added

- `src/lib/discover.test.ts` — queued series member; queued standalone.
- `src/routes/queue/page.server.test.ts` — empty; newest first with series
  line; Read on the queue page removes the book.
- `src/routes/queue/page.test.ts` — empty notice; card with three marks and no
  Queue.
- `src/routes/page.test.ts` — Queue button; header link with count.
- `src/routes/import/page.test.ts` — header link with count.

### Suite result

`pnpm test` — Test Files 18 passed (18), Tests 133 passed (133).
`pnpm check` — 0 errors, 0 warnings.

### Deviations from the plan

- The queue link sits in each page's header actions, not inside
  `PageHeader.svelte`.
- A series with any queued member leaves the list, not only when the next book
  is queued.
- Queued books show no award badges on `/queue`.

### Follow-ups

- Show the award badges on `/queue`.

---

## Review — 2026-10-02

**Verdict:** pass with follow-ups

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `discover.test.ts` — queued series member |
| AC-2 | yes | `discover.test.ts` — queued standalone |
| AC-3 | yes | `queue/page.server.test.ts` — newest first with author, Kindle link and series line |
| AC-4 | yes | `queue/page.test.ts` — empty notice; three marks, no Queue |
| AC-5 | yes | `page.test.ts`, `import/page.test.ts` — "Queue (N)" link |
| AC-6 | yes | `page.test.ts` — Queue button with accessible name |
| AC-7 | yes | `queue/page.server.test.ts` — Read removes the book from the queue |

Suite run by the reviewer: `pnpm test` — 133 passed.

### Drift

None. The design's card, buttons and notices are reused; no JavaScript.

### Findings

- Low: `/queue` cards carry no award badges, so the reason a book was queued is
  less visible there.

### Follow-ups

- Award badges on `/queue`.

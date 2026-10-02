# Phase 05 — Triage

**Goal:** Remember what I decided about each book.

Includes ISS-11: Reject sits beside "I own this"; on a series entry it drops
the whole series.

## Scope

One `book_mark` table for owned, read, rejected and queued, replacing
`owned_override`. One `mark` form action. The `discover` rule learns read,
rejected and queued. A `/queue` page and a queue link in the header.

## Done criteria

- **DC-1** — Each card has "I own this", "Read", "Queue" and "Reject"
  buttons, each naming its book for screen readers.
- **DC-2** — "Read" works like "I own this": a standalone book leaves the list,
  and a series entry moves on to the next book.
- **DC-3** — "Reject" removes a standalone book for good; on a series entry it
  removes the whole series (ISS-11).
- **DC-4** — Marks survive a Kindle import and a refresh, and the "I own this"
  marks made before this phase carry over.
- **DC-5** — "Queue" removes the entry from the list, and the series does not
  move on.
- **DC-6** — `/queue` lists the queued books, newest first, each with its
  Kindle link and "I own this", "Read" and "Reject"; the header shows
  "Queue (N)".
- **DC-7** — A new mark on a book replaces its earlier mark.

## Not in this phase

Undoing a mark. A Goodreads import, ratings, notes.

## Epics

1. `epic-01-marks.md` — the mark table and action, Read and Reject.
2. `epic-02-queue.md` — Queue, the `/queue` page and the header link.

Epic 02 needs epic 01.

## Risks

- Four buttons per card at 360px. They wrap; the design allows it.

# Phase 02 — Owned filter

**Goal:** Hide every book I own on Kindle.

## Scope

An `/import` page that replaces the owned list from the Kindle CSV. The `kindle`
and `match` modules. Aliases and `mul` labels from Wikidata (fixes ISS-5). The
`/` list cut to the ten newest award books I do not own. An "I own this" button
on each entry, backed by an override table.

## Done criteria

- **DC-1** — Uploading `kindle_books.csv` on `/import` replaces the owned list
  and reports how many books it read.
- **DC-2** — A file without the `asin,title,author` header is rejected with an
  error, and the old owned list stays.
- **DC-3** — An award book I own is not on `/`.
- **DC-4** — The match handles "Last, First" authors, several authors split by
  `;`, store copy after a colon or bracket, case, accents and punctuation, and
  Wikidata aliases. The same title by a different author does not match.
- **DC-5** — `/` shows the ten newest award books I do not own, newest award
  year first.
- **DC-6** — "I own this" on an entry removes it from `/`, and it stays hidden
  after a new import and a refresh.
- **DC-7** — Authors and titles with a `mul` label on Wikidata show that name,
  not a Wikidata id (ISS-5).

## Not in this phase

The series rule. A shortlisted book 3 still shows as itself. Paging past ten
entries. Undoing "I own this".

## Epics

1. `epic-01-kindle-import.md` — the `/import` page, CSV parsing, and the export
   script in `scripts/`.
2. `epic-02-hide-owned.md` — aliases and `mul` labels, matching, and the
   ten-entry list.
3. `epic-03-own-button.md` — the "I own this" override.

Each epic runs on top of the one before.

## Risks

- A false match hides a book I want, with no sign. The match stays strict:
  author and title must both match.
- The schema gains tables. The live container migrates on its next start,
  which needs a `docker` command and your yes.

# Phase 06 — Genre filter

**Goal:** Narrow the list to science fiction or to fantasy.

## Scope

A Wikidata genre query in the refresh and a `work_genre` table with the raw
genre labels. A pure classifier that turns labels and awards into science
fiction, fantasy, both, or unknown. A `?genre=` filter on `/`, with All /
Science fiction / Fantasy links, and a "genre unknown" tag on cards.

## Done criteria

- **DC-1** — A refresh stores the Wikidata genre labels of each award book.
- **DC-2** — A book is science fiction when a genre label names science
  fiction (or space opera, cyberpunk, dystopian, post-apocalyptic or
  time-travel fiction), or it has a Clarke entry. It is fantasy when a label
  names fantasy. It can be both. Otherwise its genre is unknown.
- **DC-3** — `/` has All, Science fiction and Fantasy links, and marks the
  current one.
- **DC-4** — `/?genre=sf` lists ten entries that are science fiction or
  unknown; `/?genre=fantasy` lists ten that are fantasy or unknown; `/` lists
  all, as before.
- **DC-5** — An entry with unknown genre carries a "genre unknown" tag.
- **DC-6** — A series entry takes its genre from its award books.
- **DC-7** — An unrecognised `genre` value shows All.

## Not in this phase

Other genres. Several filters at once. Remembering the filter.

## Epics

1. `epic-01-genre-data.md` — genre query, table, refresh and classifier.
2. `epic-02-genre-filter.md` — the filter in `discover`, the links and the tag.

Epic 02 needs epic 01.

## Risks

- Wikidata tags some books loosely. The classifier uses the labels as they
  are; a wrong tag puts a book under the wrong filter.

# Phase 03 — Series rule

**Goal:** One entry per series, showing the next book I do not own. First,
apply the approved design to the existing pages, so the series card is built
styled.

## Scope

A global stylesheet from `docs/sdlc/design-kit/tokens.css`, and the List and
Import pages restyled to `design.md`. A Wikidata series query, `series` and
`series_entry` tables, and a refresh that stores them. A pure `discover`
module that turns award books, series and the owned set into entries. A series
line on the book card.

## Done criteria

- **DC-1** — `/` and `/import` use the design: page header, book cards, award
  badges (won filled, shortlisted outlined), primary and secondary buttons and
  notices, in light and dark mode, readable at 360px wide.
- **DC-2** — Each "I own this" button names its book for screen readers, and
  each Kindle link says it opens a new tab.
- **DC-3** — A refresh stores each series that holds an award book, with its
  numbered members and their positions.
- **DC-4** — An award book in a series shows as one entry for that series: the
  book after the last one I own.
- **DC-5** — If I own no numbered book in the series, the entry shows the
  lowest-numbered book.
- **DC-6** — If I own every numbered book in the series, the series is not
  listed.
- **DC-7** — A series entry says "Book N of <series>" and shows the award
  badges of the award books it stands for, with their titles.
- **DC-8** — Two award books in one series give one entry.
- **DC-9** — "I own this" on a series entry hides that book, and the entry moves
  on to the next book.
- **DC-10** — The list holds ten entries, a series counting once.

## Not in this phase

A manual series override for Wikidata gaps. Series members with no number.
Undoing "I own this". Login. Triage.

## Epics

1. `epic-01-apply-design.md` — stylesheet and restyled List and Import.
2. `epic-02-series-data.md` — series query, tables and refresh.
3. `epic-03-series-entries.md` — the `discover` rule and the series card.

Epic 02 and epic 01 are independent. Epic 03 needs both.

## Risks

- Wikidata series gaps: a later book with no series data shows as itself.
- A book in two series (a sub-series and a universe). The rule takes the series
  with the fewest numbered members, which is the most specific.

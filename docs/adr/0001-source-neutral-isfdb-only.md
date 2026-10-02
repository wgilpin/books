# 0001 — Source-neutral data model, ISFDB as the only source

**Status:** accepted
**Date:** 2026-10-02

## Context

The list needs four facts for each award novel: the award, the result (won or
shortlisted), the series, and the book's position in the series. The series
rule also needs every other book in that series. The volume is small: about 25
award novels a year, plus their series, so a few hundred works.

ISFDB holds all four facts. It offers web pages and a full MySQL dump, but no
API for awards or series. Wikipedia holds the shortlists but not series order.

## Decision

The data model is source-neutral. Every work, award entry, series and series
entry carries `source` and `source_id`, unique together. Each source is a
module behind one interface that returns plain records.

v1 has one source: ISFDB, read by scraping award-year and series pages at one
request a second. The raw pages are cached in SQLite, so parsing never fetches
and a page is fetched once.

## Consequences

- A second source is a new module, with no schema change.
- A refresh upserts on `source` and `source_id`, so internal ids stay stable.
  "I own this" ticks are keyed the same way and survive a full rebuild.
- The app depends on ISFDB's HTML. A change breaks the parsers. Tests run the
  parsers against saved fixture pages, and a failed refresh rolls back.
- The source layer is extra structure while only one source exists.

## Alternatives rejected

- **Load the ISFDB MySQL dump.** No HTML risk, but it needs a MySQL container
  and a large dump to extract a few thousand rows. It stays the fallback if
  scraping fails.
- **Merge several sources now** (Wikipedia for shortlists, ISFDB or Open
  Library for series). Merging needs a step that decides when two records are
  the same book, which repeats the fuzzy title-matching problem between
  sources. It buys nothing until one source fails.
- **ISFDB-specific schema.** Simpler today, but a second source would mean a
  schema migration.

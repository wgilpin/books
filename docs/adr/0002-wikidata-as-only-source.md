# 0002 — Wikidata as the only source

**Status:** accepted
**Date:** 2026-10-02

Supersedes [0001](0001-source-neutral-isfdb-only.md). The source-neutral data
model from 0001 stands. The source changes.

## Context

ADR 0001 chose ISFDB scraping. The spike found that every ISFDB web page, its
wiki, and its dump download page sit behind a Cloudflare bot challenge. The
ISFDB REST API is open but returns single publications, with no awards or
series.

Wikidata runs a public SPARQL service built for scripts. In two queries, the
spike returned 198 award novels from 2015 to 2025, with complete Hugo, Nebula,
Clarke and BSFA shortlists, year and result. Established series list every book
with its position.

## Decision

Wikidata is the only source. The `sources/wikidata` module runs two queries:
award novels with year, result and series; then every member of those series
with its position. Raw responses are cached in SQLite. A refresh runs only when
I ask for it.

The series rule uses numbered series members only.

## Consequences

- One source, two requests, no HTML parsing.
- Series membership lags for recent books. A later book with no series data
  shows as itself, not as the next book I need. I fix a gap by editing
  Wikidata.
- Anyone can edit Wikidata. A refresh can lose or change a row. A failed
  refresh rolls back.
- Wikimedia asks scripts to send a user agent that names the tool and a
  contact. My global rule fixes a generic one, which Wikimedia can block.

## Alternatives rejected

- **ISFDB scraping.** Blocked by a bot challenge. Getting around it is not an
  option.
- **The ISFDB dump.** Its download page sits behind the same challenge, and it
  needs a MySQL container for a few thousand rows.
- **Merge Wikidata with a second source for series.** Rejected for the reason in
  0001: it repeats the fuzzy matching problem between sources. Add one only if
  the series gaps hurt in use.

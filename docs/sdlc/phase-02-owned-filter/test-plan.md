# Test plan — Phase 02 Owned filter

## Coverage

| Done criterion | Proved by | Kind |
|---|---|---|
| DC-1 | `import/page.server.test.ts` — upload replaces the owned rows and returns the count | automated |
| DC-2 | `import/page.server.test.ts` — a file with the wrong header fails and the old rows stay | automated |
| DC-3 | `page.server.test.ts` — an owned award book is missing from the load | automated |
| DC-4 | `match.test.ts` — one test per rule, plus the different-author case | automated |
| DC-5 | `page.server.test.ts` — ten books, newest award year first, none owned | automated |
| DC-6 | `page.server.test.ts` — the `own` action hides the book; it stays hidden after an import and a refresh | automated |
| DC-7 | `wikidata.test.ts` — the query asks for `en,mul` labels; a fixture row with a `mul` label gives the name | automated |

## Gaps

No gaps.

## How to run

`pnpm test`

## Test data

- A small synthetic Kindle CSV in `tests/fixtures/kindle-sample.csv`, with
  store-copy titles, "Last, First" authors and a two-author row.
- `tests/fixtures/wikidata-award-novels.json` from phase 01, plus a small
  alias fixture.
- In-memory SQLite.
- A sanity run of the match against my real `data/kindle_books.csv`, recorded
  in the build note. It is not a test, because that file stays out of git.

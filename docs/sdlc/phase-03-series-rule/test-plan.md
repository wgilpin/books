# Test plan — Phase 03 Series rule

## Coverage

| Done criterion | Proved by | Kind |
|---|---|---|
| DC-1 | `page.test.ts`, `import/page.test.ts` — the design classes and badge variants render; manual: screenshots of `/` and `/import` in light, dark and at 360px, recorded in the build note | automated + manual |
| DC-2 | `page.test.ts` — the button's accessible name holds the title; the link has the new-tab text | automated |
| DC-3 | `wikidata.test.ts` — series parser on a fixture; `refresh.test.ts` — series and members stored, numbered only | automated |
| DC-4 | `discover.test.ts` — next after the last owned | automated |
| DC-5 | `discover.test.ts` — none owned gives the lowest number | automated |
| DC-6 | `discover.test.ts` — all owned drops the series | automated |
| DC-7 | `discover.test.ts` — entry carries position, series name and award books; `page.test.ts` — "Book N of" line and badges | automated |
| DC-8 | `discover.test.ts` — two award books, one entry | automated |
| DC-9 | `page.server.test.ts` — own the series entry, the next load shows the next book | automated |
| DC-10 | `discover.test.ts` — limit counts series once | automated |

## Gaps

No gaps. The visual part of DC-1 is a manual check with screenshots, because no
headless test judges a look.

## How to run

`pnpm test`

## Test data

- `tests/fixtures/wikidata-series.json` — a live series response, trimmed to the
  series of the fixture award books.
- Synthetic series in `discover.test.ts`.
- In-memory SQLite.

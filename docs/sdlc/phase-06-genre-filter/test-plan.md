# Test plan — Phase 06 Genre filter

## Coverage

| Done criterion | Proved by | Kind |
|---|---|---|
| DC-1 | `wikidata.test.ts` — genre parser; `refresh.test.ts` — labels stored, no duplicates | automated |
| DC-2 | `genre.test.ts` — one test per rule | automated |
| DC-3 | `page.test.ts` — three links, current marked with `aria-current` | automated |
| DC-4 | `discover.test.ts` — filter keeps matching and unknown; `page.server.test.ts` — `?genre=sf` and `?genre=fantasy` | automated |
| DC-5 | `page.test.ts` — tag shown for unknown, absent otherwise | automated |
| DC-6 | `discover.test.ts` — series entry genre from award books | automated |
| DC-7 | `page.server.test.ts` — `?genre=xyz` gives All | automated |

## Gaps

No gaps.

## How to run

`pnpm test`

## Test data

- `tests/fixtures/wikidata-genres.json` — a live genre response trimmed to the
  fixture award books.
- Synthetic labels in `genre.test.ts` and `discover.test.ts`.

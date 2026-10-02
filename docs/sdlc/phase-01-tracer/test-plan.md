# Test plan — Phase 01 Tracer: award list on screen

## Coverage

| Done criterion | Proved by | Kind |
|---|---|---|
| DC-1 | `pnpm test` exits 0 | automated |
| DC-2 | `db.test.ts` — the test database path is `:memory:` and the live path is never opened | automated |
| DC-3 | `page.server.test.ts` — load with an empty database returns no books and `lastRefresh` null | automated |
| DC-4 | `wikidata.test.ts` — the parser turns the spike fixture into books with award, year and result; `page.server.test.ts` — load returns them newest first | automated |
| DC-5 | `kindle-link.test.ts` — the link is `amazon.co.uk/s` with title and author in `k` and `i=digital-text` | automated |
| DC-6 | `refresh.test.ts` — two refreshes with the same fixture give the same row counts | automated |
| DC-7 | `refresh.test.ts` — a failed fetch keeps the old rows and records the error; load returns the error | automated |
| DC-8 | Manual: run `docker compose up -d`, open `localhost:3000`, restart OrbStack, open it again | manual |
| DC-9 | `backup.test.ts` — the retention script keeps 7 daily, 4 weekly and 6 monthly files from a dated set; manual: after one day, `ls backups/` shows a file | automated + manual |

## Gaps

No gaps. DC-8 and the daily schedule in DC-9 need a running container, which a
headless test does not start.

## How to run

`pnpm test`

## Test data

- `tests/fixtures/wikidata-award-novels.json` — the spike response from
  `docs/spikes/wikidata/award-novels.rq`.
- A dated set of empty files in a temporary directory for the retention test.
- In-memory SQLite, migrated fresh for each test.

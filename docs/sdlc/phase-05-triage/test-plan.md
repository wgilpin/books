# Test plan — Phase 05 Triage

## Coverage

| Done criterion | Proved by | Kind |
|---|---|---|
| DC-1 | `page.test.ts` — four buttons with accessible names | automated |
| DC-2 | `discover.test.ts` — read counts as owned; `page.server.test.ts` — Read moves a series on | automated |
| DC-3 | `discover.test.ts` — rejected standalone and rejected series member; `page.server.test.ts` — Reject drops the series | automated |
| DC-4 | `page.server.test.ts` — marks survive import and refresh; `db.test.ts` — migration copies owned overrides | automated |
| DC-5 | `discover.test.ts` — queued entry left out, series not moved on | automated |
| DC-6 | `queue/page.server.test.ts`, `queue/page.test.ts`, `page.test.ts` — header count | automated |
| DC-7 | `marks.test.ts` — second mark replaces the first | automated |

## Gaps

No gaps.

## How to run

`pnpm test`

## Test data

Synthetic series in `discover.test.ts`; the Wikidata fixtures through the
shared fake; in-memory SQLite.

# Test plan — Phase 07 Broader recommendations

## Coverage

| Done criterion | Proved by | Kind |
|---|---|---|
| DC-1 | `wikidata.test.ts` — query contains the six verified award Q-IDs (`Q2576795`, `Q607354`, `Q2090893`, `Q898527`, `Q130987259`, `Q135231200`) and `parseAwardNovels` parses rows for each | automated |
| DC-2 | `genre.test.ts` — `classifyGenre` maps `Locus SF` to SF, and `Locus Fantasy`, `World Fantasy`, `British Fantasy` and `Mythopoeic` to fantasy | automated |
| DC-3 | `page.test.ts` — `AwardBadge` renders `badge--locus-sf` for multi-word award names | automated |
| DC-4 | `discover.test.ts` and `page.server.test.ts` — same-year entries sort by award count, then win count, then title | automated |

## Gaps

No gaps.

## How to run

`pnpm test`

## Test data

- Existing `tests/fixtures/wikidata-*.json` fixtures plus synthetic bindings in
  `wikidata.test.ts`, `genre.test.ts` and `discover.test.ts`.

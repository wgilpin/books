# Epic 01 — More awards

**Phase:** 07 Broader recommendations
**Goal:** Add verified Locus and fantasy awards from Wikidata, and classify and style their badges.
**Done criteria covered:** DC-1, DC-2, DC-3

## Behaviour

A refresh queries ten speculative-fiction awards on Wikidata — adding Locus SF
(`Q2576795`), Locus Fantasy (`Q607354`), Locus First (`Q2090893`), World Fantasy
(`Q898527`), British Fantasy / Robert Holdstock (`Q130987259`) and Mythopoeic
(`Q135231200`) to Hugo, Nebula, Clarke and BSFA. Genre classification and badge
styling support all ten awards.

## Acceptance criteria

- **AC-1** — Given `AWARD_NOVELS_QUERY`, when inspected and parsed with bindings
  for `Q2576795`, `Q607354`, `Q2090893`, `Q898527`, `Q130987259` and
  `Q135231200`, then `parseAwardNovels` returns `Locus SF`, `Locus Fantasy`,
  `Locus First`, `World Fantasy`, `British Fantasy` and `Mythopoeic` entries.
- **AC-2** — Given no genre labels, when `classifyGenre` runs on a book with a
  `Locus SF` entry, then it returns `{ sf: true, fantasy: false }`; when it runs
  on a book with `Locus Fantasy`, `World Fantasy`, `British Fantasy` or
  `Mythopoeic`, then it returns `{ sf: false, fantasy: true }`.
- **AC-3** — Given a book with a multi-word award such as `Locus SF`, when the
  card renders on `/`, then the badge carries the hyphenated class
  `badge--locus-sf`.

## Tests

- `src/lib/server/sources/wikidata.test.ts` — AC-1.
- `src/lib/genre.test.ts` — AC-2.
- `src/routes/page.test.ts` — AC-3.

## Files

- `src/lib/server/sources/types.ts`
- `src/lib/server/sources/wikidata.ts`
- `src/lib/genre.ts`
- `src/lib/components/AwardBadge.svelte`
- `static/app.css`
- the tests above

## Out of scope

Award-weight tie-breaking (epic 02).

## Notes

Keep `tests/fixtures/wikidata-award-novels.json` unchanged so existing fixture
counts in `refresh.test.ts` stay stable; test the new award Q-IDs with targeted
bindings in `wikidata.test.ts`.

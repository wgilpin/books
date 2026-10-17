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

---

## Build note — 2026-10-17

**Result:** green

### Tasks done

1. Wrote failing tests in `wikidata.test.ts`, `genre.test.ts` and
   `page.test.ts` for the six verified awards, genre classification and
   hyphenated badge classes.
2. Extended `Award` in `src/lib/server/sources/types.ts` and `AWARDS` in
   `src/lib/server/sources/wikidata.ts` with `Locus SF` (`Q2576795`),
   `Locus Fantasy` (`Q607354`), `Locus First` (`Q2090893`), `World Fantasy`
   (`Q898527`), `British Fantasy` (`Q130987259`) and `Mythopoeic`
   (`Q135231200`).
3. Updated `classifyGenre` in `src/lib/genre.ts` to mark `Locus SF` as science
   fiction and `Locus Fantasy`, `World Fantasy`, `British Fantasy` and
   `Mythopoeic` as fantasy.
4. Updated `AwardBadge.svelte` to hyphenate multi-word award names in the badge
   modifier class and mapped the new classes to the existing award colour tokens
   in `static/app.css`.

### Tests added

- `src/lib/server/sources/wikidata.test.ts` — queries and parses Locus SF,
  Locus Fantasy, Locus First, World Fantasy, British Fantasy and Mythopoeic
  awards.
- `src/lib/genre.test.ts` — counts a Clarke or Locus SF entry as science
  fiction when no label says so; counts a Locus Fantasy, World Fantasy, British
  Fantasy and Mythopoeic entry as fantasy when no label says so.
- `src/routes/page.test.ts` — shows `badge--locus-sf` for a multi-word award.

### Suite result

`pnpm test` — `Test Files 22 passed (22)`, `Tests 198 passed (198)`.
`pnpm check` — `svelte-check found 0 errors and 0 warnings`.

### Deviations from the plan

- `design.md` defines four award colour tokens (`--hugo`, `--nebula`,
  `--clarke`, `--bsfa`). Rather than inventing new hex values outside
  `design.md`, `static/app.css` maps the six new badge classes to those four
  accessible tokens (`--clarke` for Locus SF, `--nebula` for Locus Fantasy and
  World Fantasy, `--bsfa` for British Fantasy and Mythopoeic, `--hugo` for
  Locus First).

### Follow-ups

None.

---

## Review — 2026-10-17

**Verdict:** pass

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `wikidata.test.ts` — queries and parses Locus SF, Locus Fantasy, Locus First, World Fantasy, British Fantasy and Mythopoeic awards |
| AC-2 | yes | `genre.test.ts` — counts a Clarke or Locus SF entry as science fiction; counts Locus Fantasy, World Fantasy, British Fantasy and Mythopoeic as fantasy |
| AC-3 | yes | `page.test.ts` — shows a filled badge for a win and an outlined badge for a shortlisting, in the award class (`badge--locus-sf`) |

Suite run for review: `pnpm test` — `Test Files 22 passed (22)`, `Tests 198 passed (198)`.

### Drift

None. Wikidata remains the single source and `classifyGenre` remains pure;
badge colours reuse the four approved award tokens from `design.md`.

### Findings

- None that change behaviour.

### Follow-ups

None.

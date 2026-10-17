# Phase 07 — Broader recommendations

**Goal:** Widen the pool with Locus and fantasy awards from Wikidata and rank
same-year entries by award weight.

## Scope

Extend `src/lib/server/sources/wikidata.ts` and `src/lib/server/sources/types.ts`
with six verified speculative-fiction awards on Wikidata: Locus SF (`Q2576795`),
Locus Fantasy (`Q607354`), Locus First (`Q2090893`), World Fantasy (`Q898527`),
British Fantasy / Robert Holdstock (`Q130987259`), and Mythopoeic (`Q135231200`).
Update `src/lib/genre.ts` to infer science fiction or fantasy from the new
awards, `src/lib/components/AwardBadge.svelte` and `static/app.css` for
multi-word badge classes, and `src/lib/discover.ts` to break same-year ties by
award count and wins before title.

## Done criteria

- **DC-1** — `AWARD_NOVELS_QUERY` queries Locus SF (`Q2576795`), Locus Fantasy
  (`Q607354`), Locus First (`Q2090893`), World Fantasy (`Q898527`), British
  Fantasy (`Q130987259`) and Mythopoeic (`Q135231200`) alongside Hugo, Nebula,
  Clarke and BSFA, and `parseAwardNovels` returns their award entries.
- **DC-2** — `classifyGenre` classifies `Locus SF` as science fiction, and
  `Locus Fantasy`, `World Fantasy`, `British Fantasy` and `Mythopoeic` as
  fantasy.
- **DC-3** — `AwardBadge` turns spaces in an award name into hyphens in its
  modifier class (such as `badge--locus-sf`), with colours defined in
  `static/app.css`.
- **DC-4** — `buildEntries` orders entries that share the same newest award year
  by total award count descending, then win count descending, then title
  alphabetically.

## Not in this phase

A second data source outside Wikidata, user ratings, or personalised similarity.

## Epics

1. `epic-01-more-awards.md` — Locus and fantasy awards, genre rules and badge
   classes (DC-1, DC-2, DC-3).
2. `epic-02-award-ranking.md` — rank same-year entries by award count and wins
   in `discover.ts` (DC-4).

Epics 01 and 02 are independent and can run in either order.

## Risks

- Locus shortlists have ~10 books per category per year (~3,000 rows total
  across Locus SF, Fantasy and First Novel). DC-4 ensures multi-award books and
  winners surface ahead of single-ballot Locus entries in the same year.

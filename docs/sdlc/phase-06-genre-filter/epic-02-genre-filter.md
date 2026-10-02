# Epic 02 — Genre filter

**Phase:** 06 Genre filter
**Goal:** Switch `/` between All, Science fiction and Fantasy.
**Done criteria covered:** DC-3, DC-4, DC-5, DC-6, DC-7

## Behaviour

`/` shows three links under the header: All, Science fiction, Fantasy. The
current one is marked. A filter keeps the entries of that genre and the
unknown ones, then cuts to ten. Unknown entries carry a "genre unknown" tag.

## Acceptance criteria

- **AC-1** — Given entries of each genre, when `buildEntries` runs with
  `genre: 'sf'`, then it keeps science fiction and unknown entries only;
  `'fantasy'` keeps fantasy and unknown; no genre keeps all.
- **AC-2** — Given a series whose award book is fantasy, when filtered, then
  the series entry is fantasy, whatever the next book's own labels.
- **AC-3** — Given `/?genre=sf`, when it loads, then the entries are science
  fiction or unknown, and the returned filter is `sf`.
- **AC-4** — Given `/?genre=xyz`, when it loads, then it shows All.
- **AC-5** — Given the page, when it renders, then it has All, Science fiction
  and Fantasy links, and the current one has `aria-current="page"`.
- **AC-6** — Given an unknown-genre entry, when it renders, then the card shows
  a "genre unknown" tag; a known entry does not.

## Tests

- `src/lib/discover.test.ts` — AC-1, AC-2.
- `src/routes/page.server.test.ts` — AC-3, AC-4.
- `src/routes/page.test.ts` — AC-5, AC-6.

## Files

- `src/lib/discover.ts`, `src/lib/server/books.ts`
- `src/routes/+page.server.ts`, `src/routes/+page.svelte`
- `static/app.css`
- the tests above

## Out of scope

Remembering the filter.

## Notes

The links are plain `<a>` with a query string; no JavaScript. The refresh and
"I own this" forms keep the current filter.

---

## Build note — 2026-10-02

**Result:** green

### Tasks done

1. Wrote the filter tests first in `discover.test.ts`, `page.server.test.ts`
   and `page.test.ts`.
2. `buildEntries` takes `genre`; each entry carries the genre of its award
   books; a filter keeps its genre and unknown entries, then cuts to the limit.
3. `listAwardBooks` classifies each award book from its labels and awards.
4. The load reads `?genre=`; anything other than `sf` or `fantasy` is All.
5. The page has All / Science fiction / Fantasy links with `aria-current`, a
   "genre unknown" tag, and form actions that keep the filter
   (`?genre=fantasy&/own`).
6. Live check on a scratch build: refresh stored 1,169 genre labels. All, sf and
   fantasy lists differ as expected; the filtered "I own this" URL returned 200
   and saved the override. Half of today's fantasy list is "genre unknown":
   Wikidata has few genre tags for 2025–26 books.

### Tests added

- `src/lib/discover.test.ts` — sf keeps sf and unknown; fantasy keeps fantasy
  and unknown; no filter keeps all with genre; series entry genre from the
  award book.
- `src/routes/page.server.test.ts` — `?genre=sf`; `?genre=fantasy`;
  `?genre=xyz` as All.
- `src/routes/page.test.ts` — three links with one current; tag on unknown
  only; forms keep the filter.

### Suite result

`pnpm test` — Test Files 15 passed (15), Tests 112 passed (112).
`pnpm check` — 0 errors, 0 warnings.

### Deviations from the plan

- The load now returns `genre`; two existing route tests expect it and the
  entry's `genre` field.
- The filter links and tag got two small CSS rules (`.filters`, `.filter`,
  `.tag`) in the design's tokens.

### Follow-ups

- Many recent books have no Wikidata genre, so "genre unknown" is common in
  today's top ten.

---

## Review — 2026-10-02

**Verdict:** pass with follow-ups

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `discover.test.ts` — sf, fantasy and no filter |
| AC-2 | yes | `discover.test.ts` — series entry genre from the award book |
| AC-3 | yes | `page.server.test.ts` — `?genre=sf` |
| AC-4 | yes | `page.server.test.ts` — `?genre=xyz` gives All |
| AC-5 | yes | `page.test.ts` — three links, one `aria-current` |
| AC-6 | yes | `page.test.ts` — tag on unknown only |

Suite run by the reviewer: `pnpm test` — 112 passed.

### Drift

None. The filter lives in the pure `discover` module; plain links, no
JavaScript; the tag and links use the design's tokens.

### Findings

- Low: today's lists carry many "genre unknown" tags, because Wikidata tags few
  2025–26 books. The behaviour is the one chosen; the data is thin.

### Follow-ups

- Thin genre data for recent books.

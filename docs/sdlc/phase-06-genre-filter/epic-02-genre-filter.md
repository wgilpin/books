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

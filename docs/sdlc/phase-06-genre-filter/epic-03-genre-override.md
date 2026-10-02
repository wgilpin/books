# Epic 03 — Genre override

**Phase:** 06 Genre filter
**Goal:** Set the genre of a book that Wikidata left unknown, and choose whether the list includes unknown-genre books.
**Done criteria covered:** DC-4, DC-5 (extends both), ISS-10, ISS-13

## Behaviour

A card tagged "genre unknown" offers "Science fiction", "Fantasy" and "Both".
Pressing one saves the genre for that book. The tag goes, and the filters treat
the book as that genre, through every later refresh.

Next to the genre filters, an "Include unknown" control is on by default.
Turning it off leaves out every unknown-genre book, under All, Science fiction
and Fantasy alike.

## Acceptance criteria

- **AC-1** — Given a book with unknown genre, when I set it to fantasy, then
  the next load gives it `{ sf: false, fantasy: true }` and no unknown tag.
- **AC-2** — Given a book I set to science fiction, when the fantasy filter
  runs, then the book is left out.
- **AC-3** — Given a set genre, when a refresh runs, then the set genre stays.
- **AC-4** — Given a set genre and Wikidata labels that say otherwise, when the
  genre is worked out, then the set genre wins.
- **AC-5** — Given a card with unknown genre, when it renders, then it has
  "Science fiction", "Fantasy" and "Both" buttons posting to the `genre`
  action, each naming the book; a card with a known genre has none.
- **AC-6** — Given a post with an unknown genre value, when the action runs,
  then it fails with 400 and saves nothing.
- **AC-7** — Given a series entry with unknown genre, when I set its genre,
  then the setting applies to the award books it stands for.

- **AC-8** — Given unknown-genre books, when `/?unknown=0` loads, then none of
  them is listed, under any genre filter, and ten other entries fill the list.
- **AC-9** — Given no `unknown` parameter, when `/` loads, then unknown-genre
  books are included, as before.
- **AC-10** — Given the page, when it renders, then "Include unknown" shows its
  state (checked by default), and toggling it keeps the current genre; the genre
  links and the forms keep the unknown setting (ISS-13).

## Tests

- `src/lib/server/books.test.ts` — AC-1, AC-3, AC-4, AC-7.
- `src/routes/page.server.test.ts` — AC-2, AC-6.
- `src/routes/page.test.ts` — AC-5, AC-10.
- `src/lib/discover.test.ts`, `src/routes/page.server.test.ts` — AC-8, AC-9.

## Files

- `migrations/008_genre_override.sql`
- `src/lib/server/genres.ts`
- `src/lib/server/books.ts`
- `src/lib/discover.ts`
- `src/routes/+page.server.ts`, `src/routes/+page.svelte`,
  `src/lib/components/BookCard.svelte`, `static/app.css`
- the tests above

## Out of scope

Changing a genre that Wikidata did detect. Undoing an override.

## Notes

Key the override on `source` and `source_id` (ADR 0002). A series entry shows
the next book, but its genre comes from its award books, so the form posts the
award books' ids. Raised as ISS-10.

"Include unknown" is a link styled as a checkbox that toggles `unknown=0`, with
`aria-pressed`, so it needs no JavaScript. A real checkbox would need a submit
button or a script. Raised as ISS-13.

---

## Build note — 2026-10-02

**Result:** green

### Tasks done

1. Wrote the tests first: `discover` include-unknown and award keys,
   `books.test.ts` genre override, route and render tests.
2. Added `migrations/008_genre_override.sql` and `src/lib/server/genres.ts`
   (`setGenre`, `genreOverrides`, `genreFromForm`). A set genre wins over the
   Wikidata labels (AC-1, AC-3, AC-4, AC-6).
3. Entries carry `awardBooks`; the genre form posts them, so a series entry
   sets the genre of its award books (AC-7).
4. `buildEntries` and `listAwardBooks` take `includeUnknown` (default on); the
   load reads `?unknown=0` (AC-8, AC-9).
5. `/` shows an "Include unknown" control after the genre links; the links, the
   toggle and both form actions keep both settings (AC-10).
6. Unknown-genre cards show "Set genre: Science fiction / Fantasy / Both"
   (AC-5).
7. Scratch check: unknown tags on `/` 3, with `?unknown=0` 0, with
   `?genre=fantasy&unknown=0` 0; setting a book to fantasy returned 200, stored
   `sf=0, fantasy=1`, and the tags fell to 2. Screenshots at 360px: toggle and
   genre buttons wrap cleanly.

### Tests added

- `src/lib/discover.test.ts` — unknown included by default; left out under
  every filter when off; entry carries its award books.
- `src/lib/server/books.test.ts` — set genre on unknown; survives refresh; wins
  over labels; applies to a series entry's award books; unknown value throws.
- `src/routes/page.server.test.ts` — set sf leaves fantasy filter; unknown
  value 400; `?unknown=0` lists ten known; default includes unknown.
- `src/routes/page.test.ts` — genre buttons on unknown cards only; toggle on by
  default keeps the genre; off kept in links and forms.

### Suite result

`pnpm test` — Test Files 17 passed (17), Tests 148 passed (148).
`pnpm check` — 0 errors, 0 warnings.

### Deviations from the plan

- The spec named `aria-pressed` for the control. Svelte's a11y check rejects it
  on a link, rightly. The control is a link that states "on" or "off" to screen
  readers, with the checkbox drawn in CSS (`toggle--on`).
- `listAwardBooks` now takes `{ genre, includeUnknown }` as its third argument.
- The ten-newest route test expects the new `awardBooks` field.
- Built outside a loop, on the user's "add it now".

### Follow-ups

None.

---

## Review — 2026-10-02

**Verdict:** pass

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `books.test.ts` — set genre on an unknown book |
| AC-2 | yes | `page.server.test.ts` — sf book left out of fantasy |
| AC-3 | yes | `books.test.ts` — survives a refresh |
| AC-4 | yes | `books.test.ts` — wins over the labels |
| AC-5 | yes | `page.test.ts` — buttons on unknown cards only |
| AC-6 | yes | `page.server.test.ts` — unknown value 400, nothing saved |
| AC-7 | yes | `books.test.ts` — series entry's award books |
| AC-8 | yes | `discover.test.ts`, `page.server.test.ts` — `?unknown=0` |
| AC-9 | yes | `discover.test.ts`, `page.server.test.ts` — default includes unknown |
| AC-10 | yes | `page.test.ts` — toggle state, kept in links and forms |

Suite run by the reviewer: `pnpm test` — 148 passed.

### Drift

One wording drift, judged the spec's error: AC-10 asked for `aria-pressed`,
which is not valid on a link. The code states the state in text instead.
Otherwise none: overrides keyed by source and id (ADR 0002), rule in the pure
`discover` module, no JavaScript.

### Findings

- None that change behaviour.

### Follow-ups

None.

# Design — books (speculative fiction discovery)

**Look:** a quiet reading list — covers, serif titles, colour only for wins

Restyled 2026-10-17. Each book is a row with its cover, split from the next by
a rule. One filled button per row (Kindle); the rest are icons or sit in a More
menu. Colour marks an award win and nothing else.

## Surfaces

- **List** (`/`) — the ten award books to consider. Scan, then open a Kindle
  search or mark a book.
- **Import** (`/import`) — upload the Kindle library CSV. Pick a file, import.
- **Login** (phase 04) — enter the one password.
- **Queue** (phase 05) — the books marked queued. Scan and open a Kindle
  search.

## Primary flow

1. Open the list. The header shows the last refresh, the queue count, a
   refresh icon, and a More menu with the import link.
2. Scan ten book rows, newest award first.
3. Tap a title, cover or "Kindle" to open the Kindle UK search in a new tab.
   Tap the bookmark to queue or the tick to mark read. "I own this", "Reject"
   and the genre buttons are in the row's More menu.
4. When the owned list is stale, open Import, pick `kindle_books.csv`, import,
   and go back to the list.

## Tokens

- Colour, light mode: background `#FAF9F7`, surface `#FFFFFF`, hover
  `#F0EEE9`, text `#1A1A1F`, muted text `#66636D`, border `#E7E4DE`, strong
  border `#CFCBC2`, primary `#1F4FD8`, primary text `#FFFFFF`, danger
  `#B42318`.
- Colour, dark mode (from `prefers-color-scheme: dark`): background
  `#141318`, surface `#1C1B22`, hover `#26252E`, text `#F2F0EA`, muted text
  `#A7A3B0`, border `#2A2932`, strong border `#3D3B47`, primary `#7FA2FF`,
  primary text `#0B1020`, danger `#FF8A80`.
- Award colours, both modes, white text, wins only: Hugo and Locus First
  `#C2410C`; Nebula, Locus Fantasy and World Fantasy `#6D28D9`; Clarke and
  Locus SF `#0F766E`; BSFA, British Fantasy and Mythopoeic `#BE123C`.
- Type: sans `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`; serif
  for headings and titles `"Iowan Old Style", Charter, "Palatino Linotype",
  Palatino, Georgia, serif`. No web fonts. Scale 13, 14, 16, 22, 32px. Body
  16px / 1.5. Book title serif 22px, weight 600, line height 1.2; 20px below
  480px. Page heading serif 32px, weight 600; 28px below 480px.
- Spacing: base 4px. Steps 4, 8, 12, 16, 20, 24, 32, 48px.
- Radius: 8px buttons and menus, 4px covers, 999px badges and chips.
- Shadow: covers `0 1px 3px rgb(0 0 0 / 0.18)` in light mode only; menus
  `0 4px 16px` black at 12% (light) or 50% (dark).

## Components

- **Page header** — serif title and a small last-refresh line on the left;
  on the right a Queue tab with a count, a refresh icon button and a More
  menu holding "Import Kindle library". On every page.
- **Book card** — a row: 80×120 cover on the left (64×96 below 480px); then
  title (link), author, series line, grouped award badges, a collapsed
  "Series awards" note when the awards went to other books in the series,
  and the actions row. On List and Queue.
- **Cover** — `/cover/<source>/<id>` looks up the work on Open Library once
  (title and first author), caches the cover id in `work_cover`, and
  redirects to `covers.openlibrary.org`. With no cover, it serves an SVG
  placeholder with the title's first letter.
- **Award badge** — one pill per award. One entry shows "Hugo 2024"; several
  show "Hugo ×3 · 2006–2009". The tooltip and screen-reader text list every
  year and result. Any win fills the pill in the award colour with a ★; a
  shortlisting alone is a neutral outline.
- **Button** — `primary` (filled; Kindle, Import, Log in), `secondary`
  (outline; Show 10 more), `small` size. **Icon button** — 34px square, muted
  icon, for Queue, Read, Refresh and More. **Chip** — small pill for the
  genre choice; the current genre is filled and disabled.
- **Menu** — a `<details>` element, so it needs no script. Holds "I own this",
  "Reject" and the genre chips on a card, and the import link in the header.
  The genre chips show on the card itself only while the genre is unknown.
- **Notice** — one-line message. Variants: `info`, `progress`, `error` (danger
  colour, `role="alert"`). Refresh progress and errors, import result. The
  last refresh time is header meta, not a notice.
- **Panel** — bordered box for the Import and Login forms.
- **File picker** — native file input with a label, styled as a secondary
  button. On Import.

## States

- **List, empty (no refresh yet):** notice "No award data yet" and a primary
  "Refresh from Wikidata" button.
- **List, everything owned:** notice "You own every award book in the list."
- **Loading (refresh running):** progress notice, refresh button disabled, page
  reloads every 3 seconds.
- **Error:** error notice with the time and the message; the old cards stay.
- **Import:** before the first import, "No Kindle library imported yet"; after,
  the count and time; an error notice on a bad file.
- **No-permission:** none in phases 01 to 03. Phase 04 sends a visitor with no
  session to Login.

## Responsive

Single column, up to 720px, centred. Smallest supported width 360px. Below
480px the cover shrinks to 64×96, titles drop to 20px, badges and the header
actions wrap.

## Accessibility

- Text contrast at least 4.5:1 in both modes; the award colours meet it with
  white text.
- Focus: a 3px primary-colour outline with a 2px offset on every link, button
  and input.
- Keyboard: tab order is header, then each card's title, Kindle, Queue, Read,
  More. The cover link is out of the tab order, because the title link goes
  to the same place.
- Every mark button and the More menu carry the book title in their
  accessible name. Icon buttons have a `title` tooltip too.
- External links open in a new tab and say so to screen readers.

## Where the screens live

- Stitch project: `4264356547256583351` ("Books — award novel discovery")
- Stitch design system: `assets/eec2a57ab5c34aaf9b0c42307e19f97d`
- Screens requested 2026-10-02: List (mobile), Import (mobile). Both calls timed
  out, which is normal; confirm them in the Stitch UI.
- Claude Design project: none. The push needs `/design-login` from an
  interactive Claude Code session first. The kit is ready in
  `docs/sdlc/design-kit/` (`tokens.css` and eight component previews).

## Out of scope

Web fonts. Animations beyond a hover state. A settings page. A publication
year on the card: Wikidata data in the app has award years only.

# Design — books (speculative fiction discovery)

**Look:** bold, big-type, award-coloured

No cover images and no cover metaphor: the app has no cover data. Boldness
comes from large titles, cards, and a strong colour per award on the badges.

## Surfaces

- **List** (`/`) — the ten award books to consider. Scan, then open a Kindle
  search or mark a book.
- **Import** (`/import`) — upload the Kindle library CSV. Pick a file, import.
- **Login** (phase 04) — enter the one password.
- **Queue** (phase 05) — the books marked queued. Scan and open a Kindle
  search.

## Primary flow

1. Open the list. The header shows the last refresh and a link to import.
2. Scan ten book cards, newest award first.
3. Tap a title or "Kindle" to open the Kindle UK search in a new tab, or tap
   "I own this" to hide the card.
4. When the owned list is stale, open Import, pick `kindle_books.csv`, import,
   and go back to the list.

## Tokens

- Colour, light mode: background `#F4F1EA`, surface `#FFFFFF`, text
  `#17161C`, muted text `#5E5B66`, border `#E2DED3`, primary `#1F4FD8`,
  primary text `#FFFFFF`, danger `#B42318`.
- Colour, dark mode (from `prefers-color-scheme: dark`): background
  `#14131A`, surface `#1E1D26`, text `#F2F0EA`, muted text `#A7A3B0`, border
  `#2E2C38`, primary `#7FA2FF`, primary text `#0B1020`, danger `#FF8A80`.
- Award colours, both modes, white text: Hugo `#C2410C`, Nebula `#6D28D9`,
  Clarke `#0F766E`, BSFA `#BE123C`.
- Type: family `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`; no
  web fonts. Scale 14px, 16px, 20px, 28px, 36px. Body 16px / 1.5. Book title
  28px, weight 800, line height 1.15; 24px below 480px. Page heading 36px,
  weight 800.
- Spacing: base 4px. Steps 4, 8, 12, 16, 24, 32, 48px.
- Radius: 6px buttons and inputs, 14px cards, 999px badges.
- Shadow: light mode cards `0 1px 2px rgb(0 0 0 / 0.08), 0 8px 24px rgb(0 0 0
  / 0.08)`; dark mode none, a 1px border instead.

## Components

- **Page header** — app name, last-refresh line, refresh button, import link.
  On every page.
- **Book card** — title (link), author, award badges, series line (phase 03),
  actions row. On List and Queue.
- **Award badge** — pill with award and year. Variants: `won` (filled award
  colour, white text, "won" suffix) and `shortlisted` (award-colour outline,
  normal text colour, so it keeps 4.5:1 contrast in dark mode). In book cards.
- **Button** — variants: `primary` (filled), `secondary` (outline), `quiet`
  (text only). "Kindle" is primary; "I own this" is secondary; refresh is
  secondary.
- **Notice** — one-line message. Variants: `info`, `progress`, `error` (danger
  colour, `role="alert"`). Refresh state, import result.
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

Single column. Cards fill the width up to 720px, centred. Smallest supported
width 360px. Below 480px, titles drop to 24px and the actions row wraps.

## Accessibility

- Text contrast at least 4.5:1 in both modes; the award colours meet it with
  white text.
- Focus: a 3px primary-colour outline with a 2px offset on every link, button
  and input.
- Keyboard: tab order is header, then each card's title, Kindle, I own this.
- Each "I own this" button carries the book title in its accessible name.
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

Cover images. Custom fonts. Animations beyond a hover state. A settings page.

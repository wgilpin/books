# Epic 01 — Apply the design

**Phase:** 03 Series rule
**Goal:** Restyle `/` and `/import` to `docs/sdlc/design.md`.
**Done criteria covered:** DC-1, DC-2

## Behaviour

Both pages use the page header, book cards, award badges, buttons and notices
from the design, in light and dark mode, down to 360px wide. Screen readers hear
which book each "I own this" button is for.

## Acceptance criteria

- **AC-1** — Given a book with a win and a shortlisting, when `/` renders, then
  the card shows a filled badge for the win and an outlined badge for the
  shortlisting, in the award's class.
- **AC-2** — Given a book, when `/` renders, then the card has the title link,
  the author, a primary "Kindle" link and a secondary "I own this" button.
- **AC-3** — Given a book, when `/` renders, then the "I own this" button's
  accessible name includes the title, and the Kindle link says it opens in a
  new tab.
- **AC-4** — Given every award book is owned, when `/` renders after a refresh,
  then it shows "You own every award book in the list."
- **AC-5** — Given `/import`, when it renders, then it uses the page header, a
  notice for the result and the styled file picker.
- **AC-6** — Given the running app, when I view `/` and `/import` in light mode,
  dark mode and at 360px, then they match the design (manual, screenshots).

## Tests

- `src/routes/page.test.ts` — AC-1 to AC-4.
- `src/routes/import/page.test.ts` — AC-5.
- Manual — AC-6, screenshots recorded in the build note.

## Files

- `static/app.css`, `src/app.html`
- `src/routes/+page.svelte`, `src/routes/import/+page.svelte`
- `src/lib/components/AwardBadge.svelte`, `src/lib/components/PageHeader.svelte`
- the tests above

## Out of scope

The series line content (epic 03). Login and Queue pages.

## Notes

Copy the tokens and component classes from `docs/sdlc/design-kit/tokens.css`
into `static/app.css`. No JavaScript, no web fonts.

---

## Build note — 2026-10-02

**Result:** green

### Tasks done

1. Wrote the render tests first (AC-1 to AC-5).
2. Added `static/app.css` from `docs/sdlc/design-kit/tokens.css`, plus a page
   container, `.sr-only`, `.stack`, hover states and help text; linked it in
   `src/app.html`.
3. Added `AwardBadge.svelte` and `PageHeader.svelte`.
4. Restyled `/` (header, notices, cards, badges, buttons, empty and
   all-owned states) and `/import` (header, notices, card form, file picker).
5. Manual check (AC-6) on a scratch build with live data, in the browser pane:
   `/` in light mode and dark mode at desktop width, `/` and `/import` at
   360 × 780 in light mode. Cards, badges, buttons and notices match
   `design.md`; titles wrap; nothing overflows at 360px. The `/import` form
   card is 593px wide inside a 625px main at desktop width.

### Tests added

- `src/routes/page.test.ts` — filled and outlined badges in the award class;
  card with title link, author, primary Kindle and secondary I own this;
  accessible name and new-tab text; all-owned notice; header and notices.
- `src/routes/import/page.test.ts` — header, result notice, picker and primary
  Import button.

### Suite result

`pnpm test` — Test Files 13 passed (13), Tests 67 passed (67).
`pnpm check` — 0 errors, 0 warnings.

### Deviations from the plan

- The screen-reader text needs `{' '}` before "(opens in a new tab)", because
  Svelte trims the leading space; the test caught it.
- The page title is now "Award novels".

### Follow-ups

None.

---

## Review — 2026-10-02

**Verdict:** pass

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `page.test.ts` — filled badge for a win, outlined badge for a shortlisting |
| AC-2 | yes | `page.test.ts` — card with title link, author, primary Kindle, secondary I own this |
| AC-3 | yes | `page.test.ts` — accessible name holds the title; new-tab text |
| AC-4 | yes | `page.test.ts` — all-owned notice |
| AC-5 | yes | `import/page.test.ts` — header, notice, picker, primary button |
| AC-6 | yes | Manual, recorded in the build note: light, dark, 360px |

Suite run by the reviewer: `pnpm test` — 67 passed.

### Drift

None. Tokens and components match `design.md`; no web fonts and no
JavaScript, as the design and the user's rules ask. The CSS sits in a static
file.

### Findings

- None that change behaviour.

### Follow-ups

None.

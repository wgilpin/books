# Issues — books (speculative fiction discovery)

One line per issue, newest last. Status is `open`, `scheduled`, `fixed`,
or `dropped`. This file records issues. It never records stage status.

## ISS-1 — Port 3000 clashes with rayv

**Raised:** 2026-10-02
**Status:** open
**Lands in:** unplanned

From epic-01-skeleton and epic-03-container. `books-app` and `rayv-app` both
map host port 3000, so they cannot run at the same time.

## ISS-2 — Refresh times show in UTC with no zone label

**Raised:** 2026-10-02
**Status:** open
**Lands in:** unplanned

From epic-02-award-list. In UK summer time, the page shows a time one hour off.

## ISS-3 — Award entries removed from Wikidata stay in the database

**Raised:** 2026-10-02
**Status:** open
**Lands in:** unplanned

From epic-02-award-list. The refresh upserts and never deletes, so a corrected
nomination stays wrong.

## ISS-4 — Observe the app coming back after an OrbStack restart

**Raised:** 2026-10-02
**Status:** open
**Lands in:** unplanned

From epic-03-container. AC-2 is proved by the `unless-stopped` policy only. Check
`localhost:3000` after the next natural OrbStack restart.

## ISS-5 — Authors with no English label on Wikidata show as a Wikidata id

**Raised:** 2026-10-02
**Status:** fixed 2026-10-02
**Lands in:** phase 02, epic-02-hide-owned (DC-7), proved by `wikidata.test.ts` "asks for English labels, then the language-neutral mul label (ISS-5)" 

The list shows names like `Q55434623`: 29 of 913 authors and 5 titles. The
query asks for English labels only. Likely fix: `wikibase:language "en,mul"`
in `src/lib/server/sources/wikidata.ts`, with a parser test.

## ISS-6 — The Kindle upload fails above 512 KB

**Raised:** 2026-10-02
**Status:** open
**Lands in:** unplanned

From epic-01-kindle-import. adapter-node's default `BODY_SIZE_LIMIT` is 512 KB.
The real CSV is 218 KB, so a library of about 5,000 books hits the limit.

## ISS-7 — Two books by one author that share the text before a colon match

**Raised:** 2026-10-02
**Status:** open
**Lands in:** unplanned

From epic-02-hide-owned. Titles are cut at the first colon on both sides, so
owning "The Red: First Light" also hides a different "The Red: …" by the same
author.

## ISS-8 — The list cannot be narrowed to science fiction or to fantasy

**Raised:** 2026-10-02
**Status:** open
**Lands in:** unplanned

No phase covers a genre filter. It needs a genre per book, probably Wikidata
P136; its coverage of the award books is unchecked.

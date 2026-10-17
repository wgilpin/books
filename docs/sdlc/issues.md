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
**Status:** fixed 2026-10-02
**Lands in:** phase 06, proved by `page.server.test.ts` "lists science fiction and unknown entries for ?genre=sf" 

No phase covers a genre filter. It needs a genre per book, probably Wikidata
P136. Checked 2026-10-02: 787 of 913 award books carry a genre.

## ISS-9 — A series with no English or mul label shows its Wikidata id

**Raised:** 2026-10-02
**Status:** open
**Lands in:** unplanned

From epic-03-series-entries. Live data has one: `Q126690200` ("The Unbroken"'s
series). The card reads "Book 1 of Q126690200".

## ISS-10 — Many recent books have no Wikidata genre

**Raised:** 2026-10-02
**Status:** fixed 2026-10-02
**Lands in:** epic-03-genre-override (phase 06), proved by `books.test.ts` "gives a set genre to an unknown book" 

From epic-02-genre-filter. Half of today's fantasy list is "genre unknown". A
manual genre override, or a second source, would close it.

## ISS-11 — "I own this" doubles as "never show again"; a Reject action is missing

**Raised:** 2026-10-02
**Status:** fixed 2026-10-02
**Lands in:** phase 05, proved by `page.server.test.ts` "drops the whole series when I reject its entry" 

The user wants a Reject button. On a series entry, Reject drops the whole
series, while "I own this" moves on to the next book.

## ISS-12 — Queued books show no award badges on /queue

**Raised:** 2026-10-02
**Status:** open
**Lands in:** unplanned

From epic-02-queue. `listQueue` returns no awards, so the queue page hides why
a book was queued.

## ISS-13 — The list has no way to leave out unknown-genre books

**Raised:** 2026-10-02
**Status:** fixed 2026-10-02
**Lands in:** epic-03-genre-override (phase 06), proved by `books.test.ts` "gives a set genre to an unknown book" , AC-8 to AC-10

The user wants an "Include unknown" control next to the genre filters, on by
default, that leaves out "genre unknown" books when off.

## ISS-14 — The list stops at ten entries with no way to see more

**Raised:** 2026-10-02
**Status:** fixed 2026-10-03
**Lands in:** fix on branch `fix-show-more`, proved by `page.server.test.ts` "lists twenty for ?limit=20, the first ten unchanged" and `page.test.ts` "links to ten more" 

The user wants a "Show more" button under the list. `/` always lists ten.

## ISS-15 — The Login page gives the queue count to a visitor with no session

**Raised:** 2026-10-04
**Status:** open
**Lands in:** unplanned

From the epic-01-password-gate review. `src/routes/+layout.server.ts` runs on
`/login`, so `queueCount` is in the page data and in `/login/__data.json`.

## ISS-16 — A card with a known genre has no controls to change it when Wikidata got the genre wrong

**Raised:** 2026-10-15
**Status:** fixed 2026-10-15
**Lands in:** fix on branch `epic-03-public-route`, proved by `page.test.ts` "offers Science fiction, Fantasy and Both on every card, with the current genre disabled (ISS-16)"

From epic-03-genre-override. `BookCard.svelte` hides the `Set genre:` form when
`unknownGenre` is false, so a fantasy book tagged as science fiction by Wikidata cannot be corrected.

## ISS-17 — SF Masterworks and Fantasy Masterworks have no book links on Wikidata

**Raised:** 2026-10-17
**Status:** open
**Lands in:** unplanned

From phase 07 planning. `wd:Q7390023` (SF Masterworks) and `wd:Q5434314`
(Fantasy Masterworks) have no `P179` book statements on Wikidata, so ingesting
them needs a second source (such as Wikipedia's list articles) or a curated
seed list.

## ISS-18 — Award statements with no `pq:P585` date qualifier are skipped instead of falling back to publication year

**Raised:** 2026-10-17
**Status:** open
**Lands in:** unplanned

From phase 07 planning. `parseAwardNovels` in `src/lib/server/sources/wikidata.ts`
drops rows without `pq:P585` rather than falling back to `wdt:P577` (affects 3
rows across the current Wikidata award pool).

## ISS-19 — John W. Campbell Memorial, Philip K. Dick and Dragon awards are not included in the Wikidata query

**Raised:** 2026-10-17
**Status:** open
**Lands in:** unplanned

From phase 07 planning. Wikidata has complete novel shortlists and winners for
Campbell (`Q1030402`), Philip K. Dick (`Q1341487`), Dragon SF (`Q139965311`) and
Dragon Fantasy (`Q139973536`), which are not yet in `AWARDS` in
`src/lib/server/sources/wikidata.ts`.

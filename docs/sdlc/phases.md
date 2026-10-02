# Phases — books (speculative fiction discovery)

Phase 1 puts the award list on screen through every layer. Phases 2 and 3 add
the two rules that make up the concept's proof: hide what I own, then apply the
series rule. After phase 3 I run the "three books in one sitting" test. Phases 4
and 5 run only if the proof passes. Sizes are rough Claude Code build time.

## Phase 01 — Tracer: award list on screen

**Goal:** Show the newest Hugo, Nebula, Clarke and BSFA novels from Wikidata in
the app, running in OrbStack.

**Works after this phase:** I open `localhost:3000`, press refresh, and browse
the shortlists newest first, each with a Kindle UK search link.

**Not in this phase:** the Kindle import, the owned filter, the series rule, the
ten-entry limit, login.

**Includes:** the Docker container, SQLite with migrations, the source cache,
the daily backup sidecar, and an in-memory test database.

**Size:** about 1 to 2 hours.

**Depends on:** nothing.

## Phase 02 — Owned filter

**Goal:** Hide every book I own on Kindle.

**Works after this phase:** I upload `kindle_books.csv`. The list drops the
books I own and goes back year by year until it holds ten entries. An "I own
this" checkbox hides a book the match missed.

**Not in this phase:** the series rule. A shortlisted book 3 still shows as
itself.

**Includes:** the console export script in `scripts/`, author-then-title
matching against titles and aliases, and the override table.

**Size:** about 2 to 3 hours.

**Depends on:** phase 01.

## Phase 03 — Series rule

**Goal:** One entry per series, showing the next book I do not own.

**Works after this phase:** the full proof from the concept. A series shows the
book after the last one I own, or book 1 if I own none. A fully owned series is
gone.

**Not in this phase:** a manual series override for Wikidata gaps. I fix gaps in
Wikidata.

**Includes:** the series-member query, numbered members only.

**Size:** about 1 to 2 hours.

**Depends on:** phase 02.

## Phase 06 — Genre filter

Added 2026-10-02, after phase 03, from ISS-8. It runs before phase 04.

**Goal:** Narrow the list to science fiction or to fantasy.

**Works after this phase:** I switch `/` between All, Science fiction and
Fantasy. A book with no known genre shows under both, tagged "genre unknown".

**Not in this phase:** other genres, more than one filter at once, remembering
the filter between visits.

**Size:** about 15 to 20 minutes.

**Depends on:** phase 03.

## Phase 04 — On the internet

**Goal:** Use the app away from my Mac.

**Works after this phase:** I open `books.teleosis.ai` on my phone, log in with
one password, and use the list.

**Not in this phase:** more than one user, password reset, Cloudflare Access.

**Includes:** the env-var password, a signed session cookie, the
`web-routing` network, and the Caddy route.

**Size:** about 1 hour, plus my own Caddy and Cloudflare steps.

**Depends on:** phase 06, and a passed proof.

## Phase 05 — Triage

**Goal:** Remember what I decided about each book.

Issue ISS-11: Reject sits beside "I own this"; on a series entry it drops the whole series.

**Works after this phase:** I mark a book read, rejected or queued. Read and
rejected books never come back. Queued books show in their own list.

**Not in this phase:** a Goodreads import, ratings, notes.

**Size:** about 1 to 2 hours.

**Depends on:** phase 03.

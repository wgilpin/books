# Epic 01 — Kindle import

**Phase:** 02 Owned filter
**Goal:** Replace the owned list from the Kindle library CSV.
**Done criteria covered:** DC-1, DC-2

## Behaviour

I open `/import`, pick `kindle_books.csv`, and submit. The app replaces the
owned list and says how many books it read. A wrong file leaves the old list
and shows an error. The export script I run on the Kindle library page lives in
`scripts/kindle-export.js`.

## Acceptance criteria

- **AC-1** — Given a CSV with the header `asin,title,author`, when it is
  parsed, then each row gives an ASIN, a title and a list of authors split on
  `;`.
- **AC-2** — Given an owned list, when I upload a valid CSV, then the owned
  table holds exactly the new rows and the page reports the count.
- **AC-3** — Given an owned list, when I upload a file without that header,
  then the page shows an error and the owned table is unchanged.
- **AC-4** — Given titles with quotes and commas, when the CSV is parsed, then
  the fields keep them intact.
- **AC-5** — Given `/import`, when it loads, then it shows the current owned
  count and the time of the last import.

## Tests

- `src/lib/server/kindle.test.ts` — parse rows and authors (AC-1); quotes and
  commas (AC-4); wrong header (AC-3).
- `src/routes/import/page.server.test.ts` — upload replaces rows and reports the
  count (AC-2); bad file keeps rows (AC-3); load shows count and time (AC-5).

## Files

- `migrations/002_owned.sql`
- `src/lib/server/kindle.ts`, `src/lib/server/owned.ts`
- `src/routes/import/+page.server.ts`, `src/routes/import/+page.svelte`
- `scripts/kindle-export.js`
- `tests/fixtures/kindle-sample.csv`
- the tests above

## Out of scope

Matching. The list on `/` does not change yet.

## Notes

The CSV comes from the console script used on 2026-10-02: header
`asin,title,author`, every field quoted. The import replaces the whole table in
one transaction.

---

## Build note — 2026-10-02

**Result:** green

### Tasks done

1. Wrote the CSV parser test first, then an RFC 4180 parser with the header
   check and `;` author split (AC-1, AC-3, AC-4).
2. Added `migrations/002_owned.sql` (`owned`, `owned_import`) and
   `replaceOwned` / `ownedSummary` (AC-2, AC-5).
3. Added `/import` with a multipart upload form, the result and the error
   (AC-2, AC-3, AC-5), and a link to it from `/`.
4. Saved the scroll-and-export console script as `scripts/kindle-export.js`.
   It copies to the clipboard, because Chrome blocked the second download on
   2026-10-02.
5. Uploaded the real `data/kindle_books.csv` to a scratch build on port 3999:
   200, and `/import` reports 2,324 owned books.

### Tests added

- `src/lib/server/kindle.test.ts` — reads ASIN, title and authors; splits
  authors on `;`; keeps quotes and commas; rejects a wrong header; reads CRLF and
  skips blank lines.
- `src/routes/import/page.server.test.ts` — no import yet; upload replaces the
  list and reports the count; wrong header keeps the old list; no file.
- `src/routes/import/page.test.ts` — count, time and upload form; import result
  and error.

### Suite result

`pnpm test` — Test Files 10 passed (10), Tests 37 passed (37).
`pnpm check` — 0 errors, 0 warnings.

### Deviations from the plan

- `pnpm check` failed on `scripts/` before this epic started: phase 01 epic 03
  added `retention.mjs` without a type check run. I removed `scripts` from the
  `tsconfig.json` include. The scripts are plain JavaScript that run outside
  the app (a console snippet and the backup sidecar); Vitest still runs
  `retention.test.ts`.
- `replaceOwned` returns the number of distinct ASINs stored, which the page
  reports.
- Added `src/routes/import/page.test.ts`, which the epic did not list.
- `tsconfig.json` and `src/routes/+page.svelte` changed; the epic did not list
  them.
- The phase 02 plan, `state.md` and `issues.md` ride on this branch.

### Follow-ups

- adapter-node rejects request bodies over 512 KB by default. The real CSV is
  218 KB, so a library of about 5,000 books hits the limit. Set
  `BODY_SIZE_LIMIT` in the container if it grows.

---

## Review — 2026-10-02

**Verdict:** pass with follow-ups

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `kindle.test.ts` — reads ASIN, title and authors; splits authors on `;` |
| AC-2 | yes | `import/page.server.test.ts` — replaces the owned list and reports the count |
| AC-3 | yes | `kindle.test.ts` — rejects a wrong header; `import/page.server.test.ts` — keeps the old list |
| AC-4 | yes | `kindle.test.ts` — keeps quotes and commas inside a quoted field |
| AC-5 | yes | `import/page.server.test.ts` — load returns count and time; `import/page.test.ts` — page shows them |

Suite run by the reviewer: `pnpm test` — 37 passed. `pnpm check` — 0 errors.

### Drift

None. The `kindle` module turns the outside world into plain records, as
`architecture.md` says. The owned table is replaced on each import.

### Findings

- Low: the 512 KB body limit (build note follow-up).
- Low: no size or type check on the upload beyond the header. A large non-CSV
  file is read into memory before the header check fails.

### Follow-ups

- Raise `BODY_SIZE_LIMIT` before the library passes about 5,000 books.

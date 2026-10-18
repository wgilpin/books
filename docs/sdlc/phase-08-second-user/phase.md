# Phase 08 — Second user

**Goal:** Give my daughter her own password, owned list, marks and queue on the
same shared Wikidata award catalog, with no UI changes.

## Scope

Extend `src/env.ts` and `src/lib/server/session.ts` with `APP_PASSWORD_2` so
`checkPassword` matches either user (`'1'` or `'2'`) in constant time, and
`signSession` / `verifySession` carry the user id in the signed cookie. Update
`src/hooks.server.ts`, `src/app.d.ts` and `src/routes/+layout.server.ts` so
every authenticated request has `event.locals.user` and `/login` never leaks
`queueCount` (ISS-15). Add `migrations/009_user_scope.sql` to scope `owned`,
`owned_import` and `book_mark` by `user` (defaulting existing rows to `'1'`),
and pass `user` through `owned.ts`, `marks.ts`, `books.ts` and the `/`,
`/queue` and `/import` server routes.

## Done criteria

- **DC-1** — `readAuthConfig` requires `APP_PASSWORD`, `APP_PASSWORD_2` and
  `SESSION_SECRET`, and refuses to start if `APP_PASSWORD` and `APP_PASSWORD_2`
  are identical.
- **DC-2** — Entering `APP_PASSWORD` on `/login` signs a session cookie for user
  `'1'`; entering `APP_PASSWORD_2` signs a session cookie for user `'2'`;
  `verifySession` returns `'1'` or `'2'` for a valid cookie and `null` for an
  expired, tampered or pre-multiuser cookie.
- **DC-3** — `hooks.server.ts` sets `event.locals.user` from a valid session
  cookie, and `+layout.server.ts` returns `queueCount: 0` when `locals.user` is
  absent on `/login` (fixes ISS-15).
- **DC-4** — `migrations/009_user_scope.sql` adds `user` to `owned`,
  `owned_import` and `book_mark`, preserving existing rows under user `'1'` and
  allowing both users to store rows for the same ASIN or work independently.
- **DC-5** — Uploading a Kindle CSV on `/import`, marking a book (`owned`,
  `read`, `rejected`, `queued`), viewing `/` and viewing `/queue` as user `'2'`
  affect and show only user `'2'`'s books, leaving user `'1'`'s owned list,
  marks, list and queue count untouched.

## Not in this phase

A username field, a logout button, a profile switcher, a third user, or
cross-user visibility.

## Epics

1. `epic-01-user-sessions.md` — two passwords (`APP_PASSWORD`, `APP_PASSWORD_2`),
   user-scoped session cookies, `event.locals.user`, and ISS-15 fix (DC-1, DC-2,
   DC-3).
2. `epic-02-user-isolation.md` — migration `009_user_scope.sql` and per-user
   `owned`, `owned_import` and `book_mark` queries across `/`, `/queue` and
   `/import` (DC-4, DC-5).

Epic 02 builds on epic 01.

## Risks

- Old single-user session cookies (`expiry.mac`) have no user segment; `verifySession`
  returns `null` so any existing browser session cleanly redirects to `/login`
  once after deploy.
- The container needs `APP_PASSWORD_2` in `.env` before restarting with the new
  image.

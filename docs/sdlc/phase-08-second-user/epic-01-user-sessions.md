# Epic 01 — User sessions

**Phase:** 08 Second user
**Goal:** Identify user `'1'` or `'2'` from the password entered on `/login`, carry the user id in the signed session cookie, and stop leaking `queueCount` on `/login`.
**Done criteria covered:** DC-1, DC-2, DC-3 (and ISS-15)

## Behaviour

The server reads `APP_PASSWORD`, `APP_PASSWORD_2` and `SESSION_SECRET` at
startup and refuses to start if any is missing, blank, or if both passwords are
the same. Logging in on `/login` with `APP_PASSWORD` sets a 30-day signed cookie
for user `'1'`; logging in with `APP_PASSWORD_2` sets one for user `'2'`.
`hooks.server.ts` verifies the cookie and stores the user id on
`event.locals.user`. When `locals.user` is not set (such as on `/login`),
`+layout.server.ts` returns `queueCount: 0` without querying a user's queue.

## Acceptance criteria

- **AC-1** — Given `APP_PASSWORD_2` is missing, blank, or equal to
  `APP_PASSWORD`, when `readAuthConfig` runs, then it throws an error naming the
  problem without leaking any password value.
- **AC-2** — Given `APP_PASSWORD` and `APP_PASSWORD_2`, when `matchPassword` /
  `/login` receives the first password, then it signs a session for `'1'`; when
  it receives the second password, then it signs a session for `'2'`; when it
  receives anything else, then it returns `null` / 400 after checking both in
  constant time.
- **AC-3** — Given a signed session cookie for `'1'` or `'2'`, when
  `verifySession` runs before expiry, then it returns `'1'` or `'2'`; when the
  user id, expiry or signature is altered, or an old `expiry.mac` cookie is
  passed, then it returns `null`.
- **AC-4** — Given a request with a valid session cookie for `'2'`, when
  `handle` runs in `hooks.server.ts`, then `event.locals.user` is `'2'`.
- **AC-5** — Given a queued book in the database and a visitor on `/login` with
  no session (`locals.user` undefined), when `+layout.server.ts` runs, then
  `queueCount` is `0` (ISS-15).

## Tests

- `src/lib/server/session.test.ts` — AC-1, AC-2, AC-3.
- `src/routes/login/page.server.test.ts` — AC-2.
- `src/hooks.server.test.ts` — AC-4.
- `src/routes/layout.server.test.ts` — AC-5.
- `tests/deploy-config.test.ts` — `Dockerfile` and `docker-compose.yml` do not
  inline `APP_PASSWORD_2`.

## Files

- `src/env.ts`
- `src/app.d.ts`
- `src/lib/server/session.ts`
- `src/hooks.server.ts`
- `src/routes/login/+page.server.ts`
- `src/routes/+layout.server.ts`
- `tests/setup-env.ts`
- `docs/deploy.md`
- the tests above

## Out of scope

Per-user database tables and queries (epic 02).

## Notes

Keep `signSession(secret, now = Date.now(), user: UserId = '1')` defaulting
`user` to `'1'` so existing call sites in tests remain ergonomic while also
testing `'2'` explicitly.

---

## Build note — 2026-10-18

**Result:** green

### Tasks done

1. Added `APP_PASSWORD_2` to `src/env.ts`, `.env.example`, `docs/deploy.md`,
   `tests/setup-env.ts` and `tests/deploy-config.test.ts`, and updated
   `readAuthConfig` in `src/lib/server/session.ts` to require `APP_PASSWORD_2`
   and reject identical passwords (AC-1).
2. Added `UserId` (`'1' | '2'`) and `matchPassword` in
   `src/lib/server/session.ts`, updated `signSession` and `verifySession` to
   carry and validate the user id in the cookie payload (`user.expiry.mac`), and
   updated `/login` in `src/routes/login/+page.server.ts` to sign the matched
   user id (AC-2, AC-3).
3. Declared `App.Locals['user']` in `src/app.d.ts`, populated `event.locals.user`
   in `src/hooks.server.ts` (AC-4), and updated `src/routes/+layout.server.ts`
   to return `queueCount: 0` when `locals.user` is absent (AC-5, ISS-15).

### Tests added

- `src/lib/server/session.test.ts` — `readAuthConfig` reads `password2`,
  declares `APP_PASSWORD_2` as private/startup, and throws when `APP_PASSWORD_2`
  is missing, blank, or equal to `APP_PASSWORD`; `signSession` and
  `verifySession` return `'1'` or `'2'` and reject tampered or user-less
  cookies; `matchPassword` returns `'1'`, `'2'` or `null`.
- `src/routes/login/page.server.test.ts` — `/login` sets a user-scoped session
  cookie for both `TEST_PASSWORD` (`'1'`) and `TEST_PASSWORD_2` (`'2'`).
- `src/hooks.server.test.ts` — `handle` sets `event.locals.user` for `'1'` and
  `'2'` and leaves it unset on `/login` with no session.
- `src/routes/layout.server.test.ts` — `+layout.server.ts` returns `queueCount: 0`
  when `locals.user` is absent (ISS-15) and returns the count when set.
- `tests/deploy-config.test.ts` — checks `APP_PASSWORD_2` is not inlined in
  `Dockerfile` or `docker-compose.yml`.

### Suite result

`pnpm test` — `Test Files 26 passed (26)`, `Tests 224 passed (224)`.
`pnpm check` — `svelte-check found 0 errors and 0 warnings`.

### Deviations from the plan

- Updated `.env.example` alongside `docs/deploy.md` so the example file lists
  `APP_PASSWORD_2`.

### Follow-ups

None.

---

## Review — 2026-10-18

**Verdict:** pass

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `session.test.ts` — `readAuthConfig` throws when `APP_PASSWORD_2` is missing, blank, or equal to `APP_PASSWORD` without leaking values |
| AC-2 | yes | `session.test.ts` and `login/page.server.test.ts` — `matchPassword` and `/login` sign `'1'` for `APP_PASSWORD` and `'2'` for `APP_PASSWORD_2` |
| AC-3 | yes | `session.test.ts` — `verifySession` returns `'1'` or `'2'` and `null` for tampered, expired or user-less cookies |
| AC-4 | yes | `hooks.server.test.ts` — `handle` sets `event.locals.user` for `'1'` and `'2'` |
| AC-5 | yes | `layout.server.test.ts` — returns `queueCount: 0` when `locals.user` is absent on `/login` (ISS-15) |

Suite run for review: `pnpm test` — `Test Files 26 passed (26)`, `Tests 224 passed (224)`. `pnpm check` — `0 errors and 0 warnings`.

### Drift

None. Matches `concept.md` and `architecture.md`.

### Findings

- None that change behaviour.

### Follow-ups

None.



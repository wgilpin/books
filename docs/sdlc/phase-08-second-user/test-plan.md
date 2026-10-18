# Test plan — Phase 08 Second user

## Coverage

| Done criterion | Proved by | Kind |
|---|---|---|---|
| DC-1 | `session.test.ts` — `readAuthConfig` throws when `APP_PASSWORD_2` is missing, blank, or equal to `APP_PASSWORD` | automated |
| DC-2 | `session.test.ts` and `login/page.server.test.ts` — `checkPassword` and `/login` sign `'1'` for `APP_PASSWORD` and `'2'` for `APP_PASSWORD_2`, and `verifySession` rejects tampered, expired or user-less cookies | automated |
| DC-3 | `hooks.server.test.ts` and `layout.server.test.ts` — `handle` populates `event.locals.user`, and `+layout.server.ts` returns `0` with no session on `/login` (ISS-15) | automated |
| DC-4 | `db.test.ts` — migration `009_user_scope.sql` preserves existing `owned`, `owned_import` and `book_mark` rows under user `'1'` and allows user `'2'` rows for the same ASIN and work | automated |
| DC-5 | `marks.test.ts`, `page.server.test.ts`, `queue/page.server.test.ts` and `import/page.server.test.ts` — imports, marks, `/` list and `/queue` for user `'2'` are isolated from user `'1'` | automated |

## Gaps

No gaps.

## How to run

`pnpm test`

## Test data

- `tests/setup-env.ts` (`TEST_PASSWORD`, `TEST_PASSWORD_2`, `TEST_SECRET`),
  in-memory SQLite database, and existing `tests/fixtures/` files.

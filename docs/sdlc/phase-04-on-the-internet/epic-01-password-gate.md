# Epic 01 — Password gate

**Phase:** 04 On the internet
**Goal:** Nothing but `/login` answers without a session, on localhost.
**Done criteria covered:** DC-1, DC-2, DC-3, DC-4, DC-5, DC-10

## Behaviour

I open `localhost:3000` and land on Login. I enter the password from
`APP_PASSWORD` and land on the list. The browser keeps me logged in for 30
days. A visitor with no session, or a forged one, sees only Login.

## Acceptance criteria

- **AC-1** — Given no session cookie, when I open `/`, `/import` or `/queue`,
  then I get a 303 to `/login`.
- **AC-2** — Given no session cookie, when a form posts to `/?/own` or
  `/import`, then I get a 303 to `/login` and the database is unchanged.
- **AC-3** — Given the Login page, when I submit the right password, then a
  session cookie is set with `HttpOnly`, `SameSite=Lax`, `Path=/` and a 30-day
  `Max-Age`, and I get a 303 to `/`.
- **AC-4** — Given the Login page, when I submit a wrong or empty password,
  then I see "Wrong password" and no cookie is set.
- **AC-5** — Given a session cookie with a changed signature, signed with
  another secret, or past its expiry, when I open `/`, then I get a 303 to
  `/login`.
- **AC-6** — Given `APP_PASSWORD` or `SESSION_SECRET` is missing or empty,
  when the server module loads, then it throws and names the missing variable.
- **AC-7** — Given a failed login, when the page renders again, then the
  password field is empty and the response holds no copy of the password.
- **AC-8** — Given a successful login, then the cookie holds only an expiry
  and a signature, and nothing that contains or reveals the password.

## Tests

- `src/lib/server/session.test.ts` — sign then verify round-trips (AC-3);
  tampered, wrong-secret and expired cookies fail (AC-5); `readAuthConfig`
  throws on each missing or empty variable (AC-6); the password check is
  constant-time and rejects a different length (AC-4).
- `src/hooks.server.test.ts` — `handle` with no cookie redirects each page
  (AC-1) and a form POST (AC-2); `/login` and static assets pass; a valid
  cookie passes (AC-3).
- `src/routes/login/page.server.test.ts` — right password sets the cookie and
  redirects (AC-3); wrong and empty passwords return 400 (AC-4).
- `src/routes/login/page.test.ts` — the form has a labelled password field and
  a submit button, and shows the error with the field empty (AC-7).
- `src/routes/login/page.server.test.ts` — the failure data and the cookie jar
  hold no copy of the password (AC-7); the success cookie value does not
  contain it (AC-8).

## Files

- `src/lib/server/session.ts` — new: `readAuthConfig`, `signSession`,
  `verifySession`, `checkPassword`
- `src/hooks.server.ts` — new: the gate
- `src/routes/login/+page.server.ts`, `+page.svelte` — new
- `src/app.d.ts` — `Locals` gains nothing yet, unless the build needs it
- `vite.config.js` — test values for both variables in `test.env`
- `docker-compose.yml` — `env_file: .env` on the app service
- `.env.example` — new: the two variable names, no values

## Out of scope

The throttle, the public origin, the `Secure` flag, a log-out button.

## Notes

- Cookie value: `<expiry ms>.<HMAC-SHA256 of expiry, base64url>`, keyed by
  `SESSION_SECRET`. No server-side session table.
- **The password stays on the server.** Read it from `$env/dynamic/private`,
  never `$env/static/private`: the static form inlines the value into the
  server bundle and so into the image. Kit refuses to import either into
  client code. The form uses `method="POST"`, so the password never lands in a
  URL. `fail()` returns the error text only, never the submitted fields. Never
  log the request body. The password field takes
  `autocomplete="current-password"` and no `value`.
- Compare the password with `crypto.timingSafeEqual` over the SHA-256 of both
  sides, so the lengths always match.
- Set `secure: false` on the cookie in this epic. SvelteKit sets `Secure` by
  default off localhost, and Safari drops it on `http://localhost`. Epic 03
  turns it on for the public host.
- Let `/login` and kit's own `/_app/` assets through the gate. `static/app.css`
  is served before `handle`, so it needs nothing.
- The backup sidecar reuses the image. Do not let `readAuthConfig` run there:
  it runs `backup.sh`, not `node build`, so it is safe as long as the check
  lives in `hooks.server.ts`.
- `.env` is already in `.gitignore`. `.dockerignore` must also keep it out of
  the image. Add it.
- Login uses the design tokens and the existing `PageHeader`. One field, one
  primary button.

---

## Build note — 2026-10-04

**Result:** green

### Tasks done

1. Session module: sign, verify, constant-time password check, and the config
   read from `$app/env/private`.
2. The gate in `src/hooks.server.ts`, with an `init` hook that refuses to start
   without the two variables.
3. The `/login` route and page, with the design tokens and `PageHeader`.
4. `src/env.ts` declares the two variables. `docker-compose.yml` reads `.env`.
   `.env.example` names the variables. `.dockerignore` excludes `.env`.
5. Checked the built server by hand on port 3999, with an in-memory database.

### Tests added

- `src/lib/server/session.test.ts` — verifies a cookie it signed; lasts 30
  days; rejects a changed signature or expiry; rejects another secret; rejects
  a missing or malformed cookie; holds only an expiry and a signature, with no
  trace of the password; accepts the right password only; reads from
  `$app/env/private`; declares both variables private and read at startup;
  throws and names a missing or blank variable, without its value.
- `src/hooks.server.test.ts` — sends `/`, `/import`, `/queue`, `/?genre=sf` to
  `/login`; runs no action for a POST to `/?/mark`, `/?/refresh`, `/import`;
  lets `/login` through; lets a valid session through; sends a forged or
  expired session to `/login`; does not treat `/loginx` as public; starts when
  both variables are set.
- `src/routes/login/page.server.test.ts` — right password sets a 30-day
  `HttpOnly`, `SameSite=Lax` cookie and redirects to `/`; "Wrong password" and
  no cookie for a wrong, empty or absent password; no copy of the password in
  the failure data; no trace of the password in the cookie.
- `src/routes/login/page.test.ts` — a labelled password field in a POST form;
  the error with an empty field after a failure.
- `tests/setup-env.ts` — mocks `$app/env/private` with test values, through
  `setupFiles` in `vite.config.js`.

### Suite result

`pnpm test` — `Test Files 21 passed (21)`, `Tests 185 passed (185)`.
`pnpm check` — 0 errors. `pnpm build` — done, with no variables set.

Built server, by hand: no variables → exits with "APP_PASSWORD is not set";
blank secret → exits, password not in the log. With both set: `GET /` → 303
to `/login`; `POST /?/mark` with no session → 303 to `/login`; wrong password →
400 "Wrong password", the attempt not echoed; right password → 303 to `/` with
`session=<expiry>.<mac>; Max-Age=2592000; Path=/; HttpOnly; SameSite=Lax`;
`GET /` with the cookie → 200. The password appears nowhere in `build/` and
nowhere in the server log.

### Deviations from the plan

- **`$app/env/private`, not `$env/dynamic/private`.** SvelteKit 3 removed the
  `$env/*` modules. Variables are now declared in `src/env.ts` and imported
  from `$app/env/private`, which is server-only and read at startup. The
  guarantee the plan wanted holds: kit refuses to import it into client code.
- **The fail-closed check is in `init`, not in the env schema.** Kit also
  validates the schema during `vite build`. A required schema would force the
  password into the Docker build. The schemas allow a missing value, and
  `init` in `hooks.server.ts` throws at server start instead.
- **Test values come from a mock, not `test.env`.** Under Vitest,
  `$app/env/private` is empty, so `tests/setup-env.ts` mocks it.
- **AC-2 uses `/?/mark`.** The plan said `/?/own`, but "I own this" posts to
  the `mark` action since phase 05.
- **AC-2 proves "database unchanged" by the action never running.** The gate
  returns before `resolve`, so no action code runs. The test asserts that
  `resolve` is not called.
- A password-field style added to `static/app.css`, from the existing tokens.

### Follow-ups

- `docker compose up` now needs a `.env` file next to `docker-compose.yml`.
  Copy `.env.example` and fill it in before the next container start.
- pnpm rewrites `pnpm-lock.yaml` (adds `@pnpm/exe`) on every run. I reverted it
  each time. It is not part of this epic.

---

## Review — 2026-10-04

**Verdict:** pass with follow-ups

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `hooks.server.test.ts` — sends `/`, `/import`, `/queue`, `/?genre=sf` to `/login` |
| AC-2 | yes | `hooks.server.test.ts` — runs no form action for a POST with no session |
| AC-3 | yes | `login/page.server.test.ts` — 30-day `HttpOnly`, `SameSite=Lax` cookie and 303 to `/`; `hooks.server.test.ts` — a valid session passes |
| AC-4 | yes | `login/page.server.test.ts` — "Wrong password" and no cookie for wrong, empty and absent |
| AC-5 | yes | `session.test.ts` — changed signature, changed expiry, other secret, expired; `hooks.server.test.ts` — forged or expired session |
| AC-6 | yes | `session.test.ts` — throws and names a missing or blank variable; the build note records the built server exiting with no variables and with a blank secret |
| AC-7 | yes | `login/page.server.test.ts` — no copy of the password in the failure data; `login/page.test.ts` — empty field after a failure |
| AC-8 | yes | `session.test.ts` — only an expiry and a signature; `login/page.server.test.ts` — no trace in the cookie |

`pnpm test` run for this review: `Tests 185 passed (185)`.

### Drift

None against `architecture.md` or `concept.md`. The env API differs from the
plan's wording because SvelteKit 3 replaced `$env/*` with `$app/env/*`. The
build note records it. The architecture names no env module, so nothing
contradicts it.

### Findings

1. **Low — `/login` exposes the queue count.** `src/routes/+layout.server.ts`
   runs for `/login` too, so a visitor with no session sees `queueCount` in the
   page data and in `/login/__data.json`. It is one number, not a title. But
   DC-1 says a visitor sees no book data. Fix: return nothing from the layout
   load when there is no session, or skip it on `/login`.
2. **Info — `__data.json` requests are gated.** Checked by hand: with no
   session, `/__data.json`, `/queue/__data.json` and `/import/__data.json`
   return a data redirect to `/login` and no book data.
3. **Info — no way to end a session early** except changing `SESSION_SECRET`.
   This is in the plan's "Not in this phase", and recorded so the deploy doc
   says it.

### Follow-ups

- ISS-15 — the layout load gives the queue count to `/login` (finding 1).

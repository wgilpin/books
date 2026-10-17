# Epic 03 — Public route

**Phase:** 04 On the internet
**Goal:** `https://books.teleosis.ai` serves the app to my phone.
**Done criteria covered:** DC-7, DC-8, DC-9, DC-10

## Behaviour

The container joins the `web-routing` network, so Caddy reaches it by name.
The app trusts both `https://books.teleosis.ai` and `http://localhost:3000`
for form posts. Over the public domain the session cookie carries `Secure`.
`docs/deploy.md` holds the Caddy block and the host steps that I run.

## Acceptance criteria

- **AC-1** — Given a login whose `Host` header is `books.teleosis.ai`, then
  the cookie carries `Secure`. Given `localhost:3000`, then it does not.
- **AC-2** — Given the build, then `paths.origin` is
  `https://books.teleosis.ai` and `csrf.trustedOrigins` holds
  `http://localhost:3000`.
- **AC-3** — Given `docker-compose.yml`, then the app service sits on the
  external `web-routing` network and keeps `container_name: books-app`.
- **AC-4** — Given the Caddy block in `docs/deploy.md`, then it routes
  `http://books.teleosis.ai` to `books-app` port 3000 with `dynamic a` and a
  10s refresh.
- **AC-6** — Given the repo, then `.dockerignore` lists `.env`, and no build
  arg in the `Dockerfile` or `docker-compose.yml` carries the password.
- **AC-5** — Given the stack is up and Caddy reloaded, when I follow Manual A
  in the test plan, then every step passes.

## Tests

- `src/routes/login/page.server.test.ts` — the `Secure` flag follows the
  `Host` header (AC-1).
- `deploy-config.test.ts` — reads `vite.config.js` origins (AC-2), parses
  `docker-compose.yml` for the network and container name (AC-3), and checks
  the Caddy block in `docs/deploy.md` (AC-4).
- `deploy-config.test.ts` — the `.dockerignore` and build-arg checks (AC-6).
- Manual A — proves AC-5, and the last step of DC-7, DC-8 and DC-9.

## Files

- `docker-compose.yml` — `networks: [web-routing]` on `app`, and the external
  network at the bottom
- `vite.config.js` — `paths.origin` from `APP_ORIGIN`, defaulting to the
  public origin; `csrf.trustedOrigins` with localhost
- `Dockerfile` — the `APP_ORIGIN` build arg default changes to the public
  origin
- `src/routes/login/+page.server.ts` — `secure` off for a localhost `Host`
- `docs/deploy.md` — new: the Caddy block, the Cloudflare hostname, the
  compose command, and Manual A
- `deploy-config.test.ts` — new, under `scripts/` or `tests/`; add its folder
  to the Vitest `include`

## Out of scope

Editing `~/projects/caddy/Caddyfile` or Cloudflare. Those are my steps. ISS-1,
the port clash with rayv.

## Notes

- Every `docker` command needs a yes first, per `CLAUDE.md`.
- Read the `Host` header, not `event.url`. `paths.origin` can rewrite the
  origin kit reports. Safari drops a `Secure` cookie on `http://localhost`,
  which is why localhost turns it off.
- The `.dockerignore` excludes `*.md`, so `docs/deploy.md` stays out of the
  image. That is fine.
- `docker-compose.yml` has no YAML parser in the dependencies. A line check
  in the test is enough. Do not add a dependency for it.

---

## Build note — 2026-10-04

**Result:** green, with Manual A still to run on the host

### Tasks done

1. `origins.js` holds the public and local origins. `vite.config.js` sets
   `paths.origin` to the public origin and `csrf.trustedOrigins` to localhost.
   The `Dockerfile` default `APP_ORIGIN` is now the public origin.
2. The login cookie is `Secure` for every `Host` except `localhost` and
   `127.0.0.1`, with or without a port.
3. `docker-compose.yml` puts `books-app` on the external `web-routing` network,
   and keeps `default` for the backup sidecar.
4. `docs/deploy.md` holds the secrets step, the compose command, the Caddy
   block, the tunnel step, and Manual A.
5. Checked the built server by hand on port 3999.

### Tests added

- `tests/deploy-config.test.ts` — trusts the public domain as the origin and
  localhost for form posts; builds the image for the public origin by
  default; puts the app on the external `web-routing` network under a fixed
  name; gives the app its secrets from `.env` at run time; keeps `.env` out of
  the build context; passes no secret as a build arg or an inline value; holds
  the Caddy block for `books-app` on port 3000 with dynamic upstreams; holds
  the manual phone check.
- `src/routes/login/page.server.test.ts` — marks the cookie `Secure` for the
  public host; leaves `Secure` off for `localhost:3000`, `localhost` and
  `127.0.0.1:3000`.
- `vite.config.js` — Vitest now includes `tests/**/*.test.ts`.

### Suite result

`pnpm test` — `Test Files 23 passed (23)`, `Tests 205 passed (205)`.
`pnpm check` — 0 errors. `pnpm build` — done.

Built server, by hand: a login with `Host: books.teleosis.ai` and the public
origin → 303 and `HttpOnly; Secure; SameSite=Lax`. With `Host: localhost:3000`
and the local origin → 303 and no `Secure`. With `Origin: https://evil.example`
→ 403 "Cross-site POST form submissions are forbidden". A logged-in form post
from the public origin passes the CSRF check.

Manual A is not run. It needs `docker compose up`, the Caddy edit and the
tunnel hostname, which are the user's steps.

### Deviations from the plan

- The origins live in `origins.js`, so the test reads real values and the
  config imports the same ones. The plan said the test would read
  `vite.config.js`. It still checks that the config uses the constants.
- The app also stays on the compose `default` network, so the sidecar setup
  does not change.
- The secret check ignores comment lines. A comment in `docker-compose.yml`
  names the variables, and it passes nothing.
- Manual A in `docs/deploy.md` uses "Refresh from Wikidata" as the form check,
  not "I own this". "I own this" has no undo.

### Follow-ups

- Run `docs/deploy.md` steps 1 to 4, then Manual A. DC-9 and the last steps of
  DC-7, DC-8 and DC-10 stay unproved until then.

---

## Review — 2026-10-04

**Verdict:** fail

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `login/page.server.test.ts` — `Secure` for the public host, off for three local hosts |
| AC-2 | yes | `deploy-config.test.ts` — trusts the public domain as the origin and localhost for form posts; the build note records the 403 for a foreign origin |
| AC-3 | yes | `deploy-config.test.ts` — the external `web-routing` network under `books-app` |
| AC-4 | yes | `deploy-config.test.ts` — the Caddy block for `books-app` on port 3000 with dynamic upstreams |
| AC-5 | no | Manual A — not run. The build note records no walkthrough |
| AC-6 | yes | `deploy-config.test.ts` — `.env` out of the build context; no secret as a build arg or an inline value |

`pnpm test` run for this review: `Tests 205 passed (205)`.

AC-5 fails because no one has run Manual A yet. The code is not at fault. It
needs `docker compose up`, the Caddy edit, the tunnel hostname and a phone.
Those are the user's steps, so a repair build cannot clear it.

### Drift

None. The architecture names the env-var password, the signed cookie, the
`web-routing` network and the Caddy route. This epic adds the last two.

### Findings

1. **Medium — fix ISS-15 before the domain goes live.** From epic 01:
   `/login` gives the queue count to a visitor with no session. On
   `localhost` that was harmless. On the public domain anyone can read it.
2. **Info — the `Secure` flag trusts the `Host` header.** A client that sends
   `Host: localhost` gets a cookie without `Secure`, but only for itself. It
   gains nothing.
3. **Info — the Docker image must be rebuilt** for the new `APP_ORIGIN`
   default. `docker compose up -d --build` in `docs/deploy.md` does that.

### Follow-ups

- Run `docs/deploy.md` steps 1 to 4 and Manual A, record the result in this
  file, then review again.

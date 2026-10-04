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

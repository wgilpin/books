# Phase 04 — On the internet

**Goal:** Use the app away from my Mac.

## Scope

- A password gate in `src/hooks.server.ts`. Every route except `/login` needs
  a session.
- A new `/login` route and a `session` module in `src/lib/server/`: the
  env-var password, and a signed session cookie.
- A throttle on failed logins.
- `docker-compose.yml` joins the `web-routing` network. `vite.config.js` trusts
  both origins. `docs/deploy.md` holds the Caddy block and the host steps.

## Done criteria

- **DC-1** — A visitor with no session who opens any page except `/login` is
  sent to `/login` and sees no book data. A form post with no session changes
  nothing.
- **DC-2** — The right password lands on the list. The session lasts 30 days,
  through a browser restart.
- **DC-3** — A wrong password shows "Wrong password" and sets no session.
- **DC-4** — A changed, forged or expired session cookie counts as no session.
- **DC-5** — The app refuses to start when `APP_PASSWORD` or `SESSION_SECRET`
  is missing or empty.
- **DC-6** — After five wrong passwords in 15 minutes, every login is refused
  for 15 minutes, the right password included, with "Too many attempts. Try
  again later."
- **DC-7** — Every form (refresh, import, own, marks, genre) works through
  `https://books.teleosis.ai` and through `http://localhost:3000`.
- **DC-8** — Over the public domain, the session cookie carries `HttpOnly`,
  `SameSite=Lax` and `Secure`.
- **DC-9** — On my phone, on mobile data, `books.teleosis.ai` shows Login,
  then the list after the password.
- **DC-10** — The password exists only in the server's environment and in the
  Login form as I type it. It never appears in a cookie, a URL, a response
  body, the client JavaScript, the Docker image, or a log line.

## Not in this phase

More than one user, password reset, a log-out button, Cloudflare Access, and
the port clash with rayv (ISS-1).

## Epics

1. `epic-01-password-gate.md` — the login page, the session cookie and the
   gate, on localhost.
2. `epic-02-login-throttle.md` — lock out logins after five failures.
3. `epic-03-public-route.md` — the network, the origins, the Caddy block, and
   the phone check.

Epics 02 and 03 both build on 01 and are independent of each other.

## Risks

- **No rate limit from Cloudflare by default.** The architecture left this
  open. Epic 02 answers it in the app. The lockout is global, so a stranger
  can lock me out for 15 minutes. That is the trade for one user.
- **Secure cookie over http.** Caddy and the tunnel talk plain http to the
  container, so the app sees `http`. The `Secure` flag must follow the `Host`
  header, not the request protocol. Safari refuses a `Secure` cookie on
  `http://localhost`, so localhost needs it off.
- **CSRF with two origins.** Kit 3 trusts one `paths.origin`. The other origin
  goes in `csrf.trustedOrigins`, or every form fails on one of the two.
- **Host steps outside the repo.** The Caddy edit, the Cloudflare hostname and
  the `docker compose up` are mine to run, and each docker command needs a yes.

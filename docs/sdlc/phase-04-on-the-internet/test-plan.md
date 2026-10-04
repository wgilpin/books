# Test plan — Phase 04 On the internet

## Coverage

| Done criterion | Proved by | Kind |
|---|---|---|
| DC-1 | `hooks.server.test.ts` — no cookie redirects `/`, `/import`, `/queue` to `/login`; a POST with no cookie gets 303 and the database is unchanged; `/login` passes | automated |
| DC-2 | `login/page.server.test.ts` — right password sets the cookie with `Max-Age` 30 days and redirects to `/`; `hooks.server.test.ts` — a valid cookie passes | automated |
| DC-3 | `login/page.server.test.ts` — wrong password returns 400 "Wrong password" and sets no cookie | automated |
| DC-4 | `session.test.ts` — a changed signature, a cookie signed with another secret, and an expired cookie all fail to verify | automated |
| DC-5 | `session.test.ts` — `readAuthConfig` throws on a missing or empty `APP_PASSWORD` or `SESSION_SECRET` | automated |
| DC-6 | `login/page.server.test.ts` — five failures then the right password gets 429; after 15 minutes on a fake clock it works again | automated |
| DC-7 | `deploy-config.test.ts` — the built config trusts both origins. Manual A — submit each form once through each origin | automated + manual |
| DC-8 | `login/page.server.test.ts` — `Secure` set for the public `Host`, off for `localhost:3000`. Manual A — read the `Set-Cookie` header over the domain | automated + manual |
| DC-9 | Manual A | manual |
| DC-10 | `login/page.server.test.ts` — after a failed login, the action's return data and the cookie jar hold no copy of the password; after a success, the cookie value does not contain it. `login/page.test.ts` — the rendered page after a failure has an empty password field. `session.test.ts` — the module reads the password from `$env/dynamic/private` (kit refuses to bundle it into client code). `deploy-config.test.ts` — `.dockerignore` lists `.env`, and neither the `Dockerfile` nor `docker-compose.yml` passes the password as a build arg. Manual A step 9 | automated + manual |

### Manual A — the phone check (epic 03)

1. Run `docker compose up -d --build` on the Mac, after a yes.
2. Add the Caddy block from `docs/deploy.md` to `~/projects/caddy/Caddyfile`
   and reload Caddy. Add `books.teleosis.ai` to the Cloudflare tunnel.
3. On the phone, with Wi-Fi off, open `https://books.teleosis.ai`. Expect
   Login.
4. Enter a wrong password. Expect "Wrong password".
5. Enter the right password. Expect the list.
6. Tap "I own this" on one book, then undo it from the database or the
   override. Expect no "Cross-site POST" error.
7. On the Mac, open the site in Chrome DevTools, log in, and read the
   `Set-Cookie` header. Expect `HttpOnly`, `SameSite=Lax` and `Secure`.
8. On the Mac, open `http://localhost:3000`, log in, and press refresh. Expect
   no error.
9. Run `docker compose logs app` and search for the password. Expect no
   match. Search `build/client/` on the Mac for it. Expect no match.

## Gaps

No gaps. DC-7, DC-8 and DC-9 depend on the real tunnel, so their last step
stays manual. The automated rows prove the mechanism.

## How to run

`pnpm test`

## Test data

In-memory SQLite, as now. `vite.config.js` sets test values for
`APP_PASSWORD` and `SESSION_SECRET` in `test.env`. The throttle takes an
injected clock.

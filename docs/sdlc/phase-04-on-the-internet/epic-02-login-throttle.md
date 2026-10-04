# Epic 02 — Login throttle

**Phase:** 04 On the internet
**Goal:** Stop a stranger guessing the password.
**Done criteria covered:** DC-6

## Behaviour

After five wrong passwords inside 15 minutes, Login refuses every attempt for
15 minutes, the right one included. It says "Too many attempts. Try again
later." The count lives in memory and resets when the container restarts.

## Acceptance criteria

- **AC-1** — Given four wrong passwords in the last 15 minutes, when I submit
  the right password, then I log in.
- **AC-2** — Given five wrong passwords in the last 15 minutes, when I submit
  the right password, then I get 429, "Too many attempts. Try again later.",
  and no cookie.
- **AC-3** — Given a lockout that started 15 minutes ago, when I submit the
  right password, then I log in.
- **AC-4** — Given five wrong passwords spread over more than 15 minutes, when
  I submit the right password, then I log in.
- **AC-5** — Given a successful login, then the failure count resets to zero.

## Tests

- `src/lib/server/throttle.test.ts` — a fake clock drives AC-1 to AC-5 on the
  pure throttle.
- `src/routes/login/page.server.test.ts` — five failures then the right
  password returns 429 with no cookie (AC-2).

## Files

- `src/lib/server/throttle.ts` — new: a sliding window over failure times,
  with an injected clock
- `src/routes/login/+page.server.ts` — consult the throttle before the check
- `src/routes/login/page.server.test.ts` — the 429 case

## Out of scope

Per-IP limits, a persisted count, alerts.

## Notes

- One global counter. Behind the tunnel, the client IP is Cloudflare's unless
  the app reads `CF-Connecting-IP`, and one user does not need per-IP limits.
- Reset the throttle in `beforeEach`, the same way the route tests clear
  tables.

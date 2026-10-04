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

---

## Build note — 2026-10-04

**Result:** green

### Tasks done

1. `createThrottle` with an injected clock: a sliding 15-minute window of
   failures, a 15-minute lockout at five, and a reset on success.
2. The login action checks the lock first, counts a wrong password, and
   clears the count on success. A locked login reads no password.

### Tests added

- `src/lib/server/throttle.test.ts` — allows a login after four failures;
  locks after five failures in 15 minutes; unlocks 15 minutes after the
  lockout starts; does not lock for five failures spread over more than 15
  minutes; resets the count after a successful login; starts a fresh count
  after a lockout ends.
- `src/routes/login/page.server.test.ts` — refuses even the right password
  after five wrong ones, and sets no cookie; logs in after four wrong
  passwords. The existing tests reset the throttle in `beforeEach`.

### Suite result

`pnpm test` — `Test Files 22 passed (22)`, `Tests 193 passed (193)`.
`pnpm check` — 0 errors.

### Deviations from the plan

- AC-3 is proved on the throttle with the fake clock, not through the route.
  The route has no clock seam, and the throttle is the only code that decides.
- A login attempt during a lockout does not extend the lockout. The spec did
  not say, and extending it would let a stranger keep me out for good.

### Follow-ups

None.

---

## Review — 2026-10-04

**Verdict:** pass

### Acceptance criteria

| AC | Met | Proved by |
|---|---|---|
| AC-1 | yes | `throttle.test.ts` — allows a login after four failures; `login/page.server.test.ts` — logs in after four wrong passwords |
| AC-2 | yes | `login/page.server.test.ts` — refuses even the right password after five wrong ones, and sets no cookie (429) |
| AC-3 | yes | `throttle.test.ts` — unlocks 15 minutes after the lockout starts |
| AC-4 | yes | `throttle.test.ts` — does not lock for five failures spread over more than 15 minutes |
| AC-5 | yes | `throttle.test.ts` — resets the count after a successful login |

`pnpm test` run for this review: `Tests 193 passed (193)`.

### Drift

None. This answers the architecture's open question on rate limiting, as the
phase plan said it would.

### Findings

1. **Info — a stranger can lock me out for 15 minutes at a time.** Accepted in
   the phase risks. The lockout does not extend while locked, so the cost is
   bounded.
2. **Info — the count is per process.** One container, one process, so one
   count. A second replica would split it. None is planned.

### Follow-ups

None.

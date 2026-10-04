/** Wrong passwords allowed inside the window before logins lock. */
export const MAX_FAILURES = 5;
/** The window for counting failures, and the length of a lockout. */
export const LOCKOUT_MS = 15 * 60 * 1000;

/**
 * One global count of failed logins, in memory. A restart clears it. Behind the tunnel every
 * client shares Cloudflare's address, and there is one user, so there is no per-IP count.
 */
export function createThrottle(now: () => number = Date.now) {
	let failures: number[] = [];
	let lockedUntil = 0;

	return {
		locked: () => now() < lockedUntil,
		fail() {
			const t = now();
			failures = failures.filter((f) => t - f < LOCKOUT_MS);
			failures.push(t);
			if (failures.length >= MAX_FAILURES) {
				lockedUntil = t + LOCKOUT_MS;
				failures = [];
			}
		},
		succeed() {
			failures = [];
		},
		reset() {
			failures = [];
			lockedUntil = 0;
		}
	};
}

export const loginThrottle = createThrottle();

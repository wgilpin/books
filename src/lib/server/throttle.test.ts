import { describe, expect, it } from 'vitest';
import { createThrottle, LOCKOUT_MS } from './throttle';

function clock(start = Date.parse('2026-10-04T12:00:00Z')) {
	let t = start;
	return { now: () => t, advance: (ms: number) => (t += ms) };
}

const MINUTE = 60_000;

describe('login throttle', () => {
	it('allows a login after four failures', () => {
		const c = clock();
		const throttle = createThrottle(c.now);
		for (let i = 0; i < 4; i++) throttle.fail();
		expect(throttle.locked()).toBe(false);
	});

	it('locks after five failures in 15 minutes', () => {
		const c = clock();
		const throttle = createThrottle(c.now);
		for (let i = 0; i < 5; i++) {
			throttle.fail();
			c.advance(2 * MINUTE);
		}
		expect(throttle.locked()).toBe(true);
	});

	it('unlocks 15 minutes after the lockout starts', () => {
		const c = clock();
		const throttle = createThrottle(c.now);
		for (let i = 0; i < 5; i++) throttle.fail();
		c.advance(LOCKOUT_MS - 1);
		expect(throttle.locked()).toBe(true);
		c.advance(1);
		expect(throttle.locked()).toBe(false);
	});

	it('does not lock for five failures spread over more than 15 minutes', () => {
		const c = clock();
		const throttle = createThrottle(c.now);
		for (let i = 0; i < 5; i++) {
			throttle.fail();
			c.advance(4 * MINUTE);
		}
		expect(throttle.locked()).toBe(false);
	});

	it('resets the count after a successful login', () => {
		const c = clock();
		const throttle = createThrottle(c.now);
		for (let i = 0; i < 4; i++) throttle.fail();
		throttle.succeed();
		for (let i = 0; i < 4; i++) throttle.fail();
		expect(throttle.locked()).toBe(false);
	});

	it('starts a fresh count after a lockout ends', () => {
		const c = clock();
		const throttle = createThrottle(c.now);
		for (let i = 0; i < 5; i++) throttle.fail();
		c.advance(LOCKOUT_MS);
		throttle.fail();
		expect(throttle.locked()).toBe(false);
	});
});

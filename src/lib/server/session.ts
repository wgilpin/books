import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { APP_PASSWORD, APP_PASSWORD_2, SESSION_SECRET } from '$app/env/private';

export const SESSION_COOKIE = 'session';
/** Seconds a login lasts. */
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export type UserId = '1' | '2';
export type AuthConfig = { password: string; password2: string; secret: string };

/**
 * The login passwords and the cookie-signing secret. They come from `$app/env/private`, which is
 * server-only and read when the app starts (see src/env.ts), so the build never holds them.
 * Throws, naming the variable but never its value, when one is missing, blank, or duplicated.
 */
export function readAuthConfig(
	source: { APP_PASSWORD?: string; APP_PASSWORD_2?: string; SESSION_SECRET?: string } = {
		APP_PASSWORD,
		APP_PASSWORD_2,
		SESSION_SECRET
	}
): AuthConfig {
	const password = required(source.APP_PASSWORD, 'APP_PASSWORD');
	const secret = required(source.SESSION_SECRET, 'SESSION_SECRET');
	const password2 = required(source.APP_PASSWORD_2, 'APP_PASSWORD_2');
	if (equal(password, password2)) throw new Error('APP_PASSWORD and APP_PASSWORD_2 must be different.');
	return { password, password2, secret };
}

function required(value: string | undefined, name: string): string {
	if (!value?.trim()) throw new Error(`${name} is not set. Add it to .env.`);
	return value;
}

/** A session cookie value: the user id, the expiry in ms, then their HMAC. It holds nothing about the password. */
export function signSession(secret: string, now = Date.now(), user: UserId = '1'): string {
	const payload = `${user}.${now + SESSION_MAX_AGE * 1000}`;
	return `${payload}.${mac(payload, secret)}`;
}

export function verifySession(value: string | undefined, secret: string, now = Date.now()): UserId | null {
	const match = /^([12])\.(\d+)\.([A-Za-z0-9_-]+)$/.exec(value ?? '');
	if (!match) return null;
	const [, user, expiry, given] = match;
	return equal(given, mac(`${user}.${expiry}`, secret)) && Number(expiry) > now ? (user as UserId) : null;
}

/** Constant-time compare. Hashing both sides first makes the lengths always match. */
export function checkPassword(given: string, expected: string): boolean {
	return equal(given, expected);
}

/** Checks both user passwords in constant time and returns the matched user id, or null. */
export function matchPassword(given: string, { password, password2 }: { password: string; password2: string }): UserId | null {
	const m1 = equal(given, password);
	const m2 = equal(given, password2);
	return m1 ? '1' : m2 ? '2' : null;
}

function mac(payload: string, secret: string): string {
	return createHmac('sha256', secret).update(payload).digest('base64url');
}

function equal(a: string, b: string): boolean {
	const hash = (s: string) => createHash('sha256').update(s).digest();
	return timingSafeEqual(hash(a), hash(b));
}

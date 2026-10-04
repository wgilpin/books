import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { APP_PASSWORD, SESSION_SECRET } from '$app/env/private';

export const SESSION_COOKIE = 'session';
/** Seconds a login lasts. */
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export type AuthConfig = { password: string; secret: string };

/**
 * The login password and the cookie-signing secret. They come from `$app/env/private`, which is
 * server-only and read when the app starts (see src/env.ts), so the build never holds them.
 * Throws, naming the variable but never its value, when one is missing or blank.
 */
export function readAuthConfig(
	source: { APP_PASSWORD?: string; SESSION_SECRET?: string } = { APP_PASSWORD, SESSION_SECRET }
): AuthConfig {
	return { password: required(source.APP_PASSWORD, 'APP_PASSWORD'), secret: required(source.SESSION_SECRET, 'SESSION_SECRET') };
}

function required(value: string | undefined, name: string): string {
	if (!value?.trim()) throw new Error(`${name} is not set. Add it to .env.`);
	return value;
}

/** A session cookie value: the expiry in ms, then its HMAC. It holds nothing about the password. */
export function signSession(secret: string, now = Date.now()): string {
	const expiry = String(now + SESSION_MAX_AGE * 1000);
	return `${expiry}.${mac(expiry, secret)}`;
}

export function verifySession(value: string | undefined, secret: string, now = Date.now()): boolean {
	const match = /^(\d+)\.([A-Za-z0-9_-]+)$/.exec(value ?? '');
	if (!match) return false;
	const [, expiry, given] = match;
	return equal(given, mac(expiry, secret)) && Number(expiry) > now;
}

/** Constant-time compare. Hashing both sides first makes the lengths always match. */
export function checkPassword(given: string, expected: string): boolean {
	return equal(given, expected);
}

function mac(expiry: string, secret: string): string {
	return createHmac('sha256', secret).update(expiry).digest('base64url');
}

function equal(a: string, b: string): boolean {
	const hash = (s: string) => createHash('sha256').update(s).digest();
	return timingSafeEqual(hash(a), hash(b));
}

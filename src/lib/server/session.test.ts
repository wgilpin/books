import { describe, expect, it } from 'vitest';
import { TEST_PASSWORD, TEST_SECRET } from '../../../tests/setup-env';
import { variables } from '../../env';
import { checkPassword, readAuthConfig, SESSION_MAX_AGE, signSession, verifySession } from './session';

const now = Date.parse('2026-10-04T12:00:00Z');

describe('session cookie', () => {
	it('verifies a cookie it signed', () => {
		expect(verifySession(signSession(TEST_SECRET, now), TEST_SECRET, now)).toBe(true);
	});

	it('lasts 30 days', () => {
		const value = signSession(TEST_SECRET, now);
		expect(SESSION_MAX_AGE).toBe(30 * 24 * 60 * 60);
		expect(verifySession(value, TEST_SECRET, now + (SESSION_MAX_AGE - 1) * 1000)).toBe(true);
		expect(verifySession(value, TEST_SECRET, now + SESSION_MAX_AGE * 1000)).toBe(false);
	});

	it('rejects a cookie with a changed signature or a changed expiry', () => {
		const [expiry, mac] = signSession(TEST_SECRET, now).split('.');
		const flipped = (mac[0] === 'A' ? 'B' : 'A') + mac.slice(1);
		expect(verifySession(`${expiry}.${flipped}`, TEST_SECRET, now)).toBe(false);
		expect(verifySession(`${Number(expiry) + 1000}.${mac}`, TEST_SECRET, now)).toBe(false);
	});

	it('rejects a cookie signed with another secret', () => {
		expect(verifySession(signSession('another secret', now), TEST_SECRET, now)).toBe(false);
	});

	it('rejects a missing or malformed cookie', () => {
		for (const value of [undefined, '', 'abc', '.', '123.', '.abc', 'x.y.z']) {
			expect(verifySession(value, TEST_SECRET, now)).toBe(false);
		}
	});

	it('holds only an expiry and a signature, with no trace of the password', () => {
		const value = signSession(TEST_SECRET, now);
		expect(value).toMatch(/^\d+\.[A-Za-z0-9_-]+$/);
		expect(value).not.toContain(TEST_PASSWORD);
		expect(value).not.toContain(Buffer.from(TEST_PASSWORD).toString('base64url'));
	});
});

describe('checkPassword', () => {
	it('accepts the right password only', () => {
		expect(checkPassword(TEST_PASSWORD, TEST_PASSWORD)).toBe(true);
		expect(checkPassword('wrong', TEST_PASSWORD)).toBe(false);
		expect(checkPassword('', TEST_PASSWORD)).toBe(false);
		expect(checkPassword(TEST_PASSWORD + 'x', TEST_PASSWORD)).toBe(false);
	});
});

describe('readAuthConfig', () => {
	it('reads the password and secret from $app/env/private', () => {
		expect(readAuthConfig()).toEqual({ password: TEST_PASSWORD, secret: TEST_SECRET });
	});
});

describe('startup env check', () => {
	it('declares both variables as private and read at startup, not at build', () => {
		for (const name of ['APP_PASSWORD', 'SESSION_SECRET'] as const) {
			expect(variables[name]).toMatchObject({ schema: expect.anything() });
			expect((variables[name] as { public?: boolean }).public ?? false).toBe(false);
			expect((variables[name] as { static?: boolean }).static ?? false).toBe(false);
		}
	});

	it('throws and names a missing or blank variable, without its value', () => {
		expect(() => readAuthConfig({ SESSION_SECRET: 's' })).toThrow('APP_PASSWORD is not set');
		expect(() => readAuthConfig({ APP_PASSWORD: '', SESSION_SECRET: 's' })).toThrow('APP_PASSWORD is not set');
		expect(() => readAuthConfig({ APP_PASSWORD: 'hunter2' })).toThrow('SESSION_SECRET is not set');
		expect(() => readAuthConfig({ APP_PASSWORD: 'hunter2', SESSION_SECRET: '  ' })).toThrow(/^SESSION_SECRET is not set/);
		try {
			readAuthConfig({ APP_PASSWORD: 'hunter2' });
		} catch (error) {
			expect(String(error)).not.toContain('hunter2');
		}
	});
});

import { describe, expect, it } from 'vitest';
import { TEST_PASSWORD, TEST_PASSWORD_2, TEST_SECRET } from '../../../tests/setup-env';
import { variables } from '../../env';
import { checkPassword, matchPassword, readAuthConfig, SESSION_MAX_AGE, signSession, verifySession } from './session';

const now = Date.parse('2026-10-04T12:00:00Z');

describe('session cookie', () => {
	it('verifies a cookie it signed and returns the user id for user 1 and user 2', () => {
		expect(verifySession(signSession(TEST_SECRET, now), TEST_SECRET, now)).toBe('1');
		expect(verifySession(signSession(TEST_SECRET, now, '1'), TEST_SECRET, now)).toBe('1');
		expect(verifySession(signSession(TEST_SECRET, now, '2'), TEST_SECRET, now)).toBe('2');
	});

	it('lasts 30 days', () => {
		const value = signSession(TEST_SECRET, now, '2');
		expect(SESSION_MAX_AGE).toBe(30 * 24 * 60 * 60);
		expect(verifySession(value, TEST_SECRET, now + (SESSION_MAX_AGE - 1) * 1000)).toBe('2');
		expect(verifySession(value, TEST_SECRET, now + SESSION_MAX_AGE * 1000)).toBeNull();
	});

	it('rejects a cookie with a changed user, a changed expiry or a changed signature', () => {
		const [user, expiry, mac] = signSession(TEST_SECRET, now, '1').split('.');
		const flipped = (mac[0] === 'A' ? 'B' : 'A') + mac.slice(1);
		expect(verifySession(`2.${expiry}.${mac}`, TEST_SECRET, now)).toBeNull();
		expect(verifySession(`${user}.${expiry}.${flipped}`, TEST_SECRET, now)).toBeNull();
		expect(verifySession(`${user}.${Number(expiry) + 1000}.${mac}`, TEST_SECRET, now)).toBeNull();
	});

	it('rejects a cookie signed with another secret', () => {
		expect(verifySession(signSession('another secret', now), TEST_SECRET, now)).toBeNull();
	});

	it('rejects a missing, malformed or pre-multiuser cookie', () => {
		const [, expiry, mac] = signSession(TEST_SECRET, now, '1').split('.');
		for (const value of [undefined, '', 'abc', '.', '123.', '.abc', 'x.y.z', `${expiry}.${mac}`, `3.${expiry}.${mac}`]) {
			expect(verifySession(value, TEST_SECRET, now)).toBeNull();
		}
	});

	it('holds only the user id, expiry and signature, with no trace of either password', () => {
		for (const user of ['1', '2'] as const) {
			const value = signSession(TEST_SECRET, now, user);
			expect(value).toMatch(/^[12]\.\d+\.[A-Za-z0-9_-]+$/);
			for (const pw of [TEST_PASSWORD, TEST_PASSWORD_2]) {
				expect(value).not.toContain(pw);
				expect(value).not.toContain(Buffer.from(pw).toString('base64url'));
			}
		}
	});
});

describe('checkPassword and matchPassword', () => {
	it('accepts the right password only', () => {
		expect(checkPassword(TEST_PASSWORD, TEST_PASSWORD)).toBe(true);
		expect(checkPassword('wrong', TEST_PASSWORD)).toBe(false);
		expect(checkPassword('', TEST_PASSWORD)).toBe(false);
		expect(checkPassword(TEST_PASSWORD + 'x', TEST_PASSWORD)).toBe(false);
	});

	it('matches user 1 for APP_PASSWORD, user 2 for APP_PASSWORD_2, and null otherwise', () => {
		const config = { password: TEST_PASSWORD, password2: TEST_PASSWORD_2 };
		expect(matchPassword(TEST_PASSWORD, config)).toBe('1');
		expect(matchPassword(TEST_PASSWORD_2, config)).toBe('2');
		expect(matchPassword('wrong', config)).toBeNull();
		expect(matchPassword('', config)).toBeNull();
	});
});

describe('readAuthConfig', () => {
	it('reads both passwords and secret from $app/env/private', () => {
		expect(readAuthConfig()).toEqual({ password: TEST_PASSWORD, password2: TEST_PASSWORD_2, secret: TEST_SECRET });
	});
});

describe('startup env check', () => {
	it('declares all three variables as private and read at startup, not at build', () => {
		for (const name of ['APP_PASSWORD', 'APP_PASSWORD_2', 'SESSION_SECRET'] as const) {
			expect(variables[name]).toMatchObject({ schema: expect.anything() });
			expect((variables[name] as { public?: boolean }).public ?? false).toBe(false);
			expect((variables[name] as { static?: boolean }).static ?? false).toBe(false);
		}
	});

	it('throws and names a missing, blank or duplicate variable, without its value', () => {
		expect(() => readAuthConfig({ SESSION_SECRET: 's' })).toThrow('APP_PASSWORD is not set');
		expect(() => readAuthConfig({ APP_PASSWORD: '', SESSION_SECRET: 's' })).toThrow('APP_PASSWORD is not set');
		expect(() => readAuthConfig({ APP_PASSWORD: 'hunter2' })).toThrow('SESSION_SECRET is not set');
		expect(() => readAuthConfig({ APP_PASSWORD: 'hunter2', SESSION_SECRET: '  ' })).toThrow(/^SESSION_SECRET is not set/);
		expect(() => readAuthConfig({ APP_PASSWORD: 'hunter2', SESSION_SECRET: 's' })).toThrow('APP_PASSWORD_2 is not set');
		expect(() => readAuthConfig({ APP_PASSWORD: 'hunter2', APP_PASSWORD_2: '  ', SESSION_SECRET: 's' })).toThrow(
			/^APP_PASSWORD_2 is not set/
		);
		expect(() => readAuthConfig({ APP_PASSWORD: 'hunter2', APP_PASSWORD_2: 'hunter2', SESSION_SECRET: 's' })).toThrow(
			'APP_PASSWORD and APP_PASSWORD_2 must be different'
		);
		for (const input of [
			{ APP_PASSWORD: 'hunter2' },
			{ APP_PASSWORD: 'hunter2', APP_PASSWORD_2: 'hunter2', SESSION_SECRET: 's' }
		]) {
			try {
				readAuthConfig(input);
			} catch (error) {
				expect(String(error)).not.toContain('hunter2');
			}
		}
	});
});

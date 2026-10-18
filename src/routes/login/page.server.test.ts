import { isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it } from 'vitest';
import { TEST_PASSWORD, TEST_PASSWORD_2, TEST_SECRET } from '../../../tests/setup-env';
import { verifySession } from '#lib/server/session.js';
import { loginThrottle } from '#lib/server/throttle.js';
import { actions } from './+page.server';

type Set = { name: string; value: string; options: Record<string, unknown> };

async function login(password: string | null, host = 'localhost:3000') {
	const form = new FormData();
	if (password !== null) form.set('password', password);
	const request = new Request('http://localhost:3000/login', { method: 'POST', body: form, headers: { host } });
	const set: Set[] = [];
	const cookies = { set: (name: string, value: string, options: Record<string, unknown>) => set.push({ name, value, options }) };
	let result: any;
	try {
		result = await actions.default({ request, cookies } as unknown as Parameters<typeof actions.default>[0]);
	} catch (thrown) {
		result = thrown;
	}
	return { result, set };
}

describe('/login', () => {
	beforeEach(() => loginThrottle.reset());

	it('sets a 30-day HttpOnly session cookie for user 1 or user 2 and goes to the list', async () => {
		for (const [pw, expectedUser] of [
			[TEST_PASSWORD, '1'],
			[TEST_PASSWORD_2, '2']
		] as const) {
			const { result, set } = await login(pw);

			expect(isRedirect(result)).toBe(true);
			expect(result).toMatchObject({ status: 303, location: '/' });
			expect(set).toHaveLength(1);
			expect(set[0].name).toBe('session');
			expect(verifySession(set[0].value, TEST_SECRET)).toBe(expectedUser);
			expect(set[0].options).toMatchObject({ path: '/', httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 });
		}
	});

	it.each(['wrong', '', null])('says "Wrong password" and sets no cookie for %j', async (password) => {
		const { result, set } = await login(password);

		expect(result.status).toBe(400);
		expect(result.data).toEqual({ error: 'Wrong password' });
		expect(set).toHaveLength(0);
	});

	it('returns no copy of the password after a failure', async () => {
		const attempt = 'almost ' + TEST_PASSWORD;
		const { result } = await login(attempt);
		expect(JSON.stringify(result.data)).not.toContain(attempt);
		expect(JSON.stringify(result.data)).not.toContain(TEST_PASSWORD);
	});

	it('puts no trace of the password in the cookie', async () => {
		const { set } = await login(TEST_PASSWORD);
		expect(JSON.stringify(set)).not.toContain(TEST_PASSWORD);
	});
});

describe('/login throttle', () => {
	beforeEach(() => loginThrottle.reset());

	it('refuses even the right password after five wrong ones, and sets no cookie', async () => {
		for (let i = 0; i < 5; i++) expect((await login('wrong')).result.status).toBe(400);

		const { result, set } = await login(TEST_PASSWORD);

		expect(result.status).toBe(429);
		expect(result.data).toEqual({ error: 'Too many attempts. Try again later.' });
		expect(set).toHaveLength(0);
	});

	it('logs in after four wrong passwords', async () => {
		for (let i = 0; i < 4; i++) await login('wrong');
		expect((await login(TEST_PASSWORD)).result).toMatchObject({ status: 303, location: '/' });
	});
});

describe('/login Secure flag', () => {
	beforeEach(() => loginThrottle.reset());

	it('marks the cookie Secure for the public host', async () => {
		const { set } = await login(TEST_PASSWORD, 'books.teleosis.ai');
		expect(set[0].options).toMatchObject({ secure: true, httpOnly: true, sameSite: 'lax' });
	});

	it.each(['localhost:3000', 'localhost', '127.0.0.1:3000'])('leaves Secure off for %s', async (host) => {
		const { set } = await login(TEST_PASSWORD, host);
		expect(set[0].options).toMatchObject({ secure: false });
	});
});

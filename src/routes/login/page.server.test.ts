import { isRedirect } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { TEST_PASSWORD, TEST_SECRET } from '../../../tests/setup-env';
import { verifySession } from '#lib/server/session.js';
import { actions } from './+page.server';

type Set = { name: string; value: string; options: Record<string, unknown> };

async function login(password: string | null) {
	const form = new FormData();
	if (password !== null) form.set('password', password);
	const request = new Request('http://localhost:3000/login', { method: 'POST', body: form });
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
	it('sets a 30-day HttpOnly session cookie and goes to the list for the right password', async () => {
		const { result, set } = await login(TEST_PASSWORD);

		expect(isRedirect(result)).toBe(true);
		expect(result).toMatchObject({ status: 303, location: '/' });
		expect(set).toHaveLength(1);
		expect(set[0].name).toBe('session');
		expect(verifySession(set[0].value, TEST_SECRET)).toBe(true);
		expect(set[0].options).toMatchObject({ path: '/', httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 });
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

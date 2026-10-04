import { describe, expect, it, vi } from 'vitest';
import { TEST_SECRET } from '../tests/setup-env';
import { signSession } from '#lib/server/session.js';
import { handle, init } from './hooks.server';

function call(path: string, { method = 'GET', cookie }: { method?: string; cookie?: string } = {}) {
	const url = new URL(path, 'http://localhost:3000');
	const resolve = vi.fn(async () => new Response('page'));
	const event = {
		url,
		request: new Request(url, { method }),
		cookies: { get: (name: string) => (name === 'session' ? cookie : undefined) }
	};
	const response = handle({ event, resolve } as unknown as Parameters<typeof handle>[0]) as Promise<Response>;
	return { response, resolve };
}

describe('the password gate', () => {
	it.each(['/', '/import', '/queue', '/?genre=sf'])('sends %s to /login with no session', async (path) => {
		const { response, resolve } = call(path);
		const res = await response;
		expect(res.status).toBe(303);
		expect(res.headers.get('location')).toBe('/login');
		expect(resolve).not.toHaveBeenCalled();
	});

	it.each(['/?/mark', '/?/refresh', '/import'])('runs no form action for a POST to %s with no session', async (path) => {
		const { response, resolve } = call(path, { method: 'POST' });
		expect((await response).status).toBe(303);
		expect(resolve).not.toHaveBeenCalled();
	});

	it('lets /login through with no session', async () => {
		const { response, resolve } = call('/login', { method: 'POST' });
		expect(await (await response).text()).toBe('page');
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('lets a page through with a valid session', async () => {
		const { response } = call('/queue', { cookie: signSession(TEST_SECRET) });
		expect((await response).status).toBe(200);
	});

	it('sends a forged or expired session to /login', async () => {
		for (const cookie of [signSession('another secret'), signSession(TEST_SECRET, Date.now() - 31 * 86_400_000)]) {
			const { response } = call('/', { cookie });
			expect((await response).status).toBe(303);
		}
	});

	it('does not treat a path that only starts with /login as public', async () => {
		const { response } = call('/loginx');
		expect((await response).status).toBe(303);
	});
});

describe('server start', () => {
	it('starts when the password and the secret are set', async () => {
		await expect(Promise.resolve(init())).resolves.toBeUndefined();
	});
});

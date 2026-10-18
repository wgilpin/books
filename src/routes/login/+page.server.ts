import { fail, redirect } from '@sveltejs/kit';
import { loginThrottle } from '#lib/server/throttle.js';
import { matchPassword, readAuthConfig, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from '#lib/server/session.js';
import type { Actions } from './$types';

/** True for the Mac's own addresses, with or without a port. */
const isLocal = (host: string | null) => /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host ?? '');

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		// A locked login checks nothing, so it says nothing about the password.
		if (loginThrottle.locked()) return fail(429, { error: 'Too many attempts. Try again later.' });

		const given = (await request.formData()).get('password');
		const config = readAuthConfig();
		const user = typeof given === 'string' ? matchPassword(given, config) : null;
		// Return the error text only, never the submitted fields.
		if (!user) {
			loginThrottle.fail();
			return fail(400, { error: 'Wrong password' });
		}
		loginThrottle.succeed();

		cookies.set(SESSION_COOKIE, signSession(config.secret, Date.now(), user), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			// The tunnel talks plain http to the app, so follow the Host, not the protocol.
			// Safari drops a Secure cookie on http://localhost, so localhost goes without.
			secure: !isLocal(request.headers.get('host')),
			maxAge: SESSION_MAX_AGE
		});
		redirect(303, '/');
	}
};

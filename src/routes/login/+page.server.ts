import { fail, redirect } from '@sveltejs/kit';
import { loginThrottle } from '#lib/server/throttle.js';
import { checkPassword, readAuthConfig, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from '#lib/server/session.js';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		// A locked login checks nothing, so it says nothing about the password.
		if (loginThrottle.locked()) return fail(429, { error: 'Too many attempts. Try again later.' });

		const given = (await request.formData()).get('password');
		const { password, secret } = readAuthConfig();
		// Return the error text only, never the submitted fields.
		if (typeof given !== 'string' || !checkPassword(given, password)) {
			loginThrottle.fail();
			return fail(400, { error: 'Wrong password' });
		}
		loginThrottle.succeed();

		cookies.set(SESSION_COOKIE, signSession(secret), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			// Safari drops a Secure cookie on http://localhost. Epic 03 turns it on for the public host.
			secure: false,
			maxAge: SESSION_MAX_AGE
		});
		redirect(303, '/');
	}
};

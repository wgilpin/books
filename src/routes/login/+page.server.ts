import { fail, redirect } from '@sveltejs/kit';
import { checkPassword, readAuthConfig, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from '#lib/server/session.js';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const given = (await request.formData()).get('password');
		const { password, secret } = readAuthConfig();
		// Return the error text only, never the submitted fields.
		if (typeof given !== 'string' || !checkPassword(given, password)) return fail(400, { error: 'Wrong password' });

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

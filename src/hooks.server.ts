import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { readAuthConfig, SESSION_COOKIE, verifySession } from '#lib/server/session.js';

/** Fail closed: the server does not start without a password and a secret. */
export const init: ServerInit = () => {
	readAuthConfig();
};

const isPublic = (path: string) => path === '/login' || path.startsWith('/_app/');

/** Every route except /login needs a session. A form post with no session runs no action. */
export const handle: Handle = async ({ event, resolve }) => {
	const user = verifySession(event.cookies.get(SESSION_COOKIE), readAuthConfig().secret);
	if (user) {
		event.locals.user = user;
		return resolve(event);
	}
	if (isPublic(event.url.pathname)) return resolve(event);
	return new Response(null, { status: 303, headers: { location: '/login' } });
};

import { defineEnvVars } from '@sveltejs/kit/env';

// Server-only and read when the app starts. The schemas let a value be missing, because
// `vite build` also validates them and the build must never need the password.
// `init` in hooks.server.ts refuses to start the server without them.
const optional = (value: string | undefined) => value;

export const variables = defineEnvVars({
	APP_PASSWORD: { schema: optional, description: 'The first login password.' },
	APP_PASSWORD_2: { schema: optional, description: 'The second login password.' },
	SESSION_SECRET: { schema: optional, description: 'Signs the session cookie.' }
});

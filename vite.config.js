import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { LOCAL_ORIGIN, PUBLIC_ORIGIN } from './origins.js';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter(),
			// Trusted origin for form CSRF checks, set at build time. Localhost posts are trusted too.
			paths: { origin: process.env.APP_ORIGIN ?? PUBLIC_ORIGIN },
			csrf: { trustedOrigins: [LOCAL_ORIGIN] }
		})
	],
	test: {
		include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'tests/**/*.test.ts'],
		environment: 'node',
		setupFiles: ['tests/setup-env.ts'],
		// Tests run on a dedicated in-memory database, never the live file.
		env: { DATABASE_PATH: ':memory:' }
	}
});
